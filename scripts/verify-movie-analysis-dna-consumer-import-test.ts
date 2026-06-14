import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_IMAGE_BRIDGE_PATH,
  DNA_VIDEO_BRIDGE_PATH,
} from '../services/movieAnalysisDnaConsumerBridge.js';
import {
  DNA_CONSUMER_IMPORT_TEST_MD_PATH,
  DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT,
  DNA_CONSUMER_IMPORT_TEST_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaConsumerImportTestReport,
} from '../services/movieAnalysisDnaConsumerImportTest.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [DNA_IMAGE_BRIDGE_PATH, DNA_VIDEO_BRIDGE_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisDnaConsumerImportTestReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} image_importable=${report.image_importable} video_importable=${report.video_importable} mapping_integrity=${report.mapping_integrity} traceability_integrity=${report.traceability_integrity} consumer_import_ready=${report.consumer_import_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: image=${audit.image_importable} video=${audit.video_importable} mapping=${audit.mapping_integrity} trace=${audit.traceability_integrity} import=${audit.import_ready}`
  );
}
console.log(`report=${DNA_CONSUMER_IMPORT_TEST_REPORT_PATH}`);
console.log(`markdown=${DNA_CONSUMER_IMPORT_TEST_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.image_importable !== 'PASS' ||
  report.video_importable !== 'PASS' ||
  report.mapping_integrity !== 'PASS' ||
  report.traceability_integrity !== 'PASS' ||
  report.consumer_import_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 image_importable=PASS video_importable=PASS mapping_integrity=PASS traceability_integrity=PASS consumer_import_ready=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
