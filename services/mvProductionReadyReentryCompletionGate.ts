import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_TRACKING_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH,
  NEXT_REENTRY_GATE_LABEL,
  PRODUCTION_READY_REENTRY_TRACKED_STATUS,
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

export const MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PHASE =
  'PHASE-DIGITAL-STUDIO-024B-MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_V1' as const;
export const PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS =
  'PRODUCTION_READY_REENTRY_COMPLETION_TRACKED' as const;
export const REENTRY_COMPLETION_REASON_HIGH_PRIORITY_ITEMS_REMAINING =
  'HIGH_PRIORITY_ITEMS_REMAINING' as const;
export const REENTRY_COMPLETION_REASON_ALL_HIGH_PRIORITY_RESOLVED =
  'ALL_HIGH_PRIORITY_RESOLVED' as const;
export const NEXT_REQUIRED_ACTION_RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS =
  'RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS' as const;
export const NEXT_REQUIRED_ACTION_PROCEED_TO_PRODUCTION_READY_CERTIFICATION =
  'PROCEED_TO_PRODUCTION_READY_CERTIFICATION' as const;
export const MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_DIR =
  'reports/mv_production_ready_reentry_completion_gate' as const;
export const MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH =
  'reports/mv_production_ready_reentry_completion_gate/mv-production-ready-reentry-completion-gate-report.json' as const;
export const MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MD_PATH =
  'reports/mv_production_ready_reentry_completion_gate/MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE.md' as const;
export const MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_EXPORT_DIR =
  'exports/mv_production_ready_reentry_completion_gate' as const;
export const MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH =
  'exports/mv_production_ready_reentry_completion_gate/mv-production-ready-reentry-completion-gate-manifest.json' as const;
export const MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH =
  'exports/mv_production_ready_reentry_completion_gate/mv-production-ready-reentry-completion-gate.json' as const;

export const REENTRY_COMPLETION_GATE_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_ready_reentry_completion_gate/' as const;

export const REENTRY_COMPLETION_REASONS = [
  REENTRY_COMPLETION_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  REENTRY_COMPLETION_REASON_ALL_HIGH_PRIORITY_RESOLVED,
] as const;

export const NEXT_REQUIRED_ACTIONS = [
  NEXT_REQUIRED_ACTION_RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS,
  NEXT_REQUIRED_ACTION_PROCEED_TO_PRODUCTION_READY_CERTIFICATION,
] as const;

export type ReentryCompletionReason = (typeof REENTRY_COMPLETION_REASONS)[number];
export type NextRequiredAction = (typeof NEXT_REQUIRED_ACTIONS)[number];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CompletionGateStatus = 'PASS' | 'FAIL';

export type MvProductionReadyReentryCompletionGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type CompletionGateCheck = {
  check_id: string;
  check_label: string;
  status: CompletionGateStatus;
};

export type MvProductionReadyReentryCompletionGateArtifact = {
  reentry_completion_gate_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PHASE;
  generated_at: string;
  source_reentry_tracking_ref: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH;
  reentry_tracking_id: string;
  remaining_high_priority_count: number;
  reentry_completion_ready: boolean;
  reentry_completion_reason: ReentryCompletionReason;
  next_required_action: NextRequiredAction;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  production_ready_path_clear: boolean;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    reentry_completion_gate_artifact_write_scope: typeof REENTRY_COMPLETION_GATE_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  reentry_completion_gate_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyReentryCompletionGateManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PHASE;
  generated_at: string;
  reentry_completion_ready: boolean;
  reentry_completion_reason: ReentryCompletionReason;
  next_required_action: NextRequiredAction;
  traceability_preserved: boolean;
  safe_create_policy_verified: CompletionGateStatus;
  next_stage_ready: CompletionGateStatus;
  certification_status: typeof PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS | null;
};

export type MvProductionReadyReentryCompletionGateReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PHASE;
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
  source_reentry_tracking_ref: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH;
  mv_production_ready_reentry_tracking_report_path: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH;
  mv_production_ready_reentry_completion_gate_export_dir: typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_EXPORT_DIR;
  mv_production_ready_reentry_completion_gate_manifest_path: typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH;
  mv_production_ready_reentry_completion_gate_artifact_path: typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH;
  reentry_completion_gate_id: string;
  source_count: number;
  adapter_count: number;
  remaining_high_priority_count: number;
  reentry_completion_ready: boolean;
  reentry_completion_reason: ReentryCompletionReason;
  next_required_action: NextRequiredAction;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  production_ready_path_clear: boolean;
  traceability_chain: MvRuntimeTraceability[];
  reentry_tracking_consumed: CompletionGateStatus;
  reentry_completion_ready_valid: CompletionGateStatus;
  reentry_completion_reason_valid: CompletionGateStatus;
  next_required_action_valid: CompletionGateStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: CompletionGateStatus;
  next_stage_ready: CompletionGateStatus;
  reentry_completion_premature: boolean;
  next_required_action_missing: boolean;
  reentry_tracking_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_reentry_completion_gate_ready: CompletionGateStatus;
  certification_status: typeof PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS | null;
  next_stage_approved: boolean;
  completion_gate_checks: CompletionGateCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_FAIL_VERDICT;
  issues: MvProductionReadyReentryCompletionGateIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_DIR,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_EXPORT_DIR,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH,
  MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): CompletionGateStatus {
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

function resolveReentryCompletionReady(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount === 0;
}

function resolveReentryCompletionReason(remainingHighPriorityCount: number): ReentryCompletionReason {
  return remainingHighPriorityCount > 0
    ? REENTRY_COMPLETION_REASON_HIGH_PRIORITY_ITEMS_REMAINING
    : REENTRY_COMPLETION_REASON_ALL_HIGH_PRIORITY_RESOLVED;
}

function resolveNextRequiredAction(remainingHighPriorityCount: number): NextRequiredAction {
  return remainingHighPriorityCount > 0
    ? NEXT_REQUIRED_ACTION_RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS
    : NEXT_REQUIRED_ACTION_PROCEED_TO_PRODUCTION_READY_CERTIFICATION;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyReentryCompletionGateIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyReentryCompletionGateReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyReentryCompletionGateReport = {
    report_id: 'mv-production-ready-reentry-completion-gate-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PHASE,
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
    source_reentry_tracking_ref: MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
    mv_production_ready_reentry_tracking_report_path: MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH,
    mv_production_ready_reentry_completion_gate_export_dir: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_EXPORT_DIR,
    mv_production_ready_reentry_completion_gate_manifest_path:
      MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH,
    mv_production_ready_reentry_completion_gate_artifact_path:
      MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH,
    reentry_completion_gate_id: 'mv-production-ready-reentry-completion-gate-v1',
    source_count: 0,
    adapter_count: 0,
    remaining_high_priority_count: 0,
    reentry_completion_ready: false,
    reentry_completion_reason: REENTRY_COMPLETION_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
    next_required_action: NEXT_REQUIRED_ACTION_RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    production_ready_path_clear: false,
    traceability_chain: [],
    reentry_tracking_consumed: 'FAIL',
    reentry_completion_ready_valid: 'FAIL',
    reentry_completion_reason_valid: 'FAIL',
    next_required_action_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    reentry_completion_premature: true,
    next_required_action_missing: true,
    reentry_tracking_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_reentry_completion_gate_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    completion_gate_checks: [],
    final_verdict: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyReentryCompletionGate(
  projectRoot?: string
): MvProductionReadyReentryCompletionGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyReentryCompletionGateIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const reentryTrackingReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: CompletionGateStatus;
    mv_production_ready_reentry_tracking_ready: CompletionGateStatus;
    traceability_preserved: boolean;
    remaining_high_priority_count: number;
    production_ready_path_clear: boolean;
    next_reentry_gate_label: string;
    gate_reentry_required: boolean;
  }>(root, MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH);

  const reentryTrackingArtifact = loadJson<MvProductionReadyReentryTrackingArtifact>(
    root,
    MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH
  );
  const reentryTrackingManifestPath = path.join(root, MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH);

  if (
    !reentryTrackingReport ||
    !reentryTrackingArtifact ||
    !fs.existsSync(reentryTrackingManifestPath) ||
    reentryTrackingReport.final_verdict !== MV_PRODUCTION_READY_REENTRY_TRACKING_PASS_VERDICT ||
    reentryTrackingReport.certification_status !== PRODUCTION_READY_REENTRY_TRACKED_STATUS ||
    reentryTrackingReport.next_stage_ready !== 'PASS' ||
    reentryTrackingReport.mv_production_ready_reentry_tracking_ready !== 'PASS'
  ) {
    issues.push({
      code: 'REENTRY_TRACKING_MISSING',
      message: `Required ${MV_PRODUCTION_READY_REENTRY_TRACKING_PASS_VERDICT} with ${PRODUCTION_READY_REENTRY_TRACKED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const reentryTrackingConsumed =
    reentryTrackingArtifact.reentry_tracking_complete === true &&
    reentryTrackingArtifact.next_stage_ready === true &&
    reentryTrackingArtifact.next_reentry_gate_label === NEXT_REENTRY_GATE_LABEL;

  const remainingHighPriorityCount = reentryTrackingArtifact.remaining_high_priority_count;
  const reentryCompletionReady = resolveReentryCompletionReady(remainingHighPriorityCount);
  const reentryCompletionReason = resolveReentryCompletionReason(remainingHighPriorityCount);
  const nextRequiredAction = resolveNextRequiredAction(remainingHighPriorityCount);
  const productionReadyPathClear = reentryTrackingArtifact.production_ready_path_clear;

  const traceabilityChains = reentryTrackingArtifact.traceability_chain;
  const traceabilityPreserved =
    reentryTrackingReport.traceability_preserved === true &&
    reentryTrackingArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const reentryCompletionReadyValid =
    reentryCompletionReady === resolveReentryCompletionReady(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0 ? reentryCompletionReady === false : reentryCompletionReady === true) &&
    reentryCompletionReady === productionReadyPathClear;

  const reentryCompletionReasonValid =
    reentryCompletionReason === resolveReentryCompletionReason(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0
      ? reentryCompletionReason === REENTRY_COMPLETION_REASON_HIGH_PRIORITY_ITEMS_REMAINING
      : reentryCompletionReason === REENTRY_COMPLETION_REASON_ALL_HIGH_PRIORITY_RESOLVED);

  const nextRequiredActionValid =
    nextRequiredAction === resolveNextRequiredAction(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0
      ? nextRequiredAction === NEXT_REQUIRED_ACTION_RESOLVE_REMAINING_HIGH_PRIORITY_ITEMS
      : nextRequiredAction === NEXT_REQUIRED_ACTION_PROCEED_TO_PRODUCTION_READY_CERTIFICATION);

  const reentryCompletionPremature =
    (remainingHighPriorityCount > 0 && reentryCompletionReady === true) ||
    (remainingHighPriorityCount === 0 && reentryCompletionReady === false && productionReadyPathClear === true);

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(REENTRY_COMPLETION_GATE_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const nextRequiredActionMissing = !nextRequiredActionValid;
  const reentryTrackingMissing = !reentryTrackingConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const reentryCompletionGateComplete =
    reentryTrackingConsumed &&
    reentryCompletionReadyValid &&
    reentryCompletionReasonValid &&
    nextRequiredActionValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !reentryCompletionPremature &&
    !nextRequiredActionMissing &&
    remainingHighPriorityCount === reentryTrackingReport.remaining_high_priority_count &&
    (remainingHighPriorityCount > 0
      ? reentryCompletionReady === false &&
        reentryTrackingReport.gate_reentry_required === true &&
        reentryTrackingReport.next_reentry_gate_label === NEXT_REENTRY_GATE_LABEL
      : reentryCompletionReady === true);

  const nextStageReady = reentryCompletionGateComplete;

  if (reentryTrackingMissing) {
    issues.push({
      code: 'REENTRY_TRACKING_MISSING',
      message: 'Reentry tracking was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (!reentryCompletionReadyValid) {
    issues.push({
      code: 'REENTRY_COMPLETION_READY_INVALID',
      message: 'Reentry completion ready flag is invalid',
      severity: 'error',
      check_id: 'reentry_completion_ready_valid',
    });
  }
  if (!reentryCompletionReasonValid) {
    issues.push({
      code: 'REENTRY_COMPLETION_REASON_INVALID',
      message: 'Reentry completion reason is invalid',
      severity: 'error',
      check_id: 'reentry_completion_reason_valid',
    });
  }
  if (nextRequiredActionMissing) {
    issues.push({
      code: 'NEXT_REQUIRED_ACTION_MISSING',
      message: 'Next required action is missing or invalid',
      severity: 'error',
      check_id: 'next_required_action_valid',
    });
  }
  if (reentryCompletionPremature) {
    issues.push({
      code: 'REENTRY_COMPLETION_PREMATURE',
      message: 'Reentry completion would be premature before high priority resolution',
      severity: 'error',
    });
  }

  const completionGateChecks: CompletionGateCheck[] = [
    {
      check_id: 'reentry_completion_ready_valid',
      check_label: 'Reentry Completion Ready Valid',
      status: toStatus(reentryCompletionReadyValid),
    },
    {
      check_id: 'reentry_completion_reason_valid',
      check_label: 'Reentry Completion Reason Valid',
      status: toStatus(reentryCompletionReasonValid),
    },
    {
      check_id: 'next_required_action_valid',
      check_label: 'Next Required Action Valid',
      status: toStatus(nextRequiredActionValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyReentryCompletionGateArtifact = {
    reentry_completion_gate_id: 'mv-production-ready-reentry-completion-gate-v1',
    phase: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PHASE,
    generated_at: timestamp,
    source_reentry_tracking_ref: MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
    reentry_tracking_id: reentryTrackingArtifact.reentry_tracking_id,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_completion_ready: reentryCompletionReady,
    reentry_completion_reason: reentryCompletionReason,
    next_required_action: nextRequiredAction,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    production_ready_path_clear: productionReadyPathClear,
    current_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      reentry_completion_gate_artifact_write_scope: REENTRY_COMPLETION_GATE_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    reentry_completion_gate_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyReentryCompletionGateManifest = {
    manifest_id: 'mv-production-ready-reentry-completion-gate-manifest-v1',
    phase: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PHASE,
    generated_at: timestamp,
    reentry_completion_ready: reentryCompletionReady,
    reentry_completion_reason: reentryCompletionReason,
    next_required_action: nextRequiredAction,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyReentryCompletionGateReport = {
    report_id: 'mv-production-ready-reentry-completion-gate-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PHASE,
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
    source_reentry_tracking_ref: MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
    mv_production_ready_reentry_tracking_report_path: MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH,
    mv_production_ready_reentry_completion_gate_export_dir: MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_EXPORT_DIR,
    mv_production_ready_reentry_completion_gate_manifest_path:
      MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_MANIFEST_PATH,
    mv_production_ready_reentry_completion_gate_artifact_path:
      MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_ARTIFACT_PATH,
    reentry_completion_gate_id: 'mv-production-ready-reentry-completion-gate-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_completion_ready: reentryCompletionReady,
    reentry_completion_reason: reentryCompletionReason,
    next_required_action: nextRequiredAction,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    production_ready_path_clear: productionReadyPathClear,
    traceability_chain: traceabilityChains,
    reentry_tracking_consumed: toStatus(reentryTrackingConsumed),
    reentry_completion_ready_valid: toStatus(reentryCompletionReadyValid),
    reentry_completion_reason_valid: toStatus(reentryCompletionReasonValid),
    next_required_action_valid: toStatus(nextRequiredActionValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    reentry_completion_premature: reentryCompletionPremature,
    next_required_action_missing: nextRequiredActionMissing,
    reentry_tracking_missing: reentryTrackingMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_reentry_completion_gate_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_READY_REENTRY_COMPLETION_TRACKED_STATUS : null,
    next_stage_approved: pass,
    completion_gate_checks: completionGateChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_PASS_VERDICT
      : MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_COMPLETION_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
