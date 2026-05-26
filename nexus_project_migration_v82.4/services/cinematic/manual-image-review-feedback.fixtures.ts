import { IMAGE_CONTINUITY_EVALUATION_OUTPUT_EXAMPLE } from "./image-continuity-evaluation.fixtures.ts";
import {
  buildManualImageReviewFeedback,
  computeManualImageReviewFeedbackFingerprint,
} from "./manual-image-review-feedback.ts";

export const MANUAL_IMAGE_REVIEW_FEEDBACK_INPUT_EXAMPLE =
  IMAGE_CONTINUITY_EVALUATION_OUTPUT_EXAMPLE;

export const MANUAL_IMAGE_REVIEW_FEEDBACK_OUTPUT_EXAMPLE = buildManualImageReviewFeedback(
  MANUAL_IMAGE_REVIEW_FEEDBACK_INPUT_EXAMPLE
);

export const MANUAL_IMAGE_REVIEW_FEEDBACK_FINGERPRINT =
  computeManualImageReviewFeedbackFingerprint(
    MANUAL_IMAGE_REVIEW_FEEDBACK_OUTPUT_EXAMPLE
  );

export const MANUAL_IMAGE_REVIEW_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  evaluationId: MANUAL_IMAGE_REVIEW_FEEDBACK_OUTPUT_EXAMPLE.items[0]?.evaluationId,
  generatedEvidenceId:
    MANUAL_IMAGE_REVIEW_FEEDBACK_OUTPUT_EXAMPLE.items[0]?.generatedEvidenceId,
  characterDecision: "accepted" as const,
  styleDecision: "accepted" as const,
  promptDecision: "accepted" as const,
  reviewerNote: "anchor-frame-manual-review-accepted",
  nextAction: "advance-image-queue",
});

export const MANUAL_IMAGE_REVIEW_FEEDBACK_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  feedbackId: "manual-image-review-feedback-gonegi-harbor-25s-v1",
  feedbackVersion: "manual-image-review-feedback-v1" as const,
  activeFeedbackState: "25s-manual-image-review-feedback-metadata-only",
  totalReviewItemCount: 3,
});
