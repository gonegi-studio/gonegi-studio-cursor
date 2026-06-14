import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  BLOCKER_CATEGORIES,
  BLOCKER_CATEGORY_CONSISTENCY,
  BLOCKER_CATEGORY_OPERATIONAL,
  BLOCKER_CATEGORY_TECHNICAL,
  MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_AUDIT_DIR,
  MV_PRODUCTION_BLOCKER_AUDIT_EXPORT_DIR,
  MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH,
  MV_PRODUCTION_BLOCKER_AUDIT_MD_PATH,
  MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_AUDITED_STATUS,
  MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH,
  NEXT_STAGE_GATE_LABEL,
  SAFE_CREATE_POLICY,
  writeMvProductionBlockerAudit,
} from '../services/mvProductionBlockerAudit.js';
import {
  MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_READINESS_CERTIFIED_STATUS,
} from '../services/mvProductionReadinessCertification.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY, PRODUCTION_READINESS_TIER_TEST_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_REMAINING_BLOCKER_COUNT = 6;
const EXPECTED_WARNING_BLOCKER_COUNT = 6;
const EXPECTED_CRITICAL_BLOCKER_COUNT = 0;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const certificationReportPath = path.join(
  projectRoot,
  MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH
);
const certificationArtifactPath = path.join(
  projectRoot,
  MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH
);

if (!fs.existsSync(certificationReportPath) || !fs.existsSync(certificationArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production readiness certification report or artifact');
  process.exit(1);
}

const certificationReport = JSON.parse(fs.readFileSync(certificationReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  readiness_certified: boolean;
  readiness_tier: string;
  next_stage_ready: string;
  mv_production_readiness_certification_ready: string;
};

if (
  certificationReport.final_verdict !== MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT ||
  certificationReport.certification_status !== MV_PRODUCTION_READINESS_CERTIFIED_STATUS ||
  certificationReport.readiness_certified !== true ||
  certificationReport.readiness_tier !== PRODUCTION_READINESS_TIER_TEST_READY ||
  certificationReport.next_stage_ready !== 'PASS' ||
  certificationReport.mv_production_readiness_certification_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH} must be ${MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT} with ${MV_PRODUCTION_READINESS_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

const report = writeMvProductionBlockerAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} audit_id=${report.audit_id} source_readiness_certification_ref=${report.source_readiness_certification_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} remaining_blocker_count=${report.remaining_blocker_count} critical_blocker_count=${report.critical_blocker_count} warning_blocker_count=${report.warning_blocker_count} blocker_severity_critical=${report.blocker_severity.critical} blocker_severity_warning=${report.blocker_severity.warning} blocker_severity_total=${report.blocker_severity.total} production_ready_candidate=${report.production_ready_candidate.candidate_ready} production_ready_candidate_critical_clear=${report.production_ready_candidate.critical_blockers_clear} production_ready_candidate_target=${report.production_ready_candidate.target_tier} blocker_resolution_plan_count=${report.blocker_resolution_plan.length} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} readiness_certification_consumed=${report.readiness_certification_consumed} remaining_blocker_count_valid=${report.remaining_blocker_count_valid} critical_blocker_count_valid=${report.critical_blocker_count_valid} warning_blocker_count_valid=${report.warning_blocker_count_valid} blocker_severity_valid=${report.blocker_severity_valid} blocker_category_breakdown_valid=${report.blocker_category_breakdown_valid} production_ready_candidate_valid=${report.production_ready_candidate_valid} blocker_resolution_plan_ready=${report.blocker_resolution_plan_ready} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} unresolved_critical_blocker=${report.unresolved_critical_blocker} critical_blocker_count_invalid=${report.critical_blocker_count_invalid} warning_blocker_count_invalid=${report.warning_blocker_count_invalid} blocker_severity_invalid=${report.blocker_severity_invalid} blocker_category_breakdown_missing=${report.blocker_category_breakdown_missing} production_ready_candidate_invalid=${report.production_ready_candidate_invalid} blocker_resolution_plan_missing=${report.blocker_resolution_plan_missing} readiness_certification_missing=${report.readiness_certification_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_blocker_audit_ready=${report.mv_production_blocker_audit_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const category of BLOCKER_CATEGORIES) {
  console.log(`  category ${category}=${report.blocker_category_breakdown[category]}`);
}
for (const blocker of report.audited_blockers) {
  console.log(
    `  blocker [${blocker.severity}/${blocker.category}] ${blocker.blocker_code}: ${blocker.message}`
  );
}
console.log(`report=${MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_BLOCKER_AUDIT_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.blocker_audit_checks.length !== 7 ||
  report.remaining_blocker_count !== EXPECTED_REMAINING_BLOCKER_COUNT ||
  report.critical_blocker_count !== EXPECTED_CRITICAL_BLOCKER_COUNT ||
  report.warning_blocker_count !== EXPECTED_WARNING_BLOCKER_COUNT ||
  report.blocker_severity.critical !== EXPECTED_CRITICAL_BLOCKER_COUNT ||
  report.blocker_severity.warning !== EXPECTED_WARNING_BLOCKER_COUNT ||
  report.blocker_severity.total !== EXPECTED_REMAINING_BLOCKER_COUNT ||
  report.blocker_category_breakdown.technical !== 3 ||
  report.blocker_category_breakdown.operational !== 2 ||
  report.blocker_category_breakdown.consistency !== 1 ||
  report.blocker_category_breakdown.quality !== 0 ||
  report.blocker_category_breakdown.workflow !== 0 ||
  report.production_ready_candidate.candidate_ready !== false ||
  report.production_ready_candidate.critical_blockers_clear !== true ||
  report.production_ready_candidate.current_tier !== PRODUCTION_READINESS_TIER_TEST_READY ||
  report.production_ready_candidate.target_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  report.production_ready_candidate.warning_blockers_remaining !== EXPECTED_WARNING_BLOCKER_COUNT ||
  report.production_ready_candidate.requirements.length === 0 ||
  report.blocker_resolution_plan.length !== EXPECTED_REMAINING_BLOCKER_COUNT ||
  report.audited_blockers.length !== EXPECTED_REMAINING_BLOCKER_COUNT ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.readiness_certification_consumed !== 'PASS' ||
  report.remaining_blocker_count_valid !== 'PASS' ||
  report.critical_blocker_count_valid !== 'PASS' ||
  report.warning_blocker_count_valid !== 'PASS' ||
  report.blocker_severity_valid !== 'PASS' ||
  report.blocker_category_breakdown_valid !== 'PASS' ||
  report.production_ready_candidate_valid !== 'PASS' ||
  report.blocker_resolution_plan_ready !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.unresolved_critical_blocker !== false ||
  report.critical_blocker_count_invalid !== false ||
  report.warning_blocker_count_invalid !== false ||
  report.blocker_severity_invalid !== false ||
  report.blocker_category_breakdown_missing !== false ||
  report.production_ready_candidate_invalid !== false ||
  report.blocker_resolution_plan_missing !== false ||
  report.readiness_certification_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_blocker_audit_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_BLOCKER_AUDITED_STATUS ||
  report.next_stage_approved !== true ||
  report.blocker_audit_checks.every((check) => check.status === 'PASS') === false ||
  report.blocker_resolution_plan.every((step) => step.plan_ready && step.target_phase === 'DS-017') ===
    false
) {
  console.error(
    'Expected PASS with critical_blocker_count=0, 6 warning blockers classified, and DS_017_ENTRY gate ready'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH), 'utf8')
) as {
  source_readiness_certification_ref: string;
  remaining_blocker_count: number;
  critical_blocker_count: number;
  warning_blocker_count: number;
  next_stage_gate_label: string;
  blocker_audit_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.source_readiness_certification_ref !== MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH ||
  artifact.remaining_blocker_count !== EXPECTED_REMAINING_BLOCKER_COUNT ||
  artifact.critical_blocker_count !== EXPECTED_CRITICAL_BLOCKER_COUNT ||
  artifact.warning_blocker_count !== EXPECTED_WARNING_BLOCKER_COUNT ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.blocker_audit_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected blocker audit output');
  process.exit(1);
}

process.exit(0);
