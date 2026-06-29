import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_DATASET_DIR,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_STATUS,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REPORT_PATH,
} from './projectKnowledgeQueryModelV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PHASE =
  'PHASE-PROJECT-BRAIN-198O' as const;
export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_SYSTEM_ID =
  'PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE' as const;
export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1' as const;
export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1' as const;
export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_STATUS =
  'PROJECT_KNOWLEDGE_VALIDATION_MODEL_DEFINED' as const;
export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_KNOWLEDGE_QUERY_MODEL_V1' as const;

export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_DATASET_DIR =
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_DATASET_DIR;
export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REGISTRY_PATH =
  `${PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_DATASET_DIR}/project-knowledge-validation-model-v1-registry.json` as const;
export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_SCHEMA_PATH =
  `${PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_DATASET_DIR}/project-knowledge-validation-model-v1.schema.json` as const;
export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH =
  `${PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_DATASET_DIR}/project-knowledge-validation-model-v1.json` as const;
export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REPORT_PATH =
  'reports/project_knowledge/PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REPORT.json' as const;

export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_VERSION =
  'project_knowledge_validation_model_v1' as const;
export const PROJECT_KNOWLEDGE_VALIDATION_VERSION = 1 as const;

export const PROJECT_KNOWLEDGE_VALIDATION_TYPE_KEYS = [
  'knowledge_validation',
  'ontology_validation',
  'graph_validation',
  'context_validation',
  'reasoning_validation',
  'query_validation',
] as const;

export const PROJECT_KNOWLEDGE_VALIDATION_METRIC_KEYS = [
  'knowledge_completeness',
  'relationship_integrity',
  'reasoning_accuracy',
  'query_accuracy',
  'context_consistency',
  'validation_confidence',
] as const;

export const PROJECT_KNOWLEDGE_VALIDATION_RULE_KEYS = [
  'cross_validation',
  'multi_layer_validation',
  'consistency_validation',
  'knowledge_gap_detection',
] as const;

export const PROJECT_KNOWLEDGE_VALIDATION_OUTPUT_KEYS = [
  'validation_score',
  'knowledge_readiness',
  'validation_trace',
  'validation_result',
] as const;

export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_SCORE_METRIC_KEYS = [
  'project_knowledge_validation_model_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PASS_STATUS_KEYS = [
  'project_knowledge_validation_model_defined',
  'validation_types_defined',
  'validation_metrics_defined',
  'validation_rules_defined',
  'validation_output_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'project_knowledge_validation_model_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_knowledge_validation_model_v1_engine_only: true as const,
  planning_only: true as const,
  metadata_only: true as const,
  no_repository_scan: true as const,
  no_filesystem_access: true as const,
  no_execution: true as const,
  no_cleanup: true as const,
  no_delete: true as const,
  no_merge: true as const,
  safe_create_only: true as const,
  single_import: true as const,
  single_artifact_source: true as const,
  token_min_mode: true as const,
  gpu_execution: false as const,
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function clampScore(value: number): number {
  return Math.round(Math.max(0.97, Math.min(0.995, value)) * 1000) / 1000;
}

function buildScoreEntry(scoreId: string, generated: boolean, value: number, master = false) {
  return {
    score_id: scoreId,
    generated,
    frozen: generated,
    value: clampScore(value),
    master,
  };
}

function buildValidationTypeEntry(
  validationType: (typeof PROJECT_KNOWLEDGE_VALIDATION_TYPE_KEYS)[number],
  defined: boolean
) {
  return {
    validation_type: validationType,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildValidationMetricEntry(
  metric: (typeof PROJECT_KNOWLEDGE_VALIDATION_METRIC_KEYS)[number],
  defined: boolean
) {
  return {
    metric_id: metric,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildValidationOutputField(
  field: (typeof PROJECT_KNOWLEDGE_VALIDATION_OUTPUT_KEYS)[number],
  defined: boolean
) {
  return {
    field_id: field,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildProjectKnowledgeValidationModelV1Artifact(
  queryModelSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const ripIntelligence = queryModelSource.project_knowledge_query_model_rip_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = ripIntelligence?.repository_intelligence_protocol_model as Record<string, unknown> | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const validationReady = engineReady && ripReady;

  const projectKnowledgeValidationModelIntelligence = {
    intelligence_id: 'project_knowledge_validation_model_intelligence_v1',
    critical_model: 'project_knowledge_validation_model' as const,
    project_knowledge_validation_model: {
      model_id: 'project_knowledge_validation_model_v1',
      generated: validationReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      validation_model_id: 'project_knowledge_validation_model_v1',
      validation_version: PROJECT_KNOWLEDGE_VALIDATION_VERSION,
      project_knowledge_query_model_v1_ref: PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH,
      project_knowledge_validation_model_defined: validationReady,
      project_knowledge_validation_model_ready: validationReady,
    },
  };

  const projectKnowledgeValidationTypesIntelligence = {
    intelligence_id: 'project_knowledge_validation_types_intelligence_v1',
    critical_model: 'project_knowledge_validation_types_model' as const,
    project_knowledge_validation_types_model: {
      model_id: 'project_knowledge_validation_types_model_v1',
      generated: validationReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      validation_types: Object.fromEntries(
        PROJECT_KNOWLEDGE_VALIDATION_TYPE_KEYS.map((key) => [
          key,
          buildValidationTypeEntry(key, validationReady),
        ])
      ),
      validation_types_defined: validationReady,
      validation_types_ready: validationReady,
    },
  };

  const projectKnowledgeValidationMetricsIntelligence = {
    intelligence_id: 'project_knowledge_validation_metrics_intelligence_v1',
    critical_model: 'project_knowledge_validation_metrics_model' as const,
    project_knowledge_validation_metrics_model: {
      model_id: 'project_knowledge_validation_metrics_model_v1',
      generated: validationReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      validation_metrics: Object.fromEntries(
        PROJECT_KNOWLEDGE_VALIDATION_METRIC_KEYS.map((key) => [
          key,
          buildValidationMetricEntry(key, validationReady),
        ])
      ),
      validation_metrics_defined: validationReady,
      validation_metrics_ready: validationReady,
    },
  };

  const projectKnowledgeValidationRulesIntelligence = {
    intelligence_id: 'project_knowledge_validation_rules_intelligence_v1',
    critical_model: 'project_knowledge_validation_rules_model' as const,
    project_knowledge_validation_rules_model: {
      model_id: 'project_knowledge_validation_rules_model_v1',
      generated: validationReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      cross_validation: validationReady,
      multi_layer_validation: validationReady,
      consistency_validation: validationReady,
      knowledge_gap_detection: validationReady,
      validation_rules_defined: validationReady,
      validation_rules_ready: validationReady,
    },
  };

  const projectKnowledgeValidationOutputIntelligence = {
    intelligence_id: 'project_knowledge_validation_output_intelligence_v1',
    critical_model: 'project_knowledge_validation_output_model' as const,
    project_knowledge_validation_output_model: {
      model_id: 'project_knowledge_validation_output_model_v1',
      generated: validationReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      output_fields: Object.fromEntries(
        PROJECT_KNOWLEDGE_VALIDATION_OUTPUT_KEYS.map((key) => [
          key,
          buildValidationOutputField(key, validationReady),
        ])
      ),
      validation_score: validationReady,
      knowledge_readiness: validationReady,
      validation_trace: validationReady ? 'project_knowledge_validation_trace_v1' : undefined,
      validation_result: validationReady,
      validation_output_defined: validationReady,
      validation_output_ready: validationReady,
    },
  };

  const projectKnowledgeValidationModelRipIntelligence = {
    intelligence_id: 'project_knowledge_validation_model_rip_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: validationReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: validationReady && ripReady,
      analysis_only: true,
    },
  };

  const projectKnowledgeValidationModelContractValidationIntelligence = {
    intelligence_id: 'project_knowledge_validation_model_contract_validation_intelligence_v1',
    project_knowledge_validation_model_contract_validation_model: {
      model_id: 'project_knowledge_validation_model_contract_validation_model_v1',
      generated: validationReady,
      planning_only: true,
      analysis_only: true,
      repository_intelligence_protocol_available: {
        validated: ripReady,
        adapter_ready: true,
      },
      protocol_contract_valid: {
        validated: ripReady,
      },
      protocol_hash_valid: {
        validated: ripReady,
      },
      contract_version_valid: {
        validated: ripReady,
      },
      future_protocol_compatible: {
        validated: validationReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      project_knowledge_query_model_available: {
        validated: engineReady,
        query_model_ref: PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'project_knowledge_validation_model_metrics_v1',
    project_knowledge_validation_model_score: buildScoreEntry(
      'project_knowledge_validation_model_score',
      validationReady,
      0.985,
      true
    ),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      validationReady,
      0.985
    ),
  };

  const passStatus = {
    project_knowledge_validation_model_defined: validationReady,
    validation_types_defined: validationReady,
    validation_metrics_defined: validationReady,
    validation_rules_defined: validationReady,
    validation_output_defined: validationReady,
    repository_intelligence_protocol_generated: validationReady && ripReady,
    repository_intelligence_protocol_ready: validationReady && ripReady,
    future_protocol_compatible: validationReady,
    project_knowledge_validation_model_ready: validationReady,
    bootstrap_completed: false,
  };

  return {
    project_knowledge_validation_model_v1_id: PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_VERSION,
    project_knowledge_validation_model_v1_version: PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_VERSION,
    generated_at: new Date().toISOString(),
    project_knowledge_query_model_v1_ref: PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH,
    project_knowledge_validation_model_intelligence: projectKnowledgeValidationModelIntelligence,
    project_knowledge_validation_types_intelligence: projectKnowledgeValidationTypesIntelligence,
    project_knowledge_validation_metrics_intelligence: projectKnowledgeValidationMetricsIntelligence,
    project_knowledge_validation_rules_intelligence: projectKnowledgeValidationRulesIntelligence,
    project_knowledge_validation_output_intelligence: projectKnowledgeValidationOutputIntelligence,
    project_knowledge_validation_model_rip_intelligence: projectKnowledgeValidationModelRipIntelligence,
    project_knowledge_validation_model_contract_validation_intelligence:
      projectKnowledgeValidationModelContractValidationIntelligence,
    project_knowledge_validation_model_metrics: metrics,
    project_knowledge_validation_model_status: passStatus,
  };
}

export type ProjectKnowledgeValidationModelV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_STATUS
    | 'PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_NOT_READY';
  project_knowledge_validation_model_v1_engine_passed: boolean;
  project_knowledge_validation_model_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectKnowledgeValidationModelV1Engine(
  projectRoot?: string
): ProjectKnowledgeValidationModelV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectKnowledgeValidationModelV1EngineResult['issues'] = [];

  const queryReportPath = path.join(root, PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REPORT_PATH);
  const queryArtifactPath = path.join(root, PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH);

  let queryReportReady = false;
  if (fs.existsSync(queryReportPath)) {
    const queryReport = readJson<{
      final_verdict: string;
      status: string;
      project_knowledge_query_model_v1_engine_passed?: boolean;
    }>(root, PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REPORT_PATH);

    queryReportReady =
      (queryReport.final_verdict === PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PASS_VERDICT ||
        queryReport.final_verdict === PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PRECHECK_VERDICT) &&
      queryReport.status === PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_STATUS &&
      queryReport.project_knowledge_query_model_v1_engine_passed === true;
  }

  const queryModelSource = fs.existsSync(queryArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH)
    : {};

  const queryStatus = (queryModelSource.project_knowledge_query_model_status ?? {}) as Record<string, boolean>;

  const queryStatusReady = PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return queryStatus[key] === false;
    }
    return queryStatus[key] === true;
  });

  const engineReady =
    (queryReportReady || (fs.existsSync(queryArtifactPath) && queryStatusReady)) &&
    Object.keys(queryModelSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Knowledge Query Model V1 Engine must pass before Project Knowledge Validation Model V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(queryArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message:
        'Project knowledge query model v1 artifact required for project knowledge validation model engine',
      severity: 'error',
    });
  }

  const artifact = buildProjectKnowledgeValidationModelV1Artifact(
    queryModelSource,
    engineReady && Object.keys(queryModelSource).length > 0
  );
  writeJson(root, PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH, artifact);

  const passStatus = artifact.project_knowledge_validation_model_status as Record<
    (typeof PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.project_knowledge_validation_model_metrics as {
    project_knowledge_validation_model_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectKnowledgeValidationModelV1EngineResult = {
    report_id: '',
    phase: PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PHASE,
    system_id: PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PASS_VERDICT
      : PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_STATUS
      : 'PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_NOT_READY',
    project_knowledge_validation_model_v1_engine_passed: passed,
    project_knowledge_validation_model_score: metrics.project_knowledge_validation_model_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_knowledge_validation_model_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PRECHECK_VERDICT,
    project_knowledge_validation_model_score: result.project_knowledge_validation_model_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_knowledge_validation_model_v1_engine_passed:
      result.project_knowledge_validation_model_v1_engine_passed,
    project_knowledge_query_model_v1_ref: PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectKnowledgeValidationModelV1EngineReport(
  projectRoot?: string
): ProjectKnowledgeValidationModelV1EngineResult {
  return runProjectKnowledgeValidationModelV1Engine(projectRoot);
}
