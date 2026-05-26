import crypto from "crypto";
import type {
  ImageAppFinalInputCharacterProfile,
  ImageAppFinalInputPackage,
  ImageAppFinalInputStyleProfile,
} from "./image-app-final-input-package.ts";
import { computeImageAppFinalInputPackageFingerprint } from "./image-app-final-input-package.ts";

export type GeneratedImageEvaluationStatus = "pending-review" | "continuity-check-pending";

export type GeneratedImageEvidenceItem = {
  generatedEvidenceId: string;
  queueOrder: number;
  segmentId: string;
  sourceInputPackageId: string;
  continuityAnchor: string;
  generatedImagePath: string;
  generatedImageFingerprint: string;
  characterProfile: ImageAppFinalInputCharacterProfile;
  styleProfile: ImageAppFinalInputStyleProfile;
  promptIntent: string;
  emotionalBeat: string;
  evaluationStatus: GeneratedImageEvaluationStatus;
  evidenceItemFingerprint: string;
};

export type GeneratedImageEvaluationBinding = {
  evaluationBindingId: string;
  generatedEvidenceId: string;
  queueOrder: number;
  sourceInputPackageId: string;
  evaluationStatus: GeneratedImageEvaluationStatus;
  evaluationBindingFingerprint: string;
};

export type GeneratedImageEvidenceIntake = {
  version: "v1";
  intakeId: string;
  inputPackageId: string;
  imageAppFinalInputPackageFingerprint: string;
  sourceFingerprint: string;
  intakeVersion: typeof GENERATED_IMAGE_EVIDENCE_INTAKE_KIND_VERSION;
  activeIntakeState: string;
  totalEvidenceItemCount: number;
  items: readonly GeneratedImageEvidenceItem[];
  evaluationBindings: readonly GeneratedImageEvaluationBinding[];
};

export const GENERATED_IMAGE_EVIDENCE_INTAKE_VERSION = "v1" as const;
export const GENERATED_IMAGE_EVIDENCE_INTAKE_ID =
  "generated-image-evidence-intake-gonegi-harbor-25s-v1" as const;
export const GENERATED_IMAGE_EVIDENCE_INTAKE_STATE =
  "25s-generated-image-evidence-intake-metadata-only" as const;
export const GENERATED_IMAGE_EVIDENCE_INTAKE_KIND_VERSION =
  "generated-image-evidence-intake-v1" as const;
export const GENERATED_IMAGE_EVIDENCE_INTAKE_ROOT =
  "storage/pilot-intake/generated-images/" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

const GENERATED_IMAGE_PATH_BY_QUEUE = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    segmentId: "segment-001",
    generatedImagePath:
      "storage/pilot-intake/generated-images/segment-001/gonegi-ai-studio-generated-frame-001.jpg",
  }),
  Object.freeze({
    queueOrder: 1,
    segmentId: "segment-002",
    generatedImagePath:
      "storage/pilot-intake/generated-images/segment-002/gonegi-ai-studio-generated-frame-002.jpg",
  }),
  Object.freeze({
    queueOrder: 2,
    segmentId: "segment-003",
    generatedImagePath:
      "storage/pilot-intake/generated-images/segment-003/gonegi-ai-studio-generated-frame-003.jpg",
  }),
]);

const GENERATED_IMAGE_EVIDENCE_CHARACTER_PROFILE_KEY_ORDER = Object.freeze([
  "characterDnaId",
  "characterKey",
  "outfitKey",
  "silhouetteKey",
  "expressionKey",
  "paletteKey",
  "emotionalBeat",
] as const);

const GENERATED_IMAGE_EVIDENCE_STYLE_PROFILE_KEY_ORDER = Object.freeze([
  "styleCoreId",
  "styleKey",
  "materialKey",
  "lightingKey",
  "paletteKey",
  "brushworkKey",
  "styleStrength",
] as const);

let cachedGeneratedImageEvidenceIntake: GeneratedImageEvidenceIntake | null = null;

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

function resolveGeneratedImagePath(queueOrder: number, segmentId: string): string {
  const definition = GENERATED_IMAGE_PATH_BY_QUEUE.find((item) => item.queueOrder === queueOrder);
  if (definition === undefined || definition.segmentId !== segmentId) {
    throw new Error("Generated image evidence intake requires a generated image path definition");
  }
  return definition.generatedImagePath;
}

function resolveEvaluationStatus(queueOrder: number): GeneratedImageEvaluationStatus {
  return queueOrder === 0 ? "pending-review" : "continuity-check-pending";
}

function computeGeneratedEvidenceId(queueOrder: number, sourceInputPackageId: string): string {
  return digestValue(
    [
      GENERATED_IMAGE_EVIDENCE_INTAKE_KIND_VERSION,
      "generated-evidence-item",
      String(queueOrder),
      sourceInputPackageId,
    ].join("|")
  );
}

function computeGeneratedImageFingerprint(
  generatedImagePath: string,
  sourceInputPackageId: string,
  inputItemFingerprint: string
): string {
  return digestValue(
    [
      GENERATED_IMAGE_EVIDENCE_INTAKE_KIND_VERSION,
      "generated-image-fingerprint",
      generatedImagePath,
      sourceInputPackageId,
      inputItemFingerprint,
    ].join("|")
  );
}

function computeEvidenceItemFingerprint(
  item: Omit<GeneratedImageEvidenceItem, "evidenceItemFingerprint">
): string {
  return digestValue(
    [
      GENERATED_IMAGE_EVIDENCE_INTAKE_KIND_VERSION,
      item.generatedEvidenceId,
      String(item.queueOrder),
      item.segmentId,
      item.sourceInputPackageId,
      item.continuityAnchor,
      item.generatedImagePath,
      item.generatedImageFingerprint,
      JSON.stringify(
        orderRecord(item.characterProfile, GENERATED_IMAGE_EVIDENCE_CHARACTER_PROFILE_KEY_ORDER)
      ),
      JSON.stringify(
        orderRecord(item.styleProfile, GENERATED_IMAGE_EVIDENCE_STYLE_PROFILE_KEY_ORDER)
      ),
      item.promptIntent,
      item.emotionalBeat,
      item.evaluationStatus,
    ].join("|")
  );
}

function computeEvaluationBindingId(
  queueOrder: number,
  generatedEvidenceId: string
): string {
  return digestValue(
    [
      GENERATED_IMAGE_EVIDENCE_INTAKE_KIND_VERSION,
      "evaluation-binding",
      String(queueOrder),
      generatedEvidenceId,
    ].join("|")
  );
}

function computeEvaluationBindingFingerprint(
  binding: Omit<GeneratedImageEvaluationBinding, "evaluationBindingFingerprint">
): string {
  return digestValue(
    [
      GENERATED_IMAGE_EVIDENCE_INTAKE_KIND_VERSION,
      binding.evaluationBindingId,
      binding.generatedEvidenceId,
      String(binding.queueOrder),
      binding.sourceInputPackageId,
      binding.evaluationStatus,
    ].join("|")
  );
}

function buildGeneratedImageEvidenceItem(
  inputItem: ImageAppFinalInputPackage["items"][number]
): GeneratedImageEvidenceItem {
  const generatedImagePath = resolveGeneratedImagePath(inputItem.queueOrder, inputItem.segmentId);
  const evaluationStatus = resolveEvaluationStatus(inputItem.queueOrder);
  const generatedEvidenceId = computeGeneratedEvidenceId(
    inputItem.queueOrder,
    inputItem.inputPackageId
  );
  const generatedImageFingerprint = computeGeneratedImageFingerprint(
    generatedImagePath,
    inputItem.inputPackageId,
    inputItem.inputItemFingerprint
  );

  const baseItem: Omit<GeneratedImageEvidenceItem, "evidenceItemFingerprint"> = {
    generatedEvidenceId,
    queueOrder: inputItem.queueOrder,
    segmentId: inputItem.segmentId,
    sourceInputPackageId: inputItem.inputPackageId,
    continuityAnchor: inputItem.continuityAnchor,
    generatedImagePath,
    generatedImageFingerprint,
    characterProfile: inputItem.characterProfile,
    styleProfile: inputItem.styleProfile,
    promptIntent: inputItem.promptIntent,
    emotionalBeat: inputItem.characterProfile.emotionalBeat,
    evaluationStatus,
  };

  return Object.freeze({
    ...baseItem,
    evidenceItemFingerprint: computeEvidenceItemFingerprint(baseItem),
  });
}

function buildGeneratedImageEvaluationBinding(
  evidenceItem: GeneratedImageEvidenceItem
): GeneratedImageEvaluationBinding {
  const baseBinding: Omit<GeneratedImageEvaluationBinding, "evaluationBindingFingerprint"> = {
    evaluationBindingId: computeEvaluationBindingId(
      evidenceItem.queueOrder,
      evidenceItem.generatedEvidenceId
    ),
    generatedEvidenceId: evidenceItem.generatedEvidenceId,
    queueOrder: evidenceItem.queueOrder,
    sourceInputPackageId: evidenceItem.sourceInputPackageId,
    evaluationStatus: evidenceItem.evaluationStatus,
  };

  return Object.freeze({
    ...baseBinding,
    evaluationBindingFingerprint: computeEvaluationBindingFingerprint(baseBinding),
  });
}

export function buildGeneratedImageEvidenceIntake(
  imageAppFinalInputPackage: ImageAppFinalInputPackage
): GeneratedImageEvidenceIntake {
  if (cachedGeneratedImageEvidenceIntake !== null) {
    return cachedGeneratedImageEvidenceIntake;
  }

  const imageAppFinalInputPackageFingerprint =
    computeImageAppFinalInputPackageFingerprint(imageAppFinalInputPackage);
  const orderedInputItems = [...imageAppFinalInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedInputItems.length !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Generated image evidence intake requires three final input package items");
  }

  const items = Object.freeze(
    orderedInputItems.map((inputItem) => buildGeneratedImageEvidenceItem(inputItem))
  );
  const evaluationBindings = Object.freeze(items.map((item) => buildGeneratedImageEvaluationBinding(item)));

  const intake = Object.freeze({
    version: GENERATED_IMAGE_EVIDENCE_INTAKE_VERSION,
    intakeId: GENERATED_IMAGE_EVIDENCE_INTAKE_ID,
    inputPackageId: imageAppFinalInputPackage.packageId,
    imageAppFinalInputPackageFingerprint,
    sourceFingerprint: imageAppFinalInputPackage.sourceFingerprint,
    intakeVersion: GENERATED_IMAGE_EVIDENCE_INTAKE_KIND_VERSION,
    activeIntakeState: GENERATED_IMAGE_EVIDENCE_INTAKE_STATE,
    totalEvidenceItemCount: items.length,
    items,
    evaluationBindings,
  });

  cachedGeneratedImageEvidenceIntake = intake;
  return intake;
}

export const GENERATED_IMAGE_EVIDENCE_ITEM_KEY_ORDER = Object.freeze([
  "generatedEvidenceId",
  "queueOrder",
  "segmentId",
  "sourceInputPackageId",
  "continuityAnchor",
  "generatedImagePath",
  "generatedImageFingerprint",
  "characterProfile",
  "styleProfile",
  "promptIntent",
  "emotionalBeat",
  "evaluationStatus",
  "evidenceItemFingerprint",
] as const);

export const GENERATED_IMAGE_EVALUATION_BINDING_KEY_ORDER = Object.freeze([
  "evaluationBindingId",
  "generatedEvidenceId",
  "queueOrder",
  "sourceInputPackageId",
  "evaluationStatus",
  "evaluationBindingFingerprint",
] as const);

export const GENERATED_IMAGE_EVIDENCE_INTAKE_KEY_ORDER = Object.freeze([
  "version",
  "intakeId",
  "inputPackageId",
  "imageAppFinalInputPackageFingerprint",
  "sourceFingerprint",
  "intakeVersion",
  "activeIntakeState",
  "totalEvidenceItemCount",
  "items",
  "evaluationBindings",
] as const);

export function serializeGeneratedImageEvidenceIntake(
  intake: GeneratedImageEvidenceIntake
): string {
  const orderedItems = [...intake.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => {
      const orderedItem: Record<string, unknown> = {
        generatedEvidenceId: item.generatedEvidenceId,
        queueOrder: item.queueOrder,
        segmentId: item.segmentId,
        sourceInputPackageId: item.sourceInputPackageId,
        continuityAnchor: item.continuityAnchor,
        generatedImagePath: item.generatedImagePath,
        generatedImageFingerprint: item.generatedImageFingerprint,
        characterProfile: orderRecord(
          item.characterProfile,
          GENERATED_IMAGE_EVIDENCE_CHARACTER_PROFILE_KEY_ORDER
        ),
        styleProfile: orderRecord(item.styleProfile, GENERATED_IMAGE_EVIDENCE_STYLE_PROFILE_KEY_ORDER),
        promptIntent: item.promptIntent,
        emotionalBeat: item.emotionalBeat,
        evaluationStatus: item.evaluationStatus,
        evidenceItemFingerprint: item.evidenceItemFingerprint,
      };
      return orderedItem;
    });

  const orderedEvaluationBindings = [...intake.evaluationBindings]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((binding) => orderRecord(binding, GENERATED_IMAGE_EVALUATION_BINDING_KEY_ORDER));

  const orderedIntake: Record<string, unknown> = {};
  for (const key of GENERATED_IMAGE_EVIDENCE_INTAKE_KEY_ORDER) {
    if (key === "items") {
      orderedIntake.items = orderedItems;
    } else if (key === "evaluationBindings") {
      orderedIntake.evaluationBindings = orderedEvaluationBindings;
    } else {
      orderedIntake[key] = intake[key as keyof GeneratedImageEvidenceIntake];
    }
  }

  return JSON.stringify(orderedIntake);
}

export function computeGeneratedImageEvidenceIntakeFingerprint(
  intake: GeneratedImageEvidenceIntake
): string {
  return digestValue(serializeGeneratedImageEvidenceIntake(intake));
}

export function resetGeneratedImageEvidenceIntakeCacheForVerification(): void {
  cachedGeneratedImageEvidenceIntake = null;
}
