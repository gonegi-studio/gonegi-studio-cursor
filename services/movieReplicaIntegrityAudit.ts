import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_CHARACTER_REPLACEMENT_PASS_VERDICT } from './movieCharacterReplacementValidation.js';
import { writeMovieCharacterReplacementReport } from './movieCharacterReplacementIntegrity.js';
import {
  MOVIE_REPLICA_INTEGRITY_FAIL_VERDICT,
  MOVIE_REPLICA_INTEGRITY_PASS_VERDICT,
  MOVIE_REPLICA_INTEGRITY_PHASE,
  MOVIE_REPLICA_INTEGRITY_REPORT_PATH,
  MOVIE_REPLICA_INTEGRITY_SCHEMA_PATH,
  MOVIE_REPLICA_INTEGRITY_SYSTEM_ID,
  MovieReplicaIntegrityDataset,
  ReplicaIntegrityValidation,
  loadAllMovieReplicaIntegrityDatasets,
  writeMovieReplicaIntegrityValidations,
} from './movieReplicaIntegrityValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_INTEGRITY_AUDIT_PHASE = 'PHASE-MOVIE-REPLICA-INTEGRITY-AUDIT-001' as const;
export const MOVIE_REPLICA_INTEGRITY_AUDIT_ID = 'MOVIE_REPLICA_INTEGRITY_AUDIT_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieReplicaIntegrityReport {
  report_id: string;
  phase: typeof MOVIE_REPLICA_INTEGRITY_PHASE;
  audit_phase: typeof MOVIE_REPLICA_INTEGRITY_AUDIT_PHASE;
  system_id: typeof MOVIE_REPLICA_INTEGRITY_SYSTEM_ID;
  audit_id: typeof MOVIE_REPLICA_INTEGRITY_AUDIT_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  replica_integrity_verified: boolean;
  geometry_integrity_present: boolean;
  camera_integrity_present: boolean;
  timeline_integrity_present: boolean;
  status: string;
  upstream_character_replacement_verdict: string;
  metrics: {
    scene_count: number;
    geometry_score_avg: number;
    camera_score_avg: number;
    blocking_score_avg: number;
    trajectory_score_avg: number;
    timeline_score_avg: number;
    replica_score_avg: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    scene_count: number;
    geometry_score_avg: number;
    camera_score_avg: number;
    blocking_score_avg: number;
    trajectory_score_avg: number;
    timeline_score_avg: number;
    replica_score_avg: number;
    valid_scene_count: number;
  }>;
  issues: ValidationIssue[];
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

function validateIntegrityEntry(entry: ReplicaIntegrityValidation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${entry.movie_id}/${entry.scene_id}`;

  if (entry.geometry_integrity_score <= 0) {
    issues.push({
      code: 'GEOMETRY_INTEGRITY_ZERO',
      message: `${prefix}: geometry_integrity_score must be > 0`,
      severity: 'error',
    });
  }
  if (entry.camera_integrity_score <= 0) {
    issues.push({
      code: 'CAMERA_INTEGRITY_ZERO',
      message: `${prefix}: camera_integrity_score must be > 0`,
      severity: 'error',
    });
  }
  if (entry.blocking_integrity_score <= 0) {
    issues.push({
      code: 'BLOCKING_INTEGRITY_ZERO',
      message: `${prefix}: blocking_integrity_score must be > 0`,
      severity: 'error',
    });
  }
  if (entry.trajectory_integrity_score <= 0) {
    issues.push({
      code: 'TRAJECTORY_INTEGRITY_ZERO',
      message: `${prefix}: trajectory_integrity_score must be > 0`,
      severity: 'error',
    });
  }
  if (entry.timeline_integrity_score <= 0) {
    issues.push({
      code: 'TIMELINE_INTEGRITY_ZERO',
      message: `${prefix}: timeline_integrity_score must be > 0`,
      severity: 'error',
    });
  }
  if (entry.replica_integrity_score <= 0) {
    issues.push({
      code: 'REPLICA_INTEGRITY_ZERO',
      message: `${prefix}: replica_integrity_score must be > 0`,
      severity: 'error',
    });
  }

  const flags = entry.execution_flags;
  if (flags.design_only !== true || flags.gpu_execution !== false || flags.image_generation !== false) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: `${prefix}: execution_flags must enforce design-only integrity audit`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieReplicaIntegrityDataset): {
  movie_id: string;
  scene_count: number;
  geometry_score_avg: number;
  camera_score_avg: number;
  blocking_score_avg: number;
  trajectory_score_avg: number;
  timeline_score_avg: number;
  replica_score_avg: number;
  valid_scene_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  let validSceneCount = 0;

  for (const entry of dataset.validations) {
    const entryIssues = validateIntegrityEntry(entry);
    issues.push(...entryIssues);
    if (entryIssues.filter((issue) => issue.severity === 'error').length === 0) {
      validSceneCount += 1;
    }
  }

  return {
    movie_id: dataset.movie_id,
    scene_count: dataset.scene_count,
    geometry_score_avg: average(dataset.validations.map((entry) => entry.geometry_integrity_score)),
    camera_score_avg: average(dataset.validations.map((entry) => entry.camera_integrity_score)),
    blocking_score_avg: average(dataset.validations.map((entry) => entry.blocking_integrity_score)),
    trajectory_score_avg: average(dataset.validations.map((entry) => entry.trajectory_integrity_score)),
    timeline_score_avg: average(dataset.validations.map((entry) => entry.timeline_integrity_score)),
    replica_score_avg: average(dataset.validations.map((entry) => entry.replica_integrity_score)),
    valid_scene_count: validSceneCount,
    issues,
  };
}

export function runMovieReplicaIntegrityAudit(
  root: string,
  datasets: MovieReplicaIntegrityDataset[],
  upstreamCharacterReplacementVerdict: string
): MovieReplicaIntegrityReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_INTEGRITY_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_REPLICA_INTEGRITY_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_INTEGRITY_DATASETS',
      message: 'No replica integrity datasets found',
      severity: 'error',
    });
  }

  if (upstreamCharacterReplacementVerdict !== MOVIE_CHARACTER_REPLACEMENT_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_CHARACTER_REPLACEMENT_NOT_PASS',
      message: `Upstream character replacement verdict is ${upstreamCharacterReplacementVerdict}`,
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    geometry_score_avg: average(summaries.map((summary) => summary.geometry_score_avg)),
    camera_score_avg: average(summaries.map((summary) => summary.camera_score_avg)),
    blocking_score_avg: average(summaries.map((summary) => summary.blocking_score_avg)),
    trajectory_score_avg: average(summaries.map((summary) => summary.trajectory_score_avg)),
    timeline_score_avg: average(summaries.map((summary) => summary.timeline_score_avg)),
    replica_score_avg: average(summaries.map((summary) => summary.replica_score_avg)),
  };

  const allValidations = datasets.flatMap((dataset) => dataset.validations);
  const replicaIntegrityVerified = datasets.length > 0 && metrics.scene_count > 0;
  const geometryIntegrityPresent = allValidations.every((entry) => entry.geometry_integrity_score > 0);
  const cameraIntegrityPresent = allValidations.every((entry) => entry.camera_integrity_score > 0);
  const timelineIntegrityPresent = allValidations.every((entry) => entry.timeline_integrity_score > 0);

  const allScenesValid = summaries.every(
    (summary) => summary.valid_scene_count === summary.scene_count && summary.scene_count > 0
  );
  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    replicaIntegrityVerified &&
    geometryIntegrityPresent &&
    cameraIntegrityPresent &&
    timelineIntegrityPresent &&
    allScenesValid;

  return {
    report_id: `movie_replica_integrity_report_${Date.now().toString(36)}`,
    phase: MOVIE_REPLICA_INTEGRITY_PHASE,
    audit_phase: MOVIE_REPLICA_INTEGRITY_AUDIT_PHASE,
    system_id: MOVIE_REPLICA_INTEGRITY_SYSTEM_ID,
    audit_id: MOVIE_REPLICA_INTEGRITY_AUDIT_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? MOVIE_REPLICA_INTEGRITY_PASS_VERDICT : MOVIE_REPLICA_INTEGRITY_FAIL_VERDICT,
    validation_passed: validationPassed,
    replica_integrity_verified: replicaIntegrityVerified,
    geometry_integrity_present: geometryIntegrityPresent,
    camera_integrity_present: cameraIntegrityPresent,
    timeline_integrity_present: timelineIntegrityPresent,
    status: validationPassed ? MOVIE_REPLICA_INTEGRITY_PASS_VERDICT : MOVIE_REPLICA_INTEGRITY_FAIL_VERDICT,
    upstream_character_replacement_verdict: upstreamCharacterReplacementVerdict,
    metrics,
    movie_summaries: summaries.map(({ issues: _issues, ...summary }) => summary),
    issues,
  };
}

export function writeMovieReplicaIntegrityReport(projectRoot?: string): MovieReplicaIntegrityReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieCharacterReplacementReport(root);
  writeMovieReplicaIntegrityValidations(root);
  const datasets = loadAllMovieReplicaIntegrityDatasets(root);
  const report = runMovieReplicaIntegrityAudit(root, datasets, upstreamReport.final_verdict);
  writeJson(root, MOVIE_REPLICA_INTEGRITY_REPORT_PATH, report);
  return report;
}
