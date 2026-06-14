import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS,
} from '../services/mvTestModeExecutionCertification.js';
import {
  MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_DIR,
  MV_TEST_MODE_DRY_RUN_EXPORT_DIR,
  MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_MD_PATH,
  MV_TEST_MODE_DRY_RUN_PASS_VERDICT,
  MV_TEST_MODE_DRY_RUN_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_READY_STATUS,
  SAFE_CREATE_POLICY,
  writeMvTestModeDryRun,
} from '../services/mvTestModeDryRun.js';
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
  MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH
);
const certificationArtifactPath = path.join(
  projectRoot,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH
);

if (!fs.existsSync(certificationReportPath) || !fs.existsSync(certificationArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV test mode execution certification report or artifact');
  process.exit(1);
}

const certificationReport = JSON.parse(
  fs.readFileSync(certificationReportPath, 'utf8')
) as {
  final_verdict: string;
  certification_status: string | null;
  mv_test_mode_execution_certification_ready: string;
};

if (
  certificationReport.final_verdict !== MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT ||
  certificationReport.certification_status !== MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS ||
  certificationReport.mv_test_mode_execution_certification_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH} must be ${MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT} with ${MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

const report = writeMvTestModeDryRun(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_execution_certification_ref=${report.source_execution_certification_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} dry_run_count=${report.dry_run_count} mock_output_count=${report.mock_output_count} execution_scope=${report.execution_scope} mock_output_only=${report.mock_output_only} test_mode_allowed=${report.test_mode_allowed} real_generation_blocked=${report.real_generation_blocked} runtime_not_executed=${report.runtime_not_executed} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} production_mode_blocked=${report.production_mode_blocked} execution_certification_consumed=${report.execution_certification_consumed} dry_run_ready=${report.dry_run_ready} dry_run_completed=${report.dry_run_completed} mock_output_verified=${report.mock_output_verified} dry_run_execution_plan_valid=${report.dry_run_execution_plan_valid} failure_recovery_ready=${report.failure_recovery_ready} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} execution_certification_missing=${report.execution_certification_missing} dry_run_not_ready=${report.dry_run_not_ready} mock_output_missing=${report.mock_output_missing} test_mode_disabled=${report.test_mode_disabled} real_generation_enabled=${report.real_generation_enabled} runtime_execution_detected=${report.runtime_execution_detected} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} production_mode_unblocked=${report.production_mode_unblocked} dry_run_execution_plan_invalid=${report.dry_run_execution_plan_invalid} failure_recovery_missing=${report.failure_recovery_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_test_mode_dry_run_ready=${report.mv_test_mode_dry_run_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const dryRun of report.mv_test_mode_dry_runs) {
  console.log(
    `  dry_run ${dryRun.dry_run_id}: mv_type=${dryRun.mv_type} steps=${dryRun.dry_run_execution_plan.step_count} ready=${dryRun.dry_run_ready} completed=${dryRun.dry_run_completed}`
  );
}
console.log(`report=${MV_TEST_MODE_DRY_RUN_REPORT_PATH}`);
console.log(`markdown=${MV_TEST_MODE_DRY_RUN_MD_PATH}`);
console.log(`manifest=${MV_TEST_MODE_DRY_RUN_MANIFEST_PATH}`);
console.log(`artifact=${MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_TEST_MODE_DRY_RUN_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.dry_run_count !== MV_TYPE_COUNT ||
  report.mv_test_mode_dry_runs.length !== MV_TYPE_COUNT ||
  report.mock_output_count > 0 === false ||
  report.dry_run_checks.length !== 15 ||
  report.execution_certification_consumed !== 'PASS' ||
  report.dry_run_ready !== 'PASS' ||
  report.dry_run_completed !== 'PASS' ||
  report.mock_output_verified !== 'PASS' ||
  report.test_mode_allowed !== true ||
  report.mock_output_only !== true ||
  report.real_generation_blocked !== true ||
  report.runtime_not_executed !== true ||
  report.external_call_blocked !== true ||
  report.gpu_execution_blocked !== true ||
  report.production_mode_blocked !== true ||
  report.dry_run_execution_plan_valid !== 'PASS' ||
  report.failure_recovery_ready !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.external_call_allowed !== false ||
  report.execution_certification_missing !== false ||
  report.dry_run_not_ready !== false ||
  report.mock_output_missing !== false ||
  report.test_mode_disabled !== false ||
  report.real_generation_enabled !== false ||
  report.runtime_execution_detected !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.production_mode_unblocked !== false ||
  report.dry_run_execution_plan_invalid !== false ||
  report.failure_recovery_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_test_mode_dry_run_ready !== 'PASS' ||
  report.certification_status !== MV_TEST_MODE_DRY_RUN_READY_STATUS ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.dry_run_checks.every((check) => check.status === 'PASS') === false ||
  report.mv_test_mode_dry_runs.every(
    (dryRun) => dryRun.dry_run_ready === 'PASS' && dryRun.dry_run_completed === 'PASS'
  ) === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} dry runs completed, mock_output_only=true, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH), 'utf8')
) as {
  source_execution_certification_ref: string;
  execution_scope: string;
  mock_output_only: boolean;
  test_mode_allowed: boolean;
  real_generation_blocked: boolean;
  runtime_not_executed: boolean;
  external_call_blocked: boolean;
  gpu_execution_blocked: boolean;
  production_mode_blocked: boolean;
  dry_run_complete: boolean;
  next_stage_ready: boolean;
  mock_output_count: number;
  mv_test_mode_dry_runs: Array<{
    source_execution_certification_ref: string;
    dry_run_id: string;
    mv_type: string;
    execution_scope: string;
    mock_output_only: boolean;
    test_mode_allowed: boolean;
    real_generation_blocked: boolean;
    runtime_not_executed: boolean;
    external_call_blocked: boolean;
    gpu_execution_blocked: boolean;
    production_mode_blocked: boolean;
    dry_run_execution_plan: {
      plan_valid: boolean;
      step_count: number;
      steps: Array<{
        mock_output_only: boolean;
        execution_allowed: boolean;
        step_completed: string;
      }>;
    };
    failure_recovery_plan: { recovery_ready: boolean };
    traceability_chain: { trace_integrity: string };
    dry_run_ready: string;
    dry_run_completed: string;
  }>;
  safety_flags: {
    dry_run_simulation: boolean;
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
  artifact.source_execution_certification_ref !== MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH ||
  artifact.mv_test_mode_dry_runs.length !== MV_TYPE_COUNT ||
  artifact.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  artifact.mock_output_only !== true ||
  artifact.test_mode_allowed !== true ||
  artifact.real_generation_blocked !== true ||
  artifact.runtime_not_executed !== true ||
  artifact.external_call_blocked !== true ||
  artifact.gpu_execution_blocked !== true ||
  artifact.production_mode_blocked !== true ||
  artifact.dry_run_complete !== true ||
  artifact.next_stage_ready !== true ||
  artifact.mock_output_count > 0 === false ||
  artifact.safety_flags.dry_run_simulation !== true ||
  artifact.safety_flags.mock_execution_only !== true ||
  artifact.safety_flags.mock_output_only !== true ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false ||
  artifact.safety_flags.generation !== false ||
  artifact.safety_flags.external_call_allowed !== false
) {
  console.error('Artifact safety or execution certification reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const dryRun = artifact.mv_test_mode_dry_runs.find((entry) => entry.mv_type === mvType);
  if (
    !dryRun ||
    dryRun.source_execution_certification_ref !== MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH ||
    dryRun.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
    dryRun.mock_output_only !== true ||
    dryRun.test_mode_allowed !== true ||
    dryRun.real_generation_blocked !== true ||
    dryRun.runtime_not_executed !== true ||
    dryRun.external_call_blocked !== true ||
    dryRun.gpu_execution_blocked !== true ||
    dryRun.production_mode_blocked !== true ||
    dryRun.dry_run_execution_plan.plan_valid !== true ||
    dryRun.dry_run_execution_plan.step_count > 0 === false ||
    dryRun.failure_recovery_plan.recovery_ready !== true ||
    dryRun.traceability_chain.trace_integrity !== 'PASS' ||
    dryRun.dry_run_ready !== 'PASS' ||
    dryRun.dry_run_completed !== 'PASS' ||
    dryRun.dry_run_execution_plan.steps.every(
      (step) =>
        step.mock_output_only === true &&
        step.execution_allowed === false &&
        step.step_completed === 'PASS'
    ) === false ||
    dryRun.dry_run_id.length === 0
  ) {
    console.error(`Dry run structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
