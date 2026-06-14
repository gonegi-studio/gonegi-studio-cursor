import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_EXPORT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MD_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  RESOLUTION_STATUS_OPEN,
  SAFE_CREATE_POLICY,
  writeMvHighPriorityResolutionAudit,
} from '../services/mvHighPriorityResolutionAudit.js';
import {
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH,
  PRODUCTION_CANDIDATE_CERTIFIED_STATUS,
} from '../services/mvProductionCandidateCertification.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT = 3;
const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 0;
const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 3;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const candidateReportPath = path.join(projectRoot, MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH);
const candidateArtifactPath = path.join(projectRoot, MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH);

if (!fs.existsSync(candidateReportPath) || !fs.existsSync(candidateArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production candidate certification report or artifact');
  process.exit(1);
}

const candidateReport = JSON.parse(fs.readFileSync(candidateReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  next_stage_ready: string;
  mv_production_candidate_certification_ready: string;
  remaining_high_priority_count: number;
  resolved_high_priority_count: number;
  high_priority_requirement_count: number;
};

if (
  candidateReport.final_verdict !== MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT ||
  candidateReport.certification_status !== PRODUCTION_CANDIDATE_CERTIFIED_STATUS ||
  candidateReport.next_stage_ready !== 'PASS' ||
  candidateReport.mv_production_candidate_certification_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH} must be ${MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT} with ${PRODUCTION_CANDIDATE_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

const report = writeMvHighPriorityResolutionAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} audit_id=${report.audit_id} source_candidate_certification_ref=${report.source_candidate_certification_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} high_priority_items=${report.high_priority_items.join(',')} required_for_production_ready=${report.required_for_production_ready} high_priority_resolution_count=${report.high_priority_resolution_count} resolved_high_priority_count=${report.resolved_high_priority_count} remaining_high_priority_count=${report.remaining_high_priority_count} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} candidate_certification_consumed=${report.candidate_certification_consumed} high_priority_items_valid=${report.high_priority_items_valid} resolution_status_by_item_valid=${report.resolution_status_by_item_valid} required_for_production_ready_valid=${report.required_for_production_ready_valid} remaining_high_priority_count_valid=${report.remaining_high_priority_count_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} high_priority_items_missing=${report.high_priority_items_missing} resolution_status_invalid=${report.resolution_status_invalid} production_ready_blocked=${report.production_ready_blocked} candidate_certification_missing=${report.candidate_certification_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_high_priority_resolution_audit_ready=${report.mv_high_priority_resolution_audit_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const blockerCode of report.high_priority_items) {
  console.log(
    `  item ${blockerCode} status=${report.resolution_status_by_item[blockerCode]}`
  );
}
console.log(`report=${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH}`);
console.log(`markdown=${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MD_PATH}`);
console.log(`manifest=${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH}`);
console.log(`artifact=${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.audit_checks.length !== 4 ||
  report.high_priority_items.length !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  report.high_priority_resolution_count !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.required_for_production_ready !== true ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.candidate_certification_consumed !== 'PASS' ||
  report.high_priority_items_valid !== 'PASS' ||
  report.resolution_status_by_item_valid !== 'PASS' ||
  report.required_for_production_ready_valid !== 'PASS' ||
  report.remaining_high_priority_count_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.high_priority_items_missing !== false ||
  report.resolution_status_invalid !== false ||
  report.production_ready_blocked !== false ||
  report.candidate_certification_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_high_priority_resolution_audit_ready !== 'PASS' ||
  report.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS ||
  report.next_stage_approved !== true ||
  report.audit_checks.every((check) => check.status === 'PASS') === false ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => report.high_priority_items.includes(blockerCode)
  ) === false ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => report.resolution_status_by_item[blockerCode] === RESOLUTION_STATUS_OPEN
  ) === false ||
  report.resolved_high_priority_count + report.remaining_high_priority_count !==
    EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT
) {
  console.error(
    'Expected PASS with 3 OPEN HIGH items, required_for_production_ready=true, 0 resolved / 3 remaining, and DS_022_ENTRY gate'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH), 'utf8')
) as {
  source_candidate_certification_ref: string;
  high_priority_items: string[];
  resolution_status_by_item: Record<string, string>;
  required_for_production_ready: boolean;
  high_priority_resolution_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  target_readiness_tier: string;
  next_stage_gate_label: string;
  audit_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.source_candidate_certification_ref !== MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH ||
  artifact.high_priority_items.length !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  artifact.required_for_production_ready !== true ||
  artifact.high_priority_resolution_count !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  artifact.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.audit_complete !== true ||
  artifact.next_stage_ready !== true ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => artifact.resolution_status_by_item[blockerCode] === RESOLUTION_STATUS_OPEN
  ) === false
) {
  console.error('Artifact fields do not match expected high priority resolution audit output');
  process.exit(1);
}

process.exit(0);
