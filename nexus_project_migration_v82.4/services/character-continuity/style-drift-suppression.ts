/** Phase-10C: style drift suppression — Gonegi visual identity lock (pure, deterministic) */

import crypto from "crypto";
import type { CharacterContinuityLockLevel } from "./character-identity.types.ts";
import type { CharacterMemoryTimeline } from "./character-memory-timeline.ts";
import type { PoseEmotionDriftEvaluation } from "./pose-emotion-drift-evaluator.ts";
import { resolveLockPriority } from "./identity-lock-policy.ts";

export type StyleDriftSuppressionVersion = "v1";

export type StyleRiskLevel = "low" | "medium" | "high";

export type RecommendedLockLevel = CharacterContinuityLockLevel;

export type StyleDriftSuppressionReport = {
  readonly version: StyleDriftSuppressionVersion;
  readonly styleRisk: StyleRiskLevel;
  readonly paletteStability: number;
  readonly glazeConsistency: number;
  readonly lineSoftnessContinuity: number;
  readonly reflectiveLightingPersistence: number;
  readonly recommendedLock: RecommendedLockLevel;
};

export const STYLE_DRIFT_SUPPRESSION_VERSION: StyleDriftSuppressionVersion = "v1";

export const STYLE_RISK_THRESHOLDS = Object.freeze({
  lowMax: 0.35,
  mediumMax: 0.65,
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

function resolvePaletteStability(timeline: CharacterMemoryTimeline): number {
  const resistance = timeline.styleDriftResistance;
  const frameStyle = averageScores(timeline.memoryFrames.map((frame) => frame.styleScore));
  return clampScore(averageScores([resistance.paletteStability, frameStyle, resistance.overallResistance]));
}

function resolveGlazeConsistency(timeline: CharacterMemoryTimeline): number {
  const resistance = timeline.styleDriftResistance;
  return clampScore(
    averageScores([
      resistance.overallResistance,
      resistance.lineWeightStability,
      timeline.identityPersistence.anchorConsistency,
    ])
  );
}

function resolveLineSoftnessContinuity(timeline: CharacterMemoryTimeline): number {
  const resistance = timeline.styleDriftResistance;
  const frameStyle = averageScores(timeline.memoryFrames.map((frame) => frame.styleScore));
  return clampScore(averageScores([resistance.lineWeightStability, frameStyle]));
}

function resolveReflectiveLightingPersistence(timeline: CharacterMemoryTimeline): number {
  const resistance = timeline.styleDriftResistance;
  const identityCarry = timeline.identityPersistence.overallPersistence;
  return clampScore(averageScores([resistance.lightingStability, identityCarry]));
}

function resolveStyleDriftScore(signals: {
  paletteStability: number;
  glazeConsistency: number;
  lineSoftnessContinuity: number;
  reflectiveLightingPersistence: number;
}): number {
  return clampScore(
    1 -
      averageScores([
        signals.paletteStability,
        signals.glazeConsistency,
        signals.lineSoftnessContinuity,
        signals.reflectiveLightingPersistence,
      ])
  );
}

export function resolveStyleRiskFromScore(styleDriftScore: number): StyleRiskLevel {
  const drift = clampScore(styleDriftScore);
  if (drift <= STYLE_RISK_THRESHOLDS.lowMax) {
    return "low";
  }
  if (drift <= STYLE_RISK_THRESHOLDS.mediumMax) {
    return "medium";
  }
  return "high";
}

type LockGapEntry = {
  readonly level: RecommendedLockLevel;
  readonly gap: number;
  readonly rank: number;
};

export function resolveRecommendedLock(
  timeline: CharacterMemoryTimeline,
  driftEvaluation: PoseEmotionDriftEvaluation,
  signals: {
    paletteStability: number;
    glazeConsistency: number;
    lineSoftnessContinuity: number;
    reflectiveLightingPersistence: number;
  }
): RecommendedLockLevel {
  const styleDrift = resolveStyleDriftScore(signals);
  const gaps: readonly LockGapEntry[] = Object.freeze([
    Object.freeze({
      level: "identity",
      gap: clampScore(1 - timeline.identityPersistence.overallPersistence),
      rank: resolveLockPriority("identity"),
    }),
    Object.freeze({
      level: "pose",
      gap: driftEvaluation.poseDriftScore,
      rank: resolveLockPriority("pose"),
    }),
    Object.freeze({
      level: "emotion",
      gap: driftEvaluation.emotionDriftScore,
      rank: resolveLockPriority("emotion"),
    }),
    Object.freeze({
      level: "style",
      gap: styleDrift,
      rank: resolveLockPriority("style"),
    }),
  ]);

  const sorted = [...gaps].sort((left, right) => {
    if (right.gap !== left.gap) {
      return right.gap - left.gap;
    }
    return left.rank - right.rank;
  });

  const recommended = sorted[0]?.level ?? "identity";

  if (recommended === "style" && gaps[0].gap >= gaps[3].gap) {
    return "identity";
  }

  return recommended;
}

export function buildStyleDriftSuppressionReport(
  timeline: CharacterMemoryTimeline,
  driftEvaluation: PoseEmotionDriftEvaluation
): StyleDriftSuppressionReport {
  const paletteStability = resolvePaletteStability(timeline);
  const glazeConsistency = resolveGlazeConsistency(timeline);
  const lineSoftnessContinuity = resolveLineSoftnessContinuity(timeline);
  const reflectiveLightingPersistence = resolveReflectiveLightingPersistence(timeline);

  const signals = {
    paletteStability,
    glazeConsistency,
    lineSoftnessContinuity,
    reflectiveLightingPersistence,
  };

  const styleDriftScore = resolveStyleDriftScore(signals);
  const recommendedLock = resolveRecommendedLock(timeline, driftEvaluation, signals);

  if (
    resolveLockPriority(recommendedLock) > resolveLockPriority("identity") &&
    timeline.identityPersistence.overallPersistence < 0.75
  ) {
    return Object.freeze({
      version: STYLE_DRIFT_SUPPRESSION_VERSION,
      styleRisk: resolveStyleRiskFromScore(styleDriftScore),
      paletteStability,
      glazeConsistency,
      lineSoftnessContinuity,
      reflectiveLightingPersistence,
      recommendedLock: "identity",
    });
  }

  return Object.freeze({
    version: STYLE_DRIFT_SUPPRESSION_VERSION,
    styleRisk: resolveStyleRiskFromScore(styleDriftScore),
    paletteStability,
    glazeConsistency,
    lineSoftnessContinuity,
    reflectiveLightingPersistence,
    recommendedLock,
  });
}

export function serializeStyleDriftSuppressionReport(report: StyleDriftSuppressionReport): string {
  return JSON.stringify({
    version: report.version,
    styleRisk: report.styleRisk,
    paletteStability: report.paletteStability,
    glazeConsistency: report.glazeConsistency,
    lineSoftnessContinuity: report.lineSoftnessContinuity,
    reflectiveLightingPersistence: report.reflectiveLightingPersistence,
    recommendedLock: report.recommendedLock,
  });
}

export function computeStyleDriftSuppressionFingerprint(
  report: StyleDriftSuppressionReport
): string {
  return crypto.createHash("sha256").update(serializeStyleDriftSuppressionReport(report)).digest("hex");
}

export function assertStyleDriftSuppressionScoresInRange(
  report: StyleDriftSuppressionReport
): boolean {
  const scoreValid =
    report.paletteStability >= 0 &&
    report.paletteStability <= 1 &&
    report.glazeConsistency >= 0 &&
    report.glazeConsistency <= 1 &&
    report.lineSoftnessContinuity >= 0 &&
    report.lineSoftnessContinuity <= 1 &&
    report.reflectiveLightingPersistence >= 0 &&
    report.reflectiveLightingPersistence <= 1;

  const riskValid = ["low", "medium", "high"].includes(report.styleRisk);
  const lockValid = ["identity", "style", "pose", "emotion"].includes(report.recommendedLock);

  return scoreValid && riskValid && lockValid;
}

export function assertIdentityPriorityPreserved(report: StyleDriftSuppressionReport): boolean {
  return resolveLockPriority("identity") < resolveLockPriority("style");
}
