/** Phase-26A: benchmark report export — shareable cinematic QA benchmark snapshot (pure, deterministic) */

import crypto from "crypto";
import type {
  BenchmarkSessionMatrix,
  RegressionHeatmapSignalKind,
  StyleStabilityRankingEntry,
} from "./benchmark-session-matrix.ts";
import { BENCHMARK_HEATMAP_HIGH_INTENSITY_THRESHOLD } from "./benchmark-session-matrix.ts";

export type BenchmarkReportExportVersion = "v1";

export type BenchmarkRegressionSeverityBand = "low" | "medium" | "high";

export type BenchmarkReportSummary = {
  readonly matrixId: string;
  readonly benchmarkCount: number;
  readonly topCycleReportId: string;
  readonly averageStyleStabilityScore: number;
  readonly averageReadinessScore: number;
  readonly totalBreakCount: number;
  readonly replayReadyCount: number;
  readonly highRegressionCellCount: number;
  readonly identityBand: number;
  readonly styleBand: number;
  readonly emotionBand: number;
  readonly driftSpreadBand: number;
};

export type BenchmarkRankingTableRow = {
  readonly rowOrder: number;
  readonly rowId: string;
  readonly cycleReportId: string;
  readonly rankOrder: number;
  readonly styleStabilityScore: number;
  readonly styleConsistencyScore: number;
  readonly regressionRiskScore: number;
};

export type BenchmarkRegressionHeatmapSummaryRow = {
  readonly summaryOrder: number;
  readonly summaryId: string;
  readonly cycleReportId: string;
  readonly signalKind: RegressionHeatmapSignalKind;
  readonly intensityScore: number;
  readonly severityBand: BenchmarkRegressionSeverityBand;
};

export type BenchmarkArchiveMetadata = {
  readonly exportId: string;
  readonly matrixId: string;
  readonly benchmarkCount: number;
  readonly archiveVersion: BenchmarkReportExportVersion;
  readonly exportSequence: number;
  readonly rankingRowCount: number;
  readonly heatmapSummaryRowCount: number;
};

export type BenchmarkReportExportInput = {
  readonly matrix: BenchmarkSessionMatrix;
  readonly exportIndex?: number;
};

export type BenchmarkReportExport = {
  readonly version: BenchmarkReportExportVersion;
  readonly exportId: string;
  readonly reportSummary: BenchmarkReportSummary;
  readonly rankingTable: readonly BenchmarkRankingTableRow[];
  readonly regressionHeatmapSummary: readonly BenchmarkRegressionHeatmapSummaryRow[];
  readonly archiveMetadata: BenchmarkArchiveMetadata;
  readonly copyBlock: string;
};

export const BENCHMARK_REPORT_EXPORT_VERSION: BenchmarkReportExportVersion = "v1";

export const BENCHMARK_REGRESSION_SEVERITY_MEDIUM_THRESHOLD = 0.33;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function buildExportId(exportIndex: number): string {
  return `benchmark-export-${String(exportIndex + 1).padStart(3, "0")}`;
}

function buildRowId(rowOrder: number): string {
  return `ranking-row-${String(rowOrder).padStart(3, "0")}`;
}

function buildSummaryId(summaryOrder: number): string {
  return `heatmap-summary-${String(summaryOrder).padStart(3, "0")}`;
}

function resolveExportIndex(matrix: BenchmarkSessionMatrix, exportIndex: number | undefined): number {
  if (exportIndex !== undefined) {
    return exportIndex;
  }

  const match = matrix.matrixId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function resolveSeverityBand(intensityScore: number): BenchmarkRegressionSeverityBand {
  if (intensityScore >= BENCHMARK_HEATMAP_HIGH_INTENSITY_THRESHOLD) {
    return "high";
  }
  if (intensityScore >= BENCHMARK_REGRESSION_SEVERITY_MEDIUM_THRESHOLD) {
    return "medium";
  }
  return "low";
}

function dedupeRankingEntries(
  ranking: readonly StyleStabilityRankingEntry[]
): readonly StyleStabilityRankingEntry[] {
  const byCycleReportId = new Map<string, StyleStabilityRankingEntry>();

  for (const entry of ranking) {
    const existing = byCycleReportId.get(entry.cycleReportId);
    if (!existing || entry.rankOrder < existing.rankOrder) {
      byCycleReportId.set(entry.cycleReportId, entry);
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

function buildReportSummary(matrix: BenchmarkSessionMatrix): BenchmarkReportSummary {
  const summary = matrix.benchmarkSummary;
  const heatmap = matrix.regressionHeatmap;

  return Object.freeze({
    matrixId: summary.matrixId,
    benchmarkCount: summary.benchmarkCount,
    topCycleReportId: summary.topCycleReportId,
    averageStyleStabilityScore: summary.averageStyleStabilityScore,
    averageReadinessScore: summary.averageReadinessScore,
    totalBreakCount: summary.totalBreakCount,
    replayReadyCount: summary.replayReadyCount,
    highRegressionCellCount: heatmap.highRegressionCellCount,
    identityBand: heatmap.identityBand,
    styleBand: heatmap.styleBand,
    emotionBand: heatmap.emotionBand,
    driftSpreadBand: heatmap.driftSpreadBand,
  });
}

function buildRankingTable(
  ranking: readonly StyleStabilityRankingEntry[]
): readonly BenchmarkRankingTableRow[] {
  const deduped = dedupeRankingEntries(ranking);

  return Object.freeze(
    deduped.map((entry, index) =>
      Object.freeze({
        rowOrder: index + 1,
        rowId: buildRowId(index + 1),
        cycleReportId: entry.cycleReportId,
        rankOrder: entry.rankOrder,
        styleStabilityScore: entry.styleStabilityScore,
        styleConsistencyScore: entry.styleConsistencyScore,
        regressionRiskScore: entry.regressionRiskScore,
      })
    )
  );
}

function buildRegressionHeatmapSummary(
  matrix: BenchmarkSessionMatrix
): readonly BenchmarkRegressionHeatmapSummaryRow[] {
  const orderedCells = Object.freeze(
    [...matrix.regressionHeatmap.heatmapCells].sort((left, right) => {
      const reportDelta = left.cycleReportId.localeCompare(right.cycleReportId);
      if (reportDelta !== 0) {
        return reportDelta;
      }
      return left.signalKind.localeCompare(right.signalKind);
    })
  );

  return Object.freeze(
    orderedCells.map((cell, index) =>
      Object.freeze({
        summaryOrder: index + 1,
        summaryId: buildSummaryId(index + 1),
        cycleReportId: cell.cycleReportId,
        signalKind: cell.signalKind,
        intensityScore: clampScore(cell.intensityScore),
        severityBand: resolveSeverityBand(cell.intensityScore),
      })
    )
  );
}

function buildArchiveMetadata(
  exportId: string,
  matrix: BenchmarkSessionMatrix,
  exportSequence: number,
  rankingTable: readonly BenchmarkRankingTableRow[],
  heatmapSummary: readonly BenchmarkRegressionHeatmapSummaryRow[]
): BenchmarkArchiveMetadata {
  return Object.freeze({
    exportId,
    matrixId: matrix.matrixId,
    benchmarkCount: matrix.benchmarkSummary.benchmarkCount,
    archiveVersion: BENCHMARK_REPORT_EXPORT_VERSION,
    exportSequence,
    rankingRowCount: rankingTable.length,
    heatmapSummaryRowCount: heatmapSummary.length,
  });
}

function formatScore(value: number): string {
  return clampScore(value).toFixed(6);
}

function buildCopyBlock(
  exportId: string,
  reportSummary: BenchmarkReportSummary,
  rankingTable: readonly BenchmarkRankingTableRow[],
  heatmapSummary: readonly BenchmarkRegressionHeatmapSummaryRow[],
  archiveMetadata: BenchmarkArchiveMetadata
): string {
  const summaryLines = [
    `matrixId: ${reportSummary.matrixId}`,
    `benchmarkCount: ${reportSummary.benchmarkCount}`,
    `topCycleReportId: ${reportSummary.topCycleReportId}`,
    `averageStyleStabilityScore: ${formatScore(reportSummary.averageStyleStabilityScore)}`,
    `averageReadinessScore: ${formatScore(reportSummary.averageReadinessScore)}`,
    `totalBreakCount: ${reportSummary.totalBreakCount}`,
    `replayReadyCount: ${reportSummary.replayReadyCount}`,
    `highRegressionCellCount: ${reportSummary.highRegressionCellCount}`,
    `identityBand: ${formatScore(reportSummary.identityBand)}`,
    `styleBand: ${formatScore(reportSummary.styleBand)}`,
    `emotionBand: ${formatScore(reportSummary.emotionBand)}`,
    `driftSpreadBand: ${formatScore(reportSummary.driftSpreadBand)}`,
  ];

  const rankingLines = rankingTable.map(
    (row) =>
      `${row.rowId} rank:${row.rankOrder} cycle:${row.cycleReportId} stability:${formatScore(row.styleStabilityScore)} style:${formatScore(row.styleConsistencyScore)} risk:${formatScore(row.regressionRiskScore)}`
  );

  const heatmapLines = heatmapSummary.map(
    (row) =>
      `${row.summaryId} cycle:${row.cycleReportId} signal:${row.signalKind} intensity:${formatScore(row.intensityScore)} severity:${row.severityBand}`
  );

  const archiveLines = [
    `exportId: ${archiveMetadata.exportId}`,
    `matrixId: ${archiveMetadata.matrixId}`,
    `benchmarkCount: ${archiveMetadata.benchmarkCount}`,
    `archiveVersion: ${archiveMetadata.archiveVersion}`,
    `exportSequence: ${archiveMetadata.exportSequence}`,
    `rankingRowCount: ${archiveMetadata.rankingRowCount}`,
    `heatmapSummaryRowCount: ${archiveMetadata.heatmapSummaryRowCount}`,
  ];

  return [
    "=== BENCHMARK REPORT EXPORT ===",
    `exportId: ${exportId}`,
    "",
    "[SUMMARY]",
    ...summaryLines,
    "",
    "[RANKING]",
    ...rankingLines,
    "",
    "[REGRESSION HEATMAP]",
    ...heatmapLines,
    "",
    "[ARCHIVE]",
    ...archiveLines,
  ].join("\n");
}

export function buildBenchmarkReportExport(input: BenchmarkReportExportInput): BenchmarkReportExport {
  const exportSequence = resolveExportIndex(input.matrix, input.exportIndex);
  const exportId = buildExportId(exportSequence);
  const reportSummary = buildReportSummary(input.matrix);
  const rankingTable = buildRankingTable(input.matrix.styleStabilityRanking);
  const regressionHeatmapSummary = buildRegressionHeatmapSummary(input.matrix);
  const archiveMetadata = buildArchiveMetadata(
    exportId,
    input.matrix,
    exportSequence,
    rankingTable,
    regressionHeatmapSummary
  );
  const copyBlock = buildCopyBlock(
    exportId,
    reportSummary,
    rankingTable,
    regressionHeatmapSummary,
    archiveMetadata
  );

  return Object.freeze({
    version: BENCHMARK_REPORT_EXPORT_VERSION,
    exportId,
    reportSummary,
    rankingTable,
    regressionHeatmapSummary,
    archiveMetadata,
    copyBlock,
  });
}

export function serializeBenchmarkReportExport(reportExport: BenchmarkReportExport): string {
  return JSON.stringify({
    version: reportExport.version,
    exportId: reportExport.exportId,
    reportSummary: reportExport.reportSummary,
    rankingTable: reportExport.rankingTable,
    regressionHeatmapSummary: reportExport.regressionHeatmapSummary,
    archiveMetadata: reportExport.archiveMetadata,
    copyBlock: reportExport.copyBlock,
  });
}

export function computeBenchmarkReportExportFingerprint(reportExport: BenchmarkReportExport): string {
  return crypto.createHash("sha256").update(serializeBenchmarkReportExport(reportExport)).digest("hex");
}

export function assertBenchmarkReportExportRankingDeterministic(
  reportExport: BenchmarkReportExport
): boolean {
  const rowIds = reportExport.rankingTable.map((row) => row.rowId);
  const sortedRowIds = [...rowIds].sort((left, right) => left.localeCompare(right));
  const cycleIds = reportExport.rankingTable.map((row) => row.cycleReportId);
  const uniqueCycleIds = new Set(cycleIds);

  const scoresDescending = reportExport.rankingTable.every(
    (row, index) =>
      index === 0 || row.styleStabilityScore <= reportExport.rankingTable[index - 1].styleStabilityScore
  );

  return (
    rowIds.join("|") === sortedRowIds.join("|") &&
    cycleIds.length === uniqueCycleIds.size &&
    scoresDescending &&
    reportExport.rankingTable.every(
      (row, index) => row.rowOrder === index + 1 && row.rowId === buildRowId(index + 1)
    )
  );
}

export function assertBenchmarkReportExportHeatmapSummaryDeterministic(
  reportExport: BenchmarkReportExport
): boolean {
  const summaryIds = reportExport.regressionHeatmapSummary.map((row) => row.summaryId);
  const sortedSummaryIds = [...summaryIds].sort((left, right) => left.localeCompare(right));

  const ordered = reportExport.regressionHeatmapSummary.every((row, index) => {
    if (index === 0) {
      return true;
    }
    const previous = reportExport.regressionHeatmapSummary[index - 1];
    const reportDelta = previous.cycleReportId.localeCompare(row.cycleReportId);
    if (reportDelta !== 0) {
      return reportDelta < 0;
    }
    return previous.signalKind.localeCompare(row.signalKind) < 0;
  });

  return (
    summaryIds.join("|") === sortedSummaryIds.join("|") &&
    ordered &&
    reportExport.regressionHeatmapSummary.every(
      (row, index) => row.summaryOrder === index + 1 && row.summaryId === buildSummaryId(index + 1)
    )
  );
}

export function assertBenchmarkReportExportCopyBlockDeterministic(
  reportExport: BenchmarkReportExport
): boolean {
  const copyBlock = reportExport.copyBlock;

  return (
    copyBlock.startsWith("=== BENCHMARK REPORT EXPORT ===") &&
    copyBlock.includes("[SUMMARY]") &&
    copyBlock.includes("[RANKING]") &&
    copyBlock.includes("[REGRESSION HEATMAP]") &&
    copyBlock.includes("[ARCHIVE]") &&
    copyBlock.includes(`exportId: ${reportExport.exportId}`) &&
    copyBlock.includes(`matrixId: ${reportExport.reportSummary.matrixId}`)
  );
}

export function assertBenchmarkReportExportDuplicateRankingRemoval(
  matrix: BenchmarkSessionMatrix,
  reportExport: BenchmarkReportExport
): boolean {
  const uniqueRankingCount = new Set(matrix.styleStabilityRanking.map((entry) => entry.cycleReportId)).size;

  return (
    reportExport.rankingTable.length === uniqueRankingCount &&
    new Set(reportExport.rankingTable.map((row) => row.cycleReportId)).size ===
      reportExport.rankingTable.length
  );
}

export function assertBenchmarkReportExportDeterministic(reportExport: BenchmarkReportExport): boolean {
  return (
    assertBenchmarkReportExportRankingDeterministic(reportExport) &&
    assertBenchmarkReportExportHeatmapSummaryDeterministic(reportExport) &&
    assertBenchmarkReportExportCopyBlockDeterministic(reportExport) &&
    reportExport.archiveMetadata.exportId === reportExport.exportId &&
    reportExport.archiveMetadata.matrixId === reportExport.reportSummary.matrixId &&
    reportExport.archiveMetadata.rankingRowCount === reportExport.rankingTable.length &&
    reportExport.archiveMetadata.heatmapSummaryRowCount === reportExport.regressionHeatmapSummary.length
  );
}
