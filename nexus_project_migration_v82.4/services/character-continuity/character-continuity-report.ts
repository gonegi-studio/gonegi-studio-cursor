/** Phase-11C: character continuity unified report — generation steering aggregate (pure, deterministic) */

import crypto from "crypto";
import type { CharacterContinuityLockLevel, CharacterIdentityProfile } from "./character-identity.types.ts";
import type { CharacterAnchorReinforcementReport } from "./character-anchor-reinforcement.ts";
import type { CharacterMemoryTimeline } from "./character-memory-timeline.ts";
import type { PoseEmotionDriftEvaluation } from "./pose-emotion-drift-evaluator.ts";
import type { StyleDriftSuppressionReport } from "./style-drift-suppression.ts";
import { resolveLockPriority } from "./identity-lock-policy.ts";

export type CharacterContinuityReportVersion = "v1";

export type ContinuityRiskLevel = "low" | "medium" | "high";

export type SteeringLockLevel = "identity" | "anchor" | "style" | "pose" | "emotion";

export type SteeringLock = {
  readonly lockId: string;
  readonly level: SteeringLockLevel;
  readonly priority: number;
  readonly strength: number;
};

export type IdentitySummary = {
  readonly displayName: string;
  readonly role: CharacterIdentityProfile["role"];
  readonly lockLevel: CharacterContinuityLockLevel;
  readonly lockStrictness: number;
  readonly overallPersistence: number;
};

export type DriftSummary = {
  readonly poseDriftScore: number;
  readonly emotionDriftScore: number;
  readonly continuityRisk: PoseEmotionDriftEvaluation["continuityRisk"];
};

export type StyleSummary = {
  readonly styleRisk: StyleDriftSuppressionReport["styleRisk"];
  readonly paletteStability: number;
  readonly recommendedLock: StyleDriftSuppressionReport["recommendedLock"];
};

export type AnchorSummary = {
  readonly anchorPersistenceScore: number;
  readonly identityReinforcementScore: number;
  readonly anchorRisk: CharacterAnchorReinforcementReport["anchorRisk"];
  readonly reinforcedAnchorCount: number;
};

export type CharacterContinuityReport = {
  readonly version: CharacterContinuityReportVersion;
  readonly characterId: string;
  readonly continuityScore: number;
  readonly riskLevel: ContinuityRiskLevel;
  readonly steeringLocks: readonly SteeringLock[];
  readonly identitySummary: IdentitySummary;
  readonly driftSummary: DriftSummary;
  readonly styleSummary: StyleSummary;
  readonly anchorSummary: AnchorSummary;
};

export type CharacterContinuityReportInput = {
  readonly profile: CharacterIdentityProfile;
  readonly timeline: CharacterMemoryTimeline;
  readonly driftEvaluation: PoseEmotionDriftEvaluation;
  readonly styleReport: StyleDriftSuppressionReport;
  readonly anchorReport: CharacterAnchorReinforcementReport;
};

export const CHARACTER_CONTINUITY_REPORT_VERSION: CharacterContinuityReportVersion = "v1";

export const CONTINUITY_RISK_THRESHOLDS = Object.freeze({
  lowMax: 0.35,
  mediumMax: 0.65,
});

export const STEERING_LOCK_PRIORITY: Readonly<Record<SteeringLockLevel, number>> = Object.freeze({
  identity: 1,
  anchor: 2,
  style: 3,
  pose: 4,
  emotion: 5,
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

function resolveRiskLevelFromScore(riskScore: number): ContinuityRiskLevel {
  const risk = clampScore(riskScore);
  if (risk <= CONTINUITY_RISK_THRESHOLDS.lowMax) {
    return "low";
  }
  if (risk <= CONTINUITY_RISK_THRESHOLDS.mediumMax) {
    return "medium";
  }
  return "high";
}

function riskLevelToScore(level: ContinuityRiskLevel): number {
  if (level === "low") {
    return 0.2;
  }
  if (level === "medium") {
    return 0.5;
  }
  return 0.85;
}

function buildIdentitySummary(
  profile: CharacterIdentityProfile,
  timeline: CharacterMemoryTimeline
): IdentitySummary {
  return Object.freeze({
    displayName: profile.displayName,
    role: profile.role,
    lockLevel: profile.continuityLock.level,
    lockStrictness: profile.continuityLock.strictness,
    overallPersistence: timeline.identityPersistence.overallPersistence,
  });
}

function buildDriftSummary(driftEvaluation: PoseEmotionDriftEvaluation): DriftSummary {
  return Object.freeze({
    poseDriftScore: driftEvaluation.poseDriftScore,
    emotionDriftScore: driftEvaluation.emotionDriftScore,
    continuityRisk: driftEvaluation.continuityRisk,
  });
}

function buildStyleSummary(styleReport: StyleDriftSuppressionReport): StyleSummary {
  return Object.freeze({
    styleRisk: styleReport.styleRisk,
    paletteStability: styleReport.paletteStability,
    recommendedLock: styleReport.recommendedLock,
  });
}

function buildAnchorSummary(anchorReport: CharacterAnchorReinforcementReport): AnchorSummary {
  return Object.freeze({
    anchorPersistenceScore: anchorReport.anchorPersistenceScore,
    identityReinforcementScore: anchorReport.identityReinforcementScore,
    anchorRisk: anchorReport.anchorRisk,
    reinforcedAnchorCount: anchorReport.reinforcedAnchors.length,
  });
}

function buildSteeringLocks(
  profile: CharacterIdentityProfile,
  driftEvaluation: PoseEmotionDriftEvaluation,
  styleReport: StyleDriftSuppressionReport,
  anchorReport: CharacterAnchorReinforcementReport
): readonly SteeringLock[] {
  const locks: SteeringLock[] = [
    Object.freeze({
      lockId: profile.continuityLock.lockId,
      level: "identity" as const,
      priority: STEERING_LOCK_PRIORITY.identity,
      strength: profile.continuityLock.strictness,
    }),
    Object.freeze({
      lockId: `anchor-lock-${profile.characterId}`,
      level: "anchor" as const,
      priority: STEERING_LOCK_PRIORITY.anchor,
      strength: anchorReport.identityReinforcementScore,
    }),
    Object.freeze({
      lockId: `style-lock-${profile.characterId}`,
      level: "style" as const,
      priority: STEERING_LOCK_PRIORITY.style,
      strength: averageScores([
        styleReport.paletteStability,
        styleReport.glazeConsistency,
        styleReport.lineSoftnessContinuity,
        styleReport.reflectiveLightingPersistence,
      ]),
    }),
    Object.freeze({
      lockId: `pose-lock-${profile.characterId}`,
      level: "pose" as const,
      priority: STEERING_LOCK_PRIORITY.pose,
      strength: clampScore(1 - driftEvaluation.poseDriftScore),
    }),
    Object.freeze({
      lockId: `emotion-lock-${profile.characterId}`,
      level: "emotion" as const,
      priority: STEERING_LOCK_PRIORITY.emotion,
      strength: clampScore(1 - driftEvaluation.emotionDriftScore),
    }),
  ];

  return Object.freeze(
    [...locks].sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return left.lockId.localeCompare(right.lockId);
    })
  );
}

function resolveContinuityScore(
  timeline: CharacterMemoryTimeline,
  driftEvaluation: PoseEmotionDriftEvaluation,
  styleReport: StyleDriftSuppressionReport,
  anchorReport: CharacterAnchorReinforcementReport
): number {
  return averageScores([
    timeline.identityPersistence.overallPersistence,
    anchorReport.anchorPersistenceScore,
    anchorReport.identityReinforcementScore,
    clampScore(1 - driftEvaluation.poseDriftScore),
    clampScore(1 - driftEvaluation.emotionDriftScore),
    styleReport.paletteStability,
    styleReport.glazeConsistency,
    timeline.emotionalCarryover.persistenceScore,
  ]);
}

function resolveAggregateRiskScore(
  driftEvaluation: PoseEmotionDriftEvaluation,
  styleReport: StyleDriftSuppressionReport,
  anchorReport: CharacterAnchorReinforcementReport
): number {
  return averageScores([
    driftEvaluation.poseDriftScore,
    driftEvaluation.emotionDriftScore,
    riskLevelToScore(driftEvaluation.continuityRisk),
    riskLevelToScore(styleReport.styleRisk),
    riskLevelToScore(anchorReport.anchorRisk),
  ]);
}

export function buildCharacterContinuityReport(
  input: CharacterContinuityReportInput
): CharacterContinuityReport {
  const { profile, timeline, driftEvaluation, styleReport, anchorReport } = input;

  const continuityScore = resolveContinuityScore(
    timeline,
    driftEvaluation,
    styleReport,
    anchorReport
  );
  const riskLevel = resolveRiskLevelFromScore(
    resolveAggregateRiskScore(driftEvaluation, styleReport, anchorReport)
  );

  return Object.freeze({
    version: CHARACTER_CONTINUITY_REPORT_VERSION,
    characterId: profile.characterId,
    continuityScore,
    riskLevel,
    steeringLocks: buildSteeringLocks(profile, driftEvaluation, styleReport, anchorReport),
    identitySummary: buildIdentitySummary(profile, timeline),
    driftSummary: buildDriftSummary(driftEvaluation),
    styleSummary: buildStyleSummary(styleReport),
    anchorSummary: buildAnchorSummary(anchorReport),
  });
}

export function serializeCharacterContinuityReport(report: CharacterContinuityReport): string {
  return JSON.stringify({
    version: report.version,
    characterId: report.characterId,
    continuityScore: report.continuityScore,
    riskLevel: report.riskLevel,
    steeringLocks: report.steeringLocks,
    identitySummary: report.identitySummary,
    driftSummary: report.driftSummary,
    styleSummary: report.styleSummary,
    anchorSummary: report.anchorSummary,
  });
}

export function computeCharacterContinuityReportFingerprint(report: CharacterContinuityReport): string {
  return crypto.createHash("sha256").update(serializeCharacterContinuityReport(report)).digest("hex");
}

export function assertCharacterContinuityReportScoresInRange(
  report: CharacterContinuityReport
): boolean {
  const lockValid = report.steeringLocks.every(
    (lock) => lock.strength >= 0 && lock.strength <= 1 && lock.priority >= 1
  );

  return (
    lockValid &&
    report.continuityScore >= 0 &&
    report.continuityScore <= 1 &&
    report.identitySummary.lockStrictness >= 0 &&
    report.identitySummary.lockStrictness <= 1 &&
    report.identitySummary.overallPersistence >= 0 &&
    report.identitySummary.overallPersistence <= 1 &&
    ["low", "medium", "high"].includes(report.riskLevel)
  );
}

export function assertContinuityIdentityPriorityPreserved(
  report: CharacterContinuityReport
): boolean {
  if (report.steeringLocks.length === 0) {
    return resolveLockPriority("identity") < resolveLockPriority("style");
  }

  const identityLock = report.steeringLocks.find((lock) => lock.level === "identity");
  const styleLock = report.steeringLocks.find((lock) => lock.level === "style");

  if (!identityLock || !styleLock) {
    return STEERING_LOCK_PRIORITY.identity < STEERING_LOCK_PRIORITY.style;
  }

  return identityLock.priority < styleLock.priority && identityLock.strength >= styleLock.strength * 0.9;
}

export function resolveRiskLevelFromReport(report: CharacterContinuityReport): ContinuityRiskLevel {
  return resolveRiskLevelFromScore(
    averageScores([
      report.driftSummary.poseDriftScore,
      report.driftSummary.emotionDriftScore,
      riskLevelToScore(report.driftSummary.continuityRisk),
      riskLevelToScore(report.styleSummary.styleRisk),
      riskLevelToScore(report.anchorSummary.anchorRisk),
    ])
  );
}

export const STEERING_LOCK_ORDER_EXPECTED: readonly SteeringLockLevel[] = Object.freeze([
  "identity",
  "anchor",
  "style",
  "pose",
  "emotion",
]);
