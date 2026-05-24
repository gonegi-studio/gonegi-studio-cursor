import {
  GENERATION_SESSION_EXPORT_INPUT_EXAMPLE,
  GENERATION_SESSION_EXPORT_OUTPUT_EXAMPLE,
} from "./generation-session-export.fixtures.ts";
import { buildGenerationSessionExport } from "./generation-session-export.ts";
import { buildSessionReplayPlan } from "./session-replay-composer.ts";

export const SESSION_REPLAY_COMPOSER_INPUT_EXAMPLE = Object.freeze({
  sessionExport: GENERATION_SESSION_EXPORT_OUTPUT_EXAMPLE,
  replayIndex: 0,
});

export const SESSION_REPLAY_PLAN_OUTPUT_EXAMPLE = buildSessionReplayPlan(
  SESSION_REPLAY_COMPOSER_INPUT_EXAMPLE
);

export const SESSION_REPLAY_ID_EXPECTED = "session-replay-001";

export const SESSION_REPLAY_SESSION_ID_EXPECTED = "generation-session-001";

export const SESSION_REPLAY_STEP_KINDS_EXPECTED = Object.freeze([
  "load-source-request",
  "export-ai-studio",
  "evaluate-result",
  "apply-feedback",
  "compose-next-request",
  "consolidate-memory",
] as const);

export const GENERATION_SESSION_EXPORT_REGRESSION_EXAMPLE = buildGenerationSessionExport(
  GENERATION_SESSION_EXPORT_INPUT_EXAMPLE
);
