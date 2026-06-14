import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT,
  REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH,
  REAL_IMAGE_ARTIFACTS_MANIFEST_PATH,
} from '../services/movieAnalysisRealImageArtifactIngestion.js';
import {
  BLOCKED_REAL_VISUAL_CONTENT_REQUIRED_STATUS,
  EXPECTED_SOURCE_COUNT,
  REAL_IMAGE_QUALITY_GATE_MD_PATH,
  REAL_IMAGE_QUALITY_GATE_PASS_VERDICT,
  REAL_IMAGE_QUALITY_GATE_REPORT_PATH,
  writeMovieAnalysisRealImageQualityGate,
} from '../services/movieAnalysisRealImageQualityGate.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const ingestionReportPath = path.join(projectRoot, REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH);
if (!fs.existsSync(ingestionReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH}`);
  process.exit(1);
}

const ingestionReport = JSON.parse(fs.readFileSync(ingestionReportPath, 'utf8')) as {
  final_verdict: string;
};
if (ingestionReport.final_verdict !== REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-004 ${REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH} must be ${REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_ARTIFACTS_MANIFEST_PATH))) {
  console.error(`Missing required input: ${REAL_IMAGE_ARTIFACTS_MANIFEST_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealImageQualityGate(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} image_file_readable=${report.image_file_readable} image_dimensions_valid=${report.image_dimensions_valid} minimum_resolution_check=${report.minimum_resolution_check} single_color_image_detected=${report.single_color_image_detected} synthetic_artifact_detected=${report.synthetic_artifact_detected} real_visual_content_required=${report.real_visual_content_required} prompt_traceability_preserved=${report.prompt_traceability_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} real_image_quality_gate_ready=${report.real_image_quality_gate_ready}`
);
for (const audit of report.source_audits) {
  const dim = audit.dimensions
    ? `${audit.dimensions.width}x${audit.dimensions.height}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: blocked=${audit.blocked} dimensions=${dim} readable=${audit.image_file_readable} resolution=${audit.minimum_resolution_check} single_color=${audit.single_color_image_detected} synthetic=${audit.synthetic_artifact_detected} prompt_trace=${audit.prompt_traceability_preserved} adapter_trace=${audit.adapter_traceability_preserved} ready=${audit.source_quality_gate_ready}`
  );
}
console.log(`report=${REAL_IMAGE_QUALITY_GATE_REPORT_PATH}`);
console.log(`markdown=${REAL_IMAGE_QUALITY_GATE_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_QUALITY_GATE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_QUALITY_GATE_REPORT_PATH)) ||
  report.certification_status !== BLOCKED_REAL_VISUAL_CONTENT_REQUIRED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.image_file_readable !== 'PASS' ||
  report.image_dimensions_valid !== 'PASS' ||
  report.minimum_resolution_check !== 'FAIL' ||
  report.single_color_image_detected !== true ||
  report.synthetic_artifact_detected !== true ||
  report.real_visual_content_required !== 'PASS' ||
  report.prompt_traceability_preserved !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.real_image_quality_gate_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.blocked === true) === false ||
  report.source_audits.every((audit) => audit.single_color_image_detected === true) === false ||
  report.source_audits.every((audit) => audit.synthetic_artifact_detected === true) === false ||
  report.source_audits.every((audit) => audit.minimum_resolution_check === 'FAIL') === false ||
  report.source_audits.every((audit) => audit.source_quality_gate_ready === 'PASS') === false
) {
  console.error(
    'Expected BLOCKED_REAL_VISUAL_CONTENT_REQUIRED with low-quality synthetic artifacts blocked and gate PASS'
  );
  process.exit(1);
}

process.exit(0);
