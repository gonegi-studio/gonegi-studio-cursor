import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_FACTORY_VALIDATION_CONFIG_PATH,
  MOVIE_FACTORY_VALIDATION_PASS_VERDICT,
  MOVIE_FACTORY_VALIDATION_REPORT_PATH,
  writeMovieDatasetFactoryValidation,
} from '../services/movieDatasetFactoryValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieDatasetFactoryValidation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `factory_output_valid=${summary.factory_output_valid}`,
    `runtime_composition_valid=${summary.runtime_composition_valid}`,
    `image_adapter_valid=${summary.image_adapter_valid}`,
    `video_adapter_valid=${summary.video_adapter_valid}`,
    `movie_dataset_swap_valid=${summary.movie_dataset_swap_valid}`,
    `dataset_isolation_valid=${summary.dataset_isolation_valid}`,
    `world_identity_lock_valid=${summary.world_identity_lock_valid}`,
    `critical_missing_count=${summary.critical_missing_count}`,
    `factory_certified=${summary.factory_certified}`,
    `next_phase=${summary.next_phase}`,
  ].join(' | ')
);

for (const rel of [MOVIE_FACTORY_VALIDATION_CONFIG_PATH, MOVIE_FACTORY_VALIDATION_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_FACTORY_VALIDATION_PASS_VERDICT) {
  console.error('MOVIE DATASET FACTORY VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  for (const area of report.validation_areas.filter((a) => !a.passed)) {
    console.error(`AREA FAIL: ${area.area} missing=${area.missing.join(',')}`);
  }
  process.exit(1);
}

process.exit(0);
