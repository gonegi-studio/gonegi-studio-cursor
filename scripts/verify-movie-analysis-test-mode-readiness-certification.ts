import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { PRODUCTION_BLUEPRINT_TYPE_COUNT } from '../services/movieAnalysisProductionBlueprintExpansion.js';
import {
  LEVEL3_READINESS_PHASE_COUNT,
  SAFE_CREATE_POLICY,
  TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_READINESS_CERTIFICATION_DIR,
  TEST_MODE_READINESS_CERTIFICATION_EXPORT_DIR,
  TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH,
  TEST_MODE_READINESS_CERTIFICATION_MD_PATH,
  TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
  TEST_MODE_READY_FOR_NEXT_STAGE_STATUS,
  writeMovieAnalysisTestModeReadinessCertification,
} from '../services/movieAnalysisTestModeReadinessCertification.js';
import {
  TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
  TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
} from '../services/movieAnalysisTestModeExecutionAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const executionAuditReportPath = path.join(projectRoot, TEST_MODE_EXECUTION_AUDIT_REPORT_PATH);
const executionAuditArtifactPath = path.join(projectRoot, TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH);

if (!fs.existsSync(executionAuditReportPath) || !fs.existsSync(executionAuditArtifactPath)) {
  console.error('PRECHECK FAIL: Missing test mode execution audit report or artifact');
  process.exit(1);
}

const executionAuditReport = JSON.parse(fs.readFileSync(executionAuditReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  executionAuditReport.final_verdict !== TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT ||
  executionAuditReport.certification_status !== TEST_MODE_EXECUTION_AUDIT_READY_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${TEST_MODE_EXECUTION_AUDIT_REPORT_PATH} must be ${TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT} with ${TEST_MODE_EXECUTION_AUDIT_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisTestModeReadinessCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level3_readiness_phase_count=${report.level3_readiness_phase_count} test_execution_ready=${report.test_execution_ready} execution_simulation_ready=${report.execution_simulation_ready} dry_run_allowed=${report.dry_run_allowed} test_runtime_package_ready=${report.test_runtime_package_ready} mock_output_only=${report.mock_output_only} real_generation=${report.real_generation} production_execution_blocked=${report.production_execution_blocked} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} traceability_preserved=${report.traceability_preserved} memory_bindings_preserved=${report.memory_bindings_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} readiness_certification_complete=${report.readiness_certification_complete} test_mode_ready_for_next_stage=${report.test_mode_ready_for_next_stage} mock_execution_verified=${report.mock_execution_verified} production_still_blocked=${report.production_still_blocked} test_execution_not_ready=${report.test_execution_not_ready} execution_simulation_not_ready=${report.execution_simulation_not_ready} dry_run_not_allowed=${report.dry_run_not_allowed} test_runtime_package_missing=${report.test_runtime_package_missing} real_generation_detected=${report.real_generation_detected} production_execution_unblocked=${report.production_execution_unblocked} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} traceability_loss=${report.traceability_loss} memory_binding_loss=${report.memory_binding_loss} safe_create_policy_violation=${report.safe_create_policy_violation} test_mode_readiness_certification_ready=${report.test_mode_readiness_certification_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const audit of report.phase_readiness_audits) {
  console.log(`  phase ${audit.phase_level}: certified=${audit.phase_certified}`);
}
console.log(`report=${TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${TEST_MODE_READINESS_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_READINESS_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_READINESS_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level3_readiness_phase_count !== LEVEL3_READINESS_PHASE_COUNT ||
  report.phase_readiness_audits.length !== LEVEL3_READINESS_PHASE_COUNT ||
  report.certification_checks.length !== 12 ||
  report.test_execution_ready !== 'PASS' ||
  report.execution_simulation_ready !== 'PASS' ||
  report.dry_run_allowed !== true ||
  report.test_runtime_package_ready !== true ||
  report.mock_output_only !== true ||
  report.real_generation !== false ||
  report.production_execution_blocked !== 'PASS' ||
  report.external_call_blocked !== 'PASS' ||
  report.gpu_execution_blocked !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.memory_bindings_preserved !== 'PASS' ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.readiness_certification_complete !== 'PASS' ||
  report.test_mode_ready_for_next_stage !== 'PASS' ||
  report.mock_execution_verified !== 'PASS' ||
  report.production_still_blocked !== 'PASS' ||
  report.test_execution_not_ready !== false ||
  report.execution_simulation_not_ready !== false ||
  report.dry_run_not_allowed !== false ||
  report.test_runtime_package_missing !== false ||
  report.real_generation_detected !== false ||
  report.production_execution_unblocked !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.traceability_loss !== false ||
  report.memory_binding_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.test_mode_readiness_certification_ready !== 'PASS' ||
  report.certification_status !== TEST_MODE_READY_FOR_NEXT_STAGE_STATUS ||
  report.phase_readiness_audits.every((audit) => audit.phase_certified) === false ||
  report.certification_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${LEVEL3_READINESS_PHASE_COUNT} Level3 phases certified, dry_run_allowed=true, test_runtime_package_ready=true, and ${PRODUCTION_BLUEPRINT_TYPE_COUNT} test packages ready`
  );
  process.exit(1);
}

process.exit(0);
