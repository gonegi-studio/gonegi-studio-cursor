import { CHARACTER_IDENTITY_PROFILE_EXAMPLE } from "./character-continuity.fixtures.ts";
import { CHARACTER_ANCHOR_REINFORCEMENT_OUTPUT_EXAMPLE } from "./character-anchor-reinforcement.fixtures.ts";
import { CHARACTER_MEMORY_TIMELINE_OUTPUT_EXAMPLE } from "./character-memory-timeline.fixtures.ts";
import { POSE_EMOTION_DRIFT_OUTPUT_EXAMPLE } from "./pose-emotion-drift.fixtures.ts";
import { STYLE_DRIFT_SUPPRESSION_OUTPUT_EXAMPLE } from "./style-drift-suppression.fixtures.ts";
import { buildCharacterContinuityReport } from "./character-continuity-report.ts";

export const CHARACTER_CONTINUITY_REPORT_INPUT_EXAMPLE = Object.freeze({
  profile: CHARACTER_IDENTITY_PROFILE_EXAMPLE,
  timeline: CHARACTER_MEMORY_TIMELINE_OUTPUT_EXAMPLE,
  driftEvaluation: POSE_EMOTION_DRIFT_OUTPUT_EXAMPLE,
  styleReport: STYLE_DRIFT_SUPPRESSION_OUTPUT_EXAMPLE,
  anchorReport: CHARACTER_ANCHOR_REINFORCEMENT_OUTPUT_EXAMPLE,
});

export const CHARACTER_CONTINUITY_REPORT_OUTPUT_EXAMPLE = buildCharacterContinuityReport(
  CHARACTER_CONTINUITY_REPORT_INPUT_EXAMPLE
);

export const CHARACTER_CONTINUITY_REPORT_STEERING_ORDER_EXPECTED = Object.freeze([
  "identity",
  "anchor",
  "style",
  "pose",
  "emotion",
] as const);
