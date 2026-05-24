import { buildImageGenerationRequest } from "./image-generation-request.ts";
import { IMAGE_GENERATION_REQUEST_INPUT_EXAMPLE } from "./image-generation-request.fixtures.ts";
import { buildAiStudioTestExport } from "./ai-studio-test-export.ts";

export const AI_STUDIO_TEST_EXPORT_REQUEST_EXAMPLE = buildImageGenerationRequest(
  IMAGE_GENERATION_REQUEST_INPUT_EXAMPLE
);

export const AI_STUDIO_TEST_EXPORT_INPUT_EXAMPLE = Object.freeze({
  request: AI_STUDIO_TEST_EXPORT_REQUEST_EXAMPLE,
  exportIndex: 0,
});

export const AI_STUDIO_TEST_EXPORT_OUTPUT_EXAMPLE = buildAiStudioTestExport(
  AI_STUDIO_TEST_EXPORT_INPUT_EXAMPLE
);

export const AI_STUDIO_TEST_EXPORT_ID_EXPECTED = "ai-studio-export-001";

export const IMAGE_GENERATION_REQUEST_REGRESSION_EXAMPLE = buildImageGenerationRequest(
  IMAGE_GENERATION_REQUEST_INPUT_EXAMPLE
);
