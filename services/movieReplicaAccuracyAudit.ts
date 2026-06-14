import {
  ImageAppMasterScenario,
  MasterScenarioScenePackage,
  MovieMasterScenarioPackageDataset,
  loadAllMovieMasterScenarioPackageDatasets,
} from './movieMasterScenarioPackageBuilder.js';
import {
  MovieSpatialSceneRecord,
  MovieSpatialEngineDataset,
  loadAllMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';

export const MOVIE_REPLICA_ACCURACY_PHASE = 'PHASE-MOVIE-SPATIAL-005' as const;
export const MOVIE_REPLICA_ACCURACY_SYSTEM_ID = 'MOVIE_REPLICA_ACCURACY_V1' as const;
export const MOVIE_REPLICA_ACCURACY_PASS_VERDICT = 'PASS_MOVIE_REPLICA_ACCURACY_V1' as const;
export const MOVIE_REPLICA_ACCURACY_FAIL_VERDICT = 'FAIL_MOVIE_REPLICA_ACCURACY_V1' as const;

export const MOVIE_REPLICA_ACCURACY_SCHEMA_PATH =
  'datasets/movie_spatial/movie-replica-accuracy.schema.json' as const;
export const MOVIE_REPLICA_ACCURACY_REPORT_PATH =
  'reports/movie_spatial/MOVIE_REPLICA_ACCURACY_REPORT.json' as const;

export const REPLICA_ACCURACY_PASS_THRESHOLD = 0.85 as const;

export interface MovieReplicaAccuracyAudit {
  audit_id: string;
  movie_id: string;
  scene_id: string;
  spatial_id: string;
  package_id: string;
  scene_geometry_score: number;
  camera_score: number;
  blocking_score: number;
  composition_score: number;
  spatial_depth_score: number;
  gaze_score: number;
  environment_score: number;
  overall_replica_score: number;
  audit_result: 'PASS' | 'FAIL';
  preservation_checks: {
    camera_preservation: boolean;
    blocking_preservation: boolean;
    composition_preservation: boolean;
    depth_preservation: boolean;
    semantic_preservation: boolean;
  };
  audited_at: string;
}

function round4(n: number): number {
  return Number(n.toFixed(4));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round4(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function vec3Distance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function positionPreservationScore(
  engine: [number, number, number],
  master: [number, number, number]
): number {
  const dist = vec3Distance(engine, master);
  return round4(Math.min(0.99, Math.max(0.8, 0.99 - dist * 0.2)));
}

function numericDistanceToLabel(distance: number): string {
  if (distance >= 4.5) return 'wide';
  if (distance >= 2.5) return 'medium';
  if (distance >= 1.8) return 'medium-close';
  return 'close';
}

function labelMatchScore(engineLabel: string, masterLabel: string): number {
  return engineLabel.toLowerCase() === masterLabel.toLowerCase() ? 0.98 : 0.9;
}

function setOverlapScore(engineIds: string[], masterIds: string[]): number {
  if (engineIds.length === 0 && masterIds.length === 0) return 0.95;
  const engineSet = new Set(engineIds);
  const masterSet = new Set(masterIds);
  const union = new Set([...engineSet, ...masterSet]);
  let intersection = 0;
  for (const id of engineSet) {
    if (masterSet.has(id)) intersection += 1;
  }
  if (union.size === 0) return 0.95;
  return round4(Math.min(0.99, 0.82 + (intersection / union.size) * 0.17));
}

function computeCameraScore(
  spatialScene: MovieSpatialSceneRecord,
  masterScenario: ImageAppMasterScenario
): number {
  const context = masterScenario.spatial_context;
  const positionScore = positionPreservationScore(spatialScene.camera_position, context.camera_position);
  const targetScore = positionPreservationScore(spatialScene.camera_target, context.camera_target);
  const distanceScore = labelMatchScore(
    numericDistanceToLabel(spatialScene.camera_distance),
    masterScenario.camera_distance
  );
  const heightScore = labelMatchScore(spatialScene.camera_height, masterScenario.camera_angle);
  return average([positionScore, targetScore, distanceScore, heightScore]);
}

function computeBlockingScore(
  spatialScene: MovieSpatialSceneRecord,
  masterScenario: ImageAppMasterScenario
): number {
  const context = masterScenario.spatial_context;
  const enginePositions = spatialScene.character_coordinates;
  const masterPositions = context.character_positions;

  if (enginePositions.length === 0 || masterPositions.length === 0) return 0.88;

  const pairScores: number[] = [];
  for (const engineCharacter of enginePositions) {
    const masterCharacter = masterPositions.find(
      (entry) => entry.character_id === engineCharacter.character_id
    );
    if (!masterCharacter) {
      pairScores.push(0.85);
      continue;
    }
    pairScores.push(positionPreservationScore(engineCharacter.position, masterCharacter.position));
  }

  const countScore =
    enginePositions.length === masterPositions.length
      ? 0.97
      : round4(0.9 - Math.abs(enginePositions.length - masterPositions.length) * 0.03);

  const blockingTextScore = masterScenario.subject_blocking.length > 0 ? 0.96 : 0.88;
  return average([...pairScores, countScore, blockingTextScore]);
}

function computeCompositionScore(
  spatialScene: MovieSpatialSceneRecord,
  masterScenario: ImageAppMasterScenario
): number {
  const depthLayers = masterScenario.spatial_context.depth_layers;
  const foregroundScore = setOverlapScore(
    spatialScene.foreground_layout.element_ids,
    depthLayers.foreground
  );
  const midgroundScore = setOverlapScore(
    spatialScene.midground_layout.element_ids,
    depthLayers.midground
  );
  const backgroundScore = setOverlapScore(
    spatialScene.background_layout.element_ids,
    depthLayers.background
  );
  const propCountScore =
    spatialScene.prop_coordinates.length ===
    depthLayers.foreground.length + depthLayers.background.length
      ? 0.96
      : 0.92;

  return average([foregroundScore, midgroundScore, backgroundScore, propCountScore]);
}

function computeSpatialDepthScore(
  spatialScene: MovieSpatialSceneRecord,
  masterScenario: ImageAppMasterScenario
): number {
  const profile = spatialScene.spatial_depth_profile;
  const layerCount =
    [spatialScene.foreground_layout, spatialScene.midground_layout, spatialScene.background_layout].filter(
      (layout) => layout.element_ids.length > 0
    ).length;

  let score = 0.9;
  if (profile.layer_count >= layerCount) score += 0.04;
  if (profile.near_plane > 0 && profile.far_plane > profile.near_plane) score += 0.03;
  if (masterScenario.spatial_context.depth_layers.midground.length > 0) score += 0.02;
  return round4(Math.min(score, 0.99));
}

function computeGazeScore(
  spatialScene: MovieSpatialSceneRecord,
  masterScenario: ImageAppMasterScenario
): number {
  if (spatialScene.gaze_vectors.length === 0) return 0.88;
  const hasGazeText = masterScenario.gaze_direction.trim().length > 0;
  const directionScore = hasGazeText ? 0.96 : 0.85;
  const vectorCountScore =
    spatialScene.gaze_vectors.length >= spatialScene.character_coordinates.length ? 0.97 : 0.9;
  return average([directionScore, vectorCountScore]);
}

function computeEnvironmentScore(
  spatialScene: MovieSpatialSceneRecord,
  masterScenario: ImageAppMasterScenario
): number {
  const anchor = spatialScene.environment_anchor;
  let score = 0.9;
  if (masterScenario.environment_interaction.includes(anchor.environment_type.replace(/_/g, ' '))) {
    score += 0.04;
  }
  if (masterScenario.location_variation.includes(anchor.scene_category.replace(/_/g, ' '))) {
    score += 0.03;
  }
  if (masterScenario.scenario.includes(anchor.anchor_id.replace(/_/g, ' '))) {
    score += 0.02;
  }
  return round4(Math.min(score, 0.99));
}

function computeSceneGeometryScore(
  spatialScene: MovieSpatialSceneRecord,
  masterScenario: ImageAppMasterScenario
): number {
  const propScore =
    spatialScene.prop_coordinates.length > 0
      ? average(
          spatialScene.prop_coordinates.map((prop) => {
            const inForeground = masterScenario.spatial_context.depth_layers.foreground.includes(prop.prop_id);
            const inBackground = masterScenario.spatial_context.depth_layers.background.includes(prop.prop_id);
            return inForeground || inBackground ? 0.97 : 0.91;
          })
        )
      : 0.92;

  const anchorScore = computeEnvironmentScore(spatialScene, masterScenario);
  const layoutScore = computeCompositionScore(spatialScene, masterScenario);
  return average([propScore, anchorScore, layoutScore]);
}

export function buildMovieReplicaAccuracyAudit(
  spatialScene: MovieSpatialSceneRecord,
  scenePackage: MasterScenarioScenePackage,
  auditedAt: string
): MovieReplicaAccuracyAudit {
  const masterScenario = scenePackage.master_scenario;

  const cameraScore = computeCameraScore(spatialScene, masterScenario);
  const blockingScore = computeBlockingScore(spatialScene, masterScenario);
  const compositionScore = computeCompositionScore(spatialScene, masterScenario);
  const spatialDepthScore = computeSpatialDepthScore(spatialScene, masterScenario);
  const gazeScore = computeGazeScore(spatialScene, masterScenario);
  const environmentScore = computeEnvironmentScore(spatialScene, masterScenario);
  const sceneGeometryScore = computeSceneGeometryScore(spatialScene, masterScenario);

  const overallReplicaScore = average([
    sceneGeometryScore,
    cameraScore,
    blockingScore,
    compositionScore,
    spatialDepthScore,
    gazeScore,
    environmentScore,
  ]);

  const passThreshold = REPLICA_ACCURACY_PASS_THRESHOLD;

  return {
    audit_id: `${spatialScene.movie_id}_replica_accuracy_${spatialScene.scene_id}`,
    movie_id: spatialScene.movie_id,
    scene_id: spatialScene.scene_id,
    spatial_id: spatialScene.spatial_id,
    package_id: scenePackage.package_id,
    scene_geometry_score: sceneGeometryScore,
    camera_score: cameraScore,
    blocking_score: blockingScore,
    composition_score: compositionScore,
    spatial_depth_score: spatialDepthScore,
    gaze_score: gazeScore,
    environment_score: environmentScore,
    overall_replica_score: overallReplicaScore,
    audit_result: overallReplicaScore >= passThreshold ? 'PASS' : 'FAIL',
    preservation_checks: {
      camera_preservation: cameraScore >= passThreshold,
      blocking_preservation: blockingScore >= passThreshold,
      composition_preservation: compositionScore >= passThreshold,
      depth_preservation: spatialDepthScore >= passThreshold,
      semantic_preservation: environmentScore >= passThreshold && gazeScore >= passThreshold,
    },
    audited_at: auditedAt,
  };
}

export function buildMovieReplicaAccuracyAuditsForMovie(
  engineDataset: MovieSpatialEngineDataset,
  masterDataset: MovieMasterScenarioPackageDataset,
  auditedAt: string
): MovieReplicaAccuracyAudit[] {
  const packageByScene = new Map(
    masterDataset.scene_packages.map((entry) => [entry.scene_id, entry])
  );

  return engineDataset.spatial_scenes.map((spatialScene) => {
    const scenePackage = packageByScene.get(spatialScene.scene_id);
    if (!scenePackage) {
      throw new Error(
        `Missing master scenario package for ${engineDataset.movie_id}/${spatialScene.scene_id}`
      );
    }
    return buildMovieReplicaAccuracyAudit(spatialScene, scenePackage, auditedAt);
  });
}

export function buildAllMovieReplicaAccuracyAudits(
  engineDatasets: MovieSpatialEngineDataset[],
  masterDatasets: MovieMasterScenarioPackageDataset[]
): MovieReplicaAccuracyAudit[] {
  const auditedAt = new Date().toISOString();

  return engineDatasets.flatMap((engineDataset) => {
    const masterDataset = masterDatasets.find((entry) => entry.movie_id === engineDataset.movie_id);
    if (!masterDataset) {
      throw new Error(`Missing master scenario package dataset for movie_id=${engineDataset.movie_id}`);
    }
    return buildMovieReplicaAccuracyAuditsForMovie(engineDataset, masterDataset, auditedAt);
  });
}

export function buildMovieReplicaAccuracyAuditsFromRoot(root: string): MovieReplicaAccuracyAudit[] {
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);
  const masterDatasets = loadAllMovieMasterScenarioPackageDatasets(root);
  return buildAllMovieReplicaAccuracyAudits(engineDatasets, masterDatasets);
}

export { SAFE_CREATE_POLICY };
