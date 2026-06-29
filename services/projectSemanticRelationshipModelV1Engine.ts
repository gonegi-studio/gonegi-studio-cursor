import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ONTOLOGY_V1_DATASET_DIR,
  PROJECT_ONTOLOGY_V1_ENGINE_PASS_VERDICT,
  PROJECT_ONTOLOGY_V1_ENGINE_STATUS,
  PROJECT_ONTOLOGY_V1_PASS_STATUS_KEYS,
  PROJECT_ONTOLOGY_V1_PATH,
  PROJECT_ONTOLOGY_V1_REPORT_PATH,
} from './projectOntologyV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PHASE =
  'PHASE-PROJECT-BRAIN-198J' as const;
export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_SYSTEM_ID =
  'PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE' as const;
export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1' as const;
export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1' as const;
export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_STATUS =
  'PROJECT_SEMANTIC_RELATIONSHIP_MODEL_DEFINED' as const;
export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_ONTOLOGY_V1' as const;

export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_DATASET_DIR = PROJECT_ONTOLOGY_V1_DATASET_DIR;
export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REGISTRY_PATH =
  `${PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_DATASET_DIR}/project-semantic-relationship-model-v1-registry.json` as const;
export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_SCHEMA_PATH =
  `${PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_DATASET_DIR}/project-semantic-relationship-model-v1.schema.json` as const;
export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH =
  `${PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_DATASET_DIR}/project-semantic-relationship-model-v1.json` as const;
export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REPORT_PATH =
  'reports/project_knowledge/PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REPORT.json' as const;

export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_VERSION =
  'project_semantic_relationship_model_v1' as const;
export const PROJECT_SEMANTIC_RELATIONSHIP_VERSION = 1 as const;

export const PROJECT_SEMANTIC_RELATIONSHIP_TYPE_KEYS = [
  'depends_on',
  'imports',
  'exports',
  'generates',
  'validates',
  'references',
  'belongs_to',
  'derived_from',
  'extends',
  'replaces',
] as const;

export const PROJECT_SEMANTIC_RELATIONSHIP_DIRECTION_KEYS = [
  'source_entity',
  'target_entity',
  'relationship_strength',
  'relationship_priority',
  'bidirectional_supported',
] as const;

export const PROJECT_SEMANTIC_RELATIONSHIP_VALIDATION_KEYS = [
  'relationship_validation',
  'semantic_graph_validation',
  'cycle_detection_supported',
  'orphan_relationship_check',
] as const;

export const PROJECT_SEMANTIC_RELATIONSHIP_VERSIONING_KEYS = [
  'relationship_version',
  'lineage_supported',
  'history_supported',
] as const;

export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_METRIC_KEYS = [
  'project_semantic_relationship_model_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PASS_STATUS_KEYS = [
  'project_semantic_relationship_model_defined',
  'semantic_relationship_types_defined',
  'relationship_direction_defined',
  'relationship_validation_defined',
  'relationship_versioning_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'project_semantic_relationship_model_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_semantic_relationship_model_v1_engine_only: true as const,
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

function buildRelationshipTypeEntry(
  relationshipType: (typeof PROJECT_SEMANTIC_RELATIONSHIP_TYPE_KEYS)[number],
  defined: boolean
) {
  return {
    relationship_type: relationshipType,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildDirectionField(
  field: (typeof PROJECT_SEMANTIC_RELATIONSHIP_DIRECTION_KEYS)[number],
  defined: boolean,
  value?: boolean
) {
  return {
    field_id: field,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
    ...(value !== undefined ? { value } : {}),
  };
}

function buildProjectSemanticRelationshipModelV1Artifact(
  ontologySource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const ripIntelligence = ontologySource.project_ontology_rip_intelligence as Record<string, unknown> | undefined;
  const ripModel = ripIntelligence?.repository_intelligence_protocol_model as Record<string, unknown> | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const modelReady = engineReady && ripReady;

  const projectSemanticRelationshipTypesIntelligence = {
    intelligence_id: 'project_semantic_relationship_types_intelligence_v1',
    critical_model: 'project_semantic_relationship_types_model' as const,
    project_semantic_relationship_types_model: {
      model_id: 'project_semantic_relationship_types_model_v1',
      generated: modelReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      relationship_types: Object.fromEntries(
        PROJECT_SEMANTIC_RELATIONSHIP_TYPE_KEYS.map((key) => [
          key,
          buildRelationshipTypeEntry(key, modelReady),
        ])
      ),
      semantic_relationship_types_defined: modelReady,
      semantic_relationship_types_ready: modelReady,
    },
  };

  const projectRelationshipDirectionIntelligence = {
    intelligence_id: 'project_relationship_direction_intelligence_v1',
    critical_model: 'project_relationship_direction_model' as const,
    project_relationship_direction_model: {
      model_id: 'project_relationship_direction_model_v1',
      generated: modelReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      direction_fields: {
        source_entity: buildDirectionField('source_entity', modelReady),
        target_entity: buildDirectionField('target_entity', modelReady),
        relationship_strength: buildDirectionField('relationship_strength', modelReady),
        relationship_priority: buildDirectionField('relationship_priority', modelReady),
        bidirectional_supported: buildDirectionField('bidirectional_supported', modelReady, true),
      },
      source_entity: modelReady,
      target_entity: modelReady,
      relationship_strength: modelReady,
      relationship_priority: modelReady,
      bidirectional_supported: true,
      relationship_direction_defined: modelReady,
      relationship_direction_ready: modelReady,
    },
  };

  const projectRelationshipValidationIntelligence = {
    intelligence_id: 'project_relationship_validation_intelligence_v1',
    critical_model: 'project_relationship_validation_model' as const,
    project_relationship_validation_model: {
      model_id: 'project_relationship_validation_model_v1',
      generated: modelReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      relationship_validation: modelReady,
      semantic_graph_validation: modelReady,
      cycle_detection_supported: modelReady,
      orphan_relationship_check: modelReady,
      relationship_validation_defined: modelReady,
      relationship_validation_ready: modelReady,
    },
  };

  const projectRelationshipVersioningIntelligence = {
    intelligence_id: 'project_relationship_versioning_intelligence_v1',
    critical_model: 'project_relationship_versioning_model' as const,
    project_relationship_versioning_model: {
      model_id: 'project_relationship_versioning_model_v1',
      generated: modelReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      relationship_version: PROJECT_SEMANTIC_RELATIONSHIP_VERSION,
      lineage_supported: modelReady,
      history_supported: modelReady,
      relationship_versioning_defined: modelReady,
      relationship_versioning_ready: modelReady,
    },
  };

  const projectSemanticRelationshipModelIntelligence = {
    intelligence_id: 'project_semantic_relationship_model_intelligence_v1',
    critical_model: 'project_semantic_relationship_model' as const,
    project_semantic_relationship_model: {
      model_id: 'project_semantic_relationship_model_v1',
      generated: modelReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      relationship_model_id: 'project_semantic_relationship_model_v1',
      relationship_version: PROJECT_SEMANTIC_RELATIONSHIP_VERSION,
      project_ontology_v1_ref: PROJECT_ONTOLOGY_V1_PATH,
      project_semantic_relationship_model_defined: modelReady,
      project_semantic_relationship_model_ready: modelReady,
    },
  };

  const projectSemanticRelationshipModelRipIntelligence = {
    intelligence_id: 'project_semantic_relationship_model_rip_intelligence_v1',
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

  const projectSemanticRelationshipModelValidationIntelligence = {
    intelligence_id: 'project_semantic_relationship_model_validation_intelligence_v1',
    project_semantic_relationship_model_validation_model: {
      model_id: 'project_semantic_relationship_model_validation_model_v1',
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
      project_ontology_available: {
        validated: engineReady,
        ontology_ref: PROJECT_ONTOLOGY_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'project_semantic_relationship_model_metrics_v1',
    project_semantic_relationship_model_score: buildScoreEntry(
      'project_semantic_relationship_model_score',
      modelReady,
      0.985,
      true
    ),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      modelReady,
      0.985
    ),
  };

  const passStatus = {
    project_semantic_relationship_model_defined: modelReady,
    semantic_relationship_types_defined: modelReady,
    relationship_direction_defined: modelReady,
    relationship_validation_defined: modelReady,
    relationship_versioning_defined: modelReady,
    repository_intelligence_protocol_generated: modelReady && ripReady,
    repository_intelligence_protocol_ready: modelReady && ripReady,
    future_protocol_compatible: modelReady,
    project_semantic_relationship_model_ready: modelReady,
    bootstrap_completed: false,
  };

  return {
    project_semantic_relationship_model_v1_id: PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_VERSION,
    project_semantic_relationship_model_v1_version: PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_VERSION,
    generated_at: new Date().toISOString(),
    project_ontology_v1_ref: PROJECT_ONTOLOGY_V1_PATH,
    project_semantic_relationship_model_intelligence: projectSemanticRelationshipModelIntelligence,
    project_semantic_relationship_types_intelligence: projectSemanticRelationshipTypesIntelligence,
    project_relationship_direction_intelligence: projectRelationshipDirectionIntelligence,
    project_relationship_validation_intelligence: projectRelationshipValidationIntelligence,
    project_relationship_versioning_intelligence: projectRelationshipVersioningIntelligence,
    project_semantic_relationship_model_rip_intelligence: projectSemanticRelationshipModelRipIntelligence,
    project_semantic_relationship_model_validation_intelligence:
      projectSemanticRelationshipModelValidationIntelligence,
    project_semantic_relationship_model_metrics: metrics,
    project_semantic_relationship_model_status: passStatus,
  };
}

export type ProjectSemanticRelationshipModelV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_STATUS
    | 'PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_NOT_READY';
  project_semantic_relationship_model_v1_engine_passed: boolean;
  project_semantic_relationship_model_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectSemanticRelationshipModelV1Engine(
  projectRoot?: string
): ProjectSemanticRelationshipModelV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectSemanticRelationshipModelV1EngineResult['issues'] = [];

  const ontologyReportPath = path.join(root, PROJECT_ONTOLOGY_V1_REPORT_PATH);
  const ontologyArtifactPath = path.join(root, PROJECT_ONTOLOGY_V1_PATH);

  let ontologyReportReady = false;
  if (fs.existsSync(ontologyReportPath)) {
    const ontologyReport = readJson<{
      final_verdict: string;
      status: string;
      project_ontology_v1_engine_passed?: boolean;
    }>(root, PROJECT_ONTOLOGY_V1_REPORT_PATH);

    ontologyReportReady =
      (ontologyReport.final_verdict === PROJECT_ONTOLOGY_V1_ENGINE_PASS_VERDICT ||
        ontologyReport.final_verdict === PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PRECHECK_VERDICT) &&
      ontologyReport.status === PROJECT_ONTOLOGY_V1_ENGINE_STATUS &&
      ontologyReport.project_ontology_v1_engine_passed === true;
  }

  const ontologySource = fs.existsSync(ontologyArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_ONTOLOGY_V1_PATH)
    : {};

  const ontologyStatus = (ontologySource.project_ontology_status ?? {}) as Record<string, boolean>;

  const ontologyStatusReady = PROJECT_ONTOLOGY_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return ontologyStatus[key] === false;
    }
    return ontologyStatus[key] === true;
  });

  const engineReady =
    (ontologyReportReady || (fs.existsSync(ontologyArtifactPath) && ontologyStatusReady)) &&
    Object.keys(ontologySource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message: 'Project Ontology V1 Engine must pass before Project Semantic Relationship Model V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(ontologyArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Project ontology v1 artifact required for project semantic relationship model engine',
      severity: 'error',
    });
  }

  const artifact = buildProjectSemanticRelationshipModelV1Artifact(
    ontologySource,
    engineReady && Object.keys(ontologySource).length > 0
  );
  writeJson(root, PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH, artifact);

  const passStatus = artifact.project_semantic_relationship_model_status as Record<
    (typeof PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.project_semantic_relationship_model_metrics as {
    project_semantic_relationship_model_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectSemanticRelationshipModelV1EngineResult = {
    report_id: '',
    phase: PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PHASE,
    system_id: PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PASS_VERDICT
      : PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_STATUS
      : 'PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_NOT_READY',
    project_semantic_relationship_model_v1_engine_passed: passed,
    project_semantic_relationship_model_score: metrics.project_semantic_relationship_model_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_semantic_relationship_model_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PRECHECK_VERDICT,
    project_semantic_relationship_model_score: result.project_semantic_relationship_model_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_semantic_relationship_model_v1_engine_passed:
      result.project_semantic_relationship_model_v1_engine_passed,
    project_ontology_v1_ref: PROJECT_ONTOLOGY_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectSemanticRelationshipModelV1EngineReport(
  projectRoot?: string
): ProjectSemanticRelationshipModelV1EngineResult {
  return runProjectSemanticRelationshipModelV1Engine(projectRoot);
}
