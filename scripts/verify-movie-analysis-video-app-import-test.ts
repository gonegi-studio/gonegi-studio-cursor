import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIDEO_APP_BRIDGE_PATH } from '../services/movieAnalysisVideoAppBridge.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  VIDEO_APP_IMPORT_TEST_MD_PATH,
  VIDEO_APP_IMPORT_TEST_PASS_VERDICT,
  VIDEO_APP_IMPORT_TEST_REPORT_PATH,
  writeMovieAnalysisVideoAppImportTestReport,
} from '../services/movieAnalysisVideoAppImportTest.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_APP_BRIDGE_PATH))) {
  console.error(`Missing required upstream asset: ${VIDEO_APP_BRIDGE_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisVideoAppImportTestReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} source_count_valid=${report.source_count_valid} adapter_count_valid=${report.adapter_count_valid} scene_adapter_import=${report.scene_adapter_import} camera_adapter_import=${report.camera_adapter_import} emotion_adapter_import=${report.emotion_adapter_import} transition_adapter_import=${report.transition_adapter_import} continuity_adapter_import=${report.continuity_adapter_import} storytelling_adapter_import=${report.storytelling_adapter_import} traceability_preserved=${report.traceability_preserved} video_app_import_ready=${report.video_app_import_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_adapter_import} camera=${audit.camera_adapter_import} emotion=${audit.emotion_adapter_import} transition=${audit.transition_adapter_import} continuity=${audit.continuity_adapter_import} storytelling=${audit.storytelling_adapter_import} trace=${audit.traceability_preserved} import=${audit.import_ready}`
  );
}
console.log(`report=${VIDEO_APP_IMPORT_TEST_REPORT_PATH}`);
console.log(`markdown=${VIDEO_APP_IMPORT_TEST_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_APP_IMPORT_TEST_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.source_count_valid !== 'PASS' ||
  report.adapter_count_valid !== 'PASS' ||
  report.scene_adapter_import !== 'PASS' ||
  report.camera_adapter_import !== 'PASS' ||
  report.emotion_adapter_import !== 'PASS' ||
  report.transition_adapter_import !== 'PASS' ||
  report.continuity_adapter_import !== 'PASS' ||
  report.storytelling_adapter_import !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.video_app_import_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 adapter_count=24 source_count_valid=PASS adapter_count_valid=PASS all adapter imports=PASS traceability_preserved=PASS video_app_import_ready=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
