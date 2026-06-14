import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CROSS_APP_CONSUMPTION_CERTIFICATION_DIR,
  CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
} from '../services/movieAnalysisCrossAppConsumptionCertification.js';
import {
  IMAGE_APP_CONSUMPTION_VALIDATION_DIR,
  IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
} from '../services/movieAnalysisImageAppConsumptionValidation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  LEVEL2B_CONSUMPTION_CERTIFICATION_MD_PATH,
  LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH,
  LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE,
  LEVEL2B_PHASE_COUNT,
  LEVEL2B_PHASE_ENTRIES,
  writeMovieAnalysisLevel2BConsumptionCertification,
} from '../services/movieAnalysisLevel2BConsumptionCertification.js';
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

for (const dir of [
  IMAGE_APP_CONSUMPTION_VALIDATION_DIR,
  VIDEO_APP_CONSUMPTION_VALIDATION_DIR,
  CROSS_APP_CONSUMPTION_CERTIFICATION_DIR,
]) {
  if (!fs.existsSync(path.join(projectRoot, dir))) {
    console.error(`Missing required upstream directory: ${dir}`);
    process.exit(1);
  }
}

for (const entry of LEVEL2B_PHASE_ENTRIES) {
  const abs = path.join(projectRoot, entry.report_path);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${entry.report_path} (${entry.phase_id})`);
    process.exit(1);
  }

  const phaseReport = JSON.parse(fs.readFileSync(abs, 'utf8')) as { final_verdict?: string };
  if (phaseReport.final_verdict !== entry.pass_verdict) {
    console.error(
      `PRECHECK FAIL: ${entry.phase_id} ${entry.report_path} must be ${entry.pass_verdict}`
    );
    process.exit(1);
  }
}

const report = writeMovieAnalysisLevel2BConsumptionCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level2b_phases_complete=${report.level2b_phases_complete} image_app_consumption_ready=${report.completion_validation.image_app_consumption_ready} video_app_consumption_ready=${report.completion_validation.video_app_consumption_ready} cross_app_consumption_ready=${report.completion_validation.cross_app_consumption_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} cross_app_binding_consistency=${report.cross_app_binding_consistency} level2b_consumption_certification_ready=${report.level2b_consumption_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.phase_audits) {
  console.log(`  ${audit.phase_id}: exists=${audit.report_exists} passed=${audit.phase_passed}`);
}
console.log(`report=${LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${LEVEL2B_CONSUMPTION_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

const completion = report.completion_validation;
if (
  !fs.existsSync(path.join(projectRoot, LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH)) ||
  report.certification_status !== LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2b_phase_count !== LEVEL2B_PHASE_COUNT ||
  report.level2b_phases_complete !== 'PASS' ||
  completion.image_app_consumption_ready !== 'PASS' ||
  completion.video_app_consumption_ready !== 'PASS' ||
  completion.cross_app_consumption_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.cross_app_binding_consistency !== 'PASS' ||
  report.level2b_consumption_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.phase_audits.length !== LEVEL2B_PHASE_COUNT ||
  report.phase_audits.every((audit) => audit.phase_passed) === false ||
  !fs.existsSync(path.join(projectRoot, IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH))
) {
  console.error('Expected Level 2B consumption certification with all phases and validations PASS');
  process.exit(1);
}

process.exit(0);
