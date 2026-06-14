import fs from 'node:fs';
import path from 'node:path';
import {
  FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
  loadMovieAnalysisFinalRuntimeBundlePlan,
} from './movieAnalysisFinalRuntimeBundleDesign.js';
import {
  MASTER_PACKAGE_PHASE,
  MASTER_PACKAGE_REGISTRY_PATH,
  MASTER_PACKAGE_PLANS_DIR,
  SEED_MASTER_PACKAGE_SPECS,
  TRACE_DEFINITIONS,
  type MovieAnalysisMasterPackagePlan,
  loadMovieAnalysisMasterPackagePlan,
} from './movieAnalysisMasterPackageDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MASTER_PACKAGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_MASTER_PACKAGE_DESIGN_V1' as const;
export const MASTER_PACKAGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_MASTER_PACKAGE_DESIGN_V1' as const;
export const MASTER_PACKAGE_REPORT_PATH =
  'reports/movie-analysis-master-package-report.json' as const;
export const MASTER_PACKAGE_MD_PATH =
  'reports/MOVIE_ANALYSIS_MASTER_PACKAGE_DESIGN.md' as const;

export type MasterPackageValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  master_package_id?: string;
};

export type MasterPackageValidationResult = {
  master_package_id: string;
  final_runtime_bundle_id: string;
  status: 'PASS' | 'FAIL';
  issues: MasterPackageValidationIssue[];
};

export type MovieAnalysisMasterPackageReport = {
  report_id: string;
  phase: typeof MASTER_PACKAGE_PHASE;
  timestamp: string;
  master_package_plans: number;
  registry: 'PASS' | 'FAIL';
  final_runtime_bundle_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  package_trace: 'PASS' | 'FAIL';
  master_package_only: 'PASS' | 'FAIL';
  plan_validations: MasterPackageValidationResult[];
  planning_only: true;
  master_package_only_flag: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict: typeof MASTER_PACKAGE_PASS_VERDICT | typeof MASTER_PACKAGE_FAIL_VERDICT;
  issues: MasterPackageValidationIssue[];
};

const CHAIN_ID_FIELDS = [
  'analysis_plan_id',
  'dry_run_id',
  'frame_sampling_id',
  'scene_detection_id',
  'coordinate_extraction_id',
  'gonegi_state_mapping_id',
  'video_state_compilation_id',
  'keyframe_preparation_id',
  'motion_plan_id',
  'temporal_flow_id',
  'sequence_assembly_id',
  'video_blueprint_id',
  'runtime_package_id',
  'generation_package_id',
  'generation_blueprint_id',
  'execution_readiness_id',
  'final_runtime_bundle_id',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisMasterPackagePlan
): MasterPackageValidationIssue[] {
  const issues: MasterPackageValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (flags.master_package_only !== true) {
    issues.push({
      code: 'MASTER_PACKAGE_ONLY_FALSE',
      message: 'execution_flags.master_package_only must be true',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (flags.runtime_execution !== false) {
    issues.push({
      code: 'RUNTIME_EXECUTION_ENABLED',
      message: 'execution_flags.runtime_execution must be false',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (flags.image_generation !== false) {
    issues.push({
      code: 'IMAGE_GENERATION_ENABLED',
      message: 'execution_flags.image_generation must be false',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }

  return issues;
}

function validateSummaries(
  plan: MovieAnalysisMasterPackagePlan
): MasterPackageValidationIssue[] {
  const issues: MasterPackageValidationIssue[] = [];

  if (plan.readiness_summary.chain_complete !== true) {
    issues.push({
      code: 'CHAIN_INCOMPLETE',
      message: 'readiness_summary.chain_complete must be true',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (plan.readiness_summary.design_only !== true) {
    issues.push({
      code: 'READINESS_NOT_DESIGN_ONLY',
      message: 'readiness_summary.design_only must be true',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (plan.safety_summary.no_execution !== true) {
    issues.push({
      code: 'SAFETY_NO_EXECUTION_FALSE',
      message: 'safety_summary.no_execution must be true',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (plan.safety_summary.no_rendering !== true) {
    issues.push({
      code: 'SAFETY_NO_RENDERING_FALSE',
      message: 'safety_summary.no_rendering must be true',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }
  if (plan.safety_summary.no_inference !== true) {
    issues.push({
      code: 'SAFETY_NO_INFERENCE_FALSE',
      message: 'safety_summary.no_inference must be true',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }

  return issues;
}

function validatePackageTrace(
  plan: MovieAnalysisMasterPackagePlan
): MasterPackageValidationIssue[] {
  const issues: MasterPackageValidationIssue[] = [];

  if (!plan.package_trace || plan.package_trace.length !== TRACE_DEFINITIONS.length) {
    issues.push({
      code: 'PACKAGE_TRACE_INCOMPLETE',
      message: `package_trace must have ${TRACE_DEFINITIONS.length} entries`,
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
    return issues;
  }

  for (let i = 0; i < TRACE_DEFINITIONS.length; i++) {
    const definition = TRACE_DEFINITIONS[i];
    const entry = plan.package_trace[i];

    if (!entry) continue;

    if (entry.step !== i + 1) {
      issues.push({
        code: 'TRACE_STEP_MISMATCH',
        message: `package_trace step ${i + 1} has wrong step number`,
        severity: 'error',
        master_package_id: plan.master_package_id,
      });
    }
    if (entry.phase !== definition.phase) {
      issues.push({
        code: 'TRACE_PHASE_MISMATCH',
        message: `package_trace step ${i + 1} phase mismatch`,
        severity: 'error',
        master_package_id: plan.master_package_id,
      });
    }
    if (entry.plan_type !== definition.plan_type) {
      issues.push({
        code: 'TRACE_PLAN_TYPE_MISMATCH',
        message: `package_trace step ${i + 1} plan_type mismatch`,
        severity: 'error',
        master_package_id: plan.master_package_id,
      });
    }
    if (entry.plan_id !== plan[definition.idKey]) {
      issues.push({
        code: 'TRACE_PLAN_ID_MISMATCH',
        message: `package_trace step ${i + 1} plan_id does not match ${definition.idKey}`,
        severity: 'error',
        master_package_id: plan.master_package_id,
      });
    }
    if (entry.status !== 'designed') {
      issues.push({
        code: 'TRACE_STATUS_INVALID',
        message: `package_trace step ${i + 1} status must be designed`,
        severity: 'error',
        master_package_id: plan.master_package_id,
      });
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisMasterPackagePlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): MasterPackageValidationResult {
  const issues: MasterPackageValidationIssue[] = [];

  const bundlePlan = loadMovieAnalysisFinalRuntimeBundlePlan(
    projectRoot,
    plan.final_runtime_bundle_id
  );
  if (!bundlePlan) {
    issues.push({
      code: 'FINAL_RUNTIME_BUNDLE_MISSING',
      message: `Final runtime bundle plan ${plan.final_runtime_bundle_id} not found`,
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  } else if (bundlePlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'FINAL_RUNTIME_BUNDLE_LINK_MISMATCH',
      message: 'final_runtime_bundle_id source_video_id does not match plan',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  } else if (bundlePlan.execution_readiness_id !== plan.execution_readiness_id) {
    issues.push({
      code: 'EXECUTION_READINESS_LINK_MISMATCH',
      message: 'execution_readiness_id does not match final runtime bundle',
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      master_package_id: plan.master_package_id,
    });
  }

  for (const field of CHAIN_ID_FIELDS) {
    if (!plan[field] || plan[field].length === 0) {
      issues.push({
        code: 'CHAIN_ID_MISSING',
        message: `${field} must be present`,
        severity: 'error',
        master_package_id: plan.master_package_id,
      });
    }
  }

  issues.push(...validatePackageTrace(plan));
  issues.push(...validateSummaries(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    master_package_id: plan.master_package_id,
    final_runtime_bundle_id: plan.final_runtime_bundle_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisMasterPackageReport): string {
  const lines = [
    '# Movie Analysis Master Package Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'analysis plan → dry run → frame sampling → scene detection',
    '  → coordinate extraction → gonegi state mapping → video state compilation',
    '  → keyframe preparation → motion planning → temporal flow',
    '  → sequence assembly → video blueprint → runtime package',
    '  → generation package → generation blueprint → execution readiness',
    '  → final runtime bundle → master package',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| master_package_plans | ${report.master_package_plans} |`,
    `| registry | ${report.registry} |`,
    `| final_runtime_bundle_links | ${report.final_runtime_bundle_links} |`,
    `| source_links | ${report.source_links} |`,
    `| package_trace | ${report.package_trace} |`,
    `| master_package_only | ${report.master_package_only} |`,
    `| planning_only | ${report.planning_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| video_generation | ${report.video_generation} |`,
    `| image_generation | ${report.image_generation} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    '',
    '## Master Package Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.master_package_id}`);
    lines.push('');
    lines.push(`- final_runtime_bundle_id: ${validation.final_runtime_bundle_id}`);
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

export function writeMovieAnalysisMasterPackageReport(
  projectRoot?: string
): MovieAnalysisMasterPackageReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MasterPackageValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, FINAL_RUNTIME_BUNDLE_REGISTRY_PATH))) {
    issues.push({
      code: 'FINAL_RUNTIME_BUNDLE_REGISTRY_MISSING',
      message: `Missing ${FINAL_RUNTIME_BUNDLE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, MASTER_PACKAGE_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'MASTER_PACKAGE_REGISTRY_MISSING',
      message: `Missing ${MASTER_PACKAGE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: MasterPackageValidationResult[] = [];
  const plans: MovieAnalysisMasterPackagePlan[] = [];

  for (const spec of SEED_MASTER_PACKAGE_SPECS) {
    const plan = loadMovieAnalysisMasterPackagePlan(root, spec.master_package_id);
    if (!plan) {
      issues.push({
        code: 'MASTER_PACKAGE_PLAN_MISSING',
        message: `Missing master package plan: ${spec.master_package_id}`,
        severity: 'error',
        master_package_id: spec.master_package_id,
      });
      planValidations.push({
        master_package_id: spec.master_package_id,
        final_runtime_bundle_id: spec.final_runtime_bundle_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MASTER_PACKAGE_PLAN_MISSING',
            message: `Plan file not found in ${MASTER_PACKAGE_PLANS_DIR}`,
            severity: 'error',
            master_package_id: spec.master_package_id,
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

  const finalRuntimeBundleLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('FINAL_RUNTIME_BUNDLE'))
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const packageTrace =
    plans.length === 4 &&
    plans.every((p) => p.package_trace.length === TRACE_DEFINITIONS.length) &&
    !allPlanIssues.some((i) => i.code.startsWith('TRACE_') || i.code === 'PACKAGE_TRACE_INCOMPLETE')
      ? 'PASS'
      : 'FAIL';

  const masterPackageOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.execution_flags.master_package_only === true &&
        p.readiness_summary.master_package_only === true &&
        p.safety_summary.master_package_only === true &&
        p.safety_summary.no_execution === true &&
        p.safety_summary.no_rendering === true &&
        p.safety_summary.no_inference === true
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
    finalRuntimeBundleLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    packageTrace === 'PASS' &&
    masterPackageOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisMasterPackageReport = {
    report_id: 'movie-analysis-master-package-report-v1',
    phase: MASTER_PACKAGE_PHASE,
    timestamp,
    master_package_plans: plans.length,
    registry,
    final_runtime_bundle_links: finalRuntimeBundleLinks,
    source_links: sourceLinks,
    package_trace: packageTrace,
    master_package_only: masterPackageOnly,
    plan_validations: planValidations,
    planning_only: true,
    master_package_only_flag: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? MASTER_PACKAGE_PASS_VERDICT : MASTER_PACKAGE_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, MASTER_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, MASTER_PACKAGE_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
