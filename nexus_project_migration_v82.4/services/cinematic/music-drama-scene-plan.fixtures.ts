import { MUSIC_TIMING_CONTRACT_OUTPUT_EXAMPLE } from "./music-timing-contract.fixtures.ts";
import {
  buildMusicDramaScenePlan,
  computeMusicDramaScenePlanFingerprint,
} from "./music-drama-scene-plan.ts";

export const MUSIC_DRAMA_SCENE_PLAN_INPUT_EXAMPLE = MUSIC_TIMING_CONTRACT_OUTPUT_EXAMPLE;

export const MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE = buildMusicDramaScenePlan(
  MUSIC_DRAMA_SCENE_PLAN_INPUT_EXAMPLE
);

export const MUSIC_DRAMA_SCENE_PLAN_FINGERPRINT = computeMusicDramaScenePlanFingerprint(
  MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE
);

export const MUSIC_DRAMA_SCENE_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  startSeconds: 0,
  endSeconds: 8,
  emotionalBeat: "nostalgic-calm",
  rhythmPhase: "rhythm-rise" as const,
  suggestedMusicEnergy: "low" as const,
  suggestedCutPressure: "soft" as const,
  dramaFunction: "frame-establish" as const,
});

export const MUSIC_DRAMA_TRANSITION_OUTPUT_EXAMPLE = Object.freeze({
  transitionIndex: 0,
  fromQueueOrder: 0,
  toQueueOrder: 1,
  rhythmShift: "nostalgic-calm|reflective-bridge",
});

export const MUSIC_DRAMA_SCENE_PLAN_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  scenePlanId: "music-drama-scene-plan-gonegi-harbor-25s-v1",
  scenePlanVersion: "music-drama-scene-plan-v1" as const,
  activeScenePlanState: "25s-music-drama-scene-plan-metadata-only",
});
