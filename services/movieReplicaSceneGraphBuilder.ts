import fs from 'node:fs';
import path from 'node:path';
import {
  MovieReplicaDataset,
  MovieReplicaEntry,
  loadAllMovieReplicaDatasets,
} from './movieReplicaDatasetBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_SCENE_GRAPH_PHASE = 'PHASE-MOVIE-REPLICA-002' as const;
export const MOVIE_REPLICA_SCENE_GRAPH_SYSTEM_ID = 'MOVIE_REPLICA_SCENE_GRAPH_RUNTIME_V1' as const;
export const MOVIE_REPLICA_SCENE_GRAPH_PASS_VERDICT = 'PASS_MOVIE_REPLICA_SCENE_GRAPH_V1' as const;
export const MOVIE_REPLICA_SCENE_GRAPH_FAIL_VERDICT = 'FAIL_MOVIE_REPLICA_SCENE_GRAPH_V1' as const;

export const MOVIE_REPLICA_SCENE_GRAPH_SCHEMA_PATH =
  'datasets/movie_replica/movie-replica-scene-graph.schema.json' as const;
export const MOVIE_REPLICA_SCENE_GRAPH_REPORT_PATH =
  'reports/movie_replica/MOVIE_REPLICA_SCENE_GRAPH_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

const SCENE_GRAPH_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_replica/titanic/titanic-movie-replica-scene-graph.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_replica/spirited_away/spirited-away-movie-replica-scene-graph.json',
  },
] as const;

type JsonRecord = Record<string, unknown>;

export interface RuntimeSceneGraph {
  runtime_id: string;
  movie_id: string;
  scene_id: string;
  replica_id: string;
  character_nodes: JsonRecord[];
  prop_nodes: JsonRecord[];
  environment_nodes: JsonRecord[];
  camera_nodes: JsonRecord[];
  spatial_edges: JsonRecord[];
  semantic_edges: JsonRecord[];
  timeline_edges: JsonRecord[];
  execution_flags: typeof EXECUTION_FLAGS;
  built_at: string;
}

export interface MovieReplicaSceneGraphDataset {
  graph_dataset_id: string;
  phase: typeof MOVIE_REPLICA_SCENE_GRAPH_PHASE;
  system_id: typeof MOVIE_REPLICA_SCENE_GRAPH_SYSTEM_ID;
  movie_id: string;
  source_replica_dataset_id: string;
  generated_at: string;
  scene_graph_count: number;
  scene_graphs: RuntimeSceneGraph[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? (value as JsonRecord[]) : [];
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return 'unknown';
}

function buildCharacterNodes(entry: MovieReplicaEntry): JsonRecord[] {
  const identity = entry.identity_replacement_rules;
  const sceneCharacters = Array.isArray(identity.scene_characters)
    ? (identity.scene_characters as string[])
    : [];
  const poses = entry.pose_registry.poses;
  const subjectPositions = asArray(entry.scene_geometry.subject_positions);
  const contractRef = firstString(identity.contract_ref);

  const characterIds =
    poses.length > 0
      ? [...new Set(poses.map((pose) => String(pose.character_id ?? '')).filter(Boolean))]
      : sceneCharacters;

  if (characterIds.length === 0) {
    characterIds.push('CHAR-gonagi', 'CHAR-dana');
  }

  return characterIds.map((characterId, index) => {
    const pose = poses.find((item) => String(item.character_id ?? '') === characterId);
    const placement = subjectPositions.find((item) => String(item.subject_id ?? '') === characterId);

    return {
      node_id: `char_node_${entry.replica_id}_${index + 1}`,
      character_id: characterId,
      node_role: index === 0 ? 'primary_focus' : 'secondary_focus',
      pose_id: firstString(pose?.pose_id, `${entry.replica_id}_pose_${characterId}`),
      position: placement?.position ?? null,
      depth_layer: firstString(placement?.depth_layer, 'midground'),
      body_motion: pose?.body_motion ?? null,
      interaction_motion: pose?.interaction_motion ?? null,
      replacement_ready: true,
      identity_contract_ref: contractRef,
    };
  });
}

function buildPropNodes(entry: MovieReplicaEntry): JsonRecord[] {
  return asArray(entry.scene_geometry.prop_positions).map((prop, index) => ({
    node_id: `prop_node_${entry.replica_id}_${index + 1}`,
    prop_id: firstString(prop.prop_id, `prop_${index + 1}`),
    position: prop.position ?? null,
    depth_layer: firstString(prop.depth_layer, 'foreground'),
    interaction_state: firstString(prop.interaction_state, 'static_anchor'),
  }));
}

function buildEnvironmentNodes(entry: MovieReplicaEntry): JsonRecord[] {
  const geometry = entry.scene_geometry;
  return [
    {
      node_id: `env_node_${entry.replica_id}`,
      environment_type: firstString(geometry.environment_type, 'scene_environment'),
      scene_category: firstString(geometry.scene_category, 'general_scene'),
      structure_markers: asArray(geometry.structure_markers).map((marker) => String(marker)),
    },
  ];
}

function buildCameraNodes(entry: MovieReplicaEntry): JsonRecord[] {
  const camera = entry.camera_profile;
  const trajectories = entry.trajectory_registry.trajectories;

  if (trajectories.length === 0) {
    return [
      {
        node_id: `cam_node_${entry.replica_id}`,
        camera_id: firstString(camera.camera_id, 'camera_primary'),
        shot_type: firstString(camera.shot_type, 'medium_shot'),
        trajectory_id: null,
        start_position: null,
        end_position: null,
        movement_type: firstString(camera.camera_movement, 'static'),
      },
    ];
  }

  return trajectories.map((trajectory, index) => ({
    node_id: `cam_node_${entry.replica_id}_${index + 1}`,
    camera_id: firstString(camera.camera_id, trajectory.trajectory_id),
    shot_type: firstString(camera.shot_type, 'medium_shot'),
    trajectory_id: firstString(trajectory.trajectory_id, trajectory.camera_motion_id),
    start_position: trajectory.start_position ?? null,
    end_position: trajectory.end_position ?? null,
    movement_type: firstString(trajectory.movement_type, camera.camera_movement, 'static'),
  }));
}

function buildSpatialEdges(
  entry: MovieReplicaEntry,
  characterNodes: JsonRecord[],
  propNodes: JsonRecord[],
  environmentNodes: JsonRecord[],
  cameraNodes: JsonRecord[]
): JsonRecord[] {
  const edges: JsonRecord[] = [];
  const envNodeId = String(environmentNodes[0]?.node_id ?? '');
  const primaryCameraId = String(cameraNodes[0]?.node_id ?? '');

  for (const character of characterNodes) {
    const characterNodeId = String(character.node_id);

    if (envNodeId) {
      edges.push({
        edge_id: `spatial_${entry.replica_id}_${characterNodeId}_env`,
        source_node_id: characterNodeId,
        target_node_id: envNodeId,
        edge_type: 'character_in_environment',
        distance_hint: 'scene_blocking',
      });
    }

    if (primaryCameraId) {
      edges.push({
        edge_id: `spatial_${entry.replica_id}_${primaryCameraId}_${characterNodeId}`,
        source_node_id: primaryCameraId,
        target_node_id: characterNodeId,
        edge_type: 'camera_observes_character',
        distance_hint: firstString(entry.camera_profile.framing_intent, 'framed_subject'),
      });
    }

    for (const prop of propNodes) {
      edges.push({
        edge_id: `spatial_${entry.replica_id}_${characterNodeId}_${String(prop.node_id)}`,
        source_node_id: characterNodeId,
        target_node_id: String(prop.node_id),
        edge_type: 'character_near_prop',
        distance_hint: firstString(prop.depth_layer, 'interaction_range'),
      });
    }
  }

  for (const prop of propNodes) {
    if (envNodeId) {
      edges.push({
        edge_id: `spatial_${entry.replica_id}_${String(prop.node_id)}_${envNodeId}`,
        source_node_id: String(prop.node_id),
        target_node_id: envNodeId,
        edge_type: 'prop_in_environment',
        distance_hint: 'scene_layout',
      });
    }
  }

  return edges;
}

function buildSemanticEdges(entry: MovieReplicaEntry, characterNodes: JsonRecord[]): JsonRecord[] {
  const anchor = entry.semantic_anchor;
  const anchorId = firstString(anchor.anchor_id, anchor.semantic_anchor_id);

  return characterNodes.map((character, index) => ({
    edge_id: `semantic_${entry.replica_id}_${index + 1}`,
    source_node_id: String(character.node_id),
    anchor_id: anchorId,
    semantic_role: index === 0 ? 'primary_semantic_actor' : 'supporting_semantic_actor',
    emotion: firstString(anchor.emotion),
    interaction_type: firstString(anchor.interaction_type, 'scene_preservation'),
    semantic_meaning: firstString(anchor.semantic_meaning),
  }));
}

function buildTimelineEdges(entry: MovieReplicaEntry): JsonRecord[] {
  const edges: JsonRecord[] = [];
  const timeline = [...entry.camera_timeline_registry.timeline].sort(
    (a, b) => Number(a.shot_order ?? 0) - Number(b.shot_order ?? 0)
  );

  for (let i = 0; i < timeline.length; i += 1) {
    const current = timeline[i];
    const currentRef = firstString(current.timeline_id, current.shot_id, `timeline_${i + 1}`);
    const next = timeline[i + 1];

    if (next) {
      const nextRef = firstString(next.timeline_id, next.shot_id, `timeline_${i + 2}`);
      edges.push({
        edge_id: `timeline_${entry.replica_id}_${i + 1}`,
        source_ref: currentRef,
        target_ref: nextRef,
        edge_type: 'shot_sequence_link',
        shot_order: Number(current.shot_order ?? i + 1),
        duration: Number(current.duration ?? 0),
        timestamp_start: Number(current.timestamp_start ?? 0),
        timestamp_end: Number(current.timestamp_end ?? 0),
      });
    }
  }

  for (const segment of entry.temporal_registry_v2.segments) {
    if ('transition_id' in segment) {
      edges.push({
        edge_id: `timeline_${entry.replica_id}_trans_${firstString(segment.transition_id)}`,
        source_ref: firstString(segment.from_scene, entry.scene_id),
        target_ref: firstString(segment.to_scene),
        edge_type: 'scene_transition_link',
        transition_type: firstString(segment.transition_type, 'continuity_hold'),
        duration: null,
        timestamp_start: null,
        timestamp_end: null,
      });
    } else if ('sequence_id' in segment) {
      const orderedShots = asArray(segment.ordered_shot_ids);
      for (let i = 0; i < orderedShots.length - 1; i += 1) {
        edges.push({
          edge_id: `timeline_${entry.replica_id}_seq_${firstString(segment.sequence_id)}_${i + 1}`,
          source_ref: String(orderedShots[i]),
          target_ref: String(orderedShots[i + 1]),
          edge_type: 'sequence_shot_link',
          shot_order: i + 1,
          duration: Number(segment.sequence_duration ?? 0) / Math.max(orderedShots.length, 1),
          timestamp_start: null,
          timestamp_end: null,
        });
      }
    }
  }

  if (edges.length === 0 && timeline.length > 0) {
    const only = timeline[0];
    edges.push({
      edge_id: `timeline_${entry.replica_id}_singleton`,
      source_ref: firstString(only.timeline_id, only.shot_id, entry.scene_id),
      target_ref: entry.scene_id,
      edge_type: 'scene_timeline_anchor',
      shot_order: Number(only.shot_order ?? 1),
      duration: Number(only.duration ?? 0),
      timestamp_start: Number(only.timestamp_start ?? 0),
      timestamp_end: Number(only.timestamp_end ?? 0),
    });
  }

  return edges;
}

export function buildRuntimeSceneGraph(entry: MovieReplicaEntry): RuntimeSceneGraph {
  const builtAt = new Date().toISOString();
  const characterNodes = buildCharacterNodes(entry);
  const propNodes = buildPropNodes(entry);
  const environmentNodes = buildEnvironmentNodes(entry);
  const cameraNodes = buildCameraNodes(entry);

  return {
    runtime_id: `${entry.movie_id}_runtime_${entry.replica_id.replace(`${entry.movie_id}_replica_`, '')}`,
    movie_id: entry.movie_id,
    scene_id: entry.scene_id,
    replica_id: entry.replica_id,
    character_nodes: characterNodes,
    prop_nodes: propNodes,
    environment_nodes: environmentNodes,
    camera_nodes: cameraNodes,
    spatial_edges: buildSpatialEdges(entry, characterNodes, propNodes, environmentNodes, cameraNodes),
    semantic_edges: buildSemanticEdges(entry, characterNodes),
    timeline_edges: buildTimelineEdges(entry),
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: builtAt,
  };
}

export function buildMovieReplicaSceneGraphDataset(dataset: MovieReplicaDataset): MovieReplicaSceneGraphDataset {
  const builtAt = new Date().toISOString();
  const sceneGraphs = dataset.scene_replicas.map((entry) => buildRuntimeSceneGraph(entry));

  return {
    graph_dataset_id: `${dataset.movie_id}-movie-replica-scene-graph-v1`,
    phase: MOVIE_REPLICA_SCENE_GRAPH_PHASE,
    system_id: MOVIE_REPLICA_SCENE_GRAPH_SYSTEM_ID,
    movie_id: dataset.movie_id,
    source_replica_dataset_id: dataset.dataset_id,
    generated_at: builtAt,
    scene_graph_count: sceneGraphs.length,
    scene_graphs: sceneGraphs,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieReplicaSceneGraphDatasets(root: string): MovieReplicaSceneGraphDataset[] {
  const replicaDatasets = loadAllMovieReplicaDatasets(root);
  return replicaDatasets.map((dataset) => buildMovieReplicaSceneGraphDataset(dataset));
}

export function writeMovieReplicaSceneGraphs(projectRoot?: string): MovieReplicaSceneGraphDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieReplicaSceneGraphDatasets(root);

  for (const spec of SCENE_GRAPH_OUTPUTS) {
    const dataset = datasets.find((item) => item.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieReplicaSceneGraphDataset(
  root: string,
  movieId: string
): MovieReplicaSceneGraphDataset | null {
  const spec = SCENE_GRAPH_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieReplicaSceneGraphDataset;
}

export function loadAllMovieReplicaSceneGraphDatasets(root: string): MovieReplicaSceneGraphDataset[] {
  return SCENE_GRAPH_OUTPUTS.map((spec) => loadMovieReplicaSceneGraphDataset(root, spec.movie_id)).filter(
    (dataset): dataset is MovieReplicaSceneGraphDataset => dataset !== null
  );
}

export { SCENE_GRAPH_OUTPUTS, SAFE_CREATE_POLICY };
