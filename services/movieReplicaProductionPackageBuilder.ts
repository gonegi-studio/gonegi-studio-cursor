import fs from 'node:fs';
import path from 'node:path';
import { CHARACTER_REPLACEMENT_VALIDATION_OUTPUTS } from './movieCharacterReplacementValidation.js';
import { FRAME_GENERATION_OUTPUTS } from './movieFrameGenerationOrchestrator.js';
import { KEYFRAME_RECONSTRUCTION_OUTPUTS } from './movieKeyframeReconstructionBuilder.js';
import {
  MovieReplicaIntegrityDataset,
  REPLICA_INTEGRITY_OUTPUTS,
  loadAllMovieReplicaIntegrityDatasets,
} from './movieReplicaIntegrityValidation.js';
import { SCENE_GRAPH_OUTPUTS } from './movieReplicaSceneGraphBuilder.js';
import { TRAJECTORY_REPLAY_OUTPUTS } from './movieTrajectoryReplayBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_PRODUCTION_PACKAGE_PHASE = 'PHASE-MOVIE-REPLICA-009' as const;
export const MOVIE_REPLICA_PRODUCTION_PACKAGE_SYSTEM_ID = 'MOVIE_REPLICA_PRODUCTION_PACKAGE_V1' as const;
export const MOVIE_REPLICA_PRODUCTION_PACKAGE_PASS_VERDICT = 'PASS_MOVIE_REPLICA_PRODUCTION_PACKAGE_V1' as const;
export const MOVIE_REPLICA_PRODUCTION_PACKAGE_FAIL_VERDICT = 'FAIL_MOVIE_REPLICA_PRODUCTION_PACKAGE_V1' as const;

export const MOVIE_REPLICA_PRODUCTION_PACKAGE_SCHEMA_PATH =
  'datasets/movie_replica/movie-replica-production-package.schema.json' as const;
export const MOVIE_REPLICA_PRODUCTION_PACKAGE_REPORT_PATH =
  'reports/movie_replica/MOVIE_REPLICA_PRODUCTION_PACKAGE_REPORT.json' as const;
export const MOVIE_REPLICA_PRODUCTION_PACKAGE_DIR = 'exports/movie_replica' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

const PACKAGE_VERSION = 'v1' as const;

const REPLICA_DATASET_REFS = [
  {
    movie_id: 'titanic',
    replica_dataset_ref: 'datasets/movie_replica/titanic/titanic-movie-replica-dataset.json',
  },
  {
    movie_id: 'spirited_away',
    replica_dataset_ref: 'datasets/movie_replica/spirited_away/spirited-away-movie-replica-dataset.json',
  },
] as const;

export const PRODUCTION_PACKAGE_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'exports/movie_replica/titanic-movie-replica-production-package.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'exports/movie_replica/spirited-away-movie-replica-production-package.json',
  },
] as const;

export interface MovieReplicaProductionPackage {
  package_id: string;
  movie_id: string;
  replica_dataset_ref: string;
  scene_graph_ref: string;
  trajectory_ref: string;
  keyframe_ref: string;
  frame_generation_ref: string;
  frame_sequence_ref: string;
  integrity_ref: string;
  character_replacement_ref: string;
  package_version: typeof PACKAGE_VERSION;
  production_ready: boolean;
  integrity_score_avg: number;
  target_apps: ['image_app', 'video_app'];
  execution_flags: typeof EXECUTION_FLAGS;
  built_at: string;
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

function refForMovie<T extends { movie_id: string; output_path: string }>(
  specs: readonly T[],
  movieId: string
): string {
  const spec = specs.find((entry) => entry.movie_id === movieId);
  if (!spec) throw new Error(`Missing ref spec for movie_id=${movieId}`);
  return spec.output_path;
}

function integrityScoreAvg(integrityDataset: MovieReplicaIntegrityDataset | null): number {
  if (!integrityDataset || integrityDataset.validations.length === 0) return 0;
  return average(integrityDataset.validations.map((entry) => entry.replica_integrity_score));
}

export function buildMovieReplicaProductionPackage(
  movieId: string,
  integrityDataset: MovieReplicaIntegrityDataset | null,
  productionReady: boolean
): MovieReplicaProductionPackage {
  const replicaRef =
    REPLICA_DATASET_REFS.find((entry) => entry.movie_id === movieId)?.replica_dataset_ref ??
    `datasets/movie_replica/${movieId}/${movieId}-movie-replica-dataset.json`;

  return {
    package_id: `${movieId}-movie-replica-production-package-${PACKAGE_VERSION}`,
    movie_id: movieId,
    replica_dataset_ref: replicaRef,
    scene_graph_ref: refForMovie(SCENE_GRAPH_OUTPUTS, movieId),
    trajectory_ref: refForMovie(TRAJECTORY_REPLAY_OUTPUTS, movieId),
    keyframe_ref: refForMovie(KEYFRAME_RECONSTRUCTION_OUTPUTS, movieId),
    frame_generation_ref: refForMovie(FRAME_GENERATION_OUTPUTS, movieId),
    frame_sequence_ref: refForMovie(TRAJECTORY_REPLAY_OUTPUTS, movieId),
    integrity_ref: refForMovie(REPLICA_INTEGRITY_OUTPUTS, movieId),
    character_replacement_ref: refForMovie(CHARACTER_REPLACEMENT_VALIDATION_OUTPUTS, movieId),
    package_version: PACKAGE_VERSION,
    production_ready: productionReady,
    integrity_score_avg: integrityScoreAvg(integrityDataset),
    target_apps: ['image_app', 'video_app'],
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: new Date().toISOString(),
  };
}

export function buildAllMovieReplicaProductionPackages(
  root: string,
  productionReady: boolean
): MovieReplicaProductionPackage[] {
  const integrityDatasets = loadAllMovieReplicaIntegrityDatasets(root);

  return PRODUCTION_PACKAGE_OUTPUTS.map((spec) => {
    const integrityDataset = integrityDatasets.find((dataset) => dataset.movie_id === spec.movie_id) ?? null;
    return buildMovieReplicaProductionPackage(spec.movie_id, integrityDataset, productionReady);
  });
}

export function writeMovieReplicaProductionPackages(
  projectRoot?: string,
  productionReady = true
): MovieReplicaProductionPackage[] {
  const root = resolveProjectRoot(projectRoot);
  const packages = buildAllMovieReplicaProductionPackages(root, productionReady);

  for (const spec of PRODUCTION_PACKAGE_OUTPUTS) {
    const pkg = packages.find((entry) => entry.movie_id === spec.movie_id);
    if (pkg) {
      writeJson(root, spec.output_path, pkg);
    }
  }

  return packages;
}

export function loadMovieReplicaProductionPackage(
  root: string,
  movieId: string
): MovieReplicaProductionPackage | null {
  const spec = PRODUCTION_PACKAGE_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieReplicaProductionPackage;
}

export function loadAllMovieReplicaProductionPackages(root: string): MovieReplicaProductionPackage[] {
  return PRODUCTION_PACKAGE_OUTPUTS.map((spec) => loadMovieReplicaProductionPackage(root, spec.movie_id)).filter(
    (pkg): pkg is MovieReplicaProductionPackage => pkg !== null
  );
}

export { SAFE_CREATE_POLICY };
