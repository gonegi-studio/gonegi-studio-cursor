import crypto from "crypto";
import {
  REAL_VIDEO_INTAKE_DURATION_SECONDS,
  REAL_VIDEO_INTAKE_SOURCE_FILENAME,
  REAL_VIDEO_INTAKE_SOURCE_PATH,
} from "./real-video-intake-manifest.ts";
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

export type RealImageAppInputPreviewSourceVideo = {
  intakeVideoId: string;
  sourceFilename: string;
  sourcePath: string;
  sourceFingerprint: string;
  durationSeconds: number;
};

export type RealImageAppInputPreviewFrameSummaryItem = {
  queueOrder: number;
  timestampSeconds: string;
  frameEvidenceId: string;
  frameFingerprint: string;
  dramaFunction: RealMusicDramaFunction;
};

export type RealImageAppInputPreviewFrameSummary = {
  registeredFrameCount: number;
  totalFrameCount: number;
  items: readonly RealImageAppInputPreviewFrameSummaryItem[];
};

export type RealImageAppInputPreviewItemCounts = {
  totalItemCount: number;
  realFrameItemCount: number;
};

export type RealImageAppInputPreview = {
  realImageAppInputPackage: ReturnType<typeof JSON.parse>;
  fingerprint: string;
  itemCounts: RealImageAppInputPreviewItemCounts;
  sourceVideo: RealImageAppInputPreviewSourceVideo;
  frameSummary: RealImageAppInputPreviewFrameSummary;
};

const REAL_IMAGE_APP_INPUT_PREVIEW_SOURCE_VIDEO = Object.freeze({
  intakeVideoId: "e92a616bbf01faa74869501f3417deceb4d45a98691f8bd3ba94457b08c5c01e",
  sourceFilename: REAL_VIDEO_INTAKE_SOURCE_FILENAME,
  sourcePath: REAL_VIDEO_INTAKE_SOURCE_PATH,
  sourceFingerprint: "f8a4ee70f724e98f23c4298843b77bff67bc2b3fb9602c538f327803b89f6c95",
  durationSeconds: REAL_VIDEO_INTAKE_DURATION_SECONDS,
});

const REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE_ITEMS = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    timestampSeconds: "4.000",
    frameEvidenceId: "7e189df8dcc54b3df7f564fd110287c7550a16e91daf4c175a081d839947c840",
    frameFingerprint: "dc1897a6da9d1a6c22136adee75bd33850c6a17b0e55952a686f5bf55fdfe1cf",
    sceneId: "8e7597571c017bd6cc217dcfe28c4a5b22bb41a075bcef4345627cc05cbc8b96",
    dramaFunction: "real-frame-establish" as const,
    emotionTone: "nostalgic-calm" as const,
    rhythmPhase: "rhythm-rise" as const,
    suggestedMusicEnergy: "gentle-build" as const,
    imageAppInputJson:
      '{"version":"v1","inputKind":"real-frame","queueOrder":0,"timestampSeconds":"4.000","frameEvidenceId":"7e189df8dcc54b3df7f564fd110287c7550a16e91daf4c175a081d839947c840","frameFingerprint":"dc1897a6da9d1a6c22136adee75bd33850c6a17b0e55952a686f5bf55fdfe1cf","sceneId":"8e7597571c017bd6cc217dcfe28c4a5b22bb41a075bcef4345627cc05cbc8b96","dramaFunction":"real-frame-establish","emotionTone":"nostalgic-calm","rhythmPhase":"rhythm-rise","suggestedMusicEnergy":"gentle-build"}',
  }),
  Object.freeze({
    queueOrder: 1,
    timestampSeconds: "12.500",
    frameEvidenceId: "a3471640884c2fb405fbf3dcf2b26c0c9e4aad8bd33579946c6e78864496edd0",
    frameFingerprint: "722c7a2b9f1553090e36489d7ab05d8c8a4a77d77ddd849743881e86ed4fc3a6",
    sceneId: "b9d97ca88ae9032808f559ba5b5be11af8d640ee5079e0801cf5cc8a753d611c",
    dramaFunction: "real-frame-bridge" as const,
    emotionTone: "adventurous-soft" as const,
    rhythmPhase: "rhythm-hold" as const,
    suggestedMusicEnergy: "steady-flow" as const,
    imageAppInputJson:
      '{"version":"v1","inputKind":"real-frame","queueOrder":1,"timestampSeconds":"12.500","frameEvidenceId":"a3471640884c2fb405fbf3dcf2b26c0c9e4aad8bd33579946c6e78864496edd0","frameFingerprint":"722c7a2b9f1553090e36489d7ab05d8c8a4a77d77ddd849743881e86ed4fc3a6","sceneId":"b9d97ca88ae9032808f559ba5b5be11af8d640ee5079e0801cf5cc8a753d611c","dramaFunction":"real-frame-bridge","emotionTone":"adventurous-soft","rhythmPhase":"rhythm-hold","suggestedMusicEnergy":"steady-flow"}',
  }),
  Object.freeze({
    queueOrder: 2,
    timestampSeconds: "21.000",
    frameEvidenceId: "5c927d40f7fa21456abbf719fbe94b0ed4f327a21834cd1592d6abccbfddbc0f",
    frameFingerprint: "3d4baa927d1f951b86ecbb035383a3652be0ff1fc17e2985853256c7916c2e6f",
    sceneId: "240fc4afcd85411046216d6562c444578e767a10c8d5e8567c3e34221652c156",
    dramaFunction: "real-frame-resolve" as const,
    emotionTone: "peaceful-wonder" as const,
    rhythmPhase: "rhythm-release" as const,
    suggestedMusicEnergy: "soft-resolve" as const,
    imageAppInputJson:
      '{"version":"v1","inputKind":"real-frame","queueOrder":2,"timestampSeconds":"21.000","frameEvidenceId":"5c927d40f7fa21456abbf719fbe94b0ed4f327a21834cd1592d6abccbfddbc0f","frameFingerprint":"3d4baa927d1f951b86ecbb035383a3652be0ff1fc17e2985853256c7916c2e6f","sceneId":"240fc4afcd85411046216d6562c444578e767a10c8d5e8567c3e34221652c156","dramaFunction":"real-frame-resolve","emotionTone":"peaceful-wonder","rhythmPhase":"rhythm-release","suggestedMusicEnergy":"soft-resolve"}',
  }),
] as const);

export const REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE = Object.freeze({
  version: REAL_IMAGE_APP_INPUT_PACKAGE_VERSION,
  realInputPackageId: "618939dcba28ec2a28eef71aa0b538064448678abb17c3ab8af1b648c87d0f96",
  scenePlanId: "12b2644bbc83e42c4a41f2c43225a45a1a18584afa22190c70615529c36731c9",
  scenePlanFingerprint: "adafff20f2628f1ea692a4d9c1b83706cb25e256147e54cc36ea862b2038406d",
  frameEvidenceRegistryId: "838269ddee7871f89b1a81caabdb83dcc4a52eab819b3be43d59ae4caa879ab3",
  frameEvidenceRegistryFingerprint: "a6cd6d98131cf185f1cb7994f9f89a951815ebd193e5901c6fb555348c87d6d1",
  packageVersion: REAL_IMAGE_APP_INPUT_PACKAGE_KIND_VERSION,
  activePackageState: REAL_IMAGE_APP_INPUT_PACKAGE_STATE,
  packageStatus: "package-complete" as const,
  itemCount: REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT,
  items: REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE_ITEMS,
  generationExecuted: false as const,
  providerCallExecuted: false as const,
});

export const REAL_IMAGE_APP_INPUT_PREVIEW_FINGERPRINT =
  "28bf383ee1e706e34233d3e7b82fbe6c3031b53501d4c5e44e57a2ebb4fc391a" as const;

function buildFrameSummary(
  inputPackage: RealImageAppInputPackage
): RealImageAppInputPreviewFrameSummary {
  const orderedItems = [...inputPackage.items].sort((a, b) => a.queueOrder - b.queueOrder);

  return Object.freeze({
    registeredFrameCount: orderedItems.length,
    totalFrameCount: REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT,
    items: Object.freeze(
      orderedItems.map((item) =>
        Object.freeze({
          queueOrder: item.queueOrder,
          timestampSeconds: item.timestampSeconds,
          frameEvidenceId: item.frameEvidenceId,
          frameFingerprint: item.frameFingerprint,
          dramaFunction: item.dramaFunction,
        })
      )
    ),
  });
}

export function buildRealImageAppInputPreviewFromPackage(
  inputPackage: RealImageAppInputPackage
): RealImageAppInputPreview {
  const fingerprint = computeRealImageAppInputPackageFingerprint(inputPackage);

  return Object.freeze({
    realImageAppInputPackage: JSON.parse(serializeRealImageAppInputPackage(inputPackage)),
    fingerprint,
    itemCounts: Object.freeze({
      totalItemCount: inputPackage.itemCount,
      realFrameItemCount: inputPackage.itemCount,
    }),
    sourceVideo: REAL_IMAGE_APP_INPUT_PREVIEW_SOURCE_VIDEO,
    frameSummary: buildFrameSummary(inputPackage),
  });
}

export function buildRealImageAppInputPreview(): RealImageAppInputPreview {
  return buildRealImageAppInputPreviewFromPackage(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
}

export function serializeRealImageAppInputPreview(preview: RealImageAppInputPreview): string {
  return JSON.stringify({
    realImageAppInputPackage: preview.realImageAppInputPackage,
    fingerprint: preview.fingerprint,
    itemCounts: preview.itemCounts,
    sourceVideo: preview.sourceVideo,
    frameSummary: preview.frameSummary,
  });
}
