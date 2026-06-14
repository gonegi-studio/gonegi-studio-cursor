import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_IMAGE_PROMPT_EXPORT_PATH } from '../services/movieAnalysisRealImagePromptExport.js';
import { REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT, REAL_IMAGE_REQUIRED_GATE_REPORT_PATH } from '../services/movieAnalysisRealImageRequiredGate.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_IMAGE_ARTIFACT_INGESTION_MD_PATH,
  REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT,
  REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH,
  REAL_IMAGE_ARTIFACT_INGESTION_STATUS_MESSAGE,
  REAL_IMAGE_ARTIFACTS_MANIFEST_PATH,
  writeMovieAnalysisRealImageArtifactIngestion,
} from '../services/movieAnalysisRealImageArtifactIngestion.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const gateReportPath = path.join(projectRoot, REAL_IMAGE_REQUIRED_GATE_REPORT_PATH);
if (!fs.existsSync(gateReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_IMAGE_REQUIRED_GATE_REPORT_PATH}`);
  process.exit(1);
}

const gateReport = JSON.parse(fs.readFileSync(gateReportPath, 'utf8')) as {
  final_verdict: string;
};
if (gateReport.final_verdict !== REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-003 ${REAL_IMAGE_REQUIRED_GATE_REPORT_PATH} must be ${REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH))) {
  console.error(`Missing required input: ${REAL_IMAGE_PROMPT_EXPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealImageArtifactIngestion(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} real_image_file_present=${report.real_image_file_present} image_file_readable=${report.image_file_readable} image_dimensions_valid=${report.image_dimensions_valid} placeholder_detected=${report.placeholder_detected} mock_output_detected=${report.mock_output_detected} prompt_traceability_preserved=${report.prompt_traceability_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} real_image_artifact_ingestion_ready=${report.real_image_artifact_ingestion_ready}`
);
for (const audit of report.source_audits) {
  const dim = audit.dimensions
    ? `${audit.dimensions.width}x${audit.dimensions.height}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: present=${audit.real_image_file_present} readable=${audit.image_file_readable} dimensions=${dim} placeholder=${audit.placeholder_detected} mock=${audit.mock_output_detected} prompt_trace=${audit.prompt_traceability_preserved} adapter_trace=${audit.adapter_traceability_preserved} ready=${audit.source_ingestion_ready}`
  );
}
console.log(`report=${REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH}`);
console.log(`markdown=${REAL_IMAGE_ARTIFACT_INGESTION_MD_PATH}`);
console.log(`manifest=${REAL_IMAGE_ARTIFACTS_MANIFEST_PATH}`);
console.log(`artifacts=${report.artifacts.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_ARTIFACTS_MANIFEST_PATH)) ||
  report.certification_status !== REAL_IMAGE_ARTIFACT_INGESTION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.real_image_file_present !== 'PASS' ||
  report.image_file_readable !== 'PASS' ||
  report.image_dimensions_valid !== 'PASS' ||
  report.placeholder_detected !== false ||
  report.mock_output_detected !== false ||
  report.prompt_traceability_preserved !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.real_image_artifact_ingestion_ready !== 'PASS' ||
  report.artifacts.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_ingestion_ready === 'PASS') === false ||
  report.source_audits.every((audit) => audit.placeholder_detected === false) === false ||
  report.source_audits.every((audit) => audit.mock_output_detected === false) === false
) {
  console.error(
    'Expected real image artifact ingestion with 4 non-placeholder artifacts and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
