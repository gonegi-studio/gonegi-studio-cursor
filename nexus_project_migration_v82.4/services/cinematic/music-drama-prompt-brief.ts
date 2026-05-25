import crypto from "crypto";
import type { EmotionalRhythmPhase } from "./emotional-rhythm-map.ts";
import type { MusicCutPressure } from "./music-timing-contract.ts";
import type {
  MusicDramaFunction,
  MusicDramaScene,
  MusicDramaScenePlan,
  MusicDramaTransition,
} from "./music-drama-scene-plan.ts";
import { computeMusicDramaScenePlanFingerprint } from "./music-drama-scene-plan.ts";
import type { MusicEnergy } from "./sequence-composer.ts";

export type MusicDramaPromptBriefItem = {
  briefId: string;
  queueOrder: number;
  segmentId: string;
  dramaFunction: MusicDramaFunction;
  emotionalBeat: string;
  rhythmPhase: EmotionalRhythmPhase;
  suggestedMusicEnergy: MusicEnergy;
  suggestedCutPressure: MusicCutPressure;
  promptIntent: string;
  continuityAnchor: string;
  briefFingerprint: string;
};

export type MusicDramaPromptTransitionBrief = {
  transitionBriefId: string;
  transitionIndex: number;
  fromQueueOrder: number;
  toQueueOrder: number;
  fromBriefId: string;
  toBriefId: string;
  rhythmShift: string;
  transitionBriefFingerprint: string;
};

export type MusicDramaPromptBrief = {
  version: "v1";
  promptBriefId: string;
  scenePlanId: string;
  musicDramaScenePlanFingerprint: string;
  sourceFingerprint: string;
  promptBriefVersion: typeof MUSIC_DRAMA_PROMPT_BRIEF_KIND_VERSION;
  activePromptBriefState: string;
  items: readonly MusicDramaPromptBriefItem[];
  transitions: readonly MusicDramaPromptTransitionBrief[];
};

export const MUSIC_DRAMA_PROMPT_BRIEF_VERSION = "v1" as const;
export const MUSIC_DRAMA_PROMPT_BRIEF_ID = "music-drama-prompt-brief-gonegi-harbor-25s-v1" as const;
export const MUSIC_DRAMA_PROMPT_BRIEF_STATE = "25s-music-drama-prompt-brief-metadata-only" as const;
export const MUSIC_DRAMA_PROMPT_BRIEF_KIND_VERSION = "music-drama-prompt-brief-v1" as const;

let cachedMusicDramaPromptBrief: MusicDramaPromptBrief | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolvePromptIntent(scene: MusicDramaScene): string {
  return [
    scene.dramaFunction,
    scene.emotionalBeat,
    scene.rhythmPhase,
    scene.suggestedMusicEnergy,
    scene.suggestedCutPressure,
  ].join("|");
}

function resolveContinuityAnchor(scene: MusicDramaScene): string {
  return `continuity-anchor-${scene.segmentId}`;
}

function computeMusicDramaPromptBriefItemId(queueOrder: number, sceneId: string): string {
  return digestValue(
    [MUSIC_DRAMA_PROMPT_BRIEF_KIND_VERSION, "prompt-brief-item", String(queueOrder), sceneId].join(
      "|"
    )
  );
}

function computeMusicDramaPromptTransitionBriefId(
  transitionIndex: number,
  fromBriefId: string,
  toBriefId: string
): string {
  return digestValue(
    [
      MUSIC_DRAMA_PROMPT_BRIEF_KIND_VERSION,
      "prompt-transition-brief",
      String(transitionIndex),
      fromBriefId,
      toBriefId,
    ].join("|")
  );
}

function computeMusicDramaPromptBriefItemFingerprint(
  item: Omit<MusicDramaPromptBriefItem, "briefFingerprint">
): string {
  return digestValue(
    [
      MUSIC_DRAMA_PROMPT_BRIEF_KIND_VERSION,
      item.briefId,
      String(item.queueOrder),
      item.segmentId,
      item.dramaFunction,
      item.emotionalBeat,
      item.rhythmPhase,
      item.suggestedMusicEnergy,
      item.suggestedCutPressure,
      item.promptIntent,
      item.continuityAnchor,
    ].join("|")
  );
}

function computeMusicDramaPromptTransitionBriefFingerprint(
  transition: Omit<MusicDramaPromptTransitionBrief, "transitionBriefFingerprint">
): string {
  return digestValue(
    [
      MUSIC_DRAMA_PROMPT_BRIEF_KIND_VERSION,
      transition.transitionBriefId,
      String(transition.transitionIndex),
      String(transition.fromQueueOrder),
      String(transition.toQueueOrder),
      transition.fromBriefId,
      transition.toBriefId,
      transition.rhythmShift,
    ].join("|")
  );
}

function buildMusicDramaPromptBriefItem(scene: MusicDramaScene): MusicDramaPromptBriefItem {
  const briefId = computeMusicDramaPromptBriefItemId(scene.queueOrder, scene.sceneId);
  const baseItem: Omit<MusicDramaPromptBriefItem, "briefFingerprint"> = {
    briefId,
    queueOrder: scene.queueOrder,
    segmentId: scene.segmentId,
    dramaFunction: scene.dramaFunction,
    emotionalBeat: scene.emotionalBeat,
    rhythmPhase: scene.rhythmPhase,
    suggestedMusicEnergy: scene.suggestedMusicEnergy,
    suggestedCutPressure: scene.suggestedCutPressure,
    promptIntent: resolvePromptIntent(scene),
    continuityAnchor: resolveContinuityAnchor(scene),
  };

  return Object.freeze({
    ...baseItem,
    briefFingerprint: computeMusicDramaPromptBriefItemFingerprint(baseItem),
  });
}

function buildMusicDramaPromptTransitionBrief(
  dramaTransition: MusicDramaTransition,
  fromItem: MusicDramaPromptBriefItem,
  toItem: MusicDramaPromptBriefItem
): MusicDramaPromptTransitionBrief {
  const transitionBriefId = computeMusicDramaPromptTransitionBriefId(
    dramaTransition.transitionIndex,
    fromItem.briefId,
    toItem.briefId
  );
  const baseTransition: Omit<MusicDramaPromptTransitionBrief, "transitionBriefFingerprint"> = {
    transitionBriefId,
    transitionIndex: dramaTransition.transitionIndex,
    fromQueueOrder: dramaTransition.fromQueueOrder,
    toQueueOrder: dramaTransition.toQueueOrder,
    fromBriefId: fromItem.briefId,
    toBriefId: toItem.briefId,
    rhythmShift: dramaTransition.rhythmShift,
  };

  return Object.freeze({
    ...baseTransition,
    transitionBriefFingerprint: computeMusicDramaPromptTransitionBriefFingerprint(baseTransition),
  });
}

export function buildMusicDramaPromptBrief(
  musicDramaScenePlan: MusicDramaScenePlan
): MusicDramaPromptBrief {
  if (cachedMusicDramaPromptBrief !== null) {
    return cachedMusicDramaPromptBrief;
  }

  const musicDramaScenePlanFingerprint = computeMusicDramaScenePlanFingerprint(musicDramaScenePlan);
  const orderedScenes = [...musicDramaScenePlan.scenes].sort((a, b) => a.queueOrder - b.queueOrder);

  const items = Object.freeze(orderedScenes.map((scene) => buildMusicDramaPromptBriefItem(scene)));
  const itemByQueueOrder = new Map(items.map((item) => [item.queueOrder, item]));

  const transitions = Object.freeze(
    musicDramaScenePlan.transitions.map((dramaTransition) => {
      const fromItem = itemByQueueOrder.get(dramaTransition.fromQueueOrder);
      const toItem = itemByQueueOrder.get(dramaTransition.toQueueOrder);
      if (fromItem === undefined || toItem === undefined) {
        throw new Error("Music drama prompt transition brief requires resolved source and target items");
      }
      return buildMusicDramaPromptTransitionBrief(dramaTransition, fromItem, toItem);
    })
  );

  const promptBrief = Object.freeze({
    version: MUSIC_DRAMA_PROMPT_BRIEF_VERSION,
    promptBriefId: MUSIC_DRAMA_PROMPT_BRIEF_ID,
    scenePlanId: musicDramaScenePlan.scenePlanId,
    musicDramaScenePlanFingerprint,
    sourceFingerprint: musicDramaScenePlan.sourceFingerprint,
    promptBriefVersion: MUSIC_DRAMA_PROMPT_BRIEF_KIND_VERSION,
    activePromptBriefState: MUSIC_DRAMA_PROMPT_BRIEF_STATE,
    items,
    transitions,
  });

  cachedMusicDramaPromptBrief = promptBrief;
  return promptBrief;
}

export const MUSIC_DRAMA_PROMPT_BRIEF_ITEM_KEY_ORDER = Object.freeze([
  "briefId",
  "queueOrder",
  "segmentId",
  "dramaFunction",
  "emotionalBeat",
  "rhythmPhase",
  "suggestedMusicEnergy",
  "suggestedCutPressure",
  "promptIntent",
  "continuityAnchor",
  "briefFingerprint",
] as const);

export const MUSIC_DRAMA_PROMPT_TRANSITION_BRIEF_KEY_ORDER = Object.freeze([
  "transitionBriefId",
  "transitionIndex",
  "fromQueueOrder",
  "toQueueOrder",
  "fromBriefId",
  "toBriefId",
  "rhythmShift",
  "transitionBriefFingerprint",
] as const);

export const MUSIC_DRAMA_PROMPT_BRIEF_KEY_ORDER = Object.freeze([
  "version",
  "promptBriefId",
  "scenePlanId",
  "musicDramaScenePlanFingerprint",
  "sourceFingerprint",
  "promptBriefVersion",
  "activePromptBriefState",
  "items",
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

export function serializeMusicDramaPromptBrief(promptBrief: MusicDramaPromptBrief): string {
  const orderedItems = [...promptBrief.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, MUSIC_DRAMA_PROMPT_BRIEF_ITEM_KEY_ORDER));

  const orderedTransitions = [...promptBrief.transitions]
    .sort((a, b) => a.transitionIndex - b.transitionIndex)
    .map((transition) => orderRecord(transition, MUSIC_DRAMA_PROMPT_TRANSITION_BRIEF_KEY_ORDER));

  const orderedPromptBrief: Record<string, unknown> = {};
  for (const key of MUSIC_DRAMA_PROMPT_BRIEF_KEY_ORDER) {
    if (key === "items") {
      orderedPromptBrief.items = orderedItems;
    } else if (key === "transitions") {
      orderedPromptBrief.transitions = orderedTransitions;
    } else {
      orderedPromptBrief[key] = promptBrief[key as keyof MusicDramaPromptBrief];
    }
  }

  return JSON.stringify(orderedPromptBrief);
}

export function computeMusicDramaPromptBriefFingerprint(
  promptBrief: MusicDramaPromptBrief
): string {
  return digestValue(serializeMusicDramaPromptBrief(promptBrief));
}

export function resetMusicDramaPromptBriefCacheForVerification(): void {
  cachedMusicDramaPromptBrief = null;
}
