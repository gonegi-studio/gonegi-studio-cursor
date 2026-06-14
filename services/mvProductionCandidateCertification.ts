import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  EVALUATION_TIER_PRODUCTION_CANDIDATE,
  MV_PRODUCTION_READY_EVALUATED_STATUS,
  MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
  MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH,
  MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT,
  MV_PRODUCTION_READY_EVALUATION_REPORT_PATH,
  PRODUCTION_READY_DECISION_APPROVED,
  PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED,
  type HighPriorityRequirement,
  type MvProductionReadyEvaluationArtifact,
  type ProductionReadyDecision,
} from './mvProductionReadyEvaluation.js';
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

export const MV_PRODUCTION_CANDIDATE_CERTIFICATION_PHASE =
  'PHASE-DIGITAL-STUDIO-020-MV_PRODUCTION_CANDIDATE_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT =
  'PASS_MV_PRODUCTION_CANDIDATE_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_CANDIDATE_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_CANDIDATE_CERTIFICATION_V1' as const;
export const PRODUCTION_CANDIDATE_CERTIFIED_STATUS = 'PRODUCTION_CANDIDATE_CERTIFIED' as const;
export const PRODUCTION_READY_CANDIDATE_STATUS = 'PRODUCTION_READY_CANDIDATE' as const;
export const PRODUCTION_CANDIDATE_VERSION = 'V1' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_021_ENTRY' as const;
export const MV_PRODUCTION_CANDIDATE_CERTIFICATION_DIR =
  'reports/mv_production_candidate_certification' as const;
export const MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH =
  'reports/mv_production_candidate_certification/mv-production-candidate-certification-report.json' as const;
export const MV_PRODUCTION_CANDIDATE_CERTIFICATION_MD_PATH =
  'reports/mv_production_candidate_certification/MV_PRODUCTION_CANDIDATE_CERTIFICATION.md' as const;
export const MV_PRODUCTION_CANDIDATE_CERTIFICATION_EXPORT_DIR =
  'exports/mv_production_candidate_certification' as const;
export const MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH =
  'exports/mv_production_candidate_certification/mv-production-candidate-certification-manifest.json' as const;
export const MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH =
  'exports/mv_production_candidate_certification/mv-production-candidate-certification.json' as const;

export const CANDIDATE_CERTIFICATION_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_candidate_certification/' as const;

export const CONDITIONAL_APPROVAL_STATUS_VALID = 'VALID' as const;
export const CONDITIONAL_APPROVAL_STATUS_INVALID = 'INVALID' as const;

export const CONDITIONAL_APPROVAL_STATUSES = [
  CONDITIONAL_APPROVAL_STATUS_VALID,
  CONDITIONAL_APPROVAL_STATUS_INVALID,
] as const;

export type ConditionalApprovalStatus = (typeof CONDITIONAL_APPROVAL_STATUSES)[number];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type MvProductionCandidateCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  check_id?: string;
};

export type CertificationCheck = {
  check_id: string;
  check_label: string;
  status: CertificationStatus;
};

export type MvProductionCandidateCertificationArtifact = {
  certification_id: string;
  phase: typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_PHASE;
  generated_at: string;
  source_evaluation_ref: typeof MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH;
  evaluation_id: string;
  production_candidate_certified: boolean;
  conditional_approval_status: ConditionalApprovalStatus;
  production_ready_status: ProductionReadyDecision;
  production_candidate_version: typeof PRODUCTION_CANDIDATE_VERSION;
  production_candidate_timestamp: string;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  high_priority_requirement_count: number;
  evaluation_score: number;
  evaluation_tier: typeof EVALUATION_TIER_PRODUCTION_CANDIDATE;
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
    candidate_certification_artifact_write_scope: typeof CANDIDATE_CERTIFICATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  candidate_certification_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionCandidateCertificationManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_PHASE;
  generated_at: string;
  production_candidate_certified: boolean;
  conditional_approval_status: ConditionalApprovalStatus;
  production_ready_status: ProductionReadyDecision;
  production_candidate_version: typeof PRODUCTION_CANDIDATE_VERSION;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  certification_status: typeof PRODUCTION_CANDIDATE_CERTIFIED_STATUS | typeof PRODUCTION_READY_CANDIDATE_STATUS | null;
};

export type MvProductionCandidateCertificationReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_PHASE;
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
  source_evaluation_ref: typeof MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH;
  mv_production_ready_evaluation_report_path: typeof MV_PRODUCTION_READY_EVALUATION_REPORT_PATH;
  mv_production_candidate_certification_export_dir: typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_EXPORT_DIR;
  mv_production_candidate_certification_manifest_path: typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH;
  mv_production_candidate_certification_artifact_path: typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH;
  certification_id: string;
  source_count: number;
  adapter_count: number;
  production_candidate_certified: boolean;
  conditional_approval_status: ConditionalApprovalStatus;
  production_ready_status: ProductionReadyDecision;
  production_candidate_version: typeof PRODUCTION_CANDIDATE_VERSION;
  production_candidate_timestamp: string;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  high_priority_requirement_count: number;
  evaluation_score: number;
  evaluation_tier: typeof EVALUATION_TIER_PRODUCTION_CANDIDATE;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  evaluation_consumed: CertificationStatus;
  production_candidate_certified_valid: CertificationStatus;
  conditional_approval_valid: CertificationStatus;
  production_candidate_version_valid: CertificationStatus;
  resolved_high_priority_count_valid: CertificationStatus;
  remaining_high_priority_count_valid: CertificationStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  production_candidate_not_certified: boolean;
  conditional_approval_invalid: boolean;
  production_candidate_version_invalid: boolean;
  high_priority_requirement_unresolved: boolean;
  evaluation_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_candidate_certification_ready: CertificationStatus;
  certification_status: typeof PRODUCTION_CANDIDATE_CERTIFIED_STATUS | typeof PRODUCTION_READY_CANDIDATE_STATUS | null;
  next_stage_approved: boolean;
  certification_checks: CertificationCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT
    | typeof MV_PRODUCTION_CANDIDATE_CERTIFICATION_FAIL_VERDICT;
  issues: MvProductionCandidateCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
  MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH,
] as const;

const CANDIDATE_CERTIFICATION_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_DIR,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_MD_PATH,
  ...CANDIDATE_CERTIFICATION_EXPORT_WRITE_PATHS,
] as const;

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
  return Object.entries(snapshots).every(([relativePath, snapshot]) => {
    const current = snapshotFile(root, relativePath);
    if (!snapshot || !current) return snapshot === current;
    return snapshot.size === current.size && snapshot.mtimeMs === current.mtimeMs;
  });
}

function isUnderCandidateCertificationWriteScope(relativePath: string): boolean {
  return relativePath.startsWith(CANDIDATE_CERTIFICATION_ARTIFACT_WRITE_SCOPE);
}

function countResolvedHighPriority(requirements: HighPriorityRequirement[]): number {
  return requirements.filter((requirement) => requirement.resolved === true).length;
}

function countRemainingHighPriority(requirements: HighPriorityRequirement[]): number {
  return requirements.filter((requirement) => requirement.resolved === false).length;
}

function resolveConditionalApprovalStatus(
  productionReadyStatus: ProductionReadyDecision,
  remainingHighPriorityCount: number
): ConditionalApprovalStatus {
  if (
    productionReadyStatus === PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED &&
    remainingHighPriorityCount > 0
  ) {
    return CONDITIONAL_APPROVAL_STATUS_VALID;
  }
  if (
    productionReadyStatus === PRODUCTION_READY_DECISION_APPROVED &&
    remainingHighPriorityCount === 0
  ) {
    return CONDITIONAL_APPROVAL_STATUS_VALID;
  }
  return CONDITIONAL_APPROVAL_STATUS_INVALID;
}

function resolveCertificationStatus(
  productionCandidateCertified: boolean,
  remainingHighPriorityCount: number
): typeof PRODUCTION_CANDIDATE_CERTIFIED_STATUS | typeof PRODUCTION_READY_CANDIDATE_STATUS | null {
  if (!productionCandidateCertified) {
    return null;
  }
  if (remainingHighPriorityCount > 0) {
    return PRODUCTION_CANDIDATE_CERTIFIED_STATUS;
  }
  return PRODUCTION_READY_CANDIDATE_STATUS;
}

function buildMarkdown(report: MvProductionCandidateCertificationReport): string {
  const lines = [
    '# MV Production Candidate Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Status:** ${report.certification_status ?? 'NONE'}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Certification Summary',
    '',
    `**Production Candidate Certified:** ${report.production_candidate_certified}`,
    `**Conditional Approval Status:** ${report.conditional_approval_status}`,
    `**Production Ready Status:** ${report.production_ready_status}`,
    `**Production Candidate Version:** ${report.production_candidate_version}`,
    `**Production Candidate Timestamp:** ${report.production_candidate_timestamp}`,
    `**Resolved High Priority Count:** ${report.resolved_high_priority_count}`,
    `**Remaining High Priority Count:** ${report.remaining_high_priority_count}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
    '',
    '## Certification Checks',
    '',
  ];

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
  issues: MvProductionCandidateCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionCandidateCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionCandidateCertificationReport = {
    report_id: 'mv-production-candidate-certification-report-v1',
    phase: MV_PRODUCTION_CANDIDATE_CERTIFICATION_PHASE,
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
    source_evaluation_ref: MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
    mv_production_ready_evaluation_report_path: MV_PRODUCTION_READY_EVALUATION_REPORT_PATH,
    mv_production_candidate_certification_export_dir: MV_PRODUCTION_CANDIDATE_CERTIFICATION_EXPORT_DIR,
    mv_production_candidate_certification_manifest_path: MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH,
    mv_production_candidate_certification_artifact_path: MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
    certification_id: 'mv-production-candidate-certification-v1',
    source_count: 0,
    adapter_count: 0,
    production_candidate_certified: false,
    conditional_approval_status: CONDITIONAL_APPROVAL_STATUS_INVALID,
    production_ready_status: PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED,
    production_candidate_version: PRODUCTION_CANDIDATE_VERSION,
    production_candidate_timestamp: timestamp,
    resolved_high_priority_count: 0,
    remaining_high_priority_count: 0,
    high_priority_requirement_count: 0,
    evaluation_score: 0,
    evaluation_tier: EVALUATION_TIER_PRODUCTION_CANDIDATE,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    evaluation_consumed: 'FAIL',
    production_candidate_certified_valid: 'FAIL',
    conditional_approval_valid: 'FAIL',
    production_candidate_version_valid: 'FAIL',
    resolved_high_priority_count_valid: 'FAIL',
    remaining_high_priority_count_valid: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    production_candidate_not_certified: true,
    conditional_approval_invalid: true,
    production_candidate_version_invalid: true,
    high_priority_requirement_unresolved: true,
    evaluation_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_candidate_certification_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    certification_checks: [],
    final_verdict: MV_PRODUCTION_CANDIDATE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionCandidateCertification(
  projectRoot?: string
): MvProductionCandidateCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionCandidateCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const evalReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    next_stage_ready: CertificationStatus;
    mv_production_ready_evaluation_ready: CertificationStatus;
    traceability_preserved: boolean;
    production_ready_decision: ProductionReadyDecision;
    evaluation_tier: string;
    evaluation_score: number;
    high_priority_requirement_count: number;
    unresolved_high_priority_count: number;
  }>(root, MV_PRODUCTION_READY_EVALUATION_REPORT_PATH);

  const evalArtifact = loadJson<MvProductionReadyEvaluationArtifact>(
    root,
    MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH
  );
  const evalManifestPath = path.join(root, MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH);

  if (
    !evalReport ||
    !evalArtifact ||
    !fs.existsSync(evalManifestPath) ||
    evalReport.final_verdict !== MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT ||
    evalReport.certification_status !== MV_PRODUCTION_READY_EVALUATED_STATUS ||
    evalReport.next_stage_ready !== 'PASS' ||
    evalReport.mv_production_ready_evaluation_ready !== 'PASS'
  ) {
    issues.push({
      code: 'EVALUATION_MISSING',
      message: `Required ${MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT} with ${MV_PRODUCTION_READY_EVALUATED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const evaluationConsumed =
    evalArtifact.evaluation_complete === true &&
    evalArtifact.next_stage_ready === true &&
    evalArtifact.next_stage_gate_label === 'DS_020_ENTRY' &&
    evalArtifact.evaluation_tier === EVALUATION_TIER_PRODUCTION_CANDIDATE &&
    evalArtifact.target_readiness_tier === PRODUCTION_READINESS_TIER_PRODUCTION_READY &&
    evalArtifact.current_readiness_tier === PRODUCTION_READINESS_TIER_TEST_READY;

  const highPriorityRequirements = evalArtifact.high_priority_requirements;
  const resolvedHighPriorityCount = countResolvedHighPriority(highPriorityRequirements);
  const remainingHighPriorityCount = countRemainingHighPriority(highPriorityRequirements);
  const highPriorityRequirementCount = evalArtifact.high_priority_requirement_count;
  const productionReadyStatus = evalArtifact.production_ready_decision;
  const productionCandidateTimestamp = timestamp;

  const traceabilityChains = evalArtifact.traceability_chain;
  const traceabilityPreserved =
    evalReport.traceability_preserved === true &&
    evalArtifact.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const conditionalApprovalStatus = resolveConditionalApprovalStatus(
    productionReadyStatus,
    remainingHighPriorityCount
  );

  const productionCandidateCertified =
    evaluationConsumed &&
    traceabilityPreserved &&
    evalArtifact.evaluation_score >= 90 &&
    (remainingHighPriorityCount > 0 || remainingHighPriorityCount === 0);

  const productionCandidateCertifiedValid =
    productionCandidateCertified === true &&
    ((remainingHighPriorityCount > 0 &&
      resolveCertificationStatus(true, remainingHighPriorityCount) ===
        PRODUCTION_CANDIDATE_CERTIFIED_STATUS) ||
      (remainingHighPriorityCount === 0 &&
        resolveCertificationStatus(true, remainingHighPriorityCount) ===
          PRODUCTION_READY_CANDIDATE_STATUS));

  const conditionalApprovalValid =
    conditionalApprovalStatus === CONDITIONAL_APPROVAL_STATUS_VALID &&
    ((productionReadyStatus === PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED &&
      remainingHighPriorityCount > 0) ||
      (productionReadyStatus === PRODUCTION_READY_DECISION_APPROVED &&
        remainingHighPriorityCount === 0));

  const productionCandidateVersionValid =
    PRODUCTION_CANDIDATE_VERSION === 'V1' && PRODUCTION_CANDIDATE_VERSION.length > 0;

  const resolvedHighPriorityCountValid =
    resolvedHighPriorityCount ===
      highPriorityRequirements.filter((requirement) => requirement.resolved === true).length &&
    resolvedHighPriorityCount + remainingHighPriorityCount === highPriorityRequirementCount &&
    resolvedHighPriorityCount ===
      highPriorityRequirementCount - evalReport.unresolved_high_priority_count;

  const remainingHighPriorityCountValid =
    remainingHighPriorityCount === evalReport.unresolved_high_priority_count &&
    remainingHighPriorityCount === evalArtifact.unresolved_high_priority_count &&
    remainingHighPriorityCount + resolvedHighPriorityCount === highPriorityRequirementCount;

  const candidateCertificationWriteScopeValid = CANDIDATE_CERTIFICATION_EXPORT_WRITE_PATHS.every(
    (writePath) => isUnderCandidateCertificationWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && candidateCertificationWriteScopeValid;

  const productionCandidateNotCertified = !productionCandidateCertifiedValid;
  const conditionalApprovalInvalid = !conditionalApprovalValid;
  const productionCandidateVersionInvalid = !productionCandidateVersionValid;
  const highPriorityRequirementUnresolved =
    productionCandidateCertified &&
    remainingHighPriorityCount > 0 &&
    conditionalApprovalStatus !== CONDITIONAL_APPROVAL_STATUS_VALID;
  const evaluationMissing = !evaluationConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  const candidateCertificationComplete =
    evaluationConsumed &&
    productionCandidateCertifiedValid &&
    conditionalApprovalValid &&
    productionCandidateVersionValid &&
    resolvedHighPriorityCountValid &&
    remainingHighPriorityCountValid &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !highPriorityRequirementUnresolved;

  const nextStageReady = candidateCertificationComplete;
  const certificationStatus = resolveCertificationStatus(
    productionCandidateCertifiedValid,
    remainingHighPriorityCount
  );

  if (evaluationMissing) {
    issues.push({
      code: 'EVALUATION_MISSING',
      message: 'Production ready evaluation was not consumed',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across production candidate certification',
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
  if (productionCandidateNotCertified) {
    issues.push({
      code: 'PRODUCTION_CANDIDATE_NOT_CERTIFIED',
      message: 'Production candidate was not certified',
      severity: 'error',
      check_id: 'production_candidate_certified',
    });
  }
  if (conditionalApprovalInvalid) {
    issues.push({
      code: 'CONDITIONAL_APPROVAL_INVALID',
      message: 'Conditional approval status is invalid for current production ready state',
      severity: 'error',
      check_id: 'conditional_approval_valid',
    });
  }
  if (productionCandidateVersionInvalid) {
    issues.push({
      code: 'PRODUCTION_CANDIDATE_VERSION_INVALID',
      message: 'Production candidate version is invalid',
      severity: 'error',
      check_id: 'production_candidate_version_valid',
    });
  }
  if (!resolvedHighPriorityCountValid) {
    issues.push({
      code: 'RESOLVED_HIGH_PRIORITY_COUNT_INVALID',
      message: 'Resolved high priority count is invalid',
      severity: 'error',
      check_id: 'resolved_high_priority_count_valid',
    });
  }
  if (!remainingHighPriorityCountValid) {
    issues.push({
      code: 'REMAINING_HIGH_PRIORITY_COUNT_INVALID',
      message: 'Remaining high priority count is invalid',
      severity: 'error',
      check_id: 'remaining_high_priority_count_valid',
    });
  }
  if (highPriorityRequirementUnresolved) {
    issues.push({
      code: 'HIGH_PRIORITY_REQUIREMENT_UNRESOLVED',
      message: 'High priority requirements remain unresolved without valid conditional approval',
      severity: 'error',
    });
  }

  const certificationChecks: CertificationCheck[] = [
    {
      check_id: 'production_candidate_certified',
      check_label: 'Production Candidate Certified',
      status: toStatus(productionCandidateCertifiedValid),
    },
    {
      check_id: 'conditional_approval_valid',
      check_label: 'Conditional Approval Valid',
      status: toStatus(conditionalApprovalValid),
    },
    {
      check_id: 'production_candidate_version_valid',
      check_label: 'Production Candidate Version Valid',
      status: toStatus(productionCandidateVersionValid),
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

  const artifact: MvProductionCandidateCertificationArtifact = {
    certification_id: 'mv-production-candidate-certification-v1',
    phase: MV_PRODUCTION_CANDIDATE_CERTIFICATION_PHASE,
    generated_at: timestamp,
    source_evaluation_ref: MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
    evaluation_id: evalArtifact.evaluation_id,
    production_candidate_certified: productionCandidateCertifiedValid,
    conditional_approval_status: conditionalApprovalStatus,
    production_ready_status: productionReadyStatus,
    production_candidate_version: PRODUCTION_CANDIDATE_VERSION,
    production_candidate_timestamp: productionCandidateTimestamp,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    high_priority_requirement_count: highPriorityRequirementCount,
    evaluation_score: evalArtifact.evaluation_score,
    evaluation_tier: EVALUATION_TIER_PRODUCTION_CANDIDATE,
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
      candidate_certification_artifact_write_scope: CANDIDATE_CERTIFICATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    candidate_certification_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionCandidateCertificationManifest = {
    manifest_id: 'mv-production-candidate-certification-manifest-v1',
    phase: MV_PRODUCTION_CANDIDATE_CERTIFICATION_PHASE,
    generated_at: timestamp,
    production_candidate_certified: productionCandidateCertifiedValid,
    conditional_approval_status: conditionalApprovalStatus,
    production_ready_status: productionReadyStatus,
    production_candidate_version: PRODUCTION_CANDIDATE_VERSION,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? certificationStatus : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionCandidateCertificationReport = {
    report_id: 'mv-production-candidate-certification-report-v1',
    phase: MV_PRODUCTION_CANDIDATE_CERTIFICATION_PHASE,
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
    source_evaluation_ref: MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
    mv_production_ready_evaluation_report_path: MV_PRODUCTION_READY_EVALUATION_REPORT_PATH,
    mv_production_candidate_certification_export_dir: MV_PRODUCTION_CANDIDATE_CERTIFICATION_EXPORT_DIR,
    mv_production_candidate_certification_manifest_path: MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH,
    mv_production_candidate_certification_artifact_path: MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
    certification_id: 'mv-production-candidate-certification-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    production_candidate_certified: productionCandidateCertifiedValid,
    conditional_approval_status: conditionalApprovalStatus,
    production_ready_status: productionReadyStatus,
    production_candidate_version: PRODUCTION_CANDIDATE_VERSION,
    production_candidate_timestamp: productionCandidateTimestamp,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    high_priority_requirement_count: highPriorityRequirementCount,
    evaluation_score: evalArtifact.evaluation_score,
    evaluation_tier: EVALUATION_TIER_PRODUCTION_CANDIDATE,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    evaluation_consumed: toStatus(evaluationConsumed),
    production_candidate_certified_valid: toStatus(productionCandidateCertifiedValid),
    conditional_approval_valid: toStatus(conditionalApprovalValid),
    production_candidate_version_valid: toStatus(productionCandidateVersionValid),
    resolved_high_priority_count_valid: toStatus(resolvedHighPriorityCountValid),
    remaining_high_priority_count_valid: toStatus(remainingHighPriorityCountValid),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    production_candidate_not_certified: productionCandidateNotCertified,
    conditional_approval_invalid: conditionalApprovalInvalid,
    production_candidate_version_invalid: productionCandidateVersionInvalid,
    high_priority_requirement_unresolved: highPriorityRequirementUnresolved,
    evaluation_missing: evaluationMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_candidate_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? certificationStatus : null,
    next_stage_approved: pass,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT
      : MV_PRODUCTION_CANDIDATE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_CANDIDATE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
