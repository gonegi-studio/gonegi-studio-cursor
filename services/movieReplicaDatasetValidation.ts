import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_REPLICA_DIR,
  MOVIE_REPLICA_FAIL_VERDICT,
  MOVIE_REPLICA_PASS_VERDICT,
  MOVIE_REPLICA_PHASE,
  MOVIE_REPLICA_REGISTRY_PATH,
  MOVIE_REPLICA_REPORT_PATH,
  MOVIE_REPLICA_SCHEMA_PATH,
  MOVIE_REPLICA_SYSTEM_ID,
  MovieReplicaDataset,
  MovieReplicaEntry,
  loadAllMovieReplicaDatasets,
  writeMovieReplicaDatasets,
} from './movieReplicaDatasetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_VALIDATION_PHASE = 'PHASE-MOVIE-REPLICA-VALIDATION-001' as const;
export const MOVIE_REPLICA_VALIDATION_ID = 'MOVIE_REPLICA_DATASET_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieReplicaDatasetReport {
  report_id: string;
  phase: typeof MOVIE_REPLICA_PHASE;
  validation_phase: typeof MOVIE_REPLICA_VALIDATION_PHASE;
  system_id: typeof MOVIE_REPLICA_SYSTEM_ID;
  validation_id: typeof MOVIE_REPLICA_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  replica_dataset_created: boolean;
  trajectory_registry_present: boolean;
  pose_registry_present: boolean;
  camera_timeline_registry_present: boolean;
  temporal_registry_v2_present: boolean;
  status: string;
  metrics: {
    movie_count: number;
    scene_count: number;
    trajectory_count: number;
    pose_count: number;
    camera_timeline_count: number;
    temporal_segment_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    scene_count: number;
    trajectory_count: number;
    pose_count: number;
    camera_timeline_count: number;
    temporal_segment_count: number;
    valid_scene_count: number;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function isNonEmptyObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

function validateReplicaEntry(entry: MovieReplicaEntry): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${entry.movie_id}/${entry.scene_id}`;

  if (!isNonEmptyObject(entry.scene_geometry)) {
    issues.push({
      code: 'MISSING_SCENE_GEOMETRY',
      message: `${prefix}: scene_geometry missing`,
      severity: 'error',
    });
  }
  if (!isNonEmptyObject(entry.camera_profile)) {
    issues.push({
      code: 'MISSING_CAMERA_PROFILE',
      message: `${prefix}: camera_profile missing`,
      severity: 'error',
    });
  }
  if (!isNonEmptyObject(entry.blocking_profile)) {
    issues.push({
      code: 'MISSING_BLOCKING_PROFILE',
      message: `${prefix}: blocking_profile missing`,
      severity: 'error',
    });
  }
  if (!isNonEmptyObject(entry.composition_profile)) {
    issues.push({
      code: 'MISSING_COMPOSITION_PROFILE',
      message: `${prefix}: composition_profile missing`,
      severity: 'error',
    });
  }
  if (!isNonEmptyObject(entry.semantic_anchor)) {
    issues.push({
      code: 'MISSING_SEMANTIC_ANCHOR',
      message: `${prefix}: semantic_anchor missing`,
      severity: 'error',
    });
  }
  if (entry.trajectory_registry.trajectory_count <= 0) {
    issues.push({
      code: 'TRAJECTORY_COUNT_ZERO',
      message: `${prefix}: trajectory count must be > 0`,
      severity: 'error',
    });
  }
  if (entry.pose_registry.pose_count <= 0) {
    issues.push({
      code: 'POSE_COUNT_ZERO',
      message: `${prefix}: pose count must be > 0`,
      severity: 'error',
    });
  }
  if (entry.camera_timeline_registry.timeline_count <= 0) {
    issues.push({
      code: 'CAMERA_TIMELINE_COUNT_ZERO',
      message: `${prefix}: camera timeline count must be > 0`,
      severity: 'error',
    });
  }
  if (entry.temporal_registry_v2.segment_count <= 0) {
    issues.push({
      code: 'TEMPORAL_SEGMENT_COUNT_ZERO',
      message: `${prefix}: temporal segment count must be > 0`,
      severity: 'error',
    });
  }

  const flags = entry.execution_flags;
  if (flags.design_only !== true || flags.gpu_execution !== false || flags.rendering !== false) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: `${prefix}: execution_flags must enforce design-only / no GPU / no rendering`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieReplicaDataset): {
  movie_id: string;
  scene_count: number;
  trajectory_count: number;
  pose_count: number;
  camera_timeline_count: number;
  temporal_segment_count: number;
  valid_scene_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  let validSceneCount = 0;

  for (const entry of dataset.scene_replicas) {
    const entryIssues = validateReplicaEntry(entry);
    issues.push(...entryIssues);
    if (entryIssues.filter((issue) => issue.severity === 'error').length === 0) {
      validSceneCount += 1;
    }
  }

  const trajectoryCount = dataset.scene_replicas.reduce(
    (sum, entry) => sum + entry.trajectory_registry.trajectory_count,
    0
  );
  const poseCount = dataset.scene_replicas.reduce((sum, entry) => sum + entry.pose_registry.pose_count, 0);
  const cameraTimelineCount = dataset.scene_replicas.reduce(
    (sum, entry) => sum + entry.camera_timeline_registry.timeline_count,
    0
  );
  const temporalSegmentCount = dataset.scene_replicas.reduce(
    (sum, entry) => sum + entry.temporal_registry_v2.segment_count,
    0
  );

  return {
    movie_id: dataset.movie_id,
    scene_count: dataset.scene_replica_count,
    trajectory_count: trajectoryCount,
    pose_count: poseCount,
    camera_timeline_count: cameraTimelineCount,
    temporal_segment_count: temporalSegmentCount,
    valid_scene_count: validSceneCount,
    issues,
  };
}

export function runMovieReplicaDatasetValidation(
  root: string,
  datasets: MovieReplicaDataset[]
): MovieReplicaDatasetReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_DIR))) {
    issues.push({
      code: 'MISSING_REPLICA_DIR',
      message: `${MOVIE_REPLICA_DIR} does not exist`,
      severity: 'error',
    });
  }
  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_REPLICA_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }
  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_REGISTRY_PATH))) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `${MOVIE_REPLICA_REGISTRY_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_DATASETS',
      message: 'No movie replica datasets found',
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    movie_count: datasets.length,
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    trajectory_count: summaries.reduce((sum, summary) => sum + summary.trajectory_count, 0),
    pose_count: summaries.reduce((sum, summary) => sum + summary.pose_count, 0),
    camera_timeline_count: summaries.reduce((sum, summary) => sum + summary.camera_timeline_count, 0),
    temporal_segment_count: summaries.reduce((sum, summary) => sum + summary.temporal_segment_count, 0),
  };

  const replicaDatasetCreated = datasets.length > 0 && metrics.scene_count > 0;
  const trajectoryRegistryPresent = metrics.trajectory_count > 0;
  const poseRegistryPresent = metrics.pose_count > 0;
  const cameraTimelineRegistryPresent = metrics.camera_timeline_count > 0;
  const temporalRegistryV2Present = metrics.temporal_segment_count > 0;

  const allScenesValid = summaries.every(
    (summary) => summary.valid_scene_count === summary.scene_count && summary.scene_count > 0
  );
  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    replicaDatasetCreated &&
    trajectoryRegistryPresent &&
    poseRegistryPresent &&
    cameraTimelineRegistryPresent &&
    temporalRegistryV2Present &&
    allScenesValid;

  return {
    report_id: `movie_replica_report_${Date.now().toString(36)}`,
    phase: MOVIE_REPLICA_PHASE,
    validation_phase: MOVIE_REPLICA_VALIDATION_PHASE,
    system_id: MOVIE_REPLICA_SYSTEM_ID,
    validation_id: MOVIE_REPLICA_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? MOVIE_REPLICA_PASS_VERDICT : MOVIE_REPLICA_FAIL_VERDICT,
    validation_passed: validationPassed,
    replica_dataset_created: replicaDatasetCreated,
    trajectory_registry_present: trajectoryRegistryPresent,
    pose_registry_present: poseRegistryPresent,
    camera_timeline_registry_present: cameraTimelineRegistryPresent,
    temporal_registry_v2_present: temporalRegistryV2Present,
    status: validationPassed ? MOVIE_REPLICA_PASS_VERDICT : MOVIE_REPLICA_FAIL_VERDICT,
    metrics,
    movie_summaries: summaries.map(({ issues: _issues, ...summary }) => summary),
    issues,
  };
}

export function writeMovieReplicaDatasetReport(projectRoot?: string): MovieReplicaDatasetReport {
  const root = resolveProjectRoot(projectRoot);
  writeMovieReplicaDatasets(root);
  const datasets = loadAllMovieReplicaDatasets(root);
  const report = runMovieReplicaDatasetValidation(root, datasets);
  writeJson(root, MOVIE_REPLICA_REPORT_PATH, report);
  return report;
}
