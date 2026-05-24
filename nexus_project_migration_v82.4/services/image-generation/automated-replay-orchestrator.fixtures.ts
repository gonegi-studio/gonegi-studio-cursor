import {
  GENERATION_SESSION_EXPORT_INPUT_EXAMPLE,
  GENERATION_SESSION_EXPORT_OUTPUT_EXAMPLE,
} from "./generation-session-export.fixtures.ts";
import { buildGenerationSessionExport } from "./generation-session-export.ts";
import {
  SESSION_REPLAY_PLAN_OUTPUT_EXAMPLE,
} from "./session-replay-composer.fixtures.ts";
import { buildSessionReplayPlan } from "./session-replay-composer.ts";
import { buildAutomatedReplayOrchestratorPlan } from "./automated-replay-orchestrator.ts";

export const AUTOMATED_REPLAY_SESSION_EXPORT_002_INPUT = Object.freeze({
  ...GENERATION_SESSION_EXPORT_INPUT_EXAMPLE,
  sessionIndex: 1,
});

export const AUTOMATED_REPLAY_SESSION_EXPORT_002 = buildGenerationSessionExport(
  AUTOMATED_REPLAY_SESSION_EXPORT_002_INPUT
);

export const AUTOMATED_REPLAY_PLAN_001 = SESSION_REPLAY_PLAN_OUTPUT_EXAMPLE;

export const AUTOMATED_REPLAY_PLAN_002 = buildSessionReplayPlan({
  sessionExport: AUTOMATED_REPLAY_SESSION_EXPORT_002,
  replayIndex: 1,
});

export const AUTOMATED_REPLAY_ORCHESTRATOR_INPUT_EXAMPLE = Object.freeze({
  replayPlans: Object.freeze([AUTOMATED_REPLAY_PLAN_002, AUTOMATED_REPLAY_PLAN_001]),
  orchestratorIndex: 0,
});

export const AUTOMATED_REPLAY_ORCHESTRATOR_OUTPUT_EXAMPLE = buildAutomatedReplayOrchestratorPlan(
  AUTOMATED_REPLAY_ORCHESTRATOR_INPUT_EXAMPLE
);

export const AUTOMATED_REPLAY_ORCHESTRATOR_ID_EXPECTED = "replay-orchestrator-001";

export const AUTOMATED_REPLAY_QUEUE_REPLAY_IDS_EXPECTED = Object.freeze([
  "session-replay-001",
  "session-replay-002",
] as const);

export const SESSION_REPLAY_COMPOSER_REGRESSION_EXAMPLE = buildSessionReplayPlan({
  sessionExport: GENERATION_SESSION_EXPORT_OUTPUT_EXAMPLE,
  replayIndex: 0,
});

export const GENERATION_SESSION_EXPORT_REGRESSION_EXAMPLE = buildGenerationSessionExport(
  GENERATION_SESSION_EXPORT_INPUT_EXAMPLE
);
