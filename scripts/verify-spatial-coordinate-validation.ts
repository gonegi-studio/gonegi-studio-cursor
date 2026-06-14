import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SPATIAL_COORDINATE_SOURCE_PATH,
  SPATIAL_COORDINATE_TEST_A_PATH,
  SPATIAL_COORDINATE_TEST_B_PATH,
  SPATIAL_COORDINATE_VALIDATION_PASS_VERDICT,
  SPATIAL_COORDINATE_VALIDATION_REPORT_PATH,
  writeSpatialCoordinateValidationReport,
} from '../services/spatialCoordinateValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSpatialCoordinateValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `coordinate_test_created=${report.coordinate_test_created}`,
    `test_a_created=${report.test_a_created}`,
    `test_b_created=${report.test_b_created}`,
    `position_swap_applied=${report.position_swap_applied}`,
    `all_other_fields_identical=${report.all_other_fields_identical}`,
    `ready_for_manual_image_app_test=${report.ready_for_manual_image_app_test}`,
    `source=${SPATIAL_COORDINATE_SOURCE_PATH}`,
  ].join(' | ')
);

for (const rel of [
  SPATIAL_COORDINATE_SOURCE_PATH,
  SPATIAL_COORDINATE_TEST_A_PATH,
  SPATIAL_COORDINATE_TEST_B_PATH,
  SPATIAL_COORDINATE_VALIDATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SPATIAL_COORDINATE_VALIDATION_PASS_VERDICT) {
  console.error('SPATIAL COORDINATE VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
