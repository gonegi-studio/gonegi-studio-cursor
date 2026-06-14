import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CINEMATIC_DNA_INTEGRATION_MD_PATH,
  CINEMATIC_DNA_INTEGRATION_PASS_VERDICT,
  CINEMATIC_DNA_INTEGRATION_PATH,
  CINEMATIC_DNA_INTEGRATION_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisCinematicDnaIntegration,
} from '../services/movieAnalysisCinematicDnaIntegration.js';
import { writeMovieAnalysisCinematicDnaIntegrationValidationReport } from '../services/movieAnalysisCinematicDnaIntegrationValidator.js';
import {
  CINEMATIC_DNA_PATH,
  CINEMATIC_DNA_REPORT_PATH,
} from '../services/movieAnalysisCinematicDnaExtraction.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [CINEMATIC_DNA_PATH, CINEMATIC_DNA_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const integration = writeMovieAnalysisCinematicDnaIntegration(projectRoot);
const report = writeMovieAnalysisCinematicDnaIntegrationValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} scene_mapping=${report.scene_mapping} camera_mapping=${report.camera_mapping} emotion_mapping=${report.emotion_mapping} transition_mapping=${report.transition_mapping} continuity_mapping=${report.continuity_mapping} image_app_mapping=${report.image_app_mapping} video_app_mapping=${report.video_app_mapping} integration_complete=${report.integration_complete} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_mapping} camera=${audit.camera_mapping} emotion=${audit.emotion_mapping} transition=${audit.transition_mapping} continuity=${audit.continuity_mapping} image=${audit.image_app_mapping} video=${audit.video_app_mapping}`
  );
}
console.log(`integration=${CINEMATIC_DNA_INTEGRATION_PATH} entries=${integration.entries.length}`);
console.log(`report=${CINEMATIC_DNA_INTEGRATION_REPORT_PATH}`);
console.log(`markdown=${CINEMATIC_DNA_INTEGRATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CINEMATIC_DNA_INTEGRATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.scene_mapping !== 'PASS' ||
  report.camera_mapping !== 'PASS' ||
  report.emotion_mapping !== 'PASS' ||
  report.transition_mapping !== 'PASS' ||
  report.continuity_mapping !== 'PASS' ||
  report.image_app_mapping !== 'PASS' ||
  report.video_app_mapping !== 'PASS' ||
  report.integration_complete !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 scene_mapping=PASS camera_mapping=PASS emotion_mapping=PASS transition_mapping=PASS continuity_mapping=PASS image_app_mapping=PASS video_app_mapping=PASS integration_complete=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
