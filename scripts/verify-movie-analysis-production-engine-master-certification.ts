import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LEVEL3_MASTER_PHASE_COUNT,
  NEXT_STAGE_LABEL,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_DIR,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_EXPORT_DIR,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_MD_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
  SAFE_CREATE_POLICY,
  writeMovieAnalysisProductionEngineMasterCertification,
} from '../services/movieAnalysisProductionEngineMasterCertification.js';
import {
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS,
} from '../services/movieAnalysisProductionEngineIntegrityAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const integrityAuditReportPath = path.join(projectRoot, PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH);
const integrityAuditArtifactPath = path.join(projectRoot, PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH);

if (!fs.existsSync(integrityAuditReportPath) || !fs.existsSync(integrityAuditArtifactPath)) {
  console.error('PRECHECK FAIL: Missing production engine integrity audit report or artifact');
  process.exit(1);
}

const integrityAuditReport = JSON.parse(fs.readFileSync(integrityAuditReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  integrityAuditReport.final_verdict !== PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT ||
  integrityAuditReport.certification_status !== PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH} must be ${PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT} with ${PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisProductionEngineMasterCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level3_master_phase_count=${report.level3_master_phase_count} all_level3_phases_certified=${report.all_level3_phases_certified} integrity_audit_verified=${report.integrity_audit_verified} traceability_chain_verified=${report.traceability_chain_verified} memory_binding_verified=${report.memory_binding_verified} runtime_safety_verified=${report.runtime_safety_verified} test_mode_constraints_verified=${report.test_mode_constraints_verified} report_manifest_consistency_verified=${report.report_manifest_consistency_verified} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_readiness=${report.next_stage_readiness} test_execution_ready=${report.test_execution_ready} production_execution_blocked=${report.production_execution_blocked} master_certification_complete=${report.master_certification_complete} level3_foundation_complete=${report.level3_foundation_complete} production_engine_ready_for_next_stage=${report.production_engine_ready_for_next_stage} traceability_preserved=${report.traceability_preserved} phase_certification_missing=${report.phase_certification_missing} integrity_audit_failed=${report.integrity_audit_failed} traceability_break=${report.traceability_break} memory_binding_loss=${report.memory_binding_loss} runtime_safety_loss=${report.runtime_safety_loss} report_manifest_mismatch=${report.report_manifest_mismatch} safe_create_policy_violation=${report.safe_create_policy_violation} next_stage_not_ready=${report.next_stage_not_ready} production_execution_unblocked=${report.production_execution_unblocked} production_engine_master_certification_ready=${report.production_engine_master_certification_ready} next_stage=${NEXT_STAGE_LABEL} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const audit of report.phase_certification_audits) {
  console.log(`  phase ${audit.phase_level}: certified=${audit.phase_certified} status=${audit.certification_status}`);
}
console.log(`report=${PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${PRODUCTION_ENGINE_MASTER_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_MASTER_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_MASTER_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level3_master_phase_count !== LEVEL3_MASTER_PHASE_COUNT ||
  report.phase_certification_audits.length !== LEVEL3_MASTER_PHASE_COUNT ||
  report.certification_checks.length !== 11 ||
  report.all_level3_phases_certified !== 'PASS' ||
  report.integrity_audit_verified !== 'PASS' ||
  report.traceability_chain_verified !== 'PASS' ||
  report.memory_binding_verified !== 'PASS' ||
  report.runtime_safety_verified !== 'PASS' ||
  report.test_mode_constraints_verified !== 'PASS' ||
  report.report_manifest_consistency_verified !== 'PASS' ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_readiness !== true ||
  report.test_execution_ready !== true ||
  report.production_execution_blocked !== true ||
  report.master_certification_complete !== 'PASS' ||
  report.level3_foundation_complete !== 'PASS' ||
  report.production_engine_ready_for_next_stage !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.phase_certification_missing !== false ||
  report.integrity_audit_failed !== false ||
  report.traceability_break !== false ||
  report.memory_binding_loss !== false ||
  report.runtime_safety_loss !== false ||
  report.report_manifest_mismatch !== false ||
  report.safe_create_policy_violation !== false ||
  report.next_stage_not_ready !== false ||
  report.production_execution_unblocked !== false ||
  report.production_engine_master_certification_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS ||
  report.phase_certification_audits.every((audit) => audit.phase_certified) === false ||
  report.certification_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${LEVEL3_MASTER_PHASE_COUNT} Level3 phases certified, integrity verified, and next stage readiness confirmed`
  );
  process.exit(1);
}

process.exit(0);
