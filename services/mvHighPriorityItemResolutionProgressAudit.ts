import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES,
  RESOLUTION_STATUS_RESOLVED,
  type HighPriorityBlockerCode,
  type ResolutionStatusByItem,
} from './mvHighPriorityResolutionAudit.js';
import { allHighPriorityItemsResolved, buildHighPriorityResolutionProof } from './mvHighPriorityItemResolutionVerification.js';
import {
  EXPECTED_HIGH_PRIORITY_ITEM_IDS,
  HIGH_PRIORITY_RESOLUTION_EXECUTION_COMPLETED_STATUS,
  HIGH_PRIORITY_RESOLUTION_EXECUTION_STARTED_STATUS,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PASS_VERDICT,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_REPORT_PATH,
  type MvHighPriorityItemResolutionExecutionArtifact,
  type ResolutionEvidenceRefByItem,
} from './mvHighPriorityItemResolutionExecution.js';
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

export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PHASE =
  'PHASE-DIGITAL-STUDIO-026-MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_V1' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PASS_VERDICT =
  'PASS_MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_V1' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_FAIL_VERDICT =
  'FAIL_MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_V1' as const;
export const HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS =
  'HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED' as const;
export const RESOLUTION_PROGRESS_STATUS_NOT_STARTED = 'NOT_STARTED' as const;
export const RESOLUTION_PROGRESS_STATUS_IN_PROGRESS = 'IN_PROGRESS' as const;
export const RESOLUTION_PROGRESS_STATUS_PARTIAL_RESOLVED = 'PARTIAL_RESOLVED' as const;
export const RESOLUTION_PROGRESS_STATUS_RESOLVED = 'RESOLVED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_023_REENTRY' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_DIR =
  'reports/mv_high_priority_item_resolution_progress_audit' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH =
  'reports/mv_high_priority_item_resolution_progress_audit/mv-high-priority-item-resolution-progress-audit-report.json' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MD_PATH =
  'reports/mv_high_priority_item_resolution_progress_audit/MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT.md' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_EXPORT_DIR =
  'exports/mv_high_priority_item_resolution_progress_audit' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH =
  'exports/mv_high_priority_item_resolution_progress_audit/mv-high-priority-item-resolution-progress-audit-manifest.json' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH =
  'exports/mv_high_priority_item_resolution_progress_audit/mv-high-priority-item-resolution-progress-audit.json' as const;

export const RESOLUTION_PROGRESS_AUDIT_ARTIFACT_WRITE_SCOPE =
  'exports/mv_high_priority_item_resolution_progress_audit/' as const;

export const RESOLUTION_PROGRESS_STATUSES = [
  RESOLUTION_PROGRESS_STATUS_NOT_STARTED,
  RESOLUTION_PROGRESS_STATUS_IN_PROGRESS,
  RESOLUTION_PROGRESS_STATUS_PARTIAL_RESOLVED,
  RESOLUTION_PROGRESS_STATUS_RESOLVED,
] as const;

export type ResolutionProgressStatus = (typeof RESOLUTION_PROGRESS_STATUSES)[number];

export type ResolutionProgressStatusByItem = Record<HighPriorityBlockerCode, ResolutionProgressStatus>;

export type ResolutionProgressByItem = Record<HighPriorityBlockerCode, number>;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type ProgressAuditStatus = 'PASS' | 'FAIL';

export type MvHighPriorityItemResolutionProgressAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  blocker_code?: string;
  check_id?: string;
};

export type ProgressAuditCheck = {
  check_id: string;
  check_label: string;
  status: ProgressAuditStatus;
};

export type MvHighPriorityItemResolutionProgressAuditArtifact = {
  resolution_progress_audit_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PHASE;
  generated_at: string;
  source_resolution_execution_ref: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH;
  resolution_execution_id: string;
  high_priority_item_ids: string[];
  resolution_status_by_item: ResolutionProgressStatusByItem;
  resolution_progress_by_item: ResolutionProgressByItem;
  resolution_started: boolean;
  resolution_last_updated: string;
  resolution_completion_percent: number;
  resolution_evidence_ref: ResolutionEvidenceRefByItem;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  high_priority_resolution_count: number;
  next_reentry_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    resolution_progress_audit_artifact_write_scope: typeof RESOLUTION_PROGRESS_AUDIT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  resolution_progress_audit_complete: boolean;
  next_stage_ready: boolean;
};

export type MvHighPriorityItemResolutionProgressAuditManifest = {
  manifest_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PHASE;
  generated_at: string;
  resolution_started: boolean;
  resolution_completion_percent: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  traceability_preserved: boolean;
  safe_create_policy_verified: ProgressAuditStatus;
  next_stage_ready: ProgressAuditStatus;
  certification_status: typeof HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS | null;
};

export type MvHighPriorityItemResolutionProgressAuditReport = {
  report_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PHASE;
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
  source_resolution_execution_ref: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH;
  mv_high_priority_item_resolution_execution_report_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_REPORT_PATH;
  mv_high_priority_item_resolution_progress_audit_export_dir: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_EXPORT_DIR;
  mv_high_priority_item_resolution_progress_audit_manifest_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH;
  mv_high_priority_item_resolution_progress_audit_artifact_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH;
  resolution_progress_audit_id: string;
  source_count: number;
  adapter_count: number;
  high_priority_item_ids: string[];
  resolution_status_by_item: ResolutionProgressStatusByItem;
  resolution_progress_by_item: ResolutionProgressByItem;
  resolution_started: boolean;
  resolution_last_updated: string;
  resolution_completion_percent: number;
  resolution_evidence_ref: ResolutionEvidenceRefByItem;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  high_priority_resolution_count: number;
  next_reentry_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  resolution_execution_consumed: ProgressAuditStatus;
  high_priority_item_ids_valid: ProgressAuditStatus;
  resolution_status_by_item_valid: ProgressAuditStatus;
  resolution_progress_by_item_valid: ProgressAuditStatus;
  resolution_started_valid: ProgressAuditStatus;
  resolution_last_updated_valid: ProgressAuditStatus;
  resolution_completion_percent_valid: ProgressAuditStatus;
  resolution_evidence_ref_valid: ProgressAuditStatus;
  resolved_high_priority_count_valid: ProgressAuditStatus;
  remaining_high_priority_count_valid: ProgressAuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: ProgressAuditStatus;
  next_stage_ready: ProgressAuditStatus;
  resolution_status_invalid: boolean;
  resolution_progress_invalid: boolean;
  resolution_last_updated_missing: boolean;
  resolution_completion_percent_invalid: boolean;
  resolution_evidence_ref_missing: boolean;
  high_priority_item_untracked: boolean;
  resolution_execution_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_high_priority_item_resolution_progress_audit_ready: ProgressAuditStatus;
  certification_status: typeof HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS | null;
  next_stage_approved: boolean;
  progress_audit_checks: ProgressAuditCheck[];
  final_verdict:
    | typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PASS_VERDICT
    | typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_FAIL_VERDICT;
  issues: MvHighPriorityItemResolutionProgressAuditIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_EXPORT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MD_PATH,
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

function isResolutionProgressStatus(value: string): value is ResolutionProgressStatus {
  return (RESOLUTION_PROGRESS_STATUSES as readonly string[]).includes(value);
}

function resolveProgressFromStatus(status: ResolutionProgressStatus, itemProgress: number): number {
  if (status === RESOLUTION_PROGRESS_STATUS_RESOLVED) return 100;
  if (status === RESOLUTION_PROGRESS_STATUS_NOT_STARTED) return 0;
  if (status === RESOLUTION_PROGRESS_STATUS_PARTIAL_RESOLVED) {
    return itemProgress > 0 && itemProgress < 100 ? itemProgress : 50;
  }
  if (status === RESOLUTION_PROGRESS_STATUS_IN_PROGRESS) return itemProgress;
  return itemProgress;
}

function resolveStatusFromProgress(
  itemProgress: number,
  resolutionStarted: boolean
): ResolutionProgressStatus {
  if (itemProgress === 100) return RESOLUTION_PROGRESS_STATUS_RESOLVED;
  if (itemProgress > 0 && itemProgress < 100) return RESOLUTION_PROGRESS_STATUS_PARTIAL_RESOLVED;
  if (resolutionStarted) return RESOLUTION_PROGRESS_STATUS_IN_PROGRESS;
  return RESOLUTION_PROGRESS_STATUS_NOT_STARTED;
}

function statusMatchesProgress(status: ResolutionProgressStatus, itemProgress: number, resolutionStarted: boolean): boolean {
  const expectedStatus = resolveStatusFromProgress(itemProgress, resolutionStarted);
  if (status === RESOLUTION_PROGRESS_STATUS_IN_PROGRESS && itemProgress === 0 && resolutionStarted) {
    return true;
  }
  return status === expectedStatus;
}

function buildResolutionProgressByItem(
  resolutionStatusByItem: ResolutionProgressStatusByItem,
  resolutionStarted: boolean
): ResolutionProgressByItem {
  const progressByItem = {} as ResolutionProgressByItem;
  for (const blockerCode of EXPECTED_HIGH_PRIORITY_BLOCKER_CODES) {
    const status = resolutionStatusByItem[blockerCode];
    if (status === RESOLUTION_PROGRESS_STATUS_RESOLVED) {
      progressByItem[blockerCode] = 100;
    } else if (status === RESOLUTION_PROGRESS_STATUS_PARTIAL_RESOLVED) {
      progressByItem[blockerCode] = 50;
    } else if (status === RESOLUTION_PROGRESS_STATUS_IN_PROGRESS) {
      progressByItem[blockerCode] = resolutionStarted ? 0 : 0;
    } else {
      progressByItem[blockerCode] = 0;
    }
  }
  return progressByItem;
}

function mapExecutionStatusToProgressStatus(
  executionStatusByItem: ResolutionStatusByItem,
  resolutionStarted: boolean
): ResolutionProgressStatusByItem {
  const statusByItem = {} as ResolutionProgressStatusByItem;
  for (const blockerCode of EXPECTED_HIGH_PRIORITY_BLOCKER_CODES) {
    const executionStatus = executionStatusByItem[blockerCode];
    if (executionStatus === RESOLUTION_STATUS_RESOLVED) {
      statusByItem[blockerCode] = RESOLUTION_PROGRESS_STATUS_RESOLVED;
    } else if (resolutionStarted) {
      statusByItem[blockerCode] = RESOLUTION_PROGRESS_STATUS_IN_PROGRESS;
    } else {
      statusByItem[blockerCode] = RESOLUTION_PROGRESS_STATUS_NOT_STARTED;
    }
  }
  return statusByItem;
}

function countResolved(statusByItem: ResolutionProgressStatusByItem): number {
  return EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.filter(
    (blockerCode) => statusByItem[blockerCode] === RESOLUTION_PROGRESS_STATUS_RESOLVED
  ).length;
}

function resolveCompletionPercent(
  progressByItem: ResolutionProgressByItem,
  resolvedCount: number,
  totalCount: number
): number {
  const averageProgress = Math.round(
    EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.reduce((sum, blockerCode) => sum + progressByItem[blockerCode], 0) /
      totalCount
  );
  const resolvedPercent = Math.round((resolvedCount / totalCount) * 100);
  return Math.max(averageProgress, resolvedPercent);
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvHighPriorityItemResolutionProgressAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvHighPriorityItemResolutionProgressAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvHighPriorityItemResolutionProgressAuditReport = {
    report_id: 'mv-high-priority-item-resolution-progress-audit-report-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PHASE,
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
    source_resolution_execution_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
    mv_high_priority_item_resolution_execution_report_path: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_REPORT_PATH,
    mv_high_priority_item_resolution_progress_audit_export_dir: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_EXPORT_DIR,
    mv_high_priority_item_resolution_progress_audit_manifest_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH,
    mv_high_priority_item_resolution_progress_audit_artifact_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
    resolution_progress_audit_id: 'mv-high-priority-item-resolution-progress-audit-v1',
    source_count: 0,
    adapter_count: 0,
    high_priority_item_ids: [],
    resolution_status_by_item: {} as ResolutionProgressStatusByItem,
    resolution_progress_by_item: {} as ResolutionProgressByItem,
    resolution_started: false,
    resolution_last_updated: timestamp,
    resolution_completion_percent: 0,
    resolution_evidence_ref: {} as ResolutionEvidenceRefByItem,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    high_priority_resolution_count: 0,
    next_reentry_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    resolution_execution_consumed: 'FAIL',
    high_priority_item_ids_valid: 'FAIL',
    resolution_status_by_item_valid: 'FAIL',
    resolution_progress_by_item_valid: 'FAIL',
    resolution_started_valid: 'FAIL',
    resolution_last_updated_valid: 'FAIL',
    resolution_completion_percent_valid: 'FAIL',
    resolution_evidence_ref_valid: 'FAIL',
    resolved_high_priority_count_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    resolution_status_invalid: true,
    resolution_progress_invalid: true,
    resolution_last_updated_missing: true,
    resolution_completion_percent_invalid: true,
    resolution_evidence_ref_missing: true,
    high_priority_item_untracked: true,
    resolution_execution_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_high_priority_item_resolution_progress_audit_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    progress_audit_checks: [],
    final_verdict: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvHighPriorityItemResolutionProgressAudit(
  projectRoot?: string
): MvHighPriorityItemResolutionProgressAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvHighPriorityItemResolutionProgressAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const executionReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: ProgressAuditStatus;
    mv_high_priority_item_resolution_execution_ready: ProgressAuditStatus;
    traceability_preserved: boolean;
    resolution_started: boolean;
    resolved_high_priority_count: number;
    remaining_high_priority_count: number;
    high_priority_item_ids: string[];
    resolution_evidence_ref: ResolutionEvidenceRefByItem;
  }>(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_REPORT_PATH);

  const executionArtifact = loadJson<MvHighPriorityItemResolutionExecutionArtifact>(
    root,
    MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH
  );
  const executionManifestPath = path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MANIFEST_PATH);

  if (
    !executionReport ||
    !executionArtifact ||
    !fs.existsSync(executionManifestPath) ||
    executionReport.final_verdict !== MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PASS_VERDICT ||
    (executionReport.certification_status !== HIGH_PRIORITY_RESOLUTION_EXECUTION_STARTED_STATUS &&
      executionReport.certification_status !== HIGH_PRIORITY_RESOLUTION_EXECUTION_COMPLETED_STATUS) ||
    executionReport.next_stage_ready !== 'PASS' ||
    executionReport.mv_high_priority_item_resolution_execution_ready !== 'PASS'
  ) {
    issues.push({
      code: 'RESOLUTION_EXECUTION_MISSING',
      message: `Required ${MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PASS_VERDICT} with ${HIGH_PRIORITY_RESOLUTION_EXECUTION_STARTED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const resolutionExecutionConsumed =
    executionArtifact.resolution_execution_complete === true &&
    executionArtifact.next_stage_ready === true &&
    executionArtifact.resolution_started === true;

  const highPriorityItemIds = [...EXPECTED_HIGH_PRIORITY_ITEM_IDS];
  const resolutionStarted = executionArtifact.resolution_started;
  const resolutionProof = buildHighPriorityResolutionProof(root);
  const allResolved = allHighPriorityItemsResolved(resolutionProof);
  const resolutionStatusByItem = mapExecutionStatusToProgressStatus(
    executionArtifact.resolution_status_by_item,
    resolutionStarted
  );
  const resolutionProgressByItem = buildResolutionProgressByItem(resolutionStatusByItem, resolutionStarted);
  const resolutionLastUpdated = timestamp;
  const highPriorityResolutionCount = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.length;
  const resolvedHighPriorityCount = countResolved(resolutionStatusByItem);
  const remainingHighPriorityCount = highPriorityResolutionCount - resolvedHighPriorityCount;
  const resolutionCompletionPercent = resolveCompletionPercent(
    resolutionProgressByItem,
    resolvedHighPriorityCount,
    highPriorityResolutionCount
  );
  const resolutionEvidenceRef = executionArtifact.resolution_evidence_ref;

  const traceabilityChains = executionArtifact.traceability_chain;
  const traceabilityPreserved =
    executionReport.traceability_preserved === true &&
    executionArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const highPriorityItemIdsValid =
    highPriorityItemIds.length === EXPECTED_HIGH_PRIORITY_ITEM_IDS.length &&
    EXPECTED_HIGH_PRIORITY_ITEM_IDS.every((itemId, index) => highPriorityItemIds[index] === itemId) &&
    highPriorityItemIds.every((itemId) => executionArtifact.high_priority_item_ids.includes(itemId));

  const resolutionStatusByItemValid = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => {
    const status = resolutionStatusByItem[blockerCode];
    const progress = resolutionProgressByItem[blockerCode];
    return (
      isResolutionProgressStatus(status) &&
      statusMatchesProgress(status, progress, resolutionStarted) &&
      (resolutionStarted ? status !== RESOLUTION_PROGRESS_STATUS_NOT_STARTED : true)
    );
  });

  const resolutionProgressByItemValid = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => {
    const status = resolutionStatusByItem[blockerCode];
    const progress = resolutionProgressByItem[blockerCode];
    return (
      progress >= 0 &&
      progress <= 100 &&
      progress === resolveProgressFromStatus(status, progress) &&
      (status === RESOLUTION_PROGRESS_STATUS_RESOLVED
        ? progress === 100
        : status === RESOLUTION_PROGRESS_STATUS_IN_PROGRESS && resolutionStarted
          ? progress === 0
          : true)
    );
  });

  const resolutionStartedValid =
    resolutionStarted === executionReport.resolution_started &&
    resolutionStarted === executionArtifact.resolution_started &&
    resolutionStarted === true;

  const resolutionLastUpdatedValid =
    resolutionLastUpdated.length > 0 &&
    !Number.isNaN(Date.parse(resolutionLastUpdated)) &&
    Date.parse(resolutionLastUpdated) >= Date.parse(executionArtifact.generated_at);

  const resolutionCompletionPercentValid =
    resolutionCompletionPercent ===
      resolveCompletionPercent(resolutionProgressByItem, resolvedHighPriorityCount, highPriorityResolutionCount) &&
    resolutionCompletionPercent >= 0 &&
    resolutionCompletionPercent <= 100 &&
    (allResolved
      ? resolutionCompletionPercent === 100
      : resolvedHighPriorityCount === 0
        ? resolutionCompletionPercent === 0
        : true);

  const resolutionEvidenceRefValid = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => {
    const evidencePath = resolutionEvidenceRef[blockerCode];
    return (
      evidencePath !== undefined &&
      evidencePath === executionArtifact.resolution_evidence_ref[blockerCode] &&
      fs.existsSync(path.join(root, evidencePath))
    );
  });

  const resolvedHighPriorityCountValid =
    resolvedHighPriorityCount === countResolved(resolutionStatusByItem) &&
    resolvedHighPriorityCount === executionReport.resolved_high_priority_count &&
    resolvedHighPriorityCount === executionArtifact.resolved_high_priority_count;

  const remainingHighPriorityCountValid =
    remainingHighPriorityCount === highPriorityResolutionCount - resolvedHighPriorityCount &&
    remainingHighPriorityCount === executionReport.remaining_high_priority_count &&
    remainingHighPriorityCount === executionArtifact.remaining_high_priority_count;

  const resolutionStatusInvalid = !resolutionStatusByItemValid;
  const resolutionProgressInvalid = !resolutionProgressByItemValid;
  const resolutionLastUpdatedMissing = !resolutionLastUpdatedValid;
  const resolutionCompletionPercentInvalid = !resolutionCompletionPercentValid;
  const resolutionEvidenceRefMissing = !resolutionEvidenceRefValid;

  const highPriorityItemUntracked =
    !highPriorityItemIdsValid ||
    EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.some(
      (blockerCode) =>
        resolutionStatusByItem[blockerCode] === undefined || resolutionProgressByItem[blockerCode] === undefined
    );

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(RESOLUTION_PROGRESS_AUDIT_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const resolutionExecutionMissing = !resolutionExecutionConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const resolutionProgressAuditComplete =
    resolutionExecutionConsumed &&
    highPriorityItemIdsValid &&
    resolutionStatusByItemValid &&
    resolutionProgressByItemValid &&
    resolutionStartedValid &&
    resolutionLastUpdatedValid &&
    resolutionCompletionPercentValid &&
    resolutionEvidenceRefValid &&
    resolvedHighPriorityCountValid &&
    remainingHighPriorityCountValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !resolutionStatusInvalid &&
    !resolutionProgressInvalid &&
    !resolutionLastUpdatedMissing &&
    !resolutionCompletionPercentInvalid &&
    !resolutionEvidenceRefMissing &&
    !highPriorityItemUntracked &&
    (allResolved
      ? EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
          (blockerCode) => resolutionStatusByItem[blockerCode] === RESOLUTION_PROGRESS_STATUS_RESOLVED
        ) && remainingHighPriorityCount === 0
      : EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
          (blockerCode) => resolutionStatusByItem[blockerCode] === RESOLUTION_PROGRESS_STATUS_IN_PROGRESS
        ));

  const nextStageReady = resolutionProgressAuditComplete;

  if (resolutionExecutionMissing) {
    issues.push({
      code: 'RESOLUTION_EXECUTION_MISSING',
      message: 'High priority item resolution execution was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (!highPriorityItemIdsValid) {
    issues.push({
      code: 'HIGH_PRIORITY_ITEM_IDS_INVALID',
      message: 'High priority item IDs are invalid',
      severity: 'error',
      check_id: 'high_priority_item_ids_valid',
    });
  }
  if (resolutionStatusInvalid) {
    issues.push({
      code: 'RESOLUTION_STATUS_INVALID',
      message: 'Resolution status by item is invalid',
      severity: 'error',
      check_id: 'resolution_status_by_item_valid',
    });
  }
  if (resolutionProgressInvalid) {
    issues.push({
      code: 'RESOLUTION_PROGRESS_INVALID',
      message: 'Resolution progress by item is invalid',
      severity: 'error',
      check_id: 'resolution_progress_by_item_valid',
    });
  }
  if (!resolutionStartedValid) {
    issues.push({
      code: 'RESOLUTION_STARTED_INVALID',
      message: 'Resolution started flag is invalid',
      severity: 'error',
      check_id: 'resolution_started_valid',
    });
  }
  if (resolutionLastUpdatedMissing) {
    issues.push({
      code: 'RESOLUTION_LAST_UPDATED_MISSING',
      message: 'Resolution last updated timestamp is missing or invalid',
      severity: 'error',
      check_id: 'resolution_last_updated_valid',
    });
  }
  if (resolutionCompletionPercentInvalid) {
    issues.push({
      code: 'RESOLUTION_COMPLETION_PERCENT_INVALID',
      message: 'Resolution completion percent is invalid',
      severity: 'error',
      check_id: 'resolution_completion_percent_valid',
    });
  }
  if (resolutionEvidenceRefMissing) {
    issues.push({
      code: 'RESOLUTION_EVIDENCE_REF_MISSING',
      message: 'Resolution evidence references are missing or invalid',
      severity: 'error',
      check_id: 'resolution_evidence_ref_valid',
    });
  }
  if (highPriorityItemUntracked) {
    issues.push({
      code: 'HIGH_PRIORITY_ITEM_UNTRACKED',
      message: 'One or more high priority items are not tracked in progress audit',
      severity: 'error',
    });
  }

  const progressAuditChecks: ProgressAuditCheck[] = [
    {
      check_id: 'high_priority_item_ids_valid',
      check_label: 'High Priority Item IDs Valid',
      status: toStatus(highPriorityItemIdsValid),
    },
    {
      check_id: 'resolution_status_by_item_valid',
      check_label: 'Resolution Status By Item Valid',
      status: toStatus(resolutionStatusByItemValid),
    },
    {
      check_id: 'resolution_progress_by_item_valid',
      check_label: 'Resolution Progress By Item Valid',
      status: toStatus(resolutionProgressByItemValid),
    },
    {
      check_id: 'resolution_started_valid',
      check_label: 'Resolution Started Valid',
      status: toStatus(resolutionStartedValid),
    },
    {
      check_id: 'resolution_last_updated_valid',
      check_label: 'Resolution Last Updated Valid',
      status: toStatus(resolutionLastUpdatedValid),
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
      check_id: 'resolved_high_priority_count_valid',
      check_label: 'Resolved High Priority Count Valid',
      status: toStatus(resolvedHighPriorityCountValid),
    },
    {
      check_id: 'remaining_high_priority_count_valid',
      check_label: 'Remaining High Priority Count Valid',
      status: toStatus(remainingHighPriorityCountValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvHighPriorityItemResolutionProgressAuditArtifact = {
    resolution_progress_audit_id: 'mv-high-priority-item-resolution-progress-audit-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PHASE,
    generated_at: timestamp,
    source_resolution_execution_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
    resolution_execution_id: executionArtifact.resolution_execution_id,
    high_priority_item_ids: highPriorityItemIds,
    resolution_status_by_item: resolutionStatusByItem,
    resolution_progress_by_item: resolutionProgressByItem,
    resolution_started: resolutionStarted,
    resolution_last_updated: resolutionLastUpdated,
    resolution_completion_percent: resolutionCompletionPercent,
    resolution_evidence_ref: resolutionEvidenceRef,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    high_priority_resolution_count: highPriorityResolutionCount,
    next_reentry_gate_label: NEXT_STAGE_GATE_LABEL,
    current_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      resolution_progress_audit_artifact_write_scope: RESOLUTION_PROGRESS_AUDIT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    resolution_progress_audit_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvHighPriorityItemResolutionProgressAuditManifest = {
    manifest_id: 'mv-high-priority-item-resolution-progress-audit-manifest-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PHASE,
    generated_at: timestamp,
    resolution_started: resolutionStarted,
    resolution_completion_percent: resolutionCompletionPercent,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvHighPriorityItemResolutionProgressAuditReport = {
    report_id: 'mv-high-priority-item-resolution-progress-audit-report-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PHASE,
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
    source_resolution_execution_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
    mv_high_priority_item_resolution_execution_report_path: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_REPORT_PATH,
    mv_high_priority_item_resolution_progress_audit_export_dir: MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_EXPORT_DIR,
    mv_high_priority_item_resolution_progress_audit_manifest_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_MANIFEST_PATH,
    mv_high_priority_item_resolution_progress_audit_artifact_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
    resolution_progress_audit_id: 'mv-high-priority-item-resolution-progress-audit-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    high_priority_item_ids: highPriorityItemIds,
    resolution_status_by_item: resolutionStatusByItem,
    resolution_progress_by_item: resolutionProgressByItem,
    resolution_started: resolutionStarted,
    resolution_last_updated: resolutionLastUpdated,
    resolution_completion_percent: resolutionCompletionPercent,
    resolution_evidence_ref: resolutionEvidenceRef,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    high_priority_resolution_count: highPriorityResolutionCount,
    next_reentry_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    resolution_execution_consumed: toStatus(resolutionExecutionConsumed),
    high_priority_item_ids_valid: toStatus(highPriorityItemIdsValid),
    resolution_status_by_item_valid: toStatus(resolutionStatusByItemValid),
    resolution_progress_by_item_valid: toStatus(resolutionProgressByItemValid),
    resolution_started_valid: toStatus(resolutionStartedValid),
    resolution_last_updated_valid: toStatus(resolutionLastUpdatedValid),
    resolution_completion_percent_valid: toStatus(resolutionCompletionPercentValid),
    resolution_evidence_ref_valid: toStatus(resolutionEvidenceRefValid),
    resolved_high_priority_count_valid: toStatus(resolvedHighPriorityCountValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    resolution_status_invalid: resolutionStatusInvalid,
    resolution_progress_invalid: resolutionProgressInvalid,
    resolution_last_updated_missing: resolutionLastUpdatedMissing,
    resolution_completion_percent_invalid: resolutionCompletionPercentInvalid,
    resolution_evidence_ref_missing: resolutionEvidenceRefMissing,
    high_priority_item_untracked: highPriorityItemUntracked,
    resolution_execution_missing: resolutionExecutionMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_high_priority_item_resolution_progress_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? HIGH_PRIORITY_RESOLUTION_PROGRESS_AUDITED_STATUS : null,
    next_stage_approved: pass,
    progress_audit_checks: progressAuditChecks,
    final_verdict: pass
      ? MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_PASS_VERDICT
      : MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
