import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_CONSUMER_IMPORT_TEST_REPORT_PATH,
} from '../services/movieAnalysisDnaConsumerImportTest.js';
import {
  DNA_IMAGE_BRIDGE_PATH,
  DNA_VIDEO_BRIDGE_PATH,
} from '../services/movieAnalysisDnaConsumerBridge.js';
import { DNA_PACKAGE_PATH } from '../services/movieAnalysisDnaPackaging.js';
import {
  DNA_RELEASE_MANIFEST_PATH,
  DNA_RELEASE_PACKAGE_PASS_VERDICT,
  DNA_RELEASE_PACKAGE_PATH,
  DNA_RELEASE_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaReleasePackage,
} from '../services/movieAnalysisDnaReleasePackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  DNA_PACKAGE_PATH,
  DNA_IMAGE_BRIDGE_PATH,
  DNA_VIDEO_BRIDGE_PATH,
  DNA_CONSUMER_IMPORT_TEST_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisDnaReleasePackage(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} dna_package_linked=${report.dna_package_linked} image_bridge_linked=${report.image_bridge_linked} video_bridge_linked=${report.video_bridge_linked} import_test_linked=${report.import_test_linked} source_ids_preserved=${report.source_ids_preserved} adapter_ids_preserved=${report.adapter_ids_preserved} traceability_preserved=${report.traceability_preserved} certification_status_preserved=${report.certification_status_preserved} release_ready=${report.release_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: source_ids=${audit.source_ids_preserved} adapter_ids=${audit.adapter_ids_preserved} trace=${audit.traceability_preserved} certification=${audit.certification_status_preserved} source_ready=${audit.source_release_ready}`
  );
}
console.log(`package=${DNA_RELEASE_PACKAGE_PATH}`);
console.log(`manifest=${DNA_RELEASE_MANIFEST_PATH}`);
console.log(`report=${DNA_RELEASE_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_RELEASE_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.dna_package_linked !== 'PASS' ||
  report.image_bridge_linked !== 'PASS' ||
  report.video_bridge_linked !== 'PASS' ||
  report.import_test_linked !== 'PASS' ||
  report.source_ids_preserved !== 'PASS' ||
  report.adapter_ids_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.certification_status_preserved !== 'PASS' ||
  report.release_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 dna_package_linked=PASS image_bridge_linked=PASS video_bridge_linked=PASS import_test_linked=PASS source_ids_preserved=PASS adapter_ids_preserved=PASS traceability_preserved=PASS certification_status_preserved=PASS release_ready=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
