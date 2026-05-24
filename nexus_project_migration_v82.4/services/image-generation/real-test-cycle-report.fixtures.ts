import {
  AUTOMATED_VISUAL_SIGNAL_AGGREGATION_OUTPUT_EXAMPLE,
  AUTOMATED_VISUAL_SIGNAL_AGGREGATOR_INPUT_EXAMPLE,
} from "./automated-visual-signal-aggregator.fixtures.ts";
import { buildAutomatedVisualSignalAggregation } from "./automated-visual-signal-aggregator.ts";
import { IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE } from "./image-generation-request.fixtures.ts";
import { IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE } from "./image-result-evaluation.fixtures.ts";
import {
  NEXT_GENERATION_REQUEST_OUTPUT_EXAMPLE,
} from "./next-generation-request-composer.fixtures.ts";
import { PROMPT_POLICY_FEEDBACK_OUTPUT_EXAMPLE } from "./prompt-policy-feedback.fixtures.ts";
import {
  REPLAY_COMPARISON_INTELLIGENCE_INPUT_EXAMPLE,
  REPLAY_COMPARISON_INTELLIGENCE_OUTPUT_EXAMPLE,
} from "./replay-comparison-intelligence.fixtures.ts";
import { buildReplayComparisonIntelligenceReport } from "./replay-comparison-intelligence.ts";
import { REAL_IMAGE_EVALUATION_INTAKE_OUTPUT_EXAMPLE } from "./real-image-evaluation-intake.fixtures.ts";
import { buildRealTestCycleReport } from "./real-test-cycle-report.ts";
import {
  VISUAL_FEEDBACK_INTEGRATION_OUTPUT_EXAMPLE,
} from "./visual-feedback-integration.fixtures.ts";

export const REAL_TEST_CYCLE_REPORT_INPUT_EXAMPLE = Object.freeze({
  request: IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE,
  intake: REAL_IMAGE_EVALUATION_INTAKE_OUTPUT_EXAMPLE,
  evaluation: IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE,
  visualAggregation: AUTOMATED_VISUAL_SIGNAL_AGGREGATION_OUTPUT_EXAMPLE,
  feedback: PROMPT_POLICY_FEEDBACK_OUTPUT_EXAMPLE,
  nextRequest: NEXT_GENERATION_REQUEST_OUTPUT_EXAMPLE,
  visualIntegration: VISUAL_FEEDBACK_INTEGRATION_OUTPUT_EXAMPLE,
  cycleReportIndex: 0,
});

export const REAL_TEST_CYCLE_REPORT_OUTPUT_EXAMPLE = buildRealTestCycleReport(
  REAL_TEST_CYCLE_REPORT_INPUT_EXAMPLE
);

export const REAL_TEST_CYCLE_REPORT_ID_EXPECTED = "real-test-cycle-001";

export const REAL_TEST_CYCLE_PIPELINE_SECTIONS_EXPECTED = Object.freeze([
  "request",
  "intake",
  "evaluation",
  "aggregation",
  "feedback",
  "integration",
  "next-request",
] as const);

export const VISUAL_FEEDBACK_INTEGRATION_REGRESSION_OUTPUT = VISUAL_FEEDBACK_INTEGRATION_OUTPUT_EXAMPLE;

export const AUTOMATED_VISUAL_SIGNAL_AGGREGATOR_REGRESSION_EXAMPLE = buildAutomatedVisualSignalAggregation(
  AUTOMATED_VISUAL_SIGNAL_AGGREGATOR_INPUT_EXAMPLE
);

export const AUTOMATED_VISUAL_SIGNAL_AGGREGATOR_REGRESSION_OUTPUT =
  AUTOMATED_VISUAL_SIGNAL_AGGREGATION_OUTPUT_EXAMPLE;

export const REPLAY_COMPARISON_INTELLIGENCE_REGRESSION_EXAMPLE = buildReplayComparisonIntelligenceReport(
  REPLAY_COMPARISON_INTELLIGENCE_INPUT_EXAMPLE
);

export const REPLAY_COMPARISON_INTELLIGENCE_REGRESSION_OUTPUT = REPLAY_COMPARISON_INTELLIGENCE_OUTPUT_EXAMPLE;
