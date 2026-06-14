import fs from 'node:fs';
import path from 'node:path';
import { REQUIRED_IMAGE_APP_PAYLOAD_FIELDS } from './imageAppInputExport.js';
import {
  ImageAppMasterScenario,
  MasterScenarioScenePackage,
  MASTER_SCENARIO_PACKAGE_OUTPUTS,
  MovieMasterScenarioPackageDataset,
  loadAllMovieMasterScenarioPackageDatasets,
} from './movieMasterScenarioPackageBuilder.js';
import {
  MovieSpatialSceneRecord,
  loadAllMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import { LEGACY_MOVIE_SPATIAL_EXPORT_ROOT } from './generationOutputPaths.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_IMAGE_APP_EXPORT_PHASE = 'PHASE-MOVIE-SPATIAL-006' as const;
export const MOVIE_IMAGE_APP_EXPORT_SYSTEM_ID = 'MOVIE_IMAGE_APP_EXPORT_V1' as const;
export const MOVIE_IMAGE_APP_EXPORT_PASS_VERDICT = 'PASS_MOVIE_IMAGE_APP_EXPORT_V1' as const;
export const MOVIE_IMAGE_APP_EXPORT_FAIL_VERDICT = 'FAIL_MOVIE_IMAGE_APP_EXPORT_V1' as const;

export const MOVIE_IMAGE_APP_EXPORT_SCHEMA_PATH =
  'datasets/movie_spatial/movie-image-app-export.schema.json' as const;
export const MOVIE_IMAGE_APP_EXPORT_REPORT_PATH =
  'reports/movie_spatial/MOVIE_IMAGE_APP_EXPORT_REPORT.json' as const;
export const MOVIE_IMAGE_APP_EXPORT_DIR = LEGACY_MOVIE_SPATIAL_EXPORT_ROOT;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const IMAGE_APP_EXPORT_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: `${LEGACY_MOVIE_SPATIAL_EXPORT_ROOT}/titanic-image-app-export.json`,
  },
  {
    movie_id: 'spirited_away',
    output_path: `${LEGACY_MOVIE_SPATIAL_EXPORT_ROOT}/spirited-away-image-app-export.json`,
  },
] as const;

export interface ImageAppExportSpatialContext {
  scene_id: string;
  camera_position: [number, number, number];
  camera_target: [number, number, number];
  character_positions: Array<{ character_id: string; position: [number, number, number] }>;
  depth_layers: { foreground: string[]; midground: string[]; background: string[] };
  environment_anchor: {
    anchor_id: string;
    anchor_type: string;
    position: [number, number, number];
    environment_type: string;
    scene_category: string;
  };
}

export interface ImageAppExportCameraContext {
  camera_position: [number, number, number];
  camera_rotation: [number, number, number];
  camera_distance: number;
  camera_height: string;
  camera_target: [number, number, number];
  camera_angle: string;
  camera_distance_label: string;
  gaze_direction: string;
  gaze_vectors: Array<{ character_id: string; origin: [number, number, number]; direction: [number, number, number] }>;
}

export interface ImageAppExportBlockingContext {
  subject_blocking: string;
  body_action: string;
  hand_action: string;
  posture_variation: string;
  character_coordinates: Array<{
    character_id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    depth_layer: string;
  }>;
}

export interface ImageAppExportCompositionContext {
  foreground_layout: { layer_id: string; depth_range: [number, number]; element_ids: string[] };
  midground_layout: { layer_id: string; depth_range: [number, number]; element_ids: string[] };
  background_layout: { layer_id: string; depth_range: [number, number]; element_ids: string[] };
  spatial_depth_profile: {
    profile_id: string;
    near_plane: number;
    far_plane: number;
    layer_count: number;
  };
  prop_coordinates: Array<{ prop_id: string; position: [number, number, number]; depth_layer: string }>;
}

export interface ImageAppGenerationPayload {
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
  spatial_context: ImageAppExportSpatialContext;
  camera_context: ImageAppExportCameraContext;
  blocking_context: ImageAppExportBlockingContext;
  composition_context: ImageAppExportCompositionContext;
}

export interface MovieImageAppSceneExport {
  export_id: string;
  movie_id: string;
  scene_id: string;
  package_id: string;
  artStyle: string;
  timeSetting: string;
  character: string;
  scenario: string;
  spatial_context: ImageAppExportSpatialContext;
  camera_context: ImageAppExportCameraContext;
  blocking_context: ImageAppExportBlockingContext;
  composition_context: ImageAppExportCompositionContext;
  generation_payload: ImageAppGenerationPayload;
  generation_ready: boolean;
}

export interface MovieImageAppExportDataset {
  export_dataset_id: string;
  phase: typeof MOVIE_IMAGE_APP_EXPORT_PHASE;
  system_id: typeof MOVIE_IMAGE_APP_EXPORT_SYSTEM_ID;
  movie_id: string;
  source_master_scenario_ref: string;
  generated_at: string;
  scene_export_count: number;
  direct_generation_ready: boolean;
  scene_exports: MovieImageAppSceneExport[];
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

function buildSpatialContext(
  masterScenario: ImageAppMasterScenario,
  spatialScene: MovieSpatialSceneRecord | null
): ImageAppExportSpatialContext {
  return {
    scene_id: masterScenario.spatial_context.scene_id,
    camera_position: masterScenario.spatial_context.camera_position,
    camera_target: masterScenario.spatial_context.camera_target,
    character_positions: masterScenario.spatial_context.character_positions,
    depth_layers: masterScenario.spatial_context.depth_layers,
    environment_anchor: spatialScene?.environment_anchor ?? {
      anchor_id: masterScenario.location_variation,
      anchor_type: 'environment_semantic_anchor',
      position: [0.5, 0.5, 3.5] as [number, number, number],
      environment_type: masterScenario.environment_interaction,
      scene_category: masterScenario.location_variation,
    },
  };
}

function buildCameraContext(
  masterScenario: ImageAppMasterScenario,
  spatialScene: MovieSpatialSceneRecord | null
): ImageAppExportCameraContext {
  return {
    camera_position: spatialScene?.camera_position ?? masterScenario.spatial_context.camera_position,
    camera_rotation: spatialScene?.camera_rotation ?? [0, 0, 0],
    camera_distance: spatialScene?.camera_distance ?? 3,
    camera_height: spatialScene?.camera_height ?? 'eye_level',
    camera_target: spatialScene?.camera_target ?? masterScenario.spatial_context.camera_target,
    camera_angle: masterScenario.camera_angle,
    camera_distance_label: masterScenario.camera_distance,
    gaze_direction: masterScenario.gaze_direction,
    gaze_vectors:
      spatialScene?.gaze_vectors.map((gaze) => ({
        character_id: gaze.character_id,
        origin: gaze.origin,
        direction: gaze.direction,
      })) ?? [],
  };
}

function buildBlockingContext(
  masterScenario: ImageAppMasterScenario,
  spatialScene: MovieSpatialSceneRecord | null
): ImageAppExportBlockingContext {
  return {
    subject_blocking: masterScenario.subject_blocking,
    body_action: masterScenario.body_action,
    hand_action: masterScenario.hand_action,
    posture_variation: masterScenario.posture_variation,
    character_coordinates:
      spatialScene?.character_coordinates.map((entry) => ({
        character_id: entry.character_id,
        position: entry.position,
        rotation: entry.rotation,
        depth_layer: entry.depth_layer,
      })) ??
      masterScenario.spatial_context.character_positions.map((entry) => ({
        character_id: entry.character_id,
        position: entry.position,
        rotation: [0, 0, 0] as [number, number, number],
        depth_layer: 'midground',
      })),
  };
}

function buildCompositionContext(
  spatialScene: MovieSpatialSceneRecord | null,
  masterScenario: ImageAppMasterScenario
): ImageAppExportCompositionContext {
  const depthLayers = masterScenario.spatial_context.depth_layers;
  return {
    foreground_layout: spatialScene?.foreground_layout ?? {
      layer_id: 'foreground',
      depth_range: [0, 0.35] as [number, number],
      element_ids: depthLayers.foreground,
    },
    midground_layout: spatialScene?.midground_layout ?? {
      layer_id: 'midground',
      depth_range: [0.35, 0.7] as [number, number],
      element_ids: depthLayers.midground,
    },
    background_layout: spatialScene?.background_layout ?? {
      layer_id: 'background',
      depth_range: [0.7, 1] as [number, number],
      element_ids: depthLayers.background,
    },
    spatial_depth_profile: spatialScene?.spatial_depth_profile ?? {
      profile_id: `depth_profile_${masterScenario.spatial_context.scene_id}`,
      near_plane: 0.5,
      far_plane: 8,
      layer_count: 3,
    },
    prop_coordinates:
      spatialScene?.prop_coordinates.map((prop) => ({
        prop_id: prop.prop_id,
        position: prop.position,
        depth_layer: prop.depth_layer,
      })) ?? [],
  };
}

function buildGenerationPayload(
  masterScenario: ImageAppMasterScenario,
  spatialContext: ImageAppExportSpatialContext,
  cameraContext: ImageAppExportCameraContext,
  blockingContext: ImageAppExportBlockingContext,
  compositionContext: ImageAppExportCompositionContext
): ImageAppGenerationPayload {
  return {
    version: 'v1',
    artStyle: masterScenario.artStyle,
    timeSetting: masterScenario.timeSetting,
    scenario: masterScenario.scenario,
    character: masterScenario.character,
    payload_id: masterScenario.payload_id,
    storyboard_id: masterScenario.storyboard_id,
    scene_order: masterScenario.scene_order,
    image_prompt_pack_id: masterScenario.image_prompt_pack_id,
    acting_camera_id: masterScenario.acting_camera_id,
    image_prompt: masterScenario.image_prompt,
    negative_prompt: masterScenario.negative_prompt,
    acting_intent: masterScenario.acting_intent,
    body_action: masterScenario.body_action,
    gaze_direction: masterScenario.gaze_direction,
    hand_action: masterScenario.hand_action,
    posture_variation: masterScenario.posture_variation,
    camera_angle: masterScenario.camera_angle,
    camera_distance: masterScenario.camera_distance,
    subject_blocking: masterScenario.subject_blocking,
    environment_interaction: masterScenario.environment_interaction,
    location_variation: masterScenario.location_variation,
    character_continuity_anchors: masterScenario.character_continuity_anchors,
    location_continuity_anchors: masterScenario.location_continuity_anchors,
    world_continuity_anchors: masterScenario.world_continuity_anchors,
    spatial_context: spatialContext,
    camera_context: cameraContext,
    blocking_context: blockingContext,
    composition_context: compositionContext,
  };
}

export function buildMovieImageAppSceneExport(
  scenePackage: MasterScenarioScenePackage,
  spatialScene: MovieSpatialSceneRecord | null
): MovieImageAppSceneExport {
  const masterScenario = scenePackage.master_scenario;
  const spatialContext = buildSpatialContext(masterScenario, spatialScene);
  const cameraContext = buildCameraContext(masterScenario, spatialScene);
  const blockingContext = buildBlockingContext(masterScenario, spatialScene);
  const compositionContext = buildCompositionContext(spatialScene, masterScenario);
  const generationPayload = buildGenerationPayload(
    masterScenario,
    spatialContext,
    cameraContext,
    blockingContext,
    compositionContext
  );

  return {
    export_id: `${scenePackage.movie_id}_image_app_export_${scenePackage.scene_id}`,
    movie_id: scenePackage.movie_id,
    scene_id: scenePackage.scene_id,
    package_id: scenePackage.package_id,
    artStyle: masterScenario.artStyle,
    timeSetting: masterScenario.timeSetting,
    character: masterScenario.character,
    scenario: masterScenario.scenario,
    spatial_context: spatialContext,
    camera_context: cameraContext,
    blocking_context: blockingContext,
    composition_context: compositionContext,
    generation_payload: generationPayload,
    generation_ready: scenePackage.generation_ready,
  };
}

export function buildMovieImageAppExportDataset(
  masterDataset: MovieMasterScenarioPackageDataset,
  spatialScenes: MovieSpatialSceneRecord[]
): MovieImageAppExportDataset {
  const spatialSceneById = new Map(spatialScenes.map((scene) => [scene.scene_id, scene]));

  const sceneExports = masterDataset.scene_packages.map((scenePackage) =>
    buildMovieImageAppSceneExport(
      scenePackage,
      spatialSceneById.get(scenePackage.scene_id) ?? null
    )
  );

  const directGenerationReady =
    sceneExports.length > 0 && sceneExports.every((entry) => entry.generation_ready);

  return {
    export_dataset_id: `${masterDataset.movie_id}-image-app-export-v1`,
    phase: MOVIE_IMAGE_APP_EXPORT_PHASE,
    system_id: MOVIE_IMAGE_APP_EXPORT_SYSTEM_ID,
    movie_id: masterDataset.movie_id,
    source_master_scenario_ref: refForMovie(MASTER_SCENARIO_PACKAGE_OUTPUTS, masterDataset.movie_id),
    generated_at: new Date().toISOString(),
    scene_export_count: sceneExports.length,
    direct_generation_ready: directGenerationReady,
    scene_exports: sceneExports,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieImageAppExportDatasets(root: string): MovieImageAppExportDataset[] {
  const masterDatasets = loadAllMovieMasterScenarioPackageDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  return masterDatasets.map((masterDataset) => {
    const engineDataset = engineDatasets.find((entry) => entry.movie_id === masterDataset.movie_id);
    return buildMovieImageAppExportDataset(masterDataset, engineDataset?.spatial_scenes ?? []);
  });
}

export function writeMovieImageAppExports(projectRoot?: string): MovieImageAppExportDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieImageAppExportDatasets(root);

  for (const spec of IMAGE_APP_EXPORT_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieImageAppExportDataset(
  root: string,
  movieId: string
): MovieImageAppExportDataset | null {
  const spec = IMAGE_APP_EXPORT_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppExportDataset;
}

export function loadAllMovieImageAppExportDatasets(root: string): MovieImageAppExportDataset[] {
  return IMAGE_APP_EXPORT_OUTPUTS.map((spec) => loadMovieImageAppExportDataset(root, spec.movie_id)).filter(
    (dataset): dataset is MovieImageAppExportDataset => dataset !== null
  );
}

export { REQUIRED_IMAGE_APP_PAYLOAD_FIELDS, SAFE_CREATE_POLICY };
