import { STORYBOARD_TIMELINE_OUTPUT_EXAMPLE } from "./storyboard.fixtures.ts";
import { buildSequenceComposition } from "./sequence-composer.ts";

export const SEQUENCE_COMPOSITION_INPUT_EXAMPLE = STORYBOARD_TIMELINE_OUTPUT_EXAMPLE;

export const SEQUENCE_COMPOSITION_OUTPUT_EXAMPLE = buildSequenceComposition(
  SEQUENCE_COMPOSITION_INPUT_EXAMPLE
);

export const SEQUENCE_SEGMENT_OUTPUT_EXAMPLE = Object.freeze({
  segmentId: "segment-001",
  shotIds: Object.freeze(["shot-001"] as const),
  emotionalBeat: "nostalgic",
  musicEnergy: "low" as const,
  transitionProfile: "slow-fade",
});
