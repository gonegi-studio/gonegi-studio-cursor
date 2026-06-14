import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_APP_EXPORT_OUTPUTS,
  MOVIE_IMAGE_APP_EXPORT_PASS_VERDICT,
  MOVIE_IMAGE_APP_EXPORT_REPORT_PATH,
  MOVIE_IMAGE_APP_EXPORT_SCHEMA_PATH,
} from '../services/movieImageAppExportBuilder.js';
import { writeMovieImageAppExportReport } from '../services/movieImageAppExportValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieImageAppExportReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `image_app_export_created=${report.image_app_export_created}`,
    `direct_generation_ready=${report.direct_generation_ready}`,
    `generation_payload_present=${report.generation_payload_present}`,
    `image_app_format_valid=${report.image_app_format_valid}`,
    `scenario_present=${report.scenario_present}`,
    `character_present=${report.character_present}`,
    `movie_count=${metrics.movie_count}`,
    `scene_count=${metrics.scene_count}`,
    `export_count=${metrics.export_count}`,
    `generation_ready_count=${metrics.generation_ready_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_IMAGE_APP_EXPORT_SCHEMA_PATH,
  MOVIE_IMAGE_APP_EXPORT_REPORT_PATH,
  ...IMAGE_APP_EXPORT_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_IMAGE_APP_EXPORT_PASS_VERDICT) {
  console.error('MOVIE IMAGE APP EXPORT VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
