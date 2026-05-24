/** Phase-25A: benchmark session matrix — multi-cycle style stability benchmark (pure, deterministic) */

import crypto from "crypto";
import type { RealTestCycleReport } from "./real-test-cycle-report.ts";

export type BenchmarkSessionMatrixVersion = "v1";

export type RegressionHeatmapSignalKind = "identity" | "style" | "emotion" | "drift";

export type BenchmarkMatrixEntry = {
  readonly entryOrder: number;
  readonly entryId: string;
  readonly cycleReportId: string;
  readonly sourceRequestId: string;
  readonly styleStabilityScore: number;
  readonly readinessScore: number;
  readonly breakCount: number;
  readonly alertCount: number;
};

export type StyleStabilityRankingEntry = {
  readonly rankOrder: number;
  readonly rankingId: string;
  readonly cycleReportId: string;
  readonly styleStabilityScore: number;
  readonly styleConsistencyScore: number;
  readonly regressionRiskScore: number;
};

export type RegressionHeatmapCell = {
  readonly cellId: string;
  readonly cycleReportId: string;
  readonly signalKind: RegressionHeatmapSignalKind;
  readonly intensityScore: number;
};

export type RegressionHeatmap = {
  readonly identityBand: number;
  readonly styleBand: number;
  readonly emotionBand: number;
  readonly driftSpreadBand: number;
  readonly highRegressionCellCount: number;
  readonly heatmapCells: readonly RegressionHeatmapCell[];
};

export type BenchmarkMatrixSummary = {
  readonly matrixId: string;
  readonly benchmarkCount: number;
  readonly averageStyleStabilityScore: number;
  readonly averageReadinessScore: number;
  readonly topCycleReportId: string;
  readonly totalBreakCount: number;
  readonly replayReadyCount: number;
};

export type BenchmarkSessionMatrixInput = {
  readonly cycleReports: readonly RealTestCycleReport[];
  readonly matrixIndex?: number;
};

export type BenchmarkSessionMatrix = {
  readonly version: BenchmarkSessionMatrixVersion;
  readonly matrixId: string;
  readonly benchmarkEntries: readonly BenchmarkMatrixEntry[];
  readonly styleStabilityRanking: readonly StyleStabilityRankingEntry[];
  readonly regressionHeatmap: RegressionHeatmap;
  readonly benchmarkSummary: BenchmarkMatrixSummary;
};

export const BENCHMARK_SESSION_MATRIX_VERSION: BenchmarkSessionMatrixVersion = "v1";

export const BENCHMARK_STYLE_SCORE_WEIGHTS = Object.freeze({
  styleConsistency: 0.45,
  sessionStability: 0.3,
  readiness: 0.25,
});

export const BENCHMARK_REGRESSION_RISK_WEIGHTS = Object.freeze({
  breakCount: 0.35,
  driftSpread: 0.35,
  alertCount: 0.3,
});

export const BENCHMARK_HEATMAP_HIGH_INTENSITY_THRESHOLD = 0.5;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function averageScores(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildMatrixId(matrixIndex: number): string {
  return `benchmark-matrix-${String(matrixIndex + 1).padStart(3, "0")}`;
}

function buildEntryId(entryOrder: number): string {
  return `benchmark-entry-${String(entryOrder).padStart(3, "0")}`;
}

function buildRankingId(rankOrder: number): string {
  return `style-ranking-${String(rankOrder).padStart(3, "0")}`;
}

function buildHeatmapCellId(index: number): string {
  return `heatmap-cell-${String(index + 1).padStart(3, "0")}`;
}

function sortCycleReports(reports: readonly RealTestCycleReport[]): readonly RealTestCycleReport[] {
  const uniqueById = new Map<string, RealTestCycleReport>();
  for (const report of reports) {
    if (!uniqueById.has(report.cycleReportId)) {
      uniqueById.set(report.cycleReportId, report);
    }
  }

  return Object.freeze(
    [...uniqueById.values()].sort((left, right) => left.cycleReportId.localeCompare(right.cycleReportId))
  );
}

function resolveStyleStabilityScore(report: RealTestCycleReport): number {
  const visual = report.visualQaSummary;
  const next = report.nextRequestSummary;
  const readiness = report.replayReadiness.readinessScore;
  const breakPenalty = clampScore(visual.breakCount * 0.05);
  const driftPenalty = clampScore(visual.maxIntakeDriftSpread * 0.5);

  return clampScore(
    BENCHMARK_STYLE_SCORE_WEIGHTS.styleConsistency * next.styleConsistencyScore +
      BENCHMARK_STYLE_SCORE_WEIGHTS.sessionStability * visual.sessionStabilityScore +
      BENCHMARK_STYLE_SCORE_WEIGHTS.readiness * readiness -
      breakPenalty -
      driftPenalty
  );
}

function resolveRegressionRiskScore(report: RealTestCycleReport): number {
  const visual = report.visualQaSummary;

  return clampScore(
    BENCHMARK_REGRESSION_RISK_WEIGHTS.breakCount * clampScore(visual.breakCount * 0.1) +
      BENCHMARK_REGRESSION_RISK_WEIGHTS.driftSpread * visual.maxIntakeDriftSpread +
      BENCHMARK_REGRESSION_RISK_WEIGHTS.alertCount * clampScore(visual.alertCount * 0.08)
  );
}

function buildBenchmarkEntries(reports: readonly RealTestCycleReport[]): readonly BenchmarkMatrixEntry[] {
  const sortedReports = sortCycleReports(reports);

  return Object.freeze(
    sortedReports.map((report, index) =>
      Object.freeze({
        entryOrder: index + 1,
        entryId: buildEntryId(index + 1),
        cycleReportId: report.cycleReportId,
        sourceRequestId: report.sourceRequestId,
        styleStabilityScore: resolveStyleStabilityScore(report),
        readinessScore: report.replayReadiness.readinessScore,
        breakCount: report.visualQaSummary.breakCount,
        alertCount: report.visualQaSummary.alertCount,
      })
    )
  );
}

function buildStyleStabilityRanking(
  reports: readonly RealTestCycleReport[]
): readonly StyleStabilityRankingEntry[] {
  const ranked = [...sortCycleReports(reports)].sort((left, right) => {
    const scoreDelta = resolveStyleStabilityScore(right) - resolveStyleStabilityScore(left);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    return left.cycleReportId.localeCompare(right.cycleReportId);
  });

  return Object.freeze(
    ranked.map((report, index) =>
      Object.freeze({
        rankOrder: index + 1,
        rankingId: buildRankingId(index),
        cycleReportId: report.cycleReportId,
        styleStabilityScore: resolveStyleStabilityScore(report),
        styleConsistencyScore: report.nextRequestSummary.styleConsistencyScore,
        regressionRiskScore: resolveRegressionRiskScore(report),
      })
    )
  );
}

function buildRegressionHeatmap(reports: readonly RealTestCycleReport[]): RegressionHeatmap {
  const sortedReports = sortCycleReports(reports);
  const cells: RegressionHeatmapCell[] = [];

  for (const report of sortedReports) {
    const next = report.nextRequestSummary;
    const visual = report.visualQaSummary;

    cells.push(
      Object.freeze({
        cellId: "",
        cycleReportId: report.cycleReportId,
        signalKind: "identity",
        intensityScore: clampScore(1 - next.characterConsistencyScore),
      }),
      Object.freeze({
        cellId: "",
        cycleReportId: report.cycleReportId,
        signalKind: "style",
        intensityScore: clampScore(1 - next.styleConsistencyScore),
      }),
      Object.freeze({
        cellId: "",
        cycleReportId: report.cycleReportId,
        signalKind: "emotion",
        intensityScore: clampScore(1 - next.emotionalContinuityScore),
      }),
      Object.freeze({
        cellId: "",
        cycleReportId: report.cycleReportId,
        signalKind: "drift",
        intensityScore: clampScore(visual.maxIntakeDriftSpread + resolveRegressionRiskScore(report) * 0.5),
      })
    );
  }

  const orderedCells = Object.freeze(
    [...cells]
      .sort((left, right) => {
        const reportDelta = left.cycleReportId.localeCompare(right.cycleReportId);
        if (reportDelta !== 0) {
          return reportDelta;
        }
        return left.signalKind.localeCompare(right.signalKind);
      })
      .map((cell, index) =>
        Object.freeze({
          ...cell,
          cellId: buildHeatmapCellId(index),
        })
      )
  );

  const identityScores = orderedCells.filter((cell) => cell.signalKind === "identity").map((c) => c.intensityScore);
  const styleScores = orderedCells.filter((cell) => cell.signalKind === "style").map((c) => c.intensityScore);
  const emotionScores = orderedCells.filter((cell) => cell.signalKind === "emotion").map((c) => c.intensityScore);
  const driftScores = orderedCells.filter((cell) => cell.signalKind === "drift").map((c) => c.intensityScore);

  return Object.freeze({
    identityBand: averageScores(identityScores),
    styleBand: averageScores(styleScores),
    emotionBand: averageScores(emotionScores),
    driftSpreadBand: averageScores(driftScores),
    highRegressionCellCount: orderedCells.filter(
      (cell) => cell.intensityScore >= BENCHMARK_HEATMAP_HIGH_INTENSITY_THRESHOLD
    ).length,
    heatmapCells: orderedCells,
  });
}

function buildBenchmarkSummary(
  matrixId: string,
  reports: readonly RealTestCycleReport[],
  ranking: readonly StyleStabilityRankingEntry[]
): BenchmarkMatrixSummary {
  const sortedReports = sortCycleReports(reports);
  const styleScores = sortedReports.map(resolveStyleStabilityScore);
  const readinessScores = sortedReports.map((report) => report.replayReadiness.readinessScore);

  return Object.freeze({
    matrixId,
    benchmarkCount: sortedReports.length,
    averageStyleStabilityScore: averageScores(styleScores),
    averageReadinessScore: averageScores(readinessScores),
    topCycleReportId: ranking.length === 0 ? "" : ranking[0].cycleReportId,
    totalBreakCount: sortedReports.reduce((sum, report) => sum + report.visualQaSummary.breakCount, 0),
    replayReadyCount: sortedReports.filter((report) => report.replayReadiness.replayReady).length,
  });
}

export function buildBenchmarkSessionMatrix(
  input: BenchmarkSessionMatrixInput
): BenchmarkSessionMatrix {
  if (input.cycleReports.length === 0) {
    throw new Error("benchmark session matrix requires at least one cycle report");
  }

  const matrixIndex = input.matrixIndex ?? 0;
  const matrixId = buildMatrixId(matrixIndex);
  const benchmarkEntries = buildBenchmarkEntries(input.cycleReports);
  const styleStabilityRanking = buildStyleStabilityRanking(input.cycleReports);
  const regressionHeatmap = buildRegressionHeatmap(input.cycleReports);

  return Object.freeze({
    version: BENCHMARK_SESSION_MATRIX_VERSION,
    matrixId,
    benchmarkEntries,
    styleStabilityRanking,
    regressionHeatmap,
    benchmarkSummary: buildBenchmarkSummary(matrixId, input.cycleReports, styleStabilityRanking),
  });
}

export function serializeBenchmarkSessionMatrix(matrix: BenchmarkSessionMatrix): string {
  return JSON.stringify({
    version: matrix.version,
    matrixId: matrix.matrixId,
    benchmarkEntries: matrix.benchmarkEntries,
    styleStabilityRanking: matrix.styleStabilityRanking,
    regressionHeatmap: matrix.regressionHeatmap,
    benchmarkSummary: matrix.benchmarkSummary,
  });
}

export function computeBenchmarkSessionMatrixFingerprint(matrix: BenchmarkSessionMatrix): string {
  return crypto.createHash("sha256").update(serializeBenchmarkSessionMatrix(matrix)).digest("hex");
}

export function assertBenchmarkSessionMatrixEntriesOrdering(matrix: BenchmarkSessionMatrix): boolean {
  const cycleIds = matrix.benchmarkEntries.map((entry) => entry.cycleReportId);
  const sortedIds = [...cycleIds].sort((left, right) => left.localeCompare(right));

  return (
    matrix.benchmarkEntries.every(
      (entry, index) => entry.entryOrder === index + 1 && entry.entryId === buildEntryId(index + 1)
    ) && cycleIds.join("|") === sortedIds.join("|")
  );
}

export function assertBenchmarkSessionMatrixRankingDeterministic(
  matrix: BenchmarkSessionMatrix
): boolean {
  const rankingIds = matrix.styleStabilityRanking.map((entry) => entry.rankingId);
  const sortedRankingIds = [...rankingIds].sort((left, right) => left.localeCompare(right));

  const scoresDescending = matrix.styleStabilityRanking.every(
    (entry, index) =>
      index === 0 ||
      entry.styleStabilityScore <= matrix.styleStabilityRanking[index - 1].styleStabilityScore
  );

  return (
    rankingIds.join("|") === sortedRankingIds.join("|") &&
    scoresDescending &&
    matrix.styleStabilityRanking.every(
      (entry, index) => entry.rankOrder === index + 1 && entry.rankingId === buildRankingId(index)
    )
  );
}

export function assertBenchmarkSessionMatrixHeatmapDeterministic(
  matrix: BenchmarkSessionMatrix
): boolean {
  const heatmap = matrix.regressionHeatmap;
  const cellIds = heatmap.heatmapCells.map((cell) => cell.cellId);
  const sortedCellIds = [...cellIds].sort((left, right) => left.localeCompare(right));

  return (
    cellIds.join("|") === sortedCellIds.join("|") &&
    heatmap.identityBand >= 0 &&
    heatmap.identityBand <= 1 &&
    heatmap.styleBand >= 0 &&
    heatmap.styleBand <= 1 &&
    heatmap.emotionBand >= 0 &&
    heatmap.emotionBand <= 1 &&
    heatmap.driftSpreadBand >= 0 &&
    heatmap.driftSpreadBand <= 1
  );
}

export function assertBenchmarkSessionMatrixDuplicateRemoval(
  reports: readonly RealTestCycleReport[],
  matrix: BenchmarkSessionMatrix
): boolean {
  const uniqueReportCount = new Set(reports.map((report) => report.cycleReportId)).size;

  return (
    matrix.benchmarkEntries.length === uniqueReportCount &&
    new Set(matrix.benchmarkEntries.map((entry) => entry.cycleReportId)).size ===
      matrix.benchmarkEntries.length
  );
}

export function assertBenchmarkSessionMatrixDeterministic(matrix: BenchmarkSessionMatrix): boolean {
  return (
    assertBenchmarkSessionMatrixEntriesOrdering(matrix) &&
    assertBenchmarkSessionMatrixRankingDeterministic(matrix) &&
    assertBenchmarkSessionMatrixHeatmapDeterministic(matrix) &&
    matrix.benchmarkSummary.matrixId === matrix.matrixId &&
    matrix.benchmarkSummary.benchmarkCount === matrix.benchmarkEntries.length
  );
}
