import crypto from "crypto";
import type { ImageContinuityEvaluation } from "./image-continuity-evaluation.ts";
import { computeImageContinuityEvaluationFingerprint } from "./image-continuity-evaluation.ts";

export type ManualReviewDecision =
  | "accepted"
  | "needs-regeneration"
  | "needs-prompt-adjustment"
  | "pending";

export type ManualImageReviewItem = {
  reviewId: string;
  queueOrder: number;
  segmentId: string;
  evaluationId: string;
  generatedEvidenceId: string;
  characterDecision: ManualReviewDecision;
  styleDecision: ManualReviewDecision;
  promptDecision: ManualReviewDecision;
  reviewerNote: string;
  nextAction: string;
  reviewItemFingerprint: string;
};

export type ManualImageReviewFeedback = {
  version: "v1";
  feedbackId: string;
  evaluationScaffoldId: string;
  imageContinuityEvaluationFingerprint: string;
  sourceFingerprint: string;
  feedbackVersion: typeof MANUAL_IMAGE_REVIEW_FEEDBACK_KIND_VERSION;
  activeFeedbackState: string;
  totalReviewItemCount: number;
  items: readonly ManualImageReviewItem[];
};

export const MANUAL_IMAGE_REVIEW_FEEDBACK_VERSION = "v1" as const;
export const MANUAL_IMAGE_REVIEW_FEEDBACK_ID =
  "manual-image-review-feedback-gonegi-harbor-25s-v1" as const;
export const MANUAL_IMAGE_REVIEW_FEEDBACK_STATE =
  "25s-manual-image-review-feedback-metadata-only" as const;
export const MANUAL_IMAGE_REVIEW_FEEDBACK_KIND_VERSION =
  "manual-image-review-feedback-v1" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

const MANUAL_REVIEW_FEEDBACK_BY_QUEUE = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    characterDecision: "accepted" as const,
    styleDecision: "accepted" as const,
    promptDecision: "accepted" as const,
    reviewerNote: "anchor-frame-manual-review-accepted",
    nextAction: "advance-image-queue",
  }),
  Object.freeze({
    queueOrder: 1,
    characterDecision: "pending" as const,
    styleDecision: "pending" as const,
    promptDecision: "accepted" as const,
    reviewerNote: "manual-character-style-continuity-review-required",
    nextAction: "await-manual-review",
  }),
  Object.freeze({
    queueOrder: 2,
    characterDecision: "pending" as const,
    styleDecision: "pending" as const,
    promptDecision: "pending" as const,
    reviewerNote: "manual-review-blocked-pending-prior-queue",
    nextAction: "hold-until-queue-1-resolved",
  }),
]);

let cachedManualImageReviewFeedback: ManualImageReviewFeedback | null = null;

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

function resolveManualReviewFeedbackDefinition(queueOrder: number) {
  const definition = MANUAL_REVIEW_FEEDBACK_BY_QUEUE.find((item) => item.queueOrder === queueOrder);
  if (definition === undefined) {
    throw new Error("Manual image review feedback requires a queue feedback definition");
  }
  return definition;
}

function computeReviewItemId(queueOrder: number, evaluationId: string): string {
  return digestValue(
    [
      MANUAL_IMAGE_REVIEW_FEEDBACK_KIND_VERSION,
      "manual-review-item",
      String(queueOrder),
      evaluationId,
    ].join("|")
  );
}

function computeReviewItemFingerprint(
  item: Omit<ManualImageReviewItem, "reviewItemFingerprint">
): string {
  return digestValue(
    [
      MANUAL_IMAGE_REVIEW_FEEDBACK_KIND_VERSION,
      item.reviewId,
      String(item.queueOrder),
      item.segmentId,
      item.evaluationId,
      item.generatedEvidenceId,
      item.characterDecision,
      item.styleDecision,
      item.promptDecision,
      item.reviewerNote,
      item.nextAction,
    ].join("|")
  );
}

function buildManualImageReviewItem(
  evaluationItem: ImageContinuityEvaluation["items"][number]
): ManualImageReviewItem {
  const feedbackDefinition = resolveManualReviewFeedbackDefinition(evaluationItem.queueOrder);

  const baseItem: Omit<ManualImageReviewItem, "reviewItemFingerprint"> = {
    reviewId: computeReviewItemId(evaluationItem.queueOrder, evaluationItem.evaluationId),
    queueOrder: evaluationItem.queueOrder,
    segmentId: evaluationItem.segmentId,
    evaluationId: evaluationItem.evaluationId,
    generatedEvidenceId: evaluationItem.generatedEvidenceId,
    characterDecision: feedbackDefinition.characterDecision,
    styleDecision: feedbackDefinition.styleDecision,
    promptDecision: feedbackDefinition.promptDecision,
    reviewerNote: feedbackDefinition.reviewerNote,
    nextAction: feedbackDefinition.nextAction,
  };

  return Object.freeze({
    ...baseItem,
    reviewItemFingerprint: computeReviewItemFingerprint(baseItem),
  });
}

export function buildManualImageReviewFeedback(
  imageContinuityEvaluation: ImageContinuityEvaluation
): ManualImageReviewFeedback {
  if (cachedManualImageReviewFeedback !== null) {
    return cachedManualImageReviewFeedback;
  }

  const imageContinuityEvaluationFingerprint =
    computeImageContinuityEvaluationFingerprint(imageContinuityEvaluation);
  const orderedEvaluationItems = [...imageContinuityEvaluation.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedEvaluationItems.length !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Manual image review feedback requires three continuity evaluation items");
  }

  const items = Object.freeze(
    orderedEvaluationItems.map((evaluationItem) => buildManualImageReviewItem(evaluationItem))
  );

  const feedback = Object.freeze({
    version: MANUAL_IMAGE_REVIEW_FEEDBACK_VERSION,
    feedbackId: MANUAL_IMAGE_REVIEW_FEEDBACK_ID,
    evaluationScaffoldId: imageContinuityEvaluation.evaluationScaffoldId,
    imageContinuityEvaluationFingerprint,
    sourceFingerprint: imageContinuityEvaluation.sourceFingerprint,
    feedbackVersion: MANUAL_IMAGE_REVIEW_FEEDBACK_KIND_VERSION,
    activeFeedbackState: MANUAL_IMAGE_REVIEW_FEEDBACK_STATE,
    totalReviewItemCount: items.length,
    items,
  });

  cachedManualImageReviewFeedback = feedback;
  return feedback;
}

export const MANUAL_IMAGE_REVIEW_ITEM_KEY_ORDER = Object.freeze([
  "reviewId",
  "queueOrder",
  "segmentId",
  "evaluationId",
  "generatedEvidenceId",
  "characterDecision",
  "styleDecision",
  "promptDecision",
  "reviewerNote",
  "nextAction",
  "reviewItemFingerprint",
] as const);

export const MANUAL_IMAGE_REVIEW_FEEDBACK_KEY_ORDER = Object.freeze([
  "version",
  "feedbackId",
  "evaluationScaffoldId",
  "imageContinuityEvaluationFingerprint",
  "sourceFingerprint",
  "feedbackVersion",
  "activeFeedbackState",
  "totalReviewItemCount",
  "items",
] as const);

export function serializeManualImageReviewFeedback(
  feedback: ManualImageReviewFeedback
): string {
  const orderedItems = [...feedback.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, MANUAL_IMAGE_REVIEW_ITEM_KEY_ORDER));

  const orderedFeedback: Record<string, unknown> = {};
  for (const key of MANUAL_IMAGE_REVIEW_FEEDBACK_KEY_ORDER) {
    if (key === "items") {
      orderedFeedback.items = orderedItems;
    } else {
      orderedFeedback[key] = feedback[key as keyof ManualImageReviewFeedback];
    }
  }

  return JSON.stringify(orderedFeedback);
}

export function computeManualImageReviewFeedbackFingerprint(
  feedback: ManualImageReviewFeedback
): string {
  return digestValue(serializeManualImageReviewFeedback(feedback));
}

export function resetManualImageReviewFeedbackCacheForVerification(): void {
  cachedManualImageReviewFeedback = null;
}
