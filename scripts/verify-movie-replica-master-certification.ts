import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MASTER_CERTIFICATION_OUTPUTS,
  MOVIE_REPLICA_MASTER_CERTIFICATION_PASS_VERDICT,
  MOVIE_REPLICA_MASTER_CERTIFICATION_REPORT_PATH,
  MOVIE_REPLICA_MASTER_CERTIFICATION_SCHEMA_PATH,
} from '../services/movieReplicaMasterCertification.js';
import { writeMovieReplicaMasterCertificationReport } from '../services/movieReplicaMasterCertificationValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieReplicaMasterCertificationReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `movie_replica_system_complete=${report.movie_replica_system_complete}`,
    `master_certified=${report.master_certified}`,
    `all_pipeline_stages_pass=${report.all_pipeline_stages_pass}`,
    `movie_count=${metrics.movie_count}`,
    `certified_movie_count=${metrics.certified_movie_count}`,
    `master_pass_count=${metrics.master_pass_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_REPLICA_MASTER_CERTIFICATION_SCHEMA_PATH,
  MOVIE_REPLICA_MASTER_CERTIFICATION_REPORT_PATH,
  ...MASTER_CERTIFICATION_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_REPLICA_MASTER_CERTIFICATION_PASS_VERDICT) {
  console.error('MOVIE REPLICA MASTER CERTIFICATION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
