import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES,
  type HighPriorityBlockerCode,
} from './mvHighPriorityResolutionAudit.js';
import {
  EXPECTED_HIGH_PRIORITY_ITEM_IDS,
  type ResolutionEvidenceRefByItem,
} from './mvHighPriorityItemResolutionExecution.js';
import {
  HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PASS_VERDICT,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH,
  RESOLUTION_PROGRESS_STATUS_RESOLVED,
  type MvHighPriorityItemResolutionProgressAuditArtifact,
  type ResolutionProgressStatusByItem,
} from './mvHighPriorityItemResolutionProgressAudit.js';
import { NEXT_REENTRY_GATE_LABEL } from './mvProductionReadyReentryTracking.js';
import {
  PRODUCTION_READINESS_TIER_PRODUCTION_READY,
  PRODUCTION_READINESS_TIER_TEST_READY,
} from './mvProductionReadinessGate.js';
import type { MvRuntimeTraceability } from './mvProductionRuntimeEngine.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PHASE =
  'PHASE-DIGITAL-STUDIO-027-MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_V1' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PASS_VERDICT =
  'PASS_MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_V1' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_FAIL_VERDICT =
  'FAIL_MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_V1' as const;
export const HIGH_PRIORITY_RESOLUTION_COMPLETION_AUDITED_STATUS =
  'HIGH_PRIORITY_RESOLUTION_COMPLETION_AUDITED' as const;
export const COMPLETION_BLOCK_REASON_HIGH_PRIORITY_ITEMS_REMAINING =
  'HIGH_PRIORITY_ITEMS_REMAINING' as const;
export const COMPLETION_BLOCK_REASON_ALL_HIGH_PRIORITY_RESOLVED = 'ALL_HIGH_PRIORITY_RESOLVED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_023_REENTRY' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_DIR =
  'reports/mv_high_priority_item_resolution_completion_audit' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_REPORT_PATH =
  'reports/mv_high_priority_item_resolution_completion_audit/mv-high-priority-item-resolution-completion-audit-report.json' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MD_PATH =
  'reports/mv_high_priority_item_resolution_completion_audit/MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT.md' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_EXPORT_DIR =
  'exports/mv_high_priority_item_resolution_completion_audit' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MANIFEST_PATH =
  'exports/mv_high_priority_item_resolution_completion_audit/mv-high-priority-item-resolution-completion-audit-manifest.json' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH =
  'exports/mv_high_priority_item_resolution_completion_audit/mv-high-priority-item-resolution-completion-audit.json' as const;

export const RESOLUTION_COMPLETION_AUDIT_ARTIFACT_WRITE_SCOPE =
  'exports/mv_high_priority_item_resolution_completion_audit/' as const;

export const COMPLETION_BLOCK_REASONS = [
  COMPLETION_BLOCK_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
  COMPLETION_BLOCK_REASON_ALL_HIGH_PRIORITY_RESOLVED,
] as const;

export type CompletionBlockReason = (typeof COMPLETION_BLOCK_REASONS)[number];

export const BLOCKER_CODE_TO_ITEM_ID: Record<HighPriorityBlockerCode, (typeof EXPECTED_HIGH_PRIORITY_ITEM_IDS)[number]> = {
  DATASET_REFS_EMPTY: 'dataset_refs_empty_story_mv_generation_plan_v1',
  PRODUCTION_MODE_BLOCKED: 'production_mode_blocked',
  REAL_GENERATION_BLOCKED: 'real_generation_blocked',
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CompletionAuditStatus = 'PASS' | 'FAIL';

export type MvHighPriorityItemResolutionCompletionAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type CompletionAuditCheck = {
  check_id: string;
  check_label: string;
  status: CompletionAuditStatus;
};

export type MvHighPriorityItemResolutionCompletionAuditArtifact = {
  resolution_completion_audit_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PHASE;
  generated_at: string;
  source_progress_audit_ref: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH;
  resolution_progress_audit_id: string;
  resolved_item_ids: string[];
  unresolved_item_ids: string[];
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  resolution_completion_percent: number;
  resolution_evidence_ref: ResolutionEvidenceRefByItem;
  completion_block_reason: CompletionBlockReason;
  reentry_ready: boolean;
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
    resolution_completion_audit_artifact_write_scope: typeof RESOLUTION_COMPLETION_AUDIT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  resolution_completion_audit_complete: boolean;
  next_stage_ready: boolean;
};

export type MvHighPriorityItemResolutionCompletionAuditManifest = {
  manifest_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PHASE;
  generated_at: string;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  resolution_completion_percent: number;
  reentry_ready: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: CompletionAuditStatus;
  next_stage_ready: CompletionAuditStatus;
  certification_status: typeof HIGH_PRIORITY_RESOLUTION_COMPLETION_AUDITED_STATUS | null;
};

export type MvHighPriorityItemResolutionCompletionAuditReport = {
  report_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PHASE;
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
  source_progress_audit_ref: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH;
  mv_high_priority_item_resolution_progress_audit_report_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH;
  mv_high_priority_item_resolution_completion_audit_export_dir: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_EXPORT_DIR;
  mv_high_priority_item_resolution_completion_audit_manifest_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MANIFEST_PATH;
  mv_high_priority_item_resolution_completion_audit_artifact_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH;
  resolution_completion_audit_id: string;
  source_count: number;
  adapter_count: number;
  resolved_item_ids: string[];
  unresolved_item_ids: string[];
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  resolution_completion_percent: number;
  resolution_evidence_ref: ResolutionEvidenceRefByItem;
  completion_block_reason: CompletionBlockReason;
  reentry_ready: boolean;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  progress_audit_consumed: CompletionAuditStatus;
  resolved_item_ids_valid: CompletionAuditStatus;
  unresolved_item_ids_valid: CompletionAuditStatus;
  resolved_high_priority_count_valid: CompletionAuditStatus;
  remaining_high_priority_count_valid: CompletionAuditStatus;
  resolution_completion_percent_valid: CompletionAuditStatus;
  resolution_evidence_ref_valid: CompletionAuditStatus;
  completion_block_reason_valid: CompletionAuditStatus;
  reentry_ready_valid: CompletionAuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: CompletionAuditStatus;
  next_stage_ready: CompletionAuditStatus;
  resolved_item_not_verified: boolean;
  unresolved_item_missing: boolean;
  resolution_evidence_missing: boolean;
  completion_block_reason_missing: boolean;
  reentry_ready_invalid: boolean;
  progress_audit_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_high_priority_item_resolution_completion_audit_ready: CompletionAuditStatus;
  certification_status: typeof HIGH_PRIORITY_RESOLUTION_COMPLETION_AUDITED_STATUS | null;
  next_stage_approved: boolean;
  completion_audit_checks: CompletionAuditCheck[];
  final_verdict:
    | typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PASS_VERDICT
    | typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_FAIL_VERDICT;
  issues: MvHighPriorityItemResolutionCompletionAuditIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_EXPORT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_REPORT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): CompletionAuditStatus {
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

function buildResolvedItemIds(statusByItem: ResolutionProgressStatusByItem): string[] {
  return EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.filter(
    (blockerCode) => statusByItem[blockerCode] === RESOLUTION_PROGRESS_STATUS_RESOLVED
  ).map((blockerCode) => BLOCKER_CODE_TO_ITEM_ID[blockerCode]);
}

function buildUnresolvedItemIds(statusByItem: ResolutionProgressStatusByItem): string[] {
  return EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.filter(
    (blockerCode) => statusByItem[blockerCode] !== RESOLUTION_PROGRESS_STATUS_RESOLVED
  ).map((blockerCode) => BLOCKER_CODE_TO_ITEM_ID[blockerCode]);
}

function resolveReentryReady(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount === 0;
}

function resolveCompletionBlockReason(remainingHighPriorityCount: number): CompletionBlockReason {
  return remainingHighPriorityCount > 0
    ? COMPLETION_BLOCK_REASON_HIGH_PRIORITY_ITEMS_REMAINING
    : COMPLETION_BLOCK_REASON_ALL_HIGH_PRIORITY_RESOLVED;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvHighPriorityItemResolutionCompletionAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvHighPriorityItemResolutionCompletionAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvHighPriorityItemResolutionCompletionAuditReport = {
    report_id: 'mv-high-priority-item-resolution-completion-audit-report-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PHASE,
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
    source_progress_audit_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
    mv_high_priority_item_resolution_progress_audit_report_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH,
    mv_high_priority_item_resolution_completion_audit_export_dir:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_EXPORT_DIR,
    mv_high_priority_item_resolution_completion_audit_manifest_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MANIFEST_PATH,
    mv_high_priority_item_resolution_completion_audit_artifact_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
    resolution_completion_audit_id: 'mv-high-priority-item-resolution-completion-audit-v1',
    source_count: 0,
    adapter_count: 0,
    resolved_item_ids: [],
    unresolved_item_ids: [],
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    resolution_completion_percent: 0,
    resolution_evidence_ref: {} as ResolutionEvidenceRefByItem,
    completion_block_reason: COMPLETION_BLOCK_REASON_HIGH_PRIORITY_ITEMS_REMAINING,
    reentry_ready: false,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: [],
    progress_audit_consumed: 'FAIL',
    resolved_item_ids_valid: 'FAIL',
    unresolved_item_ids_valid: 'FAIL',
    resolved_high_priority_count_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    resolution_completion_percent_valid: 'FAIL',
    resolution_evidence_ref_valid: 'FAIL',
    completion_block_reason_valid: 'FAIL',
    reentry_ready_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    resolved_item_not_verified: true,
    unresolved_item_missing: true,
    resolution_evidence_missing: true,
    completion_block_reason_missing: true,
    reentry_ready_invalid: true,
    progress_audit_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_high_priority_item_resolution_completion_audit_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    completion_audit_checks: [],
    final_verdict: MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvHighPriorityItemResolutionCompletionAudit(
  projectRoot?: string
): MvHighPriorityItemResolutionCompletionAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvHighPriorityItemResolutionCompletionAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const progressAuditReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: CompletionAuditStatus;
    mv_high_priority_item_resolution_progress_audit_ready: CompletionAuditStatus;
    traceability_preserved: boolean;
    resolved_high_priority_count: number;
    remaining_high_priority_count: number;
    resolution_completion_percent: number;
    resolution_evidence_ref: ResolutionEvidenceRefByItem;
    resolution_started: boolean;
  }>(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH);

  const progressAuditArtifact = loadJson<MvHighPriorityItemResolutionProgressAuditArtifact>(
    root,
    MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH
  );
  const progressAuditManifestPath = path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH);

  if (
    !progressAuditReport ||
    !progressAuditArtifact ||
    !fs.existsSync(progressAuditManifestPath) ||
    progressAuditReport.final_verdict !== MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PASS_VERDICT ||
    progressAuditReport.certification_status !== HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS ||
    progressAuditReport.next_stage_ready !== 'PASS' ||
    progressAuditReport.mv_high_priority_item_resolution_progress_audit_ready !== 'PASS'
  ) {
    issues.push({
      code: 'PROGRESS_AUDIT_MISSING',
      message: `Required ${MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PASS_VERDICT} with ${HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const progressAuditConsumed =
    progressAuditArtifact.resolution_progress_audit_complete === true &&
    progressAuditArtifact.next_stage_ready === true &&
    progressAuditArtifact.resolution_started === true;

  const resolutionStatusByItem = progressAuditArtifact.resolution_status_by_item;
  const resolvedItemIds = buildResolvedItemIds(resolutionStatusByItem);
  const unresolvedItemIds = buildUnresolvedItemIds(resolutionStatusByItem);
  const resolvedHighPriorityCount = progressAuditArtifact.resolved_high_priority_count;
  const remainingHighPriorityCount = progressAuditArtifact.remaining_high_priority_count;
  const resolutionCompletionPercent = progressAuditArtifact.resolution_completion_percent;
  const resolutionEvidenceRef = progressAuditArtifact.resolution_evidence_ref;
  const reentryReady = resolveReentryReady(remainingHighPriorityCount);
  const completionBlockReason = resolveCompletionBlockReason(remainingHighPriorityCount);

  const traceabilityChains = progressAuditArtifact.traceability_chain;
  const traceabilityPreserved =
    progressAuditReport.traceability_preserved === true &&
    progressAuditArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const resolvedItemIdsValid =
    resolvedItemIds.length === resolvedHighPriorityCount &&
    resolvedItemIds.every((itemId) => EXPECTED_HIGH_PRIORITY_ITEM_IDS.includes(itemId as (typeof EXPECTED_HIGH_PRIORITY_ITEM_IDS)[number])) &&
    EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.filter(
      (blockerCode) => resolutionStatusByItem[blockerCode] === RESOLUTION_PROGRESS_STATUS_RESOLVED
    ).every((blockerCode) => resolvedItemIds.includes(BLOCKER_CODE_TO_ITEM_ID[blockerCode]));

  const unresolvedItemIdsValid =
    unresolvedItemIds.length === remainingHighPriorityCount &&
    unresolvedItemIds.every((itemId) => EXPECTED_HIGH_PRIORITY_ITEM_IDS.includes(itemId as (typeof EXPECTED_HIGH_PRIORITY_ITEM_IDS)[number])) &&
    EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.filter(
      (blockerCode) => resolutionStatusByItem[blockerCode] !== RESOLUTION_PROGRESS_STATUS_RESOLVED
    ).every((blockerCode) => unresolvedItemIds.includes(BLOCKER_CODE_TO_ITEM_ID[blockerCode])) &&
    resolvedItemIds.length + unresolvedItemIds.length === EXPECTED_HIGH_PRIORITY_ITEM_IDS.length;

  const resolvedHighPriorityCountValid =
    resolvedHighPriorityCount === resolvedItemIds.length &&
    resolvedHighPriorityCount === progressAuditReport.resolved_high_priority_count;

  const remainingHighPriorityCountValid =
    remainingHighPriorityCount === unresolvedItemIds.length &&
    remainingHighPriorityCount === progressAuditReport.remaining_high_priority_count &&
    resolvedHighPriorityCount + remainingHighPriorityCount === EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.length;

  const resolutionCompletionPercentValid =
    resolutionCompletionPercent === progressAuditReport.resolution_completion_percent &&
    resolutionCompletionPercent >= 0 &&
    resolutionCompletionPercent <= 100 &&
    (remainingHighPriorityCount === 0
      ? resolutionCompletionPercent === 100
      : resolvedHighPriorityCount === 0
        ? resolutionCompletionPercent === 0
        : true);

  const resolutionEvidenceRefValid = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => {
    const evidencePath = resolutionEvidenceRef[blockerCode];
    return (
      evidencePath !== undefined &&
      evidencePath === progressAuditReport.resolution_evidence_ref[blockerCode] &&
      fs.existsSync(path.join(root, evidencePath))
    );
  });

  const completionBlockReasonValid =
    completionBlockReason === resolveCompletionBlockReason(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0
      ? completionBlockReason === COMPLETION_BLOCK_REASON_HIGH_PRIORITY_ITEMS_REMAINING
      : completionBlockReason === COMPLETION_BLOCK_REASON_ALL_HIGH_PRIORITY_RESOLVED);

  const reentryReadyValid =
    reentryReady === resolveReentryReady(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0 ? reentryReady === false : reentryReady === true);

  const resolvedItemNotVerified = !resolvedItemIdsValid;
  const unresolvedItemMissing = !unresolvedItemIdsValid;
  const resolutionEvidenceMissing = !resolutionEvidenceRefValid;
  const completionBlockReasonMissing = !completionBlockReasonValid;
  const reentryReadyInvalid = !reentryReadyValid;

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(RESOLUTION_COMPLETION_AUDIT_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const progressAuditMissing = !progressAuditConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const resolutionCompletionAuditComplete =
    progressAuditConsumed &&
    resolvedItemIdsValid &&
    unresolvedItemIdsValid &&
    resolvedHighPriorityCountValid &&
    remainingHighPriorityCountValid &&
    resolutionCompletionPercentValid &&
    resolutionEvidenceRefValid &&
    completionBlockReasonValid &&
    reentryReadyValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !resolvedItemNotVerified &&
    !unresolvedItemMissing &&
    !resolutionEvidenceMissing &&
    !completionBlockReasonMissing &&
    !reentryReadyInvalid &&
    (remainingHighPriorityCount > 0
      ? completionBlockReason === COMPLETION_BLOCK_REASON_HIGH_PRIORITY_ITEMS_REMAINING && reentryReady === false
      : reentryReady === true);

  const nextStageReady = resolutionCompletionAuditComplete;

  if (progressAuditMissing) {
    issues.push({
      code: 'PROGRESS_AUDIT_MISSING',
      message: 'High priority item resolution progress audit was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (resolvedItemNotVerified) {
    issues.push({
      code: 'RESOLVED_ITEM_NOT_VERIFIED',
      message: 'Resolved item IDs are not verified against resolution status',
      severity: 'error',
      check_id: 'resolved_item_ids_valid',
    });
  }
  if (unresolvedItemMissing) {
    issues.push({
      code: 'UNRESOLVED_ITEM_MISSING',
      message: 'Unresolved item IDs are missing or invalid',
      severity: 'error',
      check_id: 'unresolved_item_ids_valid',
    });
  }
  if (resolutionEvidenceMissing) {
    issues.push({
      code: 'RESOLUTION_EVIDENCE_MISSING',
      message: 'Resolution evidence references are missing or invalid',
      severity: 'error',
      check_id: 'resolution_evidence_ref_valid',
    });
  }
  if (completionBlockReasonMissing) {
    issues.push({
      code: 'COMPLETION_BLOCK_REASON_MISSING',
      message: 'Completion block reason is missing or invalid',
      severity: 'error',
      check_id: 'completion_block_reason_valid',
    });
  }
  if (reentryReadyInvalid) {
    issues.push({
      code: 'REENTRY_READY_INVALID',
      message: 'Reentry ready flag is invalid for completion state',
      severity: 'error',
      check_id: 'reentry_ready_valid',
    });
  }

  const completionAuditChecks: CompletionAuditCheck[] = [
    {
      check_id: 'resolved_item_ids_valid',
      check_label: 'Resolved Item IDs Valid',
      status: toStatus(resolvedItemIdsValid),
    },
    {
      check_id: 'unresolved_item_ids_valid',
      check_label: 'Unresolved Item IDs Valid',
      status: toStatus(unresolvedItemIdsValid),
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
      check_id: 'resolution_completion_percent_valid',
      check_label: 'Resolution Completion Percent Valid',
      status: toStatus(resolutionCompletionPercentValid),
    },
    {
      check_id: 'resolution_evidence_ref_valid',
      check_label: 'Resolution Evidence Ref Valid',
      status: toStatus(resolutionEvidenceRefValid),
    },
    {
      check_id: 'completion_block_reason_valid',
      check_label: 'Completion Block Reason Valid',
      status: toStatus(completionBlockReasonValid),
    },
    {
      check_id: 'reentry_ready_valid',
      check_label: 'Reentry Ready Valid',
      status: toStatus(reentryReadyValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvHighPriorityItemResolutionCompletionAuditArtifact = {
    resolution_completion_audit_id: 'mv-high-priority-item-resolution-completion-audit-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PHASE,
    generated_at: timestamp,
    source_progress_audit_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
    resolution_progress_audit_id: progressAuditArtifact.resolution_progress_audit_id,
    resolved_item_ids: resolvedItemIds,
    unresolved_item_ids: unresolvedItemIds,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    resolution_completion_percent: resolutionCompletionPercent,
    resolution_evidence_ref: resolutionEvidenceRef,
    completion_block_reason: completionBlockReason,
    reentry_ready: reentryReady,
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
      resolution_completion_audit_artifact_write_scope: RESOLUTION_COMPLETION_AUDIT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    resolution_completion_audit_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvHighPriorityItemResolutionCompletionAuditManifest = {
    manifest_id: 'mv-high-priority-item-resolution-completion-audit-manifest-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PHASE,
    generated_at: timestamp,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    resolution_completion_percent: resolutionCompletionPercent,
    reentry_ready: reentryReady,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? HIGH_PRIORITY_RESOLUTION_COMPLETION_AUDITED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvHighPriorityItemResolutionCompletionAuditReport = {
    report_id: 'mv-high-priority-item-resolution-completion-audit-report-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PHASE,
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
    source_progress_audit_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
    mv_high_priority_item_resolution_progress_audit_report_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH,
    mv_high_priority_item_resolution_completion_audit_export_dir:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_EXPORT_DIR,
    mv_high_priority_item_resolution_completion_audit_manifest_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MANIFEST_PATH,
    mv_high_priority_item_resolution_completion_audit_artifact_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
    resolution_completion_audit_id: 'mv-high-priority-item-resolution-completion-audit-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    resolved_item_ids: resolvedItemIds,
    unresolved_item_ids: unresolvedItemIds,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    resolution_completion_percent: resolutionCompletionPercent,
    resolution_evidence_ref: resolutionEvidenceRef,
    completion_block_reason: completionBlockReason,
    reentry_ready: reentryReady,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: traceabilityChains,
    progress_audit_consumed: toStatus(progressAuditConsumed),
    resolved_item_ids_valid: toStatus(resolvedItemIdsValid),
    unresolved_item_ids_valid: toStatus(unresolvedItemIdsValid),
    resolved_high_priority_count_valid: toStatus(resolvedHighPriorityCountValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    resolution_completion_percent_valid: toStatus(resolutionCompletionPercentValid),
    resolution_evidence_ref_valid: toStatus(resolutionEvidenceRefValid),
    completion_block_reason_valid: toStatus(completionBlockReasonValid),
    reentry_ready_valid: toStatus(reentryReadyValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    resolved_item_not_verified: resolvedItemNotVerified,
    unresolved_item_missing: unresolvedItemMissing,
    resolution_evidence_missing: resolutionEvidenceMissing,
    completion_block_reason_missing: completionBlockReasonMissing,
    reentry_ready_invalid: reentryReadyInvalid,
    progress_audit_missing: progressAuditMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_high_priority_item_resolution_completion_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? HIGH_PRIORITY_RESOLUTION_COMPLETION_AUDITED_STATUS : null,
    next_stage_approved: pass,
    completion_audit_checks: completionAuditChecks,
    final_verdict: pass
      ? MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PASS_VERDICT
      : MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
