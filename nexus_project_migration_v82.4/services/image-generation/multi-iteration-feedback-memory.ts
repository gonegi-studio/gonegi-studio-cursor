/** Phase-16A: multi-iteration feedback memory — cumulative generation session memory (pure, deterministic) */

import crypto from "crypto";
import type { ImageGenerationRequest } from "./image-generation-request.ts";
import type { ImageEvaluationDriftRisk, ImageResultEvaluation } from "./image-result-evaluation.ts";
import type { NextGenerationRequest } from "./next-generation-request-composer.ts";
import type { PromptPolicyFeedback } from "./prompt-policy-feedback.ts";

export type MultiIterationFeedbackMemoryVersion = "v1";

export type MemoryRiskLevel = ImageEvaluationDriftRisk;

export type FeedbackIterationRecord = {
  readonly iterationId: string;
  readonly requestId: string;
  readonly evaluationId: string;
  readonly feedbackId: string;
  readonly nextRequestId: string;
  readonly characterConsistencyScore: number;
  readonly styleConsistencyScore: number;
  readonly emotionalContinuityScore: number;
  readonly driftRisk: ImageEvaluationDriftRisk;
  readonly appliedFeedbackCount: number;
};

export type MultiIterationFeedbackMemoryInput = {
  readonly requests: readonly ImageGenerationRequest[];
  readonly evaluations: readonly ImageResultEvaluation[];
  readonly feedbacks: readonly PromptPolicyFeedback[];
  readonly nextRequests: readonly NextGenerationRequest[];
  readonly memoryIndex?: number;
};

export type MultiIterationFeedbackMemory = {
  readonly version: MultiIterationFeedbackMemoryVersion;
  readonly memoryId: string;
  readonly iterations: readonly FeedbackIterationRecord[];
  readonly cumulativeCharacterScore: number;
  readonly cumulativeStyleScore: number;
  readonly cumulativeEmotionScore: number;
  readonly promptDriftRisk: MemoryRiskLevel;
  readonly overCorrectionRisk: MemoryRiskLevel;
  readonly stablePolicyHints: readonly string[];
};

export const MULTI_ITERATION_FEEDBACK_MEMORY_VERSION: MultiIterationFeedbackMemoryVersion = "v1";

export const MEMORY_RISK_THRESHOLDS = Object.freeze({
  lowMax: 0.35,
  mediumMax: 0.65,
});

export const CUMULATIVE_SCORE_WEIGHTS = Object.freeze({
  character: 0.5,
  style: 0.3,
  emotion: 0.2,
});

export const STABILITY_BASELINE_THRESHOLDS = Object.freeze({
  character: 0.88,
  style: 0.8,
  emotion: 0.82,
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

function sortUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

function buildMemoryId(memoryIndex: number): string {
  return `feedback-memory-${String(memoryIndex + 1).padStart(3, "0")}`;
}

function buildIterationId(index: number): string {
  return `iteration-${String(index + 1).padStart(3, "0")}`;
}

function resolveRequestIndex(requestId: string): number {
  const match = requestId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }
  return Number.parseInt(match[1], 10);
}

export function resolveMemoryRiskFromScore(riskScore: number): MemoryRiskLevel {
  const risk = clampScore(riskScore);
  if (risk <= MEMORY_RISK_THRESHOLDS.lowMax) {
    return "low";
  }
  if (risk <= MEMORY_RISK_THRESHOLDS.mediumMax) {
    return "medium";
  }
  return "high";
}

function countPolicySegments(prompt: string): number {
  return prompt.split(" | ").filter((segment) => segment.startsWith("policy:")).length;
}

function resolvePromptDriftScore(
  requests: readonly ImageGenerationRequest[],
  nextRequests: readonly NextGenerationRequest[]
): number {
  if (nextRequests.length <= 1) {
    const policyCount = nextRequests.length === 0 ? 0 : countPolicySegments(nextRequests[0].prompt);
    return clampScore(policyCount / 20);
  }

  const firstPolicies = countPolicySegments(requests[0]?.prompt ?? "");
  const lastPolicies = countPolicySegments(nextRequests[nextRequests.length - 1].prompt);
  const growth = Math.max(0, lastPolicies - firstPolicies);

  return clampScore(growth / 10 + lastPolicies / 24);
}

function resolveOverCorrectionScore(
  evaluations: readonly ImageResultEvaluation[],
  feedbacks: readonly PromptPolicyFeedback[],
  nextRequests: readonly NextGenerationRequest[]
): number {
  if (feedbacks.length === 0) {
    return 0;
  }

  const lockAdjustmentTotal = feedbacks.reduce((sum, feedback) => sum + feedback.lockAdjustments.length, 0);
  const appliedGrowth =
    nextRequests.length > 1
      ? Math.max(
          0,
          nextRequests[nextRequests.length - 1].appliedFeedback.length - nextRequests[0].appliedFeedback.length
        )
      : 0;

  const unnecessaryIdentityCorrections = feedbacks.reduce((count, feedback, index) => {
    const evaluation = evaluations[index];
    if (!evaluation) {
      return count;
    }

    const hasIdentityCorrection = feedback.promptAdjustments.some((adjustment) =>
      /identity|character|anchor/i.test(adjustment)
    );

    return evaluation.characterConsistencyScore >= STABILITY_BASELINE_THRESHOLDS.character &&
      hasIdentityCorrection
      ? count + 1
      : count;
  }, 0);

  return clampScore(lockAdjustmentTotal / 16 + appliedGrowth / 14 + unnecessaryIdentityCorrections * 0.18);
}

function resolveCumulativeCharacterScore(evaluations: readonly ImageResultEvaluation[]): number {
  return averageScores(evaluations.map((evaluation) => evaluation.characterConsistencyScore));
}

function resolveCumulativeStyleScore(evaluations: readonly ImageResultEvaluation[]): number {
  return averageScores(evaluations.map((evaluation) => evaluation.styleConsistencyScore));
}

function resolveCumulativeEmotionScore(evaluations: readonly ImageResultEvaluation[]): number {
  return averageScores(evaluations.map((evaluation) => evaluation.emotionalContinuityScore));
}

function resolveStablePolicyHints(
  evaluations: readonly ImageResultEvaluation[],
  feedbacks: readonly PromptPolicyFeedback[],
  cumulativeCharacterScore: number,
  cumulativeStyleScore: number,
  cumulativeEmotionScore: number
): readonly string[] {
  const hints: string[] = [];

  if (cumulativeCharacterScore >= STABILITY_BASELINE_THRESHOLDS.character) {
    hints.push("maintain character identity baseline");
  } else {
    hints.push("reinforce character identity continuity");
  }

  if (cumulativeStyleScore >= STABILITY_BASELINE_THRESHOLDS.style) {
    hints.push("preserve gonegi style palette baseline");
  } else {
    hints.push("stabilize style drift blockers");
  }

  if (cumulativeEmotionScore >= STABILITY_BASELINE_THRESHOLDS.emotion) {
    hints.push("maintain emotional continuity baseline");
  } else {
    hints.push("refine emotional continuity language");
  }

  for (const feedback of feedbacks) {
    if (feedback.promptAdjustments.some((adjustment) => /identity|character/i.test(adjustment))) {
      hints.push("prioritize character consistency in next iteration");
    }
    if (feedback.promptAdjustments.some((adjustment) => /style|glaze|palette/i.test(adjustment))) {
      hints.push("prioritize style drift suppression in next iteration");
    }
    if (feedback.promptAdjustments.some((adjustment) => /emotion|pose/i.test(adjustment))) {
      hints.push("prioritize emotional continuity in next iteration");
    }
  }

  if (evaluations.length >= 2) {
    const characterTrend =
      evaluations[evaluations.length - 1].characterConsistencyScore -
      evaluations[0].characterConsistencyScore;
    if (characterTrend >= 0) {
      hints.push("retain cumulative character improvement trend");
    } else {
      hints.push("recover character consistency regression");
    }
  }

  return sortUnique(hints);
}

function buildIterationRecords(
  requests: readonly ImageGenerationRequest[],
  evaluations: readonly ImageResultEvaluation[],
  feedbacks: readonly PromptPolicyFeedback[],
  nextRequests: readonly NextGenerationRequest[]
): readonly FeedbackIterationRecord[] {
  const records = requests.map((request, index) => {
    const evaluation = evaluations[index];
    const feedback = feedbacks[index];
    const nextRequest = nextRequests[index];

    return Object.freeze({
      iterationId: buildIterationId(index),
      requestId: request.requestId,
      evaluationId: evaluation.evaluationId,
      feedbackId: feedback.feedbackId,
      nextRequestId: nextRequest.requestId,
      characterConsistencyScore: evaluation.characterConsistencyScore,
      styleConsistencyScore: evaluation.styleConsistencyScore,
      emotionalContinuityScore: evaluation.emotionalContinuityScore,
      driftRisk: evaluation.driftRisk,
      appliedFeedbackCount: nextRequest.appliedFeedback.length,
    });
  });

  return Object.freeze(
    [...records].sort((left, right) => resolveRequestIndex(left.requestId) - resolveRequestIndex(right.requestId))
  );
}

export function buildMultiIterationFeedbackMemory(
  input: MultiIterationFeedbackMemoryInput
): MultiIterationFeedbackMemory {
  const { requests, evaluations, feedbacks, nextRequests } = input;

  if (
    requests.length === 0 ||
    requests.length !== evaluations.length ||
    requests.length !== feedbacks.length ||
    requests.length !== nextRequests.length
  ) {
    throw new Error("multi-iteration feedback memory input arrays must be aligned and non-empty");
  }

  const memoryIndex = input.memoryIndex ?? 0;
  const memoryId = buildMemoryId(memoryIndex);
  const iterations = buildIterationRecords(requests, evaluations, feedbacks, nextRequests);
  const cumulativeCharacterScore = resolveCumulativeCharacterScore(evaluations);
  const cumulativeStyleScore = resolveCumulativeStyleScore(evaluations);
  const cumulativeEmotionScore = resolveCumulativeEmotionScore(evaluations);
  const promptDriftRisk = resolveMemoryRiskFromScore(resolvePromptDriftScore(requests, nextRequests));
  const overCorrectionRisk = resolveMemoryRiskFromScore(
    resolveOverCorrectionScore(evaluations, feedbacks, nextRequests)
  );
  const stablePolicyHints = resolveStablePolicyHints(
    evaluations,
    feedbacks,
    cumulativeCharacterScore,
    cumulativeStyleScore,
    cumulativeEmotionScore
  );

  return Object.freeze({
    version: MULTI_ITERATION_FEEDBACK_MEMORY_VERSION,
    memoryId,
    iterations,
    cumulativeCharacterScore,
    cumulativeStyleScore,
    cumulativeEmotionScore,
    promptDriftRisk,
    overCorrectionRisk,
    stablePolicyHints,
  });
}

export function serializeMultiIterationFeedbackMemory(memory: MultiIterationFeedbackMemory): string {
  return JSON.stringify({
    version: memory.version,
    memoryId: memory.memoryId,
    iterations: memory.iterations,
    cumulativeCharacterScore: memory.cumulativeCharacterScore,
    cumulativeStyleScore: memory.cumulativeStyleScore,
    cumulativeEmotionScore: memory.cumulativeEmotionScore,
    promptDriftRisk: memory.promptDriftRisk,
    overCorrectionRisk: memory.overCorrectionRisk,
    stablePolicyHints: memory.stablePolicyHints,
  });
}

export function computeMultiIterationFeedbackMemoryFingerprint(memory: MultiIterationFeedbackMemory): string {
  return crypto.createHash("sha256").update(serializeMultiIterationFeedbackMemory(memory)).digest("hex");
}

export function assertMultiIterationFeedbackMemoryScoresInRange(memory: MultiIterationFeedbackMemory): boolean {
  const scores = [
    memory.cumulativeCharacterScore,
    memory.cumulativeStyleScore,
    memory.cumulativeEmotionScore,
  ];

  return scores.every((score) => score >= 0 && score <= 1);
}

export function assertMultiIterationFeedbackMemoryDeterministic(memory: MultiIterationFeedbackMemory): boolean {
  const iterationOrder = memory.iterations
    .map((iteration) => resolveRequestIndex(iteration.requestId))
    .every((index, position, values) => position === 0 || index >= values[position - 1]);

  const hintsSorted = [...memory.stablePolicyHints]
    .sort((left, right) => left.localeCompare(right))
    .join("|");

  return (
    iterationOrder &&
    memory.stablePolicyHints.join("|") === hintsSorted &&
    new Set(memory.stablePolicyHints).size === memory.stablePolicyHints.length &&
    assertMultiIterationFeedbackMemoryScoresInRange(memory) &&
    memory.iterations.every((iteration) => iteration.iterationId.length > 0)
  );
}

export function toImageGenerationRequestFromNext(nextRequest: NextGenerationRequest): ImageGenerationRequest {
  return Object.freeze({
    version: "v1",
    requestId: nextRequest.requestId,
    characterId: nextRequest.characterId,
    prompt: nextRequest.prompt,
    negativePrompt: nextRequest.negativePrompt,
    aspectRatio: nextRequest.aspectRatio,
    seedPolicy: nextRequest.seedPolicy,
    identityLocks: nextRequest.identityLocks,
    styleLocks: nextRequest.styleLocks,
    steeringLocks: nextRequest.steeringLocks,
    exportTarget: nextRequest.exportTarget,
  });
}
