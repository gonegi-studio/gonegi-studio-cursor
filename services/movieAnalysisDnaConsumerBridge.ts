import fs from 'node:fs';
import path from 'node:path';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type DnaAdapterDefinition,
  type DnaAdapterLibraryEntry,
  type ImageAdapterMapping,
  type VideoAdapterMapping,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  DNA_PACKAGE_PATH,
  DNA_PACKAGING_PASS_VERDICT,
  DNA_PACKAGE_REPORT_PATH,
  type DnaPackageSourceEntry,
  type MovieAnalysisDnaPackage,
  loadMovieAnalysisDnaPackage,
} from './movieAnalysisDnaPackaging.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_CONSUMER_BRIDGE_PHASE =
  'PHASE-SOURCE-VIDEO-060-MOVIE_ANALYSIS_DNA_CONSUMER_BRIDGE_V1' as const;
export const DNA_CONSUMER_BRIDGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_CONSUMER_BRIDGE_V1' as const;
export const DNA_CONSUMER_BRIDGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_CONSUMER_BRIDGE_V1' as const;
export const DNA_CONSUMER_BRIDGE_DIR = 'exports/movie_analysis_dna_consumer_bridge' as const;
export const DNA_IMAGE_BRIDGE_PATH =
  'exports/movie_analysis_dna_consumer_bridge/movie-analysis-dna-image-bridge.json' as const;
export const DNA_VIDEO_BRIDGE_PATH =
  'exports/movie_analysis_dna_consumer_bridge/movie-analysis-dna-video-bridge.json' as const;
export const DNA_CONSUMER_BRIDGE_REPORT_PATH =
  'exports/movie_analysis_dna_consumer_bridge/movie-analysis-dna-consumer-bridge-report.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type DnaBridgeSafetySummary = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type DnaImageBridgeEntry = {
  source_video_id: string;
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  package_id: string;
  emotion_adapter: DnaAdapterDefinition;
  character_pattern_refs: string[];
  adapter_mapping: ImageAdapterMapping;
  consumer_ready: true;
  bridge_only: true;
};

export type DnaVideoBridgeEntry = {
  source_video_id: string;
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  package_id: string;
  scene_adapter: DnaAdapterDefinition;
  camera_adapter: DnaAdapterDefinition;
  transition_adapter: DnaAdapterDefinition;
  continuity_adapter: DnaAdapterDefinition;
  storytelling_adapter: DnaAdapterDefinition;
  adapter_mapping: VideoAdapterMapping;
  consumer_ready: true;
  bridge_only: true;
};

export type MovieAnalysisDnaImageBridge = {
  bridge_id: string;
  bridge_type: 'movie_analysis_dna_image_bridge';
  phase: typeof DNA_CONSUMER_BRIDGE_PHASE;
  consumer_target: 'image_app';
  generated_at: string;
  source_package_path: typeof DNA_PACKAGE_PATH;
  package_id: string;
  adapter_library_id: string;
  cinematic_dna_set_id: string;
  integration_set_id: string;
  source_count: number;
  entries: DnaImageBridgeEntry[];
  safety_summary: DnaBridgeSafetySummary;
};

export type MovieAnalysisDnaVideoBridge = {
  bridge_id: string;
  bridge_type: 'movie_analysis_dna_video_bridge';
  phase: typeof DNA_CONSUMER_BRIDGE_PHASE;
  consumer_target: 'video_app';
  generated_at: string;
  source_package_path: typeof DNA_PACKAGE_PATH;
  package_id: string;
  adapter_library_id: string;
  cinematic_dna_set_id: string;
  integration_set_id: string;
  source_count: number;
  entries: DnaVideoBridgeEntry[];
  safety_summary: DnaBridgeSafetySummary;
};

const BRIDGE_SAFETY_SUMMARY: DnaBridgeSafetySummary = {
  planning_only: true,
  generation: false,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

function buildImageEntry(
  packageSource: DnaPackageSourceEntry,
  libraryEntry: DnaAdapterLibraryEntry,
  packageId: string
): DnaImageBridgeEntry {
  return {
    source_video_id: packageSource.source_video_id,
    cinematic_dna_id: packageSource.cinematic_dna_id,
    integration_id: packageSource.integration_id,
    adapter_library_entry_id: packageSource.adapter_library_entry_id,
    package_id: packageId,
    emotion_adapter: libraryEntry.emotion_adapter,
    character_pattern_refs: libraryEntry.image_adapter_mapping.character_pattern_refs,
    adapter_mapping: libraryEntry.image_adapter_mapping,
    consumer_ready: true,
    bridge_only: true,
  };
}

function buildVideoEntry(
  packageSource: DnaPackageSourceEntry,
  libraryEntry: DnaAdapterLibraryEntry,
  packageId: string
): DnaVideoBridgeEntry {
  return {
    source_video_id: packageSource.source_video_id,
    cinematic_dna_id: packageSource.cinematic_dna_id,
    integration_id: packageSource.integration_id,
    adapter_library_entry_id: packageSource.adapter_library_entry_id,
    package_id: packageId,
    scene_adapter: libraryEntry.scene_adapter,
    camera_adapter: libraryEntry.camera_adapter,
    transition_adapter: libraryEntry.transition_adapter,
    continuity_adapter: libraryEntry.continuity_adapter,
    storytelling_adapter: libraryEntry.storytelling_adapter,
    adapter_mapping: libraryEntry.video_adapter_mapping,
    consumer_ready: true,
    bridge_only: true,
  };
}

export function buildMovieAnalysisDnaConsumerBridges(projectRoot?: string): {
  imageBridge: MovieAnalysisDnaImageBridge;
  videoBridge: MovieAnalysisDnaVideoBridge;
} {
  const root = resolveProjectRoot(projectRoot);
  const dnaPackage = loadMovieAnalysisDnaPackage(root);
  const adapterLibrary = loadMovieAnalysisDnaAdapterLibrary(root);

  if (!dnaPackage) {
    throw new Error(`Missing ${DNA_PACKAGE_PATH}`);
  }
  if (!adapterLibrary) {
    throw new Error(`Missing ${DNA_ADAPTER_LIBRARY_PATH}`);
  }

  if (!dnaPackage.package_readiness.package_ready) {
    throw new Error('DNA package package_ready must be true');
  }

  const packageReportPath = path.join(root, DNA_PACKAGE_REPORT_PATH);
  if (fs.existsSync(packageReportPath)) {
    const packageReport = JSON.parse(fs.readFileSync(packageReportPath, 'utf8')) as {
      final_verdict?: string;
      package_ready?: string;
    };
    if (packageReport.final_verdict !== DNA_PACKAGING_PASS_VERDICT) {
      throw new Error(`DNA package must have ${DNA_PACKAGING_PASS_VERDICT}`);
    }
  }

  const imageEntries: DnaImageBridgeEntry[] = [];
  const videoEntries: DnaVideoBridgeEntry[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const packageSource = dnaPackage.sources.find(
      (source) => source.source_video_id === sourceVideoId
    );
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );

    if (!packageSource || !libraryEntry) {
      throw new Error(`Missing package or library entry for ${sourceVideoId}`);
    }

    if (
      packageSource.cinematic_dna_id !== libraryEntry.cinematic_dna_id ||
      packageSource.integration_id !== libraryEntry.integration_id ||
      packageSource.adapter_library_entry_id !== libraryEntry.adapter_library_entry_id
    ) {
      throw new Error(`Traceability mismatch for ${sourceVideoId}`);
    }

    imageEntries.push(buildImageEntry(packageSource, libraryEntry, dnaPackage.package_id));
    videoEntries.push(buildVideoEntry(packageSource, libraryEntry, dnaPackage.package_id));
  }

  const generatedAt = new Date().toISOString();

  const imageBridge: MovieAnalysisDnaImageBridge = {
    bridge_id: 'movie-analysis-dna-image-bridge-v1',
    bridge_type: 'movie_analysis_dna_image_bridge',
    phase: DNA_CONSUMER_BRIDGE_PHASE,
    consumer_target: 'image_app',
    generated_at: generatedAt,
    source_package_path: DNA_PACKAGE_PATH,
    package_id: dnaPackage.package_id,
    adapter_library_id: dnaPackage.adapter_library_id,
    cinematic_dna_set_id: dnaPackage.cinematic_dna_set_id,
    integration_set_id: dnaPackage.integration_set_id,
    source_count: imageEntries.length,
    entries: imageEntries,
    safety_summary: BRIDGE_SAFETY_SUMMARY,
  };

  const videoBridge: MovieAnalysisDnaVideoBridge = {
    bridge_id: 'movie-analysis-dna-video-bridge-v1',
    bridge_type: 'movie_analysis_dna_video_bridge',
    phase: DNA_CONSUMER_BRIDGE_PHASE,
    consumer_target: 'video_app',
    generated_at: generatedAt,
    source_package_path: DNA_PACKAGE_PATH,
    package_id: dnaPackage.package_id,
    adapter_library_id: dnaPackage.adapter_library_id,
    cinematic_dna_set_id: dnaPackage.cinematic_dna_set_id,
    integration_set_id: dnaPackage.integration_set_id,
    source_count: videoEntries.length,
    entries: videoEntries,
    safety_summary: BRIDGE_SAFETY_SUMMARY,
  };

  return { imageBridge, videoBridge };
}

export function writeMovieAnalysisDnaConsumerBridge(projectRoot?: string): {
  imageBridge: MovieAnalysisDnaImageBridge;
  videoBridge: MovieAnalysisDnaVideoBridge;
} {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, DNA_PACKAGE_PATH))) {
    throw new Error(`Missing ${DNA_PACKAGE_PATH}`);
  }

  const { imageBridge, videoBridge } = buildMovieAnalysisDnaConsumerBridges(root);
  const outDir = path.join(root, DNA_CONSUMER_BRIDGE_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, DNA_IMAGE_BRIDGE_PATH),
    `${JSON.stringify(imageBridge, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_VIDEO_BRIDGE_PATH),
    `${JSON.stringify(videoBridge, null, 2)}\n`,
    'utf8'
  );

  return { imageBridge, videoBridge };
}

export function loadMovieAnalysisDnaImageBridge(
  projectRoot?: string
): MovieAnalysisDnaImageBridge | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DNA_IMAGE_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaImageBridge;
}

export function loadMovieAnalysisDnaVideoBridge(
  projectRoot?: string
): MovieAnalysisDnaVideoBridge | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DNA_VIDEO_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaVideoBridge;
}
