import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import { PRODUCTION_CANDIDATE_CERTIFIED_STATUS } from '../services/mvProductionCandidateCertification.js';
import { writeMvProductionReadyGate } from '../services/mvProductionReadyGate.js';
import { writeMvProductionReadyGateReentryHardening } from '../services/mvProductionReadyGateReentryHardening.js';
import { writeMvProductionReadyGateEligibilityAuditHardening } from '../services/mvProductionReadyGateEligibilityAuditHardening.js';
import { writeMvProductionReadyGateStateAuditHardening } from '../services/mvProductionReadyGateStateAuditHardening.js';
import { GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT } from '../services/mvProductionReadyGateReentryHardening.js';
import {
  BLOCKED_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_DIR,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_EXPORT_DIR,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PASS_VERDICT,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH,
  PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyCertificationBlockedState,
} from '../services/mvProductionReadyCertificationBlockedState.js';
import { GATE_STATE_BLOCKED } from '../services/mvProductionReadyGateStateAuditHardening.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

writeMvProductionReadyGate(projectRoot);
writeMvProductionReadyGateReentryHardening(projectRoot);
writeMvProductionReadyGateEligibilityAuditHardening(projectRoot);
writeMvProductionReadyGateStateAuditHardening(projectRoot);

const report = writeMvProductionReadyCertificationBlockedState(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} blocked_state_id=${report.blocked_state_id} source_state_audit_ref=${report.source_state_audit_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} production_ready_certification_allowed=${report.production_ready_certification_allowed} production_ready_status=${report.production_ready_status} gate_reentry_required=${report.gate_reentry_required} blocked_reason=${report.blocked_reason} remaining_high_priority_count=${report.remaining_high_priority_count} gate_state=${report.gate_state} production_ready=${report.production_ready} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} state_audit_consumed=${report.state_audit_consumed} production_ready_certification_allowed_valid=${report.production_ready_certification_allowed_valid} production_ready_status_valid=${report.production_ready_status_valid} gate_reentry_required_valid=${report.gate_reentry_required_valid} blocked_reason_valid=${report.blocked_reason_valid} remaining_high_priority_count_valid=${report.remaining_high_priority_count_valid} required_reentry_condition_valid=${report.required_reentry_condition_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} production_ready_certification_premature=${report.production_ready_certification_premature} production_ready_status_invalid=${report.production_ready_status_invalid} gate_reentry_required_invalid=${report.gate_reentry_required_invalid} blocked_reason_missing=${report.blocked_reason_missing} required_reentry_condition_missing=${report.required_reentry_condition_missing} mv_production_ready_certification_blocked_state_ready=${report.mv_production_ready_certification_blocked_state_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.blocked_state_checks.length !== 6 ||
  report.production_ready_certification_allowed !== false ||
  report.production_ready_status !== PRODUCTION_CANDIDATE_CERTIFIED_STATUS ||
  report.gate_reentry_required !== true ||
  report.blocked_reason !== BLOCKED_REASON_HIGH_PRIORITY_ITEMS_REMAINING ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.gate_state !== GATE_STATE_BLOCKED ||
  report.production_ready !== false ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.state_audit_consumed !== 'PASS' ||
  report.production_ready_certification_allowed_valid !== 'PASS' ||
  report.production_ready_status_valid !== 'PASS' ||
  report.gate_reentry_required_valid !== 'PASS' ||
  report.blocked_reason_valid !== 'PASS' ||
  report.remaining_high_priority_count_valid !== 'PASS' ||
  report.required_reentry_condition_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.production_ready_certification_premature !== false ||
  report.production_ready_status_invalid !== false ||
  report.gate_reentry_required_invalid !== false ||
  report.blocked_reason_missing !== false ||
  report.required_reentry_condition_missing !== false ||
  report.mv_production_ready_certification_blocked_state_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS ||
  report.next_stage_approved !== true ||
  report.blocked_state_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with PRODUCTION_READY_CERTIFICATION_BLOCKED, PRODUCTION_CANDIDATE_CERTIFIED maintained, and certification allowed=false'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH), 'utf8')
) as {
  production_ready_certification_allowed: boolean;
  production_ready_status: string;
  gate_reentry_required: boolean;
  blocked_reason: string;
  remaining_high_priority_count: number;
  required_reentry_condition: {
    remaining_high_priority_count: number;
    high_priority_resolution_target_met: boolean;
    production_ready_gate_eligible: boolean;
  };
  gate_state: string;
  production_ready: boolean;
  target_readiness_tier: string;
  next_stage_gate_label: string;
  blocked_state_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.production_ready_certification_allowed !== false ||
  artifact.production_ready_status !== PRODUCTION_CANDIDATE_CERTIFIED_STATUS ||
  artifact.gate_reentry_required !== true ||
  artifact.blocked_reason !== BLOCKED_REASON_HIGH_PRIORITY_ITEMS_REMAINING ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.required_reentry_condition.remaining_high_priority_count !==
    GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.required_reentry_condition.high_priority_resolution_target_met !== true ||
  artifact.required_reentry_condition.production_ready_gate_eligible !== true ||
  artifact.gate_state !== GATE_STATE_BLOCKED ||
  artifact.production_ready !== false ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.blocked_state_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected blocked certification state output');
  process.exit(1);
}

process.exit(0);
