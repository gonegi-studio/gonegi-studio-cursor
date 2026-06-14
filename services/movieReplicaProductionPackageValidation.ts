import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_REPLICA_INTEGRITY_PASS_VERDICT } from './movieReplicaIntegrityValidation.js';
import { writeMovieReplicaIntegrityReport } from './movieReplicaIntegrityAudit.js';
import {
  MOVIE_REPLICA_PRODUCTION_PACKAGE_DIR,
  MOVIE_REPLICA_PRODUCTION_PACKAGE_FAIL_VERDICT,
  MOVIE_REPLICA_PRODUCTION_PACKAGE_PASS_VERDICT,
  MOVIE_REPLICA_PRODUCTION_PACKAGE_PHASE,
  MOVIE_REPLICA_PRODUCTION_PACKAGE_REPORT_PATH,
  MOVIE_REPLICA_PRODUCTION_PACKAGE_SCHEMA_PATH,
  MOVIE_REPLICA_PRODUCTION_PACKAGE_SYSTEM_ID,
  MovieReplicaProductionPackage,
  PRODUCTION_PACKAGE_OUTPUTS,
  loadAllMovieReplicaProductionPackages,
  writeMovieReplicaProductionPackages,
} from './movieReplicaProductionPackageBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_PRODUCTION_PACKAGE_VALIDATION_PHASE =
  'PHASE-MOVIE-REPLICA-PRODUCTION-PACKAGE-VALIDATION-001' as const;
export const MOVIE_REPLICA_PRODUCTION_PACKAGE_VALIDATION_ID =
  'MOVIE_REPLICA_PRODUCTION_PACKAGE_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

const REF_FIELDS = [
  'replica_dataset_ref',
  'scene_graph_ref',
  'trajectory_ref',
  'keyframe_ref',
  'frame_generation_ref',
  'frame_sequence_ref',
  'integrity_ref',
] as const;

export interface MovieReplicaProductionPackageReport {
  report_id: string;
  phase: typeof MOVIE_REPLICA_PRODUCTION_PACKAGE_PHASE;
  validation_phase: typeof MOVIE_REPLICA_PRODUCTION_PACKAGE_VALIDATION_PHASE;
  system_id: typeof MOVIE_REPLICA_PRODUCTION_PACKAGE_SYSTEM_ID;
  validation_id: typeof MOVIE_REPLICA_PRODUCTION_PACKAGE_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  production_package_created: boolean;
  production_ready: boolean;
  all_refs_present: boolean;
  integrity_ref_present: boolean;
  status: string;
  upstream_integrity_verdict: string;
  metrics: {
    movie_count: number;
    package_count: number;
    production_ready_count: number;
    integrity_avg: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    package_id: string;
    production_ready: boolean;
    all_refs_present: boolean;
    integrity_score_avg: number;
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

function validatePackage(root: string, pkg: MovieReplicaProductionPackage): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = pkg.movie_id;

  for (const field of REF_FIELDS) {
    const ref = pkg[field];
    if (typeof ref !== 'string' || ref.length === 0) {
      issues.push({
        code: 'REF_MISSING',
        message: `${prefix}: ${field} is missing`,
        severity: 'error',
      });
      continue;
    }
    if (!fs.existsSync(path.join(root, ref))) {
      issues.push({
        code: 'REF_FILE_MISSING',
        message: `${prefix}: ${field} file not found at ${ref}`,
        severity: 'error',
      });
    }
  }

  if (!pkg.production_ready) {
    issues.push({
      code: 'PRODUCTION_NOT_READY',
      message: `${prefix}: production_ready must be true`,
      severity: 'error',
    });
  }

  if (pkg.integrity_score_avg <= 0) {
    issues.push({
      code: 'INTEGRITY_SCORE_ZERO',
      message: `${prefix}: integrity_score_avg must be > 0`,
      severity: 'error',
    });
  }

  const flags = pkg.execution_flags;
  if (flags.design_only !== true || flags.gpu_execution !== false || flags.image_generation !== false) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: `${prefix}: execution_flags must enforce design-only production package`,
      severity: 'error',
    });
  }

  return issues;
}

export function runMovieReplicaProductionPackageValidation(
  root: string,
  packages: MovieReplicaProductionPackage[],
  upstreamIntegrityVerdict: string
): MovieReplicaProductionPackageReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_PRODUCTION_PACKAGE_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_REPLICA_PRODUCTION_PACKAGE_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_PRODUCTION_PACKAGE_DIR))) {
    issues.push({
      code: 'MISSING_EXPORT_DIR',
      message: `${MOVIE_REPLICA_PRODUCTION_PACKAGE_DIR} does not exist`,
      severity: 'error',
    });
  }

  if (packages.length === 0) {
    issues.push({
      code: 'NO_PACKAGES',
      message: 'No production packages found',
      severity: 'error',
    });
  }

  if (upstreamIntegrityVerdict !== MOVIE_REPLICA_INTEGRITY_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_INTEGRITY_NOT_PASS',
      message: `Upstream integrity verdict is ${upstreamIntegrityVerdict}`,
      severity: 'error',
    });
  }

  const movieSummaries = packages.map((pkg) => {
    const pkgIssues = validatePackage(root, pkg);
    issues.push(...pkgIssues);

    const allRefsPresent = REF_FIELDS.every((field) => {
      const ref = pkg[field];
      return typeof ref === 'string' && ref.length > 0 && fs.existsSync(path.join(root, ref));
    });

    return {
      movie_id: pkg.movie_id,
      package_id: pkg.package_id,
      production_ready: pkg.production_ready,
      all_refs_present: allRefsPresent,
      integrity_score_avg: pkg.integrity_score_avg,
    };
  });

  const productionPackageCreated = packages.length > 0;
  const productionReadyCount = packages.filter((pkg) => pkg.production_ready).length;
  const allRefsPresent = movieSummaries.every((summary) => summary.all_refs_present);
  const integrityRefPresent = packages.every(
    (pkg) =>
      typeof pkg.integrity_ref === 'string' &&
      pkg.integrity_ref.length > 0 &&
      fs.existsSync(path.join(root, pkg.integrity_ref))
  );
  const productionReady = productionReadyCount === packages.length && packages.length > 0;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    productionPackageCreated &&
    productionReady &&
    allRefsPresent &&
    integrityRefPresent;

  return {
    report_id: `movie_replica_production_package_report_${Date.now().toString(36)}`,
    phase: MOVIE_REPLICA_PRODUCTION_PACKAGE_PHASE,
    validation_phase: MOVIE_REPLICA_PRODUCTION_PACKAGE_VALIDATION_PHASE,
    system_id: MOVIE_REPLICA_PRODUCTION_PACKAGE_SYSTEM_ID,
    validation_id: MOVIE_REPLICA_PRODUCTION_PACKAGE_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_REPLICA_PRODUCTION_PACKAGE_PASS_VERDICT
      : MOVIE_REPLICA_PRODUCTION_PACKAGE_FAIL_VERDICT,
    validation_passed: validationPassed,
    production_package_created: productionPackageCreated,
    production_ready: productionReady,
    all_refs_present: allRefsPresent,
    integrity_ref_present: integrityRefPresent,
    status: validationPassed
      ? MOVIE_REPLICA_PRODUCTION_PACKAGE_PASS_VERDICT
      : MOVIE_REPLICA_PRODUCTION_PACKAGE_FAIL_VERDICT,
    upstream_integrity_verdict: upstreamIntegrityVerdict,
    metrics: {
      movie_count: packages.length,
      package_count: packages.length,
      production_ready_count: productionReadyCount,
      integrity_avg: average(packages.map((pkg) => pkg.integrity_score_avg)),
    },
    movie_summaries: movieSummaries,
    issues,
  };
}

export function writeMovieReplicaProductionPackageReport(
  projectRoot?: string
): MovieReplicaProductionPackageReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieReplicaIntegrityReport(root);
  const productionReady = upstreamReport.final_verdict === MOVIE_REPLICA_INTEGRITY_PASS_VERDICT;
  writeMovieReplicaProductionPackages(root, productionReady);
  const packages = loadAllMovieReplicaProductionPackages(root);
  const report = runMovieReplicaProductionPackageValidation(root, packages, upstreamReport.final_verdict);
  writeJson(root, MOVIE_REPLICA_PRODUCTION_PACKAGE_REPORT_PATH, report);
  return report;
}
