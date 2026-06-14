import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_PASS_VERDICT,
  MV_TEST_MODE_DRY_RUN_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_READY_STATUS,
} from '../services/mvTestModeDryRun.js';
import {
  DRY_RUN_SCOPE_FULL_MV_CHAIN,
  EXPECTED_MOCK_SIMULATION_STEP_COUNT,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_DIR,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
  SAFE_CREATE_POLICY,
  writeMvTestModeDryRunCertification,
} from '../services/mvTestModeDryRunCertification.js';
import { MV_TYPE_COUNT, SUPPORTED_MV_TYPES } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const dryRunReportPath = path.join(projectRoot, MV_TEST_MODE_DRY_RUN_REPORT_PATH);
const dryRunArtifactPath = path.join(projectRoot, MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH);
const dryRunManifestPath = path.join(projectRoot, MV_TEST_MODE_DRY_RUN_MANIFEST_PATH);

if (
  !fs.existsSync(dryRunReportPath) ||
  !fs.existsSync(dryRunArtifactPath) ||
  !fs.existsSync(dryRunManifestPath)
) {
  console.error('PRECHECK FAIL: Missing MV test mode dry run report, artifact, or manifest');
  process.exit(1);
}

const dryRunReport = JSON.parse(fs.readFileSync(dryRunReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  mv_test_mode_dry_run_ready: string;
};

if (
  dryRunReport.final_verdict !== MV_TEST_MODE_DRY_RUN_PASS_VERDICT ||
  dryRunReport.certification_status !== MV_TEST_MODE_DRY_RUN_READY_STATUS ||
  dryRunReport.mv_test_mode_dry_run_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_TEST_MODE_DRY_RUN_REPORT_PATH} must be ${MV_TEST_MODE_DRY_RUN_PASS_VERDICT} with ${MV_TEST_MODE_DRY_RUN_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvTestModeDryRunCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_dry_run_ref=${report.source_dry_run_ref} source_dry_run_manifest_ref=${report.source_dry_run_manifest_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} dry_run_certification_count=${report.dry_run_certification_count} execution_scope=${report.execution_scope} dry_run_scope=${report.dry_run_scope} mock_simulation_step_count=${report.mock_simulation_step_count} mock_output_only=${report.mock_output_only} test_mode_allowed=${report.test_mode_allowed} real_generation_blocked=${report.real_generation_blocked} runtime_not_executed=${report.runtime_not_executed} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} production_mode_blocked=${report.production_mode_blocked} dry_run_manifest_verified=${report.dry_run_manifest_verified} dry_run_consumed=${report.dry_run_consumed} dry_run_certified=${report.dry_run_certified} dry_run_completed=${report.dry_run_completed} mock_output_verified=${report.mock_output_verified} mock_simulation_step_count_valid=${report.mock_simulation_step_count_valid} dry_run_scope_valid=${report.dry_run_scope_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} final_audit_allowed=${report.final_audit_allowed} dry_run_missing=${report.dry_run_missing} dry_run_not_completed=${report.dry_run_not_completed} mock_output_missing=${report.mock_output_missing} mock_simulation_step_count_invalid=${report.mock_simulation_step_count_invalid} dry_run_scope_invalid=${report.dry_run_scope_invalid} dry_run_manifest_missing=${report.dry_run_manifest_missing} test_mode_disabled=${report.test_mode_disabled} real_generation_enabled=${report.real_generation_enabled} runtime_execution_detected=${report.runtime_execution_detected} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} production_mode_unblocked=${report.production_mode_unblocked} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_test_mode_dry_run_certification_ready=${report.mv_test_mode_dry_run_certification_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const cert of report.mv_dry_run_certifications) {
  console.log(
    `  cert ${cert.dry_run_certification_id}: mv_type=${cert.mv_type} steps=${cert.mock_simulation_step_count} scope=${cert.dry_run_scope} manifest=${cert.dry_run_manifest_verified} certified=${cert.dry_run_certified}`
  );
}
console.log(`report=${MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${MV_TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.dry_run_certification_count !== MV_TYPE_COUNT ||
  report.mv_dry_run_certifications.length !== MV_TYPE_COUNT ||
  report.certification_checks.length !== 16 ||
  report.mock_simulation_step_count !== EXPECTED_MOCK_SIMULATION_STEP_COUNT ||
  report.dry_run_consumed !== 'PASS' ||
  report.dry_run_certified !== 'PASS' ||
  report.dry_run_completed !== 'PASS' ||
  report.mock_output_verified !== 'PASS' ||
  report.mock_simulation_step_count_valid !== 'PASS' ||
  report.dry_run_scope_valid !== 'PASS' ||
  report.dry_run_manifest_verified !== true ||
  report.test_mode_allowed !== true ||
  report.mock_output_only !== true ||
  report.real_generation_blocked !== true ||
  report.runtime_not_executed !== true ||
  report.external_call_blocked !== true ||
  report.gpu_execution_blocked !== true ||
  report.production_mode_blocked !== true ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.final_audit_allowed !== 'PASS' ||
  report.external_call_allowed !== false ||
  report.dry_run_missing !== false ||
  report.dry_run_not_completed !== false ||
  report.mock_output_missing !== false ||
  report.mock_simulation_step_count_invalid !== false ||
  report.dry_run_scope_invalid !== false ||
  report.dry_run_manifest_missing !== false ||
  report.test_mode_disabled !== false ||
  report.real_generation_enabled !== false ||
  report.runtime_execution_detected !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.production_mode_unblocked !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_test_mode_dry_run_certification_ready !== 'PASS' ||
  report.certification_status !== MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.dry_run_scope !== DRY_RUN_SCOPE_FULL_MV_CHAIN ||
  report.certification_checks.every((check) => check.status === 'PASS') === false ||
  report.mv_dry_run_certifications.every((cert) => cert.dry_run_certified === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} dry run certifications, ${EXPECTED_MOCK_SIMULATION_STEP_COUNT} steps, and final_audit_allowed`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH), 'utf8')
) as {
  source_dry_run_ref: string;
  source_dry_run_manifest_ref: string;
  execution_scope: string;
  dry_run_scope: string;
  mock_output_only: boolean;
  mock_simulation_step_count: number;
  test_mode_allowed: boolean;
  real_generation_blocked: boolean;
  runtime_not_executed: boolean;
  external_call_blocked: boolean;
  gpu_execution_blocked: boolean;
  production_mode_blocked: boolean;
  dry_run_manifest_verified: boolean;
  dry_run_certification_complete: boolean;
  final_audit_allowed: boolean;
  next_stage_ready: boolean;
  mv_dry_run_certifications: Array<{
    source_dry_run_ref: string;
    dry_run_certification_id: string;
    mv_type: string;
    execution_scope: string;
    dry_run_scope: string;
    mock_output_only: boolean;
    mock_simulation_step_count: number;
    test_mode_allowed: boolean;
    real_generation_blocked: boolean;
    runtime_not_executed: boolean;
    external_call_blocked: boolean;
    gpu_execution_blocked: boolean;
    production_mode_blocked: boolean;
    dry_run_manifest_verified: string;
    traceability_chain: { trace_integrity: string };
    dry_run_certified: string;
  }>;
  safety_flags: {
    dry_run_certified: boolean;
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
  artifact.source_dry_run_ref !== MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH ||
  artifact.source_dry_run_manifest_ref !== MV_TEST_MODE_DRY_RUN_MANIFEST_PATH ||
  artifact.mv_dry_run_certifications.length !== MV_TYPE_COUNT ||
  artifact.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  artifact.dry_run_scope !== DRY_RUN_SCOPE_FULL_MV_CHAIN ||
  artifact.mock_output_only !== true ||
  artifact.mock_simulation_step_count !== EXPECTED_MOCK_SIMULATION_STEP_COUNT ||
  artifact.test_mode_allowed !== true ||
  artifact.real_generation_blocked !== true ||
  artifact.runtime_not_executed !== true ||
  artifact.external_call_blocked !== true ||
  artifact.gpu_execution_blocked !== true ||
  artifact.production_mode_blocked !== true ||
  artifact.dry_run_manifest_verified !== true ||
  artifact.dry_run_certification_complete !== true ||
  artifact.final_audit_allowed !== true ||
  artifact.next_stage_ready !== true ||
  artifact.safety_flags.dry_run_certified !== true ||
  artifact.safety_flags.mock_execution_only !== true ||
  artifact.safety_flags.mock_output_only !== true ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false ||
  artifact.safety_flags.generation !== false ||
  artifact.safety_flags.external_call_allowed !== false
) {
  console.error('Artifact safety or dry run reference validation failed');
  process.exit(1);
}

const totalSteps = artifact.mv_dry_run_certifications.reduce(
  (sum, cert) => sum + cert.mock_simulation_step_count,
  0
);

if (totalSteps !== EXPECTED_MOCK_SIMULATION_STEP_COUNT) {
  console.error(`Expected total mock simulation steps ${EXPECTED_MOCK_SIMULATION_STEP_COUNT}`);
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const cert = artifact.mv_dry_run_certifications.find((entry) => entry.mv_type === mvType);
  if (
    !cert ||
    cert.source_dry_run_ref !== MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH ||
    cert.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
    cert.dry_run_scope !== DRY_RUN_SCOPE_FULL_MV_CHAIN ||
    cert.mock_output_only !== true ||
    cert.mock_simulation_step_count > 0 === false ||
    cert.test_mode_allowed !== true ||
    cert.real_generation_blocked !== true ||
    cert.runtime_not_executed !== true ||
    cert.external_call_blocked !== true ||
    cert.gpu_execution_blocked !== true ||
    cert.production_mode_blocked !== true ||
    cert.dry_run_manifest_verified !== 'PASS' ||
    cert.traceability_chain.trace_integrity !== 'PASS' ||
    cert.dry_run_certified !== 'PASS' ||
    cert.dry_run_certification_id.length === 0
  ) {
    console.error(`Dry run certification structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
