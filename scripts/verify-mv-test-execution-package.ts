import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS,
} from '../services/mvProductionRuntimeCertification.js';
import { RUNTIME_MODE_TEST_MODE_ONLY } from '../services/mvProductionRuntimeEngine.js';
import {
  MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
  MV_TEST_EXECUTION_PACKAGE_DIR,
  MV_TEST_EXECUTION_PACKAGE_EXPORT_DIR,
  MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH,
  MV_TEST_EXECUTION_PACKAGE_MD_PATH,
  MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT,
  MV_TEST_EXECUTION_PACKAGE_REPORT_PATH,
  MV_TEST_EXECUTION_PACKAGE_READY_STATUS,
  SAFE_CREATE_POLICY,
  writeMvTestExecutionPackage,
} from '../services/mvTestExecutionPackage.js';
import { MV_TYPE_COUNT, SUPPORTED_MV_TYPES } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const certificationReportPath = path.join(
  projectRoot,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH
);
const certificationArtifactPath = path.join(
  projectRoot,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH
);

if (!fs.existsSync(certificationReportPath) || !fs.existsSync(certificationArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production runtime certification report or artifact');
  process.exit(1);
}

const certificationReport = JSON.parse(
  fs.readFileSync(certificationReportPath, 'utf8')
) as {
  final_verdict: string;
  certification_status: string | null;
  mv_production_runtime_certification_ready: string;
};

if (
  certificationReport.final_verdict !== MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT ||
  certificationReport.certification_status !== MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS ||
  certificationReport.mv_production_runtime_certification_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH} must be ${MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT} with ${MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

const report = writeMvTestExecutionPackage(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_runtime_certification_ref=${report.source_runtime_certification_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} test_execution_package_count=${report.test_execution_package_count} test_mode_allowed=${report.test_mode_allowed} mock_output_only=${report.mock_output_only} real_generation_blocked=${report.real_generation_blocked} runtime_not_executed=${report.runtime_not_executed} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} runtime_certification_consumed=${report.runtime_certification_consumed} test_execution_package_ready=${report.test_execution_package_ready} test_execution_queue_valid=${report.test_execution_queue_valid} mock_execution_plan_valid=${report.mock_execution_plan_valid} failure_recovery_ready=${report.failure_recovery_ready} runtime_mode_valid=${report.runtime_mode_valid} music_sync_preserved=${report.music_sync_preserved} mv_type_preserved=${report.mv_type_preserved} traceability_preserved=${report.traceability_preserved} production_mode_blocked=${report.production_mode_blocked} runtime_certification_chain_complete=${report.runtime_certification_chain_complete} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} runtime_certification_missing=${report.runtime_certification_missing} test_execution_queue_invalid=${report.test_execution_queue_invalid} mock_execution_plan_missing=${report.mock_execution_plan_missing} failure_recovery_missing=${report.failure_recovery_missing} runtime_mode_invalid=${report.runtime_mode_invalid} test_mode_disabled=${report.test_mode_disabled} mock_output_missing=${report.mock_output_missing} real_generation_enabled=${report.real_generation_enabled} runtime_execution_detected=${report.runtime_execution_detected} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} music_sync_loss=${report.music_sync_loss} mv_type_loss=${report.mv_type_loss} traceability_loss=${report.traceability_loss} production_mode_unblocked=${report.production_mode_unblocked} runtime_certification_chain_incomplete=${report.runtime_certification_chain_incomplete} safe_create_policy_violation=${report.safe_create_policy_violation} next_stage_blocked=${report.next_stage_blocked} mv_test_execution_package_engine_ready=${report.mv_test_execution_package_engine_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const pkg of report.mv_test_execution_packages) {
  console.log(
    `  package ${pkg.mv_test_execution_package_id}: mv_type=${pkg.mv_type} units=${pkg.test_execution_units.length} queue=${pkg.test_execution_queue.length} mock=${pkg.mock_execution_plan.entry_count} ready=${pkg.test_execution_package_ready}`
  );
}
console.log(`report=${MV_TEST_EXECUTION_PACKAGE_REPORT_PATH}`);
console.log(`markdown=${MV_TEST_EXECUTION_PACKAGE_MD_PATH}`);
console.log(`manifest=${MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH}`);
console.log(`artifact=${MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_TEST_EXECUTION_PACKAGE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_EXECUTION_PACKAGE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_EXECUTION_PACKAGE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.test_execution_package_count !== MV_TYPE_COUNT ||
  report.mv_test_execution_packages.length !== MV_TYPE_COUNT ||
  report.package_checks.length !== 19 ||
  report.runtime_certification_consumed !== 'PASS' ||
  report.test_execution_package_ready !== 'PASS' ||
  report.test_execution_queue_valid !== 'PASS' ||
  report.mock_execution_plan_valid !== 'PASS' ||
  report.failure_recovery_ready !== 'PASS' ||
  report.runtime_mode_valid !== 'PASS' ||
  report.test_mode_allowed !== true ||
  report.mock_output_only !== true ||
  report.real_generation_blocked !== true ||
  report.runtime_not_executed !== true ||
  report.external_call_blocked !== true ||
  report.gpu_execution_blocked !== true ||
  report.music_sync_preserved !== 'PASS' ||
  report.mv_type_preserved !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_mode_blocked !== 'PASS' ||
  report.runtime_certification_chain_complete !== 'PASS' ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.external_call_allowed !== false ||
  report.runtime_certification_missing !== false ||
  report.test_execution_queue_invalid !== false ||
  report.mock_execution_plan_missing !== false ||
  report.failure_recovery_missing !== false ||
  report.runtime_mode_invalid !== false ||
  report.test_mode_disabled !== false ||
  report.mock_output_missing !== false ||
  report.real_generation_enabled !== false ||
  report.runtime_execution_detected !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.music_sync_loss !== false ||
  report.mv_type_loss !== false ||
  report.traceability_loss !== false ||
  report.production_mode_unblocked !== false ||
  report.runtime_certification_chain_incomplete !== false ||
  report.safe_create_policy_violation !== false ||
  report.next_stage_blocked !== false ||
  report.mv_test_execution_package_engine_ready !== 'PASS' ||
  report.certification_status !== MV_TEST_EXECUTION_PACKAGE_READY_STATUS ||
  report.package_checks.every((check) => check.status === 'PASS') === false ||
  report.mv_test_execution_packages.every((pkg) => pkg.test_execution_package_ready === 'PASS') ===
    false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} test execution packages ready, mock_output_only=true, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH), 'utf8')
) as {
  source_runtime_certification_ref: string;
  test_mode_allowed: boolean;
  mock_output_only: boolean;
  real_generation_blocked: boolean;
  runtime_not_executed: boolean;
  external_call_blocked: boolean;
  gpu_execution_blocked: boolean;
  runtime_certification_chain_complete: boolean;
  next_stage_ready: boolean;
  mv_test_execution_packages: Array<{
    source_runtime_certification_ref: string;
    mv_test_execution_package_id: string;
    mv_type: string;
    runtime_mode: string;
    test_mode_allowed: boolean;
    mock_output_only: boolean;
    real_generation_blocked: boolean;
    runtime_not_executed: boolean;
    external_call_blocked: boolean;
    gpu_execution_blocked: boolean;
    test_execution_units: Array<{
      mock_image_output: string;
      mock_video_output: string;
      unit_ready: string;
    }>;
    test_execution_queue: Array<{
      mock_execution_only: boolean;
      execution_allowed: boolean;
      runtime_mode: string;
    }>;
    mock_execution_plan: {
      mock_output_only: boolean;
      plan_valid: boolean;
      entry_count: number;
    };
    failure_recovery_plan: { recovery_ready: boolean };
    adapter_execution_plan: { plan_valid: boolean };
    music_sync_plan: { sync_valid: boolean };
    traceability_chain: { trace_integrity: string };
    test_execution_package_ready: string;
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
  artifact.source_runtime_certification_ref !== MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH ||
  artifact.mv_test_execution_packages.length !== MV_TYPE_COUNT ||
  artifact.test_mode_allowed !== true ||
  artifact.mock_output_only !== true ||
  artifact.real_generation_blocked !== true ||
  artifact.runtime_not_executed !== true ||
  artifact.external_call_blocked !== true ||
  artifact.gpu_execution_blocked !== true ||
  artifact.runtime_certification_chain_complete !== true ||
  artifact.next_stage_ready !== true ||
  artifact.safety_flags.mock_execution_only !== true ||
  artifact.safety_flags.mock_output_only !== true ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false ||
  artifact.safety_flags.generation !== false ||
  artifact.safety_flags.external_call_allowed !== false
) {
  console.error('Artifact safety or runtime certification reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const pkg = artifact.mv_test_execution_packages.find((entry) => entry.mv_type === mvType);
  if (
    !pkg ||
    pkg.source_runtime_certification_ref !== MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH ||
    pkg.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
    pkg.test_mode_allowed !== true ||
    pkg.mock_output_only !== true ||
    pkg.real_generation_blocked !== true ||
    pkg.runtime_not_executed !== true ||
    pkg.external_call_blocked !== true ||
    pkg.gpu_execution_blocked !== true ||
    pkg.test_execution_units.length === 0 ||
    pkg.test_execution_queue.length !== pkg.test_execution_units.length * 4 ||
    pkg.mock_execution_plan.mock_output_only !== true ||
    pkg.mock_execution_plan.plan_valid !== true ||
    pkg.mock_execution_plan.entry_count === pkg.test_execution_units.length === false ||
    pkg.failure_recovery_plan.recovery_ready !== true ||
    pkg.adapter_execution_plan.plan_valid !== true ||
    pkg.music_sync_plan.sync_valid !== true ||
    pkg.traceability_chain.trace_integrity !== 'PASS' ||
    pkg.test_execution_package_ready !== 'PASS' ||
    pkg.test_execution_queue.every(
      (entry) =>
        entry.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY &&
        entry.mock_execution_only === true &&
        entry.execution_allowed === false
    ) === false ||
    pkg.test_execution_units.every(
      (unit) =>
        unit.mock_image_output.length > 0 &&
        unit.mock_video_output.length > 0 &&
        unit.unit_ready === 'PASS'
    ) === false
  ) {
    console.error(`Test execution package structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
