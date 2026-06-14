import fs from 'node:fs';
import path from 'node:path';
import {
  TEMPORAL_FLOW_REGISTRY_PATH,
  loadMovieAnalysisTemporalFlowPlan,
  type MovieAnalysisTemporalFlowPlan,
} from './movieAnalysisTemporalFlowDesign.js';
import {
  SEQUENCE_ASSEMBLY_PHASE,
  SEQUENCE_ASSEMBLY_REGISTRY_PATH,
  SEQUENCE_ASSEMBLY_PLANS_DIR,
  ALL_SEQUENCE_CATEGORIES,
  SEED_SEQUENCE_ASSEMBLY_SPECS,
  TARGET_SEQUENCE_CANDIDATE_COUNTS,
  type MovieAnalysisSequenceAssemblyPlan,
  loadMovieAnalysisSequenceAssemblyPlan,
} from './movieAnalysisSequenceAssemblyDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SEQUENCE_ASSEMBLY_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_SEQUENCE_ASSEMBLY_DESIGN_V1' as const;
export const SEQUENCE_ASSEMBLY_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_SEQUENCE_ASSEMBLY_DESIGN_V1' as const;
export const SEQUENCE_ASSEMBLY_REPORT_PATH =
  'reports/movie-analysis-sequence-assembly-report.json' as const;
export const SEQUENCE_ASSEMBLY_MD_PATH =
  'reports/MOVIE_ANALYSIS_SEQUENCE_ASSEMBLY_DESIGN.md' as const;

export type SequenceAssemblyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  sequence_assembly_id?: string;
};

export type SequenceAssemblyValidationResult = {
  sequence_assembly_id: string;
  temporal_flow_id: string;
  status: 'PASS' | 'FAIL';
  issues: SequenceAssemblyValidationIssue[];
};

export type MovieAnalysisSequenceAssemblyReport = {
  report_id: string;
  phase: typeof SEQUENCE_ASSEMBLY_PHASE;
  timestamp: string;
  sequence_assembly_plans: number;
  registry: 'PASS' | 'FAIL';
  temporal_flow_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  sequence_categories: 'PASS' | 'FAIL';
  candidate_counts_valid: 'PASS' | 'FAIL';
  estimated_only: 'PASS' | 'FAIL';
  plan_validations: SequenceAssemblyValidationResult[];
  sequence_assembly_only: true;
  sequence_generation: false;
  video_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  planning_only: true;
  final_verdict:
    | typeof SEQUENCE_ASSEMBLY_PASS_VERDICT
    | typeof SEQUENCE_ASSEMBLY_FAIL_VERDICT;
  issues: SequenceAssemblyValidationIssue[];
};

const FORBIDDEN_SEQUENCE_KEYS = [
  'sequence_output',
  'generated_sequence',
  'video_path',
  'generated_video',
  'runtime_payload',
  'asset_path',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisSequenceAssemblyPlan
): SequenceAssemblyValidationIssue[] {
  const issues: SequenceAssemblyValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }
  if (flags.sequence_assembly_only !== true) {
    issues.push({
      code: 'SEQUENCE_ASSEMBLY_ONLY_FALSE',
      message: 'execution_flags.sequence_assembly_only must be true',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }
  if (flags.sequence_generation !== false) {
    issues.push({
      code: 'SEQUENCE_GENERATION_ENABLED',
      message: 'execution_flags.sequence_generation must be false',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }

  return issues;
}

function validateSequenceCategories(
  plan: MovieAnalysisSequenceAssemblyPlan
): SequenceAssemblyValidationIssue[] {
  const issues: SequenceAssemblyValidationIssue[] = [];

  if (!plan.sequence_categories || plan.sequence_categories.length === 0) {
    issues.push({
      code: 'SEQUENCE_CATEGORIES_MISSING',
      message: 'sequence_categories must be present',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
    return issues;
  }

  for (const expected of ALL_SEQUENCE_CATEGORIES) {
    if (!plan.sequence_categories.includes(expected)) {
      issues.push({
        code: 'SEQUENCE_CATEGORY_MISSING',
        message: `sequence_categories must include ${expected}`,
        severity: 'error',
        sequence_assembly_id: plan.sequence_assembly_id,
      });
    }
  }

  if (plan.sequence_categories.length !== ALL_SEQUENCE_CATEGORIES.length) {
    issues.push({
      code: 'SEQUENCE_CATEGORIES_COUNT_MISMATCH',
      message: `sequence_categories must contain exactly ${ALL_SEQUENCE_CATEGORIES.length} categories`,
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }

  return issues;
}

function validateSequenceCandidates(
  plan: MovieAnalysisSequenceAssemblyPlan,
  temporalPlan: MovieAnalysisTemporalFlowPlan | null
): SequenceAssemblyValidationIssue[] {
  const issues: SequenceAssemblyValidationIssue[] = [];

  if (!plan.sequence_candidates || plan.sequence_candidates.length === 0) {
    issues.push({
      code: 'SEQUENCE_CANDIDATES_MISSING',
      message: 'sequence_candidates must be present',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
    return issues;
  }

  for (const candidate of plan.sequence_candidates) {
    if (candidate.generates_sequence !== false) {
      issues.push({
        code: 'SEQUENCE_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.sequence_candidate_id} must not generate sequences`,
        severity: 'error',
        sequence_assembly_id: plan.sequence_assembly_id,
      });
    }
    if (candidate.generates_video !== false) {
      issues.push({
        code: 'VIDEO_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.sequence_candidate_id} must not generate video`,
        severity: 'error',
        sequence_assembly_id: plan.sequence_assembly_id,
      });
    }
    if (candidate.candidate_type !== 'estimated_sequence_candidate') {
      issues.push({
        code: 'INVALID_SEQUENCE_CANDIDATE_TYPE',
        message: `Candidate ${candidate.sequence_candidate_id} must be estimated_sequence_candidate only`,
        severity: 'error',
        sequence_assembly_id: plan.sequence_assembly_id,
      });
    }
    if (candidate.estimated_only !== true) {
      issues.push({
        code: 'ESTIMATED_ONLY_FALSE',
        message: `Candidate ${candidate.sequence_candidate_id} must have estimated_only=true`,
        severity: 'error',
        sequence_assembly_id: plan.sequence_assembly_id,
      });
    }
    if (!ALL_SEQUENCE_CATEGORIES.includes(candidate.sequence_category)) {
      issues.push({
        code: 'INVALID_SEQUENCE_CATEGORY',
        message: `Candidate ${candidate.sequence_candidate_id} has invalid sequence_category`,
        severity: 'error',
        sequence_assembly_id: plan.sequence_assembly_id,
      });
    }
    if (
      !candidate.estimated_sequence_value ||
      !candidate.estimated_sequence_value.startsWith('estimated_sequence_')
    ) {
      issues.push({
        code: 'INVALID_ESTIMATED_SEQUENCE_VALUE',
        message: `Candidate ${candidate.sequence_candidate_id} must have estimated sequence placeholder value`,
        severity: 'error',
        sequence_assembly_id: plan.sequence_assembly_id,
      });
    }

    if (temporalPlan) {
      const temporalRef = temporalPlan.temporal_candidates.find(
        (t) => t.temporal_candidate_id === candidate.temporal_candidate_id
      );
      if (!temporalRef) {
        issues.push({
          code: 'TEMPORAL_CANDIDATE_REF_MISSING',
          message: `Candidate ${candidate.sequence_candidate_id} references unknown temporal_candidate_id`,
          severity: 'error',
          sequence_assembly_id: plan.sequence_assembly_id,
        });
      }
    }

    for (const key of FORBIDDEN_SEQUENCE_KEYS) {
      if (key in (candidate as Record<string, unknown>)) {
        issues.push({
          code: 'FORBIDDEN_SEQUENCE_FIELD',
          message: `Candidate ${candidate.sequence_candidate_id} must not contain ${key}`,
          severity: 'error',
          sequence_assembly_id: plan.sequence_assembly_id,
        });
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisSequenceAssemblyPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): SequenceAssemblyValidationResult {
  const issues: SequenceAssemblyValidationIssue[] = [];

  const temporalPlan = loadMovieAnalysisTemporalFlowPlan(projectRoot, plan.temporal_flow_id);
  if (!temporalPlan) {
    issues.push({
      code: 'TEMPORAL_FLOW_MISSING',
      message: `Temporal flow plan ${plan.temporal_flow_id} not found`,
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  } else if (temporalPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'TEMPORAL_FLOW_LINK_MISMATCH',
      message: 'temporal_flow_id source_video_id does not match plan',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }

  const expectedCount = TARGET_SEQUENCE_CANDIDATE_COUNTS[plan.source_video_id];
  if (plan.sequence_candidate_count !== expectedCount) {
    issues.push({
      code: 'CANDIDATE_COUNT_MISMATCH',
      message: `sequence_candidate_count expected ${expectedCount}, got ${plan.sequence_candidate_count}`,
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }
  if (plan.sequence_candidates.length !== expectedCount) {
    issues.push({
      code: 'SEQUENCE_CANDIDATE_LENGTH_MISMATCH',
      message: `sequence_candidates length expected ${expectedCount}, got ${plan.sequence_candidates.length}`,
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }

  if (!plan.identity_safety.estimated_only || !plan.identity_safety.no_sequence_generation) {
    issues.push({
      code: 'IDENTITY_SAFETY_INVALID',
      message: 'identity_safety must enforce estimated_only and no_sequence_generation',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }

  if (plan.coverage_goal.purpose !== 'future_video_sequence_preparation') {
    issues.push({
      code: 'COVERAGE_GOAL_INVALID',
      message: 'coverage_goal.purpose must be future_video_sequence_preparation',
      severity: 'error',
      sequence_assembly_id: plan.sequence_assembly_id,
    });
  }

  issues.push(...validateSequenceCategories(plan));
  issues.push(...validateSequenceCandidates(plan, temporalPlan));
  issues.push(...validateExecutionFlags(plan));

  return {
    sequence_assembly_id: plan.sequence_assembly_id,
    temporal_flow_id: plan.temporal_flow_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisSequenceAssemblyReport): string {
  const lines = [
    '# Movie Analysis Sequence Assembly Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'temporal flow',
    '  ↓',
    'sequence candidates',
    '  ↓',
    'future video sequence preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| sequence_assembly_plans | ${report.sequence_assembly_plans} |`,
    `| registry | ${report.registry} |`,
    `| temporal_flow_links | ${report.temporal_flow_links} |`,
    `| source_links | ${report.source_links} |`,
    `| sequence_categories | ${report.sequence_categories} |`,
    `| candidate_counts_valid | ${report.candidate_counts_valid} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| sequence_assembly_only | ${report.sequence_assembly_only} |`,
    `| sequence_generation | ${report.sequence_generation} |`,
    `| video_generation | ${report.video_generation} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## Sequence Categories',
    '',
    '- sequence_chain',
    '- continuity_chain',
    '- emotion_chain',
    '- camera_chain',
    '- environment_chain',
    '- character_chain',
    '- crowd_chain',
    '- transition_chain',
    '- timing_chain',
    '',
    '## Assembly Strategies',
    '',
    '- SEQUENCE_CHAIN_PLAN',
    '- CONTINUITY_ASSEMBLY_PLAN',
    '- EMOTION_SEQUENCE_PLAN',
    '- TRANSITION_SEQUENCE_PLAN',
    '',
    '## Sequence Assembly Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.sequence_assembly_id}`);
    lines.push('');
    lines.push(`- temporal_flow_id: ${validation.temporal_flow_id}`);
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

export function writeMovieAnalysisSequenceAssemblyReport(
  projectRoot?: string
): MovieAnalysisSequenceAssemblyReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SequenceAssemblyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, TEMPORAL_FLOW_REGISTRY_PATH))) {
    issues.push({
      code: 'TEMPORAL_FLOW_REGISTRY_MISSING',
      message: `Missing ${TEMPORAL_FLOW_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, SEQUENCE_ASSEMBLY_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'SEQUENCE_ASSEMBLY_REGISTRY_MISSING',
      message: `Missing ${SEQUENCE_ASSEMBLY_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: SequenceAssemblyValidationResult[] = [];
  const plans: MovieAnalysisSequenceAssemblyPlan[] = [];

  for (const spec of SEED_SEQUENCE_ASSEMBLY_SPECS) {
    const plan = loadMovieAnalysisSequenceAssemblyPlan(root, spec.sequence_assembly_id);
    if (!plan) {
      issues.push({
        code: 'SEQUENCE_ASSEMBLY_PLAN_MISSING',
        message: `Missing sequence assembly plan: ${spec.sequence_assembly_id}`,
        severity: 'error',
        sequence_assembly_id: spec.sequence_assembly_id,
      });
      planValidations.push({
        sequence_assembly_id: spec.sequence_assembly_id,
        temporal_flow_id: spec.temporal_flow_id,
        status: 'FAIL',
        issues: [
          {
            code: 'SEQUENCE_ASSEMBLY_PLAN_MISSING',
            message: `Plan file not found in ${SEQUENCE_ASSEMBLY_PLANS_DIR}`,
            severity: 'error',
            sequence_assembly_id: spec.sequence_assembly_id,
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

  const temporalFlowLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('TEMPORAL_FLOW') || i.code.startsWith('TEMPORAL_CANDIDATE')
    )
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const sequenceCategories =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.sequence_categories.length === ALL_SEQUENCE_CATEGORIES.length &&
        ALL_SEQUENCE_CATEGORIES.every((c) => p.sequence_categories.includes(c))
    )
      ? 'PASS'
      : 'FAIL';

  const candidateCountsValid =
    plans.length === 4 &&
    plans.every(
      (p) => p.sequence_candidates.length === TARGET_SEQUENCE_CANDIDATE_COUNTS[p.source_video_id]
    )
      ? 'PASS'
      : 'FAIL';

  const estimatedOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.sequence_candidates.every(
          (c) =>
            c.candidate_type === 'estimated_sequence_candidate' &&
            c.estimated_only === true &&
            c.generates_sequence === false &&
            c.generates_video === false
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
    temporalFlowLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    sequenceCategories === 'PASS' &&
    candidateCountsValid === 'PASS' &&
    estimatedOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisSequenceAssemblyReport = {
    report_id: 'movie-analysis-sequence-assembly-report-v1',
    phase: SEQUENCE_ASSEMBLY_PHASE,
    timestamp,
    sequence_assembly_plans: plans.length,
    registry,
    temporal_flow_links: temporalFlowLinks,
    source_links: sourceLinks,
    sequence_categories: sequenceCategories,
    candidate_counts_valid: candidateCountsValid,
    estimated_only: estimatedOnly,
    plan_validations: planValidations,
    sequence_assembly_only: true,
    sequence_generation: false,
    video_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass ? SEQUENCE_ASSEMBLY_PASS_VERDICT : SEQUENCE_ASSEMBLY_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, SEQUENCE_ASSEMBLY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SEQUENCE_ASSEMBLY_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
