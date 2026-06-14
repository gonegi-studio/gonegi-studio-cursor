import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATION_BLUEPRINT_REGISTRY_PATH,
  loadMovieAnalysisGenerationBlueprintPlan,
  type GenerationBlueprintStructureElement,
  type MovieAnalysisGenerationBlueprintPlan,
} from './movieAnalysisGenerationBlueprintDesign.js';
import {
  EXECUTION_READINESS_PHASE,
  EXECUTION_READINESS_REGISTRY_PATH,
  EXECUTION_READINESS_PLANS_DIR,
  SEED_EXECUTION_READINESS_SPECS,
  type ExecutionReadinessElement,
  type MovieAnalysisExecutionReadinessPlan,
  loadMovieAnalysisExecutionReadinessPlan,
} from './movieAnalysisExecutionReadinessDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const EXECUTION_READINESS_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_EXECUTION_READINESS_DESIGN_V1' as const;
export const EXECUTION_READINESS_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_EXECUTION_READINESS_DESIGN_V1' as const;
export const EXECUTION_READINESS_REPORT_PATH =
  'reports/movie-analysis-execution-readiness-report.json' as const;
export const EXECUTION_READINESS_MD_PATH =
  'reports/MOVIE_ANALYSIS_EXECUTION_READINESS_DESIGN.md' as const;

export type ExecutionReadinessValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  execution_readiness_id?: string;
};

export type ExecutionReadinessValidationResult = {
  execution_readiness_id: string;
  generation_blueprint_id: string;
  status: 'PASS' | 'FAIL';
  issues: ExecutionReadinessValidationIssue[];
};

export type MovieAnalysisExecutionReadinessReport = {
  report_id: string;
  phase: typeof EXECUTION_READINESS_PHASE;
  timestamp: string;
  execution_readiness_plans: number;
  registry: 'PASS' | 'FAIL';
  generation_blueprint_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  readiness_sections: 'PASS' | 'FAIL';
  execution_readiness_only: 'PASS' | 'FAIL';
  plan_validations: ExecutionReadinessValidationResult[];
  planning_only: true;
  execution_readiness_only_flag: true;
  estimated_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict:
    | typeof EXECUTION_READINESS_PASS_VERDICT
    | typeof EXECUTION_READINESS_FAIL_VERDICT;
  issues: ExecutionReadinessValidationIssue[];
};

const READINESS_FIELDS = [
  'scene_readiness',
  'character_readiness',
  'camera_readiness',
  'emotion_readiness',
  'transition_readiness',
  'continuity_readiness',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function collectBlueprintElementIds(
  blueprintPlan: MovieAnalysisGenerationBlueprintPlan
): Set<string> {
  const ids = new Set<string>();
  for (const field of [
    'scene_generation_structure',
    'character_generation_structure',
    'camera_generation_structure',
    'emotion_generation_structure',
    'transition_generation_structure',
    'continuity_generation_structure',
    'execution_readiness_structure',
  ] as const) {
    for (const element of blueprintPlan[field]) {
      ids.add(element.element_id);
    }
  }
  return ids;
}

function validateExecutionFlags(
  plan: MovieAnalysisExecutionReadinessPlan
): ExecutionReadinessValidationIssue[] {
  const issues: ExecutionReadinessValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (flags.execution_readiness_only !== true) {
    issues.push({
      code: 'EXECUTION_READINESS_ONLY_FALSE',
      message: 'execution_flags.execution_readiness_only must be true',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (flags.estimated_only !== true) {
    issues.push({
      code: 'ESTIMATED_ONLY_FALSE',
      message: 'execution_flags.estimated_only must be true',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (flags.runtime_execution !== false) {
    issues.push({
      code: 'RUNTIME_EXECUTION_ENABLED',
      message: 'execution_flags.runtime_execution must be false',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (flags.image_generation !== false) {
    issues.push({
      code: 'IMAGE_GENERATION_ENABLED',
      message: 'execution_flags.image_generation must be false',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }

  return issues;
}

function validateRuntimeReadiness(
  plan: MovieAnalysisExecutionReadinessPlan
): ExecutionReadinessValidationIssue[] {
  const issues: ExecutionReadinessValidationIssue[] = [];
  const readiness = plan.runtime_readiness;

  if (readiness.estimated_only !== true) {
    issues.push({
      code: 'RUNTIME_ESTIMATED_ONLY_FALSE',
      message: 'runtime_readiness.estimated_only must be true',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (readiness.execution_readiness_only !== true) {
    issues.push({
      code: 'RUNTIME_EXECUTION_READINESS_ONLY_FALSE',
      message: 'runtime_readiness.execution_readiness_only must be true',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (readiness.runtime_execution !== false) {
    issues.push({
      code: 'RUNTIME_EXECUTION_ENABLED',
      message: 'runtime_readiness.runtime_execution must be false',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (readiness.video_generation !== false) {
    issues.push({
      code: 'RUNTIME_VIDEO_GENERATION',
      message: 'runtime_readiness.video_generation must be false',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (readiness.image_generation !== false) {
    issues.push({
      code: 'RUNTIME_IMAGE_GENERATION',
      message: 'runtime_readiness.image_generation must be false',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (readiness.gpu_ready !== false) {
    issues.push({
      code: 'RUNTIME_GPU_READY',
      message: 'runtime_readiness.gpu_ready must be false',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }
  if (readiness.purpose !== 'future_execution_readiness_preparation') {
    issues.push({
      code: 'RUNTIME_PURPOSE_INVALID',
      message: 'runtime_readiness.purpose must be future_execution_readiness_preparation',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }

  return issues;
}

function validateReadinessSections(
  plan: MovieAnalysisExecutionReadinessPlan,
  blueprintPlan: MovieAnalysisGenerationBlueprintPlan | null
): ExecutionReadinessValidationIssue[] {
  const issues: ExecutionReadinessValidationIssue[] = [];
  const blueprintIds = blueprintPlan ? collectBlueprintElementIds(blueprintPlan) : null;

  for (const field of READINESS_FIELDS) {
    const elements: ExecutionReadinessElement[] = plan[field];
    if (!elements || elements.length === 0) {
      issues.push({
        code: 'READINESS_SECTION_MISSING',
        message: `${field} must be present`,
        severity: 'error',
        execution_readiness_id: plan.execution_readiness_id,
      });
      continue;
    }

    for (const element of elements) {
      if (element.execution_readiness_only !== true) {
        issues.push({
          code: 'NOT_EXECUTION_READINESS_ONLY',
          message: `Element ${element.element_id} must have execution_readiness_only=true`,
          severity: 'error',
          execution_readiness_id: plan.execution_readiness_id,
        });
      }
      if (!element.estimated_readiness_value.startsWith('estimated_readiness_')) {
        issues.push({
          code: 'INVALID_READINESS_VALUE',
          message: `Element ${element.element_id} must have estimated readiness value`,
          severity: 'error',
          execution_readiness_id: plan.execution_readiness_id,
        });
      }
      if (blueprintIds) {
        for (const refId of element.source_blueprint_element_ids) {
          if (!blueprintIds.has(refId)) {
            issues.push({
              code: 'BLUEPRINT_ELEMENT_REF_MISSING',
              message: `Element ${element.element_id} references unknown blueprint element ${refId}`,
              severity: 'error',
              execution_readiness_id: plan.execution_readiness_id,
            });
          }
        }
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisExecutionReadinessPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): ExecutionReadinessValidationResult {
  const issues: ExecutionReadinessValidationIssue[] = [];

  const blueprintPlan = loadMovieAnalysisGenerationBlueprintPlan(
    projectRoot,
    plan.generation_blueprint_id
  );
  if (!blueprintPlan) {
    issues.push({
      code: 'GENERATION_BLUEPRINT_MISSING',
      message: `Generation blueprint plan ${plan.generation_blueprint_id} not found`,
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  } else if (blueprintPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'GENERATION_BLUEPRINT_LINK_MISMATCH',
      message: 'generation_blueprint_id source_video_id does not match plan',
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      execution_readiness_id: plan.execution_readiness_id,
    });
  }

  issues.push(...validateReadinessSections(plan, blueprintPlan));
  issues.push(...validateRuntimeReadiness(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    execution_readiness_id: plan.execution_readiness_id,
    generation_blueprint_id: plan.generation_blueprint_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisExecutionReadinessReport): string {
  const lines = [
    '# Movie Analysis Execution Readiness Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'generation blueprint',
    '  ↓',
    'execution readiness',
    '  ↓',
    'future execution readiness preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| execution_readiness_plans | ${report.execution_readiness_plans} |`,
    `| registry | ${report.registry} |`,
    `| generation_blueprint_links | ${report.generation_blueprint_links} |`,
    `| source_links | ${report.source_links} |`,
    `| readiness_sections | ${report.readiness_sections} |`,
    `| execution_readiness_only | ${report.execution_readiness_only} |`,
    `| planning_only | ${report.planning_only} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| video_generation | ${report.video_generation} |`,
    `| image_generation | ${report.image_generation} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    '',
    '## Execution Readiness Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.execution_readiness_id}`);
    lines.push('');
    lines.push(`- generation_blueprint_id: ${validation.generation_blueprint_id}`);
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

export function writeMovieAnalysisExecutionReadinessReport(
  projectRoot?: string
): MovieAnalysisExecutionReadinessReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ExecutionReadinessValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, GENERATION_BLUEPRINT_REGISTRY_PATH))) {
    issues.push({
      code: 'GENERATION_BLUEPRINT_REGISTRY_MISSING',
      message: `Missing ${GENERATION_BLUEPRINT_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, EXECUTION_READINESS_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'EXECUTION_READINESS_REGISTRY_MISSING',
      message: `Missing ${EXECUTION_READINESS_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: ExecutionReadinessValidationResult[] = [];
  const plans: MovieAnalysisExecutionReadinessPlan[] = [];

  for (const spec of SEED_EXECUTION_READINESS_SPECS) {
    const plan = loadMovieAnalysisExecutionReadinessPlan(root, spec.execution_readiness_id);
    if (!plan) {
      issues.push({
        code: 'EXECUTION_READINESS_PLAN_MISSING',
        message: `Missing execution readiness plan: ${spec.execution_readiness_id}`,
        severity: 'error',
        execution_readiness_id: spec.execution_readiness_id,
      });
      planValidations.push({
        execution_readiness_id: spec.execution_readiness_id,
        generation_blueprint_id: spec.generation_blueprint_id,
        status: 'FAIL',
        issues: [
          {
            code: 'EXECUTION_READINESS_PLAN_MISSING',
            message: `Plan file not found in ${EXECUTION_READINESS_PLANS_DIR}`,
            severity: 'error',
            execution_readiness_id: spec.execution_readiness_id,
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

  const generationBlueprintLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('GENERATION_BLUEPRINT') || i.code.startsWith('BLUEPRINT_ELEMENT')
    )
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const readinessSections =
    plans.length === 4 &&
    plans.every((p) => READINESS_FIELDS.every((f) => p[f].length > 0))
      ? 'PASS'
      : 'FAIL';

  const executionReadinessOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        READINESS_FIELDS.every((f) => p[f].every((e) => e.execution_readiness_only === true)) &&
        p.runtime_readiness.estimated_only === true &&
        p.runtime_readiness.execution_readiness_only === true &&
        p.runtime_readiness.runtime_execution === false &&
        p.runtime_readiness.video_generation === false &&
        p.runtime_readiness.image_generation === false &&
        p.execution_flags.execution_readiness_only === true &&
        p.execution_flags.estimated_only === true
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
    generationBlueprintLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    readinessSections === 'PASS' &&
    executionReadinessOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisExecutionReadinessReport = {
    report_id: 'movie-analysis-execution-readiness-report-v1',
    phase: EXECUTION_READINESS_PHASE,
    timestamp,
    execution_readiness_plans: plans.length,
    registry,
    generation_blueprint_links: generationBlueprintLinks,
    source_links: sourceLinks,
    readiness_sections: readinessSections,
    execution_readiness_only: executionReadinessOnly,
    plan_validations: planValidations,
    planning_only: true,
    execution_readiness_only_flag: true,
    estimated_only: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? EXECUTION_READINESS_PASS_VERDICT : EXECUTION_READINESS_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, EXECUTION_READINESS_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, EXECUTION_READINESS_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
