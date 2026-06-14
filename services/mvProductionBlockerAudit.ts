import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_READINESS_CERTIFIED_STATUS,
  MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH,
  type MvProductionReadinessCertificationArtifact,
} from './mvProductionReadinessCertification.js';
import {
  MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
  PRODUCTION_READINESS_TIER_PRODUCTION_READY,
  PRODUCTION_READINESS_TIER_TEST_READY,
  type RemainingBlocker,
} from './mvProductionReadinessGate.js';
import type { MvRuntimeTraceability } from './mvProductionRuntimeEngine.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_PRODUCTION_BLOCKER_AUDIT_PHASE =
  'PHASE-DIGITAL-STUDIO-016-MV_PRODUCTION_BLOCKER_AUDIT_V1' as const;
export const MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT = 'PASS_MV_PRODUCTION_BLOCKER_AUDIT_V1' as const;
export const MV_PRODUCTION_BLOCKER_AUDIT_FAIL_VERDICT = 'FAIL_MV_PRODUCTION_BLOCKER_AUDIT_V1' as const;
export const MV_PRODUCTION_BLOCKER_AUDITED_STATUS = 'MV_PRODUCTION_BLOCKER_AUDITED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_017_ENTRY' as const;
export const MV_PRODUCTION_BLOCKER_AUDIT_DIR = 'reports/mv_production_blocker_audit' as const;
export const MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH =
  'reports/mv_production_blocker_audit/mv-production-blocker-audit-report.json' as const;
export const MV_PRODUCTION_BLOCKER_AUDIT_MD_PATH =
  'reports/mv_production_blocker_audit/MV_PRODUCTION_BLOCKER_AUDIT.md' as const;
export const MV_PRODUCTION_BLOCKER_AUDIT_EXPORT_DIR = 'exports/mv_production_blocker_audit' as const;
export const MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH =
  'exports/mv_production_blocker_audit/mv-production-blocker-audit-manifest.json' as const;
export const MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH =
  'exports/mv_production_blocker_audit/mv-production-blocker-audit.json' as const;

export const BLOCKER_AUDIT_ARTIFACT_WRITE_SCOPE = 'exports/mv_production_blocker_audit/' as const;

export const BLOCKER_CATEGORY_TECHNICAL = 'technical' as const;
export const BLOCKER_CATEGORY_OPERATIONAL = 'operational' as const;
export const BLOCKER_CATEGORY_CONSISTENCY = 'consistency' as const;
export const BLOCKER_CATEGORY_QUALITY = 'quality' as const;
export const BLOCKER_CATEGORY_WORKFLOW = 'workflow' as const;

export const BLOCKER_CATEGORIES = [
  BLOCKER_CATEGORY_TECHNICAL,
  BLOCKER_CATEGORY_OPERATIONAL,
  BLOCKER_CATEGORY_CONSISTENCY,
  BLOCKER_CATEGORY_QUALITY,
  BLOCKER_CATEGORY_WORKFLOW,
] as const;

export type BlockerCategory = (typeof BLOCKER_CATEGORIES)[number];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type AuditStatus = 'PASS' | 'FAIL';

export type MvProductionBlockerAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  blocker_id?: string;
  check_id?: string;
};

export type BlockerAuditCheck = {
  check_id: string;
  check_label: string;
  status: AuditStatus;
};

export type BlockerSeveritySummary = {
  critical: number;
  warning: number;
  total: number;
};

export type BlockerCategoryBreakdown = Record<BlockerCategory, number>;

export type AuditedBlocker = {
  blocker_id: string;
  blocker_code: string;
  message: string;
  severity: 'critical' | 'warning';
  category: BlockerCategory;
  resolved: boolean;
};

export type ProductionReadyCandidate = {
  candidate_ready: boolean;
  current_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  critical_blockers_clear: boolean;
  warning_blockers_remaining: number;
  requirements: string[];
};

export type BlockerResolutionStep = {
  step_id: string;
  blocker_id: string;
  blocker_code: string;
  category: BlockerCategory;
  severity: 'critical' | 'warning';
  resolution_action: string;
  target_phase: string;
  plan_ready: boolean;
};

export type MvProductionBlockerAuditArtifact = {
  audit_id: string;
  phase: typeof MV_PRODUCTION_BLOCKER_AUDIT_PHASE;
  generated_at: string;
  source_readiness_certification_ref: typeof MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH;
  remaining_blocker_count: number;
  critical_blocker_count: number;
  warning_blocker_count: number;
  blocker_severity: BlockerSeveritySummary;
  blocker_category_breakdown: BlockerCategoryBreakdown;
  production_ready_candidate: ProductionReadyCandidate;
  blocker_resolution_plan: BlockerResolutionStep[];
  audited_blockers: AuditedBlocker[];
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    blocker_audit_artifact_write_scope: typeof BLOCKER_AUDIT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  blocker_audit_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionBlockerAuditManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_BLOCKER_AUDIT_PHASE;
  generated_at: string;
  remaining_blocker_count: number;
  critical_blocker_count: number;
  warning_blocker_count: number;
  production_ready_candidate_ready: boolean;
  traceability_preserved: boolean;
  safe_create_policy_verified: AuditStatus;
  next_stage_ready: AuditStatus;
  certification_status: typeof MV_PRODUCTION_BLOCKER_AUDITED_STATUS | null;
};

export type MvProductionBlockerAuditReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_BLOCKER_AUDIT_PHASE;
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
  source_readiness_certification_ref: typeof MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH;
  mv_production_readiness_certification_report_path: typeof MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH;
  mv_production_blocker_audit_export_dir: typeof MV_PRODUCTION_BLOCKER_AUDIT_EXPORT_DIR;
  mv_production_blocker_audit_manifest_path: typeof MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH;
  mv_production_blocker_audit_artifact_path: typeof MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH;
  audit_id: string;
  source_count: number;
  adapter_count: number;
  remaining_blocker_count: number;
  critical_blocker_count: number;
  warning_blocker_count: number;
  blocker_severity: BlockerSeveritySummary;
  blocker_category_breakdown: BlockerCategoryBreakdown;
  production_ready_candidate: ProductionReadyCandidate;
  blocker_resolution_plan: BlockerResolutionStep[];
  audited_blockers: AuditedBlocker[];
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  readiness_certification_consumed: AuditStatus;
  remaining_blocker_count_valid: AuditStatus;
  critical_blocker_count_valid: AuditStatus;
  warning_blocker_count_valid: AuditStatus;
  blocker_severity_valid: AuditStatus;
  blocker_category_breakdown_valid: AuditStatus;
  production_ready_candidate_valid: AuditStatus;
  blocker_resolution_plan_ready: AuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: AuditStatus;
  next_stage_ready: AuditStatus;
  unresolved_critical_blocker: boolean;
  critical_blocker_count_invalid: boolean;
  warning_blocker_count_invalid: boolean;
  blocker_severity_invalid: boolean;
  blocker_category_breakdown_missing: boolean;
  production_ready_candidate_invalid: boolean;
  blocker_resolution_plan_missing: boolean;
  readiness_certification_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_blocker_audit_ready: AuditStatus;
  certification_status: typeof MV_PRODUCTION_BLOCKER_AUDITED_STATUS | null;
  next_stage_approved: boolean;
  blocker_audit_checks: BlockerAuditCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT
    | typeof MV_PRODUCTION_BLOCKER_AUDIT_FAIL_VERDICT;
  issues: MvProductionBlockerAuditIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH,
] as const;

const BLOCKER_AUDIT_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH,
  MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_BLOCKER_AUDIT_DIR,
  MV_PRODUCTION_BLOCKER_AUDIT_EXPORT_DIR,
  MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH,
  MV_PRODUCTION_BLOCKER_AUDIT_MD_PATH,
  ...BLOCKER_AUDIT_EXPORT_WRITE_PATHS,
] as const;

const BLOCKER_CATEGORY_BY_CODE: Record<string, BlockerCategory> = {
  DATASET_REFS_EMPTY: BLOCKER_CATEGORY_CONSISTENCY,
  PRODUCTION_MODE_BLOCKED: BLOCKER_CATEGORY_OPERATIONAL,
  REAL_GENERATION_BLOCKED: BLOCKER_CATEGORY_OPERATIONAL,
  RUNTIME_NOT_EXECUTED: BLOCKER_CATEGORY_TECHNICAL,
  EXTERNAL_CALL_BLOCKED: BLOCKER_CATEGORY_TECHNICAL,
  GPU_EXECUTION_BLOCKED: BLOCKER_CATEGORY_TECHNICAL,
};

const RESOLUTION_ACTION_BY_CODE: Record<string, string> = {
  DATASET_REFS_EMPTY:
    'Bind story_mv dataset refs and revalidate traceability continuity before production promotion',
  PRODUCTION_MODE_BLOCKED:
    'Lift production_mode_blocked after DS-017 blocker resolution certification',
  REAL_GENERATION_BLOCKED:
    'Enable controlled real generation scope after production safety certification',
  RUNTIME_NOT_EXECUTED:
    'Execute production runtime validation under gated production scope',
  EXTERNAL_CALL_BLOCKED:
    'Authorize external provider calls through production runtime certification',
  GPU_EXECUTION_BLOCKED:
    'Enable GPU execution path after production infrastructure certification',
};

function toStatus(pass: boolean): AuditStatus {
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

function isUnderBlockerAuditWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(BLOCKER_AUDIT_ARTIFACT_WRITE_SCOPE) ||
    relativePath === BLOCKER_AUDIT_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function classifyBlockerCategory(blockerCode: string): BlockerCategory {
  return BLOCKER_CATEGORY_BY_CODE[blockerCode] ?? BLOCKER_CATEGORY_WORKFLOW;
}

function createEmptyCategoryBreakdown(): BlockerCategoryBreakdown {
  return {
    technical: 0,
    operational: 0,
    consistency: 0,
    quality: 0,
    workflow: 0,
  };
}

function auditBlockers(remainingBlockers: RemainingBlocker[]): AuditedBlocker[] {
  return remainingBlockers.map((blocker) => ({
    blocker_id: blocker.blocker_id,
    blocker_code: blocker.blocker_code,
    message: blocker.message,
    severity: blocker.severity,
    category: classifyBlockerCategory(blocker.blocker_code),
    resolved: blocker.resolved,
  }));
}

function buildCategoryBreakdown(auditedBlockers: AuditedBlocker[]): BlockerCategoryBreakdown {
  const breakdown = createEmptyCategoryBreakdown();
  for (const blocker of auditedBlockers) {
    breakdown[blocker.category] += 1;
  }
  return breakdown;
}

function buildBlockerSeveritySummary(auditedBlockers: AuditedBlocker[]): BlockerSeveritySummary {
  const critical = auditedBlockers.filter((blocker) => blocker.severity === 'critical').length;
  const warning = auditedBlockers.filter((blocker) => blocker.severity === 'warning').length;
  return {
    critical,
    warning,
    total: auditedBlockers.length,
  };
}

function buildProductionReadyCandidate(
  criticalBlockerCount: number,
  warningBlockerCount: number
): ProductionReadyCandidate {
  const criticalBlockersClear = criticalBlockerCount === 0;
  return {
    candidate_ready: criticalBlockersClear && warningBlockerCount === 0,
    current_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    critical_blockers_clear: criticalBlockersClear,
    warning_blockers_remaining: warningBlockerCount,
    requirements: [
      'Resolve all warning blockers through DS-017 blocker resolution certification',
      'Confirm critical_blocker_count remains 0',
      'Lift production_mode_blocked and real_generation_blocked under gated scope',
      'Validate production runtime execution with external and GPU paths certified',
      'Restore story_mv dataset refs and verify traceability continuity',
      'Achieve production_readiness_tier=PRODUCTION_READY with score >= 90',
    ],
  };
}

function buildBlockerResolutionPlan(auditedBlockers: AuditedBlocker[]): BlockerResolutionStep[] {
  return auditedBlockers.map((blocker, index) => ({
    step_id: `blocker_resolution_step_${index + 1}`,
    blocker_id: blocker.blocker_id,
    blocker_code: blocker.blocker_code,
    category: blocker.category,
    severity: blocker.severity,
    resolution_action:
      RESOLUTION_ACTION_BY_CODE[blocker.blocker_code] ??
      `Resolve ${blocker.blocker_code} before production promotion`,
    target_phase: 'DS-017',
    plan_ready: blocker.severity === 'warning' && !blocker.resolved,
  }));
}

function buildMarkdown(report: MvProductionBlockerAuditReport): string {
  const lines = [
    '# MV Production Blocker Audit',
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
    `**Remaining Blockers:** ${report.remaining_blocker_count}`,
    `**Critical Blockers:** ${report.critical_blocker_count}`,
    `**Warning Blockers:** ${report.warning_blocker_count}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
    `**Production Ready Candidate:** ${report.production_ready_candidate.candidate_ready}`,
    '',
    '## Blocker Severity',
    '',
    `| critical | warning | total |`,
    `| --- | --- | --- |`,
    `| ${report.blocker_severity.critical} | ${report.blocker_severity.warning} | ${report.blocker_severity.total} |`,
    '',
    '## Category Breakdown',
    '',
    '| category | count |',
    '| --- | --- |'
  );

  for (const category of BLOCKER_CATEGORIES) {
    lines.push(`| ${category} | ${report.blocker_category_breakdown[category]} |`);
  }

  lines.push('', '## Audited Blockers', '');
  for (const blocker of report.audited_blockers) {
    lines.push(
      `- [${blocker.severity}/${blocker.category}] ${blocker.blocker_code}: ${blocker.message}`
    );
  }

  lines.push('', '## Blocker Resolution Plan', '');
  for (const step of report.blocker_resolution_plan) {
    lines.push(`- ${step.step_id}: ${step.blocker_code} -> ${step.resolution_action}`);
  }

  lines.push('', '## Blocker Audit Checks', '');
  for (const check of report.blocker_audit_checks) {
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
  issues: MvProductionBlockerAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionBlockerAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const emptyBreakdown = createEmptyCategoryBreakdown();

  const report: MvProductionBlockerAuditReport = {
    report_id: 'mv-production-blocker-audit-report-v1',
    phase: MV_PRODUCTION_BLOCKER_AUDIT_PHASE,
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
    source_readiness_certification_ref: MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
    mv_production_readiness_certification_report_path: MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH,
    mv_production_blocker_audit_export_dir: MV_PRODUCTION_BLOCKER_AUDIT_EXPORT_DIR,
    mv_production_blocker_audit_manifest_path: MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH,
    mv_production_blocker_audit_artifact_path: MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
    audit_id: 'mv-production-blocker-audit-v1',
    source_count: 0,
    adapter_count: 0,
    remaining_blocker_count: 0,
    critical_blocker_count: 0,
    warning_blocker_count: 0,
    blocker_severity: { critical: 0, warning: 0, total: 0 },
    blocker_category_breakdown: emptyBreakdown,
    production_ready_candidate: buildProductionReadyCandidate(0, 0),
    blocker_resolution_plan: [],
    audited_blockers: [],
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    readiness_certification_consumed: 'FAIL',
    remaining_blocker_count_valid: 'FAIL',
    critical_blocker_count_valid: 'FAIL',
    warning_blocker_count_valid: 'FAIL',
    blocker_severity_valid: 'FAIL',
    blocker_category_breakdown_valid: 'FAIL',
    production_ready_candidate_valid: 'FAIL',
    blocker_resolution_plan_ready: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    unresolved_critical_blocker: true,
    critical_blocker_count_invalid: true,
    warning_blocker_count_invalid: true,
    blocker_severity_invalid: true,
    blocker_category_breakdown_missing: true,
    production_ready_candidate_invalid: true,
    blocker_resolution_plan_missing: true,
    readiness_certification_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_blocker_audit_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    blocker_audit_checks: [],
    final_verdict: MV_PRODUCTION_BLOCKER_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionBlockerAudit(
  projectRoot?: string
): MvProductionBlockerAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionBlockerAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const certificationReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    readiness_certified: boolean;
    readiness_tier: string;
    next_stage_ready: AuditStatus;
    mv_production_readiness_certification_ready: AuditStatus;
    traceability_preserved: boolean;
  }>(root, MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH);

  const certificationArtifact = loadJson<MvProductionReadinessCertificationArtifact>(
    root,
    MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH
  );
  const certificationManifestPath = path.join(
    root,
    MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH
  );

  if (
    !certificationReport ||
    !certificationArtifact ||
    !fs.existsSync(certificationManifestPath) ||
    certificationReport.final_verdict !== MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT ||
    certificationReport.certification_status !== MV_PRODUCTION_READINESS_CERTIFIED_STATUS ||
    certificationReport.readiness_certified !== true ||
    certificationReport.readiness_tier !== PRODUCTION_READINESS_TIER_TEST_READY ||
    certificationReport.next_stage_ready !== 'PASS' ||
    certificationReport.mv_production_readiness_certification_ready !== 'PASS'
  ) {
    issues.push({
      code: 'READINESS_CERTIFICATION_MISSING',
      message: `Required ${MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT} with ${MV_PRODUCTION_READINESS_CERTIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const gateArtifact = loadJson<{
    critical_blocker_count: number;
    warning_count: number;
    remaining_blockers: RemainingBlocker[];
  }>(root, MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH);

  if (!gateArtifact) {
    issues.push({
      code: 'READINESS_GATE_ARTIFACT_MISSING',
      message: 'Missing production readiness gate artifact for blocker cross-check',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const readinessCertificationConsumed =
    certificationArtifact.readiness_certification_complete === true &&
    certificationArtifact.next_stage_ready === true &&
    certificationArtifact.readiness_certified === true;

  const remainingBlockers = gateArtifact.remaining_blockers;
  const auditedBlockers = auditBlockers(remainingBlockers);
  const blockerSeverity = buildBlockerSeveritySummary(auditedBlockers);
  const blockerCategoryBreakdown = buildCategoryBreakdown(auditedBlockers);
  const blockerResolutionPlan = buildBlockerResolutionPlan(auditedBlockers);

  const remainingBlockerCount = auditedBlockers.length;
  const criticalBlockerCount = blockerSeverity.critical;
  const warningBlockerCount = blockerSeverity.warning;

  const productionReadyCandidate = buildProductionReadyCandidate(
    criticalBlockerCount,
    warningBlockerCount
  );

  const traceabilityChains = certificationArtifact.traceability_chain;
  const traceabilityPreserved =
    certificationReport.traceability_preserved === true &&
    certificationArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const remainingBlockerCountValid =
    remainingBlockerCount === gateArtifact.remaining_blockers.length &&
    remainingBlockerCount === blockerSeverity.total &&
    remainingBlockerCount === gateArtifact.warning_count + gateArtifact.critical_blocker_count;

  const criticalBlockerCountValid =
    criticalBlockerCount === 0 &&
    gateArtifact.critical_blocker_count === 0 &&
    !auditedBlockers.some((blocker) => blocker.severity === 'critical' && !blocker.resolved);

  const warningBlockerCountValid =
    warningBlockerCount === gateArtifact.warning_count &&
    blockerSeverity.warning === warningBlockerCount;

  const blockerSeverityValid =
    blockerSeverity.total === remainingBlockerCount &&
    blockerSeverity.critical + blockerSeverity.warning === blockerSeverity.total &&
    blockerSeverity.critical === criticalBlockerCount &&
    blockerSeverity.warning === warningBlockerCount;

  const blockerCategoryBreakdownValid =
    BLOCKER_CATEGORIES.every((category) => typeof blockerCategoryBreakdown[category] === 'number') &&
    BLOCKER_CATEGORIES.reduce((sum, category) => sum + blockerCategoryBreakdown[category], 0) ===
      remainingBlockerCount;

  const productionReadyCandidateValid =
    productionReadyCandidate.current_tier === PRODUCTION_READINESS_TIER_TEST_READY &&
    productionReadyCandidate.target_tier === PRODUCTION_READINESS_TIER_PRODUCTION_READY &&
    productionReadyCandidate.critical_blockers_clear === true &&
    productionReadyCandidate.warning_blockers_remaining === warningBlockerCount &&
    productionReadyCandidate.requirements.length > 0;

  const blockerResolutionPlanReady =
    blockerResolutionPlan.length === remainingBlockerCount &&
    blockerResolutionPlan.every((step) => step.plan_ready === true && step.target_phase === 'DS-017');

  const blockerAuditWriteScopeValid = BLOCKER_AUDIT_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderBlockerAuditWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && blockerAuditWriteScopeValid;

  const unresolvedCriticalBlocker = auditedBlockers.some(
    (blocker) => blocker.severity === 'critical' && !blocker.resolved
  );

  const blockerAuditComplete =
    readinessCertificationConsumed &&
    remainingBlockerCountValid &&
    criticalBlockerCountValid &&
    warningBlockerCountValid &&
    blockerSeverityValid &&
    blockerCategoryBreakdownValid &&
    productionReadyCandidateValid &&
    blockerResolutionPlanReady &&
    !unresolvedCriticalBlocker &&
    traceabilityPreserved &&
    safeCreatePolicyVerified;

  const nextStageReady = blockerAuditComplete;

  const criticalBlockerCountInvalid = !criticalBlockerCountValid;
  const warningBlockerCountInvalid = !warningBlockerCountValid;
  const blockerSeverityInvalid = !blockerSeverityValid;
  const blockerCategoryBreakdownMissing = !blockerCategoryBreakdownValid;
  const productionReadyCandidateInvalid = !productionReadyCandidateValid;
  const blockerResolutionPlanMissing = !blockerResolutionPlanReady;
  const readinessCertificationMissing = !readinessCertificationConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  if (readinessCertificationMissing) {
    issues.push({
      code: 'READINESS_CERTIFICATION_MISSING',
      message: 'Readiness certification was not consumed',
      severity: 'error',
    });
  }
  if (unresolvedCriticalBlocker) {
    issues.push({
      code: 'UNRESOLVED_CRITICAL_BLOCKER',
      message: 'Unresolved critical blockers remain',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across blocker audit',
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

  const blockerAuditChecks: BlockerAuditCheck[] = [
    {
      check_id: 'remaining_blocker_count_valid',
      check_label: 'Remaining Blocker Count Valid',
      status: toStatus(remainingBlockerCountValid),
    },
    {
      check_id: 'critical_blocker_count_valid',
      check_label: 'Critical Blocker Count Valid',
      status: toStatus(criticalBlockerCountValid),
    },
    {
      check_id: 'warning_blocker_count_valid',
      check_label: 'Warning Blocker Count Valid',
      status: toStatus(warningBlockerCountValid),
    },
    {
      check_id: 'blocker_severity_valid',
      check_label: 'Blocker Severity Valid',
      status: toStatus(blockerSeverityValid),
    },
    {
      check_id: 'blocker_category_breakdown_valid',
      check_label: 'Blocker Category Breakdown Valid',
      status: toStatus(blockerCategoryBreakdownValid),
    },
    {
      check_id: 'production_ready_candidate_valid',
      check_label: 'Production Ready Candidate Valid',
      status: toStatus(productionReadyCandidateValid),
    },
    {
      check_id: 'blocker_resolution_plan_ready',
      check_label: 'Blocker Resolution Plan Ready',
      status: toStatus(blockerResolutionPlanReady),
    },
  ];

  const pass =
    nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionBlockerAuditArtifact = {
    audit_id: 'mv-production-blocker-audit-v1',
    phase: MV_PRODUCTION_BLOCKER_AUDIT_PHASE,
    generated_at: timestamp,
    source_readiness_certification_ref: MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
    remaining_blocker_count: remainingBlockerCount,
    critical_blocker_count: criticalBlockerCount,
    warning_blocker_count: warningBlockerCount,
    blocker_severity: blockerSeverity,
    blocker_category_breakdown: blockerCategoryBreakdown,
    production_ready_candidate: productionReadyCandidate,
    blocker_resolution_plan: blockerResolutionPlan,
    audited_blockers: auditedBlockers,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      blocker_audit_artifact_write_scope: BLOCKER_AUDIT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    blocker_audit_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionBlockerAuditManifest = {
    manifest_id: 'mv-production-blocker-audit-manifest-v1',
    phase: MV_PRODUCTION_BLOCKER_AUDIT_PHASE,
    generated_at: timestamp,
    remaining_blocker_count: remainingBlockerCount,
    critical_blocker_count: criticalBlockerCount,
    warning_blocker_count: warningBlockerCount,
    production_ready_candidate_ready: productionReadyCandidateValid,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_BLOCKER_AUDITED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionBlockerAuditReport = {
    report_id: 'mv-production-blocker-audit-report-v1',
    phase: MV_PRODUCTION_BLOCKER_AUDIT_PHASE,
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
    source_readiness_certification_ref: MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
    mv_production_readiness_certification_report_path: MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH,
    mv_production_blocker_audit_export_dir: MV_PRODUCTION_BLOCKER_AUDIT_EXPORT_DIR,
    mv_production_blocker_audit_manifest_path: MV_PRODUCTION_BLOCKER_AUDIT_MANIFEST_PATH,
    mv_production_blocker_audit_artifact_path: MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
    audit_id: 'mv-production-blocker-audit-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    remaining_blocker_count: remainingBlockerCount,
    critical_blocker_count: criticalBlockerCount,
    warning_blocker_count: warningBlockerCount,
    blocker_severity: blockerSeverity,
    blocker_category_breakdown: blockerCategoryBreakdown,
    production_ready_candidate: productionReadyCandidate,
    blocker_resolution_plan: blockerResolutionPlan,
    audited_blockers: auditedBlockers,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    readiness_certification_consumed: toStatus(readinessCertificationConsumed),
    remaining_blocker_count_valid: toStatus(remainingBlockerCountValid),
    critical_blocker_count_valid: toStatus(criticalBlockerCountValid),
    warning_blocker_count_valid: toStatus(warningBlockerCountValid),
    blocker_severity_valid: toStatus(blockerSeverityValid),
    blocker_category_breakdown_valid: toStatus(blockerCategoryBreakdownValid),
    production_ready_candidate_valid: toStatus(productionReadyCandidateValid),
    blocker_resolution_plan_ready: toStatus(blockerResolutionPlanReady),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    unresolved_critical_blocker: unresolvedCriticalBlocker,
    critical_blocker_count_invalid: criticalBlockerCountInvalid,
    warning_blocker_count_invalid: warningBlockerCountInvalid,
    blocker_severity_invalid: blockerSeverityInvalid,
    blocker_category_breakdown_missing: blockerCategoryBreakdownMissing,
    production_ready_candidate_invalid: productionReadyCandidateInvalid,
    blocker_resolution_plan_missing: blockerResolutionPlanMissing,
    readiness_certification_missing: readinessCertificationMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_blocker_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_BLOCKER_AUDITED_STATUS : null,
    next_stage_approved: pass,
    blocker_audit_checks: blockerAuditChecks,
    final_verdict: pass ? MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT : MV_PRODUCTION_BLOCKER_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLOCKER_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
