import type {
  CharacterRegionConstraint,
  DepthLayerLabel,
  HorizontalRegion,
  RuntimeSpatialGraph,
  Vec3,
} from './types.js';

export function horizontalRegionFromX(x: number): HorizontalRegion {
  if (x < 0.2) return 'LEFT';
  if (x < 0.45) return 'CENTER_LEFT';
  if (x < 0.55) return 'CENTER';
  if (x < 0.8) return 'CENTER_RIGHT';
  return 'RIGHT';
}

export function normalizeDepthLayer(depthLayer: string): DepthLayerLabel {
  const normalized = depthLayer.toLowerCase();
  if (normalized === 'foreground') return 'FOREGROUND';
  if (normalized === 'background') return 'BACKGROUND';
  return 'MIDGROUND';
}

export function buildCharacterRegionConstraints(
  graph: RuntimeSpatialGraph
): CharacterRegionConstraint[] {
  return graph.character_nodes.map((node) => ({
    character_id: node.character_id,
    horizontal_region: horizontalRegionFromX(node.position[0]),
    screen_x: node.position[0],
    screen_y: node.position[1],
    depth_layer: normalizeDepthLayer(node.depth_layer),
    region_lock: 'hard' as const,
    position: node.position,
  }));
}

export function characterRegionsDiffer(
  left: CharacterRegionConstraint[],
  right: CharacterRegionConstraint[]
): boolean {
  if (left.length !== right.length) return true;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right.find((entry) => entry.character_id === a.character_id);
    if (!b) return true;
    if (a.horizontal_region !== b.horizontal_region) return true;
    if (a.position.join(',') !== b.position.join(',')) return true;
  }
  return false;
}

export function formatCharacterRegionConstraints(
  constraints: CharacterRegionConstraint[]
): string[] {
  return constraints.map(
    (entry) =>
      `${entry.character_id} region=${entry.horizontal_region} screen_x=${entry.screen_x.toFixed(4)} screen_y=${entry.screen_y.toFixed(4)} depth=${entry.depth_layer} region_lock=${entry.region_lock} position=[${entry.position.map((v) => v.toFixed(4)).join(',')}]`
  );
}

export function parseVec3(raw: string): Vec3 {
  const values = raw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((entry) => Number(entry.trim()));
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}
