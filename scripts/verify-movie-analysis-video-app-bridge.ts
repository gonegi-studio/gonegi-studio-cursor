import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  VIDEO_APP_BRIDGE_PASS_VERDICT,
  VIDEO_APP_BRIDGE_PATH,
  VIDEO_APP_BRIDGE_REPORT_PATH,
  writeMovieAnalysisVideoAppBridge,
} from '../services/movieAnalysisVideoAppBridge.js';
import { DNA_RELEASE_PACKAGE_PATH } from '../services/movieAnalysisDnaReleasePackage.js';
import { PRODUCTION_READY_CERTIFICATION_REPORT_PATH } from '../services/movieAnalysisProductionReadyCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  PRODUCTION_READY_CERTIFICATION_REPORT_PATH,
  DNA_RELEASE_PACKAGE_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const { bridge, report } = writeMovieAnalysisVideoAppBridge(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} production_ready_linked=${report.production_ready_linked} release_package_linked=${report.release_package_linked} scene_adapter_mapped=${report.scene_adapter_mapped} camera_adapter_mapped=${report.camera_adapter_mapped} emotion_adapter_mapped=${report.emotion_adapter_mapped} transition_adapter_mapped=${report.transition_adapter_mapped} continuity_adapter_mapped=${report.continuity_adapter_mapped} storytelling_adapter_mapped=${report.storytelling_adapter_mapped} traceability_preserved=${report.traceability_preserved} video_app_bridge_ready=${report.video_app_bridge_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_adapter_mapped} camera=${audit.camera_adapter_mapped} emotion=${audit.emotion_adapter_mapped} transition=${audit.transition_adapter_mapped} continuity=${audit.continuity_adapter_mapped} storytelling=${audit.storytelling_adapter_mapped} trace=${audit.traceability_preserved} ready=${audit.source_bridge_ready}`
  );
}
console.log(`bridge=${VIDEO_APP_BRIDGE_PATH} entries=${bridge.entries.length}`);
console.log(`report=${VIDEO_APP_BRIDGE_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_APP_BRIDGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.production_ready_linked !== 'PASS' ||
  report.release_package_linked !== 'PASS' ||
  report.scene_adapter_mapped !== 'PASS' ||
  report.camera_adapter_mapped !== 'PASS' ||
  report.emotion_adapter_mapped !== 'PASS' ||
  report.transition_adapter_mapped !== 'PASS' ||
  report.continuity_adapter_mapped !== 'PASS' ||
  report.storytelling_adapter_mapped !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.video_app_bridge_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 adapter_count=24 production_ready_linked=PASS release_package_linked=PASS all adapters mapped traceability_preserved=PASS video_app_bridge_ready=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
