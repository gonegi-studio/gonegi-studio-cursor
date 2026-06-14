import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RELEASE_MANIFEST_PATH,
  RELEASE_PACKAGE_PATH,
  RELEASE_REPORT_PATH,
} from '../services/movieAnalysisReleasePackage.js';
import {
  EXPECTED_SOURCE_COUNT,
  RUNTIME_CONSUMER_VALIDATION_MD_PATH,
  RUNTIME_CONSUMER_VALIDATION_PASS_VERDICT,
  RUNTIME_CONSUMER_VALIDATION_REPORT_PATH,
  writeMovieAnalysisRuntimeConsumerValidationReport,
} from '../services/movieAnalysisRuntimeConsumerValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [RELEASE_PACKAGE_PATH, RELEASE_MANIFEST_PATH, RELEASE_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisRuntimeConsumerValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} image_consumer_ready=${report.image_consumer_ready} video_consumer_ready=${report.video_consumer_ready} release_integrity=${report.release_integrity} trace_integrity=${report.trace_integrity} safety_integrity=${report.safety_integrity} runtime_consumer_validation_only=${report.runtime_consumer_validation_only_status}`
);
for (const audit of report.image_consumer_audits) {
  console.log(
    `  image ${audit.source_video_id}: character=${audit.character_payload_present} emotion=${audit.emotion_payload_present} chain=${audit.chain_ids_present} trace=${audit.package_trace_present} safety=${audit.safety_flags_present}`
  );
}
for (const audit of report.video_consumer_audits) {
  console.log(
    `  video ${audit.source_video_id}: scene=${audit.scene_payload_present} camera=${audit.camera_payload_present} transition=${audit.transition_payload_present} continuity=${audit.continuity_payload_present} runtime=${audit.runtime_bundle_present} chain=${audit.chain_ids_present} trace=${audit.package_trace_present}`
  );
}
console.log(`report=${RUNTIME_CONSUMER_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${RUNTIME_CONSUMER_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== RUNTIME_CONSUMER_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.image_consumer_ready !== 'PASS' ||
  report.video_consumer_ready !== 'PASS' ||
  report.release_integrity !== 'PASS' ||
  report.trace_integrity !== 'PASS' ||
  report.safety_integrity !== 'PASS' ||
  report.runtime_consumer_validation_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 image_consumer_ready=PASS video_consumer_ready=PASS release_integrity=PASS trace_integrity=PASS safety_integrity=PASS runtime_consumer_validation_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
