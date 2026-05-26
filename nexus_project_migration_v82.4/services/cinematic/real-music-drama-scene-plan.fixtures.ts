import { REAL_MUSIC_SYNC_CONTRACT_OUTPUT_EXAMPLE } from "./real-music-sync-contract.fixtures.ts";
import {
  buildRealMusicDramaScenePlan,
  computeRealMusicDramaScenePlanFingerprint,
} from "./real-music-drama-scene-plan.ts";

export const REAL_MUSIC_DRAMA_SCENE_PLAN_INPUT_EXAMPLE = Object.freeze({
  realMusicSyncContract: REAL_MUSIC_SYNC_CONTRACT_OUTPUT_EXAMPLE,
});

export const REAL_MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE = buildRealMusicDramaScenePlan(
  REAL_MUSIC_DRAMA_SCENE_PLAN_INPUT_EXAMPLE.realMusicSyncContract
);

export const REAL_MUSIC_DRAMA_SCENE_PLAN_FINGERPRINT = computeRealMusicDramaScenePlanFingerprint(
  REAL_MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE
);

export const REAL_MUSIC_DRAMA_SCENE_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  timestampSeconds: "4.000",
  cinematicRole: "opening" as const,
  rhythmPhase: "rhythm-rise" as const,
  dramaFunction: "real-frame-establish" as const,
});

export const REAL_MUSIC_DRAMA_SCENE_TRANSITION_OUTPUT_EXAMPLE = Object.freeze({
  fromQueueOrder: 0,
  toQueueOrder: 1,
  rhythmShift: "rhythm-rise|rhythm-hold",
  suggestedTransitionCue: "gentle-build-to-steady-flow",
});

export const REAL_MUSIC_DRAMA_SCENE_PLAN_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  scenePlanId: REAL_MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE.scenePlanId,
  scenePlanVersion: "real-music-drama-scene-plan-v1" as const,
  activeScenePlanState: "25s-real-music-drama-scene-plan-metadata-only",
  planStatus: REAL_MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE.planStatus,
  sceneCount: 3,
  transitionCount: 2,
});
