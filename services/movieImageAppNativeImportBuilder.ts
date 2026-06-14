import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATION_PROMPT_MANIFEST_PATH,
  IMAGE_APP_PROMPT_PHASE,
  IMAGE_APP_PROMPT_SYSTEM_ID,
  copyImageAppArtStylePrompt,
  copyImageAppCharacterFieldFromGraph,
  copyImageAppTimeSettingPrompt,
} from './imageAppPromptLoader.js';
import {
  copySourceOfTruthArtStyle,
  copySourceOfTruthCharacterFieldFromGraph,
  copySourceOfTruthTimeSettingPrompt,
  SOURCE_OF_TRUTH_MANIFEST_PATH,
  SOURCE_OF_TRUTH_PHASE,
  SOURCE_OF_TRUTH_SYSTEM_ID,
} from './sourceOfTruthLoader.js';
import {
  ImageAppNativeScenarioFormat,
  MASTER_DATASET_BINDING_OUTPUTS,
  MovieMasterDatasetBindingDataset,
  MovieMasterDatasetSceneBinding,
  loadAllMovieMasterDatasetBindingDatasets,
} from './movieMasterDatasetBinding.js';
import { generateHardenedScenarioFromSpatialGraph } from './movieScenarioHardening.js';
import {
  MovieSpatialGraph,
  MovieSpatialGraphDataset,
  SPATIAL_GRAPH_OUTPUTS,
  loadAllMovieSpatialGraphDatasets,
} from './movieSpatialGraphBuilder.js';
import {
  MovieSpatialEngineDataset,
  MovieSpatialSceneRecord,
  loadAllMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import {
  APPROVED_ORIGINALS_MANIFEST_PATH,
  APPROVED_ORIGINALS_PHASE,
  APPROVED_ORIGINALS_SYSTEM_ID,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
  FINAL_SOURCE_LOCK_PHASE,
  FINAL_SOURCE_LOCK_SYSTEM_ID,
} from './approvedOriginalsLoader.js';
import { ensureApprovedOriginalsFrozen } from './approvedOriginalsFreezeBuilder.js';
import { ensureSourceOfTruthFrozen } from './sourceOfTruthFreezeBuilder.js';
import { LEGACY_MOVIE_SPATIAL_EXPORT_ROOT, NATIVE_IMPORT_V8_ACTIVE_OUTPUTS } from './generationOutputPaths.js';
import { resolveLockedTimeSettingId } from './movieTimeSettingLock.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_IMAGE_APP_NATIVE_IMPORT_PHASE = 'PHASE-MOVIE-SPATIAL-008' as const;
export const MOVIE_IMAGE_APP_NATIVE_IMPORT_SYSTEM_ID = 'MOVIE_IMAGE_APP_NATIVE_IMPORT_V1' as const;
export const MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT =
  'PASS_MOVIE_IMAGE_APP_NATIVE_IMPORT_V1' as const;
export const MOVIE_IMAGE_APP_NATIVE_IMPORT_FAIL_VERDICT =
  'FAIL_MOVIE_IMAGE_APP_NATIVE_IMPORT_V1' as const;

export const MOVIE_IMAGE_APP_NATIVE_IMPORT_SCHEMA_PATH =
  'datasets/movie_spatial/movie-image-app-native-import.schema.json' as const;
export const MOVIE_IMAGE_APP_NATIVE_IMPORT_REPORT_PATH =
  'reports/movie_spatial/MOVIE_IMAGE_APP_NATIVE_IMPORT_REPORT.json' as const;

export const NATIVE_IMPORT_REQUIRED_SLOT_FIELDS = [
  'artStyle',
  'timeSetting',
  'scenario',
  'character',
] as const;

export type NativeImportRequiredSlotField = (typeof NATIVE_IMPORT_REQUIRED_SLOT_FIELDS)[number];

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const LEGACY_EXPORT_ROOT = LEGACY_MOVIE_SPATIAL_EXPORT_ROOT;

export const IMAGE_APP_NATIVE_IMPORT_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: `${LEGACY_EXPORT_ROOT}/titanic-image-app-native-import.json`,
  },
  {
    movie_id: 'spirited_away',
    output_path: `${LEGACY_EXPORT_ROOT}/spirited-away-image-app-native-import.json`,
  },
] as const;

export const NATIVE_IMPORT_V5_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: `${LEGACY_EXPORT_ROOT}/titanic-image-app-native-import-v5.json`,
  },
  {
    movie_id: 'spirited_away',
    output_path: `${LEGACY_EXPORT_ROOT}/spirited-away-image-app-native-import-v5.json`,
  },
] as const;

export interface ImageAppNativeImportSlot extends ImageAppNativeScenarioFormat {}

export interface MovieImageAppNativeImportDataset {
  native_import_id: string;
  phase: typeof MOVIE_IMAGE_APP_NATIVE_IMPORT_PHASE;
  system_id: typeof MOVIE_IMAGE_APP_NATIVE_IMPORT_SYSTEM_ID;
  movie_id: string;
  source_binding_ref: string;
  generated_at: string;
  slot_count: number;
  music_drama_import_ready: boolean;
  slots: ImageAppNativeImportSlot[];
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface MovieImageAppNativeImportV5Dataset {
  native_import_id: string;
  phase: typeof IMAGE_APP_PROMPT_PHASE;
  system_id: typeof IMAGE_APP_PROMPT_SYSTEM_ID;
  version: 'v5';
  movie_id: string;
  source_prompt_manifest_ref: typeof GENERATION_PROMPT_MANIFEST_PATH;
  source_spatial_graph_ref: string;
  generated_at: string;
  slot_count: number;
  image_app_prompt_restoration: true;
  music_drama_import_ready: boolean;
  slots: ImageAppNativeImportSlot[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function refForMovie<T extends { movie_id: string; output_path: string }>(
  specs: readonly T[],
  movieId: string
): string {
  const spec = specs.find((entry) => entry.movie_id === movieId);
  if (!spec) throw new Error(`Missing ref spec for movie_id=${movieId}`);
  return spec.output_path;
}

export const NATIVE_IMPORT_V6_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: `${LEGACY_EXPORT_ROOT}/titanic-image-app-native-import-v6.json`,
  },
  {
    movie_id: 'spirited_away',
    output_path: `${LEGACY_EXPORT_ROOT}/spirited-away-image-app-native-import-v6.json`,
  },
] as const;

export interface MovieImageAppNativeImportV6Dataset {
  native_import_id: string;
  phase: typeof SOURCE_OF_TRUTH_PHASE;
  system_id: typeof SOURCE_OF_TRUTH_SYSTEM_ID;
  version: 'v6';
  movie_id: string;
  source_of_truth_manifest_ref: typeof SOURCE_OF_TRUTH_MANIFEST_PATH;
  source_spatial_graph_ref: string;
  generated_at: string;
  slot_count: number;
  source_of_truth_frozen: true;
  music_drama_import_ready: boolean;
  slots: ImageAppNativeImportSlot[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function buildNativeImportV6Slot(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  root: string
): ImageAppNativeImportSlot {
  const timeSettingId = resolveLockedTimeSettingId(graph);
  return {
    artStyle: copySourceOfTruthArtStyle(root),
    timeSetting: copySourceOfTruthTimeSettingPrompt(timeSettingId, root),
    scenario: generateHardenedScenarioFromSpatialGraph(graph, spatialScene),
    character: copySourceOfTruthCharacterFieldFromGraph(graph, root),
  };
}

export function buildMovieImageAppNativeImportV6Dataset(
  graphDataset: MovieSpatialGraphDataset,
  engineDataset: MovieSpatialEngineDataset,
  root: string
): MovieImageAppNativeImportV6Dataset {
  const spatialSceneById = new Map(
    engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene])
  );
  const slots = graphDataset.spatial_graphs.map((graph) =>
    buildNativeImportV6Slot(
      graph,
      spatialSceneById.get(graph.scene_id) ?? null,
      root
    )
  );

  return {
    native_import_id: `${graphDataset.movie_id}-image-app-native-import-v6`,
    phase: SOURCE_OF_TRUTH_PHASE,
    system_id: SOURCE_OF_TRUTH_SYSTEM_ID,
    version: 'v6',
    movie_id: graphDataset.movie_id,
    source_of_truth_manifest_ref: SOURCE_OF_TRUTH_MANIFEST_PATH,
    source_spatial_graph_ref: refForMovie(SPATIAL_GRAPH_OUTPUTS, graphDataset.movie_id),
    generated_at: new Date().toISOString(),
    slot_count: slots.length,
    source_of_truth_frozen: true,
    music_drama_import_ready: slots.length > 0,
    slots,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieImageAppNativeImportV6Datasets(
  root: string
): MovieImageAppNativeImportV6Dataset[] {
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  return graphDatasets.map((graphDataset) => {
    const engineDataset =
      engineDatasets.find((entry) => entry.movie_id === graphDataset.movie_id) ??
      (() => {
        throw new Error(`Missing spatial engine dataset for movie_id=${graphDataset.movie_id}`);
      })();
    return buildMovieImageAppNativeImportV6Dataset(graphDataset, engineDataset, root);
  });
}

export function writeMovieImageAppNativeImportV6Datasets(
  projectRoot?: string
): MovieImageAppNativeImportV6Dataset[] {
  const root = resolveProjectRoot(projectRoot);
  ensureSourceOfTruthFrozen(root);
  const datasets = buildAllMovieImageAppNativeImportV6Datasets(root);

  for (const spec of NATIVE_IMPORT_V6_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieImageAppNativeImportV6Dataset(
  root: string,
  movieId: string
): MovieImageAppNativeImportV6Dataset | null {
  const spec = NATIVE_IMPORT_V6_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppNativeImportV6Dataset;
}

export const NATIVE_IMPORT_V7_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: `${LEGACY_EXPORT_ROOT}/titanic-image-app-native-import-v7.json`,
  },
  {
    movie_id: 'spirited_away',
    output_path: `${LEGACY_EXPORT_ROOT}/spirited-away-image-app-native-import-v7.json`,
  },
] as const;

export interface MovieImageAppNativeImportV7Dataset {
  native_import_id: string;
  phase: typeof APPROVED_ORIGINALS_PHASE;
  system_id: typeof APPROVED_ORIGINALS_SYSTEM_ID;
  version: 'v7';
  movie_id: string;
  approved_originals_artstyle_ref: typeof ARTSTYLE_APPROVED_PATH;
  approved_originals_character_ref: typeof CHARACTER_APPROVED_PATH;
  source_spatial_graph_ref: string;
  generated_at: string;
  slot_count: number;
  approved_original_locked: true;
  music_drama_import_ready: boolean;
  slots: ImageAppNativeImportSlot[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function buildNativeImportV7Slot(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  root: string
): ImageAppNativeImportSlot {
  const timeSettingId = resolveLockedTimeSettingId(graph);
  return {
    artStyle: copySourceOfTruthArtStyle(root),
    timeSetting: copySourceOfTruthTimeSettingPrompt(timeSettingId, root),
    scenario: generateHardenedScenarioFromSpatialGraph(graph, spatialScene),
    character: copySourceOfTruthCharacterFieldFromGraph(graph, root),
  };
}

export function buildMovieImageAppNativeImportV7Dataset(
  graphDataset: MovieSpatialGraphDataset,
  engineDataset: MovieSpatialEngineDataset,
  root: string
): MovieImageAppNativeImportV7Dataset {
  const spatialSceneById = new Map(
    engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene])
  );
  const slots = graphDataset.spatial_graphs.map((graph) =>
    buildNativeImportV7Slot(
      graph,
      spatialSceneById.get(graph.scene_id) ?? null,
      root
    )
  );

  return {
    native_import_id: `${graphDataset.movie_id}-image-app-native-import-v7`,
    phase: APPROVED_ORIGINALS_PHASE,
    system_id: APPROVED_ORIGINALS_SYSTEM_ID,
    version: 'v7',
    movie_id: graphDataset.movie_id,
    approved_originals_artstyle_ref: ARTSTYLE_APPROVED_PATH,
    approved_originals_character_ref: CHARACTER_APPROVED_PATH,
    source_spatial_graph_ref: refForMovie(SPATIAL_GRAPH_OUTPUTS, graphDataset.movie_id),
    generated_at: new Date().toISOString(),
    slot_count: slots.length,
    approved_original_locked: true,
    music_drama_import_ready: slots.length > 0,
    slots,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieImageAppNativeImportV7Datasets(
  root: string
): MovieImageAppNativeImportV7Dataset[] {
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  return graphDatasets.map((graphDataset) => {
    const engineDataset =
      engineDatasets.find((entry) => entry.movie_id === graphDataset.movie_id) ??
      (() => {
        throw new Error(`Missing spatial engine dataset for movie_id=${graphDataset.movie_id}`);
      })();
    return buildMovieImageAppNativeImportV7Dataset(graphDataset, engineDataset, root);
  });
}

export function writeMovieImageAppNativeImportV7Datasets(
  projectRoot?: string
): MovieImageAppNativeImportV7Dataset[] {
  const root = resolveProjectRoot(projectRoot);
  ensureApprovedOriginalsFrozen(root);
  ensureSourceOfTruthFrozen(root);
  const datasets = buildAllMovieImageAppNativeImportV7Datasets(root);

  for (const spec of NATIVE_IMPORT_V7_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieImageAppNativeImportV7Dataset(
  root: string,
  movieId: string
): MovieImageAppNativeImportV7Dataset | null {
  const spec = NATIVE_IMPORT_V7_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppNativeImportV7Dataset;
}

export const NATIVE_IMPORT_V8_OUTPUTS = NATIVE_IMPORT_V8_ACTIVE_OUTPUTS;

export interface MovieImageAppNativeImportV8Dataset {
  native_import_id: string;
  phase: typeof FINAL_SOURCE_LOCK_PHASE;
  system_id: typeof FINAL_SOURCE_LOCK_SYSTEM_ID;
  version: 'v8';
  movie_id: string;
  approved_originals_manifest_ref: typeof APPROVED_ORIGINALS_MANIFEST_PATH;
  approved_originals_artstyle_ref: typeof ARTSTYLE_APPROVED_PATH;
  approved_originals_character_ref: typeof CHARACTER_APPROVED_PATH;
  approved_originals_timesetting_ref: typeof TIMESETTING_APPROVED_PATH;
  source_spatial_graph_ref: string;
  generated_at: string;
  slot_count: number;
  approved_originals_locked: true;
  final_source_lock: true;
  music_drama_import_ready: boolean;
  slots: ImageAppNativeImportSlot[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function buildNativeImportV8Slot(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  root: string
): ImageAppNativeImportSlot {
  const timeSettingId = resolveLockedTimeSettingId(graph);
  return {
    artStyle: copySourceOfTruthArtStyle(root),
    timeSetting: copySourceOfTruthTimeSettingPrompt(timeSettingId, root),
    scenario: generateHardenedScenarioFromSpatialGraph(graph, spatialScene),
    character: copySourceOfTruthCharacterFieldFromGraph(graph, root),
  };
}

export function buildMovieImageAppNativeImportV8Dataset(
  graphDataset: MovieSpatialGraphDataset,
  engineDataset: MovieSpatialEngineDataset,
  root: string
): MovieImageAppNativeImportV8Dataset {
  const spatialSceneById = new Map(
    engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene])
  );
  const slots = graphDataset.spatial_graphs.map((graph) =>
    buildNativeImportV8Slot(
      graph,
      spatialSceneById.get(graph.scene_id) ?? null,
      root
    )
  );

  return {
    native_import_id: `${graphDataset.movie_id}-image-app-native-import-v8`,
    phase: FINAL_SOURCE_LOCK_PHASE,
    system_id: FINAL_SOURCE_LOCK_SYSTEM_ID,
    version: 'v8',
    movie_id: graphDataset.movie_id,
    approved_originals_manifest_ref: APPROVED_ORIGINALS_MANIFEST_PATH,
    approved_originals_artstyle_ref: ARTSTYLE_APPROVED_PATH,
    approved_originals_character_ref: CHARACTER_APPROVED_PATH,
    approved_originals_timesetting_ref: TIMESETTING_APPROVED_PATH,
    source_spatial_graph_ref: refForMovie(SPATIAL_GRAPH_OUTPUTS, graphDataset.movie_id),
    generated_at: new Date().toISOString(),
    slot_count: slots.length,
    approved_originals_locked: true,
    final_source_lock: true,
    music_drama_import_ready: slots.length > 0,
    slots,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieImageAppNativeImportV8Datasets(
  root: string
): MovieImageAppNativeImportV8Dataset[] {
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  return graphDatasets.map((graphDataset) => {
    const engineDataset =
      engineDatasets.find((entry) => entry.movie_id === graphDataset.movie_id) ??
      (() => {
        throw new Error(`Missing spatial engine dataset for movie_id=${graphDataset.movie_id}`);
      })();
    return buildMovieImageAppNativeImportV8Dataset(graphDataset, engineDataset, root);
  });
}

export function writeMovieImageAppNativeImportV8Datasets(
  projectRoot?: string
): MovieImageAppNativeImportV8Dataset[] {
  const root = resolveProjectRoot(projectRoot);
  ensureApprovedOriginalsFrozen(root);
  ensureSourceOfTruthFrozen(root);
  const datasets = buildAllMovieImageAppNativeImportV8Datasets(root);

  for (const spec of NATIVE_IMPORT_V8_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieImageAppNativeImportV8Dataset(
  root: string,
  movieId: string
): MovieImageAppNativeImportV8Dataset | null {
  const spec = NATIVE_IMPORT_V8_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppNativeImportV8Dataset;
}

function buildNativeImportV5Slot(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  root: string
): ImageAppNativeImportSlot {
  const timeSettingId = resolveLockedTimeSettingId(graph);
  return {
    artStyle: copyImageAppArtStylePrompt(root),
    timeSetting: copyImageAppTimeSettingPrompt(timeSettingId, root),
    scenario: generateHardenedScenarioFromSpatialGraph(graph, spatialScene),
    character: copyImageAppCharacterFieldFromGraph(graph, root),
  };
}

export function buildMovieImageAppNativeImportV5Dataset(
  graphDataset: MovieSpatialGraphDataset,
  engineDataset: MovieSpatialEngineDataset,
  root: string
): MovieImageAppNativeImportV5Dataset {
  const spatialSceneById = new Map(
    engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene])
  );
  const slots = graphDataset.spatial_graphs.map((graph) =>
    buildNativeImportV5Slot(
      graph,
      spatialSceneById.get(graph.scene_id) ?? null,
      root
    )
  );

  return {
    native_import_id: `${graphDataset.movie_id}-image-app-native-import-v5`,
    phase: IMAGE_APP_PROMPT_PHASE,
    system_id: IMAGE_APP_PROMPT_SYSTEM_ID,
    version: 'v5',
    movie_id: graphDataset.movie_id,
    source_prompt_manifest_ref: GENERATION_PROMPT_MANIFEST_PATH,
    source_spatial_graph_ref: refForMovie(SPATIAL_GRAPH_OUTPUTS, graphDataset.movie_id),
    generated_at: new Date().toISOString(),
    slot_count: slots.length,
    image_app_prompt_restoration: true,
    music_drama_import_ready: slots.length > 0,
    slots,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieImageAppNativeImportV5Datasets(
  root: string
): MovieImageAppNativeImportV5Dataset[] {
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  return graphDatasets.map((graphDataset) => {
    const engineDataset =
      engineDatasets.find((entry) => entry.movie_id === graphDataset.movie_id) ??
      (() => {
        throw new Error(`Missing spatial engine dataset for movie_id=${graphDataset.movie_id}`);
      })();
    return buildMovieImageAppNativeImportV5Dataset(graphDataset, engineDataset, root);
  });
}

export function writeMovieImageAppNativeImportV5Datasets(projectRoot?: string): MovieImageAppNativeImportV5Dataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieImageAppNativeImportV5Datasets(root);

  for (const spec of NATIVE_IMPORT_V5_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieImageAppNativeImportV5Dataset(
  root: string,
  movieId: string
): MovieImageAppNativeImportV5Dataset | null {
  const spec = NATIVE_IMPORT_V5_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppNativeImportV5Dataset;
}

function bindingToSlot(binding: MovieMasterDatasetSceneBinding): ImageAppNativeImportSlot {
  if (binding.field_binding.artStyle.generated) {
    throw new Error(`${binding.scene_id}: artStyle must not be generated`);
  }
  if (binding.field_binding.timeSetting.generated) {
    throw new Error(`${binding.scene_id}: timeSetting must not be generated`);
  }
  if (binding.field_binding.character.generated) {
    throw new Error(`${binding.scene_id}: character must not be generated`);
  }
  if (!binding.field_binding.scenario.generated) {
    throw new Error(`${binding.scene_id}: scenario must be generated from spatial graph`);
  }

  return {
    artStyle: binding.image_app_native_format.artStyle,
    timeSetting: binding.image_app_native_format.timeSetting,
    scenario: binding.image_app_native_format.scenario,
    character: binding.image_app_native_format.character,
  };
}

export function buildMovieImageAppNativeImportDataset(
  bindingDataset: MovieMasterDatasetBindingDataset
): MovieImageAppNativeImportDataset {
  const sourceBindingRef = refForMovie(MASTER_DATASET_BINDING_OUTPUTS, bindingDataset.movie_id);
  const slots = bindingDataset.scene_bindings.map((binding) => bindingToSlot(binding));

  return {
    native_import_id: `${bindingDataset.movie_id}-image-app-native-import-v1`,
    phase: MOVIE_IMAGE_APP_NATIVE_IMPORT_PHASE,
    system_id: MOVIE_IMAGE_APP_NATIVE_IMPORT_SYSTEM_ID,
    movie_id: bindingDataset.movie_id,
    source_binding_ref: sourceBindingRef,
    generated_at: new Date().toISOString(),
    slot_count: slots.length,
    music_drama_import_ready: slots.length > 0,
    slots,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieImageAppNativeImportDatasets(
  root: string
): MovieImageAppNativeImportDataset[] {
  const bindingDatasets = loadAllMovieMasterDatasetBindingDatasets(root);
  return bindingDatasets.map((bindingDataset) =>
    buildMovieImageAppNativeImportDataset(bindingDataset)
  );
}

export function writeMovieImageAppNativeImports(projectRoot?: string): MovieImageAppNativeImportDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieImageAppNativeImportDatasets(root);

  for (const spec of IMAGE_APP_NATIVE_IMPORT_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieImageAppNativeImportDataset(
  root: string,
  movieId: string
): MovieImageAppNativeImportDataset | null {
  const spec = IMAGE_APP_NATIVE_IMPORT_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppNativeImportDataset;
}

export function loadAllMovieImageAppNativeImportDatasets(
  root: string
): MovieImageAppNativeImportDataset[] {
  return IMAGE_APP_NATIVE_IMPORT_OUTPUTS.map((spec) =>
    loadMovieImageAppNativeImportDataset(root, spec.movie_id)
  ).filter((dataset): dataset is MovieImageAppNativeImportDataset => dataset !== null);
}

export { SAFE_CREATE_POLICY };
