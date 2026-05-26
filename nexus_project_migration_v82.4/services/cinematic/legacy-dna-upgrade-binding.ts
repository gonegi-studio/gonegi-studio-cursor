import crypto from "crypto";
import type { DatasetLockManifest } from "./dataset-lock-manifest.ts";
import { computeDatasetLockManifestFingerprint } from "./dataset-lock-manifest.ts";
import type { DatasetReadinessBinding } from "./dataset-readiness-binding.ts";
import { computeDatasetReadinessBindingFingerprint } from "./dataset-readiness-binding.ts";
import type { LegacyDnaUpgradeMap } from "./legacy-dna-upgrade-map.ts";
import { computeLegacyDnaUpgradeMapFingerprint } from "./legacy-dna-upgrade-map.ts";

export type LegacyDnaUpgradeBindingStatus =
  | "bound-ready"
  | "metadata-archive-pending"
  | "legacy-unbound-metadata";

export type LegacyDnaUpgradePriority = "high" | "normal" | "deferred";

export type LegacyDnaUpgradeBindingItem = {
  bindingId: string;
  legacyRecordId: string;
  legacySchemaVersion: "v82.6";
  targetDatasetQueue: number | string;
  targetLockId: string;
  upgradePlanId: string;
  upgradePriority: LegacyDnaUpgradePriority;
  bindingStatus: LegacyDnaUpgradeBindingStatus;
  bindingItemFingerprint: string;
};

export type LegacyDnaUpgradeBinding = {
  version: "v1";
  bindingRootId: string;
  upgradeMapId: string;
  legacyDnaUpgradeMapFingerprint: string;
  datasetReadinessBindingId: string;
  datasetReadinessBindingFingerprint: string;
  datasetLockManifestId: string;
  datasetLockManifestFingerprint: string;
  sourceFingerprint: string;
  bindingVersion: typeof LEGACY_DNA_UPGRADE_BINDING_KIND_VERSION;
  activeBindingState: string;
  totalLegacyBindingCount: number;
  twentyFiveSecondLinkCount: number;
  items: readonly LegacyDnaUpgradeBindingItem[];
};

export const LEGACY_DNA_UPGRADE_BINDING_VERSION = "v1" as const;
export const LEGACY_DNA_UPGRADE_BINDING_ID =
  "legacy-dna-upgrade-binding-gonegi-harbor-25s-v1" as const;
export const LEGACY_DNA_UPGRADE_BINDING_STATE =
  "25s-legacy-dna-upgrade-binding-metadata-only" as const;
export const LEGACY_DNA_UPGRADE_BINDING_KIND_VERSION =
  "legacy-dna-upgrade-binding-v1" as const;
export const LEGACY_DNA_UPGRADE_BINDING_SCHEMA_VERSION = "v82.6" as const;

const TWENTY_FIVE_SECOND_QUEUE_BY_LINK_ID = Object.freeze({
  "gonegi-harbor-25s-queue-0": 0,
  "gonegi-harbor-25s-queue-1": 1,
  "gonegi-harbor-25s-queue-2": 2,
} as const);

let cachedLegacyDnaUpgradeBinding: LegacyDnaUpgradeBinding | null = null;

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

function resolveTwentyFiveSecondQueue(
  coverageLinkId: string
): number | undefined {
  return TWENTY_FIVE_SECOND_QUEUE_BY_LINK_ID[
    coverageLinkId as keyof typeof TWENTY_FIVE_SECOND_QUEUE_BY_LINK_ID
  ];
}

function resolveFrameExportLockItem(
  datasetLockManifest: DatasetLockManifest,
  queueOrder: number
): DatasetLockManifest["items"][number] {
  const lockItem = datasetLockManifest.items.find(
    (item) => item.queueOrder === queueOrder && item.datasetLayerKind === "frame-export"
  );
  if (lockItem === undefined) {
    throw new Error("Legacy dna upgrade binding requires a frame-export lock item");
  }
  return lockItem;
}

function resolveUnboundLockId(legacyRecordId: string): string {
  return digestValue(
    [
      LEGACY_DNA_UPGRADE_BINDING_KIND_VERSION,
      "legacy-unbound-lock",
      legacyRecordId,
    ].join("|")
  );
}

function resolveUpgradePriority(
  mapItem: LegacyDnaUpgradeMap["items"][number]
): LegacyDnaUpgradePriority {
  if (mapItem.twentyFiveSecondCoverageLinkId !== null) {
    return "high";
  }
  if (mapItem.directorFamily === "Golden-Set-Reference") {
    return "normal";
  }
  return "deferred";
}

function resolveBindingStatus(
  mapItem: LegacyDnaUpgradeMap["items"][number]
): LegacyDnaUpgradeBindingStatus {
  if (mapItem.twentyFiveSecondCoverageLinkId !== null) {
    return "bound-ready";
  }
  if (mapItem.directorFamily === "Golden-Set-Reference") {
    return "metadata-archive-pending";
  }
  return "legacy-unbound-metadata";
}

function resolveTargetDatasetQueue(
  mapItem: LegacyDnaUpgradeMap["items"][number]
): number | string {
  if (mapItem.twentyFiveSecondCoverageLinkId !== null) {
    const queueOrder = resolveTwentyFiveSecondQueue(mapItem.twentyFiveSecondCoverageLinkId);
    if (queueOrder === undefined) {
      throw new Error("Legacy dna upgrade binding requires a 25s queue link definition");
    }
    return queueOrder;
  }
  return `legacy-archive-slot-${String(mapItem.recordIndex).padStart(2, "0")}`;
}

function computeLegacyBindingItemId(recordIndex: number, legacyRecordId: string): string {
  return digestValue(
    [
      LEGACY_DNA_UPGRADE_BINDING_KIND_VERSION,
      "legacy-binding-item",
      String(recordIndex),
      legacyRecordId,
    ].join("|")
  );
}

function computeBindingItemFingerprint(
  item: Omit<LegacyDnaUpgradeBindingItem, "bindingItemFingerprint">
): string {
  return digestValue(
    [
      LEGACY_DNA_UPGRADE_BINDING_KIND_VERSION,
      item.bindingId,
      item.legacyRecordId,
      item.legacySchemaVersion,
      String(item.targetDatasetQueue),
      item.targetLockId,
      item.upgradePlanId,
      item.upgradePriority,
      item.bindingStatus,
    ].join("|")
  );
}

function buildLegacyDnaUpgradeBindingItem(
  mapItem: LegacyDnaUpgradeMap["items"][number],
  datasetLockManifest: DatasetLockManifest
): LegacyDnaUpgradeBindingItem {
  const targetDatasetQueue = resolveTargetDatasetQueue(mapItem);
  const targetLockId =
    typeof targetDatasetQueue === "number"
      ? resolveFrameExportLockItem(datasetLockManifest, targetDatasetQueue).lockId
      : resolveUnboundLockId(mapItem.legacyRecordId);

  const baseItem: Omit<LegacyDnaUpgradeBindingItem, "bindingItemFingerprint"> = {
    bindingId: computeLegacyBindingItemId(mapItem.recordIndex, mapItem.legacyRecordId),
    legacyRecordId: mapItem.legacyRecordId,
    legacySchemaVersion: LEGACY_DNA_UPGRADE_BINDING_SCHEMA_VERSION,
    targetDatasetQueue,
    targetLockId,
    upgradePlanId: mapItem.upgradeMapItemId,
    upgradePriority: resolveUpgradePriority(mapItem),
    bindingStatus: resolveBindingStatus(mapItem),
  };

  return Object.freeze({
    ...baseItem,
    bindingItemFingerprint: computeBindingItemFingerprint(baseItem),
  });
}

export function buildLegacyDnaUpgradeBinding(
  legacyDnaUpgradeMap: LegacyDnaUpgradeMap,
  datasetReadinessBinding: DatasetReadinessBinding,
  datasetLockManifest: DatasetLockManifest
): LegacyDnaUpgradeBinding {
  if (cachedLegacyDnaUpgradeBinding !== null) {
    return cachedLegacyDnaUpgradeBinding;
  }

  if (legacyDnaUpgradeMap.totalLegacyRecordCount !== 19) {
    throw new Error("Legacy dna upgrade binding requires nineteen legacy upgrade map items");
  }

  const legacyDnaUpgradeMapFingerprint = computeLegacyDnaUpgradeMapFingerprint(legacyDnaUpgradeMap);
  const datasetReadinessBindingFingerprint =
    computeDatasetReadinessBindingFingerprint(datasetReadinessBinding);
  const datasetLockManifestFingerprint = computeDatasetLockManifestFingerprint(datasetLockManifest);

  const orderedMapItems = [...legacyDnaUpgradeMap.items].sort(
    (a, b) => a.recordIndex - b.recordIndex
  );

  const items = Object.freeze(
    orderedMapItems.map((mapItem) => buildLegacyDnaUpgradeBindingItem(mapItem, datasetLockManifest))
  );

  const twentyFiveSecondLinkCount = items.filter((item) => item.upgradePriority === "high").length;

  const binding = Object.freeze({
    version: LEGACY_DNA_UPGRADE_BINDING_VERSION,
    bindingRootId: LEGACY_DNA_UPGRADE_BINDING_ID,
    upgradeMapId: legacyDnaUpgradeMap.mapId,
    legacyDnaUpgradeMapFingerprint,
    datasetReadinessBindingId: datasetReadinessBinding.bindingId,
    datasetReadinessBindingFingerprint,
    datasetLockManifestId: datasetLockManifest.manifestId,
    datasetLockManifestFingerprint,
    sourceFingerprint: legacyDnaUpgradeMap.sourceFingerprint,
    bindingVersion: LEGACY_DNA_UPGRADE_BINDING_KIND_VERSION,
    activeBindingState: LEGACY_DNA_UPGRADE_BINDING_STATE,
    totalLegacyBindingCount: items.length,
    twentyFiveSecondLinkCount,
    items,
  });

  cachedLegacyDnaUpgradeBinding = binding;
  return binding;
}

export const LEGACY_DNA_UPGRADE_BINDING_ITEM_KEY_ORDER = Object.freeze([
  "bindingId",
  "legacyRecordId",
  "legacySchemaVersion",
  "targetDatasetQueue",
  "targetLockId",
  "upgradePlanId",
  "upgradePriority",
  "bindingStatus",
  "bindingItemFingerprint",
] as const);

export const LEGACY_DNA_UPGRADE_BINDING_KEY_ORDER = Object.freeze([
  "version",
  "bindingRootId",
  "upgradeMapId",
  "legacyDnaUpgradeMapFingerprint",
  "datasetReadinessBindingId",
  "datasetReadinessBindingFingerprint",
  "datasetLockManifestId",
  "datasetLockManifestFingerprint",
  "sourceFingerprint",
  "bindingVersion",
  "activeBindingState",
  "totalLegacyBindingCount",
  "twentyFiveSecondLinkCount",
  "items",
] as const);

export function serializeLegacyDnaUpgradeBinding(binding: LegacyDnaUpgradeBinding): string {
  const orderedItems = binding.items.map((item) =>
    orderRecord(item, LEGACY_DNA_UPGRADE_BINDING_ITEM_KEY_ORDER)
  );

  const orderedBinding: Record<string, unknown> = {};
  for (const key of LEGACY_DNA_UPGRADE_BINDING_KEY_ORDER) {
    if (key === "items") {
      orderedBinding.items = orderedItems;
    } else {
      orderedBinding[key] = binding[key as keyof LegacyDnaUpgradeBinding];
    }
  }

  return JSON.stringify(orderedBinding);
}

export function computeLegacyDnaUpgradeBindingFingerprint(
  binding: LegacyDnaUpgradeBinding
): string {
  return digestValue(serializeLegacyDnaUpgradeBinding(binding));
}

export function resetLegacyDnaUpgradeBindingCacheForVerification(): void {
  cachedLegacyDnaUpgradeBinding = null;
}
