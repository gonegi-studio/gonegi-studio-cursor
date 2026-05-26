import crypto from "crypto";
import type { LegacyDnaUpgradeGapReport } from "./legacy-dna-upgrade-gap-report.ts";
import { computeLegacyDnaUpgradeGapReportFingerprint } from "./legacy-dna-upgrade-gap-report.ts";

export type LegacyDnaQualityTier =
  | "elite"
  | "production-ready"
  | "upgrade-required"
  | "archive-only";

export type LegacyDnaQualityScoreItem = {
  qualityScoreId: string;
  legacyRecordId: string;
  queueBinding: number | string;
  completenessScore: number;
  continuityScore: number;
  evidenceReliabilityScore: number;
  upgradePriorityScore: number;
  overallQualityScore: number;
  qualityTier: LegacyDnaQualityTier;
};

export type LegacyDnaQualityTierDistribution = {
  totalLegacyScoreCount: number;
  eliteTierCount: number;
  productionReadyTierCount: number;
  upgradeRequiredTierCount: number;
  archiveOnlyTierCount: number;
};

export type LegacyDnaQualityScore = {
  version: "v1";
  scoreRootId: string;
  gapReportId: string;
  legacyDnaUpgradeGapReportFingerprint: string;
  sourceFingerprint: string;
  scoreVersion: typeof LEGACY_DNA_QUALITY_SCORE_KIND_VERSION;
  activeScoreState: string;
  tierDistribution: LegacyDnaQualityTierDistribution;
  items: readonly LegacyDnaQualityScoreItem[];
};

export const LEGACY_DNA_QUALITY_SCORE_VERSION = "v1" as const;
export const LEGACY_DNA_QUALITY_SCORE_ID =
  "legacy-dna-quality-score-gonegi-harbor-25s-v1" as const;
export const LEGACY_DNA_QUALITY_SCORE_STATE =
  "25s-legacy-dna-quality-score-metadata-only" as const;
export const LEGACY_DNA_QUALITY_SCORE_KIND_VERSION = "legacy-dna-quality-score-v1" as const;

const TWENTY_FIVE_SECOND_QUEUE_BY_RECORD_ID = Object.freeze({
  "GONEGI-HARBOR-25S-SEGMENT-001": 0,
  "GONEGI-HARBOR-25S-SEGMENT-002": 1,
  "GONEGI-HARBOR-25S-SEGMENT-003": 2,
} as const);

const PENALTY_VISUAL_ATOMS_EMPTY = 15;
const PENALTY_RELATIONSHIP_GRAPH_EMPTY = 15;
const PENALTY_INFERRED_HEAVY = 20;
const PENALTY_LEGACY_UNBOUND = 10;
const PENALTY_ARCHIVE_METADATA = 5;
const PENALTY_CONTINUITY_UNBOUND = 35;
const PENALTY_CONTINUITY_ARCHIVE = 25;
const BONUS_TWENTY_FIVE_SECOND_BOUND = 15;
const BONUS_LOCK_LINKED = 10;
const BASE_AXIS_SCORE = 100;
const PRODUCTION_READY_THRESHOLD = 72;
const ELITE_THRESHOLD = 85;

const UPGRADE_PRIORITY_SCORE_BY_URGENCY = Object.freeze({
  critical: 95,
  elevated: 72,
  deferred: 58,
} as const);

let cachedLegacyDnaQualityScore: LegacyDnaQualityScore | null = null;

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

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

function roundScore(score: number): number {
  return Number(score.toFixed(2));
}

function resolveQueueBinding(
  gapItem: LegacyDnaUpgradeGapReport["items"][number],
  recordIndex: number
): number | string {
  if (gapItem.detectedGapTypes.includes("twenty-five-second-bound")) {
    const queueOrder =
      TWENTY_FIVE_SECOND_QUEUE_BY_RECORD_ID[
        gapItem.legacyRecordId as keyof typeof TWENTY_FIVE_SECOND_QUEUE_BY_RECORD_ID
      ];
    if (queueOrder === undefined) {
      throw new Error("Legacy dna quality score requires a 25s queue binding definition");
    }
    return queueOrder;
  }
  return `legacy-archive-slot-${String(recordIndex).padStart(2, "0")}`;
}

function isLockLinked(queueBinding: number | string): boolean {
  return typeof queueBinding === "number";
}

function computeCompletenessScore(
  gapItem: LegacyDnaUpgradeGapReport["items"][number]
): number {
  let score = BASE_AXIS_SCORE;
  if (gapItem.detectedGapTypes.includes("empty-visual-atoms")) {
    score -= PENALTY_VISUAL_ATOMS_EMPTY;
  }
  if (gapItem.detectedGapTypes.includes("empty-relationship-graph")) {
    score -= PENALTY_RELATIONSHIP_GRAPH_EMPTY;
  }
  return roundScore(clampScore(score));
}

function computeEvidenceReliabilityScore(
  gapItem: LegacyDnaUpgradeGapReport["items"][number]
): number {
  let score = BASE_AXIS_SCORE;
  if (gapItem.detectedGapTypes.includes("inferred-heavy-provenance")) {
    score -= PENALTY_INFERRED_HEAVY;
  }
  if (gapItem.detectedGapTypes.includes("legacy-unbound-metadata")) {
    score -= PENALTY_LEGACY_UNBOUND;
  }
  if (gapItem.detectedGapTypes.includes("archive-metadata-pending")) {
    score -= PENALTY_ARCHIVE_METADATA;
  }
  return roundScore(clampScore(score));
}

function computeContinuityScore(
  gapItem: LegacyDnaUpgradeGapReport["items"][number],
  queueBinding: number | string
): number {
  let score = BASE_AXIS_SCORE;
  if (gapItem.detectedGapTypes.includes("legacy-unbound-metadata")) {
    score -= PENALTY_CONTINUITY_UNBOUND;
  }
  if (gapItem.detectedGapTypes.includes("archive-metadata-pending")) {
    score -= PENALTY_CONTINUITY_ARCHIVE;
  }
  if (gapItem.detectedGapTypes.includes("twenty-five-second-bound")) {
    score += BONUS_TWENTY_FIVE_SECOND_BOUND;
  }
  if (isLockLinked(queueBinding)) {
    score += BONUS_LOCK_LINKED;
  }
  return roundScore(clampScore(score));
}

function computeUpgradePriorityScore(
  gapItem: LegacyDnaUpgradeGapReport["items"][number]
): number {
  return UPGRADE_PRIORITY_SCORE_BY_URGENCY[gapItem.upgradeUrgency];
}

function computeOverallQualityScore(
  completenessScore: number,
  continuityScore: number,
  evidenceReliabilityScore: number,
  upgradePriorityScore: number
): number {
  return roundScore(
    (completenessScore + continuityScore + evidenceReliabilityScore + upgradePriorityScore) / 4
  );
}

function resolveQualityTier(
  gapItem: LegacyDnaUpgradeGapReport["items"][number],
  overallQualityScore: number
): LegacyDnaQualityTier {
  if (gapItem.detectedGapTypes.includes("archive-metadata-pending")) {
    return "archive-only";
  }
  if (
    gapItem.detectedGapTypes.includes("twenty-five-second-bound") &&
    overallQualityScore >= ELITE_THRESHOLD
  ) {
    return "elite";
  }
  if (overallQualityScore >= PRODUCTION_READY_THRESHOLD) {
    return "production-ready";
  }
  return "upgrade-required";
}

function computeQualityScoreId(recordIndex: number, legacyRecordId: string): string {
  return digestValue(
    [
      LEGACY_DNA_QUALITY_SCORE_KIND_VERSION,
      "legacy-quality-score-item",
      String(recordIndex),
      legacyRecordId,
    ].join("|")
  );
}

function buildLegacyDnaQualityScoreItem(
  gapItem: LegacyDnaUpgradeGapReport["items"][number],
  recordIndex: number
): LegacyDnaQualityScoreItem {
  const queueBinding = resolveQueueBinding(gapItem, recordIndex);
  const completenessScore = computeCompletenessScore(gapItem);
  const continuityScore = computeContinuityScore(gapItem, queueBinding);
  const evidenceReliabilityScore = computeEvidenceReliabilityScore(gapItem);
  const upgradePriorityScore = computeUpgradePriorityScore(gapItem);
  const overallQualityScore = computeOverallQualityScore(
    completenessScore,
    continuityScore,
    evidenceReliabilityScore,
    upgradePriorityScore
  );

  return Object.freeze({
    qualityScoreId: computeQualityScoreId(recordIndex, gapItem.legacyRecordId),
    legacyRecordId: gapItem.legacyRecordId,
    queueBinding,
    completenessScore,
    continuityScore,
    evidenceReliabilityScore,
    upgradePriorityScore,
    overallQualityScore,
    qualityTier: resolveQualityTier(gapItem, overallQualityScore),
  });
}

function buildTierDistribution(
  items: readonly LegacyDnaQualityScoreItem[]
): LegacyDnaQualityTierDistribution {
  return Object.freeze({
    totalLegacyScoreCount: items.length,
    eliteTierCount: items.filter((item) => item.qualityTier === "elite").length,
    productionReadyTierCount: items.filter((item) => item.qualityTier === "production-ready").length,
    upgradeRequiredTierCount: items.filter((item) => item.qualityTier === "upgrade-required").length,
    archiveOnlyTierCount: items.filter((item) => item.qualityTier === "archive-only").length,
  });
}

export function buildLegacyDnaQualityScore(
  legacyDnaUpgradeGapReport: LegacyDnaUpgradeGapReport
): LegacyDnaQualityScore {
  if (cachedLegacyDnaQualityScore !== null) {
    return cachedLegacyDnaQualityScore;
  }

  if (legacyDnaUpgradeGapReport.gapDetection.totalLegacyGapItemCount !== 19) {
    throw new Error("Legacy dna quality score requires nineteen gap report items");
  }

  const items = Object.freeze(
    legacyDnaUpgradeGapReport.items.map((gapItem, recordIndex) =>
      buildLegacyDnaQualityScoreItem(gapItem, recordIndex)
    )
  );

  const score = Object.freeze({
    version: LEGACY_DNA_QUALITY_SCORE_VERSION,
    scoreRootId: LEGACY_DNA_QUALITY_SCORE_ID,
    gapReportId: legacyDnaUpgradeGapReport.reportId,
    legacyDnaUpgradeGapReportFingerprint:
      computeLegacyDnaUpgradeGapReportFingerprint(legacyDnaUpgradeGapReport),
    sourceFingerprint: legacyDnaUpgradeGapReport.sourceFingerprint,
    scoreVersion: LEGACY_DNA_QUALITY_SCORE_KIND_VERSION,
    activeScoreState: LEGACY_DNA_QUALITY_SCORE_STATE,
    tierDistribution: buildTierDistribution(items),
    items,
  });

  cachedLegacyDnaQualityScore = score;
  return score;
}

export const LEGACY_DNA_QUALITY_SCORE_ITEM_KEY_ORDER = Object.freeze([
  "qualityScoreId",
  "legacyRecordId",
  "queueBinding",
  "completenessScore",
  "continuityScore",
  "evidenceReliabilityScore",
  "upgradePriorityScore",
  "overallQualityScore",
  "qualityTier",
] as const);

export const LEGACY_DNA_QUALITY_TIER_DISTRIBUTION_KEY_ORDER = Object.freeze([
  "totalLegacyScoreCount",
  "eliteTierCount",
  "productionReadyTierCount",
  "upgradeRequiredTierCount",
  "archiveOnlyTierCount",
] as const);

export const LEGACY_DNA_QUALITY_SCORE_KEY_ORDER = Object.freeze([
  "version",
  "scoreRootId",
  "gapReportId",
  "legacyDnaUpgradeGapReportFingerprint",
  "sourceFingerprint",
  "scoreVersion",
  "activeScoreState",
  "tierDistribution",
  "items",
] as const);

export function serializeLegacyDnaQualityScore(score: LegacyDnaQualityScore): string {
  const orderedItems = score.items.map((item) =>
    orderRecord(item, LEGACY_DNA_QUALITY_SCORE_ITEM_KEY_ORDER)
  );

  const orderedScore: Record<string, unknown> = {};
  for (const key of LEGACY_DNA_QUALITY_SCORE_KEY_ORDER) {
    if (key === "items") {
      orderedScore.items = orderedItems;
    } else if (key === "tierDistribution") {
      orderedScore.tierDistribution = orderRecord(
        score.tierDistribution,
        LEGACY_DNA_QUALITY_TIER_DISTRIBUTION_KEY_ORDER
      );
    } else {
      orderedScore[key] = score[key as keyof LegacyDnaQualityScore];
    }
  }

  return JSON.stringify(orderedScore);
}

export function computeLegacyDnaQualityScoreFingerprint(score: LegacyDnaQualityScore): string {
  return digestValue(serializeLegacyDnaQualityScore(score));
}

export function resetLegacyDnaQualityScoreCacheForVerification(): void {
  cachedLegacyDnaQualityScore = null;
}
