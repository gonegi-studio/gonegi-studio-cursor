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
  VIDEO_STATE_COMPILATION_REGISTRY_PATH,
  loadMovieAnalysisVideoStateCompilationPlan,
} from './movieAnalysisVideoStateCompilationDesign.js';
import {
  KEYFRAME_PREPARATION_PHASE,
  KEYFRAME_PREPARATION_REGISTRY_PATH,
  KEYFRAME_PREPARATION_PLANS_DIR,
  ALL_KEYFRAME_ROLES,
  SEED_KEYFRAME_PREPARATION_SPECS,
  TARGET_KEYFRAME_CANDIDATE_COUNTS,
  type MovieAnalysisKeyframePreparationPlan,
  loadMovieAnalysisKeyframePreparationPlan,
} from './movieAnalysisKeyframePreparationDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const KEYFRAME_PREPARATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_KEYFRAME_PREPARATION_DESIGN_V1' as const;
export const KEYFRAME_PREPARATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_KEYFRAME_PREPARATION_DESIGN_V1' as const;
export const KEYFRAME_PREPARATION_REPORT_PATH =
  'reports/movie-analysis-keyframe-preparation-report.json' as const;
export const KEYFRAME_PREPARATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_KEYFRAME_PREPARATION_DESIGN.md' as const;

export type KeyframePreparationValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  keyframe_preparation_id?: string;
};

export type KeyframePreparationValidationResult = {
  keyframe_preparation_id: string;
  video_state_compilation_id: string;
  gonegi_state_mapping_id: string;
  coordinate_extraction_id: string;
  scene_detection_id: string;
  sampling_plan_id: string;
  dry_run_id: string;
  analysis_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: KeyframePreparationValidationIssue[];
};

export type MovieAnalysisKeyframePreparationReport = {
  report_id: string;
  phase: typeof KEYFRAME_PREPARATION_PHASE;
  timestamp: string;
  keyframe_preparation_plans: number;
  registry: 'PASS' | 'FAIL';
  video_state_links: 'PASS' | 'FAIL';
  gonegi_state_links: 'PASS' | 'FAIL';
  coordinate_links: 'PASS' | 'FAIL';
  scene_links: 'PASS' | 'FAIL';
  sampling_links: 'PASS' | 'FAIL';
  dry_run_links: 'PASS' | 'FAIL';
  analysis_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  keyframe_roles: 'PASS' | 'FAIL';
  candidate_counts_valid: 'PASS' | 'FAIL';
  estimated_only: 'PASS' | 'FAIL';
  plan_validations: KeyframePreparationValidationResult[];
  keyframe_preparation_only: true;
  keyframe_generation: false;
  image_generation: false;
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
    | typeof KEYFRAME_PREPARATION_PASS_VERDICT
    | typeof KEYFRAME_PREPARATION_FAIL_VERDICT;
  issues: KeyframePreparationValidationIssue[];
};

const FORBIDDEN_KEYFRAME_KEYS = [
  'image_path',
  'keyframe_path',
  'keyframe_file',
  'keyframe_data',
  'generated_image',
  'runtime_payload',
  'gpu_payload',
  'render_payload',
  'base64',
  'pixel_data',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisKeyframePreparationPlan
): KeyframePreparationValidationIssue[] {
  const issues: KeyframePreparationValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.keyframe_preparation_only !== true) {
    issues.push({
      code: 'KEYFRAME_PREPARATION_ONLY_FALSE',
      message: 'execution_flags.keyframe_preparation_only must be true',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.keyframe_generation !== false) {
    issues.push({
      code: 'KEYFRAME_GENERATION_ENABLED',
      message: 'execution_flags.keyframe_generation must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.image_generation !== false) {
    issues.push({
      code: 'IMAGE_GENERATION_ENABLED',
      message: 'execution_flags.image_generation must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.state_execution !== false) {
    issues.push({
      code: 'STATE_EXECUTION_ENABLED',
      message: 'execution_flags.state_execution must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.runtime_payload !== false) {
    issues.push({
      code: 'RUNTIME_PAYLOAD_ENABLED',
      message: 'execution_flags.runtime_payload must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.coordinate_extraction !== false) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_ENABLED',
      message: 'execution_flags.coordinate_extraction must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.frame_extraction !== false) {
    issues.push({
      code: 'FRAME_EXTRACTION_ENABLED',
      message: 'execution_flags.frame_extraction must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.scene_extraction !== false) {
    issues.push({
      code: 'SCENE_EXTRACTION_ENABLED',
      message: 'execution_flags.scene_extraction must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  return issues;
}

function validateKeyframeRoles(
  plan: MovieAnalysisKeyframePreparationPlan
): KeyframePreparationValidationIssue[] {
  const issues: KeyframePreparationValidationIssue[] = [];

  if (!plan.keyframe_roles || plan.keyframe_roles.length === 0) {
    issues.push({
      code: 'KEYFRAME_ROLES_MISSING',
      message: 'keyframe_roles must be present',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
    return issues;
  }

  for (const expected of ALL_KEYFRAME_ROLES) {
    if (!plan.keyframe_roles.includes(expected)) {
      issues.push({
        code: 'KEYFRAME_ROLE_MISSING',
        message: `keyframe_roles must include ${expected}`,
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }
  }

  if (plan.keyframe_roles.length !== ALL_KEYFRAME_ROLES.length) {
    issues.push({
      code: 'KEYFRAME_ROLES_COUNT_MISMATCH',
      message: `keyframe_roles must contain exactly ${ALL_KEYFRAME_ROLES.length} roles`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  return issues;
}

function validateKeyframeCandidates(
  plan: MovieAnalysisKeyframePreparationPlan
): KeyframePreparationValidationIssue[] {
  const issues: KeyframePreparationValidationIssue[] = [];

  if (!plan.keyframe_candidates || plan.keyframe_candidates.length === 0) {
    issues.push({
      code: 'KEYFRAME_CANDIDATES_MISSING',
      message: 'keyframe_candidates must be present',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
    return issues;
  }

  for (const candidate of plan.keyframe_candidates) {
    if (candidate.generates_keyframe !== false) {
      issues.push({
        code: 'KEYFRAME_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.keyframe_candidate_id} must not generate keyframes`,
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }
    if (candidate.generates_image !== false) {
      issues.push({
        code: 'IMAGE_GENERATION_CANDIDATE',
        message: `Candidate ${candidate.keyframe_candidate_id} must not generate images`,
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }
    if (candidate.creates_runtime_payload !== false) {
      issues.push({
        code: 'RUNTIME_PAYLOAD_CREATION',
        message: `Candidate ${candidate.keyframe_candidate_id} must not create runtime payloads`,
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }
    if (candidate.candidate_type !== 'estimated_keyframe_candidate') {
      issues.push({
        code: 'INVALID_KEYFRAME_CANDIDATE_TYPE',
        message: `Candidate ${candidate.keyframe_candidate_id} must be estimated_keyframe_candidate only`,
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }
    if (candidate.estimated_only !== true) {
      issues.push({
        code: 'ESTIMATED_ONLY_FALSE',
        message: `Candidate ${candidate.keyframe_candidate_id} must have estimated_only=true`,
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }
    if (!ALL_KEYFRAME_ROLES.includes(candidate.keyframe_role)) {
      issues.push({
        code: 'INVALID_KEYFRAME_ROLE',
        message: `Candidate ${candidate.keyframe_candidate_id} has invalid keyframe_role`,
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }
    if (
      !candidate.estimated_keyframe_value ||
      !candidate.estimated_keyframe_value.startsWith('estimated_keyframe_')
    ) {
      issues.push({
        code: 'INVALID_ESTIMATED_KEYFRAME_VALUE',
        message: `Candidate ${candidate.keyframe_candidate_id} must have estimated keyframe placeholder value`,
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }

    const videoRef = plan.video_states.find((v) => v.video_state_id === candidate.video_state_id);
    if (!videoRef) {
      issues.push({
        code: 'VIDEO_STATE_REF_MISSING',
        message: `Candidate ${candidate.keyframe_candidate_id} references unknown video_state_id`,
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }

    for (const key of FORBIDDEN_KEYFRAME_KEYS) {
      if (key in (candidate as Record<string, unknown>)) {
        issues.push({
          code: 'FORBIDDEN_KEYFRAME_FIELD',
          message: `Candidate ${candidate.keyframe_candidate_id} must not contain ${key}`,
          severity: 'error',
          keyframe_preparation_id: plan.keyframe_preparation_id,
        });
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisKeyframePreparationPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): KeyframePreparationValidationResult {
  const issues: KeyframePreparationValidationIssue[] = [];

  const compilationPlan = loadMovieAnalysisVideoStateCompilationPlan(
    projectRoot,
    plan.video_state_compilation_id
  );
  if (!compilationPlan) {
    issues.push({
      code: 'VIDEO_STATE_COMPILATION_MISSING',
      message: `Video state compilation plan ${plan.video_state_compilation_id} not found`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  } else {
    if (compilationPlan.source_video_id !== plan.source_video_id) {
      issues.push({
        code: 'VIDEO_STATE_COMPILATION_LINK_MISMATCH',
        message: 'video_state_compilation_id source_video_id does not match plan',
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }
    if (compilationPlan.dry_run_id !== plan.dry_run_id) {
      issues.push({
        code: 'VIDEO_STATE_COMPILATION_DRY_RUN_MISMATCH',
        message: 'video_state_compilation dry_run_id does not match preparation plan',
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }
    if (compilationPlan.gonegi_state_mapping_id !== plan.gonegi_state_mapping_id) {
      issues.push({
        code: 'VIDEO_STATE_COMPILATION_GONEGI_MISMATCH',
        message: 'video_state_compilation gonegi_state_mapping_id does not match preparation plan',
        severity: 'error',
        keyframe_preparation_id: plan.keyframe_preparation_id,
      });
    }

    for (const videoRef of plan.video_states) {
      const stateRef = compilationPlan.video_states.find(
        (s) => s.video_state_id === videoRef.video_state_id
      );
      if (!stateRef) {
        issues.push({
          code: 'VIDEO_STATE_CANDIDATE_REF_MISSING',
          message: `video_states references unknown video_state_id ${videoRef.video_state_id}`,
          severity: 'error',
          keyframe_preparation_id: plan.keyframe_preparation_id,
        });
      }
    }
  }

  const mappingPlan = loadMovieAnalysisGonegiStateMappingPlan(
    projectRoot,
    plan.gonegi_state_mapping_id
  );
  if (!mappingPlan) {
    issues.push({
      code: 'GONEGI_STATE_MAPPING_MISSING',
      message: `Gonegi state mapping plan ${plan.gonegi_state_mapping_id} not found`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  } else if (mappingPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'GONEGI_STATE_MAPPING_LINK_MISMATCH',
      message: 'gonegi_state_mapping_id source_video_id does not match plan',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
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
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  } else if (coordinatePlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_LINK_MISMATCH',
      message: 'coordinate_extraction_id source_video_id does not match plan',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
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
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  } else if (sceneDetectionPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'SCENE_DETECTION_LINK_MISMATCH',
      message: 'scene_detection_id source_video_id does not match plan',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  const samplingPlan = loadMovieAnalysisFrameSamplingPlan(projectRoot, plan.sampling_plan_id);
  if (!samplingPlan) {
    issues.push({
      code: 'SAMPLING_PLAN_MISSING',
      message: `Sampling plan ${plan.sampling_plan_id} not found`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  } else if (samplingPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'SAMPLING_PLAN_LINK_MISMATCH',
      message: 'sampling_plan_id source_video_id does not match plan',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  const dryRun = loadMovieAnalysisDryRun(projectRoot, plan.dry_run_id);
  if (!dryRun) {
    issues.push({
      code: 'DRY_RUN_MISSING',
      message: `Dry run ${plan.dry_run_id} not found`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  } else if (dryRun.analysis_plan_id !== plan.analysis_plan_id) {
    issues.push({
      code: 'DRY_RUN_LINK_MISMATCH',
      message: 'dry_run_id analysis_plan_id does not match plan',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  const analysisPlan = loadMovieAnalysisPlan(projectRoot, plan.analysis_plan_id);
  if (!analysisPlan) {
    issues.push({
      code: 'ANALYSIS_PLAN_MISSING',
      message: `Analysis plan ${plan.analysis_plan_id} not found`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  } else if (analysisPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'ANALYSIS_PLAN_LINK_MISMATCH',
      message: 'analysis_plan_id source_video_id does not match plan',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  const expectedCount = TARGET_KEYFRAME_CANDIDATE_COUNTS[plan.source_video_id];
  if (plan.keyframe_candidate_count !== expectedCount) {
    issues.push({
      code: 'CANDIDATE_COUNT_MISMATCH',
      message: `keyframe_candidate_count expected ${expectedCount}, got ${plan.keyframe_candidate_count}`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (plan.keyframe_candidates.length !== expectedCount) {
    issues.push({
      code: 'KEYFRAME_CANDIDATE_LENGTH_MISMATCH',
      message: `keyframe_candidates length expected ${expectedCount}, got ${plan.keyframe_candidates.length}`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }
  if (plan.video_states.length !== expectedCount) {
    issues.push({
      code: 'VIDEO_STATES_LENGTH_MISMATCH',
      message: `video_states length expected ${expectedCount}, got ${plan.video_states.length}`,
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  if (!plan.identity_safety.estimated_only || !plan.identity_safety.no_image_generation) {
    issues.push({
      code: 'IDENTITY_SAFETY_INVALID',
      message: 'identity_safety must enforce estimated_only and no_image_generation',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  if (!plan.continuity_safety.estimated_only || !plan.continuity_safety.no_keyframe_generation) {
    issues.push({
      code: 'CONTINUITY_SAFETY_INVALID',
      message: 'continuity_safety must enforce estimated_only and no_keyframe_generation',
      severity: 'error',
      keyframe_preparation_id: plan.keyframe_preparation_id,
    });
  }

  issues.push(...validateKeyframeRoles(plan));
  issues.push(...validateKeyframeCandidates(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    keyframe_preparation_id: plan.keyframe_preparation_id,
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

function buildMarkdown(report: MovieAnalysisKeyframePreparationReport): string {
  const lines = [
    '# Movie Analysis Keyframe Preparation Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'video state candidates',
    '  ↓',
    'keyframe candidates',
    '  ↓',
    'future motion planning preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| keyframe_preparation_plans | ${report.keyframe_preparation_plans} |`,
    `| registry | ${report.registry} |`,
    `| video_state_links | ${report.video_state_links} |`,
    `| gonegi_state_links | ${report.gonegi_state_links} |`,
    `| coordinate_links | ${report.coordinate_links} |`,
    `| scene_links | ${report.scene_links} |`,
    `| sampling_links | ${report.sampling_links} |`,
    `| dry_run_links | ${report.dry_run_links} |`,
    `| analysis_links | ${report.analysis_links} |`,
    `| source_links | ${report.source_links} |`,
    `| keyframe_roles | ${report.keyframe_roles} |`,
    `| candidate_counts_valid | ${report.candidate_counts_valid} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| keyframe_preparation_only | ${report.keyframe_preparation_only} |`,
    `| keyframe_generation | ${report.keyframe_generation} |`,
    `| image_generation | ${report.image_generation} |`,
    `| state_execution | ${report.state_execution} |`,
    `| runtime_payload | ${report.runtime_payload} |`,
    `| frame_extraction | ${report.frame_extraction} |`,
    `| scene_extraction | ${report.scene_extraction} |`,
    `| ocr | ${report.ocr} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## Keyframe Roles',
    '',
    '- establishing_keyframe',
    '- character_identity_keyframe',
    '- emotion_keyframe',
    '- blocking_keyframe',
    '- camera_anchor_keyframe',
    '- lighting_anchor_keyframe',
    '- transition_keyframe',
    '- motion_start_keyframe',
    '- motion_end_keyframe',
    '',
    '## Target Keyframe Candidate Counts',
    '',
    '- GHIBLI_01 = 12',
    '- SHINKAI_01 = 12',
    '- LITTLE_WOMEN_01 = 18',
    '- MORI_01 = 12',
    '',
    '## Preparation Strategies',
    '',
    '- SCENE_ANCHOR_KEYFRAME_CANDIDATE',
    '- CHARACTER_IDENTITY_KEYFRAME_CANDIDATE',
    '- EMOTION_BLOCKING_KEYFRAME_CANDIDATE',
    '- MOTION_BRIDGE_KEYFRAME_CANDIDATE',
    '',
    '## Keyframe Preparation Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.keyframe_preparation_id}`);
    lines.push('');
    lines.push(`- video_state_compilation_id: ${validation.video_state_compilation_id}`);
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

  lines.push('**Next phase:** PHASE-SOURCE-VIDEO-030 MOVIE_ANALYSIS_MOTION_PLANNING_DESIGN_V1');

  return lines.join('\n');
}

export function writeMovieAnalysisKeyframePreparationReport(
  projectRoot?: string
): MovieAnalysisKeyframePreparationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: KeyframePreparationValidationIssue[] = [];
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

  if (!fs.existsSync(path.join(root, VIDEO_STATE_COMPILATION_REGISTRY_PATH))) {
    issues.push({
      code: 'VIDEO_STATE_COMPILATION_REGISTRY_MISSING',
      message: `Missing ${VIDEO_STATE_COMPILATION_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const registryOk = fs.existsSync(path.join(root, KEYFRAME_PREPARATION_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'KEYFRAME_PREPARATION_REGISTRY_MISSING',
      message: `Missing ${KEYFRAME_PREPARATION_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: KeyframePreparationValidationResult[] = [];
  const plans: MovieAnalysisKeyframePreparationPlan[] = [];

  for (const spec of SEED_KEYFRAME_PREPARATION_SPECS) {
    const plan = loadMovieAnalysisKeyframePreparationPlan(root, spec.keyframe_preparation_id);
    if (!plan) {
      issues.push({
        code: 'KEYFRAME_PREPARATION_PLAN_MISSING',
        message: `Missing keyframe preparation plan: ${spec.keyframe_preparation_id}`,
        severity: 'error',
        keyframe_preparation_id: spec.keyframe_preparation_id,
      });
      planValidations.push({
        keyframe_preparation_id: spec.keyframe_preparation_id,
        video_state_compilation_id: spec.video_state_compilation_id,
        gonegi_state_mapping_id: 'UNKNOWN',
        coordinate_extraction_id: 'UNKNOWN',
        scene_detection_id: 'UNKNOWN',
        sampling_plan_id: 'UNKNOWN',
        dry_run_id: 'UNKNOWN',
        analysis_plan_id: 'UNKNOWN',
        status: 'FAIL',
        issues: [
          {
            code: 'KEYFRAME_PREPARATION_PLAN_MISSING',
            message: `Plan file not found in ${KEYFRAME_PREPARATION_PLANS_DIR}`,
            severity: 'error',
            keyframe_preparation_id: spec.keyframe_preparation_id,
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

  const videoStateLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some(
      (i) => i.code.startsWith('VIDEO_STATE') || i.code.startsWith('VIDEO_STATE_CANDIDATE')
    )
      ? 'PASS'
      : 'FAIL';

  const gonegiStateLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('GONEGI_STATE'))
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

  const keyframeRoles =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.keyframe_roles.length === ALL_KEYFRAME_ROLES.length &&
        ALL_KEYFRAME_ROLES.every((r) => p.keyframe_roles.includes(r))
    )
      ? 'PASS'
      : 'FAIL';

  const candidateCountsValid =
    plans.length === 4 &&
    plans.every(
      (p) => p.keyframe_candidates.length === TARGET_KEYFRAME_CANDIDATE_COUNTS[p.source_video_id]
    )
      ? 'PASS'
      : 'FAIL';

  const estimatedOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.keyframe_candidates.every(
          (c) =>
            c.candidate_type === 'estimated_keyframe_candidate' &&
            c.estimated_only === true &&
            c.generates_keyframe === false &&
            c.generates_image === false &&
            c.creates_runtime_payload === false
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
    videoStateLinks === 'PASS' &&
    gonegiStateLinks === 'PASS' &&
    coordinateLinks === 'PASS' &&
    sceneLinks === 'PASS' &&
    samplingLinks === 'PASS' &&
    dryRunLinks === 'PASS' &&
    analysisLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    keyframeRoles === 'PASS' &&
    candidateCountsValid === 'PASS' &&
    estimatedOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisKeyframePreparationReport = {
    report_id: 'movie-analysis-keyframe-preparation-report-v1',
    phase: KEYFRAME_PREPARATION_PHASE,
    timestamp,
    keyframe_preparation_plans: plans.length,
    registry,
    video_state_links: videoStateLinks,
    gonegi_state_links: gonegiStateLinks,
    coordinate_links: coordinateLinks,
    scene_links: sceneLinks,
    sampling_links: samplingLinks,
    dry_run_links: dryRunLinks,
    analysis_links: analysisLinks,
    source_links: sourceLinks,
    keyframe_roles: keyframeRoles,
    candidate_counts_valid: candidateCountsValid,
    estimated_only: estimatedOnly,
    plan_validations: planValidations,
    keyframe_preparation_only: true,
    keyframe_generation: false,
    image_generation: false,
    state_execution: false,
    runtime_payload: false,
    coordinate_extraction: false,
    frame_extraction: false,
    scene_extraction: false,
    ocr: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass ? KEYFRAME_PREPARATION_PASS_VERDICT : KEYFRAME_PREPARATION_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, KEYFRAME_PREPARATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, KEYFRAME_PREPARATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
