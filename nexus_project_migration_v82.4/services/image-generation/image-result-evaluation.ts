/** Phase-13A: image result evaluation — generated image feedback JSON schema (pure, deterministic) */

import crypto from "crypto";
import type { ImageGenerationRequest } from "./image-generation-request.ts";

export type ImageResultEvaluationVersion = "v1";

export type ImageEvaluationDriftRisk = "low" | "medium" | "high";

export type ImageEvaluationSignals = {
  readonly identityMatchScore: number;
  readonly anchorMatchScore: number;
  readonly paletteMatchScore: number;
  readonly glazeMatchScore: number;
  readonly lineWeightMatchScore: number;
  readonly poseMatchScore: number;
  readonly emotionMatchScore: number;
  readonly detectedBreaks?: readonly string[];
};

export type ImageResultEvaluationInput = {
  readonly request: ImageGenerationRequest;
  readonly signals: ImageEvaluationSignals;
  readonly evaluationIndex?: number;
};

export type ImageResultEvaluation = {
  readonly version: ImageResultEvaluationVersion;
  readonly evaluationId: string;
  readonly characterConsistencyScore: number;
  readonly styleConsistencyScore: number;
  readonly emotionalContinuityScore: number;
  readonly driftRisk: ImageEvaluationDriftRisk;
  readonly continuityBreaks: readonly string[];
  readonly recommendedPromptAdjustments: readonly string[];
  readonly recommendedNegativeAdjustments: readonly string[];
};

export const IMAGE_RESULT_EVALUATION_VERSION: ImageResultEvaluationVersion = "v1";

export const IMAGE_EVALUATION_DRIFT_THRESHOLDS = Object.freeze({
  lowMax: 0.35,
  mediumMax: 0.65,
});

export const CONTINUITY_BREAK_THRESHOLD = 0.75;

const CHARACTER_SCORE_WEIGHTS = Object.freeze({
  identity: 0.5,
  anchor: 0.3,
  pose: 0.2,
});

const DRIFT_SCORE_WEIGHTS = Object.freeze({
  identity: 0.45,
  anchor: 0.2,
  style: 0.15,
  pose: 0.1,
  emotion: 0.1,
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

function buildEvaluationId(evaluationIndex: number): string {
  return `image-eval-${String(evaluationIndex + 1).padStart(3, "0")}`;
}

function resolveEvaluationIndex(request: ImageGenerationRequest, evaluationIndex: number | undefined): number {
  if (evaluationIndex !== undefined) {
    return evaluationIndex;
  }

  const match = request.requestId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function resolveCharacterConsistencyScore(signals: ImageEvaluationSignals): number {
  return clampScore(
    CHARACTER_SCORE_WEIGHTS.identity * signals.identityMatchScore +
      CHARACTER_SCORE_WEIGHTS.anchor * signals.anchorMatchScore +
      CHARACTER_SCORE_WEIGHTS.pose * signals.poseMatchScore
  );
}

function resolveStyleConsistencyScore(signals: ImageEvaluationSignals): number {
  return averageScores([
    signals.paletteMatchScore,
    signals.glazeMatchScore,
    signals.lineWeightMatchScore,
  ]);
}

function resolveEmotionalContinuityScore(signals: ImageEvaluationSignals): number {
  return clampScore(signals.emotionMatchScore);
}

function resolveDriftScore(signals: ImageEvaluationSignals): number {
  const styleConsistency = resolveStyleConsistencyScore(signals);

  return clampScore(
    DRIFT_SCORE_WEIGHTS.identity * (1 - signals.identityMatchScore) +
      DRIFT_SCORE_WEIGHTS.anchor * (1 - signals.anchorMatchScore) +
      DRIFT_SCORE_WEIGHTS.style * (1 - styleConsistency) +
      DRIFT_SCORE_WEIGHTS.pose * (1 - signals.poseMatchScore) +
      DRIFT_SCORE_WEIGHTS.emotion * (1 - signals.emotionMatchScore)
  );
}

export function resolveDriftRiskFromScore(driftScore: number): ImageEvaluationDriftRisk {
  const risk = clampScore(driftScore);
  if (risk <= IMAGE_EVALUATION_DRIFT_THRESHOLDS.lowMax) {
    return "low";
  }
  if (risk <= IMAGE_EVALUATION_DRIFT_THRESHOLDS.mediumMax) {
    return "medium";
  }
  return "high";
}

function resolveContinuityBreaks(signals: ImageEvaluationSignals): readonly string[] {
  const breaks: string[] = [];

  if (signals.identityMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    breaks.push("identity mismatch");
  }
  if (signals.anchorMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    breaks.push("anchor drift");
  }
  if (signals.paletteMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    breaks.push("palette shift");
  }
  if (signals.glazeMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    breaks.push("glaze inconsistency");
  }
  if (signals.lineWeightMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    breaks.push("line weight drift");
  }
  if (signals.poseMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    breaks.push("pose break");
  }
  if (signals.emotionMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    breaks.push("emotion overshoot");
  }

  if (signals.detectedBreaks) {
    breaks.push(...signals.detectedBreaks);
  }

  return Object.freeze([...new Set(breaks)].sort((left, right) => left.localeCompare(right)));
}

function resolvePromptAdjustments(
  request: ImageGenerationRequest,
  signals: ImageEvaluationSignals
): readonly string[] {
  const adjustments: string[] = [];

  if (signals.identityMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push(`reinforce character identity:${request.characterId}`);
  }
  if (signals.anchorMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("emphasize anchor persistence in scene prompt");
  }
  if (signals.paletteMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("emphasize gonegi palette stability in prompt");
  }
  if (signals.glazeMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("reinforce watercolor glaze atmosphere in prompt");
  }
  if (signals.lineWeightMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("reinforce soft line weight in prompt");
  }
  if (signals.poseMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("tighten pose continuity language in prompt");
  }
  if (signals.emotionMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("tighten emotional continuity language in prompt");
  }

  if (request.identityLocks.length > 0 && signals.identityMatchScore < 0.85) {
    adjustments.push(`reapply identity lock count:${request.identityLocks.length}`);
  }
  if (request.styleLocks.length > 0 && resolveStyleConsistencyScore(signals) < 0.8) {
    adjustments.push(`reapply style lock count:${request.styleLocks.length}`);
  }

  return Object.freeze([...new Set(adjustments)].sort((left, right) => left.localeCompare(right)));
}

function resolveNegativeAdjustments(signals: ImageEvaluationSignals): readonly string[] {
  const adjustments: string[] = [];

  if (signals.identityMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("different face, identity collapse, wrong character");
  }
  if (signals.anchorMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("anchor mismatch");
  }
  if (signals.paletteMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("palette shift");
  }
  if (signals.glazeMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("gonegi style break, harsh line weight");
  }
  if (signals.lineWeightMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("harsh line weight, plastic skin");
  }
  if (signals.poseMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("anatomy drift, pose break");
  }
  if (signals.emotionMatchScore < CONTINUITY_BREAK_THRESHOLD) {
    adjustments.push("emotion overshoot");
  }

  return Object.freeze([...new Set(adjustments)].sort((left, right) => left.localeCompare(right)));
}

export function buildImageResultEvaluation(input: ImageResultEvaluationInput): ImageResultEvaluation {
  const { request, signals } = input;
  const evaluationIndex = resolveEvaluationIndex(request, input.evaluationIndex);
  const evaluationId = buildEvaluationId(evaluationIndex);
  const characterConsistencyScore = resolveCharacterConsistencyScore(signals);
  const styleConsistencyScore = resolveStyleConsistencyScore(signals);
  const emotionalContinuityScore = resolveEmotionalContinuityScore(signals);
  const driftRisk = resolveDriftRiskFromScore(resolveDriftScore(signals));
  const continuityBreaks = resolveContinuityBreaks(signals);
  const recommendedPromptAdjustments = resolvePromptAdjustments(request, signals);
  const recommendedNegativeAdjustments = resolveNegativeAdjustments(signals);

  return Object.freeze({
    version: IMAGE_RESULT_EVALUATION_VERSION,
    evaluationId,
    characterConsistencyScore,
    styleConsistencyScore,
    emotionalContinuityScore,
    driftRisk,
    continuityBreaks,
    recommendedPromptAdjustments,
    recommendedNegativeAdjustments,
  });
}

export function serializeImageResultEvaluation(evaluation: ImageResultEvaluation): string {
  return JSON.stringify({
    version: evaluation.version,
    evaluationId: evaluation.evaluationId,
    characterConsistencyScore: evaluation.characterConsistencyScore,
    styleConsistencyScore: evaluation.styleConsistencyScore,
    emotionalContinuityScore: evaluation.emotionalContinuityScore,
    driftRisk: evaluation.driftRisk,
    continuityBreaks: evaluation.continuityBreaks,
    recommendedPromptAdjustments: evaluation.recommendedPromptAdjustments,
    recommendedNegativeAdjustments: evaluation.recommendedNegativeAdjustments,
  });
}

export function computeImageResultEvaluationFingerprint(evaluation: ImageResultEvaluation): string {
  return crypto.createHash("sha256").update(serializeImageResultEvaluation(evaluation)).digest("hex");
}

export function assertImageResultEvaluationScoresInRange(evaluation: ImageResultEvaluation): boolean {
  const scores = [
    evaluation.characterConsistencyScore,
    evaluation.styleConsistencyScore,
    evaluation.emotionalContinuityScore,
  ];

  return scores.every((score) => score >= 0 && score <= 1);
}

export function assertImageResultEvaluationDeterministic(evaluation: ImageResultEvaluation): boolean {
  const breaksSorted = [...evaluation.continuityBreaks]
    .sort((left, right) => left.localeCompare(right))
    .join("|");
  const promptSorted = [...evaluation.recommendedPromptAdjustments]
    .sort((left, right) => left.localeCompare(right))
    .join("|");
  const negativeSorted = [...evaluation.recommendedNegativeAdjustments]
    .sort((left, right) => left.localeCompare(right))
    .join("|");

  return (
    evaluation.continuityBreaks.join("|") === breaksSorted &&
    evaluation.recommendedPromptAdjustments.join("|") === promptSorted &&
    evaluation.recommendedNegativeAdjustments.join("|") === negativeSorted &&
    assertImageResultEvaluationScoresInRange(evaluation) &&
    (evaluation.driftRisk === "low" ||
      evaluation.driftRisk === "medium" ||
      evaluation.driftRisk === "high") &&
    evaluation.evaluationId.length > 0
  );
}
