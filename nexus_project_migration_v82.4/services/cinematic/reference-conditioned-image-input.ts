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
import { REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG } from "./reference-anchor-usage-policy.ts";
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

const REFERENCE_CONDITIONED_IMAGE_INPUT_PREVIEW_INPUT_JSON = "{\"version\":\"v1\",\"conditionedInputRootId\":\"reference-conditioned-image-input-gonegi-harbor-25s-v1\",\"packageId\":\"image-app-final-input-package-gonegi-harbor-25s-v1\",\"conditioningRootId\":\"reference-guided-prompt-conditioning-gonegi-harbor-25s-v1\",\"imageAppFinalInputPackageFingerprint\":\"649b5b2cfed900a56ed5cdf3d1253ae65dfc2c7fbcfb116396b44748d9764d02\",\"referenceGuidedPromptConditioningFingerprint\":\"4a0ed50ed4d5912d4c046642f45bc565884d9e100ad127ad2958c2ca8274a6db\",\"sourceFingerprint\":\"3397ecf7c62f94a60c8b05d175db34404150c707b3e8b3525acfdd5eae659589\",\"conditionedInputVersion\":\"reference-conditioned-image-input-v1\",\"activeConditionedInputState\":\"25s-reference-conditioned-image-input-metadata-only\",\"totalConditionedInputCount\":3,\"items\":[{\"conditionedInputId\":\"5d052b8bdc07f133c89dde585e4ec308dfadce72a421aa161b94f499d7b786d0\",\"queueOrder\":0,\"segmentId\":\"segment-001\",\"inputPackageId\":\"49ecdcc00c1bf36ad4ed7437ef47a4a24b2eeeb937b8ce91d6374f187f44acbd\",\"conditioningId\":\"2754623409d902b72e1d4c853320119a86c93ffee4ec47afd6f2ad12819e0246\",\"promptIntent\":\"frame-establish|nostalgic-calm|rhythm-rise|low|soft\",\"continuityAnchor\":\"continuity-anchor-segment-001\",\"characterProfile\":{\"characterDnaId\":\"a17967f98b582e6de51a846f19cedaf1d925f80f4721f4d5b23c47e32e81fd4b\",\"characterKey\":\"gonegi-main\",\"outfitKey\":\"harbor-coat-v1\",\"silhouetteKey\":\"rounded-small-cat\",\"expressionKey\":\"calm-gaze-v1\",\"paletteKey\":\"warm-harbor-evening\",\"emotionalBeat\":\"nostalgic-calm\"},\"styleProfile\":{\"styleCoreId\":\"c9b9ff230d2e64f0085291e4983b97b82b19166285fa367d5ac681b4181ab4f3\",\"styleKey\":\"gonegi-warm-cinematic\",\"materialKey\":\"glass-glaze-soft\",\"lightingKey\":\"warm-harbor-golden\",\"paletteKey\":\"warm-harbor-evening\",\"brushworkKey\":\"soft-handpainted-animation\",\"styleStrength\":0.992351},\"allowedReferenceUse\":[\"style-reference\",\"prompt-conditioning\"],\"blockedReferenceUse\":[\"direct-copy\",\"asset-reuse\",\"copyright-leakage\"],\"finalImageAppInputJson\":\"{\\\"version\\\":\\\"v1\\\",\\\"inputKind\\\":\\\"reference-conditioned\\\",\\\"queueOrder\\\":0,\\\"segmentId\\\":\\\"segment-001\\\",\\\"inputPackageId\\\":\\\"49ecdcc00c1bf36ad4ed7437ef47a4a24b2eeeb937b8ce91d6374f187f44acbd\\\",\\\"conditioningId\\\":\\\"2754623409d902b72e1d4c853320119a86c93ffee4ec47afd6f2ad12819e0246\\\",\\\"promptIntent\\\":\\\"frame-establish|nostalgic-calm|rhythm-rise|low|soft\\\",\\\"continuityAnchor\\\":\\\"continuity-anchor-segment-001\\\",\\\"characterProfile\\\":{\\\"characterDnaId\\\":\\\"a17967f98b582e6de51a846f19cedaf1d925f80f4721f4d5b23c47e32e81fd4b\\\",\\\"characterKey\\\":\\\"gonegi-main\\\",\\\"outfitKey\\\":\\\"harbor-coat-v1\\\",\\\"silhouetteKey\\\":\\\"rounded-small-cat\\\",\\\"expressionKey\\\":\\\"calm-gaze-v1\\\",\\\"paletteKey\\\":\\\"warm-harbor-evening\\\",\\\"emotionalBeat\\\":\\\"nostalgic-calm\\\"},\\\"styleProfile\\\":{\\\"styleCoreId\\\":\\\"c9b9ff230d2e64f0085291e4983b97b82b19166285fa367d5ac681b4181ab4f3\\\",\\\"styleKey\\\":\\\"gonegi-warm-cinematic\\\",\\\"materialKey\\\":\\\"glass-glaze-soft\\\",\\\"lightingKey\\\":\\\"warm-harbor-golden\\\",\\\"paletteKey\\\":\\\"warm-harbor-evening\\\",\\\"brushworkKey\\\":\\\"soft-handpainted-animation\\\",\\\"styleStrength\\\":0.992351},\\\"conditioningIntent\\\":\\\"style-and-visual-prompt-conditioning\\\",\\\"allowedReferenceUse\\\":[\\\"style-reference\\\",\\\"prompt-conditioning\\\"],\\\"blockedReferenceUse\\\":[\\\"direct-copy\\\",\\\"asset-reuse\\\",\\\"copyright-leakage\\\"],\\\"safetyNote\\\":\\\"metadata-conditioning-only-no-direct-asset-reuse\\\",\\\"directAssetReuse\\\":false,\\\"sourceImageAppInputJson\\\":\\\"{\\\\\\\"version\\\\\\\":\\\\\\\"v1\\\\\\\",\\\\\\\"queueOrder\\\\\\\":0,\\\\\\\"segmentId\\\\\\\":\\\\\\\"segment-001\\\\\\\",\\\\\\\"promptIntent\\\\\\\":\\\\\\\"frame-establish|nostalgic-calm|rhythm-rise|low|soft\\\\\\\",\\\\\\\"continuityAnchor\\\\\\\":\\\\\\\"continuity-anchor-segment-001\\\\\\\",\\\\\\\"characterProfile\\\\\\\":{\\\\\\\"characterDnaId\\\\\\\":\\\\\\\"a17967f98b582e6de51a846f19cedaf1d925f80f4721f4d5b23c47e32e81fd4b\\\\\\\",\\\\\\\"characterKey\\\\\\\":\\\\\\\"gonegi-main\\\\\\\",\\\\\\\"outfitKey\\\\\\\":\\\\\\\"harbor-coat-v1\\\\\\\",\\\\\\\"silhouetteKey\\\\\\\":\\\\\\\"rounded-small-cat\\\\\\\",\\\\\\\"expressionKey\\\\\\\":\\\\\\\"calm-gaze-v1\\\\\\\",\\\\\\\"paletteKey\\\\\\\":\\\\\\\"warm-harbor-evening\\\\\\\",\\\\\\\"emotionalBeat\\\\\\\":\\\\\\\"nostalgic-calm\\\\\\\"},\\\\\\\"styleProfile\\\\\\\":{\\\\\\\"styleCoreId\\\\\\\":\\\\\\\"c9b9ff230d2e64f0085291e4983b97b82b19166285fa367d5ac681b4181ab4f3\\\\\\\",\\\\\\\"styleKey\\\\\\\":\\\\\\\"gonegi-warm-cinematic\\\\\\\",\\\\\\\"materialKey\\\\\\\":\\\\\\\"glass-glaze-soft\\\\\\\",\\\\\\\"lightingKey\\\\\\\":\\\\\\\"warm-harbor-golden\\\\\\\",\\\\\\\"paletteKey\\\\\\\":\\\\\\\"warm-harbor-evening\\\\\\\",\\\\\\\"brushworkKey\\\\\\\":\\\\\\\"soft-handpainted-animation\\\\\\\",\\\\\\\"styleStrength\\\\\\\":0.992351},\\\\\\\"rendererInputJson\\\\\\\":\\\\\\\"{\\\\\\\\\\\\\\\"version\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"v1\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"target\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"image-renderer\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"mode\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"image\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"queueOrder\\\\\\\\\\\\\\\":0,\\\\\\\\\\\\\\\"segmentId\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"segment-001\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"promptIntent\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"frame-establish|nostalgic-calm|rhythm-rise|low|soft\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"continuityAnchor\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"continuity-anchor-segment-001\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"outputSlot\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"generator-output-slot-segment-001-queue-000\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"adapterHint\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"generic-image-adapter-v1\\\\\\\\\\\\\\\"}\\\\\\\"}\\\"}\"},{\"conditionedInputId\":\"8726d61dd5afd33034b1f4597a6dd60453b6ffe3e59974c764085f702caa4209\",\"queueOrder\":1,\"segmentId\":\"segment-002\",\"inputPackageId\":\"c00de0ae954db05b3a2d439307010f71b1c847dc8c36de7a3485e9a4b98bd5f0\",\"conditioningId\":\"cdfdb907d4a294807b5eab68e22631b43b1f07a2d5ef630e2452369c8ca2c9f3\",\"promptIntent\":\"frame-bridge|reflective-bridge|rhythm-hold|medium|moderate\",\"continuityAnchor\":\"continuity-anchor-segment-002\",\"characterProfile\":{\"characterDnaId\":\"041243c64162ff353a8080bc893b129276cdb7bb2892dc733f28b66b07dd7aa2\",\"characterKey\":\"gonegi-main\",\"outfitKey\":\"harbor-coat-v1\",\"silhouetteKey\":\"rounded-small-cat\",\"expressionKey\":\"reflective-bridge-v1\",\"paletteKey\":\"warm-harbor-evening\",\"emotionalBeat\":\"reflective-bridge\"},\"styleProfile\":{\"styleCoreId\":\"39f9579d4d7d691f193fc5215e291580e2a4fcef81f0ce0e5d048515a5d2cd18\",\"styleKey\":\"gonegi-warm-cinematic\",\"materialKey\":\"glass-glaze-soft\",\"lightingKey\":\"warm-harbor-golden\",\"paletteKey\":\"warm-harbor-evening\",\"brushworkKey\":\"soft-handpainted-animation\",\"styleStrength\":0.990196},\"allowedReferenceUse\":[\"continuity-check\",\"prompt-conditioning\"],\"blockedReferenceUse\":[\"direct-copy\",\"asset-reuse\",\"copyright-leakage\"],\"finalImageAppInputJson\":\"{\\\"version\\\":\\\"v1\\\",\\\"inputKind\\\":\\\"reference-conditioned\\\",\\\"queueOrder\\\":1,\\\"segmentId\\\":\\\"segment-002\\\",\\\"inputPackageId\\\":\\\"c00de0ae954db05b3a2d439307010f71b1c847dc8c36de7a3485e9a4b98bd5f0\\\",\\\"conditioningId\\\":\\\"cdfdb907d4a294807b5eab68e22631b43b1f07a2d5ef630e2452369c8ca2c9f3\\\",\\\"promptIntent\\\":\\\"frame-bridge|reflective-bridge|rhythm-hold|medium|moderate\\\",\\\"continuityAnchor\\\":\\\"continuity-anchor-segment-002\\\",\\\"characterProfile\\\":{\\\"characterDnaId\\\":\\\"041243c64162ff353a8080bc893b129276cdb7bb2892dc733f28b66b07dd7aa2\\\",\\\"characterKey\\\":\\\"gonegi-main\\\",\\\"outfitKey\\\":\\\"harbor-coat-v1\\\",\\\"silhouetteKey\\\":\\\"rounded-small-cat\\\",\\\"expressionKey\\\":\\\"reflective-bridge-v1\\\",\\\"paletteKey\\\":\\\"warm-harbor-evening\\\",\\\"emotionalBeat\\\":\\\"reflective-bridge\\\"},\\\"styleProfile\\\":{\\\"styleCoreId\\\":\\\"39f9579d4d7d691f193fc5215e291580e2a4fcef81f0ce0e5d048515a5d2cd18\\\",\\\"styleKey\\\":\\\"gonegi-warm-cinematic\\\",\\\"materialKey\\\":\\\"glass-glaze-soft\\\",\\\"lightingKey\\\":\\\"warm-harbor-golden\\\",\\\"paletteKey\\\":\\\"warm-harbor-evening\\\",\\\"brushworkKey\\\":\\\"soft-handpainted-animation\\\",\\\"styleStrength\\\":0.990196},\\\"conditioningIntent\\\":\\\"continuity-chain-prompt-conditioning\\\",\\\"allowedReferenceUse\\\":[\\\"continuity-check\\\",\\\"prompt-conditioning\\\"],\\\"blockedReferenceUse\\\":[\\\"direct-copy\\\",\\\"asset-reuse\\\",\\\"copyright-leakage\\\"],\\\"safetyNote\\\":\\\"metadata-conditioning-only-no-direct-asset-reuse\\\",\\\"directAssetReuse\\\":false,\\\"sourceImageAppInputJson\\\":\\\"{\\\\\\\"version\\\\\\\":\\\\\\\"v1\\\\\\\",\\\\\\\"queueOrder\\\\\\\":1,\\\\\\\"segmentId\\\\\\\":\\\\\\\"segment-002\\\\\\\",\\\\\\\"promptIntent\\\\\\\":\\\\\\\"frame-bridge|reflective-bridge|rhythm-hold|medium|moderate\\\\\\\",\\\\\\\"continuityAnchor\\\\\\\":\\\\\\\"continuity-anchor-segment-002\\\\\\\",\\\\\\\"characterProfile\\\\\\\":{\\\\\\\"characterDnaId\\\\\\\":\\\\\\\"041243c64162ff353a8080bc893b129276cdb7bb2892dc733f28b66b07dd7aa2\\\\\\\",\\\\\\\"characterKey\\\\\\\":\\\\\\\"gonegi-main\\\\\\\",\\\\\\\"outfitKey\\\\\\\":\\\\\\\"harbor-coat-v1\\\\\\\",\\\\\\\"silhouetteKey\\\\\\\":\\\\\\\"rounded-small-cat\\\\\\\",\\\\\\\"expressionKey\\\\\\\":\\\\\\\"reflective-bridge-v1\\\\\\\",\\\\\\\"paletteKey\\\\\\\":\\\\\\\"warm-harbor-evening\\\\\\\",\\\\\\\"emotionalBeat\\\\\\\":\\\\\\\"reflective-bridge\\\\\\\"},\\\\\\\"styleProfile\\\\\\\":{\\\\\\\"styleCoreId\\\\\\\":\\\\\\\"39f9579d4d7d691f193fc5215e291580e2a4fcef81f0ce0e5d048515a5d2cd18\\\\\\\",\\\\\\\"styleKey\\\\\\\":\\\\\\\"gonegi-warm-cinematic\\\\\\\",\\\\\\\"materialKey\\\\\\\":\\\\\\\"glass-glaze-soft\\\\\\\",\\\\\\\"lightingKey\\\\\\\":\\\\\\\"warm-harbor-golden\\\\\\\",\\\\\\\"paletteKey\\\\\\\":\\\\\\\"warm-harbor-evening\\\\\\\",\\\\\\\"brushworkKey\\\\\\\":\\\\\\\"soft-handpainted-animation\\\\\\\",\\\\\\\"styleStrength\\\\\\\":0.990196},\\\\\\\"rendererInputJson\\\\\\\":\\\\\\\"{\\\\\\\\\\\\\\\"version\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"v1\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"target\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"image-renderer\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"mode\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"image\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"queueOrder\\\\\\\\\\\\\\\":1,\\\\\\\\\\\\\\\"segmentId\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"segment-002\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"promptIntent\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"frame-bridge|reflective-bridge|rhythm-hold|medium|moderate\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"continuityAnchor\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"continuity-anchor-segment-002\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"outputSlot\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"generator-output-slot-segment-002-queue-001\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"adapterHint\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"generic-image-adapter-v1\\\\\\\\\\\\\\\"}\\\\\\\"}\\\"}\"},{\"conditionedInputId\":\"a48cab797b1c26e9c71ce385aa3a8a1ee15fced0abc41c35849e8ab8086d39bb\",\"queueOrder\":2,\"segmentId\":\"segment-003\",\"inputPackageId\":\"19efbf3876b1cc7c5f754e0018f5bbd6f1888278e22884de30030cfcae6ce780\",\"conditioningId\":\"079dc53535ede07ee428418ce03b05c9c0ac16fd250812b44381e37dfe8f3fc8\",\"promptIntent\":\"frame-resolve|warm-resolution|rhythm-release|low|gentle\",\"continuityAnchor\":\"continuity-anchor-segment-003\",\"characterProfile\":{\"characterDnaId\":\"8a9834562fbc51c12637e7fca78ece90214c54d8eb0f0714d6fea2cd72526fbb\",\"characterKey\":\"gonegi-main\",\"outfitKey\":\"harbor-coat-v1\",\"silhouetteKey\":\"rounded-small-cat\",\"expressionKey\":\"warm-resolve-v1\",\"paletteKey\":\"warm-harbor-evening\",\"emotionalBeat\":\"warm-resolution\"},\"styleProfile\":{\"styleCoreId\":\"d25a2470a4cc8150f7209e6ec3c6650b1715a43843eee83f34110b1a1a8b067c\",\"styleKey\":\"gonegi-warm-cinematic\",\"materialKey\":\"glass-glaze-soft\",\"lightingKey\":\"warm-harbor-golden\",\"paletteKey\":\"warm-harbor-evening\",\"brushworkKey\":\"soft-handpainted-animation\",\"styleStrength\":0.946898},\"allowedReferenceUse\":[\"prompt-conditioning\",\"continuity-check\",\"style-reference\"],\"blockedReferenceUse\":[\"direct-copy\",\"asset-reuse\",\"copyright-leakage\"],\"finalImageAppInputJson\":\"{\\\"version\\\":\\\"v1\\\",\\\"inputKind\\\":\\\"reference-conditioned\\\",\\\"queueOrder\\\":2,\\\"segmentId\\\":\\\"segment-003\\\",\\\"inputPackageId\\\":\\\"19efbf3876b1cc7c5f754e0018f5bbd6f1888278e22884de30030cfcae6ce780\\\",\\\"conditioningId\\\":\\\"079dc53535ede07ee428418ce03b05c9c0ac16fd250812b44381e37dfe8f3fc8\\\",\\\"promptIntent\\\":\\\"frame-resolve|warm-resolution|rhythm-release|low|gentle\\\",\\\"continuityAnchor\\\":\\\"continuity-anchor-segment-003\\\",\\\"characterProfile\\\":{\\\"characterDnaId\\\":\\\"8a9834562fbc51c12637e7fca78ece90214c54d8eb0f0714d6fea2cd72526fbb\\\",\\\"characterKey\\\":\\\"gonegi-main\\\",\\\"outfitKey\\\":\\\"harbor-coat-v1\\\",\\\"silhouetteKey\\\":\\\"rounded-small-cat\\\",\\\"expressionKey\\\":\\\"warm-resolve-v1\\\",\\\"paletteKey\\\":\\\"warm-harbor-evening\\\",\\\"emotionalBeat\\\":\\\"warm-resolution\\\"},\\\"styleProfile\\\":{\\\"styleCoreId\\\":\\\"d25a2470a4cc8150f7209e6ec3c6650b1715a43843eee83f34110b1a1a8b067c\\\",\\\"styleKey\\\":\\\"gonegi-warm-cinematic\\\",\\\"materialKey\\\":\\\"glass-glaze-soft\\\",\\\"lightingKey\\\":\\\"warm-harbor-golden\\\",\\\"paletteKey\\\":\\\"warm-harbor-evening\\\",\\\"brushworkKey\\\":\\\"soft-handpainted-animation\\\",\\\"styleStrength\\\":0.946898},\\\"conditioningIntent\\\":\\\"prompt-alignment-conditioning\\\",\\\"allowedReferenceUse\\\":[\\\"prompt-conditioning\\\",\\\"continuity-check\\\",\\\"style-reference\\\"],\\\"blockedReferenceUse\\\":[\\\"direct-copy\\\",\\\"asset-reuse\\\",\\\"copyright-leakage\\\"],\\\"safetyNote\\\":\\\"metadata-conditioning-only-no-direct-asset-reuse\\\",\\\"directAssetReuse\\\":false,\\\"sourceImageAppInputJson\\\":\\\"{\\\\\\\"version\\\\\\\":\\\\\\\"v1\\\\\\\",\\\\\\\"queueOrder\\\\\\\":2,\\\\\\\"segmentId\\\\\\\":\\\\\\\"segment-003\\\\\\\",\\\\\\\"promptIntent\\\\\\\":\\\\\\\"frame-resolve|warm-resolution|rhythm-release|low|gentle\\\\\\\",\\\\\\\"continuityAnchor\\\\\\\":\\\\\\\"continuity-anchor-segment-003\\\\\\\",\\\\\\\"characterProfile\\\\\\\":{\\\\\\\"characterDnaId\\\\\\\":\\\\\\\"8a9834562fbc51c12637e7fca78ece90214c54d8eb0f0714d6fea2cd72526fbb\\\\\\\",\\\\\\\"characterKey\\\\\\\":\\\\\\\"gonegi-main\\\\\\\",\\\\\\\"outfitKey\\\\\\\":\\\\\\\"harbor-coat-v1\\\\\\\",\\\\\\\"silhouetteKey\\\\\\\":\\\\\\\"rounded-small-cat\\\\\\\",\\\\\\\"expressionKey\\\\\\\":\\\\\\\"warm-resolve-v1\\\\\\\",\\\\\\\"paletteKey\\\\\\\":\\\\\\\"warm-harbor-evening\\\\\\\",\\\\\\\"emotionalBeat\\\\\\\":\\\\\\\"warm-resolution\\\\\\\"},\\\\\\\"styleProfile\\\\\\\":{\\\\\\\"styleCoreId\\\\\\\":\\\\\\\"d25a2470a4cc8150f7209e6ec3c6650b1715a43843eee83f34110b1a1a8b067c\\\\\\\",\\\\\\\"styleKey\\\\\\\":\\\\\\\"gonegi-warm-cinematic\\\\\\\",\\\\\\\"materialKey\\\\\\\":\\\\\\\"glass-glaze-soft\\\\\\\",\\\\\\\"lightingKey\\\\\\\":\\\\\\\"warm-harbor-golden\\\\\\\",\\\\\\\"paletteKey\\\\\\\":\\\\\\\"warm-harbor-evening\\\\\\\",\\\\\\\"brushworkKey\\\\\\\":\\\\\\\"soft-handpainted-animation\\\\\\\",\\\\\\\"styleStrength\\\\\\\":0.946898},\\\\\\\"rendererInputJson\\\\\\\":\\\\\\\"{\\\\\\\\\\\\\\\"version\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"v1\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"target\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"image-renderer\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"mode\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"image\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"queueOrder\\\\\\\\\\\\\\\":2,\\\\\\\\\\\\\\\"segmentId\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"segment-003\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"promptIntent\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"frame-resolve|warm-resolution|rhythm-release|low|gentle\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"continuityAnchor\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"continuity-anchor-segment-003\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"outputSlot\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"generator-output-slot-segment-003-queue-002\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"adapterHint\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"generic-image-adapter-v1\\\\\\\\\\\\\\\"}\\\\\\\"}\\\"}\"}]}";

export const REFERENCE_CONDITIONED_IMAGE_INPUT_PREVIEW_INPUT = Object.freeze(
  JSON.parse(REFERENCE_CONDITIONED_IMAGE_INPUT_PREVIEW_INPUT_JSON)
) as ReferenceConditionedImageInput;

export const REFERENCE_CONDITIONED_IMAGE_INPUT_PREVIEW_FINGERPRINT =
  "5a3f6a51b18a84feaa04b17b1459e3adf47001002c082e2b4702306b15971955" as const;


export type ReferenceConditionedImageInputPreviewItemCounts = {
  totalItemCount: number;
  conditionedInputCount: number;
  imageQueueItemCount: number;
};

export type ReferenceConditionedImageInputPreviewBlockedUsageItem = {
  queueOrder: number;
  blockedReferenceUse: readonly ReferenceAnchorBlockedUsage[];
};

export type ReferenceConditionedImageInputPreviewBlockedUsageSummary = {
  blockedUsageCatalog: readonly ReferenceAnchorBlockedUsage[];
  enforcedItemCount: number;
  directAssetReuseBlocked: boolean;
  items: readonly ReferenceConditionedImageInputPreviewBlockedUsageItem[];
};

export type ReferenceConditionedImageInputPreview = {
  referenceConditionedImageInput: ReturnType<typeof JSON.parse>;
  fingerprint: string;
  itemCounts: ReferenceConditionedImageInputPreviewItemCounts;
  blockedUsageSummary: ReferenceConditionedImageInputPreviewBlockedUsageSummary;
};

function aggregateBlockedUsageSummary(
  conditionedInput: ReferenceConditionedImageInput
): ReferenceConditionedImageInputPreviewBlockedUsageSummary {
  return Object.freeze({
    blockedUsageCatalog: REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG,
    enforcedItemCount: conditionedInput.totalConditionedInputCount,
    directAssetReuseBlocked: true,
    items: Object.freeze(
      [...conditionedInput.items]
        .sort((a, b) => a.queueOrder - b.queueOrder)
        .map((item) =>
          Object.freeze({
            queueOrder: item.queueOrder,
            blockedReferenceUse: item.blockedReferenceUse,
          })
        )
    ),
  });
}

export function buildReferenceConditionedImageInputPreviewFromInput(
  conditionedInput: ReferenceConditionedImageInput
): ReferenceConditionedImageInputPreview {
  const fingerprint = computeReferenceConditionedImageInputFingerprint(conditionedInput);
  const blockedUsageSummary = aggregateBlockedUsageSummary(conditionedInput);

  return Object.freeze({
    referenceConditionedImageInput: JSON.parse(
      serializeReferenceConditionedImageInput(conditionedInput)
    ),
    fingerprint,
    itemCounts: Object.freeze({
      totalItemCount: conditionedInput.totalConditionedInputCount,
      conditionedInputCount: conditionedInput.totalConditionedInputCount,
      imageQueueItemCount: conditionedInput.totalConditionedInputCount,
    }),
    blockedUsageSummary,
  });
}

export function buildReferenceConditionedImageInputPreview(): ReferenceConditionedImageInputPreview {
  return buildReferenceConditionedImageInputPreviewFromInput(
    REFERENCE_CONDITIONED_IMAGE_INPUT_PREVIEW_INPUT as ReferenceConditionedImageInput
  );
}

export function serializeReferenceConditionedImageInputPreview(
  preview: ReferenceConditionedImageInputPreview
): string {
  return JSON.stringify({
    referenceConditionedImageInput: preview.referenceConditionedImageInput,
    fingerprint: preview.fingerprint,
    itemCounts: preview.itemCounts,
    blockedUsageSummary: preview.blockedUsageSummary,
  });
}
