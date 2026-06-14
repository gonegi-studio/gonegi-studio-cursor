import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  EXECUTION_SCOPE_TEST_MODE_ONLY,
  MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
  MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
} from '../services/mvTestModeExecutionAudit.js';
import {
  MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_DIR,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS,
  SAFE_CREATE_POLICY,
  writeMvTestModeExecutionCertification,
} from '../services/mvTestModeExecutionCertification.js';
import { MV_TYPE_COUNT, SUPPORTED_MV_TYPES } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const auditReportPath = path.join(projectRoot, MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH);
const auditArtifactPath = path.join(projectRoot, MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH);

if (!fs.existsSync(auditReportPath) || !fs.existsSync(auditArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV test mode execution audit report or artifact');
  process.exit(1);
}

const auditReport = JSON.parse(fs.readFileSync(auditReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  mv_test_mode_execution_audit_ready: string;
};

if (
  auditReport.final_verdict !== MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT ||
  auditReport.certification_status !== MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS ||
  auditReport.mv_test_mode_execution_audit_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH} must be ${MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT} with ${MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvTestModeExecutionCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_execution_audit_ref=${report.source_execution_audit_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} test_execution_certification_count=${report.test_execution_certification_count} execution_scope=${report.execution_scope} mock_output_only=${report.mock_output_only} test_mode_allowed=${report.test_mode_allowed} real_generation_blocked=${report.real_generation_blocked} runtime_not_executed=${report.runtime_not_executed} execution_audit_consumed=${report.execution_audit_consumed} test_execution_certified=${report.test_execution_certified} execution_scope_valid=${report.execution_scope_valid} mock_output_verified=${report.mock_output_verified} runtime_certification_chain_complete=${report.runtime_certification_chain_complete} traceability_preserved=${report.traceability_preserved} production_mode_blocked=${report.production_mode_blocked} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} dry_run_allowed=${report.dry_run_allowed} execution_audit_missing=${report.execution_audit_missing} execution_scope_invalid=${report.execution_scope_invalid} mock_output_missing=${report.mock_output_missing} test_mode_disabled=${report.test_mode_disabled} real_generation_enabled=${report.real_generation_enabled} runtime_execution_detected=${report.runtime_execution_detected} runtime_certification_chain_broken=${report.runtime_certification_chain_broken} traceability_loss=${report.traceability_loss} production_mode_unblocked=${report.production_mode_unblocked} safe_create_policy_violation=${report.safe_create_policy_violation} mv_test_mode_execution_certification_ready=${report.mv_test_mode_execution_certification_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const cert of report.mv_test_execution_certifications) {
  console.log(
    `  cert ${cert.mv_test_execution_certification_id}: mv_type=${cert.mv_type} chain=${cert.runtime_certification_chain_verified} certified=${cert.test_execution_certified}`
  );
}
console.log(`report=${MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${MV_TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.test_execution_certification_count !== MV_TYPE_COUNT ||
  report.mv_test_execution_certifications.length !== MV_TYPE_COUNT ||
  report.certification_checks.length !== 12 ||
  report.execution_audit_consumed !== 'PASS' ||
  report.test_execution_certified !== 'PASS' ||
  report.execution_scope_valid !== 'PASS' ||
  report.mock_output_verified !== 'PASS' ||
  report.test_mode_allowed !== true ||
  report.mock_output_only !== true ||
  report.real_generation_blocked !== true ||
  report.runtime_not_executed !== true ||
  report.runtime_certification_chain_complete !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_mode_blocked !== 'PASS' ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.dry_run_allowed !== 'PASS' ||
  report.external_call_allowed !== false ||
  report.execution_audit_missing !== false ||
  report.execution_scope_invalid !== false ||
  report.mock_output_missing !== false ||
  report.test_mode_disabled !== false ||
  report.real_generation_enabled !== false ||
  report.runtime_execution_detected !== false ||
  report.runtime_certification_chain_broken !== false ||
  report.traceability_loss !== false ||
  report.production_mode_unblocked !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_test_mode_execution_certification_ready !== 'PASS' ||
  report.certification_status !== MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.certification_checks.every((check) => check.status === 'PASS') === false ||
  report.mv_test_execution_certifications.every(
    (cert) => cert.test_execution_certified === 'PASS'
  ) === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} execution certifications ready, test_mode_allowed=true, and dry_run_allowed`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH), 'utf8')
) as {
  source_execution_audit_ref: string;
  execution_scope: string;
  mock_output_only: boolean;
  test_mode_allowed: boolean;
  real_generation_blocked: boolean;
  runtime_not_executed: boolean;
  runtime_certification_chain_complete: boolean;
  dry_run_allowed: boolean;
  execution_certification_complete: boolean;
  next_stage_ready: boolean;
  mv_test_execution_certifications: Array<{
    source_execution_audit_ref: string;
    mv_test_execution_certification_id: string;
    mv_type: string;
    execution_scope: string;
    mock_output_only: boolean;
    test_mode_allowed: boolean;
    real_generation_blocked: boolean;
    runtime_not_executed: boolean;
    runtime_certification_chain_verified: string;
    traceability_chain: { trace_integrity: string };
    test_execution_certified: string;
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
  artifact.source_execution_audit_ref !== MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH ||
  artifact.mv_test_execution_certifications.length !== MV_TYPE_COUNT ||
  artifact.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  artifact.mock_output_only !== true ||
  artifact.test_mode_allowed !== true ||
  artifact.real_generation_blocked !== true ||
  artifact.runtime_not_executed !== true ||
  artifact.runtime_certification_chain_complete !== true ||
  artifact.dry_run_allowed !== true ||
  artifact.execution_certification_complete !== true ||
  artifact.next_stage_ready !== true ||
  artifact.safety_flags.mock_execution_only !== true ||
  artifact.safety_flags.mock_output_only !== true ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false ||
  artifact.safety_flags.generation !== false ||
  artifact.safety_flags.external_call_allowed !== false
) {
  console.error('Artifact safety or execution audit reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const cert = artifact.mv_test_execution_certifications.find((entry) => entry.mv_type === mvType);
  if (
    !cert ||
    cert.source_execution_audit_ref !== MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH ||
    cert.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
    cert.mock_output_only !== true ||
    cert.test_mode_allowed !== true ||
    cert.real_generation_blocked !== true ||
    cert.runtime_not_executed !== true ||
    cert.runtime_certification_chain_verified !== 'PASS' ||
    cert.traceability_chain.trace_integrity !== 'PASS' ||
    cert.test_execution_certified !== 'PASS' ||
    cert.mv_test_execution_certification_id.length === 0
  ) {
    console.error(`Test execution certification structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
