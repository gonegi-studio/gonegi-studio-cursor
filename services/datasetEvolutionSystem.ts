import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { PRODUCTION_FAILURE_SPEC_EXPORT_PATH } from './productionExecutionPipeline.js';
import { GENERATION_TRACE_SPEC_DATASET_PATH } from './generationTraceSystem.js';

export const DATASET_EVOLUTION_MODULE = 'DATASET_EVOLUTION_SYSTEM_V1' as const;

export const DATASET_EVOLUTION_SPEC_DATASET_PATH =
  'datasets/evolution/dataset-evolution-specification.json' as const;
export const FAILURE_PATTERN_LIBRARY_DATASET_PATH =
  'datasets/evolution/failure-pattern-library.json' as const;
export const SUCCESS_PATTERN_LIBRARY_DATASET_PATH =
  'datasets/evolution/success-pattern-library.json' as const;
export const IMPROVEMENT_RECOMMENDATION_LIBRARY_DATASET_PATH =
  'datasets/evolution/improvement-recommendation-library.json' as const;

export const DATASET_EVOLUTION_SPEC_EXPORT_PATH =
  'exports/evolution/dataset-evolution-specification.json' as const;
export const FAILURE_PATTERN_LIBRARY_EXPORT_PATH =
  'exports/evolution/failure-pattern-library.json' as const;
export const SUCCESS_PATTERN_LIBRARY_EXPORT_PATH =
  'exports/evolution/success-pattern-library.json' as const;
export const IMPROVEMENT_RECOMMENDATION_LIBRARY_EXPORT_PATH =
  'exports/evolution/improvement-recommendation-library.json' as const;

const EVOLUTION_FLOW = [
  'failure',
  'root_cause',
  'pattern_extraction',
  'improvement_recommendation',
  'dataset_update_candidate',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface DatasetEvolutionSpecification {
  spec_id: string;
  upstream_checkpoint: string;
  evolution_flow: string[];
  evolution_integrity: string;
  failure_pattern_library_ref: string;
  success_pattern_library_ref: string;
  improvement_recommendation_library_ref: string;
}

interface FailurePatternLibrary {
  failure_pattern_integrity: string;
  pattern_count: number;
  patterns: { pattern_id: string; failure_type: string; root_cause: string }[];
}

interface SuccessPatternLibrary {
  success_pattern_integrity: string;
  pattern_count: number;
  patterns: { pattern_id: string; success_type: string; signal: string }[];
}

interface ImprovementRecommendationLibrary {
  recommendation_count: number;
  recommendations: {
    recommendation_id: string;
    source_pattern_id: string;
    dataset_update_candidate: string;
  }[];
}

export interface DatasetEvolutionResult {
  evolution_integrity: string;
  failure_pattern_integrity: string;
  success_pattern_integrity: string;
  dataset_evolution_integrity: string;
  issues: ValidationIssue[];
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

export function validateAndExportDatasetEvolution(projectRoot?: string): DatasetEvolutionResult {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const spec = readJson<DatasetEvolutionSpecification>(root, DATASET_EVOLUTION_SPEC_DATASET_PATH);
  const failureLib = readJson<FailurePatternLibrary>(root, FAILURE_PATTERN_LIBRARY_DATASET_PATH);
  const successLib = readJson<SuccessPatternLibrary>(root, SUCCESS_PATTERN_LIBRARY_DATASET_PATH);
  const improvementLib = readJson<ImprovementRecommendationLibrary>(
    root,
    IMPROVEMENT_RECOMMENDATION_LIBRARY_DATASET_PATH
  );

  if (spec.upstream_checkpoint !== 'REAL_FEATURE_PRODUCTION_READY') {
    issues.push({
      code: 'UPSTREAM_CHECKPOINT_MISMATCH',
      message: `upstream_checkpoint=${spec.upstream_checkpoint}`,
      severity: 'error',
    });
  }

  for (const step of EVOLUTION_FLOW) {
    if (!spec.evolution_flow.includes(step)) {
      issues.push({
        code: 'EVOLUTION_FLOW_STEP_MISSING',
        message: `Missing evolution flow step ${step}`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_FAILURE_SPEC_EXPORT_PATH))) {
    issues.push({
      code: 'FAILURE_SPEC_MISSING',
      message: `Missing failure spec at ${PRODUCTION_FAILURE_SPEC_EXPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, GENERATION_TRACE_SPEC_DATASET_PATH))) {
    issues.push({
      code: 'GENERATION_TRACE_SPEC_MISSING',
      message: `Missing generation trace spec at ${GENERATION_TRACE_SPEC_DATASET_PATH}`,
      severity: 'error',
    });
  }

  if (failureLib.pattern_count < 5) {
    issues.push({
      code: 'FAILURE_PATTERN_COUNT_LOW',
      message: `failure pattern_count=${failureLib.pattern_count}`,
      severity: 'error',
    });
  }

  if (successLib.pattern_count < 5) {
    issues.push({
      code: 'SUCCESS_PATTERN_COUNT_LOW',
      message: `success pattern_count=${successLib.pattern_count}`,
      severity: 'error',
    });
  }

  for (const rec of improvementLib.recommendations) {
    if (!rec.dataset_update_candidate) {
      issues.push({
        code: 'DATASET_UPDATE_CANDIDATE_MISSING',
        message: `${rec.recommendation_id}: missing dataset_update_candidate`,
        severity: 'error',
      });
    }
    const sourceExists = failureLib.patterns.some((p) => p.pattern_id === rec.source_pattern_id);
    if (!sourceExists) {
      issues.push({
        code: 'RECOMMENDATION_SOURCE_UNLINKED',
        message: `${rec.recommendation_id}: source ${rec.source_pattern_id} not in failure library`,
        severity: 'error',
      });
    }
  }

  const failurePatternIntegrity =
    failureLib.failure_pattern_integrity === 'PASS' && failureLib.patterns.length >= 5
      ? 'PASS'
      : 'FAIL';

  const successPatternIntegrity =
    successLib.success_pattern_integrity === 'PASS' && successLib.patterns.length >= 5
      ? 'PASS'
      : 'FAIL';

  const evolutionIntegrity =
    spec.evolution_integrity === 'PASS' &&
    issues.filter((i) => i.code.startsWith('EVOLUTION_FLOW')).length === 0
      ? 'PASS'
      : 'FAIL';

  if (spec.evolution_integrity !== 'PASS') {
    issues.push({
      code: 'EVOLUTION_INTEGRITY_FAIL',
      message: `evolution_integrity=${spec.evolution_integrity}`,
      severity: 'error',
    });
  }
  if (failureLib.failure_pattern_integrity !== 'PASS') {
    issues.push({
      code: 'FAILURE_PATTERN_INTEGRITY_FAIL',
      message: `failure_pattern_integrity=${failureLib.failure_pattern_integrity}`,
      severity: 'error',
    });
  }
  if (successLib.success_pattern_integrity !== 'PASS') {
    issues.push({
      code: 'SUCCESS_PATTERN_INTEGRITY_FAIL',
      message: `success_pattern_integrity=${successLib.success_pattern_integrity}`,
      severity: 'error',
    });
  }

  const datasetEvolutionIntegrity =
    evolutionIntegrity === 'PASS' &&
    failurePatternIntegrity === 'PASS' &&
    successPatternIntegrity === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const specExport = {
    ...spec,
    export_id: 'dataset-evolution-specification-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: DATASET_EVOLUTION_SPEC_DATASET_PATH,
    evolution_flow_list: [...EVOLUTION_FLOW],
    evolution_integrity: evolutionIntegrity,
    failure_pattern_integrity: failurePatternIntegrity,
    success_pattern_integrity: successPatternIntegrity,
    dataset_evolution_integrity: datasetEvolutionIntegrity,
  };

  const failureExport = {
    ...failureLib,
    export_id: 'failure-pattern-library-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: FAILURE_PATTERN_LIBRARY_DATASET_PATH,
    failure_pattern_integrity: failurePatternIntegrity,
  };

  const successExport = {
    ...successLib,
    export_id: 'success-pattern-library-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: SUCCESS_PATTERN_LIBRARY_DATASET_PATH,
    success_pattern_integrity: successPatternIntegrity,
  };

  const improvementExport = {
    ...improvementLib,
    export_id: 'improvement-recommendation-library-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: IMPROVEMENT_RECOMMENDATION_LIBRARY_DATASET_PATH,
    evolution_flow_terminal: 'dataset_update_candidate',
  };

  fs.mkdirSync(path.join(root, 'exports/evolution'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DATASET_EVOLUTION_SPEC_EXPORT_PATH),
    `${JSON.stringify(specExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FAILURE_PATTERN_LIBRARY_EXPORT_PATH),
    `${JSON.stringify(failureExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SUCCESS_PATTERN_LIBRARY_EXPORT_PATH),
    `${JSON.stringify(successExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMPROVEMENT_RECOMMENDATION_LIBRARY_EXPORT_PATH),
    `${JSON.stringify(improvementExport, null, 2)}\n`,
    'utf8'
  );

  return {
    evolution_integrity: evolutionIntegrity,
    failure_pattern_integrity: failurePatternIntegrity,
    success_pattern_integrity: successPatternIntegrity,
    dataset_evolution_integrity: datasetEvolutionIntegrity,
    issues,
  };
}
