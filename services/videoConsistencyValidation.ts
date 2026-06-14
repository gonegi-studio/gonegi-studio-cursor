import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATION_BATCH_SPEC_EXPORT_PATH,
  IMAGE_CONSISTENCY_SCORECARD_EXPORT_PATH,
  IMAGE_CONSISTENCY_SPEC_EXPORT_PATH,
  IMAGE_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
  IMAGE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  IMAGE_CONSISTENCY_VALIDATION_READY_STATUS,
  IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './imageConsistencyValidation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_CONSISTENCY_VALIDATION_PHASE = 'PHASE-L2-CONSISTENCY-002' as const;
export const VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_VIDEO_CONSISTENCY_VALIDATION_SYSTEM_V1' as const;
export const VIDEO_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_VIDEO_CONSISTENCY_VALIDATION_SYSTEM_V1' as const;
export const VIDEO_CONSISTENCY_VALIDATION_READY_STATUS =
  'VIDEO_CONSISTENCY_VALIDATION_READY' as const;

export const VIDEO_CONSISTENCY_SPEC_DATASET_PATH =
  'datasets/consistency/video-consistency-specification.json' as const;
export const VIDEO_CONSISTENCY_SCORECARD_DATASET_PATH =
  'datasets/consistency/video-consistency-scorecard.json' as const;
export const VIDEO_CONSISTENCY_THRESHOLDS_DATASET_PATH =
  'datasets/consistency/video-consistency-thresholds.json' as const;
export const VIDEO_SEQUENCE_SPEC_DATASET_PATH =
  'datasets/consistency/video-sequence-specification.json' as const;
export const MOTION_CONSISTENCY_SPEC_DATASET_PATH =
  'datasets/consistency/motion-consistency-specification.json' as const;
export const TRANSITION_CONSISTENCY_SPEC_DATASET_PATH =
  'datasets/consistency/transition-consistency-specification.json' as const;

export const VIDEO_CONSISTENCY_EXPORT_DIR = 'exports/video_consistency' as const;
export const VIDEO_CONSISTENCY_SPEC_EXPORT_PATH =
  'exports/video_consistency/video-consistency-specification.json' as const;
export const VIDEO_CONSISTENCY_SCORECARD_EXPORT_PATH =
  'exports/video_consistency/video-consistency-scorecard.json' as const;
export const VIDEO_CONSISTENCY_THRESHOLDS_EXPORT_PATH =
  'exports/video_consistency/video-consistency-thresholds.json' as const;
export const VIDEO_SEQUENCE_SPEC_EXPORT_PATH =
  'exports/video_consistency/video-sequence-specification.json' as const;
export const MOTION_CONSISTENCY_SPEC_EXPORT_PATH =
  'exports/video_consistency/motion-consistency-specification.json' as const;
export const TRANSITION_CONSISTENCY_SPEC_EXPORT_PATH =
  'exports/video_consistency/transition-consistency-specification.json' as const;

export const VIDEO_CONSISTENCY_VALIDATION_DIR = 'reports/video_consistency' as const;
export const VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/video_consistency/VIDEO_CONSISTENCY_VALIDATION_REPORT.json' as const;

const IDENTITY_DIMENSIONS = [
  'character_identity',
  'location_identity',
  'lighting_identity',
  'costume_identity',
  'prop_identity',
  'style_identity',
  'composition_identity',
  'camera_identity',
  'motion_identity',
  'transition_identity',
] as const;

const MOTION_DIMENSIONS = [
  'motion_continuity',
  'trajectory_continuity',
  'action_continuity',
] as const;

const TRANSITION_DIMENSIONS = [
  'cut_continuity',
  'camera_transition',
  'scene_transition',
  'temporal_transition',
] as const;

const EXPECTED_SEQUENCE_LENGTHS = [10, 50, 100, 500, 1000] as const;
const EXPECTED_MINIMUM_SCORE = 0.8;
const EXPECTED_TARGET_SCORE = 0.9;
const EXPECTED_PRODUCTION_SCORE = 0.95;

const IMAGE_TRACEABILITY_REFS = [
  IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH,
  IMAGE_CONSISTENCY_SPEC_EXPORT_PATH,
  IMAGE_CONSISTENCY_SCORECARD_EXPORT_PATH,
  IMAGE_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
  GENERATION_BATCH_SPEC_EXPORT_PATH,
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface VideoConsistencySpecification {
  spec_id: string;
  identity_dimension_count: number;
  identity_dimensions: string[];
  upstream_checkpoint: string;
}

interface VideoConsistencyScorecard {
  scorecard_id: string;
  dimensions: { dimension: string; weight: number }[];
  composite_scoring: { weighted_average: boolean; weight_sum: number };
}

interface VideoConsistencyThresholds {
  thresholds_id: string;
  minimum_score: number;
  target_score: number;
  production_score: number;
}

interface VideoSequenceSpecification {
  sequence_spec_id: string;
  sequence_lengths: number[];
  sequence_length_max: number;
}

interface MotionConsistencySpecification {
  motion_spec_id: string;
  motion_dimension_count: number;
  motion_dimensions: string[];
}

interface TransitionConsistencySpecification {
  transition_spec_id: string;
  transition_dimension_count: number;
  transition_dimensions: string[];
}

export interface VideoConsistencyValidationReport {
  report_id: string;
  phase: typeof VIDEO_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    image_consistency_validation_ready: boolean;
    pass_image_consistency_validation_system_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  validation_summary: {
    identity_dimension_count: number;
    motion_dimension_count: number;
    transition_dimension_count: number;
    sequence_length_max: number;
    sequence_spec_exists: boolean;
    motion_spec_exists: boolean;
    transition_spec_exists: boolean;
    threshold_integrity: string;
    traceability_integrity: string;
    scorecard_weight_integrity: string;
  };
  outputs: {
    specification_path: string;
    scorecard_path: string;
    thresholds_path: string;
    sequence_specification_path: string;
    motion_specification_path: string;
    transition_specification_path: string;
  };
  issues: ValidationIssue[];
  video_consistency_validation_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  image_consistency_validation_ready: boolean;
  pass_image_consistency_validation_system_v1: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'IMAGE_CONSISTENCY_REPORT_MISSING',
      message: `Missing image consistency report at ${IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      image_consistency_validation_ready: false,
      pass_image_consistency_validation_system_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const imageReport = readJson<Record<string, unknown>>(root, IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH);
  const status = String(imageReport.status ?? '');
  const verdict = String(imageReport.final_verdict ?? '');

  const image_consistency_validation_ready = status === IMAGE_CONSISTENCY_VALIDATION_READY_STATUS;
  const pass_image_consistency_validation_system_v1 =
    verdict === IMAGE_CONSISTENCY_VALIDATION_PASS_VERDICT;

  if (!image_consistency_validation_ready) {
    issues.push({
      code: 'IMAGE_CONSISTENCY_NOT_READY',
      message: `Expected status=${IMAGE_CONSISTENCY_VALIDATION_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_image_consistency_validation_system_v1) {
    issues.push({
      code: 'IMAGE_CONSISTENCY_VERDICT_FAIL',
      message: `Expected verdict=${IMAGE_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    image_consistency_validation_ready,
    pass_image_consistency_validation_system_v1,
    precheck_passed:
      image_consistency_validation_ready && pass_image_consistency_validation_system_v1,
    issues,
  };
}

function validateThresholdIntegrity(thresholds: VideoConsistencyThresholds): {
  threshold_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (thresholds.minimum_score !== EXPECTED_MINIMUM_SCORE) {
    issues.push({
      code: 'MINIMUM_SCORE_MISMATCH',
      message: `minimum_score=${thresholds.minimum_score}, expected ${EXPECTED_MINIMUM_SCORE}`,
      severity: 'error',
    });
  }
  if (thresholds.target_score !== EXPECTED_TARGET_SCORE) {
    issues.push({
      code: 'TARGET_SCORE_MISMATCH',
      message: `target_score=${thresholds.target_score}, expected ${EXPECTED_TARGET_SCORE}`,
      severity: 'error',
    });
  }
  if (thresholds.production_score !== EXPECTED_PRODUCTION_SCORE) {
    issues.push({
      code: 'PRODUCTION_SCORE_MISMATCH',
      message: `production_score=${thresholds.production_score}, expected ${EXPECTED_PRODUCTION_SCORE}`,
      severity: 'error',
    });
  }
  if (
    !(
      thresholds.minimum_score < thresholds.target_score &&
      thresholds.target_score < thresholds.production_score
    )
  ) {
    issues.push({
      code: 'THRESHOLD_ORDER_INVALID',
      message: 'minimum_score < target_score < production_score required',
      severity: 'error',
    });
  }

  return {
    threshold_integrity: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

function validateScorecard(scorecard: VideoConsistencyScorecard): {
  scorecard_weight_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const dimensionSet = new Set(scorecard.dimensions.map((entry) => entry.dimension));

  for (const dimension of IDENTITY_DIMENSIONS) {
    if (!dimensionSet.has(dimension)) {
      issues.push({
        code: 'SCORECARD_DIMENSION_MISSING',
        message: `Scorecard missing ${dimension}`,
        severity: 'error',
      });
    }
  }

  const weightSum = Number(
    scorecard.dimensions.reduce((sum, entry) => sum + entry.weight, 0).toFixed(4)
  );
  if (weightSum !== 1) {
    issues.push({
      code: 'SCORECARD_WEIGHT_SUM_INVALID',
      message: `weight_sum=${weightSum}, expected 1.0`,
      severity: 'error',
    });
  }

  return {
    scorecard_weight_integrity: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

function validateSpecification(spec: VideoConsistencySpecification): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (spec.identity_dimension_count < IDENTITY_DIMENSIONS.length) {
    issues.push({
      code: 'IDENTITY_DIMENSION_SHORTFALL',
      message: `identity_dimension_count=${spec.identity_dimension_count}`,
      severity: 'error',
    });
  }

  for (const dimension of IDENTITY_DIMENSIONS) {
    if (!spec.identity_dimensions.includes(dimension)) {
      issues.push({
        code: 'SPEC_DIMENSION_MISSING',
        message: `Specification missing ${dimension}`,
        severity: 'error',
      });
    }
  }

  if (spec.upstream_checkpoint !== IMAGE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_CHECKPOINT_MISMATCH',
      message: `upstream_checkpoint=${spec.upstream_checkpoint}`,
      severity: 'error',
    });
  }

  return issues;
}

function validateSequenceSpecification(sequenceSpec: VideoSequenceSpecification): {
  sequence_spec_exists: boolean;
  sequence_length_max: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const length of EXPECTED_SEQUENCE_LENGTHS) {
    if (!sequenceSpec.sequence_lengths.includes(length)) {
      issues.push({
        code: 'SEQUENCE_LENGTH_MISSING',
        message: `Missing sequence length ${length}`,
        severity: 'error',
      });
    }
  }

  if (sequenceSpec.sequence_length_max < 1000) {
    issues.push({
      code: 'SEQUENCE_LENGTH_MAX_LOW',
      message: `sequence_length_max=${sequenceSpec.sequence_length_max}, expected >=1000`,
      severity: 'error',
    });
  }

  return {
    sequence_spec_exists: issues.length === 0,
    sequence_length_max: sequenceSpec.sequence_length_max,
    issues,
  };
}

function validateMotionSpecification(motionSpec: MotionConsistencySpecification): {
  motion_spec_exists: boolean;
  motion_dimension_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (motionSpec.motion_dimension_count < MOTION_DIMENSIONS.length) {
    issues.push({
      code: 'MOTION_DIMENSION_SHORTFALL',
      message: `motion_dimension_count=${motionSpec.motion_dimension_count}`,
      severity: 'error',
    });
  }

  for (const dimension of MOTION_DIMENSIONS) {
    if (!motionSpec.motion_dimensions.includes(dimension)) {
      issues.push({
        code: 'MOTION_DIMENSION_MISSING',
        message: `Missing motion dimension ${dimension}`,
        severity: 'error',
      });
    }
  }

  return {
    motion_spec_exists: issues.length === 0,
    motion_dimension_count: motionSpec.motion_dimensions.length,
    issues,
  };
}

function validateTransitionSpecification(
  transitionSpec: TransitionConsistencySpecification
): {
  transition_spec_exists: boolean;
  transition_dimension_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (transitionSpec.transition_dimension_count < 3) {
    issues.push({
      code: 'TRANSITION_DIMENSION_SHORTFALL',
      message: `transition_dimension_count=${transitionSpec.transition_dimension_count}`,
      severity: 'error',
    });
  }

  for (const dimension of TRANSITION_DIMENSIONS.slice(0, 3)) {
    if (!transitionSpec.transition_dimensions.includes(dimension)) {
      issues.push({
        code: 'TRANSITION_DIMENSION_MISSING',
        message: `Missing transition dimension ${dimension}`,
        severity: 'error',
      });
    }
  }

  return {
    transition_spec_exists: issues.length === 0,
    transition_dimension_count: transitionSpec.transition_dimensions.length,
    issues,
  };
}

function buildTraceabilityAudit(root: string): {
  traceability_integrity: string;
  refs: { ref: string; linked: boolean }[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const refs: { ref: string; linked: boolean }[] = [];

  for (const refPath of IMAGE_TRACEABILITY_REFS) {
    const linked = fs.existsSync(path.join(root, refPath));
    refs.push({ ref: refPath, linked });
    if (!linked) {
      issues.push({
        code: 'TRACEABILITY_REF_MISSING',
        message: `Missing traceability ref ${refPath}`,
        severity: 'error',
      });
    }
  }

  return {
    traceability_integrity: issues.length === 0 ? 'PASS' : 'FAIL',
    refs,
    issues,
  };
}

export function writeVideoConsistencyValidation(
  projectRoot?: string
): VideoConsistencyValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const specification = readJson<VideoConsistencySpecification>(
    root,
    VIDEO_CONSISTENCY_SPEC_DATASET_PATH
  );
  const scorecard = readJson<VideoConsistencyScorecard>(
    root,
    VIDEO_CONSISTENCY_SCORECARD_DATASET_PATH
  );
  const thresholds = readJson<VideoConsistencyThresholds>(
    root,
    VIDEO_CONSISTENCY_THRESHOLDS_DATASET_PATH
  );
  const sequenceSpec = readJson<VideoSequenceSpecification>(
    root,
    VIDEO_SEQUENCE_SPEC_DATASET_PATH
  );
  const motionSpec = readJson<MotionConsistencySpecification>(
    root,
    MOTION_CONSISTENCY_SPEC_DATASET_PATH
  );
  const transitionSpec = readJson<TransitionConsistencySpecification>(
    root,
    TRANSITION_CONSISTENCY_SPEC_DATASET_PATH
  );

  issues.push(...validateSpecification(specification));

  const thresholdValidation = validateThresholdIntegrity(thresholds);
  issues.push(...thresholdValidation.issues);

  const scorecardValidation = validateScorecard(scorecard);
  issues.push(...scorecardValidation.issues);

  const sequenceValidation = validateSequenceSpecification(sequenceSpec);
  issues.push(...sequenceValidation.issues);

  const motionValidation = validateMotionSpecification(motionSpec);
  issues.push(...motionValidation.issues);

  const transitionValidation = validateTransitionSpecification(transitionSpec);
  issues.push(...transitionValidation.issues);

  const traceabilityAudit = buildTraceabilityAudit(root);
  issues.push(...traceabilityAudit.issues);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const systemReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    specification.identity_dimensions.length >= IDENTITY_DIMENSIONS.length &&
    thresholdValidation.threshold_integrity === 'PASS' &&
    sequenceValidation.sequence_spec_exists &&
    motionValidation.motion_spec_exists &&
    transitionValidation.transition_spec_exists &&
    traceabilityAudit.traceability_integrity === 'PASS' &&
    scorecardValidation.scorecard_weight_integrity === 'PASS';

  const specificationExport = {
    ...specification,
    export_id: 'video-consistency-specification-export-v1',
    phase: VIDEO_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: VIDEO_CONSISTENCY_SPEC_DATASET_PATH,
    identity_dimension_count: specification.identity_dimensions.length,
    image_consistency_ref: IMAGE_CONSISTENCY_SPEC_EXPORT_PATH,
    traceability_refs: traceabilityAudit.refs,
  };

  const scorecardExport = {
    ...scorecard,
    export_id: 'video-consistency-scorecard-export-v1',
    phase: VIDEO_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: VIDEO_CONSISTENCY_SCORECARD_DATASET_PATH,
    identity_dimension_count: IDENTITY_DIMENSIONS.length,
    dimension_list: [...IDENTITY_DIMENSIONS],
  };

  const thresholdsExport = {
    ...thresholds,
    export_id: 'video-consistency-thresholds-export-v1',
    phase: VIDEO_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: VIDEO_CONSISTENCY_THRESHOLDS_DATASET_PATH,
    threshold_integrity: thresholdValidation.threshold_integrity,
  };

  const sequenceSpecExport = {
    ...sequenceSpec,
    export_id: 'video-sequence-specification-export-v1',
    phase: VIDEO_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: VIDEO_SEQUENCE_SPEC_DATASET_PATH,
    sequence_spec_exists: sequenceValidation.sequence_spec_exists,
    supported_sequence_lengths: [...EXPECTED_SEQUENCE_LENGTHS],
  };

  const motionSpecExport = {
    ...motionSpec,
    export_id: 'motion-consistency-specification-export-v1',
    phase: VIDEO_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: MOTION_CONSISTENCY_SPEC_DATASET_PATH,
    motion_spec_exists: motionValidation.motion_spec_exists,
    motion_dimension_list: [...MOTION_DIMENSIONS],
  };

  const transitionSpecExport = {
    ...transitionSpec,
    export_id: 'transition-consistency-specification-export-v1',
    phase: VIDEO_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: TRANSITION_CONSISTENCY_SPEC_DATASET_PATH,
    transition_spec_exists: transitionValidation.transition_spec_exists,
    transition_dimension_list: [...TRANSITION_DIMENSIONS],
  };

  const report: VideoConsistencyValidationReport = {
    report_id: 'video-consistency-validation-report-v1',
    phase: VIDEO_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: systemReady
      ? VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT
      : VIDEO_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    status: systemReady
      ? VIDEO_CONSISTENCY_VALIDATION_READY_STATUS
      : 'VIDEO_CONSISTENCY_VALIDATION_INCOMPLETE',
    precheck,
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    validation_summary: {
      identity_dimension_count: specification.identity_dimensions.length,
      motion_dimension_count: motionValidation.motion_dimension_count,
      transition_dimension_count: transitionValidation.transition_dimension_count,
      sequence_length_max: sequenceValidation.sequence_length_max,
      sequence_spec_exists: sequenceValidation.sequence_spec_exists,
      motion_spec_exists: motionValidation.motion_spec_exists,
      transition_spec_exists: transitionValidation.transition_spec_exists,
      threshold_integrity: thresholdValidation.threshold_integrity,
      traceability_integrity: traceabilityAudit.traceability_integrity,
      scorecard_weight_integrity: scorecardValidation.scorecard_weight_integrity,
    },
    outputs: {
      specification_path: VIDEO_CONSISTENCY_SPEC_EXPORT_PATH,
      scorecard_path: VIDEO_CONSISTENCY_SCORECARD_EXPORT_PATH,
      thresholds_path: VIDEO_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
      sequence_specification_path: VIDEO_SEQUENCE_SPEC_EXPORT_PATH,
      motion_specification_path: MOTION_CONSISTENCY_SPEC_EXPORT_PATH,
      transition_specification_path: TRANSITION_CONSISTENCY_SPEC_EXPORT_PATH,
    },
    issues,
    video_consistency_validation_ready: systemReady,
  };

  fs.mkdirSync(path.join(root, VIDEO_CONSISTENCY_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, VIDEO_CONSISTENCY_VALIDATION_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, VIDEO_CONSISTENCY_SPEC_EXPORT_PATH),
    `${JSON.stringify(specificationExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_CONSISTENCY_SCORECARD_EXPORT_PATH),
    `${JSON.stringify(scorecardExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_CONSISTENCY_THRESHOLDS_EXPORT_PATH),
    `${JSON.stringify(thresholdsExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_SEQUENCE_SPEC_EXPORT_PATH),
    `${JSON.stringify(sequenceSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MOTION_CONSISTENCY_SPEC_EXPORT_PATH),
    `${JSON.stringify(motionSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TRANSITION_CONSISTENCY_SPEC_EXPORT_PATH),
    `${JSON.stringify(transitionSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
