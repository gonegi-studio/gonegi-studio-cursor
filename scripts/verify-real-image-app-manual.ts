import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_IMAGE_APP_MANUAL_IMPORT_PATH,
  REAL_IMAGE_APP_MANUAL_INTAKE_PATH,
  REAL_IMAGE_APP_MANUAL_OUTPUT_DIR,
  REAL_IMAGE_APP_MANUAL_PASS_VERDICT,
  REAL_IMAGE_APP_MANUAL_REPORT_PATH,
  REAL_IMAGE_APP_MANUAL_SCENES,
  writeRealImageAppManualReport,
} from '../services/realImageAppManualValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeRealImageAppManualReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `manual_validation_complete=${report.manual_validation_complete}`,
    `real_application_output_verified=${report.real_application_output_verified}`,
    `human_review_complete=${report.human_review_complete}`,
    `native_import=${REAL_IMAGE_APP_MANUAL_IMPORT_PATH}`,
    `real_output_count=${metrics.real_output_count}/${metrics.scene_count}`,
    `scenes_passed=${metrics.scenes_passed}/${metrics.scene_count}`,
    `average_scene_score=${metrics.average_scene_score}`,
  ].join(' | ')
);

for (const rel of [
  REAL_IMAGE_APP_MANUAL_REPORT_PATH,
  REAL_IMAGE_APP_MANUAL_INTAKE_PATH,
  REAL_IMAGE_APP_MANUAL_IMPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== REAL_IMAGE_APP_MANUAL_PASS_VERDICT) {
  console.error('REAL IMAGE APP MANUAL VALIDATION FAILED');
  console.error(`Complete human test, save PNGs to ${REAL_IMAGE_APP_MANUAL_OUTPUT_DIR}/, then update ${REAL_IMAGE_APP_MANUAL_INTAKE_PATH}`);
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

for (const spec of REAL_IMAGE_APP_MANUAL_SCENES) {
  const rel = `${REAL_IMAGE_APP_MANUAL_OUTPUT_DIR}/${spec.output_filename}`;
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

process.exit(0);
