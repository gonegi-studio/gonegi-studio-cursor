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
import { writeMvProductionReadyReentryTracking } from '../services/mvProductionReadyReentryTracking.js';
import { writeMvProductionReadyReentryCompletionGate } from '../services/mvProductionReadyReentryCompletionGate.js';
import {
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_DIR,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_EXPORT_DIR,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH,
  PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS,
  REENTRY_PROGRESS_STATUS_NOT_STARTED,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyReentryProgressAudit,
} from '../services/mvProductionReadyReentryProgressAudit.js';
import { NEXT_REENTRY_GATE_LABEL } from '../services/mvProductionReadyReentryTracking.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_TOTAL_HIGH_PRIORITY_COUNT = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.length;
const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 0;
const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_REENTRY_PROGRESS_PERCENT = 0;
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

const report = writeMvProductionReadyReentryProgressAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} reentry_progress_audit_id=${report.reentry_progress_audit_id} source_completion_gate_ref=${report.source_completion_gate_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} total_high_priority_count=${report.total_high_priority_count} resolved_high_priority_count=${report.resolved_high_priority_count} remaining_high_priority_count=${report.remaining_high_priority_count} reentry_progress_percent=${report.reentry_progress_percent} reentry_progress_status=${report.reentry_progress_status} next_reentry_gate_label=${report.next_reentry_gate_label} reentry_completion_ready=${report.reentry_completion_ready} execution_scope=${report.execution_scope} completion_gate_consumed=${report.completion_gate_consumed} total_high_priority_count_valid=${report.total_high_priority_count_valid} resolved_high_priority_count_valid=${report.resolved_high_priority_count_valid} remaining_high_priority_count_valid=${report.remaining_high_priority_count_valid} reentry_progress_percent_valid=${report.reentry_progress_percent_valid} reentry_progress_status_valid=${report.reentry_progress_status_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} reentry_progress_inconsistent=${report.reentry_progress_inconsistent} reentry_progress_status_invalid=${report.reentry_progress_status_invalid} mv_production_ready_reentry_progress_audit_ready=${report.mv_production_ready_reentry_progress_audit_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.progress_audit_checks.length !== 5 ||
  report.total_high_priority_count !== EXPECTED_TOTAL_HIGH_PRIORITY_COUNT ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.reentry_progress_percent !== EXPECTED_REENTRY_PROGRESS_PERCENT ||
  report.reentry_progress_status !== REENTRY_PROGRESS_STATUS_NOT_STARTED ||
  report.next_reentry_gate_label !== NEXT_REENTRY_GATE_LABEL ||
  report.reentry_completion_ready !== false ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.completion_gate_consumed !== 'PASS' ||
  report.total_high_priority_count_valid !== 'PASS' ||
  report.resolved_high_priority_count_valid !== 'PASS' ||
  report.remaining_high_priority_count_valid !== 'PASS' ||
  report.reentry_progress_percent_valid !== 'PASS' ||
  report.reentry_progress_status_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.reentry_progress_inconsistent !== false ||
  report.reentry_progress_status_invalid !== false ||
  report.mv_production_ready_reentry_progress_audit_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS ||
  report.next_stage_approved !== true ||
  report.progress_audit_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with PRODUCTION_READY_REENTRY_PROGRESS_TRACKED, NOT_STARTED status, and 0% progress'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH), 'utf8')
) as {
  total_high_priority_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  reentry_progress_percent: number;
  reentry_progress_status: string;
  next_reentry_gate_label: string;
  reentry_completion_ready: boolean;
  target_readiness_tier: string;
  reentry_progress_audit_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.total_high_priority_count !== EXPECTED_TOTAL_HIGH_PRIORITY_COUNT ||
  artifact.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.reentry_progress_percent !== EXPECTED_REENTRY_PROGRESS_PERCENT ||
  artifact.reentry_progress_status !== REENTRY_PROGRESS_STATUS_NOT_STARTED ||
  artifact.next_reentry_gate_label !== NEXT_REENTRY_GATE_LABEL ||
  artifact.reentry_completion_ready !== false ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.reentry_progress_audit_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected reentry progress audit output');
  process.exit(1);
}

process.exit(0);
