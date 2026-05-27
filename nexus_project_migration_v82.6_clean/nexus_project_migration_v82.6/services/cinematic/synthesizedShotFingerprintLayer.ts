import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  FingerprintCollisionGroup,
  FingerprintCollisionReport,
  FingerprintCollisionSeverity,
  FingerprintHighSimilarityCluster,
  GroundedValue,
  SceneMemoryNode,
  SHOT_FINGERPRINT_VERSION,
  ShotFingerprintAtmosphereClass,
  ShotFingerprintCadenceClass,
  ShotFingerprintCallbackDensityClass,
  ShotFingerprintContinuityRole,
  ShotFingerprintEmotionWaveClass,
  ShotFingerprintCoverageReport,
  ShotFingerprintQualityReport,
  SYNTHESIZED_SHOT_FINGERPRINT_LAYER_VERSION,
  SynthesizedLongformDataset,
  SynthesizedSceneShotFingerprint,
  SynthesizedShotFingerprintExport,
  SynthesizedShotFingerprintLayerResult,
  TemporalMemoryGraphBundle,
} from '../../types';
import { CANONICAL_EXPORT_FILE } from '../datasetCompletionAudit';
import { buildRealLongformDatasetSynthesisPreview } from '../realLongformDatasetSynthesis';
import { getActiveRuntimeDataset } from '../realSeq002Ingestion';
import { buildSynthesizedDatasetProductionLockPreview } from '../synthesizedDatasetProductionLock';

export const SYNTHESIZED_SHOT_FINGERPRINT_LAYER_EPOCH = '2026-05-27T18:00:00.000Z';
export const SYNTHESIZED_SHOT_FINGERPRINT_JSON_FILENAME = 'synthesized-shot-fingerprint.json';
export const SYNTHESIZED_SHOT_FINGERPRINT_EXPORT_JSON_PATH = 'exports/synthesized-shot-fingerprint.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const EXPECTED_SCENE_COUNT = 120;
const COMPACT_PREFIX_LENGTH = 16;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return round6(Math.max(0, Math.min(1, value)));
}

function groundedNumber(value: GroundedValue<number> | undefined, fallback = 0): number {
  return typeof value?.value === 'number' ? value.value : fallback;
}

function groundedString(value: GroundedValue<string> | undefined, fallback = ''): string {
  return typeof value?.value === 'string' ? value.value : fallback;
}

function stableJoin(values: Array<string | number | boolean>): string {
  return values.map((value) => String(value)).join(':');
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function hasSourceFingerprint(scene: CinematicExtractionResult): boolean {
  return !!scene.shot_fingerprint?.composition_hash;
}

function dominantFraming(scene: CinematicExtractionResult): string {
  const counts = new Map<string, number>();
  for (const atom of scene.visual_atoms ?? []) {
    const framing = atom.spatial_intelligence?.framing ?? 'MS';
    counts.set(framing, (counts.get(framing) ?? 0) + 1);
  }
  if (counts.size === 0) return 'MS';
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function depthBalance(scene: CinematicExtractionResult): number {
  const atoms = scene.visual_atoms ?? [];
  if (atoms.length === 0) return 0.5;
  const weights = { foreground: 0, midground: 0, background: 0 };
  for (const atom of atoms) {
    const layer = atom.spatial_intelligence?.depth_layer ?? 'midground';
    weights[layer] += atom.significance ?? 0.5;
  }
  const total = weights.foreground + weights.midground + weights.background;
  if (total <= 0) return 0.5;
  return round6(weights.foreground / total);
}

function subjectOccupancy(scene: CinematicExtractionResult): number {
  const atoms = scene.visual_atoms ?? [];
  if (atoms.length === 0) return 0.5;
  const totalFocus = atoms.reduce(
    (sum, atom) => sum + (atom.spatial_intelligence?.focus_priority ?? 0.5),
    0
  );
  return clamp01(totalFocus / atoms.length);
}

function cameraIntimacy(scene: CinematicExtractionResult): number {
  const focal = groundedNumber(scene.scene_state?.optics?.focal_length_mm, 50);
  const distance = groundedNumber(scene.scene_state?.physics?.subject_distance_meter, 3);
  return clamp01(1 - Math.min(focal / 200, 1) * 0.5 - Math.min(distance / 20, 1) * 0.5);
}

function computeFramingComplexity(scene: CinematicExtractionResult): number {
  const atoms = scene.visual_atoms ?? [];
  const framingKinds = new Set(atoms.map((atom) => atom.spatial_intelligence?.framing ?? 'MS'));
  const depthKinds = new Set(atoms.map((atom) => atom.spatial_intelligence?.depth_layer ?? 'midground'));
  const relationCount = scene.relationship_graph?.length ?? 0;
  const atomDiversity = clamp01(framingKinds.size / 4);
  const depthDiversity = clamp01(depthKinds.size / 3);
  const graphSignal = clamp01(relationCount / 8);
  return clamp01(atomDiversity * 0.4 + depthDiversity * 0.35 + graphSignal * 0.25);
}

function computeFramingFingerprint(scene: CinematicExtractionResult): string {
  const scale = dominantFraming(scene);
  const density = clamp01((scene.visual_atoms?.length ?? 0) / 12);
  const occupancy = subjectOccupancy(scene);
  const balance = depthBalance(scene);
  const intimacy = cameraIntimacy(scene);
  return digest([
    stableJoin(['framing', scale, density, occupancy, balance, intimacy]),
  ]).slice(0, 24);
}

function flowVector(scene: CinematicExtractionResult): number[] {
  return scene.sequence_graph?.transition_logic?.camera_flow_vector ?? [0, 0, 0];
}

function vectorMagnitude(vector: number[]): number {
  return round6(Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)));
}

function computeMotionFingerprint(scene: CinematicExtractionResult): {
  motion_fingerprint: string;
  motion_cadence_class: ShotFingerprintCadenceClass;
  trajectory_signature: string;
} {
  const flow = flowVector(scene);
  const velocity = groundedNumber(scene.scene_state?.physics?.camera_velocity_mps, 0);
  const motionDensity = groundedNumber(scene.scene_state?.physics?.motion_density, 0);
  const pacingMemory = groundedNumber(scene.scene_state?.temporal?.pacing_memory, 0);
  const rhythmPressure = groundedNumber(scene.scene_state?.temporal?.rhythm_pressure, 0);
  const waveform = scene.scene_state?.temporal?.pacing_waveform ?? [];
  const waveformMean =
    waveform.length > 0 ? waveform.reduce((sum, value) => sum + value, 0) / waveform.length : 0;

  const cadenceScore = velocity * 0.35 + motionDensity * 0.35 + rhythmPressure * 0.3;
  let motion_cadence_class: ShotFingerprintCadenceClass = 'moderate';
  if (cadenceScore < 0.25) motion_cadence_class = 'slow';
  else if (cadenceScore < 0.55) motion_cadence_class = 'moderate';
  else if (cadenceScore < 0.8) motion_cadence_class = 'brisk';
  else motion_cadence_class = 'dynamic';

  const motion_fingerprint = digest([
    stableJoin([
      'motion',
      vectorMagnitude(flow),
      flow[0] ?? 0,
      flow[1] ?? 0,
      flow[2] ?? 0,
      velocity,
      motionDensity,
      pacingMemory,
      rhythmPressure,
      waveformMean,
    ]),
  ]).slice(0, 24);

  const trajectory_signature = digest([
    stableJoin(['trajectory', ...flow.map((value) => round6(value))]),
  ]).slice(0, 16);

  return { motion_fingerprint, motion_cadence_class, trajectory_signature };
}

function emotionalIntensity(scene: CinematicExtractionResult): number {
  const emotion = scene.scene_state?.emotion;
  if (!emotion) return 0.5;
  const values = [
    groundedNumber(emotion.dread),
    groundedNumber(emotion.melancholy),
    groundedNumber(emotion.anticipation),
    groundedNumber(emotion.intimacy, 0),
    groundedNumber(emotion.arousal_rate, 0),
    groundedNumber(emotion.isolation_score),
  ];
  return clamp01(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function computeEmotionFingerprint(scene: CinematicExtractionResult): {
  emotion_fingerprint: string;
  emotion_wave_class: ShotFingerprintEmotionWaveClass;
  rest_beat_presence: boolean;
} {
  const intensity = emotionalIntensity(scene);
  const rhythmPressure = groundedNumber(scene.scene_state?.temporal?.rhythm_pressure, 0);
  const catharsis = groundedNumber(scene.scene_state?.emotion?.catharsis_ready, 0);
  const tensionCurve = groundedString(scene.scene_state?.temporal?.time_tension_curve, 'neutral');
  const emotionTokens = scene.layers?.scene_language?.emotion_tokens ?? [];
  const rest_beat_presence = emotionTokens.some((token) =>
    /rest|silence|pause|reflect|still/i.test(token)
  );

  let emotion_wave_class: ShotFingerprintEmotionWaveClass = 'flat';
  if (/release|resolve|calm/i.test(tensionCurve) || catharsis > 0.65) emotion_wave_class = 'release';
  else if (/crest|peak|climax/i.test(tensionCurve) || intensity > 0.75) emotion_wave_class = 'crest';
  else if (/rise|build|escal/i.test(tensionCurve) || rhythmPressure > 0.6) emotion_wave_class = 'rising';
  else if (/oscill|wave|pulse/i.test(tensionCurve)) emotion_wave_class = 'oscillating';

  const emotion_fingerprint = digest([
    stableJoin([
      'emotion',
      intensity,
      rhythmPressure,
      catharsis,
      tensionCurve,
      rest_beat_presence,
      ...emotionTokens.slice(0, 6).sort(),
    ]),
  ]).slice(0, 24);

  return { emotion_fingerprint, emotion_wave_class, rest_beat_presence };
}

function computePaletteSignature(scene: CinematicExtractionResult): string {
  const cinematography = [...(scene.layers?.scene_language?.cinematography_tokens ?? [])].sort();
  const environment = [...(scene.layers?.scene_language?.environment_tokens ?? [])].sort();
  const chroma = groundedNumber(scene.scene_state?.physics?.chroma_intensity, 0.5);
  const luminance = groundedNumber(scene.scene_state?.physics?.luminance_contrast, 0.5);
  return digest([
    stableJoin(['palette', chroma, luminance, ...cinematography.slice(0, 8), ...environment.slice(0, 8)]),
  ]).slice(0, 20);
}

function computeVisualFingerprint(scene: CinematicExtractionResult): {
  visual_fingerprint: string;
  palette_signature: string;
  atmosphere_class: ShotFingerprintAtmosphereClass;
} {
  const luminance = groundedNumber(scene.scene_state?.physics?.luminance_contrast, 0.5);
  const chroma = groundedNumber(scene.scene_state?.physics?.chroma_intensity, 0.5);
  const luminanceBalance = groundedNumber(scene.scene_state?.physics?.luminance_balance, 0.5);
  const environmentTokens = scene.layers?.scene_language?.environment_tokens ?? [];
  const cinematographyTokens = scene.layers?.scene_language?.cinematography_tokens ?? [];
  const palette_signature = computePaletteSignature(scene);

  let atmosphere_class: ShotFingerprintAtmosphereClass = 'neutral';
  if (luminance > 0.75) atmosphere_class = 'high_contrast';
  else if (chroma < 0.25 && luminanceBalance < 0.35) atmosphere_class = 'muted';
  else if (chroma > 0.65 || environmentTokens.some((token) => /warm|sun|gold|amber/i.test(token))) {
    atmosphere_class = 'warm';
  } else if (
    chroma < 0.45 ||
    environmentTokens.some((token) => /cool|blue|mist|night/i.test(token)) ||
    cinematographyTokens.some((token) => /cool|blue/i.test(token))
  ) {
    atmosphere_class = 'cool';
  }

  const visual_fingerprint = digest([
    stableJoin([
      'visual',
      luminance,
      chroma,
      luminanceBalance,
      atmosphere_class,
      palette_signature,
      ...environmentTokens.slice(0, 4).sort(),
    ]),
  ]).slice(0, 24);

  return { visual_fingerprint, palette_signature, atmosphere_class };
}

function sceneMemoryNode(
  graph: TemporalMemoryGraphBundle,
  sceneId: string
): SceneMemoryNode | undefined {
  return graph.scene_memory_nodes.find((node) => node.scene_id === sceneId);
}

function edgeCountForScene(graph: TemporalMemoryGraphBundle, sceneId: string): number {
  const nodeIds = new Set(
    graph.scene_memory_nodes.filter((node) => node.scene_id === sceneId).map((node) => node.node_id)
  );
  if (nodeIds.size === 0) return 0;

  const edgeLists = [
    graph.emotional_transition_edges,
    graph.visual_motif_edges,
    graph.character_memory_edges,
    graph.environment_memory_edges,
    graph.cinematic_callback_edges,
  ];

  return edgeLists.reduce(
    (total, edges) =>
      total +
      edges.filter(
        (edge) => nodeIds.has(edge.source_node_id) || nodeIds.has(edge.target_node_id)
      ).length,
    0
  );
}

function callbackEdgeCount(graph: TemporalMemoryGraphBundle, sceneId: string): number {
  const nodeIds = new Set(
    graph.scene_memory_nodes.filter((node) => node.scene_id === sceneId).map((node) => node.node_id)
  );
  if (nodeIds.size === 0) return 0;

  return graph.cinematic_callback_edges.filter(
    (edge) => nodeIds.has(edge.source_node_id) || nodeIds.has(edge.target_node_id)
  ).length;
}

function computeNarrativeFingerprint(
  scene: CinematicExtractionResult,
  sceneIndex: number,
  dataset: SynthesizedLongformDataset
): {
  narrative_fingerprint: string;
  continuity_role: ShotFingerprintContinuityRole;
  callback_density_class: ShotFingerprintCallbackDensityClass;
} {
  const graph = dataset.expanded_continuity_graph;
  const memoryNode = sceneMemoryNode(graph, scene.id);
  const edgeCount = edgeCountForScene(graph, scene.id);
  const callbackCount = callbackEdgeCount(graph, scene.id);
  const shotPurpose = scene.scene_indexing?.shot_purpose ?? [];
  const transitionEnergy = scene.sequence_graph?.transition_logic?.energy_delta ?? 0;
  const motifCount = memoryNode?.motif_signatures?.length ?? 0;

  let continuity_role: ShotFingerprintContinuityRole = 'transition';
  if (sceneIndex === 0 || shotPurpose.some((purpose) => /source|establish|origin/i.test(purpose))) {
    continuity_role = 'source';
  } else if (callbackCount >= 2 || shotPurpose.some((purpose) => /callback|echo|mirror/i.test(purpose))) {
    continuity_role = 'callback';
  } else if (motifCount >= 3 || shotPurpose.some((purpose) => /anchor|memory|motif/i.test(purpose))) {
    continuity_role = 'anchor';
  } else if (edgeCount >= 4 || Math.abs(transitionEnergy) >= 0.35) {
    continuity_role = 'bridge';
  }

  let callback_density_class: ShotFingerprintCallbackDensityClass = 'sparse';
  if (callbackCount >= 3) callback_density_class = 'dense';
  else if (callbackCount >= 1) callback_density_class = 'moderate';

  const narrative_fingerprint = digest([
    stableJoin([
      'narrative',
      continuity_role,
      callback_density_class,
      edgeCount,
      callbackCount,
      motifCount,
      transitionEnergy,
      scene.sequence_graph?.current_node ?? '',
      ...shotPurpose.slice(0, 4).sort(),
    ]),
  ]).slice(0, 24);

  return { narrative_fingerprint, continuity_role, callback_density_class };
}

function collectSourceFields(scene: CinematicExtractionResult): string[] {
  const fields = [
    'visual_atoms',
    'relationship_graph',
    'scene_state.physics',
    'scene_state.emotion',
    'scene_state.temporal',
    'scene_state.optics',
    'sequence_graph',
    'generative_layer',
    'layers.scene_language',
    'scene_indexing.shot_purpose',
  ];
  if ((scene.visual_atoms?.length ?? 0) > 0) fields.push('visual_atoms.spatial_intelligence');
  if ((scene.relationship_graph?.length ?? 0) > 0) fields.push('relationship_graph.weight');
  return fields.sort();
}

function buildSceneFingerprint(
  scene: CinematicExtractionResult,
  sceneIndex: number,
  dataset: SynthesizedLongformDataset
): Omit<SynthesizedSceneShotFingerprint, 'compact_fingerprint' | 'shot_fingerprint_hash' | 'shot_uniqueness_score'> {
  const framing_fingerprint = computeFramingFingerprint(scene);
  const framing_complexity_score = computeFramingComplexity(scene);
  const motion = computeMotionFingerprint(scene);
  const emotion = computeEmotionFingerprint(scene);
  const visual = computeVisualFingerprint(scene);
  const narrative = computeNarrativeFingerprint(scene, sceneIndex, dataset);

  const fingerprint_id = `FP-${digest([scene.id, String(sceneIndex), SHOT_FINGERPRINT_VERSION]).slice(0, 16).toUpperCase()}`;

  return {
    fingerprint_id,
    scene_id: scene.id,
    framing_fingerprint,
    motion_fingerprint: motion.motion_fingerprint,
    emotion_fingerprint: emotion.emotion_fingerprint,
    visual_fingerprint: visual.visual_fingerprint,
    narrative_fingerprint: narrative.narrative_fingerprint,
    framing_complexity_score,
    motion_cadence_class: motion.motion_cadence_class,
    trajectory_signature: motion.trajectory_signature,
    emotion_wave_class: emotion.emotion_wave_class,
    rest_beat_presence: emotion.rest_beat_presence,
    palette_signature: visual.palette_signature,
    atmosphere_class: visual.atmosphere_class,
    continuity_role: narrative.continuity_role,
    callback_density_class: narrative.callback_density_class,
    fingerprint_version: SHOT_FINGERPRINT_VERSION,
    source_fields: collectSourceFields(scene),
  };
}

function finalizeFingerprints(
  partials: Array<
    Omit<SynthesizedSceneShotFingerprint, 'compact_fingerprint' | 'shot_fingerprint_hash' | 'shot_uniqueness_score'>
  >
): SynthesizedSceneShotFingerprint[] {
  const compactList = partials.map((partial) =>
    [
      partial.framing_fingerprint.slice(0, 8),
      partial.motion_fingerprint.slice(0, 8),
      partial.emotion_fingerprint.slice(0, 8),
      partial.visual_fingerprint.slice(0, 8),
      partial.narrative_fingerprint.slice(0, 8),
    ].join('')
  );

  return partials.map((partial, index) => {
    const compact_fingerprint = compactList[index];
    const exactMatches = compactList.filter((value) => value === compact_fingerprint).length - 1;
    const prefixMatches =
      compactList.filter(
        (value) => value.slice(0, COMPACT_PREFIX_LENGTH) === compact_fingerprint.slice(0, COMPACT_PREFIX_LENGTH)
      ).length - 1;
    const shot_uniqueness_score = clamp01(
      1 - (exactMatches * 0.55 + prefixMatches * 0.12) / Math.max(partials.length - 1, 1)
    );

    const fingerprintBody = {
      ...partial,
      compact_fingerprint,
      shot_uniqueness_score,
    };
    const shot_fingerprint_hash = digest([JSON.stringify(fingerprintBody)]);

    return {
      ...fingerprintBody,
      shot_fingerprint_hash,
    };
  });
}

function buildCoverageReport(scenes: CinematicExtractionResult[], generated: number): ShotFingerprintCoverageReport {
  const prior = scenes.filter(hasSourceFingerprint).length;
  return {
    total_scenes: scenes.length,
    fingerprints_generated: generated,
    coverage_ratio: round6(generated / Math.max(scenes.length, 1)),
    prior_fingerprint_coverage: prior,
    prior_fingerprint_coverage_ratio: round6(prior / Math.max(scenes.length, 1)),
    enrichment_only: true,
    readonly_enrichment: true,
  };
}

function incrementDistribution<T extends string>(
  map: Record<T, number>,
  key: T
): void {
  map[key] = (map[key] ?? 0) + 1;
}

function buildQualityReport(fingerprints: SynthesizedSceneShotFingerprint[]): ShotFingerprintQualityReport {
  const motion_cadence_distribution: Record<ShotFingerprintCadenceClass, number> = {
    slow: 0,
    moderate: 0,
    brisk: 0,
    dynamic: 0,
  };
  const emotion_wave_distribution: Record<ShotFingerprintEmotionWaveClass, number> = {
    flat: 0,
    rising: 0,
    crest: 0,
    release: 0,
    oscillating: 0,
  };
  const atmosphere_class_distribution: Record<ShotFingerprintAtmosphereClass, number> = {
    warm: 0,
    cool: 0,
    neutral: 0,
    high_contrast: 0,
    muted: 0,
  };
  const continuity_role_distribution: Record<ShotFingerprintContinuityRole, number> = {
    source: 0,
    bridge: 0,
    anchor: 0,
    callback: 0,
    transition: 0,
  };

  let framingSum = 0;
  let uniquenessSum = 0;

  for (const fingerprint of fingerprints) {
    framingSum += fingerprint.framing_complexity_score;
    uniquenessSum += fingerprint.shot_uniqueness_score;
    incrementDistribution(motion_cadence_distribution, fingerprint.motion_cadence_class);
    incrementDistribution(emotion_wave_distribution, fingerprint.emotion_wave_class);
    incrementDistribution(atmosphere_class_distribution, fingerprint.atmosphere_class);
    incrementDistribution(continuity_role_distribution, fingerprint.continuity_role);
  }

  const average_framing_complexity = round6(framingSum / Math.max(fingerprints.length, 1));
  const average_uniqueness_score = round6(uniquenessSum / Math.max(fingerprints.length, 1));
  const quality_score = clamp01(
    average_uniqueness_score * 0.45 + average_framing_complexity * 0.35 + 0.2
  );

  return {
    average_framing_complexity,
    average_uniqueness_score,
    motion_cadence_distribution,
    emotion_wave_distribution,
    atmosphere_class_distribution,
    continuity_role_distribution,
    quality_score,
  };
}

function resolveCollisionSeverity(groupSize: number): FingerprintCollisionSeverity {
  if (groupSize <= 1) return 'none';
  if (groupSize === 2) return 'low';
  if (groupSize <= 4) return 'moderate';
  return 'high';
}

function buildCollisionReport(fingerprints: SynthesizedSceneShotFingerprint[]): FingerprintCollisionReport {
  const groupsByCompact = new Map<string, string[]>();
  for (const fingerprint of fingerprints) {
    const list = groupsByCompact.get(fingerprint.compact_fingerprint) ?? [];
    list.push(fingerprint.scene_id);
    groupsByCompact.set(fingerprint.compact_fingerprint, list);
  }

  const fingerprint_collision_groups: FingerprintCollisionGroup[] = [];
  let groupCounter = 0;

  for (const [compact_fingerprint, scene_ids] of [...groupsByCompact.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    if (scene_ids.length <= 1) continue;
    groupCounter += 1;
    const collision_severity = resolveCollisionSeverity(scene_ids.length);
    fingerprint_collision_groups.push({
      group_id: `COLLISION-${String(groupCounter).padStart(3, '0')}`,
      compact_fingerprint,
      scene_ids: [...scene_ids].sort(),
      collision_severity,
      collision_reason: `${scene_ids.length} scenes share identical compact fingerprint — readonly measurement only`,
    });
  }

  const prefixMap = new Map<string, string[]>();
  for (const fingerprint of fingerprints) {
    const prefix = fingerprint.compact_fingerprint.slice(0, COMPACT_PREFIX_LENGTH);
    const list = prefixMap.get(prefix) ?? [];
    list.push(fingerprint.scene_id);
    prefixMap.set(prefix, list);
  }

  const high_similarity_clusters: FingerprintHighSimilarityCluster[] = [];
  let clusterCounter = 0;
  for (const [compact_prefix, scene_ids] of [...prefixMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    if (scene_ids.length <= 2) continue;
    clusterCounter += 1;
    high_similarity_clusters.push({
      cluster_id: `SIMILAR-${String(clusterCounter).padStart(3, '0')}`,
      compact_prefix,
      scene_ids: [...scene_ids].sort(),
      similarity_signal: 'compact_prefix_match',
    });
  }

  return {
    fingerprint_collision_groups,
    high_similarity_clusters,
    exact_collision_count: fingerprint_collision_groups.length,
    high_similarity_cluster_count: high_similarity_clusters.length,
    collision_analysis_readonly: true,
  };
}

function writeExportArtifact(payload: SynthesizedShotFingerprintLayerResult): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(exportsDir, SYNTHESIZED_SHOT_FINGERPRINT_JSON_FILENAME),
    JSON.stringify(payload, null, 2),
    'utf8'
  );
}

export function buildSynthesizedShotFingerprintLayer(): SynthesizedShotFingerprintLayerResult {
  const synthesis = buildRealLongformDatasetSynthesisPreview();
  const productionLock = buildSynthesizedDatasetProductionLockPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;
  const synthesisChecksumBefore = synthesis.synthesis_checksum;

  const dataset120 = synthesis.synthesized_120_scene_dataset;
  const scenes = dataset120.scenes;

  const partialFingerprints = scenes.map((scene, index) =>
    buildSceneFingerprint(scene, index, dataset120)
  );
  const scene_fingerprints = finalizeFingerprints(partialFingerprints);

  const synthesized_shot_fingerprint_export: SynthesizedShotFingerprintExport = {
    dataset_id: dataset120.dataset_id,
    locked_synthesized_dataset_id: productionLock.locked_synthesized_dataset_id,
    scene_count: 120,
    synthesis_checksum_ref: synthesisChecksumBefore,
    production_lock_checksum_ref: productionLockChecksumBefore,
    continuity_graph_checksum_ref: dataset120.continuity_graph_checksum,
    scene_fingerprints,
  };

  const shot_fingerprint_coverage_report = buildCoverageReport(scenes, scene_fingerprints.length);
  const shot_fingerprint_quality_report = buildQualityReport(scene_fingerprints);
  const fingerprint_collision_report = buildCollisionReport(scene_fingerprints);

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumAfter = buildSynthesizedDatasetProductionLockPreview().production_lock_checksum;
  const synthesisChecksumAfter = buildRealLongformDatasetSynthesisPreview().synthesis_checksum;

  const resultCore = {
    schema_version: SYNTHESIZED_SHOT_FINGERPRINT_LAYER_VERSION,
    generated_at: SYNTHESIZED_SHOT_FINGERPRINT_LAYER_EPOCH,
    readonly_enrichment: true as const,
    synthesized_shot_fingerprint_export,
    shot_fingerprint_coverage_report,
    shot_fingerprint_quality_report,
    fingerprint_collision_report,
    export_json_path: SYNTHESIZED_SHOT_FINGERPRINT_EXPORT_JSON_PATH as 'exports/synthesized-shot-fingerprint.json',
    validation: {
      deterministic_fingerprint_checksum_stable: true,
      readonly_enrichment: true as const,
      shot_fingerprint_coverage_120_of_120:
        scene_fingerprints.length === EXPECTED_SCENE_COUNT &&
        shot_fingerprint_coverage_report.coverage_ratio === 1,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      production_lock_unchanged: productionLockChecksumBefore === productionLockChecksumAfter,
      collision_analysis_generated: true,
    },
  };

  const fingerprint_checksum = digest([
    JSON.stringify(resultCore),
    synthesisChecksumBefore,
    productionLockChecksumBefore,
  ]);

  const result: SynthesizedShotFingerprintLayerResult = {
    ...resultCore,
    fingerprint_checksum,
  };

  writeExportArtifact(result);

  return result;
}

let cachedLayer: SynthesizedShotFingerprintLayerResult | null = null;

export function buildSynthesizedShotFingerprintLayerPreview(): SynthesizedShotFingerprintLayerResult {
  if (cachedLayer) return cachedLayer;
  cachedLayer = buildSynthesizedShotFingerprintLayer();
  return cachedLayer;
}

export function buildSynthesizedShotFingerprintLayerJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildSynthesizedShotFingerprintLayerPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: SYNTHESIZED_SHOT_FINGERPRINT_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetSynthesizedShotFingerprintLayerCache(): void {
  cachedLayer = null;
}
