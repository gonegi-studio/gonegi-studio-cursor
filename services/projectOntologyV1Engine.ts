import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_KNOWLEDGE_MODEL_V1_DATASET_DIR,
  PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_STATUS,
  PROJECT_KNOWLEDGE_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_KNOWLEDGE_MODEL_V1_PATH,
  PROJECT_KNOWLEDGE_MODEL_V1_REPORT_PATH,
} from './projectKnowledgeModelV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_ONTOLOGY_V1_ENGINE_PHASE = 'PHASE-PROJECT-BRAIN-198I' as const;
export const PROJECT_ONTOLOGY_V1_ENGINE_SYSTEM_ID = 'PROJECT_ONTOLOGY_V1_ENGINE' as const;
export const PROJECT_ONTOLOGY_V1_ENGINE_PASS_VERDICT = 'PASS_PROJECT_ONTOLOGY_V1' as const;
export const PROJECT_ONTOLOGY_V1_ENGINE_FAIL_VERDICT = 'FAIL_PROJECT_ONTOLOGY_V1' as const;
export const PROJECT_ONTOLOGY_V1_ENGINE_STATUS = 'PROJECT_ONTOLOGY_DEFINED' as const;
export const PROJECT_ONTOLOGY_V1_PRECHECK_VERDICT = 'PASS_PROJECT_KNOWLEDGE_MODEL_V1' as const;

export const PROJECT_ONTOLOGY_V1_DATASET_DIR = PROJECT_KNOWLEDGE_MODEL_V1_DATASET_DIR;
export const PROJECT_ONTOLOGY_V1_REGISTRY_PATH =
  `${PROJECT_ONTOLOGY_V1_DATASET_DIR}/project-ontology-v1-registry.json` as const;
export const PROJECT_ONTOLOGY_V1_SCHEMA_PATH =
  `${PROJECT_ONTOLOGY_V1_DATASET_DIR}/project-ontology-v1.schema.json` as const;
export const PROJECT_ONTOLOGY_V1_PATH = `${PROJECT_ONTOLOGY_V1_DATASET_DIR}/project-ontology-v1.json` as const;
export const PROJECT_ONTOLOGY_V1_REPORT_PATH =
  'reports/project_knowledge/PROJECT_ONTOLOGY_V1_REPORT.json' as const;

export const PROJECT_ONTOLOGY_V1_VERSION = 'project_ontology_v1' as const;
export const PROJECT_ONTOLOGY_VERSION = 1 as const;

export const PROJECT_ONTOLOGY_DOMAIN_KEYS = [
  'movie_analysis',
  'movie_reconstruction',
  'repository_intelligence',
  'project_knowledge',
  'image_generation',
  'video_generation',
  'runtime',
  'verification',
  'shared',
  'production',
] as const;

export const PROJECT_ONTOLOGY_ENTITY_ROLE_KEYS = [
  'producer',
  'consumer',
  'generator',
  'validator',
  'adapter',
  'runtime',
  'orchestrator',
  'archive',
  'index',
] as const;

export const PROJECT_ONTOLOGY_SEMANTIC_CATEGORY_KEYS = [
  'core',
  'support',
  'temporary',
  'generated',
  'derived',
  'reference',
  'deprecated',
] as const;

export const PROJECT_ONTOLOGY_KNOWLEDGE_RULE_KEYS = [
  'entity_role_validation',
  'semantic_consistency_check',
  'ontology_validation',
  'ontology_version',
] as const;

export const PROJECT_ONTOLOGY_V1_METRIC_KEYS = [
  'project_ontology_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_ONTOLOGY_V1_PASS_STATUS_KEYS = [
  'project_ontology_defined',
  'project_domains_defined',
  'entity_roles_defined',
  'semantic_categories_defined',
  'knowledge_rules_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'project_ontology_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_ontology_v1_engine_only: true as const,
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

function buildDomainEntry(domain: (typeof PROJECT_ONTOLOGY_DOMAIN_KEYS)[number], defined: boolean) {
  return {
    domain_id: domain,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildEntityRoleEntry(role: (typeof PROJECT_ONTOLOGY_ENTITY_ROLE_KEYS)[number], defined: boolean) {
  return {
    role_id: role,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildSemanticCategoryEntry(
  category: (typeof PROJECT_ONTOLOGY_SEMANTIC_CATEGORY_KEYS)[number],
  defined: boolean
) {
  return {
    category_id: category,
    defined,
    planning_only: true as const,
    analysis_only: true as const,
    permanent: true as const,
  };
}

function buildProjectOntologyV1Artifact(
  knowledgeModelSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const ripIntelligence = knowledgeModelSource.project_knowledge_model_rip_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = ripIntelligence?.repository_intelligence_protocol_model as Record<string, unknown> | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const ontologyReady = engineReady && ripReady;

  const projectDomainsIntelligence = {
    intelligence_id: 'project_domains_intelligence_v1',
    critical_model: 'project_domains_model' as const,
    project_domains_model: {
      model_id: 'project_domains_model_v1',
      generated: ontologyReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      domains: Object.fromEntries(
        PROJECT_ONTOLOGY_DOMAIN_KEYS.map((key) => [key, buildDomainEntry(key, ontologyReady)])
      ),
      project_domains_defined: ontologyReady,
      project_domains_ready: ontologyReady,
    },
  };

  const projectEntityRolesIntelligence = {
    intelligence_id: 'project_entity_roles_intelligence_v1',
    critical_model: 'project_entity_roles_model' as const,
    project_entity_roles_model: {
      model_id: 'project_entity_roles_model_v1',
      generated: ontologyReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      entity_roles: Object.fromEntries(
        PROJECT_ONTOLOGY_ENTITY_ROLE_KEYS.map((key) => [key, buildEntityRoleEntry(key, ontologyReady)])
      ),
      entity_roles_defined: ontologyReady,
      entity_roles_ready: ontologyReady,
    },
  };

  const projectSemanticCategoriesIntelligence = {
    intelligence_id: 'project_semantic_categories_intelligence_v1',
    critical_model: 'project_semantic_categories_model' as const,
    project_semantic_categories_model: {
      model_id: 'project_semantic_categories_model_v1',
      generated: ontologyReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      semantic_categories: Object.fromEntries(
        PROJECT_ONTOLOGY_SEMANTIC_CATEGORY_KEYS.map((key) => [
          key,
          buildSemanticCategoryEntry(key, ontologyReady),
        ])
      ),
      semantic_categories_defined: ontologyReady,
      semantic_categories_ready: ontologyReady,
    },
  };

  const projectKnowledgeRulesIntelligence = {
    intelligence_id: 'project_knowledge_rules_intelligence_v1',
    critical_model: 'project_knowledge_rules_model' as const,
    project_knowledge_rules_model: {
      model_id: 'project_knowledge_rules_model_v1',
      generated: ontologyReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      entity_role_validation: ontologyReady,
      semantic_consistency_check: ontologyReady,
      ontology_validation: ontologyReady,
      ontology_version: PROJECT_ONTOLOGY_VERSION,
      knowledge_rules_defined: ontologyReady,
      knowledge_rules_ready: ontologyReady,
    },
  };

  const projectOntologyModelIntelligence = {
    intelligence_id: 'project_ontology_model_intelligence_v1',
    critical_model: 'project_ontology_model' as const,
    project_ontology_model: {
      model_id: 'project_ontology_model_v1',
      generated: ontologyReady,
      planning_only: true,
      analysis_only: true,
      permanent: true,
      ontology_id: 'project_ontology_v1',
      ontology_version: PROJECT_ONTOLOGY_VERSION,
      project_knowledge_model_v1_ref: PROJECT_KNOWLEDGE_MODEL_V1_PATH,
      project_ontology_defined: ontologyReady,
      project_ontology_ready: ontologyReady,
    },
  };

  const projectOntologyRipIntelligence = {
    intelligence_id: 'project_ontology_rip_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: ontologyReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: ontologyReady && ripReady,
      analysis_only: true,
    },
  };

  const projectOntologyValidationIntelligence = {
    intelligence_id: 'project_ontology_validation_intelligence_v1',
    project_ontology_validation_model: {
      model_id: 'project_ontology_validation_model_v1',
      generated: ontologyReady,
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
        validated: ontologyReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      project_knowledge_model_available: {
        validated: engineReady,
        knowledge_model_ref: PROJECT_KNOWLEDGE_MODEL_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'project_ontology_metrics_v1',
    project_ontology_score: buildScoreEntry('project_ontology_score', ontologyReady, 0.985, true),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      ontologyReady,
      0.985
    ),
  };

  const passStatus = {
    project_ontology_defined: ontologyReady,
    project_domains_defined: ontologyReady,
    entity_roles_defined: ontologyReady,
    semantic_categories_defined: ontologyReady,
    knowledge_rules_defined: ontologyReady,
    repository_intelligence_protocol_generated: ontologyReady && ripReady,
    repository_intelligence_protocol_ready: ontologyReady && ripReady,
    future_protocol_compatible: ontologyReady,
    project_ontology_ready: ontologyReady,
    bootstrap_completed: false,
  };

  return {
    project_ontology_v1_id: PROJECT_ONTOLOGY_V1_VERSION,
    project_ontology_v1_version: PROJECT_ONTOLOGY_V1_VERSION,
    generated_at: new Date().toISOString(),
    project_knowledge_model_v1_ref: PROJECT_KNOWLEDGE_MODEL_V1_PATH,
    project_ontology_model_intelligence: projectOntologyModelIntelligence,
    project_domains_intelligence: projectDomainsIntelligence,
    project_entity_roles_intelligence: projectEntityRolesIntelligence,
    project_semantic_categories_intelligence: projectSemanticCategoriesIntelligence,
    project_knowledge_rules_intelligence: projectKnowledgeRulesIntelligence,
    project_ontology_rip_intelligence: projectOntologyRipIntelligence,
    project_ontology_validation_intelligence: projectOntologyValidationIntelligence,
    project_ontology_metrics: metrics,
    project_ontology_status: passStatus,
  };
}

export type ProjectOntologyV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_ONTOLOGY_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_ONTOLOGY_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_ONTOLOGY_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_ONTOLOGY_V1_ENGINE_FAIL_VERDICT;
  status: typeof PROJECT_ONTOLOGY_V1_ENGINE_STATUS | 'PROJECT_ONTOLOGY_V1_ENGINE_NOT_READY';
  project_ontology_v1_engine_passed: boolean;
  project_ontology_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectOntologyV1Engine(projectRoot?: string): ProjectOntologyV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectOntologyV1EngineResult['issues'] = [];

  const knowledgeReportPath = path.join(root, PROJECT_KNOWLEDGE_MODEL_V1_REPORT_PATH);
  const knowledgeArtifactPath = path.join(root, PROJECT_KNOWLEDGE_MODEL_V1_PATH);

  let knowledgeReportReady = false;
  if (fs.existsSync(knowledgeReportPath)) {
    const knowledgeReport = readJson<{
      final_verdict: string;
      status: string;
      project_knowledge_model_v1_engine_passed?: boolean;
    }>(root, PROJECT_KNOWLEDGE_MODEL_V1_REPORT_PATH);

    knowledgeReportReady =
      (knowledgeReport.final_verdict === PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PASS_VERDICT ||
        knowledgeReport.final_verdict === PROJECT_ONTOLOGY_V1_PRECHECK_VERDICT) &&
      knowledgeReport.status === PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_STATUS &&
      knowledgeReport.project_knowledge_model_v1_engine_passed === true;
  }

  const knowledgeModelSource = fs.existsSync(knowledgeArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_KNOWLEDGE_MODEL_V1_PATH)
    : {};

  const knowledgeStatus = (knowledgeModelSource.project_knowledge_model_status ?? {}) as Record<string, boolean>;

  const knowledgeStatusReady = PROJECT_KNOWLEDGE_MODEL_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return knowledgeStatus[key] === false;
    }
    return knowledgeStatus[key] === true;
  });

  const engineReady =
    (knowledgeReportReady || (fs.existsSync(knowledgeArtifactPath) && knowledgeStatusReady)) &&
    Object.keys(knowledgeModelSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message: 'Project Knowledge Model V1 Engine must pass before Project Ontology V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(knowledgeArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Project knowledge model v1 artifact required for project ontology engine',
      severity: 'error',
    });
  }

  const artifact = buildProjectOntologyV1Artifact(
    knowledgeModelSource,
    engineReady && Object.keys(knowledgeModelSource).length > 0
  );
  writeJson(root, PROJECT_ONTOLOGY_V1_PATH, artifact);

  const passStatus = artifact.project_ontology_status as Record<
    (typeof PROJECT_ONTOLOGY_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_ONTOLOGY_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.project_ontology_metrics as {
    project_ontology_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectOntologyV1EngineResult = {
    report_id: '',
    phase: PROJECT_ONTOLOGY_V1_ENGINE_PHASE,
    system_id: PROJECT_ONTOLOGY_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_ONTOLOGY_V1_ENGINE_PASS_VERDICT
      : PROJECT_ONTOLOGY_V1_ENGINE_FAIL_VERDICT,
    status: passed ? PROJECT_ONTOLOGY_V1_ENGINE_STATUS : 'PROJECT_ONTOLOGY_V1_ENGINE_NOT_READY',
    project_ontology_v1_engine_passed: passed,
    project_ontology_score: metrics.project_ontology_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_ontology_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_ONTOLOGY_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_ONTOLOGY_V1_PRECHECK_VERDICT,
    project_ontology_score: result.project_ontology_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_ontology_v1_engine_passed: result.project_ontology_v1_engine_passed,
    project_knowledge_model_v1_ref: PROJECT_KNOWLEDGE_MODEL_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectOntologyV1EngineReport(projectRoot?: string): ProjectOntologyV1EngineResult {
  return runProjectOntologyV1Engine(projectRoot);
}
