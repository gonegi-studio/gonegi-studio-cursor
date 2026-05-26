import { IMAGE_REGENERATION_REQUEST_OUTPUT_EXAMPLE } from "./image-regeneration-request.fixtures.ts";
import {
  buildRegenerationImageAppInput,
  computeRegenerationImageAppInputFingerprint,
} from "./regeneration-image-app-input.ts";

export const REGENERATION_IMAGE_APP_INPUT_INPUT_EXAMPLE =
  IMAGE_REGENERATION_REQUEST_OUTPUT_EXAMPLE;

export const REGENERATION_IMAGE_APP_INPUT_OUTPUT_EXAMPLE = buildRegenerationImageAppInput(
  REGENERATION_IMAGE_APP_INPUT_INPUT_EXAMPLE
);

export const REGENERATION_IMAGE_APP_INPUT_FINGERPRINT =
  computeRegenerationImageAppInputFingerprint(
    REGENERATION_IMAGE_APP_INPUT_OUTPUT_EXAMPLE
  );

export const REGENERATION_IMAGE_APP_INPUT_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 1,
  segmentId: "segment-002",
  regenerationRequestId:
    REGENERATION_IMAGE_APP_INPUT_OUTPUT_EXAMPLE.items[0]?.regenerationRequestId,
  continuityAnchor: "continuity-anchor-segment-002",
  promptAdjustmentHint: "maintain-prompt-anchor-adjust-character-style",
  priority: "high" as const,
});

export const REGENERATION_IMAGE_APP_INPUT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  inputId: "regeneration-image-app-input-gonegi-harbor-25s-v1",
  inputVersion: "regeneration-image-app-input-v1" as const,
  activeInputState: "25s-regeneration-image-app-input-metadata-only",
  totalRegenerationInputCount: 2,
});
