/** Phase-14A: prompt policy feedback — evaluation-to-next-request policy layer (pure, deterministic) */

import crypto from "crypto";
import type { ImageGenerationRequest } from "./image-generation-request.ts";
import type { ImageEvaluationDriftRisk, ImageResultEvaluation } from "./image-result-evaluation.ts";

export type PromptPolicyFeedbackVersion = "v1";

export type PromptPolicyRiskLevel = ImageEvaluationDriftRisk;

export type NextRequestHints = {
  readonly characterPriorityBoost: number;
  readonly styleBlockerPriority: number;
  readonly emotionTuningPriority: number;
  readonly sourceEvaluationId: string;
  readonly sourceRequestId: string;
  readonly continuityBreakCount: number;
};

export type PromptPolicyFeedbackInput = {
  readonly request: ImageGenerationRequest;
  readonly evaluation: ImageResultEvaluation;
  readonly feedbackIndex?: number;
};

export type PromptPolicyFeedback = {
  readonly version: PromptPolicyFeedbackVersion;
  readonly feedbackId: string;
  readonly riskLevel: PromptPolicyRiskLevel;
  readonly promptAdjustments: readonly string[];
  readonly negativePromptAdjustments: readonly string[];
  readonly lockAdjustments: readonly string[];
  readonly nextRequestHints: NextRequestHints;
};

export const PROMPT_POLICY_FEEDBACK_VERSION: PromptPolicyFeedbackVersion = "v1";

export const PROMPT_POLICY_PRIORITY_THRESHOLDS = Object.freeze({
  character: 0.88,
  style: 0.8,
  emotion: 0.82,
});

export const LOCK_STRENGTH_BOOST = 0.05;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function buildFeedbackId(feedbackIndex: number): string {
  return `prompt-feedback-${String(feedbackIndex + 1).padStart(3, "0")}`;
}

function resolveFeedbackIndex(request: ImageGenerationRequest, feedbackIndex: number | undefined): number {
  if (feedbackIndex !== undefined) {
    return feedbackIndex;
  }

  const match = request.requestId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function sortUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

function hasBreak(evaluation: ImageResultEvaluation, fragment: string): boolean {
  return evaluation.continuityBreaks.some((item) => item.includes(fragment));
}

function resolveCharacterPromptAdjustments(
  request: ImageGenerationRequest,
  evaluation: ImageResultEvaluation
): readonly string[] {
  const adjustments: string[] = [];

  if (evaluation.characterConsistencyScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.character) {
    adjustments.push("boost character identity weight in next prompt");
    adjustments.push(`carry forward identity lock policy:${request.characterId}`);
  }
  if (hasBreak(evaluation, "identity")) {
    adjustments.push("reinforce primary character identity language in next prompt");
  }
  if (hasBreak(evaluation, "anchor")) {
    adjustments.push("reinforce anchor persistence language in next prompt");
  }

  return adjustments;
}

function resolveStylePromptAdjustments(evaluation: ImageResultEvaluation): readonly string[] {
  const adjustments: string[] = [];

  if (evaluation.styleConsistencyScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.style) {
    adjustments.push("prioritize style drift blockers in next prompt");
  }
  if (hasBreak(evaluation, "palette")) {
    adjustments.push("emphasize gonegi palette stability in next prompt");
  }
  if (hasBreak(evaluation, "glaze")) {
    adjustments.push("reinforce watercolor glaze atmosphere in next prompt");
  }
  if (hasBreak(evaluation, "line weight")) {
    adjustments.push("reinforce soft line weight in next prompt");
  }

  return adjustments;
}

function resolveEmotionPromptAdjustments(evaluation: ImageResultEvaluation): readonly string[] {
  const adjustments: string[] = [];

  if (evaluation.emotionalContinuityScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.emotion) {
    adjustments.push("refine emotional continuity language in next prompt");
  }
  if (hasBreak(evaluation, "emotion")) {
    adjustments.push("tighten emotional continuity language in next prompt");
  }
  if (hasBreak(evaluation, "pose")) {
    adjustments.push("tighten pose continuity language in next prompt");
  }

  return adjustments;
}

function resolvePromptAdjustments(
  request: ImageGenerationRequest,
  evaluation: ImageResultEvaluation
): readonly string[] {
  return sortUnique([
    ...resolveCharacterPromptAdjustments(request, evaluation),
    ...resolveStylePromptAdjustments(evaluation),
    ...resolveEmotionPromptAdjustments(evaluation),
    ...evaluation.recommendedPromptAdjustments,
  ]);
}

function resolveNegativePromptAdjustments(evaluation: ImageResultEvaluation): readonly string[] {
  const adjustments: string[] = [...evaluation.recommendedNegativeAdjustments];

  if (evaluation.characterConsistencyScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.character) {
    adjustments.push("wrong character, identity collapse");
  }
  if (evaluation.styleConsistencyScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.style) {
    adjustments.push("style drift, palette shift");
  }
  if (evaluation.emotionalContinuityScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.emotion) {
    adjustments.push("emotion overshoot");
  }

  return sortUnique(adjustments);
}

function resolveLockAdjustments(
  request: ImageGenerationRequest,
  evaluation: ImageResultEvaluation
): readonly string[] {
  const adjustments: string[] = [];

  if (
    evaluation.characterConsistencyScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.character ||
    hasBreak(evaluation, "identity") ||
    hasBreak(evaluation, "anchor")
  ) {
    for (const lock of request.identityLocks) {
      adjustments.push(
        `strengthen identity lock:${lock.lockId}:${clampScore(lock.strength + LOCK_STRENGTH_BOOST)}`
      );
    }
  }

  if (
    evaluation.styleConsistencyScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.style ||
    hasBreak(evaluation, "palette") ||
    hasBreak(evaluation, "glaze") ||
    hasBreak(evaluation, "line weight")
  ) {
    for (const lock of request.styleLocks) {
      adjustments.push(
        `strengthen style lock:${lock.lockId}:${clampScore(lock.strength + LOCK_STRENGTH_BOOST)}`
      );
    }
  }

  for (const lock of request.steeringLocks) {
    if (lock.level === "style" && evaluation.styleConsistencyScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.style) {
      adjustments.push(
        `strengthen steering lock:${lock.lockId}:${clampScore(lock.strength + LOCK_STRENGTH_BOOST)}`
      );
    }
    if (
      lock.level === "emotion" &&
      evaluation.emotionalContinuityScore < PROMPT_POLICY_PRIORITY_THRESHOLDS.emotion
    ) {
      adjustments.push(
        `strengthen steering lock:${lock.lockId}:${clampScore(lock.strength + LOCK_STRENGTH_BOOST)}`
      );
    }
  }

  return sortUnique(adjustments);
}

function resolveNextRequestHints(
  request: ImageGenerationRequest,
  evaluation: ImageResultEvaluation
): NextRequestHints {
  return Object.freeze({
    characterPriorityBoost: clampScore(1 - evaluation.characterConsistencyScore),
    styleBlockerPriority: clampScore(1 - evaluation.styleConsistencyScore),
    emotionTuningPriority: clampScore(1 - evaluation.emotionalContinuityScore),
    sourceEvaluationId: evaluation.evaluationId,
    sourceRequestId: request.requestId,
    continuityBreakCount: evaluation.continuityBreaks.length,
  });
}

export function buildPromptPolicyFeedback(input: PromptPolicyFeedbackInput): PromptPolicyFeedback {
  const { request, evaluation } = input;
  const feedbackIndex = resolveFeedbackIndex(request, input.feedbackIndex);
  const feedbackId = buildFeedbackId(feedbackIndex);

  return Object.freeze({
    version: PROMPT_POLICY_FEEDBACK_VERSION,
    feedbackId,
    riskLevel: evaluation.driftRisk,
    promptAdjustments: resolvePromptAdjustments(request, evaluation),
    negativePromptAdjustments: resolveNegativePromptAdjustments(evaluation),
    lockAdjustments: resolveLockAdjustments(request, evaluation),
    nextRequestHints: resolveNextRequestHints(request, evaluation),
  });
}

export function serializePromptPolicyFeedback(feedback: PromptPolicyFeedback): string {
  return JSON.stringify({
    version: feedback.version,
    feedbackId: feedback.feedbackId,
    riskLevel: feedback.riskLevel,
    promptAdjustments: feedback.promptAdjustments,
    negativePromptAdjustments: feedback.negativePromptAdjustments,
    lockAdjustments: feedback.lockAdjustments,
    nextRequestHints: feedback.nextRequestHints,
  });
}

export function computePromptPolicyFeedbackFingerprint(feedback: PromptPolicyFeedback): string {
  return crypto.createHash("sha256").update(serializePromptPolicyFeedback(feedback)).digest("hex");
}

export function assertPromptPolicyFeedbackDeterministic(feedback: PromptPolicyFeedback): boolean {
  const promptSorted = [...feedback.promptAdjustments]
    .sort((left, right) => left.localeCompare(right))
    .join("|");
  const negativeSorted = [...feedback.negativePromptAdjustments]
    .sort((left, right) => left.localeCompare(right))
    .join("|");
  const lockSorted = [...feedback.lockAdjustments]
    .sort((left, right) => left.localeCompare(right))
    .join("|");

  const hints = feedback.nextRequestHints;
  const hintsInRange =
    hints.characterPriorityBoost >= 0 &&
    hints.characterPriorityBoost <= 1 &&
    hints.styleBlockerPriority >= 0 &&
    hints.styleBlockerPriority <= 1 &&
    hints.emotionTuningPriority >= 0 &&
    hints.emotionTuningPriority <= 1;

  return (
    feedback.promptAdjustments.join("|") === promptSorted &&
    feedback.negativePromptAdjustments.join("|") === negativeSorted &&
    feedback.lockAdjustments.join("|") === lockSorted &&
    hintsInRange &&
    feedback.feedbackId.length > 0 &&
    (feedback.riskLevel === "low" || feedback.riskLevel === "medium" || feedback.riskLevel === "high")
  );
}

export function assertPromptPolicyFeedbackNoDuplicates(feedback: PromptPolicyFeedback): boolean {
  const unique = (values: readonly string[]) => new Set(values).size === values.length;

  return (
    unique(feedback.promptAdjustments) &&
    unique(feedback.negativePromptAdjustments) &&
    unique(feedback.lockAdjustments)
  );
}
