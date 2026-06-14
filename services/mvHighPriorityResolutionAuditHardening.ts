import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  BLOCKER_CATEGORIES,
  type BlockerCategory,
} from './mvProductionBlockerAudit.js';
import {
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
  RESOLUTION_PRIORITY_HIGH,
  type CertifiedBlockerResolutionItem,
} from './mvProductionBlockerResolutionCertification.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH,
  type HighPriorityBlockerCode,
  type MvHighPriorityResolutionAuditArtifact,
} from './mvHighPriorityResolutionAudit.js';
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

export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PHASE =
  'PHASE-DIGITAL-STUDIO-021A-MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT =
  'PASS_MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_FAIL_VERDICT =
  'FAIL_MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_V1' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS =
  'MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED' as const;
export const RESOLUTION_TARGET_PHASE = 'DS_022' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_022_ENTRY' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_DIR =
  'reports/mv_high_priority_resolution_audit_hardening' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH =
  'reports/mv_high_priority_resolution_audit_hardening/mv-high-priority-resolution-audit-hardening-report.json' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MD_PATH =
  'reports/mv_high_priority_resolution_audit_hardening/MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING.md' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_EXPORT_DIR =
  'exports/mv_high_priority_resolution_audit_hardening' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH =
  'exports/mv_high_priority_resolution_audit_hardening/mv-high-priority-resolution-audit-hardening-manifest.json' as const;
export const MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH =
  'exports/mv_high_priority_resolution_audit_hardening/mv-high-priority-resolution-audit-hardening.json' as const;

export const HIGH_PRIORITY_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE =
  'exports/mv_high_priority_resolution_audit_hardening/' as const;

export const RESOLUTION_OWNER_DATASET_CONSISTENCY = 'mv_dataset_consistency_owner' as const;
export const RESOLUTION_OWNER_PRODUCTION_OPS = 'mv_production_ops_owner' as const;
export const RESOLUTION_OWNER_GENERATION_OPS = 'mv_generation_ops_owner' as const;

export const RESOLUTION_OWNER_BY_BLOCKER_CODE: Record<HighPriorityBlockerCode, string> = {
  DATASET_REFS_EMPTY: RESOLUTION_OWNER_DATASET_CONSISTENCY,
  PRODUCTION_MODE_BLOCKED: RESOLUTION_OWNER_PRODUCTION_OPS,
  REAL_GENERATION_BLOCKED: RESOLUTION_OWNER_GENERATION_OPS,
};

export type HighPriorityCategoryBreakdown = Partial<Record<BlockerCategory, number>>;

export type ResolutionTargetPhaseByItem = Record<string, typeof RESOLUTION_TARGET_PHASE>;

export type ProductionReadyDependency = {
  required: boolean;
  dependent_blocker_codes: HighPriorityBlockerCode[];
};

export type ResolutionOwnerByItem = Record<string, string>;

export type AcceptanceCriteriaByItem = Record<string, string>;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type HardeningStatus = 'PASS' | 'FAIL';

export type MvHighPriorityResolutionAuditHardeningIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  blocker_code?: string;
  check_id?: string;
};

export type HardeningCheck = {
  check_id: string;
  check_label: string;
  status: HardeningStatus;
};

export type MvHighPriorityResolutionAuditHardeningArtifact = {
  hardening_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PHASE;
  generated_at: string;
  source_audit_ref: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH;
  audit_id: string;
  high_priority_items: HighPriorityBlockerCode[];
  high_priority_category_breakdown: HighPriorityCategoryBreakdown;
  resolution_target_phase: ResolutionTargetPhaseByItem;
  production_ready_dependency: ProductionReadyDependency;
  high_priority_item_ids: string[];
  resolution_owner: ResolutionOwnerByItem;
  acceptance_criteria: AcceptanceCriteriaByItem;
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
    high_priority_audit_hardening_artifact_write_scope: typeof HIGH_PRIORITY_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  hardening_complete: boolean;
  next_stage_ready: boolean;
};

export type MvHighPriorityResolutionAuditHardeningManifest = {
  manifest_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PHASE;
  generated_at: string;
  high_priority_resolution_count: number;
  remaining_high_priority_count: number;
  production_ready_dependency_required: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: HardeningStatus;
  next_stage_ready: HardeningStatus;
  certification_status: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS | null;
};

export type MvHighPriorityResolutionAuditHardeningReport = {
  report_id: string;
  phase: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PHASE;
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
  source_audit_ref: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH;
  mv_high_priority_resolution_audit_report_path: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH;
  mv_high_priority_resolution_audit_hardening_export_dir: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_EXPORT_DIR;
  mv_high_priority_resolution_audit_hardening_manifest_path: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH;
  mv_high_priority_resolution_audit_hardening_artifact_path: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH;
  hardening_id: string;
  source_count: number;
  adapter_count: number;
  high_priority_items: HighPriorityBlockerCode[];
  high_priority_category_breakdown: HighPriorityCategoryBreakdown;
  resolution_target_phase: ResolutionTargetPhaseByItem;
  production_ready_dependency: ProductionReadyDependency;
  high_priority_item_ids: string[];
  resolution_owner: ResolutionOwnerByItem;
  acceptance_criteria: AcceptanceCriteriaByItem;
  high_priority_resolution_count: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  audit_consumed: HardeningStatus;
  high_priority_category_breakdown_valid: HardeningStatus;
  resolution_target_phase_valid: HardeningStatus;
  production_ready_dependency_valid: HardeningStatus;
  high_priority_item_ids_valid: HardeningStatus;
  acceptance_criteria_valid: HardeningStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: HardeningStatus;
  next_stage_ready: HardeningStatus;
  high_priority_category_missing: boolean;
  resolution_target_phase_missing: boolean;
  production_ready_dependency_missing: boolean;
  high_priority_item_ids_missing: boolean;
  acceptance_criteria_missing: boolean;
  audit_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_high_priority_resolution_audit_hardening_ready: HardeningStatus;
  certification_status: typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS | null;
  next_stage_approved: boolean;
  hardening_checks: HardeningCheck[];
  final_verdict:
    | typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT
    | typeof MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_FAIL_VERDICT;
  issues: MvHighPriorityResolutionAuditHardeningIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH,
] as const;

const HARDENING_EXPORT_WRITE_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_EXPORT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MD_PATH,
  ...HARDENING_EXPORT_WRITE_PATHS,
] as const;

const EXPECTED_HIGH_PRIORITY_ITEM_IDS = [
  'dataset_refs_empty_story_mv_generation_plan_v1',
  'production_mode_blocked',
  'real_generation_blocked',
] as const;

function toStatus(pass: boolean): HardeningStatus {
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

function isUnderHardeningWriteScope(relativePath: string): boolean {
  return relativePath.startsWith(HIGH_PRIORITY_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE);
}

function isHighPriorityBlockerCode(value: string): value is HighPriorityBlockerCode {
  return (EXPECTED_HIGH_PRIORITY_BLOCKER_CODES as readonly string[]).includes(value);
}

function isBlockerCategory(value: string): value is BlockerCategory {
  return (BLOCKER_CATEGORIES as readonly string[]).includes(value);
}

function selectHighPriorityResolutionItems(
  items: CertifiedBlockerResolutionItem[],
  highPriorityItems: HighPriorityBlockerCode[]
): CertifiedBlockerResolutionItem[] {
  return highPriorityItems
    .map((blockerCode) =>
      items.find(
        (item) =>
          item.blocker_code === blockerCode && item.resolution_priority === RESOLUTION_PRIORITY_HIGH
      )
    )
    .filter((item): item is CertifiedBlockerResolutionItem => item !== undefined);
}

function buildHighPriorityCategoryBreakdown(
  items: CertifiedBlockerResolutionItem[]
): HighPriorityCategoryBreakdown {
  const breakdown: HighPriorityCategoryBreakdown = {};
  for (const item of items) {
    if (!isBlockerCategory(item.category)) {
      continue;
    }
    breakdown[item.category] = (breakdown[item.category] ?? 0) + 1;
  }
  return breakdown;
}

function buildResolutionTargetPhase(
  highPriorityItems: HighPriorityBlockerCode[]
): ResolutionTargetPhaseByItem {
  const targetPhaseByItem: ResolutionTargetPhaseByItem = {};
  for (const blockerCode of highPriorityItems) {
    targetPhaseByItem[blockerCode] = RESOLUTION_TARGET_PHASE;
  }
  return targetPhaseByItem;
}

function buildProductionReadyDependency(
  highPriorityItems: HighPriorityBlockerCode[],
  requiredForProductionReady: boolean
): ProductionReadyDependency {
  return {
    required: requiredForProductionReady,
    dependent_blocker_codes: [...highPriorityItems],
  };
}

function buildResolutionOwner(highPriorityItems: HighPriorityBlockerCode[]): ResolutionOwnerByItem {
  const ownerByItem: ResolutionOwnerByItem = {};
  for (const blockerCode of highPriorityItems) {
    ownerByItem[blockerCode] = RESOLUTION_OWNER_BY_BLOCKER_CODE[blockerCode];
  }
  return ownerByItem;
}

function buildAcceptanceCriteria(
  items: CertifiedBlockerResolutionItem[]
): AcceptanceCriteriaByItem {
  const criteriaByItem: AcceptanceCriteriaByItem = {};
  for (const item of items) {
    criteriaByItem[item.blocker_code] = item.resolution_success_criteria;
  }
  return criteriaByItem;
}

function buildMarkdown(report: MvHighPriorityResolutionAuditHardeningReport): string {
  const lines = [
    '# MV High Priority Resolution Audit Hardening',
    '',
    `**Phase:** ${report.phase}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Status:** ${report.certification_status ?? 'NONE'}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Hardening Summary',
    '',
    `**High Priority Items:** ${report.high_priority_items.join(', ')}`,
    `**High Priority Item IDs:** ${report.high_priority_item_ids.join(', ')}`,
    `**Production Ready Dependency Required:** ${report.production_ready_dependency.required}`,
    `**Remaining High Priority Count:** ${report.remaining_high_priority_count}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
    '',
    '## Category Breakdown',
    '',
  ];

  for (const [category, count] of Object.entries(report.high_priority_category_breakdown)) {
    lines.push(`- ${category}: ${count}`);
  }

  lines.push('', '## Resolution Targets', '');
  for (const [blockerCode, targetPhase] of Object.entries(report.resolution_target_phase)) {
    lines.push(
      `- ${blockerCode}: phase=${targetPhase} owner=${report.resolution_owner[blockerCode]}`
    );
  }

  lines.push('', '## Acceptance Criteria', '');
  for (const [blockerCode, criteria] of Object.entries(report.acceptance_criteria)) {
    lines.push(`- ${blockerCode}: ${criteria}`);
  }

  lines.push('', '## Hardening Checks', '');
  for (const check of report.hardening_checks) {
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
  issues: MvHighPriorityResolutionAuditHardeningIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvHighPriorityResolutionAuditHardeningReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvHighPriorityResolutionAuditHardeningReport = {
    report_id: 'mv-high-priority-resolution-audit-hardening-report-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PHASE,
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
    source_audit_ref: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
    mv_high_priority_resolution_audit_report_path: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH,
    mv_high_priority_resolution_audit_hardening_export_dir:
      MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_EXPORT_DIR,
    mv_high_priority_resolution_audit_hardening_manifest_path:
      MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH,
    mv_high_priority_resolution_audit_hardening_artifact_path:
      MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
    hardening_id: 'mv-high-priority-resolution-audit-hardening-v1',
    source_count: 0,
    adapter_count: 0,
    high_priority_items: [],
    high_priority_category_breakdown: {},
    resolution_target_phase: {},
    production_ready_dependency: { required: false, dependent_blocker_codes: [] },
    high_priority_item_ids: [],
    resolution_owner: {},
    acceptance_criteria: {},
    high_priority_resolution_count: 0,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    audit_consumed: 'FAIL',
    high_priority_category_breakdown_valid: 'FAIL',
    resolution_target_phase_valid: 'FAIL',
    production_ready_dependency_valid: 'FAIL',
    high_priority_item_ids_valid: 'FAIL',
    acceptance_criteria_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    high_priority_category_missing: true,
    resolution_target_phase_missing: true,
    production_ready_dependency_missing: true,
    high_priority_item_ids_missing: true,
    acceptance_criteria_missing: true,
    audit_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_high_priority_resolution_audit_hardening_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    hardening_checks: [],
    final_verdict: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvHighPriorityResolutionAuditHardening(
  projectRoot?: string
): MvHighPriorityResolutionAuditHardeningReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvHighPriorityResolutionAuditHardeningIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const auditReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: HardeningStatus;
    mv_high_priority_resolution_audit_ready: HardeningStatus;
    traceability_preserved: boolean;
    high_priority_items: string[];
    remaining_high_priority_count: number;
    resolved_high_priority_count: number;
    high_priority_resolution_count: number;
    required_for_production_ready: boolean;
  }>(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH);

  const auditArtifact = loadJson<MvHighPriorityResolutionAuditArtifact>(
    root,
    MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH
  );
  const auditManifestPath = path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_MANIFEST_PATH);

  if (
    !auditReport ||
    !auditArtifact ||
    !fs.existsSync(auditManifestPath) ||
    auditReport.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT ||
    auditReport.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS ||
    auditReport.next_stage_ready !== 'PASS' ||
    auditReport.mv_high_priority_resolution_audit_ready !== 'PASS'
  ) {
    issues.push({
      code: 'AUDIT_MISSING',
      message: `Required ${MV_HIGH_PRIORITY_RESOLUTION_AUDIT_PASS_VERDICT} with ${MV_HIGH_PRIORITY_RESOLUTION_AUDITED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const resolutionCertArtifact = loadJson<{
    blocker_resolution_items: CertifiedBlockerResolutionItem[];
  }>(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH);

  if (!resolutionCertArtifact) {
    issues.push({
      code: 'RESOLUTION_CERTIFICATION_ARTIFACT_MISSING',
      message: 'Missing blocker resolution certification artifact for hardened audit metadata',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const auditConsumed =
    auditArtifact.audit_complete === true &&
    auditArtifact.next_stage_ready === true &&
    auditArtifact.next_stage_gate_label === 'DS_022_ENTRY' &&
    auditArtifact.required_for_production_ready === true &&
    auditArtifact.target_readiness_tier === PRODUCTION_READINESS_TIER_PRODUCTION_READY &&
    auditArtifact.current_readiness_tier === PRODUCTION_READINESS_TIER_TEST_READY;

  const highPriorityItems = auditArtifact.high_priority_items.filter(isHighPriorityBlockerCode);
  const highPriorityResolutionItems = selectHighPriorityResolutionItems(
    resolutionCertArtifact.blocker_resolution_items,
    highPriorityItems
  );
  const highPriorityCategoryBreakdown = buildHighPriorityCategoryBreakdown(highPriorityResolutionItems);
  const resolutionTargetPhase = buildResolutionTargetPhase(highPriorityItems);
  const productionReadyDependency = buildProductionReadyDependency(
    highPriorityItems,
    auditArtifact.required_for_production_ready
  );
  const highPriorityItemIds = highPriorityResolutionItems.map((item) => item.blocker_id);
  const resolutionOwner = buildResolutionOwner(highPriorityItems);
  const acceptanceCriteria = buildAcceptanceCriteria(highPriorityResolutionItems);

  const traceabilityChains = auditArtifact.traceability_chain;
  const traceabilityPreserved =
    auditReport.traceability_preserved === true &&
    auditArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const categoryCountTotal = Object.values(highPriorityCategoryBreakdown).reduce(
    (total, count) => total + count,
    0
  );

  const highPriorityCategoryBreakdownValid =
    categoryCountTotal === highPriorityItems.length &&
    (highPriorityCategoryBreakdown.consistency ?? 0) === 1 &&
    (highPriorityCategoryBreakdown.operational ?? 0) === 2 &&
    highPriorityResolutionItems.every((item) => isBlockerCategory(item.category));

  const resolutionTargetPhaseValid =
    highPriorityItems.every(
      (blockerCode) => resolutionTargetPhase[blockerCode] === RESOLUTION_TARGET_PHASE
    ) && Object.keys(resolutionTargetPhase).length === highPriorityItems.length;

  const productionReadyDependencyValid =
    productionReadyDependency.required === true &&
    productionReadyDependency.dependent_blocker_codes.length === highPriorityItems.length &&
    highPriorityItems.every((blockerCode) =>
      productionReadyDependency.dependent_blocker_codes.includes(blockerCode)
    );

  const highPriorityItemIdsValid =
    highPriorityItemIds.length === highPriorityItems.length &&
    EXPECTED_HIGH_PRIORITY_ITEM_IDS.every((itemId) => highPriorityItemIds.includes(itemId)) &&
    highPriorityResolutionItems.every((item) => highPriorityItemIds.includes(item.blocker_id));

  const acceptanceCriteriaValid =
    highPriorityItems.every(
      (blockerCode) =>
        acceptanceCriteria[blockerCode] !== undefined && acceptanceCriteria[blockerCode].length > 0
    ) &&
    highPriorityResolutionItems.every(
      (item) =>
        item.resolution_success_criteria.length > 0 &&
        acceptanceCriteria[item.blocker_code] === item.resolution_success_criteria
    );

  const hardeningWriteScopeValid = HARDENING_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderHardeningWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && hardeningWriteScopeValid;

  const highPriorityCategoryMissing = !highPriorityCategoryBreakdownValid;
  const resolutionTargetPhaseMissing = !resolutionTargetPhaseValid;
  const productionReadyDependencyMissing = !productionReadyDependencyValid;
  const highPriorityItemIdsMissing = !highPriorityItemIdsValid;
  const acceptanceCriteriaMissing = !acceptanceCriteriaValid;
  const auditMissing = !auditConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const hardeningComplete =
    auditConsumed &&
    highPriorityCategoryBreakdownValid &&
    resolutionTargetPhaseValid &&
    productionReadyDependencyValid &&
    highPriorityItemIdsValid &&
    acceptanceCriteriaValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    Object.keys(resolutionOwner).length === highPriorityItems.length;

  const nextStageReady = hardeningComplete;

  if (auditMissing) {
    issues.push({
      code: 'AUDIT_MISSING',
      message: 'High priority resolution audit was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across high priority resolution audit hardening',
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
  if (highPriorityCategoryMissing) {
    issues.push({
      code: 'HIGH_PRIORITY_CATEGORY_MISSING',
      message: 'High priority category breakdown is missing or invalid',
      severity: 'error',
      check_id: 'high_priority_category_breakdown_valid',
    });
  }
  if (resolutionTargetPhaseMissing) {
    issues.push({
      code: 'RESOLUTION_TARGET_PHASE_MISSING',
      message: 'Resolution target phase mapping is missing or invalid',
      severity: 'error',
      check_id: 'resolution_target_phase_valid',
    });
  }
  if (productionReadyDependencyMissing) {
    issues.push({
      code: 'PRODUCTION_READY_DEPENDENCY_MISSING',
      message: 'Production ready dependency is missing or invalid',
      severity: 'error',
      check_id: 'production_ready_dependency_valid',
    });
  }
  if (highPriorityItemIdsMissing) {
    issues.push({
      code: 'HIGH_PRIORITY_ITEM_IDS_MISSING',
      message: 'High priority item ids are missing or invalid',
      severity: 'error',
      check_id: 'high_priority_item_ids_valid',
    });
  }
  if (acceptanceCriteriaMissing) {
    issues.push({
      code: 'ACCEPTANCE_CRITERIA_MISSING',
      message: 'Acceptance criteria are missing or invalid',
      severity: 'error',
      check_id: 'acceptance_criteria_valid',
    });
  }

  const hardeningChecks: HardeningCheck[] = [
    {
      check_id: 'high_priority_category_breakdown_valid',
      check_label: 'High Priority Category Breakdown Valid',
      status: toStatus(highPriorityCategoryBreakdownValid),
    },
    {
      check_id: 'resolution_target_phase_valid',
      check_label: 'Resolution Target Phase Valid',
      status: toStatus(resolutionTargetPhaseValid),
    },
    {
      check_id: 'production_ready_dependency_valid',
      check_label: 'Production Ready Dependency Valid',
      status: toStatus(productionReadyDependencyValid),
    },
    {
      check_id: 'high_priority_item_ids_valid',
      check_label: 'High Priority Item IDs Valid',
      status: toStatus(highPriorityItemIdsValid),
    },
    {
      check_id: 'acceptance_criteria_valid',
      check_label: 'Acceptance Criteria Valid',
      status: toStatus(acceptanceCriteriaValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvHighPriorityResolutionAuditHardeningArtifact = {
    hardening_id: 'mv-high-priority-resolution-audit-hardening-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PHASE,
    generated_at: timestamp,
    source_audit_ref: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
    audit_id: auditArtifact.audit_id,
    high_priority_items: highPriorityItems,
    high_priority_category_breakdown: highPriorityCategoryBreakdown,
    resolution_target_phase: resolutionTargetPhase,
    production_ready_dependency: productionReadyDependency,
    high_priority_item_ids: highPriorityItemIds,
    resolution_owner: resolutionOwner,
    acceptance_criteria: acceptanceCriteria,
    high_priority_resolution_count: auditArtifact.high_priority_resolution_count,
    resolved_high_priority_count: auditArtifact.resolved_high_priority_count,
    remaining_high_priority_count: auditArtifact.remaining_high_priority_count,
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
      high_priority_audit_hardening_artifact_write_scope:
        HIGH_PRIORITY_AUDIT_HARDENING_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    hardening_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvHighPriorityResolutionAuditHardeningManifest = {
    manifest_id: 'mv-high-priority-resolution-audit-hardening-manifest-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PHASE,
    generated_at: timestamp,
    high_priority_resolution_count: auditArtifact.high_priority_resolution_count,
    remaining_high_priority_count: auditArtifact.remaining_high_priority_count,
    production_ready_dependency_required: productionReadyDependency.required,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_EXPORT_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvHighPriorityResolutionAuditHardeningReport = {
    report_id: 'mv-high-priority-resolution-audit-hardening-report-v1',
    phase: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PHASE,
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
    source_audit_ref: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_ARTIFACT_PATH,
    mv_high_priority_resolution_audit_report_path: MV_HIGH_PRIORITY_RESOLUTION_AUDIT_REPORT_PATH,
    mv_high_priority_resolution_audit_hardening_export_dir:
      MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_EXPORT_DIR,
    mv_high_priority_resolution_audit_hardening_manifest_path:
      MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MANIFEST_PATH,
    mv_high_priority_resolution_audit_hardening_artifact_path:
      MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
    hardening_id: 'mv-high-priority-resolution-audit-hardening-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    high_priority_items: highPriorityItems,
    high_priority_category_breakdown: highPriorityCategoryBreakdown,
    resolution_target_phase: resolutionTargetPhase,
    production_ready_dependency: productionReadyDependency,
    high_priority_item_ids: highPriorityItemIds,
    resolution_owner: resolutionOwner,
    acceptance_criteria: acceptanceCriteria,
    high_priority_resolution_count: auditArtifact.high_priority_resolution_count,
    resolved_high_priority_count: auditArtifact.resolved_high_priority_count,
    remaining_high_priority_count: auditArtifact.remaining_high_priority_count,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    audit_consumed: toStatus(auditConsumed),
    high_priority_category_breakdown_valid: toStatus(highPriorityCategoryBreakdownValid),
    resolution_target_phase_valid: toStatus(resolutionTargetPhaseValid),
    production_ready_dependency_valid: toStatus(productionReadyDependencyValid),
    high_priority_item_ids_valid: toStatus(highPriorityItemIdsValid),
    acceptance_criteria_valid: toStatus(acceptanceCriteriaValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    high_priority_category_missing: highPriorityCategoryMissing,
    resolution_target_phase_missing: resolutionTargetPhaseMissing,
    production_ready_dependency_missing: productionReadyDependencyMissing,
    high_priority_item_ids_missing: highPriorityItemIdsMissing,
    acceptance_criteria_missing: acceptanceCriteriaMissing,
    audit_missing: auditMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_high_priority_resolution_audit_hardening_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS : null,
    next_stage_approved: pass,
    hardening_checks: hardeningChecks,
    final_verdict: pass
      ? MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT
      : MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
