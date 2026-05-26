import crypto from "crypto";
import type { LegacyDnaQualityScore, LegacyDnaQualityTier } from "./legacy-dna-quality-score.ts";
import { computeLegacyDnaQualityScoreFingerprint } from "./legacy-dna-quality-score.ts";
import { LEGACY_V826_DNA_RECORD_CATALOG } from "./legacy-dna-upgrade-map.ts";

export type LegacyDnaUpgradeAction =
  | "lock-as-reference"
  | "backfill-empty-layers"
  | "normalize-inferred-fields"
  | "archive-reference-only";

export type LegacyDnaUpgradeExecutionPriority = "high" | "normal" | "deferred";

export type LegacyDnaUpgradeExecutionQueueItem = {
  queueId: string;
  legacyRecordId: string;
  qualityTier: LegacyDnaQualityTier;
  overallQualityScore: number;
  executionOrder: number;
  upgradeAction: LegacyDnaUpgradeAction;
  upgradePriority: LegacyDnaUpgradeExecutionPriority;
  targetBinding: string;
};

export type LegacyDnaUpgradeExecutionQueue = {
  version: "v1";
  executionQueueRootId: string;
  qualityScoreRootId: string;
  legacyDnaQualityScoreFingerprint: string;
  sourceFingerprint: string;
  executionQueueVersion: typeof LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_KIND_VERSION;
  activeExecutionQueueState: string;
  totalExecutionQueueCount: number;
  items: readonly LegacyDnaUpgradeExecutionQueueItem[];
};

export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_VERSION = "v1" as const;
export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_ID =
  "legacy-dna-upgrade-execution-queue-gonegi-harbor-25s-v1" as const;
export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_STATE =
  "25s-legacy-dna-upgrade-execution-queue-metadata-only" as const;
export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_KIND_VERSION =
  "legacy-dna-upgrade-execution-queue-v1" as const;

const TIER_EXECUTION_RANK = Object.freeze({
  elite: 0,
  "production-ready": 1,
  "upgrade-required": 2,
  "archive-only": 3,
} as const satisfies Record<LegacyDnaQualityTier, number>);

const UPGRADE_PRIORITY_BY_ACTION = Object.freeze({
  "lock-as-reference": "high",
  "backfill-empty-layers": "deferred",
  "normalize-inferred-fields": "deferred",
  "archive-reference-only": "normal",
} as const satisfies Record<LegacyDnaUpgradeAction, LegacyDnaUpgradeExecutionPriority>);

let cachedLegacyDnaUpgradeExecutionQueue: LegacyDnaUpgradeExecutionQueue | null = null;

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
    throw new Error("Legacy dna upgrade execution queue requires a catalog record");
  }
  return record;
}

function isInferredHeavyProvenance(observedFieldCount: number, inferredFieldCount: number): boolean {
  return inferredFieldCount * 3 >= observedFieldCount;
}

function resolveUpgradeAction(
  scoreItem: LegacyDnaQualityScore["items"][number]
): LegacyDnaUpgradeAction {
  if (scoreItem.qualityTier === "elite") {
    return "lock-as-reference";
  }
  if (scoreItem.qualityTier === "archive-only") {
    return "archive-reference-only";
  }

  const catalogRecord = resolveCatalogRecord(scoreItem.legacyRecordId);
  if (
    isInferredHeavyProvenance(
      catalogRecord.observedFieldCount,
      catalogRecord.inferredFieldCount
    )
  ) {
    return "normalize-inferred-fields";
  }
  return "backfill-empty-layers";
}

function resolveTargetBinding(legacyRecordId: string): string {
  return resolveCatalogRecord(legacyRecordId).canonicalDnaBindingTarget;
}

function compareExecutionQueueItems(
  left: LegacyDnaQualityScore["items"][number],
  right: LegacyDnaQualityScore["items"][number]
): number {
  const tierRankDelta =
    TIER_EXECUTION_RANK[left.qualityTier] - TIER_EXECUTION_RANK[right.qualityTier];
  if (tierRankDelta !== 0) {
    return tierRankDelta;
  }

  if (left.qualityTier === "elite" && right.qualityTier === "elite") {
    const leftQueue = typeof left.queueBinding === "number" ? left.queueBinding : Number.MAX_SAFE_INTEGER;
    const rightQueue = typeof right.queueBinding === "number" ? right.queueBinding : Number.MAX_SAFE_INTEGER;
    if (leftQueue !== rightQueue) {
      return leftQueue - rightQueue;
    }
  }

  if (left.overallQualityScore !== right.overallQualityScore) {
    return right.overallQualityScore - left.overallQualityScore;
  }

  return left.legacyRecordId.localeCompare(right.legacyRecordId);
}

function computeQueueId(executionOrder: number, legacyRecordId: string): string {
  return digestValue(
    [
      LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_KIND_VERSION,
      "legacy-upgrade-execution-queue-item",
      String(executionOrder),
      legacyRecordId,
    ].join("|")
  );
}

function buildLegacyDnaUpgradeExecutionQueueItem(
  scoreItem: LegacyDnaQualityScore["items"][number],
  executionOrder: number
): LegacyDnaUpgradeExecutionQueueItem {
  const upgradeAction = resolveUpgradeAction(scoreItem);

  return Object.freeze({
    queueId: computeQueueId(executionOrder, scoreItem.legacyRecordId),
    legacyRecordId: scoreItem.legacyRecordId,
    qualityTier: scoreItem.qualityTier,
    overallQualityScore: scoreItem.overallQualityScore,
    executionOrder,
    upgradeAction,
    upgradePriority: UPGRADE_PRIORITY_BY_ACTION[upgradeAction],
    targetBinding: resolveTargetBinding(scoreItem.legacyRecordId),
  });
}

export function buildLegacyDnaUpgradeExecutionQueue(
  legacyDnaQualityScore: LegacyDnaQualityScore
): LegacyDnaUpgradeExecutionQueue {
  if (cachedLegacyDnaUpgradeExecutionQueue !== null) {
    return cachedLegacyDnaUpgradeExecutionQueue;
  }

  if (legacyDnaQualityScore.tierDistribution.totalLegacyScoreCount !== 19) {
    throw new Error("Legacy dna upgrade execution queue requires nineteen quality score items");
  }

  const orderedScoreItems = [...legacyDnaQualityScore.items].sort(compareExecutionQueueItems);

  const items = Object.freeze(
    orderedScoreItems.map((scoreItem, executionOrder) =>
      buildLegacyDnaUpgradeExecutionQueueItem(scoreItem, executionOrder)
    )
  );

  const queue = Object.freeze({
    version: LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_VERSION,
    executionQueueRootId: LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_ID,
    qualityScoreRootId: legacyDnaQualityScore.scoreRootId,
    legacyDnaQualityScoreFingerprint: computeLegacyDnaQualityScoreFingerprint(legacyDnaQualityScore),
    sourceFingerprint: legacyDnaQualityScore.sourceFingerprint,
    executionQueueVersion: LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_KIND_VERSION,
    activeExecutionQueueState: LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_STATE,
    totalExecutionQueueCount: items.length,
    items,
  });

  cachedLegacyDnaUpgradeExecutionQueue = queue;
  return queue;
}

export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_ITEM_KEY_ORDER = Object.freeze([
  "queueId",
  "legacyRecordId",
  "qualityTier",
  "overallQualityScore",
  "executionOrder",
  "upgradeAction",
  "upgradePriority",
  "targetBinding",
] as const);

export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_KEY_ORDER = Object.freeze([
  "version",
  "executionQueueRootId",
  "qualityScoreRootId",
  "legacyDnaQualityScoreFingerprint",
  "sourceFingerprint",
  "executionQueueVersion",
  "activeExecutionQueueState",
  "totalExecutionQueueCount",
  "items",
] as const);

export function serializeLegacyDnaUpgradeExecutionQueue(
  queue: LegacyDnaUpgradeExecutionQueue
): string {
  const orderedItems = queue.items.map((item) =>
    orderRecord(item, LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_ITEM_KEY_ORDER)
  );

  const orderedQueue: Record<string, unknown> = {};
  for (const key of LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_KEY_ORDER) {
    if (key === "items") {
      orderedQueue.items = orderedItems;
    } else {
      orderedQueue[key] = queue[key as keyof LegacyDnaUpgradeExecutionQueue];
    }
  }

  return JSON.stringify(orderedQueue);
}

export function computeLegacyDnaUpgradeExecutionQueueFingerprint(
  queue: LegacyDnaUpgradeExecutionQueue
): string {
  return digestValue(serializeLegacyDnaUpgradeExecutionQueue(queue));
}

export function resetLegacyDnaUpgradeExecutionQueueCacheForVerification(): void {
  cachedLegacyDnaUpgradeExecutionQueue = null;
}
