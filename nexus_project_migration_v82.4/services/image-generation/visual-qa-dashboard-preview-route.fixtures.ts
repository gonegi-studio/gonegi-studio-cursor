import {
  BENCHMARK_REPORT_EXPORT_INPUT_EXAMPLE,
  BENCHMARK_REPORT_EXPORT_OUTPUT_EXAMPLE,
} from "./benchmark-report-export.fixtures.ts";
import { buildBenchmarkReportExport, serializeBenchmarkReportExport } from "./benchmark-report-export.ts";
import {
  VISUAL_QA_DASHBOARD_DATA_INPUT_EXAMPLE,
  VISUAL_QA_DASHBOARD_DATA_OUTPUT_EXAMPLE,
} from "./visual-qa-dashboard-data.fixtures.ts";
import { buildVisualQaDashboardData, serializeVisualQaDashboardData } from "./visual-qa-dashboard-data.ts";
import { buildVisualQaDashboardPreviewRoute } from "./visual-qa-dashboard-preview-route.ts";

export const VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_INPUT_EXAMPLE = Object.freeze({
  dashboardData: VISUAL_QA_DASHBOARD_DATA_OUTPUT_EXAMPLE,
  previewIndex: 0,
});

export const VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_OUTPUT_EXAMPLE = buildVisualQaDashboardPreviewRoute(
  VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_INPUT_EXAMPLE
);

export const VISUAL_QA_PREVIEW_ROUTE_ID_EXPECTED = "visual-qa-preview-001";

export const VISUAL_QA_PREVIEW_SECTION_KINDS_EXPECTED = Object.freeze([
  "summary",
  "ranking",
  "heatmap",
  "trends",
] as const);

export const VISUAL_QA_PREVIEW_RANKING_CYCLE_IDS_EXPECTED = Object.freeze([
  "real-test-cycle-001",
  "real-test-cycle-002",
] as const);

export const VISUAL_QA_DASHBOARD_REGRESSION_EXAMPLE = buildVisualQaDashboardData(
  VISUAL_QA_DASHBOARD_DATA_INPUT_EXAMPLE
);

export const VISUAL_QA_DASHBOARD_REGRESSION_OUTPUT = VISUAL_QA_DASHBOARD_DATA_OUTPUT_EXAMPLE;

export const BENCHMARK_REPORT_EXPORT_REGRESSION_EXAMPLE = buildBenchmarkReportExport(
  BENCHMARK_REPORT_EXPORT_INPUT_EXAMPLE
);

export const BENCHMARK_REPORT_EXPORT_REGRESSION_OUTPUT = BENCHMARK_REPORT_EXPORT_OUTPUT_EXAMPLE;

export function serializeVisualQaDashboardRegression(
  dashboardData: typeof VISUAL_QA_DASHBOARD_DATA_OUTPUT_EXAMPLE
): string {
  return serializeVisualQaDashboardData(dashboardData);
}

export function serializeBenchmarkReportExportRegression(
  reportExport: typeof BENCHMARK_REPORT_EXPORT_OUTPUT_EXAMPLE
): string {
  return serializeBenchmarkReportExport(reportExport);
}
