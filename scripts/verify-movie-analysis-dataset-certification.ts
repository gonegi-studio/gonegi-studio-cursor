import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELEASE_PACKAGE_PATH } from '../services/movieAnalysisReleasePackage.js';
import {
  CERTIFICATION_STATUS_MESSAGE,
  DATASET_CERTIFICATION_MD_PATH,
  DATASET_CERTIFICATION_PASS_VERDICT,
  DATASET_CERTIFICATION_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDatasetCertificationReport,
} from '../services/movieAnalysisDatasetCertification.js';
import { RUNTIME_CONSUMER_VALIDATION_REPORT_PATH } from '../services/movieAnalysisRuntimeConsumerValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [RELEASE_PACKAGE_PATH, RUNTIME_CONSUMER_VALIDATION_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisDatasetCertificationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} certification_ready=${report.certification_ready} image_app_certified=${report.image_app_certified} video_app_certified=${report.video_app_certified} dataset_certified=${report.dataset_certified} traceability_certified=${report.traceability_certified} safety_certified=${report.safety_certified}`
);
if (report.certification_status_message) {
  console.log(report.certification_status_message);
}
console.log(`report=${DATASET_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${DATASET_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DATASET_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.certification_ready !== 'PASS' ||
  report.image_app_certified !== 'PASS' ||
  report.video_app_certified !== 'PASS' ||
  report.dataset_certified !== 'PASS' ||
  report.traceability_certified !== 'PASS' ||
  report.safety_certified !== 'PASS' ||
  report.certification_status_message !== CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    `Expected source_count=4 certification_ready=PASS image_app_certified=PASS video_app_certified=PASS dataset_certified=PASS traceability_certified=PASS safety_certified=PASS ${CERTIFICATION_STATUS_MESSAGE}`
  );
  process.exit(1);
}

process.exit(0);
