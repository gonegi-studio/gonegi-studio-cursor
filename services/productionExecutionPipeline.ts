import fs from 'node:fs';
import path from 'node:path';
import { FEATURE_FILM_PRODUCTION_READINESS_PATH } from './featureFilmProductionValidation.js';
import { IMAGE_CONSISTENCY_SPEC_EXPORT_PATH } from './imageConsistencyValidation.js';
import { MEDIUM_FILM_PRODUCTION_READINESS_PATH } from './mediumFilmProductionValidation.js';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from './mvProductionReadyBaselineSnapshot.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { SHORT_FILM_PRODUCTION_READINESS_PATH } from './shortFilmProductionValidation.js';
import {
  TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
  TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT,
  TEMPORAL_MEMORY_VALIDATION_READY_STATUS,
  TEMPORAL_MEMORY_VALIDATION_REPORT_PATH,
} from './temporalMemoryValidation.js';
import { VIDEO_CONSISTENCY_SPEC_EXPORT_PATH } from './videoConsistencyValidation.js';

export const PRODUCTION_EXECUTION_PIPELINE_PHASE = 'PHASE-L2-CONSISTENCY-004' as const;
export const PRODUCTION_EXECUTION_PIPELINE_PASS_VERDICT =
  'PASS_PRODUCTION_EXECUTION_PIPELINE_V1' as const;
export const PRODUCTION_EXECUTION_PIPELINE_FAIL_VERDICT =
  'FAIL_PRODUCTION_EXECUTION_PIPELINE_V1' as const;
export const REAL_FEATURE_PRODUCTION_READY_STATUS = 'REAL_FEATURE_PRODUCTION_READY' as const;

export const PRODUCTION_PIPELINE_DATASET_DIR = 'datasets/production_pipeline' as const;
export const PRODUCTION_EXECUTION_SPEC_DATASET_PATH =
  'datasets/production_pipeline/production-execution-specification.json' as const;
export const PRODUCTION_STAGE_SPEC_DATASET_PATH =
  'datasets/production_pipeline/production-stage-specification.json' as const;
export const PRODUCTION_HANDOFF_SPEC_DATASET_PATH =
  'datasets/production_pipeline/production-handoff-specification.json' as const;
export const PRODUCTION_TRACEABILITY_SPEC_DATASET_PATH =
  'datasets/production_pipeline/production-traceability-specification.json' as const;
export const PRODUCTION_FAILURE_SPEC_DATASET_PATH =
  'datasets/production_pipeline/production-failure-specification.json' as const;
export const PRODUCTION_READINESS_THRESHOLDS_DATASET_PATH =
  'datasets/production_pipeline/production-readiness-thresholds.json' as const;
export const EXECUTION_SCALE_SPEC_DATASET_PATH =
  'datasets/production_pipeline/execution-scale-specification.json' as const;

export const PRODUCTION_PIPELINE_EXPORT_DIR = 'exports/production_pipeline' as const;
export const PRODUCTION_EXECUTION_SPEC_EXPORT_PATH =
  'exports/production_pipeline/production-execution-specification.json' as const;
export const PRODUCTION_STAGE_SPEC_EXPORT_PATH =
  'exports/production_pipeline/production-stage-specification.json' as const;
export const PRODUCTION_HANDOFF_SPEC_EXPORT_PATH =
  'exports/production_pipeline/production-handoff-specification.json' as const;
export const PRODUCTION_TRACEABILITY_SPEC_EXPORT_PATH =
  'exports/production_pipeline/production-traceability-specification.json' as const;
export const PRODUCTION_FAILURE_SPEC_EXPORT_PATH =
  'exports/production_pipeline/production-failure-specification.json' as const;
export const PRODUCTION_READINESS_THRESHOLDS_EXPORT_PATH =
  'exports/production_pipeline/production-readiness-thresholds.json' as const;
export const EXECUTION_SCALE_SPEC_EXPORT_PATH =
  'exports/production_pipeline/execution-scale-specification.json' as const;

export const PRODUCTION_PIPELINE_DIR = 'reports/production_pipeline' as const;
export const PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH =
  'reports/production_pipeline/PRODUCTION_EXECUTION_PIPELINE_REPORT.json' as const;

const PIPELINE_STAGES = [
  'blueprint',
  'scene',
  'shot',
  'prompt',
  'image',
  'video',
  'edit',
  'final_output',
] as const;

const TRACEABILITY_DIMENSIONS = [
  'blueprint_trace',
  'scene_trace',
  'shot_trace',
  'prompt_trace',
  'image_trace',
  'video_trace',
  'edit_trace',
  'final_output_trace',
] as const;

const FAILURE_DIMENSIONS = [
  'generation_failure',
  'consistency_failure',
  'memory_failure',
  'pipeline_failure',
  'render_failure',
] as const;

const EXECUTION_SCALES = ['MV', 'SHORT_FILM', 'MEDIUM_FILM', 'FEATURE_FILM'] as const;

const EXPECTED_MINIMUM_SCORE = 0.8;
const EXPECTED_TARGET_SCORE = 0.9;
const EXPECTED_PRODUCTION_SCORE = 0.95;

const HANDOFF_REQUIRED_FIELDS = [
  'input_stage',
  'output_stage',
  'traceability_id',
  'handoff_integrity',
  'stage_transition_integrity',
] as const;

const TEMPORAL_MEMORY_TRACEABILITY_REFS = [
  TEMPORAL_MEMORY_VALIDATION_REPORT_PATH,
  TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
  IMAGE_CONSISTENCY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_SPEC_EXPORT_PATH,
] as const;

const SCALE_READINESS_REFS = [
  MV_PRODUCTION_READY_CURRENT_STATE_PATH,
  SHORT_FILM_PRODUCTION_READINESS_PATH,
  MEDIUM_FILM_PRODUCTION_READINESS_PATH,
  FEATURE_FILM_PRODUCTION_READINESS_PATH,
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface ProductionExecutionSpecification {
  spec_id: string;
  upstream_checkpoint: string;
  pipeline_stage_count: number;
}

interface ProductionStageSpecification {
  stage_spec_id: string;
  stage_count: number;
  stages: { stage_id: string; stage_index: number; stage_name: string }[];
}

interface HandoffEntry {
  handoff_id: string;
  input_stage: string;
  output_stage: string;
  traceability_id: string;
  handoff_integrity: string;
  stage_transition_integrity: string;
}

interface ProductionHandoffSpecification {
  handoff_spec_id: string;
  handoff_integrity: string;
  stage_transition_integrity: string;
  handoffs: HandoffEntry[];
}

interface ProductionTraceabilitySpecification {
  traceability_spec_id: string;
  traceability_dimension_count: number;
  traceability_dimensions: string[];
  production_traceability_integrity: string;
}

interface FailureDefinition {
  description: string;
  severity: string;
  recovery_strategy: string;
}

interface ProductionFailureSpecification {
  failure_spec_id: string;
  failure_dimension_count: number;
  failure_dimensions: string[];
  failure_definitions: Record<string, FailureDefinition>;
  pipeline_recovery_integrity: string;
}

interface ProductionReadinessThresholds {
  thresholds_id: string;
  minimum_score: number;
  target_score: number;
  production_score: number;
}

interface ExecutionScaleSpecification {
  scale_spec_id: string;
  execution_scale_count: number;
  execution_scales: { scale_id: string; scale_name: string; readiness_ref: string }[];
}

export interface ProductionExecutionPipelineReport {
  report_id: string;
  phase: typeof PRODUCTION_EXECUTION_PIPELINE_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    temporal_memory_validation_ready: boolean;
    pass_temporal_memory_validation_system_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  pipeline_summary: {
    stage_count: number;
    handoff_integrity: string;
    stage_transition_integrity: string;
    traceability_dimension_count: number;
    failure_dimension_count: number;
    execution_scale_count: number;
    production_traceability_integrity: string;
    pipeline_recovery_integrity: string;
    threshold_integrity: string;
    consistency_traceability_integrity: string;
  };
  outputs: {
    execution_spec_path: string;
    stage_spec_path: string;
    handoff_spec_path: string;
    traceability_spec_path: string;
    failure_spec_path: string;
    readiness_thresholds_path: string;
    execution_scale_spec_path: string;
  };
  issues: ValidationIssue[];
  real_feature_production_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  temporal_memory_validation_ready: boolean;
  pass_temporal_memory_validation_system_v1: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, TEMPORAL_MEMORY_VALIDATION_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'TEMPORAL_MEMORY_REPORT_MISSING',
      message: `Missing temporal memory report at ${TEMPORAL_MEMORY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      temporal_memory_validation_ready: false,
      pass_temporal_memory_validation_system_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const memoryReport = readJson<Record<string, unknown>>(root, TEMPORAL_MEMORY_VALIDATION_REPORT_PATH);
  const status = String(memoryReport.status ?? '');
  const verdict = String(memoryReport.final_verdict ?? '');

  const temporal_memory_validation_ready = status === TEMPORAL_MEMORY_VALIDATION_READY_STATUS;
  const pass_temporal_memory_validation_system_v1 =
    verdict === TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT;

  if (!temporal_memory_validation_ready) {
    issues.push({
      code: 'TEMPORAL_MEMORY_NOT_READY',
      message: `Expected status=${TEMPORAL_MEMORY_VALIDATION_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_temporal_memory_validation_system_v1) {
    issues.push({
      code: 'TEMPORAL_MEMORY_VERDICT_FAIL',
      message: `Expected verdict=${TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    temporal_memory_validation_ready,
    pass_temporal_memory_validation_system_v1,
    precheck_passed:
      temporal_memory_validation_ready && pass_temporal_memory_validation_system_v1,
    issues,
  };
}

function validateExecutionSpec(spec: ProductionExecutionSpecification): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (spec.upstream_checkpoint !== TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_CHECKPOINT_MISMATCH',
      message: `upstream_checkpoint=${spec.upstream_checkpoint}`,
      severity: 'error',
    });
  }
  if (spec.pipeline_stage_count < PIPELINE_STAGES.length) {
    issues.push({
      code: 'PIPELINE_STAGE_COUNT_LOW',
      message: `pipeline_stage_count=${spec.pipeline_stage_count}`,
      severity: 'error',
    });
  }

  return issues;
}

function validateStageSpec(stageSpec: ProductionStageSpecification): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (stageSpec.stage_count < PIPELINE_STAGES.length) {
    issues.push({
      code: 'STAGE_COUNT_LOW',
      message: `stage_count=${stageSpec.stage_count}`,
      severity: 'error',
    });
  }

  const stageIds = stageSpec.stages.map((s) => s.stage_id);
  for (const stage of PIPELINE_STAGES) {
    if (!stageIds.includes(stage)) {
      issues.push({
        code: 'STAGE_MISSING',
        message: `Missing stage ${stage}`,
        severity: 'error',
      });
    }
  }

  for (let index = 0; index < stageSpec.stages.length; index += 1) {
    if (stageSpec.stages[index].stage_index !== index + 1) {
      issues.push({
        code: 'STAGE_INDEX_INVALID',
        message: `Stage ${stageSpec.stages[index].stage_id} index mismatch`,
        severity: 'error',
      });
    }
  }

  return issues;
}

function validateHandoffSpec(
  handoffSpec: ProductionHandoffSpecification,
  stageSpec: ProductionStageSpecification
): {
  handoff_integrity: string;
  stage_transition_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const stageOrder = stageSpec.stages.map((s) => s.stage_id);

  for (const handoff of handoffSpec.handoffs) {
    for (const field of HANDOFF_REQUIRED_FIELDS) {
      if (!(field in handoff) || handoff[field] === undefined || handoff[field] === '') {
        issues.push({
          code: 'HANDOFF_FIELD_MISSING',
          message: `${handoff.handoff_id}: missing ${field}`,
          severity: 'error',
        });
      }
    }
    if (handoff.handoff_integrity !== 'PASS') {
      issues.push({
        code: 'HANDOFF_INTEGRITY_FAIL',
        message: `${handoff.handoff_id}: handoff_integrity=${handoff.handoff_integrity}`,
        severity: 'error',
      });
    }
    if (handoff.stage_transition_integrity !== 'PASS') {
      issues.push({
        code: 'STAGE_TRANSITION_INTEGRITY_FAIL',
        message: `${handoff.handoff_id}: stage_transition_integrity=${handoff.stage_transition_integrity}`,
        severity: 'error',
      });
    }

    const inputIndex = stageOrder.indexOf(handoff.input_stage);
    const outputIndex = stageOrder.indexOf(handoff.output_stage);
    if (inputIndex < 0 || outputIndex < 0 || outputIndex !== inputIndex + 1) {
      issues.push({
        code: 'INVALID_STAGE_TRANSITION',
        message: `${handoff.handoff_id}: ${handoff.input_stage} -> ${handoff.output_stage}`,
        severity: 'error',
      });
    }
  }

  const expectedHandoffCount = PIPELINE_STAGES.length - 1;
  if (handoffSpec.handoffs.length !== expectedHandoffCount) {
    issues.push({
      code: 'HANDOFF_COUNT_MISMATCH',
      message: `Expected ${expectedHandoffCount} handoffs, got ${handoffSpec.handoffs.length}`,
      severity: 'error',
    });
  }

  const handoffIntegrity =
    handoffSpec.handoff_integrity === 'PASS' &&
    handoffSpec.handoffs.every((h) => h.handoff_integrity === 'PASS') &&
    issues.filter((i) => i.code.startsWith('HANDOFF')).length === 0
      ? 'PASS'
      : 'FAIL';

  const stageTransitionIntegrity =
    handoffSpec.stage_transition_integrity === 'PASS' &&
    handoffSpec.handoffs.every((h) => h.stage_transition_integrity === 'PASS') &&
    issues.filter((i) => i.code.includes('TRANSITION') || i.code === 'INVALID_STAGE_TRANSITION')
      .length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    handoff_integrity: handoffIntegrity,
    stage_transition_integrity: stageTransitionIntegrity,
    issues,
  };
}

function validateTraceabilitySpec(traceSpec: ProductionTraceabilitySpecification): {
  traceability_dimension_count: number;
  production_traceability_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (traceSpec.traceability_dimension_count < TRACEABILITY_DIMENSIONS.length) {
    issues.push({
      code: 'TRACEABILITY_DIMENSION_SHORTFALL',
      message: `traceability_dimension_count=${traceSpec.traceability_dimension_count}`,
      severity: 'error',
    });
  }

  for (const dimension of TRACEABILITY_DIMENSIONS) {
    if (!traceSpec.traceability_dimensions.includes(dimension)) {
      issues.push({
        code: 'TRACEABILITY_DIMENSION_MISSING',
        message: `Missing traceability dimension ${dimension}`,
        severity: 'error',
      });
    }
  }

  const productionTraceabilityIntegrity =
    traceSpec.production_traceability_integrity === 'PASS' && issues.length === 0
      ? 'PASS'
      : 'FAIL';

  if (traceSpec.production_traceability_integrity !== 'PASS') {
    issues.push({
      code: 'PRODUCTION_TRACEABILITY_INTEGRITY_FAIL',
      message: `production_traceability_integrity=${traceSpec.production_traceability_integrity}`,
      severity: 'error',
    });
  }

  return {
    traceability_dimension_count: traceSpec.traceability_dimensions.length,
    production_traceability_integrity: productionTraceabilityIntegrity,
    issues,
  };
}

function validateFailureSpec(failureSpec: ProductionFailureSpecification): {
  failure_dimension_count: number;
  pipeline_recovery_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (failureSpec.failure_dimension_count < FAILURE_DIMENSIONS.length) {
    issues.push({
      code: 'FAILURE_DIMENSION_SHORTFALL',
      message: `failure_dimension_count=${failureSpec.failure_dimension_count}`,
      severity: 'error',
    });
  }

  for (const dimension of FAILURE_DIMENSIONS) {
    if (!failureSpec.failure_dimensions.includes(dimension)) {
      issues.push({
        code: 'FAILURE_DIMENSION_MISSING',
        message: `Missing failure dimension ${dimension}`,
        severity: 'error',
      });
    }
    const definition = failureSpec.failure_definitions[dimension];
    if (!definition?.recovery_strategy) {
      issues.push({
        code: 'RECOVERY_STRATEGY_MISSING',
        message: `Missing recovery_strategy for ${dimension}`,
        severity: 'error',
      });
    }
  }

  const pipelineRecoveryIntegrity =
    failureSpec.pipeline_recovery_integrity === 'PASS' &&
    issues.filter((i) => i.code === 'RECOVERY_STRATEGY_MISSING').length === 0
      ? 'PASS'
      : 'FAIL';

  if (failureSpec.pipeline_recovery_integrity !== 'PASS') {
    issues.push({
      code: 'PIPELINE_RECOVERY_INTEGRITY_FAIL',
      message: `pipeline_recovery_integrity=${failureSpec.pipeline_recovery_integrity}`,
      severity: 'error',
    });
  }

  return {
    failure_dimension_count: failureSpec.failure_dimensions.length,
    pipeline_recovery_integrity: pipelineRecoveryIntegrity,
    issues,
  };
}

function validateThresholds(thresholds: ProductionReadinessThresholds): {
  threshold_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (thresholds.minimum_score !== EXPECTED_MINIMUM_SCORE) {
    issues.push({ code: 'MINIMUM_SCORE_MISMATCH', message: 'minimum_score invalid', severity: 'error' });
  }
  if (thresholds.target_score !== EXPECTED_TARGET_SCORE) {
    issues.push({ code: 'TARGET_SCORE_MISMATCH', message: 'target_score invalid', severity: 'error' });
  }
  if (thresholds.production_score !== EXPECTED_PRODUCTION_SCORE) {
    issues.push({
      code: 'PRODUCTION_SCORE_MISMATCH',
      message: 'production_score invalid',
      severity: 'error',
    });
  }
  if (
    !(
      thresholds.minimum_score < thresholds.target_score &&
      thresholds.target_score < thresholds.production_score
    )
  ) {
    issues.push({ code: 'THRESHOLD_ORDER_INVALID', message: 'threshold order invalid', severity: 'error' });
  }

  return {
    threshold_integrity: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

function validateExecutionScaleSpec(
  scaleSpec: ExecutionScaleSpecification,
  root: string
): {
  execution_scale_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (scaleSpec.execution_scale_count < EXECUTION_SCALES.length) {
    issues.push({
      code: 'EXECUTION_SCALE_COUNT_LOW',
      message: `execution_scale_count=${scaleSpec.execution_scale_count}`,
      severity: 'error',
    });
  }

  const scaleIds = scaleSpec.execution_scales.map((s) => s.scale_id);
  for (const scale of EXECUTION_SCALES) {
    if (!scaleIds.includes(scale)) {
      issues.push({
        code: 'EXECUTION_SCALE_MISSING',
        message: `Missing execution scale ${scale}`,
        severity: 'error',
      });
    }
  }

  for (const scale of scaleSpec.execution_scales) {
    if (!fs.existsSync(path.join(root, scale.readiness_ref))) {
      issues.push({
        code: 'SCALE_READINESS_REF_MISSING',
        message: `Missing readiness ref ${scale.readiness_ref} for ${scale.scale_id}`,
        severity: 'error',
      });
    }
  }

  return {
    execution_scale_count: scaleSpec.execution_scales.length,
    issues,
  };
}

function buildConsistencyTraceabilityAudit(root: string): {
  consistency_traceability_integrity: string;
  refs: { ref: string; linked: boolean }[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const refs: { ref: string; linked: boolean }[] = [];

  for (const refPath of TEMPORAL_MEMORY_TRACEABILITY_REFS) {
    const linked = fs.existsSync(path.join(root, refPath));
    refs.push({ ref: refPath, linked });
    if (!linked) {
      issues.push({
        code: 'CONSISTENCY_TRACEABILITY_REF_MISSING',
        message: `Missing consistency ref ${refPath}`,
        severity: 'error',
      });
    }
  }

  return {
    consistency_traceability_integrity: issues.length === 0 ? 'PASS' : 'FAIL',
    refs,
    issues,
  };
}

export function writeProductionExecutionPipeline(
  projectRoot?: string
): ProductionExecutionPipelineReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const executionSpec = readJson<ProductionExecutionSpecification>(
    root,
    PRODUCTION_EXECUTION_SPEC_DATASET_PATH
  );
  const stageSpec = readJson<ProductionStageSpecification>(
    root,
    PRODUCTION_STAGE_SPEC_DATASET_PATH
  );
  const handoffSpec = readJson<ProductionHandoffSpecification>(
    root,
    PRODUCTION_HANDOFF_SPEC_DATASET_PATH
  );
  const traceSpec = readJson<ProductionTraceabilitySpecification>(
    root,
    PRODUCTION_TRACEABILITY_SPEC_DATASET_PATH
  );
  const failureSpec = readJson<ProductionFailureSpecification>(
    root,
    PRODUCTION_FAILURE_SPEC_DATASET_PATH
  );
  const thresholds = readJson<ProductionReadinessThresholds>(
    root,
    PRODUCTION_READINESS_THRESHOLDS_DATASET_PATH
  );
  const scaleSpec = readJson<ExecutionScaleSpecification>(
    root,
    EXECUTION_SCALE_SPEC_DATASET_PATH
  );

  issues.push(...validateExecutionSpec(executionSpec));
  issues.push(...validateStageSpec(stageSpec));

  const handoffValidation = validateHandoffSpec(handoffSpec, stageSpec);
  issues.push(...handoffValidation.issues);

  const traceabilityValidation = validateTraceabilitySpec(traceSpec);
  issues.push(...traceabilityValidation.issues);

  const failureValidation = validateFailureSpec(failureSpec);
  issues.push(...failureValidation.issues);

  const thresholdValidation = validateThresholds(thresholds);
  issues.push(...thresholdValidation.issues);

  const scaleValidation = validateExecutionScaleSpec(scaleSpec, root);
  issues.push(...scaleValidation.issues);

  const consistencyTraceability = buildConsistencyTraceabilityAudit(root);
  issues.push(...consistencyTraceability.issues);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const pipelineReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    stageSpec.stage_count >= PIPELINE_STAGES.length &&
    handoffValidation.handoff_integrity === 'PASS' &&
    handoffValidation.stage_transition_integrity === 'PASS' &&
    traceabilityValidation.production_traceability_integrity === 'PASS' &&
    failureValidation.pipeline_recovery_integrity === 'PASS' &&
    scaleValidation.execution_scale_count >= EXECUTION_SCALES.length &&
    consistencyTraceability.consistency_traceability_integrity === 'PASS';

  const executionSpecExport = {
    ...executionSpec,
    export_id: 'production-execution-specification-export-v1',
    phase: PRODUCTION_EXECUTION_PIPELINE_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: PRODUCTION_EXECUTION_SPEC_DATASET_PATH,
    consistency_traceability_refs: consistencyTraceability.refs,
    scale_readiness_refs: [...SCALE_READINESS_REFS],
  };

  const stageSpecExport = {
    ...stageSpec,
    export_id: 'production-stage-specification-export-v1',
    phase: PRODUCTION_EXECUTION_PIPELINE_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: PRODUCTION_STAGE_SPEC_DATASET_PATH,
    stage_list: [...PIPELINE_STAGES],
  };

  const handoffSpecExport = {
    ...handoffSpec,
    export_id: 'production-handoff-specification-export-v1',
    phase: PRODUCTION_EXECUTION_PIPELINE_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: PRODUCTION_HANDOFF_SPEC_DATASET_PATH,
    handoff_integrity: handoffValidation.handoff_integrity,
    stage_transition_integrity: handoffValidation.stage_transition_integrity,
  };

  const traceSpecExport = {
    ...traceSpec,
    export_id: 'production-traceability-specification-export-v1',
    phase: PRODUCTION_EXECUTION_PIPELINE_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: PRODUCTION_TRACEABILITY_SPEC_DATASET_PATH,
    traceability_dimension_list: [...TRACEABILITY_DIMENSIONS],
    production_traceability_integrity: traceabilityValidation.production_traceability_integrity,
  };

  const failureSpecExport = {
    ...failureSpec,
    export_id: 'production-failure-specification-export-v1',
    phase: PRODUCTION_EXECUTION_PIPELINE_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: PRODUCTION_FAILURE_SPEC_DATASET_PATH,
    failure_dimension_list: [...FAILURE_DIMENSIONS],
    pipeline_recovery_integrity: failureValidation.pipeline_recovery_integrity,
  };

  const thresholdsExport = {
    ...thresholds,
    export_id: 'production-readiness-thresholds-export-v1',
    phase: PRODUCTION_EXECUTION_PIPELINE_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: PRODUCTION_READINESS_THRESHOLDS_DATASET_PATH,
    threshold_integrity: thresholdValidation.threshold_integrity,
  };

  const scaleSpecExport = {
    ...scaleSpec,
    export_id: 'execution-scale-specification-export-v1',
    phase: PRODUCTION_EXECUTION_PIPELINE_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: EXECUTION_SCALE_SPEC_DATASET_PATH,
    execution_scale_list: [...EXECUTION_SCALES],
  };

  const report: ProductionExecutionPipelineReport = {
    report_id: 'production-execution-pipeline-report-v1',
    phase: PRODUCTION_EXECUTION_PIPELINE_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: pipelineReady
      ? PRODUCTION_EXECUTION_PIPELINE_PASS_VERDICT
      : PRODUCTION_EXECUTION_PIPELINE_FAIL_VERDICT,
    status: pipelineReady ? REAL_FEATURE_PRODUCTION_READY_STATUS : 'PRODUCTION_PIPELINE_INCOMPLETE',
    precheck,
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    pipeline_summary: {
      stage_count: stageSpec.stage_count,
      handoff_integrity: handoffValidation.handoff_integrity,
      stage_transition_integrity: handoffValidation.stage_transition_integrity,
      traceability_dimension_count: traceabilityValidation.traceability_dimension_count,
      failure_dimension_count: failureValidation.failure_dimension_count,
      execution_scale_count: scaleValidation.execution_scale_count,
      production_traceability_integrity: traceabilityValidation.production_traceability_integrity,
      pipeline_recovery_integrity: failureValidation.pipeline_recovery_integrity,
      threshold_integrity: thresholdValidation.threshold_integrity,
      consistency_traceability_integrity: consistencyTraceability.consistency_traceability_integrity,
    },
    outputs: {
      execution_spec_path: PRODUCTION_EXECUTION_SPEC_EXPORT_PATH,
      stage_spec_path: PRODUCTION_STAGE_SPEC_EXPORT_PATH,
      handoff_spec_path: PRODUCTION_HANDOFF_SPEC_EXPORT_PATH,
      traceability_spec_path: PRODUCTION_TRACEABILITY_SPEC_EXPORT_PATH,
      failure_spec_path: PRODUCTION_FAILURE_SPEC_EXPORT_PATH,
      readiness_thresholds_path: PRODUCTION_READINESS_THRESHOLDS_EXPORT_PATH,
      execution_scale_spec_path: EXECUTION_SCALE_SPEC_EXPORT_PATH,
    },
    issues,
    real_feature_production_ready: pipelineReady,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_PIPELINE_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, PRODUCTION_PIPELINE_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, PRODUCTION_EXECUTION_SPEC_EXPORT_PATH),
    `${JSON.stringify(executionSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_STAGE_SPEC_EXPORT_PATH),
    `${JSON.stringify(stageSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_HANDOFF_SPEC_EXPORT_PATH),
    `${JSON.stringify(handoffSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_TRACEABILITY_SPEC_EXPORT_PATH),
    `${JSON.stringify(traceSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_FAILURE_SPEC_EXPORT_PATH),
    `${JSON.stringify(failureSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_READINESS_THRESHOLDS_EXPORT_PATH),
    `${JSON.stringify(thresholdsExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, EXECUTION_SCALE_SPEC_EXPORT_PATH),
    `${JSON.stringify(scaleSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
