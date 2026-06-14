import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXPECTED_HIGH_PRIORITY_BLOCKER_CODES } from '../services/mvHighPriorityResolutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS,
} from '../services/mvHighPriorityResolutionAuditHardening.js';
import {
  EXPECTED_HIGH_PRIORITY_ITEM_IDS,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PASS_VERDICT,
  writeMvHighPriorityItemResolutionExecution,
} from '../services/mvHighPriorityItemResolutionExecution.js';
import {
  HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_EXPORT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PASS_VERDICT,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH,
  NEXT_STAGE_GATE_LABEL,
  RESOLUTION_PROGRESS_STATUS_RESOLVED,
  SAFE_CREATE_POLICY,
  writeMvHighPriorityItemResolutionProgressAudit,
} from '../services/mvHighPriorityItemResolutionProgressAudit.js';
import {
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS,
} from '../services/mvProductionBlockerResolutionCertification.js';
import { writeMvProductionReadyGate } from '../services/mvProductionReadyGate.js';
import { writeMvProductionReadyGateReentryHardening } from '../services/mvProductionReadyGateReentryHardening.js';
import { writeMvProductionReadyGateEligibilityAuditHardening } from '../services/mvProductionReadyGateEligibilityAuditHardening.js';
import { writeMvProductionReadyGateStateAuditHardening } from '../services/mvProductionReadyGateStateAuditHardening.js';
import { writeMvProductionReadyCertificationBlockedState } from '../services/mvProductionReadyCertificationBlockedState.js';
import { writeMvProductionReadyReentryTracking } from '../services/mvProductionReadyReentryTracking.js';
import { writeMvProductionReadyReentryCompletionGate } from '../services/mvProductionReadyReentryCompletionGate.js';
import { writeMvProductionReadyReentryProgressAudit } from '../services/mvProductionReadyReentryProgressAudit.js';
import { writeMvProductionReadyReentryFinalReadiness } from '../services/mvProductionReadyReentryFinalReadiness.js';
import { writeMvProductionReadyReentryTerminationGate } from '../services/mvProductionReadyReentryTerminationGate.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 0;
const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_COMPLETION_PERCENT = 100;
const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const hardeningReportPath = path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH);
const hardeningArtifactPath = path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH);
const certificationReportPath = path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH);
const certificationArtifactPath = path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH);

if (
  !fs.existsSync(hardeningReportPath) ||
  !fs.existsSync(hardeningArtifactPath) ||
  !fs.existsSync(certificationReportPath) ||
  !fs.existsSync(certificationArtifactPath)
) {
  console.error('PRECHECK FAIL: Missing high priority hardening or blocker resolution certification artifacts');
  process.exit(1);
}

const hardeningReport = JSON.parse(fs.readFileSync(hardeningReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  next_stage_ready: string;
  mv_high_priority_resolution_audit_hardening_ready: string;
};

if (
  hardeningReport.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT ||
  hardeningReport.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS ||
  hardeningReport.next_stage_ready !== 'PASS' ||
  hardeningReport.mv_high_priority_resolution_audit_hardening_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH} must be ${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT}`
  );
  process.exit(1);
}

const certificationReport = JSON.parse(fs.readFileSync(certificationReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  next_stage_ready: string;
  mv_production_blocker_resolution_certification_ready: string;
};

if (
  certificationReport.final_verdict !== MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT ||
  certificationReport.certification_status !== MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS ||
  certificationReport.next_stage_ready !== 'PASS' ||
  certificationReport.mv_production_blocker_resolution_certification_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH} must be ${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT}`
  );
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
writeMvProductionReadyReentryTerminationGate(projectRoot);
writeMvHighPriorityItemResolutionExecution(projectRoot);

const report = writeMvHighPriorityItemResolutionProgressAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} resolution_progress_audit_id=${report.resolution_progress_audit_id} source_resolution_execution_ref=${report.source_resolution_execution_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} high_priority_item_ids=${report.high_priority_item_ids.join(',')} resolution_started=${report.resolution_started} resolution_last_updated=${report.resolution_last_updated} resolution_completion_percent=${report.resolution_completion_percent} resolved_high_priority_count=${report.resolved_high_priority_count} remaining_high_priority_count=${report.remaining_high_priority_count} next_reentry_gate_label=${report.next_reentry_gate_label} execution_scope=${report.execution_scope} resolution_execution_consumed=${report.resolution_execution_consumed} high_priority_item_ids_valid=${report.high_priority_item_ids_valid} resolution_status_by_item_valid=${report.resolution_status_by_item_valid} resolution_progress_by_item_valid=${report.resolution_progress_by_item_valid} resolution_started_valid=${report.resolution_started_valid} resolution_last_updated_valid=${report.resolution_last_updated_valid} resolution_completion_percent_valid=${report.resolution_completion_percent_valid} resolution_evidence_ref_valid=${report.resolution_evidence_ref_valid} resolved_high_priority_count_valid=${report.resolved_high_priority_count_valid} remaining_high_priority_count_valid=${report.remaining_high_priority_count_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} resolution_status_invalid=${report.resolution_status_invalid} resolution_progress_invalid=${report.resolution_progress_invalid} resolution_last_updated_missing=${report.resolution_last_updated_missing} resolution_completion_percent_invalid=${report.resolution_completion_percent_invalid} resolution_evidence_ref_missing=${report.resolution_evidence_ref_missing} high_priority_item_untracked=${report.high_priority_item_untracked} mv_high_priority_item_resolution_progress_audit_ready=${report.mv_high_priority_item_resolution_progress_audit_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH}`);
console.log(`artifact=${MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.progress_audit_checks.length !== 9 ||
  report.high_priority_item_ids.length !== EXPECTED_HIGH_PRIORITY_ITEM_IDS.length ||
  EXPECTED_HIGH_PRIORITY_ITEM_IDS.every((itemId) => report.high_priority_item_ids.includes(itemId)) === false ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => report.resolution_status_by_item[blockerCode] === RESOLUTION_PROGRESS_STATUS_RESOLVED
  ) === false ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => report.resolution_progress_by_item[blockerCode] === 100
  ) === false ||
  report.resolution_started !== true ||
  report.resolution_last_updated.length > 0 === false ||
  report.resolution_completion_percent !== EXPECTED_COMPLETION_PERCENT ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.next_reentry_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.resolution_execution_consumed !== 'PASS' ||
  report.high_priority_item_ids_valid !== 'PASS' ||
  report.resolution_status_by_item_valid !== 'PASS' ||
  report.resolution_progress_by_item_valid !== 'PASS' ||
  report.resolution_started_valid !== 'PASS' ||
  report.resolution_last_updated_valid !== 'PASS' ||
  report.resolution_completion_percent_valid !== 'PASS' ||
  report.resolution_evidence_ref_valid !== 'PASS' ||
  report.resolved_high_priority_count_valid !== 'PASS' ||
  report.remaining_high_priority_count_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.resolution_status_invalid !== false ||
  report.resolution_progress_invalid !== false ||
  report.resolution_last_updated_missing !== false ||
  report.resolution_completion_percent_invalid !== false ||
  report.resolution_evidence_ref_missing !== false ||
  report.high_priority_item_untracked !== false ||
  report.mv_high_priority_item_resolution_progress_audit_ready !== 'PASS' ||
  report.certification_status !== HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS ||
  report.next_stage_approved !== true ||
  report.progress_audit_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED, all items RESOLVED, and 100% completion'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH), 'utf8')
) as {
  high_priority_item_ids: string[];
  resolution_status_by_item: Record<string, string>;
  resolution_progress_by_item: Record<string, number>;
  resolution_started: boolean;
  resolution_last_updated: string;
  resolution_completion_percent: number;
  resolution_evidence_ref: Record<string, string>;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  next_reentry_gate_label: string;
  target_readiness_tier: string;
  resolution_progress_audit_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.high_priority_item_ids.length !== EXPECTED_HIGH_PRIORITY_ITEM_IDS.length ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => artifact.resolution_status_by_item[blockerCode] === RESOLUTION_PROGRESS_STATUS_RESOLVED
  ) === false ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => artifact.resolution_progress_by_item[blockerCode] === 100
  ) === false ||
  artifact.resolution_started !== true ||
  artifact.resolution_last_updated.length === 0 ||
  artifact.resolution_completion_percent !== EXPECTED_COMPLETION_PERCENT ||
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
    (blockerCode) => artifact.resolution_evidence_ref[blockerCode] !== undefined
  ) === false ||
  artifact.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.next_reentry_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.resolution_progress_audit_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected high priority item resolution progress audit output');
  process.exit(1);
}

process.exit(0);
