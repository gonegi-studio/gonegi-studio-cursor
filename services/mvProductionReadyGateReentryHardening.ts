import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_READY_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_PASS_VERDICT,
  MV_PRODUCTION_READY_GATE_EVALUATED_STATUS,
  MV_PRODUCTION_READY_GATE_REPORT_PATH,
  type MvProductionReadyGateArtifact,
} from './mvProductionReadyGate.js';
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

export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PHASE =
  'PHASE-DIGITAL-STUDIO-023B-MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_V1' as const;
export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_V1' as const;
export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_V1' as const;
export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS =
  'MV_PRODUCTION_READY_GATE_REENTRY_HARDENED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_024_ENTRY' as const;
export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_DIR =
  'reports/mv_production_ready_gate_reentry_hardening' as const;
export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH =
  'reports/mv_production_ready_gate_reentry_hardening/mv-production-ready-gate-reentry-hardening-report.json' as const;
export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MD_PATH =
  'reports/mv_production_ready_gate_reentry_hardening/MV_PRODUCTION_READY_GATE_REENTRY_HARDENING.md' as const;
export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_EXPORT_DIR =
  'exports/mv_production_ready_gate_reentry_hardening' as const;
export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH =
  'exports/mv_production_ready_gate_reentry_hardening/mv-production-ready-gate-reentry-hardening-manifest.json' as const;
export const MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH =
  'exports/mv_production_ready_gate_reentry_hardening/mv-production-ready-gate-reentry-hardening.json' as const;

export const GATE_REENTRY_HARDENING_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_ready_gate_reentry_hardening/' as const;

export const GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT = 0 as const;

export type GateReentryCondition = {
  remaining_high_priority_count: typeof GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT;
  high_priority_resolution_target_met: true;
  production_ready_gate_eligible: true;
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type ReentryHardeningStatus = 'PASS' | 'FAIL';

export type MvProductionReadyGateReentryHardeningIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type ReentryHardeningCheck = {
  check_id: string;
  check_label: string;
  status: ReentryHardeningStatus;
};

export type MvProductionReadyGateReentryHardeningArtifact = {
  reentry_hardening_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PHASE;
  generated_at: string;
  source_gate_ref: typeof MV_PRODUCTION_READY_GATE_ARTIFACT_PATH;
  gate_id: string;
  gate_blocker_count: number;
  gate_reentry_condition: GateReentryCondition;
  gate_reentry_ready: boolean;
  production_ready_gate_eligible: boolean;
  high_priority_resolution_target_met: boolean;
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
    gate_reentry_hardening_artifact_write_scope: typeof GATE_REENTRY_HARDENING_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  reentry_hardening_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyGateReentryHardeningManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PHASE;
  generated_at: string;
  gate_blocker_count: number;
  gate_reentry_ready: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: ReentryHardeningStatus;
  next_stage_ready: ReentryHardeningStatus;
  certification_status: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS | null;
};

export type MvProductionReadyGateReentryHardeningReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PHASE;
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
  source_gate_ref: typeof MV_PRODUCTION_READY_GATE_ARTIFACT_PATH;
  mv_production_ready_gate_report_path: typeof MV_PRODUCTION_READY_GATE_REPORT_PATH;
  mv_production_ready_gate_reentry_hardening_export_dir: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_EXPORT_DIR;
  mv_production_ready_gate_reentry_hardening_manifest_path: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH;
  mv_production_ready_gate_reentry_hardening_artifact_path: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH;
  reentry_hardening_id: string;
  source_count: number;
  adapter_count: number;
  gate_blocker_count: number;
  gate_reentry_condition: GateReentryCondition;
  gate_reentry_ready: boolean;
  remaining_high_priority_count: number;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  gate_consumed: ReentryHardeningStatus;
  gate_blocker_count_valid: ReentryHardeningStatus;
  gate_reentry_condition_valid: ReentryHardeningStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: ReentryHardeningStatus;
  next_stage_ready: ReentryHardeningStatus;
  gate_blocker_count_invalid: boolean;
  gate_reentry_condition_missing: boolean;
  gate_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_gate_reentry_hardening_ready: ReentryHardeningStatus;
  certification_status: typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS | null;
  next_stage_approved: boolean;
  reentry_hardening_checks: ReentryHardeningCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_FAIL_VERDICT;
  issues: MvProductionReadyGateReentryHardeningIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_GATE_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_DIR,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_EXPORT_DIR,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH,
  MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): ReentryHardeningStatus {
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

function buildGateReentryCondition(): GateReentryCondition {
  return {
    remaining_high_priority_count: GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT,
    high_priority_resolution_target_met: true,
    production_ready_gate_eligible: true,
  };
}

function resolveGateReentryReady(
  gateArtifact: MvProductionReadyGateArtifact,
  gateReentryCondition: GateReentryCondition
): boolean {
  return (
    gateArtifact.remaining_high_priority_count === gateReentryCondition.remaining_high_priority_count &&
    gateArtifact.high_priority_resolution_target_met === gateReentryCondition.high_priority_resolution_target_met &&
    gateArtifact.production_ready_gate_eligible === gateReentryCondition.production_ready_gate_eligible &&
    gateArtifact.gate_blocker_count === 0 &&
    gateArtifact.gate_open === true
  );
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyGateReentryHardeningIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyGateReentryHardeningReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyGateReentryHardeningReport = {
    report_id: 'mv-production-ready-gate-reentry-hardening-report-v1',
    phase: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PHASE,
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
    source_gate_ref: MV_PRODUCTION_READY_GATE_ARTIFACT_PATH,
    mv_production_ready_gate_report_path: MV_PRODUCTION_READY_GATE_REPORT_PATH,
    mv_production_ready_gate_reentry_hardening_export_dir: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_EXPORT_DIR,
    mv_production_ready_gate_reentry_hardening_manifest_path: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH,
    mv_production_ready_gate_reentry_hardening_artifact_path: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH,
    reentry_hardening_id: 'mv-production-ready-gate-reentry-hardening-v1',
    source_count: 0,
    adapter_count: 0,
    gate_blocker_count: 0,
    gate_reentry_condition: buildGateReentryCondition(),
    gate_reentry_ready: false,
    remaining_high_priority_count: 0,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    gate_consumed: 'FAIL',
    gate_blocker_count_valid: 'FAIL',
    gate_reentry_condition_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    gate_blocker_count_invalid: true,
    gate_reentry_condition_missing: true,
    gate_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_gate_reentry_hardening_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    reentry_hardening_checks: [],
    final_verdict: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export function writeMvProductionReadyGateReentryHardening(
  projectRoot?: string
): MvProductionReadyGateReentryHardeningReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyGateReentryHardeningIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const gateReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: ReentryHardeningStatus;
    mv_production_ready_gate_ready: ReentryHardeningStatus;
    traceability_preserved: boolean;
    gate_blocker_count: number;
    remaining_high_priority_count: number;
  }>(root, MV_PRODUCTION_READY_GATE_REPORT_PATH);

  const gateArtifact = loadJson<MvProductionReadyGateArtifact>(root, MV_PRODUCTION_READY_GATE_ARTIFACT_PATH);
  const gateManifestPath = path.join(root, MV_PRODUCTION_READY_GATE_MANIFEST_PATH);

  if (
    !gateReport ||
    !gateArtifact ||
    !fs.existsSync(gateManifestPath) ||
    gateReport.final_verdict !== MV_PRODUCTION_READY_GATE_PASS_VERDICT ||
    gateReport.certification_status !== MV_PRODUCTION_READY_GATE_EVALUATED_STATUS ||
    gateReport.next_stage_ready !== 'PASS' ||
    gateReport.mv_production_ready_gate_ready !== 'PASS'
  ) {
    issues.push({
      code: 'GATE_MISSING',
      message: `Required ${MV_PRODUCTION_READY_GATE_PASS_VERDICT} with ${MV_PRODUCTION_READY_GATE_EVALUATED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const gateConsumed =
    gateArtifact.gate_evaluation_complete === true &&
    gateArtifact.next_stage_ready === true &&
    gateArtifact.next_stage_gate_label === 'DS_023B_ENTRY';

  const gateReentryCondition = buildGateReentryCondition();
  const gateBlockerCount = gateArtifact.gate_blocker_count;
  const gateReentryReady = resolveGateReentryReady(gateArtifact, gateReentryCondition);

  const traceabilityChains = gateArtifact.traceability_chain;
  const traceabilityPreserved =
    gateReport.traceability_preserved === true &&
    gateArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const gateBlockerCountValid =
    gateBlockerCount === gateReport.gate_blocker_count &&
    gateBlockerCount === gateArtifact.remaining_high_priority_count &&
    gateBlockerCount >= 0;

  const gateReentryConditionValid =
    gateReentryCondition.remaining_high_priority_count === GATE_REENTRY_REQUIRED_REMAINING_HIGH_PRIORITY_COUNT &&
    gateReentryCondition.high_priority_resolution_target_met === true &&
    gateReentryCondition.production_ready_gate_eligible === true;

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(GATE_REENTRY_HARDENING_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const gateBlockerCountInvalid = !gateBlockerCountValid;
  const gateReentryConditionMissing = !gateReentryConditionValid;
  const gateMissing = !gateConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const reentryHardeningComplete =
    gateConsumed &&
    gateBlockerCountValid &&
    gateReentryConditionValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified;

  const nextStageReady = reentryHardeningComplete;

  if (gateMissing) issues.push({ code: 'GATE_MISSING', message: 'Production ready gate was not consumed', severity: 'error' });
  if (traceabilityLoss) issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  if (safeCreatePolicyViolation) issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  if (gateBlockerCountInvalid) {
    issues.push({
      code: 'GATE_BLOCKER_COUNT_INVALID',
      message: 'Gate blocker count is invalid',
      severity: 'error',
      check_id: 'gate_blocker_count_valid',
    });
  }
  if (gateReentryConditionMissing) {
    issues.push({
      code: 'GATE_REENTRY_CONDITION_MISSING',
      message: 'Gate reentry condition is missing or invalid',
      severity: 'error',
      check_id: 'gate_reentry_condition_valid',
    });
  }

  const reentryHardeningChecks: ReentryHardeningCheck[] = [
    { check_id: 'gate_blocker_count_valid', check_label: 'Gate Blocker Count Valid', status: toStatus(gateBlockerCountValid) },
    { check_id: 'gate_reentry_condition_valid', check_label: 'Gate Reentry Condition Valid', status: toStatus(gateReentryConditionValid) },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyGateReentryHardeningArtifact = {
    reentry_hardening_id: 'mv-production-ready-gate-reentry-hardening-v1',
    phase: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PHASE,
    generated_at: timestamp,
    source_gate_ref: MV_PRODUCTION_READY_GATE_ARTIFACT_PATH,
    gate_id: gateArtifact.gate_id,
    gate_blocker_count: gateBlockerCount,
    gate_reentry_condition: gateReentryCondition,
    gate_reentry_ready: gateReentryReady,
    production_ready_gate_eligible: gateArtifact.production_ready_gate_eligible,
    high_priority_resolution_target_met: gateArtifact.high_priority_resolution_target_met,
    remaining_high_priority_count: gateArtifact.remaining_high_priority_count,
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
      gate_reentry_hardening_artifact_write_scope: GATE_REENTRY_HARDENING_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    reentry_hardening_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyGateReentryHardeningManifest = {
    manifest_id: 'mv-production-ready-gate-reentry-hardening-manifest-v1',
    phase: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PHASE,
    generated_at: timestamp,
    gate_blocker_count: gateBlockerCount,
    gate_reentry_ready: gateReentryReady,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH), `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const report: MvProductionReadyGateReentryHardeningReport = {
    report_id: 'mv-production-ready-gate-reentry-hardening-report-v1',
    phase: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PHASE,
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
    source_gate_ref: MV_PRODUCTION_READY_GATE_ARTIFACT_PATH,
    mv_production_ready_gate_report_path: MV_PRODUCTION_READY_GATE_REPORT_PATH,
    mv_production_ready_gate_reentry_hardening_export_dir: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_EXPORT_DIR,
    mv_production_ready_gate_reentry_hardening_manifest_path: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_MANIFEST_PATH,
    mv_production_ready_gate_reentry_hardening_artifact_path: MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_ARTIFACT_PATH,
    reentry_hardening_id: 'mv-production-ready-gate-reentry-hardening-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    gate_blocker_count: gateBlockerCount,
    gate_reentry_condition: gateReentryCondition,
    gate_reentry_ready: gateReentryReady,
    remaining_high_priority_count: gateArtifact.remaining_high_priority_count,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    gate_consumed: toStatus(gateConsumed),
    gate_blocker_count_valid: toStatus(gateBlockerCountValid),
    gate_reentry_condition_valid: toStatus(gateReentryConditionValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    gate_blocker_count_invalid: gateBlockerCountInvalid,
    gate_reentry_condition_missing: gateReentryConditionMissing,
    gate_missing: gateMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_gate_reentry_hardening_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_READY_GATE_REENTRY_HARDENED_STATUS : null,
    next_stage_approved: pass,
    reentry_hardening_checks: reentryHardeningChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_PASS_VERDICT
      : MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_PRODUCTION_READY_GATE_REENTRY_HARDENING_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}
