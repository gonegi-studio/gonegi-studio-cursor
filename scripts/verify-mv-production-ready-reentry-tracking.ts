import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXPECTED_HIGH_PRIORITY_BLOCKER_CODES } from '../services/mvHighPriorityResolutionAudit.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import { writeMvProductionReadyGate } from '../services/mvProductionReadyGate.js';
import { writeMvProductionReadyGateReentryHardening } from '../services/mvProductionReadyGateReentryHardening.js';
import { writeMvProductionReadyGateEligibilityAuditHardening } from '../services/mvProductionReadyGateEligibilityAuditHardening.js';
import { writeMvProductionReadyGateStateAuditHardening } from '../services/mvProductionReadyGateStateAuditHardening.js';
import { writeMvProductionReadyCertificationBlockedState } from '../services/mvProductionReadyCertificationBlockedState.js';
import { GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT } from '../services/mvProductionReadyGateReentryHardening.js';
import {
  MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_TRACKING_DIR,
  MV_PRODUCTION_READY_REENTRY_TRACKING_EXPORT_DIR,
  MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_TRACKING_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH,
  NEXT_REENTRY_GATE_LABEL,
  PRODUCTION_READY_REENTRY_TRACKED_STATUS,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyReentryTracking,
} from '../services/mvProductionReadyReentryTracking.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 0;
const EXPECTED_REENTRY_PROGRESS_PERCENT = 0;
const EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.length;
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

const report = writeMvProductionReadyReentryTracking(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} reentry_tracking_id=${report.reentry_tracking_id} source_blocked_state_ref=${report.source_blocked_state_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} resolved_high_priority_count=${report.resolved_high_priority_count} remaining_high_priority_count=${report.remaining_high_priority_count} high_priority_resolution_count=${report.high_priority_resolution_count} reentry_progress_percent=${report.reentry_progress_percent} production_ready_path_clear=${report.production_ready_path_clear} next_reentry_gate_label=${report.next_reentry_gate_label} gate_reentry_required=${report.gate_reentry_required} execution_scope=${report.execution_scope} blocked_state_consumed=${report.blocked_state_consumed} resolved_high_priority_count_valid=${report.resolved_high_priority_count_valid} remaining_high_priority_count_valid=${report.remaining_high_priority_count_valid} reentry_progress_percent_valid=${report.reentry_progress_percent_valid} production_ready_path_clear_valid=${report.production_ready_path_clear_valid} required_reentry_condition_valid=${report.required_reentry_condition_valid} next_reentry_gate_label_valid=${report.next_reentry_gate_label_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} reentry_progress_invalid=${report.reentry_progress_invalid} production_ready_path_not_clear=${report.production_ready_path_not_clear} required_reentry_condition_missing=${report.required_reentry_condition_missing} next_reentry_gate_label_missing=${report.next_reentry_gate_label_missing} mv_production_ready_reentry_tracking_ready=${report.mv_production_ready_reentry_tracking_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_REENTRY_TRACKING_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TRACKING_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TRACKING_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.reentry_tracking_checks.length !== 6 ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.high_priority_resolution_count !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  report.reentry_progress_percent !== EXPECTED_REENTRY_PROGRESS_PERCENT ||
  report.production_ready_path_clear !== false ||
  report.next_reentry_gate_label !== NEXT_REENTRY_GATE_LABEL ||
  report.gate_reentry_required !== true ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.blocked_state_consumed !== 'PASS' ||
  report.resolved_high_priority_count_valid !== 'PASS' ||
  report.remaining_high_priority_count_valid !== 'PASS' ||
  report.reentry_progress_percent_valid !== 'PASS' ||
  report.production_ready_path_clear_valid !== 'PASS' ||
  report.required_reentry_condition_valid !== 'PASS' ||
  report.next_reentry_gate_label_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.reentry_progress_invalid !== false ||
  report.production_ready_path_not_clear !== false ||
  report.required_reentry_condition_missing !== false ||
  report.next_reentry_gate_label_missing !== false ||
  report.mv_production_ready_reentry_tracking_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_READY_REENTRY_TRACKED_STATUS ||
  report.next_stage_approved !== true ||
  report.reentry_tracking_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with PRODUCTION_READY_REENTRY_TRACKED, remaining=3, path_clear=false, and DS_023_REENTRY gate label'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH), 'utf8')
) as {
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  high_priority_resolution_count: number;
  reentry_progress_percent: number;
  production_ready_path_clear: boolean;
  required_reentry_condition: {
    remaining_high_priority_count: number;
    high_priority_resolution_target_met: boolean;
    production_ready_gate_eligible: boolean;
  };
  next_reentry_gate_label: string;
  gate_reentry_required: boolean;
  target_readiness_tier: string;
  reentry_tracking_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.high_priority_resolution_count !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  artifact.reentry_progress_percent !== EXPECTED_REENTRY_PROGRESS_PERCENT ||
  artifact.production_ready_path_clear !== false ||
  artifact.required_reentry_condition.remaining_high_priority_count !==
    GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.required_reentry_condition.high_priority_resolution_target_met !== true ||
  artifact.required_reentry_condition.production_ready_gate_eligible !== true ||
  artifact.next_reentry_gate_label !== NEXT_REENTRY_GATE_LABEL ||
  artifact.gate_reentry_required !== true ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.reentry_tracking_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected reentry tracking output');
  process.exit(1);
}

process.exit(0);
