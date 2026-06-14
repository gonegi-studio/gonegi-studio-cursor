import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_SOURCE_COUNT,
  RELEASE_MANIFEST_PATH,
  RELEASE_PACKAGE_PASS_VERDICT,
  RELEASE_PACKAGE_PATH,
  RELEASE_REPORT_PATH,
  writeMovieAnalysisReleasePackage,
} from '../services/movieAnalysisReleasePackage.js';
import { UPLOAD_BUNDLE_DIR } from '../services/movieAnalysisUploadBundle.js';
import { UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH } from '../services/movieAnalysisUploadBundleQualityGate.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, UPLOAD_BUNDLE_DIR))) {
  console.error(`Missing required upstream asset: ${UPLOAD_BUNDLE_DIR}/`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisReleasePackage(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} release_package_complete=${report.release_package_complete} upload_bundle_linked=${report.upload_bundle_linked} quality_gate_passed=${report.quality_gate_passed} image_upload_ready=${report.image_upload_ready} video_upload_ready=${report.video_upload_ready} safety_flags_preserved=${report.safety_flags_preserved} version_ready=${report.version_ready}`
);
console.log(`package=${RELEASE_PACKAGE_PATH}`);
console.log(`manifest=${RELEASE_MANIFEST_PATH}`);
console.log(`report=${RELEASE_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== RELEASE_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.release_package_complete !== true ||
  report.upload_bundle_linked !== true ||
  report.quality_gate_passed !== true ||
  report.image_upload_ready !== true ||
  report.video_upload_ready !== true ||
  report.safety_flags_preserved !== true ||
  report.version_ready !== true
) {
  console.error(
    'Expected source_count=4 release_package_complete=true upload_bundle_linked=true quality_gate_passed=true image_upload_ready=true video_upload_ready=true safety_flags_preserved=true version_ready=true'
  );
  process.exit(1);
}

process.exit(0);
