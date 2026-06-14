import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MASTER_SCENARIO_PACKAGE_OUTPUTS,
  MOVIE_MASTER_SCENARIO_PACKAGE_PASS_VERDICT,
  MOVIE_MASTER_SCENARIO_PACKAGE_REPORT_PATH,
  MOVIE_MASTER_SCENARIO_PACKAGE_SCHEMA_PATH,
} from '../services/movieMasterScenarioPackageBuilder.js';
import { writeMovieMasterScenarioPackageReport } from '../services/movieMasterScenarioPackageValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieMasterScenarioPackageReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `master_package_created=${report.master_package_created}`,
    `image_app_direct_input_ready=${report.image_app_direct_input_ready}`,
    `art_style_present=${report.art_style_present}`,
    `time_setting_present=${report.time_setting_present}`,
    `character_profiles_present=${report.character_profiles_present}`,
    `serialized_scenario_present=${report.serialized_scenario_present}`,
    `master_scenario_present=${report.master_scenario_present}`,
    `generation_ready=${report.generation_ready}`,
    `movie_count=${metrics.movie_count}`,
    `scene_count=${metrics.scene_count}`,
    `master_package_count=${metrics.master_package_count}`,
    `generation_ready_count=${metrics.generation_ready_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_MASTER_SCENARIO_PACKAGE_SCHEMA_PATH,
  MOVIE_MASTER_SCENARIO_PACKAGE_REPORT_PATH,
  ...MASTER_SCENARIO_PACKAGE_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_MASTER_SCENARIO_PACKAGE_PASS_VERDICT) {
  console.error('MOVIE MASTER SCENARIO PACKAGE VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
