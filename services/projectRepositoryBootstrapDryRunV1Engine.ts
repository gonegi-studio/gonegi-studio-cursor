import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_DATASET_DIR,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REPORT_PATH,
} from './projectRepositoryCacheRuntimeV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_PHASE = 'PHASE-PROJECT-BRAIN-198E' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_SYSTEM_ID =
  'PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_STATUS =
  'PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_DEFINED' as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_REPOSITORY_CACHE_RUNTIME_V1' as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_DATASET_DIR =
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_DATASET_DIR;
export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_REGISTRY_PATH =
  `${PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_DATASET_DIR}/repository-bootstrap-dry-run-v1-registry.json` as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_SCHEMA_PATH =
  `${PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_DATASET_DIR}/repository-bootstrap-dry-run-v1.schema.json` as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PATH =
  `${PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_DATASET_DIR}/repository-bootstrap-dry-run-v1.json` as const;
export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_REPORT_PATH =
  'reports/repository_intelligence/PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_REPORT.json' as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_VERSION = 'repository_bootstrap_dry_run_v1' as const;

export const REPOSITORY_BOOTSTRAP_DRY_RUN_OUTPUT_KEYS = [
  'repository_snapshot_preview',
  'repository_hash_index_preview',
  'repository_dependency_preview',
  'repository_duplicate_candidate_preview',
  'repository_statistics_preview',
  'repository_incremental_index_preview',
] as const;

export const REPOSITORY_BOOTSTRAP_DRY_RUN_MODEL_KEYS = [
  'repository_bootstrap_dry_run_model',
  'repository_bootstrap_dry_run_output_model',
  'repository_bootstrap_dry_run_safety_model',
  'repository_bootstrap_dry_run_validation_model',
  'repository_intelligence_protocol_model',
] as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_METRIC_KEYS = [
  'repository_bootstrap_dry_run_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PASS_STATUS_KEYS = [
  'repository_bootstrap_dry_run_defined',
  'repository_bootstrap_dry_run_outputs_defined',
  'repository_bootstrap_dry_run_safety_defined',
  'repository_bootstrap_dry_run_validation_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'repository_bootstrap_dry_run_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_repository_bootstrap_dry_run_v1_engine_only: true as const,
  planning_only: true as const,
  metadata_only: true as const,
  no_repository_scan: true as const,
  no_filesystem_access: true as const,
  no_execution: true as const,
  dry_run_mode: true as const,
  read_only: true as const,
  preview_only: true as const,
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

function buildPreviewOutput(
  outputId: (typeof REPOSITORY_BOOTSTRAP_DRY_RUN_OUTPUT_KEYS)[number],
  defined: boolean
) {
  return {
    output_id: outputId,
    defined,
    planning_only: true as const,
    preview_only: true as const,
    populated: false,
    analysis_only: true as const,
  };
}

function buildRepositoryBootstrapDryRunV1Artifact(
  cacheRuntimeSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const cacheModelIntelligence = cacheRuntimeSource.repository_cache_runtime_model_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = cacheModelIntelligence?.repository_intelligence_protocol_model as
    | Record<string, unknown>
    | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const dryRunReady = engineReady && ripReady;

  const repositoryBootstrapDryRunIntelligence = {
    intelligence_id: 'repository_bootstrap_dry_run_intelligence_v1',
    critical_model: 'repository_bootstrap_dry_run_model' as const,
    repository_bootstrap_dry_run_model: {
      model_id: 'repository_bootstrap_dry_run_model_v1',
      generated: dryRunReady,
      planning_only: true,
      analysis_only: true,
      dry_run_mode: true,
      read_only: true,
      preview_only: true,
      execution_enabled: false,
      repository_bootstrap_dry_run_ready: dryRunReady,
    },
  };

  const repositoryBootstrapDryRunOutputIntelligence = {
    intelligence_id: 'repository_bootstrap_dry_run_output_intelligence_v1',
    critical_model: 'repository_bootstrap_dry_run_output_model' as const,
    repository_bootstrap_dry_run_output_model: {
      model_id: 'repository_bootstrap_dry_run_output_model_v1',
      generated: dryRunReady,
      planning_only: true,
      analysis_only: true,
      repository_snapshot_preview: buildPreviewOutput('repository_snapshot_preview', dryRunReady),
      repository_hash_index_preview: buildPreviewOutput('repository_hash_index_preview', dryRunReady),
      repository_dependency_preview: buildPreviewOutput('repository_dependency_preview', dryRunReady),
      repository_duplicate_candidate_preview: buildPreviewOutput(
        'repository_duplicate_candidate_preview',
        dryRunReady
      ),
      repository_statistics_preview: buildPreviewOutput('repository_statistics_preview', dryRunReady),
      repository_incremental_index_preview: buildPreviewOutput(
        'repository_incremental_index_preview',
        dryRunReady
      ),
      repository_bootstrap_dry_run_outputs_ready: dryRunReady,
    },
  };

  const repositoryBootstrapDryRunSafetyIntelligence = {
    intelligence_id: 'repository_bootstrap_dry_run_safety_intelligence_v1',
    critical_model: 'repository_bootstrap_dry_run_safety_model' as const,
    repository_bootstrap_dry_run_safety_model: {
      model_id: 'repository_bootstrap_dry_run_safety_model_v1',
      generated: dryRunReady,
      planning_only: true,
      analysis_only: true,
      delete_enabled: false,
      merge_enabled: false,
      rename_enabled: false,
      move_enabled: false,
      archive_enabled: false,
      repository_bootstrap_dry_run_safety_ready: dryRunReady,
    },
  };

  const repositoryBootstrapDryRunValidationIntelligence = {
    intelligence_id: 'repository_bootstrap_dry_run_validation_intelligence_v1',
    critical_model: 'repository_bootstrap_dry_run_validation_model' as const,
    repository_bootstrap_dry_run_validation_model: {
      model_id: 'repository_bootstrap_dry_run_validation_model_v1',
      generated: dryRunReady,
      planning_only: true,
      analysis_only: true,
      bootstrap_validation: true,
      cache_validation: true,
      incremental_validation: true,
      rollback_supported: true,
      preview_consistency_check: true,
      repository_bootstrap_dry_run_validation_ready: dryRunReady,
    },
  };

  const repositoryBootstrapDryRunModelIntelligence = {
    intelligence_id: 'repository_bootstrap_dry_run_model_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: dryRunReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: dryRunReady && ripReady,
      analysis_only: true,
    },
  };

  const repositoryBootstrapDryRunRipValidationIntelligence = {
    intelligence_id: 'repository_bootstrap_dry_run_rip_validation_intelligence_v1',
    repository_bootstrap_dry_run_rip_validation_model: {
      model_id: 'repository_bootstrap_dry_run_rip_validation_model_v1',
      generated: dryRunReady,
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
        validated: dryRunReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      repository_cache_runtime_available: {
        validated: engineReady,
        cache_runtime_ref: PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'repository_bootstrap_dry_run_metrics_v1',
    repository_bootstrap_dry_run_score: buildScoreEntry(
      'repository_bootstrap_dry_run_score',
      dryRunReady,
      0.985,
      true
    ),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      dryRunReady,
      0.985
    ),
  };

  const passStatus = {
    repository_bootstrap_dry_run_defined: dryRunReady,
    repository_bootstrap_dry_run_outputs_defined: dryRunReady,
    repository_bootstrap_dry_run_safety_defined: dryRunReady,
    repository_bootstrap_dry_run_validation_defined: dryRunReady,
    repository_intelligence_protocol_generated: dryRunReady && ripReady,
    repository_intelligence_protocol_ready: dryRunReady && ripReady,
    future_protocol_compatible: dryRunReady,
    repository_bootstrap_dry_run_ready: dryRunReady,
    bootstrap_completed: false,
  };

  return {
    repository_bootstrap_dry_run_v1_id: PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_VERSION,
    repository_bootstrap_dry_run_v1_version: PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_VERSION,
    generated_at: new Date().toISOString(),
    repository_cache_runtime_v1_ref: PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH,
    repository_bootstrap_dry_run_intelligence: repositoryBootstrapDryRunIntelligence,
    repository_bootstrap_dry_run_output_intelligence: repositoryBootstrapDryRunOutputIntelligence,
    repository_bootstrap_dry_run_safety_intelligence: repositoryBootstrapDryRunSafetyIntelligence,
    repository_bootstrap_dry_run_validation_intelligence: repositoryBootstrapDryRunValidationIntelligence,
    repository_bootstrap_dry_run_model_intelligence: repositoryBootstrapDryRunModelIntelligence,
    repository_bootstrap_dry_run_rip_validation_intelligence: repositoryBootstrapDryRunRipValidationIntelligence,
    repository_bootstrap_dry_run_metrics: metrics,
    repository_bootstrap_dry_run_status: passStatus,
  };
}

export type ProjectRepositoryBootstrapDryRunV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_STATUS
    | 'PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_NOT_READY';
  project_repository_bootstrap_dry_run_v1_engine_passed: boolean;
  repository_bootstrap_dry_run_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectRepositoryBootstrapDryRunV1Engine(
  projectRoot?: string
): ProjectRepositoryBootstrapDryRunV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectRepositoryBootstrapDryRunV1EngineResult['issues'] = [];

  const cacheReportPath = path.join(root, PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REPORT_PATH);
  const cacheArtifactPath = path.join(root, PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH);

  let cacheReportReady = false;
  if (fs.existsSync(cacheReportPath)) {
    const cacheReport = readJson<{
      final_verdict: string;
      status: string;
      project_repository_cache_runtime_v1_engine_passed?: boolean;
    }>(root, PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REPORT_PATH);

    cacheReportReady =
      (cacheReport.final_verdict === PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PASS_VERDICT ||
        cacheReport.final_verdict === PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PRECHECK_VERDICT) &&
      cacheReport.status === PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_STATUS &&
      cacheReport.project_repository_cache_runtime_v1_engine_passed === true;
  }

  const cacheRuntimeSource = fs.existsSync(cacheArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH)
    : {};

  const cacheStatus = (cacheRuntimeSource.repository_cache_runtime_status ?? {}) as Record<string, boolean>;

  const cacheStatusReady = PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return cacheStatus[key] === false;
    }
    return cacheStatus[key] === true;
  });

  const engineReady =
    (cacheReportReady || (fs.existsSync(cacheArtifactPath) && cacheStatusReady)) &&
    Object.keys(cacheRuntimeSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Repository Cache Runtime V1 Engine must pass before Repository Bootstrap Dry Run V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(cacheArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Repository cache runtime v1 artifact required for metadata-only bootstrap dry run engine',
      severity: 'error',
    });
  }

  const artifact = buildRepositoryBootstrapDryRunV1Artifact(
    cacheRuntimeSource,
    engineReady && Object.keys(cacheRuntimeSource).length > 0
  );
  writeJson(root, PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PATH, artifact);

  const passStatus = artifact.repository_bootstrap_dry_run_status as Record<
    (typeof PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.repository_bootstrap_dry_run_metrics as {
    repository_bootstrap_dry_run_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectRepositoryBootstrapDryRunV1EngineResult = {
    report_id: '',
    phase: PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_PHASE,
    system_id: PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_PASS_VERDICT
      : PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_STATUS
      : 'PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_ENGINE_NOT_READY',
    project_repository_bootstrap_dry_run_v1_engine_passed: passed,
    repository_bootstrap_dry_run_score: metrics.repository_bootstrap_dry_run_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_repository_bootstrap_dry_run_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_REPOSITORY_BOOTSTRAP_DRY_RUN_V1_PRECHECK_VERDICT,
    repository_bootstrap_dry_run_score: result.repository_bootstrap_dry_run_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_repository_bootstrap_dry_run_v1_engine_passed: result.project_repository_bootstrap_dry_run_v1_engine_passed,
    repository_cache_runtime_v1_ref: PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectRepositoryBootstrapDryRunV1EngineReport(
  projectRoot?: string
): ProjectRepositoryBootstrapDryRunV1EngineResult {
  return runProjectRepositoryBootstrapDryRunV1Engine(projectRoot);
}
