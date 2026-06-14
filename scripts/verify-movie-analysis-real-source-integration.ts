import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE_VIDEO_IMPORT_ROOT } from '../services/sourceVideoFinalSetBuilder.js';
import {
  EXPECTED_SOURCE_COUNT,
  REAL_SOURCE_INTEGRATION_MD_PATH,
  REAL_SOURCE_INTEGRATION_PASS_VERDICT,
  REAL_SOURCE_INTEGRATION_REPORT_PATH,
  writeMovieAnalysisRealSourceIntegrationReport,
} from '../services/movieAnalysisRealSourceIntegration.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, SOURCE_VIDEO_IMPORT_ROOT))) {
  console.error(`Missing required upstream asset: ${SOURCE_VIDEO_IMPORT_ROOT}/`);
  process.exit(1);
}

const report = writeMovieAnalysisRealSourceIntegrationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} source_video_binding=${report.source_video_binding} source_video_traceability=${report.source_video_traceability} master_package_linkability=${report.master_package_linkability} export_linkability=${report.export_linkability} import_linkability=${report.import_linkability}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: binding=${audit.source_video_binding} trace=${audit.source_video_traceability} master=${audit.master_package_linkability} export=${audit.export_linkability} import=${audit.import_linkability}`
  );
}
console.log(`report=${REAL_SOURCE_INTEGRATION_REPORT_PATH}`);
console.log(`markdown=${REAL_SOURCE_INTEGRATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_SOURCE_INTEGRATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.source_video_binding !== true ||
  report.source_video_traceability !== true ||
  report.master_package_linkability !== true ||
  report.export_linkability !== true ||
  report.import_linkability !== true
) {
  console.error(
    'Expected source_count=4 source_video_binding=true source_video_traceability=true master_package_linkability=true export_linkability=true import_linkability=true'
  );
  process.exit(1);
}

process.exit(0);
