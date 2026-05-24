import {
  BENCHMARK_REPORT_EXPORT_INPUT_EXAMPLE,
  BENCHMARK_REPORT_EXPORT_OUTPUT_EXAMPLE,
  BENCHMARK_SESSION_MATRIX_REGRESSION_EXAMPLE,
  BENCHMARK_SESSION_MATRIX_REGRESSION_OUTPUT,
} from "./benchmark-report-export.fixtures.ts";
import { buildBenchmarkReportExport, serializeBenchmarkReportExport } from "./benchmark-report-export.ts";
import { serializeBenchmarkSessionMatrix } from "./benchmark-session-matrix.ts";
import { buildVisualQaDashboardData } from "./visual-qa-dashboard-data.ts";

export const VISUAL_QA_DASHBOARD_DATA_INPUT_EXAMPLE = Object.freeze({
  reportExport: BENCHMARK_REPORT_EXPORT_OUTPUT_EXAMPLE,
  dashboardIndex: 0,
});

export const VISUAL_QA_DASHBOARD_DATA_OUTPUT_EXAMPLE = buildVisualQaDashboardData(
  VISUAL_QA_DASHBOARD_DATA_INPUT_EXAMPLE
);

export const VISUAL_QA_DASHBOARD_ID_EXPECTED = "visual-qa-dashboard-001";

export const VISUAL_QA_DASHBOARD_RANKING_CYCLE_IDS_EXPECTED = Object.freeze([
  "real-test-cycle-001",
  "real-test-cycle-002",
] as const);

export const BENCHMARK_REPORT_EXPORT_REGRESSION_EXAMPLE = buildBenchmarkReportExport(
  BENCHMARK_REPORT_EXPORT_INPUT_EXAMPLE
);

export const BENCHMARK_REPORT_EXPORT_REGRESSION_OUTPUT = BENCHMARK_REPORT_EXPORT_OUTPUT_EXAMPLE;

export const BENCHMARK_SESSION_MATRIX_REGRESSION_FIXTURE_EXAMPLE = BENCHMARK_SESSION_MATRIX_REGRESSION_EXAMPLE;

export const BENCHMARK_SESSION_MATRIX_REGRESSION_FIXTURE_OUTPUT = BENCHMARK_SESSION_MATRIX_REGRESSION_OUTPUT;

export function serializeBenchmarkReportExportRegression(reportExport: typeof BENCHMARK_REPORT_EXPORT_OUTPUT_EXAMPLE): string {
  return serializeBenchmarkReportExport(reportExport);
}

export function serializeBenchmarkSessionMatrixRegression(
  matrix: typeof BENCHMARK_SESSION_MATRIX_REGRESSION_OUTPUT
): string {
  return serializeBenchmarkSessionMatrix(matrix);
}
