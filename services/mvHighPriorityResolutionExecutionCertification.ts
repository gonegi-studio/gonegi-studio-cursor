import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH } from './mvProductionBlockerAudit.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES,
  RESOLUTION_STATUS_OPEN,
  RESOLUTION_STATUS_RESOLVED,
  type HighPriorityBlockerCode,
  type ResolutionStatus,
  type ResolutionStatusByItem,
} from './mvHighPriorityResolutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH,
  RESOLUTION_TARGET_PHASE,
  type MvHighPriorityResolutionAuditHardeningArtifact,
} from './mvHighPriorityResolutionAuditHardening.js';
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

export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PHASE =
  'PHASE-DIGITAL-STUDIO-022-MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT =
  'PASS_MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS =
  'MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_022B_ENTRY' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_DIR =
  'reports/mv_high_priority_resolution_execution_certification' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH =
  'reports/mv_high_priority_resolution_execution_certification/mv-high-priority-resolution-execution-certification-report.json' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MD_PATH =
  'reports/mv_high_priority_resolution_execution_certification/MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION.md' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_EXPORT_DIR =
  'exports/mv_high_priority_resolution_execution_certification' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH =
  'exports/mv_high_priority_resolution_execution_certification/mv-high-priority-resolution-execution-certification-manifest.json' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH =
  'exports/mv_high_priority_resolution_execution_certification/mv-high-priority-resolution-execution-certification.json' as const;

export const EXECUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE =
  'exports/mv_high_priority_resolution_execution_certification/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type MvHighPriorityResolutionExecutionCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  blocker_code?: string;
  check_id?: string;
};

export type CertificationCheck = {
  check_id: string;
  check_label: string;
  status: CertificationStatus;
};

export type MvHighPriorityResolutionExecutionCertificationArtifact = {
  certification_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PHASE;
  generated_at: string;
  source_hardening_ref: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH;
  hardening_id: string;
  high_priority_items: HighPriorityBlockerCode[];
  resolution_status_by_item: ResolutionStatusByItem;
  high_priority_resolution_target_met: boolean;
  high_priority_resolution_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  resolution_target_phase: typeof RESOLUTION_TARGET_PHASE;
  production_ready_dependency_required: boolean;
  critical_blocker_count: number;
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
    execution_certification_artifact_write_scope: typeof EXECUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  execution_certification_complete: boolean;
  next_stage_ready: boolean;
};

export type MvHighPriorityResolutionExecutionCertificationManifest = {
  manifest_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PHASE;
  generated_at: string;
  high_priority_resolution_target_met: boolean;
  remaining_high_priority_count: number;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  certification_status: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS | null;
};

export type MvHighPriorityResolutionExecutionCertificationReport = {
  report_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PHASE;
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
  source_hardening_ref: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH;
  mv_high_priority_resolution_audit_hardening_report_path: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH;
  mv_high_priority_resolution_execution_certification_export_dir: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_EXPORT_DIR;
  mv_high_priority_resolution_execution_certification_manifest_path: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH;
  mv_high_priority_resolution_execution_certification_artifact_path: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  certification_id: string;
  source_count: number;
  adapter_count: number;
  high_priority_items: HighPriorityBlockerCode[];
  resolution_status_by_item: ResolutionStatusByItem;
  high_priority_resolution_target_met: boolean;
  high_priority_resolution_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  hardening_consumed: CertificationStatus;
  execution_targets_defined: CertificationStatus;
  resolution_status_tracked: CertificationStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  hardening_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_high_priority_resolution_execution_certification_ready: CertificationStatus;
  certification_status: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS | null;
  next_stage_approved: boolean;
  certification_checks: CertificationCheck[];
  final_verdict:
    | typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT
    | typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_FAIL_VERDICT;
  issues: MvHighPriorityResolutionExecutionCertificationIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_EXPORT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): CertificationStatus {
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

function isHighPriorityBlockerCode(value: string): value is HighPriorityBlockerCode {
  return (EXPECTED_HIGH_PRIORITY_BLOCKER_CODES as readonly string[]).includes(value);
}

function buildResolutionStatusByItem(
  highPriorityItems: HighPriorityBlockerCode[],
  resolvedCount: number
): ResolutionStatusByItem {
  const statusByItem: ResolutionStatusByItem = {};
  highPriorityItems.forEach((blockerCode, index) => {
    statusByItem[blockerCode] =
      index < resolvedCount ? RESOLUTION_STATUS_RESOLVED : RESOLUTION_STATUS_OPEN;
  });
  return statusByItem;
}

function resolveHighPriorityResolutionTargetMet(
  remainingHighPriorityCount: number,
  resolvedHighPriorityCount: number,
  highPriorityResolutionCount: number,
  resolutionStatusByItem: ResolutionStatusByItem
): boolean {
  return (
    remainingHighPriorityCount === 0 &&
    resolvedHighPriorityCount === highPriorityResolutionCount &&
    Object.values(resolutionStatusByItem).every((status) => status === RESOLUTION_STATUS_RESOLVED)
  );
}

function buildMarkdown(report: MvHighPriorityResolutionExecutionCertificationReport): string {
  const lines = [
    '# MV High Priority Resolution Execution Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Status:** ${report.certification_status ?? 'NONE'}`,
    `**High Priority Resolution Target Met:** ${report.high_priority_resolution_target_met}`,
    `**Remaining High Priority Count:** ${report.remaining_high_priority_count}`,
    '',
    '## Resolution Status By Item',
    '',
  ];
  for (const [blockerCode, status] of Object.entries(report.resolution_status_by_item)) {
    lines.push(`- ${blockerCode}: ${status}`);
  }
  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvHighPriorityResolutionExecutionCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvHighPriorityResolutionExecutionCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvHighPriorityResolutionExecutionCertificationReport = {
    report_id: 'mv-high-priority-resolution-execution-certification-report-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PHASE,
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
    source_hardening_ref: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
    mv_high_priority_resolution_audit_hardening_report_path:
      MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH,
    mv_high_priority_resolution_execution_certification_export_dir:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_EXPORT_DIR,
    mv_high_priority_resolution_execution_certification_manifest_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH,
    mv_high_priority_resolution_execution_certification_artifact_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    certification_id: 'mv-high-priority-resolution-execution-certification-v1',
    source_count: 0,
    adapter_count: 0,
    high_priority_items: [],
    resolution_status_by_item: {},
    high_priority_resolution_target_met: false,
    high_priority_resolution_count: 0,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    hardening_consumed: 'FAIL',
    execution_targets_defined: 'FAIL',
    resolution_status_tracked: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    hardening_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_high_priority_resolution_execution_certification_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    certification_checks: [],
    final_verdict: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');
  return report;
}

export function writeMvHighPriorityResolutionExecutionCertification(
  projectRoot?: string
): MvHighPriorityResolutionExecutionCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvHighPriorityResolutionExecutionCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const hardeningReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: CertificationStatus;
    mv_high_priority_resolution_audit_hardening_ready: CertificationStatus;
    traceability_preserved: boolean;
    remaining_high_priority_count: number;
    resolved_high_priority_count: number;
    high_priority_resolution_count: number;
  }>(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH);

  const hardeningArtifact = loadJson<MvHighPriorityResolutionAuditHardeningArtifact>(
    root,
    MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH
  );
  const hardeningManifestPath = path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH);

  if (
    !hardeningReport ||
    !hardeningArtifact ||
    !fs.existsSync(hardeningManifestPath) ||
    hardeningReport.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT ||
    hardeningReport.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS ||
    hardeningReport.next_stage_ready !== 'PASS' ||
    hardeningReport.mv_high_priority_resolution_audit_hardening_ready !== 'PASS'
  ) {
    issues.push({
      code: 'HARDENING_MISSING',
      message: `Required ${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT} with ${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const auditArtifact = loadJson<{ critical_blocker_count: number }>(
    root,
    MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH
  );
  if (!auditArtifact) {
    issues.push({ code: 'BLOCKER_AUDIT_ARTIFACT_MISSING', message: 'Missing blocker audit artifact', severity: 'error' });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const hardeningConsumed =
    hardeningArtifact.hardening_complete === true &&
    hardeningArtifact.next_stage_ready === true &&
    hardeningArtifact.next_stage_gate_label === 'DS_022_ENTRY' &&
    hardeningArtifact.production_ready_dependency.required === true;

  const highPriorityItems = hardeningArtifact.high_priority_items.filter(isHighPriorityBlockerCode);
  const resolvedHighPriorityCount = hardeningArtifact.resolved_high_priority_count;
  const remainingHighPriorityCount = hardeningArtifact.remaining_high_priority_count;
  const highPriorityResolutionCount = hardeningArtifact.high_priority_resolution_count;
  const resolutionStatusByItem = buildResolutionStatusByItem(highPriorityItems, resolvedHighPriorityCount);
  const highPriorityResolutionTargetMet = resolveHighPriorityResolutionTargetMet(
    remainingHighPriorityCount,
    resolvedHighPriorityCount,
    highPriorityResolutionCount,
    resolutionStatusByItem
  );

  const traceabilityChains = hardeningArtifact.traceability_chain;
  const traceabilityPreserved =
    hardeningReport.traceability_preserved === true &&
    hardeningArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const executionTargetsDefined =
    highPriorityItems.every(
      (blockerCode) => hardeningArtifact.resolution_target_phase[blockerCode] === RESOLUTION_TARGET_PHASE
    ) && Object.keys(hardeningArtifact.acceptance_criteria).length === highPriorityItems.length;

  const resolutionStatusTracked =
    highPriorityItems.every((blockerCode) => resolutionStatusByItem[blockerCode] !== undefined) &&
    resolvedHighPriorityCount + remainingHighPriorityCount === highPriorityResolutionCount;

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(EXECUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const executionCertificationComplete =
    hardeningConsumed &&
    executionTargetsDefined &&
    resolutionStatusTracked &&
    traceabilityPreserved &&
    safeCreatePolicyVerified;

  const nextStageReady = executionCertificationComplete;

  if (!hardeningConsumed) issues.push({ code: 'HARDENING_MISSING', message: 'Audit hardening was not consumed', severity: 'error' });
  if (!traceabilityPreserved) issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  if (!safeCreatePolicyVerified) issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });

  const certificationChecks: CertificationCheck[] = [
    { check_id: 'hardening_consumed', check_label: 'Hardening Consumed', status: toStatus(hardeningConsumed) },
    { check_id: 'execution_targets_defined', check_label: 'Execution Targets Defined', status: toStatus(executionTargetsDefined) },
    { check_id: 'resolution_status_tracked', check_label: 'Resolution Status Tracked', status: toStatus(resolutionStatusTracked) },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvHighPriorityResolutionExecutionCertificationArtifact = {
    certification_id: 'mv-high-priority-resolution-execution-certification-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PHASE,
    generated_at: timestamp,
    source_hardening_ref: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
    hardening_id: hardeningArtifact.hardening_id,
    high_priority_items: highPriorityItems,
    resolution_status_by_item: resolutionStatusByItem,
    high_priority_resolution_target_met: highPriorityResolutionTargetMet,
    high_priority_resolution_count: highPriorityResolutionCount,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    resolution_target_phase: RESOLUTION_TARGET_PHASE,
    production_ready_dependency_required: hardeningArtifact.production_ready_dependency.required,
    critical_blocker_count: auditArtifact.critical_blocker_count,
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
      execution_certification_artifact_write_scope: EXECUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    execution_certification_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvHighPriorityResolutionExecutionCertificationManifest = {
    manifest_id: 'mv-high-priority-resolution-execution-certification-manifest-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PHASE,
    generated_at: timestamp,
    high_priority_resolution_target_met: highPriorityResolutionTargetMet,
    remaining_high_priority_count: remainingHighPriorityCount,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH), `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const report: MvHighPriorityResolutionExecutionCertificationReport = {
    report_id: 'mv-high-priority-resolution-execution-certification-report-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PHASE,
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
    source_hardening_ref: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
    mv_high_priority_resolution_audit_hardening_report_path: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH,
    mv_high_priority_resolution_execution_certification_export_dir: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_EXPORT_DIR,
    mv_high_priority_resolution_execution_certification_manifest_path: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH,
    mv_high_priority_resolution_execution_certification_artifact_path: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    certification_id: 'mv-high-priority-resolution-execution-certification-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    high_priority_items: highPriorityItems,
    resolution_status_by_item: resolutionStatusByItem,
    high_priority_resolution_target_met: highPriorityResolutionTargetMet,
    high_priority_resolution_count: highPriorityResolutionCount,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    hardening_consumed: toStatus(hardeningConsumed),
    execution_targets_defined: toStatus(executionTargetsDefined),
    resolution_status_tracked: toStatus(resolutionStatusTracked),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    hardening_missing: !hardeningConsumed,
    traceability_loss: !traceabilityPreserved,
    safe_create_policy_violation: !safeCreatePolicyVerified,
    mv_high_priority_resolution_execution_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS : null,
    next_stage_approved: pass,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT
      : MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');
  return report;
}
