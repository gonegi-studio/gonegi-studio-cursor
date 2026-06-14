import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_LATEST_V5_DIR,
  IMAGE_APP_UPLOAD_PACKAGE_V5_PATH,
  VIDEO_APP_LATEST_V5_DIR,
  VIDEO_APP_UPLOAD_PACKAGE_V5_PATH,
} from './exportRebuild/datasetMaterializer.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  TITANIC_UPLOAD_INTEGRATION_PASS_VERDICT,
  TITANIC_UPLOAD_INTEGRATION_REPORT_PATH,
} from './titanicUploadIntegrationAudit.js';

export const MOVIE_DATASET_SEPARATION_PHASE = 'PHASE-MOVIE-DATASET-SEPARATION-001' as const;
export const MOVIE_DATASET_SEPARATION_ID = 'MOVIE_DATASET_RUNTIME_COMPOSITION_V1' as const;
export const MOVIE_DATASET_SEPARATION_PASS_VERDICT = 'PASS_MOVIE_DATASET_SEPARATION_V1' as const;
export const MOVIE_DATASET_SEPARATION_FAIL_VERDICT = 'FAIL_MOVIE_DATASET_SEPARATION_V1' as const;

export const MOVIE_DATASETS_DIR = 'exports/movie_datasets' as const;
export const MOVIE_DATASET_REGISTRY_PATH = 'exports/movie_datasets/movie-dataset-registry.json' as const;
export const MOVIE_DATASET_RUNTIME_COMPOSITION_PATH =
  'exports/movie_datasets/movie-dataset-runtime-composition.json' as const;
export const TITANIC_MOVIE_DATASET_BUNDLE_PATH =
  'exports/movie_datasets/titanic/titanic_movie_reconstruction_bundle.json' as const;
export const MOVIE_DATASET_SEPARATION_REPORT_PATH =
  'reports/movie_reconstruction/MOVIE_DATASET_SEPARATION_REPORT.json' as const;

const LEGACY_SHARED_BUNDLE = 'exports/shared/latest_v5/titanic_movie_reconstruction_bundle.json' as const;
const LEGACY_IMAGE_BUNDLE = 'exports/image_app/latest_v5/titanic_movie_reconstruction_bundle.json' as const;
const LEGACY_VIDEO_BUNDLE = 'exports/video_app/latest_v5/titanic_movie_reconstruction_bundle.json' as const;

const GENERATION_METADATA_CONTRACT_PATH = 'datasets/app_consumption/generation-metadata-contract.json' as const;
const IMAGE_GENERATION_METADATA_CONTRACT_PATH =
  'exports/image_app/latest_v5/generation_metadata_contract.json' as const;

const FUTURE_MOVIE_DATASETS = [
  { dataset_id: 'titanic', title: 'Titanic', status: 'materialized' as const },
  { dataset_id: 'your_name', title: 'Your Name', status: 'registry_ready' as const },
  { dataset_id: 'spirited_away', title: 'Spirited Away', status: 'registry_ready' as const },
  { dataset_id: 'castle_in_the_sky', title: 'Castle in the Sky', status: 'registry_ready' as const },
  { dataset_id: 'howls_moving_castle', title: "Howl's Moving Castle", status: 'registry_ready' as const },
] as const;

const MOVIE_BUNDLE_FILENAME = 'titanic_movie_reconstruction_bundle.json';

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieDatasetSeparationReport {
  report_id: string;
  phase: typeof MOVIE_DATASET_SEPARATION_PHASE;
  separation_id: typeof MOVIE_DATASET_SEPARATION_ID;
  generated_at: string;
  final_verdict: string;
  separation_passed: boolean;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function removeIfExists(root: string, rel: string): boolean {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return false;
  fs.unlinkSync(full);
  return true;
}

function moveTitanicBundle(root: string): void {
  const targetPath = path.join(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH);
  if (fs.existsSync(targetPath)) return;

  const sources = [LEGACY_SHARED_BUNDLE, LEGACY_IMAGE_BUNDLE, LEGACY_VIDEO_BUNDLE].map((rel) => path.join(root, rel));
  const source = sources.find((p) => fs.existsSync(p));
  if (!source) {
    throw new Error('Titanic movie reconstruction bundle not found in legacy export paths');
  }

  const bundle = JSON.parse(fs.readFileSync(source, 'utf8')) as Record<string, unknown>;
  bundle.export_path = TITANIC_MOVIE_DATASET_BUNDLE_PATH;
  bundle.separation_phase = MOVIE_DATASET_SEPARATION_PHASE;
  bundle.runtime_module = true;
  bundle.embedded_in_latest_v5 = false;
  bundle.separated_at = new Date().toISOString();
  writeJson(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH, bundle);
}

function cleanupLegacyEmbeds(root: string): void {
  removeIfExists(root, LEGACY_SHARED_BUNDLE);
  removeIfExists(root, LEGACY_IMAGE_BUNDLE);
  removeIfExists(root, LEGACY_VIDEO_BUNDLE);
}

function buildMovieDatasetRegistry(root: string): Record<string, unknown> {
  const registry = {
    registry_id: 'movie-dataset-registry-v1',
    phase: MOVIE_DATASET_SEPARATION_PHASE,
    separation_id: MOVIE_DATASET_SEPARATION_ID,
    generated_at: new Date().toISOString(),
    movie_datasets: FUTURE_MOVIE_DATASETS.map((d) => d.dataset_id),
    datasets: FUTURE_MOVIE_DATASETS.map((d) => ({
      dataset_id: d.dataset_id,
      title: d.title,
      status: d.status,
      bundle_path:
        d.dataset_id === 'titanic'
          ? TITANIC_MOVIE_DATASET_BUNDLE_PATH
          : `exports/movie_datasets/${d.dataset_id}/${d.dataset_id}_movie_reconstruction_bundle.json`,
      swappable: true,
      modifies_latest_v5: false,
    })),
    architecture: {
      latest_v5_role: 'universal_gonegi_world_dataset',
      movie_datasets_role: 'swappable_scene_grammar_modules',
      final_generation: 'latest_v5 + selected_movie_dataset',
    },
  };
  writeJson(root, MOVIE_DATASET_REGISTRY_PATH, registry);
  return registry;
}

function buildRuntimeComposition(root: string): Record<string, unknown> {
  const composition = {
    composition_id: 'movie-dataset-runtime-composition-v1',
    phase: MOVIE_DATASET_SEPARATION_PHASE,
    separation_id: MOVIE_DATASET_SEPARATION_ID,
    generated_at: new Date().toISOString(),
    base_dataset: 'latest_v5',
    movie_dataset: 'titanic',
    world_identity_source: 'latest_v5',
    movie_geometry_source: 'movie_dataset',
    merge_mode: 'runtime',
    world_identity_lock: {
      gonegi_world_dominance: 0.72,
      movie_dataset_dominance: 0.28,
      world_identity_source_locked: 'latest_v5',
      movie_world_override_forbidden: true,
      status: 'PASS',
    },
    composition_formula: 'latest_v5(world_identity) + movie_dataset(scene_grammar) -> final_generation',
    swappable_movie_datasets: FUTURE_MOVIE_DATASETS.map((d) => d.dataset_id),
    registry_ref: MOVIE_DATASET_REGISTRY_PATH,
    active_bundle_ref: TITANIC_MOVIE_DATASET_BUNDLE_PATH,
  };
  writeJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH, composition);
  return composition;
}

function updateUploadPackages(root: string): void {
  for (const pkgPath of [IMAGE_APP_UPLOAD_PACKAGE_V5_PATH, VIDEO_APP_UPLOAD_PACKAGE_V5_PATH]) {
    const pkg = readJson<Record<string, unknown>>(root, pkgPath);
    delete pkg.movie_reconstruction_datasets;
    delete pkg.titanic_upload_integrated_at;

    pkg.movie_dataset_registry = ['titanic'];
    pkg.movie_dataset_runtime_composition_ref = MOVIE_DATASET_RUNTIME_COMPOSITION_PATH;
    pkg.movie_dataset_registry_ref = MOVIE_DATASET_REGISTRY_PATH;
    pkg.latest_v5_universal_only = true;
    pkg.movie_datasets_external = true;

    const blocks = new Set((pkg.output_blocks as string[] | undefined) ?? []);
    blocks.delete('titanic_movie_reconstruction_bundle');
    blocks.delete('movie_reconstruction_datasets');
    blocks.add('movie_dataset_registry');
    blocks.add('movie_dataset_runtime_composition');
    pkg.output_blocks = [...blocks];

    pkg.movie_dataset_separated_at = new Date().toISOString();
    writeJson(root, pkgPath, pkg);
  }
}

function updateGenerationMetadata(root: string): void {
  for (const rel of [GENERATION_METADATA_CONTRACT_PATH, IMAGE_GENERATION_METADATA_CONTRACT_PATH]) {
    if (!fs.existsSync(path.join(root, rel))) continue;
    const contract = readJson<Record<string, unknown>>(root, rel);
    contract.base_dataset = 'latest_v5';
    contract.movie_dataset = 'titanic';
    contract.runtime_composition = true;
    contract.movie_dataset_registry_ref = MOVIE_DATASET_REGISTRY_PATH;
    contract.movie_dataset_runtime_composition_ref = MOVIE_DATASET_RUNTIME_COMPOSITION_PATH;
    contract.movie_dataset_export_path = TITANIC_MOVIE_DATASET_BUNDLE_PATH;
    contract.latest_v5_contains_movie_dataset = false;

    const datasetUsage = (contract.dataset_usage ?? {}) as Record<string, Record<string, unknown>>;
    if (datasetUsage.titanic_movie_reconstruction) {
      datasetUsage.titanic_movie_reconstruction.export_file = TITANIC_MOVIE_DATASET_BUNDLE_PATH;
      datasetUsage.titanic_movie_reconstruction.runtime_composition = true;
      datasetUsage.titanic_movie_reconstruction.embedded_in_latest_v5 = false;
      delete datasetUsage.titanic_movie_reconstruction.image_app_export_file;
      delete datasetUsage.titanic_movie_reconstruction.video_app_export_file;
    }
    contract.dataset_usage = datasetUsage;

    const outputSchema = (contract.generation_output_schema ?? {}) as Record<string, unknown>;
    const movieReconstruction = (outputSchema.movie_reconstruction ?? {}) as Record<string, unknown>;
    movieReconstruction.base_dataset = 'latest_v5';
    movieReconstruction.movie_dataset = 'titanic';
    movieReconstruction.runtime_composition = true;
    outputSchema.movie_reconstruction = movieReconstruction;
    contract.generation_output_schema = outputSchema;

    writeJson(root, rel, contract);
  }
}

function latestV5ContainsMovieDataset(root: string): boolean {
  const imageDir = path.join(root, IMAGE_APP_LATEST_V5_DIR);
  const videoDir = path.join(root, VIDEO_APP_LATEST_V5_DIR);
  const movieBundleNames = [
    'titanic_movie_reconstruction_bundle.json',
    'your_name_movie_reconstruction_bundle.json',
    'spirited_away_movie_reconstruction_bundle.json',
  ];

  for (const dir of [imageDir, videoDir]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (movieBundleNames.includes(file) || file.includes('movie_reconstruction_bundle')) {
        return true;
      }
    }
  }
  return false;
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const uploadReport = tryReadJson(root, TITANIC_UPLOAD_INTEGRATION_REPORT_PATH);

  const gates = {
    titanic_upload_integration_pass:
      String(uploadReport?.final_verdict ?? '') === TITANIC_UPLOAD_INTEGRATION_PASS_VERDICT,
    titanic_bundle_available:
      fs.existsSync(path.join(root, LEGACY_SHARED_BUNDLE)) ||
      fs.existsSync(path.join(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH)),
    image_latest_v5_exists: fs.existsSync(path.join(root, IMAGE_APP_LATEST_V5_DIR)),
    video_latest_v5_exists: fs.existsSync(path.join(root, VIDEO_APP_LATEST_V5_DIR)),
  };

  if (!gates.titanic_bundle_available) {
    issues.push({ code: 'TITANIC_BUNDLE_MISSING', message: 'Titanic bundle not found for separation', severity: 'error' });
  }

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

function validateSeparation(root: string): {
  issues: ValidationIssue[];
  metrics: Record<string, string | number | boolean>;
} {
  const issues: ValidationIssue[] = [];

  const latestV5HasMovie = latestV5ContainsMovieDataset(root);
  const registry = tryReadJson(root, MOVIE_DATASET_REGISTRY_PATH);
  const composition = tryReadJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  const imagePkg = tryReadJson(root, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH);
  const videoPkg = tryReadJson(root, VIDEO_APP_UPLOAD_PACKAGE_V5_PATH);
  const metadata = tryReadJson(root, GENERATION_METADATA_CONTRACT_PATH);

  const registryExists = Boolean(registry?.movie_datasets);
  const runtimeReady =
    composition?.base_dataset === 'latest_v5' &&
    composition?.movie_dataset === 'titanic' &&
    composition?.world_identity_source === 'latest_v5' &&
    composition?.movie_geometry_source === 'movie_dataset' &&
    composition?.merge_mode === 'runtime';

  const worldLock = (composition?.world_identity_lock ?? {}) as Record<string, unknown>;
  const worldIdentityLock =
    Number(worldLock.gonegi_world_dominance) >= 0.7 &&
    Number(worldLock.movie_dataset_dominance) <= 0.3 &&
    worldLock.movie_world_override_forbidden === true;

  const swappable =
    Array.isArray(registry?.movie_datasets) &&
    (registry.movie_datasets as string[]).length >= 5 &&
    (registry.datasets as { modifies_latest_v5: boolean }[] | undefined)?.every((d) => d.modifies_latest_v5 === false);

  const imageRegistry = (imagePkg?.movie_dataset_registry as string[] | undefined) ?? [];
  const videoRegistry = (videoPkg?.movie_dataset_registry as string[] | undefined) ?? [];
  const noDirectEmbed =
    !imagePkg?.movie_reconstruction_datasets && !videoPkg?.movie_reconstruction_datasets;

  if (latestV5HasMovie) {
    issues.push({ code: 'LATEST_V5_CONTAINS_MOVIE', message: 'latest_v5 still contains movie dataset bundles', severity: 'error' });
  }
  if (!registryExists) {
    issues.push({ code: 'REGISTRY_MISSING', message: 'movie-dataset-registry.json missing', severity: 'error' });
  }
  if (!runtimeReady) {
    issues.push({ code: 'RUNTIME_COMPOSITION_NOT_READY', message: 'Runtime composition config invalid', severity: 'error' });
  }
  if (!worldIdentityLock) {
    issues.push({ code: 'WORLD_IDENTITY_LOCK_FAIL', message: 'world_identity_lock not satisfied', severity: 'error' });
  }
  if (!swappable) {
    issues.push({ code: 'MOVIE_DATASET_NOT_SWAPPABLE', message: 'Future movie dataset compatibility not ready', severity: 'error' });
  }
  if (!noDirectEmbed) {
    issues.push({ code: 'DIRECT_EMBED_REMAINS', message: 'movie_reconstruction_datasets still in upload package', severity: 'error' });
  }
  if (!imageRegistry.includes('titanic') || !videoRegistry.includes('titanic')) {
    issues.push({ code: 'REGISTRY_NOT_IN_UPLOAD', message: 'movie_dataset_registry not in upload packages', severity: 'error' });
  }
  if (!fs.existsSync(path.join(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH))) {
    issues.push({ code: 'TITANIC_BUNDLE_NOT_SEPARATED', message: 'Titanic bundle not in movie_datasets/titanic', severity: 'error' });
  }
  if (metadata?.runtime_composition !== true || metadata?.base_dataset !== 'latest_v5') {
    issues.push({ code: 'METADATA_RUNTIME_NOT_UPDATED', message: 'generation metadata missing runtime composition fields', severity: 'error' });
  }

  return {
    issues,
    metrics: {
      latest_v5_contains_movie_dataset: latestV5HasMovie,
      movie_dataset_registry_exists: registryExists,
      runtime_composition_ready: runtimeReady,
      world_identity_lock: worldIdentityLock,
      movie_dataset_swappable: swappable,
      titanic_bundle_separated: fs.existsSync(path.join(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH)),
      direct_embed_removed: noDirectEmbed,
      future_movie_dataset_count: Array.isArray(registry?.movie_datasets) ? (registry.movie_datasets as string[]).length : 0,
      gpu_execution: false,
      video_generation: false,
      next_order: 'PHASE-TITANIC-IMAGE-RECONSTRUCTION-TEST-001',
      policy: SAFE_CREATE_POLICY,
    },
  };
}

export function writeMovieDatasetSeparation(projectRoot?: string): MovieDatasetSeparationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: MovieDatasetSeparationReport = {
      report_id: 'movie-dataset-separation-report-v1',
      phase: MOVIE_DATASET_SEPARATION_PHASE,
      separation_id: MOVIE_DATASET_SEPARATION_ID,
      generated_at: new Date().toISOString(),
      final_verdict: MOVIE_DATASET_SEPARATION_FAIL_VERDICT,
      separation_passed: false,
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: {},
      issues,
    };
    fs.mkdirSync(path.join(root, 'reports/movie_reconstruction'), { recursive: true });
    writeJson(root, MOVIE_DATASET_SEPARATION_REPORT_PATH, fail);
    return fail;
  }

  moveTitanicBundle(root);
  cleanupLegacyEmbeds(root);
  buildMovieDatasetRegistry(root);
  buildRuntimeComposition(root);
  updateUploadPackages(root);
  updateGenerationMetadata(root);

  const validation = validateSeparation(root);
  issues.push(...validation.issues);

  const separationPassed =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    validation.metrics.latest_v5_contains_movie_dataset === false &&
    validation.metrics.movie_dataset_registry_exists === true &&
    validation.metrics.runtime_composition_ready === true &&
    validation.metrics.world_identity_lock === true &&
    validation.metrics.movie_dataset_swappable === true;

  const report: MovieDatasetSeparationReport = {
    report_id: 'movie-dataset-separation-report-v1',
    phase: MOVIE_DATASET_SEPARATION_PHASE,
    separation_id: MOVIE_DATASET_SEPARATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: separationPassed ? MOVIE_DATASET_SEPARATION_PASS_VERDICT : MOVIE_DATASET_SEPARATION_FAIL_VERDICT,
    separation_passed: separationPassed,
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validation.metrics,
    issues,
  };

  const fullReport = {
    ...report,
    architecture: {
      before: 'latest_v5 embedded titanic_movie_reconstruction_bundle',
      after: 'latest_v5 universal only + exports/movie_datasets/{title}/ swappable modules',
      final_generation: 'latest_v5 + selected_movie_dataset',
    },
    paths: {
      movie_datasets_dir: MOVIE_DATASETS_DIR,
      registry: MOVIE_DATASET_REGISTRY_PATH,
      runtime_composition: MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
      titanic_bundle: TITANIC_MOVIE_DATASET_BUNDLE_PATH,
    },
    production_readiness_gates: {
      latest_v5_contains_movie_dataset_eq_false: validation.metrics.latest_v5_contains_movie_dataset === false,
      movie_dataset_registry_exists_eq_true: validation.metrics.movie_dataset_registry_exists === true,
      runtime_composition_ready_eq_true: validation.metrics.runtime_composition_ready === true,
      world_identity_lock_eq_true: validation.metrics.world_identity_lock === true,
      movie_dataset_swappable_eq_true: validation.metrics.movie_dataset_swappable === true,
    },
    success_condition: {
      latest_v5_universal_only: validation.metrics.latest_v5_contains_movie_dataset === false,
      movie_datasets_swappable_grammar: validation.metrics.movie_dataset_swappable === true,
      final_generation_runtime_merge: validation.metrics.runtime_composition_ready === true,
    },
    next_pipeline: separationPassed ? ['PHASE-TITANIC-IMAGE-RECONSTRUCTION-TEST-001'] : ['PHASE-MOVIE-DATASET-SEPARATION-PATCH-001'],
  };

  fs.mkdirSync(path.join(root, 'reports/movie_reconstruction'), { recursive: true });
  writeJson(root, MOVIE_DATASET_SEPARATION_REPORT_PATH, fullReport);

  return report;
}
