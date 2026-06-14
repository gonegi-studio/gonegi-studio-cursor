import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_DATASET_REGISTRY_PATH,
  MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
  MOVIE_DATASET_SEPARATION_PASS_VERDICT,
  MOVIE_DATASET_SEPARATION_REPORT_PATH,
  TITANIC_MOVIE_DATASET_BUNDLE_PATH,
  writeMovieDatasetSeparation,
} from '../services/movieDatasetSeparation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieDatasetSeparation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `separation_passed=${report.separation_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `latest_v5_contains_movie_dataset=${summary.latest_v5_contains_movie_dataset}`,
    `movie_dataset_registry_exists=${summary.movie_dataset_registry_exists}`,
    `runtime_composition_ready=${summary.runtime_composition_ready}`,
    `world_identity_lock=${summary.world_identity_lock}`,
    `movie_dataset_swappable=${summary.movie_dataset_swappable}`,
    `future_movie_dataset_count=${summary.future_movie_dataset_count}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_DATASET_REGISTRY_PATH,
  MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
  TITANIC_MOVIE_DATASET_BUNDLE_PATH,
  MOVIE_DATASET_SEPARATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_DATASET_SEPARATION_PASS_VERDICT) {
  console.error('MOVIE DATASET SEPARATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
