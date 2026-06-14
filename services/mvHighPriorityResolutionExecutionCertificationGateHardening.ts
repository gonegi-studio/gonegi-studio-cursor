import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import { RESOLUTION_STATUS_RESOLVED } from './mvHighPriorityResolutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH,
  type MvHighPriorityResolutionExecutionCertificationArtifact,
} from './mvHighPriorityResolutionExecutionCertification.js';
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

export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PHASE =
  'PHASE-DIGITAL-STUDIO-022B-MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT =
  'PASS_MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_FAIL_VERDICT =
  'FAIL_MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS =
  'MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_023_ENTRY' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_DIR =
  'reports/mv_high_priority_resolution_execution_certification_gate_hardening' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH =
  'reports/mv_high_priority_resolution_execution_certification_gate_hardening/mv-high-priority-resolution-execution-certification-gate-hardening-report.json' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MD_PATH =
  'reports/mv_high_priority_resolution_execution_certification_gate_hardening/MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING.md' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_EXPORT_DIR =
  'exports/mv_high_priority_resolution_execution_certification_gate_hardening' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH =
  'exports/mv_high_priority_resolution_execution_certification_gate_hardening/mv-high-priority-resolution-execution-certification-gate-hardening-manifest.json' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH =
  'exports/mv_high_priority_resolution_execution_certification_gate_hardening/mv-high-priority-resolution-execution-certification-gate-hardening.json' as const;

export const GATE_HARDENING_ARTIFACT_WRITE_SCOPE =
  'exports/mv_high_priority_resolution_execution_certification_gate_hardening/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type GateHardeningStatus = 'PASS' | 'FAIL';

export type MvHighPriorityResolutionExecutionCertificationGateHardeningIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type GateHardeningCheck = {
  check_id: string;
  check_label: string;
  status: GateHardeningStatus;
};

export type MvHighPriorityResolutionExecutionCertificationGateHardeningArtifact = {
  gate_hardening_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PHASE;
  generated_at: string;
  source_execution_certification_ref: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  certification_id: string;
  high_priority_resolution_target_met: boolean;
  production_ready_gate_eligible: boolean;
  remaining_high_priority_count: number;
  resolved_high_priority_count: number;
  high_priority_resolution_count: number;
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
    gate_hardening_artifact_write_scope: typeof GATE_HARDENING_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  gate_hardening_complete: boolean;
  next_stage_ready: boolean;
};

export type MvHighPriorityResolutionExecutionCertificationGateHardeningManifest = {
  manifest_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PHASE;
  generated_at: string;
  high_priority_resolution_target_met: boolean;
  production_ready_gate_eligible: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: GateHardeningStatus;
  next_stage_ready: GateHardeningStatus;
  certification_status: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS | null;
};

export type MvHighPriorityResolutionExecutionCertificationGateHardeningReport = {
  report_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PHASE;
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
  source_execution_certification_ref: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  mv_high_priority_resolution_execution_certification_report_path: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH;
  mv_high_priority_resolution_execution_certification_gate_hardening_export_dir: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_EXPORT_DIR;
  mv_high_priority_resolution_execution_certification_gate_hardening_manifest_path: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH;
  mv_high_priority_resolution_execution_certification_gate_hardening_artifact_path: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH;
  gate_hardening_id: string;
  source_count: number;
  adapter_count: number;
  high_priority_resolution_target_met: boolean;
  production_ready_gate_eligible: boolean;
  remaining_high_priority_count: number;
  resolved_high_priority_count: number;
  high_priority_resolution_count: number;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  execution_certification_consumed: GateHardeningStatus;
  high_priority_resolution_target_met_valid: GateHardeningStatus;
  production_ready_gate_eligible_valid: GateHardeningStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: GateHardeningStatus;
  next_stage_ready: GateHardeningStatus;
  high_priority_resolution_target_not_met: boolean;
  production_ready_gate_not_eligible: boolean;
  execution_certification_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_high_priority_resolution_execution_certification_gate_hardening_ready: GateHardeningStatus;
  certification_status: typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS | null;
  next_stage_approved: boolean;
  gate_hardening_checks: GateHardeningCheck[];
  final_verdict:
    | typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT
    | typeof MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_FAIL_VERDICT;
  issues: MvHighPriorityResolutionExecutionCertificationGateHardeningIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_EXPORT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): GateHardeningStatus {
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

function resolveHighPriorityResolutionTargetMet(
  artifact: MvHighPriorityResolutionExecutionCertificationArtifact
): boolean {
  return (
    artifact.remaining_high_priority_count === 0 &&
    artifact.resolved_high_priority_count === artifact.high_priority_resolution_count &&
    Object.values(artifact.resolution_status_by_item).every(
      (status) => status === RESOLUTION_STATUS_RESOLVED
    )
  );
}

function resolveProductionReadyGateEligible(
  artifact: MvHighPriorityResolutionExecutionCertificationArtifact,
  highPriorityResolutionTargetMet: boolean
): boolean {
  return (
    highPriorityResolutionTargetMet &&
    artifact.execution_certification_complete === true &&
    artifact.production_ready_dependency_required === true &&
    artifact.critical_blocker_count === 0 &&
    artifact.target_readiness_tier === PRODUCTION_READINESS_TIER_PRODUCTION_READY &&
    artifact.current_readiness_tier === PRODUCTION_READINESS_TIER_TEST_READY
  );
}

function buildMarkdown(report: MvHighPriorityResolutionExecutionCertificationGateHardeningReport): string {
  return [
    '# MV High Priority Resolution Execution Certification Gate Hardening',
    '',
    `**Phase:** ${report.phase}`,
    `**Verdict:** ${report.final_verdict}`,
    `**High Priority Resolution Target Met:** ${report.high_priority_resolution_target_met}`,
    `**Production Ready Gate Eligible:** ${report.production_ready_gate_eligible}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
  ].join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvHighPriorityResolutionExecutionCertificationGateHardeningIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvHighPriorityResolutionExecutionCertificationGateHardeningReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvHighPriorityResolutionExecutionCertificationGateHardeningReport = {
    report_id: 'mv-high-priority-resolution-execution-certification-gate-hardening-report-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PHASE,
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
    source_execution_certification_ref: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    mv_high_priority_resolution_execution_certification_report_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH,
    mv_high_priority_resolution_execution_certification_gate_hardening_export_dir:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_EXPORT_DIR,
    mv_high_priority_resolution_execution_certification_gate_hardening_manifest_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH,
    mv_high_priority_resolution_execution_certification_gate_hardening_artifact_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH,
    gate_hardening_id: 'mv-high-priority-resolution-execution-certification-gate-hardening-v1',
    source_count: 0,
    adapter_count: 0,
    high_priority_resolution_target_met: false,
    production_ready_gate_eligible: false,
    remaining_high_priority_count: 0,
    resolved_high_priority_count: 0,
    high_priority_resolution_count: 0,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    execution_certification_consumed: 'FAIL',
    high_priority_resolution_target_met_valid: 'FAIL',
    production_ready_gate_eligible_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    high_priority_resolution_target_not_met: true,
    production_ready_gate_not_eligible: true,
    execution_certification_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_high_priority_resolution_execution_certification_gate_hardening_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    gate_hardening_checks: [],
    final_verdict: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');
  return report;
}

export function writeMvHighPriorityResolutionExecutionCertificationGateHardening(
  projectRoot?: string
): MvHighPriorityResolutionExecutionCertificationGateHardeningReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvHighPriorityResolutionExecutionCertificationGateHardeningIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const executionReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: GateHardeningStatus;
    mv_high_priority_resolution_execution_certification_ready: GateHardeningStatus;
    traceability_preserved: boolean;
    high_priority_resolution_target_met: boolean;
    remaining_high_priority_count: number;
    resolved_high_priority_count: number;
    high_priority_resolution_count: number;
  }>(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH);

  const executionArtifact = loadJson<MvHighPriorityResolutionExecutionCertificationArtifact>(
    root,
    MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH
  );
  const executionManifestPath = path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH);

  if (
    !executionReport ||
    !executionArtifact ||
    !fs.existsSync(executionManifestPath) ||
    executionReport.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT ||
    executionReport.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS ||
    executionReport.next_stage_ready !== 'PASS' ||
    executionReport.mv_high_priority_resolution_execution_certification_ready !== 'PASS'
  ) {
    issues.push({
      code: 'EXECUTION_CERTIFICATION_MISSING',
      message: `Required ${MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT} with ${MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const executionCertificationConsumed =
    executionArtifact.execution_certification_complete === true &&
    executionArtifact.next_stage_ready === true &&
    executionArtifact.next_stage_gate_label === 'DS_022B_ENTRY';

  const highPriorityResolutionTargetMet = resolveHighPriorityResolutionTargetMet(executionArtifact);
  const productionReadyGateEligible = resolveProductionReadyGateEligible(
    executionArtifact,
    highPriorityResolutionTargetMet
  );

  const traceabilityChains = executionArtifact.traceability_chain;
  const traceabilityPreserved =
    executionReport.traceability_preserved === true &&
    executionArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const highPriorityResolutionTargetMetValid =
    highPriorityResolutionTargetMet === executionArtifact.high_priority_resolution_target_met &&
    highPriorityResolutionTargetMet === executionReport.high_priority_resolution_target_met;

  const expectedProductionReadyGateEligible = resolveProductionReadyGateEligible(
    executionArtifact,
    highPriorityResolutionTargetMet
  );
  const productionReadyGateEligibleValid =
    productionReadyGateEligible === expectedProductionReadyGateEligible;

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(GATE_HARDENING_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const highPriorityResolutionTargetNotMet = !highPriorityResolutionTargetMetValid;
  const productionReadyGateNotEligible = !productionReadyGateEligibleValid;
  const executionCertificationMissing = !executionCertificationConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const gateHardeningComplete =
    executionCertificationConsumed &&
    highPriorityResolutionTargetMetValid &&
    productionReadyGateEligibleValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified;

  const nextStageReady = gateHardeningComplete;

  if (executionCertificationMissing) {
    issues.push({ code: 'EXECUTION_CERTIFICATION_MISSING', message: 'Execution certification was not consumed', severity: 'error' });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (!highPriorityResolutionTargetMetValid) {
    issues.push({
      code: 'HIGH_PRIORITY_RESOLUTION_TARGET_NOT_MET',
      message: 'High priority resolution target met validation failed',
      severity: 'error',
      check_id: 'high_priority_resolution_target_met_valid',
    });
  }
  if (!productionReadyGateEligibleValid) {
    issues.push({
      code: 'PRODUCTION_READY_GATE_NOT_ELIGIBLE',
      message: 'Production ready gate eligible validation failed',
      severity: 'error',
      check_id: 'production_ready_gate_eligible_valid',
    });
  }

  const gateHardeningChecks: GateHardeningCheck[] = [
    {
      check_id: 'high_priority_resolution_target_met_valid',
      check_label: 'High Priority Resolution Target Met Valid',
      status: toStatus(highPriorityResolutionTargetMetValid),
    },
    {
      check_id: 'production_ready_gate_eligible_valid',
      check_label: 'Production Ready Gate Eligible Valid',
      status: toStatus(productionReadyGateEligibleValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvHighPriorityResolutionExecutionCertificationGateHardeningArtifact = {
    gate_hardening_id: 'mv-high-priority-resolution-execution-certification-gate-hardening-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PHASE,
    generated_at: timestamp,
    source_execution_certification_ref: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    certification_id: executionArtifact.certification_id,
    high_priority_resolution_target_met: highPriorityResolutionTargetMet,
    production_ready_gate_eligible: productionReadyGateEligible,
    remaining_high_priority_count: executionArtifact.remaining_high_priority_count,
    resolved_high_priority_count: executionArtifact.resolved_high_priority_count,
    high_priority_resolution_count: executionArtifact.high_priority_resolution_count,
    production_ready_dependency_required: executionArtifact.production_ready_dependency_required,
    critical_blocker_count: executionArtifact.critical_blocker_count,
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
      gate_hardening_artifact_write_scope: GATE_HARDENING_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    gate_hardening_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvHighPriorityResolutionExecutionCertificationGateHardeningManifest = {
    manifest_id: 'mv-high-priority-resolution-execution-certification-gate-hardening-manifest-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PHASE,
    generated_at: timestamp,
    high_priority_resolution_target_met: highPriorityResolutionTargetMet,
    production_ready_gate_eligible: productionReadyGateEligible,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH), `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const report: MvHighPriorityResolutionExecutionCertificationGateHardeningReport = {
    report_id: 'mv-high-priority-resolution-execution-certification-gate-hardening-report-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PHASE,
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
    source_execution_certification_ref: MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    mv_high_priority_resolution_execution_certification_report_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH,
    mv_high_priority_resolution_execution_certification_gate_hardening_export_dir:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_EXPORT_DIR,
    mv_high_priority_resolution_execution_certification_gate_hardening_manifest_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH,
    mv_high_priority_resolution_execution_certification_gate_hardening_artifact_path:
      MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH,
    gate_hardening_id: 'mv-high-priority-resolution-execution-certification-gate-hardening-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    high_priority_resolution_target_met: highPriorityResolutionTargetMet,
    production_ready_gate_eligible: productionReadyGateEligible,
    remaining_high_priority_count: executionArtifact.remaining_high_priority_count,
    resolved_high_priority_count: executionArtifact.resolved_high_priority_count,
    high_priority_resolution_count: executionArtifact.high_priority_resolution_count,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    execution_certification_consumed: toStatus(executionCertificationConsumed),
    high_priority_resolution_target_met_valid: toStatus(highPriorityResolutionTargetMetValid),
    production_ready_gate_eligible_valid: toStatus(productionReadyGateEligibleValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    high_priority_resolution_target_not_met: highPriorityResolutionTargetNotMet,
    production_ready_gate_not_eligible: productionReadyGateNotEligible,
    execution_certification_missing: executionCertificationMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_high_priority_resolution_execution_certification_gate_hardening_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS : null,
    next_stage_approved: pass,
    gate_hardening_checks: gateHardeningChecks,
    final_verdict: pass
      ? MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT
      : MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');
  return report;
}
