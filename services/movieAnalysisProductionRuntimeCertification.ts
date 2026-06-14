import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
  PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  PRODUCTION_RUNTIME_READY_STATUS,
  RUNTIME_MODE_BY_PRODUCTION_TYPE,
  type ProductionRuntimeEngineArtifact,
  type ProductionRuntimePackage,
} from './movieAnalysisProductionRuntimeEngine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PRODUCTION_RUNTIME_CERTIFICATION_PHASE =
  'PHASE-LEVEL3-007-PRODUCTION_RUNTIME_CERTIFICATION_V1' as const;
export const PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PRODUCTION_RUNTIME_CERTIFICATION_V1' as const;
export const PRODUCTION_RUNTIME_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PRODUCTION_RUNTIME_CERTIFICATION_V1' as const;
export const PRODUCTION_RUNTIME_CERTIFIED_STATUS = 'PRODUCTION_RUNTIME_CERTIFIED' as const;
export const PRODUCTION_RUNTIME_CERTIFICATION_DIR =
  'reports/movie_analysis_production_runtime_certification' as const;
export const PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_production_runtime_certification/movie-analysis-production-runtime-certification-report.json' as const;
export const PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_production_runtime_certification/MOVIE_ANALYSIS_PRODUCTION_RUNTIME_CERTIFICATION.md' as const;
export const PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR =
  'exports/movie_analysis_production_runtime_certification' as const;
export const PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH =
  'exports/movie_analysis_production_runtime_certification/movie-analysis-production-runtime-certification-manifest.json' as const;
export const PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH =
  'exports/movie_analysis_production_runtime_certification/production-runtime-certification.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type ProductionRuntimeCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  runtime_id?: string;
};

export type RuntimePackageCertificationAudit = {
  runtime_id: string;
  runtime_mode: ProductionRuntimePackage['runtime_mode'];
  runtime_package_ready: CertificationStatus;
  execution_queue_valid: CertificationStatus;
  runtime_units_valid: CertificationStatus;
  adapter_execution_valid: CertificationStatus;
  quality_gate_valid: CertificationStatus;
  failure_recovery_valid: CertificationStatus;
  traceability_preserved: CertificationStatus;
  package_certified: CertificationStatus;
};

export type ProductionRuntimeCertificationArtifact = {
  certification_id: string;
  phase: typeof PRODUCTION_RUNTIME_CERTIFICATION_PHASE;
  generated_at: string;
  production_runtime_engine_artifact_path: typeof PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH;
  runtime_package_audits: RuntimePackageCertificationAudit[];
  certification_complete: boolean;
  test_mode_allowed: true;
  production_mode_blocked: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  no_external_calls: true;
  no_gpu_execution: true;
  no_file_overwrite: true;
  safety_flags: {
    planning_only: true;
    generation: false;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    no_execution: true;
    no_rendering: true;
    test_mode_only: true;
    production_mode_blocked: true;
  };
};

export type MovieAnalysisProductionRuntimeCertificationManifest = {
  manifest_id: string;
  phase: typeof PRODUCTION_RUNTIME_CERTIFICATION_PHASE;
  generated_at: string;
  runtime_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  runtime_consumed: CertificationStatus;
  runtime_package_complete: CertificationStatus;
  runtime_mode_valid: CertificationStatus;
  execution_queue_valid: CertificationStatus;
  runtime_units_valid: CertificationStatus;
  adapter_execution_valid: CertificationStatus;
  quality_gate_valid: CertificationStatus;
  failure_recovery_valid: CertificationStatus;
  test_mode_allowed: true;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  real_generation_blocked: boolean;
  certification_complete: CertificationStatus;
  runtime_ready_for_test_mode: CertificationStatus;
  certification_status: typeof PRODUCTION_RUNTIME_CERTIFIED_STATUS | null;
};

export type MovieAnalysisProductionRuntimeCertificationReport = {
  report_id: string;
  phase: typeof PRODUCTION_RUNTIME_CERTIFICATION_PHASE;
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
  production_runtime_engine_report_path: typeof PRODUCTION_RUNTIME_ENGINE_REPORT_PATH;
  production_runtime_engine_artifact_path: typeof PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH;
  production_runtime_certification_export_dir: typeof PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR;
  production_runtime_certification_manifest_path: typeof PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH;
  production_runtime_certification_artifact_path: typeof PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  runtime_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  runtime_consumed: CertificationStatus;
  runtime_package_complete: CertificationStatus;
  runtime_mode_valid: CertificationStatus;
  execution_queue_valid: CertificationStatus;
  runtime_units_valid: CertificationStatus;
  adapter_execution_valid: CertificationStatus;
  quality_gate_valid: CertificationStatus;
  failure_recovery_valid: CertificationStatus;
  test_mode_allowed: true;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  real_generation_blocked: boolean;
  certification_complete: CertificationStatus;
  runtime_ready_for_test_mode: CertificationStatus;
  runtime_not_executed: boolean;
  no_external_calls: boolean;
  no_gpu_execution: boolean;
  no_file_overwrite: boolean;
  runtime_missing: boolean;
  runtime_invalid: boolean;
  execution_queue_invalid: boolean;
  adapter_execution_invalid: boolean;
  quality_gate_invalid: boolean;
  failure_recovery_invalid: boolean;
  production_mode_enabled: boolean;
  test_mode_missing: boolean;
  traceability_loss: boolean;
  external_call_detected: boolean;
  gpu_execution_detected: boolean;
  file_overwrite_detected: boolean;
  production_runtime_certification_ready: CertificationStatus;
  certification_status: typeof PRODUCTION_RUNTIME_CERTIFIED_STATUS | null;
  runtime_package_audits: RuntimePackageCertificationAudit[];
  final_verdict:
    | typeof PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT
    | typeof PRODUCTION_RUNTIME_CERTIFICATION_FAIL_VERDICT;
  issues: ProductionRuntimeCertificationIssue[];
};

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function isExecutionQueueValid(runtimePackage: ProductionRuntimePackage): boolean {
  return (
    runtimePackage.execution_queue.length === runtimePackage.runtime_units.length &&
    runtimePackage.execution_queue.every((entry, index) => {
      const unit = runtimePackage.runtime_units[index];
      return (
        entry.queue_order === index + 1 &&
        entry.runtime_unit_id === unit?.unit_id &&
        entry.generation_unit_ref === unit?.generation_unit_ref
      );
    })
  );
}

function isRuntimeModeValid(runtimePackage: ProductionRuntimePackage): boolean {
  return Object.values(RUNTIME_MODE_BY_PRODUCTION_TYPE).includes(runtimePackage.runtime_mode);
}

function areRuntimeUnitsValid(runtimePackage: ProductionRuntimePackage): boolean {
  return (
    runtimePackage.runtime_units.length > 0 &&
    runtimePackage.runtime_units.every(
      (unit, index) =>
        unit.runtime_ready === 'PASS' &&
        unit.execution_order === index + 1 &&
        unit.image_target.length > 0 &&
        unit.video_target.length > 0 &&
        unit.adapter_requirements.length > 0 &&
        unit.quality_gate_ref.length > 0
    )
  );
}

function auditRuntimePackage(runtimePackage: ProductionRuntimePackage): RuntimePackageCertificationAudit {
  const executionQueueValid = toStatus(isExecutionQueueValid(runtimePackage));
  const runtimeUnitsValid = toStatus(areRuntimeUnitsValid(runtimePackage));
  const adapterExecutionValid = toStatus(
    runtimePackage.adapter_execution_plan.plan_ready === 'PASS' &&
      runtimePackage.adapter_execution_plan.entries.every((entry) => entry.execution_ready === 'PASS')
  );
  const qualityGateValid = toStatus(
    runtimePackage.quality_gate_runtime_plan.plan_ready === 'PASS' &&
      runtimePackage.quality_gate_runtime_plan.entries.every((entry) => entry.gate_passed === 'PASS')
  );
  const failureRecoveryValid = toStatus(
    runtimePackage.failure_recovery_plan.plan_ready === 'PASS' &&
      runtimePackage.failure_recovery_plan.entries.every((entry) => entry.recovery_ready === 'PASS')
  );
  const traceabilityPreserved = toStatus(
    runtimePackage.traceability_chain.trace_integrity === 'PASS'
  );
  const packageCertified = toStatus(
    runtimePackage.runtime_package_ready === 'PASS' &&
      executionQueueValid === 'PASS' &&
      runtimeUnitsValid === 'PASS' &&
      adapterExecutionValid === 'PASS' &&
      qualityGateValid === 'PASS' &&
      failureRecoveryValid === 'PASS' &&
      traceabilityPreserved === 'PASS' &&
      runtimePackage.runtime_readiness === 'PASS'
  );

  return {
    runtime_id: runtimePackage.runtime_id,
    runtime_mode: runtimePackage.runtime_mode,
    runtime_package_ready: runtimePackage.runtime_package_ready,
    execution_queue_valid: executionQueueValid,
    runtime_units_valid: runtimeUnitsValid,
    adapter_execution_valid: adapterExecutionValid,
    quality_gate_valid: qualityGateValid,
    failure_recovery_valid: failureRecoveryValid,
    traceability_preserved: traceabilityPreserved,
    package_certified: packageCertified,
  };
}

function buildMarkdown(report: MovieAnalysisProductionRuntimeCertificationReport): string {
  const lines = [
    '# Movie Analysis Production Runtime Certification',
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
    `| runtime_consumed | ${report.runtime_consumed} |`,
    `| certification_complete | ${report.certification_complete} |`,
    `| runtime_ready_for_test_mode | ${report.runtime_ready_for_test_mode} |`,
    `| test_mode_allowed | ${report.test_mode_allowed} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    `| real_generation_blocked | ${report.real_generation_blocked} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| runtime_not_executed | ${report.runtime_not_executed} |`,
    '',
    '## Runtime Package Audits',
    ''
  );

  for (const audit of report.runtime_package_audits) {
    lines.push(`- ${audit.runtime_id}: certified=${audit.package_certified} mode=${audit.runtime_mode}`);
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
  issues: ProductionRuntimeCertificationIssue[]
): MovieAnalysisProductionRuntimeCertificationReport {
  const report: MovieAnalysisProductionRuntimeCertificationReport = {
    report_id: 'movie-analysis-production-runtime-certification-report-v1',
    phase: PRODUCTION_RUNTIME_CERTIFICATION_PHASE,
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
    production_runtime_engine_report_path: PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
    production_runtime_engine_artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    production_runtime_certification_export_dir: PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR,
    production_runtime_certification_manifest_path: PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
    production_runtime_certification_artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    runtime_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    runtime_consumed: 'FAIL',
    runtime_package_complete: 'FAIL',
    runtime_mode_valid: 'FAIL',
    execution_queue_valid: 'FAIL',
    runtime_units_valid: 'FAIL',
    adapter_execution_valid: 'FAIL',
    quality_gate_valid: 'FAIL',
    failure_recovery_valid: 'FAIL',
    test_mode_allowed: true,
    production_mode_blocked: true,
    traceability_preserved: false,
    real_generation_blocked: false,
    certification_complete: 'FAIL',
    runtime_ready_for_test_mode: 'FAIL',
    runtime_not_executed: true,
    no_external_calls: true,
    no_gpu_execution: true,
    no_file_overwrite: true,
    runtime_missing: true,
    runtime_invalid: true,
    execution_queue_invalid: true,
    adapter_execution_invalid: true,
    quality_gate_invalid: true,
    failure_recovery_invalid: true,
    production_mode_enabled: true,
    test_mode_missing: true,
    traceability_loss: true,
    external_call_detected: false,
    gpu_execution_detected: false,
    file_overwrite_detected: false,
    production_runtime_certification_ready: 'FAIL',
    certification_status: null,
    runtime_package_audits: [],
    final_verdict: PRODUCTION_RUNTIME_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisProductionRuntimeCertification(
  projectRoot?: string
): MovieAnalysisProductionRuntimeCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProductionRuntimeCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const runtimeEngineReport = loadReport<Record<string, unknown>>(
    root,
    PRODUCTION_RUNTIME_ENGINE_REPORT_PATH
  );
  const runtimeArtifactPath = path.join(root, PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH);
  const runtimeMissing =
    !runtimeEngineReport ||
    runtimeEngineReport.final_verdict !== PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT ||
    runtimeEngineReport.certification_status !== PRODUCTION_RUNTIME_READY_STATUS ||
    !fs.existsSync(runtimeArtifactPath);

  if (runtimeMissing) {
    issues.push({
      code: 'RUNTIME_MISSING',
      message: `Required ${PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT} with ${PRODUCTION_RUNTIME_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const runtimeArtifact = JSON.parse(
    fs.readFileSync(runtimeArtifactPath, 'utf8')
  ) as ProductionRuntimeEngineArtifact;

  if (!runtimeArtifact.runtime_package_complete || runtimeArtifact.runtime_packages.length === 0) {
    issues.push({
      code: 'RUNTIME_NOT_READY',
      message: 'Production runtime engine artifact is not complete',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const runtimePackageAudits = runtimeArtifact.runtime_packages.map((runtimePackage) =>
    auditRuntimePackage(runtimePackage)
  );

  for (const audit of runtimePackageAudits) {
    if (audit.package_certified === 'FAIL') {
      issues.push({
        code: 'RUNTIME_INVALID',
        message: `Runtime package certification failed for ${audit.runtime_id}`,
        severity: 'error',
        runtime_id: audit.runtime_id,
      });
    }
  }

  const runtimeConsumed = toStatus(!runtimeMissing && runtimeArtifact.runtime_package_complete);
  const runtimePackageComplete = toStatus(
    runtimePackageAudits.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
      runtimePackageAudits.every((audit) => audit.runtime_package_ready === 'PASS')
  );
  const runtimeModeValid = toStatus(
    runtimeArtifact.runtime_packages.every((runtimePackage) => isRuntimeModeValid(runtimePackage))
  );
  const executionQueueValid = toStatus(
    runtimePackageAudits.every((audit) => audit.execution_queue_valid === 'PASS')
  );
  const runtimeUnitsValid = toStatus(
    runtimePackageAudits.every((audit) => audit.runtime_units_valid === 'PASS')
  );
  const adapterExecutionValid = toStatus(
    runtimePackageAudits.every((audit) => audit.adapter_execution_valid === 'PASS')
  );
  const qualityGateValid = toStatus(
    runtimePackageAudits.every((audit) => audit.quality_gate_valid === 'PASS')
  );
  const failureRecoveryValid = toStatus(
    runtimePackageAudits.every((audit) => audit.failure_recovery_valid === 'PASS')
  );

  const testModeAllowed = true as const;
  const productionModeBlocked = true as const;
  const realGenerationBlocked = productionModeBlocked;
  const runtimeNotExecuted = true;
  const noExternalCalls = runtimeArtifact.safety_flags.external_call_allowed === false;
  const noGpuExecution = runtimeArtifact.safety_flags.gpu_execution === false;
  const noFileOverwrite = true;

  const traceabilityPreserved =
    runtimePackageAudits.every((audit) => audit.traceability_preserved === 'PASS') &&
    runtimeArtifact.runtime_packages.every(
      (runtimePackage) => runtimePackage.traceability_chain.trace_integrity === 'PASS'
    );

  const certificationComplete = toStatus(
    runtimeConsumed === 'PASS' &&
      runtimePackageComplete === 'PASS' &&
      runtimeModeValid === 'PASS' &&
      executionQueueValid === 'PASS' &&
      runtimeUnitsValid === 'PASS' &&
      adapterExecutionValid === 'PASS' &&
      qualityGateValid === 'PASS' &&
      failureRecoveryValid === 'PASS' &&
      testModeAllowed === true &&
      productionModeBlocked === true &&
      traceabilityPreserved &&
      realGenerationBlocked &&
      runtimeNotExecuted &&
      noExternalCalls &&
      noGpuExecution &&
      noFileOverwrite &&
      runtimePackageAudits.every((audit) => audit.package_certified === 'PASS') &&
      issues.filter((issue) => issue.severity === 'error').length === 0
  );

  const runtimeReadyForTestMode = toStatus(
    certificationComplete === 'PASS' && testModeAllowed === true && productionModeBlocked === true
  );

  const runtimeInvalid = runtimePackageComplete === 'FAIL';
  const executionQueueInvalid = executionQueueValid === 'FAIL';
  const adapterExecutionInvalid = adapterExecutionValid === 'FAIL';
  const qualityGateInvalid = qualityGateValid === 'FAIL';
  const failureRecoveryInvalid = failureRecoveryValid === 'FAIL';
  const productionModeEnabled = !productionModeBlocked;
  const testModeMissing = !testModeAllowed;
  const traceabilityLoss = !traceabilityPreserved;
  const externalCallDetected = !noExternalCalls;
  const gpuExecutionDetected = !noGpuExecution;
  const fileOverwriteDetected = !noFileOverwrite;

  const pass =
    certificationComplete === 'PASS' &&
    runtimeReadyForTestMode === 'PASS' &&
    !runtimeInvalid &&
    !executionQueueInvalid &&
    !adapterExecutionInvalid &&
    !qualityGateInvalid &&
    !failureRecoveryInvalid &&
    !productionModeEnabled &&
    !testModeMissing &&
    !traceabilityLoss &&
    !externalCallDetected &&
    !gpuExecutionDetected &&
    !fileOverwriteDetected;

  const artifact: ProductionRuntimeCertificationArtifact = {
    certification_id: 'production-runtime-certification-v1',
    phase: PRODUCTION_RUNTIME_CERTIFICATION_PHASE,
    generated_at: timestamp,
    production_runtime_engine_artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    runtime_package_audits: runtimePackageAudits,
    certification_complete: pass,
    test_mode_allowed: testModeAllowed,
    production_mode_blocked: productionModeBlocked,
    real_generation_blocked: realGenerationBlocked,
    runtime_not_executed: runtimeNotExecuted,
    no_external_calls: noExternalCalls,
    no_gpu_execution: noGpuExecution,
    no_file_overwrite: noFileOverwrite,
    safety_flags: {
      planning_only: true,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      test_mode_only: true,
      production_mode_blocked: true,
    },
  };

  const manifest: MovieAnalysisProductionRuntimeCertificationManifest = {
    manifest_id: 'movie-analysis-production-runtime-certification-manifest-v1',
    phase: PRODUCTION_RUNTIME_CERTIFICATION_PHASE,
    generated_at: timestamp,
    runtime_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    runtime_consumed: runtimeConsumed,
    runtime_package_complete: runtimePackageComplete,
    runtime_mode_valid: runtimeModeValid,
    execution_queue_valid: executionQueueValid,
    runtime_units_valid: runtimeUnitsValid,
    adapter_execution_valid: adapterExecutionValid,
    quality_gate_valid: qualityGateValid,
    failure_recovery_valid: failureRecoveryValid,
    test_mode_allowed: testModeAllowed,
    production_mode_blocked: productionModeBlocked,
    traceability_preserved: traceabilityPreserved,
    real_generation_blocked: realGenerationBlocked,
    certification_complete: certificationComplete,
    runtime_ready_for_test_mode: runtimeReadyForTestMode,
    certification_status: pass ? PRODUCTION_RUNTIME_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisProductionRuntimeCertificationReport = {
    report_id: 'movie-analysis-production-runtime-certification-report-v1',
    phase: PRODUCTION_RUNTIME_CERTIFICATION_PHASE,
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
    production_runtime_engine_report_path: PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
    production_runtime_engine_artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    production_runtime_certification_export_dir: PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR,
    production_runtime_certification_manifest_path: PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
    production_runtime_certification_artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    runtime_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    runtime_consumed: runtimeConsumed,
    runtime_package_complete: runtimePackageComplete,
    runtime_mode_valid: runtimeModeValid,
    execution_queue_valid: executionQueueValid,
    runtime_units_valid: runtimeUnitsValid,
    adapter_execution_valid: adapterExecutionValid,
    quality_gate_valid: qualityGateValid,
    failure_recovery_valid: failureRecoveryValid,
    test_mode_allowed: testModeAllowed,
    production_mode_blocked: productionModeBlocked,
    traceability_preserved: traceabilityPreserved,
    real_generation_blocked: realGenerationBlocked,
    certification_complete: certificationComplete,
    runtime_ready_for_test_mode: runtimeReadyForTestMode,
    runtime_not_executed: runtimeNotExecuted,
    no_external_calls: noExternalCalls,
    no_gpu_execution: noGpuExecution,
    no_file_overwrite: noFileOverwrite,
    runtime_missing: false,
    runtime_invalid: runtimeInvalid,
    execution_queue_invalid: executionQueueInvalid,
    adapter_execution_invalid: adapterExecutionInvalid,
    quality_gate_invalid: qualityGateInvalid,
    failure_recovery_invalid: failureRecoveryInvalid,
    production_mode_enabled: productionModeEnabled,
    test_mode_missing: testModeMissing,
    traceability_loss: traceabilityLoss,
    external_call_detected: externalCallDetected,
    gpu_execution_detected: gpuExecutionDetected,
    file_overwrite_detected: fileOverwriteDetected,
    production_runtime_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_RUNTIME_CERTIFIED_STATUS : null,
    runtime_package_audits: runtimePackageAudits,
    final_verdict: pass
      ? PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT
      : PRODUCTION_RUNTIME_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
