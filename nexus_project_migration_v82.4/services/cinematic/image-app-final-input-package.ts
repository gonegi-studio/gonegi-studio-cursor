import crypto from "crypto";
import type { StyleCoreBinding } from "./style-core-binding.ts";
import { computeStyleCoreBindingFingerprint } from "./style-core-binding.ts";
import { CHARACTER_DNA_CANONICAL_PROFILE } from "./character-dna-binding.ts";

export type ImageAppFinalInputCharacterProfile = {
  characterDnaId: string;
  characterKey: string;
  outfitKey: string;
  silhouetteKey: string;
  expressionKey: string;
  paletteKey: string;
  emotionalBeat: string;
};

export type ImageAppFinalInputStyleProfile = {
  styleCoreId: string;
  styleKey: string;
  materialKey: string;
  lightingKey: string;
  paletteKey: string;
  brushworkKey: string;
  styleStrength: number;
};

export type ImageAppFinalInputItem = {
  inputPackageId: string;
  queueOrder: number;
  segmentId: string;
  promptIntent: string;
  continuityAnchor: string;
  characterProfile: ImageAppFinalInputCharacterProfile;
  styleProfile: ImageAppFinalInputStyleProfile;
  rendererInputJson: string;
  imageAppInputJson: string;
  inputItemFingerprint: string;
};

export type ImageAppFinalInputPackage = {
  version: "v1";
  packageId: string;
  styleCoreBindingId: string;
  styleCoreBindingFingerprint: string;
  characterDnaBindingFingerprint: string;
  sourceFingerprint: string;
  packageVersion: typeof IMAGE_APP_FINAL_INPUT_PACKAGE_KIND_VERSION;
  activePackageState: string;
  totalInputItemCount: number;
  items: readonly ImageAppFinalInputItem[];
};

export const IMAGE_APP_FINAL_INPUT_PACKAGE_VERSION = "v1" as const;
export const IMAGE_APP_FINAL_INPUT_PACKAGE_ID =
  "image-app-final-input-package-gonegi-harbor-25s-v1" as const;
export const IMAGE_APP_FINAL_INPUT_PACKAGE_STATE =
  "25s-image-app-final-input-package-metadata-only" as const;
export const IMAGE_APP_FINAL_INPUT_PACKAGE_KIND_VERSION =
  "image-app-final-input-package-v1" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

const CHARACTER_EXPRESSION_BY_QUEUE = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    expressionKey: "calm-gaze-v1",
    emotionalBeat: "nostalgic-calm",
  }),
  Object.freeze({
    queueOrder: 1,
    expressionKey: "reflective-bridge-v1",
    emotionalBeat: "reflective-bridge",
  }),
  Object.freeze({
    queueOrder: 2,
    expressionKey: "warm-resolve-v1",
    emotionalBeat: "warm-resolution",
  }),
]);

const IMAGE_APP_INPUT_JSON_KEY_ORDER = Object.freeze([
  "version",
  "queueOrder",
  "segmentId",
  "promptIntent",
  "continuityAnchor",
  "characterProfile",
  "styleProfile",
  "rendererInputJson",
] as const);

const IMAGE_APP_FINAL_INPUT_CHARACTER_PROFILE_KEY_ORDER = Object.freeze([
  "characterDnaId",
  "characterKey",
  "outfitKey",
  "silhouetteKey",
  "expressionKey",
  "paletteKey",
  "emotionalBeat",
] as const);

const IMAGE_APP_FINAL_INPUT_STYLE_PROFILE_KEY_ORDER = Object.freeze([
  "styleCoreId",
  "styleKey",
  "materialKey",
  "lightingKey",
  "paletteKey",
  "brushworkKey",
  "styleStrength",
] as const);

let cachedImageAppFinalInputPackage: ImageAppFinalInputPackage | null = null;

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

function resolveCharacterExpression(queueOrder: number) {
  const expression = CHARACTER_EXPRESSION_BY_QUEUE.find((item) => item.queueOrder === queueOrder);
  if (expression === undefined) {
    throw new Error("Image app final input package requires a frame expression definition");
  }
  return expression;
}

function parseRendererInputFields(rendererInputJson: string): {
  promptIntent: string;
  continuityAnchor: string;
} {
  const parsed = JSON.parse(rendererInputJson) as {
    promptIntent?: string;
    continuityAnchor?: string;
  };

  if (parsed.promptIntent === undefined || parsed.continuityAnchor === undefined) {
    throw new Error("Renderer input json requires promptIntent and continuityAnchor");
  }

  return {
    promptIntent: parsed.promptIntent,
    continuityAnchor: parsed.continuityAnchor,
  };
}

function buildCharacterProfile(
  styleItem: StyleCoreBinding["items"][number]
): ImageAppFinalInputCharacterProfile {
  const expression = resolveCharacterExpression(styleItem.queueOrder);

  return Object.freeze({
    characterDnaId: styleItem.characterDnaId,
    characterKey: CHARACTER_DNA_CANONICAL_PROFILE.characterKey,
    outfitKey: CHARACTER_DNA_CANONICAL_PROFILE.outfitKey,
    silhouetteKey: CHARACTER_DNA_CANONICAL_PROFILE.silhouetteKey,
    expressionKey: expression.expressionKey,
    paletteKey: styleItem.paletteKey,
    emotionalBeat: expression.emotionalBeat,
  });
}

function buildStyleProfile(
  styleItem: StyleCoreBinding["items"][number]
): ImageAppFinalInputStyleProfile {
  return Object.freeze({
    styleCoreId: styleItem.styleCoreId,
    styleKey: styleItem.styleKey,
    materialKey: styleItem.materialKey,
    lightingKey: styleItem.lightingKey,
    paletteKey: styleItem.paletteKey,
    brushworkKey: styleItem.brushworkKey,
    styleStrength: styleItem.styleStrength,
  });
}

function buildImageAppInputJson(
  queueOrder: number,
  segmentId: string,
  promptIntent: string,
  continuityAnchor: string,
  characterProfile: ImageAppFinalInputCharacterProfile,
  styleProfile: ImageAppFinalInputStyleProfile,
  rendererInputJson: string
): string {
  const orderedInput: Record<string, unknown> = {};
  const values: Record<(typeof IMAGE_APP_INPUT_JSON_KEY_ORDER)[number], unknown> = {
    version: IMAGE_APP_FINAL_INPUT_PACKAGE_VERSION,
    queueOrder,
    segmentId,
    promptIntent,
    continuityAnchor,
    characterProfile: orderRecord(
      characterProfile,
      IMAGE_APP_FINAL_INPUT_CHARACTER_PROFILE_KEY_ORDER
    ),
    styleProfile: orderRecord(styleProfile, IMAGE_APP_FINAL_INPUT_STYLE_PROFILE_KEY_ORDER),
    rendererInputJson,
  };

  for (const key of IMAGE_APP_INPUT_JSON_KEY_ORDER) {
    orderedInput[key] = values[key];
  }

  return JSON.stringify(orderedInput);
}

function computeInputPackageItemId(queueOrder: number, styleCoreId: string): string {
  return digestValue(
    [
      IMAGE_APP_FINAL_INPUT_PACKAGE_KIND_VERSION,
      "input-package-item",
      String(queueOrder),
      styleCoreId,
    ].join("|")
  );
}

function computeInputItemFingerprint(
  item: Omit<ImageAppFinalInputItem, "inputItemFingerprint">
): string {
  return digestValue(
    [
      IMAGE_APP_FINAL_INPUT_PACKAGE_KIND_VERSION,
      item.inputPackageId,
      String(item.queueOrder),
      item.segmentId,
      item.promptIntent,
      item.continuityAnchor,
      JSON.stringify(
        orderRecord(item.characterProfile, IMAGE_APP_FINAL_INPUT_CHARACTER_PROFILE_KEY_ORDER)
      ),
      JSON.stringify(orderRecord(item.styleProfile, IMAGE_APP_FINAL_INPUT_STYLE_PROFILE_KEY_ORDER)),
      item.rendererInputJson,
      item.imageAppInputJson,
    ].join("|")
  );
}

function buildImageAppFinalInputItem(
  styleItem: StyleCoreBinding["items"][number]
): ImageAppFinalInputItem {
  const { promptIntent, continuityAnchor } = parseRendererInputFields(styleItem.rendererInputJson);
  const characterProfile = buildCharacterProfile(styleItem);
  const styleProfile = buildStyleProfile(styleItem);
  const imageAppInputJson = buildImageAppInputJson(
    styleItem.queueOrder,
    styleItem.segmentId,
    promptIntent,
    continuityAnchor,
    characterProfile,
    styleProfile,
    styleItem.rendererInputJson
  );

  const baseItem: Omit<ImageAppFinalInputItem, "inputItemFingerprint"> = {
    inputPackageId: computeInputPackageItemId(styleItem.queueOrder, styleItem.styleCoreId),
    queueOrder: styleItem.queueOrder,
    segmentId: styleItem.segmentId,
    promptIntent,
    continuityAnchor,
    characterProfile,
    styleProfile,
    rendererInputJson: styleItem.rendererInputJson,
    imageAppInputJson,
  };

  return Object.freeze({
    ...baseItem,
    inputItemFingerprint: computeInputItemFingerprint(baseItem),
  });
}

export function buildImageAppFinalInputPackage(
  styleCoreBinding: StyleCoreBinding
): ImageAppFinalInputPackage {
  if (cachedImageAppFinalInputPackage !== null) {
    return cachedImageAppFinalInputPackage;
  }

  const styleCoreBindingFingerprint = computeStyleCoreBindingFingerprint(styleCoreBinding);
  const orderedStyleItems = [...styleCoreBinding.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedStyleItems.length !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Image app final input package requires three style continuity items");
  }

  const items = Object.freeze(orderedStyleItems.map((styleItem) => buildImageAppFinalInputItem(styleItem)));

  const inputPackage = Object.freeze({
    version: IMAGE_APP_FINAL_INPUT_PACKAGE_VERSION,
    packageId: IMAGE_APP_FINAL_INPUT_PACKAGE_ID,
    styleCoreBindingId: styleCoreBinding.bindingId,
    styleCoreBindingFingerprint,
    characterDnaBindingFingerprint: styleCoreBinding.characterDnaBindingFingerprint,
    sourceFingerprint: styleCoreBinding.sourceFingerprint,
    packageVersion: IMAGE_APP_FINAL_INPUT_PACKAGE_KIND_VERSION,
    activePackageState: IMAGE_APP_FINAL_INPUT_PACKAGE_STATE,
    totalInputItemCount: items.length,
    items,
  });

  cachedImageAppFinalInputPackage = inputPackage;
  return inputPackage;
}

export const IMAGE_APP_FINAL_INPUT_ITEM_KEY_ORDER = Object.freeze([
  "inputPackageId",
  "queueOrder",
  "segmentId",
  "promptIntent",
  "continuityAnchor",
  "characterProfile",
  "styleProfile",
  "rendererInputJson",
  "imageAppInputJson",
  "inputItemFingerprint",
] as const);

export const IMAGE_APP_FINAL_INPUT_PACKAGE_KEY_ORDER = Object.freeze([
  "version",
  "packageId",
  "styleCoreBindingId",
  "styleCoreBindingFingerprint",
  "characterDnaBindingFingerprint",
  "sourceFingerprint",
  "packageVersion",
  "activePackageState",
  "totalInputItemCount",
  "items",
] as const);

export function serializeImageAppFinalInputPackage(inputPackage: ImageAppFinalInputPackage): string {
  const orderedItems = [...inputPackage.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => {
      const orderedItem: Record<string, unknown> = {
        inputPackageId: item.inputPackageId,
        queueOrder: item.queueOrder,
        segmentId: item.segmentId,
        promptIntent: item.promptIntent,
        continuityAnchor: item.continuityAnchor,
        characterProfile: orderRecord(
          item.characterProfile,
          IMAGE_APP_FINAL_INPUT_CHARACTER_PROFILE_KEY_ORDER
        ),
        styleProfile: orderRecord(item.styleProfile, IMAGE_APP_FINAL_INPUT_STYLE_PROFILE_KEY_ORDER),
        rendererInputJson: item.rendererInputJson,
        imageAppInputJson: item.imageAppInputJson,
        inputItemFingerprint: item.inputItemFingerprint,
      };
      return orderedItem;
    });

  const orderedPackage: Record<string, unknown> = {};
  for (const key of IMAGE_APP_FINAL_INPUT_PACKAGE_KEY_ORDER) {
    if (key === "items") {
      orderedPackage.items = orderedItems;
    } else {
      orderedPackage[key] = inputPackage[key as keyof ImageAppFinalInputPackage];
    }
  }

  return JSON.stringify(orderedPackage);
}

export function computeImageAppFinalInputPackageFingerprint(
  inputPackage: ImageAppFinalInputPackage
): string {
  return digestValue(serializeImageAppFinalInputPackage(inputPackage));
}

export function resetImageAppFinalInputPackageCacheForVerification(): void {
  cachedImageAppFinalInputPackage = null;
}
