import { IMAGE_APP_DATASET_JSON_BRIDGE_OUTPUT_EXAMPLE } from "./image-app-dataset-json-bridge.fixtures.ts";
import {
  buildCharacterDnaBinding,
  computeCharacterDnaBindingFingerprint,
} from "./character-dna-binding.ts";

export const CHARACTER_DNA_BINDING_INPUT_EXAMPLE = IMAGE_APP_DATASET_JSON_BRIDGE_OUTPUT_EXAMPLE;

export const CHARACTER_DNA_BINDING_OUTPUT_EXAMPLE = buildCharacterDnaBinding(
  CHARACTER_DNA_BINDING_INPUT_EXAMPLE
);

export const CHARACTER_DNA_BINDING_FINGERPRINT = computeCharacterDnaBindingFingerprint(
  CHARACTER_DNA_BINDING_OUTPUT_EXAMPLE
);

export const CHARACTER_CONTINUITY_BINDING_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  continuityAnchor: "continuity-anchor-segment-001",
  characterKey: "gonegi-main",
  outfitKey: "harbor-coat-v1",
  silhouetteKey: "rounded-small-cat",
  expressionKey: "calm-gaze-v1",
  paletteKey: "warm-harbor-evening",
  emotionalBeat: "nostalgic-calm",
  promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
});

export const CHARACTER_DNA_BINDING_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  bindingId: "character-dna-binding-gonegi-harbor-25s-v1",
  bindingVersion: "character-dna-binding-v1" as const,
  activeBindingState: "25s-character-dna-binding-metadata-only",
  totalContinuityBindingCount: 3,
});
