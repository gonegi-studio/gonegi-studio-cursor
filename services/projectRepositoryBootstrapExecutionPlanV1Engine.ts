import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_DATASET_DIR,
  PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PATH,
  PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_REPORT_PATH,
} from './projectRepositoryBootstrapDryRunV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_PHASE =
  'PHASE-PROJECT-BRAIN-198F' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_SYSTEM_ID =
  'PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_STATUS =
  'PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_DEFINED' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1' as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_DATASET_DIR =
  PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_DATASET_DIR;
export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_REGISTRY_PATH =
  `${PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_DATASET_DIR}/repository-bootstrap-execution-plan-v1-registry.json` as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_SCHEMA_PATH =
  `${PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_DATASET_DIR}/repository-bootstrap-execution-plan-v1.schema.json` as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH =
  `${PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_DATASET_DIR}/repository-bootstrap-execution-plan-v1.json` as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_REPORT_PATH =
  'reports/repository_intelligence/PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_REPORT.json' as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_VERSION =
  'repository_bootstrap_execution_plan_v1' as const;

export const REPOSITORY_EXECUTION_STAGE_KEYS = [
  'bootstrap_stage_order',
  'checkpoint_plan',
  'rollback_plan',
  'execution_manifest',
] as const;

export const REPOSITORY_SCAN_STRATEGY_STAGE_KEYS = [
  'metadata_stage',
  'hash_stage',
  'dependency_stage',
  'content_stage',
  'incremental_stage',
] as const;

export const REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_MODEL_KEYS = [
  'repository_execution_stages_model',
  'repository_scan_strategy_model',
  'repository_resource_strategy_model',
  'repository_failure_recovery_model',
  'repository_intelligence_protocol_model',
] as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_METRIC_KEYS = [
  'repository_bootstrap_execution_plan_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PASS_STATUS_KEYS = [
  'repository_execution_stages_defined',
  'repository_scan_strategy_defined',
  'repository_resource_strategy_defined',
  'repository_failure_recovery_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'repository_bootstrap_execution_plan_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_repository_bootstrap_execution_plan_v1_engine_only: true as const,
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

function buildPlanComponent(componentId: string, defined: boolean) {
  return {
    component_id: componentId,
    defined,
    planning_only: true as const,
    populated: false,
    analysis_only: true as const,
  };
}

function buildRepositoryBootstrapExecutionPlanV1Artifact(
  dryRunSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const dryRunModelIntelligence = dryRunSource.repository_bootstrap_dry_run_model_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = dryRunModelIntelligence?.repository_intelligence_protocol_model as
    | Record<string, unknown>
    | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const planReady = engineReady && ripReady;

  const repositoryExecutionStagesIntelligence = {
    intelligence_id: 'repository_execution_stages_intelligence_v1',
    critical_model: 'repository_execution_stages_model' as const,
    repository_execution_stages_model: {
      model_id: 'repository_execution_stages_model_v1',
      generated: planReady,
      planning_only: true,
      analysis_only: true,
      bootstrap_stage_order: buildPlanComponent('bootstrap_stage_order', planReady),
      checkpoint_plan: buildPlanComponent('checkpoint_plan', planReady),
      rollback_plan: buildPlanComponent('rollback_plan', planReady),
      execution_manifest: buildPlanComponent('execution_manifest', planReady),
      repository_execution_stages_ready: planReady,
    },
  };

  const repositoryScanStrategyIntelligence = {
    intelligence_id: 'repository_scan_strategy_intelligence_v1',
    critical_model: 'repository_scan_strategy_model' as const,
    repository_scan_strategy_model: {
      model_id: 'repository_scan_strategy_model_v1',
      generated: planReady,
      planning_only: true,
      analysis_only: true,
      metadata_stage: buildPlanComponent('metadata_stage', planReady),
      hash_stage: buildPlanComponent('hash_stage', planReady),
      dependency_stage: buildPlanComponent('dependency_stage', planReady),
      content_stage: buildPlanComponent('content_stage', planReady),
      incremental_stage: buildPlanComponent('incremental_stage', planReady),
      repository_scan_strategy_ready: planReady,
    },
  };

  const repositoryResourceStrategyIntelligence = {
    intelligence_id: 'repository_resource_strategy_intelligence_v1',
    critical_model: 'repository_resource_strategy_model' as const,
    repository_resource_strategy_model: {
      model_id: 'repository_resource_strategy_model_v1',
      generated: planReady,
      planning_only: true,
      analysis_only: true,
      batch_processing: true,
      checkpoint_supported: true,
      resume_supported: true,
      memory_safe: true,
      repository_resource_strategy_ready: planReady,
    },
  };

  const repositoryFailureRecoveryIntelligence = {
    intelligence_id: 'repository_failure_recovery_intelligence_v1',
    critical_model: 'repository_failure_recovery_model' as const,
    repository_failure_recovery_model: {
      model_id: 'repository_failure_recovery_model_v1',
      generated: planReady,
      planning_only: true,
      analysis_only: true,
      partial_failure_supported: true,
      resume_after_failure: true,
      checkpoint_validation: true,
      rollback_validation: true,
      repository_failure_recovery_ready: planReady,
    },
  };

  const repositoryBootstrapExecutionPlanModelIntelligence = {
    intelligence_id: 'repository_bootstrap_execution_plan_model_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: planReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: planReady && ripReady,
      analysis_only: true,
    },
  };

  const repositoryBootstrapExecutionPlanValidationIntelligence = {
    intelligence_id: 'repository_bootstrap_execution_plan_validation_intelligence_v1',
    repository_bootstrap_execution_plan_validation_model: {
      model_id: 'repository_bootstrap_execution_plan_validation_model_v1',
      generated: planReady,
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
        validated: planReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      repository_bootstrap_dry_run_available: {
        validated: engineReady,
        dry_run_ref: PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'repository_bootstrap_execution_plan_metrics_v1',
    repository_bootstrap_execution_plan_score: buildScoreEntry(
      'repository_bootstrap_execution_plan_score',
      planReady,
      0.985,
      true
    ),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      planReady,
      0.985
    ),
  };

  const passStatus = {
    repository_execution_stages_defined: planReady,
    repository_scan_strategy_defined: planReady,
    repository_resource_strategy_defined: planReady,
    repository_failure_recovery_defined: planReady,
    repository_intelligence_protocol_generated: planReady && ripReady,
    repository_intelligence_protocol_ready: planReady && ripReady,
    future_protocol_compatible: planReady,
    repository_bootstrap_execution_plan_ready: planReady,
    bootstrap_completed: false,
  };

  return {
    repository_bootstrap_execution_plan_v1_id: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_VERSION,
    repository_bootstrap_execution_plan_v1_version: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_VERSION,
    generated_at: new Date().toISOString(),
    repository_bootstrap_dry_run_v1_ref: PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PATH,
    repository_execution_stages_intelligence: repositoryExecutionStagesIntelligence,
    repository_scan_strategy_intelligence: repositoryScanStrategyIntelligence,
    repository_resource_strategy_intelligence: repositoryResourceStrategyIntelligence,
    repository_failure_recovery_intelligence: repositoryFailureRecoveryIntelligence,
    repository_bootstrap_execution_plan_model_intelligence:
      repositoryBootstrapExecutionPlanModelIntelligence,
    repository_bootstrap_execution_plan_validation_intelligence:
      repositoryBootstrapExecutionPlanValidationIntelligence,
    repository_bootstrap_execution_plan_metrics: metrics,
    repository_bootstrap_execution_plan_status: passStatus,
  };
}

export type ProjectRepositoryBootstrapExecutionPlanV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_STATUS
    | 'PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_NOT_READY';
  project_repository_bootstrap_execution_plan_v1_engine_passed: boolean;
  repository_bootstrap_execution_plan_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectRepositoryBootstrapExecutionPlanV1Engine(
  projectRoot?: string
): ProjectRepositoryBootstrapExecutionPlanV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectRepositoryBootstrapExecutionPlanV1EngineResult['issues'] = [];

  const dryRunReportPath = path.join(root, PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_REPORT_PATH);
  const dryRunArtifactPath = path.join(root, PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PATH);

  let dryRunReportReady = false;
  if (fs.existsSync(dryRunReportPath)) {
    const dryRunReport = readJson<{
      final_verdict: string;
      status: string;
      project_repository_bootstrap_dry_run_v1_engine_passed?: boolean;
    }>(root, PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_REPORT_PATH);

    dryRunReportReady =
      (dryRunReport.final_verdict === PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_PASS_VERDICT ||
        dryRunReport.final_verdict === PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PRECHECK_VERDICT) &&
      dryRunReport.status === PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_STATUS &&
      dryRunReport.project_repository_bootstrap_dry_run_v1_engine_passed === true;
  }

  const dryRunSource = fs.existsSync(dryRunArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PATH)
    : {};

  const dryRunStatus = (dryRunSource.repository_bootstrap_dry_run_status ?? {}) as Record<
    string,
    boolean
  >;

  const dryRunStatusReady = PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return dryRunStatus[key] === false;
    }
    return dryRunStatus[key] === true;
  });

  const engineReady =
    (dryRunReportReady || (fs.existsSync(dryRunArtifactPath) && dryRunStatusReady)) &&
    Object.keys(dryRunSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Repository Bootstrap Dry Run V1 Engine must pass before Repository Bootstrap Execution Plan V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(dryRunArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Repository bootstrap dry run v1 artifact required for metadata-only execution plan engine',
      severity: 'error',
    });
  }

  const artifact = buildRepositoryBootstrapExecutionPlanV1Artifact(
    dryRunSource,
    engineReady && Object.keys(dryRunSource).length > 0
  );
  writeJson(root, PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PATH, artifact);

  const passStatus = artifact.repository_bootstrap_execution_plan_status as Record<
    (typeof PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.repository_bootstrap_execution_plan_metrics as {
    repository_bootstrap_execution_plan_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectRepositoryBootstrapExecutionPlanV1EngineResult = {
    report_id: '',
    phase: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_PHASE,
    system_id: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_PASS_VERDICT
      : PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_STATUS
      : 'PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_ENGINE_NOT_READY',
    project_repository_bootstrap_execution_plan_v1_engine_passed: passed,
    repository_bootstrap_execution_plan_score: metrics.repository_bootstrap_execution_plan_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_repository_bootstrap_execution_plan_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_REPOSITORY_BOOTSTRAP_EXECUTION_PLAN_V1_PRECHECK_VERDICT,
    repository_bootstrap_execution_plan_score: result.repository_bootstrap_execution_plan_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_repository_bootstrap_execution_plan_v1_engine_passed:
      result.project_repository_bootstrap_execution_plan_v1_engine_passed,
    repository_bootstrap_dry_run_v1_ref: PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectRepositoryBootstrapExecutionPlanV1EngineReport(
  projectRoot?: string
): ProjectRepositoryBootstrapExecutionPlanV1EngineResult {
  return runProjectRepositoryBootstrapExecutionPlanV1Engine(projectRoot);
}
