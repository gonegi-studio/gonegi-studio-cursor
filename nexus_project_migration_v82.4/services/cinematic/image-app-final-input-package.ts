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

const IMAGE_APP_FINAL_INPUT_PREVIEW_PACKAGE_ITEMS = Object.freeze([
  Object.freeze({
    inputPackageId: "49ecdcc00c1bf36ad4ed7437ef47a4a24b2eeeb937b8ce91d6374f187f44acbd",
    queueOrder: 0,
    segmentId: "segment-001",
    promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
    continuityAnchor: "continuity-anchor-segment-001",
    characterProfile: Object.freeze({
      characterDnaId: "a17967f98b582e6de51a846f19cedaf1d925f80f4721f4d5b23c47e32e81fd4b",
      characterKey: "gonegi-main",
      outfitKey: "harbor-coat-v1",
      silhouetteKey: "rounded-small-cat",
      expressionKey: "calm-gaze-v1",
      paletteKey: "warm-harbor-evening",
      emotionalBeat: "nostalgic-calm",
    }),
    styleProfile: Object.freeze({
      styleCoreId: "c9b9ff230d2e64f0085291e4983b97b82b19166285fa367d5ac681b4181ab4f3",
      styleKey: "gonegi-warm-cinematic",
      materialKey: "glass-glaze-soft",
      lightingKey: "warm-harbor-golden",
      paletteKey: "warm-harbor-evening",
      brushworkKey: "soft-handpainted-animation",
      styleStrength: 0.992351,
    }),
    rendererInputJson:
      '{"version":"v1","target":"image-renderer","mode":"image","queueOrder":0,"segmentId":"segment-001","promptIntent":"frame-establish|nostalgic-calm|rhythm-rise|low|soft","continuityAnchor":"continuity-anchor-segment-001","outputSlot":"generator-output-slot-segment-001-queue-000","adapterHint":"generic-image-adapter-v1"}',
    imageAppInputJson:
      '{"version":"v1","queueOrder":0,"segmentId":"segment-001","promptIntent":"frame-establish|nostalgic-calm|rhythm-rise|low|soft","continuityAnchor":"continuity-anchor-segment-001","characterProfile":{"characterDnaId":"a17967f98b582e6de51a846f19cedaf1d925f80f4721f4d5b23c47e32e81fd4b","characterKey":"gonegi-main","outfitKey":"harbor-coat-v1","silhouetteKey":"rounded-small-cat","expressionKey":"calm-gaze-v1","paletteKey":"warm-harbor-evening","emotionalBeat":"nostalgic-calm"},"styleProfile":{"styleCoreId":"c9b9ff230d2e64f0085291e4983b97b82b19166285fa367d5ac681b4181ab4f3","styleKey":"gonegi-warm-cinematic","materialKey":"glass-glaze-soft","lightingKey":"warm-harbor-golden","paletteKey":"warm-harbor-evening","brushworkKey":"soft-handpainted-animation","styleStrength":0.992351},"rendererInputJson":"{\\"version\\":\\"v1\\",\\"target\\":\\"image-renderer\\",\\"mode\\":\\"image\\",\\"queueOrder\\":0,\\"segmentId\\":\\"segment-001\\",\\"promptIntent\\":\\"frame-establish|nostalgic-calm|rhythm-rise|low|soft\\",\\"continuityAnchor\\":\\"continuity-anchor-segment-001\\",\\"outputSlot\\":\\"generator-output-slot-segment-001-queue-000\\",\\"adapterHint\\":\\"generic-image-adapter-v1\\"}"}',
    inputItemFingerprint: "bba12406e655f83b54d7c9fb0cde300fcad14f300f0ead257742321511909eca",
  }),
  Object.freeze({
    inputPackageId: "c00de0ae954db05b3a2d439307010f71b1c847dc8c36de7a3485e9a4b98bd5f0",
    queueOrder: 1,
    segmentId: "segment-002",
    promptIntent: "frame-bridge|reflective-bridge|rhythm-hold|medium|moderate",
    continuityAnchor: "continuity-anchor-segment-002",
    characterProfile: Object.freeze({
      characterDnaId: "041243c64162ff353a8080bc893b129276cdb7bb2892dc733f28b66b07dd7aa2",
      characterKey: "gonegi-main",
      outfitKey: "harbor-coat-v1",
      silhouetteKey: "rounded-small-cat",
      expressionKey: "reflective-bridge-v1",
      paletteKey: "warm-harbor-evening",
      emotionalBeat: "reflective-bridge",
    }),
    styleProfile: Object.freeze({
      styleCoreId: "39f9579d4d7d691f193fc5215e291580e2a4fcef81f0ce0e5d048515a5d2cd18",
      styleKey: "gonegi-warm-cinematic",
      materialKey: "glass-glaze-soft",
      lightingKey: "warm-harbor-golden",
      paletteKey: "warm-harbor-evening",
      brushworkKey: "soft-handpainted-animation",
      styleStrength: 0.990196,
    }),
    rendererInputJson:
      '{"version":"v1","target":"image-renderer","mode":"image","queueOrder":1,"segmentId":"segment-002","promptIntent":"frame-bridge|reflective-bridge|rhythm-hold|medium|moderate","continuityAnchor":"continuity-anchor-segment-002","outputSlot":"generator-output-slot-segment-002-queue-001","adapterHint":"generic-image-adapter-v1"}',
    imageAppInputJson:
      '{"version":"v1","queueOrder":1,"segmentId":"segment-002","promptIntent":"frame-bridge|reflective-bridge|rhythm-hold|medium|moderate","continuityAnchor":"continuity-anchor-segment-002","characterProfile":{"characterDnaId":"041243c64162ff353a8080bc893b129276cdb7bb2892dc733f28b66b07dd7aa2","characterKey":"gonegi-main","outfitKey":"harbor-coat-v1","silhouetteKey":"rounded-small-cat","expressionKey":"reflective-bridge-v1","paletteKey":"warm-harbor-evening","emotionalBeat":"reflective-bridge"},"styleProfile":{"styleCoreId":"39f9579d4d7d691f193fc5215e291580e2a4fcef81f0ce0e5d048515a5d2cd18","styleKey":"gonegi-warm-cinematic","materialKey":"glass-glaze-soft","lightingKey":"warm-harbor-golden","paletteKey":"warm-harbor-evening","brushworkKey":"soft-handpainted-animation","styleStrength":0.990196},"rendererInputJson":"{\\"version\\":\\"v1\\",\\"target\\":\\"image-renderer\\",\\"mode\\":\\"image\\",\\"queueOrder\\":1,\\"segmentId\\":\\"segment-002\\",\\"promptIntent\\":\\"frame-bridge|reflective-bridge|rhythm-hold|medium|moderate\\",\\"continuityAnchor\\":\\"continuity-anchor-segment-002\\",\\"outputSlot\\":\\"generator-output-slot-segment-002-queue-001\\",\\"adapterHint\\":\\"generic-image-adapter-v1\\"}"}',
    inputItemFingerprint: "5dfbb94a916fba060b1e14436355389c97bc17581aef426b10a7ede2efbc89fc",
  }),
  Object.freeze({
    inputPackageId: "19efbf3876b1cc7c5f754e0018f5bbd6f1888278e22884de30030cfcae6ce780",
    queueOrder: 2,
    segmentId: "segment-003",
    promptIntent: "frame-resolve|warm-resolution|rhythm-release|low|gentle",
    continuityAnchor: "continuity-anchor-segment-003",
    characterProfile: Object.freeze({
      characterDnaId: "8a9834562fbc51c12637e7fca78ece90214c54d8eb0f0714d6fea2cd72526fbb",
      characterKey: "gonegi-main",
      outfitKey: "harbor-coat-v1",
      silhouetteKey: "rounded-small-cat",
      expressionKey: "warm-resolve-v1",
      paletteKey: "warm-harbor-evening",
      emotionalBeat: "warm-resolution",
    }),
    styleProfile: Object.freeze({
      styleCoreId: "d25a2470a4cc8150f7209e6ec3c6650b1715a43843eee83f34110b1a1a8b067c",
      styleKey: "gonegi-warm-cinematic",
      materialKey: "glass-glaze-soft",
      lightingKey: "warm-harbor-golden",
      paletteKey: "warm-harbor-evening",
      brushworkKey: "soft-handpainted-animation",
      styleStrength: 0.946898,
    }),
    rendererInputJson:
      '{"version":"v1","target":"image-renderer","mode":"image","queueOrder":2,"segmentId":"segment-003","promptIntent":"frame-resolve|warm-resolution|rhythm-release|low|gentle","continuityAnchor":"continuity-anchor-segment-003","outputSlot":"generator-output-slot-segment-003-queue-002","adapterHint":"generic-image-adapter-v1"}',
    imageAppInputJson:
      '{"version":"v1","queueOrder":2,"segmentId":"segment-003","promptIntent":"frame-resolve|warm-resolution|rhythm-release|low|gentle","continuityAnchor":"continuity-anchor-segment-003","characterProfile":{"characterDnaId":"8a9834562fbc51c12637e7fca78ece90214c54d8eb0f0714d6fea2cd72526fbb","characterKey":"gonegi-main","outfitKey":"harbor-coat-v1","silhouetteKey":"rounded-small-cat","expressionKey":"warm-resolve-v1","paletteKey":"warm-harbor-evening","emotionalBeat":"warm-resolution"},"styleProfile":{"styleCoreId":"d25a2470a4cc8150f7209e6ec3c6650b1715a43843eee83f34110b1a1a8b067c","styleKey":"gonegi-warm-cinematic","materialKey":"glass-glaze-soft","lightingKey":"warm-harbor-golden","paletteKey":"warm-harbor-evening","brushworkKey":"soft-handpainted-animation","styleStrength":0.946898},"rendererInputJson":"{\\"version\\":\\"v1\\",\\"target\\":\\"image-renderer\\",\\"mode\\":\\"image\\",\\"queueOrder\\":2,\\"segmentId\\":\\"segment-003\\",\\"promptIntent\\":\\"frame-resolve|warm-resolution|rhythm-release|low|gentle\\",\\"continuityAnchor\\":\\"continuity-anchor-segment-003\\",\\"outputSlot\\":\\"generator-output-slot-segment-003-queue-002\\",\\"adapterHint\\":\\"generic-image-adapter-v1\\"}"}',
    inputItemFingerprint: "92d1e06c6f8c8ae9596352a791eee4e3898d2a21ce85b374f14eba702c56f779",
  }),
] as const);

export const IMAGE_APP_FINAL_INPUT_PREVIEW_PACKAGE = Object.freeze({
  version: IMAGE_APP_FINAL_INPUT_PACKAGE_VERSION,
  packageId: IMAGE_APP_FINAL_INPUT_PACKAGE_ID,
  styleCoreBindingId: "style-core-binding-gonegi-harbor-25s-v1",
  styleCoreBindingFingerprint:
    "8c71299cd004f02a9a0c5cbbb09894c0a9b5201a30f5ad4c7fa48c5988adb1c6",
  characterDnaBindingFingerprint:
    "99b22da934da16f6bcb4a30bfd5d100778efce9d99f5ad1bd15acb7ab5f56022",
  sourceFingerprint: "3397ecf7c62f94a60c8b05d175db34404150c707b3e8b3525acfdd5eae659589",
  packageVersion: IMAGE_APP_FINAL_INPUT_PACKAGE_KIND_VERSION,
  activePackageState: IMAGE_APP_FINAL_INPUT_PACKAGE_STATE,
  totalInputItemCount: 3,
  items: IMAGE_APP_FINAL_INPUT_PREVIEW_PACKAGE_ITEMS,
});

export const IMAGE_APP_FINAL_INPUT_PREVIEW_FINGERPRINT =
  "649b5b2cfed900a56ed5cdf3d1253ae65dfc2c7fbcfb116396b44748d9764d02" as const;

export type ImageAppFinalInputPreviewItemCounts = {
  totalItemCount: number;
  imageQueueItemCount: number;
};

export type ImageAppFinalInputPreview = {
  imageAppFinalInputPackage: ReturnType<typeof JSON.parse>;
  fingerprint: string;
  itemCounts: ImageAppFinalInputPreviewItemCounts;
  characterProfile: ReturnType<typeof JSON.parse>;
  styleProfile: ReturnType<typeof JSON.parse>;
};

function partitionImageAppFinalInputPreviewProfiles(inputPackage: ImageAppFinalInputPackage): {
  characterProfile: readonly ImageAppFinalInputCharacterProfile[];
  styleProfile: readonly ImageAppFinalInputStyleProfile[];
} {
  const orderedItems = [...inputPackage.items].sort((a, b) => a.queueOrder - b.queueOrder);
  return Object.freeze({
    characterProfile: Object.freeze(orderedItems.map((item) => item.characterProfile)),
    styleProfile: Object.freeze(orderedItems.map((item) => item.styleProfile)),
  });
}

export function buildImageAppFinalInputPreviewFromPackage(
  inputPackage: ImageAppFinalInputPackage
): ImageAppFinalInputPreview {
  const fingerprint = computeImageAppFinalInputPackageFingerprint(inputPackage);
  const { characterProfile, styleProfile } = partitionImageAppFinalInputPreviewProfiles(inputPackage);

  return Object.freeze({
    imageAppFinalInputPackage: JSON.parse(serializeImageAppFinalInputPackage(inputPackage)),
    fingerprint,
    itemCounts: Object.freeze({
      totalItemCount: inputPackage.totalInputItemCount,
      imageQueueItemCount: inputPackage.totalInputItemCount,
    }),
    characterProfile: JSON.parse(
      JSON.stringify(
        [...characterProfile].map((item) =>
          orderRecord(item, IMAGE_APP_FINAL_INPUT_CHARACTER_PROFILE_KEY_ORDER)
        )
      )
    ),
    styleProfile: JSON.parse(
      JSON.stringify(
        [...styleProfile].map((item) =>
          orderRecord(item, IMAGE_APP_FINAL_INPUT_STYLE_PROFILE_KEY_ORDER)
        )
      )
    ),
  });
}

export function buildImageAppFinalInputPreview(): ImageAppFinalInputPreview {
  return buildImageAppFinalInputPreviewFromPackage(IMAGE_APP_FINAL_INPUT_PREVIEW_PACKAGE);
}

export function serializeImageAppFinalInputPreview(preview: ImageAppFinalInputPreview): string {
  return JSON.stringify({
    imageAppFinalInputPackage: preview.imageAppFinalInputPackage,
    fingerprint: preview.fingerprint,
    itemCounts: preview.itemCounts,
    characterProfile: preview.characterProfile,
    styleProfile: preview.styleProfile,
  });
}
