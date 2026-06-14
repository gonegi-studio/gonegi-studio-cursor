import fs from 'node:fs';
import path from 'node:path';
import { loadMovieAnalysisPlan } from './movieAnalysisPlanBuilder.js';
import {
  type ExportSafetyFlags,
  type ImageAppExportPayload,
  type MovieAnalysisExportEntry,
  type MovieAnalysisExportManifest,
  type VideoAppExportPayload,
  loadMovieAnalysisExportManifest,
  loadMovieAnalysisExportPackage,
} from './movieAnalysisExportPackage.js';
import {
  MASTER_PACKAGE_REGISTRY_PATH,
  type PackageTraceEntry,
  loadMovieAnalysisMasterPackagePlan,
} from './movieAnalysisMasterPackageDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DATASET_EXPORT_PHASE =
  'PHASE-SOURCE-VIDEO-045-MOVIE_ANALYSIS_DATASET_EXPORT_V1' as const;
export const DATASET_EXPORT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DATASET_EXPORT_V1' as const;
export const DATASET_EXPORT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DATASET_EXPORT_V1' as const;
export const DATASET_SCHEMA_PATH =
  'datasets/movie_analysis/movie-analysis-dataset.schema.json' as const;
export const DATASET_REGISTRY_PATH =
  'datasets/movie_analysis/movie-analysis-dataset-registry.json' as const;
export const DATASET_DIR = 'exports/movie_analysis_dataset' as const;
export const DATASET_PATH =
  'exports/movie_analysis_dataset/movie-analysis-dataset.json' as const;
export const DATASET_MANIFEST_PATH =
  'exports/movie_analysis_dataset/movie-analysis-dataset-manifest.json' as const;
export const DATASET_EXPORT_REPORT_PATH =
  'exports/movie_analysis_dataset/movie-analysis-dataset-report.json' as const;

export const EXPECTED_SOURCE_COUNT = 4 as const;

export type DatasetSourceEntry = {
  source_video_id: string;
  source_video_path: string;
  master_package_id: string;
  final_runtime_bundle_id: string;
  generation_blueprint_id: string;
};

export type DatasetChainIds = MovieAnalysisExportEntry['chain_ids'];

export type DatasetSafetyFlags = {
  per_source: Record<string, ExportSafetyFlags>;
  summary: {
    planning_only: true;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    ocr: false;
    external_call_allowed: false;
  };
};

export type MovieAnalysisDataset = {
  dataset_id: string;
  dataset_version: string;
  phase: typeof DATASET_EXPORT_PHASE;
  created_at: string;
  source_count: number;
  sources: DatasetSourceEntry[];
  image_app_payloads: Record<string, ImageAppExportPayload>;
  video_app_payloads: Record<string, VideoAppExportPayload>;
  package_traces: Record<string, PackageTraceEntry[]>;
  chain_ids: Record<string, DatasetChainIds>;
  safety_flags: DatasetSafetyFlags;
};

export type MovieAnalysisDatasetManifestEntry = {
  source_video_id: string;
  master_package_id: string;
  final_runtime_bundle_id: string;
  generation_blueprint_id: string;
  source_video_path: string;
};

export type MovieAnalysisDatasetManifest = {
  manifest_id: string;
  phase: typeof DATASET_EXPORT_PHASE;
  generated_at: string;
  schema_path: typeof DATASET_SCHEMA_PATH;
  dataset_path: typeof DATASET_PATH;
  report_path: typeof DATASET_EXPORT_REPORT_PATH;
  consumer_targets: ['image_app', 'video_app'];
  source_count: number;
  entries: MovieAnalysisDatasetManifestEntry[];
};

export type MovieAnalysisDatasetBuildReport = {
  report_id: string;
  phase: typeof DATASET_EXPORT_PHASE;
  timestamp: string;
  source_count: number;
  dataset_path: typeof DATASET_PATH;
  manifest_path: typeof DATASET_MANIFEST_PATH;
  build_status: 'PASS' | 'FAIL';
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
};

function buildSourceEntry(
  projectRoot: string,
  entry: MovieAnalysisExportEntry
): DatasetSourceEntry {
  const master = loadMovieAnalysisMasterPackagePlan(projectRoot, entry.master_package_id);
  const analysisPlan = master
    ? loadMovieAnalysisPlan(projectRoot, master.analysis_plan_id)
    : null;

  return {
    source_video_id: entry.source_video_id,
    source_video_path: analysisPlan?.source_video_path ?? '',
    master_package_id: entry.master_package_id,
    final_runtime_bundle_id: entry.final_runtime_bundle_id,
    generation_blueprint_id: entry.generation_blueprint_id,
  };
}

export function buildMovieAnalysisDataset(projectRoot?: string): MovieAnalysisDataset {
  const root = resolveProjectRoot(projectRoot);
  const exportPackage = loadMovieAnalysisExportPackage(root);
  if (!exportPackage) {
    throw new Error('Missing movie-analysis-export-package.json');
  }

  const manifest = loadMovieAnalysisExportManifest(root);
  if (!manifest) {
    throw new Error('Missing movie-analysis-export-manifest.json');
  }

  if (exportPackage.entries.length !== EXPECTED_SOURCE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_SOURCE_COUNT} export entries, got ${exportPackage.entries.length}`
    );
  }

  const sources: DatasetSourceEntry[] = [];
  const imageAppPayloads: Record<string, ImageAppExportPayload> = {};
  const videoAppPayloads: Record<string, VideoAppExportPayload> = {};
  const packageTraces: Record<string, PackageTraceEntry[]> = {};
  const chainIds: Record<string, DatasetChainIds> = {};
  const perSourceSafety: Record<string, ExportSafetyFlags> = {};

  for (const entry of exportPackage.entries) {
    sources.push(buildSourceEntry(root, entry));
    imageAppPayloads[entry.source_video_id] = entry.image_app;
    videoAppPayloads[entry.source_video_id] = entry.video_app;
    packageTraces[entry.source_video_id] = entry.package_trace;
    chainIds[entry.source_video_id] = entry.chain_ids;
    perSourceSafety[entry.source_video_id] = entry.safety;
  }

  sources.sort((a, b) => a.source_video_id.localeCompare(b.source_video_id));

  return {
    dataset_id: 'movie-analysis-dataset-v1',
    dataset_version: 'v1',
    phase: DATASET_EXPORT_PHASE,
    created_at: new Date().toISOString(),
    source_count: sources.length,
    sources,
    image_app_payloads: imageAppPayloads,
    video_app_payloads: videoAppPayloads,
    package_traces: packageTraces,
    chain_ids: chainIds,
    safety_flags: {
      per_source: perSourceSafety,
      summary: {
        planning_only: true,
        runtime_execution: false,
        video_generation: false,
        image_generation: false,
        gpu_execution: false,
        ocr: false,
        external_call_allowed: false,
      },
    },
  };
}

function buildManifest(
  dataset: MovieAnalysisDataset,
  exportManifest: MovieAnalysisExportManifest,
  timestamp: string
): MovieAnalysisDatasetManifest {
  return {
    manifest_id: 'movie-analysis-dataset-manifest-v1',
    phase: DATASET_EXPORT_PHASE,
    generated_at: timestamp,
    schema_path: DATASET_SCHEMA_PATH,
    dataset_path: DATASET_PATH,
    report_path: DATASET_EXPORT_REPORT_PATH,
    consumer_targets: ['image_app', 'video_app'],
    source_count: dataset.source_count,
    entries: dataset.sources.map((source) => ({
      source_video_id: source.source_video_id,
      master_package_id: source.master_package_id,
      final_runtime_bundle_id: source.final_runtime_bundle_id,
      generation_blueprint_id: source.generation_blueprint_id,
      source_video_path: source.source_video_path,
    })),
  };
}

export function writeMovieAnalysisDatasetExport(
  projectRoot?: string
): { dataset: MovieAnalysisDataset; manifest: MovieAnalysisDatasetManifest; buildReport: MovieAnalysisDatasetBuildReport } {
  const root = resolveProjectRoot(projectRoot);
  const issues: MovieAnalysisDatasetBuildReport['issues'] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, MASTER_PACKAGE_REGISTRY_PATH))) {
    issues.push({
      code: 'MASTER_PACKAGE_REGISTRY_MISSING',
      message: `Missing ${MASTER_PACKAGE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const exportPackage = loadMovieAnalysisExportPackage(root);
  if (!exportPackage) {
    issues.push({
      code: 'EXPORT_PACKAGE_MISSING',
      message: 'Missing exports/movie_analysis/movie-analysis-export-package.json',
      severity: 'error',
    });
  }

  const exportManifest = loadMovieAnalysisExportManifest(root);
  if (!exportManifest) {
    issues.push({
      code: 'EXPORT_MANIFEST_MISSING',
      message: 'Missing exports/movie_analysis/movie-analysis-export-manifest.json',
      severity: 'error',
    });
  }

  if (issues.length > 0 || !exportPackage || !exportManifest) {
    const buildReport: MovieAnalysisDatasetBuildReport = {
      report_id: 'movie-analysis-dataset-report-v1',
      phase: DATASET_EXPORT_PHASE,
      timestamp,
      source_count: 0,
      dataset_path: DATASET_PATH,
      manifest_path: DATASET_MANIFEST_PATH,
      build_status: 'FAIL',
      issues,
    };
    throw new Error(issues.map((i) => i.message).join('; '));
  }

  const dataset = buildMovieAnalysisDataset(root);
  const manifest = buildManifest(dataset, exportManifest, timestamp);

  const outDir = path.join(root, DATASET_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, DATASET_PATH),
    `${JSON.stringify(dataset, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DATASET_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const buildReport: MovieAnalysisDatasetBuildReport = {
    report_id: 'movie-analysis-dataset-report-v1',
    phase: DATASET_EXPORT_PHASE,
    timestamp,
    source_count: dataset.source_count,
    dataset_path: DATASET_PATH,
    manifest_path: DATASET_MANIFEST_PATH,
    build_status: 'PASS',
    issues: [],
  };

  fs.writeFileSync(
    path.join(root, DATASET_EXPORT_REPORT_PATH),
    `${JSON.stringify(buildReport, null, 2)}\n`,
    'utf8'
  );

  return { dataset, manifest, buildReport };
}

export function loadMovieAnalysisDataset(projectRoot?: string): MovieAnalysisDataset | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DATASET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDataset;
}
