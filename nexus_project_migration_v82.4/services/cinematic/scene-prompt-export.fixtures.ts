import { MUSIC_DRAMA_TIMELINE_OUTPUT_EXAMPLE } from "./music-drama.fixtures.ts";
import { buildScenePromptExport } from "./scene-prompt-export.ts";

export const SCENE_PROMPT_EXPORT_INPUT_EXAMPLE = MUSIC_DRAMA_TIMELINE_OUTPUT_EXAMPLE;

export const SCENE_PROMPT_EXPORT_OUTPUT_EXAMPLE = buildScenePromptExport(
  SCENE_PROMPT_EXPORT_INPUT_EXAMPLE
);

export const SCENE_PROMPT_EXPORT_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  sceneId: "scene-001",
  cueId: "cue-001",
  prompt: "nostalgic;low;slow;fade;shot-001",
  durationSec: 5,
  musicEnergy: "low" as const,
});
