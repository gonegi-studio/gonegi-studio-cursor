import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MAX_PRODUCTION_READINESS_SCORE,
  MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READINESS_GATE_PASS_VERDICT,
  MV_PRODUCTION_READINESS_GATE_READY_STATUS,
  MV_PRODUCTION_READINESS_GATE_REPORT_PATH,
  PRODUCTION_READINESS_TIER_TEST_READY,
  type MvProductionReadinessGateArtifact,
  type ProductionReadinessTier,
  type RemainingBlocker,
} from './mvProductionReadinessGate.js';
import type { MvRuntimeTraceability } from './mvProductionRuntimeEngine.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_PRODUCTION_READINESS_CERTIFICATION_PHASE =
  'PHASE-DIGITAL-STUDIO-015-MV_PRODUCTION_READINESS_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READINESS_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_READINESS_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READINESS_CERTIFICATION_V1' as const;
export const MV_PRODUCTION_READINESS_CERTIFIED_STATUS = 'MV_PRODUCTION_READINESS_CERTIFIED' as const;
export const MV_TEST_READY_CERTIFIED_STATUS = 'MV_TEST_READY_CERTIFIED' as const;
export const CERTIFICATION_VERSION = 'V1' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS_016_ENTRY' as const;
export const MV_PRODUCTION_READINESS_CERTIFICATION_DIR =
  'reports/mv_production_readiness_certification' as const;
export const MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH =
  'reports/mv_production_readiness_certification/mv-production-readiness-certification-report.json' as const;
export const MV_PRODUCTION_READINESS_CERTIFICATION_MD_PATH =
  'reports/mv_production_readiness_certification/MV_PRODUCTION_READINESS_CERTIFICATION.md' as const;
export const MV_PRODUCTION_READINESS_CERTIFICATION_EXPORT_DIR =
  'exports/mv_production_readiness_certification' as const;
export const MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH =
  'exports/mv_production_readiness_certification/mv-production-readiness-certification-manifest.json' as const;
export const MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH =
  'exports/mv_production_readiness_certification/mv-production-readiness-certification.json' as const;

export const READINESS_CERTIFICATION_ARTIFACT_WRITE_SCOPE =
  'exports/mv_production_readiness_certification/' as const;

export const PRODUCTION_BLOCKER_CODES = [
  'PRODUCTION_MODE_BLOCKED',
  'REAL_GENERATION_BLOCKED',
  'RUNTIME_NOT_EXECUTED',
  'EXTERNAL_CALL_BLOCKED',
  'GPU_EXECUTION_BLOCKED',
] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type MvProductionReadinessCertificationIssue = {
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

export type ProductionBlockerRemaining = {
  blocker_id: string;
  blocker_code: string;
  message: string;
  severity: 'critical' | 'warning';
  resolved: boolean;
};

export type MvProductionReadinessCertificationArtifact = {
  certification_id: string;
  phase: typeof MV_PRODUCTION_READINESS_CERTIFICATION_PHASE;
  generated_at: string;
  certification_timestamp: string;
  certification_version: typeof CERTIFICATION_VERSION;
  source_readiness_gate_ref: typeof MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH;
  readiness_gate_id: string;
  readiness_certified: boolean;
  readiness_score: number;
  readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY;
  production_blockers_remaining: ProductionBlockerRemaining[];
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  test_mode_allowed: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    readiness_certification_artifact_write_scope: typeof READINESS_CERTIFICATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  readiness_certification_complete: boolean;
  next_stage_ready: boolean;
};

export type MvProductionReadinessCertificationManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READINESS_CERTIFICATION_PHASE;
  generated_at: string;
  certification_timestamp: string;
  certification_version: typeof CERTIFICATION_VERSION;
  readiness_certified: boolean;
  readiness_score: number;
  readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY | null;
  production_blocker_count: number;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  certification_status: typeof MV_PRODUCTION_READINESS_CERTIFIED_STATUS | null;
};

export type MvProductionReadinessCertificationReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READINESS_CERTIFICATION_PHASE;
  timestamp: string;
  certification_timestamp: string;
  certification_version: typeof CERTIFICATION_VERSION;
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
  source_readiness_gate_ref: typeof MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH;
  mv_production_readiness_gate_report_path: typeof MV_PRODUCTION_READINESS_GATE_REPORT_PATH;
  mv_production_readiness_certification_export_dir: typeof MV_PRODUCTION_READINESS_CERTIFICATION_EXPORT_DIR;
  mv_production_readiness_certification_manifest_path: typeof MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH;
  mv_production_readiness_certification_artifact_path: typeof MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  readiness_certified: boolean;
  readiness_score: number;
  readiness_tier: typeof PRODUCTION_READINESS_TIER_TEST_READY | null;
  production_blockers_remaining: ProductionBlockerRemaining[];
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL | null;
  traceability_chain: MvRuntimeTraceability[];
  readiness_gate_consumed: CertificationStatus;
  readiness_certified_status: CertificationStatus;
  readiness_score_valid: CertificationStatus;
  readiness_tier_valid: CertificationStatus;
  production_blockers_resolved: CertificationStatus;
  certification_version_valid: CertificationStatus;
  next_stage_gate_label_valid: CertificationStatus;
  test_ready_status_verified: CertificationStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: CertificationStatus;
  next_stage_ready: CertificationStatus;
  readiness_not_certified: boolean;
  readiness_score_invalid: boolean;
  readiness_tier_invalid: boolean;
  production_blocker_detected: boolean;
  certification_version_invalid: boolean;
  next_stage_gate_missing: boolean;
  test_ready_status_not_verified: boolean;
  readiness_gate_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_readiness_certification_ready: CertificationStatus;
  certification_status: typeof MV_PRODUCTION_READINESS_CERTIFIED_STATUS | null;
  test_ready_status: typeof MV_TEST_READY_CERTIFIED_STATUS | null;
  certification_checks: CertificationCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT
    | typeof MV_PRODUCTION_READINESS_CERTIFICATION_FAIL_VERDICT;
  issues: MvProductionReadinessCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH,
] as const;

const CERTIFICATION_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READINESS_CERTIFICATION_DIR,
  MV_PRODUCTION_READINESS_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_READINESS_CERTIFICATION_MD_PATH,
  ...CERTIFICATION_EXPORT_WRITE_PATHS,
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
  for (const [relativePath, snapshot] of Object.entries(snapshots)) {
    if (!snapshot) return false;
    const current = snapshotFile(root, relativePath);
    if (!current || current.size !== snapshot.size || current.mtimeMs !== snapshot.mtimeMs) {
      return false;
    }
  }
  return true;
}

function isUnderCertificationWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(READINESS_CERTIFICATION_ARTIFACT_WRITE_SCOPE) ||
    relativePath === READINESS_CERTIFICATION_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function isReadinessScoreValid(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= MAX_PRODUCTION_READINESS_SCORE;
}

function isReadinessTierValid(tier: ProductionReadinessTier | null): tier is typeof PRODUCTION_READINESS_TIER_TEST_READY {
  return tier === PRODUCTION_READINESS_TIER_TEST_READY;
}

function extractProductionBlockersRemaining(
  remainingBlockers: RemainingBlocker[]
): ProductionBlockerRemaining[] {
  return remainingBlockers
    .filter((blocker) =>
      PRODUCTION_BLOCKER_CODES.includes(
        blocker.blocker_code as (typeof PRODUCTION_BLOCKER_CODES)[number]
      )
    )
    .map((blocker) => ({
      blocker_id: blocker.blocker_id,
      blocker_code: blocker.blocker_code,
      message: blocker.message,
      severity: blocker.severity,
      resolved: blocker.resolved,
    }));
}

function buildMarkdown(report: MvProductionReadinessCertificationReport): string {
  const lines = [
    '# MV Production Readiness Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Certification Timestamp:** ${report.certification_timestamp}`,
    `**Certification Version:** ${report.certification_version}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }
  if (report.test_ready_status) {
    lines.push(`**Test Ready Status:** ${report.test_ready_status}`, '');
  }

  lines.push(
    `**Readiness Certified:** ${report.readiness_certified}`,
    `**Readiness Score:** ${report.readiness_score}`,
    `**Readiness Tier:** ${report.readiness_tier ?? 'NONE'}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label ?? 'NONE'}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| readiness_certified | ${report.readiness_certified_status} |`,
    `| readiness_score_valid | ${report.readiness_score_valid} |`,
    `| readiness_tier_valid | ${report.readiness_tier_valid} |`,
    `| production_blockers_resolved | ${report.production_blockers_resolved} |`,
    `| certification_version_valid | ${report.certification_version_valid} |`,
    `| next_stage_gate_label_valid | ${report.next_stage_gate_label_valid} |`,
    `| test_ready_status_verified | ${report.test_ready_status_verified} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| next_stage_ready | ${report.next_stage_ready} |`,
    '',
    '## Production Blockers Remaining',
    ''
  );

  for (const blocker of report.production_blockers_remaining) {
    lines.push(`- [${blocker.severity}] ${blocker.blocker_code}: ${blocker.message}`);
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
  issues: MvProductionReadinessCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadinessCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionReadinessCertificationReport = {
    report_id: 'mv-production-readiness-certification-report-v1',
    phase: MV_PRODUCTION_READINESS_CERTIFICATION_PHASE,
    timestamp,
    certification_timestamp: timestamp,
    certification_version: CERTIFICATION_VERSION,
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
    source_readiness_gate_ref: MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
    mv_production_readiness_gate_report_path: MV_PRODUCTION_READINESS_GATE_REPORT_PATH,
    mv_production_readiness_certification_export_dir: MV_PRODUCTION_READINESS_CERTIFICATION_EXPORT_DIR,
    mv_production_readiness_certification_manifest_path: MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH,
    mv_production_readiness_certification_artifact_path: MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    readiness_certified: false,
    readiness_score: 0,
    readiness_tier: null,
    production_blockers_remaining: [],
    next_stage_gate_label: null,
    traceability_chain: [],
    readiness_gate_consumed: 'FAIL',
    readiness_certified_status: 'FAIL',
    readiness_score_valid: 'FAIL',
    readiness_tier_valid: 'FAIL',
    production_blockers_resolved: 'FAIL',
    certification_version_valid: 'FAIL',
    next_stage_gate_label_valid: 'FAIL',
    test_ready_status_verified: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    readiness_not_certified: true,
    readiness_score_invalid: true,
    readiness_tier_invalid: true,
    production_blocker_detected: true,
    certification_version_invalid: true,
    next_stage_gate_missing: true,
    test_ready_status_not_verified: true,
    readiness_gate_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_readiness_certification_ready: 'FAIL',
    certification_status: null,
    test_ready_status: null,
    certification_checks: [],
    final_verdict: MV_PRODUCTION_READINESS_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READINESS_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadinessCertification(
  projectRoot?: string
): MvProductionReadinessCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadinessCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const gateReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    production_readiness_tier: ProductionReadinessTier | null;
    production_readiness_score: number;
    next_stage_ready: CertificationStatus;
    next_stage_approved: boolean;
    critical_blocker_count: number;
    traceability_preserved: boolean;
    mv_production_readiness_gate_ready: CertificationStatus;
  }>(root, MV_PRODUCTION_READINESS_GATE_REPORT_PATH);

  const gateArtifact = loadJson<MvProductionReadinessGateArtifact>(
    root,
    MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH
  );
  const gateManifestPath = path.join(root, MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH);

  if (
    !gateReport ||
    !gateArtifact ||
    !fs.existsSync(gateManifestPath) ||
    gateReport.final_verdict !== MV_PRODUCTION_READINESS_GATE_PASS_VERDICT ||
    gateReport.certification_status !== MV_PRODUCTION_READINESS_GATE_READY_STATUS ||
    gateReport.production_readiness_tier !== PRODUCTION_READINESS_TIER_TEST_READY ||
    gateReport.next_stage_ready !== 'PASS' ||
    gateReport.mv_production_readiness_gate_ready !== 'PASS'
  ) {
    issues.push({
      code: 'READINESS_GATE_MISSING',
      message: `Required ${MV_PRODUCTION_READINESS_GATE_PASS_VERDICT} with ${MV_PRODUCTION_READINESS_GATE_READY_STATUS} and ${PRODUCTION_READINESS_TIER_TEST_READY}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const readinessGateConsumed =
    gateArtifact.readiness_gate_complete === true &&
    gateArtifact.next_stage_approved === true &&
    gateArtifact.production_readiness_tier === PRODUCTION_READINESS_TIER_TEST_READY &&
    gateArtifact.production_readiness_status === MV_PRODUCTION_READINESS_GATE_READY_STATUS;

  const readinessScore = gateArtifact.production_readiness_score;
  const readinessTier = gateArtifact.production_readiness_tier;
  const traceabilityChains = gateArtifact.traceability_chain;

  const productionBlockersRemaining = extractProductionBlockersRemaining(
    gateArtifact.remaining_blockers
  );

  const traceabilityPreserved =
    gateReport.traceability_preserved === true &&
    traceabilityChains.length === MV_TYPE_COUNT &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const readinessScoreValid =
    isReadinessScoreValid(readinessScore) &&
    readinessScore === gateReport.production_readiness_score &&
    readinessScore === MAX_PRODUCTION_READINESS_SCORE;

  const readinessTierValid = isReadinessTierValid(readinessTier);

  const productionBlockersResolved =
    gateReport.critical_blocker_count === 0 &&
    gateArtifact.critical_blocker_count === 0 &&
    !productionBlockersRemaining.some(
      (blocker) => blocker.severity === 'critical' && !blocker.resolved
    );

  const productionBlockerDetected =
    gateReport.critical_blocker_count > 0 ||
    gateArtifact.critical_blocker_count > 0 ||
    productionBlockersRemaining.some(
      (blocker) => blocker.severity === 'critical' && !blocker.resolved
    );

  const certificationVersionValid = CERTIFICATION_VERSION === 'V1';
  const nextStageGateLabel = NEXT_STAGE_GATE_LABEL;
  const nextStageGateLabelValid = nextStageGateLabel === 'DS_016_ENTRY' && nextStageGateLabel.length > 0;

  const testReadyStatusVerified =
    readinessTierValid &&
    readinessGateConsumed &&
    readinessScoreValid &&
    productionBlockersResolved &&
    traceabilityPreserved &&
    gateArtifact.production_readiness_tier === PRODUCTION_READINESS_TIER_TEST_READY;

  const certificationWriteScopeValid = CERTIFICATION_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderCertificationWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && certificationWriteScopeValid;

  const readinessCertified =
    readinessGateConsumed &&
    readinessScoreValid &&
    readinessTierValid &&
    productionBlockersResolved &&
    certificationVersionValid &&
    nextStageGateLabelValid &&
    testReadyStatusVerified &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    !productionBlockerDetected;

  const nextStageReady = readinessCertified;

  const readinessNotCertified = !readinessCertified;
  const readinessScoreInvalid = !readinessScoreValid;
  const readinessTierInvalid = !readinessTierValid;
  const certificationVersionInvalid = !certificationVersionValid;
  const nextStageGateMissing = !nextStageGateLabelValid;
  const testReadyStatusNotVerified = !testReadyStatusVerified;
  const readinessGateMissing = !readinessGateConsumed;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  if (readinessGateMissing) {
    issues.push({
      code: 'READINESS_GATE_MISSING',
      message: 'Readiness gate was not consumed',
      severity: 'error',
    });
  }
  if (productionBlockerDetected) {
    issues.push({
      code: 'PRODUCTION_BLOCKER_DETECTED',
      message: 'Unresolved critical production blockers detected',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across readiness certification',
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
      check_id: 'readiness_certified',
      check_label: 'Readiness Certified',
      status: toStatus(readinessCertified),
    },
    {
      check_id: 'readiness_score_valid',
      check_label: 'Readiness Score Valid',
      status: toStatus(readinessScoreValid),
    },
    {
      check_id: 'readiness_tier_valid',
      check_label: 'Readiness Tier Valid',
      status: toStatus(readinessTierValid),
    },
    {
      check_id: 'production_blockers_resolved',
      check_label: 'Production Blockers Resolved',
      status: toStatus(productionBlockersResolved),
    },
    {
      check_id: 'certification_version_valid',
      check_label: 'Certification Version Valid',
      status: toStatus(certificationVersionValid),
    },
    {
      check_id: 'next_stage_gate_label_valid',
      check_label: 'Next Stage Gate Label Valid',
      status: toStatus(nextStageGateLabelValid),
    },
    {
      check_id: 'test_ready_status_verified',
      check_label: 'Test Ready Status Verified',
      status: toStatus(testReadyStatusVerified),
    },
  ];

  const pass =
    nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadinessCertificationArtifact = {
    certification_id: 'mv-production-readiness-certification-v1',
    phase: MV_PRODUCTION_READINESS_CERTIFICATION_PHASE,
    generated_at: timestamp,
    certification_timestamp: timestamp,
    certification_version: CERTIFICATION_VERSION,
    source_readiness_gate_ref: MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
    readiness_gate_id: gateArtifact.readiness_gate_id,
    readiness_certified: readinessCertified,
    readiness_score: readinessScore,
    readiness_tier: PRODUCTION_READINESS_TIER_TEST_READY,
    production_blockers_remaining: productionBlockersRemaining,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    test_mode_allowed: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      readiness_certification_artifact_write_scope: READINESS_CERTIFICATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    readiness_certification_complete: pass,
    next_stage_ready: pass,
  };

  const manifest: MvProductionReadinessCertificationManifest = {
    manifest_id: 'mv-production-readiness-certification-manifest-v1',
    phase: MV_PRODUCTION_READINESS_CERTIFICATION_PHASE,
    generated_at: timestamp,
    certification_timestamp: timestamp,
    certification_version: CERTIFICATION_VERSION,
    readiness_certified: readinessCertified,
    readiness_score: readinessScore,
    readiness_tier: pass ? PRODUCTION_READINESS_TIER_TEST_READY : null,
    production_blocker_count: productionBlockersRemaining.length,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_READINESS_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READINESS_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadinessCertificationReport = {
    report_id: 'mv-production-readiness-certification-report-v1',
    phase: MV_PRODUCTION_READINESS_CERTIFICATION_PHASE,
    timestamp,
    certification_timestamp: timestamp,
    certification_version: CERTIFICATION_VERSION,
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
    source_readiness_gate_ref: MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
    mv_production_readiness_gate_report_path: MV_PRODUCTION_READINESS_GATE_REPORT_PATH,
    mv_production_readiness_certification_export_dir: MV_PRODUCTION_READINESS_CERTIFICATION_EXPORT_DIR,
    mv_production_readiness_certification_manifest_path: MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH,
    mv_production_readiness_certification_artifact_path: MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    readiness_certified: readinessCertified,
    readiness_score: readinessScore,
    readiness_tier: pass ? PRODUCTION_READINESS_TIER_TEST_READY : readinessTier,
    production_blockers_remaining: productionBlockersRemaining,
    next_stage_gate_label: pass ? NEXT_STAGE_GATE_LABEL : null,
    traceability_chain: traceabilityChains,
    readiness_gate_consumed: toStatus(readinessGateConsumed),
    readiness_certified_status: toStatus(readinessCertified),
    readiness_score_valid: toStatus(readinessScoreValid),
    readiness_tier_valid: toStatus(readinessTierValid),
    production_blockers_resolved: toStatus(productionBlockersResolved),
    certification_version_valid: toStatus(certificationVersionValid),
    next_stage_gate_label_valid: toStatus(nextStageGateLabelValid),
    test_ready_status_verified: toStatus(testReadyStatusVerified),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    readiness_not_certified: readinessNotCertified,
    readiness_score_invalid: readinessScoreInvalid,
    readiness_tier_invalid: readinessTierInvalid,
    production_blocker_detected: productionBlockerDetected,
    certification_version_invalid: certificationVersionInvalid,
    next_stage_gate_missing: nextStageGateMissing,
    test_ready_status_not_verified: testReadyStatusNotVerified,
    readiness_gate_missing: readinessGateMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_readiness_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_READINESS_CERTIFIED_STATUS : null,
    test_ready_status: pass ? MV_TEST_READY_CERTIFIED_STATUS : null,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT
      : MV_PRODUCTION_READINESS_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READINESS_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
