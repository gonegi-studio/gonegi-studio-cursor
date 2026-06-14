import fs from 'node:fs';
import path from 'node:path';
import { loadMovieAnalysisPlan } from './movieAnalysisPlanBuilder.js';
import {
  DRY_RUN_REGISTRY_PATH,
  loadMovieAnalysisDryRun,
} from './movieAnalysisDryRunPlanner.js';
import {
  FRAME_SAMPLING_PHASE,
  FRAME_SAMPLING_REGISTRY_PATH,
  FRAME_SAMPLING_PLANS_DIR,
  SEED_FRAME_SAMPLING_SPECS,
  TARGET_FRAME_COUNTS,
  type MovieAnalysisFrameSamplingPlan,
  loadMovieAnalysisFrameSamplingPlan,
} from './movieAnalysisFrameSamplingDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FRAME_SAMPLING_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_FRAME_SAMPLING_DESIGN_V1' as const;
export const FRAME_SAMPLING_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_FRAME_SAMPLING_DESIGN_V1' as const;
export const FRAME_SAMPLING_REPORT_PATH =
  'reports/movie-analysis-frame-sampling-report.json' as const;
export const FRAME_SAMPLING_MD_PATH =
  'reports/MOVIE_ANALYSIS_FRAME_SAMPLING_DESIGN.md' as const;

export type FrameSamplingValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  sampling_plan_id?: string;
};

export type FrameSamplingValidationResult = {
  sampling_plan_id: string;
  dry_run_id: string;
  analysis_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: FrameSamplingValidationIssue[];
};

export type MovieAnalysisFrameSamplingReport = {
  report_id: string;
  phase: typeof FRAME_SAMPLING_PHASE;
  timestamp: string;
  sampling_plans: number;
  registry: 'PASS' | 'FAIL';
  dry_run_links: 'PASS' | 'FAIL';
  analysis_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  target_counts: 'PASS' | 'FAIL';
  timestamp_candidates_only: 'PASS' | 'FAIL';
  plan_validations: FrameSamplingValidationResult[];
  frame_extraction: false;
  ocr: false;
  gpu_execution: false;
  external_call_allowed: false;
  planning_only: true;
  final_verdict:
    | typeof FRAME_SAMPLING_PASS_VERDICT
    | typeof FRAME_SAMPLING_FAIL_VERDICT;
  issues: FrameSamplingValidationIssue[];
};

const FORBIDDEN_POINT_KEYS = [
  'image_path',
  'frame_path',
  'frame_file',
  'image_file',
  'output_path',
  'asset_path',
  'base64',
  'pixel_data',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(plan: MovieAnalysisFrameSamplingPlan): FrameSamplingValidationIssue[] {
  const issues: FrameSamplingValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }
  if (flags.frame_extraction !== false) {
    issues.push({
      code: 'FRAME_EXTRACTION_ENABLED',
      message: 'execution_flags.frame_extraction must be false',
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }

  return issues;
}

function validateSamplingPoints(plan: MovieAnalysisFrameSamplingPlan): FrameSamplingValidationIssue[] {
  const issues: FrameSamplingValidationIssue[] = [];

  if (!plan.sampling_points || plan.sampling_points.length === 0) {
    issues.push({
      code: 'SAMPLING_POINTS_MISSING',
      message: 'sampling_points must be present',
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
    return issues;
  }

  for (const point of plan.sampling_points) {
    if (point.reads_frame !== false) {
      issues.push({
        code: 'POINT_READS_FRAME',
        message: `Point ${point.point_id} must not read frames`,
        severity: 'error',
        sampling_plan_id: plan.sampling_plan_id,
      });
    }
    if (point.saves_image !== false) {
      issues.push({
        code: 'POINT_SAVES_IMAGE',
        message: `Point ${point.point_id} must not save images`,
        severity: 'error',
        sampling_plan_id: plan.sampling_plan_id,
      });
    }
    if (point.candidate_type !== 'timestamp_candidate') {
      issues.push({
        code: 'INVALID_CANDIDATE_TYPE',
        message: `Point ${point.point_id} must be timestamp_candidate only`,
        severity: 'error',
        sampling_plan_id: plan.sampling_plan_id,
      });
    }
    if (typeof point.timestamp_seconds !== 'number' || point.timestamp_seconds < 0) {
      issues.push({
        code: 'INVALID_TIMESTAMP',
        message: `Point ${point.point_id} must have valid timestamp_seconds`,
        severity: 'error',
        sampling_plan_id: plan.sampling_plan_id,
      });
    }

    for (const key of FORBIDDEN_POINT_KEYS) {
      if (key in (point as Record<string, unknown>)) {
        issues.push({
          code: 'IMAGE_ASSET_FIELD_FORBIDDEN',
          message: `Point ${point.point_id} must not contain ${key}`,
          severity: 'error',
          sampling_plan_id: plan.sampling_plan_id,
        });
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisFrameSamplingPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): FrameSamplingValidationResult {
  const issues: FrameSamplingValidationIssue[] = [];

  const dryRun = loadMovieAnalysisDryRun(projectRoot, plan.dry_run_id);
  if (!dryRun) {
    issues.push({
      code: 'DRY_RUN_MISSING',
      message: `Dry run ${plan.dry_run_id} not found`,
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  } else if (dryRun.analysis_plan_id !== plan.analysis_plan_id) {
    issues.push({
      code: 'DRY_RUN_LINK_MISMATCH',
      message: 'dry_run_id analysis_plan_id does not match plan',
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }

  const analysisPlan = loadMovieAnalysisPlan(projectRoot, plan.analysis_plan_id);
  if (!analysisPlan) {
    issues.push({
      code: 'ANALYSIS_PLAN_MISSING',
      message: `Analysis plan ${plan.analysis_plan_id} not found`,
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  } else if (analysisPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'ANALYSIS_PLAN_LINK_MISMATCH',
      message: 'analysis_plan_id source_video_id does not match plan',
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }

  const expectedCount = TARGET_FRAME_COUNTS[plan.source_video_id];
  if (plan.target_frame_count !== expectedCount) {
    issues.push({
      code: 'TARGET_COUNT_MISMATCH',
      message: `target_frame_count expected ${expectedCount}, got ${plan.target_frame_count}`,
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }
  if (plan.sampling_points.length !== expectedCount) {
    issues.push({
      code: 'SAMPLING_POINT_COUNT_MISMATCH',
      message: `sampling_points length expected ${expectedCount}, got ${plan.sampling_points.length}`,
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }

  if (!plan.identity_safety.timestamp_only || !plan.identity_safety.no_image_assets) {
    issues.push({
      code: 'IDENTITY_SAFETY_INVALID',
      message: 'identity_safety must enforce timestamp_only and no_image_assets',
      severity: 'error',
      sampling_plan_id: plan.sampling_plan_id,
    });
  }

  issues.push(...validateSamplingPoints(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    sampling_plan_id: plan.sampling_plan_id,
    dry_run_id: plan.dry_run_id,
    analysis_plan_id: plan.analysis_plan_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisFrameSamplingReport): string {
  const lines = [
    '# Movie Analysis Frame Sampling Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'source video',
    '  ↓',
    'sampling design',
    '  ↓',
    'timestamp candidates',
    '  ↓',
    'future scene detection preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| sampling_plans | ${report.sampling_plans} |`,
    `| registry | ${report.registry} |`,
    `| dry_run_links | ${report.dry_run_links} |`,
    `| analysis_links | ${report.analysis_links} |`,
    `| source_links | ${report.source_links} |`,
    `| target_counts | ${report.target_counts} |`,
    `| timestamp_candidates_only | ${report.timestamp_candidates_only} |`,
    `| frame_extraction | ${report.frame_extraction} |`,
    `| ocr | ${report.ocr} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## Target Counts',
    '',
    '- GHIBLI_01 = 12',
    '- SHINKAI_01 = 12',
    '- LITTLE_WOMEN_01 = 16',
    '- MORI_01 = 12',
    '',
    '## Sampling Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.sampling_plan_id}`);
    lines.push('');
    lines.push(`- dry_run_id: ${validation.dry_run_id}`);
    lines.push(`- analysis_plan_id: ${validation.analysis_plan_id}`);
    lines.push(`- status: ${validation.status}`);
    if (validation.issues.length > 0) {
      for (const issue of validation.issues) {
        lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
      }
    }
    lines.push('');
  }

  lines.push('**Next phase:** PHASE-SOURCE-VIDEO-025 MOVIE_ANALYSIS_SCENE_DETECTION_DESIGN_V1');

  return lines.join('\n');
}

export function writeMovieAnalysisFrameSamplingReport(
  projectRoot?: string
): MovieAnalysisFrameSamplingReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: FrameSamplingValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, DRY_RUN_REGISTRY_PATH))) {
    issues.push({
      code: 'DRY_RUN_REGISTRY_MISSING',
      message: `Missing ${DRY_RUN_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, FRAME_SAMPLING_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'SAMPLING_REGISTRY_MISSING',
      message: `Missing ${FRAME_SAMPLING_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: FrameSamplingValidationResult[] = [];
  const plans: MovieAnalysisFrameSamplingPlan[] = [];

  for (const spec of SEED_FRAME_SAMPLING_SPECS) {
    const plan = loadMovieAnalysisFrameSamplingPlan(root, spec.sampling_plan_id);
    if (!plan) {
      issues.push({
        code: 'SAMPLING_PLAN_MISSING',
        message: `Missing sampling plan: ${spec.sampling_plan_id}`,
        severity: 'error',
        sampling_plan_id: spec.sampling_plan_id,
      });
      planValidations.push({
        sampling_plan_id: spec.sampling_plan_id,
        dry_run_id: spec.dry_run_id,
        analysis_plan_id: 'UNKNOWN',
        status: 'FAIL',
        issues: [
          {
            code: 'SAMPLING_PLAN_MISSING',
            message: `Plan file not found in ${FRAME_SAMPLING_PLANS_DIR}`,
            severity: 'error',
            sampling_plan_id: spec.sampling_plan_id,
          },
        ],
      });
      continue;
    }

    plans.push(plan);
    if (finalSet) {
      planValidations.push(validatePlan(plan, finalSet, root));
    }
  }

  const allPlanIssues = planValidations.flatMap((v) => v.issues);
  issues.push(...allPlanIssues);

  const dryRunLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('DRY_RUN'))
      ? 'PASS'
      : 'FAIL';

  const analysisLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('ANALYSIS_PLAN'))
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const targetCounts =
    plans.length === 4 &&
    plans.every((p) => p.sampling_points.length === TARGET_FRAME_COUNTS[p.source_video_id])
      ? 'PASS'
      : 'FAIL';

  const timestampCandidatesOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.sampling_points.every(
          (pt) =>
            pt.candidate_type === 'timestamp_candidate' &&
            pt.reads_frame === false &&
            pt.saves_image === false
        ) &&
        p.identity_safety.timestamp_only &&
        p.identity_safety.no_image_assets
    )
      ? 'PASS'
      : 'FAIL';

  const registry =
    registryOk &&
    plans.length === 4 &&
    planValidations.every((v) => v.status === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const pass =
    plans.length === 4 &&
    dryRunLinks === 'PASS' &&
    analysisLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    targetCounts === 'PASS' &&
    timestampCandidatesOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisFrameSamplingReport = {
    report_id: 'movie-analysis-frame-sampling-report-v1',
    phase: FRAME_SAMPLING_PHASE,
    timestamp,
    sampling_plans: plans.length,
    registry,
    dry_run_links: dryRunLinks,
    analysis_links: analysisLinks,
    source_links: sourceLinks,
    target_counts: targetCounts,
    timestamp_candidates_only: timestampCandidatesOnly,
    plan_validations: planValidations,
    frame_extraction: false,
    ocr: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass ? FRAME_SAMPLING_PASS_VERDICT : FRAME_SAMPLING_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, FRAME_SAMPLING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, FRAME_SAMPLING_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
