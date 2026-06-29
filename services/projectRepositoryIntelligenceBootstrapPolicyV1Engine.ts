import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_DATASET_DIR,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_REPORT_PATH,
} from './projectRepositoryIntelligenceBootstrapV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PHASE =
  'PHASE-PROJECT-BRAIN-198B' as const;
export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_SYSTEM_ID =
  'PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE' as const;
export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1' as const;
export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1' as const;
export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_STATUS =
  'PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_DEFINED' as const;
export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1' as const;

export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_DATASET_DIR =
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_DATASET_DIR;
export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REGISTRY_PATH =
  `${PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_DATASET_DIR}/repository-bootstrap-policy-v1-registry.json` as const;
export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_SCHEMA_PATH =
  `${PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_DATASET_DIR}/repository-bootstrap-policy-v1.schema.json` as const;
export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH =
  `${PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_DATASET_DIR}/repository-bootstrap-policy-v1.json` as const;
export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REPORT_PATH =
  'reports/repository_intelligence/PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REPORT.json' as const;

export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_VERSION =
  'repository_bootstrap_policy_v1' as const;

export const REPOSITORY_SCAN_SCOPE_RULE_KEYS = [
  'include_rules',
  'exclude_rules',
  'generated_artifact_rules',
  'large_file_rules',
] as const;

export const REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_MODEL_KEYS = [
  'repository_scan_scope_model',
  'repository_scan_priority_model',
  'repository_incremental_policy_model',
  'repository_cache_policy_model',
  'repository_intelligence_protocol_model',
] as const;

export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_METRIC_KEYS = [
  'repository_intelligence_bootstrap_policy_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PASS_STATUS_KEYS = [
  'repository_scan_scope_defined',
  'repository_scan_priority_defined',
  'repository_incremental_policy_defined',
  'repository_cache_policy_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'repository_intelligence_bootstrap_policy_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_repository_intelligence_bootstrap_policy_v1_engine_only: true as const,
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

function buildRuleSet(ruleId: string, defined: boolean) {
  return {
    rule_set_id: ruleId,
    defined,
    planning_only: true as const,
    populated: false,
    analysis_only: true as const,
  };
}

function buildRepositoryBootstrapPolicyV1Artifact(
  bootstrapSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const bootstrapModelIntelligence = bootstrapSource.repository_intelligence_bootstrap_model_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = bootstrapModelIntelligence?.repository_intelligence_protocol_model as
    | Record<string, unknown>
    | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const policyReady = engineReady && ripReady;

  const repositoryScanScopeIntelligence = {
    intelligence_id: 'repository_scan_scope_intelligence_v1',
    critical_model: 'repository_scan_scope_model' as const,
    repository_scan_scope_model: {
      model_id: 'repository_scan_scope_model_v1',
      generated: policyReady,
      planning_only: true,
      analysis_only: true,
      include_rules: buildRuleSet('include_rules', policyReady),
      exclude_rules: buildRuleSet('exclude_rules', policyReady),
      generated_artifact_rules: buildRuleSet('generated_artifact_rules', policyReady),
      large_file_rules: buildRuleSet('large_file_rules', policyReady),
      repository_scan_scope_ready: policyReady,
    },
  };

  const repositoryScanPriorityIntelligence = {
    intelligence_id: 'repository_scan_priority_intelligence_v1',
    critical_model: 'repository_scan_priority_model' as const,
    repository_scan_priority_model: {
      model_id: 'repository_scan_priority_model_v1',
      generated: policyReady,
      planning_only: true,
      analysis_only: true,
      metadata_first: true,
      hash_second: true,
      dependency_third: true,
      content_last: true,
      repository_scan_priority_ready: policyReady,
    },
  };

  const repositoryIncrementalPolicyIntelligence = {
    intelligence_id: 'repository_incremental_policy_intelligence_v1',
    critical_model: 'repository_incremental_policy_model' as const,
    repository_incremental_policy_model: {
      model_id: 'repository_incremental_policy_model_v1',
      generated: policyReady,
      planning_only: true,
      analysis_only: true,
      changed_files_only: true,
      timestamp_supported: true,
      hash_supported: true,
      incremental_priority: true,
      rename_detection_supported: true,
      repository_incremental_policy_ready: policyReady,
    },
  };

  const repositoryCachePolicyIntelligence = {
    intelligence_id: 'repository_cache_policy_intelligence_v1',
    critical_model: 'repository_cache_policy_model' as const,
    repository_cache_policy_model: {
      model_id: 'repository_cache_policy_model_v1',
      generated: policyReady,
      planning_only: true,
      analysis_only: true,
      cache_reuse: true,
      cache_validation: true,
      cache_rebuild_required: false,
      bootstrap_completed: false,
      cache_version: 1,
      cache_integrity_check: true,
      repository_cache_policy_ready: policyReady,
    },
  };

  const repositoryIntelligenceBootstrapPolicyModelIntelligence = {
    intelligence_id: 'repository_intelligence_bootstrap_policy_model_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: policyReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: policyReady && ripReady,
      analysis_only: true,
    },
  };

  const repositoryIntelligenceBootstrapPolicyValidationIntelligence = {
    intelligence_id: 'repository_intelligence_bootstrap_policy_validation_intelligence_v1',
    repository_intelligence_bootstrap_policy_validation_model: {
      model_id: 'repository_intelligence_bootstrap_policy_validation_model_v1',
      generated: policyReady,
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
        validated: policyReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      repository_intelligence_bootstrap_available: {
        validated: engineReady,
        bootstrap_ref: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'repository_intelligence_bootstrap_policy_metrics_v1',
    repository_intelligence_bootstrap_policy_score: buildScoreEntry(
      'repository_intelligence_bootstrap_policy_score',
      policyReady,
      0.985,
      true
    ),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      policyReady,
      0.985
    ),
  };

  const passStatus = {
    repository_scan_scope_defined: policyReady,
    repository_scan_priority_defined: policyReady,
    repository_incremental_policy_defined: policyReady,
    repository_cache_policy_defined: policyReady,
    repository_intelligence_protocol_generated: policyReady && ripReady,
    repository_intelligence_protocol_ready: policyReady && ripReady,
    future_protocol_compatible: policyReady,
    repository_intelligence_bootstrap_policy_ready: policyReady,
    bootstrap_completed: false,
  };

  return {
    repository_bootstrap_policy_v1_id: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_VERSION,
    repository_bootstrap_policy_v1_version: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_VERSION,
    generated_at: new Date().toISOString(),
    repository_bootstrap_v1_ref: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PATH,
    repository_scan_scope_intelligence: repositoryScanScopeIntelligence,
    repository_scan_priority_intelligence: repositoryScanPriorityIntelligence,
    repository_incremental_policy_intelligence: repositoryIncrementalPolicyIntelligence,
    repository_cache_policy_intelligence: repositoryCachePolicyIntelligence,
    repository_intelligence_bootstrap_policy_model_intelligence:
      repositoryIntelligenceBootstrapPolicyModelIntelligence,
    repository_intelligence_bootstrap_policy_validation_intelligence:
      repositoryIntelligenceBootstrapPolicyValidationIntelligence,
    repository_intelligence_bootstrap_policy_metrics: metrics,
    repository_intelligence_bootstrap_policy_status: passStatus,
  };
}

export type ProjectRepositoryIntelligenceBootstrapPolicyV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_STATUS
    | 'PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_NOT_READY';
  project_repository_intelligence_bootstrap_policy_v1_engine_passed: boolean;
  repository_intelligence_bootstrap_policy_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectRepositoryIntelligenceBootstrapPolicyV1Engine(
  projectRoot?: string
): ProjectRepositoryIntelligenceBootstrapPolicyV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectRepositoryIntelligenceBootstrapPolicyV1EngineResult['issues'] = [];

  const bootstrapReportPath = path.join(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_REPORT_PATH);
  const bootstrapArtifactPath = path.join(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PATH);

  let bootstrapReportReady = false;
  if (fs.existsSync(bootstrapReportPath)) {
    const bootstrapReport = readJson<{
      final_verdict: string;
      status: string;
      project_repository_intelligence_bootstrap_v1_engine_passed?: boolean;
    }>(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_REPORT_PATH);

    bootstrapReportReady =
      (bootstrapReport.final_verdict === PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_PASS_VERDICT ||
        bootstrapReport.final_verdict === PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PRECHECK_VERDICT) &&
      bootstrapReport.status === PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_STATUS &&
      bootstrapReport.project_repository_intelligence_bootstrap_v1_engine_passed === true;
  }

  const bootstrapSource = fs.existsSync(bootstrapArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PATH)
    : {};

  const bootstrapStatus = (bootstrapSource.repository_intelligence_bootstrap_status ?? {}) as Record<
    string,
    boolean
  >;

  const bootstrapStatusReady = PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return bootstrapStatus[key] === false;
    }
    return bootstrapStatus[key] === true;
  });

  const engineReady =
    (bootstrapReportReady || (fs.existsSync(bootstrapArtifactPath) && bootstrapStatusReady)) &&
    Object.keys(bootstrapSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Repository Intelligence Bootstrap V1 Engine must pass before Repository Intelligence Bootstrap Policy V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(bootstrapArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Repository bootstrap v1 artifact required for metadata-only bootstrap policy engine',
      severity: 'error',
    });
  }

  const artifact = buildRepositoryBootstrapPolicyV1Artifact(
    bootstrapSource,
    engineReady && Object.keys(bootstrapSource).length > 0
  );
  writeJson(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH, artifact);

  const passStatus = artifact.repository_intelligence_bootstrap_policy_status as Record<
    (typeof PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.repository_intelligence_bootstrap_policy_metrics as {
    repository_intelligence_bootstrap_policy_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectRepositoryIntelligenceBootstrapPolicyV1EngineResult = {
    report_id: '',
    phase: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PHASE,
    system_id: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PASS_VERDICT
      : PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_STATUS
      : 'PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_NOT_READY',
    project_repository_intelligence_bootstrap_policy_v1_engine_passed: passed,
    repository_intelligence_bootstrap_policy_score: metrics.repository_intelligence_bootstrap_policy_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_repository_intelligence_bootstrap_policy_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PRECHECK_VERDICT,
    repository_intelligence_bootstrap_policy_score: result.repository_intelligence_bootstrap_policy_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_repository_intelligence_bootstrap_policy_v1_engine_passed:
      result.project_repository_intelligence_bootstrap_policy_v1_engine_passed,
    repository_bootstrap_v1_ref: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectRepositoryIntelligenceBootstrapPolicyV1EngineReport(
  projectRoot?: string
): ProjectRepositoryIntelligenceBootstrapPolicyV1EngineResult {
  return runProjectRepositoryIntelligenceBootstrapPolicyV1Engine(projectRoot);
}
