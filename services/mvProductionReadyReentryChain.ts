import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED_STATUS,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PASS_VERDICT,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_REPORT_PATH,
  type MvHighPriorityItemResolutionEvidenceAuditArtifact,
} from './mvHighPriorityItemResolutionEvidenceAudit.js';
import { NEXT_REENTRY_GATE_LABEL } from './mvProductionReadyReentryTracking.js';
import {
  REENTRY_PATH_PRODUCTION_READY_CERTIFICATION,
  REENTRY_PATH_PRODUCTION_READY_REEVALUATION,
} from './mvProductionReadyReentryTerminationGate.js';
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

export const MV_PRODUCTION_READY_REENTRY_CHAIN_PHASE =
  'MV_PRODUCTION_READY_REENTRY_CHAIN_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_REENTRY_CHAIN_V1' as const;
export const MV_PRODUCTION_READY_REENTRY_CHAIN_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_REENTRY_CHAIN_V1' as const;
export const DS_023_REENTRY_COMPLETED_STATUS = 'DS_023_REENTRY_COMPLETED' as const;
export const PRODUCTION_READY_REEVALUATION_COMPLETED_STATUS =
  'PRODUCTION_READY_REEVALUATION_COMPLETED' as const;
export const PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS =
  'PRODUCTION_READY_CERTIFICATION_ENTRY_READY' as const;
export const MV_PRODUCTION_READY_REENTRY_CHAIN_DIR =
  'reports/mv_production_ready_reentry_chain' as const;
export const MV_PRODUCTION_READY_REENTRY_CHAIN_REPORT_PATH =
  'reports/mv_production_ready_reentry_chain/mv-production-ready-reentry-chain-report.json' as const;
export const MV_PRODUCTION_READY_REENTRY_CHAIN_EXPORT_DIR =
  'exports/mv_production_ready_reentry_chain' as const;
export const MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH =
  'exports/mv_production_ready_reentry_chain/mv-production-ready-reentry-chain.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type ReentryChainStatus = 'PASS' | 'FAIL';

export type MvProductionReadyReentryChainArtifact = {
  reentry_chain_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_CHAIN_PHASE;
  generated_at: string;
  source_evidence_audit_ref: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  reentry_ready: boolean;
  ds_023_reentry_status: typeof DS_023_REENTRY_COMPLETED_STATUS | null;
  production_ready_reevaluation_status: typeof PRODUCTION_READY_REEVALUATION_COMPLETED_STATUS | null;
  production_ready_certification_status: typeof PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS | null;
  reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  reevaluation_path_label: typeof REENTRY_PATH_PRODUCTION_READY_REEVALUATION;
  certification_path_label: typeof REENTRY_PATH_PRODUCTION_READY_CERTIFICATION;
  production_ready_entry_allowed: boolean;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  reentry_chain_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyReentryChainReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_REENTRY_CHAIN_PHASE;
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
  source_evidence_audit_ref: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  reentry_ready: boolean;
  ds_023_reentry_status: typeof DS_023_REENTRY_COMPLETED_STATUS | null;
  production_ready_reevaluation_status: typeof PRODUCTION_READY_REEVALUATION_COMPLETED_STATUS | null;
  production_ready_certification_status: typeof PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS | null;
  reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  evidence_audit_consumed: ReentryChainStatus;
  reentry_ready_valid: ReentryChainStatus;
  resolved_high_priority_count_valid: ReentryChainStatus;
  remaining_high_priority_count_valid: ReentryChainStatus;
  ds_023_reentry_valid: ReentryChainStatus;
  production_ready_reevaluation_valid: ReentryChainStatus;
  production_ready_certification_valid: ReentryChainStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: ReentryChainStatus;
  next_stage_ready: ReentryChainStatus;
  mv_production_ready_reentry_chain_ready: ReentryChainStatus;
  certification_status: typeof PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS | null;
  next_stage_approved: boolean;
  final_verdict:
    | typeof MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_REENTRY_CHAIN_FAIL_VERDICT;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
};

function toStatus(pass: boolean): ReentryChainStatus {
  return pass ? 'PASS' : 'FAIL';
}

function loadJson<T>(root: string, relativePath: string): T | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

export function writeMvProductionReadyReentryChain(
  projectRoot?: string
): MvProductionReadyReentryChainReport {
  const root = resolveProjectRoot(projectRoot);
  const timestamp = new Date().toISOString();
  const issues: MvProductionReadyReentryChainReport['issues'] = [];

  const evidenceReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: ReentryChainStatus;
    mv_high_priority_item_resolution_evidence_audit_ready: ReentryChainStatus;
    traceability_preserved: boolean;
    resolved_high_priority_count: number;
    remaining_high_priority_count: number;
    reentry_ready: boolean;
    evidence_type: string;
    evidence_verified: boolean;
  }>(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_REPORT_PATH);

  const evidenceArtifact = loadJson<MvHighPriorityItemResolutionEvidenceAuditArtifact>(
    root,
    MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH
  );
  const evidenceManifestPath = path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_MANIFEST_PATH);

  if (
    !evidenceReport ||
    !evidenceArtifact ||
    !fs.existsSync(evidenceManifestPath) ||
    evidenceReport.final_verdict !== MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PASS_VERDICT ||
    evidenceReport.certification_status !== HIGH_PRIORITY_RESOLUTION_EVIDENCE_AUDITED_STATUS ||
    evidenceReport.next_stage_ready !== 'PASS' ||
    evidenceReport.mv_high_priority_item_resolution_evidence_audit_ready !== 'PASS'
  ) {
    issues.push({
      code: 'EVIDENCE_AUDIT_MISSING',
      message: `Required ${MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const resolvedHighPriorityCount = evidenceArtifact?.resolved_high_priority_count ?? 0;
  const remainingHighPriorityCount = evidenceArtifact?.remaining_high_priority_count ?? 3;
  const reentryReady = evidenceArtifact?.reentry_ready === true;
  const traceabilityChains = evidenceArtifact?.traceability_chain ?? [];
  const traceabilityPreserved =
    evidenceReport?.traceability_preserved === true &&
    evidenceArtifact?.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const evidenceAuditConsumed =
    evidenceArtifact?.resolution_evidence_audit_complete === true &&
    evidenceArtifact?.next_stage_ready === true;

  const reentryReadyValid = reentryReady === true && remainingHighPriorityCount === 0;
  const resolvedHighPriorityCountValid = resolvedHighPriorityCount === 3;
  const remainingHighPriorityCountValid = remainingHighPriorityCount === 0;
  const ds023ReentryValid =
    reentryReadyValid &&
    evidenceReport?.evidence_type === 'resolution_evidence' &&
    evidenceReport?.evidence_verified === true;
  const productionReadyReevaluationValid =
    ds023ReentryValid && resolvedHighPriorityCountValid && remainingHighPriorityCountValid;
  const productionReadyCertificationValid = productionReadyReevaluationValid && traceabilityPreserved;

  const pass =
    evidenceAuditConsumed &&
    reentryReadyValid &&
    resolvedHighPriorityCountValid &&
    remainingHighPriorityCountValid &&
    ds023ReentryValid &&
    productionReadyReevaluationValid &&
    productionReadyCertificationValid &&
    traceabilityPreserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyReentryChainArtifact = {
    reentry_chain_id: 'mv-production-ready-reentry-chain-v1',
    phase: MV_PRODUCTION_READY_REENTRY_CHAIN_PHASE,
    generated_at: timestamp,
    source_evidence_audit_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_ready: reentryReady,
    ds_023_reentry_status: pass ? DS_023_REENTRY_COMPLETED_STATUS : null,
    production_ready_reevaluation_status: pass ? PRODUCTION_READY_REEVALUATION_COMPLETED_STATUS : null,
    production_ready_certification_status: pass ? PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS : null,
    reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    reevaluation_path_label: REENTRY_PATH_PRODUCTION_READY_REEVALUATION,
    certification_path_label: REENTRY_PATH_PRODUCTION_READY_CERTIFICATION,
    production_ready_entry_allowed: pass,
    current_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    reentry_chain_complete: pass,
    next_stage_ready: pass,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_CHAIN_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyReentryChainReport = {
    report_id: 'mv-production-ready-reentry-chain-report-v1',
    phase: MV_PRODUCTION_READY_REENTRY_CHAIN_PHASE,
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
    source_evidence_audit_ref: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    reentry_ready: reentryReady,
    ds_023_reentry_status: pass ? DS_023_REENTRY_COMPLETED_STATUS : null,
    production_ready_reevaluation_status: pass ? PRODUCTION_READY_REEVALUATION_COMPLETED_STATUS : null,
    production_ready_certification_status: pass ? PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS : null,
    reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    evidence_audit_consumed: toStatus(evidenceAuditConsumed),
    reentry_ready_valid: toStatus(reentryReadyValid),
    resolved_high_priority_count_valid: toStatus(resolvedHighPriorityCountValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    ds_023_reentry_valid: toStatus(ds023ReentryValid),
    production_ready_reevaluation_valid: toStatus(productionReadyReevaluationValid),
    production_ready_certification_valid: toStatus(productionReadyCertificationValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: 'PASS',
    next_stage_ready: pass ? 'PASS' : 'FAIL',
    mv_production_ready_reentry_chain_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS : null,
    next_stage_approved: pass,
    final_verdict: pass
      ? MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT
      : MV_PRODUCTION_READY_REENTRY_CHAIN_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_REENTRY_CHAIN_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_REENTRY_CHAIN_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
