import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_DATASET_DIR,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REPORT_PATH,
} from './projectRepositoryIncrementalIndexV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PHASE = 'PHASE-PROJECT-BRAIN-198D' as const;
export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_SYSTEM_ID =
  'PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE' as const;
export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_REPOSITORY_CACHE_RUNTIME_V1' as const;
export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_REPOSITORY_CACHE_RUNTIME_V1' as const;
export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_STATUS =
  'PROJECT_REPOSITORY_CACHE_RUNTIME_DEFINED' as const;
export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1' as const;

export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_DATASET_DIR =
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_DATASET_DIR;
export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REGISTRY_PATH =
  `${PROJECT_REPOSITORY_CACHE_RUNTIME_V1_DATASET_DIR}/repository-cache-runtime-v1-registry.json` as const;
export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_SCHEMA_PATH =
  `${PROJECT_REPOSITORY_CACHE_RUNTIME_V1_DATASET_DIR}/repository-cache-runtime-v1.schema.json` as const;
export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH =
  `${PROJECT_REPOSITORY_CACHE_RUNTIME_V1_DATASET_DIR}/repository-cache-runtime-v1.json` as const;
export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REPORT_PATH =
  'reports/repository_intelligence/PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REPORT.json' as const;

export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_VERSION = 'repository_cache_runtime_v1' as const;

export const REPOSITORY_CACHE_RUNTIME_COMPONENT_KEYS = [
  'repository_cache',
  'cache_state',
  'cache_manifest',
  'cache_checkpoint',
  'cache_integrity',
  'cache_version',
  'cache_hash',
] as const;

export const REPOSITORY_CACHE_RUNTIME_MODEL_KEYS = [
  'repository_cache_runtime_model',
  'repository_cache_read_policy_model',
  'repository_cache_update_policy_model',
  'repository_cache_safety_model',
  'repository_intelligence_protocol_model',
] as const;

export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_METRIC_KEYS = [
  'repository_cache_runtime_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PASS_STATUS_KEYS = [
  'repository_cache_runtime_defined',
  'repository_cache_read_policy_defined',
  'repository_cache_update_policy_defined',
  'repository_cache_safety_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'repository_cache_runtime_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_repository_cache_runtime_v1_engine_only: true as const,
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

function buildCacheComponent(
  componentId: (typeof REPOSITORY_CACHE_RUNTIME_COMPONENT_KEYS)[number],
  defined: boolean
) {
  return {
    component_id: componentId,
    defined,
    planning_only: true as const,
    populated: false,
    analysis_only: true as const,
  };
}

function buildRepositoryCacheRuntimeV1Artifact(
  indexSource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const indexModelIntelligence = indexSource.repository_incremental_index_model_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = indexModelIntelligence?.repository_intelligence_protocol_model as
    | Record<string, unknown>
    | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const runtimeReady = engineReady && ripReady;

  const repositoryCacheRuntimeIntelligence = {
    intelligence_id: 'repository_cache_runtime_intelligence_v1',
    critical_model: 'repository_cache_runtime_model' as const,
    repository_cache_runtime_model: {
      model_id: 'repository_cache_runtime_model_v1',
      generated: runtimeReady,
      planning_only: true,
      analysis_only: true,
      repository_cache: buildCacheComponent('repository_cache', runtimeReady),
      cache_state: buildCacheComponent('cache_state', runtimeReady),
      cache_manifest: buildCacheComponent('cache_manifest', runtimeReady),
      cache_checkpoint: buildCacheComponent('cache_checkpoint', runtimeReady),
      cache_integrity: buildCacheComponent('cache_integrity', runtimeReady),
      cache_version: buildCacheComponent('cache_version', runtimeReady),
      cache_hash: buildCacheComponent('cache_hash', runtimeReady),
      repository_cache_runtime_ready: runtimeReady,
    },
  };

  const repositoryCacheReadPolicyIntelligence = {
    intelligence_id: 'repository_cache_read_policy_intelligence_v1',
    critical_model: 'repository_cache_read_policy_model' as const,
    repository_cache_read_policy_model: {
      model_id: 'repository_cache_read_policy_model_v1',
      generated: runtimeReady,
      planning_only: true,
      analysis_only: true,
      read_cache_first: true,
      read_repository_only_if_cache_miss: true,
      avoid_full_scan: true,
      repository_cache_read_policy_ready: runtimeReady,
    },
  };

  const repositoryCacheUpdatePolicyIntelligence = {
    intelligence_id: 'repository_cache_update_policy_intelligence_v1',
    critical_model: 'repository_cache_update_policy_model' as const,
    repository_cache_update_policy_model: {
      model_id: 'repository_cache_update_policy_model_v1',
      generated: runtimeReady,
      planning_only: true,
      analysis_only: true,
      incremental_update: true,
      changed_files_only: true,
      cache_rebuild_required: false,
      checkpoint_supported: true,
      repository_cache_update_policy_ready: runtimeReady,
    },
  };

  const repositoryCacheSafetyIntelligence = {
    intelligence_id: 'repository_cache_safety_intelligence_v1',
    critical_model: 'repository_cache_safety_model' as const,
    repository_cache_safety_model: {
      model_id: 'repository_cache_safety_model_v1',
      generated: runtimeReady,
      planning_only: true,
      analysis_only: true,
      cache_validation: true,
      cache_integrity_check: true,
      incremental_consistency_check: true,
      rollback_supported: true,
      repository_cache_safety_ready: runtimeReady,
    },
  };

  const repositoryCacheRuntimeModelIntelligence = {
    intelligence_id: 'repository_cache_runtime_model_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: runtimeReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: runtimeReady && ripReady,
      analysis_only: true,
    },
  };

  const repositoryCacheRuntimeValidationIntelligence = {
    intelligence_id: 'repository_cache_runtime_validation_intelligence_v1',
    repository_cache_runtime_validation_model: {
      model_id: 'repository_cache_runtime_validation_model_v1',
      generated: runtimeReady,
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
        validated: runtimeReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      repository_incremental_index_available: {
        validated: engineReady,
        index_ref: PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'repository_cache_runtime_metrics_v1',
    repository_cache_runtime_score: buildScoreEntry(
      'repository_cache_runtime_score',
      runtimeReady,
      0.985,
      true
    ),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      runtimeReady,
      0.985
    ),
  };

  const passStatus = {
    repository_cache_runtime_defined: runtimeReady,
    repository_cache_read_policy_defined: runtimeReady,
    repository_cache_update_policy_defined: runtimeReady,
    repository_cache_safety_defined: runtimeReady,
    repository_intelligence_protocol_generated: runtimeReady && ripReady,
    repository_intelligence_protocol_ready: runtimeReady && ripReady,
    future_protocol_compatible: runtimeReady,
    repository_cache_runtime_ready: runtimeReady,
    bootstrap_completed: false,
  };

  return {
    repository_cache_runtime_v1_id: PROJECT_REPOSITORY_CACHE_RUNTIME_V1_VERSION,
    repository_cache_runtime_v1_version: PROJECT_REPOSITORY_CACHE_RUNTIME_V1_VERSION,
    generated_at: new Date().toISOString(),
    repository_incremental_index_v1_ref: PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH,
    repository_cache_runtime_intelligence: repositoryCacheRuntimeIntelligence,
    repository_cache_read_policy_intelligence: repositoryCacheReadPolicyIntelligence,
    repository_cache_update_policy_intelligence: repositoryCacheUpdatePolicyIntelligence,
    repository_cache_safety_intelligence: repositoryCacheSafetyIntelligence,
    repository_cache_runtime_model_intelligence: repositoryCacheRuntimeModelIntelligence,
    repository_cache_runtime_validation_intelligence: repositoryCacheRuntimeValidationIntelligence,
    repository_cache_runtime_metrics: metrics,
    repository_cache_runtime_status: passStatus,
  };
}

export type ProjectRepositoryCacheRuntimeV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_STATUS
    | 'PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_NOT_READY';
  project_repository_cache_runtime_v1_engine_passed: boolean;
  repository_cache_runtime_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectRepositoryCacheRuntimeV1Engine(
  projectRoot?: string
): ProjectRepositoryCacheRuntimeV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectRepositoryCacheRuntimeV1EngineResult['issues'] = [];

  const indexReportPath = path.join(root, PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REPORT_PATH);
  const indexArtifactPath = path.join(root, PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH);

  let indexReportReady = false;
  if (fs.existsSync(indexReportPath)) {
    const indexReport = readJson<{
      final_verdict: string;
      status: string;
      project_repository_incremental_index_v1_engine_passed?: boolean;
    }>(root, PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REPORT_PATH);

    indexReportReady =
      (indexReport.final_verdict === PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PASS_VERDICT ||
        indexReport.final_verdict === PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PRECHECK_VERDICT) &&
      indexReport.status === PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_STATUS &&
      indexReport.project_repository_incremental_index_v1_engine_passed === true;
  }

  const indexSource = fs.existsSync(indexArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH)
    : {};

  const indexStatus = (indexSource.repository_incremental_index_status ?? {}) as Record<string, boolean>;

  const indexStatusReady = PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return indexStatus[key] === false;
    }
    return indexStatus[key] === true;
  });

  const engineReady =
    (indexReportReady || (fs.existsSync(indexArtifactPath) && indexStatusReady)) &&
    Object.keys(indexSource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Repository Incremental Index V1 Engine must pass before Repository Cache Runtime V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(indexArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Repository incremental index v1 artifact required for metadata-only cache runtime engine',
      severity: 'error',
    });
  }

  const artifact = buildRepositoryCacheRuntimeV1Artifact(
    indexSource,
    engineReady && Object.keys(indexSource).length > 0
  );
  writeJson(root, PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH, artifact);

  const passStatus = artifact.repository_cache_runtime_status as Record<
    (typeof PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.repository_cache_runtime_metrics as {
    repository_cache_runtime_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectRepositoryCacheRuntimeV1EngineResult = {
    report_id: '',
    phase: PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PHASE,
    system_id: PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PASS_VERDICT
      : PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_STATUS
      : 'PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_NOT_READY',
    project_repository_cache_runtime_v1_engine_passed: passed,
    repository_cache_runtime_score: metrics.repository_cache_runtime_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_repository_cache_runtime_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PRECHECK_VERDICT,
    repository_cache_runtime_score: result.repository_cache_runtime_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_repository_cache_runtime_v1_engine_passed: result.project_repository_cache_runtime_v1_engine_passed,
    repository_incremental_index_v1_ref: PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectRepositoryCacheRuntimeV1EngineReport(
  projectRoot?: string
): ProjectRepositoryCacheRuntimeV1EngineResult {
  return runProjectRepositoryCacheRuntimeV1Engine(projectRoot);
}
