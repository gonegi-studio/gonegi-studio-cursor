import type { DepthConstraint, DepthLayerLabel, RuntimeSpatialGraph } from './types.js';
import { normalizeDepthLayer } from './CharacterRegionConstraints.js';

function depthPriority(layer: DepthLayerLabel): number {
  if (layer === 'FOREGROUND') return 1;
  if (layer === 'MIDGROUND') return 0.55;
  return 0.2;
}

function depthLayerFromZ(z: number): DepthLayerLabel {
  if (z <= 0.35) return 'FOREGROUND';
  if (z <= 0.7) return 'MIDGROUND';
  return 'BACKGROUND';
}

export function buildDepthConstraints(graph: RuntimeSpatialGraph): DepthConstraint[] {
  const constraints: DepthConstraint[] = [];

  for (const node of graph.character_nodes) {
    const layer = normalizeDepthLayer(node.depth_layer);
    constraints.push({
      element_id: node.character_id,
      element_type: 'character',
      depth_layer: layer,
      z_coordinate: node.position[2],
      generation_priority: depthPriority(layer),
    });
  }

  for (const node of graph.environment_nodes) {
    const layer = depthLayerFromZ(node.position[2] / 4);
    constraints.push({
      element_id: node.anchor_id,
      element_type: 'environment',
      depth_layer: layer,
      z_coordinate: node.position[2],
      generation_priority: 0.85,
    });
  }

  for (const node of graph.prop_nodes) {
    const layer = normalizeDepthLayer(node.depth_layer);
    constraints.push({
      element_id: node.prop_id,
      element_type: 'prop',
      depth_layer: layer,
      z_coordinate: node.position[2],
      generation_priority: depthPriority(layer),
    });
  }

  return constraints;
}

export function formatDepthConstraints(constraints: DepthConstraint[]): string[] {
  return constraints.map(
    (entry) =>
      `${entry.element_id} depth=${entry.depth_layer} z=${entry.z_coordinate.toFixed(4)} priority=${entry.generation_priority.toFixed(2)}`
  );
}
