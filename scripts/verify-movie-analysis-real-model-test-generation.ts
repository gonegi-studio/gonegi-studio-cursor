import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODEL_GENERATION_TEST_DIR,
  MODEL_GENERATION_TEST_PACKAGE_PATH,
  REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT,
  REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH,
  REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealModelGenerationPreparation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_TEST_IMAGE_COUNT,
  MODEL_TEST_GENERATION_IMAGES_DIR,
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_MD_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
  TEST_IMAGES_PER_SOURCE,
  writeMovieAnalysisRealModelTestGeneration,
} from '../services/movieAnalysisRealModelTestGeneration.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, MODEL_GENERATION_TEST_DIR))) {
  console.error(`Missing required upstream directory: ${MODEL_GENERATION_TEST_DIR}`);
  process.exit(1);
}

const preparationReportPath = path.join(projectRoot, REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH);
if (!fs.existsSync(preparationReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH}`);
  process.exit(1);
}

const preparationReport = JSON.parse(fs.readFileSync(preparationReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (preparationReport.final_verdict !== REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: L2F-001 ${REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH} must be ${REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT}`
  );
  process.exit(1);
}
if (preparationReport.certification_status !== REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE) {
  console.error(
    `PRECHECK FAIL: L2F-001 status must be ${REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE}`
  );
  process.exit(1);
}

const preparationPackagePath = path.join(projectRoot, MODEL_GENERATION_TEST_PACKAGE_PATH);
if (!fs.existsSync(preparationPackagePath)) {
  console.error(`Missing required upstream asset: ${MODEL_GENERATION_TEST_PACKAGE_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealModelTestGeneration(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} test_image_count=${report.test_image_count} generated_image_present=${report.generated_image_present} prompt_consumed=${report.prompt_consumed} dna_binding_preserved=${report.dna_binding_preserved} adapter_binding_preserved=${report.adapter_binding_preserved} traceability_preserved=${report.traceability_preserved} real_model_test_generation_ready=${report.real_model_test_generation_ready} model_execution=${report.model_execution} actual_generation_allowed=${report.actual_generation_allowed} test_mode_only=${report.test_mode_only}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: image=${audit.generated_image_present} prompt=${audit.prompt_consumed} dna=${audit.dna_binding_preserved} adapter=${audit.adapter_binding_preserved} trace=${audit.traceability_preserved} ready=${audit.source_test_generation_complete}`
  );
}
console.log(`report=${REAL_MODEL_TEST_GENERATION_REPORT_PATH}`);
console.log(`markdown=${REAL_MODEL_TEST_GENERATION_MD_PATH}`);
console.log(`manifest=${MODEL_TEST_GENERATION_MANIFEST_PATH}`);
console.log(`test_results=${report.test_results.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_MODEL_TEST_GENERATION_PASS_VERDICT) {
  process.exit(1);
}

const imageFiles = fs.existsSync(path.join(projectRoot, MODEL_TEST_GENERATION_IMAGES_DIR))
  ? fs.readdirSync(path.join(projectRoot, MODEL_TEST_GENERATION_IMAGES_DIR)).filter((name) =>
      name.endsWith('.png')
    )
  : [];

if (
  !fs.existsSync(path.join(projectRoot, REAL_MODEL_TEST_GENERATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MODEL_TEST_GENERATION_MANIFEST_PATH)) ||
  report.certification_status !== REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.test_image_count !== EXPECTED_TEST_IMAGE_COUNT ||
  report.planning_only !== false ||
  report.actual_generation_allowed !== true ||
  report.test_mode_only !== true ||
  report.model_execution !== true ||
  report.generated_image_present !== 'PASS' ||
  report.prompt_consumed !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.real_model_test_generation_ready !== 'PASS' ||
  report.test_results.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.test_results.every((result) => result.images_generated === TEST_IMAGES_PER_SOURCE) === false ||
  report.source_audits.every((audit) => audit.source_test_generation_complete === 'PASS') === false ||
  imageFiles.length !== EXPECTED_TEST_IMAGE_COUNT
) {
  console.error(
    'Expected real model test generation with 1 image per source and all validation checks PASS'
  );
  process.exit(1);
}

process.exit(0);
