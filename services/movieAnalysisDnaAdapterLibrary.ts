import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT,
  CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH,
} from './movieAnalysisCinematicDnaQualityGate.js';
import {
  CINEMATIC_DNA_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type CinematicDnaEntry,
  type CinematicDnaPattern,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import {
  CINEMATIC_DNA_INTEGRATION_PATH,
  type CinematicDnaIntegrationEntry,
  type DnaAdapterMapping,
  type MovieAnalysisCinematicDnaIntegration,
  loadMovieAnalysisCinematicDnaIntegration,
} from './movieAnalysisCinematicDnaIntegration.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_ADAPTER_LIBRARY_PHASE =
  'PHASE-SOURCE-VIDEO-056-MOVIE_ANALYSIS_DNA_ADAPTER_LIBRARY_V1' as const;
export const DNA_ADAPTER_LIBRARY_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_ADAPTER_LIBRARY_V1' as const;
export const DNA_ADAPTER_LIBRARY_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_ADAPTER_LIBRARY_V1' as const;
export const DNA_ADAPTER_LIBRARY_SCHEMA_PATH =
  'datasets/movie_analysis/dna_adapter_library/movie-analysis-dna-adapter-library.schema.json' as const;
export const DNA_ADAPTER_LIBRARY_REGISTRY_PATH =
  'datasets/movie_analysis/dna_adapter_library/movie-analysis-dna-adapter-library-registry.json' as const;
export const DNA_ADAPTER_LIBRARY_EXPORT_DIR =
  'exports/movie_analysis_dna_adapter_library' as const;
export const DNA_ADAPTER_LIBRARY_PATH =
  'exports/movie_analysis_dna_adapter_library/movie-analysis-dna-adapter-library.json' as const;
export const DNA_ADAPTER_LIBRARY_REPORT_PATH =
  'reports/movie-analysis-dna-adapter-library-report.json' as const;
export const DNA_ADAPTER_LIBRARY_MD_PATH =
  'reports/MOVIE_ANALYSIS_DNA_ADAPTER_LIBRARY.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type AdapterType =
  | 'scene_adapter'
  | 'camera_adapter'
  | 'emotion_adapter'
  | 'transition_adapter'
  | 'continuity_adapter'
  | 'storytelling_adapter';

export type DnaAdapterDefinition = {
  adapter_type: AdapterType;
  adapter_id: string;
  cinematic_dna_id: string;
  pattern_ids: string[];
  pattern_signatures: string[];
  pattern_count: number;
  adapter_ready: true;
  library_only: true;
};

export type AdapterLibrarySafety = {
  planning_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type ImageAdapterMapping = {
  consumer_target: 'image_app';
  emotion_adapter: boolean;
  character_pattern_refs: string[];
  adapter_ready: true;
};

export type VideoAdapterMapping = {
  consumer_target: 'video_app';
  scene_adapter: boolean;
  camera_adapter: boolean;
  transition_adapter: boolean;
  continuity_adapter: boolean;
  storytelling_adapter: boolean;
  adapter_ready: true;
};

export type DnaAdapterLibraryEntry = {
  adapter_library_entry_id: string;
  source_video_id: string;
  cinematic_dna_id: string;
  integration_id: string;
  scene_adapter: DnaAdapterDefinition;
  camera_adapter: DnaAdapterDefinition;
  emotion_adapter: DnaAdapterDefinition;
  transition_adapter: DnaAdapterDefinition;
  continuity_adapter: DnaAdapterDefinition;
  storytelling_adapter: DnaAdapterDefinition;
  image_adapter_mapping: ImageAdapterMapping;
  video_adapter_mapping: VideoAdapterMapping;
  reusability_score: number;
  library_readiness: 'READY' | 'NOT_READY';
  safety: AdapterLibrarySafety;
};

export type AdapterLibrarySafetySummary = {
  planning_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisDnaAdapterLibrary = {
  adapter_library_id: string;
  adapter_library_version: string;
  phase: typeof DNA_ADAPTER_LIBRARY_PHASE;
  assembled_at: string;
  source_count: number;
  cinematic_dna_set_id: string;
  integration_set_id: string;
  quality_gate_verdict: typeof CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT;
  entries: DnaAdapterLibraryEntry[];
  safety_summary: AdapterLibrarySafetySummary;
};

const ENTRY_SAFETY: AdapterLibrarySafety = {
  planning_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

const SAFETY_SUMMARY: AdapterLibrarySafetySummary = {
  planning_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

function buildAdapterFromMapping(
  adapterType: AdapterType,
  cinematicDnaId: string,
  sourceVideoId: string,
  mapping: DnaAdapterMapping
): DnaAdapterDefinition {
  const slug = sourceVideoId.toLowerCase();
  return {
    adapter_type: adapterType,
    adapter_id: `dna_adapter_${adapterType}_${slug}_v1`,
    cinematic_dna_id: cinematicDnaId,
    pattern_ids: mapping.pattern_ids,
    pattern_signatures: mapping.pattern_signatures,
    pattern_count: mapping.pattern_count,
    adapter_ready: true,
    library_only: true,
  };
}

function buildStorytellingAdapter(
  cinematicDnaId: string,
  sourceVideoId: string,
  patterns: CinematicDnaPattern[]
): DnaAdapterDefinition {
  const slug = sourceVideoId.toLowerCase();
  return {
    adapter_type: 'storytelling_adapter',
    adapter_id: `dna_adapter_storytelling_adapter_${slug}_v1`,
    cinematic_dna_id: cinematicDnaId,
    pattern_ids: patterns.map((pattern) => pattern.pattern_id),
    pattern_signatures: patterns.map((pattern) => pattern.pattern_signature),
    pattern_count: patterns.length,
    adapter_ready: true,
    library_only: true,
  };
}

function buildLibraryEntry(
  dnaEntry: CinematicDnaEntry,
  integrationEntry: CinematicDnaIntegrationEntry
): DnaAdapterLibraryEntry {
  const slug = dnaEntry.source_video_id.toLowerCase();

  const sceneAdapter = buildAdapterFromMapping(
    'scene_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.source_video_id,
    integrationEntry.scene_dna_mapping
  );
  const cameraAdapter = buildAdapterFromMapping(
    'camera_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.source_video_id,
    integrationEntry.camera_dna_mapping
  );
  const emotionAdapter = buildAdapterFromMapping(
    'emotion_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.source_video_id,
    integrationEntry.emotion_dna_mapping
  );
  const transitionAdapter = buildAdapterFromMapping(
    'transition_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.source_video_id,
    integrationEntry.transition_dna_mapping
  );
  const continuityAdapter = buildAdapterFromMapping(
    'continuity_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.source_video_id,
    integrationEntry.continuity_dna_mapping
  );
  const storytellingAdapter = buildStorytellingAdapter(
    dnaEntry.cinematic_dna_id,
    dnaEntry.source_video_id,
    dnaEntry.storytelling_patterns
  );

  const imageAdapterMapping: ImageAdapterMapping = {
    consumer_target: 'image_app',
    emotion_adapter: emotionAdapter.pattern_count > 0,
    character_pattern_refs: integrationEntry.image_app_usage_mapping.character_pattern_refs,
    adapter_ready: true,
  };

  const videoAdapterMapping: VideoAdapterMapping = {
    consumer_target: 'video_app',
    scene_adapter: sceneAdapter.pattern_count > 0,
    camera_adapter: cameraAdapter.pattern_count > 0,
    transition_adapter: transitionAdapter.pattern_count > 0,
    continuity_adapter: continuityAdapter.pattern_count > 0,
    storytelling_adapter: storytellingAdapter.pattern_count > 0,
    adapter_ready: true,
  };

  const libraryReady =
    sceneAdapter.pattern_count > 0 &&
    cameraAdapter.pattern_count > 0 &&
    emotionAdapter.pattern_count > 0 &&
    transitionAdapter.pattern_count > 0 &&
    continuityAdapter.pattern_count > 0 &&
    storytellingAdapter.pattern_count > 0 &&
    imageAdapterMapping.emotion_adapter &&
    videoAdapterMapping.scene_adapter &&
    videoAdapterMapping.camera_adapter &&
    videoAdapterMapping.transition_adapter &&
    videoAdapterMapping.continuity_adapter &&
    videoAdapterMapping.storytelling_adapter
      ? 'READY'
      : 'NOT_READY';

  return {
    adapter_library_entry_id: `dna_adapter_library_entry_${slug}_v1`,
    source_video_id: dnaEntry.source_video_id,
    cinematic_dna_id: dnaEntry.cinematic_dna_id,
    integration_id: integrationEntry.integration_id,
    scene_adapter: sceneAdapter,
    camera_adapter: cameraAdapter,
    emotion_adapter: emotionAdapter,
    transition_adapter: transitionAdapter,
    continuity_adapter: continuityAdapter,
    storytelling_adapter: storytellingAdapter,
    image_adapter_mapping: imageAdapterMapping,
    video_adapter_mapping: videoAdapterMapping,
    reusability_score: integrationEntry.reusability_score,
    library_readiness: libraryReady,
    safety: ENTRY_SAFETY,
  };
}

export function buildMovieAnalysisDnaAdapterLibrary(
  projectRoot?: string
): MovieAnalysisDnaAdapterLibrary {
  const root = resolveProjectRoot(projectRoot);
  const cinematicDna = loadMovieAnalysisCinematicDna(root);
  const integration = loadMovieAnalysisCinematicDnaIntegration(root);

  if (!cinematicDna) {
    throw new Error(`Missing ${CINEMATIC_DNA_PATH}`);
  }
  if (!integration) {
    throw new Error(`Missing ${CINEMATIC_DNA_INTEGRATION_PATH}`);
  }

  const qualityGatePath = path.join(root, CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH);
  if (!fs.existsSync(qualityGatePath)) {
    throw new Error(`Missing ${CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH}`);
  }

  const qualityGate = JSON.parse(fs.readFileSync(qualityGatePath, 'utf8')) as {
    final_verdict?: string;
    dna_library_ready?: string;
  };

  if (qualityGate.final_verdict !== CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT) {
    throw new Error(`Quality gate must have ${CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT}`);
  }

  const entries: DnaAdapterLibraryEntry[] = [];
  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const dnaEntry = cinematicDna.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const integrationEntry = integration.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    if (!dnaEntry || !integrationEntry) {
      throw new Error(`Missing DNA or integration entry for ${sourceVideoId}`);
    }
    entries.push(buildLibraryEntry(dnaEntry, integrationEntry));
  }

  return {
    adapter_library_id: 'movie-analysis-dna-adapter-library-v1',
    adapter_library_version: 'v1',
    phase: DNA_ADAPTER_LIBRARY_PHASE,
    assembled_at: new Date().toISOString(),
    source_count: entries.length,
    cinematic_dna_set_id: cinematicDna.cinematic_dna_set_id,
    integration_set_id: integration.integration_set_id,
    quality_gate_verdict: CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT,
    entries,
    safety_summary: SAFETY_SUMMARY,
  };
}

export function writeMovieAnalysisDnaAdapterLibrary(
  projectRoot?: string
): MovieAnalysisDnaAdapterLibrary {
  const root = resolveProjectRoot(projectRoot);

  for (const required of [
    CINEMATIC_DNA_PATH,
    CINEMATIC_DNA_INTEGRATION_PATH,
    CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH,
  ]) {
    if (!fs.existsSync(path.join(root, required))) {
      throw new Error(`Missing ${required}`);
    }
  }

  const library = buildMovieAnalysisDnaAdapterLibrary(root);
  const outDir = path.join(root, DNA_ADAPTER_LIBRARY_EXPORT_DIR);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_ADAPTER_LIBRARY_PATH),
    `${JSON.stringify(library, null, 2)}\n`,
    'utf8'
  );

  return library;
}

export function loadMovieAnalysisDnaAdapterLibrary(
  projectRoot?: string
): MovieAnalysisDnaAdapterLibrary | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DNA_ADAPTER_LIBRARY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaAdapterLibrary;
}
