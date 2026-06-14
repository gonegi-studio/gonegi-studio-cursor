import fs from 'node:fs';
import path from 'node:path';
import { REPLACEMENT_CONTRACT_PATH, WORLD_IDENTITY } from './characterReplacementContractBuilder.js';
import {
  MovieTrajectoryReplayDataset,
  TrajectoryReplayGraph,
  loadAllMovieTrajectoryReplayDatasets,
} from './movieTrajectoryReplayBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_KEYFRAME_RECONSTRUCTION_PHASE = 'PHASE-MOVIE-REPLICA-004' as const;
export const MOVIE_KEYFRAME_RECONSTRUCTION_SYSTEM_ID = 'MOVIE_KEYFRAME_RECONSTRUCTION_PLAN_V1' as const;
export const MOVIE_KEYFRAME_RECONSTRUCTION_PASS_VERDICT = 'PASS_MOVIE_KEYFRAME_RECONSTRUCTION_V1' as const;
export const MOVIE_KEYFRAME_RECONSTRUCTION_FAIL_VERDICT = 'FAIL_MOVIE_KEYFRAME_RECONSTRUCTION_V1' as const;

export const MOVIE_KEYFRAME_RECONSTRUCTION_SCHEMA_PATH =
  'datasets/movie_replica/movie-keyframe-reconstruction.schema.json' as const;
export const MOVIE_KEYFRAME_RECONSTRUCTION_REPORT_PATH =
  'reports/movie_replica/MOVIE_KEYFRAME_RECONSTRUCTION_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

const KEYFRAME_RECONSTRUCTION_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_replica/titanic/titanic-movie-keyframe-reconstruction.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_replica/spirited_away/spirited-away-movie-keyframe-reconstruction.json',
  },
] as const;

const CHARACTER_REPLACEMENT_MAP: Record<string, { target_id: string; target_name: string; priority: number }> = {
  'CHAR-gonagi': { target_id: 'gonegi', target_name: 'Gonegi', priority: 1 },
  'CHAR-dana': { target_id: 'dana', target_name: 'Dana', priority: 1 },
};

type JsonRecord = Record<string, unknown>;

export interface KeyframeReconstructionPlan {
  plan_id: string;
  movie_id: string;
  scene_id: string;
  keyframe_id: string;
  replay_id: string;
  timestamp: number;
  camera_state: JsonRecord;
  character_state: JsonRecord;
  environment_state: JsonRecord;
  reconstruction_priority: number;
  identity_replacement_map: JsonRecord;
  execution_flags: typeof EXECUTION_FLAGS;
  built_at: string;
}

export interface MovieKeyframeReconstructionDataset {
  plan_dataset_id: string;
  phase: typeof MOVIE_KEYFRAME_RECONSTRUCTION_PHASE;
  system_id: typeof MOVIE_KEYFRAME_RECONSTRUCTION_SYSTEM_ID;
  movie_id: string;
  source_replay_dataset_id: string;
  generated_at: string;
  scene_count: number;
  keyframe_plan_count: number;
  keyframe_plans: KeyframeReconstructionPlan[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return 'unknown';
}

function inferEnvironmentType(sceneId: string): string {
  if (sceneId.includes('promenade') || sceneId.includes('bathhouse')) return 'exterior_threshold';
  if (sceneId.includes('staircase') || sceneId.includes('salon') || sceneId.includes('hall')) {
    return 'interior_luxury';
  }
  if (sceneId.includes('engine') || sceneId.includes('boiler')) return 'industrial_interior';
  if (sceneId.includes('bridge') || sceneId.includes('rail') || sceneId.includes('harbor')) {
    return 'exterior_open';
  }
  return 'scene_environment';
}

function resolvePriority(keyframeRole: string, shotOrder: number): number {
  if (keyframeRole === 'scene_open') return 1;
  if (keyframeRole === 'scene_close') return 3;
  return shotOrder <= 2 ? 1 : 2;
}

function buildIdentityReplacementMap(replay: TrajectoryReplayGraph): JsonRecord {
  const characterIds = replay.character_trajectory.trajectories.map((trajectory) =>
    String(trajectory.character_id)
  );

  const mappings = characterIds.map((sourceId) => {
    const mapping = CHARACTER_REPLACEMENT_MAP[sourceId] ?? {
      target_id: sourceId.replace('CHAR-', '').toLowerCase(),
      target_name: sourceId.replace('CHAR-', ''),
      priority: 2,
    };
    return {
      source_character_id: sourceId,
      target_character_id: mapping.target_id,
      target_character_name: mapping.target_name,
      replacement_priority: mapping.priority,
    };
  });

  return {
    world_identity: WORLD_IDENTITY,
    contract_ref: REPLACEMENT_CONTRACT_PATH,
    mapping_count: mappings.length,
    mappings,
    replacement_ready: mappings.length > 0,
  };
}

function buildCharacterState(replay: TrajectoryReplayGraph): JsonRecord {
  const characters = replay.character_trajectory.trajectories.map((trajectory) => {
    const waypoint = (trajectory.waypoints as JsonRecord[] | undefined)?.[0] ?? {};
    return {
      character_id: String(trajectory.character_id),
      motion_state: firstString(waypoint.motion_state, 'scene_pose_hold'),
      interaction_motion: firstString(waypoint.interaction_motion, 'neutral'),
      position: waypoint.position ?? null,
      replacement_ready: true,
    };
  });

  return {
    character_count: characters.length,
    characters,
  };
}

function buildCameraState(replay: TrajectoryReplayGraph, keyframe: JsonRecord): JsonRecord {
  const camera = replay.camera_trajectory.trajectories[0] ?? {};

  return {
    camera_id: firstString(camera.camera_id, 'camera_primary'),
    movement_type: firstString(camera.movement_type, 'static'),
    shot_type: firstString(camera.shot_type, 'medium_shot'),
    start_position: camera.start_position ?? null,
    end_position: camera.end_position ?? null,
    timeline_ref: firstString(keyframe.timeline_ref),
    keyframe_role: firstString(keyframe.keyframe_role, 'shot_boundary'),
  };
}

function buildEnvironmentState(replay: TrajectoryReplayGraph): JsonRecord {
  return {
    scene_id: replay.scene_id,
    environment_type: inferEnvironmentType(replay.scene_id),
    prop_count: replay.prop_trajectory.trajectory_count,
    structure_control: 'movie_dataset_only',
    appearance_control: 'gonegi_world_only',
  };
}

function buildKeyframePlan(replay: TrajectoryReplayGraph, keyframe: JsonRecord, index: number): KeyframeReconstructionPlan {
  const builtAt = new Date().toISOString();
  const keyframeId = firstString(keyframe.keyframe_id, `keyframe_${index + 1}`);
  const keyframeRole = firstString(keyframe.keyframe_role, 'shot_boundary');
  const shotOrder = Number(keyframe.shot_order ?? index + 1);

  return {
    plan_id: `${replay.movie_id}_kf_plan_${replay.replica_id.replace(`${replay.movie_id}_replica_`, '')}_${index + 1}`,
    movie_id: replay.movie_id,
    scene_id: replay.scene_id,
    keyframe_id: keyframeId,
    replay_id: replay.replay_id,
    timestamp: Number(keyframe.timestamp_start ?? 0),
    camera_state: buildCameraState(replay, keyframe),
    character_state: buildCharacterState(replay),
    environment_state: buildEnvironmentState(replay),
    reconstruction_priority: resolvePriority(keyframeRole, shotOrder),
    identity_replacement_map: buildIdentityReplacementMap(replay),
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: builtAt,
  };
}

export function buildKeyframePlansForReplay(replay: TrajectoryReplayGraph): KeyframeReconstructionPlan[] {
  return replay.keyframe_sequence.keyframes.map((keyframe, index) =>
    buildKeyframePlan(replay, keyframe, index)
  );
}

export function buildMovieKeyframeReconstructionDataset(
  dataset: MovieTrajectoryReplayDataset
): MovieKeyframeReconstructionDataset {
  const builtAt = new Date().toISOString();
  const keyframePlans = dataset.replay_graphs.flatMap((replay) => buildKeyframePlansForReplay(replay));
  const sceneIds = new Set(dataset.replay_graphs.map((replay) => replay.scene_id));

  return {
    plan_dataset_id: `${dataset.movie_id}-movie-keyframe-reconstruction-v1`,
    phase: MOVIE_KEYFRAME_RECONSTRUCTION_PHASE,
    system_id: MOVIE_KEYFRAME_RECONSTRUCTION_SYSTEM_ID,
    movie_id: dataset.movie_id,
    source_replay_dataset_id: dataset.replay_dataset_id,
    generated_at: builtAt,
    scene_count: sceneIds.size,
    keyframe_plan_count: keyframePlans.length,
    keyframe_plans: keyframePlans,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieKeyframeReconstructionDatasets(root: string): MovieKeyframeReconstructionDataset[] {
  const replayDatasets = loadAllMovieTrajectoryReplayDatasets(root);
  return replayDatasets.map((dataset) => buildMovieKeyframeReconstructionDataset(dataset));
}

export function writeMovieKeyframeReconstructionPlans(projectRoot?: string): MovieKeyframeReconstructionDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieKeyframeReconstructionDatasets(root);

  for (const spec of KEYFRAME_RECONSTRUCTION_OUTPUTS) {
    const dataset = datasets.find((item) => item.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieKeyframeReconstructionDataset(
  root: string,
  movieId: string
): MovieKeyframeReconstructionDataset | null {
  const spec = KEYFRAME_RECONSTRUCTION_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieKeyframeReconstructionDataset;
}

export function loadAllMovieKeyframeReconstructionDatasets(root: string): MovieKeyframeReconstructionDataset[] {
  return KEYFRAME_RECONSTRUCTION_OUTPUTS.map((spec) =>
    loadMovieKeyframeReconstructionDataset(root, spec.movie_id)
  ).filter((dataset): dataset is MovieKeyframeReconstructionDataset => dataset !== null);
}

export { KEYFRAME_RECONSTRUCTION_OUTPUTS, SAFE_CREATE_POLICY };
