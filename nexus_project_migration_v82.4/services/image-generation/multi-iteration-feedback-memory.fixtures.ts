import { IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE } from "./image-generation-request.fixtures.ts";
import {
  IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE,
} from "./image-result-evaluation.fixtures.ts";
import {
  PROMPT_POLICY_FEEDBACK_OUTPUT_EXAMPLE,
} from "./prompt-policy-feedback.fixtures.ts";
import {
  NEXT_GENERATION_REQUEST_OUTPUT_EXAMPLE,
} from "./next-generation-request-composer.fixtures.ts";
import { buildImageResultEvaluation } from "./image-result-evaluation.ts";
import type { ImageEvaluationSignals } from "./image-result-evaluation.ts";
import { buildPromptPolicyFeedback } from "./prompt-policy-feedback.ts";
import {
  buildNextGenerationRequest,
} from "./next-generation-request-composer.ts";
import {
  buildMultiIterationFeedbackMemory,
  toImageGenerationRequestFromNext,
} from "./multi-iteration-feedback-memory.ts";

export const MULTI_ITERATION_EVALUATION_SIGNALS_ITERATION_2: ImageEvaluationSignals = Object.freeze({
  identityMatchScore: 0.93,
  anchorMatchScore: 0.9,
  paletteMatchScore: 0.82,
  glazeMatchScore: 0.78,
  lineWeightMatchScore: 0.85,
  poseMatchScore: 0.88,
  emotionMatchScore: 0.86,
  detectedBreaks: Object.freeze(["minor-glaze-softening"] as const),
});

export const MULTI_ITERATION_REQUEST_ITERATION_1 = IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE;

export const MULTI_ITERATION_REQUEST_ITERATION_2 = toImageGenerationRequestFromNext(
  NEXT_GENERATION_REQUEST_OUTPUT_EXAMPLE
);

export const MULTI_ITERATION_EVALUATION_ITERATION_1 = IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE;

export const MULTI_ITERATION_EVALUATION_ITERATION_2 = buildImageResultEvaluation({
  request: MULTI_ITERATION_REQUEST_ITERATION_2,
  signals: MULTI_ITERATION_EVALUATION_SIGNALS_ITERATION_2,
  evaluationIndex: 1,
});

export const MULTI_ITERATION_FEEDBACK_ITERATION_1 = PROMPT_POLICY_FEEDBACK_OUTPUT_EXAMPLE;

export const MULTI_ITERATION_FEEDBACK_ITERATION_2 = buildPromptPolicyFeedback({
  request: MULTI_ITERATION_REQUEST_ITERATION_2,
  evaluation: MULTI_ITERATION_EVALUATION_ITERATION_2,
  feedbackIndex: 1,
});

export const MULTI_ITERATION_NEXT_REQUEST_ITERATION_1 = NEXT_GENERATION_REQUEST_OUTPUT_EXAMPLE;

export const MULTI_ITERATION_NEXT_REQUEST_ITERATION_2 = buildNextGenerationRequest({
  previousRequest: MULTI_ITERATION_REQUEST_ITERATION_2,
  evaluation: MULTI_ITERATION_EVALUATION_ITERATION_2,
  feedback: MULTI_ITERATION_FEEDBACK_ITERATION_2,
  nextRequestIndex: 2,
});

export const MULTI_ITERATION_FEEDBACK_MEMORY_INPUT_EXAMPLE = Object.freeze({
  requests: Object.freeze([
    MULTI_ITERATION_REQUEST_ITERATION_1,
    MULTI_ITERATION_REQUEST_ITERATION_2,
  ]),
  evaluations: Object.freeze([
    MULTI_ITERATION_EVALUATION_ITERATION_1,
    MULTI_ITERATION_EVALUATION_ITERATION_2,
  ]),
  feedbacks: Object.freeze([
    MULTI_ITERATION_FEEDBACK_ITERATION_1,
    MULTI_ITERATION_FEEDBACK_ITERATION_2,
  ]),
  nextRequests: Object.freeze([
    MULTI_ITERATION_NEXT_REQUEST_ITERATION_1,
    MULTI_ITERATION_NEXT_REQUEST_ITERATION_2,
  ]),
  memoryIndex: 0,
});

export const MULTI_ITERATION_FEEDBACK_MEMORY_OUTPUT_EXAMPLE = buildMultiIterationFeedbackMemory(
  MULTI_ITERATION_FEEDBACK_MEMORY_INPUT_EXAMPLE
);

export const MULTI_ITERATION_FEEDBACK_MEMORY_ID_EXPECTED = "feedback-memory-001";

export const MULTI_ITERATION_ITERATION_IDS_EXPECTED = Object.freeze([
  "iteration-001",
  "iteration-002",
] as const);

export const NEXT_GENERATION_REQUEST_REGRESSION_EXAMPLE = buildNextGenerationRequest({
  previousRequest: MULTI_ITERATION_REQUEST_ITERATION_1,
  evaluation: MULTI_ITERATION_EVALUATION_ITERATION_1,
  feedback: MULTI_ITERATION_FEEDBACK_ITERATION_1,
  nextRequestIndex: 1,
});
