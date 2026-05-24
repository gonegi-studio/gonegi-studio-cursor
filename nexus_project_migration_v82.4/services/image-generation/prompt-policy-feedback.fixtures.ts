import { buildImageGenerationRequest } from "./image-generation-request.ts";
import { IMAGE_GENERATION_REQUEST_INPUT_EXAMPLE } from "./image-generation-request.fixtures.ts";
import {
  IMAGE_RESULT_EVALUATION_INPUT_EXAMPLE,
  IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE,
} from "./image-result-evaluation.fixtures.ts";
import { buildImageResultEvaluation } from "./image-result-evaluation.ts";
import { buildPromptPolicyFeedback } from "./prompt-policy-feedback.ts";

export const PROMPT_POLICY_FEEDBACK_REQUEST_EXAMPLE = buildImageGenerationRequest(
  IMAGE_GENERATION_REQUEST_INPUT_EXAMPLE
);

export const PROMPT_POLICY_FEEDBACK_EVALUATION_EXAMPLE = buildImageResultEvaluation(
  IMAGE_RESULT_EVALUATION_INPUT_EXAMPLE
);

export const PROMPT_POLICY_FEEDBACK_INPUT_EXAMPLE = Object.freeze({
  request: PROMPT_POLICY_FEEDBACK_REQUEST_EXAMPLE,
  evaluation: IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE,
  feedbackIndex: 0,
});

export const PROMPT_POLICY_FEEDBACK_OUTPUT_EXAMPLE = buildPromptPolicyFeedback(
  PROMPT_POLICY_FEEDBACK_INPUT_EXAMPLE
);

export const PROMPT_POLICY_FEEDBACK_ID_EXPECTED = "prompt-feedback-001";

export const PROMPT_POLICY_FEEDBACK_RISK_LEVEL_EXPECTED = "low";

export const IMAGE_RESULT_EVALUATION_REGRESSION_EXAMPLE = buildImageResultEvaluation(
  IMAGE_RESULT_EVALUATION_INPUT_EXAMPLE
);
