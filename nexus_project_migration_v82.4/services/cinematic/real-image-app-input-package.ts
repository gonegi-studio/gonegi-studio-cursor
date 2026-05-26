import crypto from "crypto";
import type { RealFrameEvidenceRegistry } from "./real-frame-evidence-registry.ts";
import {
  REAL_FRAME_EVIDENCE_REGISTRY_MAX_FRAME_COUNT,
  computeRealFrameEvidenceRegistryFingerprint,
} from "./real-frame-evidence-registry.ts";
import type {
  RealMusicDramaFunction,
  RealMusicDramaScene,
  RealMusicDramaScenePlan,
} from "./real-music-drama-scene-plan.ts";
import {
  REAL_MUSIC_DRAMA_SCENE_PLAN_SCENE_COUNT,
  computeRealMusicDramaScenePlanFingerprint,
} from "./real-music-drama-scene-plan.ts";
import type { RealSuggestedMusicEnergy } from "./real-music-sync-contract.ts";
import type { RealVisualRhythmPhase } from "./real-visual-rhythm-map.ts";

export type RealImageAppInputPackageStatus =
  | "package-complete"
  | "package-blocked"
  | "package-mismatch";

export type RealImageAppInputPackageItem = {
  queueOrder: number;
  timestampSeconds: string;
  frameEvidenceId: string;
  frameFingerprint: string;
  sceneId: string;
  dramaFunction: RealMusicDramaFunction;
  emotionTone: RealMusicDramaScene["emotionTone"];
  rhythmPhase: RealVisualRhythmPhase;
  suggestedMusicEnergy: RealSuggestedMusicEnergy;
  imageAppInputJson: string;
};

export type RealImageAppInputPackage = {
  version: "v1";
  realInputPackageId: string;
  scenePlanId: string;
  scenePlanFingerprint: string;
  frameEvidenceRegistryId: string;
  frameEvidenceRegistryFingerprint: string;
  packageVersion: typeof REAL_IMAGE_APP_INPUT_PACKAGE_KIND_VERSION;
  activePackageState: string;
  packageStatus: RealImageAppInputPackageStatus;
  itemCount: typeof REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT;
  items: readonly RealImageAppInputPackageItem[];
  generationExecuted: false;
  providerCallExecuted: false;
};

export const REAL_IMAGE_APP_INPUT_PACKAGE_VERSION = "v1" as const;
export const REAL_IMAGE_APP_INPUT_PACKAGE_KIND_VERSION =
  "real-image-app-input-package-v1" as const;
export const REAL_IMAGE_APP_INPUT_PACKAGE_ROOT_ID =
  "real-image-app-input-package-gonegi-harbor-25s-v1" as const;
export const REAL_IMAGE_APP_INPUT_PACKAGE_STATE =
  "25s-real-image-app-input-package-metadata-only" as const;
export const REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT = 3 as const;
export const REAL_IMAGE_APP_INPUT_PACKAGE_FRAME_QUEUE_MAX = 2 as const;

export const REAL_IMAGE_APP_INPUT_PACKAGE_KEY_ORDER = Object.freeze([
  "version",
  "realInputPackageId",
  "scenePlanId",
  "scenePlanFingerprint",
  "frameEvidenceRegistryId",
  "frameEvidenceRegistryFingerprint",
  "packageVersion",
  "activePackageState",
  "packageStatus",
  "itemCount",
  "items",
  "generationExecuted",
  "providerCallExecuted",
] as const);

export const REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_KEY_ORDER = Object.freeze([
  "queueOrder",
  "timestampSeconds",
  "frameEvidenceId",
  "frameFingerprint",
  "sceneId",
  "dramaFunction",
  "emotionTone",
  "rhythmPhase",
  "suggestedMusicEnergy",
  "imageAppInputJson",
] as const);

const REAL_IMAGE_APP_INPUT_JSON_KEY_ORDER = Object.freeze([
  "version",
  "inputKind",
  "queueOrder",
  "timestampSeconds",
  "frameEvidenceId",
  "frameFingerprint",
  "sceneId",
  "dramaFunction",
  "emotionTone",
  "rhythmPhase",
  "suggestedMusicEnergy",
] as const);

let cachedRealImageAppInputPackage: RealImageAppInputPackage | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
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

function computeRealInputPackageId(
  scenePlanId: string,
  scenePlanFingerprint: string,
  frameEvidenceRegistryId: string,
  frameEvidenceRegistryFingerprint: string
): string {
  return digestValue(
    [
      REAL_IMAGE_APP_INPUT_PACKAGE_KIND_VERSION,
      "real-input-package",
      scenePlanId,
      scenePlanFingerprint,
      frameEvidenceRegistryId,
      frameEvidenceRegistryFingerprint,
    ].join("|")
  );
}

function buildRealImageAppInputJson(
  item: Omit<RealImageAppInputPackageItem, "imageAppInputJson">
): string {
  const orderedInput: Record<string, unknown> = {};
  const values: Record<(typeof REAL_IMAGE_APP_INPUT_JSON_KEY_ORDER)[number], unknown> = {
    version: REAL_IMAGE_APP_INPUT_PACKAGE_VERSION,
    inputKind: "real-frame",
    queueOrder: item.queueOrder,
    timestampSeconds: item.timestampSeconds,
    frameEvidenceId: item.frameEvidenceId,
    frameFingerprint: item.frameFingerprint,
    sceneId: item.sceneId,
    dramaFunction: item.dramaFunction,
    emotionTone: item.emotionTone,
    rhythmPhase: item.rhythmPhase,
    suggestedMusicEnergy: item.suggestedMusicEnergy,
  };

  for (const key of REAL_IMAGE_APP_INPUT_JSON_KEY_ORDER) {
    orderedInput[key] = values[key];
  }

  return JSON.stringify(orderedInput);
}

function resolvePackageBlockedReason(
  scenePlan: RealMusicDramaScenePlan,
  frameEvidenceRegistry: RealFrameEvidenceRegistry
): string | null {
  if (scenePlan.planStatus !== "plan-complete") {
    return "scene-plan-not-complete";
  }
  if (frameEvidenceRegistry.registryStatus !== "registry-complete") {
    return "frame-evidence-registry-not-complete";
  }
  if (scenePlan.scenes.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    return "scene-count-mismatch";
  }
  if (frameEvidenceRegistry.items.length !== REAL_FRAME_EVIDENCE_REGISTRY_MAX_FRAME_COUNT) {
    return "frame-count-mismatch";
  }
  return null;
}

function buildRealImageAppInputPackageItem(
  scene: RealMusicDramaScene,
  frameEvidenceItem: RealFrameEvidenceRegistry["items"][number]
): RealImageAppInputPackageItem {
  const baseItem: Omit<RealImageAppInputPackageItem, "imageAppInputJson"> = {
    queueOrder: scene.queueOrder,
    timestampSeconds: scene.timestampSeconds,
    frameEvidenceId: frameEvidenceItem.frameEvidenceId,
    frameFingerprint: frameEvidenceItem.frameFingerprint,
    sceneId: scene.sceneId,
    dramaFunction: scene.dramaFunction,
    emotionTone: scene.emotionTone,
    rhythmPhase: scene.rhythmPhase,
    suggestedMusicEnergy: scene.suggestedMusicEnergy,
  };

  return Object.freeze({
    ...baseItem,
    imageAppInputJson: buildRealImageAppInputJson(baseItem),
  });
}

function resolvePackageStatus(
  packageBlocked: boolean,
  items: readonly RealImageAppInputPackageItem[]
): RealImageAppInputPackageStatus {
  if (packageBlocked) {
    return "package-blocked";
  }

  const queueOrderValid = items.every((item, index) => item.queueOrder === index);
  const linkageValid = items.every(
    (item) =>
      item.timestampSeconds.length > 0 &&
      item.frameEvidenceId.length === 64 &&
      item.frameFingerprint.length === 64 &&
      item.sceneId.length === 64 &&
      item.imageAppInputJson.length > 0
  );

  if (
    !queueOrderValid ||
    !linkageValid ||
    items.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT
  ) {
    return "package-mismatch";
  }

  return "package-complete";
}

function buildRealImageAppInputPackageInternal(
  realMusicDramaScenePlan: RealMusicDramaScenePlan,
  realFrameEvidenceRegistry: RealFrameEvidenceRegistry
): RealImageAppInputPackage {
  const packageBlockedReason = resolvePackageBlockedReason(
    realMusicDramaScenePlan,
    realFrameEvidenceRegistry
  );
  const packageBlocked = packageBlockedReason !== null;

  const sceneByQueue = new Map(
    realMusicDramaScenePlan.scenes.map((scene) => [scene.queueOrder, scene] as const)
  );
  const frameByQueue = new Map(
    realFrameEvidenceRegistry.items.map((item) => [item.queueOrder, item] as const)
  );

  const items = Object.freeze(
    packageBlocked
      ? ([] as RealImageAppInputPackageItem[])
      : Array.from({ length: REAL_IMAGE_APP_INPUT_PACKAGE_FRAME_QUEUE_MAX + 1 }, (_, queueOrder) => {
          const scene = sceneByQueue.get(queueOrder);
          const frameEvidenceItem = frameByQueue.get(queueOrder);
          if (scene === undefined || frameEvidenceItem === undefined) {
            return null;
          }
          return buildRealImageAppInputPackageItem(scene, frameEvidenceItem);
        }).filter((item): item is RealImageAppInputPackageItem => item !== null)
  );

  const scenePlanFingerprint = computeRealMusicDramaScenePlanFingerprint(realMusicDramaScenePlan);
  const frameEvidenceRegistryFingerprint =
    computeRealFrameEvidenceRegistryFingerprint(realFrameEvidenceRegistry);

  return Object.freeze({
    version: REAL_IMAGE_APP_INPUT_PACKAGE_VERSION,
    realInputPackageId: computeRealInputPackageId(
      realMusicDramaScenePlan.scenePlanId,
      scenePlanFingerprint,
      realFrameEvidenceRegistry.registryId,
      frameEvidenceRegistryFingerprint
    ),
    scenePlanId: realMusicDramaScenePlan.scenePlanId,
    scenePlanFingerprint,
    frameEvidenceRegistryId: realFrameEvidenceRegistry.registryId,
    frameEvidenceRegistryFingerprint,
    packageVersion: REAL_IMAGE_APP_INPUT_PACKAGE_KIND_VERSION,
    activePackageState: REAL_IMAGE_APP_INPUT_PACKAGE_STATE,
    packageStatus: resolvePackageStatus(packageBlocked, items),
    itemCount: REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT,
    items,
    generationExecuted: false,
    providerCallExecuted: false,
  });
}

export function buildRealImageAppInputPackage(
  realMusicDramaScenePlan: RealMusicDramaScenePlan,
  realFrameEvidenceRegistry: RealFrameEvidenceRegistry
): RealImageAppInputPackage {
  if (cachedRealImageAppInputPackage !== null) {
    return cachedRealImageAppInputPackage;
  }

  const inputPackage = buildRealImageAppInputPackageInternal(
    realMusicDramaScenePlan,
    realFrameEvidenceRegistry
  );
  cachedRealImageAppInputPackage = inputPackage;
  return inputPackage;
}

export function serializeRealImageAppInputPackage(
  inputPackage: RealImageAppInputPackage
): string {
  const orderedItems = [...inputPackage.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_KEY_ORDER));

  const orderedPackage: Record<string, unknown> = {};
  for (const key of REAL_IMAGE_APP_INPUT_PACKAGE_KEY_ORDER) {
    if (key === "items") {
      orderedPackage.items = orderedItems;
    } else {
      orderedPackage[key] = inputPackage[key as keyof RealImageAppInputPackage];
    }
  }

  return JSON.stringify(orderedPackage);
}

export function computeRealImageAppInputPackageFingerprint(
  inputPackage: RealImageAppInputPackage
): string {
  return digestValue(serializeRealImageAppInputPackage(inputPackage));
}

export function resetRealImageAppInputPackageCacheForVerification(): void {
  cachedRealImageAppInputPackage = null;
}
