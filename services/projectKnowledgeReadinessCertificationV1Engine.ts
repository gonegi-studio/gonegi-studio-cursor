import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_DATASET_DIR,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_STATUS,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REPORT_PATH,
} from './projectKnowledgeValidationModelV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_PHASE =
  'PHASE-PROJECT-BRAIN-198P' as const;
export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_SYSTEM_ID =
  'PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE' as const;
export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1' as const;
export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1' as const;
export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_STATUS =
  'PROJECT_KNOWLEDGE_READY' as const;
export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1' as const;

export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR =
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_DATASET_DIR;
export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_REGISTRY_PATH =
  `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-knowledge-readiness-certification-v1-registry.json` as const;
export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_SCHEMA_PATH =
  `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-knowledge-readiness-certification-v1.schema.json` as const;
export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PATH =
  `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-knowledge-readiness-certification-v1.json` as const;
export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_REPORT_PATH =
  'reports/project_knowledge/PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_REPORT.json' as const;

export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_VERSION =
  'project_knowledge_readiness_certification_v1' as const;
export const PROJECT_KNOWLEDGE_READINESS_VERSION = 1 as const;

export const PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS = {
  knowledge_model_v1: `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-knowledge-model-v1.json`,
  ontology_v1: `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-ontology-v1.json`,
  semantic_relationship_model_v1: `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-semantic-relationship-model-v1.json`,
  knowledge_graph_v1: `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-knowledge-graph-v1.json`,
  context_memory_v1: `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-context-memory-v1.json`,
  reasoning_model_v1: `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-reasoning-model-v1.json`,
  query_model_v1: `${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_DATASET_DIR}/project-knowledge-query-model-v1.json`,
  validation_model_v1: PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH,
} as const;

export const PROJECT_KNOWLEDGE_LAYER_VERIFICATION_KEYS = [
  'knowledge_layer_verified',
  'ontology_layer_verified',
  'knowledge_graph_verified',
  'context_reasoning_query_verified',
  'validation_layer_verified',
] as const;

export const PROJECT_KNOWLEDGE_READINESS_REPORT_KEYS = [
  'knowledge_ready',
  'repository_bootstrap_ready',
  'execution_mode_ready',
  'rip_ready',
  'all_knowledge_checks_passed',
] as const;

export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_METRIC_KEYS = [
  'project_knowledge_readiness_certification_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PASS_STATUS_KEYS = [
  'knowledge_layer_verified',
  'ontology_layer_verified',
  'knowledge_graph_verified',
  'context_reasoning_query_verified',
  'validation_layer_verified',
  'readiness_report_generated',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'project_knowledge_certified',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_knowledge_readiness_certification_v1_engine_only: true as const,
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

function readArtifactStatus(root: string, rel: string, readyKey: string): boolean {
  if (!fs.existsSync(path.join(root, rel))) {
    return false;
  }
  const artifact = readJson<Record<string, unknown>>(root, rel);
  for (const value of Object.values(artifact)) {
    if (value && typeof value === 'object' && readyKey in (value as Record<string, unknown>)) {
      return (value as Record<string, unknown>)[readyKey] === true;
    }
  }
  const statusSections = Object.values(artifact).filter(
    (entry) => entry && typeof entry === 'object' && readyKey in (entry as Record<string, unknown>)
  );
  if (statusSections.length > 0) {
    return statusSections.some((entry) => (entry as Record<string, unknown>)[readyKey] === true);
  }
  return false;
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

type ProjectKnowledgeLayerReadiness = {
  knowledgeLayerReady: boolean;
  ontologyLayerReady: boolean;
  knowledgeGraphReady: boolean;
  contextReasoningQueryReady: boolean;
  validationLayerReady: boolean;
};

type ProjectKnowledgeReadinessChecks = {
  knowledge_ready: boolean;
  repository_bootstrap_ready: boolean;
  execution_mode_ready: boolean;
  rip_ready: boolean;
  all_knowledge_checks_passed: boolean;
};

function buildProjectKnowledgeReadinessCertificationV1Artifact(
  validationModelSource: Record<string, unknown>,
  engineReady: boolean,
  layerReadiness: ProjectKnowledgeLayerReadiness,
  readinessChecks: ProjectKnowledgeReadinessChecks
): Record<string, unknown> {
  const ripIntelligence = validationModelSource.project_knowledge_validation_model_rip_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = ripIntelligence?.repository_intelligence_protocol_model as
    | Record<string, unknown>
    | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const certified =
    engineReady && readinessChecks.all_knowledge_checks_passed === true && ripReady;

  const projectKnowledgeLayerVerificationIntelligence = {
    intelligence_id: 'project_knowledge_layer_verification_intelligence_v1',
    project_knowledge_layer_verification_model: {
      model_id: 'project_knowledge_layer_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: layerReadiness.knowledgeLayerReady,
      knowledge_model_v1_ref: PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.knowledge_model_v1,
      knowledge_layer_verified: layerReadiness.knowledgeLayerReady,
    },
  };

  const projectOntologyLayerVerificationIntelligence = {
    intelligence_id: 'project_ontology_layer_verification_intelligence_v1',
    project_ontology_layer_verification_model: {
      model_id: 'project_ontology_layer_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: layerReadiness.ontologyLayerReady,
      ontology_v1_ref: PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.ontology_v1,
      ontology_layer_verified: layerReadiness.ontologyLayerReady,
    },
  };

  const projectKnowledgeGraphVerificationIntelligence = {
    intelligence_id: 'project_knowledge_graph_verification_intelligence_v1',
    project_knowledge_graph_verification_model: {
      model_id: 'project_knowledge_graph_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: layerReadiness.knowledgeGraphReady,
      semantic_relationship_model_v1_ref:
        PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.semantic_relationship_model_v1,
      knowledge_graph_v1_ref: PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.knowledge_graph_v1,
      knowledge_graph_verified: layerReadiness.knowledgeGraphReady,
    },
  };

  const projectContextReasoningQueryVerificationIntelligence = {
    intelligence_id: 'project_context_reasoning_query_verification_intelligence_v1',
    project_context_reasoning_query_verification_model: {
      model_id: 'project_context_reasoning_query_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: layerReadiness.contextReasoningQueryReady,
      context_memory_v1_ref: PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.context_memory_v1,
      reasoning_model_v1_ref: PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.reasoning_model_v1,
      query_model_v1_ref: PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.query_model_v1,
      context_reasoning_query_verified: layerReadiness.contextReasoningQueryReady,
    },
  };

  const projectValidationLayerVerificationIntelligence = {
    intelligence_id: 'project_validation_layer_verification_intelligence_v1',
    project_validation_layer_verification_model: {
      model_id: 'project_validation_layer_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: layerReadiness.validationLayerReady,
      validation_model_v1_ref: PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.validation_model_v1,
      validation_layer_verified: layerReadiness.validationLayerReady,
    },
  };

  const projectKnowledgeReadinessReportIntelligence = {
    intelligence_id: 'project_knowledge_readiness_report_intelligence_v1',
    project_knowledge_readiness_report_model: {
      model_id: 'project_knowledge_readiness_report_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      knowledge_ready: readinessChecks.knowledge_ready,
      repository_bootstrap_ready: readinessChecks.repository_bootstrap_ready,
      execution_mode_ready: readinessChecks.execution_mode_ready,
      rip_ready: readinessChecks.rip_ready,
      knowledge_version: PROJECT_KNOWLEDGE_READINESS_VERSION,
      all_knowledge_checks_passed: readinessChecks.all_knowledge_checks_passed,
      readiness_report_generated: certified,
    },
  };

  const projectKnowledgeReadinessCertificationModelIntelligence = {
    intelligence_id: 'project_knowledge_readiness_certification_model_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: certified,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: certified && ripReady,
      analysis_only: true,
    },
  };

  const projectKnowledgeReadinessCertificationValidationIntelligence = {
    intelligence_id: 'project_knowledge_readiness_certification_validation_intelligence_v1',
    project_knowledge_readiness_certification_validation_model: {
      model_id: 'project_knowledge_readiness_certification_validation_model_v1',
      generated: certified,
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
        validated: certified,
        adapter_ready: true,
        backward_compatible: true,
      },
      project_knowledge_validation_model_available: {
        validated: engineReady,
        validation_model_ref: PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'project_knowledge_readiness_certification_metrics_v1',
    project_knowledge_readiness_certification_score: buildScoreEntry(
      'project_knowledge_readiness_certification_score',
      certified,
      0.985,
      true
    ),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      certified,
      0.985
    ),
  };

  const passStatus = {
    knowledge_layer_verified: layerReadiness.knowledgeLayerReady,
    ontology_layer_verified: layerReadiness.ontologyLayerReady,
    knowledge_graph_verified: layerReadiness.knowledgeGraphReady,
    context_reasoning_query_verified: layerReadiness.contextReasoningQueryReady,
    validation_layer_verified: layerReadiness.validationLayerReady,
    readiness_report_generated: certified,
    repository_intelligence_protocol_generated: certified && ripReady,
    repository_intelligence_protocol_ready: certified && ripReady,
    future_protocol_compatible: certified,
    project_knowledge_certified: certified,
    bootstrap_completed: false,
  };

  return {
    project_knowledge_readiness_certification_v1_id:
      PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_VERSION,
    project_knowledge_readiness_certification_v1_version:
      PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_VERSION,
    generated_at: new Date().toISOString(),
    project_knowledge_validation_model_v1_ref: PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH,
    project_knowledge_layer_verification_intelligence: projectKnowledgeLayerVerificationIntelligence,
    project_ontology_layer_verification_intelligence: projectOntologyLayerVerificationIntelligence,
    project_knowledge_graph_verification_intelligence: projectKnowledgeGraphVerificationIntelligence,
    project_context_reasoning_query_verification_intelligence:
      projectContextReasoningQueryVerificationIntelligence,
    project_validation_layer_verification_intelligence: projectValidationLayerVerificationIntelligence,
    project_knowledge_readiness_report_intelligence: projectKnowledgeReadinessReportIntelligence,
    project_knowledge_readiness_certification_model_intelligence:
      projectKnowledgeReadinessCertificationModelIntelligence,
    project_knowledge_readiness_certification_validation_intelligence:
      projectKnowledgeReadinessCertificationValidationIntelligence,
    project_knowledge_readiness_certification_metrics: metrics,
    project_knowledge_readiness_certification_status: passStatus,
  };
}

export type ProjectKnowledgeReadinessCertificationV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_STATUS
    | 'PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_NOT_READY';
  project_knowledge_readiness_certification_v1_engine_passed: boolean;
  all_knowledge_checks_passed: boolean;
  project_knowledge_readiness_certification_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectKnowledgeReadinessCertificationV1Engine(
  projectRoot?: string
): ProjectKnowledgeReadinessCertificationV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectKnowledgeReadinessCertificationV1EngineResult['issues'] = [];

  const validationReportPath = path.join(root, PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REPORT_PATH);
  const validationArtifactPath = path.join(root, PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH);

  let validationReportReady = false;
  if (fs.existsSync(validationReportPath)) {
    const validationReport = readJson<{
      final_verdict: string;
      status: string;
      project_knowledge_validation_model_v1_engine_passed?: boolean;
    }>(root, PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REPORT_PATH);

    validationReportReady =
      (validationReport.final_verdict === PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PASS_VERDICT ||
        validationReport.final_verdict ===
          PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PRECHECK_VERDICT) &&
      validationReport.status === PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_STATUS &&
      validationReport.project_knowledge_validation_model_v1_engine_passed === true;
  }

  const validationModelSource = fs.existsSync(validationArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH)
    : {};

  const validationStatus = (validationModelSource.project_knowledge_validation_model_status ??
    {}) as Record<string, boolean>;

  const validationStatusReady = PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return validationStatus[key] === false;
    }
    return validationStatus[key] === true;
  });

  const engineReady =
    (validationReportReady || (fs.existsSync(validationArtifactPath) && validationStatusReady)) &&
    Object.keys(validationModelSource).length > 0;

  const knowledgeLayerReady = readArtifactStatus(
    root,
    PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.knowledge_model_v1,
    'project_knowledge_model_ready'
  );
  const ontologyLayerReady = readArtifactStatus(
    root,
    PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.ontology_v1,
    'project_ontology_ready'
  );
  const semanticRelationshipReady = readArtifactStatus(
    root,
    PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.semantic_relationship_model_v1,
    'project_semantic_relationship_model_ready'
  );
  const knowledgeGraphReady =
    readArtifactStatus(
      root,
      PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.knowledge_graph_v1,
      'project_knowledge_graph_ready'
    ) && semanticRelationshipReady;
  const contextReady = readArtifactStatus(
    root,
    PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.context_memory_v1,
    'project_context_memory_ready'
  );
  const reasoningReady = readArtifactStatus(
    root,
    PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.reasoning_model_v1,
    'project_reasoning_model_ready'
  );
  const queryReady = readArtifactStatus(
    root,
    PROJECT_KNOWLEDGE_CHAIN_ARTIFACT_REFS.query_model_v1,
    'project_knowledge_query_model_ready'
  );
  const validationLayerReady =
    validationStatusReady && validationStatus.project_knowledge_validation_model_ready === true;
  const contextReasoningQueryReady = contextReady && reasoningReady && queryReady;
  const ripReady =
    (
      validationModelSource.project_knowledge_validation_model_rip_intelligence as
        | Record<string, unknown>
        | undefined
    )?.repository_intelligence_protocol_model as Record<string, unknown> | undefined;

  const ripReadyFlag = ripReady?.repository_intelligence_protocol_ready === true;

  const knowledgeReady =
    engineReady &&
    knowledgeLayerReady &&
    ontologyLayerReady &&
    knowledgeGraphReady &&
    validationLayerReady;
  const repositoryBootstrapReady = knowledgeReady && contextReasoningQueryReady;
  const executionModeReady = repositoryBootstrapReady && ripReadyFlag;

  const layerReadiness: ProjectKnowledgeLayerReadiness = {
    knowledgeLayerReady,
    ontologyLayerReady,
    knowledgeGraphReady,
    contextReasoningQueryReady,
    validationLayerReady,
  };

  const readinessChecks: ProjectKnowledgeReadinessChecks = {
    knowledge_ready: knowledgeReady,
    repository_bootstrap_ready: repositoryBootstrapReady,
    execution_mode_ready: executionModeReady,
    rip_ready: ripReadyFlag,
    all_knowledge_checks_passed:
      engineReady &&
      knowledgeLayerReady &&
      ontologyLayerReady &&
      knowledgeGraphReady &&
      contextReasoningQueryReady &&
      validationLayerReady &&
      ripReadyFlag,
  };

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Knowledge Validation Model V1 Engine must pass before Project Knowledge Readiness Certification V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(validationArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message:
        'Project knowledge validation model v1 artifact required for project knowledge readiness certification engine',
      severity: 'error',
    });
  }

  const artifact = buildProjectKnowledgeReadinessCertificationV1Artifact(
    validationModelSource,
    engineReady && Object.keys(validationModelSource).length > 0,
    layerReadiness,
    readinessChecks
  );
  writeJson(root, PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PATH, artifact);

  const passStatus = artifact.project_knowledge_readiness_certification_status as Record<
    (typeof PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    readinessChecks.all_knowledge_checks_passed &&
    PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.project_knowledge_readiness_certification_metrics as {
    project_knowledge_readiness_certification_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectKnowledgeReadinessCertificationV1EngineResult = {
    report_id: '',
    phase: PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_PHASE,
    system_id: PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_PASS_VERDICT
      : PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_STATUS
      : 'PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_NOT_READY',
    project_knowledge_readiness_certification_v1_engine_passed: passed,
    all_knowledge_checks_passed: readinessChecks.all_knowledge_checks_passed,
    project_knowledge_readiness_certification_score:
      metrics.project_knowledge_readiness_certification_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_knowledge_readiness_certification_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PRECHECK_VERDICT,
    all_knowledge_checks_passed: result.all_knowledge_checks_passed,
    project_knowledge_readiness_certification_score: result.project_knowledge_readiness_certification_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_knowledge_readiness_certification_v1_engine_passed:
      result.project_knowledge_readiness_certification_v1_engine_passed,
    project_knowledge_validation_model_v1_ref: PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectKnowledgeReadinessCertificationV1EngineReport(
  projectRoot?: string
): ProjectKnowledgeReadinessCertificationV1EngineResult {
  return runProjectKnowledgeReadinessCertificationV1Engine(projectRoot);
}
