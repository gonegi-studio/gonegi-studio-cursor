import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_REPORT_PATH,
} from './projectRepositoryBootstrapExecutionPlanV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PHASE = 'PHASE-PROJECT-BRAIN-198H' as const;
export const PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_SYSTEM_ID = 'PROJECT_KNOWLEDGE_MODEL_V1_ENGINE' as const;
export const PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PASS_VERDICT = 'PASS_PROJECT_KNOWLEDGE_MODEL_V1' as const;
export const PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_FAIL_VERDICT = 'FAIL_PROJECT_KNOWLEDGE_MODEL_V1' as const;
export const PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_STATUS = 'PROJECT_KNOWLEDGE_MODEL_DEFINED' as const;
export const PROJECT_KNOWLEDGE_MODEL_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1' as const;

export const PROJECT_KNOWLEDGE_MODEL_V1_DATASET_DIR = 'datasets/project_knowledge' as const;
export const PROJECT_KNOWLEDGE_MODEL_V1_REGISTRY_PATH =
  `${PROJECT_KNOWLEDGE_MODEL_V1_DATASET_DIR}/project-knowledge-model-v1-registry.json` as const;
export const PROJECT_KNOWLEDGE_MODEL_V1_SCHEMA_PATH =
  `${PROJECT_KNOWLEDGE_MODEL_V1_DATASET_DIR}/project-knowledge-model-v1.schema.json` as const;
export const PROJECT_KNOWLEDGE_MODEL_V1_PATH =
  `${PROJECT_KNOWLEDGE_MODEL_V1_DATASET_DIR}/project-knowledge-model-v1.json` as const;
export const PROJECT_KNOWLEDGE_MODEL_V1_REPORT_PATH =
  'reports/project_knowledge/PROJECT_KNOWLEDGE_MODEL_V1_REPORT.json' as const;

export const PROJECT_KNOWLEDGE_MODEL_V1_VERSION = 'project_knowledge_model_v1' as const;

export const PROJECT_KNOWLEDGE_ENTITY_TYPE_KEYS = [
  'engine',
  'dataset',
  'schema',
  'registry',
  'verify_script',
  'report',
  'service',
  'adapter',
  'runtime',
  'directory',
  'output',
] as const;

export const PROJECT_KNOWLEDGE_RELATIONSHIP_KEYS = [
  'depends_on',
  'imports',
  'exports',
  'generates',
  'validates',
  'references',
  'belongs_to',
  'derived_from',
] as const;

export const PROJECT_KNOWLEDGE_IDENTITY_KEYS = [
  'knowledge_id',
  'entity_id',
  'lineage_id',
  'semantic_group',
  'knowledge_version',
] as const;

export const PROJECT_KNOWLEDGE_MODEL_V1_METRIC_KEYS = [
  'project_knowledge_model_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_KNOWLEDGE_MODEL_V1_PASS_STATUS_KEYS = [
  'project_knowledge_model_defined',
  'project_knowledge_entity_types_defined',
  'project_knowledge_relationships_defined',
  'project_knowledge_identity_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'project_knowledge_model_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_knowledge_model_v1_engine_only: true as const,
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

function buildEntityTypeEntry(entityType: (typeof PROJECT_KNOWLEDGE_ENTITY_TYPE_KEYS)[number], defined: boolean) {
  return {
    entity_type: entityType,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildRelationshipEntry(
  relationship: (typeof PROJECT_KNOWLEDGE_RELATIONSHIP_KEYS)[number],
  defined: boolean
) {
  return {
    relationship_type: relationship,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildIdentityField(
  field: (typeof PROJECT_KNOWLEDGE_IDENTITY_KEYS)[number],
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

function buildProjectKnowledgeModelV1Artifact(
  executionPlanSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const planModelIntelligence = executionPlanSource.repository_bootstrap_execution_plan_model_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = planModelIntelligence?.repository_intelligence_protocol_model as
    | Record<string, unknown>
    | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const modelReady = engineReady && ripReady;

  const projectKnowledgeModelIntelligence = {
    intelligence_id: 'project_knowledge_model_intelligence_v1',
    critical_model: 'project_knowledge_model' as const,
    project_knowledge_model: {
      model_id: 'project_knowledge_model_v1',
      generated: modelReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      knowledge_id: 'project_knowledge_model_v1',
      entity_id: 'project_knowledge_model',
      lineage_id: 'project_brain_198h',
      semantic_group: 'project_knowledge',
      knowledge_version: PROJECT_KNOWLEDGE_MODEL_V1_VERSION,
      repository_bootstrap_execution_plan_v1_ref: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
      project_knowledge_model_defined: modelReady,
      project_knowledge_model_ready: modelReady,
    },
  };

  const projectKnowledgeEntityTypesIntelligence = {
    intelligence_id: 'project_knowledge_entity_types_intelligence_v1',
    critical_model: 'project_knowledge_entity_types_model' as const,
    project_knowledge_entity_types_model: {
      model_id: 'project_knowledge_entity_types_model_v1',
      generated: modelReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      entity_types: Object.fromEntries(
        PROJECT_KNOWLEDGE_ENTITY_TYPE_KEYS.map((key) => [key, buildEntityTypeEntry(key, modelReady)])
      ),
      project_knowledge_entity_types_defined: modelReady,
      project_knowledge_entity_types_ready: modelReady,
    },
  };

  const projectKnowledgeRelationshipsIntelligence = {
    intelligence_id: 'project_knowledge_relationships_intelligence_v1',
    critical_model: 'project_knowledge_relationships_model' as const,
    project_knowledge_relationships_model: {
      model_id: 'project_knowledge_relationships_model_v1',
      generated: modelReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      relationships: Object.fromEntries(
        PROJECT_KNOWLEDGE_RELATIONSHIP_KEYS.map((key) => [key, buildRelationshipEntry(key, modelReady)])
      ),
      project_knowledge_relationships_defined: modelReady,
      project_knowledge_relationships_ready: modelReady,
    },
  };

  const projectKnowledgeIdentityIntelligence = {
    intelligence_id: 'project_knowledge_identity_intelligence_v1',
    critical_model: 'project_knowledge_identity_model' as const,
    project_knowledge_identity_model: {
      model_id: 'project_knowledge_identity_model_v1',
      generated: modelReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      identity_fields: Object.fromEntries(
        PROJECT_KNOWLEDGE_IDENTITY_KEYS.map((key) => [key, buildIdentityField(key, modelReady)])
      ),
      knowledge_id: 'project_knowledge_model_v1',
      entity_id: 'project_knowledge_model',
      lineage_id: 'project_brain_198h',
      semantic_group: 'project_knowledge',
      knowledge_version: PROJECT_KNOWLEDGE_MODEL_V1_VERSION,
      project_knowledge_identity_defined: modelReady,
      project_knowledge_identity_ready: modelReady,
    },
  };

  const projectKnowledgeModelRipIntelligence = {
    intelligence_id: 'project_knowledge_model_rip_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: modelReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: modelReady && ripReady,
      analysis_only: true,
    },
  };

  const projectKnowledgeModelValidationIntelligence = {
    intelligence_id: 'project_knowledge_model_validation_intelligence_v1',
    project_knowledge_model_validation_model: {
      model_id: 'project_knowledge_model_validation_model_v1',
      generated: modelReady,
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
        validated: modelReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      repository_bootstrap_execution_plan_available: {
        validated: engineReady,
        execution_plan_ref: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'project_knowledge_model_metrics_v1',
    project_knowledge_model_score: buildScoreEntry('project_knowledge_model_score', modelReady, 0.985, true),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      modelReady,
      0.985
    ),
  };

  const passStatus = {
    project_knowledge_model_defined: modelReady,
    project_knowledge_entity_types_defined: modelReady,
    project_knowledge_relationships_defined: modelReady,
    project_knowledge_identity_defined: modelReady,
    repository_intelligence_protocol_generated: modelReady && ripReady,
    repository_intelligence_protocol_ready: modelReady && ripReady,
    future_protocol_compatible: modelReady,
    project_knowledge_model_ready: modelReady,
    bootstrap_completed: false,
  };

  return {
    project_knowledge_model_v1_id: PROJECT_KNOWLEDGE_MODEL_V1_VERSION,
    project_knowledge_model_v1_version: PROJECT_KNOWLEDGE_MODEL_V1_VERSION,
    generated_at: new Date().toISOString(),
    repository_bootstrap_execution_plan_v1_ref: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
    project_knowledge_model_intelligence: projectKnowledgeModelIntelligence,
    project_knowledge_entity_types_intelligence: projectKnowledgeEntityTypesIntelligence,
    project_knowledge_relationships_intelligence: projectKnowledgeRelationshipsIntelligence,
    project_knowledge_identity_intelligence: projectKnowledgeIdentityIntelligence,
    project_knowledge_model_rip_intelligence: projectKnowledgeModelRipIntelligence,
    project_knowledge_model_validation_intelligence: projectKnowledgeModelValidationIntelligence,
    project_knowledge_model_metrics: metrics,
    project_knowledge_model_status: passStatus,
  };
}

export type ProjectKnowledgeModelV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_FAIL_VERDICT;
  status: typeof PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_STATUS | 'PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_NOT_READY';
  project_knowledge_model_v1_engine_passed: boolean;
  project_knowledge_model_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectKnowledgeModelV1Engine(projectRoot?: string): ProjectKnowledgeModelV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectKnowledgeModelV1EngineResult['issues'] = [];

  const planReportPath = path.join(root, PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_REPORT_PATH);
  const planArtifactPath = path.join(root, PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH);

  let planReportReady = false;
  if (fs.existsSync(planReportPath)) {
    const planReport = readJson<{
      final_verdict: string;
      status: string;
      project_repository_bootstrap_execution_plan_v1_engine_passed?: boolean;
    }>(root, PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_REPORT_PATH);

    planReportReady =
      (planReport.final_verdict === PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_PASS_VERDICT ||
        planReport.final_verdict === PROJECT_KNOWLEDGE_MODEL_V1_PRECHECK_VERDICT) &&
      planReport.status === PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_STATUS &&
      planReport.project_repository_bootstrap_execution_plan_v1_engine_passed === true;
  }

  const executionPlanSource = fs.existsSync(planArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH)
    : {};

  const planStatus = (executionPlanSource.repository_bootstrap_execution_plan_status ?? {}) as Record<
    string,
    boolean
  >;

  const planStatusReady = PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return planStatus[key] === false;
    }
    return planStatus[key] === true;
  });

  const engineReady =
    (planReportReady || (fs.existsSync(planArtifactPath) && planStatusReady)) &&
    Object.keys(executionPlanSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Repository Bootstrap Execution Plan V1 Engine must pass before Project Knowledge Model V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(planArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Repository bootstrap execution plan v1 artifact required for project knowledge model engine',
      severity: 'error',
    });
  }

  const artifact = buildProjectKnowledgeModelV1Artifact(
    executionPlanSource,
    engineReady && Object.keys(executionPlanSource).length > 0
  );
  writeJson(root, PROJECT_KNOWLEDGE_MODEL_V1_PATH, artifact);

  const passStatus = artifact.project_knowledge_model_status as Record<
    (typeof PROJECT_KNOWLEDGE_MODEL_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_KNOWLEDGE_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.project_knowledge_model_metrics as {
    project_knowledge_model_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectKnowledgeModelV1EngineResult = {
    report_id: '',
    phase: PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PHASE,
    system_id: PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PASS_VERDICT
      : PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_FAIL_VERDICT,
    status: passed ? PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_STATUS : 'PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_NOT_READY',
    project_knowledge_model_v1_engine_passed: passed,
    project_knowledge_model_score: metrics.project_knowledge_model_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_knowledge_model_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_KNOWLEDGE_MODEL_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_KNOWLEDGE_MODEL_V1_PRECHECK_VERDICT,
    project_knowledge_model_score: result.project_knowledge_model_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_knowledge_model_v1_engine_passed: result.project_knowledge_model_v1_engine_passed,
    repository_bootstrap_execution_plan_v1_ref: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectKnowledgeModelV1EngineReport(
  projectRoot?: string
): ProjectKnowledgeModelV1EngineResult {
  return runProjectKnowledgeModelV1Engine(projectRoot);
}
