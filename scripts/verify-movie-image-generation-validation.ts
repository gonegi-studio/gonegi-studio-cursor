import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_IMAGE_GENERATION_TEST_DIR,
  MOVIE_IMAGE_GENERATION_VALIDATION_PASS_VERDICT,
  MOVIE_IMAGE_GENERATION_VALIDATION_REPORT_PATH,
  MOVIE_IMAGE_GENERATION_VALIDATION_SCHEMA_PATH,
  TITANIC_GENERATION_TEST_SCENES,
  writeMovieImageGenerationValidationReport,
} from '../services/movieImageGenerationValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieImageGenerationValidationReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `generation_test_complete=${report.generation_test_complete}`,
    `replica_validation_complete=${report.replica_validation_complete}`,
    `test_scene_count=${metrics.test_scene_count}`,
    `validation_record_count=${metrics.validation_record_count}`,
    `replica_baseline_pass_count=${metrics.replica_baseline_pass_count}`,
    `average_replica_score=${metrics.average_replica_score}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_IMAGE_GENERATION_VALIDATION_SCHEMA_PATH,
  MOVIE_IMAGE_GENERATION_VALIDATION_REPORT_PATH,
  ...TITANIC_GENERATION_TEST_SCENES.map(
    (spec) => `${MOVIE_IMAGE_GENERATION_TEST_DIR}/${spec.output_filename}`
  ),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_IMAGE_GENERATION_VALIDATION_PASS_VERDICT) {
  console.error('MOVIE IMAGE GENERATION VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
