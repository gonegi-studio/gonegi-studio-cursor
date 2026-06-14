import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import type { FailureRecoveryPlan, MvRuntimeTraceability } from './mvProductionRuntimeEngine.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
  type MvTestExecutionPackage,
  type MvTestExecutionPackageArtifact,
} from './mvTestExecutionPackage.js';
import {
  MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS,
  type MvTestExecutionCertificationResult,
  type MvTestModeExecutionCertificationArtifact,
} from './mvTestModeExecutionCertification.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_TEST_MODE_DRY_RUN_PHASE = 'PHASE-DIGITAL-STUDIO-011-MV_TEST_MODE_DRY_RUN_V1' as const;
export const MV_TEST_MODE_DRY_RUN_PASS_VERDICT = 'PASS_MV_TEST_MODE_DRY_RUN_V1' as const;
export const MV_TEST_MODE_DRY_RUN_FAIL_VERDICT = 'FAIL_MV_TEST_MODE_DRY_RUN_V1' as const;
export const MV_TEST_MODE_DRY_RUN_READY_STATUS = 'MV_TEST_MODE_DRY_RUN_READY' as const;
export const MV_TEST_MODE_DRY_RUN_DIR = 'reports/mv_test_mode_dry_run' as const;
export const MV_TEST_MODE_DRY_RUN_REPORT_PATH =
  'reports/mv_test_mode_dry_run/mv-test-mode-dry-run-report.json' as const;
export const MV_TEST_MODE_DRY_RUN_MD_PATH =
  'reports/mv_test_mode_dry_run/MV_TEST_MODE_DRY_RUN.md' as const;
export const MV_TEST_MODE_DRY_RUN_EXPORT_DIR = 'exports/mv_test_mode_dry_run' as const;
export const MV_TEST_MODE_DRY_RUN_MANIFEST_PATH =
  'exports/mv_test_mode_dry_run/mv-test-mode-dry-run-manifest.json' as const;
export const MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH =
  'exports/mv_test_mode_dry_run/mv-test-mode-dry-run.json' as const;

export const DRY_RUN_ARTIFACT_WRITE_SCOPE = 'exports/mv_test_mode_dry_run/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type DryRunStatus = 'PASS' | 'FAIL';

export type MvTestModeDryRunIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type DryRunCheck = {
  check_id: string;
  check_label: string;
  status: DryRunStatus;
};

export type MvDryRunExecutionStep = {
  step_index: number;
  unit_id: string;
  shot_id: string;
  stage: 'image' | 'video' | 'consistency' | 'quality_gate';
  mock_image_output_ref: string;
  mock_video_output_ref: string;
  mock_image_output: string;
  mock_video_output: string;
  simulation_step: string;
  mock_output_only: true;
  execution_allowed: false;
  step_completed: DryRunStatus;
};

export type MvDryRunExecutionPlan = {
  plan_id: string;
  step_count: number;
  steps: MvDryRunExecutionStep[];
  queue_simulated: boolean;
  plan_valid: boolean;
};

export type MvTestModeDryRunResult = {
  source_execution_certification_ref: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  dry_run_id: string;
  mv_type: MvType;
  mv_test_execution_package_id: string;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  mock_output_only: true;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  production_mode_blocked: true;
  dry_run_execution_plan: MvDryRunExecutionPlan;
  failure_recovery_plan: FailureRecoveryPlan;
  traceability_chain: MvRuntimeTraceability;
  dry_run_ready: DryRunStatus;
  dry_run_completed: DryRunStatus;
};

export type MvTestModeDryRunArtifact = {
  dry_run_bundle_id: string;
  phase: typeof MV_TEST_MODE_DRY_RUN_PHASE;
  generated_at: string;
  source_execution_certification_ref: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  certification_id: string;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  mock_output_only: true;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  production_mode_blocked: true;
  mv_test_mode_dry_runs: MvTestModeDryRunResult[];
  safety_flags: {
    planning_only: true;
    test_mode: true;
    mock_execution_only: true;
    mock_output_only: true;
    dry_run_simulation: true;
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
  execution_certification_consumed: boolean;
  traceability_preserved: boolean;
  mock_output_count: number;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    dry_run_artifact_write_scope: typeof DRY_RUN_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  dry_run_complete: boolean;
  next_stage_ready: boolean;
};

export type MvTestModeDryRunManifest = {
  manifest_id: string;
  phase: typeof MV_TEST_MODE_DRY_RUN_PHASE;
  generated_at: string;
  dry_run_count: typeof MV_TYPE_COUNT;
  execution_certification_consumed: DryRunStatus;
  dry_run_ready: DryRunStatus;
  dry_run_completed: DryRunStatus;
  mock_output_verified: DryRunStatus;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: DryRunStatus;
  gpu_execution_blocked: DryRunStatus;
  production_mode_blocked: DryRunStatus;
  dry_run_execution_plan_valid: DryRunStatus;
  failure_recovery_ready: DryRunStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: DryRunStatus;
  next_stage_ready: DryRunStatus;
  certification_status: typeof MV_TEST_MODE_DRY_RUN_READY_STATUS | null;
};

export type MvTestModeDryRunReport = {
  report_id: string;
  phase: typeof MV_TEST_MODE_DRY_RUN_PHASE;
  timestamp: string;
  planning_only: true;
  mock_execution_only: true;
  dry_run_simulation: true;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  mock_output_only: true;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  production_mode_blocked: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  source_execution_certification_ref: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  mv_test_mode_execution_certification_report_path: typeof MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH;
  mv_test_mode_dry_run_export_dir: typeof MV_TEST_MODE_DRY_RUN_EXPORT_DIR;
  mv_test_mode_dry_run_manifest_path: typeof MV_TEST_MODE_DRY_RUN_MANIFEST_PATH;
  mv_test_mode_dry_run_artifact_path: typeof MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  dry_run_count: typeof MV_TYPE_COUNT;
  mock_output_count: number;
  execution_certification_consumed: DryRunStatus;
  dry_run_ready: DryRunStatus;
  dry_run_completed: DryRunStatus;
  mock_output_verified: DryRunStatus;
  dry_run_execution_plan_valid: DryRunStatus;
  failure_recovery_ready: DryRunStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: DryRunStatus;
  next_stage_ready: DryRunStatus;
  execution_certification_missing: boolean;
  dry_run_not_ready: boolean;
  mock_output_missing: boolean;
  test_mode_disabled: boolean;
  real_generation_enabled: boolean;
  runtime_execution_detected: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  production_mode_unblocked: boolean;
  dry_run_execution_plan_invalid: boolean;
  failure_recovery_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_test_mode_dry_run_ready: DryRunStatus;
  certification_status: typeof MV_TEST_MODE_DRY_RUN_READY_STATUS | null;
  mv_test_mode_dry_runs: MvTestModeDryRunResult[];
  dry_run_checks: DryRunCheck[];
  final_verdict: typeof MV_TEST_MODE_DRY_RUN_PASS_VERDICT | typeof MV_TEST_MODE_DRY_RUN_FAIL_VERDICT;
  issues: MvTestModeDryRunIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH] as const;

const DRY_RUN_EXPORT_WRITE_PATHS = [
  MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_TEST_MODE_DRY_RUN_DIR,
  MV_TEST_MODE_DRY_RUN_EXPORT_DIR,
  MV_TEST_MODE_DRY_RUN_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_MD_PATH,
  ...DRY_RUN_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): DryRunStatus {
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

function isUnderDryRunWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(DRY_RUN_ARTIFACT_WRITE_SCOPE) ||
    relativePath === DRY_RUN_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function isMockOutput(value: string): boolean {
  return value.startsWith('mock_output_') || value.startsWith('mock_');
}

function mockOutputRef(
  mvType: MvType,
  unitId: string,
  kind: 'image' | 'video'
): string {
  return `${DRY_RUN_ARTIFACT_WRITE_SCOPE}mock_outputs/${mvType}/${unitId}/mock_${kind}.json`;
}

function simulateDryRun(
  certification: MvTestExecutionCertificationResult,
  testPackage: MvTestExecutionPackage
): MvTestModeDryRunResult {
  const steps: MvDryRunExecutionStep[] = testPackage.test_execution_queue.map((queueEntry) => {
    const unit = testPackage.test_execution_units.find(
      (entry) => entry.unit_id === queueEntry.unit_id
    );
    const mockEntry = testPackage.mock_execution_plan.entries.find(
      (entry) => entry.unit_id === queueEntry.unit_id
    );

    const stepCompleted =
      unit !== undefined &&
      unit.unit_ready === 'PASS' &&
      isMockOutput(unit.mock_image_output) &&
      isMockOutput(unit.mock_video_output) &&
      queueEntry.mock_execution_only === true &&
      queueEntry.execution_allowed === false &&
      mockEntry?.mock_ready === 'PASS';

    return {
      step_index: queueEntry.queue_index,
      unit_id: queueEntry.unit_id,
      shot_id: queueEntry.shot_id,
      stage: queueEntry.stage,
      mock_image_output_ref: mockOutputRef(testPackage.mv_type, queueEntry.unit_id, 'image'),
      mock_video_output_ref: mockOutputRef(testPackage.mv_type, queueEntry.unit_id, 'video'),
      mock_image_output: unit?.mock_image_output ?? '',
      mock_video_output: unit?.mock_video_output ?? '',
      simulation_step: mockEntry?.mock_step ?? `dry_run_${queueEntry.unit_id}_${queueEntry.stage}`,
      mock_output_only: true,
      execution_allowed: false,
      step_completed: toStatus(stepCompleted),
    };
  });

  const queueSimulated =
    steps.length === testPackage.test_execution_units.length * 4 &&
    testPackage.test_execution_queue.every(
      (entry) => entry.mock_execution_only === true && entry.execution_allowed === false
    );

  const planValid =
    queueSimulated && steps.length > 0 && steps.every((step) => step.step_completed === 'PASS');

  const failureRecoveryReady =
    testPackage.failure_recovery_plan.recovery_ready &&
    testPackage.failure_recovery_plan.steps.every((step) => step.recovery_ready === 'PASS');

  const dryRunReady =
    certification.test_execution_certified === 'PASS' &&
    testPackage.test_execution_package_ready === 'PASS' &&
    certification.mock_output_only === true &&
    certification.test_mode_allowed === true &&
    certification.real_generation_blocked === true &&
    certification.runtime_not_executed === true &&
    planValid &&
    failureRecoveryReady &&
    certification.traceability_chain.trace_integrity === 'PASS';

  const dryRunCompleted =
    dryRunReady && steps.every((step) => step.step_completed === 'PASS');

  return {
    source_execution_certification_ref: MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    dry_run_id: `${testPackage.mv_type}_test_mode_dry_run_v1`,
    mv_type: testPackage.mv_type,
    mv_test_execution_package_id: testPackage.mv_test_execution_package_id,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    mock_output_only: true,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    dry_run_execution_plan: {
      plan_id: `${testPackage.mv_type}_dry_run_execution_plan_v1`,
      step_count: steps.length,
      steps,
      queue_simulated: queueSimulated,
      plan_valid: planValid,
    },
    failure_recovery_plan: testPackage.failure_recovery_plan,
    traceability_chain: certification.traceability_chain,
    dry_run_ready: toStatus(dryRunReady),
    dry_run_completed: toStatus(dryRunCompleted),
  };
}

function buildMarkdown(report: MvTestModeDryRunReport): string {
  const lines = [
    '# MV Test Mode Dry Run',
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
    `**Source Execution Certification:** ${report.source_execution_certification_ref}`,
    `**Execution Scope:** ${report.execution_scope}`,
    '',
    '## Flow',
    '',
    'DS-010 Execution Certification → DS-011 Dry Run → DS-012 Dry Run Certification → DS-013 Final Audit',
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| execution_certification_consumed | ${report.execution_certification_consumed} |`,
    `| dry_run_ready | ${report.dry_run_ready} |`,
    `| dry_run_completed | ${report.dry_run_completed} |`,
    `| mock_output_verified | ${report.mock_output_verified} |`,
    `| test_mode_allowed | ${report.test_mode_allowed} |`,
    `| real_generation_blocked | ${report.real_generation_blocked} |`,
    `| runtime_not_executed | ${report.runtime_not_executed} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    `| dry_run_execution_plan_valid | ${report.dry_run_execution_plan_valid} |`,
    `| failure_recovery_ready | ${report.failure_recovery_ready} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| next_stage_ready | ${report.next_stage_ready} |`,
    '',
    '## Dry Run Results',
    ''
  );

  for (const dryRun of report.mv_test_mode_dry_runs) {
    lines.push(
      `- ${dryRun.dry_run_id} (${dryRun.mv_type}): steps=${dryRun.dry_run_execution_plan.step_count} ready=${dryRun.dry_run_ready} completed=${dryRun.dry_run_completed}`
    );
  }

  lines.push('', '## Dry Run Checks', '');
  for (const check of report.dry_run_checks) {
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
  issues: MvTestModeDryRunIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvTestModeDryRunReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvTestModeDryRunReport = {
    report_id: 'mv-test-mode-dry-run-report-v1',
    phase: MV_TEST_MODE_DRY_RUN_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    dry_run_simulation: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    mock_output_only: true,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_execution_certification_ref: MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    mv_test_mode_execution_certification_report_path: MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
    mv_test_mode_dry_run_export_dir: MV_TEST_MODE_DRY_RUN_EXPORT_DIR,
    mv_test_mode_dry_run_manifest_path: MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
    mv_test_mode_dry_run_artifact_path: MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    dry_run_count: MV_TYPE_COUNT,
    mock_output_count: 0,
    execution_certification_consumed: 'FAIL',
    dry_run_ready: 'FAIL',
    dry_run_completed: 'FAIL',
    mock_output_verified: 'FAIL',
    dry_run_execution_plan_valid: 'FAIL',
    failure_recovery_ready: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: 'FAIL',
    next_stage_ready: 'FAIL',
    execution_certification_missing: true,
    dry_run_not_ready: true,
    mock_output_missing: true,
    test_mode_disabled: true,
    real_generation_enabled: true,
    runtime_execution_detected: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    production_mode_unblocked: true,
    dry_run_execution_plan_invalid: true,
    failure_recovery_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: true,
    mv_test_mode_dry_run_ready: 'FAIL',
    certification_status: null,
    mv_test_mode_dry_runs: [],
    dry_run_checks: [],
    final_verdict: MV_TEST_MODE_DRY_RUN_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message:
              'Execution certification artifact was modified during test mode dry run write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_DRY_RUN_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvTestModeDryRun(projectRoot?: string): MvTestModeDryRunReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvTestModeDryRunIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const certificationReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_test_mode_execution_certification_ready: DryRunStatus;
    test_execution_certified: DryRunStatus;
    dry_run_allowed: DryRunStatus;
    next_stage_ready: DryRunStatus;
    traceability_preserved: boolean;
  }>(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH);
  const certificationArtifact = loadJson<MvTestModeExecutionCertificationArtifact>(
    root,
    MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH
  );

  const certificationPrecheckValid =
    certificationReport !== null &&
    certificationReport.final_verdict === MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT &&
    certificationReport.certification_status === MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS &&
    certificationReport.mv_test_mode_execution_certification_ready === 'PASS' &&
    certificationReport.test_execution_certified === 'PASS' &&
    certificationReport.dry_run_allowed === 'PASS' &&
    certificationArtifact !== null &&
    certificationArtifact.execution_certification_complete === true &&
    certificationArtifact.dry_run_allowed === true;

  if (!certificationPrecheckValid) {
    issues.push({
      code: 'EXECUTION_CERTIFICATION_PRECHECK_FAILED',
      message: `Required ${MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT} with ${MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const testPackageArtifact = loadJson<MvTestExecutionPackageArtifact>(
    root,
    MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH
  );

  if (!testPackageArtifact || testPackageArtifact.mv_test_execution_packages.length === 0) {
    issues.push({
      code: 'TEST_EXECUTION_PACKAGE_MISSING',
      message: `Missing read-only test execution package artifact ${MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH}`,
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

  const dryRunResults: MvTestModeDryRunResult[] = [];

  for (const certification of certificationArtifact.mv_test_execution_certifications) {
    const testPackage = testPackageArtifact.mv_test_execution_packages.find(
      (pkg) => pkg.mv_type === certification.mv_type
    );

    if (!testPackage) {
      issues.push({
        code: 'EXECUTION_CERTIFICATION_MISSING',
        message: `Missing test execution package for ${certification.mv_type}`,
        severity: 'error',
        mv_type: certification.mv_type,
      });
      continue;
    }

    const dryRun = simulateDryRun(certification, testPackage);
    dryRunResults.push(dryRun);

    if (dryRun.dry_run_ready === 'FAIL' || dryRun.dry_run_completed === 'FAIL') {
      issues.push({
        code: 'DRY_RUN_NOT_READY',
        message: `Dry run failed for ${dryRun.dry_run_id}`,
        severity: 'error',
        mv_type: dryRun.mv_type,
      });
    }
  }

  const executionCertificationConsumed =
    certificationArtifact.execution_audit_consumed === true &&
    certificationArtifact.execution_certification_complete === true &&
    dryRunResults.every(
      (dryRun) =>
        dryRun.source_execution_certification_ref ===
        MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH
    );

  const dryRunReady = dryRunResults.every((dryRun) => dryRun.dry_run_ready === 'PASS');
  const dryRunCompleted = dryRunResults.every((dryRun) => dryRun.dry_run_completed === 'PASS');
  const mockOutputVerified = dryRunResults.every(
    (dryRun) =>
      dryRun.mock_output_only === true &&
      dryRun.dry_run_execution_plan.steps.every(
        (step) =>
          step.mock_output_only === true &&
          isMockOutput(step.mock_image_output) &&
          isMockOutput(step.mock_video_output)
      )
  );
  const testModeAllowed = true as const;
  const realGenerationBlocked = true as const;
  const runtimeNotExecuted =
    certificationArtifact.runtime_not_executed === true &&
    certificationArtifact.safety_flags.runtime_execution === false &&
    dryRunResults.every((dryRun) => dryRun.runtime_not_executed === true);
  const externalCallBlockedFlag =
    certificationArtifact.safety_flags.external_call_allowed === false &&
    dryRunResults.every((dryRun) => dryRun.external_call_blocked === true);
  const gpuExecutionBlockedFlag =
    certificationArtifact.safety_flags.gpu_execution === false &&
    dryRunResults.every((dryRun) => dryRun.gpu_execution_blocked === true);
  const productionModeBlockedFlag =
    upstreamRuntimeCertArtifact.production_mode_blocked === true &&
    upstreamRuntimeCertArtifact.real_generation_blocked === true &&
    upstreamRuntimeCertArtifact.no_external_calls === true &&
    upstreamRuntimeCertArtifact.no_gpu_execution === true &&
    certificationArtifact.safety_flags.production_mode_blocked === true &&
    dryRunResults.every((dryRun) => dryRun.production_mode_blocked === true);
  const dryRunExecutionPlanValid = dryRunResults.every(
    (dryRun) => dryRun.dry_run_execution_plan.plan_valid
  );
  const failureRecoveryReady = dryRunResults.every(
    (dryRun) =>
      dryRun.failure_recovery_plan.recovery_ready &&
      dryRun.failure_recovery_plan.steps.every((step) => step.recovery_ready === 'PASS')
  );
  const traceabilityPreserved =
    certificationArtifact.traceability_preserved === true &&
    dryRunResults.every((dryRun) => dryRun.traceability_chain.trace_integrity === 'PASS');

  const dryRunWriteScopeValid = DRY_RUN_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderDryRunWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && dryRunWriteScopeValid;

  const mockOutputCount = dryRunResults.reduce(
    (total, dryRun) => total + dryRun.dry_run_execution_plan.step_count,
    0
  );

  const nextStageReady =
    executionCertificationConsumed &&
    dryRunReady &&
    dryRunCompleted &&
    mockOutputVerified &&
    testModeAllowed === true &&
    realGenerationBlocked === true &&
    runtimeNotExecuted &&
    externalCallBlockedFlag &&
    gpuExecutionBlockedFlag &&
    productionModeBlockedFlag &&
    dryRunExecutionPlanValid &&
    failureRecoveryReady &&
    traceabilityPreserved &&
    safeCreatePolicyVerified;

  const dryRunComplete = nextStageReady;

  const executionCertificationMissing = !executionCertificationConsumed;
  const dryRunNotReady = !dryRunReady;
  const mockOutputMissing = !mockOutputVerified;
  const testModeDisabled = testModeAllowed !== true;
  const realGenerationEnabled = realGenerationBlocked !== true;
  const runtimeExecutionDetected = !runtimeNotExecuted;
  const externalCallEnabled = !externalCallBlockedFlag;
  const gpuExecutionEnabled = !gpuExecutionBlockedFlag;
  const productionModeUnblocked = !productionModeBlockedFlag;
  const dryRunExecutionPlanInvalid = !dryRunExecutionPlanValid;
  const failureRecoveryMissing = !failureRecoveryReady;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  if (executionCertificationMissing) {
    issues.push({
      code: 'EXECUTION_CERTIFICATION_MISSING',
      message: 'Execution certification was not consumed',
      severity: 'error',
    });
  }
  if (dryRunNotReady) {
    issues.push({
      code: 'DRY_RUN_NOT_READY',
      message: 'One or more dry runs are not ready',
      severity: 'error',
    });
  }
  if (!dryRunCompleted) {
    issues.push({
      code: 'DRY_RUN_NOT_COMPLETED',
      message: 'One or more dry runs did not complete',
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
  if (productionModeUnblocked) {
    issues.push({
      code: 'PRODUCTION_MODE_UNBLOCKED',
      message: 'Production mode is not blocked',
      severity: 'error',
    });
  }
  if (dryRunExecutionPlanInvalid) {
    issues.push({
      code: 'DRY_RUN_EXECUTION_PLAN_INVALID',
      message: 'Dry run execution plan is invalid',
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
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability chain is not preserved',
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

  const dryRunChecks: DryRunCheck[] = [
    {
      check_id: 'execution_certification_consumed',
      check_label: 'Execution Certification Consumed',
      status: toStatus(executionCertificationConsumed),
    },
    {
      check_id: 'dry_run_ready',
      check_label: 'Dry Run Ready',
      status: toStatus(dryRunReady),
    },
    {
      check_id: 'dry_run_completed',
      check_label: 'Dry Run Completed',
      status: toStatus(dryRunCompleted),
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
      check_id: 'production_mode_blocked',
      check_label: 'Production Mode Blocked',
      status: toStatus(productionModeBlockedFlag),
    },
    {
      check_id: 'dry_run_execution_plan_valid',
      check_label: 'Dry Run Execution Plan Valid',
      status: toStatus(dryRunExecutionPlanValid),
    },
    {
      check_id: 'failure_recovery_ready',
      check_label: 'Failure Recovery Ready',
      status: toStatus(failureRecoveryReady),
    },
    {
      check_id: 'traceability_preserved',
      check_label: 'Traceability Preserved',
      status: toStatus(traceabilityPreserved),
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

  const pass = dryRunComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvTestModeDryRunArtifact = {
    dry_run_bundle_id: 'mv-test-mode-dry-run-v1',
    phase: MV_TEST_MODE_DRY_RUN_PHASE,
    generated_at: timestamp,
    source_execution_certification_ref: MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    certification_id: certificationArtifact.certification_id,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    mock_output_only: true,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    mv_test_mode_dry_runs: dryRunResults,
    safety_flags: {
      planning_only: true,
      test_mode: true,
      mock_execution_only: true,
      mock_output_only: true,
      dry_run_simulation: true,
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
    execution_certification_consumed: executionCertificationConsumed,
    traceability_preserved: traceabilityPreserved,
    mock_output_count: mockOutputCount,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      dry_run_artifact_write_scope: DRY_RUN_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    dry_run_complete: dryRunComplete,
    next_stage_ready: nextStageReady,
  };

  const manifest: MvTestModeDryRunManifest = {
    manifest_id: 'mv-test-mode-dry-run-manifest-v1',
    phase: MV_TEST_MODE_DRY_RUN_PHASE,
    generated_at: timestamp,
    dry_run_count: MV_TYPE_COUNT,
    execution_certification_consumed: toStatus(executionCertificationConsumed),
    dry_run_ready: toStatus(dryRunReady),
    dry_run_completed: toStatus(dryRunCompleted),
    mock_output_verified: toStatus(mockOutputVerified),
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: toStatus(externalCallBlockedFlag),
    gpu_execution_blocked: toStatus(gpuExecutionBlockedFlag),
    production_mode_blocked: toStatus(productionModeBlockedFlag),
    dry_run_execution_plan_valid: toStatus(dryRunExecutionPlanValid),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_TEST_MODE_DRY_RUN_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_DRY_RUN_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvTestModeDryRunReport = {
    report_id: 'mv-test-mode-dry-run-report-v1',
    phase: MV_TEST_MODE_DRY_RUN_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    dry_run_simulation: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    mock_output_only: true,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_execution_certification_ref: MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    mv_test_mode_execution_certification_report_path: MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
    mv_test_mode_dry_run_export_dir: MV_TEST_MODE_DRY_RUN_EXPORT_DIR,
    mv_test_mode_dry_run_manifest_path: MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
    mv_test_mode_dry_run_artifact_path: MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    dry_run_count: MV_TYPE_COUNT,
    mock_output_count: mockOutputCount,
    execution_certification_consumed: toStatus(executionCertificationConsumed),
    dry_run_ready: toStatus(dryRunReady),
    dry_run_completed: toStatus(dryRunCompleted),
    mock_output_verified: toStatus(mockOutputVerified),
    dry_run_execution_plan_valid: toStatus(dryRunExecutionPlanValid),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    execution_certification_missing: executionCertificationMissing,
    dry_run_not_ready: dryRunNotReady,
    mock_output_missing: mockOutputMissing,
    test_mode_disabled: testModeDisabled,
    real_generation_enabled: realGenerationEnabled,
    runtime_execution_detected: runtimeExecutionDetected,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    production_mode_unblocked: productionModeUnblocked,
    dry_run_execution_plan_invalid: dryRunExecutionPlanInvalid,
    failure_recovery_missing: failureRecoveryMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_test_mode_dry_run_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_TEST_MODE_DRY_RUN_READY_STATUS : null,
    mv_test_mode_dry_runs: dryRunResults,
    dry_run_checks: dryRunChecks,
    final_verdict: pass ? MV_TEST_MODE_DRY_RUN_PASS_VERDICT : MV_TEST_MODE_DRY_RUN_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_DRY_RUN_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
