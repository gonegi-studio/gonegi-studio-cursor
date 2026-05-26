import { GENERATED_IMAGE_EVIDENCE_INTAKE_OUTPUT_EXAMPLE } from "./generated-image-evidence-intake.fixtures.ts";
import {
  buildImageContinuityEvaluation,
  computeImageContinuityEvaluationFingerprint,
} from "./image-continuity-evaluation.ts";

export const IMAGE_CONTINUITY_EVALUATION_INPUT_EXAMPLE =
  GENERATED_IMAGE_EVIDENCE_INTAKE_OUTPUT_EXAMPLE;

export const IMAGE_CONTINUITY_EVALUATION_OUTPUT_EXAMPLE = buildImageContinuityEvaluation(
  IMAGE_CONTINUITY_EVALUATION_INPUT_EXAMPLE
);

export const IMAGE_CONTINUITY_EVALUATION_FINGERPRINT = computeImageContinuityEvaluationFingerprint(
  IMAGE_CONTINUITY_EVALUATION_OUTPUT_EXAMPLE
);

export const IMAGE_CONTINUITY_EVALUATION_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  generatedEvidenceId:
    IMAGE_CONTINUITY_EVALUATION_OUTPUT_EXAMPLE.items[0]?.generatedEvidenceId,
  continuityAnchor: "continuity-anchor-segment-001",
  characterContinuityStatus: "pass-ready" as const,
  styleContinuityStatus: "pass-ready" as const,
  promptAlignmentStatus: "pass-ready" as const,
  evaluationStatus: "pass-ready" as const,
});

export const IMAGE_CONTINUITY_EVALUATION_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  evaluationScaffoldId: "image-continuity-evaluation-gonegi-harbor-25s-v1",
  evaluationScaffoldVersion: "image-continuity-evaluation-v1" as const,
  activeEvaluationScaffoldState: "25s-image-continuity-evaluation-metadata-only",
  totalEvaluationItemCount: 3,
});
