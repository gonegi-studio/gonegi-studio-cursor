import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_REAL_IMAGE_APP_REPORT_PATH,
  MOVIE_REAL_IMAGE_APP_VALIDATION_PASS_VERDICT,
  REAL_IMAGE_APP_OUTPUT_DIR,
  REAL_IMAGE_APP_TEST_SCENES,
  writeMovieRealImageAppReport,
} from '../services/movieRealImageAppValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieRealImageAppReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `image_app_validation_complete=${report.image_app_validation_complete}`,
    `real_app_generation_verified=${report.real_app_generation_verified}`,
    `scene_count=${metrics.scene_count}`,
    `image_app_generation_count=${metrics.image_app_generation_count}`,
    `character_score=${metrics.character_score}`,
    `camera_score=${metrics.camera_score}`,
    `composition_score=${metrics.composition_score}`,
    `environment_score=${metrics.environment_score}`,
    `semantic_score=${metrics.semantic_score}`,
    `overall_score=${metrics.overall_score}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_REAL_IMAGE_APP_REPORT_PATH,
  ...REAL_IMAGE_APP_TEST_SCENES.map(
    (spec) => `${REAL_IMAGE_APP_OUTPUT_DIR}/${spec.output_filename}`
  ),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_REAL_IMAGE_APP_VALIDATION_PASS_VERDICT) {
  console.error('MOVIE REAL IMAGE APP VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
