import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
  GENERATION_PLANNING_ENGINE_PASS_VERDICT,
  GENERATION_PLANNING_ENGINE_REPORT_PATH,
  GENERATION_PLANNING_READY_STATUS,
} from './movieAnalysisGenerationPlanningEngine.js';
import {
  PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH,
  PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT,
  PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
  PRODUCTION_BLUEPRINT_EXPANDED_STATUS,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
} from './movieAnalysisProductionBlueprintExpansion.js';
import {
  PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH,
  PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT,
  PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE,
  PRODUCTION_MEMORY_BINDING_COUNT,
} from './movieAnalysisProductionEngineFoundation.js';
import {
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS,
} from './movieAnalysisProductionEngineIntegrityAudit.js';
import {
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
} from './movieAnalysisProductionEngineMasterCertification.js';
import {
  PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  PRODUCTION_RUNTIME_CERTIFIED_STATUS,
} from './movieAnalysisProductionRuntimeCertification.js';
import {
  PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
  PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
  PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  PRODUCTION_RUNTIME_READY_STATUS,
} from './movieAnalysisProductionRuntimeEngine.js';
import {
  SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
  SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
  SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  SCENE_ASSEMBLY_READY_STATUS,
} from './movieAnalysisSceneAssemblyEngine.js';
import {
  SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
  SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
  SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  SHOT_ASSEMBLY_READY_STATUS,
} from './movieAnalysisShotAssemblyEngine.js';
import {
  TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
  TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
  TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
  SAFE_CREATE_POLICY,
} from './movieAnalysisTestModeExecutionAudit.js';
import {
  EXECUTION_SCOPE,
  TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
  TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  TEST_MODE_EXECUTION_CERTIFIED_STATUS,
} from './movieAnalysisTestModeExecutionCertification.js';
import {
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH,
  TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
  TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
  type TestModeExecutionPackageArtifact,
} from './movieAnalysisTestModeExecutionPackage.js';
import {
  TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH,
  TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
  TEST_MODE_READY_FOR_NEXT_STAGE_STATUS,
} from './movieAnalysisTestModeReadinessCertification.js';
import {
  TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  TEST_MODE_DRY_RUN_MANIFEST_PATH,
  TEST_MODE_DRY_RUN_PASS_VERDICT,
  TEST_MODE_DRY_RUN_REPORT_PATH,
  TEST_MODE_DRY_RUN_COMPLETE_STATUS,
} from './movieAnalysisTestModeDryRun.js';
import {
  TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
} from './movieAnalysisTestModeDryRunCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TEST_MODE_EXECUTION_FINAL_AUDIT_PHASE =
  'PHASE-LEVEL3-016-TEST_MODE_EXECUTION_FINAL_AUDIT_V1' as const;
export const TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_TEST_MODE_EXECUTION_FINAL_AUDIT_V1' as const;
export const TEST_MODE_EXECUTION_FINAL_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_TEST_MODE_EXECUTION_FINAL_AUDIT_V1' as const;
export const TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS =
  'TEST_MODE_EXECUTION_FINAL_AUDITED' as const;
export const LEVEL3_FINAL_STATUS_COMPLETE = 'LEVEL3_TEST_MODE_CHAIN_COMPLETE' as const;
export const NEXT_LEVEL_GATE_LABEL = 'LEVEL4_ENTRY' as const;
export const TEST_MODE_EXECUTION_FINAL_AUDIT_DIR =
  'reports/movie_analysis_test_mode_execution_final_audit' as const;
export const TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH =
  'reports/movie_analysis_test_mode_execution_final_audit/movie-analysis-test-mode-execution-final-audit-report.json' as const;
export const TEST_MODE_EXECUTION_FINAL_AUDIT_MD_PATH =
  'reports/movie_analysis_test_mode_execution_final_audit/MOVIE_ANALYSIS_TEST_MODE_EXECUTION_FINAL_AUDIT.md' as const;
export const TEST_MODE_EXECUTION_FINAL_AUDIT_EXPORT_DIR =
  'exports/movie_analysis_test_mode_execution_final_audit' as const;
export const TEST_MODE_EXECUTION_FINAL_AUDIT_MANIFEST_PATH =
  'exports/movie_analysis_test_mode_execution_final_audit/movie-analysis-test-mode-execution-final-audit-manifest.json' as const;
export const TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH =
  'exports/movie_analysis_test_mode_execution_final_audit/test-mode-execution-final-audit.json' as const;

export const LEVEL3_FINAL_AUDIT_PHASE_COUNT = 15 as const;
export const FINAL_AUDIT_ARTIFACT_WRITE_SCOPE =
  'exports/movie_analysis_test_mode_execution_final_audit/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT, SAFE_CREATE_POLICY };

export type AuditStatus = 'PASS' | 'FAIL';

export type TestModeExecutionFinalAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_level?: string;
  check_id?: string;
};

export type FinalAuditCheck = {
  check_id: string;
  check_label: string;
  status: AuditStatus;
};

export type Level3FinalAuditPhaseAudit = {
  phase_level: string;
  report_path: string;
  manifest_path: string;
  artifact_path: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  phase_certified: boolean;
  manifest_present: boolean;
  manifest_integrity_valid: boolean;
};

export type TestModeExecutionFinalAuditArtifact = {
  audit_id: string;
  phase: typeof TEST_MODE_EXECUTION_FINAL_AUDIT_PHASE;
  generated_at: string;
  level3_final_audit_phase_count: typeof LEVEL3_FINAL_AUDIT_PHASE_COUNT;
  test_mode_dry_run_certification_artifact_path: typeof TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH;
  test_mode_dry_run_certification_manifest_path: typeof TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH;
  final_audit_checks: FinalAuditCheck[];
  phase_final_audits: Level3FinalAuditPhaseAudit[];
  level3_final_status: typeof LEVEL3_FINAL_STATUS_COMPLETE | null;
  next_level_approved: boolean;
  certification_timestamp: string;
  execution_scope: typeof EXECUTION_SCOPE;
  mock_output_only: true;
  real_generation: false;
  production_execution_blocked: true;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    final_audit_artifact_write_scope: typeof FINAL_AUDIT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  final_audit_complete: boolean;
};

export type MovieAnalysisTestModeExecutionFinalAuditManifest = {
  manifest_id: string;
  phase: typeof TEST_MODE_EXECUTION_FINAL_AUDIT_PHASE;
  generated_at: string;
  level3_final_audit_phase_count: typeof LEVEL3_FINAL_AUDIT_PHASE_COUNT;
  level3_chain_complete: AuditStatus;
  dry_run_certified: AuditStatus;
  mock_only_execution_verified: AuditStatus;
  production_block_verified: AuditStatus;
  traceability_chain_complete: AuditStatus;
  manifest_integrity_verified: AuditStatus;
  safe_create_policy_verified: AuditStatus;
  next_level_gate_ready: AuditStatus;
  level3_final_status: typeof LEVEL3_FINAL_STATUS_COMPLETE | null;
  next_level_approved: boolean;
  certification_timestamp: string;
  certification_status: typeof TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS | null;
};

export type MovieAnalysisTestModeExecutionFinalAuditReport = {
  report_id: string;
  phase: typeof TEST_MODE_EXECUTION_FINAL_AUDIT_PHASE;
  timestamp: string;
  certification_timestamp: string;
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
  test_mode_dry_run_certification_report_path: typeof TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH;
  test_mode_dry_run_certification_artifact_path: typeof TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH;
  test_mode_dry_run_certification_manifest_path: typeof TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH;
  test_mode_execution_final_audit_export_dir: typeof TEST_MODE_EXECUTION_FINAL_AUDIT_EXPORT_DIR;
  test_mode_execution_final_audit_manifest_path: typeof TEST_MODE_EXECUTION_FINAL_AUDIT_MANIFEST_PATH;
  test_mode_execution_final_audit_artifact_path: typeof TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  level3_final_audit_phase_count: typeof LEVEL3_FINAL_AUDIT_PHASE_COUNT;
  test_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  mock_output_count: number;
  level3_chain_complete: AuditStatus;
  dry_run_certified: AuditStatus;
  mock_only_execution_verified: AuditStatus;
  production_block_verified: AuditStatus;
  traceability_chain_complete: AuditStatus;
  manifest_integrity_verified: AuditStatus;
  safe_create_policy_verified: AuditStatus;
  next_level_gate_ready: AuditStatus;
  final_audit_complete: AuditStatus;
  level3_final_status: typeof LEVEL3_FINAL_STATUS_COMPLETE | null;
  next_level_approved: boolean;
  next_level_gate_label: typeof NEXT_LEVEL_GATE_LABEL;
  chain_incomplete: boolean;
  dry_run_not_certified: boolean;
  production_unblocked: boolean;
  manifest_integrity_failure: boolean;
  safe_create_policy_violation: boolean;
  next_level_gate_blocked: boolean;
  test_mode_execution_final_audit_ready: AuditStatus;
  certification_status: typeof TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS | null;
  phase_final_audits: Level3FinalAuditPhaseAudit[];
  final_audit_checks: FinalAuditCheck[];
  final_verdict:
    | typeof TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT
    | typeof TEST_MODE_EXECUTION_FINAL_AUDIT_FAIL_VERDICT;
  issues: TestModeExecutionFinalAuditIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type Level3FinalAuditPhaseEntry = {
  phase_level: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  report_path: string;
  manifest_path: string;
  artifact_path: string;
  manifest_shared_fields: string[];
};

const LEVEL3_FINAL_AUDIT_PHASE_ENTRIES: Level3FinalAuditPhaseEntry[] = [
  {
    phase_level: 'L3-001',
    pass_verdict: PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT,
    certification_status: PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE,
    ready_field: 'production_engine_foundation_ready',
    report_path: PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
    manifest_path: PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH,
    artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'L3-002',
    pass_verdict: PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT,
    certification_status: PRODUCTION_BLUEPRINT_EXPANDED_STATUS,
    ready_field: 'production_blueprint_expansion_ready',
    report_path: PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
    manifest_path: PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH,
    artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'L3-003',
    pass_verdict: SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
    certification_status: SCENE_ASSEMBLY_READY_STATUS,
    ready_field: 'scene_assembly_engine_ready',
    report_path: SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
    manifest_path: SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
    artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'L3-004',
    pass_verdict: SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
    certification_status: SHOT_ASSEMBLY_READY_STATUS,
    ready_field: 'shot_assembly_engine_ready',
    report_path: SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
    manifest_path: SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
    artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'L3-005',
    pass_verdict: GENERATION_PLANNING_ENGINE_PASS_VERDICT,
    certification_status: GENERATION_PLANNING_READY_STATUS,
    ready_field: 'generation_planning_engine_ready',
    report_path: GENERATION_PLANNING_ENGINE_REPORT_PATH,
    manifest_path: GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
    artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'L3-006',
    pass_verdict: PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
    certification_status: PRODUCTION_RUNTIME_READY_STATUS,
    ready_field: 'production_runtime_engine_ready',
    report_path: PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
    manifest_path: PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
    artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'L3-007',
    pass_verdict: PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
    certification_status: PRODUCTION_RUNTIME_CERTIFIED_STATUS,
    ready_field: 'production_runtime_certification_ready',
    report_path: PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
    manifest_path: PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
    artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'L3-008',
    pass_verdict: TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
    certification_status: TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
    ready_field: 'test_mode_execution_package_ready',
    report_path: TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
    manifest_path: TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH,
    artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'L3-009',
    pass_verdict: PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT,
    certification_status: PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS,
    ready_field: 'production_engine_integrity_audit_ready',
    report_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
    manifest_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH,
    artifact_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
    manifest_shared_fields: [
      'manifest_consistency_integrity',
      'cross_phase_traceability_valid',
      'certification_status',
    ],
  },
  {
    phase_level: 'L3-010',
    pass_verdict: PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
    certification_status: PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
    ready_field: 'production_engine_master_certification_ready',
    report_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
    manifest_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_MANIFEST_PATH,
    artifact_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'L3-011',
    pass_verdict: TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
    certification_status: TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
    ready_field: 'test_mode_execution_audit_ready',
    report_path: TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
    manifest_path: TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
    artifact_path: TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status', 'mock_output_only', 'real_generation'],
  },
  {
    phase_level: 'L3-012',
    pass_verdict: TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT,
    certification_status: TEST_MODE_READY_FOR_NEXT_STAGE_STATUS,
    ready_field: 'test_mode_readiness_certification_ready',
    report_path: TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
    manifest_path: TEST_MODE_READINESS_CERTIFICATION_MANIFEST_PATH,
    artifact_path: TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status', 'mock_output_only', 'real_generation'],
  },
  {
    phase_level: 'L3-013',
    pass_verdict: TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
    certification_status: TEST_MODE_EXECUTION_CERTIFIED_STATUS,
    ready_field: 'test_mode_execution_certification_ready',
    report_path: TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
    manifest_path: TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
    artifact_path: TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    manifest_shared_fields: [
      'traceability_preserved',
      'certification_status',
      'mock_output_only',
      'real_generation_blocked',
    ],
  },
  {
    phase_level: 'L3-014',
    pass_verdict: TEST_MODE_DRY_RUN_PASS_VERDICT,
    certification_status: TEST_MODE_DRY_RUN_COMPLETE_STATUS,
    ready_field: 'test_mode_dry_run_ready',
    report_path: TEST_MODE_DRY_RUN_REPORT_PATH,
    manifest_path: TEST_MODE_DRY_RUN_MANIFEST_PATH,
    artifact_path: TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status', 'execution_scope'],
  },
  {
    phase_level: 'L3-015',
    pass_verdict: TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
    certification_status: TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
    ready_field: 'test_mode_dry_run_certification_ready',
    report_path: TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
    manifest_path: TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    artifact_path: TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status', 'mock_output_only', 'real_generation'],
  },
];

const READ_ONLY_UPSTREAM_PATHS = LEVEL3_FINAL_AUDIT_PHASE_ENTRIES.map((entry) => entry.artifact_path);

const FINAL_AUDIT_EXPORT_WRITE_PATHS = [
  TEST_MODE_EXECUTION_FINAL_AUDIT_MANIFEST_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  TEST_MODE_EXECUTION_FINAL_AUDIT_DIR,
  TEST_MODE_EXECUTION_FINAL_AUDIT_EXPORT_DIR,
  TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDIT_MD_PATH,
  ...FINAL_AUDIT_EXPORT_WRITE_PATHS,
] as const;

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

function isUnderFinalAuditWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(FINAL_AUDIT_ARTIFACT_WRITE_SCOPE) ||
    relativePath === FINAL_AUDIT_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function reportManifestConsistent(
  report: Record<string, unknown>,
  manifest: Record<string, unknown>,
  sharedFields: string[]
): boolean {
  return sharedFields.every((field) => {
    if (!(field in report) || !(field in manifest)) return false;
    return report[field] === manifest[field];
  });
}

function manifestStructureValid(manifest: Record<string, unknown>): boolean {
  return (
    typeof manifest.manifest_id === 'string' &&
    manifest.manifest_id.length > 0 &&
    typeof manifest.phase === 'string' &&
    manifest.phase.length > 0 &&
    typeof manifest.generated_at === 'string' &&
    manifest.generated_at.length > 0
  );
}

function auditPhaseFinal(
  root: string,
  entry: Level3FinalAuditPhaseEntry
): Level3FinalAuditPhaseAudit {
  const report = loadJson<Record<string, unknown>>(root, entry.report_path);
  const manifest = loadJson<Record<string, unknown>>(root, entry.manifest_path);
  const artifactExists = fs.existsSync(path.join(root, entry.artifact_path));
  const manifestPresent = manifest !== null;
  const manifestIntegrityValid =
    manifestPresent &&
    manifestStructureValid(manifest) &&
    report !== null &&
    reportManifestConsistent(report, manifest, entry.manifest_shared_fields);

  const phaseCertified =
    report !== null &&
    artifactExists &&
    manifestPresent &&
    report.final_verdict === entry.pass_verdict &&
    report.certification_status === entry.certification_status &&
    report[entry.ready_field] === 'PASS';

  return {
    phase_level: entry.phase_level,
    report_path: entry.report_path,
    manifest_path: entry.manifest_path,
    artifact_path: entry.artifact_path,
    pass_verdict: entry.pass_verdict,
    certification_status: entry.certification_status,
    ready_field: entry.ready_field,
    phase_certified: phaseCertified,
    manifest_present: manifestPresent,
    manifest_integrity_valid: manifestIntegrityValid,
  };
}

function buildMarkdown(report: MovieAnalysisTestModeExecutionFinalAuditReport): string {
  const lines = [
    '# Movie Analysis Test Mode Execution Final Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Certification Timestamp:** ${report.certification_timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  if (report.level3_final_status) {
    lines.push(`**Level3 Final Status:** ${report.level3_final_status}`, '');
  }

  lines.push(
    `**Next Level Approved:** ${report.next_level_approved}`,
    `**Next Level Gate:** ${report.next_level_gate_label}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| level3_chain_complete | ${report.level3_chain_complete} |`,
    `| dry_run_certified | ${report.dry_run_certified} |`,
    `| mock_only_execution_verified | ${report.mock_only_execution_verified} |`,
    `| production_block_verified | ${report.production_block_verified} |`,
    `| traceability_chain_complete | ${report.traceability_chain_complete} |`,
    `| manifest_integrity_verified | ${report.manifest_integrity_verified} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| next_level_gate_ready | ${report.next_level_gate_ready} |`,
    `| final_audit_complete | ${report.final_audit_complete} |`,
    '',
    '## Phase Final Audits',
    ''
  );

  for (const audit of report.phase_final_audits) {
    lines.push(
      `- ${audit.phase_level}: certified=${audit.phase_certified} manifest=${audit.manifest_present} manifest_integrity=${audit.manifest_integrity_valid}`
    );
  }

  lines.push('', '## Final Audit Checks', '');
  for (const check of report.final_audit_checks) {
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
  issues: TestModeExecutionFinalAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MovieAnalysisTestModeExecutionFinalAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MovieAnalysisTestModeExecutionFinalAuditReport = {
    report_id: 'movie-analysis-test-mode-execution-final-audit-report-v1',
    phase: TEST_MODE_EXECUTION_FINAL_AUDIT_PHASE,
    timestamp,
    certification_timestamp: timestamp,
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
    test_mode_dry_run_certification_report_path: TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
    test_mode_dry_run_certification_artifact_path: TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    test_mode_dry_run_certification_manifest_path: TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    test_mode_execution_final_audit_export_dir: TEST_MODE_EXECUTION_FINAL_AUDIT_EXPORT_DIR,
    test_mode_execution_final_audit_manifest_path: TEST_MODE_EXECUTION_FINAL_AUDIT_MANIFEST_PATH,
    test_mode_execution_final_audit_artifact_path: TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    level3_final_audit_phase_count: LEVEL3_FINAL_AUDIT_PHASE_COUNT,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    mock_output_count: 0,
    level3_chain_complete: 'FAIL',
    dry_run_certified: 'FAIL',
    mock_only_execution_verified: 'FAIL',
    production_block_verified: 'FAIL',
    traceability_chain_complete: 'FAIL',
    manifest_integrity_verified: 'FAIL',
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_level_gate_ready: 'FAIL',
    final_audit_complete: 'FAIL',
    level3_final_status: null,
    next_level_approved: false,
    next_level_gate_label: NEXT_LEVEL_GATE_LABEL,
    chain_incomplete: true,
    dry_run_not_certified: true,
    production_unblocked: true,
    manifest_integrity_failure: true,
    safe_create_policy_violation: !upstreamUnchanged,
    next_level_gate_blocked: true,
    test_mode_execution_final_audit_ready: 'FAIL',
    certification_status: null,
    phase_final_audits: [],
    final_audit_checks: [],
    final_verdict: TEST_MODE_EXECUTION_FINAL_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_FINAL_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_FINAL_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisTestModeExecutionFinalAudit(
  projectRoot?: string
): MovieAnalysisTestModeExecutionFinalAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TestModeExecutionFinalAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const dryRunCertReport = loadJson<Record<string, unknown>>(
    root,
    TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH
  );
  const dryRunCertArtifactPath = path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH);
  const dryRunCertManifestPath = path.join(root, TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH);

  if (
    !dryRunCertReport ||
    dryRunCertReport.final_verdict !== TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT ||
    dryRunCertReport.certification_status !== TEST_MODE_DRY_RUN_CERTIFIED_STATUS ||
    !fs.existsSync(dryRunCertArtifactPath) ||
    !fs.existsSync(dryRunCertManifestPath)
  ) {
    issues.push({
      code: 'DRY_RUN_CERTIFICATION_PRECHECK_FAILED',
      message: `Required ${TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT} with ${TEST_MODE_DRY_RUN_CERTIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const dryRunCertReportTyped = dryRunCertReport as {
    mock_output_count: number;
    dry_run_certification_complete: AuditStatus;
    mock_execution_verified: AuditStatus;
    production_still_blocked: AuditStatus;
    traceability_preserved: boolean;
    mock_output_only: boolean;
    real_generation: boolean;
  };

  const integrityAuditReport = loadJson<{
    traceability_chain_integrity: AuditStatus;
    cross_phase_traceability_valid: AuditStatus;
    manifest_consistency_integrity: AuditStatus;
  }>(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH);
  const foundationArtifact = loadJson<{
    memory_bindings: Array<{ binding_ready: AuditStatus }>;
  }>(root, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH);
  const runtimeCertArtifact = loadJson<{
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
  }>(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);
  const testPackageArtifact = loadJson<TestModeExecutionPackageArtifact>(
    root,
    TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH
  );

  if (!integrityAuditReport || !foundationArtifact || !runtimeCertArtifact || !testPackageArtifact) {
    issues.push({
      code: 'UPSTREAM_ARTIFACT_MISSING',
      message: 'Missing integrity audit, foundation, runtime certification, or test package artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const phaseFinalAudits = LEVEL3_FINAL_AUDIT_PHASE_ENTRIES.map((entry) =>
    auditPhaseFinal(root, entry)
  );

  for (const audit of phaseFinalAudits) {
    if (!audit.phase_certified) {
      issues.push({
        code: 'PHASE_NOT_CERTIFIED',
        message: `Phase ${audit.phase_level} is not certified`,
        severity: 'error',
        phase_level: audit.phase_level,
      });
    }
    if (!audit.manifest_integrity_valid) {
      issues.push({
        code: 'MANIFEST_INTEGRITY_INVALID',
        message: `Manifest integrity invalid for phase ${audit.phase_level}`,
        severity: 'error',
        phase_level: audit.phase_level,
      });
    }
  }

  const allPhasesCertified = phaseFinalAudits.every((audit) => audit.phase_certified);
  const allManifestsValid = phaseFinalAudits.every((audit) => audit.manifest_integrity_valid);

  const level3ChainComplete = allPhasesCertified;

  const dryRunCertified =
    dryRunCertReport.final_verdict === TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT &&
    dryRunCertReport.certification_status === TEST_MODE_DRY_RUN_CERTIFIED_STATUS &&
    dryRunCertReportTyped.dry_run_certification_complete === 'PASS';

  const mockOnlyExecutionVerified =
    dryRunCertReportTyped.mock_execution_verified === 'PASS' &&
    dryRunCertReportTyped.mock_output_only === true &&
    dryRunCertReportTyped.real_generation === false &&
    testPackageArtifact.test_packages.every(
      (testPackage) =>
        testPackage.test_mode === true &&
        testPackage.production_mode === false &&
        testPackage.external_call_allowed === false &&
        testPackage.gpu_execution_allowed === false
    );

  const productionBlockVerified =
    dryRunCertReportTyped.production_still_blocked === 'PASS' &&
    runtimeCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.real_generation_blocked === true &&
    runtimeCertArtifact.no_external_calls === true &&
    runtimeCertArtifact.no_gpu_execution === true;

  const traceabilityChainComplete =
    integrityAuditReport.traceability_chain_integrity === 'PASS' &&
    integrityAuditReport.cross_phase_traceability_valid === 'PASS' &&
    dryRunCertReportTyped.traceability_preserved === true &&
    testPackageArtifact.test_packages.every(
      (testPackage) => testPackage.traceability_chain.trace_integrity === 'PASS'
    ) &&
    foundationArtifact.memory_bindings.length === PRODUCTION_MEMORY_BINDING_COUNT &&
    foundationArtifact.memory_bindings.every((binding) => binding.binding_ready === 'PASS');

  const manifestIntegrityVerified =
    allManifestsValid &&
    integrityAuditReport.manifest_consistency_integrity === 'PASS';

  const finalAuditWriteScopeValid = FINAL_AUDIT_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderFinalAuditWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && finalAuditWriteScopeValid;

  const nextLevelGateReady =
    level3ChainComplete &&
    dryRunCertified &&
    mockOnlyExecutionVerified &&
    productionBlockVerified &&
    traceabilityChainComplete &&
    manifestIntegrityVerified &&
    safeCreatePolicyVerified;

  const finalAuditComplete = nextLevelGateReady;

  const chainIncomplete = !level3ChainComplete;
  const dryRunNotCertified = !dryRunCertified;
  const productionUnblocked = !productionBlockVerified;
  const manifestIntegrityFailure = !manifestIntegrityVerified;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;
  const nextLevelGateBlocked = !nextLevelGateReady;

  if (chainIncomplete) {
    issues.push({ code: 'CHAIN_INCOMPLETE', message: 'Level3 chain is incomplete', severity: 'error' });
  }
  if (dryRunNotCertified) {
    issues.push({
      code: 'DRY_RUN_NOT_CERTIFIED',
      message: 'Dry run certification is not complete',
      severity: 'error',
    });
  }
  if (productionUnblocked) {
    issues.push({
      code: 'PRODUCTION_UNBLOCKED',
      message: 'Production execution is not blocked',
      severity: 'error',
    });
  }
  if (manifestIntegrityFailure) {
    issues.push({
      code: 'MANIFEST_INTEGRITY_FAILURE',
      message: 'Manifest integrity verification failed',
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
  if (nextLevelGateBlocked) {
    issues.push({
      code: 'NEXT_LEVEL_GATE_BLOCKED',
      message: 'Next level gate is not ready',
      severity: 'error',
    });
  }

  const finalAuditChecks: FinalAuditCheck[] = [
    {
      check_id: 'level3_chain_complete',
      check_label: 'Level3 Chain Complete',
      status: toStatus(level3ChainComplete),
    },
    {
      check_id: 'dry_run_certified',
      check_label: 'Dry Run Certified',
      status: toStatus(dryRunCertified),
    },
    {
      check_id: 'mock_only_execution_verified',
      check_label: 'Mock Only Execution Verified',
      status: toStatus(mockOnlyExecutionVerified),
    },
    {
      check_id: 'production_block_verified',
      check_label: 'Production Block Verified',
      status: toStatus(productionBlockVerified),
    },
    {
      check_id: 'traceability_chain_complete',
      check_label: 'Traceability Chain Complete',
      status: toStatus(traceabilityChainComplete),
    },
    {
      check_id: 'manifest_integrity_verified',
      check_label: 'Manifest Integrity Verified',
      status: toStatus(manifestIntegrityVerified),
    },
    {
      check_id: 'safe_create_policy_verified',
      check_label: 'Safe Create Policy Verified',
      status: toStatus(safeCreatePolicyVerified),
    },
    {
      check_id: 'next_level_gate_ready',
      check_label: 'Next Level Gate Ready',
      status: toStatus(nextLevelGateReady),
    },
  ];

  const pass =
    finalAuditComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: TestModeExecutionFinalAuditArtifact = {
    audit_id: 'test-mode-execution-final-audit-v1',
    phase: TEST_MODE_EXECUTION_FINAL_AUDIT_PHASE,
    generated_at: timestamp,
    level3_final_audit_phase_count: LEVEL3_FINAL_AUDIT_PHASE_COUNT,
    test_mode_dry_run_certification_artifact_path: TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    test_mode_dry_run_certification_manifest_path: TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    final_audit_checks: finalAuditChecks,
    phase_final_audits: phaseFinalAudits,
    level3_final_status: pass ? LEVEL3_FINAL_STATUS_COMPLETE : null,
    next_level_approved: pass,
    certification_timestamp: timestamp,
    execution_scope: EXECUTION_SCOPE,
    mock_output_only: true,
    real_generation: false,
    production_execution_blocked: true,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      final_audit_artifact_write_scope: FINAL_AUDIT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    final_audit_complete: finalAuditComplete,
  };

  const manifest: MovieAnalysisTestModeExecutionFinalAuditManifest = {
    manifest_id: 'movie-analysis-test-mode-execution-final-audit-manifest-v1',
    phase: TEST_MODE_EXECUTION_FINAL_AUDIT_PHASE,
    generated_at: timestamp,
    level3_final_audit_phase_count: LEVEL3_FINAL_AUDIT_PHASE_COUNT,
    level3_chain_complete: toStatus(level3ChainComplete),
    dry_run_certified: toStatus(dryRunCertified),
    mock_only_execution_verified: toStatus(mockOnlyExecutionVerified),
    production_block_verified: toStatus(productionBlockVerified),
    traceability_chain_complete: toStatus(traceabilityChainComplete),
    manifest_integrity_verified: toStatus(manifestIntegrityVerified),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_level_gate_ready: toStatus(nextLevelGateReady),
    level3_final_status: pass ? LEVEL3_FINAL_STATUS_COMPLETE : null,
    next_level_approved: pass,
    certification_timestamp: timestamp,
    certification_status: pass ? TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_FINAL_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_FINAL_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisTestModeExecutionFinalAuditReport = {
    report_id: 'movie-analysis-test-mode-execution-final-audit-report-v1',
    phase: TEST_MODE_EXECUTION_FINAL_AUDIT_PHASE,
    timestamp,
    certification_timestamp: timestamp,
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
    test_mode_dry_run_certification_report_path: TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
    test_mode_dry_run_certification_artifact_path: TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    test_mode_dry_run_certification_manifest_path: TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    test_mode_execution_final_audit_export_dir: TEST_MODE_EXECUTION_FINAL_AUDIT_EXPORT_DIR,
    test_mode_execution_final_audit_manifest_path: TEST_MODE_EXECUTION_FINAL_AUDIT_MANIFEST_PATH,
    test_mode_execution_final_audit_artifact_path: TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level3_final_audit_phase_count: LEVEL3_FINAL_AUDIT_PHASE_COUNT,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    mock_output_count: dryRunCertReportTyped.mock_output_count,
    level3_chain_complete: toStatus(level3ChainComplete),
    dry_run_certified: toStatus(dryRunCertified),
    mock_only_execution_verified: toStatus(mockOnlyExecutionVerified),
    production_block_verified: toStatus(productionBlockVerified),
    traceability_chain_complete: toStatus(traceabilityChainComplete),
    manifest_integrity_verified: toStatus(manifestIntegrityVerified),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_level_gate_ready: toStatus(nextLevelGateReady),
    final_audit_complete: toStatus(finalAuditComplete),
    level3_final_status: pass ? LEVEL3_FINAL_STATUS_COMPLETE : null,
    next_level_approved: pass,
    next_level_gate_label: NEXT_LEVEL_GATE_LABEL,
    chain_incomplete: chainIncomplete,
    dry_run_not_certified: dryRunNotCertified,
    production_unblocked: productionUnblocked,
    manifest_integrity_failure: manifestIntegrityFailure,
    safe_create_policy_violation: safeCreatePolicyViolation,
    next_level_gate_blocked: nextLevelGateBlocked,
    test_mode_execution_final_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS : null,
    phase_final_audits: phaseFinalAudits,
    final_audit_checks: finalAuditChecks,
    final_verdict: pass
      ? TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT
      : TEST_MODE_EXECUTION_FINAL_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_EXECUTION_FINAL_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_EXECUTION_FINAL_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
