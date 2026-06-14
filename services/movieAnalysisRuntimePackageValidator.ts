import fs from 'node:fs';
import path from 'node:path';
import {
  VIDEO_BLUEPRINT_REGISTRY_PATH,
  loadMovieAnalysisVideoBlueprintPlan,
  type MovieAnalysisVideoBlueprintPlan,
} from './movieAnalysisVideoBlueprintDesign.js';
import {
  RUNTIME_PACKAGE_PHASE,
  RUNTIME_PACKAGE_REGISTRY_PATH,
  RUNTIME_PACKAGE_PLANS_DIR,
  SEED_RUNTIME_PACKAGE_SPECS,
  type MovieAnalysisRuntimePackagePlan,
  type RuntimePackageElement,
  loadMovieAnalysisRuntimePackagePlan,
} from './movieAnalysisRuntimePackageDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RUNTIME_PACKAGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_RUNTIME_PACKAGE_DESIGN_V1' as const;
export const RUNTIME_PACKAGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_RUNTIME_PACKAGE_DESIGN_V1' as const;
export const RUNTIME_PACKAGE_REPORT_PATH =
  'reports/movie-analysis-runtime-package-report.json' as const;
export const RUNTIME_PACKAGE_MD_PATH =
  'reports/MOVIE_ANALYSIS_RUNTIME_PACKAGE_DESIGN.md' as const;

export type RuntimePackageValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  runtime_package_id?: string;
};

export type RuntimePackageValidationResult = {
  runtime_package_id: string;
  video_blueprint_id: string;
  status: 'PASS' | 'FAIL';
  issues: RuntimePackageValidationIssue[];
};

export type MovieAnalysisRuntimePackageReport = {
  report_id: string;
  phase: typeof RUNTIME_PACKAGE_PHASE;
  timestamp: string;
  runtime_package_plans: number;
  registry: 'PASS' | 'FAIL';
  video_blueprint_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  package_sections: 'PASS' | 'FAIL';
  package_only: 'PASS' | 'FAIL';
  plan_validations: RuntimePackageValidationResult[];
  planning_only: true;
  runtime_execution: false;
  video_generation: false;
  gpu_execution: false;
  ocr: false;
  external_call_allowed: false;
  final_verdict:
    | typeof RUNTIME_PACKAGE_PASS_VERDICT
    | typeof RUNTIME_PACKAGE_FAIL_VERDICT;
  issues: RuntimePackageValidationIssue[];
};

const PACKAGE_FIELDS = [
  'scene_package',
  'character_package',
  'camera_package',
  'emotion_package',
  'transition_package',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function collectBlueprintElementIds(blueprintPlan: MovieAnalysisVideoBlueprintPlan): Set<string> {
  const ids = new Set<string>();
  for (const block of blueprintPlan.sequence_blocks) {
    ids.add(block.block_id);
  }
  for (const field of [
    'continuity_structure',
    'emotion_structure',
    'camera_structure',
    'transition_structure',
  ] as const) {
    for (const element of blueprintPlan[field]) {
      ids.add(element.element_id);
    }
  }
  return ids;
}

function validateExecutionFlags(
  plan: MovieAnalysisRuntimePackagePlan
): RuntimePackageValidationIssue[] {
  const issues: RuntimePackageValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }
  if (flags.runtime_execution !== false) {
    issues.push({
      code: 'RUNTIME_EXECUTION_ENABLED',
      message: 'execution_flags.runtime_execution must be false',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }

  return issues;
}

function validateRuntimeReadiness(
  plan: MovieAnalysisRuntimePackagePlan
): RuntimePackageValidationIssue[] {
  const issues: RuntimePackageValidationIssue[] = [];
  const readiness = plan.runtime_readiness;

  if (readiness.estimated_only !== true) {
    issues.push({
      code: 'RUNTIME_ESTIMATED_ONLY_FALSE',
      message: 'runtime_readiness.estimated_only must be true',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }
  if (readiness.runtime_execution !== false) {
    issues.push({
      code: 'RUNTIME_READINESS_EXECUTION',
      message: 'runtime_readiness.runtime_execution must be false',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }
  if (readiness.generates_video !== false) {
    issues.push({
      code: 'RUNTIME_VIDEO_GENERATION',
      message: 'runtime_readiness.generates_video must be false',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }
  if (readiness.gpu_ready !== false) {
    issues.push({
      code: 'RUNTIME_GPU_READY',
      message: 'runtime_readiness.gpu_ready must be false',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }
  if (readiness.purpose !== 'future_runtime_package_preparation') {
    issues.push({
      code: 'RUNTIME_PURPOSE_INVALID',
      message: 'runtime_readiness.purpose must be future_runtime_package_preparation',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }

  return issues;
}

function validatePackageElements(
  plan: MovieAnalysisRuntimePackagePlan,
  blueprintPlan: MovieAnalysisVideoBlueprintPlan | null
): RuntimePackageValidationIssue[] {
  const issues: RuntimePackageValidationIssue[] = [];
  const blueprintIds = blueprintPlan ? collectBlueprintElementIds(blueprintPlan) : null;

  for (const field of PACKAGE_FIELDS) {
    const elements: RuntimePackageElement[] = plan[field];
    if (!elements || elements.length === 0) {
      issues.push({
        code: 'PACKAGE_SECTION_MISSING',
        message: `${field} must be present`,
        severity: 'error',
        runtime_package_id: plan.runtime_package_id,
      });
      continue;
    }

    for (const element of elements) {
      if (element.package_only !== true) {
        issues.push({
          code: 'PACKAGE_NOT_PACKAGE_ONLY',
          message: `Element ${element.element_id} must have package_only=true`,
          severity: 'error',
          runtime_package_id: plan.runtime_package_id,
        });
      }
      if (!element.estimated_runtime_value.startsWith('estimated_runtime_')) {
        issues.push({
          code: 'INVALID_RUNTIME_VALUE',
          message: `Element ${element.element_id} must have estimated runtime value`,
          severity: 'error',
          runtime_package_id: plan.runtime_package_id,
        });
      }
      if (blueprintIds) {
        for (const refId of element.source_blueprint_element_ids) {
          if (!blueprintIds.has(refId)) {
            issues.push({
              code: 'BLUEPRINT_ELEMENT_REF_MISSING',
              message: `Element ${element.element_id} references unknown blueprint element ${refId}`,
              severity: 'error',
              runtime_package_id: plan.runtime_package_id,
            });
          }
        }
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisRuntimePackagePlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): RuntimePackageValidationResult {
  const issues: RuntimePackageValidationIssue[] = [];

  const blueprintPlan = loadMovieAnalysisVideoBlueprintPlan(projectRoot, plan.video_blueprint_id);
  if (!blueprintPlan) {
    issues.push({
      code: 'VIDEO_BLUEPRINT_MISSING',
      message: `Video blueprint plan ${plan.video_blueprint_id} not found`,
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  } else if (blueprintPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'VIDEO_BLUEPRINT_LINK_MISMATCH',
      message: 'video_blueprint_id source_video_id does not match plan',
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }

  if (blueprintPlan && plan.scene_package.length < blueprintPlan.scene_count + 1) {
    issues.push({
      code: 'SCENE_PACKAGE_COUNT_MISMATCH',
      message: `scene_package expected at least ${blueprintPlan.scene_count + 1} elements`,
      severity: 'error',
      runtime_package_id: plan.runtime_package_id,
    });
  }

  issues.push(...validatePackageElements(plan, blueprintPlan));
  issues.push(...validateRuntimeReadiness(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    runtime_package_id: plan.runtime_package_id,
    video_blueprint_id: plan.video_blueprint_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisRuntimePackageReport): string {
  const lines = [
    '# Movie Analysis Runtime Package Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'video blueprint',
    '  ↓',
    'runtime package',
    '  ↓',
    'future runtime package preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| runtime_package_plans | ${report.runtime_package_plans} |`,
    `| registry | ${report.registry} |`,
    `| video_blueprint_links | ${report.video_blueprint_links} |`,
    `| source_links | ${report.source_links} |`,
    `| package_sections | ${report.package_sections} |`,
    `| package_only | ${report.package_only} |`,
    `| planning_only | ${report.planning_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| video_generation | ${report.video_generation} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| ocr | ${report.ocr} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    '',
    '## Runtime Package Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.runtime_package_id}`);
    lines.push('');
    lines.push(`- video_blueprint_id: ${validation.video_blueprint_id}`);
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

export function writeMovieAnalysisRuntimePackageReport(
  projectRoot?: string
): MovieAnalysisRuntimePackageReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RuntimePackageValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, VIDEO_BLUEPRINT_REGISTRY_PATH))) {
    issues.push({
      code: 'VIDEO_BLUEPRINT_REGISTRY_MISSING',
      message: `Missing ${VIDEO_BLUEPRINT_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, RUNTIME_PACKAGE_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'RUNTIME_PACKAGE_REGISTRY_MISSING',
      message: `Missing ${RUNTIME_PACKAGE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: RuntimePackageValidationResult[] = [];
  const plans: MovieAnalysisRuntimePackagePlan[] = [];

  for (const spec of SEED_RUNTIME_PACKAGE_SPECS) {
    const plan = loadMovieAnalysisRuntimePackagePlan(root, spec.runtime_package_id);
    if (!plan) {
      issues.push({
        code: 'RUNTIME_PACKAGE_PLAN_MISSING',
        message: `Missing runtime package plan: ${spec.runtime_package_id}`,
        severity: 'error',
        runtime_package_id: spec.runtime_package_id,
      });
      planValidations.push({
        runtime_package_id: spec.runtime_package_id,
        video_blueprint_id: spec.video_blueprint_id,
        status: 'FAIL',
        issues: [
          {
            code: 'RUNTIME_PACKAGE_PLAN_MISSING',
            message: `Plan file not found in ${RUNTIME_PACKAGE_PLANS_DIR}`,
            severity: 'error',
            runtime_package_id: spec.runtime_package_id,
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

  const videoBlueprintLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('VIDEO_BLUEPRINT') || i.code.startsWith('BLUEPRINT_ELEMENT')
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

  const packageOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        PACKAGE_FIELDS.every((f) => p[f].every((e) => e.package_only === true)) &&
        p.runtime_readiness.estimated_only === true &&
        p.runtime_readiness.runtime_execution === false &&
        p.runtime_readiness.generates_video === false
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
    videoBlueprintLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    packageSections === 'PASS' &&
    packageOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisRuntimePackageReport = {
    report_id: 'movie-analysis-runtime-package-report-v1',
    phase: RUNTIME_PACKAGE_PHASE,
    timestamp,
    runtime_package_plans: plans.length,
    registry,
    video_blueprint_links: videoBlueprintLinks,
    source_links: sourceLinks,
    package_sections: packageSections,
    package_only: packageOnly,
    plan_validations: planValidations,
    planning_only: true,
    runtime_execution: false,
    video_generation: false,
    gpu_execution: false,
    ocr: false,
    external_call_allowed: false,
    final_verdict: pass ? RUNTIME_PACKAGE_PASS_VERDICT : RUNTIME_PACKAGE_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, RUNTIME_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, RUNTIME_PACKAGE_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
