import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_READY_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_PASS_VERDICT,
  MV_PRODUCTION_READY_GATE_EVALUATED_STATUS,
  writeMvProductionReadyGate,
} from '../services/mvProductionReadyGate.js';
import {
  GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_DIR,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_EXPORT_DIR,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PASS_VERDICT,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyGateReentryHardening,
} from '../services/mvProductionReadyGateReentryHardening.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_GATE_BLOCKER_COUNT = 3;
const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 3;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

writeMvProductionReadyGate(projectRoot);

const report = writeMvProductionReadyGateReentryHardening(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} reentry_hardening_id=${report.reentry_hardening_id} source_gate_ref=${report.source_gate_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} gate_blocker_count=${report.gate_blocker_count} gate_reentry_ready=${report.gate_reentry_ready} remaining_high_priority_count=${report.remaining_high_priority_count} gate_reentry_condition_remaining=${report.gate_reentry_condition.remaining_high_priority_count} gate_reentry_condition_target_met=${report.gate_reentry_condition.high_priority_resolution_target_met} gate_reentry_condition_gate_eligible=${report.gate_reentry_condition.production_ready_gate_eligible} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} gate_consumed=${report.gate_consumed} gate_blocker_count_valid=${report.gate_blocker_count_valid} gate_reentry_condition_valid=${report.gate_reentry_condition_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} gate_blocker_count_invalid=${report.gate_blocker_count_invalid} gate_reentry_condition_missing=${report.gate_reentry_condition_missing} gate_missing=${report.gate_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_ready_gate_reentry_hardening_ready=${report.mv_production_ready_gate_reentry_hardening_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.reentry_hardening_checks.length !== 2 ||
  report.gate_blocker_count !== EXPECTED_GATE_BLOCKER_COUNT ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.gate_reentry_ready !== false ||
  report.gate_reentry_condition.remaining_high_priority_count !== GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.gate_reentry_condition.high_priority_resolution_target_met !== true ||
  report.gate_reentry_condition.production_ready_gate_eligible !== true ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.gate_consumed !== 'PASS' ||
  report.gate_blocker_count_valid !== 'PASS' ||
  report.gate_reentry_condition_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.gate_blocker_count_invalid !== false ||
  report.gate_reentry_condition_missing !== false ||
  report.gate_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_ready_gate_reentry_hardening_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS ||
  report.next_stage_approved !== true ||
  report.reentry_hardening_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with gate_blocker_count=3, reentry condition criteria defined, gate_reentry_ready=false, and DS_024_ENTRY gate'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH), 'utf8')
) as {
  source_gate_ref: string;
  gate_blocker_count: number;
  gate_reentry_condition: {
    remaining_high_priority_count: number;
    high_priority_resolution_target_met: boolean;
    production_ready_gate_eligible: boolean;
  };
  gate_reentry_ready: boolean;
  target_readiness_tier: string;
  next_stage_gate_label: string;
  reentry_hardening_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.source_gate_ref !== MV_PRODUCTION_READY_GATE_ARTIFACT_PATH ||
  artifact.gate_blocker_count !== EXPECTED_GATE_BLOCKER_COUNT ||
  artifact.gate_reentry_condition.remaining_high_priority_count !== GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.gate_reentry_condition.high_priority_resolution_target_met !== true ||
  artifact.gate_reentry_condition.production_ready_gate_eligible !== true ||
  artifact.gate_reentry_ready !== false ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.reentry_hardening_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected gate reentry hardening output');
  process.exit(1);
}

process.exit(0);
