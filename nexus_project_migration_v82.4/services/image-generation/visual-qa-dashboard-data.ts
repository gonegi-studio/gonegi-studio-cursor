/** Phase-27A: visual QA dashboard data — dashboard-ready deterministic QA visualization model (pure, deterministic) */

import crypto from "crypto";
import type { BenchmarkReportExport } from "./benchmark-report-export.ts";
import type { RegressionHeatmapSignalKind } from "./benchmark-session-matrix.ts";
import { BENCHMARK_HEATMAP_HIGH_INTENSITY_THRESHOLD } from "./benchmark-session-matrix.ts";

export type VisualQaDashboardDataVersion = "v1";

export type VisualQaSummaryCardKind =
  | "benchmarkCount"
  | "styleStability"
  | "readiness"
  | "regressionRisk"
  | "replayReady"
  | "highRegression";

export type VisualQaStatusBand = "stable" | "watch" | "critical";

export type VisualQaTrendDirection = "stable" | "elevated" | "critical";

export type VisualQaSummaryCard = {
  readonly cardOrder: number;
  readonly cardId: string;
  readonly cardKind: VisualQaSummaryCardKind;
  readonly label: string;
  readonly value: string;
  readonly numericScore: number;
};

export type VisualQaRankingTableRow = {
  readonly rowOrder: number;
  readonly rowId: string;
  readonly cycleReportId: string;
  readonly displayRank: number;
  readonly stabilityScore: number;
  readonly styleScore: number;
  readonly riskScore: number;
  readonly statusBand: VisualQaStatusBand;
};

export type VisualQaHeatmapRow = {
  readonly rowOrder: number;
  readonly rowId: string;
  readonly cycleReportId: string;
  readonly signalKind: RegressionHeatmapSignalKind;
  readonly intensityScore: number;
  readonly severityBand: BenchmarkReportExport["regressionHeatmapSummary"][number]["severityBand"];
  readonly renderWeight: number;
};

export type VisualQaTrendSignalKind = "identity" | "style" | "emotion" | "drift" | "overall";

export type VisualQaTrendSignal = {
  readonly signalId: string;
  readonly signalKind: VisualQaTrendSignalKind;
  readonly bandScore: number;
  readonly direction: VisualQaTrendDirection;
};

export type VisualQaTrendSignals = {
  readonly identityTrend: VisualQaTrendSignal;
  readonly styleTrend: VisualQaTrendSignal;
  readonly emotionTrend: VisualQaTrendSignal;
  readonly driftTrend: VisualQaTrendSignal;
  readonly overallTrend: VisualQaTrendSignal;
};

export type VisualQaDashboardMetadata = {
  readonly dashboardId: string;
  readonly sourceExportId: string;
  readonly matrixId: string;
  readonly benchmarkCount: number;
  readonly summaryCardCount: number;
  readonly rankingRowCount: number;
  readonly heatmapRowCount: number;
  readonly dashboardSequence: number;
};

export type VisualQaDashboardDataInput = {
  readonly reportExport: BenchmarkReportExport;
  readonly dashboardIndex?: number;
};

export type VisualQaDashboardData = {
  readonly version: VisualQaDashboardDataVersion;
  readonly dashboardId: string;
  readonly summaryCards: readonly VisualQaSummaryCard[];
  readonly rankingTableRows: readonly VisualQaRankingTableRow[];
  readonly heatmapRows: readonly VisualQaHeatmapRow[];
  readonly trendSignals: VisualQaTrendSignals;
  readonly dashboardMetadata: VisualQaDashboardMetadata;
};

export const VISUAL_QA_DASHBOARD_DATA_VERSION: VisualQaDashboardDataVersion = "v1";

export const VISUAL_QA_SUMMARY_CARD_KINDS: readonly VisualQaSummaryCardKind[] = Object.freeze([
  "benchmarkCount",
  "styleStability",
  "readiness",
  "regressionRisk",
  "replayReady",
  "highRegression",
]);

export const VISUAL_QA_TREND_ELEVATED_THRESHOLD = 0.33;

export const VISUAL_QA_RANKING_STABLE_STABILITY_THRESHOLD = 0.36;

export const VISUAL_QA_RANKING_CRITICAL_RISK_THRESHOLD = 0.33;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function buildDashboardId(dashboardIndex: number): string {
  return `visual-qa-dashboard-${String(dashboardIndex + 1).padStart(3, "0")}`;
}

function buildCardId(cardOrder: number): string {
  return `summary-card-${String(cardOrder).padStart(3, "0")}`;
}

function buildDashboardRowId(rowOrder: number): string {
  return `dashboard-ranking-${String(rowOrder).padStart(3, "0")}`;
}

function buildHeatmapRowId(rowOrder: number): string {
  return `dashboard-heatmap-${String(rowOrder).padStart(3, "0")}`;
}

function buildTrendSignalId(signalKind: VisualQaTrendSignalKind): string {
  return `trend-signal-${signalKind}`;
}

function resolveDashboardIndex(reportExport: BenchmarkReportExport, dashboardIndex: number | undefined): number {
  if (dashboardIndex !== undefined) {
    return dashboardIndex;
  }

  const match = reportExport.exportId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function resolveTrendDirection(bandScore: number): VisualQaTrendDirection {
  if (bandScore >= BENCHMARK_HEATMAP_HIGH_INTENSITY_THRESHOLD) {
    return "critical";
  }
  if (bandScore >= VISUAL_QA_TREND_ELEVATED_THRESHOLD) {
    return "elevated";
  }
  return "stable";
}

function resolveRankingStatusBand(stabilityScore: number, riskScore: number): VisualQaStatusBand {
  if (
    stabilityScore >= VISUAL_QA_RANKING_STABLE_STABILITY_THRESHOLD &&
    riskScore < VISUAL_QA_RANKING_CRITICAL_RISK_THRESHOLD
  ) {
    return "stable";
  }
  if (stabilityScore < VISUAL_QA_RANKING_STABLE_STABILITY_THRESHOLD || riskScore >= VISUAL_QA_RANKING_CRITICAL_RISK_THRESHOLD) {
    if (stabilityScore < 0.34 || riskScore >= 0.33) {
      return "critical";
    }
  }
  return "watch";
}

function resolveRegressionRiskScore(reportExport: BenchmarkReportExport): number {
  const summary = reportExport.reportSummary;
  const bandAverage = clampScore(
    (summary.identityBand + summary.styleBand + summary.emotionBand + summary.driftSpreadBand) / 4
  );
  const cellPenalty = clampScore(summary.highRegressionCellCount * 0.08);

  return clampScore(bandAverage + cellPenalty);
}

function buildSummaryCards(reportExport: BenchmarkReportExport): readonly VisualQaSummaryCard[] {
  const summary = reportExport.reportSummary;
  const cardValues: Record<VisualQaSummaryCardKind, { label: string; value: string; numericScore: number }> = {
    benchmarkCount: {
      label: "Benchmark Count",
      value: String(summary.benchmarkCount),
      numericScore: clampScore(summary.benchmarkCount / 10),
    },
    styleStability: {
      label: "Style Stability",
      value: summary.averageStyleStabilityScore.toFixed(6),
      numericScore: summary.averageStyleStabilityScore,
    },
    readiness: {
      label: "Readiness",
      value: summary.averageReadinessScore.toFixed(6),
      numericScore: summary.averageReadinessScore,
    },
    regressionRisk: {
      label: "Regression Risk",
      value: resolveRegressionRiskScore(reportExport).toFixed(6),
      numericScore: resolveRegressionRiskScore(reportExport),
    },
    replayReady: {
      label: "Replay Ready",
      value: String(summary.replayReadyCount),
      numericScore: clampScore(summary.replayReadyCount / Math.max(summary.benchmarkCount, 1)),
    },
    highRegression: {
      label: "High Regression Cells",
      value: String(summary.highRegressionCellCount),
      numericScore: clampScore(summary.highRegressionCellCount * 0.1),
    },
  };

  return Object.freeze(
    VISUAL_QA_SUMMARY_CARD_KINDS.map((cardKind, index) =>
      Object.freeze({
        cardOrder: index + 1,
        cardId: buildCardId(index + 1),
        cardKind,
        label: cardValues[cardKind].label,
        value: cardValues[cardKind].value,
        numericScore: cardValues[cardKind].numericScore,
      })
    )
  );
}

function dedupeRankingRows(
  rows: readonly BenchmarkReportExport["rankingTable"][number][]
): readonly BenchmarkReportExport["rankingTable"][number][] {
  const byCycleReportId = new Map<string, BenchmarkReportExport["rankingTable"][number]>();

  for (const row of rows) {
    const existing = byCycleReportId.get(row.cycleReportId);
    if (!existing || row.rowOrder < existing.rowOrder) {
      byCycleReportId.set(row.cycleReportId, row);
    }
  }

  return Object.freeze(
    [...byCycleReportId.values()].sort((left, right) => {
      const rankDelta = left.rankOrder - right.rankOrder;
      if (rankDelta !== 0) {
        return rankDelta;
      }
      return left.cycleReportId.localeCompare(right.cycleReportId);
    })
  );
}

function buildRankingTableRows(
  reportExport: BenchmarkReportExport
): readonly VisualQaRankingTableRow[] {
  const deduped = dedupeRankingRows(reportExport.rankingTable);

  return Object.freeze(
    deduped.map((row, index) =>
      Object.freeze({
        rowOrder: index + 1,
        rowId: buildDashboardRowId(index + 1),
        cycleReportId: row.cycleReportId,
        displayRank: row.rankOrder,
        stabilityScore: row.styleStabilityScore,
        styleScore: row.styleConsistencyScore,
        riskScore: row.regressionRiskScore,
        statusBand: resolveRankingStatusBand(row.styleStabilityScore, row.regressionRiskScore),
      })
    )
  );
}

function dedupeHeatmapRows(
  rows: readonly BenchmarkReportExport["regressionHeatmapSummary"][number][]
): readonly BenchmarkReportExport["regressionHeatmapSummary"][number][] {
  const byKey = new Map<string, BenchmarkReportExport["regressionHeatmapSummary"][number]>();

  for (const row of rows) {
    const key = `${row.cycleReportId}|${row.signalKind}`;
    const existing = byKey.get(key);
    if (!existing || row.summaryOrder < existing.summaryOrder) {
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

function buildHeatmapRows(reportExport: BenchmarkReportExport): readonly VisualQaHeatmapRow[] {
  const deduped = dedupeHeatmapRows(reportExport.regressionHeatmapSummary);

  return Object.freeze(
    deduped.map((row, index) =>
      Object.freeze({
        rowOrder: index + 1,
        rowId: buildHeatmapRowId(index + 1),
        cycleReportId: row.cycleReportId,
        signalKind: row.signalKind,
        intensityScore: row.intensityScore,
        severityBand: row.severityBand,
        renderWeight: clampScore(row.intensityScore * (row.severityBand === "high" ? 1.2 : row.severityBand === "medium" ? 1 : 0.8)),
      })
    )
  );
}

function buildTrendSignal(signalKind: VisualQaTrendSignalKind, bandScore: number): VisualQaTrendSignal {
  const normalized = clampScore(bandScore);

  return Object.freeze({
    signalId: buildTrendSignalId(signalKind),
    signalKind,
    bandScore: normalized,
    direction: resolveTrendDirection(normalized),
  });
}

function buildTrendSignals(reportExport: BenchmarkReportExport): VisualQaTrendSignals {
  const summary = reportExport.reportSummary;
  const overallBand = clampScore(
    (summary.identityBand + summary.styleBand + summary.emotionBand + summary.driftSpreadBand) / 4
  );

  return Object.freeze({
    identityTrend: buildTrendSignal("identity", summary.identityBand),
    styleTrend: buildTrendSignal("style", summary.styleBand),
    emotionTrend: buildTrendSignal("emotion", summary.emotionBand),
    driftTrend: buildTrendSignal("drift", summary.driftSpreadBand),
    overallTrend: buildTrendSignal("overall", overallBand),
  });
}

function buildDashboardMetadata(
  dashboardId: string,
  reportExport: BenchmarkReportExport,
  dashboardSequence: number,
  summaryCards: readonly VisualQaSummaryCard[],
  rankingTableRows: readonly VisualQaRankingTableRow[],
  heatmapRows: readonly VisualQaHeatmapRow[]
): VisualQaDashboardMetadata {
  return Object.freeze({
    dashboardId,
    sourceExportId: reportExport.exportId,
    matrixId: reportExport.reportSummary.matrixId,
    benchmarkCount: reportExport.reportSummary.benchmarkCount,
    summaryCardCount: summaryCards.length,
    rankingRowCount: rankingTableRows.length,
    heatmapRowCount: heatmapRows.length,
    dashboardSequence,
  });
}

export function buildVisualQaDashboardData(input: VisualQaDashboardDataInput): VisualQaDashboardData {
  const dashboardSequence = resolveDashboardIndex(input.reportExport, input.dashboardIndex);
  const dashboardId = buildDashboardId(dashboardSequence);
  const summaryCards = buildSummaryCards(input.reportExport);
  const rankingTableRows = buildRankingTableRows(input.reportExport);
  const heatmapRows = buildHeatmapRows(input.reportExport);
  const trendSignals = buildTrendSignals(input.reportExport);
  const dashboardMetadata = buildDashboardMetadata(
    dashboardId,
    input.reportExport,
    dashboardSequence,
    summaryCards,
    rankingTableRows,
    heatmapRows
  );

  return Object.freeze({
    version: VISUAL_QA_DASHBOARD_DATA_VERSION,
    dashboardId,
    summaryCards,
    rankingTableRows,
    heatmapRows,
    trendSignals,
    dashboardMetadata,
  });
}

export function serializeVisualQaDashboardData(dashboardData: VisualQaDashboardData): string {
  return JSON.stringify({
    version: dashboardData.version,
    dashboardId: dashboardData.dashboardId,
    summaryCards: dashboardData.summaryCards,
    rankingTableRows: dashboardData.rankingTableRows,
    heatmapRows: dashboardData.heatmapRows,
    trendSignals: dashboardData.trendSignals,
    dashboardMetadata: dashboardData.dashboardMetadata,
  });
}

export function computeVisualQaDashboardDataFingerprint(dashboardData: VisualQaDashboardData): string {
  return crypto.createHash("sha256").update(serializeVisualQaDashboardData(dashboardData)).digest("hex");
}

export function assertVisualQaDashboardSummaryCardsDeterministic(
  dashboardData: VisualQaDashboardData
): boolean {
  const cardIds = dashboardData.summaryCards.map((card) => card.cardId);
  const sortedCardIds = [...cardIds].sort((left, right) => left.localeCompare(right));
  const kinds = dashboardData.summaryCards.map((card) => card.cardKind);

  return (
    cardIds.join("|") === sortedCardIds.join("|") &&
    kinds.join("|") === VISUAL_QA_SUMMARY_CARD_KINDS.join("|") &&
    dashboardData.summaryCards.every(
      (card, index) => card.cardOrder === index + 1 && card.cardId === buildCardId(index + 1)
    )
  );
}

export function assertVisualQaDashboardRankingRowsDeterministic(
  dashboardData: VisualQaDashboardData
): boolean {
  const rowIds = dashboardData.rankingTableRows.map((row) => row.rowId);
  const sortedRowIds = [...rowIds].sort((left, right) => left.localeCompare(right));
  const cycleIds = dashboardData.rankingTableRows.map((row) => row.cycleReportId);
  const uniqueCycleIds = new Set(cycleIds);

  const scoresDescending = dashboardData.rankingTableRows.every(
    (row, index) =>
      index === 0 || row.stabilityScore <= dashboardData.rankingTableRows[index - 1].stabilityScore
  );

  return (
    rowIds.join("|") === sortedRowIds.join("|") &&
    cycleIds.length === uniqueCycleIds.size &&
    scoresDescending &&
    dashboardData.rankingTableRows.every(
      (row, index) => row.rowOrder === index + 1 && row.rowId === buildDashboardRowId(index + 1)
    )
  );
}

export function assertVisualQaDashboardHeatmapRowsDeterministic(
  dashboardData: VisualQaDashboardData
): boolean {
  const rowIds = dashboardData.heatmapRows.map((row) => row.rowId);
  const sortedRowIds = [...rowIds].sort((left, right) => left.localeCompare(right));

  const ordered = dashboardData.heatmapRows.every((row, index) => {
    if (index === 0) {
      return true;
    }
    const previous = dashboardData.heatmapRows[index - 1];
    const reportDelta = previous.cycleReportId.localeCompare(row.cycleReportId);
    if (reportDelta !== 0) {
      return reportDelta < 0;
    }
    return previous.signalKind.localeCompare(row.signalKind) < 0;
  });

  return (
    rowIds.join("|") === sortedRowIds.join("|") &&
    ordered &&
    dashboardData.heatmapRows.every(
      (row, index) => row.rowOrder === index + 1 && row.rowId === buildHeatmapRowId(index + 1)
    )
  );
}

export function assertVisualQaDashboardTrendSignalsDeterministic(
  dashboardData: VisualQaDashboardData
): boolean {
  const trends = dashboardData.trendSignals;

  return (
    trends.identityTrend.signalId === buildTrendSignalId("identity") &&
    trends.styleTrend.signalId === buildTrendSignalId("style") &&
    trends.emotionTrend.signalId === buildTrendSignalId("emotion") &&
    trends.driftTrend.signalId === buildTrendSignalId("drift") &&
    trends.overallTrend.signalId === buildTrendSignalId("overall") &&
    trends.identityTrend.bandScore >= 0 &&
    trends.identityTrend.bandScore <= 1 &&
    trends.overallTrend.bandScore >= 0 &&
    trends.overallTrend.bandScore <= 1
  );
}

export function assertVisualQaDashboardDuplicateRowRemoval(
  reportExport: BenchmarkReportExport,
  dashboardData: VisualQaDashboardData
): boolean {
  const uniqueRankingCount = new Set(reportExport.rankingTable.map((row) => row.cycleReportId)).size;
  const uniqueHeatmapCount = new Set(
    reportExport.regressionHeatmapSummary.map((row) => `${row.cycleReportId}|${row.signalKind}`)
  ).size;

  return (
    dashboardData.rankingTableRows.length === uniqueRankingCount &&
    new Set(dashboardData.rankingTableRows.map((row) => row.cycleReportId)).size ===
      dashboardData.rankingTableRows.length &&
    dashboardData.heatmapRows.length === uniqueHeatmapCount &&
    new Set(dashboardData.heatmapRows.map((row) => `${row.cycleReportId}|${row.signalKind}`)).size ===
      dashboardData.heatmapRows.length
  );
}

export function assertVisualQaDashboardDataDeterministic(dashboardData: VisualQaDashboardData): boolean {
  return (
    assertVisualQaDashboardSummaryCardsDeterministic(dashboardData) &&
    assertVisualQaDashboardRankingRowsDeterministic(dashboardData) &&
    assertVisualQaDashboardHeatmapRowsDeterministic(dashboardData) &&
    assertVisualQaDashboardTrendSignalsDeterministic(dashboardData) &&
    dashboardData.dashboardMetadata.dashboardId === dashboardData.dashboardId &&
    dashboardData.dashboardMetadata.summaryCardCount === dashboardData.summaryCards.length &&
    dashboardData.dashboardMetadata.rankingRowCount === dashboardData.rankingTableRows.length &&
    dashboardData.dashboardMetadata.heatmapRowCount === dashboardData.heatmapRows.length
  );
}
