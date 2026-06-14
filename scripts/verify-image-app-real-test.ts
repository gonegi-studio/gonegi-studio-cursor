import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_APP_REAL_TEST_IMPORT_PATH,
  IMAGE_APP_REAL_TEST_OUTPUT_DIR,
  IMAGE_APP_REAL_TEST_PASS_VERDICT,
  IMAGE_APP_REAL_TEST_REPORT_PATH,
  IMAGE_APP_REAL_TEST_SCENES,
  writeImageAppRealTestReport,
} from '../services/imageAppRealTestAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeImageAppRealTestReport(projectRoot);
const { metrics, checklist_summary: checklistSummary } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `test_file=${report.test_file}`,
    `upstream_final_source_lock=${report.upstream_final_source_lock_verdict}`,
    `scenes_passed=${metrics.scenes_passed}/${metrics.scene_count}`,
    `checklist=${checklistSummary.passed_checks}/${checklistSummary.total_checks}`,
    `image_generation_count=${metrics.image_generation_count}`,
    `average_visual_quality_score=${metrics.average_visual_quality_score}`,
  ].join(' | ')
);

for (const rel of [
  IMAGE_APP_REAL_TEST_REPORT_PATH,
  IMAGE_APP_REAL_TEST_IMPORT_PATH,
  ...IMAGE_APP_REAL_TEST_SCENES.map(
    (spec) => `${IMAGE_APP_REAL_TEST_OUTPUT_DIR}/${spec.output_filename}`
  ),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== IMAGE_APP_REAL_TEST_PASS_VERDICT) {
  console.error('IMAGE APP REAL TEST VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
