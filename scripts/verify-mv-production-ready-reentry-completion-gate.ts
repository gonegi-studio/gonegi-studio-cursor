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
import {
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_DIR,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_EXPORT_DIR,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH,
  NEXT_REQUIRED_ACTION_RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS,
  PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS,
  REENTRY_COMPLETION_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyReentryCompletionGate,
} from '../services/mvProductionReadyReentryCompletionGate.js';
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

const report = writeMvProductionReadyReentryCompletionGate(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} reentry_completion_gate_id=${report.reentry_completion_gate_id} source_reentry_tracking_ref=${report.source_reentry_tracking_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} remaining_high_priority_count=${report.remaining_high_priority_count} reentry_completion_ready=${report.reentry_completion_ready} reentry_completion_reason=${report.reentry_completion_reason} next_required_action=${report.next_required_action} next_reentry_gate_label=${report.next_reentry_gate_label} production_ready_path_clear=${report.production_ready_path_clear} execution_scope=${report.execution_scope} reentry_tracking_consumed=${report.reentry_tracking_consumed} reentry_completion_ready_valid=${report.reentry_completion_ready_valid} reentry_completion_reason_valid=${report.reentry_completion_reason_valid} next_required_action_valid=${report.next_required_action_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} reentry_completion_premature=${report.reentry_completion_premature} next_required_action_missing=${report.next_required_action_missing} mv_production_ready_reentry_completion_gate_ready=${report.mv_production_ready_reentry_completion_gate_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.completion_gate_checks.length !== 3 ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.reentry_completion_ready !== false ||
  report.reentry_completion_reason !== REENTRY_COMPLETION_REASON_HIGH_PRIORITY_ITEMS_REMAINING ||
  report.next_required_action !== NEXT_REQUIRED_ACTION_RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS ||
  report.next_reentry_gate_label !== NEXT_REENTRY_GATE_LABEL ||
  report.production_ready_path_clear !== false ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.reentry_tracking_consumed !== 'PASS' ||
  report.reentry_completion_ready_valid !== 'PASS' ||
  report.reentry_completion_reason_valid !== 'PASS' ||
  report.next_required_action_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.reentry_completion_premature !== false ||
  report.next_required_action_missing !== false ||
  report.mv_production_ready_reentry_completion_gate_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS ||
  report.next_stage_approved !== true ||
  report.completion_gate_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with PRODUCTION_READY_REENTRY_COMPLETION_TRACKED, reentry_completion_ready=false, and RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS action'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH), 'utf8')
) as {
  remaining_high_priority_count: number;
  reentry_completion_ready: boolean;
  reentry_completion_reason: string;
  next_required_action: string;
  next_reentry_gate_label: string;
  production_ready_path_clear: boolean;
  target_readiness_tier: string;
  reentry_completion_gate_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.reentry_completion_ready !== false ||
  artifact.reentry_completion_reason !== REENTRY_COMPLETION_REASON_HIGH_PRIORITY_ITEMS_REMAINING ||
  artifact.next_required_action !== NEXT_REQUIRED_ACTION_RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS ||
  artifact.next_reentry_gate_label !== NEXT_REENTRY_GATE_LABEL ||
  artifact.production_ready_path_clear !== false ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.reentry_completion_gate_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected reentry completion gate output');
  process.exit(1);
}

process.exit(0);
