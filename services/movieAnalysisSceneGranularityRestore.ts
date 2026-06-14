import fs from 'node:fs';
import path from 'node:path';
import {
  DATASET_NORMALIZATION_STRUCTURES_PATH,
  type NormalizedSceneStructure,
} from './movieAnalysisDatasetNormalization.js';
import { EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  NORMALIZATION_QUALITY_GATE_PASS_VERDICT,
  NORMALIZATION_QUALITY_GATE_REPORT_PATH,
  type MovieAnalysisNormalizationQualityGateReport,
  type QualityRiskDetection,
} from './movieAnalysisNormalizationQualityGate.js';
import {
  loadMovieAnalysisSceneDetectionPlan,
  TARGET_SCENE_CANDIDATE_COUNTS,
  type MovieAnalysisSceneDetectionPlan,
  type SceneCandidate,
} from './movieAnalysisSceneDetectionDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SCENE_GRANULARITY_RESTORE_PHASE =
  'PHASE-L1B-005-MOVIE_ANALYSIS_SCENE_GRANULARITY_RESTORE_V1' as const;
export const SCENE_GRANULARITY_RESTORE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_SCENE_GRANULARITY_RESTORE_V1' as const;
export const SCENE_GRANULARITY_RESTORE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_SCENE_GRANULARITY_RESTORE_V1' as const;
export const SCENE_GRANULARITY_RESTORE_DIR =
  'reports/movie_analysis_scene_granularity_restore' as const;
export const SCENE_GRANULARITY_RESTORE_REPORT_PATH =
  'reports/movie_analysis_scene_granularity_restore/movie-analysis-scene-granularity-restore-report.json' as const;
export const SCENE_GRANULARITY_RESTORE_MD_PATH =
  'reports/movie_analysis_scene_granularity_restore/MOVIE_ANALYSIS_SCENE_GRANULARITY_RESTORE.md' as const;

export const EXPECTED_SOURCE_VIDEO_IDS = [
  'GHIBLI_01',
  'LITTLE_WOMEN_01',
  'MORI_01',
  'SHINKAI_01',
] as const;

export { EXPECTED_SOURCE_COUNT };

export type RestoreStatus = 'PASS' | 'FAIL';

export type SceneGranularityRestoreIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SceneCollapseSafetyDetail = {
  source_video_id: string;
  scene_detection_id: string;
  scene_candidates_before: number;
  scene_candidates_after_collapse: number;
  merged_from_preserved: boolean;
  collapse_ratio: number;
  merged_window_span_seconds: number;
  safety_verdict: RestoreStatus;
};

export type RecommendedSceneSplitPoint = {
  source_video_id: string;
  scene_detection_id: string;
  split_point_id: string;
  split_at_seconds: number;
  derived_from_candidate_id: string;
  split_order: number;
};

export type SceneBoundaryRestoreCandidate = {
  candidate_id: string;
  source_video_id: string;
  scene_detection_id: string;
  estimated_start_seconds: number;
  estimated_end_seconds: number;
  candidate_role: SceneCandidate['candidate_role'];
  split_point_seconds: number;
  restored_from_merged: true;
  non_overlapping: true;
  estimated_only: true;
  planning_only: true;
};

export type GranularityRecoveryRule = {
  rule_id: string;
  priority: 'high' | 'medium';
  description: string;
  planning_only: true;
  prevents_redundancy: true;
};

export type OptimalSceneCountEstimate = {
  source_video_id: string;
  current_scene_count: number;
  optimal_scene_count: number;
  granularity_recovery_target: number;
  recovery_ratio: number;
};

export type SourceSceneGranularityRestoreAudit = {
  source_video_id: string;
  over_merge_risk_detected: boolean;
  lost_scene_granularity_detected: boolean;
  recommended_split_points: number;
  restore_candidates: number;
  overlap_count_after_restore: number;
  optimal_scene_count: number;
  granularity_restored: RestoreStatus;
};

export type MovieAnalysisSceneGranularityRestoreReport = {
  report_id: string;
  phase: typeof SCENE_GRANULARITY_RESTORE_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  quality_gate_report_path: typeof NORMALIZATION_QUALITY_GATE_REPORT_PATH;
  over_merge_risk: QualityRiskDetection[];
  lost_scene_granularity: QualityRiskDetection[];
  scene_collapse_safety_details: SceneCollapseSafetyDetail[];
  recommended_scene_split_points: RecommendedSceneSplitPoint[];
  scene_boundary_restore_candidates: SceneBoundaryRestoreCandidate[];
  granularity_recovery_rules: GranularityRecoveryRule[];
  optimal_scene_count_per_source: OptimalSceneCountEstimate[];
  redundancy_reintroduced: number;
  scene_granularity_restore_ready: RestoreStatus;
  planning_only_status: RestoreStatus;
  source_audits: SourceSceneGranularityRestoreAudit[];
  final_verdict:
    | typeof SCENE_GRANULARITY_RESTORE_PASS_VERDICT
    | typeof SCENE_GRANULARITY_RESTORE_FAIL_VERDICT;
  issues: SceneGranularityRestoreIssue[];
};

const SOURCE_SCENE_DETECTION_IDS: Record<(typeof EXPECTED_SOURCE_VIDEO_IDS)[number], string> = {
  GHIBLI_01: 'scene_detection_ghibli_01_v1',
  LITTLE_WOMEN_01: 'scene_detection_little_women_01_v1',
  MORI_01: 'scene_detection_mori_01_v1',
  SHINKAI_01: 'scene_detection_shinkai_01_v1',
};

const GRANULARITY_RECOVERY_RULES: GranularityRecoveryRule[] = [
  {
    rule_id: 'recover-partition-at-original-starts',
    priority: 'high',
    description:
      'Partition collapsed merged windows at original scene candidate start boundaries to restore granularity.',
    planning_only: true,
    prevents_redundancy: true,
  },
  {
    rule_id: 'recover-non-overlapping-end-boundaries',
    priority: 'high',
    description:
      'Set each restored segment end to the next segment start (or merged window end) to prevent overlap reintroduction.',
    planning_only: true,
    prevents_redundancy: true,
  },
  {
    rule_id: 'recover-preserve-merged-from-trace',
    priority: 'medium',
    description:
      'Retain merged_from candidate IDs in collapse safety details for traceability during granularity recovery.',
    planning_only: true,
    prevents_redundancy: true,
  },
  {
    rule_id: 'recover-target-original-scene-count',
    priority: 'high',
    description:
      'Restore scene count to pre-normalization target per source without exceeding TARGET_SCENE_CANDIDATE_COUNTS.',
    planning_only: true,
    prevents_redundancy: true,
  },
];

function loadQualityGateReport(
  projectRoot: string
): MovieAnalysisNormalizationQualityGateReport | null {
  const abs = path.join(projectRoot, NORMALIZATION_QUALITY_GATE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisNormalizationQualityGateReport;
}

function loadNormalizedScenes(projectRoot: string): NormalizedSceneStructure[] {
  const abs = path.join(projectRoot, DATASET_NORMALIZATION_STRUCTURES_PATH);
  if (!fs.existsSync(abs)) return [];
  const bundle = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    normalized_scene_structure?: NormalizedSceneStructure[];
  };
  return bundle.normalized_scene_structure ?? [];
}

function countOverlapsForSource(
  candidates: SceneBoundaryRestoreCandidate[],
  sourceVideoId: string
): number {
  const sourceCandidates = candidates.filter(
    (candidate) => candidate.source_video_id === sourceVideoId
  );
  let count = 0;
  for (let i = 0; i < sourceCandidates.length; i++) {
    for (let j = i + 1; j < sourceCandidates.length; j++) {
      const a = sourceCandidates[i];
      const b = sourceCandidates[j];
      if (
        a.estimated_start_seconds < b.estimated_end_seconds &&
        b.estimated_start_seconds < a.estimated_end_seconds
      ) {
        count += 1;
      }
    }
  }
  return count;
}

function countTotalOverlaps(candidates: SceneBoundaryRestoreCandidate[]): number {
  return EXPECTED_SOURCE_VIDEO_IDS.reduce(
    (sum, sourceVideoId) => sum + countOverlapsForSource(candidates, sourceVideoId),
    0
  );
}

function buildSceneCollapseSafetyDetail(
  normalizedScene: NormalizedSceneStructure | undefined,
  originalPlan: MovieAnalysisSceneDetectionPlan
): SceneCollapseSafetyDetail {
  const collapsed = normalizedScene?.scene_candidates_after ?? 0;
  const mergedCandidate = normalizedScene?.candidates[0];
  const mergedFromPreserved =
    mergedCandidate !== undefined &&
    mergedCandidate.merged_from.length === originalPlan.scene_candidates.length;

  const spanSeconds = mergedCandidate
    ? mergedCandidate.estimated_end_seconds - mergedCandidate.estimated_start_seconds
    : 0;

  const collapseRatio =
    originalPlan.scene_candidate_count > 0
      ? collapsed / originalPlan.scene_candidate_count
      : 0;

  return {
    source_video_id: originalPlan.source_video_id,
    scene_detection_id: originalPlan.scene_detection_id,
    scene_candidates_before: originalPlan.scene_candidate_count,
    scene_candidates_after_collapse: collapsed,
    merged_from_preserved: mergedFromPreserved,
    collapse_ratio: collapseRatio,
    merged_window_span_seconds: spanSeconds,
    safety_verdict: mergedFromPreserved && collapsed < originalPlan.scene_candidate_count
      ? 'PASS'
      : 'FAIL',
  };
}

function buildRestoreArtifacts(
  originalPlan: MovieAnalysisSceneDetectionPlan,
  normalizedScene: NormalizedSceneStructure | undefined
): {
  splitPoints: RecommendedSceneSplitPoint[];
  restoreCandidates: SceneBoundaryRestoreCandidate[];
} {
  const sorted = [...originalPlan.scene_candidates].sort(
    (a, b) => a.estimated_start_seconds - b.estimated_start_seconds
  );

  const mergedEnd =
    normalizedScene?.candidates[0]?.estimated_end_seconds ??
    sorted[sorted.length - 1]?.estimated_end_seconds ??
    0;

  const splitPoints: RecommendedSceneSplitPoint[] = [];
  const restoreCandidates: SceneBoundaryRestoreCandidate[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const start = current.estimated_start_seconds;
    const end = next ? next.estimated_start_seconds : mergedEnd;

    splitPoints.push({
      source_video_id: originalPlan.source_video_id,
      scene_detection_id: originalPlan.scene_detection_id,
      split_point_id: `split_${originalPlan.source_video_id.toLowerCase()}_${String(i + 1).padStart(3, '0')}`,
      split_at_seconds: start,
      derived_from_candidate_id: current.candidate_id,
      split_order: i + 1,
    });

    restoreCandidates.push({
      candidate_id: current.candidate_id,
      source_video_id: originalPlan.source_video_id,
      scene_detection_id: originalPlan.scene_detection_id,
      estimated_start_seconds: start,
      estimated_end_seconds: end,
      candidate_role: current.candidate_role,
      split_point_seconds: start,
      restored_from_merged: true,
      non_overlapping: true,
      estimated_only: true,
      planning_only: true,
    });
  }

  return { splitPoints, restoreCandidates };
}

function buildMarkdown(report: MovieAnalysisSceneGranularityRestoreReport): string {
  const lines = [
    '# Movie Analysis Scene Granularity Restore',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Restore Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| over_merge_risk_entries | ${report.over_merge_risk.length} |`,
    `| lost_scene_granularity_entries | ${report.lost_scene_granularity.length} |`,
    `| recommended_scene_split_points | ${report.recommended_scene_split_points.length} |`,
    `| scene_boundary_restore_candidates | ${report.scene_boundary_restore_candidates.length} |`,
    `| granularity_recovery_rules | ${report.granularity_recovery_rules.length} |`,
    `| redundancy_reintroduced | ${report.redundancy_reintroduced} |`,
    `| scene_granularity_restore_ready | ${report.scene_granularity_restore_ready} |`,
    '',
    '## Granularity Recovery Rules',
    '',
  ];

  for (const rule of report.granularity_recovery_rules) {
    lines.push(`- **${rule.rule_id}** [${rule.priority}] ${rule.description}`);
  }

  lines.push('', '## Optimal Scene Count Per Source', '');
  for (const estimate of report.optimal_scene_count_per_source) {
    lines.push(
      `- ${estimate.source_video_id}: current=${estimate.current_scene_count} optimal=${estimate.optimal_scene_count} recovery_target=${estimate.granularity_recovery_target}`
    );
  }

  lines.push('', '## Source Audits', '');
  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- over_merge_risk_detected: ${audit.over_merge_risk_detected}`,
      `- lost_scene_granularity_detected: ${audit.lost_scene_granularity_detected}`,
      `- recommended_split_points: ${audit.recommended_split_points}`,
      `- restore_candidates: ${audit.restore_candidates}`,
      `- overlap_count_after_restore: ${audit.overlap_count_after_restore}`,
      `- optimal_scene_count: ${audit.optimal_scene_count}`,
      `- granularity_restored: ${audit.granularity_restored}`,
      ''
    );
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function writeMovieAnalysisSceneGranularityRestoreReport(
  projectRoot?: string
): MovieAnalysisSceneGranularityRestoreReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SceneGranularityRestoreIssue[] = [];
  const timestamp = new Date().toISOString();

  const qualityGateReport = loadQualityGateReport(root);
  if (!qualityGateReport) {
    issues.push({
      code: 'QUALITY_GATE_REPORT_MISSING',
      message: `Missing ${NORMALIZATION_QUALITY_GATE_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const normalizedScenes = loadNormalizedScenes(root);

  if (!qualityGateReport) {
    const report: MovieAnalysisSceneGranularityRestoreReport = {
      report_id: 'movie-analysis-scene-granularity-restore-report-v1',
      phase: SCENE_GRANULARITY_RESTORE_PHASE,
      timestamp,
      planning_only: true,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      quality_gate_report_path: NORMALIZATION_QUALITY_GATE_REPORT_PATH,
      over_merge_risk: [],
      lost_scene_granularity: [],
      scene_collapse_safety_details: [],
      recommended_scene_split_points: [],
      scene_boundary_restore_candidates: [],
      granularity_recovery_rules: [],
      optimal_scene_count_per_source: [],
      redundancy_reintroduced: -1,
      scene_granularity_restore_ready: 'FAIL',
      planning_only_status: 'FAIL',
      source_audits: [],
      final_verdict: SCENE_GRANULARITY_RESTORE_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, SCENE_GRANULARITY_RESTORE_DIR), { recursive: true });
    fs.writeFileSync(
      path.join(root, SCENE_GRANULARITY_RESTORE_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, SCENE_GRANULARITY_RESTORE_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  if (qualityGateReport.final_verdict !== NORMALIZATION_QUALITY_GATE_PASS_VERDICT) {
    issues.push({
      code: 'QUALITY_GATE_NOT_PASS',
      message: `Quality gate must have ${NORMALIZATION_QUALITY_GATE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const sceneCollapseSafetyDetails: SceneCollapseSafetyDetail[] = [];
  const recommendedSceneSplitPoints: RecommendedSceneSplitPoint[] = [];
  const sceneBoundaryRestoreCandidates: SceneBoundaryRestoreCandidate[] = [];
  const optimalSceneCountPerSource: OptimalSceneCountEstimate[] = [];
  const sourceAudits: SourceSceneGranularityRestoreAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const originalPlan = loadMovieAnalysisSceneDetectionPlan(
      root,
      SOURCE_SCENE_DETECTION_IDS[sourceVideoId]
    );
    const normalizedScene = normalizedScenes.find(
      (scene) => scene.source_video_id === sourceVideoId
    );

    if (!originalPlan) {
      issues.push({
        code: 'SCENE_PLAN_MISSING',
        message: `Missing scene detection plan for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    const collapseDetail = buildSceneCollapseSafetyDetail(normalizedScene, originalPlan);
    sceneCollapseSafetyDetails.push(collapseDetail);

    const { splitPoints, restoreCandidates } = buildRestoreArtifacts(
      originalPlan,
      normalizedScene
    );
    recommendedSceneSplitPoints.push(...splitPoints);
    sceneBoundaryRestoreCandidates.push(...restoreCandidates);

    const sourceOverlaps = countOverlapsForSource(restoreCandidates, sourceVideoId);
    const optimalCount = TARGET_SCENE_CANDIDATE_COUNTS[sourceVideoId];
    const overMergeDetected = qualityGateReport.over_merge_risk.some(
      (risk) => risk.source_video_id === sourceVideoId
    );
    const lostGranularityDetected = qualityGateReport.lost_scene_granularity.some(
      (risk) => risk.source_video_id === sourceVideoId
    );

    const granularityRestored =
      restoreCandidates.length === optimalCount &&
      sourceOverlaps === 0 &&
      collapseDetail.safety_verdict === 'PASS' &&
      overMergeDetected &&
      lostGranularityDetected
        ? 'PASS'
        : 'FAIL';

    if (granularityRestored === 'FAIL') {
      issues.push({
        code: 'GRANULARITY_NOT_RESTORED',
        message: `Scene granularity restore failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    optimalSceneCountPerSource.push({
      source_video_id: sourceVideoId,
      current_scene_count: normalizedScene?.scene_candidates_after ?? 0,
      optimal_scene_count: optimalCount,
      granularity_recovery_target: optimalCount,
      recovery_ratio: optimalCount > 0 ? restoreCandidates.length / optimalCount : 0,
    });

    sourceAudits.push({
      source_video_id: sourceVideoId,
      over_merge_risk_detected: overMergeDetected,
      lost_scene_granularity_detected: lostGranularityDetected,
      recommended_split_points: splitPoints.length,
      restore_candidates: restoreCandidates.length,
      overlap_count_after_restore: sourceOverlaps,
      optimal_scene_count: optimalCount,
      granularity_restored: granularityRestored,
    });
  }

  const redundancyReintroduced = countTotalOverlaps(sceneBoundaryRestoreCandidates);

  if (redundancyReintroduced > 0) {
    issues.push({
      code: 'REDUNDANCY_REINTRODUCED',
      message: `Restore introduced ${redundancyReintroduced} overlapping windows`,
      severity: 'error',
    });
  }

  const safetyValid =
    qualityGateReport.planning_only === true &&
    qualityGateReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: RestoreStatus = safetyValid ? 'PASS' : 'FAIL';

  const sceneGranularityRestoreReady =
    qualityGateReport.over_merge_risk.length === EXPECTED_SOURCE_COUNT &&
    qualityGateReport.lost_scene_granularity.length === EXPECTED_SOURCE_COUNT &&
    sceneCollapseSafetyDetails.every((detail) => detail.safety_verdict === 'PASS') &&
    recommendedSceneSplitPoints.length > 0 &&
    sceneBoundaryRestoreCandidates.length > 0 &&
    optimalSceneCountPerSource.every((estimate) => estimate.recovery_ratio === 1) &&
    redundancyReintroduced === 0 &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.granularity_restored === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = sceneGranularityRestoreReady === 'PASS';

  const report: MovieAnalysisSceneGranularityRestoreReport = {
    report_id: 'movie-analysis-scene-granularity-restore-report-v1',
    phase: SCENE_GRANULARITY_RESTORE_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    quality_gate_report_path: NORMALIZATION_QUALITY_GATE_REPORT_PATH,
    over_merge_risk: qualityGateReport.over_merge_risk,
    lost_scene_granularity: qualityGateReport.lost_scene_granularity,
    scene_collapse_safety_details: sceneCollapseSafetyDetails,
    recommended_scene_split_points: recommendedSceneSplitPoints,
    scene_boundary_restore_candidates: sceneBoundaryRestoreCandidates,
    granularity_recovery_rules: GRANULARITY_RECOVERY_RULES,
    optimal_scene_count_per_source: optimalSceneCountPerSource,
    redundancy_reintroduced: redundancyReintroduced,
    scene_granularity_restore_ready: sceneGranularityRestoreReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? SCENE_GRANULARITY_RESTORE_PASS_VERDICT
      : SCENE_GRANULARITY_RESTORE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, SCENE_GRANULARITY_RESTORE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, SCENE_GRANULARITY_RESTORE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SCENE_GRANULARITY_RESTORE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
