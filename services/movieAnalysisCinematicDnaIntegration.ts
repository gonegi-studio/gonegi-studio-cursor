import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_PASS_VERDICT,
  CINEMATIC_DNA_PATH,
  CINEMATIC_DNA_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type CinematicDnaEntry,
  type CinematicDnaPattern,
  type MovieAnalysisCinematicDna,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CINEMATIC_DNA_INTEGRATION_PHASE =
  'PHASE-SOURCE-VIDEO-054-MOVIE_ANALYSIS_CINEMATIC_DNA_INTEGRATION_V1' as const;
export const CINEMATIC_DNA_INTEGRATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CINEMATIC_DNA_INTEGRATION_V1' as const;
export const CINEMATIC_DNA_INTEGRATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CINEMATIC_DNA_INTEGRATION_V1' as const;
export const CINEMATIC_DNA_INTEGRATION_SCHEMA_PATH =
  'datasets/movie_analysis/cinematic_dna_integration/movie-analysis-cinematic-dna-integration.schema.json' as const;
export const CINEMATIC_DNA_INTEGRATION_REGISTRY_PATH =
  'datasets/movie_analysis/cinematic_dna_integration/movie-analysis-cinematic-dna-integration-registry.json' as const;
export const CINEMATIC_DNA_INTEGRATION_EXPORT_DIR =
  'exports/movie_analysis_cinematic_dna_integration' as const;
export const CINEMATIC_DNA_INTEGRATION_PATH =
  'exports/movie_analysis_cinematic_dna_integration/movie-analysis-cinematic-dna-integration.json' as const;
export const CINEMATIC_DNA_INTEGRATION_REPORT_PATH =
  'reports/movie-analysis-cinematic-dna-integration-report.json' as const;
export const CINEMATIC_DNA_INTEGRATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_CINEMATIC_DNA_INTEGRATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type AdapterTarget =
  | 'scene_generation_adapter'
  | 'camera_generation_adapter'
  | 'emotion_generation_adapter'
  | 'transition_generation_adapter'
  | 'continuity_generation_adapter';

export type DnaAdapterMapping = {
  adapter_target: AdapterTarget;
  cinematic_dna_id: string;
  pattern_ids: string[];
  pattern_signatures: string[];
  pattern_count: number;
  mapping_ready: true;
  integration_only: true;
};

export type IntegrationSafety = {
  planning_only: true;
  integration_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type ImageAppUsageMapping = {
  consumer_target: 'image_app';
  emotion_generation_adapter: boolean;
  character_pattern_refs: string[];
  integration_ready: true;
};

export type VideoAppUsageMapping = {
  consumer_target: 'video_app';
  scene_generation_adapter: boolean;
  camera_generation_adapter: boolean;
  transition_generation_adapter: boolean;
  continuity_generation_adapter: boolean;
  integration_ready: true;
};

export type CinematicDnaIntegrationEntry = {
  integration_id: string;
  source_video_id: string;
  cinematic_dna_id: string;
  scene_dna_mapping: DnaAdapterMapping;
  camera_dna_mapping: DnaAdapterMapping;
  emotion_dna_mapping: DnaAdapterMapping;
  transition_dna_mapping: DnaAdapterMapping;
  continuity_dna_mapping: DnaAdapterMapping;
  image_app_usage_mapping: ImageAppUsageMapping;
  video_app_usage_mapping: VideoAppUsageMapping;
  reusability_score: number;
  integration_readiness: 'READY' | 'NOT_READY';
  safety: IntegrationSafety;
};

export type IntegrationSafetySummary = {
  planning_only: true;
  integration_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisCinematicDnaIntegration = {
  integration_set_id: string;
  integration_version: string;
  phase: typeof CINEMATIC_DNA_INTEGRATION_PHASE;
  integrated_at: string;
  source_count: number;
  cinematic_dna_set_id: string;
  entries: CinematicDnaIntegrationEntry[];
  safety_summary: IntegrationSafetySummary;
};

const ENTRY_SAFETY: IntegrationSafety = {
  planning_only: true,
  integration_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

const SAFETY_SUMMARY: IntegrationSafetySummary = {
  planning_only: true,
  integration_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

function buildAdapterMapping(
  adapterTarget: AdapterTarget,
  cinematicDnaId: string,
  patterns: CinematicDnaPattern[]
): DnaAdapterMapping {
  return {
    adapter_target: adapterTarget,
    cinematic_dna_id: cinematicDnaId,
    pattern_ids: patterns.map((pattern) => pattern.pattern_id),
    pattern_signatures: patterns.map((pattern) => pattern.pattern_signature),
    pattern_count: patterns.length,
    mapping_ready: true,
    integration_only: true,
  };
}

function buildIntegrationEntry(dnaEntry: CinematicDnaEntry): CinematicDnaIntegrationEntry {
  const slug = dnaEntry.source_video_id.toLowerCase();

  const sceneMapping = buildAdapterMapping(
    'scene_generation_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.scene_patterns
  );
  const cameraMapping = buildAdapterMapping(
    'camera_generation_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.camera_patterns
  );
  const emotionMapping = buildAdapterMapping(
    'emotion_generation_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.emotion_patterns
  );
  const transitionMapping = buildAdapterMapping(
    'transition_generation_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.transition_patterns
  );
  const continuityMapping = buildAdapterMapping(
    'continuity_generation_adapter',
    dnaEntry.cinematic_dna_id,
    dnaEntry.continuity_patterns
  );

  const imageAppMapping: ImageAppUsageMapping = {
    consumer_target: 'image_app',
    emotion_generation_adapter: emotionMapping.pattern_count > 0,
    character_pattern_refs: dnaEntry.image_app_usage.character_pattern_refs,
    integration_ready: true,
  };

  const videoAppMapping: VideoAppUsageMapping = {
    consumer_target: 'video_app',
    scene_generation_adapter: sceneMapping.pattern_count > 0,
    camera_generation_adapter: cameraMapping.pattern_count > 0,
    transition_generation_adapter: transitionMapping.pattern_count > 0,
    continuity_generation_adapter: continuityMapping.pattern_count > 0,
    integration_ready: true,
  };

  const integrationReady =
    sceneMapping.pattern_count > 0 &&
    cameraMapping.pattern_count > 0 &&
    emotionMapping.pattern_count > 0 &&
    transitionMapping.pattern_count > 0 &&
    continuityMapping.pattern_count > 0 &&
    imageAppMapping.emotion_generation_adapter &&
    videoAppMapping.scene_generation_adapter &&
    videoAppMapping.camera_generation_adapter &&
    videoAppMapping.transition_generation_adapter &&
    videoAppMapping.continuity_generation_adapter
      ? 'READY'
      : 'NOT_READY';

  return {
    integration_id: `cinematic_dna_integration_${slug}_v1`,
    source_video_id: dnaEntry.source_video_id,
    cinematic_dna_id: dnaEntry.cinematic_dna_id,
    scene_dna_mapping: sceneMapping,
    camera_dna_mapping: cameraMapping,
    emotion_dna_mapping: emotionMapping,
    transition_dna_mapping: transitionMapping,
    continuity_dna_mapping: continuityMapping,
    image_app_usage_mapping: imageAppMapping,
    video_app_usage_mapping: videoAppMapping,
    reusability_score: dnaEntry.reusability_score,
    integration_readiness: integrationReady,
    safety: ENTRY_SAFETY,
  };
}

export function buildMovieAnalysisCinematicDnaIntegration(
  projectRoot?: string
): MovieAnalysisCinematicDnaIntegration {
  const root = resolveProjectRoot(projectRoot);
  const cinematicDna = loadMovieAnalysisCinematicDna(root);
  if (!cinematicDna) {
    throw new Error(`Missing ${CINEMATIC_DNA_PATH}`);
  }

  if (cinematicDna.source_count !== EXPECTED_SOURCE_COUNT) {
    throw new Error(`Expected source_count=${EXPECTED_SOURCE_COUNT}`);
  }

  const entries: CinematicDnaIntegrationEntry[] = [];
  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const dnaEntry = cinematicDna.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    if (!dnaEntry) {
      throw new Error(`Missing cinematic DNA entry for ${sourceVideoId}`);
    }
    entries.push(buildIntegrationEntry(dnaEntry));
  }

  return {
    integration_set_id: 'movie-analysis-cinematic-dna-integration-v1',
    integration_version: 'v1',
    phase: CINEMATIC_DNA_INTEGRATION_PHASE,
    integrated_at: new Date().toISOString(),
    source_count: entries.length,
    cinematic_dna_set_id: cinematicDna.cinematic_dna_set_id,
    entries,
    safety_summary: SAFETY_SUMMARY,
  };
}

export function writeMovieAnalysisCinematicDnaIntegration(
  projectRoot?: string
): MovieAnalysisCinematicDnaIntegration {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, CINEMATIC_DNA_PATH))) {
    throw new Error(`Missing ${CINEMATIC_DNA_PATH}`);
  }

  const cinematicDnaReportPath = path.join(root, CINEMATIC_DNA_REPORT_PATH);
  if (!fs.existsSync(cinematicDnaReportPath)) {
    throw new Error(`Missing ${CINEMATIC_DNA_REPORT_PATH}`);
  }

  const cinematicDnaReport = JSON.parse(fs.readFileSync(cinematicDnaReportPath, 'utf8')) as {
    final_verdict?: string;
    cinematic_dna_complete?: string;
  };

  if (cinematicDnaReport.final_verdict !== CINEMATIC_DNA_PASS_VERDICT) {
    throw new Error(`Cinematic DNA must have ${CINEMATIC_DNA_PASS_VERDICT}`);
  }

  if (cinematicDnaReport.cinematic_dna_complete !== 'PASS') {
    throw new Error('Cinematic DNA cinematic_dna_complete must be PASS');
  }

  const integration = buildMovieAnalysisCinematicDnaIntegration(root);
  const outDir = path.join(root, CINEMATIC_DNA_INTEGRATION_EXPORT_DIR);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, CINEMATIC_DNA_INTEGRATION_PATH),
    `${JSON.stringify(integration, null, 2)}\n`,
    'utf8'
  );

  return integration;
}

export function loadMovieAnalysisCinematicDnaIntegration(
  projectRoot?: string
): MovieAnalysisCinematicDnaIntegration | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, CINEMATIC_DNA_INTEGRATION_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisCinematicDnaIntegration;
}
