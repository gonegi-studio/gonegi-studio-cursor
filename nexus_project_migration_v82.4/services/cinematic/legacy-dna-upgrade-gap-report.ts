import crypto from "crypto";
import type { LegacyDnaUpgradeBinding } from "./legacy-dna-upgrade-binding.ts";
import { computeLegacyDnaUpgradeBindingFingerprint } from "./legacy-dna-upgrade-binding.ts";
import { LEGACY_V826_DNA_RECORD_CATALOG } from "./legacy-dna-upgrade-map.ts";

export type LegacyUpgradeGapType =
  | "empty-visual-atoms"
  | "empty-relationship-graph"
  | "inferred-heavy-provenance"
  | "twenty-five-second-bound"
  | "archive-metadata-pending"
  | "legacy-unbound-metadata";

export type LegacyDnaUpgradeGapUrgency = "critical" | "elevated" | "standard" | "deferred";

export type LegacyDnaUpgradeGapItem = {
  gapItemId: string;
  legacyRecordId: string;
  bindingId: string;
  upgradePlanId: string;
  legacySchemaVersion: "v82.6";
  detectedGapTypes: readonly LegacyUpgradeGapType[];
  primaryGapType: LegacyUpgradeGapType;
  upgradeUrgency: LegacyDnaUpgradeGapUrgency;
  gapItemFingerprint: string;
};

export type LegacyDnaUpgradeGapDetectionSummary = {
  totalLegacyGapItemCount: number;
  visualAtomsEmptyGapCount: number;
  relationshipGraphEmptyGapCount: number;
  inferredHeavyGapCount: number;
  twentyFiveSecondBoundGapCount: number;
  archiveMetadataPendingGapCount: number;
  legacyUnboundGapCount: number;
};

export type LegacyDnaUpgradeGapReport = {
  version: "v1";
  reportId: string;
  bindingRootId: string;
  legacyDnaUpgradeBindingFingerprint: string;
  sourceFingerprint: string;
  reportVersion: typeof LEGACY_DNA_UPGRADE_GAP_REPORT_KIND_VERSION;
  activeReportState: string;
  gapDetection: LegacyDnaUpgradeGapDetectionSummary;
  items: readonly LegacyDnaUpgradeGapItem[];
};

export const LEGACY_DNA_UPGRADE_GAP_REPORT_VERSION = "v1" as const;
export const LEGACY_DNA_UPGRADE_GAP_REPORT_ID =
  "legacy-dna-upgrade-gap-report-gonegi-harbor-25s-v1" as const;
export const LEGACY_DNA_UPGRADE_GAP_REPORT_STATE =
  "25s-legacy-dna-upgrade-gap-report-metadata-only" as const;
export const LEGACY_DNA_UPGRADE_GAP_REPORT_KIND_VERSION =
  "legacy-dna-upgrade-gap-report-v1" as const;
export const LEGACY_DNA_UPGRADE_GAP_REPORT_SCHEMA_VERSION = "v82.6" as const;

const BINDING_CONTEXT_GAP_TYPE_BY_STATUS = Object.freeze({
  "bound-ready": "twenty-five-second-bound",
  "metadata-archive-pending": "archive-metadata-pending",
  "legacy-unbound-metadata": "legacy-unbound-metadata",
} as const satisfies Record<
  LegacyDnaUpgradeBinding["items"][number]["bindingStatus"],
  LegacyUpgradeGapType
>);

const PRIMARY_GAP_TYPE_PRIORITY = Object.freeze([
  "twenty-five-second-bound",
  "archive-metadata-pending",
  "inferred-heavy-provenance",
  "empty-visual-atoms",
  "empty-relationship-graph",
  "legacy-unbound-metadata",
] as const satisfies readonly LegacyUpgradeGapType[]);

let cachedLegacyDnaUpgradeGapReport: LegacyDnaUpgradeGapReport | null = null;

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

function resolveCatalogRecord(legacyRecordId: string) {
  const record = LEGACY_V826_DNA_RECORD_CATALOG.find(
    (candidate) => candidate.legacyRecordId === legacyRecordId
  );
  if (record === undefined) {
    throw new Error("Legacy dna upgrade gap report requires a catalog record");
  }
  return record;
}

function isInferredHeavyProvenance(observedFieldCount: number, inferredFieldCount: number): boolean {
  return inferredFieldCount * 3 >= observedFieldCount;
}

function resolveBindingContextGapType(
  bindingStatus: LegacyDnaUpgradeBinding["items"][number]["bindingStatus"]
): LegacyUpgradeGapType {
  return BINDING_CONTEXT_GAP_TYPE_BY_STATUS[bindingStatus];
}

function resolveDetectedGapTypes(
  bindingItem: LegacyDnaUpgradeBinding["items"][number]
): readonly LegacyUpgradeGapType[] {
  const catalogRecord = resolveCatalogRecord(bindingItem.legacyRecordId);
  const gapTypes: LegacyUpgradeGapType[] = [
    "empty-visual-atoms",
    "empty-relationship-graph",
    resolveBindingContextGapType(bindingItem.bindingStatus),
  ];

  if (
    isInferredHeavyProvenance(
      catalogRecord.observedFieldCount,
      catalogRecord.inferredFieldCount
    )
  ) {
    gapTypes.push("inferred-heavy-provenance");
  }

  return Object.freeze(gapTypes);
}

function resolvePrimaryGapType(detectedGapTypes: readonly LegacyUpgradeGapType[]): LegacyUpgradeGapType {
  for (const gapType of PRIMARY_GAP_TYPE_PRIORITY) {
    if (detectedGapTypes.includes(gapType)) {
      return gapType;
    }
  }
  return "legacy-unbound-metadata";
}

function resolveUpgradeUrgency(
  bindingStatus: LegacyDnaUpgradeBinding["items"][number]["bindingStatus"],
  detectedGapTypes: readonly LegacyUpgradeGapType[]
): LegacyDnaUpgradeGapUrgency {
  if (bindingStatus === "bound-ready") {
    return "critical";
  }
  if (bindingStatus === "metadata-archive-pending") {
    return "elevated";
  }
  if (detectedGapTypes.includes("inferred-heavy-provenance")) {
    return "elevated";
  }
  return "deferred";
}

function computeGapItemId(recordIndex: number, legacyRecordId: string): string {
  return digestValue(
    [
      LEGACY_DNA_UPGRADE_GAP_REPORT_KIND_VERSION,
      "legacy-gap-item",
      String(recordIndex),
      legacyRecordId,
    ].join("|")
  );
}

function computeGapItemFingerprint(
  item: Omit<LegacyDnaUpgradeGapItem, "gapItemFingerprint">
): string {
  return digestValue(
    [
      LEGACY_DNA_UPGRADE_GAP_REPORT_KIND_VERSION,
      item.gapItemId,
      item.legacyRecordId,
      item.bindingId,
      item.upgradePlanId,
      item.legacySchemaVersion,
      item.detectedGapTypes.join(","),
      item.primaryGapType,
      item.upgradeUrgency,
    ].join("|")
  );
}

function buildLegacyDnaUpgradeGapItem(
  bindingItem: LegacyDnaUpgradeBinding["items"][number],
  recordIndex: number
): LegacyDnaUpgradeGapItem {
  const detectedGapTypes = resolveDetectedGapTypes(bindingItem);

  const baseItem: Omit<LegacyDnaUpgradeGapItem, "gapItemFingerprint"> = {
    gapItemId: computeGapItemId(recordIndex, bindingItem.legacyRecordId),
    legacyRecordId: bindingItem.legacyRecordId,
    bindingId: bindingItem.bindingId,
    upgradePlanId: bindingItem.upgradePlanId,
    legacySchemaVersion: LEGACY_DNA_UPGRADE_GAP_REPORT_SCHEMA_VERSION,
    detectedGapTypes,
    primaryGapType: resolvePrimaryGapType(detectedGapTypes),
    upgradeUrgency: resolveUpgradeUrgency(bindingItem.bindingStatus, detectedGapTypes),
  };

  return Object.freeze({
    ...baseItem,
    gapItemFingerprint: computeGapItemFingerprint(baseItem),
  });
}

function buildGapDetectionSummary(
  items: readonly LegacyDnaUpgradeGapItem[]
): LegacyDnaUpgradeGapDetectionSummary {
  return Object.freeze({
    totalLegacyGapItemCount: items.length,
    visualAtomsEmptyGapCount: items.filter((item) =>
      item.detectedGapTypes.includes("empty-visual-atoms")
    ).length,
    relationshipGraphEmptyGapCount: items.filter((item) =>
      item.detectedGapTypes.includes("empty-relationship-graph")
    ).length,
    inferredHeavyGapCount: items.filter((item) =>
      item.detectedGapTypes.includes("inferred-heavy-provenance")
    ).length,
    twentyFiveSecondBoundGapCount: items.filter((item) =>
      item.detectedGapTypes.includes("twenty-five-second-bound")
    ).length,
    archiveMetadataPendingGapCount: items.filter((item) =>
      item.detectedGapTypes.includes("archive-metadata-pending")
    ).length,
    legacyUnboundGapCount: items.filter((item) =>
      item.detectedGapTypes.includes("legacy-unbound-metadata")
    ).length,
  });
}

export function buildLegacyDnaUpgradeGapReport(
  legacyDnaUpgradeBinding: LegacyDnaUpgradeBinding
): LegacyDnaUpgradeGapReport {
  if (cachedLegacyDnaUpgradeGapReport !== null) {
    return cachedLegacyDnaUpgradeGapReport;
  }

  if (legacyDnaUpgradeBinding.totalLegacyBindingCount !== 19) {
    throw new Error("Legacy dna upgrade gap report requires nineteen binding items");
  }

  const items = Object.freeze(
    legacyDnaUpgradeBinding.items.map((bindingItem, recordIndex) =>
      buildLegacyDnaUpgradeGapItem(bindingItem, recordIndex)
    )
  );

  const report = Object.freeze({
    version: LEGACY_DNA_UPGRADE_GAP_REPORT_VERSION,
    reportId: LEGACY_DNA_UPGRADE_GAP_REPORT_ID,
    bindingRootId: legacyDnaUpgradeBinding.bindingRootId,
    legacyDnaUpgradeBindingFingerprint:
      computeLegacyDnaUpgradeBindingFingerprint(legacyDnaUpgradeBinding),
    sourceFingerprint: legacyDnaUpgradeBinding.sourceFingerprint,
    reportVersion: LEGACY_DNA_UPGRADE_GAP_REPORT_KIND_VERSION,
    activeReportState: LEGACY_DNA_UPGRADE_GAP_REPORT_STATE,
    gapDetection: buildGapDetectionSummary(items),
    items,
  });

  cachedLegacyDnaUpgradeGapReport = report;
  return report;
}

export const LEGACY_DNA_UPGRADE_GAP_ITEM_KEY_ORDER = Object.freeze([
  "gapItemId",
  "legacyRecordId",
  "bindingId",
  "upgradePlanId",
  "legacySchemaVersion",
  "detectedGapTypes",
  "primaryGapType",
  "upgradeUrgency",
  "gapItemFingerprint",
] as const);

export const LEGACY_DNA_UPGRADE_GAP_DETECTION_KEY_ORDER = Object.freeze([
  "totalLegacyGapItemCount",
  "visualAtomsEmptyGapCount",
  "relationshipGraphEmptyGapCount",
  "inferredHeavyGapCount",
  "twentyFiveSecondBoundGapCount",
  "archiveMetadataPendingGapCount",
  "legacyUnboundGapCount",
] as const);

export const LEGACY_DNA_UPGRADE_GAP_REPORT_KEY_ORDER = Object.freeze([
  "version",
  "reportId",
  "bindingRootId",
  "legacyDnaUpgradeBindingFingerprint",
  "sourceFingerprint",
  "reportVersion",
  "activeReportState",
  "gapDetection",
  "items",
] as const);

export function serializeLegacyDnaUpgradeGapReport(report: LegacyDnaUpgradeGapReport): string {
  const orderedItems = report.items.map((item) =>
    orderRecord(item, LEGACY_DNA_UPGRADE_GAP_ITEM_KEY_ORDER)
  );

  const orderedReport: Record<string, unknown> = {};
  for (const key of LEGACY_DNA_UPGRADE_GAP_REPORT_KEY_ORDER) {
    if (key === "items") {
      orderedReport.items = orderedItems;
    } else if (key === "gapDetection") {
      orderedReport.gapDetection = orderRecord(
        report.gapDetection,
        LEGACY_DNA_UPGRADE_GAP_DETECTION_KEY_ORDER
      );
    } else {
      orderedReport[key] = report[key as keyof LegacyDnaUpgradeGapReport];
    }
  }

  return JSON.stringify(orderedReport);
}

export function computeLegacyDnaUpgradeGapReportFingerprint(
  report: LegacyDnaUpgradeGapReport
): string {
  return digestValue(serializeLegacyDnaUpgradeGapReport(report));
}

export function resetLegacyDnaUpgradeGapReportCacheForVerification(): void {
  cachedLegacyDnaUpgradeGapReport = null;
}
