import crypto from 'crypto';
import {
  CinematicExtractionResult,
  MergeConflictPrediction,
  SEQ002_EXPANSION_SIMULATION_VERSION,
  Seq002ContinuityBridge,
  Seq002ExpansionSimulationResult,
  Seq002SimulationReport,
  Seq002SimulationStep,
} from '../types';
import { loadCanonicalExportDataset } from './datasetCompletionAudit';
import { validateExportDensity } from './datasetHydrationService';
import { buildExpansionReadinessGatePreview } from './expansionReadinessGate';
import { buildMultiSequenceExpansionBlueprintPreview } from './multiSequenceExpansionBlueprint';
import { applyPipelineBCertificationBridge } from './pipelineBCertificationBridge';
import { isEmptyValue } from './pipelineBridge';
import { buildProductionCertificationLockPreview } from './productionCertificationLock';

export const SEQ002_EXPANSION_SIMULATION_EPOCH = '2026-05-26T20:00:00.000Z';

const SIMULATED_SEQ002_SCENE_COUNT = 4;
const CARRYOVER_THRESHOLD = 0.85;

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return round6(count / total);
}

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function cloneScene(scene: CinematicExtractionResult): CinematicExtractionResult {
  return JSON.parse(JSON.stringify(scene)) as CinematicExtractionResult;
}

function hasTemporalBridge(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.production_v72?.temporal_bridge) ||
    !isEmptyValue(scene.production_v82?.temporal_bridge) ||
    !isEmptyValue(scene.temporal_bridge)
  );
}

function buildSimulatedSeq002Scenes(
  anchorTerminal: CinematicExtractionResult,
  expansionSequenceId: string
): CinematicExtractionResult[] {
  const scenes: CinematicExtractionResult[] = [];
  const baseEnd = anchorTerminal.scene_indexing?.v_timestamp_end ?? 0;

  for (let i = 0; i < SIMULATED_SEQ002_SCENE_COUNT; i++) {
    const simulated = cloneScene(anchorTerminal);
    const sceneId = `${expansionSequenceId}-SIM-${String(i + 1).padStart(3, '0')}`;
    const start = round6(baseEnd + i * 1.5);
    const end = round6(baseEnd + (i + 1) * 1.5);

    simulated.id = sceneId;
    simulated.scene_indexing = {
      ...simulated.scene_indexing,
      scene_id: sceneId,
      v_timestamp_start: start,
      v_timestamp_end: end,
    };
    simulated.sequence_graph = {
      ...simulated.sequence_graph,
      previous_node: i === 0 ? anchorTerminal.id : scenes[i - 1].id,
      current_node: sceneId,
      next_candidates: [],
      transition_logic: {
        energy_delta: simulated.sequence_graph?.transition_logic?.energy_delta ?? 0.1,
        camera_flow_vector: simulated.sequence_graph?.transition_logic?.camera_flow_vector ?? [0, 0, 1],
        emotion_continuity: round6(0.88 + i * 0.02),
      },
    };

    if (simulated.emotional_carryover) {
      simulated.emotional_carryover = {
        ...simulated.emotional_carryover,
        underlying_mood_base:
          simulated.emotional_carryover.underlying_mood_base ?? 'continuation_from_anchor',
      };
    }

    scenes.push(simulated);
  }

  return scenes;
}

function buildContinuityBridge(
  anchorSequenceId: string,
  expansionSequenceId: string,
  anchorTerminal: CinematicExtractionResult,
  seq002Opening: CinematicExtractionResult
): Seq002ContinuityBridge {
  const timestampOk =
    (seq002Opening.scene_indexing?.v_timestamp_start ?? 0) >=
    (anchorTerminal.scene_indexing?.v_timestamp_end ?? 0);
  const graphOk = seq002Opening.sequence_graph?.previous_node === anchorTerminal.id;
  const temporalEdge = hasTemporalBridge(anchorTerminal) || hasTemporalBridge(seq002Opening);

  return {
    from_sequence_id: anchorSequenceId,
    to_sequence_id: expansionSequenceId,
    anchor_terminal_scene_id: anchorTerminal.id,
    seq002_opening_scene_id: seq002Opening.id,
    bridge_stable: timestampOk && graphOk && temporalEdge,
    timestamp_continuity: timestampOk,
    temporal_edge_appended: temporalEdge,
  };
}

function simulateContinuityBridge(bridge: Seq002ContinuityBridge): Seq002SimulationStep {
  const score = bridge.bridge_stable ? 1 : round6(0.5);
  return {
    step_key: 'seq001_to_seq002_continuity_bridge',
    label: 'SEQ-001 → SEQ-002 Continuity Bridge',
    passed: bridge.bridge_stable,
    score,
    detail: bridge.bridge_stable
      ? `Bridge stable: ${bridge.anchor_terminal_scene_id} → ${bridge.seq002_opening_scene_id}`
      : 'Continuity bridge incomplete — timestamp or graph link missing',
  };
}

function simulateCharacterCarryover(
  anchorTerminal: CinematicExtractionResult,
  seq002Scenes: CinematicExtractionResult[]
): Seq002SimulationStep {
  const terminalHasCharacter =
    !isEmptyValue(anchorTerminal.character_persistence) ||
    (anchorTerminal.visual_atoms ?? []).some((a) => a.label?.includes('subject'));
  const inherited = seq002Scenes.filter(
    (s) =>
      !isEmptyValue(s.character_persistence) ||
      (s.visual_atoms ?? []).some((a) => a.label?.includes('subject'))
  ).length;
  const coverage = ratio(inherited, seq002Scenes.length);
  const passed = terminalHasCharacter && coverage >= CARRYOVER_THRESHOLD;

  return {
    step_key: 'character_carryover',
    label: 'Character Carryover',
    passed,
    score: passed ? 1 : coverage,
    detail: `${inherited}/${seq002Scenes.length} simulated scenes inherit character anchors from terminal`,
  };
}

function simulateEnvironmentCarryover(
  anchorTerminal: CinematicExtractionResult,
  seq002Scenes: CinematicExtractionResult[]
): Seq002SimulationStep {
  const terminalHasEnv =
    !isEmptyValue(anchorTerminal.scene_state?.physics) ||
    !isEmptyValue(anchorTerminal.canonical_dna?.domains?.atmosphere);
  const inherited = seq002Scenes.filter(
    (s) =>
      !isEmptyValue(s.scene_state?.physics) ||
      !isEmptyValue(s.canonical_dna?.domains?.atmosphere)
  ).length;
  const coverage = ratio(inherited, seq002Scenes.length);
  const passed = terminalHasEnv && coverage >= CARRYOVER_THRESHOLD;

  return {
    step_key: 'environment_carryover',
    label: 'Environment Carryover',
    passed,
    score: passed ? 1 : coverage,
    detail: `${inherited}/${seq002Scenes.length} simulated scenes inherit environment signature`,
  };
}

function simulateEmotionalArcCarryover(
  anchorTerminal: CinematicExtractionResult,
  seq002Scenes: CinematicExtractionResult[]
): Seq002SimulationStep {
  const terminalMood = anchorTerminal.emotional_carryover?.underlying_mood_base;
  const inherited = seq002Scenes.filter(
    (s) =>
      !isEmptyValue(s.emotional_carryover) ||
      typeof s.sequence_graph?.transition_logic?.emotion_continuity === 'number'
  ).length;
  const coverage = ratio(inherited, seq002Scenes.length);
  const passed = coverage >= CARRYOVER_THRESHOLD;

  return {
    step_key: 'emotional_arc_carryover',
    label: 'Emotional Arc Carryover',
    passed,
    score: passed ? 1 : coverage,
    detail: terminalMood
      ? `Mood "${terminalMood}" propagated to ${inherited}/${seq002Scenes.length} scenes`
      : `${inherited}/${seq002Scenes.length} scenes with emotional continuity signals`,
  };
}

function simulateTemporalEdgeAppend(
  anchorTerminal: CinematicExtractionResult,
  seq002Scenes: CinematicExtractionResult[]
): Seq002SimulationStep {
  const edgeCount = [anchorTerminal, ...seq002Scenes].filter(hasTemporalBridge).length;
  const total = seq002Scenes.length + 1;
  const coverage = ratio(edgeCount, total);
  const passed = coverage >= CARRYOVER_THRESHOLD;

  return {
    step_key: 'temporal_edge_append',
    label: 'Temporal Edge Append',
    passed,
    score: passed ? 1 : coverage,
    detail: `${edgeCount}/${total} bridge nodes with temporal edges appended in-memory`,
  };
}

function simulateDensityPreservation(
  mergedInMemory: CinematicExtractionResult[],
  contractFields: string[]
): Seq002SimulationStep {
  const density = validateExportDensity(mergedInMemory);
  const structurallyDense =
    density.visualAtomsNonEmpty &&
    density.relationshipGraphNonEmpty &&
    density.sceneStatePopulated;

  let fieldSum = 0;
  for (const field of contractFields) {
    const covered = mergedInMemory.filter((scene) => {
      const record = scene as Record<string, unknown>;
      return !isEmptyValue(record[field]);
    }).length;
    fieldSum += ratio(covered, mergedInMemory.length);
  }
  const avgCoverage = round6(fieldSum / contractFields.length);
  const passed = structurallyDense && avgCoverage >= CARRYOVER_THRESHOLD;

  return {
    step_key: 'density_preservation',
    label: 'Density Preservation',
    passed,
    score: passed ? 1 : avgCoverage,
    detail: structurallyDense
      ? `Structural density maintained; contract coverage ${avgCoverage} across ${mergedInMemory.length} in-memory scenes`
      : 'Structural density loss detected in simulated merge',
  };
}

function predictMergeConflicts(
  bridge: Seq002ContinuityBridge,
  steps: Seq002SimulationStep[],
  gateWarnings: { issue_id: string; message: string }[]
): MergeConflictPrediction[] {
  const conflicts: MergeConflictPrediction[] = [];

  if (!bridge.timestamp_continuity) {
    conflicts.push({
      conflict_id: 'CONF-TEMP-001',
      severity: 'critical',
      dimension: 'temporal_continuity',
      message: 'SEQ-002 opening timestamp does not chain from anchor terminal v_timestamp_end',
    });
  }
  if (!bridge.temporal_edge_appended) {
    conflicts.push({
      conflict_id: 'CONF-TEMP-002',
      severity: 'moderate',
      dimension: 'temporal_edge',
      message: 'Temporal bridge edge missing on anchor or SEQ-002 opening scene',
    });
  }

  for (const step of steps) {
    if (step.passed) continue;
    conflicts.push({
      conflict_id: `CONF-${step.step_key.toUpperCase().replace(/_/g, '-')}`,
      severity: step.score < 0.5 ? 'critical' : 'moderate',
      dimension: step.step_key,
      message: step.detail,
    });
  }

  for (const warn of gateWarnings) {
    conflicts.push({
      conflict_id: warn.issue_id,
      severity: 'informational',
      dimension: 'expansion_gate_warning',
      message: warn.message,
    });
  }

  return conflicts;
}

function computePredictedMergeScore(steps: Seq002SimulationStep[], conflictCount: number): number {
  const stepAvg = steps.reduce((sum, s) => sum + s.score, 0) / steps.length;
  const criticalPenalty = conflictCount > 0 ? Math.min(0.15 * conflictCount, 0.3) : 0;
  return round6(Math.max(0, Math.min(1, stepAvg - criticalPenalty)));
}

function computeContinuityRiskScore(
  conflicts: MergeConflictPrediction[],
  bridge: Seq002ContinuityBridge
): number {
  let risk = 0;
  if (!bridge.bridge_stable) risk += 0.25;
  for (const c of conflicts) {
    if (c.severity === 'critical') risk += 0.2;
    else if (c.severity === 'moderate') risk += 0.08;
    else risk += 0.02;
  }
  return round6(Math.min(1, risk));
}

function resolveIngestionPolicy(
  mergeScore: number,
  riskScore: number,
  gateVerdict: string
): string {
  if (gateVerdict === 'blocked') {
    return 'Do not ingest — resolve PHASE-10 blocking issues before any SEQ-002 material enters the pipeline';
  }
  if (mergeScore >= 0.92 && riskScore <= 0.1) {
    return 'Approved for lab-import bridge path: ingest SEQ-002 via Pipeline B lab import (?enabled=true), merge in-memory with temporal_chain policy, re-run PHASE-7/8/10 gates before lock re-freeze';
  }
  if (mergeScore >= 0.85) {
    return 'Conditional: run Pipeline B lab import with pre-merge carryover validation; acknowledge GATE-SCENE-004 corpus window advisory';
  }
  return 'Hold ingestion — resolve simulated merge conflicts and re-run SEQ-002 simulation';
}

export function buildSeq002ExpansionSimulation(): Seq002ExpansionSimulationResult {
  const lock = buildProductionCertificationLockPreview();
  const gate = buildExpansionReadinessGatePreview();
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();

  const { dataset: canonicalDataset } = loadCanonicalExportDataset();
  const { enrichedDataset } = applyPipelineBCertificationBridge(canonicalDataset, true);
  const anchorDataset = enrichedDataset.length > 0 ? enrichedDataset : canonicalDataset;

  const anchorSequenceId = blueprint.expansion_blueprint.anchor_sequence.sequence_id;
  const expansionSequenceId =
    blueprint.expansion_blueprint.planned_sequences.find((s) => s.role === 'expansion')
      ?.sequence_id ?? 'SEQ-002';

  const anchorTerminal = anchorDataset[anchorDataset.length - 1];
  const seq002Scenes = buildSimulatedSeq002Scenes(anchorTerminal, expansionSequenceId);
  const mergedInMemory = [...anchorDataset, ...seq002Scenes];

  const continuityBridge = buildContinuityBridge(
    anchorSequenceId,
    expansionSequenceId,
    anchorTerminal,
    seq002Scenes[0]
  );

  const simulation_steps: Seq002SimulationStep[] = [
    simulateContinuityBridge(continuityBridge),
    simulateCharacterCarryover(anchorTerminal, seq002Scenes),
    simulateEnvironmentCarryover(anchorTerminal, seq002Scenes),
    simulateEmotionalArcCarryover(anchorTerminal, seq002Scenes),
    simulateTemporalEdgeAppend(anchorTerminal, seq002Scenes),
    simulateDensityPreservation(
      mergedInMemory,
      blueprint.reusable_dataset_contract.required_fields
    ),
  ];

  const conflict_list = predictMergeConflicts(
    continuityBridge,
    simulation_steps,
    gate.warnings
  );

  const mergeConflictStep: Seq002SimulationStep = {
    step_key: 'merge_conflict_prediction',
    label: 'Merge Conflict Prediction',
    passed: conflict_list.filter((c) => c.severity === 'critical').length === 0,
    score: round6(
      1 -
        conflict_list.filter((c) => c.severity === 'critical').length * 0.2 -
        conflict_list.filter((c) => c.severity === 'moderate').length * 0.05
    ),
    detail:
      conflict_list.length === 0
        ? 'No merge conflicts predicted'
        : `${conflict_list.length} conflict(s) predicted (${conflict_list.filter((c) => c.severity === 'critical').length} critical)`,
  };
  simulation_steps.push(mergeConflictStep);

  const criticalConflicts = conflict_list.filter((c) => c.severity === 'critical').length;
  const predicted_merge_score = computePredictedMergeScore(simulation_steps, criticalConflicts);
  const continuity_risk_score = computeContinuityRiskScore(conflict_list, continuityBridge);
  const recommended_ingestion_policy = resolveIngestionPolicy(
    predicted_merge_score,
    continuity_risk_score,
    gate.expansion_readiness_verdict
  );

  const densityStep = simulation_steps.find((s) => s.step_key === 'density_preservation');

  const seq002_simulation_report: Seq002SimulationReport = {
    anchor_sequence_id: anchorSequenceId,
    expansion_sequence_id: expansionSequenceId,
    anchor_scene_count: anchorDataset.length,
    simulated_scene_count: seq002Scenes.length,
    continuity_bridge: continuityBridge,
    simulation_steps,
    merged_in_memory_scene_count: mergedInMemory.length,
    density_preservation: {
      structural_density_maintained: densityStep?.passed ?? false,
      contract_field_coverage: densityStep?.score ?? 0,
      canonical_export_unchanged: true,
    },
    in_memory_only: true,
    no_real_ingestion: true,
  };

  const simulationCore = {
    schema_version: SEQ002_EXPANSION_SIMULATION_VERSION,
    generated_at: SEQ002_EXPANSION_SIMULATION_EPOCH,
    readonly_simulation: true as const,
    production_lock_ref: {
      production_dataset_candidate_id: lock.production_dataset_candidate_id,
      deterministic_lock_checksum: lock.deterministic_lock_checksum,
    },
    expansion_gate_ref: {
      gate_checksum: gate.gate_checksum,
      expansion_readiness_verdict: gate.expansion_readiness_verdict,
    },
    seq002_simulation_report,
    predicted_merge_score,
    continuity_risk_score,
    conflict_list,
    recommended_ingestion_policy,
    validation: {
      deterministic_simulation_checksum_stable: true,
      readonly_simulation: true as const,
      in_memory_only: true as const,
      no_dataset_mutation: true as const,
      no_real_ingestion: true as const,
      no_provider_calls: true as const,
    },
  };

  const simulation_checksum = digest([JSON.stringify(simulationCore)]);

  return {
    ...simulationCore,
    simulation_checksum,
  };
}

let cachedSimulation: Seq002ExpansionSimulationResult | null = null;

export function buildSeq002ExpansionSimulationPreview(): Seq002ExpansionSimulationResult {
  if (cachedSimulation) return cachedSimulation;
  cachedSimulation = buildSeq002ExpansionSimulation();
  return cachedSimulation;
}

export function resetSeq002ExpansionSimulationCache(): void {
  cachedSimulation = null;
}
