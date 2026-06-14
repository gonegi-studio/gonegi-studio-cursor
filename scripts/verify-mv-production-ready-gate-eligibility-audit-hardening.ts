import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import { PRODUCTION_CANDIDATE_CERTIFIED_STATUS } from '../services/mvProductionCandidateCertification.js';
import { writeMvProductionReadyGateReentryHardening } from '../services/mvProductionReadyGateReentryHardening.js';
import { writeMvProductionReadyGate } from '../services/mvProductionReadyGate.js';
import {
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_DIR,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_EXPORT_DIR,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PASS_VERDICT,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyGateEligibilityAuditHardening,
} from '../services/mvProductionReadyGateEligibilityAuditHardening.js';
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

const report = writeMvProductionReadyGateEligibilityAuditHardening(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} eligibility_audit_hardening_id=${report.eligibility_audit_hardening_id} source_reentry_hardening_ref=${report.source_reentry_hardening_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} production_ready_status=${report.production_ready_status} gate_reentry_required=${report.gate_reentry_required} production_ready=${report.production_ready} remaining_high_priority_count=${report.remaining_high_priority_count} ds_024_revalidation_required=${report.ds_024_revalidation_required} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} reentry_hardening_consumed=${report.reentry_hardening_consumed} production_ready_status_valid=${report.production_ready_status_valid} gate_reentry_required_valid=${report.gate_reentry_required_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} production_ready_status_invalid=${report.production_ready_status_invalid} gate_reentry_required_invalid=${report.gate_reentry_required_invalid} production_ready_certification_premature=${report.production_ready_certification_premature} reentry_hardening_missing=${report.reentry_hardening_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_ready_gate_eligibility_audit_hardening_ready=${report.mv_production_ready_gate_eligibility_audit_hardening_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.eligibility_audit_checks.length !== 2 ||
  report.production_ready_status !== PRODUCTION_CANDIDATE_CERTIFIED_STATUS ||
  report.gate_reentry_required !== true ||
  report.production_ready !== false ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.ds_024_revalidation_required !== true ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.reentry_hardening_consumed !== 'PASS' ||
  report.production_ready_status_valid !== 'PASS' ||
  report.gate_reentry_required_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.production_ready_status_invalid !== false ||
  report.gate_reentry_required_invalid !== false ||
  report.production_ready_certification_premature !== false ||
  report.reentry_hardening_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_ready_gate_eligibility_audit_hardening_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS ||
  report.next_stage_approved !== true ||
  report.eligibility_audit_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with PRODUCTION_CANDIDATE_CERTIFIED, gate_reentry_required=true, production_ready=false, and DS-024 revalidation required'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH), 'utf8')
) as {
  production_ready_status: string;
  gate_reentry_required: boolean;
  production_ready: boolean;
  remaining_high_priority_count: number;
  ds_024_revalidation_required: boolean;
  target_readiness_tier: string;
  next_stage_gate_label: string;
  eligibility_audit_hardening_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.production_ready_status !== PRODUCTION_CANDIDATE_CERTIFIED_STATUS ||
  artifact.gate_reentry_required !== true ||
  artifact.production_ready !== false ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.ds_024_revalidation_required !== true ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.eligibility_audit_hardening_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected eligibility audit hardening output');
  process.exit(1);
}

process.exit(0);
