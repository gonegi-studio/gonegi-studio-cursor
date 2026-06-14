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
} from './movieAnalysisTestModeExecutionAudit.js';
import {
  EXECUTION_SCOPE,
  TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  TEST_MODE_EXECUTION_CERTIFIED_STATUS,
} from './movieAnalysisTestModeExecutionCertification.js';
import {
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
  TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
} from './movieAnalysisTestModeExecutionPackage.js';
import {
  TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
  TEST_MODE_READY_FOR_NEXT_STAGE_STATUS,
} from './movieAnalysisTestModeReadinessCertification.js';
import {
  MOCK_ARTIFACT_WRITE_SCOPE,
  TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  TEST_MODE_DRY_RUN_MANIFEST_PATH,
  TEST_MODE_DRY_RUN_PASS_VERDICT,
  TEST_MODE_DRY_RUN_REPORT_PATH,
  TEST_MODE_DRY_RUN_COMPLETE_STATUS,
  type TestModeDryRunArtifact,
  type MovieAnalysisTestModeDryRunManifest,
} from './movieAnalysisTestModeDryRun.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TEST_MODE_DRY_RUN_CERTIFICATION_PHASE =
  'PHASE-LEVEL3-015-TEST_MODE_DRY_RUN_CERTIFICATION_V1' as const;
export const TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_TEST_MODE_DRY_RUN_CERTIFICATION_V1' as const;
export const TEST_MODE_DRY_RUN_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_TEST_MODE_DRY_RUN_CERTIFICATION_V1' as const;
export const TEST_MODE_DRY_RUN_CERTIFIED_STATUS = 'TEST_MODE_DRY_RUN_CERTIFIED' as const;
export const TEST_MODE_DRY_RUN_CERTIFICATION_DIR =
  'reports/movie_analysis_test_mode_dry_run_certification' as const;
export const TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_test_mode_dry_run_certification/movie-analysis-test-mode-dry-run-certification-report.json' as const;
export const TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_test_mode_dry_run_certification/MOVIE_ANALYSIS_TEST_MODE_DRY_RUN_CERTIFICATION.md' as const;
export const TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR =
  'exports/movie_analysis_test_mode_dry_run_certification' as const;
export const TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH =
  'exports/movie_analysis_test_mode_dry_run_certification/movie-analysis-test-mode-dry-run-certification-manifest.json' as const;
export const TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH =
  'exports/movie_analysis_test_mode_dry_run_certification/test-mode-dry-run-certification.json' as const;

export const LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT = 14 as const;
export const CERTIFICATION_ARTIFACT_WRITE_SCOPE =
  'exports/movie_analysis_test_mode_dry_run_certification/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT, SAFE_CREATE_POLICY };

export type CertificationStatus = 'PASS' | 'FAIL';

export type TestModeDryRunCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_level?: string;
  check_id?: string;
};

export type DryRunCertificationCheck = {
  check_id: string;
  check_label: string;
  status: CertificationStatus;
};

export type Level3DryRunCertificationPhaseAudit = {
  phase_level: string;
  report_path: string;
  artifact_path: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  phase_certified: boolean;
};

export type TestModeDryRunCertificationArtifact = {
  certification_id: string;
  phase: typeof TEST_MODE_DRY_RUN_CERTIFICATION_PHASE;
  generated_at: string;
  level3_dry_run_certification_phase_count: typeof LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT;
  test_mode_dry_run_artifact_path: typeof TEST_MODE_DRY_RUN_ARTIFACT_PATH;
  test_mode_dry_run_manifest_path: typeof TEST_MODE_DRY_RUN_MANIFEST_PATH;
  certification_checks: DryRunCertificationCheck[];
  phase_certification_audits: Level3DryRunCertificationPhaseAudit[];
  mock_output_count: number;
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
    certification_artifact_write_scope: typeof CERTIFICATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  dry_run_certification_complete: boolean;
  simulation_certified: boolean;
  mock_execution_verified: boolean;
  production_still_blocked: boolean;
};

export type MovieAnalysisTestModeDryRunCertificationManifest = {
  manifest_id: string;
  phase: typeof TEST_MODE_DRY_RUN_CERTIFICATION_PHASE;
  generated_at: string;
  level3_dry_run_certification_phase_count: typeof LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT;
  dry_run_completed: CertificationStatus;
  simulation_completed: CertificationStatus;
  mock_outputs_verified: CertificationStatus;
  dry_run_manifest_verified: CertificationStatus;
  mock_artifact_scope_verified: CertificationStatus;
  mock_output_only: true;
  real_generation: false;
  production_execution_blocked: CertificationStatus;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  traceability_preserved: boolean;
  memory_bindings_preserved: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  dry_run_certification_complete: CertificationStatus;
  simulation_certified: CertificationStatus;
  mock_execution_verified: CertificationStatus;
  production_still_blocked: CertificationStatus;
  certification_status: typeof TEST_MODE_DRY_RUN_CERTIFIED_STATUS | null;
};

export type MovieAnalysisTestModeDryRunCertificationReport = {
  report_id: string;
  phase: typeof TEST_MODE_DRY_RUN_CERTIFICATION_PHASE;
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
  mock_output_only: true;
  real_generation: false;
  test_mode_dry_run_report_path: typeof TEST_MODE_DRY_RUN_REPORT_PATH;
  test_mode_dry_run_artifact_path: typeof TEST_MODE_DRY_RUN_ARTIFACT_PATH;
  test_mode_dry_run_manifest_path: typeof TEST_MODE_DRY_RUN_MANIFEST_PATH;
  test_mode_dry_run_certification_export_dir: typeof TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR;
  test_mode_dry_run_certification_manifest_path: typeof TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH;
  test_mode_dry_run_certification_artifact_path: typeof TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  level3_dry_run_certification_phase_count: typeof LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT;
  test_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  mock_output_count: number;
  dry_run_completed: CertificationStatus;
  simulation_completed: CertificationStatus;
  mock_outputs_verified: CertificationStatus;
  dry_run_manifest_verified: CertificationStatus;
  mock_artifact_scope_verified: CertificationStatus;
  production_execution_blocked: CertificationStatus;
  external_call_blocked: CertificationStatus;
  gpu_execution_blocked: CertificationStatus;
  traceability_preserved: boolean;
  memory_bindings_preserved: CertificationStatus;
  safe_create_policy_verified: CertificationStatus;
  dry_run_certification_complete: CertificationStatus;
  simulation_certified: CertificationStatus;
  mock_execution_verified: CertificationStatus;
  production_still_blocked: CertificationStatus;
  dry_run_incomplete: boolean;
  simulation_failure: boolean;
  mock_output_missing: boolean;
  dry_run_manifest_missing: boolean;
  mock_artifact_scope_violation: boolean;
  real_generation_detected: boolean;
  production_execution_unblocked: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  traceability_loss: boolean;
  memory_binding_loss: boolean;
  safe_create_policy_violation: boolean;
  test_mode_dry_run_certification_ready: CertificationStatus;
  certification_status: typeof TEST_MODE_DRY_RUN_CERTIFIED_STATUS | null;
  phase_certification_audits: Level3DryRunCertificationPhaseAudit[];
  certification_checks: DryRunCertificationCheck[];
  final_verdict:
    | typeof TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT
    | typeof TEST_MODE_DRY_RUN_CERTIFICATION_FAIL_VERDICT;
  issues: TestModeDryRunCertificationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type Level3DryRunCertificationPhaseEntry = {
  phase_level: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  report_path: string;
  artifact_path: string;
};

const LEVEL3_DRY_RUN_CERTIFICATION_PHASE_ENTRIES: Level3DryRunCertificationPhaseEntry[] = [
  {
    phase_level: 'L3-001',
    pass_verdict: PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT,
    certification_status: PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE,
    ready_field: 'production_engine_foundation_ready',
    report_path: PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
    artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-002',
    pass_verdict: PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT,
    certification_status: PRODUCTION_BLUEPRINT_EXPANDED_STATUS,
    ready_field: 'production_blueprint_expansion_ready',
    report_path: PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
    artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-003',
    pass_verdict: SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
    certification_status: SCENE_ASSEMBLY_READY_STATUS,
    ready_field: 'scene_assembly_engine_ready',
    report_path: SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
    artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-004',
    pass_verdict: SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
    certification_status: SHOT_ASSEMBLY_READY_STATUS,
    ready_field: 'shot_assembly_engine_ready',
    report_path: SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
    artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-005',
    pass_verdict: GENERATION_PLANNING_ENGINE_PASS_VERDICT,
    certification_status: GENERATION_PLANNING_READY_STATUS,
    ready_field: 'generation_planning_engine_ready',
    report_path: GENERATION_PLANNING_ENGINE_REPORT_PATH,
    artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-006',
    pass_verdict: PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
    certification_status: PRODUCTION_RUNTIME_READY_STATUS,
    ready_field: 'production_runtime_engine_ready',
    report_path: PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
    artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-007',
    pass_verdict: PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
    certification_status: PRODUCTION_RUNTIME_CERTIFIED_STATUS,
    ready_field: 'production_runtime_certification_ready',
    report_path: PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
    artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-008',
    pass_verdict: TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
    certification_status: TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
    ready_field: 'test_mode_execution_package_ready',
    report_path: TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
    artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-009',
    pass_verdict: PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT,
    certification_status: PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS,
    ready_field: 'production_engine_integrity_audit_ready',
    report_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
    artifact_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-010',
    pass_verdict: PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
    certification_status: PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
    ready_field: 'production_engine_master_certification_ready',
    report_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
    artifact_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-011',
    pass_verdict: TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
    certification_status: TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
    ready_field: 'test_mode_execution_audit_ready',
    report_path: TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
    artifact_path: TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-012',
    pass_verdict: TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT,
    certification_status: TEST_MODE_READY_FOR_NEXT_STAGE_STATUS,
    ready_field: 'test_mode_readiness_certification_ready',
    report_path: TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
    artifact_path: TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-013',
    pass_verdict: TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
    certification_status: TEST_MODE_EXECUTION_CERTIFIED_STATUS,
    ready_field: 'test_mode_execution_certification_ready',
    report_path: TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
    artifact_path: TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  },
  {
    phase_level: 'L3-014',
    pass_verdict: TEST_MODE_DRY_RUN_PASS_VERDICT,
    certification_status: TEST_MODE_DRY_RUN_COMPLETE_STATUS,
    ready_field: 'test_mode_dry_run_ready',
    report_path: TEST_MODE_DRY_RUN_REPORT_PATH,
    artifact_path: TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  },
];

const READ_ONLY_UPSTREAM_PATHS = LEVEL3_DRY_RUN_CERTIFICATION_PHASE_ENTRIES.map(
  (entry) => entry.artifact_path
);

const CERTIFICATION_EXPORT_WRITE_PATHS = [
  TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  TEST_MODE_DRY_RUN_CERTIFICATION_DIR,
  TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR,
  TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH,
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
    relativePath.startsWith(CERTIFICATION_ARTIFACT_WRITE_SCOPE) ||
    relativePath === CERTIFICATION_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function isUnderMockArtifactWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(MOCK_ARTIFACT_WRITE_SCOPE) ||
    relativePath === MOCK_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function auditPhaseCertification(
  root: string,
  entry: Level3DryRunCertificationPhaseEntry
): Level3DryRunCertificationPhaseAudit {
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
    report_path: entry.report_path,
    artifact_path: entry.artifact_path,
    pass_verdict: entry.pass_verdict,
    certification_status: entry.certification_status,
    ready_field: entry.ready_field,
    phase_certified: phaseCertified,
  };
}

function buildMarkdown(report: MovieAnalysisTestModeDryRunCertificationReport): string {
  const lines = [
    '# Movie Analysis Test Mode Dry Run Certification',
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
    `| dry_run_completed | ${report.dry_run_completed} |`,
    `| simulation_completed | ${report.simulation_completed} |`,
    `| mock_outputs_verified | ${report.mock_outputs_verified} |`,
    `| dry_run_manifest_verified | ${report.dry_run_manifest_verified} |`,
    `| mock_artifact_scope_verified | ${report.mock_artifact_scope_verified} |`,
    `| mock_output_only | ${report.mock_output_only} |`,
    `| real_generation | ${report.real_generation} |`,
    `| production_execution_blocked | ${report.production_execution_blocked} |`,
    `| dry_run_certification_complete | ${report.dry_run_certification_complete} |`,
    `| simulation_certified | ${report.simulation_certified} |`,
    `| production_still_blocked | ${report.production_still_blocked} |`,
    '',
    '## Phase Certifications',
    ''
  );

  for (const audit of report.phase_certification_audits) {
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
  issues: TestModeDryRunCertificationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MovieAnalysisTestModeDryRunCertificationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MovieAnalysisTestModeDryRunCertificationReport = {
    report_id: 'movie-analysis-test-mode-dry-run-certification-report-v1',
    phase: TEST_MODE_DRY_RUN_CERTIFICATION_PHASE,
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
    mock_output_only: true,
    real_generation: false,
    test_mode_dry_run_report_path: TEST_MODE_DRY_RUN_REPORT_PATH,
    test_mode_dry_run_artifact_path: TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    test_mode_dry_run_manifest_path: TEST_MODE_DRY_RUN_MANIFEST_PATH,
    test_mode_dry_run_certification_export_dir: TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR,
    test_mode_dry_run_certification_manifest_path: TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    test_mode_dry_run_certification_artifact_path: TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    level3_dry_run_certification_phase_count: LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    mock_output_count: 0,
    dry_run_completed: 'FAIL',
    simulation_completed: 'FAIL',
    mock_outputs_verified: 'FAIL',
    dry_run_manifest_verified: 'FAIL',
    mock_artifact_scope_verified: 'FAIL',
    production_execution_blocked: 'FAIL',
    external_call_blocked: 'FAIL',
    gpu_execution_blocked: 'FAIL',
    traceability_preserved: false,
    memory_bindings_preserved: 'FAIL',
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    dry_run_certification_complete: 'FAIL',
    simulation_certified: 'FAIL',
    mock_execution_verified: 'FAIL',
    production_still_blocked: 'FAIL',
    dry_run_incomplete: true,
    simulation_failure: true,
    mock_output_missing: true,
    dry_run_manifest_missing: true,
    mock_artifact_scope_violation: true,
    real_generation_detected: true,
    production_execution_unblocked: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    traceability_loss: true,
    memory_binding_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    test_mode_dry_run_certification_ready: 'FAIL',
    certification_status: null,
    phase_certification_audits: [],
    certification_checks: [],
    final_verdict: TEST_MODE_DRY_RUN_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisTestModeDryRunCertification(
  projectRoot?: string
): MovieAnalysisTestModeDryRunCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TestModeDryRunCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const dryRunReport = loadJson<Record<string, unknown>>(root, TEST_MODE_DRY_RUN_REPORT_PATH);
  const dryRunArtifactPath = path.join(root, TEST_MODE_DRY_RUN_ARTIFACT_PATH);
  const dryRunManifestPath = path.join(root, TEST_MODE_DRY_RUN_MANIFEST_PATH);

  if (
    !dryRunReport ||
    dryRunReport.final_verdict !== TEST_MODE_DRY_RUN_PASS_VERDICT ||
    dryRunReport.certification_status !== TEST_MODE_DRY_RUN_COMPLETE_STATUS ||
    !fs.existsSync(dryRunArtifactPath) ||
    !fs.existsSync(dryRunManifestPath)
  ) {
    issues.push({
      code: 'DRY_RUN_PRECHECK_FAILED',
      message: `Required ${TEST_MODE_DRY_RUN_PASS_VERDICT} with ${TEST_MODE_DRY_RUN_COMPLETE_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const dryRunArtifact = loadJson<TestModeDryRunArtifact>(root, TEST_MODE_DRY_RUN_ARTIFACT_PATH);
  const dryRunManifest = loadJson<MovieAnalysisTestModeDryRunManifest>(
    root,
    TEST_MODE_DRY_RUN_MANIFEST_PATH
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

  if (!dryRunArtifact || !dryRunManifest || !foundationArtifact || !runtimeCertArtifact) {
    issues.push({
      code: 'UPSTREAM_ARTIFACT_MISSING',
      message: 'Missing dry run artifact, manifest, foundation, or runtime certification artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const phaseCertificationAudits = LEVEL3_DRY_RUN_CERTIFICATION_PHASE_ENTRIES.map((entry) =>
    auditPhaseCertification(root, entry)
  );

  for (const audit of phaseCertificationAudits) {
    if (!audit.phase_certified) {
      issues.push({
        code: 'PHASE_NOT_CERTIFIED',
        message: `Phase ${audit.phase_level} is not certified`,
        severity: 'error',
        phase_level: audit.phase_level,
      });
    }
  }

  const allPhasesCertified = phaseCertificationAudits.every((audit) => audit.phase_certified);

  const dryRunCompleted =
    dryRunArtifact.dry_run_complete === true &&
    dryRunReport.dry_run_complete === 'PASS' &&
    dryRunManifest.dry_run_complete === 'PASS';

  const simulationCompleted =
    dryRunArtifact.simulation_complete === true &&
    dryRunReport.simulation_complete === 'PASS' &&
    dryRunManifest.simulation_complete === 'PASS';

  const mockOutputsVerified =
    dryRunArtifact.mock_output_count > 0 &&
    dryRunManifest.mock_outputs_generated === 'PASS' &&
    dryRunManifest.mock_outputs_present === 'PASS' &&
    dryRunArtifact.package_simulations.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
    dryRunArtifact.package_simulations.every(
      (simulation) =>
        simulation.simulation_ready === 'PASS' &&
        simulation.mock_outputs_generated === simulation.mock_outputs.length &&
        simulation.mock_outputs.every((output) => output.output_ready === 'PASS')
    );

  const dryRunManifestVerified =
    dryRunManifest.dry_run_manifest_present === 'PASS' &&
    dryRunManifest.dry_run_artifact_manifest_required === true &&
    fs.existsSync(dryRunManifestPath);

  const mockArtifactScopeVerified =
    dryRunArtifact.dry_run_policy.mock_artifact_write_scope === MOCK_ARTIFACT_WRITE_SCOPE &&
    dryRunArtifact.safe_create_policy.mock_artifact_write_scope_valid === true &&
    dryRunManifest.mock_artifact_write_scope_valid === 'PASS' &&
    dryRunArtifact.package_simulations.every((simulation) =>
      simulation.mock_outputs.every(
        (output) =>
          isUnderMockArtifactWriteScope(output.mock_image_output_ref) &&
          isUnderMockArtifactWriteScope(output.mock_video_output_ref)
      )
    );

  const mockOutputOnly =
    dryRunArtifact.dry_run_policy.mock_output_only === true &&
    dryRunReport.mock_output_only === true;

  const realGenerationDetected =
    dryRunArtifact.dry_run_policy.real_generation !== false ||
    runtimeCertArtifact.real_generation_blocked !== true;

  const productionExecutionBlocked =
    dryRunArtifact.production_still_blocked === true &&
    dryRunManifest.production_still_blocked === 'PASS' &&
    runtimeCertArtifact.production_mode_blocked === true;

  const externalCallBlocked =
    dryRunArtifact.dry_run_policy.external_call_allowed === false &&
    runtimeCertArtifact.no_external_calls === true;

  const gpuExecutionBlocked =
    dryRunArtifact.dry_run_policy.gpu_execution_allowed === false &&
    runtimeCertArtifact.no_gpu_execution === true;

  const traceabilityPreserved =
    dryRunArtifact.traceability_preserved === true &&
    dryRunManifest.traceability_preserved === true &&
    dryRunArtifact.package_simulations.every(
      (simulation) => simulation.traceability_integrity === 'PASS'
    );

  const memoryBindingsPreserved =
    dryRunArtifact.memory_bindings_preserved === true &&
    dryRunManifest.memory_bindings_preserved === 'PASS' &&
    foundationArtifact.memory_bindings.length === PRODUCTION_MEMORY_BINDING_COUNT &&
    foundationArtifact.memory_bindings.every((binding) => binding.binding_ready === 'PASS');

  const certificationWriteScopeValid = CERTIFICATION_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderCertificationWriteScope(writePath)
  );

  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && certificationWriteScopeValid;

  const mockExecutionVerified = mockOutputsVerified && mockOutputOnly && mockArtifactScopeVerified;
  const simulationCertified = dryRunCompleted && simulationCompleted && mockExecutionVerified;
  const productionStillBlocked = productionExecutionBlocked && !realGenerationDetected;

  const dryRunCertificationComplete =
    allPhasesCertified &&
    dryRunCompleted &&
    simulationCompleted &&
    mockOutputsVerified &&
    dryRunManifestVerified &&
    mockArtifactScopeVerified &&
    mockOutputOnly &&
    !realGenerationDetected &&
    productionExecutionBlocked &&
    externalCallBlocked &&
    gpuExecutionBlocked &&
    traceabilityPreserved &&
    memoryBindingsPreserved &&
    safeCreatePolicyVerified &&
    simulationCertified &&
    productionStillBlocked;

  const dryRunIncomplete = !dryRunCompleted;
  const simulationFailure = !simulationCompleted;
  const mockOutputMissing = !mockOutputsVerified;
  const dryRunManifestMissing = !dryRunManifestVerified;
  const mockArtifactScopeViolation = !mockArtifactScopeVerified;
  const realGenerationDetectedFlag = realGenerationDetected;
  const productionExecutionUnblocked = !productionExecutionBlocked;
  const externalCallEnabled = !externalCallBlocked;
  const gpuExecutionEnabled = !gpuExecutionBlocked;
  const traceabilityLoss = !traceabilityPreserved;
  const memoryBindingLoss = !memoryBindingsPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  if (dryRunIncomplete) {
    issues.push({ code: 'DRY_RUN_INCOMPLETE', message: 'Dry run is incomplete', severity: 'error' });
  }
  if (simulationFailure) {
    issues.push({ code: 'SIMULATION_FAILURE', message: 'Simulation did not complete', severity: 'error' });
  }
  if (mockOutputMissing) {
    issues.push({ code: 'MOCK_OUTPUT_MISSING', message: 'Mock outputs are missing', severity: 'error' });
  }
  if (dryRunManifestMissing) {
    issues.push({
      code: 'DRY_RUN_MANIFEST_MISSING',
      message: 'Dry run manifest is missing or invalid',
      severity: 'error',
    });
  }
  if (mockArtifactScopeViolation) {
    issues.push({
      code: 'MOCK_ARTIFACT_SCOPE_VIOLATION',
      message: 'Mock artifact write scope was violated',
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
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }

  const certificationChecks: DryRunCertificationCheck[] = [
    { check_id: 'dry_run_completed', check_label: 'Dry Run Completed', status: toStatus(dryRunCompleted) },
    {
      check_id: 'simulation_completed',
      check_label: 'Simulation Completed',
      status: toStatus(simulationCompleted),
    },
    {
      check_id: 'mock_outputs_verified',
      check_label: 'Mock Outputs Verified',
      status: toStatus(mockOutputsVerified),
    },
    {
      check_id: 'dry_run_manifest_verified',
      check_label: 'Dry Run Manifest Verified',
      status: toStatus(dryRunManifestVerified),
    },
    {
      check_id: 'mock_artifact_scope_verified',
      check_label: 'Mock Artifact Scope Verified',
      status: toStatus(mockArtifactScopeVerified),
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
  ];

  const pass =
    dryRunCertificationComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: TestModeDryRunCertificationArtifact = {
    certification_id: 'test-mode-dry-run-certification-v1',
    phase: TEST_MODE_DRY_RUN_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level3_dry_run_certification_phase_count: LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT,
    test_mode_dry_run_artifact_path: TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    test_mode_dry_run_manifest_path: TEST_MODE_DRY_RUN_MANIFEST_PATH,
    certification_checks: certificationChecks,
    phase_certification_audits: phaseCertificationAudits,
    mock_output_count: dryRunArtifact.mock_output_count,
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
      certification_artifact_write_scope: CERTIFICATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    dry_run_certification_complete: dryRunCertificationComplete,
    simulation_certified: simulationCertified,
    mock_execution_verified: mockExecutionVerified,
    production_still_blocked: productionStillBlocked,
  };

  const manifest: MovieAnalysisTestModeDryRunCertificationManifest = {
    manifest_id: 'movie-analysis-test-mode-dry-run-certification-manifest-v1',
    phase: TEST_MODE_DRY_RUN_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level3_dry_run_certification_phase_count: LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT,
    dry_run_completed: toStatus(dryRunCompleted),
    simulation_completed: toStatus(simulationCompleted),
    mock_outputs_verified: toStatus(mockOutputsVerified),
    dry_run_manifest_verified: toStatus(dryRunManifestVerified),
    mock_artifact_scope_verified: toStatus(mockArtifactScopeVerified),
    mock_output_only: true,
    real_generation: false,
    production_execution_blocked: toStatus(productionExecutionBlocked),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    dry_run_certification_complete: toStatus(dryRunCertificationComplete),
    simulation_certified: toStatus(simulationCertified),
    mock_execution_verified: toStatus(mockExecutionVerified),
    production_still_blocked: toStatus(productionStillBlocked),
    certification_status: pass ? TEST_MODE_DRY_RUN_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisTestModeDryRunCertificationReport = {
    report_id: 'movie-analysis-test-mode-dry-run-certification-report-v1',
    phase: TEST_MODE_DRY_RUN_CERTIFICATION_PHASE,
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
    mock_output_only: true,
    real_generation: false,
    test_mode_dry_run_report_path: TEST_MODE_DRY_RUN_REPORT_PATH,
    test_mode_dry_run_artifact_path: TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    test_mode_dry_run_manifest_path: TEST_MODE_DRY_RUN_MANIFEST_PATH,
    test_mode_dry_run_certification_export_dir: TEST_MODE_DRY_RUN_CERTIFICATION_EXPORT_DIR,
    test_mode_dry_run_certification_manifest_path: TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    test_mode_dry_run_certification_artifact_path: TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level3_dry_run_certification_phase_count: LEVEL3_DRY_RUN_CERTIFICATION_PHASE_COUNT,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    mock_output_count: dryRunArtifact.mock_output_count,
    dry_run_completed: toStatus(dryRunCompleted),
    simulation_completed: toStatus(simulationCompleted),
    mock_outputs_verified: toStatus(mockOutputsVerified),
    dry_run_manifest_verified: toStatus(dryRunManifestVerified),
    mock_artifact_scope_verified: toStatus(mockArtifactScopeVerified),
    production_execution_blocked: toStatus(productionExecutionBlocked),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    dry_run_certification_complete: toStatus(dryRunCertificationComplete),
    simulation_certified: toStatus(simulationCertified),
    mock_execution_verified: toStatus(mockExecutionVerified),
    production_still_blocked: toStatus(productionStillBlocked),
    dry_run_incomplete: dryRunIncomplete,
    simulation_failure: simulationFailure,
    mock_output_missing: mockOutputMissing,
    dry_run_manifest_missing: dryRunManifestMissing,
    mock_artifact_scope_violation: mockArtifactScopeViolation,
    real_generation_detected: realGenerationDetectedFlag,
    production_execution_unblocked: productionExecutionUnblocked,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    traceability_loss: traceabilityLoss,
    memory_binding_loss: memoryBindingLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    test_mode_dry_run_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? TEST_MODE_DRY_RUN_CERTIFIED_STATUS : null,
    phase_certification_audits: phaseCertificationAudits,
    certification_checks: certificationChecks,
    final_verdict: pass
      ? TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT
      : TEST_MODE_DRY_RUN_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
