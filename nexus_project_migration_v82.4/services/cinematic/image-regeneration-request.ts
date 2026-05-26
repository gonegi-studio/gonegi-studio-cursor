import crypto from "crypto";
import type {
  ManualImageReviewFeedback,
  ManualReviewDecision,
} from "./manual-image-review-feedback.ts";
import { computeManualImageReviewFeedbackFingerprint } from "./manual-image-review-feedback.ts";

export type RegenerationPriority = "high" | "normal" | "deferred";

export type ImageRegenerationRequestItem = {
  regenerationRequestId: string;
  queueOrder: number;
  segmentId: string;
  reviewId: string;
  generatedEvidenceId: string;
  reason: string;
  priority: RegenerationPriority;
  promptAdjustmentHint: string;
  continuityAnchor: string;
  requestItemFingerprint: string;
};

export type ImageRegenerationRequest = {
  version: "v1";
  requestId: string;
  feedbackId: string;
  manualImageReviewFeedbackFingerprint: string;
  sourceFingerprint: string;
  requestVersion: typeof IMAGE_REGENERATION_REQUEST_KIND_VERSION;
  activeRequestState: string;
  totalRegenerationRequestCount: number;
  items: readonly ImageRegenerationRequestItem[];
};

export const IMAGE_REGENERATION_REQUEST_VERSION = "v1" as const;
export const IMAGE_REGENERATION_REQUEST_ID =
  "image-regeneration-request-gonegi-harbor-25s-v1" as const;
export const IMAGE_REGENERATION_REQUEST_STATE =
  "25s-image-regeneration-request-metadata-only" as const;
export const IMAGE_REGENERATION_REQUEST_KIND_VERSION =
  "image-regeneration-request-v1" as const;

const CONTINUITY_ANCHOR_BY_QUEUE = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    segmentId: "segment-001",
    continuityAnchor: "continuity-anchor-segment-001",
  }),
  Object.freeze({
    queueOrder: 1,
    segmentId: "segment-002",
    continuityAnchor: "continuity-anchor-segment-002",
  }),
  Object.freeze({
    queueOrder: 2,
    segmentId: "segment-003",
    continuityAnchor: "continuity-anchor-segment-003",
  }),
]);

let cachedImageRegenerationRequest: ImageRegenerationRequest | null = null;

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

function resolveContinuityAnchor(queueOrder: number, segmentId: string): string {
  const definition = CONTINUITY_ANCHOR_BY_QUEUE.find((item) => item.queueOrder === queueOrder);
  if (definition === undefined || definition.segmentId !== segmentId) {
    throw new Error("Image regeneration request requires a continuity anchor definition");
  }
  return definition.continuityAnchor;
}

function hasRegenerationEligibleDecision(decision: ManualReviewDecision): boolean {
  return (
    decision === "pending" ||
    decision === "needs-regeneration" ||
    decision === "needs-prompt-adjustment"
  );
}

function shouldIncludeReviewItem(reviewItem: ManualImageReviewFeedback["items"][number]): boolean {
  return (
    hasRegenerationEligibleDecision(reviewItem.characterDecision) ||
    hasRegenerationEligibleDecision(reviewItem.styleDecision) ||
    hasRegenerationEligibleDecision(reviewItem.promptDecision)
  );
}

function resolveRegenerationReason(reviewItem: ManualImageReviewFeedback["items"][number]): string {
  if (reviewItem.promptDecision === "needs-prompt-adjustment") {
    return "prompt-adjustment-required-before-regeneration";
  }
  if (
    hasRegenerationEligibleDecision(reviewItem.characterDecision) ||
    hasRegenerationEligibleDecision(reviewItem.styleDecision)
  ) {
    return reviewItem.reviewerNote;
  }
  return "manual-review-pending-regeneration";
}

function resolveRegenerationPriority(queueOrder: number): RegenerationPriority {
  if (queueOrder === 1) {
    return "high";
  }
  if (queueOrder === 2) {
    return "deferred";
  }
  return "normal";
}

function resolvePromptAdjustmentHint(
  reviewItem: ManualImageReviewFeedback["items"][number]
): string {
  if (reviewItem.promptDecision === "needs-prompt-adjustment") {
    return "revise-prompt-intent-before-next-generation";
  }
  if (reviewItem.promptDecision === "pending") {
    return "hold-prompt-until-prior-queue-resolved";
  }
  if (
    hasRegenerationEligibleDecision(reviewItem.characterDecision) ||
    hasRegenerationEligibleDecision(reviewItem.styleDecision)
  ) {
    return "maintain-prompt-anchor-adjust-character-style";
  }
  return "no-prompt-adjustment-required";
}

function computeRegenerationRequestItemId(queueOrder: number, reviewId: string): string {
  return digestValue(
    [
      IMAGE_REGENERATION_REQUEST_KIND_VERSION,
      "regeneration-request-item",
      String(queueOrder),
      reviewId,
    ].join("|")
  );
}

function computeRequestItemFingerprint(
  item: Omit<ImageRegenerationRequestItem, "requestItemFingerprint">
): string {
  return digestValue(
    [
      IMAGE_REGENERATION_REQUEST_KIND_VERSION,
      item.regenerationRequestId,
      String(item.queueOrder),
      item.segmentId,
      item.reviewId,
      item.generatedEvidenceId,
      item.reason,
      item.priority,
      item.promptAdjustmentHint,
      item.continuityAnchor,
    ].join("|")
  );
}

function buildImageRegenerationRequestItem(
  reviewItem: ManualImageReviewFeedback["items"][number]
): ImageRegenerationRequestItem {
  const baseItem: Omit<ImageRegenerationRequestItem, "requestItemFingerprint"> = {
    regenerationRequestId: computeRegenerationRequestItemId(reviewItem.queueOrder, reviewItem.reviewId),
    queueOrder: reviewItem.queueOrder,
    segmentId: reviewItem.segmentId,
    reviewId: reviewItem.reviewId,
    generatedEvidenceId: reviewItem.generatedEvidenceId,
    reason: resolveRegenerationReason(reviewItem),
    priority: resolveRegenerationPriority(reviewItem.queueOrder),
    promptAdjustmentHint: resolvePromptAdjustmentHint(reviewItem),
    continuityAnchor: resolveContinuityAnchor(reviewItem.queueOrder, reviewItem.segmentId),
  };

  return Object.freeze({
    ...baseItem,
    requestItemFingerprint: computeRequestItemFingerprint(baseItem),
  });
}

export function buildImageRegenerationRequest(
  manualImageReviewFeedback: ManualImageReviewFeedback
): ImageRegenerationRequest {
  if (cachedImageRegenerationRequest !== null) {
    return cachedImageRegenerationRequest;
  }

  const manualImageReviewFeedbackFingerprint =
    computeManualImageReviewFeedbackFingerprint(manualImageReviewFeedback);
  const orderedReviewItems = [...manualImageReviewFeedback.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .filter((reviewItem) => shouldIncludeReviewItem(reviewItem));

  const items = Object.freeze(
    orderedReviewItems.map((reviewItem) => buildImageRegenerationRequestItem(reviewItem))
  );

  const request = Object.freeze({
    version: IMAGE_REGENERATION_REQUEST_VERSION,
    requestId: IMAGE_REGENERATION_REQUEST_ID,
    feedbackId: manualImageReviewFeedback.feedbackId,
    manualImageReviewFeedbackFingerprint,
    sourceFingerprint: manualImageReviewFeedback.sourceFingerprint,
    requestVersion: IMAGE_REGENERATION_REQUEST_KIND_VERSION,
    activeRequestState: IMAGE_REGENERATION_REQUEST_STATE,
    totalRegenerationRequestCount: items.length,
    items,
  });

  cachedImageRegenerationRequest = request;
  return request;
}

export const IMAGE_REGENERATION_REQUEST_ITEM_KEY_ORDER = Object.freeze([
  "regenerationRequestId",
  "queueOrder",
  "segmentId",
  "reviewId",
  "generatedEvidenceId",
  "reason",
  "priority",
  "promptAdjustmentHint",
  "continuityAnchor",
  "requestItemFingerprint",
] as const);

export const IMAGE_REGENERATION_REQUEST_KEY_ORDER = Object.freeze([
  "version",
  "requestId",
  "feedbackId",
  "manualImageReviewFeedbackFingerprint",
  "sourceFingerprint",
  "requestVersion",
  "activeRequestState",
  "totalRegenerationRequestCount",
  "items",
] as const);

export function serializeImageRegenerationRequest(request: ImageRegenerationRequest): string {
  const orderedItems = [...request.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, IMAGE_REGENERATION_REQUEST_ITEM_KEY_ORDER));

  const orderedRequest: Record<string, unknown> = {};
  for (const key of IMAGE_REGENERATION_REQUEST_KEY_ORDER) {
    if (key === "items") {
      orderedRequest.items = orderedItems;
    } else {
      orderedRequest[key] = request[key as keyof ImageRegenerationRequest];
    }
  }

  return JSON.stringify(orderedRequest);
}

export function computeImageRegenerationRequestFingerprint(
  request: ImageRegenerationRequest
): string {
  return digestValue(serializeImageRegenerationRequest(request));
}

export function resetImageRegenerationRequestCacheForVerification(): void {
  cachedImageRegenerationRequest = null;
}
