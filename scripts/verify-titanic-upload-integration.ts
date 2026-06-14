import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_TITANIC_BUNDLE_PATH,
  MOVIE_RECONSTRUCTION_CONSUMPTION_CONTRACT_PATH,
  SHARED_TITANIC_BUNDLE_PATH,
  TITANIC_UPLOAD_INTEGRATION_PASS_VERDICT,
  TITANIC_UPLOAD_INTEGRATION_REPORT_PATH,
  VIDEO_TITANIC_BUNDLE_PATH,
  writeTitanicUploadIntegrationAudit,
} from '../services/titanicUploadIntegrationAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTitanicUploadIntegrationAudit(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `integration_passed=${report.integration_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `titanic_dataset_exported=${summary.titanic_dataset_exported}`,
    `image_app_registered=${summary.image_app_registered}`,
    `video_app_registered=${summary.video_app_registered}`,
    `upload_package_registered=${summary.upload_package_registered}`,
    `consumption_contract_ready=${summary.consumption_contract_ready}`,
    `movie_reconstruction_metadata_ready=${summary.movie_reconstruction_metadata_ready}`,
    `critical_missing_count=${summary.critical_missing_count}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

for (const rel of [
  SHARED_TITANIC_BUNDLE_PATH,
  IMAGE_TITANIC_BUNDLE_PATH,
  VIDEO_TITANIC_BUNDLE_PATH,
  MOVIE_RECONSTRUCTION_CONSUMPTION_CONTRACT_PATH,
  TITANIC_UPLOAD_INTEGRATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TITANIC_UPLOAD_INTEGRATION_PASS_VERDICT) {
  console.error('TITANIC UPLOAD INTEGRATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
