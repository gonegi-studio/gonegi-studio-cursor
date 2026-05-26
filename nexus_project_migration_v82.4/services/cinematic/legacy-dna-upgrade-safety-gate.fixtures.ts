import { LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_OUTPUT_EXAMPLE } from "./legacy-dna-upgrade-execution-queue.fixtures.ts";
import {
  buildLegacyDnaUpgradeSafetyGate,
  computeLegacyDnaUpgradeSafetyGateFingerprint,
} from "./legacy-dna-upgrade-safety-gate.ts";

export const LEGACY_DNA_UPGRADE_SAFETY_GATE_INPUT_EXAMPLE = Object.freeze({
  legacyDnaUpgradeExecutionQueue: LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_OUTPUT_EXAMPLE,
});

export const LEGACY_DNA_UPGRADE_SAFETY_GATE_OUTPUT_EXAMPLE = buildLegacyDnaUpgradeSafetyGate(
  LEGACY_DNA_UPGRADE_SAFETY_GATE_INPUT_EXAMPLE.legacyDnaUpgradeExecutionQueue
);

export const LEGACY_DNA_UPGRADE_SAFETY_GATE_FINGERPRINT = computeLegacyDnaUpgradeSafetyGateFingerprint(
  LEGACY_DNA_UPGRADE_SAFETY_GATE_OUTPUT_EXAMPLE
);

export const LEGACY_DNA_UPGRADE_SAFETY_GATE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  legacyRecordId: "GONEGI-HARBOR-25S-SEGMENT-001",
  executionOrder: 0,
  upgradeAction: "lock-as-reference" as const,
  mutationAllowed: true,
  safetyStatus: "allowed" as const,
  blockedReason: null,
  verificationMode: "metadata-only-pre-apply-gate" as const,
});

export const LEGACY_DNA_UPGRADE_SAFETY_GATE_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  safetyGateRootId: "legacy-dna-upgrade-safety-gate-gonegi-harbor-25s-v1",
  safetyGateVersion: "legacy-dna-upgrade-safety-gate-v1" as const,
  activeSafetyGateState: "25s-legacy-dna-upgrade-safety-gate-metadata-only",
  safetyGateSummary: Object.freeze({
    totalSafetyGateCount: 19,
    allowedCount: 3,
    pendingPlanOnlyCount: 14,
    blockedCount: 2,
  }),
});
