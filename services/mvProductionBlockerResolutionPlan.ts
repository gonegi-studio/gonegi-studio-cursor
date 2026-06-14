import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  BLOCKER_CATEGORIES,
  MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH,
  MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_AUDITED_STATUS,
  MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH,
  type AuditedBlocker,
  type BlockerCategory,
  type BlockerResolutionStep,
  type MvProductionBlockerAuditArtifact,
} from './mvProductionBlockerAudit.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
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

export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PHASE =
  'PHASE-DIGITAL-STUDIO-017-MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_V1' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT =
  'PASS_MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_V1' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_V1' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS =
  'MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_018_ENTRY' as const;
export const ESTIMATED_RESOLUTION_PHASES = 'DS_017~DS_018' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_DIR =
  'reports/mv_production_blocker_resolution_plan' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH =
  'reports/mv_production_blocker_resolution_plan/mv-production-blocker-resolution-plan-report.json' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MD_PATH =
  'reports/mv_production_blocker_resolution_plan/MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN.md' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_EXPORT_DIR =
  'exports/mv_production_blocker_resolution_plan' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH =
  'exports/mv_production_blocker_resolution_plan/mv-production-blocker-resolution-plan-manifest.json' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH =
  'exports/mv_production_blocker_resolution_plan/mv-production-blocker-resolution-plan.json' as const;

export const RESOLUTION_PLAN_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_blocker_resolution_plan/' as const;

export const RESOLUTION_PRIORITY_HIGH = 'HIGH' as const;
export const RESOLUTION_PRIORITY_MEDIUM = 'MEDIUM' as const;
export const RESOLUTION_PRIORITY_LOW = 'LOW' as const;

export const RESOLUTION_PRIORITIES = [
  RESOLUTION_PRIORITY_HIGH,
  RESOLUTION_PRIORITY_MEDIUM,
  RESOLUTION_PRIORITY_LOW,
] as const;

export type ResolutionPriority = (typeof RESOLUTION_PRIORITIES)[number];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type PlanStatus = 'PASS' | 'FAIL';

export type MvProductionBlockerResolutionPlanIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  blocker_id?: string;
  check_id?: string;
};

export type ResolutionPlanCheck = {
  check_id: string;
  check_label: string;
  status: PlanStatus;
};

export type BlockerResolutionItem = {
  item_id: string;
  blocker_id: string;
  blocker_code: string;
  category: BlockerCategory;
  severity: 'warning';
  message: string;
  resolution_action: string;
  resolution_priority: ResolutionPriority;
  estimated_resolution_phases: typeof ESTIMATED_RESOLUTION_PHASES;
  plan_ready: boolean;
};

export type ResolutionPrioritySummary = Record<ResolutionPriority, number>;

export type MvProductionBlockerResolutionPlanArtifact = {
  resolution_plan_id: string;
  phase: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PHASE;
  generated_at: string;
  source_blocker_audit_ref: typeof MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH;
  blocker_audit_id: string;
  warning_blocker_count: number;
  blocker_resolution_items: BlockerResolutionItem[];
  resolution_priority: ResolutionPrioritySummary;
  estimated_resolution_phases: typeof ESTIMATED_RESOLUTION_PHASES;
  current_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  resolution_objective: string;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    resolution_plan_artifact_write_scope: typeof RESOLUTION_PLAN_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  resolution_plan_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionBlockerResolutionPlanManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PHASE;
  generated_at: string;
  warning_blocker_count: number;
  resolution_item_count: number;
  estimated_resolution_phases: typeof ESTIMATED_RESOLUTION_PHASES;
  traceability_preserved: boolean;
  safe_create_policy_verified: PlanStatus;
  next_stage_ready: PlanStatus;
  certification_status: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS | null;
};

export type MvProductionBlockerResolutionPlanReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PHASE;
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
  source_blocker_audit_ref: typeof MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH;
  mv_production_blocker_audit_report_path: typeof MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH;
  mv_production_blocker_resolution_plan_export_dir: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_EXPORT_DIR;
  mv_production_blocker_resolution_plan_manifest_path: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH;
  mv_production_blocker_resolution_plan_artifact_path: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH;
  resolution_plan_id: string;
  source_count: number;
  adapter_count: number;
  warning_blocker_count: number;
  blocker_resolution_items: BlockerResolutionItem[];
  resolution_priority: ResolutionPrioritySummary;
  estimated_resolution_phases: typeof ESTIMATED_RESOLUTION_PHASES;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  blocker_audit_consumed: PlanStatus;
  blocker_resolution_items_valid: PlanStatus;
  resolution_priority_valid: PlanStatus;
  estimated_resolution_phases_valid: PlanStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: PlanStatus;
  next_stage_ready: PlanStatus;
  blocker_resolution_items_missing: boolean;
  resolution_priority_missing: boolean;
  estimated_resolution_phases_missing: boolean;
  blocker_audit_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_blocker_resolution_plan_ready: PlanStatus;
  certification_status: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS | null;
  next_stage_approved: boolean;
  resolution_plan_checks: ResolutionPlanCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT
    | typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_FAIL_VERDICT;
  issues: MvProductionBlockerResolutionPlanIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH,
] as const;

const RESOLUTION_PLAN_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_DIR,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_EXPORT_DIR,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MD_PATH,
  ...RESOLUTION_PLAN_EXPORT_WRITE_PATHS,
] as const;

const RESOLUTION_PRIORITY_BY_CODE: Record<string, ResolutionPriority> = {
  DATASET_REFS_EMPTY: RESOLUTION_PRIORITY_HIGH,
  PRODUCTION_MODE_BLOCKED: RESOLUTION_PRIORITY_HIGH,
  REAL_GENERATION_BLOCKED: RESOLUTION_PRIORITY_HIGH,
  RUNTIME_NOT_EXECUTED: RESOLUTION_PRIORITY_MEDIUM,
  EXTERNAL_CALL_BLOCKED: RESOLUTION_PRIORITY_MEDIUM,
  GPU_EXECUTION_BLOCKED: RESOLUTION_PRIORITY_LOW,
};

const ESTIMATED_PHASES_PATTERN = /^DS_\d{3}~DS_\d{3}$/;

function toStatus(pass: boolean): PlanStatus {
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
  for (const [relativePath, snapshot] of Object.entries(snapshots)) {
    if (!snapshot) return false;
    const current = snapshotFile(root, relativePath);
    if (!current || current.size !== snapshot.size || current.mtimeMs !== snapshot.mtimeMs) {
      return false;
    }
  }
  return true;
}

function isUnderResolutionPlanWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(RESOLUTION_PLAN_ARTIFACT_WRITE_SCOPE) ||
    relativePath === RESOLUTION_PLAN_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function isResolutionPriorityValid(priority: string): priority is ResolutionPriority {
  return RESOLUTION_PRIORITIES.includes(priority as ResolutionPriority);
}

function isEstimatedResolutionPhasesValid(phases: string): boolean {
  return phases === ESTIMATED_RESOLUTION_PHASES && ESTIMATED_PHASES_PATTERN.test(phases);
}

function classifyResolutionPriority(blockerCode: string): ResolutionPriority {
  return RESOLUTION_PRIORITY_BY_CODE[blockerCode] ?? RESOLUTION_PRIORITY_MEDIUM;
}

function buildResolutionPrioritySummary(items: BlockerResolutionItem[]): ResolutionPrioritySummary {
  return {
    HIGH: items.filter((item) => item.resolution_priority === RESOLUTION_PRIORITY_HIGH).length,
    MEDIUM: items.filter((item) => item.resolution_priority === RESOLUTION_PRIORITY_MEDIUM).length,
    LOW: items.filter((item) => item.resolution_priority === RESOLUTION_PRIORITY_LOW).length,
  };
}

function findResolutionStep(
  steps: BlockerResolutionStep[],
  blockerId: string
): BlockerResolutionStep | undefined {
  return steps.find((step) => step.blocker_id === blockerId);
}

function buildBlockerResolutionItems(
  auditedBlockers: AuditedBlocker[],
  resolutionSteps: BlockerResolutionStep[]
): BlockerResolutionItem[] {
  return auditedBlockers
    .filter((blocker) => blocker.severity === 'warning' && !blocker.resolved)
    .map((blocker, index) => {
      const step = findResolutionStep(resolutionSteps, blocker.blocker_id);
      return {
        item_id: `blocker_resolution_item_${index + 1}`,
        blocker_id: blocker.blocker_id,
        blocker_code: blocker.blocker_code,
        category: blocker.category,
        severity: 'warning' as const,
        message: blocker.message,
        resolution_action:
          step?.resolution_action ?? `Resolve ${blocker.blocker_code} before production promotion`,
        resolution_priority: classifyResolutionPriority(blocker.blocker_code),
        estimated_resolution_phases: ESTIMATED_RESOLUTION_PHASES,
        plan_ready: step?.plan_ready === true,
      };
    });
}

function buildMarkdown(report: MvProductionBlockerResolutionPlanReport): string {
  const lines = [
    '# MV Production Blocker Resolution Plan',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    `**Warning Blockers:** ${report.warning_blocker_count}`,
    `**Estimated Resolution Phases:** ${report.estimated_resolution_phases}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
    '',
    '## Resolution Priority Summary',
    '',
    `| HIGH | MEDIUM | LOW |`,
    `| --- | --- | --- |`,
    `| ${report.resolution_priority.HIGH} | ${report.resolution_priority.MEDIUM} | ${report.resolution_priority.LOW} |`,
    '',
    '## Blocker Resolution Items',
    ''
  );

  for (const item of report.blocker_resolution_items) {
    lines.push(
      `- ${item.item_id} [${item.resolution_priority}] ${item.blocker_code} (${item.category}): ${item.resolution_action}`
    );
  }

  lines.push('', '## Resolution Plan Checks', '');
  for (const check of report.resolution_plan_checks) {
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
  issues: MvProductionBlockerResolutionPlanIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionBlockerResolutionPlanReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionBlockerResolutionPlanReport = {
    report_id: 'mv-production-blocker-resolution-plan-report-v1',
    phase: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PHASE,
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
    source_blocker_audit_ref: MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
    mv_production_blocker_audit_report_path: MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH,
    mv_production_blocker_resolution_plan_export_dir: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_EXPORT_DIR,
    mv_production_blocker_resolution_plan_manifest_path: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH,
    mv_production_blocker_resolution_plan_artifact_path: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
    resolution_plan_id: 'mv-production-blocker-resolution-plan-v1',
    source_count: 0,
    adapter_count: 0,
    warning_blocker_count: 0,
    blocker_resolution_items: [],
    resolution_priority: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    estimated_resolution_phases: ESTIMATED_RESOLUTION_PHASES,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    blocker_audit_consumed: 'FAIL',
    blocker_resolution_items_valid: 'FAIL',
    resolution_priority_valid: 'FAIL',
    estimated_resolution_phases_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    blocker_resolution_items_missing: true,
    resolution_priority_missing: true,
    estimated_resolution_phases_missing: true,
    blocker_audit_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_blocker_resolution_plan_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    resolution_plan_checks: [],
    final_verdict: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionBlockerResolutionPlan(
  projectRoot?: string
): MvProductionBlockerResolutionPlanReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionBlockerResolutionPlanIssue[] = [];
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
    warning_blocker_count: number;
    critical_blocker_count: number;
    next_stage_ready: PlanStatus;
    mv_production_blocker_audit_ready: PlanStatus;
    blocker_resolution_plan_ready: PlanStatus;
    traceability_preserved: boolean;
  }>(root, MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH);

  const auditArtifact = loadJson<MvProductionBlockerAuditArtifact>(
    root,
    MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH
  );
  const auditManifestPath = path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH);

  if (
    !auditReport ||
    !auditArtifact ||
    !fs.existsSync(auditManifestPath) ||
    auditReport.final_verdict !== MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT ||
    auditReport.certification_status !== MV_PRODUCTION_BLOCKER_AUDITED_STATUS ||
    auditReport.critical_blocker_count !== 0 ||
    auditReport.warning_blocker_count === 0 ||
    auditReport.next_stage_ready !== 'PASS' ||
    auditReport.mv_production_blocker_audit_ready !== 'PASS' ||
    auditReport.blocker_resolution_plan_ready !== 'PASS'
  ) {
    issues.push({
      code: 'BLOCKER_AUDIT_MISSING',
      message: `Required ${MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT} with ${MV_PRODUCTION_BLOCKER_AUDITED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const blockerAuditConsumed =
    auditArtifact.blocker_audit_complete === true &&
    auditArtifact.next_stage_ready === true &&
    auditArtifact.critical_blocker_count === 0 &&
    auditArtifact.warning_blocker_count === auditReport.warning_blocker_count;

  const blockerResolutionItems = buildBlockerResolutionItems(
    auditArtifact.audited_blockers,
    auditArtifact.blocker_resolution_plan
  );

  const resolutionPrioritySummary = buildResolutionPrioritySummary(blockerResolutionItems);
  const estimatedResolutionPhases = ESTIMATED_RESOLUTION_PHASES;

  const traceabilityChains = auditArtifact.traceability_chain;
  const traceabilityPreserved =
    auditReport.traceability_preserved === true &&
    auditArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const blockerResolutionItemsValid =
    blockerResolutionItems.length === auditArtifact.warning_blocker_count &&
    blockerResolutionItems.length === auditReport.warning_blocker_count &&
    blockerResolutionItems.every(
      (item) =>
        item.blocker_id.length > 0 &&
        item.blocker_code.length > 0 &&
        BLOCKER_CATEGORIES.includes(item.category) &&
        item.resolution_action.length > 0 &&
        item.plan_ready === true
    );

  const resolutionPriorityValid =
    blockerResolutionItems.length > 0 &&
    blockerResolutionItems.every((item) => isResolutionPriorityValid(item.resolution_priority)) &&
    resolutionPrioritySummary.HIGH + resolutionPrioritySummary.MEDIUM + resolutionPrioritySummary.LOW ===
      blockerResolutionItems.length;

  const estimatedResolutionPhasesValid = isEstimatedResolutionPhasesValid(estimatedResolutionPhases);

  const resolutionPlanWriteScopeValid = RESOLUTION_PLAN_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderResolutionPlanWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && resolutionPlanWriteScopeValid;

  const blockerResolutionItemsMissing = !blockerResolutionItemsValid;
  const resolutionPriorityMissing = !resolutionPriorityValid;
  const estimatedResolutionPhasesMissing = !estimatedResolutionPhasesValid;
  const blockerAuditMissing = !blockerAuditConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const resolutionPlanComplete =
    blockerAuditConsumed &&
    blockerResolutionItemsValid &&
    resolutionPriorityValid &&
    estimatedResolutionPhasesValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified;

  const nextStageReady = resolutionPlanComplete;

  if (blockerAuditMissing) {
    issues.push({
      code: 'BLOCKER_AUDIT_MISSING',
      message: 'Blocker audit was not consumed',
      severity: 'error',
    });
  }
  if (blockerResolutionItemsMissing) {
    issues.push({
      code: 'BLOCKER_RESOLUTION_ITEMS_MISSING',
      message: 'Blocker resolution items are missing or invalid',
      severity: 'error',
    });
  }
  if (resolutionPriorityMissing) {
    issues.push({
      code: 'RESOLUTION_PRIORITY_MISSING',
      message: 'Resolution priority classification is missing or invalid',
      severity: 'error',
    });
  }
  if (estimatedResolutionPhasesMissing) {
    issues.push({
      code: 'ESTIMATED_RESOLUTION_PHASES_MISSING',
      message: 'Estimated resolution phases are missing or invalid',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across resolution plan',
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

  const resolutionPlanChecks: ResolutionPlanCheck[] = [
    {
      check_id: 'blocker_resolution_items_valid',
      check_label: 'Blocker Resolution Items Valid',
      status: toStatus(blockerResolutionItemsValid),
    },
    {
      check_id: 'resolution_priority_valid',
      check_label: 'Resolution Priority Valid',
      status: toStatus(resolutionPriorityValid),
    },
    {
      check_id: 'estimated_resolution_phases_valid',
      check_label: 'Estimated Resolution Phases Valid',
      status: toStatus(estimatedResolutionPhasesValid),
    },
  ];

  const pass =
    nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionBlockerResolutionPlanArtifact = {
    resolution_plan_id: 'mv-production-blocker-resolution-plan-v1',
    phase: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PHASE,
    generated_at: timestamp,
    source_blocker_audit_ref: MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
    blocker_audit_id: auditArtifact.audit_id,
    warning_blocker_count: auditArtifact.warning_blocker_count,
    blocker_resolution_items: blockerResolutionItems,
    resolution_priority: resolutionPrioritySummary,
    estimated_resolution_phases: estimatedResolutionPhases,
    current_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    resolution_objective:
      'Resolve all warning blockers through DS-018 resolution certification and re-evaluate PRODUCTION_READY tier',
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      resolution_plan_artifact_write_scope: RESOLUTION_PLAN_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    resolution_plan_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionBlockerResolutionPlanManifest = {
    manifest_id: 'mv-production-blocker-resolution-plan-manifest-v1',
    phase: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PHASE,
    generated_at: timestamp,
    warning_blocker_count: auditArtifact.warning_blocker_count,
    resolution_item_count: blockerResolutionItems.length,
    estimated_resolution_phases: estimatedResolutionPhases,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionBlockerResolutionPlanReport = {
    report_id: 'mv-production-blocker-resolution-plan-report-v1',
    phase: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PHASE,
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
    source_blocker_audit_ref: MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
    mv_production_blocker_audit_report_path: MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH,
    mv_production_blocker_resolution_plan_export_dir: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_EXPORT_DIR,
    mv_production_blocker_resolution_plan_manifest_path: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH,
    mv_production_blocker_resolution_plan_artifact_path: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
    resolution_plan_id: 'mv-production-blocker-resolution-plan-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    warning_blocker_count: auditArtifact.warning_blocker_count,
    blocker_resolution_items: blockerResolutionItems,
    resolution_priority: resolutionPrioritySummary,
    estimated_resolution_phases: estimatedResolutionPhases,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    blocker_audit_consumed: toStatus(blockerAuditConsumed),
    blocker_resolution_items_valid: toStatus(blockerResolutionItemsValid),
    resolution_priority_valid: toStatus(resolutionPriorityValid),
    estimated_resolution_phases_valid: toStatus(estimatedResolutionPhasesValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    blocker_resolution_items_missing: blockerResolutionItemsMissing,
    resolution_priority_missing: resolutionPriorityMissing,
    estimated_resolution_phases_missing: estimatedResolutionPhasesMissing,
    blocker_audit_missing: blockerAuditMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_blocker_resolution_plan_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS : null,
    next_stage_approved: pass,
    resolution_plan_checks: resolutionPlanChecks,
    final_verdict: pass
      ? MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT
      : MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
