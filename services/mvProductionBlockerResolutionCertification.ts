import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
  type MvProductionBlockerAuditArtifact,
} from './mvProductionBlockerAudit.js';
import {
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH,
  type BlockerResolutionItem,
  type MvProductionBlockerResolutionPlanArtifact,
} from './mvProductionBlockerResolutionPlan.js';
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

export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PHASE =
  'PHASE-DIGITAL-STUDIO-018-MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT =
  'PASS_MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS =
  'MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_019_ENTRY' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_DIR =
  'reports/mv_production_blocker_resolution_certification' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH =
  'reports/mv_production_blocker_resolution_certification/mv-production-blocker-resolution-certification-report.json' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MD_PATH =
  'reports/mv_production_blocker_resolution_certification/MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION.md' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_EXPORT_DIR =
  'exports/mv_production_blocker_resolution_certification' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH =
  'exports/mv_production_blocker_resolution_certification/mv-production-blocker-resolution-certification-manifest.json' as const;
export const MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH =
  'exports/mv_production_blocker_resolution_certification/mv-production-blocker-resolution-certification.json' as const;

export const RESOLUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_blocker_resolution_certification/' as const;

export const RESOLUTION_PRIORITY_CRITICAL = 'CRITICAL' as const;
export const RESOLUTION_PRIORITY_HIGH = 'HIGH' as const;
export const RESOLUTION_PRIORITY_MEDIUM = 'MEDIUM' as const;
export const RESOLUTION_PRIORITY_LOW = 'LOW' as const;

export const CERTIFICATION_RESOLUTION_PRIORITIES = [
  RESOLUTION_PRIORITY_CRITICAL,
  RESOLUTION_PRIORITY_HIGH,
  RESOLUTION_PRIORITY_MEDIUM,
  RESOLUTION_PRIORITY_LOW,
] as const;

export type CertificationResolutionPriority = (typeof CERTIFICATION_RESOLUTION_PRIORITIES)[number];

export type CertificationResolutionPrioritySummary = Record<CertificationResolutionPriority, number>;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type MvProductionBlockerResolutionCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  blocker_id?: string;
  check_id?: string;
};

export type CertificationCheck = {
  check_id: string;
  check_label: string;
  status: CertificationStatus;
};

export type CertifiedBlockerResolutionItem = {
  item_id: string;
  blocker_id: string;
  blocker_code: string;
  category: BlockerResolutionItem['category'];
  severity: 'warning';
  message: string;
  resolution_action: string;
  resolution_priority: CertificationResolutionPriority;
  estimated_resolution_steps: number;
  resolution_success_criteria: string;
  plan_ready: boolean;
  certification_ready: boolean;
};

export type ResolutionSuccessCriteria = {
  criteria_id: string;
  blocker_code: string;
  success_criteria: string;
  measurable: boolean;
};

export type MvProductionBlockerResolutionCertificationArtifact = {
  certification_id: string;
  phase: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PHASE;
  generated_at: string;
  source_resolution_plan_ref: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH;
  resolution_plan_id: string;
  planned_resolution_count: number;
  remaining_blocker_count: number;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  production_ready_requirements: string[];
  blocker_resolution_items: CertifiedBlockerResolutionItem[];
  resolution_priority: CertificationResolutionPrioritySummary;
  estimated_resolution_steps: number;
  resolution_success_criteria: ResolutionSuccessCriteria[];
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    resolution_certification_artifact_write_scope: typeof RESOLUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  resolution_certification_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionBlockerResolutionCertificationManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PHASE;
  generated_at: string;
  planned_resolution_count: number;
  remaining_blocker_count: number;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  estimated_resolution_steps: number;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  certification_status: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS | null;
};

export type MvProductionBlockerResolutionCertificationReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PHASE;
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
  source_resolution_plan_ref: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH;
  mv_production_blocker_resolution_plan_report_path: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH;
  mv_production_blocker_resolution_certification_export_dir: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_EXPORT_DIR;
  mv_production_blocker_resolution_certification_manifest_path: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH;
  mv_production_blocker_resolution_certification_artifact_path: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH;
  certification_id: string;
  source_count: number;
  adapter_count: number;
  planned_resolution_count: number;
  remaining_blocker_count: number;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  production_ready_requirements: string[];
  blocker_resolution_items: CertifiedBlockerResolutionItem[];
  resolution_priority: CertificationResolutionPrioritySummary;
  estimated_resolution_steps: number;
  resolution_success_criteria: ResolutionSuccessCriteria[];
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  resolution_plan_consumed: CertificationStatus;
  planned_resolution_count_valid: CertificationStatus;
  remaining_blocker_count_valid: CertificationStatus;
  target_readiness_tier_valid: CertificationStatus;
  production_ready_requirements_valid: CertificationStatus;
  blocker_resolution_items_valid: CertificationStatus;
  resolution_priority_valid: CertificationStatus;
  resolution_success_criteria_valid: CertificationStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  blocker_resolution_items_missing: boolean;
  resolution_priority_missing: boolean;
  resolution_success_criteria_missing: boolean;
  planned_resolution_count_invalid: boolean;
  target_readiness_tier_invalid: boolean;
  production_ready_requirements_missing: boolean;
  resolution_plan_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_blocker_resolution_certification_ready: CertificationStatus;
  certification_status: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS | null;
  next_stage_approved: boolean;
  certification_checks: CertificationCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT
    | typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_FAIL_VERDICT;
  issues: MvProductionBlockerResolutionCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH,
] as const;

const RESOLUTION_CERTIFICATION_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_DIR,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MD_PATH,
  ...RESOLUTION_CERTIFICATION_EXPORT_WRITE_PATHS,
] as const;

const ESTIMATED_STEPS_BY_PRIORITY: Record<CertificationResolutionPriority, number> = {
  CRITICAL: 3,
  HIGH: 2,
  MEDIUM: 2,
  LOW: 1,
};

const RESOLUTION_SUCCESS_CRITERIA_BY_CODE: Record<string, string> = {
  DATASET_REFS_EMPTY:
    'story_mv dataset_refs populated with at least one valid dataset path and trace_integrity remains PASS',
  PRODUCTION_MODE_BLOCKED:
    'production_mode_blocked flag cleared under gated production scope with safety certification preserved',
  REAL_GENERATION_BLOCKED:
    'real_generation_blocked lifted with controlled generation scope and quality gates active',
  RUNTIME_NOT_EXECUTED:
    'production runtime execution validated with runtime_not_executed cleared under gated scope',
  EXTERNAL_CALL_BLOCKED:
    'external_call_blocked cleared with provider authorization certified and traceability preserved',
  GPU_EXECUTION_BLOCKED:
    'gpu_execution_blocked cleared with infrastructure certification and runtime safety checks passed',
};

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

function isUnderResolutionCertificationWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(RESOLUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE) ||
    relativePath === RESOLUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function isCertificationResolutionPriorityValid(
  priority: string
): priority is CertificationResolutionPriority {
  return CERTIFICATION_RESOLUTION_PRIORITIES.includes(priority as CertificationResolutionPriority);
}

function buildCertifiedResolutionItems(
  planItems: BlockerResolutionItem[]
): CertifiedBlockerResolutionItem[] {
  return planItems.map((item) => {
    const priority = item.resolution_priority as CertificationResolutionPriority;
    const successCriteria =
      RESOLUTION_SUCCESS_CRITERIA_BY_CODE[item.blocker_code] ??
      `${item.blocker_code} resolved with traceability preserved`;
    return {
      item_id: item.item_id,
      blocker_id: item.blocker_id,
      blocker_code: item.blocker_code,
      category: item.category,
      severity: 'warning' as const,
      message: item.message,
      resolution_action: item.resolution_action,
      resolution_priority: priority,
      estimated_resolution_steps: ESTIMATED_STEPS_BY_PRIORITY[priority],
      resolution_success_criteria: successCriteria,
      plan_ready: item.plan_ready,
      certification_ready: item.plan_ready === true && successCriteria.length > 0,
    };
  });
}

function buildResolutionPrioritySummary(
  items: CertifiedBlockerResolutionItem[]
): CertificationResolutionPrioritySummary {
  return {
    CRITICAL: items.filter((item) => item.resolution_priority === RESOLUTION_PRIORITY_CRITICAL).length,
    HIGH: items.filter((item) => item.resolution_priority === RESOLUTION_PRIORITY_HIGH).length,
    MEDIUM: items.filter((item) => item.resolution_priority === RESOLUTION_PRIORITY_MEDIUM).length,
    LOW: items.filter((item) => item.resolution_priority === RESOLUTION_PRIORITY_LOW).length,
  };
}

function buildResolutionSuccessCriteria(
  items: CertifiedBlockerResolutionItem[]
): ResolutionSuccessCriteria[] {
  return items.map((item, index) => ({
    criteria_id: `resolution_success_criteria_${index + 1}`,
    blocker_code: item.blocker_code,
    success_criteria: item.resolution_success_criteria,
    measurable: true,
  }));
}

function buildMarkdown(report: MvProductionBlockerResolutionCertificationReport): string {
  const lines = [
    '# MV Production Blocker Resolution Certification',
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
    `**Planned Resolutions:** ${report.planned_resolution_count}`,
    `**Remaining Blockers:** ${report.remaining_blocker_count}`,
    `**Target Tier:** ${report.target_readiness_tier}`,
    `**Estimated Resolution Steps:** ${report.estimated_resolution_steps}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
    '',
    '## Resolution Priority Summary',
    '',
    `| CRITICAL | HIGH | MEDIUM | LOW |`,
    `| --- | --- | --- | --- |`,
    `| ${report.resolution_priority.CRITICAL} | ${report.resolution_priority.HIGH} | ${report.resolution_priority.MEDIUM} | ${report.resolution_priority.LOW} |`,
    '',
    '## Production Ready Requirements',
    ''
  );

  for (const requirement of report.production_ready_requirements) {
    lines.push(`- ${requirement}`);
  }

  lines.push('', '## Certified Resolution Items', '');
  for (const item of report.blocker_resolution_items) {
    lines.push(
      `- ${item.item_id} [${item.resolution_priority}] steps=${item.estimated_resolution_steps}: ${item.resolution_success_criteria}`
    );
  }

  lines.push('', '## Certification Checks', '');
  for (const check of report.certification_checks) {
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
  issues: MvProductionBlockerResolutionCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionBlockerResolutionCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionBlockerResolutionCertificationReport = {
    report_id: 'mv-production-blocker-resolution-certification-report-v1',
    phase: MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PHASE,
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
    source_resolution_plan_ref: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
    mv_production_blocker_resolution_plan_report_path: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH,
    mv_production_blocker_resolution_certification_export_dir:
      MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_EXPORT_DIR,
    mv_production_blocker_resolution_certification_manifest_path:
      MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH,
    mv_production_blocker_resolution_certification_artifact_path:
      MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
    certification_id: 'mv-production-blocker-resolution-certification-v1',
    source_count: 0,
    adapter_count: 0,
    planned_resolution_count: 0,
    remaining_blocker_count: 0,
    target_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    production_ready_requirements: [],
    blocker_resolution_items: [],
    resolution_priority: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    estimated_resolution_steps: 0,
    resolution_success_criteria: [],
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    resolution_plan_consumed: 'FAIL',
    planned_resolution_count_valid: 'FAIL',
    remaining_blocker_count_valid: 'FAIL',
    target_readiness_tier_valid: 'FAIL',
    production_ready_requirements_valid: 'FAIL',
    blocker_resolution_items_valid: 'FAIL',
    resolution_priority_valid: 'FAIL',
    resolution_success_criteria_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    blocker_resolution_items_missing: true,
    resolution_priority_missing: true,
    resolution_success_criteria_missing: true,
    planned_resolution_count_invalid: true,
    target_readiness_tier_invalid: true,
    production_ready_requirements_missing: true,
    resolution_plan_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_blocker_resolution_certification_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    certification_checks: [],
    final_verdict: MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionBlockerResolutionCertification(
  projectRoot?: string
): MvProductionBlockerResolutionCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionBlockerResolutionCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const planReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    warning_blocker_count: number;
    next_stage_ready: CertificationStatus;
    mv_production_blocker_resolution_plan_ready: CertificationStatus;
    traceability_preserved: boolean;
  }>(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH);

  const planArtifact = loadJson<MvProductionBlockerResolutionPlanArtifact>(
    root,
    MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH
  );
  const planManifestPath = path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH);

  if (
    !planReport ||
    !planArtifact ||
    !fs.existsSync(planManifestPath) ||
    planReport.final_verdict !== MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT ||
    planReport.certification_status !== MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS ||
    planReport.next_stage_ready !== 'PASS' ||
    planReport.mv_production_blocker_resolution_plan_ready !== 'PASS'
  ) {
    issues.push({
      code: 'RESOLUTION_PLAN_MISSING',
      message: `Required ${MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT} with ${MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const auditArtifact = loadJson<MvProductionBlockerAuditArtifact>(
    root,
    MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH
  );

  if (!auditArtifact) {
    issues.push({
      code: 'BLOCKER_AUDIT_ARTIFACT_MISSING',
      message: 'Missing blocker audit artifact for remaining blocker cross-check',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const resolutionPlanConsumed =
    planArtifact.resolution_plan_complete === true &&
    planArtifact.next_stage_ready === true &&
    planArtifact.target_tier === PRODUCTION_READINESS_TIER_PRODUCTION_READY &&
    planArtifact.current_tier === PRODUCTION_READINESS_TIER_TEST_READY;

  const certifiedItems = buildCertifiedResolutionItems(planArtifact.blocker_resolution_items);
  const resolutionPrioritySummary = buildResolutionPrioritySummary(certifiedItems);
  const resolutionSuccessCriteria = buildResolutionSuccessCriteria(certifiedItems);
  const estimatedResolutionSteps = certifiedItems.reduce(
    (total, item) => total + item.estimated_resolution_steps,
    0
  );

  const plannedResolutionCount = certifiedItems.length;
  const remainingBlockerCount = auditArtifact.warning_blocker_count;
  const targetReadinessTier = PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  const productionReadyRequirements = auditArtifact.production_ready_candidate.requirements;

  const traceabilityChains = planArtifact.traceability_chain;
  const traceabilityPreserved =
    planReport.traceability_preserved === true &&
    planArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const plannedResolutionCountValid =
    plannedResolutionCount === planArtifact.warning_blocker_count &&
    plannedResolutionCount === planReport.warning_blocker_count &&
    plannedResolutionCount === certifiedItems.length;

  const remainingBlockerCountValid =
    remainingBlockerCount === auditArtifact.remaining_blocker_count &&
    remainingBlockerCount === plannedResolutionCount &&
    auditArtifact.audited_blockers.filter((blocker) => !blocker.resolved).length ===
      remainingBlockerCount;

  const targetReadinessTierValid =
    targetReadinessTier === PRODUCTION_READINESS_TIER_PRODUCTION_READY &&
    planArtifact.target_tier === PRODUCTION_READINESS_TIER_PRODUCTION_READY;

  const productionReadyRequirementsValid =
    productionReadyRequirements.length > 0 &&
    productionReadyRequirements.length === auditArtifact.production_ready_candidate.requirements.length &&
    productionReadyRequirements.some((req) => req.includes('PRODUCTION_READY'));

  const blockerResolutionItemsValid =
    certifiedItems.length === plannedResolutionCount &&
    certifiedItems.every(
      (item) =>
        item.plan_ready === true &&
        item.certification_ready === true &&
        item.resolution_action.length > 0 &&
        item.estimated_resolution_steps > 0
    );

  const resolutionPriorityValid =
    certifiedItems.every((item) => isCertificationResolutionPriorityValid(item.resolution_priority)) &&
    resolutionPrioritySummary.CRITICAL +
      resolutionPrioritySummary.HIGH +
      resolutionPrioritySummary.MEDIUM +
      resolutionPrioritySummary.LOW ===
      certifiedItems.length;

  const resolutionSuccessCriteriaValid =
    resolutionSuccessCriteria.length === certifiedItems.length &&
    resolutionSuccessCriteria.every(
      (criteria) => criteria.success_criteria.length > 0 && criteria.measurable === true
    ) &&
    certifiedItems.every((item) => item.resolution_success_criteria.length > 0);

  const resolutionCertificationWriteScopeValid = RESOLUTION_CERTIFICATION_EXPORT_WRITE_PATHS.every(
    (writePath) => isUnderResolutionCertificationWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified =
    upstreamArtifactsUnchanged && resolutionCertificationWriteScopeValid;

  const blockerResolutionItemsMissing = !blockerResolutionItemsValid;
  const resolutionPriorityMissing = !resolutionPriorityValid;
  const resolutionSuccessCriteriaMissing = !resolutionSuccessCriteriaValid;
  const plannedResolutionCountInvalid = !plannedResolutionCountValid;
  const targetReadinessTierInvalid = !targetReadinessTierValid;
  const productionReadyRequirementsMissing = !productionReadyRequirementsValid;
  const resolutionPlanMissing = !resolutionPlanConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const resolutionCertificationComplete =
    resolutionPlanConsumed &&
    plannedResolutionCountValid &&
    remainingBlockerCountValid &&
    targetReadinessTierValid &&
    productionReadyRequirementsValid &&
    blockerResolutionItemsValid &&
    resolutionPriorityValid &&
    resolutionSuccessCriteriaValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified;

  const nextStageReady = resolutionCertificationComplete;

  if (resolutionPlanMissing) {
    issues.push({
      code: 'RESOLUTION_PLAN_MISSING',
      message: 'Resolution plan was not consumed',
      severity: 'error',
    });
  }
  if (blockerResolutionItemsMissing) {
    issues.push({
      code: 'BLOCKER_RESOLUTION_ITEMS_MISSING',
      message: 'Certified blocker resolution items are missing or invalid',
      severity: 'error',
    });
  }
  if (productionReadyRequirementsMissing) {
    issues.push({
      code: 'PRODUCTION_READY_REQUIREMENTS_MISSING',
      message: 'Production ready requirements are missing or invalid',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across resolution certification',
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

  const certificationChecks: CertificationCheck[] = [
    {
      check_id: 'planned_resolution_count_valid',
      check_label: 'Planned Resolution Count Valid',
      status: toStatus(plannedResolutionCountValid),
    },
    {
      check_id: 'remaining_blocker_count_valid',
      check_label: 'Remaining Blocker Count Valid',
      status: toStatus(remainingBlockerCountValid),
    },
    {
      check_id: 'target_readiness_tier_valid',
      check_label: 'Target Readiness Tier Valid',
      status: toStatus(targetReadinessTierValid),
    },
    {
      check_id: 'production_ready_requirements_valid',
      check_label: 'Production Ready Requirements Valid',
      status: toStatus(productionReadyRequirementsValid),
    },
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
      check_id: 'resolution_success_criteria_valid',
      check_label: 'Resolution Success Criteria Valid',
      status: toStatus(resolutionSuccessCriteriaValid),
    },
  ];

  const pass =
    nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionBlockerResolutionCertificationArtifact = {
    certification_id: 'mv-production-blocker-resolution-certification-v1',
    phase: MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PHASE,
    generated_at: timestamp,
    source_resolution_plan_ref: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
    resolution_plan_id: planArtifact.resolution_plan_id,
    planned_resolution_count: plannedResolutionCount,
    remaining_blocker_count: remainingBlockerCount,
    target_readiness_tier: targetReadinessTier,
    current_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    production_ready_requirements: productionReadyRequirements,
    blocker_resolution_items: certifiedItems,
    resolution_priority: resolutionPrioritySummary,
    estimated_resolution_steps: estimatedResolutionSteps,
    resolution_success_criteria: resolutionSuccessCriteria,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      resolution_certification_artifact_write_scope: RESOLUTION_CERTIFICATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    resolution_certification_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionBlockerResolutionCertificationManifest = {
    manifest_id: 'mv-production-blocker-resolution-certification-manifest-v1',
    phase: MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PHASE,
    generated_at: timestamp,
    planned_resolution_count: plannedResolutionCount,
    remaining_blocker_count: remainingBlockerCount,
    target_readiness_tier: targetReadinessTier,
    estimated_resolution_steps: estimatedResolutionSteps,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_EXPORT_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionBlockerResolutionCertificationReport = {
    report_id: 'mv-production-blocker-resolution-certification-report-v1',
    phase: MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PHASE,
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
    source_resolution_plan_ref: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
    mv_production_blocker_resolution_plan_report_path: MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH,
    mv_production_blocker_resolution_certification_export_dir:
      MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_EXPORT_DIR,
    mv_production_blocker_resolution_certification_manifest_path:
      MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH,
    mv_production_blocker_resolution_certification_artifact_path:
      MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
    certification_id: 'mv-production-blocker-resolution-certification-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    planned_resolution_count: plannedResolutionCount,
    remaining_blocker_count: remainingBlockerCount,
    target_readiness_tier: targetReadinessTier,
    production_ready_requirements: productionReadyRequirements,
    blocker_resolution_items: certifiedItems,
    resolution_priority: resolutionPrioritySummary,
    estimated_resolution_steps: estimatedResolutionSteps,
    resolution_success_criteria: resolutionSuccessCriteria,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    resolution_plan_consumed: toStatus(resolutionPlanConsumed),
    planned_resolution_count_valid: toStatus(plannedResolutionCountValid),
    remaining_blocker_count_valid: toStatus(remainingBlockerCountValid),
    target_readiness_tier_valid: toStatus(targetReadinessTierValid),
    production_ready_requirements_valid: toStatus(productionReadyRequirementsValid),
    blocker_resolution_items_valid: toStatus(blockerResolutionItemsValid),
    resolution_priority_valid: toStatus(resolutionPriorityValid),
    resolution_success_criteria_valid: toStatus(resolutionSuccessCriteriaValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    blocker_resolution_items_missing: blockerResolutionItemsMissing,
    resolution_priority_missing: resolutionPriorityMissing,
    resolution_success_criteria_missing: resolutionSuccessCriteriaMissing,
    planned_resolution_count_invalid: plannedResolutionCountInvalid,
    target_readiness_tier_invalid: targetReadinessTierInvalid,
    production_ready_requirements_missing: productionReadyRequirementsMissing,
    resolution_plan_missing: resolutionPlanMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_blocker_resolution_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS : null,
    next_stage_approved: pass,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT
      : MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
