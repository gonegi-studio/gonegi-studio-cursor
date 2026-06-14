import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CROSS_APP_CERTIFICATION_MD_PATH,
  CROSS_APP_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CERTIFICATION_REPORT_PATH,
  CROSS_APP_CERTIFICATION_STATUS_MESSAGE,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisCrossAppCertificationReport,
} from '../services/movieAnalysisCrossAppCertification.js';
import { IMAGE_APP_CERTIFICATION_REPORT_PATH } from '../services/movieAnalysisImageAppCertification.js';
import { VIDEO_APP_CERTIFICATION_REPORT_PATH } from '../services/movieAnalysisVideoAppCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  IMAGE_APP_CERTIFICATION_REPORT_PATH,
  VIDEO_APP_CERTIFICATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisCrossAppCertificationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} image_app_ready=${report.image_app_ready} video_app_ready=${report.video_app_ready} shared_adapter_integrity=${report.shared_adapter_integrity} shared_traceability=${report.shared_traceability} cross_app_consistency=${report.cross_app_consistency} source_count_valid=${report.source_count_valid} adapter_count_valid=${report.adapter_count_valid} cross_app_certification_ready=${report.cross_app_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: adapter_integrity=${audit.shared_adapter_integrity} traceability=${audit.shared_traceability} consistent=${audit.cross_app_consistent} ready=${audit.source_cross_app_ready}`
  );
}
if (report.certification_status) {
  console.log(report.certification_status);
}
console.log(`report=${CROSS_APP_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${CROSS_APP_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CROSS_APP_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_app_ready !== 'PASS' ||
  report.video_app_ready !== 'PASS' ||
  report.shared_adapter_integrity !== 'PASS' ||
  report.shared_traceability !== 'PASS' ||
  report.cross_app_consistency !== 'PASS' ||
  report.source_count_valid !== 'PASS' ||
  report.adapter_count_valid !== 'PASS' ||
  report.cross_app_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.certification_status !== CROSS_APP_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    'Expected source_count=4 adapter_count=24 image_app_ready=PASS video_app_ready=PASS shared_adapter_integrity=PASS shared_traceability=PASS cross_app_consistency=PASS cross_app_certification_ready=PASS planning_only=PASS MOVIE_ANALYSIS_CROSS_APP_READY'
  );
  process.exit(1);
}

process.exit(0);
