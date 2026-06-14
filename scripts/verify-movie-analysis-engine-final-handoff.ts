import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CROSS_APP_CERTIFICATION_REPORT_PATH,
  CROSS_APP_CERTIFICATION_STATUS_MESSAGE,
} from '../services/movieAnalysisCrossAppCertification.js';
import {
  ENGINE_FINAL_HANDOFF_MD_PATH,
  ENGINE_FINAL_HANDOFF_PASS_VERDICT,
  ENGINE_FINAL_HANDOFF_PATH,
  ENGINE_FINAL_HANDOFF_REPORT_PATH,
  ENGINE_FINAL_HANDOFF_STATUS_MESSAGE,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  PHASE_RANGE_COUNT,
  writeMovieAnalysisEngineFinalHandoff,
} from '../services/movieAnalysisEngineFinalHandoff.js';
import { IMAGE_APP_CERTIFICATION_STATUS_MESSAGE } from '../services/movieAnalysisImageAppCertification.js';
import { PRODUCTION_READY_STATUS_MESSAGE } from '../services/movieAnalysisProductionReadyCertification.js';
import { VIDEO_APP_CERTIFICATION_STATUS_MESSAGE } from '../services/movieAnalysisVideoAppCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, CROSS_APP_CERTIFICATION_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${CROSS_APP_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const { handoff, report } = writeMovieAnalysisEngineFinalHandoff(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} production_ready_status=${handoff.production_ready_status} image_app_ready_status=${handoff.image_app_ready_status} video_app_ready_status=${handoff.video_app_ready_status} cross_app_ready_status=${handoff.cross_app_ready_status} phase_range_022_075_complete=${report.phase_range_022_075_complete} phase_count=${handoff.phase_range_022_075.phase_count} source_count_valid=${report.source_count_valid} adapter_count_valid=${report.adapter_count_valid} safety_flags_valid=${report.safety_flags_valid} roadmap_complete=${report.roadmap_complete} handoff_package_ready=${report.handoff_package_ready} planning_only=${report.planning_only_status}`
);
console.log(
  `roadmap_levels=${handoff.long_term_roadmap_level_1_to_5.length} level_1=${handoff.long_term_roadmap_level_1_to_5[0].status}`
);
if (report.certification_status) {
  console.log(report.certification_status);
}
console.log(`handoff=${ENGINE_FINAL_HANDOFF_PATH}`);
console.log(`markdown=${ENGINE_FINAL_HANDOFF_MD_PATH}`);
console.log(`report=${ENGINE_FINAL_HANDOFF_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== ENGINE_FINAL_HANDOFF_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  handoff.production_ready_status !== PRODUCTION_READY_STATUS_MESSAGE ||
  handoff.image_app_ready_status !== IMAGE_APP_CERTIFICATION_STATUS_MESSAGE ||
  handoff.video_app_ready_status !== VIDEO_APP_CERTIFICATION_STATUS_MESSAGE ||
  handoff.cross_app_ready_status !== CROSS_APP_CERTIFICATION_STATUS_MESSAGE ||
  handoff.phase_range_022_075.phase_count !== PHASE_RANGE_COUNT ||
  handoff.phase_range_022_075.complete !== true ||
  report.phase_range_022_075_complete !== 'PASS' ||
  report.source_count_valid !== 'PASS' ||
  report.adapter_count_valid !== 'PASS' ||
  report.safety_flags_valid !== 'PASS' ||
  report.roadmap_complete !== 'PASS' ||
  report.handoff_package_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.certification_status !== ENGINE_FINAL_HANDOFF_STATUS_MESSAGE ||
  handoff.long_term_roadmap_level_1_to_5.length !== 5
) {
  console.error(
    'Expected source_count=4 adapter_count=24 all ready statuses set phase_range_022_075_complete=PASS handoff_package_ready=PASS MOVIE_ANALYSIS_ENGINE_V1_HANDOFF_READY'
  );
  process.exit(1);
}

process.exit(0);
