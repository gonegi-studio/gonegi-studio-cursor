import type { EnvironmentAnchorConstraint, RuntimeSpatialGraph } from './types.js';
import { normalizeDepthLayer } from './CharacterRegionConstraints.js';

const ANCHOR_KIND_PATTERNS: Array<{ pattern: RegExp; kind: string; importance: number }> = [
  { pattern: /staircase/i, kind: 'staircase', importance: 0.95 },
  { pattern: /table/i, kind: 'table', importance: 0.75 },
  { pattern: /window/i, kind: 'window', importance: 0.8 },
  { pattern: /door/i, kind: 'door', importance: 0.82 },
  { pattern: /rail/i, kind: 'railing', importance: 0.78 },
  { pattern: /lamp/i, kind: 'lamp', importance: 0.65 },
  { pattern: /salon|promenade|deck/i, kind: 'architectural_space', importance: 0.9 },
];

function resolveAnchorKind(anchorId: string): { kind: string; importance: number } {
  for (const entry of ANCHOR_KIND_PATTERNS) {
    if (entry.pattern.test(anchorId)) {
      return { kind: entry.kind, importance: entry.importance };
    }
  }
  return { kind: 'environment_anchor', importance: 0.7 };
}

export function buildEnvironmentAnchorConstraints(
  graph: RuntimeSpatialGraph
): EnvironmentAnchorConstraint[] {
  return graph.environment_nodes.map((node) => {
    const resolved = resolveAnchorKind(node.anchor_id);
    return {
      anchor_id: node.anchor_id,
      anchor_kind: resolved.kind,
      position: node.position,
      depth_layer: 'BACKGROUND',
      importance: resolved.importance,
      environment_type: node.environment_type,
      scene_category: node.scene_category,
    };
  });
}

export function formatEnvironmentConstraints(
  constraints: EnvironmentAnchorConstraint[]
): string[] {
  return constraints.map(
    (entry) =>
      `${entry.anchor_id} kind=${entry.anchor_kind} position=[${entry.position.map((v) => v.toFixed(4)).join(',')}] depth=${entry.depth_layer} importance=${entry.importance.toFixed(2)} env_type=${entry.environment_type} category=${entry.scene_category}`
  );
}

export function environmentConstraintsEqual(
  left: EnvironmentAnchorConstraint[],
  right: EnvironmentAnchorConstraint[]
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
