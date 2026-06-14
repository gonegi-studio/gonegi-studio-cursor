import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH,
  type MvHighPriorityResolutionExecutionCertificationGateHardeningArtifact,
} from './mvHighPriorityResolutionExecutionCertificationGateHardening.js';
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

export const MV_PRODUCTION_READY_GATE_PHASE =
  'PHASE-DIGITAL-STUDIO-023-MV_PRODUCTION_READY_GATE_V1' as const;
export const MV_PRODUCTION_READY_GATE_PASS_VERDICT = 'PASS_MV_PRODUCTION_READY_GATE_V1' as const;
export const MV_PRODUCTION_READY_GATE_FAIL_VERDICT = 'FAIL_MV_PRODUCTION_READY_GATE_V1' as const;
export const MV_PRODUCTION_READY_GATE_EVALUATED_STATUS = 'MV_PRODUCTION_READY_GATE_EVALUATED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_023B_ENTRY' as const;
export const MV_PRODUCTION_READY_GATE_DIR = 'reports/mv_production_ready_gate' as const;
export const MV_PRODUCTION_READY_GATE_REPORT_PATH =
  'reports/mv_production_ready_gate/mv-production-ready-gate-report.json' as const;
export const MV_PRODUCTION_READY_GATE_MD_PATH =
  'reports/mv_production_ready_gate/MV_PRODUCTION_READY_GATE.md' as const;
export const MV_PRODUCTION_READY_GATE_EXPORT_DIR = 'exports/mv_production_ready_gate' as const;
export const MV_PRODUCTION_READY_GATE_MANIFEST_PATH =
  'exports/mv_production_ready_gate/mv-production-ready-gate-manifest.json' as const;
export const MV_PRODUCTION_READY_GATE_ARTIFACT_PATH =
  'exports/mv_production_ready_gate/mv-production-ready-gate.json' as const;

export const PRODUCTION_READY_GATE_ARTIFACT_WRITE_SCOPE = 'exports/mv_production_ready_gate/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type GateStatus = 'PASS' | 'FAIL';

export type MvProductionReadyGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type GateCheck = {
  check_id: string;
  check_label: string;
  status: GateStatus;
};

export type MvProductionReadyGateArtifact = {
  gate_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_PHASE;
  generated_at: string;
  source_gate_hardening_ref: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH;
  gate_hardening_id: string;
  gate_blocker_count: number;
  production_ready_gate_eligible: boolean;
  high_priority_resolution_target_met: boolean;
  remaining_high_priority_count: number;
  resolved_high_priority_count: number;
  high_priority_resolution_count: number;
  gate_open: boolean;
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
    production_ready_gate_artifact_write_scope: typeof PRODUCTION_READY_GATE_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  gate_evaluation_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyGateManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_PHASE;
  generated_at: string;
  gate_blocker_count: number;
  production_ready_gate_eligible: boolean;
  gate_open: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: GateStatus;
  next_stage_ready: GateStatus;
  certification_status: typeof MV_PRODUCTION_READY_GATE_EVALUATED_STATUS | null;
};

export type MvProductionReadyGateReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_GATE_PHASE;
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
  source_gate_hardening_ref: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH;
  mv_high_priority_resolution_execution_certification_gate_hardening_report_path: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH;
  mv_production_ready_gate_export_dir: typeof MV_PRODUCTION_READY_GATE_EXPORT_DIR;
  mv_production_ready_gate_manifest_path: typeof MV_PRODUCTION_READY_GATE_MANIFEST_PATH;
  mv_production_ready_gate_artifact_path: typeof MV_PRODUCTION_READY_GATE_ARTIFACT_PATH;
  gate_id: string;
  source_count: number;
  adapter_count: number;
  gate_blocker_count: number;
  production_ready_gate_eligible: boolean;
  high_priority_resolution_target_met: boolean;
  remaining_high_priority_count: number;
  gate_open: boolean;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  gate_hardening_consumed: GateStatus;
  gate_blocker_count_tracked: GateStatus;
  gate_eligibility_tracked: GateStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: GateStatus;
  next_stage_ready: GateStatus;
  gate_hardening_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_gate_ready: GateStatus;
  certification_status: typeof MV_PRODUCTION_READY_GATE_EVALUATED_STATUS | null;
  next_stage_approved: boolean;
  gate_checks: GateCheck[];
  final_verdict: typeof MV_PRODUCTION_READY_GATE_PASS_VERDICT | typeof MV_PRODUCTION_READY_GATE_FAIL_VERDICT;
  issues: MvProductionReadyGateIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [MV_PRODUCTION_READY_GATE_MANIFEST_PATH, MV_PRODUCTION_READY_GATE_ARTIFACT_PATH] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_GATE_DIR,
  MV_PRODUCTION_READY_GATE_EXPORT_DIR,
  MV_PRODUCTION_READY_GATE_REPORT_PATH,
  MV_PRODUCTION_READY_GATE_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): GateStatus {
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

function resolveGateBlockerCount(remainingHighPriorityCount: number): number {
  return remainingHighPriorityCount;
}

function resolveGateOpen(gateBlockerCount: number, productionReadyGateEligible: boolean): boolean {
  return gateBlockerCount === 0 && productionReadyGateEligible;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionReadyGateIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyGateReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvProductionReadyGateReport = {
    report_id: 'mv-production-ready-gate-report-v1',
    phase: MV_PRODUCTION_READY_GATE_PHASE,
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
    source_gate_hardening_ref: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH,
    mv_high_priority_resolution_execution_certification_gate_hardening_report_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH,
    mv_production_ready_gate_export_dir: MV_PRODUCTION_READY_GATE_EXPORT_DIR,
    mv_production_ready_gate_manifest_path: MV_PRODUCTION_READY_GATE_MANIFEST_PATH,
    mv_production_ready_gate_artifact_path: MV_PRODUCTION_READY_GATE_ARTIFACT_PATH,
    gate_id: 'mv-production-ready-gate-v1',
    source_count: 0,
    adapter_count: 0,
    gate_blocker_count: 0,
    production_ready_gate_eligible: false,
    high_priority_resolution_target_met: false,
    remaining_high_priority_count: 0,
    gate_open: false,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    gate_hardening_consumed: 'FAIL',
    gate_blocker_count_tracked: 'FAIL',
    gate_eligibility_tracked: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    gate_hardening_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_gate_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    gate_checks: [],
    final_verdict: MV_PRODUCTION_READY_GATE_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_PRODUCTION_READY_GATE_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export function writeMvProductionReadyGate(projectRoot?: string): MvProductionReadyGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyGateIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const hardeningReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: GateStatus;
    mv_high_priority_resolution_execution_certification_gate_hardening_ready: GateStatus;
    traceability_preserved: boolean;
    gate_blocker_count?: number;
    production_ready_gate_eligible: boolean;
    high_priority_resolution_target_met: boolean;
    remaining_high_priority_count: number;
  }>(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH);

  const hardeningArtifact = loadJson<MvHighPriorityResolutionExecutionCertificationGateHardeningArtifact>(
    root,
    MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH
  );
  const hardeningManifestPath = path.join(
    root,
    MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH
  );

  if (
    !hardeningReport ||
    !hardeningArtifact ||
    !fs.existsSync(hardeningManifestPath) ||
    hardeningReport.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT ||
    hardeningReport.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS ||
    hardeningReport.next_stage_ready !== 'PASS' ||
    hardeningReport.mv_high_priority_resolution_execution_certification_gate_hardening_ready !== 'PASS'
  ) {
    issues.push({
      code: 'GATE_HARDENING_MISSING',
      message: `Required ${MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT} with ${MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const gateHardeningConsumed =
    hardeningArtifact.gate_hardening_complete === true &&
    hardeningArtifact.next_stage_ready === true &&
    hardeningArtifact.next_stage_gate_label === 'DS_023_ENTRY';

  const gateBlockerCount = resolveGateBlockerCount(hardeningArtifact.remaining_high_priority_count);
  const productionReadyGateEligible = hardeningArtifact.production_ready_gate_eligible;
  const highPriorityResolutionTargetMet = hardeningArtifact.high_priority_resolution_target_met;
  const remainingHighPriorityCount = hardeningArtifact.remaining_high_priority_count;
  const gateOpen = resolveGateOpen(gateBlockerCount, productionReadyGateEligible);

  const traceabilityChains = hardeningArtifact.traceability_chain;
  const traceabilityPreserved =
    hardeningReport.traceability_preserved === true &&
    hardeningArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const gateBlockerCountTracked =
    gateBlockerCount === remainingHighPriorityCount &&
    gateBlockerCount === hardeningArtifact.remaining_high_priority_count;

  const gateEligibilityTracked =
    productionReadyGateEligible === hardeningReport.production_ready_gate_eligible &&
    highPriorityResolutionTargetMet === hardeningReport.high_priority_resolution_target_met;

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(PRODUCTION_READY_GATE_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const gateEvaluationComplete =
    gateHardeningConsumed &&
    gateBlockerCountTracked &&
    gateEligibilityTracked &&
    traceabilityPreserved &&
    safeCreatePolicyVerified;

  const nextStageReady = gateEvaluationComplete;

  if (!gateHardeningConsumed) issues.push({ code: 'GATE_HARDENING_MISSING', message: 'Gate hardening was not consumed', severity: 'error' });
  if (!traceabilityPreserved) issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  if (!safeCreatePolicyVerified) issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });

  const gateChecks: GateCheck[] = [
    { check_id: 'gate_blocker_count_tracked', check_label: 'Gate Blocker Count Tracked', status: toStatus(gateBlockerCountTracked) },
    { check_id: 'gate_eligibility_tracked', check_label: 'Gate Eligibility Tracked', status: toStatus(gateEligibilityTracked) },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyGateArtifact = {
    gate_id: 'mv-production-ready-gate-v1',
    phase: MV_PRODUCTION_READY_GATE_PHASE,
    generated_at: timestamp,
    source_gate_hardening_ref: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH,
    gate_hardening_id: hardeningArtifact.gate_hardening_id,
    gate_blocker_count: gateBlockerCount,
    production_ready_gate_eligible: productionReadyGateEligible,
    high_priority_resolution_target_met: highPriorityResolutionTargetMet,
    remaining_high_priority_count: remainingHighPriorityCount,
    resolved_high_priority_count: hardeningArtifact.resolved_high_priority_count,
    high_priority_resolution_count: hardeningArtifact.high_priority_resolution_count,
    gate_open: gateOpen,
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
      production_ready_gate_artifact_write_scope: PRODUCTION_READY_GATE_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    gate_evaluation_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyGateManifest = {
    manifest_id: 'mv-production-ready-gate-manifest-v1',
    phase: MV_PRODUCTION_READY_GATE_PHASE,
    generated_at: timestamp,
    gate_blocker_count: gateBlockerCount,
    production_ready_gate_eligible: productionReadyGateEligible,
    gate_open: gateOpen,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_READY_GATE_EVALUATED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_PRODUCTION_READY_GATE_ARTIFACT_PATH), `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MV_PRODUCTION_READY_GATE_MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const report: MvProductionReadyGateReport = {
    report_id: 'mv-production-ready-gate-report-v1',
    phase: MV_PRODUCTION_READY_GATE_PHASE,
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
    source_gate_hardening_ref: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH,
    mv_high_priority_resolution_execution_certification_gate_hardening_report_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH,
    mv_production_ready_gate_export_dir: MV_PRODUCTION_READY_GATE_EXPORT_DIR,
    mv_production_ready_gate_manifest_path: MV_PRODUCTION_READY_GATE_MANIFEST_PATH,
    mv_production_ready_gate_artifact_path: MV_PRODUCTION_READY_GATE_ARTIFACT_PATH,
    gate_id: 'mv-production-ready-gate-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    gate_blocker_count: gateBlockerCount,
    production_ready_gate_eligible: productionReadyGateEligible,
    high_priority_resolution_target_met: highPriorityResolutionTargetMet,
    remaining_high_priority_count: remainingHighPriorityCount,
    gate_open: gateOpen,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    gate_hardening_consumed: toStatus(gateHardeningConsumed),
    gate_blocker_count_tracked: toStatus(gateBlockerCountTracked),
    gate_eligibility_tracked: toStatus(gateEligibilityTracked),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    gate_hardening_missing: !gateHardeningConsumed,
    traceability_loss: !traceabilityPreserved,
    safe_create_policy_violation: !safeCreatePolicyVerified,
    mv_production_ready_gate_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_READY_GATE_EVALUATED_STATUS : null,
    next_stage_approved: pass,
    gate_checks: gateChecks,
    final_verdict: pass ? MV_PRODUCTION_READY_GATE_PASS_VERDICT : MV_PRODUCTION_READY_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_GATE_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_PRODUCTION_READY_GATE_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}
