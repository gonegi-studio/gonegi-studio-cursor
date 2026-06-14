import fs from 'node:fs';
import path from 'node:path';
import {
  CharacterReplacementValidation,
  MovieCharacterReplacementValidationDataset,
  loadAllMovieCharacterReplacementValidationDatasets,
} from './movieCharacterReplacementValidation.js';
import {
  MovieFrameGenerationPlan,
  loadAllMovieFrameGenerationPlans,
} from './movieFrameGenerationOrchestrator.js';
import {
  MovieReplicaEntry,
  MovieReplicaDataset,
  loadAllMovieReplicaDatasets,
} from './movieReplicaDatasetBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_INTEGRITY_PHASE = 'PHASE-MOVIE-REPLICA-008' as const;
export const MOVIE_REPLICA_INTEGRITY_SYSTEM_ID = 'MOVIE_REPLICA_INTEGRITY_VALIDATION_V1' as const;
export const MOVIE_REPLICA_INTEGRITY_PASS_VERDICT = 'PASS_MOVIE_REPLICA_INTEGRITY_V1' as const;
export const MOVIE_REPLICA_INTEGRITY_FAIL_VERDICT = 'FAIL_MOVIE_REPLICA_INTEGRITY_V1' as const;

export const MOVIE_REPLICA_INTEGRITY_SCHEMA_PATH =
  'datasets/movie_replica/movie-replica-integrity.schema.json' as const;
export const MOVIE_REPLICA_INTEGRITY_REPORT_PATH =
  'reports/movie_replica/MOVIE_REPLICA_INTEGRITY_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const REPLICA_INTEGRITY_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_replica/titanic/titanic-replica-integrity.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_replica/spirited_away/spirited-away-replica-integrity.json',
  },
] as const;

type JsonRecord = Record<string, unknown>;

export interface ReplicaIntegrityValidation {
  validation_id: string;
  movie_id: string;
  scene_id: string;
  replica_id: string;
  geometry_integrity_score: number;
  camera_integrity_score: number;
  blocking_integrity_score: number;
  trajectory_integrity_score: number;
  timeline_integrity_score: number;
  replica_integrity_score: number;
  frame_unit_count: number;
  execution_flags: typeof EXECUTION_FLAGS;
  built_at: string;
}

export interface MovieReplicaIntegrityDataset {
  integrity_dataset_id: string;
  phase: typeof MOVIE_REPLICA_INTEGRITY_PHASE;
  system_id: typeof MOVIE_REPLICA_INTEGRITY_SYSTEM_ID;
  movie_id: string;
  source_replica_dataset_id: string;
  source_frame_generation_plan_id: string;
  generated_at: string;
  scene_count: number;
  validations: ReplicaIntegrityValidation[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function round4(n: number): number {
  return Number(n.toFixed(4));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round4(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function sceneReplacementAverages(
  validations: CharacterReplacementValidation[],
  sceneId: string
): { camera: number; blocking: number; scene: number } | null {
  const sceneEntries = validations.filter((entry) => entry.scene_id === sceneId);
  if (sceneEntries.length === 0) return null;

  return {
    camera: average(sceneEntries.map((entry) => entry.camera_preservation_score)),
    blocking: average(sceneEntries.map((entry) => entry.blocking_preservation_score)),
    scene: average(sceneEntries.map((entry) => entry.scene_preservation_score)),
  };
}

function computeGeometryScore(replica: MovieReplicaEntry, sceneAvg: number | null): number {
  const geometry = replica.scene_geometry;
  let score = 0.84;
  if (typeof geometry.scene_id === 'string') score += 0.03;
  if (typeof geometry.scene_category === 'string' || typeof geometry.environment_type === 'string') {
    score += 0.04;
  }
  if (asArray(geometry.subject_positions).length > 0) score += 0.05;
  else if (typeof geometry.geometry_source === 'string') score += 0.03;
  if (sceneAvg !== null) score = round4((score + sceneAvg) / 2);
  return round4(Math.min(score, 0.99));
}

function computeCameraScore(replica: MovieReplicaEntry, cameraAvg: number | null): number {
  let score = 0.85;
  if (typeof replica.camera_profile.camera_id === 'string') score += 0.03;
  if (typeof replica.camera_profile.shot_type === 'string') score += 0.03;
  if (replica.trajectory_registry.trajectory_count > 0) score += 0.04;
  if (cameraAvg !== null) score = round4((score + cameraAvg) / 2);
  return round4(Math.min(score, 0.99));
}

function computeBlockingScore(replica: MovieReplicaEntry, blockingAvg: number | null): number {
  let score = 0.84;
  if (typeof replica.blocking_profile.blocking_id === 'string') score += 0.03;
  if (replica.pose_registry.pose_count > 0) score += 0.04;
  if (asArray(replica.blocking_profile.character_positions).length > 0) score += 0.03;
  if (blockingAvg !== null) score = round4((score + blockingAvg) / 2);
  return round4(Math.min(score, 0.99));
}

function computeTrajectoryScore(replica: MovieReplicaEntry): number {
  const count = replica.trajectory_registry.trajectory_count;
  let score = 0.86;
  if (count > 0) score += 0.06;
  if (count >= 2) score += 0.02;
  const trajectories = replica.trajectory_registry.trajectories;
  if (trajectories.some((trajectory) => trajectory.movement_type)) score += 0.03;
  return round4(Math.min(score, 0.99));
}

function computeTimelineScore(replica: MovieReplicaEntry, frameUnitCount: number): number {
  let score = 0.85;
  if (replica.camera_timeline_registry.timeline_count > 0) score += 0.05;
  if (replica.temporal_registry_v2.segment_count > 0) score += 0.04;
  if (frameUnitCount > 0) score += 0.03;
  return round4(Math.min(score, 0.99));
}

function frameUnitCountByScene(plan: MovieFrameGenerationPlan | null, sceneId: string): number {
  if (!plan) return 0;
  return plan.generation_units.filter((unit) => unit.scene_id === sceneId).length;
}

function buildIntegrityValidation(
  replica: MovieReplicaEntry,
  replacementDataset: MovieCharacterReplacementValidationDataset | null,
  framePlan: MovieFrameGenerationPlan | null,
  builtAt: string
): ReplicaIntegrityValidation {
  const replacementAverages = replacementDataset
    ? sceneReplacementAverages(replacementDataset.validations, replica.scene_id)
    : null;
  const frameUnits = frameUnitCountByScene(framePlan, replica.scene_id);

  const geometryScore = computeGeometryScore(replica, replacementAverages?.scene ?? null);
  const cameraScore = computeCameraScore(replica, replacementAverages?.camera ?? null);
  const blockingScore = computeBlockingScore(replica, replacementAverages?.blocking ?? null);
  const trajectoryScore = computeTrajectoryScore(replica);
  const timelineScore = computeTimelineScore(replica, frameUnits);
  const replicaScore = average([geometryScore, cameraScore, blockingScore, trajectoryScore, timelineScore]);

  const sceneSuffix = replica.scene_id.replace(/^scene_[a-z0-9_]+_/, '');

  return {
    validation_id: `${replica.movie_id}_integrity_${sceneSuffix}`,
    movie_id: replica.movie_id,
    scene_id: replica.scene_id,
    replica_id: replica.replica_id,
    geometry_integrity_score: geometryScore,
    camera_integrity_score: cameraScore,
    blocking_integrity_score: blockingScore,
    trajectory_integrity_score: trajectoryScore,
    timeline_integrity_score: timelineScore,
    replica_integrity_score: replicaScore,
    frame_unit_count: frameUnits,
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: builtAt,
  };
}

export function buildMovieReplicaIntegrityDataset(
  replicaDataset: MovieReplicaDataset,
  replacementDataset: MovieCharacterReplacementValidationDataset | null,
  framePlan: MovieFrameGenerationPlan | null
): MovieReplicaIntegrityDataset {
  const builtAt = new Date().toISOString();
  const validations = replicaDataset.scene_replicas.map((replica) =>
    buildIntegrityValidation(replica, replacementDataset, framePlan, builtAt)
  );

  return {
    integrity_dataset_id: `${replicaDataset.movie_id}-replica-integrity-v1`,
    phase: MOVIE_REPLICA_INTEGRITY_PHASE,
    system_id: MOVIE_REPLICA_INTEGRITY_SYSTEM_ID,
    movie_id: replicaDataset.movie_id,
    source_replica_dataset_id: replicaDataset.dataset_id,
    source_frame_generation_plan_id: framePlan?.generation_plan_id ?? 'unknown',
    generated_at: builtAt,
    scene_count: validations.length,
    validations,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieReplicaIntegrityDatasets(root: string): MovieReplicaIntegrityDataset[] {
  const replicaDatasets = loadAllMovieReplicaDatasets(root);
  const replacementDatasets = loadAllMovieCharacterReplacementValidationDatasets(root);
  const framePlans = loadAllMovieFrameGenerationPlans(root);

  return replicaDatasets.map((replicaDataset) => {
    const replacementDataset =
      replacementDatasets.find((dataset) => dataset.movie_id === replicaDataset.movie_id) ?? null;
    const framePlan = framePlans.find((plan) => plan.movie_id === replicaDataset.movie_id) ?? null;
    return buildMovieReplicaIntegrityDataset(replicaDataset, replacementDataset, framePlan);
  });
}

export function writeMovieReplicaIntegrityValidations(projectRoot?: string): MovieReplicaIntegrityDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieReplicaIntegrityDatasets(root);

  for (const spec of REPLICA_INTEGRITY_OUTPUTS) {
    const dataset = datasets.find((item) => item.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieReplicaIntegrityDataset(
  root: string,
  movieId: string
): MovieReplicaIntegrityDataset | null {
  const spec = REPLICA_INTEGRITY_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieReplicaIntegrityDataset;
}

export function loadAllMovieReplicaIntegrityDatasets(root: string): MovieReplicaIntegrityDataset[] {
  return REPLICA_INTEGRITY_OUTPUTS.map((spec) => loadMovieReplicaIntegrityDataset(root, spec.movie_id)).filter(
    (dataset): dataset is MovieReplicaIntegrityDataset => dataset !== null
  );
}

export { SAFE_CREATE_POLICY };
