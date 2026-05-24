import { IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE } from "./image-generation-request.fixtures.ts";
import {
  IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE,
} from "./image-result-evaluation.fixtures.ts";
import {
  PROMPT_POLICY_FEEDBACK_OUTPUT_EXAMPLE,
} from "./prompt-policy-feedback.fixtures.ts";
import { buildPromptPolicyFeedback } from "./prompt-policy-feedback.ts";
import { PROMPT_POLICY_FEEDBACK_INPUT_EXAMPLE } from "./prompt-policy-feedback.fixtures.ts";
import { buildNextGenerationRequest } from "./next-generation-request-composer.ts";

export const NEXT_GENERATION_REQUEST_PREVIOUS_EXAMPLE = IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE;

export const NEXT_GENERATION_REQUEST_EVALUATION_EXAMPLE = IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE;

export const NEXT_GENERATION_REQUEST_FEEDBACK_EXAMPLE = PROMPT_POLICY_FEEDBACK_OUTPUT_EXAMPLE;

export const NEXT_GENERATION_REQUEST_COMPOSER_INPUT_EXAMPLE = Object.freeze({
  previousRequest: NEXT_GENERATION_REQUEST_PREVIOUS_EXAMPLE,
  evaluation: NEXT_GENERATION_REQUEST_EVALUATION_EXAMPLE,
  feedback: NEXT_GENERATION_REQUEST_FEEDBACK_EXAMPLE,
  nextRequestIndex: 1,
});

export const NEXT_GENERATION_REQUEST_OUTPUT_EXAMPLE = buildNextGenerationRequest(
  NEXT_GENERATION_REQUEST_COMPOSER_INPUT_EXAMPLE
);

export const NEXT_GENERATION_REQUEST_ID_EXPECTED = "image-request-002";

export const NEXT_GENERATION_REQUEST_PARENT_ID_EXPECTED = "image-request-001";

export const PROMPT_POLICY_FEEDBACK_REGRESSION_EXAMPLE = buildPromptPolicyFeedback(
  PROMPT_POLICY_FEEDBACK_INPUT_EXAMPLE
);
