import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHARACTER_REPLACEMENT_VALIDATION_OUTPUTS,
  MOVIE_CHARACTER_REPLACEMENT_PASS_VERDICT,
  MOVIE_CHARACTER_REPLACEMENT_REPORT_PATH,
  MOVIE_CHARACTER_REPLACEMENT_SCHEMA_PATH,
} from '../services/movieCharacterReplacementValidation.js';
import { writeMovieCharacterReplacementReport } from '../services/movieCharacterReplacementIntegrity.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieCharacterReplacementReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `replacement_validation_ready=${report.replacement_validation_ready}`,
    `identity_preservation_present=${report.identity_preservation_present}`,
    `scene_preservation_present=${report.scene_preservation_present}`,
    `scene_count=${metrics.scene_count}`,
    `replacement_count=${metrics.replacement_count}`,
    `identity_score_avg=${metrics.identity_score_avg}`,
    `scene_score_avg=${metrics.scene_score_avg}`,
    `camera_score_avg=${metrics.camera_score_avg}`,
    `blocking_score_avg=${metrics.blocking_score_avg}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_CHARACTER_REPLACEMENT_SCHEMA_PATH,
  MOVIE_CHARACTER_REPLACEMENT_REPORT_PATH,
  ...CHARACTER_REPLACEMENT_VALIDATION_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_CHARACTER_REPLACEMENT_PASS_VERDICT) {
  console.error('MOVIE CHARACTER REPLACEMENT VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
