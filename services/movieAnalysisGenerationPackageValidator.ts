import fs from 'node:fs';
import path from 'node:path';
import {
  RUNTIME_PACKAGE_REGISTRY_PATH,
  loadMovieAnalysisRuntimePackagePlan,
  type MovieAnalysisRuntimePackagePlan,
  type RuntimePackageElement,
} from './movieAnalysisRuntimePackageDesign.js';
import {
  GENERATION_PACKAGE_PHASE,
  GENERATION_PACKAGE_REGISTRY_PATH,
  GENERATION_PACKAGE_PLANS_DIR,
  SEED_GENERATION_PACKAGE_SPECS,
  type GenerationPackageElement,
  type MovieAnalysisGenerationPackagePlan,
  loadMovieAnalysisGenerationPackagePlan,
} from './movieAnalysisGenerationPackageDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GENERATION_PACKAGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_GENERATION_PACKAGE_DESIGN_V1' as const;
export const GENERATION_PACKAGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_GENERATION_PACKAGE_DESIGN_V1' as const;
export const GENERATION_PACKAGE_REPORT_PATH =
  'reports/movie-analysis-generation-package-report.json' as const;
export const GENERATION_PACKAGE_MD_PATH =
  'reports/MOVIE_ANALYSIS_GENERATION_PACKAGE_DESIGN.md' as const;

export type GenerationPackageValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  generation_package_id?: string;
};

export type GenerationPackageValidationResult = {
  generation_package_id: string;
  runtime_package_id: string;
  status: 'PASS' | 'FAIL';
  issues: GenerationPackageValidationIssue[];
};

export type MovieAnalysisGenerationPackageReport = {
  report_id: string;
  phase: typeof GENERATION_PACKAGE_PHASE;
  timestamp: string;
  generation_package_plans: number;
  registry: 'PASS' | 'FAIL';
  runtime_package_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  package_sections: 'PASS' | 'FAIL';
  generation_package_only: 'PASS' | 'FAIL';
  plan_validations: GenerationPackageValidationResult[];
  planning_only: true;
  generation_package_only_flag: true;
  estimated_only: true;
  video_generation: false;
  image_generation: false;
  runtime_execution: false;
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict:
    | typeof GENERATION_PACKAGE_PASS_VERDICT
    | typeof GENERATION_PACKAGE_FAIL_VERDICT;
  issues: GenerationPackageValidationIssue[];
};

const PACKAGE_FIELDS = [
  'scene_generation_package',
  'character_generation_package',
  'camera_generation_package',
  'emotion_generation_package',
  'transition_generation_package',
  'continuity_generation_package',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function collectRuntimeElementIds(runtimePlan: MovieAnalysisRuntimePackagePlan): Set<string> {
  const ids = new Set<string>();
  for (const field of [
    'scene_package',
    'character_package',
    'camera_package',
    'emotion_package',
    'transition_package',
  ] as const) {
    for (const element of runtimePlan[field]) {
      ids.add(element.element_id);
    }
  }
  return ids;
}

function validateExecutionFlags(
  plan: MovieAnalysisGenerationPackagePlan
): GenerationPackageValidationIssue[] {
  const issues: GenerationPackageValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (flags.generation_package_only !== true) {
    issues.push({
      code: 'GENERATION_PACKAGE_ONLY_FALSE',
      message: 'execution_flags.generation_package_only must be true',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (flags.estimated_only !== true) {
    issues.push({
      code: 'ESTIMATED_ONLY_FALSE',
      message: 'execution_flags.estimated_only must be true',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (flags.image_generation !== false) {
    issues.push({
      code: 'IMAGE_GENERATION_ENABLED',
      message: 'execution_flags.image_generation must be false',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (flags.runtime_execution !== false) {
    issues.push({
      code: 'RUNTIME_EXECUTION_ENABLED',
      message: 'execution_flags.runtime_execution must be false',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }

  return issues;
}

function validateRuntimeReadiness(
  plan: MovieAnalysisGenerationPackagePlan
): GenerationPackageValidationIssue[] {
  const issues: GenerationPackageValidationIssue[] = [];
  const readiness = plan.runtime_readiness;

  if (readiness.estimated_only !== true) {
    issues.push({
      code: 'RUNTIME_ESTIMATED_ONLY_FALSE',
      message: 'runtime_readiness.estimated_only must be true',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (readiness.generation_package_only !== true) {
    issues.push({
      code: 'RUNTIME_GENERATION_PACKAGE_ONLY_FALSE',
      message: 'runtime_readiness.generation_package_only must be true',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (readiness.video_generation !== false) {
    issues.push({
      code: 'RUNTIME_VIDEO_GENERATION',
      message: 'runtime_readiness.video_generation must be false',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (readiness.image_generation !== false) {
    issues.push({
      code: 'RUNTIME_IMAGE_GENERATION',
      message: 'runtime_readiness.image_generation must be false',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (readiness.runtime_execution !== false) {
    issues.push({
      code: 'RUNTIME_EXECUTION_ENABLED',
      message: 'runtime_readiness.runtime_execution must be false',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (readiness.gpu_ready !== false) {
    issues.push({
      code: 'RUNTIME_GPU_READY',
      message: 'runtime_readiness.gpu_ready must be false',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }
  if (readiness.purpose !== 'future_video_generation_preparation') {
    issues.push({
      code: 'RUNTIME_PURPOSE_INVALID',
      message: 'runtime_readiness.purpose must be future_video_generation_preparation',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }

  return issues;
}

function validatePackageElements(
  plan: MovieAnalysisGenerationPackagePlan,
  runtimePlan: MovieAnalysisRuntimePackagePlan | null
): GenerationPackageValidationIssue[] {
  const issues: GenerationPackageValidationIssue[] = [];
  const runtimeIds = runtimePlan ? collectRuntimeElementIds(runtimePlan) : null;

  for (const field of PACKAGE_FIELDS) {
    const elements: GenerationPackageElement[] = plan[field];
    if (!elements || elements.length === 0) {
      issues.push({
        code: 'PACKAGE_SECTION_MISSING',
        message: `${field} must be present`,
        severity: 'error',
        generation_package_id: plan.generation_package_id,
      });
      continue;
    }

    for (const element of elements) {
      if (element.generation_package_only !== true) {
        issues.push({
          code: 'NOT_GENERATION_PACKAGE_ONLY',
          message: `Element ${element.element_id} must have generation_package_only=true`,
          severity: 'error',
          generation_package_id: plan.generation_package_id,
        });
      }
      if (!element.estimated_generation_value.startsWith('estimated_generation_')) {
        issues.push({
          code: 'INVALID_GENERATION_VALUE',
          message: `Element ${element.element_id} must have estimated generation value`,
          severity: 'error',
          generation_package_id: plan.generation_package_id,
        });
      }
      if (runtimeIds) {
        for (const refId of element.source_runtime_element_ids) {
          if (!runtimeIds.has(refId)) {
            issues.push({
              code: 'RUNTIME_ELEMENT_REF_MISSING',
              message: `Element ${element.element_id} references unknown runtime element ${refId}`,
              severity: 'error',
              generation_package_id: plan.generation_package_id,
            });
          }
        }
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisGenerationPackagePlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): GenerationPackageValidationResult {
  const issues: GenerationPackageValidationIssue[] = [];

  const runtimePlan = loadMovieAnalysisRuntimePackagePlan(projectRoot, plan.runtime_package_id);
  if (!runtimePlan) {
    issues.push({
      code: 'RUNTIME_PACKAGE_MISSING',
      message: `Runtime package plan ${plan.runtime_package_id} not found`,
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  } else if (runtimePlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'RUNTIME_PACKAGE_LINK_MISMATCH',
      message: 'runtime_package_id source_video_id does not match plan',
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      generation_package_id: plan.generation_package_id,
    });
  }

  issues.push(...validatePackageElements(plan, runtimePlan));
  issues.push(...validateRuntimeReadiness(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    generation_package_id: plan.generation_package_id,
    runtime_package_id: plan.runtime_package_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisGenerationPackageReport): string {
  const lines = [
    '# Movie Analysis Generation Package Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'runtime package',
    '  ↓',
    'generation package',
    '  ↓',
    'future video generation preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| generation_package_plans | ${report.generation_package_plans} |`,
    `| registry | ${report.registry} |`,
    `| runtime_package_links | ${report.runtime_package_links} |`,
    `| source_links | ${report.source_links} |`,
    `| package_sections | ${report.package_sections} |`,
    `| generation_package_only | ${report.generation_package_only} |`,
    `| planning_only | ${report.planning_only} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| video_generation | ${report.video_generation} |`,
    `| image_generation | ${report.image_generation} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    '',
    '## Generation Package Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.generation_package_id}`);
    lines.push('');
    lines.push(`- runtime_package_id: ${validation.runtime_package_id}`);
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

export function writeMovieAnalysisGenerationPackageReport(
  projectRoot?: string
): MovieAnalysisGenerationPackageReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GenerationPackageValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, RUNTIME_PACKAGE_REGISTRY_PATH))) {
    issues.push({
      code: 'RUNTIME_PACKAGE_REGISTRY_MISSING',
      message: `Missing ${RUNTIME_PACKAGE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, GENERATION_PACKAGE_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'GENERATION_PACKAGE_REGISTRY_MISSING',
      message: `Missing ${GENERATION_PACKAGE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: GenerationPackageValidationResult[] = [];
  const plans: MovieAnalysisGenerationPackagePlan[] = [];

  for (const spec of SEED_GENERATION_PACKAGE_SPECS) {
    const plan = loadMovieAnalysisGenerationPackagePlan(root, spec.generation_package_id);
    if (!plan) {
      issues.push({
        code: 'GENERATION_PACKAGE_PLAN_MISSING',
        message: `Missing generation package plan: ${spec.generation_package_id}`,
        severity: 'error',
        generation_package_id: spec.generation_package_id,
      });
      planValidations.push({
        generation_package_id: spec.generation_package_id,
        runtime_package_id: spec.runtime_package_id,
        status: 'FAIL',
        issues: [
          {
            code: 'GENERATION_PACKAGE_PLAN_MISSING',
            message: `Plan file not found in ${GENERATION_PACKAGE_PLANS_DIR}`,
            severity: 'error',
            generation_package_id: spec.generation_package_id,
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

  const runtimePackageLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('RUNTIME_PACKAGE') || i.code.startsWith('RUNTIME_ELEMENT')
    )
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const packageSections =
    plans.length === 4 &&
    plans.every((p) => PACKAGE_FIELDS.every((f) => p[f].length > 0))
      ? 'PASS'
      : 'FAIL';

  const generationPackageOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        PACKAGE_FIELDS.every((f) => p[f].every((e) => e.generation_package_only === true)) &&
        p.runtime_readiness.estimated_only === true &&
        p.runtime_readiness.generation_package_only === true &&
        p.runtime_readiness.video_generation === false &&
        p.runtime_readiness.image_generation === false &&
        p.runtime_readiness.runtime_execution === false &&
        p.execution_flags.generation_package_only === true &&
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
    runtimePackageLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    packageSections === 'PASS' &&
    generationPackageOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisGenerationPackageReport = {
    report_id: 'movie-analysis-generation-package-report-v1',
    phase: GENERATION_PACKAGE_PHASE,
    timestamp,
    generation_package_plans: plans.length,
    registry,
    runtime_package_links: runtimePackageLinks,
    source_links: sourceLinks,
    package_sections: packageSections,
    generation_package_only: generationPackageOnly,
    plan_validations: planValidations,
    planning_only: true,
    generation_package_only_flag: true,
    estimated_only: true,
    video_generation: false,
    image_generation: false,
    runtime_execution: false,
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? GENERATION_PACKAGE_PASS_VERDICT : GENERATION_PACKAGE_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, GENERATION_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, GENERATION_PACKAGE_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
