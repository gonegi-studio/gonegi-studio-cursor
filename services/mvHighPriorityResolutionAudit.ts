import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_CANDIDATE_CERTIFIED_STATUS,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH,
  type MvProductionCandidateCertificationArtifact,
} from './mvProductionCandidateCertification.js';
import {
  MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
  type HighPriorityRequirement,
} from './mvProductionReadyEvaluation.js';
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

export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PHASE =
  'PHASE-DIGITAL-STUDIO-021-MV_HIGH_PRIORITY_RESOLUTION_AUDIT_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT =
  'PASS_MV_HIGH_PRIORITY_RESOLUTION_AUDIT_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_FAIL_VERDICT =
  'FAIL_MV_HIGH_PRIORITY_RESOLUTION_AUDIT_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS = 'MV_HIGH_PRIORITY_RESOLUTION_AUDITED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_022_ENTRY' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_DIR = 'reports/mv_high_priority_resolution_audit' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH =
  'reports/mv_high_priority_resolution_audit/mv-high-priority-resolution-audit-report.json' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MD_PATH =
  'reports/mv_high_priority_resolution_audit/MV_HIGH_PRIORITY_RESOLUTION_AUDIT.md' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_EXPORT_DIR =
  'exports/mv_high_priority_resolution_audit' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH =
  'exports/mv_high_priority_resolution_audit/mv-high-priority-resolution-audit-manifest.json' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH =
  'exports/mv_high_priority_resolution_audit/mv-high-priority-resolution-audit.json' as const;

export const HIGH_PRIORITY_AUDIT_ARTIFACT_WRITE_SCOPE = 'exports/mv_high_priority_resolution_audit/' as const;

export const RESOLUTION_STATUS_OPEN = 'OPEN' as const;
export const RESOLUTION_STATUS_RESOLVED = 'RESOLVED' as const;
export const RESOLUTION_STATUS_IN_PROGRESS = 'IN_PROGRESS' as const;

export const RESOLUTION_STATUSES = [
  RESOLUTION_STATUS_OPEN,
  RESOLUTION_STATUS_RESOLVED,
  RESOLUTION_STATUS_IN_PROGRESS,
] as const;

export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

export const EXPECTED_HIGH_PRIORITY_BLOCKER_CODES = [
  'DATASET_REFS_EMPTY',
  'PRODUCTION_MODE_BLOCKED',
  'REAL_GENERATION_BLOCKED',
] as const;

export type HighPriorityBlockerCode = (typeof EXPECTED_HIGH_PRIORITY_BLOCKER_CODES)[number];

export type ResolutionStatusByItem = Record<string, ResolutionStatus>;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type AuditStatus = 'PASS' | 'FAIL';

export type MvHighPriorityResolutionAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  blocker_code?: string;
  check_id?: string;
};

export type AuditCheck = {
  check_id: string;
  check_label: string;
  status: AuditStatus;
};

export type MvHighPriorityResolutionAuditArtifact = {
  audit_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PHASE;
  generated_at: string;
  source_candidate_certification_ref: typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH;
  certification_id: string;
  high_priority_items: HighPriorityBlockerCode[];
  resolution_status_by_item: ResolutionStatusByItem;
  required_for_production_ready: boolean;
  high_priority_resolution_count: number;
  resolved_high_priority_count: number;
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
    high_priority_audit_artifact_write_scope: typeof HIGH_PRIORITY_AUDIT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  audit_complete: boolean;
  next_stage_ready: boolean;
};

export type MvHighPriorityResolutionAuditManifest = {
  manifest_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PHASE;
  generated_at: string;
  high_priority_items: HighPriorityBlockerCode[];
  high_priority_resolution_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  required_for_production_ready: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: AuditStatus;
  next_stage_ready: AuditStatus;
  certification_status: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS | null;
};

export type MvHighPriorityResolutionAuditReport = {
  report_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PHASE;
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
  source_candidate_certification_ref: typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH;
  mv_production_candidate_certification_report_path: typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH;
  mv_high_priority_resolution_audit_export_dir: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_EXPORT_DIR;
  mv_high_priority_resolution_audit_manifest_path: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH;
  mv_high_priority_resolution_audit_artifact_path: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH;
  audit_id: string;
  source_count: number;
  adapter_count: number;
  high_priority_items: HighPriorityBlockerCode[];
  resolution_status_by_item: ResolutionStatusByItem;
  required_for_production_ready: boolean;
  high_priority_resolution_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  candidate_certification_consumed: AuditStatus;
  high_priority_items_valid: AuditStatus;
  resolution_status_by_item_valid: AuditStatus;
  required_for_production_ready_valid: AuditStatus;
  remaining_high_priority_count_valid: AuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: AuditStatus;
  next_stage_ready: AuditStatus;
  high_priority_items_missing: boolean;
  resolution_status_invalid: boolean;
  production_ready_blocked: boolean;
  candidate_certification_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_high_priority_resolution_audit_ready: AuditStatus;
  certification_status: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS | null;
  next_stage_approved: boolean;
  audit_checks: AuditCheck[];
  final_verdict:
    | typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT
    | typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_FAIL_VERDICT;
  issues: MvHighPriorityResolutionAuditIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH,
] as const;

const HIGH_PRIORITY_AUDIT_EXPORT_WRITE_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_EXPORT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MD_PATH,
  ...HIGH_PRIORITY_AUDIT_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): AuditStatus {
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

function snapshotsUnchanged(
  root: string,
  snapshots: Record<string, FileSnapshot | null>
): boolean {
  return Object.entries(snapshots).every(([relativePath, snapshot]) => {
    const current = snapshotFile(root, relativePath);
    if (!snapshot || !current) return snapshot === current;
    return snapshot.size === current.size && snapshot.mtimeMs === current.mtimeMs;
  });
}

function isUnderHighPriorityAuditWriteScope(relativePath: string): boolean {
  return relativePath.startsWith(HIGH_PRIORITY_AUDIT_ARTIFACT_WRITE_SCOPE);
}

function isResolutionStatus(value: string): value is ResolutionStatus {
  return (RESOLUTION_STATUSES as readonly string[]).includes(value);
}

function isHighPriorityBlockerCode(value: string): value is HighPriorityBlockerCode {
  return (EXPECTED_HIGH_PRIORITY_BLOCKER_CODES as readonly string[]).includes(value);
}

function resolveResolutionStatus(requirement: HighPriorityRequirement): ResolutionStatus {
  if (requirement.resolved === true) {
    return RESOLUTION_STATUS_RESOLVED;
  }
  return RESOLUTION_STATUS_OPEN;
}

function buildHighPriorityItems(
  requirements: HighPriorityRequirement[]
): HighPriorityBlockerCode[] {
  return requirements
    .map((requirement) => requirement.blocker_code)
    .filter(isHighPriorityBlockerCode);
}

function buildResolutionStatusByItem(
  requirements: HighPriorityRequirement[]
): ResolutionStatusByItem {
  const statusByItem: ResolutionStatusByItem = {};
  for (const requirement of requirements) {
    if (!isHighPriorityBlockerCode(requirement.blocker_code)) {
      continue;
    }
    statusByItem[requirement.blocker_code] = resolveResolutionStatus(requirement);
  }
  return statusByItem;
}

function countResolvedFromStatus(statusByItem: ResolutionStatusByItem): number {
  return Object.values(statusByItem).filter((status) => status === RESOLUTION_STATUS_RESOLVED).length;
}

function countRemainingFromStatus(statusByItem: ResolutionStatusByItem): number {
  return Object.values(statusByItem).filter((status) => status === RESOLUTION_STATUS_OPEN).length;
}

function buildMarkdown(report: MvHighPriorityResolutionAuditReport): string {
  const lines = [
    '# MV High Priority Resolution Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Status:** ${report.certification_status ?? 'NONE'}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Audit Summary',
    '',
    `**High Priority Items:** ${report.high_priority_items.join(', ')}`,
    `**Required For Production Ready:** ${report.required_for_production_ready}`,
    `**High Priority Resolution Count:** ${report.high_priority_resolution_count}`,
    `**Resolved High Priority Count:** ${report.resolved_high_priority_count}`,
    `**Remaining High Priority Count:** ${report.remaining_high_priority_count}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
    '',
    '## Resolution Status By Item',
    '',
  ];

  for (const [blockerCode, status] of Object.entries(report.resolution_status_by_item)) {
    lines.push(`- ${blockerCode}: ${status}`);
  }

  lines.push('', '## Audit Checks', '');
  for (const check of report.audit_checks) {
    lines.push(`- ${check.check_id}: ${check.status}`);
  }

  if (report.issues.length > 0) {
    lines.push('', '## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvHighPriorityResolutionAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvHighPriorityResolutionAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvHighPriorityResolutionAuditReport = {
    report_id: 'mv-high-priority-resolution-audit-report-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PHASE,
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
    source_candidate_certification_ref: MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
    mv_production_candidate_certification_report_path: MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH,
    mv_high_priority_resolution_audit_export_dir: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_EXPORT_DIR,
    mv_high_priority_resolution_audit_manifest_path: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH,
    mv_high_priority_resolution_audit_artifact_path: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
    audit_id: 'mv-high-priority-resolution-audit-v1',
    source_count: 0,
    adapter_count: 0,
    high_priority_items: [],
    resolution_status_by_item: {},
    required_for_production_ready: false,
    high_priority_resolution_count: 0,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    candidate_certification_consumed: 'FAIL',
    high_priority_items_valid: 'FAIL',
    resolution_status_by_item_valid: 'FAIL',
    required_for_production_ready_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    high_priority_items_missing: true,
    resolution_status_invalid: true,
    production_ready_blocked: true,
    candidate_certification_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_high_priority_resolution_audit_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    audit_checks: [],
    final_verdict: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvHighPriorityResolutionAudit(
  projectRoot?: string
): MvHighPriorityResolutionAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvHighPriorityResolutionAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const candidateReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: AuditStatus;
    mv_production_candidate_certification_ready: AuditStatus;
    traceability_preserved: boolean;
    remaining_high_priority_count: number;
    resolved_high_priority_count: number;
    high_priority_requirement_count: number;
  }>(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH);

  const candidateArtifact = loadJson<MvProductionCandidateCertificationArtifact>(
    root,
    MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH
  );
  const candidateManifestPath = path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH);

  if (
    !candidateReport ||
    !candidateArtifact ||
    !fs.existsSync(candidateManifestPath) ||
    candidateReport.final_verdict !== MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT ||
    candidateReport.certification_status !== PRODUCTION_CANDIDATE_CERTIFIED_STATUS ||
    candidateReport.next_stage_ready !== 'PASS' ||
    candidateReport.mv_production_candidate_certification_ready !== 'PASS'
  ) {
    issues.push({
      code: 'CANDIDATE_CERTIFICATION_MISSING',
      message: `Required ${MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT} with ${PRODUCTION_CANDIDATE_CERTIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const evalArtifact = loadJson<{
    high_priority_requirements: HighPriorityRequirement[];
    high_priority_requirement_count: number;
    unresolved_high_priority_count: number;
  }>(root, MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH);

  if (!evalArtifact) {
    issues.push({
      code: 'EVALUATION_ARTIFACT_MISSING',
      message: 'Missing production ready evaluation artifact for high priority item cross-check',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const candidateCertificationConsumed =
    candidateArtifact.candidate_certification_complete === true &&
    candidateArtifact.next_stage_ready === true &&
    candidateArtifact.next_stage_gate_label === 'DS_021_ENTRY' &&
    candidateArtifact.production_candidate_certified === true &&
    candidateArtifact.target_readiness_tier === PRODUCTION_READINESS_TIER_PRODUCTION_READY &&
    candidateArtifact.current_readiness_tier === PRODUCTION_READINESS_TIER_TEST_READY;

  const highPriorityRequirements = evalArtifact.high_priority_requirements;
  const highPriorityItems = buildHighPriorityItems(highPriorityRequirements);
  const resolutionStatusByItem = buildResolutionStatusByItem(highPriorityRequirements);
  const highPriorityResolutionCount = highPriorityItems.length;
  const resolvedHighPriorityCount = countResolvedFromStatus(resolutionStatusByItem);
  const remainingHighPriorityCount = countRemainingFromStatus(resolutionStatusByItem);
  const requiredForProductionReady = highPriorityResolutionCount > 0;

  const traceabilityChains = candidateArtifact.traceability_chain;
  const traceabilityPreserved =
    candidateReport.traceability_preserved === true &&
    candidateArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const highPriorityItemsValid =
    highPriorityItems.length === EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.length &&
    highPriorityItems.length === candidateReport.high_priority_requirement_count &&
    highPriorityItems.length === evalArtifact.high_priority_requirement_count &&
    EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => highPriorityItems.includes(blockerCode));

  const resolutionStatusByItemValid =
    highPriorityItemsValid &&
    highPriorityItems.every(
      (blockerCode) =>
        resolutionStatusByItem[blockerCode] !== undefined &&
        isResolutionStatus(resolutionStatusByItem[blockerCode])
    ) &&
    Object.keys(resolutionStatusByItem).length === highPriorityItems.length &&
    highPriorityRequirements.every((requirement) => {
      if (!isHighPriorityBlockerCode(requirement.blocker_code)) {
        return true;
      }
      const status = resolutionStatusByItem[requirement.blocker_code];
      return requirement.resolved === true
        ? status === RESOLUTION_STATUS_RESOLVED
        : status === RESOLUTION_STATUS_OPEN || status === RESOLUTION_STATUS_IN_PROGRESS;
    });

  const requiredForProductionReadyValid =
    requiredForProductionReady === true && highPriorityResolutionCount > 0;

  const remainingHighPriorityCountValid =
    remainingHighPriorityCount === candidateReport.remaining_high_priority_count &&
    remainingHighPriorityCount === candidateArtifact.remaining_high_priority_count &&
    remainingHighPriorityCount === evalArtifact.unresolved_high_priority_count &&
    resolvedHighPriorityCount === candidateReport.resolved_high_priority_count &&
    resolvedHighPriorityCount === candidateArtifact.resolved_high_priority_count &&
    resolvedHighPriorityCount + remainingHighPriorityCount === highPriorityResolutionCount;

  const highPriorityAuditWriteScopeValid = HIGH_PRIORITY_AUDIT_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderHighPriorityAuditWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && highPriorityAuditWriteScopeValid;

  const highPriorityItemsMissing = !highPriorityItemsValid;
  const resolutionStatusInvalid = !resolutionStatusByItemValid;
  const productionReadyBlocked =
    remainingHighPriorityCount === 0 &&
    Object.values(resolutionStatusByItem).some((status) => status === RESOLUTION_STATUS_OPEN);
  const candidateCertificationMissing = !candidateCertificationConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const auditComplete =
    candidateCertificationConsumed &&
    highPriorityItemsValid &&
    resolutionStatusByItemValid &&
    requiredForProductionReadyValid &&
    remainingHighPriorityCountValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !productionReadyBlocked;

  const nextStageReady = auditComplete;

  if (candidateCertificationMissing) {
    issues.push({
      code: 'CANDIDATE_CERTIFICATION_MISSING',
      message: 'Production candidate certification was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across high priority resolution audit',
      severity: 'error',
    });
  }
  if (safeCreatePolicyViolation) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }
  if (highPriorityItemsMissing) {
    issues.push({
      code: 'HIGH_PRIORITY_ITEMS_MISSING',
      message: 'High priority items are missing or invalid',
      severity: 'error',
      check_id: 'high_priority_items_valid',
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
  if (!requiredForProductionReadyValid) {
    issues.push({
      code: 'REQUIRED_FOR_PRODUCTION_READY_INVALID',
      message: 'Required for production ready flag is invalid',
      severity: 'error',
      check_id: 'required_for_production_ready_valid',
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
  if (productionReadyBlocked) {
    issues.push({
      code: 'PRODUCTION_READY_BLOCKED',
      message: 'Production ready path is blocked by inconsistent resolution status tracking',
      severity: 'error',
    });
  }

  const auditChecks: AuditCheck[] = [
    {
      check_id: 'high_priority_items_valid',
      check_label: 'High Priority Items Valid',
      status: toStatus(highPriorityItemsValid),
    },
    {
      check_id: 'resolution_status_by_item_valid',
      check_label: 'Resolution Status By Item Valid',
      status: toStatus(resolutionStatusByItemValid),
    },
    {
      check_id: 'required_for_production_ready_valid',
      check_label: 'Required For Production Ready Valid',
      status: toStatus(requiredForProductionReadyValid),
    },
    {
      check_id: 'remaining_high_priority_count_valid',
      check_label: 'Remaining High Priority Count Valid',
      status: toStatus(remainingHighPriorityCountValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvHighPriorityResolutionAuditArtifact = {
    audit_id: 'mv-high-priority-resolution-audit-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PHASE,
    generated_at: timestamp,
    source_candidate_certification_ref: MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
    certification_id: candidateArtifact.certification_id,
    high_priority_items: highPriorityItems,
    resolution_status_by_item: resolutionStatusByItem,
    required_for_production_ready: requiredForProductionReady,
    high_priority_resolution_count: highPriorityResolutionCount,
    resolved_high_priority_count: resolvedHighPriorityCount,
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
      high_priority_audit_artifact_write_scope: HIGH_PRIORITY_AUDIT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    audit_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvHighPriorityResolutionAuditManifest = {
    manifest_id: 'mv-high-priority-resolution-audit-manifest-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PHASE,
    generated_at: timestamp,
    high_priority_items: highPriorityItems,
    high_priority_resolution_count: highPriorityResolutionCount,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    required_for_production_ready: requiredForProductionReady,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvHighPriorityResolutionAuditReport = {
    report_id: 'mv-high-priority-resolution-audit-report-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PHASE,
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
    source_candidate_certification_ref: MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
    mv_production_candidate_certification_report_path: MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH,
    mv_high_priority_resolution_audit_export_dir: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_EXPORT_DIR,
    mv_high_priority_resolution_audit_manifest_path: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH,
    mv_high_priority_resolution_audit_artifact_path: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
    audit_id: 'mv-high-priority-resolution-audit-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    high_priority_items: highPriorityItems,
    resolution_status_by_item: resolutionStatusByItem,
    required_for_production_ready: requiredForProductionReady,
    high_priority_resolution_count: highPriorityResolutionCount,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    candidate_certification_consumed: toStatus(candidateCertificationConsumed),
    high_priority_items_valid: toStatus(highPriorityItemsValid),
    resolution_status_by_item_valid: toStatus(resolutionStatusByItemValid),
    required_for_production_ready_valid: toStatus(requiredForProductionReadyValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    high_priority_items_missing: highPriorityItemsMissing,
    resolution_status_invalid: resolutionStatusInvalid,
    production_ready_blocked: productionReadyBlocked,
    candidate_certification_missing: candidateCertificationMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_high_priority_resolution_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS : null,
    next_stage_approved: pass,
    audit_checks: auditChecks,
    final_verdict: pass
      ? MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT
      : MV_HIGH_PRIORITY_RESOLUTION_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
