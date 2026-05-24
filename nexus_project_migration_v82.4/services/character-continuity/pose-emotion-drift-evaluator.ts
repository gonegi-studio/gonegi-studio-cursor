/** Phase-10A: pose/emotion drift evaluator — deterministic continuity risk (pure, zero-runtime) */

import crypto from "crypto";
import type { CharacterMemoryFrame, CharacterMemoryTimeline } from "./character-memory-timeline.ts";

export type PoseEmotionDriftEvaluationVersion = "v1";

export type ContinuityRiskLevel = "low" | "medium" | "high";

export type PoseEmotionDriftFrameEvaluation = {
  readonly frameId: string;
  readonly frameIndex: number;
  readonly poseDrift: number;
  readonly emotionDrift: number;
  readonly anchorMismatch: number;
  readonly silhouetteInstability: number;
  readonly sceneEmotionOvershoot: number;
  readonly combinedDrift: number;
};

export type PoseEmotionDriftEvaluation = {
  readonly version: PoseEmotionDriftEvaluationVersion;
  readonly frameEvaluations: readonly PoseEmotionDriftFrameEvaluation[];
  readonly poseDriftScore: number;
  readonly emotionDriftScore: number;
  readonly continuityRisk: ContinuityRiskLevel;
};

export const POSE_EMOTION_DRIFT_EVALUATION_VERSION: PoseEmotionDriftEvaluationVersion = "v1";

export const CONTINUITY_RISK_THRESHOLDS = Object.freeze({
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

function resolveAnchorMismatch(
  current: CharacterMemoryFrame,
  previous: CharacterMemoryFrame | null
): number {
  if (!previous) {
    return 0;
  }

  const currentAnchors = new Set(current.anchorIds);
  const previousAnchors = new Set(previous.anchorIds);
  const overlap = [...currentAnchors].filter((anchorId) => previousAnchors.has(anchorId)).length;
  const unionSize = new Set([...currentAnchors, ...previousAnchors]).size;
  return clampScore(unionSize === 0 ? 0 : 1 - overlap / unionSize);
}

function resolveSilhouetteInstability(frame: CharacterMemoryFrame): number {
  return clampScore(1 - averageScores([frame.identityScore, frame.poseScore, frame.styleScore]));
}

function resolvePoseDrift(
  frame: CharacterMemoryFrame,
  previous: CharacterMemoryFrame | null
): number {
  const postureFamilyDelta = previous
    ? clampScore(1 - averageScores([frame.poseScore, previous.poseScore]))
    : 0;
  const silhouetteInstability = resolveSilhouetteInstability(frame);
  const anchorMismatch = resolveAnchorMismatch(frame, previous);

  return averageScores([postureFamilyDelta, silhouetteInstability, anchorMismatch]);
}

function resolveSceneEmotionOvershoot(
  frame: CharacterMemoryFrame,
  timeline: CharacterMemoryTimeline,
  previous: CharacterMemoryFrame | null
): number {
  if (!previous) {
    return 0;
  }

  const sceneCap = timeline.emotionalCarryover.sceneEmotionInfluence;
  const emotionalBreak = clampScore(1 - averageScores([frame.emotionalScore, frame.continuityScore]));
  return clampScore(Math.max(0, emotionalBreak - (1 - sceneCap)));
}

function resolveEmotionDrift(
  frame: CharacterMemoryFrame,
  timeline: CharacterMemoryTimeline,
  previous: CharacterMemoryFrame | null
): number {
  const baselineDeviation = previous ? clampScore(1 - frame.emotionalScore) : 0;
  const sceneEmotionOvershoot = resolveSceneEmotionOvershoot(frame, timeline, previous);
  const continuityBreak = previous
    ? clampScore(1 - averageScores([frame.emotionalScore, previous.emotionalScore]))
    : 0;

  return averageScores([baselineDeviation, sceneEmotionOvershoot, continuityBreak]);
}

function resolveCombinedDrift(poseDrift: number, emotionDrift: number): number {
  return averageScores([poseDrift, emotionDrift]);
}

function buildFrameEvaluation(
  frame: CharacterMemoryFrame,
  timeline: CharacterMemoryTimeline,
  previous: CharacterMemoryFrame | null
): PoseEmotionDriftFrameEvaluation {
  const poseDrift = resolvePoseDrift(frame, previous);
  const emotionDrift = resolveEmotionDrift(frame, timeline, previous);
  const anchorMismatch = resolveAnchorMismatch(frame, previous);
  const silhouetteInstability = resolveSilhouetteInstability(frame);
  const sceneEmotionOvershoot = resolveSceneEmotionOvershoot(frame, timeline, previous);

  return Object.freeze({
    frameId: frame.frameId,
    frameIndex: frame.frameIndex,
    poseDrift,
    emotionDrift,
    anchorMismatch,
    silhouetteInstability,
    sceneEmotionOvershoot,
    combinedDrift: resolveCombinedDrift(poseDrift, emotionDrift),
  });
}

function resolveContinuityRisk(
  poseDriftScore: number,
  emotionDriftScore: number
): ContinuityRiskLevel {
  const peakDrift = Math.max(poseDriftScore, emotionDriftScore);
  if (peakDrift <= CONTINUITY_RISK_THRESHOLDS.lowMax) {
    return "low";
  }
  if (peakDrift <= CONTINUITY_RISK_THRESHOLDS.mediumMax) {
    return "medium";
  }
  return "high";
}

export function evaluatePoseEmotionDrift(
  timeline: CharacterMemoryTimeline
): PoseEmotionDriftEvaluation {
  const orderedFrames = Object.freeze([...timeline.memoryFrames]);
  const frameEvaluations = Object.freeze(
    orderedFrames.map((frame, index) =>
      buildFrameEvaluation(frame, timeline, index > 0 ? orderedFrames[index - 1] : null)
    )
  );

  const poseDriftScore = averageScores(frameEvaluations.map((evaluation) => evaluation.poseDrift));
  const emotionDriftScore = averageScores(
    frameEvaluations.map((evaluation) => evaluation.emotionDrift)
  );

  return Object.freeze({
    version: POSE_EMOTION_DRIFT_EVALUATION_VERSION,
    frameEvaluations,
    poseDriftScore,
    emotionDriftScore,
    continuityRisk: resolveContinuityRisk(poseDriftScore, emotionDriftScore),
  });
}

export function serializePoseEmotionDriftEvaluation(
  evaluation: PoseEmotionDriftEvaluation
): string {
  return JSON.stringify({
    version: evaluation.version,
    frameEvaluations: evaluation.frameEvaluations,
    poseDriftScore: evaluation.poseDriftScore,
    emotionDriftScore: evaluation.emotionDriftScore,
    continuityRisk: evaluation.continuityRisk,
  });
}

export function computePoseEmotionDriftFingerprint(
  evaluation: PoseEmotionDriftEvaluation
): string {
  return crypto.createHash("sha256").update(serializePoseEmotionDriftEvaluation(evaluation)).digest("hex");
}

export function assertPoseEmotionDriftScoresInRange(
  evaluation: PoseEmotionDriftEvaluation
): boolean {
  const frameValid = evaluation.frameEvaluations.every(
    (frame) =>
      frame.poseDrift >= 0 &&
      frame.poseDrift <= 1 &&
      frame.emotionDrift >= 0 &&
      frame.emotionDrift <= 1 &&
      frame.anchorMismatch >= 0 &&
      frame.anchorMismatch <= 1 &&
      frame.silhouetteInstability >= 0 &&
      frame.silhouetteInstability <= 1 &&
      frame.sceneEmotionOvershoot >= 0 &&
      frame.sceneEmotionOvershoot <= 1 &&
      frame.combinedDrift >= 0 &&
      frame.combinedDrift <= 1
  );

  const aggregateValid =
    evaluation.poseDriftScore >= 0 &&
    evaluation.poseDriftScore <= 1 &&
    evaluation.emotionDriftScore >= 0 &&
    evaluation.emotionDriftScore <= 1;

  const riskValid = ["low", "medium", "high"].includes(evaluation.continuityRisk);

  return frameValid && aggregateValid && riskValid;
}

export function resolveContinuityRiskFromScores(
  poseDriftScore: number,
  emotionDriftScore: number
): ContinuityRiskLevel {
  return resolveContinuityRisk(clampScore(poseDriftScore), clampScore(emotionDriftScore));
}
