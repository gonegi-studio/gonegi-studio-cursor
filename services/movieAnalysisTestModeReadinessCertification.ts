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
  PRODUCTION_MEMORY_BINDING_COUNT,
} from './movieAnalysisProductionEngineFoundation.js';
import {
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS,
} from './movieAnalysisProductionEngineIntegrityAudit.js';
import {
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
} from './movieAnalysisProductionEngineMasterCertification.js';
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
  TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
  TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
  SAFE_CREATE_POLICY,
  type TestModeExecutionAuditArtifact,
} from './movieAnalysisTestModeExecutionAudit.js';
import {
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
  TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
  type TestModeExecutionPackageArtifact,
} from './movieAnalysisTestModeExecutionPackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TEST_MODE_READINESS_CERTIFICATION_PHASE =
  'PHASE-LEVEL3-012-TEST_MODE_READINESS_CERTIFICATION_V1' as const;
export const TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_TEST_MODE_READINESS_CERTIFICATION_V1' as const;
export const TEST_MODE_READINESS_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_TEST_MODE_READINESS_CERTIFICATION_V1' as const;
export const TEST_MODE_READY_FOR_NEXT_STAGE_STATUS =
  'TEST_MODE_READY_FOR_NEXT_STAGE' as const;
export const TEST_MODE_READINESS_CERTIFICATION_DIR =
  'reports/movie_analysis_test_mode_readiness_certification' as const;
export const TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_test_mode_readiness_certification/movie-analysis-test-mode-readiness-certification-report.json' as const;
export const TEST_MODE_READINESS_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_test_mode_readiness_certification/MOVIE_ANALYSIS_TEST_MODE_READINESS_CERTIFICATION.md' as const;
export const TEST_MODE_READINESS_CERTIFICATION_EXPORT_DIR =
  'exports/movie_analysis_test_mode_readiness_certification' as const;
export const TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH =
  'exports/movie_analysis_test_mode_readiness_certification/movie-analysis-test-mode-readiness-certification-manifest.json' as const;
export const TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH =
  'exports/movie_analysis_test_mode_readiness_certification/test-mode-readiness-certification.json' as const;

export const LEVEL3_READINESS_PHASE_COUNT = 11 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type TestModeReadinessCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_level?: string;
  check_id?: string;
};

export type ReadinessCertificationCheck = {
  check_id: string;
  check_label: string;
  status: CertificationStatus;
};

export type Level3PhaseReadinessAudit = {
  phase_level: string;
  phase: string;
  report_path: string;
  artifact_path: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  phase_certified: boolean;
};

export type TestModeReadinessCertificationArtifact = {
  certification_id: string;
  phase: typeof TEST_MODE_READINESS_CERTIFICATION_PHASE;
  generated_at: string;
  level3_readiness_phase_count: typeof LEVEL3_READINESS_PHASE_COUNT;
  test_mode_execution_audit_artifact_path: typeof TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  phase_readiness_audits: Level3PhaseReadinessAudit[];
  certification_checks: ReadinessCertificationCheck[];
  dry_run_allowed: true;
  test_runtime_package_ready: true;
  mock_output_only: true;
  real_generation: false;
  production_execution_blocked: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  traceability_preserved: boolean;
  memory_bindings_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    upstream_artifacts_unchanged: boolean;
  };
  readiness_certification_complete: boolean;
  test_mode_ready_for_next_stage: boolean;
  mock_execution_verified: boolean;
  production_still_blocked: boolean;
};

export type MovieAnalysisTestModeReadinessCertificationManifest = {
  manifest_id: string;
  phase: typeof TEST_MODE_READINESS_CERTIFICATION_PHASE;
  generated_at: string;
  level3_readiness_phase_count: typeof LEVEL3_READINESS_PHASE_COUNT;
  test_execution_ready: CertificationStatus;
  execution_simulation_ready: CertificationStatus;
  dry_run_allowed: true;
  test_runtime_package_ready: true;
  mock_output_only: true;
  real_generation: false;
  production_execution_blocked: CertificationStatus;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  traceability_preserved: boolean;
  memory_bindings_preserved: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  readiness_certification_complete: CertificationStatus;
  test_mode_ready_for_next_stage: CertificationStatus;
  mock_execution_verified: CertificationStatus;
  production_still_blocked: CertificationStatus;
  certification_status: typeof TEST_MODE_READY_FOR_NEXT_STAGE_STATUS | null;
};

export type MovieAnalysisTestModeReadinessCertificationReport = {
  report_id: string;
  phase: typeof TEST_MODE_READINESS_CERTIFICATION_PHASE;
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
  dry_run_allowed: true;
  test_runtime_package_ready: true;
  mock_output_only: true;
  real_generation: false;
  test_mode_execution_audit_report_path: typeof TEST_MODE_EXECUTION_AUDIT_REPORT_PATH;
  test_mode_execution_audit_artifact_path: typeof TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  test_mode_readiness_certification_export_dir: typeof TEST_MODE_READINESS_CERTIFICATION_EXPORT_DIR;
  test_mode_readiness_certification_manifest_path: typeof TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH;
  test_mode_readiness_certification_artifact_path: typeof TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  level3_readiness_phase_count: typeof LEVEL3_READINESS_PHASE_COUNT;
  test_execution_ready: CertificationStatus;
  execution_simulation_ready: CertificationStatus;
  production_execution_blocked: CertificationStatus;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  traceability_preserved: boolean;
  memory_bindings_preserved: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  readiness_certification_complete: CertificationStatus;
  test_mode_ready_for_next_stage: CertificationStatus;
  mock_execution_verified: CertificationStatus;
  production_still_blocked: CertificationStatus;
  test_execution_not_ready: boolean;
  execution_simulation_not_ready: boolean;
  dry_run_not_allowed: boolean;
  test_runtime_package_missing: boolean;
  real_generation_detected: boolean;
  production_execution_unblocked: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  traceability_loss: boolean;
  memory_binding_loss: boolean;
  safe_create_policy_violation: boolean;
  test_mode_readiness_certification_ready: CertificationStatus;
  certification_status: typeof TEST_MODE_READY_FOR_NEXT_STAGE_STATUS | null;
  phase_readiness_audits: Level3PhaseReadinessAudit[];
  certification_checks: ReadinessCertificationCheck[];
  final_verdict:
    | typeof TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT
    | typeof TEST_MODE_READINESS_CERTIFICATION_FAIL_VERDICT;
  issues: TestModeReadinessCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type Level3ReadinessPhaseEntry = {
  phase_level: string;
  phase: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  report_path: string;
  artifact_path: string;
};

const LEVEL3_READINESS_PHASE_ENTRIES: Level3ReadinessPhaseEntry[] = [
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
  {
    phase_level: 'L3-010',
    phase: 'PHASE-LEVEL3-010-PRODUCTION_ENGINE_MASTER_CERTIFICATION_V1',
    pass_verdict: PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
    certification_status: PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
    ready_field: 'production_engine_master_certification_ready',
    report_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
    artifact_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-011',
    phase: 'PHASE-LEVEL3-011-TEST_MODE_EXECUTION_AUDIT_V1',
    pass_verdict: TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
    certification_status: TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
    ready_field: 'test_mode_execution_audit_ready',
    report_path: TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
    artifact_path: TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  },
];

const READ_ONLY_UPSTREAM_PATHS = LEVEL3_READINESS_PHASE_ENTRIES.map((entry) => entry.artifact_path);

const WRITE_PATHS = [
  TEST_MODE_READINESS_CERTIFICATION_DIR,
  TEST_MODE_READINESS_CERTIFICATION_EXPORT_DIR,
  TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
  TEST_MODE_READINESS_CERTIFICATION_MD_PATH,
  TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH,
  TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
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

function auditPhaseReadiness(
  root: string,
  entry: Level3ReadinessPhaseEntry
): Level3PhaseReadinessAudit {
  const report = loadJson<Record<string, unknown>>(root, entry.report_path);
  const artifactExists = fs.existsSync(path.join(root, entry.artifact_path));
  const phaseCertified =
    report !== null &&
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
    phase_certified: phaseCertified,
  };
}

function buildMarkdown(report: MovieAnalysisTestModeReadinessCertificationReport): string {
  const lines = [
    '# Movie Analysis Test Mode Readiness Certification',
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
    `| test_execution_ready | ${report.test_execution_ready} |`,
    `| execution_simulation_ready | ${report.execution_simulation_ready} |`,
    `| dry_run_allowed | ${report.dry_run_allowed} |`,
    `| test_runtime_package_ready | ${report.test_runtime_package_ready} |`,
    `| mock_output_only | ${report.mock_output_only} |`,
    `| real_generation | ${report.real_generation} |`,
    `| production_execution_blocked | ${report.production_execution_blocked} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| memory_bindings_preserved | ${report.memory_bindings_preserved} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| readiness_certification_complete | ${report.readiness_certification_complete} |`,
    `| test_mode_ready_for_next_stage | ${report.test_mode_ready_for_next_stage} |`,
    `| mock_execution_verified | ${report.mock_execution_verified} |`,
    `| production_still_blocked | ${report.production_still_blocked} |`,
    '',
    '## Phase Readiness',
    ''
  );

  for (const audit of report.phase_readiness_audits) {
    lines.push(`- ${audit.phase_level}: certified=${audit.phase_certified}`);
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
  issues: TestModeReadinessCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MovieAnalysisTestModeReadinessCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MovieAnalysisTestModeReadinessCertificationReport = {
    report_id: 'movie-analysis-test-mode-readiness-certification-report-v1',
    phase: TEST_MODE_READINESS_CERTIFICATION_PHASE,
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
    dry_run_allowed: true,
    test_runtime_package_ready: true,
    mock_output_only: true,
    real_generation: false,
    test_mode_execution_audit_report_path: TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
    test_mode_execution_audit_artifact_path: TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    test_mode_readiness_certification_export_dir: TEST_MODE_READINESS_CERTIFICATION_EXPORT_DIR,
    test_mode_readiness_certification_manifest_path: TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH,
    test_mode_readiness_certification_artifact_path: TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    level3_readiness_phase_count: LEVEL3_READINESS_PHASE_COUNT,
    test_execution_ready: 'FAIL',
    execution_simulation_ready: 'FAIL',
    production_execution_blocked: 'FAIL',
    external_call_blocked: 'FAIL',
    gpu_execution_blocked: 'FAIL',
    traceability_preserved: false,
    memory_bindings_preserved: 'FAIL',
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    readiness_certification_complete: 'FAIL',
    test_mode_ready_for_next_stage: 'FAIL',
    mock_execution_verified: 'FAIL',
    production_still_blocked: 'FAIL',
    test_execution_not_ready: true,
    execution_simulation_not_ready: true,
    dry_run_not_allowed: true,
    test_runtime_package_missing: true,
    real_generation_detected: true,
    production_execution_unblocked: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    traceability_loss: true,
    memory_binding_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    test_mode_readiness_certification_ready: 'FAIL',
    certification_status: null,
    phase_readiness_audits: [],
    certification_checks: [],
    final_verdict: TEST_MODE_READINESS_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_READINESS_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_READINESS_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisTestModeReadinessCertification(
  projectRoot?: string
): MovieAnalysisTestModeReadinessCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TestModeReadinessCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const executionAuditReport = loadJson<Record<string, unknown>>(
    root,
    TEST_MODE_EXECUTION_AUDIT_REPORT_PATH
  );
  const executionAuditArtifactPath = path.join(root, TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH);

  if (
    !executionAuditReport ||
    executionAuditReport.final_verdict !== TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT ||
    executionAuditReport.certification_status !== TEST_MODE_EXECUTION_AUDIT_READY_STATUS ||
    !fs.existsSync(executionAuditArtifactPath)
  ) {
    issues.push({
      code: 'EXECUTION_AUDIT_PRECHECK_FAILED',
      message: `Required ${TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT} with ${TEST_MODE_EXECUTION_AUDIT_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const executionAuditArtifact = loadJson<TestModeExecutionAuditArtifact>(
    root,
    TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH
  );
  const testModeArtifact = loadJson<TestModeExecutionPackageArtifact>(
    root,
    TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH
  );
  const foundationArtifact = loadJson<{
    memory_bindings: Array<{ binding_ready: CertificationStatus }>;
  }>(root, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH);

  if (!executionAuditArtifact || !testModeArtifact || !foundationArtifact) {
    issues.push({
      code: 'UPSTREAM_ARTIFACT_MISSING',
      message: 'Missing execution audit, test mode package, or foundation artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const phaseReadinessAudits = LEVEL3_READINESS_PHASE_ENTRIES.map((entry) =>
    auditPhaseReadiness(root, entry)
  );

  for (const audit of phaseReadinessAudits) {
    if (!audit.phase_certified) {
      issues.push({
        code: 'PHASE_NOT_CERTIFIED',
        message: `Phase ${audit.phase_level} is not certified`,
        severity: 'error',
        phase_level: audit.phase_level,
      });
    }
  }

  const allPhasesCertified = phaseReadinessAudits.every((audit) => audit.phase_certified);

  const testExecutionReady =
    executionAuditArtifact.audit_complete === true &&
    executionAuditReport.test_execution_ready === 'PASS' &&
    executionAuditArtifact.test_mode_ready === true;

  const executionSimulationReady =
    executionAuditArtifact.execution_simulation_ready === true &&
    executionAuditReport.execution_simulation_ready === 'PASS';

  const dryRunAllowed =
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.dry_run_flags.planning_only === true &&
        testPackage.dry_run_flags.test_mode === true &&
        testPackage.dry_run_flags.no_execution === true &&
        testPackage.dry_run_flags.mock_execution_only === true &&
        testPackage.dry_run_flags.runtime_execution === false
    ) && testModeArtifact.test_package_complete === true;

  const testRuntimePackageReady =
    testModeArtifact.test_package_complete === true &&
    testModeArtifact.test_packages.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
    testModeArtifact.test_packages.every((testPackage) => testPackage.test_package_ready === 'PASS');

  const mockOutputOnly =
    executionAuditArtifact.mock_output_only === true &&
    executionAuditReport.mock_output_only === true &&
    testModeArtifact.test_packages.every(
      (testPackage) => testPackage.dry_run_flags.mock_execution_only === true
    );

  const realGenerationDetected =
    executionAuditArtifact.real_generation !== false ||
    executionAuditReport.real_generation !== false ||
    testModeArtifact.test_packages.some(
      (testPackage) =>
        testPackage.dry_run_flags.image_generation === true ||
        testPackage.dry_run_flags.video_generation === true
    );

  const productionExecutionBlocked =
    executionAuditArtifact.production_still_blocked === true &&
    executionAuditReport.production_execution_blocked === 'PASS' &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.production_mode === false && testPackage.dry_run_flags.production_mode === false
    );

  const externalCallBlocked =
    executionAuditReport.external_call_blocked === 'PASS' &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.external_call_allowed === false &&
        testPackage.dry_run_flags.external_call_allowed === false
    );

  const gpuExecutionBlocked =
    executionAuditReport.gpu_execution_blocked === 'PASS' &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.gpu_execution_allowed === false &&
        testPackage.dry_run_flags.gpu_execution_allowed === false
    );

  const traceabilityPreserved =
    executionAuditArtifact.traceability_preserved === true &&
    executionAuditReport.traceability_preserved === true &&
    testModeArtifact.test_packages.every(
      (testPackage) => testPackage.traceability_chain.trace_integrity === 'PASS'
    );

  const memoryBindingsPreserved =
    executionAuditArtifact.memory_bindings_preserved === true &&
    executionAuditReport.memory_bindings_preserved === 'PASS' &&
    foundationArtifact.memory_bindings.length === PRODUCTION_MEMORY_BINDING_COUNT &&
    foundationArtifact.memory_bindings.every((binding) => binding.binding_ready === 'PASS');

  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged;

  const mockExecutionVerified =
    mockOutputOnly &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.mock_execution_plan.plan_ready === 'PASS' &&
        testPackage.mock_execution_plan.entries.length === testPackage.test_units.length
    ) &&
    executionAuditArtifact.test_package_audits.every(
      (audit) => audit.mock_execution_plan_ready === 'PASS' && audit.mock_output_only === true
    );

  const productionStillBlocked = productionExecutionBlocked && !realGenerationDetected;

  const testModeReadyForNextStage =
    allPhasesCertified &&
    testExecutionReady &&
    executionSimulationReady &&
    dryRunAllowed &&
    testRuntimePackageReady &&
    mockOutputOnly &&
    !realGenerationDetected &&
    productionExecutionBlocked &&
    externalCallBlocked &&
    gpuExecutionBlocked &&
    traceabilityPreserved &&
    memoryBindingsPreserved &&
    safeCreatePolicyVerified &&
    mockExecutionVerified &&
    productionStillBlocked;

  const readinessCertificationComplete = testModeReadyForNextStage;

  const testExecutionNotReady = !testExecutionReady;
  const executionSimulationNotReady = !executionSimulationReady;
  const dryRunNotAllowed = !dryRunAllowed;
  const testRuntimePackageMissing = !testRuntimePackageReady;
  const realGenerationDetectedFlag = realGenerationDetected;
  const productionExecutionUnblocked = !productionExecutionBlocked;
  const externalCallEnabled = !externalCallBlocked;
  const gpuExecutionEnabled = !gpuExecutionBlocked;
  const traceabilityLoss = !traceabilityPreserved;
  const memoryBindingLoss = !memoryBindingsPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  if (testExecutionNotReady) {
    issues.push({ code: 'TEST_EXECUTION_NOT_READY', message: 'Test execution is not ready', severity: 'error' });
  }
  if (executionSimulationNotReady) {
    issues.push({
      code: 'EXECUTION_SIMULATION_NOT_READY',
      message: 'Execution simulation is not ready',
      severity: 'error',
    });
  }
  if (dryRunNotAllowed) {
    issues.push({ code: 'DRY_RUN_NOT_ALLOWED', message: 'Dry run is not allowed', severity: 'error' });
  }
  if (testRuntimePackageMissing) {
    issues.push({
      code: 'TEST_RUNTIME_PACKAGE_MISSING',
      message: 'Test runtime package is missing or incomplete',
      severity: 'error',
    });
  }
  if (realGenerationDetectedFlag) {
    issues.push({
      code: 'REAL_GENERATION_DETECTED',
      message: 'Real generation was detected',
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
  if (externalCallEnabled) {
    issues.push({ code: 'EXTERNAL_CALL_ENABLED', message: 'External calls are enabled', severity: 'error' });
  }
  if (gpuExecutionEnabled) {
    issues.push({ code: 'GPU_EXECUTION_ENABLED', message: 'GPU execution is enabled', severity: 'error' });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability is not preserved', severity: 'error' });
  }
  if (memoryBindingLoss) {
    issues.push({ code: 'MEMORY_BINDING_LOSS', message: 'Memory bindings are not preserved', severity: 'error' });
  }
  if (safeCreatePolicyViolation) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Upstream artifacts were modified during readiness certification',
      severity: 'error',
    });
  }

  const certificationChecks: ReadinessCertificationCheck[] = [
    { check_id: 'test_execution_ready', check_label: 'Test Execution Ready', status: toStatus(testExecutionReady) },
    {
      check_id: 'execution_simulation_ready',
      check_label: 'Execution Simulation Ready',
      status: toStatus(executionSimulationReady),
    },
    { check_id: 'dry_run_allowed', check_label: 'Dry Run Allowed', status: toStatus(dryRunAllowed) },
    {
      check_id: 'test_runtime_package_ready',
      check_label: 'Test Runtime Package Ready',
      status: toStatus(testRuntimePackageReady),
    },
    { check_id: 'mock_output_only', check_label: 'Mock Output Only', status: toStatus(mockOutputOnly) },
    {
      check_id: 'real_generation',
      check_label: 'Real Generation Disabled',
      status: toStatus(!realGenerationDetected),
    },
    {
      check_id: 'production_execution_blocked',
      check_label: 'Production Execution Blocked',
      status: toStatus(productionExecutionBlocked),
    },
    { check_id: 'external_call_blocked', check_label: 'External Call Blocked', status: toStatus(externalCallBlocked) },
    { check_id: 'gpu_execution_blocked', check_label: 'GPU Execution Blocked', status: toStatus(gpuExecutionBlocked) },
    {
      check_id: 'traceability_preserved',
      check_label: 'Traceability Preserved',
      status: toStatus(traceabilityPreserved),
    },
    {
      check_id: 'memory_bindings_preserved',
      check_label: 'Memory Bindings Preserved',
      status: toStatus(memoryBindingsPreserved),
    },
    {
      check_id: 'safe_create_policy_verified',
      check_label: 'Safe Create Policy Verified',
      status: toStatus(safeCreatePolicyVerified),
    },
  ];

  const pass =
    readinessCertificationComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: TestModeReadinessCertificationArtifact = {
    certification_id: 'test-mode-readiness-certification-v1',
    phase: TEST_MODE_READINESS_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level3_readiness_phase_count: LEVEL3_READINESS_PHASE_COUNT,
    test_mode_execution_audit_artifact_path: TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    phase_readiness_audits: phaseReadinessAudits,
    certification_checks: certificationChecks,
    dry_run_allowed: true,
    test_runtime_package_ready: true,
    mock_output_only: true,
    real_generation: false,
    production_execution_blocked: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: memoryBindingsPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    readiness_certification_complete: readinessCertificationComplete,
    test_mode_ready_for_next_stage: testModeReadyForNextStage,
    mock_execution_verified: mockExecutionVerified,
    production_still_blocked: productionStillBlocked,
  };

  const manifest: MovieAnalysisTestModeReadinessCertificationManifest = {
    manifest_id: 'movie-analysis-test-mode-readiness-certification-manifest-v1',
    phase: TEST_MODE_READINESS_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level3_readiness_phase_count: LEVEL3_READINESS_PHASE_COUNT,
    test_execution_ready: toStatus(testExecutionReady),
    execution_simulation_ready: toStatus(executionSimulationReady),
    dry_run_allowed: true,
    test_runtime_package_ready: true,
    mock_output_only: true,
    real_generation: false,
    production_execution_blocked: toStatus(productionExecutionBlocked),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    readiness_certification_complete: toStatus(readinessCertificationComplete),
    test_mode_ready_for_next_stage: toStatus(testModeReadyForNextStage),
    mock_execution_verified: toStatus(mockExecutionVerified),
    production_still_blocked: toStatus(productionStillBlocked),
    certification_status: pass ? TEST_MODE_READY_FOR_NEXT_STAGE_STATUS : null,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_READINESS_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisTestModeReadinessCertificationReport = {
    report_id: 'movie-analysis-test-mode-readiness-certification-report-v1',
    phase: TEST_MODE_READINESS_CERTIFICATION_PHASE,
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
    dry_run_allowed: true,
    test_runtime_package_ready: true,
    mock_output_only: true,
    real_generation: false,
    test_mode_execution_audit_report_path: TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
    test_mode_execution_audit_artifact_path: TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    test_mode_readiness_certification_export_dir: TEST_MODE_READINESS_CERTIFICATION_EXPORT_DIR,
    test_mode_readiness_certification_manifest_path: TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH,
    test_mode_readiness_certification_artifact_path: TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level3_readiness_phase_count: LEVEL3_READINESS_PHASE_COUNT,
    test_execution_ready: toStatus(testExecutionReady),
    execution_simulation_ready: toStatus(executionSimulationReady),
    production_execution_blocked: toStatus(productionExecutionBlocked),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    readiness_certification_complete: toStatus(readinessCertificationComplete),
    test_mode_ready_for_next_stage: toStatus(testModeReadyForNextStage),
    mock_execution_verified: toStatus(mockExecutionVerified),
    production_still_blocked: toStatus(productionStillBlocked),
    test_execution_not_ready: testExecutionNotReady,
    execution_simulation_not_ready: executionSimulationNotReady,
    dry_run_not_allowed: dryRunNotAllowed,
    test_runtime_package_missing: testRuntimePackageMissing,
    real_generation_detected: realGenerationDetectedFlag,
    production_execution_unblocked: productionExecutionUnblocked,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    traceability_loss: traceabilityLoss,
    memory_binding_loss: memoryBindingLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    test_mode_readiness_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? TEST_MODE_READY_FOR_NEXT_STAGE_STATUS : null,
    phase_readiness_audits: phaseReadinessAudits,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT
      : TEST_MODE_READINESS_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_READINESS_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_READINESS_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
