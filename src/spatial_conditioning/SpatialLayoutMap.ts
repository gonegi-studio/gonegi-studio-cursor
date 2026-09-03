import type { RuntimeSpatialGraph, SpatialLayoutMap } from './types.js';
import {
  buildCharacterRegionConstraints,
  horizontalRegionFromX,
  normalizeDepthLayer,
} from './CharacterRegionConstraints.js';

function depthLayerFromGraphZ(z: number, declaredLayer: string): ReturnType<typeof normalizeDepthLayer> {
  if (declaredLayer) return normalizeDepthLayer(declaredLayer);
  if (z <= 0.35) return 'FOREGROUND';
  if (z <= 0.7) return 'MIDGROUND';
  return 'BACKGROUND';
}

export function buildSpatialLayoutMap(graph: RuntimeSpatialGraph): SpatialLayoutMap {
  const layout_elements = [
    ...graph.character_nodes.map((node) => ({
      element_id: node.character_id,
      element_type: 'character' as const,
      normalized_x: node.position[0],
      normalized_y: node.position[1],
      normalized_z: node.position[2],
      depth_layer: depthLayerFromGraphZ(node.position[2], node.depth_layer),
      horizontal_region: horizontalRegionFromX(node.position[0]),
    })),
    ...graph.environment_nodes.map((node) => ({
      element_id: node.anchor_id,
      element_type: 'environment' as const,
      normalized_x: node.position[0],
      normalized_y: node.position[1],
      normalized_z: node.position[2],
      depth_layer: depthLayerFromGraphZ(node.position[2], 'background'),
      horizontal_region: horizontalRegionFromX(node.position[0]),
    })),
    ...graph.prop_nodes.map((node) => ({
      element_id: node.prop_id,
      element_type: 'prop' as const,
      normalized_x: node.position[0],
      normalized_y: node.position[1],
      normalized_z: node.position[2],
      depth_layer: depthLayerFromGraphZ(node.position[2], node.depth_layer),
      horizontal_region: horizontalRegionFromX(node.position[0]),
    })),
    ...graph.camera_nodes.map((node) => ({
      element_id: node.node_id,
      element_type: 'camera' as const,
      normalized_x: node.position[0],
      normalized_y: node.position[1],
      normalized_z: node.position[2],
      depth_layer: 'MIDGROUND' as const,
      horizontal_region: horizontalRegionFromX(node.position[0]),
    })),
  ];

  const characterRegions = buildCharacterRegionConstraints(graph);
  const foreground = layout_elements
    .filter((entry) => entry.depth_layer === 'FOREGROUND')
    .map((entry) => entry.element_id);
  const midground = layout_elements
    .filter((entry) => entry.depth_layer === 'MIDGROUND')
    .map((entry) => entry.element_id);
  const background = layout_elements
    .filter((entry) => entry.depth_layer === 'BACKGROUND')
    .map((entry) => entry.element_id);

  const camera = graph.camera_nodes[0];

  return {
    scene_id: graph.scene_id,
    graph_id: graph.graph_id,
    layout_elements,
    depth_layers: {
      foreground,
      midground,
      background,
    },
    camera_frame: {
      position: camera?.position ?? [0.5, 0.5, 3],
      rotation: camera?.rotation ?? [0, 0, 0],
      distance: camera?.camera_distance ?? 3,
    },
  };
}
