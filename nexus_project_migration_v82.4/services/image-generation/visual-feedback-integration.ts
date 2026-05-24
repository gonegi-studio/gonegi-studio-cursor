/** Phase-23A: visual feedback integration — visual aggregation → feedback loop bridge (pure, deterministic) */

import crypto from "crypto";
import type { AutomatedVisualSignalAggregation } from "./automated-visual-signal-aggregator.ts";
import type { NextGenerationRequest } from "./next-generation-request-composer.ts";
import type { PromptPolicyFeedback } from "./prompt-policy-feedback.ts";

export type VisualFeedbackIntegrationVersion = "v1";

export type VisualStabilityImpact = {
  readonly aggregationId: string;
  readonly feedbackId: string;
  readonly nextRequestId: string;
  readonly sessionStabilityScore: number;
  readonly projectedStabilityGain: number;
  readonly styleCorrectionPriority: number;
  readonly emotionTuningPriority: number;
  readonly visualAlertCount: number;
};

export type VisualFeedbackIntegrationInput = {
  readonly visualAggregation: AutomatedVisualSignalAggregation;
  readonly feedback: PromptPolicyFeedback;
  readonly nextRequest: NextGenerationRequest;
  readonly integrationIndex?: number;
};

export type VisualFeedbackIntegrationResult = {
  readonly version: VisualFeedbackIntegrationVersion;
  readonly integrationId: string;
  readonly reinforcedFeedback: readonly string[];
  readonly visualCorrectionPolicies: readonly string[];
  readonly nextRequestEnhancements: readonly string[];
  readonly stabilityImpact: VisualStabilityImpact;
};

export const VISUAL_FEEDBACK_INTEGRATION_VERSION: VisualFeedbackIntegrationVersion = "v1";

export const VISUAL_CORRECTION_PRIORITY_ORDER = Object.freeze({
  character: 1,
  style: 2,
  drift: 3,
  continuity: 4,
  emotion: 5,
  other: 6,
});

export const VISUAL_STABILITY_GAIN_WEIGHTS = Object.freeze({
  style: 0.45,
  identity: 0.35,
  emotion: 0.2,
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

function buildIntegrationId(integrationIndex: number): string {
  return `visual-feedback-${String(integrationIndex + 1).padStart(3, "0")}`;
}

function resolveIntegrationIndex(
  feedback: PromptPolicyFeedback,
  integrationIndex: number | undefined
): number {
  if (integrationIndex !== undefined) {
    return integrationIndex;
  }

  const match = feedback.feedbackId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function classifyCorrection(value: string): keyof typeof VISUAL_CORRECTION_PRIORITY_ORDER {
  if (/identity|character|anchor/i.test(value)) {
    return "character";
  }
  if (/style|glaze|palette|line/i.test(value)) {
    return "style";
  }
  if (/drift|long-session/i.test(value)) {
    return "drift";
  }
  if (/continuity|break|alert/i.test(value)) {
    return "continuity";
  }
  if (/emotion|pose/i.test(value)) {
    return "emotion";
  }
  return "other";
}

function orderByVisualPriority(values: readonly string[]): readonly string[] {
  return Object.freeze(
    [...values].sort((left, right) => {
      const leftPriority = VISUAL_CORRECTION_PRIORITY_ORDER[classifyCorrection(left)];
      const rightPriority = VISUAL_CORRECTION_PRIORITY_ORDER[classifyCorrection(right)];
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.localeCompare(right);
    })
  );
}

function buildReinforcedFeedback(
  aggregation: AutomatedVisualSignalAggregation,
  feedback: PromptPolicyFeedback
): readonly string[] {
  const reinforced: string[] = [...feedback.promptAdjustments];

  if (aggregation.stabilitySummary.styleStableRate < 1) {
    reinforced.push("prioritize style drift blockers in next prompt");
    reinforced.push("reinforce watercolor glaze atmosphere in next prompt");
  }
  if (aggregation.driftTracking.styleDriftDelta > 0) {
    reinforced.push(`visual drift correction:style delta:${aggregation.driftTracking.styleDriftDelta}`);
  }
  if (aggregation.stabilitySummary.identityStableRate < 1) {
    reinforced.push("reinforce primary character identity language in next prompt");
  }
  if (aggregation.driftTracking.identityDriftDelta > 0) {
    reinforced.push(`visual drift correction:identity delta:${aggregation.driftTracking.identityDriftDelta}`);
  }
  if (aggregation.driftTracking.breakCountTotal > 0) {
    reinforced.push(`continuity alert count:${aggregation.driftTracking.breakCountTotal}`);
  }
  if (aggregation.driftTracking.emotionDriftDelta > 0) {
    reinforced.push("refine emotional continuity language in next prompt");
    reinforced.push(`visual drift correction:emotion delta:${aggregation.driftTracking.emotionDriftDelta}`);
  }

  reinforced.push(...feedback.lockAdjustments.map((adjustment) => `lock:${adjustment}`));

  return orderByVisualPriority(sortUnique(reinforced));
}

function buildVisualCorrectionPolicies(
  aggregation: AutomatedVisualSignalAggregation
): readonly string[] {
  const policies: string[] = [
    `policy:integrate visual aggregation:${aggregation.aggregationId}`,
    `policy:session stability score:${aggregation.stabilitySummary.sessionStabilityScore}`,
  ];

  if (aggregation.stabilitySummary.styleStableRate < 1) {
    policies.push("policy:reinforce style drift blockers from visual aggregation");
    policies.push("policy:reinforce style drift blockers from visual aggregation");
  }
  if (aggregation.driftTracking.maxIntakeDriftSpread > 0) {
    policies.push(`policy:long-session drift spread:${aggregation.driftTracking.maxIntakeDriftSpread}`);
  }
  if (aggregation.driftTracking.unstableIntakeCount > 0) {
    policies.push(`policy:stabilize unstable intake count:${aggregation.driftTracking.unstableIntakeCount}`);
  }

  for (const alert of aggregation.continuityAlerts) {
    policies.push(`policy:${alert.alertKind}:${alert.intakeId}`);
  }

  if (aggregation.cumulativeSignals.cumulativeStyleScore < 0.8) {
    policies.push("policy:long-session glaze drift correction");
  }

  return sortUnique(policies);
}

function buildNextRequestEnhancements(
  aggregation: AutomatedVisualSignalAggregation,
  feedback: PromptPolicyFeedback,
  nextRequest: NextGenerationRequest
): readonly string[] {
  const enhancements: string[] = [
    `enhancement:source feedback:${feedback.feedbackId}`,
    `enhancement:target request:${nextRequest.requestId}`,
    `enhancement:visual aggregation:${aggregation.aggregationId}`,
  ];

  for (const applied of nextRequest.appliedFeedback) {
    enhancements.push(`enhancement:carry forward:${applied}`);
  }

  if (aggregation.stabilitySummary.styleStableRate < 1) {
    enhancements.push("enhancement:strengthen style blocker priority");
  }
  if (aggregation.continuityAlerts.length > 0) {
    enhancements.push(`enhancement:carry forward aggregation alerts:${aggregation.continuityAlerts.length}`);
  }
  if (aggregation.driftTracking.emotionDriftDelta > 0) {
    enhancements.push("enhancement:defer emotion tuning until style stabilized");
  }

  return sortUnique(enhancements);
}

function buildStabilityImpact(
  aggregation: AutomatedVisualSignalAggregation,
  feedback: PromptPolicyFeedback,
  nextRequest: NextGenerationRequest
): VisualStabilityImpact {
  const styleCorrectionPriority = clampScore(
    aggregation.driftTracking.styleDriftDelta * VISUAL_STABILITY_GAIN_WEIGHTS.style +
      (1 - aggregation.stabilitySummary.styleStableRate) * VISUAL_STABILITY_GAIN_WEIGHTS.style +
      feedback.nextRequestHints.styleBlockerPriority * 0.2
  );

  const emotionTuningPriority = clampScore(
    aggregation.driftTracking.emotionDriftDelta * VISUAL_STABILITY_GAIN_WEIGHTS.emotion +
      feedback.nextRequestHints.emotionTuningPriority * 0.5
  );

  const projectedStabilityGain = clampScore(
    styleCorrectionPriority * VISUAL_STABILITY_GAIN_WEIGHTS.style +
      clampScore(1 - aggregation.driftTracking.maxIntakeDriftSpread) *
        VISUAL_STABILITY_GAIN_WEIGHTS.identity +
      clampScore(aggregation.stabilitySummary.sessionStabilityScore + 0.25) *
        VISUAL_STABILITY_GAIN_WEIGHTS.emotion
  );

  return Object.freeze({
    aggregationId: aggregation.aggregationId,
    feedbackId: feedback.feedbackId,
    nextRequestId: nextRequest.requestId,
    sessionStabilityScore: aggregation.stabilitySummary.sessionStabilityScore,
    projectedStabilityGain,
    styleCorrectionPriority,
    emotionTuningPriority:
      aggregation.stabilitySummary.styleStableRate < 1
        ? clampScore(emotionTuningPriority * 0.5)
        : emotionTuningPriority,
    visualAlertCount: aggregation.continuityAlerts.length,
  });
}

export function buildVisualFeedbackIntegrationResult(
  input: VisualFeedbackIntegrationInput
): VisualFeedbackIntegrationResult {
  const integrationIndex = resolveIntegrationIndex(input.feedback, input.integrationIndex);
  const integrationId = buildIntegrationId(integrationIndex);

  return Object.freeze({
    version: VISUAL_FEEDBACK_INTEGRATION_VERSION,
    integrationId,
    reinforcedFeedback: buildReinforcedFeedback(input.visualAggregation, input.feedback),
    visualCorrectionPolicies: buildVisualCorrectionPolicies(input.visualAggregation),
    nextRequestEnhancements: buildNextRequestEnhancements(
      input.visualAggregation,
      input.feedback,
      input.nextRequest
    ),
    stabilityImpact: buildStabilityImpact(
      input.visualAggregation,
      input.feedback,
      input.nextRequest
    ),
  });
}

export function serializeVisualFeedbackIntegrationResult(
  result: VisualFeedbackIntegrationResult
): string {
  return JSON.stringify({
    version: result.version,
    integrationId: result.integrationId,
    reinforcedFeedback: result.reinforcedFeedback,
    visualCorrectionPolicies: result.visualCorrectionPolicies,
    nextRequestEnhancements: result.nextRequestEnhancements,
    stabilityImpact: result.stabilityImpact,
  });
}

export function computeVisualFeedbackIntegrationFingerprint(
  result: VisualFeedbackIntegrationResult
): string {
  return crypto.createHash("sha256").update(serializeVisualFeedbackIntegrationResult(result)).digest("hex");
}

export function assertVisualFeedbackIntegrationReinforcedOrdering(
  result: VisualFeedbackIntegrationResult
): boolean {
  const priorities = result.reinforcedFeedback.map((entry) =>
    VISUAL_CORRECTION_PRIORITY_ORDER[classifyCorrection(entry)]
  );

  return priorities.every(
    (priority, index) => index === 0 || priority >= priorities[index - 1]
  );
}

export function assertVisualFeedbackIntegrationDuplicateCorrectionsRemoved(
  result: VisualFeedbackIntegrationResult
): boolean {
  const policies = result.visualCorrectionPolicies;
  const sortedPolicies = [...policies].sort((left, right) => left.localeCompare(right));

  return (
    new Set(policies).size === policies.length &&
    policies.join("|") === sortedPolicies.join("|")
  );
}

export function assertVisualFeedbackIntegrationStabilityImpactDeterministic(
  result: VisualFeedbackIntegrationResult
): boolean {
  const impact = result.stabilityImpact;

  return (
    impact.aggregationId.length > 0 &&
    impact.feedbackId.length > 0 &&
    impact.nextRequestId.length > 0 &&
    impact.sessionStabilityScore >= 0 &&
    impact.sessionStabilityScore <= 1 &&
    impact.projectedStabilityGain >= 0 &&
    impact.projectedStabilityGain <= 1 &&
    impact.styleCorrectionPriority >= 0 &&
    impact.styleCorrectionPriority <= 1 &&
    impact.emotionTuningPriority >= 0 &&
    impact.emotionTuningPriority <= 1 &&
    impact.visualAlertCount >= 0 &&
    impact.styleCorrectionPriority >= impact.emotionTuningPriority
  );
}

export function assertVisualFeedbackIntegrationDeterministic(
  result: VisualFeedbackIntegrationResult
): boolean {
  return (
    assertVisualFeedbackIntegrationReinforcedOrdering(result) &&
    assertVisualFeedbackIntegrationDuplicateCorrectionsRemoved(result) &&
    assertVisualFeedbackIntegrationStabilityImpactDeterministic(result) &&
    new Set(result.reinforcedFeedback).size === result.reinforcedFeedback.length &&
    new Set(result.nextRequestEnhancements).size === result.nextRequestEnhancements.length &&
    result.integrationId.length > 0
  );
}
