import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_APP_NATIVE_IMPORT_OUTPUTS,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_REPORT_PATH,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_SCHEMA_PATH,
} from '../services/movieImageAppNativeImportBuilder.js';
import { writeMovieImageAppNativeImportReport } from '../services/movieImageAppNativeImportValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieImageAppNativeImportReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `native_import_created=${report.native_import_created}`,
    `music_drama_import_ready=${report.music_drama_import_ready}`,
    `image_generation_ready=${report.image_generation_ready}`,
    `slots_present=${report.slots_present}`,
    `slot_count=${report.slot_count}`,
    `artStyle_present=${report.artStyle_present}`,
    `timeSetting_present=${report.timeSetting_present}`,
    `scenario_present=${report.scenario_present}`,
    `character_present=${report.character_present}`,
    `native_import_format_valid=${report.native_import_format_valid}`,
    `movie_count=${metrics.movie_count}`,
    `export_count=${metrics.export_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_IMAGE_APP_NATIVE_IMPORT_SCHEMA_PATH,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_REPORT_PATH,
  ...IMAGE_APP_NATIVE_IMPORT_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT) {
  console.error('MOVIE IMAGE APP NATIVE IMPORT VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
