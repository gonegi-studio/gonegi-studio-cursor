import type { GazeConstraint, RuntimeSpatialGraph } from './types.js';

function relationshipLabel(direction: [number, number, number]): string {
  const [x] = direction;
  if (x > 0.5) return 'looking_right';
  if (x < -0.5) return 'looking_left';
  return 'looking_center';
}

export function buildGazeConstraints(graph: RuntimeSpatialGraph): GazeConstraint[] {
  return graph.gaze_edges.map((edge) => ({
    source_character_id: edge.source_node_id,
    target_character_id: edge.target_node_id,
    origin: edge.origin,
    direction: edge.direction,
    eye_target_relationship: relationshipLabel(edge.direction),
    face_direction_lock: 'hard',
  }));
}

export function formatGazeConstraints(constraints: GazeConstraint[]): string[] {
  return constraints.map(
    (entry) =>
      `${entry.source_character_id}->${entry.target_character_id ?? 'none'} origin=[${entry.origin.map((v) => v.toFixed(4)).join(',')}] direction=[${entry.direction.map((v) => v.toFixed(4)).join(',')}] relationship=${entry.eye_target_relationship} face_lock=${entry.face_direction_lock}`
  );
}

export function gazeDirectionEqual(left: GazeConstraint[], right: GazeConstraint[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a.eye_target_relationship !== b.eye_target_relationship) return false;
    if (a.direction.join(',') !== b.direction.join(',')) return false;
  }
  return true;
}

export function gazeOriginsDiffer(left: GazeConstraint[], right: GazeConstraint[]): boolean {
  if (left.length !== right.length) return true;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index].origin.join(',') !== right[index].origin.join(',')) return true;
  }
  return false;
}
