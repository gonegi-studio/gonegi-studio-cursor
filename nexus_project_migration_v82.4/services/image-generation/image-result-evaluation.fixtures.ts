import { buildImageGenerationRequest } from "./image-generation-request.ts";
import { IMAGE_GENERATION_REQUEST_INPUT_EXAMPLE } from "./image-generation-request.fixtures.ts";
import { buildImageResultEvaluation } from "./image-result-evaluation.ts";
import type { ImageEvaluationSignals } from "./image-result-evaluation.ts";

export const IMAGE_EVALUATION_SIGNALS_EXAMPLE: ImageEvaluationSignals = Object.freeze({
  identityMatchScore: 0.92,
  anchorMatchScore: 0.89,
  paletteMatchScore: 0.78,
  glazeMatchScore: 0.71,
  lineWeightMatchScore: 0.83,
  poseMatchScore: 0.87,
  emotionMatchScore: 0.85,
  detectedBreaks: Object.freeze(["minor-glaze-softening"] as const),
});

export const IMAGE_RESULT_EVALUATION_REQUEST_EXAMPLE = buildImageGenerationRequest(
  IMAGE_GENERATION_REQUEST_INPUT_EXAMPLE
);

export const IMAGE_RESULT_EVALUATION_INPUT_EXAMPLE = Object.freeze({
  request: IMAGE_RESULT_EVALUATION_REQUEST_EXAMPLE,
  signals: IMAGE_EVALUATION_SIGNALS_EXAMPLE,
  evaluationIndex: 0,
});

export const IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE = buildImageResultEvaluation(
  IMAGE_RESULT_EVALUATION_INPUT_EXAMPLE
);

export const IMAGE_RESULT_EVALUATION_ID_EXPECTED = "image-eval-001";

export const IMAGE_RESULT_EVALUATION_CONTINUITY_BREAKS_EXPECTED = Object.freeze([
  "glaze inconsistency",
  "minor-glaze-softening",
] as const);
