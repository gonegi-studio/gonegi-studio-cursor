import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CROSS_APP_CONSUMPTION_CERTIFICATION_MD_PATH,
  CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisCrossAppConsumptionCertification,
} from '../services/movieAnalysisCrossAppConsumptionCertification.js';
import {
  IMAGE_APP_CONSUMPTION_VALIDATION_DIR,
  IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
} from '../services/movieAnalysisImageAppConsumptionValidation.js';
import {
  VIDEO_APP_CONSUMPTION_VALIDATION_DIR,
  VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
} from '../services/movieAnalysisVideoAppConsumptionValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const dir of [IMAGE_APP_CONSUMPTION_VALIDATION_DIR, VIDEO_APP_CONSUMPTION_VALIDATION_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, dir))) {
    console.error(`Missing required upstream directory: ${dir}`);
    process.exit(1);
  }
}

const imageConsumptionReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH), 'utf8')
) as { final_verdict: string };
if (imageConsumptionReport.final_verdict !== IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2B-001 ${IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH} must be ${IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT}`
  );
  process.exit(1);
}

const videoConsumptionReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH), 'utf8')
) as { final_verdict: string };
if (videoConsumptionReport.final_verdict !== VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2B-002 ${VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH} must be ${VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisCrossAppConsumptionCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} image_app_consumption_ready=${report.image_app_consumption_ready} video_app_consumption_ready=${report.video_app_consumption_ready} runtime_mapping_consistency=${report.runtime_mapping_consistency} adapter_traceability_consistency=${report.adapter_traceability_consistency} cross_app_binding_consistency=${report.cross_app_binding_consistency} cross_app_consumption_certification_ready=${report.cross_app_consumption_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: cross_app_consumption_ready=${audit.cross_app_consumption_ready} runtime_mapping_consistent=${audit.runtime_mapping_consistent} traceability_preserved=${audit.traceability_preserved} binding=${audit.cross_app_binding_consistent}`
  );
}
console.log(`report=${CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${CROSS_APP_CONSUMPTION_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_app_consumption_ready !== 'PASS' ||
  report.video_app_consumption_ready !== 'PASS' ||
  report.runtime_mapping_consistency !== 'PASS' ||
  report.adapter_traceability_consistency !== 'PASS' ||
  report.cross_app_binding_consistency !== 'PASS' ||
  report.cross_app_consumption_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every(
    (audit) =>
      audit.cross_app_consumption_ready === 'PASS' &&
      audit.runtime_mapping_consistent === 'PASS' &&
      audit.traceability_preserved === 'PASS'
  ) === false
) {
  console.error(
    'Expected cross app consumption certification for all sources with consistent mappings, traceability, and binding'
  );
  process.exit(1);
}

process.exit(0);
