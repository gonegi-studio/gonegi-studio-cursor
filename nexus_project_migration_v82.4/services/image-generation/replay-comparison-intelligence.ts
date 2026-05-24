/** Phase-20A: replay comparison intelligence — divergence detection and continuity regression (pure, deterministic) */

import crypto from "crypto";
import type {
  AutomatedReplayOrchestratorPlan,
  ReplayComparison,
} from "./automated-replay-orchestrator.ts";

export type ReplayComparisonIntelligenceVersion = "v1";

export type DivergenceSeverity = "none" | "low" | "medium" | "high";

export type ComparisonIntelligenceEntry = {
  readonly intelligenceId: string;
  readonly comparisonId: string;
  readonly leftReplayId: string;
  readonly rightReplayId: string;
  readonly divergenceScore: number;
  readonly continuityRegressionScore: number;
  readonly divergenceSeverity: DivergenceSeverity;
  readonly regressionDetected: boolean;
  readonly signalTags: readonly string[];
};

export type DivergenceSignalSummary = {
  readonly totalComparisons: number;
  readonly divergenceDetectedCount: number;
  readonly regressionDetectedCount: number;
  readonly averageDivergenceScore: number;
  readonly maxDivergenceScore: number;
  readonly continuityRegressionRate: number;
};

export type ContinuityRegressionSummary = {
  readonly orchestratorId: string;
  readonly queueStabilityScore: number;
  readonly averageCharacterDelta: number;
  readonly averageStyleDelta: number;
  readonly averageEmotionDelta: number;
  readonly integrityMismatchCount: number;
  readonly driftRiskMismatchCount: number;
};

export type ReplayComparisonIntelligenceInput = {
  readonly orchestratorPlan: AutomatedReplayOrchestratorPlan;
  readonly reportIndex?: number;
};

export type ReplayComparisonIntelligenceReport = {
  readonly version: ReplayComparisonIntelligenceVersion;
  readonly reportId: string;
  readonly orchestratorId: string;
  readonly comparisonEntries: readonly ComparisonIntelligenceEntry[];
  readonly divergenceSignalSummary: DivergenceSignalSummary;
  readonly continuityRegressionSummary: ContinuityRegressionSummary;
};

export const REPLAY_COMPARISON_INTELLIGENCE_VERSION: ReplayComparisonIntelligenceVersion = "v1";

export const DIVERGENCE_SCORE_WEIGHTS = Object.freeze({
  character: 0.4,
  style: 0.3,
  emotion: 0.3,
});

export const REGRESSION_SCORE_WEIGHTS = Object.freeze({
  character: 0.45,
  style: 0.3,
  emotion: 0.25,
});

export const DIVERGENCE_SEVERITY_THRESHOLDS = Object.freeze({
  lowMax: 0.15,
  mediumMax: 0.4,
});

export const CONTINUITY_REGRESSION_THRESHOLD = 0.1;

export const DIVERGENCE_DETECTION_THRESHOLD = 0.05;

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

function buildReportId(reportIndex: number): string {
  return `replay-comparison-intelligence-${String(reportIndex + 1).padStart(3, "0")}`;
}

function buildIntelligenceId(index: number): string {
  return `comparison-intelligence-${String(index + 1).padStart(3, "0")}`;
}

function resolveReportIndex(
  orchestratorPlan: AutomatedReplayOrchestratorPlan,
  reportIndex: number | undefined
): number {
  if (reportIndex !== undefined) {
    return reportIndex;
  }

  const match = orchestratorPlan.orchestratorId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

export function resolveDivergenceSeverity(divergenceScore: number): DivergenceSeverity {
  const score = clampScore(divergenceScore);
  if (score <= 0) {
    return "none";
  }
  if (score <= DIVERGENCE_SEVERITY_THRESHOLDS.lowMax) {
    return "low";
  }
  if (score <= DIVERGENCE_SEVERITY_THRESHOLDS.mediumMax) {
    return "medium";
  }
  return "high";
}

function computeDivergenceScore(comparison: ReplayComparison): number {
  const deltaMagnitude = clampScore(
    DIVERGENCE_SCORE_WEIGHTS.character * Math.abs(comparison.characterScoreDelta) +
      DIVERGENCE_SCORE_WEIGHTS.style * Math.abs(comparison.styleScoreDelta) +
      DIVERGENCE_SCORE_WEIGHTS.emotion * Math.abs(comparison.emotionScoreDelta)
  );

  let score = deltaMagnitude;
  if (!comparison.driftRiskMatch) {
    score = clampScore(score + 0.15);
  }
  if (!comparison.integrityMatch) {
    score = clampScore(score + 0.2);
  }

  return score;
}

function computeContinuityRegressionScore(comparison: ReplayComparison): number {
  const characterRegression =
    comparison.characterScoreDelta < 0 ? Math.abs(comparison.characterScoreDelta) : 0;
  const styleRegression = comparison.styleScoreDelta < 0 ? Math.abs(comparison.styleScoreDelta) : 0;
  const emotionRegression =
    comparison.emotionScoreDelta < 0 ? Math.abs(comparison.emotionScoreDelta) : 0;

  return clampScore(
    REGRESSION_SCORE_WEIGHTS.character * characterRegression +
      REGRESSION_SCORE_WEIGHTS.style * styleRegression +
      REGRESSION_SCORE_WEIGHTS.emotion * emotionRegression
  );
}

function resolveSignalTags(
  comparison: ReplayComparison,
  divergenceScore: number,
  regressionDetected: boolean
): readonly string[] {
  const tags: string[] = [];

  if (comparison.characterScoreDelta !== 0) {
    tags.push("character-drift");
  }
  if (comparison.styleScoreDelta !== 0) {
    tags.push("style-drift");
  }
  if (comparison.emotionScoreDelta !== 0) {
    tags.push("emotion-drift");
  }
  if (!comparison.driftRiskMatch) {
    tags.push("drift-risk-mismatch");
  }
  if (!comparison.integrityMatch) {
    tags.push("integrity-mismatch");
  }
  if (regressionDetected) {
    tags.push("continuity-regression");
  }
  if (divergenceScore >= DIVERGENCE_DETECTION_THRESHOLD) {
    tags.push("divergence-detected");
  }

  return sortUnique(tags);
}

function buildComparisonEntries(
  comparisons: readonly ReplayComparison[]
): readonly ComparisonIntelligenceEntry[] {
  const sortedComparisons = Object.freeze(
    [...comparisons].sort((left, right) => left.comparisonId.localeCompare(right.comparisonId))
  );

  return Object.freeze(
    sortedComparisons.map((comparison, index) => {
      const divergenceScore = computeDivergenceScore(comparison);
      const continuityRegressionScore = computeContinuityRegressionScore(comparison);
      const regressionDetected = continuityRegressionScore >= CONTINUITY_REGRESSION_THRESHOLD;

      return Object.freeze({
        intelligenceId: buildIntelligenceId(index),
        comparisonId: comparison.comparisonId,
        leftReplayId: comparison.leftReplayId,
        rightReplayId: comparison.rightReplayId,
        divergenceScore,
        continuityRegressionScore,
        divergenceSeverity: resolveDivergenceSeverity(divergenceScore),
        regressionDetected,
        signalTags: resolveSignalTags(comparison, divergenceScore, regressionDetected),
      });
    })
  );
}

function buildDivergenceSignalSummary(
  entries: readonly ComparisonIntelligenceEntry[]
): DivergenceSignalSummary {
  const divergenceScores = entries.map((entry) => entry.divergenceScore);
  const divergenceDetectedCount = entries.filter(
    (entry) => entry.divergenceScore >= DIVERGENCE_DETECTION_THRESHOLD
  ).length;
  const regressionDetectedCount = entries.filter((entry) => entry.regressionDetected).length;

  return Object.freeze({
    totalComparisons: entries.length,
    divergenceDetectedCount,
    regressionDetectedCount,
    averageDivergenceScore: averageScores(divergenceScores),
    maxDivergenceScore: entries.length === 0 ? 0 : clampScore(Math.max(...divergenceScores)),
    continuityRegressionRate: clampScore(
      entries.length === 0 ? 0 : regressionDetectedCount / entries.length
    ),
  });
}

function buildContinuityRegressionSummary(
  orchestratorPlan: AutomatedReplayOrchestratorPlan
): ContinuityRegressionSummary {
  const comparisons = orchestratorPlan.replayComparisons;

  return Object.freeze({
    orchestratorId: orchestratorPlan.orchestratorId,
    queueStabilityScore: orchestratorPlan.stabilitySummary.queueStabilityScore,
    averageCharacterDelta: averageScores(comparisons.map((entry) => entry.characterScoreDelta)),
    averageStyleDelta: averageScores(comparisons.map((entry) => entry.styleScoreDelta)),
    averageEmotionDelta: averageScores(comparisons.map((entry) => entry.emotionScoreDelta)),
    integrityMismatchCount: comparisons.filter((entry) => !entry.integrityMatch).length,
    driftRiskMismatchCount: comparisons.filter((entry) => !entry.driftRiskMatch).length,
  });
}

export function buildReplayComparisonIntelligenceReport(
  input: ReplayComparisonIntelligenceInput
): ReplayComparisonIntelligenceReport {
  const reportIndex = resolveReportIndex(input.orchestratorPlan, input.reportIndex);
  const reportId = buildReportId(reportIndex);
  const comparisonEntries = buildComparisonEntries(input.orchestratorPlan.replayComparisons);

  return Object.freeze({
    version: REPLAY_COMPARISON_INTELLIGENCE_VERSION,
    reportId,
    orchestratorId: input.orchestratorPlan.orchestratorId,
    comparisonEntries,
    divergenceSignalSummary: buildDivergenceSignalSummary(comparisonEntries),
    continuityRegressionSummary: buildContinuityRegressionSummary(input.orchestratorPlan),
  });
}

export function serializeReplayComparisonIntelligenceReport(
  report: ReplayComparisonIntelligenceReport
): string {
  return JSON.stringify({
    version: report.version,
    reportId: report.reportId,
    orchestratorId: report.orchestratorId,
    comparisonEntries: report.comparisonEntries,
    divergenceSignalSummary: report.divergenceSignalSummary,
    continuityRegressionSummary: report.continuityRegressionSummary,
  });
}

export function computeReplayComparisonIntelligenceFingerprint(
  report: ReplayComparisonIntelligenceReport
): string {
  return crypto.createHash("sha256").update(serializeReplayComparisonIntelligenceReport(report)).digest("hex");
}

export function assertReplayComparisonIntelligenceDeterministic(
  report: ReplayComparisonIntelligenceReport
): boolean {
  const entriesSorted = [...report.comparisonEntries]
    .sort((left, right) => left.comparisonId.localeCompare(right.comparisonId))
    .map((entry) => entry.comparisonId)
    .join("|");

  const entriesOrdered =
    report.comparisonEntries.map((entry) => entry.comparisonId).join("|") === entriesSorted;

  const scoresClamped = report.comparisonEntries.every(
    (entry) =>
      entry.divergenceScore >= 0 &&
      entry.divergenceScore <= 1 &&
      entry.continuityRegressionScore >= 0 &&
      entry.continuityRegressionScore <= 1
  );

  return (
    entriesOrdered &&
    scoresClamped &&
    report.continuityRegressionSummary.orchestratorId === report.orchestratorId &&
    report.divergenceSignalSummary.totalComparisons === report.comparisonEntries.length
  );
}

export function assertReplayComparisonIntelligenceDivergenceScoresClamped(
  report: ReplayComparisonIntelligenceReport
): boolean {
  return (
    report.divergenceSignalSummary.averageDivergenceScore >= 0 &&
    report.divergenceSignalSummary.averageDivergenceScore <= 1 &&
    report.divergenceSignalSummary.maxDivergenceScore >= 0 &&
    report.divergenceSignalSummary.maxDivergenceScore <= 1 &&
    report.divergenceSignalSummary.continuityRegressionRate >= 0 &&
    report.divergenceSignalSummary.continuityRegressionRate <= 1 &&
    report.comparisonEntries.every(
      (entry) => entry.divergenceScore >= 0 && entry.divergenceScore <= 1
    )
  );
}
