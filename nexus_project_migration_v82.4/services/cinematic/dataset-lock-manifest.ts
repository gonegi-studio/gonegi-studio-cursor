import crypto from "crypto";
import type { DatasetLayerKind, DatasetReadinessBinding } from "./dataset-readiness-binding.ts";
import { computeDatasetReadinessBindingFingerprint } from "./dataset-readiness-binding.ts";

export type DatasetLockStatus = "locked-ready";

export type DatasetLockManifestItem = {
  lockId: string;
  readinessItemId: string;
  queueOrder: number;
  segmentId: string;
  datasetLayerKind: DatasetLayerKind;
  lockStatus: DatasetLockStatus;
  readinessItemFingerprint: string;
  lockItemFingerprint: string;
};

export type DatasetLockManifest = {
  version: "v1";
  manifestId: string;
  bindingId: string;
  datasetReadinessBindingFingerprint: string;
  sourceFingerprint: string;
  datasetReadinessScore: number;
  lockManifestVersion: typeof DATASET_LOCK_MANIFEST_KIND_VERSION;
  activeLockManifestState: string;
  lockStatus: DatasetLockStatus;
  totalLockItemCount: number;
  items: readonly DatasetLockManifestItem[];
};

export const DATASET_LOCK_MANIFEST_VERSION = "v1" as const;
export const DATASET_LOCK_MANIFEST_ID = "dataset-lock-manifest-gonegi-harbor-25s-v1" as const;
export const DATASET_LOCK_MANIFEST_STATE = "25s-dataset-lock-manifest-metadata-only" as const;
export const DATASET_LOCK_MANIFEST_KIND_VERSION = "dataset-lock-manifest-v1" as const;
export const DATASET_LOCK_STATUS: DatasetLockStatus = "locked-ready";

let cachedDatasetLockManifest: DatasetLockManifest | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computeLockItemId(queueOrder: number, readinessItemId: string): string {
  return digestValue(
    [DATASET_LOCK_MANIFEST_KIND_VERSION, "lock-item", String(queueOrder), readinessItemId].join("|")
  );
}

function computeLockItemFingerprint(
  item: Omit<DatasetLockManifestItem, "lockItemFingerprint">
): string {
  return digestValue(
    [
      DATASET_LOCK_MANIFEST_KIND_VERSION,
      item.lockId,
      item.readinessItemId,
      String(item.queueOrder),
      item.segmentId,
      item.datasetLayerKind,
      item.lockStatus,
      item.readinessItemFingerprint,
    ].join("|")
  );
}

function buildDatasetLockManifestItem(
  readinessItem: DatasetReadinessBinding["items"][number]
): DatasetLockManifestItem {
  const baseItem: Omit<DatasetLockManifestItem, "lockItemFingerprint"> = {
    lockId: computeLockItemId(readinessItem.queueOrder, readinessItem.readinessItemId),
    readinessItemId: readinessItem.readinessItemId,
    queueOrder: readinessItem.queueOrder,
    segmentId: readinessItem.segmentId,
    datasetLayerKind: readinessItem.datasetLayerKind,
    lockStatus: DATASET_LOCK_STATUS,
    readinessItemFingerprint: readinessItem.readinessItemFingerprint,
  };

  return Object.freeze({
    ...baseItem,
    lockItemFingerprint: computeLockItemFingerprint(baseItem),
  });
}

export function buildDatasetLockManifest(
  datasetReadinessBinding: DatasetReadinessBinding
): DatasetLockManifest {
  if (cachedDatasetLockManifest !== null) {
    return cachedDatasetLockManifest;
  }

  const datasetReadinessBindingFingerprint =
    computeDatasetReadinessBindingFingerprint(datasetReadinessBinding);
  const orderedReadinessItems = [...datasetReadinessBinding.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const items = Object.freeze(
    orderedReadinessItems.map((readinessItem) => buildDatasetLockManifestItem(readinessItem))
  );

  const manifest = Object.freeze({
    version: DATASET_LOCK_MANIFEST_VERSION,
    manifestId: DATASET_LOCK_MANIFEST_ID,
    bindingId: datasetReadinessBinding.bindingId,
    datasetReadinessBindingFingerprint,
    sourceFingerprint: datasetReadinessBinding.sourceFingerprint,
    datasetReadinessScore: datasetReadinessBinding.datasetReadinessScore,
    lockManifestVersion: DATASET_LOCK_MANIFEST_KIND_VERSION,
    activeLockManifestState: DATASET_LOCK_MANIFEST_STATE,
    lockStatus: DATASET_LOCK_STATUS,
    totalLockItemCount: items.length,
    items,
  });

  cachedDatasetLockManifest = manifest;
  return manifest;
}

export const DATASET_LOCK_MANIFEST_ITEM_KEY_ORDER = Object.freeze([
  "lockId",
  "readinessItemId",
  "queueOrder",
  "segmentId",
  "datasetLayerKind",
  "lockStatus",
  "readinessItemFingerprint",
  "lockItemFingerprint",
] as const);

export const DATASET_LOCK_MANIFEST_KEY_ORDER = Object.freeze([
  "version",
  "manifestId",
  "bindingId",
  "datasetReadinessBindingFingerprint",
  "sourceFingerprint",
  "datasetReadinessScore",
  "lockManifestVersion",
  "activeLockManifestState",
  "lockStatus",
  "totalLockItemCount",
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

export function serializeDatasetLockManifest(manifest: DatasetLockManifest): string {
  const orderedItems = [...manifest.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, DATASET_LOCK_MANIFEST_ITEM_KEY_ORDER));

  const orderedManifest: Record<string, unknown> = {};
  for (const key of DATASET_LOCK_MANIFEST_KEY_ORDER) {
    if (key === "items") {
      orderedManifest.items = orderedItems;
    } else {
      orderedManifest[key] = manifest[key as keyof DatasetLockManifest];
    }
  }

  return JSON.stringify(orderedManifest);
}

export function computeDatasetLockManifestFingerprint(manifest: DatasetLockManifest): string {
  return digestValue(serializeDatasetLockManifest(manifest));
}

export function resetDatasetLockManifestCacheForVerification(): void {
  cachedDatasetLockManifest = null;
}
