import crypto from "crypto";
import type { ImageAppDatasetJsonBridge } from "./image-app-dataset-json-bridge.ts";
import { computeImageAppDatasetJsonBridgeFingerprint } from "./image-app-dataset-json-bridge.ts";

export type CharacterDnaProfile = {
  characterKey: string;
  outfitKey: string;
  silhouetteKey: string;
  paletteKey: string;
};

export type CharacterContinuityBinding = {
  characterDnaId: string;
  queueOrder: number;
  segmentId: string;
  continuityAnchor: string;
  characterKey: string;
  outfitKey: string;
  silhouetteKey: string;
  expressionKey: string;
  paletteKey: string;
  continuityStrength: number;
  emotionalBeat: string;
  promptIntent: string;
  rendererInputJson: string;
  continuityBindingFingerprint: string;
};

export type CharacterDnaBinding = {
  version: "v1";
  bindingId: string;
  imageAppDatasetJsonBridgeId: string;
  imageAppDatasetJsonBridgeFingerprint: string;
  sourceFingerprint: string;
  characterDnaProfile: CharacterDnaProfile;
  bindingVersion: typeof CHARACTER_DNA_BINDING_KIND_VERSION;
  activeBindingState: string;
  totalContinuityBindingCount: number;
  items: readonly CharacterContinuityBinding[];
};

export const CHARACTER_DNA_BINDING_VERSION = "v1" as const;
export const CHARACTER_DNA_BINDING_ID = "character-dna-binding-gonegi-harbor-25s-v1" as const;
export const CHARACTER_DNA_BINDING_STATE = "25s-character-dna-binding-metadata-only" as const;
export const CHARACTER_DNA_BINDING_KIND_VERSION = "character-dna-binding-v1" as const;

export const CHARACTER_DNA_CANONICAL_PROFILE = Object.freeze({
  characterKey: "gonegi-main",
  outfitKey: "harbor-coat-v1",
  silhouetteKey: "rounded-small-cat",
  paletteKey: "warm-harbor-evening",
});

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

let cachedCharacterDnaBinding: CharacterDnaBinding | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveCharacterExpression(queueOrder: number) {
  const expression = CHARACTER_EXPRESSION_BY_QUEUE.find((item) => item.queueOrder === queueOrder);
  if (expression === undefined) {
    throw new Error("Character dna binding requires a frame expression definition");
  }
  return expression;
}

function computeContinuityStrength(queueOrder: number, characterKey: string): number {
  const digest = digestValue(
    [CHARACTER_DNA_BINDING_KIND_VERSION, "continuity-strength", String(queueOrder), characterKey].join(
      "|"
    )
  );
  const mantissa = parseInt(digest.slice(0, 6), 16) % 1_000_000;
  return Number((0.880000 + mantissa / 10_000_000).toFixed(6));
}

function computeCharacterDnaId(
  queueOrder: number,
  bridgeId: string,
  characterKey: string
): string {
  return digestValue(
    [
      CHARACTER_DNA_BINDING_KIND_VERSION,
      "character-dna-item",
      String(queueOrder),
      bridgeId,
      characterKey,
    ].join("|")
  );
}

function computeContinuityBindingFingerprint(
  item: Omit<CharacterContinuityBinding, "continuityBindingFingerprint">
): string {
  return digestValue(
    [
      CHARACTER_DNA_BINDING_KIND_VERSION,
      item.characterDnaId,
      String(item.queueOrder),
      item.segmentId,
      item.continuityAnchor,
      item.characterKey,
      item.outfitKey,
      item.silhouetteKey,
      item.expressionKey,
      item.paletteKey,
      String(item.continuityStrength),
      item.emotionalBeat,
      item.promptIntent,
      item.rendererInputJson,
    ].join("|")
  );
}

function buildCharacterContinuityBindingItem(
  bridgeItem: ImageAppDatasetJsonBridge["items"][number],
  profile: CharacterDnaProfile
): CharacterContinuityBinding {
  const expression = resolveCharacterExpression(bridgeItem.queueOrder);

  const baseItem: Omit<CharacterContinuityBinding, "continuityBindingFingerprint"> = {
    characterDnaId: computeCharacterDnaId(
      bridgeItem.queueOrder,
      bridgeItem.bridgeId,
      profile.characterKey
    ),
    queueOrder: bridgeItem.queueOrder,
    segmentId: bridgeItem.segmentId,
    continuityAnchor: bridgeItem.continuityAnchor,
    characterKey: profile.characterKey,
    outfitKey: profile.outfitKey,
    silhouetteKey: profile.silhouetteKey,
    expressionKey: expression.expressionKey,
    paletteKey: profile.paletteKey,
    continuityStrength: computeContinuityStrength(bridgeItem.queueOrder, profile.characterKey),
    emotionalBeat: expression.emotionalBeat,
    promptIntent: bridgeItem.promptIntent,
    rendererInputJson: bridgeItem.rendererInputJson,
  };

  return Object.freeze({
    ...baseItem,
    continuityBindingFingerprint: computeContinuityBindingFingerprint(baseItem),
  });
}

export function buildCharacterDnaBinding(
  imageAppDatasetJsonBridge: ImageAppDatasetJsonBridge
): CharacterDnaBinding {
  if (cachedCharacterDnaBinding !== null) {
    return cachedCharacterDnaBinding;
  }

  const imageAppDatasetJsonBridgeFingerprint = computeImageAppDatasetJsonBridgeFingerprint(
    imageAppDatasetJsonBridge
  );
  const orderedBridgeItems = [...imageAppDatasetJsonBridge.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedBridgeItems.length !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Character dna binding requires three image bridge items");
  }

  const items = Object.freeze(
    orderedBridgeItems.map((bridgeItem) =>
      buildCharacterContinuityBindingItem(bridgeItem, CHARACTER_DNA_CANONICAL_PROFILE)
    )
  );

  const binding = Object.freeze({
    version: CHARACTER_DNA_BINDING_VERSION,
    bindingId: CHARACTER_DNA_BINDING_ID,
    imageAppDatasetJsonBridgeId: imageAppDatasetJsonBridge.imageAppDatasetJsonBridgeId,
    imageAppDatasetJsonBridgeFingerprint,
    sourceFingerprint: imageAppDatasetJsonBridge.sourceFingerprint,
    characterDnaProfile: CHARACTER_DNA_CANONICAL_PROFILE,
    bindingVersion: CHARACTER_DNA_BINDING_KIND_VERSION,
    activeBindingState: CHARACTER_DNA_BINDING_STATE,
    totalContinuityBindingCount: items.length,
    items,
  });

  cachedCharacterDnaBinding = binding;
  return binding;
}

export const CHARACTER_CONTINUITY_BINDING_KEY_ORDER = Object.freeze([
  "characterDnaId",
  "queueOrder",
  "segmentId",
  "continuityAnchor",
  "characterKey",
  "outfitKey",
  "silhouetteKey",
  "expressionKey",
  "paletteKey",
  "continuityStrength",
  "emotionalBeat",
  "promptIntent",
  "rendererInputJson",
  "continuityBindingFingerprint",
] as const);

export const CHARACTER_DNA_PROFILE_KEY_ORDER = Object.freeze([
  "characterKey",
  "outfitKey",
  "silhouetteKey",
  "paletteKey",
] as const);

export const CHARACTER_DNA_BINDING_KEY_ORDER = Object.freeze([
  "version",
  "bindingId",
  "imageAppDatasetJsonBridgeId",
  "imageAppDatasetJsonBridgeFingerprint",
  "sourceFingerprint",
  "characterDnaProfile",
  "bindingVersion",
  "activeBindingState",
  "totalContinuityBindingCount",
  "items",
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

export function serializeCharacterDnaBinding(binding: CharacterDnaBinding): string {
  const orderedItems = [...binding.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, CHARACTER_CONTINUITY_BINDING_KEY_ORDER));

  const orderedBinding: Record<string, unknown> = {};
  for (const key of CHARACTER_DNA_BINDING_KEY_ORDER) {
    if (key === "items") {
      orderedBinding.items = orderedItems;
    } else if (key === "characterDnaProfile") {
      orderedBinding.characterDnaProfile = orderRecord(
        binding.characterDnaProfile,
        CHARACTER_DNA_PROFILE_KEY_ORDER
      );
    } else {
      orderedBinding[key] = binding[key as keyof CharacterDnaBinding];
    }
  }

  return JSON.stringify(orderedBinding);
}

export function computeCharacterDnaBindingFingerprint(binding: CharacterDnaBinding): string {
  return digestValue(serializeCharacterDnaBinding(binding));
}

export function resetCharacterDnaBindingCacheForVerification(): void {
  cachedCharacterDnaBinding = null;
}
