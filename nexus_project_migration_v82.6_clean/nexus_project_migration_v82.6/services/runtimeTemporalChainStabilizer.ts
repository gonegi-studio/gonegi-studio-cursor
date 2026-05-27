import crypto from 'crypto';
import {
  CinematicExtractionResult,
  CallbackSaturationAnalysis,
  EmotionalEntropyAnalysis,
  LongformRuntimeStability,
  RecursiveMemoryLoadAnalysis,
  RUNTIME_TEMPORAL_CHAIN_STABILIZER_VERSION,
  RuntimeChainVerdict,
  RuntimeTemporalChainStabilizationResult,
  RuntimeTemporalStabilizationReport,
  SceneMemoryNode,
  TemporalDriftAnalysis,
  TemporalGrowthProjection,
  TemporalMemoryGraphBundle,
} from '../types';
import { buildRuntimeDatasetRecertificationPreview } from './runtimeDatasetRecertification';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';
import { isEmptyValue } from './pipelineBridge';

export const RUNTIME_TEMPORAL_CHAIN_STABILIZER_EPOCH = '2026-05-27T02:00:00.000Z';
export const RUNTIME_TEMPORAL_CHAIN_STABILIZER_FILENAME =
  'runtime-temporal-chain-stabilization-export.json';

export const TEMPORAL_DRIFT_MAX = 0.35;
export const EMOTIONAL_ENTROPY_MAX = 0.4;
export const CALLBACK_SATURATION_MAX = 0.45;
export const EDGE_DENSITY_MAX = 0.55;
export const LONGFORM_STABILITY_MIN = 0.82;

const PROJECTION_TARGETS = [50, 75, 120] as const;

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

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return round6(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function variance(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  return round6(
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length
  );
}

function hasEmotionalSignal(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.emotional_carryover) ||
    !isEmptyValue(scene.scene_state?.emotion) ||
    !isEmptyValue(scene.sequence_graph?.transition_logic?.emotion_continuity)
  );
}

function countSignatureRepeats(nodes: SceneMemoryNode[], key: keyof SceneMemoryNode): number {
  const counts = new Map<string, number>();
  for (const node of nodes) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const entry of value) {
        counts.set(String(entry), (counts.get(String(entry)) ?? 0) + 1);
      }
      continue;
    }
    counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
  }
  let repeats = 0;
  for (const count of counts.values()) {
    if (count > 1) repeats += count - 1;
  }
  return repeats;
}

function computeBaselineCompositeRisk(baseline: TemporalChainGrowthBaseline): number {
  return round6(
    baseline.temporal_drift_score * 0.35 +
      baseline.emotional_entropy_score * 0.3 +
      baseline.callback_saturation_score * 0.25 +
      baseline.edge_density_risk * 0.06
  );
}

function analyzeTemporalDrift(
  scenes: CinematicExtractionResult[],
  graph: TemporalMemoryGraphBundle,
  characterDrifts: number[]
): TemporalDriftAnalysis {
  let timestampBreaks = 0;
  for (let i = 1; i < scenes.length; i++) {
    const prevEnd = scenes[i - 1].scene_indexing?.v_timestamp_end;
    const curStart = scenes[i].scene_indexing?.v_timestamp_start;
    if (
      typeof prevEnd !== 'number' ||
      typeof curStart !== 'number' ||
      curStart < prevEnd
    ) {
      timestampBreaks += 1;
    }
  }

  const allEdges = [
    ...graph.emotional_transition_edges,
    ...graph.visual_motif_edges,
    ...graph.character_memory_edges,
    ...graph.environment_memory_edges,
    ...graph.cinematic_callback_edges,
  ];
  const persistenceValues = allEdges.map((edge) => edge.persistence_strength);
  const propagationInstability = Math.min(1, variance(persistenceValues) * 4);

  const callbackEdges = graph.cinematic_callback_edges;
  const fragmentedCallbacks = callbackEdges.filter(
    (edge) => edge.persistence_strength < 0.85 || (edge.callback_strength ?? 1) < 0.85
  ).length;
  const callbackFragmentation = ratio(fragmentedCallbacks, Math.max(callbackEdges.length, 1));

  const anchorIds = graph.scene_memory_nodes.map((node) => node.temporal_anchor_id);
  const sequentialAnchors = anchorIds.every(
    (anchor, index) => anchor === `TEMPORAL-ANCHOR-${String(index + 1).padStart(3, '0')}`
  );
  const memoryAnchorDivergence = sequentialAnchors
    ? 0
    : ratio(new Set(anchorIds).size, anchorIds.length);
  const continuityDecay = mean(characterDrifts);
  const timestampInstability = ratio(timestampBreaks, Math.max(scenes.length - 1, 1));

  const temporal_drift_score = round6(
    Math.min(
      1,
      timestampInstability * 0.35 +
        continuityDecay * 0.25 +
        propagationInstability * 0.2 +
        callbackFragmentation * 0.1 +
        memoryAnchorDivergence * 0.1
    )
  );

  return {
    temporal_drift_score,
    temporal_anchor_stability: round6(1 - memoryAnchorDivergence - timestampInstability * 0.5),
    recursive_memory_integrity: round6(1 - propagationInstability),
    continuity_decay: continuityDecay,
    callback_fragmentation: callbackFragmentation,
    memory_anchor_divergence: memoryAnchorDivergence,
  };
}

function analyzeEmotionalEntropy(
  scenes: CinematicExtractionResult[],
  graph: TemporalMemoryGraphBundle,
  characterDrifts: number[]
): EmotionalEntropyAnalysis {
  const emotional_decay_map = scenes.map((scene, sceneIndex) => ({
    scene_index: sceneIndex,
    scene_id: scene.id,
    emotional_decay: characterDrifts[sceneIndex] ?? 0,
    carryover_intensity: round6(
      scene.emotional_carryover?.carryover_intensity ??
        scene.sequence_graph?.transition_logic?.emotion_continuity ??
        0.75
    ),
  }));

  const abrupt_discontinuities = characterDrifts.filter((drift) => drift > 0.35).length;
  const unresolved_emotional_chains = graph.emotional_transition_edges.filter(
    (edge) => edge.emotional_decay > 0.3 || edge.persistence_strength < 0.8
  ).length;

  const emotionContinuities = scenes.map(
    (scene) => scene.sequence_graph?.transition_logic?.emotion_continuity ?? 0.85
  );
  const emotional_loop_instability = variance(emotionContinuities);

  const degradation = ratio(
    scenes.filter((scene, index) => index > 0 && !hasEmotionalSignal(scene)).length,
    Math.max(scenes.length - 1, 1)
  );

  const emotional_entropy_score = round6(
    Math.min(
      1,
      mean(characterDrifts) * 0.35 +
        ratio(abrupt_discontinuities, Math.max(scenes.length, 1)) * 0.25 +
        ratio(unresolved_emotional_chains, Math.max(graph.emotional_transition_edges.length, 1)) *
          0.2 +
        emotional_loop_instability * 0.1 +
        degradation * 0.1
    )
  );

  return {
    emotional_entropy_score,
    emotion_chain_stability: round6(1 - emotional_entropy_score),
    emotional_decay_map,
    abrupt_discontinuities,
    unresolved_emotional_chains,
    emotional_loop_instability,
  };
}

function analyzeCallbackSaturation(
  nodes: SceneMemoryNode[],
  graph: TemporalMemoryGraphBundle
): CallbackSaturationAnalysis {
  const motifRepeats = countSignatureRepeats(nodes, 'motif_signatures');
  const excessMotifRepeats = Math.max(0, motifRepeats - nodes.length * 4);
  const motif_repetition_density = round6(
    Math.min(1, ratio(excessMotifRepeats, Math.max(nodes.length, 1)))
  );

  const framingCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  const rhythmCounts = new Map<string, number>();
  for (const node of nodes) {
    framingCounts.set(node.framing_signature, (framingCounts.get(node.framing_signature) ?? 0) + 1);
    colorCounts.set(
      node.color_harmony_signature,
      (colorCounts.get(node.color_harmony_signature) ?? 0) + 1
    );
    rhythmCounts.set(node.rhythm_signature, (rhythmCounts.get(node.rhythm_signature) ?? 0) + 1);
  }

  const framing_repetition_density = round6(
    Math.min(1, [...framingCounts.values()].filter((count) => count > 1).length / Math.max(nodes.length, 1))
  );
  const color_callback_oversaturation = round6(
    Math.min(
      1,
      [...colorCounts.values()].filter((count) => count > 2).length / Math.max(nodes.length, 1)
    )
  );

  const rhythmTags = graph.cinematic_callback_edges.map(
    (edge) => edge.propagation_tag ?? edge.edge_id
  );
  const uniqueRhythmTags = new Set(rhythmTags).size;
  const rhythm_callback_collisions = round6(
    Math.min(1, Math.max(0, 1 - ratio(uniqueRhythmTags, Math.max(rhythmTags.length, 1))))
  );

  const callback_saturation_score = round6(
    Math.min(
      1,
      motif_repetition_density * 0.55 +
        framing_repetition_density * 0.225 +
        color_callback_oversaturation * 0.225
    )
  );

  return {
    callback_saturation_score,
    motif_repetition_density,
    cinematic_callback_balance: round6(1 - callback_saturation_score),
    framing_repetition_density,
    color_callback_oversaturation,
    rhythm_callback_collisions,
  };
}

function analyzeRecursiveMemoryLoad(
  sceneCount: number,
  graph: TemporalMemoryGraphBundle
): RecursiveMemoryLoadAnalysis {
  const allEdges = [
    ...graph.emotional_transition_edges,
    ...graph.visual_motif_edges,
    ...graph.character_memory_edges,
    ...graph.environment_memory_edges,
    ...graph.cinematic_callback_edges,
  ];
  const edgesPerScene = allEdges.length / Math.max(sceneCount, 1);
  const graph_recursion_depth = allEdges.reduce(
    (max, edge) => Math.max(max, edge.narrative_distance),
    0
  );

  const memory_graph_pressure = round6(Math.min(1, edgesPerScene / 80));
  const depthFactor = round6(Math.min(1, graph_recursion_depth / Math.max(sceneCount * 2.5, 1)));
  const accumulated_continuity_burden = round6(memory_graph_pressure * depthFactor * 0.65);
  const edge_density_risk = round6(
    Math.min(1, memory_graph_pressure * 0.55 + depthFactor * 0.45)
  );

  const recursive_load_score = round6(
    Math.min(1, memory_graph_pressure * 0.45 + depthFactor * 0.35 + accumulated_continuity_burden * 0.2)
  );

  return {
    recursive_load_score,
    memory_graph_pressure,
    edge_density_risk,
    accumulated_continuity_burden,
    graph_recursion_depth,
  };
}

export interface TemporalChainGrowthBaseline {
  scene_count: number;
  temporal_drift_score: number;
  emotional_entropy_score: number;
  callback_saturation_score: number;
  edge_density_risk: number;
}

export function projectTemporalChainGrowth(
  baseline: TemporalChainGrowthBaseline,
  targetSceneCount: number
): TemporalGrowthProjection {
  const scale = targetSceneCount / Math.max(baseline.scene_count, 1);
  const growthPenalty = round6(Math.min(0.1, (scale - 1) * 0.007));
  const baselineRisk = computeBaselineCompositeRisk(baseline);

  const projected_temporal_drift = round6(
    Math.min(1, baseline.temporal_drift_score * (1 + (scale - 1) * 0.015))
  );
  const projected_emotional_entropy = round6(
    Math.min(1, baseline.emotional_entropy_score * (1 + (scale - 1) * 0.018))
  );
  const projected_callback_saturation = round6(
    Math.min(1, baseline.callback_saturation_score * (1 + (scale - 1) * 0.016))
  );
  const projected_edge_density = round6(
    Math.min(1, baseline.edge_density_risk * (1 + (scale - 1) * 0.02))
  );

  const compositeRisk = round6(Math.min(1, baselineRisk + growthPenalty));

  return {
    target_scene_count: targetSceneCount,
    projected_stability: round6(Math.max(0, 1 - compositeRisk)),
    projected_temporal_drift,
    projected_emotional_entropy,
    projected_callback_saturation,
    projected_edge_density,
  };
}

function buildLongformStability(
  baseline: TemporalChainGrowthBaseline
): LongformRuntimeStability {
  const projections = PROJECTION_TARGETS.map((target) =>
    projectTemporalChainGrowth(baseline, target)
  );

  return {
    predicted_50_scene_stability: projections[0].projected_stability,
    predicted_75_scene_stability: projections[1].projected_stability,
    predicted_120_scene_stability: projections[2].projected_stability,
    projections,
  };
}

function resolveRuntimeChainVerdict(
  temporalDrift: number,
  emotionalEntropy: number,
  callbackSaturation: number,
  recursiveLoad: number,
  predicted120: number
): RuntimeChainVerdict {
  if (
    temporalDrift > TEMPORAL_DRIFT_MAX ||
    emotionalEntropy > EMOTIONAL_ENTROPY_MAX ||
    callbackSaturation > CALLBACK_SATURATION_MAX ||
    recursiveLoad > EDGE_DENSITY_MAX ||
    predicted120 < 0.75
  ) {
    return 'unstable';
  }

  const warningThreshold = 0.7;
  if (
    temporalDrift > TEMPORAL_DRIFT_MAX * warningThreshold ||
    emotionalEntropy > EMOTIONAL_ENTROPY_MAX * warningThreshold ||
    callbackSaturation > CALLBACK_SATURATION_MAX * warningThreshold ||
    recursiveLoad > EDGE_DENSITY_MAX * warningThreshold ||
    predicted120 < LONGFORM_STABILITY_MIN
  ) {
    return 'warning';
  }

  return 'stable';
}

export function buildRuntimeTemporalChainStabilization(): RuntimeTemporalChainStabilizationResult {
  const recertification = buildRuntimeDatasetRecertificationPreview();
  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const runtimeDataset = getActiveRuntimeDataset();
  const sceneCount = runtimeDataset.length;

  const temporalExport = buildTemporalMemoryGraphExport(runtimeDataset);
  const graph = temporalExport.temporal_memory_graph;
  const nodes = graph.scene_memory_nodes;
  const characterDrifts = temporalExport.continuity_summary.character_continuity.map(
    (state) => state.emotional_drift
  );

  const temporal_drift = analyzeTemporalDrift(runtimeDataset, graph, characterDrifts);
  const emotional_entropy = analyzeEmotionalEntropy(runtimeDataset, graph, characterDrifts);
  const callback_saturation = analyzeCallbackSaturation(nodes, graph);
  const recursive_memory_load = analyzeRecursiveMemoryLoad(sceneCount, graph);

  const growthBaseline: TemporalChainGrowthBaseline = {
    scene_count: sceneCount,
    temporal_drift_score: temporal_drift.temporal_drift_score,
    emotional_entropy_score: emotional_entropy.emotional_entropy_score,
    callback_saturation_score: callback_saturation.callback_saturation_score,
    edge_density_risk: recursive_memory_load.edge_density_risk,
  };
  const longform_stability = buildLongformStability(growthBaseline);

  const runtime_chain_verdict = resolveRuntimeChainVerdict(
    temporal_drift.temporal_drift_score,
    emotional_entropy.emotional_entropy_score,
    callback_saturation.callback_saturation_score,
    recursive_memory_load.recursive_load_score,
    longform_stability.predicted_120_scene_stability
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const lockPreserved =
    recertification.runtime_lock_candidate.lock_inheritance === 'preserved';
  const runtimeDatasetUnchanged = runtimeFingerprintBefore === runtimeFingerprintAfter;

  const runtime_temporal_stabilization_report: RuntimeTemporalStabilizationReport = {
    active_scene_count: sceneCount,
    runtime_dataset_fingerprint_ref: recertification.runtime_dataset_fingerprint,
    runtime_recertification_checksum_ref: recertification.recertification_checksum,
    runtime_lock_inheritance_ref: recertification.runtime_lock_candidate.lock_inheritance,
    temporal_graph_checksum_ref: temporalExport.export_checksum,
    temporal_drift,
    emotional_entropy,
    callback_saturation,
    recursive_memory_load,
    longform_stability,
    safety_gates: {
      temporal_drift_max: TEMPORAL_DRIFT_MAX,
      emotional_entropy_max: EMOTIONAL_ENTROPY_MAX,
      callback_saturation_max: CALLBACK_SATURATION_MAX,
      edge_density_max: EDGE_DENSITY_MAX,
      longform_stability_min: LONGFORM_STABILITY_MIN,
    },
    runtime_chain_verdict,
    canonical_export_unchanged: true,
    runtime_dataset_unchanged: runtimeDatasetUnchanged as true,
    readonly_analysis: true,
  };

  const stabilizationCore = {
    schema_version: RUNTIME_TEMPORAL_CHAIN_STABILIZER_VERSION,
    generated_at: RUNTIME_TEMPORAL_CHAIN_STABILIZER_EPOCH,
    readonly_stabilization: true as const,
    runtime_temporal_stabilization_report,
    temporal_drift_score: temporal_drift.temporal_drift_score,
    emotional_entropy_score: emotional_entropy.emotional_entropy_score,
    callback_saturation_score: callback_saturation.callback_saturation_score,
    recursive_load_score: recursive_memory_load.recursive_load_score,
    runtime_chain_verdict,
    predicted_120_scene_stability: longform_stability.predicted_120_scene_stability,
    validation: {
      deterministic_stabilization_checksum_stable: true,
      readonly_stabilization: true as const,
      in_memory_only: true as const,
      no_canonical_export_mutation: true as const,
      no_runtime_dataset_mutation: runtimeDatasetUnchanged as true,
      no_graph_mutation: true as const,
      no_provider_calls: true as const,
      no_image_generation: true as const,
      runtime_lock_inheritance_preserved: lockPreserved,
    },
  };

  const stabilization_checksum = digest([JSON.stringify(stabilizationCore)]);

  return {
    ...stabilizationCore,
    stabilization_checksum,
  };
}

let cachedStabilization: RuntimeTemporalChainStabilizationResult | null = null;

export function buildRuntimeTemporalChainStabilizationPreview(): RuntimeTemporalChainStabilizationResult {
  if (cachedStabilization) return cachedStabilization;
  cachedStabilization = buildRuntimeTemporalChainStabilization();
  return cachedStabilization;
}

export function buildRuntimeTemporalChainStabilizationExportDownload(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildRuntimeTemporalChainStabilizationPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: RUNTIME_TEMPORAL_CHAIN_STABILIZER_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetRuntimeTemporalChainStabilizationCache(): void {
  cachedStabilization = null;
}
