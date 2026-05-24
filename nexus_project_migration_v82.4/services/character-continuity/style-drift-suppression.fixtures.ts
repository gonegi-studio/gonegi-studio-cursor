import { CHARACTER_MEMORY_TIMELINE_OUTPUT_EXAMPLE } from "./character-memory-timeline.fixtures.ts";
import { POSE_EMOTION_DRIFT_OUTPUT_EXAMPLE } from "./pose-emotion-drift.fixtures.ts";
import { buildStyleDriftSuppressionReport } from "./style-drift-suppression.ts";

export const STYLE_DRIFT_SUPPRESSION_TIMELINE_EXAMPLE = CHARACTER_MEMORY_TIMELINE_OUTPUT_EXAMPLE;

export const STYLE_DRIFT_SUPPRESSION_DRIFT_EXAMPLE = POSE_EMOTION_DRIFT_OUTPUT_EXAMPLE;

export const STYLE_DRIFT_SUPPRESSION_OUTPUT_EXAMPLE = buildStyleDriftSuppressionReport(
  STYLE_DRIFT_SUPPRESSION_TIMELINE_EXAMPLE,
  STYLE_DRIFT_SUPPRESSION_DRIFT_EXAMPLE
);

export const STYLE_RISK_THRESHOLDS_EXAMPLE = Object.freeze({
  lowMax: 0.35,
  mediumMax: 0.65,
});
