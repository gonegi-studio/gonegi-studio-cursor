import fs from 'node:fs';
import path from 'node:path';
import { loadMovieAnalysisPlan } from './movieAnalysisPlanBuilder.js';
import {
  DRY_RUN_REGISTRY_PATH,
  loadMovieAnalysisDryRun,
} from './movieAnalysisDryRunPlanner.js';
import {
  FRAME_SAMPLING_REGISTRY_PATH,
  loadMovieAnalysisFrameSamplingPlan,
} from './movieAnalysisFrameSamplingDesign.js';
import {
  SCENE_DETECTION_REGISTRY_PATH,
  loadMovieAnalysisSceneDetectionPlan,
} from './movieAnalysisSceneDetectionDesign.js';
import {
  COORDINATE_EXTRACTION_REGISTRY_PATH,
  loadMovieAnalysisCoordinateExtractionPlan,
} from './movieAnalysisCoordinateExtractionDesign.js';
import {
  GONEGI_STATE_MAPPING_PHASE,
  GONEGI_STATE_MAPPING_REGISTRY_PATH,
  GONEGI_STATE_MAPPING_PLANS_DIR,
  ALL_STATE_CATEGORIES,
  SEED_GONEGI_STATE_MAPPING_SPECS,
  TARGET_STATE_CANDIDATE_COUNTS,
  type MovieAnalysisGonegiStateMappingPlan,
  loadMovieAnalysisGonegiStateMappingPlan,
} from './movieAnalysisGonegiStateMappingDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GONEGI_STATE_MAPPING_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_GONEGI_STATE_MAPPING_DESIGN_V1' as const;
export const GONEGI_STATE_MAPPING_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_GONEGI_STATE_MAPPING_DESIGN_V1' as const;
export const GONEGI_STATE_MAPPING_REPORT_PATH =
  'reports/movie-analysis-gonegi-state-mapping-report.json' as const;
export const GONEGI_STATE_MAPPING_MD_PATH =
  'reports/MOVIE_ANALYSIS_GONEGI_STATE_MAPPING_DESIGN.md' as const;

export type GonegiStateMappingValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  gonegi_state_mapping_id?: string;
};

export type GonegiStateMappingValidationResult = {
  gonegi_state_mapping_id: string;
  coordinate_extraction_id: string;
  scene_detection_id: string;
  sampling_plan_id: string;
  dry_run_id: string;
  analysis_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: GonegiStateMappingValidationIssue[];
};

export type MovieAnalysisGonegiStateMappingReport = {
  report_id: string;
  phase: typeof GONEGI_STATE_MAPPING_PHASE;
  timestamp: string;
  mapping_plans: number;
  registry: 'PASS' | 'FAIL';
  coordinate_links: 'PASS' | 'FAIL';
  scene_links: 'PASS' | 'FAIL';
  sampling_links: 'PASS' | 'FAIL';
  dry_run_links: 'PASS' | 'FAIL';
  analysis_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  state_categories: 'PASS' | 'FAIL';
  candidate_counts_valid: 'PASS' | 'FAIL';
  estimated_only: 'PASS' | 'FAIL';
  plan_validations: GonegiStateMappingValidationResult[];
  state_mapping_only: true;
  coordinate_extraction: false;
  frame_extraction: false;
  scene_extraction: false;
  ocr: false;
  gpu_execution: false;
  external_call_allowed: false;
  planning_only: true;
  final_verdict:
    | typeof GONEGI_STATE_MAPPING_PASS_VERDICT
    | typeof GONEGI_STATE_MAPPING_FAIL_VERDICT;
  issues: GonegiStateMappingValidationIssue[];
};

const FORBIDDEN_STATE_KEYS = [
  'runtime_payload',
  'gpu_payload',
  'render_payload',
  'executed_state',
  'state_output',
  'image_path',
  'frame_path',
  'video_path',
  'asset_path',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisGonegiStateMappingPlan
): GonegiStateMappingValidationIssue[] {
  const issues: GonegiStateMappingValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }
  if (flags.state_mapping_only !== true) {
    issues.push({
      code: 'STATE_MAPPING_ONLY_FALSE',
      message: 'execution_flags.state_mapping_only must be true',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }
  if (flags.coordinate_extraction !== false) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_ENABLED',
      message: 'execution_flags.coordinate_extraction must be false',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }
  if (flags.frame_extraction !== false) {
    issues.push({
      code: 'FRAME_EXTRACTION_ENABLED',
      message: 'execution_flags.frame_extraction must be false',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }
  if (flags.scene_extraction !== false) {
    issues.push({
      code: 'SCENE_EXTRACTION_ENABLED',
      message: 'execution_flags.scene_extraction must be false',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }

  return issues;
}

function validateStateCategories(
  plan: MovieAnalysisGonegiStateMappingPlan
): GonegiStateMappingValidationIssue[] {
  const issues: GonegiStateMappingValidationIssue[] = [];

  if (!plan.state_categories || plan.state_categories.length === 0) {
    issues.push({
      code: 'STATE_CATEGORIES_MISSING',
      message: 'state_categories must be present',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
    return issues;
  }

  for (const expected of ALL_STATE_CATEGORIES) {
    if (!plan.state_categories.includes(expected)) {
      issues.push({
        code: 'STATE_CATEGORY_MISSING',
        message: `state_categories must include ${expected}`,
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }
  }

  if (plan.state_categories.length !== ALL_STATE_CATEGORIES.length) {
    issues.push({
      code: 'STATE_CATEGORIES_COUNT_MISMATCH',
      message: `state_categories must contain exactly ${ALL_STATE_CATEGORIES.length} categories`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }

  return issues;
}

function validateGonegiStates(
  plan: MovieAnalysisGonegiStateMappingPlan
): GonegiStateMappingValidationIssue[] {
  const issues: GonegiStateMappingValidationIssue[] = [];

  if (!plan.gonegi_states || plan.gonegi_states.length === 0) {
    issues.push({
      code: 'GONEGI_STATES_MISSING',
      message: 'gonegi_states must be present',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
    return issues;
  }

  for (const state of plan.gonegi_states) {
    if (state.executes_state !== false) {
      issues.push({
        code: 'STATE_EXECUTION_ENABLED',
        message: `State ${state.state_id} must not execute state generation`,
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }
    if (state.creates_runtime_payload !== false) {
      issues.push({
        code: 'RUNTIME_PAYLOAD_CREATION',
        message: `State ${state.state_id} must not create runtime payloads`,
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }
    if (state.candidate_type !== 'estimated_gonegi_state_candidate') {
      issues.push({
        code: 'INVALID_STATE_CANDIDATE_TYPE',
        message: `State ${state.state_id} must be estimated_gonegi_state_candidate only`,
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }
    if (state.estimated_only !== true) {
      issues.push({
        code: 'ESTIMATED_ONLY_FALSE',
        message: `State ${state.state_id} must have estimated_only=true`,
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }
    if (!ALL_STATE_CATEGORIES.includes(state.state_category)) {
      issues.push({
        code: 'INVALID_STATE_CATEGORY',
        message: `State ${state.state_id} has invalid state_category`,
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }
    if (!state.estimated_state_value || !state.estimated_state_value.startsWith('estimated_gonegi_')) {
      issues.push({
        code: 'INVALID_ESTIMATED_STATE_VALUE',
        message: `State ${state.state_id} must have estimated Gonegi placeholder value`,
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }

    const sourceRef = plan.source_coordinates.find(
      (s) => s.coordinate_candidate_id === state.source_coordinate_id
    );
    if (!sourceRef) {
      issues.push({
        code: 'SOURCE_COORDINATE_REF_MISSING',
        message: `State ${state.state_id} references unknown source_coordinate_id`,
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }

    for (const key of FORBIDDEN_STATE_KEYS) {
      if (key in (state as Record<string, unknown>)) {
        issues.push({
          code: 'FORBIDDEN_STATE_FIELD',
          message: `State ${state.state_id} must not contain ${key}`,
          severity: 'error',
          gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
        });
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisGonegiStateMappingPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): GonegiStateMappingValidationResult {
  const issues: GonegiStateMappingValidationIssue[] = [];

  const coordinatePlan = loadMovieAnalysisCoordinateExtractionPlan(
    projectRoot,
    plan.coordinate_extraction_id
  );
  if (!coordinatePlan) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_MISSING',
      message: `Coordinate extraction plan ${plan.coordinate_extraction_id} not found`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  } else {
    if (coordinatePlan.source_video_id !== plan.source_video_id) {
      issues.push({
        code: 'COORDINATE_EXTRACTION_LINK_MISMATCH',
        message: 'coordinate_extraction_id source_video_id does not match plan',
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }
    if (coordinatePlan.dry_run_id !== plan.dry_run_id) {
      issues.push({
        code: 'COORDINATE_EXTRACTION_DRY_RUN_MISMATCH',
        message: 'coordinate_extraction dry_run_id does not match mapping plan',
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }
    if (coordinatePlan.scene_detection_id !== plan.scene_detection_id) {
      issues.push({
        code: 'COORDINATE_EXTRACTION_SCENE_MISMATCH',
        message: 'coordinate_extraction scene_detection_id does not match mapping plan',
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }
    if (coordinatePlan.sampling_plan_id !== plan.sampling_plan_id) {
      issues.push({
        code: 'COORDINATE_EXTRACTION_SAMPLING_MISMATCH',
        message: 'coordinate_extraction sampling_plan_id does not match mapping plan',
        severity: 'error',
        gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      });
    }

    for (const source of plan.source_coordinates) {
      const coordRef = coordinatePlan.coordinate_candidates.find(
        (c) => c.candidate_id === source.coordinate_candidate_id
      );
      if (!coordRef) {
        issues.push({
          code: 'COORDINATE_CANDIDATE_REF_MISSING',
          message: `source_coordinates references unknown coordinate_candidate_id ${source.coordinate_candidate_id}`,
          severity: 'error',
          gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
        });
      }
    }
  }

  const sceneDetectionPlan = loadMovieAnalysisSceneDetectionPlan(
    projectRoot,
    plan.scene_detection_id
  );
  if (!sceneDetectionPlan) {
    issues.push({
      code: 'SCENE_DETECTION_MISSING',
      message: `Scene detection plan ${plan.scene_detection_id} not found`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  } else if (sceneDetectionPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'SCENE_DETECTION_LINK_MISMATCH',
      message: 'scene_detection_id source_video_id does not match plan',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }

  const samplingPlan = loadMovieAnalysisFrameSamplingPlan(projectRoot, plan.sampling_plan_id);
  if (!samplingPlan) {
    issues.push({
      code: 'SAMPLING_PLAN_MISSING',
      message: `Sampling plan ${plan.sampling_plan_id} not found`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  } else if (samplingPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'SAMPLING_PLAN_LINK_MISMATCH',
      message: 'sampling_plan_id source_video_id does not match plan',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }

  const dryRun = loadMovieAnalysisDryRun(projectRoot, plan.dry_run_id);
  if (!dryRun) {
    issues.push({
      code: 'DRY_RUN_MISSING',
      message: `Dry run ${plan.dry_run_id} not found`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  } else if (dryRun.analysis_plan_id !== plan.analysis_plan_id) {
    issues.push({
      code: 'DRY_RUN_LINK_MISMATCH',
      message: 'dry_run_id analysis_plan_id does not match plan',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }

  const analysisPlan = loadMovieAnalysisPlan(projectRoot, plan.analysis_plan_id);
  if (!analysisPlan) {
    issues.push({
      code: 'ANALYSIS_PLAN_MISSING',
      message: `Analysis plan ${plan.analysis_plan_id} not found`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  } else if (analysisPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'ANALYSIS_PLAN_LINK_MISMATCH',
      message: 'analysis_plan_id source_video_id does not match plan',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }

  const expectedCount = TARGET_STATE_CANDIDATE_COUNTS[plan.source_video_id];
  if (plan.state_candidate_count !== expectedCount) {
    issues.push({
      code: 'CANDIDATE_COUNT_MISMATCH',
      message: `state_candidate_count expected ${expectedCount}, got ${plan.state_candidate_count}`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }
  if (plan.gonegi_states.length !== expectedCount) {
    issues.push({
      code: 'GONEGI_STATE_LENGTH_MISMATCH',
      message: `gonegi_states length expected ${expectedCount}, got ${plan.gonegi_states.length}`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }
  if (plan.source_coordinates.length !== expectedCount) {
    issues.push({
      code: 'SOURCE_COORDINATES_LENGTH_MISMATCH',
      message: `source_coordinates length expected ${expectedCount}, got ${plan.source_coordinates.length}`,
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }

  if (!plan.identity_safety.estimated_only || !plan.identity_safety.no_state_execution) {
    issues.push({
      code: 'IDENTITY_SAFETY_INVALID',
      message: 'identity_safety must enforce estimated_only and no_state_execution',
      severity: 'error',
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    });
  }

  issues.push(...validateStateCategories(plan));
  issues.push(...validateGonegiStates(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
    coordinate_extraction_id: plan.coordinate_extraction_id,
    scene_detection_id: plan.scene_detection_id,
    sampling_plan_id: plan.sampling_plan_id,
    dry_run_id: plan.dry_run_id,
    analysis_plan_id: plan.analysis_plan_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisGonegiStateMappingReport): string {
  const lines = [
    '# Movie Analysis Gonegi State Mapping Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'coordinate candidates',
    '  ↓',
    'gonegi state candidates',
    '  ↓',
    'future video state preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| mapping_plans | ${report.mapping_plans} |`,
    `| registry | ${report.registry} |`,
    `| coordinate_links | ${report.coordinate_links} |`,
    `| scene_links | ${report.scene_links} |`,
    `| sampling_links | ${report.sampling_links} |`,
    `| dry_run_links | ${report.dry_run_links} |`,
    `| analysis_links | ${report.analysis_links} |`,
    `| source_links | ${report.source_links} |`,
    `| state_categories | ${report.state_categories} |`,
    `| candidate_counts_valid | ${report.candidate_counts_valid} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| state_mapping_only | ${report.state_mapping_only} |`,
    `| coordinate_extraction | ${report.coordinate_extraction} |`,
    `| frame_extraction | ${report.frame_extraction} |`,
    `| scene_extraction | ${report.scene_extraction} |`,
    `| ocr | ${report.ocr} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## State Categories',
    '',
    '- environment_state',
    '- character_state',
    '- emotion_state',
    '- camera_state',
    '- lighting_state',
    '- relationship_state',
    '- crowd_state',
    '- animal_state',
    '- transition_state',
    '',
    '## Target State Candidate Counts',
    '',
    '- GHIBLI_01 = 12',
    '- SHINKAI_01 = 12',
    '- LITTLE_WOMEN_01 = 18',
    '- MORI_01 = 12',
    '',
    '## Mapping Strategies',
    '',
    '- WORLD_TRANSLATION_CANDIDATE',
    '- CHARACTER_REPLACEMENT_CANDIDATE',
    '- EMOTION_TRANSLATION_CANDIDATE',
    '- SCENE_STATE_CANDIDATE',
    '',
    '## Gonegi State Mapping Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.gonegi_state_mapping_id}`);
    lines.push('');
    lines.push(`- coordinate_extraction_id: ${validation.coordinate_extraction_id}`);
    lines.push(`- scene_detection_id: ${validation.scene_detection_id}`);
    lines.push(`- sampling_plan_id: ${validation.sampling_plan_id}`);
    lines.push(`- dry_run_id: ${validation.dry_run_id}`);
    lines.push(`- analysis_plan_id: ${validation.analysis_plan_id}`);
    lines.push(`- status: ${validation.status}`);
    if (validation.issues.length > 0) {
      for (const issue of validation.issues) {
        lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
      }
    }
    lines.push('');
  }

  lines.push('**Next phase:** PHASE-SOURCE-VIDEO-028 MOVIE_ANALYSIS_VIDEO_STATE_COMPILATION_DESIGN_V1');

  return lines.join('\n');
}

export function writeMovieAnalysisGonegiStateMappingReport(
  projectRoot?: string
): MovieAnalysisGonegiStateMappingReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GonegiStateMappingValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, DRY_RUN_REGISTRY_PATH))) {
    issues.push({
      code: 'DRY_RUN_REGISTRY_MISSING',
      message: `Missing ${DRY_RUN_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, FRAME_SAMPLING_REGISTRY_PATH))) {
    issues.push({
      code: 'FRAME_SAMPLING_REGISTRY_MISSING',
      message: `Missing ${FRAME_SAMPLING_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, SCENE_DETECTION_REGISTRY_PATH))) {
    issues.push({
      code: 'SCENE_DETECTION_REGISTRY_MISSING',
      message: `Missing ${SCENE_DETECTION_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, COORDINATE_EXTRACTION_REGISTRY_PATH))) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_REGISTRY_MISSING',
      message: `Missing ${COORDINATE_EXTRACTION_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, GONEGI_STATE_MAPPING_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'GONEGI_STATE_MAPPING_REGISTRY_MISSING',
      message: `Missing ${GONEGI_STATE_MAPPING_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: GonegiStateMappingValidationResult[] = [];
  const plans: MovieAnalysisGonegiStateMappingPlan[] = [];

  for (const spec of SEED_GONEGI_STATE_MAPPING_SPECS) {
    const plan = loadMovieAnalysisGonegiStateMappingPlan(root, spec.gonegi_state_mapping_id);
    if (!plan) {
      issues.push({
        code: 'GONEGI_STATE_MAPPING_PLAN_MISSING',
        message: `Missing gonegi state mapping plan: ${spec.gonegi_state_mapping_id}`,
        severity: 'error',
        gonegi_state_mapping_id: spec.gonegi_state_mapping_id,
      });
      planValidations.push({
        gonegi_state_mapping_id: spec.gonegi_state_mapping_id,
        coordinate_extraction_id: spec.coordinate_extraction_id,
        scene_detection_id: 'UNKNOWN',
        sampling_plan_id: 'UNKNOWN',
        dry_run_id: 'UNKNOWN',
        analysis_plan_id: 'UNKNOWN',
        status: 'FAIL',
        issues: [
          {
            code: 'GONEGI_STATE_MAPPING_PLAN_MISSING',
            message: `Plan file not found in ${GONEGI_STATE_MAPPING_PLANS_DIR}`,
            severity: 'error',
            gonegi_state_mapping_id: spec.gonegi_state_mapping_id,
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

  const coordinateLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('COORDINATE_EXTRACTION') || i.code.startsWith('COORDINATE_CANDIDATE')
    )
      ? 'PASS'
      : 'FAIL';

  const sceneLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SCENE_DETECTION'))
      ? 'PASS'
      : 'FAIL';

  const samplingLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SAMPLING'))
      ? 'PASS'
      : 'FAIL';

  const dryRunLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('DRY_RUN'))
      ? 'PASS'
      : 'FAIL';

  const analysisLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('ANALYSIS_PLAN'))
      ? 'PASS'
      : 'FAIL';

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const stateCategories =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.state_categories.length === ALL_STATE_CATEGORIES.length &&
        ALL_STATE_CATEGORIES.every((c) => p.state_categories.includes(c))
    )
      ? 'PASS'
      : 'FAIL';

  const candidateCountsValid =
    plans.length === 4 &&
    plans.every((p) => p.gonegi_states.length === TARGET_STATE_CANDIDATE_COUNTS[p.source_video_id])
      ? 'PASS'
      : 'FAIL';

  const estimatedOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.gonegi_states.every(
          (s) =>
            s.candidate_type === 'estimated_gonegi_state_candidate' &&
            s.estimated_only === true &&
            s.executes_state === false &&
            s.creates_runtime_payload === false
        ) &&
        p.identity_safety.estimated_only &&
        p.identity_safety.no_state_execution
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
    coordinateLinks === 'PASS' &&
    sceneLinks === 'PASS' &&
    samplingLinks === 'PASS' &&
    dryRunLinks === 'PASS' &&
    analysisLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    stateCategories === 'PASS' &&
    candidateCountsValid === 'PASS' &&
    estimatedOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisGonegiStateMappingReport = {
    report_id: 'movie-analysis-gonegi-state-mapping-report-v1',
    phase: GONEGI_STATE_MAPPING_PHASE,
    timestamp,
    mapping_plans: plans.length,
    registry,
    coordinate_links: coordinateLinks,
    scene_links: sceneLinks,
    sampling_links: samplingLinks,
    dry_run_links: dryRunLinks,
    analysis_links: analysisLinks,
    source_links: sourceLinks,
    state_categories: stateCategories,
    candidate_counts_valid: candidateCountsValid,
    estimated_only: estimatedOnly,
    plan_validations: planValidations,
    state_mapping_only: true,
    coordinate_extraction: false,
    frame_extraction: false,
    scene_extraction: false,
    ocr: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass ? GONEGI_STATE_MAPPING_PASS_VERDICT : GONEGI_STATE_MAPPING_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, GONEGI_STATE_MAPPING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GONEGI_STATE_MAPPING_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
