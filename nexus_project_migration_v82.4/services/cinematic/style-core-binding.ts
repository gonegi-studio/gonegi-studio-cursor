import crypto from "crypto";
import type { CharacterDnaBinding } from "./character-dna-binding.ts";
import { computeCharacterDnaBindingFingerprint } from "./character-dna-binding.ts";

export type StyleCoreProfile = {
  styleKey: string;
  materialKey: string;
  lightingKey: string;
  brushworkKey: string;
};

export type StyleContinuityBinding = {
  styleCoreId: string;
  queueOrder: number;
  segmentId: string;
  characterDnaId: string;
  continuityAnchor: string;
  styleKey: string;
  materialKey: string;
  lightingKey: string;
  paletteKey: string;
  brushworkKey: string;
  styleStrength: number;
  rendererInputJson: string;
  styleContinuityBindingFingerprint: string;
};

export type StyleCoreBinding = {
  version: "v1";
  bindingId: string;
  characterDnaBindingId: string;
  characterDnaBindingFingerprint: string;
  sourceFingerprint: string;
  styleCoreProfile: StyleCoreProfile;
  bindingVersion: typeof STYLE_CORE_BINDING_KIND_VERSION;
  activeBindingState: string;
  totalStyleContinuityBindingCount: number;
  items: readonly StyleContinuityBinding[];
};

export const STYLE_CORE_BINDING_VERSION = "v1" as const;
export const STYLE_CORE_BINDING_ID = "style-core-binding-gonegi-harbor-25s-v1" as const;
export const STYLE_CORE_BINDING_STATE = "25s-style-core-binding-metadata-only" as const;
export const STYLE_CORE_BINDING_KIND_VERSION = "style-core-binding-v1" as const;

export const STYLE_CORE_CANONICAL_PROFILE = Object.freeze({
  styleKey: "gonegi-warm-cinematic",
  materialKey: "glass-glaze-soft",
  lightingKey: "warm-harbor-golden",
  brushworkKey: "soft-handpainted-animation",
});

const FRAME_EXPORT_QUEUE_MAX = 2;

let cachedStyleCoreBinding: StyleCoreBinding | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computeStyleStrength(queueOrder: number, styleKey: string): number {
  const digest = digestValue(
    [STYLE_CORE_BINDING_KIND_VERSION, "style-strength", String(queueOrder), styleKey].join("|")
  );
  const mantissa = parseInt(digest.slice(0, 6), 16) % 1_000_000;
  return Number((0.900000 + mantissa / 10_000_000).toFixed(6));
}

function computeStyleCoreId(
  queueOrder: number,
  characterDnaId: string,
  styleKey: string
): string {
  return digestValue(
    [
      STYLE_CORE_BINDING_KIND_VERSION,
      "style-core-item",
      String(queueOrder),
      characterDnaId,
      styleKey,
    ].join("|")
  );
}

function computeStyleContinuityBindingFingerprint(
  item: Omit<StyleContinuityBinding, "styleContinuityBindingFingerprint">
): string {
  return digestValue(
    [
      STYLE_CORE_BINDING_KIND_VERSION,
      item.styleCoreId,
      String(item.queueOrder),
      item.segmentId,
      item.characterDnaId,
      item.continuityAnchor,
      item.styleKey,
      item.materialKey,
      item.lightingKey,
      item.paletteKey,
      item.brushworkKey,
      String(item.styleStrength),
      item.rendererInputJson,
    ].join("|")
  );
}

function buildStyleContinuityBindingItem(
  characterItem: CharacterDnaBinding["items"][number],
  profile: StyleCoreProfile
): StyleContinuityBinding {
  const baseItem: Omit<StyleContinuityBinding, "styleContinuityBindingFingerprint"> = {
    styleCoreId: computeStyleCoreId(characterItem.queueOrder, characterItem.characterDnaId, profile.styleKey),
    queueOrder: characterItem.queueOrder,
    segmentId: characterItem.segmentId,
    characterDnaId: characterItem.characterDnaId,
    continuityAnchor: characterItem.continuityAnchor,
    styleKey: profile.styleKey,
    materialKey: profile.materialKey,
    lightingKey: profile.lightingKey,
    paletteKey: characterItem.paletteKey,
    brushworkKey: profile.brushworkKey,
    styleStrength: computeStyleStrength(characterItem.queueOrder, profile.styleKey),
    rendererInputJson: characterItem.rendererInputJson,
  };

  return Object.freeze({
    ...baseItem,
    styleContinuityBindingFingerprint: computeStyleContinuityBindingFingerprint(baseItem),
  });
}

export function buildStyleCoreBinding(characterDnaBinding: CharacterDnaBinding): StyleCoreBinding {
  if (cachedStyleCoreBinding !== null) {
    return cachedStyleCoreBinding;
  }

  const characterDnaBindingFingerprint = computeCharacterDnaBindingFingerprint(characterDnaBinding);
  const orderedCharacterItems = [...characterDnaBinding.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedCharacterItems.length !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Style core binding requires three character continuity items");
  }

  const items = Object.freeze(
    orderedCharacterItems.map((characterItem) =>
      buildStyleContinuityBindingItem(characterItem, STYLE_CORE_CANONICAL_PROFILE)
    )
  );

  const binding = Object.freeze({
    version: STYLE_CORE_BINDING_VERSION,
    bindingId: STYLE_CORE_BINDING_ID,
    characterDnaBindingId: characterDnaBinding.bindingId,
    characterDnaBindingFingerprint,
    sourceFingerprint: characterDnaBinding.sourceFingerprint,
    styleCoreProfile: STYLE_CORE_CANONICAL_PROFILE,
    bindingVersion: STYLE_CORE_BINDING_KIND_VERSION,
    activeBindingState: STYLE_CORE_BINDING_STATE,
    totalStyleContinuityBindingCount: items.length,
    items,
  });

  cachedStyleCoreBinding = binding;
  return binding;
}

export const STYLE_CONTINUITY_BINDING_KEY_ORDER = Object.freeze([
  "styleCoreId",
  "queueOrder",
  "segmentId",
  "characterDnaId",
  "continuityAnchor",
  "styleKey",
  "materialKey",
  "lightingKey",
  "paletteKey",
  "brushworkKey",
  "styleStrength",
  "rendererInputJson",
  "styleContinuityBindingFingerprint",
] as const);

export const STYLE_CORE_PROFILE_KEY_ORDER = Object.freeze([
  "styleKey",
  "materialKey",
  "lightingKey",
  "brushworkKey",
] as const);

export const STYLE_CORE_BINDING_KEY_ORDER = Object.freeze([
  "version",
  "bindingId",
  "characterDnaBindingId",
  "characterDnaBindingFingerprint",
  "sourceFingerprint",
  "styleCoreProfile",
  "bindingVersion",
  "activeBindingState",
  "totalStyleContinuityBindingCount",
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

export function serializeStyleCoreBinding(binding: StyleCoreBinding): string {
  const orderedItems = [...binding.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, STYLE_CONTINUITY_BINDING_KEY_ORDER));

  const orderedBinding: Record<string, unknown> = {};
  for (const key of STYLE_CORE_BINDING_KEY_ORDER) {
    if (key === "items") {
      orderedBinding.items = orderedItems;
    } else if (key === "styleCoreProfile") {
      orderedBinding.styleCoreProfile = orderRecord(
        binding.styleCoreProfile,
        STYLE_CORE_PROFILE_KEY_ORDER
      );
    } else {
      orderedBinding[key] = binding[key as keyof StyleCoreBinding];
    }
  }

  return JSON.stringify(orderedBinding);
}

export function computeStyleCoreBindingFingerprint(binding: StyleCoreBinding): string {
  return digestValue(serializeStyleCoreBinding(binding));
}

export function resetStyleCoreBindingCacheForVerification(): void {
  cachedStyleCoreBinding = null;
}
