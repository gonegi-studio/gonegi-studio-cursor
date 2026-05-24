import {
  BENCHMARK_SESSION_MATRIX_INPUT_EXAMPLE,
  BENCHMARK_SESSION_MATRIX_OUTPUT_EXAMPLE,
} from "./benchmark-session-matrix.fixtures.ts";
import {
  REAL_TEST_CYCLE_REPORT_INPUT_EXAMPLE,
  REAL_TEST_CYCLE_REPORT_OUTPUT_EXAMPLE,
} from "./real-test-cycle-report.fixtures.ts";
import { buildBenchmarkReportExport } from "./benchmark-report-export.ts";
import { buildBenchmarkSessionMatrix } from "./benchmark-session-matrix.ts";
import { buildRealTestCycleReport } from "./real-test-cycle-report.ts";

export const BENCHMARK_REPORT_EXPORT_INPUT_EXAMPLE = Object.freeze({
  matrix: BENCHMARK_SESSION_MATRIX_OUTPUT_EXAMPLE,
  exportIndex: 0,
});

export const BENCHMARK_REPORT_EXPORT_OUTPUT_EXAMPLE = buildBenchmarkReportExport(
  BENCHMARK_REPORT_EXPORT_INPUT_EXAMPLE
);

export const BENCHMARK_REPORT_EXPORT_ID_EXPECTED = "benchmark-export-001";

export const BENCHMARK_REPORT_EXPORT_MATRIX_ID_EXPECTED = "benchmark-matrix-001";

export const BENCHMARK_REPORT_EXPORT_RANKING_CYCLE_IDS_EXPECTED = Object.freeze([
  "real-test-cycle-001",
  "real-test-cycle-002",
] as const);

export const BENCHMARK_SESSION_MATRIX_REGRESSION_EXAMPLE = buildBenchmarkSessionMatrix(
  BENCHMARK_SESSION_MATRIX_INPUT_EXAMPLE
);

export const BENCHMARK_SESSION_MATRIX_REGRESSION_OUTPUT = BENCHMARK_SESSION_MATRIX_OUTPUT_EXAMPLE;

export const REAL_TEST_CYCLE_REPORT_REGRESSION_EXAMPLE = buildRealTestCycleReport(
  REAL_TEST_CYCLE_REPORT_INPUT_EXAMPLE
);

export const REAL_TEST_CYCLE_REPORT_REGRESSION_OUTPUT = REAL_TEST_CYCLE_REPORT_OUTPUT_EXAMPLE;
