import fs from 'node:fs';
import path from 'node:path';
import { FRAME_GENERATION_OUTPUTS } from './movieFrameGenerationOrchestrator.js';
import { KEYFRAME_RECONSTRUCTION_OUTPUTS } from './movieKeyframeReconstructionBuilder.js';
import { REPLICA_INTEGRITY_OUTPUTS } from './movieReplicaIntegrityValidation.js';
import {
  MovieReplicaProductionPackage,
  PRODUCTION_PACKAGE_OUTPUTS,
  loadAllMovieReplicaProductionPackages,
} from './movieReplicaProductionPackageBuilder.js';
import { SCENE_GRAPH_OUTPUTS } from './movieReplicaSceneGraphBuilder.js';
import { TRAJECTORY_REPLAY_OUTPUTS } from './movieTrajectoryReplayBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_MASTER_CERTIFICATION_PHASE = 'PHASE-MOVIE-REPLICA-010' as const;
export const MOVIE_REPLICA_MASTER_CERTIFICATION_SYSTEM_ID = 'MOVIE_REPLICA_MASTER_CERTIFICATION_V1' as const;
export const MOVIE_REPLICA_MASTER_CERTIFICATION_PASS_VERDICT = 'PASS_MOVIE_REPLICA_MASTER_CERTIFICATION_V1' as const;
export const MOVIE_REPLICA_MASTER_CERTIFICATION_FAIL_VERDICT = 'FAIL_MOVIE_REPLICA_MASTER_CERTIFICATION_V1' as const;

export const MOVIE_REPLICA_MASTER_CERTIFICATION_SCHEMA_PATH =
  'datasets/movie_replica/movie-replica-master-certification.schema.json' as const;
export const MOVIE_REPLICA_MASTER_CERTIFICATION_REPORT_PATH =
  'reports/movie_replica/MOVIE_REPLICA_MASTER_CERTIFICATION_REPORT.json' as const;
export const MOVIE_REPLICA_MASTER_CERTIFICATION_DIR = 'exports/movie_replica' as const;

const CERTIFICATION_VERSION = 'v1' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

const REPLICA_DATASET_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_replica/titanic/titanic-movie-replica-dataset.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_replica/spirited_away/spirited-away-movie-replica-dataset.json',
  },
] as const;

export const MASTER_CERTIFICATION_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'exports/movie_replica/titanic-movie-replica-master-certification.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'exports/movie_replica/spirited-away-movie-replica-master-certification.json',
  },
] as const;

export interface MovieReplicaMasterCertification {
  certification_id: string;
  movie_id: string;
  dataset_status: boolean;
  scene_graph_status: boolean;
  trajectory_status: boolean;
  keyframe_status: boolean;
  frame_generation_status: boolean;
  frame_sequence_status: boolean;
  integrity_status: boolean;
  production_package_status: boolean;
  master_status: boolean;
  certification_version: typeof CERTIFICATION_VERSION;
  production_package_ref: string;
  execution_flags: typeof EXECUTION_FLAGS;
  certified_at: string;
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

function artifactPresent(root: string, rel: string): boolean {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return false;
  try {
    const parsed = JSON.parse(fs.readFileSync(full, 'utf8')) as unknown;
    return parsed !== null && typeof parsed === 'object';
  } catch {
    return false;
  }
}

function productionPackageReady(
  root: string,
  movieId: string,
  productionPackage: MovieReplicaProductionPackage | null
): boolean {
  if (!productionPackage) return false;
  if (productionPackage.movie_id !== movieId) return false;
  if (!productionPackage.production_ready) return false;
  return artifactPresent(root, refForMovie(PRODUCTION_PACKAGE_OUTPUTS, movieId));
}

export function buildMovieReplicaMasterCertification(
  movieId: string,
  root: string,
  productionPackage: MovieReplicaProductionPackage | null
): MovieReplicaMasterCertification {
  const dataset_status = artifactPresent(root, refForMovie(REPLICA_DATASET_OUTPUTS, movieId));
  const scene_graph_status = artifactPresent(root, refForMovie(SCENE_GRAPH_OUTPUTS, movieId));
  const trajectory_status = artifactPresent(root, refForMovie(TRAJECTORY_REPLAY_OUTPUTS, movieId));
  const keyframe_status = artifactPresent(root, refForMovie(KEYFRAME_RECONSTRUCTION_OUTPUTS, movieId));
  const frame_generation_status = artifactPresent(root, refForMovie(FRAME_GENERATION_OUTPUTS, movieId));
  const frame_sequence_status = artifactPresent(root, refForMovie(TRAJECTORY_REPLAY_OUTPUTS, movieId));
  const integrity_status = artifactPresent(root, refForMovie(REPLICA_INTEGRITY_OUTPUTS, movieId));
  const production_package_status = productionPackageReady(root, movieId, productionPackage);

  const master_status =
    dataset_status &&
    scene_graph_status &&
    trajectory_status &&
    keyframe_status &&
    frame_generation_status &&
    frame_sequence_status &&
    integrity_status &&
    production_package_status;

  return {
    certification_id: `${movieId}-movie-replica-master-certification-${CERTIFICATION_VERSION}`,
    movie_id: movieId,
    dataset_status,
    scene_graph_status,
    trajectory_status,
    keyframe_status,
    frame_generation_status,
    frame_sequence_status,
    integrity_status,
    production_package_status,
    master_status,
    certification_version: CERTIFICATION_VERSION,
    production_package_ref: refForMovie(PRODUCTION_PACKAGE_OUTPUTS, movieId),
    execution_flags: { ...EXECUTION_FLAGS },
    certified_at: new Date().toISOString(),
  };
}

export function buildAllMovieReplicaMasterCertifications(root: string): MovieReplicaMasterCertification[] {
  const productionPackages = loadAllMovieReplicaProductionPackages(root);

  return MASTER_CERTIFICATION_OUTPUTS.map((spec) => {
    const productionPackage = productionPackages.find((entry) => entry.movie_id === spec.movie_id) ?? null;
    return buildMovieReplicaMasterCertification(spec.movie_id, root, productionPackage);
  });
}

export function writeMovieReplicaMasterCertifications(projectRoot?: string): MovieReplicaMasterCertification[] {
  const root = resolveProjectRoot(projectRoot);
  const certifications = buildAllMovieReplicaMasterCertifications(root);

  for (const spec of MASTER_CERTIFICATION_OUTPUTS) {
    const certification = certifications.find((entry) => entry.movie_id === spec.movie_id);
    if (certification) {
      writeJson(root, spec.output_path, certification);
    }
  }

  return certifications;
}

export function loadMovieReplicaMasterCertification(
  root: string,
  movieId: string
): MovieReplicaMasterCertification | null {
  const spec = MASTER_CERTIFICATION_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieReplicaMasterCertification;
}

export function loadAllMovieReplicaMasterCertifications(root: string): MovieReplicaMasterCertification[] {
  return MASTER_CERTIFICATION_OUTPUTS.map((spec) => loadMovieReplicaMasterCertification(root, spec.movie_id)).filter(
    (certification): certification is MovieReplicaMasterCertification => certification !== null
  );
}

export { SAFE_CREATE_POLICY };
