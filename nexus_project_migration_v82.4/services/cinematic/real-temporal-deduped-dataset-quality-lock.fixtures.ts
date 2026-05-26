import {
  REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_ADAPTER_FINGERPRINT,
} from "./real-v826-temporal-cinematic-dna-export-adapter.fixtures.ts";
import {
  REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_FINGERPRINT,
  REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE,
  REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_DOWNLOAD_OUTPUT_EXAMPLE,
} from "./real-v826-temporal-deduped-cinematic-dna-export-adapter.fixtures.ts";
import { buildRealV826TemporalCinematicDnaExportDownload } from "./real-v826-temporal-cinematic-dna-export-adapter.ts";
import {
  buildRealTemporalDedupedDatasetQualityLockFromAdapter,
  buildRealTemporalDedupedDatasetQualityLockPreview,
  computeRealTemporalDedupedDatasetQualityLockFingerprint,
} from "./real-temporal-deduped-dataset-quality-lock.ts";

export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_INPUT_EXAMPLE = Object.freeze({
  dedupedAdapter: REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE,
});

const temporalDownload = buildRealV826TemporalCinematicDnaExportDownload();

export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE =
  buildRealTemporalDedupedDatasetQualityLockFromAdapter(
    REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_INPUT_EXAMPLE.dedupedAdapter,
    {
      dedupedExportFingerprint: REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_FINGERPRINT,
      temporalExportFingerprint: REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_ADAPTER_FINGERPRINT,
      dedupedExportByteLength: Buffer.byteLength(
        REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_DOWNLOAD_OUTPUT_EXAMPLE.body,
        "utf8"
      ),
      temporalExportByteLength: Buffer.byteLength(temporalDownload.body, "utf8"),
    }
  );

export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_PREVIEW_OUTPUT_EXAMPLE =
  buildRealTemporalDedupedDatasetQualityLockPreview();

export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_FINGERPRINT =
  computeRealTemporalDedupedDatasetQualityLockFingerprint(
    REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE
  );

export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  recordCount: 3,
  totalEdgeCount: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE.totalEdgeCount,
  totalTemporalEdgeCount:
    REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE.totalTemporalEdgeCount,
  auditVerdict: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE.auditVerdict,
  lockStatus: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE.lockStatus,
  lockVerdict: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE.lockVerdict,
  allChecksPassed: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_OUTPUT_EXAMPLE.allChecksPassed,
});
