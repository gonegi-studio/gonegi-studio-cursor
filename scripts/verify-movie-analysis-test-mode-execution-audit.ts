import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
} from '../services/movieAnalysisProductionEngineMasterCertification.js';
import {
  SAFE_CREATE_POLICY,
  TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_AUDIT_DIR,
  TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR,
  TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
  TEST_MODE_EXECUTION_AUDIT_MD_PATH,
  TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
  TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
  writeMovieAnalysisTestModeExecutionAudit,
} from '../services/movieAnalysisTestModeExecutionAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const masterCertReportPath = path.join(projectRoot, PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH);
const masterCertArtifactPath = path.join(projectRoot, PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH);

if (!fs.existsSync(masterCertReportPath) || !fs.existsSync(masterCertArtifactPath)) {
  console.error('PRECHECK FAIL: Missing production engine master certification report or artifact');
  process.exit(1);
}

const masterCertReport = JSON.parse(fs.readFileSync(masterCertReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  test_execution_ready: boolean;
  production_execution_blocked: boolean;
};

if (
  masterCertReport.final_verdict !== PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT ||
  masterCertReport.certification_status !== PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS ||
  masterCertReport.test_execution_ready !== true ||
  masterCertReport.production_execution_blocked !== true
) {
  console.error(
    `PRECHECK FAIL: ${PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH} must be ${PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT} with ${PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS}, test_execution_ready=true, production_execution_blocked=true`
  );
  process.exit(1);
}

const report = writeMovieAnalysisTestModeExecutionAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} test_package_count=${report.test_package_count} master_certification_verified=${report.master_certification_verified} test_execution_ready=${report.test_execution_ready} production_execution_blocked=${report.production_execution_blocked} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} runtime_not_executed=${report.runtime_not_executed} mock_output_only=${report.mock_output_only} real_generation=${report.real_generation} traceability_preserved=${report.traceability_preserved} memory_bindings_preserved=${report.memory_bindings_preserved} safe_create_policy_preserved=${report.safe_create_policy_preserved} audit_complete=${report.audit_complete} test_mode_ready=${report.test_mode_ready} execution_simulation_ready=${report.execution_simulation_ready} production_still_blocked=${report.production_still_blocked} master_certification_missing=${report.master_certification_missing} test_execution_not_ready=${report.test_execution_not_ready} production_execution_unblocked=${report.production_execution_unblocked} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} runtime_execution_detected=${report.runtime_execution_detected} real_generation_detected=${report.real_generation_detected} mock_output_missing=${report.mock_output_missing} traceability_loss=${report.traceability_loss} memory_binding_loss=${report.memory_binding_loss} safe_create_policy_violation=${report.safe_create_policy_violation} test_mode_execution_audit_ready=${report.test_mode_execution_audit_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const audit of report.test_package_audits) {
  console.log(
    `  package ${audit.test_package_id}: ready=${audit.package_audit_ready} mock_only=${audit.mock_output_only} real_gen=${audit.real_generation}`
  );
}
console.log(`report=${TEST_MODE_EXECUTION_AUDIT_REPORT_PATH}`);
console.log(`markdown=${TEST_MODE_EXECUTION_AUDIT_MD_PATH}`);
console.log(`manifest=${TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH}`);
console.log(`artifact=${TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.test_package_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.audit_checks.length !== 11 ||
  report.test_package_audits.length !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.master_certification_verified !== 'PASS' ||
  report.test_execution_ready !== 'PASS' ||
  report.production_execution_blocked !== 'PASS' ||
  report.external_call_blocked !== 'PASS' ||
  report.gpu_execution_blocked !== 'PASS' ||
  report.runtime_not_executed !== 'PASS' ||
  report.mock_output_only !== true ||
  report.real_generation !== false ||
  report.traceability_preserved !== true ||
  report.memory_bindings_preserved !== 'PASS' ||
  report.safe_create_policy_preserved !== 'PASS' ||
  report.audit_complete !== 'PASS' ||
  report.test_mode_ready !== 'PASS' ||
  report.execution_simulation_ready !== 'PASS' ||
  report.production_still_blocked !== 'PASS' ||
  report.master_certification_missing !== false ||
  report.test_execution_not_ready !== false ||
  report.production_execution_unblocked !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.runtime_execution_detected !== false ||
  report.real_generation_detected !== false ||
  report.mock_output_missing !== false ||
  report.traceability_loss !== false ||
  report.memory_binding_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.test_mode_execution_audit_ready !== 'PASS' ||
  report.certification_status !== TEST_MODE_EXECUTION_AUDIT_READY_STATUS ||
  report.test_package_audits.every((audit) => audit.package_audit_ready === 'PASS') === false ||
  report.test_package_audits.every((audit) => audit.mock_output_only === true) === false ||
  report.audit_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    `Expected PASS with mock output only, real generation disabled, and ${PRODUCTION_BLUEPRINT_TYPE_COUNT} test packages audit-ready`
  );
  process.exit(1);
}

process.exit(0);
