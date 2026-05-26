import { REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE } from "./real-v826-temporal-cinematic-dna-export-adapter.fixtures.ts";
import {
  buildRealTemporalDatasetQualityAudit,
  buildRealTemporalDatasetQualityAuditPreview,
  computeRealTemporalDatasetQualityAuditFingerprint,
} from "./real-temporal-dataset-quality-audit.ts";

export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_INPUT_EXAMPLE = Object.freeze({
  temporalAdapter: REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE,
});

export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_OUTPUT_EXAMPLE =
  buildRealTemporalDatasetQualityAudit(
    REAL_TEMPORAL_DATASET_QUALITY_AUDIT_INPUT_EXAMPLE.temporalAdapter
  );

export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_PREVIEW_OUTPUT_EXAMPLE =
  buildRealTemporalDatasetQualityAuditPreview();

export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_FINGERPRINT =
  computeRealTemporalDatasetQualityAuditFingerprint(
    REAL_TEMPORAL_DATASET_QUALITY_AUDIT_OUTPUT_EXAMPLE
  );

export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  recordCount: 3,
  totalEdgeCount: REAL_TEMPORAL_DATASET_QUALITY_AUDIT_OUTPUT_EXAMPLE.totalEdgeCount,
  totalTemporalEdgeCount: REAL_TEMPORAL_DATASET_QUALITY_AUDIT_OUTPUT_EXAMPLE.totalTemporalEdgeCount,
  auditVerdict: REAL_TEMPORAL_DATASET_QUALITY_AUDIT_OUTPUT_EXAMPLE.auditVerdict,
  overallDatasetQualityScore:
    REAL_TEMPORAL_DATASET_QUALITY_AUDIT_OUTPUT_EXAMPLE.qualityScore.overallDatasetQualityScore,
});
