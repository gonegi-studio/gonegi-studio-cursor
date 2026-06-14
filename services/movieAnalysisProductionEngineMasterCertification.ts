import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  GENERATION_PLANNING_ENGINE_PASS_VERDICT,
  GENERATION_PLANNING_ENGINE_REPORT_PATH,
  GENERATION_PLANNING_READY_STATUS,
} from './movieAnalysisGenerationPlanningEngine.js';
import {
  PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT,
  PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
  PRODUCTION_BLUEPRINT_EXPANDED_STATUS,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
} from './movieAnalysisProductionBlueprintExpansion.js';
import {
  PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT,
  PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE,
} from './movieAnalysisProductionEngineFoundation.js';
import {
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS,
  SAFE_CREATE_POLICY,
} from './movieAnalysisProductionEngineIntegrityAudit.js';
import {
  PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  PRODUCTION_RUNTIME_CERTIFIED_STATUS,
} from './movieAnalysisProductionRuntimeCertification.js';
import {
  PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
  PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  PRODUCTION_RUNTIME_READY_STATUS,
} from './movieAnalysisProductionRuntimeEngine.js';
import {
  SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
  SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  SCENE_ASSEMBLY_READY_STATUS,
} from './movieAnalysisSceneAssemblyEngine.js';
import {
  SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
  SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  SHOT_ASSEMBLY_READY_STATUS,
} from './movieAnalysisShotAssemblyEngine.js';
import {
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
  TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
} from './movieAnalysisTestModeExecutionPackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PRODUCTION_ENGINE_MASTER_CERTIFICATION_PHASE =
  'PHASE-LEVEL3-010-PRODUCTION_ENGINE_MASTER_CERTIFICATION_V1' as const;
export const PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PRODUCTION_ENGINE_MASTER_CERTIFICATION_V1' as const;
export const PRODUCTION_ENGINE_MASTER_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PRODUCTION_ENGINE_MASTER_CERTIFICATION_V1' as const;
export const PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS =
  'PRODUCTION_ENGINE_MASTER_CERTIFIED' as const;
export const PRODUCTION_ENGINE_MASTER_CERTIFICATION_DIR =
  'reports/movie_analysis_production_engine_master_certification' as const;
export const PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_production_engine_master_certification/movie-analysis-production-engine-master-certification-report.json' as const;
export const PRODUCTION_ENGINE_MASTER_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_production_engine_master_certification/MOVIE_ANALYSIS_PRODUCTION_ENGINE_MASTER_CERTIFICATION.md' as const;
export const PRODUCTION_ENGINE_MASTER_CERTIFICATION_EXPORT_DIR =
  'exports/movie_analysis_production_engine_master_certification' as const;
export const PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH =
  'exports/movie_analysis_production_engine_master_certification/movie-analysis-production-engine-master-certification-manifest.json' as const;
export const PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH =
  'exports/movie_analysis_production_engine_master_certification/production-engine-master-certification.json' as const;

export const LEVEL3_MASTER_PHASE_COUNT = 9 as const;
export const NEXT_STAGE_LABEL = 'TEST_MODE_EXECUTION' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type ProductionEngineMasterCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_level?: string;
  check_id?: string;
};

export type Level3PhaseCertificationAudit = {
  phase_level: string;
  phase: string;
  report_path: string;
  artifact_path: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  report_exists: boolean;
  artifact_exists: boolean;
  phase_certified: boolean;
};

export type MasterCertificationCheck = {
  check_id: string;
  check_label: string;
  status: CertificationStatus;
};

export type ProductionEngineMasterCertificationArtifact = {
  certification_id: string;
  phase: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_PHASE;
  generated_at: string;
  level3_master_phase_count: typeof LEVEL3_MASTER_PHASE_COUNT;
  production_engine_integrity_audit_artifact_path: typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  phase_certification_audits: Level3PhaseCertificationAudit[];
  certification_checks: MasterCertificationCheck[];
  next_stage: typeof NEXT_STAGE_LABEL;
  next_stage_readiness: boolean;
  test_execution_ready: boolean;
  production_execution_blocked: boolean;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    upstream_artifacts_unchanged: boolean;
  };
  master_certification_complete: boolean;
};

export type MovieAnalysisProductionEngineMasterCertificationManifest = {
  manifest_id: string;
  phase: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_PHASE;
  generated_at: string;
  level3_master_phase_count: typeof LEVEL3_MASTER_PHASE_COUNT;
  all_level3_phases_certified: CertificationStatus;
  integrity_audit_verified: CertificationStatus;
  traceability_chain_verified: CertificationStatus;
  memory_binding_verified: CertificationStatus;
  runtime_safety_verified: CertificationStatus;
  test_mode_constraints_verified: CertificationStatus;
  report_manifest_consistency_verified: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  next_stage_readiness: boolean;
  test_execution_ready: boolean;
  production_execution_blocked: boolean;
  master_certification_complete: CertificationStatus;
  level3_foundation_complete: CertificationStatus;
  production_engine_ready_for_next_stage: CertificationStatus;
  traceability_preserved: boolean;
  certification_status: typeof PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS | null;
};

export type MovieAnalysisProductionEngineMasterCertificationReport = {
  report_id: string;
  phase: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_PHASE;
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
  production_engine_integrity_audit_report_path: typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH;
  production_engine_integrity_audit_artifact_path: typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH;
  test_mode_execution_package_report_path: typeof TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  production_engine_master_certification_export_dir: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_EXPORT_DIR;
  production_engine_master_certification_manifest_path: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH;
  production_engine_master_certification_artifact_path: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  level3_master_phase_count: typeof LEVEL3_MASTER_PHASE_COUNT;
  all_level3_phases_certified: CertificationStatus;
  integrity_audit_verified: CertificationStatus;
  traceability_chain_verified: CertificationStatus;
  memory_binding_verified: CertificationStatus;
  runtime_safety_verified: CertificationStatus;
  test_mode_constraints_verified: CertificationStatus;
  report_manifest_consistency_verified: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  next_stage_readiness: boolean;
  test_execution_ready: boolean;
  production_execution_blocked: boolean;
  master_certification_complete: CertificationStatus;
  level3_foundation_complete: CertificationStatus;
  production_engine_ready_for_next_stage: CertificationStatus;
  traceability_preserved: boolean;
  phase_certification_missing: boolean;
  integrity_audit_failed: boolean;
  traceability_break: boolean;
  memory_binding_loss: boolean;
  runtime_safety_loss: boolean;
  report_manifest_mismatch: boolean;
  safe_create_policy_violation: boolean;
  next_stage_not_ready: boolean;
  production_execution_unblocked: boolean;
  production_engine_master_certification_ready: CertificationStatus;
  certification_status: typeof PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS | null;
  phase_certification_audits: Level3PhaseCertificationAudit[];
  certification_checks: MasterCertificationCheck[];
  final_verdict:
    | typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT
    | typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_FAIL_VERDICT;
  issues: ProductionEngineMasterCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type Level3MasterPhaseEntry = {
  phase_level: string;
  phase: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  report_path: string;
  artifact_path: string;
};

const LEVEL3_MASTER_PHASE_ENTRIES: Level3MasterPhaseEntry[] = [
  {
    phase_level: 'L3-001',
    phase: 'PHASE-LEVEL3-001-PRODUCTION_ENGINE_FOUNDATION_V1',
    pass_verdict: PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT,
    certification_status: PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE,
    ready_field: 'production_engine_foundation_ready',
    report_path: PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
    artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-002',
    phase: 'PHASE-LEVEL3-002-PRODUCTION_BLUEPRINT_EXPANSION_V1',
    pass_verdict: PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT,
    certification_status: PRODUCTION_BLUEPRINT_EXPANDED_STATUS,
    ready_field: 'production_blueprint_expansion_ready',
    report_path: PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
    artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-003',
    phase: 'PHASE-LEVEL3-003-SCENE_ASSEMBLY_ENGINE_V1',
    pass_verdict: SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
    certification_status: SCENE_ASSEMBLY_READY_STATUS,
    ready_field: 'scene_assembly_engine_ready',
    report_path: SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
    artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-004',
    phase: 'PHASE-LEVEL3-004-SHOT_ASSEMBLY_ENGINE_V1',
    pass_verdict: SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
    certification_status: SHOT_ASSEMBLY_READY_STATUS,
    ready_field: 'shot_assembly_engine_ready',
    report_path: SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
    artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-005',
    phase: 'PHASE-LEVEL3-005-GENERATION_PLANNING_ENGINE_V1',
    pass_verdict: GENERATION_PLANNING_ENGINE_PASS_VERDICT,
    certification_status: GENERATION_PLANNING_READY_STATUS,
    ready_field: 'generation_planning_engine_ready',
    report_path: GENERATION_PLANNING_ENGINE_REPORT_PATH,
    artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-006',
    phase: 'PHASE-LEVEL3-006-PRODUCTION_RUNTIME_ENGINE_V1',
    pass_verdict: PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
    certification_status: PRODUCTION_RUNTIME_READY_STATUS,
    ready_field: 'production_runtime_engine_ready',
    report_path: PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
    artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-007',
    phase: 'PHASE-LEVEL3-007-PRODUCTION_RUNTIME_CERTIFICATION_V1',
    pass_verdict: PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
    certification_status: PRODUCTION_RUNTIME_CERTIFIED_STATUS,
    ready_field: 'production_runtime_certification_ready',
    report_path: PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
    artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-008',
    phase: 'PHASE-LEVEL3-008-TEST_MODE_EXECUTION_PACKAGE_V1',
    pass_verdict: TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
    certification_status: TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
    ready_field: 'test_mode_execution_package_ready',
    report_path: TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
    artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-009',
    phase: 'PHASE-LEVEL3-009-PRODUCTION_ENGINE_INTEGRITY_AUDIT_V1',
    pass_verdict: PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT,
    certification_status: PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS,
    ready_field: 'production_engine_integrity_audit_ready',
    report_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
    artifact_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
  },
];

const READ_ONLY_UPSTREAM_PATHS = LEVEL3_MASTER_PHASE_ENTRIES.map((entry) => entry.artifact_path);

const WRITE_PATHS = [
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_DIR,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_EXPORT_DIR,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_MD_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
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

function auditPhaseCertification(
  root: string,
  entry: Level3MasterPhaseEntry
): Level3PhaseCertificationAudit {
  const report = loadJson<Record<string, unknown>>(root, entry.report_path);
  const artifactExists = fs.existsSync(path.join(root, entry.artifact_path));
  const reportExists = report !== null;
  const phaseCertified =
    reportExists &&
    artifactExists &&
    report.final_verdict === entry.pass_verdict &&
    report.certification_status === entry.certification_status &&
    report[entry.ready_field] === 'PASS';

  return {
    phase_level: entry.phase_level,
    phase: entry.phase,
    report_path: entry.report_path,
    artifact_path: entry.artifact_path,
    pass_verdict: entry.pass_verdict,
    certification_status: entry.certification_status,
    ready_field: entry.ready_field,
    report_exists: reportExists,
    artifact_exists: artifactExists,
    phase_certified: phaseCertified,
  };
}

function buildMarkdown(report: MovieAnalysisProductionEngineMasterCertificationReport): string {
  const lines = [
    '# Movie Analysis Production Engine Master Certification',
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
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| all_level3_phases_certified | ${report.all_level3_phases_certified} |`,
    `| integrity_audit_verified | ${report.integrity_audit_verified} |`,
    `| traceability_chain_verified | ${report.traceability_chain_verified} |`,
    `| memory_binding_verified | ${report.memory_binding_verified} |`,
    `| runtime_safety_verified | ${report.runtime_safety_verified} |`,
    `| test_mode_constraints_verified | ${report.test_mode_constraints_verified} |`,
    `| report_manifest_consistency_verified | ${report.report_manifest_consistency_verified} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| next_stage_readiness | ${report.next_stage_readiness} |`,
    `| test_execution_ready | ${report.test_execution_ready} |`,
    `| production_execution_blocked | ${report.production_execution_blocked} |`,
    `| master_certification_complete | ${report.master_certification_complete} |`,
    `| level3_foundation_complete | ${report.level3_foundation_complete} |`,
    `| production_engine_ready_for_next_stage | ${report.production_engine_ready_for_next_stage} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Phase Certifications',
    ''
  );

  for (const audit of report.phase_certification_audits) {
    lines.push(`- ${audit.phase_level}: certified=${audit.phase_certified} status=${audit.certification_status}`);
  }

  lines.push('', '## Certification Checks', '');
  for (const check of report.certification_checks) {
    lines.push(`- ${check.check_id}: ${check.status} (${check.check_label})`);
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
  issues: ProductionEngineMasterCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MovieAnalysisProductionEngineMasterCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MovieAnalysisProductionEngineMasterCertificationReport = {
    report_id: 'movie-analysis-production-engine-master-certification-report-v1',
    phase: PRODUCTION_ENGINE_MASTER_CERTIFICATION_PHASE,
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
    production_engine_integrity_audit_report_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
    production_engine_integrity_audit_artifact_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
    test_mode_execution_package_report_path: TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    production_engine_master_certification_export_dir: PRODUCTION_ENGINE_MASTER_CERTIFICATION_EXPORT_DIR,
    production_engine_master_certification_manifest_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH,
    production_engine_master_certification_artifact_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    level3_master_phase_count: LEVEL3_MASTER_PHASE_COUNT,
    all_level3_phases_certified: 'FAIL',
    integrity_audit_verified: 'FAIL',
    traceability_chain_verified: 'FAIL',
    memory_binding_verified: 'FAIL',
    runtime_safety_verified: 'FAIL',
    test_mode_constraints_verified: 'FAIL',
    report_manifest_consistency_verified: 'FAIL',
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_readiness: false,
    test_execution_ready: false,
    production_execution_blocked: false,
    master_certification_complete: 'FAIL',
    level3_foundation_complete: 'FAIL',
    production_engine_ready_for_next_stage: 'FAIL',
    traceability_preserved: false,
    phase_certification_missing: true,
    integrity_audit_failed: true,
    traceability_break: true,
    memory_binding_loss: true,
    runtime_safety_loss: true,
    report_manifest_mismatch: true,
    safe_create_policy_violation: !upstreamUnchanged,
    next_stage_not_ready: true,
    production_execution_unblocked: true,
    production_engine_master_certification_ready: 'FAIL',
    certification_status: null,
    phase_certification_audits: [],
    certification_checks: [],
    final_verdict: PRODUCTION_ENGINE_MASTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisProductionEngineMasterCertification(
  projectRoot?: string
): MovieAnalysisProductionEngineMasterCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProductionEngineMasterCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const integrityAuditReport = loadJson<Record<string, unknown>>(
    root,
    PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH
  );
  const integrityAuditArtifactPath = path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH);

  if (
    !integrityAuditReport ||
    integrityAuditReport.final_verdict !== PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT ||
    integrityAuditReport.certification_status !== PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS ||
    !fs.existsSync(integrityAuditArtifactPath)
  ) {
    issues.push({
      code: 'INTEGRITY_AUDIT_PRECHECK_FAILED',
      message: `Required ${PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT} with ${PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const integrityAuditArtifact = loadJson<{
    audit_complete: boolean;
    traceability_preserved?: boolean;
    runtime_safety_summary: {
      runtime_safety_preserved: boolean;
    };
    test_mode_constraints_summary: {
      test_mode_constraints_preserved: boolean;
    };
    memory_binding_audits: Array<{ binding_ready: CertificationStatus }>;
    safe_create_policy: {
      upstream_artifacts_unchanged: boolean;
    };
  }>(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH);

  const phaseCertificationAudits = LEVEL3_MASTER_PHASE_ENTRIES.map((entry) =>
    auditPhaseCertification(root, entry)
  );

  for (const audit of phaseCertificationAudits) {
    if (!audit.phase_certified) {
      issues.push({
        code: 'PHASE_CERTIFICATION_MISSING',
        message: `Phase ${audit.phase_level} is not certified`,
        severity: 'error',
        phase_level: audit.phase_level,
      });
    }
  }

  const allLevel3PhasesCertified = phaseCertificationAudits.every((audit) => audit.phase_certified);
  const integrityAuditVerified =
    integrityAuditReport.audit_complete === 'PASS' &&
    integrityAuditReport.production_engine_integrity_audit_ready === 'PASS' &&
    integrityAuditArtifact?.audit_complete === true;
  const traceabilityChainVerified =
    integrityAuditReport.traceability_chain_integrity === 'PASS' &&
    integrityAuditReport.cross_phase_traceability_valid === 'PASS';
  const memoryBindingVerified =
    integrityAuditReport.memory_binding_integrity === 'PASS' &&
    integrityAuditReport.memory_bindings_preserved === 'PASS' &&
    integrityAuditArtifact?.memory_binding_audits.every((binding) => binding.binding_ready === 'PASS') ===
      true;
  const runtimeSafetyVerified =
    integrityAuditReport.runtime_safety_preserved === 'PASS' &&
    integrityAuditArtifact?.runtime_safety_summary.runtime_safety_preserved === true;
  const testModeConstraintsVerified =
    integrityAuditReport.test_mode_constraints_preserved === 'PASS' &&
    integrityAuditArtifact?.test_mode_constraints_summary.test_mode_constraints_preserved === true;
  const reportManifestConsistencyVerified =
    integrityAuditReport.report_consistency_integrity === 'PASS' &&
    integrityAuditReport.manifest_consistency_integrity === 'PASS';

  const testModeReport = loadJson<Record<string, unknown>>(
    root,
    TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH
  );
  const testModeArtifact = loadJson<{
    test_packages: Array<{
      test_mode: boolean;
      production_mode: boolean;
      external_call_allowed: boolean;
      gpu_execution_allowed: boolean;
      test_package_ready: CertificationStatus;
    }>;
    test_package_complete: boolean;
  }>(root, TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH);

  const runtimeCertArtifact = loadJson<Record<string, unknown>>(
    root,
    PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH
  );

  const testExecutionReady =
    testModeReport?.test_mode_execution_package_ready === 'PASS' &&
    testModeReport?.test_package_complete === 'PASS' &&
    testModeArtifact?.test_package_complete === true &&
    testModeArtifact?.test_packages.every((testPackage) => testPackage.test_package_ready === 'PASS') ===
      true;

  const productionExecutionBlocked =
    runtimeCertArtifact?.production_mode_blocked === true &&
    testModeReport?.production_mode_disabled === 'PASS' &&
    testModeArtifact?.test_packages.every((testPackage) => testPackage.production_mode === false) ===
      true &&
    testModeArtifact?.test_packages.every(
      (testPackage) =>
        testPackage.external_call_allowed === false && testPackage.gpu_execution_allowed === false
    ) === true;

  const foundationAudit = phaseCertificationAudits.find((audit) => audit.phase_level === 'L3-001');
  const level3FoundationComplete = foundationAudit?.phase_certified === true;

  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged;

  const nextStageReadiness =
    allLevel3PhasesCertified &&
    integrityAuditVerified &&
    traceabilityChainVerified &&
    memoryBindingVerified &&
    runtimeSafetyVerified &&
    testModeConstraintsVerified &&
    testExecutionReady &&
    productionExecutionBlocked &&
    level3FoundationComplete;

  const productionEngineReadyForNextStage = nextStageReadiness;

  const traceabilityPreserved =
    integrityAuditReport.traceability_chain_integrity === 'PASS' &&
    phaseCertificationAudits
      .filter((audit) => audit.phase_level !== 'L3-009')
      .every((audit) => {
        const phaseReport = loadJson<Record<string, unknown>>(root, audit.report_path);
        return phaseReport?.traceability_preserved === true;
      });

  const masterCertificationComplete =
    allLevel3PhasesCertified &&
    integrityAuditVerified &&
    traceabilityChainVerified &&
    memoryBindingVerified &&
    runtimeSafetyVerified &&
    testModeConstraintsVerified &&
    reportManifestConsistencyVerified &&
    safeCreatePolicyVerified &&
    nextStageReadiness &&
    testExecutionReady &&
    productionExecutionBlocked &&
    traceabilityPreserved;

  const phaseCertificationMissing = !allLevel3PhasesCertified;
  const integrityAuditFailed = !integrityAuditVerified;
  const traceabilityBreak = !traceabilityChainVerified || !traceabilityPreserved;
  const memoryBindingLoss = !memoryBindingVerified;
  const runtimeSafetyLoss = !runtimeSafetyVerified;
  const reportManifestMismatch = !reportManifestConsistencyVerified;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;
  const nextStageNotReady = !nextStageReadiness;
  const productionExecutionUnblocked = !productionExecutionBlocked;

  if (phaseCertificationMissing) {
    issues.push({
      code: 'PHASE_CERTIFICATION_MISSING',
      message: 'One or more Level3 phases are not certified',
      severity: 'error',
    });
  }
  if (integrityAuditFailed) {
    issues.push({
      code: 'INTEGRITY_AUDIT_FAILED',
      message: 'Production engine integrity audit is not verified',
      severity: 'error',
    });
  }
  if (traceabilityBreak) {
    issues.push({
      code: 'TRACEABILITY_BREAK',
      message: 'Level3 traceability chain is broken',
      severity: 'error',
    });
  }
  if (memoryBindingLoss) {
    issues.push({
      code: 'MEMORY_BINDING_LOSS',
      message: 'Production memory bindings are not verified',
      severity: 'error',
    });
  }
  if (runtimeSafetyLoss) {
    issues.push({
      code: 'RUNTIME_SAFETY_LOSS',
      message: 'Runtime safety constraints are not preserved',
      severity: 'error',
    });
  }
  if (reportManifestMismatch) {
    issues.push({
      code: 'REPORT_MANIFEST_MISMATCH',
      message: 'Report/manifest consistency is not verified',
      severity: 'error',
    });
  }
  if (safeCreatePolicyViolation) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Upstream Level3 artifacts were modified during master certification',
      severity: 'error',
    });
  }
  if (nextStageNotReady) {
    issues.push({
      code: 'NEXT_STAGE_NOT_READY',
      message: 'Production engine is not ready for the next stage',
      severity: 'error',
    });
  }
  if (productionExecutionUnblocked) {
    issues.push({
      code: 'PRODUCTION_EXECUTION_UNBLOCKED',
      message: 'Production execution is not blocked',
      severity: 'error',
    });
  }

  const certificationChecks: MasterCertificationCheck[] = [
    {
      check_id: 'all_level3_phases_certified',
      check_label: 'All Level3 Phases Certified',
      status: toStatus(allLevel3PhasesCertified),
    },
    {
      check_id: 'integrity_audit_verified',
      check_label: 'Integrity Audit Verified',
      status: toStatus(integrityAuditVerified),
    },
    {
      check_id: 'traceability_chain_verified',
      check_label: 'Traceability Chain Verified',
      status: toStatus(traceabilityChainVerified && traceabilityPreserved),
    },
    {
      check_id: 'memory_binding_verified',
      check_label: 'Memory Binding Verified',
      status: toStatus(memoryBindingVerified),
    },
    {
      check_id: 'runtime_safety_verified',
      check_label: 'Runtime Safety Verified',
      status: toStatus(runtimeSafetyVerified),
    },
    {
      check_id: 'test_mode_constraints_verified',
      check_label: 'Test Mode Constraints Verified',
      status: toStatus(testModeConstraintsVerified),
    },
    {
      check_id: 'report_manifest_consistency_verified',
      check_label: 'Report Manifest Consistency Verified',
      status: toStatus(reportManifestConsistencyVerified),
    },
    {
      check_id: 'safe_create_policy_verified',
      check_label: 'Safe Create Policy Verified',
      status: toStatus(safeCreatePolicyVerified),
    },
    {
      check_id: 'next_stage_readiness',
      check_label: 'Next Stage Readiness',
      status: toStatus(nextStageReadiness),
    },
    {
      check_id: 'test_execution_ready',
      check_label: 'Test Execution Ready',
      status: toStatus(testExecutionReady),
    },
    {
      check_id: 'production_execution_blocked',
      check_label: 'Production Execution Blocked',
      status: toStatus(productionExecutionBlocked),
    },
  ];

  const pass =
    masterCertificationComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: ProductionEngineMasterCertificationArtifact = {
    certification_id: 'production-engine-master-certification-v1',
    phase: PRODUCTION_ENGINE_MASTER_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level3_master_phase_count: LEVEL3_MASTER_PHASE_COUNT,
    production_engine_integrity_audit_artifact_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    phase_certification_audits: phaseCertificationAudits,
    certification_checks: certificationChecks,
    next_stage: NEXT_STAGE_LABEL,
    next_stage_readiness: nextStageReadiness,
    test_execution_ready: testExecutionReady,
    production_execution_blocked: productionExecutionBlocked,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    master_certification_complete: masterCertificationComplete,
  };

  const manifest: MovieAnalysisProductionEngineMasterCertificationManifest = {
    manifest_id: 'movie-analysis-production-engine-master-certification-manifest-v1',
    phase: PRODUCTION_ENGINE_MASTER_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level3_master_phase_count: LEVEL3_MASTER_PHASE_COUNT,
    all_level3_phases_certified: toStatus(allLevel3PhasesCertified),
    integrity_audit_verified: toStatus(integrityAuditVerified),
    traceability_chain_verified: toStatus(traceabilityChainVerified && traceabilityPreserved),
    memory_binding_verified: toStatus(memoryBindingVerified),
    runtime_safety_verified: toStatus(runtimeSafetyVerified),
    test_mode_constraints_verified: toStatus(testModeConstraintsVerified),
    report_manifest_consistency_verified: toStatus(reportManifestConsistencyVerified),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_readiness: nextStageReadiness,
    test_execution_ready: testExecutionReady,
    production_execution_blocked: productionExecutionBlocked,
    master_certification_complete: toStatus(masterCertificationComplete),
    level3_foundation_complete: toStatus(level3FoundationComplete),
    production_engine_ready_for_next_stage: toStatus(productionEngineReadyForNextStage),
    traceability_preserved: traceabilityPreserved,
    certification_status: pass ? PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisProductionEngineMasterCertificationReport = {
    report_id: 'movie-analysis-production-engine-master-certification-report-v1',
    phase: PRODUCTION_ENGINE_MASTER_CERTIFICATION_PHASE,
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
    production_engine_integrity_audit_report_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
    production_engine_integrity_audit_artifact_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
    test_mode_execution_package_report_path: TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    production_engine_master_certification_export_dir: PRODUCTION_ENGINE_MASTER_CERTIFICATION_EXPORT_DIR,
    production_engine_master_certification_manifest_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH,
    production_engine_master_certification_artifact_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level3_master_phase_count: LEVEL3_MASTER_PHASE_COUNT,
    all_level3_phases_certified: toStatus(allLevel3PhasesCertified),
    integrity_audit_verified: toStatus(integrityAuditVerified),
    traceability_chain_verified: toStatus(traceabilityChainVerified && traceabilityPreserved),
    memory_binding_verified: toStatus(memoryBindingVerified),
    runtime_safety_verified: toStatus(runtimeSafetyVerified),
    test_mode_constraints_verified: toStatus(testModeConstraintsVerified),
    report_manifest_consistency_verified: toStatus(reportManifestConsistencyVerified),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_readiness: nextStageReadiness,
    test_execution_ready: testExecutionReady,
    production_execution_blocked: productionExecutionBlocked,
    master_certification_complete: toStatus(masterCertificationComplete),
    level3_foundation_complete: toStatus(level3FoundationComplete),
    production_engine_ready_for_next_stage: toStatus(productionEngineReadyForNextStage),
    traceability_preserved: traceabilityPreserved,
    phase_certification_missing: phaseCertificationMissing,
    integrity_audit_failed: integrityAuditFailed,
    traceability_break: traceabilityBreak,
    memory_binding_loss: memoryBindingLoss,
    runtime_safety_loss: runtimeSafetyLoss,
    report_manifest_mismatch: reportManifestMismatch,
    safe_create_policy_violation: safeCreatePolicyViolation,
    next_stage_not_ready: nextStageNotReady,
    production_execution_unblocked: productionExecutionUnblocked,
    production_engine_master_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS : null,
    phase_certification_audits: phaseCertificationAudits,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT
      : PRODUCTION_ENGINE_MASTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
