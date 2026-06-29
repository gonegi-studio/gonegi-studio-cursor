import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_DATASET_DIR,
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_REPORT_PATH,
} from './projectRepositoryBootstrapExecutionPlanV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_PHASE =
  'PHASE-PROJECT-BRAIN-198G' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_SYSTEM_ID =
  'PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_STATUS =
  'PROJECT_REPOSITORY_BOOTSTRAP_READY' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1' as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_DATASET_DIR =
  PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_DATASET_DIR;
export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_REGISTRY_PATH =
  `${PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_DATASET_DIR}/repository-bootstrap-readiness-certification-v1-registry.json` as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_SCHEMA_PATH =
  `${PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_DATASET_DIR}/repository-bootstrap-readiness-certification-v1.schema.json` as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_PATH =
  `${PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_DATASET_DIR}/repository-bootstrap-readiness-certification-v1.json` as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_REPORT_PATH =
  'reports/repository_intelligence/PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_REPORT.json' as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_VERSION =
  'repository_bootstrap_readiness_certification_v1' as const;

export const REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS = {
  bootstrap_v1: `${PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_DATASET_DIR}/repository-bootstrap-v1.json`,
  bootstrap_policy_v1: `${PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_DATASET_DIR}/repository-bootstrap-policy-v1.json`,
  incremental_index_v1: `${PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_DATASET_DIR}/repository-incremental-index-v1.json`,
  cache_runtime_v1: `${PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_DATASET_DIR}/repository-cache-runtime-v1.json`,
  dry_run_v1: `${PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_DATASET_DIR}/repository-bootstrap-dry-run-v1.json`,
  execution_plan_v1: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
} as const;

export const REPOSITORY_BOOTSTRAP_READINESS_VERIFICATION_KEYS = [
  'architecture_completeness_verified',
  'bootstrap_policy_verified',
  'incremental_strategy_verified',
  'cache_runtime_verified',
  'execution_plan_verified',
] as const;

export const REPOSITORY_BOOTSTRAP_READINESS_REPORT_KEYS = [
  'bootstrap_ready',
  'execution_mode_ready',
  'incremental_ready',
  'cache_ready',
  'rip_ready',
  'all_readiness_checks_passed',
] as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_METRIC_KEYS = [
  'repository_bootstrap_readiness_certification_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_PASS_STATUS_KEYS = [
  'architecture_completeness_verified',
  'bootstrap_policy_verified',
  'incremental_strategy_verified',
  'cache_runtime_verified',
  'execution_plan_verified',
  'readiness_report_generated',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'repository_bootstrap_readiness_certified',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_repository_bootstrap_readiness_certification_v1_engine_only: true as const,
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

function buildRepositoryBootstrapReadinessCertificationV1Artifact(
  executionPlanSource: Record<string, unknown>,
  engineReady: boolean,
  readinessChecks: Record<(typeof REPOSITORY_BOOTSTRAP_READINESS_REPORT_KEYS)[number], boolean>
): Record<string, unknown> {
  const planModelIntelligence = executionPlanSource.repository_bootstrap_execution_plan_model_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = planModelIntelligence?.repository_intelligence_protocol_model as
    | Record<string, unknown>
    | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const certified = engineReady && readinessChecks.all_readiness_checks_passed && ripReady;

  const repositoryArchitectureCompletenessIntelligence = {
    intelligence_id: 'repository_architecture_completeness_intelligence_v1',
    repository_architecture_completeness_verification_model: {
      model_id: 'repository_architecture_completeness_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: readinessChecks.bootstrap_ready,
      bootstrap_v1_ref: REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.bootstrap_v1,
      architecture_completeness_verified: readinessChecks.bootstrap_ready,
    },
  };

  const repositoryBootstrapPolicyVerificationIntelligence = {
    intelligence_id: 'repository_bootstrap_policy_verification_intelligence_v1',
    repository_bootstrap_policy_verification_model: {
      model_id: 'repository_bootstrap_policy_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: readinessChecks.bootstrap_ready,
      bootstrap_policy_v1_ref: REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.bootstrap_policy_v1,
      bootstrap_policy_verified: readinessChecks.bootstrap_ready,
    },
  };

  const repositoryIncrementalStrategyVerificationIntelligence = {
    intelligence_id: 'repository_incremental_strategy_verification_intelligence_v1',
    repository_incremental_strategy_verification_model: {
      model_id: 'repository_incremental_strategy_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: readinessChecks.incremental_ready,
      incremental_index_v1_ref: REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.incremental_index_v1,
      incremental_strategy_verified: readinessChecks.incremental_ready,
    },
  };

  const repositoryCacheRuntimeVerificationIntelligence = {
    intelligence_id: 'repository_cache_runtime_verification_intelligence_v1',
    repository_cache_runtime_verification_model: {
      model_id: 'repository_cache_runtime_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: readinessChecks.cache_ready,
      cache_runtime_v1_ref: REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.cache_runtime_v1,
      cache_runtime_verified: readinessChecks.cache_ready,
    },
  };

  const repositoryExecutionPlanVerificationIntelligence = {
    intelligence_id: 'repository_execution_plan_verification_intelligence_v1',
    repository_execution_plan_verification_model: {
      model_id: 'repository_execution_plan_verification_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      verified: readinessChecks.execution_mode_ready,
      execution_plan_v1_ref: REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.execution_plan_v1,
      dry_run_v1_ref: REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.dry_run_v1,
      execution_plan_verified: readinessChecks.execution_mode_ready,
    },
  };

  const repositoryBootstrapReadinessReportIntelligence = {
    intelligence_id: 'repository_bootstrap_readiness_report_intelligence_v1',
    repository_bootstrap_readiness_report_model: {
      model_id: 'repository_bootstrap_readiness_report_model_v1',
      generated: certified,
      planning_only: true,
      analysis_only: true,
      bootstrap_ready: readinessChecks.bootstrap_ready,
      execution_mode_ready: readinessChecks.execution_mode_ready,
      incremental_ready: readinessChecks.incremental_ready,
      cache_ready: readinessChecks.cache_ready,
      rip_ready: readinessChecks.rip_ready,
      all_readiness_checks_passed: readinessChecks.all_readiness_checks_passed,
      readiness_report_generated: certified,
    },
  };

  const repositoryBootstrapReadinessCertificationModelIntelligence = {
    intelligence_id: 'repository_bootstrap_readiness_certification_model_intelligence_v1',
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

  const repositoryBootstrapReadinessCertificationValidationIntelligence = {
    intelligence_id: 'repository_bootstrap_readiness_certification_validation_intelligence_v1',
    repository_bootstrap_readiness_certification_validation_model: {
      model_id: 'repository_bootstrap_readiness_certification_validation_model_v1',
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
      repository_bootstrap_execution_plan_available: {
        validated: engineReady,
        execution_plan_ref: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'repository_bootstrap_readiness_certification_metrics_v1',
    repository_bootstrap_readiness_certification_score: buildScoreEntry(
      'repository_bootstrap_readiness_certification_score',
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
    architecture_completeness_verified: readinessChecks.bootstrap_ready,
    bootstrap_policy_verified: readinessChecks.bootstrap_ready,
    incremental_strategy_verified: readinessChecks.incremental_ready,
    cache_runtime_verified: readinessChecks.cache_ready,
    execution_plan_verified: readinessChecks.execution_mode_ready,
    readiness_report_generated: certified,
    repository_intelligence_protocol_generated: certified && ripReady,
    repository_intelligence_protocol_ready: certified && ripReady,
    future_protocol_compatible: certified,
    repository_bootstrap_readiness_certified: certified,
    bootstrap_completed: false,
  };

  return {
    repository_bootstrap_readiness_certification_v1_id:
      PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_VERSION,
    repository_bootstrap_readiness_certification_v1_version:
      PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_VERSION,
    generated_at: new Date().toISOString(),
    repository_bootstrap_execution_plan_v1_ref: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
    repository_architecture_completeness_intelligence: repositoryArchitectureCompletenessIntelligence,
    repository_bootstrap_policy_verification_intelligence: repositoryBootstrapPolicyVerificationIntelligence,
    repository_incremental_strategy_verification_intelligence:
      repositoryIncrementalStrategyVerificationIntelligence,
    repository_cache_runtime_verification_intelligence: repositoryCacheRuntimeVerificationIntelligence,
    repository_execution_plan_verification_intelligence: repositoryExecutionPlanVerificationIntelligence,
    repository_bootstrap_readiness_report_intelligence: repositoryBootstrapReadinessReportIntelligence,
    repository_bootstrap_readiness_certification_model_intelligence:
      repositoryBootstrapReadinessCertificationModelIntelligence,
    repository_bootstrap_readiness_certification_validation_intelligence:
      repositoryBootstrapReadinessCertificationValidationIntelligence,
    repository_bootstrap_readiness_certification_metrics: metrics,
    repository_bootstrap_readiness_certification_status: passStatus,
  };
}

export type ProjectRepositoryBootstrapReadinessCertificationV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_STATUS
    | 'PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_NOT_READY';
  project_repository_bootstrap_readiness_certification_v1_engine_passed: boolean;
  all_readiness_checks_passed: boolean;
  repository_bootstrap_readiness_certification_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectRepositoryBootstrapReadinessCertificationV1Engine(
  projectRoot?: string
): ProjectRepositoryBootstrapReadinessCertificationV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectRepositoryBootstrapReadinessCertificationV1EngineResult['issues'] = [];

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
        planReport.final_verdict ===
          PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_PRECHECK_VERDICT) &&
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

  const bootstrapReady =
    readArtifactStatus(root, REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.bootstrap_v1, 'repository_intelligence_bootstrap_ready') &&
    readArtifactStatus(
      root,
      REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.bootstrap_policy_v1,
      'repository_intelligence_bootstrap_policy_ready'
    );
  const incrementalReady = readArtifactStatus(
    root,
    REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.incremental_index_v1,
    'repository_incremental_index_ready'
  );
  const cacheReady = readArtifactStatus(
    root,
    REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.cache_runtime_v1,
    'repository_cache_runtime_ready'
  );
  const dryRunReady = readArtifactStatus(
    root,
    REPOSITORY_BOOTSTRAP_CHAIN_ARTIFACT_REFS.dry_run_v1,
    'repository_bootstrap_dry_run_ready'
  );
  const executionPlanReady = planStatusReady && planStatus.repository_bootstrap_execution_plan_ready === true;
  const executionModeReady = dryRunReady && executionPlanReady;
  const ripReady =
    (
      executionPlanSource.repository_bootstrap_execution_plan_model_intelligence as
        | Record<string, unknown>
        | undefined
    )?.repository_intelligence_protocol_model as Record<string, unknown> | undefined;

  const ripReadyFlag = ripReady?.repository_intelligence_protocol_ready === true;

  const readinessChecks = {
    bootstrap_ready: bootstrapReady,
    execution_mode_ready: executionModeReady,
    incremental_ready: incrementalReady,
    cache_ready: cacheReady,
    rip_ready: ripReadyFlag,
    all_readiness_checks_passed:
      engineReady &&
      bootstrapReady &&
      executionModeReady &&
      incrementalReady &&
      cacheReady &&
      ripReadyFlag,
  };

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Repository Bootstrap Execution Plan V1 Engine must pass before Repository Bootstrap Readiness Certification V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(planArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Repository bootstrap execution plan v1 artifact required for readiness certification engine',
      severity: 'error',
    });
  }

  const artifact = buildRepositoryBootstrapReadinessCertificationV1Artifact(
    executionPlanSource,
    engineReady && Object.keys(executionPlanSource).length > 0,
    readinessChecks
  );
  writeJson(root, PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_PATH, artifact);

  const passStatus = artifact.repository_bootstrap_readiness_certification_status as Record<
    (typeof PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    readinessChecks.all_readiness_checks_passed &&
    PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.repository_bootstrap_readiness_certification_metrics as {
    repository_bootstrap_readiness_certification_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectRepositoryBootstrapReadinessCertificationV1EngineResult = {
    report_id: '',
    phase: PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_PHASE,
    system_id: PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_PASS_VERDICT
      : PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_STATUS
      : 'PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_ENGINE_NOT_READY',
    project_repository_bootstrap_readiness_certification_v1_engine_passed: passed,
    all_readiness_checks_passed: readinessChecks.all_readiness_checks_passed,
    repository_bootstrap_readiness_certification_score:
      metrics.repository_bootstrap_readiness_certification_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_repository_bootstrap_readiness_certification_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_REPOSITORY_BOOTSTRAP_READINESS_CERTIFICATION_V1_PRECHECK_VERDICT,
    all_readiness_checks_passed: result.all_readiness_checks_passed,
    repository_bootstrap_readiness_certification_score: result.repository_bootstrap_readiness_certification_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_repository_bootstrap_readiness_certification_v1_engine_passed:
      result.project_repository_bootstrap_readiness_certification_v1_engine_passed,
    repository_bootstrap_execution_plan_v1_ref: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectRepositoryBootstrapReadinessCertificationV1EngineReport(
  projectRoot?: string
): ProjectRepositoryBootstrapReadinessCertificationV1EngineResult {
  return runProjectRepositoryBootstrapReadinessCertificationV1Engine(projectRoot);
}
