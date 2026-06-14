import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import { writeMvProductionReadyGate } from '../services/mvProductionReadyGate.js';
import { writeMvProductionReadyGateReentryHardening } from '../services/mvProductionReadyGateReentryHardening.js';
import { writeMvProductionReadyGateEligibilityAuditHardening } from '../services/mvProductionReadyGateEligibilityAuditHardening.js';
import { writeMvProductionReadyGateStateAuditHardening } from '../services/mvProductionReadyGateStateAuditHardening.js';
import { writeMvProductionReadyCertificationBlockedState } from '../services/mvProductionReadyCertificationBlockedState.js';
import { writeMvProductionReadyReentryTracking } from '../services/mvProductionReadyReentryTracking.js';
import { writeMvProductionReadyReentryCompletionGate } from '../services/mvProductionReadyReentryCompletionGate.js';
import { writeMvProductionReadyReentryProgressAudit } from '../services/mvProductionReadyReentryProgressAudit.js';
import { writeMvProductionReadyReentryFinalReadiness } from '../services/mvProductionReadyReentryFinalReadiness.js';
import {
  AUTHORIZED_REENTRY_PATH,
  FINAL_HARDENING_PHASE,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_DIR,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_EXPORT_DIR,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH,
  NO_NEW_GATE_ALLOWED,
  REENTRY_TERMINATION_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  REENTRY_TERMINATION_TRACKED_STATUS,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyReentryTerminationGate,
} from '../services/mvProductionReadyReentryTerminationGate.js';
import { NEXT_REENTRY_GATE_LABEL } from '../services/mvProductionReadyReentryTracking.js';
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
writeMvProductionReadyCertificationBlockedState(projectRoot);
writeMvProductionReadyReentryTracking(projectRoot);
writeMvProductionReadyReentryCompletionGate(projectRoot);
writeMvProductionReadyReentryProgressAudit(projectRoot);
writeMvProductionReadyReentryFinalReadiness(projectRoot);

const report = writeMvProductionReadyReentryTerminationGate(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} reentry_termination_gate_id=${report.reentry_termination_gate_id} source_final_readiness_ref=${report.source_final_readiness_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} remaining_high_priority_count=${report.remaining_high_priority_count} reentry_termination_ready=${report.reentry_termination_ready} reentry_termination_reason=${report.reentry_termination_reason} production_ready_entry_allowed=${report.production_ready_entry_allowed} final_hardening_phase=${report.final_hardening_phase} no_new_gate_allowed=${report.no_new_gate_allowed} authorized_reentry_path=${report.authorized_reentry_path.join('>')} next_reentry_gate_label=${report.next_reentry_gate_label} execution_scope=${report.execution_scope} final_readiness_consumed=${report.final_readiness_consumed} reentry_termination_ready_valid=${report.reentry_termination_ready_valid} reentry_termination_reason_valid=${report.reentry_termination_reason_valid} production_ready_entry_allowed_valid=${report.production_ready_entry_allowed_valid} final_hardening_phase_valid=${report.final_hardening_phase_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} reentry_termination_premature=${report.reentry_termination_premature} production_ready_entry_not_allowed=${report.production_ready_entry_not_allowed} additional_hardening_phase_attempted=${report.additional_hardening_phase_attempted} mv_production_ready_reentry_termination_gate_ready=${report.mv_production_ready_reentry_termination_gate_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.termination_gate_checks.length !== 4 ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.reentry_termination_ready !== false ||
  report.reentry_termination_reason !== REENTRY_TERMINATION_REASON_HIGH_PRIORITY_ITEMS_REMAINING ||
  report.production_ready_entry_allowed !== false ||
  report.final_hardening_phase !== FINAL_HARDENING_PHASE ||
  report.no_new_gate_allowed !== NO_NEW_GATE_ALLOWED ||
  report.authorized_reentry_path.join('>') !== AUTHORIZED_REENTRY_PATH.join('>') ||
  report.next_reentry_gate_label !== NEXT_REENTRY_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.final_readiness_consumed !== 'PASS' ||
  report.reentry_termination_ready_valid !== 'PASS' ||
  report.reentry_termination_reason_valid !== 'PASS' ||
  report.production_ready_entry_allowed_valid !== 'PASS' ||
  report.final_hardening_phase_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.reentry_termination_premature !== false ||
  report.production_ready_entry_not_allowed !== false ||
  report.additional_hardening_phase_attempted !== false ||
  report.mv_production_ready_reentry_termination_gate_ready !== 'PASS' ||
  report.certification_status !== REENTRY_TERMINATION_TRACKED_STATUS ||
  report.next_stage_approved !== true ||
  report.termination_gate_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with REENTRY_TERMINATION_TRACKED, DS_024E_FIXED final phase, and no_new_gate_allowed=true'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH), 'utf8')
) as {
  remaining_high_priority_count: number;
  reentry_termination_ready: boolean;
  reentry_termination_reason: string;
  production_ready_entry_allowed: boolean;
  final_hardening_phase: string;
  no_new_gate_allowed: boolean;
  authorized_reentry_path: string[];
  next_reentry_gate_label: string;
  target_readiness_tier: string;
  reentry_termination_gate_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.reentry_termination_ready !== false ||
  artifact.reentry_termination_reason !== REENTRY_TERMINATION_REASON_HIGH_PRIORITY_ITEMS_REMAINING ||
  artifact.production_ready_entry_allowed !== false ||
  artifact.final_hardening_phase !== FINAL_HARDENING_PHASE ||
  artifact.no_new_gate_allowed !== NO_NEW_GATE_ALLOWED ||
  artifact.authorized_reentry_path.join('>') !== AUTHORIZED_REENTRY_PATH.join('>') ||
  artifact.next_reentry_gate_label !== NEXT_REENTRY_GATE_LABEL ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.reentry_termination_gate_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected reentry termination gate output');
  process.exit(1);
}

process.exit(0);
