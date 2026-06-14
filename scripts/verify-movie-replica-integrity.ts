import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_REPLICA_INTEGRITY_PASS_VERDICT,
  MOVIE_REPLICA_INTEGRITY_REPORT_PATH,
  MOVIE_REPLICA_INTEGRITY_SCHEMA_PATH,
  REPLICA_INTEGRITY_OUTPUTS,
} from '../services/movieReplicaIntegrityValidation.js';
import { writeMovieReplicaIntegrityReport } from '../services/movieReplicaIntegrityAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieReplicaIntegrityReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `replica_integrity_verified=${report.replica_integrity_verified}`,
    `geometry_integrity_present=${report.geometry_integrity_present}`,
    `camera_integrity_present=${report.camera_integrity_present}`,
    `timeline_integrity_present=${report.timeline_integrity_present}`,
    `scene_count=${metrics.scene_count}`,
    `geometry_score_avg=${metrics.geometry_score_avg}`,
    `camera_score_avg=${metrics.camera_score_avg}`,
    `blocking_score_avg=${metrics.blocking_score_avg}`,
    `trajectory_score_avg=${metrics.trajectory_score_avg}`,
    `timeline_score_avg=${metrics.timeline_score_avg}`,
    `replica_score_avg=${metrics.replica_score_avg}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_REPLICA_INTEGRITY_SCHEMA_PATH,
  MOVIE_REPLICA_INTEGRITY_REPORT_PATH,
  ...REPLICA_INTEGRITY_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_REPLICA_INTEGRITY_PASS_VERDICT) {
  console.error('MOVIE REPLICA INTEGRITY VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
