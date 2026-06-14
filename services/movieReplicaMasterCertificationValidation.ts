import fs from 'node:fs';
import path from 'node:path';
import {
  MASTER_CERTIFICATION_OUTPUTS,
  MOVIE_REPLICA_MASTER_CERTIFICATION_DIR,
  MOVIE_REPLICA_MASTER_CERTIFICATION_FAIL_VERDICT,
  MOVIE_REPLICA_MASTER_CERTIFICATION_PASS_VERDICT,
  MOVIE_REPLICA_MASTER_CERTIFICATION_PHASE,
  MOVIE_REPLICA_MASTER_CERTIFICATION_REPORT_PATH,
  MOVIE_REPLICA_MASTER_CERTIFICATION_SCHEMA_PATH,
  MOVIE_REPLICA_MASTER_CERTIFICATION_SYSTEM_ID,
  MovieReplicaMasterCertification,
  loadAllMovieReplicaMasterCertifications,
  writeMovieReplicaMasterCertifications,
} from './movieReplicaMasterCertification.js';
import { MOVIE_REPLICA_PRODUCTION_PACKAGE_PASS_VERDICT } from './movieReplicaProductionPackageBuilder.js';
import { writeMovieReplicaProductionPackageReport } from './movieReplicaProductionPackageValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_MASTER_CERTIFICATION_VALIDATION_PHASE =
  'PHASE-MOVIE-REPLICA-MASTER-CERTIFICATION-VALIDATION-001' as const;
export const MOVIE_REPLICA_MASTER_CERTIFICATION_VALIDATION_ID =
  'MOVIE_REPLICA_MASTER_CERTIFICATION_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

const STAGE_FIELDS = [
  'dataset_status',
  'scene_graph_status',
  'trajectory_status',
  'keyframe_status',
  'frame_generation_status',
  'frame_sequence_status',
  'integrity_status',
  'production_package_status',
] as const;

export interface MovieReplicaMasterCertificationReport {
  report_id: string;
  phase: typeof MOVIE_REPLICA_MASTER_CERTIFICATION_PHASE;
  validation_phase: typeof MOVIE_REPLICA_MASTER_CERTIFICATION_VALIDATION_PHASE;
  system_id: typeof MOVIE_REPLICA_MASTER_CERTIFICATION_SYSTEM_ID;
  validation_id: typeof MOVIE_REPLICA_MASTER_CERTIFICATION_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  all_pipeline_stages_pass: boolean;
  master_certified: boolean;
  movie_replica_system_complete: boolean;
  status: string;
  upstream_production_package_verdict: string;
  metrics: {
    movie_count: number;
    certified_movie_count: number;
    master_pass_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    certification_id: string;
    master_status: boolean;
    all_pipeline_stages_pass: boolean;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function allStagesPass(certification: MovieReplicaMasterCertification): boolean {
  return STAGE_FIELDS.every((field) => certification[field] === true);
}

function validateCertification(certification: MovieReplicaMasterCertification): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = certification.movie_id;

  for (const field of STAGE_FIELDS) {
    if (certification[field] !== true) {
      issues.push({
        code: 'STAGE_NOT_PASS',
        message: `${prefix}: ${field} must be true`,
        severity: 'error',
      });
    }
  }

  if (!certification.master_status) {
    issues.push({
      code: 'MASTER_STATUS_FALSE',
      message: `${prefix}: master_status must be true`,
      severity: 'error',
    });
  }

  const flags = certification.execution_flags;
  if (flags.design_only !== true || flags.gpu_execution !== false || flags.image_generation !== false) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: `${prefix}: execution_flags must enforce design-only master certification`,
      severity: 'error',
    });
  }

  return issues;
}

export function runMovieReplicaMasterCertificationValidation(
  root: string,
  certifications: MovieReplicaMasterCertification[],
  upstreamProductionPackageVerdict: string
): MovieReplicaMasterCertificationReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_MASTER_CERTIFICATION_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_REPLICA_MASTER_CERTIFICATION_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_MASTER_CERTIFICATION_DIR))) {
    issues.push({
      code: 'MISSING_EXPORT_DIR',
      message: `${MOVIE_REPLICA_MASTER_CERTIFICATION_DIR} does not exist`,
      severity: 'error',
    });
  }

  if (certifications.length === 0) {
    issues.push({
      code: 'NO_CERTIFICATIONS',
      message: 'No master certifications found',
      severity: 'error',
    });
  }

  if (upstreamProductionPackageVerdict !== MOVIE_REPLICA_PRODUCTION_PACKAGE_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_PRODUCTION_PACKAGE_NOT_PASS',
      message: `Upstream production package verdict is ${upstreamProductionPackageVerdict}`,
      severity: 'error',
    });
  }

  const movieSummaries = certifications.map((certification) => {
    const certIssues = validateCertification(certification);
    issues.push(...certIssues);

    return {
      movie_id: certification.movie_id,
      certification_id: certification.certification_id,
      master_status: certification.master_status,
      all_pipeline_stages_pass: allStagesPass(certification),
    };
  });

  const certifiedMovieCount = movieSummaries.filter((summary) => summary.master_status).length;
  const allPipelineStagesPass = movieSummaries.every((summary) => summary.all_pipeline_stages_pass);
  const masterCertified = certifiedMovieCount === certifications.length && certifications.length > 0;
  const movieReplicaSystemComplete = masterCertified && allPipelineStagesPass;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    allPipelineStagesPass &&
    masterCertified &&
    movieReplicaSystemComplete;

  return {
    report_id: `movie_replica_master_certification_report_${Date.now().toString(36)}`,
    phase: MOVIE_REPLICA_MASTER_CERTIFICATION_PHASE,
    validation_phase: MOVIE_REPLICA_MASTER_CERTIFICATION_VALIDATION_PHASE,
    system_id: MOVIE_REPLICA_MASTER_CERTIFICATION_SYSTEM_ID,
    validation_id: MOVIE_REPLICA_MASTER_CERTIFICATION_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_REPLICA_MASTER_CERTIFICATION_PASS_VERDICT
      : MOVIE_REPLICA_MASTER_CERTIFICATION_FAIL_VERDICT,
    validation_passed: validationPassed,
    all_pipeline_stages_pass: allPipelineStagesPass,
    master_certified: masterCertified,
    movie_replica_system_complete: movieReplicaSystemComplete,
    status: validationPassed
      ? MOVIE_REPLICA_MASTER_CERTIFICATION_PASS_VERDICT
      : MOVIE_REPLICA_MASTER_CERTIFICATION_FAIL_VERDICT,
    upstream_production_package_verdict: upstreamProductionPackageVerdict,
    metrics: {
      movie_count: certifications.length,
      certified_movie_count: certifiedMovieCount,
      master_pass_count: certifiedMovieCount,
    },
    movie_summaries: movieSummaries,
    issues,
  };
}

export function writeMovieReplicaMasterCertificationReport(
  projectRoot?: string
): MovieReplicaMasterCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieReplicaProductionPackageReport(root);
  writeMovieReplicaMasterCertifications(root);
  const certifications = loadAllMovieReplicaMasterCertifications(root);
  const report = runMovieReplicaMasterCertificationValidation(
    root,
    certifications,
    upstreamReport.final_verdict
  );
  writeJson(root, MOVIE_REPLICA_MASTER_CERTIFICATION_REPORT_PATH, report);
  return report;
}
