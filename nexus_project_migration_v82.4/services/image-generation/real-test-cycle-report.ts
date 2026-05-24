/** Phase-24A: real test cycle report — AI Studio test cycle archive (pure, deterministic) */

import crypto from "crypto";
import type { AutomatedVisualSignalAggregation } from "./automated-visual-signal-aggregator.ts";
import type { ImageGenerationRequest } from "./image-generation-request.ts";
import type { ImageResultEvaluation } from "./image-result-evaluation.ts";
import type { NextGenerationRequest } from "./next-generation-request-composer.ts";
import type { PromptPolicyFeedback } from "./prompt-policy-feedback.ts";
import type { RealImageEvaluationIntake } from "./real-image-evaluation-intake.ts";
import type { VisualFeedbackIntegrationResult } from "./visual-feedback-integration.ts";

export type RealTestCycleReportVersion = "v1";

export type RealTestCyclePipelineSection =
  | "request"
  | "intake"
  | "evaluation"
  | "aggregation"
  | "feedback"
  | "integration"
  | "next-request";

export type RealTestCycleCycleSummary = {
  readonly cycleReportIndex: number;
  readonly sourceRequestId: string;
  readonly nextRequestId: string;
  readonly evaluationId: string;
  readonly intakeId: string;
  readonly aggregationId: string;
  readonly feedbackId: string;
  readonly integrationId: string;
  readonly characterId: string;
  readonly exportTarget: string;
  readonly pipelineSections: readonly RealTestCyclePipelineSection[];
  readonly sectionCount: number;
};

export type RealTestCycleVisualQaSummary = {
  readonly imageCount: number;
  readonly intakeStable: boolean;
  readonly styleStable: boolean;
  readonly breakCount: number;
  readonly sessionStabilityScore: number;
  readonly maxIntakeDriftSpread: number;
  readonly styleFindings: readonly string[];
  readonly alertCount: number;
};

export type RealTestCycleFeedbackSummary = {
  readonly riskLevel: PromptPolicyFeedback["riskLevel"];
  readonly reinforcedFeedbackCount: number;
  readonly correctionPolicyCount: number;
  readonly styleCorrectionPriority: number;
  readonly emotionTuningPriority: number;
  readonly projectedStabilityGain: number;
  readonly priorityFindings: readonly string[];
};

export type RealTestCycleNextRequestSummary = {
  readonly nextRequestId: string;
  readonly parentRequestId: string;
  readonly appliedFeedbackCount: number;
  readonly enhancementCount: number;
  readonly characterConsistencyScore: number;
  readonly styleConsistencyScore: number;
  readonly emotionalContinuityScore: number;
};

export type RealTestCycleReplayReadiness = {
  readonly replayReady: boolean;
  readonly idsAligned: boolean;
  readonly bundleComplete: boolean;
  readonly styleDriftPrioritized: boolean;
  readonly emotionTuningDeferred: boolean;
  readonly readinessScore: number;
  readonly checklist: readonly string[];
};

export type RealTestCycleReportInput = {
  readonly request: ImageGenerationRequest;
  readonly intake: RealImageEvaluationIntake;
  readonly evaluation: ImageResultEvaluation;
  readonly visualAggregation: AutomatedVisualSignalAggregation;
  readonly feedback: PromptPolicyFeedback;
  readonly nextRequest: NextGenerationRequest;
  readonly visualIntegration: VisualFeedbackIntegrationResult;
  readonly cycleReportIndex?: number;
};

export type RealTestCycleReport = {
  readonly version: RealTestCycleReportVersion;
  readonly cycleReportId: string;
  readonly sourceRequestId: string;
  readonly cycleSummary: RealTestCycleCycleSummary;
  readonly visualQaSummary: RealTestCycleVisualQaSummary;
  readonly feedbackSummary: RealTestCycleFeedbackSummary;
  readonly nextRequestSummary: RealTestCycleNextRequestSummary;
  readonly replayReadiness: RealTestCycleReplayReadiness;
};

export const REAL_TEST_CYCLE_REPORT_VERSION: RealTestCycleReportVersion = "v1";

export const REAL_TEST_CYCLE_PIPELINE_SECTIONS: readonly RealTestCyclePipelineSection[] = Object.freeze([
  "request",
  "intake",
  "evaluation",
  "aggregation",
  "feedback",
  "integration",
  "next-request",
]);

export const REAL_TEST_CYCLE_READINESS_WEIGHTS = Object.freeze({
  idsAligned: 0.3,
  bundleComplete: 0.25,
  styleDriftPrioritized: 0.25,
  emotionTuningDeferred: 0.2,
});

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function sortUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

function buildCycleReportId(cycleReportIndex: number): string {
  return `real-test-cycle-${String(cycleReportIndex + 1).padStart(3, "0")}`;
}

function resolveCycleReportIndex(
  request: ImageGenerationRequest,
  cycleReportIndex: number | undefined
): number {
  if (cycleReportIndex !== undefined) {
    return cycleReportIndex;
  }

  const match = request.requestId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function classifyStyleFinding(value: string): number {
  if (/style|glaze|palette|line/i.test(value)) {
    return 1;
  }
  if (/drift|continuity|break|alert/i.test(value)) {
    return 2;
  }
  if (/emotion|pose/i.test(value)) {
    return 3;
  }
  return 4;
}

function orderStyleFindingsFirst(values: readonly string[]): readonly string[] {
  return Object.freeze(
    [...sortUnique(values)].sort((left, right) => {
      const leftPriority = classifyStyleFinding(left);
      const rightPriority = classifyStyleFinding(right);
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.localeCompare(right);
    })
  );
}

function buildCycleSummary(
  input: RealTestCycleReportInput,
  cycleReportIndex: number
): RealTestCycleCycleSummary {
  return Object.freeze({
    cycleReportIndex,
    sourceRequestId: input.request.requestId,
    nextRequestId: input.nextRequest.requestId,
    evaluationId: input.evaluation.evaluationId,
    intakeId: input.intake.intakeId,
    aggregationId: input.visualAggregation.aggregationId,
    feedbackId: input.feedback.feedbackId,
    integrationId: input.visualIntegration.integrationId,
    characterId: input.request.characterId,
    exportTarget: input.request.exportTarget,
    pipelineSections: REAL_TEST_CYCLE_PIPELINE_SECTIONS,
    sectionCount: REAL_TEST_CYCLE_PIPELINE_SECTIONS.length,
  });
}

function buildVisualQaSummary(
  intake: RealImageEvaluationIntake,
  visualAggregation: AutomatedVisualSignalAggregation
): RealTestCycleVisualQaSummary {
  const flags = intake.continuityFlags;
  const styleFindings: string[] = [];

  if (!flags.styleStable) {
    styleFindings.push("style instability detected in intake");
  }
  if (visualAggregation.driftTracking.styleDriftDelta > 0) {
    styleFindings.push(`style drift delta:${visualAggregation.driftTracking.styleDriftDelta}`);
  }
  for (const alert of visualAggregation.continuityAlerts) {
    if (alert.alertKind.includes("style") || alert.alertKind.includes("drift")) {
      styleFindings.push(`alert:${alert.alertKind}:${alert.intakeId}`);
    }
  }
  for (const policy of visualAggregation.continuityAlerts.map((alert) => alert.message)) {
    if (/style|glaze|drift/i.test(policy)) {
      styleFindings.push(`continuity:${policy}`);
    }
  }

  return Object.freeze({
    imageCount: intake.imageSet.length,
    intakeStable: flags.identityStable && flags.styleStable && flags.poseStable && flags.emotionStable,
    styleStable: flags.styleStable,
    breakCount: flags.breakCount + visualAggregation.driftTracking.breakCountTotal,
    sessionStabilityScore: visualAggregation.stabilitySummary.sessionStabilityScore,
    maxIntakeDriftSpread: visualAggregation.driftTracking.maxIntakeDriftSpread,
    styleFindings: orderStyleFindingsFirst(styleFindings),
    alertCount: visualAggregation.continuityAlerts.length,
  });
}

function buildFeedbackSummary(
  feedback: PromptPolicyFeedback,
  visualIntegration: VisualFeedbackIntegrationResult
): RealTestCycleFeedbackSummary {
  const impact = visualIntegration.stabilityImpact;
  const priorityFindings: string[] = [
    ...visualIntegration.reinforcedFeedback.filter((entry) => /style|glaze|palette|drift/i.test(entry)),
    ...visualIntegration.visualCorrectionPolicies.filter((entry) => /style|glaze|drift/i.test(entry)),
    ...visualIntegration.reinforcedFeedback.filter((entry) => /emotion|pose/i.test(entry)),
  ];

  return Object.freeze({
    riskLevel: feedback.riskLevel,
    reinforcedFeedbackCount: visualIntegration.reinforcedFeedback.length,
    correctionPolicyCount: visualIntegration.visualCorrectionPolicies.length,
    styleCorrectionPriority: impact.styleCorrectionPriority,
    emotionTuningPriority: impact.emotionTuningPriority,
    projectedStabilityGain: impact.projectedStabilityGain,
    priorityFindings: orderStyleFindingsFirst(priorityFindings),
  });
}

function buildNextRequestSummary(
  evaluation: ImageResultEvaluation,
  nextRequest: NextGenerationRequest,
  visualIntegration: VisualFeedbackIntegrationResult
): RealTestCycleNextRequestSummary {
  return Object.freeze({
    nextRequestId: nextRequest.requestId,
    parentRequestId: nextRequest.parentRequestId,
    appliedFeedbackCount: nextRequest.appliedFeedback.length,
    enhancementCount: visualIntegration.nextRequestEnhancements.length,
    characterConsistencyScore: evaluation.characterConsistencyScore,
    styleConsistencyScore: evaluation.styleConsistencyScore,
    emotionalContinuityScore: evaluation.emotionalContinuityScore,
  });
}

function buildReplayReadiness(input: RealTestCycleReportInput): RealTestCycleReplayReadiness {
  const impact = input.visualIntegration.stabilityImpact;
  const idsAligned =
    input.request.requestId === input.intake.sourceRequestId &&
    input.request.requestId === input.feedback.nextRequestHints.sourceRequestId &&
    input.nextRequest.parentRequestId === input.request.requestId &&
    input.evaluation.evaluationId === input.feedback.nextRequestHints.sourceEvaluationId;

  const bundleComplete =
    input.request.requestId.length > 0 &&
    input.intake.intakeId.length > 0 &&
    input.evaluation.evaluationId.length > 0 &&
    input.visualAggregation.aggregationId.length > 0 &&
    input.feedback.feedbackId.length > 0 &&
    input.nextRequest.requestId.length > 0 &&
    input.visualIntegration.integrationId.length > 0;

  const styleDriftPrioritized = impact.styleCorrectionPriority >= impact.emotionTuningPriority;
  const emotionTuningDeferred = input.visualIntegration.nextRequestEnhancements.some((entry) =>
    entry.includes("defer emotion tuning")
  );

  const checklist = sortUnique([
    "archive request artifact",
    "archive intake artifact",
    "archive evaluation artifact",
    "archive visual aggregation artifact",
    "archive feedback artifact",
    "archive integration artifact",
    "archive next request artifact",
    idsAligned ? "ids aligned across cycle" : "ids misaligned across cycle",
    styleDriftPrioritized ? "style drift prioritized" : "style drift not prioritized",
    emotionTuningDeferred ? "emotion tuning deferred" : "emotion tuning active",
    bundleComplete ? "cycle bundle complete" : "cycle bundle incomplete",
    "archive request artifact",
  ]);

  const readinessScore = clampScore(
    (idsAligned ? REAL_TEST_CYCLE_READINESS_WEIGHTS.idsAligned : 0) +
      (bundleComplete ? REAL_TEST_CYCLE_READINESS_WEIGHTS.bundleComplete : 0) +
      (styleDriftPrioritized ? REAL_TEST_CYCLE_READINESS_WEIGHTS.styleDriftPrioritized : 0) +
      (emotionTuningDeferred ? REAL_TEST_CYCLE_READINESS_WEIGHTS.emotionTuningDeferred : 0)
  );

  return Object.freeze({
    replayReady: idsAligned && bundleComplete && styleDriftPrioritized,
    idsAligned,
    bundleComplete,
    styleDriftPrioritized,
    emotionTuningDeferred,
    readinessScore,
    checklist,
  });
}

export function buildRealTestCycleReport(input: RealTestCycleReportInput): RealTestCycleReport {
  const cycleReportIndex = resolveCycleReportIndex(input.request, input.cycleReportIndex);
  const cycleReportId = buildCycleReportId(cycleReportIndex);

  return Object.freeze({
    version: REAL_TEST_CYCLE_REPORT_VERSION,
    cycleReportId,
    sourceRequestId: input.request.requestId,
    cycleSummary: buildCycleSummary(input, cycleReportIndex),
    visualQaSummary: buildVisualQaSummary(input.intake, input.visualAggregation),
    feedbackSummary: buildFeedbackSummary(input.feedback, input.visualIntegration),
    nextRequestSummary: buildNextRequestSummary(
      input.evaluation,
      input.nextRequest,
      input.visualIntegration
    ),
    replayReadiness: buildReplayReadiness(input),
  });
}

export function serializeRealTestCycleReport(report: RealTestCycleReport): string {
  return JSON.stringify({
    version: report.version,
    cycleReportId: report.cycleReportId,
    sourceRequestId: report.sourceRequestId,
    cycleSummary: report.cycleSummary,
    visualQaSummary: report.visualQaSummary,
    feedbackSummary: report.feedbackSummary,
    nextRequestSummary: report.nextRequestSummary,
    replayReadiness: report.replayReadiness,
  });
}

export function computeRealTestCycleReportFingerprint(report: RealTestCycleReport): string {
  return crypto.createHash("sha256").update(serializeRealTestCycleReport(report)).digest("hex");
}

export function assertRealTestCycleReportSectionOrdering(report: RealTestCycleReport): boolean {
  const sections = report.cycleSummary.pipelineSections;
  const expected = REAL_TEST_CYCLE_PIPELINE_SECTIONS;

  return (
    sections.length === expected.length &&
    sections.every((section, index) => section === expected[index])
  );
}

export function assertRealTestCycleReportSummaryDeduped(report: RealTestCycleReport): boolean {
  const styleFindings = report.visualQaSummary.styleFindings;
  const priorityFindings = report.feedbackSummary.priorityFindings;
  const checklist = report.replayReadiness.checklist;

  return (
    new Set(styleFindings).size === styleFindings.length &&
    new Set(priorityFindings).size === priorityFindings.length &&
    new Set(checklist).size === checklist.length
  );
}

export function assertRealTestCycleReportReplayReadinessDeterministic(
  report: RealTestCycleReport
): boolean {
  const readiness = report.replayReadiness;

  return (
    readiness.readinessScore >= 0 &&
    readiness.readinessScore <= 1 &&
    readiness.styleDriftPrioritized ===
      report.feedbackSummary.styleCorrectionPriority >= report.feedbackSummary.emotionTuningPriority
  );
}

export function assertRealTestCycleReportDeterministic(report: RealTestCycleReport): boolean {
  return (
    assertRealTestCycleReportSectionOrdering(report) &&
    assertRealTestCycleReportSummaryDeduped(report) &&
    assertRealTestCycleReportReplayReadinessDeterministic(report) &&
    report.cycleSummary.sectionCount === REAL_TEST_CYCLE_PIPELINE_SECTIONS.length &&
    report.sourceRequestId === report.cycleSummary.sourceRequestId
  );
}
