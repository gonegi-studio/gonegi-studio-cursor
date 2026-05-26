import { STYLE_CORE_BINDING_OUTPUT_EXAMPLE } from "./style-core-binding.fixtures.ts";
import {
  buildImageAppFinalInputPackage,
  computeImageAppFinalInputPackageFingerprint,
} from "./image-app-final-input-package.ts";

export const IMAGE_APP_FINAL_INPUT_PACKAGE_INPUT_EXAMPLE = STYLE_CORE_BINDING_OUTPUT_EXAMPLE;

export const IMAGE_APP_FINAL_INPUT_PACKAGE_OUTPUT_EXAMPLE = buildImageAppFinalInputPackage(
  IMAGE_APP_FINAL_INPUT_PACKAGE_INPUT_EXAMPLE
);

export const IMAGE_APP_FINAL_INPUT_PACKAGE_FINGERPRINT = computeImageAppFinalInputPackageFingerprint(
  IMAGE_APP_FINAL_INPUT_PACKAGE_OUTPUT_EXAMPLE
);

export const IMAGE_APP_FINAL_INPUT_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
  continuityAnchor: "continuity-anchor-segment-001",
  characterProfile: Object.freeze({
    characterKey: "gonegi-main",
    outfitKey: "harbor-coat-v1",
    silhouetteKey: "rounded-small-cat",
    expressionKey: "calm-gaze-v1",
    paletteKey: "warm-harbor-evening",
    emotionalBeat: "nostalgic-calm",
  }),
  styleProfile: Object.freeze({
    styleKey: "gonegi-warm-cinematic",
    materialKey: "glass-glaze-soft",
    lightingKey: "warm-harbor-golden",
    paletteKey: "warm-harbor-evening",
    brushworkKey: "soft-handpainted-animation",
  }),
});

export const IMAGE_APP_FINAL_INPUT_PACKAGE_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  packageId: "image-app-final-input-package-gonegi-harbor-25s-v1",
  packageVersion: "image-app-final-input-package-v1" as const,
  activePackageState: "25s-image-app-final-input-package-metadata-only",
  totalInputItemCount: 3,
});
