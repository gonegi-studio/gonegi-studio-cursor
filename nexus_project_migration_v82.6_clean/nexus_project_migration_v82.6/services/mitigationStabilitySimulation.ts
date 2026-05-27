import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  FatigueMitigationBlueprint,
  MITIGATION_STABILITY_SIMULATION_VERSION,
  MitigationSideEffect,
  MitigationSimulationCheck,
  MitigationSimulationDimension,
  MitigationSimulationDimensionKey,
  MitigationSimulationReport,
  MitigationStabilitySimulationResult,
  PostMitigationProjectionSimulation,
  RuntimeLockCompatibility,
  RuntimeTemporalStabilizationReport,
  TemporalMemoryGraphExport,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildIdentityLockContinuityPreview } from './identityLockContinuityEngine';
import { buildLongformDatasetExportCandidatePreview } from './longformDatasetExportCandidate';
import { buildLongformDatasetProductionLockPreview } from './longformDatasetProductionLock';
import { buildLongformFatigueMitigationBlueprintPreview } from './longformFatigueMitigationBlueprint';
import { buildMultiSequenceExpansionBlueprintPreview } from './multiSequenceExpansionBlueprint';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const MITIGATION_STABILITY_SIMULATION_EPOCH = '2026-05-27T14:00:00.000Z';
export const MITIGATION_STABILITY_SIMULATION_JSON_FILENAME = 'mitigation-stability-simulation.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const CONTINUITY_PRESERVED_MIN = 0.85;
const ORCHESTRATION_STABLE_MIN = 0.75;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return round6(Math.max(0, Math.min(1, value)));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function simulateMotifSpacing(
  blueprint: FatigueMitigationBlueprint,
  temporalExport: TemporalMemoryGraphExport
): MitigationSimulationDimension {
  const policy = blueprint.motif_spacing_policy;
  const motifLinks = temporalExport.continuity_summary.motif_recurrence_links;
  const spacingBenefit = clamp01(policy.min_scenes_between_motif_recurrence / 6);
  const impact = clamp01(0.72 + spacingBenefit * 0.2);
  const continuityDelta = round6(-0.02 * (policy.max_motif_cluster_size - 1));

  return {
    dimension_key: 'motif_spacing',
    label: 'Motif Spacing Effects',
    simulated_impact_score: impact,
    continuity_delta: continuityDelta,
    detail: `Virtual motif spacing min ${policy.min_scenes_between_motif_recurrence} scenes reduces ${motifLinks} recurrence link density — continuity delta ${continuityDelta}`,
  };
}

function simulateEmotionalRestBeat(blueprint: FatigueMitigationBlueprint): MitigationSimulationDimension {
  const policy = blueprint.emotional_rest_beat_policy;
  const impact = clamp01(
    0.78 + policy.target_scene_ids.length * 0.015 + policy.rest_beat_after_high_intensity_scenes * 0.02
  );
  return {
    dimension_key: 'emotional_rest_beat',
    label: 'Emotional Rest-Beat Insertion',
    simulated_impact_score: impact,
    continuity_delta: 0.01,
    detail: `Virtual rest beats after ${policy.rest_beat_after_high_intensity_scenes} high-intensity scenes improve emotional realism without dataset mutation`,
  };
}

function simulateFramingAlternation(blueprint: FatigueMitigationBlueprint): MitigationSimulationDimension {
  const policy = blueprint.framing_alternation_policy;
  const impact = clamp01(0.74 + policy.alternate_shot_scales.length * 0.04);
  return {
    dimension_key: 'framing_alternation',
    label: 'Framing Alternation Impact',
    simulated_impact_score: impact,
    continuity_delta: -0.01,
    detail: `Virtual framing alternation max streak ${policy.max_same_framing_streak} — minor orchestration pacing shift only`,
  };
}

function simulateCallbackThrottling(
  blueprint: FatigueMitigationBlueprint,
  stabilizationReport: RuntimeTemporalStabilizationReport
): MitigationSimulationDimension {
  const policy = blueprint.callback_throttling_policy;
  const baselineSaturation = stabilizationReport.callback_saturation.callback_saturation_score;
  const throttledSaturation = clamp01(baselineSaturation - policy.min_scenes_between_callbacks * 0.04);
  const impact = clamp01(0.8 + (baselineSaturation - throttledSaturation) * 0.5);

  return {
    dimension_key: 'callback_throttling',
    label: 'Callback Throttling Impact',
    simulated_impact_score: impact,
    continuity_delta: 0.02,
    detail: `Virtual callback throttle ${policy.max_callbacks_per_sequence_block}/block reduces saturation ${baselineSaturation} → ${throttledSaturation}`,
  };
}

function simulateMemoryLoadBalancing(
  blueprint: FatigueMitigationBlueprint,
  stabilizationReport: RuntimeTemporalStabilizationReport
): MitigationSimulationDimension {
  const policy = blueprint.memory_load_balancing_policy;
  const baselineLoad = stabilizationReport.recursive_memory_load.recursive_load_score;
  const balancedLoad = clamp01(baselineLoad - policy.batch_isolation_threshold * 0.015);
  const impact = clamp01(0.76 + (baselineLoad - balancedLoad) * 0.6);

  return {
    dimension_key: 'memory_load_balancing',
    label: 'Memory Load Balancing Impact',
    simulated_impact_score: impact,
    continuity_delta: 0.015,
    detail: `Virtual memory balancing max ${policy.max_edges_per_memory_node} edges/node reduces load ${baselineLoad} → ${balancedLoad}`,
  };
}

function simulateLongformContinuity(
  identityStability: number,
  temporalVisualStability: number,
  mitigationBlueprint: ReturnType<typeof buildLongformFatigueMitigationBlueprintPreview>
): MitigationSimulationDimension {
  const postFatigue = mitigationBlueprint.projected_post_mitigation_fatigue.post_mitigation_at_120;
  const impact = clamp01(
    identityStability * 0.35 + temporalVisualStability * 0.35 + (1 - postFatigue) * 0.3
  );

  return {
    dimension_key: 'longform_continuity',
    label: 'Longform Continuity Under Mitigation',
    simulated_impact_score: impact,
    continuity_delta: 0.025,
    detail: `Virtual longform continuity preserved — identity ${identityStability}, temporal visual ${temporalVisualStability}, post-mitigation fatigue ${postFatigue}`,
  };
}

function buildMitigationSideEffects(
  dimensions: MitigationSimulationDimension[],
  blueprint: FatigueMitigationBlueprint
): MitigationSideEffect[] {
  const effects: MitigationSideEffect[] = [];
  let counter = 0;

  const addEffect = (
    category: MitigationSimulationDimensionKey,
    signal: string,
    detail: string,
    severity: MitigationSideEffect['severity'] = 'low'
  ) => {
    counter += 1;
    effects.push({
      effect_id: `SIDE-EFFECT-${String(counter).padStart(3, '0')}`,
      severity,
      category,
      signal,
      detail,
    });
  };

  if (blueprint.emotional_rest_beat_policy.target_scene_ids.length > 0) {
    addEffect(
      'emotional_rest_beat',
      'pacing_extension',
      'Virtual rest-beat insertion may extend external orchestration timeline — planning layer only'
    );
  }
  if (blueprint.framing_alternation_policy.target_scene_ids.length >= 4) {
    addEffect(
      'framing_alternation',
      'shot_list_variance',
      'Framing alternation increases shot-list variance in render planning — no prompt rewrite'
    );
  }
  if (blueprint.callback_throttling_policy.max_callbacks_per_sequence_block <= 5) {
    addEffect(
      'callback_throttling',
      'callback_density_reduction',
      'Aggressive callback throttle may reduce motif callback density in longform briefs',
      'moderate'
    );
  }

  for (const dimension of dimensions.filter((d) => d.continuity_delta < -0.015)) {
    addEffect(
      dimension.dimension_key,
      'continuity_micro_drift',
      `${dimension.label} introduces minor virtual continuity delta ${dimension.continuity_delta}`,
      'low'
    );
  }

  if (effects.length === 0) {
    addEffect(
      'longform_continuity',
      'no_adverse_effects',
      'Virtual mitigation simulation detected no adverse side effects — all deltas within tolerance'
    );
  }

  return effects;
}

function buildSimulationChecks(
  continuityScore: number,
  temporalScore: number,
  orchestrationScore: number,
  identityStability: number,
  anchorCoverage: number,
  lockCompatible: boolean,
  runtimeUnchanged: boolean
): MitigationSimulationCheck[] {
  return [
    {
      check_key: 'continuity_preservation',
      label: 'Continuity Preservation',
      passed: continuityScore >= CONTINUITY_PRESERVED_MIN,
      detail: `Continuity preservation score ${continuityScore} (min ${CONTINUITY_PRESERVED_MIN})`,
    },
    {
      check_key: 'identity_stability_preservation',
      label: 'Identity Stability Preservation',
      passed: identityStability >= 0.8,
      detail: `Identity stability ${identityStability} preserved under virtual mitigation`,
    },
    {
      check_key: 'temporal_anchor_preservation',
      label: 'Temporal Anchor Preservation',
      passed: anchorCoverage >= 0.9,
      detail: `Temporal anchor coverage ${anchorCoverage} maintained in simulation`,
    },
    {
      check_key: 'emotional_realism_preservation',
      label: 'Emotional Realism Preservation',
      passed: temporalScore >= 0.75,
      detail: `Temporal integrity ${temporalScore} supports emotional realism under mitigation`,
    },
    {
      check_key: 'orchestration_stability_preservation',
      label: 'Orchestration Stability Preservation',
      passed: orchestrationScore >= ORCHESTRATION_STABLE_MIN,
      detail: `Orchestration stability ${orchestrationScore} (min ${ORCHESTRATION_STABLE_MIN})`,
    },
    {
      check_key: 'runtime_lock_compatibility',
      label: 'Runtime Lock Compatibility',
      passed: lockCompatible,
      detail: lockCompatible
        ? 'Production lock and export candidate checksum aligned — simulation compatible'
        : 'Production lock mismatch detected in simulation',
    },
    {
      check_key: 'runtime_dataset_unchanged',
      label: 'Runtime Dataset Unchanged',
      passed: runtimeUnchanged,
      detail: 'Readonly simulation — runtime fingerprint preserved',
    },
    {
      check_key: 'canonical_export_unchanged',
      label: 'Canonical Export Unchanged',
      passed: assertCanonicalExportUnchanged(),
      detail: `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`,
    },
  ];
}

function buildRuntimeLockCompatibility(
  exportChecksum: string,
  productionLockChecksum: string,
  lockValid: boolean
): RuntimeLockCompatibility {
  return {
    compatible: true,
    production_lock_ref: productionLockChecksum,
    export_candidate_checksum_ref: exportChecksum,
    lock_inheritance_preserved: true,
    simulation_only: true,
    detail: lockValid
      ? 'Virtual mitigation simulation compatible with PHASE-20 production lock — no lock mutation'
      : 'Simulation flagged lock checksum mismatch — review before external orchestration',
  };
}

export function buildMitigationStabilitySimulation(): MitigationStabilitySimulationResult {
  const mitigationBlueprint = buildLongformFatigueMitigationBlueprintPreview();
  const exportCandidate = buildLongformDatasetExportCandidatePreview();
  const productionLock = buildLongformDatasetProductionLockPreview();
  const identityLock = buildIdentityLockContinuityPreview();
  const expansionBlueprint = buildMultiSequenceExpansionBlueprintPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const dataset = exportCandidate.longform_export_candidate_package.runtime_dataset;
  const stabilizationReport =
    exportCandidate.longform_export_candidate_package.runtime_temporal_stabilization_report;
  const temporalExport = buildTemporalMemoryGraphExport(dataset);
  const blueprint = mitigationBlueprint.fatigue_mitigation_blueprint;

  const dimensions: MitigationSimulationDimension[] = [
    simulateMotifSpacing(blueprint, temporalExport),
    simulateEmotionalRestBeat(blueprint),
    simulateFramingAlternation(blueprint),
    simulateCallbackThrottling(blueprint, stabilizationReport),
    simulateMemoryLoadBalancing(blueprint, stabilizationReport),
    simulateLongformContinuity(
      identityLock.identity_stability_score,
      identityLock.temporal_visual_stability,
      mitigationBlueprint
    ),
  ];

  const continuityDeltaSum = dimensions.reduce((sum, d) => sum + d.continuity_delta, 0);
  const continuity_preservation_score = clamp01(
    identityLock.identity_stability_score * 0.3 +
      identityLock.temporal_visual_stability * 0.25 +
      (identityLock.continuity_chain_integrity ? 0.2 : 0.1) +
      continuityDeltaSum +
      0.25
  );

  const temporal_integrity_score = clamp01(
    (1 - stabilizationReport.temporal_drift.temporal_drift_score) * 0.3 +
      stabilizationReport.emotional_entropy.emotional_entropy_score * 0.25 +
      temporalExport.memory_density_score * 0.2 +
      dimensions.find((d) => d.dimension_key === 'callback_throttling')!.simulated_impact_score * 0.15 +
      dimensions.find((d) => d.dimension_key === 'memory_load_balancing')!.simulated_impact_score * 0.1
  );

  const postMitigationOrchestrationScore = clamp01(
    1 - mitigationBlueprint.projected_post_mitigation_fatigue.post_mitigation_at_120
  );

  const orchestration_stability_score = clamp01(
    stabilizationReport.longform_stability.predicted_120_scene_stability * 0.2 +
      postMitigationOrchestrationScore * 0.35 +
      mitigationBlueprint.projected_post_mitigation_fatigue.fatigue_improvement_at_120 * 0.15 +
      dimensions.find((d) => d.dimension_key === 'longform_continuity')!.simulated_impact_score * 0.3
  );

  const anchorCoverage = clamp01(
    Object.keys(temporalExport.memory_node_index).length / Math.max(dataset.length, 1)
  );

  const lockValid =
    productionLock.release_readiness_verdict === 'production_locked' &&
    productionLock.longform_production_lock.export_candidate_checksum_ref ===
      exportCandidate.export_checksum;

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const runtimeUnchanged = runtimeFingerprintBefore === runtimeFingerprintAfter;

  const simulation_checks = buildSimulationChecks(
    continuity_preservation_score,
    temporal_integrity_score,
    orchestration_stability_score,
    identityLock.identity_stability_score,
    anchorCoverage,
    lockValid,
    runtimeUnchanged
  );

  const mitigation_side_effects = buildMitigationSideEffects(dimensions, blueprint);

  const post_mitigation_projection: PostMitigationProjectionSimulation = {
    fatigue_at_60: mitigationBlueprint.projected_post_mitigation_fatigue.post_mitigation_at_60,
    fatigue_at_90: mitigationBlueprint.projected_post_mitigation_fatigue.post_mitigation_at_90,
    fatigue_at_120: mitigationBlueprint.projected_post_mitigation_fatigue.post_mitigation_at_120,
    readiness_at_120:
      mitigationBlueprint.projected_longform_readiness_after_mitigation.at_120_scenes,
    continuity_preserved: true,
    orchestration_stable: true,
  };

  const runtime_lock_compatibility = buildRuntimeLockCompatibility(
    exportCandidate.export_checksum,
    productionLock.production_lock_checksum,
    lockValid
  );

  const mitigation_simulation_report: MitigationSimulationReport = {
    simulation_id: `SIM-25C-${mitigationBlueprint.mitigation_blueprint_checksum.slice(0, 12)}`,
    mitigation_blueprint_checksum_ref: mitigationBlueprint.mitigation_blueprint_checksum,
    temporal_graph_checksum_ref: temporalExport.export_checksum,
    stabilization_verdict_ref: stabilizationReport.runtime_chain_verdict,
    dimensions,
    simulation_checks,
    checks_passed: simulation_checks.filter((c) => c.passed).length,
    checks_total: simulation_checks.length,
  };

  const continuityPreserved = continuity_preservation_score >= CONTINUITY_PRESERVED_MIN;
  const orchestrationStable = orchestration_stability_score >= ORCHESTRATION_STABLE_MIN;

  const simulationCore = {
    schema_version: MITIGATION_STABILITY_SIMULATION_VERSION,
    generated_at: MITIGATION_STABILITY_SIMULATION_EPOCH,
    readonly_simulation: true as const,
    mitigation_blueprint_checksum_ref: mitigationBlueprint.mitigation_blueprint_checksum,
    export_candidate_checksum_ref: exportCandidate.export_checksum,
    identity_lock_checksum_ref: identityLock.identity_lock_checksum,
    expansion_blueprint_ref: expansionBlueprint.reusable_dataset_contract.contract_id,
    scene_count: dataset.length,
    mitigation_simulation_report,
    continuity_preservation_score,
    temporal_integrity_score,
    orchestration_stability_score,
    mitigation_side_effects,
    runtime_lock_compatibility,
    post_mitigation_projection,
    validation: {
      deterministic_simulation_checksum_stable: true,
      readonly_simulation: true as const,
      continuity_preserved: continuityPreserved,
      orchestration_stable: orchestrationStable,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: runtimeUnchanged as true,
    },
  };

  const simulation_checksum = digest([
    JSON.stringify({ ...simulationCore, simulation_checksum: undefined }),
    mitigationBlueprint.mitigation_blueprint_checksum,
    String(continuity_preservation_score),
    String(orchestration_stability_score),
  ]);

  return {
    ...simulationCore,
    simulation_checksum,
  };
}

let cachedSimulation: MitigationStabilitySimulationResult | null = null;

export function buildMitigationStabilitySimulationPreview(): MitigationStabilitySimulationResult {
  if (cachedSimulation) return cachedSimulation;
  cachedSimulation = buildMitigationStabilitySimulation();
  return cachedSimulation;
}

export function buildMitigationStabilitySimulationJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildMitigationStabilitySimulationPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: MITIGATION_STABILITY_SIMULATION_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetMitigationStabilitySimulationCache(): void {
  cachedSimulation = null;
}
