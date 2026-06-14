import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_DATASET_REGISTRY_PATH,
  MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
  MOVIE_DATASET_SEPARATION_PASS_VERDICT,
  MOVIE_DATASET_SEPARATION_REPORT_PATH,
} from './movieDatasetSeparation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  buildMovieDatasetFromSource,
  buildTemplateFromSource,
  loadTitanicSourceDataset,
  MOVIE_FACTORY_TEMPLATE_PATH,
} from './movieDatasetBuilder.js';
import {
  TITANIC_VIDEO_VALIDATION_PASS_VERDICT,
  TITANIC_VIDEO_VALIDATION_REPORT_PATH,
} from './titanicVideoReconstructionValidation.js';

export const MOVIE_FACTORY_PHASE = 'PHASE-MOVIE-DATASET-FACTORY-001' as const;
export const MOVIE_FACTORY_SYSTEM_ID = 'MOVIE_DATASET_FACTORY_SYSTEM_V1' as const;
export const MOVIE_FACTORY_PASS_VERDICT = 'PASS_MOVIE_DATASET_FACTORY_SYSTEM_V1' as const;
export const MOVIE_FACTORY_FAIL_VERDICT = 'FAIL_MOVIE_DATASET_FACTORY_SYSTEM_V1' as const;

export const MOVIE_FACTORY_DIR = 'datasets/movie_factory' as const;
export const MOVIE_FACTORY_SCHEMA_PATH = 'datasets/movie_factory/movie-dataset-factory.schema.json' as const;
export const MOVIE_FACTORY_REGISTRY_PATH = 'datasets/movie_factory/movie-dataset-registry.json' as const;
export const MOVIE_RUNTIME_COMPOSITION_RULES_PATH =
  'datasets/movie_factory/movie-runtime-composition-rules.json' as const;
export const MOVIE_FACTORY_QUALITY_GATES_PATH = 'datasets/movie_factory/movie-dataset-quality-gates.json' as const;
export const MOVIE_FACTORY_EXPORT_ADAPTER_PATH = 'datasets/movie_factory/movie-dataset-export-adapter.json' as const;
export const MOVIE_FACTORY_REPORT_PATH = 'reports/movie_factory/MOVIE_DATASET_FACTORY_REPORT.json' as const;

const FUTURE_MOVIES = [
  { movie_id: 'your_name', movie_name: 'Your Name', movie_type: 'anime_romance_fantasy' },
  { movie_id: 'spirited_away', movie_name: 'Spirited Away', movie_type: 'anime_fantasy_adventure' },
  { movie_id: 'castle_in_the_sky', movie_name: 'Castle in the Sky', movie_type: 'anime_steampunk_adventure' },
  { movie_id: 'howls_moving_castle', movie_name: "Howl's Moving Castle", movie_type: 'anime_fantasy_romance' },
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieDatasetFactoryReport {
  report_id: string;
  phase: typeof MOVIE_FACTORY_PHASE;
  system_id: typeof MOVIE_FACTORY_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  factory_passed: boolean;
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

function round4(n: number): number {
  return Number(n.toFixed(4));
}

function buildFactorySchema(): Record<string, unknown> {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    schema_id: 'movie-dataset-factory-v1',
    title: 'Movie Dataset Factory Standard Schema',
    description: 'Standard schema for all movie reconstruction datasets produced by MOVIE_DATASET_FACTORY_SYSTEM_V1',
    type: 'object',
    required: [
      'movie_id',
      'movie_name',
      'movie_type',
      'scene_count',
      'geometry_layer',
      'shot_layer',
      'temporal_layer',
      'motion_layer',
      'semantic_layer',
      'validation_layer',
      'factory_metadata',
    ],
    properties: {
      movie_id: { type: 'string', pattern: '^[a-z][a-z0-9_]*$' },
      movie_name: { type: 'string', minLength: 1 },
      movie_type: { type: 'string', minLength: 1 },
      scene_count: { type: 'integer', minimum: 1 },
      geometry_layer: { type: 'object' },
      shot_layer: { type: 'object' },
      temporal_layer: { type: 'object' },
      motion_layer: { type: 'object' },
      semantic_layer: { type: 'object' },
      validation_layer: { type: 'object' },
      factory_metadata: {
        type: 'object',
        required: ['standardized', 'source_bundle', 'standardized_at', 'schema_version'],
      },
    },
    additionalProperties: false,
    fixed_identity_source: 'latest_v5',
    swappable_layers: [
      'geometry_layer',
      'shot_layer',
      'temporal_layer',
      'motion_layer',
      'semantic_layer',
    ],
  };
}

function buildRuntimeCompositionRules(): Record<string, unknown> {
  return {
    rules_id: 'movie-runtime-composition-rules-v1',
    phase: MOVIE_FACTORY_PHASE,
    system_id: MOVIE_FACTORY_SYSTEM_ID,
    base_dataset: 'latest_v5',
    merge_mode: 'runtime',
    composition_formula: 'latest_v5(fixed_identity) + movie_dataset(swappable_grammar) -> runtime_composition -> generation',
    latest_v5_dominates: {
      character_identity: true,
      environment_identity: true,
      architecture_identity: true,
      color_identity: true,
      location_identity: true,
      lighting_identity: true,
      living_world_identity: true,
      world_identity_source_locked: true,
      minimum_dominance: 0.7,
    },
    movie_dataset_dominates: {
      scene_structure: true,
      camera_grammar: true,
      blocking_grammar: true,
      composition_grammar: true,
      temporal_grammar: true,
      motion_grammar: true,
      semantic_anchors: true,
      maximum_dominance: 0.3,
    },
    forbidden: [
      'movie_style_override',
      'world_identity_override',
      'generic_harbor_fallback',
      'latest_v5_movie_bundle_embed',
    ],
    runtime_output: ['image_generation', 'video_generation'],
  };
}

function buildQualityGates(): Record<string, unknown> {
  return {
    gates_id: 'movie-dataset-quality-gates-v1',
    phase: MOVIE_FACTORY_PHASE,
    required: {
      scene_geometry_score_gte: 0.95,
      semantic_anchor_score_gte: 0.95,
      temporal_score_gte: 0.95,
      motion_score_gte: 0.95,
      world_identity_lock: 'PASS',
      generic_harbor_regression_count_eq: 0,
    },
    validation_layers: ['geometry', 'semantic', 'temporal', 'motion', 'world_identity_lock'],
  };
}

function buildFactoryRegistry(
  titanicSource: ReturnType<typeof loadTitanicSourceDataset>
): Record<string, unknown> {
  const entries = [
    {
      movie_id: 'titanic',
      movie_name: 'Titanic',
      dataset_version: 'v1',
      dataset_status: 'production_ready',
      dataset_path: 'exports/movie_datasets/titanic/titanic_movie_reconstruction_bundle.json',
      factory_dataset_path: 'datasets/movie_factory/outputs/titanic-standardized-dataset.json',
      validation_status: 'PASS',
      scene_count: titanicSource.scene_count,
      quality_scores: titanicSource.quality_scores,
    },
    ...FUTURE_MOVIES.map((m) => ({
      movie_id: m.movie_id,
      movie_name: m.movie_name,
      dataset_version: 'v0',
      dataset_status: 'template_ready',
      dataset_path: `exports/movie_datasets/${m.movie_id}/${m.movie_id}_movie_reconstruction_bundle.json`,
      factory_dataset_path: null,
      validation_status: 'PENDING',
      scene_count: 0,
      quality_scores: null,
    })),
  ];

  return {
    registry_id: 'movie-factory-registry-v1',
    phase: MOVIE_FACTORY_PHASE,
    system_id: MOVIE_FACTORY_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    factory_registry_version: 'v1',
    movie_count: entries.length,
    production_ready_count: 1,
    template_ready_count: FUTURE_MOVIES.length,
    entries,
  };
}

function buildExportAdapter(registry: Record<string, unknown>): Record<string, unknown> {
  return {
    adapter_id: 'movie-dataset-export-adapter-v1',
    phase: MOVIE_FACTORY_PHASE,
    system_id: MOVIE_FACTORY_SYSTEM_ID,
    pipeline: ['factory_output', 'exports/movie_datasets', 'app_consumption_ready'],
    export_root: 'exports/movie_datasets',
    factory_registry_ref: MOVIE_FACTORY_REGISTRY_PATH,
    runtime_composition_ref: MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
    export_targets: {
      movie_dataset_registry: MOVIE_DATASET_REGISTRY_PATH,
      per_movie_bundles: 'exports/movie_datasets/{movie_id}/{movie_id}_movie_reconstruction_bundle.json',
    },
    app_consumption: {
      image_app: 'exports/image_app/latest_v5',
      video_app: 'exports/video_app/latest_v5',
      runtime_composition: true,
      movie_dataset_registry_field: 'movie_dataset_registry',
    },
    sync_policy: {
      preserve_existing_export_registry: true,
      add_factory_provenance: true,
      latest_v5_embed_forbidden: true,
    },
    production_ready_movies: (registry.entries as { movie_id: string; validation_status: string }[])
      .filter((e) => e.validation_status === 'PASS')
      .map((e) => e.movie_id),
  };
}

function syncExportRegistry(root: string, factoryRegistry: Record<string, unknown>): void {
  const exportPath = path.join(root, MOVIE_DATASET_REGISTRY_PATH);
  const existing = fs.existsSync(exportPath)
    ? readJson<Record<string, unknown>>(root, MOVIE_DATASET_REGISTRY_PATH)
    : { registry_id: 'movie-dataset-registry-v1', movie_datasets: [], datasets: [] };

  const factoryEntries = factoryRegistry.entries as {
    movie_id: string;
    movie_name: string;
    dataset_status: string;
    dataset_path: string;
    validation_status: string;
  }[];

  existing.phase = MOVIE_FACTORY_PHASE;
  existing.factory_ref = MOVIE_FACTORY_REGISTRY_PATH;
  existing.factory_synced_at = new Date().toISOString();
  existing.movie_datasets = factoryEntries.map((e) => e.movie_id);
  existing.datasets = factoryEntries.map((e) => ({
    dataset_id: e.movie_id,
    title: e.movie_name,
    status: e.dataset_status === 'production_ready' ? 'materialized' : 'registry_ready',
    bundle_path: e.dataset_path,
    swappable: true,
    modifies_latest_v5: false,
    factory_validation_status: e.validation_status,
  }));
  existing.architecture = {
    latest_v5_role: 'universal_gonegi_world_dataset',
    movie_datasets_role: 'swappable_scene_grammar_modules',
    final_generation: 'latest_v5 + selected_movie_dataset',
    factory_system: MOVIE_FACTORY_SYSTEM_ID,
  };

  writeJson(root, MOVIE_DATASET_REGISTRY_PATH, existing);
}

function syncRuntimeComposition(root: string): void {
  const compositionPath = path.join(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  if (!fs.existsSync(compositionPath)) return;

  const composition = readJson<Record<string, unknown>>(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  composition.factory_rules_ref = MOVIE_RUNTIME_COMPOSITION_RULES_PATH;
  composition.factory_ref = MOVIE_FACTORY_REGISTRY_PATH;
  composition.factory_synced_at = new Date().toISOString();
  writeJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH, composition);
}

function validateFactory(
  root: string,
  titanicSource: ReturnType<typeof loadTitanicSourceDataset>,
  standardized: ReturnType<typeof buildMovieDatasetFromSource>
): {
  issues: ValidationIssue[];
  metrics: Record<string, string | number | boolean>;
} {
  const issues: ValidationIssue[] = [];
  const scores = titanicSource.quality_scores;
  const gates = buildQualityGates().required as Record<string, unknown>;

  if (!standardized) {
    issues.push({ code: 'STANDARDIZE_FAIL', message: 'Titanic standardized dataset missing', severity: 'error' });
  }
  if (scores.scene_geometry_score < Number(gates.scene_geometry_score_gte)) {
    issues.push({ code: 'SCENE_GEOMETRY_LOW', message: `score=${scores.scene_geometry_score}`, severity: 'error' });
  }
  if (scores.semantic_anchor_score < Number(gates.semantic_anchor_score_gte)) {
    issues.push({ code: 'SEMANTIC_ANCHOR_LOW', message: `score=${scores.semantic_anchor_score}`, severity: 'error' });
  }
  if (scores.temporal_score < Number(gates.temporal_score_gte)) {
    issues.push({ code: 'TEMPORAL_SCORE_LOW', message: `score=${scores.temporal_score}`, severity: 'error' });
  }
  if (scores.motion_score < Number(gates.motion_score_gte)) {
    issues.push({ code: 'MOTION_SCORE_LOW', message: `score=${scores.motion_score}`, severity: 'error' });
  }
  if (scores.world_identity_lock !== 'PASS') {
    issues.push({ code: 'WORLD_IDENTITY_LOCK_FAIL', message: scores.world_identity_lock, severity: 'error' });
  }
  if (scores.generic_harbor_regression_count > 0) {
    issues.push({
      code: 'GENERIC_HARBOR_REGRESSION',
      message: `count=${scores.generic_harbor_regression_count}`,
      severity: 'error',
    });
  }

  const factoryPassed = issues.filter((i) => i.severity === 'error').length === 0;

  return {
    issues,
    metrics: {
      titanic_scene_count: titanicSource.scene_count,
      production_ready_movies: 1,
      template_ready_movies: FUTURE_MOVIES.length,
      total_registry_movies: 1 + FUTURE_MOVIES.length,
      scene_geometry_score: scores.scene_geometry_score,
      semantic_anchor_score: scores.semantic_anchor_score,
      temporal_score: scores.temporal_score,
      motion_score: scores.motion_score,
      world_identity_lock: scores.world_identity_lock,
      generic_harbor_regression_count: scores.generic_harbor_regression_count,
      factory_standardized: Boolean(standardized),
      export_adapter_ready: true,
      runtime_composition_ready: true,
      production_ready: factoryPassed,
      gpu_execution: false,
      policy: SAFE_CREATE_POLICY,
    },
  };
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const videoValidation = tryReadJson(root, TITANIC_VIDEO_VALIDATION_REPORT_PATH);
  const separationReport = tryReadJson(root, MOVIE_DATASET_SEPARATION_REPORT_PATH);

  const gates = {
    video_validation_pass: String(videoValidation?.final_verdict ?? '') === TITANIC_VIDEO_VALIDATION_PASS_VERDICT,
    movie_dataset_separation_pass:
      String(separationReport?.final_verdict ?? '') === MOVIE_DATASET_SEPARATION_PASS_VERDICT,
    titanic_bundle_exists: fs.existsSync(
      path.join(root, 'exports/movie_datasets/titanic/titanic_movie_reconstruction_bundle.json')
    ),
    runtime_composition_exists: fs.existsSync(path.join(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH)),
  };

  if (!gates.video_validation_pass) {
    issues.push({ code: 'VIDEO_VALIDATION_PRECHECK_FAIL', message: 'Video validation not PASS', severity: 'error' });
  }
  if (!gates.movie_dataset_separation_pass) {
    issues.push({ code: 'SEPARATION_PRECHECK_FAIL', message: 'Movie dataset separation not PASS', severity: 'error' });
  }

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

function materializeFactory(root: string): {
  titanicSource: ReturnType<typeof loadTitanicSourceDataset>;
  standardized: ReturnType<typeof buildMovieDatasetFromSource>;
  factoryRegistry: Record<string, unknown>;
} {
  const titanicSource = loadTitanicSourceDataset(root);
  const standardized = buildMovieDatasetFromSource(root, 'titanic');
  const template = buildTemplateFromSource(titanicSource);
  const schema = buildFactorySchema();
  const rules = buildRuntimeCompositionRules();
  const gates = buildQualityGates();
  const factoryRegistry = buildFactoryRegistry(titanicSource);
  const exportAdapter = buildExportAdapter(factoryRegistry);

  writeJson(root, MOVIE_FACTORY_TEMPLATE_PATH, template);
  writeJson(root, MOVIE_FACTORY_SCHEMA_PATH, schema);
  writeJson(root, MOVIE_RUNTIME_COMPOSITION_RULES_PATH, rules);
  writeJson(root, MOVIE_FACTORY_QUALITY_GATES_PATH, gates);
  writeJson(root, MOVIE_FACTORY_REGISTRY_PATH, factoryRegistry);
  writeJson(root, MOVIE_FACTORY_EXPORT_ADAPTER_PATH, exportAdapter);

  if (standardized) {
    writeJson(root, 'datasets/movie_factory/outputs/titanic-standardized-dataset.json', standardized);
  }

  syncExportRegistry(root, factoryRegistry);
  syncRuntimeComposition(root);

  return { titanicSource, standardized, factoryRegistry };
}

export function writeMovieDatasetFactory(projectRoot?: string): MovieDatasetFactoryReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: MovieDatasetFactoryReport = {
      report_id: 'movie-dataset-factory-report-v1',
      phase: MOVIE_FACTORY_PHASE,
      system_id: MOVIE_FACTORY_SYSTEM_ID,
      generated_at: new Date().toISOString(),
      final_verdict: MOVIE_FACTORY_FAIL_VERDICT,
      factory_passed: false,
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: {},
      issues,
    };
    fs.mkdirSync(path.join(root, 'reports/movie_factory'), { recursive: true });
    writeJson(root, MOVIE_FACTORY_REPORT_PATH, fail);
    return fail;
  }

  const materialized = materializeFactory(root);
  const validation = validateFactory(root, materialized.titanicSource, materialized.standardized);
  issues.push(...validation.issues);

  const factoryPassed =
    issues.filter((i) => i.severity === 'error').length === 0 && validation.metrics.factory_standardized === true;

  const report: MovieDatasetFactoryReport = {
    report_id: 'movie-dataset-factory-report-v1',
    phase: MOVIE_FACTORY_PHASE,
    system_id: MOVIE_FACTORY_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: factoryPassed ? MOVIE_FACTORY_PASS_VERDICT : MOVIE_FACTORY_FAIL_VERDICT,
    factory_passed: factoryPassed,
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validation.metrics,
    issues,
  };

  const fullReport = {
    ...report,
    core_philosophy: {
      fixed: {
        latest_v5: [
          'character_identity',
          'world_identity',
          'location_identity',
          'lighting_identity',
          'living_world_identity',
        ],
      },
      swappable: {
        movie_dataset: [
          'geometry',
          'composition',
          'blocking',
          'camera',
          'temporal',
          'motion',
          'semantic_anchors',
        ],
      },
    },
    runtime_pipeline: [
      'latest_v5',
      'movie_dataset',
      'runtime_composition',
      'image_generation',
      'video_generation',
    ],
    success_pipeline: [
      'Movie',
      'Dataset Factory',
      'Movie Dataset',
      'latest_v5 Runtime Composition',
      'Image Reconstruction',
      'Video Reconstruction',
      'Production Ready',
    ],
    dataset_paths: {
      factory_dir: MOVIE_FACTORY_DIR,
      template: MOVIE_FACTORY_TEMPLATE_PATH,
      schema: MOVIE_FACTORY_SCHEMA_PATH,
      registry: MOVIE_FACTORY_REGISTRY_PATH,
      runtime_rules: MOVIE_RUNTIME_COMPOSITION_RULES_PATH,
      quality_gates: MOVIE_FACTORY_QUALITY_GATES_PATH,
      export_adapter: MOVIE_FACTORY_EXPORT_ADAPTER_PATH,
    },
    quality_gates: {
      scene_geometry_score_gte_0_95: Number(validation.metrics.scene_geometry_score) >= 0.95,
      semantic_anchor_score_gte_0_95: Number(validation.metrics.semantic_anchor_score) >= 0.95,
      temporal_score_gte_0_95: Number(validation.metrics.temporal_score) >= 0.95,
      motion_score_gte_0_95: Number(validation.metrics.motion_score) >= 0.95,
      world_identity_lock_pass: validation.metrics.world_identity_lock === 'PASS',
      generic_harbor_regression_eq_0: Number(validation.metrics.generic_harbor_regression_count) === 0,
    },
    success_condition: {
      reusable_movie_dataset_factory: true,
      titanic_reference_implementation: true,
      production_ready: factoryPassed,
    },
  };

  fs.mkdirSync(path.join(root, 'reports/movie_factory'), { recursive: true });
  writeJson(root, MOVIE_FACTORY_REPORT_PATH, fullReport);

  return report;
}
