import crypto from "crypto";
import type { DatasetLayerKind } from "./dataset-readiness-binding.ts";
import type { DatasetLockManifest, DatasetLockStatus } from "./dataset-lock-manifest.ts";
import { computeDatasetLockManifestFingerprint } from "./dataset-lock-manifest.ts";

export type DatasetExportPackageItem = {
  packageItemId: string;
  lockId: string;
  readinessItemId: string;
  queueOrder: number;
  segmentId: string;
  datasetLayerKind: DatasetLayerKind;
  lockStatus: DatasetLockStatus;
  lockItemFingerprint: string;
  exportItemFingerprint: string;
};

export type DatasetExportPackage = {
  version: "v1";
  packageId: string;
  manifestId: string;
  datasetLockManifestFingerprint: string;
  sourceFingerprint: string;
  datasetReadinessScore: number;
  exportPackageVersion: typeof DATASET_EXPORT_PACKAGE_KIND_VERSION;
  activeExportPackageState: string;
  totalPackageItemCount: number;
  items: readonly DatasetExportPackageItem[];
};

export const DATASET_EXPORT_PACKAGE_VERSION = "v1" as const;
export const DATASET_EXPORT_PACKAGE_ID = "dataset-export-package-gonegi-harbor-25s-v1" as const;
export const DATASET_EXPORT_PACKAGE_STATE = "25s-dataset-export-package-metadata-only" as const;
export const DATASET_EXPORT_PACKAGE_KIND_VERSION = "dataset-export-package-v1" as const;

let cachedDatasetExportPackage: DatasetExportPackage | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computePackageItemId(queueOrder: number, lockId: string): string {
  return digestValue(
    [DATASET_EXPORT_PACKAGE_KIND_VERSION, "export-package-item", String(queueOrder), lockId].join(
      "|"
    )
  );
}

function computeExportItemFingerprint(
  item: Omit<DatasetExportPackageItem, "exportItemFingerprint">
): string {
  return digestValue(
    [
      DATASET_EXPORT_PACKAGE_KIND_VERSION,
      item.packageItemId,
      item.lockId,
      item.readinessItemId,
      String(item.queueOrder),
      item.segmentId,
      item.datasetLayerKind,
      item.lockStatus,
      item.lockItemFingerprint,
    ].join("|")
  );
}

function buildDatasetExportPackageItem(
  lockItem: DatasetLockManifest["items"][number]
): DatasetExportPackageItem {
  const baseItem: Omit<DatasetExportPackageItem, "exportItemFingerprint"> = {
    packageItemId: computePackageItemId(lockItem.queueOrder, lockItem.lockId),
    lockId: lockItem.lockId,
    readinessItemId: lockItem.readinessItemId,
    queueOrder: lockItem.queueOrder,
    segmentId: lockItem.segmentId,
    datasetLayerKind: lockItem.datasetLayerKind,
    lockStatus: lockItem.lockStatus,
    lockItemFingerprint: lockItem.lockItemFingerprint,
  };

  return Object.freeze({
    ...baseItem,
    exportItemFingerprint: computeExportItemFingerprint(baseItem),
  });
}

export function buildDatasetExportPackage(
  datasetLockManifest: DatasetLockManifest
): DatasetExportPackage {
  if (cachedDatasetExportPackage !== null) {
    return cachedDatasetExportPackage;
  }

  const datasetLockManifestFingerprint = computeDatasetLockManifestFingerprint(datasetLockManifest);
  const orderedLockItems = [...datasetLockManifest.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const items = Object.freeze(
    orderedLockItems.map((lockItem) => buildDatasetExportPackageItem(lockItem))
  );

  const exportPackage = Object.freeze({
    version: DATASET_EXPORT_PACKAGE_VERSION,
    packageId: DATASET_EXPORT_PACKAGE_ID,
    manifestId: datasetLockManifest.manifestId,
    datasetLockManifestFingerprint,
    sourceFingerprint: datasetLockManifest.sourceFingerprint,
    datasetReadinessScore: datasetLockManifest.datasetReadinessScore,
    exportPackageVersion: DATASET_EXPORT_PACKAGE_KIND_VERSION,
    activeExportPackageState: DATASET_EXPORT_PACKAGE_STATE,
    totalPackageItemCount: items.length,
    items,
  });

  cachedDatasetExportPackage = exportPackage;
  return exportPackage;
}

export const DATASET_EXPORT_PACKAGE_ITEM_KEY_ORDER = Object.freeze([
  "packageItemId",
  "lockId",
  "readinessItemId",
  "queueOrder",
  "segmentId",
  "datasetLayerKind",
  "lockStatus",
  "lockItemFingerprint",
  "exportItemFingerprint",
] as const);

export const DATASET_EXPORT_PACKAGE_KEY_ORDER = Object.freeze([
  "version",
  "packageId",
  "manifestId",
  "datasetLockManifestFingerprint",
  "sourceFingerprint",
  "datasetReadinessScore",
  "exportPackageVersion",
  "activeExportPackageState",
  "totalPackageItemCount",
  "items",
] as const);

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

export function serializeDatasetExportPackage(exportPackage: DatasetExportPackage): string {
  const orderedItems = [...exportPackage.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, DATASET_EXPORT_PACKAGE_ITEM_KEY_ORDER));

  const orderedExportPackage: Record<string, unknown> = {};
  for (const key of DATASET_EXPORT_PACKAGE_KEY_ORDER) {
    if (key === "items") {
      orderedExportPackage.items = orderedItems;
    } else {
      orderedExportPackage[key] = exportPackage[key as keyof DatasetExportPackage];
    }
  }

  return JSON.stringify(orderedExportPackage);
}

export function computeDatasetExportPackageFingerprint(
  exportPackage: DatasetExportPackage
): string {
  return digestValue(serializeDatasetExportPackage(exportPackage));
}

export function resetDatasetExportPackageCacheForVerification(): void {
  cachedDatasetExportPackage = null;
}
