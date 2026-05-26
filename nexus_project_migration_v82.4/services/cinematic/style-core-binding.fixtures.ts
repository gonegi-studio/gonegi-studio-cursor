import { CHARACTER_DNA_BINDING_OUTPUT_EXAMPLE } from "./character-dna-binding.fixtures.ts";
import {
  buildStyleCoreBinding,
  computeStyleCoreBindingFingerprint,
} from "./style-core-binding.ts";

export const STYLE_CORE_BINDING_INPUT_EXAMPLE = CHARACTER_DNA_BINDING_OUTPUT_EXAMPLE;

export const STYLE_CORE_BINDING_OUTPUT_EXAMPLE = buildStyleCoreBinding(
  STYLE_CORE_BINDING_INPUT_EXAMPLE
);

export const STYLE_CORE_BINDING_FINGERPRINT = computeStyleCoreBindingFingerprint(
  STYLE_CORE_BINDING_OUTPUT_EXAMPLE
);

export const STYLE_CONTINUITY_BINDING_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  continuityAnchor: "continuity-anchor-segment-001",
  styleKey: "gonegi-warm-cinematic",
  materialKey: "glass-glaze-soft",
  lightingKey: "warm-harbor-golden",
  paletteKey: "warm-harbor-evening",
  brushworkKey: "soft-handpainted-animation",
});

export const STYLE_CORE_BINDING_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  bindingId: "style-core-binding-gonegi-harbor-25s-v1",
  bindingVersion: "style-core-binding-v1" as const,
  activeBindingState: "25s-style-core-binding-metadata-only",
  totalStyleContinuityBindingCount: 3,
});
