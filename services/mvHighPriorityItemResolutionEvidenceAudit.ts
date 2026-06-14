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
  BLOCKER_CODE_TO_ITEM_ID,
  HIGH_PRIORITY_RESOLUTION_COMPLETION_AUDITED_STATUS,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PASS_VERDICT,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_REPORT_PATH,
  type MvHighPriorityItemResolutionCompletionAuditArtifact,
} from './mvHighPriorityItemResolutionCompletionAudit.js';
import { RESOLUTION_PROGRESS_STATUS_RESOLVED } from './mvHighPriorityItemResolutionProgressAudit.js';
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

export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PHASE =
  'PHASE-DIGITAL-STUDIO-028-MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_V1' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PASS_VERDICT =
  'PASS_MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_V1' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_FAIL_VERDICT =
  'FAIL_MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_V1' as const;
export const HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED_STATUS =
  'HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED' as const;
export const EVIDENCE_TYPE_UNRESOLVED_STATE_EVIDENCE = 'unresolved_state_evidence' as const;
export const EVIDENCE_TYPE_RESOLUTION_EVIDENCE = 'resolution_evidence' as const;
export const EVIDENCE_VERIFICATION_REASON_UNRESOLVED_STATE_VERIFIED =
  'UNRESOLVED_STATE_EVIDENCE_VERIFIED' as const;
export const EVIDENCE_VERIFICATION_REASON_RESOLUTION_VERIFIED = 'RESOLUTION_EVIDENCE_VERIFIED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_023_REENTRY' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_DIR =
  'reports/mv_high_priority_item_resolution_evidence_audit' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_REPORT_PATH =
  'reports/mv_high_priority_item_resolution_evidence_audit/mv-high-priority-item-resolution-evidence-audit-report.json' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MD_PATH =
  'reports/mv_high_priority_item_resolution_evidence_audit/MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT.md' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_EXPORT_DIR =
  'exports/mv_high_priority_item_resolution_evidence_audit' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH =
  'exports/mv_high_priority_item_resolution_evidence_audit/mv-high-priority-item-resolution-evidence-audit-manifest.json' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH =
  'exports/mv_high_priority_item_resolution_evidence_audit/mv-high-priority-item-resolution-evidence-audit.json' as const;

export const RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_WRITE_SCOPE =
  'exports/mv_high_priority_item_resolution_evidence_audit/' as const;

export const EVIDENCE_TYPES = [EVIDENCE_TYPE_UNRESOLVED_STATE_EVIDENCE, EVIDENCE_TYPE_RESOLUTION_EVIDENCE] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export type EvidenceVerificationReason =
  | typeof EVIDENCE_VERIFICATION_REASON_UNRESOLVED_STATE_VERIFIED
  | typeof EVIDENCE_VERIFICATION_REASON_RESOLUTION_VERIFIED;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type EvidenceAuditStatus = 'PASS' | 'FAIL';

export type MvHighPriorityItemResolutionEvidenceAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type EvidenceAuditCheck = {
  check_id: string;
  check_label: string;
  status: EvidenceAuditStatus;
};

type ExecutionEvidence = {
  evidence_id: string;
  blocker_code: string;
  item_id: string;
  resolution_status: string;
  resolution_started: boolean;
  execution_action: string;
  generated_at: string;
  execution_scope: string;
  planning_only: boolean;
};

export type MvHighPriorityItemResolutionEvidenceAuditArtifact = {
  resolution_evidence_audit_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PHASE;
  generated_at: string;
  source_completion_audit_ref: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH;
  resolution_completion_audit_id: string;
  resolved_item_ids: string[];
  unresolved_item_ids: string[];
  evidence_type: EvidenceType;
  resolution_evidence_ref: ResolutionEvidenceRefByItem;
  evidence_verified: boolean;
  evidence_verification_reason: EvidenceVerificationReason;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
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
    resolution_evidence_audit_artifact_write_scope: typeof RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  resolution_evidence_audit_complete: boolean;
  next_stage_ready: boolean;
};

export type MvHighPriorityItemResolutionEvidenceAuditManifest = {
  manifest_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PHASE;
  generated_at: string;
  evidence_type: EvidenceType;
  evidence_verified: boolean;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  reentry_ready: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: EvidenceAuditStatus;
  next_stage_ready: EvidenceAuditStatus;
  certification_status: typeof HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED_STATUS | null;
};

export type MvHighPriorityItemResolutionEvidenceAuditReport = {
  report_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PHASE;
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
  source_completion_audit_ref: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH;
  mv_high_priority_item_resolution_completion_audit_report_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_REPORT_PATH;
  mv_high_priority_item_resolution_evidence_audit_export_dir: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_EXPORT_DIR;
  mv_high_priority_item_resolution_evidence_audit_manifest_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH;
  mv_high_priority_item_resolution_evidence_audit_artifact_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH;
  resolution_evidence_audit_id: string;
  source_count: number;
  adapter_count: number;
  resolved_item_ids: string[];
  unresolved_item_ids: string[];
  evidence_type: EvidenceType;
  resolution_evidence_ref: ResolutionEvidenceRefByItem;
  evidence_verified: boolean;
  evidence_verification_reason: EvidenceVerificationReason;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  reentry_ready: boolean;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  completion_audit_consumed: EvidenceAuditStatus;
  evidence_type_valid: EvidenceAuditStatus;
  resolution_evidence_ref_valid: EvidenceAuditStatus;
  evidence_verified_valid: EvidenceAuditStatus;
  evidence_verification_reason_valid: EvidenceAuditStatus;
  resolved_high_priority_count_valid: EvidenceAuditStatus;
  remaining_high_priority_count_valid: EvidenceAuditStatus;
  reentry_ready_valid: EvidenceAuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: EvidenceAuditStatus;
  next_stage_ready: EvidenceAuditStatus;
  resolution_evidence_missing: boolean;
  evidence_not_verified: boolean;
  resolved_item_without_evidence: boolean;
  evidence_type_invalid: boolean;
  completion_audit_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_high_priority_item_resolution_evidence_audit_ready: EvidenceAuditStatus;
  certification_status: typeof HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED_STATUS | null;
  next_stage_approved: boolean;
  evidence_audit_checks: EvidenceAuditCheck[];
  final_verdict:
    | typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PASS_VERDICT
    | typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_FAIL_VERDICT;
  issues: MvHighPriorityItemResolutionEvidenceAuditIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_EXPORT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_REPORT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): EvidenceAuditStatus {
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

function resolveEvidenceType(remainingHighPriorityCount: number): EvidenceType {
  return remainingHighPriorityCount > 0
    ? EVIDENCE_TYPE_UNRESOLVED_STATE_EVIDENCE
    : EVIDENCE_TYPE_RESOLUTION_EVIDENCE;
}

function resolveEvidenceVerificationReason(evidenceType: EvidenceType): EvidenceVerificationReason {
  return evidenceType === EVIDENCE_TYPE_UNRESOLVED_STATE_EVIDENCE
    ? EVIDENCE_VERIFICATION_REASON_UNRESOLVED_STATE_VERIFIED
    : EVIDENCE_VERIFICATION_REASON_RESOLUTION_VERIFIED;
}

function resolveReentryReady(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount === 0;
}

function loadExecutionEvidence(root: string, evidencePath: string): ExecutionEvidence | null {
  return loadJson<ExecutionEvidence>(root, evidencePath);
}

function verifyUnresolvedStateEvidence(
  root: string,
  unresolvedItemIds: string[],
  evidenceRef: ResolutionEvidenceRefByItem
): boolean {
  const unresolvedBlockerCodes = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.filter((blockerCode) =>
    unresolvedItemIds.includes(BLOCKER_CODE_TO_ITEM_ID[blockerCode])
  );
  if (unresolvedBlockerCodes.length !== unresolvedItemIds.length) return false;
  return unresolvedBlockerCodes.every((blockerCode) => {
    const evidencePath = evidenceRef[blockerCode];
    if (!evidencePath || !fs.existsSync(path.join(root, evidencePath))) return false;
    const evidence = loadExecutionEvidence(root, evidencePath);
    return (
      evidence !== null &&
      evidence.item_id === BLOCKER_CODE_TO_ITEM_ID[blockerCode] &&
      evidence.resolution_status !== RESOLUTION_PROGRESS_STATUS_RESOLVED
    );
  });
}

function verifyResolutionEvidence(
  root: string,
  resolvedItemIds: string[],
  evidenceRef: ResolutionEvidenceRefByItem
): boolean {
  const resolvedBlockerCodes = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.filter((blockerCode) =>
    resolvedItemIds.includes(BLOCKER_CODE_TO_ITEM_ID[blockerCode])
  );
  if (resolvedBlockerCodes.length !== resolvedItemIds.length) return false;
  return resolvedBlockerCodes.every((blockerCode) => {
    const evidencePath = evidenceRef[blockerCode];
    if (!evidencePath || !fs.existsSync(path.join(root, evidencePath))) return false;
    const evidence = loadExecutionEvidence(root, evidencePath);
    return (
      evidence !== null &&
      evidence.item_id === BLOCKER_CODE_TO_ITEM_ID[blockerCode] &&
      evidence.resolution_status === RESOLUTION_PROGRESS_STATUS_RESOLVED
    );
  });
}

function hasResolvedItemWithoutEvidence(
  root: string,
  resolvedItemIds: string[],
  evidenceRef: ResolutionEvidenceRefByItem
): boolean {
  if (resolvedItemIds.length === 0) return false;
  return !verifyResolutionEvidence(root, resolvedItemIds, evidenceRef);
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvHighPriorityItemResolutionEvidenceAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvHighPriorityItemResolutionEvidenceAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvHighPriorityItemResolutionEvidenceAuditReport = {
    report_id: 'mv-high-priority-item-resolution-evidence-audit-report-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PHASE,
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
    source_completion_audit_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
    mv_high_priority_item_resolution_completion_audit_report_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_REPORT_PATH,
    mv_high_priority_item_resolution_evidence_audit_export_dir:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_EXPORT_DIR,
    mv_high_priority_item_resolution_evidence_audit_manifest_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH,
    mv_high_priority_item_resolution_evidence_audit_artifact_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH,
    resolution_evidence_audit_id: 'mv-high-priority-item-resolution-evidence-audit-v1',
    source_count: 0,
    adapter_count: 0,
    resolved_item_ids: [],
    unresolved_item_ids: [],
    evidence_type: EVIDENCE_TYPE_UNRESOLVED_STATE_EVIDENCE,
    resolution_evidence_ref: {} as ResolutionEvidenceRefByItem,
    evidence_verified: false,
    evidence_verification_reason: EVIDENCE_VERIFICATION_REASON_UNRESOLVED_STATE_VERIFIED,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    reentry_ready: false,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: [],
    completion_audit_consumed: 'FAIL',
    evidence_type_valid: 'FAIL',
    resolution_evidence_ref_valid: 'FAIL',
    evidence_verified_valid: 'FAIL',
    evidence_verification_reason_valid: 'FAIL',
    resolved_high_priority_count_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    reentry_ready_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    resolution_evidence_missing: true,
    evidence_not_verified: true,
    resolved_item_without_evidence: true,
    evidence_type_invalid: true,
    completion_audit_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_high_priority_item_resolution_evidence_audit_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    evidence_audit_checks: [],
    final_verdict: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvHighPriorityItemResolutionEvidenceAudit(
  projectRoot?: string
): MvHighPriorityItemResolutionEvidenceAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvHighPriorityItemResolutionEvidenceAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const completionAuditReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: EvidenceAuditStatus;
    mv_high_priority_item_resolution_completion_audit_ready: EvidenceAuditStatus;
    traceability_preserved: boolean;
    resolved_item_ids: string[];
    unresolved_item_ids: string[];
    resolved_high_priority_count: number;
    remaining_high_priority_count: number;
    resolution_evidence_ref: ResolutionEvidenceRefByItem;
    reentry_ready: boolean;
  }>(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_REPORT_PATH);

  const completionAuditArtifact = loadJson<MvHighPriorityItemResolutionCompletionAuditArtifact>(
    root,
    MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH
  );
  const completionAuditManifestPath = path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_MANIFEST_PATH);

  if (
    !completionAuditReport ||
    !completionAuditArtifact ||
    !fs.existsSync(completionAuditManifestPath) ||
    completionAuditReport.final_verdict !== MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PASS_VERDICT ||
    completionAuditReport.certification_status !== HIGH_PRIORITY_RESOLUTION_COMPLETION_AUDITED_STATUS ||
    completionAuditReport.next_stage_ready !== 'PASS' ||
    completionAuditReport.mv_high_priority_item_resolution_completion_audit_ready !== 'PASS'
  ) {
    issues.push({
      code: 'COMPLETION_AUDIT_MISSING',
      message: `Required ${MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_PASS_VERDICT} with ${HIGH_PRIORITY_RESOLUTION_COMPLETION_AUDITED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const completionAuditConsumed =
    completionAuditArtifact.resolution_completion_audit_complete === true &&
    completionAuditArtifact.next_stage_ready === true;

  const resolvedItemIds = completionAuditArtifact.resolved_item_ids;
  const unresolvedItemIds = completionAuditArtifact.unresolved_item_ids;
  const resolvedHighPriorityCount = completionAuditArtifact.resolved_high_priority_count;
  const remainingHighPriorityCount = completionAuditArtifact.remaining_high_priority_count;
  const resolutionEvidenceRef = completionAuditArtifact.resolution_evidence_ref;
  const evidenceType = resolveEvidenceType(remainingHighPriorityCount);
  const evidenceVerificationReason = resolveEvidenceVerificationReason(evidenceType);
  const reentryReady = resolveReentryReady(remainingHighPriorityCount);

  const traceabilityChains = completionAuditArtifact.traceability_chain;
  const traceabilityPreserved =
    completionAuditReport.traceability_preserved === true &&
    completionAuditArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const resolutionEvidenceRefValid = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => {
    const evidencePath = resolutionEvidenceRef[blockerCode];
    return (
      evidencePath !== undefined &&
      evidencePath === completionAuditReport.resolution_evidence_ref[blockerCode] &&
      fs.existsSync(path.join(root, evidencePath))
    );
  });

  const unresolvedStateEvidenceValid = verifyUnresolvedStateEvidence(
    root,
    unresolvedItemIds,
    resolutionEvidenceRef
  );
  const resolutionEvidenceValid = verifyResolutionEvidence(root, resolvedItemIds, resolutionEvidenceRef);

  const evidenceVerified =
    evidenceType === EVIDENCE_TYPE_UNRESOLVED_STATE_EVIDENCE
      ? unresolvedStateEvidenceValid && resolutionEvidenceRefValid
      : resolutionEvidenceValid && resolutionEvidenceRefValid;

  const evidenceTypeValid =
    evidenceType === resolveEvidenceType(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0
      ? evidenceType === EVIDENCE_TYPE_UNRESOLVED_STATE_EVIDENCE
      : evidenceType === EVIDENCE_TYPE_RESOLUTION_EVIDENCE);

  const evidenceVerifiedValid =
    evidenceVerified === true &&
    (remainingHighPriorityCount > 0
      ? unresolvedStateEvidenceValid
      : resolutionEvidenceValid);

  const evidenceVerificationReasonValid =
    evidenceVerificationReason === resolveEvidenceVerificationReason(evidenceType) &&
    (evidenceType === EVIDENCE_TYPE_UNRESOLVED_STATE_EVIDENCE
      ? evidenceVerificationReason === EVIDENCE_VERIFICATION_REASON_UNRESOLVED_STATE_VERIFIED
      : evidenceVerificationReason === EVIDENCE_VERIFICATION_REASON_RESOLUTION_VERIFIED);

  const resolvedHighPriorityCountValid =
    resolvedHighPriorityCount === resolvedItemIds.length &&
    resolvedHighPriorityCount === completionAuditReport.resolved_high_priority_count;

  const remainingHighPriorityCountValid =
    remainingHighPriorityCount === unresolvedItemIds.length &&
    remainingHighPriorityCount === completionAuditReport.remaining_high_priority_count &&
    resolvedHighPriorityCount + remainingHighPriorityCount === EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.length;

  const reentryReadyValid =
    reentryReady === resolveReentryReady(remainingHighPriorityCount) &&
    (remainingHighPriorityCount > 0 ? reentryReady === false : reentryReady === true);

  const resolutionEvidenceMissing = !resolutionEvidenceRefValid;
  const evidenceNotVerified = !evidenceVerified;
  const resolvedItemWithoutEvidence = hasResolvedItemWithoutEvidence(
    root,
    resolvedItemIds,
    resolutionEvidenceRef
  );
  const evidenceTypeInvalid = !evidenceTypeValid;

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const completionAuditMissing = !completionAuditConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const resolutionEvidenceAuditComplete =
    completionAuditConsumed &&
    evidenceTypeValid &&
    resolutionEvidenceRefValid &&
    evidenceVerifiedValid &&
    evidenceVerificationReasonValid &&
    resolvedHighPriorityCountValid &&
    remainingHighPriorityCountValid &&
    reentryReadyValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !resolutionEvidenceMissing &&
    !evidenceNotVerified &&
    !resolvedItemWithoutEvidence &&
    !evidenceTypeInvalid &&
    (remainingHighPriorityCount > 0
      ? evidenceType === EVIDENCE_TYPE_UNRESOLVED_STATE_EVIDENCE &&
        evidenceVerified === true &&
        reentryReady === false
      : evidenceType === EVIDENCE_TYPE_RESOLUTION_EVIDENCE &&
        evidenceVerified === true &&
        reentryReady === true);

  const nextStageReady = resolutionEvidenceAuditComplete;

  if (completionAuditMissing) {
    issues.push({
      code: 'COMPLETION_AUDIT_MISSING',
      message: 'High priority item resolution completion audit was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (resolutionEvidenceMissing) {
    issues.push({
      code: 'RESOLUTION_EVIDENCE_MISSING',
      message: 'Resolution evidence references are missing or invalid',
      severity: 'error',
      check_id: 'resolution_evidence_ref_valid',
    });
  }
  if (evidenceNotVerified) {
    issues.push({
      code: 'EVIDENCE_NOT_VERIFIED',
      message: 'Evidence verification failed for current resolution state',
      severity: 'error',
      check_id: 'evidence_verified_valid',
    });
  }
  if (resolvedItemWithoutEvidence) {
    issues.push({
      code: 'RESOLVED_ITEM_WITHOUT_EVIDENCE',
      message: 'Resolved items are missing resolution evidence',
      severity: 'error',
    });
  }
  if (evidenceTypeInvalid) {
    issues.push({
      code: 'EVIDENCE_TYPE_INVALID',
      message: 'Evidence type does not match remaining high priority count',
      severity: 'error',
      check_id: 'evidence_type_valid',
    });
  }

  const evidenceAuditChecks: EvidenceAuditCheck[] = [
    {
      check_id: 'evidence_type_valid',
      check_label: 'Evidence Type Valid',
      status: toStatus(evidenceTypeValid),
    },
    {
      check_id: 'resolution_evidence_ref_valid',
      check_label: 'Resolution Evidence Ref Valid',
      status: toStatus(resolutionEvidenceRefValid),
    },
    {
      check_id: 'evidence_verified_valid',
      check_label: 'Evidence Verified Valid',
      status: toStatus(evidenceVerifiedValid),
    },
    {
      check_id: 'evidence_verification_reason_valid',
      check_label: 'Evidence Verification Reason Valid',
      status: toStatus(evidenceVerificationReasonValid),
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
      check_id: 'reentry_ready_valid',
      check_label: 'Reentry Ready Valid',
      status: toStatus(reentryReadyValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvHighPriorityItemResolutionEvidenceAuditArtifact = {
    resolution_evidence_audit_id: 'mv-high-priority-item-resolution-evidence-audit-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PHASE,
    generated_at: timestamp,
    source_completion_audit_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
    resolution_completion_audit_id: completionAuditArtifact.resolution_completion_audit_id,
    resolved_item_ids: resolvedItemIds,
    unresolved_item_ids: unresolvedItemIds,
    evidence_type: evidenceType,
    resolution_evidence_ref: resolutionEvidenceRef,
    evidence_verified: evidenceVerified,
    evidence_verification_reason: evidenceVerificationReason,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
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
      resolution_evidence_audit_artifact_write_scope: RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    resolution_evidence_audit_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvHighPriorityItemResolutionEvidenceAuditManifest = {
    manifest_id: 'mv-high-priority-item-resolution-evidence-audit-manifest-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PHASE,
    generated_at: timestamp,
    evidence_type: evidenceType,
    evidence_verified: evidenceVerified,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_ready: reentryReady,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvHighPriorityItemResolutionEvidenceAuditReport = {
    report_id: 'mv-high-priority-item-resolution-evidence-audit-report-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PHASE,
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
    source_completion_audit_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
    mv_high_priority_item_resolution_completion_audit_report_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_REPORT_PATH,
    mv_high_priority_item_resolution_evidence_audit_export_dir:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_EXPORT_DIR,
    mv_high_priority_item_resolution_evidence_audit_manifest_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH,
    mv_high_priority_item_resolution_evidence_audit_artifact_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH,
    resolution_evidence_audit_id: 'mv-high-priority-item-resolution-evidence-audit-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    resolved_item_ids: resolvedItemIds,
    unresolved_item_ids: unresolvedItemIds,
    evidence_type: evidenceType,
    resolution_evidence_ref: resolutionEvidenceRef,
    evidence_verified: evidenceVerified,
    evidence_verification_reason: evidenceVerificationReason,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_ready: reentryReady,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: traceabilityChains,
    completion_audit_consumed: toStatus(completionAuditConsumed),
    evidence_type_valid: toStatus(evidenceTypeValid),
    resolution_evidence_ref_valid: toStatus(resolutionEvidenceRefValid),
    evidence_verified_valid: toStatus(evidenceVerifiedValid),
    evidence_verification_reason_valid: toStatus(evidenceVerificationReasonValid),
    resolved_high_priority_count_valid: toStatus(resolvedHighPriorityCountValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    reentry_ready_valid: toStatus(reentryReadyValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    resolution_evidence_missing: resolutionEvidenceMissing,
    evidence_not_verified: evidenceNotVerified,
    resolved_item_without_evidence: resolvedItemWithoutEvidence,
    evidence_type_invalid: evidenceTypeInvalid,
    completion_audit_missing: completionAuditMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_high_priority_item_resolution_evidence_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED_STATUS : null,
    next_stage_approved: pass,
    evidence_audit_checks: evidenceAuditChecks,
    final_verdict: pass
      ? MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PASS_VERDICT
      : MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
