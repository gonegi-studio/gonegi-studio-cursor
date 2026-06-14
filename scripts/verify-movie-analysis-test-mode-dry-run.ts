import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { PRODUCTION_BLUEPRINT_TYPE_COUNT } from '../services/movieAnalysisProductionBlueprintExpansion.js';
import {
  EXECUTION_SCOPE,
  TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  TEST_MODE_EXECUTION_CERTIFIED_STATUS,
} from '../services/movieAnalysisTestModeExecutionCertification.js';
import {
  LEVEL3_DRY_RUN_PHASE_COUNT,
  MOCK_ARTIFACT_WRITE_SCOPE,
  SAFE_CREATE_POLICY,
  TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  TEST_MODE_DRY_RUN_DIR,
  TEST_MODE_DRY_RUN_EXPORT_DIR,
  TEST_MODE_DRY_RUN_MANIFEST_PATH,
  TEST_MODE_DRY_RUN_MD_PATH,
  TEST_MODE_DRY_RUN_PASS_VERDICT,
  TEST_MODE_DRY_RUN_REPORT_PATH,
  TEST_MODE_DRY_RUN_COMPLETE_STATUS,
  writeMovieAnalysisTestModeDryRun,
} from '../services/movieAnalysisTestModeDryRun.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const executionCertReportPath = path.join(projectRoot, TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH);
const executionCertArtifactPath = path.join(projectRoot, TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH);

if (!fs.existsSync(executionCertReportPath) || !fs.existsSync(executionCertArtifactPath)) {
  console.error('PRECHECK FAIL: Missing test mode execution certification report or artifact');
  process.exit(1);
}

const executionCertReport = JSON.parse(fs.readFileSync(executionCertReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  execution_scope: string;
  dry_run_allowed: string;
  mock_output_only: boolean;
  production_execution_blocked: string;
};

if (
  executionCertReport.final_verdict !== TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT ||
  executionCertReport.certification_status !== TEST_MODE_EXECUTION_CERTIFIED_STATUS ||
  executionCertReport.execution_scope !== EXECUTION_SCOPE ||
  executionCertReport.dry_run_allowed !== 'PASS' ||
  executionCertReport.mock_output_only !== true ||
  executionCertReport.production_execution_blocked !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH} must be ${TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT} with ${TEST_MODE_EXECUTION_CERTIFIED_STATUS}, execution_scope=${EXECUTION_SCOPE}, dry_run_allowed=PASS, mock_output_only=true, production_execution_blocked=PASS`
  );
  process.exit(1);
}

const report = writeMovieAnalysisTestModeDryRun(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level3_dry_run_phase_count=${report.level3_dry_run_phase_count} test_package_count=${report.test_package_count} mock_output_count=${report.mock_output_count} execution_scope=${report.execution_scope} mock_artifact_write_scope=${report.mock_artifact_write_scope} execution_queue_simulated=${report.execution_queue_simulated} runtime_units_simulated=${report.runtime_units_simulated} mock_outputs_generated=${report.mock_outputs_generated} mock_outputs_present=${report.mock_outputs_present} dry_run_complete=${report.dry_run_complete} simulation_complete=${report.simulation_complete} production_still_blocked=${report.production_still_blocked} traceability_preserved=${report.traceability_preserved} memory_bindings_preserved=${report.memory_bindings_preserved} safe_create_policy_preserved=${report.safe_create_policy_preserved} mock_artifact_write_scope_valid=${report.mock_artifact_write_scope_valid} dry_run_manifest_present=${report.dry_run_manifest_present} execution_scope_invalid=${report.execution_scope_invalid} dry_run_not_allowed=${report.dry_run_not_allowed} mock_output_missing=${report.mock_output_missing} real_generation_detected=${report.real_generation_detected} production_execution_unblocked=${report.production_execution_unblocked} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} mock_artifact_write_scope_violation=${report.mock_artifact_write_scope_violation} dry_run_manifest_missing=${report.dry_run_manifest_missing} traceability_loss=${report.traceability_loss} memory_binding_loss=${report.memory_binding_loss} safe_create_policy_violation=${report.safe_create_policy_violation} test_mode_dry_run_ready=${report.test_mode_dry_run_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const simulation of report.package_simulations) {
  console.log(
    `  package ${simulation.test_package_id}: ready=${simulation.simulation_ready} queue=${simulation.execution_queue_simulated} outputs=${simulation.mock_outputs_generated}`
  );
}
console.log(`report=${TEST_MODE_DRY_RUN_REPORT_PATH}`);
console.log(`markdown=${TEST_MODE_DRY_RUN_MD_PATH}`);
console.log(`manifest=${TEST_MODE_DRY_RUN_MANIFEST_PATH}`);
console.log(`artifact=${TEST_MODE_DRY_RUN_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== TEST_MODE_DRY_RUN_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level3_dry_run_phase_count !== LEVEL3_DRY_RUN_PHASE_COUNT ||
  report.test_package_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.package_simulations.length !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.dry_run_checks.length !== 7 ||
  report.execution_scope !== EXECUTION_SCOPE ||
  report.mock_artifact_write_scope !== MOCK_ARTIFACT_WRITE_SCOPE ||
  report.mock_output_only !== true ||
  report.real_generation !== false ||
  report.dry_run_artifact_manifest_required !== true ||
  report.mock_output_count > 0 === false ||
  report.execution_queue_simulated !== 'PASS' ||
  report.runtime_units_simulated !== 'PASS' ||
  report.mock_outputs_generated !== 'PASS' ||
  report.mock_outputs_present !== 'PASS' ||
  report.dry_run_complete !== 'PASS' ||
  report.simulation_complete !== 'PASS' ||
  report.production_still_blocked !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.memory_bindings_preserved !== 'PASS' ||
  report.safe_create_policy_preserved !== 'PASS' ||
  report.mock_artifact_write_scope_valid !== 'PASS' ||
  report.dry_run_manifest_present !== 'PASS' ||
  report.execution_scope_invalid !== false ||
  report.dry_run_not_allowed !== false ||
  report.mock_output_missing !== false ||
  report.real_generation_detected !== false ||
  report.production_execution_unblocked !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.mock_artifact_write_scope_violation !== false ||
  report.dry_run_manifest_missing !== false ||
  report.traceability_loss !== false ||
  report.memory_binding_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.test_mode_dry_run_ready !== 'PASS' ||
  report.certification_status !== TEST_MODE_DRY_RUN_COMPLETE_STATUS ||
  report.package_simulations.every((simulation) => simulation.simulation_ready === 'PASS') === false ||
  report.dry_run_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    `Expected PASS with dry run simulation complete, mock outputs present, and ${PRODUCTION_BLUEPRINT_TYPE_COUNT} packages simulated under ${MOCK_ARTIFACT_WRITE_SCOPE}`
  );
  process.exit(1);
}

process.exit(0);
