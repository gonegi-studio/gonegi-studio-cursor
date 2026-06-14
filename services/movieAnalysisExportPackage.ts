import fs from 'node:fs';
import path from 'node:path';
import {
  CONSUMPTION_READINESS_AUDIT_PASS_VERDICT,
  CONSUMPTION_READINESS_AUDIT_REPORT_PATH,
} from './movieAnalysisConsumptionReadinessAudit.js';
import {
  GENERATION_BLUEPRINT_REGISTRY_PATH,
  type MovieAnalysisGenerationBlueprintPlan,
  loadMovieAnalysisGenerationBlueprintPlan,
} from './movieAnalysisGenerationBlueprintDesign.js';
import {
  FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
  type MovieAnalysisFinalRuntimeBundlePlan,
  loadMovieAnalysisFinalRuntimeBundlePlan,
} from './movieAnalysisFinalRuntimeBundleDesign.js';
import {
  MASTER_PACKAGE_REGISTRY_PATH,
  SEED_MASTER_PACKAGE_SPECS,
  TRACE_DEFINITIONS,
  type MovieAnalysisMasterPackagePlan,
  type PackageTraceEntry,
  loadMovieAnalysisMasterPackagePlan,
} from './movieAnalysisMasterPackageDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const EXPORT_PACKAGE_PHASE =
  'PHASE-SOURCE-VIDEO-042-MOVIE_ANALYSIS_EXPORT_PACKAGE_V1' as const;
export const EXPORT_PACKAGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_EXPORT_PACKAGE_V1' as const;
export const EXPORT_PACKAGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_EXPORT_PACKAGE_V1' as const;
export const EXPORT_DIR = 'exports/movie_analysis' as const;
export const EXPORT_PACKAGE_PATH =
  'exports/movie_analysis/movie-analysis-export-package.json' as const;
export const EXPORT_MANIFEST_PATH =
  'exports/movie_analysis/movie-analysis-export-manifest.json' as const;
export const EXPORT_REPORT_PATH =
  'exports/movie_analysis/movie-analysis-export-report.json' as const;

export const EXPECTED_SOURCE_COUNT = 4 as const;
export const IMAGE_APP_CONSUMER_TARGET = 'image_app' as const;
export const VIDEO_APP_CONSUMER_TARGET = 'video_app' as const;

export type ImageAppExportPayload = {
  consumer_target: typeof IMAGE_APP_CONSUMER_TARGET;
  keyframe_preparation_id: string;
  gonegi_state_mapping_id: string;
  video_state_compilation_id: string;
  character_generation_structure: MovieAnalysisGenerationBlueprintPlan['character_generation_structure'];
  emotion_generation_structure: MovieAnalysisGenerationBlueprintPlan['emotion_generation_structure'];
  character_bundle: MovieAnalysisFinalRuntimeBundlePlan['character_bundle'];
  emotion_bundle: MovieAnalysisFinalRuntimeBundlePlan['emotion_bundle'];
};

export type VideoAppExportPayload = {
  consumer_target: typeof VIDEO_APP_CONSUMER_TARGET;
  video_blueprint_id: string;
  temporal_flow_id: string;
  sequence_assembly_id: string;
  motion_plan_id: string;
  scene_generation_structure: MovieAnalysisGenerationBlueprintPlan['scene_generation_structure'];
  camera_generation_structure: MovieAnalysisGenerationBlueprintPlan['camera_generation_structure'];
  transition_generation_structure: MovieAnalysisGenerationBlueprintPlan['transition_generation_structure'];
  continuity_generation_structure: MovieAnalysisGenerationBlueprintPlan['continuity_generation_structure'];
  scene_bundle: MovieAnalysisFinalRuntimeBundlePlan['scene_bundle'];
  camera_bundle: MovieAnalysisFinalRuntimeBundlePlan['camera_bundle'];
  transition_bundle: MovieAnalysisFinalRuntimeBundlePlan['transition_bundle'];
  continuity_bundle: MovieAnalysisFinalRuntimeBundlePlan['continuity_bundle'];
  runtime_bundle: MovieAnalysisFinalRuntimeBundlePlan['runtime_bundle'];
};

export type ExportSafetyFlags = {
  planning_only: true;
  design_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  no_inference: true;
};

export type MovieAnalysisExportEntry = {
  source_video_id: string;
  master_package_id: string;
  final_runtime_bundle_id: string;
  generation_blueprint_id: string;
  package_trace: PackageTraceEntry[];
  chain_ids: {
    analysis_plan_id: string;
    dry_run_id: string;
    frame_sampling_id: string;
    scene_detection_id: string;
    coordinate_extraction_id: string;
    gonegi_state_mapping_id: string;
    video_state_compilation_id: string;
    keyframe_preparation_id: string;
    motion_plan_id: string;
    temporal_flow_id: string;
    sequence_assembly_id: string;
    video_blueprint_id: string;
    runtime_package_id: string;
    generation_package_id: string;
    generation_blueprint_id: string;
    execution_readiness_id: string;
    final_runtime_bundle_id: string;
  };
  image_app: ImageAppExportPayload;
  video_app: VideoAppExportPayload;
  safety: ExportSafetyFlags;
};

export type MovieAnalysisExportPackage = {
  export_id: string;
  phase: typeof EXPORT_PACKAGE_PHASE;
  generated_at: string;
  source_count: number;
  design_only: true;
  full_trace_preserved: boolean;
  image_app_ready: boolean;
  video_app_ready: boolean;
  entries: MovieAnalysisExportEntry[];
  safety_summary: ExportSafetyFlags;
};

export type MovieAnalysisExportManifestEntry = {
  source_video_id: string;
  master_package_id: string;
  final_runtime_bundle_id: string;
  generation_blueprint_id: string;
  image_app_ready: boolean;
  video_app_ready: boolean;
};

export type MovieAnalysisExportManifest = {
  manifest_id: string;
  phase: typeof EXPORT_PACKAGE_PHASE;
  generated_at: string;
  package_path: typeof EXPORT_PACKAGE_PATH;
  report_path: typeof EXPORT_REPORT_PATH;
  consumer_targets: [typeof IMAGE_APP_CONSUMER_TARGET, typeof VIDEO_APP_CONSUMER_TARGET];
  source_count: number;
  entries: MovieAnalysisExportManifestEntry[];
};

export type ExportPackageValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type MovieAnalysisExportReport = {
  report_id: string;
  phase: typeof EXPORT_PACKAGE_PHASE;
  timestamp: string;
  source_count: number;
  full_trace_preserved: boolean;
  image_app_ready: boolean;
  video_app_ready: boolean;
  all_safety_flags_preserved: boolean;
  package_path: typeof EXPORT_PACKAGE_PATH;
  manifest_path: typeof EXPORT_MANIFEST_PATH;
  final_verdict: typeof EXPORT_PACKAGE_PASS_VERDICT | typeof EXPORT_PACKAGE_FAIL_VERDICT;
  issues: ExportPackageValidationIssue[];
};

function buildSafetyFlags(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan
): ExportSafetyFlags {
  return {
    planning_only: true,
    design_only: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution:
      master.safety_summary.no_execution === true &&
      bundle.execution_flags.final_runtime_bundle_only === true,
    no_rendering: master.safety_summary.no_rendering === true,
    no_inference: master.safety_summary.no_inference === true,
  };
}

function isFullTracePreserved(plan: MovieAnalysisMasterPackagePlan): boolean {
  if (plan.package_trace.length !== TRACE_DEFINITIONS.length) {
    return false;
  }
  for (let i = 0; i < TRACE_DEFINITIONS.length; i++) {
    const definition = TRACE_DEFINITIONS[i];
    const entry = plan.package_trace[i];
    if (
      !entry ||
      entry.step !== i + 1 ||
      entry.phase !== definition.phase ||
      entry.plan_id !== plan[definition.idKey]
    ) {
      return false;
    }
  }
  return true;
}

function isImageAppReady(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan,
  blueprint: MovieAnalysisGenerationBlueprintPlan
): boolean {
  return (
    Boolean(master.keyframe_preparation_id) &&
    Boolean(master.gonegi_state_mapping_id) &&
    blueprint.character_generation_structure.length > 0 &&
    blueprint.emotion_generation_structure.length > 0 &&
    bundle.character_bundle.length > 0 &&
    bundle.emotion_bundle.length > 0
  );
}

function isVideoAppReady(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan,
  blueprint: MovieAnalysisGenerationBlueprintPlan
): boolean {
  return (
    Boolean(master.video_blueprint_id) &&
    Boolean(master.temporal_flow_id) &&
    Boolean(master.sequence_assembly_id) &&
    Boolean(master.motion_plan_id) &&
    blueprint.scene_generation_structure.length > 0 &&
    blueprint.camera_generation_structure.length > 0 &&
    blueprint.transition_generation_structure.length > 0 &&
    blueprint.continuity_generation_structure.length > 0 &&
    bundle.scene_bundle.length > 0 &&
    bundle.camera_bundle.length > 0 &&
    bundle.transition_bundle.length > 0 &&
    bundle.continuity_bundle.length > 0 &&
    bundle.runtime_bundle.length > 0 &&
    master.readiness_summary.chain_complete === true
  );
}

function areSafetyFlagsPreserved(safety: ExportSafetyFlags): boolean {
  return (
    safety.planning_only === true &&
    safety.design_only === true &&
    safety.runtime_execution === false &&
    safety.video_generation === false &&
    safety.image_generation === false &&
    safety.gpu_execution === false &&
    safety.external_call_allowed === false &&
    safety.no_execution === true &&
    safety.no_rendering === true &&
    safety.no_inference === true
  );
}

function buildExportEntry(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan,
  blueprint: MovieAnalysisGenerationBlueprintPlan
): MovieAnalysisExportEntry {
  const safety = buildSafetyFlags(master, bundle);

  return {
    source_video_id: master.source_video_id,
    master_package_id: master.master_package_id,
    final_runtime_bundle_id: bundle.final_runtime_bundle_id,
    generation_blueprint_id: blueprint.generation_blueprint_id,
    package_trace: master.package_trace,
    chain_ids: {
      analysis_plan_id: master.analysis_plan_id,
      dry_run_id: master.dry_run_id,
      frame_sampling_id: master.frame_sampling_id,
      scene_detection_id: master.scene_detection_id,
      coordinate_extraction_id: master.coordinate_extraction_id,
      gonegi_state_mapping_id: master.gonegi_state_mapping_id,
      video_state_compilation_id: master.video_state_compilation_id,
      keyframe_preparation_id: master.keyframe_preparation_id,
      motion_plan_id: master.motion_plan_id,
      temporal_flow_id: master.temporal_flow_id,
      sequence_assembly_id: master.sequence_assembly_id,
      video_blueprint_id: master.video_blueprint_id,
      runtime_package_id: master.runtime_package_id,
      generation_package_id: master.generation_package_id,
      generation_blueprint_id: master.generation_blueprint_id,
      execution_readiness_id: master.execution_readiness_id,
      final_runtime_bundle_id: master.final_runtime_bundle_id,
    },
    image_app: {
      consumer_target: IMAGE_APP_CONSUMER_TARGET,
      keyframe_preparation_id: master.keyframe_preparation_id,
      gonegi_state_mapping_id: master.gonegi_state_mapping_id,
      video_state_compilation_id: master.video_state_compilation_id,
      character_generation_structure: blueprint.character_generation_structure,
      emotion_generation_structure: blueprint.emotion_generation_structure,
      character_bundle: bundle.character_bundle,
      emotion_bundle: bundle.emotion_bundle,
    },
    video_app: {
      consumer_target: VIDEO_APP_CONSUMER_TARGET,
      video_blueprint_id: master.video_blueprint_id,
      temporal_flow_id: master.temporal_flow_id,
      sequence_assembly_id: master.sequence_assembly_id,
      motion_plan_id: master.motion_plan_id,
      scene_generation_structure: blueprint.scene_generation_structure,
      camera_generation_structure: blueprint.camera_generation_structure,
      transition_generation_structure: blueprint.transition_generation_structure,
      continuity_generation_structure: blueprint.continuity_generation_structure,
      scene_bundle: bundle.scene_bundle,
      camera_bundle: bundle.camera_bundle,
      transition_bundle: bundle.transition_bundle,
      continuity_bundle: bundle.continuity_bundle,
      runtime_bundle: bundle.runtime_bundle,
    },
    safety,
  };
}

export function buildMovieAnalysisExportPackage(projectRoot?: string): {
  exportPackage: MovieAnalysisExportPackage;
  manifest: MovieAnalysisExportManifest;
  entries: MovieAnalysisExportEntry[];
} {
  const root = resolveProjectRoot(projectRoot);
  const timestamp = new Date().toISOString();
  const entries: MovieAnalysisExportEntry[] = [];

  for (const spec of SEED_MASTER_PACKAGE_SPECS) {
    const master = loadMovieAnalysisMasterPackagePlan(root, spec.master_package_id);
    if (!master) {
      throw new Error(`Missing master package plan: ${spec.master_package_id}`);
    }

    const bundle = loadMovieAnalysisFinalRuntimeBundlePlan(root, master.final_runtime_bundle_id);
    if (!bundle) {
      throw new Error(`Missing final runtime bundle plan: ${master.final_runtime_bundle_id}`);
    }

    const blueprint = loadMovieAnalysisGenerationBlueprintPlan(
      root,
      master.generation_blueprint_id
    );
    if (!blueprint) {
      throw new Error(`Missing generation blueprint plan: ${master.generation_blueprint_id}`);
    }

    if (
      master.final_runtime_bundle_id !== bundle.final_runtime_bundle_id ||
      master.generation_blueprint_id !== blueprint.generation_blueprint_id ||
      master.source_video_id !== bundle.source_video_id ||
      master.source_video_id !== blueprint.source_video_id
    ) {
      throw new Error(`Export source linkage mismatch for ${spec.master_package_id}`);
    }

    entries.push(buildExportEntry(master, bundle, blueprint));
  }

  const readinessChecks = entries.map((entry) => {
    const master = loadMovieAnalysisMasterPackagePlan(root, entry.master_package_id)!;
    const bundle = loadMovieAnalysisFinalRuntimeBundlePlan(root, entry.final_runtime_bundle_id)!;
    const blueprint = loadMovieAnalysisGenerationBlueprintPlan(
      root,
      entry.generation_blueprint_id
    )!;
    return {
      image: isImageAppReady(master, bundle, blueprint),
      video: isVideoAppReady(master, bundle, blueprint),
      trace: isFullTracePreserved(master),
    };
  });

  const fullTracePreserved =
    entries.length === EXPECTED_SOURCE_COUNT && readinessChecks.every((check) => check.trace);
  const imageAppReady =
    entries.length === EXPECTED_SOURCE_COUNT && readinessChecks.every((check) => check.image);
  const videoAppReady =
    entries.length === EXPECTED_SOURCE_COUNT && readinessChecks.every((check) => check.video);

  const exportPackage: MovieAnalysisExportPackage = {
    export_id: 'movie-analysis-export-package-v1',
    phase: EXPORT_PACKAGE_PHASE,
    generated_at: timestamp,
    source_count: entries.length,
    design_only: true,
    full_trace_preserved: fullTracePreserved,
    image_app_ready: imageAppReady,
    video_app_ready: videoAppReady,
    entries,
    safety_summary: {
      planning_only: true,
      design_only: true,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      no_inference: true,
    },
  };

  const manifest: MovieAnalysisExportManifest = {
    manifest_id: 'movie-analysis-export-manifest-v1',
    phase: EXPORT_PACKAGE_PHASE,
    generated_at: timestamp,
    package_path: EXPORT_PACKAGE_PATH,
    report_path: EXPORT_REPORT_PATH,
    consumer_targets: [IMAGE_APP_CONSUMER_TARGET, VIDEO_APP_CONSUMER_TARGET],
    source_count: entries.length,
    entries: entries.map((entry, index) => ({
      source_video_id: entry.source_video_id,
      master_package_id: entry.master_package_id,
      final_runtime_bundle_id: entry.final_runtime_bundle_id,
      generation_blueprint_id: entry.generation_blueprint_id,
      image_app_ready: readinessChecks[index].image,
      video_app_ready: readinessChecks[index].video,
    })),
  };

  return { exportPackage, manifest, entries };
}

export function writeMovieAnalysisExportPackage(projectRoot?: string): MovieAnalysisExportReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ExportPackageValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  for (const registryPath of [
    MASTER_PACKAGE_REGISTRY_PATH,
    FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
    GENERATION_BLUEPRINT_REGISTRY_PATH,
  ]) {
    if (!fs.existsSync(path.join(root, registryPath))) {
      issues.push({
        code: 'REGISTRY_MISSING',
        message: `Missing ${registryPath}`,
        severity: 'error',
      });
    }
  }

  const consumptionAuditPath = path.join(root, CONSUMPTION_READINESS_AUDIT_REPORT_PATH);
  if (!fs.existsSync(consumptionAuditPath)) {
    issues.push({
      code: 'CONSUMPTION_AUDIT_MISSING',
      message: `Missing ${CONSUMPTION_READINESS_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const consumptionAudit = JSON.parse(fs.readFileSync(consumptionAuditPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (consumptionAudit.final_verdict !== CONSUMPTION_READINESS_AUDIT_PASS_VERDICT) {
      issues.push({
        code: 'CONSUMPTION_AUDIT_NOT_PASS',
        message: `${CONSUMPTION_READINESS_AUDIT_REPORT_PATH} must have ${CONSUMPTION_READINESS_AUDIT_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  const { exportPackage, manifest, entries } = buildMovieAnalysisExportPackage(root);

  const fullTraceChecks = entries.map((entry) => {
    const master = loadMovieAnalysisMasterPackagePlan(root, entry.master_package_id);
    return master ? isFullTracePreserved(master) : false;
  });
  const fullTracePreserved =
    entries.length === EXPECTED_SOURCE_COUNT && fullTraceChecks.every(Boolean);

  if (!fullTracePreserved) {
    issues.push({
      code: 'FULL_TRACE_NOT_PRESERVED',
      message: 'package_trace must be 17/17 for all sources',
      severity: 'error',
    });
  }

  const imageAppReady =
    exportPackage.image_app_ready &&
    manifest.entries.every((entry) => entry.image_app_ready);

  const videoAppReady =
    exportPackage.video_app_ready &&
    manifest.entries.every((entry) => entry.video_app_ready);

  const allSafetyPreserved = entries.every((entry) => areSafetyFlagsPreserved(entry.safety));

  if (!imageAppReady) {
    issues.push({
      code: 'IMAGE_APP_NOT_READY',
      message: 'Image App export payloads are not ready',
      severity: 'error',
    });
  }
  if (!videoAppReady) {
    issues.push({
      code: 'VIDEO_APP_NOT_READY',
      message: 'Video App export payloads are not ready',
      severity: 'error',
    });
  }
  if (!allSafetyPreserved) {
    issues.push({
      code: 'SAFETY_FLAGS_NOT_PRESERVED',
      message: 'Safety flags not preserved in export package',
      severity: 'error',
    });
  }
  if (exportPackage.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}, got ${exportPackage.source_count}`,
      severity: 'error',
    });
  }

  exportPackage.full_trace_preserved = fullTracePreserved;
  exportPackage.image_app_ready = imageAppReady;
  exportPackage.video_app_ready = videoAppReady;

  const outDir = path.join(root, EXPORT_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, EXPORT_PACKAGE_PATH),
    `${JSON.stringify(exportPackage, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, EXPORT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const pass =
    exportPackage.source_count === EXPECTED_SOURCE_COUNT &&
    fullTracePreserved &&
    imageAppReady &&
    videoAppReady &&
    allSafetyPreserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisExportReport = {
    report_id: 'movie-analysis-export-report-v1',
    phase: EXPORT_PACKAGE_PHASE,
    timestamp,
    source_count: exportPackage.source_count,
    full_trace_preserved: fullTracePreserved,
    image_app_ready: imageAppReady,
    video_app_ready: videoAppReady,
    all_safety_flags_preserved: allSafetyPreserved,
    package_path: EXPORT_PACKAGE_PATH,
    manifest_path: EXPORT_MANIFEST_PATH,
    final_verdict: pass ? EXPORT_PACKAGE_PASS_VERDICT : EXPORT_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.writeFileSync(
    path.join(root, EXPORT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export function loadMovieAnalysisExportPackage(
  projectRoot?: string
): MovieAnalysisExportPackage | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, EXPORT_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisExportPackage;
}

export function loadMovieAnalysisExportManifest(
  projectRoot?: string
): MovieAnalysisExportManifest | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, EXPORT_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisExportManifest;
}

export function loadMovieAnalysisExportReport(
  projectRoot?: string
): MovieAnalysisExportReport | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, EXPORT_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisExportReport;
}
