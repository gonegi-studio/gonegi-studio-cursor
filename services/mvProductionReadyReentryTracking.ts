import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_HIGH_PRIORITY_BLOCKER_CODES } from './mvHighPriorityResolutionAudit.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  type GateReentryCondition,
  GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT,
} from './mvProductionReadyGateReentryHardening.js';
import {
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PASS_VERDICT,
  PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH,
  type MvProductionReadyCertificationBlockedStateArtifact,
} from './mvProductionReadyCertificationBlockedState.js';
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

export const MV_PRODUCTION_READY_REENTRY_TRACKING_PHASE =
  'PHASE-DIGITAL-STUDIO-024A-MV_PRODUCTION_READY_REENTRY_TRACKING_V2' as const;
export const MV_PRODUCTION_READY_REENTRY_TRACKING_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_REENTRY_TRACKING_V2' as const;
export const MV_PRODUCTION_READY_REENTRY_TRACKING_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_REENTRY_TRACKING_V2' as const;
export const PRODUCTION_READY_REENTRY_TRACKED_STATUS = 'PRODUCTION_READY_REENTRY_TRACKED' as const;
export const NEXT_REENTRY_GATE_LABEL = 'DS_023_REENTRY' as const;
export const MV_PRODUCTION_READY_REENTRY_TRACKING_DIR =
  'reports/mv_production_ready_reentry_tracking' as const;
export const MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH =
  'reports/mv_production_ready_reentry_tracking/mv-production-ready-reentry-tracking-report.json' as const;
export const MV_PRODUCTION_READY_REENTRY_TRACKING_MD_PATH =
  'reports/mv_production_ready_reentry_tracking/MV_PRODUCTION_READY_REENTRY_TRACKING.md' as const;
export const MV_PRODUCTION_READY_REENTRY_TRACKING_EXPORT_DIR =
  'exports/mv_production_ready_reentry_tracking' as const;
export const MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH =
  'exports/mv_production_ready_reentry_tracking/mv-production-ready-reentry-tracking-manifest.json' as const;
export const MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH =
  'exports/mv_production_ready_reentry_tracking/mv-production-ready-reentry-tracking.json' as const;

export const REENTRY_TRACKING_ARTIFACT_WRITE_SCOPE = 'exports/mv_production_ready_reentry_tracking/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type ReentryTrackingStatus = 'PASS' | 'FAIL';

export type MvProductionReadyReentryTrackingIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type ReentryTrackingCheck = {
  check_id: string;
  check_label: string;
  status: ReentryTrackingStatus;
};

export type MvProductionReadyReentryTrackingArtifact = {
  reentry_tracking_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_PHASE;
  generated_at: string;
  source_blocked_state_ref: typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH;
  blocked_state_id: string;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  high_priority_resolution_count: number;
  reentry_progress_percent: number;
  production_ready_path_clear: boolean;
  required_reentry_condition: GateReentryCondition;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  gate_reentry_required: boolean;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    reentry_tracking_artifact_write_scope: typeof REENTRY_TRACKING_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  reentry_tracking_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyReentryTrackingManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_PHASE;
  generated_at: string;
  reentry_progress_percent: number;
  production_ready_path_clear: boolean;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  traceability_preserved: boolean;
  safe_create_policy_verified: ReentryTrackingStatus;
  next_stage_ready: ReentryTrackingStatus;
  certification_status: typeof PRODUCTION_READY_REENTRY_TRACKED_STATUS | null;
};

export type MvProductionReadyReentryTrackingReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_PHASE;
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
  source_blocked_state_ref: typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH;
  mv_production_ready_certification_blocked_state_report_path: typeof MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH;
  mv_production_ready_reentry_tracking_export_dir: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_EXPORT_DIR;
  mv_production_ready_reentry_tracking_manifest_path: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH;
  mv_production_ready_reentry_tracking_artifact_path: typeof MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH;
  reentry_tracking_id: string;
  source_count: number;
  adapter_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  high_priority_resolution_count: number;
  reentry_progress_percent: number;
  production_ready_path_clear: boolean;
  required_reentry_condition: GateReentryCondition;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  gate_reentry_required: boolean;
  traceability_chain: MvRuntimeTraceability[];
  blocked_state_consumed: ReentryTrackingStatus;
  resolved_high_priority_count_valid: ReentryTrackingStatus;
  remaining_high_priority_count_valid: ReentryTrackingStatus;
  reentry_progress_percent_valid: ReentryTrackingStatus;
  production_ready_path_clear_valid: ReentryTrackingStatus;
  required_reentry_condition_valid: ReentryTrackingStatus;
  next_reentry_gate_label_valid: ReentryTrackingStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: ReentryTrackingStatus;
  next_stage_ready: ReentryTrackingStatus;
  reentry_progress_invalid: boolean;
  production_ready_path_not_clear: boolean;
  required_reentry_condition_missing: boolean;
  next_reentry_gate_label_missing: boolean;
  blocked_state_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_reentry_tracking_ready: ReentryTrackingStatus;
  certification_status: typeof PRODUCTION_READY_REENTRY_TRACKED_STATUS | null;
  next_stage_approved: boolean;
  reentry_tracking_checks: ReentryTrackingCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_REENTRY_TRACKING_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_REENTRY_TRACKING_FAIL_VERDICT;
  issues: MvProductionReadyReentryTrackingIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_REENTRY_TRACKING_DIR,
  MV_PRODUCTION_READY_REENTRY_TRACKING_EXPORT_DIR,
  MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH,
  MV_PRODUCTION_READY_REENTRY_TRACKING_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): ReentryTrackingStatus {
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

function resolveProductionReadyPathClear(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount === 0;
}

function resolveReentryProgressPercent(
  resolvedHighPriorityCount: number,
  highPriorityResolutionCount: number
): number {
  if (highPriorityResolutionCount === 0) {
    return resolvedHighPriorityCount === 0 ? 100 : 0;
  }
  return Math.round((resolvedHighPriorityCount / highPriorityResolutionCount) * 100);
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyReentryTrackingIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyReentryTrackingReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyReentryTrackingReport = {
    report_id: 'mv-production-ready-reentry-tracking-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_TRACKING_PHASE,
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
    source_blocked_state_ref: MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH,
    mv_production_ready_certification_blocked_state_report_path:
      MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH,
    mv_production_ready_reentry_tracking_export_dir: MV_PRODUCTION_READY_REENTRY_TRACKING_EXPORT_DIR,
    mv_production_ready_reentry_tracking_manifest_path: MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH,
    mv_production_ready_reentry_tracking_artifact_path: MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
    reentry_tracking_id: 'mv-production-ready-reentry-tracking-v1',
    source_count: 0,
    adapter_count: 0,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    high_priority_resolution_count: 0,
    reentry_progress_percent: 0,
    production_ready_path_clear: false,
    required_reentry_condition: resolveRequiredReentryCondition(),
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    gate_reentry_required: false,
    traceability_chain: [],
    blocked_state_consumed: 'FAIL',
    resolved_high_priority_count_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    reentry_progress_percent_valid: 'FAIL',
    production_ready_path_clear_valid: 'FAIL',
    required_reentry_condition_valid: 'FAIL',
    next_reentry_gate_label_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    reentry_progress_invalid: true,
    production_ready_path_not_clear: true,
    required_reentry_condition_missing: true,
    next_reentry_gate_label_missing: true,
    blocked_state_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_reentry_tracking_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    reentry_tracking_checks: [],
    final_verdict: MV_PRODUCTION_READY_REENTRY_TRACKING_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_TRACKING_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyReentryTracking(
  projectRoot?: string
): MvProductionReadyReentryTrackingReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyReentryTrackingIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const blockedStateReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: ReentryTrackingStatus;
    mv_production_ready_certification_blocked_state_ready: ReentryTrackingStatus;
    traceability_preserved: boolean;
    gate_reentry_required: boolean;
    remaining_high_priority_count: number;
    required_reentry_condition: GateReentryCondition;
    production_ready_certification_allowed: boolean;
  }>(root, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH);

  const blockedStateArtifact = loadJson<MvProductionReadyCertificationBlockedStateArtifact>(
    root,
    MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH
  );
  const blockedStateManifestPath = path.join(root, MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_MANIFEST_PATH);

  if (
    !blockedStateReport ||
    !blockedStateArtifact ||
    !fs.existsSync(blockedStateManifestPath) ||
    blockedStateReport.final_verdict !== MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PASS_VERDICT ||
    blockedStateReport.certification_status !== PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS ||
    blockedStateReport.next_stage_ready !== 'PASS' ||
    blockedStateReport.mv_production_ready_certification_blocked_state_ready !== 'PASS'
  ) {
    issues.push({
      code: 'BLOCKED_STATE_MISSING',
      message: `Required ${MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_PASS_VERDICT} with ${PRODUCTION_READY_CERTIFICATION_BLOCKED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const blockedStateConsumed =
    blockedStateArtifact.blocked_state_complete === true &&
    blockedStateArtifact.next_stage_ready === true &&
    blockedStateArtifact.production_ready_certification_allowed === false;

  const remainingHighPriorityCount = blockedStateArtifact.remaining_high_priority_count;
  const highPriorityResolutionCount = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.length;
  const resolvedHighPriorityCount = highPriorityResolutionCount - remainingHighPriorityCount;
  const productionReadyPathClear = resolveProductionReadyPathClear(remainingHighPriorityCount);
  const reentryProgressPercent = resolveReentryProgressPercent(
    resolvedHighPriorityCount,
    highPriorityResolutionCount
  );
  const requiredReentryCondition = resolveRequiredReentryCondition();
  const nextReentryGateLabel = NEXT_REENTRY_GATE_LABEL;
  const gateReentryRequired = blockedStateArtifact.gate_reentry_required;

  const traceabilityChains = blockedStateArtifact.traceability_chain;
  const traceabilityPreserved =
    blockedStateReport.traceability_preserved === true &&
    blockedStateArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const resolvedHighPriorityCountValid =
    resolvedHighPriorityCount >= 0 &&
    resolvedHighPriorityCount + remainingHighPriorityCount === highPriorityResolutionCount &&
    resolvedHighPriorityCount <= highPriorityResolutionCount;

  const remainingHighPriorityCountValid =
    remainingHighPriorityCount === blockedStateReport.remaining_high_priority_count &&
    remainingHighPriorityCount >= 0 &&
    remainingHighPriorityCount <= highPriorityResolutionCount;

  const reentryProgressPercentValid =
    reentryProgressPercent ===
      resolveReentryProgressPercent(resolvedHighPriorityCount, highPriorityResolutionCount) &&
    reentryProgressPercent >= 0 &&
    reentryProgressPercent <= 100;

  const productionReadyPathClearValid =
    productionReadyPathClear === resolveProductionReadyPathClear(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0 ? productionReadyPathClear === false : productionReadyPathClear === true) &&
    productionReadyPathClear === blockedStateReport.production_ready_certification_allowed;

  const requiredReentryConditionValid =
    requiredReentryCondition.remaining_high_priority_count ===
      GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT &&
    requiredReentryCondition.high_priority_resolution_target_met === true &&
    requiredReentryCondition.production_ready_gate_eligible === true &&
    blockedStateArtifact.required_reentry_condition.remaining_high_priority_count ===
      requiredReentryCondition.remaining_high_priority_count &&
    blockedStateArtifact.required_reentry_condition.high_priority_resolution_target_met ===
      requiredReentryCondition.high_priority_resolution_target_met &&
    blockedStateArtifact.required_reentry_condition.production_ready_gate_eligible ===
      requiredReentryCondition.production_ready_gate_eligible;

  const nextReentryGateLabelValid = nextReentryGateLabel === NEXT_REENTRY_GATE_LABEL;

  const reentryProgressInvalid = !reentryProgressPercentValid;
  const productionReadyPathNotClear =
    productionReadyPathClear !== (remainingHighPriorityCount === 0);
  const requiredReentryConditionMissing = !requiredReentryConditionValid;
  const nextReentryGateLabelMissing = !nextReentryGateLabelValid;

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(REENTRY_TRACKING_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const blockedStateMissing = !blockedStateConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const reentryTrackingComplete =
    blockedStateConsumed &&
    resolvedHighPriorityCountValid &&
    remainingHighPriorityCountValid &&
    reentryProgressPercentValid &&
    productionReadyPathClearValid &&
    requiredReentryConditionValid &&
    nextReentryGateLabelValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !reentryProgressInvalid &&
    !productionReadyPathNotClear &&
    !requiredReentryConditionMissing &&
    !nextReentryGateLabelMissing &&
    (remainingHighPriorityCount > 0
      ? productionReadyPathClear === false && gateReentryRequired === true
      : productionReadyPathClear === true && gateReentryRequired === false);

  const nextStageReady = reentryTrackingComplete;

  if (blockedStateMissing) {
    issues.push({
      code: 'BLOCKED_STATE_MISSING',
      message: 'Certification blocked state was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
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
  if (reentryProgressInvalid) {
    issues.push({
      code: 'REENTRY_PROGRESS_INVALID',
      message: 'Reentry progress percent is invalid',
      severity: 'error',
      check_id: 'reentry_progress_percent_valid',
    });
  }
  if (productionReadyPathNotClear) {
    issues.push({
      code: 'PRODUCTION_READY_PATH_NOT_CLEAR',
      message: 'Production ready path clear flag is inconsistent with remaining high priority count',
      severity: 'error',
      check_id: 'production_ready_path_clear_valid',
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
  if (nextReentryGateLabelMissing) {
    issues.push({
      code: 'NEXT_REENTRY_GATE_LABEL_MISSING',
      message: 'Next reentry gate label is missing or invalid',
      severity: 'error',
      check_id: 'next_reentry_gate_label_valid',
    });
  }

  const reentryTrackingChecks: ReentryTrackingCheck[] = [
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
      check_id: 'production_ready_path_clear_valid',
      check_label: 'Production Ready Path Clear Valid',
      status: toStatus(productionReadyPathClearValid),
    },
    {
      check_id: 'required_reentry_condition_valid',
      check_label: 'Required Reentry Condition Valid',
      status: toStatus(requiredReentryConditionValid),
    },
    {
      check_id: 'next_reentry_gate_label_valid',
      check_label: 'Next Reentry Gate Label Valid',
      status: toStatus(nextReentryGateLabelValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyReentryTrackingArtifact = {
    reentry_tracking_id: 'mv-production-ready-reentry-tracking-v1',
    phase: MV_PRODUCTION_READY_REENTRY_TRACKING_PHASE,
    generated_at: timestamp,
    source_blocked_state_ref: MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH,
    blocked_state_id: blockedStateArtifact.blocked_state_id,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    high_priority_resolution_count: highPriorityResolutionCount,
    reentry_progress_percent: reentryProgressPercent,
    production_ready_path_clear: productionReadyPathClear,
    required_reentry_condition: requiredReentryCondition,
    next_reentry_gate_label: nextReentryGateLabel,
    gate_reentry_required: gateReentryRequired,
    current_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      reentry_tracking_artifact_write_scope: REENTRY_TRACKING_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    reentry_tracking_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyReentryTrackingManifest = {
    manifest_id: 'mv-production-ready-reentry-tracking-manifest-v1',
    phase: MV_PRODUCTION_READY_REENTRY_TRACKING_PHASE,
    generated_at: timestamp,
    reentry_progress_percent: reentryProgressPercent,
    production_ready_path_clear: productionReadyPathClear,
    next_reentry_gate_label: nextReentryGateLabel,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? PRODUCTION_READY_REENTRY_TRACKED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_TRACKING_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyReentryTrackingReport = {
    report_id: 'mv-production-ready-reentry-tracking-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_TRACKING_PHASE,
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
    source_blocked_state_ref: MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_ARTIFACT_PATH,
    mv_production_ready_certification_blocked_state_report_path:
      MV_PRODUCTION_READY_CERTIFICATION_BLOCKED_STATE_REPORT_PATH,
    mv_production_ready_reentry_tracking_export_dir: MV_PRODUCTION_READY_REENTRY_TRACKING_EXPORT_DIR,
    mv_production_ready_reentry_tracking_manifest_path: MV_PRODUCTION_READY_REENTRY_TRACKING_MANIFEST_PATH,
    mv_production_ready_reentry_tracking_artifact_path: MV_PRODUCTION_READY_REENTRY_TRACKING_ARTIFACT_PATH,
    reentry_tracking_id: 'mv-production-ready-reentry-tracking-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    high_priority_resolution_count: highPriorityResolutionCount,
    reentry_progress_percent: reentryProgressPercent,
    production_ready_path_clear: productionReadyPathClear,
    required_reentry_condition: requiredReentryCondition,
    next_reentry_gate_label: nextReentryGateLabel,
    gate_reentry_required: gateReentryRequired,
    traceability_chain: traceabilityChains,
    blocked_state_consumed: toStatus(blockedStateConsumed),
    resolved_high_priority_count_valid: toStatus(resolvedHighPriorityCountValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    reentry_progress_percent_valid: toStatus(reentryProgressPercentValid),
    production_ready_path_clear_valid: toStatus(productionReadyPathClearValid),
    required_reentry_condition_valid: toStatus(requiredReentryConditionValid),
    next_reentry_gate_label_valid: toStatus(nextReentryGateLabelValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    reentry_progress_invalid: reentryProgressInvalid,
    production_ready_path_not_clear: productionReadyPathNotClear,
    required_reentry_condition_missing: requiredReentryConditionMissing,
    next_reentry_gate_label_missing: nextReentryGateLabelMissing,
    blocked_state_missing: blockedStateMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_reentry_tracking_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_READY_REENTRY_TRACKED_STATUS : null,
    next_stage_approved: pass,
    reentry_tracking_checks: reentryTrackingChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_REENTRY_TRACKING_PASS_VERDICT
      : MV_PRODUCTION_READY_REENTRY_TRACKING_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_TRACKING_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_TRACKING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
