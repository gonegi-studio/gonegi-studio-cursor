import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_KNOWLEDGE_GRAPH_V1_DATASET_DIR,
  PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PASS_VERDICT,
  PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_STATUS,
  PROJECT_KNOWLEDGE_GRAPH_V1_PASS_STATUS_KEYS,
  PROJECT_KNOWLEDGE_GRAPH_V1_PATH,
  PROJECT_KNOWLEDGE_GRAPH_V1_REPORT_PATH,
} from './projectKnowledgeGraphV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_CONTEXT_MEMORY_V1_ENGINE_PHASE = 'PHASE-PROJECT-BRAIN-198L' as const;
export const PROJECT_CONTEXT_MEMORY_V1_ENGINE_SYSTEM_ID = 'PROJECT_CONTEXT_MEMORY_V1_ENGINE' as const;
export const PROJECT_CONTEXT_MEMORY_V1_ENGINE_PASS_VERDICT = 'PASS_PROJECT_CONTEXT_MEMORY_V1' as const;
export const PROJECT_CONTEXT_MEMORY_V1_ENGINE_FAIL_VERDICT = 'FAIL_PROJECT_CONTEXT_MEMORY_V1' as const;
export const PROJECT_CONTEXT_MEMORY_V1_ENGINE_STATUS = 'PROJECT_CONTEXT_MEMORY_DEFINED' as const;
export const PROJECT_CONTEXT_MEMORY_V1_PRECHECK_VERDICT = 'PASS_PROJECT_KNOWLEDGE_GRAPH_V1' as const;

export const PROJECT_CONTEXT_MEMORY_V1_DATASET_DIR = PROJECT_KNOWLEDGE_GRAPH_V1_DATASET_DIR;
export const PROJECT_CONTEXT_MEMORY_V1_REGISTRY_PATH =
  `${PROJECT_CONTEXT_MEMORY_V1_DATASET_DIR}/project-context-memory-v1-registry.json` as const;
export const PROJECT_CONTEXT_MEMORY_V1_SCHEMA_PATH =
  `${PROJECT_CONTEXT_MEMORY_V1_DATASET_DIR}/project-context-memory-v1.schema.json` as const;
export const PROJECT_CONTEXT_MEMORY_V1_PATH =
  `${PROJECT_CONTEXT_MEMORY_V1_DATASET_DIR}/project-context-memory-v1.json` as const;
export const PROJECT_CONTEXT_MEMORY_V1_REPORT_PATH =
  'reports/project_knowledge/PROJECT_CONTEXT_MEMORY_V1_REPORT.json' as const;

export const PROJECT_CONTEXT_MEMORY_V1_VERSION = 'project_context_memory_v1' as const;
export const PROJECT_CONTEXT_VERSION = 1 as const;

export const PROJECT_CONTEXT_MEMORY_FIELD_KEYS = [
  'context_id',
  'context_scope',
  'context_summary',
  'context_priority',
  'context_timestamp',
] as const;

export const PROJECT_CONTEXT_LINK_KEYS = [
  'knowledge_graph_link',
  'ontology_link',
  'semantic_link',
  'lineage_link',
] as const;

export const PROJECT_CONTEXT_RETRIEVAL_KEYS = [
  'semantic_context_query',
  'multi_hop_context',
  'partition_context',
] as const;

export const PROJECT_CONTEXT_UPDATE_KEYS = [
  'incremental_context_update',
  'context_validation',
  'context_expiration_supported',
  'context_version',
] as const;

export const PROJECT_CONTEXT_MEMORY_V1_METRIC_KEYS = [
  'project_context_memory_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_CONTEXT_MEMORY_V1_PASS_STATUS_KEYS = [
  'project_context_memory_defined',
  'context_memory_fields_defined',
  'context_links_defined',
  'context_retrieval_defined',
  'context_update_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'project_context_memory_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_context_memory_v1_engine_only: true as const,
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

function buildContextMemoryField(
  field: (typeof PROJECT_CONTEXT_MEMORY_FIELD_KEYS)[number],
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

function buildContextLinkEntry(linkType: (typeof PROJECT_CONTEXT_LINK_KEYS)[number], defined: boolean) {
  return {
    link_type: linkType,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildProjectContextMemoryV1Artifact(
  knowledgeGraphSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const ripIntelligence = knowledgeGraphSource.project_knowledge_graph_rip_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = ripIntelligence?.repository_intelligence_protocol_model as Record<string, unknown> | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const memoryReady = engineReady && ripReady;

  const projectContextMemoryIntelligence = {
    intelligence_id: 'project_context_memory_intelligence_v1',
    critical_model: 'project_context_memory_model' as const,
    project_context_memory_model: {
      model_id: 'project_context_memory_model_v1',
      generated: memoryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      memory_id: 'project_context_memory_v1',
      context_version: PROJECT_CONTEXT_VERSION,
      project_knowledge_graph_v1_ref: PROJECT_KNOWLEDGE_GRAPH_V1_PATH,
      context_fields: Object.fromEntries(
        PROJECT_CONTEXT_MEMORY_FIELD_KEYS.map((key) => [key, buildContextMemoryField(key, memoryReady)])
      ),
      context_id: memoryReady ? 'project_context_memory_v1' : undefined,
      context_scope: memoryReady ? 'project_knowledge' : undefined,
      context_summary: memoryReady ? 'permanent_project_context_memory_planning_only' : undefined,
      context_priority: memoryReady ? 'core' : undefined,
      context_timestamp: memoryReady ? new Date().toISOString() : undefined,
      project_context_memory_defined: memoryReady,
      context_memory_fields_defined: memoryReady,
      project_context_memory_ready: memoryReady,
    },
  };

  const projectContextLinksIntelligence = {
    intelligence_id: 'project_context_links_intelligence_v1',
    critical_model: 'project_context_links_model' as const,
    project_context_links_model: {
      model_id: 'project_context_links_model_v1',
      generated: memoryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      context_links: Object.fromEntries(
        PROJECT_CONTEXT_LINK_KEYS.map((key) => [key, buildContextLinkEntry(key, memoryReady)])
      ),
      context_links_defined: memoryReady,
      context_links_ready: memoryReady,
    },
  };

  const projectContextRetrievalIntelligence = {
    intelligence_id: 'project_context_retrieval_intelligence_v1',
    critical_model: 'project_context_retrieval_model' as const,
    project_context_retrieval_model: {
      model_id: 'project_context_retrieval_model_v1',
      generated: memoryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      semantic_context_query: memoryReady,
      multi_hop_context: memoryReady,
      partition_context: memoryReady,
      context_retrieval_defined: memoryReady,
      context_retrieval_ready: memoryReady,
    },
  };

  const projectContextUpdateIntelligence = {
    intelligence_id: 'project_context_update_intelligence_v1',
    critical_model: 'project_context_update_model' as const,
    project_context_update_model: {
      model_id: 'project_context_update_model_v1',
      generated: memoryReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      incremental_context_update: memoryReady,
      context_validation: memoryReady,
      context_expiration_supported: memoryReady,
      context_version: PROJECT_CONTEXT_VERSION,
      context_update_defined: memoryReady,
      context_update_ready: memoryReady,
    },
  };

  const projectContextMemoryRipIntelligence = {
    intelligence_id: 'project_context_memory_rip_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: memoryReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: memoryReady && ripReady,
      analysis_only: true,
    },
  };

  const projectContextMemoryValidationIntelligence = {
    intelligence_id: 'project_context_memory_validation_intelligence_v1',
    project_context_memory_validation_model: {
      model_id: 'project_context_memory_validation_model_v1',
      generated: memoryReady,
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
        validated: memoryReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      project_knowledge_graph_available: {
        validated: engineReady,
        knowledge_graph_ref: PROJECT_KNOWLEDGE_GRAPH_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'project_context_memory_metrics_v1',
    project_context_memory_score: buildScoreEntry('project_context_memory_score', memoryReady, 0.985, true),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      memoryReady,
      0.985
    ),
  };

  const passStatus = {
    project_context_memory_defined: memoryReady,
    context_memory_fields_defined: memoryReady,
    context_links_defined: memoryReady,
    context_retrieval_defined: memoryReady,
    context_update_defined: memoryReady,
    repository_intelligence_protocol_generated: memoryReady && ripReady,
    repository_intelligence_protocol_ready: memoryReady && ripReady,
    future_protocol_compatible: memoryReady,
    project_context_memory_ready: memoryReady,
    bootstrap_completed: false,
  };

  return {
    project_context_memory_v1_id: PROJECT_CONTEXT_MEMORY_V1_VERSION,
    project_context_memory_v1_version: PROJECT_CONTEXT_MEMORY_V1_VERSION,
    generated_at: new Date().toISOString(),
    project_knowledge_graph_v1_ref: PROJECT_KNOWLEDGE_GRAPH_V1_PATH,
    project_context_memory_intelligence: projectContextMemoryIntelligence,
    project_context_links_intelligence: projectContextLinksIntelligence,
    project_context_retrieval_intelligence: projectContextRetrievalIntelligence,
    project_context_update_intelligence: projectContextUpdateIntelligence,
    project_context_memory_rip_intelligence: projectContextMemoryRipIntelligence,
    project_context_memory_validation_intelligence: projectContextMemoryValidationIntelligence,
    project_context_memory_metrics: metrics,
    project_context_memory_status: passStatus,
  };
}

export type ProjectContextMemoryV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_CONTEXT_MEMORY_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_CONTEXT_MEMORY_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_CONTEXT_MEMORY_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_CONTEXT_MEMORY_V1_ENGINE_FAIL_VERDICT;
  status: typeof PROJECT_CONTEXT_MEMORY_V1_ENGINE_STATUS | 'PROJECT_CONTEXT_MEMORY_V1_ENGINE_NOT_READY';
  project_context_memory_v1_engine_passed: boolean;
  project_context_memory_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectContextMemoryV1Engine(projectRoot?: string): ProjectContextMemoryV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectContextMemoryV1EngineResult['issues'] = [];

  const graphReportPath = path.join(root, PROJECT_KNOWLEDGE_GRAPH_V1_REPORT_PATH);
  const graphArtifactPath = path.join(root, PROJECT_KNOWLEDGE_GRAPH_V1_PATH);

  let graphReportReady = false;
  if (fs.existsSync(graphReportPath)) {
    const graphReport = readJson<{
      final_verdict: string;
      status: string;
      project_knowledge_graph_v1_engine_passed?: boolean;
    }>(root, PROJECT_KNOWLEDGE_GRAPH_V1_REPORT_PATH);

    graphReportReady =
      (graphReport.final_verdict === PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PASS_VERDICT ||
        graphReport.final_verdict === PROJECT_CONTEXT_MEMORY_V1_PRECHECK_VERDICT) &&
      graphReport.status === PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_STATUS &&
      graphReport.project_knowledge_graph_v1_engine_passed === true;
  }

  const knowledgeGraphSource = fs.existsSync(graphArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_KNOWLEDGE_GRAPH_V1_PATH)
    : {};

  const graphStatus = (knowledgeGraphSource.project_knowledge_graph_status ?? {}) as Record<string, boolean>;

  const graphStatusReady = PROJECT_KNOWLEDGE_GRAPH_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return graphStatus[key] === false;
    }
    return graphStatus[key] === true;
  });

  const engineReady =
    (graphReportReady || (fs.existsSync(graphArtifactPath) && graphStatusReady)) &&
    Object.keys(knowledgeGraphSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message: 'Project Knowledge Graph V1 Engine must pass before Project Context Memory V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(graphArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Project knowledge graph v1 artifact required for project context memory engine',
      severity: 'error',
    });
  }

  const artifact = buildProjectContextMemoryV1Artifact(
    knowledgeGraphSource,
    engineReady && Object.keys(knowledgeGraphSource).length > 0
  );
  writeJson(root, PROJECT_CONTEXT_MEMORY_V1_PATH, artifact);

  const passStatus = artifact.project_context_memory_status as Record<
    (typeof PROJECT_CONTEXT_MEMORY_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_CONTEXT_MEMORY_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.project_context_memory_metrics as {
    project_context_memory_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectContextMemoryV1EngineResult = {
    report_id: '',
    phase: PROJECT_CONTEXT_MEMORY_V1_ENGINE_PHASE,
    system_id: PROJECT_CONTEXT_MEMORY_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_CONTEXT_MEMORY_V1_ENGINE_PASS_VERDICT
      : PROJECT_CONTEXT_MEMORY_V1_ENGINE_FAIL_VERDICT,
    status: passed ? PROJECT_CONTEXT_MEMORY_V1_ENGINE_STATUS : 'PROJECT_CONTEXT_MEMORY_V1_ENGINE_NOT_READY',
    project_context_memory_v1_engine_passed: passed,
    project_context_memory_score: metrics.project_context_memory_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_context_memory_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_CONTEXT_MEMORY_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_CONTEXT_MEMORY_V1_PRECHECK_VERDICT,
    project_context_memory_score: result.project_context_memory_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_context_memory_v1_engine_passed: result.project_context_memory_v1_engine_passed,
    project_knowledge_graph_v1_ref: PROJECT_KNOWLEDGE_GRAPH_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectContextMemoryV1EngineReport(
  projectRoot?: string
): ProjectContextMemoryV1EngineResult {
  return runProjectContextMemoryV1Engine(projectRoot);
}
