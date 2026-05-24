import {
  AUTOMATED_VISUAL_SIGNAL_AGGREGATION_OUTPUT_EXAMPLE,
} from "./automated-visual-signal-aggregator.fixtures.ts";
import { buildBenchmarkSessionMatrix } from "./benchmark-session-matrix.ts";
import { IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE } from "./image-generation-request.fixtures.ts";
import { IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE } from "./image-result-evaluation.fixtures.ts";
import { NEXT_GENERATION_REQUEST_OUTPUT_EXAMPLE } from "./next-generation-request-composer.fixtures.ts";
import { PROMPT_POLICY_FEEDBACK_OUTPUT_EXAMPLE } from "./prompt-policy-feedback.fixtures.ts";
import {
  REAL_IMAGE_EVALUATION_INTAKE_002,
} from "./automated-visual-signal-aggregator.fixtures.ts";
import {
  REAL_TEST_CYCLE_REPORT_INPUT_EXAMPLE,
  REAL_TEST_CYCLE_REPORT_OUTPUT_EXAMPLE,
  VISUAL_FEEDBACK_INTEGRATION_REGRESSION_OUTPUT,
} from "./real-test-cycle-report.fixtures.ts";
import { buildRealTestCycleReport } from "./real-test-cycle-report.ts";
import {
  buildVisualFeedbackIntegrationResult,
} from "./visual-feedback-integration.ts";
import { VISUAL_FEEDBACK_INTEGRATION_INPUT_EXAMPLE } from "./visual-feedback-integration.fixtures.ts";

export const REAL_TEST_CYCLE_REPORT_002 = buildRealTestCycleReport({
  request: IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE,
  intake: REAL_IMAGE_EVALUATION_INTAKE_002,
  evaluation: IMAGE_RESULT_EVALUATION_OUTPUT_EXAMPLE,
  visualAggregation: AUTOMATED_VISUAL_SIGNAL_AGGREGATION_OUTPUT_EXAMPLE,
  feedback: PROMPT_POLICY_FEEDBACK_OUTPUT_EXAMPLE,
  nextRequest: NEXT_GENERATION_REQUEST_OUTPUT_EXAMPLE,
  visualIntegration: VISUAL_FEEDBACK_INTEGRATION_REGRESSION_OUTPUT,
  cycleReportIndex: 1,
});

export const BENCHMARK_SESSION_MATRIX_INPUT_EXAMPLE = Object.freeze({
  cycleReports: Object.freeze([
    REAL_TEST_CYCLE_REPORT_002,
    REAL_TEST_CYCLE_REPORT_OUTPUT_EXAMPLE,
    REAL_TEST_CYCLE_REPORT_OUTPUT_EXAMPLE,
  ]),
  matrixIndex: 0,
});

export const BENCHMARK_SESSION_MATRIX_OUTPUT_EXAMPLE = buildBenchmarkSessionMatrix(
  BENCHMARK_SESSION_MATRIX_INPUT_EXAMPLE
);

export const BENCHMARK_SESSION_MATRIX_ID_EXPECTED = "benchmark-matrix-001";

export const BENCHMARK_SESSION_MATRIX_CYCLE_IDS_EXPECTED = Object.freeze([
  "real-test-cycle-001",
  "real-test-cycle-002",
] as const);

export const REAL_TEST_CYCLE_REPORT_REGRESSION_EXAMPLE = buildRealTestCycleReport(
  REAL_TEST_CYCLE_REPORT_INPUT_EXAMPLE
);

export const REAL_TEST_CYCLE_REPORT_REGRESSION_OUTPUT = REAL_TEST_CYCLE_REPORT_OUTPUT_EXAMPLE;

export const VISUAL_FEEDBACK_INTEGRATION_REGRESSION_EXAMPLE = buildVisualFeedbackIntegrationResult(
  VISUAL_FEEDBACK_INTEGRATION_INPUT_EXAMPLE
);

export const VISUAL_FEEDBACK_INTEGRATION_REGRESSION_FIXTURE_OUTPUT =
  VISUAL_FEEDBACK_INTEGRATION_REGRESSION_OUTPUT;
