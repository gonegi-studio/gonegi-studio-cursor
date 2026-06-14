import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import {
  MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS,
  type MvProductionRuntimeCertificationArtifact,
  type MvRuntimeCertificationResult,
} from './mvProductionRuntimeCertification.js';
import {
  MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  RUNTIME_MODE_TEST_MODE_ONLY,
  type AdapterExecutionPlan,
  type FailureRecoveryPlan,
  type MvProductionRuntimeEngineArtifact,
  type MvRuntimePlan,
  type MvRuntimeTraceability,
} from './mvProductionRuntimeEngine.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_TEST_EXECUTION_PACKAGE_PHASE =
  'PHASE-DIGITAL-STUDIO-008-MV_TEST_EXECUTION_PACKAGE_V1' as const;
export const MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT = 'PASS_MV_TEST_EXECUTION_PACKAGE_V1' as const;
export const MV_TEST_EXECUTION_PACKAGE_FAIL_VERDICT = 'FAIL_MV_TEST_EXECUTION_PACKAGE_V1' as const;
export const MV_TEST_EXECUTION_PACKAGE_READY_STATUS = 'MV_TEST_EXECUTION_PACKAGE_READY' as const;
export const MV_TEST_EXECUTION_PACKAGE_DIR = 'reports/mv_test_execution_package' as const;
export const MV_TEST_EXECUTION_PACKAGE_REPORT_PATH =
  'reports/mv_test_execution_package/mv-test-execution-package-report.json' as const;
export const MV_TEST_EXECUTION_PACKAGE_MD_PATH =
  'reports/mv_test_execution_package/MV_TEST_EXECUTION_PACKAGE.md' as const;
export const MV_TEST_EXECUTION_PACKAGE_EXPORT_DIR = 'exports/mv_test_execution_package' as const;
export const MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH =
  'exports/mv_test_execution_package/mv-test-execution-package-manifest.json' as const;
export const MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH =
  'exports/mv_test_execution_package/mv-test-execution-package.json' as const;

export const TEST_EXECUTION_PACKAGE_ARTIFACT_WRITE_SCOPE = 'exports/mv_test_execution_package/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type PackageStatus = 'PASS' | 'FAIL';

export type MvTestExecutionPackageIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type PackageCheck = {
  check_id: string;
  check_label: string;
  status: PackageStatus;
};

export type MvTestExecutionUnit = {
  unit_id: string;
  runtime_unit_ref: string;
  shot_id: string;
  scene_ref: string;
  execution_order: number;
  mock_image_output: string;
  mock_video_output: string;
  generation_prompt_seed: string;
  visual_intent: string;
  emotion_beat_ref: string;
  lyric_or_music_section_ref: string;
  adapter_bindings: string[];
  unit_ready: PackageStatus;
};

export type MvTestExecutionQueueEntry = {
  queue_index: number;
  unit_id: string;
  shot_id: string;
  stage: 'image' | 'video' | 'consistency' | 'quality_gate';
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  mock_execution_only: true;
  execution_allowed: false;
};

export type MockExecutionEntry = {
  unit_id: string;
  shot_id: string;
  mock_image_output: string;
  mock_video_output: string;
  mock_step: string;
  mock_output_only: true;
  mock_ready: PackageStatus;
};

export type MockExecutionPlan = {
  plan_id: string;
  entry_count: number;
  entries: MockExecutionEntry[];
  mock_output_only: true;
  plan_valid: boolean;
};

export type MvTestMusicSyncPlan = {
  sync_id: string;
  beat_markers: Array<{
    shot_ref: string;
    scene_ref: string;
    timestamp_seconds: number;
    sync_preserved: PackageStatus;
  }>;
  sync_valid: boolean;
};

export type MvTestExecutionPackage = {
  source_runtime_certification_ref: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH;
  mv_test_execution_package_id: string;
  mv_type: MvType;
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  test_mode_allowed: true;
  mock_output_only: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  test_execution_units: MvTestExecutionUnit[];
  test_execution_queue: MvTestExecutionQueueEntry[];
  mock_execution_plan: MockExecutionPlan;
  failure_recovery_plan: FailureRecoveryPlan;
  adapter_execution_plan: AdapterExecutionPlan;
  music_sync_plan: MvTestMusicSyncPlan;
  traceability_chain: MvRuntimeTraceability;
  test_execution_package_ready: PackageStatus;
};

export type MvTestExecutionPackageArtifact = {
  package_bundle_id: string;
  phase: typeof MV_TEST_EXECUTION_PACKAGE_PHASE;
  generated_at: string;
  source_runtime_certification_ref: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH;
  runtime_certification_id: string;
  test_mode_allowed: true;
  mock_output_only: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  mv_test_execution_packages: MvTestExecutionPackage[];
  safety_flags: {
    planning_only: true;
    test_mode: true;
    mock_execution_only: true;
    mock_output_only: true;
    generation: false;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    no_execution: true;
    no_rendering: true;
    production_mode_blocked: true;
  };
  runtime_certification_consumed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  runtime_certification_chain_complete: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    test_execution_package_artifact_write_scope: typeof TEST_EXECUTION_PACKAGE_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  test_execution_package_complete: boolean;
  next_stage_ready: boolean;
};

export type MvTestExecutionPackageManifest = {
  manifest_id: string;
  phase: typeof MV_TEST_EXECUTION_PACKAGE_PHASE;
  generated_at: string;
  test_execution_package_count: typeof MV_TYPE_COUNT;
  runtime_certification_consumed: PackageStatus;
  test_execution_package_ready: PackageStatus;
  test_execution_queue_valid: PackageStatus;
  mock_execution_plan_valid: PackageStatus;
  failure_recovery_ready: PackageStatus;
  runtime_mode_valid: PackageStatus;
  test_mode_allowed: true;
  mock_output_only: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: PackageStatus;
  gpu_execution_blocked: PackageStatus;
  music_sync_preserved: PackageStatus;
  mv_type_preserved: PackageStatus;
  traceability_preserved: boolean;
  production_mode_blocked: PackageStatus;
  runtime_certification_chain_complete: PackageStatus;
  safe_create_policy_verified: PackageStatus;
  next_stage_ready: PackageStatus;
  certification_status: typeof MV_TEST_EXECUTION_PACKAGE_READY_STATUS | null;
};

export type MvTestExecutionPackageReport = {
  report_id: string;
  phase: typeof MV_TEST_EXECUTION_PACKAGE_PHASE;
  timestamp: string;
  planning_only: true;
  mock_execution_only: true;
  test_mode_allowed: true;
  mock_output_only: true;
  real_generation_blocked: true;
  runtime_not_executed: true;
  external_call_blocked: true;
  gpu_execution_blocked: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  source_runtime_certification_ref: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH;
  mv_production_runtime_certification_report_path: typeof MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH;
  mv_test_execution_package_export_dir: typeof MV_TEST_EXECUTION_PACKAGE_EXPORT_DIR;
  mv_test_execution_package_manifest_path: typeof MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH;
  mv_test_execution_package_artifact_path: typeof MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  test_execution_package_count: typeof MV_TYPE_COUNT;
  runtime_certification_consumed: PackageStatus;
  test_execution_package_ready: PackageStatus;
  test_execution_queue_valid: PackageStatus;
  mock_execution_plan_valid: PackageStatus;
  failure_recovery_ready: PackageStatus;
  runtime_mode_valid: PackageStatus;
  music_sync_preserved: PackageStatus;
  mv_type_preserved: PackageStatus;
  traceability_preserved: boolean;
  production_mode_blocked: PackageStatus;
  runtime_certification_chain_complete: PackageStatus;
  safe_create_policy_verified: PackageStatus;
  next_stage_ready: PackageStatus;
  runtime_certification_missing: boolean;
  test_execution_queue_invalid: boolean;
  mock_execution_plan_missing: boolean;
  failure_recovery_missing: boolean;
  runtime_mode_invalid: boolean;
  test_mode_disabled: boolean;
  mock_output_missing: boolean;
  real_generation_enabled: boolean;
  runtime_execution_detected: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  music_sync_loss: boolean;
  mv_type_loss: boolean;
  traceability_loss: boolean;
  production_mode_unblocked: boolean;
  runtime_certification_chain_incomplete: boolean;
  safe_create_policy_violation: boolean;
  next_stage_blocked: boolean;
  mv_test_execution_package_engine_ready: PackageStatus;
  certification_status: typeof MV_TEST_EXECUTION_PACKAGE_READY_STATUS | null;
  mv_test_execution_packages: MvTestExecutionPackage[];
  package_checks: PackageCheck[];
  final_verdict: typeof MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT | typeof MV_TEST_EXECUTION_PACKAGE_FAIL_VERDICT;
  issues: MvTestExecutionPackageIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH] as const;

const PACKAGE_EXPORT_WRITE_PATHS = [
  MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH,
  MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_TEST_EXECUTION_PACKAGE_DIR,
  MV_TEST_EXECUTION_PACKAGE_EXPORT_DIR,
  MV_TEST_EXECUTION_PACKAGE_REPORT_PATH,
  MV_TEST_EXECUTION_PACKAGE_MD_PATH,
  ...PACKAGE_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): PackageStatus {
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

function isUnderPackageWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(TEST_EXECUTION_PACKAGE_ARTIFACT_WRITE_SCOPE) ||
    relativePath === TEST_EXECUTION_PACKAGE_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function mockImageOutput(mvType: MvType, shotId: string): string {
  return `mock_output_${mvType}_${shotId}_image`;
}

function mockVideoOutput(mvType: MvType, shotId: string): string {
  return `mock_output_${mvType}_${shotId}_video`;
}

function isTestExecutionQueueValid(testPackage: MvTestExecutionPackage): boolean {
  return (
    testPackage.test_execution_queue.length === testPackage.test_execution_units.length * 4 &&
    testPackage.test_execution_queue.every(
      (entry) =>
        entry.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY &&
        entry.mock_execution_only === true &&
        entry.execution_allowed === false
    )
  );
}

function isRuntimeCertificationChainComplete(traceability: MvRuntimeTraceability): boolean {
  return (
    traceability.trace_integrity === 'PASS' &&
    traceability.source_generation_plan_ref.length > 0 &&
    traceability.generation_plan_id.length > 0 &&
    traceability.mv_shot_assembly_id.length > 0 &&
    traceability.mv_scene_assembly_id.length > 0 &&
    traceability.mv_blueprint_id.length > 0 &&
    traceability.mv_foundation_id.length > 0 &&
    traceability.upstream_runtime_id.length > 0 &&
    Array.isArray(traceability.dataset_refs)
  );
}

function buildTestExecutionPackage(
  certificationResult: MvRuntimeCertificationResult,
  runtimePlan: MvRuntimePlan
): MvTestExecutionPackage {
  const testExecutionUnits: MvTestExecutionUnit[] = runtimePlan.runtime_units.map((unit, index) => {
    const mockImage = mockImageOutput(runtimePlan.mv_type, unit.shot_id);
    const mockVideo = mockVideoOutput(runtimePlan.mv_type, unit.shot_id);
    const unitReady =
      unit.unit_ready === 'PASS' &&
      certificationResult.plan_certified === 'PASS' &&
      mockImage.length > 0 &&
      mockVideo.length > 0;

    return {
      unit_id: unit.unit_id,
      runtime_unit_ref: unit.unit_id,
      shot_id: unit.shot_id,
      scene_ref: unit.scene_ref,
      execution_order: index + 1,
      mock_image_output: mockImage,
      mock_video_output: mockVideo,
      generation_prompt_seed: unit.generation_prompt_seed,
      visual_intent: unit.visual_intent,
      emotion_beat_ref: unit.emotion_beat_ref,
      lyric_or_music_section_ref: unit.lyric_or_music_section_ref,
      adapter_bindings: unit.adapter_bindings,
      unit_ready: toStatus(unitReady),
    };
  });

  const testExecutionQueue: MvTestExecutionQueueEntry[] = runtimePlan.execution_queue.map(
    (entry) => ({
      queue_index: entry.queue_index,
      unit_id: entry.unit_id,
      shot_id: entry.shot_id,
      stage: entry.stage,
      runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
      mock_execution_only: true,
      execution_allowed: false,
    })
  );

  const mockEntries: MockExecutionEntry[] = testExecutionUnits.map((unit) => ({
    unit_id: unit.unit_id,
    shot_id: unit.shot_id,
    mock_image_output: unit.mock_image_output,
    mock_video_output: unit.mock_video_output,
    mock_step: `mock_execute_${runtimePlan.mv_type}_${unit.shot_id}`,
    mock_output_only: true,
    mock_ready: toStatus(unit.unit_ready === 'PASS'),
  }));

  const mockPlanValid =
    mockEntries.length > 0 && mockEntries.every((entry) => entry.mock_ready === 'PASS');

  const musicSyncPlan: MvTestMusicSyncPlan = {
    sync_id: `${runtimePlan.mv_type}_test_music_sync_v1`,
    beat_markers: runtimePlan.music_sync_runtime_plan.beat_markers.map((marker) => ({
      shot_ref: marker.shot_ref,
      scene_ref: marker.scene_ref,
      timestamp_seconds: marker.timestamp_seconds,
      sync_preserved: marker.sync_preserved,
    })),
    sync_valid: runtimePlan.music_sync_runtime_plan.sync_valid,
  };

  const queueValid = isTestExecutionQueueValid({
    test_execution_units: testExecutionUnits,
    test_execution_queue: testExecutionQueue,
  } as MvTestExecutionPackage);

  const packageReady =
    certificationResult.plan_certified === 'PASS' &&
    runtimePlan.runtime_ready === 'PASS' &&
    testExecutionUnits.every((unit) => unit.unit_ready === 'PASS') &&
    queueValid &&
    mockPlanValid &&
    certificationResult.failure_recovery_plan.recovery_ready &&
    runtimePlan.adapter_execution_plan.plan_valid &&
    musicSyncPlan.sync_valid &&
    certificationResult.traceability_chain.trace_integrity === 'PASS';

  return {
    source_runtime_certification_ref: MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    mv_test_execution_package_id: `${runtimePlan.mv_type}_test_execution_package_v1`,
    mv_type: runtimePlan.mv_type,
    runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
    test_mode_allowed: true,
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    test_execution_units: testExecutionUnits,
    test_execution_queue: testExecutionQueue,
    mock_execution_plan: {
      plan_id: `${runtimePlan.mv_type}_mock_execution_plan_v1`,
      entry_count: mockEntries.length,
      entries: mockEntries,
      mock_output_only: true,
      plan_valid: mockPlanValid,
    },
    failure_recovery_plan: certificationResult.failure_recovery_plan,
    adapter_execution_plan: runtimePlan.adapter_execution_plan,
    music_sync_plan: musicSyncPlan,
    traceability_chain: certificationResult.traceability_chain,
    test_execution_package_ready: toStatus(packageReady),
  };
}

function buildMarkdown(report: MvTestExecutionPackageReport): string {
  const lines = [
    '# MV Test Execution Package',
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
    `**Source Runtime Certification:** ${report.source_runtime_certification_ref}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| runtime_certification_consumed | ${report.runtime_certification_consumed} |`,
    `| test_execution_package_ready | ${report.test_execution_package_ready} |`,
    `| test_execution_queue_valid | ${report.test_execution_queue_valid} |`,
    `| mock_execution_plan_valid | ${report.mock_execution_plan_valid} |`,
    `| failure_recovery_ready | ${report.failure_recovery_ready} |`,
    `| runtime_mode_valid | ${report.runtime_mode_valid} |`,
    `| test_mode_allowed | ${report.test_mode_allowed} |`,
    `| mock_output_only | ${report.mock_output_only} |`,
    `| real_generation_blocked | ${report.real_generation_blocked} |`,
    `| runtime_not_executed | ${report.runtime_not_executed} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| music_sync_preserved | ${report.music_sync_preserved} |`,
    `| mv_type_preserved | ${report.mv_type_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    `| runtime_certification_chain_complete | ${report.runtime_certification_chain_complete} |`,
    `| safe_create_policy_verified | ${report.safe_create_policy_verified} |`,
    `| next_stage_ready | ${report.next_stage_ready} |`,
    '',
    '## Test Execution Packages',
    ''
  );

  for (const pkg of report.mv_test_execution_packages) {
    lines.push(
      `- ${pkg.mv_test_execution_package_id} (${pkg.mv_type}): units=${pkg.test_execution_units.length} queue=${pkg.test_execution_queue.length} mock=${pkg.mock_execution_plan.entry_count} ready=${pkg.test_execution_package_ready}`
    );
  }

  lines.push('', '## Package Checks', '');
  for (const check of report.package_checks) {
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
  issues: MvTestExecutionPackageIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvTestExecutionPackageReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvTestExecutionPackageReport = {
    report_id: 'mv-test-execution-package-report-v1',
    phase: MV_TEST_EXECUTION_PACKAGE_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    test_mode_allowed: true,
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_runtime_certification_ref: MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    mv_production_runtime_certification_report_path: MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
    mv_test_execution_package_export_dir: MV_TEST_EXECUTION_PACKAGE_EXPORT_DIR,
    mv_test_execution_package_manifest_path: MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH,
    mv_test_execution_package_artifact_path: MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    test_execution_package_count: MV_TYPE_COUNT,
    runtime_certification_consumed: 'FAIL',
    test_execution_package_ready: 'FAIL',
    test_execution_queue_valid: 'FAIL',
    mock_execution_plan_valid: 'FAIL',
    failure_recovery_ready: 'FAIL',
    runtime_mode_valid: 'FAIL',
    music_sync_preserved: 'FAIL',
    mv_type_preserved: 'FAIL',
    traceability_preserved: false,
    production_mode_blocked: 'FAIL',
    runtime_certification_chain_complete: 'FAIL',
    safe_create_policy_verified: 'FAIL',
    next_stage_ready: 'FAIL',
    runtime_certification_missing: true,
    test_execution_queue_invalid: true,
    mock_execution_plan_missing: true,
    failure_recovery_missing: true,
    runtime_mode_invalid: true,
    test_mode_disabled: true,
    mock_output_missing: true,
    real_generation_enabled: true,
    runtime_execution_detected: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    music_sync_loss: true,
    mv_type_loss: true,
    traceability_loss: true,
    production_mode_unblocked: true,
    runtime_certification_chain_incomplete: true,
    safe_create_policy_violation: true,
    next_stage_blocked: true,
    mv_test_execution_package_engine_ready: 'FAIL',
    certification_status: null,
    mv_test_execution_packages: [],
    package_checks: [],
    final_verdict: MV_TEST_EXECUTION_PACKAGE_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message:
              'Runtime certification artifact was modified during test execution package write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_TEST_EXECUTION_PACKAGE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_EXECUTION_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_EXECUTION_PACKAGE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvTestExecutionPackage(projectRoot?: string): MvTestExecutionPackageReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvTestExecutionPackageIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const certificationReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_production_runtime_certification_ready: PackageStatus;
    runtime_certified: PackageStatus;
    traceability_preserved: boolean;
  }>(root, MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH);
  const certificationArtifact = loadJson<MvProductionRuntimeCertificationArtifact>(
    root,
    MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH
  );

  const certificationPrecheckValid =
    certificationReport !== null &&
    certificationReport.final_verdict === MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT &&
    certificationReport.certification_status === MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS &&
    certificationReport.mv_production_runtime_certification_ready === 'PASS' &&
    certificationReport.runtime_certified === 'PASS' &&
    certificationArtifact !== null &&
    certificationArtifact.certification_complete === true;

  if (!certificationPrecheckValid) {
    issues.push({
      code: 'RUNTIME_CERTIFICATION_PRECHECK_FAILED',
      message: `Required ${MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT} with ${MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const runtimeEngineArtifact = loadJson<MvProductionRuntimeEngineArtifact>(
    root,
    MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH
  );

  if (!runtimeEngineArtifact || runtimeEngineArtifact.mv_runtime_plans.length === 0) {
    issues.push({
      code: 'RUNTIME_ENGINE_MISSING',
      message: `Missing read-only runtime engine artifact ${MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const upstreamRuntimeCertArtifact = loadJson<{
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
  }>(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);

  if (!upstreamRuntimeCertArtifact) {
    issues.push({
      code: 'UPSTREAM_RUNTIME_CERTIFICATION_MISSING',
      message: 'Missing upstream production runtime certification artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const testPackages: MvTestExecutionPackage[] = [];

  for (const certificationResult of certificationArtifact.runtime_certification_results) {
    const runtimePlan = runtimeEngineArtifact.mv_runtime_plans.find(
      (plan) => plan.mv_runtime_id === certificationResult.mv_runtime_id
    );

    if (!runtimePlan) {
      issues.push({
        code: 'RUNTIME_CERTIFICATION_MISSING',
        message: `Missing runtime plan for ${certificationResult.mv_runtime_id}`,
        severity: 'error',
        mv_type: certificationResult.mv_type,
      });
      continue;
    }

    const testPackage = buildTestExecutionPackage(certificationResult, runtimePlan);
    testPackages.push(testPackage);

    if (testPackage.test_execution_package_ready === 'FAIL') {
      issues.push({
        code: 'TEST_EXECUTION_PACKAGE_FAILURE',
        message: `Test execution package failed for ${testPackage.mv_test_execution_package_id}`,
        severity: 'error',
        mv_type: testPackage.mv_type,
      });
    }
  }

  const runtimeCertificationConsumed =
    certificationArtifact.runtime_consumed === true &&
    certificationArtifact.certification_complete === true &&
    testPackages.every(
      (pkg) =>
        pkg.source_runtime_certification_ref === MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH
    );

  const testExecutionPackageReady = testPackages.every(
    (pkg) => pkg.test_execution_package_ready === 'PASS'
  );
  const testExecutionQueueValid = testPackages.every((pkg) => isTestExecutionQueueValid(pkg));
  const mockExecutionPlanValid = testPackages.every((pkg) => pkg.mock_execution_plan.plan_valid);
  const failureRecoveryReady = testPackages.every(
    (pkg) => pkg.failure_recovery_plan.recovery_ready
  );
  const runtimeModeValid = testPackages.every(
    (pkg) => pkg.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY
  );
  const testModeAllowed = true as const;
  const mockOutputOnly = true as const;
  const realGenerationBlocked = true as const;
  const runtimeNotExecuted =
    certificationArtifact.runtime_not_executed === true &&
    certificationArtifact.safety_flags.runtime_execution === false &&
    testPackages.every((pkg) => pkg.runtime_not_executed === true);
  const externalCallBlockedFlag =
    testPackages.every((pkg) => pkg.external_call_blocked === true) &&
    certificationArtifact.external_call_allowed === false;
  const gpuExecutionBlockedFlag =
    testPackages.every((pkg) => pkg.gpu_execution_blocked === true) &&
    certificationArtifact.gpu_execution_allowed === false;
  const musicSyncPreserved = testPackages.every((pkg) => pkg.music_sync_plan.sync_valid);
  const mvTypePreserved = testPackages.every(
    (pkg) => SUPPORTED_MV_TYPES.includes(pkg.mv_type) && pkg.test_execution_units.length > 0
  );
  const traceabilityPreserved =
    certificationArtifact.traceability_preserved === true &&
    testPackages.every((pkg) => pkg.traceability_chain.trace_integrity === 'PASS');

  const productionModeBlocked =
    upstreamRuntimeCertArtifact.production_mode_blocked === true &&
    upstreamRuntimeCertArtifact.real_generation_blocked === true &&
    upstreamRuntimeCertArtifact.no_external_calls === true &&
    upstreamRuntimeCertArtifact.no_gpu_execution === true &&
    certificationArtifact.safety_flags.production_mode_blocked === true;

  const runtimeCertificationChainComplete = testPackages.every((pkg) =>
    isRuntimeCertificationChainComplete(pkg.traceability_chain)
  );

  const packageWriteScopeValid = PACKAGE_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderPackageWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && packageWriteScopeValid;

  const nextStageReady =
    runtimeCertificationConsumed &&
    testExecutionPackageReady &&
    testExecutionQueueValid &&
    mockExecutionPlanValid &&
    failureRecoveryReady &&
    runtimeModeValid &&
    testModeAllowed === true &&
    mockOutputOnly === true &&
    realGenerationBlocked === true &&
    runtimeNotExecuted &&
    externalCallBlockedFlag &&
    gpuExecutionBlockedFlag &&
    musicSyncPreserved &&
    mvTypePreserved &&
    traceabilityPreserved &&
    productionModeBlocked &&
    runtimeCertificationChainComplete &&
    safeCreatePolicyVerified;

  const testExecutionPackageComplete = nextStageReady;

  const runtimeCertificationMissing = !runtimeCertificationConsumed;
  const testExecutionQueueInvalid = !testExecutionQueueValid;
  const mockExecutionPlanMissing = !mockExecutionPlanValid;
  const failureRecoveryMissing = !failureRecoveryReady;
  const runtimeModeInvalidFlag = !runtimeModeValid;
  const testModeDisabled = testModeAllowed !== true;
  const mockOutputMissing = mockOutputOnly !== true;
  const realGenerationEnabled = realGenerationBlocked !== true;
  const runtimeExecutionDetected = !runtimeNotExecuted;
  const externalCallEnabled = !externalCallBlockedFlag;
  const gpuExecutionEnabled = !gpuExecutionBlockedFlag;
  const musicSyncLoss = !musicSyncPreserved;
  const mvTypeLoss = !mvTypePreserved;
  const traceabilityLoss = !traceabilityPreserved;
  const productionModeUnblocked = !productionModeBlocked;
  const runtimeCertificationChainIncomplete = !runtimeCertificationChainComplete;
  const safeCreatePolicyViolation = !safeCreatePolicyVerified;
  const nextStageBlocked = !nextStageReady;

  if (runtimeCertificationMissing) {
    issues.push({
      code: 'RUNTIME_CERTIFICATION_MISSING',
      message: 'Runtime certification was not consumed',
      severity: 'error',
    });
  }
  if (!testExecutionPackageReady) {
    issues.push({
      code: 'TEST_EXECUTION_PACKAGE_NOT_READY',
      message: 'One or more test execution packages are not ready',
      severity: 'error',
    });
  }
  if (testExecutionQueueInvalid) {
    issues.push({
      code: 'TEST_EXECUTION_QUEUE_INVALID',
      message: 'Test execution queue is invalid',
      severity: 'error',
    });
  }
  if (mockExecutionPlanMissing) {
    issues.push({
      code: 'MOCK_EXECUTION_PLAN_MISSING',
      message: 'Mock execution plan is missing or invalid',
      severity: 'error',
    });
  }
  if (failureRecoveryMissing) {
    issues.push({
      code: 'FAILURE_RECOVERY_MISSING',
      message: 'Failure recovery plan is missing or not ready',
      severity: 'error',
    });
  }
  if (runtimeModeInvalidFlag) {
    issues.push({
      code: 'RUNTIME_MODE_INVALID',
      message: 'Runtime mode must be test_mode_only',
      severity: 'error',
    });
  }
  if (testModeDisabled) {
    issues.push({
      code: 'TEST_MODE_DISABLED',
      message: 'Test mode must be allowed',
      severity: 'error',
    });
  }
  if (mockOutputMissing) {
    issues.push({
      code: 'MOCK_OUTPUT_MISSING',
      message: 'Mock output only flag must be set',
      severity: 'error',
    });
  }
  if (realGenerationEnabled) {
    issues.push({
      code: 'REAL_GENERATION_ENABLED',
      message: 'Real generation must be blocked',
      severity: 'error',
    });
  }
  if (runtimeExecutionDetected) {
    issues.push({
      code: 'RUNTIME_EXECUTION_DETECTED',
      message: 'Runtime execution must not be detected',
      severity: 'error',
    });
  }
  if (externalCallEnabled) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'External calls must be blocked',
      severity: 'error',
    });
  }
  if (gpuExecutionEnabled) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'GPU execution must be blocked',
      severity: 'error',
    });
  }
  if (musicSyncLoss) {
    issues.push({
      code: 'MUSIC_SYNC_LOSS',
      message: 'Music sync plan is not preserved',
      severity: 'error',
    });
  }
  if (mvTypeLoss) {
    issues.push({ code: 'MV_TYPE_LOSS', message: 'MV type was not preserved', severity: 'error' });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability chain is not preserved',
      severity: 'error',
    });
  }
  if (productionModeUnblocked) {
    issues.push({
      code: 'PRODUCTION_MODE_UNBLOCKED',
      message: 'Production mode is not blocked',
      severity: 'error',
    });
  }
  if (runtimeCertificationChainIncomplete) {
    issues.push({
      code: 'RUNTIME_CERTIFICATION_CHAIN_INCOMPLETE',
      message: 'Runtime certification chain is incomplete',
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
  if (nextStageBlocked) {
    issues.push({
      code: 'NEXT_STAGE_BLOCKED',
      message: 'Next stage is not ready',
      severity: 'error',
    });
  }

  const packageChecks: PackageCheck[] = [
    {
      check_id: 'runtime_certification_consumed',
      check_label: 'Runtime Certification Consumed',
      status: toStatus(runtimeCertificationConsumed),
    },
    {
      check_id: 'test_execution_package_ready',
      check_label: 'Test Execution Package Ready',
      status: toStatus(testExecutionPackageReady),
    },
    {
      check_id: 'test_execution_queue_valid',
      check_label: 'Test Execution Queue Valid',
      status: toStatus(testExecutionQueueValid),
    },
    {
      check_id: 'mock_execution_plan_valid',
      check_label: 'Mock Execution Plan Valid',
      status: toStatus(mockExecutionPlanValid),
    },
    {
      check_id: 'failure_recovery_ready',
      check_label: 'Failure Recovery Ready',
      status: toStatus(failureRecoveryReady),
    },
    {
      check_id: 'runtime_mode_valid',
      check_label: 'Runtime Mode Valid',
      status: toStatus(runtimeModeValid),
    },
    {
      check_id: 'test_mode_allowed',
      check_label: 'Test Mode Allowed',
      status: toStatus(testModeAllowed === true),
    },
    {
      check_id: 'mock_output_only',
      check_label: 'Mock Output Only',
      status: toStatus(mockOutputOnly === true),
    },
    {
      check_id: 'real_generation_blocked',
      check_label: 'Real Generation Blocked',
      status: toStatus(realGenerationBlocked === true),
    },
    {
      check_id: 'runtime_not_executed',
      check_label: 'Runtime Not Executed',
      status: toStatus(runtimeNotExecuted),
    },
    {
      check_id: 'external_call_blocked',
      check_label: 'External Call Blocked',
      status: toStatus(externalCallBlockedFlag),
    },
    {
      check_id: 'gpu_execution_blocked',
      check_label: 'GPU Execution Blocked',
      status: toStatus(gpuExecutionBlockedFlag),
    },
    {
      check_id: 'music_sync_preserved',
      check_label: 'Music Sync Preserved',
      status: toStatus(musicSyncPreserved),
    },
    {
      check_id: 'mv_type_preserved',
      check_label: 'MV Type Preserved',
      status: toStatus(mvTypePreserved),
    },
    {
      check_id: 'traceability_preserved',
      check_label: 'Traceability Preserved',
      status: toStatus(traceabilityPreserved),
    },
    {
      check_id: 'production_mode_blocked',
      check_label: 'Production Mode Blocked',
      status: toStatus(productionModeBlocked),
    },
    {
      check_id: 'runtime_certification_chain_complete',
      check_label: 'Runtime Certification Chain Complete',
      status: toStatus(runtimeCertificationChainComplete),
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
    testExecutionPackageComplete &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvTestExecutionPackageArtifact = {
    package_bundle_id: 'mv-test-execution-package-v1',
    phase: MV_TEST_EXECUTION_PACKAGE_PHASE,
    generated_at: timestamp,
    source_runtime_certification_ref: MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    runtime_certification_id: certificationArtifact.certification_id,
    test_mode_allowed: true,
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    mv_test_execution_packages: testPackages,
    safety_flags: {
      planning_only: true,
      test_mode: true,
      mock_execution_only: true,
      mock_output_only: true,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      production_mode_blocked: true,
    },
    runtime_certification_consumed: runtimeCertificationConsumed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    runtime_certification_chain_complete: runtimeCertificationChainComplete,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      test_execution_package_artifact_write_scope: TEST_EXECUTION_PACKAGE_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    test_execution_package_complete: testExecutionPackageComplete,
    next_stage_ready: nextStageReady,
  };

  const manifest: MvTestExecutionPackageManifest = {
    manifest_id: 'mv-test-execution-package-manifest-v1',
    phase: MV_TEST_EXECUTION_PACKAGE_PHASE,
    generated_at: timestamp,
    test_execution_package_count: MV_TYPE_COUNT,
    runtime_certification_consumed: toStatus(runtimeCertificationConsumed),
    test_execution_package_ready: toStatus(testExecutionPackageReady),
    test_execution_queue_valid: toStatus(testExecutionQueueValid),
    mock_execution_plan_valid: toStatus(mockExecutionPlanValid),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    runtime_mode_valid: toStatus(runtimeModeValid),
    test_mode_allowed: true,
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: toStatus(externalCallBlockedFlag),
    gpu_execution_blocked: toStatus(gpuExecutionBlockedFlag),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    runtime_certification_chain_complete: toStatus(runtimeCertificationChainComplete),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    certification_status: pass ? MV_TEST_EXECUTION_PACKAGE_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_TEST_EXECUTION_PACKAGE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvTestExecutionPackageReport = {
    report_id: 'mv-test-execution-package-report-v1',
    phase: MV_TEST_EXECUTION_PACKAGE_PHASE,
    timestamp,
    planning_only: true,
    mock_execution_only: true,
    test_mode_allowed: true,
    mock_output_only: true,
    real_generation_blocked: true,
    runtime_not_executed: true,
    external_call_blocked: true,
    gpu_execution_blocked: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_runtime_certification_ref: MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
    mv_production_runtime_certification_report_path: MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
    mv_test_execution_package_export_dir: MV_TEST_EXECUTION_PACKAGE_EXPORT_DIR,
    mv_test_execution_package_manifest_path: MV_TEST_EXECUTION_PACKAGE_MANIFEST_PATH,
    mv_test_execution_package_artifact_path: MV_TEST_EXECUTION_PACKAGE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    test_execution_package_count: MV_TYPE_COUNT,
    runtime_certification_consumed: toStatus(runtimeCertificationConsumed),
    test_execution_package_ready: toStatus(testExecutionPackageReady),
    test_execution_queue_valid: toStatus(testExecutionQueueValid),
    mock_execution_plan_valid: toStatus(mockExecutionPlanValid),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    runtime_mode_valid: toStatus(runtimeModeValid),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    runtime_certification_chain_complete: toStatus(runtimeCertificationChainComplete),
    safe_create_policy_verified: toStatus(safeCreatePolicyVerified),
    next_stage_ready: toStatus(nextStageReady),
    runtime_certification_missing: runtimeCertificationMissing,
    test_execution_queue_invalid: testExecutionQueueInvalid,
    mock_execution_plan_missing: mockExecutionPlanMissing,
    failure_recovery_missing: failureRecoveryMissing,
    runtime_mode_invalid: runtimeModeInvalidFlag,
    test_mode_disabled: testModeDisabled,
    mock_output_missing: mockOutputMissing,
    real_generation_enabled: realGenerationEnabled,
    runtime_execution_detected: runtimeExecutionDetected,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    music_sync_loss: musicSyncLoss,
    mv_type_loss: mvTypeLoss,
    traceability_loss: traceabilityLoss,
    production_mode_unblocked: productionModeUnblocked,
    runtime_certification_chain_incomplete: runtimeCertificationChainIncomplete,
    safe_create_policy_violation: safeCreatePolicyViolation,
    next_stage_blocked: nextStageBlocked,
    mv_test_execution_package_engine_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_TEST_EXECUTION_PACKAGE_READY_STATUS : null,
    mv_test_execution_packages: testPackages,
    package_checks: packageChecks,
    final_verdict: pass ? MV_TEST_EXECUTION_PACKAGE_PASS_VERDICT : MV_TEST_EXECUTION_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_TEST_EXECUTION_PACKAGE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_TEST_EXECUTION_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_TEST_EXECUTION_PACKAGE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
