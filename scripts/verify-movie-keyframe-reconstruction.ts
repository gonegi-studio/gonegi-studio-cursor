import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KEYFRAME_RECONSTRUCTION_OUTPUTS,
  MOVIE_KEYFRAME_RECONSTRUCTION_PASS_VERDICT,
  MOVIE_KEYFRAME_RECONSTRUCTION_REPORT_PATH,
  MOVIE_KEYFRAME_RECONSTRUCTION_SCHEMA_PATH,
} from '../services/movieKeyframeReconstructionBuilder.js';
import { writeMovieKeyframeReconstructionReport } from '../services/movieKeyframeReconstructionValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieKeyframeReconstructionReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `keyframe_reconstruction_created=${report.keyframe_reconstruction_created}`,
    `camera_state_present=${report.camera_state_present}`,
    `character_state_present=${report.character_state_present}`,
    `identity_replacement_ready=${report.identity_replacement_ready}`,
    `scene_count=${metrics.scene_count}`,
    `keyframe_count=${metrics.keyframe_count}`,
    `camera_state_count=${metrics.camera_state_count}`,
    `character_state_count=${metrics.character_state_count}`,
    `replacement_map_count=${metrics.replacement_map_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_KEYFRAME_RECONSTRUCTION_SCHEMA_PATH,
  MOVIE_KEYFRAME_RECONSTRUCTION_REPORT_PATH,
  ...KEYFRAME_RECONSTRUCTION_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_KEYFRAME_RECONSTRUCTION_PASS_VERDICT) {
  console.error('MOVIE KEYFRAME RECONSTRUCTION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
