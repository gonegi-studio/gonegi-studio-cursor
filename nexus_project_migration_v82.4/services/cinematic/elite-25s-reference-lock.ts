import crypto from "crypto";
import type { LegacyDnaUpgradeBinding } from "./legacy-dna-upgrade-binding.ts";
import { computeLegacyDnaUpgradeBindingFingerprint } from "./legacy-dna-upgrade-binding.ts";
import type { LegacyDnaUpgradeSafetyGate } from "./legacy-dna-upgrade-safety-gate.ts";
import { computeLegacyDnaUpgradeSafetyGateFingerprint } from "./legacy-dna-upgrade-safety-gate.ts";

export type Elite25sReferenceLockStatus = "reference-locked";

export type Elite25sReferenceLockItem = {
  referenceLockId: string;
  legacyRecordId: string;
  executionOrder: number;
  targetDatasetQueue: number;
  targetLockId: string;
  lockStatus: Elite25sReferenceLockStatus;
  sourceSafetyGateId: string;
  referenceFingerprint: string;
};

export type Elite25sReferenceLock = {
  version: "v1";
  referenceLockRootId: string;
  safetyGateRootId: string;
  legacyDnaUpgradeSafetyGateFingerprint: string;
  legacyDnaUpgradeBindingFingerprint: string;
  sourceFingerprint: string;
  referenceLockVersion: typeof ELITE_25S_REFERENCE_LOCK_KIND_VERSION;
  activeReferenceLockState: string;
  totalReferenceLockCount: number;
  items: readonly Elite25sReferenceLockItem[];
};

export const ELITE_25S_REFERENCE_LOCK_VERSION = "v1" as const;
export const ELITE_25S_REFERENCE_LOCK_ID =
  "elite-25s-reference-lock-gonegi-harbor-25s-v1" as const;
export const ELITE_25S_REFERENCE_LOCK_STATE =
  "25s-elite-reference-lock-metadata-only" as const;
export const ELITE_25S_REFERENCE_LOCK_KIND_VERSION = "elite-25s-reference-lock-v1" as const;

export const ELITE_25S_LEGACY_RECORD_IDS = Object.freeze([
  "GONEGI-HARBOR-25S-SEGMENT-001",
  "GONEGI-HARBOR-25S-SEGMENT-002",
  "GONEGI-HARBOR-25S-SEGMENT-003",
] as const);

let cachedElite25sReferenceLock: Elite25sReferenceLock | null = null;

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

function resolveBindingItem(
  legacyDnaUpgradeBinding: LegacyDnaUpgradeBinding,
  legacyRecordId: string
): LegacyDnaUpgradeBinding["items"][number] {
  const bindingItem = legacyDnaUpgradeBinding.items.find(
    (item) => item.legacyRecordId === legacyRecordId
  );
  if (bindingItem === undefined) {
    throw new Error("Elite 25s reference lock requires a binding item");
  }
  return bindingItem;
}

function resolveAllowedSafetyGateItems(
  legacyDnaUpgradeSafetyGate: LegacyDnaUpgradeSafetyGate
): readonly LegacyDnaUpgradeSafetyGate["items"][number][] {
  return legacyDnaUpgradeSafetyGate.items.filter(
    (item) =>
      item.mutationAllowed === true &&
      item.safetyStatus === "allowed" &&
      item.upgradeAction === "lock-as-reference"
  );
}

function computeReferenceLockId(executionOrder: number, legacyRecordId: string): string {
  return digestValue(
    [
      ELITE_25S_REFERENCE_LOCK_KIND_VERSION,
      "elite-25s-reference-lock-item",
      String(executionOrder),
      legacyRecordId,
    ].join("|")
  );
}

function computeReferenceFingerprint(
  item: Omit<Elite25sReferenceLockItem, "referenceFingerprint">
): string {
  return digestValue(
    [
      ELITE_25S_REFERENCE_LOCK_KIND_VERSION,
      item.referenceLockId,
      item.legacyRecordId,
      String(item.executionOrder),
      String(item.targetDatasetQueue),
      item.targetLockId,
      item.lockStatus,
      item.sourceSafetyGateId,
    ].join("|")
  );
}

function buildElite25sReferenceLockItem(
  safetyGateItem: LegacyDnaUpgradeSafetyGate["items"][number],
  legacyDnaUpgradeBinding: LegacyDnaUpgradeBinding
): Elite25sReferenceLockItem {
  const bindingItem = resolveBindingItem(legacyDnaUpgradeBinding, safetyGateItem.legacyRecordId);
  if (typeof bindingItem.targetDatasetQueue !== "number") {
    throw new Error("Elite 25s reference lock requires a numeric dataset queue binding");
  }

  const baseItem: Omit<Elite25sReferenceLockItem, "referenceFingerprint"> = {
    referenceLockId: computeReferenceLockId(
      safetyGateItem.executionOrder,
      safetyGateItem.legacyRecordId
    ),
    legacyRecordId: safetyGateItem.legacyRecordId,
    executionOrder: safetyGateItem.executionOrder,
    targetDatasetQueue: bindingItem.targetDatasetQueue,
    targetLockId: bindingItem.targetLockId,
    lockStatus: "reference-locked",
    sourceSafetyGateId: safetyGateItem.safetyGateId,
  };

  return Object.freeze({
    ...baseItem,
    referenceFingerprint: computeReferenceFingerprint(baseItem),
  });
}

export function buildElite25sReferenceLock(
  legacyDnaUpgradeSafetyGate: LegacyDnaUpgradeSafetyGate,
  legacyDnaUpgradeBinding: LegacyDnaUpgradeBinding
): Elite25sReferenceLock {
  if (cachedElite25sReferenceLock !== null) {
    return cachedElite25sReferenceLock;
  }

  const allowedItems = resolveAllowedSafetyGateItems(legacyDnaUpgradeSafetyGate);
  if (allowedItems.length !== ELITE_25S_LEGACY_RECORD_IDS.length) {
    throw new Error("Elite 25s reference lock requires exactly three allowed safety gate items");
  }

  const allowedRecordIds = allowedItems.map((item) => item.legacyRecordId).sort();
  const expectedRecordIds = [...ELITE_25S_LEGACY_RECORD_IDS].sort();
  if (allowedRecordIds.join(",") !== expectedRecordIds.join(",")) {
    throw new Error("Elite 25s reference lock requires gonegi harbor segment records only");
  }

  const orderedAllowedItems = [...allowedItems].sort(
    (left, right) => left.executionOrder - right.executionOrder
  );

  const items = Object.freeze(
    orderedAllowedItems.map((safetyGateItem) =>
      buildElite25sReferenceLockItem(safetyGateItem, legacyDnaUpgradeBinding)
    )
  );

  const lock = Object.freeze({
    version: ELITE_25S_REFERENCE_LOCK_VERSION,
    referenceLockRootId: ELITE_25S_REFERENCE_LOCK_ID,
    safetyGateRootId: legacyDnaUpgradeSafetyGate.safetyGateRootId,
    legacyDnaUpgradeSafetyGateFingerprint:
      computeLegacyDnaUpgradeSafetyGateFingerprint(legacyDnaUpgradeSafetyGate),
    legacyDnaUpgradeBindingFingerprint:
      computeLegacyDnaUpgradeBindingFingerprint(legacyDnaUpgradeBinding),
    sourceFingerprint: legacyDnaUpgradeSafetyGate.sourceFingerprint,
    referenceLockVersion: ELITE_25S_REFERENCE_LOCK_KIND_VERSION,
    activeReferenceLockState: ELITE_25S_REFERENCE_LOCK_STATE,
    totalReferenceLockCount: items.length,
    items,
  });

  cachedElite25sReferenceLock = lock;
  return lock;
}

export const ELITE_25S_REFERENCE_LOCK_ITEM_KEY_ORDER = Object.freeze([
  "referenceLockId",
  "legacyRecordId",
  "executionOrder",
  "targetDatasetQueue",
  "targetLockId",
  "lockStatus",
  "sourceSafetyGateId",
  "referenceFingerprint",
] as const);

export const ELITE_25S_REFERENCE_LOCK_KEY_ORDER = Object.freeze([
  "version",
  "referenceLockRootId",
  "safetyGateRootId",
  "legacyDnaUpgradeSafetyGateFingerprint",
  "legacyDnaUpgradeBindingFingerprint",
  "sourceFingerprint",
  "referenceLockVersion",
  "activeReferenceLockState",
  "totalReferenceLockCount",
  "items",
] as const);

export function serializeElite25sReferenceLock(lock: Elite25sReferenceLock): string {
  const orderedItems = lock.items.map((item) =>
    orderRecord(item, ELITE_25S_REFERENCE_LOCK_ITEM_KEY_ORDER)
  );

  const orderedLock: Record<string, unknown> = {};
  for (const key of ELITE_25S_REFERENCE_LOCK_KEY_ORDER) {
    if (key === "items") {
      orderedLock.items = orderedItems;
    } else {
      orderedLock[key] = lock[key as keyof Elite25sReferenceLock];
    }
  }

  return JSON.stringify(orderedLock);
}

export function computeElite25sReferenceLockFingerprint(lock: Elite25sReferenceLock): string {
  return digestValue(serializeElite25sReferenceLock(lock));
}

export function resetElite25sReferenceLockCacheForVerification(): void {
  cachedElite25sReferenceLock = null;
}
