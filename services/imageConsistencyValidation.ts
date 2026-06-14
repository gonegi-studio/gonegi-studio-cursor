import fs from 'node:fs';
import path from 'node:path';
import {
  FEATURE_FILM_PRODUCTION_READINESS_PATH,
  FEATURE_FILM_PRODUCTION_READY_STATUS,
  FEATURE_FILM_PRODUCTION_VALIDATION_PASS_VERDICT,
  FEATURE_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from './featureFilmProductionValidation.js';
import {
  MEDIUM_FILM_PRODUCTION_READINESS_PATH,
  MEDIUM_FILM_PRODUCTION_READY_STATUS,
  MEDIUM_FILM_PRODUCTION_VALIDATION_PASS_VERDICT,
  MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from './mediumFilmProductionValidation.js';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from './mvProductionReadyBaselineSnapshot.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SHORT_FILM_PRODUCTION_READINESS_PATH,
  SHORT_FILM_PRODUCTION_READY_STATUS,
  SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT,
  SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from './shortFilmProductionValidation.js';

export const IMAGE_CONSISTENCY_VALIDATION_PHASE = 'PHASE-L2-CONSISTENCY-001' as const;
export const IMAGE_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_IMAGE_CONSISTENCY_VALIDATION_SYSTEM_V1' as const;
export const IMAGE_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_IMAGE_CONSISTENCY_VALIDATION_SYSTEM_V1' as const;
export const IMAGE_CONSISTENCY_VALIDATION_READY_STATUS =
  'IMAGE_CONSISTENCY_VALIDATION_READY' as const;
export const LEVEL3_DIGITAL_STUDIO_COMPLETE_STATUS = 'LEVEL3_DIGITAL_STUDIO_COMPLETE' as const;

export const IMAGE_CONSISTENCY_DATASET_DIR = 'datasets/consistency' as const;
export const IMAGE_CONSISTENCY_SPEC_DATASET_PATH =
  'datasets/consistency/image-consistency-specification.json' as const;
export const IMAGE_CONSISTENCY_SCORECARD_DATASET_PATH =
  'datasets/consistency/image-consistency-scorecard.json' as const;
export const IMAGE_CONSISTENCY_THRESHOLDS_DATASET_PATH =
  'datasets/consistency/image-consistency-thresholds.json' as const;
export const GENERATION_BATCH_SPEC_DATASET_PATH =
  'datasets/consistency/generation-batch-specification.json' as const;

export const IMAGE_CONSISTENCY_EXPORT_DIR = 'exports/image_consistency' as const;
export const IMAGE_CONSISTENCY_SPEC_EXPORT_PATH =
  'exports/image_consistency/image-consistency-specification.json' as const;
export const IMAGE_CONSISTENCY_SCORECARD_EXPORT_PATH =
  'exports/image_consistency/image-consistency-scorecard.json' as const;
export const IMAGE_CONSISTENCY_THRESHOLDS_EXPORT_PATH =
  'exports/image_consistency/image-consistency-thresholds.json' as const;
export const GENERATION_BATCH_SPEC_EXPORT_PATH =
  'exports/image_consistency/generation-batch-specification.json' as const;

export const IMAGE_CONSISTENCY_VALIDATION_DIR = 'reports/image_consistency' as const;
export const IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/image_consistency/IMAGE_CONSISTENCY_VALIDATION_REPORT.json' as const;

const IDENTITY_DIMENSIONS = [
  'character_identity',
  'location_identity',
  'lighting_identity',
  'costume_identity',
  'prop_identity',
  'style_identity',
  'composition_identity',
  'camera_identity',
] as const;

const EXPECTED_BATCH_SIZES = [100, 500, 1000, 5000] as const;
const EXPECTED_MINIMUM_SCORE = 0.8;
const EXPECTED_TARGET_SCORE = 0.9;
const EXPECTED_PRODUCTION_SCORE = 0.95;

const LEVEL3_TRACEABILITY_REFS = [
  { studio: 'mv', readiness_path: MV_PRODUCTION_READY_CURRENT_STATE_PATH, status_field: 'production_ready_status', expected_status: 'PRODUCTION_READY' },
  { studio: 'short_film', readiness_path: SHORT_FILM_PRODUCTION_READINESS_PATH, report_path: SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH, expected_status: SHORT_FILM_PRODUCTION_READY_STATUS, expected_verdict: SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT },
  { studio: 'medium_film', readiness_path: MEDIUM_FILM_PRODUCTION_READINESS_PATH, report_path: MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH, expected_status: MEDIUM_FILM_PRODUCTION_READY_STATUS, expected_verdict: MEDIUM_FILM_PRODUCTION_VALIDATION_PASS_VERDICT },
  { studio: 'feature_film', readiness_path: FEATURE_FILM_PRODUCTION_READINESS_PATH, report_path: FEATURE_FILM_PRODUCTION_VALIDATION_REPORT_PATH, expected_status: FEATURE_FILM_PRODUCTION_READY_STATUS, expected_verdict: FEATURE_FILM_PRODUCTION_VALIDATION_PASS_VERDICT },
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface ConsistencySpecification {
  spec_id: string;
  identity_dimension_count: number;
  identity_dimensions: string[];
  upstream_checkpoint: string;
}

interface ConsistencyScorecard {
  scorecard_id: string;
  dimensions: { dimension: string; weight: number }[];
  composite_scoring: { weighted_average: boolean; weight_sum: number };
}

interface ConsistencyThresholds {
  thresholds_id: string;
  minimum_score: number;
  target_score: number;
  production_score: number;
}

interface BatchSpecification {
  batch_spec_id: string;
  batch_sizes: number[];
}

export interface ImageConsistencyValidationReport {
  report_id: string;
  phase: typeof IMAGE_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    level3_digital_studio_complete: boolean;
    precheck_passed: boolean;
    studio_checkpoints: {
      studio: string;
      ready: boolean;
      readiness_ref: string;
    }[];
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  validation_summary: {
    identity_dimension_count: number;
    threshold_integrity: string;
    batch_spec_exists: boolean;
    traceability_integrity: string;
    scorecard_weight_integrity: string;
    target_archetypes: string[];
  };
  outputs: {
    specification_path: string;
    scorecard_path: string;
    thresholds_path: string;
    batch_specification_path: string;
  };
  issues: ValidationIssue[];
  image_consistency_validation_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  level3_digital_studio_complete: boolean;
  precheck_passed: boolean;
  studio_checkpoints: { studio: string; ready: boolean; readiness_ref: string }[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const studio_checkpoints: { studio: string; ready: boolean; readiness_ref: string }[] = [];

  const mvStatePath = path.join(root, MV_PRODUCTION_READY_CURRENT_STATE_PATH);
  if (!fs.existsSync(mvStatePath)) {
    issues.push({ code: 'MV_STATE_MISSING', message: 'MV current state missing', severity: 'error' });
    studio_checkpoints.push({ studio: 'mv', ready: false, readiness_ref: MV_PRODUCTION_READY_CURRENT_STATE_PATH });
  } else {
    const mvState = readJson<Record<string, unknown>>(root, MV_PRODUCTION_READY_CURRENT_STATE_PATH);
    const mvReady =
      String(mvState.production_ready_status ?? '') === 'PRODUCTION_READY' &&
      mvState.production_ready_certified === true;
    studio_checkpoints.push({ studio: 'mv', ready: mvReady, readiness_ref: MV_PRODUCTION_READY_CURRENT_STATE_PATH });
    if (!mvReady) {
      issues.push({ code: 'MV_NOT_PRODUCTION_READY', message: 'MV production ready required', severity: 'error' });
    }
  }

  for (const ref of LEVEL3_TRACEABILITY_REFS) {
    if (ref.studio === 'mv') continue;

    const readinessPath = ref.readiness_path;
    const reportPath = 'report_path' in ref ? ref.report_path : null;
    let ready = false;

    if (!fs.existsSync(path.join(root, readinessPath))) {
      issues.push({
        code: 'LEVEL3_READINESS_MISSING',
        message: `Missing ${ref.studio} readiness at ${readinessPath}`,
        severity: 'error',
      });
    } else {
      const readiness = readJson<Record<string, unknown>>(root, readinessPath);
      const status = String(readiness.production_readiness_status ?? '');
      ready = status === ref.expected_status;

      if (reportPath && fs.existsSync(path.join(root, reportPath))) {
        const report = readJson<Record<string, unknown>>(root, reportPath);
        const verdict = String(report.final_verdict ?? '');
        ready = ready && verdict === ref.expected_verdict;
      }

      if (!ready) {
        issues.push({
          code: 'LEVEL3_STUDIO_NOT_READY',
          message: `${ref.studio} not production ready`,
          severity: 'error',
        });
      }
    }

    studio_checkpoints.push({ studio: ref.studio, ready, readiness_ref: readinessPath });
  }

  const level3_digital_studio_complete = studio_checkpoints.every((checkpoint) => checkpoint.ready);

  return {
    level3_digital_studio_complete,
    precheck_passed: level3_digital_studio_complete,
    studio_checkpoints,
    issues,
  };
}

function validateThresholdIntegrity(thresholds: ConsistencyThresholds): {
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

function validateScorecard(scorecard: ConsistencyScorecard): {
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

function validateSpecification(spec: ConsistencySpecification): ValidationIssue[] {
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

  if (spec.upstream_checkpoint !== LEVEL3_DIGITAL_STUDIO_COMPLETE_STATUS) {
    issues.push({
      code: 'UPSTREAM_CHECKPOINT_MISMATCH',
      message: `upstream_checkpoint=${spec.upstream_checkpoint}`,
      severity: 'error',
    });
  }

  return issues;
}

function validateBatchSpecification(batchSpec: BatchSpecification): {
  batch_spec_exists: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const size of EXPECTED_BATCH_SIZES) {
    if (!batchSpec.batch_sizes.includes(size)) {
      issues.push({
        code: 'BATCH_SIZE_MISSING',
        message: `Missing batch size ${size}`,
        severity: 'error',
      });
    }
  }

  if (batchSpec.batch_sizes.length !== EXPECTED_BATCH_SIZES.length) {
    issues.push({
      code: 'BATCH_SIZE_COUNT_MISMATCH',
      message: `batch_sizes length=${batchSpec.batch_sizes.length}`,
      severity: 'error',
    });
  }

  return {
    batch_spec_exists: issues.length === 0,
    issues,
  };
}

function buildTraceabilityAudit(root: string): {
  traceability_integrity: string;
  refs: { studio: string; readiness_ref: string; linked: boolean }[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const refs: { studio: string; readiness_ref: string; linked: boolean }[] = [];

  for (const ref of LEVEL3_TRACEABILITY_REFS) {
    const linked = fs.existsSync(path.join(root, ref.readiness_path));
    refs.push({ studio: ref.studio, readiness_ref: ref.readiness_path, linked });
    if (!linked) {
      issues.push({
        code: 'TRACEABILITY_REF_MISSING',
        message: `Missing traceability ref ${ref.readiness_path}`,
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

export function writeImageConsistencyValidation(
  projectRoot?: string
): ImageConsistencyValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const specification = readJson<ConsistencySpecification>(root, IMAGE_CONSISTENCY_SPEC_DATASET_PATH);
  const scorecard = readJson<ConsistencyScorecard>(root, IMAGE_CONSISTENCY_SCORECARD_DATASET_PATH);
  const thresholds = readJson<ConsistencyThresholds>(root, IMAGE_CONSISTENCY_THRESHOLDS_DATASET_PATH);
  const batchSpec = readJson<BatchSpecification>(root, GENERATION_BATCH_SPEC_DATASET_PATH);

  issues.push(...validateSpecification(specification));

  const thresholdValidation = validateThresholdIntegrity(thresholds);
  issues.push(...thresholdValidation.issues);

  const scorecardValidation = validateScorecard(scorecard);
  issues.push(...scorecardValidation.issues);

  const batchValidation = validateBatchSpecification(batchSpec);
  issues.push(...batchValidation.issues);

  const traceabilityAudit = buildTraceabilityAudit(root);
  issues.push(...traceabilityAudit.issues);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const systemReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    specification.identity_dimensions.length >= IDENTITY_DIMENSIONS.length &&
    thresholdValidation.threshold_integrity === 'PASS' &&
    batchValidation.batch_spec_exists &&
    traceabilityAudit.traceability_integrity === 'PASS' &&
    scorecardValidation.scorecard_weight_integrity === 'PASS';

  const specificationExport = {
    ...specification,
    export_id: 'image-consistency-specification-export-v1',
    phase: IMAGE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: IMAGE_CONSISTENCY_SPEC_DATASET_PATH,
    identity_dimension_count: specification.identity_dimensions.length,
    level3_checkpoint: LEVEL3_DIGITAL_STUDIO_COMPLETE_STATUS,
    traceability_refs: traceabilityAudit.refs,
  };

  const scorecardExport = {
    ...scorecard,
    export_id: 'image-consistency-scorecard-export-v1',
    phase: IMAGE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: IMAGE_CONSISTENCY_SCORECARD_DATASET_PATH,
    identity_dimension_count: IDENTITY_DIMENSIONS.length,
    dimension_list: [...IDENTITY_DIMENSIONS],
  };

  const thresholdsExport = {
    ...thresholds,
    export_id: 'image-consistency-thresholds-export-v1',
    phase: IMAGE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: IMAGE_CONSISTENCY_THRESHOLDS_DATASET_PATH,
    threshold_integrity: thresholdValidation.threshold_integrity,
  };

  const batchSpecExport = {
    ...batchSpec,
    export_id: 'generation-batch-specification-export-v1',
    phase: IMAGE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: GENERATION_BATCH_SPEC_DATASET_PATH,
    batch_spec_exists: batchValidation.batch_spec_exists,
    supported_batch_sizes: [...EXPECTED_BATCH_SIZES],
  };

  const report: ImageConsistencyValidationReport = {
    report_id: 'image-consistency-validation-report-v1',
    phase: IMAGE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: systemReady
      ? IMAGE_CONSISTENCY_VALIDATION_PASS_VERDICT
      : IMAGE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    status: systemReady
      ? IMAGE_CONSISTENCY_VALIDATION_READY_STATUS
      : 'IMAGE_CONSISTENCY_VALIDATION_INCOMPLETE',
    precheck: {
      level3_digital_studio_complete: precheck.level3_digital_studio_complete,
      precheck_passed: precheck.precheck_passed,
      studio_checkpoints: precheck.studio_checkpoints,
    },
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    validation_summary: {
      identity_dimension_count: specification.identity_dimensions.length,
      threshold_integrity: thresholdValidation.threshold_integrity,
      batch_spec_exists: batchValidation.batch_spec_exists,
      traceability_integrity: traceabilityAudit.traceability_integrity,
      scorecard_weight_integrity: scorecardValidation.scorecard_weight_integrity,
      target_archetypes: [...IDENTITY_DIMENSIONS],
    },
    outputs: {
      specification_path: IMAGE_CONSISTENCY_SPEC_EXPORT_PATH,
      scorecard_path: IMAGE_CONSISTENCY_SCORECARD_EXPORT_PATH,
      thresholds_path: IMAGE_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
      batch_specification_path: GENERATION_BATCH_SPEC_EXPORT_PATH,
    },
    issues,
    image_consistency_validation_ready: systemReady,
  };

  fs.mkdirSync(path.join(root, IMAGE_CONSISTENCY_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, IMAGE_CONSISTENCY_VALIDATION_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, IMAGE_CONSISTENCY_SPEC_EXPORT_PATH),
    `${JSON.stringify(specificationExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_CONSISTENCY_SCORECARD_EXPORT_PATH),
    `${JSON.stringify(scorecardExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_CONSISTENCY_THRESHOLDS_EXPORT_PATH),
    `${JSON.stringify(thresholdsExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GENERATION_BATCH_SPEC_EXPORT_PATH),
    `${JSON.stringify(batchSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
