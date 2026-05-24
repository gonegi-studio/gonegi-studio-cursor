import { CHARACTER_CONTINUITY_REPORT_OUTPUT_EXAMPLE } from "../character-continuity/character-continuity-report.fixtures.ts";
import { buildCharacterContinuityReport } from "../character-continuity/character-continuity-report.ts";
import { CHARACTER_CONTINUITY_REPORT_INPUT_EXAMPLE } from "../character-continuity/character-continuity-report.fixtures.ts";
import { buildImageGenerationRequest } from "./image-generation-request.ts";

export const IMAGE_GENERATION_SCENE_PROMPT_EXAMPLE =
  "Gonegi in a warm domestic kitchen, soft afternoon light, gentle nostalgia, watercolor glaze atmosphere";

export const IMAGE_GENERATION_CINEMATIC_HINTS_EXAMPLE = Object.freeze({
  traitHints: Object.freeze(["warmth", "domestic-composition", "peaceful-silence"] as const),
  styleHints: Object.freeze(["watercolor-glaze", "soft-grain", "nostalgic-light"] as const),
});

export const IMAGE_GENERATION_REQUEST_INPUT_EXAMPLE = Object.freeze({
  continuityReport: CHARACTER_CONTINUITY_REPORT_OUTPUT_EXAMPLE,
  scenePrompt: IMAGE_GENERATION_SCENE_PROMPT_EXAMPLE,
  cinematicHints: IMAGE_GENERATION_CINEMATIC_HINTS_EXAMPLE,
  requestIndex: 0,
});

export const IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE = buildImageGenerationRequest(
  IMAGE_GENERATION_REQUEST_INPUT_EXAMPLE
);

export const IMAGE_GENERATION_IDENTITY_LOCK_ORDER_EXPECTED = Object.freeze([
  "anchor-lock-gonegi-primary",
  "lock-gonegi-primary-identity",
] as const);

export const IMAGE_GENERATION_STEERING_ORDER_EXPECTED = Object.freeze([
  "identity",
  "anchor",
  "style",
  "pose",
  "emotion",
] as const);

export const CHARACTER_CONTINUITY_REPORT_REGRESSION_EXAMPLE = buildCharacterContinuityReport(
  CHARACTER_CONTINUITY_REPORT_INPUT_EXAMPLE
);
