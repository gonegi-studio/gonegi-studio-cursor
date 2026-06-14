import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { PRODUCTION_BLUEPRINT_TYPE_COUNT } from '../services/movieAnalysisProductionBlueprintExpansion.js';
import { EXECUTION_SCOPE } from '../services/movieAnalysisTestModeExecutionCertification.js';
import {
  TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  TEST_MODE_DRY_RUN_MANIFEST_PATH,
  TEST_MODE_DRY_RUN_PASS_VERDICT,
  TEST_MODE_DRY_RUN_REPORT_PATH,
  TEST_MODE_DRY_RUN_COMPLETE_STATUS,
} from '../services/movieAnalysisTestModeDryRun.js';
import {
  LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT,
  SAFE_CREATE_POLICY,
  TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_DIR,
  TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR,
  TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
  writeMovieAnalysisTestModeDryRunCertification,
} from '../services/movieAnalysisTestModeDryRunCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const dryRunReportPath = path.join(projectRoot, TEST_MODE_DRY_RUN_REPORT_PATH);
const dryRunArtifactPath = path.join(projectRoot, TEST_MODE_DRY_RUN_ARTIFACT_PATH);
const dryRunManifestPath = path.join(projectRoot, TEST_MODE_DRY_RUN_MANIFEST_PATH);

if (
  !fs.existsSync(dryRunReportPath) ||
  !fs.existsSync(dryRunArtifactPath) ||
  !fs.existsSync(dryRunManifestPath)
) {
  console.error('PRECHECK FAIL: Missing test mode dry run report, artifact, or manifest');
  process.exit(1);
}

const dryRunReport = JSON.parse(fs.readFileSync(dryRunReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  dryRunReport.final_verdict !== TEST_MODE_DRY_RUN_PASS_VERDICT ||
  dryRunReport.certification_status !== TEST_MODE_DRY_RUN_COMPLETE_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${TEST_MODE_DRY_RUN_REPORT_PATH} must be ${TEST_MODE_DRY_RUN_PASS_VERDICT} with ${TEST_MODE_DRY_RUN_COMPLETE_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisTestModeDryRunCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level3_dry_run_certification_phase_count=${report.level3_dry_run_certification_phase_count} test_package_count=${report.test_package_count} mock_output_count=${report.mock_output_count} execution_scope=${report.execution_scope} dry_run_completed=${report.dry_run_completed} simulation_completed=${report.simulation_completed} mock_outputs_verified=${report.mock_outputs_verified} dry_run_manifest_verified=${report.dry_run_manifest_verified} mock_artifact_scope_verified=${report.mock_artifact_scope_verified} mock_output_only=${report.mock_output_only} real_generation=${report.real_generation} production_execution_blocked=${report.production_execution_blocked} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} traceability_preserved=${report.traceability_preserved} memory_bindings_preserved=${report.memory_bindings_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} dry_run_certification_complete=${report.dry_run_certification_complete} simulation_certified=${report.simulation_certified} mock_execution_verified=${report.mock_execution_verified} production_still_blocked=${report.production_still_blocked} dry_run_incomplete=${report.dry_run_incomplete} simulation_failure=${report.simulation_failure} mock_output_missing=${report.mock_output_missing} dry_run_manifest_missing=${report.dry_run_manifest_missing} mock_artifact_scope_violation=${report.mock_artifact_scope_violation} real_generation_detected=${report.real_generation_detected} production_execution_unblocked=${report.production_execution_unblocked} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} traceability_loss=${report.traceability_loss} memory_binding_loss=${report.memory_binding_loss} safe_create_policy_violation=${report.safe_create_policy_violation} test_mode_dry_run_certification_ready=${report.test_mode_dry_run_certification_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const audit of report.phase_certification_audits) {
  console.log(`  phase ${audit.phase_level}: certified=${audit.phase_certified}`);
}
console.log(`report=${TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level3_dry_run_certification_phase_count !== LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT ||
  report.phase_certification_audits.length !== LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT ||
  report.certification_checks.length !== 13 ||
  report.test_package_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.mock_output_count > 0 === false ||
  report.execution_scope !== EXECUTION_SCOPE ||
  report.mock_output_only !== true ||
  report.real_generation !== false ||
  report.dry_run_completed !== 'PASS' ||
  report.simulation_completed !== 'PASS' ||
  report.mock_outputs_verified !== 'PASS' ||
  report.dry_run_manifest_verified !== 'PASS' ||
  report.mock_artifact_scope_verified !== 'PASS' ||
  report.production_execution_blocked !== 'PASS' ||
  report.external_call_blocked !== 'PASS' ||
  report.gpu_execution_blocked !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.memory_bindings_preserved !== 'PASS' ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.dry_run_certification_complete !== 'PASS' ||
  report.simulation_certified !== 'PASS' ||
  report.mock_execution_verified !== 'PASS' ||
  report.production_still_blocked !== 'PASS' ||
  report.dry_run_incomplete !== false ||
  report.simulation_failure !== false ||
  report.mock_output_missing !== false ||
  report.dry_run_manifest_missing !== false ||
  report.mock_artifact_scope_violation !== false ||
  report.real_generation_detected !== false ||
  report.production_execution_unblocked !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.traceability_loss !== false ||
  report.memory_binding_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.test_mode_dry_run_certification_ready !== 'PASS' ||
  report.certification_status !== TEST_MODE_DRY_RUN_CERTIFIED_STATUS ||
  report.phase_certification_audits.every((audit) => audit.phase_certified) === false ||
  report.certification_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    `Expected PASS with dry run certified, ${report.mock_output_count} mock outputs verified, and all ${LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT} Level3 phases certified`
  );
  process.exit(1);
}

process.exit(0);
