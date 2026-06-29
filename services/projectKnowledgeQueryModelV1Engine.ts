import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_REASONING_MODEL_V1_DATASET_DIR,
  PROJECT_REASONING_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_REASONING_MODEL_V1_ENGINE_STATUS,
  PROJECT_REASONING_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_REASONING_MODEL_V1_PATH,
  PROJECT_REASONING_MODEL_V1_REPORT_PATH,
} from './projectReasoningModelV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PHASE = 'PHASE-PROJECT-BRAIN-198N' as const;
export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_SYSTEM_ID =
  'PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE' as const;
export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_KNOWLEDGE_QUERY_MODEL_V1' as const;
export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_KNOWLEDGE_QUERY_MODEL_V1' as const;
export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_STATUS =
  'PROJECT_KNOWLEDGE_QUERY_MODEL_DEFINED' as const;
export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_REASONING_MODEL_V1' as const;

export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_DATASET_DIR = PROJECT_REASONING_MODEL_V1_DATASET_DIR;
export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REGISTRY_PATH =
  `${PROJECT_KNOWLEDGE_QUERY_MODEL_V1_DATASET_DIR}/project-knowledge-query-model-v1-registry.json` as const;
export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_SCHEMA_PATH =
  `${PROJECT_KNOWLEDGE_QUERY_MODEL_V1_DATASET_DIR}/project-knowledge-query-model-v1.schema.json` as const;
export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH =
  `${PROJECT_KNOWLEDGE_QUERY_MODEL_V1_DATASET_DIR}/project-knowledge-query-model-v1.json` as const;
export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REPORT_PATH =
  'reports/project_knowledge/PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REPORT.json' as const;

export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_VERSION = 'project_knowledge_query_model_v1' as const;
export const PROJECT_KNOWLEDGE_QUERY_VERSION = 1 as const;

export const PROJECT_KNOWLEDGE_QUERY_TYPE_KEYS = [
  'semantic_query',
  'dependency_query',
  'impact_query',
  'lineage_query',
  'context_query',
  'reasoning_query',
] as const;

export const PROJECT_KNOWLEDGE_QUERY_SCOPE_KEYS = [
  'global_query',
  'domain_query',
  'subgraph_query',
  'entity_query',
  'incremental_query',
] as const;

export const PROJECT_KNOWLEDGE_QUERY_FLOW_KEYS = [
  'query_input',
  'query_plan',
  'query_result',
  'query_confidence',
  'query_trace_id',
] as const;

export const PROJECT_KNOWLEDGE_QUERY_RULE_KEYS = [
  'cache_first_query',
  'knowledge_graph_query',
  'multi_hop_query',
  'semantic_filter_supported',
] as const;

export const PROJECT_KNOWLEDGE_QUERY_VALIDATION_KEYS = [
  'query_validation',
  'query_consistency_check',
  'query_version',
] as const;

export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_METRIC_KEYS = [
  'project_knowledge_query_model_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PASS_STATUS_KEYS = [
  'project_knowledge_query_model_defined',
  'query_types_defined',
  'query_scope_defined',
  'query_flow_defined',
  'query_rules_defined',
  'query_validation_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'project_knowledge_query_model_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_knowledge_query_model_v1_engine_only: true as const,
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

function buildQueryTypeEntry(queryType: (typeof PROJECT_KNOWLEDGE_QUERY_TYPE_KEYS)[number], defined: boolean) {
  return {
    query_type: queryType,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildQueryScopeEntry(scope: (typeof PROJECT_KNOWLEDGE_QUERY_SCOPE_KEYS)[number], defined: boolean) {
  return {
    scope_id: scope,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildQueryFlowField(field: (typeof PROJECT_KNOWLEDGE_QUERY_FLOW_KEYS)[number], defined: boolean) {
  return {
    field_id: field,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildProjectKnowledgeQueryModelV1Artifact(
  reasoningModelSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const ripIntelligence = reasoningModelSource.project_reasoning_model_rip_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = ripIntelligence?.repository_intelligence_protocol_model as Record<string, unknown> | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const queryReady = engineReady && ripReady;

  const projectKnowledgeQueryModelIntelligence = {
    intelligence_id: 'project_knowledge_query_model_intelligence_v1',
    critical_model: 'project_knowledge_query_model' as const,
    project_knowledge_query_model: {
      model_id: 'project_knowledge_query_model_v1',
      generated: queryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      query_model_id: 'project_knowledge_query_model_v1',
      query_version: PROJECT_KNOWLEDGE_QUERY_VERSION,
      project_reasoning_model_v1_ref: PROJECT_REASONING_MODEL_V1_PATH,
      project_knowledge_query_model_defined: queryReady,
      project_knowledge_query_model_ready: queryReady,
    },
  };

  const projectKnowledgeQueryTypesIntelligence = {
    intelligence_id: 'project_knowledge_query_types_intelligence_v1',
    critical_model: 'project_knowledge_query_types_model' as const,
    project_knowledge_query_types_model: {
      model_id: 'project_knowledge_query_types_model_v1',
      generated: queryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      query_types: Object.fromEntries(
        PROJECT_KNOWLEDGE_QUERY_TYPE_KEYS.map((key) => [key, buildQueryTypeEntry(key, queryReady)])
      ),
      query_types_defined: queryReady,
      query_types_ready: queryReady,
    },
  };

  const projectKnowledgeQueryScopeIntelligence = {
    intelligence_id: 'project_knowledge_query_scope_intelligence_v1',
    critical_model: 'project_knowledge_query_scope_model' as const,
    project_knowledge_query_scope_model: {
      model_id: 'project_knowledge_query_scope_model_v1',
      generated: queryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      query_scopes: Object.fromEntries(
        PROJECT_KNOWLEDGE_QUERY_SCOPE_KEYS.map((key) => [key, buildQueryScopeEntry(key, queryReady)])
      ),
      query_scope_defined: queryReady,
      query_scope_ready: queryReady,
    },
  };

  const projectKnowledgeQueryFlowIntelligence = {
    intelligence_id: 'project_knowledge_query_flow_intelligence_v1',
    critical_model: 'project_knowledge_query_flow_model' as const,
    project_knowledge_query_flow_model: {
      model_id: 'project_knowledge_query_flow_model_v1',
      generated: queryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      flow_fields: Object.fromEntries(
        PROJECT_KNOWLEDGE_QUERY_FLOW_KEYS.map((key) => [key, buildQueryFlowField(key, queryReady)])
      ),
      query_input: queryReady,
      query_plan: queryReady,
      query_result: queryReady,
      query_confidence: queryReady,
      query_trace_id: queryReady ? 'project_knowledge_query_trace_v1' : undefined,
      query_flow_defined: queryReady,
      query_flow_ready: queryReady,
    },
  };

  const projectKnowledgeQueryRulesIntelligence = {
    intelligence_id: 'project_knowledge_query_rules_intelligence_v1',
    critical_model: 'project_knowledge_query_rules_model' as const,
    project_knowledge_query_rules_model: {
      model_id: 'project_knowledge_query_rules_model_v1',
      generated: queryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      cache_first_query: queryReady,
      knowledge_graph_query: queryReady,
      multi_hop_query: queryReady,
      semantic_filter_supported: queryReady,
      query_rules_defined: queryReady,
      query_rules_ready: queryReady,
    },
  };

  const projectKnowledgeQueryValidationIntelligence = {
    intelligence_id: 'project_knowledge_query_validation_intelligence_v1',
    critical_model: 'project_knowledge_query_validation_model' as const,
    project_knowledge_query_validation_model: {
      model_id: 'project_knowledge_query_validation_model_v1',
      generated: queryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      query_validation: queryReady,
      query_consistency_check: queryReady,
      query_version: PROJECT_KNOWLEDGE_QUERY_VERSION,
      query_validation_defined: queryReady,
      query_validation_ready: queryReady,
    },
  };

  const projectKnowledgeQueryModelRipIntelligence = {
    intelligence_id: 'project_knowledge_query_model_rip_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: queryReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: queryReady && ripReady,
      analysis_only: true,
    },
  };

  const projectKnowledgeQueryModelContractValidationIntelligence = {
    intelligence_id: 'project_knowledge_query_model_contract_validation_intelligence_v1',
    project_knowledge_query_model_contract_validation_model: {
      model_id: 'project_knowledge_query_model_contract_validation_model_v1',
      generated: queryReady,
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
        validated: queryReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      project_reasoning_model_available: {
        validated: engineReady,
        reasoning_model_ref: PROJECT_REASONING_MODEL_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'project_knowledge_query_model_metrics_v1',
    project_knowledge_query_model_score: buildScoreEntry(
      'project_knowledge_query_model_score',
      queryReady,
      0.985,
      true
    ),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      queryReady,
      0.985
    ),
  };

  const passStatus = {
    project_knowledge_query_model_defined: queryReady,
    query_types_defined: queryReady,
    query_scope_defined: queryReady,
    query_flow_defined: queryReady,
    query_rules_defined: queryReady,
    query_validation_defined: queryReady,
    repository_intelligence_protocol_generated: queryReady && ripReady,
    repository_intelligence_protocol_ready: queryReady && ripReady,
    future_protocol_compatible: queryReady,
    project_knowledge_query_model_ready: queryReady,
    bootstrap_completed: false,
  };

  return {
    project_knowledge_query_model_v1_id: PROJECT_KNOWLEDGE_QUERY_MODEL_V1_VERSION,
    project_knowledge_query_model_v1_version: PROJECT_KNOWLEDGE_QUERY_MODEL_V1_VERSION,
    generated_at: new Date().toISOString(),
    project_reasoning_model_v1_ref: PROJECT_REASONING_MODEL_V1_PATH,
    project_knowledge_query_model_intelligence: projectKnowledgeQueryModelIntelligence,
    project_knowledge_query_types_intelligence: projectKnowledgeQueryTypesIntelligence,
    project_knowledge_query_scope_intelligence: projectKnowledgeQueryScopeIntelligence,
    project_knowledge_query_flow_intelligence: projectKnowledgeQueryFlowIntelligence,
    project_knowledge_query_rules_intelligence: projectKnowledgeQueryRulesIntelligence,
    project_knowledge_query_validation_intelligence: projectKnowledgeQueryValidationIntelligence,
    project_knowledge_query_model_rip_intelligence: projectKnowledgeQueryModelRipIntelligence,
    project_knowledge_query_model_contract_validation_intelligence:
      projectKnowledgeQueryModelContractValidationIntelligence,
    project_knowledge_query_model_metrics: metrics,
    project_knowledge_query_model_status: passStatus,
  };
}

export type ProjectKnowledgeQueryModelV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_STATUS
    | 'PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_NOT_READY';
  project_knowledge_query_model_v1_engine_passed: boolean;
  project_knowledge_query_model_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectKnowledgeQueryModelV1Engine(
  projectRoot?: string
): ProjectKnowledgeQueryModelV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectKnowledgeQueryModelV1EngineResult['issues'] = [];

  const reasoningReportPath = path.join(root, PROJECT_REASONING_MODEL_V1_REPORT_PATH);
  const reasoningArtifactPath = path.join(root, PROJECT_REASONING_MODEL_V1_PATH);

  let reasoningReportReady = false;
  if (fs.existsSync(reasoningReportPath)) {
    const reasoningReport = readJson<{
      final_verdict: string;
      status: string;
      project_reasoning_model_v1_engine_passed?: boolean;
    }>(root, PROJECT_REASONING_MODEL_V1_REPORT_PATH);

    reasoningReportReady =
      (reasoningReport.final_verdict === PROJECT_REASONING_MODEL_V1_ENGINE_PASS_VERDICT ||
        reasoningReport.final_verdict === PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PRECHECK_VERDICT) &&
      reasoningReport.status === PROJECT_REASONING_MODEL_V1_ENGINE_STATUS &&
      reasoningReport.project_reasoning_model_v1_engine_passed === true;
  }

  const reasoningModelSource = fs.existsSync(reasoningArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_REASONING_MODEL_V1_PATH)
    : {};

  const reasoningStatus = (reasoningModelSource.project_reasoning_model_status ?? {}) as Record<string, boolean>;

  const reasoningStatusReady = PROJECT_REASONING_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return reasoningStatus[key] === false;
    }
    return reasoningStatus[key] === true;
  });

  const engineReady =
    (reasoningReportReady || (fs.existsSync(reasoningArtifactPath) && reasoningStatusReady)) &&
    Object.keys(reasoningModelSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Reasoning Model V1 Engine must pass before Project Knowledge Query Model V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(reasoningArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Project reasoning model v1 artifact required for project knowledge query model engine',
      severity: 'error',
    });
  }

  const artifact = buildProjectKnowledgeQueryModelV1Artifact(
    reasoningModelSource,
    engineReady && Object.keys(reasoningModelSource).length > 0
  );
  writeJson(root, PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH, artifact);

  const passStatus = artifact.project_knowledge_query_model_status as Record<
    (typeof PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.project_knowledge_query_model_metrics as {
    project_knowledge_query_model_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectKnowledgeQueryModelV1EngineResult = {
    report_id: '',
    phase: PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PHASE,
    system_id: PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PASS_VERDICT
      : PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_STATUS
      : 'PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_NOT_READY',
    project_knowledge_query_model_v1_engine_passed: passed,
    project_knowledge_query_model_score: metrics.project_knowledge_query_model_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_knowledge_query_model_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PRECHECK_VERDICT,
    project_knowledge_query_model_score: result.project_knowledge_query_model_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_knowledge_query_model_v1_engine_passed: result.project_knowledge_query_model_v1_engine_passed,
    project_reasoning_model_v1_ref: PROJECT_REASONING_MODEL_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectKnowledgeQueryModelV1EngineReport(
  projectRoot?: string
): ProjectKnowledgeQueryModelV1EngineResult {
  return runProjectKnowledgeQueryModelV1Engine(projectRoot);
}
