import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_PATH,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import {
  CINEMATIC_DNA_INTEGRATION_PATH,
  loadMovieAnalysisCinematicDnaIntegration,
} from './movieAnalysisCinematicDnaIntegration.js';
import {
  DNA_ADAPTER_CERTIFICATION_PASS_VERDICT,
  DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisDnaAdapterCertification.js';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_PACKAGING_PHASE =
  'PHASE-SOURCE-VIDEO-059-MOVIE_ANALYSIS_DNA_PACKAGING_V1' as const;
export const DNA_PACKAGING_PASS_VERDICT = 'PASS_MOVIE_ANALYSIS_DNA_PACKAGING_V1' as const;
export const DNA_PACKAGING_FAIL_VERDICT = 'FAIL_MOVIE_ANALYSIS_DNA_PACKAGING_V1' as const;
export const DNA_PACKAGE_DIR = 'exports/movie_analysis_dna_package' as const;
export const DNA_PACKAGE_PATH =
  'exports/movie_analysis_dna_package/movie-analysis-dna-package.json' as const;
export const DNA_PACKAGE_MANIFEST_PATH =
  'exports/movie_analysis_dna_package/movie-analysis-dna-package-manifest.json' as const;
export const DNA_PACKAGE_REPORT_PATH =
  'exports/movie_analysis_dna_package/movie-analysis-dna-package-report.json' as const;

export const DNA_PACKAGE_VERSION = 'v1' as const;
export const ADAPTERS_PER_SOURCE = 6 as const;
export const EXPECTED_ADAPTER_COUNT = EXPECTED_SOURCE_COUNT * ADAPTERS_PER_SOURCE;

export { EXPECTED_SOURCE_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type DnaPackageSafetySummary = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type DnaPackageSourceEntry = {
  source_video_id: string;
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  adapter_count: number;
  image_mapping_ready: boolean;
  video_mapping_ready: boolean;
  library_readiness: 'READY' | 'NOT_READY';
};

export type MovieAnalysisDnaPackage = {
  package_id: string;
  package_version: typeof DNA_PACKAGE_VERSION;
  phase: typeof DNA_PACKAGING_PHASE;
  packaged_at: string;
  source_count: number;
  adapter_count: number;
  cinematic_dna_path: typeof CINEMATIC_DNA_PATH;
  integration_path: typeof CINEMATIC_DNA_INTEGRATION_PATH;
  adapter_library_path: typeof DNA_ADAPTER_LIBRARY_PATH;
  certification_report_path: typeof DNA_ADAPTER_CERTIFICATION_REPORT_PATH;
  certification_verdict: typeof DNA_ADAPTER_CERTIFICATION_PASS_VERDICT;
  cinematic_dna_set_id: string;
  integration_set_id: string;
  adapter_library_id: string;
  consumer_targets: ['image_app', 'video_app'];
  sources: DnaPackageSourceEntry[];
  package_readiness: {
    certification_preserved: boolean;
    dna_traceability_preserved: boolean;
    image_mapping_preserved: boolean;
    video_mapping_preserved: boolean;
    package_ready: boolean;
  };
  safety_summary: DnaPackageSafetySummary;
};

export type DnaPackageManifestAsset = {
  asset_id: string;
  path: string;
  role: string;
};

export type MovieAnalysisDnaPackageManifest = {
  manifest_id: string;
  phase: typeof DNA_PACKAGING_PHASE;
  generated_at: string;
  package_path: typeof DNA_PACKAGE_PATH;
  package_report_path: typeof DNA_PACKAGE_REPORT_PATH;
  cinematic_dna_path: typeof CINEMATIC_DNA_PATH;
  integration_path: typeof CINEMATIC_DNA_INTEGRATION_PATH;
  adapter_library_path: typeof DNA_ADAPTER_LIBRARY_PATH;
  certification_report_path: typeof DNA_ADAPTER_CERTIFICATION_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  assets: DnaPackageManifestAsset[];
};

const PACKAGE_SAFETY_SUMMARY: DnaPackageSafetySummary = {
  planning_only: true,
  generation: false,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

function countAdapters(entry: DnaAdapterLibraryEntry): number {
  const adapters = [
    entry.scene_adapter,
    entry.camera_adapter,
    entry.emotion_adapter,
    entry.transition_adapter,
    entry.continuity_adapter,
    entry.storytelling_adapter,
  ];
  return adapters.filter((adapter) => adapter.adapter_ready && adapter.pattern_count > 0).length;
}

function buildSourceEntry(entry: DnaAdapterLibraryEntry): DnaPackageSourceEntry {
  return {
    source_video_id: entry.source_video_id,
    cinematic_dna_id: entry.cinematic_dna_id,
    integration_id: entry.integration_id,
    adapter_library_entry_id: entry.adapter_library_entry_id,
    adapter_count: countAdapters(entry),
    image_mapping_ready:
      entry.image_adapter_mapping.adapter_ready && entry.image_adapter_mapping.emotion_adapter,
    video_mapping_ready:
      entry.video_adapter_mapping.adapter_ready &&
      entry.video_adapter_mapping.scene_adapter &&
      entry.video_adapter_mapping.camera_adapter &&
      entry.video_adapter_mapping.transition_adapter &&
      entry.video_adapter_mapping.continuity_adapter &&
      entry.video_adapter_mapping.storytelling_adapter,
    library_readiness: entry.library_readiness,
  };
}

export function buildMovieAnalysisDnaPackage(projectRoot?: string): MovieAnalysisDnaPackage {
  const root = resolveProjectRoot(projectRoot);

  const cinematicDna = loadMovieAnalysisCinematicDna(root);
  const integration = loadMovieAnalysisCinematicDnaIntegration(root);
  const adapterLibrary = loadMovieAnalysisDnaAdapterLibrary(root);

  if (!cinematicDna) throw new Error(`Missing ${CINEMATIC_DNA_PATH}`);
  if (!integration) throw new Error(`Missing ${CINEMATIC_DNA_INTEGRATION_PATH}`);
  if (!adapterLibrary) throw new Error(`Missing ${DNA_ADAPTER_LIBRARY_PATH}`);

  const certificationPath = path.join(root, DNA_ADAPTER_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(certificationPath)) {
    throw new Error(`Missing ${DNA_ADAPTER_CERTIFICATION_REPORT_PATH}`);
  }

  const certification = JSON.parse(fs.readFileSync(certificationPath, 'utf8')) as {
    final_verdict?: string;
    adapter_certification_ready?: string;
  };

  if (certification.final_verdict !== DNA_ADAPTER_CERTIFICATION_PASS_VERDICT) {
    throw new Error(`Certification must have ${DNA_ADAPTER_CERTIFICATION_PASS_VERDICT}`);
  }

  const sources: DnaPackageSourceEntry[] = [];
  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = adapterLibrary.entries.find((e) => e.source_video_id === sourceVideoId);
    if (!entry) {
      throw new Error(`Missing adapter library entry for ${sourceVideoId}`);
    }
    sources.push(buildSourceEntry(entry));
  }

  const totalAdapterCount = sources.reduce((sum, source) => sum + source.adapter_count, 0);

  const certificationPreserved =
    certification.final_verdict === DNA_ADAPTER_CERTIFICATION_PASS_VERDICT &&
    certification.adapter_certification_ready === 'PASS';

  const traceabilityPreserved =
    adapterLibrary.cinematic_dna_set_id === cinematicDna.cinematic_dna_set_id &&
    adapterLibrary.integration_set_id === integration.integration_set_id &&
    sources.every(
      (source) =>
        Boolean(source.cinematic_dna_id) &&
        Boolean(source.integration_id) &&
        Boolean(source.adapter_library_entry_id)
    );

  const imageMappingPreserved = sources.every((source) => source.image_mapping_ready);
  const videoMappingPreserved = sources.every((source) => source.video_mapping_ready);

  const packageReady =
    sources.length === EXPECTED_SOURCE_COUNT &&
    totalAdapterCount === EXPECTED_ADAPTER_COUNT &&
    certificationPreserved &&
    traceabilityPreserved &&
    imageMappingPreserved &&
    videoMappingPreserved &&
    sources.every((source) => source.library_readiness === 'READY');

  return {
    package_id: 'movie-analysis-dna-package-v1',
    package_version: DNA_PACKAGE_VERSION,
    phase: DNA_PACKAGING_PHASE,
    packaged_at: new Date().toISOString(),
    source_count: sources.length,
    adapter_count: totalAdapterCount,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    integration_path: CINEMATIC_DNA_INTEGRATION_PATH,
    adapter_library_path: DNA_ADAPTER_LIBRARY_PATH,
    certification_report_path: DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
    certification_verdict: DNA_ADAPTER_CERTIFICATION_PASS_VERDICT,
    cinematic_dna_set_id: cinematicDna.cinematic_dna_set_id,
    integration_set_id: integration.integration_set_id,
    adapter_library_id: adapterLibrary.adapter_library_id,
    consumer_targets: ['image_app', 'video_app'],
    sources,
    package_readiness: {
      certification_preserved: certificationPreserved,
      dna_traceability_preserved: traceabilityPreserved,
      image_mapping_preserved: imageMappingPreserved,
      video_mapping_preserved: videoMappingPreserved,
      package_ready: packageReady,
    },
    safety_summary: PACKAGE_SAFETY_SUMMARY,
  };
}

function buildManifest(dnaPackage: MovieAnalysisDnaPackage, timestamp: string): MovieAnalysisDnaPackageManifest {
  return {
    manifest_id: 'movie-analysis-dna-package-manifest-v1',
    phase: DNA_PACKAGING_PHASE,
    generated_at: timestamp,
    package_path: DNA_PACKAGE_PATH,
    package_report_path: DNA_PACKAGE_REPORT_PATH,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    integration_path: CINEMATIC_DNA_INTEGRATION_PATH,
    adapter_library_path: DNA_ADAPTER_LIBRARY_PATH,
    certification_report_path: DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
    source_count: dnaPackage.source_count,
    adapter_count: dnaPackage.adapter_count,
    assets: [
      { asset_id: 'dna_package', path: DNA_PACKAGE_PATH, role: 'deployable_dna_package' },
      {
        asset_id: 'cinematic_dna',
        path: CINEMATIC_DNA_PATH,
        role: 'cinematic_dna_source',
      },
      {
        asset_id: 'cinematic_dna_integration',
        path: CINEMATIC_DNA_INTEGRATION_PATH,
        role: 'integration_source',
      },
      {
        asset_id: 'adapter_library',
        path: DNA_ADAPTER_LIBRARY_PATH,
        role: 'adapter_library_source',
      },
      {
        asset_id: 'certification_report',
        path: DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
        role: 'certification_report',
      },
    ],
  };
}

export function writeMovieAnalysisDnaPackaging(
  projectRoot?: string
): { dnaPackage: MovieAnalysisDnaPackage; manifest: MovieAnalysisDnaPackageManifest } {
  const root = resolveProjectRoot(projectRoot);

  for (const required of [
    CINEMATIC_DNA_PATH,
    CINEMATIC_DNA_INTEGRATION_PATH,
    DNA_ADAPTER_LIBRARY_PATH,
    DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
  ]) {
    if (!fs.existsSync(path.join(root, required))) {
      throw new Error(`Missing ${required}`);
    }
  }

  const dnaPackage = buildMovieAnalysisDnaPackage(root);
  const timestamp = dnaPackage.packaged_at;
  const manifest = buildManifest(dnaPackage, timestamp);

  const outDir = path.join(root, DNA_PACKAGE_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, DNA_PACKAGE_PATH),
    `${JSON.stringify(dnaPackage, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_PACKAGE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  return { dnaPackage, manifest };
}

export function loadMovieAnalysisDnaPackage(
  projectRoot?: string
): MovieAnalysisDnaPackage | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DNA_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaPackage;
}

export function loadMovieAnalysisDnaPackageManifest(
  projectRoot?: string
): MovieAnalysisDnaPackageManifest | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DNA_PACKAGE_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaPackageManifest;
}
