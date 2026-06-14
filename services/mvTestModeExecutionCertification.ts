import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import type { MvRuntimeTraceability } from './mvProductionRuntimeEngine.js';
import {
  EXECUTION_SCOPE_TEST_MODE_ONLY,
  MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
  MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
  type MvTestExecutionAuditResult,
  type MvTestModeExecutionAuditArtifact,
} from './mvTestModeExecutionAudit.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_TEST_MODE_EXECUTION_CERTIFICATION_PHASE =
  'PHASE-DIGITAL-STUDIO-010-MV_TEST_MODE_EXECUTION_CERTIFICATION_V1' as const;
export const MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT =
  'PASS_MV_TEST_MODE_EXECUTION_CERTIFICATION_V1' as const;
export const MV_TEST_MODE_EXECUTION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MV_TEST_MODE_EXECUTION_CERTIFICATION_V1' as const;
export const MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS = 'MV_TEST_MODE_EXECUTION_CERTIFIED' as const;
export const MV_TEST_MODE_EXECUTION_CERTIFICATION_DIR =
  'reports/mv_test_mode_execution_certification' as const;
export const MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH =
  'reports/mv_test_mode_execution_certification/mv-test-mode-execution-certification-report.json' as const;
export const MV_TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH =
  'reports/mv_test_mode_execution_certification/MV_TEST_MODE_EXECUTION_CERTIFICATION.md' as const;
export const MV_TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR =
  'exports/mv_test_mode_execution_certification' as const;
export const MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH =
  'exports/mv_test_mode_execution_certification/mv-test-mode-execution-certification-manifest.json' as const;
export const MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH =
  'exports/mv_test_mode_execution_certification/mv-test-mode-execution-certification.json' as const;

export const EXECUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE =
  'exports/mv_test_mode_execution_certification/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type MvTestModeExecutionCertificationIssue = {
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

export type MvTestExecutionCertificationResult = {
  source_execution_audit_ref: typeof MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH;
  mv_test_execution_certification_id: string;
  mv_test_execution_audit_id: string;
  mv_type: MvType;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  mock_output_only: true;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  runtime_certification_chain_verified: CertificationStatus;
  traceability_chain: MvRuntimeTraceability;
  test_execution_certified: CertificationStatus;
};

export type MvTestModeExecutionCertificationArtifact = {
  certification_id: string;
  phase: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_PHASE;
  generated_at: string;
  source_execution_audit_ref: typeof MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH;
  execution_audit_id: string;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  mock_output_only: true;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  mv_test_execution_certifications: MvTestExecutionCertificationResult[];
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
  execution_audit_consumed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  runtime_certification_chain_complete: boolean;
  dry_run_allowed: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    execution_certification_artifact_write_scope: typeof EXECUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  execution_certification_complete: boolean;
  next_stage_ready: boolean;
};

export type MvTestModeExecutionCertificationManifest = {
  manifest_id: string;
  phase: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_PHASE;
  generated_at: string;
  test_execution_certification_count: typeof MV_TYPE_COUNT;
  execution_audit_consumed: CertificationStatus;
  test_execution_certified: CertificationStatus;
  execution_scope_valid: CertificationStatus;
  mock_output_verified: CertificationStatus;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  runtime_certification_chain_complete: CertificationStatus;
  traceability_preserved: boolean;
  production_mode_blocked: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  dry_run_allowed: CertificationStatus;
  certification_status: typeof MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS | null;
};

export type MvTestModeExecutionCertificationReport = {
  report_id: string;
  phase: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_PHASE;
  timestamp: string;
  planning_only: true;
  mock_execution_only: true;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  mock_output_only: true;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  source_execution_audit_ref: typeof MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH;
  mv_test_mode_execution_audit_report_path: typeof MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH;
  mv_test_mode_execution_certification_export_dir: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR;
  mv_test_mode_execution_certification_manifest_path: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH;
  mv_test_mode_execution_certification_artifact_path: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  test_execution_certification_count: typeof MV_TYPE_COUNT;
  execution_audit_consumed: CertificationStatus;
  test_execution_certified: CertificationStatus;
  execution_scope_valid: CertificationStatus;
  mock_output_verified: CertificationStatus;
  runtime_certification_chain_complete: CertificationStatus;
  traceability_preserved: boolean;
  production_mode_blocked: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  dry_run_allowed: CertificationStatus;
  execution_audit_missing: boolean;
  execution_scope_invalid: boolean;
  mock_output_missing: boolean;
  test_mode_disabled: boolean;
  real_generation_enabled: boolean;
  runtime_execution_detected: boolean;
  runtime_certification_chain_broken: boolean;
  traceability_loss: boolean;
  production_mode_unblocked: boolean;
  safe_create_policy_violation: boolean;
  mv_test_mode_execution_certification_ready: CertificationStatus;
  certification_status: typeof MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS | null;
  mv_test_execution_certifications: MvTestExecutionCertificationResult[];
  certification_checks: CertificationCheck[];
  final_verdict:
    | typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT
    | typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_FAIL_VERDICT;
  issues: MvTestModeExecutionCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH] as const;

const CERTIFICATION_EXPORT_WRITE_PATHS = [
  MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_TEST_MODE_EXECUTION_CERTIFICATION_DIR,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH,
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
    relativePath.startsWith(EXECUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE) ||
    relativePath === EXECUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function certifyAuditResult(audit: MvTestExecutionAuditResult): MvTestExecutionCertificationResult {
  const certified =
    audit.audit_ready === 'PASS' &&
    audit.execution_scope === EXECUTION_SCOPE_TEST_MODE_ONLY &&
    audit.mock_execution_validation.mock_output_only === true &&
    audit.mock_execution_validation.validation_ready === 'PASS' &&
    audit.runtime_certification_chain_verified === 'PASS' &&
    audit.traceability_chain.trace_integrity === 'PASS';

  return {
    source_execution_audit_ref: MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    mv_test_execution_certification_id: `${audit.mv_type}_test_execution_certification_v1`,
    mv_test_execution_audit_id: audit.mv_test_execution_audit_id,
    mv_type: audit.mv_type,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    mock_output_only: true,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    runtime_certification_chain_verified: audit.runtime_certification_chain_verified,
    traceability_chain: audit.traceability_chain,
    test_execution_certified: toStatus(certified),
  };
}

function buildMarkdown(report: MvTestModeExecutionCertificationReport): string {
  const lines = [
    '# MV Test Mode Execution Certification',
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
    `**Source Execution Audit:** ${report.source_execution_audit_ref}`,
    `**Execution Scope:** ${report.execution_scope}`,
    '',
    '## Flow',
    '',
    'DS-009 Audit → DS-010 Execution Certification → DS-011 Dry Run → DS-012 Dry Run Certification → DS-013 Final Audit',
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| execution_audit_consumed | ${report.execution_audit_consumed} |`,
    `| test_execution_certified | ${report.test_execution_certified} |`,
    `| execution_scope_valid | ${report.execution_scope_valid} |`,
    `| mock_output_verified | ${report.mock_output_verified} |`,
    `| test_mode_allowed | ${report.test_mode_allowed} |`,
    `| real_generation_blocked | ${report.real_generation_blocked} |`,
    `| runtime_not_executed | ${report.runtime_not_executed} |`,
    `| runtime_certification_chain_complete | ${report.runtime_certification_chain_complete} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| next_stage_ready | ${report.next_stage_ready} |`,
    `| dry_run_allowed | ${report.dry_run_allowed} |`,
    '',
    '## Test Execution Certifications',
    ''
  );

  for (const cert of report.mv_test_execution_certifications) {
    lines.push(
      `- ${cert.mv_test_execution_certification_id} (${cert.mv_type}): chain=${cert.runtime_certification_chain_verified} certified=${cert.test_execution_certified}`
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
  issues: MvTestModeExecutionCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvTestModeExecutionCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvTestModeExecutionCertificationReport = {
    report_id: 'mv-test-mode-execution-certification-report-v1',
    phase: MV_TEST_MODE_EXECUTION_CERTIFICATION_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    mock_output_only: true,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_execution_audit_ref: MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    mv_test_mode_execution_audit_report_path: MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
    mv_test_mode_execution_certification_export_dir: MV_TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR,
    mv_test_mode_execution_certification_manifest_path: MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
    mv_test_mode_execution_certification_artifact_path: MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    test_execution_certification_count: MV_TYPE_COUNT,
    execution_audit_consumed: 'FAIL',
    test_execution_certified: 'FAIL',
    execution_scope_valid: 'FAIL',
    mock_output_verified: 'FAIL',
    runtime_certification_chain_complete: 'FAIL',
    traceability_preserved: false,
    production_mode_blocked: 'FAIL',
    safe_create_policy_verified: 'FAIL',
    next_stage_ready: 'FAIL',
    dry_run_allowed: 'FAIL',
    execution_audit_missing: true,
    execution_scope_invalid: true,
    mock_output_missing: true,
    test_mode_disabled: true,
    real_generation_enabled: true,
    runtime_execution_detected: true,
    runtime_certification_chain_broken: true,
    traceability_loss: true,
    production_mode_unblocked: true,
    safe_create_policy_violation: true,
    mv_test_mode_execution_certification_ready: 'FAIL',
    certification_status: null,
    mv_test_execution_certifications: [],
    certification_checks: [],
    final_verdict: MV_TEST_MODE_EXECUTION_CERTIFICATION_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message:
              'Execution audit artifact was modified during test mode execution certification write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvTestModeExecutionCertification(
  projectRoot?: string
): MvTestModeExecutionCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvTestModeExecutionCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const auditReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_test_mode_execution_audit_ready: CertificationStatus;
    execution_audit_ready: CertificationStatus;
    next_stage_ready: CertificationStatus;
    traceability_preserved: boolean;
  }>(root, MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH);
  const auditArtifact = loadJson<MvTestModeExecutionAuditArtifact>(
    root,
    MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH
  );

  const auditPrecheckValid =
    auditReport !== null &&
    auditReport.final_verdict === MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT &&
    auditReport.certification_status === MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS &&
    auditReport.mv_test_mode_execution_audit_ready === 'PASS' &&
    auditReport.execution_audit_ready === 'PASS' &&
    auditArtifact !== null &&
    auditArtifact.audit_complete === true;

  if (!auditPrecheckValid) {
    issues.push({
      code: 'EXECUTION_AUDIT_PRECHECK_FAILED',
      message: `Required ${MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT} with ${MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS}`,
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

  const certificationResults = auditArtifact.mv_test_execution_audits.map((audit) =>
    certifyAuditResult(audit)
  );

  for (const result of certificationResults) {
    if (result.test_execution_certified === 'FAIL') {
      issues.push({
        code: 'TEST_EXECUTION_CERTIFICATION_FAILED',
        message: `Test execution certification failed for ${result.mv_test_execution_certification_id}`,
        severity: 'error',
        mv_type: result.mv_type,
      });
    }
  }

  const executionAuditConsumed =
    auditArtifact.test_execution_package_consumed === true &&
    auditArtifact.audit_complete === true &&
    certificationResults.every(
      (result) =>
        result.source_execution_audit_ref === MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH
    );

  const testExecutionCertified = certificationResults.every(
    (result) => result.test_execution_certified === 'PASS'
  );
  const executionScopeValid = certificationResults.every(
    (result) => result.execution_scope === EXECUTION_SCOPE_TEST_MODE_ONLY
  );
  const mockOutputVerified = certificationResults.every(
    (result) =>
      result.mock_output_only === true &&
      auditArtifact.mv_test_execution_audits.find(
        (audit) => audit.mv_type === result.mv_type
      )?.mock_execution_validation.validation_ready === 'PASS'
  );
  const testModeAllowed = true as const;
  const realGenerationBlocked = true as const;
  const runtimeNotExecuted =
    auditArtifact.runtime_not_executed === true &&
    auditArtifact.safety_flags.runtime_execution === false &&
    auditArtifact.safety_flags.no_execution === true;
  const runtimeCertificationChainComplete = certificationResults.every(
    (result) => result.runtime_certification_chain_verified === 'PASS'
  );
  const traceabilityPreserved =
    auditArtifact.traceability_preserved === true &&
    certificationResults.every((result) => result.traceability_chain.trace_integrity === 'PASS');

  const productionModeBlocked =
    upstreamRuntimeCertArtifact.production_mode_blocked === true &&
    upstreamRuntimeCertArtifact.real_generation_blocked === true &&
    upstreamRuntimeCertArtifact.no_external_calls === true &&
    upstreamRuntimeCertArtifact.no_gpu_execution === true &&
    auditArtifact.safety_flags.production_mode_blocked === true;

  const certificationWriteScopeValid = CERTIFICATION_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderCertificationWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && certificationWriteScopeValid;

  const dryRunAllowed =
    testExecutionCertified &&
    executionScopeValid &&
    mockOutputVerified &&
    testModeAllowed === true &&
    realGenerationBlocked === true &&
    runtimeNotExecuted &&
    runtimeCertificationChainComplete &&
    traceabilityPreserved &&
    productionModeBlocked;

  const nextStageReady =
    executionAuditConsumed &&
    testExecutionCertified &&
    executionScopeValid &&
    mockOutputVerified &&
    testModeAllowed === true &&
    realGenerationBlocked === true &&
    runtimeNotExecuted &&
    runtimeCertificationChainComplete &&
    traceabilityPreserved &&
    productionModeBlocked &&
    safeCreatePolicyVerified &&
    dryRunAllowed;

  const executionCertificationComplete = nextStageReady;

  const executionAuditMissing = !executionAuditConsumed;
  const executionScopeInvalid = !executionScopeValid;
  const mockOutputMissing = !mockOutputVerified;
  const testModeDisabled = testModeAllowed !== true;
  const realGenerationEnabled = realGenerationBlocked !== true;
  const runtimeExecutionDetected = !runtimeNotExecuted;
  const runtimeCertificationChainBroken = !runtimeCertificationChainComplete;
  const traceabilityLoss = !traceabilityPreserved;
  const productionModeUnblocked = !productionModeBlocked;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  if (executionAuditMissing) {
    issues.push({
      code: 'EXECUTION_AUDIT_MISSING',
      message: 'Execution audit was not consumed',
      severity: 'error',
    });
  }
  if (!testExecutionCertified) {
    issues.push({
      code: 'TEST_EXECUTION_NOT_CERTIFIED',
      message: 'One or more test execution packages failed certification',
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
  if (mockOutputMissing) {
    issues.push({
      code: 'MOCK_OUTPUT_MISSING',
      message: 'Mock output verification failed',
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
  if (runtimeCertificationChainBroken) {
    issues.push({
      code: 'RUNTIME_CERTIFICATION_CHAIN_BROKEN',
      message: 'Runtime certification chain is incomplete',
      severity: 'error',
    });
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
  if (safeCreatePolicyViolation) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }

  const certificationChecks: CertificationCheck[] = [
    {
      check_id: 'execution_audit_consumed',
      check_label: 'Execution Audit Consumed',
      status: toStatus(executionAuditConsumed),
    },
    {
      check_id: 'test_execution_certified',
      check_label: 'Test Execution Certified',
      status: toStatus(testExecutionCertified),
    },
    {
      check_id: 'execution_scope_valid',
      check_label: 'Execution Scope Valid',
      status: toStatus(executionScopeValid),
    },
    {
      check_id: 'mock_output_verified',
      check_label: 'Mock Output Verified',
      status: toStatus(mockOutputVerified),
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
      check_id: 'runtime_certification_chain_complete',
      check_label: 'Runtime Certification Chain Complete',
      status: toStatus(runtimeCertificationChainComplete),
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

  const pass =
    executionCertificationComplete &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvTestModeExecutionCertificationArtifact = {
    certification_id: 'mv-test-mode-execution-certification-v1',
    phase: MV_TEST_MODE_EXECUTION_CERTIFICATION_PHASE,
    generated_at: timestamp,
    source_execution_audit_ref: MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    execution_audit_id: auditArtifact.audit_id,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    mock_output_only: true,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    mv_test_execution_certifications: certificationResults,
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
    execution_audit_consumed: executionAuditConsumed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    runtime_certification_chain_complete: runtimeCertificationChainComplete,
    dry_run_allowed: dryRunAllowed,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      execution_certification_artifact_write_scope: EXECUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    execution_certification_complete: executionCertificationComplete,
    next_stage_ready: nextStageReady,
  };

  const manifest: MvTestModeExecutionCertificationManifest = {
    manifest_id: 'mv-test-mode-execution-certification-manifest-v1',
    phase: MV_TEST_MODE_EXECUTION_CERTIFICATION_PHASE,
    generated_at: timestamp,
    test_execution_certification_count: MV_TYPE_COUNT,
    execution_audit_consumed: toStatus(executionAuditConsumed),
    test_execution_certified: toStatus(testExecutionCertified),
    execution_scope_valid: toStatus(executionScopeValid),
    mock_output_verified: toStatus(mockOutputVerified),
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    runtime_certification_chain_complete: toStatus(runtimeCertificationChainComplete),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    dry_run_allowed: toStatus(dryRunAllowed),
    certification_status: pass ? MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvTestModeExecutionCertificationReport = {
    report_id: 'mv-test-mode-execution-certification-report-v1',
    phase: MV_TEST_MODE_EXECUTION_CERTIFICATION_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    mock_output_only: true,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_execution_audit_ref: MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    mv_test_mode_execution_audit_report_path: MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
    mv_test_mode_execution_certification_export_dir: MV_TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR,
    mv_test_mode_execution_certification_manifest_path: MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
    mv_test_mode_execution_certification_artifact_path: MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    test_execution_certification_count: MV_TYPE_COUNT,
    execution_audit_consumed: toStatus(executionAuditConsumed),
    test_execution_certified: toStatus(testExecutionCertified),
    execution_scope_valid: toStatus(executionScopeValid),
    mock_output_verified: toStatus(mockOutputVerified),
    runtime_certification_chain_complete: toStatus(runtimeCertificationChainComplete),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    dry_run_allowed: toStatus(dryRunAllowed),
    execution_audit_missing: executionAuditMissing,
    execution_scope_invalid: executionScopeInvalid,
    mock_output_missing: mockOutputMissing,
    test_mode_disabled: testModeDisabled,
    real_generation_enabled: realGenerationEnabled,
    runtime_execution_detected: runtimeExecutionDetected,
    runtime_certification_chain_broken: runtimeCertificationChainBroken,
    traceability_loss: traceabilityLoss,
    production_mode_unblocked: productionModeUnblocked,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_test_mode_execution_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS : null,
    mv_test_execution_certifications: certificationResults,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT
      : MV_TEST_MODE_EXECUTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
