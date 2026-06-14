import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SPATIAL_AB_TEST_OUTPUT_PATH,
  SPATIAL_AB_TEST_PASS_VERDICT,
  SPATIAL_AB_TEST_REPORT_PATH,
  writeSpatialAbTestReport,
} from '../services/imageAppSpatialAbTestValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSpatialAbTestReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `ab_test_ready=${report.ab_test_ready}`,
    `scene_count=${report.scene_count}`,
    `character_swap_only=${report.character_swap_only}`,
    `environment_locked=${report.environment_locked}`,
    `prop_locked=${report.prop_locked}`,
    `camera_locked=${report.camera_locked}`,
    `ready_for_manual_image_generation=${report.ready_for_manual_image_generation}`,
    `output=${SPATIAL_AB_TEST_OUTPUT_PATH}`,
  ].join(' | ')
);

for (const rel of [SPATIAL_AB_TEST_OUTPUT_PATH, SPATIAL_AB_TEST_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SPATIAL_AB_TEST_PASS_VERDICT) {
  console.error('SPATIAL AB TEST VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
