import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { PRODUCTION_BLUEPRINT_TYPE_COUNT } from '../services/movieAnalysisProductionBlueprintExpansion.js';
import { EXECUTION_SCOPE } from '../services/movieAnalysisTestModeExecutionCertification.js';
import {
  TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
} from '../services/movieAnalysisTestModeDryRunCertification.js';
import {
  LEVEL3_FINAL_AUDIT_PHASE_COUNT,
  LEVEL3_FINAL_STATUS_COMPLETE,
  NEXT_LEVEL_GATE_LABEL,
  SAFE_CREATE_POLICY,
  TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDIT_DIR,
  TEST_MODE_EXECUTION_FINAL_AUDIT_EXPORT_DIR,
  TEST_MODE_EXECUTION_FINAL_AUDIT_MANIFEST_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDIT_MD_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT,
  TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS,
  writeMovieAnalysisTestModeExecutionFinalAudit,
} from '../services/movieAnalysisTestModeExecutionFinalAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const dryRunCertReportPath = path.join(projectRoot, TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH);
const dryRunCertArtifactPath = path.join(projectRoot, TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH);

if (!fs.existsSync(dryRunCertReportPath) || !fs.existsSync(dryRunCertArtifactPath)) {
  console.error('PRECHECK FAIL: Missing test mode dry run certification report or artifact');
  process.exit(1);
}

const dryRunCertReport = JSON.parse(fs.readFileSync(dryRunCertReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  dryRunCertReport.final_verdict !== TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT ||
  dryRunCertReport.certification_status !== TEST_MODE_DRY_RUN_CERTIFIED_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH} must be ${TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT} with ${TEST_MODE_DRY_RUN_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisTestModeExecutionFinalAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} level3_final_status=${report.level3_final_status ?? 'NONE'} next_level_approved=${report.next_level_approved} certification_timestamp=${report.certification_timestamp} source_count=${report.source_count} adapter_count=${report.adapter_count} level3_final_audit_phase_count=${report.level3_final_audit_phase_count} test_package_count=${report.test_package_count} mock_output_count=${report.mock_output_count} execution_scope=${report.execution_scope} level3_chain_complete=${report.level3_chain_complete} dry_run_certified=${report.dry_run_certified} mock_only_execution_verified=${report.mock_only_execution_verified} production_block_verified=${report.production_block_verified} traceability_chain_complete=${report.traceability_chain_complete} manifest_integrity_verified=${report.manifest_integrity_verified} safe_create_policy_verified=${report.safe_create_policy_verified} next_level_gate_ready=${report.next_level_gate_ready} final_audit_complete=${report.final_audit_complete} chain_incomplete=${report.chain_incomplete} dry_run_not_certified=${report.dry_run_not_certified} production_unblocked=${report.production_unblocked} manifest_integrity_failure=${report.manifest_integrity_failure} safe_create_policy_violation=${report.safe_create_policy_violation} next_level_gate_blocked=${report.next_level_gate_blocked} test_mode_execution_final_audit_ready=${report.test_mode_execution_final_audit_ready} next_level_gate_label=${report.next_level_gate_label} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const audit of report.phase_final_audits) {
  console.log(
    `  phase ${audit.phase_level}: certified=${audit.phase_certified} manifest_integrity=${audit.manifest_integrity_valid}`
  );
}
console.log(`report=${TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH}`);
console.log(`markdown=${TEST_MODE_EXECUTION_FINAL_AUDIT_MD_PATH}`);
console.log(`manifest=${TEST_MODE_EXECUTION_FINAL_AUDIT_MANIFEST_PATH}`);
console.log(`artifact=${TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_FINAL_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_FINAL_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_FINAL_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level3_final_audit_phase_count !== LEVEL3_FINAL_AUDIT_PHASE_COUNT ||
  report.phase_final_audits.length !== LEVEL3_FINAL_AUDIT_PHASE_COUNT ||
  report.final_audit_checks.length !== 8 ||
  report.test_package_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.mock_output_count > 0 === false ||
  report.execution_scope !== EXECUTION_SCOPE ||
  report.mock_output_only !== true ||
  report.real_generation !== false ||
  report.level3_chain_complete !== 'PASS' ||
  report.dry_run_certified !== 'PASS' ||
  report.mock_only_execution_verified !== 'PASS' ||
  report.production_block_verified !== 'PASS' ||
  report.traceability_chain_complete !== 'PASS' ||
  report.manifest_integrity_verified !== 'PASS' ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_level_gate_ready !== 'PASS' ||
  report.final_audit_complete !== 'PASS' ||
  report.chain_incomplete !== false ||
  report.dry_run_not_certified !== false ||
  report.production_unblocked !== false ||
  report.manifest_integrity_failure !== false ||
  report.safe_create_policy_violation !== false ||
  report.next_level_gate_blocked !== false ||
  report.test_mode_execution_final_audit_ready !== 'PASS' ||
  report.certification_status !== TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS ||
  report.level3_final_status !== LEVEL3_FINAL_STATUS_COMPLETE ||
  report.next_level_approved !== true ||
  report.next_level_gate_label !== NEXT_LEVEL_GATE_LABEL ||
  report.certification_timestamp.length === 0 ||
  report.phase_final_audits.every((audit) => audit.phase_certified) === false ||
  report.phase_final_audits.every((audit) => audit.manifest_integrity_valid) === false ||
  report.final_audit_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${LEVEL3_FINAL_AUDIT_PHASE_COUNT} Level3 phases certified, manifest integrity verified, and next level gate ready`
  );
  process.exit(1);
}

process.exit(0);
