import { COMPILED_PROMPT_PACK_OUTPUT_EXAMPLE } from "./prompt-compiler.fixtures.ts";
import { buildMusicDramaTimeline } from "./music-drama-timeline.ts";

export const MUSIC_DRAMA_TIMELINE_INPUT_EXAMPLE = COMPILED_PROMPT_PACK_OUTPUT_EXAMPLE;

export const MUSIC_DRAMA_TIMELINE_OUTPUT_EXAMPLE = buildMusicDramaTimeline(
  MUSIC_DRAMA_TIMELINE_INPUT_EXAMPLE
);

export const MUSIC_DRAMA_CUE_OUTPUT_EXAMPLE = Object.freeze({
  cueId: "cue-001",
  unitId: "prompt-001",
  startSec: 0,
  durationSec: 5,
  musicEnergy: "low" as const,
  prompt: "nostalgic;low;slow;fade;shot-001",
});
