import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT,
  REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
} from '../services/movieAnalysisRealExecutionGateCertification.js';
import { REAL_IMAGE_PROMPT_EXPORT_PATH } from '../services/movieAnalysisRealImagePromptExport.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_TEST_IMAGE_COUNT,
  REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH,
  REAL_IMAGE_GENERATION_VALIDATION_MD_PATH,
  REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT,
  REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH,
  REAL_IMAGE_GENERATION_VALIDATION_STATUS_MESSAGE,
  TEST_IMAGES_PER_SOURCE,
  writeMovieAnalysisRealImageGenerationValidation,
} from '../services/movieAnalysisRealImageGenerationValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const gateReportPath = path.join(projectRoot, REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH);
if (!fs.existsSync(gateReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const gateReport = JSON.parse(fs.readFileSync(gateReportPath, 'utf8')) as {
  final_verdict: string;
};
if (gateReport.final_verdict !== REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2D-008 ${REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH} must be ${REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH))) {
  console.error(`Missing required input: ${REAL_IMAGE_PROMPT_EXPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealImageGenerationValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} test_image_count=${report.test_image_count} prompt_consumed=${report.prompt_consumed} character_identity_preserved=${report.character_identity_preserved} environment_preserved=${report.environment_preserved} composition_preserved=${report.composition_preserved} emotion_preserved=${report.emotion_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} real_image_generation_validation_ready=${report.real_image_generation_validation_ready} planning_only=${report.planning_only} actual_generation_allowed=${report.actual_generation_allowed} test_mode_only=${report.test_mode_only} full_production=${report.full_production} minimal_gpu=${report.minimal_gpu}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: prompt=${audit.prompt_consumed} identity=${audit.character_identity_preserved} env=${audit.environment_preserved} comp=${audit.composition_preserved} emotion=${audit.emotion_preserved} trace=${audit.adapter_traceability_preserved} ready=${audit.source_generation_validated}`
  );
}
console.log(`report=${REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_IMAGE_GENERATION_VALIDATION_MD_PATH}`);
console.log(`manifest=${REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH}`);
console.log(`test_results=${report.test_results.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH)) ||
  report.certification_status !== REAL_IMAGE_GENERATION_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.test_image_count !== EXPECTED_TEST_IMAGE_COUNT ||
  report.planning_only !== false ||
  report.actual_generation_allowed !== true ||
  report.test_mode_only !== true ||
  report.full_production !== false ||
  report.minimal_gpu !== true ||
  report.prompt_consumed !== 'PASS' ||
  report.character_identity_preserved !== 'PASS' ||
  report.environment_preserved !== 'PASS' ||
  report.composition_preserved !== 'PASS' ||
  report.emotion_preserved !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.real_image_generation_validation_ready !== 'PASS' ||
  report.test_results.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.test_results.every((result) => result.images_generated === TEST_IMAGES_PER_SOURCE) === false ||
  report.source_audits.every((audit) => audit.source_generation_validated === 'PASS') === false
) {
  console.error(
    'Expected real image generation validation in test mode with 1 image per source and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
