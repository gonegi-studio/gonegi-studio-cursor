import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
  PRODUCTION_MEMORY_BINDING_COUNT,
} from './movieAnalysisProductionEngineFoundation.js';
import {
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
  SAFE_CREATE_POLICY,
  type ProductionEngineMasterCertificationArtifact,
} from './movieAnalysisProductionEngineMasterCertification.js';
import {
  PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
} from './movieAnalysisProductionRuntimeCertification.js';
import {
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  type TestModeExecutionPackage,
  type TestModeExecutionPackageArtifact,
} from './movieAnalysisTestModeExecutionPackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TEST_MODE_EXECUTION_AUDIT_PHASE =
  'PHASE-LEVEL3-011-TEST_MODE_EXECUTION_AUDIT_V1' as const;
export const TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_TEST_MODE_EXECUTION_AUDIT_V1' as const;
export const TEST_MODE_EXECUTION_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_TEST_MODE_EXECUTION_AUDIT_V1' as const;
export const TEST_MODE_EXECUTION_AUDIT_READY_STATUS =
  'TEST_MODE_EXECUTION_AUDIT_READY' as const;
export const TEST_MODE_EXECUTION_AUDIT_DIR =
  'reports/movie_analysis_test_mode_execution_audit' as const;
export const TEST_MODE_EXECUTION_AUDIT_REPORT_PATH =
  'reports/movie_analysis_test_mode_execution_audit/movie-analysis-test-mode-execution-audit-report.json' as const;
export const TEST_MODE_EXECUTION_AUDIT_MD_PATH =
  'reports/movie_analysis_test_mode_execution_audit/MOVIE_ANALYSIS_TEST_MODE_EXECUTION_AUDIT.md' as const;
export const TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR =
  'exports/movie_analysis_test_mode_execution_audit' as const;
export const TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH =
  'exports/movie_analysis_test_mode_execution_audit/movie-analysis-test-mode-execution-audit-manifest.json' as const;
export const TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH =
  'exports/movie_analysis_test_mode_execution_audit/test-mode-execution-audit.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT, SAFE_CREATE_POLICY };

export type AuditStatus = 'PASS' | 'FAIL';

export type TestModeExecutionAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  test_package_id?: string;
  check_id?: string;
};

export type TestModeExecutionAuditCheck = {
  check_id: string;
  check_label: string;
  status: AuditStatus;
};

export type TestPackageAuditSummary = {
  test_package_id: string;
  test_mode: boolean;
  production_mode: boolean;
  external_call_allowed: boolean;
  gpu_execution_allowed: boolean;
  mock_output_only: boolean;
  real_generation: boolean;
  mock_execution_plan_ready: AuditStatus;
  traceability_integrity: AuditStatus;
  package_audit_ready: AuditStatus;
};

export type TestModeExecutionAuditArtifact = {
  audit_id: string;
  phase: typeof TEST_MODE_EXECUTION_AUDIT_PHASE;
  generated_at: string;
  production_engine_master_certification_artifact_path: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  audit_checks: TestModeExecutionAuditCheck[];
  test_package_audits: TestPackageAuditSummary[];
  mock_output_only: true;
  real_generation: false;
  runtime_not_executed: boolean;
  traceability_preserved: boolean;
  memory_bindings_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    upstream_artifacts_unchanged: boolean;
  };
  audit_complete: boolean;
  test_mode_ready: boolean;
  execution_simulation_ready: boolean;
  production_still_blocked: boolean;
};

export type MovieAnalysisTestModeExecutionAuditManifest = {
  manifest_id: string;
  phase: typeof TEST_MODE_EXECUTION_AUDIT_PHASE;
  generated_at: string;
  test_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  master_certification_verified: AuditStatus;
  test_execution_ready: AuditStatus;
  production_execution_blocked: AuditStatus;
  external_call_blocked: AuditStatus;
  gpu_execution_blocked: AuditStatus;
  runtime_not_executed: AuditStatus;
  mock_output_only: true;
  real_generation: false;
  traceability_preserved: boolean;
  memory_bindings_preserved: AuditStatus;
  safe_create_policy_preserved: AuditStatus;
  audit_complete: AuditStatus;
  test_mode_ready: AuditStatus;
  execution_simulation_ready: AuditStatus;
  production_still_blocked: AuditStatus;
  certification_status: typeof TEST_MODE_EXECUTION_AUDIT_READY_STATUS | null;
};

export type MovieAnalysisTestModeExecutionAuditReport = {
  report_id: string;
  phase: typeof TEST_MODE_EXECUTION_AUDIT_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  mock_output_only: true;
  real_generation: false;
  production_engine_master_certification_report_path: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH;
  production_engine_master_certification_artifact_path: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  test_mode_execution_audit_export_dir: typeof TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR;
  test_mode_execution_audit_manifest_path: typeof TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH;
  test_mode_execution_audit_artifact_path: typeof TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  test_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  master_certification_verified: AuditStatus;
  test_execution_ready: AuditStatus;
  production_execution_blocked: AuditStatus;
  external_call_blocked: AuditStatus;
  gpu_execution_blocked: AuditStatus;
  runtime_not_executed: AuditStatus;
  traceability_preserved: boolean;
  memory_bindings_preserved: AuditStatus;
  safe_create_policy_preserved: AuditStatus;
  audit_complete: AuditStatus;
  test_mode_ready: AuditStatus;
  execution_simulation_ready: AuditStatus;
  production_still_blocked: AuditStatus;
  master_certification_missing: boolean;
  test_execution_not_ready: boolean;
  production_execution_unblocked: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  runtime_execution_detected: boolean;
  real_generation_detected: boolean;
  mock_output_missing: boolean;
  traceability_loss: boolean;
  memory_binding_loss: boolean;
  safe_create_policy_violation: boolean;
  test_mode_execution_audit_ready: AuditStatus;
  certification_status: typeof TEST_MODE_EXECUTION_AUDIT_READY_STATUS | null;
  audit_checks: TestModeExecutionAuditCheck[];
  test_package_audits: TestPackageAuditSummary[];
  final_verdict:
    | typeof TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT
    | typeof TEST_MODE_EXECUTION_AUDIT_FAIL_VERDICT;
  issues: TestModeExecutionAuditIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  TEST_MODE_EXECUTION_AUDIT_DIR,
  TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR,
  TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  TEST_MODE_EXECUTION_AUDIT_MD_PATH,
  TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
  TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
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

function isMockTarget(value: string): boolean {
  return value.startsWith('mock_');
}

function auditTestPackage(testPackage: TestModeExecutionPackage): TestPackageAuditSummary {
  const dryRun = testPackage.dry_run_flags;
  const mockOutputOnly =
    testPackage.test_units.every(
      (unit) => isMockTarget(unit.mock_image_target) && isMockTarget(unit.mock_video_target)
    ) &&
    testPackage.mock_execution_plan.entries.every(
      (entry) => isMockTarget(entry.mock_image_target) && isMockTarget(entry.mock_video_target)
    ) &&
    dryRun.mock_execution_only === true &&
    dryRun.image_generation === false &&
    dryRun.video_generation === false;

  const realGeneration =
    dryRun.image_generation === true ||
    dryRun.video_generation === true ||
    dryRun.runtime_execution === true ||
    dryRun.production_mode === true;

  const packageAuditReady =
    testPackage.test_mode === true &&
    testPackage.production_mode === false &&
    testPackage.external_call_allowed === false &&
    testPackage.gpu_execution_allowed === false &&
    testPackage.test_package_ready === 'PASS' &&
    mockOutputOnly &&
    !realGeneration;

  return {
    test_package_id: testPackage.test_package_id,
    test_mode: testPackage.test_mode,
    production_mode: testPackage.production_mode,
    external_call_allowed: testPackage.external_call_allowed,
    gpu_execution_allowed: testPackage.gpu_execution_allowed,
    mock_output_only: mockOutputOnly,
    real_generation: realGeneration,
    mock_execution_plan_ready: testPackage.mock_execution_plan.plan_ready,
    traceability_integrity: testPackage.traceability_chain.trace_integrity,
    package_audit_ready: toStatus(packageAuditReady),
  };
}

function buildMarkdown(report: MovieAnalysisTestModeExecutionAuditReport): string {
  const lines = [
    '# Movie Analysis Test Mode Execution Audit',
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
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| master_certification_verified | ${report.master_certification_verified} |`,
    `| test_execution_ready | ${report.test_execution_ready} |`,
    `| production_execution_blocked | ${report.production_execution_blocked} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| runtime_not_executed | ${report.runtime_not_executed} |`,
    `| mock_output_only | ${report.mock_output_only} |`,
    `| real_generation | ${report.real_generation} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| memory_bindings_preserved | ${report.memory_bindings_preserved} |`,
    `| safe_create_policy_preserved | ${report.safe_create_policy_preserved} |`,
    `| audit_complete | ${report.audit_complete} |`,
    `| test_mode_ready | ${report.test_mode_ready} |`,
    `| execution_simulation_ready | ${report.execution_simulation_ready} |`,
    `| production_still_blocked | ${report.production_still_blocked} |`,
    '',
    '## Test Package Audits',
    ''
  );

  for (const audit of report.test_package_audits) {
    lines.push(
      `- ${audit.test_package_id}: ready=${audit.package_audit_ready} mock_only=${audit.mock_output_only} real_gen=${audit.real_generation}`
    );
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
  issues: TestModeExecutionAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MovieAnalysisTestModeExecutionAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MovieAnalysisTestModeExecutionAuditReport = {
    report_id: 'movie-analysis-test-mode-execution-audit-report-v1',
    phase: TEST_MODE_EXECUTION_AUDIT_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    mock_output_only: true,
    real_generation: false,
    production_engine_master_certification_report_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
    production_engine_master_certification_artifact_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    test_mode_execution_audit_export_dir: TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR,
    test_mode_execution_audit_manifest_path: TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
    test_mode_execution_audit_artifact_path: TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    master_certification_verified: 'FAIL',
    test_execution_ready: 'FAIL',
    production_execution_blocked: 'FAIL',
    external_call_blocked: 'FAIL',
    gpu_execution_blocked: 'FAIL',
    runtime_not_executed: 'FAIL',
    traceability_preserved: false,
    memory_bindings_preserved: 'FAIL',
    safe_create_policy_preserved: toStatus(upstreamUnchanged),
    audit_complete: 'FAIL',
    test_mode_ready: 'FAIL',
    execution_simulation_ready: 'FAIL',
    production_still_blocked: 'FAIL',
    master_certification_missing: true,
    test_execution_not_ready: true,
    production_execution_unblocked: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    runtime_execution_detected: true,
    real_generation_detected: true,
    mock_output_missing: true,
    traceability_loss: true,
    memory_binding_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    test_mode_execution_audit_ready: 'FAIL',
    certification_status: null,
    audit_checks: [],
    test_package_audits: [],
    final_verdict: TEST_MODE_EXECUTION_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisTestModeExecutionAudit(
  projectRoot?: string
): MovieAnalysisTestModeExecutionAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TestModeExecutionAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const masterCertReport = loadJson<Record<string, unknown>>(
    root,
    PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH
  );
  const masterCertArtifactPath = path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH);

  if (
    !masterCertReport ||
    masterCertReport.final_verdict !== PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT ||
    masterCertReport.certification_status !== PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS ||
    masterCertReport.test_execution_ready !== true ||
    masterCertReport.production_execution_blocked !== true ||
    !fs.existsSync(masterCertArtifactPath)
  ) {
    issues.push({
      code: 'MASTER_CERTIFICATION_MISSING',
      message: `Required ${PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT} with ${PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS}, test_execution_ready=true, production_execution_blocked=true`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const masterCertArtifact = loadJson<ProductionEngineMasterCertificationArtifact>(
    root,
    PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH
  );

  if (
    !masterCertArtifact ||
    masterCertArtifact.master_certification_complete !== true ||
    masterCertArtifact.test_execution_ready !== true ||
    masterCertArtifact.production_execution_blocked !== true
  ) {
    issues.push({
      code: 'MASTER_CERTIFICATION_NOT_READY',
      message: 'Master certification artifact readiness requirements not met',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const testModeArtifact = loadJson<TestModeExecutionPackageArtifact>(
    root,
    TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH
  );
  const runtimeCertArtifact = loadJson<{
    runtime_not_executed: boolean;
    test_mode_allowed: boolean;
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
    safety_flags: {
      runtime_execution: boolean;
      video_generation: boolean;
      image_generation: boolean;
      external_call_allowed: boolean;
      gpu_execution: boolean;
    };
  }>(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);

  const foundationArtifact = loadJson<{
    memory_bindings: Array<{ binding_id: string; binding_ready: AuditStatus }>;
  }>(root, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH);

  if (!testModeArtifact || !runtimeCertArtifact || !foundationArtifact) {
    issues.push({
      code: 'UPSTREAM_ARTIFACT_MISSING',
      message: 'Missing test mode execution package, runtime certification, or foundation artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const testPackageAudits = testModeArtifact.test_packages.map((testPackage) =>
    auditTestPackage(testPackage)
  );

  for (const audit of testPackageAudits) {
    if (audit.package_audit_ready === 'FAIL') {
      issues.push({
        code: 'TEST_PACKAGE_AUDIT_FAILURE',
        message: `Test package audit failed for ${audit.test_package_id}`,
        severity: 'error',
        test_package_id: audit.test_package_id,
      });
    }
  }

  const masterCertificationVerified =
    masterCertArtifact.master_certification_complete === true &&
    masterCertReport.production_engine_master_certification_ready === 'PASS';

  const testExecutionReady =
    masterCertArtifact.test_execution_ready === true &&
    masterCertReport.test_execution_ready === true &&
    testModeArtifact.test_package_complete === true &&
    testPackageAudits.every((audit) => audit.package_audit_ready === 'PASS');

  const productionExecutionBlocked =
    masterCertArtifact.production_execution_blocked === true &&
    masterCertReport.production_execution_blocked === true &&
    runtimeCertArtifact.production_mode_blocked === true &&
    testPackageAudits.every(
      (audit) => audit.production_mode === false && audit.test_mode === true
    );

  const externalCallBlocked =
    runtimeCertArtifact.no_external_calls === true &&
    runtimeCertArtifact.safety_flags.external_call_allowed === false &&
    testPackageAudits.every((audit) => audit.external_call_allowed === false) &&
    testModeArtifact.test_packages.every(
      (testPackage) => testPackage.dry_run_flags.external_call_allowed === false
    );

  const gpuExecutionBlocked =
    runtimeCertArtifact.no_gpu_execution === true &&
    runtimeCertArtifact.safety_flags.gpu_execution === false &&
    testPackageAudits.every((audit) => audit.gpu_execution_allowed === false) &&
    testModeArtifact.test_packages.every(
      (testPackage) => testPackage.dry_run_flags.gpu_execution_allowed === false
    );

  const runtimeNotExecuted =
    runtimeCertArtifact.runtime_not_executed === true &&
    runtimeCertArtifact.safety_flags.runtime_execution === false &&
    testModeArtifact.test_packages.every(
      (testPackage) => testPackage.dry_run_flags.runtime_execution === false
    );

  const mockOutputOnly =
    testPackageAudits.every((audit) => audit.mock_output_only === true) &&
    testPackageAudits.every((audit) => audit.mock_execution_plan_ready === 'PASS') &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.mock_execution_plan.plan_ready === 'PASS' &&
        testPackage.mock_execution_plan.entries.length === testPackage.test_units.length
    );

  const realGenerationDetected =
    testPackageAudits.some((audit) => audit.real_generation === true) ||
    runtimeCertArtifact.real_generation_blocked !== true ||
    runtimeCertArtifact.safety_flags.video_generation === true ||
    runtimeCertArtifact.safety_flags.image_generation === true;

  const runtimeExecutionDetected =
    !runtimeNotExecuted ||
    testModeArtifact.test_packages.some(
      (testPackage) =>
        testPackage.dry_run_flags.runtime_execution === true ||
        testPackage.dry_run_flags.no_execution === false
    );

  const traceabilityPreserved =
    masterCertArtifact.traceability_preserved === true &&
    testPackageAudits.every((audit) => audit.traceability_integrity === 'PASS') &&
    testModeArtifact.test_packages.every(
      (testPackage) => testPackage.traceability_chain.trace_integrity === 'PASS'
    );

  const memoryBindingsPreserved =
    foundationArtifact.memory_bindings.length === PRODUCTION_MEMORY_BINDING_COUNT &&
    foundationArtifact.memory_bindings.every((binding) => binding.binding_ready === 'PASS');

  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyPreserved = upstreamArtifactsUnchanged;

  const testModeReady =
    testExecutionReady &&
    testPackageAudits.every((audit) => audit.test_mode === true) &&
    runtimeCertArtifact.test_mode_allowed === true;

  const executionSimulationReady =
    mockOutputOnly &&
    testModeReady &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.test_execution_queue.length === testPackage.test_units.length &&
        testPackage.mock_execution_plan.plan_ready === 'PASS'
    );

  const productionStillBlocked = productionExecutionBlocked && !realGenerationDetected;

  const auditComplete =
    masterCertificationVerified &&
    testExecutionReady &&
    productionExecutionBlocked &&
    externalCallBlocked &&
    gpuExecutionBlocked &&
    runtimeNotExecuted &&
    mockOutputOnly &&
    !realGenerationDetected &&
    !runtimeExecutionDetected &&
    traceabilityPreserved &&
    memoryBindingsPreserved &&
    safeCreatePolicyPreserved &&
    testModeReady &&
    executionSimulationReady &&
    productionStillBlocked;

  const masterCertificationMissing = !masterCertificationVerified;
  const testExecutionNotReady = !testExecutionReady;
  const productionExecutionUnblocked = !productionExecutionBlocked;
  const externalCallEnabled = !externalCallBlocked;
  const gpuExecutionEnabled = !gpuExecutionBlocked;
  const runtimeExecutionDetectedFlag = runtimeExecutionDetected;
  const realGenerationDetectedFlag = realGenerationDetected;
  const mockOutputMissing = !mockOutputOnly;
  const traceabilityLoss = !traceabilityPreserved;
  const memoryBindingLoss = !memoryBindingsPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyPreserved;

  if (masterCertificationMissing) {
    issues.push({
      code: 'MASTER_CERTIFICATION_MISSING',
      message: 'Master certification is not verified',
      severity: 'error',
    });
  }
  if (testExecutionNotReady) {
    issues.push({
      code: 'TEST_EXECUTION_NOT_READY',
      message: 'Test execution is not ready',
      severity: 'error',
    });
  }
  if (productionExecutionUnblocked) {
    issues.push({
      code: 'PRODUCTION_EXECUTION_UNBLOCKED',
      message: 'Production execution is not blocked',
      severity: 'error',
    });
  }
  if (externalCallEnabled) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'External calls are not blocked',
      severity: 'error',
    });
  }
  if (gpuExecutionEnabled) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'GPU execution is not blocked',
      severity: 'error',
    });
  }
  if (runtimeExecutionDetectedFlag) {
    issues.push({
      code: 'RUNTIME_EXECUTION_DETECTED',
      message: 'Runtime execution was detected in test mode packages',
      severity: 'error',
    });
  }
  if (realGenerationDetectedFlag) {
    issues.push({
      code: 'REAL_GENERATION_DETECTED',
      message: 'Real generation flags were detected',
      severity: 'error',
    });
  }
  if (mockOutputMissing) {
    issues.push({
      code: 'MOCK_OUTPUT_MISSING',
      message: 'Mock output plan is incomplete',
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
  if (memoryBindingLoss) {
    issues.push({
      code: 'MEMORY_BINDING_LOSS',
      message: 'Memory bindings are not preserved',
      severity: 'error',
    });
  }
  if (safeCreatePolicyViolation) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Upstream artifacts were modified during test mode execution audit',
      severity: 'error',
    });
  }

  const auditChecks: TestModeExecutionAuditCheck[] = [
    {
      check_id: 'master_certification_verified',
      check_label: 'Master Certification Verified',
      status: toStatus(masterCertificationVerified),
    },
    {
      check_id: 'test_execution_ready',
      check_label: 'Test Execution Ready',
      status: toStatus(testExecutionReady),
    },
    {
      check_id: 'production_execution_blocked',
      check_label: 'Production Execution Blocked',
      status: toStatus(productionExecutionBlocked),
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
      check_id: 'runtime_not_executed',
      check_label: 'Runtime Not Executed',
      status: toStatus(runtimeNotExecuted),
    },
    {
      check_id: 'mock_output_only',
      check_label: 'Mock Output Only',
      status: toStatus(mockOutputOnly),
    },
    {
      check_id: 'real_generation',
      check_label: 'Real Generation Disabled',
      status: toStatus(!realGenerationDetected),
    },
    {
      check_id: 'traceability_preserved',
      check_label: 'Traceability Preserved',
      status: toStatus(traceabilityPreserved),
    },
    {
      check_id: 'memory_bindings_preserved',
      check_label: 'Memory Bindings Preserved',
      status: toStatus(memoryBindingsPreserved),
    },
    {
      check_id: 'safe_create_policy_preserved',
      check_label: 'Safe Create Policy Preserved',
      status: toStatus(safeCreatePolicyPreserved),
    },
  ];

  const pass = auditComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: TestModeExecutionAuditArtifact = {
    audit_id: 'test-mode-execution-audit-v1',
    phase: TEST_MODE_EXECUTION_AUDIT_PHASE,
    generated_at: timestamp,
    production_engine_master_certification_artifact_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    audit_checks: auditChecks,
    test_package_audits: testPackageAudits,
    mock_output_only: true,
    real_generation: false,
    runtime_not_executed: runtimeNotExecuted,
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: memoryBindingsPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    audit_complete: auditComplete,
    test_mode_ready: testModeReady,
    execution_simulation_ready: executionSimulationReady,
    production_still_blocked: productionStillBlocked,
  };

  const manifest: MovieAnalysisTestModeExecutionAuditManifest = {
    manifest_id: 'movie-analysis-test-mode-execution-audit-manifest-v1',
    phase: TEST_MODE_EXECUTION_AUDIT_PHASE,
    generated_at: timestamp,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    master_certification_verified: toStatus(masterCertificationVerified),
    test_execution_ready: toStatus(testExecutionReady),
    production_execution_blocked: toStatus(productionExecutionBlocked),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    runtime_not_executed: toStatus(runtimeNotExecuted),
    mock_output_only: true,
    real_generation: false,
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_preserved: toStatus(safeCreatePolicyPreserved),
    audit_complete: toStatus(auditComplete),
    test_mode_ready: toStatus(testModeReady),
    execution_simulation_ready: toStatus(executionSimulationReady),
    production_still_blocked: toStatus(productionStillBlocked),
    certification_status: pass ? TEST_MODE_EXECUTION_AUDIT_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisTestModeExecutionAuditReport = {
    report_id: 'movie-analysis-test-mode-execution-audit-report-v1',
    phase: TEST_MODE_EXECUTION_AUDIT_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    mock_output_only: true,
    real_generation: false,
    production_engine_master_certification_report_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
    production_engine_master_certification_artifact_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    test_mode_execution_audit_export_dir: TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR,
    test_mode_execution_audit_manifest_path: TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
    test_mode_execution_audit_artifact_path: TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    master_certification_verified: toStatus(masterCertificationVerified),
    test_execution_ready: toStatus(testExecutionReady),
    production_execution_blocked: toStatus(productionExecutionBlocked),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    runtime_not_executed: toStatus(runtimeNotExecuted),
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_preserved: toStatus(safeCreatePolicyPreserved),
    audit_complete: toStatus(auditComplete),
    test_mode_ready: toStatus(testModeReady),
    execution_simulation_ready: toStatus(executionSimulationReady),
    production_still_blocked: toStatus(productionStillBlocked),
    master_certification_missing: masterCertificationMissing,
    test_execution_not_ready: testExecutionNotReady,
    production_execution_unblocked: productionExecutionUnblocked,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    runtime_execution_detected: runtimeExecutionDetectedFlag,
    real_generation_detected: realGenerationDetectedFlag,
    mock_output_missing: mockOutputMissing,
    traceability_loss: traceabilityLoss,
    memory_binding_loss: memoryBindingLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    test_mode_execution_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? TEST_MODE_EXECUTION_AUDIT_READY_STATUS : null,
    audit_checks: auditChecks,
    test_package_audits: testPackageAudits,
    final_verdict: pass
      ? TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT
      : TEST_MODE_EXECUTION_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
