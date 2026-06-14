import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_CANDIDATE_CERTIFIED_STATUS,
  PRODUCTION_READY_CANDIDATE_STATUS,
} from './mvProductionCandidateCertification.js';
import {
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PASS_VERDICT,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH,
  type MvProductionReadyGateReentryHardeningArtifact,
} from './mvProductionReadyGateReentryHardening.js';
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

export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PHASE =
  'PHASE-DIGITAL-STUDIO-023C-MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_V1' as const;
export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_V1' as const;
export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_V1' as const;
export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS =
  'MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED' as const;
export const PRODUCTION_READY_STATUS_PRODUCTION_READY = 'PRODUCTION_READY' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_024_ENTRY' as const;
export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_DIR =
  'reports/mv_production_ready_gate_eligibility_audit_hardening' as const;
export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH =
  'reports/mv_production_ready_gate_eligibility_audit_hardening/mv-production-ready-gate-eligibility-audit-hardening-report.json' as const;
export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MD_PATH =
  'reports/mv_production_ready_gate_eligibility_audit_hardening/MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING.md' as const;
export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_EXPORT_DIR =
  'exports/mv_production_ready_gate_eligibility_audit_hardening' as const;
export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH =
  'exports/mv_production_ready_gate_eligibility_audit_hardening/mv-production-ready-gate-eligibility-audit-hardening-manifest.json' as const;
export const MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH =
  'exports/mv_production_ready_gate_eligibility_audit_hardening/mv-production-ready-gate-eligibility-audit-hardening.json' as const;

export const ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_ready_gate_eligibility_audit_hardening/' as const;

export type EligibilityProductionReadyStatus =
  | typeof PRODUCTION_CANDIDATE_CERTIFIED_STATUS
  | typeof PRODUCTION_READY_CANDIDATE_STATUS
  | typeof PRODUCTION_READY_STATUS_PRODUCTION_READY;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type EligibilityAuditStatus = 'PASS' | 'FAIL';

export type MvProductionReadyGateEligibilityAuditHardeningIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type EligibilityAuditCheck = {
  check_id: string;
  check_label: string;
  status: EligibilityAuditStatus;
};

export type MvProductionReadyGateEligibilityAuditHardeningArtifact = {
  eligibility_audit_hardening_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PHASE;
  generated_at: string;
  source_reentry_hardening_ref: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH;
  reentry_hardening_id: string;
  production_ready_status: EligibilityProductionReadyStatus;
  gate_reentry_required: boolean;
  production_ready: boolean;
  remaining_high_priority_count: number;
  gate_reentry_ready: boolean;
  ds_024_revalidation_required: boolean;
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
    eligibility_audit_hardening_artifact_write_scope: typeof ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  eligibility_audit_hardening_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyGateEligibilityAuditHardeningManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PHASE;
  generated_at: string;
  production_ready_status: EligibilityProductionReadyStatus;
  gate_reentry_required: boolean;
  production_ready: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: EligibilityAuditStatus;
  next_stage_ready: EligibilityAuditStatus;
  certification_status: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS | null;
};

export type MvProductionReadyGateEligibilityAuditHardeningReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PHASE;
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
  source_reentry_hardening_ref: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH;
  mv_production_ready_gate_reentry_hardening_report_path: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH;
  mv_production_ready_gate_eligibility_audit_hardening_export_dir: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_EXPORT_DIR;
  mv_production_ready_gate_eligibility_audit_hardening_manifest_path: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH;
  mv_production_ready_gate_eligibility_audit_hardening_artifact_path: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH;
  eligibility_audit_hardening_id: string;
  source_count: number;
  adapter_count: number;
  production_ready_status: EligibilityProductionReadyStatus;
  gate_reentry_required: boolean;
  production_ready: boolean;
  remaining_high_priority_count: number;
  ds_024_revalidation_required: boolean;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  reentry_hardening_consumed: EligibilityAuditStatus;
  production_ready_status_valid: EligibilityAuditStatus;
  gate_reentry_required_valid: EligibilityAuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: EligibilityAuditStatus;
  next_stage_ready: EligibilityAuditStatus;
  production_ready_status_invalid: boolean;
  gate_reentry_required_invalid: boolean;
  production_ready_certification_premature: boolean;
  reentry_hardening_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_gate_eligibility_audit_hardening_ready: EligibilityAuditStatus;
  certification_status: typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS | null;
  next_stage_approved: boolean;
  eligibility_audit_checks: EligibilityAuditCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_FAIL_VERDICT;
  issues: MvProductionReadyGateEligibilityAuditHardeningIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_DIR,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_EXPORT_DIR,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH,
  MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): EligibilityAuditStatus {
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

function resolveGateReentryRequired(remainingHighPriorityCount: number): boolean {
  return remainingHighPriorityCount > 0;
}

function resolveProductionReadyStatus(
  gateReentryRequired: boolean,
  candidateCertificationStatus: typeof PRODUCTION_CANDIDATE_CERTIFIED_STATUS | typeof PRODUCTION_READY_CANDIDATE_STATUS
): EligibilityProductionReadyStatus {
  if (gateReentryRequired) {
    return PRODUCTION_CANDIDATE_CERTIFIED_STATUS;
  }
  return candidateCertificationStatus;
}

function resolveProductionReady(gateReentryRequired: boolean, gateReentryReady: boolean): boolean {
  return !gateReentryRequired && gateReentryReady;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyGateEligibilityAuditHardeningIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyGateEligibilityAuditHardeningReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyGateEligibilityAuditHardeningReport = {
    report_id: 'mv-production-ready-gate-eligibility-audit-hardening-report-v1',
    phase: MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PHASE,
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
    source_reentry_hardening_ref: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH,
    mv_production_ready_gate_reentry_hardening_report_path: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH,
    mv_production_ready_gate_eligibility_audit_hardening_export_dir:
      MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_EXPORT_DIR,
    mv_production_ready_gate_eligibility_audit_hardening_manifest_path:
      MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH,
    mv_production_ready_gate_eligibility_audit_hardening_artifact_path:
      MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH,
    eligibility_audit_hardening_id: 'mv-production-ready-gate-eligibility-audit-hardening-v1',
    source_count: 0,
    adapter_count: 0,
    production_ready_status: PRODUCTION_CANDIDATE_CERTIFIED_STATUS,
    gate_reentry_required: false,
    production_ready: false,
    remaining_high_priority_count: 0,
    ds_024_revalidation_required: false,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    reentry_hardening_consumed: 'FAIL',
    production_ready_status_valid: 'FAIL',
    gate_reentry_required_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    production_ready_status_invalid: true,
    gate_reentry_required_invalid: true,
    production_ready_certification_premature: true,
    reentry_hardening_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_gate_eligibility_audit_hardening_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    eligibility_audit_checks: [],
    final_verdict: MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyGateEligibilityAuditHardening(
  projectRoot?: string
): MvProductionReadyGateEligibilityAuditHardeningReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyGateEligibilityAuditHardeningIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const reentryReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: EligibilityAuditStatus;
    mv_production_ready_gate_reentry_hardening_ready: EligibilityAuditStatus;
    traceability_preserved: boolean;
    gate_reentry_ready: boolean;
    remaining_high_priority_count: number;
  }>(root, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH);

  const reentryArtifact = loadJson<MvProductionReadyGateReentryHardeningArtifact>(
    root,
    MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH
  );
  const reentryManifestPath = path.join(root, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH);

  if (
    !reentryReport ||
    !reentryArtifact ||
    !fs.existsSync(reentryManifestPath) ||
    reentryReport.final_verdict !== MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PASS_VERDICT ||
    reentryReport.certification_status !== MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS ||
    reentryReport.next_stage_ready !== 'PASS' ||
    reentryReport.mv_production_ready_gate_reentry_hardening_ready !== 'PASS'
  ) {
    issues.push({
      code: 'REENTRY_HARDENING_MISSING',
      message: `Required ${MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PASS_VERDICT} with ${MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const candidateArtifact = loadJson<{
    production_candidate_certified: boolean;
    remaining_high_priority_count: number;
  }>(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH);

  if (!candidateArtifact || candidateArtifact.production_candidate_certified !== true) {
    issues.push({
      code: 'CANDIDATE_CERTIFICATION_MISSING',
      message: 'Missing production candidate certification for eligibility audit cross-check',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const reentryHardeningConsumed =
    reentryArtifact.reentry_hardening_complete === true &&
    reentryArtifact.next_stage_ready === true &&
    reentryArtifact.next_stage_gate_label === 'DS_024_ENTRY';

  const remainingHighPriorityCount = reentryArtifact.remaining_high_priority_count;
  const gateReentryRequired = resolveGateReentryRequired(remainingHighPriorityCount);
  const productionReadyStatus = resolveProductionReadyStatus(
    gateReentryRequired,
    PRODUCTION_CANDIDATE_CERTIFIED_STATUS
  );
  const productionReady = resolveProductionReady(gateReentryRequired, reentryArtifact.gate_reentry_ready);
  const ds024RevalidationRequired = gateReentryRequired;

  const traceabilityChains = reentryArtifact.traceability_chain;
  const traceabilityPreserved =
    reentryReport.traceability_preserved === true &&
    reentryArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const productionReadyStatusValid = gateReentryRequired
    ? productionReadyStatus === PRODUCTION_CANDIDATE_CERTIFIED_STATUS &&
      productionReady === false &&
      productionReadyStatus !== PRODUCTION_READY_STATUS_PRODUCTION_READY
    : productionReadyStatus === PRODUCTION_READY_CANDIDATE_STATUS &&
      productionReady === reentryArtifact.gate_reentry_ready;

  const gateReentryRequiredValid =
    gateReentryRequired === (remainingHighPriorityCount > 0) &&
    gateReentryRequired === !reentryArtifact.gate_reentry_ready &&
    gateReentryRequired === !reentryReport.gate_reentry_ready &&
    remainingHighPriorityCount === candidateArtifact.remaining_high_priority_count;

  const productionReadyCertificationPremature =
    productionReady === true ||
    productionReadyStatus === PRODUCTION_READY_STATUS_PRODUCTION_READY ||
    (gateReentryRequired && reentryArtifact.gate_reentry_ready === true);

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const productionReadyStatusInvalid = !productionReadyStatusValid;
  const gateReentryRequiredInvalid = !gateReentryRequiredValid;
  const reentryHardeningMissing = !reentryHardeningConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const eligibilityAuditHardeningComplete =
    reentryHardeningConsumed &&
    productionReadyStatusValid &&
    gateReentryRequiredValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !productionReadyCertificationPremature;

  const nextStageReady = eligibilityAuditHardeningComplete;

  if (reentryHardeningMissing) {
    issues.push({ code: 'REENTRY_HARDENING_MISSING', message: 'Gate reentry hardening was not consumed', severity: 'error' });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (productionReadyStatusInvalid) {
    issues.push({
      code: 'PRODUCTION_READY_STATUS_INVALID',
      message: 'Production ready status is invalid for current gate eligibility',
      severity: 'error',
      check_id: 'production_ready_status_valid',
    });
  }
  if (gateReentryRequiredInvalid) {
    issues.push({
      code: 'GATE_REENTRY_REQUIRED_INVALID',
      message: 'Gate reentry required flag is invalid',
      severity: 'error',
      check_id: 'gate_reentry_required_valid',
    });
  }
  if (productionReadyCertificationPremature) {
    issues.push({
      code: 'PRODUCTION_READY_CERTIFICATION_PREMATURE',
      message: 'Production ready certification would be premature before gate reentry',
      severity: 'error',
    });
  }

  const eligibilityAuditChecks: EligibilityAuditCheck[] = [
    {
      check_id: 'production_ready_status_valid',
      check_label: 'Production Ready Status Valid',
      status: toStatus(productionReadyStatusValid),
    },
    {
      check_id: 'gate_reentry_required_valid',
      check_label: 'Gate Reentry Required Valid',
      status: toStatus(gateReentryRequiredValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyGateEligibilityAuditHardeningArtifact = {
    eligibility_audit_hardening_id: 'mv-production-ready-gate-eligibility-audit-hardening-v1',
    phase: MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PHASE,
    generated_at: timestamp,
    source_reentry_hardening_ref: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH,
    reentry_hardening_id: reentryArtifact.reentry_hardening_id,
    production_ready_status: productionReadyStatus,
    gate_reentry_required: gateReentryRequired,
    production_ready: productionReady,
    remaining_high_priority_count: remainingHighPriorityCount,
    gate_reentry_ready: reentryArtifact.gate_reentry_ready,
    ds_024_revalidation_required: ds024RevalidationRequired,
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
      eligibility_audit_hardening_artifact_write_scope: ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    eligibility_audit_hardening_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyGateEligibilityAuditHardeningManifest = {
    manifest_id: 'mv-production-ready-gate-eligibility-audit-hardening-manifest-v1',
    phase: MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PHASE,
    generated_at: timestamp,
    production_ready_status: productionReadyStatus,
    gate_reentry_required: gateReentryRequired,
    production_ready: productionReady,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyGateEligibilityAuditHardeningReport = {
    report_id: 'mv-production-ready-gate-eligibility-audit-hardening-report-v1',
    phase: MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PHASE,
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
    source_reentry_hardening_ref: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH,
    mv_production_ready_gate_reentry_hardening_report_path: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH,
    mv_production_ready_gate_eligibility_audit_hardening_export_dir:
      MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_EXPORT_DIR,
    mv_production_ready_gate_eligibility_audit_hardening_manifest_path:
      MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_MANIFEST_PATH,
    mv_production_ready_gate_eligibility_audit_hardening_artifact_path:
      MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_ARTIFACT_PATH,
    eligibility_audit_hardening_id: 'mv-production-ready-gate-eligibility-audit-hardening-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    production_ready_status: productionReadyStatus,
    gate_reentry_required: gateReentryRequired,
    production_ready: productionReady,
    remaining_high_priority_count: remainingHighPriorityCount,
    ds_024_revalidation_required: ds024RevalidationRequired,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    reentry_hardening_consumed: toStatus(reentryHardeningConsumed),
    production_ready_status_valid: toStatus(productionReadyStatusValid),
    gate_reentry_required_valid: toStatus(gateReentryRequiredValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    production_ready_status_invalid: productionReadyStatusInvalid,
    gate_reentry_required_invalid: gateReentryRequiredInvalid,
    production_ready_certification_premature: productionReadyCertificationPremature,
    reentry_hardening_missing: reentryHardeningMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_gate_eligibility_audit_hardening_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENED_STATUS : null,
    next_stage_approved: pass,
    eligibility_audit_checks: eligibilityAuditChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_PASS_VERDICT
      : MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_GATE_ELIGIBILITY_AUDIT_HARDENING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
