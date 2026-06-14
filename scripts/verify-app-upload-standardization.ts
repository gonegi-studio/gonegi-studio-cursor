import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_UPLOAD_REPORT_PATH,
  UPLOAD_STANDARD_PASS_VERDICT,
  UPLOAD_STANDARD_SPEC_PATH,
  writeAppUploadStandardization,
} from '../services/appUploadStandardization.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeAppUploadStandardization(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `standardization_passed=${report.standardization_passed}`,
    `canonical_upload_ready=${summary.canonical_upload_ready}`,
    `image_app_upload_ready=${summary.image_app_upload_ready}`,
    `video_app_upload_ready=${summary.video_app_upload_ready}`,
    `critical_missing_count=${summary.critical_missing_count}`,
    `harvested_patterns_preserved=${summary.harvested_patterns_preserved}`,
    `export_coverage_regression_pass=${summary.export_coverage_regression_pass}`,
    `app_consumption_regression_pass=${summary.app_consumption_regression_pass}`,
    `legacy_harvest_regression_pass=${summary.legacy_harvest_regression_pass}`,
    `canonical_files_materialized=${summary.canonical_files_materialized}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

for (const rel of [UPLOAD_STANDARD_SPEC_PATH, CANONICAL_UPLOAD_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== UPLOAD_STANDARD_PASS_VERDICT) {
  console.error('APP UPLOAD STANDARDIZATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
