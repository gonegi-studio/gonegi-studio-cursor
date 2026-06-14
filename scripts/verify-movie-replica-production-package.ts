import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_REPLICA_PRODUCTION_PACKAGE_PASS_VERDICT,
  MOVIE_REPLICA_PRODUCTION_PACKAGE_REPORT_PATH,
  MOVIE_REPLICA_PRODUCTION_PACKAGE_SCHEMA_PATH,
  PRODUCTION_PACKAGE_OUTPUTS,
} from '../services/movieReplicaProductionPackageBuilder.js';
import { writeMovieReplicaProductionPackageReport } from '../services/movieReplicaProductionPackageValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieReplicaProductionPackageReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `production_package_created=${report.production_package_created}`,
    `production_ready=${report.production_ready}`,
    `all_refs_present=${report.all_refs_present}`,
    `integrity_ref_present=${report.integrity_ref_present}`,
    `movie_count=${metrics.movie_count}`,
    `package_count=${metrics.package_count}`,
    `production_ready_count=${metrics.production_ready_count}`,
    `integrity_avg=${metrics.integrity_avg}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_REPLICA_PRODUCTION_PACKAGE_SCHEMA_PATH,
  MOVIE_REPLICA_PRODUCTION_PACKAGE_REPORT_PATH,
  ...PRODUCTION_PACKAGE_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_REPLICA_PRODUCTION_PACKAGE_PASS_VERDICT) {
  console.error('MOVIE REPLICA PRODUCTION PACKAGE VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
