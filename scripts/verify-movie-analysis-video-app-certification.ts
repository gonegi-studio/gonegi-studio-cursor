import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  VIDEO_APP_CERTIFICATION_MD_PATH,
  VIDEO_APP_CERTIFICATION_PASS_VERDICT,
  VIDEO_APP_CERTIFICATION_REPORT_PATH,
  VIDEO_APP_CERTIFICATION_STATUS_MESSAGE,
  writeMovieAnalysisVideoAppCertificationReport,
} from '../services/movieAnalysisVideoAppCertification.js';
import { VIDEO_APP_IMPORT_TEST_REPORT_PATH } from '../services/movieAnalysisVideoAppImportTest.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_APP_IMPORT_TEST_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${VIDEO_APP_IMPORT_TEST_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisVideoAppCertificationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} bridge_ready=${report.bridge_ready} import_ready=${report.import_ready} adapter_mapping_complete=${report.adapter_mapping_complete} traceability_preserved=${report.traceability_preserved} source_count_valid=${report.source_count_valid} adapter_count_valid=${report.adapter_count_valid} video_app_chain_complete=${report.video_app_chain_complete} video_app_certification_ready=${report.video_app_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: bridge=${audit.bridge_ready} import=${audit.import_ready} mapping=${audit.adapter_mapping_complete} trace=${audit.traceability_preserved} certified=${audit.source_certified}`
  );
}
if (report.certification_status) {
  console.log(report.certification_status);
}
console.log(`report=${VIDEO_APP_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${VIDEO_APP_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_APP_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.bridge_ready !== 'PASS' ||
  report.import_ready !== 'PASS' ||
  report.adapter_mapping_complete !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.source_count_valid !== 'PASS' ||
  report.adapter_count_valid !== 'PASS' ||
  report.video_app_chain_complete !== 'PASS' ||
  report.video_app_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.certification_status !== VIDEO_APP_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    'Expected source_count=4 adapter_count=24 bridge_ready=PASS import_ready=PASS adapter_mapping_complete=PASS traceability_preserved=PASS video_app_chain_complete=PASS video_app_certification_ready=PASS planning_only=PASS MOVIE_ANALYSIS_VIDEO_APP_READY'
  );
  process.exit(1);
}

process.exit(0);
