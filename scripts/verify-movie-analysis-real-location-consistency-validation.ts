import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_LOCATION_CONSISTENCY_VALIDATION_MD_PATH,
  REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisRealLocationConsistencyValidation,
} from '../services/movieAnalysisRealLocationConsistencyValidation.js';
import {
  MODEL_TEST_GENERATION_IMAGES_DIR,
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealModelTestGeneration.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const testGenerationReportPath = path.join(projectRoot, REAL_MODEL_TEST_GENERATION_REPORT_PATH);
if (!fs.existsSync(testGenerationReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_MODEL_TEST_GENERATION_REPORT_PATH}`);
  process.exit(1);
}

const testGenerationReport = JSON.parse(fs.readFileSync(testGenerationReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (testGenerationReport.final_verdict !== REAL_MODEL_TEST_GENERATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: L2F-002 ${REAL_MODEL_TEST_GENERATION_REPORT_PATH} must be ${REAL_MODEL_TEST_GENERATION_PASS_VERDICT}`
  );
  process.exit(1);
}
if (testGenerationReport.certification_status !== REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE) {
  console.error(
    `PRECHECK FAIL: L2F-002 status must be ${REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, MODEL_TEST_GENERATION_MANIFEST_PATH))) {
  console.error(`Missing required upstream asset: ${MODEL_TEST_GENERATION_MANIFEST_PATH}`);
  process.exit(1);
}

const imagesDir = path.join(projectRoot, MODEL_TEST_GENERATION_IMAGES_DIR);
if (!fs.existsSync(imagesDir)) {
  console.error(`Missing required input directory: ${MODEL_TEST_GENERATION_IMAGES_DIR}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealLocationConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} validated_image_count=${report.validated_image_count} location_identity_preserved=${report.location_identity_preserved} indoor_anchor_preserved=${report.indoor_anchor_preserved} lighting_anchor_preserved=${report.lighting_anchor_preserved} environment_structure_preserved=${report.environment_structure_preserved} dna_binding_preserved=${report.dna_binding_preserved} traceability_preserved=${report.traceability_preserved} location_drift=${report.location_drift} anchor_loss=${report.anchor_loss} environment_mismatch=${report.environment_mismatch} real_location_consistency_validation_ready=${report.real_location_consistency_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: location=${audit.location_identity_preserved} indoor=${audit.indoor_anchor_preserved} lighting=${audit.lighting_anchor_preserved} structure=${audit.environment_structure_preserved} dna=${audit.dna_binding_preserved} trace=${audit.traceability_preserved} ready=${audit.source_location_consistency_validated}`
  );
}
console.log(`report=${REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_LOCATION_CONSISTENCY_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const imageFiles = fs.readdirSync(imagesDir).filter((name) => name.endsWith('.png'));

if (
  !fs.existsSync(path.join(projectRoot, REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  report.certification_status !== REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.validated_image_count !== EXPECTED_SOURCE_COUNT ||
  report.location_identity_preserved !== 'PASS' ||
  report.indoor_anchor_preserved !== 'PASS' ||
  report.lighting_anchor_preserved !== 'PASS' ||
  report.environment_structure_preserved !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.location_drift !== false ||
  report.anchor_loss !== false ||
  report.environment_mismatch !== false ||
  report.real_location_consistency_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_location_consistency_validated === 'PASS') === false ||
  imageFiles.length < EXPECTED_SOURCE_COUNT
) {
  console.error(
    'Expected real location consistency validation for all sources with no drift, anchor loss, or environment mismatch'
  );
  process.exit(1);
}

process.exit(0);
