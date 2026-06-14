import fs from 'node:fs';
import path from 'node:path';
import { loadMovieAnalysisPlan } from './movieAnalysisPlanBuilder.js';
import {
  DRY_RUN_REGISTRY_PATH,
  loadMovieAnalysisDryRun,
} from './movieAnalysisDryRunPlanner.js';
import {
  FRAME_SAMPLING_REGISTRY_PATH,
  loadMovieAnalysisFrameSamplingPlan,
} from './movieAnalysisFrameSamplingDesign.js';
import {
  SCENE_DETECTION_PHASE,
  SCENE_DETECTION_REGISTRY_PATH,
  SCENE_DETECTION_PLANS_DIR,
  SEED_SCENE_DETECTION_SPECS,
  TARGET_SCENE_CANDIDATE_COUNTS,
  type MovieAnalysisSceneDetectionPlan,
  loadMovieAnalysisSceneDetectionPlan,
} from './movieAnalysisSceneDetectionDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SCENE_DETECTION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_SCENE_DETECTION_DESIGN_V1' as const;
export const SCENE_DETECTION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_SCENE_DETECTION_DESIGN_V1' as const;
export const SCENE_DETECTION_REPORT_PATH =
  'reports/movie-analysis-scene-detection-report.json' as const;
export const SCENE_DETECTION_MD_PATH =
  'reports/MOVIE_ANALYSIS_SCENE_DETECTION_DESIGN.md' as const;

export type SceneDetectionValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  scene_detection_id?: string;
};

export type SceneDetectionValidationResult = {
  scene_detection_id: string;
  dry_run_id: string;
  analysis_plan_id: string;
  sampling_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: SceneDetectionValidationIssue[];
};

export type MovieAnalysisSceneDetectionReport = {
  report_id: string;
  phase: typeof SCENE_DETECTION_PHASE;
  timestamp: string;
  scene_detection_plans: number;
  registry: 'PASS' | 'FAIL';
  sampling_links: 'PASS' | 'FAIL';
  dry_run_links: 'PASS' | 'FAIL';
  analysis_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  candidate_counts_valid: 'PASS' | 'FAIL';
  estimated_only: 'PASS' | 'FAIL';
  plan_validations: SceneDetectionValidationResult[];
  frame_extraction: false;
  scene_extraction: false;
  ocr: false;
  gpu_execution: false;
  external_call_allowed: false;
  planning_only: true;
  final_verdict:
    | typeof SCENE_DETECTION_PASS_VERDICT
    | typeof SCENE_DETECTION_FAIL_VERDICT;
  issues: SceneDetectionValidationIssue[];
};

const FORBIDDEN_CANDIDATE_KEYS = [
  'image_path',
  'frame_path',
  'frame_file',
  'image_file',
  'output_path',
  'asset_path',
  'base64',
  'pixel_data',
  'boundary_extracted',
  'scene_boundary',
  'validated_timestamp',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisSceneDetectionPlan
): SceneDetectionValidationIssue[] {
  const issues: SceneDetectionValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }
  if (flags.frame_extraction !== false) {
    issues.push({
      code: 'FRAME_EXTRACTION_ENABLED',
      message: 'execution_flags.frame_extraction must be false',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }
  if (flags.scene_extraction !== false) {
    issues.push({
      code: 'SCENE_EXTRACTION_ENABLED',
      message: 'execution_flags.scene_extraction must be false',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }

  return issues;
}

function validateSceneCandidates(
  plan: MovieAnalysisSceneDetectionPlan
): SceneDetectionValidationIssue[] {
  const issues: SceneDetectionValidationIssue[] = [];

  if (!plan.scene_candidates || plan.scene_candidates.length === 0) {
    issues.push({
      code: 'SCENE_CANDIDATES_MISSING',
      message: 'scene_candidates must be present',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
    return issues;
  }

  for (const candidate of plan.scene_candidates) {
    if (candidate.reads_frame !== false) {
      issues.push({
        code: 'CANDIDATE_READS_FRAME',
        message: `Candidate ${candidate.candidate_id} must not read frames`,
        severity: 'error',
        scene_detection_id: plan.scene_detection_id,
      });
    }
    if (candidate.extracts_boundary !== false) {
      issues.push({
        code: 'CANDIDATE_EXTRACTS_BOUNDARY',
        message: `Candidate ${candidate.candidate_id} must not extract boundaries`,
        severity: 'error',
        scene_detection_id: plan.scene_detection_id,
      });
    }
    if (candidate.validates_timestamp !== false) {
      issues.push({
        code: 'CANDIDATE_VALIDATES_TIMESTAMP',
        message: `Candidate ${candidate.candidate_id} must not validate timestamps from frames`,
        severity: 'error',
        scene_detection_id: plan.scene_detection_id,
      });
    }
    if (candidate.candidate_type !== 'estimated_scene_candidate') {
      issues.push({
        code: 'INVALID_CANDIDATE_TYPE',
        message: `Candidate ${candidate.candidate_id} must be estimated_scene_candidate only`,
        severity: 'error',
        scene_detection_id: plan.scene_detection_id,
      });
    }
    if (candidate.estimated_only !== true) {
      issues.push({
        code: 'ESTIMATED_ONLY_FALSE',
        message: `Candidate ${candidate.candidate_id} must have estimated_only=true`,
        severity: 'error',
        scene_detection_id: plan.scene_detection_id,
      });
    }
    if (
      typeof candidate.estimated_start_seconds !== 'number' ||
      typeof candidate.estimated_end_seconds !== 'number' ||
      candidate.estimated_end_seconds < candidate.estimated_start_seconds
    ) {
      issues.push({
        code: 'INVALID_ESTIMATED_RANGE',
        message: `Candidate ${candidate.candidate_id} must have valid estimated range`,
        severity: 'error',
        scene_detection_id: plan.scene_detection_id,
      });
    }

    for (const key of FORBIDDEN_CANDIDATE_KEYS) {
      if (key in (candidate as Record<string, unknown>)) {
        issues.push({
          code: 'FORBIDDEN_CANDIDATE_FIELD',
          message: `Candidate ${candidate.candidate_id} must not contain ${key}`,
          severity: 'error',
          scene_detection_id: plan.scene_detection_id,
        });
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisSceneDetectionPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): SceneDetectionValidationResult {
  const issues: SceneDetectionValidationIssue[] = [];

  const samplingPlan = loadMovieAnalysisFrameSamplingPlan(projectRoot, plan.sampling_plan_id);
  if (!samplingPlan) {
    issues.push({
      code: 'SAMPLING_PLAN_MISSING',
      message: `Sampling plan ${plan.sampling_plan_id} not found`,
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  } else {
    if (samplingPlan.source_video_id !== plan.source_video_id) {
      issues.push({
        code: 'SAMPLING_PLAN_LINK_MISMATCH',
        message: 'sampling_plan_id source_video_id does not match plan',
        severity: 'error',
        scene_detection_id: plan.scene_detection_id,
      });
    }
    if (samplingPlan.dry_run_id !== plan.dry_run_id) {
      issues.push({
        code: 'SAMPLING_DRY_RUN_MISMATCH',
        message: 'sampling_plan dry_run_id does not match scene detection plan',
        severity: 'error',
        scene_detection_id: plan.scene_detection_id,
      });
    }
  }

  const dryRun = loadMovieAnalysisDryRun(projectRoot, plan.dry_run_id);
  if (!dryRun) {
    issues.push({
      code: 'DRY_RUN_MISSING',
      message: `Dry run ${plan.dry_run_id} not found`,
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  } else if (dryRun.analysis_plan_id !== plan.analysis_plan_id) {
    issues.push({
      code: 'DRY_RUN_LINK_MISMATCH',
      message: 'dry_run_id analysis_plan_id does not match plan',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }

  const analysisPlan = loadMovieAnalysisPlan(projectRoot, plan.analysis_plan_id);
  if (!analysisPlan) {
    issues.push({
      code: 'ANALYSIS_PLAN_MISSING',
      message: `Analysis plan ${plan.analysis_plan_id} not found`,
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  } else if (analysisPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'ANALYSIS_PLAN_LINK_MISMATCH',
      message: 'analysis_plan_id source_video_id does not match plan',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }

  const expectedCount = TARGET_SCENE_CANDIDATE_COUNTS[plan.source_video_id];
  if (plan.scene_candidate_count !== expectedCount) {
    issues.push({
      code: 'CANDIDATE_COUNT_MISMATCH',
      message: `scene_candidate_count expected ${expectedCount}, got ${plan.scene_candidate_count}`,
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }
  if (plan.scene_candidates.length !== expectedCount) {
    issues.push({
      code: 'SCENE_CANDIDATE_LENGTH_MISMATCH',
      message: `scene_candidates length expected ${expectedCount}, got ${plan.scene_candidates.length}`,
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }

  if (!plan.identity_safety.estimated_only || !plan.identity_safety.no_boundary_extraction) {
    issues.push({
      code: 'IDENTITY_SAFETY_INVALID',
      message: 'identity_safety must enforce estimated_only and no_boundary_extraction',
      severity: 'error',
      scene_detection_id: plan.scene_detection_id,
    });
  }

  issues.push(...validateSceneCandidates(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    scene_detection_id: plan.scene_detection_id,
    dry_run_id: plan.dry_run_id,
    analysis_plan_id: plan.analysis_plan_id,
    sampling_plan_id: plan.sampling_plan_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisSceneDetectionReport): string {
  const lines = [
    '# Movie Analysis Scene Detection Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'timestamp candidates',
    '  ↓',
    'scene candidates',
    '  ↓',
    'future coordinate extraction preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| scene_detection_plans | ${report.scene_detection_plans} |`,
    `| registry | ${report.registry} |`,
    `| sampling_links | ${report.sampling_links} |`,
    `| dry_run_links | ${report.dry_run_links} |`,
    `| analysis_links | ${report.analysis_links} |`,
    `| source_links | ${report.source_links} |`,
    `| candidate_counts_valid | ${report.candidate_counts_valid} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| frame_extraction | ${report.frame_extraction} |`,
    `| scene_extraction | ${report.scene_extraction} |`,
    `| ocr | ${report.ocr} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## Target Candidate Counts',
    '',
    '- GHIBLI_01 = 4',
    '- SHINKAI_01 = 4',
    '- LITTLE_WOMEN_01 = 6',
    '- MORI_01 = 4',
    '',
    '## Detection Strategies',
    '',
    '- VISUAL_TRANSITION_CANDIDATE',
    '- EMOTIONAL_SHIFT_CANDIDATE',
    '- LOCATION_CHANGE_CANDIDATE',
    '- DIALOGUE_BLOCK_CANDIDATE',
    '',
    '## Scene Detection Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.scene_detection_id}`);
    lines.push('');
    lines.push(`- sampling_plan_id: ${validation.sampling_plan_id}`);
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

  lines.push('**Next phase:** PHASE-SOURCE-VIDEO-026 MOVIE_ANALYSIS_COORDINATE_EXTRACTION_DESIGN_V1');

  return lines.join('\n');
}

export function writeMovieAnalysisSceneDetectionReport(
  projectRoot?: string
): MovieAnalysisSceneDetectionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SceneDetectionValidationIssue[] = [];
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

  if (!fs.existsSync(path.join(root, FRAME_SAMPLING_REGISTRY_PATH))) {
    issues.push({
      code: 'FRAME_SAMPLING_REGISTRY_MISSING',
      message: `Missing ${FRAME_SAMPLING_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, SCENE_DETECTION_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'SCENE_DETECTION_REGISTRY_MISSING',
      message: `Missing ${SCENE_DETECTION_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: SceneDetectionValidationResult[] = [];
  const plans: MovieAnalysisSceneDetectionPlan[] = [];

  for (const spec of SEED_SCENE_DETECTION_SPECS) {
    const plan = loadMovieAnalysisSceneDetectionPlan(root, spec.scene_detection_id);
    if (!plan) {
      issues.push({
        code: 'SCENE_DETECTION_PLAN_MISSING',
        message: `Missing scene detection plan: ${spec.scene_detection_id}`,
        severity: 'error',
        scene_detection_id: spec.scene_detection_id,
      });
      planValidations.push({
        scene_detection_id: spec.scene_detection_id,
        dry_run_id: 'UNKNOWN',
        analysis_plan_id: 'UNKNOWN',
        sampling_plan_id: spec.sampling_plan_id,
        status: 'FAIL',
        issues: [
          {
            code: 'SCENE_DETECTION_PLAN_MISSING',
            message: `Plan file not found in ${SCENE_DETECTION_PLANS_DIR}`,
            severity: 'error',
            scene_detection_id: spec.scene_detection_id,
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

  const samplingLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SAMPLING'))
      ? 'PASS'
      : 'FAIL';

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

  const candidateCountsValid =
    plans.length === 4 &&
    plans.every((p) => p.scene_candidates.length === TARGET_SCENE_CANDIDATE_COUNTS[p.source_video_id])
      ? 'PASS'
      : 'FAIL';

  const estimatedOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.scene_candidates.every(
          (c) =>
            c.candidate_type === 'estimated_scene_candidate' &&
            c.estimated_only === true &&
            c.reads_frame === false &&
            c.extracts_boundary === false &&
            c.validates_timestamp === false
        ) &&
        p.identity_safety.estimated_only &&
        p.identity_safety.no_boundary_extraction
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
    samplingLinks === 'PASS' &&
    dryRunLinks === 'PASS' &&
    analysisLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    candidateCountsValid === 'PASS' &&
    estimatedOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisSceneDetectionReport = {
    report_id: 'movie-analysis-scene-detection-report-v1',
    phase: SCENE_DETECTION_PHASE,
    timestamp,
    scene_detection_plans: plans.length,
    registry,
    sampling_links: samplingLinks,
    dry_run_links: dryRunLinks,
    analysis_links: analysisLinks,
    source_links: sourceLinks,
    candidate_counts_valid: candidateCountsValid,
    estimated_only: estimatedOnly,
    plan_validations: planValidations,
    frame_extraction: false,
    scene_extraction: false,
    ocr: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass ? SCENE_DETECTION_PASS_VERDICT : SCENE_DETECTION_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, SCENE_DETECTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, SCENE_DETECTION_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
