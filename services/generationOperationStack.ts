import fs from 'node:fs';
import path from 'node:path';
import { validateAndExportDatasetEvolution } from './datasetEvolutionSystem.js';
import { validateAndExportAssetRegistry } from './generatedAssetRegistry.js';
import { validateAndExportGenerationTrace } from './generationTraceSystem.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { validateAndCompilePrompt } from './promptCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  PRODUCTION_EXECUTION_PIPELINE_PASS_VERDICT,
  PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH,
  PRODUCTION_EXECUTION_SPEC_EXPORT_PATH,
  PRODUCTION_FAILURE_SPEC_EXPORT_PATH,
  PRODUCTION_HANDOFF_SPEC_EXPORT_PATH,
  PRODUCTION_READINESS_THRESHOLDS_EXPORT_PATH,
  PRODUCTION_STAGE_SPEC_EXPORT_PATH,
  PRODUCTION_TRACEABILITY_SPEC_EXPORT_PATH,
  EXECUTION_SCALE_SPEC_EXPORT_PATH,
  REAL_FEATURE_PRODUCTION_READY_STATUS,
} from './productionExecutionPipeline.js';

export const GENERATION_OPERATION_STACK_PHASE = 'PHASE-GPU-PREP-001' as const;
export const GENERATION_OPERATION_STACK_PASS_VERDICT =
  'PASS_GENERATION_OPERATION_STACK_V1' as const;
export const GENERATION_OPERATION_STACK_FAIL_VERDICT =
  'FAIL_GENERATION_OPERATION_STACK_V1' as const;
export const GPU_CONNECTION_READY_STATUS = 'GPU_CONNECTION_READY' as const;

export const GENERATION_OPERATION_STACK_DIR = 'reports/generation_operation' as const;
export const GENERATION_OPERATION_STACK_REPORT_PATH =
  'reports/generation_operation/GENERATION_OPERATION_STACK_REPORT.json' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface GenerationOperationStackReport {
  report_id: string;
  phase: typeof GENERATION_OPERATION_STACK_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    real_feature_production_ready: boolean;
    production_execution_pass: boolean;
    precheck_passed: boolean;
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  module_summary: {
    prompt_compiler_integrity: string;
    shot_to_prompt_integrity: string;
    prompt_traceability_integrity: string;
    generation_trace_integrity: string;
    asset_registry_integrity: string;
    dataset_evolution_integrity: string;
    evolution_integrity: string;
    failure_pattern_integrity: string;
    success_pattern_integrity: string;
  };
  outputs: {
    compiled_prompt_path: string;
    prompt_compiler_spec_path: string;
    generation_trace_spec_path: string;
    asset_registry_path: string;
    asset_index_path: string;
    dataset_evolution_spec_path: string;
    failure_pattern_library_path: string;
    success_pattern_library_path: string;
    improvement_recommendation_library_path: string;
  };
  issues: ValidationIssue[];
  gpu_connection_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  real_feature_production_ready: boolean;
  production_execution_pass: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'PRODUCTION_EXECUTION_REPORT_MISSING',
      message: `Missing report at ${PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      real_feature_production_ready: false,
      production_execution_pass: false,
      precheck_passed: false,
      issues,
    };
  }

  const pipelineReport = readJson<Record<string, unknown>>(root, PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH);
  const status = String(pipelineReport.status ?? '');
  const verdict = String(pipelineReport.final_verdict ?? '');

  const real_feature_production_ready = status === REAL_FEATURE_PRODUCTION_READY_STATUS;
  const production_execution_pass = verdict === PRODUCTION_EXECUTION_PIPELINE_PASS_VERDICT;

  if (!real_feature_production_ready) {
    issues.push({
      code: 'REAL_FEATURE_PRODUCTION_NOT_READY',
      message: `Expected status=${REAL_FEATURE_PRODUCTION_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!production_execution_pass) {
    issues.push({
      code: 'PRODUCTION_EXECUTION_VERDICT_FAIL',
      message: `Expected verdict=${PRODUCTION_EXECUTION_PIPELINE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    real_feature_production_ready,
    production_execution_pass,
    precheck_passed: real_feature_production_ready && production_execution_pass,
    issues,
  };
}

export function writeGenerationOperationStack(
  projectRoot?: string
): GenerationOperationStackReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const promptResult = validateAndCompilePrompt(root);
  issues.push(...promptResult.issues);

  const traceResult = validateAndExportGenerationTrace(root);
  issues.push(...traceResult.issues);

  const registryResult = validateAndExportAssetRegistry(root);
  issues.push(...registryResult.issues);

  const evolutionResult = validateAndExportDatasetEvolution(root);
  issues.push(...evolutionResult.issues);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const stackReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    promptResult.prompt_compiler_integrity === 'PASS' &&
    promptResult.shot_to_prompt_integrity === 'PASS' &&
    promptResult.prompt_traceability_integrity === 'PASS' &&
    traceResult.generation_trace_integrity === 'PASS' &&
    registryResult.asset_registry_integrity === 'PASS' &&
    evolutionResult.dataset_evolution_integrity === 'PASS' &&
    evolutionResult.evolution_integrity === 'PASS' &&
    evolutionResult.failure_pattern_integrity === 'PASS' &&
    evolutionResult.success_pattern_integrity === 'PASS';

  const report: GenerationOperationStackReport = {
    report_id: 'generation-operation-stack-report-v1',
    phase: GENERATION_OPERATION_STACK_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: stackReady
      ? GENERATION_OPERATION_STACK_PASS_VERDICT
      : GENERATION_OPERATION_STACK_FAIL_VERDICT,
    status: stackReady ? GPU_CONNECTION_READY_STATUS : 'GENERATION_OPERATION_INCOMPLETE',
    precheck,
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    module_summary: {
      prompt_compiler_integrity: promptResult.prompt_compiler_integrity,
      shot_to_prompt_integrity: promptResult.shot_to_prompt_integrity,
      prompt_traceability_integrity: promptResult.prompt_traceability_integrity,
      generation_trace_integrity: traceResult.generation_trace_integrity,
      asset_registry_integrity: registryResult.asset_registry_integrity,
      dataset_evolution_integrity: evolutionResult.dataset_evolution_integrity,
      evolution_integrity: evolutionResult.evolution_integrity,
      failure_pattern_integrity: evolutionResult.failure_pattern_integrity,
      success_pattern_integrity: evolutionResult.success_pattern_integrity,
    },
    outputs: {
      compiled_prompt_path: promptResult.compiled_prompt_path,
      prompt_compiler_spec_path: 'exports/generation/prompt-compiler-specification.json',
      generation_trace_spec_path: 'exports/generation/generation-trace-specification.json',
      asset_registry_path: 'exports/assets/generated-asset-registry.json',
      asset_index_path: 'exports/assets/generated-asset-index.json',
      dataset_evolution_spec_path: 'exports/evolution/dataset-evolution-specification.json',
      failure_pattern_library_path: 'exports/evolution/failure-pattern-library.json',
      success_pattern_library_path: 'exports/evolution/success-pattern-library.json',
      improvement_recommendation_library_path:
        'exports/evolution/improvement-recommendation-library.json',
    },
    issues,
    gpu_connection_ready: stackReady,
  };

  fs.mkdirSync(path.join(root, GENERATION_OPERATION_STACK_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, GENERATION_OPERATION_STACK_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export const PRODUCTION_EXECUTION_READ_ONLY_PATHS = [
  PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH,
  PRODUCTION_EXECUTION_SPEC_EXPORT_PATH,
  PRODUCTION_STAGE_SPEC_EXPORT_PATH,
  PRODUCTION_HANDOFF_SPEC_EXPORT_PATH,
  PRODUCTION_TRACEABILITY_SPEC_EXPORT_PATH,
  PRODUCTION_FAILURE_SPEC_EXPORT_PATH,
  PRODUCTION_READINESS_THRESHOLDS_EXPORT_PATH,
  EXECUTION_SCALE_SPEC_EXPORT_PATH,
  'datasets/production_pipeline/production-execution-specification.json',
  'datasets/production_pipeline/production-stage-specification.json',
  'datasets/production_pipeline/production-handoff-specification.json',
  'datasets/production_pipeline/production-traceability-specification.json',
  'datasets/production_pipeline/production-failure-specification.json',
  'datasets/production_pipeline/production-readiness-thresholds.json',
  'datasets/production_pipeline/execution-scale-specification.json',
] as const;
