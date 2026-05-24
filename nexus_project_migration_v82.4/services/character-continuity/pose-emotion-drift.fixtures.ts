import { CHARACTER_MEMORY_TIMELINE_OUTPUT_EXAMPLE } from "./character-memory-timeline.fixtures.ts";
import { evaluatePoseEmotionDrift } from "./pose-emotion-drift-evaluator.ts";

export const POSE_EMOTION_DRIFT_INPUT_EXAMPLE = CHARACTER_MEMORY_TIMELINE_OUTPUT_EXAMPLE;

export const POSE_EMOTION_DRIFT_OUTPUT_EXAMPLE = evaluatePoseEmotionDrift(
  POSE_EMOTION_DRIFT_INPUT_EXAMPLE
);

export const POSE_EMOTION_DRIFT_FRAME_ORDER_EXPECTED = Object.freeze([
  "frame-001",
  "frame-002",
  "frame-003",
] as const);

export const POSE_EMOTION_DRIFT_RISK_THRESHOLDS = Object.freeze({
  lowMax: 0.35,
  mediumMax: 0.65,
});
