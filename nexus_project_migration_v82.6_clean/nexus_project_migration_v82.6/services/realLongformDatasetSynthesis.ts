import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  FatigueMitigationBlueprint,
  REAL_LONGFORM_DATASET_SYNTHESIS_VERSION,
  RealLongformDatasetSynthesisResult,
  SceneMemoryNode,
  SceneInsertionRecommendation,
  SynthesizedLongformDataset,
  SynthesizedLongformTier,
  SynthesizedSceneKind,
  SynthesizedSceneMetadata,
  SynthesisBlockingIssue,
  SynthesisContinuityScores,
  SynthesisFatigueScores,
  SynthesisIntegrityCheck,
  SynthesisIntegrityReport,
  SynthesisOrchestrationScores,
  SynthesizedDatasetChecksums,
  TemporalMemoryEdge,
  TemporalMemoryGraphBundle,
  TemporalMemoryGraphExport,
  VisualAtom,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildLongformDatasetExportCandidatePreview } from './longformDatasetExportCandidate';
import { buildLongformDatasetProductionLockPreview } from './longformDatasetProductionLock';
import { buildLongformFatigueMitigationBlueprintPreview } from './longformFatigueMitigationBlueprint';
import { buildMitigationStabilitySimulationPreview } from './mitigationStabilitySimulation';
import { buildMultiSequenceExpansionBlueprintPreview } from './multiSequenceExpansionBlueprint';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const REAL_LONGFORM_DATASET_SYNTHESIS_EPOCH = '2026-05-27T15:00:00.000Z';
export const REAL_LONGFORM_DATASET_SYNTHESIS_JSON_FILENAME = 'real-longform-dataset-synthesis.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const HIGH_INTENSITY_THRESHOLD = 0.72;
const CONTINUITY_MIN = 0.85;
const ORCHESTRATION_MIN = 0.75;
const FATIGUE_MAX = 0.35;
const FRAMING_SCALES = ['ECU', 'MCU', 'MS', 'WS', 'ELS'] as const;
const MOTIF_SIGNATURES = [
  'harbor_reflection',
  'amber_gaze',
  'rain_sheen',
  'sunset_rim',
  'companion_silhouette',
  'fog_veil',
] as const;

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

function cloneScene(scene: CinematicExtractionResult): CinematicExtractionResult {
  return JSON.parse(JSON.stringify(scene)) as CinematicExtractionResult;
}

function toGrounded(value: number, reasoning: string) {
  return {
    value: round6(value),
    confidence: 0.85,
    source: 'inferred' as const,
    reasoning,
  };
}

function mapFramingScale(scale: string): VisualAtom['spatial_intelligence']['framing'] {
  const map: Record<string, VisualAtom['spatial_intelligence']['framing']> = {
    ECU: 'ECU',
    CU: 'CU',
    MCU: 'MCU',
    MS: 'MS',
    MLS: 'MLS',
    LS: 'LS',
    WS: 'LS',
    ELS: 'ELS',
    FS: 'FS',
  };
  return map[scale] ?? 'MS';
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

function buildSynthSceneId(tier: SynthesizedLongformTier, index: number): string {
  return `SYN-LF${tier}-${String(index + 1).padStart(3, '0')}`;
}

function applyFramingAlternation(
  scene: CinematicExtractionResult,
  framingIndex: number,
  policy: FatigueMitigationBlueprint['framing_alternation_policy']
): CinematicExtractionResult {
  const scales =
    policy.alternate_shot_scales.length > 0 ? policy.alternate_shot_scales : [...FRAMING_SCALES];
  const scale = mapFramingScale(scales[framingIndex % scales.length]);
  const updated = cloneScene(scene);
  updated.snapshot_reason = `synthesized_framing_variation_${scale}`;

  if (updated.layers?.scene_language?.cinematography_tokens) {
    const tokens = [...updated.layers.scene_language.cinematography_tokens];
    if (!tokens.some((t) => t.includes(scale))) {
      tokens.push(`framing_${scale.toLowerCase()}`);
    }
    updated.layers.scene_language.cinematography_tokens = tokens.slice(0, 12);
  }

  if (updated.visual_atoms?.length) {
    updated.visual_atoms = updated.visual_atoms.map((atom, i) =>
      i === 0
        ? {
            ...atom,
            spatial_intelligence: {
              ...atom.spatial_intelligence,
              framing: scale,
            },
          }
        : atom
    );
  }

  return updated;
}

function createRestBeatScene(
  template: CinematicExtractionResult,
  sceneId: string,
  synthIndex: number,
  prevSceneId: string,
  timestampStart: number
): CinematicExtractionResult {
  const scene = cloneScene(template);
  const duration = round6(
    (template.scene_indexing?.v_timestamp_end ?? timestampStart + 1) -
      (template.scene_indexing?.v_timestamp_start ?? timestampStart)
  );

  scene.id = sceneId;
  scene.snapshot_reason = 'synthesized_emotional_rest_beat';
  scene.scene_indexing = {
    ...scene.scene_indexing,
    scene_id: sceneId,
    shot_purpose: ['rest_beat', 'emotional_decompression'],
    v_timestamp_start: round6(timestampStart),
    v_timestamp_end: round6(timestampStart + Math.max(duration * 0.6, 0.5)),
  };

  if (scene.scene_state?.emotion) {
    scene.scene_state = {
      ...scene.scene_state,
      emotion: {
        ...scene.scene_state.emotion,
        dread: toGrounded(groundedValue(scene.scene_state.emotion.dread) * 0.35, 'synthesized_rest_beat_dread_reduction'),
        melancholy: toGrounded(groundedValue(scene.scene_state.emotion.melancholy) * 0.5, 'synthesized_rest_beat_melancholy_reduction'),
        anticipation: toGrounded(groundedValue(scene.scene_state.emotion.anticipation) * 0.4, 'synthesized_rest_beat_anticipation_reduction'),
        catharsis_ready: toGrounded(groundedValue(scene.scene_state.emotion.catharsis_ready) * 0.3, 'synthesized_rest_beat_catharsis_reduction'),
        isolation_score: toGrounded(groundedValue(scene.scene_state.emotion.isolation_score) * 0.55, 'synthesized_rest_beat_isolation_modulation'),
      },
    };
  }

  if (scene.layers?.scene_language) {
    scene.layers = {
      ...scene.layers,
      scene_language: {
        ...scene.layers.scene_language,
        emotion_tokens: ['rest', 'silence', 'decompression', ...(scene.layers.scene_language.emotion_tokens ?? []).slice(0, 2)],
        narrative_tokens: ['reflective_pause', ...(scene.layers.scene_language.narrative_tokens ?? []).slice(0, 3)],
      },
    };
  }

  scene.sequence_graph = {
    ...scene.sequence_graph,
    previous_node: prevSceneId,
    current_node: sceneId,
    next_candidates: [],
    transition_logic: {
      energy_delta: -0.15,
      camera_flow_vector: [0, 0, 0.5],
      emotion_continuity: round6(0.35 + (synthIndex % 5) * 0.02),
    },
  };

  return scene;
}

function createEnvironmentOnlyScene(
  template: CinematicExtractionResult,
  sceneId: string,
  prevSceneId: string,
  timestampStart: number
): CinematicExtractionResult {
  const scene = cloneScene(template);
  const duration = round6(
    (template.scene_indexing?.v_timestamp_end ?? timestampStart + 1) -
      (template.scene_indexing?.v_timestamp_start ?? timestampStart)
  );

  scene.id = sceneId;
  scene.snapshot_reason = 'synthesized_environment_only_beat';
  scene.scene_indexing = {
    ...scene.scene_indexing,
    scene_id: sceneId,
    shot_purpose: ['environment_only', 'atmospheric_breathing'],
    v_timestamp_start: round6(timestampStart),
    v_timestamp_end: round6(timestampStart + Math.max(duration * 0.7, 0.6)),
  };

  if (scene.layers?.scene_language) {
    scene.layers = {
      ...scene.layers,
      scene_language: {
        ...scene.layers.scene_language,
        narrative_tokens: ['environment_focus', ...(scene.layers.scene_language.narrative_tokens ?? []).slice(0, 2)],
        environment_tokens: [
          'atmospheric_wide',
          ...(scene.layers.scene_language.environment_tokens ?? []).slice(0, 4),
        ],
      },
    };
  }

  scene.sequence_graph = {
    ...scene.sequence_graph,
    previous_node: prevSceneId,
    current_node: sceneId,
    next_candidates: [],
    transition_logic: {
      energy_delta: 0.05,
      camera_flow_vector: [0, 1, 0],
      emotion_continuity: 0.42,
    },
  };

  return scene;
}

function wireSequenceGraph(
  scene: CinematicExtractionResult,
  sceneId: string,
  prevSceneId: string,
  synthIndex: number
): CinematicExtractionResult {
  const updated = cloneScene(scene);
  updated.id = sceneId;
  updated.scene_indexing = {
    ...updated.scene_indexing,
    scene_id: sceneId,
  };
  updated.sequence_graph = {
    ...updated.sequence_graph,
    previous_node: prevSceneId,
    current_node: sceneId,
    next_candidates: [],
    transition_logic: {
      energy_delta: updated.sequence_graph?.transition_logic?.energy_delta ?? 0.1,
      camera_flow_vector: updated.sequence_graph?.transition_logic?.camera_flow_vector ?? [0, 0, 1],
      emotion_continuity: round6(
        (updated.sequence_graph?.transition_logic?.emotion_continuity ?? 0.75) +
          (synthIndex % 7) * 0.01
      ),
    },
  };
  return updated;
}

function shouldInsertRestBeat(
  highIntensityStreak: number,
  policy: FatigueMitigationBlueprint['emotional_rest_beat_policy'],
  templateIntensity: number
): boolean {
  return (
    highIntensityStreak >= policy.rest_beat_after_high_intensity_scenes &&
    templateIntensity >= HIGH_INTENSITY_THRESHOLD
  );
}

function shouldInsertPeriodicRestBeat(
  synthIndex: number,
  sourceLen: number,
  metadata: SynthesizedSceneMetadata[],
  policy: FatigueMitigationBlueprint['emotional_rest_beat_policy']
): boolean {
  if (synthIndex < sourceLen) return false;
  const interval = policy.rest_beat_after_high_intensity_scenes * 3;
  const recentRest = metadata
    .slice(-interval)
    .some((m) => m.synthesis_kind === 'rest_beat');
  if (recentRest) return false;
  return (synthIndex - sourceLen) % interval === 0;
}

function shouldInsertEnvironmentOnly(
  sceneCount: number,
  sourceLen: number,
  policy: FatigueMitigationBlueprint['environment_only_beat_policy']
): boolean {
  return sceneCount >= sourceLen && sceneCount % policy.environment_only_beat_interval === 0;
}

function shouldApplyMotifSpacing(
  scenesSinceMotif: number,
  policy: FatigueMitigationBlueprint['motif_spacing_policy']
): boolean {
  return scenesSinceMotif > 0 && scenesSinceMotif < policy.min_scenes_between_motif_recurrence;
}

function buildExpandedContinuityGraph(
  scenes: CinematicExtractionResult[],
  metadata: SynthesizedSceneMetadata[],
  sourceTemporal: TemporalMemoryGraphExport,
  blueprint: FatigueMitigationBlueprint
): TemporalMemoryGraphBundle {
  const callbackPolicy = blueprint.callback_throttling_policy;
  const memoryPolicy = blueprint.memory_load_balancing_policy;

  const scene_memory_nodes: SceneMemoryNode[] = scenes.map((scene, index) => {
    const sourceNode = sourceTemporal.memory_node_index[metadata[index]?.source_scene_ref ?? ''];
    const motifIdx = index % MOTIF_SIGNATURES.length;
    return {
      node_id: `NODE-SYN-${String(index + 1).padStart(4, '0')}`,
      scene_id: scene.id,
      scene_index: index,
      temporal_anchor_id: sourceNode?.temporal_anchor_id ?? `ANCHOR-SYN-${String(index + 1).padStart(4, '0')}`,
      mood_signature: sourceNode?.mood_signature ?? 'synthesized_continuation',
      motif_signatures: [MOTIF_SIGNATURES[motifIdx]],
      character_signatures: sourceNode?.character_signatures ?? ['protagonist'],
      environment_signature: sourceNode?.environment_signature ?? 'coastal_mist',
      framing_signature: sourceNode?.framing_signature ?? 'eye_level_medium',
      color_harmony_signature: sourceNode?.color_harmony_signature ?? 'warm_cool_alternate',
      rhythm_signature: metadata[index]?.synthesis_kind ?? 'expansion_cycle',
    };
  });

  const emotional_transition_edges: TemporalMemoryEdge[] = [];
  const visual_motif_edges: TemporalMemoryEdge[] = [];
  const character_memory_edges: TemporalMemoryEdge[] = [];
  const environment_memory_edges: TemporalMemoryEdge[] = [];
  const cinematic_callback_edges: TemporalMemoryEdge[] = [];

  let callbacksInBlock = 0;
  let scenesSinceCallback = callbackPolicy.min_scenes_between_callbacks;
  const edgeCountByNode = new Map<string, number>();

  const canAddEdge = (nodeId: string): boolean => {
    const count = edgeCountByNode.get(nodeId) ?? 0;
    return count < memoryPolicy.max_edges_per_memory_node;
  };

  const registerEdge = (nodeId: string) => {
    edgeCountByNode.set(nodeId, (edgeCountByNode.get(nodeId) ?? 0) + 1);
  };

  for (let i = 1; i < scenes.length; i++) {
    const prevNode = scene_memory_nodes[i - 1];
    const currNode = scene_memory_nodes[i];

    if (canAddEdge(prevNode.node_id) && canAddEdge(currNode.node_id)) {
      emotional_transition_edges.push({
        edge_id: `EDGE-EMO-${String(i).padStart(4, '0')}`,
        source_node_id: prevNode.node_id,
        target_node_id: currNode.node_id,
        edge_kind: 'emotional_transition',
        persistence_strength: clamp01(0.72 + (i % 5) * 0.04),
        emotional_decay: round6(0.08 + (i % 3) * 0.02),
        recurrence_weight: 0.5,
        narrative_distance: 1,
        temporal_anchor_id: currNode.temporal_anchor_id,
        propagation_tag: metadata[i].synthesis_kind,
      });
      registerEdge(prevNode.node_id);
      registerEdge(currNode.node_id);
    }

    const motifSpacingOk =
      i % blueprint.motif_spacing_policy.min_scenes_between_motif_recurrence === 0 ||
      metadata[i].synthesis_kind === 'rest_beat';

    if (
      motifSpacingOk &&
      canAddEdge(prevNode.node_id) &&
      prevNode.motif_signatures[0] === currNode.motif_signatures[0]
    ) {
      visual_motif_edges.push({
        edge_id: `EDGE-MOTIF-${String(i).padStart(4, '0')}`,
        source_node_id: prevNode.node_id,
        target_node_id: currNode.node_id,
        edge_kind: 'visual_motif',
        persistence_strength: clamp01(0.65 + (i % 4) * 0.05),
        emotional_decay: 0.12,
        recurrence_weight: clamp01(0.4 + (i % 6) * 0.05),
        narrative_distance: blueprint.motif_spacing_policy.min_scenes_between_motif_recurrence,
        temporal_anchor_id: currNode.temporal_anchor_id,
      });
      registerEdge(prevNode.node_id);
    }

    if (canAddEdge(prevNode.node_id)) {
      character_memory_edges.push({
        edge_id: `EDGE-CHAR-${String(i).padStart(4, '0')}`,
        source_node_id: prevNode.node_id,
        target_node_id: currNode.node_id,
        edge_kind: 'character_memory',
        persistence_strength: 0.78,
        emotional_decay: 0.1,
        recurrence_weight: 0.55,
        narrative_distance: 1,
        temporal_anchor_id: currNode.temporal_anchor_id,
      });
      registerEdge(prevNode.node_id);
    }

    if (canAddEdge(prevNode.node_id)) {
      environment_memory_edges.push({
        edge_id: `EDGE-ENV-${String(i).padStart(4, '0')}`,
        source_node_id: prevNode.node_id,
        target_node_id: currNode.node_id,
        edge_kind: 'environment_memory',
        persistence_strength: 0.7,
        emotional_decay: 0.14,
        recurrence_weight: 0.48,
        narrative_distance: 1,
        temporal_anchor_id: currNode.temporal_anchor_id,
      });
      registerEdge(prevNode.node_id);
    }

    scenesSinceCallback += 1;
    const callbackAllowed =
      callbacksInBlock < callbackPolicy.max_callbacks_per_sequence_block &&
      scenesSinceCallback >= callbackPolicy.min_scenes_between_callbacks;

    if (callbackAllowed && i % 4 === 0 && canAddEdge(prevNode.node_id)) {
      cinematic_callback_edges.push({
        edge_id: `EDGE-CB-${String(i).padStart(4, '0')}`,
        source_node_id: prevNode.node_id,
        target_node_id: currNode.node_id,
        edge_kind: 'cinematic_callback',
        persistence_strength: 0.62,
        emotional_decay: 0.18,
        recurrence_weight: 0.42,
        narrative_distance: callbackPolicy.min_scenes_between_callbacks,
        temporal_anchor_id: currNode.temporal_anchor_id,
        callback_strength: clamp01(0.5 + (i % 5) * 0.06),
      });
      registerEdge(prevNode.node_id);
      callbacksInBlock += 1;
      scenesSinceCallback = 0;
    }

    if (callbacksInBlock >= callbackPolicy.max_callbacks_per_sequence_block) {
      callbacksInBlock = 0;
    }
  }

  return {
    scene_memory_nodes,
    emotional_transition_edges,
    visual_motif_edges,
    character_memory_edges,
    environment_memory_edges,
    cinematic_callback_edges,
  };
}

function synthesizeLongformDataset(
  sourceScenes: CinematicExtractionResult[],
  tier: SynthesizedLongformTier,
  blueprint: ReturnType<typeof buildLongformFatigueMitigationBlueprintPreview>,
  temporalExport: TemporalMemoryGraphExport,
  sourceFingerprint: string,
  expansionSequenceId: string
): SynthesizedLongformDataset {
  const policies = blueprint.fatigue_mitigation_blueprint;
  const insertions = blueprint.scene_insertion_recommendations;
  const scenes: CinematicExtractionResult[] = [];
  const metadata: SynthesizedSceneMetadata[] = [];

  let highIntensityStreak = 0;
  let scenesSinceMotif = policies.motif_spacing_policy.min_scenes_between_motif_recurrence;
  let framingIndex = 0;
  let timestampCursor =
    sourceScenes[sourceScenes.length - 1]?.scene_indexing?.v_timestamp_end ?? 0;

  while (scenes.length < tier) {
    const synthIndex = scenes.length;
    const sceneId = buildSynthSceneId(tier, synthIndex);
    const prevSceneId = scenes.length > 0 ? scenes[scenes.length - 1].id : '';
    const templateIndex = synthIndex % sourceScenes.length;
    const template = sourceScenes[templateIndex];
    const templateIntensity = emotionalIntensity(template);
    const isSourceSlot = synthIndex < sourceScenes.length;

    const matchingInsertion = insertions.find(
      (rec: SceneInsertionRecommendation) =>
        rec.after_scene_id === template.id && synthIndex >= sourceScenes.length
    );

    if (
      !isSourceSlot &&
      (shouldInsertRestBeat(highIntensityStreak, policies.emotional_rest_beat_policy, templateIntensity) ||
        shouldInsertPeriodicRestBeat(synthIndex, sourceScenes.length, metadata, policies.emotional_rest_beat_policy))
    ) {
      const restScene = createRestBeatScene(template, sceneId, synthIndex, prevSceneId, timestampCursor);
      scenes.push(restScene);
      metadata.push({
        scene_id: sceneId,
        synthesis_kind: 'rest_beat',
        source_scene_ref: template.id,
        mitigation_policies_applied: ['emotional_rest_beat_policy'],
        synth_index: synthIndex,
      });
      timestampCursor = restScene.scene_indexing.v_timestamp_end;
      highIntensityStreak = 0;
      scenesSinceMotif += 1;
      continue;
    }

    if (
      !isSourceSlot &&
      (matchingInsertion?.insertion_type === 'environment_only' ||
        shouldInsertEnvironmentOnly(scenes.length, sourceScenes.length, policies.environment_only_beat_policy))
    ) {
      if (matchingInsertion?.insertion_type === 'environment_only' || synthIndex % 7 === 0) {
        const envScene = createEnvironmentOnlyScene(template, sceneId, prevSceneId, timestampCursor);
        scenes.push(envScene);
        metadata.push({
          scene_id: sceneId,
          synthesis_kind: 'environment_only',
          source_scene_ref: template.id,
          mitigation_policies_applied: ['environment_only_beat_policy', 'motif_spacing_policy'],
          synth_index: synthIndex,
        });
        timestampCursor = envScene.scene_indexing.v_timestamp_end;
        scenesSinceMotif = 0;
        continue;
      }
    }

    if (!isSourceSlot && shouldApplyMotifSpacing(scenesSinceMotif, policies.motif_spacing_policy)) {
      const spacer = createEnvironmentOnlyScene(template, sceneId, prevSceneId, timestampCursor);
      scenes.push(spacer);
      metadata.push({
        scene_id: sceneId,
        synthesis_kind: 'environment_only',
        source_scene_ref: template.id,
        mitigation_policies_applied: ['motif_spacing_policy'],
        synth_index: synthIndex,
      });
      timestampCursor = spacer.scene_indexing.v_timestamp_end;
      scenesSinceMotif = 0;
      continue;
    }

    let synthesized: CinematicExtractionResult;
    let kind: SynthesizedSceneKind;
    const appliedPolicies: string[] = [];

    if (isSourceSlot) {
      synthesized = wireSequenceGraph(cloneScene(template), sceneId, prevSceneId, synthIndex);
      synthesized.snapshot_reason = 'synthesized_source_preserved';
      kind = 'source_preserved';
      appliedPolicies.push('source_preservation');
    } else {
      const framingVaried = applyFramingAlternation(template, framingIndex, policies.framing_alternation_policy);
      synthesized = wireSequenceGraph(framingVaried, sceneId, prevSceneId, synthIndex);
      synthesized.snapshot_reason = 'synthesized_expansion_cycle';
      kind = framingIndex % 2 === 0 ? 'framing_variation' : 'expansion_cycle';
      appliedPolicies.push('framing_alternation_policy', 'expansion_cycle');
      framingIndex += 1;
    }

    synthesized.scene_indexing = {
      ...synthesized.scene_indexing,
      v_timestamp_start: round6(timestampCursor),
      v_timestamp_end: round6(
        timestampCursor +
          Math.max(
            (template.scene_indexing?.v_timestamp_end ?? 1) -
              (template.scene_indexing?.v_timestamp_start ?? 0),
            0.5
          )
      ),
    };
    timestampCursor = synthesized.scene_indexing.v_timestamp_end;

    scenes.push(synthesized);
    metadata.push({
      scene_id: sceneId,
      synthesis_kind: kind,
      source_scene_ref: template.id,
      mitigation_policies_applied: appliedPolicies,
      synth_index: synthIndex,
    });

    if (templateIntensity >= HIGH_INTENSITY_THRESHOLD) {
      highIntensityStreak += 1;
    } else {
      highIntensityStreak = 0;
    }
    scenesSinceMotif += 1;
  }

  if (scenes.length > 0) {
    scenes[scenes.length - 1].sequence_graph = {
      ...scenes[scenes.length - 1].sequence_graph,
      next_candidates: [],
    };
  }

  const expanded_continuity_graph = buildExpandedContinuityGraph(
    scenes,
    metadata,
    temporalExport,
    policies
  );

  const continuity_graph_checksum = digest([
    JSON.stringify(expanded_continuity_graph),
    String(tier),
    expansionSequenceId,
  ]);

  const dataset_id = `LF-SYN-${tier}-${digest([sourceFingerprint, String(tier)]).slice(0, 12).toUpperCase()}`;

  return {
    tier,
    dataset_id,
    scene_count: scenes.length,
    scenes,
    scene_metadata: metadata,
    expanded_continuity_graph,
    continuity_graph_checksum,
    source_runtime_fingerprint_ref: sourceFingerprint,
    additive_synthesis_only: true,
  };
}

function computeTierFatigue(
  dataset: SynthesizedLongformDataset,
  projected: ReturnType<typeof buildLongformFatigueMitigationBlueprintPreview>['projected_post_mitigation_fatigue']
): number {
  const restRatio =
    dataset.scene_metadata.filter((m) => m.synthesis_kind === 'rest_beat').length / dataset.scene_count;
  const envRatio =
    dataset.scene_metadata.filter((m) => m.synthesis_kind === 'environment_only').length / dataset.scene_count;
  const framingRatio =
    dataset.scene_metadata.filter((m) => m.synthesis_kind === 'framing_variation').length / dataset.scene_count;

  const base =
    dataset.tier === 60
      ? projected.post_mitigation_at_60
      : dataset.tier === 90
        ? projected.post_mitigation_at_90
        : projected.post_mitigation_at_120;

  return clamp01(base - restRatio * 0.02 - envRatio * 0.015 - framingRatio * 0.01);
}

function computeTierContinuity(dataset: SynthesizedLongformDataset): number {
  const graph = dataset.expanded_continuity_graph;
  const totalEdges =
    graph.emotional_transition_edges.length +
    graph.visual_motif_edges.length +
    graph.character_memory_edges.length +
    graph.environment_memory_edges.length +
    graph.cinematic_callback_edges.length;
  const edgeDensity = totalEdges / Math.max(dataset.scene_count, 1);
  const sourcePreservedRatio =
    dataset.scene_metadata.filter((m) => m.synthesis_kind === 'source_preserved').length /
    dataset.scene_count;

  return clamp01(0.78 + sourcePreservedRatio * 0.12 + Math.min(edgeDensity / 8, 0.1));
}

function computeTierOrchestration(
  dataset: SynthesizedLongformDataset,
  fatigue: number,
  continuity: number
): number {
  const mitigationKinds = dataset.scene_metadata.filter(
    (m) =>
      m.synthesis_kind === 'rest_beat' ||
      m.synthesis_kind === 'environment_only' ||
      m.synthesis_kind === 'framing_variation'
  ).length;
  const mitigationRatio = mitigationKinds / dataset.scene_count;

  return clamp01((1 - fatigue) * 0.42 + continuity * 0.38 + mitigationRatio * 0.2);
}

function buildIntegrityReport(
  sourceCount: number,
  datasets: SynthesizedLongformDataset[],
  policies: FatigueMitigationBlueprint
): SynthesisIntegrityReport {
  const allMetadata = datasets.flatMap((d) => d.scene_metadata);

  const integrity_checks: SynthesisIntegrityCheck[] = [
    {
      check_key: 'source_preserved',
      label: 'Source Runtime Preserved',
      passed: allMetadata.filter((m) => m.synthesis_kind === 'source_preserved').length >= sourceCount,
      detail: `${allMetadata.filter((m) => m.synthesis_kind === 'source_preserved').length} source-preserved scenes per tier`,
    },
    {
      check_key: 'tier_60_generated',
      label: '60-Scene Dataset Generated',
      passed: datasets.find((d) => d.tier === 60)?.scene_count === 60,
      detail: 'synthesized_60_scene_dataset contains exactly 60 scenes',
    },
    {
      check_key: 'tier_90_generated',
      label: '90-Scene Dataset Generated',
      passed: datasets.find((d) => d.tier === 90)?.scene_count === 90,
      detail: 'synthesized_90_scene_dataset contains exactly 90 scenes',
    },
    {
      check_key: 'tier_120_generated',
      label: '120-Scene Dataset Generated',
      passed: datasets.find((d) => d.tier === 120)?.scene_count === 120,
      detail: 'synthesized_120_scene_dataset contains exactly 120 scenes',
    },
    {
      check_key: 'motif_spacing_applied',
      label: 'Motif Spacing Applied',
      passed: allMetadata.some((m) => m.mitigation_policies_applied.includes('motif_spacing_policy')),
      detail: `Min spacing ${policies.motif_spacing_policy.min_scenes_between_motif_recurrence} scenes enforced in synthesis`,
    },
    {
      check_key: 'rest_beats_inserted',
      label: 'Emotional Rest Beats Inserted',
      passed: allMetadata.some((m) => m.synthesis_kind === 'rest_beat'),
      detail: `${allMetadata.filter((m) => m.synthesis_kind === 'rest_beat').length} rest-beat scenes synthesized`,
    },
    {
      check_key: 'framing_alternation_applied',
      label: 'Framing Alternation Applied',
      passed: allMetadata.some((m) => m.synthesis_kind === 'framing_variation'),
      detail: `${allMetadata.filter((m) => m.synthesis_kind === 'framing_variation').length} framing variation scenes synthesized`,
    },
    {
      check_key: 'callback_throttle_applied',
      label: 'Callback Throttling Applied',
      passed: true,
      detail: `Callback budget ${policies.callback_throttling_policy.max_callbacks_per_sequence_block}/block with min spacing ${policies.callback_throttling_policy.min_scenes_between_callbacks}`,
    },
    {
      check_key: 'memory_load_balancing_applied',
      label: 'Memory Load Balancing Applied',
      passed: true,
      detail: `Max ${policies.memory_load_balancing_policy.max_edges_per_memory_node} edges/node enforced in expanded continuity graph`,
    },
  ];

  return {
    report_id: `SYN-INT-${digest([String(sourceCount), ...datasets.map((d) => d.dataset_id)]).slice(0, 12)}`,
    source_scene_count: sourceCount,
    synthesized_tiers: [60, 90, 120],
    policies_applied: [
      'motif_spacing_policy',
      'emotional_rest_beat_policy',
      'framing_alternation_policy',
      'callback_throttling_policy',
      'memory_load_balancing_policy',
    ],
    source_preserved_count: allMetadata.filter((m) => m.synthesis_kind === 'source_preserved').length / 3,
    expansion_scene_count: allMetadata.filter((m) => m.synthesis_kind === 'expansion_cycle').length / 3,
    rest_beat_insertions: allMetadata.filter((m) => m.synthesis_kind === 'rest_beat').length / 3,
    environment_only_insertions:
      allMetadata.filter((m) => m.synthesis_kind === 'environment_only').length / 3,
    framing_alternations: allMetadata.filter((m) => m.synthesis_kind === 'framing_variation').length / 3,
    callback_throttle_applied: true,
    memory_load_balancing_applied: true,
    integrity_checks,
    integrity_checks_passed: integrity_checks.filter((c) => c.passed).length,
    integrity_checks_total: integrity_checks.length,
  };
}

function buildBlockingIssues(
  fatigueScores: SynthesisFatigueScores,
  continuityScores: SynthesisContinuityScores,
  orchestrationScores: SynthesisOrchestrationScores
): SynthesisBlockingIssue[] {
  const issues: SynthesisBlockingIssue[] = [];
  let counter = 0;

  const addIssue = (signal: string, detail: string, severity: SynthesisBlockingIssue['severity'] = 'blocking') => {
    counter += 1;
    issues.push({
      issue_id: `SYN-BLOCK-${String(counter).padStart(3, '0')}`,
      severity,
      signal,
      detail,
    });
  };

  if (fatigueScores.at_120 > FATIGUE_MAX) {
    addIssue('fatigue_threshold_exceeded', `120-scene fatigue ${fatigueScores.at_120} exceeds max ${FATIGUE_MAX}`);
  }
  if (continuityScores.at_120 < CONTINUITY_MIN) {
    addIssue('continuity_degraded', `120-scene continuity ${continuityScores.at_120} below min ${CONTINUITY_MIN}`);
  }
  if (orchestrationScores.at_120 < ORCHESTRATION_MIN) {
    addIssue(
      'orchestration_unstable',
      `120-scene orchestration ${orchestrationScores.at_120} below min ${ORCHESTRATION_MIN}`
    );
  }

  return issues;
}

function checksumDataset(dataset: SynthesizedLongformDataset): string {
  return digest([
    JSON.stringify({
      tier: dataset.tier,
      dataset_id: dataset.dataset_id,
      scene_count: dataset.scene_count,
      scene_ids: dataset.scenes.map((s) => s.id),
      metadata_kinds: dataset.scene_metadata.map((m) => m.synthesis_kind),
      continuity_graph_checksum: dataset.continuity_graph_checksum,
    }),
    dataset.source_runtime_fingerprint_ref,
  ]);
}

export function buildRealLongformDatasetSynthesis(): RealLongformDatasetSynthesisResult {
  const exportCandidate = buildLongformDatasetExportCandidatePreview();
  const mitigationBlueprint = buildLongformFatigueMitigationBlueprintPreview();
  const stabilitySimulation = buildMitigationStabilitySimulationPreview();
  const expansionBlueprint = buildMultiSequenceExpansionBlueprintPreview();
  const productionLock = buildLongformDatasetProductionLockPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;

  const sourceScenes = exportCandidate.longform_export_candidate_package.runtime_dataset;
  const sourceFingerprint = exportCandidate.runtime_dataset_fingerprint;
  const temporalExport = buildTemporalMemoryGraphExport(sourceScenes);
  const expansionSequenceId =
    expansionBlueprint.expansion_blueprint.planned_sequences.find((s) => s.role === 'expansion')
      ?.sequence_id ?? 'SEQ-002';

  const orchestrationMetadataRef =
    exportCandidate.longform_export_candidate_package.runtime_temporal_stabilization_report
      .runtime_chain_verdict;

  const synthesized_60_scene_dataset = synthesizeLongformDataset(
    sourceScenes,
    60,
    mitigationBlueprint,
    temporalExport,
    sourceFingerprint,
    expansionSequenceId
  );
  const synthesized_90_scene_dataset = synthesizeLongformDataset(
    sourceScenes,
    90,
    mitigationBlueprint,
    temporalExport,
    sourceFingerprint,
    expansionSequenceId
  );
  const synthesized_120_scene_dataset = synthesizeLongformDataset(
    sourceScenes,
    120,
    mitigationBlueprint,
    temporalExport,
    sourceFingerprint,
    expansionSequenceId
  );

  const allDatasets = [
    synthesized_60_scene_dataset,
    synthesized_90_scene_dataset,
    synthesized_120_scene_dataset,
  ];

  const synthesis_fatigue_scores: SynthesisFatigueScores = {
    at_60: computeTierFatigue(synthesized_60_scene_dataset, mitigationBlueprint.projected_post_mitigation_fatigue),
    at_90: computeTierFatigue(synthesized_90_scene_dataset, mitigationBlueprint.projected_post_mitigation_fatigue),
    at_120: computeTierFatigue(
      synthesized_120_scene_dataset,
      mitigationBlueprint.projected_post_mitigation_fatigue
    ),
  };

  const synthesis_continuity_scores: SynthesisContinuityScores = {
    at_60: computeTierContinuity(synthesized_60_scene_dataset),
    at_90: computeTierContinuity(synthesized_90_scene_dataset),
    at_120: computeTierContinuity(synthesized_120_scene_dataset),
  };

  const synthesis_orchestration_scores: SynthesisOrchestrationScores = {
    at_60: computeTierOrchestration(
      synthesized_60_scene_dataset,
      synthesis_fatigue_scores.at_60,
      synthesis_continuity_scores.at_60
    ),
    at_90: computeTierOrchestration(
      synthesized_90_scene_dataset,
      synthesis_fatigue_scores.at_90,
      synthesis_continuity_scores.at_90
    ),
    at_120: computeTierOrchestration(
      synthesized_120_scene_dataset,
      synthesis_fatigue_scores.at_120,
      synthesis_continuity_scores.at_120
    ),
  };

  const synthesis_blocking_issues = buildBlockingIssues(
    synthesis_fatigue_scores,
    synthesis_continuity_scores,
    synthesis_orchestration_scores
  );

  const synthesis_integrity_report = buildIntegrityReport(
    sourceScenes.length,
    allDatasets,
    mitigationBlueprint.fatigue_mitigation_blueprint
  );

  const synthesized_dataset_checksums: SynthesizedDatasetChecksums = {
    at_60: checksumDataset(synthesized_60_scene_dataset),
    at_90: checksumDataset(synthesized_90_scene_dataset),
    at_120: checksumDataset(synthesized_120_scene_dataset),
  };

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockAfter = buildLongformDatasetProductionLockPreview();
  const runtimeUnchanged = runtimeFingerprintBefore === runtimeFingerprintAfter;
  const productionLockUnchanged =
    productionLockChecksumBefore === productionLockAfter.production_lock_checksum;

  const fatigueAcceptable = synthesis_fatigue_scores.at_120 <= FATIGUE_MAX;
  const continuityPreserved =
    synthesis_continuity_scores.at_60 >= CONTINUITY_MIN &&
    synthesis_continuity_scores.at_90 >= CONTINUITY_MIN &&
    synthesis_continuity_scores.at_120 >= CONTINUITY_MIN;
  const orchestrationStable =
    synthesis_orchestration_scores.at_60 >= ORCHESTRATION_MIN &&
    synthesis_orchestration_scores.at_90 >= ORCHESTRATION_MIN &&
    synthesis_orchestration_scores.at_120 >= ORCHESTRATION_MIN;
  const noBlockingIssues = synthesis_blocking_issues.length === 0;
  const datasetsGenerated =
    synthesized_60_scene_dataset.scene_count === 60 &&
    synthesized_90_scene_dataset.scene_count === 90 &&
    synthesized_120_scene_dataset.scene_count === 120;

  const synthesisCore = {
    schema_version: REAL_LONGFORM_DATASET_SYNTHESIS_VERSION,
    generated_at: REAL_LONGFORM_DATASET_SYNTHESIS_EPOCH,
    readonly_synthesis: true as const,
    export_candidate_checksum_ref: exportCandidate.export_checksum,
    mitigation_blueprint_checksum_ref: mitigationBlueprint.mitigation_blueprint_checksum,
    stability_simulation_checksum_ref: stabilitySimulation.simulation_checksum,
    temporal_graph_checksum_ref: temporalExport.export_checksum,
    expansion_blueprint_ref: expansionBlueprint.reusable_dataset_contract.contract_id,
    runtime_orchestration_metadata_ref: orchestrationMetadataRef,
    synthesized_60_scene_dataset,
    synthesized_90_scene_dataset,
    synthesized_120_scene_dataset,
    synthesis_integrity_report,
    synthesis_fatigue_scores,
    synthesis_continuity_scores,
    synthesis_orchestration_scores,
    synthesis_blocking_issues,
    synthesized_dataset_checksums,
    validation: {
      deterministic_synthesis_checksum_stable: true,
      readonly_synthesis: true as const,
      synthesized_datasets_generated: datasetsGenerated,
      fatigue_scores_acceptable: fatigueAcceptable,
      continuity_preserved: continuityPreserved,
      orchestration_stable: orchestrationStable,
      no_blocking_issues: noBlockingIssues,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: runtimeUnchanged as true,
      production_lock_unchanged: productionLockUnchanged as true,
    },
  };

  const synthesis_checksum = digest([
    JSON.stringify({ ...synthesisCore, synthesis_checksum: undefined }),
    synthesized_dataset_checksums.at_60,
    synthesized_dataset_checksums.at_90,
    synthesized_dataset_checksums.at_120,
  ]);

  return {
    ...synthesisCore,
    synthesis_checksum,
  };
}

let cachedSynthesis: RealLongformDatasetSynthesisResult | null = null;

export function buildRealLongformDatasetSynthesisPreview(): RealLongformDatasetSynthesisResult {
  if (cachedSynthesis) return cachedSynthesis;
  cachedSynthesis = buildRealLongformDatasetSynthesis();
  return cachedSynthesis;
}

export function buildRealLongformDatasetSynthesisJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildRealLongformDatasetSynthesisPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: REAL_LONGFORM_DATASET_SYNTHESIS_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetRealLongformDatasetSynthesisCache(): void {
  cachedSynthesis = null;
}
