import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_CONSUMER_BRIDGE_PASS_VERDICT,
  DNA_CONSUMER_BRIDGE_REPORT_PATH,
  DNA_IMAGE_BRIDGE_PATH,
  DNA_VIDEO_BRIDGE_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaConsumerBridge,
} from '../services/movieAnalysisDnaConsumerBridge.js';
import { writeMovieAnalysisDnaConsumerBridgeValidationReport } from '../services/movieAnalysisDnaConsumerBridgeValidator.js';
import { DNA_PACKAGE_PATH } from '../services/movieAnalysisDnaPackaging.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, DNA_PACKAGE_PATH))) {
  console.error(`Missing required upstream asset: ${DNA_PACKAGE_PATH}`);
  process.exit(1);
}

const { imageBridge, videoBridge } = writeMovieAnalysisDnaConsumerBridge(projectRoot);
const report = writeMovieAnalysisDnaConsumerBridgeValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} image_bridge_valid=${report.image_bridge_valid} video_bridge_valid=${report.video_bridge_valid} adapter_mapping_preserved=${report.adapter_mapping_preserved} traceability_preserved=${report.traceability_preserved} consumer_ready=${report.consumer_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: image=${audit.image_bridge_valid} video=${audit.video_bridge_valid} mapping=${audit.adapter_mapping_preserved} trace=${audit.traceability_preserved} consumer=${audit.consumer_ready}`
  );
}
console.log(`image_bridge=${DNA_IMAGE_BRIDGE_PATH} entries=${imageBridge.entries.length}`);
console.log(`video_bridge=${DNA_VIDEO_BRIDGE_PATH} entries=${videoBridge.entries.length}`);
console.log(`report=${DNA_CONSUMER_BRIDGE_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_CONSUMER_BRIDGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.image_bridge_valid !== 'PASS' ||
  report.video_bridge_valid !== 'PASS' ||
  report.adapter_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.consumer_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 image_bridge_valid=PASS video_bridge_valid=PASS adapter_mapping_preserved=PASS traceability_preserved=PASS consumer_ready=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
