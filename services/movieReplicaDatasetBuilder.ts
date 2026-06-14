import fs from 'node:fs';
import path from 'node:path';
import { REPLACEMENT_CONTRACT_PATH } from './characterReplacementContractBuilder.js';
import {
  MOVIE_DATASET_REGISTRY_PATH,
  TITANIC_MOVIE_DATASET_BUNDLE_PATH,
} from './movieDatasetSeparation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { SPIRITED_AWAY_BUNDLE_PATH } from './spiritedAwayMovieDataset.js';
import { TITANIC_SCENE_MASTER_REGISTRY_PATH } from './titanicSceneReconstructionDensification.js';
import { TITANIC_VIDEO_TIMELINE_REGISTRY_PATH } from './titanicVideoReconstruction.js';

export const MOVIE_REPLICA_PHASE = 'PHASE-MOVIE-REPLICA-001' as const;
export const MOVIE_REPLICA_SYSTEM_ID = 'MOVIE_REPLICA_DATASET_V1' as const;
export const MOVIE_REPLICA_PASS_VERDICT = 'PASS_MOVIE_REPLICA_DATASET_V1' as const;
export const MOVIE_REPLICA_FAIL_VERDICT = 'FAIL_MOVIE_REPLICA_DATASET_V1' as const;

export const MOVIE_REPLICA_DIR = 'datasets/movie_replica' as const;
export const MOVIE_REPLICA_SCHEMA_PATH = 'datasets/movie_replica/movie-replica.schema.json' as const;
export const MOVIE_REPLICA_REGISTRY_PATH = 'datasets/movie_replica/movie-replica-registry.json' as const;
export const MOVIE_REPLICA_REPORT_PATH = 'reports/movie_replica/MOVIE_REPLICA_DATASET_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  frame_extraction: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

const MATERIALIZED_MOVIES = [
  {
    movie_id: 'titanic',
    bundle_path: TITANIC_MOVIE_DATASET_BUNDLE_PATH,
    output_path: 'datasets/movie_replica/titanic/titanic-movie-replica-dataset.json',
  },
  {
    movie_id: 'spirited_away',
    bundle_path: SPIRITED_AWAY_BUNDLE_PATH,
    output_path: 'datasets/movie_replica/spirited_away/spirited-away-movie-replica-dataset.json',
  },
] as const;

type JsonRecord = Record<string, unknown>;

export interface MovieReplicaEntry {
  replica_id: string;
  movie_id: string;
  scene_id: string;
  scene_geometry: JsonRecord;
  camera_profile: JsonRecord;
  blocking_profile: JsonRecord;
  composition_profile: JsonRecord;
  semantic_anchor: JsonRecord;
  trajectory_registry: { trajectory_count: number; trajectories: JsonRecord[] };
  pose_registry: { pose_count: number; poses: JsonRecord[] };
  camera_timeline_registry: { timeline_count: number; timeline: JsonRecord[] };
  temporal_registry_v2: { segment_count: number; segments: JsonRecord[] };
  identity_replacement_rules: JsonRecord;
  execution_flags: typeof EXECUTION_FLAGS;
  built_at: string;
}

export interface MovieReplicaDataset {
  dataset_id: string;
  phase: typeof MOVIE_REPLICA_PHASE;
  system_id: typeof MOVIE_REPLICA_SYSTEM_ID;
  movie_id: string;
  source_bundle_path: string;
  generated_at: string;
  scene_replica_count: number;
  scene_replicas: MovieReplicaEntry[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? (value as JsonRecord[]) : [];
}

function findById(items: JsonRecord[], idKey: string, id: string): JsonRecord | null {
  return items.find((item) => String(item[idKey] ?? '') === id) ?? null;
}

function filterByScene(items: JsonRecord[], sceneId: string): JsonRecord[] {
  return items.filter((item) => String(item.scene_id ?? '') === sceneId);
}

function filterTransitionsByScene(items: JsonRecord[], sceneId: string): JsonRecord[] {
  return items.filter(
    (item) => String(item.from_scene ?? '') === sceneId || String(item.to_scene ?? '') === sceneId
  );
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return 'unknown';
}

function resolveSceneList(root: string, movieId: string, bundle: JsonRecord): JsonRecord[] {
  if (movieId === 'titanic' && fs.existsSync(path.join(root, TITANIC_SCENE_MASTER_REGISTRY_PATH))) {
    const master = readJson<JsonRecord>(root, TITANIC_SCENE_MASTER_REGISTRY_PATH);
    const scenes = asArray(master.scenes);
    if (scenes.length > 0) return scenes;
  }

  const sceneRegistry = asRecord(bundle.scene_registry);
  return asArray(sceneRegistry?.scenes);
}

function loadRegistryItems(bundle: JsonRecord, registryKey: string, itemsKey: string): JsonRecord[] {
  const registry = asRecord(bundle[registryKey]);
  return asArray(registry?.[itemsKey]);
}

function loadEmbeddedRegistry(
  bundle: JsonRecord,
  layerKey: string,
  registryKey: string,
  itemsKey: string
): JsonRecord[] {
  const layer = asRecord(bundle[layerKey]);
  const registry = asRecord(layer?.[registryKey]);
  return asArray(registry?.[itemsKey]);
}

function buildSceneGeometry(
  movieId: string,
  scene: JsonRecord,
  geometryByScene: Map<string, JsonRecord>
): JsonRecord {
  const sceneId = String(scene.scene_id ?? '');
  const matched = geometryByScene.get(sceneId);
  if (matched) {
    return {
      scene_id: sceneId,
      geometry_source: movieId === 'titanic' ? 'scene_geometry_registry' : 'scene_geometry_registry',
      scene_category: firstString(matched.scene_category, scene.scene_category, scene.scene_type),
      environment_type: firstString(matched.environment_type, scene.environment_type),
      camera_position: matched.camera_position ?? null,
      camera_rotation: matched.camera_rotation ?? null,
      subject_positions: matched.subject_positions ?? [],
      prop_positions: matched.prop_positions ?? [],
      depth_layers: matched.depth_layers ?? [],
      structure_markers: matched.spirited_structure_markers ?? matched.structure_markers ?? [],
    };
  }

  return {
    scene_id: sceneId,
    geometry_source: 'scene_registry_fallback',
    scene_category: firstString(scene.scene_category, scene.scene_type),
    environment_type: firstString(scene.environment_type),
    structure_markers: [],
  };
}

function buildCameraProfile(
  scene: JsonRecord,
  cameraPatterns: JsonRecord[]
): JsonRecord {
  const cameraId = firstString(scene.camera_id, scene.bindings?.camera_pattern_id);
  const bindings = asRecord(scene.bindings);
  const patternId = firstString(bindings?.camera_pattern_id, cameraId);
  const pattern = findById(cameraPatterns, 'camera_pattern_id', patternId)
    ?? findById(cameraPatterns, 'camera_id', cameraId);

  return {
    camera_id: cameraId,
    camera_pattern_id: patternId,
    shot_type: firstString(pattern?.shot_type, 'medium_shot'),
    camera_language: firstString(pattern?.camera_language, pattern?.camera_motion_intent, 'preserve_movie_camera_grammar'),
    camera_height: firstString(pattern?.camera_height, 'eye_level'),
    camera_movement: firstString(pattern?.camera_movement, 'static'),
    fov_hint: firstString(pattern?.fov_hint, '50mm_equivalent'),
    framing_intent: firstString(pattern?.framing_intent, 'preserve_scene_grammar_not_world_identity'),
  };
}

function buildBlockingProfile(scene: JsonRecord, blockingPatterns: JsonRecord[]): JsonRecord {
  const blockingId = firstString(scene.blocking_id, scene.bindings?.blocking_pattern_id);
  const bindings = asRecord(scene.bindings);
  const patternId = firstString(bindings?.blocking_pattern_id, blockingId);
  const pattern = findById(blockingPatterns, 'blocking_pattern_id', patternId)
    ?? findById(blockingPatterns, 'blocking_id', blockingId);

  return {
    blocking_id: blockingId,
    blocking_pattern_id: patternId,
    blocking_layout: firstString(pattern?.blocking_layout, pattern?.blocking_type),
    blocking_intent: firstString(pattern?.blocking_intent, 'preserve_movie_blocking_geometry'),
    character_positions: pattern?.character_positions ?? scene.character_positions ?? [],
    primary_focus: firstString(pattern?.primary_focus),
    secondary_focus: firstString(pattern?.secondary_focus),
  };
}

function buildCompositionProfile(scene: JsonRecord, compositions: JsonRecord[]): JsonRecord {
  const compositionId = firstString(scene.composition_id, scene.bindings?.composition_id);
  const bindings = asRecord(scene.bindings);
  const patternId = firstString(bindings?.composition_id, compositionId);
  const pattern = findById(compositions, 'composition_id', patternId);

  return {
    composition_id: compositionId,
    composition_intent: firstString(pattern?.composition_intent, 'preserve_movie_framing_grammar'),
    depth_layers: pattern?.depth_layers ?? [],
    framing_rule: firstString(pattern?.framing_rule, pattern?.framing_intent),
    negative_space: firstString(pattern?.negative_space),
  };
}

function buildSemanticAnchor(
  scene: JsonRecord,
  anchors: JsonRecord[]
): JsonRecord {
  const bindings = asRecord(scene.bindings);
  const anchorIds = Array.isArray(scene.semantic_anchor_ids)
    ? (scene.semantic_anchor_ids as string[])
    : [];
  const anchorId = firstString(
    bindings?.semantic_anchor_id,
    anchorIds[0],
    scene.semantic_anchor_id
  );
  const anchor = findById(anchors, 'anchor_id', anchorId)
    ?? findById(anchors, 'semantic_anchor_id', anchorId);

  return {
    anchor_id: anchorId,
    semantic_anchor_id: anchorId,
    semantic_meaning: firstString(anchor?.semantic_meaning, 'movie_scene_semantic_preservation'),
    emotion: firstString(anchor?.emotion, scene.emotion_state, scene.emotion),
    participants: Number(anchor?.participants ?? 2),
    interaction_type: firstString(anchor?.interaction_type, 'scene_preservation'),
    preserved_meaning: anchor?.preserved_meaning ?? anchor?.structure_markers ?? [],
    gonegi_translation_ref: firstString(anchor?.gonegi_translation_ref),
  };
}

function buildIdentityReplacementRules(scene: JsonRecord): JsonRecord {
  const translation = asRecord(scene.gonegi_translation) ?? {};
  const targetCharacters = Array.isArray(translation.target_characters)
    ? (translation.target_characters as string[])
    : ['CHAR-gonagi', 'CHAR-dana'];

  return {
    world_identity: firstString(translation.target_world_identity, 'GONEGI_MEDITERRANEAN'),
    contract_ref: REPLACEMENT_CONTRACT_PATH,
    scene_characters: targetCharacters,
    replacement_strategy: 'inject_only_active_scene_characters',
    appearance_control: firstString(translation.appearance_control, 'gonegi_world_only'),
    structure_control: firstString(translation.structure_control, 'movie_dataset_only'),
  };
}

function buildMovieReplicaDataset(root: string, spec: (typeof MATERIALIZED_MOVIES)[number]): MovieReplicaDataset {
  const bundle = readJson<JsonRecord>(root, spec.bundle_path);

  const cameraPatterns = loadRegistryItems(bundle, 'camera_registry', 'camera_patterns');
  const blockingPatterns = loadRegistryItems(bundle, 'blocking_registry', 'blocking_patterns');
  const compositions = loadRegistryItems(bundle, 'composition_registry', 'compositions');
  const anchors = loadRegistryItems(bundle, 'semantic_anchor_registry', 'anchors');

  const geometryItems =
    movieGeometryItems(root, spec.movie_id, bundle);
  const geometryByScene = new Map(geometryItems.map((item) => [String(item.scene_id), item]));

  const trajectoriesAll = trajectoryItems(root, spec.movie_id, bundle);
  const posesAll = poseItems(root, spec.movie_id, bundle);
  const timelineAll = timelineItems(root, spec.movie_id, bundle);
  const temporalAll = temporalItems(root, spec.movie_id, bundle);

  const scenes = resolveSceneList(root, spec.movie_id, bundle);
  const builtAt = new Date().toISOString();

  const sceneReplicas: MovieReplicaEntry[] = scenes.map((scene, index) => {
    const sceneId = String(scene.scene_id ?? `scene_${index + 1}`);
    const trajectories = filterByScene(trajectoriesAll, sceneId);
    const poses = filterByScene(posesAll, sceneId);
    const timeline = filterByScene(timelineAll, sceneId);
    const temporalSegments = [
      ...filterByScene(temporalAll.sequences, sceneId),
      ...filterTransitionsByScene(temporalAll.transitions, sceneId),
    ];

    return {
      replica_id: `${spec.movie_id}_replica_${String(index + 1).padStart(4, '0')}`,
      movie_id: spec.movie_id,
      scene_id: sceneId,
      scene_geometry: buildSceneGeometry(spec.movie_id, scene, geometryByScene),
      camera_profile: buildCameraProfile(scene, cameraPatterns),
      blocking_profile: buildBlockingProfile(scene, blockingPatterns),
      composition_profile: buildCompositionProfile(scene, compositions),
      semantic_anchor: buildSemanticAnchor(scene, anchors),
      trajectory_registry: {
        trajectory_count: trajectories.length,
        trajectories,
      },
      pose_registry: {
        pose_count: poses.length,
        poses,
      },
      camera_timeline_registry: {
        timeline_count: timeline.length,
        timeline,
      },
      temporal_registry_v2: {
        segment_count: temporalSegments.length,
        segments: temporalSegments,
      },
      identity_replacement_rules: buildIdentityReplacementRules(scene),
      execution_flags: { ...EXECUTION_FLAGS },
      built_at: builtAt,
    };
  });

  return {
    dataset_id: `${spec.movie_id}-movie-replica-dataset-v1`,
    phase: MOVIE_REPLICA_PHASE,
    system_id: MOVIE_REPLICA_SYSTEM_ID,
    movie_id: spec.movie_id,
    source_bundle_path: spec.bundle_path,
    generated_at: builtAt,
    scene_replica_count: sceneReplicas.length,
    scene_replicas: sceneReplicas,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

function movieGeometryItems(root: string, movieId: string, bundle: JsonRecord): JsonRecord[] {
  if (movieId === 'titanic') {
    const geometryLayer = asRecord(bundle.scene_geometry_layer);
    const ref = String(geometryLayer?.scene_geometry_registry_ref ?? '');
    if (ref && fs.existsSync(path.join(root, ref))) {
      const registry = readJson<JsonRecord>(root, ref);
      return asArray(registry.scene_geometries);
    }
  }

  const motionLayer = asRecord(bundle.motion_layer);
  const subjectRegistry = asRecord(motionLayer?.subject_motion_registry);
  const subjectMotions = asArray(subjectRegistry?.subject_motions);
  if (subjectMotions.length > 0) {
    const sceneRegistry = asRecord(bundle.scene_registry);
    return asArray(sceneRegistry?.scenes).map((scene) => ({
      scene_id: scene.scene_id,
      scene_category: scene.scene_category,
      environment_type: scene.environment_type,
      structure_markers: scene.semantic_anchor_ids ?? [],
    }));
  }

  const sceneRegistry = asRecord(bundle.scene_registry);
  return asArray(sceneRegistry?.scenes);
}

function trajectoryItems(root: string, movieId: string, bundle: JsonRecord): JsonRecord[] {
  const motionLayer = asRecord(bundle.motion_layer);
  const cameraRegistry = asRecord(motionLayer?.camera_motion_registry);
  const cameraMotions = asArray(cameraRegistry?.camera_motions);
  if (cameraMotions.length > 0) {
    return cameraMotions.map((motion) => ({
      trajectory_id: firstString(motion.camera_motion_id, motion.trajectory_id),
      scene_id: motion.scene_id,
      start_position: motion.start_position ?? null,
      end_position: motion.end_position ?? null,
      movement_type: firstString(motion.motion_type, motion.trajectory, 'tracking_forward'),
      camera_speed: motion.speed ?? motion.camera_speed ?? 0.3,
      camera_curve: firstString(motion.speed_profile, motion.acceleration_profile, motion.camera_curve),
      trajectory_importance: 'narrative_support',
      video_compatible: true,
    }));
  }

  if (movieId === 'titanic') {
    const geometryLayer = asRecord(bundle.scene_geometry_layer);
    const ref = String(geometryLayer?.camera_trajectory_registry_ref ?? '');
    if (ref && fs.existsSync(path.join(root, ref))) {
      const registry = readJson<JsonRecord>(root, ref);
      return asArray(registry.trajectories);
    }
  }

  return [];
}

function poseItems(root: string, movieId: string, bundle: JsonRecord): JsonRecord[] {
  const motionLayer = asRecord(bundle.motion_layer);
  const subjectRegistry = asRecord(motionLayer?.subject_motion_registry);
  const subjectMotions = asArray(subjectRegistry?.subject_motions);
  if (subjectMotions.length > 0) {
    return subjectMotions.map((motion) => ({
      pose_id: firstString(motion.pose_id, motion.subject_motion_id),
      scene_id: motion.scene_id,
      character_id: motion.character_id,
      body_motion: motion.body_motion,
      gaze_motion: motion.gaze_motion,
      interaction_motion: motion.interaction_motion,
      head_rotation: motion.head_rotation ?? null,
      torso_rotation: motion.torso_rotation ?? null,
      pose_confidence: motion.pose_confidence ?? 0.94,
    }));
  }

  if (movieId === 'titanic') {
    const denseLayer = asRecord(bundle.titanic_dense_layer);
    const ref = String(denseLayer?.body_pose_registry_ref ?? '');
    if (ref && fs.existsSync(path.join(root, ref))) {
      const registry = readJson<JsonRecord>(root, ref);
      return asArray(registry.poses);
    }
  }

  return [];
}

function timelineItems(root: string, movieId: string, bundle: JsonRecord): JsonRecord[] {
  if (movieId === 'titanic') {
    const temporalLayer = asRecord(bundle.temporal_layer);
    const embeddedTimeline = asRecord(temporalLayer?.video_timeline_registry);
    if (embeddedTimeline) {
      return asArray(embeddedTimeline.timeline);
    }
    if (fs.existsSync(path.join(root, TITANIC_VIDEO_TIMELINE_REGISTRY_PATH))) {
      const registry = readJson<JsonRecord>(root, TITANIC_VIDEO_TIMELINE_REGISTRY_PATH);
      return asArray(registry.timeline);
    }
  }

  const shotLayer = asRecord(bundle.shot_layer);
  const shotRegistry = asRecord(shotLayer?.shot_registry);
  return asArray(shotRegistry?.shots).map((shot, index) => ({
    timeline_id: `timeline_${String(index + 1).padStart(5, '0')}`,
    scene_id: shot.scene_id,
    shot_id: shot.shot_id,
    shot_order: shot.shot_order ?? index + 1,
    duration: shot.duration ?? shot.shot_duration ?? 3,
    timestamp_start: shot.timestamp_start ?? null,
    timestamp_end: shot.timestamp_end ?? null,
  }));
}

function temporalItems(
  root: string,
  movieId: string,
  bundle: JsonRecord
): { sequences: JsonRecord[]; transitions: JsonRecord[] } {
  if (movieId === 'titanic') {
    const temporalLayer = asRecord(bundle.temporal_layer);
    const sceneTransitions = asRecord(temporalLayer?.scene_transition_registry);
    const videoSequence = asRecord(temporalLayer?.video_sequence_registry);
    return {
      sequences: asArray(videoSequence?.sequences),
      transitions: asArray(sceneTransitions?.scene_transitions),
    };
  }

  const temporalLayer = asRecord(bundle.temporal_layer);
  const shotSequenceRegistry = asRecord(temporalLayer?.shot_sequence_registry);
  const temporalTransitionRegistry = asRecord(temporalLayer?.temporal_transition_registry);
  return {
    sequences: asArray(shotSequenceRegistry?.sequences),
    transitions: asArray(temporalTransitionRegistry?.transitions),
  };
}

export function buildAllMovieReplicaDatasets(root: string): MovieReplicaDataset[] {
  return MATERIALIZED_MOVIES.map((spec) => buildMovieReplicaDataset(root, spec));
}

export function writeMovieReplicaDatasets(projectRoot?: string): MovieReplicaDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieReplicaDatasets(root);

  for (let i = 0; i < datasets.length; i += 1) {
    writeJson(root, MATERIALIZED_MOVIES[i].output_path, datasets[i]);
  }

  const registry = readJson<JsonRecord>(root, MOVIE_REPLICA_REGISTRY_PATH);
  registry.generated_at = new Date().toISOString();
  registry.replica_datasets = datasets.map((dataset, index) => ({
    movie_id: dataset.movie_id,
    dataset_id: dataset.dataset_id,
    dataset_path: MATERIALIZED_MOVIES[index].output_path,
    source_bundle_path: dataset.source_bundle_path,
    scene_replica_count: dataset.scene_replica_count,
    status: 'built',
  }));
  registry.source_movie_registry_ref = MOVIE_DATASET_REGISTRY_PATH;
  registry.execution_policy = SAFE_CREATE_POLICY;
  writeJson(root, MOVIE_REPLICA_REGISTRY_PATH, registry);

  return datasets;
}

export function loadMovieReplicaDataset(root: string, movieId: string): MovieReplicaDataset | null {
  const spec = MATERIALIZED_MOVIES.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return readJson<MovieReplicaDataset>(root, spec.output_path);
}

export function loadAllMovieReplicaDatasets(root: string): MovieReplicaDataset[] {
  return MATERIALIZED_MOVIES.map((spec) => readJson<MovieReplicaDataset>(root, spec.output_path)).filter(Boolean);
}
