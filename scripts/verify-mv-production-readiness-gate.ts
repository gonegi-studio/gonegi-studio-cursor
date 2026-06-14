import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  DIGITAL_STUDIO_CHAIN_PHASE_COUNT,
  MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS,
  MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
  MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT,
  MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH,
} from '../services/mvTestModeFinalAudit.js';
import {
  DIGITAL_STUDIO_READINESS_PHASE_COUNT,
  MAX_PRODUCTION_READINESS_SCORE,
  MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READINESS_GATE_DIR,
  MV_PRODUCTION_READINESS_GATE_EXPORT_DIR,
  MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READINESS_GATE_MD_PATH,
  MV_PRODUCTION_READINESS_GATE_PASS_VERDICT,
  MV_PRODUCTION_READINESS_GATE_READY_STATUS,
  MV_PRODUCTION_READINESS_GATE_REPORT_PATH,
  NEXT_STAGE_GATE_LABEL,
  PRODUCTION_READINESS_TIER_TEST_READY,
  SAFE_CREATE_POLICY,
  writeMvProductionReadinessGate,
} from '../services/mvProductionReadinessGate.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const finalAuditReportPath = path.join(projectRoot, MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH);
const finalAuditArtifactPath = path.join(projectRoot, MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH);

if (!fs.existsSync(finalAuditReportPath) || !fs.existsSync(finalAuditArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV test mode final audit report or artifact');
  process.exit(1);
}

const finalAuditReport = JSON.parse(fs.readFileSync(finalAuditReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  digital_studio_test_chain_complete: string;
};

if (
  finalAuditReport.final_verdict !== MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT ||
  finalAuditReport.certification_status !== MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS ||
  finalAuditReport.digital_studio_test_chain_complete !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH} must be ${MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT} with ${MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS}`
  );
  process.exit(1);
}

const report = writeMvProductionReadinessGate(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} readiness_gate_id=${report.readiness_gate_id} source_final_audit_ref=${report.source_final_audit_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} digital_studio_readiness_phase_count=${report.digital_studio_readiness_phase_count} production_readiness_score=${report.production_readiness_score} production_readiness_status=${report.production_readiness_status ?? 'NONE'} production_readiness_tier=${report.production_readiness_tier ?? 'NONE'} critical_blocker_count=${report.critical_blocker_count} warning_count=${report.warning_count} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} final_audit_consumed=${report.final_audit_consumed} digital_studio_test_chain_complete=${report.digital_studio_test_chain_complete} production_readiness_score_valid=${report.production_readiness_score_valid} production_readiness_tier_valid=${report.production_readiness_tier_valid} critical_blocker_count_valid=${report.critical_blocker_count_valid} warning_count_valid=${report.warning_count_valid} remaining_blockers_identified=${report.remaining_blockers_identified} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} final_audit_missing=${report.final_audit_missing} digital_studio_test_chain_incomplete=${report.digital_studio_test_chain_incomplete} production_readiness_score_invalid=${report.production_readiness_score_invalid} production_readiness_tier_invalid=${report.production_readiness_tier_invalid} critical_blocker_unresolved=${report.critical_blocker_unresolved} critical_blocker_count_invalid=${report.critical_blocker_count_invalid} warning_count_invalid=${report.warning_count_invalid} remaining_blockers_missing=${report.remaining_blockers_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_readiness_gate_ready=${report.mv_production_readiness_gate_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const audit of report.phase_readiness_audits) {
  console.log(
    `  phase ${audit.phase_level}: certified=${audit.phase_certified} manifest_integrity=${audit.manifest_integrity_valid}`
  );
}
for (const blocker of report.remaining_blockers) {
  console.log(`  blocker [${blocker.severity}] ${blocker.blocker_code}: ${blocker.message}`);
}
console.log(`report=${MV_PRODUCTION_READINESS_GATE_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_READINESS_GATE_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READINESS_GATE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_GATE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_GATE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_GATE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.digital_studio_readiness_phase_count !== DIGITAL_STUDIO_READINESS_PHASE_COUNT ||
  report.digital_studio_readiness_phase_count !== DIGITAL_STUDIO_CHAIN_PHASE_COUNT ||
  report.phase_readiness_audits.length !== DIGITAL_STUDIO_READINESS_PHASE_COUNT ||
  report.readiness_gate_checks.length !== 10 ||
  report.production_readiness_score !== MAX_PRODUCTION_READINESS_SCORE ||
  report.production_readiness_tier !== PRODUCTION_READINESS_TIER_TEST_READY ||
  report.production_readiness_status !== MV_PRODUCTION_READINESS_GATE_READY_STATUS ||
  report.critical_blocker_count !== 0 ||
  report.warning_count !== report.remaining_blockers.filter((blocker) => blocker.severity === 'warning').length ||
  report.remaining_blockers.length > 0 === false ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.final_audit_consumed !== 'PASS' ||
  report.digital_studio_test_chain_complete !== 'PASS' ||
  report.production_readiness_score_valid !== 'PASS' ||
  report.production_readiness_tier_valid !== 'PASS' ||
  report.critical_blocker_count_valid !== 'PASS' ||
  report.warning_count_valid !== 'PASS' ||
  report.remaining_blockers_identified !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.final_audit_missing !== false ||
  report.digital_studio_test_chain_incomplete !== false ||
  report.production_readiness_score_invalid !== false ||
  report.production_readiness_tier_invalid !== false ||
  report.critical_blocker_unresolved !== false ||
  report.critical_blocker_count_invalid !== false ||
  report.warning_count_invalid !== false ||
  report.remaining_blockers_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_readiness_gate_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_READINESS_GATE_READY_STATUS ||
  report.next_stage_approved !== true ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== 4 ||
  report.phase_readiness_audits.every((audit) => audit.phase_certified) === false ||
  report.phase_readiness_audits.every((audit) => audit.manifest_integrity_valid) === false ||
  report.readiness_gate_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${DIGITAL_STUDIO_READINESS_PHASE_COUNT} Digital Studio phases certified, TEST_READY tier, and DS-015 gate ready`
  );
  process.exit(1);
}

process.exit(0);
