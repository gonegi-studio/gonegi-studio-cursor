import crypto from "crypto";
import type {
  LegacyDnaUpgradeAction,
  LegacyDnaUpgradeExecutionQueue,
} from "./legacy-dna-upgrade-execution-queue.ts";
import { computeLegacyDnaUpgradeExecutionQueueFingerprint } from "./legacy-dna-upgrade-execution-queue.ts";

export type LegacyDnaUpgradeSafetyStatus = "allowed" | "pending-plan-only" | "blocked";

export type LegacyDnaUpgradeVerificationMode = "metadata-only-pre-apply-gate";

export type LegacyDnaUpgradeSafetyGateItem = {
  safetyGateId: string;
  executionOrder: number;
  legacyRecordId: string;
  upgradeAction: LegacyDnaUpgradeAction;
  mutationAllowed: boolean;
  safetyStatus: LegacyDnaUpgradeSafetyStatus;
  blockedReason: string | null;
  verificationMode: LegacyDnaUpgradeVerificationMode;
};

export type LegacyDnaUpgradeSafetyGateSummary = {
  totalSafetyGateCount: number;
  allowedCount: number;
  pendingPlanOnlyCount: number;
  blockedCount: number;
};

export type LegacyDnaUpgradeSafetyGate = {
  version: "v1";
  safetyGateRootId: string;
  executionQueueRootId: string;
  legacyDnaUpgradeExecutionQueueFingerprint: string;
  sourceFingerprint: string;
  safetyGateVersion: typeof LEGACY_DNA_UPGRADE_SAFETY_GATE_KIND_VERSION;
  activeSafetyGateState: string;
  safetyGateSummary: LegacyDnaUpgradeSafetyGateSummary;
  items: readonly LegacyDnaUpgradeSafetyGateItem[];
};

export const LEGACY_DNA_UPGRADE_SAFETY_GATE_VERSION = "v1" as const;
export const LEGACY_DNA_UPGRADE_SAFETY_GATE_ID =
  "legacy-dna-upgrade-safety-gate-gonegi-harbor-25s-v1" as const;
export const LEGACY_DNA_UPGRADE_SAFETY_GATE_STATE =
  "25s-legacy-dna-upgrade-safety-gate-metadata-only" as const;
export const LEGACY_DNA_UPGRADE_SAFETY_GATE_KIND_VERSION =
  "legacy-dna-upgrade-safety-gate-v1" as const;
export const LEGACY_DNA_UPGRADE_VERIFICATION_MODE =
  "metadata-only-pre-apply-gate" as const;

const ARCHIVE_MUTATION_BLOCKED_REASON =
  "archive-reference-only-mutation-blocked" as const;

let cachedLegacyDnaUpgradeSafetyGate: LegacyDnaUpgradeSafetyGate | null = null;

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

function resolveSafetyDecision(queueItem: LegacyDnaUpgradeExecutionQueue["items"][number]): {
  mutationAllowed: boolean;
  safetyStatus: LegacyDnaUpgradeSafetyStatus;
  blockedReason: string | null;
} {
  switch (queueItem.upgradeAction) {
    case "lock-as-reference":
      return Object.freeze({
        mutationAllowed: true,
        safetyStatus: "allowed",
        blockedReason: null,
      });
    case "archive-reference-only":
      return Object.freeze({
        mutationAllowed: false,
        safetyStatus: "blocked",
        blockedReason: ARCHIVE_MUTATION_BLOCKED_REASON,
      });
    case "backfill-empty-layers":
    case "normalize-inferred-fields":
      return Object.freeze({
        mutationAllowed: false,
        safetyStatus: "pending-plan-only",
        blockedReason: null,
      });
  }
}

function computeSafetyGateId(executionOrder: number, legacyRecordId: string): string {
  return digestValue(
    [
      LEGACY_DNA_UPGRADE_SAFETY_GATE_KIND_VERSION,
      "legacy-upgrade-safety-gate-item",
      String(executionOrder),
      legacyRecordId,
    ].join("|")
  );
}

function buildLegacyDnaUpgradeSafetyGateItem(
  queueItem: LegacyDnaUpgradeExecutionQueue["items"][number]
): LegacyDnaUpgradeSafetyGateItem {
  const decision = resolveSafetyDecision(queueItem);

  return Object.freeze({
    safetyGateId: computeSafetyGateId(queueItem.executionOrder, queueItem.legacyRecordId),
    executionOrder: queueItem.executionOrder,
    legacyRecordId: queueItem.legacyRecordId,
    upgradeAction: queueItem.upgradeAction,
    mutationAllowed: decision.mutationAllowed,
    safetyStatus: decision.safetyStatus,
    blockedReason: decision.blockedReason,
    verificationMode: LEGACY_DNA_UPGRADE_VERIFICATION_MODE,
  });
}

function buildSafetyGateSummary(
  items: readonly LegacyDnaUpgradeSafetyGateItem[]
): LegacyDnaUpgradeSafetyGateSummary {
  return Object.freeze({
    totalSafetyGateCount: items.length,
    allowedCount: items.filter((item) => item.safetyStatus === "allowed").length,
    pendingPlanOnlyCount: items.filter((item) => item.safetyStatus === "pending-plan-only").length,
    blockedCount: items.filter((item) => item.safetyStatus === "blocked").length,
  });
}

export function buildLegacyDnaUpgradeSafetyGate(
  legacyDnaUpgradeExecutionQueue: LegacyDnaUpgradeExecutionQueue
): LegacyDnaUpgradeSafetyGate {
  if (cachedLegacyDnaUpgradeSafetyGate !== null) {
    return cachedLegacyDnaUpgradeSafetyGate;
  }

  if (legacyDnaUpgradeExecutionQueue.totalExecutionQueueCount !== 19) {
    throw new Error("Legacy dna upgrade safety gate requires nineteen execution queue items");
  }

  const items = Object.freeze(
    legacyDnaUpgradeExecutionQueue.items.map((queueItem) =>
      buildLegacyDnaUpgradeSafetyGateItem(queueItem)
    )
  );

  const gate = Object.freeze({
    version: LEGACY_DNA_UPGRADE_SAFETY_GATE_VERSION,
    safetyGateRootId: LEGACY_DNA_UPGRADE_SAFETY_GATE_ID,
    executionQueueRootId: legacyDnaUpgradeExecutionQueue.executionQueueRootId,
    legacyDnaUpgradeExecutionQueueFingerprint:
      computeLegacyDnaUpgradeExecutionQueueFingerprint(legacyDnaUpgradeExecutionQueue),
    sourceFingerprint: legacyDnaUpgradeExecutionQueue.sourceFingerprint,
    safetyGateVersion: LEGACY_DNA_UPGRADE_SAFETY_GATE_KIND_VERSION,
    activeSafetyGateState: LEGACY_DNA_UPGRADE_SAFETY_GATE_STATE,
    safetyGateSummary: buildSafetyGateSummary(items),
    items,
  });

  cachedLegacyDnaUpgradeSafetyGate = gate;
  return gate;
}

export const LEGACY_DNA_UPGRADE_SAFETY_GATE_ITEM_KEY_ORDER = Object.freeze([
  "safetyGateId",
  "executionOrder",
  "legacyRecordId",
  "upgradeAction",
  "mutationAllowed",
  "safetyStatus",
  "blockedReason",
  "verificationMode",
] as const);

export const LEGACY_DNA_UPGRADE_SAFETY_GATE_SUMMARY_KEY_ORDER = Object.freeze([
  "totalSafetyGateCount",
  "allowedCount",
  "pendingPlanOnlyCount",
  "blockedCount",
] as const);

export const LEGACY_DNA_UPGRADE_SAFETY_GATE_KEY_ORDER = Object.freeze([
  "version",
  "safetyGateRootId",
  "executionQueueRootId",
  "legacyDnaUpgradeExecutionQueueFingerprint",
  "sourceFingerprint",
  "safetyGateVersion",
  "activeSafetyGateState",
  "safetyGateSummary",
  "items",
] as const);

export function serializeLegacyDnaUpgradeSafetyGate(gate: LegacyDnaUpgradeSafetyGate): string {
  const orderedItems = gate.items.map((item) =>
    orderRecord(item, LEGACY_DNA_UPGRADE_SAFETY_GATE_ITEM_KEY_ORDER)
  );

  const orderedGate: Record<string, unknown> = {};
  for (const key of LEGACY_DNA_UPGRADE_SAFETY_GATE_KEY_ORDER) {
    if (key === "items") {
      orderedGate.items = orderedItems;
    } else if (key === "safetyGateSummary") {
      orderedGate.safetyGateSummary = orderRecord(
        gate.safetyGateSummary,
        LEGACY_DNA_UPGRADE_SAFETY_GATE_SUMMARY_KEY_ORDER
      );
    } else {
      orderedGate[key] = gate[key as keyof LegacyDnaUpgradeSafetyGate];
    }
  }

  return JSON.stringify(orderedGate);
}

export function computeLegacyDnaUpgradeSafetyGateFingerprint(
  gate: LegacyDnaUpgradeSafetyGate
): string {
  return digestValue(serializeLegacyDnaUpgradeSafetyGate(gate));
}

export function resetLegacyDnaUpgradeSafetyGateCacheForVerification(): void {
  cachedLegacyDnaUpgradeSafetyGate = null;
}
