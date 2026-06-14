import fs from 'node:fs';
import path from 'node:path';
import {
  MOTION_PLANNING_REGISTRY_PATH,
  loadMovieAnalysisMotionPlanningPlan,
  type MovieAnalysisMotionPlanningPlan,
} from './movieAnalysisMotionPlanningDesign.js';
import {
  TEMPORAL_FLOW_PHASE,
  TEMPORAL_FLOW_REGISTRY_PATH,
  TEMPORAL_FLOW_PLANS_DIR,
  ALL_FLOW_CATEGORIES,
  SEED_TEMPORAL_FLOW_SPECS,
  TARGET_TEMPORAL_CANDIDATE_COUNTS,
  type MovieAnalysisTemporalFlowPlan,
  loadMovieAnalysisTemporalFlowPlan,
} from './movieAnalysisTemporalFlowDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TEMPORAL_FLOW_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_TEMPORAL_FLOW_DESIGN_V1' as const;
export const TEMPORAL_FLOW_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_TEMPORAL_FLOW_DESIGN_V1' as const;
export const TEMPORAL_FLOW_REPORT_PATH =
  'reports/movie-analysis-temporal-flow-report.json' as const;
export const TEMPORAL_FLOW_MD_PATH =
  'reports/MOVIE_ANALYSIS_TEMPORAL_FLOW_DESIGN.md' as const;

export type TemporalFlowValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  temporal_flow_id?: string;
};

export type TemporalFlowValidationResult = {
  temporal_flow_id: string;
  motion_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: TemporalFlowValidationIssue[];
};

export type MovieAnalysisTemporalFlowReport = {
  report_id: string;
  phase: typeof TEMPORAL_FLOW_PHASE;
  timestamp: string;
  temporal_flow_plans: number;
  registry: 'PASS' | 'FAIL';
  motion_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  flow_categories: 'PASS' | 'FAIL';
  candidate_counts_valid: 'PASS' | 'FAIL';
  estimated_only: 'PASS' | 'FAIL';
  plan_validations: TemporalFlowValidationResult[];
  temporal_flow_only: true;
  sequence_generation: false;
  video_generation: false;
  motion_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  planning_only: true;
  final_verdict:
    | typeof TEMPORAL_FLOW_PASS_VERDICT
    | typeof TEMPORAL_FLOW_FAIL_VERDICT;
  issues: TemporalFlowValidationIssue[];
};

const FORBIDDEN_TEMPORAL_KEYS = [
  'sequence_output',
  'generated_sequence',
  'video_path',
  'motion_output',
  'runtime_payload',
  'gpu_payload',
  'asset_path',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisTemporalFlowPlan
): TemporalFlowValidationIssue[] {
  const issues: TemporalFlowValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }
  if (flags.temporal_flow_only !== true) {
    issues.push({
      code: 'TEMPORAL_FLOW_ONLY_FALSE',
      message: 'execution_flags.temporal_flow_only must be true',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }
  if (flags.sequence_generation !== false) {
    issues.push({
      code: 'SEQUENCE_GENERATION_ENABLED',
      message: 'execution_flags.sequence_generation must be false',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }
  if (flags.motion_generation !== false) {
    issues.push({
      code: 'MOTION_GENERATION_ENABLED',
      message: 'execution_flags.motion_generation must be false',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }

  return issues;
}

function validateFlowCategories(
  plan: MovieAnalysisTemporalFlowPlan
): TemporalFlowValidationIssue[] {
  const issues: TemporalFlowValidationIssue[] = [];

  if (!plan.flow_categories || plan.flow_categories.length === 0) {
    issues.push({
      code: 'FLOW_CATEGORIES_MISSING',
      message: 'flow_categories must be present',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
    return issues;
  }

  for (const expected of ALL_FLOW_CATEGORIES) {
    if (!plan.flow_categories.includes(expected)) {
      issues.push({
        code: 'FLOW_CATEGORY_MISSING',
        message: `flow_categories must include ${expected}`,
        severity: 'error',
        temporal_flow_id: plan.temporal_flow_id,
      });
    }
  }

  if (plan.flow_categories.length !== ALL_FLOW_CATEGORIES.length) {
    issues.push({
      code: 'FLOW_CATEGORIES_COUNT_MISMATCH',
      message: `flow_categories must contain exactly ${ALL_FLOW_CATEGORIES.length} categories`,
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }

  return issues;
}

function validateTemporalCandidates(
  plan: MovieAnalysisTemporalFlowPlan,
  motionPlan: MovieAnalysisMotionPlanningPlan | null
): TemporalFlowValidationIssue[] {
  const issues: TemporalFlowValidationIssue[] = [];

  if (!plan.temporal_candidates || plan.temporal_candidates.length === 0) {
    issues.push({
      code: 'TEMPORAL_CANDIDATES_MISSING',
      message: 'temporal_candidates must be present',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
    return issues;
  }

  for (const candidate of plan.temporal_candidates) {
    if (candidate.generates_sequence !== false) {
      issues.push({
        code: 'SEQUENCE_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.temporal_candidate_id} must not generate sequences`,
        severity: 'error',
        temporal_flow_id: plan.temporal_flow_id,
      });
    }
    if (candidate.generates_video !== false) {
      issues.push({
        code: 'VIDEO_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.temporal_candidate_id} must not generate video`,
        severity: 'error',
        temporal_flow_id: plan.temporal_flow_id,
      });
    }
    if (candidate.generates_motion !== false) {
      issues.push({
        code: 'MOTION_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.temporal_candidate_id} must not generate motion`,
        severity: 'error',
        temporal_flow_id: plan.temporal_flow_id,
      });
    }
    if (candidate.candidate_type !== 'estimated_temporal_candidate') {
      issues.push({
        code: 'INVALID_TEMPORAL_CANDIDATE_TYPE',
        message: `Candidate ${candidate.temporal_candidate_id} must be estimated_temporal_candidate only`,
        severity: 'error',
        temporal_flow_id: plan.temporal_flow_id,
      });
    }
    if (candidate.estimated_only !== true) {
      issues.push({
        code: 'ESTIMATED_ONLY_FALSE',
        message: `Candidate ${candidate.temporal_candidate_id} must have estimated_only=true`,
        severity: 'error',
        temporal_flow_id: plan.temporal_flow_id,
      });
    }
    if (!ALL_FLOW_CATEGORIES.includes(candidate.flow_category)) {
      issues.push({
        code: 'INVALID_FLOW_CATEGORY',
        message: `Candidate ${candidate.temporal_candidate_id} has invalid flow_category`,
        severity: 'error',
        temporal_flow_id: plan.temporal_flow_id,
      });
    }
    if (
      !candidate.estimated_flow_value ||
      !candidate.estimated_flow_value.startsWith('estimated_flow_')
    ) {
      issues.push({
        code: 'INVALID_ESTIMATED_FLOW_VALUE',
        message: `Candidate ${candidate.temporal_candidate_id} must have estimated flow placeholder value`,
        severity: 'error',
        temporal_flow_id: plan.temporal_flow_id,
      });
    }

    if (motionPlan) {
      const motionRef = motionPlan.motion_candidates.find(
        (m) => m.motion_candidate_id === candidate.motion_candidate_id
      );
      if (!motionRef) {
        issues.push({
          code: 'MOTION_CANDIDATE_REF_MISSING',
          message: `Candidate ${candidate.temporal_candidate_id} references unknown motion_candidate_id`,
          severity: 'error',
          temporal_flow_id: plan.temporal_flow_id,
        });
      }
    }

    for (const key of FORBIDDEN_TEMPORAL_KEYS) {
      if (key in (candidate as Record<string, unknown>)) {
        issues.push({
          code: 'FORBIDDEN_TEMPORAL_FIELD',
          message: `Candidate ${candidate.temporal_candidate_id} must not contain ${key}`,
          severity: 'error',
          temporal_flow_id: plan.temporal_flow_id,
        });
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisTemporalFlowPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): TemporalFlowValidationResult {
  const issues: TemporalFlowValidationIssue[] = [];

  const motionPlan = loadMovieAnalysisMotionPlanningPlan(projectRoot, plan.motion_plan_id);
  if (!motionPlan) {
    issues.push({
      code: 'MOTION_PLAN_MISSING',
      message: `Motion planning plan ${plan.motion_plan_id} not found`,
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  } else if (motionPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'MOTION_PLAN_LINK_MISMATCH',
      message: 'motion_plan_id source_video_id does not match plan',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }

  const expectedCount = TARGET_TEMPORAL_CANDIDATE_COUNTS[plan.source_video_id];
  if (plan.temporal_candidate_count !== expectedCount) {
    issues.push({
      code: 'CANDIDATE_COUNT_MISMATCH',
      message: `temporal_candidate_count expected ${expectedCount}, got ${plan.temporal_candidate_count}`,
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }
  if (plan.temporal_candidates.length !== expectedCount) {
    issues.push({
      code: 'TEMPORAL_CANDIDATE_LENGTH_MISMATCH',
      message: `temporal_candidates length expected ${expectedCount}, got ${plan.temporal_candidates.length}`,
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }

  if (!plan.identity_safety.estimated_only || !plan.identity_safety.no_sequence_generation) {
    issues.push({
      code: 'IDENTITY_SAFETY_INVALID',
      message: 'identity_safety must enforce estimated_only and no_sequence_generation',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }

  if (plan.coverage_goal.purpose !== 'future_sequence_generation_preparation') {
    issues.push({
      code: 'COVERAGE_GOAL_INVALID',
      message: 'coverage_goal.purpose must be future_sequence_generation_preparation',
      severity: 'error',
      temporal_flow_id: plan.temporal_flow_id,
    });
  }

  issues.push(...validateFlowCategories(plan));
  issues.push(...validateTemporalCandidates(plan, motionPlan));
  issues.push(...validateExecutionFlags(plan));

  return {
    temporal_flow_id: plan.temporal_flow_id,
    motion_plan_id: plan.motion_plan_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisTemporalFlowReport): string {
  const lines = [
    '# Movie Analysis Temporal Flow Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'motion planning',
    '  ↓',
    'temporal flow candidates',
    '  ↓',
    'future sequence generation preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| temporal_flow_plans | ${report.temporal_flow_plans} |`,
    `| registry | ${report.registry} |`,
    `| motion_links | ${report.motion_links} |`,
    `| source_links | ${report.source_links} |`,
    `| flow_categories | ${report.flow_categories} |`,
    `| candidate_counts_valid | ${report.candidate_counts_valid} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| temporal_flow_only | ${report.temporal_flow_only} |`,
    `| sequence_generation | ${report.sequence_generation} |`,
    `| video_generation | ${report.video_generation} |`,
    `| motion_generation | ${report.motion_generation} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## Flow Categories',
    '',
    '- sequence_flow',
    '- emotion_flow',
    '- camera_flow',
    '- character_flow',
    '- environment_flow',
    '- crowd_flow',
    '- animal_flow',
    '- transition_flow',
    '- continuity_flow',
    '',
    '## Flow Strategies',
    '',
    '- SEQUENCE_FLOW_PLAN',
    '- EMOTION_TIMELINE_PLAN',
    '- CAMERA_CONTINUITY_PLAN',
    '- TRANSITION_CHAIN_PLAN',
    '',
    '## Temporal Flow Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.temporal_flow_id}`);
    lines.push('');
    lines.push(`- motion_plan_id: ${validation.motion_plan_id}`);
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

export function writeMovieAnalysisTemporalFlowReport(
  projectRoot?: string
): MovieAnalysisTemporalFlowReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TemporalFlowValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOTION_PLANNING_REGISTRY_PATH))) {
    issues.push({
      code: 'MOTION_PLANNING_REGISTRY_MISSING',
      message: `Missing ${MOTION_PLANNING_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, TEMPORAL_FLOW_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'TEMPORAL_FLOW_REGISTRY_MISSING',
      message: `Missing ${TEMPORAL_FLOW_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: TemporalFlowValidationResult[] = [];
  const plans: MovieAnalysisTemporalFlowPlan[] = [];

  for (const spec of SEED_TEMPORAL_FLOW_SPECS) {
    const plan = loadMovieAnalysisTemporalFlowPlan(root, spec.temporal_flow_id);
    if (!plan) {
      issues.push({
        code: 'TEMPORAL_FLOW_PLAN_MISSING',
        message: `Missing temporal flow plan: ${spec.temporal_flow_id}`,
        severity: 'error',
        temporal_flow_id: spec.temporal_flow_id,
      });
      planValidations.push({
        temporal_flow_id: spec.temporal_flow_id,
        motion_plan_id: spec.motion_plan_id,
        status: 'FAIL',
        issues: [
          {
            code: 'TEMPORAL_FLOW_PLAN_MISSING',
            message: `Plan file not found in ${TEMPORAL_FLOW_PLANS_DIR}`,
            severity: 'error',
            temporal_flow_id: spec.temporal_flow_id,
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

  const motionLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('MOTION_PLAN') || i.code.startsWith('MOTION_CANDIDATE')
    )
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const flowCategories =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.flow_categories.length === ALL_FLOW_CATEGORIES.length &&
        ALL_FLOW_CATEGORIES.every((c) => p.flow_categories.includes(c))
    )
      ? 'PASS'
      : 'FAIL';

  const candidateCountsValid =
    plans.length === 4 &&
    plans.every(
      (p) => p.temporal_candidates.length === TARGET_TEMPORAL_CANDIDATE_COUNTS[p.source_video_id]
    )
      ? 'PASS'
      : 'FAIL';

  const estimatedOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.temporal_candidates.every(
          (c) =>
            c.candidate_type === 'estimated_temporal_candidate' &&
            c.estimated_only === true &&
            c.generates_sequence === false &&
            c.generates_video === false &&
            c.generates_motion === false
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
    motionLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    flowCategories === 'PASS' &&
    candidateCountsValid === 'PASS' &&
    estimatedOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisTemporalFlowReport = {
    report_id: 'movie-analysis-temporal-flow-report-v1',
    phase: TEMPORAL_FLOW_PHASE,
    timestamp,
    temporal_flow_plans: plans.length,
    registry,
    motion_links: motionLinks,
    source_links: sourceLinks,
    flow_categories: flowCategories,
    candidate_counts_valid: candidateCountsValid,
    estimated_only: estimatedOnly,
    plan_validations: planValidations,
    temporal_flow_only: true,
    sequence_generation: false,
    video_generation: false,
    motion_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass ? TEMPORAL_FLOW_PASS_VERDICT : TEMPORAL_FLOW_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, TEMPORAL_FLOW_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, TEMPORAL_FLOW_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
