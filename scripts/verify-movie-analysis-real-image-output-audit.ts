import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH,
  REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT,
  REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH,
} from '../services/movieAnalysisRealImageGenerationValidation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_IMAGE_OUTPUT_AUDIT_MD_PATH,
  REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT,
  REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH,
  REAL_IMAGE_OUTPUT_AUDIT_STATUS_MESSAGE,
  writeMovieAnalysisRealImageOutputAudit,
} from '../services/movieAnalysisRealImageOutputAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const validationReportPath = path.join(projectRoot, REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH);
if (!fs.existsSync(validationReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const validationReport = JSON.parse(fs.readFileSync(validationReportPath, 'utf8')) as {
  final_verdict: string;
};
if (validationReport.final_verdict !== REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-001 ${REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH} must be ${REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH))) {
  console.error(`Missing required input: ${REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealImageOutputAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} image_output_present=${report.image_output_present} image_file_readable=${report.image_file_readable} image_dimensions_recorded=${report.image_dimensions_recorded} placeholder_detected=${report.placeholder_detected} mock_output_detected=${report.mock_output_detected} prompt_traceability_preserved=${report.prompt_traceability_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} real_image_output_audit_ready=${report.real_image_output_audit_ready}`
);
for (const audit of report.source_audits) {
  const dim = audit.dimensions
    ? `${audit.dimensions.width}x${audit.dimensions.height}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: present=${audit.image_output_present} readable=${audit.image_file_readable} dimensions=${dim} placeholder=${audit.placeholder_detected} mock=${audit.mock_output_detected} prompt_trace=${audit.prompt_traceability_preserved} adapter_trace=${audit.adapter_traceability_preserved} ready=${audit.source_output_audit_ready}`
  );
}
console.log(`report=${REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH}`);
console.log(`markdown=${REAL_IMAGE_OUTPUT_AUDIT_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH)) ||
  report.certification_status !== REAL_IMAGE_OUTPUT_AUDIT_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_output_present !== 'PASS' ||
  report.image_file_readable !== 'PASS' ||
  report.image_dimensions_recorded !== 'PASS' ||
  report.placeholder_detected !== 'PASS' ||
  report.mock_output_detected !== 'PASS' ||
  report.prompt_traceability_preserved !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.real_image_output_audit_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_output_audit_ready === 'PASS') === false ||
  report.source_audits.every((audit) => audit.placeholder_found === true) === false ||
  report.source_audits.every((audit) => audit.mock_output_found === true) === false
) {
  console.error('Expected real image output audit with placeholder/mock detection and all checks PASS');
  process.exit(1);
}

process.exit(0);
