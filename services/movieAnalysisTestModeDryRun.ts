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
  EXECUTION_SCOPE,
  TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
  TEST_MODE_EXECUTION_CERTIFIED_STATUS,
  type TestModeExecutionCertificationArtifact,
} from './movieAnalysisTestModeExecutionCertification.js';
import {
  TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_PASS_VERDICT,
  TEST_MODE_EXECUTION_PACKAGE_REPORT_PATH,
  TEST_MODE_EXECUTION_PACKAGE_READY_STATUS,
  type TestModeExecutionPackage,
  type TestModeExecutionPackageArtifact,
} from './movieAnalysisTestModeExecutionPackage.js';
import {
  TEST_MODE_READINESS_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_READINESS_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_READINESS_CERTIFICATION_REPORT_PATH,
  TEST_MODE_READY_FOR_NEXT_STAGE_STATUS,
} from './movieAnalysisTestModeReadinessCertification.js';
import { SAFE_CREATE_POLICY } from './movieAnalysisTestModeExecutionAudit.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TEST_MODE_DRY_RUN_PHASE = 'PHASE-LEVEL3-014-TEST_MODE_DRY_RUN_V1' as const;
export const TEST_MODE_DRY_RUN_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_TEST_MODE_DRY_RUN_V1' as const;
export const TEST_MODE_DRY_RUN_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_TEST_MODE_DRY_RUN_V1' as const;
export const TEST_MODE_DRY_RUN_COMPLETE_STATUS = 'TEST_MODE_DRY_RUN_COMPLETE' as const;
export const TEST_MODE_DRY_RUN_DIR = 'reports/movie_analysis_test_mode_dry_run' as const;
export const TEST_MODE_DRY_RUN_REPORT_PATH =
  'reports/movie_analysis_test_mode_dry_run/movie-analysis-test-mode-dry-run-report.json' as const;
export const TEST_MODE_DRY_RUN_MD_PATH =
  'reports/movie_analysis_test_mode_dry_run/MOVIE_ANALYSIS_TEST_MODE_DRY_RUN.md' as const;
export const TEST_MODE_DRY_RUN_EXPORT_DIR = 'exports/movie_analysis_test_mode_dry_run' as const;
export const TEST_MODE_DRY_RUN_MANIFEST_PATH =
  'exports/movie_analysis_test_mode_dry_run/movie-analysis-test-mode-dry-run-manifest.json' as const;
export const TEST_MODE_DRY_RUN_ARTIFACT_PATH =
  'exports/movie_analysis_test_mode_dry_run/test-mode-dry-run.json' as const;

export const LEVEL3_DRY_RUN_PHASE_COUNT = 13 as const;
export const MOCK_ARTIFACT_WRITE_SCOPE = 'exports/movie_analysis_test_mode_dry_run/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT, SAFE_CREATE_POLICY };

export type SimulationStatus = 'PASS' | 'FAIL';

export type TestModeDryRunIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  test_package_id?: string;
  check_id?: string;
};

export type DryRunCheck = {
  check_id: string;
  check_label: string;
  status: SimulationStatus;
};

export type MockDryRunOutput = {
  output_id: string;
  test_package_id: string;
  test_unit_id: string;
  runtime_unit_ref: string;
  queue_order: number;
  mock_image_output_ref: string;
  mock_video_output_ref: string;
  mock_image_target: string;
  mock_video_target: string;
  simulation_step: string;
  output_ready: SimulationStatus;
};

export type DryRunPackageSimulation = {
  test_package_id: string;
  execution_queue_simulated: boolean;
  runtime_units_simulated: number;
  mock_outputs_generated: number;
  mock_outputs: MockDryRunOutput[];
  traceability_integrity: SimulationStatus;
  simulation_ready: SimulationStatus;
};

export type TestModeDryRunArtifact = {
  dry_run_id: string;
  phase: typeof TEST_MODE_DRY_RUN_PHASE;
  generated_at: string;
  level3_dry_run_phase_count: typeof LEVEL3_DRY_RUN_PHASE_COUNT;
  test_mode_execution_certification_artifact_path: typeof TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  dry_run_policy: {
    execution_scope: typeof EXECUTION_SCOPE;
    mock_output_only: true;
    real_generation: false;
    external_call_allowed: false;
    gpu_execution_allowed: false;
    mock_artifact_write_scope: typeof MOCK_ARTIFACT_WRITE_SCOPE;
    dry_run_artifact_manifest_required: true;
  };
  package_simulations: DryRunPackageSimulation[];
  dry_run_checks: DryRunCheck[];
  mock_output_count: number;
  traceability_preserved: boolean;
  memory_bindings_preserved: boolean;
  production_still_blocked: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    mock_artifact_write_scope: typeof MOCK_ARTIFACT_WRITE_SCOPE;
    mock_artifact_write_scope_valid: boolean;
    upstream_artifacts_unchanged: boolean;
  };
  dry_run_complete: boolean;
  simulation_complete: boolean;
};

export type MovieAnalysisTestModeDryRunManifest = {
  manifest_id: string;
  phase: typeof TEST_MODE_DRY_RUN_PHASE;
  generated_at: string;
  level3_dry_run_phase_count: typeof LEVEL3_DRY_RUN_PHASE_COUNT;
  execution_scope: typeof EXECUTION_SCOPE;
  mock_artifact_write_scope: typeof MOCK_ARTIFACT_WRITE_SCOPE;
  dry_run_artifact_manifest_required: true;
  execution_queue_simulated: SimulationStatus;
  runtime_units_simulated: SimulationStatus;
  mock_outputs_generated: SimulationStatus;
  traceability_preserved: boolean;
  memory_bindings_preserved: SimulationStatus;
  safe_create_policy_preserved: SimulationStatus;
  dry_run_complete: SimulationStatus;
  simulation_complete: SimulationStatus;
  mock_outputs_present: SimulationStatus;
  mock_artifact_write_scope_valid: SimulationStatus;
  dry_run_manifest_present: SimulationStatus;
  production_still_blocked: SimulationStatus;
  certification_status: typeof TEST_MODE_DRY_RUN_COMPLETE_STATUS | null;
};

export type MovieAnalysisTestModeDryRunReport = {
  report_id: string;
  phase: typeof TEST_MODE_DRY_RUN_PHASE;
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
  mock_artifact_write_scope: typeof MOCK_ARTIFACT_WRITE_SCOPE;
  dry_run_artifact_manifest_required: true;
  test_mode_execution_certification_report_path: typeof TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH;
  test_mode_execution_certification_artifact_path: typeof TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH;
  test_mode_execution_package_artifact_path: typeof TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH;
  test_mode_dry_run_export_dir: typeof TEST_MODE_DRY_RUN_EXPORT_DIR;
  test_mode_dry_run_manifest_path: typeof TEST_MODE_DRY_RUN_MANIFEST_PATH;
  test_mode_dry_run_artifact_path: typeof TEST_MODE_DRY_RUN_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  level3_dry_run_phase_count: typeof LEVEL3_DRY_RUN_PHASE_COUNT;
  test_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  mock_output_count: number;
  execution_queue_simulated: SimulationStatus;
  runtime_units_simulated: SimulationStatus;
  mock_outputs_generated: SimulationStatus;
  traceability_preserved: boolean;
  memory_bindings_preserved: SimulationStatus;
  safe_create_policy_preserved: SimulationStatus;
  dry_run_complete: SimulationStatus;
  simulation_complete: SimulationStatus;
  mock_outputs_present: SimulationStatus;
  mock_artifact_write_scope_valid: SimulationStatus;
  dry_run_manifest_present: SimulationStatus;
  production_still_blocked: SimulationStatus;
  execution_scope_invalid: boolean;
  dry_run_not_allowed: boolean;
  mock_output_missing: boolean;
  real_generation_detected: boolean;
  production_execution_unblocked: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  mock_artifact_write_scope_violation: boolean;
  dry_run_manifest_missing: boolean;
  traceability_loss: boolean;
  memory_binding_loss: boolean;
  safe_create_policy_violation: boolean;
  test_mode_dry_run_ready: SimulationStatus;
  certification_status: typeof TEST_MODE_DRY_RUN_COMPLETE_STATUS | null;
  package_simulations: DryRunPackageSimulation[];
  dry_run_checks: DryRunCheck[];
  final_verdict: typeof TEST_MODE_DRY_RUN_PASS_VERDICT | typeof TEST_MODE_DRY_RUN_FAIL_VERDICT;
  issues: TestModeDryRunIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type Level3DryRunPhaseEntry = {
  phase_level: string;
  pass_verdict: string;
  certification_status: string;
  ready_field: string;
  report_path: string;
  artifact_path: string;
};

const LEVEL3_DRY_RUN_PHASE_ENTRIES: Level3DryRunPhaseEntry[] = [
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
];

const READ_ONLY_UPSTREAM_PATHS = LEVEL3_DRY_RUN_PHASE_ENTRIES.map((entry) => entry.artifact_path);

const MOCK_EXPORT_WRITE_PATHS = [
  TEST_MODE_DRY_RUN_MANIFEST_PATH,
  TEST_MODE_DRY_RUN_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  TEST_MODE_DRY_RUN_DIR,
  TEST_MODE_DRY_RUN_EXPORT_DIR,
  TEST_MODE_DRY_RUN_REPORT_PATH,
  TEST_MODE_DRY_RUN_MD_PATH,
  ...MOCK_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): SimulationStatus {
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

function isUnderMockArtifactWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(MOCK_ARTIFACT_WRITE_SCOPE) ||
    relativePath === MOCK_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function mockOutputRef(testPackageId: string, testUnitId: string, kind: 'image' | 'video'): string {
  return `${MOCK_ARTIFACT_WRITE_SCOPE}mock_outputs/${testPackageId}/${testUnitId}/mock_${kind}.json`;
}

function simulatePackage(testPackage: TestModeExecutionPackage): DryRunPackageSimulation {
  const queueSimulated =
    testPackage.test_execution_queue.length === testPackage.test_units.length &&
    testPackage.test_execution_queue.every((entry, index) => entry.queue_order === index + 1);

  const mockOutputs: MockDryRunOutput[] = testPackage.test_units.map((unit) => {
    const mockEntry = testPackage.mock_execution_plan.entries.find(
      (entry) => entry.test_unit_id === unit.unit_id
    );
    const outputReady =
      unit.test_ready === 'PASS' &&
      unit.mock_image_target.startsWith('mock_') &&
      unit.mock_video_target.startsWith('mock_') &&
      mockEntry?.mock_ready === 'PASS';

    return {
      output_id: `mock_output_${unit.unit_id}`,
      test_package_id: testPackage.test_package_id,
      test_unit_id: unit.unit_id,
      runtime_unit_ref: unit.runtime_unit_ref,
      queue_order: unit.execution_order,
      mock_image_output_ref: mockOutputRef(testPackage.test_package_id, unit.unit_id, 'image'),
      mock_video_output_ref: mockOutputRef(testPackage.test_package_id, unit.unit_id, 'video'),
      mock_image_target: unit.mock_image_target,
      mock_video_target: unit.mock_video_target,
      simulation_step: mockEntry?.mock_execution_step ?? `dry_run_${unit.runtime_unit_ref}`,
      output_ready: toStatus(outputReady),
    };
  });

  const runtimeUnitsSimulated = mockOutputs.every((output) => output.output_ready === 'PASS');
  const simulationReady =
    testPackage.test_mode === true &&
    testPackage.production_mode === false &&
    testPackage.test_package_ready === 'PASS' &&
    queueSimulated &&
    runtimeUnitsSimulated &&
    testPackage.traceability_chain.trace_integrity === 'PASS';

  return {
    test_package_id: testPackage.test_package_id,
    execution_queue_simulated: queueSimulated,
    runtime_units_simulated: mockOutputs.length,
    mock_outputs_generated: mockOutputs.filter((output) => output.output_ready === 'PASS').length,
    mock_outputs: mockOutputs,
    traceability_integrity: testPackage.traceability_chain.trace_integrity,
    simulation_ready: toStatus(simulationReady),
  };
}

function allPhasesCertified(root: string): boolean {
  return LEVEL3_DRY_RUN_PHASE_ENTRIES.every((entry) => {
    const report = loadJson<Record<string, unknown>>(root, entry.report_path);
    return (
      report !== null &&
      fs.existsSync(path.join(root, entry.artifact_path)) &&
      report.final_verdict === entry.pass_verdict &&
      report.certification_status === entry.certification_status &&
      report[entry.ready_field] === 'PASS'
    );
  });
}

function buildMarkdown(report: MovieAnalysisTestModeDryRunReport): string {
  const lines = [
    '# Movie Analysis Test Mode Dry Run',
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
    '## Dry Run Policy',
    '',
    `- execution_scope: ${report.execution_scope}`,
    `- mock_output_only: ${report.mock_output_only}`,
    `- real_generation: ${report.real_generation}`,
    `- mock_artifact_write_scope: ${report.mock_artifact_write_scope}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| execution_queue_simulated | ${report.execution_queue_simulated} |`,
    `| runtime_units_simulated | ${report.runtime_units_simulated} |`,
    `| mock_outputs_generated | ${report.mock_outputs_generated} |`,
    `| mock_outputs_present | ${report.mock_outputs_present} |`,
    `| dry_run_complete | ${report.dry_run_complete} |`,
    `| simulation_complete | ${report.simulation_complete} |`,
    `| production_still_blocked | ${report.production_still_blocked} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| safe_create_policy_preserved | ${report.safe_create_policy_preserved} |`,
    '',
    '## Package Simulations',
    ''
  );

  for (const simulation of report.package_simulations) {
    lines.push(
      `- ${simulation.test_package_id}: ready=${simulation.simulation_ready} queue=${simulation.execution_queue_simulated} units=${simulation.runtime_units_simulated} outputs=${simulation.mock_outputs_generated}`
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
  issues: TestModeDryRunIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MovieAnalysisTestModeDryRunReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MovieAnalysisTestModeDryRunReport = {
    report_id: 'movie-analysis-test-mode-dry-run-report-v1',
    phase: TEST_MODE_DRY_RUN_PHASE,
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
    mock_artifact_write_scope: MOCK_ARTIFACT_WRITE_SCOPE,
    dry_run_artifact_manifest_required: true,
    test_mode_execution_certification_report_path: TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
    test_mode_execution_certification_artifact_path: TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    test_mode_dry_run_export_dir: TEST_MODE_DRY_RUN_EXPORT_DIR,
    test_mode_dry_run_manifest_path: TEST_MODE_DRY_RUN_MANIFEST_PATH,
    test_mode_dry_run_artifact_path: TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    level3_dry_run_phase_count: LEVEL3_DRY_RUN_PHASE_COUNT,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    mock_output_count: 0,
    execution_queue_simulated: 'FAIL',
    runtime_units_simulated: 'FAIL',
    mock_outputs_generated: 'FAIL',
    traceability_preserved: false,
    memory_bindings_preserved: 'FAIL',
    safe_create_policy_preserved: toStatus(upstreamUnchanged),
    dry_run_complete: 'FAIL',
    simulation_complete: 'FAIL',
    mock_outputs_present: 'FAIL',
    mock_artifact_write_scope_valid: 'FAIL',
    dry_run_manifest_present: 'FAIL',
    production_still_blocked: 'FAIL',
    execution_scope_invalid: true,
    dry_run_not_allowed: true,
    mock_output_missing: true,
    real_generation_detected: true,
    production_execution_unblocked: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    mock_artifact_write_scope_violation: true,
    dry_run_manifest_missing: true,
    traceability_loss: true,
    memory_binding_loss: true,
    safe_create_policy_violation: !upstreamUnchanged,
    test_mode_dry_run_ready: 'FAIL',
    certification_status: null,
    package_simulations: [],
    dry_run_checks: [],
    final_verdict: TEST_MODE_DRY_RUN_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_DRY_RUN_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisTestModeDryRun(
  projectRoot?: string
): MovieAnalysisTestModeDryRunReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TestModeDryRunIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const executionCertReport = loadJson<Record<string, unknown>>(
    root,
    TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH
  );
  const executionCertArtifactPath = path.join(root, TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH);

  if (
    !executionCertReport ||
    executionCertReport.final_verdict !== TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT ||
    executionCertReport.certification_status !== TEST_MODE_EXECUTION_CERTIFIED_STATUS ||
    executionCertReport.execution_scope !== EXECUTION_SCOPE ||
    executionCertReport.dry_run_allowed !== 'PASS' ||
    executionCertReport.mock_output_only !== true ||
    executionCertReport.production_execution_blocked !== 'PASS' ||
    !fs.existsSync(executionCertArtifactPath)
  ) {
    issues.push({
      code: 'EXECUTION_CERTIFICATION_PRECHECK_FAILED',
      message: `Required ${TEST_MODE_EXECUTION_CERTIFICATION_PASS_VERDICT} with ${TEST_MODE_EXECUTION_CERTIFIED_STATUS} and dry-run policy`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const executionCertArtifact = loadJson<TestModeExecutionCertificationArtifact>(
    root,
    TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH
  );
  const testModeArtifact = loadJson<TestModeExecutionPackageArtifact>(
    root,
    TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH
  );
  const foundationArtifact = loadJson<{
    memory_bindings: Array<{ binding_ready: SimulationStatus }>;
  }>(root, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH);
  const runtimeCertArtifact = loadJson<{
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
  }>(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);

  if (!executionCertArtifact || !testModeArtifact || !foundationArtifact || !runtimeCertArtifact) {
    issues.push({
      code: 'UPSTREAM_ARTIFACT_MISSING',
      message: 'Missing execution certification, test mode package, foundation, or runtime certification artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  if (!allPhasesCertified(root)) {
    issues.push({
      code: 'PHASE_NOT_CERTIFIED',
      message: 'One or more Level3 phases are not certified',
      severity: 'error',
    });
  }

  const packageSimulations = testModeArtifact.test_packages.map((testPackage) =>
    simulatePackage(testPackage)
  );

  for (const simulation of packageSimulations) {
    if (simulation.simulation_ready === 'FAIL') {
      issues.push({
        code: 'PACKAGE_SIMULATION_FAILURE',
        message: `Dry run simulation failed for ${simulation.test_package_id}`,
        severity: 'error',
        test_package_id: simulation.test_package_id,
      });
    }
  }

  const executionScopeValid =
    executionCertArtifact.execution_policy.execution_scope === EXECUTION_SCOPE &&
    executionCertReport.execution_scope === EXECUTION_SCOPE;

  const dryRunAllowed =
    executionCertArtifact.dry_run_allowed === true &&
    executionCertArtifact.dry_run_execution_allowed === true &&
    testModeArtifact.test_packages.every(
      (testPackage) =>
        testPackage.dry_run_flags.planning_only === true &&
        testPackage.dry_run_flags.test_mode === true &&
        testPackage.dry_run_flags.mock_execution_only === true
    );

  const mockOutputOnly =
    executionCertArtifact.mock_output_only === true &&
    packageSimulations.every((simulation) => simulation.mock_outputs_generated > 0) &&
    packageSimulations.every((simulation) =>
      simulation.mock_outputs.every(
        (output) =>
          output.mock_image_target.startsWith('mock_') &&
          output.mock_video_target.startsWith('mock_') &&
          isUnderMockArtifactWriteScope(output.mock_image_output_ref) &&
          isUnderMockArtifactWriteScope(output.mock_video_output_ref)
      )
    );

  const realGenerationDetected =
    executionCertArtifact.real_generation_blocked !== true ||
    runtimeCertArtifact.real_generation_blocked !== true ||
    testModeArtifact.test_packages.some(
      (testPackage) =>
        testPackage.dry_run_flags.image_generation === true ||
        testPackage.dry_run_flags.video_generation === true
    );

  const productionExecutionBlocked =
    executionCertArtifact.production_execution_blocked === true &&
    executionCertArtifact.production_still_blocked === true &&
    runtimeCertArtifact.production_mode_blocked === true &&
    testModeArtifact.test_packages.every((testPackage) => testPackage.production_mode === false);

  const externalCallBlocked =
    executionCertArtifact.external_call_blocked === true &&
    runtimeCertArtifact.no_external_calls === true &&
    testModeArtifact.test_packages.every((testPackage) => testPackage.external_call_allowed === false);

  const gpuExecutionBlocked =
    executionCertArtifact.gpu_execution_blocked === true &&
    runtimeCertArtifact.no_gpu_execution === true &&
    testModeArtifact.test_packages.every((testPackage) => testPackage.gpu_execution_allowed === false);

  const executionQueueSimulated = packageSimulations.every(
    (simulation) => simulation.execution_queue_simulated
  );
  const runtimeUnitsSimulated =
    packageSimulations.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
    packageSimulations.every(
      (simulation) =>
        simulation.runtime_units_simulated === simulation.mock_outputs.length &&
        simulation.mock_outputs.every((output) => output.output_ready === 'PASS')
    );

  const mockOutputCount = packageSimulations.reduce(
    (total, simulation) => total + simulation.mock_outputs_generated,
    0
  );
  const mockOutputsGenerated = mockOutputCount > 0;
  const mockOutputsPresent =
    mockOutputsGenerated &&
    packageSimulations.every(
      (simulation) => simulation.mock_outputs_generated === simulation.mock_outputs.length
    );

  const traceabilityPreserved =
    executionCertArtifact.traceability_preserved === true &&
    packageSimulations.every((simulation) => simulation.traceability_integrity === 'PASS');

  const memoryBindingsPreserved =
    executionCertArtifact.memory_bindings_preserved === true &&
    foundationArtifact.memory_bindings.length === PRODUCTION_MEMORY_BINDING_COUNT &&
    foundationArtifact.memory_bindings.every((binding) => binding.binding_ready === 'PASS');

  const mockArtifactWriteScopeValid = MOCK_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderMockArtifactWriteScope(writePath)
  );

  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyPreserved = upstreamArtifactsUnchanged && mockArtifactWriteScopeValid;

  const simulationComplete =
    packageSimulations.every((simulation) => simulation.simulation_ready === 'PASS') &&
    executionQueueSimulated &&
    runtimeUnitsSimulated &&
    mockOutputsPresent;

  const productionStillBlocked = productionExecutionBlocked && !realGenerationDetected;

  const dryRunComplete =
    allPhasesCertified(root) &&
    executionScopeValid &&
    dryRunAllowed &&
    mockOutputOnly &&
    !realGenerationDetected &&
    productionStillBlocked &&
    externalCallBlocked &&
    gpuExecutionBlocked &&
    simulationComplete &&
    traceabilityPreserved &&
    memoryBindingsPreserved &&
    safeCreatePolicyPreserved &&
    mockArtifactWriteScopeValid;

  const executionScopeInvalid = !executionScopeValid;
  const dryRunNotAllowed = !dryRunAllowed;
  const mockOutputMissing = !mockOutputsPresent;
  const realGenerationDetectedFlag = realGenerationDetected;
  const productionExecutionUnblocked = !productionExecutionBlocked;
  const externalCallEnabled = !externalCallBlocked;
  const gpuExecutionEnabled = !gpuExecutionBlocked;
  const mockArtifactWriteScopeViolation = !mockArtifactWriteScopeValid;
  const dryRunManifestMissing = false;
  const traceabilityLoss = !traceabilityPreserved;
  const memoryBindingLoss = !memoryBindingsPreserved;
  const safeCreatePolicyViolation = !safeCreatePolicyPreserved;

  if (executionScopeInvalid) {
    issues.push({ code: 'EXECUTION_SCOPE_INVALID', message: 'Execution scope is invalid', severity: 'error' });
  }
  if (dryRunNotAllowed) {
    issues.push({ code: 'DRY_RUN_NOT_ALLOWED', message: 'Dry run is not allowed', severity: 'error' });
  }
  if (mockOutputMissing) {
    issues.push({ code: 'MOCK_OUTPUT_MISSING', message: 'Mock outputs are missing', severity: 'error' });
  }
  if (realGenerationDetectedFlag) {
    issues.push({ code: 'REAL_GENERATION_DETECTED', message: 'Real generation detected', severity: 'error' });
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
  if (mockArtifactWriteScopeViolation) {
    issues.push({
      code: 'MOCK_ARTIFACT_WRITE_SCOPE_VIOLATION',
      message: 'Mock artifact write scope was violated',
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

  const dryRunChecks: DryRunCheck[] = [
    {
      check_id: 'execution_queue_simulated',
      check_label: 'Execution Queue Simulated',
      status: toStatus(executionQueueSimulated),
    },
    {
      check_id: 'runtime_units_simulated',
      check_label: 'Runtime Units Simulated',
      status: toStatus(runtimeUnitsSimulated),
    },
    {
      check_id: 'mock_outputs_generated',
      check_label: 'Mock Outputs Generated',
      status: toStatus(mockOutputsGenerated),
    },
    {
      check_id: 'dry_run_artifact_manifest_required',
      check_label: 'Dry Run Artifact Manifest Required',
      status: 'PASS',
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
      check_id: 'safe_create_policy_preserved',
      check_label: 'Safe Create Policy Preserved',
      status: toStatus(safeCreatePolicyPreserved),
    },
  ];

  const pass = dryRunComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: TestModeDryRunArtifact = {
    dry_run_id: 'test-mode-dry-run-v1',
    phase: TEST_MODE_DRY_RUN_PHASE,
    generated_at: timestamp,
    level3_dry_run_phase_count: LEVEL3_DRY_RUN_PHASE_COUNT,
    test_mode_execution_certification_artifact_path: TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    dry_run_policy: {
      execution_scope: EXECUTION_SCOPE,
      mock_output_only: true,
      real_generation: false,
      external_call_allowed: false,
      gpu_execution_allowed: false,
      mock_artifact_write_scope: MOCK_ARTIFACT_WRITE_SCOPE,
      dry_run_artifact_manifest_required: true,
    },
    package_simulations: packageSimulations,
    dry_run_checks: dryRunChecks,
    mock_output_count: mockOutputCount,
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: memoryBindingsPreserved,
    production_still_blocked: productionStillBlocked,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      mock_artifact_write_scope: MOCK_ARTIFACT_WRITE_SCOPE,
      mock_artifact_write_scope_valid: mockArtifactWriteScopeValid,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    dry_run_complete: dryRunComplete,
    simulation_complete: simulationComplete,
  };

  const manifest: MovieAnalysisTestModeDryRunManifest = {
    manifest_id: 'movie-analysis-test-mode-dry-run-manifest-v1',
    phase: TEST_MODE_DRY_RUN_PHASE,
    generated_at: timestamp,
    level3_dry_run_phase_count: LEVEL3_DRY_RUN_PHASE_COUNT,
    execution_scope: EXECUTION_SCOPE,
    mock_artifact_write_scope: MOCK_ARTIFACT_WRITE_SCOPE,
    dry_run_artifact_manifest_required: true,
    execution_queue_simulated: toStatus(executionQueueSimulated),
    runtime_units_simulated: toStatus(runtimeUnitsSimulated),
    mock_outputs_generated: toStatus(mockOutputsGenerated),
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_preserved: toStatus(safeCreatePolicyPreserved),
    dry_run_complete: toStatus(dryRunComplete),
    simulation_complete: toStatus(simulationComplete),
    mock_outputs_present: toStatus(mockOutputsPresent),
    mock_artifact_write_scope_valid: toStatus(mockArtifactWriteScopeValid),
    dry_run_manifest_present: 'PASS',
    production_still_blocked: toStatus(productionStillBlocked),
    certification_status: pass ? TEST_MODE_DRY_RUN_COMPLETE_STATUS : null,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_DRY_RUN_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisTestModeDryRunReport = {
    report_id: 'movie-analysis-test-mode-dry-run-report-v1',
    phase: TEST_MODE_DRY_RUN_PHASE,
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
    mock_artifact_write_scope: MOCK_ARTIFACT_WRITE_SCOPE,
    dry_run_artifact_manifest_required: true,
    test_mode_execution_certification_report_path: TEST_MODE_EXECUTION_CERTIFICATION_REPORT_PATH,
    test_mode_execution_certification_artifact_path: TEST_MODE_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
    test_mode_execution_package_artifact_path: TEST_MODE_EXECUTION_PACKAGE_ARTIFACT_PATH,
    test_mode_dry_run_export_dir: TEST_MODE_DRY_RUN_EXPORT_DIR,
    test_mode_dry_run_manifest_path: TEST_MODE_DRY_RUN_MANIFEST_PATH,
    test_mode_dry_run_artifact_path: TEST_MODE_DRY_RUN_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level3_dry_run_phase_count: LEVEL3_DRY_RUN_PHASE_COUNT,
    test_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    mock_output_count: mockOutputCount,
    execution_queue_simulated: toStatus(executionQueueSimulated),
    runtime_units_simulated: toStatus(runtimeUnitsSimulated),
    mock_outputs_generated: toStatus(mockOutputsGenerated),
    traceability_preserved: traceabilityPreserved,
    memory_bindings_preserved: toStatus(memoryBindingsPreserved),
    safe_create_policy_preserved: toStatus(safeCreatePolicyPreserved),
    dry_run_complete: toStatus(dryRunComplete),
    simulation_complete: toStatus(simulationComplete),
    mock_outputs_present: toStatus(mockOutputsPresent),
    mock_artifact_write_scope_valid: toStatus(mockArtifactWriteScopeValid),
    dry_run_manifest_present: 'PASS',
    production_still_blocked: toStatus(productionStillBlocked),
    execution_scope_invalid: executionScopeInvalid,
    dry_run_not_allowed: dryRunNotAllowed,
    mock_output_missing: mockOutputMissing,
    real_generation_detected: realGenerationDetectedFlag,
    production_execution_unblocked: productionExecutionUnblocked,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    mock_artifact_write_scope_violation: mockArtifactWriteScopeViolation,
    dry_run_manifest_missing: dryRunManifestMissing,
    traceability_loss: traceabilityLoss,
    memory_binding_loss: memoryBindingLoss,
    safe_create_policy_violation: safeCreatePolicyViolation,
    test_mode_dry_run_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? TEST_MODE_DRY_RUN_COMPLETE_STATUS : null,
    package_simulations: packageSimulations,
    dry_run_checks: dryRunChecks,
    final_verdict: pass ? TEST_MODE_DRY_RUN_PASS_VERDICT : TEST_MODE_DRY_RUN_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, TEST_MODE_DRY_RUN_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEST_MODE_DRY_RUN_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
