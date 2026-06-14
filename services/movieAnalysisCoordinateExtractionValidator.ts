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
  COORDINATE_EXTRACTION_PHASE,
  COORDINATE_EXTRACTION_REGISTRY_PATH,
  COORDINATE_EXTRACTION_PLANS_DIR,
  ALL_COORDINATE_TYPES,
  SEED_COORDINATE_EXTRACTION_SPECS,
  TARGET_COORDINATE_CANDIDATE_COUNTS,
  type MovieAnalysisCoordinateExtractionPlan,
  loadMovieAnalysisCoordinateExtractionPlan,
} from './movieAnalysisCoordinateExtractionDesign.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const COORDINATE_EXTRACTION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_COORDINATE_EXTRACTION_DESIGN_V1' as const;
export const COORDINATE_EXTRACTION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_COORDINATE_EXTRACTION_DESIGN_V1' as const;
export const COORDINATE_EXTRACTION_REPORT_PATH =
  'reports/movie-analysis-coordinate-extraction-report.json' as const;
export const COORDINATE_EXTRACTION_MD_PATH =
  'reports/MOVIE_ANALYSIS_COORDINATE_EXTRACTION_DESIGN.md' as const;

export type CoordinateExtractionValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  coordinate_extraction_id?: string;
};

export type CoordinateExtractionValidationResult = {
  coordinate_extraction_id: string;
  scene_detection_id: string;
  sampling_plan_id: string;
  dry_run_id: string;
  analysis_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: CoordinateExtractionValidationIssue[];
};

export type MovieAnalysisCoordinateExtractionReport = {
  report_id: string;
  phase: typeof COORDINATE_EXTRACTION_PHASE;
  timestamp: string;
  coordinate_extraction_plans: number;
  registry: 'PASS' | 'FAIL';
  scene_detection_links: 'PASS' | 'FAIL';
  sampling_links: 'PASS' | 'FAIL';
  dry_run_links: 'PASS' | 'FAIL';
  analysis_links: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  coordinate_types: 'PASS' | 'FAIL';
  candidate_counts_valid: 'PASS' | 'FAIL';
  estimated_only: 'PASS' | 'FAIL';
  plan_validations: CoordinateExtractionValidationResult[];
  coordinate_extraction: false;
  frame_extraction: false;
  scene_extraction: false;
  ocr: false;
  gpu_execution: false;
  external_call_allowed: false;
  planning_only: true;
  final_verdict:
    | typeof COORDINATE_EXTRACTION_PASS_VERDICT
    | typeof COORDINATE_EXTRACTION_FAIL_VERDICT;
  issues: CoordinateExtractionValidationIssue[];
};

const FORBIDDEN_CANDIDATE_KEYS = [
  'image_path',
  'frame_path',
  'frame_file',
  'image_file',
  'output_path',
  'asset_path',
  'base64',
  'pixel_data',
  'extracted_coordinate',
  'real_coordinate',
  'validated_timestamp',
  'x_position',
  'y_position',
  'z_position',
] as const;

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function validateExecutionFlags(
  plan: MovieAnalysisCoordinateExtractionPlan
): CoordinateExtractionValidationIssue[] {
  const issues: CoordinateExtractionValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.planning_only !== true) {
    issues.push({
      code: 'PLANNING_ONLY_FALSE',
      message: 'execution_flags.planning_only must be true',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }
  if (flags.coordinate_extraction !== false) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_ENABLED',
      message: 'execution_flags.coordinate_extraction must be false',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }
  if (flags.frame_extraction !== false) {
    issues.push({
      code: 'FRAME_EXTRACTION_ENABLED',
      message: 'execution_flags.frame_extraction must be false',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }
  if (flags.scene_extraction !== false) {
    issues.push({
      code: 'SCENE_EXTRACTION_ENABLED',
      message: 'execution_flags.scene_extraction must be false',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }

  return issues;
}

function validateCoordinateTypes(
  plan: MovieAnalysisCoordinateExtractionPlan
): CoordinateExtractionValidationIssue[] {
  const issues: CoordinateExtractionValidationIssue[] = [];

  if (!plan.coordinate_types || plan.coordinate_types.length === 0) {
    issues.push({
      code: 'COORDINATE_TYPES_MISSING',
      message: 'coordinate_types must be present',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
    return issues;
  }

  for (const expected of ALL_COORDINATE_TYPES) {
    if (!plan.coordinate_types.includes(expected)) {
      issues.push({
        code: 'COORDINATE_TYPE_MISSING',
        message: `coordinate_types must include ${expected}`,
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }
  }

  if (plan.coordinate_types.length !== ALL_COORDINATE_TYPES.length) {
    issues.push({
      code: 'COORDINATE_TYPES_COUNT_MISMATCH',
      message: `coordinate_types must contain exactly ${ALL_COORDINATE_TYPES.length} types`,
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }

  return issues;
}

function validateCoordinateCandidates(
  plan: MovieAnalysisCoordinateExtractionPlan
): CoordinateExtractionValidationIssue[] {
  const issues: CoordinateExtractionValidationIssue[] = [];

  if (!plan.coordinate_candidates || plan.coordinate_candidates.length === 0) {
    issues.push({
      code: 'COORDINATE_CANDIDATES_MISSING',
      message: 'coordinate_candidates must be present',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
    return issues;
  }

  for (const candidate of plan.coordinate_candidates) {
    if (candidate.reads_frame !== false) {
      issues.push({
        code: 'CANDIDATE_READS_FRAME',
        message: `Candidate ${candidate.candidate_id} must not read frames`,
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }
    if (candidate.extracts_coordinate !== false) {
      issues.push({
        code: 'CANDIDATE_EXTRACTS_COORDINATE',
        message: `Candidate ${candidate.candidate_id} must not extract coordinates`,
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }
    if (candidate.validates_timestamp !== false) {
      issues.push({
        code: 'CANDIDATE_VALIDATES_TIMESTAMP',
        message: `Candidate ${candidate.candidate_id} must not validate timestamps from frames`,
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }
    if (candidate.candidate_type !== 'estimated_coordinate_candidate') {
      issues.push({
        code: 'INVALID_CANDIDATE_TYPE',
        message: `Candidate ${candidate.candidate_id} must be estimated_coordinate_candidate only`,
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }
    if (candidate.estimated_only !== true) {
      issues.push({
        code: 'ESTIMATED_ONLY_FALSE',
        message: `Candidate ${candidate.candidate_id} must have estimated_only=true`,
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }
    if (!ALL_COORDINATE_TYPES.includes(candidate.coordinate_type)) {
      issues.push({
        code: 'INVALID_COORDINATE_TYPE',
        message: `Candidate ${candidate.candidate_id} has invalid coordinate_type`,
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }
    if (!candidate.estimated_value || !candidate.estimated_value.startsWith('estimated_')) {
      issues.push({
        code: 'INVALID_ESTIMATED_VALUE',
        message: `Candidate ${candidate.candidate_id} must have estimated placeholder value`,
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }

    for (const key of FORBIDDEN_CANDIDATE_KEYS) {
      if (key in (candidate as Record<string, unknown>)) {
        issues.push({
          code: 'FORBIDDEN_CANDIDATE_FIELD',
          message: `Candidate ${candidate.candidate_id} must not contain ${key}`,
          severity: 'error',
          coordinate_extraction_id: plan.coordinate_extraction_id,
        });
      }
    }
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisCoordinateExtractionPlan,
  finalSet: SourceVideoFinalSet,
  projectRoot: string
): CoordinateExtractionValidationResult {
  const issues: CoordinateExtractionValidationIssue[] = [];

  const sceneDetectionPlan = loadMovieAnalysisSceneDetectionPlan(
    projectRoot,
    plan.scene_detection_id
  );
  if (!sceneDetectionPlan) {
    issues.push({
      code: 'SCENE_DETECTION_MISSING',
      message: `Scene detection plan ${plan.scene_detection_id} not found`,
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  } else {
    if (sceneDetectionPlan.source_video_id !== plan.source_video_id) {
      issues.push({
        code: 'SCENE_DETECTION_LINK_MISMATCH',
        message: 'scene_detection_id source_video_id does not match plan',
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }
    if (sceneDetectionPlan.dry_run_id !== plan.dry_run_id) {
      issues.push({
        code: 'SCENE_DETECTION_DRY_RUN_MISMATCH',
        message: 'scene_detection dry_run_id does not match coordinate extraction plan',
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }
    if (sceneDetectionPlan.sampling_plan_id !== plan.sampling_plan_id) {
      issues.push({
        code: 'SCENE_DETECTION_SAMPLING_MISMATCH',
        message: 'scene_detection sampling_plan_id does not match coordinate extraction plan',
        severity: 'error',
        coordinate_extraction_id: plan.coordinate_extraction_id,
      });
    }

    for (const candidate of plan.coordinate_candidates) {
      const sceneRef = sceneDetectionPlan.scene_candidates.find(
        (s) => s.candidate_id === candidate.scene_candidate_id
      );
      if (!sceneRef) {
        issues.push({
          code: 'SCENE_CANDIDATE_REF_MISSING',
          message: `Candidate ${candidate.candidate_id} references unknown scene_candidate_id`,
          severity: 'error',
          coordinate_extraction_id: plan.coordinate_extraction_id,
        });
      }
    }
  }

  const samplingPlan = loadMovieAnalysisFrameSamplingPlan(projectRoot, plan.sampling_plan_id);
  if (!samplingPlan) {
    issues.push({
      code: 'SAMPLING_PLAN_MISSING',
      message: `Sampling plan ${plan.sampling_plan_id} not found`,
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  } else if (samplingPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'SAMPLING_PLAN_LINK_MISMATCH',
      message: 'sampling_plan_id source_video_id does not match plan',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }

  const dryRun = loadMovieAnalysisDryRun(projectRoot, plan.dry_run_id);
  if (!dryRun) {
    issues.push({
      code: 'DRY_RUN_MISSING',
      message: `Dry run ${plan.dry_run_id} not found`,
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  } else if (dryRun.analysis_plan_id !== plan.analysis_plan_id) {
    issues.push({
      code: 'DRY_RUN_LINK_MISMATCH',
      message: 'dry_run_id analysis_plan_id does not match plan',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }

  const analysisPlan = loadMovieAnalysisPlan(projectRoot, plan.analysis_plan_id);
  if (!analysisPlan) {
    issues.push({
      code: 'ANALYSIS_PLAN_MISSING',
      message: `Analysis plan ${plan.analysis_plan_id} not found`,
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  } else if (analysisPlan.source_video_id !== plan.source_video_id) {
    issues.push({
      code: 'ANALYSIS_PLAN_LINK_MISMATCH',
      message: 'analysis_plan_id source_video_id does not match plan',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not in active final set`,
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }

  const expectedCount = TARGET_COORDINATE_CANDIDATE_COUNTS[plan.source_video_id];
  if (plan.coordinate_candidate_count !== expectedCount) {
    issues.push({
      code: 'CANDIDATE_COUNT_MISMATCH',
      message: `coordinate_candidate_count expected ${expectedCount}, got ${plan.coordinate_candidate_count}`,
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }
  if (plan.coordinate_candidates.length !== expectedCount) {
    issues.push({
      code: 'COORDINATE_CANDIDATE_LENGTH_MISMATCH',
      message: `coordinate_candidates length expected ${expectedCount}, got ${plan.coordinate_candidates.length}`,
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }

  if (!plan.identity_safety.estimated_only || !plan.identity_safety.no_coordinate_extraction) {
    issues.push({
      code: 'IDENTITY_SAFETY_INVALID',
      message: 'identity_safety must enforce estimated_only and no_coordinate_extraction',
      severity: 'error',
      coordinate_extraction_id: plan.coordinate_extraction_id,
    });
  }

  issues.push(...validateCoordinateTypes(plan));
  issues.push(...validateCoordinateCandidates(plan));
  issues.push(...validateExecutionFlags(plan));

  return {
    coordinate_extraction_id: plan.coordinate_extraction_id,
    scene_detection_id: plan.scene_detection_id,
    sampling_plan_id: plan.sampling_plan_id,
    dry_run_id: plan.dry_run_id,
    analysis_plan_id: plan.analysis_plan_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisCoordinateExtractionReport): string {
  const lines = [
    '# Movie Analysis Coordinate Extraction Design',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline',
    '',
    '```',
    'scene candidates',
    '  ↓',
    'coordinate candidates',
    '  ↓',
    'future Gonegi state mapping preparation',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| coordinate_extraction_plans | ${report.coordinate_extraction_plans} |`,
    `| registry | ${report.registry} |`,
    `| scene_detection_links | ${report.scene_detection_links} |`,
    `| sampling_links | ${report.sampling_links} |`,
    `| dry_run_links | ${report.dry_run_links} |`,
    `| analysis_links | ${report.analysis_links} |`,
    `| source_links | ${report.source_links} |`,
    `| coordinate_types | ${report.coordinate_types} |`,
    `| candidate_counts_valid | ${report.candidate_counts_valid} |`,
    `| estimated_only | ${report.estimated_only} |`,
    `| coordinate_extraction | ${report.coordinate_extraction} |`,
    `| frame_extraction | ${report.frame_extraction} |`,
    `| scene_extraction | ${report.scene_extraction} |`,
    `| ocr | ${report.ocr} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| planning_only | ${report.planning_only} |`,
    '',
    '## Coordinate Types',
    '',
    '- shot_scale',
    '- camera_angle',
    '- camera_motion',
    '- subject_position',
    '- blocking',
    '- location_anchor',
    '- lighting_state',
    '- emotion_state',
    '- transition_hint',
    '',
    '## Target Candidate Counts',
    '',
    '- GHIBLI_01 = 12',
    '- SHINKAI_01 = 12',
    '- LITTLE_WOMEN_01 = 18',
    '- MORI_01 = 12',
    '',
    '## Extraction Strategies',
    '',
    '- SHOT_GRAMMAR_CANDIDATE',
    '- CAMERA_MOTION_CANDIDATE',
    '- BLOCKING_CANDIDATE',
    '- EMOTION_LOCATION_CANDIDATE',
    '',
    '## Coordinate Extraction Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.coordinate_extraction_id}`);
    lines.push('');
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

  lines.push('**Next phase:** PHASE-SOURCE-VIDEO-027 MOVIE_ANALYSIS_GONEGI_STATE_MAPPING_DESIGN_V1');

  return lines.join('\n');
}

export function writeMovieAnalysisCoordinateExtractionReport(
  projectRoot?: string
): MovieAnalysisCoordinateExtractionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CoordinateExtractionValidationIssue[] = [];
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

  const registryOk = fs.existsSync(path.join(root, COORDINATE_EXTRACTION_REGISTRY_PATH));
  if (!registryOk) {
    issues.push({
      code: 'COORDINATE_EXTRACTION_REGISTRY_MISSING',
      message: `Missing ${COORDINATE_EXTRACTION_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: CoordinateExtractionValidationResult[] = [];
  const plans: MovieAnalysisCoordinateExtractionPlan[] = [];

  for (const spec of SEED_COORDINATE_EXTRACTION_SPECS) {
    const plan = loadMovieAnalysisCoordinateExtractionPlan(root, spec.coordinate_extraction_id);
    if (!plan) {
      issues.push({
        code: 'COORDINATE_EXTRACTION_PLAN_MISSING',
        message: `Missing coordinate extraction plan: ${spec.coordinate_extraction_id}`,
        severity: 'error',
        coordinate_extraction_id: spec.coordinate_extraction_id,
      });
      planValidations.push({
        coordinate_extraction_id: spec.coordinate_extraction_id,
        scene_detection_id: spec.scene_detection_id,
        sampling_plan_id: 'UNKNOWN',
        dry_run_id: 'UNKNOWN',
        analysis_plan_id: 'UNKNOWN',
        status: 'FAIL',
        issues: [
          {
            code: 'COORDINATE_EXTRACTION_PLAN_MISSING',
            message: `Plan file not found in ${COORDINATE_EXTRACTION_PLANS_DIR}`,
            severity: 'error',
            coordinate_extraction_id: spec.coordinate_extraction_id,
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

  const sceneDetectionLinks =
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SCENE_DETECTION') || i.code.startsWith('SCENE_CANDIDATE'))
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

  const coordinateTypes =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.coordinate_types.length === ALL_COORDINATE_TYPES.length &&
        ALL_COORDINATE_TYPES.every((t) => p.coordinate_types.includes(t))
    )
      ? 'PASS'
      : 'FAIL';

  const candidateCountsValid =
    plans.length === 4 &&
    plans.every(
      (p) => p.coordinate_candidates.length === TARGET_COORDINATE_CANDIDATE_COUNTS[p.source_video_id]
    )
      ? 'PASS'
      : 'FAIL';

  const estimatedOnly =
    plans.length === 4 &&
    plans.every(
      (p) =>
        p.coordinate_candidates.every(
          (c) =>
            c.candidate_type === 'estimated_coordinate_candidate' &&
            c.estimated_only === true &&
            c.reads_frame === false &&
            c.extracts_coordinate === false &&
            c.validates_timestamp === false
        ) &&
        p.identity_safety.estimated_only &&
        p.identity_safety.no_coordinate_extraction
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
    sceneDetectionLinks === 'PASS' &&
    samplingLinks === 'PASS' &&
    dryRunLinks === 'PASS' &&
    analysisLinks === 'PASS' &&
    sourceLinks === 'PASS' &&
    coordinateTypes === 'PASS' &&
    candidateCountsValid === 'PASS' &&
    estimatedOnly === 'PASS' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisCoordinateExtractionReport = {
    report_id: 'movie-analysis-coordinate-extraction-report-v1',
    phase: COORDINATE_EXTRACTION_PHASE,
    timestamp,
    coordinate_extraction_plans: plans.length,
    registry,
    scene_detection_links: sceneDetectionLinks,
    sampling_links: samplingLinks,
    dry_run_links: dryRunLinks,
    analysis_links: analysisLinks,
    source_links: sourceLinks,
    coordinate_types: coordinateTypes,
    candidate_counts_valid: candidateCountsValid,
    estimated_only: estimatedOnly,
    plan_validations: planValidations,
    coordinate_extraction: false,
    frame_extraction: false,
    scene_extraction: false,
    ocr: false,
    gpu_execution: false,
    external_call_allowed: false,
    planning_only: true,
    final_verdict: pass ? COORDINATE_EXTRACTION_PASS_VERDICT : COORDINATE_EXTRACTION_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, COORDINATE_EXTRACTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, COORDINATE_EXTRACTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
