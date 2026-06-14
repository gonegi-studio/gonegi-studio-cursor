import fs from 'node:fs';
import path from 'node:path';
import {
  MovieSpatialEngineDataset,
  MovieSpatialSceneRecord,
  SPATIAL_ENGINE_OUTPUTS,
  loadAllMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_SPATIAL_GRAPH_PHASE = 'PHASE-MOVIE-SPATIAL-002' as const;
export const MOVIE_SPATIAL_GRAPH_SYSTEM_ID = 'MOVIE_SPATIAL_GRAPH_V1' as const;
export const MOVIE_SPATIAL_GRAPH_PASS_VERDICT = 'PASS_MOVIE_SPATIAL_GRAPH_V1' as const;
export const MOVIE_SPATIAL_GRAPH_FAIL_VERDICT = 'FAIL_MOVIE_SPATIAL_GRAPH_V1' as const;

export const MOVIE_SPATIAL_GRAPH_SCHEMA_PATH =
  'datasets/movie_spatial/movie-spatial-graph.schema.json' as const;
export const MOVIE_SPATIAL_GRAPH_REPORT_PATH =
  'reports/movie_spatial/MOVIE_SPATIAL_GRAPH_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const SPATIAL_GRAPH_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_spatial/titanic/titanic-movie-spatial-graph.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_spatial/spirited_away/spirited-away-movie-spatial-graph.json',
  },
] as const;

export interface SpatialCameraNode {
  node_id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  camera_distance: number;
  camera_height: string;
  camera_target: [number, number, number];
}

export interface SpatialCharacterNode {
  node_id: string;
  character_id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  depth_layer: string;
}

export interface SpatialPropNode {
  node_id: string;
  prop_id: string;
  position: [number, number, number];
  depth_layer: string;
}

export interface SpatialEnvironmentNode {
  node_id: string;
  anchor_id: string;
  position: [number, number, number];
  environment_type: string;
  scene_category: string;
}

export interface SpatialEdge {
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  distance_hint?: string;
}

export interface VisibilityEdge {
  edge_id: string;
  observer_node_id: string;
  target_node_id: string;
  visible: boolean;
  occlusion_hint: string;
}

export interface GazeEdge {
  edge_id: string;
  source_node_id: string;
  target_node_id: string | null;
  origin: [number, number, number];
  direction: [number, number, number];
}

export interface DepthEdge {
  edge_id: string;
  source_node_id: string;
  depth_layer: string;
  depth_range: [number, number];
}

export interface InteractionEdge {
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  interaction_type: string;
}

export interface MovieSpatialGraph {
  graph_id: string;
  movie_id: string;
  scene_id: string;
  spatial_id: string;
  camera_nodes: SpatialCameraNode[];
  character_nodes: SpatialCharacterNode[];
  prop_nodes: SpatialPropNode[];
  environment_nodes: SpatialEnvironmentNode[];
  spatial_edges: SpatialEdge[];
  visibility_edges: VisibilityEdge[];
  gaze_edges: GazeEdge[];
  depth_edges: DepthEdge[];
  interaction_edges: InteractionEdge[];
}

export interface MovieSpatialGraphDataset {
  graph_dataset_id: string;
  phase: typeof MOVIE_SPATIAL_GRAPH_PHASE;
  system_id: typeof MOVIE_SPATIAL_GRAPH_SYSTEM_ID;
  movie_id: string;
  source_spatial_engine_id: string;
  source_spatial_engine_ref: string;
  generated_at: string;
  scene_spatial_graph_count: number;
  spatial_graphs: MovieSpatialGraph[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function refForMovie<T extends { movie_id: string; output_path: string }>(
  specs: readonly T[],
  movieId: string
): string {
  const spec = specs.find((entry) => entry.movie_id === movieId);
  if (!spec) throw new Error(`Missing ref spec for movie_id=${movieId}`);
  return spec.output_path;
}

function buildCameraNodes(scene: MovieSpatialSceneRecord): SpatialCameraNode[] {
  return [
    {
      node_id: `cam_node_${scene.spatial_id}`,
      position: scene.camera_position,
      rotation: scene.camera_rotation,
      camera_distance: scene.camera_distance,
      camera_height: scene.camera_height,
      camera_target: scene.camera_target,
    },
  ];
}

function buildCharacterNodes(scene: MovieSpatialSceneRecord): SpatialCharacterNode[] {
  return scene.character_coordinates.map((character, index) => ({
    node_id: `char_node_${scene.spatial_id}_${index + 1}`,
    character_id: character.character_id,
    position: character.position,
    rotation: character.rotation,
    depth_layer: character.depth_layer,
  }));
}

function buildPropNodes(scene: MovieSpatialSceneRecord): SpatialPropNode[] {
  return scene.prop_coordinates.map((prop, index) => ({
    node_id: `prop_node_${scene.spatial_id}_${index + 1}`,
    prop_id: prop.prop_id,
    position: prop.position,
    depth_layer: prop.depth_layer,
  }));
}

function buildEnvironmentNodes(scene: MovieSpatialSceneRecord): SpatialEnvironmentNode[] {
  const anchor = scene.environment_anchor;
  return [
    {
      node_id: `env_node_${scene.spatial_id}`,
      anchor_id: anchor.anchor_id,
      position: anchor.position,
      environment_type: anchor.environment_type,
      scene_category: anchor.scene_category,
    },
  ];
}

function buildSpatialEdges(
  scene: MovieSpatialSceneRecord,
  cameraNodes: SpatialCameraNode[],
  characterNodes: SpatialCharacterNode[],
  propNodes: SpatialPropNode[],
  environmentNodes: SpatialEnvironmentNode[]
): SpatialEdge[] {
  const edges: SpatialEdge[] = [];
  const envNodeId = environmentNodes[0]?.node_id ?? '';
  const cameraNodeId = cameraNodes[0]?.node_id ?? '';

  for (const character of characterNodes) {
    if (envNodeId) {
      edges.push({
        edge_id: `spatial_${scene.spatial_id}_${character.node_id}_env`,
        source_node_id: character.node_id,
        target_node_id: envNodeId,
        edge_type: 'character_in_environment',
        distance_hint: 'scene_blocking',
      });
    }

    if (cameraNodeId) {
      edges.push({
        edge_id: `spatial_${scene.spatial_id}_${cameraNodeId}_${character.node_id}`,
        source_node_id: cameraNodeId,
        target_node_id: character.node_id,
        edge_type: 'camera_observes_character',
        distance_hint: 'framed_subject',
      });
    }

    for (const prop of propNodes) {
      edges.push({
        edge_id: `spatial_${scene.spatial_id}_${character.node_id}_${prop.node_id}`,
        source_node_id: character.node_id,
        target_node_id: prop.node_id,
        edge_type: 'character_near_prop',
        distance_hint: prop.depth_layer,
      });
    }
  }

  for (const prop of propNodes) {
    if (envNodeId) {
      edges.push({
        edge_id: `spatial_${scene.spatial_id}_${prop.node_id}_${envNodeId}`,
        source_node_id: prop.node_id,
        target_node_id: envNodeId,
        edge_type: 'prop_in_environment',
        distance_hint: 'scene_layout',
      });
    }
  }

  return edges;
}

function buildVisibilityEdges(
  scene: MovieSpatialSceneRecord,
  cameraNodes: SpatialCameraNode[],
  characterNodes: SpatialCharacterNode[],
  propNodes: SpatialPropNode[],
  environmentNodes: SpatialEnvironmentNode[]
): VisibilityEdge[] {
  const edges: VisibilityEdge[] = [];
  const cameraNodeId = cameraNodes[0]?.node_id ?? '';

  if (!cameraNodeId) return edges;

  const targets = [...characterNodes, ...propNodes, ...environmentNodes];
  for (const target of targets) {
    const targetId = 'node_id' in target ? target.node_id : '';
    const depthLayer = 'depth_layer' in target ? target.depth_layer : 'background';
    edges.push({
      edge_id: `visibility_${scene.spatial_id}_${cameraNodeId}_${targetId}`,
      observer_node_id: cameraNodeId,
      target_node_id: targetId,
      visible: true,
      occlusion_hint: depthLayer === 'foreground' ? 'partial_occlusion_possible' : 'clear_line_of_sight',
    });
  }

  return edges;
}

function buildGazeEdges(
  scene: MovieSpatialSceneRecord,
  characterNodes: SpatialCharacterNode[]
): GazeEdge[] {
  const nodeByCharacter = new Map(characterNodes.map((node) => [node.character_id, node.node_id]));

  return scene.gaze_vectors.map((gaze, index) => {
    const sourceNodeId = nodeByCharacter.get(gaze.character_id) ?? `char_node_${scene.spatial_id}_${index + 1}`;
    const partner = characterNodes.find((node) => node.character_id !== gaze.character_id);
    return {
      edge_id: `gaze_${scene.spatial_id}_${index + 1}`,
      source_node_id: sourceNodeId,
      target_node_id: partner?.node_id ?? null,
      origin: gaze.origin,
      direction: gaze.direction,
    };
  });
}

function buildDepthEdges(
  scene: MovieSpatialSceneRecord,
  characterNodes: SpatialCharacterNode[],
  propNodes: SpatialPropNode[]
): DepthEdge[] {
  const edges: DepthEdge[] = [];
  const layouts = [
    scene.foreground_layout,
    scene.midground_layout,
    scene.background_layout,
  ];

  for (const layout of layouts) {
    for (const elementId of layout.element_ids) {
      const character = characterNodes.find((node) => node.character_id === elementId);
      const prop = propNodes.find((node) => node.prop_id === elementId);
      const sourceNodeId = character?.node_id ?? prop?.node_id;
      if (!sourceNodeId) continue;

      edges.push({
        edge_id: `depth_${scene.spatial_id}_${layout.layer_id}_${elementId}`,
        source_node_id: sourceNodeId,
        depth_layer: layout.layer_id,
        depth_range: layout.depth_range,
      });
    }
  }

  for (const character of characterNodes) {
    const layout =
      character.depth_layer === 'foreground'
        ? scene.foreground_layout
        : character.depth_layer === 'background'
          ? scene.background_layout
          : scene.midground_layout;

    edges.push({
      edge_id: `depth_${scene.spatial_id}_${character.node_id}`,
      source_node_id: character.node_id,
      depth_layer: layout.layer_id,
      depth_range: layout.depth_range,
    });
  }

  for (const prop of propNodes) {
    const layout =
      prop.depth_layer === 'foreground'
        ? scene.foreground_layout
        : prop.depth_layer === 'background'
          ? scene.background_layout
          : scene.midground_layout;

    edges.push({
      edge_id: `depth_${scene.spatial_id}_${prop.node_id}`,
      source_node_id: prop.node_id,
      depth_layer: layout.layer_id,
      depth_range: layout.depth_range,
    });
  }

  return edges;
}

function buildInteractionEdges(characterNodes: SpatialCharacterNode[]): InteractionEdge[] {
  const edges: InteractionEdge[] = [];

  for (let i = 0; i < characterNodes.length; i += 1) {
    for (let j = i + 1; j < characterNodes.length; j += 1) {
      const source = characterNodes[i];
      const target = characterNodes[j];
      edges.push({
        edge_id: `interaction_${source.node_id}_${target.node_id}`,
        source_node_id: source.node_id,
        target_node_id: target.node_id,
        interaction_type: 'scene_blocking_pair',
      });
    }
  }

  return edges;
}

export function buildMovieSpatialGraph(scene: MovieSpatialSceneRecord): MovieSpatialGraph {
  const cameraNodes = buildCameraNodes(scene);
  const characterNodes = buildCharacterNodes(scene);
  const propNodes = buildPropNodes(scene);
  const environmentNodes = buildEnvironmentNodes(scene);

  return {
    graph_id: `${scene.movie_id}_spatial_graph_${scene.scene_id}`,
    movie_id: scene.movie_id,
    scene_id: scene.scene_id,
    spatial_id: scene.spatial_id,
    camera_nodes: cameraNodes,
    character_nodes: characterNodes,
    prop_nodes: propNodes,
    environment_nodes: environmentNodes,
    spatial_edges: buildSpatialEdges(scene, cameraNodes, characterNodes, propNodes, environmentNodes),
    visibility_edges: buildVisibilityEdges(scene, cameraNodes, characterNodes, propNodes, environmentNodes),
    gaze_edges: buildGazeEdges(scene, characterNodes),
    depth_edges: buildDepthEdges(scene, characterNodes, propNodes),
    interaction_edges: buildInteractionEdges(characterNodes),
  };
}

export function buildMovieSpatialGraphDataset(
  spatialEngineDataset: MovieSpatialEngineDataset
): MovieSpatialGraphDataset {
  const spatialGraphs = spatialEngineDataset.spatial_scenes.map((scene) => buildMovieSpatialGraph(scene));

  return {
    graph_dataset_id: `${spatialEngineDataset.movie_id}-movie-spatial-graph-v1`,
    phase: MOVIE_SPATIAL_GRAPH_PHASE,
    system_id: MOVIE_SPATIAL_GRAPH_SYSTEM_ID,
    movie_id: spatialEngineDataset.movie_id,
    source_spatial_engine_id: spatialEngineDataset.dataset_id,
    source_spatial_engine_ref: refForMovie(SPATIAL_ENGINE_OUTPUTS, spatialEngineDataset.movie_id),
    generated_at: new Date().toISOString(),
    scene_spatial_graph_count: spatialGraphs.length,
    spatial_graphs: spatialGraphs,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieSpatialGraphDatasets(root: string): MovieSpatialGraphDataset[] {
  const spatialEngineDatasets = loadAllMovieSpatialEngineDatasets(root);
  return spatialEngineDatasets.map((dataset) => buildMovieSpatialGraphDataset(dataset));
}

export function writeMovieSpatialGraphDatasets(projectRoot?: string): MovieSpatialGraphDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieSpatialGraphDatasets(root);

  for (const spec of SPATIAL_GRAPH_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieSpatialGraphDataset(root: string, movieId: string): MovieSpatialGraphDataset | null {
  const spec = SPATIAL_GRAPH_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieSpatialGraphDataset;
}

export function loadAllMovieSpatialGraphDatasets(root: string): MovieSpatialGraphDataset[] {
  return SPATIAL_GRAPH_OUTPUTS.map((spec) => loadMovieSpatialGraphDataset(root, spec.movie_id)).filter(
    (dataset): dataset is MovieSpatialGraphDataset => dataset !== null
  );
}

export { SAFE_CREATE_POLICY };
