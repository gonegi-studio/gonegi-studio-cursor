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
  GONEGI_STATE_MAPPING_REGISTRY_PATH,
  loadMovieAnalysisGonegiStateMappingPlan,
} from './movieAnalysisGonegiStateMappingDesign.js';
import {
  VIDEO_STATE_COMPILATION_PHASE,
  VIDEO_STATE_COMPILATION_REGISTRY_PATH,
  VIDEO_STATE_COMPILATION_PLANS_DIR,
  ALL_VIDEO_STATE_CATEGORIES,
  SEED_VIDEO_STATE_COMPILATION_SPECS,
  TARGET_VIDEO_STATE_CANDIDATE_COUNTS,
  type MovieAnalysisVideoStateCompilationPlan,
  loadMovieAnalysisVideoStateCompilationPlan,
} from './movieAnalysisVideoStateCompilationDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_STATE_COMPILATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_VIDEO_STATE_COMPILATION_DESIGN_V1' as const;
export const VIDEO_STATE_COMPILATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_VIDEO_STATE_COMPILATION_DESIGN_V1' as const;
export const VIDEO_STATE_COMPILATION_REPORT_PATH =
  'reports/movie-analysis-video-state-compilation-report.json' as const;
export const VIDEO_STATE_COMPILATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_VIDEO_STATE_COMPILATION_DESIGN.md' as const;

export type VideoStateCompilationValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  video_state_compilation_id?: string;
};

export type VideoStateCompilationValidationResult = {
  video_state_compilation_id: string;
  gonegi_state_mapping_id: string;
  coordinate_extraction_id: string;
  scene_detection_id: string;
  sampling_plan_id: string;
  dry_run_id: string;
  analysis_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: VideoStateCompilationValidationIssue[];
};

export type MovieAnalysisVideoStateCompilationReport = {
  report_id: string;
  phase: typeof VIDEO_STATE_COMPILATION_PHASE;
  timestamp: string;
  video_state_compilation_plans: number;
  registry: 'PASS' | 'FAIL';
  gonegi_state_links: 'PASS' | 'FAIL';
  coordinate_links: 'PASS' | 'FAIL';
  scene_links: 'PASS' | 'FAIL';
  sampling_links: 'PASS' | 'FAIL';
  dry_run_links: 'PASS' | 'FAIL';
  analysis_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  video_state_categories: 'PASS' | 'FAIL';
  candidate_counts_valid: 'PASS' | 'FAIL';
  estimated_only: 'PASS' | 'FAIL';
  plan_validations: VideoStateCompilationValidationResult[];
  video_state_compilation_only: true;
  state_execution: false;
  runtime_payload: false;
  coordinate_extraction: false;
  frame_extraction: false;
  scene_extraction: false;
  ocr: false;
  gpu_execution: false;
  external_call_allowed: false;
  planning_only: true;
  final_verdict:
    | typeof VIDEO_STATE_COMPILATION_PASS_VERDICT
    | typeof VIDEO_STATE_COMPILATION_FAIL_VERDICT;
  issues: VideoStateCompilationValidationIssue[];
};

const FORBIDDEN_VIDEO_STATE_KEYS = [
  'runtime_payload',
  'gpu_payload',
  'render_payload',
  'keyframe_path',
  'keyframe_file',
  'keyframe_data',
  'executed_video_state',
  'video_output',
  'image_path',
  'frame_path',
  'asset_path',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisVideoStateCompilationPlan
): VideoStateCompilationValidationIssue[] {
  const issues: VideoStateCompilationValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (flags.video_state_compilation_only !== true) {
    issues.push({
      code: 'VIDEO_STATE_COMPILATION_ONLY_FALSE',
      message: 'execution_flags.video_state_compilation_only must be true',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (flags.state_execution !== false) {
    issues.push({
      code: 'STATE_EXECUTION_ENABLED',
      message: 'execution_flags.state_execution must be false',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (flags.runtime_payload !== false) {
    issues.push({
      code: 'RUNTIME_PAYLOAD_ENABLED',
      message: 'execution_flags.runtime_payload must be false',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (flags.coordinate_extraction !== false) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_ENABLED',
      message: 'execution_flags.coordinate_extraction must be false',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (flags.frame_extraction !== false) {
    issues.push({
      code: 'FRAME_EXTRACTION_ENABLED',
      message: 'execution_flags.frame_extraction must be false',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (flags.scene_extraction !== false) {
    issues.push({
      code: 'SCENE_EXTRACTION_ENABLED',
      message: 'execution_flags.scene_extraction must be false',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  return issues;
}

function validateVideoStateCategories(
  plan: MovieAnalysisVideoStateCompilationPlan
): VideoStateCompilationValidationIssue[] {
  const issues: VideoStateCompilationValidationIssue[] = [];

  if (!plan.video_state_categories || plan.video_state_categories.length === 0) {
    issues.push({
      code: 'VIDEO_STATE_CATEGORIES_MISSING',
      message: 'video_state_categories must be present',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
    return issues;
  }

  for (const expected of ALL_VIDEO_STATE_CATEGORIES) {
    if (!plan.video_state_categories.includes(expected)) {
      issues.push({
        code: 'VIDEO_STATE_CATEGORY_MISSING',
        message: `video_state_categories must include ${expected}`,
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
  }

  if (plan.video_state_categories.length !== ALL_VIDEO_STATE_CATEGORIES.length) {
    issues.push({
      code: 'VIDEO_STATE_CATEGORIES_COUNT_MISMATCH',
      message: `video_state_categories must contain exactly ${ALL_VIDEO_STATE_CATEGORIES.length} categories`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  return issues;
}

function validateVideoStates(
  plan: MovieAnalysisVideoStateCompilationPlan
): VideoStateCompilationValidationIssue[] {
  const issues: VideoStateCompilationValidationIssue[] = [];

  if (!plan.video_states || plan.video_states.length === 0) {
    issues.push({
      code: 'VIDEO_STATES_MISSING',
      message: 'video_states must be present',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
    return issues;
  }

  for (const state of plan.video_states) {
    if (state.executes_video_state !== false) {
      issues.push({
        code: 'VIDEO_STATE_EXECUTION_ENABLED',
        message: `Video state ${state.video_state_id} must not execute video state generation`,
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (state.creates_keyframe !== false) {
      issues.push({
        code: 'KEYFRAME_CREATION_ENABLED',
        message: `Video state ${state.video_state_id} must not create keyframes`,
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (state.creates_runtime_payload !== false) {
      issues.push({
        code: 'RUNTIME_PAYLOAD_CREATION',
        message: `Video state ${state.video_state_id} must not create runtime payloads`,
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (state.candidate_type !== 'estimated_video_state_candidate') {
      issues.push({
        code: 'INVALID_VIDEO_STATE_CANDIDATE_TYPE',
        message: `Video state ${state.video_state_id} must be estimated_video_state_candidate only`,
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (state.estimated_only !== true) {
      issues.push({
        code: 'ESTIMATED_ONLY_FALSE',
        message: `Video state ${state.video_state_id} must have estimated_only=true`,
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (!ALL_VIDEO_STATE_CATEGORIES.includes(state.video_state_category)) {
      issues.push({
        code: 'INVALID_VIDEO_STATE_CATEGORY',
        message: `Video state ${state.video_state_id} has invalid video_state_category`,
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (
      !state.estimated_video_state_value ||
      !state.estimated_video_state_value.startsWith('estimated_video_')
    ) {
      issues.push({
        code: 'INVALID_ESTIMATED_VIDEO_STATE_VALUE',
        message: `Video state ${state.video_state_id} must have estimated video placeholder value`,
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }

    const gonegiRef = plan.gonegi_states.find((g) => g.gonegi_state_id === state.gonegi_state_id);
    if (!gonegiRef) {
      issues.push({
        code: 'GONEGI_STATE_REF_MISSING',
        message: `Video state ${state.video_state_id} references unknown gonegi_state_id`,
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }

    for (const key of FORBIDDEN_VIDEO_STATE_KEYS) {
      if (key in (state as Record<string, unknown>)) {
        issues.push({
          code: 'FORBIDDEN_VIDEO_STATE_FIELD',
          message: `Video state ${state.video_state_id} must not contain ${key}`,
          severity: 'error',
          video_state_compilation_id: plan.video_state_compilation_id,
        });
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisVideoStateCompilationPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): VideoStateCompilationValidationResult {
  const issues: VideoStateCompilationValidationIssue[] = [];

  const mappingPlan = loadMovieAnalysisGonegiStateMappingPlan(
    projectRoot,
    plan.gonegi_state_mapping_id
  );
  if (!mappingPlan) {
    issues.push({
      code: 'GONEGI_STATE_MAPPING_MISSING',
      message: `Gonegi state mapping plan ${plan.gonegi_state_mapping_id} not found`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  } else {
    if (mappingPlan.source_video_id !== plan.source_video_id) {
      issues.push({
        code: 'GONEGI_STATE_MAPPING_LINK_MISMATCH',
        message: 'gonegi_state_mapping_id source_video_id does not match plan',
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (mappingPlan.dry_run_id !== plan.dry_run_id) {
      issues.push({
        code: 'GONEGI_STATE_MAPPING_DRY_RUN_MISMATCH',
        message: 'gonegi_state_mapping dry_run_id does not match compilation plan',
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (mappingPlan.coordinate_extraction_id !== plan.coordinate_extraction_id) {
      issues.push({
        code: 'GONEGI_STATE_MAPPING_COORDINATE_MISMATCH',
        message: 'gonegi_state_mapping coordinate_extraction_id does not match compilation plan',
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (mappingPlan.scene_detection_id !== plan.scene_detection_id) {
      issues.push({
        code: 'GONEGI_STATE_MAPPING_SCENE_MISMATCH',
        message: 'gonegi_state_mapping scene_detection_id does not match compilation plan',
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }
    if (mappingPlan.sampling_plan_id !== plan.sampling_plan_id) {
      issues.push({
        code: 'GONEGI_STATE_MAPPING_SAMPLING_MISMATCH',
        message: 'gonegi_state_mapping sampling_plan_id does not match compilation plan',
        severity: 'error',
        video_state_compilation_id: plan.video_state_compilation_id,
      });
    }

    for (const gonegiRef of plan.gonegi_states) {
      const stateRef = mappingPlan.gonegi_states.find((s) => s.state_id === gonegiRef.gonegi_state_id);
      if (!stateRef) {
        issues.push({
          code: 'GONEGI_STATE_CANDIDATE_REF_MISSING',
          message: `gonegi_states references unknown gonegi_state_id ${gonegiRef.gonegi_state_id}`,
          severity: 'error',
          video_state_compilation_id: plan.video_state_compilation_id,
        });
      }
    }
  }

  const coordinatePlan = loadMovieAnalysisCoordinateExtractionPlan(
    projectRoot,
    plan.coordinate_extraction_id
  );
  if (!coordinatePlan) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_MISSING',
      message: `Coordinate extraction plan ${plan.coordinate_extraction_id} not found`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  } else if (coordinatePlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_LINK_MISMATCH',
      message: 'coordinate_extraction_id source_video_id does not match plan',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
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
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  } else if (sceneDetectionPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'SCENE_DETECTION_LINK_MISMATCH',
      message: 'scene_detection_id source_video_id does not match plan',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  const samplingPlan = loadMovieAnalysisFrameSamplingPlan(projectRoot, plan.sampling_plan_id);
  if (!samplingPlan) {
    issues.push({
      code: 'SAMPLING_PLAN_MISSING',
      message: `Sampling plan ${plan.sampling_plan_id} not found`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  } else if (samplingPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'SAMPLING_PLAN_LINK_MISMATCH',
      message: 'sampling_plan_id source_video_id does not match plan',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  const dryRun = loadMovieAnalysisDryRun(projectRoot, plan.dry_run_id);
  if (!dryRun) {
    issues.push({
      code: 'DRY_RUN_MISSING',
      message: `Dry run ${plan.dry_run_id} not found`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  } else if (dryRun.analysis_plan_id !== plan.analysis_plan_id) {
    issues.push({
      code: 'DRY_RUN_LINK_MISMATCH',
      message: 'dry_run_id analysis_plan_id does not match plan',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  const analysisPlan = loadMovieAnalysisPlan(projectRoot, plan.analysis_plan_id);
  if (!analysisPlan) {
    issues.push({
      code: 'ANALYSIS_PLAN_MISSING',
      message: `Analysis plan ${plan.analysis_plan_id} not found`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  } else if (analysisPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'ANALYSIS_PLAN_LINK_MISMATCH',
      message: 'analysis_plan_id source_video_id does not match plan',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  const expectedCount = TARGET_VIDEO_STATE_CANDIDATE_COUNTS[plan.source_video_id];
  if (plan.video_state_candidate_count !== expectedCount) {
    issues.push({
      code: 'CANDIDATE_COUNT_MISMATCH',
      message: `video_state_candidate_count expected ${expectedCount}, got ${plan.video_state_candidate_count}`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (plan.video_states.length !== expectedCount) {
    issues.push({
      code: 'VIDEO_STATE_LENGTH_MISMATCH',
      message: `video_states length expected ${expectedCount}, got ${plan.video_states.length}`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }
  if (plan.gonegi_states.length !== expectedCount) {
    issues.push({
      code: 'GONEGI_STATES_LENGTH_MISMATCH',
      message: `gonegi_states length expected ${expectedCount}, got ${plan.gonegi_states.length}`,
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  if (!plan.identity_safety.estimated_only || !plan.identity_safety.no_state_execution) {
    issues.push({
      code: 'IDENTITY_SAFETY_INVALID',
      message: 'identity_safety must enforce estimated_only and no_state_execution',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  if (!plan.continuity_safety.estimated_only || !plan.continuity_safety.no_keyframe_creation) {
    issues.push({
      code: 'CONTINUITY_SAFETY_INVALID',
      message: 'continuity_safety must enforce estimated_only and no_keyframe_creation',
      severity: 'error',
      video_state_compilation_id: plan.video_state_compilation_id,
    });
  }

  issues.push(...validateVideoStateCategories(plan));
  issues.push(...validateVideoStates(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    video_state_compilation_id: plan.video_state_compilation_id,
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

function buildMarkdown(report: MovieAnalysisVideoStateCompilationReport): string {
  const lines = [
    '# Movie Analysis Video State Compilation Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'gonegi state candidates',
    '  ↓',
    'video state candidates',
    '  ↓',
    'future keyframe preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| video_state_compilation_plans | ${report.video_state_compilation_plans} |`,
    `| registry | ${report.registry} |`,
    `| gonegi_state_links | ${report.gonegi_state_links} |`,
    `| coordinate_links | ${report.coordinate_links} |`,
    `| scene_links | ${report.scene_links} |`,
    `| sampling_links | ${report.sampling_links} |`,
    `| dry_run_links | ${report.dry_run_links} |`,
    `| analysis_links | ${report.analysis_links} |`,
    `| source_links | ${report.source_links} |`,
    `| video_state_categories | ${report.video_state_categories} |`,
    `| candidate_counts_valid | ${report.candidate_counts_valid} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| video_state_compilation_only | ${report.video_state_compilation_only} |`,
    `| state_execution | ${report.state_execution} |`,
    `| runtime_payload | ${report.runtime_payload} |`,
    `| coordinate_extraction | ${report.coordinate_extraction} |`,
    `| frame_extraction | ${report.frame_extraction} |`,
    `| scene_extraction | ${report.scene_extraction} |`,
    `| ocr | ${report.ocr} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## Video State Categories',
    '',
    '- scene_state',
    '- character_continuity_state',
    '- camera_continuity_state',
    '- motion_intent_state',
    '- lighting_continuity_state',
    '- emotion_continuity_state',
    '- environment_continuity_state',
    '- transition_state',
    '- runtime_readiness_state',
    '',
    '## Target Video State Candidate Counts',
    '',
    '- GHIBLI_01 = 12',
    '- SHINKAI_01 = 12',
    '- LITTLE_WOMEN_01 = 18',
    '- MORI_01 = 12',
    '',
    '## Compilation Strategies',
    '',
    '- SCENE_STATE_COMPILATION_CANDIDATE',
    '- CHARACTER_CONTINUITY_COMPILATION_CANDIDATE',
    '- CAMERA_MOTION_COMPILATION_CANDIDATE',
    '- RUNTIME_READINESS_COMPILATION_CANDIDATE',
    '',
    '## Video State Compilation Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.video_state_compilation_id}`);
    lines.push('');
    lines.push(`- gonegi_state_mapping_id: ${validation.gonegi_state_mapping_id}`);
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

  lines.push('**Next phase:** PHASE-SOURCE-VIDEO-029 MOVIE_ANALYSIS_KEYFRAME_PREPARATION_DESIGN_V1');

  return lines.join('\n');
}

export function writeMovieAnalysisVideoStateCompilationReport(
  projectRoot?: string
): MovieAnalysisVideoStateCompilationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: VideoStateCompilationValidationIssue[] = [];
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

  if (!fs.existsSync(path.join(root, GONEGI_STATE_MAPPING_REGISTRY_PATH))) {
    issues.push({
      code: 'GONEGI_STATE_MAPPING_REGISTRY_MISSING',
      message: `Missing ${GONEGI_STATE_MAPPING_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, VIDEO_STATE_COMPILATION_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'VIDEO_STATE_COMPILATION_REGISTRY_MISSING',
      message: `Missing ${VIDEO_STATE_COMPILATION_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: VideoStateCompilationValidationResult[] = [];
  const plans: MovieAnalysisVideoStateCompilationPlan[] = [];

  for (const spec of SEED_VIDEO_STATE_COMPILATION_SPECS) {
    const plan = loadMovieAnalysisVideoStateCompilationPlan(root, spec.video_state_compilation_id);
    if (!plan) {
      issues.push({
        code: 'VIDEO_STATE_COMPILATION_PLAN_MISSING',
        message: `Missing video state compilation plan: ${spec.video_state_compilation_id}`,
        severity: 'error',
        video_state_compilation_id: spec.video_state_compilation_id,
      });
      planValidations.push({
        video_state_compilation_id: spec.video_state_compilation_id,
        gonegi_state_mapping_id: spec.gonegi_state_mapping_id,
        coordinate_extraction_id: 'UNKNOWN',
        scene_detection_id: 'UNKNOWN',
        sampling_plan_id: 'UNKNOWN',
        dry_run_id: 'UNKNOWN',
        analysis_plan_id: 'UNKNOWN',
        status: 'FAIL',
        issues: [
          {
            code: 'VIDEO_STATE_COMPILATION_PLAN_MISSING',
            message: `Plan file not found in ${VIDEO_STATE_COMPILATION_PLANS_DIR}`,
            severity: 'error',
            video_state_compilation_id: spec.video_state_compilation_id,
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

  const gonegiStateLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('GONEGI_STATE') || i.code.startsWith('GONEGI_STATE_CANDIDATE')
    )
      ? 'PASS'
      : 'FAIL';

  const coordinateLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('COORDINATE_EXTRACTION'))
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

  const videoStateCategories =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.video_state_categories.length === ALL_VIDEO_STATE_CATEGORIES.length &&
        ALL_VIDEO_STATE_CATEGORIES.every((c) => p.video_state_categories.includes(c))
    )
      ? 'PASS'
      : 'FAIL';

  const candidateCountsValid =
    plans.length === 4 &&
    plans.every(
      (p) => p.video_states.length === TARGET_VIDEO_STATE_CANDIDATE_COUNTS[p.source_video_id]
    )
      ? 'PASS'
      : 'FAIL';

  const estimatedOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.video_states.every(
          (s) =>
            s.candidate_type === 'estimated_video_state_candidate' &&
            s.estimated_only === true &&
            s.executes_video_state === false &&
            s.creates_keyframe === false &&
            s.creates_runtime_payload === false
        ) &&
        p.identity_safety.estimated_only &&
        p.continuity_safety.estimated_only
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
    gonegiStateLinks === 'PASS' &&
    coordinateLinks === 'PASS' &&
    sceneLinks === 'PASS' &&
    samplingLinks === 'PASS' &&
    dryRunLinks === 'PASS' &&
    analysisLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    videoStateCategories === 'PASS' &&
    candidateCountsValid === 'PASS' &&
    estimatedOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisVideoStateCompilationReport = {
    report_id: 'movie-analysis-video-state-compilation-report-v1',
    phase: VIDEO_STATE_COMPILATION_PHASE,
    timestamp,
    video_state_compilation_plans: plans.length,
    registry,
    gonegi_state_links: gonegiStateLinks,
    coordinate_links: coordinateLinks,
    scene_links: sceneLinks,
    sampling_links: samplingLinks,
    dry_run_links: dryRunLinks,
    analysis_links: analysisLinks,
    source_links: sourceLinks,
    video_state_categories: videoStateCategories,
    candidate_counts_valid: candidateCountsValid,
    estimated_only: estimatedOnly,
    plan_validations: planValidations,
    video_state_compilation_only: true,
    state_execution: false,
    runtime_payload: false,
    coordinate_extraction: false,
    frame_extraction: false,
    scene_extraction: false,
    ocr: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass
      ? VIDEO_STATE_COMPILATION_PASS_VERDICT
      : VIDEO_STATE_COMPILATION_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, VIDEO_STATE_COMPILATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_STATE_COMPILATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
