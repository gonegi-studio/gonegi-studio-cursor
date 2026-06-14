import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LEVEL3_PHASE_COUNT,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_DIR,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_EXPORT_DIR,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_MD_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS,
  SAFE_CREATE_POLICY,
  writeMovieAnalysisProductionEngineIntegrityAudit,
} from '../services/movieAnalysisProductionEngineIntegrityAudit.js';
import {
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
  TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
} from '../services/movieAnalysisTestModeExecutionPackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const testModeReportPath = path.join(projectRoot, TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH);
const testModeArtifactPath = path.join(projectRoot, TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH);

if (!fs.existsSync(testModeReportPath) || !fs.existsSync(testModeArtifactPath)) {
  console.error('PRECHECK FAIL: Missing test mode execution package report or artifact');
  process.exit(1);
}

const testModeReport = JSON.parse(fs.readFileSync(testModeReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  testModeReport.final_verdict !== TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT ||
  testModeReport.certification_status !== TEST_MODE_EXECUTION_PACKAGE_READY_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH} must be ${TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT} with ${TEST_MODE_EXECUTION_PACKAGE_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisProductionEngineIntegrityAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level3_phase_count=${report.level3_phase_count} foundation_integrity=${report.foundation_integrity} blueprint_integrity=${report.blueprint_integrity} scene_assembly_integrity=${report.scene_assembly_integrity} shot_assembly_integrity=${report.shot_assembly_integrity} generation_plan_integrity=${report.generation_plan_integrity} runtime_integrity=${report.runtime_integrity} certification_integrity=${report.certification_integrity} test_package_integrity=${report.test_package_integrity} traceability_chain_integrity=${report.traceability_chain_integrity} memory_binding_integrity=${report.memory_binding_integrity} report_consistency_integrity=${report.report_consistency_integrity} manifest_consistency_integrity=${report.manifest_consistency_integrity} safe_create_policy_preserved=${report.safe_create_policy_preserved} all_level3_artifacts_present=${report.all_level3_artifacts_present} cross_phase_traceability_valid=${report.cross_phase_traceability_valid} memory_bindings_preserved=${report.memory_bindings_preserved} runtime_safety_preserved=${report.runtime_safety_preserved} test_mode_constraints_preserved=${report.test_mode_constraints_preserved} audit_complete=${report.audit_complete} artifact_missing=${report.artifact_missing} traceability_break=${report.traceability_break} memory_binding_loss=${report.memory_binding_loss} runtime_safety_loss=${report.runtime_safety_loss} test_mode_violation=${report.test_mode_violation} report_manifest_mismatch=${report.report_manifest_mismatch} safe_create_policy_violation=${report.safe_create_policy_violation} production_engine_integrity_audit_ready=${report.production_engine_integrity_audit_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const audit of report.phase_integrity_audits) {
  console.log(
    `  phase ${audit.phase_level} ${audit.check_id}: integrity=${audit.integrity_status} traceability=${audit.traceability_preserved}`
  );
}
console.log(`report=${PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH}`);
console.log(`markdown=${PRODUCTION_ENGINE_INTEGRITY_AUDIT_MD_PATH}`);
console.log(`manifest=${PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH}`);
console.log(`artifact=${PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_INTEGRITY_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_INTEGRITY_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level3_phase_count !== LEVEL3_PHASE_COUNT ||
  report.phase_integrity_audits.length !== LEVEL3_PHASE_COUNT ||
  report.cross_phase_traceability_chain.length !== LEVEL3_PHASE_COUNT - 1 ||
  report.foundation_integrity !== 'PASS' ||
  report.blueprint_integrity !== 'PASS' ||
  report.scene_assembly_integrity !== 'PASS' ||
  report.shot_assembly_integrity !== 'PASS' ||
  report.generation_plan_integrity !== 'PASS' ||
  report.runtime_integrity !== 'PASS' ||
  report.certification_integrity !== 'PASS' ||
  report.test_package_integrity !== 'PASS' ||
  report.traceability_chain_integrity !== 'PASS' ||
  report.memory_binding_integrity !== 'PASS' ||
  report.report_consistency_integrity !== 'PASS' ||
  report.manifest_consistency_integrity !== 'PASS' ||
  report.safe_create_policy_preserved !== 'PASS' ||
  report.all_level3_artifacts_present !== 'PASS' ||
  report.cross_phase_traceability_valid !== 'PASS' ||
  report.memory_bindings_preserved !== 'PASS' ||
  report.runtime_safety_preserved !== 'PASS' ||
  report.test_mode_constraints_preserved !== 'PASS' ||
  report.audit_complete !== 'PASS' ||
  report.artifact_missing !== false ||
  report.traceability_break !== false ||
  report.memory_binding_loss !== false ||
  report.runtime_safety_loss !== false ||
  report.test_mode_violation !== false ||
  report.report_manifest_mismatch !== false ||
  report.safe_create_policy_violation !== false ||
  report.production_engine_integrity_audit_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS ||
  report.phase_integrity_audits.every((audit) => audit.integrity_status === 'PASS') === false ||
  report.cross_phase_traceability_chain.every((entry) => entry.chain_valid) === false ||
  report.memory_binding_audits.length !== 4
) {
  console.error(
    `Expected PASS with all ${LEVEL3_PHASE_COUNT} Level3 phases verified, traceability intact, and ${PRODUCTION_BLUEPRINT_TYPE_COUNT} blueprint types preserved`
  );
  process.exit(1);
}

process.exit(0);
