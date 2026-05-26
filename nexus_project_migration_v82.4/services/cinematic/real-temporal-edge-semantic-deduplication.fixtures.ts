import { REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE } from "./real-v826-temporal-cinematic-dna-export-adapter.fixtures.ts";
import {
  deduplicateTemporalEdgeGroup,
  computeTemporalEdgeSemanticDeduplicationFingerprint,
  deduplicateTemporalEdgeGroupsForRecord,
} from "./real-temporal-edge-semantic-deduplication.ts";

export const REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_INPUT_EXAMPLE = Object.freeze({
  motionEdges:
    REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE[0]?.sequence_graph.motion_edges ??
    [],
  recordId: REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE[0]?.id ?? "record-0",
});

export const REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_MOTION_GROUP_OUTPUT_EXAMPLE =
  deduplicateTemporalEdgeGroup(
    REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_INPUT_EXAMPLE.motionEdges,
    "motion",
    REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_INPUT_EXAMPLE.recordId
  );

export const REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_RECORD_OUTPUT_EXAMPLE =
  deduplicateTemporalEdgeGroupsForRecord(
    Object.freeze({
      motion:
        REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE[0]?.sequence_graph.motion_edges ??
        [],
    }),
    REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_INPUT_EXAMPLE.recordId
  );

export const REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_FINGERPRINT =
  computeTemporalEdgeSemanticDeduplicationFingerprint(
    REAL_TEMPORAL_EDGE_SEMANTIC_DEDUPLICATION_RECORD_OUTPUT_EXAMPLE
  );
