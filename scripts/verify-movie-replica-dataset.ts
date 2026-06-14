import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_REPLICA_PASS_VERDICT,
  MOVIE_REPLICA_REGISTRY_PATH,
  MOVIE_REPLICA_REPORT_PATH,
  MOVIE_REPLICA_SCHEMA_PATH,
} from '../services/movieReplicaDatasetBuilder.js';
import { writeMovieReplicaDatasetReport } from '../services/movieReplicaDatasetValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieReplicaDatasetReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `replica_dataset_created=${report.replica_dataset_created}`,
    `trajectory_registry_present=${report.trajectory_registry_present}`,
    `pose_registry_present=${report.pose_registry_present}`,
    `camera_timeline_registry_present=${report.camera_timeline_registry_present}`,
    `temporal_registry_v2_present=${report.temporal_registry_v2_present}`,
    `movie_count=${metrics.movie_count}`,
    `scene_count=${metrics.scene_count}`,
    `trajectory_count=${metrics.trajectory_count}`,
    `pose_count=${metrics.pose_count}`,
    `camera_timeline_count=${metrics.camera_timeline_count}`,
    `temporal_segment_count=${metrics.temporal_segment_count}`,
  ].join(' | ')
);

for (const rel of [MOVIE_REPLICA_SCHEMA_PATH, MOVIE_REPLICA_REGISTRY_PATH, MOVIE_REPLICA_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_REPLICA_PASS_VERDICT) {
  console.error('MOVIE REPLICA DATASET VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
