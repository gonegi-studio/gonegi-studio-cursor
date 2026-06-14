import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  IMAGE_APP_CONSUMPTION_VALIDATION_MD_PATH,
  IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
  writeMovieAnalysisImageAppConsumptionValidation,
} from '../services/movieAnalysisImageAppConsumptionValidation.js';
import { IMAGE_RUNTIME_PACKAGE_DIR, IMAGE_RUNTIME_PACKAGE_PATH } from '../services/movieAnalysisImageRuntimePackage.js';
import {
  LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT,
  LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
  LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE,
} from '../services/movieAnalysisLevel2RuntimeCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const level2ReportPath = path.join(projectRoot, LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH);
if (!fs.existsSync(level2ReportPath)) {
  console.error(`Missing required upstream asset: ${LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const level2Report = JSON.parse(fs.readFileSync(level2ReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (
  level2Report.final_verdict !== LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT ||
  level2Report.certification_status !== LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    `PRECHECK FAIL: LEVEL2_COMPLETE required (${LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE})`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_DIR))) {
  console.error(`Missing required input directory: ${IMAGE_RUNTIME_PACKAGE_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_PATH))) {
  console.error(`Missing required input package: ${IMAGE_RUNTIME_PACKAGE_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisImageAppConsumptionValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} image_runtime_package_present=${report.image_runtime_package_present} resolved_image_prompt_present=${report.resolved_image_prompt_present} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} image_app_binding_complete=${report.image_app_binding_complete} image_app_consumption_ready=${report.image_app_consumption_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: package=${audit.image_runtime_package_present} prompt=${audit.resolved_image_prompt_present} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} binding=${audit.image_app_binding_complete} ready=${audit.source_consumption_ready}`
  );
}
console.log(`report=${IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${IMAGE_APP_CONSUMPTION_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_runtime_package_present !== 'PASS' ||
  report.resolved_image_prompt_present !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.image_app_binding_complete !== 'PASS' ||
  report.image_app_consumption_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_consumption_ready === 'PASS') === false
) {
  console.error('Expected image app consumption validation for all sources with binding and traceability preserved');
  process.exit(1);
}

process.exit(0);
