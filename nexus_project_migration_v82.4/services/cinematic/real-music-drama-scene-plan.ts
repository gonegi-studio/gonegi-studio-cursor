import crypto from "crypto";
import type { RealVisualRhythmPhase } from "./real-visual-rhythm-map.ts";
import type {
  RealMusicSyncContract,
  RealMusicSyncCue,
  RealMusicSyncTransition,
  RealSuggestedBeatDensity,
  RealSuggestedMusicEnergy,
} from "./real-music-sync-contract.ts";
import {
  REAL_MUSIC_SYNC_CONTRACT_CUE_COUNT,
  REAL_MUSIC_SYNC_CONTRACT_TRANSITION_COUNT,
  computeRealMusicSyncContractFingerprint,
} from "./real-music-sync-contract.ts";
import type { RealVisualDnaCinematicRole } from "./real-visual-dna-grammar-binding.ts";
import { REAL_VISUAL_DNA_GRAMMAR_ROLE_PROFILES } from "./real-visual-dna-grammar-binding.ts";

export type RealMusicDramaFunction =
  | "real-frame-establish"
  | "real-frame-bridge"
  | "real-frame-resolve";

export type RealMusicDramaScenePlanStatus = "plan-complete" | "plan-blocked" | "plan-mismatch";

export type RealMusicDramaScene = {
  sceneId: string;
  queueOrder: number;
  timestampSeconds: string;
  cinematicRole: RealVisualDnaCinematicRole;
  emotionTone: RealMusicSyncCue["emotionTone"];
  rhythmPhase: RealVisualRhythmPhase;
  suggestedMusicEnergy: RealSuggestedMusicEnergy;
  suggestedBeatDensity: RealSuggestedBeatDensity;
  dramaFunction: RealMusicDramaFunction;
};

export type RealMusicDramaSceneTransition = {
  transitionId: string;
  fromQueueOrder: number;
  toQueueOrder: number;
  rhythmShift: string;
  suggestedTransitionCue: string;
};

export type RealMusicDramaScenePlan = {
  version: "v1";
  scenePlanId: string;
  musicSyncContractId: string;
  musicSyncContractFingerprint: string;
  scenePlanVersion: typeof REAL_MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION;
  activeScenePlanState: string;
  planStatus: RealMusicDramaScenePlanStatus;
  sceneCount: typeof REAL_MUSIC_DRAMA_SCENE_PLAN_SCENE_COUNT;
  transitionCount: typeof REAL_MUSIC_DRAMA_SCENE_PLAN_TRANSITION_COUNT;
  scenes: readonly RealMusicDramaScene[];
  transitions: readonly RealMusicDramaSceneTransition[];
  generationExecuted: false;
  audioAnalysisExecuted: false;
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_MUSIC_DRAMA_SCENE_PLAN_VERSION = "v1" as const;
export const REAL_MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION = "real-music-drama-scene-plan-v1" as const;
export const REAL_MUSIC_DRAMA_SCENE_PLAN_ROOT_ID =
  "real-music-drama-scene-plan-gonegi-harbor-25s-v1" as const;
export const REAL_MUSIC_DRAMA_SCENE_PLAN_STATE =
  "25s-real-music-drama-scene-plan-metadata-only" as const;
export const REAL_MUSIC_DRAMA_SCENE_PLAN_SCENE_COUNT = 3 as const;
export const REAL_MUSIC_DRAMA_SCENE_PLAN_TRANSITION_COUNT = 2 as const;

export const REAL_MUSIC_DRAMA_SCENE_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    cinematicRole: "opening" as const,
    rhythmPhase: "rhythm-rise" as const,
    dramaFunction: "real-frame-establish" as const,
  }),
  Object.freeze({
    queueOrder: 1,
    cinematicRole: "transition" as const,
    rhythmPhase: "rhythm-hold" as const,
    dramaFunction: "real-frame-bridge" as const,
  }),
  Object.freeze({
    queueOrder: 2,
    cinematicRole: "resolution" as const,
    rhythmPhase: "rhythm-release" as const,
    dramaFunction: "real-frame-resolve" as const,
  }),
] as const);

export const REAL_MUSIC_DRAMA_SCENE_PLAN_KEY_ORDER = Object.freeze([
  "version",
  "scenePlanId",
  "musicSyncContractId",
  "musicSyncContractFingerprint",
  "scenePlanVersion",
  "activeScenePlanState",
  "planStatus",
  "sceneCount",
  "transitionCount",
  "scenes",
  "transitions",
  "generationExecuted",
  "audioAnalysisExecuted",
  "inferenceExecuted",
  "providerCallExecuted",
] as const);

export const REAL_MUSIC_DRAMA_SCENE_KEY_ORDER = Object.freeze([
  "sceneId",
  "queueOrder",
  "timestampSeconds",
  "cinematicRole",
  "emotionTone",
  "rhythmPhase",
  "suggestedMusicEnergy",
  "suggestedBeatDensity",
  "dramaFunction",
] as const);

export const REAL_MUSIC_DRAMA_SCENE_TRANSITION_KEY_ORDER = Object.freeze([
  "transitionId",
  "fromQueueOrder",
  "toQueueOrder",
  "rhythmShift",
  "suggestedTransitionCue",
] as const);

let cachedRealMusicDramaScenePlan: RealMusicDramaScenePlan | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveSceneProfile(queueOrder: number) {
  const profile = REAL_MUSIC_DRAMA_SCENE_PROFILES.find((entry) => entry.queueOrder === queueOrder);
  if (profile === undefined) {
    throw new Error(`Unknown real music drama scene profile for queueOrder=${queueOrder}`);
  }
  return profile;
}

function resolveGrammarCinematicRole(queueOrder: number): RealVisualDnaCinematicRole {
  const profile = REAL_VISUAL_DNA_GRAMMAR_ROLE_PROFILES.find(
    (entry) => entry.queueOrder === queueOrder
  );
  if (profile === undefined) {
    throw new Error(`Unknown grammar role profile for queueOrder=${queueOrder}`);
  }
  return profile.cinematicRole;
}

function computeScenePlanId(
  musicSyncContractId: string,
  musicSyncContractFingerprint: string
): string {
  return digestValue(
    [
      REAL_MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION,
      "scene-plan",
      musicSyncContractId,
      musicSyncContractFingerprint,
    ].join("|")
  );
}

function computeSceneId(queueOrder: number, cueId: string, dramaFunction: RealMusicDramaFunction): string {
  return digestValue(
    [
      REAL_MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION,
      "drama-scene",
      String(queueOrder),
      cueId,
      dramaFunction,
    ].join("|")
  );
}

function computeSceneTransitionId(
  fromQueueOrder: number,
  toQueueOrder: number,
  fromSceneId: string,
  toSceneId: string
): string {
  return digestValue(
    [
      REAL_MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION,
      "drama-scene-transition",
      String(fromQueueOrder),
      String(toQueueOrder),
      fromSceneId,
      toSceneId,
    ].join("|")
  );
}

function resolvePlanBlockedReason(contract: RealMusicSyncContract): string | null {
  if (contract.syncStatus !== "sync-complete") {
    return "music-sync-not-complete";
  }
  if (contract.cues.length !== REAL_MUSIC_DRAMA_SCENE_PLAN_SCENE_COUNT) {
    return "cue-count-mismatch";
  }
  if (contract.transitions.length !== REAL_MUSIC_DRAMA_SCENE_PLAN_TRANSITION_COUNT) {
    return "transition-count-mismatch";
  }
  return null;
}

function buildDramaScene(cue: RealMusicSyncCue): RealMusicDramaScene {
  const profile = resolveSceneProfile(cue.queueOrder);
  const cinematicRole = resolveGrammarCinematicRole(cue.queueOrder);

  return Object.freeze({
    sceneId: computeSceneId(cue.queueOrder, cue.cueId, profile.dramaFunction),
    queueOrder: cue.queueOrder,
    timestampSeconds: cue.timestampSeconds,
    cinematicRole,
    emotionTone: cue.emotionTone,
    rhythmPhase: cue.rhythmPhase,
    suggestedMusicEnergy: cue.suggestedMusicEnergy,
    suggestedBeatDensity: cue.suggestedBeatDensity,
    dramaFunction: profile.dramaFunction,
  });
}

function buildDramaSceneTransition(
  syncTransition: RealMusicSyncTransition,
  fromScene: RealMusicDramaScene,
  toScene: RealMusicDramaScene
): RealMusicDramaSceneTransition {
  return Object.freeze({
    transitionId: computeSceneTransitionId(
      syncTransition.fromQueueOrder,
      syncTransition.toQueueOrder,
      fromScene.sceneId,
      toScene.sceneId
    ),
    fromQueueOrder: syncTransition.fromQueueOrder,
    toQueueOrder: syncTransition.toQueueOrder,
    rhythmShift: syncTransition.rhythmShift,
    suggestedTransitionCue: syncTransition.suggestedTransitionCue,
  });
}

function resolvePlanStatus(
  planBlocked: boolean,
  scenes: readonly RealMusicDramaScene[],
  transitions: readonly RealMusicDramaSceneTransition[]
): RealMusicDramaScenePlanStatus {
  if (planBlocked) {
    return "plan-blocked";
  }

  const queueOrderValid = scenes.every((scene, index) => scene.queueOrder === index);
  const mappingValid = scenes.every((scene) => {
    const profile = resolveSceneProfile(scene.queueOrder);
    return (
      scene.cinematicRole === profile.cinematicRole &&
      scene.rhythmPhase === profile.rhythmPhase &&
      scene.dramaFunction === profile.dramaFunction
    );
  });
  const transitionCountValid =
    transitions.length === REAL_MUSIC_DRAMA_SCENE_PLAN_TRANSITION_COUNT;

  if (
    !queueOrderValid ||
    !mappingValid ||
    !transitionCountValid ||
    scenes.length !== REAL_MUSIC_DRAMA_SCENE_PLAN_SCENE_COUNT
  ) {
    return "plan-mismatch";
  }

  return "plan-complete";
}

function buildRealMusicDramaScenePlanInternal(
  realMusicSyncContract: RealMusicSyncContract
): RealMusicDramaScenePlan {
  const planBlockedReason = resolvePlanBlockedReason(realMusicSyncContract);
  const planBlocked = planBlockedReason !== null;

  const scenes = Object.freeze(
    planBlocked
      ? ([] as RealMusicDramaScene[])
      : [...realMusicSyncContract.cues]
          .sort((a, b) => a.queueOrder - b.queueOrder)
          .map((cue) => buildDramaScene(cue))
  );

  const sceneByQueue = new Map(scenes.map((scene) => [scene.queueOrder, scene] as const));
  const transitions = Object.freeze(
    planBlocked
      ? ([] as RealMusicDramaSceneTransition[])
      : realMusicSyncContract.transitions
          .map((syncTransition) => {
            const fromScene = sceneByQueue.get(syncTransition.fromQueueOrder);
            const toScene = sceneByQueue.get(syncTransition.toQueueOrder);
            if (fromScene === undefined || toScene === undefined) {
              return null;
            }
            return buildDramaSceneTransition(syncTransition, fromScene, toScene);
          })
          .filter(
            (transition): transition is RealMusicDramaSceneTransition => transition !== null
          )
  );

  const musicSyncContractFingerprint =
    computeRealMusicSyncContractFingerprint(realMusicSyncContract);

  return Object.freeze({
    version: REAL_MUSIC_DRAMA_SCENE_PLAN_VERSION,
    scenePlanId: computeScenePlanId(
      realMusicSyncContract.musicSyncContractId,
      musicSyncContractFingerprint
    ),
    musicSyncContractId: realMusicSyncContract.musicSyncContractId,
    musicSyncContractFingerprint,
    scenePlanVersion: REAL_MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION,
    activeScenePlanState: REAL_MUSIC_DRAMA_SCENE_PLAN_STATE,
    planStatus: resolvePlanStatus(planBlocked, scenes, transitions),
    sceneCount: REAL_MUSIC_DRAMA_SCENE_PLAN_SCENE_COUNT,
    transitionCount: REAL_MUSIC_DRAMA_SCENE_PLAN_TRANSITION_COUNT,
    scenes,
    transitions,
    generationExecuted: false,
    audioAnalysisExecuted: false,
    inferenceExecuted: false,
    providerCallExecuted: false,
  });
}

export function buildRealMusicDramaScenePlan(
  realMusicSyncContract: RealMusicSyncContract
): RealMusicDramaScenePlan {
  if (cachedRealMusicDramaScenePlan !== null) {
    return cachedRealMusicDramaScenePlan;
  }

  const scenePlan = buildRealMusicDramaScenePlanInternal(realMusicSyncContract);
  cachedRealMusicDramaScenePlan = scenePlan;
  return scenePlan;
}

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeRealMusicDramaScenePlan(scenePlan: RealMusicDramaScenePlan): string {
  const orderedScenes = [...scenePlan.scenes]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((scene) => orderRecord(scene, REAL_MUSIC_DRAMA_SCENE_KEY_ORDER));

  const orderedTransitions = [...scenePlan.transitions]
    .sort((a, b) => a.fromQueueOrder - b.fromQueueOrder)
    .map((transition) => orderRecord(transition, REAL_MUSIC_DRAMA_SCENE_TRANSITION_KEY_ORDER));

  const orderedScenePlan: Record<string, unknown> = {};
  for (const key of REAL_MUSIC_DRAMA_SCENE_PLAN_KEY_ORDER) {
    if (key === "scenes") {
      orderedScenePlan.scenes = orderedScenes;
    } else if (key === "transitions") {
      orderedScenePlan.transitions = orderedTransitions;
    } else {
      orderedScenePlan[key] = scenePlan[key as keyof RealMusicDramaScenePlan];
    }
  }

  return JSON.stringify(orderedScenePlan);
}

export function computeRealMusicDramaScenePlanFingerprint(
  scenePlan: RealMusicDramaScenePlan
): string {
  return digestValue(serializeRealMusicDramaScenePlan(scenePlan));
}

export function resetRealMusicDramaScenePlanCacheForVerification(): void {
  cachedRealMusicDramaScenePlan = null;
}

export function resolveRealMusicDramaFunctionForScene(
  cinematicRole: RealVisualDnaCinematicRole,
  rhythmPhase: RealVisualRhythmPhase
): RealMusicDramaFunction | null {
  const profile = REAL_MUSIC_DRAMA_SCENE_PROFILES.find(
    (entry) => entry.cinematicRole === cinematicRole && entry.rhythmPhase === rhythmPhase
  );
  return profile?.dramaFunction ?? null;
}
