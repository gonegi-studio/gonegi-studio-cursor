import {
  AUTOMATED_REPLAY_ORCHESTRATOR_INPUT_EXAMPLE,
  AUTOMATED_REPLAY_ORCHESTRATOR_OUTPUT_EXAMPLE,
  SESSION_REPLAY_COMPOSER_REGRESSION_EXAMPLE,
} from "./automated-replay-orchestrator.fixtures.ts";
import {
  buildAutomatedReplayOrchestratorPlan,
} from "./automated-replay-orchestrator.ts";
import { buildReplayComparisonIntelligenceReport } from "./replay-comparison-intelligence.ts";
import { buildSessionReplayPlan } from "./session-replay-composer.ts";
import {
  SESSION_REPLAY_COMPOSER_INPUT_EXAMPLE,
  SESSION_REPLAY_PLAN_OUTPUT_EXAMPLE,
} from "./session-replay-composer.fixtures.ts";

export const REPLAY_COMPARISON_INTELLIGENCE_INPUT_EXAMPLE = Object.freeze({
  orchestratorPlan: AUTOMATED_REPLAY_ORCHESTRATOR_OUTPUT_EXAMPLE,
  reportIndex: 0,
});

export const REPLAY_COMPARISON_INTELLIGENCE_OUTPUT_EXAMPLE = buildReplayComparisonIntelligenceReport(
  REPLAY_COMPARISON_INTELLIGENCE_INPUT_EXAMPLE
);

export const REPLAY_COMPARISON_INTELLIGENCE_REPORT_ID_EXPECTED = "replay-comparison-intelligence-001";

export const REPLAY_COMPARISON_INTELLIGENCE_ORCHESTRATOR_ID_EXPECTED = "replay-orchestrator-001";

export const REPLAY_COMPARISON_INTELLIGENCE_COMPARISON_IDS_EXPECTED = Object.freeze([
  "replay-comparison-001",
] as const);

export const AUTOMATED_REPLAY_ORCHESTRATOR_REGRESSION_EXAMPLE = buildAutomatedReplayOrchestratorPlan(
  AUTOMATED_REPLAY_ORCHESTRATOR_INPUT_EXAMPLE
);

export const SESSION_REPLAY_REGRESSION_EXAMPLE = buildSessionReplayPlan(
  SESSION_REPLAY_COMPOSER_INPUT_EXAMPLE
);

export const SESSION_REPLAY_REGRESSION_OUTPUT = SESSION_REPLAY_PLAN_OUTPUT_EXAMPLE;

export const AUTOMATED_REPLAY_ORCHESTRATOR_REGRESSION_OUTPUT = AUTOMATED_REPLAY_ORCHESTRATOR_OUTPUT_EXAMPLE;

export const SESSION_REPLAY_COMPOSER_REGRESSION_FIXTURE = SESSION_REPLAY_COMPOSER_REGRESSION_EXAMPLE;
