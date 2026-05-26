import crypto from "crypto";
import type { RealTemporalDatasetQualityAudit } from "./real-temporal-dataset-quality-audit.ts";
import {
  buildRealTemporalDatasetQualityAuditFromAdapter,
  computeRealTemporalDatasetQualityAuditFingerprint,
} from "./real-temporal-dataset-quality-audit.ts";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type { RealImageAppInputPackage } from "./real-image-app-input-package.ts";
import {
  buildRealTemporalDedupedDatasetQualityLockPreview,
  computeRealTemporalDedupedDatasetQualityLockFingerprint,
  type RealTemporalDedupedDatasetQualityLock,
} from "./real-temporal-deduped-dataset-quality-lock.ts";
import {
  buildRealV826TemporalDedupedCinematicDnaExportAdapter,
  type RealV826TemporalDedupedCinematicDnaExportAdapter,
} from "./real-v826-temporal-deduped-cinematic-dna-export-adapter.ts";
import type { RealV826TemporalCinematicDnaExportAdapter } from "./real-v826-temporal-cinematic-dna-export-adapter.ts";

export type RealTemporalDedupedCompletionSnapshotProductionReadiness = {
  status: "production-ready" | "blocked";
  auditVerdict: string;
  qualityLockVerdict: string;
  qualityLockPassed: boolean;
  overallAuditScore: number;
};

export type RealTemporalDedupedCompletionSnapshotNextExpansionReadiness = {
  expansionEligible: false;
  expansionPolicy: typeof REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_EXPANSION_POLICY;
  blockedExpansionKinds: readonly string[];
  readinessNote: string;
};

export type RealTemporalDedupedCompletionSnapshot = {
  version: "v1";
  snapshotId: string;
  snapshotVersion: typeof REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_KIND_VERSION;
  activeSnapshotState: string;
  exportFingerprint: string;
  qualityLockId: string;
  qualityLockFingerprint: string;
  auditFingerprint: string;
  qualityLockVerdict: string;
  edgeCount: number;
  temporalEdgeCount: number;
  duplicateGroupCount: number;
  metadataInflationRatio: number;
  auditScore: number;
  productionReadiness: RealTemporalDedupedCompletionSnapshotProductionReadiness;
  nextExpansionReadiness: RealTemporalDedupedCompletionSnapshotNextExpansionReadiness;
  recordCount: typeof REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_RECORD_COUNT;
  snapshotStatus: "completion-locked" | "completion-blocked";
  inferenceExecuted: false;
  providerCallExecuted: false;
  imageGenerationExecuted: false;
};

export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_VERSION = "v1" as const;
export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_KIND_VERSION =
  "real-temporal-deduped-completion-snapshot-v1" as const;
export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_ROOT_ID =
  "real-temporal-deduped-completion-snapshot-gonegi-harbor-25s-v1" as const;
export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_STATE =
  "25s-real-temporal-deduped-completion-snapshot-metadata-only" as const;
export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_RECORD_COUNT = 3 as const;
export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_EXPANSION_POLICY =
  "metadata-only-completion-no-edge-expansion" as const;

export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_BLOCKED_EXPANSION_KINDS = Object.freeze([
  "edge-expansion",
  "ai-inference",
  "provider-call",
  "image-generation",
] as const);

export const REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_KEY_ORDER = Object.freeze([
  "version",
  "snapshotId",
  "snapshotVersion",
  "activeSnapshotState",
  "exportFingerprint",
  "qualityLockId",
  "qualityLockFingerprint",
  "auditFingerprint",
  "qualityLockVerdict",
  "edgeCount",
  "temporalEdgeCount",
  "duplicateGroupCount",
  "metadataInflationRatio",
  "auditScore",
  "productionReadiness",
  "nextExpansionReadiness",
  "recordCount",
  "snapshotStatus",
  "inferenceExecuted",
  "providerCallExecuted",
  "imageGenerationExecuted",
] as const);

let cachedRealTemporalDedupedCompletionSnapshot: RealTemporalDedupedCompletionSnapshot | null =
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

function resolveProductionReadiness(
  qualityLock: RealTemporalDedupedDatasetQualityLock,
  audit: RealTemporalDatasetQualityAudit
): RealTemporalDedupedCompletionSnapshotProductionReadiness {
  const productionReady =
    qualityLock.allChecksPassed &&
    qualityLock.lockStatus === "quality-locked" &&
    audit.auditVerdict === "production-ready";

  return Object.freeze({
    status: productionReady ? ("production-ready" as const) : ("blocked" as const),
    auditVerdict: audit.auditVerdict,
    qualityLockVerdict: qualityLock.lockVerdict,
    qualityLockPassed: qualityLock.allChecksPassed,
    overallAuditScore: audit.qualityScore.overallDatasetQualityScore,
  });
}

function resolveNextExpansionReadiness(
  qualityLock: RealTemporalDedupedDatasetQualityLock
): RealTemporalDedupedCompletionSnapshotNextExpansionReadiness {
  const completionReady =
    qualityLock.allChecksPassed && qualityLock.lockStatus === "quality-locked";

  return Object.freeze({
    expansionEligible: false as const,
    expansionPolicy: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_EXPANSION_POLICY,
    blockedExpansionKinds: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_BLOCKED_EXPANSION_KINDS,
    readinessNote: completionReady
      ? "Quality-locked deduped dataset completion snapshot fixed; no further edge expansion in this phase"
      : "Completion snapshot blocked until quality lock passes",
  });
}

export function buildRealTemporalDedupedCompletionSnapshotFromSources(
  qualityLock: RealTemporalDedupedDatasetQualityLock,
  audit: RealTemporalDatasetQualityAudit,
  options?: {
    qualityLockFingerprint?: string;
  }
): RealTemporalDedupedCompletionSnapshot {
  if (qualityLock.recordCount !== REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_RECORD_COUNT) {
    throw new Error("Temporal deduped completion snapshot requires three quality-locked records");
  }

  if (qualityLock.auditFingerprint !== computeRealTemporalDatasetQualityAuditFingerprint(audit)) {
    throw new Error("Completion snapshot audit fingerprint must match quality lock audit fingerprint");
  }

  const qualityLockFingerprint =
    options?.qualityLockFingerprint ??
    computeRealTemporalDedupedDatasetQualityLockFingerprint(qualityLock);

  const productionReadiness = resolveProductionReadiness(qualityLock, audit);
  const nextExpansionReadiness = resolveNextExpansionReadiness(qualityLock);
  const snapshotStatus =
    productionReadiness.status === "production-ready" &&
    qualityLock.lockStatus === "quality-locked"
      ? ("completion-locked" as const)
      : ("completion-blocked" as const);

  const snapshotId = digestValue(
    [
      REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_KIND_VERSION,
      qualityLock.dedupedExportFingerprint,
      qualityLock.lockId,
      snapshotStatus,
    ].join("|")
  );

  return Object.freeze({
    version: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_VERSION,
    snapshotId,
    snapshotVersion: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_KIND_VERSION,
    activeSnapshotState: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_STATE,
    exportFingerprint: qualityLock.dedupedExportFingerprint,
    qualityLockId: qualityLock.lockId,
    qualityLockFingerprint,
    auditFingerprint: qualityLock.auditFingerprint,
    qualityLockVerdict: qualityLock.lockVerdict,
    edgeCount: qualityLock.totalEdgeCount,
    temporalEdgeCount: qualityLock.totalTemporalEdgeCount,
    duplicateGroupCount: qualityLock.duplicateGroupValidation.validGroupCount,
    metadataInflationRatio: qualityLock.metadataInflationRatio,
    auditScore: audit.qualityScore.overallDatasetQualityScore,
    productionReadiness,
    nextExpansionReadiness,
    recordCount: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_RECORD_COUNT,
    snapshotStatus,
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
    imageGenerationExecuted: false as const,
  });
}

export function buildRealTemporalDedupedCompletionSnapshotFromAdapter(
  dedupedAdapter: RealV826TemporalDedupedCinematicDnaExportAdapter,
  qualityLock: RealTemporalDedupedDatasetQualityLock
): RealTemporalDedupedCompletionSnapshot {
  const audit = buildRealTemporalDatasetQualityAuditFromAdapter(
    dedupedAdapter as unknown as RealV826TemporalCinematicDnaExportAdapter,
    qualityLock.dedupedExportFingerprint
  );

  return buildRealTemporalDedupedCompletionSnapshotFromSources(qualityLock, audit);
}

export function serializeRealTemporalDedupedCompletionSnapshot(
  snapshot: RealTemporalDedupedCompletionSnapshot
): string {
  return JSON.stringify(
    orderRecord(
      snapshot as unknown as Record<string, unknown>,
      REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_KEY_ORDER
    ),
    null,
    2
  );
}

export function computeRealTemporalDedupedCompletionSnapshotFingerprint(
  snapshot: RealTemporalDedupedCompletionSnapshot
): string {
  return digestValue(serializeRealTemporalDedupedCompletionSnapshot(snapshot));
}

export function buildRealTemporalDedupedCompletionSnapshotPreview(): RealTemporalDedupedCompletionSnapshot {
  if (cachedRealTemporalDedupedCompletionSnapshot !== null) {
    return cachedRealTemporalDedupedCompletionSnapshot;
  }

  const qualityLock = buildRealTemporalDedupedDatasetQualityLockPreview();
  const dedupedAdapter = buildRealV826TemporalDedupedCinematicDnaExportAdapter(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
  const audit = buildRealTemporalDatasetQualityAuditFromAdapter(
    dedupedAdapter as unknown as RealV826TemporalCinematicDnaExportAdapter,
    qualityLock.dedupedExportFingerprint
  );

  const snapshot = buildRealTemporalDedupedCompletionSnapshotFromSources(qualityLock, audit);
  cachedRealTemporalDedupedCompletionSnapshot = snapshot;
  return snapshot;
}

export function resetRealTemporalDedupedCompletionSnapshotCacheForVerification(): void {
  cachedRealTemporalDedupedCompletionSnapshot = null;
}
