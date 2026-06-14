import fs from 'node:fs';
import path from 'node:path';
import {
  DATASET_CERTIFICATION_PASS_VERDICT,
  DATASET_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisDatasetCertification.js';
import { DATASET_PATH, loadMovieAnalysisDataset } from './movieAnalysisDatasetExport.js';
import {
  type ImageAppExportPayload,
  type VideoAppExportPayload,
} from './movieAnalysisExportPackage.js';
import {
  RELEASE_PACKAGE_PASS_VERDICT,
  RELEASE_PACKAGE_PATH,
  RELEASE_REPORT_PATH,
  loadMovieAnalysisReleasePackage,
  loadMovieAnalysisReleaseReport,
} from './movieAnalysisReleasePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CINEMATIC_DNA_PHASE =
  'PHASE-SOURCE-VIDEO-053-MOVIE_ANALYSIS_CINEMATIC_DNA_EXTRACTION_V1' as const;
export const CINEMATIC_DNA_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CINEMATIC_DNA_EXTRACTION_V1' as const;
export const CINEMATIC_DNA_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CINEMATIC_DNA_EXTRACTION_V1' as const;
export const CINEMATIC_DNA_SCHEMA_PATH =
  'datasets/movie_analysis/cinematic_dna/movie-analysis-cinematic-dna.schema.json' as const;
export const CINEMATIC_DNA_REGISTRY_PATH =
  'datasets/movie_analysis/cinematic_dna/movie-analysis-cinematic-dna-registry.json' as const;
export const CINEMATIC_DNA_EXPORT_DIR = 'exports/movie_analysis_cinematic_dna' as const;
export const CINEMATIC_DNA_PATH =
  'exports/movie_analysis_cinematic_dna/movie-analysis-cinematic-dna.json' as const;
export const CINEMATIC_DNA_REPORT_PATH =
  'reports/movie-analysis-cinematic-dna-report.json' as const;
export const CINEMATIC_DNA_MD_PATH = 'reports/MOVIE_ANALYSIS_CINEMATIC_DNA.md' as const;

export const EXPECTED_SOURCE_COUNT = 4 as const;
export const EXPECTED_SOURCE_VIDEO_IDS = [
  'GHIBLI_01',
  'LITTLE_WOMEN_01',
  'MORI_01',
  'SHINKAI_01',
] as const;

export type CinematicDnaPattern = {
  pattern_id: string;
  pattern_category: string;
  pattern_signature: string;
  source_element_ids: string[];
  extraction_only: true;
};

export type CinematicDnaSafety = {
  planning_only: true;
  dna_extraction_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type ImageAppUsage = {
  consumer_target: 'image_app';
  emotion_dna_enabled: boolean;
  character_pattern_refs: string[];
  reusable_for_generation_planning: true;
};

export type VideoAppUsage = {
  consumer_target: 'video_app';
  scene_dna_enabled: boolean;
  camera_dna_enabled: boolean;
  transition_dna_enabled: boolean;
  continuity_dna_enabled: boolean;
  storytelling_dna_enabled: boolean;
  reusable_for_generation_planning: true;
};

export type CinematicDnaEntry = {
  cinematic_dna_id: string;
  source_video_id: string;
  scene_patterns: CinematicDnaPattern[];
  camera_patterns: CinematicDnaPattern[];
  emotion_patterns: CinematicDnaPattern[];
  transition_patterns: CinematicDnaPattern[];
  continuity_patterns: CinematicDnaPattern[];
  storytelling_patterns: CinematicDnaPattern[];
  strength_score: number;
  reusability_score: number;
  image_app_usage: ImageAppUsage;
  video_app_usage: VideoAppUsage;
  safety: CinematicDnaSafety;
};

export type CinematicDnaSafetySummary = {
  planning_only: true;
  dna_extraction_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisCinematicDna = {
  cinematic_dna_set_id: string;
  cinematic_dna_version: string;
  phase: typeof CINEMATIC_DNA_PHASE;
  extracted_at: string;
  source_count: number;
  dataset_id: string;
  release_id: string;
  entries: CinematicDnaEntry[];
  safety_summary: CinematicDnaSafetySummary;
};

export type CinematicDnaExtractionIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

const ENTRY_SAFETY: CinematicDnaSafety = {
  planning_only: true,
  dna_extraction_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

const SAFETY_SUMMARY: CinematicDnaSafetySummary = {
  planning_only: true,
  dna_extraction_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

function normalizeSignature(value: string): string {
  const trimmed = value.replace(/^estimated_(blueprint|bundle)_/, '');
  const parts = trimmed.split('_').filter(Boolean);
  if (parts.length <= 2) {
    return trimmed;
  }
  return parts.slice(-3).join('_');
}

function extractBlueprintPatterns(
  structures: Array<{
    element_id: string;
    estimated_blueprint_value: string;
    source_generation_package_element_ids: string[];
  }>,
  category: string
): CinematicDnaPattern[] {
  return structures.map((structure) => ({
    pattern_id: `cinematic_dna_${category}_${structure.element_id}`,
    pattern_category: category,
    pattern_signature: normalizeSignature(structure.estimated_blueprint_value),
    source_element_ids: [
      structure.element_id,
      ...structure.source_generation_package_element_ids,
    ],
    extraction_only: true as const,
  }));
}

function extractBundlePatterns(
  bundles: Array<{
    element_id: string;
    estimated_bundle_value: string;
    source_readiness_element_ids: string[];
  }>,
  category: string
): CinematicDnaPattern[] {
  return bundles.map((bundle) => ({
    pattern_id: `cinematic_dna_${category}_${bundle.element_id}`,
    pattern_category: category,
    pattern_signature: normalizeSignature(bundle.estimated_bundle_value),
    source_element_ids: [bundle.element_id, ...bundle.source_readiness_element_ids],
    extraction_only: true as const,
  }));
}

function mergePatterns(...groups: CinematicDnaPattern[][]): CinematicDnaPattern[] {
  const seen = new Set<string>();
  const merged: CinematicDnaPattern[] = [];
  for (const group of groups) {
    for (const pattern of group) {
      const key = `${pattern.pattern_category}:${pattern.pattern_signature}:${pattern.pattern_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(pattern);
      }
    }
  }
  return merged;
}

function computeStrengthScore(patterns: CinematicDnaPattern[]): number {
  if (patterns.length === 0) {
    return 0;
  }
  const uniqueSignatures = new Set(patterns.map((pattern) => pattern.pattern_signature)).size;
  const score = Math.min(1, uniqueSignatures * 0.08 + patterns.length * 0.04);
  return Math.round(score * 100) / 100;
}

function computeReusabilityScore(patterns: CinematicDnaPattern[]): number {
  if (patterns.length === 0) {
    return 0;
  }
  const linked = patterns.filter((pattern) => pattern.source_element_ids.length > 1).length;
  const score = Math.min(1, linked / patterns.length + 0.25);
  return Math.round(score * 100) / 100;
}

function extractStorytellingPatterns(
  videoPayload: VideoAppExportPayload,
  scenePatterns: CinematicDnaPattern[]
): CinematicDnaPattern[] {
  const runtimePatterns = extractBundlePatterns(videoPayload.runtime_bundle, 'storytelling');
  const arcPatterns = scenePatterns.filter((pattern) =>
    /open|develop|peak|resolve|bridge|hold|arc/.test(pattern.pattern_signature)
  );
  return mergePatterns(runtimePatterns, arcPatterns);
}

function buildCinematicDnaEntry(
  sourceVideoId: string,
  imagePayload: ImageAppExportPayload,
  videoPayload: VideoAppExportPayload
): CinematicDnaEntry {
  const scenePatterns = mergePatterns(
    extractBlueprintPatterns(videoPayload.scene_generation_structure, 'scene'),
    extractBundlePatterns(videoPayload.scene_bundle, 'scene')
  );
  const cameraPatterns = mergePatterns(
    extractBlueprintPatterns(videoPayload.camera_generation_structure, 'camera'),
    extractBundlePatterns(videoPayload.camera_bundle, 'camera')
  );
  const emotionPatterns = mergePatterns(
    extractBlueprintPatterns(imagePayload.emotion_generation_structure, 'emotion'),
    extractBundlePatterns(imagePayload.emotion_bundle, 'emotion')
  );
  const transitionPatterns = mergePatterns(
    extractBlueprintPatterns(videoPayload.transition_generation_structure, 'transition'),
    extractBundlePatterns(videoPayload.transition_bundle, 'transition')
  );
  const continuityPatterns = mergePatterns(
    extractBlueprintPatterns(videoPayload.continuity_generation_structure, 'continuity'),
    extractBundlePatterns(videoPayload.continuity_bundle, 'continuity')
  );
  const storytellingPatterns = extractStorytellingPatterns(videoPayload, scenePatterns);

  const allPatterns = [
    ...scenePatterns,
    ...cameraPatterns,
    ...emotionPatterns,
    ...transitionPatterns,
    ...continuityPatterns,
    ...storytellingPatterns,
  ];

  const slug = sourceVideoId.toLowerCase();

  return {
    cinematic_dna_id: `cinematic_dna_${slug}_v1`,
    source_video_id: sourceVideoId,
    scene_patterns: scenePatterns,
    camera_patterns: cameraPatterns,
    emotion_patterns: emotionPatterns,
    transition_patterns: transitionPatterns,
    continuity_patterns: continuityPatterns,
    storytelling_patterns: storytellingPatterns,
    strength_score: computeStrengthScore(allPatterns),
    reusability_score: computeReusabilityScore(allPatterns),
    image_app_usage: {
      consumer_target: 'image_app',
      emotion_dna_enabled: emotionPatterns.length > 0,
      character_pattern_refs: imagePayload.character_bundle.map((bundle) => bundle.element_id),
      reusable_for_generation_planning: true,
    },
    video_app_usage: {
      consumer_target: 'video_app',
      scene_dna_enabled: scenePatterns.length > 0,
      camera_dna_enabled: cameraPatterns.length > 0,
      transition_dna_enabled: transitionPatterns.length > 0,
      continuity_dna_enabled: continuityPatterns.length > 0,
      storytelling_dna_enabled: storytellingPatterns.length > 0,
      reusable_for_generation_planning: true,
    },
    safety: ENTRY_SAFETY,
  };
}

export function buildMovieAnalysisCinematicDna(projectRoot?: string): MovieAnalysisCinematicDna {
  const root = resolveProjectRoot(projectRoot);
  const dataset = loadMovieAnalysisDataset(root);
  if (!dataset) {
    throw new Error(`Missing ${DATASET_PATH}`);
  }

  const releasePackage = loadMovieAnalysisReleasePackage(root);
  if (!releasePackage) {
    throw new Error(`Missing ${RELEASE_PACKAGE_PATH}`);
  }

  if (dataset.source_count !== EXPECTED_SOURCE_COUNT) {
    throw new Error(`Expected source_count=${EXPECTED_SOURCE_COUNT}`);
  }

  const entries: CinematicDnaEntry[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const imagePayload = dataset.image_app_payloads[sourceVideoId];
    const videoPayload = dataset.video_app_payloads[sourceVideoId];
    if (!imagePayload || !videoPayload) {
      throw new Error(`Missing dataset payloads for ${sourceVideoId}`);
    }
    entries.push(buildCinematicDnaEntry(sourceVideoId, imagePayload, videoPayload));
  }

  return {
    cinematic_dna_set_id: 'movie-analysis-cinematic-dna-v1',
    cinematic_dna_version: 'v1',
    phase: CINEMATIC_DNA_PHASE,
    extracted_at: new Date().toISOString(),
    source_count: entries.length,
    dataset_id: dataset.dataset_id,
    release_id: releasePackage.release_id,
    entries,
    safety_summary: SAFETY_SUMMARY,
  };
}

export function writeMovieAnalysisCinematicDnaExtraction(
  projectRoot?: string
): MovieAnalysisCinematicDna {
  const root = resolveProjectRoot(projectRoot);
  const issues: CinematicDnaExtractionIssue[] = [];

  if (!fs.existsSync(path.join(root, RELEASE_PACKAGE_PATH))) {
    issues.push({
      code: 'RELEASE_PACKAGE_MISSING',
      message: `Missing ${RELEASE_PACKAGE_PATH}`,
      severity: 'error',
    });
  }

  const certificationPath = path.join(root, DATASET_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(certificationPath)) {
    issues.push({
      code: 'CERTIFICATION_REPORT_MISSING',
      message: `Missing ${DATASET_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const certification = JSON.parse(fs.readFileSync(certificationPath, 'utf8')) as {
      final_verdict?: string;
      certification_ready?: string;
    };
    if (certification.final_verdict !== DATASET_CERTIFICATION_PASS_VERDICT) {
      issues.push({
        code: 'CERTIFICATION_NOT_PASS',
        message: `Certification must have ${DATASET_CERTIFICATION_PASS_VERDICT}`,
        severity: 'error',
      });
    }
    if (certification.certification_ready !== 'PASS') {
      issues.push({
        code: 'CERTIFICATION_NOT_READY',
        message: 'Dataset certification_ready must be PASS',
        severity: 'error',
      });
    }
  }

  const releaseReport = loadMovieAnalysisReleaseReport(root);
  if (!releaseReport || releaseReport.final_verdict !== RELEASE_PACKAGE_PASS_VERDICT) {
    issues.push({
      code: 'RELEASE_PACKAGE_NOT_PASS',
      message: `Release package must have ${RELEASE_PACKAGE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, DATASET_PATH))) {
    issues.push({
      code: 'DATASET_MISSING',
      message: `Missing ${DATASET_PATH}`,
      severity: 'error',
    });
  }

  if (issues.filter((issue) => issue.severity === 'error').length > 0) {
    throw new Error(issues.map((issue) => issue.message).join('; '));
  }

  const cinematicDna = buildMovieAnalysisCinematicDna(root);
  const outDir = path.join(root, CINEMATIC_DNA_EXPORT_DIR);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, CINEMATIC_DNA_PATH),
    `${JSON.stringify(cinematicDna, null, 2)}\n`,
    'utf8'
  );

  return cinematicDna;
}

export function loadMovieAnalysisCinematicDna(
  projectRoot?: string
): MovieAnalysisCinematicDna | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, CINEMATIC_DNA_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisCinematicDna;
}
