import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATION_PACKAGE_REGISTRY_PATH,
  loadMovieAnalysisGenerationPackagePlan,
  type GenerationPackageElement,
  type MovieAnalysisGenerationPackagePlan,
} from './movieAnalysisGenerationPackageDesign.js';
import {
  GENERATION_BLUEPRINT_PHASE,
  GENERATION_BLUEPRINT_REGISTRY_PATH,
  GENERATION_BLUEPRINT_PLANS_DIR,
  SEED_GENERATION_BLUEPRINT_SPECS,
  type GenerationBlueprintStructureElement,
  type MovieAnalysisGenerationBlueprintPlan,
  loadMovieAnalysisGenerationBlueprintPlan,
} from './movieAnalysisGenerationBlueprintDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GENERATION_BLUEPRINT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_GENERATION_BLUEPRINT_DESIGN_V1' as const;
export const GENERATION_BLUEPRINT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_GENERATION_BLUEPRINT_DESIGN_V1' as const;
export const GENERATION_BLUEPRINT_REPORT_PATH =
  'reports/movie-analysis-generation-blueprint-report.json' as const;
export const GENERATION_BLUEPRINT_MD_PATH =
  'reports/MOVIE_ANALYSIS_GENERATION_BLUEPRINT_DESIGN.md' as const;

export type GenerationBlueprintValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  generation_blueprint_id?: string;
};

export type GenerationBlueprintValidationResult = {
  generation_blueprint_id: string;
  generation_package_id: string;
  status: 'PASS' | 'FAIL';
  issues: GenerationBlueprintValidationIssue[];
};

export type MovieAnalysisGenerationBlueprintReport = {
  report_id: string;
  phase: typeof GENERATION_BLUEPRINT_PHASE;
  timestamp: string;
  generation_blueprint_plans: number;
  registry: 'PASS' | 'FAIL';
  generation_package_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  blueprint_structures: 'PASS' | 'FAIL';
  generation_blueprint_only: 'PASS' | 'FAIL';
  plan_validations: GenerationBlueprintValidationResult[];
  planning_only: true;
  generation_blueprint_only_flag: true;
  estimated_only: true;
  video_generation: false;
  image_generation: false;
  runtime_execution: false;
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict:
    | typeof GENERATION_BLUEPRINT_PASS_VERDICT
    | typeof GENERATION_BLUEPRINT_FAIL_VERDICT;
  issues: GenerationBlueprintValidationIssue[];
};

const STRUCTURE_FIELDS = [
  'scene_generation_structure',
  'character_generation_structure',
  'camera_generation_structure',
  'emotion_generation_structure',
  'transition_generation_structure',
  'continuity_generation_structure',
  'execution_readiness_structure',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function collectPackageElementIds(packagePlan: MovieAnalysisGenerationPackagePlan): Set<string> {
  const ids = new Set<string>();
  for (const field of [
    'scene_generation_package',
    'character_generation_package',
    'camera_generation_package',
    'emotion_generation_package',
    'transition_generation_package',
    'continuity_generation_package',
  ] as const) {
    for (const element of packagePlan[field]) {
      ids.add(element.element_id);
    }
  }
  return ids;
}

function validateExecutionFlags(
  plan: MovieAnalysisGenerationBlueprintPlan
): GenerationBlueprintValidationIssue[] {
  const issues: GenerationBlueprintValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }
  if (flags.generation_blueprint_only !== true) {
    issues.push({
      code: 'GENERATION_BLUEPRINT_ONLY_FALSE',
      message: 'execution_flags.generation_blueprint_only must be true',
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }
  if (flags.estimated_only !== true) {
    issues.push({
      code: 'ESTIMATED_ONLY_FALSE',
      message: 'execution_flags.estimated_only must be true',
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }
  if (flags.image_generation !== false) {
    issues.push({
      code: 'IMAGE_GENERATION_ENABLED',
      message: 'execution_flags.image_generation must be false',
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }
  if (flags.runtime_execution !== false) {
    issues.push({
      code: 'RUNTIME_EXECUTION_ENABLED',
      message: 'execution_flags.runtime_execution must be false',
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }

  return issues;
}

function validateStructures(
  plan: MovieAnalysisGenerationBlueprintPlan,
  packagePlan: MovieAnalysisGenerationPackagePlan | null
): GenerationBlueprintValidationIssue[] {
  const issues: GenerationBlueprintValidationIssue[] = [];
  const packageIds = packagePlan ? collectPackageElementIds(packagePlan) : null;

  for (const field of STRUCTURE_FIELDS) {
    const structure: GenerationBlueprintStructureElement[] = plan[field];
    if (!structure || structure.length === 0) {
      issues.push({
        code: 'STRUCTURE_MISSING',
        message: `${field} must be present`,
        severity: 'error',
        generation_blueprint_id: plan.generation_blueprint_id,
      });
      continue;
    }

    for (const element of structure) {
      if (element.generation_blueprint_only !== true) {
        issues.push({
          code: 'NOT_GENERATION_BLUEPRINT_ONLY',
          message: `Element ${element.element_id} must have generation_blueprint_only=true`,
          severity: 'error',
          generation_blueprint_id: plan.generation_blueprint_id,
        });
      }
      if (!element.estimated_blueprint_value.startsWith('estimated_blueprint_')) {
        issues.push({
          code: 'INVALID_BLUEPRINT_VALUE',
          message: `Element ${element.element_id} must have estimated blueprint value`,
          severity: 'error',
          generation_blueprint_id: plan.generation_blueprint_id,
        });
      }
      if (packageIds) {
        for (const refId of element.source_generation_package_element_ids) {
          if (!packageIds.has(refId)) {
            issues.push({
              code: 'PACKAGE_ELEMENT_REF_MISSING',
              message: `Element ${element.element_id} references unknown package element ${refId}`,
              severity: 'error',
              generation_blueprint_id: plan.generation_blueprint_id,
            });
          }
        }
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisGenerationBlueprintPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): GenerationBlueprintValidationResult {
  const issues: GenerationBlueprintValidationIssue[] = [];

  const packagePlan = loadMovieAnalysisGenerationPackagePlan(
    projectRoot,
    plan.generation_package_id
  );
  if (!packagePlan) {
    issues.push({
      code: 'GENERATION_PACKAGE_MISSING',
      message: `Generation package plan ${plan.generation_package_id} not found`,
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  } else if (packagePlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'GENERATION_PACKAGE_LINK_MISMATCH',
      message: 'generation_package_id source_video_id does not match plan',
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      generation_blueprint_id: plan.generation_blueprint_id,
    });
  }

  issues.push(...validateStructures(plan, packagePlan));
  issues.push(...validateExecutionFlags(plan));

  return {
    generation_blueprint_id: plan.generation_blueprint_id,
    generation_package_id: plan.generation_package_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisGenerationBlueprintReport): string {
  const lines = [
    '# Movie Analysis Generation Blueprint Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'generation package',
    '  ↓',
    'generation blueprint',
    '  ↓',
    'future video generation preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| generation_blueprint_plans | ${report.generation_blueprint_plans} |`,
    `| registry | ${report.registry} |`,
    `| generation_package_links | ${report.generation_package_links} |`,
    `| source_links | ${report.source_links} |`,
    `| blueprint_structures | ${report.blueprint_structures} |`,
    `| generation_blueprint_only | ${report.generation_blueprint_only} |`,
    `| planning_only | ${report.planning_only} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| video_generation | ${report.video_generation} |`,
    `| image_generation | ${report.image_generation} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    '',
    '## Generation Blueprint Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.generation_blueprint_id}`);
    lines.push('');
    lines.push(`- generation_package_id: ${validation.generation_package_id}`);
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

export function writeMovieAnalysisGenerationBlueprintReport(
  projectRoot?: string
): MovieAnalysisGenerationBlueprintReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GenerationBlueprintValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, GENERATION_PACKAGE_REGISTRY_PATH))) {
    issues.push({
      code: 'GENERATION_PACKAGE_REGISTRY_MISSING',
      message: `Missing ${GENERATION_PACKAGE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, GENERATION_BLUEPRINT_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'GENERATION_BLUEPRINT_REGISTRY_MISSING',
      message: `Missing ${GENERATION_BLUEPRINT_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: GenerationBlueprintValidationResult[] = [];
  const plans: MovieAnalysisGenerationBlueprintPlan[] = [];

  for (const spec of SEED_GENERATION_BLUEPRINT_SPECS) {
    const plan = loadMovieAnalysisGenerationBlueprintPlan(root, spec.generation_blueprint_id);
    if (!plan) {
      issues.push({
        code: 'GENERATION_BLUEPRINT_PLAN_MISSING',
        message: `Missing generation blueprint plan: ${spec.generation_blueprint_id}`,
        severity: 'error',
        generation_blueprint_id: spec.generation_blueprint_id,
      });
      planValidations.push({
        generation_blueprint_id: spec.generation_blueprint_id,
        generation_package_id: spec.generation_package_id,
        status: 'FAIL',
        issues: [
          {
            code: 'GENERATION_BLUEPRINT_PLAN_MISSING',
            message: `Plan file not found in ${GENERATION_BLUEPRINT_PLANS_DIR}`,
            severity: 'error',
            generation_blueprint_id: spec.generation_blueprint_id,
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

  const generationPackageLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('GENERATION_PACKAGE') || i.code.startsWith('PACKAGE_ELEMENT')
    )
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const blueprintStructures =
    plans.length === 4 &&
    plans.every((p) => STRUCTURE_FIELDS.every((f) => p[f].length > 0))
      ? 'PASS'
      : 'FAIL';

  const generationBlueprintOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        STRUCTURE_FIELDS.every((f) => p[f].every((e) => e.generation_blueprint_only === true)) &&
        p.execution_flags.generation_blueprint_only === true &&
        p.execution_flags.estimated_only === true &&
        p.execution_flags.video_generation === false &&
        p.execution_flags.image_generation === false &&
        p.execution_flags.runtime_execution === false
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
    generationPackageLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    blueprintStructures === 'PASS' &&
    generationBlueprintOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisGenerationBlueprintReport = {
    report_id: 'movie-analysis-generation-blueprint-report-v1',
    phase: GENERATION_BLUEPRINT_PHASE,
    timestamp,
    generation_blueprint_plans: plans.length,
    registry,
    generation_package_links: generationPackageLinks,
    source_links: sourceLinks,
    blueprint_structures: blueprintStructures,
    generation_blueprint_only: generationBlueprintOnly,
    plan_validations: planValidations,
    planning_only: true,
    generation_blueprint_only_flag: true,
    estimated_only: true,
    video_generation: false,
    image_generation: false,
    runtime_execution: false,
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? GENERATION_BLUEPRINT_PASS_VERDICT : GENERATION_BLUEPRINT_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, GENERATION_BLUEPRINT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GENERATION_BLUEPRINT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
