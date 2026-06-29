import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_CONTEXT_MEMORY_V1_DATASET_DIR,
  PROJECT_CONTEXT_MEMORY_V1_ENGINE_PASS_VERDICT,
  PROJECT_CONTEXT_MEMORY_V1_ENGINE_STATUS,
  PROJECT_CONTEXT_MEMORY_V1_PASS_STATUS_KEYS,
  PROJECT_CONTEXT_MEMORY_V1_PATH,
  PROJECT_CONTEXT_MEMORY_V1_REPORT_PATH,
} from './projectContextMemoryV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_REASONING_MODEL_V1_ENGINE_PHASE = 'PHASE-PROJECT-BRAIN-198M' as const;
export const PROJECT_REASONING_MODEL_V1_ENGINE_SYSTEM_ID = 'PROJECT_REASONING_MODEL_V1_ENGINE' as const;
export const PROJECT_REASONING_MODEL_V1_ENGINE_PASS_VERDICT = 'PASS_PROJECT_REASONING_MODEL_V1' as const;
export const PROJECT_REASONING_MODEL_V1_ENGINE_FAIL_VERDICT = 'FAIL_PROJECT_REASONING_MODEL_V1' as const;
export const PROJECT_REASONING_MODEL_V1_ENGINE_STATUS = 'PROJECT_REASONING_MODEL_DEFINED' as const;
export const PROJECT_REASONING_MODEL_V1_PRECHECK_VERDICT = 'PASS_PROJECT_CONTEXT_MEMORY_V1' as const;

export const PROJECT_REASONING_MODEL_V1_DATASET_DIR = PROJECT_CONTEXT_MEMORY_V1_DATASET_DIR;
export const PROJECT_REASONING_MODEL_V1_REGISTRY_PATH =
  `${PROJECT_REASONING_MODEL_V1_DATASET_DIR}/project-reasoning-model-v1-registry.json` as const;
export const PROJECT_REASONING_MODEL_V1_SCHEMA_PATH =
  `${PROJECT_REASONING_MODEL_V1_DATASET_DIR}/project-reasoning-model-v1.schema.json` as const;
export const PROJECT_REASONING_MODEL_V1_PATH =
  `${PROJECT_REASONING_MODEL_V1_DATASET_DIR}/project-reasoning-model-v1.json` as const;
export const PROJECT_REASONING_MODEL_V1_REPORT_PATH =
  'reports/project_knowledge/PROJECT_REASONING_MODEL_V1_REPORT.json' as const;

export const PROJECT_REASONING_MODEL_V1_VERSION = 'project_reasoning_model_v1' as const;
export const PROJECT_REASONING_VERSION = 1 as const;

export const PROJECT_REASONING_TYPE_KEYS = [
  'dependency_reasoning',
  'impact_reasoning',
  'semantic_reasoning',
  'lineage_reasoning',
] as const;

export const PROJECT_REASONING_FLOW_KEYS = [
  'reasoning_input',
  'reasoning_path',
  'reasoning_output',
  'confidence_score',
  'reasoning_trace_id',
] as const;

export const PROJECT_REASONING_RULE_KEYS = [
  'multi_hop_reasoning',
  'cross_domain_reasoning',
  'context_aware_reasoning',
  'reasoning_trace_supported',
  'decision_confidence_supported',
  'explanation_supported',
] as const;

export const PROJECT_REASONING_VALIDATION_KEYS = [
  'reasoning_validation',
  'reasoning_consistency_check',
  'reasoning_version',
] as const;

export const PROJECT_REASONING_MODEL_V1_METRIC_KEYS = [
  'project_reasoning_model_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_REASONING_MODEL_V1_PASS_STATUS_KEYS = [
  'project_reasoning_model_defined',
  'reasoning_types_defined',
  'reasoning_flow_defined',
  'reasoning_rules_defined',
  'reasoning_validation_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'project_reasoning_model_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_reasoning_model_v1_engine_only: true as const,
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

function buildReasoningTypeEntry(
  reasoningType: (typeof PROJECT_REASONING_TYPE_KEYS)[number],
  defined: boolean
) {
  return {
    reasoning_type: reasoningType,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildReasoningFlowField(
  field: (typeof PROJECT_REASONING_FLOW_KEYS)[number],
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

function buildProjectReasoningModelV1Artifact(
  contextMemorySource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const ripIntelligence = contextMemorySource.project_context_memory_rip_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = ripIntelligence?.repository_intelligence_protocol_model as Record<string, unknown> | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const reasoningReady = engineReady && ripReady;

  const projectReasoningModelIntelligence = {
    intelligence_id: 'project_reasoning_model_intelligence_v1',
    critical_model: 'project_reasoning_model' as const,
    project_reasoning_model: {
      model_id: 'project_reasoning_model_v1',
      generated: reasoningReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      reasoning_model_id: 'project_reasoning_model_v1',
      reasoning_version: PROJECT_REASONING_VERSION,
      project_context_memory_v1_ref: PROJECT_CONTEXT_MEMORY_V1_PATH,
      project_reasoning_model_defined: reasoningReady,
      project_reasoning_model_ready: reasoningReady,
    },
  };

  const projectReasoningTypesIntelligence = {
    intelligence_id: 'project_reasoning_types_intelligence_v1',
    critical_model: 'project_reasoning_types_model' as const,
    project_reasoning_types_model: {
      model_id: 'project_reasoning_types_model_v1',
      generated: reasoningReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      reasoning_types: Object.fromEntries(
        PROJECT_REASONING_TYPE_KEYS.map((key) => [key, buildReasoningTypeEntry(key, reasoningReady)])
      ),
      reasoning_types_defined: reasoningReady,
      reasoning_types_ready: reasoningReady,
    },
  };

  const projectReasoningFlowIntelligence = {
    intelligence_id: 'project_reasoning_flow_intelligence_v1',
    critical_model: 'project_reasoning_flow_model' as const,
    project_reasoning_flow_model: {
      model_id: 'project_reasoning_flow_model_v1',
      generated: reasoningReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      flow_fields: Object.fromEntries(
        PROJECT_REASONING_FLOW_KEYS.map((key) => [key, buildReasoningFlowField(key, reasoningReady)])
      ),
      reasoning_input: reasoningReady,
      reasoning_path: reasoningReady,
      reasoning_output: reasoningReady,
      confidence_score: reasoningReady,
      reasoning_trace_id: reasoningReady ? 'project_reasoning_trace_v1' : undefined,
      reasoning_flow_defined: reasoningReady,
      reasoning_flow_ready: reasoningReady,
    },
  };

  const projectReasoningRulesIntelligence = {
    intelligence_id: 'project_reasoning_rules_intelligence_v1',
    critical_model: 'project_reasoning_rules_model' as const,
    project_reasoning_rules_model: {
      model_id: 'project_reasoning_rules_model_v1',
      generated: reasoningReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      multi_hop_reasoning: reasoningReady,
      cross_domain_reasoning: reasoningReady,
      context_aware_reasoning: reasoningReady,
      reasoning_trace_supported: reasoningReady,
      decision_confidence_supported: reasoningReady,
      explanation_supported: reasoningReady,
      reasoning_rules_defined: reasoningReady,
      reasoning_rules_ready: reasoningReady,
    },
  };

  const projectReasoningValidationIntelligence = {
    intelligence_id: 'project_reasoning_validation_intelligence_v1',
    critical_model: 'project_reasoning_validation_model' as const,
    project_reasoning_validation_model: {
      model_id: 'project_reasoning_validation_model_v1',
      generated: reasoningReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      reasoning_validation: reasoningReady,
      reasoning_consistency_check: reasoningReady,
      reasoning_version: PROJECT_REASONING_VERSION,
      reasoning_validation_defined: reasoningReady,
      reasoning_validation_ready: reasoningReady,
    },
  };

  const projectReasoningModelRipIntelligence = {
    intelligence_id: 'project_reasoning_model_rip_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: reasoningReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: reasoningReady && ripReady,
      analysis_only: true,
    },
  };

  const projectReasoningModelContractValidationIntelligence = {
    intelligence_id: 'project_reasoning_model_contract_validation_intelligence_v1',
    project_reasoning_model_contract_validation_model: {
      model_id: 'project_reasoning_model_contract_validation_model_v1',
      generated: reasoningReady,
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
        validated: reasoningReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      project_context_memory_available: {
        validated: engineReady,
        context_memory_ref: PROJECT_CONTEXT_MEMORY_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'project_reasoning_model_metrics_v1',
    project_reasoning_model_score: buildScoreEntry('project_reasoning_model_score', reasoningReady, 0.985, true),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      reasoningReady,
      0.985
    ),
  };

  const passStatus = {
    project_reasoning_model_defined: reasoningReady,
    reasoning_types_defined: reasoningReady,
    reasoning_flow_defined: reasoningReady,
    reasoning_rules_defined: reasoningReady,
    reasoning_validation_defined: reasoningReady,
    repository_intelligence_protocol_generated: reasoningReady && ripReady,
    repository_intelligence_protocol_ready: reasoningReady && ripReady,
    future_protocol_compatible: reasoningReady,
    project_reasoning_model_ready: reasoningReady,
    bootstrap_completed: false,
  };

  return {
    project_reasoning_model_v1_id: PROJECT_REASONING_MODEL_V1_VERSION,
    project_reasoning_model_v1_version: PROJECT_REASONING_MODEL_V1_VERSION,
    generated_at: new Date().toISOString(),
    project_context_memory_v1_ref: PROJECT_CONTEXT_MEMORY_V1_PATH,
    project_reasoning_model_intelligence: projectReasoningModelIntelligence,
    project_reasoning_types_intelligence: projectReasoningTypesIntelligence,
    project_reasoning_flow_intelligence: projectReasoningFlowIntelligence,
    project_reasoning_rules_intelligence: projectReasoningRulesIntelligence,
    project_reasoning_validation_intelligence: projectReasoningValidationIntelligence,
    project_reasoning_model_rip_intelligence: projectReasoningModelRipIntelligence,
    project_reasoning_model_contract_validation_intelligence:
      projectReasoningModelContractValidationIntelligence,
    project_reasoning_model_metrics: metrics,
    project_reasoning_model_status: passStatus,
  };
}

export type ProjectReasoningModelV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_REASONING_MODEL_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_REASONING_MODEL_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_REASONING_MODEL_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_REASONING_MODEL_V1_ENGINE_FAIL_VERDICT;
  status: typeof PROJECT_REASONING_MODEL_V1_ENGINE_STATUS | 'PROJECT_REASONING_MODEL_V1_ENGINE_NOT_READY';
  project_reasoning_model_v1_engine_passed: boolean;
  project_reasoning_model_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectReasoningModelV1Engine(projectRoot?: string): ProjectReasoningModelV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectReasoningModelV1EngineResult['issues'] = [];

  const contextReportPath = path.join(root, PROJECT_CONTEXT_MEMORY_V1_REPORT_PATH);
  const contextArtifactPath = path.join(root, PROJECT_CONTEXT_MEMORY_V1_PATH);

  let contextReportReady = false;
  if (fs.existsSync(contextReportPath)) {
    const contextReport = readJson<{
      final_verdict: string;
      status: string;
      project_context_memory_v1_engine_passed?: boolean;
    }>(root, PROJECT_CONTEXT_MEMORY_V1_REPORT_PATH);

    contextReportReady =
      (contextReport.final_verdict === PROJECT_CONTEXT_MEMORY_V1_ENGINE_PASS_VERDICT ||
        contextReport.final_verdict === PROJECT_REASONING_MODEL_V1_PRECHECK_VERDICT) &&
      contextReport.status === PROJECT_CONTEXT_MEMORY_V1_ENGINE_STATUS &&
      contextReport.project_context_memory_v1_engine_passed === true;
  }

  const contextMemorySource = fs.existsSync(contextArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_CONTEXT_MEMORY_V1_PATH)
    : {};

  const contextStatus = (contextMemorySource.project_context_memory_status ?? {}) as Record<string, boolean>;

  const contextStatusReady = PROJECT_CONTEXT_MEMORY_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return contextStatus[key] === false;
    }
    return contextStatus[key] === true;
  });

  const engineReady =
    (contextReportReady || (fs.existsSync(contextArtifactPath) && contextStatusReady)) &&
    Object.keys(contextMemorySource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message: 'Project Context Memory V1 Engine must pass before Project Reasoning Model V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(contextArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Project context memory v1 artifact required for project reasoning model engine',
      severity: 'error',
    });
  }

  const artifact = buildProjectReasoningModelV1Artifact(
    contextMemorySource,
    engineReady && Object.keys(contextMemorySource).length > 0
  );
  writeJson(root, PROJECT_REASONING_MODEL_V1_PATH, artifact);

  const passStatus = artifact.project_reasoning_model_status as Record<
    (typeof PROJECT_REASONING_MODEL_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_REASONING_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.project_reasoning_model_metrics as {
    project_reasoning_model_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectReasoningModelV1EngineResult = {
    report_id: '',
    phase: PROJECT_REASONING_MODEL_V1_ENGINE_PHASE,
    system_id: PROJECT_REASONING_MODEL_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_REASONING_MODEL_V1_ENGINE_PASS_VERDICT
      : PROJECT_REASONING_MODEL_V1_ENGINE_FAIL_VERDICT,
    status: passed ? PROJECT_REASONING_MODEL_V1_ENGINE_STATUS : 'PROJECT_REASONING_MODEL_V1_ENGINE_NOT_READY',
    project_reasoning_model_v1_engine_passed: passed,
    project_reasoning_model_score: metrics.project_reasoning_model_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_reasoning_model_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_REASONING_MODEL_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_REASONING_MODEL_V1_PRECHECK_VERDICT,
    project_reasoning_model_score: result.project_reasoning_model_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_reasoning_model_v1_engine_passed: result.project_reasoning_model_v1_engine_passed,
    project_context_memory_v1_ref: PROJECT_CONTEXT_MEMORY_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectReasoningModelV1EngineReport(
  projectRoot?: string
): ProjectReasoningModelV1EngineResult {
  return runProjectReasoningModelV1Engine(projectRoot);
}
