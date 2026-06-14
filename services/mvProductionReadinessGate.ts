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
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
  MV_TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
} from './mvTestModeDryRunCertification.js';
import {
  MV_TEST_MODE_DRY_RUN_ARTIFACT_PATH,
  MV_TEST_MODE_DRY_RUN_MANIFEST_PATH,
  MV_TEST_MODE_DRY_RUN_PASS_VERDICT,
  MV_TEST_MODE_DRY_RUN_REPORT_PATH,
  MV_TEST_MODE_DRY_RUN_READY_STATUS,
} from './mvTestModeDryRun.js';
import {
  DIGITAL_STUDIO_CHAIN_PHASE_COUNT,
  MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS,
  MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
  MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH,
  MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT,
  MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH,
  type MvTestModeFinalAuditArtifact,
} from './mvTestModeFinalAudit.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_PRODUCTION_READINESS_GATE_PHASE =
  'PHASE-DIGITAL-STUDIO-014-MV_PRODUCTION_READINESS_GATE_V1' as const;
export const MV_PRODUCTION_READINESS_GATE_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READINESS_GATE_V1' as const;
export const MV_PRODUCTION_READINESS_GATE_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READINESS_GATE_V1' as const;
export const MV_PRODUCTION_READINESS_GATE_READY_STATUS =
  'MV_PRODUCTION_READINESS_GATE_READY' as const;
export const NEXT_STAGE_GATE_LABEL = 'DS-015_ENTRY' as const;
export const MV_PRODUCTION_READINESS_GATE_DIR = 'reports/mv_production_readiness_gate' as const;
export const MV_PRODUCTION_READINESS_GATE_REPORT_PATH =
  'reports/mv_production_readiness_gate/mv-production-readiness-gate-report.json' as const;
export const MV_PRODUCTION_READINESS_GATE_MD_PATH =
  'reports/mv_production_readiness_gate/MV_PRODUCTION_READINESS_GATE.md' as const;
export const MV_PRODUCTION_READINESS_GATE_EXPORT_DIR =
  'exports/mv_production_readiness_gate' as const;
export const MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH =
  'exports/mv_production_readiness_gate/mv-production-readiness-gate-manifest.json' as const;
export const MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH =
  'exports/mv_production_readiness_gate/mv-production-readiness-gate.json' as const;

export const DIGITAL_STUDIO_READINESS_PHASE_COUNT = DIGITAL_STUDIO_CHAIN_PHASE_COUNT;
export const MAX_PRODUCTION_READINESS_SCORE = 100 as const;
export const READINESS_GATE_ARTIFACT_WRITE_SCOPE = 'exports/mv_production_readiness_gate/' as const;

export const PRODUCTION_READINESS_TIER_NOT_READY = 'NOT_READY' as const;
export const PRODUCTION_READINESS_TIER_PARTIAL_READY = 'PARTIAL_READY' as const;
export const PRODUCTION_READINESS_TIER_TEST_READY = 'TEST_READY' as const;
export const PRODUCTION_READINESS_TIER_PRODUCTION_READY = 'PRODUCTION_READY' as const;

export const PRODUCTION_READINESS_TIERS = [
  PRODUCTION_READINESS_TIER_NOT_READY,
  PRODUCTION_READINESS_TIER_PARTIAL_READY,
  PRODUCTION_READINESS_TIER_TEST_READY,
  PRODUCTION_READINESS_TIER_PRODUCTION_READY,
] as const;

export type ProductionReadinessTier = (typeof PRODUCTION_READINESS_TIERS)[number];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type GateStatus = 'PASS' | 'FAIL';

export type MvProductionReadinessGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_level?: string;
  check_id?: string;
};

export type ReadinessGateCheck = {
  check_id: string;
  check_label: string;
  status: GateStatus;
};

export type RemainingBlocker = {
  blocker_id: string;
  severity: 'critical' | 'warning';
  phase_level?: string;
  blocker_code: string;
  message: string;
  resolved: boolean;
};

export type DigitalStudioPhaseReadinessAudit = {
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

export type MvProductionReadinessGateArtifact = {
  readiness_gate_id: string;
  phase: typeof MV_PRODUCTION_READINESS_GATE_PHASE;
  generated_at: string;
  source_final_audit_ref: typeof MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH;
  production_readiness_score: number;
  production_readiness_status: typeof MV_PRODUCTION_READINESS_GATE_READY_STATUS | null;
  production_readiness_tier: ProductionReadinessTier | null;
  critical_blocker_count: number;
  warning_count: number;
  remaining_blockers: RemainingBlocker[];
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  digital_studio_readiness_phase_count: typeof DIGITAL_STUDIO_READINESS_PHASE_COUNT;
  phase_readiness_audits: DigitalStudioPhaseReadinessAudit[];
  readiness_gate_checks: ReadinessGateCheck[];
  next_stage_approved: boolean;
  readiness_gate_complete: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    readiness_gate_artifact_write_scope: typeof READINESS_GATE_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
};

export type MvProductionReadinessGateManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_READINESS_GATE_PHASE;
  generated_at: string;
  production_readiness_score: number;
  production_readiness_tier: ProductionReadinessTier | null;
  critical_blocker_count: number;
  warning_count: number;
  traceability_preserved: boolean;
  safe_create_policy_verified: GateStatus;
  next_stage_ready: GateStatus;
  certification_status: typeof MV_PRODUCTION_READINESS_GATE_READY_STATUS | null;
};

export type MvProductionReadinessGateReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READINESS_GATE_PHASE;
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
  source_final_audit_ref: typeof MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH;
  mv_test_mode_final_audit_report_path: typeof MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH;
  mv_production_readiness_gate_export_dir: typeof MV_PRODUCTION_READINESS_GATE_EXPORT_DIR;
  mv_production_readiness_gate_manifest_path: typeof MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH;
  mv_production_readiness_gate_artifact_path: typeof MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH;
  readiness_gate_id: string;
  source_count: number;
  adapter_count: number;
  digital_studio_readiness_phase_count: typeof DIGITAL_STUDIO_READINESS_PHASE_COUNT;
  production_readiness_score: number;
  production_readiness_status: typeof MV_PRODUCTION_READINESS_GATE_READY_STATUS | null;
  production_readiness_tier: ProductionReadinessTier | null;
  critical_blocker_count: number;
  warning_count: number;
  remaining_blockers: RemainingBlocker[];
  next_stage_gate_label: typeof NEXT_STAGE_GATE_LABEL;
  traceability_chain: MvRuntimeTraceability[];
  final_audit_consumed: GateStatus;
  digital_studio_test_chain_complete: GateStatus;
  production_readiness_score_valid: GateStatus;
  production_readiness_tier_valid: GateStatus;
  critical_blocker_count_valid: GateStatus;
  warning_count_valid: GateStatus;
  remaining_blockers_identified: GateStatus;
  traceability_preserved: boolean;
  safe_create_policy_verified: GateStatus;
  next_stage_ready: GateStatus;
  final_audit_missing: boolean;
  digital_studio_test_chain_incomplete: boolean;
  production_readiness_score_invalid: boolean;
  production_readiness_tier_invalid: boolean;
  critical_blocker_unresolved: boolean;
  critical_blocker_count_invalid: boolean;
  warning_count_invalid: boolean;
  remaining_blockers_missing: boolean;
  traceability_loss: boolean;
  safe_create_policy_violation: boolean;
  mv_production_readiness_gate_ready: GateStatus;
  certification_status: typeof MV_PRODUCTION_READINESS_GATE_READY_STATUS | null;
  next_stage_approved: boolean;
  phase_readiness_audits: DigitalStudioPhaseReadinessAudit[];
  readiness_gate_checks: ReadinessGateCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_READINESS_GATE_PASS_VERDICT
    | typeof MV_PRODUCTION_READINESS_GATE_FAIL_VERDICT;
  issues: MvProductionReadinessGateIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type DigitalStudioReadinessPhaseEntry = {
  phase_level: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  report_path: string;
  manifest_path: string;
  artifact_path: string;
  manifest_shared_fields: string[];
};

const DIGITAL_STUDIO_READINESS_PHASE_ENTRIES: DigitalStudioReadinessPhaseEntry[] = [
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
  {
    phase_level: 'DS-013',
    pass_verdict: MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT,
    certification_status: MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS,
    ready_field: 'mv_test_mode_final_audit_ready',
    report_path: MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH,
    manifest_path: MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH,
    artifact_path: MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
    manifest_shared_fields: ['traceability_preserved', 'certification_status', 'digital_studio_test_chain_complete'],
  },
];

const READ_ONLY_UPSTREAM_PATHS = [
  MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
  ...DIGITAL_STUDIO_READINESS_PHASE_ENTRIES.map((entry) => entry.artifact_path),
];

const READINESS_GATE_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH,
  MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_READINESS_GATE_DIR,
  MV_PRODUCTION_READINESS_GATE_EXPORT_DIR,
  MV_PRODUCTION_READINESS_GATE_REPORT_PATH,
  MV_PRODUCTION_READINESS_GATE_MD_PATH,
  ...READINESS_GATE_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): GateStatus {
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

function isUnderReadinessGateWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(READINESS_GATE_ARTIFACT_WRITE_SCOPE) ||
    relativePath === READINESS_GATE_ARTIFACT_WRITE_SCOPE.slice(0, -1)
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

function auditPhaseReadiness(
  root: string,
  entry: DigitalStudioReadinessPhaseEntry
): DigitalStudioPhaseReadinessAudit {
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

function computeProductionReadinessScore(
  certifiedPhaseCount: number,
  totalPhases: number,
  criticalBlockerCount: number
): number {
  const baseScore = Math.round((certifiedPhaseCount / totalPhases) * MAX_PRODUCTION_READINESS_SCORE);
  const penalty = criticalBlockerCount * 15;
  return Math.max(0, Math.min(MAX_PRODUCTION_READINESS_SCORE, baseScore - penalty));
}

function isProductionReadinessScoreValid(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= MAX_PRODUCTION_READINESS_SCORE;
}

function isProductionReadinessTierValid(tier: ProductionReadinessTier | null): tier is ProductionReadinessTier {
  return tier !== null && PRODUCTION_READINESS_TIERS.includes(tier);
}

function classifyProductionReadinessTier(
  score: number,
  digitalStudioTestChainComplete: boolean,
  criticalBlockerCount: number,
  safetyFlags: {
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    runtime_not_executed: boolean;
  }
): ProductionReadinessTier {
  if (!digitalStudioTestChainComplete || criticalBlockerCount > 0 || score < 50) {
    return PRODUCTION_READINESS_TIER_NOT_READY;
  }
  if (score < 75) {
    return PRODUCTION_READINESS_TIER_PARTIAL_READY;
  }
  if (
    safetyFlags.production_mode_blocked &&
    safetyFlags.real_generation_blocked &&
    safetyFlags.runtime_not_executed
  ) {
    return PRODUCTION_READINESS_TIER_TEST_READY;
  }
  if (score >= 90) {
    return PRODUCTION_READINESS_TIER_PRODUCTION_READY;
  }
  return PRODUCTION_READINESS_TIER_PARTIAL_READY;
}

function buildRemainingBlockers(
  phaseReadinessAudits: DigitalStudioPhaseReadinessAudit[],
  finalAuditArtifact: MvTestModeFinalAuditArtifact,
  traceabilityChains: MvRuntimeTraceability[]
): RemainingBlocker[] {
  const blockers: RemainingBlocker[] = [];

  for (const audit of phaseReadinessAudits) {
    if (!audit.phase_certified) {
      blockers.push({
        blocker_id: `phase_${audit.phase_level}_not_certified`,
        severity: 'critical',
        phase_level: audit.phase_level,
        blocker_code: 'PHASE_NOT_CERTIFIED',
        message: `Phase ${audit.phase_level} is not certified`,
        resolved: false,
      });
    }
    if (!audit.manifest_integrity_valid) {
      blockers.push({
        blocker_id: `phase_${audit.phase_level}_manifest_integrity`,
        severity: 'critical',
        phase_level: audit.phase_level,
        blocker_code: 'MANIFEST_INTEGRITY_INVALID',
        message: `Manifest integrity invalid for phase ${audit.phase_level}`,
        resolved: false,
      });
    }
  }

  if (!finalAuditArtifact.digital_studio_test_chain_complete) {
    blockers.push({
      blocker_id: 'digital_studio_test_chain_incomplete',
      severity: 'critical',
      phase_level: 'DS-013',
      blocker_code: 'DIGITAL_STUDIO_TEST_CHAIN_INCOMPLETE',
      message: 'Digital Studio MV test chain is not complete',
      resolved: false,
    });
  }

  for (const chain of traceabilityChains) {
    if (chain.trace_integrity !== 'PASS') {
      blockers.push({
        blocker_id: `traceability_${chain.generation_plan_id}`,
        severity: 'critical',
        blocker_code: 'TRACEABILITY_INTEGRITY_FAIL',
        message: `Traceability integrity failed for ${chain.generation_plan_id}`,
        resolved: false,
      });
    }
    if (chain.dataset_refs.length === 0) {
      blockers.push({
        blocker_id: `dataset_refs_empty_${chain.generation_plan_id}`,
        severity: 'warning',
        blocker_code: 'DATASET_REFS_EMPTY',
        message: `Dataset refs empty for ${chain.generation_plan_id}`,
        resolved: false,
      });
    }
  }

  if (finalAuditArtifact.production_mode_blocked) {
    blockers.push({
      blocker_id: 'production_mode_blocked',
      severity: 'warning',
      phase_level: 'DS-013',
      blocker_code: 'PRODUCTION_MODE_BLOCKED',
      message: 'Production mode remains blocked pending DS-015+ promotion',
      resolved: false,
    });
  }
  if (finalAuditArtifact.real_generation_blocked) {
    blockers.push({
      blocker_id: 'real_generation_blocked',
      severity: 'warning',
      phase_level: 'DS-013',
      blocker_code: 'REAL_GENERATION_BLOCKED',
      message: 'Real generation remains disabled under test_mode_only scope',
      resolved: false,
    });
  }
  if (finalAuditArtifact.runtime_not_executed) {
    blockers.push({
      blocker_id: 'runtime_not_executed',
      severity: 'warning',
      phase_level: 'DS-013',
      blocker_code: 'RUNTIME_NOT_EXECUTED',
      message: 'Production runtime execution not yet activated',
      resolved: false,
    });
  }
  if (finalAuditArtifact.external_call_blocked) {
    blockers.push({
      blocker_id: 'external_call_blocked',
      severity: 'warning',
      phase_level: 'DS-013',
      blocker_code: 'EXTERNAL_CALL_BLOCKED',
      message: 'External calls remain blocked under test_mode_only scope',
      resolved: false,
    });
  }
  if (finalAuditArtifact.gpu_execution_blocked) {
    blockers.push({
      blocker_id: 'gpu_execution_blocked',
      severity: 'warning',
      phase_level: 'DS-013',
      blocker_code: 'GPU_EXECUTION_BLOCKED',
      message: 'GPU execution remains blocked under test_mode_only scope',
      resolved: false,
    });
  }

  return blockers;
}

function buildMarkdown(report: MvProductionReadinessGateReport): string {
  const lines = [
    '# MV Production Readiness Gate',
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
    `**Production Readiness Tier:** ${report.production_readiness_tier ?? 'NONE'}`,
    `**Production Readiness Score:** ${report.production_readiness_score}`,
    `**Next Stage Approved:** ${report.next_stage_approved}`,
    `**Next Stage Gate:** ${report.next_stage_gate_label}`,
    `**Critical Blockers:** ${report.critical_blocker_count}`,
    `**Warnings:** ${report.warning_count}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| final_audit_consumed | ${report.final_audit_consumed} |`,
    `| digital_studio_test_chain_complete | ${report.digital_studio_test_chain_complete} |`,
    `| production_readiness_score_valid | ${report.production_readiness_score_valid} |`,
    `| production_readiness_tier_valid | ${report.production_readiness_tier_valid} |`,
    `| critical_blocker_count_valid | ${report.critical_blocker_count_valid} |`,
    `| warning_count_valid | ${report.warning_count_valid} |`,
    `| remaining_blockers_identified | ${report.remaining_blockers_identified} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| next_stage_ready | ${report.next_stage_ready} |`,
    '',
    '## Phase Readiness Audits',
    ''
  );

  for (const audit of report.phase_readiness_audits) {
    lines.push(
      `- ${audit.phase_level}: certified=${audit.phase_certified} manifest_integrity=${audit.manifest_integrity_valid}`
    );
  }

  lines.push('', '## Remaining Blockers', '');
  for (const blocker of report.remaining_blockers) {
    lines.push(`- [${blocker.severity}] ${blocker.blocker_code}: ${blocker.message}`);
  }

  lines.push('', '## Readiness Gate Checks', '');
  for (const check of report.readiness_gate_checks) {
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
  issues: MvProductionReadinessGateIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionReadinessGateReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionReadinessGateReport = {
    report_id: 'mv-production-readiness-gate-report-v1',
    phase: MV_PRODUCTION_READINESS_GATE_PHASE,
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
    source_final_audit_ref: MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
    mv_test_mode_final_audit_report_path: MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH,
    mv_production_readiness_gate_export_dir: MV_PRODUCTION_READINESS_GATE_EXPORT_DIR,
    mv_production_readiness_gate_manifest_path: MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH,
    mv_production_readiness_gate_artifact_path: MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
    readiness_gate_id: 'mv-production-readiness-gate-v1',
    source_count: 0,
    adapter_count: 0,
    digital_studio_readiness_phase_count: DIGITAL_STUDIO_READINESS_PHASE_COUNT,
    production_readiness_score: 0,
    production_readiness_status: null,
    production_readiness_tier: null,
    critical_blocker_count: 0,
    warning_count: 0,
    remaining_blockers: [],
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: [],
    final_audit_consumed: 'FAIL',
    digital_studio_test_chain_complete: 'FAIL',
    production_readiness_score_valid: 'FAIL',
    production_readiness_tier_valid: 'FAIL',
    critical_blocker_count_valid: 'FAIL',
    warning_count_valid: 'FAIL',
    remaining_blockers_identified: 'FAIL',
    traceability_preserved: false,
    safe_create_policy_verified: toStatus(upstreamUnchanged),
    next_stage_ready: 'FAIL',
    final_audit_missing: true,
    digital_studio_test_chain_incomplete: true,
    production_readiness_score_invalid: true,
    production_readiness_tier_invalid: true,
    critical_blocker_unresolved: true,
    critical_blocker_count_invalid: true,
    warning_count_invalid: true,
    remaining_blockers_missing: true,
    traceability_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    mv_production_readiness_gate_ready: 'FAIL',
    certification_status: null,
    next_stage_approved: false,
    phase_readiness_audits: [],
    readiness_gate_checks: [],
    final_verdict: MV_PRODUCTION_READINESS_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READINESS_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionReadinessGate(
  projectRoot?: string
): MvProductionReadinessGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadinessGateIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const finalAuditReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    digital_studio_test_chain_complete: GateStatus;
    next_stage_gate_ready: GateStatus;
    traceability_preserved: boolean;
  }>(root, MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH);

  const finalAuditArtifactPath = path.join(root, MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH);
  const finalAuditManifestPath = path.join(root, MV_TEST_MODE_FINAL_AUDIT_MANIFEST_PATH);

  if (
    !finalAuditReport ||
    finalAuditReport.final_verdict !== MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT ||
    finalAuditReport.certification_status !== MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS ||
    !fs.existsSync(finalAuditArtifactPath) ||
    !fs.existsSync(finalAuditManifestPath)
  ) {
    issues.push({
      code: 'FINAL_AUDIT_MISSING',
      message: `Required ${MV_TEST_MODE_FINAL_AUDIT_PASS_VERDICT} with ${MV_DIGITAL_STUDIO_TEST_CHAIN_COMPLETE_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const finalAuditArtifact = loadJson<MvTestModeFinalAuditArtifact>(
    root,
    MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH
  );

  if (!finalAuditArtifact) {
    issues.push({
      code: 'FINAL_AUDIT_MISSING',
      message: 'Missing final audit artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const phaseReadinessAudits = DIGITAL_STUDIO_READINESS_PHASE_ENTRIES.map((entry) =>
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
  const certifiedPhaseCount = phaseReadinessAudits.filter((audit) => audit.phase_certified).length;

  const finalAuditConsumed =
    finalAuditArtifact.final_audit_complete === true &&
    finalAuditArtifact.digital_studio_test_chain_complete === true &&
    finalAuditArtifact.next_stage_gate_ready === true;

  const digitalStudioTestChainComplete =
    finalAuditReport.digital_studio_test_chain_complete === 'PASS' &&
    finalAuditArtifact.digital_studio_test_chain_complete === true &&
    allPhasesCertified;

  const traceabilityChains = finalAuditArtifact.traceability_chain;
  const traceabilityPreserved =
    finalAuditReport.traceability_preserved === true &&
    finalAuditArtifact.safe_create_policy_verified === true &&
    traceabilityChains.every((chain) => chain.trace_integrity === 'PASS');

  const remainingBlockers = buildRemainingBlockers(
    phaseReadinessAudits,
    finalAuditArtifact,
    traceabilityChains
  );

  const criticalBlockers = remainingBlockers.filter((blocker) => blocker.severity === 'critical');
  const warnings = remainingBlockers.filter((blocker) => blocker.severity === 'warning');
  const criticalBlockerCount = criticalBlockers.length;
  const warningCount = warnings.length;

  const productionReadinessScore = computeProductionReadinessScore(
    certifiedPhaseCount,
    DIGITAL_STUDIO_READINESS_PHASE_COUNT,
    criticalBlockerCount
  );

  const productionReadinessTier = classifyProductionReadinessTier(
    productionReadinessScore,
    digitalStudioTestChainComplete,
    criticalBlockerCount,
    {
      production_mode_blocked: finalAuditArtifact.production_mode_blocked,
      real_generation_blocked: finalAuditArtifact.real_generation_blocked,
      runtime_not_executed: finalAuditArtifact.runtime_not_executed,
    }
  );

  const productionReadinessScoreValid = isProductionReadinessScoreValid(productionReadinessScore);
  const productionReadinessTierValid = isProductionReadinessTierValid(productionReadinessTier);
  const criticalBlockerCountValid =
    criticalBlockerCount === criticalBlockers.filter((blocker) => !blocker.resolved).length;
  const warningCountValid = warningCount === warnings.length;
  const remainingBlockersIdentified = Array.isArray(remainingBlockers);

  const readinessGateWriteScopeValid = READINESS_GATE_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderReadinessGateWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && readinessGateWriteScopeValid;

  const criticalBlockerUnresolved = criticalBlockers.some((blocker) => !blocker.resolved);

  const nextStageReady =
    finalAuditConsumed &&
    digitalStudioTestChainComplete &&
    productionReadinessScoreValid &&
    productionReadinessTierValid &&
    !criticalBlockerUnresolved &&
    criticalBlockerCountValid &&
    warningCountValid &&
    remainingBlockersIdentified &&
    traceabilityPreserved &&
    safeCreatePolicyVerified &&
    (productionReadinessTier === PRODUCTION_READINESS_TIER_TEST_READY ||
      productionReadinessTier === PRODUCTION_READINESS_TIER_PRODUCTION_READY);

  const finalAuditMissing = !finalAuditConsumed;
  const digitalStudioTestChainIncomplete = !digitalStudioTestChainComplete;
  const productionReadinessScoreInvalid = !productionReadinessScoreValid;
  const productionReadinessTierInvalid = !productionReadinessTierValid;
  const criticalBlockerCountInvalid = !criticalBlockerCountValid;
  const warningCountInvalid = !warningCountValid;
  const remainingBlockersMissing = !remainingBlockersIdentified;
  const traceabilityLoss = !traceabilityPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;

  if (finalAuditMissing) {
    issues.push({
      code: 'FINAL_AUDIT_MISSING',
      message: 'Final audit was not consumed',
      severity: 'error',
    });
  }
  if (digitalStudioTestChainIncomplete) {
    issues.push({
      code: 'DIGITAL_STUDIO_TEST_CHAIN_INCOMPLETE',
      message: 'Digital Studio MV test chain is incomplete',
      severity: 'error',
    });
  }
  if (criticalBlockerUnresolved) {
    issues.push({
      code: 'CRITICAL_BLOCKER_UNRESOLVED',
      message: 'Unresolved critical blockers remain',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability was not preserved across the MV readiness gate',
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

  const readinessGateChecks: ReadinessGateCheck[] = [
    {
      check_id: 'final_audit_consumed',
      check_label: 'Final Audit Consumed',
      status: toStatus(finalAuditConsumed),
    },
    {
      check_id: 'digital_studio_test_chain_complete',
      check_label: 'Digital Studio Test Chain Complete',
      status: toStatus(digitalStudioTestChainComplete),
    },
    {
      check_id: 'production_readiness_score_valid',
      check_label: 'Production Readiness Score Valid',
      status: toStatus(productionReadinessScoreValid),
    },
    {
      check_id: 'production_readiness_tier_valid',
      check_label: 'Production Readiness Tier Valid',
      status: toStatus(productionReadinessTierValid),
    },
    {
      check_id: 'critical_blocker_count_valid',
      check_label: 'Critical Blocker Count Valid',
      status: toStatus(criticalBlockerCountValid),
    },
    {
      check_id: 'warning_count_valid',
      check_label: 'Warning Count Valid',
      status: toStatus(warningCountValid),
    },
    {
      check_id: 'remaining_blockers_identified',
      check_label: 'Remaining Blockers Identified',
      status: toStatus(remainingBlockersIdentified),
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
      check_id: 'next_stage_ready',
      check_label: 'Next Stage Ready',
      status: toStatus(nextStageReady),
    },
  ];

  const pass =
    nextStageReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionReadinessGateArtifact = {
    readiness_gate_id: 'mv-production-readiness-gate-v1',
    phase: MV_PRODUCTION_READINESS_GATE_PHASE,
    generated_at: timestamp,
    source_final_audit_ref: MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
    production_readiness_score: productionReadinessScore,
    production_readiness_status: pass ? MV_PRODUCTION_READINESS_GATE_READY_STATUS : null,
    production_readiness_tier: productionReadinessTier,
    critical_blocker_count: criticalBlockerCount,
    warning_count: warningCount,
    remaining_blockers: remainingBlockers,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    digital_studio_readiness_phase_count: DIGITAL_STUDIO_READINESS_PHASE_COUNT,
    phase_readiness_audits: phaseReadinessAudits,
    readiness_gate_checks: readinessGateChecks,
    next_stage_approved: pass,
    readiness_gate_complete: pass,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      readiness_gate_artifact_write_scope: READINESS_GATE_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
  };

  const manifest: MvProductionReadinessGateManifest = {
    manifest_id: 'mv-production-readiness-gate-manifest-v1',
    phase: MV_PRODUCTION_READINESS_GATE_PHASE,
    generated_at: timestamp,
    production_readiness_score: productionReadinessScore,
    production_readiness_tier: productionReadinessTier,
    critical_blocker_count: criticalBlockerCount,
    warning_count: warningCount,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_PRODUCTION_READINESS_GATE_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READINESS_GATE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionReadinessGateReport = {
    report_id: 'mv-production-readiness-gate-report-v1',
    phase: MV_PRODUCTION_READINESS_GATE_PHASE,
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
    source_final_audit_ref: MV_TEST_MODE_FINAL_AUDIT_ARTIFACT_PATH,
    mv_test_mode_final_audit_report_path: MV_TEST_MODE_FINAL_AUDIT_REPORT_PATH,
    mv_production_readiness_gate_export_dir: MV_PRODUCTION_READINESS_GATE_EXPORT_DIR,
    mv_production_readiness_gate_manifest_path: MV_PRODUCTION_READINESS_GATE_MANIFEST_PATH,
    mv_production_readiness_gate_artifact_path: MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
    readiness_gate_id: 'mv-production-readiness-gate-v1',
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    digital_studio_readiness_phase_count: DIGITAL_STUDIO_READINESS_PHASE_COUNT,
    production_readiness_score: productionReadinessScore,
    production_readiness_status: pass ? MV_PRODUCTION_READINESS_GATE_READY_STATUS : null,
    production_readiness_tier: productionReadinessTier,
    critical_blocker_count: criticalBlockerCount,
    warning_count: warningCount,
    remaining_blockers: remainingBlockers,
    next_stage_gate_label: NEXT_STAGE_GATE_LABEL,
    traceability_chain: traceabilityChains,
    final_audit_consumed: toStatus(finalAuditConsumed),
    digital_studio_test_chain_complete: toStatus(digitalStudioTestChainComplete),
    production_readiness_score_valid: toStatus(productionReadinessScoreValid),
    production_readiness_tier_valid: toStatus(productionReadinessTierValid),
    critical_blocker_count_valid: toStatus(criticalBlockerCountValid),
    warning_count_valid: toStatus(warningCountValid),
    remaining_blockers_identified: toStatus(remainingBlockersIdentified),
    traceability_preserved: traceabilityPreserved,
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    final_audit_missing: finalAuditMissing,
    digital_studio_test_chain_incomplete: digitalStudioTestChainIncomplete,
    production_readiness_score_invalid: productionReadinessScoreInvalid,
    production_readiness_tier_invalid: productionReadinessTierInvalid,
    critical_blocker_unresolved: criticalBlockerUnresolved,
    critical_blocker_count_invalid: criticalBlockerCountInvalid,
    warning_count_invalid: warningCountInvalid,
    remaining_blockers_missing: remainingBlockersMissing,
    traceability_loss: traceabilityLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    mv_production_readiness_gate_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_READINESS_GATE_READY_STATUS : null,
    next_stage_approved: pass,
    phase_readiness_audits: phaseReadinessAudits,
    readiness_gate_checks: readinessGateChecks,
    final_verdict: pass
      ? MV_PRODUCTION_READINESS_GATE_PASS_VERDICT
      : MV_PRODUCTION_READINESS_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READINESS_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READINESS_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
