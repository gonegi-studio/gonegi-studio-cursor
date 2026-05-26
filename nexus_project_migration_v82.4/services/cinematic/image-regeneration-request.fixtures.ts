import { MANUAL_IMAGE_REVIEW_FEEDBACK_OUTPUT_EXAMPLE } from "./manual-image-review-feedback.fixtures.ts";
import {
  buildImageRegenerationRequest,
  computeImageRegenerationRequestFingerprint,
} from "./image-regeneration-request.ts";

export const IMAGE_REGENERATION_REQUEST_INPUT_EXAMPLE =
  MANUAL_IMAGE_REVIEW_FEEDBACK_OUTPUT_EXAMPLE;

export const IMAGE_REGENERATION_REQUEST_OUTPUT_EXAMPLE = buildImageRegenerationRequest(
  IMAGE_REGENERATION_REQUEST_INPUT_EXAMPLE
);

export const IMAGE_REGENERATION_REQUEST_FINGERPRINT = computeImageRegenerationRequestFingerprint(
  IMAGE_REGENERATION_REQUEST_OUTPUT_EXAMPLE
);

export const IMAGE_REGENERATION_REQUEST_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 1,
  segmentId: "segment-002",
  reviewId: IMAGE_REGENERATION_REQUEST_OUTPUT_EXAMPLE.items[0]?.reviewId,
  generatedEvidenceId:
    IMAGE_REGENERATION_REQUEST_OUTPUT_EXAMPLE.items[0]?.generatedEvidenceId,
  reason: "manual-character-style-continuity-review-required",
  priority: "high" as const,
  promptAdjustmentHint: "maintain-prompt-anchor-adjust-character-style",
  continuityAnchor: "continuity-anchor-segment-002",
});

export const IMAGE_REGENERATION_REQUEST_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  requestId: "image-regeneration-request-gonegi-harbor-25s-v1",
  requestVersion: "image-regeneration-request-v1" as const,
  activeRequestState: "25s-image-regeneration-request-metadata-only",
  totalRegenerationRequestCount: 2,
});
