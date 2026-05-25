import crypto from "crypto";
import type { EmotionalRhythmPhase } from "./emotional-rhythm-map.ts";
import type {
  MusicCutPressure,
  MusicTimingContract,
  MusicTimingCue,
  MusicTimingTransition,
} from "./music-timing-contract.ts";
import { computeMusicTimingContractFingerprint } from "./music-timing-contract.ts";
import type { MusicEnergy } from "./sequence-composer.ts";

export type MusicDramaFunction =
  | "frame-establish"
  | "frame-bridge"
  | "frame-resolve"
  | "segment-establish"
  | "segment-bridge"
  | "segment-resolve";

export type MusicDramaScene = {
  sceneId: string;
  queueOrder: number;
  segmentId: string;
  startSeconds: number;
  endSeconds: number;
  emotionalBeat: string;
  rhythmPhase: EmotionalRhythmPhase;
  suggestedMusicEnergy: MusicEnergy;
  suggestedCutPressure: MusicCutPressure;
  dramaFunction: MusicDramaFunction;
  sceneFingerprint: string;
};

export type MusicDramaTransition = {
  transitionId: string;
  transitionIndex: number;
  fromQueueOrder: number;
  toQueueOrder: number;
  fromSceneId: string;
  toSceneId: string;
  rhythmShift: string;
  transitionFingerprint: string;
};

export type MusicDramaScenePlan = {
  version: "v1";
  scenePlanId: string;
  contractId: string;
  musicTimingContractFingerprint: string;
  sourceFingerprint: string;
  scenePlanVersion: typeof MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION;
  activeScenePlanState: string;
  scenes: readonly MusicDramaScene[];
  transitions: readonly MusicDramaTransition[];
};

export const MUSIC_DRAMA_SCENE_PLAN_VERSION = "v1" as const;
export const MUSIC_DRAMA_SCENE_PLAN_ID = "music-drama-scene-plan-gonegi-harbor-25s-v1" as const;
export const MUSIC_DRAMA_SCENE_PLAN_STATE = "25s-music-drama-scene-plan-metadata-only" as const;
export const MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION = "music-drama-scene-plan-v1" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

const DRAMA_FUNCTION_BY_RHYTHM_PHASE: Readonly<
  Record<EmotionalRhythmPhase, "establish" | "bridge" | "resolve">
> = Object.freeze({
  "rhythm-rise": "establish",
  "rhythm-hold": "bridge",
  "rhythm-release": "resolve",
});

let cachedMusicDramaScenePlan: MusicDramaScenePlan | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveDramaFunction(cue: MusicTimingCue): MusicDramaFunction {
  const exportKind = cue.queueOrder <= FRAME_EXPORT_QUEUE_MAX ? "frame" : "segment";
  const phaseKind = DRAMA_FUNCTION_BY_RHYTHM_PHASE[cue.rhythmPhase];
  return `${exportKind}-${phaseKind}` as MusicDramaFunction;
}

function computeMusicDramaSceneId(queueOrder: number, cueId: string): string {
  return digestValue(
    [MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION, "drama-scene", String(queueOrder), cueId].join("|")
  );
}

function computeMusicDramaTransitionId(
  transitionIndex: number,
  fromSceneId: string,
  toSceneId: string
): string {
  return digestValue(
    [
      MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION,
      "drama-transition",
      String(transitionIndex),
      fromSceneId,
      toSceneId,
    ].join("|")
  );
}

function computeMusicDramaSceneFingerprint(
  scene: Omit<MusicDramaScene, "sceneFingerprint">
): string {
  return digestValue(
    [
      MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION,
      scene.sceneId,
      String(scene.queueOrder),
      scene.segmentId,
      String(scene.startSeconds),
      String(scene.endSeconds),
      scene.emotionalBeat,
      scene.rhythmPhase,
      scene.suggestedMusicEnergy,
      scene.suggestedCutPressure,
      scene.dramaFunction,
    ].join("|")
  );
}

function computeMusicDramaTransitionFingerprint(
  transition: Omit<MusicDramaTransition, "transitionFingerprint">
): string {
  return digestValue(
    [
      MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION,
      transition.transitionId,
      String(transition.transitionIndex),
      String(transition.fromQueueOrder),
      String(transition.toQueueOrder),
      transition.fromSceneId,
      transition.toSceneId,
      transition.rhythmShift,
    ].join("|")
  );
}

function buildMusicDramaScene(cue: MusicTimingCue): MusicDramaScene {
  const sceneId = computeMusicDramaSceneId(cue.queueOrder, cue.cueId);
  const baseScene: Omit<MusicDramaScene, "sceneFingerprint"> = {
    sceneId,
    queueOrder: cue.queueOrder,
    segmentId: cue.segmentId,
    startSeconds: cue.startSeconds,
    endSeconds: cue.endSeconds,
    emotionalBeat: cue.emotionalBeat,
    rhythmPhase: cue.rhythmPhase,
    suggestedMusicEnergy: cue.suggestedMusicEnergy,
    suggestedCutPressure: cue.suggestedCutPressure,
    dramaFunction: resolveDramaFunction(cue),
  };

  return Object.freeze({
    ...baseScene,
    sceneFingerprint: computeMusicDramaSceneFingerprint(baseScene),
  });
}

function buildMusicDramaTransition(
  timingTransition: MusicTimingTransition,
  fromScene: MusicDramaScene,
  toScene: MusicDramaScene
): MusicDramaTransition {
  const transitionId = computeMusicDramaTransitionId(
    timingTransition.transitionIndex,
    fromScene.sceneId,
    toScene.sceneId
  );
  const baseTransition: Omit<MusicDramaTransition, "transitionFingerprint"> = {
    transitionId,
    transitionIndex: timingTransition.transitionIndex,
    fromQueueOrder: timingTransition.fromQueueOrder,
    toQueueOrder: timingTransition.toQueueOrder,
    fromSceneId: fromScene.sceneId,
    toSceneId: toScene.sceneId,
    rhythmShift: timingTransition.rhythmShift,
  };

  return Object.freeze({
    ...baseTransition,
    transitionFingerprint: computeMusicDramaTransitionFingerprint(baseTransition),
  });
}

export function buildMusicDramaScenePlan(
  musicTimingContract: MusicTimingContract
): MusicDramaScenePlan {
  if (cachedMusicDramaScenePlan !== null) {
    return cachedMusicDramaScenePlan;
  }

  const musicTimingContractFingerprint = computeMusicTimingContractFingerprint(musicTimingContract);
  const orderedCues = [...musicTimingContract.cues].sort((a, b) => a.queueOrder - b.queueOrder);

  const scenes = Object.freeze(orderedCues.map((cue) => buildMusicDramaScene(cue)));
  const sceneByQueueOrder = new Map(scenes.map((scene) => [scene.queueOrder, scene]));

  const transitions = Object.freeze(
    musicTimingContract.transitions.map((timingTransition) => {
      const fromScene = sceneByQueueOrder.get(timingTransition.fromQueueOrder);
      const toScene = sceneByQueueOrder.get(timingTransition.toQueueOrder);
      if (fromScene === undefined || toScene === undefined) {
        throw new Error("Music drama transition requires resolved source and target scenes");
      }
      return buildMusicDramaTransition(timingTransition, fromScene, toScene);
    })
  );

  const scenePlan = Object.freeze({
    version: MUSIC_DRAMA_SCENE_PLAN_VERSION,
    scenePlanId: MUSIC_DRAMA_SCENE_PLAN_ID,
    contractId: musicTimingContract.contractId,
    musicTimingContractFingerprint,
    sourceFingerprint: musicTimingContract.sourceFingerprint,
    scenePlanVersion: MUSIC_DRAMA_SCENE_PLAN_KIND_VERSION,
    activeScenePlanState: MUSIC_DRAMA_SCENE_PLAN_STATE,
    scenes,
    transitions,
  });

  cachedMusicDramaScenePlan = scenePlan;
  return scenePlan;
}

export const MUSIC_DRAMA_SCENE_KEY_ORDER = Object.freeze([
  "sceneId",
  "queueOrder",
  "segmentId",
  "startSeconds",
  "endSeconds",
  "emotionalBeat",
  "rhythmPhase",
  "suggestedMusicEnergy",
  "suggestedCutPressure",
  "dramaFunction",
  "sceneFingerprint",
] as const);

export const MUSIC_DRAMA_TRANSITION_KEY_ORDER = Object.freeze([
  "transitionId",
  "transitionIndex",
  "fromQueueOrder",
  "toQueueOrder",
  "fromSceneId",
  "toSceneId",
  "rhythmShift",
  "transitionFingerprint",
] as const);

export const MUSIC_DRAMA_SCENE_PLAN_KEY_ORDER = Object.freeze([
  "version",
  "scenePlanId",
  "contractId",
  "musicTimingContractFingerprint",
  "sourceFingerprint",
  "scenePlanVersion",
  "activeScenePlanState",
  "scenes",
  "transitions",
] as const);

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

export function serializeMusicDramaScenePlan(scenePlan: MusicDramaScenePlan): string {
  const orderedScenes = [...scenePlan.scenes]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((scene) => orderRecord(scene, MUSIC_DRAMA_SCENE_KEY_ORDER));

  const orderedTransitions = [...scenePlan.transitions]
    .sort((a, b) => a.transitionIndex - b.transitionIndex)
    .map((transition) => orderRecord(transition, MUSIC_DRAMA_TRANSITION_KEY_ORDER));

  const orderedScenePlan: Record<string, unknown> = {};
  for (const key of MUSIC_DRAMA_SCENE_PLAN_KEY_ORDER) {
    if (key === "scenes") {
      orderedScenePlan.scenes = orderedScenes;
    } else if (key === "transitions") {
      orderedScenePlan.transitions = orderedTransitions;
    } else {
      orderedScenePlan[key] = scenePlan[key as keyof MusicDramaScenePlan];
    }
  }

  return JSON.stringify(orderedScenePlan);
}

export function computeMusicDramaScenePlanFingerprint(scenePlan: MusicDramaScenePlan): string {
  return digestValue(serializeMusicDramaScenePlan(scenePlan));
}

export function resetMusicDramaScenePlanCacheForVerification(): void {
  cachedMusicDramaScenePlan = null;
}
