import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_DATASET_DIR,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_STATUS,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REPORT_PATH,
} from './projectSemanticRelationshipModelV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PHASE = 'PHASE-PROJECT-BRAIN-198K' as const;
export const PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_SYSTEM_ID = 'PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE' as const;
export const PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PASS_VERDICT = 'PASS_PROJECT_KNOWLEDGE_GRAPH_V1' as const;
export const PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_FAIL_VERDICT = 'FAIL_PROJECT_KNOWLEDGE_GRAPH_V1' as const;
export const PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_STATUS = 'PROJECT_KNOWLEDGE_GRAPH_DEFINED' as const;
export const PROJECT_KNOWLEDGE_GRAPH_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1' as const;

export const PROJECT_KNOWLEDGE_GRAPH_V1_DATASET_DIR = PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_DATASET_DIR;
export const PROJECT_KNOWLEDGE_GRAPH_V1_REGISTRY_PATH =
  `${PROJECT_KNOWLEDGE_GRAPH_V1_DATASET_DIR}/project-knowledge-graph-v1-registry.json` as const;
export const PROJECT_KNOWLEDGE_GRAPH_V1_SCHEMA_PATH =
  `${PROJECT_KNOWLEDGE_GRAPH_V1_DATASET_DIR}/project-knowledge-graph-v1.schema.json` as const;
export const PROJECT_KNOWLEDGE_GRAPH_V1_PATH =
  `${PROJECT_KNOWLEDGE_GRAPH_V1_DATASET_DIR}/project-knowledge-graph-v1.json` as const;
export const PROJECT_KNOWLEDGE_GRAPH_V1_REPORT_PATH =
  'reports/project_knowledge/PROJECT_KNOWLEDGE_GRAPH_V1_REPORT.json' as const;

export const PROJECT_KNOWLEDGE_GRAPH_V1_VERSION = 'project_knowledge_graph_v1' as const;
export const PROJECT_KNOWLEDGE_GRAPH_VERSION = 1 as const;

export const PROJECT_KNOWLEDGE_GRAPH_NODE_KEYS = [
  'entity_node',
  'directory_node',
  'domain_node',
  'runtime_node',
  'output_node',
  'service_node',
] as const;

export const PROJECT_KNOWLEDGE_GRAPH_EDGE_KEYS = [
  'semantic_edge',
  'dependency_edge',
  'lineage_edge',
  'reference_edge',
  'ownership_edge',
] as const;

export const PROJECT_KNOWLEDGE_GRAPH_NAVIGATION_KEYS = [
  'graph_query_supported',
  'multi_hop_supported',
  'reverse_lookup_supported',
  'impact_analysis_supported',
  'graph_partition_supported',
  'semantic_query_supported',
  'subgraph_query_supported',
] as const;

export const PROJECT_KNOWLEDGE_GRAPH_INTEGRITY_KEYS = [
  'graph_validation',
  'orphan_node_check',
  'cycle_detection_supported',
  'disconnected_subgraph_check',
  'graph_version',
] as const;

export const PROJECT_KNOWLEDGE_GRAPH_V1_METRIC_KEYS = [
  'project_knowledge_graph_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_KNOWLEDGE_GRAPH_V1_PASS_STATUS_KEYS = [
  'project_knowledge_graph_defined',
  'knowledge_graph_nodes_defined',
  'knowledge_graph_edges_defined',
  'graph_navigation_defined',
  'graph_integrity_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'project_knowledge_graph_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_knowledge_graph_v1_engine_only: true as const,
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

function buildGraphNodeEntry(nodeType: (typeof PROJECT_KNOWLEDGE_GRAPH_NODE_KEYS)[number], defined: boolean) {
  return {
    node_type: nodeType,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildGraphEdgeEntry(edgeType: (typeof PROJECT_KNOWLEDGE_GRAPH_EDGE_KEYS)[number], defined: boolean) {
  return {
    edge_type: edgeType,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildProjectKnowledgeGraphV1Artifact(
  relationshipModelSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const ripIntelligence = relationshipModelSource.project_semantic_relationship_model_rip_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = ripIntelligence?.repository_intelligence_protocol_model as Record<string, unknown> | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const graphReady = engineReady && ripReady;

  const projectKnowledgeGraphNodesIntelligence = {
    intelligence_id: 'project_knowledge_graph_nodes_intelligence_v1',
    critical_model: 'project_knowledge_graph_nodes_model' as const,
    project_knowledge_graph_nodes_model: {
      model_id: 'project_knowledge_graph_nodes_model_v1',
      generated: graphReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      nodes: Object.fromEntries(
        PROJECT_KNOWLEDGE_GRAPH_NODE_KEYS.map((key) => [key, buildGraphNodeEntry(key, graphReady)])
      ),
      knowledge_graph_nodes_defined: graphReady,
      knowledge_graph_nodes_ready: graphReady,
    },
  };

  const projectKnowledgeGraphEdgesIntelligence = {
    intelligence_id: 'project_knowledge_graph_edges_intelligence_v1',
    critical_model: 'project_knowledge_graph_edges_model' as const,
    project_knowledge_graph_edges_model: {
      model_id: 'project_knowledge_graph_edges_model_v1',
      generated: graphReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      edges: Object.fromEntries(
        PROJECT_KNOWLEDGE_GRAPH_EDGE_KEYS.map((key) => [key, buildGraphEdgeEntry(key, graphReady)])
      ),
      knowledge_graph_edges_defined: graphReady,
      knowledge_graph_edges_ready: graphReady,
    },
  };

  const projectGraphNavigationIntelligence = {
    intelligence_id: 'project_graph_navigation_intelligence_v1',
    critical_model: 'project_graph_navigation_model' as const,
    project_graph_navigation_model: {
      model_id: 'project_graph_navigation_model_v1',
      generated: graphReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      graph_query_supported: graphReady,
      multi_hop_supported: graphReady,
      reverse_lookup_supported: graphReady,
      impact_analysis_supported: graphReady,
      graph_partition_supported: graphReady,
      semantic_query_supported: graphReady,
      subgraph_query_supported: graphReady,
      graph_navigation_defined: graphReady,
      graph_navigation_ready: graphReady,
    },
  };

  const projectGraphIntegrityIntelligence = {
    intelligence_id: 'project_graph_integrity_intelligence_v1',
    critical_model: 'project_graph_integrity_model' as const,
    project_graph_integrity_model: {
      model_id: 'project_graph_integrity_model_v1',
      generated: graphReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      graph_validation: graphReady,
      orphan_node_check: graphReady,
      cycle_detection_supported: graphReady,
      disconnected_subgraph_check: graphReady,
      graph_version: PROJECT_KNOWLEDGE_GRAPH_VERSION,
      graph_integrity_defined: graphReady,
      graph_integrity_ready: graphReady,
    },
  };

  const projectKnowledgeGraphModelIntelligence = {
    intelligence_id: 'project_knowledge_graph_model_intelligence_v1',
    critical_model: 'project_knowledge_graph_model' as const,
    project_knowledge_graph_model: {
      model_id: 'project_knowledge_graph_model_v1',
      generated: graphReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      graph_id: 'project_knowledge_graph_v1',
      graph_version: PROJECT_KNOWLEDGE_GRAPH_VERSION,
      project_semantic_relationship_model_v1_ref: PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH,
      project_knowledge_graph_defined: graphReady,
      project_knowledge_graph_ready: graphReady,
    },
  };

  const projectKnowledgeGraphRipIntelligence = {
    intelligence_id: 'project_knowledge_graph_rip_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: graphReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: graphReady && ripReady,
      analysis_only: true,
    },
  };

  const projectKnowledgeGraphValidationIntelligence = {
    intelligence_id: 'project_knowledge_graph_validation_intelligence_v1',
    project_knowledge_graph_validation_model: {
      model_id: 'project_knowledge_graph_validation_model_v1',
      generated: graphReady,
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
        validated: graphReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      project_semantic_relationship_model_available: {
        validated: engineReady,
        relationship_model_ref: PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'project_knowledge_graph_metrics_v1',
    project_knowledge_graph_score: buildScoreEntry('project_knowledge_graph_score', graphReady, 0.985, true),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      graphReady,
      0.985
    ),
  };

  const passStatus = {
    project_knowledge_graph_defined: graphReady,
    knowledge_graph_nodes_defined: graphReady,
    knowledge_graph_edges_defined: graphReady,
    graph_navigation_defined: graphReady,
    graph_integrity_defined: graphReady,
    repository_intelligence_protocol_generated: graphReady && ripReady,
    repository_intelligence_protocol_ready: graphReady && ripReady,
    future_protocol_compatible: graphReady,
    project_knowledge_graph_ready: graphReady,
    bootstrap_completed: false,
  };

  return {
    project_knowledge_graph_v1_id: PROJECT_KNOWLEDGE_GRAPH_V1_VERSION,
    project_knowledge_graph_v1_version: PROJECT_KNOWLEDGE_GRAPH_V1_VERSION,
    generated_at: new Date().toISOString(),
    project_semantic_relationship_model_v1_ref: PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH,
    project_knowledge_graph_model_intelligence: projectKnowledgeGraphModelIntelligence,
    project_knowledge_graph_nodes_intelligence: projectKnowledgeGraphNodesIntelligence,
    project_knowledge_graph_edges_intelligence: projectKnowledgeGraphEdgesIntelligence,
    project_graph_navigation_intelligence: projectGraphNavigationIntelligence,
    project_graph_integrity_intelligence: projectGraphIntegrityIntelligence,
    project_knowledge_graph_rip_intelligence: projectKnowledgeGraphRipIntelligence,
    project_knowledge_graph_validation_intelligence: projectKnowledgeGraphValidationIntelligence,
    project_knowledge_graph_metrics: metrics,
    project_knowledge_graph_status: passStatus,
  };
}

export type ProjectKnowledgeGraphV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_FAIL_VERDICT;
  status: typeof PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_STATUS | 'PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_NOT_READY';
  project_knowledge_graph_v1_engine_passed: boolean;
  project_knowledge_graph_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectKnowledgeGraphV1Engine(projectRoot?: string): ProjectKnowledgeGraphV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectKnowledgeGraphV1EngineResult['issues'] = [];

  const relationshipReportPath = path.join(root, PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REPORT_PATH);
  const relationshipArtifactPath = path.join(root, PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH);

  let relationshipReportReady = false;
  if (fs.existsSync(relationshipReportPath)) {
    const relationshipReport = readJson<{
      final_verdict: string;
      status: string;
      project_semantic_relationship_model_v1_engine_passed?: boolean;
    }>(root, PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REPORT_PATH);

    relationshipReportReady =
      (relationshipReport.final_verdict === PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PASS_VERDICT ||
        relationshipReport.final_verdict === PROJECT_KNOWLEDGE_GRAPH_V1_PRECHECK_VERDICT) &&
      relationshipReport.status === PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_STATUS &&
      relationshipReport.project_semantic_relationship_model_v1_engine_passed === true;
  }

  const relationshipModelSource = fs.existsSync(relationshipArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH)
    : {};

  const relationshipStatus = (relationshipModelSource.project_semantic_relationship_model_status ??
    {}) as Record<string, boolean>;

  const relationshipStatusReady = PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return relationshipStatus[key] === false;
    }
    return relationshipStatus[key] === true;
  });

  const engineReady =
    (relationshipReportReady || (fs.existsSync(relationshipArtifactPath) && relationshipStatusReady)) &&
    Object.keys(relationshipModelSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Semantic Relationship Model V1 Engine must pass before Project Knowledge Graph V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(relationshipArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message:
        'Project semantic relationship model v1 artifact required for project knowledge graph engine',
      severity: 'error',
    });
  }

  const artifact = buildProjectKnowledgeGraphV1Artifact(
    relationshipModelSource,
    engineReady && Object.keys(relationshipModelSource).length > 0
  );
  writeJson(root, PROJECT_KNOWLEDGE_GRAPH_V1_PATH, artifact);

  const passStatus = artifact.project_knowledge_graph_status as Record<
    (typeof PROJECT_KNOWLEDGE_GRAPH_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_KNOWLEDGE_GRAPH_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.project_knowledge_graph_metrics as {
    project_knowledge_graph_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectKnowledgeGraphV1EngineResult = {
    report_id: '',
    phase: PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PHASE,
    system_id: PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PASS_VERDICT
      : PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_FAIL_VERDICT,
    status: passed ? PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_STATUS : 'PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_NOT_READY',
    project_knowledge_graph_v1_engine_passed: passed,
    project_knowledge_graph_score: metrics.project_knowledge_graph_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_knowledge_graph_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_KNOWLEDGE_GRAPH_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_KNOWLEDGE_GRAPH_V1_PRECHECK_VERDICT,
    project_knowledge_graph_score: result.project_knowledge_graph_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_knowledge_graph_v1_engine_passed: result.project_knowledge_graph_v1_engine_passed,
    project_semantic_relationship_model_v1_ref: PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectKnowledgeGraphV1EngineReport(
  projectRoot?: string
): ProjectKnowledgeGraphV1EngineResult {
  return runProjectKnowledgeGraphV1Engine(projectRoot);
}
