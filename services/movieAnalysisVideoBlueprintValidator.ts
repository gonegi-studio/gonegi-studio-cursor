import fs from 'node:fs';
import path from 'node:path';
import {
  SEQUENCE_ASSEMBLY_REGISTRY_PATH,
  loadMovieAnalysisSequenceAssemblyPlan,
  type MovieAnalysisSequenceAssemblyPlan,
} from './movieAnalysisSequenceAssemblyDesign.js';
import {
  VIDEO_BLUEPRINT_PHASE,
  VIDEO_BLUEPRINT_REGISTRY_PATH,
  VIDEO_BLUEPRINT_PLANS_DIR,
  SEED_VIDEO_BLUEPRINT_SPECS,
  TARGET_SCENE_COUNTS,
  type MovieAnalysisVideoBlueprintPlan,
  loadMovieAnalysisVideoBlueprintPlan,
} from './movieAnalysisVideoBlueprintDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_BLUEPRINT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_VIDEO_BLUEPRINT_DESIGN_V1' as const;
export const VIDEO_BLUEPRINT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_VIDEO_BLUEPRINT_DESIGN_V1' as const;
export const VIDEO_BLUEPRINT_REPORT_PATH =
  'reports/movie-analysis-video-blueprint-report.json' as const;
export const VIDEO_BLUEPRINT_MD_PATH =
  'reports/MOVIE_ANALYSIS_VIDEO_BLUEPRINT_DESIGN.md' as const;

export type VideoBlueprintValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  video_blueprint_id?: string;
};

export type VideoBlueprintValidationResult = {
  video_blueprint_id: string;
  sequence_assembly_id: string;
  status: 'PASS' | 'FAIL';
  issues: VideoBlueprintValidationIssue[];
};

export type MovieAnalysisVideoBlueprintReport = {
  report_id: string;
  phase: typeof VIDEO_BLUEPRINT_PHASE;
  timestamp: string;
  video_blueprint_plans: number;
  registry: 'PASS' | 'FAIL';
  sequence_assembly_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  blueprint_structures: 'PASS' | 'FAIL';
  scene_counts_valid: 'PASS' | 'FAIL';
  blueprint_only: 'PASS' | 'FAIL';
  plan_validations: VideoBlueprintValidationResult[];
  planning_only: true;
  video_generation: false;
  sequence_generation: false;
  gpu_execution: false;
  ocr: false;
  external_call_allowed: false;
  final_verdict:
    | typeof VIDEO_BLUEPRINT_PASS_VERDICT
    | typeof VIDEO_BLUEPRINT_FAIL_VERDICT;
  issues: VideoBlueprintValidationIssue[];
};

const STRUCTURE_FIELDS = [
  'continuity_structure',
  'emotion_structure',
  'camera_structure',
  'transition_structure',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisVideoBlueprintPlan
): VideoBlueprintValidationIssue[] {
  const issues: VideoBlueprintValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (flags.video_generation !== false) {
    issues.push({
      code: 'VIDEO_GENERATION_ENABLED',
      message: 'execution_flags.video_generation must be false',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (flags.sequence_generation !== false) {
    issues.push({
      code: 'SEQUENCE_GENERATION_ENABLED',
      message: 'execution_flags.sequence_generation must be false',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }

  return issues;
}

function validateRuntimePreparation(
  plan: MovieAnalysisVideoBlueprintPlan
): VideoBlueprintValidationIssue[] {
  const issues: VideoBlueprintValidationIssue[] = [];
  const runtime = plan.runtime_preparation;

  if (runtime.estimated_only !== true) {
    issues.push({
      code: 'RUNTIME_ESTIMATED_ONLY_FALSE',
      message: 'runtime_preparation.estimated_only must be true',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (runtime.generates_sequence !== false) {
    issues.push({
      code: 'RUNTIME_SEQUENCE_GENERATION',
      message: 'runtime_preparation.generates_sequence must be false',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (runtime.generates_video !== false) {
    issues.push({
      code: 'RUNTIME_VIDEO_GENERATION',
      message: 'runtime_preparation.generates_video must be false',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (runtime.gpu_ready !== false) {
    issues.push({
      code: 'RUNTIME_GPU_READY',
      message: 'runtime_preparation.gpu_ready must be false',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (runtime.purpose !== 'future_runtime_video_preparation') {
    issues.push({
      code: 'RUNTIME_PURPOSE_INVALID',
      message: 'runtime_preparation.purpose must be future_runtime_video_preparation',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }

  return issues;
}

function validateStructures(
  plan: MovieAnalysisVideoBlueprintPlan,
  assemblyPlan: MovieAnalysisSequenceAssemblyPlan | null
): VideoBlueprintValidationIssue[] {
  const issues: VideoBlueprintValidationIssue[] = [];

  if (!plan.sequence_blocks || plan.sequence_blocks.length === 0) {
    issues.push({
      code: 'SEQUENCE_BLOCKS_MISSING',
      message: 'sequence_blocks must be present',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }

  for (const block of plan.sequence_blocks) {
    if (block.blueprint_only !== true) {
      issues.push({
        code: 'BLOCK_NOT_BLUEPRINT_ONLY',
        message: `Block ${block.block_id} must have blueprint_only=true`,
        severity: 'error',
        video_blueprint_id: plan.video_blueprint_id,
      });
    }
    if (!block.estimated_block_role.startsWith('estimated_block_')) {
      issues.push({
        code: 'INVALID_BLOCK_ROLE',
        message: `Block ${block.block_id} must have estimated block role`,
        severity: 'error',
        video_blueprint_id: plan.video_blueprint_id,
      });
    }
    if (assemblyPlan) {
      for (const candidateId of block.sequence_candidate_ids) {
        if (!assemblyPlan.sequence_candidates.some((c) => c.sequence_candidate_id === candidateId)) {
          issues.push({
            code: 'SEQUENCE_CANDIDATE_REF_MISSING',
            message: `Block ${block.block_id} references unknown sequence_candidate_id ${candidateId}`,
            severity: 'error',
            video_blueprint_id: plan.video_blueprint_id,
          });
        }
      }
    }
  }

  for (const field of STRUCTURE_FIELDS) {
    const structure = plan[field];
    if (!structure || structure.length === 0) {
      issues.push({
        code: 'STRUCTURE_MISSING',
        message: `${field} must be present`,
        severity: 'error',
        video_blueprint_id: plan.video_blueprint_id,
      });
      continue;
    }

    for (const element of structure) {
      if (element.blueprint_only !== true) {
        issues.push({
          code: 'STRUCTURE_NOT_BLUEPRINT_ONLY',
          message: `Element ${element.element_id} must have blueprint_only=true`,
          severity: 'error',
          video_blueprint_id: plan.video_blueprint_id,
        });
      }
      if (!element.estimated_blueprint_value.startsWith('estimated_blueprint_')) {
        issues.push({
          code: 'INVALID_BLUEPRINT_VALUE',
          message: `Element ${element.element_id} must have estimated blueprint value`,
          severity: 'error',
          video_blueprint_id: plan.video_blueprint_id,
        });
      }
      if (assemblyPlan) {
        for (const candidateId of element.source_sequence_candidate_ids) {
          if (
            !assemblyPlan.sequence_candidates.some((c) => c.sequence_candidate_id === candidateId)
          ) {
            issues.push({
              code: 'STRUCTURE_CANDIDATE_REF_MISSING',
              message: `Element ${element.element_id} references unknown sequence_candidate_id ${candidateId}`,
              severity: 'error',
              video_blueprint_id: plan.video_blueprint_id,
            });
          }
        }
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisVideoBlueprintPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): VideoBlueprintValidationResult {
  const issues: VideoBlueprintValidationIssue[] = [];

  const assemblyPlan = loadMovieAnalysisSequenceAssemblyPlan(
    projectRoot,
    plan.sequence_assembly_id
  );
  if (!assemblyPlan) {
    issues.push({
      code: 'SEQUENCE_ASSEMBLY_MISSING',
      message: `Sequence assembly plan ${plan.sequence_assembly_id} not found`,
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  } else if (assemblyPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'SEQUENCE_ASSEMBLY_LINK_MISMATCH',
      message: 'sequence_assembly_id source_video_id does not match plan',
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }

  const expectedScenes = TARGET_SCENE_COUNTS[plan.source_video_id];
  if (plan.scene_count !== expectedScenes) {
    issues.push({
      code: 'SCENE_COUNT_MISMATCH',
      message: `scene_count expected ${expectedScenes}, got ${plan.scene_count}`,
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }
  if (plan.sequence_blocks.length !== expectedScenes) {
    issues.push({
      code: 'SEQUENCE_BLOCKS_COUNT_MISMATCH',
      message: `sequence_blocks length expected ${expectedScenes}, got ${plan.sequence_blocks.length}`,
      severity: 'error',
      video_blueprint_id: plan.video_blueprint_id,
    });
  }

  issues.push(...validateStructures(plan, assemblyPlan));
  issues.push(...validateRuntimePreparation(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    video_blueprint_id: plan.video_blueprint_id,
    sequence_assembly_id: plan.sequence_assembly_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisVideoBlueprintReport): string {
  const lines = [
    '# Movie Analysis Video Blueprint Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'sequence assembly',
    '  ↓',
    'video blueprint',
    '  ↓',
    'future runtime video preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| video_blueprint_plans | ${report.video_blueprint_plans} |`,
    `| registry | ${report.registry} |`,
    `| sequence_assembly_links | ${report.sequence_assembly_links} |`,
    `| source_links | ${report.source_links} |`,
    `| blueprint_structures | ${report.blueprint_structures} |`,
    `| scene_counts_valid | ${report.scene_counts_valid} |`,
    `| blueprint_only | ${report.blueprint_only} |`,
    `| planning_only | ${report.planning_only} |`,
    `| video_generation | ${report.video_generation} |`,
    `| sequence_generation | ${report.sequence_generation} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| ocr | ${report.ocr} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    '',
    '## Video Blueprint Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.video_blueprint_id}`);
    lines.push('');
    lines.push(`- sequence_assembly_id: ${validation.sequence_assembly_id}`);
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

export function writeMovieAnalysisVideoBlueprintReport(
  projectRoot?: string
): MovieAnalysisVideoBlueprintReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: VideoBlueprintValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, SEQUENCE_ASSEMBLY_REGISTRY_PATH))) {
    issues.push({
      code: 'SEQUENCE_ASSEMBLY_REGISTRY_MISSING',
      message: `Missing ${SEQUENCE_ASSEMBLY_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, VIDEO_BLUEPRINT_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'VIDEO_BLUEPRINT_REGISTRY_MISSING',
      message: `Missing ${VIDEO_BLUEPRINT_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: VideoBlueprintValidationResult[] = [];
  const plans: MovieAnalysisVideoBlueprintPlan[] = [];

  for (const spec of SEED_VIDEO_BLUEPRINT_SPECS) {
    const plan = loadMovieAnalysisVideoBlueprintPlan(root, spec.video_blueprint_id);
    if (!plan) {
      issues.push({
        code: 'VIDEO_BLUEPRINT_PLAN_MISSING',
        message: `Missing video blueprint plan: ${spec.video_blueprint_id}`,
        severity: 'error',
        video_blueprint_id: spec.video_blueprint_id,
      });
      planValidations.push({
        video_blueprint_id: spec.video_blueprint_id,
        sequence_assembly_id: spec.sequence_assembly_id,
        status: 'FAIL',
        issues: [
          {
            code: 'VIDEO_BLUEPRINT_PLAN_MISSING',
            message: `Plan file not found in ${VIDEO_BLUEPRINT_PLANS_DIR}`,
            severity: 'error',
            video_blueprint_id: spec.video_blueprint_id,
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

  const sequenceAssemblyLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('SEQUENCE_ASSEMBLY') || i.code.startsWith('SEQUENCE_CANDIDATE')
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
    plans.every(
      (p) =>
        p.sequence_blocks.length > 0 &&
        STRUCTURE_FIELDS.every((f) => p[f].length > 0)
    )
      ? 'PASS'
      : 'FAIL';

  const sceneCountsValid =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.scene_count === TARGET_SCENE_COUNTS[p.source_video_id] &&
        p.sequence_blocks.length === TARGET_SCENE_COUNTS[p.source_video_id]
    )
      ? 'PASS'
      : 'FAIL';

  const blueprintOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.sequence_blocks.every((b) => b.blueprint_only === true) &&
        STRUCTURE_FIELDS.every((f) => p[f].every((e) => e.blueprint_only === true)) &&
        p.runtime_preparation.estimated_only === true &&
        p.runtime_preparation.generates_sequence === false &&
        p.runtime_preparation.generates_video === false
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
    sequenceAssemblyLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    blueprintStructures === 'PASS' &&
    sceneCountsValid === 'PASS' &&
    blueprintOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisVideoBlueprintReport = {
    report_id: 'movie-analysis-video-blueprint-report-v1',
    phase: VIDEO_BLUEPRINT_PHASE,
    timestamp,
    video_blueprint_plans: plans.length,
    registry,
    sequence_assembly_links: sequenceAssemblyLinks,
    source_links: sourceLinks,
    blueprint_structures: blueprintStructures,
    scene_counts_valid: sceneCountsValid,
    blueprint_only: blueprintOnly,
    plan_validations: planValidations,
    planning_only: true,
    video_generation: false,
    sequence_generation: false,
    gpu_execution: false,
    ocr: false,
    external_call_allowed: false,
    final_verdict: pass ? VIDEO_BLUEPRINT_PASS_VERDICT : VIDEO_BLUEPRINT_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, VIDEO_BLUEPRINT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, VIDEO_BLUEPRINT_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
