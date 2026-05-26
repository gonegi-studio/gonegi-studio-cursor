import crypto from "crypto";
import type { RealV826UltraDenseSequenceEdge } from "./real-v826-ultra-dense-cinematic-dna-export-adapter.ts";

export type RealTemporalDedupedSequenceEdge = RealV826UltraDenseSequenceEdge & {
  deduplicationStatus: "unique" | "normalized" | "differentiated";
  duplicateGroupId: string | null;
  semanticVariant: string;
  semanticRole: string;
  normalizedPredicate: string;
  edgeUsefulnessScore: number;
  deduplicationNote: string;
};

export type RealTemporalEdgeSemanticDeduplicationGroupResult = {
  groupKind: string;
  inputEdgeCount: number;
  outputEdgeCount: number;
  differentiatedCount: number;
  normalizedCount: number;
  uniqueCount: number;
  edges: readonly RealTemporalDedupedSequenceEdge[];
};

export type RealTemporalEdgeSemanticDeduplicationRecordResult = {
  recordId: string;
  totalInputEdges: number;
  totalOutputEdges: number;
  duplicatePredicateGroupsResolved: number;
  groups: readonly RealTemporalEdgeSemanticDeduplicationGroupResult[];
};

export const REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_KIND_VERSION =
  "real-temporal-edge-semantic-deduplication-v1" as const;

const GENERIC_PREDICATE_NORMALIZATION = Object.freeze({
  bridges_to: "motion_bridge_link",
  projects: "forward_projection",
  projects_to: "forward_projection_to",
  maintains: "continuity_maintenance",
  anchors: "evidence_anchor",
  persists: "persistence_binding",
  flows_to: "temporal_flow",
  carries: "motion_carry",
  expresses: "emotion_expression",
  bathes: "ambient_modulation",
  frames: "narrative_framing",
  aligns: "rhythm_alignment",
  aligns_with: "rhythm_alignment",
  illuminates: "environment_illumination",
  modulates: "environment_modulation",
  evolves_to: "emotional_evolution",
  maps_to: "lens_subject_mapping",
  inherits_from: "continuity_inheritance",
  inherits: "movement_inheritance",
  drives: "momentum_drive",
  resists: "inertia_resistance",
  forces: "transition_force",
  drifts: "atmospheric_drift",
  flows: "environmental_flow",
  shifts: "light_shift",
  decays: "flow_decay",
  tracks_to: "gaze_tracking",
  continues_to: "screen_direction_flow",
  momentum_bridge: "camera_momentum_bridge",
  flies_over: "spatial_flight_path",
  grounds: "spatial_grounding",
  companions: "companion_binding",
  keys: "lighting_key_bind",
  binds: "memory_binding",
  resolves: "resolve_binding",
  imprints: "memory_imprint",
  recalls: "memory_recall",
} as const satisfies Record<string, string>);

const SEMANTIC_ROLE_BY_GROUP = Object.freeze({
  motion: "motion-continuity",
  trajectory: "subject-trajectory",
  camera_momentum: "camera-momentum",
  environmental_flow: "environmental-flow",
  emotional: "emotional-binding",
  cinematic: "cinematic-binding",
  continuity: "continuity-binding",
  environment: "environment-binding",
  visual_memory: "visual-memory-binding",
  relationship: "relationship-binding",
} as const);

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function clampScore(value: number): number {
  return Number(Math.min(1, Math.max(0, value)).toFixed(4));
}

export function normalizeTemporalEdgePredicate(predicate: string): string {
  const mapped = GENERIC_PREDICATE_NORMALIZATION[predicate as keyof typeof GENERIC_PREDICATE_NORMALIZATION];
  if (mapped !== undefined) {
    return mapped;
  }
  return predicate.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
}

function resolveSemanticRole(groupKind: string): string {
  return (
    SEMANTIC_ROLE_BY_GROUP[groupKind as keyof typeof SEMANTIC_ROLE_BY_GROUP] ?? `${groupKind}-edge`
  );
}

function scoreEdgeUsefulness(
  edge: RealV826UltraDenseSequenceEdge,
  deduplicationStatus: RealTemporalDedupedSequenceEdge["deduplicationStatus"]
): number {
  const statusBonus =
    deduplicationStatus === "unique" ? 0.12 : deduplicationStatus === "normalized" ? 0.08 : 0.06;

  return clampScore(
    statusBonus + edge.weight * 0.38 + edge.confidence * 0.28 + (edge.reasoning.length > 12 ? 0.12 : 0.06)
  );
}

function buildDifferentiatedPredicate(
  normalizedPredicate: string,
  groupKind: string,
  variantIndex: number
): string {
  return `${normalizedPredicate}_${groupKind}_v${variantIndex}`;
}

export function deduplicateTemporalEdgeGroup(
  edges: readonly RealV826UltraDenseSequenceEdge[],
  groupKind: string,
  recordId: string
): RealTemporalEdgeSemanticDeduplicationGroupResult {
  const predicateKindBuckets = new Map<string, RealV826UltraDenseSequenceEdge[]>();

  for (const edge of edges) {
    const bucketKey = `${edge.predicate}|${edge.edge_kind}`;
    const bucket = predicateKindBuckets.get(bucketKey) ?? [];
    bucket.push(edge);
    predicateKindBuckets.set(bucketKey, bucket);
  }

  let differentiatedCount = 0;
  let normalizedCount = 0;
  let uniqueCount = 0;
  const dedupedEdges: RealTemporalDedupedSequenceEdge[] = [];

  for (const [bucketKey, bucketEdges] of predicateKindBuckets.entries()) {
    const [rawPredicate] = bucketKey.split("|");
    const predicate = rawPredicate ?? bucketKey;
    const normalizedPredicate = normalizeTemporalEdgePredicate(predicate);
    const isDuplicateGroup = bucketEdges.length > 1;
    const duplicateGroupId = isDuplicateGroup
      ? digestValue([REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_KIND_VERSION, recordId, groupKind, bucketKey].join("|")).slice(0, 20)
      : null;

    bucketEdges.forEach((edge, variantIndex) => {
      let deduplicationStatus: RealTemporalDedupedSequenceEdge["deduplicationStatus"];
      let semanticVariant: string;
      let differentiatedPredicate: string;
      let deduplicationNote: string;

      if (isDuplicateGroup) {
        deduplicationStatus = "differentiated";
        semanticVariant = `${normalizedPredicate}-variant-${variantIndex}`;
        differentiatedPredicate = buildDifferentiatedPredicate(
          normalizedPredicate,
          groupKind,
          variantIndex
        );
        deduplicationNote = `Differentiated duplicate predicate "${predicate}" in ${groupKind} group ${duplicateGroupId ?? "unknown"}`;
        differentiatedCount += 1;
      } else if (predicate !== normalizedPredicate) {
        deduplicationStatus = "normalized";
        semanticVariant = normalizedPredicate;
        differentiatedPredicate = normalizedPredicate;
        deduplicationNote = `Normalized generic predicate "${predicate}" to "${normalizedPredicate}"`;
        normalizedCount += 1;
      } else {
        deduplicationStatus = "unique";
        semanticVariant = predicate;
        differentiatedPredicate = predicate;
        deduplicationNote = "Unique edge semantics preserved";
        uniqueCount += 1;
      }

      dedupedEdges.push(
        Object.freeze({
          ...edge,
          predicate: differentiatedPredicate,
          deduplicationStatus,
          duplicateGroupId,
          semanticVariant,
          semanticRole: `${resolveSemanticRole(groupKind)}:${normalizedPredicate}`,
          normalizedPredicate,
          edgeUsefulnessScore: scoreEdgeUsefulness(edge, deduplicationStatus),
          deduplicationNote,
        })
      );
    });
  }

  return Object.freeze({
    groupKind,
    inputEdgeCount: edges.length,
    outputEdgeCount: dedupedEdges.length,
    differentiatedCount,
    normalizedCount,
    uniqueCount,
    edges: Object.freeze(dedupedEdges),
  });
}

export function deduplicateTemporalEdgeGroupsForRecord(
  edgeGroups: Readonly<Record<string, readonly RealV826UltraDenseSequenceEdge[]>>,
  recordId: string
): RealTemporalEdgeSemanticDeduplicationRecordResult {
  const groups = Object.freeze(
    Object.entries(edgeGroups).map(([groupKind, edges]) =>
      deduplicateTemporalEdgeGroup(edges, groupKind, recordId)
    )
  );

  const duplicatePredicateGroupsResolved = groups.reduce(
    (sum, group) => sum + (group.differentiatedCount > 0 ? 1 : 0),
    0
  );

  return Object.freeze({
    recordId,
    totalInputEdges: groups.reduce((sum, group) => sum + group.inputEdgeCount, 0),
    totalOutputEdges: groups.reduce((sum, group) => sum + group.outputEdgeCount, 0),
    duplicatePredicateGroupsResolved,
    groups,
  });
}

export function collectDedupedEdgesFromGroupResult(
  groupResult: RealTemporalEdgeSemanticDeduplicationGroupResult
): readonly RealTemporalDedupedSequenceEdge[] {
  return groupResult.edges;
}

export function computeTemporalEdgeSemanticDeduplicationFingerprint(
  result: RealTemporalEdgeSemanticDeduplicationRecordResult
): string {
  return digestValue(JSON.stringify(result));
}
