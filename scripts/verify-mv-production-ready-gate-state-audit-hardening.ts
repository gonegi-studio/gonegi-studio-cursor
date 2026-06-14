import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import { PRODUCTION_CANDIDATE_CERTIFIED_STATUS } from '../services/mvProductionCandidateCertification.js';
import { writeMvProductionReadyGate } from '../services/mvProductionReadyGate.js';
import { writeMvProductionReadyGateReentryHardening } from '../services/mvProductionReadyGateReentryHardening.js';
import { writeMvProductionReadyGateEligibilityAuditHardening } from '../services/mvProductionReadyGateEligibilityAuditHardening.js';
import {
  GATE_STATE_BLOCKED,
  GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_DIR,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_EXPORT_DIR,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PASS_VERDICT,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyGateStateAuditHardening,
} from '../services/mvProductionReadyGateStateAuditHardening.js';
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

const report = writeMvProductionReadyGateStateAuditHardening(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} state_audit_hardening_id=${report.state_audit_hardening_id} source_eligibility_audit_ref=${report.source_eligibility_audit_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} gate_state=${report.gate_state} gate_state_reason=${report.gate_state_reason} gate_reentry_required=${report.gate_reentry_required} production_ready_status=${report.production_ready_status} production_ready=${report.production_ready} remaining_high_priority_count=${report.remaining_high_priority_count} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} eligibility_audit_consumed=${report.eligibility_audit_consumed} gate_state_valid=${report.gate_state_valid} gate_state_reason_valid=${report.gate_state_reason_valid} gate_reentry_required_valid=${report.gate_reentry_required_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} gate_state_invalid=${report.gate_state_invalid} gate_state_reason_missing=${report.gate_state_reason_missing} gate_reentry_required_invalid=${report.gate_reentry_required_invalid} production_ready_path_blocked=${report.production_ready_path_blocked} eligibility_audit_missing=${report.eligibility_audit_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_ready_gate_state_audit_hardening_ready=${report.mv_production_ready_gate_state_audit_hardening_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.state_audit_checks.length !== 3 ||
  report.gate_state !== GATE_STATE_BLOCKED ||
  report.gate_state_reason !== GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING ||
  report.gate_reentry_required !== true ||
  report.production_ready_status !== PRODUCTION_CANDIDATE_CERTIFIED_STATUS ||
  report.production_ready !== false ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.eligibility_audit_consumed !== 'PASS' ||
  report.gate_state_valid !== 'PASS' ||
  report.gate_state_reason_valid !== 'PASS' ||
  report.gate_reentry_required_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.gate_state_invalid !== false ||
  report.gate_state_reason_missing !== false ||
  report.gate_reentry_required_invalid !== false ||
  report.production_ready_path_blocked !== false ||
  report.eligibility_audit_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_ready_gate_state_audit_hardening_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS ||
  report.next_stage_approved !== true ||
  report.state_audit_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with BLOCKED gate, HIGH_PRIORITY_ITEMS_REMAINING reason, gate_reentry_required=true, and PRODUCTION_CANDIDATE_CERTIFIED maintained'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH), 'utf8')
) as {
  gate_state: string;
  gate_state_reason: string;
  gate_reentry_required: boolean;
  production_ready_status: string;
  production_ready: boolean;
  remaining_high_priority_count: number;
  target_readiness_tier: string;
  next_stage_gate_label: string;
  state_audit_hardening_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.gate_state !== GATE_STATE_BLOCKED ||
  artifact.gate_state_reason !== GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING ||
  artifact.gate_reentry_required !== true ||
  artifact.production_ready_status !== PRODUCTION_CANDIDATE_CERTIFIED_STATUS ||
  artifact.production_ready !== false ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.state_audit_hardening_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected gate state audit hardening output');
  process.exit(1);
}

process.exit(0);
