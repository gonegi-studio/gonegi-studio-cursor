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

const DATASET_EXPORT_PREVIEW_PACKAGE_ITEMS = Object.freeze([
  Object.freeze({
    packageItemId: "b464e45ad2c95722a9baef4cfd1311732c67f8744129a50207926f590fcfa7e9",
    lockId: "de8135a2cb47884a4c02358e0b157160bedfc609747dfe20b53090bd43c884e3",
    readinessItemId: "4dc3275064ab057ed32aa6fcdb70d36a92685452b42487d3416a434d41f7c6a6",
    queueOrder: 0,
    segmentId: "segment-001",
    datasetLayerKind: "frame-export" as const,
    lockStatus: "locked-ready" as const,
    lockItemFingerprint: "617acf948ca27fdbbdfc42a9e3afb32e0e6c64289445c0c73e8029b4ad5131f7",
    exportItemFingerprint: "1e1cc4368a8efff96e8d8ffe725fcb4b6049ca75a6f98aeeb420606181fa2b4e",
  }),
  Object.freeze({
    packageItemId: "0b0a561dc978280feae9e1b2b46ef8ffa30c99f7680ba88e9517ea97d6829032",
    lockId: "81a8f853bb19a8ed43cb861eb9dcce505430011d5ca56982bc0a43119d42044a",
    readinessItemId: "05025f4eb1d37525f1e69a6d7fa57bccf37a7f425be3da9808d934ccbf07b523",
    queueOrder: 1,
    segmentId: "segment-002",
    datasetLayerKind: "frame-export" as const,
    lockStatus: "locked-ready" as const,
    lockItemFingerprint: "752c2d4ed9124d4a669f0dce09fa2db23d5bca665474560a60929eb0e7d5581a",
    exportItemFingerprint: "177388cbcf747a99c72b6e35977f2d8d7ec7786a50a5f08032beab2569d4b563",
  }),
  Object.freeze({
    packageItemId: "ff77d5a853707010989f6b4825617c2d14da02de98624c76d89eab7dce859e1b",
    lockId: "ddaff6b01f4e6cefcead5d28eee1d76d0cd9b45efa6d337976dc5c1299aa39ca",
    readinessItemId: "c67a4829ea9c77fe1796cde41a5d098c9bc10f7dd2b53d91886b746e1c95a380",
    queueOrder: 2,
    segmentId: "segment-003",
    datasetLayerKind: "frame-export" as const,
    lockStatus: "locked-ready" as const,
    lockItemFingerprint: "ae6a6aac1375176a9d895df6217b2fde49d544b1c4873e670b8c7c6f1f983b3e",
    exportItemFingerprint: "51e171f56af41de80479dda9dff50ca977fc844738eaa2090d778d9800e0acb8",
  }),
  Object.freeze({
    packageItemId: "8bec2d7fd4a1fa0557b424f936bf4c15c966e102fc1ad6ec0aa0146bc2ef16fe",
    lockId: "8362cc4a2480e813e6399b233329f71288ab1f68ce896dc8ee5efe01e3c7bbf1",
    readinessItemId: "1ae718b654b1606ba039a56dea9ad0810fec5b906896ea61fe52c7ff2a00b315",
    queueOrder: 3,
    segmentId: "segment-001",
    datasetLayerKind: "segment-export" as const,
    lockStatus: "locked-ready" as const,
    lockItemFingerprint: "e6f7913f372a6a58e4be1bcde37e0691a5456e33d25de2c9e3cfce2548c2a039",
    exportItemFingerprint: "5c803cf7b33ced41f369bd21c4ed021d0d225e596e8decf3cb14c2875ae15b4d",
  }),
  Object.freeze({
    packageItemId: "2c79c956176c235904e31561a564b793c45030664950aa31957531f79ffb9236",
    lockId: "3c23885092b97df5a2ef50bd4f4abbd9ffa570e1867baca31a60a630d9171d5d",
    readinessItemId: "649ff9df73ec081affe3a2353d8b7a8b2b4ecb9ab9a11ec581186f8a94ab53fc",
    queueOrder: 4,
    segmentId: "segment-002",
    datasetLayerKind: "segment-export" as const,
    lockStatus: "locked-ready" as const,
    lockItemFingerprint: "bbdd830a38ab346a7b321df4eac77d16e2bbc9319ea45baac8bcf947b5efc00e",
    exportItemFingerprint: "e3f8f5f2c6918e5939ad92c2a18b9db5a2c51eece137f7d132378a4c8fca78f3",
  }),
  Object.freeze({
    packageItemId: "c40e7f677f0af94716bfbe9f7400ef097e480804b6db438718e55906a8067f47",
    lockId: "50e59a667ce78676aa75fc6b81e91899e42878bb1b90bbced763933c10ad3b4c",
    readinessItemId: "e19c5ad711241a92629352cbf8f9d7929b5f598b21be240d56985acfb59ee9c3",
    queueOrder: 5,
    segmentId: "segment-003",
    datasetLayerKind: "segment-export" as const,
    lockStatus: "locked-ready" as const,
    lockItemFingerprint: "b0da405ae8ce56486fe44957fbc68a6596794a2f7c2e73e420abda121d8387de",
    exportItemFingerprint: "841df0ca22dd03f3feb5c586175264e561354095ae466d1b48e50a25f724da4d",
  }),
] as const);

export const DATASET_EXPORT_PREVIEW_PACKAGE = Object.freeze({
  version: DATASET_EXPORT_PACKAGE_VERSION,
  packageId: DATASET_EXPORT_PACKAGE_ID,
  manifestId: "dataset-lock-manifest-gonegi-harbor-25s-v1",
  datasetLockManifestFingerprint:
    "9076860ad57cf597c818ff61563e219a7bd982ff5ea814ed05fb4ee4c60f9bfd",
  sourceFingerprint: "3397ecf7c62f94a60c8b05d175db34404150c707b3e8b3525acfdd5eae659589",
  datasetReadinessScore: 0.900205,
  exportPackageVersion: DATASET_EXPORT_PACKAGE_KIND_VERSION,
  activeExportPackageState: DATASET_EXPORT_PACKAGE_STATE,
  totalPackageItemCount: 6,
  items: DATASET_EXPORT_PREVIEW_PACKAGE_ITEMS,
});

export const DATASET_EXPORT_PREVIEW_FINGERPRINT =
  "5b6ad169b2300e041b5382f0e62db8d1d2b3b14621f2a5cbf5c84e0846d7fa7d" as const;

export type DatasetExportPreviewItemCounts = {
  totalItemCount: number;
  frameExportItemCount: number;
  segmentExportItemCount: number;
};

export type DatasetExportPreview = {
  datasetExportPackage: ReturnType<typeof JSON.parse>;
  fingerprint: string;
  itemCounts: DatasetExportPreviewItemCounts;
  readinessScore: number;
};

function partitionDatasetExportPreviewItems(exportPackage: DatasetExportPackage): {
  frameExportItems: readonly DatasetExportPackageItem[];
  segmentExportItems: readonly DatasetExportPackageItem[];
} {
  const orderedItems = [...exportPackage.items].sort((a, b) => a.queueOrder - b.queueOrder);
  return Object.freeze({
    frameExportItems: Object.freeze(orderedItems.filter((item) => item.datasetLayerKind === "frame-export")),
    segmentExportItems: Object.freeze(
      orderedItems.filter((item) => item.datasetLayerKind === "segment-export")
    ),
  });
}

export function buildDatasetExportPreviewFromPackage(
  exportPackage: DatasetExportPackage
): DatasetExportPreview {
  const fingerprint = computeDatasetExportPackageFingerprint(exportPackage);
  const { frameExportItems, segmentExportItems } = partitionDatasetExportPreviewItems(exportPackage);

  return Object.freeze({
    datasetExportPackage: JSON.parse(serializeDatasetExportPackage(exportPackage)),
    fingerprint,
    itemCounts: Object.freeze({
      totalItemCount: exportPackage.totalPackageItemCount,
      frameExportItemCount: frameExportItems.length,
      segmentExportItemCount: segmentExportItems.length,
    }),
    readinessScore: exportPackage.datasetReadinessScore,
  });
}

export function buildDatasetExportPreview(): DatasetExportPreview {
  return buildDatasetExportPreviewFromPackage(DATASET_EXPORT_PREVIEW_PACKAGE);
}

export function serializeDatasetExportPreview(preview: DatasetExportPreview): string {
  return JSON.stringify({
    datasetExportPackage: preview.datasetExportPackage,
    fingerprint: preview.fingerprint,
    itemCounts: preview.itemCounts,
    readinessScore: preview.readinessScore,
  });
}
