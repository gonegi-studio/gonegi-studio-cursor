import crypto from "crypto";
import type { Elite25sReferenceLock } from "./elite-25s-reference-lock.ts";
import { computeElite25sReferenceLockFingerprint } from "./elite-25s-reference-lock.ts";

export type ReferenceDatasetAnchorRole =
  | "visual-reference"
  | "continuity-reference"
  | "prompt-reference";

export type ReferenceDatasetAnchorStatus = "anchor-registered";

export type ReferenceDatasetAnchorItem = {
  anchorId: string;
  queueOrder: number;
  legacyRecordId: string;
  referenceLockId: string;
  targetDatasetQueue: number;
  targetLockId: string;
  anchorRole: ReferenceDatasetAnchorRole;
  anchorStatus: ReferenceDatasetAnchorStatus;
  referenceFingerprint: string;
};

export type ReferenceDatasetAnchor = {
  version: "v1";
  anchorRootId: string;
  referenceLockRootId: string;
  elite25sReferenceLockFingerprint: string;
  sourceFingerprint: string;
  anchorVersion: typeof REFERENCE_DATASET_ANCHOR_KIND_VERSION;
  activeAnchorState: string;
  totalAnchorCount: number;
  items: readonly ReferenceDatasetAnchorItem[];
};

export const REFERENCE_DATASET_ANCHOR_VERSION = "v1" as const;
export const REFERENCE_DATASET_ANCHOR_ID =
  "reference-dataset-anchor-gonegi-harbor-25s-v1" as const;
export const REFERENCE_DATASET_ANCHOR_STATE =
  "25s-reference-dataset-anchor-metadata-only" as const;
export const REFERENCE_DATASET_ANCHOR_KIND_VERSION = "reference-dataset-anchor-v1" as const;

const ANCHOR_ROLE_BY_QUEUE_ORDER = Object.freeze({
  0: "visual-reference",
  1: "continuity-reference",
  2: "prompt-reference",
} as const satisfies Record<number, ReferenceDatasetAnchorRole>);

let cachedReferenceDatasetAnchor: ReferenceDatasetAnchor | null = null;

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

function resolveAnchorRole(queueOrder: number): ReferenceDatasetAnchorRole {
  const anchorRole = ANCHOR_ROLE_BY_QUEUE_ORDER[queueOrder as keyof typeof ANCHOR_ROLE_BY_QUEUE_ORDER];
  if (anchorRole === undefined) {
    throw new Error("Reference dataset anchor requires a queue order role definition");
  }
  return anchorRole;
}

function computeAnchorId(queueOrder: number, legacyRecordId: string): string {
  return digestValue(
    [
      REFERENCE_DATASET_ANCHOR_KIND_VERSION,
      "reference-dataset-anchor-item",
      String(queueOrder),
      legacyRecordId,
    ].join("|")
  );
}

function computeReferenceFingerprint(
  item: Omit<ReferenceDatasetAnchorItem, "referenceFingerprint">
): string {
  return digestValue(
    [
      REFERENCE_DATASET_ANCHOR_KIND_VERSION,
      item.anchorId,
      String(item.queueOrder),
      item.legacyRecordId,
      item.referenceLockId,
      String(item.targetDatasetQueue),
      item.targetLockId,
      item.anchorRole,
      item.anchorStatus,
    ].join("|")
  );
}

function buildReferenceDatasetAnchorItem(
  lockItem: Elite25sReferenceLock["items"][number]
): ReferenceDatasetAnchorItem {
  const queueOrder = lockItem.targetDatasetQueue;

  const baseItem: Omit<ReferenceDatasetAnchorItem, "referenceFingerprint"> = {
    anchorId: computeAnchorId(queueOrder, lockItem.legacyRecordId),
    queueOrder,
    legacyRecordId: lockItem.legacyRecordId,
    referenceLockId: lockItem.referenceLockId,
    targetDatasetQueue: lockItem.targetDatasetQueue,
    targetLockId: lockItem.targetLockId,
    anchorRole: resolveAnchorRole(queueOrder),
    anchorStatus: "anchor-registered",
  };

  return Object.freeze({
    ...baseItem,
    referenceFingerprint: computeReferenceFingerprint(baseItem),
  });
}

export function buildReferenceDatasetAnchor(
  elite25sReferenceLock: Elite25sReferenceLock
): ReferenceDatasetAnchor {
  if (cachedReferenceDatasetAnchor !== null) {
    return cachedReferenceDatasetAnchor;
  }

  if (elite25sReferenceLock.totalReferenceLockCount !== 3) {
    throw new Error("Reference dataset anchor requires exactly three reference lock items");
  }

  const orderedLockItems = [...elite25sReferenceLock.items].sort(
    (left, right) => left.targetDatasetQueue - right.targetDatasetQueue
  );

  const queueOrders = orderedLockItems.map((item) => item.targetDatasetQueue);
  if (queueOrders.join(",") !== "0,1,2") {
    throw new Error("Reference dataset anchor requires queue order zero through two");
  }

  const items = Object.freeze(
    orderedLockItems.map((lockItem) => buildReferenceDatasetAnchorItem(lockItem))
  );

  const anchor = Object.freeze({
    version: REFERENCE_DATASET_ANCHOR_VERSION,
    anchorRootId: REFERENCE_DATASET_ANCHOR_ID,
    referenceLockRootId: elite25sReferenceLock.referenceLockRootId,
    elite25sReferenceLockFingerprint:
      computeElite25sReferenceLockFingerprint(elite25sReferenceLock),
    sourceFingerprint: elite25sReferenceLock.sourceFingerprint,
    anchorVersion: REFERENCE_DATASET_ANCHOR_KIND_VERSION,
    activeAnchorState: REFERENCE_DATASET_ANCHOR_STATE,
    totalAnchorCount: items.length,
    items,
  });

  cachedReferenceDatasetAnchor = anchor;
  return anchor;
}

export const REFERENCE_DATASET_ANCHOR_ITEM_KEY_ORDER = Object.freeze([
  "anchorId",
  "queueOrder",
  "legacyRecordId",
  "referenceLockId",
  "targetDatasetQueue",
  "targetLockId",
  "anchorRole",
  "anchorStatus",
  "referenceFingerprint",
] as const);

export const REFERENCE_DATASET_ANCHOR_KEY_ORDER = Object.freeze([
  "version",
  "anchorRootId",
  "referenceLockRootId",
  "elite25sReferenceLockFingerprint",
  "sourceFingerprint",
  "anchorVersion",
  "activeAnchorState",
  "totalAnchorCount",
  "items",
] as const);

export function serializeReferenceDatasetAnchor(anchor: ReferenceDatasetAnchor): string {
  const orderedItems = anchor.items.map((item) =>
    orderRecord(item, REFERENCE_DATASET_ANCHOR_ITEM_KEY_ORDER)
  );

  const orderedAnchor: Record<string, unknown> = {};
  for (const key of REFERENCE_DATASET_ANCHOR_KEY_ORDER) {
    if (key === "items") {
      orderedAnchor.items = orderedItems;
    } else {
      orderedAnchor[key] = anchor[key as keyof ReferenceDatasetAnchor];
    }
  }

  return JSON.stringify(orderedAnchor);
}

export function computeReferenceDatasetAnchorFingerprint(
  anchor: ReferenceDatasetAnchor
): string {
  return digestValue(serializeReferenceDatasetAnchor(anchor));
}

export function resetReferenceDatasetAnchorCacheForVerification(): void {
  cachedReferenceDatasetAnchor = null;
}
