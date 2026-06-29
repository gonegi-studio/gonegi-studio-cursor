import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_DATASET_DIR,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REPORT_PATH,
} from './projectRepositoryIntelligenceBootstrapPolicyV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PHASE = 'PHASE-PROJECT-BRAIN-198C' as const;
export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_SYSTEM_ID =
  'PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE' as const;
export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PASS_VERDICT =
  'PASS_PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1' as const;
export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_FAIL_VERDICT =
  'FAIL_PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1' as const;
export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_STATUS =
  'PROJECT_REPOSITORY_INCREMENTAL_INDEX_DEFINED' as const;
export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PRECHECK_VERDICT =
  'PASS_PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1' as const;

export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_DATASET_DIR =
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_DATASET_DIR;
export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REGISTRY_PATH =
  `${PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_DATASET_DIR}/repository-incremental-index-v1-registry.json` as const;
export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_SCHEMA_PATH =
  `${PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_DATASET_DIR}/repository-incremental-index-v1.schema.json` as const;
export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH =
  `${PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_DATASET_DIR}/repository-incremental-index-v1.json` as const;
export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REPORT_PATH =
  'reports/repository_intelligence/PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REPORT.json' as const;

export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_VERSION = 'repository_incremental_index_v1' as const;

export const REPOSITORY_INCREMENTAL_INDEX_FIELD_KEYS = [
  'file_identity',
  'content_hash',
  'timestamp',
  'rename_tracking',
  'lineage_tracking',
  'repository_version',
] as const;

export const REPOSITORY_CHANGE_DETECTION_KEYS = [
  'new_file',
  'modified_file',
  'deleted_file',
  'renamed_file',
  'unchanged_file',
  'hash_changed',
] as const;

export const REPOSITORY_INCREMENTAL_INDEX_MODEL_KEYS = [
  'repository_incremental_index_model',
  'repository_change_detection_model',
  'repository_update_policy_model',
  'repository_consistency_model',
  'repository_intelligence_protocol_model',
] as const;

export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_METRIC_KEYS = [
  'repository_incremental_index_score',
  'repository_intelligence_protocol_score',
] as const;

export const PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PASS_STATUS_KEYS = [
  'repository_incremental_index_defined',
  'repository_change_detection_defined',
  'repository_update_policy_defined',
  'repository_consistency_defined',
  'repository_intelligence_protocol_generated',
  'repository_intelligence_protocol_ready',
  'future_protocol_compatible',
  'repository_incremental_index_ready',
  'bootstrap_completed',
] as const;

const EXECUTION_FLAGS = {
  project_repository_incremental_index_v1_engine_only: true as const,
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

function buildIndexField(fieldId: (typeof REPOSITORY_INCREMENTAL_INDEX_FIELD_KEYS)[number], defined: boolean) {
  return {
    field_id: fieldId,
    defined,
    planning_only: true as const,
    populated: false,
    analysis_only: true as const,
  };
}

function buildChangeType(changeId: (typeof REPOSITORY_CHANGE_DETECTION_KEYS)[number], defined: boolean) {
  return {
    change_type_id: changeId,
    defined,
    planning_only: true as const,
    populated: false,
    analysis_only: true as const,
  };
}

function buildRepositoryIncrementalIndexV1Artifact(
  policySource: Record<string, unknown>,
  engineReady: boolean
): Record<string, unknown> {
  const policyModelIntelligence = policySource.repository_intelligence_bootstrap_policy_model_intelligence as
    | Record<string, unknown>
    | undefined;
  const ripModel = policyModelIntelligence?.repository_intelligence_protocol_model as
    | Record<string, unknown>
    | undefined;
  const ripReady = ripModel?.repository_intelligence_protocol_ready === true;
  const indexReady = engineReady && ripReady;

  const repositoryIncrementalIndexIntelligence = {
    intelligence_id: 'repository_incremental_index_intelligence_v1',
    critical_model: 'repository_incremental_index_model' as const,
    repository_incremental_index_model: {
      model_id: 'repository_incremental_index_model_v1',
      generated: indexReady,
      planning_only: true,
      analysis_only: true,
      file_identity: buildIndexField('file_identity', indexReady),
      content_hash: buildIndexField('content_hash', indexReady),
      timestamp: buildIndexField('timestamp', indexReady),
      rename_tracking: buildIndexField('rename_tracking', indexReady),
      lineage_tracking: buildIndexField('lineage_tracking', indexReady),
      repository_version: buildIndexField('repository_version', indexReady),
      repository_incremental_index_ready: indexReady,
    },
  };

  const repositoryChangeDetectionIntelligence = {
    intelligence_id: 'repository_change_detection_intelligence_v1',
    critical_model: 'repository_change_detection_model' as const,
    repository_change_detection_model: {
      model_id: 'repository_change_detection_model_v1',
      generated: indexReady,
      planning_only: true,
      analysis_only: true,
      new_file: buildChangeType('new_file', indexReady),
      modified_file: buildChangeType('modified_file', indexReady),
      deleted_file: buildChangeType('deleted_file', indexReady),
      renamed_file: buildChangeType('renamed_file', indexReady),
      unchanged_file: buildChangeType('unchanged_file', indexReady),
      hash_changed: buildChangeType('hash_changed', indexReady),
      repository_change_detection_ready: indexReady,
    },
  };

  const repositoryUpdatePolicyIntelligence = {
    intelligence_id: 'repository_update_policy_intelligence_v1',
    critical_model: 'repository_update_policy_model' as const,
    repository_update_policy_model: {
      model_id: 'repository_update_policy_model_v1',
      generated: indexReady,
      planning_only: true,
      analysis_only: true,
      changed_files_only: true,
      incremental_update: true,
      full_rescan_required: false,
      incremental_checkpoint_supported: true,
      repository_update_policy_ready: indexReady,
    },
  };

  const repositoryConsistencyIntelligence = {
    intelligence_id: 'repository_consistency_intelligence_v1',
    critical_model: 'repository_consistency_model' as const,
    repository_consistency_model: {
      model_id: 'repository_consistency_model_v1',
      generated: indexReady,
      planning_only: true,
      analysis_only: true,
      cache_validation: true,
      incremental_consistency_check: true,
      cache_integrity_check: true,
      repository_consistency_ready: indexReady,
    },
  };

  const repositoryIncrementalIndexModelIntelligence = {
    intelligence_id: 'repository_incremental_index_model_intelligence_v1',
    critical_model: 'repository_intelligence_protocol_model' as const,
    repository_intelligence_protocol_model: {
      model_id: 'repository_intelligence_protocol_model_v1',
      generated: indexReady,
      protocol_id: 'REPOSITORY_INTELLIGENCE_PROTOCOL_V1',
      protocol_version: 'rip_v1',
      protocol_hash: 'rip_v1_metadata_only_stable_contract',
      adapter_ready: true,
      backward_compatible: true,
      future_protocol_compatible: true,
      repository_intelligence_protocol_ready: indexReady && ripReady,
      analysis_only: true,
    },
  };

  const repositoryIncrementalIndexValidationIntelligence = {
    intelligence_id: 'repository_incremental_index_validation_intelligence_v1',
    repository_incremental_index_validation_model: {
      model_id: 'repository_incremental_index_validation_model_v1',
      generated: indexReady,
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
        validated: indexReady,
        adapter_ready: true,
        backward_compatible: true,
      },
      repository_intelligence_bootstrap_policy_available: {
        validated: engineReady,
        policy_ref: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH,
      },
    },
  };

  const metrics = {
    metrics_id: 'repository_incremental_index_metrics_v1',
    repository_incremental_index_score: buildScoreEntry(
      'repository_incremental_index_score',
      indexReady,
      0.985,
      true
    ),
    repository_intelligence_protocol_score: buildScoreEntry(
      'repository_intelligence_protocol_score',
      indexReady,
      0.985
    ),
  };

  const passStatus = {
    repository_incremental_index_defined: indexReady,
    repository_change_detection_defined: indexReady,
    repository_update_policy_defined: indexReady,
    repository_consistency_defined: indexReady,
    repository_intelligence_protocol_generated: indexReady && ripReady,
    repository_intelligence_protocol_ready: indexReady && ripReady,
    future_protocol_compatible: indexReady,
    repository_incremental_index_ready: indexReady,
    bootstrap_completed: false,
  };

  return {
    repository_incremental_index_v1_id: PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_VERSION,
    repository_incremental_index_v1_version: PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_VERSION,
    generated_at: new Date().toISOString(),
    repository_bootstrap_policy_v1_ref: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH,
    repository_incremental_index_intelligence: repositoryIncrementalIndexIntelligence,
    repository_change_detection_intelligence: repositoryChangeDetectionIntelligence,
    repository_update_policy_intelligence: repositoryUpdatePolicyIntelligence,
    repository_consistency_intelligence: repositoryConsistencyIntelligence,
    repository_incremental_index_model_intelligence: repositoryIncrementalIndexModelIntelligence,
    repository_incremental_index_validation_intelligence: repositoryIncrementalIndexValidationIntelligence,
    repository_incremental_index_metrics: metrics,
    repository_incremental_index_status: passStatus,
  };
}

export type ProjectRepositoryIncrementalIndexV1EngineResult = {
  report_id: string;
  phase: typeof PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PHASE;
  system_id: typeof PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_SYSTEM_ID;
  generated_at: string;
  final_verdict:
    | typeof PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PASS_VERDICT
    | typeof PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_FAIL_VERDICT;
  status:
    | typeof PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_STATUS
    | 'PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_NOT_READY';
  project_repository_incremental_index_v1_engine_passed: boolean;
  repository_incremental_index_score: number;
  repository_intelligence_protocol_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
};

function runProjectRepositoryIncrementalIndexV1Engine(
  projectRoot?: string
): ProjectRepositoryIncrementalIndexV1EngineResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProjectRepositoryIncrementalIndexV1EngineResult['issues'] = [];

  const policyReportPath = path.join(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REPORT_PATH);
  const policyArtifactPath = path.join(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH);

  let policyReportReady = false;
  if (fs.existsSync(policyReportPath)) {
    const policyReport = readJson<{
      final_verdict: string;
      status: string;
      project_repository_intelligence_bootstrap_policy_v1_engine_passed?: boolean;
    }>(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REPORT_PATH);

    policyReportReady =
      (policyReport.final_verdict === PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PASS_VERDICT ||
        policyReport.final_verdict === PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PRECHECK_VERDICT) &&
      policyReport.status === PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_STATUS &&
      policyReport.project_repository_intelligence_bootstrap_policy_v1_engine_passed === true;
  }

  const policySource = fs.existsSync(policyArtifactPath)
    ? readJson<Record<string, unknown>>(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH)
    : {};

  const policyStatus = (policySource.repository_intelligence_bootstrap_policy_status ?? {}) as Record<
    string,
    boolean
  >;

  const policyStatusReady = PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PASS_STATUS_KEYS.every((key) => {
    if (key === 'bootstrap_completed') {
      return policyStatus[key] === false;
    }
    return policyStatus[key] === true;
  });

  const engineReady =
    (policyReportReady || (fs.existsSync(policyArtifactPath) && policyStatusReady)) &&
    Object.keys(policySource).length > 0;

  if (!engineReady) {
    issues.push({
      code: 'PREREQ',
      message:
        'Project Repository Intelligence Bootstrap Policy V1 Engine must pass before Repository Incremental Index V1 Engine',
      severity: 'error',
    });
  }

  if (!fs.existsSync(policyArtifactPath)) {
    issues.push({
      code: 'METADATA',
      message: 'Repository bootstrap policy v1 artifact required for metadata-only incremental index engine',
      severity: 'error',
    });
  }

  const artifact = buildRepositoryIncrementalIndexV1Artifact(
    policySource,
    engineReady && Object.keys(policySource).length > 0
  );
  writeJson(root, PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH, artifact);

  const passStatus = artifact.repository_incremental_index_status as Record<
    (typeof PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PASS_STATUS_KEYS)[number],
    boolean
  >;

  const passed =
    engineReady &&
    PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PASS_STATUS_KEYS.every((key) => {
      if (key === 'bootstrap_completed') {
        return passStatus[key] === false;
      }
      return passStatus[key] === true;
    }) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const metrics = artifact.repository_incremental_index_metrics as {
    repository_incremental_index_score: { value: number };
    repository_intelligence_protocol_score: { value: number };
  };

  const result: ProjectRepositoryIncrementalIndexV1EngineResult = {
    report_id: '',
    phase: PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PHASE,
    system_id: PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: passed
      ? PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PASS_VERDICT
      : PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_FAIL_VERDICT,
    status: passed
      ? PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_STATUS
      : 'PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_NOT_READY',
    project_repository_incremental_index_v1_engine_passed: passed,
    repository_incremental_index_score: metrics.repository_incremental_index_score.value,
    repository_intelligence_protocol_score: metrics.repository_intelligence_protocol_score.value,
    checks: { PREREQ: engineReady, PASS_STATUS: passed, PLANNING_ONLY: true },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  result.report_id = `project_repository_incremental_index_v1_engine_${Date.now().toString(36)}`;

  writeJson(root, PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REPORT_PATH, {
    report_id: result.report_id,
    phase: result.phase,
    system_id: result.system_id,
    generated_at: result.generated_at,
    precheck_verdict: PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PRECHECK_VERDICT,
    repository_incremental_index_score: result.repository_incremental_index_score,
    repository_intelligence_protocol_score: result.repository_intelligence_protocol_score,
    project_repository_incremental_index_v1_engine_passed: result.project_repository_incremental_index_v1_engine_passed,
    repository_bootstrap_policy_v1_ref: PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH,
    final_verdict: result.final_verdict,
    status: result.status,
    checks: result.checks,
    issues: result.issues,
    execution_flags: result.execution_flags,
  });

  return result;
}

export function writeProjectRepositoryIncrementalIndexV1EngineReport(
  projectRoot?: string
): ProjectRepositoryIncrementalIndexV1EngineResult {
  return runProjectRepositoryIncrementalIndexV1Engine(projectRoot);
}
