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
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH,
  TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
  TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
} from './movieAnalysisTestModeExecutionPackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PRODUCTION_ENGINE_INTEGRITY_AUDIT_PHASE =
  'PHASE-LEVEL3-009-PRODUCTION_ENGINE_INTEGRITY_AUDIT_V1' as const;
export const PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PRODUCTION_ENGINE_INTEGRITY_AUDIT_V1' as const;
export const PRODUCTION_ENGINE_INTEGRITY_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PRODUCTION_ENGINE_INTEGRITY_AUDIT_V1' as const;
export const PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS =
  'PRODUCTION_ENGINE_INTEGRITY_VERIFIED' as const;
export const PRODUCTION_ENGINE_INTEGRITY_AUDIT_DIR =
  'reports/movie_analysis_production_engine_integrity_audit' as const;
export const PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH =
  'reports/movie_analysis_production_engine_integrity_audit/movie-analysis-production-engine-integrity-audit-report.json' as const;
export const PRODUCTION_ENGINE_INTEGRITY_AUDIT_MD_PATH =
  'reports/movie_analysis_production_engine_integrity_audit/MOVIE_ANALYSIS_PRODUCTION_ENGINE_INTEGRITY_AUDIT.md' as const;
export const PRODUCTION_ENGINE_INTEGRITY_AUDIT_EXPORT_DIR =
  'exports/movie_analysis_production_engine_integrity_audit' as const;
export const PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH =
  'exports/movie_analysis_production_engine_integrity_audit/movie-analysis-production-engine-integrity-audit-manifest.json' as const;
export const PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH =
  'exports/movie_analysis_production_engine_integrity_audit/production-engine-integrity-audit.json' as const;

export const LEVEL3_PHASE_COUNT = 8 as const;
export const SAFE_CREATE_POLICY = 'SAFE_CREATE_ONLY' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT };

export type AuditStatus = 'PASS' | 'FAIL';

export type ProductionEngineIntegrityAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_level?: string;
  check_id?: string;
};

export type PhaseIntegrityAudit = {
  phase_level: string;
  check_id: string;
  phase: string;
  report_path: string;
  manifest_path: string;
  artifact_path: string;
  report_exists: boolean;
  manifest_exists: boolean;
  artifact_exists: boolean;
  pass_verdict_valid: boolean;
  certification_status_valid: boolean;
  ready_field_valid: boolean;
  traceability_preserved: boolean;
  report_manifest_consistent: boolean;
  integrity_status: AuditStatus;
};

export type CrossPhaseTraceabilityEntry = {
  from_phase: string;
  to_phase: string;
  upstream_artifact_field: string;
  upstream_artifact_path: string;
  upstream_exists: boolean;
  chain_valid: boolean;
};

export type MemoryBindingIntegrityAudit = {
  binding_id: string;
  binding_ready: AuditStatus;
  evidence_report_path: string | null;
  evidence_exists: boolean;
};

export type ProductionEngineIntegrityAuditArtifact = {
  audit_id: string;
  phase: typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_PHASE;
  generated_at: string;
  level3_phase_count: typeof LEVEL3_PHASE_COUNT;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  phase_integrity_audits: PhaseIntegrityAudit[];
  cross_phase_traceability_chain: CrossPhaseTraceabilityEntry[];
  memory_binding_audits: MemoryBindingIntegrityAudit[];
  runtime_safety_summary: {
    test_mode_allowed: boolean;
    production_mode_blocked: boolean;
    runtime_not_executed: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
    no_file_overwrite: boolean;
    runtime_safety_preserved: boolean;
  };
  test_mode_constraints_summary: {
    test_mode_enabled: AuditStatus;
    production_mode_disabled: AuditStatus;
    external_call_blocked: AuditStatus;
    gpu_execution_blocked: AuditStatus;
    test_mode_constraints_preserved: boolean;
  };
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    upstream_artifacts_unchanged: boolean;
  };
  audit_complete: boolean;
};

export type MovieAnalysisProductionEngineIntegrityAuditManifest = {
  manifest_id: string;
  phase: typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_PHASE;
  generated_at: string;
  level3_phase_count: typeof LEVEL3_PHASE_COUNT;
  all_level3_artifacts_present: AuditStatus;
  cross_phase_traceability_valid: AuditStatus;
  memory_bindings_preserved: AuditStatus;
  runtime_safety_preserved: AuditStatus;
  test_mode_constraints_preserved: AuditStatus;
  report_consistency_integrity: AuditStatus;
  manifest_consistency_integrity: AuditStatus;
  safe_create_policy_preserved: AuditStatus;
  audit_complete: AuditStatus;
  certification_status: typeof PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS | null;
};

export type MovieAnalysisProductionEngineIntegrityAuditReport = {
  report_id: string;
  phase: typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_PHASE;
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
  test_mode_execution_package_report_path: typeof TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  production_engine_integrity_audit_export_dir: typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_EXPORT_DIR;
  production_engine_integrity_audit_manifest_path: typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH;
  production_engine_integrity_audit_artifact_path: typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  level3_phase_count: typeof LEVEL3_PHASE_COUNT;
  foundation_integrity: AuditStatus;
  blueprint_integrity: AuditStatus;
  scene_assembly_integrity: AuditStatus;
  shot_assembly_integrity: AuditStatus;
  generation_plan_integrity: AuditStatus;
  runtime_integrity: AuditStatus;
  certification_integrity: AuditStatus;
  test_package_integrity: AuditStatus;
  traceability_chain_integrity: AuditStatus;
  memory_binding_integrity: AuditStatus;
  report_consistency_integrity: AuditStatus;
  manifest_consistency_integrity: AuditStatus;
  safe_create_policy_preserved: AuditStatus;
  all_level3_artifacts_present: AuditStatus;
  cross_phase_traceability_valid: AuditStatus;
  memory_bindings_preserved: AuditStatus;
  runtime_safety_preserved: AuditStatus;
  test_mode_constraints_preserved: AuditStatus;
  audit_complete: AuditStatus;
  artifact_missing: boolean;
  traceability_break: boolean;
  memory_binding_loss: boolean;
  runtime_safety_loss: boolean;
  test_mode_violation: boolean;
  report_manifest_mismatch: boolean;
  safe_create_policy_violation: boolean;
  production_engine_integrity_audit_ready: AuditStatus;
  certification_status: typeof PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS | null;
  phase_integrity_audits: PhaseIntegrityAudit[];
  cross_phase_traceability_chain: CrossPhaseTraceabilityEntry[];
  memory_binding_audits: MemoryBindingIntegrityAudit[];
  final_verdict:
    | typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT
    | typeof PRODUCTION_ENGINE_INTEGRITY_AUDIT_FAIL_VERDICT;
  issues: ProductionEngineIntegrityAuditIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type Level3PhaseDefinition = {
  phase_level: string;
  check_id: string;
  phase: string;
  pass_verdict: string;
  ready_status: string;
  ready_field: string;
  report_path: string;
  manifest_path: string;
  artifact_path: string;
  upstream_artifact_field: string | null;
  expected_upstream_artifact_path: string | null;
  manifest_shared_fields: string[];
};

const LEVEL3_PHASE_DEFINITIONS: Level3PhaseDefinition[] = [
  {
    phase_level: 'L3-001',
    check_id: 'foundation_integrity',
    phase: 'PHASE-LEVEL3-001-PRODUCTION_ENGINE_FOUNDATION_V1',
    pass_verdict: PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT,
    ready_status: PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE,
    ready_field: 'production_engine_foundation_ready',
    report_path: PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
    manifest_path: PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH,
    artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
    upstream_artifact_field: null,
    expected_upstream_artifact_path: null,
    manifest_shared_fields: [
      'traceability_preserved',
      'certification_status',
      'character_memory_binding',
      'location_memory_binding',
      'story_memory_binding',
      'cross_episode_memory_binding',
    ],
  },
  {
    phase_level: 'L3-002',
    check_id: 'blueprint_integrity',
    phase: 'PHASE-LEVEL3-002-PRODUCTION_BLUEPRINT_EXPANSION_V1',
    pass_verdict: PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT,
    ready_status: PRODUCTION_BLUEPRINT_EXPANDED_STATUS,
    ready_field: 'production_blueprint_expansion_ready',
    report_path: PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
    manifest_path: PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH,
    artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
    upstream_artifact_field: 'foundation_artifact_path',
    expected_upstream_artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
    manifest_shared_fields: [
      'traceability_preserved',
      'certification_status',
      'bridge_certification_consumed',
      'foundation_consumed',
      'blueprint_expansion_complete',
    ],
  },
  {
    phase_level: 'L3-003',
    check_id: 'scene_assembly_integrity',
    phase: 'PHASE-LEVEL3-003-SCENE_ASSEMBLY_ENGINE_V1',
    pass_verdict: SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
    ready_status: SCENE_ASSEMBLY_READY_STATUS,
    ready_field: 'scene_assembly_engine_ready',
    report_path: SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
    manifest_path: SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
    artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    upstream_artifact_field: 'blueprint_expansion_artifact_path',
    expected_upstream_artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
    manifest_shared_fields: [
      'traceability_preserved',
      'certification_status',
      'blueprint_consumed',
      'scene_assembly_complete',
    ],
  },
  {
    phase_level: 'L3-004',
    check_id: 'shot_assembly_integrity',
    phase: 'PHASE-LEVEL3-004-SHOT_ASSEMBLY_ENGINE_V1',
    pass_verdict: SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
    ready_status: SHOT_ASSEMBLY_READY_STATUS,
    ready_field: 'shot_assembly_engine_ready',
    report_path: SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
    manifest_path: SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
    artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    upstream_artifact_field: 'scene_assembly_artifact_path',
    expected_upstream_artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: [
      'traceability_preserved',
      'certification_status',
      'scene_assembly_consumed',
      'shot_assembly_complete',
    ],
  },
  {
    phase_level: 'L3-005',
    check_id: 'generation_plan_integrity',
    phase: 'PHASE-LEVEL3-005-GENERATION_PLANNING_ENGINE_V1',
    pass_verdict: GENERATION_PLANNING_ENGINE_PASS_VERDICT,
    ready_status: GENERATION_PLANNING_READY_STATUS,
    ready_field: 'generation_planning_engine_ready',
    report_path: GENERATION_PLANNING_ENGINE_REPORT_PATH,
    manifest_path: GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
    artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    upstream_artifact_field: 'shot_assembly_artifact_path',
    expected_upstream_artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: [
      'traceability_preserved',
      'certification_status',
      'shot_assembly_consumed',
      'generation_plan_complete',
    ],
  },
  {
    phase_level: 'L3-006',
    check_id: 'runtime_integrity',
    phase: 'PHASE-LEVEL3-006-PRODUCTION_RUNTIME_ENGINE_V1',
    pass_verdict: PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
    ready_status: PRODUCTION_RUNTIME_READY_STATUS,
    ready_field: 'production_runtime_engine_ready',
    report_path: PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
    manifest_path: PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
    artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    upstream_artifact_field: 'generation_planning_artifact_path',
    expected_upstream_artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: [
      'traceability_preserved',
      'certification_status',
      'generation_plan_consumed',
      'runtime_package_complete',
    ],
  },
  {
    phase_level: 'L3-007',
    check_id: 'certification_integrity',
    phase: 'PHASE-LEVEL3-007-PRODUCTION_RUNTIME_CERTIFICATION_V1',
    pass_verdict: PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
    ready_status: PRODUCTION_RUNTIME_CERTIFIED_STATUS,
    ready_field: 'production_runtime_certification_ready',
    report_path: PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
    manifest_path: PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
    artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    upstream_artifact_field: 'production_runtime_engine_artifact_path',
    expected_upstream_artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    manifest_shared_fields: [
      'traceability_preserved',
      'certification_status',
      'runtime_consumed',
      'certification_complete',
      'test_mode_allowed',
      'production_mode_blocked',
    ],
  },
  {
    phase_level: 'L3-008',
    check_id: 'test_package_integrity',
    phase: 'PHASE-LEVEL3-008-TEST_MODE_EXECUTION_PACKAGE_V1',
    pass_verdict: TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
    ready_status: TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
    ready_field: 'test_mode_execution_package_ready',
    report_path: TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
    manifest_path: TEST_MODE_EXECUTION_PACKAGE_MANIFEST_PATH,
    artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    upstream_artifact_field: 'production_runtime_certification_artifact_path',
    expected_upstream_artifact_path: PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    manifest_shared_fields: [
      'traceability_preserved',
      'certification_status',
      'certification_consumed',
      'test_package_complete',
      'test_mode_enabled',
      'production_mode_disabled',
      'external_call_blocked',
      'gpu_execution_blocked',
    ],
  },
];

const READ_ONLY_UPSTREAM_PATHS = LEVEL3_PHASE_DEFINITIONS.map((entry) => entry.artifact_path);

const WRITE_PATHS = [
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_DIR,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_EXPORT_DIR,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_MD_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH,
  PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
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

function runtimeSafetyFlagsValid(report: Record<string, unknown>): boolean {
  return (
    report.planning_only === true &&
    report.runtime_execution === false &&
    report.gpu_execution === false &&
    report.external_call_allowed === false &&
    report.no_execution === true
  );
}

function auditPhase(
  root: string,
  definition: Level3PhaseDefinition
): PhaseIntegrityAudit {
  const report = loadJson<Record<string, unknown>>(root, definition.report_path);
  const manifest = loadJson<Record<string, unknown>>(root, definition.manifest_path);
  const artifact = loadJson<Record<string, unknown>>(root, definition.artifact_path);

  const reportExists = report !== null;
  const manifestExists = manifest !== null;
  const artifactExists = artifact !== null;

  const passVerdictValid =
    reportExists && report.final_verdict === definition.pass_verdict;
  const certificationStatusValid =
    reportExists && report.certification_status === definition.ready_status;
  const readyFieldValid =
    reportExists && report[definition.ready_field] === 'PASS';
  const traceabilityPreserved =
    reportExists && report.traceability_preserved === true;
  const reportManifestConsistentResult =
    reportExists &&
    manifestExists &&
    reportManifestConsistent(report, manifest, definition.manifest_shared_fields);

  const integrityStatus = toStatus(
    reportExists &&
      manifestExists &&
      artifactExists &&
      passVerdictValid &&
      certificationStatusValid &&
      readyFieldValid &&
      traceabilityPreserved &&
      reportManifestConsistentResult &&
      runtimeSafetyFlagsValid(report)
  );

  return {
    phase_level: definition.phase_level,
    check_id: definition.check_id,
    phase: definition.phase,
    report_path: definition.report_path,
    manifest_path: definition.manifest_path,
    artifact_path: definition.artifact_path,
    report_exists: reportExists,
    manifest_exists: manifestExists,
    artifact_exists: artifactExists,
    pass_verdict_valid: passVerdictValid,
    certification_status_valid: certificationStatusValid,
    ready_field_valid: readyFieldValid,
    traceability_preserved: traceabilityPreserved,
    report_manifest_consistent: reportManifestConsistentResult,
    integrity_status: integrityStatus,
  };
}

function buildCrossPhaseTraceabilityChain(
  root: string,
  definitions: Level3PhaseDefinition[]
): CrossPhaseTraceabilityEntry[] {
  const entries: CrossPhaseTraceabilityEntry[] = [];

  for (let index = 1; index < definitions.length; index += 1) {
    const current = definitions[index];
    const previous = definitions[index - 1];
    if (!current.upstream_artifact_field || !current.expected_upstream_artifact_path) continue;

    const artifact = loadJson<Record<string, unknown>>(root, current.artifact_path);
    const upstreamPath =
      artifact && typeof artifact[current.upstream_artifact_field] === 'string'
        ? (artifact[current.upstream_artifact_field] as string)
        : '';
    const upstreamExists = upstreamPath.length > 0 && fs.existsSync(path.join(root, upstreamPath));
    const chainValid =
      upstreamPath === current.expected_upstream_artifact_path && upstreamExists;

    entries.push({
      from_phase: previous.phase_level,
      to_phase: current.phase_level,
      upstream_artifact_field: current.upstream_artifact_field,
      upstream_artifact_path: upstreamPath,
      upstream_exists: upstreamExists,
      chain_valid: chainValid,
    });
  }

  return entries;
}

function buildMemoryBindingAudits(root: string): MemoryBindingIntegrityAudit[] {
  const foundationArtifact = loadJson<{
    memory_bindings?: Array<{
      binding_id: string;
      evidence_report_path: string;
      binding_ready: AuditStatus;
    }>;
  }>(root, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH);

  if (!foundationArtifact?.memory_bindings) return [];

  return foundationArtifact.memory_bindings.map((binding) => {
    const evidenceExists =
      binding.evidence_report_path.length > 0 &&
      fs.existsSync(path.join(root, binding.evidence_report_path));
    return {
      binding_id: binding.binding_id,
      binding_ready: binding.binding_ready,
      evidence_report_path: binding.evidence_report_path,
      evidence_exists: evidenceExists,
    };
  });
}

function buildMarkdown(report: MovieAnalysisProductionEngineIntegrityAuditReport): string {
  const lines = [
    '# Movie Analysis Production Engine Integrity Audit',
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
    `| foundation_integrity | ${report.foundation_integrity} |`,
    `| blueprint_integrity | ${report.blueprint_integrity} |`,
    `| scene_assembly_integrity | ${report.scene_assembly_integrity} |`,
    `| shot_assembly_integrity | ${report.shot_assembly_integrity} |`,
    `| generation_plan_integrity | ${report.generation_plan_integrity} |`,
    `| runtime_integrity | ${report.runtime_integrity} |`,
    `| certification_integrity | ${report.certification_integrity} |`,
    `| test_package_integrity | ${report.test_package_integrity} |`,
    `| traceability_chain_integrity | ${report.traceability_chain_integrity} |`,
    `| memory_binding_integrity | ${report.memory_binding_integrity} |`,
    `| report_consistency_integrity | ${report.report_consistency_integrity} |`,
    `| manifest_consistency_integrity | ${report.manifest_consistency_integrity} |`,
    `| safe_create_policy_preserved | ${report.safe_create_policy_preserved} |`,
    `| all_level3_artifacts_present | ${report.all_level3_artifacts_present} |`,
    `| cross_phase_traceability_valid | ${report.cross_phase_traceability_valid} |`,
    `| memory_bindings_preserved | ${report.memory_bindings_preserved} |`,
    `| runtime_safety_preserved | ${report.runtime_safety_preserved} |`,
    `| test_mode_constraints_preserved | ${report.test_mode_constraints_preserved} |`,
    `| audit_complete | ${report.audit_complete} |`,
    '',
    '## Phase Integrity Audits',
    ''
  );

  for (const audit of report.phase_integrity_audits) {
    lines.push(
      `- ${audit.phase_level} ${audit.check_id}: ${audit.integrity_status} report=${audit.report_exists} manifest=${audit.manifest_exists} artifact=${audit.artifact_exists}`
    );
  }

  lines.push('', '## Cross-Phase Traceability', '');
  for (const entry of report.cross_phase_traceability_chain) {
    lines.push(
      `- ${entry.from_phase} -> ${entry.to_phase}: chain_valid=${entry.chain_valid} upstream=${entry.upstream_artifact_path}`
    );
  }

  lines.push('', '## Memory Bindings', '');
  for (const binding of report.memory_binding_audits) {
    lines.push(
      `- ${binding.binding_id}: ready=${binding.binding_ready} evidence_exists=${binding.evidence_exists}`
    );
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
  issues: ProductionEngineIntegrityAuditIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MovieAnalysisProductionEngineIntegrityAuditReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MovieAnalysisProductionEngineIntegrityAuditReport = {
    report_id: 'movie-analysis-production-engine-integrity-audit-report-v1',
    phase: PRODUCTION_ENGINE_INTEGRITY_AUDIT_PHASE,
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
    test_mode_execution_package_report_path: TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    production_engine_integrity_audit_export_dir: PRODUCTION_ENGINE_INTEGRITY_AUDIT_EXPORT_DIR,
    production_engine_integrity_audit_manifest_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH,
    production_engine_integrity_audit_artifact_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    level3_phase_count: LEVEL3_PHASE_COUNT,
    foundation_integrity: 'FAIL',
    blueprint_integrity: 'FAIL',
    scene_assembly_integrity: 'FAIL',
    shot_assembly_integrity: 'FAIL',
    generation_plan_integrity: 'FAIL',
    runtime_integrity: 'FAIL',
    certification_integrity: 'FAIL',
    test_package_integrity: 'FAIL',
    traceability_chain_integrity: 'FAIL',
    memory_binding_integrity: 'FAIL',
    report_consistency_integrity: 'FAIL',
    manifest_consistency_integrity: 'FAIL',
    safe_create_policy_preserved: toStatus(upstreamUnchanged),
    all_level3_artifacts_present: 'FAIL',
    cross_phase_traceability_valid: 'FAIL',
    memory_bindings_preserved: 'FAIL',
    runtime_safety_preserved: 'FAIL',
    test_mode_constraints_preserved: 'FAIL',
    audit_complete: 'FAIL',
    artifact_missing: true,
    traceability_break: true,
    memory_binding_loss: true,
    runtime_safety_loss: true,
    test_mode_violation: true,
    report_manifest_mismatch: true,
    safe_create_policy_violation: !upstreamUnchanged,
    production_engine_integrity_audit_ready: 'FAIL',
    certification_status: null,
    phase_integrity_audits: [],
    cross_phase_traceability_chain: [],
    memory_binding_audits: [],
    final_verdict: PRODUCTION_ENGINE_INTEGRITY_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisProductionEngineIntegrityAudit(
  projectRoot?: string
): MovieAnalysisProductionEngineIntegrityAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProductionEngineIntegrityAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const testModeReport = loadJson<Record<string, unknown>>(
    root,
    TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH
  );
  const testModeArtifactPath = path.join(root, TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH);

  if (
    !testModeReport ||
    testModeReport.final_verdict !== TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT ||
    testModeReport.certification_status !== TEST_MODE_EXECUTION_PACKAGE_READY_STATUS ||
    !fs.existsSync(testModeArtifactPath)
  ) {
    issues.push({
      code: 'TEST_PACKAGE_PRECHECK_FAILED',
      message: `Required ${TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT} with ${TEST_MODE_EXECUTION_PACKAGE_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const phaseIntegrityAudits = LEVEL3_PHASE_DEFINITIONS.map((definition) =>
    auditPhase(root, definition)
  );

  for (const audit of phaseIntegrityAudits) {
    if (audit.integrity_status === 'FAIL') {
      issues.push({
        code: 'PHASE_INTEGRITY_FAILURE',
        message: `${audit.check_id} failed for ${audit.phase_level}`,
        severity: 'error',
        phase_level: audit.phase_level,
        check_id: audit.check_id,
      });
    }
  }

  const crossPhaseTraceabilityChain = buildCrossPhaseTraceabilityChain(
    root,
    LEVEL3_PHASE_DEFINITIONS
  );
  const crossPhaseTraceabilityValid = crossPhaseTraceabilityChain.every(
    (entry) => entry.chain_valid
  );
  if (!crossPhaseTraceabilityValid) {
    issues.push({
      code: 'TRACEABILITY_BREAK',
      message: 'Cross-phase artifact chain is broken',
      severity: 'error',
    });
  }

  const memoryBindingAudits = buildMemoryBindingAudits(root);
  const memoryBindingsPreserved =
    memoryBindingAudits.length === PRODUCTION_MEMORY_BINDING_COUNT &&
    memoryBindingAudits.every(
      (binding) => binding.binding_ready === 'PASS' && binding.evidence_exists
    );
  if (!memoryBindingsPreserved) {
    issues.push({
      code: 'MEMORY_BINDING_LOSS',
      message: 'Production memory bindings are incomplete or missing evidence',
      severity: 'error',
    });
  }

  const runtimeCertArtifact = loadJson<Record<string, unknown>>(
    root,
    PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH
  );
  const runtimeSafetyPreserved =
    runtimeCertArtifact !== null &&
    runtimeCertArtifact.test_mode_allowed === true &&
    runtimeCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.runtime_not_executed === true &&
    runtimeCertArtifact.no_external_calls === true &&
    runtimeCertArtifact.no_gpu_execution === true &&
    runtimeCertArtifact.no_file_overwrite === true;
  if (!runtimeSafetyPreserved) {
    issues.push({
      code: 'RUNTIME_SAFETY_LOSS',
      message: 'Production runtime certification safety flags are not preserved',
      severity: 'error',
    });
  }

  const testModeConstraintsPreserved =
    testModeReport.test_mode_enabled === 'PASS' &&
    testModeReport.production_mode_disabled === 'PASS' &&
    testModeReport.external_call_blocked === 'PASS' &&
    testModeReport.gpu_execution_blocked === 'PASS' &&
    testModeReport.traceability_preserved === true;
  if (!testModeConstraintsPreserved) {
    issues.push({
      code: 'TEST_MODE_VIOLATION',
      message: 'Test mode execution package constraints are violated',
      severity: 'error',
    });
  }

  const allArtifactsPresent = phaseIntegrityAudits.every(
    (audit) => audit.report_exists && audit.manifest_exists && audit.artifact_exists
  );
  if (!allArtifactsPresent) {
    issues.push({
      code: 'ARTIFACT_MISSING',
      message: 'One or more Level3 artifacts are missing',
      severity: 'error',
    });
  }

  const reportConsistencyIntegrity = phaseIntegrityAudits.every(
    (audit) => audit.report_manifest_consistent
  );
  const manifestConsistencyIntegrity = reportConsistencyIntegrity;
  if (!reportConsistencyIntegrity) {
    issues.push({
      code: 'REPORT_MANIFEST_MISMATCH',
      message: 'Report/manifest field consistency failed across Level3 phases',
      severity: 'error',
    });
  }

  const traceabilityChainIntegrity = toStatus(
    phaseIntegrityAudits.every((audit) => audit.traceability_preserved) &&
      crossPhaseTraceabilityValid
  );

  const integrityByCheckId = Object.fromEntries(
    phaseIntegrityAudits.map((audit) => [audit.check_id, audit.integrity_status])
  ) as Record<string, AuditStatus>;

  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyPreserved = upstreamArtifactsUnchanged;
  if (!safeCreatePolicyPreserved) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Upstream Level3 artifacts were modified during integrity audit',
      severity: 'error',
    });
  }

  const auditComplete =
    allArtifactsPresent &&
    crossPhaseTraceabilityValid &&
    memoryBindingsPreserved &&
    runtimeSafetyPreserved &&
    testModeConstraintsPreserved &&
    reportConsistencyIntegrity &&
    safeCreatePolicyPreserved &&
    phaseIntegrityAudits.every((audit) => audit.integrity_status === 'PASS');

  const pass =
    auditComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: ProductionEngineIntegrityAuditArtifact = {
    audit_id: 'production-engine-integrity-audit-v1',
    phase: PRODUCTION_ENGINE_INTEGRITY_AUDIT_PHASE,
    generated_at: timestamp,
    level3_phase_count: LEVEL3_PHASE_COUNT,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    phase_integrity_audits: phaseIntegrityAudits,
    cross_phase_traceability_chain: crossPhaseTraceabilityChain,
    memory_binding_audits: memoryBindingAudits,
    runtime_safety_summary: {
      test_mode_allowed: runtimeCertArtifact?.test_mode_allowed === true,
      production_mode_blocked: runtimeCertArtifact?.production_mode_blocked === true,
      runtime_not_executed: runtimeCertArtifact?.runtime_not_executed === true,
      no_external_calls: runtimeCertArtifact?.no_external_calls === true,
      no_gpu_execution: runtimeCertArtifact?.no_gpu_execution === true,
      no_file_overwrite: runtimeCertArtifact?.no_file_overwrite === true,
      runtime_safety_preserved: runtimeSafetyPreserved,
    },
    test_mode_constraints_summary: {
      test_mode_enabled: toStatus(testModeReport.test_mode_enabled === 'PASS'),
      production_mode_disabled: toStatus(testModeReport.production_mode_disabled === 'PASS'),
      external_call_blocked: toStatus(testModeReport.external_call_blocked === 'PASS'),
      gpu_execution_blocked: toStatus(testModeReport.gpu_execution_blocked === 'PASS'),
      test_mode_constraints_preserved: testModeConstraintsPreserved,
    },
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    audit_complete: auditComplete,
  };

  const manifest: MovieAnalysisProductionEngineIntegrityAuditManifest = {
    manifest_id: 'movie-analysis-production-engine-integrity-audit-manifest-v1',
    phase: PRODUCTION_ENGINE_INTEGRITY_AUDIT_PHASE,
    generated_at: timestamp,
    level3_phase_count: LEVEL3_PHASE_COUNT,
    all_level3_artifacts_present: toStatus(allArtifactsPresent),
    cross_phase_traceability_valid: toStatus(crossPhaseTraceabilityValid),
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    runtime_safety_preserved: toStatus(runtimeSafetyPreserved),
    test_mode_constraints_preserved: toStatus(testModeConstraintsPreserved),
    report_consistency_integrity: toStatus(reportConsistencyIntegrity),
    manifest_consistency_integrity: toStatus(manifestConsistencyIntegrity),
    safe_create_policy_preserved: toStatus(safeCreatePolicyPreserved),
    audit_complete: toStatus(auditComplete),
    certification_status: pass ? PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisProductionEngineIntegrityAuditReport = {
    report_id: 'movie-analysis-production-engine-integrity-audit-report-v1',
    phase: PRODUCTION_ENGINE_INTEGRITY_AUDIT_PHASE,
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
    test_mode_execution_package_report_path: TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    production_engine_integrity_audit_export_dir: PRODUCTION_ENGINE_INTEGRITY_AUDIT_EXPORT_DIR,
    production_engine_integrity_audit_manifest_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_MANIFEST_PATH,
    production_engine_integrity_audit_artifact_path: PRODUCTION_ENGINE_INTEGRITY_AUDIT_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level3_phase_count: LEVEL3_PHASE_COUNT,
    foundation_integrity: integrityByCheckId.foundation_integrity ?? 'FAIL',
    blueprint_integrity: integrityByCheckId.blueprint_integrity ?? 'FAIL',
    scene_assembly_integrity: integrityByCheckId.scene_assembly_integrity ?? 'FAIL',
    shot_assembly_integrity: integrityByCheckId.shot_assembly_integrity ?? 'FAIL',
    generation_plan_integrity: integrityByCheckId.generation_plan_integrity ?? 'FAIL',
    runtime_integrity: integrityByCheckId.runtime_integrity ?? 'FAIL',
    certification_integrity: integrityByCheckId.certification_integrity ?? 'FAIL',
    test_package_integrity: integrityByCheckId.test_package_integrity ?? 'FAIL',
    traceability_chain_integrity: traceabilityChainIntegrity,
    memory_binding_integrity: toStatus(memoryBindingsPreserved),
    report_consistency_integrity: toStatus(reportConsistencyIntegrity),
    manifest_consistency_integrity: toStatus(manifestConsistencyIntegrity),
    safe_create_policy_preserved: toStatus(safeCreatePolicyPreserved),
    all_level3_artifacts_present: toStatus(allArtifactsPresent),
    cross_phase_traceability_valid: toStatus(crossPhaseTraceabilityValid),
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    runtime_safety_preserved: toStatus(runtimeSafetyPreserved),
    test_mode_constraints_preserved: toStatus(testModeConstraintsPreserved),
    audit_complete: toStatus(auditComplete),
    artifact_missing: !allArtifactsPresent,
    traceability_break: !crossPhaseTraceabilityValid,
    memory_binding_loss: !memoryBindingsPreserved,
    runtime_safety_loss: !runtimeSafetyPreserved,
    test_mode_violation: !testModeConstraintsPreserved,
    report_manifest_mismatch: !reportConsistencyIntegrity,
    safe_create_policy_violation: !safeCreatePolicyPreserved,
    production_engine_integrity_audit_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_ENGINE_INTEGRITY_VERIFIED_STATUS : null,
    phase_integrity_audits: phaseIntegrityAudits,
    cross_phase_traceability_chain: crossPhaseTraceabilityChain,
    memory_binding_audits: memoryBindingAudits,
    final_verdict: pass
      ? PRODUCTION_ENGINE_INTEGRITY_AUDIT_PASS_VERDICT
      : PRODUCTION_ENGINE_INTEGRITY_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_INTEGRITY_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
