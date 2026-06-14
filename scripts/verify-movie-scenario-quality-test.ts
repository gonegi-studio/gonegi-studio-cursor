import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_SCENARIO_QUALITY_PASS_VERDICT,
  MOVIE_SCENARIO_QUALITY_REPORT_PATH,
  SCENARIO_TEST_OUTPUT_DIR,
  SCENARIO_TEST_SCENES,
  writeMovieScenarioQualityReport,
} from '../services/movieScenarioTestBuilder.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieScenarioQualityReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `single_scene_test_ready=${report.single_scene_test_ready}`,
    `human_review_ready=${report.human_review_ready}`,
    `image_app_generation_test_ready=${report.image_app_generation_test_ready}`,
    `scene_count=${metrics.scene_count}`,
    `scenario_length=${metrics.scenario_length}`,
    `character_length=${metrics.character_length}`,
    `time_length=${metrics.time_length}`,
    `artStyle_length=${metrics.artStyle_length}`,
    `token_density=${metrics.token_density}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_SCENARIO_QUALITY_REPORT_PATH,
  ...SCENARIO_TEST_SCENES.flatMap((spec) => [
    `${SCENARIO_TEST_OUTPUT_DIR}/${spec.json_filename}`,
    `${SCENARIO_TEST_OUTPUT_DIR}/${spec.readable_filename}`,
  ]),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_SCENARIO_QUALITY_PASS_VERDICT) {
  console.error('MOVIE SCENARIO QUALITY TEST VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
