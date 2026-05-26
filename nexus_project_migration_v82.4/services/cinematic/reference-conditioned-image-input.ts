import crypto from "crypto";
import type {
  ImageAppFinalInputCharacterProfile,
  ImageAppFinalInputItem,
  ImageAppFinalInputPackage,
  ImageAppFinalInputStyleProfile,
} from "./image-app-final-input-package.ts";
import { computeImageAppFinalInputPackageFingerprint } from "./image-app-final-input-package.ts";
import type {
  ReferenceAnchorAllowedUsage,
  ReferenceAnchorBlockedUsage,
} from "./reference-anchor-usage-policy.ts";
import type { ReferenceGuidedPromptConditioning } from "./reference-guided-prompt-conditioning.ts";
import { computeReferenceGuidedPromptConditioningFingerprint } from "./reference-guided-prompt-conditioning.ts";

export type ReferenceConditionedImageInputItem = {
  conditionedInputId: string;
  queueOrder: number;
  segmentId: string;
  inputPackageId: string;
  conditioningId: string;
  promptIntent: string;
  continuityAnchor: string;
  characterProfile: ImageAppFinalInputCharacterProfile;
  styleProfile: ImageAppFinalInputStyleProfile;
  allowedReferenceUse: readonly ReferenceAnchorAllowedUsage[];
  blockedReferenceUse: readonly ReferenceAnchorBlockedUsage[];
  finalImageAppInputJson: string;
};

export type ReferenceConditionedImageInput = {
  version: "v1";
  conditionedInputRootId: string;
  packageId: string;
  conditioningRootId: string;
  imageAppFinalInputPackageFingerprint: string;
  referenceGuidedPromptConditioningFingerprint: string;
  sourceFingerprint: string;
  conditionedInputVersion: typeof REFERENCE_CONDITIONED_IMAGE_INPUT_KIND_VERSION;
  activeConditionedInputState: string;
  totalConditionedInputCount: number;
  items: readonly ReferenceConditionedImageInputItem[];
};

export const REFERENCE_CONDITIONED_IMAGE_INPUT_VERSION = "v1" as const;
export const REFERENCE_CONDITIONED_IMAGE_INPUT_ID =
  "reference-conditioned-image-input-gonegi-harbor-25s-v1" as const;
export const REFERENCE_CONDITIONED_IMAGE_INPUT_STATE =
  "25s-reference-conditioned-image-input-metadata-only" as const;
export const REFERENCE_CONDITIONED_IMAGE_INPUT_KIND_VERSION =
  "reference-conditioned-image-input-v1" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

const FINAL_IMAGE_APP_INPUT_JSON_KEY_ORDER = Object.freeze([
  "version",
  "inputKind",
  "queueOrder",
  "segmentId",
  "inputPackageId",
  "conditioningId",
  "promptIntent",
  "continuityAnchor",
  "characterProfile",
  "styleProfile",
  "conditioningIntent",
  "allowedReferenceUse",
  "blockedReferenceUse",
  "safetyNote",
  "directAssetReuse",
  "sourceImageAppInputJson",
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

let cachedReferenceConditionedImageInput: ReferenceConditionedImageInput | null = null;

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

function resolvePackageItem(
  imageAppFinalInputPackage: ImageAppFinalInputPackage,
  queueOrder: number
): ImageAppFinalInputItem {
  const packageItem = imageAppFinalInputPackage.items.find((item) => item.queueOrder === queueOrder);
  if (packageItem === undefined) {
    throw new Error("Reference conditioned image input requires an image app final input item");
  }
  return packageItem;
}

function resolveConditioningItem(
  referenceGuidedPromptConditioning: ReferenceGuidedPromptConditioning,
  queueOrder: number
): ReferenceGuidedPromptConditioning["items"][number] {
  const conditioningItem = referenceGuidedPromptConditioning.items.find(
    (item) => item.queueOrder === queueOrder
  );
  if (conditioningItem === undefined) {
    throw new Error("Reference conditioned image input requires a prompt conditioning item");
  }
  return conditioningItem;
}

function computeConditionedInputId(queueOrder: number, inputPackageId: string): string {
  return digestValue(
    [
      REFERENCE_CONDITIONED_IMAGE_INPUT_KIND_VERSION,
      "reference-conditioned-image-input-item",
      String(queueOrder),
      inputPackageId,
    ].join("|")
  );
}

function buildFinalImageAppInputJson(
  packageItem: ImageAppFinalInputItem,
  conditioningItem: ReferenceGuidedPromptConditioning["items"][number]
): string {
  const orderedInput: Record<string, unknown> = {};
  const values: Record<(typeof FINAL_IMAGE_APP_INPUT_JSON_KEY_ORDER)[number], unknown> = {
    version: REFERENCE_CONDITIONED_IMAGE_INPUT_VERSION,
    inputKind: "reference-conditioned",
    queueOrder: packageItem.queueOrder,
    segmentId: packageItem.segmentId,
    inputPackageId: packageItem.inputPackageId,
    conditioningId: conditioningItem.conditioningId,
    promptIntent: packageItem.promptIntent,
    continuityAnchor: packageItem.continuityAnchor,
    characterProfile: orderRecord(
      packageItem.characterProfile,
      IMAGE_APP_FINAL_INPUT_CHARACTER_PROFILE_KEY_ORDER
    ),
    styleProfile: orderRecord(
      packageItem.styleProfile,
      IMAGE_APP_FINAL_INPUT_STYLE_PROFILE_KEY_ORDER
    ),
    conditioningIntent: conditioningItem.conditioningIntent,
    allowedReferenceUse: conditioningItem.allowedReferenceUse,
    blockedReferenceUse: conditioningItem.blockedReferenceUse,
    safetyNote: conditioningItem.safetyNote,
    directAssetReuse: false,
    sourceImageAppInputJson: packageItem.imageAppInputJson,
  };

  for (const key of FINAL_IMAGE_APP_INPUT_JSON_KEY_ORDER) {
    orderedInput[key] = values[key];
  }

  return JSON.stringify(orderedInput);
}

function buildReferenceConditionedImageInputItem(
  packageItem: ImageAppFinalInputItem,
  conditioningItem: ReferenceGuidedPromptConditioning["items"][number]
): ReferenceConditionedImageInputItem {
  return Object.freeze({
    conditionedInputId: computeConditionedInputId(packageItem.queueOrder, packageItem.inputPackageId),
    queueOrder: packageItem.queueOrder,
    segmentId: packageItem.segmentId,
    inputPackageId: packageItem.inputPackageId,
    conditioningId: conditioningItem.conditioningId,
    promptIntent: packageItem.promptIntent,
    continuityAnchor: packageItem.continuityAnchor,
    characterProfile: packageItem.characterProfile,
    styleProfile: packageItem.styleProfile,
    allowedReferenceUse: conditioningItem.allowedReferenceUse,
    blockedReferenceUse: conditioningItem.blockedReferenceUse,
    finalImageAppInputJson: buildFinalImageAppInputJson(packageItem, conditioningItem),
  });
}

export function buildReferenceConditionedImageInput(
  imageAppFinalInputPackage: ImageAppFinalInputPackage,
  referenceGuidedPromptConditioning: ReferenceGuidedPromptConditioning
): ReferenceConditionedImageInput {
  if (cachedReferenceConditionedImageInput !== null) {
    return cachedReferenceConditionedImageInput;
  }

  if (imageAppFinalInputPackage.totalInputItemCount !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Reference conditioned image input requires three image app final input items");
  }

  if (referenceGuidedPromptConditioning.totalConditioningCount !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Reference conditioned image input requires three prompt conditioning items");
  }

  const items = Object.freeze(
    Array.from({ length: FRAME_EXPORT_QUEUE_MAX + 1 }, (_, queueOrder) => {
      const packageItem = resolvePackageItem(imageAppFinalInputPackage, queueOrder);
      const conditioningItem = resolveConditioningItem(
        referenceGuidedPromptConditioning,
        queueOrder
      );
      return buildReferenceConditionedImageInputItem(packageItem, conditioningItem);
    })
  );

  const queueOrders = items.map((item) => item.queueOrder);
  if (queueOrders.join(",") !== "0,1,2") {
    throw new Error("Reference conditioned image input requires queue order zero through two");
  }

  const conditionedInput = Object.freeze({
    version: REFERENCE_CONDITIONED_IMAGE_INPUT_VERSION,
    conditionedInputRootId: REFERENCE_CONDITIONED_IMAGE_INPUT_ID,
    packageId: imageAppFinalInputPackage.packageId,
    conditioningRootId: referenceGuidedPromptConditioning.conditioningRootId,
    imageAppFinalInputPackageFingerprint:
      computeImageAppFinalInputPackageFingerprint(imageAppFinalInputPackage),
    referenceGuidedPromptConditioningFingerprint:
      computeReferenceGuidedPromptConditioningFingerprint(referenceGuidedPromptConditioning),
    sourceFingerprint: imageAppFinalInputPackage.sourceFingerprint,
    conditionedInputVersion: REFERENCE_CONDITIONED_IMAGE_INPUT_KIND_VERSION,
    activeConditionedInputState: REFERENCE_CONDITIONED_IMAGE_INPUT_STATE,
    totalConditionedInputCount: items.length,
    items,
  });

  cachedReferenceConditionedImageInput = conditionedInput;
  return conditionedInput;
}

export const REFERENCE_CONDITIONED_IMAGE_INPUT_ITEM_KEY_ORDER = Object.freeze([
  "conditionedInputId",
  "queueOrder",
  "segmentId",
  "inputPackageId",
  "conditioningId",
  "promptIntent",
  "continuityAnchor",
  "characterProfile",
  "styleProfile",
  "allowedReferenceUse",
  "blockedReferenceUse",
  "finalImageAppInputJson",
] as const);

export const REFERENCE_CONDITIONED_IMAGE_INPUT_KEY_ORDER = Object.freeze([
  "version",
  "conditionedInputRootId",
  "packageId",
  "conditioningRootId",
  "imageAppFinalInputPackageFingerprint",
  "referenceGuidedPromptConditioningFingerprint",
  "sourceFingerprint",
  "conditionedInputVersion",
  "activeConditionedInputState",
  "totalConditionedInputCount",
  "items",
] as const);

export function serializeReferenceConditionedImageInput(
  conditionedInput: ReferenceConditionedImageInput
): string {
  const orderedItems = conditionedInput.items.map((item) => {
    const orderedItem: Record<string, unknown> = {
      conditionedInputId: item.conditionedInputId,
      queueOrder: item.queueOrder,
      segmentId: item.segmentId,
      inputPackageId: item.inputPackageId,
      conditioningId: item.conditioningId,
      promptIntent: item.promptIntent,
      continuityAnchor: item.continuityAnchor,
      characterProfile: orderRecord(
        item.characterProfile,
        IMAGE_APP_FINAL_INPUT_CHARACTER_PROFILE_KEY_ORDER
      ),
      styleProfile: orderRecord(item.styleProfile, IMAGE_APP_FINAL_INPUT_STYLE_PROFILE_KEY_ORDER),
      allowedReferenceUse: item.allowedReferenceUse,
      blockedReferenceUse: item.blockedReferenceUse,
      finalImageAppInputJson: item.finalImageAppInputJson,
    };
    return orderedItem;
  });

  const orderedConditionedInput: Record<string, unknown> = {};
  for (const key of REFERENCE_CONDITIONED_IMAGE_INPUT_KEY_ORDER) {
    if (key === "items") {
      orderedConditionedInput.items = orderedItems;
    } else {
      orderedConditionedInput[key] = conditionedInput[key as keyof ReferenceConditionedImageInput];
    }
  }

  return JSON.stringify(orderedConditionedInput);
}

export function computeReferenceConditionedImageInputFingerprint(
  conditionedInput: ReferenceConditionedImageInput
): string {
  return digestValue(serializeReferenceConditionedImageInput(conditionedInput));
}

export function resetReferenceConditionedImageInputCacheForVerification(): void {
  cachedReferenceConditionedImageInput = null;
}
