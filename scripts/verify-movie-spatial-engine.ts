import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_SPATIAL_ENGINE_PASS_VERDICT,
  MOVIE_SPATIAL_ENGINE_REPORT_PATH,
  MOVIE_SPATIAL_ENGINE_SCHEMA_PATH,
  SPATIAL_ENGINE_OUTPUTS,
} from '../services/movieSpatialEngineBuilder.js';
import { writeMovieSpatialEngineReport } from '../services/movieSpatialEngineValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieSpatialEngineReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `spatial_engine_created=${report.spatial_engine_created}`,
    `camera_coordinates_present=${report.camera_coordinates_present}`,
    `character_coordinates_present=${report.character_coordinates_present}`,
    `prop_coordinates_present=${report.prop_coordinates_present}`,
    `gaze_vectors_present=${report.gaze_vectors_present}`,
    `spatial_depth_present=${report.spatial_depth_present}`,
    `movie_count=${metrics.movie_count}`,
    `scene_count=${metrics.scene_count}`,
    `camera_count=${metrics.camera_count}`,
    `character_coordinate_count=${metrics.character_coordinate_count}`,
    `prop_coordinate_count=${metrics.prop_coordinate_count}`,
    `gaze_vector_count=${metrics.gaze_vector_count}`,
    `spatial_depth_count=${metrics.spatial_depth_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_SPATIAL_ENGINE_SCHEMA_PATH,
  MOVIE_SPATIAL_ENGINE_REPORT_PATH,
  ...SPATIAL_ENGINE_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_SPATIAL_ENGINE_PASS_VERDICT) {
  console.error('MOVIE SPATIAL ENGINE VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
