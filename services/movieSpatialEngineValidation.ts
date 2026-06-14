import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_REPLICA_MASTER_CERTIFICATION_PASS_VERDICT } from './movieReplicaMasterCertification.js';
import { writeMovieReplicaMasterCertificationReport } from './movieReplicaMasterCertificationValidation.js';
import {
  MOVIE_SPATIAL_DIR,
  MOVIE_SPATIAL_ENGINE_FAIL_VERDICT,
  MOVIE_SPATIAL_ENGINE_PASS_VERDICT,
  MOVIE_SPATIAL_ENGINE_PHASE,
  MOVIE_SPATIAL_ENGINE_REPORT_PATH,
  MOVIE_SPATIAL_ENGINE_SCHEMA_PATH,
  MOVIE_SPATIAL_ENGINE_SYSTEM_ID,
  MovieSpatialEngineDataset,
  MovieSpatialSceneRecord,
  SPATIAL_ENGINE_OUTPUTS,
  loadAllMovieSpatialEngineDatasets,
  writeMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_SPATIAL_ENGINE_VALIDATION_PHASE = 'PHASE-MOVIE-SPATIAL-ENGINE-VALIDATION-001' as const;
export const MOVIE_SPATIAL_ENGINE_VALIDATION_ID = 'MOVIE_SPATIAL_ENGINE_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

function isVec3(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((component) => typeof component === 'number' && Number.isFinite(component))
  );
}

export interface MovieSpatialEngineReport {
  report_id: string;
  phase: typeof MOVIE_SPATIAL_ENGINE_PHASE;
  validation_phase: typeof MOVIE_SPATIAL_ENGINE_VALIDATION_PHASE;
  system_id: typeof MOVIE_SPATIAL_ENGINE_SYSTEM_ID;
  validation_id: typeof MOVIE_SPATIAL_ENGINE_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  spatial_engine_created: boolean;
  camera_coordinates_present: boolean;
  character_coordinates_present: boolean;
  prop_coordinates_present: boolean;
  gaze_vectors_present: boolean;
  spatial_depth_present: boolean;
  status: string;
  upstream_master_certification_verdict: string;
  metrics: {
    movie_count: number;
    scene_count: number;
    camera_count: number;
    character_coordinate_count: number;
    prop_coordinate_count: number;
    gaze_vector_count: number;
    spatial_depth_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    dataset_id: string;
    scene_count: number;
    camera_count: number;
    character_coordinate_count: number;
    prop_coordinate_count: number;
    gaze_vector_count: number;
    spatial_depth_count: number;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function validateSpatialScene(scene: MovieSpatialSceneRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${scene.movie_id}/${scene.scene_id}`;

  if (!isVec3(scene.camera_position)) {
    issues.push({
      code: 'CAMERA_POSITION_MISSING',
      message: `${prefix}: camera_position must be a 3-component vector`,
      severity: 'error',
    });
  }

  if (!Array.isArray(scene.character_coordinates) || scene.character_coordinates.length === 0) {
    issues.push({
      code: 'CHARACTER_COORDINATES_MISSING',
      message: `${prefix}: character_coordinates must contain at least one entry`,
      severity: 'error',
    });
  } else {
    for (const character of scene.character_coordinates) {
      if (!isVec3(character.position)) {
        issues.push({
          code: 'CHARACTER_POSITION_INVALID',
          message: `${prefix}: character ${character.character_id} position invalid`,
          severity: 'error',
        });
      }
    }
  }

  if (!Array.isArray(scene.prop_coordinates)) {
    issues.push({
      code: 'PROP_COORDINATES_MISSING',
      message: `${prefix}: prop_coordinates must be an array`,
      severity: 'error',
    });
  } else {
    for (const prop of scene.prop_coordinates) {
      if (!isVec3(prop.position)) {
        issues.push({
          code: 'PROP_POSITION_INVALID',
          message: `${prefix}: prop ${prop.prop_id} position invalid`,
          severity: 'error',
        });
      }
    }
  }

  if (!Array.isArray(scene.gaze_vectors) || scene.gaze_vectors.length === 0) {
    issues.push({
      code: 'GAZE_VECTORS_MISSING',
      message: `${prefix}: gaze_vectors must contain at least one entry`,
      severity: 'error',
    });
  } else {
    for (const gaze of scene.gaze_vectors) {
      if (!isVec3(gaze.origin) || !isVec3(gaze.direction)) {
        issues.push({
          code: 'GAZE_VECTOR_INVALID',
          message: `${prefix}: gaze vector for ${gaze.character_id} invalid`,
          severity: 'error',
        });
      }
    }
  }

  if (
    !scene.spatial_depth_profile ||
    typeof scene.spatial_depth_profile.near_plane !== 'number' ||
    typeof scene.spatial_depth_profile.far_plane !== 'number' ||
    scene.spatial_depth_profile.layer_count < 1
  ) {
    issues.push({
      code: 'SPATIAL_DEPTH_MISSING',
      message: `${prefix}: spatial_depth_profile invalid`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieSpatialEngineDataset): {
  movie_id: string;
  dataset_id: string;
  scene_count: number;
  camera_count: number;
  character_coordinate_count: number;
  prop_coordinate_count: number;
  gaze_vector_count: number;
  spatial_depth_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (dataset.spatial_scenes.length === 0) {
    issues.push({
      code: 'NO_SPATIAL_SCENES',
      message: `${dataset.movie_id}: spatial_scenes is empty`,
      severity: 'error',
    });
  }

  for (const scene of dataset.spatial_scenes) {
    issues.push(...validateSpatialScene(scene));
  }

  return {
    movie_id: dataset.movie_id,
    dataset_id: dataset.dataset_id,
    scene_count: dataset.spatial_scenes.length,
    camera_count: dataset.spatial_scenes.filter((scene) => isVec3(scene.camera_position)).length,
    character_coordinate_count: dataset.spatial_scenes.reduce(
      (sum, scene) => sum + scene.character_coordinates.length,
      0
    ),
    prop_coordinate_count: dataset.spatial_scenes.reduce((sum, scene) => sum + scene.prop_coordinates.length, 0),
    gaze_vector_count: dataset.spatial_scenes.reduce((sum, scene) => sum + scene.gaze_vectors.length, 0),
    spatial_depth_count: dataset.spatial_scenes.filter(
      (scene) => scene.spatial_depth_profile && scene.spatial_depth_profile.layer_count >= 1
    ).length,
    issues,
  };
}

export function runMovieSpatialEngineValidation(
  root: string,
  datasets: MovieSpatialEngineDataset[],
  upstreamMasterCertificationVerdict: string
): MovieSpatialEngineReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_SPATIAL_DIR))) {
    issues.push({
      code: 'MISSING_SPATIAL_DIR',
      message: `${MOVIE_SPATIAL_DIR} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOVIE_SPATIAL_ENGINE_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_SPATIAL_ENGINE_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_DATASETS',
      message: 'No movie spatial engine datasets found',
      severity: 'error',
    });
  }

  if (upstreamMasterCertificationVerdict !== MOVIE_REPLICA_MASTER_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_MASTER_CERTIFICATION_NOT_PASS',
      message: `Upstream master certification verdict is ${upstreamMasterCertificationVerdict}`,
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    movie_count: datasets.length,
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    camera_count: summaries.reduce((sum, summary) => sum + summary.camera_count, 0),
    character_coordinate_count: summaries.reduce((sum, summary) => sum + summary.character_coordinate_count, 0),
    prop_coordinate_count: summaries.reduce((sum, summary) => sum + summary.prop_coordinate_count, 0),
    gaze_vector_count: summaries.reduce((sum, summary) => sum + summary.gaze_vector_count, 0),
    spatial_depth_count: summaries.reduce((sum, summary) => sum + summary.spatial_depth_count, 0),
  };

  const spatialEngineCreated = datasets.length > 0 && metrics.scene_count > 0;
  const cameraCoordinatesPresent = metrics.camera_count === metrics.scene_count && metrics.scene_count > 0;
  const characterCoordinatesPresent = metrics.character_coordinate_count >= metrics.scene_count;
  const propCoordinatesPresent = metrics.prop_coordinate_count >= metrics.scene_count;
  const gazeVectorsPresent = metrics.gaze_vector_count >= metrics.scene_count;
  const spatialDepthPresent = metrics.spatial_depth_count === metrics.scene_count && metrics.scene_count > 0;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    spatialEngineCreated &&
    cameraCoordinatesPresent &&
    characterCoordinatesPresent &&
    propCoordinatesPresent &&
    gazeVectorsPresent &&
    spatialDepthPresent;

  return {
    report_id: `movie_spatial_engine_report_${Date.now().toString(36)}`,
    phase: MOVIE_SPATIAL_ENGINE_PHASE,
    validation_phase: MOVIE_SPATIAL_ENGINE_VALIDATION_PHASE,
    system_id: MOVIE_SPATIAL_ENGINE_SYSTEM_ID,
    validation_id: MOVIE_SPATIAL_ENGINE_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? MOVIE_SPATIAL_ENGINE_PASS_VERDICT : MOVIE_SPATIAL_ENGINE_FAIL_VERDICT,
    validation_passed: validationPassed,
    spatial_engine_created: spatialEngineCreated,
    camera_coordinates_present: cameraCoordinatesPresent,
    character_coordinates_present: characterCoordinatesPresent,
    prop_coordinates_present: propCoordinatesPresent,
    gaze_vectors_present: gazeVectorsPresent,
    spatial_depth_present: spatialDepthPresent,
    status: validationPassed ? MOVIE_SPATIAL_ENGINE_PASS_VERDICT : MOVIE_SPATIAL_ENGINE_FAIL_VERDICT,
    upstream_master_certification_verdict: upstreamMasterCertificationVerdict,
    metrics,
    movie_summaries: summaries.map((summary) => ({
      movie_id: summary.movie_id,
      dataset_id: summary.dataset_id,
      scene_count: summary.scene_count,
      camera_count: summary.camera_count,
      character_coordinate_count: summary.character_coordinate_count,
      prop_coordinate_count: summary.prop_coordinate_count,
      gaze_vector_count: summary.gaze_vector_count,
      spatial_depth_count: summary.spatial_depth_count,
    })),
    issues,
  };
}

export function writeMovieSpatialEngineReport(projectRoot?: string): MovieSpatialEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieReplicaMasterCertificationReport(root);
  writeMovieSpatialEngineDatasets(root);
  const datasets = loadAllMovieSpatialEngineDatasets(root);
  const report = runMovieSpatialEngineValidation(root, datasets, upstreamReport.final_verdict);
  writeJson(root, MOVIE_SPATIAL_ENGINE_REPORT_PATH, report);
  return report;
}
