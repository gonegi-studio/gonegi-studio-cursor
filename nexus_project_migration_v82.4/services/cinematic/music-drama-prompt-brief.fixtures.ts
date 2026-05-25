import { MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE } from "./music-drama-scene-plan.fixtures.ts";
import {
  buildMusicDramaPromptBrief,
  computeMusicDramaPromptBriefFingerprint,
} from "./music-drama-prompt-brief.ts";

export const MUSIC_DRAMA_PROMPT_BRIEF_INPUT_EXAMPLE = MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE;

export const MUSIC_DRAMA_PROMPT_BRIEF_OUTPUT_EXAMPLE = buildMusicDramaPromptBrief(
  MUSIC_DRAMA_PROMPT_BRIEF_INPUT_EXAMPLE
);

export const MUSIC_DRAMA_PROMPT_BRIEF_FINGERPRINT = computeMusicDramaPromptBriefFingerprint(
  MUSIC_DRAMA_PROMPT_BRIEF_OUTPUT_EXAMPLE
);

export const MUSIC_DRAMA_PROMPT_BRIEF_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  dramaFunction: "frame-establish" as const,
  emotionalBeat: "nostalgic-calm",
  rhythmPhase: "rhythm-rise" as const,
  suggestedMusicEnergy: "low" as const,
  suggestedCutPressure: "soft" as const,
  promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
  continuityAnchor: "continuity-anchor-segment-001",
});

export const MUSIC_DRAMA_PROMPT_TRANSITION_BRIEF_OUTPUT_EXAMPLE = Object.freeze({
  transitionIndex: 0,
  fromQueueOrder: 0,
  toQueueOrder: 1,
  rhythmShift: "nostalgic-calm|reflective-bridge",
});

export const MUSIC_DRAMA_PROMPT_BRIEF_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  promptBriefId: "music-drama-prompt-brief-gonegi-harbor-25s-v1",
  promptBriefVersion: "music-drama-prompt-brief-v1" as const,
  activePromptBriefState: "25s-music-drama-prompt-brief-metadata-only",
});
