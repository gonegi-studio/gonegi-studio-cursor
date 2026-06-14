import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_MASTER_SCENARIO_PACKAGE_PASS_VERDICT,
} from './movieMasterScenarioPackageBuilder.js';
import { writeMovieMasterScenarioPackageReport } from './movieMasterScenarioPackageValidation.js';
import {
  MOVIE_REPLICA_ACCURACY_FAIL_VERDICT,
  MOVIE_REPLICA_ACCURACY_PASS_VERDICT,
  MOVIE_REPLICA_ACCURACY_PHASE,
  MOVIE_REPLICA_ACCURACY_REPORT_PATH,
  MOVIE_REPLICA_ACCURACY_SCHEMA_PATH,
  MOVIE_REPLICA_ACCURACY_SYSTEM_ID,
  MovieReplicaAccuracyAudit,
  buildMovieReplicaAccuracyAuditsFromRoot,
} from './movieReplicaAccuracyAudit.js';
import { MOVIE_SPATIAL_DIR } from './movieSpatialEngineBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_ACCURACY_VALIDATION_PHASE = 'PHASE-MOVIE-REPLICA-ACCURACY-VALIDATION-001' as const;
export const MOVIE_REPLICA_ACCURACY_VALIDATION_ID = 'MOVIE_REPLICA_ACCURACY_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

const SCORE_FIELDS = [
  'scene_geometry_score',
  'camera_score',
  'blocking_score',
  'composition_score',
  'spatial_depth_score',
  'gaze_score',
  'environment_score',
  'overall_replica_score',
] as const;

export interface MovieReplicaAccuracyReport {
  report_id: string;
  phase: typeof MOVIE_REPLICA_ACCURACY_PHASE;
  validation_phase: typeof MOVIE_REPLICA_ACCURACY_VALIDATION_PHASE;
  system_id: typeof MOVIE_REPLICA_ACCURACY_SYSTEM_ID;
  validation_id: typeof MOVIE_REPLICA_ACCURACY_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  replica_accuracy_audited: boolean;
  replica_score_generated: boolean;
  all_scores_present: boolean;
  overall_replica_score_present: boolean;
  audit_result_present: boolean;
  status: string;
  upstream_master_scenario_verdict: string;
  metrics: {
    movie_count: number;
    scene_count: number;
    avg_camera_score: number;
    avg_blocking_score: number;
    avg_composition_score: number;
    avg_depth_score: number;
    avg_replica_score: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    scene_count: number;
    pass_count: number;
    avg_replica_score: number;
  }>;
  audits: MovieReplicaAccuracyAudit[];
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

function isValidScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function validateAudit(audit: MovieReplicaAccuracyAudit): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${audit.movie_id}/${audit.scene_id}`;

  for (const field of SCORE_FIELDS) {
    if (!isValidScore(audit[field])) {
      issues.push({
        code: 'SCORE_MISSING',
        message: `${prefix}: ${field} must be a number between 0 and 1`,
        severity: 'error',
      });
    }
  }

  if (audit.audit_result !== 'PASS' && audit.audit_result !== 'FAIL') {
    issues.push({
      code: 'AUDIT_RESULT_MISSING',
      message: `${prefix}: audit_result must be PASS or FAIL`,
      severity: 'error',
    });
  }

  return issues;
}

export function runMovieReplicaAccuracyValidation(
  root: string,
  audits: MovieReplicaAccuracyAudit[],
  upstreamMasterScenarioVerdict: string
): MovieReplicaAccuracyReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_SPATIAL_DIR))) {
    issues.push({
      code: 'MISSING_SPATIAL_DIR',
      message: `${MOVIE_SPATIAL_DIR} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_ACCURACY_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_REPLICA_ACCURACY_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (audits.length === 0) {
    issues.push({
      code: 'NO_AUDITS',
      message: 'No replica accuracy audits found',
      severity: 'error',
    });
  }

  if (upstreamMasterScenarioVerdict !== MOVIE_MASTER_SCENARIO_PACKAGE_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_MASTER_SCENARIO_NOT_PASS',
      message: `Upstream master scenario verdict is ${upstreamMasterScenarioVerdict}`,
      severity: 'error',
    });
  }

  for (const audit of audits) {
    issues.push(...validateAudit(audit));
  }

  const movieIds = [...new Set(audits.map((audit) => audit.movie_id))];
  const movieSummaries = movieIds.map((movieId) => {
    const movieAudits = audits.filter((audit) => audit.movie_id === movieId);
    return {
      movie_id: movieId,
      scene_count: movieAudits.length,
      pass_count: movieAudits.filter((audit) => audit.audit_result === 'PASS').length,
      avg_replica_score: average(movieAudits.map((audit) => audit.overall_replica_score)),
    };
  });

  const metrics = {
    movie_count: movieIds.length,
    scene_count: audits.length,
    avg_camera_score: average(audits.map((audit) => audit.camera_score)),
    avg_blocking_score: average(audits.map((audit) => audit.blocking_score)),
    avg_composition_score: average(audits.map((audit) => audit.composition_score)),
    avg_depth_score: average(audits.map((audit) => audit.spatial_depth_score)),
    avg_replica_score: average(audits.map((audit) => audit.overall_replica_score)),
  };

  const replicaAccuracyAudited = audits.length > 0;
  const replicaScoreGenerated = metrics.avg_replica_score > 0;
  const allScoresPresent = audits.every((audit) =>
    SCORE_FIELDS.every((field) => isValidScore(audit[field]))
  );
  const overallReplicaScorePresent = audits.every((audit) => isValidScore(audit.overall_replica_score));
  const auditResultPresent = audits.every(
    (audit) => audit.audit_result === 'PASS' || audit.audit_result === 'FAIL'
  );

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    replicaAccuracyAudited &&
    replicaScoreGenerated &&
    allScoresPresent &&
    overallReplicaScorePresent &&
    auditResultPresent;

  return {
    report_id: `movie_replica_accuracy_report_${Date.now().toString(36)}`,
    phase: MOVIE_REPLICA_ACCURACY_PHASE,
    validation_phase: MOVIE_REPLICA_ACCURACY_VALIDATION_PHASE,
    system_id: MOVIE_REPLICA_ACCURACY_SYSTEM_ID,
    validation_id: MOVIE_REPLICA_ACCURACY_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_REPLICA_ACCURACY_PASS_VERDICT
      : MOVIE_REPLICA_ACCURACY_FAIL_VERDICT,
    validation_passed: validationPassed,
    replica_accuracy_audited: replicaAccuracyAudited,
    replica_score_generated: replicaScoreGenerated,
    all_scores_present: allScoresPresent,
    overall_replica_score_present: overallReplicaScorePresent,
    audit_result_present: auditResultPresent,
    status: validationPassed ? MOVIE_REPLICA_ACCURACY_PASS_VERDICT : MOVIE_REPLICA_ACCURACY_FAIL_VERDICT,
    upstream_master_scenario_verdict: upstreamMasterScenarioVerdict,
    metrics,
    movie_summaries: movieSummaries,
    audits,
    issues,
  };
}

export function writeMovieReplicaAccuracyReport(projectRoot?: string): MovieReplicaAccuracyReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieMasterScenarioPackageReport(root);
  const audits = buildMovieReplicaAccuracyAuditsFromRoot(root);
  const report = runMovieReplicaAccuracyValidation(root, audits, upstreamReport.final_verdict);
  writeJson(root, MOVIE_REPLICA_ACCURACY_REPORT_PATH, report);
  return report;
}
