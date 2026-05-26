import { LEGACY_DNA_QUALITY_SCORE_OUTPUT_EXAMPLE } from "./legacy-dna-quality-score.fixtures.ts";
import {
  buildLegacyDnaUpgradeExecutionQueue,
  computeLegacyDnaUpgradeExecutionQueueFingerprint,
} from "./legacy-dna-upgrade-execution-queue.ts";

export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_INPUT_EXAMPLE = Object.freeze({
  legacyDnaQualityScore: LEGACY_DNA_QUALITY_SCORE_OUTPUT_EXAMPLE,
});

export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_OUTPUT_EXAMPLE = buildLegacyDnaUpgradeExecutionQueue(
  LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_INPUT_EXAMPLE.legacyDnaQualityScore
);

export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_FINGERPRINT =
  computeLegacyDnaUpgradeExecutionQueueFingerprint(
    LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_OUTPUT_EXAMPLE
  );

export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  legacyRecordId: "GONEGI-HARBOR-25S-SEGMENT-001",
  qualityTier: "elite" as const,
  overallQualityScore: 86.25,
  executionOrder: 0,
  upgradeAction: "lock-as-reference" as const,
  upgradePriority: "high" as const,
  targetBinding: "image-app-final-input-package-gonegi-harbor-25s-v1",
});

export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  executionQueueRootId: "legacy-dna-upgrade-execution-queue-gonegi-harbor-25s-v1",
  executionQueueVersion: "legacy-dna-upgrade-execution-queue-v1" as const,
  activeExecutionQueueState: "25s-legacy-dna-upgrade-execution-queue-metadata-only",
  totalExecutionQueueCount: 19,
  firstExecutionOrderLegacyRecordId: "GONEGI-HARBOR-25S-SEGMENT-001",
  lastExecutionOrderLegacyRecordId: "GOLDEN-GSET-002-STEAM-STACK-ANGLE",
});

export const LEGACY_DNA_UPGRADE_EXECUTION_QUEUE_TIER_ACTION_MAPPING = Object.freeze({
  elite: "lock-as-reference" as const,
  "upgrade-required-inferred": "normalize-inferred-fields" as const,
  "upgrade-required-uninferred": "backfill-empty-layers" as const,
  "archive-only": "archive-reference-only" as const,
});
