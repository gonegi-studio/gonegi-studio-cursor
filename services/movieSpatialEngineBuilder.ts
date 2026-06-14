import fs from 'node:fs';
import path from 'node:path';
import {
  MovieReplicaEntry,
  MovieReplicaDataset,
} from './movieReplicaDatasetBuilder.js';
import {
  MovieReplicaProductionPackage,
  PRODUCTION_PACKAGE_OUTPUTS,
  loadAllMovieReplicaProductionPackages,
} from './movieReplicaProductionPackageBuilder.js';
import {
  MovieReplicaSceneGraphDataset,
  RuntimeSceneGraph,
} from './movieReplicaSceneGraphBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_SPATIAL_ENGINE_PHASE = 'PHASE-MOVIE-SPATIAL-001' as const;
export const MOVIE_SPATIAL_ENGINE_SYSTEM_ID = 'MOVIE_SPATIAL_ENGINE_V1' as const;
export const MOVIE_SPATIAL_ENGINE_PASS_VERDICT = 'PASS_MOVIE_SPATIAL_ENGINE_V1' as const;
export const MOVIE_SPATIAL_ENGINE_FAIL_VERDICT = 'FAIL_MOVIE_SPATIAL_ENGINE_V1' as const;

export const MOVIE_SPATIAL_ENGINE_SCHEMA_PATH =
  'datasets/movie_spatial/movie-spatial-engine.schema.json' as const;
export const MOVIE_SPATIAL_ENGINE_REPORT_PATH =
  'reports/movie_spatial/MOVIE_SPATIAL_ENGINE_REPORT.json' as const;
export const MOVIE_SPATIAL_DIR = 'datasets/movie_spatial' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const SPATIAL_ENGINE_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_spatial/titanic/titanic-movie-spatial-engine.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_spatial/spirited_away/spirited-away-movie-spatial-engine.json',
  },
] as const;

type JsonRecord = Record<string, unknown>;

export interface CharacterCoordinate {
  character_id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  depth_layer: string;
}

export interface PropCoordinate {
  prop_id: string;
  position: [number, number, number];
  depth_layer: string;
}

export interface DepthLayout {
  layer_id: string;
  depth_range: [number, number];
  element_ids: string[];
}

export interface GazeVector {
  character_id: string;
  origin: [number, number, number];
  direction: [number, number, number];
}

export interface SpatialDepthProfile {
  profile_id: string;
  near_plane: number;
  far_plane: number;
  layer_count: number;
}

export interface EnvironmentAnchor {
  anchor_id: string;
  anchor_type: string;
  position: [number, number, number];
  environment_type: string;
  scene_category: string;
}

export interface MovieSpatialSceneRecord {
  spatial_id: string;
  movie_id: string;
  scene_id: string;
  camera_position: [number, number, number];
  camera_rotation: [number, number, number];
  camera_distance: number;
  camera_height: string;
  camera_target: [number, number, number];
  character_coordinates: CharacterCoordinate[];
  prop_coordinates: PropCoordinate[];
  foreground_layout: DepthLayout;
  midground_layout: DepthLayout;
  background_layout: DepthLayout;
  gaze_vectors: GazeVector[];
  spatial_depth_profile: SpatialDepthProfile;
  environment_anchor: EnvironmentAnchor;
}

export interface MovieSpatialEngineDataset {
  dataset_id: string;
  phase: typeof MOVIE_SPATIAL_ENGINE_PHASE;
  system_id: typeof MOVIE_SPATIAL_ENGINE_SYSTEM_ID;
  movie_id: string;
  source_production_package_id: string;
  source_production_package_ref: string;
  generated_at: string;
  scene_spatial_count: number;
  spatial_scenes: MovieSpatialSceneRecord[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? (value as JsonRecord[]) : [];
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return 'unknown';
}

function round4(n: number): number {
  return Number(n.toFixed(4));
}

function asVec3(value: unknown, fallback: [number, number, number]): [number, number, number] {
  if (Array.isArray(value) && value.length >= 3) {
    return [round4(Number(value[0])), round4(Number(value[1])), round4(Number(value[2]))];
  }
  if (value !== null && typeof value === 'object') {
    const record = value as JsonRecord;
    if ('x' in record && 'y' in record && 'z' in record) {
      return [round4(Number(record.x)), round4(Number(record.y)), round4(Number(record.z))];
    }
  }
  return fallback;
}

function normalizeDirection(from: [number, number, number], to: [number, number, number]): [number, number, number] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  return [round4(dx / magnitude), round4(dy / magnitude), round4(dz / magnitude)];
}

function lookAtRotation(from: [number, number, number], to: [number, number, number]): [number, number, number] {
  const direction = normalizeDirection(from, to);
  const yaw = round4(Math.atan2(direction[0], direction[2]) * (180 / Math.PI));
  const pitch = round4(-Math.asin(Math.max(-1, Math.min(1, direction[1]))) * (180 / Math.PI));
  return [pitch, yaw, 0];
}

function shotTypeToDistance(shotType: string): number {
  const normalized = shotType.toLowerCase();
  if (normalized.includes('wide') || normalized.includes('establishing')) return 5;
  if (normalized.includes('close') || normalized.includes('insert')) return 1.5;
  if (normalized.includes('medium')) return 3;
  return 2.5;
}

function sceneIndexFromId(sceneId: string): number {
  const match = sceneId.match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 1;
}

function deriveCameraPosition(
  entry: MovieReplicaEntry,
  sceneGraph: RuntimeSceneGraph | null
): [number, number, number] {
  const geometry = entry.scene_geometry as JsonRecord;
  if (geometry.camera_position) {
    return asVec3(geometry.camera_position, [0.5, 0.35, 3]);
  }

  const cameraNode = sceneGraph?.camera_nodes?.[0] as JsonRecord | undefined;
  if (cameraNode?.start_position) {
    return asVec3(cameraNode.start_position, [0.5, 0.35, 3]);
  }

  const trajectory = entry.trajectory_registry.trajectories[0] as JsonRecord | undefined;
  if (trajectory?.start_position) {
    return asVec3(trajectory.start_position, [0.5, 0.35, 3]);
  }

  const index = sceneIndexFromId(entry.scene_id);
  return [round4(0.45 + (index % 10) * 0.01), 0.35, round4(2.5 + (index % 5) * 0.1)];
}

function deriveCharacterCoordinates(
  entry: MovieReplicaEntry,
  sceneGraph: RuntimeSceneGraph | null,
  cameraPosition: [number, number, number]
): CharacterCoordinate[] {
  const geometry = entry.scene_geometry as JsonRecord;
  const subjectPositions = asArray(geometry.subject_positions);
  const characterNodes = sceneGraph?.character_nodes ?? [];
  const poses = entry.pose_registry.poses as JsonRecord[];

  const characterIds =
    characterNodes.length > 0
      ? characterNodes.map((node) => String((node as JsonRecord).character_id ?? ''))
      : poses.length > 0
        ? [...new Set(poses.map((pose) => String(pose.character_id ?? '')).filter(Boolean))]
        : ['CHAR-gonagi', 'CHAR-dana'];

  return characterIds.filter(Boolean).map((characterId, index) => {
    const node = characterNodes.find((item) => String((item as JsonRecord).character_id) === characterId) as
      | JsonRecord
      | undefined;
    const placement = subjectPositions.find((item) => String(item.subject_id ?? item.character_id) === characterId);
    const pose = poses.find((item) => String(item.character_id) === characterId);

    const defaultX = round4(0.42 + index * 0.16);
    const defaultY = round4(0.48 + (sceneIndexFromId(entry.scene_id) % 7) * 0.005);
    const defaultZ = round4(1.6 + index * 0.08);
    const position = asVec3(
      placement?.position ?? node?.position,
      [defaultX, defaultY, defaultZ]
    );

    const headRotation = pose?.head_rotation ?? pose?.torso_rotation;
    const rotation = asVec3(headRotation, lookAtRotation(position, cameraPosition));

    return {
      character_id: characterId,
      position,
      rotation,
      depth_layer: firstString(placement?.depth_layer, node?.depth_layer, index === 0 ? 'midground' : 'midground'),
    };
  });
}

function derivePropCoordinates(
  entry: MovieReplicaEntry,
  sceneGraph: RuntimeSceneGraph | null
): PropCoordinate[] {
  const geometry = entry.scene_geometry as JsonRecord;
  const propPositions = asArray(geometry.prop_positions);
  const propNodes = sceneGraph?.prop_nodes ?? [];

  if (propPositions.length > 0) {
    return propPositions.map((prop, index) => ({
      prop_id: firstString(prop.prop_id, `prop_${index + 1}`),
      position: asVec3(prop.position, [round4(0.2 + index * 0.1), 0.55, 1.2]),
      depth_layer: firstString(prop.depth_layer, 'foreground'),
    }));
  }

  if (propNodes.length > 0) {
    return propNodes.map((prop, index) => {
      const record = prop as JsonRecord;
      return {
        prop_id: firstString(record.prop_id, `prop_${index + 1}`),
        position: asVec3(record.position, [round4(0.25 + index * 0.12), 0.52, 1.15]),
        depth_layer: firstString(record.depth_layer, 'foreground'),
      };
    });
  }

  const markers = asArray(geometry.structure_markers);
  if (markers.length > 0) {
    return markers.slice(0, 3).map((marker, index) => ({
      prop_id: `env_prop_${String(marker)}`,
      position: [round4(0.15 + index * 0.25), round4(0.5 + index * 0.03), round4(2.2 + index * 0.15)] as [
        number,
        number,
        number,
      ],
      depth_layer: index === 0 ? 'foreground' : 'background',
    }));
  }

  return [
    {
      prop_id: `env_anchor_${entry.replica_id}`,
      position: [0.5, 0.5, 2.8] as [number, number, number],
      depth_layer: 'background',
    },
  ];
}

function buildDepthLayouts(
  characters: CharacterCoordinate[],
  props: PropCoordinate[]
): { foreground: DepthLayout; midground: DepthLayout; background: DepthLayout } {
  const foregroundIds = [
    ...props.filter((prop) => prop.depth_layer === 'foreground').map((prop) => prop.prop_id),
  ];
  const midgroundIds = characters.map((character) => character.character_id);
  const backgroundIds = [
    ...props.filter((prop) => prop.depth_layer === 'background').map((prop) => prop.prop_id),
  ];

  return {
    foreground: {
      layer_id: 'foreground',
      depth_range: [0, 0.35],
      element_ids: foregroundIds,
    },
    midground: {
      layer_id: 'midground',
      depth_range: [0.35, 0.7],
      element_ids: midgroundIds,
    },
    background: {
      layer_id: 'background',
      depth_range: [0.7, 1],
      element_ids: backgroundIds,
    },
  };
}

function deriveGazeVectors(
  characters: CharacterCoordinate[],
  cameraTarget: [number, number, number]
): GazeVector[] {
  return characters.map((character, index) => {
    const partner = characters[index === 0 ? 1 : 0];
    const target = partner?.position ?? cameraTarget;
    return {
      character_id: character.character_id,
      origin: character.position,
      direction: normalizeDirection(character.position, target),
    };
  });
}

function deriveSpatialDepthProfile(sceneId: string, layouts: ReturnType<typeof buildDepthLayouts>): SpatialDepthProfile {
  const index = sceneIndexFromId(sceneId);
  return {
    profile_id: `depth_profile_${sceneId}`,
    near_plane: round4(0.5 + (index % 3) * 0.05),
    far_plane: round4(8 + (index % 4) * 0.25),
    layer_count: [layouts.foreground, layouts.midground, layouts.background].filter(
      (layout) => layout.element_ids.length > 0
    ).length,
  };
}

function deriveEnvironmentAnchor(entry: MovieReplicaEntry, sceneGraph: RuntimeSceneGraph | null): EnvironmentAnchor {
  const geometry = entry.scene_geometry as JsonRecord;
  const envNode = (sceneGraph?.environment_nodes?.[0] ?? {}) as JsonRecord;
  const anchor = entry.semantic_anchor as JsonRecord;

  return {
    anchor_id: firstString(anchor.anchor_id, anchor.semantic_anchor_id, `env_${entry.scene_id}`),
    anchor_type: 'environment_semantic_anchor',
    position: [0.5, 0.5, 3.5] as [number, number, number],
    environment_type: firstString(envNode.environment_type, geometry.environment_type, 'scene_environment'),
    scene_category: firstString(envNode.scene_category, geometry.scene_category, 'general_scene'),
  };
}

function buildSpatialScene(
  entry: MovieReplicaEntry,
  sceneGraph: RuntimeSceneGraph | null
): MovieSpatialSceneRecord {
  const cameraPosition = deriveCameraPosition(entry, sceneGraph);
  const characterCoordinates = deriveCharacterCoordinates(entry, sceneGraph, cameraPosition);
  const primaryTarget = characterCoordinates[0]?.position ?? ([0.5, 0.5, 1.6] as [number, number, number]);
  const cameraProfile = entry.camera_profile as JsonRecord;
  const shotType = firstString(cameraProfile.shot_type, 'medium_shot');
  const propCoordinates = derivePropCoordinates(entry, sceneGraph);
  const layouts = buildDepthLayouts(characterCoordinates, propCoordinates);

  return {
    spatial_id: `${entry.movie_id}_spatial_${entry.scene_id}`,
    movie_id: entry.movie_id,
    scene_id: entry.scene_id,
    camera_position: cameraPosition,
    camera_rotation: lookAtRotation(cameraPosition, primaryTarget),
    camera_distance: round4(
      shotTypeToDistance(shotType) ||
        Math.sqrt(
          (cameraPosition[0] - primaryTarget[0]) ** 2 +
            (cameraPosition[1] - primaryTarget[1]) ** 2 +
            (cameraPosition[2] - primaryTarget[2]) ** 2
        )
    ),
    camera_height: firstString(cameraProfile.camera_height, 'eye_level'),
    camera_target: primaryTarget,
    character_coordinates: characterCoordinates,
    prop_coordinates: propCoordinates,
    foreground_layout: layouts.foreground,
    midground_layout: layouts.midground,
    background_layout: layouts.background,
    gaze_vectors: deriveGazeVectors(characterCoordinates, primaryTarget),
    spatial_depth_profile: deriveSpatialDepthProfile(entry.scene_id, layouts),
    environment_anchor: deriveEnvironmentAnchor(entry, sceneGraph),
  };
}

export function buildMovieSpatialEngineDataset(
  productionPackage: MovieReplicaProductionPackage,
  replicaDataset: MovieReplicaDataset,
  sceneGraphDataset: MovieReplicaSceneGraphDataset
): MovieSpatialEngineDataset {
  const sceneGraphByScene = new Map(
    sceneGraphDataset.scene_graphs.map((graph) => [graph.scene_id, graph])
  );

  const spatialScenes = replicaDataset.scene_replicas.map((entry) =>
    buildSpatialScene(entry, sceneGraphByScene.get(entry.scene_id) ?? null)
  );

  return {
    dataset_id: `${productionPackage.movie_id}-movie-spatial-engine-v1`,
    phase: MOVIE_SPATIAL_ENGINE_PHASE,
    system_id: MOVIE_SPATIAL_ENGINE_SYSTEM_ID,
    movie_id: productionPackage.movie_id,
    source_production_package_id: productionPackage.package_id,
    source_production_package_ref: refForMovie(PRODUCTION_PACKAGE_OUTPUTS, productionPackage.movie_id),
    generated_at: new Date().toISOString(),
    scene_spatial_count: spatialScenes.length,
    spatial_scenes: spatialScenes,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

function refForMovie<T extends { movie_id: string; output_path: string }>(
  specs: readonly T[],
  movieId: string
): string {
  const spec = specs.find((entry) => entry.movie_id === movieId);
  if (!spec) throw new Error(`Missing ref spec for movie_id=${movieId}`);
  return spec.output_path;
}

export function buildAllMovieSpatialEngineDatasets(root: string): MovieSpatialEngineDataset[] {
  const productionPackages = loadAllMovieReplicaProductionPackages(root);

  return productionPackages.map((productionPackage) => {
    const replicaDataset = readJson<MovieReplicaDataset>(root, productionPackage.replica_dataset_ref);
    const sceneGraphDataset = readJson<MovieReplicaSceneGraphDataset>(root, productionPackage.scene_graph_ref);
    return buildMovieSpatialEngineDataset(productionPackage, replicaDataset, sceneGraphDataset);
  });
}

export function writeMovieSpatialEngineDatasets(projectRoot?: string): MovieSpatialEngineDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieSpatialEngineDatasets(root);

  for (const spec of SPATIAL_ENGINE_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieSpatialEngineDataset(root: string, movieId: string): MovieSpatialEngineDataset | null {
  const spec = SPATIAL_ENGINE_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieSpatialEngineDataset;
}

export function loadAllMovieSpatialEngineDatasets(root: string): MovieSpatialEngineDataset[] {
  return SPATIAL_ENGINE_OUTPUTS.map((spec) => loadMovieSpatialEngineDataset(root, spec.movie_id)).filter(
    (dataset): dataset is MovieSpatialEngineDataset => dataset !== null
  );
}

export { SAFE_CREATE_POLICY };
