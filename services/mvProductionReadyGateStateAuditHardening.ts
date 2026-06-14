import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import { PRODUCTION_CANDIDATE_CERTIFIED_STATUS } from './mvProductionCandidateCertification.js';
import {
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PASS_VERDICT,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH,
  type MvProductionReadyGateEligibilityAuditHardeningArtifact,
} from './mvProductionReadyGateEligibilityAuditHardening.js';
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

export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PHASE =
  'PHASE-DIGITAL-STUDIO-023D-MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_V1' as const;
export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_V1' as const;
export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_V1' as const;
export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS =
  'MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED' as const;
export const GATE_STATE_BLOCKED = 'BLOCKED' as const;
export const GATE_STATE_READY = 'READY' as const;
export const GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING =
  'HIGH_PRIORITY_ITEMS_REMAINING' as const;
export const GATE_STATE_REASON_ALL_HIGH_PRIORITY_RESOLVED = 'ALL_HIGH_PRIORITY_RESOLVED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_024_ENTRY' as const;
export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_DIR =
  'reports/mv_production_ready_gate_state_audit_hardening' as const;
export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH =
  'reports/mv_production_ready_gate_state_audit_hardening/mv-production-ready-gate-state-audit-hardening-report.json' as const;
export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MD_PATH =
  'reports/mv_production_ready_gate_state_audit_hardening/MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING.md' as const;
export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_EXPORT_DIR =
  'exports/mv_production_ready_gate_state_audit_hardening' as const;
export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH =
  'exports/mv_production_ready_gate_state_audit_hardening/mv-production-ready-gate-state-audit-hardening-manifest.json' as const;
export const MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH =
  'exports/mv_production_ready_gate_state_audit_hardening/mv-production-ready-gate-state-audit-hardening.json' as const;

export const GATE_STATE_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_ready_gate_state_audit_hardening/' as const;

export const GATE_STATES = [GATE_STATE_BLOCKED, GATE_STATE_READY] as const;
export const GATE_STATE_REASONS = [
  GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  GATE_STATE_REASON_ALL_HIGH_PRIORITY_RESOLVED,
] as const;

export type GateState = (typeof GATE_STATES)[number];
export type GateStateReason = (typeof GATE_STATE_REASONS)[number];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type StateAuditStatus = 'PASS' | 'FAIL';

export type MvProductionReadyGateStateAuditHardeningIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type StateAuditCheck = {
  check_id: string;
  check_label: string;
  status: StateAuditStatus;
};

export type MvProductionReadyGateStateAuditHardeningArtifact = {
  state_audit_hardening_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PHASE;
  generated_at: string;
  source_eligibility_audit_ref: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH;
  eligibility_audit_hardening_id: string;
  gate_state: GateState;
  gate_state_reason: GateStateReason;
  gate_reentry_required: boolean;
  production_ready_status: typeof PRODUCTION_CANDIDATE_CERTIFIED_STATUS;
  production_ready: boolean;
  remaining_high_priority_count: number;
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
    gate_state_audit_hardening_artifact_write_scope: typeof GATE_STATE_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  state_audit_hardening_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyGateStateAuditHardeningManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PHASE;
  generated_at: string;
  gate_state: GateState;
  gate_state_reason: GateStateReason;
  gate_reentry_required: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: StateAuditStatus;
  next_stage_ready: StateAuditStatus;
  certification_status: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS | null;
};

export type MvProductionReadyGateStateAuditHardeningReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PHASE;
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
  source_eligibility_audit_ref: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH;
  mv_production_ready_gate_eligibility_audit_hardening_report_path: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH;
  mv_production_ready_gate_state_audit_hardening_export_dir: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_EXPORT_DIR;
  mv_production_ready_gate_state_audit_hardening_manifest_path: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH;
  mv_production_ready_gate_state_audit_hardening_artifact_path: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH;
  state_audit_hardening_id: string;
  source_count: number;
  adapter_count: number;
  gate_state: GateState;
  gate_state_reason: GateStateReason;
  gate_reentry_required: boolean;
  production_ready_status: typeof PRODUCTION_CANDIDATE_CERTIFIED_STATUS;
  production_ready: boolean;
  remaining_high_priority_count: number;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  eligibility_audit_consumed: StateAuditStatus;
  gate_state_valid: StateAuditStatus;
  gate_state_reason_valid: StateAuditStatus;
  gate_reentry_required_valid: StateAuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: StateAuditStatus;
  next_stage_ready: StateAuditStatus;
  gate_state_invalid: boolean;
  gate_state_reason_missing: boolean;
  gate_reentry_required_invalid: boolean;
  production_ready_path_blocked: boolean;
  eligibility_audit_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_gate_state_audit_hardening_ready: StateAuditStatus;
  certification_status: typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS | null;
  next_stage_approved: boolean;
  state_audit_checks: StateAuditCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_FAIL_VERDICT;
  issues: MvProductionReadyGateStateAuditHardeningIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_DIR,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_EXPORT_DIR,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH,
  MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): StateAuditStatus {
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

function resolveGateState(remainingHighPriorityCount: number): GateState {
  return remainingHighPriorityCount > 0 ? GATE_STATE_BLOCKED : GATE_STATE_READY;
}

function resolveGateStateReason(remainingHighPriorityCount: number): GateStateReason {
  return remainingHighPriorityCount > 0
    ? GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING
    : GATE_STATE_REASON_ALL_HIGH_PRIORITY_RESOLVED;
}

function resolveGateReentryRequired(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount > 0;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyGateStateAuditHardeningIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyGateStateAuditHardeningReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyGateStateAuditHardeningReport = {
    report_id: 'mv-production-ready-gate-state-audit-hardening-report-v1',
    phase: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PHASE,
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
    source_eligibility_audit_ref: MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH,
    mv_production_ready_gate_eligibility_audit_hardening_report_path:
      MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH,
    mv_production_ready_gate_state_audit_hardening_export_dir: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_EXPORT_DIR,
    mv_production_ready_gate_state_audit_hardening_manifest_path:
      MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH,
    mv_production_ready_gate_state_audit_hardening_artifact_path:
      MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH,
    state_audit_hardening_id: 'mv-production-ready-gate-state-audit-hardening-v1',
    source_count: 0,
    adapter_count: 0,
    gate_state: GATE_STATE_BLOCKED,
    gate_state_reason: GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
    gate_reentry_required: false,
    production_ready_status: PRODUCTION_CANDIDATE_CERTIFIED_STATUS,
    production_ready: false,
    remaining_high_priority_count: 0,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    eligibility_audit_consumed: 'FAIL',
    gate_state_valid: 'FAIL',
    gate_state_reason_valid: 'FAIL',
    gate_reentry_required_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    gate_state_invalid: true,
    gate_state_reason_missing: true,
    gate_reentry_required_invalid: true,
    production_ready_path_blocked: true,
    eligibility_audit_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_gate_state_audit_hardening_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    state_audit_checks: [],
    final_verdict: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyGateStateAuditHardening(
  projectRoot?: string
): MvProductionReadyGateStateAuditHardeningReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyGateStateAuditHardeningIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const eligibilityReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: StateAuditStatus;
    mv_production_ready_gate_eligibility_audit_hardening_ready: StateAuditStatus;
    traceability_preserved: boolean;
    gate_reentry_required: boolean;
    production_ready: boolean;
    production_ready_status: string;
    remaining_high_priority_count: number;
  }>(root, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH);

  const eligibilityArtifact = loadJson<MvProductionReadyGateEligibilityAuditHardeningArtifact>(
    root,
    MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH
  );
  const eligibilityManifestPath = path.join(
    root,
    MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH
  );

  if (
    !eligibilityReport ||
    !eligibilityArtifact ||
    !fs.existsSync(eligibilityManifestPath) ||
    eligibilityReport.final_verdict !== MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PASS_VERDICT ||
    eligibilityReport.certification_status !== MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS ||
    eligibilityReport.next_stage_ready !== 'PASS' ||
    eligibilityReport.mv_production_ready_gate_eligibility_audit_hardening_ready !== 'PASS'
  ) {
    issues.push({
      code: 'ELIGIBILITY_AUDIT_MISSING',
      message: `Required ${MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PASS_VERDICT} with ${MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const eligibilityAuditConsumed =
    eligibilityArtifact.eligibility_audit_hardening_complete === true &&
    eligibilityArtifact.next_stage_ready === true &&
    eligibilityArtifact.next_stage_gate_label === 'DS_024_ENTRY';

  const remainingHighPriorityCount = eligibilityArtifact.remaining_high_priority_count;
  const gateState = resolveGateState(remainingHighPriorityCount);
  const gateStateReason = resolveGateStateReason(remainingHighPriorityCount);
  const gateReentryRequired = resolveGateReentryRequired(remainingHighPriorityCount);
  const productionReadyStatus = PRODUCTION_CANDIDATE_CERTIFIED_STATUS;
  const productionReady = eligibilityArtifact.production_ready;

  const traceabilityChains = eligibilityArtifact.traceability_chain;
  const traceabilityPreserved =
    eligibilityReport.traceability_preserved === true &&
    eligibilityArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const gateStateValid =
    gateState === resolveGateState(remainingHighPriorityCount) &&
    (gateState === GATE_STATE_BLOCKED
      ? remainingHighPriorityCount > 0
      : remainingHighPriorityCount === 0);

  const gateStateReasonValid =
    gateStateReason === resolveGateStateReason(remainingHighPriorityCount) &&
    (gateStateReason === GATE_STATE_REASON_HIGH_PRIORITY_ITEMS_REMAINING
      ? remainingHighPriorityCount > 0
      : remainingHighPriorityCount === 0);

  const gateReentryRequiredValid =
    gateReentryRequired === (remainingHighPriorityCount > 0) &&
    gateReentryRequired === eligibilityArtifact.gate_reentry_required &&
    gateReentryRequired === eligibilityReport.gate_reentry_required;

  const productionReadyPathBlocked =
    (gateState === GATE_STATE_BLOCKED && productionReady === true) ||
    (gateReentryRequired && productionReady === true);

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(GATE_STATE_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const gateStateInvalid = !gateStateValid;
  const gateStateReasonMissing = !gateStateReasonValid;
  const gateReentryRequiredInvalid = !gateReentryRequiredValid;
  const eligibilityAuditMissing = !eligibilityAuditConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const stateAuditHardeningComplete =
    eligibilityAuditConsumed &&
    gateStateValid &&
    gateStateReasonValid &&
    gateReentryRequiredValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !productionReadyPathBlocked &&
    productionReadyStatus === PRODUCTION_CANDIDATE_CERTIFIED_STATUS &&
    productionReady === false;

  const nextStageReady = stateAuditHardeningComplete;

  if (eligibilityAuditMissing) {
    issues.push({ code: 'ELIGIBILITY_AUDIT_MISSING', message: 'Eligibility audit hardening was not consumed', severity: 'error' });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (gateStateInvalid) {
    issues.push({
      code: 'GATE_STATE_INVALID',
      message: 'Gate state is invalid for remaining high priority count',
      severity: 'error',
      check_id: 'gate_state_valid',
    });
  }
  if (gateStateReasonMissing) {
    issues.push({
      code: 'GATE_STATE_REASON_MISSING',
      message: 'Gate state reason is missing or invalid',
      severity: 'error',
      check_id: 'gate_state_reason_valid',
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
  if (productionReadyPathBlocked) {
    issues.push({
      code: 'PRODUCTION_READY_PATH_BLOCKED',
      message: 'Production ready path is blocked while gate remains closed',
      severity: 'error',
    });
  }

  const stateAuditChecks: StateAuditCheck[] = [
    { check_id: 'gate_state_valid', check_label: 'Gate State Valid', status: toStatus(gateStateValid) },
    { check_id: 'gate_state_reason_valid', check_label: 'Gate State Reason Valid', status: toStatus(gateStateReasonValid) },
    { check_id: 'gate_reentry_required_valid', check_label: 'Gate Reentry Required Valid', status: toStatus(gateReentryRequiredValid) },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyGateStateAuditHardeningArtifact = {
    state_audit_hardening_id: 'mv-production-ready-gate-state-audit-hardening-v1',
    phase: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PHASE,
    generated_at: timestamp,
    source_eligibility_audit_ref: MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH,
    eligibility_audit_hardening_id: eligibilityArtifact.eligibility_audit_hardening_id,
    gate_state: gateState,
    gate_state_reason: gateStateReason,
    gate_reentry_required: gateReentryRequired,
    production_ready_status: productionReadyStatus,
    production_ready: productionReady,
    remaining_high_priority_count: remainingHighPriorityCount,
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
      gate_state_audit_hardening_artifact_write_scope: GATE_STATE_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    state_audit_hardening_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyGateStateAuditHardeningManifest = {
    manifest_id: 'mv-production-ready-gate-state-audit-hardening-manifest-v1',
    phase: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PHASE,
    generated_at: timestamp,
    gate_state: gateState,
    gate_state_reason: gateStateReason,
    gate_reentry_required: gateReentryRequired,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyGateStateAuditHardeningReport = {
    report_id: 'mv-production-ready-gate-state-audit-hardening-report-v1',
    phase: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PHASE,
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
    source_eligibility_audit_ref: MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH,
    mv_production_ready_gate_eligibility_audit_hardening_report_path:
      MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH,
    mv_production_ready_gate_state_audit_hardening_export_dir: MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_EXPORT_DIR,
    mv_production_ready_gate_state_audit_hardening_manifest_path:
      MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_MANIFEST_PATH,
    mv_production_ready_gate_state_audit_hardening_artifact_path:
      MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_ARTIFACT_PATH,
    state_audit_hardening_id: 'mv-production-ready-gate-state-audit-hardening-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    gate_state: gateState,
    gate_state_reason: gateStateReason,
    gate_reentry_required: gateReentryRequired,
    production_ready_status: productionReadyStatus,
    production_ready: productionReady,
    remaining_high_priority_count: remainingHighPriorityCount,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    eligibility_audit_consumed: toStatus(eligibilityAuditConsumed),
    gate_state_valid: toStatus(gateStateValid),
    gate_state_reason_valid: toStatus(gateStateReasonValid),
    gate_reentry_required_valid: toStatus(gateReentryRequiredValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    gate_state_invalid: gateStateInvalid,
    gate_state_reason_missing: gateStateReasonMissing,
    gate_reentry_required_invalid: gateReentryRequiredInvalid,
    production_ready_path_blocked: productionReadyPathBlocked,
    eligibility_audit_missing: eligibilityAuditMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_gate_state_audit_hardening_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENED_STATUS : null,
    next_stage_approved: pass,
    state_audit_checks: stateAuditChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_PASS_VERDICT
      : MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_GATE_STATE_AUDIT_HARDENING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
