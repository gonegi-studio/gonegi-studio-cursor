import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MASTER_DATASET_BINDING_OUTPUTS,
  MOVIE_MASTER_DATASET_BINDING_PASS_VERDICT,
  MOVIE_MASTER_DATASET_BINDING_REPORT_PATH,
  MOVIE_MASTER_DATASET_BINDING_SCHEMA_PATH,
} from '../services/movieMasterDatasetBinding.js';
import { writeMovieMasterDatasetBindingReport } from '../services/movieMasterDatasetBindingValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieMasterDatasetBindingReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `master_binding_complete=${report.master_binding_complete}`,
    `master_style_locked=${report.master_style_locked}`,
    `time_library_locked=${report.time_library_locked}`,
    `character_library_locked=${report.character_library_locked}`,
    `scenario_generation_only=${report.scenario_generation_only}`,
    `image_app_native_format_ready=${report.image_app_native_format_ready}`,
    `art_style_generated=${report.art_style_generated}`,
    `time_setting_generated=${report.time_setting_generated}`,
    `character_generated=${report.character_generated}`,
    `scenario_generated=${report.scenario_generated}`,
    `scene_count=${metrics.scene_count}`,
    `master_style_binding_count=${metrics.master_style_binding_count}`,
    `time_binding_count=${metrics.time_binding_count}`,
    `character_binding_count=${metrics.character_binding_count}`,
    `generated_scenario_count=${metrics.generated_scenario_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_MASTER_DATASET_BINDING_SCHEMA_PATH,
  MOVIE_MASTER_DATASET_BINDING_REPORT_PATH,
  ...MASTER_DATASET_BINDING_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_MASTER_DATASET_BINDING_PASS_VERDICT) {
  console.error('MOVIE MASTER DATASET BINDING VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
