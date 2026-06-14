import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
  MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT,
  MV_TEST_EXECUTION_PACKAGE_REPORT_PATH,
  MV_TEST_EXECUTION_PACKAGE_READY_STATUS,
} from '../services/mvTestExecutionPackage.js';
import {
  EXECUTION_SCOPE_TEST_MODE_ONLY,
  MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_DIR,
  MV_TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR,
  MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_MD_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
  MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
  SAFE_CREATE_POLICY,
  writeMvTestModeExecutionAudit,
} from '../services/mvTestModeExecutionAudit.js';
import { MV_TYPE_COUNT, SUPPORTED_MV_TYPES } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const packageReportPath = path.join(projectRoot, MV_TEST_EXECUTION_PACKAGE_REPORT_PATH);
const packageArtifactPath = path.join(projectRoot, MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH);

if (!fs.existsSync(packageReportPath) || !fs.existsSync(packageArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV test execution package report or artifact');
  process.exit(1);
}

const packageReport = JSON.parse(fs.readFileSync(packageReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  mv_test_execution_package_engine_ready: string;
};

if (
  packageReport.final_verdict !== MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT ||
  packageReport.certification_status !== MV_TEST_EXECUTION_PACKAGE_READY_STATUS ||
  packageReport.mv_test_execution_package_engine_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_TEST_EXECUTION_PACKAGE_REPORT_PATH} must be ${MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT} with ${MV_TEST_EXECUTION_PACKAGE_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvTestModeExecutionAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_test_execution_package_ref=${report.source_test_execution_package_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} test_execution_audit_count=${report.test_execution_audit_count} execution_scope=${report.execution_scope} test_mode_allowed=${report.test_mode_allowed} mock_output_only=${report.mock_output_only} real_generation_blocked=${report.real_generation_blocked} runtime_not_executed=${report.runtime_not_executed} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} test_execution_package_consumed=${report.test_execution_package_consumed} execution_audit_ready=${report.execution_audit_ready} mock_execution_valid=${report.mock_execution_valid} failure_recovery_ready=${report.failure_recovery_ready} music_sync_preserved=${report.music_sync_preserved} mv_type_preserved=${report.mv_type_preserved} traceability_preserved=${report.traceability_preserved} runtime_certification_chain_complete=${report.runtime_certification_chain_complete} execution_scope_valid=${report.execution_scope_valid} production_mode_blocked=${report.production_mode_blocked} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} test_execution_package_missing=${report.test_execution_package_missing} mock_execution_invalid=${report.mock_execution_invalid} mock_output_missing=${report.mock_output_missing} test_mode_disabled=${report.test_mode_disabled} real_generation_enabled=${report.real_generation_enabled} runtime_execution_detected=${report.runtime_execution_detected} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} failure_recovery_missing=${report.failure_recovery_missing} music_sync_loss=${report.music_sync_loss} mv_type_loss=${report.mv_type_loss} traceability_loss=${report.traceability_loss} runtime_certification_chain_broken=${report.runtime_certification_chain_broken} execution_scope_invalid=${report.execution_scope_invalid} production_mode_unblocked=${report.production_mode_unblocked} safe_create_policy_violation=${report.safe_create_policy_violation} next_stage_blocked=${report.next_stage_blocked} mv_test_mode_execution_audit_ready=${report.mv_test_mode_execution_audit_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const audit of report.mv_test_execution_audits) {
  console.log(
    `  audit ${audit.mv_test_execution_audit_id}: mv_type=${audit.mv_type} units=${audit.test_execution_summary.unit_count} mock=${audit.test_execution_summary.mock_entry_count} chain=${audit.runtime_certification_chain_verified} ready=${audit.audit_ready}`
  );
}
console.log(`report=${MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH}`);
console.log(`markdown=${MV_TEST_MODE_EXECUTION_AUDIT_MD_PATH}`);
console.log(`manifest=${MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH}`);
console.log(`artifact=${MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.test_execution_audit_count !== MV_TYPE_COUNT ||
  report.mv_test_execution_audits.length !== MV_TYPE_COUNT ||
  report.audit_checks.length !== 18 ||
  report.test_execution_package_consumed !== 'PASS' ||
  report.execution_audit_ready !== 'PASS' ||
  report.mock_execution_valid !== 'PASS' ||
  report.test_mode_allowed !== true ||
  report.mock_output_only !== true ||
  report.real_generation_blocked !== true ||
  report.runtime_not_executed !== true ||
  report.external_call_blocked !== true ||
  report.gpu_execution_blocked !== true ||
  report.failure_recovery_ready !== 'PASS' ||
  report.music_sync_preserved !== 'PASS' ||
  report.mv_type_preserved !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.runtime_certification_chain_complete !== 'PASS' ||
  report.execution_scope_valid !== 'PASS' ||
  report.production_mode_blocked !== 'PASS' ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.external_call_allowed !== false ||
  report.test_execution_package_missing !== false ||
  report.mock_execution_invalid !== false ||
  report.mock_output_missing !== false ||
  report.test_mode_disabled !== false ||
  report.real_generation_enabled !== false ||
  report.runtime_execution_detected !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.failure_recovery_missing !== false ||
  report.music_sync_loss !== false ||
  report.mv_type_loss !== false ||
  report.traceability_loss !== false ||
  report.runtime_certification_chain_broken !== false ||
  report.execution_scope_invalid !== false ||
  report.production_mode_unblocked !== false ||
  report.safe_create_policy_violation !== false ||
  report.next_stage_blocked !== false ||
  report.mv_test_mode_execution_audit_ready !== 'PASS' ||
  report.certification_status !== MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.audit_checks.every((check) => check.status === 'PASS') === false ||
  report.mv_test_execution_audits.every((audit) => audit.audit_ready === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} execution audits ready, execution_scope=test_mode_only, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH), 'utf8')
) as {
  source_test_execution_package_ref: string;
  execution_scope: string;
  test_mode_allowed: boolean;
  mock_output_only: boolean;
  real_generation_blocked: boolean;
  runtime_not_executed: boolean;
  external_call_blocked: boolean;
  gpu_execution_blocked: boolean;
  runtime_certification_chain_complete: boolean;
  audit_complete: boolean;
  next_stage_ready: boolean;
  mv_test_execution_audits: Array<{
    source_test_execution_package_ref: string;
    mv_test_execution_audit_id: string;
    mv_type: string;
    execution_scope: string;
    test_execution_summary: { unit_count: number; summary_ready: string };
    mock_execution_validation: {
      mock_output_only: boolean;
      validation_ready: string;
    };
    failure_recovery_validation: { validation_ready: string };
    music_sync_validation: { validation_ready: string };
    runtime_certification_chain_verified: string;
    traceability_chain: { trace_integrity: string };
    audit_ready: string;
  }>;
  safety_flags: {
    mock_execution_only: boolean;
    mock_output_only: boolean;
    image_generation: boolean;
    video_generation: boolean;
    gpu_execution: boolean;
    generation: boolean;
    external_call_allowed: boolean;
  };
};

if (
  artifact.source_test_execution_package_ref !== MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH ||
  artifact.mv_test_execution_audits.length !== MV_TYPE_COUNT ||
  artifact.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  artifact.test_mode_allowed !== true ||
  artifact.mock_output_only !== true ||
  artifact.real_generation_blocked !== true ||
  artifact.runtime_not_executed !== true ||
  artifact.external_call_blocked !== true ||
  artifact.gpu_execution_blocked !== true ||
  artifact.runtime_certification_chain_complete !== true ||
  artifact.audit_complete !== true ||
  artifact.next_stage_ready !== true ||
  artifact.safety_flags.mock_execution_only !== true ||
  artifact.safety_flags.mock_output_only !== true ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false ||
  artifact.safety_flags.generation !== false ||
  artifact.safety_flags.external_call_allowed !== false
) {
  console.error('Artifact safety or test execution package reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const audit = artifact.mv_test_execution_audits.find((entry) => entry.mv_type === mvType);
  if (
    !audit ||
    audit.source_test_execution_package_ref !== MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH ||
    audit.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
    audit.mock_execution_validation.mock_output_only !== true ||
    audit.mock_execution_validation.validation_ready !== 'PASS' ||
    audit.failure_recovery_validation.validation_ready !== 'PASS' ||
    audit.music_sync_validation.validation_ready !== 'PASS' ||
    audit.runtime_certification_chain_verified !== 'PASS' ||
    audit.traceability_chain.trace_integrity !== 'PASS' ||
    audit.test_execution_summary.unit_count > 0 === false ||
    audit.test_execution_summary.summary_ready !== 'PASS' ||
    audit.audit_ready !== 'PASS' ||
    audit.mv_test_execution_audit_id.length === 0
  ) {
    console.error(`Test execution audit structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
