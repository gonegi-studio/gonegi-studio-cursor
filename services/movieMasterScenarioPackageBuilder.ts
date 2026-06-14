import fs from 'node:fs';
import path from 'node:path';
import { REQUIRED_IMAGE_APP_PAYLOAD_FIELDS } from './imageAppInputExport.js';
import {
  MovieSpatialGraph,
  MovieSpatialGraphDataset,
  SPATIAL_GRAPH_OUTPUTS,
  loadAllMovieSpatialGraphDatasets,
} from './movieSpatialGraphBuilder.js';
import {
  MovieSpatialEngineDataset,
  MovieSpatialSceneRecord,
  SPATIAL_ENGINE_OUTPUTS,
  loadAllMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import {
  copySourceOfTruthArtStyle,
  copySourceOfTruthCharacterFieldFromGraph,
  copySourceOfTruthTimeSettingPrompt,
  SOURCE_OF_TRUTH_ARTSTYLE_REF,
  SOURCE_OF_TRUTH_CHARACTER_PROMPT_REF,
  sourceOfTruthCharacterPromptRefs,
  sourceOfTruthTimeSettingPromptRef,
} from './sourceOfTruthLoader.js';
import { resolveCharacterId as resolveLockedCharacterId } from './movieCharacterDNALock.js';
import { resolveLockedTimeSettingId } from './movieTimeSettingLock.js';
import { WORLD_CONTINUITY_WORLD_ID } from './worldContinuityDefinitions.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_MASTER_SCENARIO_PACKAGE_PHASE = 'PHASE-MOVIE-SPATIAL-004' as const;
export const MOVIE_MASTER_SCENARIO_PACKAGE_SYSTEM_ID = 'MOVIE_MASTER_SCENARIO_PACKAGE_V1' as const;
export const MOVIE_MASTER_SCENARIO_PACKAGE_PASS_VERDICT = 'PASS_MOVIE_MASTER_SCENARIO_PACKAGE_V1' as const;
export const MOVIE_MASTER_SCENARIO_PACKAGE_FAIL_VERDICT = 'FAIL_MOVIE_MASTER_SCENARIO_PACKAGE_V1' as const;

export const MOVIE_MASTER_SCENARIO_PACKAGE_SCHEMA_PATH =
  'datasets/movie_spatial/movie-master-scenario-package.schema.json' as const;
export const MOVIE_MASTER_SCENARIO_PACKAGE_REPORT_PATH =
  'reports/movie_spatial/MOVIE_MASTER_SCENARIO_PACKAGE_REPORT.json' as const;

export const ART_STYLE_REF = 'exports/image_app/latest_v5/style_dna_bundle.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const MASTER_SCENARIO_PACKAGE_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_spatial/titanic/titanic-master-scenario-package.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_spatial/spirited_away/spirited-away-master-scenario-package.json',
  },
] as const;

const MOVIE_ART_STYLE: Record<string, string> = {
  titanic:
    'Hand-painted Studio Ghibli-inspired cinematic illustration, warm Mediterranean Gonegi world tone, soft watercolor backgrounds, expressive character eyes, preserved period interior grammar without Titanic world identity.',
  spirited_away:
    'Hand-painted Studio Ghibli-inspired cinematic illustration, Mediterranean Gonegi mythic tone, luminous spirit-world atmosphere, soft layered backgrounds, expressive character eyes.',
};

const CHARACTER_ID_MAP: Record<string, string> = {
  'CHAR-gonagi': 'gonegi',
  'CHAR-dana': 'dana',
  gonagi: 'gonegi',
  dana: 'dana',
};

export interface SerializedScenario {
  serialization_id: string;
  movie_id: string;
  scene_id: string;
  spatial_graph_id: string;
  scenario_field: string;
  character_field: string;
  spatial_blocking: {
    camera_position: [number, number, number];
    camera_target: [number, number, number];
    character_positions: Array<{ character_id: string; position: [number, number, number]; depth_layer: string }>;
    prop_positions: Array<{ prop_id: string; position: [number, number, number]; depth_layer: string }>;
  };
  gaze_summary: string;
}

export interface ImageAppMasterScenario {
  version: 'v1';
  artStyle: string;
  timeSetting: string;
  scenario: string;
  character: string;
  payload_id: string;
  storyboard_id: string;
  scene_order: number;
  image_prompt_pack_id: string;
  acting_camera_id: string;
  image_prompt: string;
  negative_prompt: string;
  acting_intent: string;
  body_action: string;
  gaze_direction: string;
  hand_action: string;
  posture_variation: string;
  camera_angle: string;
  camera_distance: string;
  subject_blocking: string;
  environment_interaction: string;
  location_variation: string;
  character_continuity_anchors: string[];
  location_continuity_anchors: string[];
  world_continuity_anchors: string[];
  spatial_context: {
    scene_id: string;
    camera_position: [number, number, number];
    camera_target: [number, number, number];
    character_positions: Array<{ character_id: string; position: [number, number, number] }>;
    depth_layers: { foreground: string[]; midground: string[]; background: string[] };
  };
}

export interface MasterScenarioScenePackage {
  package_id: string;
  movie_id: string;
  scene_id: string;
  art_style_ref: string;
  time_setting_ref: string;
  character_profile_refs: string[];
  serialized_scenario_ref: string;
  master_scenario: ImageAppMasterScenario;
  generation_ready: boolean;
}

export interface MovieMasterScenarioPackageDataset {
  package_dataset_id: string;
  phase: typeof MOVIE_MASTER_SCENARIO_PACKAGE_PHASE;
  system_id: typeof MOVIE_MASTER_SCENARIO_PACKAGE_SYSTEM_ID;
  movie_id: string;
  source_spatial_graph_ref: string;
  generated_at: string;
  scene_package_count: number;
  scene_packages: MasterScenarioScenePackage[];
  execution_flags: typeof EXECUTION_FLAGS;
}

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

function resolveCharacterId(characterId: string): string {
  return CHARACTER_ID_MAP[characterId] ?? characterId.replace(/^CHAR-/, '').toLowerCase();
}

function sceneOrderFromId(sceneId: string): number {
  const match = sceneId.match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 1;
}

function cameraHeightToAngle(cameraHeight: string): string {
  if (cameraHeight.includes('low')) return 'slight low';
  if (cameraHeight.includes('high')) return 'high';
  return 'eye-level';
}

function numericDistanceToLabel(distance: number): string {
  if (distance >= 4.5) return 'wide';
  if (distance >= 2.5) return 'medium';
  if (distance >= 1.8) return 'medium-close';
  return 'close';
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

function buildCharacterField(
  characterNodes: MovieSpatialGraph['character_nodes'],
  characterLibrary: CharacterSimpleLibrary
): { characterField: string; profileRefs: string[] } {
  const lines: string[] = [];
  const profileRefs: string[] = [];

  for (const node of characterNodes) {
    const profileId = resolveCharacterId(node.character_id);
    const profile = characterLibrary.characters.find((entry) => entry.character_id === profileId);
    profileRefs.push(`${CHARACTER_SIMPLE_LIBRARY_PATH}#${profileId}`);

    if (profile) {
      lines.push(
        `${profile.display_name_en}: ${profile.visual_identity}. ${profile.hair}. ${profile.clothing}.`
      );
    } else {
      lines.push(`${profileId}: active scene character at ${node.depth_layer} depth.`);
    }
  }

  return {
    characterField: lines.join(' '),
    profileRefs: [...new Set(profileRefs)],
  };
}

function buildScenarioField(
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

function buildSerializedScenario(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  root: string
): SerializedScenario {
  const characterField = copySourceOfTruthCharacterFieldFromGraph(graph, root);
  const scenarioField = buildScenarioField(graph, spatialScene);
  const primaryGaze = graph.gaze_edges[0];

  return {
    serialization_id: `${graph.movie_id}_serialized_${graph.scene_id}`,
    movie_id: graph.movie_id,
    scene_id: graph.scene_id,
    spatial_graph_id: graph.graph_id,
    scenario_field: scenarioField,
    character_field: characterField,
    spatial_blocking: {
      camera_position: graph.camera_nodes[0]?.position ?? [0.5, 0.35, 3],
      camera_target: graph.camera_nodes[0]?.camera_target ?? [0.5, 0.5, 1.6],
      character_positions: graph.character_nodes.map((node) => ({
        character_id: node.character_id,
        position: node.position,
        depth_layer: node.depth_layer,
      })),
      prop_positions: graph.prop_nodes.map((node) => ({
        prop_id: node.prop_id,
        position: node.position,
        depth_layer: node.depth_layer,
      })),
    },
    gaze_summary: primaryGaze
      ? `${primaryGaze.source_node_id} gaze direction [${primaryGaze.direction.join(', ')}]`
      : 'primary character gaze toward scene partner',
  };
}

function buildMasterScenario(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  serialized: SerializedScenario,
  artStyle: string,
  timeSetting: string
): ImageAppMasterScenario {
  const camera = graph.camera_nodes[0];
  const sceneOrder = sceneOrderFromId(graph.scene_id);
  const storyboardId = `${graph.movie_id}_${graph.scene_id}`;
  const cameraDistance = numericDistanceToLabel(camera?.camera_distance ?? 3);
  const primaryCharacter = graph.character_nodes[0];
  const secondaryCharacter = graph.character_nodes[1];
  const gazeEdge = graph.gaze_edges[0];

  const depthLayers = {
    foreground: spatialScene?.foreground_layout.element_ids ?? graph.prop_nodes.filter((p) => p.depth_layer === 'foreground').map((p) => p.prop_id),
    midground: spatialScene?.midground_layout.element_ids ?? graph.character_nodes.map((c) => c.character_id),
    background: spatialScene?.background_layout.element_ids ?? graph.prop_nodes.filter((p) => p.depth_layer === 'background').map((p) => p.prop_id),
  };

  const imagePrompt = [
    serialized.scenario_field,
    `Camera ${cameraDistance} ${cameraHeightToAngle(camera?.camera_height ?? 'eye_level')}.`,
    `Blocking preserves spatial graph ${graph.graph_id}.`,
  ].join(' ');

  return {
    version: 'v1',
    artStyle,
    timeSetting,
    scenario: serialized.scenario_field,
    character: serialized.character_field,
    payload_id: `${graph.movie_id}_payload_${String(sceneOrder).padStart(4, '0')}`,
    storyboard_id: storyboardId,
    scene_order: sceneOrder,
    image_prompt_pack_id: `${graph.movie_id}_prompt_pack_${String(sceneOrder).padStart(4, '0')}`,
    acting_camera_id: `${graph.movie_id}_acting_cam_${String(sceneOrder).padStart(4, '0')}`,
    image_prompt: imagePrompt,
    negative_prompt: 'text, watermark, logo, blurry, deformed hands, extra limbs, wrong character identity',
    acting_intent: 'preserve_movie_blocking_geometry',
    body_action: graph.interaction_edges[0]?.interaction_type?.replace(/_/g, ' ') ?? 'scene blocking hold',
    gaze_direction: gazeEdge
      ? `toward ${secondaryCharacter?.character_id ?? 'scene focal point'}`
      : 'toward scene partner',
    hand_action: 'natural relaxed hands',
    posture_variation: `${primaryCharacter?.depth_layer ?? 'midground'} depth placement`,
    camera_angle: cameraHeightToAngle(camera?.camera_height ?? 'eye_level'),
    camera_distance: cameraDistance,
    subject_blocking: `primary ${primaryCharacter?.character_id ?? 'character'} with supporting ${secondaryCharacter?.character_id ?? 'character'} in preserved movie layout`,
    environment_interaction: graph.environment_nodes[0]?.environment_type?.replace(/_/g, ' ') ?? 'scene environment anchor',
    location_variation: graph.environment_nodes[0]?.scene_category?.replace(/_/g, ' ') ?? 'general scene',
    character_continuity_anchors: graph.character_nodes.map(
      (node) => `character:${resolveCharacterId(node.character_id)}`
    ),
    location_continuity_anchors: [
      `location:${graph.environment_nodes[0]?.scene_category ?? 'general_scene'}`,
      `environment:${graph.environment_nodes[0]?.environment_type ?? 'scene_environment'}`,
    ],
    world_continuity_anchors: [`world:${WORLD_CONTINUITY_WORLD_ID}`, 'world-identity:GONEGI_MEDITERRANEAN'],
    spatial_context: {
      scene_id: graph.scene_id,
      camera_position: serialized.spatial_blocking.camera_position,
      camera_target: serialized.spatial_blocking.camera_target,
      character_positions: serialized.spatial_blocking.character_positions.map((entry) => ({
        character_id: entry.character_id,
        position: entry.position,
      })),
      depth_layers: depthLayers,
    },
  };
}

function buildScenePackage(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  packageOutputPath: string,
  root: string
): MasterScenarioScenePackage {
  const timeSettingId = resolveLockedTimeSettingId(graph);
  const artStyle = copySourceOfTruthArtStyle(root);
  const timeSetting = copySourceOfTruthTimeSettingPrompt(timeSettingId, root);
  const serialized = buildSerializedScenario(graph, spatialScene, root);
  const characterIds = graph.character_nodes.map((node) => resolveLockedCharacterId(node.character_id));
  const masterScenario = buildMasterScenario(graph, spatialScene, serialized, artStyle, timeSetting);

  return {
    package_id: `${graph.movie_id}_master_scenario_${graph.scene_id}`,
    movie_id: graph.movie_id,
    scene_id: graph.scene_id,
    art_style_ref: SOURCE_OF_TRUTH_ARTSTYLE_REF,
    time_setting_ref: sourceOfTruthTimeSettingPromptRef(timeSettingId),
    character_profile_refs: characterIds.map((id) => `${SOURCE_OF_TRUTH_CHARACTER_PROMPT_REF}=${id}`),
    serialized_scenario_ref: `${packageOutputPath}#scene_id=${graph.scene_id}`,
    master_scenario: masterScenario,
    generation_ready: true,
  };
}

export function buildMovieMasterScenarioPackageDataset(
  graphDataset: MovieSpatialGraphDataset,
  engineDataset: MovieSpatialEngineDataset,
  root: string
): MovieMasterScenarioPackageDataset {
  const packageOutputPath = refForMovie(MASTER_SCENARIO_PACKAGE_OUTPUTS, graphDataset.movie_id);
  const spatialSceneById = new Map(engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene]));

  const scenePackages = graphDataset.spatial_graphs.map((graph) =>
    buildScenePackage(
      graph,
      spatialSceneById.get(graph.scene_id) ?? null,
      packageOutputPath,
      root
    )
  );

  return {
    package_dataset_id: `${graphDataset.movie_id}-master-scenario-package-v1`,
    phase: MOVIE_MASTER_SCENARIO_PACKAGE_PHASE,
    system_id: MOVIE_MASTER_SCENARIO_PACKAGE_SYSTEM_ID,
    movie_id: graphDataset.movie_id,
    source_spatial_graph_ref: refForMovie(SPATIAL_GRAPH_OUTPUTS, graphDataset.movie_id),
    generated_at: new Date().toISOString(),
    scene_package_count: scenePackages.length,
    scene_packages: scenePackages,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieMasterScenarioPackageDatasets(root: string): MovieMasterScenarioPackageDataset[] {
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  return graphDatasets.map((graphDataset) => {
    const engineDataset =
      engineDatasets.find((entry) => entry.movie_id === graphDataset.movie_id) ??
      readJson<MovieSpatialEngineDataset>(
        root,
        refForMovie(SPATIAL_ENGINE_OUTPUTS, graphDataset.movie_id)
      );
    return buildMovieMasterScenarioPackageDataset(graphDataset, engineDataset, root);
  });
}

export function writeMovieMasterScenarioPackages(projectRoot?: string): MovieMasterScenarioPackageDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieMasterScenarioPackageDatasets(root);

  for (const spec of MASTER_SCENARIO_PACKAGE_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieMasterScenarioPackageDataset(
  root: string,
  movieId: string
): MovieMasterScenarioPackageDataset | null {
  const spec = MASTER_SCENARIO_PACKAGE_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieMasterScenarioPackageDataset;
}

export function loadAllMovieMasterScenarioPackageDatasets(root: string): MovieMasterScenarioPackageDataset[] {
  return MASTER_SCENARIO_PACKAGE_OUTPUTS.map((spec) =>
    loadMovieMasterScenarioPackageDataset(root, spec.movie_id)
  ).filter((dataset): dataset is MovieMasterScenarioPackageDataset => dataset !== null);
}

export { REQUIRED_IMAGE_APP_PAYLOAD_FIELDS, SAFE_CREATE_POLICY };
