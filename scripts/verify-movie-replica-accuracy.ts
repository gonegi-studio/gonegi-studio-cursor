import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_REPLICA_ACCURACY_PASS_VERDICT,
  MOVIE_REPLICA_ACCURACY_REPORT_PATH,
  MOVIE_REPLICA_ACCURACY_SCHEMA_PATH,
} from '../services/movieReplicaAccuracyAudit.js';
import { writeMovieReplicaAccuracyReport } from '../services/movieReplicaAccuracyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieReplicaAccuracyReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `replica_accuracy_audited=${report.replica_accuracy_audited}`,
    `replica_score_generated=${report.replica_score_generated}`,
    `all_scores_present=${report.all_scores_present}`,
    `overall_replica_score_present=${report.overall_replica_score_present}`,
    `audit_result_present=${report.audit_result_present}`,
    `movie_count=${metrics.movie_count}`,
    `scene_count=${metrics.scene_count}`,
    `avg_camera_score=${metrics.avg_camera_score}`,
    `avg_blocking_score=${metrics.avg_blocking_score}`,
    `avg_composition_score=${metrics.avg_composition_score}`,
    `avg_depth_score=${metrics.avg_depth_score}`,
    `avg_replica_score=${metrics.avg_replica_score}`,
  ].join(' | ')
);

for (const rel of [MOVIE_REPLICA_ACCURACY_SCHEMA_PATH, MOVIE_REPLICA_ACCURACY_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_REPLICA_ACCURACY_PASS_VERDICT) {
  console.error('MOVIE REPLICA ACCURACY VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
