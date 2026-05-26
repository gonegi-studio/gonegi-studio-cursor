import crypto from "crypto";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type { RealImageAppInputPackage } from "./real-image-app-input-package.ts";
import {
  buildRealTemporalDatasetQualityAuditFromAdapter,
  computeRealTemporalDatasetQualityAuditFingerprint,
} from "./real-temporal-dataset-quality-audit.ts";
import type { RealTemporalDedupedSequenceEdge } from "./real-temporal-edge-semantic-deduplication.ts";
import {
  buildRealV826TemporalCinematicDnaExportDownload,
  type RealV826TemporalCinematicDnaExportAdapter,
} from "./real-v826-temporal-cinematic-dna-export-adapter.ts";
import {
  buildRealV826TemporalDedupedCinematicDnaExportAdapter,
  buildRealV826TemporalDedupedCinematicDnaExportDownload,
  computeRealV826TemporalDedupedCinematicDnaExportAdapterFingerprint,
  countTemporalDedupedMotionEdges,
  countTemporalDedupedSequenceEdges,
  REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER,
  type RealV826TemporalDedupedCinematicDnaExportAdapter,
  type RealV826TemporalDedupedCinematicDnaExportRecord,
} from "./real-v826-temporal-deduped-cinematic-dna-export-adapter.ts";

export type RealTemporalDedupedDatasetQualityLockCheck = {
  checkId: string;
  label: string;
  passed: boolean;
  score: number;
  detail: string;
};

export type RealTemporalDedupedDatasetQualityLockDistribution = {
  min: number;
  max: number;
  mean: number;
  median: number;
  sampleCount: number;
  uniqueScoreCount: number;
};

export type RealTemporalDedupedDatasetQualityLockGroupValidation = {
  validGroupCount: number;
  invalidGroupCount: number;
  groupedEdgeCount: number;
  ungroupedEdgeCount: number;
  invalidGroupIds: readonly string[];
};

export type RealTemporalDedupedDatasetQualityLock = {
  version: "v1";
  lockId: string;
  lockVersion: typeof REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_KIND_VERSION;
  activeLockState: string;
  dedupedExportFingerprint: string;
  temporalExportFingerprint: string;
  auditFingerprint: string;
  auditVerdict: string;
  recordCount: typeof REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_RECORD_COUNT;
  totalEdgeCount: number;
  totalTemporalEdgeCount: number;
  dedupedExportByteLength: number;
  temporalExportByteLength: number;
  metadataInflationRatio: number;
  checks: readonly RealTemporalDedupedDatasetQualityLockCheck[];
  edgeUsefulnessDistribution: RealTemporalDedupedDatasetQualityLockDistribution;
  semanticVariantUniquenessRatio: number;
  duplicateGroupValidation: RealTemporalDedupedDatasetQualityLockGroupValidation;
  schemaConsistencyScore: number;
  paddingInflationDetected: boolean;
  allChecksPassed: boolean;
  lockStatus: "quality-locked" | "lock-blocked";
  lockVerdict: "production-ready-candidate" | "lock-rejected";
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_VERSION = "v1" as const;
export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_KIND_VERSION =
  "real-temporal-deduped-dataset-quality-lock-v1" as const;
export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_ROOT_ID =
  "real-temporal-deduped-dataset-quality-lock-gonegi-harbor-25s-v1" as const;
export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_STATE =
  "25s-real-temporal-deduped-dataset-quality-lock-metadata-only" as const;
export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_RECORD_COUNT = 3 as const;
export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_MAX_INFLATION_RATIO = 1.35 as const;

export const REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_KEY_ORDER = Object.freeze([
  "version",
  "lockId",
  "lockVersion",
  "activeLockState",
  "dedupedExportFingerprint",
  "temporalExportFingerprint",
  "auditFingerprint",
  "auditVerdict",
  "recordCount",
  "totalEdgeCount",
  "totalTemporalEdgeCount",
  "dedupedExportByteLength",
  "temporalExportByteLength",
  "metadataInflationRatio",
  "checks",
  "edgeUsefulnessDistribution",
  "semanticVariantUniquenessRatio",
  "duplicateGroupValidation",
  "schemaConsistencyScore",
  "paddingInflationDetected",
  "allChecksPassed",
  "lockStatus",
  "lockVerdict",
  "inferenceExecuted",
  "providerCallExecuted",
] as const);

const DEDUPED_EDGE_GROUP_KEYS = Object.freeze([
  "motion_edges",
  "trajectory_edges",
  "camera_momentum_edges",
  "environmental_flow_edges",
  "emotional_edges",
  "cinematic_edges",
  "continuity_edges",
  "environment_edges",
  "visual_memory_edges",
] as const);

const REQUIRED_DEDUP_FIELDS = Object.freeze([
  "deduplicationStatus",
  "duplicateGroupId",
  "semanticVariant",
  "semanticRole",
  "normalizedPredicate",
  "edgeUsefulnessScore",
  "deduplicationNote",
] as const);

let cachedRealTemporalDedupedDatasetQualityLock: RealTemporalDedupedDatasetQualityLock | null =
  null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function clampScore(value: number): number {
  return Number(Math.min(1, Math.max(0, value)).toFixed(4));
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

function collectDedupedEdges(
  record: RealV826TemporalDedupedCinematicDnaExportRecord
): readonly RealTemporalDedupedSequenceEdge[] {
  const graph = record.sequence_graph;
  return Object.freeze(
    DEDUPED_EDGE_GROUP_KEYS.flatMap((key) => graph[key] as readonly RealTemporalDedupedSequenceEdge[])
  );
}

function collectAllDedupedEdges(
  adapter: RealV826TemporalDedupedCinematicDnaExportAdapter
): readonly RealTemporalDedupedSequenceEdge[] {
  return Object.freeze(adapter.flatMap((record) => collectDedupedEdges(record)));
}

function computeDistribution(
  values: readonly number[]
): RealTemporalDedupedDatasetQualityLockDistribution {
  if (values.length === 0) {
    return Object.freeze({
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      sampleCount: 0,
      uniqueScoreCount: 0,
    });
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const median =
    sorted.length % 2 === 0
      ? ((sorted[sorted.length / 2 - 1] ?? 0) + (sorted[sorted.length / 2] ?? 0)) / 2
      : (sorted[Math.floor(sorted.length / 2)] ?? 0);

  return Object.freeze({
    min: Number((sorted[0] ?? 0).toFixed(4)),
    max: Number((sorted.at(-1) ?? 0).toFixed(4)),
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    sampleCount: values.length,
    uniqueScoreCount: new Set(values.map((value) => value.toFixed(4))).size,
  });
}

function validateSchemaConsistency(
  adapter: RealV826TemporalDedupedCinematicDnaExportAdapter
): { score: number; passed: boolean; detail: string } {
  let validRecords = 0;
  let validEdges = 0;
  let totalEdges = 0;

  for (const record of adapter) {
    const schemaOk =
      record.schema_version === "v82.6" &&
      record.temporal_dedup_meta?.deduplication_engine !== undefined &&
      record.temporal_meta?.density_tier === "temporal-deduped";

    const keySet = new Set(Object.keys(record));
    const exportKeyCoverage = REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER.filter(
      (key) => keySet.has(key)
    ).length;
    const exportKeyRatio =
      exportKeyCoverage / REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER.length;

    const edges = collectDedupedEdges(record);
    totalEdges += edges.length;

    for (const edge of edges) {
      const edgeOk = REQUIRED_DEDUP_FIELDS.every((field) => field in edge);
      if (edgeOk) {
        validEdges += 1;
      }
    }

    if (schemaOk && exportKeyRatio === 1) {
      validRecords += 1;
    }
  }

  const score = clampScore(
    (validRecords / adapter.length) * 0.4 + (totalEdges === 0 ? 0 : validEdges / totalEdges) * 0.6
  );

  return {
    score,
    passed: validRecords === adapter.length && validEdges === totalEdges,
    detail: `${validRecords}/${adapter.length} records schema-consistent; ${validEdges}/${totalEdges} edges fully enriched`,
  };
}

function validateUsefulnessDistribution(
  edges: readonly RealTemporalDedupedSequenceEdge[]
): {
  distribution: RealTemporalDedupedDatasetQualityLockDistribution;
  passed: boolean;
  score: number;
  detail: string;
} {
  const scores = edges.map((edge) => edge.edgeUsefulnessScore);
  const distribution = computeDistribution(scores);
  const passed =
    distribution.sampleCount > 0 &&
    distribution.min > 0 &&
    distribution.max <= 1 &&
    distribution.uniqueScoreCount >= Math.min(8, distribution.sampleCount);

  const score = clampScore(
    (distribution.min > 0 ? 0.25 : 0) +
      (distribution.uniqueScoreCount / Math.max(distribution.sampleCount, 1)) * 0.45 +
      (distribution.max <= 1 ? 0.2 : 0) +
      (distribution.mean >= 0.4 ? 0.1 : 0.05)
  );

  return {
    distribution,
    passed,
    score,
    detail: `usefulness min=${distribution.min} max=${distribution.max} mean=${distribution.mean} unique=${distribution.uniqueScoreCount}`,
  };
}

function validateSemanticVariantUniqueness(
  edges: readonly RealTemporalDedupedSequenceEdge[]
): { ratio: number; passed: boolean; score: number; detail: string } {
  const groups = new Map<string, RealTemporalDedupedSequenceEdge[]>();

  for (const edge of edges) {
    if (edge.duplicateGroupId === null) {
      continue;
    }
    const bucket = groups.get(edge.duplicateGroupId) ?? [];
    bucket.push(edge);
    groups.set(edge.duplicateGroupId, bucket);
  }

  let groupsWithUniqueVariants = 0;
  for (const groupEdges of groups.values()) {
    const variants = groupEdges.map((edge) => edge.semanticVariant);
    if (new Set(variants).size === groupEdges.length) {
      groupsWithUniqueVariants += 1;
    }
  }

  const ratio = groups.size === 0 ? 1 : groupsWithUniqueVariants / groups.size;
  const passed = ratio === 1;

  return {
    ratio: clampScore(ratio),
    passed,
    score: clampScore(ratio),
    detail: `${groupsWithUniqueVariants}/${groups.size} duplicate groups have unique semanticVariant values`,
  };
}

function validateDuplicateGroups(
  edges: readonly RealTemporalDedupedSequenceEdge[]
): RealTemporalDedupedDatasetQualityLockGroupValidation & {
  passed: boolean;
  score: number;
  detail: string;
} {
  const groups = new Map<string, RealTemporalDedupedSequenceEdge[]>();
  let ungroupedEdgeCount = 0;

  for (const edge of edges) {
    if (edge.duplicateGroupId === null) {
      ungroupedEdgeCount += 1;
      continue;
    }
    const bucket = groups.get(edge.duplicateGroupId) ?? [];
    bucket.push(edge);
    groups.set(edge.duplicateGroupId, bucket);
  }

  let validGroupCount = 0;
  let invalidGroupCount = 0;
  const invalidGroupIds: string[] = [];
  let groupedEdgeCount = 0;

  for (const [groupId, groupEdges] of groups.entries()) {
    groupedEdgeCount += groupEdges.length;
    const normalizedPredicates = new Set(groupEdges.map((edge) => edge.normalizedPredicate));
    const predicates = new Set(groupEdges.map((edge) => edge.predicate));
    const statuses = new Set(groupEdges.map((edge) => edge.deduplicationStatus));

    const valid =
      groupEdges.length >= 2 &&
      normalizedPredicates.size === 1 &&
      predicates.size === groupEdges.length &&
      statuses.has("differentiated");

    if (valid) {
      validGroupCount += 1;
    } else {
      invalidGroupCount += 1;
      invalidGroupIds.push(groupId);
    }
  }

  const passed = invalidGroupCount === 0;

  return Object.freeze({
    validGroupCount,
    invalidGroupCount,
    groupedEdgeCount,
    ungroupedEdgeCount,
    invalidGroupIds: Object.freeze(invalidGroupIds),
    passed,
    score: clampScore(invalidGroupCount === 0 ? 1 : validGroupCount / Math.max(groups.size, 1)),
    detail: `${validGroupCount} valid groups, ${invalidGroupCount} invalid, ${ungroupedEdgeCount} ungrouped edges`,
  });
}

function detectPaddingInflation(
  dedupedByteLength: number,
  temporalByteLength: number,
  usefulnessDistribution: RealTemporalDedupedDatasetQualityLockDistribution
): { detected: boolean; ratio: number; passed: boolean; score: number; detail: string } {
  const ratio = temporalByteLength === 0 ? 0 : dedupedByteLength / temporalByteLength;
  const identicalScoreRatio =
    usefulnessDistribution.sampleCount === 0
      ? 0
      : 1 - usefulnessDistribution.uniqueScoreCount / usefulnessDistribution.sampleCount;

  const detected =
    ratio > REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_MAX_INFLATION_RATIO ||
    identicalScoreRatio > 0.75;

  return {
    detected,
    ratio: Number(ratio.toFixed(4)),
    passed: !detected,
    score: clampScore(
      (ratio <= REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_MAX_INFLATION_RATIO ? 0.55 : 0.1) +
        (identicalScoreRatio <= 0.75 ? 0.45 : 0.05)
    ),
    detail: `byte ratio=${ratio.toFixed(4)}, identical usefulness ratio=${identicalScoreRatio.toFixed(4)}`,
  };
}

export function buildRealTemporalDedupedDatasetQualityLockFromAdapter(
  dedupedAdapter: RealV826TemporalDedupedCinematicDnaExportAdapter,
  options: {
    dedupedExportFingerprint: string;
    temporalExportFingerprint: string;
    dedupedExportByteLength: number;
    temporalExportByteLength: number;
  }
): RealTemporalDedupedDatasetQualityLock {
  if (dedupedAdapter.length !== REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_RECORD_COUNT) {
    throw new Error("Temporal deduped dataset quality lock requires three deduped export records");
  }

  const {
    dedupedExportFingerprint,
    temporalExportFingerprint,
    dedupedExportByteLength,
    temporalExportByteLength,
  } = options;

  const audit = buildRealTemporalDatasetQualityAuditFromAdapter(
    dedupedAdapter as unknown as RealV826TemporalCinematicDnaExportAdapter,
    dedupedExportFingerprint
  );
  const auditFingerprint = computeRealTemporalDatasetQualityAuditFingerprint(audit);

  const allEdges = collectAllDedupedEdges(dedupedAdapter);
  const schema = validateSchemaConsistency(dedupedAdapter);
  const usefulness = validateUsefulnessDistribution(allEdges);
  const semanticVariants = validateSemanticVariantUniqueness(allEdges);
  const duplicateGroups = validateDuplicateGroups(allEdges);
  const padding = detectPaddingInflation(
    dedupedExportByteLength,
    temporalExportByteLength,
    usefulness.distribution
  );

  const auditCheckPassed = audit.auditVerdict === "production-ready";

  const checks = Object.freeze([
    Object.freeze({
      checkId: "schema-consistency",
      label: "export schema consistency",
      passed: schema.passed,
      score: schema.score,
      detail: schema.detail,
    }),
    Object.freeze({
      checkId: "edge-usefulness-distribution",
      label: "edgeUsefulnessScore distribution",
      passed: usefulness.passed,
      score: usefulness.score,
      detail: usefulness.detail,
    }),
    Object.freeze({
      checkId: "semantic-variant-uniqueness",
      label: "semanticVariant uniqueness",
      passed: semanticVariants.passed,
      score: semanticVariants.score,
      detail: semanticVariants.detail,
    }),
    Object.freeze({
      checkId: "duplicate-group-validity",
      label: "duplicateGroupId grouping validity",
      passed: duplicateGroups.passed,
      score: duplicateGroups.score,
      detail: duplicateGroups.detail,
    }),
    Object.freeze({
      checkId: "no-padding-inflation",
      label: "no padding-like metadata inflation",
      passed: padding.passed,
      score: padding.score,
      detail: padding.detail,
    }),
    Object.freeze({
      checkId: "audit-production-ready",
      label: "audit production-ready maintained",
      passed: auditCheckPassed,
      score: auditCheckPassed ? 1 : 0,
      detail: `audit verdict=${audit.auditVerdict}`,
    }),
  ]);

  const allChecksPassed = checks.every((check) => check.passed);
  const lockStatus = allChecksPassed ? ("quality-locked" as const) : ("lock-blocked" as const);
  const lockVerdict = allChecksPassed
    ? ("production-ready-candidate" as const)
    : ("lock-rejected" as const);

  const lockId = digestValue(
    [
      REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_KIND_VERSION,
      dedupedExportFingerprint,
      lockStatus,
      String(allChecksPassed),
    ].join("|")
  );

  return Object.freeze({
    version: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_VERSION,
    lockId,
    lockVersion: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_KIND_VERSION,
    activeLockState: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_STATE,
    dedupedExportFingerprint,
    temporalExportFingerprint,
    auditFingerprint,
    auditVerdict: audit.auditVerdict,
    recordCount: REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_RECORD_COUNT,
    totalEdgeCount: countTemporalDedupedSequenceEdges(dedupedAdapter),
    totalTemporalEdgeCount: countTemporalDedupedMotionEdges(dedupedAdapter),
    dedupedExportByteLength,
    temporalExportByteLength,
    metadataInflationRatio: padding.ratio,
    checks,
    edgeUsefulnessDistribution: usefulness.distribution,
    semanticVariantUniquenessRatio: semanticVariants.ratio,
    duplicateGroupValidation: Object.freeze({
      validGroupCount: duplicateGroups.validGroupCount,
      invalidGroupCount: duplicateGroups.invalidGroupCount,
      groupedEdgeCount: duplicateGroups.groupedEdgeCount,
      ungroupedEdgeCount: duplicateGroups.ungroupedEdgeCount,
      invalidGroupIds: duplicateGroups.invalidGroupIds,
    }),
    schemaConsistencyScore: schema.score,
    paddingInflationDetected: padding.detected,
    allChecksPassed,
    lockStatus,
    lockVerdict,
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });
}

export function buildRealTemporalDedupedDatasetQualityLock(
  dedupedAdapter: RealV826TemporalDedupedCinematicDnaExportAdapter
): RealTemporalDedupedDatasetQualityLock {
  const dedupedExportFingerprint =
    computeRealV826TemporalDedupedCinematicDnaExportAdapterFingerprint(dedupedAdapter);
  const temporalDownload = buildRealV826TemporalCinematicDnaExportDownload();
  const dedupedDownload = buildRealV826TemporalDedupedCinematicDnaExportDownload();

  return buildRealTemporalDedupedDatasetQualityLockFromAdapter(dedupedAdapter, {
    dedupedExportFingerprint,
    temporalExportFingerprint: temporalDownload.exportFingerprint,
    dedupedExportByteLength: Buffer.byteLength(dedupedDownload.body, "utf8"),
    temporalExportByteLength: Buffer.byteLength(temporalDownload.body, "utf8"),
  });
}

export function serializeRealTemporalDedupedDatasetQualityLock(
  lock: RealTemporalDedupedDatasetQualityLock
): string {
  return JSON.stringify(
    orderRecord(lock as unknown as Record<string, unknown>, REAL_TEMPORAL_DEDUPED_DATASET_QUALITY_LOCK_KEY_ORDER),
    null,
    2
  );
}

export function computeRealTemporalDedupedDatasetQualityLockFingerprint(
  lock: RealTemporalDedupedDatasetQualityLock
): string {
  return digestValue(serializeRealTemporalDedupedDatasetQualityLock(lock));
}

export function buildRealTemporalDedupedDatasetQualityLockPreview(): RealTemporalDedupedDatasetQualityLock {
  if (cachedRealTemporalDedupedDatasetQualityLock !== null) {
    return cachedRealTemporalDedupedDatasetQualityLock;
  }

  const dedupedAdapter = buildRealV826TemporalDedupedCinematicDnaExportAdapter(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
  const dedupedDownload = buildRealV826TemporalDedupedCinematicDnaExportDownload();
  const temporalDownload = buildRealV826TemporalCinematicDnaExportDownload();

  const lock = buildRealTemporalDedupedDatasetQualityLockFromAdapter(dedupedAdapter, {
    dedupedExportFingerprint: dedupedDownload.exportFingerprint,
    temporalExportFingerprint: temporalDownload.exportFingerprint,
    dedupedExportByteLength: Buffer.byteLength(dedupedDownload.body, "utf8"),
    temporalExportByteLength: Buffer.byteLength(temporalDownload.body, "utf8"),
  });
  cachedRealTemporalDedupedDatasetQualityLock = lock;
  return lock;
}

export function resetRealTemporalDedupedDatasetQualityLockCacheForVerification(): void {
  cachedRealTemporalDedupedDatasetQualityLock = null;
}
