import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATASET_PATH } from '../services/movieAnalysisDatasetExport.js';
import {
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
} from '../services/movieAnalysisDatasetConsumerBridge.js';
import {
  EXPECTED_SOURCE_COUNT,
  IMAGE_UPLOAD_PATH,
  UPLOAD_BUNDLE_PASS_VERDICT,
  UPLOAD_MANIFEST_PATH,
  UPLOAD_REPORT_PATH,
  VIDEO_UPLOAD_PATH,
  writeMovieAnalysisUploadBundle,
} from '../services/movieAnalysisUploadBundle.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
  DATASET_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisUploadBundle(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} image_upload_ready=${report.image_upload_ready} video_upload_ready=${report.video_upload_ready} dataset_linked=${report.dataset_linked} bridge_trace_preserved=${report.bridge_trace_preserved} safety_flags_preserved=${report.safety_flags_preserved}`
);
console.log(`image_upload=${IMAGE_UPLOAD_PATH}`);
console.log(`video_upload=${VIDEO_UPLOAD_PATH}`);
console.log(`manifest=${UPLOAD_MANIFEST_PATH}`);
console.log(`report=${UPLOAD_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== UPLOAD_BUNDLE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.image_upload_ready !== true ||
  report.video_upload_ready !== true ||
  report.dataset_linked !== true ||
  report.bridge_trace_preserved !== true ||
  report.safety_flags_preserved !== true
) {
  console.error(
    'Expected source_count=4 image_upload_ready=true video_upload_ready=true dataset_linked=true bridge_trace_preserved=true safety_flags_preserved=true'
  );
  process.exit(1);
}

process.exit(0);
