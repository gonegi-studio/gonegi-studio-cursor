import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH,
  PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS,
  REENTRY_PROGRESS_STATUS_COMPLETE,
  REENTRY_PROGRESS_STATUS_NOT_STARTED,
  type MvProductionReadyReentryProgressAuditArtifact,
} from './mvProductionReadyReentryProgressAudit.js';
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

export const MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PHASE =
  'PHASE-DIGITAL-STUDIO-024D-MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_V1' as const;
export const PRODUCTION_READY_REENTRY_FINAL_READINESS_TRACKED_STATUS =
  'PRODUCTION_READY_REENTRY_FINAL_READINESS_TRACKED' as const;
export const REENTRY_FINAL_READINESS_REASON_HIGH_PRIORITY_ITEMS_REMAINING =
  'HIGH_PRIORITY_ITEMS_REMAINING' as const;
export const REENTRY_FINAL_READINESS_REASON_ALL_HIGH_PRIORITY_RESOLVED =
  'ALL_HIGH_PRIORITY_RESOLVED' as const;
export const MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_DIR =
  'reports/mv_production_ready_reentry_final_readiness' as const;
export const MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_REPORT_PATH =
  'reports/mv_production_ready_reentry_final_readiness/mv-production-ready-reentry-final-readiness-report.json' as const;
export const MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MD_PATH =
  'reports/mv_production_ready_reentry_final_readiness/MV_PRODUCTION_READY_REENTRY_FINAL_READINESS.md' as const;
export const MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_EXPORT_DIR =
  'exports/mv_production_ready_reentry_final_readiness' as const;
export const MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MANIFEST_PATH =
  'exports/mv_production_ready_reentry_final_readiness/mv-production-ready-reentry-final-readiness-manifest.json' as const;
export const MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH =
  'exports/mv_production_ready_reentry_final_readiness/mv-production-ready-reentry-final-readiness.json' as const;

export const REENTRY_FINAL_READINESS_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_ready_reentry_final_readiness/' as const;

export const REENTRY_FINAL_READINESS_REASONS = [
  REENTRY_FINAL_READINESS_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  REENTRY_FINAL_READINESS_REASON_ALL_HIGH_PRIORITY_RESOLVED,
] as const;

export type ReentryFinalReadinessReason = (typeof REENTRY_FINAL_READINESS_REASONS)[number];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type FinalReadinessStatus = 'PASS' | 'FAIL';

export type MvProductionReadyReentryFinalReadinessIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type FinalReadinessCheck = {
  check_id: string;
  check_label: string;
  status: FinalReadinessStatus;
};

export type MvProductionReadyReentryFinalReadinessArtifact = {
  reentry_final_readiness_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PHASE;
  generated_at: string;
  source_progress_audit_ref: typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH;
  reentry_progress_audit_id: string;
  remaining_high_priority_count: number;
  reentry_final_readiness: boolean;
  reentry_final_readiness_reason: ReentryFinalReadinessReason;
  production_ready_reentry_allowed: boolean;
  reentry_progress_percent: number;
  reentry_progress_status: typeof REENTRY_PROGRESS_STATUS_NOT_STARTED | typeof REENTRY_PROGRESS_STATUS_COMPLETE | 'IN_PROGRESS';
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
    reentry_final_readiness_artifact_write_scope: typeof REENTRY_FINAL_READINESS_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  reentry_final_readiness_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyReentryFinalReadinessManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PHASE;
  generated_at: string;
  reentry_final_readiness: boolean;
  reentry_final_readiness_reason: ReentryFinalReadinessReason;
  production_ready_reentry_allowed: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: FinalReadinessStatus;
  next_stage_ready: FinalReadinessStatus;
  certification_status: typeof PRODUCTION_READY_REENTRY_FINAL_READINESS_TRACKED_STATUS | null;
};

export type MvProductionReadyReentryFinalReadinessReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PHASE;
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
  source_progress_audit_ref: typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH;
  mv_production_ready_reentry_progress_audit_report_path: typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH;
  mv_production_ready_reentry_final_readiness_export_dir: typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_EXPORT_DIR;
  mv_production_ready_reentry_final_readiness_manifest_path: typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MANIFEST_PATH;
  mv_production_ready_reentry_final_readiness_artifact_path: typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH;
  reentry_final_readiness_id: string;
  source_count: number;
  adapter_count: number;
  remaining_high_priority_count: number;
  reentry_final_readiness: boolean;
  reentry_final_readiness_reason: ReentryFinalReadinessReason;
  production_ready_reentry_allowed: boolean;
  reentry_progress_percent: number;
  reentry_progress_status: string;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  progress_audit_consumed: FinalReadinessStatus;
  reentry_final_readiness_valid: FinalReadinessStatus;
  reentry_final_readiness_reason_valid: FinalReadinessStatus;
  production_ready_reentry_allowed_valid: FinalReadinessStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: FinalReadinessStatus;
  next_stage_ready: FinalReadinessStatus;
  reentry_final_readiness_invalid: boolean;
  production_ready_reentry_not_allowed: boolean;
  progress_audit_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_reentry_final_readiness_ready: FinalReadinessStatus;
  certification_status: typeof PRODUCTION_READY_REENTRY_FINAL_READINESS_TRACKED_STATUS | null;
  next_stage_approved: boolean;
  final_readiness_checks: FinalReadinessCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_FAIL_VERDICT;
  issues: MvProductionReadyReentryFinalReadinessIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_DIR,
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_EXPORT_DIR,
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_REPORT_PATH,
  MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): FinalReadinessStatus {
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

function resolveReentryFinalReadiness(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount === 0;
}

function resolveProductionReadyReentryAllowed(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount === 0;
}

function resolveReentryFinalReadinessReason(remainingHighPriorityCount: number): ReentryFinalReadinessReason {
  return remainingHighPriorityCount > 0
    ? REENTRY_FINAL_READINESS_REASON_HIGH_PRIORITY_ITEMS_REMAINING
    : REENTRY_FINAL_READINESS_REASON_ALL_HIGH_PRIORITY_RESOLVED;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyReentryFinalReadinessIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyReentryFinalReadinessReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyReentryFinalReadinessReport = {
    report_id: 'mv-production-ready-reentry-final-readiness-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PHASE,
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
    source_progress_audit_ref: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH,
    mv_production_ready_reentry_progress_audit_report_path:
      MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH,
    mv_production_ready_reentry_final_readiness_export_dir: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_EXPORT_DIR,
    mv_production_ready_reentry_final_readiness_manifest_path:
      MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MANIFEST_PATH,
    mv_production_ready_reentry_final_readiness_artifact_path:
      MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH,
    reentry_final_readiness_id: 'mv-production-ready-reentry-final-readiness-v1',
    source_count: 0,
    adapter_count: 0,
    remaining_high_priority_count: 0,
    reentry_final_readiness: false,
    reentry_final_readiness_reason: REENTRY_FINAL_READINESS_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
    production_ready_reentry_allowed: false,
    reentry_progress_percent: 0,
    reentry_progress_status: REENTRY_PROGRESS_STATUS_NOT_STARTED,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: [],
    progress_audit_consumed: 'FAIL',
    reentry_final_readiness_valid: 'FAIL',
    reentry_final_readiness_reason_valid: 'FAIL',
    production_ready_reentry_allowed_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    reentry_final_readiness_invalid: true,
    production_ready_reentry_not_allowed: true,
    progress_audit_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_reentry_final_readiness_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    final_readiness_checks: [],
    final_verdict: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyReentryFinalReadiness(
  projectRoot?: string
): MvProductionReadyReentryFinalReadinessReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyReentryFinalReadinessIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const progressAuditReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: FinalReadinessStatus;
    mv_production_ready_reentry_progress_audit_ready: FinalReadinessStatus;
    traceability_preserved: boolean;
    remaining_high_priority_count: number;
    reentry_progress_percent: number;
    reentry_progress_status: string;
    reentry_completion_ready: boolean;
    next_reentry_gate_label: string;
  }>(root, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH);

  const progressAuditArtifact = loadJson<MvProductionReadyReentryProgressAuditArtifact>(
    root,
    MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH
  );
  const progressAuditManifestPath = path.join(root, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH);

  if (
    !progressAuditReport ||
    !progressAuditArtifact ||
    !fs.existsSync(progressAuditManifestPath) ||
    progressAuditReport.final_verdict !== MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PASS_VERDICT ||
    progressAuditReport.certification_status !== PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS ||
    progressAuditReport.next_stage_ready !== 'PASS' ||
    progressAuditReport.mv_production_ready_reentry_progress_audit_ready !== 'PASS'
  ) {
    issues.push({
      code: 'PROGRESS_AUDIT_MISSING',
      message: `Required ${MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PASS_VERDICT} with ${PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const progressAuditConsumed =
    progressAuditArtifact.reentry_progress_audit_complete === true &&
    progressAuditArtifact.next_stage_ready === true &&
    progressAuditArtifact.next_reentry_gate_label === NEXT_REENTRY_GATE_LABEL;

  const remainingHighPriorityCount = progressAuditArtifact.remaining_high_priority_count;
  const reentryFinalReadiness = resolveReentryFinalReadiness(remainingHighPriorityCount);
  const reentryFinalReadinessReason = resolveReentryFinalReadinessReason(remainingHighPriorityCount);
  const productionReadyReentryAllowed = resolveProductionReadyReentryAllowed(remainingHighPriorityCount);
  const reentryProgressPercent = progressAuditArtifact.reentry_progress_percent;
  const reentryProgressStatus = progressAuditArtifact.reentry_progress_status;

  const traceabilityChains = progressAuditArtifact.traceability_chain;
  const traceabilityPreserved =
    progressAuditReport.traceability_preserved === true &&
    progressAuditArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const reentryFinalReadinessValid =
    reentryFinalReadiness === resolveReentryFinalReadiness(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0 ? reentryFinalReadiness === false : reentryFinalReadiness === true) &&
    reentryFinalReadiness === progressAuditArtifact.reentry_completion_ready;

  const reentryFinalReadinessReasonValid =
    reentryFinalReadinessReason === resolveReentryFinalReadinessReason(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0
      ? reentryFinalReadinessReason === REENTRY_FINAL_READINESS_REASON_HIGH_PRIORITY_ITEMS_REMAINING
      : reentryFinalReadinessReason === REENTRY_FINAL_READINESS_REASON_ALL_HIGH_PRIORITY_RESOLVED);

  const productionReadyReentryAllowedValid =
    productionReadyReentryAllowed === resolveProductionReadyReentryAllowed(remainingHighPriorityCount) &&
    productionReadyReentryAllowed === reentryFinalReadiness &&
    (remainingHighPriorityCount > 0
      ? productionReadyReentryAllowed === false
      : productionReadyReentryAllowed === true);

  const reentryFinalReadinessInvalid = !reentryFinalReadinessValid;
  const productionReadyReentryNotAllowed =
    productionReadyReentryAllowed !== reentryFinalReadiness ||
    (remainingHighPriorityCount > 0 && productionReadyReentryAllowed === true) ||
    (remainingHighPriorityCount === 0 && productionReadyReentryAllowed === false);

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(REENTRY_FINAL_READINESS_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const progressAuditMissing = !progressAuditConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const reentryFinalReadinessComplete =
    progressAuditConsumed &&
    reentryFinalReadinessValid &&
    reentryFinalReadinessReasonValid &&
    productionReadyReentryAllowedValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !reentryFinalReadinessInvalid &&
    !productionReadyReentryNotAllowed &&
    remainingHighPriorityCount === progressAuditReport.remaining_high_priority_count &&
    (remainingHighPriorityCount > 0
      ? reentryFinalReadiness === false &&
        productionReadyReentryAllowed === false &&
        reentryProgressStatus === REENTRY_PROGRESS_STATUS_NOT_STARTED &&
        reentryProgressPercent === 0
      : reentryFinalReadiness === true &&
        productionReadyReentryAllowed === true &&
        reentryProgressStatus === REENTRY_PROGRESS_STATUS_COMPLETE &&
        reentryProgressPercent === 100);

  const nextStageReady = reentryFinalReadinessComplete;

  if (progressAuditMissing) {
    issues.push({
      code: 'PROGRESS_AUDIT_MISSING',
      message: 'Reentry progress audit was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (reentryFinalReadinessInvalid) {
    issues.push({
      code: 'REENTRY_FINAL_READINESS_INVALID',
      message: 'Reentry final readiness flag is invalid',
      severity: 'error',
      check_id: 'reentry_final_readiness_valid',
    });
  }
  if (!reentryFinalReadinessReasonValid) {
    issues.push({
      code: 'REENTRY_FINAL_READINESS_REASON_INVALID',
      message: 'Reentry final readiness reason is invalid',
      severity: 'error',
      check_id: 'reentry_final_readiness_reason_valid',
    });
  }
  if (!productionReadyReentryAllowedValid) {
    issues.push({
      code: 'PRODUCTION_READY_REENTRY_ALLOWED_INVALID',
      message: 'Production ready reentry allowed flag is invalid',
      severity: 'error',
      check_id: 'production_ready_reentry_allowed_valid',
    });
  }
  if (productionReadyReentryNotAllowed) {
    issues.push({
      code: 'PRODUCTION_READY_REENTRY_NOT_ALLOWED',
      message: 'Production ready reentry allowance is inconsistent with final readiness',
      severity: 'error',
    });
  }

  const finalReadinessChecks: FinalReadinessCheck[] = [
    {
      check_id: 'reentry_final_readiness_valid',
      check_label: 'Reentry Final Readiness Valid',
      status: toStatus(reentryFinalReadinessValid),
    },
    {
      check_id: 'reentry_final_readiness_reason_valid',
      check_label: 'Reentry Final Readiness Reason Valid',
      status: toStatus(reentryFinalReadinessReasonValid),
    },
    {
      check_id: 'production_ready_reentry_allowed_valid',
      check_label: 'Production Ready Reentry Allowed Valid',
      status: toStatus(productionReadyReentryAllowedValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyReentryFinalReadinessArtifact = {
    reentry_final_readiness_id: 'mv-production-ready-reentry-final-readiness-v1',
    phase: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PHASE,
    generated_at: timestamp,
    source_progress_audit_ref: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH,
    reentry_progress_audit_id: progressAuditArtifact.reentry_progress_audit_id,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_final_readiness: reentryFinalReadiness,
    reentry_final_readiness_reason: reentryFinalReadinessReason,
    production_ready_reentry_allowed: productionReadyReentryAllowed,
    reentry_progress_percent: reentryProgressPercent,
    reentry_progress_status: reentryProgressStatus,
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
      reentry_final_readiness_artifact_write_scope: REENTRY_FINAL_READINESS_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    reentry_final_readiness_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyReentryFinalReadinessManifest = {
    manifest_id: 'mv-production-ready-reentry-final-readiness-manifest-v1',
    phase: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PHASE,
    generated_at: timestamp,
    reentry_final_readiness: reentryFinalReadiness,
    reentry_final_readiness_reason: reentryFinalReadinessReason,
    production_ready_reentry_allowed: productionReadyReentryAllowed,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? PRODUCTION_READY_REENTRY_FINAL_READINESS_TRACKED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyReentryFinalReadinessReport = {
    report_id: 'mv-production-ready-reentry-final-readiness-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PHASE,
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
    source_progress_audit_ref: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH,
    mv_production_ready_reentry_progress_audit_report_path:
      MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH,
    mv_production_ready_reentry_final_readiness_export_dir: MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_EXPORT_DIR,
    mv_production_ready_reentry_final_readiness_manifest_path:
      MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_MANIFEST_PATH,
    mv_production_ready_reentry_final_readiness_artifact_path:
      MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_ARTIFACT_PATH,
    reentry_final_readiness_id: 'mv-production-ready-reentry-final-readiness-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_final_readiness: reentryFinalReadiness,
    reentry_final_readiness_reason: reentryFinalReadinessReason,
    production_ready_reentry_allowed: productionReadyReentryAllowed,
    reentry_progress_percent: reentryProgressPercent,
    reentry_progress_status: reentryProgressStatus,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: traceabilityChains,
    progress_audit_consumed: toStatus(progressAuditConsumed),
    reentry_final_readiness_valid: toStatus(reentryFinalReadinessValid),
    reentry_final_readiness_reason_valid: toStatus(reentryFinalReadinessReasonValid),
    production_ready_reentry_allowed_valid: toStatus(productionReadyReentryAllowedValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    reentry_final_readiness_invalid: reentryFinalReadinessInvalid,
    production_ready_reentry_not_allowed: productionReadyReentryNotAllowed,
    progress_audit_missing: progressAuditMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_reentry_final_readiness_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_READY_REENTRY_FINAL_READINESS_TRACKED_STATUS : null,
    next_stage_approved: pass,
    final_readiness_checks: finalReadinessChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_PASS_VERDICT
      : MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_FINAL_READINESS_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
