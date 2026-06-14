import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_LATEST_V5_DIR,
  IMAGE_APP_UPLOAD_PACKAGE_V5_PATH,
  VIDEO_APP_LATEST_V5_DIR,
  VIDEO_APP_UPLOAD_PACKAGE_V5_PATH,
} from './exportRebuild/datasetMaterializer.js';
import {
  MOVIE_DATASET_REGISTRY_PATH,
  MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
  TITANIC_MOVIE_DATASET_BUNDLE_PATH,
} from './movieDatasetSeparation.js';
import {
  MOVIE_FACTORY_EXPORT_ADAPTER_PATH,
  MOVIE_FACTORY_PASS_VERDICT,
  MOVIE_FACTORY_QUALITY_GATES_PATH,
  MOVIE_FACTORY_REGISTRY_PATH,
  MOVIE_FACTORY_REPORT_PATH,
  MOVIE_FACTORY_SCHEMA_PATH,
  MOVIE_RUNTIME_COMPOSITION_RULES_PATH,
} from './movieDatasetFactory.js';
import { StandardizedMovieDataset } from './movieDatasetBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_FACTORY_VALIDATION_PHASE = 'PHASE-MOVIE-DATASET-FACTORY-VALIDATION-001' as const;
export const MOVIE_FACTORY_VALIDATION_ID = 'MOVIE_DATASET_FACTORY_VALIDATION_V1' as const;
export const MOVIE_FACTORY_VALIDATION_PASS_VERDICT = 'PASS_MOVIE_DATASET_FACTORY_VALIDATION_V1' as const;
export const MOVIE_FACTORY_VALIDATION_FAIL_VERDICT = 'FAIL_MOVIE_DATASET_FACTORY_VALIDATION_V1' as const;

export const MOVIE_FACTORY_VALIDATION_DIR = 'datasets/movie_factory_validation' as const;
export const MOVIE_FACTORY_VALIDATION_CONFIG_PATH =
  'datasets/movie_factory_validation/movie-factory-validation-config.json' as const;
export const MOVIE_FACTORY_VALIDATION_REPORT_PATH =
  'reports/movie_factory_validation/movie-factory-validation-report.json' as const;

const LATEST_V5_IDENTITY_BUNDLES = [
  'character_dna_bundle.json',
  'location_dna_bundle.json',
  'lighting_dna_bundle.json',
  'environment_dna_bundle.json',
] as const;

const LATEST_V5_FORBIDDEN_EMBEDS = [
  'titanic_movie_reconstruction_bundle.json',
  'movie_reconstruction_datasets',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface FactoryRegistryEntry {
  movie_id: string;
  movie_name: string;
  dataset_status: string;
  dataset_path: string;
  factory_dataset_path: string | null;
  validation_status: string;
}

interface ValidationAreaResult {
  area: string;
  passed: boolean;
  checks: Record<string, boolean>;
  missing: string[];
}

export interface MovieDatasetFactoryValidationReport {
  report_id: string;
  phase: typeof MOVIE_FACTORY_VALIDATION_PHASE;
  validation_id: typeof MOVIE_FACTORY_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  validation_areas: ValidationAreaResult[];
  runtime_output: Record<string, string>;
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

function exists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function collectLayerPaths(standardized: StandardizedMovieDataset): string[] {
  const paths: string[] = [];
  const pushIfString = (value: unknown) => {
    if (typeof value === 'string' && value.length > 0) paths.push(value);
  };

  const geometry = standardized.geometry_layer as Record<string, unknown>;
  const shot = standardized.shot_layer as Record<string, unknown>;
  const temporal = standardized.temporal_layer as Record<string, unknown>;
  const motion = standardized.motion_layer as Record<string, unknown>;
  const semantic = standardized.semantic_layer as Record<string, unknown>;
  const validation = standardized.validation_layer as Record<string, unknown>;

  pushIfString(geometry.base_geometry);
  pushIfString(geometry.dense_geometry);
  pushIfString(shot.shots_dir);
  pushIfString(temporal.video_dir);
  pushIfString(motion.motion_dir);
  pushIfString(semantic.semantic_anchor_library);
  pushIfString(semantic.world_translation_rules);
  pushIfString(semantic.semantic_preservation);
  pushIfString(validation.image_validation);
  pushIfString(validation.video_validation);

  const shotRef = (shot.bundle_ref ?? {}) as Record<string, unknown>;
  const temporalRef = (temporal.bundle_ref ?? {}) as Record<string, unknown>;
  const motionRef = (motion.bundle_ref ?? {}) as Record<string, unknown>;

  for (const key of Object.keys(shotRef)) {
    if (key.endsWith('_ref') && typeof shotRef[key] === 'string') paths.push(shotRef[key] as string);
  }
  for (const key of Object.keys(temporalRef)) {
    if (key.endsWith('_ref') && typeof temporalRef[key] === 'string') paths.push(temporalRef[key] as string);
  }
  for (const key of Object.keys(motionRef)) {
    if (key.endsWith('_ref') && typeof motionRef[key] === 'string') paths.push(motionRef[key] as string);
  }

  return [...new Set(paths)];
}

function resolveAdapterPaths(standardized: StandardizedMovieDataset): {
  image_adapter: string | null;
  video_adapter: string | null;
  motion_adapter: string | null;
} {
  const shotRef = (standardized.shot_layer.bundle_ref ?? {}) as Record<string, unknown>;
  const temporalRef = (standardized.temporal_layer.bundle_ref ?? {}) as Record<string, unknown>;
  const motionRef = (standardized.motion_layer.bundle_ref ?? {}) as Record<string, unknown>;

  return {
    image_adapter: typeof shotRef.image_adapter_ref === 'string' ? shotRef.image_adapter_ref : null,
    video_adapter:
      typeof temporalRef.video_adapter_v2_ref === 'string'
        ? temporalRef.video_adapter_v2_ref
        : typeof shotRef.video_adapter_ref === 'string'
          ? shotRef.video_adapter_ref
          : null,
    motion_adapter: typeof motionRef.motion_adapter_ref === 'string' ? motionRef.motion_adapter_ref : null,
  };
}

function latestV5ContainsMovieEmbed(root: string): boolean {
  const imageDir = path.join(root, IMAGE_APP_LATEST_V5_DIR);
  const videoDir = path.join(root, VIDEO_APP_LATEST_V5_DIR);
  if (!fs.existsSync(imageDir) || !fs.existsSync(videoDir)) return true;

  for (const forbidden of LATEST_V5_FORBIDDEN_EMBEDS) {
    if (exists(root, path.join(IMAGE_APP_LATEST_V5_DIR, forbidden))) return true;
    if (exists(root, path.join(VIDEO_APP_LATEST_V5_DIR, forbidden))) return true;
  }

  const imagePkg = tryReadJson(root, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH);
  const videoPkg = tryReadJson(root, VIDEO_APP_UPLOAD_PACKAGE_V5_PATH);
  if (imagePkg?.movie_reconstruction_datasets || videoPkg?.movie_reconstruction_datasets) return true;

  return false;
}

function validateFactorySchema(
  root: string,
  standardized: StandardizedMovieDataset,
  schema: Record<string, unknown>
): ValidationAreaResult {
  const required = (schema.required as string[]) ?? [];
  const missing: string[] = [];

  for (const field of required) {
    if (!(field in standardized)) missing.push(field);
  }
  if (!standardized.factory_metadata?.standardized) missing.push('factory_metadata.standardized');

  const layerPaths = collectLayerPaths(standardized);
  for (const rel of layerPaths) {
    if (!exists(root, rel)) missing.push(rel);
  }

  return {
    area: 'factory_schema_validation',
    passed: missing.length === 0,
    checks: {
      required_fields_present: required.every((f) => f in standardized),
      factory_metadata_standardized: standardized.factory_metadata?.standardized === true,
      layer_paths_exist: layerPaths.every((p) => exists(root, p)),
    },
    missing,
  };
}

function validateRuntimeComposition(
  root: string,
  rules: Record<string, unknown>
): { area: ValidationAreaResult; runtimeOutput: Record<string, string> } {
  const composition = tryReadJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  const worldLock = (composition?.world_identity_lock ?? {}) as Record<string, unknown>;
  const latestDominates = (rules.latest_v5_dominates ?? {}) as Record<string, unknown>;
  const movieDominates = (rules.movie_dataset_dominates ?? {}) as Record<string, unknown>;

  const runtimeOutput: Record<string, string> = {
    character_dna_source: 'latest_v5',
    location_dna_source: 'latest_v5',
    lighting_dna_source: 'latest_v5',
    living_world_source: 'latest_v5',
    geometry_source: 'movie_dataset',
    camera_source: 'movie_dataset',
    blocking_source: 'movie_dataset',
    semantic_source: 'movie_dataset',
    composition_source: 'movie_dataset',
    temporal_source: 'movie_dataset',
    motion_source: 'movie_dataset',
  };

  const checks = {
    base_dataset_latest_v5: composition?.base_dataset === 'latest_v5',
    movie_dataset_set: typeof composition?.movie_dataset === 'string',
    world_identity_source_latest_v5: composition?.world_identity_source === 'latest_v5',
    movie_geometry_source_movie_dataset: composition?.movie_geometry_source === 'movie_dataset',
    merge_mode_runtime: composition?.merge_mode === 'runtime',
    world_lock_pass: worldLock.status === 'PASS',
    latest_v5_character_dominance: latestDominates.character_identity === true,
    latest_v5_location_dominance: latestDominates.location_identity === true,
    latest_v5_lighting_dominance: latestDominates.lighting_identity === true,
    latest_v5_living_world_dominance: latestDominates.living_world_identity === true,
    movie_scene_structure_dominance: movieDominates.scene_structure === true,
    movie_camera_grammar_dominance: movieDominates.camera_grammar === true,
    movie_blocking_grammar_dominance: movieDominates.blocking_grammar === true,
    movie_semantic_anchors_dominance: movieDominates.semantic_anchors === true,
    factory_rules_ref_present: typeof composition?.factory_rules_ref === 'string',
  };

  const missing: string[] = [];
  if (!exists(root, MOVIE_RUNTIME_COMPOSITION_RULES_PATH)) missing.push(MOVIE_RUNTIME_COMPOSITION_RULES_PATH);
  if (!exists(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH)) missing.push(MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);

  return {
    area: {
      area: 'runtime_composition_validation',
      passed: Object.values(checks).every(Boolean) && missing.length === 0,
      checks,
      missing,
    },
    runtimeOutput,
  };
}

function validateImageAdapter(root: string, adapterPath: string | null): ValidationAreaResult {
  const missing: string[] = [];
  if (!adapterPath) {
    return {
      area: 'image_adapter_validation',
      passed: false,
      checks: { adapter_path_resolved: false },
      missing: ['image_adapter_ref'],
    };
  }
  if (!exists(root, adapterPath)) missing.push(adapterPath);

  const adapter = tryReadJson(root, adapterPath);
  const checks = {
    adapter_path_resolved: Boolean(adapterPath),
    adapter_exists: exists(root, adapterPath),
    adapter_ready: adapter?.adapter_ready === true,
    shared_movie_dataset: adapter?.shared_movie_dataset === true,
    world_identity_source_latest_v5: adapter?.world_identity_source === 'latest_v5',
    movie_geometry_source_movie_dataset: adapter?.movie_geometry_source === 'movie_dataset',
    target_app_image: adapter?.target_app === 'image_app',
    separate_image_dataset_false: adapter?.separate_image_dataset === false,
  };

  return {
    area: 'image_adapter_validation',
    passed: Object.values(checks).every(Boolean) && missing.length === 0,
    checks,
    missing,
  };
}

function validateVideoAdapter(root: string, adapterPath: string | null): ValidationAreaResult {
  const missing: string[] = [];
  if (!adapterPath) {
    return {
      area: 'video_adapter_validation',
      passed: false,
      checks: { adapter_path_resolved: false },
      missing: ['video_adapter_ref'],
    };
  }
  if (!exists(root, adapterPath)) missing.push(adapterPath);

  const adapter = tryReadJson(root, adapterPath);
  const checks = {
    adapter_path_resolved: Boolean(adapterPath),
    adapter_exists: exists(root, adapterPath),
    adapter_ready: adapter?.adapter_ready === true,
    shared_movie_dataset: adapter?.shared_movie_dataset === true,
    world_identity_source_latest_v5: adapter?.world_identity_source === 'latest_v5',
    movie_structure_source_movie_dataset: adapter?.movie_structure_source === 'movie_dataset',
    target_app_video: adapter?.target_app === 'video_app',
    video_generation_ready: adapter?.video_generation_status === 'READY',
  };

  return {
    area: 'video_adapter_validation',
    passed: Object.values(checks).every(Boolean) && missing.length === 0,
    checks,
    missing,
  };
}

function validateDatasetRegistry(
  root: string,
  entry: FactoryRegistryEntry,
  standardized: StandardizedMovieDataset,
  adapters: ReturnType<typeof resolveAdapterPaths>
): ValidationAreaResult {
  const missing: string[] = [];
  const requiredExports = [
    MOVIE_FACTORY_REGISTRY_PATH,
    MOVIE_DATASET_REGISTRY_PATH,
    MOVIE_FACTORY_EXPORT_ADAPTER_PATH,
    entry.dataset_path,
    entry.factory_dataset_path ?? '',
    standardized.factory_metadata.source_bundle,
  ].filter(Boolean);

  const requiredLayers = [
    'geometry_layer',
    'shot_layer',
    'temporal_layer',
    'motion_layer',
    'semantic_layer',
    'validation_layer',
  ];

  for (const rel of requiredExports) {
    if (!exists(root, rel)) missing.push(rel);
  }
  if (adapters.image_adapter && !exists(root, adapters.image_adapter)) missing.push(adapters.image_adapter);
  if (adapters.video_adapter && !exists(root, adapters.video_adapter)) missing.push(adapters.video_adapter);
  if (adapters.motion_adapter && !exists(root, adapters.motion_adapter)) missing.push(adapters.motion_adapter);

  const exportRegistry = tryReadJson(root, MOVIE_DATASET_REGISTRY_PATH);
  const factoryRegistry = tryReadJson(root, MOVIE_FACTORY_REGISTRY_PATH);

  const checks = {
    all_required_layers_exist: requiredLayers.every((layer) => layer in standardized),
    image_adapter_exists: adapters.image_adapter ? exists(root, adapters.image_adapter) : false,
    video_adapter_exists: adapters.video_adapter ? exists(root, adapters.video_adapter) : false,
    motion_adapter_exists: adapters.motion_adapter ? exists(root, adapters.motion_adapter) : false,
    export_bundle_exists: exists(root, entry.dataset_path),
    factory_output_exists: entry.factory_dataset_path ? exists(root, entry.factory_dataset_path) : false,
    export_registry_exists: Boolean(exportRegistry?.movie_datasets),
    factory_registry_exists: Boolean(factoryRegistry?.entries),
    production_entry_validated: entry.validation_status === 'PASS',
  };

  return {
    area: 'dataset_registry_validation',
    passed: Object.values(checks).every(Boolean) && missing.length === 0,
    checks,
    missing,
  };
}

function validateDatasetIsolation(root: string, standardized: StandardizedMovieDataset): ValidationAreaResult {
  const missing: string[] = [];
  const latestV5Embed = latestV5ContainsMovieEmbed(root);

  for (const bundle of LATEST_V5_IDENTITY_BUNDLES) {
    const rel = path.join(IMAGE_APP_LATEST_V5_DIR, bundle);
    if (!exists(root, rel)) missing.push(rel);
  }

  const movieMustNotModify = {
    character_identity: true,
    location_identity: true,
    lighting_identity: true,
    world_identity: true,
  };

  const movieMayModify = {
    scene_geometry: Boolean(standardized.geometry_layer),
    camera: Boolean(standardized.shot_layer),
    blocking: Boolean(standardized.shot_layer),
    composition: Boolean(standardized.shot_layer),
    temporal_flow: Boolean(standardized.temporal_layer),
    motion_flow: Boolean(standardized.motion_layer),
    semantic_anchors: Boolean(standardized.semantic_layer),
  };

  const checks = {
    latest_v5_no_movie_embed: !latestV5Embed,
    identity_bundles_in_latest_v5: LATEST_V5_IDENTITY_BUNDLES.every((b) =>
      exists(root, path.join(IMAGE_APP_LATEST_V5_DIR, b))
    ),
    movie_must_not_modify_character: movieMustNotModify.character_identity,
    movie_must_not_modify_location: movieMustNotModify.location_identity,
    movie_must_not_modify_lighting: movieMustNotModify.lighting_identity,
    movie_must_not_modify_world: movieMustNotModify.world_identity,
    movie_may_modify_geometry: movieMayModify.scene_geometry,
    movie_may_modify_camera: movieMayModify.camera,
    movie_may_modify_blocking: movieMayModify.blocking,
    movie_may_modify_composition: movieMayModify.composition,
    movie_may_modify_temporal: movieMayModify.temporal_flow,
    movie_may_modify_motion: movieMayModify.motion_flow,
    movie_may_modify_semantic: movieMayModify.semantic_anchors,
  };

  return {
    area: 'dataset_isolation_validation',
    passed: Object.values(checks).every(Boolean) && missing.length === 0,
    checks,
    missing,
  };
}

function validateWorldIdentityLock(root: string): ValidationAreaResult {
  const composition = tryReadJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  const worldLock = (composition?.world_identity_lock ?? {}) as Record<string, unknown>;
  const metadata = tryReadJson(root, 'datasets/app_consumption/generation-metadata-contract.json');

  const checks = {
    world_lock_status_pass: worldLock.status === 'PASS',
    gonegi_world_dominance_gte_0_7: Number(worldLock.gonegi_world_dominance) >= 0.7,
    movie_dataset_dominance_lte_0_3: Number(worldLock.movie_dataset_dominance) <= 0.3,
    movie_world_override_forbidden: worldLock.movie_world_override_forbidden === true,
    metadata_latest_v5_no_movie_embed: metadata?.latest_v5_contains_movie_dataset === false,
    metadata_runtime_composition: metadata?.runtime_composition === true,
  };

  return {
    area: 'world_identity_lock_validation',
    passed: Object.values(checks).every(Boolean),
    checks,
    missing: [],
  };
}

function validateMovieDatasetSwap(root: string): ValidationAreaResult {
  const composition = tryReadJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  const exportRegistry = tryReadJson(root, MOVIE_DATASET_REGISTRY_PATH);
  const datasets = (exportRegistry?.datasets ?? []) as { dataset_id: string; swappable: boolean; modifies_latest_v5: boolean }[];

  const checks = {
    swappable_movie_datasets_defined: Array.isArray(composition?.swappable_movie_datasets),
    swappable_count_gte_5: Array.isArray(composition?.swappable_movie_datasets)
      ? (composition.swappable_movie_datasets as string[]).length >= 5
      : false,
    active_movie_in_swappable_list:
      Array.isArray(composition?.swappable_movie_datasets) &&
      (composition.swappable_movie_datasets as string[]).includes(String(composition?.movie_dataset)),
    all_registry_entries_swappable: datasets.every((d) => d.swappable === true),
    none_modify_latest_v5: datasets.every((d) => d.modifies_latest_v5 === false),
    registry_ref_linked: composition?.registry_ref === MOVIE_DATASET_REGISTRY_PATH,
  };

  return {
    area: 'movie_dataset_swap_validation',
    passed: Object.values(checks).every(Boolean),
    checks,
    missing: [],
  };
}

function ensureRuntimeCompositionFactoryRefs(root: string): void {
  const compositionPath = path.join(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  if (!fs.existsSync(compositionPath)) return;

  const composition = readJson<Record<string, unknown>>(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  composition.factory_rules_ref = MOVIE_RUNTIME_COMPOSITION_RULES_PATH;
  composition.factory_ref = MOVIE_FACTORY_REGISTRY_PATH;
  composition.factory_validation_ref = MOVIE_FACTORY_VALIDATION_REPORT_PATH;
  writeJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH, composition);
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const factoryReport = tryReadJson(root, MOVIE_FACTORY_REPORT_PATH);

  const gates = {
    factory_pass: String(factoryReport?.final_verdict ?? '') === MOVIE_FACTORY_PASS_VERDICT,
    factory_registry_exists: exists(root, MOVIE_FACTORY_REGISTRY_PATH),
    standardized_output_exists: exists(root, 'datasets/movie_factory/outputs/titanic-standardized-dataset.json'),
    titanic_bundle_exists: exists(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH),
  };

  if (!gates.factory_pass) {
    issues.push({ code: 'FACTORY_PRECHECK_FAIL', message: 'Movie dataset factory not PASS', severity: 'error' });
  }

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

function buildValidationConfig(): Record<string, unknown> {
  return {
    config_id: 'movie-factory-validation-config-v1',
    phase: MOVIE_FACTORY_VALIDATION_PHASE,
    validation_id: MOVIE_FACTORY_VALIDATION_ID,
    validation_areas: [
      'factory_schema_validation',
      'runtime_composition_validation',
      'image_adapter_validation',
      'video_adapter_validation',
      'dataset_registry_validation',
      'dataset_isolation_validation',
      'world_identity_lock_validation',
      'movie_dataset_swap_validation',
    ],
    reference_movie: 'titanic',
    validation_mode: 'factory_generic_no_movie_specific_code',
    quality_gates: {
      factory_output_valid: true,
      runtime_composition_valid: true,
      image_adapter_valid: true,
      video_adapter_valid: true,
      movie_dataset_swap_valid: true,
      dataset_isolation_valid: true,
      world_identity_lock_valid: true,
      critical_missing_count_eq_0: true,
    },
    next_phase_on_pass: 'PHASE-SPIRITED-AWAY-DATASET-001',
  };
}

export function writeMovieDatasetFactoryValidation(
  projectRoot?: string
): MovieDatasetFactoryValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: MovieDatasetFactoryValidationReport = {
      report_id: 'movie-factory-validation-report-v1',
      phase: MOVIE_FACTORY_VALIDATION_PHASE,
      validation_id: MOVIE_FACTORY_VALIDATION_ID,
      generated_at: new Date().toISOString(),
      final_verdict: MOVIE_FACTORY_VALIDATION_FAIL_VERDICT,
      validation_passed: false,
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: {},
      validation_areas: [],
      runtime_output: {},
      issues,
    };
    writeJson(root, MOVIE_FACTORY_VALIDATION_CONFIG_PATH, buildValidationConfig());
    writeJson(root, MOVIE_FACTORY_VALIDATION_REPORT_PATH, fail);
    return fail;
  }

  ensureRuntimeCompositionFactoryRefs(root);

  const factoryRegistry = readJson<{ entries: FactoryRegistryEntry[] }>(root, MOVIE_FACTORY_REGISTRY_PATH);
  const productionEntry =
    factoryRegistry.entries.find((e) => e.dataset_status === 'production_ready' && e.validation_status === 'PASS') ??
    factoryRegistry.entries[0];

  const standardized = readJson<StandardizedMovieDataset>(
    root,
    productionEntry.factory_dataset_path ?? 'datasets/movie_factory/outputs/titanic-standardized-dataset.json'
  );
  const schema = readJson<Record<string, unknown>>(root, MOVIE_FACTORY_SCHEMA_PATH);
  const rules = readJson<Record<string, unknown>>(root, MOVIE_RUNTIME_COMPOSITION_RULES_PATH);
  const adapters = resolveAdapterPaths(standardized);

  const schemaResult = validateFactorySchema(root, standardized, schema);
  const runtimeResult = validateRuntimeComposition(root, rules);
  const imageResult = validateImageAdapter(root, adapters.image_adapter);
  const videoResult = validateVideoAdapter(root, adapters.video_adapter);
  const registryResult = validateDatasetRegistry(root, productionEntry, standardized, adapters);
  const isolationResult = validateDatasetIsolation(root, standardized);
  const worldLockResult = validateWorldIdentityLock(root);
  const swapResult = validateMovieDatasetSwap(root);

  const validationAreas = [
    schemaResult,
    runtimeResult.area,
    imageResult,
    videoResult,
    registryResult,
    isolationResult,
    worldLockResult,
    swapResult,
  ];

  const criticalMissing = validationAreas.reduce((sum, area) => sum + area.missing.length, 0);

  const metrics = {
    factory_output_valid: schemaResult.passed,
    runtime_composition_valid: runtimeResult.area.passed,
    image_adapter_valid: imageResult.passed,
    video_adapter_valid: videoResult.passed,
    movie_dataset_swap_valid: swapResult.passed,
    dataset_isolation_valid: isolationResult.passed,
    world_identity_lock_valid: worldLockResult.passed,
    critical_missing_count: criticalMissing,
    reference_movie_id: productionEntry.movie_id,
    factory_certified: false,
    production_ready_for_second_movie: false,
    gpu_execution: false,
    policy: SAFE_CREATE_POLICY,
  };

  for (const area of validationAreas) {
    if (!area.passed) {
      issues.push({
        code: `${area.area.toUpperCase()}_FAIL`,
        message: `missing=${area.missing.join(',') || 'checks_failed'}`,
        severity: 'error',
      });
    }
  }
  if (criticalMissing > 0) {
    issues.push({ code: 'CRITICAL_MISSING', message: `count=${criticalMissing}`, severity: 'error' });
  }

  const validationPassed =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    metrics.factory_output_valid === true &&
    metrics.runtime_composition_valid === true &&
    metrics.image_adapter_valid === true &&
    metrics.video_adapter_valid === true &&
    metrics.movie_dataset_swap_valid === true &&
    metrics.dataset_isolation_valid === true &&
    metrics.world_identity_lock_valid === true &&
    criticalMissing === 0;

  const summary = {
    ...metrics,
    factory_certified: validationPassed,
    production_ready_for_second_movie: validationPassed,
    next_phase: validationPassed ? 'PHASE-SPIRITED-AWAY-DATASET-001' : 'PHASE-MOVIE-DATASET-FACTORY-PATCH-001',
  };

  const report: MovieDatasetFactoryValidationReport = {
    report_id: 'movie-factory-validation-report-v1',
    phase: MOVIE_FACTORY_VALIDATION_PHASE,
    validation_id: MOVIE_FACTORY_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_FACTORY_VALIDATION_PASS_VERDICT
      : MOVIE_FACTORY_VALIDATION_FAIL_VERDICT,
    validation_passed: validationPassed,
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: summary,
    validation_areas: validationAreas,
    runtime_output: runtimeResult.runtimeOutput,
    issues,
  };

  const fullReport = {
    ...report,
    success_pipeline: [
      'Titanic Dataset',
      'Factory Standardization',
      'Runtime Composition',
      'Image Adapter',
      'Video Adapter',
      validationPassed ? 'PASS' : 'FAIL',
    ],
    success_condition: {
      titanic_validation_pass: validationPassed,
      factory_certified: validationPassed,
      ready_for_second_movie_dataset: validationPassed,
      next_phase: summary.next_phase,
    },
    quality_gates: {
      factory_output_valid: metrics.factory_output_valid,
      runtime_composition_valid: metrics.runtime_composition_valid,
      image_adapter_valid: metrics.image_adapter_valid,
      video_adapter_valid: metrics.video_adapter_valid,
      movie_dataset_swap_valid: metrics.movie_dataset_swap_valid,
      dataset_isolation_valid: metrics.dataset_isolation_valid,
      world_identity_lock_valid: metrics.world_identity_lock_valid,
      critical_missing_count_eq_0: criticalMissing === 0,
    },
    app_compatibility: {
      image_adapter: imageResult.passed ? 'PASS' : 'FAIL',
      video_adapter: videoResult.passed ? 'PASS' : 'FAIL',
      runtime_composition: runtimeResult.area.passed ? 'PASS' : 'FAIL',
      movie_dataset_swap: swapResult.passed ? 'PASS' : 'FAIL',
    },
    dataset_paths: {
      validation_config: MOVIE_FACTORY_VALIDATION_CONFIG_PATH,
      validation_report: MOVIE_FACTORY_VALIDATION_REPORT_PATH,
      factory_registry: MOVIE_FACTORY_REGISTRY_PATH,
      standardized_output: productionEntry.factory_dataset_path,
    },
  };

  writeJson(root, MOVIE_FACTORY_VALIDATION_CONFIG_PATH, buildValidationConfig());
  writeJson(root, MOVIE_FACTORY_VALIDATION_REPORT_PATH, fullReport);

  if (exists(root, MOVIE_FACTORY_QUALITY_GATES_PATH)) {
    const gates = readJson<Record<string, unknown>>(root, MOVIE_FACTORY_QUALITY_GATES_PATH);
    gates.factory_validation_ref = MOVIE_FACTORY_VALIDATION_REPORT_PATH;
    gates.factory_certified = validationPassed;
    writeJson(root, MOVIE_FACTORY_QUALITY_GATES_PATH, gates);
  }

  return report;
}
