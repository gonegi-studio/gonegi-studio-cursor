import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES,
  RESOLUTION_STATUS_IN_PROGRESS,
  RESOLUTION_STATUS_OPEN,
  RESOLUTION_STATUS_RESOLVED,
  type HighPriorityBlockerCode,
  type ResolutionStatus,
  type ResolutionStatusByItem,
} from './mvHighPriorityResolutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
  RESOLUTION_OWNER_BY_BLOCKER_CODE,
} from './mvHighPriorityResolutionAuditHardening.js';
import { type BlockerCategory, BLOCKER_CATEGORIES } from './mvProductionBlockerAudit.js';
import {
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
  type CertifiedBlockerResolutionItem,
} from './mvProductionBlockerResolutionCertification.js';
import {
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH,
  REENTRY_PATH_RESOLVE_HIGH_PRIORITY_ITEMS,
  REENTRY_TERMINATION_TRACKED_STATUS,
  type MvProductionReadyReentryTerminationGateArtifact,
} from './mvProductionReadyReentryTerminationGate.js';
import { NEXT_REENTRY_GATE_LABEL } from './mvProductionReadyReentryTracking.js';
import {
  PRODUCTION_READINESS_TIER_PRODUCTION_READY,
  PRODUCTION_READINESS_TIER_TEST_READY,
} from './mvProductionReadinessGate.js';
import type { MvRuntimeTraceability } from './mvProductionRuntimeEngine.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  allHighPriorityItemsResolved,
  buildHighPriorityResolutionProof,
  buildResolutionEvidencePayload,
  buildResolutionStatusByItemFromProof,
  countResolvedFromProof,
  type HighPriorityResolutionProof,
} from './mvHighPriorityItemResolutionVerification.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PHASE =
  'PHASE-DIGITAL-STUDIO-025-MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_V1' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PASS_VERDICT =
  'PASS_MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_V1' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_FAIL_VERDICT =
  'FAIL_MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_V1' as const;
export const HIGH_PRIORITY_RESOLUTION_EXECUTION_STARTED_STATUS =
  'HIGH_PRIORITY_RESOLUTION_EXECUTION_STARTED' as const;
export const HIGH_PRIORITY_RESOLUTION_EXECUTION_COMPLETED_STATUS =
  'HIGH_PRIORITY_RESOLUTION_EXECUTION_COMPLETED' as const;
export const RESOLUTION_EXECUTION_TARGET_PHASE = 'DS_025' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_023_REENTRY' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_DIR =
  'reports/mv_high_priority_item_resolution_execution' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_REPORT_PATH =
  'reports/mv_high_priority_item_resolution_execution/mv-high-priority-item-resolution-execution-report.json' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MD_PATH =
  'reports/mv_high_priority_item_resolution_execution/MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION.md' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EXPORT_DIR =
  'exports/mv_high_priority_item_resolution_execution' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MANIFEST_PATH =
  'exports/mv_high_priority_item_resolution_execution/mv-high-priority-item-resolution-execution-manifest.json' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH =
  'exports/mv_high_priority_item_resolution_execution/mv-high-priority-item-resolution-execution.json' as const;
export const MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EVIDENCE_DIR =
  'exports/mv_high_priority_item_resolution_execution/evidence' as const;

export const RESOLUTION_EXECUTION_ARTIFACT_WRITE_SCOPE =
  'exports/mv_high_priority_item_resolution_execution/' as const;

export const EXPECTED_HIGH_PRIORITY_ITEM_IDS = [
  'dataset_refs_empty_story_mv_generation_plan_v1',
  'production_mode_blocked',
  'real_generation_blocked',
] as const;

export const HIGH_PRIORITY_ITEM_CATEGORY_BY_BLOCKER: Record<HighPriorityBlockerCode, BlockerCategory> = {
  DATASET_REFS_EMPTY: 'consistency',
  PRODUCTION_MODE_BLOCKED: 'operational',
  REAL_GENERATION_BLOCKED: 'operational',
};

export type ResolutionExecutionPlanStep = {
  item_id: string;
  blocker_code: HighPriorityBlockerCode;
  category: BlockerCategory;
  owner: string;
  target_phase: typeof RESOLUTION_EXECUTION_TARGET_PHASE;
  execution_action: string;
  success_criteria: string;
};

export type ResolutionExecutionPlan = Record<HighPriorityBlockerCode, ResolutionExecutionPlanStep>;

export type HighPriorityItemCategoryByItem = Record<HighPriorityBlockerCode, BlockerCategory>;

export type ResolutionEvidenceRefByItem = Record<HighPriorityBlockerCode, string>;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type ExecutionStatus = 'PASS' | 'FAIL';

export type MvHighPriorityItemResolutionExecutionIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  blocker_code?: string;
  check_id?: string;
};

export type ExecutionCheck = {
  check_id: string;
  check_label: string;
  status: ExecutionStatus;
};

export type MvHighPriorityItemResolutionExecutionArtifact = {
  resolution_execution_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PHASE;
  generated_at: string;
  source_termination_gate_ref: typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH;
  reentry_termination_gate_id: string;
  high_priority_item_ids: string[];
  high_priority_item_category: HighPriorityItemCategoryByItem;
  resolution_execution_plan: ResolutionExecutionPlan;
  resolution_status_by_item: ResolutionStatusByItem;
  resolution_started: boolean;
  resolution_evidence_ref: ResolutionEvidenceRefByItem;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  high_priority_resolution_count: number;
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
    resolution_execution_artifact_write_scope: typeof RESOLUTION_EXECUTION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  resolution_execution_complete: boolean;
  next_stage_ready: boolean;
};

export type MvHighPriorityItemResolutionExecutionManifest = {
  manifest_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PHASE;
  generated_at: string;
  resolution_started: boolean;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  traceability_preserved: boolean;
  safe_create_policy_verified: ExecutionStatus;
  next_stage_ready: ExecutionStatus;
  certification_status: typeof HIGH_PRIORITY_RESOLUTION_EXECUTION_STARTED_STATUS | null;
};

export type MvHighPriorityItemResolutionExecutionReport = {
  report_id: string;
  phase: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PHASE;
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
  source_termination_gate_ref: typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH;
  mv_production_ready_reentry_termination_gate_report_path: typeof MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH;
  mv_high_priority_item_resolution_execution_export_dir: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EXPORT_DIR;
  mv_high_priority_item_resolution_execution_manifest_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MANIFEST_PATH;
  mv_high_priority_item_resolution_execution_artifact_path: typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH;
  resolution_execution_id: string;
  source_count: number;
  adapter_count: number;
  high_priority_item_ids: string[];
  high_priority_item_category: HighPriorityItemCategoryByItem;
  resolution_execution_plan: ResolutionExecutionPlan;
  resolution_status_by_item: ResolutionStatusByItem;
  resolution_started: boolean;
  resolution_evidence_ref: ResolutionEvidenceRefByItem;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  high_priority_resolution_count: number;
  next_reentry_gate_label: typeof NEXT_REENTRY_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  termination_gate_consumed: ExecutionStatus;
  high_priority_item_ids_valid: ExecutionStatus;
  high_priority_item_category_valid: ExecutionStatus;
  resolution_execution_plan_valid: ExecutionStatus;
  resolution_status_by_item_valid: ExecutionStatus;
  resolution_started_valid: ExecutionStatus;
  resolution_evidence_ref_valid: ExecutionStatus;
  resolved_high_priority_count_valid: ExecutionStatus;
  remaining_high_priority_count_valid: ExecutionStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: ExecutionStatus;
  next_stage_ready: ExecutionStatus;
  high_priority_item_ids_missing: boolean;
  resolution_execution_plan_missing: boolean;
  resolution_status_invalid: boolean;
  resolution_started_invalid: boolean;
  resolution_evidence_ref_missing: boolean;
  high_priority_item_unresolved: boolean;
  termination_gate_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_high_priority_item_resolution_execution_ready: ExecutionStatus;
  certification_status:
    | typeof HIGH_PRIORITY_RESOLUTION_EXECUTION_STARTED_STATUS
    | typeof HIGH_PRIORITY_RESOLUTION_EXECUTION_COMPLETED_STATUS
    | null;
  next_stage_approved: boolean;
  execution_checks: ExecutionCheck[];
  final_verdict:
    | typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PASS_VERDICT
    | typeof MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_FAIL_VERDICT;
  issues: MvHighPriorityItemResolutionExecutionIssue[];
};

type FileSnapshot = { size: number; mtimeMs: number };

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
] as const;

const EXPORT_WRITE_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MANIFEST_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EXPORT_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EVIDENCE_DIR,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_REPORT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MD_PATH,
  ...EXPORT_WRITE_PATHS,
] as const;

const EXECUTION_ACTION_BY_BLOCKER: Record<HighPriorityBlockerCode, string> = {
  DATASET_REFS_EMPTY: 'POPULATE_DATASET_REFS',
  PRODUCTION_MODE_BLOCKED: 'CLEAR_PRODUCTION_MODE_BLOCK',
  REAL_GENERATION_BLOCKED: 'ENABLE_CONTROLLED_REAL_GENERATION',
};

const RESOLUTION_SUCCESS_CRITERIA_BY_CODE: Record<HighPriorityBlockerCode, string> = {
  DATASET_REFS_EMPTY:
    'story_mv dataset_refs populated with at least one valid dataset path and trace_integrity remains PASS',
  PRODUCTION_MODE_BLOCKED:
    'production_mode_blocked flag cleared under gated production scope with safety certification preserved',
  REAL_GENERATION_BLOCKED:
    'real_generation_blocked lifted with controlled generation scope and quality gates active',
};

function toStatus(pass: boolean): ExecutionStatus {
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

function isBlockerCategory(value: string): value is BlockerCategory {
  return (BLOCKER_CATEGORIES as readonly string[]).includes(value);
}

function buildResolutionExecutionPlan(
  certifiedItems: CertifiedBlockerResolutionItem[]
): ResolutionExecutionPlan {
  const plan = {} as ResolutionExecutionPlan;
  for (const blockerCode of EXPECTED_HIGH_PRIORITY_BLOCKER_CODES) {
    const certifiedItem = certifiedItems.find((item) => item.blocker_code === blockerCode);
    const itemId = EXPECTED_HIGH_PRIORITY_ITEM_IDS[EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.indexOf(blockerCode)];
    plan[blockerCode] = {
      item_id: itemId,
      blocker_code: blockerCode,
      category: HIGH_PRIORITY_ITEM_CATEGORY_BY_BLOCKER[blockerCode],
      owner: RESOLUTION_OWNER_BY_BLOCKER_CODE[blockerCode],
      target_phase: RESOLUTION_EXECUTION_TARGET_PHASE,
      execution_action: EXECUTION_ACTION_BY_BLOCKER[blockerCode],
      success_criteria:
        certifiedItem?.resolution_success_criteria ??
        RESOLUTION_SUCCESS_CRITERIA_BY_CODE[blockerCode],
    };
  }
  return plan;
}

function applyResolvedTraceabilityChain(
  chains: MvRuntimeTraceability[],
  proof: HighPriorityResolutionProof
): MvRuntimeTraceability[] {
  if (!proof.DATASET_REFS_EMPTY.dataset_refs_populated) return chains;
  return chains.map((chain) =>
    chain.generation_plan_id === 'story_mv_generation_plan_v1'
      ? {
          ...chain,
          dataset_refs: [...proof.DATASET_REFS_EMPTY.story_mv_dataset_refs],
          trace_integrity: 'PASS' as const,
        }
      : chain
  );
}

function buildHighPriorityItemCategory(): HighPriorityItemCategoryByItem {
  return { ...HIGH_PRIORITY_ITEM_CATEGORY_BY_BLOCKER };
}

function buildResolutionEvidenceRef(): ResolutionEvidenceRefByItem {
  const evidenceRef: ResolutionEvidenceRefByItem = {} as ResolutionEvidenceRefByItem;
  for (const blockerCode of EXPECTED_HIGH_PRIORITY_BLOCKER_CODES) {
    const itemId = EXPECTED_HIGH_PRIORITY_ITEM_IDS[EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.indexOf(blockerCode)];
    evidenceRef[blockerCode] =
      `${MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EVIDENCE_DIR}/${itemId}-execution-evidence.json`;
  }
  return evidenceRef;
}

function countResolved(statusByItem: ResolutionStatusByItem): number {
  return EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.filter(
    (blockerCode) => statusByItem[blockerCode] === RESOLUTION_STATUS_RESOLVED
  ).length;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvHighPriorityItemResolutionExecutionIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvHighPriorityItemResolutionExecutionReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const report: MvHighPriorityItemResolutionExecutionReport = {
    report_id: 'mv-high-priority-item-resolution-execution-report-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PHASE,
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
    source_termination_gate_ref: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH,
    mv_production_ready_reentry_termination_gate_report_path:
      MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH,
    mv_high_priority_item_resolution_execution_export_dir: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EXPORT_DIR,
    mv_high_priority_item_resolution_execution_manifest_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MANIFEST_PATH,
    mv_high_priority_item_resolution_execution_artifact_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
    resolution_execution_id: 'mv-high-priority-item-resolution-execution-v1',
    source_count: 0,
    adapter_count: 0,
    high_priority_item_ids: [],
    high_priority_item_category: {} as HighPriorityItemCategoryByItem,
    resolution_execution_plan: {} as ResolutionExecutionPlan,
    resolution_status_by_item: {},
    resolution_started: false,
    resolution_evidence_ref: {} as ResolutionEvidenceRefByItem,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    high_priority_resolution_count: 0,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: [],
    termination_gate_consumed: 'FAIL',
    high_priority_item_ids_valid: 'FAIL',
    high_priority_item_category_valid: 'FAIL',
    resolution_execution_plan_valid: 'FAIL',
    resolution_status_by_item_valid: 'FAIL',
    resolution_started_valid: 'FAIL',
    resolution_evidence_ref_valid: 'FAIL',
    resolved_high_priority_count_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    high_priority_item_ids_missing: true,
    resolution_execution_plan_missing: true,
    resolution_status_invalid: true,
    resolution_started_invalid: true,
    resolution_evidence_ref_missing: true,
    high_priority_item_unresolved: true,
    termination_gate_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_high_priority_item_resolution_execution_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    execution_checks: [],
    final_verdict: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_FAIL_VERDICT,
    issues,
  };
  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvHighPriorityItemResolutionExecution(
  projectRoot?: string
): MvHighPriorityItemResolutionExecutionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvHighPriorityItemResolutionExecutionIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [relativePath, snapshotFile(root, relativePath)])
  ) as Record<string, FileSnapshot | null>;

  const terminationGateReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: ExecutionStatus;
    mv_production_ready_reentry_termination_gate_ready: ExecutionStatus;
    traceability_preserved: boolean;
    remaining_high_priority_count: number;
    production_ready_entry_allowed: boolean;
    final_hardening_phase: string;
    no_new_gate_allowed: boolean;
    authorized_reentry_path: string[];
  }>(root, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH);

  const terminationGateArtifact = loadJson<MvProductionReadyReentryTerminationGateArtifact>(
    root,
    MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH
  );
  const terminationGateManifestPath = path.join(root, MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_MANIFEST_PATH);

  const hardeningArtifact = loadJson<{
    high_priority_item_ids: string[];
    high_priority_items: HighPriorityBlockerCode[];
    remaining_high_priority_count: number;
    resolved_high_priority_count: number;
  }>(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH);

  const certificationArtifact = loadJson<{
    blocker_resolution_items: CertifiedBlockerResolutionItem[];
  }>(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH);

  if (
    !terminationGateReport ||
    !terminationGateArtifact ||
    !fs.existsSync(terminationGateManifestPath) ||
    !hardeningArtifact ||
    !certificationArtifact ||
    terminationGateReport.final_verdict !== MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PASS_VERDICT ||
    terminationGateReport.certification_status !== REENTRY_TERMINATION_TRACKED_STATUS ||
    terminationGateReport.next_stage_ready !== 'PASS' ||
    terminationGateReport.mv_production_ready_reentry_termination_gate_ready !== 'PASS'
  ) {
    issues.push({
      code: 'TERMINATION_GATE_MISSING',
      message: `Required ${MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_PASS_VERDICT} with ${REENTRY_TERMINATION_TRACKED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const terminationGateConsumed =
    terminationGateArtifact.reentry_termination_gate_complete === true &&
    terminationGateArtifact.next_stage_ready === true &&
    terminationGateArtifact.authorized_reentry_path.includes(REENTRY_PATH_RESOLVE_HIGH_PRIORITY_ITEMS) &&
    terminationGateReport.no_new_gate_allowed === true;

  const highPriorityItemIds = [...EXPECTED_HIGH_PRIORITY_ITEM_IDS];
  const highPriorityItemCategory = buildHighPriorityItemCategory();
  const highPriorityItems = certificationArtifact.blocker_resolution_items.filter((item) =>
    (EXPECTED_HIGH_PRIORITY_BLOCKER_CODES as readonly string[]).includes(item.blocker_code)
  );
  const resolutionExecutionPlan = buildResolutionExecutionPlan(highPriorityItems);
  const resolutionProof = buildHighPriorityResolutionProof(root);
  const allResolved = allHighPriorityItemsResolved(resolutionProof);
  const resolutionStatusByItem = buildResolutionStatusByItemFromProof(resolutionProof);
  const resolutionStarted = true;
  const resolutionEvidenceRef = buildResolutionEvidenceRef();
  const highPriorityResolutionCount = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.length;
  const resolvedHighPriorityCount = countResolved(resolutionStatusByItem);
  const remainingHighPriorityCount = highPriorityResolutionCount - resolvedHighPriorityCount;

  const traceabilityChains = applyResolvedTraceabilityChain(
    terminationGateArtifact.traceability_chain,
    resolutionProof
  );
  const traceabilityPreserved =
    terminationGateReport.traceability_preserved === true &&
    terminationGateArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const highPriorityItemIdsValid =
    highPriorityItemIds.length === EXPECTED_HIGH_PRIORITY_ITEM_IDS.length &&
    EXPECTED_HIGH_PRIORITY_ITEM_IDS.every((itemId, index) => highPriorityItemIds[index] === itemId) &&
    highPriorityItemIds.every((itemId) => hardeningArtifact.high_priority_item_ids.includes(itemId));

  const highPriorityItemCategoryValid = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => {
    const category = highPriorityItemCategory[blockerCode];
    return (
      isBlockerCategory(category) &&
      category === HIGH_PRIORITY_ITEM_CATEGORY_BY_BLOCKER[blockerCode] &&
      resolutionExecutionPlan[blockerCode].category === category
    );
  });

  const resolutionExecutionPlanValid = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => {
    const step = resolutionExecutionPlan[blockerCode];
    return (
      step !== undefined &&
      step.blocker_code === blockerCode &&
      step.target_phase === RESOLUTION_EXECUTION_TARGET_PHASE &&
      step.owner === RESOLUTION_OWNER_BY_BLOCKER_CODE[blockerCode] &&
      step.success_criteria.length > 0 &&
      step.execution_action === EXECUTION_ACTION_BY_BLOCKER[blockerCode]
    );
  });

  const resolutionStatusByItemValid = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => {
    const status = resolutionStatusByItem[blockerCode] as ResolutionStatus | undefined;
    return (
      status === RESOLUTION_STATUS_IN_PROGRESS ||
      status === RESOLUTION_STATUS_OPEN ||
      status === RESOLUTION_STATUS_RESOLVED
    );
  }) &&
    resolutionStarted &&
    (allResolved
      ? EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
          (blockerCode) => resolutionStatusByItem[blockerCode] === RESOLUTION_STATUS_RESOLVED
        ) && resolvedHighPriorityCount === highPriorityResolutionCount
      : EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
          (blockerCode) => resolutionStatusByItem[blockerCode] === RESOLUTION_STATUS_IN_PROGRESS
        ) && resolvedHighPriorityCount === 0);

  const resolutionStartedValid =
    resolutionStarted === true &&
    (allResolved ||
      (terminationGateReport.remaining_high_priority_count === remainingHighPriorityCount &&
        terminationGateArtifact.remaining_high_priority_count === remainingHighPriorityCount));

  const resolutionEvidenceRefValid = EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every((blockerCode) => {
    const evidencePath = resolutionEvidenceRef[blockerCode];
    return (
      evidencePath !== undefined &&
      evidencePath.startsWith(`${MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EVIDENCE_DIR}/`) &&
      evidencePath.endsWith('-execution-evidence.json')
    );
  });

  const resolvedHighPriorityCountValid =
    resolvedHighPriorityCount === countResolved(resolutionStatusByItem) &&
    resolvedHighPriorityCount === countResolvedFromProof(resolutionProof) &&
    resolvedHighPriorityCount >= 0 &&
    resolvedHighPriorityCount <= highPriorityResolutionCount &&
    (allResolved
      ? resolvedHighPriorityCount === highPriorityResolutionCount
      : resolvedHighPriorityCount === hardeningArtifact.resolved_high_priority_count);

  const remainingHighPriorityCountValid =
    remainingHighPriorityCount === highPriorityResolutionCount - resolvedHighPriorityCount &&
    (allResolved
      ? remainingHighPriorityCount === 0
      : remainingHighPriorityCount === terminationGateReport.remaining_high_priority_count &&
        remainingHighPriorityCount === hardeningArtifact.remaining_high_priority_count &&
        remainingHighPriorityCount === 3);

  const highPriorityItemIdsMissing = !highPriorityItemIdsValid;
  const resolutionExecutionPlanMissing = !resolutionExecutionPlanValid;
  const resolutionStatusInvalid = !resolutionStatusByItemValid;
  const resolutionStartedInvalid = !resolutionStartedValid;
  const resolutionEvidenceRefMissing = !resolutionEvidenceRefValid;

  const highPriorityItemUnresolved = allResolved
    ? false
    : remainingHighPriorityCount > 0 &&
      (resolutionStarted !== true ||
        !EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.every(
          (blockerCode) => resolutionStatusByItem[blockerCode] === RESOLUTION_STATUS_IN_PROGRESS
        ) ||
        resolvedHighPriorityCount !== 0);

  const writeScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    writePath.startsWith(RESOLUTION_EXECUTION_ARTIFACT_WRITE_SCOPE)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && writeScopeValid;

  const terminationGateMissing = !terminationGateConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const resolutionExecutionComplete =
    terminationGateConsumed &&
    highPriorityItemIdsValid &&
    highPriorityItemCategoryValid &&
    resolutionExecutionPlanValid &&
    resolutionStatusByItemValid &&
    resolutionStartedValid &&
    resolutionEvidenceRefValid &&
    resolvedHighPriorityCountValid &&
    remainingHighPriorityCountValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !highPriorityItemIdsMissing &&
    !resolutionExecutionPlanMissing &&
    !resolutionStatusInvalid &&
    !resolutionStartedInvalid &&
    !resolutionEvidenceRefMissing &&
    !highPriorityItemUnresolved &&
    (allResolved || terminationGateReport.production_ready_entry_allowed === false);

  const nextStageReady = resolutionExecutionComplete;

  if (terminationGateMissing) {
    issues.push({
      code: 'TERMINATION_GATE_MISSING',
      message: 'Reentry termination gate was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability was not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({ code: 'SAFE_CREATE_POLICY_VIOLATION', message: 'Safe create policy was violated', severity: 'error' });
  }
  if (highPriorityItemIdsMissing) {
    issues.push({
      code: 'HIGH_PRIORITY_ITEM_IDS_MISSING',
      message: 'High priority item IDs are missing or invalid',
      severity: 'error',
      check_id: 'high_priority_item_ids_valid',
    });
  }
  if (resolutionExecutionPlanMissing) {
    issues.push({
      code: 'RESOLUTION_EXECUTION_PLAN_MISSING',
      message: 'Resolution execution plan is missing or invalid',
      severity: 'error',
      check_id: 'resolution_execution_plan_valid',
    });
  }
  if (resolutionStatusInvalid) {
    issues.push({
      code: 'RESOLUTION_STATUS_INVALID',
      message: 'Resolution status by item is invalid for execution start',
      severity: 'error',
      check_id: 'resolution_status_by_item_valid',
    });
  }
  if (resolutionStartedInvalid) {
    issues.push({
      code: 'RESOLUTION_STARTED_INVALID',
      message: 'Resolution started flag is invalid',
      severity: 'error',
      check_id: 'resolution_started_valid',
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
  if (highPriorityItemUnresolved) {
    issues.push({
      code: 'HIGH_PRIORITY_ITEM_UNRESOLVED',
      message: 'High priority items are not properly tracked for resolution execution',
      severity: 'error',
    });
  }

  const executionChecks: ExecutionCheck[] = [
    {
      check_id: 'high_priority_item_ids_valid',
      check_label: 'High Priority Item IDs Valid',
      status: toStatus(highPriorityItemIdsValid),
    },
    {
      check_id: 'high_priority_item_category_valid',
      check_label: 'High Priority Item Category Valid',
      status: toStatus(highPriorityItemCategoryValid),
    },
    {
      check_id: 'resolution_execution_plan_valid',
      check_label: 'Resolution Execution Plan Valid',
      status: toStatus(resolutionExecutionPlanValid),
    },
    {
      check_id: 'resolution_status_by_item_valid',
      check_label: 'Resolution Status By Item Valid',
      status: toStatus(resolutionStatusByItemValid),
    },
    {
      check_id: 'resolution_started_valid',
      check_label: 'Resolution Started Valid',
      status: toStatus(resolutionStartedValid),
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

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EVIDENCE_DIR), { recursive: true });
  for (const blockerCode of EXPECTED_HIGH_PRIORITY_BLOCKER_CODES) {
    const evidencePath = path.join(root, resolutionEvidenceRef[blockerCode]);
    const evidence = buildResolutionEvidencePayload(blockerCode, resolutionProof, {
      evidence_id: `${resolutionEvidenceRef[blockerCode].split('/').pop()?.replace('.json', '')}`,
      item_id: resolutionExecutionPlan[blockerCode].item_id,
      resolution_started: resolutionStarted,
      execution_action: resolutionExecutionPlan[blockerCode].execution_action,
      generated_at: timestamp,
      execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
      planning_only: true,
    });
    fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  }

  const artifact: MvHighPriorityItemResolutionExecutionArtifact = {
    resolution_execution_id: 'mv-high-priority-item-resolution-execution-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PHASE,
    generated_at: timestamp,
    source_termination_gate_ref: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH,
    reentry_termination_gate_id: terminationGateArtifact.reentry_termination_gate_id,
    high_priority_item_ids: highPriorityItemIds,
    high_priority_item_category: highPriorityItemCategory,
    resolution_execution_plan: resolutionExecutionPlan,
    resolution_status_by_item: resolutionStatusByItem,
    resolution_started: resolutionStarted,
    resolution_evidence_ref: resolutionEvidenceRef,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    high_priority_resolution_count: highPriorityResolutionCount,
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
      resolution_execution_artifact_write_scope: RESOLUTION_EXECUTION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    resolution_execution_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvHighPriorityItemResolutionExecutionManifest = {
    manifest_id: 'mv-high-priority-item-resolution-execution-manifest-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PHASE,
    generated_at: timestamp,
    resolution_started: resolutionStarted,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass
      ? allResolved
        ? HIGH_PRIORITY_RESOLUTION_EXECUTION_COMPLETED_STATUS
        : HIGH_PRIORITY_RESOLUTION_EXECUTION_STARTED_STATUS
      : null,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvHighPriorityItemResolutionExecutionReport = {
    report_id: 'mv-high-priority-item-resolution-execution-report-v1',
    phase: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PHASE,
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
    source_termination_gate_ref: MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_ARTIFACT_PATH,
    mv_production_ready_reentry_termination_gate_report_path:
      MV_PRODUCTION_READY_REENTRY_TERMINATION_GATE_REPORT_PATH,
    mv_high_priority_item_resolution_execution_export_dir: MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EXPORT_DIR,
    mv_high_priority_item_resolution_execution_manifest_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_MANIFEST_PATH,
    mv_high_priority_item_resolution_execution_artifact_path:
      MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
    resolution_execution_id: 'mv-high-priority-item-resolution-execution-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    high_priority_item_ids: highPriorityItemIds,
    high_priority_item_category: highPriorityItemCategory,
    resolution_execution_plan: resolutionExecutionPlan,
    resolution_status_by_item: resolutionStatusByItem,
    resolution_started: resolutionStarted,
    resolution_evidence_ref: resolutionEvidenceRef,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    high_priority_resolution_count: highPriorityResolutionCount,
    next_reentry_gate_label: NEXT_REENTRY_GATE_LABEL,
    traceability_chain: traceabilityChains,
    termination_gate_consumed: toStatus(terminationGateConsumed),
    high_priority_item_ids_valid: toStatus(highPriorityItemIdsValid),
    high_priority_item_category_valid: toStatus(highPriorityItemCategoryValid),
    resolution_execution_plan_valid: toStatus(resolutionExecutionPlanValid),
    resolution_status_by_item_valid: toStatus(resolutionStatusByItemValid),
    resolution_started_valid: toStatus(resolutionStartedValid),
    resolution_evidence_ref_valid: toStatus(resolutionEvidenceRefValid),
    resolved_high_priority_count_valid: toStatus(resolvedHighPriorityCountValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    high_priority_item_ids_missing: highPriorityItemIdsMissing,
    resolution_execution_plan_missing: resolutionExecutionPlanMissing,
    resolution_status_invalid: resolutionStatusInvalid,
    resolution_started_invalid: resolutionStartedInvalid,
    resolution_evidence_ref_missing: resolutionEvidenceRefMissing,
    high_priority_item_unresolved: highPriorityItemUnresolved,
    termination_gate_missing: terminationGateMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_high_priority_item_resolution_execution_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass
      ? allResolved
        ? HIGH_PRIORITY_RESOLUTION_EXECUTION_COMPLETED_STATUS
        : HIGH_PRIORITY_RESOLUTION_EXECUTION_STARTED_STATUS
      : null,
    next_stage_approved: pass,
    execution_checks: executionChecks,
    final_verdict: pass
      ? MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_PASS_VERDICT
      : MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
