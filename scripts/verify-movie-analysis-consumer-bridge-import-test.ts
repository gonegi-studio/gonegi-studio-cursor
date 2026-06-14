import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONSUMER_BRIDGE_IMPORT_TEST_MD_PATH,
  CONSUMER_BRIDGE_IMPORT_TEST_PASS_VERDICT,
  CONSUMER_BRIDGE_IMPORT_TEST_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisConsumerBridgeImportTestReport,
} from '../services/movieAnalysisConsumerBridgeImportTest.js';
import {
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
} from '../services/movieAnalysisDatasetConsumerBridge.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [IMAGE_CONSUMER_BRIDGE_PATH, VIDEO_CONSUMER_BRIDGE_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisConsumerBridgeImportTestReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} image_bridge_importable=${report.image_bridge_importable} video_bridge_importable=${report.video_bridge_importable} payload_mapping_valid=${report.payload_mapping_valid} chain_ids_valid=${report.chain_ids_valid} package_trace_valid=${report.package_trace_valid} safety_flags_valid=${report.safety_flags_valid}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: image=${audit.image_bridge_importable} video=${audit.video_bridge_importable} payload=${audit.payload_mapping_valid} chain=${audit.chain_ids_valid} trace=${audit.package_trace_valid} safety=${audit.safety_flags_valid}`
  );
}
console.log(`report=${CONSUMER_BRIDGE_IMPORT_TEST_REPORT_PATH}`);
console.log(`markdown=${CONSUMER_BRIDGE_IMPORT_TEST_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CONSUMER_BRIDGE_IMPORT_TEST_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.image_bridge_importable !== true ||
  report.video_bridge_importable !== true ||
  report.payload_mapping_valid !== true ||
  report.chain_ids_valid !== true ||
  report.package_trace_valid !== true ||
  report.safety_flags_valid !== true
) {
  console.error(
    'Expected source_count=4 image_bridge_importable=true video_bridge_importable=true payload_mapping_valid=true chain_ids_valid=true package_trace_valid=true safety_flags_valid=true'
  );
  process.exit(1);
}

process.exit(0);
