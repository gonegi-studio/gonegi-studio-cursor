import type { PropAnchorConstraint, RuntimeSpatialGraph } from './types.js';
import { normalizeDepthLayer } from './CharacterRegionConstraints.js';

function persistenceScore(propId: string, position: [number, number, number]): number {
  const seed =
    propId.length * 17 +
    position[0] * 1000 +
    position[1] * 100 +
    position[2] * 10;
  const normalized = (Math.sin(seed) + 1) / 2;
  return Number((0.65 + normalized * 0.34).toFixed(4));
}

const PROP_KINDS = ['chair', 'cup', 'book', 'suitcase', 'lifeboat'] as const;

function resolvePropKind(propId: string): string {
  const lower = propId.toLowerCase();
  for (const kind of PROP_KINDS) {
    if (lower.includes(kind)) return kind;
  }
  return 'scene_prop';
}

export function buildPropAnchorConstraints(graph: RuntimeSpatialGraph): PropAnchorConstraint[] {
  return graph.prop_nodes.map((node) => ({
    prop_id: node.prop_id,
    position: node.position,
    depth_layer: normalizeDepthLayer(node.depth_layer),
    spatial_persistence_score: persistenceScore(resolvePropKind(node.prop_id), node.position),
  }));
}

export function formatPropConstraints(constraints: PropAnchorConstraint[]): string[] {
  return constraints.map(
    (entry) =>
      `${entry.prop_id} position=[${entry.position.map((v) => v.toFixed(4)).join(',')}] depth=${entry.depth_layer} persistence=${entry.spatial_persistence_score.toFixed(4)}`
  );
}

export function propConstraintsEqual(
  left: PropAnchorConstraint[],
  right: PropAnchorConstraint[]
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
