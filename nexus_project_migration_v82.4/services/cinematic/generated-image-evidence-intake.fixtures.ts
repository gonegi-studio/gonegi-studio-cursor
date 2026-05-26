import { IMAGE_APP_FINAL_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./image-app-final-input-package.fixtures.ts";
import {
  buildGeneratedImageEvidenceIntake,
  computeGeneratedImageEvidenceIntakeFingerprint,
} from "./generated-image-evidence-intake.ts";

export const GENERATED_IMAGE_EVIDENCE_INTAKE_INPUT_EXAMPLE =
  IMAGE_APP_FINAL_INPUT_PACKAGE_OUTPUT_EXAMPLE;

export const GENERATED_IMAGE_EVIDENCE_INTAKE_OUTPUT_EXAMPLE = buildGeneratedImageEvidenceIntake(
  GENERATED_IMAGE_EVIDENCE_INTAKE_INPUT_EXAMPLE
);

export const GENERATED_IMAGE_EVIDENCE_INTAKE_FINGERPRINT =
  computeGeneratedImageEvidenceIntakeFingerprint(
    GENERATED_IMAGE_EVIDENCE_INTAKE_OUTPUT_EXAMPLE
  );

export const GENERATED_IMAGE_EVIDENCE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  sourceInputPackageId:
    GENERATED_IMAGE_EVIDENCE_INTAKE_OUTPUT_EXAMPLE.items[0]?.sourceInputPackageId,
  continuityAnchor: "continuity-anchor-segment-001",
  generatedImagePath:
    "storage/pilot-intake/generated-images/segment-001/gonegi-ai-studio-generated-frame-001.jpg",
  promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
  emotionalBeat: "nostalgic-calm",
  evaluationStatus: "pending-review" as const,
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

export const GENERATED_IMAGE_EVIDENCE_INTAKE_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  intakeId: "generated-image-evidence-intake-gonegi-harbor-25s-v1",
  intakeVersion: "generated-image-evidence-intake-v1" as const,
  activeIntakeState: "25s-generated-image-evidence-intake-metadata-only",
  totalEvidenceItemCount: 3,
});
