import {
  VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_OUTPUT_EXAMPLE,
  VISUAL_QA_PREVIEW_ROUTE_ID_EXPECTED,
  VISUAL_QA_PREVIEW_SECTION_KINDS_EXPECTED,
  VISUAL_QA_PREVIEW_RANKING_CYCLE_IDS_EXPECTED,
} from "../../../../services/image-generation/visual-qa-dashboard-preview-route.fixtures.ts";
import {
  serializeVisualQaDashboardPreviewRoute,
  assertVisualQaDashboardPreviewSectionsDeterministic,
  assertVisualQaDashboardRankingPreviewRowsDeterministic,
  assertVisualQaDashboardHeatmapPreviewRowsDeterministic,
  assertVisualQaDashboardPreviewRouteMetadataDeterministic,
} from "../../../../services/image-generation/visual-qa-dashboard-preview-route.ts";

export const VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_FIXTURE_SNAPSHOT =
  VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_OUTPUT_EXAMPLE;

export const VISUAL_QA_DASHBOARD_PREVIEW_API_RESPONSE_EXPECTED =
  serializeVisualQaDashboardPreviewRoute(VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_FIXTURE_SNAPSHOT);

export const VISUAL_QA_DASHBOARD_PREVIEW_API_ROUTE_ID_EXPECTED = VISUAL_QA_PREVIEW_ROUTE_ID_EXPECTED;

export const VISUAL_QA_DASHBOARD_PREVIEW_API_SECTION_KINDS_EXPECTED =
  VISUAL_QA_PREVIEW_SECTION_KINDS_EXPECTED;

export const VISUAL_QA_DASHBOARD_PREVIEW_API_RANKING_CYCLE_IDS_EXPECTED =
  VISUAL_QA_PREVIEW_RANKING_CYCLE_IDS_EXPECTED;

export function assertVisualQaDashboardPreviewApiFixtureDeterministic(): boolean {
  const snapshot = VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_FIXTURE_SNAPSHOT;

  return (
    snapshot.previewRouteId === VISUAL_QA_PREVIEW_ROUTE_ID_EXPECTED &&
    assertVisualQaDashboardPreviewSectionsDeterministic(snapshot) &&
    assertVisualQaDashboardRankingPreviewRowsDeterministic(snapshot) &&
    assertVisualQaDashboardHeatmapPreviewRowsDeterministic(snapshot) &&
    assertVisualQaDashboardPreviewRouteMetadataDeterministic(snapshot)
  );
}

export function serializeVisualQaDashboardPreviewRouteRegression(
  previewRoute: typeof VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_OUTPUT_EXAMPLE
): string {
  return serializeVisualQaDashboardPreviewRoute(previewRoute);
}
