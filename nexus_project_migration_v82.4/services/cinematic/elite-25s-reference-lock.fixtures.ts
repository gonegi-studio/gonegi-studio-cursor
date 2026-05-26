import { LEGACY_DNA_UPGRADE_BINDING_OUTPUT_EXAMPLE } from "./legacy-dna-upgrade-binding.fixtures.ts";
import { LEGACY_DNA_UPGRADE_SAFETY_GATE_OUTPUT_EXAMPLE } from "./legacy-dna-upgrade-safety-gate.fixtures.ts";
import {
  buildElite25sReferenceLock,
  computeElite25sReferenceLockFingerprint,
  ELITE_25S_LEGACY_RECORD_IDS,
} from "./elite-25s-reference-lock.ts";

export const ELITE_25S_REFERENCE_LOCK_INPUT_EXAMPLE = Object.freeze({
  legacyDnaUpgradeSafetyGate: LEGACY_DNA_UPGRADE_SAFETY_GATE_OUTPUT_EXAMPLE,
  legacyDnaUpgradeBinding: LEGACY_DNA_UPGRADE_BINDING_OUTPUT_EXAMPLE,
});

export const ELITE_25S_REFERENCE_LOCK_OUTPUT_EXAMPLE = buildElite25sReferenceLock(
  ELITE_25S_REFERENCE_LOCK_INPUT_EXAMPLE.legacyDnaUpgradeSafetyGate,
  ELITE_25S_REFERENCE_LOCK_INPUT_EXAMPLE.legacyDnaUpgradeBinding
);

export const ELITE_25S_REFERENCE_LOCK_FINGERPRINT = computeElite25sReferenceLockFingerprint(
  ELITE_25S_REFERENCE_LOCK_OUTPUT_EXAMPLE
);

export const ELITE_25S_REFERENCE_LOCK_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  legacyRecordId: "GONEGI-HARBOR-25S-SEGMENT-001",
  executionOrder: 0,
  targetDatasetQueue: 0,
  lockStatus: "reference-locked" as const,
});

export const ELITE_25S_REFERENCE_LOCK_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  referenceLockRootId: "elite-25s-reference-lock-gonegi-harbor-25s-v1",
  referenceLockVersion: "elite-25s-reference-lock-v1" as const,
  activeReferenceLockState: "25s-elite-reference-lock-metadata-only",
  totalReferenceLockCount: ELITE_25S_LEGACY_RECORD_IDS.length,
  lockedLegacyRecordIds: ELITE_25S_LEGACY_RECORD_IDS,
});
