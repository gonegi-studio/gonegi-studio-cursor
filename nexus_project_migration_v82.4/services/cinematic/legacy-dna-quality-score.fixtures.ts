import { LEGACY_DNA_UPGRADE_GAP_REPORT_OUTPUT_EXAMPLE } from "./legacy-dna-upgrade-gap-report.fixtures.ts";
import {
  buildLegacyDnaQualityScore,
  computeLegacyDnaQualityScoreFingerprint,
} from "./legacy-dna-quality-score.ts";

export const LEGACY_DNA_QUALITY_SCORE_INPUT_EXAMPLE = Object.freeze({
  legacyDnaUpgradeGapReport: LEGACY_DNA_UPGRADE_GAP_REPORT_OUTPUT_EXAMPLE,
});

export const LEGACY_DNA_QUALITY_SCORE_OUTPUT_EXAMPLE = buildLegacyDnaQualityScore(
  LEGACY_DNA_QUALITY_SCORE_INPUT_EXAMPLE.legacyDnaUpgradeGapReport
);

export const LEGACY_DNA_QUALITY_SCORE_FINGERPRINT = computeLegacyDnaQualityScoreFingerprint(
  LEGACY_DNA_QUALITY_SCORE_OUTPUT_EXAMPLE
);

export const LEGACY_DNA_QUALITY_SCORE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  legacyRecordId: "GONEGI-HARBOR-25S-SEGMENT-001",
  queueBinding: 0,
  completenessScore: 70,
  continuityScore: 100,
  evidenceReliabilityScore: 80,
  upgradePriorityScore: 95,
  overallQualityScore: 86.25,
  qualityTier: "elite" as const,
});

export const LEGACY_DNA_QUALITY_SCORE_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  scoreRootId: "legacy-dna-quality-score-gonegi-harbor-25s-v1",
  scoreVersion: "legacy-dna-quality-score-v1" as const,
  activeScoreState: "25s-legacy-dna-quality-score-metadata-only",
  tierDistribution: Object.freeze({
    totalLegacyScoreCount: 19,
    eliteTierCount: 3,
    productionReadyTierCount: 0,
    upgradeRequiredTierCount: 14,
    archiveOnlyTierCount: 2,
  }),
});
