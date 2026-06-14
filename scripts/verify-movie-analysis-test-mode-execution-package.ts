import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  PRODUCTION_RUNTIME_CERTIFIED_STATUS,
} from '../services/movieAnalysisProductionRuntimeCertification.js';
import {
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_DIR,
  TEST_MODE_EXECUTION_PACKAGE_EXPORT_DIR,
  TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH,
  TEST_MODE_EXECUTION_PACKAGE_MD_PATH,
  TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
  TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
  writeMovieAnalysisTestModeExecutionPackage,
} from '../services/movieAnalysisTestModeExecutionPackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const certificationReportPath = path.join(projectRoot, PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH);
const certificationArtifactPath = path.join(projectRoot, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);

if (!fs.existsSync(certificationReportPath) || !fs.existsSync(certificationArtifactPath)) {
  console.error('PRECHECK FAIL: Missing production runtime certification report or artifact');
  process.exit(1);
}

const certificationReport = JSON.parse(fs.readFileSync(certificationReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  test_mode_allowed?: boolean;
  production_mode_blocked?: boolean;
  runtime_not_executed?: boolean;
};

if (
  certificationReport.final_verdict !== PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT ||
  certificationReport.certification_status !== PRODUCTION_RUNTIME_CERTIFIED_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH} must be ${PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT} with ${PRODUCTION_RUNTIME_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

const certificationArtifact = JSON.parse(fs.readFileSync(certificationArtifactPath, 'utf8')) as {
  test_mode_allowed: boolean;
  production_mode_blocked: boolean;
  runtime_not_executed: boolean;
};

if (
  certificationArtifact.test_mode_allowed !== true ||
  certificationArtifact.production_mode_blocked !== true ||
  certificationArtifact.runtime_not_executed !== true
) {
  console.error(
    'PRECHECK FAIL: certification artifact must have test_mode_allowed=true, production_mode_blocked=true, runtime_not_executed=true'
  );
  process.exit(1);
}

const report = writeMovieAnalysisTestModeExecutionPackage(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} certification_consumed=${report.certification_consumed} test_package_complete=${report.test_package_complete} test_mode_enabled=${report.test_mode_enabled} production_mode_disabled=${report.production_mode_disabled} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} test_execution_queue_valid=${report.test_execution_queue_valid} mock_execution_plan_ready=${report.mock_execution_plan_ready} quality_gate_test_ready=${report.quality_gate_test_ready} failure_recovery_test_ready=${report.failure_recovery_test_ready} traceability_preserved=${report.traceability_preserved} certification_missing=${report.certification_missing} test_package_failure=${report.test_package_failure} test_mode_disabled=${report.test_mode_disabled} production_mode_enabled=${report.production_mode_enabled} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} test_execution_queue_invalid=${report.test_execution_queue_invalid} mock_execution_plan_missing=${report.mock_execution_plan_missing} quality_gate_test_missing=${report.quality_gate_test_missing} failure_recovery_test_missing=${report.failure_recovery_test_missing} traceability_loss=${report.traceability_loss} test_mode_execution_package_ready=${report.test_mode_execution_package_ready}`
);
for (const testPackage of report.test_packages) {
  console.log(
    `  package ${testPackage.test_package_id}: ready=${testPackage.test_package_ready} units=${testPackage.test_units.length} test_mode=${testPackage.test_mode}`
  );
}
console.log(`report=${TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH}`);
console.log(`markdown=${TEST_MODE_EXECUTION_PACKAGE_MD_PATH}`);
console.log(`manifest=${TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH}`);
console.log(`artifact=${TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_PACKAGE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_PACKAGE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.test_package_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.certification_consumed !== 'PASS' ||
  report.test_package_complete !== 'PASS' ||
  report.test_mode_enabled !== 'PASS' ||
  report.production_mode_disabled !== 'PASS' ||
  report.external_call_blocked !== 'PASS' ||
  report.gpu_execution_blocked !== 'PASS' ||
  report.test_execution_queue_valid !== 'PASS' ||
  report.mock_execution_plan_ready !== 'PASS' ||
  report.quality_gate_test_ready !== 'PASS' ||
  report.failure_recovery_test_ready !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.test_mode_execution_package_ready !== 'PASS' ||
  report.certification_status !== TEST_MODE_EXECUTION_PACKAGE_READY_STATUS ||
  report.certification_missing !== false ||
  report.test_package_failure !== false ||
  report.test_mode_disabled !== false ||
  report.production_mode_enabled !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.test_execution_queue_invalid !== false ||
  report.mock_execution_plan_missing !== false ||
  report.quality_gate_test_missing !== false ||
  report.failure_recovery_test_missing !== false ||
  report.traceability_loss !== false ||
  report.test_packages.length !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.test_packages.every((testPackage) => testPackage.test_package_ready === 'PASS') === false ||
  report.test_packages.every((testPackage) => testPackage.test_mode === true) === false ||
  report.test_packages.every((testPackage) => testPackage.production_mode === false) === false
) {
  console.error(
    'Expected PASS with test packages complete, test mode enabled, production mode disabled, and traceability intact'
  );
  process.exit(1);
}

process.exit(0);
