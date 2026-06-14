import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS,
} from '../services/mvHighPriorityResolutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_EXPORT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MD_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  RESOLUTION_OWNER_BY_BLOCKER_CODE,
  RESOLUTION_TARGET_PHASE,
  SAFE_CREATE_POLICY,
  writeMvHighPriorityResolutionAuditHardening,
} from '../services/mvHighPriorityResolutionAuditHardening.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT = 3;
const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 0;
const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_CONSISTENCY_CATEGORY_COUNT = 1;
const EXPECTED_OPERATIONAL_CATEGORY_COUNT = 2;

const EXPECTED_HIGH_PRIORITY_ITEM_IDS = [
  'dataset_refs_empty_story_mv_generation_plan_v1',
  'production_mode_blocked',
  'real_generation_blocked',
] as const;

const EXPECTED_HIGH_PRIORITY_BLOCKER_CODES = [
  'DATASET_REFS_EMPTY',
  'PRODUCTION_MODE_BLOCKED',
  'REAL_GENERATION_BLOCKED',
] as const;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const auditReportPath = path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH);
const auditArtifactPath = path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH);

if (!fs.existsSync(auditReportPath) || !fs.existsSync(auditArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV high priority resolution audit report or artifact');
  process.exit(1);
}

const auditReport = JSON.parse(fs.readFileSync(auditReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  next_stage_ready: string;
  mv_high_priority_resolution_audit_ready: string;
};

if (
  auditReport.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT ||
  auditReport.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS ||
  auditReport.next_stage_ready !== 'PASS' ||
  auditReport.mv_high_priority_resolution_audit_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH} must be ${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT} with ${MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS}`
  );
  process.exit(1);
}

const report = writeMvHighPriorityResolutionAuditHardening(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} hardening_id=${report.hardening_id} source_audit_ref=${report.source_audit_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} high_priority_items=${report.high_priority_items.join(',')} high_priority_item_ids=${report.high_priority_item_ids.join(',')} production_ready_dependency_required=${report.production_ready_dependency.required} high_priority_resolution_count=${report.high_priority_resolution_count} resolved_high_priority_count=${report.resolved_high_priority_count} remaining_high_priority_count=${report.remaining_high_priority_count} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} audit_consumed=${report.audit_consumed} high_priority_category_breakdown_valid=${report.high_priority_category_breakdown_valid} resolution_target_phase_valid=${report.resolution_target_phase_valid} production_ready_dependency_valid=${report.production_ready_dependency_valid} high_priority_item_ids_valid=${report.high_priority_item_ids_valid} acceptance_criteria_valid=${report.acceptance_criteria_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} high_priority_category_missing=${report.high_priority_category_missing} resolution_target_phase_missing=${report.resolution_target_phase_missing} production_ready_dependency_missing=${report.production_ready_dependency_missing} high_priority_item_ids_missing=${report.high_priority_item_ids_missing} acceptance_criteria_missing=${report.acceptance_criteria_missing} audit_missing=${report.audit_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_high_priority_resolution_audit_hardening_ready=${report.mv_high_priority_resolution_audit_hardening_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (let index = 0; index < report.high_priority_items.length; index++) {
  const blockerCode = report.high_priority_items[index];
  console.log(
    `  item ${blockerCode} id=${report.high_priority_item_ids[index]} phase=${report.resolution_target_phase[blockerCode]} owner=${report.resolution_owner[blockerCode]}`
  );
}
console.log(`report=${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH}`);
console.log(`markdown=${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MD_PATH}`);
console.log(`manifest=${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH}`);
console.log(`artifact=${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.hardening_checks.length !== 5 ||
  report.high_priority_items.length !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  report.high_priority_item_ids.length !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  report.high_priority_resolution_count !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.production_ready_dependency.required !== true ||
  report.production_ready_dependency.dependent_blocker_codes.length !==
    EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  (report.high_priority_category_breakdown.consistency ?? 0) !== EXPECTED_CONSISTENCY_CATEGORY_COUNT ||
  (report.high_priority_category_breakdown.operational ?? 0) !== EXPECTED_OPERATIONAL_CATEGORY_COUNT ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.audit_consumed !== 'PASS' ||
  report.high_priority_category_breakdown_valid !== 'PASS' ||
  report.resolution_target_phase_valid !== 'PASS' ||
  report.production_ready_dependency_valid !== 'PASS' ||
  report.high_priority_item_ids_valid !== 'PASS' ||
  report.acceptance_criteria_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.high_priority_category_missing !== false ||
  report.resolution_target_phase_missing !== false ||
  report.production_ready_dependency_missing !== false ||
  report.high_priority_item_ids_missing !== false ||
  report.acceptance_criteria_missing !== false ||
  report.audit_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_high_priority_resolution_audit_hardening_ready !== 'PASS' ||
  report.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS ||
  report.next_stage_approved !== true ||
  report.hardening_checks.every((check) => check.status === 'PASS') === false ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => report.high_priority_items.includes(blockerCode)
  ) === false ||
  EXPECTED_HIGH_PRIORITY_ITEM_IDS.every((itemId) => report.high_priority_item_ids.includes(itemId)) ===
    false ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => report.resolution_target_phase[blockerCode] === RESOLUTION_TARGET_PHASE
  ) === false ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => report.resolution_owner[blockerCode] === RESOLUTION_OWNER_BY_BLOCKER_CODE[blockerCode]
  ) === false ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => report.acceptance_criteria[blockerCode]?.length > 0
  ) === false
) {
  console.error(
    'Expected PASS with hardened category breakdown, DS_022 targets, owners, acceptance criteria, and DS_022_ENTRY gate'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH), 'utf8')
) as {
  source_audit_ref: string;
  high_priority_item_ids: string[];
  production_ready_dependency: { required: boolean; dependent_blocker_codes: string[] };
  target_readiness_tier: string;
  next_stage_gate_label: string;
  hardening_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.source_audit_ref !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH ||
  artifact.high_priority_item_ids.length !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  artifact.production_ready_dependency.required !== true ||
  artifact.production_ready_dependency.dependent_blocker_codes.length !==
    EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.hardening_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected high priority resolution audit hardening output');
  process.exit(1);
}

process.exit(0);
