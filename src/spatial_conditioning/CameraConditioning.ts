import type { CameraConstraint, RuntimeSpatialGraph } from './types.js';

function deriveShotType(distance: number): string {
  if (distance <= 1.5) return 'close_up';
  if (distance <= 2.5) return 'medium_close_up';
  if (distance <= 3.5) return 'medium_shot';
  if (distance <= 5) return 'medium_long_shot';
  return 'long_shot';
}

export function buildCameraConstraint(graph: RuntimeSpatialGraph): CameraConstraint {
  const camera = graph.camera_nodes[0];
  const distance = camera?.camera_distance ?? 3;
  return {
    camera_position: camera?.position ?? [0.5, 0.5, 3.5],
    camera_rotation: camera?.rotation ?? [0, 0, 0],
    camera_distance: distance,
    shot_type: camera?.shot_type ?? deriveShotType(distance),
    camera_height: camera?.camera_height ?? 'eye_level',
    framing_lock: 'hard',
  };
}

export function formatCameraConstraint(constraint: CameraConstraint): string {
  return [
    `position=[${constraint.camera_position.map((v) => v.toFixed(4)).join(',')}]`,
    `rotation=[${constraint.camera_rotation.map((v) => v.toFixed(4)).join(',')}]`,
    `distance=${constraint.camera_distance.toFixed(4)}`,
    `shot_type=${constraint.shot_type}`,
    `camera_height=${constraint.camera_height}`,
    `framing_lock=${constraint.framing_lock}`,
  ].join(' ');
}

export function cameraConstraintsEqual(left: CameraConstraint, right: CameraConstraint): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
