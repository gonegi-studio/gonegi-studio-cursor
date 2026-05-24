/** Phase-22A: automated visual signal aggregator — multi-intake long-session drift tracking (pure, deterministic) */

import crypto from "crypto";
import type { RealImageEvaluationIntake } from "./real-image-evaluation-intake.ts";
import { REAL_IMAGE_STYLE_STABILITY_THRESHOLD } from "./real-image-evaluation-intake.ts";

export type AutomatedVisualSignalAggregationVersion = "v1";

export type VisualDriftRiskLevel = "low" | "medium" | "high";

export type CumulativeVisualSignals = {
  readonly averageIdentityScore: number;
  readonly averageAnchorScore: number;
  readonly averagePaletteScore: number;
  readonly averageGlazeScore: number;
  readonly averageLineWeightScore: number;
  readonly averagePoseScore: number;
  readonly averageEmotionScore: number;
  readonly cumulativeCharacterScore: number;
  readonly cumulativeStyleScore: number;
  readonly cumulativeEmotionScore: number;
};

export type VisualDriftTracking = {
  readonly identityDriftDelta: number;
  readonly styleDriftDelta: number;
  readonly emotionDriftDelta: number;
  readonly maxIntakeDriftSpread: number;
  readonly unstableIntakeCount: number;
  readonly breakCountTotal: number;
};

export type VisualStabilitySummary = {
  readonly fullyStableIntakeCount: number;
  readonly partiallyStableIntakeCount: number;
  readonly sessionStabilityScore: number;
  readonly identityStableRate: number;
  readonly styleStableRate: number;
};

export type ContinuityAlert = {
  readonly alertId: string;
  readonly alertKind: string;
  readonly intakeId: string;
  readonly message: string;
};

export type AutomatedVisualSignalAggregatorInput = {
  readonly intakes: readonly RealImageEvaluationIntake[];
  readonly aggregationIndex?: number;
};

export type AutomatedVisualSignalAggregation = {
  readonly version: AutomatedVisualSignalAggregationVersion;
  readonly aggregationId: string;
  readonly intakeCount: number;
  readonly cumulativeSignals: CumulativeVisualSignals;
  readonly driftTracking: VisualDriftTracking;
  readonly stabilitySummary: VisualStabilitySummary;
  readonly continuityAlerts: readonly ContinuityAlert[];
};

export const AUTOMATED_VISUAL_SIGNAL_AGGREGATION_VERSION: AutomatedVisualSignalAggregationVersion = "v1";

export const CUMULATIVE_VISUAL_SCORE_WEIGHTS = Object.freeze({
  character: 0.5,
  style: 0.3,
  emotion: 0.2,
});

export const VISUAL_DRIFT_RISK_THRESHOLDS = Object.freeze({
  lowMax: 0.15,
  mediumMax: 0.35,
});

export const VISUAL_STABILITY_ALERT_THRESHOLD = 0.8;

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

function sortUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

function buildAggregationId(aggregationIndex: number): string {
  return `visual-aggregation-${String(aggregationIndex + 1).padStart(3, "0")}`;
}

function buildAlertId(index: number): string {
  return `continuity-alert-${String(index + 1).padStart(3, "0")}`;
}

function sortIntakes(intakes: readonly RealImageEvaluationIntake[]): readonly RealImageEvaluationIntake[] {
  return Object.freeze(
    [...intakes].sort((left, right) => {
      const intakeDelta = left.intakeId.localeCompare(right.intakeId);
      if (intakeDelta !== 0) {
        return intakeDelta;
      }
      return left.sourceRequestId.localeCompare(right.sourceRequestId);
    })
  );
}

function resolveCharacterScore(intake: RealImageEvaluationIntake): number {
  const signals = intake.normalizedSignals;
  return clampScore(
    signals.identityMatchScore * 0.5 + signals.anchorMatchScore * 0.3 + signals.poseMatchScore * 0.2
  );
}

function resolveStyleScore(intake: RealImageEvaluationIntake): number {
  const signals = intake.normalizedSignals;
  return averageScores([
    signals.paletteMatchScore,
    signals.glazeMatchScore,
    signals.lineWeightMatchScore,
  ]);
}

function resolveEmotionScore(intake: RealImageEvaluationIntake): number {
  return clampScore(intake.normalizedSignals.emotionMatchScore);
}

function isFullyStableIntake(intake: RealImageEvaluationIntake): boolean {
  const flags = intake.continuityFlags;
  return (
    flags.identityStable &&
    flags.anchorStable &&
    flags.styleStable &&
    flags.poseStable &&
    flags.emotionStable &&
    !flags.hasContinuityBreaks
  );
}

function isPartiallyStableIntake(intake: RealImageEvaluationIntake): boolean {
  const flags = intake.continuityFlags;
  const stableCount = [
    flags.identityStable,
    flags.anchorStable,
    flags.styleStable,
    flags.poseStable,
    flags.emotionStable,
  ].filter(Boolean).length;

  return !isFullyStableIntake(intake) && stableCount >= 3;
}

function buildCumulativeSignals(intakes: readonly RealImageEvaluationIntake[]): CumulativeVisualSignals {
  const sortedIntakes = sortIntakes(intakes);
  const signals = sortedIntakes.map((intake) => intake.normalizedSignals);

  const cumulativeCharacterScore = averageScores(sortedIntakes.map(resolveCharacterScore));
  const cumulativeStyleScore = averageScores(sortedIntakes.map(resolveStyleScore));
  const cumulativeEmotionScore = averageScores(sortedIntakes.map(resolveEmotionScore));

  return Object.freeze({
    averageIdentityScore: averageScores(signals.map((entry) => entry.identityMatchScore)),
    averageAnchorScore: averageScores(signals.map((entry) => entry.anchorMatchScore)),
    averagePaletteScore: averageScores(signals.map((entry) => entry.paletteMatchScore)),
    averageGlazeScore: averageScores(signals.map((entry) => entry.glazeMatchScore)),
    averageLineWeightScore: averageScores(signals.map((entry) => entry.lineWeightMatchScore)),
    averagePoseScore: averageScores(signals.map((entry) => entry.poseMatchScore)),
    averageEmotionScore: averageScores(signals.map((entry) => entry.emotionMatchScore)),
    cumulativeCharacterScore,
    cumulativeStyleScore,
    cumulativeEmotionScore,
  });
}

function buildDriftTracking(intakes: readonly RealImageEvaluationIntake[]): VisualDriftTracking {
  const sortedIntakes = sortIntakes(intakes);
  const identityScores = sortedIntakes.map((intake) => intake.normalizedSignals.identityMatchScore);
  const styleScores = sortedIntakes.map(resolveStyleScore);
  const emotionScores = sortedIntakes.map(resolveEmotionScore);

  const identityDriftDelta =
    identityScores.length === 0 ? 0 : clampScore(Math.max(...identityScores) - Math.min(...identityScores));
  const styleDriftDelta =
    styleScores.length === 0 ? 0 : clampScore(Math.max(...styleScores) - Math.min(...styleScores));
  const emotionDriftDelta =
    emotionScores.length === 0 ? 0 : clampScore(Math.max(...emotionScores) - Math.min(...emotionScores));

  const unstableIntakeCount = sortedIntakes.filter((intake) => !isFullyStableIntake(intake)).length;

  return Object.freeze({
    identityDriftDelta,
    styleDriftDelta,
    emotionDriftDelta,
    maxIntakeDriftSpread: clampScore(Math.max(identityDriftDelta, styleDriftDelta, emotionDriftDelta)),
    unstableIntakeCount,
    breakCountTotal: sortedIntakes.reduce((sum, intake) => sum + intake.continuityFlags.breakCount, 0),
  });
}

function buildStabilitySummary(intakes: readonly RealImageEvaluationIntake[]): VisualStabilitySummary {
  const sortedIntakes = sortIntakes(intakes);
  const fullyStableIntakeCount = sortedIntakes.filter(isFullyStableIntake).length;
  const partiallyStableIntakeCount = sortedIntakes.filter(isPartiallyStableIntake).length;
  const identityStableCount = sortedIntakes.filter((intake) => intake.continuityFlags.identityStable).length;
  const styleStableCount = sortedIntakes.filter((intake) => intake.continuityFlags.styleStable).length;

  return Object.freeze({
    fullyStableIntakeCount,
    partiallyStableIntakeCount,
    sessionStabilityScore: clampScore(
      sortedIntakes.length === 0 ? 0 : fullyStableIntakeCount / sortedIntakes.length
    ),
    identityStableRate: clampScore(
      sortedIntakes.length === 0 ? 0 : identityStableCount / sortedIntakes.length
    ),
    styleStableRate: clampScore(sortedIntakes.length === 0 ? 0 : styleStableCount / sortedIntakes.length),
  });
}

function buildContinuityAlerts(intakes: readonly RealImageEvaluationIntake[]): readonly ContinuityAlert[] {
  const sortedIntakes = sortIntakes(intakes);
  const alerts: ContinuityAlert[] = [];

  for (const intake of sortedIntakes) {
    const flags = intake.continuityFlags;
    const styleScore = resolveStyleScore(intake);

    if (!flags.identityStable) {
      alerts.push(
        Object.freeze({
          alertId: buildAlertId(alerts.length),
          alertKind: "identity-drift",
          intakeId: intake.intakeId,
          message: `identity stability below threshold for intake:${intake.intakeId}`,
        })
      );
    }
    if (!flags.styleStable || styleScore < VISUAL_STABILITY_ALERT_THRESHOLD) {
      alerts.push(
        Object.freeze({
          alertId: buildAlertId(alerts.length),
          alertKind: "style-drift",
          intakeId: intake.intakeId,
          message: `style stability below threshold for intake:${intake.intakeId}`,
        })
      );
      alerts.push(
        Object.freeze({
          alertId: buildAlertId(alerts.length),
          alertKind: "style-drift",
          intakeId: intake.intakeId,
          message: `style stability below threshold for intake:${intake.intakeId}`,
        })
      );
    }
    if (flags.hasContinuityBreaks) {
      alerts.push(
        Object.freeze({
          alertId: buildAlertId(alerts.length),
          alertKind: "continuity-break",
          intakeId: intake.intakeId,
          message: `continuity breaks detected for intake:${intake.intakeId}`,
        })
      );
    }
    if (styleScore < REAL_IMAGE_STYLE_STABILITY_THRESHOLD) {
      alerts.push(
        Object.freeze({
          alertId: buildAlertId(alerts.length),
          alertKind: "long-session-style-drift",
          intakeId: intake.intakeId,
          message: `long-session style drift detected for intake:${intake.intakeId}`,
        })
      );
    }
  }

  const dedupedMessages = new Map<string, ContinuityAlert>();
  for (const alert of alerts) {
    if (!dedupedMessages.has(alert.message)) {
      dedupedMessages.set(alert.message, alert);
    }
  }

  return Object.freeze(
    [...dedupedMessages.values()]
      .sort((left, right) => left.message.localeCompare(right.message))
      .map((alert, index) =>
        Object.freeze({
          ...alert,
          alertId: buildAlertId(index),
        })
      )
  );
}

export function buildAutomatedVisualSignalAggregation(
  input: AutomatedVisualSignalAggregatorInput
): AutomatedVisualSignalAggregation {
  if (input.intakes.length === 0) {
    throw new Error("automated visual signal aggregator requires at least one intake");
  }

  const aggregationIndex = input.aggregationIndex ?? 0;
  const aggregationId = buildAggregationId(aggregationIndex);
  const sortedIntakes = sortIntakes(input.intakes);

  return Object.freeze({
    version: AUTOMATED_VISUAL_SIGNAL_AGGREGATION_VERSION,
    aggregationId,
    intakeCount: sortedIntakes.length,
    cumulativeSignals: buildCumulativeSignals(input.intakes),
    driftTracking: buildDriftTracking(input.intakes),
    stabilitySummary: buildStabilitySummary(input.intakes),
    continuityAlerts: buildContinuityAlerts(input.intakes),
  });
}

export function serializeAutomatedVisualSignalAggregation(
  aggregation: AutomatedVisualSignalAggregation
): string {
  return JSON.stringify({
    version: aggregation.version,
    aggregationId: aggregation.aggregationId,
    intakeCount: aggregation.intakeCount,
    cumulativeSignals: aggregation.cumulativeSignals,
    driftTracking: aggregation.driftTracking,
    stabilitySummary: aggregation.stabilitySummary,
    continuityAlerts: aggregation.continuityAlerts,
  });
}

export function computeAutomatedVisualSignalAggregationFingerprint(
  aggregation: AutomatedVisualSignalAggregation
): string {
  return crypto.createHash("sha256").update(serializeAutomatedVisualSignalAggregation(aggregation)).digest("hex");
}

export function assertAutomatedVisualSignalAggregatorScoresClamped(
  aggregation: AutomatedVisualSignalAggregation
): boolean {
  const cumulative = aggregation.cumulativeSignals;
  const cumulativeScores = [
    cumulative.averageIdentityScore,
    cumulative.averageAnchorScore,
    cumulative.averagePaletteScore,
    cumulative.averageGlazeScore,
    cumulative.averageLineWeightScore,
    cumulative.averagePoseScore,
    cumulative.averageEmotionScore,
    cumulative.cumulativeCharacterScore,
    cumulative.cumulativeStyleScore,
    cumulative.cumulativeEmotionScore,
  ];

  const drift = aggregation.driftTracking;
  const driftScores = [
    drift.identityDriftDelta,
    drift.styleDriftDelta,
    drift.emotionDriftDelta,
    drift.maxIntakeDriftSpread,
  ];

  const stability = aggregation.stabilitySummary;

  return (
    cumulativeScores.every((score) => score >= 0 && score <= 1) &&
    driftScores.every((score) => score >= 0 && score <= 1) &&
    stability.sessionStabilityScore >= 0 &&
    stability.sessionStabilityScore <= 1 &&
    stability.identityStableRate >= 0 &&
    stability.identityStableRate <= 1 &&
    stability.styleStableRate >= 0 &&
    stability.styleStableRate <= 1
  );
}

export function assertAutomatedVisualSignalAggregatorDuplicateAlertsRemoved(
  aggregation: AutomatedVisualSignalAggregation
): boolean {
  const messages = aggregation.continuityAlerts.map((alert) => alert.message);
  const sortedMessages = [...messages].sort((left, right) => left.localeCompare(right));

  return (
    new Set(messages).size === messages.length &&
    messages.join("|") === sortedMessages.join("|")
  );
}

export function assertAutomatedVisualSignalAggregatorDeterministic(
  aggregation: AutomatedVisualSignalAggregation
): boolean {
  const alertIds = aggregation.continuityAlerts.map((alert) => alert.alertId);
  const sortedAlertIds = [...alertIds].sort((left, right) => left.localeCompare(right));

  return (
    aggregation.intakeCount > 0 &&
    alertIds.join("|") === sortedAlertIds.join("|") &&
    assertAutomatedVisualSignalAggregatorScoresClamped(aggregation) &&
    assertAutomatedVisualSignalAggregatorDuplicateAlertsRemoved(aggregation)
  );
}

export function assertAutomatedVisualSignalAggregatorIntakeOrdering(
  intakes: readonly RealImageEvaluationIntake[]
): boolean {
  const intakeIds = sortIntakes(intakes).map((intake) => intake.intakeId);
  const sortedIds = [...intakeIds].sort((left, right) => left.localeCompare(right));

  return intakeIds.join("|") === sortedIds.join("|");
}
