import crypto from "crypto";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type { RealImageAppInputPackage } from "./real-image-app-input-package.ts";
import {
  deduplicateTemporalEdgeGroup,
  type RealTemporalDedupedSequenceEdge,
  type RealTemporalEdgeSemanticDeduplicationRecordResult,
} from "./real-temporal-edge-semantic-deduplication.ts";
import {
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE,
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION,
} from "./real-v826-cinematic-dna-export-adapter.ts";
import {
  buildRealV826TemporalCinematicDnaExportAdapter,
  countTemporalMotionEdges,
  countTemporalSequenceEdges,
  type RealV826TemporalCinematicDnaExportAdapter,
  type RealV826TemporalCinematicDnaExportRecord,
} from "./real-v826-temporal-cinematic-dna-export-adapter.ts";

export type RealV826TemporalDedupedSequenceGraph =
  RealV826TemporalCinematicDnaExportRecord["sequence_graph"] & {
    motion_edges: readonly RealTemporalDedupedSequenceEdge[];
    trajectory_edges: readonly RealTemporalDedupedSequenceEdge[];
    camera_momentum_edges: readonly RealTemporalDedupedSequenceEdge[];
    environmental_flow_edges: readonly RealTemporalDedupedSequenceEdge[];
    emotional_edges: readonly RealTemporalDedupedSequenceEdge[];
    cinematic_edges: readonly RealTemporalDedupedSequenceEdge[];
    continuity_edges: readonly RealTemporalDedupedSequenceEdge[];
    environment_edges: readonly RealTemporalDedupedSequenceEdge[];
    visual_memory_edges: readonly RealTemporalDedupedSequenceEdge[];
  };

export type RealV826TemporalDedupedCinematicDnaExportRecord = Omit<
  RealV826TemporalCinematicDnaExportRecord,
  "sequence_graph" | "schema_meta" | "temporal_meta"
> & {
  schema_meta: RealV826TemporalCinematicDnaExportRecord["schema_meta"];
  sequence_graph: RealV826TemporalDedupedSequenceGraph;
  temporal_meta: Omit<RealV826TemporalCinematicDnaExportRecord["temporal_meta"], "density_tier"> & {
    density_tier: "temporal-deduped";
  };
  temporal_dedup_meta: {
    deduplication_engine: typeof REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_KIND_VERSION;
    deduplication_summary: {
      totalInputEdges: number;
      totalOutputEdges: number;
      duplicatePredicateGroupsResolved: number;
      differentiatedEdgeCount: number;
      normalizedEdgeCount: number;
      uniqueEdgeCount: number;
      averageEdgeUsefulnessScore: number;
    };
  };
};

export type RealV826TemporalDedupedCinematicDnaExportAdapter =
  readonly RealV826TemporalDedupedCinematicDnaExportRecord[];

export type RealV826TemporalDedupedCinematicDnaExportDownload = {
  filename: typeof REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_FILENAME;
  contentType: "application/json";
  body: string;
  exportFingerprint: string;
};

export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION =
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION;
export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE =
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE;
export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_FILENAME =
  "kiki-25s-temporal-deduped-cinematic-dna-export.json" as const;
export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_KIND_VERSION =
  "real-v826-temporal-deduped-cinematic-dna-export-adapter-v1" as const;

export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER = Object.freeze([
  ...Object.freeze([
    "id",
    "schema_version",
    "schema_signature",
    "schema_meta",
    "analysis_timestamp",
    "source_hash",
    "core_dna_id",
    "category",
    "scene_indexing",
    "generative_layer",
    "layers",
    "scene_state",
    "latent_steering",
    "director_dna",
    "visual_atoms",
    "relationship_graph",
    "sequence_graph",
    "confidence_profile",
    "production_v72",
    "temporal_continuity_memory",
    "camera_grammar_evolution",
    "environmental_persistence",
    "character_emotional_trajectory",
    "cinematic_density_score",
    "cinematic_beat_manifest",
    "continuity_audit_trail",
    "visual_atom_interaction_registry",
    "semantic_relationship_matrix",
    "ultra_dense_meta",
    "motion_bridge_timeline",
    "subject_trajectory_graph",
    "camera_momentum_grammar",
    "environmental_motion_field",
    "motion_density_score",
    "temporal_meta",
  ] as const),
  "temporal_dedup_meta",
] as const);

let cachedRealV826TemporalDedupedCinematicDnaExportAdapter: RealV826TemporalDedupedCinematicDnaExportAdapter | null =
  null;
let cachedRealV826TemporalDedupedCinematicDnaExportDownload: RealV826TemporalDedupedCinematicDnaExportDownload | null =
  null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

function summarizeDeduplication(
  dedupResults: readonly RealTemporalEdgeSemanticDeduplicationRecordResult[]
): RealV826TemporalDedupedCinematicDnaExportRecord["temporal_dedup_meta"]["deduplication_summary"] {
  let differentiatedEdgeCount = 0;
  let normalizedEdgeCount = 0;
  let uniqueEdgeCount = 0;
  let usefulnessTotal = 0;
  let usefulnessCount = 0;

  for (const result of dedupResults) {
    for (const group of result.groups) {
      differentiatedEdgeCount += group.differentiatedCount;
      normalizedEdgeCount += group.normalizedCount;
      uniqueEdgeCount += group.uniqueCount;
      for (const edge of group.edges) {
        usefulnessTotal += edge.edgeUsefulnessScore;
        usefulnessCount += 1;
      }
    }
  }

  return Object.freeze({
    totalInputEdges: dedupResults.reduce((sum, result) => sum + result.totalInputEdges, 0),
    totalOutputEdges: dedupResults.reduce((sum, result) => sum + result.totalOutputEdges, 0),
    duplicatePredicateGroupsResolved: dedupResults.reduce(
      (sum, result) => sum + result.duplicatePredicateGroupsResolved,
      0
    ),
    differentiatedEdgeCount,
    normalizedEdgeCount,
    uniqueEdgeCount,
    averageEdgeUsefulnessScore: Number(
      (usefulnessCount === 0 ? 0 : usefulnessTotal / usefulnessCount).toFixed(4)
    ),
  });
}

function deduplicateSequenceGraph(
  record: RealV826TemporalCinematicDnaExportRecord
): {
  sequenceGraph: RealV826TemporalDedupedSequenceGraph;
  dedupResult: RealTemporalEdgeSemanticDeduplicationRecordResult;
} {
  const graph = record.sequence_graph;
  const groupEntries = Object.freeze([
    ["motion", graph.motion_edges] as const,
    ["trajectory", graph.trajectory_edges] as const,
    ["camera_momentum", graph.camera_momentum_edges] as const,
    ["environmental_flow", graph.environmental_flow_edges] as const,
    ["emotional", graph.emotional_edges] as const,
    ["cinematic", graph.cinematic_edges] as const,
    ["continuity", graph.continuity_edges] as const,
    ["environment", graph.environment_edges] as const,
    ["visual_memory", graph.visual_memory_edges] as const,
  ]);

  const groups = groupEntries.map(([groupKind, edges]) =>
    deduplicateTemporalEdgeGroup(edges, groupKind, record.id)
  );

  const dedupResult = Object.freeze({
    recordId: record.id,
    totalInputEdges: groups.reduce((sum, group) => sum + group.inputEdgeCount, 0),
    totalOutputEdges: groups.reduce((sum, group) => sum + group.outputEdgeCount, 0),
    duplicatePredicateGroupsResolved: groups.filter((group) => group.differentiatedCount > 0).length,
    groups: Object.freeze(groups),
  });

  const [
    motionGroup,
    trajectoryGroup,
    cameraMomentumGroup,
    environmentalFlowGroup,
    emotionalGroup,
    cinematicGroup,
    continuityGroup,
    environmentGroup,
    visualMemoryGroup,
  ] = groups;

  if (
    motionGroup === undefined ||
    trajectoryGroup === undefined ||
    cameraMomentumGroup === undefined ||
    environmentalFlowGroup === undefined ||
    emotionalGroup === undefined ||
    cinematicGroup === undefined ||
    continuityGroup === undefined ||
    environmentGroup === undefined ||
    visualMemoryGroup === undefined
  ) {
    throw new Error("Temporal dedup sequence graph group alignment failed");
  }

  const sequenceGraph = Object.freeze({
    ...graph,
    motion_edges: motionGroup.edges,
    trajectory_edges: trajectoryGroup.edges,
    camera_momentum_edges: cameraMomentumGroup.edges,
    cinematic_edges: cinematicGroup.edges,
    continuity_edges: continuityGroup.edges,
    environment_edges: environmentGroup.edges,
    visual_memory_edges: visualMemoryGroup.edges,
    environmental_flow_edges: environmentalFlowGroup.edges,
    emotional_edges: emotionalGroup.edges,
    temporal_total_edge_count: graph.temporal_total_edge_count,
  });

  return { sequenceGraph, dedupResult };
}

function buildDedupedRecord(
  temporalRecord: RealV826TemporalCinematicDnaExportRecord,
  sequenceGraph: RealV826TemporalDedupedSequenceGraph,
  dedupSummary: RealV826TemporalDedupedCinematicDnaExportRecord["temporal_dedup_meta"]["deduplication_summary"]
): RealV826TemporalDedupedCinematicDnaExportRecord {
  return Object.freeze({
    ...temporalRecord,
    schema_meta: Object.freeze({
      ...temporalRecord.schema_meta,
      latent_engine: "real-frame-temporal-deduped-v826",
      perception_mode: "real-mp4-frame-evidence-temporal-deduped",
    }),
    sequence_graph: sequenceGraph,
    temporal_meta: Object.freeze({
      ...temporalRecord.temporal_meta,
      density_tier: "temporal-deduped" as const,
    }),
    temporal_dedup_meta: Object.freeze({
      deduplication_engine: REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_KIND_VERSION,
      deduplication_summary: dedupSummary,
    }),
  });
}

export function buildRealV826TemporalDedupedCinematicDnaExportAdapter(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826TemporalDedupedCinematicDnaExportAdapter {
  if (cachedRealV826TemporalDedupedCinematicDnaExportAdapter !== null) {
    return cachedRealV826TemporalDedupedCinematicDnaExportAdapter;
  }

  const temporalAdapter = buildRealV826TemporalCinematicDnaExportAdapter(realImageAppInputPackage);
  const dedupedParts = temporalAdapter.map((record) => deduplicateSequenceGraph(record));
  const dedupSummary = summarizeDeduplication(dedupedParts.map((part) => part.dedupResult));

  const records = Object.freeze(
    temporalAdapter.map((record, index) => {
      const part = dedupedParts[index];
      if (part === undefined) {
        throw new Error("Temporal dedup record alignment failed");
      }
      return buildDedupedRecord(record, part.sequenceGraph, dedupSummary);
    })
  );

  cachedRealV826TemporalDedupedCinematicDnaExportAdapter = records;
  return records;
}

export function buildRealV826TemporalDedupedCinematicDnaExportAdapterFromTemporal(
  temporalAdapter: RealV826TemporalCinematicDnaExportAdapter
): RealV826TemporalDedupedCinematicDnaExportAdapter {
  const dedupedParts = temporalAdapter.map((record) => deduplicateSequenceGraph(record));
  const dedupSummary = summarizeDeduplication(dedupedParts.map((part) => part.dedupResult));
  return Object.freeze(
    temporalAdapter.map((record, index) => {
      const part = dedupedParts[index];
      if (part === undefined) {
        throw new Error("Temporal dedup record alignment failed");
      }
      return buildDedupedRecord(record, part.sequenceGraph, dedupSummary);
    })
  );
}

export function serializeRealV826TemporalDedupedCinematicDnaExportAdapter(
  adapter: RealV826TemporalDedupedCinematicDnaExportAdapter
): string {
  const orderedRecords = [...adapter]
    .sort((a, b) => a.scene_indexing.v_timestamp_start - b.scene_indexing.v_timestamp_start)
    .map((record) =>
      orderRecord(
        record as unknown as Record<string, unknown>,
        REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER
      )
    );

  return JSON.stringify(orderedRecords, null, 2);
}

export function computeRealV826TemporalDedupedCinematicDnaExportAdapterFingerprint(
  adapter: RealV826TemporalDedupedCinematicDnaExportAdapter
): string {
  return digestValue(serializeRealV826TemporalDedupedCinematicDnaExportAdapter(adapter));
}

export function buildRealV826TemporalDedupedCinematicDnaExportDownloadFromAdapter(
  adapter: RealV826TemporalDedupedCinematicDnaExportAdapter
): RealV826TemporalDedupedCinematicDnaExportDownload {
  return Object.freeze({
    filename: REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_FILENAME,
    contentType: "application/json",
    body: serializeRealV826TemporalDedupedCinematicDnaExportAdapter(adapter),
    exportFingerprint: computeRealV826TemporalDedupedCinematicDnaExportAdapterFingerprint(adapter),
  });
}

export function buildRealV826TemporalDedupedCinematicDnaExportDownloadFromPackage(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826TemporalDedupedCinematicDnaExportDownload {
  return buildRealV826TemporalDedupedCinematicDnaExportDownloadFromAdapter(
    buildRealV826TemporalDedupedCinematicDnaExportAdapter(realImageAppInputPackage)
  );
}

export function buildRealV826TemporalDedupedCinematicDnaExportDownload(): RealV826TemporalDedupedCinematicDnaExportDownload {
  if (cachedRealV826TemporalDedupedCinematicDnaExportDownload !== null) {
    return cachedRealV826TemporalDedupedCinematicDnaExportDownload;
  }

  const download = buildRealV826TemporalDedupedCinematicDnaExportDownloadFromPackage(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
  cachedRealV826TemporalDedupedCinematicDnaExportDownload = download;
  return download;
}

export function resetRealV826TemporalDedupedCinematicDnaExportAdapterCacheForVerification(): void {
  cachedRealV826TemporalDedupedCinematicDnaExportAdapter = null;
  cachedRealV826TemporalDedupedCinematicDnaExportDownload = null;
}

export function countTemporalDedupedSequenceEdges(
  adapter: RealV826TemporalDedupedCinematicDnaExportAdapter
): number {
  return countTemporalSequenceEdges(adapter as unknown as RealV826TemporalCinematicDnaExportAdapter);
}

export function countTemporalDedupedMotionEdges(
  adapter: RealV826TemporalDedupedCinematicDnaExportAdapter
): number {
  return countTemporalMotionEdges(adapter as unknown as RealV826TemporalCinematicDnaExportAdapter);
}
