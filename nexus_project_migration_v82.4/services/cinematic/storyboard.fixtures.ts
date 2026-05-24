import { DATASET_INDEX_OUTPUT_EXAMPLE } from "../dataset/dataset.fixtures.ts";
import { buildStoryboardTimeline } from "./storyboard-timeline.ts";

export const STORYBOARD_TIMELINE_INPUT_EXAMPLE = DATASET_INDEX_OUTPUT_EXAMPLE;

export const STORYBOARD_TIMELINE_OUTPUT_EXAMPLE = buildStoryboardTimeline(
  STORYBOARD_TIMELINE_INPUT_EXAMPLE
);

export const STORYBOARD_TIMELINE_SHOT_EXAMPLE = Object.freeze({
  shotId: "shot-001",
  emotion: "nostalgic",
  duration: 4,
  transition: "slow-fade",
});
