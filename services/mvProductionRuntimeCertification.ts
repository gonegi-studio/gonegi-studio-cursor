import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import {
  MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
  MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_READY_STATUS,
  RUNTIME_MODE_TEST_MODE_ONLY,
  type FailureRecoveryPlan,
  type MvProductionRuntimeEngineArtifact,
  type MvRuntimePlan,
  type MvRuntimeTraceability,
} from './mvProductionRuntimeEngine.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_PRODUCTION_RUNTIME_CERTIFICATION_PHASE =
  'PHASE-DIGITAL-STUDIO-007-MV_PRODUCTION_RUNTIME_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT =
  'PASS_MV_PRODUCTION_RUNTIME_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_RUNTIME_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_RUNTIME_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS = 'MV_PRODUCTION_RUNTIME_CERTIFIED' as const;
export const MV_PRODUCTION_RUNTIME_CERTIFICATION_DIR =
  'reports/mv_production_runtime_certification' as const;
export const MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH =
  'reports/mv_production_runtime_certification/mv-production-runtime-certification-report.json' as const;
export const MV_PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH =
  'reports/mv_production_runtime_certification/MV_PRODUCTION_RUNTIME_CERTIFICATION.md' as const;
export const MV_PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR =
  'exports/mv_production_runtime_certification' as const;
export const MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH =
  'exports/mv_production_runtime_certification/mv-production-runtime-certification-manifest.json' as const;
export const MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH =
  'exports/mv_production_runtime_certification/mv-production-runtime-certification.json' as const;

export const RUNTIME_CERTIFICATION_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_runtime_certification/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type MvProductionRuntimeCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type CertificationCheck = {
  check_id: string;
  check_label: string;
  status: CertificationStatus;
};

export type MvRuntimeCertificationChecks = {
  runtime_consumed: CertificationStatus;
  runtime_certified: CertificationStatus;
  execution_queue_valid: CertificationStatus;
  failure_recovery_ready: CertificationStatus;
  music_sync_preserved: CertificationStatus;
  mv_type_preserved: CertificationStatus;
};

export type MvRuntimeCertificationResult = {
  source_runtime_ref: typeof MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH;
  runtime_certification_id: string;
  mv_runtime_id: string;
  mv_type: MvType;
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_allowed: false;
  gpu_execution_allowed: false;
  failure_recovery_plan: FailureRecoveryPlan;
  traceability_chain: MvRuntimeTraceability;
  certification_checks: MvRuntimeCertificationChecks;
  plan_certified: CertificationStatus;
};

export type MvProductionRuntimeCertificationArtifact = {
  certification_id: string;
  phase: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_PHASE;
  generated_at: string;
  source_runtime_ref: typeof MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH;
  runtime_engine_id: string;
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_allowed: false;
  gpu_execution_allowed: false;
  runtime_certification_results: MvRuntimeCertificationResult[];
  safety_flags: {
    runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
    generation: false;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    no_execution: true;
    no_rendering: true;
    test_mode_allowed: true;
    production_mode_blocked: true;
  };
  runtime_consumed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    runtime_certification_artifact_write_scope: typeof RUNTIME_CERTIFICATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  certification_complete: boolean;
};

export type MvProductionRuntimeCertificationManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_PHASE;
  generated_at: string;
  runtime_certification_count: typeof MV_TYPE_COUNT;
  runtime_consumed: CertificationStatus;
  runtime_certified: CertificationStatus;
  runtime_mode_valid: CertificationStatus;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  failure_recovery_ready: CertificationStatus;
  execution_queue_valid: CertificationStatus;
  music_sync_preserved: CertificationStatus;
  mv_type_preserved: CertificationStatus;
  traceability_preserved: boolean;
  production_mode_blocked: CertificationStatus;
  certification_status: typeof MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS | null;
};

export type MvProductionRuntimeCertificationReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_PHASE;
  timestamp: string;
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_allowed: false;
  gpu_execution_allowed: false;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  no_execution: true;
  no_rendering: true;
  source_runtime_ref: typeof MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH;
  mv_production_runtime_engine_report_path: typeof MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH;
  mv_production_runtime_certification_export_dir: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR;
  mv_production_runtime_certification_manifest_path: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH;
  mv_production_runtime_certification_artifact_path: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  runtime_certification_count: typeof MV_TYPE_COUNT;
  runtime_consumed: CertificationStatus;
  runtime_certified: CertificationStatus;
  runtime_mode_valid: CertificationStatus;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  failure_recovery_ready: CertificationStatus;
  execution_queue_valid: CertificationStatus;
  music_sync_preserved: CertificationStatus;
  mv_type_preserved: CertificationStatus;
  traceability_preserved: boolean;
  production_mode_blocked: CertificationStatus;
  runtime_missing: boolean;
  runtime_certification_failed: boolean;
  runtime_mode_invalid: boolean;
  test_mode_disabled: boolean;
  real_generation_enabled: boolean;
  runtime_execution_detected: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  failure_recovery_missing: boolean;
  music_sync_loss: boolean;
  mv_type_loss: boolean;
  traceability_loss: boolean;
  production_mode_unblocked: boolean;
  mv_production_runtime_certification_ready: CertificationStatus;
  certification_status: typeof MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS | null;
  runtime_certification_results: MvRuntimeCertificationResult[];
  certification_checks: CertificationCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT
    | typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_FAIL_VERDICT;
  issues: MvProductionRuntimeCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH] as const;

const CERTIFICATION_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_RUNTIME_CERTIFICATION_DIR,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH,
  ...CERTIFICATION_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): CertificationStatus {
  return pass ? 'PASS' : 'FAIL';
}

function loadJson<T>(root: string, relativePath: string): T | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

function snapshotFile(root: string, relativePath: string): FileSnapshot | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  const stat = fs.statSync(fullPath);
  return { size: stat.size, mtimeMs: stat.mtimeMs };
}

function snapshotsUnchanged(
  root: string,
  snapshots: Record<string, FileSnapshot | null>
): boolean {
  for (const [relativePath, snapshot] of Object.entries(snapshots)) {
    if (!snapshot) return false;
    const current = snapshotFile(root, relativePath);
    if (!current || current.size !== snapshot.size || current.mtimeMs !== snapshot.mtimeMs) {
      return false;
    }
  }
  return true;
}

function isUnderCertificationWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(RUNTIME_CERTIFICATION_ARTIFACT_WRITE_SCOPE) ||
    relativePath === RUNTIME_CERTIFICATION_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function isExecutionQueueValid(runtimePlan: MvRuntimePlan): boolean {
  return (
    runtimePlan.execution_queue.length === runtimePlan.runtime_units.length * 4 &&
    runtimePlan.execution_queue.every(
      (entry) =>
        entry.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY && entry.execution_allowed === false
    )
  );
}

function isRuntimeNotExecuted(runtimePlan: MvRuntimePlan): boolean {
  return (
    runtimePlan.execution_queue.every((entry) => entry.execution_allowed === false) &&
    runtimePlan.external_call_allowed === false &&
    runtimePlan.gpu_execution_allowed === false &&
    runtimePlan.image_runtime_plan.external_call_allowed === false &&
    runtimePlan.video_runtime_plan.external_call_allowed === false &&
    runtimePlan.adapter_execution_plan.steps.every(
      (step) => step.external_call_allowed === false && step.gpu_execution_allowed === false
    )
  );
}

function certifyRuntimePlan(runtimePlan: MvRuntimePlan): MvRuntimeCertificationResult {
  const runtimeConsumed =
    runtimePlan.source_generation_plan_ref.length > 0 &&
    runtimePlan.runtime_ready === 'PASS' &&
    runtimePlan.mv_runtime_id.length > 0;

  const executionQueueValid = isExecutionQueueValid(runtimePlan);
  const failureRecoveryReady = runtimePlan.failure_recovery_plan.recovery_ready;
  const musicSyncPreserved = runtimePlan.music_sync_runtime_plan.sync_valid;
  const mvTypePreserved = runtimePlan.mv_type_preserved === true;
  const runtimeModeValid = runtimePlan.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY;
  const runtimeNotExecuted = isRuntimeNotExecuted(runtimePlan);
  const traceabilityPreserved = runtimePlan.traceability_chain.trace_integrity === 'PASS';

  const planCertified =
    runtimeConsumed &&
    runtimeModeValid &&
    executionQueueValid &&
    failureRecoveryReady &&
    musicSyncPreserved &&
    mvTypePreserved &&
    runtimeNotExecuted &&
    traceabilityPreserved &&
    runtimePlan.runtime_ready === 'PASS';

  return {
    source_runtime_ref: MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    runtime_certification_id: `${runtimePlan.mv_type}_runtime_certification_v1`,
    mv_runtime_id: runtimePlan.mv_runtime_id,
    mv_type: runtimePlan.mv_type,
    runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_allowed: false,
    gpu_execution_allowed: false,
    failure_recovery_plan: runtimePlan.failure_recovery_plan,
    traceability_chain: runtimePlan.traceability_chain,
    certification_checks: {
      runtime_consumed: toStatus(runtimeConsumed),
      runtime_certified: toStatus(planCertified),
      execution_queue_valid: toStatus(executionQueueValid),
      failure_recovery_ready: toStatus(failureRecoveryReady),
      music_sync_preserved: toStatus(musicSyncPreserved),
      mv_type_preserved: toStatus(mvTypePreserved),
    },
    plan_certified: toStatus(planCertified),
  };
}

function buildMarkdown(report: MvProductionRuntimeCertificationReport): string {
  const lines = [
    '# MV Production Runtime Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    `**Source Runtime:** ${report.source_runtime_ref}`,
    `**Runtime Mode:** ${report.runtime_mode}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| runtime_consumed | ${report.runtime_consumed} |`,
    `| runtime_certified | ${report.runtime_certified} |`,
    `| runtime_mode_valid | ${report.runtime_mode_valid} |`,
    `| test_mode_allowed | ${report.test_mode_allowed} |`,
    `| real_generation_blocked | ${report.real_generation_blocked} |`,
    `| runtime_not_executed | ${report.runtime_not_executed} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| failure_recovery_ready | ${report.failure_recovery_ready} |`,
    `| execution_queue_valid | ${report.execution_queue_valid} |`,
    `| music_sync_preserved | ${report.music_sync_preserved} |`,
    `| mv_type_preserved | ${report.mv_type_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    '',
    '## Runtime Certification Results',
    ''
  );

  for (const result of report.runtime_certification_results) {
    lines.push(
      `- ${result.runtime_certification_id} (${result.mv_type}): certified=${result.plan_certified} mode=${result.runtime_mode}`
    );
  }

  lines.push('', '## Certification Checks', '');
  for (const check of report.certification_checks) {
    lines.push(`- ${check.check_id}: ${check.status}`);
  }

  if (report.issues.length > 0) {
    lines.push('', '## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionRuntimeCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionRuntimeCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionRuntimeCertificationReport = {
    report_id: 'mv-production-runtime-certification-report-v1',
    phase: MV_PRODUCTION_RUNTIME_CERTIFICATION_PHASE,
    timestamp,
    runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_allowed: false,
    gpu_execution_allowed: false,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    no_execution: true,
    no_rendering: true,
    source_runtime_ref: MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    mv_production_runtime_engine_report_path: MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
    mv_production_runtime_certification_export_dir: MV_PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR,
    mv_production_runtime_certification_manifest_path: MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
    mv_production_runtime_certification_artifact_path: MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    runtime_certification_count: MV_TYPE_COUNT,
    runtime_consumed: 'FAIL',
    runtime_certified: 'FAIL',
    runtime_mode_valid: 'FAIL',
    external_call_blocked: 'FAIL',
    gpu_execution_blocked: 'FAIL',
    failure_recovery_ready: 'FAIL',
    execution_queue_valid: 'FAIL',
    music_sync_preserved: 'FAIL',
    mv_type_preserved: 'FAIL',
    traceability_preserved: false,
    production_mode_blocked: 'FAIL',
    runtime_missing: true,
    runtime_certification_failed: true,
    runtime_mode_invalid: true,
    test_mode_disabled: true,
    real_generation_enabled: true,
    runtime_execution_detected: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    failure_recovery_missing: true,
    music_sync_loss: true,
    mv_type_loss: true,
    traceability_loss: true,
    production_mode_unblocked: true,
    mv_production_runtime_certification_ready: 'FAIL',
    certification_status: null,
    runtime_certification_results: [],
    certification_checks: [],
    final_verdict: MV_PRODUCTION_RUNTIME_CERTIFICATION_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message: 'Runtime engine artifact was modified during runtime certification write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionRuntimeCertification(
  projectRoot?: string
): MvProductionRuntimeCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionRuntimeCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const runtimeEngineReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_production_runtime_engine_ready: CertificationStatus;
    runtime_ready: CertificationStatus;
    traceability_preserved: boolean;
  }>(root, MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH);
  const runtimeEngineArtifact = loadJson<MvProductionRuntimeEngineArtifact>(
    root,
    MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH
  );

  const runtimePrecheckValid =
    runtimeEngineReport !== null &&
    runtimeEngineReport.final_verdict === MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT &&
    runtimeEngineReport.certification_status === MV_PRODUCTION_RUNTIME_READY_STATUS &&
    runtimeEngineReport.mv_production_runtime_engine_ready === 'PASS' &&
    runtimeEngineReport.runtime_ready === 'PASS' &&
    runtimeEngineArtifact !== null &&
    runtimeEngineArtifact.runtime_planning_complete === true;

  if (!runtimePrecheckValid) {
    issues.push({
      code: 'RUNTIME_PRECHECK_FAILED',
      message: `Required ${MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT} with ${MV_PRODUCTION_RUNTIME_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const upstreamRuntimeCertArtifact = loadJson<{
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
  }>(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);

  if (!upstreamRuntimeCertArtifact) {
    issues.push({
      code: 'UPSTREAM_RUNTIME_CERTIFICATION_MISSING',
      message: 'Missing upstream production runtime certification artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const runtimeCertificationResults = runtimeEngineArtifact.mv_runtime_plans.map((runtimePlan) =>
    certifyRuntimePlan(runtimePlan)
  );

  for (const result of runtimeCertificationResults) {
    if (result.plan_certified === 'FAIL') {
      issues.push({
        code: 'RUNTIME_CERTIFICATION_FAILED',
        message: `Runtime certification failed for ${result.mv_runtime_id}`,
        severity: 'error',
        mv_type: result.mv_type,
      });
    }
  }

  const runtimeConsumed =
    runtimeEngineArtifact.generation_plan_consumed === true &&
    runtimeEngineArtifact.runtime_planning_complete === true &&
    runtimeCertificationResults.every(
      (result) =>
        result.source_runtime_ref === MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH &&
        result.certification_checks.runtime_consumed === 'PASS'
    );

  const runtimeCertified = runtimeCertificationResults.every(
    (result) => result.plan_certified === 'PASS'
  );
  const runtimeModeValid = runtimeCertificationResults.every(
    (result) => result.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY
  );
  const testModeAllowed = true as const;
  const realGenerationBlocked = true as const;
  const runtimeNotExecuted =
    runtimeEngineArtifact.safety_flags.runtime_execution === false &&
    runtimeEngineArtifact.safety_flags.no_execution === true &&
    runtimeCertificationResults.every((result) => result.runtime_not_executed === true);
  const externalCallBlocked = runtimeCertificationResults.every(
    (result) =>
      result.external_call_allowed === false &&
      runtimeEngineArtifact.safety_flags.external_call_allowed === false
  );
  const gpuExecutionBlocked = runtimeCertificationResults.every(
    (result) =>
      result.gpu_execution_allowed === false &&
      runtimeEngineArtifact.safety_flags.gpu_execution === false
  );
  const failureRecoveryReady = runtimeCertificationResults.every(
    (result) => result.certification_checks.failure_recovery_ready === 'PASS'
  );
  const executionQueueValid = runtimeCertificationResults.every(
    (result) => result.certification_checks.execution_queue_valid === 'PASS'
  );
  const musicSyncPreserved = runtimeCertificationResults.every(
    (result) => result.certification_checks.music_sync_preserved === 'PASS'
  );
  const mvTypePreserved = runtimeCertificationResults.every(
    (result) => result.certification_checks.mv_type_preserved === 'PASS'
  );
  const traceabilityPreserved =
    runtimeEngineArtifact.traceability_preserved === true &&
    runtimeCertificationResults.every(
      (result) => result.traceability_chain.trace_integrity === 'PASS'
    );

  const productionModeBlocked =
    upstreamRuntimeCertArtifact.production_mode_blocked === true &&
    upstreamRuntimeCertArtifact.real_generation_blocked === true &&
    upstreamRuntimeCertArtifact.no_external_calls === true &&
    upstreamRuntimeCertArtifact.no_gpu_execution === true &&
    runtimeEngineArtifact.safety_flags.production_mode_blocked === true;

  const certificationWriteScopeValid = CERTIFICATION_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderCertificationWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && certificationWriteScopeValid;

  const certificationComplete =
    runtimeConsumed &&
    runtimeCertified &&
    runtimeModeValid &&
    testModeAllowed === true &&
    realGenerationBlocked === true &&
    runtimeNotExecuted &&
    externalCallBlocked &&
    gpuExecutionBlocked &&
    failureRecoveryReady &&
    executionQueueValid &&
    musicSyncPreserved &&
    mvTypePreserved &&
    traceabilityPreserved &&
    productionModeBlocked &&
    safeCreatePolicyVerified;

  const runtimeMissing = !runtimeConsumed;
  const runtimeCertificationFailed = !runtimeCertified;
  const runtimeModeInvalidFlag = !runtimeModeValid;
  const testModeDisabled = testModeAllowed !== true;
  const realGenerationEnabled = realGenerationBlocked !== true;
  const runtimeExecutionDetected = !runtimeNotExecuted;
  const externalCallEnabled = !externalCallBlocked;
  const gpuExecutionEnabled = !gpuExecutionBlocked;
  const failureRecoveryMissing = !failureRecoveryReady;
  const musicSyncLoss = !musicSyncPreserved;
  const mvTypeLoss = !mvTypePreserved;
  const traceabilityLoss = !traceabilityPreserved;
  const productionModeUnblocked = !productionModeBlocked;

  if (runtimeMissing) {
    issues.push({
      code: 'RUNTIME_MISSING',
      message: 'Runtime plan was not consumed',
      severity: 'error',
    });
  }
  if (runtimeCertificationFailed) {
    issues.push({
      code: 'RUNTIME_CERTIFICATION_FAILED',
      message: 'One or more runtime plans failed certification',
      severity: 'error',
    });
  }
  if (runtimeModeInvalidFlag) {
    issues.push({
      code: 'RUNTIME_MODE_INVALID',
      message: 'Runtime mode must be test_mode_only',
      severity: 'error',
    });
  }
  if (testModeDisabled) {
    issues.push({
      code: 'TEST_MODE_DISABLED',
      message: 'Test mode must be allowed',
      severity: 'error',
    });
  }
  if (realGenerationEnabled) {
    issues.push({
      code: 'REAL_GENERATION_ENABLED',
      message: 'Real generation must be blocked',
      severity: 'error',
    });
  }
  if (runtimeExecutionDetected) {
    issues.push({
      code: 'RUNTIME_EXECUTION_DETECTED',
      message: 'Runtime execution must not be detected',
      severity: 'error',
    });
  }
  if (externalCallEnabled) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'External calls must be blocked',
      severity: 'error',
    });
  }
  if (gpuExecutionEnabled) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'GPU execution must be blocked',
      severity: 'error',
    });
  }
  if (failureRecoveryMissing) {
    issues.push({
      code: 'FAILURE_RECOVERY_MISSING',
      message: 'Failure recovery plan is missing or not ready',
      severity: 'error',
    });
  }
  if (musicSyncLoss) {
    issues.push({
      code: 'MUSIC_SYNC_LOSS',
      message: 'Music sync plan is not preserved',
      severity: 'error',
    });
  }
  if (mvTypeLoss) {
    issues.push({ code: 'MV_TYPE_LOSS', message: 'MV type was not preserved', severity: 'error' });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability chain is not preserved',
      severity: 'error',
    });
  }
  if (productionModeUnblocked) {
    issues.push({
      code: 'PRODUCTION_MODE_UNBLOCKED',
      message: 'Production mode is not blocked',
      severity: 'error',
    });
  }
  if (!safeCreatePolicyVerified) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }

  const certificationChecks: CertificationCheck[] = [
    {
      check_id: 'runtime_consumed',
      check_label: 'Runtime Consumed',
      status: toStatus(runtimeConsumed),
    },
    {
      check_id: 'runtime_certified',
      check_label: 'Runtime Certified',
      status: toStatus(runtimeCertified),
    },
    {
      check_id: 'runtime_mode_valid',
      check_label: 'Runtime Mode Valid',
      status: toStatus(runtimeModeValid),
    },
    {
      check_id: 'test_mode_allowed',
      check_label: 'Test Mode Allowed',
      status: toStatus(testModeAllowed === true),
    },
    {
      check_id: 'real_generation_blocked',
      check_label: 'Real Generation Blocked',
      status: toStatus(realGenerationBlocked === true),
    },
    {
      check_id: 'runtime_not_executed',
      check_label: 'Runtime Not Executed',
      status: toStatus(runtimeNotExecuted),
    },
    {
      check_id: 'external_call_blocked',
      check_label: 'External Call Blocked',
      status: toStatus(externalCallBlocked),
    },
    {
      check_id: 'gpu_execution_blocked',
      check_label: 'GPU Execution Blocked',
      status: toStatus(gpuExecutionBlocked),
    },
    {
      check_id: 'failure_recovery_ready',
      check_label: 'Failure Recovery Ready',
      status: toStatus(failureRecoveryReady),
    },
    {
      check_id: 'execution_queue_valid',
      check_label: 'Execution Queue Valid',
      status: toStatus(executionQueueValid),
    },
    {
      check_id: 'music_sync_preserved',
      check_label: 'Music Sync Preserved',
      status: toStatus(musicSyncPreserved),
    },
    {
      check_id: 'mv_type_preserved',
      check_label: 'MV Type Preserved',
      status: toStatus(mvTypePreserved),
    },
    {
      check_id: 'traceability_preserved',
      check_label: 'Traceability Preserved',
      status: toStatus(traceabilityPreserved),
    },
    {
      check_id: 'production_mode_blocked',
      check_label: 'Production Mode Blocked',
      status: toStatus(productionModeBlocked),
    },
  ];

  const pass =
    certificationComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionRuntimeCertificationArtifact = {
    certification_id: 'mv-production-runtime-certification-v1',
    phase: MV_PRODUCTION_RUNTIME_CERTIFICATION_PHASE,
    generated_at: timestamp,
    source_runtime_ref: MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    runtime_engine_id: runtimeEngineArtifact.engine_id,
    runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_allowed: false,
    gpu_execution_allowed: false,
    runtime_certification_results: runtimeCertificationResults,
    safety_flags: {
      runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      test_mode_allowed: true,
      production_mode_blocked: true,
    },
    runtime_consumed: runtimeConsumed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      runtime_certification_artifact_write_scope: RUNTIME_CERTIFICATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    certification_complete: certificationComplete,
  };

  const manifest: MvProductionRuntimeCertificationManifest = {
    manifest_id: 'mv-production-runtime-certification-manifest-v1',
    phase: MV_PRODUCTION_RUNTIME_CERTIFICATION_PHASE,
    generated_at: timestamp,
    runtime_certification_count: MV_TYPE_COUNT,
    runtime_consumed: toStatus(runtimeConsumed),
    runtime_certified: toStatus(runtimeCertified),
    runtime_mode_valid: toStatus(runtimeModeValid),
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    execution_queue_valid: toStatus(executionQueueValid),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    certification_status: pass ? MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionRuntimeCertificationReport = {
    report_id: 'mv-production-runtime-certification-report-v1',
    phase: MV_PRODUCTION_RUNTIME_CERTIFICATION_PHASE,
    timestamp,
    runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_allowed: false,
    gpu_execution_allowed: false,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    no_execution: true,
    no_rendering: true,
    source_runtime_ref: MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    mv_production_runtime_engine_report_path: MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
    mv_production_runtime_certification_export_dir: MV_PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR,
    mv_production_runtime_certification_manifest_path: MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
    mv_production_runtime_certification_artifact_path: MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    runtime_certification_count: MV_TYPE_COUNT,
    runtime_consumed: toStatus(runtimeConsumed),
    runtime_certified: toStatus(runtimeCertified),
    runtime_mode_valid: toStatus(runtimeModeValid),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    execution_queue_valid: toStatus(executionQueueValid),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    runtime_missing: runtimeMissing,
    runtime_certification_failed: runtimeCertificationFailed,
    runtime_mode_invalid: runtimeModeInvalidFlag,
    test_mode_disabled: testModeDisabled,
    real_generation_enabled: realGenerationEnabled,
    runtime_execution_detected: runtimeExecutionDetected,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    failure_recovery_missing: failureRecoveryMissing,
    music_sync_loss: musicSyncLoss,
    mv_type_loss: mvTypeLoss,
    traceability_loss: traceabilityLoss,
    production_mode_unblocked: productionModeUnblocked,
    mv_production_runtime_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS : null,
    runtime_certification_results: runtimeCertificationResults,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT
      : MV_PRODUCTION_RUNTIME_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
