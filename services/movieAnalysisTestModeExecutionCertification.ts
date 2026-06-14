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
} from './movieAnalysisTestModeExecutionAudit.js';
import {
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
  TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
  type TestModeExecutionPackageArtifact,
} from './movieAnalysisTestModeExecutionPackage.js';
import {
  TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
  TEST_MODE_READY_FOR_NEXT_STAGE_STATUS,
  SAFE_CREATE_POLICY,
  type TestModeReadinessCertificationArtifact,
} from './movieAnalysisTestModeReadinessCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TEST_MODE_EXECUTION_CERTIFICATION_PHASE =
  'PHASE-LEVEL3-013-TEST_MODE_EXECUTION_CERTIFICATION_V1' as const;
export const TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_TEST_MODE_EXECUTION_CERTIFICATION_V1' as const;
export const TEST_MODE_EXECUTION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_TEST_MODE_EXECUTION_CERTIFICATION_V1' as const;
export const TEST_MODE_EXECUTION_CERTIFIED_STATUS = 'TEST_MODE_EXECUTION_CERTIFIED' as const;
export const TEST_MODE_EXECUTION_CERTIFICATION_DIR =
  'reports/movie_analysis_test_mode_execution_certification' as const;
export const TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_test_mode_execution_certification/movie-analysis-test-mode-execution-certification-report.json' as const;
export const TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_test_mode_execution_certification/MOVIE_ANALYSIS_TEST_MODE_EXECUTION_CERTIFICATION.md' as const;
export const TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR =
  'exports/movie_analysis_test_mode_execution_certification' as const;
export const TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH =
  'exports/movie_analysis_test_mode_execution_certification/movie-analysis-test-mode-execution-certification-manifest.json' as const;
export const TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH =
  'exports/movie_analysis_test_mode_execution_certification/test-mode-execution-certification.json' as const;

export const LEVEL3_EXECUTION_PHASE_COUNT = 12 as const;
export const EXECUTION_SCOPE = 'test_mode_only' as const;
export const ARTIFACT_WRITE_SCOPE =
  'exports/movie_analysis_test_mode_execution_certification/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type TestModeExecutionCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_level?: string;
  check_id?: string;
};

export type ExecutionCertificationCheck = {
  check_id: string;
  check_label: string;
  status: CertificationStatus;
};

export type Level3PhaseExecutionAudit = {
  phase_level: string;
  phase: string;
  report_path: string;
  artifact_path: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  phase_certified: boolean;
};

export type TestModeExecutionCertificationArtifact = {
  certification_id: string;
  phase: typeof TEST_MODE_EXECUTION_CERTIFICATION_PHASE;
  generated_at: string;
  level3_execution_phase_count: typeof LEVEL3_EXECUTION_PHASE_COUNT;
  test_mode_readiness_certification_artifact_path: typeof TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  execution_policy: {
    execution_scope: typeof EXECUTION_SCOPE;
    artifact_write_scope: typeof ARTIFACT_WRITE_SCOPE;
  };
  phase_execution_audits: Level3PhaseExecutionAudit[];
  certification_checks: ExecutionCertificationCheck[];
  dry_run_allowed: boolean;
  test_runtime_package_ready: boolean;
  mock_output_only: true;
  real_generation_blocked: true;
  production_execution_blocked: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  traceability_preserved: boolean;
  memory_bindings_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    artifact_write_scope: typeof ARTIFACT_WRITE_SCOPE;
    artifact_write_scope_valid: boolean;
    upstream_artifacts_unchanged: boolean;
  };
  execution_certification_complete: boolean;
  test_mode_execution_allowed: boolean;
  dry_run_execution_allowed: boolean;
  mock_execution_only: boolean;
  production_still_blocked: boolean;
};

export type MovieAnalysisTestModeExecutionCertificationManifest = {
  manifest_id: string;
  phase: typeof TEST_MODE_EXECUTION_CERTIFICATION_PHASE;
  generated_at: string;
  level3_execution_phase_count: typeof LEVEL3_EXECUTION_PHASE_COUNT;
  execution_scope: typeof EXECUTION_SCOPE;
  artifact_write_scope: typeof ARTIFACT_WRITE_SCOPE;
  readiness_certification_verified: CertificationStatus;
  test_runtime_package_ready: CertificationStatus;
  dry_run_allowed: CertificationStatus;
  mock_output_only: true;
  real_generation_blocked: CertificationStatus;
  production_execution_blocked: CertificationStatus;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  traceability_preserved: boolean;
  memory_bindings_preserved: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  artifact_write_scope_valid: CertificationStatus;
  execution_certification_complete: CertificationStatus;
  test_mode_execution_allowed: CertificationStatus;
  dry_run_execution_allowed: CertificationStatus;
  mock_execution_only: CertificationStatus;
  production_still_blocked: CertificationStatus;
  certification_status: typeof TEST_MODE_EXECUTION_CERTIFIED_STATUS | null;
};

export type MovieAnalysisTestModeExecutionCertificationReport = {
  report_id: string;
  phase: typeof TEST_MODE_EXECUTION_CERTIFICATION_PHASE;
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
  execution_scope: typeof EXECUTION_SCOPE;
  artifact_write_scope: typeof ARTIFACT_WRITE_SCOPE;
  test_mode_readiness_certification_report_path: typeof TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH;
  test_mode_readiness_certification_artifact_path: typeof TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  test_mode_execution_certification_export_dir: typeof TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR;
  test_mode_execution_certification_manifest_path: typeof TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH;
  test_mode_execution_certification_artifact_path: typeof TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  level3_execution_phase_count: typeof LEVEL3_EXECUTION_PHASE_COUNT;
  readiness_certification_verified: CertificationStatus;
  test_runtime_package_ready: CertificationStatus;
  dry_run_allowed: CertificationStatus;
  mock_output_only: true;
  real_generation_blocked: CertificationStatus;
  production_execution_blocked: CertificationStatus;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  traceability_preserved: boolean;
  memory_bindings_preserved: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  artifact_write_scope_valid: CertificationStatus;
  execution_certification_complete: CertificationStatus;
  test_mode_execution_allowed: CertificationStatus;
  dry_run_execution_allowed: CertificationStatus;
  mock_execution_only: CertificationStatus;
  production_still_blocked: CertificationStatus;
  readiness_certification_missing: boolean;
  test_runtime_package_missing: boolean;
  dry_run_not_allowed: boolean;
  mock_output_missing: boolean;
  real_generation_detected: boolean;
  production_execution_unblocked: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  execution_scope_invalid: boolean;
  artifact_write_scope_violation: boolean;
  traceability_loss: boolean;
  memory_binding_loss: boolean;
  safe_create_policy_violation: boolean;
  test_mode_execution_certification_ready: CertificationStatus;
  certification_status: typeof TEST_MODE_EXECUTION_CERTIFIED_STATUS | null;
  phase_execution_audits: Level3PhaseExecutionAudit[];
  certification_checks: ExecutionCertificationCheck[];
  final_verdict:
    | typeof TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT
    | typeof TEST_MODE_EXECUTION_CERTIFICATION_FAIL_VERDICT;
  issues: TestModeExecutionCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type Level3ExecutionPhaseEntry = {
  phase_level: string;
  phase: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  report_path: string;
  artifact_path: string;
};

const LEVEL3_EXECUTION_PHASE_ENTRIES: Level3ExecutionPhaseEntry[] = [
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
  {
    phase_level: 'L3-012',
    phase: 'PHASE-LEVEL3-012-TEST_MODE_READINESS_CERTIFICATION_V1',
    pass_verdict: TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT,
    certification_status: TEST_MODE_READY_FOR_NEXT_STAGE_STATUS,
    ready_field: 'test_mode_readiness_certification_ready',
    report_path: TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
    artifact_path: TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
  },
];

const READ_ONLY_UPSTREAM_PATHS = LEVEL3_EXECUTION_PHASE_ENTRIES.map((entry) => entry.artifact_path);

const EXPORT_WRITE_PATHS = [
  TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
  TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  TEST_MODE_EXECUTION_CERTIFICATION_DIR,
  TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR,
  TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH,
  ...EXPORT_WRITE_PATHS,
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

function isUnderArtifactWriteScope(relativePath: string): boolean {
  return relativePath.startsWith(ARTIFACT_WRITE_SCOPE) || relativePath === ARTIFACT_WRITE_SCOPE.slice(0, -1);
}

function auditPhaseExecution(
  root: string,
  entry: Level3ExecutionPhaseEntry
): Level3PhaseExecutionAudit {
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

function buildMarkdown(report: MovieAnalysisTestModeExecutionCertificationReport): string {
  const lines = [
    '# Movie Analysis Test Mode Execution Certification',
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
    '## Execution Policy',
    '',
    `- execution_scope: ${report.execution_scope}`,
    `- artifact_write_scope: ${report.artifact_write_scope}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| readiness_certification_verified | ${report.readiness_certification_verified} |`,
    `| test_runtime_package_ready | ${report.test_runtime_package_ready} |`,
    `| dry_run_allowed | ${report.dry_run_allowed} |`,
    `| mock_output_only | ${report.mock_output_only} |`,
    `| real_generation_blocked | ${report.real_generation_blocked} |`,
    `| production_execution_blocked | ${report.production_execution_blocked} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| memory_bindings_preserved | ${report.memory_bindings_preserved} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| artifact_write_scope_valid | ${report.artifact_write_scope_valid} |`,
    `| execution_certification_complete | ${report.execution_certification_complete} |`,
    `| test_mode_execution_allowed | ${report.test_mode_execution_allowed} |`,
    `| dry_run_execution_allowed | ${report.dry_run_execution_allowed} |`,
    `| mock_execution_only | ${report.mock_execution_only} |`,
    `| production_still_blocked | ${report.production_still_blocked} |`,
    '',
    '## Phase Certifications',
    ''
  );

  for (const audit of report.phase_execution_audits) {
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
  issues: TestModeExecutionCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MovieAnalysisTestModeExecutionCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MovieAnalysisTestModeExecutionCertificationReport = {
    report_id: 'movie-analysis-test-mode-execution-certification-report-v1',
    phase: TEST_MODE_EXECUTION_CERTIFICATION_PHASE,
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
    execution_scope: EXECUTION_SCOPE,
    artifact_write_scope: ARTIFACT_WRITE_SCOPE,
    test_mode_readiness_certification_report_path: TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
    test_mode_readiness_certification_artifact_path: TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    test_mode_execution_certification_export_dir: TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR,
    test_mode_execution_certification_manifest_path: TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
    test_mode_execution_certification_artifact_path: TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    level3_execution_phase_count: LEVEL3_EXECUTION_PHASE_COUNT,
    readiness_certification_verified: 'FAIL',
    test_runtime_package_ready: 'FAIL',
    dry_run_allowed: 'FAIL',
    mock_output_only: true,
    real_generation_blocked: 'FAIL',
    production_execution_blocked: 'FAIL',
    external_call_blocked: 'FAIL',
    gpu_execution_blocked: 'FAIL',
    traceability_preserved: false,
    memory_bindings_preserved: 'FAIL',
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    artifact_write_scope_valid: 'FAIL',
    execution_certification_complete: 'FAIL',
    test_mode_execution_allowed: 'FAIL',
    dry_run_execution_allowed: 'FAIL',
    mock_execution_only: 'FAIL',
    production_still_blocked: 'FAIL',
    readiness_certification_missing: true,
    test_runtime_package_missing: true,
    dry_run_not_allowed: true,
    mock_output_missing: true,
    real_generation_detected: true,
    production_execution_unblocked: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    execution_scope_invalid: true,
    artifact_write_scope_violation: true,
    traceability_loss: true,
    memory_binding_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    test_mode_execution_certification_ready: 'FAIL',
    certification_status: null,
    phase_execution_audits: [],
    certification_checks: [],
    final_verdict: TEST_MODE_EXECUTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisTestModeExecutionCertification(
  projectRoot?: string
): MovieAnalysisTestModeExecutionCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TestModeExecutionCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const readinessReport = loadJson<Record<string, unknown>>(
    root,
    TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH
  );
  const readinessArtifactPath = path.join(root, TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH);

  if (
    !readinessReport ||
    readinessReport.final_verdict !== TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT ||
    readinessReport.certification_status !== TEST_MODE_READY_FOR_NEXT_STAGE_STATUS ||
    readinessReport.test_mode_ready_for_next_stage !== 'PASS' ||
    !fs.existsSync(readinessArtifactPath)
  ) {
    issues.push({
      code: 'READINESS_CERTIFICATION_MISSING',
      message: `Required ${TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT} with ${TEST_MODE_READY_FOR_NEXT_STAGE_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const readinessArtifact = loadJson<TestModeReadinessCertificationArtifact>(
    root,
    TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH
  );
  const testModeArtifact = loadJson<TestModeExecutionPackageArtifact>(
    root,
    TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH
  );
  const foundationArtifact = loadJson<{
    memory_bindings: Array<{ binding_ready: CertificationStatus }>;
  }>(root, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH);
  const runtimeCertArtifact = loadJson<{
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
  }>(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);

  if (!readinessArtifact || !testModeArtifact || !foundationArtifact || !runtimeCertArtifact) {
    issues.push({
      code: 'UPSTREAM_ARTIFACT_MISSING',
      message: 'Missing readiness certification, test mode package, foundation, or runtime certification artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const phaseExecutionAudits = LEVEL3_EXECUTION_PHASE_ENTRIES.map((entry) =>
    auditPhaseExecution(root, entry)
  );

  for (const audit of phaseExecutionAudits) {
    if (!audit.phase_certified) {
      issues.push({
        code: 'PHASE_NOT_CERTIFIED',
        message: `Phase ${audit.phase_level} is not certified`,
        severity: 'error',
        phase_level: audit.phase_level,
      });
    }
  }

  const allPhasesCertified = phaseExecutionAudits.every((audit) => audit.phase_certified);

  const readinessCertificationVerified =
    readinessArtifact.readiness_certification_complete === true &&
    readinessArtifact.test_mode_ready_for_next_stage === true &&
    readinessReport.test_mode_readiness_certification_ready === 'PASS';

  const testRuntimePackageReady =
    readinessArtifact.test_runtime_package_ready === true &&
    testModeArtifact.test_package_complete === true &&
    testModeArtifact.test_packages.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
    testModeArtifact.test_packages.every((testPackage) => testPackage.test_package_ready === 'PASS');

  const dryRunAllowed =
    readinessArtifact.dry_run_allowed === true &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.dry_run_flags.planning_only === true &&
        testPackage.dry_run_flags.test_mode === true &&
        testPackage.dry_run_flags.no_execution === true &&
        testPackage.dry_run_flags.mock_execution_only === true
    );

  const mockOutputOnly =
    readinessArtifact.mock_output_only === true &&
    testModeArtifact.test_packages.every(
      (testPackage) => testPackage.dry_run_flags.mock_execution_only === true
    ) &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.mock_execution_plan.plan_ready === 'PASS' &&
        testPackage.mock_execution_plan.entries.length > 0
    );

  const realGenerationDetected =
    readinessArtifact.real_generation !== false ||
    runtimeCertArtifact.real_generation_blocked !== true ||
    testModeArtifact.test_packages.some(
      (testPackage) =>
        testPackage.dry_run_flags.image_generation === true ||
        testPackage.dry_run_flags.video_generation === true
    );

  const realGenerationBlocked = !realGenerationDetected;

  const productionExecutionBlocked =
    readinessArtifact.production_execution_blocked === true &&
    readinessArtifact.production_still_blocked === true &&
    runtimeCertArtifact.production_mode_blocked === true &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.production_mode === false && testPackage.dry_run_flags.production_mode === false
    );

  const externalCallBlocked =
    readinessArtifact.external_call_blocked === true &&
    runtimeCertArtifact.no_external_calls === true &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.external_call_allowed === false &&
        testPackage.dry_run_flags.external_call_allowed === false
    );

  const gpuExecutionBlocked =
    readinessArtifact.gpu_execution_blocked === true &&
    runtimeCertArtifact.no_gpu_execution === true &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.gpu_execution_allowed === false &&
        testPackage.dry_run_flags.gpu_execution_allowed === false
    );

  const traceabilityPreserved =
    readinessArtifact.traceability_preserved === true &&
    testModeArtifact.test_packages.every(
      (testPackage) => testPackage.traceability_chain.trace_integrity === 'PASS'
    );

  const memoryBindingsPreserved =
    readinessArtifact.memory_bindings_preserved === true &&
    foundationArtifact.memory_bindings.length === PRODUCTION_MEMORY_BINDING_COUNT &&
    foundationArtifact.memory_bindings.every((binding) => binding.binding_ready === 'PASS');

  const artifactWriteScopeValid = EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderArtifactWriteScope(writePath)
  );

  const executionScopeValid = EXECUTION_SCOPE === 'test_mode_only';

  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && artifactWriteScopeValid;

  const dryRunExecutionAllowed = dryRunAllowed && executionScopeValid;
  const mockExecutionOnly = mockOutputOnly && !realGenerationDetected;
  const testModeExecutionAllowed =
    allPhasesCertified &&
    readinessCertificationVerified &&
    testRuntimePackageReady &&
    dryRunExecutionAllowed &&
    mockExecutionOnly &&
    productionExecutionBlocked;

  const productionStillBlocked = productionExecutionBlocked && realGenerationBlocked;

  const executionCertificationComplete =
    testModeExecutionAllowed &&
    externalCallBlocked &&
    gpuExecutionBlocked &&
    traceabilityPreserved &&
    memoryBindingsPreserved &&
    safeCreatePolicyVerified &&
    executionScopeValid &&
    artifactWriteScopeValid &&
    productionStillBlocked;

  const readinessCertificationMissing = !readinessCertificationVerified;
  const testRuntimePackageMissing = !testRuntimePackageReady;
  const dryRunNotAllowed = !dryRunAllowed;
  const mockOutputMissing = !mockOutputOnly;
  const realGenerationDetectedFlag = realGenerationDetected;
  const productionExecutionUnblocked = !productionExecutionBlocked;
  const externalCallEnabled = !externalCallBlocked;
  const gpuExecutionEnabled = !gpuExecutionBlocked;
  const executionScopeInvalid = !executionScopeValid;
  const artifactWriteScopeViolation = !artifactWriteScopeValid;
  const traceabilityLoss = !traceabilityPreserved;
  const memoryBindingLoss = !memoryBindingsPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  if (readinessCertificationMissing) {
    issues.push({
      code: 'READINESS_CERTIFICATION_MISSING',
      message: 'Readiness certification is not verified',
      severity: 'error',
    });
  }
  if (testRuntimePackageMissing) {
    issues.push({
      code: 'TEST_RUNTIME_PACKAGE_MISSING',
      message: 'Test runtime package is missing or incomplete',
      severity: 'error',
    });
  }
  if (dryRunNotAllowed) {
    issues.push({ code: 'DRY_RUN_NOT_ALLOWED', message: 'Dry run is not allowed', severity: 'error' });
  }
  if (mockOutputMissing) {
    issues.push({ code: 'MOCK_OUTPUT_MISSING', message: 'Mock output plan is missing', severity: 'error' });
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
  if (executionScopeInvalid) {
    issues.push({
      code: 'EXECUTION_SCOPE_INVALID',
      message: 'Execution scope is not test_mode_only',
      severity: 'error',
    });
  }
  if (artifactWriteScopeViolation) {
    issues.push({
      code: 'ARTIFACT_WRITE_SCOPE_VIOLATION',
      message: 'Artifact write scope was violated',
      severity: 'error',
    });
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
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }

  const certificationChecks: ExecutionCertificationCheck[] = [
    {
      check_id: 'readiness_certification_verified',
      check_label: 'Readiness Certification Verified',
      status: toStatus(readinessCertificationVerified),
    },
    {
      check_id: 'test_runtime_package_ready',
      check_label: 'Test Runtime Package Ready',
      status: toStatus(testRuntimePackageReady),
    },
    { check_id: 'dry_run_allowed', check_label: 'Dry Run Allowed', status: toStatus(dryRunAllowed) },
    { check_id: 'mock_output_only', check_label: 'Mock Output Only', status: toStatus(mockOutputOnly) },
    {
      check_id: 'real_generation_blocked',
      check_label: 'Real Generation Blocked',
      status: toStatus(realGenerationBlocked),
    },
    {
      check_id: 'production_execution_blocked',
      check_label: 'Production Execution Blocked',
      status: toStatus(productionExecutionBlocked),
    },
    {
      check_id: 'external_call_blocked',
      check_label: 'External Call Blocked',
      status: toStatus(externalCallBlocked),
    },
    {
      check_id: 'gpu_execution_blocked',
      check_label: 'GPU Execution Blocked',
      status: toStatus(gpuExecutionBlocked),
    },
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
    {
      check_id: 'execution_scope',
      check_label: 'Execution Scope',
      status: toStatus(executionScopeValid),
    },
    {
      check_id: 'artifact_write_scope_valid',
      check_label: 'Artifact Write Scope Valid',
      status: toStatus(artifactWriteScopeValid),
    },
  ];

  const pass =
    executionCertificationComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: TestModeExecutionCertificationArtifact = {
    certification_id: 'test-mode-execution-certification-v1',
    phase: TEST_MODE_EXECUTION_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level3_execution_phase_count: LEVEL3_EXECUTION_PHASE_COUNT,
    test_mode_readiness_certification_artifact_path: TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    execution_policy: {
      execution_scope: EXECUTION_SCOPE,
      artifact_write_scope: ARTIFACT_WRITE_SCOPE,
    },
    phase_execution_audits: phaseExecutionAudits,
    certification_checks: certificationChecks,
    dry_run_allowed: dryRunAllowed,
    test_runtime_package_ready: testRuntimePackageReady,
    mock_output_only: true,
    real_generation_blocked: true,
    production_execution_blocked: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: memoryBindingsPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      artifact_write_scope: ARTIFACT_WRITE_SCOPE,
      artifact_write_scope_valid: artifactWriteScopeValid,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    execution_certification_complete: executionCertificationComplete,
    test_mode_execution_allowed: testModeExecutionAllowed,
    dry_run_execution_allowed: dryRunExecutionAllowed,
    mock_execution_only: mockExecutionOnly,
    production_still_blocked: productionStillBlocked,
  };

  const manifest: MovieAnalysisTestModeExecutionCertificationManifest = {
    manifest_id: 'movie-analysis-test-mode-execution-certification-manifest-v1',
    phase: TEST_MODE_EXECUTION_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level3_execution_phase_count: LEVEL3_EXECUTION_PHASE_COUNT,
    execution_scope: EXECUTION_SCOPE,
    artifact_write_scope: ARTIFACT_WRITE_SCOPE,
    readiness_certification_verified: toStatus(readinessCertificationVerified),
    test_runtime_package_ready: toStatus(testRuntimePackageReady),
    dry_run_allowed: toStatus(dryRunAllowed),
    mock_output_only: true,
    real_generation_blocked: toStatus(realGenerationBlocked),
    production_execution_blocked: toStatus(productionExecutionBlocked),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    artifact_write_scope_valid: toStatus(artifactWriteScopeValid),
    execution_certification_complete: toStatus(executionCertificationComplete),
    test_mode_execution_allowed: toStatus(testModeExecutionAllowed),
    dry_run_execution_allowed: toStatus(dryRunExecutionAllowed),
    mock_execution_only: toStatus(mockExecutionOnly),
    production_still_blocked: toStatus(productionStillBlocked),
    certification_status: pass ? TEST_MODE_EXECUTION_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisTestModeExecutionCertificationReport = {
    report_id: 'movie-analysis-test-mode-execution-certification-report-v1',
    phase: TEST_MODE_EXECUTION_CERTIFICATION_PHASE,
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
    execution_scope: EXECUTION_SCOPE,
    artifact_write_scope: ARTIFACT_WRITE_SCOPE,
    test_mode_readiness_certification_report_path: TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
    test_mode_readiness_certification_artifact_path: TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    test_mode_execution_certification_export_dir: TEST_MODE_EXECUTION_CERTIFICATION_EXPORT_DIR,
    test_mode_execution_certification_manifest_path: TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
    test_mode_execution_certification_artifact_path: TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level3_execution_phase_count: LEVEL3_EXECUTION_PHASE_COUNT,
    readiness_certification_verified: toStatus(readinessCertificationVerified),
    test_runtime_package_ready: toStatus(testRuntimePackageReady),
    dry_run_allowed: toStatus(dryRunAllowed),
    mock_output_only: true,
    real_generation_blocked: toStatus(realGenerationBlocked),
    production_execution_blocked: toStatus(productionExecutionBlocked),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    artifact_write_scope_valid: toStatus(artifactWriteScopeValid),
    execution_certification_complete: toStatus(executionCertificationComplete),
    test_mode_execution_allowed: toStatus(testModeExecutionAllowed),
    dry_run_execution_allowed: toStatus(dryRunExecutionAllowed),
    mock_execution_only: toStatus(mockExecutionOnly),
    production_still_blocked: toStatus(productionStillBlocked),
    readiness_certification_missing: readinessCertificationMissing,
    test_runtime_package_missing: testRuntimePackageMissing,
    dry_run_not_allowed: dryRunNotAllowed,
    mock_output_missing: mockOutputMissing,
    real_generation_detected: realGenerationDetectedFlag,
    production_execution_unblocked: productionExecutionUnblocked,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    execution_scope_invalid: executionScopeInvalid,
    artifact_write_scope_violation: artifactWriteScopeViolation,
    traceability_loss: traceabilityLoss,
    memory_binding_loss: memoryBindingLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    test_mode_execution_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? TEST_MODE_EXECUTION_CERTIFIED_STATUS : null,
    phase_execution_audits: phaseExecutionAudits,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT
      : TEST_MODE_EXECUTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
