import fs from 'node:fs';
import path from 'node:path';
import {
  KEYFRAME_PREPARATION_REGISTRY_PATH,
  loadMovieAnalysisKeyframePreparationPlan,
  type MovieAnalysisKeyframePreparationPlan,
} from './movieAnalysisKeyframePreparationDesign.js';
import {
  MOTION_PLANNING_PHASE,
  MOTION_PLANNING_REGISTRY_PATH,
  MOTION_PLANNING_PLANS_DIR,
  ALL_MOTION_CATEGORIES,
  SEED_MOTION_PLANNING_SPECS,
  TARGET_MOTION_CANDIDATE_COUNTS,
  type MovieAnalysisMotionPlanningPlan,
  loadMovieAnalysisMotionPlanningPlan,
} from './movieAnalysisMotionPlanningDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOTION_PLANNING_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_MOTION_PLANNING_DESIGN_V1' as const;
export const MOTION_PLANNING_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_MOTION_PLANNING_DESIGN_V1' as const;
export const MOTION_PLANNING_REPORT_PATH =
  'reports/movie-analysis-motion-planning-report.json' as const;
export const MOTION_PLANNING_MD_PATH =
  'reports/MOVIE_ANALYSIS_MOTION_PLANNING_DESIGN.md' as const;

export type MotionPlanningValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  motion_plan_id?: string;
};

export type MotionPlanningValidationResult = {
  motion_plan_id: string;
  keyframe_preparation_id: string;
  status: 'PASS' | 'FAIL';
  issues: MotionPlanningValidationIssue[];
};

export type MovieAnalysisMotionPlanningReport = {
  report_id: string;
  phase: typeof MOTION_PLANNING_PHASE;
  timestamp: string;
  motion_plans: number;
  registry: 'PASS' | 'FAIL';
  keyframe_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  motion_categories: 'PASS' | 'FAIL';
  candidate_counts_valid: 'PASS' | 'FAIL';
  estimated_only: 'PASS' | 'FAIL';
  plan_validations: MotionPlanningValidationResult[];
  motion_planning_only: true;
  motion_generation: false;
  video_generation: false;
  keyframe_generation: false;
  ocr: false;
  gpu_execution: false;
  external_call_allowed: false;
  planning_only: true;
  final_verdict:
    | typeof MOTION_PLANNING_PASS_VERDICT
    | typeof MOTION_PLANNING_FAIL_VERDICT;
  issues: MotionPlanningValidationIssue[];
};

const FORBIDDEN_MOTION_KEYS = [
  'video_path',
  'keyframe_path',
  'generated_video',
  'generated_motion',
  'runtime_payload',
  'gpu_payload',
  'image_path',
  'asset_path',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisMotionPlanningPlan
): MotionPlanningValidationIssue[] {
  const issues: MotionPlanningValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }
  if (flags.motion_planning_only !== true) {
    issues.push({
      code: 'MOTION_PLANNING_ONLY_FALSE',
      message: 'execution_flags.motion_planning_only must be true',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }
  if (flags.motion_generation !== false) {
    issues.push({
      code: 'MOTION_GENERATION_ENABLED',
      message: 'execution_flags.motion_generation must be false',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }
  if (flags.keyframe_generation !== false) {
    issues.push({
      code: 'KEYFRAME_GENERATION_ENABLED',
      message: 'execution_flags.keyframe_generation must be false',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }

  return issues;
}

function validateMotionCategories(
  plan: MovieAnalysisMotionPlanningPlan
): MotionPlanningValidationIssue[] {
  const issues: MotionPlanningValidationIssue[] = [];

  if (!plan.motion_categories || plan.motion_categories.length === 0) {
    issues.push({
      code: 'MOTION_CATEGORIES_MISSING',
      message: 'motion_categories must be present',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
    return issues;
  }

  for (const expected of ALL_MOTION_CATEGORIES) {
    if (!plan.motion_categories.includes(expected)) {
      issues.push({
        code: 'MOTION_CATEGORY_MISSING',
        message: `motion_categories must include ${expected}`,
        severity: 'error',
        motion_plan_id: plan.motion_plan_id,
      });
    }
  }

  if (plan.motion_categories.length !== ALL_MOTION_CATEGORIES.length) {
    issues.push({
      code: 'MOTION_CATEGORIES_COUNT_MISMATCH',
      message: `motion_categories must contain exactly ${ALL_MOTION_CATEGORIES.length} categories`,
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }

  return issues;
}

function validateMotionCandidates(
  plan: MovieAnalysisMotionPlanningPlan,
  keyframePlan: MovieAnalysisKeyframePreparationPlan | null
): MotionPlanningValidationIssue[] {
  const issues: MotionPlanningValidationIssue[] = [];

  if (!plan.motion_candidates || plan.motion_candidates.length === 0) {
    issues.push({
      code: 'MOTION_CANDIDATES_MISSING',
      message: 'motion_candidates must be present',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
    return issues;
  }

  for (const candidate of plan.motion_candidates) {
    if (candidate.generates_motion !== false) {
      issues.push({
        code: 'MOTION_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.motion_candidate_id} must not generate motion`,
        severity: 'error',
        motion_plan_id: plan.motion_plan_id,
      });
    }
    if (candidate.generates_video !== false) {
      issues.push({
        code: 'VIDEO_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.motion_candidate_id} must not generate video`,
        severity: 'error',
        motion_plan_id: plan.motion_plan_id,
      });
    }
    if (candidate.generates_keyframe !== false) {
      issues.push({
        code: 'KEYFRAME_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.motion_candidate_id} must not generate keyframes`,
        severity: 'error',
        motion_plan_id: plan.motion_plan_id,
      });
    }
    if (candidate.candidate_type !== 'estimated_motion_candidate') {
      issues.push({
        code: 'INVALID_MOTION_CANDIDATE_TYPE',
        message: `Candidate ${candidate.motion_candidate_id} must be estimated_motion_candidate only`,
        severity: 'error',
        motion_plan_id: plan.motion_plan_id,
      });
    }
    if (candidate.estimated_only !== true) {
      issues.push({
        code: 'ESTIMATED_ONLY_FALSE',
        message: `Candidate ${candidate.motion_candidate_id} must have estimated_only=true`,
        severity: 'error',
        motion_plan_id: plan.motion_plan_id,
      });
    }
    if (!ALL_MOTION_CATEGORIES.includes(candidate.motion_category)) {
      issues.push({
        code: 'INVALID_MOTION_CATEGORY',
        message: `Candidate ${candidate.motion_candidate_id} has invalid motion_category`,
        severity: 'error',
        motion_plan_id: plan.motion_plan_id,
      });
    }
    if (
      !candidate.estimated_motion_value ||
      !candidate.estimated_motion_value.startsWith('estimated_motion_')
    ) {
      issues.push({
        code: 'INVALID_ESTIMATED_MOTION_VALUE',
        message: `Candidate ${candidate.motion_candidate_id} must have estimated motion placeholder value`,
        severity: 'error',
        motion_plan_id: plan.motion_plan_id,
      });
    }

    if (keyframePlan) {
      const keyframeRef = keyframePlan.keyframe_candidates.find(
        (k) => k.keyframe_candidate_id === candidate.keyframe_candidate_id
      );
      if (!keyframeRef) {
        issues.push({
          code: 'KEYFRAME_CANDIDATE_REF_MISSING',
          message: `Candidate ${candidate.motion_candidate_id} references unknown keyframe_candidate_id`,
          severity: 'error',
          motion_plan_id: plan.motion_plan_id,
        });
      }
    }

    for (const key of FORBIDDEN_MOTION_KEYS) {
      if (key in (candidate as Record<string, unknown>)) {
        issues.push({
          code: 'FORBIDDEN_MOTION_FIELD',
          message: `Candidate ${candidate.motion_candidate_id} must not contain ${key}`,
          severity: 'error',
          motion_plan_id: plan.motion_plan_id,
        });
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisMotionPlanningPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): MotionPlanningValidationResult {
  const issues: MotionPlanningValidationIssue[] = [];

  const keyframePlan = loadMovieAnalysisKeyframePreparationPlan(
    projectRoot,
    plan.keyframe_preparation_id
  );
  if (!keyframePlan) {
    issues.push({
      code: 'KEYFRAME_PREPARATION_MISSING',
      message: `Keyframe preparation plan ${plan.keyframe_preparation_id} not found`,
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  } else if (keyframePlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'KEYFRAME_PREPARATION_LINK_MISMATCH',
      message: 'keyframe_preparation_id source_video_id does not match plan',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }

  const expectedCount = TARGET_MOTION_CANDIDATE_COUNTS[plan.source_video_id];
  if (plan.motion_candidate_count !== expectedCount) {
    issues.push({
      code: 'CANDIDATE_COUNT_MISMATCH',
      message: `motion_candidate_count expected ${expectedCount}, got ${plan.motion_candidate_count}`,
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }
  if (plan.motion_candidates.length !== expectedCount) {
    issues.push({
      code: 'MOTION_CANDIDATE_LENGTH_MISMATCH',
      message: `motion_candidates length expected ${expectedCount}, got ${plan.motion_candidates.length}`,
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }

  if (!plan.identity_safety.estimated_only || !plan.identity_safety.no_motion_generation) {
    issues.push({
      code: 'IDENTITY_SAFETY_INVALID',
      message: 'identity_safety must enforce estimated_only and no_motion_generation',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }

  if (plan.coverage_goal.purpose !== 'future_video_generation_preparation') {
    issues.push({
      code: 'COVERAGE_GOAL_INVALID',
      message: 'coverage_goal.purpose must be future_video_generation_preparation',
      severity: 'error',
      motion_plan_id: plan.motion_plan_id,
    });
  }

  issues.push(...validateMotionCategories(plan));
  issues.push(...validateMotionCandidates(plan, keyframePlan));
  issues.push(...validateExecutionFlags(plan));

  return {
    motion_plan_id: plan.motion_plan_id,
    keyframe_preparation_id: plan.keyframe_preparation_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisMotionPlanningReport): string {
  const lines = [
    '# Movie Analysis Motion Planning Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'keyframe candidates',
    '  ↓',
    'motion planning candidates',
    '  ↓',
    'future video generation preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| motion_plans | ${report.motion_plans} |`,
    `| registry | ${report.registry} |`,
    `| keyframe_links | ${report.keyframe_links} |`,
    `| source_links | ${report.source_links} |`,
    `| motion_categories | ${report.motion_categories} |`,
    `| candidate_counts_valid | ${report.candidate_counts_valid} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| motion_planning_only | ${report.motion_planning_only} |`,
    `| motion_generation | ${report.motion_generation} |`,
    `| video_generation | ${report.video_generation} |`,
    `| keyframe_generation | ${report.keyframe_generation} |`,
    `| ocr | ${report.ocr} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## Motion Categories',
    '',
    '- camera_motion',
    '- character_motion',
    '- crowd_motion',
    '- animal_motion',
    '- environment_motion',
    '- emotion_flow',
    '- transition_flow',
    '- timing_flow',
    '- continuity_flow',
    '',
    '## Planning Strategies',
    '',
    '- CAMERA_MOTION_PLAN',
    '- CHARACTER_MOTION_PLAN',
    '- EMOTION_FLOW_PLAN',
    '- TRANSITION_FLOW_PLAN',
    '',
    '## Motion Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.motion_plan_id}`);
    lines.push('');
    lines.push(`- keyframe_preparation_id: ${validation.keyframe_preparation_id}`);
    lines.push(`- status: ${validation.status}`);
    if (validation.issues.length > 0) {
      for (const issue of validation.issues) {
        lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeMovieAnalysisMotionPlanningReport(
  projectRoot?: string
): MovieAnalysisMotionPlanningReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MotionPlanningValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, KEYFRAME_PREPARATION_REGISTRY_PATH))) {
    issues.push({
      code: 'KEYFRAME_PREPARATION_REGISTRY_MISSING',
      message: `Missing ${KEYFRAME_PREPARATION_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, MOTION_PLANNING_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'MOTION_PLANNING_REGISTRY_MISSING',
      message: `Missing ${MOTION_PLANNING_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: MotionPlanningValidationResult[] = [];
  const plans: MovieAnalysisMotionPlanningPlan[] = [];

  for (const spec of SEED_MOTION_PLANNING_SPECS) {
    const plan = loadMovieAnalysisMotionPlanningPlan(root, spec.motion_plan_id);
    if (!plan) {
      issues.push({
        code: 'MOTION_PLAN_MISSING',
        message: `Missing motion planning plan: ${spec.motion_plan_id}`,
        severity: 'error',
        motion_plan_id: spec.motion_plan_id,
      });
      planValidations.push({
        motion_plan_id: spec.motion_plan_id,
        keyframe_preparation_id: spec.keyframe_preparation_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MOTION_PLAN_MISSING',
            message: `Plan file not found in ${MOTION_PLANNING_PLANS_DIR}`,
            severity: 'error',
            motion_plan_id: spec.motion_plan_id,
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

  const keyframeLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('KEYFRAME_PREPARATION') || i.code.startsWith('KEYFRAME_CANDIDATE')
    )
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const motionCategories =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.motion_categories.length === ALL_MOTION_CATEGORIES.length &&
        ALL_MOTION_CATEGORIES.every((c) => p.motion_categories.includes(c))
    )
      ? 'PASS'
      : 'FAIL';

  const candidateCountsValid =
    plans.length === 4 &&
    plans.every(
      (p) => p.motion_candidates.length === TARGET_MOTION_CANDIDATE_COUNTS[p.source_video_id]
    )
      ? 'PASS'
      : 'FAIL';

  const estimatedOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.motion_candidates.every(
          (c) =>
            c.candidate_type === 'estimated_motion_candidate' &&
            c.estimated_only === true &&
            c.generates_motion === false &&
            c.generates_video === false &&
            c.generates_keyframe === false
        ) && p.identity_safety.estimated_only
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
    keyframeLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    motionCategories === 'PASS' &&
    candidateCountsValid === 'PASS' &&
    estimatedOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisMotionPlanningReport = {
    report_id: 'movie-analysis-motion-planning-report-v1',
    phase: MOTION_PLANNING_PHASE,
    timestamp,
    motion_plans: plans.length,
    registry,
    keyframe_links: keyframeLinks,
    source_links: sourceLinks,
    motion_categories: motionCategories,
    candidate_counts_valid: candidateCountsValid,
    estimated_only: estimatedOnly,
    plan_validations: planValidations,
    motion_planning_only: true,
    motion_generation: false,
    video_generation: false,
    keyframe_generation: false,
    ocr: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass ? MOTION_PLANNING_PASS_VERDICT : MOTION_PLANNING_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, MOTION_PLANNING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, MOTION_PLANNING_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
