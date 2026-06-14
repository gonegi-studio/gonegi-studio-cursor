import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  PRODUCTION_RUNTIME_CERTIFIED_STATUS,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  type ProductionRuntimeCertificationArtifact,
  type RuntimePackageCertificationAudit,
} from './movieAnalysisProductionRuntimeCertification.js';
import {
  PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  type ProductionRuntimeEngineArtifact,
  type ProductionRuntimePackage,
  type RuntimeUnit,
} from './movieAnalysisProductionRuntimeEngine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TEST_MODE_EXECUTION_PACKAGE_PHASE =
  'PHASE-LEVEL3-008-TEST_MODE_EXECUTION_PACKAGE_V1' as const;
export const TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_TEST_MODE_EXECUTION_PACKAGE_V1' as const;
export const TEST_MODE_EXECUTION_PACKAGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_TEST_MODE_EXECUTION_PACKAGE_V1' as const;
export const TEST_MODE_EXECUTION_PACKAGE_READY_STATUS =
  'TEST_MODE_EXECUTION_PACKAGE_READY' as const;
export const TEST_MODE_EXECUTION_PACKAGE_DIR =
  'reports/movie_analysis_test_mode_execution_package' as const;
export const TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH =
  'reports/movie_analysis_test_mode_execution_package/movie-analysis-test-mode-execution-package-report.json' as const;
export const TEST_MODE_EXECUTION_PACKAGE_MD_PATH =
  'reports/movie_analysis_test_mode_execution_package/MOVIE_ANALYSIS_TEST_MODE_EXECUTION_PACKAGE.md' as const;
export const TEST_MODE_EXECUTION_PACKAGE_EXPORT_DIR =
  'exports/movie_analysis_test_mode_execution_package' as const;
export const TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH =
  'exports/movie_analysis_test_mode_execution_package/movie-analysis-test-mode-execution-package-manifest.json' as const;
export const TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH =
  'exports/movie_analysis_test_mode_execution_package/test-mode-execution-package.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type TestModeExecutionPackageIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  test_package_id?: string;
  unit_id?: string;
};

export type TestUnit = {
  unit_id: string;
  runtime_unit_ref: string;
  execution_order: number;
  mock_image_target: string;
  mock_video_target: string;
  adapter_requirements: string[];
  quality_gate_ref: string;
  test_ready: CertificationStatus;
};

export type TestExecutionQueueEntry = {
  queue_order: number;
  test_unit_id: string;
  runtime_unit_ref: string;
};

export type DryRunFlags = {
  planning_only: true;
  test_mode: true;
  production_mode: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution_allowed: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  mock_execution_only: true;
};

export type MockExecutionEntry = {
  test_unit_id: string;
  runtime_unit_ref: string;
  mock_image_target: string;
  mock_video_target: string;
  mock_execution_step: string;
  mock_ready: CertificationStatus;
};

export type QualityGateTestEntry = {
  test_unit_id: string;
  runtime_unit_ref: string;
  gate_id: string;
  gate_label: string;
  gate_passed: CertificationStatus;
};

export type FailureRecoveryTestEntry = {
  test_unit_id: string;
  runtime_unit_ref: string;
  retry_policy: string;
  fallback_unit_ref: string | null;
  recovery_ready: CertificationStatus;
};

export type TestModeExecutionPackage = {
  test_package_id: string;
  certified_runtime_refs: string[];
  test_mode: true;
  production_mode: false;
  external_call_allowed: false;
  gpu_execution_allowed: false;
  test_units: TestUnit[];
  test_execution_queue: TestExecutionQueueEntry[];
  dry_run_flags: DryRunFlags;
  mock_execution_plan: {
    entry_count: number;
    entries: MockExecutionEntry[];
    plan_ready: CertificationStatus;
  };
  quality_gate_test_plan: {
    entry_count: number;
    entries: QualityGateTestEntry[];
    plan_ready: CertificationStatus;
  };
  failure_recovery_test_plan: {
    entry_count: number;
    entries: FailureRecoveryTestEntry[];
    plan_ready: CertificationStatus;
  };
  traceability_chain: ProductionRuntimePackage['traceability_chain'];
  test_package_ready: CertificationStatus;
};

export type TestModeExecutionPackageArtifact = {
  package_bundle_id: string;
  phase: typeof TEST_MODE_EXECUTION_PACKAGE_PHASE;
  generated_at: string;
  production_runtime_certification_artifact_path: typeof PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH;
  test_packages: TestModeExecutionPackage[];
  test_package_complete: boolean;
};

export type MovieAnalysisTestModeExecutionPackageManifest = {
  manifest_id: string;
  phase: typeof TEST_MODE_EXECUTION_PACKAGE_PHASE;
  generated_at: string;
  test_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  certification_consumed: CertificationStatus;
  test_package_complete: CertificationStatus;
  test_mode_enabled: CertificationStatus;
  production_mode_disabled: CertificationStatus;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  test_execution_queue_valid: CertificationStatus;
  mock_execution_plan_ready: CertificationStatus;
  quality_gate_test_ready: CertificationStatus;
  failure_recovery_test_ready: CertificationStatus;
  traceability_preserved: boolean;
  certification_status: typeof TEST_MODE_EXECUTION_PACKAGE_READY_STATUS | null;
};

export type MovieAnalysisTestModeExecutionPackageReport = {
  report_id: string;
  phase: typeof TEST_MODE_EXECUTION_PACKAGE_PHASE;
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
  production_runtime_certification_report_path: typeof PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH;
  production_runtime_certification_artifact_path: typeof PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH;
  test_mode_execution_package_export_dir: typeof TEST_MODE_EXECUTION_PACKAGE_EXPORT_DIR;
  test_mode_execution_package_manifest_path: typeof TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  test_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  certification_consumed: CertificationStatus;
  test_package_complete: CertificationStatus;
  test_mode_enabled: CertificationStatus;
  production_mode_disabled: CertificationStatus;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  test_execution_queue_valid: CertificationStatus;
  mock_execution_plan_ready: CertificationStatus;
  quality_gate_test_ready: CertificationStatus;
  failure_recovery_test_ready: CertificationStatus;
  traceability_preserved: boolean;
  certification_missing: boolean;
  test_package_failure: boolean;
  test_mode_disabled: boolean;
  production_mode_enabled: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  test_execution_queue_invalid: boolean;
  mock_execution_plan_missing: boolean;
  quality_gate_test_missing: boolean;
  failure_recovery_test_missing: boolean;
  traceability_loss: boolean;
  test_mode_execution_package_ready: CertificationStatus;
  certification_status: typeof TEST_MODE_EXECUTION_PACKAGE_READY_STATUS | null;
  test_packages: TestModeExecutionPackage[];
  final_verdict:
    | typeof TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT
    | typeof TEST_MODE_EXECUTION_PACKAGE_FAIL_VERDICT;
  issues: TestModeExecutionPackageIssue[];
};

const DRY_RUN_FLAGS: DryRunFlags = {
  planning_only: true,
  test_mode: true,
  production_mode: false,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution_allowed: false,
  external_call_allowed: false,
  no_execution: true,
  no_rendering: true,
  mock_execution_only: true,
};

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function mockTarget(target: string, kind: 'image' | 'video'): string {
  return `mock_${kind}_${target}`;
}

function buildTestUnit(runtimeUnit: RuntimeUnit, index: number, packageSlug: string): TestUnit {
  const unitId = `test_unit_${packageSlug}_${index + 1}`;
  const mockImage = mockTarget(runtimeUnit.image_target, 'image');
  const mockVideo = mockTarget(runtimeUnit.video_target, 'video');
  const testReady =
    runtimeUnit.runtime_ready === 'PASS' &&
    mockImage.length > 0 &&
    mockVideo.length > 0 &&
    runtimeUnit.adapter_requirements.length > 0 &&
    runtimeUnit.quality_gate_ref.length > 0;

  return {
    unit_id: unitId,
    runtime_unit_ref: runtimeUnit.unit_id,
    execution_order: runtimeUnit.execution_order,
    mock_image_target: mockImage,
    mock_video_target: mockVideo,
    adapter_requirements: runtimeUnit.adapter_requirements,
    quality_gate_ref: runtimeUnit.quality_gate_ref,
    test_ready: toStatus(testReady),
  };
}

function isTestExecutionQueueValid(testPackage: TestModeExecutionPackage): boolean {
  return (
    testPackage.test_execution_queue.length === testPackage.test_units.length &&
    testPackage.test_execution_queue.every((entry, index) => {
      const unit = testPackage.test_units[index];
      return (
        entry.queue_order === index + 1 &&
        entry.test_unit_id === unit?.unit_id &&
        entry.runtime_unit_ref === unit?.runtime_unit_ref
      );
    })
  );
}

function buildTestPackage(
  runtimePackage: ProductionRuntimePackage,
  audit: RuntimePackageCertificationAudit
): TestModeExecutionPackage {
  const packageSlug = runtimePackage.runtime_id.replace('production_runtime_', '').replace('_v1', '');
  const testUnits = runtimePackage.runtime_units.map((unit, index) =>
    buildTestUnit(unit, index, packageSlug)
  );

  const testExecutionQueue: TestExecutionQueueEntry[] = testUnits.map((unit, index) => ({
    queue_order: index + 1,
    test_unit_id: unit.unit_id,
    runtime_unit_ref: unit.runtime_unit_ref,
  }));

  const mockEntries: MockExecutionEntry[] = testUnits.map((unit) => ({
    test_unit_id: unit.unit_id,
    runtime_unit_ref: unit.runtime_unit_ref,
    mock_image_target: unit.mock_image_target,
    mock_video_target: unit.mock_video_target,
    mock_execution_step: `dry_run_${unit.runtime_unit_ref}`,
    mock_ready: toStatus(unit.mock_image_target.length > 0 && unit.mock_video_target.length > 0),
  }));

  const qualityEntries: QualityGateTestEntry[] = runtimePackage.quality_gate_runtime_plan.entries.map(
    (entry) => {
      const testUnit = testUnits.find((unit) => unit.runtime_unit_ref === entry.runtime_unit_id);
      return {
        test_unit_id: testUnit?.unit_id ?? entry.runtime_unit_id,
        runtime_unit_ref: entry.runtime_unit_id,
        gate_id: entry.gate_id,
        gate_label: entry.gate_label,
        gate_passed: entry.gate_passed,
      };
    }
  );

  const failureEntries: FailureRecoveryTestEntry[] =
    runtimePackage.failure_recovery_plan.entries.map((entry) => {
      const testUnit = testUnits.find((unit) => unit.runtime_unit_ref === entry.runtime_unit_id);
      const fallbackTestUnit = entry.fallback_unit_ref
        ? testUnits.find((unit) => unit.runtime_unit_ref === entry.fallback_unit_ref)
        : null;
      return {
        test_unit_id: testUnit?.unit_id ?? entry.runtime_unit_id,
        runtime_unit_ref: entry.runtime_unit_id,
        retry_policy: entry.retry_policy,
        fallback_unit_ref: fallbackTestUnit?.unit_id ?? entry.fallback_unit_ref,
        recovery_ready: entry.recovery_ready,
      };
    });

  const mockPlanReady = toStatus(mockEntries.every((entry) => entry.mock_ready === 'PASS'));
  const qualityTestReady = toStatus(qualityEntries.every((entry) => entry.gate_passed === 'PASS'));
  const failureTestReady = toStatus(failureEntries.every((entry) => entry.recovery_ready === 'PASS'));

  const testPackageReady = toStatus(
    audit.package_certified === 'PASS' &&
      testUnits.every((unit) => unit.test_ready === 'PASS') &&
      mockPlanReady === 'PASS' &&
      qualityTestReady === 'PASS' &&
      failureTestReady === 'PASS' &&
      runtimePackage.traceability_chain.trace_integrity === 'PASS'
  );

  return {
    test_package_id: `test_mode_package_${packageSlug}_v1`,
    certified_runtime_refs: [runtimePackage.runtime_id],
    test_mode: true,
    production_mode: false,
    external_call_allowed: false,
    gpu_execution_allowed: false,
    test_units: testUnits,
    test_execution_queue: testExecutionQueue,
    dry_run_flags: DRY_RUN_FLAGS,
    mock_execution_plan: {
      entry_count: mockEntries.length,
      entries: mockEntries,
      plan_ready: mockPlanReady,
    },
    quality_gate_test_plan: {
      entry_count: qualityEntries.length,
      entries: qualityEntries,
      plan_ready: qualityTestReady,
    },
    failure_recovery_test_plan: {
      entry_count: failureEntries.length,
      entries: failureEntries,
      plan_ready: failureTestReady,
    },
    traceability_chain: runtimePackage.traceability_chain,
    test_package_ready: testPackageReady,
  };
}

function buildMarkdown(report: MovieAnalysisTestModeExecutionPackageReport): string {
  const lines = [
    '# Movie Analysis Test Mode Execution Package',
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
    '| Metric | Value |',
    '| --- | --- |',
    `| certification_consumed | ${report.certification_consumed} |`,
    `| test_package_complete | ${report.test_package_complete} |`,
    `| test_mode_enabled | ${report.test_mode_enabled} |`,
    `| production_mode_disabled | ${report.production_mode_disabled} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Test Packages',
    ''
  );

  for (const testPackage of report.test_packages) {
    lines.push(
      `- ${testPackage.test_package_id}: ready=${testPackage.test_package_ready} units=${testPackage.test_units.length}`
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
  issues: TestModeExecutionPackageIssue[]
): MovieAnalysisTestModeExecutionPackageReport {
  const report: MovieAnalysisTestModeExecutionPackageReport = {
    report_id: 'movie-analysis-test-mode-execution-package-report-v1',
    phase: TEST_MODE_EXECUTION_PACKAGE_PHASE,
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
    production_runtime_certification_report_path: PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
    production_runtime_certification_artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_export_dir: TEST_MODE_EXECUTION_PACKAGE_EXPORT_DIR,
    test_mode_execution_package_manifest_path: TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    certification_consumed: 'FAIL',
    test_package_complete: 'FAIL',
    test_mode_enabled: 'FAIL',
    production_mode_disabled: 'FAIL',
    external_call_blocked: 'FAIL',
    gpu_execution_blocked: 'FAIL',
    test_execution_queue_valid: 'FAIL',
    mock_execution_plan_ready: 'FAIL',
    quality_gate_test_ready: 'FAIL',
    failure_recovery_test_ready: 'FAIL',
    traceability_preserved: false,
    certification_missing: true,
    test_package_failure: true,
    test_mode_disabled: true,
    production_mode_enabled: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    test_execution_queue_invalid: true,
    mock_execution_plan_missing: true,
    quality_gate_test_missing: true,
    failure_recovery_test_missing: true,
    traceability_loss: true,
    test_mode_execution_package_ready: 'FAIL',
    certification_status: null,
    test_packages: [],
    final_verdict: TEST_MODE_EXECUTION_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_PACKAGE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_PACKAGE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisTestModeExecutionPackage(
  projectRoot?: string
): MovieAnalysisTestModeExecutionPackageReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TestModeExecutionPackageIssue[] = [];
  const timestamp = new Date().toISOString();

  const certificationReport = loadReport<Record<string, unknown>>(
    root,
    PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH
  );
  const certificationArtifactPath = path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);
  const certificationMissing =
    !certificationReport ||
    certificationReport.final_verdict !== PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT ||
    certificationReport.certification_status !== PRODUCTION_RUNTIME_CERTIFIED_STATUS ||
    !fs.existsSync(certificationArtifactPath);

  if (certificationMissing) {
    issues.push({
      code: 'CERTIFICATION_MISSING',
      message: `Required ${PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT} with ${PRODUCTION_RUNTIME_CERTIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const certificationArtifact = JSON.parse(
    fs.readFileSync(certificationArtifactPath, 'utf8')
  ) as ProductionRuntimeCertificationArtifact;

  if (
    !certificationArtifact.certification_complete ||
    certificationArtifact.test_mode_allowed !== true ||
    certificationArtifact.production_mode_blocked !== true ||
    certificationArtifact.runtime_not_executed !== true ||
    certificationArtifact.runtime_package_audits.length === 0
  ) {
    issues.push({
      code: 'CERTIFICATION_NOT_READY',
      message: 'Production runtime certification artifact safety requirements not met',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const runtimeArtifactPath = path.join(root, PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH);
  if (!fs.existsSync(runtimeArtifactPath)) {
    issues.push({
      code: 'RUNTIME_ENGINE_MISSING',
      message: `Missing read-only upstream artifact ${PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const runtimeArtifact = JSON.parse(
    fs.readFileSync(runtimeArtifactPath, 'utf8')
  ) as ProductionRuntimeEngineArtifact;

  const testPackages: TestModeExecutionPackage[] = [];
  for (const audit of certificationArtifact.runtime_package_audits) {
    const runtimePackage = runtimeArtifact.runtime_packages.find(
      (entry) => entry.runtime_id === audit.runtime_id
    );
    if (!runtimePackage) {
      issues.push({
        code: 'TEST_PACKAGE_FAILURE',
        message: `Missing runtime package for ${audit.runtime_id}`,
        severity: 'error',
        test_package_id: audit.runtime_id,
      });
      continue;
    }

    const testPackage = buildTestPackage(runtimePackage, audit);
    testPackages.push(testPackage);
    if (testPackage.test_package_ready === 'FAIL') {
      issues.push({
        code: 'TEST_PACKAGE_FAILURE',
        message: `Test package failed for ${testPackage.test_package_id}`,
        severity: 'error',
        test_package_id: testPackage.test_package_id,
      });
    }
  }

  const certificationConsumed = toStatus(
    !certificationMissing && certificationArtifact.certification_complete
  );
  const testPackageComplete = toStatus(
    testPackages.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
      testPackages.every((testPackage) => testPackage.test_package_ready === 'PASS')
  );
  const testModeEnabled = toStatus(
    testPackages.every((testPackage) => testPackage.test_mode === true)
  );
  const productionModeDisabled = toStatus(
    testPackages.every((testPackage) => testPackage.production_mode === false)
  );
  const externalCallBlocked = toStatus(
    testPackages.every((testPackage) => testPackage.external_call_allowed === false)
  );
  const gpuExecutionBlocked = toStatus(
    testPackages.every((testPackage) => testPackage.gpu_execution_allowed === false)
  );
  const testExecutionQueueValid = toStatus(
    testPackages.every((testPackage) => isTestExecutionQueueValid(testPackage))
  );
  const mockExecutionPlanReady = toStatus(
    testPackages.every((testPackage) => testPackage.mock_execution_plan.plan_ready === 'PASS')
  );
  const qualityGateTestReady = toStatus(
    testPackages.every((testPackage) => testPackage.quality_gate_test_plan.plan_ready === 'PASS')
  );
  const failureRecoveryTestReady = toStatus(
    testPackages.every((testPackage) => testPackage.failure_recovery_test_plan.plan_ready === 'PASS')
  );
  const traceabilityPreserved =
    testPackages.every((testPackage) => testPackage.traceability_chain.trace_integrity === 'PASS') &&
    certificationArtifact.runtime_package_audits.every(
      (audit) => audit.traceability_preserved === 'PASS'
    );

  const testPackageFailure = testPackageComplete === 'FAIL';
  const testModeDisabled = testModeEnabled === 'FAIL';
  const productionModeEnabled = productionModeDisabled === 'FAIL';
  const externalCallEnabled = externalCallBlocked === 'FAIL';
  const gpuExecutionEnabled = gpuExecutionBlocked === 'FAIL';
  const testExecutionQueueInvalid = testExecutionQueueValid === 'FAIL';
  const mockExecutionPlanMissing = mockExecutionPlanReady === 'FAIL';
  const qualityGateTestMissing = qualityGateTestReady === 'FAIL';
  const failureRecoveryTestMissing = failureRecoveryTestReady === 'FAIL';
  const traceabilityLoss = !traceabilityPreserved;

  const pass =
    certificationConsumed === 'PASS' &&
    testPackageComplete === 'PASS' &&
    testModeEnabled === 'PASS' &&
    productionModeDisabled === 'PASS' &&
    externalCallBlocked === 'PASS' &&
    gpuExecutionBlocked === 'PASS' &&
    testExecutionQueueValid === 'PASS' &&
    mockExecutionPlanReady === 'PASS' &&
    qualityGateTestReady === 'PASS' &&
    failureRecoveryTestReady === 'PASS' &&
    traceabilityPreserved &&
    !testPackageFailure &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: TestModeExecutionPackageArtifact = {
    package_bundle_id: 'test-mode-execution-package-v1',
    phase: TEST_MODE_EXECUTION_PACKAGE_PHASE,
    generated_at: timestamp,
    production_runtime_certification_artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    test_packages: testPackages,
    test_package_complete: pass,
  };

  const manifest: MovieAnalysisTestModeExecutionPackageManifest = {
    manifest_id: 'movie-analysis-test-mode-execution-package-manifest-v1',
    phase: TEST_MODE_EXECUTION_PACKAGE_PHASE,
    generated_at: timestamp,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    certification_consumed: certificationConsumed,
    test_package_complete: testPackageComplete,
    test_mode_enabled: testModeEnabled,
    production_mode_disabled: productionModeDisabled,
    external_call_blocked: externalCallBlocked,
    gpu_execution_blocked: gpuExecutionBlocked,
    test_execution_queue_valid: testExecutionQueueValid,
    mock_execution_plan_ready: mockExecutionPlanReady,
    quality_gate_test_ready: qualityGateTestReady,
    failure_recovery_test_ready: failureRecoveryTestReady,
    traceability_preserved: traceabilityPreserved,
    certification_status: pass ? TEST_MODE_EXECUTION_PACKAGE_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_PACKAGE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisTestModeExecutionPackageReport = {
    report_id: 'movie-analysis-test-mode-execution-package-report-v1',
    phase: TEST_MODE_EXECUTION_PACKAGE_PHASE,
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
    production_runtime_certification_report_path: PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
    production_runtime_certification_artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_export_dir: TEST_MODE_EXECUTION_PACKAGE_EXPORT_DIR,
    test_mode_execution_package_manifest_path: TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    certification_consumed: certificationConsumed,
    test_package_complete: testPackageComplete,
    test_mode_enabled: testModeEnabled,
    production_mode_disabled: productionModeDisabled,
    external_call_blocked: externalCallBlocked,
    gpu_execution_blocked: gpuExecutionBlocked,
    test_execution_queue_valid: testExecutionQueueValid,
    mock_execution_plan_ready: mockExecutionPlanReady,
    quality_gate_test_ready: qualityGateTestReady,
    failure_recovery_test_ready: failureRecoveryTestReady,
    traceability_preserved: traceabilityPreserved,
    certification_missing: false,
    test_package_failure: testPackageFailure,
    test_mode_disabled: testModeDisabled,
    production_mode_enabled: productionModeEnabled,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    test_execution_queue_invalid: testExecutionQueueInvalid,
    mock_execution_plan_missing: mockExecutionPlanMissing,
    quality_gate_test_missing: qualityGateTestMissing,
    failure_recovery_test_missing: failureRecoveryTestMissing,
    traceability_loss: traceabilityLoss,
    test_mode_execution_package_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? TEST_MODE_EXECUTION_PACKAGE_READY_STATUS : null,
    test_packages: testPackages,
    final_verdict: pass
      ? TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT
      : TEST_MODE_EXECUTION_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_PACKAGE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_PACKAGE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
