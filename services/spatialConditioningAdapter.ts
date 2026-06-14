import type { MovieSpatialGraph } from './movieSpatialGraphBuilder.js';
import type { RuntimeSpatialGraph } from '../src/spatial_conditioning/types.js';
import {
  SpatialConditioningEngine,
  buildConditionedGenerationPrompt,
  buildSpatialConditioningBundle,
} from '../src/spatial_conditioning/SpatialConditioningEngine.js';
import { runtimeSpatialGraphFromScenario } from '../src/spatial_conditioning/ScenarioGraphParser.js';

export function runtimeSpatialGraphFromMovieSpatialGraph(
  graph: MovieSpatialGraph
): RuntimeSpatialGraph {
  return {
    graph_id: graph.graph_id,
    movie_id: graph.movie_id,
    scene_id: graph.scene_id,
    spatial_id: graph.spatial_id,
    camera_nodes: graph.camera_nodes.map((node) => ({
      node_id: node.node_id,
      position: node.position,
      rotation: node.rotation,
      camera_distance: node.camera_distance,
      camera_height: node.camera_height,
      camera_target: node.camera_target,
    })),
    character_nodes: graph.character_nodes.map((node) => ({
      node_id: node.node_id,
      character_id: node.character_id,
      position: node.position,
      rotation: node.rotation,
      depth_layer: node.depth_layer,
    })),
    prop_nodes: graph.prop_nodes.map((node) => ({
      node_id: node.node_id,
      prop_id: node.prop_id,
      position: node.position,
      depth_layer: node.depth_layer,
    })),
    environment_nodes: graph.environment_nodes.map((node) => ({
      node_id: node.node_id,
      anchor_id: node.anchor_id,
      position: node.position,
      environment_type: node.environment_type,
      scene_category: node.scene_category,
    })),
    gaze_edges: graph.gaze_edges.map((edge) => ({
      edge_id: edge.edge_id,
      source_node_id: edge.source_node_id,
      target_node_id: edge.target_node_id,
      origin: edge.origin,
      direction: edge.direction,
    })),
    depth_edges: graph.depth_edges.map((edge) => ({
      edge_id: edge.edge_id,
      source_node_id: edge.source_node_id,
      depth_layer: edge.depth_layer,
      depth_range: edge.depth_range,
    })),
  };
}

export function generateConditionedScenarioFromSpatialGraph(
  graph: MovieSpatialGraph,
  legacyScenario?: string
): string {
  const runtimeGraph = runtimeSpatialGraphFromMovieSpatialGraph(graph);
  const engine = new SpatialConditioningEngine(graph.movie_id);
  return engine.buildPrompt(runtimeGraph, legacyScenario);
}

export function generateConditionedScenarioFromScenarioText(scenario: string): string {
  const runtimeGraph = runtimeSpatialGraphFromScenario(scenario);
  const engine = new SpatialConditioningEngine(runtimeGraph.movie_id);
  return engine.buildPrompt(runtimeGraph, scenario);
}

export {
  SpatialConditioningEngine,
  buildSpatialConditioningBundle,
  buildConditionedGenerationPrompt,
  runtimeSpatialGraphFromScenario,
};
