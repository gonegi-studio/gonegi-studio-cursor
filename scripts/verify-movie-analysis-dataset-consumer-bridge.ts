import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATASET_PATH, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDatasetExport.js';
import {
  CONSUMER_BRIDGE_PASS_VERDICT,
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
  writeMovieAnalysisDatasetConsumerBridge,
} from '../services/movieAnalysisDatasetConsumerBridge.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, DATASET_PATH))) {
  console.error(`Missing required upstream asset: ${DATASET_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisDatasetConsumerBridge(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} image_consumer_bridge_ready=${report.image_consumer_bridge_ready} video_consumer_bridge_ready=${report.video_consumer_bridge_ready} payload_mapping_valid=${report.payload_mapping_valid} chain_ids_preserved=${report.chain_ids_preserved} safety_flags_preserved=${report.safety_flags_preserved}`
);
console.log(`image_bridge=${IMAGE_CONSUMER_BRIDGE_PATH}`);
console.log(`video_bridge=${VIDEO_CONSUMER_BRIDGE_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CONSUMER_BRIDGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.image_consumer_bridge_ready !== true ||
  report.video_consumer_bridge_ready !== true ||
  report.payload_mapping_valid !== true ||
  report.chain_ids_preserved !== true ||
  report.safety_flags_preserved !== true
) {
  console.error(
    'Expected source_count=4 image_consumer_bridge_ready=true video_consumer_bridge_ready=true payload_mapping_valid=true chain_ids_preserved=true safety_flags_preserved=true'
  );
  process.exit(1);
}

process.exit(0);
