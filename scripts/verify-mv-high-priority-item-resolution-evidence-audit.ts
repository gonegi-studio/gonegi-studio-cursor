import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS,
} from '../services/mvHighPriorityResolutionAuditHardening.js';
import {
  EXPECTED_HIGH_PRIORITY_ITEM_IDS,
  writeMvHighPriorityItemResolutionExecution,
} from '../services/mvHighPriorityItemResolutionExecution.js';
import { writeMvHighPriorityItemResolutionProgressAudit } from '../services/mvHighPriorityItemResolutionProgressAudit.js';
import {
  BLOCKER_CODE_TO_ITEM_ID,
  writeMvHighPriorityItemResolutionCompletionAudit,
} from '../services/mvHighPriorityItemResolutionCompletionAudit.js';
import {
  EVIDENCE_TYPE_RESOLUTION_EVIDENCE,
  EVIDENCE_VERIFICATION_REASON_RESOLUTION_VERIFIED,
  HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED_STATUS,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_EXPORT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PASS_VERDICT,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_REPORT_PATH,
  NEXT_STAGE_GATE_LABEL,
  SAFE_CREATE_POLICY,
  writeMvHighPriorityItemResolutionEvidenceAudit,
} from '../services/mvHighPriorityItemResolutionEvidenceAudit.js';
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
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 0;
const EXPECTED_UNRESOLVED_ITEM_IDS: string[] = [];
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
writeMvHighPriorityItemResolutionProgressAudit(projectRoot);
writeMvHighPriorityItemResolutionCompletionAudit(projectRoot);

const report = writeMvHighPriorityItemResolutionEvidenceAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} resolution_evidence_audit_id=${report.resolution_evidence_audit_id} source_completion_audit_ref=${report.source_completion_audit_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} resolved_item_ids=${report.resolved_item_ids.join(',') || 'NONE'} unresolved_item_ids=${report.unresolved_item_ids.join(',')} evidence_type=${report.evidence_type} evidence_verified=${report.evidence_verified} evidence_verification_reason=${report.evidence_verification_reason} resolved_high_priority_count=${report.resolved_high_priority_count} remaining_high_priority_count=${report.remaining_high_priority_count} reentry_ready=${report.reentry_ready} next_reentry_gate_label=${report.next_reentry_gate_label} execution_scope=${report.execution_scope} completion_audit_consumed=${report.completion_audit_consumed} evidence_type_valid=${report.evidence_type_valid} resolution_evidence_ref_valid=${report.resolution_evidence_ref_valid} evidence_verified_valid=${report.evidence_verified_valid} evidence_verification_reason_valid=${report.evidence_verification_reason_valid} resolved_high_priority_count_valid=${report.resolved_high_priority_count_valid} remaining_high_priority_count_valid=${report.remaining_high_priority_count_valid} reentry_ready_valid=${report.reentry_ready_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} resolution_evidence_missing=${report.resolution_evidence_missing} evidence_not_verified=${report.evidence_not_verified} resolved_item_without_evidence=${report.resolved_item_without_evidence} evidence_type_invalid=${report.evidence_type_invalid} mv_high_priority_item_resolution_evidence_audit_ready=${report.mv_high_priority_item_resolution_evidence_audit_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_REPORT_PATH}`);
console.log(`artifact=${MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.evidence_audit_checks.length !== 7 ||
  report.resolved_item_ids.length !== EXPECTED_HIGH_PRIORITY_ITEM_IDS.length ||
  EXPECTED_HIGH_PRIORITY_ITEM_IDS.every((itemId) => report.resolved_item_ids.includes(itemId)) === false ||
  report.unresolved_item_ids.length !== EXPECTED_UNRESOLVED_ITEM_IDS.length ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.evidence_type !== EVIDENCE_TYPE_RESOLUTION_EVIDENCE ||
  report.evidence_verified !== true ||
  report.evidence_verification_reason !== EVIDENCE_VERIFICATION_REASON_RESOLUTION_VERIFIED ||
  report.reentry_ready !== true ||
  report.next_reentry_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.completion_audit_consumed !== 'PASS' ||
  report.evidence_type_valid !== 'PASS' ||
  report.resolution_evidence_ref_valid !== 'PASS' ||
  report.evidence_verified_valid !== 'PASS' ||
  report.evidence_verification_reason_valid !== 'PASS' ||
  report.resolved_high_priority_count_valid !== 'PASS' ||
  report.remaining_high_priority_count_valid !== 'PASS' ||
  report.reentry_ready_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.resolution_evidence_missing !== false ||
  report.evidence_not_verified !== false ||
  report.resolved_item_without_evidence !== false ||
  report.evidence_type_invalid !== false ||
  report.mv_high_priority_item_resolution_evidence_audit_ready !== 'PASS' ||
  report.certification_status !== HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED_STATUS ||
  report.next_stage_approved !== true ||
  report.evidence_audit_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED, resolution_evidence, evidence_verified=true, and reentry_ready=true'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH), 'utf8')
) as {
  resolved_item_ids: string[];
  unresolved_item_ids: string[];
  evidence_type: string;
  evidence_verified: boolean;
  evidence_verification_reason: string;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  reentry_ready: boolean;
  next_reentry_gate_label: string;
  target_readiness_tier: string;
  resolution_evidence_audit_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.resolved_item_ids.length !== EXPECTED_HIGH_PRIORITY_ITEM_IDS.length ||
  artifact.resolved_item_ids.includes(BLOCKER_CODE_TO_ITEM_ID.DATASET_REFS_EMPTY) === false ||
  artifact.resolved_item_ids.includes(BLOCKER_CODE_TO_ITEM_ID.PRODUCTION_MODE_BLOCKED) === false ||
  artifact.resolved_item_ids.includes(BLOCKER_CODE_TO_ITEM_ID.REAL_GENERATION_BLOCKED) === false ||
  artifact.unresolved_item_ids.length !== EXPECTED_UNRESOLVED_ITEM_IDS.length ||
  artifact.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.evidence_type !== EVIDENCE_TYPE_RESOLUTION_EVIDENCE ||
  artifact.evidence_verified !== true ||
  artifact.evidence_verification_reason !== EVIDENCE_VERIFICATION_REASON_RESOLUTION_VERIFIED ||
  artifact.reentry_ready !== true ||
  artifact.next_reentry_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.resolution_evidence_audit_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected high priority item resolution evidence audit output');
  process.exit(1);
}

process.exit(0);
