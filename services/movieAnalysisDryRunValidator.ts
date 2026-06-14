import fs from 'node:fs';
import path from 'node:path';
import { PROMOTION_GATE_REPORT_PATH } from './gonegiPipelinePromotionGate.js';
import {
  ANALYSIS_PLAN_REGISTRY_PATH,
  loadMovieAnalysisPlan,
} from './movieAnalysisPlanBuilder.js';
import {
  DRY_RUN_PHASE,
  DRY_RUN_REGISTRY_PATH,
  DRY_RUN_PLANS_DIR,
  SEED_DRY_RUN_SPECS,
  type MovieAnalysisDryRun,
  loadMovieAnalysisDryRun,
} from './movieAnalysisDryRunPlanner.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DRY_RUN_PLANNER_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DRY_RUN_PLANNER_V1' as const;
export const DRY_RUN_PLANNER_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DRY_RUN_PLANNER_V1' as const;
export const DRY_RUN_PLANNER_REPORT_PATH =
  'reports/movie-analysis-dry-run-planner-report.json' as const;
export const DRY_RUN_PLANNER_MD_PATH =
  'reports/MOVIE_ANALYSIS_DRY_RUN_PLANNER.md' as const;

export type DryRunValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  dry_run_id?: string;
};

export type DryRunValidationResult = {
  dry_run_id: string;
  analysis_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: DryRunValidationIssue[];
};

export type MovieAnalysisDryRunPlannerReport = {
  report_id: string;
  phase: typeof DRY_RUN_PHASE;
  timestamp: string;
  dry_runs: number;
  registry: 'PASS' | 'FAIL';
  analysis_plan_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  promotion_warning: 'PASS' | 'FAIL';
  dry_run_validations: DryRunValidationResult[];
  frame_extraction: false;
  ocr: false;
  gpu_execution: false;
  external_call_allowed: false;
  planning_only: true;
  final_verdict:
    | typeof DRY_RUN_PLANNER_PASS_VERDICT
    | typeof DRY_RUN_PLANNER_FAIL_VERDICT;
  issues: DryRunValidationIssue[];
};

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(dryRun: MovieAnalysisDryRun): DryRunValidationIssue[] {
  const issues: DryRunValidationIssue[] = [];
  const flags = dryRun.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }
  if (flags.frame_extraction !== false) {
    issues.push({
      code: 'FRAME_EXTRACTION_ENABLED',
      message: 'execution_flags.frame_extraction must be false',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }

  return issues;
}

function validateDryRun(
  dryRun: MovieAnalysisDryRun,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): DryRunValidationResult {
  const issues: DryRunValidationIssue[] = [];

  const plan = loadMovieAnalysisPlan(projectRoot, dryRun.analysis_plan_id);
  if (!plan) {
    issues.push({
      code: 'ANALYSIS_PLAN_MISSING',
      message: `Analysis plan ${dryRun.analysis_plan_id} not found`,
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  } else if (plan.source_video_id !== dryRun.source_video_id) {
    issues.push({
      code: 'ANALYSIS_PLAN_LINK_MISMATCH',
      message: 'analysis_plan_id source_video_id does not match dry run',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === dryRun.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${dryRun.source_video_id} not in active final set`,
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }

  if (!dryRun.dry_run_steps || dryRun.dry_run_steps.length < 5) {
    issues.push({
      code: 'DRY_RUN_STEPS_MISSING',
      message: 'dry_run_steps must contain at least 5 steps',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  } else {
    for (const step of dryRun.dry_run_steps) {
      if (step.reads_frames !== false) {
        issues.push({
          code: 'STEP_READS_FRAMES',
          message: `Step ${step.step_id} must not read frames`,
          severity: 'error',
          dry_run_id: dryRun.dry_run_id,
        });
      }
    }
  }

  if (dryRun.estimated_segment_count < 1) {
    issues.push({
      code: 'INVALID_SEGMENT_COUNT',
      message: 'estimated_segment_count must be >= 1',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }

  if (dryRun.estimated_coordinate_count < 1) {
    issues.push({
      code: 'INVALID_COORDINATE_COUNT',
      message: 'estimated_coordinate_count must be >= 1',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }

  if (!dryRun.promotion_warning_preserved) {
    issues.push({
      code: 'PROMOTION_WARNING_NOT_PRESERVED',
      message: 'promotion_warning_preserved must be true',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }

  if (dryRun.identity_safety_checks.promotion_warning_preserved !== 'PASS') {
    issues.push({
      code: 'IDENTITY_PROMOTION_WARNING_FAIL',
      message: 'identity_safety_checks.promotion_warning_preserved must be PASS',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }

  const runtime = dryRun.runtime_safety_checks;
  if (
    runtime.frame_extraction !== false ||
    runtime.ocr !== false ||
    runtime.gpu_execution !== false ||
    runtime.external_call_allowed !== false ||
    runtime.planning_only !== true
  ) {
    issues.push({
      code: 'RUNTIME_SAFETY_FAIL',
      message: 'runtime_safety_checks must enforce planning-only safety',
      severity: 'error',
      dry_run_id: dryRun.dry_run_id,
    });
  }

  issues.push(...validateExecutionFlags(dryRun));

  return {
    dry_run_id: dryRun.dry_run_id,
    analysis_plan_id: dryRun.analysis_plan_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisDryRunPlannerReport): string {
  const lines = [
    '# Movie Analysis Dry-Run Planner',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'analysis plan',
    '  ↓',
    'dry-run analysis steps',
    '  ↓',
    'estimated segment candidates',
    '  ↓',
    'estimated coordinate candidates',
    '  ↓',
    'safety validation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| dry_runs | ${report.dry_runs} |`,
    `| registry | ${report.registry} |`,
    `| analysis_plan_links | ${report.analysis_plan_links} |`,
    `| source_links | ${report.source_links} |`,
    `| promotion_warning | ${report.promotion_warning} |`,
    `| frame_extraction | ${report.frame_extraction} |`,
    `| ocr | ${report.ocr} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## Dry Runs',
    '',
  ];

  for (const validation of report.dry_run_validations) {
    lines.push(`### ${validation.dry_run_id}`);
    lines.push('');
    lines.push(`- analysis_plan_id: ${validation.analysis_plan_id}`);
    lines.push(`- status: ${validation.status}`);
    if (validation.issues.length > 0) {
      for (const issue of validation.issues) {
        lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
      }
    }
    lines.push('');
  }

  lines.push('**Next phase:** PHASE-SOURCE-VIDEO-024 MOVIE_ANALYSIS_FRAME_SAMPLING_DESIGN_V1');

  return lines.join('\n');
}

export function writeMovieAnalysisDryRunPlannerReport(
  projectRoot?: string
): MovieAnalysisDryRunPlannerReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DryRunValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, ANALYSIS_PLAN_REGISTRY_PATH))) {
    issues.push({
      code: 'ANALYSIS_PLAN_REGISTRY_MISSING',
      message: `Missing ${ANALYSIS_PLAN_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const promotionGatePath = path.join(root, PROMOTION_GATE_REPORT_PATH);
  let promotionWarningPass = false;
  if (!fs.existsSync(promotionGatePath)) {
    issues.push({
      code: 'PROMOTION_GATE_MISSING',
      message: `Missing ${PROMOTION_GATE_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const gate = JSON.parse(fs.readFileSync(promotionGatePath, 'utf8')) as {
      promotion_status?: string;
      warning_reasons?: string[];
    };
    promotionWarningPass =
      gate.promotion_status === 'ALLOW_WITH_WARNING' &&
      (gate.warning_reasons?.length ?? 0) > 0;
  }

  const registryOk = fs.existsSync(path.join(root, DRY_RUN_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'DRY_RUN_REGISTRY_MISSING',
      message: `Missing ${DRY_RUN_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const dryRunValidations: DryRunValidationResult[] = [];
  const dryRuns: MovieAnalysisDryRun[] = [];

  for (const spec of SEED_DRY_RUN_SPECS) {
    const dryRun = loadMovieAnalysisDryRun(root, spec.dry_run_id);
    if (!dryRun) {
      issues.push({
        code: 'DRY_RUN_MISSING',
        message: `Missing dry run: ${spec.dry_run_id}`,
        severity: 'error',
        dry_run_id: spec.dry_run_id,
      });
      dryRunValidations.push({
        dry_run_id: spec.dry_run_id,
        analysis_plan_id: spec.analysis_plan_id,
        status: 'FAIL',
        issues: [
          {
            code: 'DRY_RUN_MISSING',
            message: `Dry run file not found in ${DRY_RUN_PLANS_DIR}`,
            severity: 'error',
            dry_run_id: spec.dry_run_id,
          },
        ],
      });
      continue;
    }

    dryRuns.push(dryRun);
    if (finalSet) {
      dryRunValidations.push(validateDryRun(dryRun, finalSet, root));
    }
  }

  const allDryRunIssues = dryRunValidations.flatMap((v) => v.issues);
  issues.push(...allDryRunIssues);

  const analysisPlanLinks =
    dryRunValidations.every((v) => v.status === 'PASS') &&
    !allDryRunIssues.some((i) => i.code.startsWith('ANALYSIS_PLAN'))
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    dryRunValidations.every((v) => v.status === 'PASS') &&
    !allDryRunIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const promotionWarning =
    promotionWarningPass &&
    dryRuns.every((d) => d.promotion_warning_preserved) &&
    dryRuns.every(
      (d) => d.identity_safety_checks.promotion_warning_preserved === 'PASS'
    )
      ? 'PASS'
      : 'FAIL';

  const registry =
    registryOk &&
    dryRuns.length === 4 &&
    dryRunValidations.every((v) => v.status === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const pass =
    dryRuns.length === 4 &&
    analysisPlanLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    promotionWarning === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisDryRunPlannerReport = {
    report_id: 'movie-analysis-dry-run-planner-report-v1',
    phase: DRY_RUN_PHASE,
    timestamp,
    dry_runs: dryRuns.length,
    registry,
    analysis_plan_links: analysisPlanLinks,
    source_links: sourceLinks,
    promotion_warning: promotionWarning,
    dry_run_validations: dryRunValidations,
    frame_extraction: false,
    ocr: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass ? DRY_RUN_PLANNER_PASS_VERDICT : DRY_RUN_PLANNER_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, DRY_RUN_PLANNER_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, DRY_RUN_PLANNER_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
