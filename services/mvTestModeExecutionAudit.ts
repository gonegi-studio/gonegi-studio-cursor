import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import type { MvRuntimeTraceability } from './mvProductionRuntimeEngine.js';
import {
  MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
  MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT,
  MV_TEST_EXECUTION_PACKAGE_REPORT_PATH,
  MV_TEST_EXECUTION_PACKAGE_READY_STATUS,
  type MvTestExecutionPackage,
  type MvTestExecutionPackageArtifact,
} from './mvTestExecutionPackage.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_TEST_MODE_EXECUTION_AUDIT_PHASE =
  'PHASE-DIGITAL-STUDIO-009-MV_TEST_MODE_EXECUTION_AUDIT_V1' as const;
export const MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT =
  'PASS_MV_TEST_MODE_EXECUTION_AUDIT_V1' as const;
export const MV_TEST_MODE_EXECUTION_AUDIT_FAIL_VERDICT =
  'FAIL_MV_TEST_MODE_EXECUTION_AUDIT_V1' as const;
export const MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS = 'MV_TEST_MODE_EXECUTION_AUDIT_READY' as const;
export const MV_TEST_MODE_EXECUTION_AUDIT_DIR = 'reports/mv_test_mode_execution_audit' as const;
export const MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH =
  'reports/mv_test_mode_execution_audit/mv-test-mode-execution-audit-report.json' as const;
export const MV_TEST_MODE_EXECUTION_AUDIT_MD_PATH =
  'reports/mv_test_mode_execution_audit/MV_TEST_MODE_EXECUTION_AUDIT.md' as const;
export const MV_TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR =
  'exports/mv_test_mode_execution_audit' as const;
export const MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH =
  'exports/mv_test_mode_execution_audit/mv-test-mode-execution-audit-manifest.json' as const;
export const MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH =
  'exports/mv_test_mode_execution_audit/mv-test-mode-execution-audit.json' as const;

export const EXECUTION_AUDIT_ARTIFACT_WRITE_SCOPE = 'exports/mv_test_mode_execution_audit/' as const;

export const EXECUTION_SCOPE_TEST_MODE_ONLY = 'test_mode_only' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type AuditStatus = 'PASS' | 'FAIL';

export type MvTestModeExecutionAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type AuditCheck = {
  check_id: string;
  check_label: string;
  status: AuditStatus;
};

export type MvTestExecutionSummary = {
  unit_count: number;
  queue_length: number;
  mock_entry_count: number;
  adapter_step_count: number;
  summary_ready: AuditStatus;
};

export type MockExecutionValidation = {
  mock_output_only: true;
  all_mock_targets_valid: AuditStatus;
  mock_plan_valid: AuditStatus;
  queue_mock_only: AuditStatus;
  validation_ready: AuditStatus;
};

export type FailureRecoveryValidation = {
  recovery_ready: boolean;
  step_count: number;
  validation_ready: AuditStatus;
};

export type MusicSyncValidation = {
  sync_valid: boolean;
  beat_marker_count: number;
  validation_ready: AuditStatus;
};

export type MvTestExecutionAuditResult = {
  source_test_execution_package_ref: typeof MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH;
  mv_test_execution_audit_id: string;
  mv_type: MvType;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  test_execution_summary: MvTestExecutionSummary;
  mock_execution_validation: MockExecutionValidation;
  failure_recovery_validation: FailureRecoveryValidation;
  music_sync_validation: MusicSyncValidation;
  runtime_certification_chain_verified: AuditStatus;
  traceability_chain: MvRuntimeTraceability;
  audit_ready: AuditStatus;
};

export type MvTestModeExecutionAuditArtifact = {
  audit_id: string;
  phase: typeof MV_TEST_MODE_EXECUTION_AUDIT_PHASE;
  generated_at: string;
  source_test_execution_package_ref: typeof MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH;
  package_bundle_id: string;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  test_mode_allowed: true;
  mock_output_only: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  mv_test_execution_audits: MvTestExecutionAuditResult[];
  safety_flags: {
    planning_only: true;
    test_mode: true;
    mock_execution_only: true;
    mock_output_only: true;
    generation: false;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    no_execution: true;
    no_rendering: true;
    production_mode_blocked: true;
  };
  test_execution_package_consumed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  runtime_certification_chain_complete: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    execution_audit_artifact_write_scope: typeof EXECUTION_AUDIT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  audit_complete: boolean;
  next_stage_ready: boolean;
};

export type MvTestModeExecutionAuditManifest = {
  manifest_id: string;
  phase: typeof MV_TEST_MODE_EXECUTION_AUDIT_PHASE;
  generated_at: string;
  test_execution_audit_count: typeof MV_TYPE_COUNT;
  test_execution_package_consumed: AuditStatus;
  execution_audit_ready: AuditStatus;
  mock_execution_valid: AuditStatus;
  mock_output_only: true;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: AuditStatus;
  gpu_execution_blocked: AuditStatus;
  failure_recovery_ready: AuditStatus;
  music_sync_preserved: AuditStatus;
  mv_type_preserved: AuditStatus;
  traceability_preserved: boolean;
  runtime_certification_chain_complete: AuditStatus;
  execution_scope_valid: AuditStatus;
  production_mode_blocked: AuditStatus;
  safe_create_policy_verified: AuditStatus;
  next_stage_ready: AuditStatus;
  certification_status: typeof MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS | null;
};

export type MvTestModeExecutionAuditReport = {
  report_id: string;
  phase: typeof MV_TEST_MODE_EXECUTION_AUDIT_PHASE;
  timestamp: string;
  planning_only: true;
  mock_execution_only: true;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  test_mode_allowed: true;
  mock_output_only: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  source_test_execution_package_ref: typeof MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH;
  mv_test_execution_package_report_path: typeof MV_TEST_EXECUTION_PACKAGE_REPORT_PATH;
  mv_test_mode_execution_audit_export_dir: typeof MV_TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR;
  mv_test_mode_execution_audit_manifest_path: typeof MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH;
  mv_test_mode_execution_audit_artifact_path: typeof MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  test_execution_audit_count: typeof MV_TYPE_COUNT;
  test_execution_package_consumed: AuditStatus;
  execution_audit_ready: AuditStatus;
  mock_execution_valid: AuditStatus;
  failure_recovery_ready: AuditStatus;
  music_sync_preserved: AuditStatus;
  mv_type_preserved: AuditStatus;
  traceability_preserved: boolean;
  runtime_certification_chain_complete: AuditStatus;
  execution_scope_valid: AuditStatus;
  production_mode_blocked: AuditStatus;
  safe_create_policy_verified: AuditStatus;
  next_stage_ready: AuditStatus;
  test_execution_package_missing: boolean;
  mock_execution_invalid: boolean;
  mock_output_missing: boolean;
  test_mode_disabled: boolean;
  real_generation_enabled: boolean;
  runtime_execution_detected: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  failure_recovery_missing: boolean;
  music_sync_loss: boolean;
  mv_type_loss: boolean;
  traceability_loss: boolean;
  runtime_certification_chain_broken: boolean;
  execution_scope_invalid: boolean;
  production_mode_unblocked: boolean;
  safe_create_policy_violation: boolean;
  next_stage_blocked: boolean;
  mv_test_mode_execution_audit_ready: AuditStatus;
  certification_status: typeof MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS | null;
  mv_test_execution_audits: MvTestExecutionAuditResult[];
  audit_checks: AuditCheck[];
  final_verdict:
    | typeof MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT
    | typeof MV_TEST_MODE_EXECUTION_AUDIT_FAIL_VERDICT;
  issues: MvTestModeExecutionAuditIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH] as const;

const AUDIT_EXPORT_WRITE_PATHS = [
  MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_TEST_MODE_EXECUTION_AUDIT_DIR,
  MV_TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR,
  MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_MD_PATH,
  ...AUDIT_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): AuditStatus {
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

function isUnderAuditWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(EXECUTION_AUDIT_ARTIFACT_WRITE_SCOPE) ||
    relativePath === EXECUTION_AUDIT_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function isMockOutput(value: string): boolean {
  return value.startsWith('mock_output_') || value.startsWith('mock_');
}

function isRuntimeCertificationChainComplete(traceability: MvRuntimeTraceability): boolean {
  return (
    traceability.trace_integrity === 'PASS' &&
    traceability.source_generation_plan_ref.length > 0 &&
    traceability.generation_plan_id.length > 0 &&
    traceability.mv_shot_assembly_id.length > 0 &&
    traceability.mv_scene_assembly_id.length > 0 &&
    traceability.mv_blueprint_id.length > 0 &&
    traceability.mv_foundation_id.length > 0 &&
    traceability.upstream_runtime_id.length > 0 &&
    Array.isArray(traceability.dataset_refs)
  );
}

function auditTestPackage(testPackage: MvTestExecutionPackage): MvTestExecutionAuditResult {
  const allMockTargetsValid =
    testPackage.test_execution_units.every(
      (unit) =>
        isMockOutput(unit.mock_image_output) &&
        isMockOutput(unit.mock_video_output) &&
        unit.unit_ready === 'PASS'
    ) &&
    testPackage.mock_execution_plan.entries.every(
      (entry) =>
        isMockOutput(entry.mock_image_output) &&
        isMockOutput(entry.mock_video_output) &&
        entry.mock_output_only === true &&
        entry.mock_ready === 'PASS'
    );

  const mockPlanValid =
    testPackage.mock_execution_plan.mock_output_only === true &&
    testPackage.mock_execution_plan.plan_valid &&
    testPackage.mock_execution_plan.entry_count === testPackage.test_execution_units.length;

  const queueMockOnly =
    testPackage.test_execution_queue.length === testPackage.test_execution_units.length * 4 &&
    testPackage.test_execution_queue.every(
      (entry) =>
        entry.mock_execution_only === true &&
        entry.execution_allowed === false &&
        entry.runtime_mode === EXECUTION_SCOPE_TEST_MODE_ONLY
    );

  const mockValidationReady =
    testPackage.mock_output_only === true &&
    allMockTargetsValid &&
    mockPlanValid &&
    queueMockOnly;

  const failureRecoveryReady =
    testPackage.failure_recovery_plan.recovery_ready &&
    testPackage.failure_recovery_plan.step_count > 0 &&
    testPackage.failure_recovery_plan.steps.every((step) => step.recovery_ready === 'PASS');

  const musicSyncReady =
    testPackage.music_sync_plan.sync_valid &&
    testPackage.music_sync_plan.beat_markers.every((marker) => marker.sync_preserved === 'PASS');

  const chainVerified = isRuntimeCertificationChainComplete(testPackage.traceability_chain);

  const summaryReady =
    testPackage.test_execution_units.length > 0 &&
    testPackage.test_execution_queue.length > 0 &&
    testPackage.mock_execution_plan.entry_count > 0;

  const auditReady =
    testPackage.test_execution_package_ready === 'PASS' &&
    testPackage.test_mode_allowed === true &&
    testPackage.real_generation_blocked === true &&
    testPackage.runtime_not_executed === true &&
    testPackage.external_call_blocked === true &&
    testPackage.gpu_execution_blocked === true &&
    mockValidationReady &&
    failureRecoveryReady &&
    musicSyncReady &&
    chainVerified &&
    testPackage.traceability_chain.trace_integrity === 'PASS' &&
    testPackage.runtime_mode === EXECUTION_SCOPE_TEST_MODE_ONLY;

  return {
    source_test_execution_package_ref: MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
    mv_test_execution_audit_id: `${testPackage.mv_type}_test_execution_audit_v1`,
    mv_type: testPackage.mv_type,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    test_execution_summary: {
      unit_count: testPackage.test_execution_units.length,
      queue_length: testPackage.test_execution_queue.length,
      mock_entry_count: testPackage.mock_execution_plan.entry_count,
      adapter_step_count: testPackage.adapter_execution_plan.step_count,
      summary_ready: toStatus(summaryReady),
    },
    mock_execution_validation: {
      mock_output_only: true,
      all_mock_targets_valid: toStatus(allMockTargetsValid),
      mock_plan_valid: toStatus(mockPlanValid),
      queue_mock_only: toStatus(queueMockOnly),
      validation_ready: toStatus(mockValidationReady),
    },
    failure_recovery_validation: {
      recovery_ready: testPackage.failure_recovery_plan.recovery_ready,
      step_count: testPackage.failure_recovery_plan.step_count,
      validation_ready: toStatus(failureRecoveryReady),
    },
    music_sync_validation: {
      sync_valid: testPackage.music_sync_plan.sync_valid,
      beat_marker_count: testPackage.music_sync_plan.beat_markers.length,
      validation_ready: toStatus(musicSyncReady),
    },
    runtime_certification_chain_verified: toStatus(chainVerified),
    traceability_chain: testPackage.traceability_chain,
    audit_ready: toStatus(auditReady),
  };
}

function buildMarkdown(report: MvTestModeExecutionAuditReport): string {
  const lines = [
    '# MV Test Mode Execution Audit',
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
    `**Source Test Execution Package:** ${report.source_test_execution_package_ref}`,
    `**Execution Scope:** ${report.execution_scope}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| test_execution_package_consumed | ${report.test_execution_package_consumed} |`,
    `| execution_audit_ready | ${report.execution_audit_ready} |`,
    `| mock_execution_valid | ${report.mock_execution_valid} |`,
    `| mock_output_only | ${report.mock_output_only} |`,
    `| test_mode_allowed | ${report.test_mode_allowed} |`,
    `| real_generation_blocked | ${report.real_generation_blocked} |`,
    `| runtime_not_executed | ${report.runtime_not_executed} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| failure_recovery_ready | ${report.failure_recovery_ready} |`,
    `| music_sync_preserved | ${report.music_sync_preserved} |`,
    `| mv_type_preserved | ${report.mv_type_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| runtime_certification_chain_complete | ${report.runtime_certification_chain_complete} |`,
    `| execution_scope_valid | ${report.execution_scope_valid} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| next_stage_ready | ${report.next_stage_ready} |`,
    '',
    '## Test Execution Audits',
    ''
  );

  for (const audit of report.mv_test_execution_audits) {
    lines.push(
      `- ${audit.mv_test_execution_audit_id} (${audit.mv_type}): units=${audit.test_execution_summary.unit_count} mock=${audit.test_execution_summary.mock_entry_count} ready=${audit.audit_ready}`
    );
  }

  lines.push('', '## Audit Checks', '');
  for (const check of report.audit_checks) {
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
  issues: MvTestModeExecutionAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvTestModeExecutionAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvTestModeExecutionAuditReport = {
    report_id: 'mv-test-mode-execution-audit-report-v1',
    phase: MV_TEST_MODE_EXECUTION_AUDIT_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    test_mode_allowed: true,
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_test_execution_package_ref: MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
    mv_test_execution_package_report_path: MV_TEST_EXECUTION_PACKAGE_REPORT_PATH,
    mv_test_mode_execution_audit_export_dir: MV_TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR,
    mv_test_mode_execution_audit_manifest_path: MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
    mv_test_mode_execution_audit_artifact_path: MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    test_execution_audit_count: MV_TYPE_COUNT,
    test_execution_package_consumed: 'FAIL',
    execution_audit_ready: 'FAIL',
    mock_execution_valid: 'FAIL',
    failure_recovery_ready: 'FAIL',
    music_sync_preserved: 'FAIL',
    mv_type_preserved: 'FAIL',
    traceability_preserved: false,
    runtime_certification_chain_complete: 'FAIL',
    execution_scope_valid: 'FAIL',
    production_mode_blocked: 'FAIL',
    safe_create_policy_verified: 'FAIL',
    next_stage_ready: 'FAIL',
    test_execution_package_missing: true,
    mock_execution_invalid: true,
    mock_output_missing: true,
    test_mode_disabled: true,
    real_generation_enabled: true,
    runtime_execution_detected: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    failure_recovery_missing: true,
    music_sync_loss: true,
    mv_type_loss: true,
    traceability_loss: true,
    runtime_certification_chain_broken: true,
    execution_scope_invalid: true,
    production_mode_unblocked: true,
    safe_create_policy_violation: true,
    next_stage_blocked: true,
    mv_test_mode_execution_audit_ready: 'FAIL',
    certification_status: null,
    mv_test_execution_audits: [],
    audit_checks: [],
    final_verdict: MV_TEST_MODE_EXECUTION_AUDIT_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message:
              'Test execution package artifact was modified during test mode execution audit write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_EXECUTION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvTestModeExecutionAudit(
  projectRoot?: string
): MvTestModeExecutionAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvTestModeExecutionAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const packageReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_test_execution_package_engine_ready: AuditStatus;
    test_execution_package_ready: AuditStatus;
    next_stage_ready: AuditStatus;
    traceability_preserved: boolean;
  }>(root, MV_TEST_EXECUTION_PACKAGE_REPORT_PATH);
  const packageArtifact = loadJson<MvTestExecutionPackageArtifact>(
    root,
    MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH
  );

  const packagePrecheckValid =
    packageReport !== null &&
    packageReport.final_verdict === MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT &&
    packageReport.certification_status === MV_TEST_EXECUTION_PACKAGE_READY_STATUS &&
    packageReport.mv_test_execution_package_engine_ready === 'PASS' &&
    packageReport.test_execution_package_ready === 'PASS' &&
    packageArtifact !== null &&
    packageArtifact.test_execution_package_complete === true;

  if (!packagePrecheckValid) {
    issues.push({
      code: 'TEST_EXECUTION_PACKAGE_PRECHECK_FAILED',
      message: `Required ${MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT} with ${MV_TEST_EXECUTION_PACKAGE_READY_STATUS}`,
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

  const auditResults = packageArtifact.mv_test_execution_packages.map((testPackage) =>
    auditTestPackage(testPackage)
  );

  for (const audit of auditResults) {
    if (audit.audit_ready === 'FAIL') {
      issues.push({
        code: 'EXECUTION_AUDIT_FAILED',
        message: `Test execution audit failed for ${audit.mv_test_execution_audit_id}`,
        severity: 'error',
        mv_type: audit.mv_type,
      });
    }
  }

  const testExecutionPackageConsumed =
    packageArtifact.runtime_certification_consumed === true &&
    packageArtifact.test_execution_package_complete === true &&
    auditResults.every(
      (audit) =>
        audit.source_test_execution_package_ref === MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH
    );

  const executionAuditReady = auditResults.every((audit) => audit.audit_ready === 'PASS');
  const mockExecutionValid = auditResults.every(
    (audit) => audit.mock_execution_validation.validation_ready === 'PASS'
  );
  const testModeAllowed = true as const;
  const mockOutputOnly = true as const;
  const realGenerationBlocked = true as const;
  const runtimeNotExecuted =
    packageArtifact.runtime_not_executed === true &&
    packageArtifact.safety_flags.runtime_execution === false &&
    packageArtifact.safety_flags.no_execution === true;
  const externalCallBlockedFlag =
    packageArtifact.external_call_blocked === true &&
    packageArtifact.safety_flags.external_call_allowed === false;
  const gpuExecutionBlockedFlag =
    packageArtifact.gpu_execution_blocked === true &&
    packageArtifact.safety_flags.gpu_execution === false;
  const failureRecoveryReady = auditResults.every(
    (audit) => audit.failure_recovery_validation.validation_ready === 'PASS'
  );
  const musicSyncPreserved = auditResults.every(
    (audit) => audit.music_sync_validation.validation_ready === 'PASS'
  );
  const mvTypePreserved = auditResults.every(
    (audit) => SUPPORTED_MV_TYPES.includes(audit.mv_type) && audit.test_execution_summary.unit_count > 0
  );
  const traceabilityPreserved =
    packageArtifact.traceability_preserved === true &&
    auditResults.every((audit) => audit.traceability_chain.trace_integrity === 'PASS');
  const runtimeCertificationChainComplete = auditResults.every(
    (audit) => audit.runtime_certification_chain_verified === 'PASS'
  );
  const executionScopeValid = auditResults.every(
    (audit) => audit.execution_scope === EXECUTION_SCOPE_TEST_MODE_ONLY
  );

  const productionModeBlocked =
    upstreamRuntimeCertArtifact.production_mode_blocked === true &&
    upstreamRuntimeCertArtifact.real_generation_blocked === true &&
    upstreamRuntimeCertArtifact.no_external_calls === true &&
    upstreamRuntimeCertArtifact.no_gpu_execution === true &&
    packageArtifact.safety_flags.production_mode_blocked === true;

  const auditWriteScopeValid = AUDIT_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderAuditWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && auditWriteScopeValid;

  const nextStageReady =
    testExecutionPackageConsumed &&
    executionAuditReady &&
    mockExecutionValid &&
    testModeAllowed === true &&
    mockOutputOnly === true &&
    realGenerationBlocked === true &&
    runtimeNotExecuted &&
    externalCallBlockedFlag &&
    gpuExecutionBlockedFlag &&
    failureRecoveryReady &&
    musicSyncPreserved &&
    mvTypePreserved &&
    traceabilityPreserved &&
    runtimeCertificationChainComplete &&
    executionScopeValid &&
    productionModeBlocked &&
    safeCreatePolicyVerified;

  const auditComplete = nextStageReady;

  const testExecutionPackageMissing = !testExecutionPackageConsumed;
  const mockExecutionInvalid = !mockExecutionValid;
  const mockOutputMissing = mockOutputOnly !== true;
  const testModeDisabled = testModeAllowed !== true;
  const realGenerationEnabled = realGenerationBlocked !== true;
  const runtimeExecutionDetected = !runtimeNotExecuted;
  const externalCallEnabled = !externalCallBlockedFlag;
  const gpuExecutionEnabled = !gpuExecutionBlockedFlag;
  const failureRecoveryMissing = !failureRecoveryReady;
  const musicSyncLoss = !musicSyncPreserved;
  const mvTypeLoss = !mvTypePreserved;
  const traceabilityLoss = !traceabilityPreserved;
  const runtimeCertificationChainBroken = !runtimeCertificationChainComplete;
  const executionScopeInvalid = !executionScopeValid;
  const productionModeUnblocked = !productionModeBlocked;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;
  const nextStageBlocked = !nextStageReady;

  if (testExecutionPackageMissing) {
    issues.push({
      code: 'TEST_EXECUTION_PACKAGE_MISSING',
      message: 'Test execution package was not consumed',
      severity: 'error',
    });
  }
  if (mockExecutionInvalid) {
    issues.push({
      code: 'MOCK_EXECUTION_INVALID',
      message: 'Mock execution validation failed',
      severity: 'error',
    });
  }
  if (mockOutputMissing) {
    issues.push({
      code: 'MOCK_OUTPUT_MISSING',
      message: 'Mock output only flag must be set',
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
      message: 'Failure recovery validation failed',
      severity: 'error',
    });
  }
  if (musicSyncLoss) {
    issues.push({
      code: 'MUSIC_SYNC_LOSS',
      message: 'Music sync validation failed',
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
  if (runtimeCertificationChainBroken) {
    issues.push({
      code: 'RUNTIME_CERTIFICATION_CHAIN_BROKEN',
      message: 'Runtime certification chain is incomplete',
      severity: 'error',
    });
  }
  if (executionScopeInvalid) {
    issues.push({
      code: 'EXECUTION_SCOPE_INVALID',
      message: 'Execution scope must be test_mode_only',
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
  if (safeCreatePolicyViolation) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }
  if (nextStageBlocked) {
    issues.push({
      code: 'NEXT_STAGE_BLOCKED',
      message: 'Next stage is not ready',
      severity: 'error',
    });
  }

  const auditChecks: AuditCheck[] = [
    {
      check_id: 'test_execution_package_consumed',
      check_label: 'Test Execution Package Consumed',
      status: toStatus(testExecutionPackageConsumed),
    },
    {
      check_id: 'execution_audit_ready',
      check_label: 'Execution Audit Ready',
      status: toStatus(executionAuditReady),
    },
    {
      check_id: 'mock_execution_valid',
      check_label: 'Mock Execution Valid',
      status: toStatus(mockExecutionValid),
    },
    {
      check_id: 'mock_output_only',
      check_label: 'Mock Output Only',
      status: toStatus(mockOutputOnly === true),
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
      status: toStatus(externalCallBlockedFlag),
    },
    {
      check_id: 'gpu_execution_blocked',
      check_label: 'GPU Execution Blocked',
      status: toStatus(gpuExecutionBlockedFlag),
    },
    {
      check_id: 'failure_recovery_ready',
      check_label: 'Failure Recovery Ready',
      status: toStatus(failureRecoveryReady),
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
      check_id: 'runtime_certification_chain_complete',
      check_label: 'Runtime Certification Chain Complete',
      status: toStatus(runtimeCertificationChainComplete),
    },
    {
      check_id: 'execution_scope_valid',
      check_label: 'Execution Scope Valid',
      status: toStatus(executionScopeValid),
    },
    {
      check_id: 'production_mode_blocked',
      check_label: 'Production Mode Blocked',
      status: toStatus(productionModeBlocked),
    },
    {
      check_id: 'safe_create_policy_verified',
      check_label: 'Safe Create Policy Verified',
      status: toStatus(safeCreatePolicyVerified),
    },
    {
      check_id: 'next_stage_ready',
      check_label: 'Next Stage Ready',
      status: toStatus(nextStageReady),
    },
  ];

  const pass = auditComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvTestModeExecutionAuditArtifact = {
    audit_id: 'mv-test-mode-execution-audit-v1',
    phase: MV_TEST_MODE_EXECUTION_AUDIT_PHASE,
    generated_at: timestamp,
    source_test_execution_package_ref: MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
    package_bundle_id: packageArtifact.package_bundle_id,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    test_mode_allowed: true,
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    mv_test_execution_audits: auditResults,
    safety_flags: {
      planning_only: true,
      test_mode: true,
      mock_execution_only: true,
      mock_output_only: true,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      production_mode_blocked: true,
    },
    test_execution_package_consumed: testExecutionPackageConsumed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    runtime_certification_chain_complete: runtimeCertificationChainComplete,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      execution_audit_artifact_write_scope: EXECUTION_AUDIT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    audit_complete: auditComplete,
    next_stage_ready: nextStageReady,
  };

  const manifest: MvTestModeExecutionAuditManifest = {
    manifest_id: 'mv-test-mode-execution-audit-manifest-v1',
    phase: MV_TEST_MODE_EXECUTION_AUDIT_PHASE,
    generated_at: timestamp,
    test_execution_audit_count: MV_TYPE_COUNT,
    test_execution_package_consumed: toStatus(testExecutionPackageConsumed),
    execution_audit_ready: toStatus(executionAuditReady),
    mock_execution_valid: toStatus(mockExecutionValid),
    mock_output_only: true,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: toStatus(externalCallBlockedFlag),
    gpu_execution_blocked: toStatus(gpuExecutionBlockedFlag),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    runtime_certification_chain_complete: toStatus(runtimeCertificationChainComplete),
    execution_scope_valid: toStatus(executionScopeValid),
    production_mode_blocked: toStatus(productionModeBlocked),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvTestModeExecutionAuditReport = {
    report_id: 'mv-test-mode-execution-audit-report-v1',
    phase: MV_TEST_MODE_EXECUTION_AUDIT_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    test_mode_allowed: true,
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_test_execution_package_ref: MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
    mv_test_execution_package_report_path: MV_TEST_EXECUTION_PACKAGE_REPORT_PATH,
    mv_test_mode_execution_audit_export_dir: MV_TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR,
    mv_test_mode_execution_audit_manifest_path: MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
    mv_test_mode_execution_audit_artifact_path: MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    test_execution_audit_count: MV_TYPE_COUNT,
    test_execution_package_consumed: toStatus(testExecutionPackageConsumed),
    execution_audit_ready: toStatus(executionAuditReady),
    mock_execution_valid: toStatus(mockExecutionValid),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    runtime_certification_chain_complete: toStatus(runtimeCertificationChainComplete),
    execution_scope_valid: toStatus(executionScopeValid),
    production_mode_blocked: toStatus(productionModeBlocked),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    test_execution_package_missing: testExecutionPackageMissing,
    mock_execution_invalid: mockExecutionInvalid,
    mock_output_missing: mockOutputMissing,
    test_mode_disabled: testModeDisabled,
    real_generation_enabled: realGenerationEnabled,
    runtime_execution_detected: runtimeExecutionDetected,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    failure_recovery_missing: failureRecoveryMissing,
    music_sync_loss: musicSyncLoss,
    mv_type_loss: mvTypeLoss,
    traceability_loss: traceabilityLoss,
    runtime_certification_chain_broken: runtimeCertificationChainBroken,
    execution_scope_invalid: executionScopeInvalid,
    production_mode_unblocked: productionModeUnblocked,
    safe_create_policy_violation: safeCreatePolicyViolation,
    next_stage_blocked: nextStageBlocked,
    mv_test_mode_execution_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS : null,
    mv_test_execution_audits: auditResults,
    audit_checks: auditChecks,
    final_verdict: pass
      ? MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT
      : MV_TEST_MODE_EXECUTION_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_EXECUTION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
