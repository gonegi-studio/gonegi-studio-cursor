import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH,
  PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS,
  type MvProductionReadyReentryCompletionGateArtifact,
} from './mvProductionReadyReentryCompletionGate.js';
import {
  MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
  NEXT_REENTRY_GATE_LABEL,
  type MvProductionReadyReentryTrackingArtifact,
} from './mvProductionReadyReentryTracking.js';
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

export const MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PHASE =
  'PHASE-DIGITAL-STUDIO-024C-MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_V1' as const;
export const PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS =
  'PRODUCTION_READY_REENTRY_PROGRESS_TRACKED' as const;
export const REENTRY_PROGRESS_STATUS_NOT_STARTED = 'NOT_STARTED' as const;
export const REENTRY_PROGRESS_STATUS_IN_PROGRESS = 'IN_PROGRESS' as const;
export const REENTRY_PROGRESS_STATUS_COMPLETE = 'COMPLETE' as const;
export const MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_DIR =
  'reports/mv_production_ready_reentry_progress_audit' as const;
export const MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH =
  'reports/mv_production_ready_reentry_progress_audit/mv-production-ready-reentry-progress-audit-report.json' as const;
export const MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MD_PATH =
  'reports/mv_production_ready_reentry_progress_audit/MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT.md' as const;
export const MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_EXPORT_DIR =
  'exports/mv_production_ready_reentry_progress_audit' as const;
export const MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH =
  'exports/mv_production_ready_reentry_progress_audit/mv-production-ready-reentry-progress-audit-manifest.json' as const;
export const MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH =
  'exports/mv_production_ready_reentry_progress_audit/mv-production-ready-reentry-progress-audit.json' as const;

export const REENTRY_PROGRESS_AUDIT_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_ready_reentry_progress_audit/' as const;

export const REENTRY_PROGRESS_STATUSES = [
  REENTRY_PROGRESS_STATUS_NOT_STARTED,
  REENTRY_PROGRESS_STATUS_IN_PROGRESS,
  REENTRY_PROGRESS_STATUS_COMPLETE,
] as const;

export type ReentryProgressStatus = (typeof REENTRY_PROGRESS_STATUSES)[number];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type ProgressAuditStatus = 'PASS' | 'FAIL';

export type MvProductionReadyReentryProgressAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type ProgressAuditCheck = {
  check_id: string;
  check_label: string;
  status: ProgressAuditStatus;
};

export type MvProductionReadyReentryProgressAuditArtifact = {
  reentry_progress_audit_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PHASE;
  generated_at: string;
  source_completion_gate_ref: typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH;
  reentry_completion_gate_id: string;
  source_reentry_tracking_ref: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH;
  total_high_priority_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  reentry_progress_percent: number;
  reentry_progress_status: ReentryProgressStatus;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  reentry_completion_ready: boolean;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    reentry_progress_audit_artifact_write_scope: typeof REENTRY_PROGRESS_AUDIT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  reentry_progress_audit_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyReentryProgressAuditManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PHASE;
  generated_at: string;
  reentry_progress_percent: number;
  reentry_progress_status: ReentryProgressStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: ProgressAuditStatus;
  next_stage_ready: ProgressAuditStatus;
  certification_status: typeof PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS | null;
};

export type MvProductionReadyReentryProgressAuditReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PHASE;
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
  source_completion_gate_ref: typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH;
  mv_production_ready_reentry_completion_gate_report_path: typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH;
  mv_production_ready_reentry_progress_audit_export_dir: typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_EXPORT_DIR;
  mv_production_ready_reentry_progress_audit_manifest_path: typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH;
  mv_production_ready_reentry_progress_audit_artifact_path: typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH;
  reentry_progress_audit_id: string;
  source_count: number;
  adapter_count: number;
  total_high_priority_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  reentry_progress_percent: number;
  reentry_progress_status: ReentryProgressStatus;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  reentry_completion_ready: boolean;
  traceability_chain: MvRuntimeTraceability[];
  completion_gate_consumed: ProgressAuditStatus;
  total_high_priority_count_valid: ProgressAuditStatus;
  resolved_high_priority_count_valid: ProgressAuditStatus;
  remaining_high_priority_count_valid: ProgressAuditStatus;
  reentry_progress_percent_valid: ProgressAuditStatus;
  reentry_progress_status_valid: ProgressAuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: ProgressAuditStatus;
  next_stage_ready: ProgressAuditStatus;
  reentry_progress_inconsistent: boolean;
  reentry_progress_status_invalid: boolean;
  completion_gate_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_reentry_progress_audit_ready: ProgressAuditStatus;
  certification_status: typeof PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS | null;
  next_stage_approved: boolean;
  progress_audit_checks: ProgressAuditCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_FAIL_VERDICT;
  issues: MvProductionReadyReentryProgressAuditIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_DIR,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_EXPORT_DIR,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH,
  MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): ProgressAuditStatus {
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

function resolveReentryProgressPercent(
  resolvedHighPriorityCount: number,
  totalHighPriorityCount: number
): number {
  if (totalHighPriorityCount === 0) {
    return resolvedHighPriorityCount === 0 ? 100 : 0;
  }
  return Math.round((resolvedHighPriorityCount / totalHighPriorityCount) * 100);
}

function resolveReentryProgressStatus(reentryProgressPercent: number): ReentryProgressStatus {
  if (reentryProgressPercent === 0) {
    return REENTRY_PROGRESS_STATUS_NOT_STARTED;
  }
  if (reentryProgressPercent === 100) {
    return REENTRY_PROGRESS_STATUS_COMPLETE;
  }
  return REENTRY_PROGRESS_STATUS_IN_PROGRESS;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyReentryProgressAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyReentryProgressAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyReentryProgressAuditReport = {
    report_id: 'mv-production-ready-reentry-progress-audit-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PHASE,
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
    source_completion_gate_ref: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH,
    mv_production_ready_reentry_completion_gate_report_path:
      MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH,
    mv_production_ready_reentry_progress_audit_export_dir: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_EXPORT_DIR,
    mv_production_ready_reentry_progress_audit_manifest_path:
      MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH,
    mv_production_ready_reentry_progress_audit_artifact_path:
      MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH,
    reentry_progress_audit_id: 'mv-production-ready-reentry-progress-audit-v1',
    source_count: 0,
    adapter_count: 0,
    total_high_priority_count: 0,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    reentry_progress_percent: 0,
    reentry_progress_status: REENTRY_PROGRESS_STATUS_NOT_STARTED,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    reentry_completion_ready: false,
    traceability_chain: [],
    completion_gate_consumed: 'FAIL',
    total_high_priority_count_valid: 'FAIL',
    resolved_high_priority_count_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    reentry_progress_percent_valid: 'FAIL',
    reentry_progress_status_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    reentry_progress_inconsistent: true,
    reentry_progress_status_invalid: true,
    completion_gate_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_reentry_progress_audit_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    progress_audit_checks: [],
    final_verdict: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyReentryProgressAudit(
  projectRoot?: string
): MvProductionReadyReentryProgressAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyReentryProgressAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const completionGateReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: ProgressAuditStatus;
    mv_production_ready_reentry_completion_gate_ready: ProgressAuditStatus;
    traceability_preserved: boolean;
    remaining_high_priority_count: number;
    reentry_completion_ready: boolean;
    next_reentry_gate_label: string;
  }>(root, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH);

  const completionGateArtifact = loadJson<MvProductionReadyReentryCompletionGateArtifact>(
    root,
    MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH
  );
  const completionGateManifestPath = path.join(root, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH);

  const reentryTrackingArtifact = loadJson<MvProductionReadyReentryTrackingArtifact>(
    root,
    MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH
  );

  if (
    !completionGateReport ||
    !completionGateArtifact ||
    !fs.existsSync(completionGateManifestPath) ||
    !reentryTrackingArtifact ||
    completionGateReport.final_verdict !== MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PASS_VERDICT ||
    completionGateReport.certification_status !== PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS ||
    completionGateReport.next_stage_ready !== 'PASS' ||
    completionGateReport.mv_production_ready_reentry_completion_gate_ready !== 'PASS'
  ) {
    issues.push({
      code: 'COMPLETION_GATE_MISSING',
      message: `Required ${MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PASS_VERDICT} with ${PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const completionGateConsumed =
    completionGateArtifact.reentry_completion_gate_complete === true &&
    completionGateArtifact.next_stage_ready === true &&
    completionGateArtifact.next_reentry_gate_label === NEXT_REENTRY_GATE_LABEL;

  const totalHighPriorityCount = reentryTrackingArtifact.high_priority_resolution_count;
  const resolvedHighPriorityCount = reentryTrackingArtifact.resolved_high_priority_count;
  const remainingHighPriorityCount = reentryTrackingArtifact.remaining_high_priority_count;
  const reentryProgressPercent = resolveReentryProgressPercent(
    resolvedHighPriorityCount,
    totalHighPriorityCount
  );
  const reentryProgressStatus = resolveReentryProgressStatus(reentryProgressPercent);
  const reentryCompletionReady = completionGateArtifact.reentry_completion_ready;

  const traceabilityChains = completionGateArtifact.traceability_chain;
  const traceabilityPreserved =
    completionGateReport.traceability_preserved === true &&
    completionGateArtifact.traceability_preserved === true &&
    reentryTrackingArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const totalHighPriorityCountValid =
    totalHighPriorityCount > 0 &&
    totalHighPriorityCount === reentryTrackingArtifact.high_priority_resolution_count &&
    resolvedHighPriorityCount + remainingHighPriorityCount === totalHighPriorityCount;

  const resolvedHighPriorityCountValid =
    resolvedHighPriorityCount >= 0 &&
    resolvedHighPriorityCount <= totalHighPriorityCount &&
    resolvedHighPriorityCount === reentryTrackingArtifact.resolved_high_priority_count;

  const remainingHighPriorityCountValid =
    remainingHighPriorityCount >= 0 &&
    remainingHighPriorityCount <= totalHighPriorityCount &&
    remainingHighPriorityCount === completionGateReport.remaining_high_priority_count &&
    remainingHighPriorityCount === completionGateArtifact.remaining_high_priority_count &&
    remainingHighPriorityCount === reentryTrackingArtifact.remaining_high_priority_count;

  const reentryProgressPercentValid =
    reentryProgressPercent ===
      resolveReentryProgressPercent(resolvedHighPriorityCount, totalHighPriorityCount) &&
    reentryProgressPercent === reentryTrackingArtifact.reentry_progress_percent &&
    reentryProgressPercent >= 0 &&
    reentryProgressPercent <= 100;

  const reentryProgressStatusValid =
    reentryProgressStatus === resolveReentryProgressStatus(reentryProgressPercent) &&
    (reentryProgressPercent === 0
      ? reentryProgressStatus === REENTRY_PROGRESS_STATUS_NOT_STARTED
      : reentryProgressPercent === 100
        ? reentryProgressStatus === REENTRY_PROGRESS_STATUS_COMPLETE
        : reentryProgressStatus === REENTRY_PROGRESS_STATUS_IN_PROGRESS);

  const reentryProgressInconsistent =
    !totalHighPriorityCountValid ||
    !resolvedHighPriorityCountValid ||
    !remainingHighPriorityCountValid ||
    !reentryProgressPercentValid ||
    resolvedHighPriorityCount + remainingHighPriorityCount !== totalHighPriorityCount ||
    reentryTrackingArtifact.reentry_progress_percent !== reentryProgressPercent;

  const reentryProgressStatusInvalid = !reentryProgressStatusValid;

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(REENTRY_PROGRESS_AUDIT_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const completionGateMissing = !completionGateConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const reentryProgressAuditComplete =
    completionGateConsumed &&
    totalHighPriorityCountValid &&
    resolvedHighPriorityCountValid &&
    remainingHighPriorityCountValid &&
    reentryProgressPercentValid &&
    reentryProgressStatusValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !reentryProgressInconsistent &&
    !reentryProgressStatusInvalid &&
    reentryCompletionReady === (remainingHighPriorityCount === 0) &&
    (reentryProgressPercent === 0
      ? reentryProgressStatus === REENTRY_PROGRESS_STATUS_NOT_STARTED && reentryCompletionReady === false
      : reentryProgressPercent === 100
        ? reentryProgressStatus === REENTRY_PROGRESS_STATUS_COMPLETE
        : reentryProgressStatus === REENTRY_PROGRESS_STATUS_IN_PROGRESS);

  const nextStageReady = reentryProgressAuditComplete;

  if (completionGateMissing) {
    issues.push({
      code: 'COMPLETION_GATE_MISSING',
      message: 'Reentry completion gate was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (!totalHighPriorityCountValid) {
    issues.push({
      code: 'TOTAL_HIGH_PRIORITY_COUNT_INVALID',
      message: 'Total high priority count is invalid',
      severity: 'error',
      check_id: 'total_high_priority_count_valid',
    });
  }
  if (!resolvedHighPriorityCountValid) {
    issues.push({
      code: 'RESOLVED_HIGH_PRIORITY_COUNT_INVALID',
      message: 'Resolved high priority count is invalid',
      severity: 'error',
      check_id: 'resolved_high_priority_count_valid',
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
  if (!reentryProgressPercentValid) {
    issues.push({
      code: 'REENTRY_PROGRESS_PERCENT_INVALID',
      message: 'Reentry progress percent is invalid',
      severity: 'error',
      check_id: 'reentry_progress_percent_valid',
    });
  }
  if (reentryProgressStatusInvalid) {
    issues.push({
      code: 'REENTRY_PROGRESS_STATUS_INVALID',
      message: 'Reentry progress status is invalid for current percent',
      severity: 'error',
      check_id: 'reentry_progress_status_valid',
    });
  }
  if (reentryProgressInconsistent) {
    issues.push({
      code: 'REENTRY_PROGRESS_INCONSISTENT',
      message: 'Reentry progress counts and percent are inconsistent',
      severity: 'error',
    });
  }

  const progressAuditChecks: ProgressAuditCheck[] = [
    {
      check_id: 'total_high_priority_count_valid',
      check_label: 'Total High Priority Count Valid',
      status: toStatus(totalHighPriorityCountValid),
    },
    {
      check_id: 'resolved_high_priority_count_valid',
      check_label: 'Resolved High Priority Count Valid',
      status: toStatus(resolvedHighPriorityCountValid),
    },
    {
      check_id: 'remaining_high_priority_count_valid',
      check_label: 'Remaining High Priority Count Valid',
      status: toStatus(remainingHighPriorityCountValid),
    },
    {
      check_id: 'reentry_progress_percent_valid',
      check_label: 'Reentry Progress Percent Valid',
      status: toStatus(reentryProgressPercentValid),
    },
    {
      check_id: 'reentry_progress_status_valid',
      check_label: 'Reentry Progress Status Valid',
      status: toStatus(reentryProgressStatusValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyReentryProgressAuditArtifact = {
    reentry_progress_audit_id: 'mv-production-ready-reentry-progress-audit-v1',
    phase: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PHASE,
    generated_at: timestamp,
    source_completion_gate_ref: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH,
    reentry_completion_gate_id: completionGateArtifact.reentry_completion_gate_id,
    source_reentry_tracking_ref: MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
    total_high_priority_count: totalHighPriorityCount,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_progress_percent: reentryProgressPercent,
    reentry_progress_status: reentryProgressStatus,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    reentry_completion_ready: reentryCompletionReady,
    current_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      reentry_progress_audit_artifact_write_scope: REENTRY_PROGRESS_AUDIT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    reentry_progress_audit_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyReentryProgressAuditManifest = {
    manifest_id: 'mv-production-ready-reentry-progress-audit-manifest-v1',
    phase: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PHASE,
    generated_at: timestamp,
    reentry_progress_percent: reentryProgressPercent,
    reentry_progress_status: reentryProgressStatus,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyReentryProgressAuditReport = {
    report_id: 'mv-production-ready-reentry-progress-audit-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PHASE,
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
    source_completion_gate_ref: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH,
    mv_production_ready_reentry_completion_gate_report_path:
      MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH,
    mv_production_ready_reentry_progress_audit_export_dir: MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_EXPORT_DIR,
    mv_production_ready_reentry_progress_audit_manifest_path:
      MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_MANIFEST_PATH,
    mv_production_ready_reentry_progress_audit_artifact_path:
      MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_ARTIFACT_PATH,
    reentry_progress_audit_id: 'mv-production-ready-reentry-progress-audit-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    total_high_priority_count: totalHighPriorityCount,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_progress_percent: reentryProgressPercent,
    reentry_progress_status: reentryProgressStatus,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    reentry_completion_ready: reentryCompletionReady,
    traceability_chain: traceabilityChains,
    completion_gate_consumed: toStatus(completionGateConsumed),
    total_high_priority_count_valid: toStatus(totalHighPriorityCountValid),
    resolved_high_priority_count_valid: toStatus(resolvedHighPriorityCountValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    reentry_progress_percent_valid: toStatus(reentryProgressPercentValid),
    reentry_progress_status_valid: toStatus(reentryProgressStatusValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    reentry_progress_inconsistent: reentryProgressInconsistent,
    reentry_progress_status_invalid: reentryProgressStatusInvalid,
    completion_gate_missing: completionGateMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_reentry_progress_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_READY_REENTRY_PROGRESS_TRACKED_STATUS : null,
    next_stage_approved: pass,
    progress_audit_checks: progressAuditChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_PASS_VERDICT
      : MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_PROGRESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
