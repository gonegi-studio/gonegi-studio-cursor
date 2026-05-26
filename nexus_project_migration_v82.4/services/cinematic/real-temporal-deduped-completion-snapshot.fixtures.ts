import { buildRealTemporalDatasetQualityAuditFromAdapter } from "./real-temporal-dataset-quality-audit.ts";
import type { RealV826TemporalCinematicDnaExportAdapter } from "./real-v826-temporal-cinematic-dna-export-adapter.ts";
import {
  REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_FINGERPRINT,
  REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE,
} from "./real-v826-temporal-deduped-cinematic-dna-export-adapter.fixtures.ts";
import {
  REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE,
} from "./real-temporal-deduped-dataset-quality-lock.fixtures.ts";
import {
  buildRealTemporalDedupedCompletionSnapshotFromAdapter,
  buildRealTemporalDedupedCompletionSnapshotFromSources,
  buildRealTemporalDedupedCompletionSnapshotPreview,
  computeRealTemporalDedupedCompletionSnapshotFingerprint,
} from "./real-temporal-deduped-completion-snapshot.ts";
import { computeRealTemporalDedupedDatasetQualityLockFingerprint } from "./real-temporal-deduped-dataset-quality-lock.ts";

export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_INPUT_EXAMPLE = Object.freeze({
  qualityLock: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE,
  dedupedAdapter: REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE,
});

const dedupedAudit = buildRealTemporalDatasetQualityAuditFromAdapter(
  REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_INPUT_EXAMPLE.dedupedAdapter as unknown as RealV826TemporalCinematicDnaExportAdapter,
  REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_FINGERPRINT
);

export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE =
  buildRealTemporalDedupedCompletionSnapshotFromSources(
    REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_INPUT_EXAMPLE.qualityLock,
    dedupedAudit,
    {
      qualityLockFingerprint: computeRealTemporalDedupedDatasetQualityLockFingerprint(
        REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_INPUT_EXAMPLE.qualityLock
      ),
    }
  );

export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_ADAPTER_OUTPUT_EXAMPLE =
  buildRealTemporalDedupedCompletionSnapshotFromAdapter(
    REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_INPUT_EXAMPLE.dedupedAdapter,
    REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_INPUT_EXAMPLE.qualityLock
  );

export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_PREVIEW_OUTPUT_EXAMPLE =
  buildRealTemporalDedupedCompletionSnapshotPreview();

export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_FINGERPRINT =
  computeRealTemporalDedupedCompletionSnapshotFingerprint(
    REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE
  );

export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  exportFingerprint: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.exportFingerprint,
  qualityLockVerdict: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.qualityLockVerdict,
  edgeCount: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.edgeCount,
  temporalEdgeCount: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.temporalEdgeCount,
  duplicateGroupCount: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.duplicateGroupCount,
  metadataInflationRatio:
    REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.metadataInflationRatio,
  auditScore: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.auditScore,
  productionReadiness:
    REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.productionReadiness.status,
  nextExpansionReadiness:
    REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.nextExpansionReadiness.expansionEligible,
  snapshotStatus: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_OUTPUT_EXAMPLE.snapshotStatus,
});
