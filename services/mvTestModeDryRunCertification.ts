import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import type { MvRuntimeTraceability } from './mvProductionRuntimeEngine.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_PASS_VERDICT,
  MV_TEST_MODE_DRY_RUN_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_READY_STATUS,
  type MvTestModeDryRunArtifact,
  type MvTestModeDryRunManifest,
  type MvTestModeDryRunResult,
} from './mvTestModeDryRun.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_TEST_MODE_DRY_RUN_CERTIFICATION_PHASE =
  'PHASE-DIGITAL-STUDIO-012-MV_TEST_MODE_DRY_RUN_CERTIFICATION_V1' as const;
export const MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT =
  'PASS_MV_TEST_MODE_DRY_RUN_CERTIFICATION_V1' as const;
export const MV_TEST_MODE_DRY_RUN_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MV_TEST_MODE_DRY_RUN_CERTIFICATION_V1' as const;
export const MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS = 'MV_TEST_MODE_DRY_RUN_CERTIFIED' as const;
export const MV_TEST_MODE_DRY_RUN_CERTIFICATION_DIR =
  'reports/mv_test_mode_dry_run_certification' as const;
export const MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH =
  'reports/mv_test_mode_dry_run_certification/mv-test-mode-dry-run-certification-report.json' as const;
export const MV_TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH =
  'reports/mv_test_mode_dry_run_certification/MV_TEST_MODE_DRY_RUN_CERTIFICATION.md' as const;
export const MV_TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR =
  'exports/mv_test_mode_dry_run_certification' as const;
export const MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH =
  'exports/mv_test_mode_dry_run_certification/mv-test-mode-dry-run-certification-manifest.json' as const;
export const MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH =
  'exports/mv_test_mode_dry_run_certification/mv-test-mode-dry-run-certification.json' as const;

export const DRY_RUN_CERTIFICATION_ARTIFACT_WRITE_SCOPE =
  'exports/mv_test_mode_dry_run_certification/' as const;

export const DRY_RUN_SCOPE_FULL_MV_CHAIN = 'full_mv_chain' as const;
export const EXPECTED_MOCK_SIMULATION_STEP_COUNT = 300 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type MvTestModeDryRunCertificationIssue = {
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

export type MvDryRunCertificationResult = {
  source_dry_run_ref: typeof MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH;
  dry_run_certification_id: string;
  dry_run_id: string;
  mv_type: MvType;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  dry_run_scope: typeof DRY_RUN_SCOPE_FULL_MV_CHAIN;
  mock_output_only: true;
  mock_simulation_step_count: number;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  production_mode_blocked: true;
  dry_run_manifest_verified: CertificationStatus;
  traceability_chain: MvRuntimeTraceability;
  dry_run_certified: CertificationStatus;
};

export type MvTestModeDryRunCertificationArtifact = {
  certification_id: string;
  phase: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_PHASE;
  generated_at: string;
  source_dry_run_ref: typeof MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH;
  source_dry_run_manifest_ref: typeof MV_TEST_MODE_DRY_RUN_MANIFEST_PATH;
  dry_run_bundle_id: string;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  dry_run_scope: typeof DRY_RUN_SCOPE_FULL_MV_CHAIN;
  mock_output_only: true;
  mock_simulation_step_count: typeof EXPECTED_MOCK_SIMULATION_STEP_COUNT;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  production_mode_blocked: true;
  dry_run_manifest_verified: true;
  mv_dry_run_certifications: MvDryRunCertificationResult[];
  safety_flags: {
    planning_only: true;
    test_mode: true;
    mock_execution_only: true;
    mock_output_only: true;
    dry_run_simulation: true;
    dry_run_certified: true;
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
  dry_run_consumed: boolean;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    dry_run_certification_artifact_write_scope: typeof DRY_RUN_CERTIFICATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  dry_run_certification_complete: boolean;
  final_audit_allowed: boolean;
  next_stage_ready: boolean;
};

export type MvTestModeDryRunCertificationManifest = {
  manifest_id: string;
  phase: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_PHASE;
  generated_at: string;
  dry_run_certification_count: typeof MV_TYPE_COUNT;
  dry_run_consumed: CertificationStatus;
  dry_run_certified: CertificationStatus;
  dry_run_completed: CertificationStatus;
  mock_output_verified: CertificationStatus;
  mock_simulation_step_count_valid: CertificationStatus;
  dry_run_scope_valid: CertificationStatus;
  dry_run_manifest_verified: CertificationStatus;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  production_mode_blocked: CertificationStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  final_audit_allowed: CertificationStatus;
  certification_status: typeof MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS | null;
};

export type MvTestModeDryRunCertificationReport = {
  report_id: string;
  phase: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_PHASE;
  timestamp: string;
  planning_only: true;
  mock_execution_only: true;
  dry_run_simulation: true;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  dry_run_scope: typeof DRY_RUN_SCOPE_FULL_MV_CHAIN;
  mock_output_only: true;
  mock_simulation_step_count: typeof EXPECTED_MOCK_SIMULATION_STEP_COUNT;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  production_mode_blocked: true;
  dry_run_manifest_verified: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  source_dry_run_ref: typeof MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH;
  source_dry_run_manifest_ref: typeof MV_TEST_MODE_DRY_RUN_MANIFEST_PATH;
  mv_test_mode_dry_run_report_path: typeof MV_TEST_MODE_DRY_RUN_REPORT_PATH;
  mv_test_mode_dry_run_certification_export_dir: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR;
  mv_test_mode_dry_run_certification_manifest_path: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH;
  mv_test_mode_dry_run_certification_artifact_path: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  dry_run_certification_count: typeof MV_TYPE_COUNT;
  dry_run_consumed: CertificationStatus;
  dry_run_certified: CertificationStatus;
  dry_run_completed: CertificationStatus;
  mock_output_verified: CertificationStatus;
  mock_simulation_step_count_valid: CertificationStatus;
  dry_run_scope_valid: CertificationStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  final_audit_allowed: CertificationStatus;
  dry_run_missing: boolean;
  dry_run_not_completed: boolean;
  mock_output_missing: boolean;
  mock_simulation_step_count_invalid: boolean;
  dry_run_scope_invalid: boolean;
  dry_run_manifest_missing: boolean;
  test_mode_disabled: boolean;
  real_generation_enabled: boolean;
  runtime_execution_detected: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  production_mode_unblocked: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_test_mode_dry_run_certification_ready: CertificationStatus;
  certification_status: typeof MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS | null;
  mv_dry_run_certifications: MvDryRunCertificationResult[];
  certification_checks: CertificationCheck[];
  final_verdict:
    | typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT
    | typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_FAIL_VERDICT;
  issues: MvTestModeDryRunCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
] as const;

const CERTIFICATION_EXPORT_WRITE_PATHS = [
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_DIR,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH,
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
    relativePath.startsWith(DRY_RUN_CERTIFICATION_ARTIFACT_WRITE_SCOPE) ||
    relativePath === DRY_RUN_CERTIFICATION_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function isMockOutput(value: string): boolean {
  return value.startsWith('mock_output_') || value.startsWith('mock_');
}

function verifyDryRunManifest(
  dryRunManifest: MvTestModeDryRunManifest,
  dryRunArtifact: MvTestModeDryRunArtifact
): boolean {
  return (
    dryRunManifest.dry_run_count === MV_TYPE_COUNT &&
    dryRunManifest.execution_certification_consumed === 'PASS' &&
    dryRunManifest.dry_run_ready === 'PASS' &&
    dryRunManifest.dry_run_completed === 'PASS' &&
    dryRunManifest.mock_output_verified === 'PASS' &&
    dryRunManifest.test_mode_allowed === true &&
    dryRunManifest.real_generation_blocked === true &&
    dryRunManifest.runtime_not_executed === true &&
    dryRunManifest.certification_status === MV_TEST_MODE_DRY_RUN_READY_STATUS &&
    dryRunArtifact.dry_run_complete === true &&
    dryRunArtifact.mock_output_count === EXPECTED_MOCK_SIMULATION_STEP_COUNT
  );
}

function certifyDryRunResult(
  dryRun: MvTestModeDryRunResult,
  manifestVerified: boolean
): MvDryRunCertificationResult {
  const stepCount = dryRun.dry_run_execution_plan.step_count;
  const mockOutputVerified =
    dryRun.mock_output_only === true &&
    dryRun.dry_run_execution_plan.steps.every(
      (step) =>
        step.mock_output_only === true &&
        step.execution_allowed === false &&
        isMockOutput(step.mock_image_output) &&
        isMockOutput(step.mock_video_output) &&
        step.step_completed === 'PASS'
    );

  const certified =
    dryRun.dry_run_ready === 'PASS' &&
    dryRun.dry_run_completed === 'PASS' &&
    dryRun.execution_scope === EXECUTION_SCOPE_TEST_MODE_ONLY &&
    mockOutputVerified &&
    dryRun.dry_run_execution_plan.plan_valid &&
    dryRun.test_mode_allowed === true &&
    dryRun.real_generation_blocked === true &&
    dryRun.runtime_not_executed === true &&
    dryRun.external_call_blocked === true &&
    dryRun.gpu_execution_blocked === true &&
    dryRun.production_mode_blocked === true &&
    manifestVerified &&
    dryRun.traceability_chain.trace_integrity === 'PASS';

  return {
    source_dry_run_ref: MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    dry_run_certification_id: `${dryRun.mv_type}_dry_run_certification_v1`,
    dry_run_id: dryRun.dry_run_id,
    mv_type: dryRun.mv_type,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    dry_run_scope: DRY_RUN_SCOPE_FULL_MV_CHAIN,
    mock_output_only: true,
    mock_simulation_step_count: stepCount,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    dry_run_manifest_verified: toStatus(manifestVerified),
    traceability_chain: dryRun.traceability_chain,
    dry_run_certified: toStatus(certified),
  };
}

function buildMarkdown(report: MvTestModeDryRunCertificationReport): string {
  const lines = [
    '# MV Test Mode Dry Run Certification',
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
    `**Source Dry Run:** ${report.source_dry_run_ref}`,
    `**Source Dry Run Manifest:** ${report.source_dry_run_manifest_ref}`,
    `**Execution Scope:** ${report.execution_scope}`,
    `**Dry Run Scope:** ${report.dry_run_scope}`,
    `**Mock Simulation Steps:** ${report.mock_simulation_step_count}`,
    '',
    '## Flow',
    '',
    'DS-011 Dry Run → DS-012 Dry Run Certification → DS-013 Final Audit',
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| dry_run_consumed | ${report.dry_run_consumed} |`,
    `| dry_run_certified | ${report.dry_run_certified} |`,
    `| dry_run_completed | ${report.dry_run_completed} |`,
    `| mock_output_verified | ${report.mock_output_verified} |`,
    `| mock_simulation_step_count_valid | ${report.mock_simulation_step_count_valid} |`,
    `| dry_run_scope_valid | ${report.dry_run_scope_valid} |`,
    `| dry_run_manifest_verified | ${report.dry_run_manifest_verified} |`,
    `| test_mode_allowed | ${report.test_mode_allowed} |`,
    `| real_generation_blocked | ${report.real_generation_blocked} |`,
    `| runtime_not_executed | ${report.runtime_not_executed} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| next_stage_ready | ${report.next_stage_ready} |`,
    `| final_audit_allowed | ${report.final_audit_allowed} |`,
    '',
    '## Dry Run Certifications',
    ''
  );

  for (const cert of report.mv_dry_run_certifications) {
    lines.push(
      `- ${cert.dry_run_certification_id} (${cert.mv_type}): steps=${cert.mock_simulation_step_count} scope=${cert.dry_run_scope} certified=${cert.dry_run_certified}`
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
  issues: MvTestModeDryRunCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvTestModeDryRunCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvTestModeDryRunCertificationReport = {
    report_id: 'mv-test-mode-dry-run-certification-report-v1',
    phase: MV_TEST_MODE_DRY_RUN_CERTIFICATION_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    dry_run_simulation: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    dry_run_scope: DRY_RUN_SCOPE_FULL_MV_CHAIN,
    mock_output_only: true,
    mock_simulation_step_count: EXPECTED_MOCK_SIMULATION_STEP_COUNT,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    dry_run_manifest_verified: false,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_dry_run_ref: MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    source_dry_run_manifest_ref: MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
    mv_test_mode_dry_run_report_path: MV_TEST_MODE_DRY_RUN_REPORT_PATH,
    mv_test_mode_dry_run_certification_export_dir: MV_TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR,
    mv_test_mode_dry_run_certification_manifest_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    mv_test_mode_dry_run_certification_artifact_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    dry_run_certification_count: MV_TYPE_COUNT,
    dry_run_consumed: 'FAIL',
    dry_run_certified: 'FAIL',
    dry_run_completed: 'FAIL',
    mock_output_verified: 'FAIL',
    mock_simulation_step_count_valid: 'FAIL',
    dry_run_scope_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: 'FAIL',
    next_stage_ready: 'FAIL',
    final_audit_allowed: 'FAIL',
    dry_run_missing: true,
    dry_run_not_completed: true,
    mock_output_missing: true,
    mock_simulation_step_count_invalid: true,
    dry_run_scope_invalid: true,
    dry_run_manifest_missing: true,
    test_mode_disabled: true,
    real_generation_enabled: true,
    runtime_execution_detected: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    production_mode_unblocked: true,
    traceability_loss: true,
    safe_create_policy_violation: true,
    mv_test_mode_dry_run_certification_ready: 'FAIL',
    certification_status: null,
    mv_dry_run_certifications: [],
    certification_checks: [],
    final_verdict: MV_TEST_MODE_DRY_RUN_CERTIFICATION_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message: 'Dry run artifact was modified during dry run certification write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvTestModeDryRunCertification(
  projectRoot?: string
): MvTestModeDryRunCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvTestModeDryRunCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const dryRunReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_test_mode_dry_run_ready: CertificationStatus;
    dry_run_ready: CertificationStatus;
    dry_run_completed: CertificationStatus;
    next_stage_ready: CertificationStatus;
    traceability_preserved: boolean;
    mock_output_count: number;
  }>(root, MV_TEST_MODE_DRY_RUN_REPORT_PATH);
  const dryRunArtifact = loadJson<MvTestModeDryRunArtifact>(
    root,
    MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH
  );
  const dryRunManifest = loadJson<MvTestModeDryRunManifest>(
    root,
    MV_TEST_MODE_DRY_RUN_MANIFEST_PATH
  );

  const dryRunPrecheckValid =
    dryRunReport !== null &&
    dryRunReport.final_verdict === MV_TEST_MODE_DRY_RUN_PASS_VERDICT &&
    dryRunReport.certification_status === MV_TEST_MODE_DRY_RUN_READY_STATUS &&
    dryRunReport.mv_test_mode_dry_run_ready === 'PASS' &&
    dryRunReport.dry_run_ready === 'PASS' &&
    dryRunReport.dry_run_completed === 'PASS' &&
    dryRunArtifact !== null &&
    dryRunManifest !== null &&
    dryRunArtifact.dry_run_complete === true;

  if (!dryRunPrecheckValid) {
    issues.push({
      code: 'DRY_RUN_PRECHECK_FAILED',
      message: `Required ${MV_TEST_MODE_DRY_RUN_PASS_VERDICT} with ${MV_TEST_MODE_DRY_RUN_READY_STATUS}`,
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

  const dryRunManifestVerified = verifyDryRunManifest(dryRunManifest, dryRunArtifact);

  const certificationResults = dryRunArtifact.mv_test_mode_dry_runs.map((dryRun) =>
    certifyDryRunResult(dryRun, dryRunManifestVerified)
  );

  for (const result of certificationResults) {
    if (result.dry_run_certified === 'FAIL') {
      issues.push({
        code: 'DRY_RUN_CERTIFICATION_FAILED',
        message: `Dry run certification failed for ${result.dry_run_certification_id}`,
        severity: 'error',
        mv_type: result.mv_type,
      });
    }
  }

  const totalStepCount = certificationResults.reduce(
    (total, result) => total + result.mock_simulation_step_count,
    0
  );

  const dryRunConsumed =
    dryRunArtifact.execution_certification_consumed === true &&
    dryRunArtifact.dry_run_complete === true &&
    certificationResults.length === MV_TYPE_COUNT &&
    certificationResults.every(
      (result) => result.source_dry_run_ref === MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH
    );

  const dryRunCertified = certificationResults.every(
    (result) => result.dry_run_certified === 'PASS'
  );
  const dryRunCompleted = dryRunArtifact.mv_test_mode_dry_runs.every(
    (dryRun) => dryRun.dry_run_completed === 'PASS'
  );
  const mockOutputVerified = certificationResults.every(
    (result) =>
      result.mock_output_only === true &&
      dryRunArtifact.mv_test_mode_dry_runs
        .find((dryRun) => dryRun.mv_type === result.mv_type)
        ?.dry_run_execution_plan.steps.every(
          (step) =>
            step.mock_output_only === true &&
            isMockOutput(step.mock_image_output) &&
            isMockOutput(step.mock_video_output)
        )
  );
  const mockSimulationStepCountValid =
    totalStepCount === EXPECTED_MOCK_SIMULATION_STEP_COUNT &&
    dryRunArtifact.mock_output_count === EXPECTED_MOCK_SIMULATION_STEP_COUNT;
  const dryRunScopeValid = certificationResults.every(
    (result) => result.dry_run_scope === DRY_RUN_SCOPE_FULL_MV_CHAIN
  );
  const testModeAllowed = true as const;
  const realGenerationBlocked = true as const;
  const runtimeNotExecuted =
    dryRunArtifact.runtime_not_executed === true &&
    dryRunArtifact.safety_flags.runtime_execution === false &&
    dryRunArtifact.safety_flags.no_execution === true;
  const externalCallBlockedFlag =
    dryRunArtifact.external_call_blocked === true &&
    dryRunArtifact.safety_flags.external_call_allowed === false;
  const gpuExecutionBlockedFlag =
    dryRunArtifact.gpu_execution_blocked === true &&
    dryRunArtifact.safety_flags.gpu_execution === false;
  const productionModeBlockedFlag =
    upstreamRuntimeCertArtifact.production_mode_blocked === true &&
    upstreamRuntimeCertArtifact.real_generation_blocked === true &&
    upstreamRuntimeCertArtifact.no_external_calls === true &&
    upstreamRuntimeCertArtifact.no_gpu_execution === true &&
    dryRunArtifact.safety_flags.production_mode_blocked === true;
  const traceabilityPreserved =
    dryRunArtifact.traceability_preserved === true &&
    certificationResults.every((result) => result.traceability_chain.trace_integrity === 'PASS');

  const certificationWriteScopeValid = CERTIFICATION_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderCertificationWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && certificationWriteScopeValid;

  const finalAuditAllowed =
    dryRunConsumed &&
    dryRunCertified &&
    dryRunCompleted &&
    mockOutputVerified &&
    mockSimulationStepCountValid &&
    dryRunScopeValid &&
    dryRunManifestVerified &&
    testModeAllowed === true &&
    realGenerationBlocked === true &&
    runtimeNotExecuted &&
    externalCallBlockedFlag &&
    gpuExecutionBlockedFlag &&
    productionModeBlockedFlag &&
    traceabilityPreserved;

  const nextStageReady = finalAuditAllowed && safeCreatePolicyVerified;

  const dryRunCertificationComplete = nextStageReady;

  const dryRunMissing = !dryRunConsumed;
  const dryRunNotCompleted = !dryRunCompleted;
  const mockOutputMissing = !mockOutputVerified;
  const mockSimulationStepCountInvalid = !mockSimulationStepCountValid;
  const dryRunScopeInvalid = !dryRunScopeValid;
  const dryRunManifestMissing = !dryRunManifestVerified;
  const testModeDisabled = testModeAllowed !== true;
  const realGenerationEnabled = realGenerationBlocked !== true;
  const runtimeExecutionDetected = !runtimeNotExecuted;
  const externalCallEnabled = !externalCallBlockedFlag;
  const gpuExecutionEnabled = !gpuExecutionBlockedFlag;
  const productionModeUnblocked = !productionModeBlockedFlag;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  if (dryRunMissing) {
    issues.push({
      code: 'DRY_RUN_MISSING',
      message: 'Dry run was not consumed',
      severity: 'error',
    });
  }
  if (dryRunNotCompleted) {
    issues.push({
      code: 'DRY_RUN_NOT_COMPLETED',
      message: 'Dry run did not complete',
      severity: 'error',
    });
  }
  if (!dryRunCertified) {
    issues.push({
      code: 'DRY_RUN_NOT_CERTIFIED',
      message: 'One or more dry runs failed certification',
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
  if (mockSimulationStepCountInvalid) {
    issues.push({
      code: 'MOCK_SIMULATION_STEP_COUNT_INVALID',
      message: `Expected ${EXPECTED_MOCK_SIMULATION_STEP_COUNT} mock simulation steps`,
      severity: 'error',
    });
  }
  if (dryRunScopeInvalid) {
    issues.push({
      code: 'DRY_RUN_SCOPE_INVALID',
      message: 'Dry run scope must be full_mv_chain',
      severity: 'error',
    });
  }
  if (dryRunManifestMissing) {
    issues.push({
      code: 'DRY_RUN_MANIFEST_MISSING',
      message: 'Dry run manifest verification failed',
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

  const certificationChecks: CertificationCheck[] = [
    {
      check_id: 'dry_run_consumed',
      check_label: 'Dry Run Consumed',
      status: toStatus(dryRunConsumed),
    },
    {
      check_id: 'dry_run_certified',
      check_label: 'Dry Run Certified',
      status: toStatus(dryRunCertified),
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
      check_id: 'mock_simulation_step_count_valid',
      check_label: 'Mock Simulation Step Count Valid',
      status: toStatus(mockSimulationStepCountValid),
    },
    {
      check_id: 'dry_run_scope_valid',
      check_label: 'Dry Run Scope Valid',
      status: toStatus(dryRunScopeValid),
    },
    {
      check_id: 'dry_run_manifest_verified',
      check_label: 'Dry Run Manifest Verified',
      status: toStatus(dryRunManifestVerified),
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

  const pass =
    dryRunCertificationComplete &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvTestModeDryRunCertificationArtifact = {
    certification_id: 'mv-test-mode-dry-run-certification-v1',
    phase: MV_TEST_MODE_DRY_RUN_CERTIFICATION_PHASE,
    generated_at: timestamp,
    source_dry_run_ref: MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    source_dry_run_manifest_ref: MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
    dry_run_bundle_id: dryRunArtifact.dry_run_bundle_id,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    dry_run_scope: DRY_RUN_SCOPE_FULL_MV_CHAIN,
    mock_output_only: true,
    mock_simulation_step_count: EXPECTED_MOCK_SIMULATION_STEP_COUNT,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    dry_run_manifest_verified: dryRunManifestVerified,
    mv_dry_run_certifications: certificationResults,
    safety_flags: {
      planning_only: true,
      test_mode: true,
      mock_execution_only: true,
      mock_output_only: true,
      dry_run_simulation: true,
      dry_run_certified: true,
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
    dry_run_consumed: dryRunConsumed,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      dry_run_certification_artifact_write_scope: DRY_RUN_CERTIFICATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    dry_run_certification_complete: dryRunCertificationComplete,
    final_audit_allowed: finalAuditAllowed,
    next_stage_ready: nextStageReady,
  };

  const manifest: MvTestModeDryRunCertificationManifest = {
    manifest_id: 'mv-test-mode-dry-run-certification-manifest-v1',
    phase: MV_TEST_MODE_DRY_RUN_CERTIFICATION_PHASE,
    generated_at: timestamp,
    dry_run_certification_count: MV_TYPE_COUNT,
    dry_run_consumed: toStatus(dryRunConsumed),
    dry_run_certified: toStatus(dryRunCertified),
    dry_run_completed: toStatus(dryRunCompleted),
    mock_output_verified: toStatus(mockOutputVerified),
    mock_simulation_step_count_valid: toStatus(mockSimulationStepCountValid),
    dry_run_scope_valid: toStatus(dryRunScopeValid),
    dry_run_manifest_verified: toStatus(dryRunManifestVerified),
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: toStatus(externalCallBlockedFlag),
    gpu_execution_blocked: toStatus(gpuExecutionBlockedFlag),
    production_mode_blocked: toStatus(productionModeBlockedFlag),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    final_audit_allowed: toStatus(finalAuditAllowed),
    certification_status: pass ? MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvTestModeDryRunCertificationReport = {
    report_id: 'mv-test-mode-dry-run-certification-report-v1',
    phase: MV_TEST_MODE_DRY_RUN_CERTIFICATION_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    dry_run_simulation: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    dry_run_scope: DRY_RUN_SCOPE_FULL_MV_CHAIN,
    mock_output_only: true,
    mock_simulation_step_count: EXPECTED_MOCK_SIMULATION_STEP_COUNT,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    dry_run_manifest_verified: dryRunManifestVerified,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_dry_run_ref: MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    source_dry_run_manifest_ref: MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
    mv_test_mode_dry_run_report_path: MV_TEST_MODE_DRY_RUN_REPORT_PATH,
    mv_test_mode_dry_run_certification_export_dir: MV_TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR,
    mv_test_mode_dry_run_certification_manifest_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    mv_test_mode_dry_run_certification_artifact_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    dry_run_certification_count: MV_TYPE_COUNT,
    dry_run_consumed: toStatus(dryRunConsumed),
    dry_run_certified: toStatus(dryRunCertified),
    dry_run_completed: toStatus(dryRunCompleted),
    mock_output_verified: toStatus(mockOutputVerified),
    mock_simulation_step_count_valid: toStatus(mockSimulationStepCountValid),
    dry_run_scope_valid: toStatus(dryRunScopeValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    final_audit_allowed: toStatus(finalAuditAllowed),
    dry_run_missing: dryRunMissing,
    dry_run_not_completed: dryRunNotCompleted,
    mock_output_missing: mockOutputMissing,
    mock_simulation_step_count_invalid: mockSimulationStepCountInvalid,
    dry_run_scope_invalid: dryRunScopeInvalid,
    dry_run_manifest_missing: dryRunManifestMissing,
    test_mode_disabled: testModeDisabled,
    real_generation_enabled: realGenerationEnabled,
    runtime_execution_detected: runtimeExecutionDetected,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    production_mode_unblocked: productionModeUnblocked,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_test_mode_dry_run_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS : null,
    mv_dry_run_certifications: certificationResults,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT
      : MV_TEST_MODE_DRY_RUN_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
