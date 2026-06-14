import fs from 'node:fs';
import path from 'node:path';
import {
  MovieReplicaSceneGraphDataset,
  RuntimeSceneGraph,
  loadAllMovieReplicaSceneGraphDatasets,
} from './movieReplicaSceneGraphBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_TRAJECTORY_REPLAY_PHASE = 'PHASE-MOVIE-REPLICA-003' as const;
export const MOVIE_TRAJECTORY_REPLAY_SYSTEM_ID = 'MOVIE_TRAJECTORY_REPLAY_SYSTEM_V1' as const;
export const MOVIE_TRAJECTORY_REPLAY_PASS_VERDICT = 'PASS_MOVIE_TRAJECTORY_REPLAY_V1' as const;
export const MOVIE_TRAJECTORY_REPLAY_FAIL_VERDICT = 'FAIL_MOVIE_TRAJECTORY_REPLAY_V1' as const;

export const MOVIE_TRAJECTORY_REPLAY_SCHEMA_PATH =
  'datasets/movie_replica/movie-trajectory-replay.schema.json' as const;
export const MOVIE_TRAJECTORY_REPLAY_REPORT_PATH =
  'reports/movie_replica/MOVIE_TRAJECTORY_REPLAY_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

const TRAJECTORY_REPLAY_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_replica/titanic/titanic-movie-trajectory-replay.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_replica/spirited_away/spirited-away-movie-trajectory-replay.json',
  },
] as const;

type JsonRecord = Record<string, unknown>;

export interface TrajectoryReplayGraph {
  replay_id: string;
  movie_id: string;
  scene_id: string;
  runtime_id: string;
  replica_id: string;
  character_trajectory: { trajectory_count: number; trajectories: JsonRecord[] };
  camera_trajectory: { trajectory_count: number; trajectories: JsonRecord[] };
  prop_trajectory: { trajectory_count: number; trajectories: JsonRecord[] };
  timeline_segments: { segment_count: number; segments: JsonRecord[] };
  keyframe_sequence: { keyframe_count: number; keyframes: JsonRecord[] };
  motion_segments: { segment_count: number; segments: JsonRecord[] };
  execution_flags: typeof EXECUTION_FLAGS;
  built_at: string;
}

export interface MovieTrajectoryReplayDataset {
  replay_dataset_id: string;
  phase: typeof MOVIE_TRAJECTORY_REPLAY_PHASE;
  system_id: typeof MOVIE_TRAJECTORY_REPLAY_SYSTEM_ID;
  movie_id: string;
  source_scene_graph_dataset_id: string;
  generated_at: string;
  replay_graph_count: number;
  replay_graphs: TrajectoryReplayGraph[];
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

function buildCharacterTrajectory(graph: RuntimeSceneGraph): TrajectoryReplayGraph['character_trajectory'] {
  const trajectories = graph.character_nodes.map((node, index) => ({
    trajectory_id: `char_traj_${graph.replica_id}_${index + 1}`,
    character_id: String(node.character_id),
    source_node_id: String(node.node_id),
    waypoints: [
      {
        waypoint_index: 0,
        motion_state: firstString(node.body_motion, 'scene_pose_hold'),
        position: node.position ?? null,
        interaction_motion: firstString(node.interaction_motion, 'neutral'),
        timestamp_hint: 0,
      },
      {
        waypoint_index: 1,
        motion_state: firstString(node.body_motion, 'scene_pose_hold'),
        position: node.position ?? null,
        interaction_motion: firstString(node.interaction_motion, 'neutral'),
        timestamp_hint: null,
      },
    ],
  }));

  return {
    trajectory_count: trajectories.length,
    trajectories,
  };
}

function buildCameraTrajectory(graph: RuntimeSceneGraph): TrajectoryReplayGraph['camera_trajectory'] {
  const trajectories = graph.camera_nodes.map((node, index) => ({
    trajectory_id: firstString(node.trajectory_id, `cam_traj_${graph.replica_id}_${index + 1}`),
    camera_id: String(node.camera_id),
    source_node_id: String(node.node_id),
    start_position: node.start_position ?? null,
    end_position: node.end_position ?? null,
    movement_type: firstString(node.movement_type, 'static'),
    shot_type: firstString(node.shot_type, 'medium_shot'),
  }));

  return {
    trajectory_count: trajectories.length,
    trajectories,
  };
}

function buildPropTrajectory(graph: RuntimeSceneGraph): TrajectoryReplayGraph['prop_trajectory'] {
  const trajectories = graph.prop_nodes.map((node, index) => ({
    trajectory_id: `prop_traj_${graph.replica_id}_${index + 1}`,
    prop_id: String(node.prop_id),
    source_node_id: String(node.node_id),
    position: node.position ?? null,
    depth_layer: firstString(node.depth_layer, 'foreground'),
  }));

  return {
    trajectory_count: trajectories.length,
    trajectories,
  };
}

function buildTimelineSegments(graph: RuntimeSceneGraph): TrajectoryReplayGraph['timeline_segments'] {
  const segments = graph.timeline_edges.map((edge) => ({
    segment_id: String(edge.edge_id),
    source_ref: String(edge.source_ref),
    target_ref: String(edge.target_ref),
    edge_type: String(edge.edge_type),
    shot_order: Number(edge.shot_order ?? 0),
    duration: edge.duration ?? null,
    timestamp_start: edge.timestamp_start ?? null,
    timestamp_end: edge.timestamp_end ?? null,
  }));

  return {
    segment_count: segments.length,
    segments,
  };
}

function buildKeyframeSequence(graph: RuntimeSceneGraph): TrajectoryReplayGraph['keyframe_sequence'] {
  const shotLinks = graph.timeline_edges
    .filter((edge) => edge.edge_type === 'shot_sequence_link')
    .sort((a, b) => Number(a.shot_order ?? 0) - Number(b.shot_order ?? 0));

  const keyframes: JsonRecord[] = [];
  const seenRefs = new Set<string>();

  for (const edge of shotLinks) {
    const sourceRef = String(edge.source_ref);
    if (!seenRefs.has(sourceRef)) {
      seenRefs.add(sourceRef);
      keyframes.push({
        keyframe_id: `keyframe_${graph.replica_id}_${keyframes.length + 1}`,
        timeline_ref: sourceRef,
        shot_order: Number(edge.shot_order ?? keyframes.length + 1),
        timestamp_start: edge.timestamp_start ?? null,
        timestamp_end: edge.timestamp_end ?? null,
        duration: edge.duration ?? null,
        keyframe_role: keyframes.length === 0 ? 'scene_open' : 'shot_boundary',
      });
    }
  }

  if (shotLinks.length > 0) {
    const last = shotLinks[shotLinks.length - 1];
    const targetRef = String(last.target_ref);
    if (!seenRefs.has(targetRef)) {
      keyframes.push({
        keyframe_id: `keyframe_${graph.replica_id}_${keyframes.length + 1}`,
        timeline_ref: targetRef,
        shot_order: Number(last.shot_order ?? 0) + 1,
        timestamp_start: last.timestamp_end ?? null,
        timestamp_end: null,
        duration: null,
        keyframe_role: 'scene_close',
      });
    }
  }

  if (keyframes.length === 0) {
    for (const edge of graph.timeline_edges) {
      keyframes.push({
        keyframe_id: `keyframe_${graph.replica_id}_${keyframes.length + 1}`,
        timeline_ref: String(edge.source_ref),
        shot_order: Number(edge.shot_order ?? keyframes.length + 1),
        timestamp_start: edge.timestamp_start ?? null,
        timestamp_end: edge.timestamp_end ?? null,
        duration: edge.duration ?? null,
        keyframe_role: firstString(edge.edge_type, 'timeline_anchor'),
      });
    }
  }

  return {
    keyframe_count: keyframes.length,
    keyframes,
  };
}

function buildMotionSegments(
  graph: RuntimeSceneGraph,
  characterTrajectory: TrajectoryReplayGraph['character_trajectory'],
  cameraTrajectory: TrajectoryReplayGraph['camera_trajectory'],
  timelineSegments: TrajectoryReplayGraph['timeline_segments']
): TrajectoryReplayGraph['motion_segments'] {
  const primaryCamera = cameraTrajectory.trajectories[0] ?? null;
  const segments = timelineSegments.segments.map((segment, index) => ({
    motion_segment_id: `motion_seg_${graph.replica_id}_${index + 1}`,
    timeline_ref: String(segment.source_ref),
    duration: segment.duration ?? null,
    motion_type: String(segment.edge_type),
    character_motions: characterTrajectory.trajectories.map((trajectory) => ({
      character_id: trajectory.character_id,
      motion_state: trajectory.waypoints[0]?.motion_state ?? 'scene_pose_hold',
      interaction_motion: trajectory.waypoints[0]?.interaction_motion ?? 'neutral',
    })),
    camera_motion: primaryCamera
      ? {
          camera_id: primaryCamera.camera_id,
          movement_type: primaryCamera.movement_type,
          start_position: primaryCamera.start_position,
          end_position: primaryCamera.end_position,
        }
      : {
          camera_id: 'camera_primary',
          movement_type: 'static',
          start_position: null,
          end_position: null,
        },
  }));

  return {
    segment_count: segments.length,
    segments,
  };
}

export function buildTrajectoryReplayGraph(graph: RuntimeSceneGraph): TrajectoryReplayGraph {
  const builtAt = new Date().toISOString();
  const characterTrajectory = buildCharacterTrajectory(graph);
  const cameraTrajectory = buildCameraTrajectory(graph);
  const propTrajectory = buildPropTrajectory(graph);
  const timelineSegments = buildTimelineSegments(graph);
  const keyframeSequence = buildKeyframeSequence(graph);
  const motionSegments = buildMotionSegments(
    graph,
    characterTrajectory,
    cameraTrajectory,
    timelineSegments
  );

  return {
    replay_id: `${graph.movie_id}_replay_${graph.replica_id.replace(`${graph.movie_id}_replica_`, '')}`,
    movie_id: graph.movie_id,
    scene_id: graph.scene_id,
    runtime_id: graph.runtime_id,
    replica_id: graph.replica_id,
    character_trajectory: characterTrajectory,
    camera_trajectory: cameraTrajectory,
    prop_trajectory: propTrajectory,
    timeline_segments: timelineSegments,
    keyframe_sequence: keyframeSequence,
    motion_segments: motionSegments,
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: builtAt,
  };
}

export function buildMovieTrajectoryReplayDataset(
  dataset: MovieReplicaSceneGraphDataset
): MovieTrajectoryReplayDataset {
  const builtAt = new Date().toISOString();
  const replayGraphs = dataset.scene_graphs.map((graph) => buildTrajectoryReplayGraph(graph));

  return {
    replay_dataset_id: `${dataset.movie_id}-movie-trajectory-replay-v1`,
    phase: MOVIE_TRAJECTORY_REPLAY_PHASE,
    system_id: MOVIE_TRAJECTORY_REPLAY_SYSTEM_ID,
    movie_id: dataset.movie_id,
    source_scene_graph_dataset_id: dataset.graph_dataset_id,
    generated_at: builtAt,
    replay_graph_count: replayGraphs.length,
    replay_graphs: replayGraphs,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieTrajectoryReplayDatasets(root: string): MovieTrajectoryReplayDataset[] {
  const sceneGraphDatasets = loadAllMovieReplicaSceneGraphDatasets(root);
  return sceneGraphDatasets.map((dataset) => buildMovieTrajectoryReplayDataset(dataset));
}

export function writeMovieTrajectoryReplayGraphs(projectRoot?: string): MovieTrajectoryReplayDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieTrajectoryReplayDatasets(root);

  for (const spec of TRAJECTORY_REPLAY_OUTPUTS) {
    const dataset = datasets.find((item) => item.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieTrajectoryReplayDataset(
  root: string,
  movieId: string
): MovieTrajectoryReplayDataset | null {
  const spec = TRAJECTORY_REPLAY_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieTrajectoryReplayDataset;
}

export function loadAllMovieTrajectoryReplayDatasets(root: string): MovieTrajectoryReplayDataset[] {
  return TRAJECTORY_REPLAY_OUTPUTS.map((spec) => loadMovieTrajectoryReplayDataset(root, spec.movie_id)).filter(
    (dataset): dataset is MovieTrajectoryReplayDataset => dataset !== null
  );
}

export { TRAJECTORY_REPLAY_OUTPUTS, SAFE_CREATE_POLICY };
