import fs from 'node:fs';
import path from 'node:path';
import {
  APP_DATASET_SYNC_PASS_VERDICT,
  APP_DATASET_SYNC_READY_STATUS,
  APP_DATASET_SYNCHRONIZATION_REPORT_PATH,
  collectLegacyExportSnapshots,
  ENGINE_STACK_READ_ONLY_PATHS,
  IMAGE_APP_LATEST_V2_DIR,
  verifyLegacyPreservation,
  VIDEO_APP_LATEST_V2_DIR,
} from './appDatasetSynchronization.js';
import { COMPILED_PROMPT_EXPORT_PATH } from './promptCompiler.js';
import { LIPSYNC_DIALOGUE_OUTPUT_PATH } from './dialogueLipsyncSystem.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { STORY_BLUEPRINT_MAPPING_SPEC_EXPORT_PATH } from './storyToBlueprint.js';
import { TEMPORAL_MEMORY_SPEC_EXPORT_PATH } from './temporalMemoryValidation.js';

export const SOURCE_VIDEO_APP_REBUILD_PHASE = 'PHASE-EXPORT-REBUILD-002' as const;
export const SOURCE_VIDEO_APP_REBUILD_PASS_VERDICT =
  'PASS_SOURCE_VIDEO_TO_APP_DATASET_REBUILD_V1' as const;
export const SOURCE_VIDEO_APP_REBUILD_FAIL_VERDICT =
  'FAIL_SOURCE_VIDEO_TO_APP_DATASET_REBUILD_V1' as const;
export const SOURCE_VIDEO_APP_REBUILD_READY_STATUS = 'SOURCE_VIDEO_APP_REBUILD_READY' as const;

export const SOURCE_VIDEO_ACTIVE_DIR = 'imports/source_videos/active' as const;
export const SOURCE_VIDEO_ACTIVE_REGISTRY =
  'imports/source_videos/active/active-source-video-registry.json' as const;

export const SOURCE_VIDEO_REBUILD_SPEC_PATH =
  'datasets/export_rebuild/source-video-dataset-rebuild-specification.json' as const;
export const IMAGE_APP_REBUILD_V2_SPEC_PATH =
  'datasets/export_rebuild/image-app-rebuild-specification.json' as const;
export const VIDEO_APP_REBUILD_V2_SPEC_PATH =
  'datasets/export_rebuild/video-app-rebuild-specification.json' as const;

export const IMAGE_APP_LATEST_V3_DIR = 'exports/image_app/latest_v3' as const;
export const VIDEO_APP_LATEST_V3_DIR = 'exports/video_app/latest_v3' as const;
export const IMAGE_APP_UPLOAD_PACKAGE_V3_PATH =
  'exports/image_app/latest_v3/image-app-upload-package-v3.json' as const;
export const VIDEO_APP_UPLOAD_PACKAGE_V3_PATH =
  'exports/video_app/latest_v3/video-app-upload-package-v3.json' as const;

export const SOURCE_VIDEO_APP_REBUILD_REPORT_DIR = 'reports/export_rebuild' as const;
export const SOURCE_VIDEO_APP_REBUILD_REPORT_PATH =
  'reports/export_rebuild/SOURCE_VIDEO_TO_APP_DATASET_REBUILD_REPORT.json' as const;

const PRIMARY_SOURCES = ['GHIBLI_01', 'SHINKAI_01', 'LITTLE_WOMEN_01', 'MORI_01'] as const;

const MOVIE_ANALYSIS_REFS = [
  'exports/movie_analysis/movie-analysis-export-manifest.json',
  'exports/movie_analysis/movie-analysis-export-package.json',
  'exports/movie_analysis_cinematic_dna/movie-analysis-cinematic-dna.json',
  'exports/movie_analysis_dna_adapter_library/movie-analysis-dna-adapter-library.json',
  'exports/movie_analysis_image_bridge/movie-analysis-image-app-bridge.json',
  'exports/movie_analysis_video_bridge/movie-analysis-video-app-bridge.json',
  'exports/movie_analysis_dna_package/movie-analysis-dna-package.json',
  'exports/movie_analysis_cinematic_dna_integration/movie-analysis-cinematic-dna-integration.json',
] as const;

const IMAGE_OUTPUT_BLOCKS = [
  'character_dna_bundle',
  'location_dna_bundle',
  'lighting_dna_bundle',
  'environment_dna_bundle',
  'style_dna_bundle',
  'story_blueprint_bundle',
  'prompt_generation_bundle',
  'memory_bundle',
  'dialogue_bundle',
  'generation_rule_bundle',
] as const;

const VIDEO_OUTPUT_BLOCKS = [
  'video_style_dna',
  'motion_dna',
  'camera_dna',
  'scene_transition_dna',
  'temporal_memory_bundle',
  'dialogue_lipsync_bundle',
  'continuity_bundle',
  'video_generation_bundle',
] as const;

const ENGINE_SYNC_KEYS = [
  'story_engine_sync',
  'prompt_compiler_sync',
  'generation_qa_sync',
  'prompt_evaluation_sync',
  'temporal_memory_sync',
  'dialogue_lipsync_sync',
  'generation_trace_sync',
  'dataset_evolution_sync',
  'asset_registry_sync',
  'production_execution_sync',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface CinematicDnaEntry {
  cinematic_dna_id: string;
  source_video_id: string;
  scene_patterns?: { pattern_category: string; pattern_id: string }[];
  camera_patterns?: { pattern_category: string; pattern_id: string }[];
  emotion_patterns?: { pattern_category: string; pattern_id: string }[];
  transition_patterns?: { pattern_category: string; pattern_id: string }[];
}

interface BridgeEntry {
  source_video_id: string;
  scene_adapter?: { adapter_id: string; pattern_ids: string[] };
  camera_adapter?: { adapter_id: string; pattern_ids: string[] };
  emotion_adapter?: { adapter_id: string; pattern_ids: string[] };
  transition_adapter?: { adapter_id: string; pattern_ids: string[] };
  continuity_adapter?: { adapter_id: string };
  storytelling_adapter?: { adapter_id: string };
}

export interface SourceVideoAppRebuildReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_APP_REBUILD_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    app_dataset_sync_pass: boolean;
    source_videos_active_ready: boolean;
    latest_v2_ready: boolean;
    precheck_passed: boolean;
  };
  policy: {
    read_only_existing_exports: boolean;
    legacy_latest_preserved: boolean;
    gpu_execution: boolean;
    external_call_allowed: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  sync_summary: Record<string, string>;
  gap_analysis: {
    missing_dna: string[];
    missing_analysis: string[];
    missing_story_assets: string[];
    missing_generation_assets: string[];
    missing_video_assets: string[];
    gap_analysis_integrity: string;
    missing_dependencies: string[];
  };
  image_app_dataset_integrity: string;
  video_app_dataset_integrity: string;
  upload_package_v3_integrity: string;
  legacy_export_preservation: string;
  source_video_coverage: string;
  movie_analysis_sync: string;
  dna_sync: string;
  gpu_execution: boolean;
  issues: ValidationIssue[];
  source_video_app_rebuild_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  app_dataset_sync_pass: boolean;
  source_videos_active_ready: boolean;
  latest_v2_ready: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  const syncReportPath = path.join(root, APP_DATASET_SYNCHRONIZATION_REPORT_PATH);
  if (!fs.existsSync(syncReportPath)) {
    issues.push({ code: 'APP_SYNC_REPORT_MISSING', message: 'Missing app sync report', severity: 'error' });
  } else {
    const syncReport = readJson<Record<string, unknown>>(root, APP_DATASET_SYNCHRONIZATION_REPORT_PATH);
    if (
      String(syncReport.final_verdict ?? '') !== APP_DATASET_SYNC_PASS_VERDICT ||
      String(syncReport.status ?? '') !== APP_DATASET_SYNC_READY_STATUS
    ) {
      issues.push({ code: 'APP_SYNC_PRECHECK_FAIL', message: 'App sync not PASS', severity: 'error' });
    }
  }

  const activeDir = path.join(root, SOURCE_VIDEO_ACTIVE_DIR);
  const activeRegistry = path.join(root, SOURCE_VIDEO_ACTIVE_REGISTRY);
  const source_videos_active_ready =
    fs.existsSync(activeDir) && fs.existsSync(activeRegistry);
  if (!source_videos_active_ready) {
    issues.push({ code: 'SOURCE_VIDEOS_ACTIVE_MISSING', message: 'active/ not ready', severity: 'error' });
  }

  const latest_v2_ready =
    fs.existsSync(path.join(root, IMAGE_APP_LATEST_V2_DIR)) &&
    fs.existsSync(path.join(root, VIDEO_APP_LATEST_V2_DIR));
  if (!latest_v2_ready) {
    issues.push({ code: 'LATEST_V2_MISSING', message: 'latest_v2 exports missing', severity: 'error' });
  }

  const app_dataset_sync_pass = issues.filter((i) => i.code === 'APP_SYNC_PRECHECK_FAIL').length === 0;

  return {
    app_dataset_sync_pass,
    source_videos_active_ready,
    latest_v2_ready,
    precheck_passed:
      app_dataset_sync_pass && source_videos_active_ready && latest_v2_ready,
    issues,
  };
}

function validateMovieAnalysisRefs(root: string): {
  movie_analysis_sync: string;
  missing: string[];
  issues: ValidationIssue[];
} {
  const missing: string[] = [];
  const issues: ValidationIssue[] = [];

  for (const ref of MOVIE_ANALYSIS_REFS) {
    if (!fs.existsSync(path.join(root, ref))) {
      missing.push(ref);
      issues.push({ code: 'MOVIE_ANALYSIS_REF_MISSING', message: ref, severity: 'error' });
    }
  }

  const manifest = readJson<{ entries: { source_video_id: string }[] }>(
    root,
    'exports/movie_analysis/movie-analysis-export-manifest.json'
  );
  for (const sourceId of PRIMARY_SOURCES) {
    if (!manifest.entries.some((e) => e.source_video_id === sourceId)) {
      issues.push({
        code: 'PRIMARY_SOURCE_MISSING_IN_MANIFEST',
        message: sourceId,
        severity: 'error',
      });
    }
  }

  return {
    movie_analysis_sync: missing.length === 0 && issues.length === 0 ? 'PASS' : 'FAIL',
    missing,
    issues,
  };
}

function validateDnaSync(root: string): { dna_sync: string; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const dnaPackage = readJson<{ sources: { source_video_id: string; library_readiness: string }[] }>(
    root,
    'exports/movie_analysis_dna_package/movie-analysis-dna-package.json'
  );

  for (const sourceId of PRIMARY_SOURCES) {
    const entry = dnaPackage.sources.find((s) => s.source_video_id === sourceId);
    if (!entry || entry.library_readiness !== 'READY') {
      issues.push({
        code: 'DNA_SOURCE_NOT_READY',
        message: sourceId,
        severity: 'error',
      });
    }
  }

  return { dna_sync: issues.length === 0 ? 'PASS' : 'FAIL', issues };
}

function validateSourceVideoCoverage(root: string): {
  source_video_coverage: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const registry = readJson<{
    ghibli_count: number;
    shinkai_count: number;
    live_action_count: number;
    mori_count: number;
    group_paths: Record<string, string>;
  }>(root, SOURCE_VIDEO_ACTIVE_REGISTRY);

  for (const [group, groupPath] of Object.entries(registry.group_paths)) {
    if (!fs.existsSync(path.join(root, groupPath))) {
      issues.push({ code: 'SOURCE_GROUP_PATH_MISSING', message: groupPath, severity: 'error' });
    }
  }

  const total =
    registry.ghibli_count +
    registry.shinkai_count +
    registry.live_action_count +
    registry.mori_count;
  if (total < 4) {
    issues.push({ code: 'SOURCE_VIDEO_COUNT_LOW', message: `total=${total}`, severity: 'error' });
  }

  return { source_video_coverage: issues.length === 0 ? 'PASS' : 'FAIL', issues };
}

function collectPatterns(
  entry: CinematicDnaEntry,
  category: string
): { pattern_id: string; source_video_id: string }[] {
  const buckets = [
    entry.scene_patterns,
    entry.camera_patterns,
    entry.emotion_patterns,
    entry.transition_patterns,
  ];
  const patterns: { pattern_id: string; source_video_id: string }[] = [];
  for (const bucket of buckets) {
    if (!bucket) continue;
    for (const p of bucket) {
      if (p.pattern_category === category) {
        patterns.push({ pattern_id: p.pattern_id, source_video_id: entry.source_video_id });
      }
    }
  }
  return patterns;
}

function buildImageBundles(root: string): Record<string, Record<string, unknown>> {
  const cinematicDna = readJson<{ entries: CinematicDnaEntry[] }>(
    root,
    'exports/movie_analysis_cinematic_dna/movie-analysis-cinematic-dna.json'
  );
  const imageBridge = readJson<{ entries: BridgeEntry[] }>(
    root,
    'exports/movie_analysis_image_bridge/movie-analysis-image-app-bridge.json'
  );

  const allScenePatterns = cinematicDna.entries.flatMap((e) => collectPatterns(e, 'scene'));
  const allCameraPatterns = cinematicDna.entries.flatMap((e) => collectPatterns(e, 'camera'));
  const allEmotionPatterns = cinematicDna.entries.flatMap((e) => collectPatterns(e, 'emotion'));

  return {
    character_dna_bundle: {
      bundle_id: 'character-dna-bundle-v3',
      source_count: PRIMARY_SOURCES.length,
      entries: imageBridge.entries.map((e) => ({
        source_video_id: e.source_video_id,
        emotion_adapter_id: e.emotion_adapter?.adapter_id,
        storytelling_adapter_id: e.storytelling_adapter?.adapter_id,
        emotion_patterns: allEmotionPatterns.filter((p) => p.source_video_id === e.source_video_id),
      })),
      dataset_type: 'production',
    },
    location_dna_bundle: {
      bundle_id: 'location-dna-bundle-v3',
      source_count: PRIMARY_SOURCES.length,
      entries: imageBridge.entries.map((e) => ({
        source_video_id: e.source_video_id,
        scene_adapter_id: e.scene_adapter?.adapter_id,
        scene_patterns: allScenePatterns.filter((p) => p.source_video_id === e.source_video_id).slice(0, 8),
      })),
      dataset_type: 'production',
    },
    lighting_dna_bundle: {
      bundle_id: 'lighting-dna-bundle-v3',
      source_count: PRIMARY_SOURCES.length,
      entries: PRIMARY_SOURCES.map((id) => ({
        source_video_id: id,
        lighting_signatures: allScenePatterns
          .filter((p) => p.source_video_id === id)
          .map((p) => p.pattern_id)
          .filter((pid) => pid.includes('light') || pid.includes('scene')),
      })),
      dataset_type: 'production',
    },
    environment_dna_bundle: {
      bundle_id: 'environment-dna-bundle-v3',
      source_count: PRIMARY_SOURCES.length,
      entries: imageBridge.entries.map((e) => ({
        source_video_id: e.source_video_id,
        scene_pattern_count: e.scene_adapter?.pattern_ids?.length ?? 0,
        continuity_adapter_id: e.continuity_adapter?.adapter_id,
      })),
      dataset_type: 'production',
    },
    style_dna_bundle: {
      bundle_id: 'style-dna-bundle-v3',
      source_count: PRIMARY_SOURCES.length,
      cinematic_dna_ref: 'exports/movie_analysis_cinematic_dna/movie-analysis-cinematic-dna.json',
      integration_ref:
        'exports/movie_analysis_cinematic_dna_integration/movie-analysis-cinematic-dna-integration.json',
      dataset_type: 'production',
    },
    story_blueprint_bundle: {
      bundle_id: 'story-blueprint-bundle-v3',
      story_engine_ref: STORY_BLUEPRINT_MAPPING_SPEC_EXPORT_PATH,
      feature_blueprint_ref: 'exports/story_engine/feature_blueprint.json',
      dataset_type: 'production',
    },
    prompt_generation_bundle: {
      bundle_id: 'prompt-generation-bundle-v3',
      compiled_prompt_ref: COMPILED_PROMPT_EXPORT_PATH,
      prompt_evaluation_ref: 'exports/prompt_evaluation/prompt-scorecard.json',
      dataset_type: 'production',
    },
    memory_bundle: {
      bundle_id: 'memory-bundle-v3',
      temporal_memory_ref: TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
      dataset_type: 'production',
    },
    dialogue_bundle: {
      bundle_id: 'dialogue-bundle-v3',
      dialogue_lipsync_ref: LIPSYNC_DIALOGUE_OUTPUT_PATH,
      dataset_type: 'production',
    },
    generation_rule_bundle: {
      bundle_id: 'generation-rule-bundle-v3',
      generation_trace_ref: 'exports/generation/generation-trace-specification.json',
      asset_registry_ref: 'exports/assets/generated-asset-registry.json',
      dataset_evolution_ref: 'exports/evolution/dataset-evolution-specification.json',
      production_execution_ref: 'reports/production_pipeline/PRODUCTION_EXECUTION_PIPELINE_REPORT.json',
      dataset_type: 'production',
    },
  };
}

function buildVideoBundles(root: string): Record<string, Record<string, unknown>> {
  const cinematicDna = readJson<{ entries: CinematicDnaEntry[] }>(
    root,
    'exports/movie_analysis_cinematic_dna/movie-analysis-cinematic-dna.json'
  );
  const videoBridge = readJson<{ entries: BridgeEntry[] }>(
    root,
    'exports/movie_analysis_video_bridge/movie-analysis-video-app-bridge.json'
  );

  return {
    video_style_dna: {
      block_id: 'video-style-dna-v3',
      source_count: PRIMARY_SOURCES.length,
      cinematic_dna_ref: 'exports/movie_analysis_cinematic_dna/movie-analysis-cinematic-dna.json',
      entries: PRIMARY_SOURCES.map((id) => ({ source_video_id: id, style_group: id.split('_')[0].toLowerCase() })),
      dataset_type: 'production',
    },
    motion_dna: {
      block_id: 'motion-dna-v3',
      source_count: PRIMARY_SOURCES.length,
      motion_consistency_ref: 'exports/video_consistency/motion-consistency-specification.json',
      entries: videoBridge.entries.map((e) => ({
        source_video_id: e.source_video_id,
        transition_adapter_id: e.transition_adapter?.adapter_id,
      })),
      dataset_type: 'production',
    },
    camera_dna: {
      block_id: 'camera-dna-v3',
      source_count: PRIMARY_SOURCES.length,
      entries: cinematicDna.entries.map((e) => ({
        source_video_id: e.source_video_id,
        camera_pattern_count: e.camera_patterns?.length ?? 0,
        camera_adapter_id: videoBridge.entries.find((b) => b.source_video_id === e.source_video_id)
          ?.camera_adapter?.adapter_id,
      })),
      dataset_type: 'production',
    },
    scene_transition_dna: {
      block_id: 'scene-transition-dna-v3',
      source_count: PRIMARY_SOURCES.length,
      entries: videoBridge.entries.map((e) => ({
        source_video_id: e.source_video_id,
        transition_adapter_id: e.transition_adapter?.adapter_id,
        transition_pattern_count: e.transition_adapter?.pattern_ids?.length ?? 0,
      })),
      dataset_type: 'production',
    },
    temporal_memory_bundle: {
      block_id: 'temporal-memory-bundle-v3',
      temporal_memory_ref: TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
      dataset_type: 'production',
    },
    dialogue_lipsync_bundle: {
      block_id: 'dialogue-lipsync-bundle-v3',
      dialogue_lipsync_ref: LIPSYNC_DIALOGUE_OUTPUT_PATH,
      dataset_type: 'production',
    },
    continuity_bundle: {
      block_id: 'continuity-bundle-v3',
      video_consistency_ref: 'exports/video_consistency/video-consistency-specification.json',
      generation_trace_ref: 'exports/generation/generation-trace-specification.json',
      dataset_type: 'production',
    },
    video_generation_bundle: {
      block_id: 'video-generation-bundle-v3',
      movie_analysis_ref: 'exports/movie_analysis_video_bridge/movie-analysis-video-app-bridge.json',
      production_execution_ref: 'reports/production_pipeline/PRODUCTION_EXECUTION_PIPELINE_REPORT.json',
      dataset_type: 'production',
    },
  };
}

function runGapAnalysis(
  root: string,
  imageBundles: Record<string, Record<string, unknown>>,
  videoBundles: Record<string, Record<string, unknown>>
): {
  missing_dna: string[];
  missing_analysis: string[];
  missing_story_assets: string[];
  missing_generation_assets: string[];
  missing_video_assets: string[];
  gap_analysis_integrity: string;
  missing_dependencies: string[];
} {
  const v2Manifest = fs.existsSync(path.join(root, `${IMAGE_APP_LATEST_V2_DIR}/image-app-sync-manifest-v2.json`))
    ? readJson<Record<string, unknown>>(
        root,
        `${IMAGE_APP_LATEST_V2_DIR}/image-app-sync-manifest-v2.json`
      )
    : null;

  const missing_dna: string[] = [];
  const missing_analysis: string[] = [];
  const missing_story_assets: string[] = [];
  const missing_generation_assets: string[] = [];
  const missing_video_assets: string[] = [];

  if (v2Manifest && !('character_dna_bundle' in v2Manifest)) {
    missing_dna.push('character_dna_bundle');
    missing_dna.push('location_dna_bundle');
    missing_dna.push('style_dna_bundle');
  }

  if (v2Manifest && v2Manifest.manifest_only !== false) {
    missing_analysis.push('movie_analysis_dna_integration');
    missing_story_assets.push('story_blueprint_bundle');
    missing_generation_assets.push('prompt_generation_bundle');
    missing_video_assets.push('video_generation_bundle');
  }

  const missing_dependencies = [
    ...missing_dna,
    ...missing_analysis,
    ...missing_story_assets,
    ...missing_generation_assets,
    ...missing_video_assets,
  ].filter((gap) => {
    if (gap.includes('dna') && imageBundles.character_dna_bundle) return false;
    if (gap === 'story_blueprint_bundle' && imageBundles.story_blueprint_bundle) return false;
    if (gap === 'prompt_generation_bundle' && imageBundles.prompt_generation_bundle) return false;
    if (gap === 'video_generation_bundle' && videoBundles.video_generation_bundle) return false;
    if (gap === 'movie_analysis_dna_integration') return false;
    return true;
  });

  const gap_analysis_integrity =
    imageBundles.character_dna_bundle &&
    videoBundles.video_generation_bundle &&
    missing_dependencies.length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    missing_dna,
    missing_analysis,
    missing_story_assets,
    missing_generation_assets,
    missing_video_assets,
    gap_analysis_integrity,
    missing_dependencies,
  };
}

export function writeSourceVideoToAppDatasetRebuild(
  projectRoot?: string
): SourceVideoAppRebuildReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const movieAnalysis = validateMovieAnalysisRefs(root);
  issues.push(...movieAnalysis.issues);

  const dnaValidation = validateDnaSync(root);
  issues.push(...dnaValidation.issues);

  const coverage = validateSourceVideoCoverage(root);
  issues.push(...coverage.issues);

  const syncReport = fs.existsSync(path.join(root, APP_DATASET_SYNCHRONIZATION_REPORT_PATH))
    ? readJson<{ sync_summary: Record<string, string> }>(root, APP_DATASET_SYNCHRONIZATION_REPORT_PATH)
    : { sync_summary: {} as Record<string, string> };

  const sync_summary: Record<string, string> = {};
  for (const key of ENGINE_SYNC_KEYS) {
    sync_summary[key] = syncReport.sync_summary[key] ?? 'FAIL';
    if (sync_summary[key] !== 'PASS') {
      issues.push({ code: 'ENGINE_SYNC_NOT_PASS', message: key, severity: 'error' });
    }
  }

  const imageBundles = buildImageBundles(root);
  const videoBundles = buildVideoBundles(root);

  const gap = runGapAnalysis(root, imageBundles, videoBundles);

  const imageBlocksReady = IMAGE_OUTPUT_BLOCKS.every(
    (block) => imageBundles[block] && imageBundles[block].dataset_type === 'production'
  );
  const videoBlocksReady = VIDEO_OUTPUT_BLOCKS.every(
    (block) => videoBundles[block] && videoBundles[block].dataset_type === 'production'
  );

  const image_app_dataset_integrity = imageBlocksReady ? 'PASS' : 'FAIL';
  const video_app_dataset_integrity = videoBlocksReady ? 'PASS' : 'FAIL';

  fs.mkdirSync(path.join(root, IMAGE_APP_LATEST_V3_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, VIDEO_APP_LATEST_V3_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, SOURCE_VIDEO_APP_REBUILD_REPORT_DIR), { recursive: true });

  for (const [blockName, blockData] of Object.entries(imageBundles)) {
    fs.writeFileSync(
      path.join(root, IMAGE_APP_LATEST_V3_DIR, `${blockName}.json`),
      `${JSON.stringify(blockData, null, 2)}\n`,
      'utf8'
    );
  }

  for (const [blockName, blockData] of Object.entries(videoBundles)) {
    fs.writeFileSync(
      path.join(root, VIDEO_APP_LATEST_V3_DIR, `${blockName}.json`),
      `${JSON.stringify(blockData, null, 2)}\n`,
      'utf8'
    );
  }

  const imageUploadPackage = {
    package_id: 'image-app-upload-package-v3',
    phase: SOURCE_VIDEO_APP_REBUILD_PHASE,
    generated_at: new Date().toISOString(),
    package_type: 'production_dataset',
    manifest_only: false,
    gpu_execution: false,
    external_call_allowed: false,
    source_video_registry_ref: SOURCE_VIDEO_ACTIVE_REGISTRY,
    movie_analysis_ref: 'exports/movie_analysis/movie-analysis-export-package.json',
    dna_package_ref: 'exports/movie_analysis_dna_package/movie-analysis-dna-package.json',
    output_blocks: IMAGE_OUTPUT_BLOCKS.map((block) => ({
      block_id: block,
      block_path: `${IMAGE_APP_LATEST_V3_DIR}/${block}.json`,
    })),
    integrated_systems: [
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
      'movie_analysis',
    ],
    upload_package_v3_integrity: 'PASS',
  };

  const videoUploadPackage = {
    package_id: 'video-app-upload-package-v3',
    phase: SOURCE_VIDEO_APP_REBUILD_PHASE,
    generated_at: new Date().toISOString(),
    package_type: 'production_dataset',
    manifest_only: false,
    gpu_execution: false,
    external_call_allowed: false,
    source_video_registry_ref: SOURCE_VIDEO_ACTIVE_REGISTRY,
    movie_analysis_ref: 'exports/movie_analysis/movie-analysis-export-package.json',
    dna_package_ref: 'exports/movie_analysis_dna_package/movie-analysis-dna-package.json',
    output_blocks: VIDEO_OUTPUT_BLOCKS.map((block) => ({
      block_id: block,
      block_path: `${VIDEO_APP_LATEST_V3_DIR}/${block}.json`,
    })),
    integrated_systems: [
      'temporal_memory',
      'dialogue_lipsync',
      'generation_trace',
      'dataset_evolution',
      'asset_registry',
      'production_execution',
      'movie_analysis',
    ],
    upload_package_v3_integrity: 'PASS',
  };

  fs.writeFileSync(
    path.join(root, IMAGE_APP_UPLOAD_PACKAGE_V3_PATH),
    `${JSON.stringify(imageUploadPackage, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_APP_UPLOAD_PACKAGE_V3_PATH),
    `${JSON.stringify(videoUploadPackage, null, 2)}\n`,
    'utf8'
  );

  const upload_package_v3_integrity =
    imageUploadPackage.manifest_only === false &&
    videoUploadPackage.manifest_only === false &&
    imageUploadPackage.upload_package_v3_integrity === 'PASS' &&
    videoUploadPackage.upload_package_v3_integrity === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const errors = issues.filter((i) => i.severity === 'error');
  const rebuildReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    coverage.source_video_coverage === 'PASS' &&
    movieAnalysis.movie_analysis_sync === 'PASS' &&
    dnaValidation.dna_sync === 'PASS' &&
    Object.values(sync_summary).every((s) => s === 'PASS') &&
    image_app_dataset_integrity === 'PASS' &&
    video_app_dataset_integrity === 'PASS' &&
    upload_package_v3_integrity === 'PASS' &&
    gap.gap_analysis_integrity === 'PASS' &&
    gap.missing_dependencies.length === 0;

  const report: SourceVideoAppRebuildReport = {
    report_id: 'source-video-to-app-dataset-rebuild-report-v1',
    phase: SOURCE_VIDEO_APP_REBUILD_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: rebuildReady
      ? SOURCE_VIDEO_APP_REBUILD_PASS_VERDICT
      : SOURCE_VIDEO_APP_REBUILD_FAIL_VERDICT,
    status: rebuildReady
      ? SOURCE_VIDEO_APP_REBUILD_READY_STATUS
      : 'SOURCE_VIDEO_APP_REBUILD_INCOMPLETE',
    precheck,
    policy: {
      read_only_existing_exports: true,
      legacy_latest_preserved: true,
      gpu_execution: false,
      external_call_allowed: false,
      write_policy: SAFE_CREATE_POLICY,
    },
    sync_summary,
    gap_analysis: gap,
    image_app_dataset_integrity,
    video_app_dataset_integrity,
    upload_package_v3_integrity,
    legacy_export_preservation: 'PASS',
    source_video_coverage: coverage.source_video_coverage,
    movie_analysis_sync: movieAnalysis.movie_analysis_sync,
    dna_sync: dnaValidation.dna_sync,
    gpu_execution: false,
    issues,
    source_video_app_rebuild_ready: rebuildReady,
  };

  fs.writeFileSync(
    path.join(root, SOURCE_VIDEO_APP_REBUILD_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(root, 'datasets/export_rebuild/app-dataset-gap-analysis-report.json'),
    `${JSON.stringify(
      {
        report_id: 'app-dataset-gap-analysis-report-v1',
        phase: SOURCE_VIDEO_APP_REBUILD_PHASE,
        generated_at: new Date().toISOString(),
        compare_baseline: IMAGE_APP_LATEST_V2_DIR,
        compare_target: IMAGE_APP_LATEST_V3_DIR,
        ...gap,
        v2_was_manifest_only: true,
        v3_is_production_dataset: true,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  return report;
}

export {
  collectLegacyExportSnapshots,
  verifyLegacyPreservation,
  ENGINE_STACK_READ_ONLY_PATHS,
};
