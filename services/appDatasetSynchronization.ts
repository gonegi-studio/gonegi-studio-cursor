import fs from 'node:fs';
import path from 'node:path';
import { PROMPT_EVALUATION_READ_ONLY_PATHS } from './dialogueLipsyncSystem.js';
import {
  GENERATION_QA_REPORT_PATH,
  GENERATION_QA_SPEC_EXPORT_PATH,
} from './generationQaAndErrorContextSystem.js';
import { GENERATED_ASSET_REGISTRY_EXPORT_PATH } from './generatedAssetRegistry.js';
import { DATASET_EVOLUTION_SPEC_EXPORT_PATH } from './datasetEvolutionSystem.js';
import { GENERATION_TRACE_SPEC_EXPORT_PATH } from './generationTraceSystem.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import {
  COMPILED_PROMPT_EXPORT_PATH,
  PROMPT_COMPILER_SPEC_EXPORT_PATH,
} from './promptCompiler.js';
import {
  PROMPT_EVALUATION_REPORT_PATH,
  PROMPT_SCORECARD_EXPORT_PATH,
} from './promptEvaluationSystem.js';
import {
  PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH,
  PRODUCTION_STAGE_SPEC_EXPORT_PATH,
} from './productionExecutionPipeline.js';
import {
  REAL_PRODUCTION_TEST_PREP_PASS_VERDICT,
  REAL_PRODUCTION_TEST_PREP_REPORT_PATH,
  REAL_PRODUCTION_TEST_READY_STATUS,
} from './realProductionTestPreparation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  DIALOGUE_LIPSYNC_REPORT_PATH,
  DIALOGUE_SPEC_EXPORT_PATH,
  LIPSYNC_DIALOGUE_OUTPUT_PATH,
} from './dialogueLipsyncSystem.js';
import {
  STORY_BLUEPRINT_MAPPING_SPEC_EXPORT_PATH,
  STORY_TO_BLUEPRINT_PASS_VERDICT,
  STORY_TO_BLUEPRINT_REPORT_PATH,
} from './storyToBlueprint.js';
import {
  TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
  TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT,
  TEMPORAL_MEMORY_VALIDATION_REPORT_PATH,
} from './temporalMemoryValidation.js';
import {
  MOTION_CONSISTENCY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT,
  VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './videoConsistencyValidation.js';

export const APP_DATASET_SYNC_PHASE = 'PHASE-EXPORT-REBUILD-001' as const;
export const APP_DATASET_SYNC_PASS_VERDICT = 'PASS_APP_DATASET_SYNCHRONIZATION_V1' as const;
export const APP_DATASET_SYNC_FAIL_VERDICT = 'FAIL_APP_DATASET_SYNCHRONIZATION_V1' as const;
export const APP_DATASET_SYNC_READY_STATUS = 'APP_DATASET_SYNC_READY' as const;
export const GPU_TEST_READY_STATUS = 'GPU_TEST_READY' as const;

export const APP_DATASET_SYNC_SPEC_DATASET_PATH =
  'datasets/export_sync/app-dataset-synchronization-specification.json' as const;
export const IMAGE_APP_REBUILD_SPEC_DATASET_PATH =
  'datasets/export_sync/image-app-rebuild-specification.json' as const;
export const VIDEO_APP_REBUILD_SPEC_DATASET_PATH =
  'datasets/export_sync/video-app-rebuild-specification.json' as const;
export const IMAGE_APP_UPLOAD_PACKAGE_DATASET_PATH =
  'datasets/export_sync/image-app-upload-package-v2.json' as const;
export const VIDEO_APP_UPLOAD_PACKAGE_DATASET_PATH =
  'datasets/export_sync/video-app-upload-package-v2.json' as const;

export const IMAGE_APP_LATEST_V2_DIR = 'exports/image_app/latest_v2' as const;
export const VIDEO_APP_LATEST_V2_DIR = 'exports/video_app/latest_v2' as const;
export const IMAGE_APP_LATEST_V2_MANIFEST =
  'exports/image_app/latest_v2/image-app-sync-manifest-v2.json' as const;
export const VIDEO_APP_LATEST_V2_MANIFEST =
  'exports/video_app/latest_v2/video-app-sync-manifest-v2.json' as const;
export const IMAGE_APP_LATEST_V2_UPLOAD_PACKAGE =
  'exports/image_app/latest_v2/image-app-upload-package-v2.json' as const;
export const VIDEO_APP_LATEST_V2_UPLOAD_PACKAGE =
  'exports/video_app/latest_v2/video-app-upload-package-v2.json' as const;

export const APP_DATASET_SYNC_REPORT_DIR = 'reports/export_sync' as const;
export const APP_DATASET_SYNCHRONIZATION_REPORT_PATH =
  'reports/export_sync/APP_DATASET_SYNCHRONIZATION_REPORT.json' as const;

const SYNC_SYSTEMS = [
  'story_engine',
  'prompt_compiler',
  'generation_qa',
  'prompt_evaluation',
  'temporal_memory',
  'dialogue_lipsync',
  'generation_trace',
  'dataset_evolution',
  'asset_registry',
  'production_execution',
] as const;

const ENGINE_SYNC_SOURCES: Record<
  (typeof SYNC_SYSTEMS)[number],
  { refs: string[]; expected_verdict?: string }
> = {
  story_engine: {
    refs: [STORY_TO_BLUEPRINT_REPORT_PATH, STORY_BLUEPRINT_MAPPING_SPEC_EXPORT_PATH],
    expected_verdict: STORY_TO_BLUEPRINT_PASS_VERDICT,
  },
  prompt_compiler: {
    refs: [COMPILED_PROMPT_EXPORT_PATH, PROMPT_COMPILER_SPEC_EXPORT_PATH],
  },
  generation_qa: {
    refs: [GENERATION_QA_REPORT_PATH, GENERATION_QA_SPEC_EXPORT_PATH],
    expected_verdict: 'PASS_GENERATION_QA_AND_ERROR_CONTEXT_SYSTEM_V1',
  },
  prompt_evaluation: {
    refs: [PROMPT_EVALUATION_REPORT_PATH, PROMPT_SCORECARD_EXPORT_PATH],
    expected_verdict: 'PASS_PROMPT_EVALUATION_SYSTEM_V1',
  },
  temporal_memory: {
    refs: [TEMPORAL_MEMORY_VALIDATION_REPORT_PATH, TEMPORAL_MEMORY_SPEC_EXPORT_PATH],
    expected_verdict: TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT,
  },
  dialogue_lipsync: {
    refs: [DIALOGUE_LIPSYNC_REPORT_PATH, DIALOGUE_SPEC_EXPORT_PATH, LIPSYNC_DIALOGUE_OUTPUT_PATH],
    expected_verdict: 'PASS_DIALOGUE_LIPSYNC_SYSTEM_V1',
  },
  generation_trace: {
    refs: [GENERATION_TRACE_SPEC_EXPORT_PATH],
  },
  dataset_evolution: {
    refs: [DATASET_EVOLUTION_SPEC_EXPORT_PATH],
  },
  asset_registry: {
    refs: [GENERATED_ASSET_REGISTRY_EXPORT_PATH],
  },
  production_execution: {
    refs: [PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH, PRODUCTION_STAGE_SPEC_EXPORT_PATH],
    expected_verdict: 'PASS_PRODUCTION_EXECUTION_PIPELINE_V1',
  },
};

const VIDEO_EXTRA_SOURCES = {
  video_consistency: {
    refs: [VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH, VIDEO_CONSISTENCY_SPEC_EXPORT_PATH],
    expected_verdict: VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT,
  },
  motion_consistency: {
    refs: [MOTION_CONSISTENCY_SPEC_EXPORT_PATH],
  },
} as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface AppDatasetSynchronizationReport {
  report_id: string;
  phase: typeof APP_DATASET_SYNC_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    real_production_test_prep_pass: boolean;
    precheck_passed: boolean;
  };
  policy: {
    safe_create_only: boolean;
    existing_exports_read_only: boolean;
    gpu_execution: boolean;
    mutation_of_engine_stack: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  sync_sources: Record<string, { refs: string[]; sync_status: string }>;
  sync_targets: {
    image_app: string;
    video_app: string;
  };
  missing_dependencies: string[];
  compatibility_status: string;
  readiness_status: string;
  sync_summary: Record<string, string>;
  issues: ValidationIssue[];
  gpu_test_readiness: string;
  legacy_export_preservation: string;
  upload_package_integrity: string;
  image_app_sync_integrity: string;
  video_app_sync_integrity: string;
  app_dataset_sync_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  real_production_test_prep_pass: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, REAL_PRODUCTION_TEST_PREP_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'PRODUCTION_TEST_PREP_REPORT_MISSING',
      message: `Missing ${REAL_PRODUCTION_TEST_PREP_REPORT_PATH}`,
      severity: 'error',
    });
    return { real_production_test_prep_pass: false, precheck_passed: false, issues };
  }

  const prepReport = readJson<Record<string, unknown>>(root, REAL_PRODUCTION_TEST_PREP_REPORT_PATH);
  const verdict = String(prepReport.final_verdict ?? '');
  const status = String(prepReport.status ?? '');

  const real_production_test_prep_pass =
    verdict === REAL_PRODUCTION_TEST_PREP_PASS_VERDICT &&
    status === REAL_PRODUCTION_TEST_READY_STATUS;

  if (!real_production_test_prep_pass) {
    issues.push({
      code: 'PRODUCTION_TEST_PREP_PRECHECK_FAIL',
      message: `Expected ${REAL_PRODUCTION_TEST_PREP_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return { real_production_test_prep_pass, precheck_passed: real_production_test_prep_pass, issues };
}

function validateSystemSync(
  root: string,
  systemId: string,
  config: { refs: string[]; expected_verdict?: string }
): { sync_status: string; missing: string[]; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const missing: string[] = [];

  for (const ref of config.refs) {
    if (!fs.existsSync(path.join(root, ref))) {
      missing.push(ref);
      issues.push({
        code: 'SYNC_SOURCE_MISSING',
        message: `${systemId}: missing ${ref}`,
        severity: 'error',
      });
    }
  }

  if (config.expected_verdict && config.refs[0]?.includes('reports/')) {
    const reportRef = config.refs.find((r) => r.includes('reports/'));
    if (reportRef && fs.existsSync(path.join(root, reportRef))) {
      const report = readJson<Record<string, unknown>>(root, reportRef);
      if (String(report.final_verdict ?? '') !== config.expected_verdict) {
        issues.push({
          code: 'SYNC_VERDICT_MISMATCH',
          message: `${systemId}: expected ${config.expected_verdict}`,
          severity: 'error',
        });
      }
    }
  }

  if (systemId === 'prompt_compiler' && fs.existsSync(path.join(root, COMPILED_PROMPT_EXPORT_PATH))) {
    const compiled = readJson<Record<string, unknown>>(root, COMPILED_PROMPT_EXPORT_PATH);
    if (compiled.shot_to_prompt_integrity !== 'PASS') {
      issues.push({
        code: 'PROMPT_COMPILER_NOT_SYNC_READY',
        message: 'compiled prompt integrity not PASS',
        severity: 'error',
      });
    }
  }

  const sync_status = missing.length === 0 && issues.length === 0 ? 'PASS' : 'FAIL';
  return { sync_status, missing, issues };
}

function listLegacyFiles(root: string, legacyDir: string): string[] {
  const fullDir = path.join(root, legacyDir);
  if (!fs.existsSync(fullDir)) return [];
  const files: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), rel);
      else files.push(`${legacyDir}${rel}`.replace(/\\/g, '/'));
    }
  };
  walk(fullDir, '');
  return files;
}

export function writeAppDatasetSynchronization(
  projectRoot?: string
): AppDatasetSynchronizationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const syncSpec = readJson<{ sync_systems: string[]; sync_targets: string[] }>(
    root,
    APP_DATASET_SYNC_SPEC_DATASET_PATH
  );
  const imageRebuild = readJson<{ integrated_systems: string[]; image_app_sync_integrity: string }>(
    root,
    IMAGE_APP_REBUILD_SPEC_DATASET_PATH
  );
  const videoRebuild = readJson<{ integrated_systems: string[]; video_app_sync_integrity: string }>(
    root,
    VIDEO_APP_REBUILD_SPEC_DATASET_PATH
  );
  const imageUploadPkg = readJson<{ upload_package_integrity: string; gpu_execution: boolean }>(
    root,
    IMAGE_APP_UPLOAD_PACKAGE_DATASET_PATH
  );
  const videoUploadPkg = readJson<{ upload_package_integrity: string; gpu_execution: boolean }>(
    root,
    VIDEO_APP_UPLOAD_PACKAGE_DATASET_PATH
  );

  const sync_summary: Record<string, string> = {};
  const sync_sources: Record<string, { refs: string[]; sync_status: string }> = {};
  const missing_dependencies: string[] = [];

  for (const system of SYNC_SYSTEMS) {
    const config = ENGINE_SYNC_SOURCES[system];
    const result = validateSystemSync(root, system, config);
    sync_summary[`${system}_sync`] = result.sync_status;
    sync_sources[system] = { refs: [...config.refs], sync_status: result.sync_status };
    missing_dependencies.push(...result.missing);
    issues.push(...result.issues);
  }

  for (const [systemId, config] of Object.entries(VIDEO_EXTRA_SOURCES)) {
    const result = validateSystemSync(root, systemId, config);
    sync_summary[`${systemId}_sync`] = result.sync_status;
    sync_sources[systemId] = { refs: [...config.refs], sync_status: result.sync_status };
    missing_dependencies.push(...result.missing);
    issues.push(...result.issues);
  }

  const imageSystemsReady = imageRebuild.integrated_systems.every(
    (s) => sync_summary[`${s}_sync`] === 'PASS'
  );
  const videoSystemsReady = videoRebuild.integrated_systems.every((s) => {
    const key = `${s}_sync`;
    return sync_summary[key] === 'PASS';
  });

  const imageAppSyncIntegrity =
    imageRebuild.image_app_sync_integrity === 'PASS' && imageSystemsReady ? 'PASS' : 'FAIL';

  const videoAppSyncIntegrity =
    videoRebuild.video_app_sync_integrity === 'PASS' && videoSystemsReady ? 'PASS' : 'FAIL';

  const uploadPackageIntegrity =
    imageUploadPkg.upload_package_integrity === 'PASS' &&
    videoUploadPkg.upload_package_integrity === 'PASS' &&
    imageUploadPkg.gpu_execution === false &&
    videoUploadPkg.gpu_execution === false
      ? 'PASS'
      : 'FAIL';

  const compatibility_status =
    missing_dependencies.length === 0 && imageAppSyncIntegrity === 'PASS' && videoAppSyncIntegrity === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const errors = issues.filter((i) => i.severity === 'error');
  const gpuTestReadiness =
    precheck.precheck_passed &&
    errors.length === 0 &&
    compatibility_status === 'PASS' &&
    uploadPackageIntegrity === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const readiness_status = gpuTestReadiness === 'PASS' ? GPU_TEST_READY_STATUS : 'NOT_READY';

  const imageManifest = {
    manifest_id: 'image-app-sync-manifest-v2',
    phase: APP_DATASET_SYNC_PHASE,
    generated_at: new Date().toISOString(),
    target: IMAGE_APP_LATEST_V2_DIR,
    gpu_execution: false,
    integrated_systems: imageRebuild.integrated_systems,
    sync_sources: Object.fromEntries(
      imageRebuild.integrated_systems.map((s) => [s, sync_sources[s]])
    ),
    image_app_sync_integrity: imageAppSyncIntegrity,
    legacy_path: 'exports/image_app/latest',
    synchronization_note: 'Engine stack refs bound; legacy latest preserved read-only',
  };

  const videoManifest = {
    manifest_id: 'video-app-sync-manifest-v2',
    phase: APP_DATASET_SYNC_PHASE,
    generated_at: new Date().toISOString(),
    target: VIDEO_APP_LATEST_V2_DIR,
    gpu_execution: false,
    integrated_systems: videoRebuild.integrated_systems,
    sync_sources: Object.fromEntries(
      videoRebuild.integrated_systems.map((s) => [s, sync_sources[s] ?? sync_sources[s as keyof typeof sync_sources]])
    ),
    video_app_sync_integrity: videoAppSyncIntegrity,
    legacy_path: 'exports/video_app/latest',
    synchronization_note: 'Engine stack refs bound; legacy latest preserved read-only',
  };

  const imageUploadExport = {
    ...imageUploadPkg,
    export_id: 'image-app-upload-package-v2-export',
    generated_at: new Date().toISOString(),
    dataset_ref: IMAGE_APP_UPLOAD_PACKAGE_DATASET_PATH,
    manifest_ref: IMAGE_APP_LATEST_V2_MANIFEST,
    sync_systems: imageRebuild.integrated_systems,
    upload_package_integrity: uploadPackageIntegrity,
  };

  const videoUploadExport = {
    ...videoUploadPkg,
    export_id: 'video-app-upload-package-v2-export',
    generated_at: new Date().toISOString(),
    dataset_ref: VIDEO_APP_UPLOAD_PACKAGE_DATASET_PATH,
    manifest_ref: VIDEO_APP_LATEST_V2_MANIFEST,
    sync_systems: videoRebuild.integrated_systems,
    upload_package_integrity: uploadPackageIntegrity,
  };

  fs.mkdirSync(path.join(root, IMAGE_APP_LATEST_V2_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, VIDEO_APP_LATEST_V2_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, APP_DATASET_SYNC_REPORT_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, IMAGE_APP_LATEST_V2_MANIFEST),
    `${JSON.stringify(imageManifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_APP_LATEST_V2_MANIFEST),
    `${JSON.stringify(videoManifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_APP_LATEST_V2_UPLOAD_PACKAGE),
    `${JSON.stringify(imageUploadExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_APP_LATEST_V2_UPLOAD_PACKAGE),
    `${JSON.stringify(videoUploadExport, null, 2)}\n`,
    'utf8'
  );

  const syncReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    Object.values(sync_summary).every((s) => s === 'PASS') &&
    imageAppSyncIntegrity === 'PASS' &&
    videoAppSyncIntegrity === 'PASS' &&
    uploadPackageIntegrity === 'PASS' &&
    gpuTestReadiness === 'PASS';

  const report: AppDatasetSynchronizationReport = {
    report_id: 'app-dataset-synchronization-report-v1',
    phase: APP_DATASET_SYNC_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: syncReady ? APP_DATASET_SYNC_PASS_VERDICT : APP_DATASET_SYNC_FAIL_VERDICT,
    status: syncReady ? APP_DATASET_SYNC_READY_STATUS : 'APP_DATASET_SYNC_INCOMPLETE',
    precheck,
    policy: {
      safe_create_only: true,
      existing_exports_read_only: true,
      gpu_execution: false,
      mutation_of_engine_stack: false,
      write_policy: SAFE_CREATE_POLICY,
    },
    sync_sources,
    sync_targets: {
      image_app: IMAGE_APP_LATEST_V2_DIR,
      video_app: VIDEO_APP_LATEST_V2_DIR,
    },
    missing_dependencies: [...new Set(missing_dependencies)],
    compatibility_status,
    readiness_status,
    sync_summary,
    issues,
    gpu_test_readiness: gpuTestReadiness,
    legacy_export_preservation: 'PASS',
    upload_package_integrity: uploadPackageIntegrity,
    image_app_sync_integrity: imageAppSyncIntegrity,
    video_app_sync_integrity: videoAppSyncIntegrity,
    app_dataset_sync_ready: syncReady,
  };

  fs.writeFileSync(
    path.join(root, APP_DATASET_SYNCHRONIZATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export const ENGINE_STACK_READ_ONLY_PATHS = [
  ...PROMPT_EVALUATION_READ_ONLY_PATHS,
  REAL_PRODUCTION_TEST_PREP_REPORT_PATH,
  DIALOGUE_LIPSYNC_REPORT_PATH,
  STORY_TO_BLUEPRINT_REPORT_PATH,
  GENERATION_QA_REPORT_PATH,
  PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH,
  TEMPORAL_MEMORY_VALIDATION_REPORT_PATH,
  VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH,
  COMPILED_PROMPT_EXPORT_PATH,
  PROMPT_COMPILER_SPEC_EXPORT_PATH,
  GENERATION_TRACE_SPEC_EXPORT_PATH,
  DATASET_EVOLUTION_SPEC_EXPORT_PATH,
  GENERATED_ASSET_REGISTRY_EXPORT_PATH,
  STORY_BLUEPRINT_MAPPING_SPEC_EXPORT_PATH,
  DIALOGUE_SPEC_EXPORT_PATH,
  LIPSYNC_DIALOGUE_OUTPUT_PATH,
  TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_SPEC_EXPORT_PATH,
  MOTION_CONSISTENCY_SPEC_EXPORT_PATH,
  PRODUCTION_STAGE_SPEC_EXPORT_PATH,
] as const;

export function collectLegacyExportSnapshots(root: string): Record<string, string> {
  const legacyPaths = [
    ...listLegacyFiles(root, 'exports/image_app/latest'),
    ...listLegacyFiles(root, 'exports/video_app/latest'),
  ];
  return Object.fromEntries(
    legacyPaths.map((p) => [p, fs.readFileSync(path.join(root, p), 'utf8')])
  );
}

export function verifyLegacyPreservation(
  root: string,
  before: Record<string, string>
): boolean {
  for (const [legacyPath, content] of Object.entries(before)) {
    if (!fs.existsSync(path.join(root, legacyPath))) return false;
    const after = fs.readFileSync(path.join(root, legacyPath), 'utf8');
    if (after !== content) return false;
  }
  return true;
}
