import { IMAGE_APP_FINAL_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./image-app-final-input-package.fixtures.ts";
import { REFERENCE_GUIDED_PROMPT_CONDITIONING_OUTPUT_EXAMPLE } from "./reference-guided-prompt-conditioning.fixtures.ts";
import {
  buildReferenceConditionedImageInput,
  computeReferenceConditionedImageInputFingerprint,
} from "./reference-conditioned-image-input.ts";

export const REFERENCE_CONDITIONED_IMAGE_INPUT_INPUT_EXAMPLE = Object.freeze({
  imageAppFinalInputPackage: IMAGE_APP_FINAL_INPUT_PACKAGE_OUTPUT_EXAMPLE,
  referenceGuidedPromptConditioning: REFERENCE_GUIDED_PROMPT_CONDITIONING_OUTPUT_EXAMPLE,
});

export const REFERENCE_CONDITIONED_IMAGE_INPUT_OUTPUT_EXAMPLE = buildReferenceConditionedImageInput(
  REFERENCE_CONDITIONED_IMAGE_INPUT_INPUT_EXAMPLE.imageAppFinalInputPackage,
  REFERENCE_CONDITIONED_IMAGE_INPUT_INPUT_EXAMPLE.referenceGuidedPromptConditioning
);

export const REFERENCE_CONDITIONED_IMAGE_INPUT_FINGERPRINT =
  computeReferenceConditionedImageInputFingerprint(
    REFERENCE_CONDITIONED_IMAGE_INPUT_OUTPUT_EXAMPLE
  );

export const REFERENCE_CONDITIONED_IMAGE_INPUT_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
  continuityAnchor: "continuity-anchor-segment-001",
  allowedReferenceUse: Object.freeze(["style-reference", "prompt-conditioning"]),
  blockedReferenceUse: Object.freeze(["direct-copy", "asset-reuse", "copyright-leakage"]),
});

export const REFERENCE_CONDITIONED_IMAGE_INPUT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  conditionedInputRootId: "reference-conditioned-image-input-gonegi-harbor-25s-v1",
  conditionedInputVersion: "reference-conditioned-image-input-v1" as const,
  activeConditionedInputState: "25s-reference-conditioned-image-input-metadata-only",
  totalConditionedInputCount: 3,
  queueOrderSequence: Object.freeze([0, 1, 2]),
});
