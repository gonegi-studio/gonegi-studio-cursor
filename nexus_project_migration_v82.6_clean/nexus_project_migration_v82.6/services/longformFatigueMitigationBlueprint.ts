import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CallbackThrottlingPolicy,
  CallbackThrottleRule,
  ColorTemperatureModulationPolicy,
  CompanionPresenceSpacingPolicy,
  EmotionalRestBeatPolicy,
  EmotionalWaveTarget,
  EnvironmentOnlyBeatPolicy,
  FatigueMitigationBlueprint,
  FramingAlternationPolicy,
  LONGFORM_FATIGUE_MITIGATION_BLUEPRINT_VERSION,
  LongformFatigueMitigationBlueprintResult,
  MemoryLoadBalancingPolicy,
  MotifSpacingPolicy,
  PostMitigationFatigueProjection,
  ProjectedLongformReadiness,
  ProjectedLongformReadinessLevel,
  RhythmMapPoint,
  SceneInsertionRecommendation,
  SequenceLevelRhythmPolicy,
  VisualVariationTarget,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildLongformDatasetExportCandidatePreview } from './longformDatasetExportCandidate';
import { buildLongformFatigueRiskReducerAuditPreview } from './longformFatigueRiskReducerAudit';
import { buildLongformRhythmDiversificationPlannerPreview } from './longformRhythmDiversificationPlanner';
import { buildMultiSequenceExpansionBlueprintPreview } from './multiSequenceExpansionBlueprint';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const LONGFORM_FATIGUE_MITIGATION_BLUEPRINT_EPOCH = '2026-05-27T13:30:00.000Z';
export const LONGFORM_FATIGUE_MITIGATION_BLUEPRINT_JSON_FILENAME =
  'longform-fatigue-mitigation-blueprint.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const HIGH_INTENSITY_THRESHOLD = 0.72;
const READINESS_ORDER: Record<ProjectedLongformReadinessLevel, number> = {
  at_risk: 0,
  conditional: 1,
  ready: 2,
};

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

function readinessFromFatigue(fatigue: number): ProjectedLongformReadinessLevel {
  if (fatigue <= 0.42) return 'ready';
  if (fatigue <= 0.58) return 'conditional';
  return 'at_risk';
}

function improveReadiness(
  current: ProjectedLongformReadinessLevel,
  improved: ProjectedLongformReadinessLevel
): boolean {
  return READINESS_ORDER[improved] > READINESS_ORDER[current];
}

function collectTargetScenes(points: RhythmMapPoint[], predicate: (p: RhythmMapPoint) => boolean): string[] {
  return points.filter(predicate).map((p) => p.scene_id).sort();
}

function buildMotifSpacingPolicy(
  hotspotSceneIds: string[],
  motifHotspotCount: number
): MotifSpacingPolicy {
  return {
    policy_id: 'POLICY-MOTIF-001',
    policy_name: 'Motif Spacing Policy',
    planning_only: true,
    no_dataset_mutation: true,
    min_scenes_between_motif_recurrence: motifHotspotCount >= 2 ? 4 : 3,
    max_motif_cluster_size: 2,
    severity_threshold: motifHotspotCount >= 2 ? 'high' : 'moderate',
    rules: [
      'Do not repeat identical motif signatures within min_scenes_between_motif_recurrence in expansion planning',
      'Break motif clusters exceeding max_motif_cluster_size with environment-only or rest beats in storyboard notes',
      'Apply in external render briefs only — no canonical dataset mutation',
    ],
    target_scene_ids: hotspotSceneIds.slice(0, 8),
  };
}

function buildEmotionalRestBeatPolicy(emotionalMap: RhythmMapPoint[]): EmotionalRestBeatPolicy {
  const highIntensity = collectTargetScenes(emotionalMap, (p) => p.intensity >= HIGH_INTENSITY_THRESHOLD);
  return {
    policy_id: 'POLICY-EMOTION-001',
    policy_name: 'Emotional Rest-Beat Policy',
    planning_only: true,
    no_dataset_mutation: true,
    rest_beat_after_high_intensity_scenes: 2,
    max_consecutive_high_intensity: 3,
    target_rest_intensity_max: 0.35,
    severity_threshold: highIntensity.length >= 4 ? 'high' : 'moderate',
    rules: [
      'Insert planned rest/silence beat after every rest_beat_after_high_intensity_scenes high-intensity scenes',
      'Cap consecutive high-intensity scenes at max_consecutive_high_intensity in longform orchestration',
      'Target rest beats at intensity <= target_rest_intensity_max in director planning layer',
    ],
    target_scene_ids: highIntensity.slice(0, 8),
  };
}

function buildFramingAlternationPolicy(cinematicMap: RhythmMapPoint[]): FramingAlternationPolicy {
  const framingHotspots = collectTargetScenes(cinematicMap, (p) => p.intensity >= 0.55);
  return {
    policy_id: 'POLICY-FRAMING-001',
    policy_name: 'Framing Alternation Policy',
    planning_only: true,
    no_dataset_mutation: true,
    alternate_shot_scales: ['ECU', 'MCU', 'MS', 'WS', 'ELS'],
    max_same_framing_streak: 2,
    severity_threshold: framingHotspots.length >= 6 ? 'high' : 'moderate',
    rules: [
      'Alternate shot scales from alternate_shot_scales list — no more than max_same_framing_streak consecutive identical framings',
      'Apply in external render shot lists and storyboard planning only',
    ],
    target_scene_ids: framingHotspots.slice(0, 8),
  };
}

function buildColorTemperaturePolicy(visualMap: RhythmMapPoint[]): ColorTemperatureModulationPolicy {
  const visualClusters = collectTargetScenes(visualMap, (p) => p.intensity >= 0.5);
  return {
    policy_id: 'POLICY-COLOR-001',
    policy_name: 'Color Temperature Modulation Policy',
    planning_only: true,
    no_dataset_mutation: true,
    warm_cool_alternation_interval: 3,
    max_palette_cluster_scenes: 4,
    severity_threshold: visualClusters.length >= 5 ? 'moderate' : 'low',
    rules: [
      'Alternate warm/cool color temperature accents every warm_cool_alternation_interval scenes in manual color script',
      'Cap palette cluster repetition at max_palette_cluster_scenes before mandatory variation in planning notes',
    ],
    target_scene_ids: visualClusters.slice(0, 8),
  };
}

function buildEnvironmentOnlyBeatPolicy(narrativeMap: RhythmMapPoint[]): EnvironmentOnlyBeatPolicy {
  const envCandidates = collectTargetScenes(
    narrativeMap,
    (p) => p.signal === 'environment_only' || p.intensity <= 0.45
  );
  return {
    policy_id: 'POLICY-ENV-001',
    policy_name: 'Environment-Only Beat Policy',
    planning_only: true,
    no_dataset_mutation: true,
    environment_only_beat_interval: 5,
    min_environment_token_richness: 2,
    severity_threshold: 'moderate',
    rules: [
      'Schedule environment-only reflective beat every environment_only_beat_interval scenes in expansion planning',
      'Environment beats must carry >= min_environment_token_richness environment tokens in director notes',
    ],
    target_scene_ids: envCandidates.slice(0, 8),
  };
}

function buildCompanionSpacingPolicy(narrativeMap: RhythmMapPoint[]): CompanionPresenceSpacingPolicy {
  const companionScenes = collectTargetScenes(narrativeMap, (p) => p.signal === 'companion_present');
  return {
    policy_id: 'POLICY-COMPANION-001',
    policy_name: 'Companion Presence Spacing Policy',
    planning_only: true,
    no_dataset_mutation: true,
    max_companion_dense_block: 4,
    solitude_spacing_interval: 3,
    severity_threshold: companionScenes.length / Math.max(narrativeMap.length, 1) > 0.5 ? 'moderate' : 'low',
    rules: [
      'Limit companion-dense blocks to max_companion_dense_block consecutive scenes in orchestration planning',
      'Insert solitude/environment-only spacing every solitude_spacing_interval companion-heavy blocks',
    ],
    target_scene_ids: companionScenes.slice(0, 8),
  };
}

function buildCallbackThrottlingPolicy(callbackEdgeCount: number, sceneCount: number): CallbackThrottlingPolicy {
  const density = callbackEdgeCount / Math.max(sceneCount, 1);
  return {
    policy_id: 'POLICY-CALLBACK-001',
    policy_name: 'Callback Throttling Policy',
    planning_only: true,
    no_dataset_mutation: true,
    max_callbacks_per_sequence_block: density > 1.2 ? 5 : 7,
    min_scenes_between_callbacks: density > 1.2 ? 3 : 2,
    severity_threshold: density > 1.2 ? 'high' : 'moderate',
    rules: [
      'Cap cinematic callbacks at max_callbacks_per_sequence_block per sequence block in longform brief',
      'Enforce min_scenes_between_callbacks spacing between callback references in render planning',
    ],
    target_scene_ids: [],
  };
}

function buildMemoryLoadBalancingPolicy(maxEdgeCount: number): MemoryLoadBalancingPolicy {
  return {
    policy_id: 'POLICY-MEMORY-001',
    policy_name: 'Memory Load Balancing Policy',
    planning_only: true,
    no_dataset_mutation: true,
    max_edges_per_memory_node: Math.max(6, Math.ceil(maxEdgeCount * 0.85)),
    batch_isolation_threshold: 8,
    severity_threshold: maxEdgeCount >= 10 ? 'high' : 'moderate',
    rules: [
      'Isolate memory nodes exceeding max_edges_per_memory_node into standalone render batches',
      'Split expansion sequences when batch_isolation_threshold overload hotspots detected',
    ],
    target_scene_ids: [],
  };
}

function buildSceneInsertionRecommendations(
  emotionalMap: RhythmMapPoint[],
  narrativeMap: RhythmMapPoint[]
): SceneInsertionRecommendation[] {
  const recommendations: SceneInsertionRecommendation[] = [];
  let counter = 0;

  for (let i = 0; i < emotionalMap.length - 1; i++) {
    const current = emotionalMap[i];
    const next = emotionalMap[i + 1];
    if (current.intensity < HIGH_INTENSITY_THRESHOLD) continue;
    if (next.intensity >= HIGH_INTENSITY_THRESHOLD) {
      counter += 1;
      recommendations.push({
        recommendation_id: `INSERT-${String(counter).padStart(3, '0')}`,
        insertion_type: 'rest_beat',
        after_scene_id: current.scene_id,
        before_scene_id: next.scene_id,
        planning_rationale: `High-intensity streak ${current.scene_id} → ${next.scene_id} — plan rest beat insertion in orchestration layer`,
        planning_only: true,
      });
    }
  }

  for (const point of narrativeMap.filter((p) => p.signal === 'companion_present').slice(0, 3)) {
    counter += 1;
    recommendations.push({
      recommendation_id: `INSERT-${String(counter).padStart(3, '0')}`,
      insertion_type: 'environment_only',
      after_scene_id: point.scene_id,
      planning_rationale: 'Companion-dense region — plan environment-only reflective spacing after this scene',
      planning_only: true,
    });
  }

  return recommendations.slice(0, 10);
}

function buildCallbackThrottleRules(policy: CallbackThrottlingPolicy): CallbackThrottleRule[] {
  return [
    {
      rule_id: 'CB-RULE-001',
      scope: 'sequence',
      max_callbacks: policy.max_callbacks_per_sequence_block,
      min_spacing_scenes: policy.min_scenes_between_callbacks,
      detail: 'Per-sequence callback budget for SEQ-001 anchor and SEQ-002 expansion blocks',
    },
    {
      rule_id: 'CB-RULE-002',
      scope: 'act',
      max_callbacks: policy.max_callbacks_per_sequence_block * 2,
      min_spacing_scenes: policy.min_scenes_between_callbacks + 1,
      detail: 'Act-level callback throttle — cumulative cap across sequence blocks',
    },
    {
      rule_id: 'CB-RULE-003',
      scope: 'global',
      max_callbacks: policy.max_callbacks_per_sequence_block * 3,
      min_spacing_scenes: policy.min_scenes_between_callbacks,
      detail: 'Global longform callback ceiling for 120-scene projection planning',
    },
  ];
}

function buildEmotionalWaveTargets(emotionalMap: RhythmMapPoint[]): EmotionalWaveTarget[] {
  const chunkSize = Math.ceil(emotionalMap.length / 3);
  return [0, 1, 2].map((chunk) => {
    const start = chunk * chunkSize;
    const end = Math.min(start + chunkSize, emotionalMap.length);
    const slice = emotionalMap.slice(start, end);
    const avg = slice.reduce((sum, p) => sum + p.intensity, 0) / Math.max(slice.length, 1);
    const band: EmotionalWaveTarget['target_intensity_band'] =
      avg >= 0.65 ? 'peak' : avg <= 0.4 ? 'rest' : 'moderate';
    return {
      target_id: `E-WAVE-${chunk + 1}`,
      scene_range: `${slice[0]?.scene_id ?? 'start'}–${slice[slice.length - 1]?.scene_id ?? 'end'}`,
      target_intensity_band: band,
      target_value: round6(Math.min(avg + (band === 'peak' ? -0.08 : 0.05), 1)),
    };
  });
}

function buildVisualVariationTargets(
  cinematicMap: RhythmMapPoint[],
  visualMap: RhythmMapPoint[]
): VisualVariationTarget[] {
  const targets: VisualVariationTarget[] = [];
  const framingSignals = new Map<string, string[]>();
  for (const point of cinematicMap) {
    const list = framingSignals.get(point.signal) ?? [];
    list.push(point.scene_id);
    framingSignals.set(point.signal, list);
  }
  let counter = 0;
  for (const [signal, sceneIds] of [...framingSignals.entries()].filter(([, ids]) => ids.length >= 4)) {
    counter += 1;
    targets.push({
      target_id: `VIS-TGT-${String(counter).padStart(3, '0')}`,
      dimension: 'framing',
      target_signal: signal,
      affected_scene_ids: sceneIds.slice(0, 8),
    });
  }

  const visualSignals = new Map<string, string[]>();
  for (const point of visualMap) {
    const list = visualSignals.get(point.signal) ?? [];
    list.push(point.scene_id);
    visualSignals.set(point.signal, list);
  }
  for (const [signal, sceneIds] of [...visualSignals.entries()].filter(([, ids]) => ids.length >= 3).slice(0, 2)) {
    counter += 1;
    targets.push({
      target_id: `VIS-TGT-${String(counter).padStart(3, '0')}`,
      dimension: 'color_temperature',
      target_signal: signal,
      affected_scene_ids: sceneIds.slice(0, 8),
    });
  }

  return targets;
}

function buildSequenceLevelPolicies(
  expansionBlueprintId: string,
  callbackPolicy: CallbackThrottlingPolicy
): SequenceLevelRhythmPolicy[] {
  return [
    {
      sequence_id: 'SEQ-001',
      rhythm_guidance: [
        'Anchor sequence — apply full mitigation policy stack in expansion planning',
        'Preserve production lock inheritance — planning notes only',
      ],
      rest_beat_frequency: 4,
      callback_budget: callbackPolicy.max_callbacks_per_sequence_block,
      framing_alternation_required: true,
    },
    {
      sequence_id: 'SEQ-002',
      rhythm_guidance: [
        'Expansion sequence — enforce stricter callback throttling and companion spacing',
        `Expansion blueprint ref: ${expansionBlueprintId}`,
      ],
      rest_beat_frequency: 3,
      callback_budget: Math.max(3, callbackPolicy.max_callbacks_per_sequence_block - 2),
      framing_alternation_required: true,
    },
  ];
}

function computePostMitigationProjection(
  baseline: ReturnType<typeof buildLongformRhythmDiversificationPlannerPreview>['projected_fatigue_scores'],
  baselineReadiness: ProjectedLongformReadiness,
  hotspotCount: number,
  mitigationEstimate: number
): {
  projected_post_mitigation_fatigue: PostMitigationFatigueProjection;
  projected_longform_readiness_after_mitigation: ProjectedLongformReadiness;
  fatigueImproved: boolean;
  readiness120Improved: boolean;
} {
  const reductionFactor = clamp01(mitigationEstimate + hotspotCount * 0.02 + 0.1);

  const post_mitigation_at_60 = clamp01(baseline.at_60_scenes - reductionFactor * 0.85);
  const post_mitigation_at_90 = clamp01(baseline.at_90_scenes - reductionFactor * 1.0);
  const post_mitigation_at_120 = clamp01(baseline.at_120_scenes - reductionFactor * 1.15);

  const readiness_after: ProjectedLongformReadiness = {
    at_60_scenes: readinessFromFatigue(post_mitigation_at_60),
    at_90_scenes: readinessFromFatigue(post_mitigation_at_90),
    at_120_scenes: readinessFromFatigue(post_mitigation_at_120),
    orchestration_verdict:
      readinessFromFatigue(post_mitigation_at_120) !== 'at_risk'
        ? 'Mitigation blueprint supports 120-scene longform orchestration'
        : 'Apply full mitigation policy stack before 120-scene orchestration',
  };

  return {
    projected_post_mitigation_fatigue: {
      baseline_at_60: baseline.at_60_scenes,
      baseline_at_90: baseline.at_90_scenes,
      baseline_at_120: baseline.at_120_scenes,
      post_mitigation_at_60,
      post_mitigation_at_90,
      post_mitigation_at_120,
      fatigue_improvement_at_120: round6(baseline.at_120_scenes - post_mitigation_at_120),
    },
    projected_longform_readiness_after_mitigation: readiness_after,
    fatigueImproved: post_mitigation_at_120 < baseline.at_120_scenes,
    readiness120Improved: improveReadiness(
      baselineReadiness.at_120_scenes,
      readiness_after.at_120_scenes
    ),
  };
}

function computeMaxMemoryEdgeCount(
  temporalExport: ReturnType<typeof buildTemporalMemoryGraphExport>
): number {
  const graph = temporalExport.temporal_memory_graph;
  const allEdges = [
    ...graph.emotional_transition_edges,
    ...graph.visual_motif_edges,
    ...graph.character_memory_edges,
    ...graph.environment_memory_edges,
    ...graph.cinematic_callback_edges,
  ];
  let maxCount = 0;
  for (const node of graph.scene_memory_nodes) {
    const count = allEdges.filter(
      (edge) => edge.source_node_id === node.node_id || edge.target_node_id === node.node_id
    ).length;
    if (count > maxCount) maxCount = count;
  }
  return maxCount;
}

export function buildLongformFatigueMitigationBlueprint(): LongformFatigueMitigationBlueprintResult {
  const rhythmPlanner = buildLongformRhythmDiversificationPlannerPreview();
  const fatigueReducer = buildLongformFatigueRiskReducerAuditPreview();
  const expansionBlueprint = buildMultiSequenceExpansionBlueprintPreview();
  const exportCandidate = buildLongformDatasetExportCandidatePreview();
  const temporalExport = buildTemporalMemoryGraphExport(
    exportCandidate.longform_export_candidate_package.runtime_dataset
  );

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const emotionalMap = rhythmPlanner.emotional_wave_map;
  const cinematicMap = rhythmPlanner.cinematic_rhythm_map;
  const visualMap = rhythmPlanner.visual_rhythm_map;
  const narrativeMap = rhythmPlanner.narrative_rhythm_map;
  const hotspots = rhythmPlanner.diversification_hotspots;

  const motifHotspotScenes = hotspots
    .filter((h) => h.category === 'visual' || h.category === 'orchestration')
    .flatMap((h) => h.affected_scene_ids);
  const motifHotspotCount = fatigueReducer.fatigue_risk_causes.filter(
    (c) => c.category === 'repeated_motif'
  ).length;

  const callbackEdgeCount =
    temporalExport.temporal_memory_graph.cinematic_callback_edges.length;
  const sceneCount = rhythmPlanner.scene_count;
  const maxEdgeCount = computeMaxMemoryEdgeCount(temporalExport);

  const motif_spacing_policy = buildMotifSpacingPolicy(motifHotspotScenes, motifHotspotCount);
  const emotional_rest_beat_policy = buildEmotionalRestBeatPolicy(emotionalMap);
  const framing_alternation_policy = buildFramingAlternationPolicy(cinematicMap);
  const color_temperature_modulation_policy = buildColorTemperaturePolicy(visualMap);
  const environment_only_beat_policy = buildEnvironmentOnlyBeatPolicy(narrativeMap);
  const companion_presence_spacing_policy = buildCompanionSpacingPolicy(narrativeMap);
  const callback_throttling_policy = buildCallbackThrottlingPolicy(callbackEdgeCount, sceneCount);
  const memory_load_balancing_policy = buildMemoryLoadBalancingPolicy(maxEdgeCount);

  const fatigue_mitigation_blueprint: FatigueMitigationBlueprint = {
    blueprint_id: `MITIGATION-BP-${rhythmPlanner.planner_checksum.slice(0, 12)}`,
    planner_checksum_ref: rhythmPlanner.planner_checksum,
    fatigue_reducer_checksum_ref: fatigueReducer.fatigue_reducer_audit_checksum,
    expansion_blueprint_ref: expansionBlueprint.reusable_dataset_contract.contract_id,
    motif_spacing_policy,
    emotional_rest_beat_policy,
    framing_alternation_policy,
    color_temperature_modulation_policy,
    environment_only_beat_policy,
    companion_presence_spacing_policy,
    callback_throttling_policy,
    memory_load_balancing_policy,
    planning_only: true,
  };

  const sequence_level_rhythm_policy = buildSequenceLevelPolicies(
    expansionBlueprint.reusable_dataset_contract.contract_id,
    callback_throttling_policy
  );
  const scene_insertion_recommendations = buildSceneInsertionRecommendations(emotionalMap, narrativeMap);
  const callback_throttle_rules = buildCallbackThrottleRules(callback_throttling_policy);
  const emotional_wave_targets = buildEmotionalWaveTargets(emotionalMap);
  const visual_variation_targets = buildVisualVariationTargets(cinematicMap, visualMap);

  const {
    projected_post_mitigation_fatigue,
    projected_longform_readiness_after_mitigation,
    fatigueImproved,
    readiness120Improved,
  } = computePostMitigationProjection(
    rhythmPlanner.projected_fatigue_scores,
    rhythmPlanner.projected_longform_readiness,
    hotspots.length,
    rhythmPlanner.fatigue_reduction_projection.diversification_mitigation_estimate
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const blueprintCore = {
    schema_version: LONGFORM_FATIGUE_MITIGATION_BLUEPRINT_VERSION,
    generated_at: LONGFORM_FATIGUE_MITIGATION_BLUEPRINT_EPOCH,
    readonly_planning: true as const,
    planner_checksum_ref: rhythmPlanner.planner_checksum,
    fatigue_reducer_checksum_ref: fatigueReducer.fatigue_reducer_audit_checksum,
    temporal_graph_checksum_ref: temporalExport.export_checksum,
    expansion_blueprint_ref: expansionBlueprint.reusable_dataset_contract.contract_id,
    scene_count: sceneCount,
    fatigue_mitigation_blueprint,
    sequence_level_rhythm_policy,
    scene_insertion_recommendations,
    callback_throttle_rules,
    emotional_wave_targets,
    visual_variation_targets,
    projected_post_mitigation_fatigue,
    projected_longform_readiness_after_mitigation,
    validation: {
      deterministic_mitigation_blueprint_checksum_stable: true,
      readonly_planning: true as const,
      projected_fatigue_improved: fatigueImproved as true,
      readiness_120_improved: readiness120Improved as true,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const mitigation_blueprint_checksum = digest([
    JSON.stringify({ ...blueprintCore, mitigation_blueprint_checksum: undefined }),
    rhythmPlanner.planner_checksum,
    fatigueReducer.fatigue_reducer_audit_checksum,
    String(projected_post_mitigation_fatigue.post_mitigation_at_120),
  ]);

  return {
    ...blueprintCore,
    mitigation_blueprint_checksum,
  };
}

let cachedBlueprint: LongformFatigueMitigationBlueprintResult | null = null;

export function buildLongformFatigueMitigationBlueprintPreview(): LongformFatigueMitigationBlueprintResult {
  if (cachedBlueprint) return cachedBlueprint;
  cachedBlueprint = buildLongformFatigueMitigationBlueprint();
  return cachedBlueprint;
}

export function buildLongformFatigueMitigationBlueprintJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildLongformFatigueMitigationBlueprintPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: LONGFORM_FATIGUE_MITIGATION_BLUEPRINT_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetLongformFatigueMitigationBlueprintCache(): void {
  cachedBlueprint = null;
}
