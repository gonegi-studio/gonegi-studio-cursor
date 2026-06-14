import fs from 'node:fs';
import path from 'node:path';
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
  APPROVED_ORIGINALS_DIR,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
} from './approvedOriginalsLoader.js';
import {
  copySourceOfTruthArtStyle,
  copySourceOfTruthCharacterFieldFromGraph,
  copySourceOfTruthTimeSettingPrompt,
  SOURCE_OF_TRUTH_ARTSTYLE_REF,
  sourceOfTruthCharacterPromptRefs,
  sourceOfTruthTimeSettingPromptRef,
} from './sourceOfTruthLoader.js';
import { resolveCharacterId } from './movieCharacterDNALock.js';
import { resolveLockedTimeSettingId } from './movieTimeSettingLock.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { ensureSourceOfTruthFrozen } from './sourceOfTruthFreezeBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_MASTER_DATASET_BINDING_PHASE = 'PHASE-MOVIE-SPATIAL-007' as const;
export const MOVIE_MASTER_DATASET_BINDING_SYSTEM_ID = 'MOVIE_MASTER_DATASET_BINDING_V1' as const;
export const MOVIE_MASTER_DATASET_BINDING_PASS_VERDICT =
  'PASS_MOVIE_MASTER_DATASET_BINDING_V1' as const;
export const MOVIE_MASTER_DATASET_BINDING_FAIL_VERDICT =
  'FAIL_MOVIE_MASTER_DATASET_BINDING_V1' as const;

export const MOVIE_MASTER_DATASET_BINDING_SCHEMA_PATH =
  'datasets/movie_spatial/movie-master-dataset-binding.schema.json' as const;
export const MOVIE_MASTER_DATASET_BINDING_REPORT_PATH =
  'reports/movie_spatial/MOVIE_MASTER_DATASET_BINDING_REPORT.json' as const;

export const MASTER_STYLE_CORE_DIR = APPROVED_ORIGINALS_DIR;
export const MASTER_STYLE_CORE_CANONICAL_REF = `${ARTSTYLE_APPROVED_PATH}#artstyle_approved` as const;
export const MASTER_STYLE_CORE_MEDITERRANEAN_REF = MASTER_STYLE_CORE_CANONICAL_REF;
export const MASTER_STYLE_CORE_MANIFEST_REF = `${APPROVED_ORIGINALS_DIR}/APPROVED_ORIGINALS_MANIFEST.json` as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const MASTER_DATASET_BINDING_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_spatial/titanic/titanic-master-dataset-binding.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_spatial/spirited_away/spirited-away-master-dataset-binding.json',
  },
] as const;

export interface FieldBindingRecord {
  generated: boolean;
  value: string;
  source_ref: string;
}

export interface ImageAppNativeScenarioFormat {
  artStyle: string;
  timeSetting: string;
  scenario: string;
  character: string;
}

export interface MovieMasterDatasetSceneBinding {
  binding_id: string;
  movie_id: string;
  scene_id: string;
  art_style_ref: string;
  time_setting_ref: string;
  character_ref: string;
  scenario_ref: string;
  binding_status: 'bound' | 'unbound';
  field_binding: {
    artStyle: FieldBindingRecord;
    timeSetting: FieldBindingRecord;
    scenario: FieldBindingRecord;
    character: FieldBindingRecord;
  };
  image_app_native_format: ImageAppNativeScenarioFormat;
}

export interface MovieMasterDatasetBindingDataset {
  binding_dataset_id: string;
  phase: typeof MOVIE_MASTER_DATASET_BINDING_PHASE;
  system_id: typeof MOVIE_MASTER_DATASET_BINDING_SYSTEM_ID;
  movie_id: string;
  source_spatial_graph_ref: string;
  generated_at: string;
  binding_count: number;
  master_binding_policy: {
    artStyle: { source: typeof ARTSTYLE_APPROVED_PATH; generation: false; rewrite: false; summarization: false };
    timeSetting: { source: typeof TIMESETTING_APPROVED_PATH; generation: false };
    character: { source: typeof CHARACTER_APPROVED_PATH; generation: false };
    scenario: { source: 'movie_spatial_graph'; generation: true };
  };
  scene_bindings: MovieMasterDatasetSceneBinding[];
  execution_flags: typeof EXECUTION_FLAGS;
}

type CharacterSimpleProfile = {
  character_id: string;
  display_name_en: string;
  visual_identity: string;
  hair: string;
  clothing: string;
};

type CharacterSimpleLibraryFull = {
  characters: CharacterSimpleProfile[];
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function refForMovie<T extends { movie_id: string; output_path: string }>(
  specs: readonly T[],
  movieId: string
): string {
  const spec = specs.find((entry) => entry.movie_id === movieId);
  if (!spec) throw new Error(`Missing ref spec for movie_id=${movieId}`);
  return spec.output_path;
}

function selectTimeSettingId(graph: MovieSpatialGraph): string {
  const environment = graph.environment_nodes[0];
  const category = environment?.scene_category?.toLowerCase() ?? '';
  const envType = environment?.environment_type?.toLowerCase() ?? '';

  if (envType.includes('spirit') || category.includes('bath')) return 'blue_hour';
  if (envType.includes('luxury') || category.includes('promenade')) return 'golden_hour';
  if (category.includes('harbor') || category.includes('dock')) return 'morning_sunshine';
  return 'afternoon_work';
}

export function resolveMasterStyleArtStyle(root: string): { value: string; ref: string } {
  return {
    value: copySourceOfTruthArtStyle(root),
    ref: SOURCE_OF_TRUTH_ARTSTYLE_REF,
  };
}

export function resolveCharacterFromLibrary(
  characterNodes: MovieSpatialGraph['character_nodes'],
  characterLibrary: CharacterSimpleLibraryFull
): { value: string; refs: string[] } {
  const refs: string[] = [];
  const lines: string[] = [];

  for (const node of characterNodes) {
    const profileId = resolveCharacterId(node.character_id);
    const profile = characterLibrary.characters.find((entry) => entry.character_id === profileId);
    if (!profile) {
      throw new Error(`Missing character library profile for ${node.character_id} -> ${profileId}`);
    }
    refs.push(`${CHARACTER_APPROVED_PATH}#${profileId}`);
    lines.push(
      `${profile.display_name_en}: ${profile.visual_identity}. ${profile.hair}. ${profile.clothing}.`
    );
  }

  return {
    value: lines.join(' '),
    refs: [...new Set(refs)],
  };
}

export function generateScenarioFromSpatialGraph(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null
): string {
  const environment = graph.environment_nodes[0];
  const camera = graph.camera_nodes[0];
  const category = environment?.scene_category ?? 'general_scene';
  const envType = environment?.environment_type ?? 'scene_environment';
  const anchor = environment?.anchor_id ?? graph.scene_id;
  const interaction = graph.interaction_edges[0]?.interaction_type ?? 'scene_preservation';
  const cameraHeight = camera?.camera_height ?? 'eye_level';

  const layoutHint = spatialScene
    ? `Foreground elements ${spatialScene.foreground_layout.element_ids.length}, midground characters ${spatialScene.midground_layout.element_ids.length}, background anchors ${spatialScene.background_layout.element_ids.length}.`
    : 'Spatial depth layers preserved from movie replica blocking.';

  return [
    `A ${category.replace(/_/g, ' ')} within a ${envType.replace(/_/g, ' ')} environment.`,
    `Primary semantic anchor ${anchor.replace(/_/g, ' ')}.`,
    `Characters hold ${interaction.replace(/_/g, ' ')} blocking under a ${cameraHeight.replace(/_/g, ' ')} camera.`,
    layoutHint,
    'Atmosphere remains cinematic, visual, and music-drama compatible with one primary location and one primary action.',
  ].join(' ');
}

function buildSceneBinding(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  graphRef: string,
  root: string
): MovieMasterDatasetSceneBinding {
  const timeSettingId = resolveLockedTimeSettingId(graph);
  const artStyleValue = copySourceOfTruthArtStyle(root);
  const characterValue = copySourceOfTruthCharacterFieldFromGraph(graph, root);
  const characterIds = graph.character_nodes.map((node) => resolveCharacterId(node.character_id));
  const scenarioValue = generateScenarioFromSpatialGraph(graph, spatialScene);

  const promptTimeSettingRef = sourceOfTruthTimeSettingPromptRef(timeSettingId);
  const promptCharacterRef = sourceOfTruthCharacterPromptRefs(characterIds);
  const scenarioRef = `${graphRef}#scene_id=${graph.scene_id}`;

  const imageAppNativeFormat: ImageAppNativeScenarioFormat = {
    artStyle: artStyleValue,
    timeSetting: copySourceOfTruthTimeSettingPrompt(timeSettingId, root),
    scenario: scenarioValue,
    character: characterValue,
  };

  return {
    binding_id: `${graph.movie_id}_master_binding_${graph.scene_id}`,
    movie_id: graph.movie_id,
    scene_id: graph.scene_id,
    art_style_ref: SOURCE_OF_TRUTH_ARTSTYLE_REF,
    time_setting_ref: promptTimeSettingRef,
    character_ref: promptCharacterRef,
    scenario_ref: scenarioRef,
    binding_status: 'bound',
    field_binding: {
      artStyle: {
        generated: false,
        value: artStyleValue,
        source_ref: SOURCE_OF_TRUTH_ARTSTYLE_REF,
      },
      timeSetting: {
        generated: false,
        value: imageAppNativeFormat.timeSetting,
        source_ref: promptTimeSettingRef,
      },
      scenario: {
        generated: true,
        value: scenarioValue,
        source_ref: scenarioRef,
      },
      character: {
        generated: false,
        value: characterValue,
        source_ref: promptCharacterRef,
      },
    },
    image_app_native_format: imageAppNativeFormat,
  };
}

export function buildMovieMasterDatasetBindingDataset(
  graphDataset: MovieSpatialGraphDataset,
  engineDataset: MovieSpatialEngineDataset,
  root: string
): MovieMasterDatasetBindingDataset {
  const graphRef = refForMovie(SPATIAL_GRAPH_OUTPUTS, graphDataset.movie_id);
  const spatialSceneById = new Map(engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene]));

  const sceneBindings = graphDataset.spatial_graphs.map((graph) =>
    buildSceneBinding(graph, spatialSceneById.get(graph.scene_id) ?? null, graphRef, root)
  );

  return {
    binding_dataset_id: `${graphDataset.movie_id}-master-dataset-binding-v1`,
    phase: MOVIE_MASTER_DATASET_BINDING_PHASE,
    system_id: MOVIE_MASTER_DATASET_BINDING_SYSTEM_ID,
    movie_id: graphDataset.movie_id,
    source_spatial_graph_ref: graphRef,
    generated_at: new Date().toISOString(),
    binding_count: sceneBindings.length,
    master_binding_policy: {
      artStyle: {
        source: ARTSTYLE_APPROVED_PATH,
        generation: false,
        rewrite: false,
        summarization: false,
      },
      timeSetting: {
        source: TIMESETTING_APPROVED_PATH,
        generation: false,
      },
      character: {
        source: CHARACTER_APPROVED_PATH,
        generation: false,
      },
      scenario: {
        source: 'movie_spatial_graph',
        generation: true,
      },
    },
    scene_bindings: sceneBindings,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieMasterDatasetBindingDatasets(root: string): MovieMasterDatasetBindingDataset[] {
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  return graphDatasets.map((graphDataset) => {
    const engineDataset = engineDatasets.find((entry) => entry.movie_id === graphDataset.movie_id);
    if (!engineDataset) {
      throw new Error(`Missing spatial engine dataset for movie_id=${graphDataset.movie_id}`);
    }
    return buildMovieMasterDatasetBindingDataset(graphDataset, engineDataset, root);
  });
}

export function writeMovieMasterDatasetBindings(projectRoot?: string): MovieMasterDatasetBindingDataset[] {
  const root = resolveProjectRoot(projectRoot);
  ensureSourceOfTruthFrozen(root);
  const datasets = buildAllMovieMasterDatasetBindingDatasets(root);

  for (const spec of MASTER_DATASET_BINDING_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieMasterDatasetBindingDataset(
  root: string,
  movieId: string
): MovieMasterDatasetBindingDataset | null {
  const spec = MASTER_DATASET_BINDING_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieMasterDatasetBindingDataset;
}

export function loadAllMovieMasterDatasetBindingDatasets(
  root: string
): MovieMasterDatasetBindingDataset[] {
  return MASTER_DATASET_BINDING_OUTPUTS.map((spec) =>
    loadMovieMasterDatasetBindingDataset(root, spec.movie_id)
  ).filter((dataset): dataset is MovieMasterDatasetBindingDataset => dataset !== null);
}

export { SAFE_CREATE_POLICY };
