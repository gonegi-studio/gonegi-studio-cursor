import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_REPORT_PATH,
  PRODUCTION_READY_REENTRY_FINAL_READINESS_TRACKED_STATUS,
  REENTRY_FINAL_READINESS_REASON_ALL_HIGH_PRIORITY_RESOLVED,
  REENTRY_FINAL_READINESS_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  type MvProductionReadyReentryFinalReadinessArtifact,
} from './mvProductionReadyReentryFinalReadiness.js';
import { NEXT_REENTRY_GATE_LABEL } from './mvProductionReadyReentryTracking.js';
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

export const MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PHASE =
  'PHASE-DIGITAL-STUDIO-024E-MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_V1' as const;
export const REENTRY_TERMINATION_TRACKED_STATUS = 'REENTRY_TERMINATION_TRACKED' as const;
export const FINAL_HARDENING_PHASE = 'DS_024E_FIXED' as const;
export const NO_NEW_GATE_ALLOWED = true as const;
export const REENTRY_TERMINATION_REASON_HIGH_PRIORITY_ITEMS_REMAINING =
  'HIGH_PRIORITY_ITEMS_REMAINING' as const;
export const REENTRY_TERMINATION_REASON_ALL_HIGH_PRIORITY_RESOLVED = 'ALL_HIGH_PRIORITY_RESOLVED' as const;
export const REENTRY_PATH_RESOLVE_HIGH_PRIORITY_ITEMS = 'RESOLVE_HIGH_PRIORITY_ITEMS' as const;
export const REENTRY_PATH_PRODUCTION_READY_REEVALUATION = 'PRODUCTION_READY_REEVALUATION' as const;
export const REENTRY_PATH_PRODUCTION_READY_CERTIFICATION = 'PRODUCTION_READY_CERTIFICATION' as const;
export const MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_DIR =
  'reports/mv_production_ready_reentry_termination_gate' as const;
export const MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH =
  'reports/mv_production_ready_reentry_termination_gate/mv-production-ready-reentry-termination-gate-report.json' as const;
export const MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MD_PATH =
  'reports/mv_production_ready_reentry_termination_gate/MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE.md' as const;
export const MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_EXPORT_DIR =
  'exports/mv_production_ready_reentry_termination_gate' as const;
export const MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH =
  'exports/mv_production_ready_reentry_termination_gate/mv-production-ready-reentry-termination-gate-manifest.json' as const;
export const MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH =
  'exports/mv_production_ready_reentry_termination_gate/mv-production-ready-reentry-termination-gate.json' as const;

export const REENTRY_TERMINATION_GATE_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_ready_reentry_termination_gate/' as const;

export const REENTRY_TERMINATION_REASONS = [
  REENTRY_TERMINATION_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  REENTRY_TERMINATION_REASON_ALL_HIGH_PRIORITY_RESOLVED,
] as const;

export const AUTHORIZED_REENTRY_PATH = [
  FINAL_HARDENING_PHASE,
  REENTRY_PATH_RESOLVE_HIGH_PRIORITY_ITEMS,
  NEXT_REENTRY_GATE_LABEL,
  REENTRY_PATH_PRODUCTION_READY_REEVALUATION,
  REENTRY_PATH_PRODUCTION_READY_CERTIFICATION,
] as const;

export type ReentryTerminationReason = (typeof REENTRY_TERMINATION_REASONS)[number];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type TerminationGateStatus = 'PASS' | 'FAIL';

export type MvProductionReadyReentryTerminationGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type TerminationGateCheck = {
  check_id: string;
  check_label: string;
  status: TerminationGateStatus;
};

export type MvProductionReadyReentryTerminationGateArtifact = {
  reentry_termination_gate_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PHASE;
  generated_at: string;
  source_final_readiness_ref: typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH;
  reentry_final_readiness_id: string;
  remaining_high_priority_count: number;
  reentry_termination_ready: boolean;
  reentry_termination_reason: ReentryTerminationReason;
  production_ready_entry_allowed: boolean;
  final_hardening_phase: typeof FINAL_HARDENING_PHASE;
  no_new_gate_allowed: typeof NO_NEW_GATE_ALLOWED;
  authorized_reentry_path: readonly string[];
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    reentry_termination_gate_artifact_write_scope: typeof REENTRY_TERMINATION_GATE_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  reentry_termination_gate_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyReentryTerminationGateManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PHASE;
  generated_at: string;
  reentry_termination_ready: boolean;
  production_ready_entry_allowed: boolean;
  final_hardening_phase: typeof FINAL_HARDENING_PHASE;
  no_new_gate_allowed: typeof NO_NEW_GATE_ALLOWED;
  traceability_preserved: boolean;
  safe_create_policy_verified: TerminationGateStatus;
  next_stage_ready: TerminationGateStatus;
  certification_status: typeof REENTRY_TERMINATION_TRACKED_STATUS | null;
};

export type MvProductionReadyReentryTerminationGateReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PHASE;
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
  source_final_readiness_ref: typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH;
  mv_production_ready_reentry_final_readiness_report_path: typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_REPORT_PATH;
  mv_production_ready_reentry_termination_gate_export_dir: typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_EXPORT_DIR;
  mv_production_ready_reentry_termination_gate_manifest_path: typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH;
  mv_production_ready_reentry_termination_gate_artifact_path: typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH;
  reentry_termination_gate_id: string;
  source_count: number;
  adapter_count: number;
  remaining_high_priority_count: number;
  reentry_termination_ready: boolean;
  reentry_termination_reason: ReentryTerminationReason;
  production_ready_entry_allowed: boolean;
  final_hardening_phase: typeof FINAL_HARDENING_PHASE;
  no_new_gate_allowed: typeof NO_NEW_GATE_ALLOWED;
  authorized_reentry_path: readonly string[];
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  final_readiness_consumed: TerminationGateStatus;
  reentry_termination_ready_valid: TerminationGateStatus;
  reentry_termination_reason_valid: TerminationGateStatus;
  production_ready_entry_allowed_valid: TerminationGateStatus;
  final_hardening_phase_valid: TerminationGateStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: TerminationGateStatus;
  next_stage_ready: TerminationGateStatus;
  reentry_termination_premature: boolean;
  production_ready_entry_not_allowed: boolean;
  additional_hardening_phase_attempted: boolean;
  final_readiness_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_reentry_termination_gate_ready: TerminationGateStatus;
  certification_status: typeof REENTRY_TERMINATION_TRACKED_STATUS | null;
  next_stage_approved: boolean;
  termination_gate_checks: TerminationGateCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_FAIL_VERDICT;
  issues: MvProductionReadyReentryTerminationGateIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_DIR,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_EXPORT_DIR,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): TerminationGateStatus {
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

function resolveReentryTerminationReady(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount === 0;
}

function resolveProductionReadyEntryAllowed(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount === 0;
}

function resolveReentryTerminationReason(remainingHighPriorityCount: number): ReentryTerminationReason {
  return remainingHighPriorityCount > 0
    ? REENTRY_TERMINATION_REASON_HIGH_PRIORITY_ITEMS_REMAINING
    : REENTRY_TERMINATION_REASON_ALL_HIGH_PRIORITY_RESOLVED;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyReentryTerminationGateIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyReentryTerminationGateReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyReentryTerminationGateReport = {
    report_id: 'mv-production-ready-reentry-termination-gate-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PHASE,
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
    source_final_readiness_ref: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH,
    mv_production_ready_reentry_final_readiness_report_path:
      MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_REPORT_PATH,
    mv_production_ready_reentry_termination_gate_export_dir: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_EXPORT_DIR,
    mv_production_ready_reentry_termination_gate_manifest_path:
      MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH,
    mv_production_ready_reentry_termination_gate_artifact_path:
      MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH,
    reentry_termination_gate_id: 'mv-production-ready-reentry-termination-gate-v1',
    source_count: 0,
    adapter_count: 0,
    remaining_high_priority_count: 0,
    reentry_termination_ready: false,
    reentry_termination_reason: REENTRY_TERMINATION_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
    production_ready_entry_allowed: false,
    final_hardening_phase: FINAL_HARDENING_PHASE,
    no_new_gate_allowed: NO_NEW_GATE_ALLOWED,
    authorized_reentry_path: [...AUTHORIZED_REENTRY_PATH],
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: [],
    final_readiness_consumed: 'FAIL',
    reentry_termination_ready_valid: 'FAIL',
    reentry_termination_reason_valid: 'FAIL',
    production_ready_entry_allowed_valid: 'FAIL',
    final_hardening_phase_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    reentry_termination_premature: true,
    production_ready_entry_not_allowed: true,
    additional_hardening_phase_attempted: true,
    final_readiness_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_reentry_termination_gate_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    termination_gate_checks: [],
    final_verdict: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyReentryTerminationGate(
  projectRoot?: string
): MvProductionReadyReentryTerminationGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyReentryTerminationGateIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const finalReadinessReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: TerminationGateStatus;
    mv_production_ready_reentry_final_readiness_ready: TerminationGateStatus;
    traceability_preserved: boolean;
    remaining_high_priority_count: number;
    reentry_final_readiness: boolean;
    production_ready_reentry_allowed: boolean;
    reentry_final_readiness_reason: string;
    next_reentry_gate_label: string;
  }>(root, MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_REPORT_PATH);

  const finalReadinessArtifact = loadJson<MvProductionReadyReentryFinalReadinessArtifact>(
    root,
    MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH
  );
  const finalReadinessManifestPath = path.join(root, MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MANIFEST_PATH);

  if (
    !finalReadinessReport ||
    !finalReadinessArtifact ||
    !fs.existsSync(finalReadinessManifestPath) ||
    finalReadinessReport.final_verdict !== MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PASS_VERDICT ||
    finalReadinessReport.certification_status !== PRODUCTION_READY_REENTRY_FINAL_READINESS_TRACKED_STATUS ||
    finalReadinessReport.next_stage_ready !== 'PASS' ||
    finalReadinessReport.mv_production_ready_reentry_final_readiness_ready !== 'PASS'
  ) {
    issues.push({
      code: 'FINAL_READINESS_MISSING',
      message: `Required ${MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PASS_VERDICT} with ${PRODUCTION_READY_REENTRY_FINAL_READINESS_TRACKED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const finalReadinessConsumed =
    finalReadinessArtifact.reentry_final_readiness_complete === true &&
    finalReadinessArtifact.next_stage_ready === true &&
    finalReadinessArtifact.next_reentry_gate_label === NEXT_REENTRY_GATE_LABEL;

  const remainingHighPriorityCount = finalReadinessArtifact.remaining_high_priority_count;
  const reentryTerminationReady = resolveReentryTerminationReady(remainingHighPriorityCount);
  const reentryTerminationReason = resolveReentryTerminationReason(remainingHighPriorityCount);
  const productionReadyEntryAllowed = resolveProductionReadyEntryAllowed(remainingHighPriorityCount);
  const finalHardeningPhase = FINAL_HARDENING_PHASE;
  const noNewGateAllowed = NO_NEW_GATE_ALLOWED;

  const traceabilityChains = finalReadinessArtifact.traceability_chain;
  const traceabilityPreserved =
    finalReadinessReport.traceability_preserved === true &&
    finalReadinessArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const reentryTerminationReadyValid =
    reentryTerminationReady === resolveReentryTerminationReady(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0 ? reentryTerminationReady === false : reentryTerminationReady === true) &&
    reentryTerminationReady === finalReadinessArtifact.reentry_final_readiness;

  const reentryTerminationReasonValid =
    reentryTerminationReason === resolveReentryTerminationReason(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0
      ? reentryTerminationReason === REENTRY_TERMINATION_REASON_HIGH_PRIORITY_ITEMS_REMAINING &&
        finalReadinessArtifact.reentry_final_readiness_reason ===
          REENTRY_FINAL_READINESS_REASON_HIGH_PRIORITY_ITEMS_REMAINING
      : reentryTerminationReason === REENTRY_TERMINATION_REASON_ALL_HIGH_PRIORITY_RESOLVED &&
        finalReadinessArtifact.reentry_final_readiness_reason ===
          REENTRY_FINAL_READINESS_REASON_ALL_HIGH_PRIORITY_RESOLVED);

  const productionReadyEntryAllowedValid =
    productionReadyEntryAllowed === resolveProductionReadyEntryAllowed(remainingHighPriorityCount) &&
    productionReadyEntryAllowed === reentryTerminationReady &&
    productionReadyEntryAllowed === finalReadinessArtifact.production_ready_reentry_allowed &&
    (remainingHighPriorityCount > 0
      ? productionReadyEntryAllowed === false
      : productionReadyEntryAllowed === true);

  const finalHardeningPhaseValid =
    finalHardeningPhase === FINAL_HARDENING_PHASE &&
    noNewGateAllowed === NO_NEW_GATE_ALLOWED &&
    AUTHORIZED_REENTRY_PATH[0] === FINAL_HARDENING_PHASE;

  const reentryTerminationPremature =
    (remainingHighPriorityCount > 0 && reentryTerminationReady === true) ||
    (remainingHighPriorityCount === 0 && reentryTerminationReady === false);

  const productionReadyEntryNotAllowed =
    productionReadyEntryAllowed !== reentryTerminationReady ||
    (remainingHighPriorityCount > 0 && productionReadyEntryAllowed === true) ||
    (remainingHighPriorityCount === 0 && productionReadyEntryAllowed === false);

  const additionalHardeningPhaseAttempted =
    finalHardeningPhase !== FINAL_HARDENING_PHASE || noNewGateAllowed !== NO_NEW_GATE_ALLOWED;

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(REENTRY_TERMINATION_GATE_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const finalReadinessMissing = !finalReadinessConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const reentryTerminationGateComplete =
    finalReadinessConsumed &&
    reentryTerminationReadyValid &&
    reentryTerminationReasonValid &&
    productionReadyEntryAllowedValid &&
    finalHardeningPhaseValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !reentryTerminationPremature &&
    !productionReadyEntryNotAllowed &&
    !additionalHardeningPhaseAttempted &&
    remainingHighPriorityCount === finalReadinessReport.remaining_high_priority_count &&
    (remainingHighPriorityCount > 0
      ? reentryTerminationReady === false &&
        productionReadyEntryAllowed === false &&
        finalReadinessReport.production_ready_reentry_allowed === false
      : reentryTerminationReady === true && productionReadyEntryAllowed === true);

  const nextStageReady = reentryTerminationGateComplete;

  if (finalReadinessMissing) {
    issues.push({
      code: 'FINAL_READINESS_MISSING',
      message: 'Reentry final readiness was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (!reentryTerminationReadyValid) {
    issues.push({
      code: 'REENTRY_TERMINATION_READY_INVALID',
      message: 'Reentry termination ready flag is invalid',
      severity: 'error',
      check_id: 'reentry_termination_ready_valid',
    });
  }
  if (!reentryTerminationReasonValid) {
    issues.push({
      code: 'REENTRY_TERMINATION_REASON_INVALID',
      message: 'Reentry termination reason is invalid',
      severity: 'error',
      check_id: 'reentry_termination_reason_valid',
    });
  }
  if (!productionReadyEntryAllowedValid) {
    issues.push({
      code: 'PRODUCTION_READY_ENTRY_ALLOWED_INVALID',
      message: 'Production ready entry allowed flag is invalid',
      severity: 'error',
      check_id: 'production_ready_entry_allowed_valid',
    });
  }
  if (!finalHardeningPhaseValid) {
    issues.push({
      code: 'FINAL_HARDENING_PHASE_INVALID',
      message: 'Final hardening phase is invalid',
      severity: 'error',
      check_id: 'final_hardening_phase_valid',
    });
  }
  if (reentryTerminationPremature) {
    issues.push({
      code: 'REENTRY_TERMINATION_PREMATURE',
      message: 'Reentry termination would be premature before high priority resolution',
      severity: 'error',
    });
  }
  if (productionReadyEntryNotAllowed) {
    issues.push({
      code: 'PRODUCTION_READY_ENTRY_NOT_ALLOWED',
      message: 'Production ready entry allowance is inconsistent with termination readiness',
      severity: 'error',
    });
  }
  if (additionalHardeningPhaseAttempted) {
    issues.push({
      code: 'ADDITIONAL_HARDENING_PHASE_ATTEMPTED',
      message: 'Additional hardening phase beyond DS_024E_FIXED is not allowed',
      severity: 'error',
    });
  }

  const terminationGateChecks: TerminationGateCheck[] = [
    {
      check_id: 'reentry_termination_ready_valid',
      check_label: 'Reentry Termination Ready Valid',
      status: toStatus(reentryTerminationReadyValid),
    },
    {
      check_id: 'reentry_termination_reason_valid',
      check_label: 'Reentry Termination Reason Valid',
      status: toStatus(reentryTerminationReasonValid),
    },
    {
      check_id: 'production_ready_entry_allowed_valid',
      check_label: 'Production Ready Entry Allowed Valid',
      status: toStatus(productionReadyEntryAllowedValid),
    },
    {
      check_id: 'final_hardening_phase_valid',
      check_label: 'Final Hardening Phase Valid',
      status: toStatus(finalHardeningPhaseValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyReentryTerminationGateArtifact = {
    reentry_termination_gate_id: 'mv-production-ready-reentry-termination-gate-v1',
    phase: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PHASE,
    generated_at: timestamp,
    source_final_readiness_ref: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH,
    reentry_final_readiness_id: finalReadinessArtifact.reentry_final_readiness_id,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_termination_ready: reentryTerminationReady,
    reentry_termination_reason: reentryTerminationReason,
    production_ready_entry_allowed: productionReadyEntryAllowed,
    final_hardening_phase: finalHardeningPhase,
    no_new_gate_allowed: noNewGateAllowed,
    authorized_reentry_path: [...AUTHORIZED_REENTRY_PATH],
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    current_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      reentry_termination_gate_artifact_write_scope: REENTRY_TERMINATION_GATE_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    reentry_termination_gate_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyReentryTerminationGateManifest = {
    manifest_id: 'mv-production-ready-reentry-termination-gate-manifest-v1',
    phase: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PHASE,
    generated_at: timestamp,
    reentry_termination_ready: reentryTerminationReady,
    production_ready_entry_allowed: productionReadyEntryAllowed,
    final_hardening_phase: finalHardeningPhase,
    no_new_gate_allowed: noNewGateAllowed,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? REENTRY_TERMINATION_TRACKED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyReentryTerminationGateReport = {
    report_id: 'mv-production-ready-reentry-termination-gate-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PHASE,
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
    source_final_readiness_ref: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH,
    mv_production_ready_reentry_final_readiness_report_path:
      MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_REPORT_PATH,
    mv_production_ready_reentry_termination_gate_export_dir: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_EXPORT_DIR,
    mv_production_ready_reentry_termination_gate_manifest_path:
      MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH,
    mv_production_ready_reentry_termination_gate_artifact_path:
      MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH,
    reentry_termination_gate_id: 'mv-production-ready-reentry-termination-gate-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_termination_ready: reentryTerminationReady,
    reentry_termination_reason: reentryTerminationReason,
    production_ready_entry_allowed: productionReadyEntryAllowed,
    final_hardening_phase: finalHardeningPhase,
    no_new_gate_allowed: noNewGateAllowed,
    authorized_reentry_path: [...AUTHORIZED_REENTRY_PATH],
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: traceabilityChains,
    final_readiness_consumed: toStatus(finalReadinessConsumed),
    reentry_termination_ready_valid: toStatus(reentryTerminationReadyValid),
    reentry_termination_reason_valid: toStatus(reentryTerminationReasonValid),
    production_ready_entry_allowed_valid: toStatus(productionReadyEntryAllowedValid),
    final_hardening_phase_valid: toStatus(finalHardeningPhaseValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    reentry_termination_premature: reentryTerminationPremature,
    production_ready_entry_not_allowed: productionReadyEntryNotAllowed,
    additional_hardening_phase_attempted: additionalHardeningPhaseAttempted,
    final_readiness_missing: finalReadinessMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_reentry_termination_gate_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? REENTRY_TERMINATION_TRACKED_STATUS : null,
    next_stage_approved: pass,
    termination_gate_checks: terminationGateChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PASS_VERDICT
      : MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
