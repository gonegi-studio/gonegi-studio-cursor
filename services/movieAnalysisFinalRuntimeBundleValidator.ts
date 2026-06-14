import fs from 'node:fs';
import path from 'node:path';
import {
  EXECUTION_READINESS_REGISTRY_PATH,
  loadMovieAnalysisExecutionReadinessPlan,
  type ExecutionReadinessElement,
  type MovieAnalysisExecutionReadinessPlan,
} from './movieAnalysisExecutionReadinessDesign.js';
import {
  FINAL_RUNTIME_BUNDLE_PHASE,
  FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
  FINAL_RUNTIME_BUNDLE_PLANS_DIR,
  SEED_FINAL_RUNTIME_BUNDLE_SPECS,
  type FinalRuntimeBundleElement,
  type MovieAnalysisFinalRuntimeBundlePlan,
  loadMovieAnalysisFinalRuntimeBundlePlan,
} from './movieAnalysisFinalRuntimeBundleDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FINAL_RUNTIME_BUNDLE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_FINAL_RUNTIME_BUNDLE_DESIGN_V1' as const;
export const FINAL_RUNTIME_BUNDLE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_FINAL_RUNTIME_BUNDLE_DESIGN_V1' as const;
export const FINAL_RUNTIME_BUNDLE_REPORT_PATH =
  'reports/movie-analysis-final-runtime-bundle-report.json' as const;
export const FINAL_RUNTIME_BUNDLE_MD_PATH =
  'reports/MOVIE_ANALYSIS_FINAL_RUNTIME_BUNDLE_DESIGN.md' as const;

export type FinalRuntimeBundleValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  final_runtime_bundle_id?: string;
};

export type FinalRuntimeBundleValidationResult = {
  final_runtime_bundle_id: string;
  execution_readiness_id: string;
  status: 'PASS' | 'FAIL';
  issues: FinalRuntimeBundleValidationIssue[];
};

export type MovieAnalysisFinalRuntimeBundleReport = {
  report_id: string;
  phase: typeof FINAL_RUNTIME_BUNDLE_PHASE;
  timestamp: string;
  final_runtime_bundle_plans: number;
  registry: 'PASS' | 'FAIL';
  execution_readiness_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  bundle_sections: 'PASS' | 'FAIL';
  final_runtime_bundle_only: 'PASS' | 'FAIL';
  plan_validations: FinalRuntimeBundleValidationResult[];
  planning_only: true;
  final_runtime_bundle_only_flag: true;
  estimated_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict:
    | typeof FINAL_RUNTIME_BUNDLE_PASS_VERDICT
    | typeof FINAL_RUNTIME_BUNDLE_FAIL_VERDICT;
  issues: FinalRuntimeBundleValidationIssue[];
};

const BUNDLE_FIELDS = [
  'scene_bundle',
  'character_bundle',
  'camera_bundle',
  'emotion_bundle',
  'transition_bundle',
  'continuity_bundle',
  'runtime_bundle',
  'safety_bundle',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function collectReadinessElementIds(
  readinessPlan: MovieAnalysisExecutionReadinessPlan
): Set<string> {
  const ids = new Set<string>();
  for (const field of [
    'scene_readiness',
    'character_readiness',
    'camera_readiness',
    'emotion_readiness',
    'transition_readiness',
    'continuity_readiness',
  ] as const) {
    for (const element of readinessPlan[field]) {
      ids.add(element.element_id);
    }
  }
  return ids;
}

function validateExecutionFlags(
  plan: MovieAnalysisFinalRuntimeBundlePlan
): FinalRuntimeBundleValidationIssue[] {
  const issues: FinalRuntimeBundleValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }
  if (flags.final_runtime_bundle_only !== true) {
    issues.push({
      code: 'FINAL_RUNTIME_BUNDLE_ONLY_FALSE',
      message: 'execution_flags.final_runtime_bundle_only must be true',
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }
  if (flags.estimated_only !== true) {
    issues.push({
      code: 'ESTIMATED_ONLY_FALSE',
      message: 'execution_flags.estimated_only must be true',
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }
  if (flags.runtime_execution !== false) {
    issues.push({
      code: 'RUNTIME_EXECUTION_ENABLED',
      message: 'execution_flags.runtime_execution must be false',
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }
  if (flags.image_generation !== false) {
    issues.push({
      code: 'IMAGE_GENERATION_ENABLED',
      message: 'execution_flags.image_generation must be false',
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }

  return issues;
}

function validateBundleSections(
  plan: MovieAnalysisFinalRuntimeBundlePlan,
  readinessPlan: MovieAnalysisExecutionReadinessPlan | null
): FinalRuntimeBundleValidationIssue[] {
  const issues: FinalRuntimeBundleValidationIssue[] = [];
  const readinessIds = readinessPlan ? collectReadinessElementIds(readinessPlan) : null;

  for (const field of BUNDLE_FIELDS) {
    const elements: FinalRuntimeBundleElement[] = plan[field];
    if (!elements || elements.length === 0) {
      issues.push({
        code: 'BUNDLE_SECTION_MISSING',
        message: `${field} must be present`,
        severity: 'error',
        final_runtime_bundle_id: plan.final_runtime_bundle_id,
      });
      continue;
    }

    for (const element of elements) {
      if (element.final_runtime_bundle_only !== true) {
        issues.push({
          code: 'NOT_FINAL_RUNTIME_BUNDLE_ONLY',
          message: `Element ${element.element_id} must have final_runtime_bundle_only=true`,
          severity: 'error',
          final_runtime_bundle_id: plan.final_runtime_bundle_id,
        });
      }
      if (!element.estimated_bundle_value.startsWith('estimated_bundle_')) {
        issues.push({
          code: 'INVALID_BUNDLE_VALUE',
          message: `Element ${element.element_id} must have estimated bundle value`,
          severity: 'error',
          final_runtime_bundle_id: plan.final_runtime_bundle_id,
        });
      }
      if (readinessIds) {
        for (const refId of element.source_readiness_element_ids) {
          if (!readinessIds.has(refId)) {
            issues.push({
              code: 'READINESS_ELEMENT_REF_MISSING',
              message: `Element ${element.element_id} references unknown readiness element ${refId}`,
              severity: 'error',
              final_runtime_bundle_id: plan.final_runtime_bundle_id,
            });
          }
        }
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisFinalRuntimeBundlePlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): FinalRuntimeBundleValidationResult {
  const issues: FinalRuntimeBundleValidationIssue[] = [];

  const readinessPlan = loadMovieAnalysisExecutionReadinessPlan(
    projectRoot,
    plan.execution_readiness_id
  );
  if (!readinessPlan) {
    issues.push({
      code: 'EXECUTION_READINESS_MISSING',
      message: `Execution readiness plan ${plan.execution_readiness_id} not found`,
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  } else if (readinessPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'EXECUTION_READINESS_LINK_MISMATCH',
      message: 'execution_readiness_id source_video_id does not match plan',
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
    });
  }

  issues.push(...validateBundleSections(plan, readinessPlan));
  issues.push(...validateExecutionFlags(plan));

  return {
    final_runtime_bundle_id: plan.final_runtime_bundle_id,
    execution_readiness_id: plan.execution_readiness_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisFinalRuntimeBundleReport): string {
  const lines = [
    '# Movie Analysis Final Runtime Bundle Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'execution readiness',
    '  ↓',
    'final runtime bundle',
    '  ↓',
    'design-only runtime bundle (no execution)',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| final_runtime_bundle_plans | ${report.final_runtime_bundle_plans} |`,
    `| registry | ${report.registry} |`,
    `| execution_readiness_links | ${report.execution_readiness_links} |`,
    `| source_links | ${report.source_links} |`,
    `| bundle_sections | ${report.bundle_sections} |`,
    `| final_runtime_bundle_only | ${report.final_runtime_bundle_only} |`,
    `| planning_only | ${report.planning_only} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| video_generation | ${report.video_generation} |`,
    `| image_generation | ${report.image_generation} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    '',
    '## Final Runtime Bundle Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.final_runtime_bundle_id}`);
    lines.push('');
    lines.push(`- execution_readiness_id: ${validation.execution_readiness_id}`);
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

export function writeMovieAnalysisFinalRuntimeBundleReport(
  projectRoot?: string
): MovieAnalysisFinalRuntimeBundleReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: FinalRuntimeBundleValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, EXECUTION_READINESS_REGISTRY_PATH))) {
    issues.push({
      code: 'EXECUTION_READINESS_REGISTRY_MISSING',
      message: `Missing ${EXECUTION_READINESS_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, FINAL_RUNTIME_BUNDLE_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'FINAL_RUNTIME_BUNDLE_REGISTRY_MISSING',
      message: `Missing ${FINAL_RUNTIME_BUNDLE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: FinalRuntimeBundleValidationResult[] = [];
  const plans: MovieAnalysisFinalRuntimeBundlePlan[] = [];

  for (const spec of SEED_FINAL_RUNTIME_BUNDLE_SPECS) {
    const plan = loadMovieAnalysisFinalRuntimeBundlePlan(root, spec.final_runtime_bundle_id);
    if (!plan) {
      issues.push({
        code: 'FINAL_RUNTIME_BUNDLE_PLAN_MISSING',
        message: `Missing final runtime bundle plan: ${spec.final_runtime_bundle_id}`,
        severity: 'error',
        final_runtime_bundle_id: spec.final_runtime_bundle_id,
      });
      planValidations.push({
        final_runtime_bundle_id: spec.final_runtime_bundle_id,
        execution_readiness_id: spec.execution_readiness_id,
        status: 'FAIL',
        issues: [
          {
            code: 'FINAL_RUNTIME_BUNDLE_PLAN_MISSING',
            message: `Plan file not found in ${FINAL_RUNTIME_BUNDLE_PLANS_DIR}`,
            severity: 'error',
            final_runtime_bundle_id: spec.final_runtime_bundle_id,
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

  const executionReadinessLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('EXECUTION_READINESS') || i.code.startsWith('READINESS_ELEMENT')
    )
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const bundleSections =
    plans.length === 4 &&
    plans.every((p) => BUNDLE_FIELDS.every((f) => p[f].length > 0))
      ? 'PASS'
      : 'FAIL';

  const finalRuntimeBundleOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        BUNDLE_FIELDS.every((f) => p[f].every((e) => e.final_runtime_bundle_only === true)) &&
        p.execution_flags.final_runtime_bundle_only === true &&
        p.execution_flags.estimated_only === true &&
        p.execution_flags.runtime_execution === false &&
        p.execution_flags.video_generation === false &&
        p.execution_flags.image_generation === false
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
    executionReadinessLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    bundleSections === 'PASS' &&
    finalRuntimeBundleOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisFinalRuntimeBundleReport = {
    report_id: 'movie-analysis-final-runtime-bundle-report-v1',
    phase: FINAL_RUNTIME_BUNDLE_PHASE,
    timestamp,
    final_runtime_bundle_plans: plans.length,
    registry,
    execution_readiness_links: executionReadinessLinks,
    source_links: sourceLinks,
    bundle_sections: bundleSections,
    final_runtime_bundle_only: finalRuntimeBundleOnly,
    plan_validations: planValidations,
    planning_only: true,
    final_runtime_bundle_only_flag: true,
    estimated_only: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? FINAL_RUNTIME_BUNDLE_PASS_VERDICT : FINAL_RUNTIME_BUNDLE_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, FINAL_RUNTIME_BUNDLE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FINAL_RUNTIME_BUNDLE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
