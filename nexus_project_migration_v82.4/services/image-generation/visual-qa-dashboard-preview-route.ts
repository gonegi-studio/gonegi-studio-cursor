/** Phase-28A: visual QA dashboard preview route — deterministic preview payload contract (pure, deterministic) */

import crypto from "crypto";
import type {
  VisualQaDashboardData,
  VisualQaHeatmapRow,
  VisualQaRankingTableRow,
  VisualQaTrendSignals,
} from "./visual-qa-dashboard-data.ts";
import type { RegressionHeatmapSignalKind } from "./benchmark-session-matrix.ts";

export type VisualQaDashboardPreviewRouteVersion = "v1";

export type VisualQaPreviewSectionKind = "summary" | "ranking" | "heatmap" | "trends";

export type VisualQaPreviewSection = {
  readonly sectionOrder: number;
  readonly sectionId: string;
  readonly sectionKind: VisualQaPreviewSectionKind;
  readonly title: string;
  readonly itemCount: number;
  readonly renderPriority: number;
};

export type VisualQaRankingPreviewRow = {
  readonly previewOrder: number;
  readonly previewRowId: string;
  readonly cycleReportId: string;
  readonly displayRank: number;
  readonly stabilityScore: number;
  readonly styleScore: number;
  readonly riskScore: number;
  readonly statusBand: VisualQaRankingTableRow["statusBand"];
  readonly previewLabel: string;
};

export type VisualQaHeatmapPreviewRow = {
  readonly previewOrder: number;
  readonly previewRowId: string;
  readonly cycleReportId: string;
  readonly signalKind: RegressionHeatmapSignalKind;
  readonly intensityScore: number;
  readonly severityBand: VisualQaHeatmapRow["severityBand"];
  readonly renderWeight: number;
  readonly previewLabel: string;
};

export type VisualQaPreviewRouteMetadata = {
  readonly previewRouteId: string;
  readonly dashboardId: string;
  readonly sourceExportId: string;
  readonly matrixId: string;
  readonly previewVersion: VisualQaDashboardPreviewRouteVersion;
  readonly previewSequence: number;
  readonly sectionCount: number;
  readonly rankingPreviewRowCount: number;
  readonly heatmapPreviewRowCount: number;
  readonly trendSignalCount: number;
};

export type VisualQaDashboardPreviewRouteInput = {
  readonly dashboardData: VisualQaDashboardData;
  readonly previewIndex?: number;
};

export type VisualQaDashboardPreviewRoute = {
  readonly version: VisualQaDashboardPreviewRouteVersion;
  readonly previewRouteId: string;
  readonly dashboardId: string;
  readonly previewSections: readonly VisualQaPreviewSection[];
  readonly rankingPreviewRows: readonly VisualQaRankingPreviewRow[];
  readonly heatmapPreviewRows: readonly VisualQaHeatmapPreviewRow[];
  readonly routeMetadata: VisualQaPreviewRouteMetadata;
};

export const VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_VERSION: VisualQaDashboardPreviewRouteVersion = "v1";

export const VISUAL_QA_PREVIEW_SECTION_KINDS: readonly VisualQaPreviewSectionKind[] = Object.freeze([
  "summary",
  "ranking",
  "heatmap",
  "trends",
]);

export const VISUAL_QA_PREVIEW_SECTION_TITLES: Readonly<Record<VisualQaPreviewSectionKind, string>> = Object.freeze({
  summary: "QA Summary Cards",
  ranking: "Style Stability Ranking",
  heatmap: "Regression Heatmap",
  trends: "Trend Signals",
});

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function buildPreviewRouteId(previewIndex: number): string {
  return `visual-qa-preview-${String(previewIndex + 1).padStart(3, "0")}`;
}

function buildSectionId(sectionOrder: number): string {
  return `preview-section-${String(sectionOrder).padStart(3, "0")}`;
}

function buildRankingPreviewRowId(previewOrder: number): string {
  return `ranking-preview-${String(previewOrder).padStart(3, "0")}`;
}

function buildHeatmapPreviewRowId(previewOrder: number): string {
  return `heatmap-preview-${String(previewOrder).padStart(3, "0")}`;
}

function resolvePreviewIndex(dashboardData: VisualQaDashboardData, previewIndex: number | undefined): number {
  if (previewIndex !== undefined) {
    return previewIndex;
  }

  const match = dashboardData.dashboardId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function resolveSectionItemCount(
  sectionKind: VisualQaPreviewSectionKind,
  dashboardData: VisualQaDashboardData
): number {
  switch (sectionKind) {
    case "summary":
      return dashboardData.summaryCards.length;
    case "ranking":
      return dashboardData.rankingTableRows.length;
    case "heatmap":
      return dashboardData.heatmapRows.length;
    case "trends":
      return Object.keys(dashboardData.trendSignals).length;
  }
}

function resolveSectionRenderPriority(sectionKind: VisualQaPreviewSectionKind): number {
  switch (sectionKind) {
    case "summary":
      return 1;
    case "ranking":
      return 2;
    case "heatmap":
      return 3;
    case "trends":
      return 4;
  }
}

function buildPreviewSections(dashboardData: VisualQaDashboardData): readonly VisualQaPreviewSection[] {
  return Object.freeze(
    VISUAL_QA_PREVIEW_SECTION_KINDS.map((sectionKind, index) =>
      Object.freeze({
        sectionOrder: index + 1,
        sectionId: buildSectionId(index + 1),
        sectionKind,
        title: VISUAL_QA_PREVIEW_SECTION_TITLES[sectionKind],
        itemCount: resolveSectionItemCount(sectionKind, dashboardData),
        renderPriority: resolveSectionRenderPriority(sectionKind),
      })
    )
  );
}

function dedupeRankingPreviewRows(
  rows: readonly VisualQaRankingTableRow[]
): readonly VisualQaRankingTableRow[] {
  const byCycleReportId = new Map<string, VisualQaRankingTableRow>();

  for (const row of rows) {
    const existing = byCycleReportId.get(row.cycleReportId);
    if (!existing || row.rowOrder < existing.rowOrder) {
      byCycleReportId.set(row.cycleReportId, row);
    }
  }

  return Object.freeze(
    [...byCycleReportId.values()].sort((left, right) => {
      const rankDelta = left.displayRank - right.displayRank;
      if (rankDelta !== 0) {
        return rankDelta;
      }
      return left.cycleReportId.localeCompare(right.cycleReportId);
    })
  );
}

function buildRankingPreviewLabel(row: VisualQaRankingTableRow): string {
  return [
    `rank:${row.displayRank}`,
    `cycle:${row.cycleReportId}`,
    `stability:${clampScore(row.stabilityScore).toFixed(6)}`,
    `status:${row.statusBand}`,
  ].join(" | ");
}

function buildRankingPreviewRows(
  dashboardData: VisualQaDashboardData
): readonly VisualQaRankingPreviewRow[] {
  const deduped = dedupeRankingPreviewRows(dashboardData.rankingTableRows);

  return Object.freeze(
    deduped.map((row, index) =>
      Object.freeze({
        previewOrder: index + 1,
        previewRowId: buildRankingPreviewRowId(index + 1),
        cycleReportId: row.cycleReportId,
        displayRank: row.displayRank,
        stabilityScore: row.stabilityScore,
        styleScore: row.styleScore,
        riskScore: row.riskScore,
        statusBand: row.statusBand,
        previewLabel: buildRankingPreviewLabel(row),
      })
    )
  );
}

function dedupeHeatmapPreviewRows(rows: readonly VisualQaHeatmapRow[]): readonly VisualQaHeatmapRow[] {
  const byKey = new Map<string, VisualQaHeatmapRow>();

  for (const row of rows) {
    const key = `${row.cycleReportId}|${row.signalKind}`;
    const existing = byKey.get(key);
    if (!existing || row.rowOrder < existing.rowOrder) {
      byKey.set(key, row);
    }
  }

  return Object.freeze(
    [...byKey.values()].sort((left, right) => {
      const reportDelta = left.cycleReportId.localeCompare(right.cycleReportId);
      if (reportDelta !== 0) {
        return reportDelta;
      }
      return left.signalKind.localeCompare(right.signalKind);
    })
  );
}

function buildHeatmapPreviewLabel(row: VisualQaHeatmapRow): string {
  return [
    `cycle:${row.cycleReportId}`,
    `signal:${row.signalKind}`,
    `intensity:${clampScore(row.intensityScore).toFixed(6)}`,
    `severity:${row.severityBand}`,
  ].join(" | ");
}

function buildHeatmapPreviewRows(
  dashboardData: VisualQaDashboardData
): readonly VisualQaHeatmapPreviewRow[] {
  const deduped = dedupeHeatmapPreviewRows(dashboardData.heatmapRows);

  return Object.freeze(
    deduped.map((row, index) =>
      Object.freeze({
        previewOrder: index + 1,
        previewRowId: buildHeatmapPreviewRowId(index + 1),
        cycleReportId: row.cycleReportId,
        signalKind: row.signalKind,
        intensityScore: row.intensityScore,
        severityBand: row.severityBand,
        renderWeight: row.renderWeight,
        previewLabel: buildHeatmapPreviewLabel(row),
      })
    )
  );
}

function countTrendSignals(trendSignals: VisualQaTrendSignals): number {
  return Object.keys(trendSignals).length;
}

function buildRouteMetadata(
  previewRouteId: string,
  dashboardData: VisualQaDashboardData,
  previewSequence: number,
  previewSections: readonly VisualQaPreviewSection[],
  rankingPreviewRows: readonly VisualQaRankingPreviewRow[],
  heatmapPreviewRows: readonly VisualQaHeatmapPreviewRow[]
): VisualQaPreviewRouteMetadata {
  return Object.freeze({
    previewRouteId,
    dashboardId: dashboardData.dashboardId,
    sourceExportId: dashboardData.dashboardMetadata.sourceExportId,
    matrixId: dashboardData.dashboardMetadata.matrixId,
    previewVersion: VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_VERSION,
    previewSequence,
    sectionCount: previewSections.length,
    rankingPreviewRowCount: rankingPreviewRows.length,
    heatmapPreviewRowCount: heatmapPreviewRows.length,
    trendSignalCount: countTrendSignals(dashboardData.trendSignals),
  });
}

export function buildVisualQaDashboardPreviewRoute(
  input: VisualQaDashboardPreviewRouteInput
): VisualQaDashboardPreviewRoute {
  const previewSequence = resolvePreviewIndex(input.dashboardData, input.previewIndex);
  const previewRouteId = buildPreviewRouteId(previewSequence);
  const previewSections = buildPreviewSections(input.dashboardData);
  const rankingPreviewRows = buildRankingPreviewRows(input.dashboardData);
  const heatmapPreviewRows = buildHeatmapPreviewRows(input.dashboardData);
  const routeMetadata = buildRouteMetadata(
    previewRouteId,
    input.dashboardData,
    previewSequence,
    previewSections,
    rankingPreviewRows,
    heatmapPreviewRows
  );

  return Object.freeze({
    version: VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_VERSION,
    previewRouteId,
    dashboardId: input.dashboardData.dashboardId,
    previewSections,
    rankingPreviewRows,
    heatmapPreviewRows,
    routeMetadata,
  });
}

export function serializeVisualQaDashboardPreviewRoute(
  previewRoute: VisualQaDashboardPreviewRoute
): string {
  return JSON.stringify({
    version: previewRoute.version,
    previewRouteId: previewRoute.previewRouteId,
    dashboardId: previewRoute.dashboardId,
    previewSections: previewRoute.previewSections,
    rankingPreviewRows: previewRoute.rankingPreviewRows,
    heatmapPreviewRows: previewRoute.heatmapPreviewRows,
    routeMetadata: previewRoute.routeMetadata,
  });
}

export function computeVisualQaDashboardPreviewRouteFingerprint(
  previewRoute: VisualQaDashboardPreviewRoute
): string {
  return crypto.createHash("sha256").update(serializeVisualQaDashboardPreviewRoute(previewRoute)).digest("hex");
}

export function assertVisualQaDashboardPreviewSectionsDeterministic(
  previewRoute: VisualQaDashboardPreviewRoute
): boolean {
  const sectionIds = previewRoute.previewSections.map((section) => section.sectionId);
  const sortedSectionIds = [...sectionIds].sort((left, right) => left.localeCompare(right));
  const kinds = previewRoute.previewSections.map((section) => section.sectionKind);

  const prioritiesAscending = previewRoute.previewSections.every(
    (section, index) =>
      index === 0 || section.renderPriority >= previewRoute.previewSections[index - 1].renderPriority
  );

  return (
    sectionIds.join("|") === sortedSectionIds.join("|") &&
    kinds.join("|") === VISUAL_QA_PREVIEW_SECTION_KINDS.join("|") &&
    prioritiesAscending &&
    previewRoute.previewSections.every(
      (section, index) => section.sectionOrder === index + 1 && section.sectionId === buildSectionId(index + 1)
    )
  );
}

export function assertVisualQaDashboardRankingPreviewRowsDeterministic(
  previewRoute: VisualQaDashboardPreviewRoute
): boolean {
  const rowIds = previewRoute.rankingPreviewRows.map((row) => row.previewRowId);
  const sortedRowIds = [...rowIds].sort((left, right) => left.localeCompare(right));
  const cycleIds = previewRoute.rankingPreviewRows.map((row) => row.cycleReportId);
  const uniqueCycleIds = new Set(cycleIds);

  const scoresDescending = previewRoute.rankingPreviewRows.every(
    (row, index) =>
      index === 0 || row.stabilityScore <= previewRoute.rankingPreviewRows[index - 1].stabilityScore
  );

  return (
    rowIds.join("|") === sortedRowIds.join("|") &&
    cycleIds.length === uniqueCycleIds.size &&
    scoresDescending &&
    previewRoute.rankingPreviewRows.every(
      (row, index) => row.previewOrder === index + 1 && row.previewRowId === buildRankingPreviewRowId(index + 1)
    )
  );
}

export function assertVisualQaDashboardHeatmapPreviewRowsDeterministic(
  previewRoute: VisualQaDashboardPreviewRoute
): boolean {
  const rowIds = previewRoute.heatmapPreviewRows.map((row) => row.previewRowId);
  const sortedRowIds = [...rowIds].sort((left, right) => left.localeCompare(right));

  const ordered = previewRoute.heatmapPreviewRows.every((row, index) => {
    if (index === 0) {
      return true;
    }
    const previous = previewRoute.heatmapPreviewRows[index - 1];
    const reportDelta = previous.cycleReportId.localeCompare(row.cycleReportId);
    if (reportDelta !== 0) {
      return reportDelta < 0;
    }
    return previous.signalKind.localeCompare(row.signalKind) < 0;
  });

  return (
    rowIds.join("|") === sortedRowIds.join("|") &&
    ordered &&
    previewRoute.heatmapPreviewRows.every(
      (row, index) => row.previewOrder === index + 1 && row.previewRowId === buildHeatmapPreviewRowId(index + 1)
    )
  );
}

export function assertVisualQaDashboardPreviewRouteMetadataDeterministic(
  previewRoute: VisualQaDashboardPreviewRoute
): boolean {
  const metadata = previewRoute.routeMetadata;

  return (
    metadata.previewRouteId === previewRoute.previewRouteId &&
    metadata.dashboardId === previewRoute.dashboardId &&
    metadata.sectionCount === previewRoute.previewSections.length &&
    metadata.rankingPreviewRowCount === previewRoute.rankingPreviewRows.length &&
    metadata.heatmapPreviewRowCount === previewRoute.heatmapPreviewRows.length &&
    metadata.trendSignalCount === 5 &&
    metadata.previewVersion === VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_VERSION
  );
}

export function assertVisualQaDashboardPreviewDuplicateRowRemoval(
  dashboardData: VisualQaDashboardData,
  previewRoute: VisualQaDashboardPreviewRoute
): boolean {
  const uniqueRankingCount = new Set(dashboardData.rankingTableRows.map((row) => row.cycleReportId)).size;
  const uniqueHeatmapCount = new Set(
    dashboardData.heatmapRows.map((row) => `${row.cycleReportId}|${row.signalKind}`)
  ).size;

  return (
    previewRoute.rankingPreviewRows.length === uniqueRankingCount &&
    new Set(previewRoute.rankingPreviewRows.map((row) => row.cycleReportId)).size ===
      previewRoute.rankingPreviewRows.length &&
    previewRoute.heatmapPreviewRows.length === uniqueHeatmapCount &&
    new Set(previewRoute.heatmapPreviewRows.map((row) => `${row.cycleReportId}|${row.signalKind}`)).size ===
      previewRoute.heatmapPreviewRows.length
  );
}

export function assertVisualQaDashboardPreviewRouteDeterministic(
  previewRoute: VisualQaDashboardPreviewRoute
): boolean {
  return (
    assertVisualQaDashboardPreviewSectionsDeterministic(previewRoute) &&
    assertVisualQaDashboardRankingPreviewRowsDeterministic(previewRoute) &&
    assertVisualQaDashboardHeatmapPreviewRowsDeterministic(previewRoute) &&
    assertVisualQaDashboardPreviewRouteMetadataDeterministic(previewRoute)
  );
}
