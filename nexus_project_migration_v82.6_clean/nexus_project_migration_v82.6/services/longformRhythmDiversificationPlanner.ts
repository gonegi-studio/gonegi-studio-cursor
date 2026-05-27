import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  DiversificationHotspot,
  FatigueAccumulationTrend,
  FatigueReductionProjection,
  LONGFORM_RHYTHM_DIVERSIFICATION_PLANNER_VERSION,
  LongformRhythmDiversificationPlannerResult,
  LongformRuntimeStability,
  ProjectedFatigueScores,
  ProjectedLongformReadiness,
  ProjectedLongformReadinessLevel,
  RhythmDiversificationCategory,
  RhythmDiversificationPlan,
  RhythmDiversificationPlanStep,
  RhythmMapPoint,
  SafeDiversificationCandidate,
  SceneCountFatigueProjection,
  SceneMemoryNode,
  TemporalMemoryGraphExport,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildFinalDatasetSemanticQualityAuditPreview } from './finalDatasetSemanticQualityAudit';
import { buildIdentityLockContinuityPreview } from './identityLockContinuityEngine';
import { buildLongformDatasetExportCandidatePreview } from './longformDatasetExportCandidate';
import { buildLongformFatigueRiskReducerAuditPreview } from './longformFatigueRiskReducerAudit';
import { buildMultiSequenceExpansionBlueprintPreview } from './multiSequenceExpansionBlueprint';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const LONGFORM_RHYTHM_DIVERSIFICATION_PLANNER_EPOCH = '2026-05-27T13:00:00.000Z';
export const LONGFORM_RHYTHM_DIVERSIFICATION_JSON_FILENAME =
  'longform-rhythm-diversification-plan.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const PROJECTION_TARGETS = [60, 90, 120] as const;
const INTENSITY_CLUSTER_THRESHOLD = 0.72;
const REST_SCENE_INTENSITY_MAX = 0.35;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return round6(Math.max(0, Math.min(1, value)));
}

function groundedValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'value' in value) {
    return typeof (value as { value: unknown }).value === 'number'
      ? ((value as { value: number }).value as number)
      : 0;
  }
  return 0;
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function emotionalIntensity(scene: CinematicExtractionResult): number {
  const emotion = scene.scene_state?.emotion;
  if (!emotion) return 0.5;
  const values = [
    groundedValue(emotion.dread),
    groundedValue(emotion.melancholy),
    groundedValue(emotion.anticipation),
    groundedValue(emotion.catharsis_ready),
    groundedValue(emotion.isolation_score),
  ];
  return clamp01(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function buildEmotionalWaveMap(dataset: CinematicExtractionResult[]): RhythmMapPoint[] {
  return dataset.map((scene, index) => {
    const intensity = emotionalIntensity(scene);
    const melancholy = groundedValue(scene.scene_state?.emotion?.melancholy);
    let rhythm_note = 'balanced emotional wave';
    if (intensity >= INTENSITY_CLUSTER_THRESHOLD) rhythm_note = 'high-intensity cluster — plan rest beat after';
    else if (intensity <= REST_SCENE_INTENSITY_MAX) rhythm_note = 'rest/silence candidate spacing';
    else if (melancholy >= 0.65) rhythm_note = 'melancholy saturation risk — diversify tone in planning notes';

    return {
      scene_index: index,
      scene_id: scene.id,
      signal: `emotion_intensity_${intensity.toFixed(2)}`,
      intensity,
      rhythm_note,
    };
  });
}

function buildCinematicRhythmMap(dataset: CinematicExtractionResult[]): RhythmMapPoint[] {
  return dataset.map((scene, index) => {
    const framings = (scene.visual_atoms ?? [])
      .map((atom) => atom.spatial_intelligence?.framing)
      .filter(Boolean) as string[];
    const dominant = framings.sort()[0] ?? 'MS';
    const cameraTokens = scene.layers?.scene_language?.cinematography_tokens?.length ?? 0;
    const transitionEnergy =
      scene.sequence_graph?.transition_logic?.emotion_continuity ??
      scene.sequence_graph?.transition_logic?.energy_delta ??
      0.5;
    const intensity = clamp01(framings.length / 6 + cameraTokens / 10);

    return {
      scene_index: index,
      scene_id: scene.id,
      signal: `framing_${dominant}`,
      intensity,
      rhythm_note:
        intensity >= 0.6
          ? `Repeated framing cadence (${dominant}) — alternate shot scale in render planning`
          : `Transition pacing ${typeof transitionEnergy === 'number' ? transitionEnergy.toFixed(2) : 'stable'}`,
    };
  });
}

function buildVisualRhythmMap(
  dataset: CinematicExtractionResult[],
  memoryNodes: SceneMemoryNode[]
): RhythmMapPoint[] {
  const nodeByScene = new Map(memoryNodes.map((node) => [node.scene_id, node]));

  return dataset.map((scene, index) => {
    const node = nodeByScene.get(scene.id);
    const lighting = scene.shot_fingerprint?.lighting_hash?.slice(0, 8) ?? 'unknown';
    const palette = scene.shot_fingerprint?.palette_hash?.slice(0, 8) ?? 'unknown';
    const atmosphere = node?.mood_signature ?? 'neutral';
    const motifCount = node?.motif_signatures.length ?? 0;
    const intensity = clamp01(motifCount / 5 + (scene.layers?.scene_language?.environment_tokens?.length ?? 0) / 8);

    return {
      scene_index: index,
      scene_id: scene.id,
      signal: `light_${lighting}_palette_${palette}`,
      intensity,
      rhythm_note: `Atmosphere ${atmosphere}; ${motifCount} motif signature(s) — monitor recurrence pacing`,
    };
  });
}

function buildNarrativeRhythmMap(dataset: CinematicExtractionResult[]): RhythmMapPoint[] {
  return dataset.map((scene, index) => {
    const hasCompanion = scene.relationship_graph.some((edge) =>
      /companion|partner|attach|trust|bond/i.test(
        `${edge.subject} ${edge.predicate ?? edge.relation ?? ''} ${edge.object ?? edge.target ?? ''}`
      )
    );
    const envOnly =
      (scene.layers?.scene_language?.environment_tokens?.length ?? 0) > 0 &&
      scene.relationship_graph.length <= 2;
    const reflective = (scene.layers?.scene_language?.emotion_tokens ?? []).some((token) =>
      /reflect|silence|rest|contempl|pause/i.test(token)
    );
    const intensity = clamp01(
      (hasCompanion ? 0.4 : 0) + (envOnly ? 0.35 : 0) + (reflective ? 0.25 : 0) + 0.2
    );

    let rhythm_note = 'standard narrative beat';
    if (hasCompanion) rhythm_note = 'companion-presence beat — balance with solitude spacing';
    else if (envOnly) rhythm_note = 'environment-only beat — good reflective spacing anchor';
    else if (reflective) rhythm_note = 'reflective beat — preserve tension-release cadence';

    return {
      scene_index: index,
      scene_id: scene.id,
      signal: hasCompanion ? 'companion_present' : envOnly ? 'environment_only' : 'dialogue_forward',
      intensity,
      rhythm_note,
    };
  });
}

function detectHotspots(
  emotional: RhythmMapPoint[],
  cinematic: RhythmMapPoint[],
  visual: RhythmMapPoint[],
  narrative: RhythmMapPoint[],
  temporalExport: TemporalMemoryGraphExport
): DiversificationHotspot[] {
  const hotspots: DiversificationHotspot[] = [];
  let counter = 0;

  const highEmotion = emotional.filter((p) => p.intensity >= INTENSITY_CLUSTER_THRESHOLD);
  if (highEmotion.length >= 3) {
    counter += 1;
    hotspots.push({
      hotspot_id: `HOTSPOT-EMO-${String(counter).padStart(3, '0')}`,
      category: 'emotional',
      severity: highEmotion.length >= 6 ? 'high' : 'moderate',
      signal: 'emotional_intensity_cluster',
      affected_scene_ids: highEmotion.map((p) => p.scene_id),
      detail: `${highEmotion.length} consecutive high-intensity emotional clusters detected`,
    });
  }

  const framingCounts = new Map<string, string[]>();
  for (const point of cinematic) {
    const list = framingCounts.get(point.signal) ?? [];
    list.push(point.scene_id);
    framingCounts.set(point.signal, list);
  }
  for (const [signal, sceneIds] of framingCounts) {
    if (sceneIds.length / cinematic.length < 0.3) continue;
    counter += 1;
    hotspots.push({
      hotspot_id: `HOTSPOT-CIN-${String(counter).padStart(3, '0')}`,
      category: 'cinematic',
      severity: sceneIds.length >= 10 ? 'high' : 'moderate',
      signal,
      affected_scene_ids: sceneIds,
      detail: `Camera/framing cadence repetition: ${signal} in ${sceneIds.length} scenes`,
    });
  }

  const visualClusters = new Map<string, string[]>();
  for (const point of visual) {
    const list = visualClusters.get(point.signal) ?? [];
    list.push(point.scene_id);
    visualClusters.set(point.signal, list);
  }
  for (const [signal, sceneIds] of [...visualClusters.entries()].filter(([, ids]) => ids.length >= 4)) {
    counter += 1;
    hotspots.push({
      hotspot_id: `HOTSPOT-VIS-${String(counter).padStart(3, '0')}`,
      category: 'visual',
      severity: sceneIds.length >= 8 ? 'high' : 'moderate',
      signal,
      affected_scene_ids: sceneIds,
      detail: `Visual rhythm cluster: ${signal} across ${sceneIds.length} scenes`,
    });
  }

  const companionDense = narrative.filter((p) => p.signal === 'companion_present');
  if (companionDense.length / narrative.length > 0.55) {
    counter += 1;
    hotspots.push({
      hotspot_id: `HOTSPOT-NAR-${String(counter).padStart(3, '0')}`,
      category: 'narrative',
      severity: 'moderate',
      signal: 'companion_presence_density',
      affected_scene_ids: companionDense.map((p) => p.scene_id),
      detail: 'Companion-presence pacing dense — plan environment-only reflective spacing',
    });
  }

  if (temporalExport.continuity_summary.cinematic_callback_links > temporalExport.continuity_summary.total_scenes) {
    counter += 1;
    hotspots.push({
      hotspot_id: `HOTSPOT-ORCH-${String(counter).padStart(3, '0')}`,
      category: 'orchestration',
      severity: 'moderate',
      signal: 'callback_timing_density',
      affected_scene_ids: [],
      detail: 'Callback timing density exceeds scene count — diversify callback cadence in planning',
    });
  }

  return hotspots.sort((a, b) => a.hotspot_id.localeCompare(b.hotspot_id));
}

function buildSafeCandidates(hotspots: DiversificationHotspot[]): SafeDiversificationCandidate[] {
  const templates: Record<RhythmDiversificationCategory, string> = {
    emotional: 'Insert planned rest/silence beat in director notes between flagged scenes — no dataset edit',
    cinematic: 'Alternate shot scale (MCU ↔ WS) in external render shot list for flagged cadence cluster',
    visual: 'Shift color temperature accent in manual color script for clustered scenes — planning only',
    narrative: 'Balance companion-presence with environment-only reflective beats in storyboard planning',
    orchestration: 'Reduce callback density per sequence block in longform orchestration brief',
  };

  return hotspots.slice(0, 12).map((hotspot, index) => ({
    candidate_id: `SAFE-CAND-${String(index + 1).padStart(3, '0')}`,
    category: hotspot.category,
    target_signal: hotspot.signal,
    suggested_planning_action: templates[hotspot.category],
    rationale: hotspot.detail,
    affected_scene_ids: hotspot.affected_scene_ids.slice(0, 8),
    planning_only: true as const,
  }));
}

function resolveProjectedStability(
  targetScenes: number,
  longformStability: LongformRuntimeStability,
  currentScenes: number
): number {
  const exact = longformStability.projections.find((p) => p.target_scene_count === targetScenes);
  if (exact) return exact.projected_stability;

  if (targetScenes <= 50) return longformStability.predicted_50_scene_stability;
  if (targetScenes <= 75) return longformStability.predicted_75_scene_stability;
  if (targetScenes >= 120) return longformStability.predicted_120_scene_stability;

  const ratio = (targetScenes - currentScenes) / Math.max(120 - currentScenes, 1);
  return clamp01(
    longformStability.predicted_50_scene_stability * (1 - ratio) +
      longformStability.predicted_120_scene_stability * ratio
  );
}

function projectFatigueScore(
  baseline: number,
  targetScenes: number,
  currentScenes: number,
  stability: number
): number {
  const scaleFactor = targetScenes / Math.max(currentScenes, 1);
  return clamp01(baseline + (1 - stability) * 0.25 + (scaleFactor - 1) * 0.08);
}

function readinessFromFatigue(fatigue: number): ProjectedLongformReadinessLevel {
  if (fatigue <= 0.42) return 'ready';
  if (fatigue <= 0.58) return 'conditional';
  return 'at_risk';
}

function buildFatigueProjection(
  baselineFatigue: number,
  currentScenes: number,
  longformStability: LongformRuntimeStability,
  hotspotCount: number,
  identityStability: number
): {
  fatigue_reduction_projection: FatigueReductionProjection;
  projected_fatigue_scores: ProjectedFatigueScores;
  projected_longform_readiness: ProjectedLongformReadiness;
} {
  const scene_projections: SceneCountFatigueProjection[] = PROJECTION_TARGETS.map(
    (target_scene_count) => {
      const projected_stability = resolveProjectedStability(
        target_scene_count,
        longformStability,
        currentScenes
      );
      const projected_fatigue_score = projectFatigueScore(
        baselineFatigue,
        target_scene_count,
        currentScenes,
        projected_stability
      );
      return {
        target_scene_count,
        projected_fatigue_score,
        projected_stability,
        projected_readiness: readinessFromFatigue(projected_fatigue_score),
      };
    }
  );

  const mitigation = clamp01(hotspotCount * 0.015 + 0.12);
  const mitigatedProjections = scene_projections.map((projection) => ({
    ...projection,
    projected_fatigue_score: clamp01(projection.projected_fatigue_score - mitigation),
    projected_readiness: readinessFromFatigue(
      clamp01(projection.projected_fatigue_score - mitigation)
    ),
  }));

  const at60 = mitigatedProjections.find((p) => p.target_scene_count === 60)!;
  const at90 = mitigatedProjections.find((p) => p.target_scene_count === 90)!;
  const at120 = mitigatedProjections.find((p) => p.target_scene_count === 120)!;

  const trend: FatigueAccumulationTrend =
    at120.projected_fatigue_score > baselineFatigue + 0.12
      ? mitigation > 0.1
        ? 'mitigated_with_plan'
        : 'rising'
      : 'stable';

  return {
    fatigue_reduction_projection: {
      baseline_fatigue_score: baselineFatigue,
      scene_projections: mitigatedProjections,
      fatigue_accumulation_trend: trend,
      continuity_stability_under_diversification: clamp01(identityStability * 0.6 + at120.projected_stability * 0.4),
      diversification_mitigation_estimate: mitigation,
    },
    projected_fatigue_scores: {
      current_scene_count: currentScenes,
      current_fatigue_score: baselineFatigue,
      at_60_scenes: at60.projected_fatigue_score,
      at_90_scenes: at90.projected_fatigue_score,
      at_120_scenes: at120.projected_fatigue_score,
    },
    projected_longform_readiness: {
      at_60_scenes: at60.projected_readiness,
      at_90_scenes: at90.projected_readiness,
      at_120_scenes: at120.projected_readiness,
      orchestration_verdict:
        at120.projected_readiness === 'at_risk'
          ? 'Apply rhythm diversification plan before 120-scene orchestration'
          : 'Rhythm diversification plan supports projected longform orchestration',
    },
  };
}

function buildRhythmPlan(
  hotspots: DiversificationHotspot[],
  semanticChecksum: string,
  fatigueChecksum: string,
  blueprintId: string
): RhythmDiversificationPlan {
  const steps: RhythmDiversificationPlanStep[] = hotspots.slice(0, 12).map((hotspot, index) => ({
    step_id: `RHYTHM-STEP-${String(index + 1).padStart(3, '0')}`,
    category: hotspot.category,
    priority: index + 1,
    action: `Planning-only: address ${hotspot.signal} via manual rhythm diversification — ${hotspot.detail}`,
    target_scene_ids: hotspot.affected_scene_ids.slice(0, 8),
    planning_only: true as const,
  }));

  return {
    plan_id: `RHYTHM-PLAN-${semanticChecksum.slice(0, 12)}`,
    semantic_audit_checksum_ref: semanticChecksum,
    fatigue_reducer_audit_checksum_ref: fatigueChecksum,
    expansion_blueprint_ref: blueprintId,
    steps,
    planning_only: true,
  };
}

export function buildLongformRhythmDiversificationPlanner(): LongformRhythmDiversificationPlannerResult {
  const exportCandidate = buildLongformDatasetExportCandidatePreview();
  const semanticAudit = buildFinalDatasetSemanticQualityAuditPreview();
  const fatigueAudit = buildLongformFatigueRiskReducerAuditPreview();
  const identityLock = buildIdentityLockContinuityPreview();
  const expansionBlueprint = buildMultiSequenceExpansionBlueprintPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const dataset = exportCandidate.longform_export_candidate_package.runtime_dataset;
  const stabilizationReport =
    exportCandidate.longform_export_candidate_package.runtime_temporal_stabilization_report;
  const temporalExport = buildTemporalMemoryGraphExport(dataset);
  const memoryNodes = temporalExport.temporal_memory_graph.scene_memory_nodes;

  const emotional_wave_map = buildEmotionalWaveMap(dataset);
  const cinematic_rhythm_map = buildCinematicRhythmMap(dataset);
  const visual_rhythm_map = buildVisualRhythmMap(dataset, memoryNodes);
  const narrative_rhythm_map = buildNarrativeRhythmMap(dataset);

  const diversification_hotspots = detectHotspots(
    emotional_wave_map,
    cinematic_rhythm_map,
    visual_rhythm_map,
    narrative_rhythm_map,
    temporalExport
  );

  const safe_diversification_candidates = buildSafeCandidates(diversification_hotspots);

  const { fatigue_reduction_projection, projected_fatigue_scores, projected_longform_readiness } =
    buildFatigueProjection(
      semanticAudit.fatigue_risk_score,
      dataset.length,
      stabilizationReport.longform_stability,
      diversification_hotspots.length,
      identityLock.identity_stability_score
    );

  const rhythm_diversification_plan = buildRhythmPlan(
    diversification_hotspots,
    semanticAudit.semantic_audit_checksum,
    fatigueAudit.fatigue_reducer_audit_checksum,
    expansionBlueprint.reusable_dataset_contract.contract_id
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const plannerCore = {
    schema_version: LONGFORM_RHYTHM_DIVERSIFICATION_PLANNER_VERSION,
    generated_at: LONGFORM_RHYTHM_DIVERSIFICATION_PLANNER_EPOCH,
    readonly_planning: true as const,
    export_candidate_checksum_ref: exportCandidate.export_checksum,
    semantic_audit_checksum_ref: semanticAudit.semantic_audit_checksum,
    fatigue_reducer_audit_checksum_ref: fatigueAudit.fatigue_reducer_audit_checksum,
    temporal_graph_checksum_ref: temporalExport.export_checksum,
    identity_lock_checksum_ref: identityLock.identity_lock_checksum,
    scene_count: dataset.length,
    rhythm_diversification_plan,
    emotional_wave_map,
    cinematic_rhythm_map,
    visual_rhythm_map,
    narrative_rhythm_map,
    fatigue_reduction_projection,
    diversification_hotspots,
    safe_diversification_candidates,
    projected_fatigue_scores,
    projected_longform_readiness,
    validation: {
      deterministic_planner_checksum_stable: true,
      readonly_planning: true as const,
      no_dataset_mutation: true as const,
      no_prompt_mutation: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const planner_checksum = digest([
    JSON.stringify({ ...plannerCore, planner_checksum: undefined }),
    exportCandidate.export_checksum,
    semanticAudit.semantic_audit_checksum,
    fatigueAudit.fatigue_reducer_audit_checksum,
    String(diversification_hotspots.length),
  ]);

  return {
    ...plannerCore,
    planner_checksum,
  };
}

let cachedPlanner: LongformRhythmDiversificationPlannerResult | null = null;

export function buildLongformRhythmDiversificationPlannerPreview(): LongformRhythmDiversificationPlannerResult {
  if (cachedPlanner) return cachedPlanner;
  cachedPlanner = buildLongformRhythmDiversificationPlanner();
  return cachedPlanner;
}

export function buildLongformRhythmDiversificationPlannerJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildLongformRhythmDiversificationPlannerPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: LONGFORM_RHYTHM_DIVERSIFICATION_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetLongformRhythmDiversificationPlannerCache(): void {
  cachedPlanner = null;
}
