import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_IMAGE_IMPORT_TEST_OUTPUTS,
  MOVIE_IMAGE_IMPORT_TEST_PASS_VERDICT,
  MOVIE_IMAGE_IMPORT_TEST_REPORT_PATH,
  MOVIE_IMAGE_IMPORT_TEST_SCENARIO_ONLY_OUTPUT,
  writeMovieImageImportTestPackages,
} from '../services/movieImageImportTestBuilder.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieImageImportTestPackages(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `source_scene_count=${report.source_scene_count}`,
    `single_scene_size=${metrics.single_scene_size}`,
    `three_scene_size=${metrics.three_scene_size}`,
    `ten_scene_size=${metrics.ten_scene_size}`,
    `scenario_only_size=${metrics.scenario_only_size}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_IMAGE_IMPORT_TEST_REPORT_PATH,
  MOVIE_IMAGE_IMPORT_TEST_SCENARIO_ONLY_OUTPUT,
  ...MOVIE_IMAGE_IMPORT_TEST_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_IMAGE_IMPORT_TEST_PASS_VERDICT) {
  console.error('IMAGE IMPORT TEST PACKAGE VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
