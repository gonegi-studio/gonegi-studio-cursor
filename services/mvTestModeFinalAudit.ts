import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
  MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT,
  MV_GENERATION_PLANNING_ENGINE_REPORT_PATH,
  MV_GENERATION_PLANNING_READY_STATUS,
} from './mvGenerationPlanningEngine.js';
import {
  MV_PRODUCTION_BLUEPRINT_READY_STATUS,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH,
} from './mvProductionBlueprintSystem.js';
import {
  MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS,
  type MvProductionRuntimeCertificationArtifact,
} from './mvProductionRuntimeCertification.js';
import {
  MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
  MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
  MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_READY_STATUS,
  type MvRuntimeTraceability,
} from './mvProductionRuntimeEngine.js';
import {
  MV_PRODUCTION_FOUNDATION_READY_STATUS,
  MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
  MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH,
  MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT,
  MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH,
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
} from './mvProductionSystemFoundation.js';
import {
  MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
  MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
  MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SCENE_ASSEMBLY_READY_STATUS,
} from './mvSceneAssemblyEngine.js';
import {
  MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
  MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
  MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SHOT_ASSEMBLY_READY_STATUS,
} from './mvShotAssemblyEngine.js';
import {
  MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
  MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH,
  MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT,
  MV_TEST_EXECUTION_PACKAGE_REPORT_PATH,
  MV_TEST_EXECUTION_PACKAGE_READY_STATUS,
  type MvTestExecutionPackageArtifact,
} from './mvTestExecutionPackage.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
  MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
} from './mvTestModeExecutionAudit.js';
import {
  MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
  MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS,
} from './mvTestModeExecutionCertification.js';
import {
  DRY_RUN_SCOPE_FULL_MV_CHAIN,
  EXPECTED_MOCK_SIMULATION_STEP_COUNT,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
  type MvTestModeDryRunCertificationArtifact,
} from './mvTestModeDryRunCertification.js';
import {
  MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_PASS_VERDICT,
  MV_TEST_MODE_DRY_RUN_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_READY_STATUS,
} from './mvTestModeDryRun.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_TEST_MODE_FINAL_AUDIT_PHASE =
  'PHASE-DIGITAL-STUDIO-013-MV_TEST_MODE_FINAL_AUDIT_V1' as const;
export const MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT = 'PASS_MV_TEST_MODE_FINAL_AUDIT_V1' as const;
export const MV_TEST_MODE_FINAL_AUDIT_FAIL_VERDICT = 'FAIL_MV_TEST_MODE_FINAL_AUDIT_V1' as const;
export const MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS =
  'MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS-014_ENTRY' as const;
export const MV_TEST_MODE_FINAL_AUDIT_DIR = 'reports/mv_test_mode_final_audit' as const;
export const MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH =
  'reports/mv_test_mode_final_audit/mv-test-mode-final-audit-report.json' as const;
export const MV_TEST_MODE_FINAL_AUDIT_MD_PATH =
  'reports/mv_test_mode_final_audit/MV_TEST_MODE_FINAL_AUDIT.md' as const;
export const MV_TEST_MODE_FINAL_AUDIT_EXPORT_DIR = 'exports/mv_test_mode_final_audit' as const;
export const MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH =
  'exports/mv_test_mode_final_audit/mv-test-mode-final-audit-manifest.json' as const;
export const MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH =
  'exports/mv_test_mode_final_audit/mv-test-mode-final-audit.json' as const;

export const DIGITAL_STUDIO_CHAIN_PHASE_COUNT = 13 as const;
export const DIGITAL_STUDIO_AUDITED_PHASE_COUNT = 12 as const;
export const FINAL_AUDIT_ARTIFACT_WRITE_SCOPE = 'exports/mv_test_mode_final_audit/' as const;
export const AUDIT_SCOPE_DIGITAL_STUDIO_MV_TEST_CHAIN = 'digital_studio_mv_test_chain' as const;
export const AUDIT_SUMMARY_TEXT =
  'Digital Studio MV Test Chain DS-001 through DS-012 final audit with full_mv_chain dry run certification closure' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type AuditStatus = 'PASS' | 'FAIL';

export type MvTestModeFinalAuditIssue = {
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

export type DigitalStudioFinalAuditPhaseAudit = {
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

export type MvTestModeFinalAuditArtifact = {
  final_audit_id: string;
  phase: typeof MV_TEST_MODE_FINAL_AUDIT_PHASE;
  generated_at: string;
  audit_timestamp: string;
  source_dry_run_certification_ref: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH;
  audit_scope: typeof AUDIT_SCOPE_DIGITAL_STUDIO_MV_TEST_CHAIN;
  audit_summary: typeof AUDIT_SUMMARY_TEXT;
  chain_phase_count: typeof DIGITAL_STUDIO_CHAIN_PHASE_COUNT;
  mock_simulation_step_count: typeof EXPECTED_MOCK_SIMULATION_STEP_COUNT;
  dry_run_scope: typeof DRY_RUN_SCOPE_FULL_MV_CHAIN;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
  runtime_certification_chain_verified: boolean;
  traceability_chain: MvRuntimeTraceability[];
  safe_create_policy_verified: boolean;
  final_audit_allowed: boolean;
  next_stage_gate_ready: boolean;
  digital_studio_test_chain_complete: boolean;
  final_audit_checks: FinalAuditCheck[];
  phase_final_audits: DigitalStudioFinalAuditPhaseAudit[];
  mock_output_only: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  production_mode_blocked: true;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    final_audit_artifact_write_scope: typeof FINAL_AUDIT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  final_audit_complete: boolean;
};

export type MvTestModeFinalAuditManifest = {
  manifest_id: string;
  phase: typeof MV_TEST_MODE_FINAL_AUDIT_PHASE;
  generated_at: string;
  audit_timestamp: string;
  chain_phase_count: typeof DIGITAL_STUDIO_CHAIN_PHASE_COUNT;
  dry_run_scope: typeof DRY_RUN_SCOPE_FULL_MV_CHAIN;
  mock_simulation_step_count: typeof EXPECTED_MOCK_SIMULATION_STEP_COUNT;
  digital_studio_test_chain_complete: AuditStatus;
  runtime_certification_chain_verified: AuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: AuditStatus;
  next_stage_gate_ready: AuditStatus;
  certification_status: typeof MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS | null;
};

export type MvTestModeFinalAuditReport = {
  report_id: string;
  phase: typeof MV_TEST_MODE_FINAL_AUDIT_PHASE;
  timestamp: string;
  audit_timestamp: string;
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
  mock_output_only: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  production_mode_blocked: true;
  source_dry_run_certification_ref: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH;
  mv_test_mode_dry_run_certification_report_path: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH;
  mv_test_mode_dry_run_certification_manifest_path: typeof MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH;
  mv_test_mode_final_audit_export_dir: typeof MV_TEST_MODE_FINAL_AUDIT_EXPORT_DIR;
  mv_test_mode_final_audit_manifest_path: typeof MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH;
  mv_test_mode_final_audit_artifact_path: typeof MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH;
  final_audit_id: string;
  audit_scope: typeof AUDIT_SCOPE_DIGITAL_STUDIO_MV_TEST_CHAIN;
  audit_summary: typeof AUDIT_SUMMARY_TEXT;
  source_count: number;
  adapter_count: number;
  chain_phase_count: typeof DIGITAL_STUDIO_CHAIN_PHASE_COUNT;
  mock_simulation_step_count: typeof EXPECTED_MOCK_SIMULATION_STEP_COUNT;
  dry_run_scope: typeof DRY_RUN_SCOPE_FULL_MV_CHAIN;
  runtime_certification_chain_verified: AuditStatus;
  traceability_chain: MvRuntimeTraceability[];
  dry_run_certification_consumed: AuditStatus;
  final_audit_completed: AuditStatus;
  chain_phase_count_valid: AuditStatus;
  mock_simulation_step_count_valid: AuditStatus;
  dry_run_scope_valid: AuditStatus;
  runtime_certification_chain_complete: AuditStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: AuditStatus;
  test_mode_allowed: AuditStatus;
  real_generation_blocked_status: AuditStatus;
  runtime_not_executed_status: AuditStatus;
  external_call_blocked_status: AuditStatus;
  gpu_execution_blocked_status: AuditStatus;
  production_mode_blocked_status: AuditStatus;
  next_stage_gate_ready: AuditStatus;
  digital_studio_test_chain_complete: AuditStatus;
  final_audit_allowed: AuditStatus;
  dry_run_certification_missing: boolean;
  final_audit_failed: boolean;
  chain_phase_count_invalid: boolean;
  mock_simulation_step_count_invalid: boolean;
  dry_run_scope_invalid: boolean;
  runtime_certification_chain_broken: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  test_mode_disabled: boolean;
  real_generation_enabled: boolean;
  runtime_execution_detected: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  production_mode_unblocked: boolean;
  next_stage_gate_blocked: boolean;
  mv_test_mode_final_audit_ready: AuditStatus;
  certification_status: typeof MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS | null;
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  next_stage_approved: boolean;
  phase_final_audits: DigitalStudioFinalAuditPhaseAudit[];
  final_audit_checks: FinalAuditCheck[];
  final_verdict:
    | typeof MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT
    | typeof MV_TEST_MODE_FINAL_AUDIT_FAIL_VERDICT;
  issues: MvTestModeFinalAuditIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type DigitalStudioChainPhaseEntry = {
  phase_level: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  report_path: string;
  manifest_path: string;
  artifact_path: string;
  manifest_shared_fields: string[];
};

const DIGITAL_STUDIO_CHAIN_PHASE_ENTRIES: DigitalStudioChainPhaseEntry[] = [
  {
    phase_level: 'DS-001',
    pass_verdict: MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT,
    certification_status: MV_PRODUCTION_FOUNDATION_READY_STATUS,
    ready_field: 'mv_production_system_foundation_ready',
    report_path: MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH,
    manifest_path: MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH,
    artifact_path: MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'DS-002',
    pass_verdict: MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT,
    certification_status: MV_PRODUCTION_BLUEPRINT_READY_STATUS,
    ready_field: 'mv_production_blueprint_system_ready',
    report_path: MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH,
    manifest_path: MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH,
    artifact_path: MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'DS-003',
    pass_verdict: MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
    certification_status: MV_SCENE_ASSEMBLY_READY_STATUS,
    ready_field: 'mv_scene_assembly_engine_ready',
    report_path: MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
    manifest_path: MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
    artifact_path: MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'DS-004',
    pass_verdict: MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
    certification_status: MV_SHOT_ASSEMBLY_READY_STATUS,
    ready_field: 'mv_shot_assembly_engine_ready',
    report_path: MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
    manifest_path: MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
    artifact_path: MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'DS-005',
    pass_verdict: MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT,
    certification_status: MV_GENERATION_PLANNING_READY_STATUS,
    ready_field: 'mv_generation_planning_engine_ready',
    report_path: MV_GENERATION_PLANNING_ENGINE_REPORT_PATH,
    manifest_path: MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
    artifact_path: MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'DS-006',
    pass_verdict: MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
    certification_status: MV_PRODUCTION_RUNTIME_READY_STATUS,
    ready_field: 'mv_production_runtime_engine_ready',
    report_path: MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
    manifest_path: MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
    artifact_path: MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'DS-007',
    pass_verdict: MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
    certification_status: MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS,
    ready_field: 'mv_production_runtime_certification_ready',
    report_path: MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
    manifest_path: MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
    artifact_path: MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'DS-008',
    pass_verdict: MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT,
    certification_status: MV_TEST_EXECUTION_PACKAGE_READY_STATUS,
    ready_field: 'mv_test_execution_package_engine_ready',
    report_path: MV_TEST_EXECUTION_PACKAGE_REPORT_PATH,
    manifest_path: MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH,
    artifact_path: MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'DS-009',
    pass_verdict: MV_TEST_MODE_EXECUTION_AUDIT_PASS_VERDICT,
    certification_status: MV_TEST_MODE_EXECUTION_AUDIT_READY_STATUS,
    ready_field: 'mv_test_mode_execution_audit_ready',
    report_path: MV_TEST_MODE_EXECUTION_AUDIT_REPORT_PATH,
    manifest_path: MV_TEST_MODE_EXECUTION_AUDIT_MANIFEST_PATH,
    artifact_path: MV_TEST_MODE_EXECUTION_AUDIT_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status', 'mock_output_only', 'real_generation_blocked'],
  },
  {
    phase_level: 'DS-010',
    pass_verdict: MV_TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
    certification_status: MV_TEST_MODE_EXECUTION_CERTIFIED_STATUS,
    ready_field: 'mv_test_mode_execution_certification_ready',
    report_path: MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
    manifest_path: MV_TEST_MODE_EXECUTION_CERTIFICATION_MANIFEST_PATH,
    artifact_path: MV_TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status', 'real_generation_blocked'],
  },
  {
    phase_level: 'DS-011',
    pass_verdict: MV_TEST_MODE_DRY_RUN_PASS_VERDICT,
    certification_status: MV_TEST_MODE_DRY_RUN_READY_STATUS,
    ready_field: 'mv_test_mode_dry_run_ready',
    report_path: MV_TEST_MODE_DRY_RUN_REPORT_PATH,
    manifest_path: MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
    artifact_path: MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
  {
    phase_level: 'DS-012',
    pass_verdict: MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
    certification_status: MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
    ready_field: 'mv_test_mode_dry_run_certification_ready',
    report_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
    manifest_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    artifact_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status'],
  },
];

const READ_ONLY_UPSTREAM_PATHS = [
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  ...DIGITAL_STUDIO_CHAIN_PHASE_ENTRIES.map((entry) => entry.artifact_path),
];

const FINAL_AUDIT_EXPORT_WRITE_PATHS = [
  MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH,
  MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_TEST_MODE_FINAL_AUDIT_DIR,
  MV_TEST_MODE_FINAL_AUDIT_EXPORT_DIR,
  MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH,
  MV_TEST_MODE_FINAL_AUDIT_MD_PATH,
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
  entry: DigitalStudioChainPhaseEntry
): DigitalStudioFinalAuditPhaseAudit {
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

function buildMarkdown(report: MvTestModeFinalAuditReport): string {
  const lines = [
    '# MV Test Mode Final Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Audit Timestamp:** ${report.audit_timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    `**Next Stage Approved:** ${report.next_stage_approved}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
    `**Chain Phase Count:** ${report.chain_phase_count}`,
    `**Dry Run Scope:** ${report.dry_run_scope}`,
    `**Mock Simulation Steps:** ${report.mock_simulation_step_count}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| dry_run_certification_consumed | ${report.dry_run_certification_consumed} |`,
    `| final_audit_completed | ${report.final_audit_completed} |`,
    `| chain_phase_count_valid | ${report.chain_phase_count_valid} |`,
    `| mock_simulation_step_count_valid | ${report.mock_simulation_step_count_valid} |`,
    `| dry_run_scope_valid | ${report.dry_run_scope_valid} |`,
    `| runtime_certification_chain_complete | ${report.runtime_certification_chain_complete} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| test_mode_allowed | ${report.test_mode_allowed} |`,
    `| real_generation_blocked | ${report.real_generation_blocked_status} |`,
    `| runtime_not_executed | ${report.runtime_not_executed_status} |`,
    `| external_call_blocked | ${report.external_call_blocked_status} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked_status} |`,
    `| production_mode_blocked | ${report.production_mode_blocked_status} |`,
    `| next_stage_gate_ready | ${report.next_stage_gate_ready} |`,
    `| digital_studio_test_chain_complete | ${report.digital_studio_test_chain_complete} |`,
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
  issues: MvTestModeFinalAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvTestModeFinalAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvTestModeFinalAuditReport = {
    report_id: 'mv-test-mode-final-audit-report-v1',
    phase: MV_TEST_MODE_FINAL_AUDIT_PHASE,
    timestamp,
    audit_timestamp: timestamp,
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
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    source_dry_run_certification_ref: MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    mv_test_mode_dry_run_certification_report_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
    mv_test_mode_dry_run_certification_manifest_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    mv_test_mode_final_audit_export_dir: MV_TEST_MODE_FINAL_AUDIT_EXPORT_DIR,
    mv_test_mode_final_audit_manifest_path: MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH,
    mv_test_mode_final_audit_artifact_path: MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
    final_audit_id: 'mv-test-mode-final-audit-v1',
    audit_scope: AUDIT_SCOPE_DIGITAL_STUDIO_MV_TEST_CHAIN,
    audit_summary: AUDIT_SUMMARY_TEXT,
    source_count: 0,
    adapter_count: 0,
    chain_phase_count: DIGITAL_STUDIO_CHAIN_PHASE_COUNT,
    mock_simulation_step_count: EXPECTED_MOCK_SIMULATION_STEP_COUNT,
    dry_run_scope: DRY_RUN_SCOPE_FULL_MV_CHAIN,
    runtime_certification_chain_verified: 'FAIL',
    traceability_chain: [],
    dry_run_certification_consumed: 'FAIL',
    final_audit_completed: 'FAIL',
    chain_phase_count_valid: 'FAIL',
    mock_simulation_step_count_valid: 'FAIL',
    dry_run_scope_valid: 'FAIL',
    runtime_certification_chain_complete: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    test_mode_allowed: 'FAIL',
    real_generation_blocked_status: 'FAIL',
    runtime_not_executed_status: 'FAIL',
    external_call_blocked_status: 'FAIL',
    gpu_execution_blocked_status: 'FAIL',
    production_mode_blocked_status: 'FAIL',
    next_stage_gate_ready: 'FAIL',
    digital_studio_test_chain_complete: 'FAIL',
    final_audit_allowed: 'FAIL',
    dry_run_certification_missing: true,
    final_audit_failed: true,
    chain_phase_count_invalid: true,
    mock_simulation_step_count_invalid: true,
    dry_run_scope_invalid: true,
    runtime_certification_chain_broken: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    test_mode_disabled: true,
    real_generation_enabled: true,
    runtime_execution_detected: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    production_mode_unblocked: true,
    next_stage_gate_blocked: true,
    mv_test_mode_final_audit_ready: 'FAIL',
    certification_status: null,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    next_stage_approved: false,
    phase_final_audits: [],
    final_audit_checks: [],
    final_verdict: MV_TEST_MODE_FINAL_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_FINAL_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_FINAL_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvTestModeFinalAudit(projectRoot?: string): MvTestModeFinalAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvTestModeFinalAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const dryRunCertReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    dry_run_consumed: AuditStatus;
    mock_simulation_step_count: number;
    dry_run_scope: string;
    mock_simulation_step_count_valid: AuditStatus;
    dry_run_scope_valid: AuditStatus;
    traceability_preserved: boolean;
    final_audit_allowed: AuditStatus;
    test_mode_allowed: boolean;
    real_generation_blocked: boolean;
    runtime_not_executed: boolean;
    external_call_blocked: boolean;
    gpu_execution_blocked: boolean;
    production_mode_blocked: boolean;
  }>(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH);

  const dryRunCertArtifactPath = path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH);
  const dryRunCertManifestPath = path.join(root, MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH);

  if (
    !dryRunCertReport ||
    dryRunCertReport.final_verdict !== MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT ||
    dryRunCertReport.certification_status !== MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS ||
    !fs.existsSync(dryRunCertArtifactPath) ||
    !fs.existsSync(dryRunCertManifestPath)
  ) {
    issues.push({
      code: 'DRY_RUN_CERTIFICATION_MISSING',
      message: `Required ${MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT} with ${MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const dryRunCertArtifact = loadJson<MvTestModeDryRunCertificationArtifact>(
    root,
    MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH
  );
  const runtimeCertArtifact = loadJson<MvProductionRuntimeCertificationArtifact>(
    root,
    MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH
  );
  const testPackageArtifact = loadJson<MvTestExecutionPackageArtifact>(
    root,
    MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH
  );
  const executionCertReport = loadJson<{
    runtime_certification_chain_complete: AuditStatus;
  }>(root, MV_TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH);

  if (!dryRunCertArtifact || !runtimeCertArtifact || !testPackageArtifact || !executionCertReport) {
    issues.push({
      code: 'UPSTREAM_ARTIFACT_MISSING',
      message:
        'Missing dry run certification, runtime certification, test execution package artifact, or execution certification report',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const phaseFinalAudits = DIGITAL_STUDIO_CHAIN_PHASE_ENTRIES.map((entry) =>
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
  const digitalStudioChainComplete = allPhasesCertified && allManifestsValid;

  const dryRunCertificationConsumed =
    dryRunCertReport.dry_run_consumed === 'PASS' &&
    dryRunCertArtifact.dry_run_consumed === true &&
    dryRunCertArtifact.final_audit_allowed === true;

  const chainPhaseCountValid = DIGITAL_STUDIO_CHAIN_PHASE_COUNT === 13;

  const mockSimulationStepCountValid =
    dryRunCertReport.mock_simulation_step_count === EXPECTED_MOCK_SIMULATION_STEP_COUNT &&
    dryRunCertReport.mock_simulation_step_count_valid === 'PASS' &&
    dryRunCertArtifact.mock_simulation_step_count === EXPECTED_MOCK_SIMULATION_STEP_COUNT &&
    dryRunCertArtifact.mv_dry_run_certifications.every(
      (cert) => cert.mock_simulation_step_count > 0
    );

  const dryRunScopeValid =
    dryRunCertReport.dry_run_scope === DRY_RUN_SCOPE_FULL_MV_CHAIN &&
    dryRunCertReport.dry_run_scope_valid === 'PASS' &&
    dryRunCertArtifact.dry_run_scope === DRY_RUN_SCOPE_FULL_MV_CHAIN;

  const traceabilityChains = dryRunCertArtifact.mv_dry_run_certifications.map(
    (cert) => cert.traceability_chain
  );

  const runtimeCertificationChainComplete =
    executionCertReport.runtime_certification_chain_complete === 'PASS' &&
    runtimeCertArtifact.certification_complete === true &&
    runtimeCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.runtime_certification_results.every(
      (result) => result.traceability_chain.trace_integrity === 'PASS'
    ) &&
    testPackageArtifact.mv_test_execution_packages.every(
      (pkg) => pkg.traceability_chain.trace_integrity === 'PASS'
    ) &&
    dryRunCertArtifact.mv_dry_run_certifications.every(
      (cert) => cert.traceability_chain.trace_integrity === 'PASS'
    );

  const traceabilityPreserved =
    dryRunCertReport.traceability_preserved === true &&
    dryRunCertArtifact.traceability_preserved === true &&
    runtimeCertArtifact.traceability_preserved === true &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const testModeAllowed =
    dryRunCertReport.test_mode_allowed === true &&
    dryRunCertArtifact.test_mode_allowed === true &&
    runtimeCertArtifact.test_mode_allowed === true;

  const realGenerationBlocked =
    dryRunCertReport.real_generation_blocked === true &&
    dryRunCertArtifact.real_generation_blocked === true &&
    runtimeCertArtifact.real_generation_blocked === true;

  const runtimeNotExecuted =
    dryRunCertReport.runtime_not_executed === true &&
    dryRunCertArtifact.runtime_not_executed === true &&
    runtimeCertArtifact.runtime_not_executed === true;

  const externalCallBlocked =
    dryRunCertReport.external_call_blocked === true &&
    dryRunCertArtifact.external_call_blocked === true &&
    runtimeCertArtifact.external_call_allowed === false;

  const gpuExecutionBlocked =
    dryRunCertReport.gpu_execution_blocked === true &&
    dryRunCertArtifact.gpu_execution_blocked === true &&
    runtimeCertArtifact.gpu_execution_allowed === false;

  const productionModeBlocked =
    dryRunCertReport.production_mode_blocked === true &&
    dryRunCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.production_mode_blocked === true;

  const finalAuditWriteScopeValid = FINAL_AUDIT_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderFinalAuditWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && finalAuditWriteScopeValid;

  const finalAuditAllowed = dryRunCertReport.final_audit_allowed === 'PASS';

  const nextStageGateReady =
    digitalStudioChainComplete &&
    dryRunCertificationConsumed &&
    chainPhaseCountValid &&
    mockSimulationStepCountValid &&
    dryRunScopeValid &&
    runtimeCertificationChainComplete &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    testModeAllowed &&
    realGenerationBlocked &&
    runtimeNotExecuted &&
    externalCallBlocked &&
    gpuExecutionBlocked &&
    productionModeBlocked &&
    finalAuditAllowed;

  const finalAuditCompleted = nextStageGateReady;

  const dryRunCertificationMissing = !dryRunCertificationConsumed;
  const finalAuditFailed = !finalAuditCompleted;
  const chainPhaseCountInvalid = !chainPhaseCountValid;
  const mockSimulationStepCountInvalid = !mockSimulationStepCountValid;
  const dryRunScopeInvalid = !dryRunScopeValid;
  const runtimeCertificationChainBroken = !runtimeCertificationChainComplete;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;
  const testModeDisabled = !testModeAllowed;
  const realGenerationEnabled = !realGenerationBlocked;
  const runtimeExecutionDetected = !runtimeNotExecuted;
  const externalCallEnabled = !externalCallBlocked;
  const gpuExecutionEnabled = !gpuExecutionBlocked;
  const productionModeUnblocked = !productionModeBlocked;
  const nextStageGateBlocked = !nextStageGateReady;

  if (dryRunCertificationMissing) {
    issues.push({
      code: 'DRY_RUN_CERTIFICATION_MISSING',
      message: 'Dry run certification was not consumed',
      severity: 'error',
    });
  }
  if (!digitalStudioChainComplete) {
    issues.push({
      code: 'CHAIN_INCOMPLETE',
      message: 'Digital Studio MV chain is incomplete',
      severity: 'error',
    });
  }
  if (runtimeCertificationChainBroken) {
    issues.push({
      code: 'RUNTIME_CERTIFICATION_CHAIN_BROKEN',
      message: 'Runtime certification chain is broken',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across the MV test chain',
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
  if (nextStageGateBlocked) {
    issues.push({
      code: 'NEXT_STAGE_GATE_BLOCKED',
      message: 'Next stage gate is not ready',
      severity: 'error',
    });
  }

  const finalAuditChecks: FinalAuditCheck[] = [
    {
      check_id: 'dry_run_certification_consumed',
      check_label: 'Dry Run Certification Consumed',
      status: toStatus(dryRunCertificationConsumed),
    },
    {
      check_id: 'final_audit_completed',
      check_label: 'Final Audit Completed',
      status: toStatus(finalAuditCompleted),
    },
    {
      check_id: 'chain_phase_count_valid',
      check_label: 'Chain Phase Count Valid',
      status: toStatus(chainPhaseCountValid),
    },
    {
      check_id: 'mock_simulation_step_count_valid',
      check_label: 'Mock Simulation Step Count Valid',
      status: toStatus(mockSimulationStepCountValid),
    },
    {
      check_id: 'dry_run_scope_valid',
      check_label: 'Dry Run Scope Valid',
      status: toStatus(dryRunScopeValid),
    },
    {
      check_id: 'runtime_certification_chain_complete',
      check_label: 'Runtime Certification Chain Complete',
      status: toStatus(runtimeCertificationChainComplete),
    },
    {
      check_id: 'traceability_preserved',
      check_label: 'Traceability Preserved',
      status: toStatus(traceabilityPreserved),
    },
    {
      check_id: 'safe_create_policy_verified',
      check_label: 'Safe Create Policy Verified',
      status: toStatus(safeCreatePolicyVerified),
    },
    {
      check_id: 'test_mode_allowed',
      check_label: 'Test Mode Allowed',
      status: toStatus(testModeAllowed),
    },
    {
      check_id: 'real_generation_blocked',
      check_label: 'Real Generation Blocked',
      status: toStatus(realGenerationBlocked),
    },
    {
      check_id: 'runtime_not_executed',
      check_label: 'Runtime Not Executed',
      status: toStatus(runtimeNotExecuted),
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
      check_id: 'production_mode_blocked',
      check_label: 'Production Mode Blocked',
      status: toStatus(productionModeBlocked),
    },
    {
      check_id: 'next_stage_gate_ready',
      check_label: 'Next Stage Gate Ready',
      status: toStatus(nextStageGateReady),
    },
    {
      check_id: 'digital_studio_test_chain_complete',
      check_label: 'Digital Studio Test Chain Complete',
      status: toStatus(digitalStudioChainComplete && finalAuditCompleted),
    },
  ];

  const pass =
    finalAuditCompleted && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvTestModeFinalAuditArtifact = {
    final_audit_id: 'mv-test-mode-final-audit-v1',
    phase: MV_TEST_MODE_FINAL_AUDIT_PHASE,
    generated_at: timestamp,
    audit_timestamp: timestamp,
    source_dry_run_certification_ref: MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    audit_scope: AUDIT_SCOPE_DIGITAL_STUDIO_MV_TEST_CHAIN,
    audit_summary: AUDIT_SUMMARY_TEXT,
    chain_phase_count: DIGITAL_STUDIO_CHAIN_PHASE_COUNT,
    mock_simulation_step_count: EXPECTED_MOCK_SIMULATION_STEP_COUNT,
    dry_run_scope: DRY_RUN_SCOPE_FULL_MV_CHAIN,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
    runtime_certification_chain_verified: runtimeCertificationChainComplete,
    traceability_chain: traceabilityChains,
    safe_create_policy_verified: safeCreatePolicyVerified,
    final_audit_allowed: finalAuditAllowed,
    next_stage_gate_ready: nextStageGateReady,
    digital_studio_test_chain_complete: digitalStudioChainComplete && finalAuditCompleted,
    final_audit_checks: finalAuditChecks,
    phase_final_audits: phaseFinalAudits,
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      final_audit_artifact_write_scope: FINAL_AUDIT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    final_audit_complete: finalAuditCompleted,
  };

  const manifest: MvTestModeFinalAuditManifest = {
    manifest_id: 'mv-test-mode-final-audit-manifest-v1',
    phase: MV_TEST_MODE_FINAL_AUDIT_PHASE,
    generated_at: timestamp,
    audit_timestamp: timestamp,
    chain_phase_count: DIGITAL_STUDIO_CHAIN_PHASE_COUNT,
    dry_run_scope: DRY_RUN_SCOPE_FULL_MV_CHAIN,
    mock_simulation_step_count: EXPECTED_MOCK_SIMULATION_STEP_COUNT,
    digital_studio_test_chain_complete: toStatus(digitalStudioChainComplete && finalAuditCompleted),
    runtime_certification_chain_verified: toStatus(runtimeCertificationChainComplete),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_gate_ready: toStatus(nextStageGateReady),
    certification_status: pass ? MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_FINAL_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvTestModeFinalAuditReport = {
    report_id: 'mv-test-mode-final-audit-report-v1',
    phase: MV_TEST_MODE_FINAL_AUDIT_PHASE,
    timestamp,
    audit_timestamp: timestamp,
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
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    production_mode_blocked: true,
    source_dry_run_certification_ref: MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
    mv_test_mode_dry_run_certification_report_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
    mv_test_mode_dry_run_certification_manifest_path: MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
    mv_test_mode_final_audit_export_dir: MV_TEST_MODE_FINAL_AUDIT_EXPORT_DIR,
    mv_test_mode_final_audit_manifest_path: MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH,
    mv_test_mode_final_audit_artifact_path: MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
    final_audit_id: 'mv-test-mode-final-audit-v1',
    audit_scope: AUDIT_SCOPE_DIGITAL_STUDIO_MV_TEST_CHAIN,
    audit_summary: AUDIT_SUMMARY_TEXT,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    chain_phase_count: DIGITAL_STUDIO_CHAIN_PHASE_COUNT,
    mock_simulation_step_count: EXPECTED_MOCK_SIMULATION_STEP_COUNT,
    dry_run_scope: DRY_RUN_SCOPE_FULL_MV_CHAIN,
    runtime_certification_chain_verified: toStatus(runtimeCertificationChainComplete),
    traceability_chain: traceabilityChains,
    dry_run_certification_consumed: toStatus(dryRunCertificationConsumed),
    final_audit_completed: toStatus(finalAuditCompleted),
    chain_phase_count_valid: toStatus(chainPhaseCountValid),
    mock_simulation_step_count_valid: toStatus(mockSimulationStepCountValid),
    dry_run_scope_valid: toStatus(dryRunScopeValid),
    runtime_certification_chain_complete: toStatus(runtimeCertificationChainComplete),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    test_mode_allowed: toStatus(testModeAllowed),
    real_generation_blocked_status: toStatus(realGenerationBlocked),
    runtime_not_executed_status: toStatus(runtimeNotExecuted),
    external_call_blocked_status: toStatus(externalCallBlocked),
    gpu_execution_blocked_status: toStatus(gpuExecutionBlocked),
    production_mode_blocked_status: toStatus(productionModeBlocked),
    next_stage_gate_ready: toStatus(nextStageGateReady),
    digital_studio_test_chain_complete: toStatus(digitalStudioChainComplete && finalAuditCompleted),
    final_audit_allowed: toStatus(finalAuditAllowed),
    dry_run_certification_missing: dryRunCertificationMissing,
    final_audit_failed: finalAuditFailed,
    chain_phase_count_invalid: chainPhaseCountInvalid,
    mock_simulation_step_count_invalid: mockSimulationStepCountInvalid,
    dry_run_scope_invalid: dryRunScopeInvalid,
    runtime_certification_chain_broken: runtimeCertificationChainBroken,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    test_mode_disabled: testModeDisabled,
    real_generation_enabled: realGenerationEnabled,
    runtime_execution_detected: runtimeExecutionDetected,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    production_mode_unblocked: productionModeUnblocked,
    next_stage_gate_blocked: nextStageGateBlocked,
    mv_test_mode_final_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS : null,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    next_stage_approved: pass,
    phase_final_audits: phaseFinalAudits,
    final_audit_checks: finalAuditChecks,
    final_verdict: pass ? MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT : MV_TEST_MODE_FINAL_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_TEST_MODE_FINAL_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_MODE_FINAL_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
