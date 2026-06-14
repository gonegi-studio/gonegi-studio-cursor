import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVIE_FACTORY_TEMPLATE_PATH } from '../services/movieDatasetBuilder.js';
import {
  MOVIE_FACTORY_EXPORT_ADAPTER_PATH,
  MOVIE_FACTORY_PASS_VERDICT,
  MOVIE_FACTORY_QUALITY_GATES_PATH,
  MOVIE_FACTORY_REGISTRY_PATH,
  MOVIE_FACTORY_REPORT_PATH,
  MOVIE_FACTORY_SCHEMA_PATH,
  MOVIE_RUNTIME_COMPOSITION_RULES_PATH,
  writeMovieDatasetFactory,
} from '../services/movieDatasetFactory.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieDatasetFactory(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `factory_passed=${report.factory_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `production_ready_movies=${summary.production_ready_movies}`,
    `template_ready_movies=${summary.template_ready_movies}`,
    `scene_geometry_score=${summary.scene_geometry_score}`,
    `semantic_anchor_score=${summary.semantic_anchor_score}`,
    `temporal_score=${summary.temporal_score}`,
    `motion_score=${summary.motion_score}`,
    `world_identity_lock=${summary.world_identity_lock}`,
    `generic_harbor_regression_count=${summary.generic_harbor_regression_count}`,
    `production_ready=${summary.production_ready}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_FACTORY_TEMPLATE_PATH,
  MOVIE_FACTORY_SCHEMA_PATH,
  MOVIE_FACTORY_REGISTRY_PATH,
  MOVIE_RUNTIME_COMPOSITION_RULES_PATH,
  MOVIE_FACTORY_QUALITY_GATES_PATH,
  MOVIE_FACTORY_EXPORT_ADAPTER_PATH,
  MOVIE_FACTORY_REPORT_PATH,
  'datasets/movie_factory/outputs/titanic-standardized-dataset.json',
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_FACTORY_PASS_VERDICT) {
  console.error('MOVIE DATASET FACTORY FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
