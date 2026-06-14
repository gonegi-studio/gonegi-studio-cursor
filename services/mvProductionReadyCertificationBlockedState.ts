import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  PRODUCTION_CANDIDATE_CERTIFIED_STATUS,
  PRODUCTION_READY_CANDIDATE_STATUS,
} from './mvProductionCandidateCertification.js';
import {
  type GateReentryCondition,
  GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT,
} from './mvProductionReadyGateReentryHardening.js';
import {
  GATE_STATE_BLOCKED,
  GATE_STATE_READY,
  GATE_STATE_REASON_ALL_HIGH_PRIORITY_RESOLVED,
  GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PASS_VERDICT,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH,
  type MvProductionReadyGateStateAuditHardeningArtifact,
} from './mvProductionReadyGateStateAuditHardening.js';
import {
  PRODUCTION_READINESS_TIER_PRODUCTION_READY,
  PRODUCTION_READINESS_TIER_TEST_READY,
} from './mvProductionReadinessGate.js';
import type { MvRuntimeTraceability } from './mvProductionRuntimeEngine.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PHASE =
  'PHASE-DIGITAL-STUDIO-024-MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_V2' as const;
export const MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_V2' as const;
export const MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_V2' as const;
export const PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS =
  'PRODUCTION_READY_CERTIFICATION_BLOCKED' as const;
export const BLOCKED_REASON_HIGH_PRIORITY_ITEMS_REMAINING =
  'HIGH_PRIORITY_ITEMS_REMAINING' as const;
export const BLOCKED_REASON_ALL_HIGH_PRIORITY_RESOLVED = 'ALL_HIGH_PRIORITY_RESOLVED' as const;
export const NEXT_STAGE_GATE_LABEL = 'PRODUCTION_READY_CERTIFICATION_ENTRY' as const;
export const MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_DIR =
  'reports/mv_production_ready_certification_blocked_state' as const;
export const MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH =
  'reports/mv_production_ready_certification_blocked_state/mv-production-ready-certification-blocked-state-report.json' as const;
export const MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MD_PATH =
  'reports/mv_production_ready_certification_blocked_state/MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE.md' as const;
export const MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_EXPORT_DIR =
  'exports/mv_production_ready_certification_blocked_state' as const;
export const MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH =
  'exports/mv_production_ready_certification_blocked_state/mv-production-ready-certification-blocked-state-manifest.json' as const;
export const MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH =
  'exports/mv_production_ready_certification_blocked_state/mv-production-ready-certification-blocked-state.json' as const;

export const BLOCKED_STATE_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_ready_certification_blocked_state/' as const;

export const BLOCKED_REASONS = [
  BLOCKED_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  BLOCKED_REASON_ALL_HIGH_PRIORITY_RESOLVED,
] as const;

export type BlockedReason = (typeof BLOCKED_REASONS)[number];

export type CertificationBlockedProductionReadyStatus =
  | typeof PRODUCTION_CANDIDATE_CERTIFIED_STATUS
  | typeof PRODUCTION_READY_CANDIDATE_STATUS;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type BlockedStateStatus = 'PASS' | 'FAIL';

export type MvProductionReadyCertificationBlockedStateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type BlockedStateCheck = {
  check_id: string;
  check_label: string;
  status: BlockedStateStatus;
};

export type MvProductionReadyCertificationBlockedStateArtifact = {
  blocked_state_id: string;
  phase: typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PHASE;
  generated_at: string;
  source_state_audit_ref: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH;
  state_audit_hardening_id: string;
  production_ready_certification_allowed: boolean;
  production_ready_status: CertificationBlockedProductionReadyStatus;
  gate_reentry_required: boolean;
  blocked_reason: BlockedReason;
  remaining_high_priority_count: number;
  required_reentry_condition: GateReentryCondition;
  gate_state: typeof GATE_STATE_BLOCKED | typeof GATE_STATE_READY;
  production_ready: boolean;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    blocked_state_artifact_write_scope: typeof BLOCKED_STATE_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  blocked_state_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyCertificationBlockedStateManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PHASE;
  generated_at: string;
  production_ready_certification_allowed: boolean;
  production_ready_status: CertificationBlockedProductionReadyStatus;
  gate_reentry_required: boolean;
  blocked_reason: BlockedReason;
  traceability_preserved: boolean;
  safe_create_policy_verified: BlockedStateStatus;
  next_stage_ready: BlockedStateStatus;
  certification_status: typeof PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS | null;
};

export type MvProductionReadyCertificationBlockedStateReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  source_state_audit_ref: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH;
  mv_production_ready_gate_state_audit_hardening_report_path: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH;
  mv_production_ready_certification_blocked_state_export_dir: typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_EXPORT_DIR;
  mv_production_ready_certification_blocked_state_manifest_path: typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH;
  mv_production_ready_certification_blocked_state_artifact_path: typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH;
  blocked_state_id: string;
  source_count: number;
  adapter_count: number;
  production_ready_certification_allowed: boolean;
  production_ready_status: CertificationBlockedProductionReadyStatus;
  gate_reentry_required: boolean;
  blocked_reason: BlockedReason;
  remaining_high_priority_count: number;
  required_reentry_condition: GateReentryCondition;
  gate_state: typeof GATE_STATE_BLOCKED | typeof GATE_STATE_READY;
  production_ready: boolean;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  state_audit_consumed: BlockedStateStatus;
  production_ready_certification_allowed_valid: BlockedStateStatus;
  production_ready_status_valid: BlockedStateStatus;
  gate_reentry_required_valid: BlockedStateStatus;
  blocked_reason_valid: BlockedStateStatus;
  remaining_high_priority_count_valid: BlockedStateStatus;
  required_reentry_condition_valid: BlockedStateStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: BlockedStateStatus;
  next_stage_ready: BlockedStateStatus;
  production_ready_certification_premature: boolean;
  production_ready_status_invalid: boolean;
  gate_reentry_required_invalid: boolean;
  blocked_reason_missing: boolean;
  required_reentry_condition_missing: boolean;
  state_audit_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_certification_blocked_state_ready: BlockedStateStatus;
  certification_status: typeof PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS | null;
  next_stage_approved: boolean;
  blocked_state_checks: BlockedStateCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_FAIL_VERDICT;
  issues: MvProductionReadyCertificationBlockedStateIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_DIR,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_EXPORT_DIR,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): BlockedStateStatus {
  return pass ? 'PASS' : 'FAIL';
}

function loadJson<T>(root: string, relativePath: string): T | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

function snapshotFile(root: string, relativePath: string): FileSnapshot | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  const stat = fs.statSync(fullPath);
  return { size: stat.size, mtimeMs: stat.mtimeMs };
}

function snapshotsUnchanged(root: string, snapshots: Record<string, FileSnapshot | null>): boolean {
  return Object.entries(snapshots).every(([relativePath, snapshot]) => {
    const current = snapshotFile(root, relativePath);
    if (!snapshot || !current) return snapshot === current;
    return snapshot.size === current.size && snapshot.mtimeMs === current.mtimeMs;
  });
}

function resolveRequiredReentryCondition(): GateReentryCondition {
  return {
    remaining_high_priority_count: GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT,
    high_priority_resolution_target_met: true,
    production_ready_gate_eligible: true,
  };
}

function resolveGateReentryRequired(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount > 0;
}

function resolveProductionReadyStatus(
  remainingHighPriorityCount: number
): CertificationBlockedProductionReadyStatus {
  return remainingHighPriorityCount > 0
    ? PRODUCTION_CANDIDATE_CERTIFIED_STATUS
    : PRODUCTION_READY_CANDIDATE_STATUS;
}

function resolveProductionReadyCertificationAllowed(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount === 0;
}

function resolveBlockedReason(remainingHighPriorityCount: number): BlockedReason {
  return remainingHighPriorityCount > 0
    ? BLOCKED_REASON_HIGH_PRIORITY_ITEMS_REMAINING
    : BLOCKED_REASON_ALL_HIGH_PRIORITY_RESOLVED;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyCertificationBlockedStateIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyCertificationBlockedStateReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyCertificationBlockedStateReport = {
    report_id: 'mv-production-ready-certification-blocked-state-report-v1',
    phase: MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    source_state_audit_ref: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH,
    mv_production_ready_gate_state_audit_hardening_report_path:
      MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH,
    mv_production_ready_certification_blocked_state_export_dir:
      MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_EXPORT_DIR,
    mv_production_ready_certification_blocked_state_manifest_path:
      MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH,
    mv_production_ready_certification_blocked_state_artifact_path:
      MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH,
    blocked_state_id: 'mv-production-ready-certification-blocked-state-v1',
    source_count: 0,
    adapter_count: 0,
    production_ready_certification_allowed: false,
    production_ready_status: PRODUCTION_CANDIDATE_CERTIFIED_STATUS,
    gate_reentry_required: false,
    blocked_reason: BLOCKED_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
    remaining_high_priority_count: 0,
    required_reentry_condition: resolveRequiredReentryCondition(),
    gate_state: GATE_STATE_BLOCKED,
    production_ready: false,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    state_audit_consumed: 'FAIL',
    production_ready_certification_allowed_valid: 'FAIL',
    production_ready_status_valid: 'FAIL',
    gate_reentry_required_valid: 'FAIL',
    blocked_reason_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    required_reentry_condition_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    production_ready_certification_premature: true,
    production_ready_status_invalid: true,
    gate_reentry_required_invalid: true,
    blocked_reason_missing: true,
    required_reentry_condition_missing: true,
    state_audit_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_certification_blocked_state_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    blocked_state_checks: [],
    final_verdict: MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyCertificationBlockedState(
  projectRoot?: string
): MvProductionReadyCertificationBlockedStateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyCertificationBlockedStateIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const stateAuditReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: BlockedStateStatus;
    mv_production_ready_gate_state_audit_hardening_ready: BlockedStateStatus;
    traceability_preserved: boolean;
    gate_reentry_required: boolean;
    gate_state: typeof GATE_STATE_BLOCKED | typeof GATE_STATE_READY;
    gate_state_reason: string;
    production_ready: boolean;
    production_ready_status: string;
    remaining_high_priority_count: number;
  }>(root, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH);

  const stateAuditArtifact = loadJson<MvProductionReadyGateStateAuditHardeningArtifact>(
    root,
    MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH
  );
  const stateAuditManifestPath = path.join(root, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH);

  if (
    !stateAuditReport ||
    !stateAuditArtifact ||
    !fs.existsSync(stateAuditManifestPath) ||
    stateAuditReport.final_verdict !== MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PASS_VERDICT ||
    stateAuditReport.certification_status !== MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS ||
    stateAuditReport.next_stage_ready !== 'PASS' ||
    stateAuditReport.mv_production_ready_gate_state_audit_hardening_ready !== 'PASS'
  ) {
    issues.push({
      code: 'STATE_AUDIT_MISSING',
      message: `Required ${MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PASS_VERDICT} with ${MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const stateAuditConsumed =
    stateAuditArtifact.state_audit_hardening_complete === true &&
    stateAuditArtifact.next_stage_ready === true &&
    stateAuditArtifact.next_stage_gate_label === 'DS_024_ENTRY';

  const remainingHighPriorityCount = stateAuditArtifact.remaining_high_priority_count;
  const gateReentryRequired = resolveGateReentryRequired(remainingHighPriorityCount);
  const productionReadyStatus = resolveProductionReadyStatus(remainingHighPriorityCount);
  const productionReadyCertificationAllowed = resolveProductionReadyCertificationAllowed(remainingHighPriorityCount);
  const blockedReason = resolveBlockedReason(remainingHighPriorityCount);
  const requiredReentryCondition = resolveRequiredReentryCondition();
  const gateState = stateAuditArtifact.gate_state;
  const productionReady = stateAuditArtifact.production_ready;

  const traceabilityChains = stateAuditArtifact.traceability_chain;
  const traceabilityPreserved =
    stateAuditReport.traceability_preserved === true &&
    stateAuditArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const productionReadyCertificationAllowedValid =
    productionReadyCertificationAllowed === (remainingHighPriorityCount === 0) &&
    (remainingHighPriorityCount > 0 ? productionReadyCertificationAllowed === false : true) &&
    (gateState === GATE_STATE_BLOCKED ? productionReadyCertificationAllowed === false : true);

  const productionReadyStatusValid =
    productionReadyStatus === resolveProductionReadyStatus(remainingHighPriorityCount) &&
    (gateReentryRequired
      ? productionReadyStatus === PRODUCTION_CANDIDATE_CERTIFIED_STATUS && productionReady === false
      : productionReadyStatus === PRODUCTION_READY_CANDIDATE_STATUS);

  const gateReentryRequiredValid =
    gateReentryRequired === (remainingHighPriorityCount > 0) &&
    gateReentryRequired === stateAuditArtifact.gate_reentry_required &&
    gateReentryRequired === stateAuditReport.gate_reentry_required;

  const blockedReasonValid =
    blockedReason === resolveBlockedReason(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0
      ? blockedReason === BLOCKED_REASON_HIGH_PRIORITY_ITEMS_REMAINING &&
        stateAuditArtifact.gate_state_reason === GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING
      : blockedReason === BLOCKED_REASON_ALL_HIGH_PRIORITY_RESOLVED &&
        stateAuditArtifact.gate_state_reason === GATE_STATE_REASON_ALL_HIGH_PRIORITY_RESOLVED);

  const remainingHighPriorityCountValid =
    remainingHighPriorityCount === stateAuditReport.remaining_high_priority_count &&
    remainingHighPriorityCount >= 0;

  const requiredReentryConditionValid =
    requiredReentryCondition.remaining_high_priority_count ===
      GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT &&
    requiredReentryCondition.high_priority_resolution_target_met === true &&
    requiredReentryCondition.production_ready_gate_eligible === true;

  const productionReadyCertificationPremature =
    productionReadyCertificationAllowed === true && remainingHighPriorityCount > 0 ||
    productionReady === true ||
    (gateState === GATE_STATE_BLOCKED && productionReadyCertificationAllowed === true);

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(BLOCKED_STATE_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const productionReadyStatusInvalid = !productionReadyStatusValid;
  const gateReentryRequiredInvalid = !gateReentryRequiredValid;
  const blockedReasonMissing = !blockedReasonValid;
  const requiredReentryConditionMissing = !requiredReentryConditionValid;
  const stateAuditMissing = !stateAuditConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const blockedStateComplete =
    stateAuditConsumed &&
    productionReadyCertificationAllowedValid &&
    productionReadyStatusValid &&
    gateReentryRequiredValid &&
    blockedReasonValid &&
    remainingHighPriorityCountValid &&
    requiredReentryConditionValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !productionReadyCertificationPremature &&
    (remainingHighPriorityCount > 0
      ? productionReadyStatus === PRODUCTION_CANDIDATE_CERTIFIED_STATUS &&
        gateReentryRequired === true &&
        productionReadyCertificationAllowed === false &&
        gateState === GATE_STATE_BLOCKED
      : gateReentryRequired === false);

  const nextStageReady = blockedStateComplete;

  if (stateAuditMissing) {
    issues.push({
      code: 'STATE_AUDIT_MISSING',
      message: 'Gate state audit hardening was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (!productionReadyCertificationAllowedValid) {
    issues.push({
      code: 'PRODUCTION_READY_CERTIFICATION_ALLOWED_INVALID',
      message: 'Production ready certification allowed flag is invalid',
      severity: 'error',
      check_id: 'production_ready_certification_allowed_valid',
    });
  }
  if (productionReadyStatusInvalid) {
    issues.push({
      code: 'PRODUCTION_READY_STATUS_INVALID',
      message: 'Production ready status is invalid for blocked certification state',
      severity: 'error',
      check_id: 'production_ready_status_valid',
    });
  }
  if (gateReentryRequiredInvalid) {
    issues.push({
      code: 'GATE_REENTRY_REQUIRED_INVALID',
      message: 'Gate reentry required flag is invalid',
      severity: 'error',
      check_id: 'gate_reentry_required_valid',
    });
  }
  if (blockedReasonMissing) {
    issues.push({
      code: 'BLOCKED_REASON_MISSING',
      message: 'Blocked reason is missing or invalid',
      severity: 'error',
      check_id: 'blocked_reason_valid',
    });
  }
  if (!remainingHighPriorityCountValid) {
    issues.push({
      code: 'REMAINING_HIGH_PRIORITY_COUNT_INVALID',
      message: 'Remaining high priority count is invalid',
      severity: 'error',
      check_id: 'remaining_high_priority_count_valid',
    });
  }
  if (requiredReentryConditionMissing) {
    issues.push({
      code: 'REQUIRED_REENTRY_CONDITION_MISSING',
      message: 'Required reentry condition is missing or invalid',
      severity: 'error',
      check_id: 'required_reentry_condition_valid',
    });
  }
  if (productionReadyCertificationPremature) {
    issues.push({
      code: 'PRODUCTION_READY_CERTIFICATION_PREMATURE',
      message: 'Production ready certification would be premature before gate reentry',
      severity: 'error',
    });
  }

  const blockedStateChecks: BlockedStateCheck[] = [
    {
      check_id: 'production_ready_certification_allowed_valid',
      check_label: 'Production Ready Certification Allowed Valid',
      status: toStatus(productionReadyCertificationAllowedValid),
    },
    {
      check_id: 'production_ready_status_valid',
      check_label: 'Production Ready Status Valid',
      status: toStatus(productionReadyStatusValid),
    },
    {
      check_id: 'gate_reentry_required_valid',
      check_label: 'Gate Reentry Required Valid',
      status: toStatus(gateReentryRequiredValid),
    },
    {
      check_id: 'blocked_reason_valid',
      check_label: 'Blocked Reason Valid',
      status: toStatus(blockedReasonValid),
    },
    {
      check_id: 'remaining_high_priority_count_valid',
      check_label: 'Remaining High Priority Count Valid',
      status: toStatus(remainingHighPriorityCountValid),
    },
    {
      check_id: 'required_reentry_condition_valid',
      check_label: 'Required Reentry Condition Valid',
      status: toStatus(requiredReentryConditionValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyCertificationBlockedStateArtifact = {
    blocked_state_id: 'mv-production-ready-certification-blocked-state-v1',
    phase: MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PHASE,
    generated_at: timestamp,
    source_state_audit_ref: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH,
    state_audit_hardening_id: stateAuditArtifact.state_audit_hardening_id,
    production_ready_certification_allowed: productionReadyCertificationAllowed,
    production_ready_status: productionReadyStatus,
    gate_reentry_required: gateReentryRequired,
    blocked_reason: blockedReason,
    remaining_high_priority_count: remainingHighPriorityCount,
    required_reentry_condition: requiredReentryCondition,
    gate_state: gateState,
    production_ready: productionReady,
    current_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      blocked_state_artifact_write_scope: BLOCKED_STATE_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    blocked_state_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyCertificationBlockedStateManifest = {
    manifest_id: 'mv-production-ready-certification-blocked-state-manifest-v1',
    phase: MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PHASE,
    generated_at: timestamp,
    production_ready_certification_allowed: productionReadyCertificationAllowed,
    production_ready_status: productionReadyStatus,
    gate_reentry_required: gateReentryRequired,
    blocked_reason: blockedReason,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyCertificationBlockedStateReport = {
    report_id: 'mv-production-ready-certification-blocked-state-report-v1',
    phase: MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    source_state_audit_ref: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH,
    mv_production_ready_gate_state_audit_hardening_report_path:
      MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH,
    mv_production_ready_certification_blocked_state_export_dir:
      MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_EXPORT_DIR,
    mv_production_ready_certification_blocked_state_manifest_path:
      MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH,
    mv_production_ready_certification_blocked_state_artifact_path:
      MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH,
    blocked_state_id: 'mv-production-ready-certification-blocked-state-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    production_ready_certification_allowed: productionReadyCertificationAllowed,
    production_ready_status: productionReadyStatus,
    gate_reentry_required: gateReentryRequired,
    blocked_reason: blockedReason,
    remaining_high_priority_count: remainingHighPriorityCount,
    required_reentry_condition: requiredReentryCondition,
    gate_state: gateState,
    production_ready: productionReady,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    state_audit_consumed: toStatus(stateAuditConsumed),
    production_ready_certification_allowed_valid: toStatus(productionReadyCertificationAllowedValid),
    production_ready_status_valid: toStatus(productionReadyStatusValid),
    gate_reentry_required_valid: toStatus(gateReentryRequiredValid),
    blocked_reason_valid: toStatus(blockedReasonValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    required_reentry_condition_valid: toStatus(requiredReentryConditionValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    production_ready_certification_premature: productionReadyCertificationPremature,
    production_ready_status_invalid: productionReadyStatusInvalid,
    gate_reentry_required_invalid: gateReentryRequiredInvalid,
    blocked_reason_missing: blockedReasonMissing,
    required_reentry_condition_missing: requiredReentryConditionMissing,
    state_audit_missing: stateAuditMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_certification_blocked_state_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS : null,
    next_stage_approved: pass,
    blocked_state_checks: blockedStateChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PASS_VERDICT
      : MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
