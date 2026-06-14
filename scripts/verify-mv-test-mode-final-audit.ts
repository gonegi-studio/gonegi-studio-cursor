import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  DRY_RUN_SCOPE_FULL_MV_CHAIN,
  EXPECTED_MOCK_SIMULATION_STEP_COUNT,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
} from '../services/mvTestModeDryRunCertification.js';
import {
  AUDIT_SCOPE_DIGITAL_STUDIO_MV_TEST_CHAIN,
  DIGITAL_STUDIO_AUDITED_PHASE_COUNT,
  DIGITAL_STUDIO_CHAIN_PHASE_COUNT,
  MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS,
  MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
  MV_TEST_MODE_FINAL_AUDIT_DIR,
  MV_TEST_MODE_FINAL_AUDIT_EXPORT_DIR,
  MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH,
  MV_TEST_MODE_FINAL_AUDIT_MD_PATH,
  MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT,
  MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH,
  NEXT_STAGE_GATE_LABEL,
  SAFE_CREATE_POLICY,
  writeMvTestModeFinalAudit,
} from '../services/mvTestModeFinalAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const dryRunCertReportPath = path.join(projectRoot, MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH);
const dryRunCertArtifactPath = path.join(projectRoot, MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH);

if (!fs.existsSync(dryRunCertReportPath) || !fs.existsSync(dryRunCertArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV test mode dry run certification report or artifact');
  process.exit(1);
}

const dryRunCertReport = JSON.parse(fs.readFileSync(dryRunCertReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  final_audit_allowed: string;
};

if (
  dryRunCertReport.final_verdict !== MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT ||
  dryRunCertReport.certification_status !== MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS ||
  dryRunCertReport.final_audit_allowed !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH} must be ${MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT} with ${MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS} and final_audit_allowed=PASS`
  );
  process.exit(1);
}

const report = writeMvTestModeFinalAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} audit_timestamp=${report.audit_timestamp} next_stage_approved=${report.next_stage_approved} final_audit_id=${report.final_audit_id} audit_scope=${report.audit_scope} source_dry_run_certification_ref=${report.source_dry_run_certification_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} chain_phase_count=${report.chain_phase_count} mock_simulation_step_count=${report.mock_simulation_step_count} dry_run_scope=${report.dry_run_scope} execution_scope=${report.execution_scope} dry_run_certification_consumed=${report.dry_run_certification_consumed} final_audit_completed=${report.final_audit_completed} chain_phase_count_valid=${report.chain_phase_count_valid} mock_simulation_step_count_valid=${report.mock_simulation_step_count_valid} dry_run_scope_valid=${report.dry_run_scope_valid} runtime_certification_chain_complete=${report.runtime_certification_chain_complete} runtime_certification_chain_verified=${report.runtime_certification_chain_verified} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} test_mode_allowed=${report.test_mode_allowed} real_generation_blocked=${report.real_generation_blocked_status} runtime_not_executed=${report.runtime_not_executed_status} external_call_blocked=${report.external_call_blocked_status} gpu_execution_blocked=${report.gpu_execution_blocked_status} production_mode_blocked=${report.production_mode_blocked_status} next_stage_gate_ready=${report.next_stage_gate_ready} digital_studio_test_chain_complete=${report.digital_studio_test_chain_complete} final_audit_allowed=${report.final_audit_allowed} dry_run_certification_missing=${report.dry_run_certification_missing} final_audit_failed=${report.final_audit_failed} chain_phase_count_invalid=${report.chain_phase_count_invalid} mock_simulation_step_count_invalid=${report.mock_simulation_step_count_invalid} dry_run_scope_invalid=${report.dry_run_scope_invalid} runtime_certification_chain_broken=${report.runtime_certification_chain_broken} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} test_mode_disabled=${report.test_mode_disabled} real_generation_enabled=${report.real_generation_enabled} runtime_execution_detected=${report.runtime_execution_detected} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} production_mode_unblocked=${report.production_mode_unblocked} next_stage_gate_blocked=${report.next_stage_gate_blocked} mv_test_mode_final_audit_ready=${report.mv_test_mode_final_audit_ready} next_stage_gate_label=${report.next_stage_gate_label} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const audit of report.phase_final_audits) {
  console.log(
    `  phase ${audit.phase_level}: certified=${audit.phase_certified} manifest_integrity=${audit.manifest_integrity_valid}`
  );
}
console.log(`report=${MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH}`);
console.log(`markdown=${MV_TEST_MODE_FINAL_AUDIT_MD_PATH}`);
console.log(`manifest=${MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH}`);
console.log(`artifact=${MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_FINAL_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_FINAL_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.chain_phase_count !== DIGITAL_STUDIO_CHAIN_PHASE_COUNT ||
  report.phase_final_audits.length !== DIGITAL_STUDIO_AUDITED_PHASE_COUNT ||
  report.final_audit_checks.length !== 16 ||
  report.mock_simulation_step_count !== EXPECTED_MOCK_SIMULATION_STEP_COUNT ||
  report.dry_run_scope !== DRY_RUN_SCOPE_FULL_MV_CHAIN ||
  report.audit_scope !== AUDIT_SCOPE_DIGITAL_STUDIO_MV_TEST_CHAIN ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.mock_output_only !== true ||
  report.real_generation_blocked !== true ||
  report.runtime_not_executed !== true ||
  report.external_call_blocked !== true ||
  report.gpu_execution_blocked !== true ||
  report.production_mode_blocked !== true ||
  report.dry_run_certification_consumed !== 'PASS' ||
  report.final_audit_completed !== 'PASS' ||
  report.chain_phase_count_valid !== 'PASS' ||
  report.mock_simulation_step_count_valid !== 'PASS' ||
  report.dry_run_scope_valid !== 'PASS' ||
  report.runtime_certification_chain_complete !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.test_mode_allowed !== 'PASS' ||
  report.real_generation_blocked_status !== 'PASS' ||
  report.runtime_not_executed_status !== 'PASS' ||
  report.external_call_blocked_status !== 'PASS' ||
  report.gpu_execution_blocked_status !== 'PASS' ||
  report.production_mode_blocked_status !== 'PASS' ||
  report.next_stage_gate_ready !== 'PASS' ||
  report.digital_studio_test_chain_complete !== 'PASS' ||
  report.final_audit_allowed !== 'PASS' ||
  report.dry_run_certification_missing !== false ||
  report.final_audit_failed !== false ||
  report.chain_phase_count_invalid !== false ||
  report.mock_simulation_step_count_invalid !== false ||
  report.dry_run_scope_invalid !== false ||
  report.runtime_certification_chain_broken !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.test_mode_disabled !== false ||
  report.real_generation_enabled !== false ||
  report.runtime_execution_detected !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.production_mode_unblocked !== false ||
  report.next_stage_gate_blocked !== false ||
  report.mv_test_mode_final_audit_ready !== 'PASS' ||
  report.certification_status !== MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS ||
  report.next_stage_approved !== true ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.audit_timestamp.length === 0 ||
  report.phase_final_audits.every((audit) => audit.phase_certified) === false ||
  report.phase_final_audits.every((audit) => audit.manifest_integrity_valid) === false ||
  report.final_audit_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${DIGITAL_STUDIO_AUDITED_PHASE_COUNT} Digital Studio phases certified, chain_phase_count=${DIGITAL_STUDIO_CHAIN_PHASE_COUNT}, and next stage gate ready`
  );
  process.exit(1);
}

process.exit(0);
