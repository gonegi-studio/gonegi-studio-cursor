import crypto from "crypto";
import type { GeneratedImageEvidenceIntake } from "./generated-image-evidence-intake.ts";
import { computeGeneratedImageEvidenceIntakeFingerprint } from "./generated-image-evidence-intake.ts";

export type ContinuityEvaluationStatus = "pending" | "pass-ready" | "needs-review";

export type ImageContinuityEvaluationItem = {
  evaluationId: string;
  queueOrder: number;
  segmentId: string;
  generatedEvidenceId: string;
  continuityAnchor: string;
  characterContinuityStatus: ContinuityEvaluationStatus;
  styleContinuityStatus: ContinuityEvaluationStatus;
  promptAlignmentStatus: ContinuityEvaluationStatus;
  evaluationStatus: ContinuityEvaluationStatus;
  evaluationItemFingerprint: string;
};

export type ImageContinuityEvaluation = {
  version: "v1";
  evaluationScaffoldId: string;
  evidenceIntakeId: string;
  generatedImageEvidenceIntakeFingerprint: string;
  sourceFingerprint: string;
  evaluationScaffoldVersion: typeof IMAGE_CONTINUITY_EVALUATION_KIND_VERSION;
  activeEvaluationScaffoldState: string;
  totalEvaluationItemCount: number;
  items: readonly ImageContinuityEvaluationItem[];
};

export const IMAGE_CONTINUITY_EVALUATION_VERSION = "v1" as const;
export const IMAGE_CONTINUITY_EVALUATION_ID =
  "image-continuity-evaluation-gonegi-harbor-25s-v1" as const;
export const IMAGE_CONTINUITY_EVALUATION_STATE =
  "25s-image-continuity-evaluation-metadata-only" as const;
export const IMAGE_CONTINUITY_EVALUATION_KIND_VERSION =
  "image-continuity-evaluation-v1" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

let cachedImageContinuityEvaluation: ImageContinuityEvaluation | null = null;

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

function resolveContinuityAxisStatuses(queueOrder: number): {
  characterContinuityStatus: ContinuityEvaluationStatus;
  styleContinuityStatus: ContinuityEvaluationStatus;
  promptAlignmentStatus: ContinuityEvaluationStatus;
  evaluationStatus: ContinuityEvaluationStatus;
} {
  if (queueOrder === 0) {
    return Object.freeze({
      characterContinuityStatus: "pass-ready",
      styleContinuityStatus: "pass-ready",
      promptAlignmentStatus: "pass-ready",
      evaluationStatus: "pass-ready",
    });
  }

  if (queueOrder === 1) {
    return Object.freeze({
      characterContinuityStatus: "pending",
      styleContinuityStatus: "pending",
      promptAlignmentStatus: "pass-ready",
      evaluationStatus: "needs-review",
    });
  }

  return Object.freeze({
    characterContinuityStatus: "pending",
    styleContinuityStatus: "pending",
    promptAlignmentStatus: "pending",
    evaluationStatus: "pending",
  });
}

function computeEvaluationItemId(queueOrder: number, generatedEvidenceId: string): string {
  return digestValue(
    [
      IMAGE_CONTINUITY_EVALUATION_KIND_VERSION,
      "continuity-evaluation-item",
      String(queueOrder),
      generatedEvidenceId,
    ].join("|")
  );
}

function computeEvaluationItemFingerprint(
  item: Omit<ImageContinuityEvaluationItem, "evaluationItemFingerprint">
): string {
  return digestValue(
    [
      IMAGE_CONTINUITY_EVALUATION_KIND_VERSION,
      item.evaluationId,
      String(item.queueOrder),
      item.segmentId,
      item.generatedEvidenceId,
      item.continuityAnchor,
      item.characterContinuityStatus,
      item.styleContinuityStatus,
      item.promptAlignmentStatus,
      item.evaluationStatus,
    ].join("|")
  );
}

function buildImageContinuityEvaluationItem(
  evidenceItem: GeneratedImageEvidenceIntake["items"][number]
): ImageContinuityEvaluationItem {
  const axisStatuses = resolveContinuityAxisStatuses(evidenceItem.queueOrder);

  const baseItem: Omit<ImageContinuityEvaluationItem, "evaluationItemFingerprint"> = {
    evaluationId: computeEvaluationItemId(
      evidenceItem.queueOrder,
      evidenceItem.generatedEvidenceId
    ),
    queueOrder: evidenceItem.queueOrder,
    segmentId: evidenceItem.segmentId,
    generatedEvidenceId: evidenceItem.generatedEvidenceId,
    continuityAnchor: evidenceItem.continuityAnchor,
    characterContinuityStatus: axisStatuses.characterContinuityStatus,
    styleContinuityStatus: axisStatuses.styleContinuityStatus,
    promptAlignmentStatus: axisStatuses.promptAlignmentStatus,
    evaluationStatus: axisStatuses.evaluationStatus,
  };

  return Object.freeze({
    ...baseItem,
    evaluationItemFingerprint: computeEvaluationItemFingerprint(baseItem),
  });
}

export function buildImageContinuityEvaluation(
  generatedImageEvidenceIntake: GeneratedImageEvidenceIntake
): ImageContinuityEvaluation {
  if (cachedImageContinuityEvaluation !== null) {
    return cachedImageContinuityEvaluation;
  }

  const generatedImageEvidenceIntakeFingerprint = computeGeneratedImageEvidenceIntakeFingerprint(
    generatedImageEvidenceIntake
  );
  const orderedEvidenceItems = [...generatedImageEvidenceIntake.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedEvidenceItems.length !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Image continuity evaluation requires three generated evidence items");
  }

  const items = Object.freeze(
    orderedEvidenceItems.map((evidenceItem) => buildImageContinuityEvaluationItem(evidenceItem))
  );

  const evaluation = Object.freeze({
    version: IMAGE_CONTINUITY_EVALUATION_VERSION,
    evaluationScaffoldId: IMAGE_CONTINUITY_EVALUATION_ID,
    evidenceIntakeId: generatedImageEvidenceIntake.intakeId,
    generatedImageEvidenceIntakeFingerprint,
    sourceFingerprint: generatedImageEvidenceIntake.sourceFingerprint,
    evaluationScaffoldVersion: IMAGE_CONTINUITY_EVALUATION_KIND_VERSION,
    activeEvaluationScaffoldState: IMAGE_CONTINUITY_EVALUATION_STATE,
    totalEvaluationItemCount: items.length,
    items,
  });

  cachedImageContinuityEvaluation = evaluation;
  return evaluation;
}

export const IMAGE_CONTINUITY_EVALUATION_ITEM_KEY_ORDER = Object.freeze([
  "evaluationId",
  "queueOrder",
  "segmentId",
  "generatedEvidenceId",
  "continuityAnchor",
  "characterContinuityStatus",
  "styleContinuityStatus",
  "promptAlignmentStatus",
  "evaluationStatus",
  "evaluationItemFingerprint",
] as const);

export const IMAGE_CONTINUITY_EVALUATION_KEY_ORDER = Object.freeze([
  "version",
  "evaluationScaffoldId",
  "evidenceIntakeId",
  "generatedImageEvidenceIntakeFingerprint",
  "sourceFingerprint",
  "evaluationScaffoldVersion",
  "activeEvaluationScaffoldState",
  "totalEvaluationItemCount",
  "items",
] as const);

export function serializeImageContinuityEvaluation(
  evaluation: ImageContinuityEvaluation
): string {
  const orderedItems = [...evaluation.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, IMAGE_CONTINUITY_EVALUATION_ITEM_KEY_ORDER));

  const orderedEvaluation: Record<string, unknown> = {};
  for (const key of IMAGE_CONTINUITY_EVALUATION_KEY_ORDER) {
    if (key === "items") {
      orderedEvaluation.items = orderedItems;
    } else {
      orderedEvaluation[key] = evaluation[key as keyof ImageContinuityEvaluation];
    }
  }

  return JSON.stringify(orderedEvaluation);
}

export function computeImageContinuityEvaluationFingerprint(
  evaluation: ImageContinuityEvaluation
): string {
  return digestValue(serializeImageContinuityEvaluation(evaluation));
}

export function resetImageContinuityEvaluationCacheForVerification(): void {
  cachedImageContinuityEvaluation = null;
}
