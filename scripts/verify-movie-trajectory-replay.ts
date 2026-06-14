import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_TRAJECTORY_REPLAY_PASS_VERDICT,
  MOVIE_TRAJECTORY_REPLAY_REPORT_PATH,
  MOVIE_TRAJECTORY_REPLAY_SCHEMA_PATH,
  TRAJECTORY_REPLAY_OUTPUTS,
} from '../services/movieTrajectoryReplayBuilder.js';
import { writeMovieTrajectoryReplayReport } from '../services/movieTrajectoryReplayValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieTrajectoryReplayReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `trajectory_replay_created=${report.trajectory_replay_created}`,
    `character_trajectory_present=${report.character_trajectory_present}`,
    `camera_trajectory_present=${report.camera_trajectory_present}`,
    `keyframe_sequence_present=${report.keyframe_sequence_present}`,
    `motion_segments_present=${report.motion_segments_present}`,
    `scene_count=${metrics.scene_count}`,
    `trajectory_count=${metrics.trajectory_count}`,
    `camera_trajectory_count=${metrics.camera_trajectory_count}`,
    `keyframe_count=${metrics.keyframe_count}`,
    `motion_segment_count=${metrics.motion_segment_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_TRAJECTORY_REPLAY_SCHEMA_PATH,
  MOVIE_TRAJECTORY_REPLAY_REPORT_PATH,
  ...TRAJECTORY_REPLAY_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_TRAJECTORY_REPLAY_PASS_VERDICT) {
  console.error('MOVIE TRAJECTORY REPLAY VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
