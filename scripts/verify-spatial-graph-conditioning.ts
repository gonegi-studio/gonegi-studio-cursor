import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SPATIAL_GRAPH_CONDITIONING_PASS_VERDICT,
  SPATIAL_GRAPH_CONDITIONING_REPORT_PATH,
  writeSpatialGraphConditioningReport,
} from '../services/spatialGraphConditioningValidation.js';
import {
  SPATIAL_COORDINATE_TEST_A_PATH,
  SPATIAL_COORDINATE_TEST_B_PATH,
} from '../services/spatialCoordinateValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSpatialGraphConditioningReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `character_conditioning_active=${report.character_conditioning_active}`,
    `environment_conditioning_active=${report.environment_conditioning_active}`,
    `prop_conditioning_active=${report.prop_conditioning_active}`,
    `camera_conditioning_active=${report.camera_conditioning_active}`,
    `gaze_conditioning_active=${report.gaze_conditioning_active}`,
    `spatial_consistency_memory_active=${report.spatial_consistency_memory_active}`,
    `movie_reconstruction_accuracy_improved=${report.movie_reconstruction_accuracy_improved}`,
    `gonagi_region=${report.coordinate_test_validation.gonagi_region_a}->${report.coordinate_test_validation.gonagi_region_b}`,
    `dana_region=${report.coordinate_test_validation.dana_region_a}->${report.coordinate_test_validation.dana_region_b}`,
    `layout_mirrors=${report.coordinate_test_validation.character_layout_mirrors}`,
  ].join(' | ')
);

for (const rel of [
  SPATIAL_GRAPH_CONDITIONING_REPORT_PATH,
  SPATIAL_COORDINATE_TEST_A_PATH,
  SPATIAL_COORDINATE_TEST_B_PATH,
  'src/spatial_conditioning/SpatialConditioningEngine.ts',
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SPATIAL_GRAPH_CONDITIONING_PASS_VERDICT) {
  console.error('SPATIAL GRAPH CONDITIONING VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
