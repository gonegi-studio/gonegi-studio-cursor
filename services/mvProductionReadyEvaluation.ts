import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH } from './mvProductionBlockerAudit.js';
import {
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH,
  RESOLUTION_PRIORITY_HIGH,
  type CertifiedBlockerResolutionItem,
  type MvProductionBlockerResolutionCertificationArtifact,
} from './mvProductionBlockerResolutionCertification.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MAX_PRODUCTION_READINESS_SCORE,
  MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
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

export const MV_PRODUCTION_READY_EVALUATION_PHASE =
  'PHASE-DIGITAL-STUDIO-019-MV_PRODUCTION_READY_EVALUATION_V1' as const;
export const MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_EVALUATION_V1' as const;
export const MV_PRODUCTION_READY_EVALUATION_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_EVALUATION_V1' as const;
export const MV_PRODUCTION_READY_EVALUATED_STATUS = 'MV_PRODUCTION_READY_EVALUATED' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_020_ENTRY' as const;
export const MV_PRODUCTION_READY_EVALUATION_DIR = 'reports/mv_production_ready_evaluation' as const;
export const MV_PRODUCTION_READY_EVALUATION_REPORT_PATH =
  'reports/mv_production_ready_evaluation/mv-production-ready-evaluation-report.json' as const;
export const MV_PRODUCTION_READY_EVALUATION_MD_PATH =
  'reports/mv_production_ready_evaluation/MV_PRODUCTION_READY_EVALUATION.md' as const;
export const MV_PRODUCTION_READY_EVALUATION_EXPORT_DIR =
  'exports/mv_production_ready_evaluation' as const;
export const MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH =
  'exports/mv_production_ready_evaluation/mv-production-ready-evaluation-manifest.json' as const;
export const MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH =
  'exports/mv_production_ready_evaluation/mv-production-ready-evaluation.json' as const;

export const EVALUATION_ARTIFACT_WRITE_SCOPE = 'exports/mv_production_ready_evaluation/' as const;

export const PRODUCTION_READY_DECISION_APPROVED = 'APPROVED' as const;
export const PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED = 'CONDITIONAL_APPROVED' as const;
export const PRODUCTION_READY_DECISION_PENDING = 'PENDING' as const;
export const PRODUCTION_READY_DECISION_REJECTED = 'REJECTED' as const;

export const PRODUCTION_READY_DECISIONS = [
  PRODUCTION_READY_DECISION_APPROVED,
  PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED,
  PRODUCTION_READY_DECISION_PENDING,
  PRODUCTION_READY_DECISION_REJECTED,
] as const;

export type ProductionReadyDecision = (typeof PRODUCTION_READY_DECISIONS)[number];

export const EVALUATION_TIER_PRODUCTION_CANDIDATE = 'PRODUCTION_CANDIDATE' as const;
export const EVALUATION_TIER_TEST_READY_HOLD = 'TEST_READY_HOLD' as const;
export const EVALUATION_TIER_NOT_ELIGIBLE = 'NOT_ELIGIBLE' as const;

export const EVALUATION_TIERS = [
  EVALUATION_TIER_PRODUCTION_CANDIDATE,
  EVALUATION_TIER_TEST_READY_HOLD,
  EVALUATION_TIER_NOT_ELIGIBLE,
] as const;

export type EvaluationTier = (typeof EVALUATION_TIERS)[number];

export const PRODUCTION_CANDIDATE_MIN_SCORE = 90 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type EvaluationStatus = 'PASS' | 'FAIL';

export type MvProductionReadyEvaluationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type EvaluationCheck = {
  check_id: string;
  check_label: string;
  status: EvaluationStatus;
};

export type HighPriorityRequirement = {
  requirement_id: string;
  blocker_id: string;
  blocker_code: string;
  resolution_priority: typeof RESOLUTION_PRIORITY_HIGH;
  resolved: boolean;
  success_criteria: string;
};

export type MvProductionReadyEvaluationArtifact = {
  evaluation_id: string;
  phase: typeof MV_PRODUCTION_READY_EVALUATION_PHASE;
  generated_at: string;
  source_resolution_certification_ref: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH;
  certification_id: string;
  production_ready_decision: ProductionReadyDecision;
  evaluation_score: number;
  evaluation_tier: EvaluationTier;
  high_priority_requirement_count: number;
  high_priority_requirements: HighPriorityRequirement[];
  unresolved_high_priority_count: number;
  unresolved_medium_priority_count: number;
  unresolved_low_priority_count: number;
  remaining_blocker_count: number;
  critical_blocker_count: number;
  current_readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  target_readiness_tier: typeof PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  production_ready_requirements: string[];
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    evaluation_artifact_write_scope: typeof EVALUATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  evaluation_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadyEvaluationManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READY_EVALUATION_PHASE;
  generated_at: string;
  production_ready_decision: ProductionReadyDecision;
  evaluation_score: number;
  evaluation_tier: EvaluationTier;
  high_priority_requirement_count: number;
  traceability_preserved: boolean;
  safe_create_policy_verified: EvaluationStatus;
  next_stage_ready: EvaluationStatus;
  certification_status: typeof MV_PRODUCTION_READY_EVALUATED_STATUS | null;
};

export type MvProductionReadyEvaluationReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_EVALUATION_PHASE;
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
  source_resolution_certification_ref: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH;
  mv_production_blocker_resolution_certification_report_path: typeof MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH;
  mv_production_ready_evaluation_export_dir: typeof MV_PRODUCTION_READY_EVALUATION_EXPORT_DIR;
  mv_production_ready_evaluation_manifest_path: typeof MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH;
  mv_production_ready_evaluation_artifact_path: typeof MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH;
  evaluation_id: string;
  source_count: number;
  adapter_count: number;
  production_ready_decision: ProductionReadyDecision;
  evaluation_score: number;
  evaluation_tier: EvaluationTier;
  high_priority_requirement_count: number;
  high_priority_requirements: HighPriorityRequirement[];
  unresolved_high_priority_count: number;
  remaining_blocker_count: number;
  critical_blocker_count: number;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  resolution_certification_consumed: EvaluationStatus;
  evaluation_score_valid: EvaluationStatus;
  evaluation_tier_valid: EvaluationStatus;
  high_priority_requirement_count_valid: EvaluationStatus;
  production_ready_decision_valid: EvaluationStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: EvaluationStatus;
  next_stage_ready: EvaluationStatus;
  evaluation_score_invalid: boolean;
  evaluation_tier_invalid: boolean;
  high_priority_requirement_unresolved: boolean;
  production_ready_decision_invalid: boolean;
  resolution_certification_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_ready_evaluation_ready: EvaluationStatus;
  certification_status: typeof MV_PRODUCTION_READY_EVALUATED_STATUS | null;
  next_stage_approved: boolean;
  evaluation_checks: EvaluationCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_EVALUATION_FAIL_VERDICT;
  issues: MvProductionReadyEvaluationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH,
] as const;

const EVALUATION_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH,
  MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READY_EVALUATION_DIR,
  MV_PRODUCTION_READY_EVALUATION_EXPORT_DIR,
  MV_PRODUCTION_READY_EVALUATION_REPORT_PATH,
  MV_PRODUCTION_READY_EVALUATION_MD_PATH,
  ...EVALUATION_EXPORT_WRITE_PATHS,
] as const;

const SCORE_PENALTY_HIGH = 2;
const SCORE_PENALTY_MEDIUM = 1;
const SCORE_PENALTY_LOW = 0;

function toStatus(pass: boolean): EvaluationStatus {
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

function isUnderEvaluationWriteScope(relativePath: string): boolean {
  return relativePath.startsWith(EVALUATION_ARTIFACT_WRITE_SCOPE);
}

function isProductionReadyDecision(value: string): value is ProductionReadyDecision {
  return (PRODUCTION_READY_DECISIONS as readonly string[]).includes(value);
}

function isEvaluationTier(value: string): value is EvaluationTier {
  return (EVALUATION_TIERS as readonly string[]).includes(value);
}

function buildHighPriorityRequirements(
  items: CertifiedBlockerResolutionItem[]
): HighPriorityRequirement[] {
  return items
    .filter((item) => item.resolution_priority === RESOLUTION_PRIORITY_HIGH)
    .map((item, index) => ({
      requirement_id: `high_priority_requirement_${index + 1}`,
      blocker_id: item.blocker_id,
      blocker_code: item.blocker_code,
      resolution_priority: RESOLUTION_PRIORITY_HIGH,
      resolved: false,
      success_criteria: item.resolution_success_criteria,
    }));
}

function countUnresolvedByPriority(
  items: CertifiedBlockerResolutionItem[],
  priority: string
): number {
  return items.filter((item) => item.resolution_priority === priority).length;
}

function computeEvaluationScore(
  baseScore: number,
  unresolvedHigh: number,
  unresolvedMedium: number,
  unresolvedLow: number
): number {
  const raw =
    baseScore -
    unresolvedHigh * SCORE_PENALTY_HIGH -
    unresolvedMedium * SCORE_PENALTY_MEDIUM -
    unresolvedLow * SCORE_PENALTY_LOW;
  return Math.max(0, Math.min(MAX_PRODUCTION_READINESS_SCORE, raw));
}

function resolveEvaluationTier(
  score: number,
  decision: ProductionReadyDecision
): EvaluationTier {
  if (decision === PRODUCTION_READY_DECISION_REJECTED) {
    return EVALUATION_TIER_NOT_ELIGIBLE;
  }
  if (decision === PRODUCTION_READY_DECISION_PENDING) {
    return EVALUATION_TIER_TEST_READY_HOLD;
  }
  if (
    score >= PRODUCTION_CANDIDATE_MIN_SCORE &&
    (decision === PRODUCTION_READY_DECISION_APPROVED ||
      decision === PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED)
  ) {
    return EVALUATION_TIER_PRODUCTION_CANDIDATE;
  }
  return EVALUATION_TIER_TEST_READY_HOLD;
}

function resolveProductionReadyDecision(input: {
  criticalBlockerCount: number;
  resolutionCertificationConsumed: boolean;
  traceabilityPreserved: boolean;
  evaluationInProgress: boolean;
  unresolvedHighCount: number;
  remainingBlockerCount: number;
}): ProductionReadyDecision {
  if (input.criticalBlockerCount > 0 || !input.resolutionCertificationConsumed || !input.traceabilityPreserved) {
    return PRODUCTION_READY_DECISION_REJECTED;
  }
  if (input.evaluationInProgress) {
    return PRODUCTION_READY_DECISION_PENDING;
  }
  if (input.unresolvedHighCount === 0 && input.remainingBlockerCount === 0) {
    return PRODUCTION_READY_DECISION_APPROVED;
  }
  if (input.unresolvedHighCount > 0) {
    return PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED;
  }
  if (input.remainingBlockerCount > 0) {
    return PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED;
  }
  return PRODUCTION_READY_DECISION_APPROVED;
}

function buildMarkdown(report: MvProductionReadyEvaluationReport): string {
  const lines = [
    '# MV Production Ready Evaluation',
    '',
    `**Phase:** ${report.phase}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Status:** ${report.certification_status ?? 'NONE'}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Evaluation Summary',
    '',
    `**Production Ready Decision:** ${report.production_ready_decision}`,
    `**Evaluation Score:** ${report.evaluation_score}`,
    `**Evaluation Tier:** ${report.evaluation_tier}`,
    `**High Priority Requirement Count:** ${report.high_priority_requirement_count}`,
    `**Unresolved High Priority Count:** ${report.unresolved_high_priority_count}`,
    `**Remaining Blocker Count:** ${report.remaining_blocker_count}`,
    `**Critical Blocker Count:** ${report.critical_blocker_count}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
    '',
    '## High Priority Requirements',
    '',
  ];

  for (const requirement of report.high_priority_requirements) {
    lines.push(
      `- ${requirement.requirement_id} [${requirement.blocker_code}] resolved=${requirement.resolved}`
    );
  }

  lines.push('', '## Evaluation Checks', '');
  for (const check of report.evaluation_checks) {
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
  issues: MvProductionReadyEvaluationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadyEvaluationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionReadyEvaluationReport = {
    report_id: 'mv-production-ready-evaluation-report-v1',
    phase: MV_PRODUCTION_READY_EVALUATION_PHASE,
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
    source_resolution_certification_ref: MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
    mv_production_blocker_resolution_certification_report_path:
      MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH,
    mv_production_ready_evaluation_export_dir: MV_PRODUCTION_READY_EVALUATION_EXPORT_DIR,
    mv_production_ready_evaluation_manifest_path: MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH,
    mv_production_ready_evaluation_artifact_path: MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
    evaluation_id: 'mv-production-ready-evaluation-v1',
    source_count: 0,
    adapter_count: 0,
    production_ready_decision: PRODUCTION_READY_DECISION_REJECTED,
    evaluation_score: 0,
    evaluation_tier: EVALUATION_TIER_NOT_ELIGIBLE,
    high_priority_requirement_count: 0,
    high_priority_requirements: [],
    unresolved_high_priority_count: 0,
    remaining_blocker_count: 0,
    critical_blocker_count: 0,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    resolution_certification_consumed: 'FAIL',
    evaluation_score_valid: 'FAIL',
    evaluation_tier_valid: 'FAIL',
    high_priority_requirement_count_valid: 'FAIL',
    production_ready_decision_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    evaluation_score_invalid: true,
    evaluation_tier_invalid: true,
    high_priority_requirement_unresolved: true,
    production_ready_decision_invalid: true,
    resolution_certification_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_ready_evaluation_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    evaluation_checks: [],
    final_verdict: MV_PRODUCTION_READY_EVALUATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_EVALUATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_EVALUATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_EVALUATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadyEvaluation(
  projectRoot?: string
): MvProductionReadyEvaluationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyEvaluationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const certReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: EvaluationStatus;
    mv_production_blocker_resolution_certification_ready: EvaluationStatus;
    traceability_preserved: boolean;
    remaining_blocker_count: number;
    resolution_priority: { HIGH: number };
  }>(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH);

  const certArtifact = loadJson<MvProductionBlockerResolutionCertificationArtifact>(
    root,
    MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH
  );
  const certManifestPath = path.join(root, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH);

  if (
    !certReport ||
    !certArtifact ||
    !fs.existsSync(certManifestPath) ||
    certReport.final_verdict !== MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT ||
    certReport.certification_status !== MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS ||
    certReport.next_stage_ready !== 'PASS' ||
    certReport.mv_production_blocker_resolution_certification_ready !== 'PASS'
  ) {
    issues.push({
      code: 'RESOLUTION_CERTIFICATION_MISSING',
      message: `Required ${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT} with ${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const gateArtifact = loadJson<{ production_readiness_score: number }>(
    root,
    MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH
  );

  if (!gateArtifact) {
    issues.push({
      code: 'READINESS_GATE_ARTIFACT_MISSING',
      message: 'Missing production readiness gate artifact for evaluation score baseline',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const auditArtifact = loadJson<{ critical_blocker_count: number }>(
    root,
    MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH
  );

  if (!auditArtifact) {
    issues.push({
      code: 'BLOCKER_AUDIT_ARTIFACT_MISSING',
      message: 'Missing blocker audit artifact for critical blocker cross-check',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const resolutionCertificationConsumed =
    certArtifact.resolution_certification_complete === true &&
    certArtifact.next_stage_ready === true &&
    certArtifact.next_stage_gate_label === 'DS_019_ENTRY' &&
    certArtifact.target_readiness_tier === PRODUCTION_READINESS_TIER_PRODUCTION_READY &&
    certArtifact.current_readiness_tier === PRODUCTION_READINESS_TIER_TEST_READY;

  const certifiedItems = certArtifact.blocker_resolution_items;
  const highPriorityRequirements = buildHighPriorityRequirements(certifiedItems);
  const highPriorityRequirementCount = certArtifact.resolution_priority.HIGH;
  const unresolvedHighCount = countUnresolvedByPriority(certifiedItems, RESOLUTION_PRIORITY_HIGH);
  const unresolvedMediumCount = countUnresolvedByPriority(certifiedItems, 'MEDIUM');
  const unresolvedLowCount = countUnresolvedByPriority(certifiedItems, 'LOW');
  const remainingBlockerCount = certArtifact.remaining_blocker_count;
  const criticalBlockerCount = auditArtifact.critical_blocker_count;

  const traceabilityChains = certArtifact.traceability_chain;
  const traceabilityPreserved =
    certReport.traceability_preserved === true &&
    certArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const evaluationScore = computeEvaluationScore(
    gateArtifact.production_readiness_score,
    unresolvedHighCount,
    unresolvedMediumCount,
    unresolvedLowCount
  );

  const productionReadyDecision = resolveProductionReadyDecision({
    criticalBlockerCount,
    resolutionCertificationConsumed,
    traceabilityPreserved,
    evaluationInProgress: false,
    unresolvedHighCount,
    remainingBlockerCount,
  });

  const evaluationTier = resolveEvaluationTier(evaluationScore, productionReadyDecision);

  const expectedScore = computeEvaluationScore(
    gateArtifact.production_readiness_score,
    unresolvedHighCount,
    unresolvedMediumCount,
    unresolvedLowCount
  );

  const evaluationScoreValid =
    evaluationScore === expectedScore &&
    evaluationScore >= 0 &&
    evaluationScore <= MAX_PRODUCTION_READINESS_SCORE;

  const evaluationTierValid =
    isEvaluationTier(evaluationTier) &&
    evaluationTier === resolveEvaluationTier(evaluationScore, productionReadyDecision);

  const highPriorityRequirementCountValid =
    highPriorityRequirementCount === certReport.resolution_priority.HIGH &&
    highPriorityRequirementCount === highPriorityRequirements.length &&
    highPriorityRequirements.every((req) => req.resolution_priority === RESOLUTION_PRIORITY_HIGH);

  const productionReadyDecisionValid =
    isProductionReadyDecision(productionReadyDecision) &&
    ((productionReadyDecision === PRODUCTION_READY_DECISION_APPROVED &&
      unresolvedHighCount === 0 &&
      remainingBlockerCount === 0 &&
      criticalBlockerCount === 0) ||
      (productionReadyDecision === PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED &&
        unresolvedHighCount > 0 &&
        criticalBlockerCount === 0 &&
        resolutionCertificationConsumed &&
        traceabilityPreserved) ||
      (productionReadyDecision === PRODUCTION_READY_DECISION_REJECTED &&
        (criticalBlockerCount > 0 || !resolutionCertificationConsumed || !traceabilityPreserved)));

  const evaluationWriteScopeValid = EVALUATION_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderEvaluationWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && evaluationWriteScopeValid;

  const evaluationScoreInvalid = !evaluationScoreValid;
  const evaluationTierInvalid = !evaluationTierValid;
  const highPriorityRequirementUnresolved =
    productionReadyDecision === PRODUCTION_READY_DECISION_APPROVED && unresolvedHighCount > 0;
  const productionReadyDecisionInvalid = !productionReadyDecisionValid;
  const resolutionCertificationMissing = !resolutionCertificationConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const evaluationComplete =
    resolutionCertificationConsumed &&
    evaluationScoreValid &&
    evaluationTierValid &&
    highPriorityRequirementCountValid &&
    productionReadyDecisionValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !highPriorityRequirementUnresolved;

  const nextStageReady =
    evaluationComplete &&
    (productionReadyDecision === PRODUCTION_READY_DECISION_APPROVED ||
      productionReadyDecision === PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED);

  if (resolutionCertificationMissing) {
    issues.push({
      code: 'RESOLUTION_CERTIFICATION_MISSING',
      message: 'Resolution certification was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across production ready evaluation',
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
  if (evaluationScoreInvalid) {
    issues.push({
      code: 'EVALUATION_SCORE_INVALID',
      message: 'Evaluation score is invalid',
      severity: 'error',
      check_id: 'evaluation_score_valid',
    });
  }
  if (evaluationTierInvalid) {
    issues.push({
      code: 'EVALUATION_TIER_INVALID',
      message: 'Evaluation tier is invalid',
      severity: 'error',
      check_id: 'evaluation_tier_valid',
    });
  }
  if (!highPriorityRequirementCountValid) {
    issues.push({
      code: 'HIGH_PRIORITY_REQUIREMENT_COUNT_INVALID',
      message: 'High priority requirement count is invalid',
      severity: 'error',
      check_id: 'high_priority_requirement_count_valid',
    });
  }
  if (productionReadyDecisionInvalid) {
    issues.push({
      code: 'PRODUCTION_READY_DECISION_INVALID',
      message: 'Production ready decision is invalid for current blocker state',
      severity: 'error',
      check_id: 'production_ready_decision_valid',
    });
  }
  if (highPriorityRequirementUnresolved) {
    issues.push({
      code: 'HIGH_PRIORITY_REQUIREMENT_UNRESOLVED',
      message: 'Approved decision conflicts with unresolved high priority requirements',
      severity: 'error',
    });
  }

  const evaluationChecks: EvaluationCheck[] = [
    {
      check_id: 'evaluation_score_valid',
      check_label: 'Evaluation Score Valid',
      status: toStatus(evaluationScoreValid),
    },
    {
      check_id: 'evaluation_tier_valid',
      check_label: 'Evaluation Tier Valid',
      status: toStatus(evaluationTierValid),
    },
    {
      check_id: 'high_priority_requirement_count_valid',
      check_label: 'High Priority Requirement Count Valid',
      status: toStatus(highPriorityRequirementCountValid),
    },
    {
      check_id: 'production_ready_decision_valid',
      check_label: 'Production Ready Decision Valid',
      status: toStatus(productionReadyDecisionValid),
    },
  ];

  const pass = nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadyEvaluationArtifact = {
    evaluation_id: 'mv-production-ready-evaluation-v1',
    phase: MV_PRODUCTION_READY_EVALUATION_PHASE,
    generated_at: timestamp,
    source_resolution_certification_ref: MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
    certification_id: certArtifact.certification_id,
    production_ready_decision: productionReadyDecision,
    evaluation_score: evaluationScore,
    evaluation_tier: evaluationTier,
    high_priority_requirement_count: highPriorityRequirementCount,
    high_priority_requirements: highPriorityRequirements,
    unresolved_high_priority_count: unresolvedHighCount,
    unresolved_medium_priority_count: unresolvedMediumCount,
    unresolved_low_priority_count: unresolvedLowCount,
    remaining_blocker_count: remainingBlockerCount,
    critical_blocker_count: criticalBlockerCount,
    current_readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    target_readiness_tier: PRODUCTION_READINESS_TIER_PRODUCTION_READY,
    production_ready_requirements: certArtifact.production_ready_requirements,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      evaluation_artifact_write_scope: EVALUATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    evaluation_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadyEvaluationManifest = {
    manifest_id: 'mv-production-ready-evaluation-manifest-v1',
    phase: MV_PRODUCTION_READY_EVALUATION_PHASE,
    generated_at: timestamp,
    production_ready_decision: productionReadyDecision,
    evaluation_score: evaluationScore,
    evaluation_tier: evaluationTier,
    high_priority_requirement_count: highPriorityRequirementCount,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_READY_EVALUATED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_EVALUATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadyEvaluationReport = {
    report_id: 'mv-production-ready-evaluation-report-v1',
    phase: MV_PRODUCTION_READY_EVALUATION_PHASE,
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
    source_resolution_certification_ref: MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
    mv_production_blocker_resolution_certification_report_path:
      MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH,
    mv_production_ready_evaluation_export_dir: MV_PRODUCTION_READY_EVALUATION_EXPORT_DIR,
    mv_production_ready_evaluation_manifest_path: MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH,
    mv_production_ready_evaluation_artifact_path: MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
    evaluation_id: 'mv-production-ready-evaluation-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    production_ready_decision: productionReadyDecision,
    evaluation_score: evaluationScore,
    evaluation_tier: evaluationTier,
    high_priority_requirement_count: highPriorityRequirementCount,
    high_priority_requirements: highPriorityRequirements,
    unresolved_high_priority_count: unresolvedHighCount,
    remaining_blocker_count: remainingBlockerCount,
    critical_blocker_count: criticalBlockerCount,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    resolution_certification_consumed: toStatus(resolutionCertificationConsumed),
    evaluation_score_valid: toStatus(evaluationScoreValid),
    evaluation_tier_valid: toStatus(evaluationTierValid),
    high_priority_requirement_count_valid: toStatus(highPriorityRequirementCountValid),
    production_ready_decision_valid: toStatus(productionReadyDecisionValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    evaluation_score_invalid: evaluationScoreInvalid,
    evaluation_tier_invalid: evaluationTierInvalid,
    high_priority_requirement_unresolved: highPriorityRequirementUnresolved,
    production_ready_decision_invalid: productionReadyDecisionInvalid,
    resolution_certification_missing: resolutionCertificationMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_ready_evaluation_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_READY_EVALUATED_STATUS : null,
    next_stage_approved: pass,
    evaluation_checks: evaluationChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT
      : MV_PRODUCTION_READY_EVALUATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_EVALUATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_EVALUATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_EVALUATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
