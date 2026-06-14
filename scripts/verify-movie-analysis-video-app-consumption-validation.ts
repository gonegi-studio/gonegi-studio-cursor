import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
} from '../services/movieAnalysisImageAppConsumptionValidation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  VIDEO_APP_CONSUMPTION_VALIDATION_MD_PATH,
  VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
  writeMovieAnalysisVideoAppConsumptionValidation,
} from '../services/movieAnalysisVideoAppConsumptionValidation.js';
import {
  VIDEO_RUNTIME_PACKAGE_DIR,
  VIDEO_RUNTIME_PACKAGE_PATH,
} from '../services/movieAnalysisVideoRuntimePackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const imageConsumptionReportPath = path.join(
  projectRoot,
  IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH
);
if (!fs.existsSync(imageConsumptionReportPath)) {
  console.error(`Missing required upstream asset: ${IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const imageConsumptionReport = JSON.parse(
  fs.readFileSync(imageConsumptionReportPath, 'utf8')
) as { final_verdict: string };
if (imageConsumptionReport.final_verdict !== IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2B-001 ${IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH} must be ${IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_DIR))) {
  console.error(`Missing required input directory: ${VIDEO_RUNTIME_PACKAGE_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_PATH))) {
  console.error(`Missing required input package: ${VIDEO_RUNTIME_PACKAGE_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisVideoAppConsumptionValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} video_runtime_package_present=${report.video_runtime_package_present} resolved_video_prompt_present=${report.resolved_video_prompt_present} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} video_app_binding_complete=${report.video_app_binding_complete} video_app_consumption_ready=${report.video_app_consumption_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: package=${audit.video_runtime_package_present} prompt=${audit.resolved_video_prompt_present} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} binding=${audit.video_app_binding_complete} ready=${audit.source_consumption_ready}`
  );
}
console.log(`report=${VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${VIDEO_APP_CONSUMPTION_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.video_runtime_package_present !== 'PASS' ||
  report.resolved_video_prompt_present !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.video_app_binding_complete !== 'PASS' ||
  report.video_app_consumption_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_consumption_ready === 'PASS') === false
) {
  console.error(
    'Expected video app consumption validation for all sources with binding and traceability preserved'
  );
  process.exit(1);
}

process.exit(0);
