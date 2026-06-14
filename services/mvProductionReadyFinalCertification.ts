import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_CHAIN_REPORT_PATH,
  PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS,
  type MvProductionReadyReentryChainArtifact,
} from './mvProductionReadyReentryChain.js';
import { PRODUCTION_READY_STATUS_PRODUCTION_READY } from './mvProductionReadyGateEligibilityAuditHardening.js';
import {
  MAX_PRODUCTION_READINESS_SCORE,
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

export const MV_PRODUCTION_READY_FINAL_CERTIFICATION_PHASE =
  'MV_PRODUCTION_READY_FINAL_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_READY_FINAL_CERTIFICATION_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_FINAL_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_READY_FINAL_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_FINAL_CERTIFICATION_V1' as const;
export const PRODUCTION_READY_CERTIFIED_STATUS = 'PRODUCTION_READY_CERTIFIED' as const;
export const MV_PRODUCTION_READY_FINAL_CERTIFICATION_DIR =
  'reports/mv_production_ready_final_certification' as const;
export const MV_PRODUCTION_READY_FINAL_CERTIFICATION_REPORT_PATH =
  'reports/mv_production_ready_final_certification/mv-production-ready-final-certification-report.json' as const;
export const MV_PRODUCTION_READY_FINAL_CERTIFICATION_EXPORT_DIR =
  'exports/mv_production_ready_final_certification' as const;
export const MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH =
  'exports/mv_production_ready_final_certification/mv-production-ready-final-certification.json' as const;

export const FINAL_CERTIFICATION_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_ready_final_certification/' as const;

export const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 3 as const;
export const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 0 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type FinalCertificationStatus = 'PASS' | 'FAIL';

export type MvProductionReadyFinalCertificationArtifact = {
  final_certification_id: string;
  phase: typeof MV_PRODUCTION_READY_FINAL_CERTIFICATION_PHASE;
  generated_at: string;
  source_reentry_chain_ref: typeof MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH;
  production_ready_certified: boolean;
  production_ready_status: typeof PRODUCTION_READY_STATUS_PRODUCTION_READY;
  production_ready_score: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  previous_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    final_certification_artifact_write_scope: typeof FINAL_CERTIFICATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  final_certification_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyFinalCertificationReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_FINAL_CERTIFICATION_PHASE;
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
  source_reentry_chain_ref: typeof MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH;
  mv_production_ready_reentry_chain_report_path: typeof MV_PRODUCTION_READY_REENTRY_CHAIN_REPORT_PATH;
  mv_production_ready_final_certification_artifact_path: typeof MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH;
  final_certification_id: string;
  source_count: number;
  adapter_count: number;
  production_ready_certified: boolean;
  production_ready_status: typeof PRODUCTION_READY_STATUS_PRODUCTION_READY | null;
  production_ready_score: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  traceability_chain: MvRuntimeTraceability[];
  reentry_chain_consumed: FinalCertificationStatus;
  production_ready_certified_valid: FinalCertificationStatus;
  production_ready_status_valid: FinalCertificationStatus;
  remaining_high_priority_count_valid: FinalCertificationStatus;
  reentry_chain_verified: FinalCertificationStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: FinalCertificationStatus;
  next_stage_ready: FinalCertificationStatus;
  production_ready_certification_invalid: boolean;
  remaining_high_priority_not_zero: boolean;
  reentry_chain_missing: boolean;
  mv_production_ready_final_certification_ready: FinalCertificationStatus;
  certification_status: typeof PRODUCTION_READY_CERTIFIED_STATUS | null;
  next_stage_approved: boolean;
  final_verdict:
    | typeof MV_PRODUCTION_READY_FINAL_CERTIFICATION_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_FINAL_CERTIFICATION_FAIL_VERDICT;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning'; check_id?: string }>;
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_DIR,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH,
] as const;

function toStatus(pass: boolean): FinalCertificationStatus {
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

function resolveProductionReadyScore(
  resolvedHighPriorityCount: number,
  remainingHighPriorityCount: number
): number {
  if (resolvedHighPriorityCount === EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT && remainingHighPriorityCount === 0) {
    return MAX_PRODUCTION_READINESS_SCORE;
  }
  return Math.max(
    0,
    Math.min(
      MAX_PRODUCTION_READINESS_SCORE,
      Math.round((resolvedHighPriorityCount / EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT) * MAX_PRODUCTION_READINESS_SCORE)
    )
  );
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyFinalCertificationReport['issues'],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyFinalCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyFinalCertificationReport = {
    report_id: 'mv-production-ready-final-certification-report-v1',
    phase: MV_PRODUCTION_READY_FINAL_CERTIFICATION_PHASE,
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
    source_reentry_chain_ref: MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH,
    mv_production_ready_reentry_chain_report_path: MV_PRODUCTION_READY_REENTRY_CHAIN_REPORT_PATH,
    mv_production_ready_final_certification_artifact_path: MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH,
    final_certification_id: 'mv-production-ready-final-certification-v1',
    source_count: 0,
    adapter_count: 0,
    production_ready_certified: false,
    production_ready_status: null,
    production_ready_score: 0,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    traceability_chain: [],
    reentry_chain_consumed: 'FAIL',
    production_ready_certified_valid: 'FAIL',
    production_ready_status_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    reentry_chain_verified: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    production_ready_certification_invalid: true,
    remaining_high_priority_not_zero: true,
    reentry_chain_missing: true,
    mv_production_ready_final_certification_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    final_verdict: MV_PRODUCTION_READY_FINAL_CERTIFICATION_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_FINAL_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_FINAL_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyFinalCertification(
  projectRoot?: string
): MvProductionReadyFinalCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyFinalCertificationReport['issues'] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const reentryChainReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: FinalCertificationStatus;
    mv_production_ready_reentry_chain_ready: FinalCertificationStatus;
    traceability_preserved: boolean;
    resolved_high_priority_count: number;
    remaining_high_priority_count: number;
    production_ready_certification_status: string | null;
    production_ready_entry_allowed: boolean;
  }>(root, MV_PRODUCTION_READY_REENTRY_CHAIN_REPORT_PATH);

  const reentryChainArtifact = loadJson<MvProductionReadyReentryChainArtifact>(
    root,
    MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH
  );

  if (
    !reentryChainReport ||
    !reentryChainArtifact ||
    reentryChainReport.final_verdict !== MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT ||
    reentryChainReport.certification_status !== PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS ||
    reentryChainReport.next_stage_ready !== 'PASS' ||
    reentryChainReport.mv_production_ready_reentry_chain_ready !== 'PASS'
  ) {
    issues.push({
      code: 'REENTRY_CHAIN_MISSING',
      message: `Required ${MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT} with ${PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const reentryChainConsumed =
    reentryChainArtifact.reentry_chain_complete === true &&
    reentryChainArtifact.next_stage_ready === true &&
    reentryChainArtifact.production_ready_entry_allowed === true &&
    reentryChainArtifact.production_ready_certification_status ===
      PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS;

  const resolvedHighPriorityCount = reentryChainArtifact.resolved_high_priority_count;
  const remainingHighPriorityCount = reentryChainArtifact.remaining_high_priority_count;
  const productionReadyScore = resolveProductionReadyScore(
    resolvedHighPriorityCount,
    remainingHighPriorityCount
  );
  const productionReadyCertified =
    reentryChainConsumed &&
    resolvedHighPriorityCount === EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT &&
    remainingHighPriorityCount === EXPECTED_REMAINING_HIGH_PRIORITY_COUNT;
  const productionReadyStatus = PRODUCTION_READY_STATUS_PRODUCTION_READY;

  const traceabilityChains = reentryChainArtifact.traceability_chain;
  const traceabilityPreserved =
    reentryChainReport.traceability_preserved === true &&
    reentryChainArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const productionReadyCertifiedValid = productionReadyCertified === true;
  const productionReadyStatusValid =
    productionReadyStatus === PRODUCTION_READY_STATUS_PRODUCTION_READY && productionReadyCertified;
  const remainingHighPriorityCountValid = remainingHighPriorityCount === EXPECTED_REMAINING_HIGH_PRIORITY_COUNT;
  const reentryChainVerified =
    reentryChainConsumed && reentryChainArtifact.production_ready_entry_allowed === true;

  const productionReadyCertificationInvalid = !productionReadyCertifiedValid || !productionReadyStatusValid;
  const remainingHighPriorityNotZero = !remainingHighPriorityCountValid;
  const reentryChainMissing = !reentryChainConsumed || !reentryChainVerified;

  const writeScopeValid = MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH.startsWith(
    FINAL_CERTIFICATION_ARTIFACT_WRITE_SCOPE
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const finalCertificationComplete =
    reentryChainConsumed &&
    productionReadyCertifiedValid &&
    productionReadyStatusValid &&
    remainingHighPriorityCountValid &&
    reentryChainVerified &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !productionReadyCertificationInvalid &&
    !remainingHighPriorityNotZero &&
    !reentryChainMissing;

  const nextStageReady = finalCertificationComplete;
  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  if (reentryChainMissing) {
    issues.push({
      code: 'REENTRY_CHAIN_MISSING',
      message: 'Production ready reentry chain was not consumed or verified',
      severity: 'error',
    });
  }
  if (remainingHighPriorityNotZero) {
    issues.push({
      code: 'REMAINING_HIGH_PRIORITY_NOT_ZERO',
      message: 'Remaining high priority count must be zero for final certification',
      severity: 'error',
      check_id: 'remaining_high_priority_count_valid',
    });
  }
  if (productionReadyCertificationInvalid) {
    issues.push({
      code: 'PRODUCTION_READY_CERTIFICATION_INVALID',
      message: 'Production ready certification is invalid',
      severity: 'error',
      check_id: 'production_ready_certified_valid',
    });
  }
  if (!safeCreatePolicyVerified) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }

  const artifact: MvProductionReadyFinalCertificationArtifact = {
    final_certification_id: 'mv-production-ready-final-certification-v1',
    phase: MV_PRODUCTION_READY_FINAL_CERTIFICATION_PHASE,
    generated_at: timestamp,
    source_reentry_chain_ref: MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH,
    production_ready_certified: productionReadyCertified,
    production_ready_status: productionReadyStatus,
    production_ready_score: productionReadyScore,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    current_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    previous_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      final_certification_artifact_write_scope: FINAL_CERTIFICATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    final_certification_complete: pass,
    next_stage_ready: pass,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_FINAL_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyFinalCertificationReport = {
    report_id: 'mv-production-ready-final-certification-report-v1',
    phase: MV_PRODUCTION_READY_FINAL_CERTIFICATION_PHASE,
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
    source_reentry_chain_ref: MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH,
    mv_production_ready_reentry_chain_report_path: MV_PRODUCTION_READY_REENTRY_CHAIN_REPORT_PATH,
    mv_production_ready_final_certification_artifact_path: MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH,
    final_certification_id: 'mv-production-ready-final-certification-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    production_ready_certified: productionReadyCertified,
    production_ready_status: pass ? productionReadyStatus : null,
    production_ready_score: productionReadyScore,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    traceability_chain: traceabilityChains,
    reentry_chain_consumed: toStatus(reentryChainConsumed),
    production_ready_certified_valid: toStatus(productionReadyCertifiedValid),
    production_ready_status_valid: toStatus(productionReadyStatusValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    reentry_chain_verified: toStatus(reentryChainVerified),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    production_ready_certification_invalid: productionReadyCertificationInvalid,
    remaining_high_priority_not_zero: remainingHighPriorityNotZero,
    reentry_chain_missing: reentryChainMissing,
    mv_production_ready_final_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_READY_CERTIFIED_STATUS : null,
    next_stage_approved: pass,
    final_verdict: pass
      ? MV_PRODUCTION_READY_FINAL_CERTIFICATION_PASS_VERDICT
      : MV_PRODUCTION_READY_FINAL_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_FINAL_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_FINAL_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
