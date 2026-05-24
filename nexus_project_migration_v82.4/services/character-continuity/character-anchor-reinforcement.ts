/** Phase-11A: character anchor reinforcement — sequence-level identity lock (pure, deterministic) */

import crypto from "crypto";
import type {
  CharacterAnchorKind,
  CharacterIdentityProfile,
  CharacterVisualAnchor,
} from "./character-identity.types.ts";
import type { CharacterMemoryTimeline } from "./character-memory-timeline.ts";
import type { StyleDriftSuppressionReport } from "./style-drift-suppression.ts";
import { resolveLockPriority } from "./identity-lock-policy.ts";

export type CharacterAnchorReinforcementVersion = "v1";

export type AnchorRiskLevel = "low" | "medium" | "high";

export type ReinforcedAnchor = {
  readonly anchorId: string;
  readonly kind: CharacterAnchorKind;
  readonly label: string;
  readonly priority: number;
  readonly reinforcementScore: number;
  readonly persistenceWeight: number;
};

export type CharacterAnchorReinforcementReport = {
  readonly version: CharacterAnchorReinforcementVersion;
  readonly characterId: string;
  readonly reinforcedAnchors: readonly ReinforcedAnchor[];
  readonly anchorPersistenceScore: number;
  readonly identityReinforcementScore: number;
  readonly anchorRisk: AnchorRiskLevel;
};

export const CHARACTER_ANCHOR_REINFORCEMENT_VERSION: CharacterAnchorReinforcementVersion = "v1";

export const ANCHOR_RISK_THRESHOLDS = Object.freeze({
  lowMax: 0.35,
  mediumMax: 0.65,
});

const IDENTITY_ANCHOR_KINDS: readonly CharacterAnchorKind[] = Object.freeze([
  "face-signature",
  "silhouette",
]);

const KIND_PERSISTENCE_WEIGHT: Readonly<Record<CharacterAnchorKind, number>> = Object.freeze({
  "face-signature": 1,
  "silhouette": 0.95,
  "hair-signature": 0.85,
  "outfit-signature": 0.75,
  "gaze-pattern": 0.7,
});

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function averageScores(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function isIdentityAnchorKind(kind: CharacterAnchorKind): boolean {
  return IDENTITY_ANCHOR_KINDS.includes(kind);
}

function sortAnchorsForReinforcement(
  anchors: readonly CharacterVisualAnchor[]
): readonly CharacterVisualAnchor[] {
  return Object.freeze(
    [...anchors].sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return left.anchorId.localeCompare(right.anchorId);
    })
  );
}

function resolveFrameAnchorConsistency(
  timeline: CharacterMemoryTimeline,
  anchorId: string
): number {
  const presence = timeline.memoryFrames.filter((frame) => frame.anchorIds.includes(anchorId)).length;
  if (timeline.memoryFrames.length === 0) {
    return 0;
  }
  return clampScore(presence / timeline.memoryFrames.length);
}

function resolveStyleSupport(styleReport: StyleDriftSuppressionReport): number {
  return averageScores([
    styleReport.paletteStability,
    styleReport.glazeConsistency,
    styleReport.lineSoftnessContinuity,
    styleReport.reflectiveLightingPersistence,
  ]);
}

function resolveAnchorReinforcementScore(
  anchor: CharacterVisualAnchor,
  profile: CharacterIdentityProfile,
  timeline: CharacterMemoryTimeline,
  styleReport: StyleDriftSuppressionReport
): number {
  const kindWeight = KIND_PERSISTENCE_WEIGHT[anchor.kind];
  const frameConsistency = resolveFrameAnchorConsistency(timeline, anchor.anchorId);
  const identityPersistence = timeline.identityPersistence.overallPersistence;
  const lockStrictness = profile.continuityLock.strictness;
  const styleSupport = resolveStyleSupport(styleReport);

  if (isIdentityAnchorKind(anchor.kind)) {
    return averageScores([
      kindWeight,
      lockStrictness,
      identityPersistence,
      frameConsistency,
      timeline.identityPersistence.anchorConsistency,
    ]);
  }

  return averageScores([
    kindWeight * 0.9,
    lockStrictness * 0.85,
    frameConsistency,
    styleSupport,
    timeline.emotionalCarryover.persistenceScore * 0.5,
  ]);
}

function resolvePersistenceWeight(anchor: CharacterVisualAnchor): number {
  const identityBoost = isIdentityAnchorKind(anchor.kind) ? 0.1 : 0;
  return clampScore(KIND_PERSISTENCE_WEIGHT[anchor.kind] + identityBoost);
}

function buildReinforcedAnchor(
  anchor: CharacterVisualAnchor,
  profile: CharacterIdentityProfile,
  timeline: CharacterMemoryTimeline,
  styleReport: StyleDriftSuppressionReport
): ReinforcedAnchor {
  return Object.freeze({
    anchorId: anchor.anchorId,
    kind: anchor.kind,
    label: anchor.label,
    priority: anchor.priority,
    reinforcementScore: resolveAnchorReinforcementScore(anchor, profile, timeline, styleReport),
    persistenceWeight: resolvePersistenceWeight(anchor),
  });
}

function resolveAnchorPersistenceScore(anchors: readonly ReinforcedAnchor[]): number {
  if (anchors.length === 0) {
    return 0;
  }

  let weightedSum = 0;
  let weightTotal = 0;

  anchors.forEach((anchor) => {
    weightedSum += anchor.reinforcementScore * anchor.persistenceWeight;
    weightTotal += anchor.persistenceWeight;
  });

  return clampScore(weightTotal === 0 ? 0 : weightedSum / weightTotal);
}

function resolveIdentityReinforcementScore(
  profile: CharacterIdentityProfile,
  timeline: CharacterMemoryTimeline,
  styleReport: StyleDriftSuppressionReport,
  anchorPersistenceScore: number
): number {
  return averageScores([
    anchorPersistenceScore,
    timeline.identityPersistence.overallPersistence,
    profile.continuityLock.strictness,
    resolveStyleSupport(styleReport),
    timeline.emotionalCarryover.carryoverStrength,
  ]);
}

function resolveAnchorRiskScore(
  anchorPersistenceScore: number,
  identityReinforcementScore: number,
  styleReport: StyleDriftSuppressionReport
): number {
  const stability = averageScores([anchorPersistenceScore, identityReinforcementScore]);
  const styleDrift = clampScore(
    1 -
      averageScores([
        styleReport.paletteStability,
        styleReport.glazeConsistency,
        styleReport.lineSoftnessContinuity,
        styleReport.reflectiveLightingPersistence,
      ])
  );
  return clampScore(1 - averageScores([stability, 1 - styleDrift]));
}

export function resolveAnchorRiskFromScore(riskScore: number): AnchorRiskLevel {
  const risk = clampScore(riskScore);
  if (risk <= ANCHOR_RISK_THRESHOLDS.lowMax) {
    return "low";
  }
  if (risk <= ANCHOR_RISK_THRESHOLDS.mediumMax) {
    return "medium";
  }
  return "high";
}

export function buildCharacterAnchorReinforcementReport(
  profile: CharacterIdentityProfile,
  timeline: CharacterMemoryTimeline,
  styleReport: StyleDriftSuppressionReport
): CharacterAnchorReinforcementReport {
  const orderedAnchors = sortAnchorsForReinforcement(profile.visualAnchors);
  const reinforcedAnchors = Object.freeze(
    orderedAnchors.map((anchor) =>
      buildReinforcedAnchor(anchor, profile, timeline, styleReport)
    )
  );

  const anchorPersistenceScore = resolveAnchorPersistenceScore(reinforcedAnchors);
  const identityReinforcementScore = resolveIdentityReinforcementScore(
    profile,
    timeline,
    styleReport,
    anchorPersistenceScore
  );
  const anchorRisk = resolveAnchorRiskFromScore(
    resolveAnchorRiskScore(anchorPersistenceScore, identityReinforcementScore, styleReport)
  );

  return Object.freeze({
    version: CHARACTER_ANCHOR_REINFORCEMENT_VERSION,
    characterId: profile.characterId,
    reinforcedAnchors,
    anchorPersistenceScore,
    identityReinforcementScore,
    anchorRisk,
  });
}

export function serializeCharacterAnchorReinforcementReport(
  report: CharacterAnchorReinforcementReport
): string {
  return JSON.stringify({
    version: report.version,
    characterId: report.characterId,
    reinforcedAnchors: report.reinforcedAnchors,
    anchorPersistenceScore: report.anchorPersistenceScore,
    identityReinforcementScore: report.identityReinforcementScore,
    anchorRisk: report.anchorRisk,
  });
}

export function computeCharacterAnchorReinforcementFingerprint(
  report: CharacterAnchorReinforcementReport
): string {
  return crypto
    .createHash("sha256")
    .update(serializeCharacterAnchorReinforcementReport(report))
    .digest("hex");
}

export function assertCharacterAnchorReinforcementScoresInRange(
  report: CharacterAnchorReinforcementReport
): boolean {
  const anchorValid = report.reinforcedAnchors.every(
    (anchor) =>
      anchor.reinforcementScore >= 0 &&
      anchor.reinforcementScore <= 1 &&
      anchor.persistenceWeight >= 0 &&
      anchor.persistenceWeight <= 1
  );

  const aggregateValid =
    report.anchorPersistenceScore >= 0 &&
    report.anchorPersistenceScore <= 1 &&
    report.identityReinforcementScore >= 0 &&
    report.identityReinforcementScore <= 1;

  const riskValid = ["low", "medium", "high"].includes(report.anchorRisk);

  return anchorValid && aggregateValid && riskValid;
}

export function assertIdentityAnchorPriorityPreserved(
  report: CharacterAnchorReinforcementReport
): boolean {
  if (report.reinforcedAnchors.length === 0) {
    return true;
  }

  const identityAnchors = report.reinforcedAnchors.filter((anchor) =>
    isIdentityAnchorKind(anchor.kind)
  );
  const styleAnchors = report.reinforcedAnchors.filter(
    (anchor) => !isIdentityAnchorKind(anchor.kind)
  );

  if (identityAnchors.length === 0 || styleAnchors.length === 0) {
    return resolveLockPriority("identity") < resolveLockPriority("style");
  }

  const identityAvg = averageScores(identityAnchors.map((anchor) => anchor.reinforcementScore));
  const styleAvg = averageScores(styleAnchors.map((anchor) => anchor.reinforcementScore));

  return identityAvg >= styleAvg && resolveLockPriority("identity") < resolveLockPriority("style");
}
