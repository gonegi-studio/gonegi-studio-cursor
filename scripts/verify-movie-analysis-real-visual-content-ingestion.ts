import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_IMAGE_PROMPT_EXPORT_PATH } from '../services/movieAnalysisRealImagePromptExport.js';
import {
  MINIMUM_REQUIRED_RESOLUTION,
  REAL_IMAGE_QUALITY_GATE_PASS_VERDICT,
  REAL_IMAGE_QUALITY_GATE_REPORT_PATH,
} from '../services/movieAnalysisRealImageQualityGate.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_VISUAL_CONTENT_INGESTION_MD_PATH,
  REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT,
  REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH,
  REAL_VISUAL_CONTENT_INGESTION_STATUS_MESSAGE,
  REAL_VISUAL_CONTENT_MANIFEST_PATH,
  writeMovieAnalysisRealVisualContentIngestion,
} from '../services/movieAnalysisRealVisualContentIngestion.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const qualityGateReportPath = path.join(projectRoot, REAL_IMAGE_QUALITY_GATE_REPORT_PATH);
if (!fs.existsSync(qualityGateReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_IMAGE_QUALITY_GATE_REPORT_PATH}`);
  process.exit(1);
}

const qualityGateReport = JSON.parse(fs.readFileSync(qualityGateReportPath, 'utf8')) as {
  final_verdict: string;
};
if (qualityGateReport.final_verdict !== REAL_IMAGE_QUALITY_GATE_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-005 ${REAL_IMAGE_QUALITY_GATE_REPORT_PATH} must be ${REAL_IMAGE_QUALITY_GATE_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH))) {
  console.error(`Missing required input: ${REAL_IMAGE_PROMPT_EXPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealVisualContentIngestion(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} image_file_present=${report.image_file_present} image_file_readable=${report.image_file_readable} width_requirement_met=${report.width_requirement_met} height_requirement_met=${report.height_requirement_met} single_color_image_detected=${report.single_color_image_detected} synthetic_artifact_detected=${report.synthetic_artifact_detected} prompt_traceability_preserved=${report.prompt_traceability_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} real_visual_content_ingestion_ready=${report.real_visual_content_ingestion_ready}`
);
for (const audit of report.source_audits) {
  const dim = audit.dimensions
    ? `${audit.dimensions.width}x${audit.dimensions.height}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: present=${audit.image_file_present} readable=${audit.image_file_readable} dimensions=${dim} width=${audit.width_requirement_met} height=${audit.height_requirement_met} single_color=${audit.single_color_image_detected} synthetic=${audit.synthetic_artifact_detected} prompt_trace=${audit.prompt_traceability_preserved} adapter_trace=${audit.adapter_traceability_preserved} ready=${audit.source_ingestion_ready}`
  );
}
console.log(`report=${REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH}`);
console.log(`markdown=${REAL_VISUAL_CONTENT_INGESTION_MD_PATH}`);
console.log(`manifest=${REAL_VISUAL_CONTENT_MANIFEST_PATH}`);
console.log(`entries=${report.entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, REAL_VISUAL_CONTENT_MANIFEST_PATH)) ||
  report.certification_status !== REAL_VISUAL_CONTENT_INGESTION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_file_present !== 'PASS' ||
  report.image_file_readable !== 'PASS' ||
  report.width_requirement_met !== 'PASS' ||
  report.height_requirement_met !== 'PASS' ||
  report.single_color_image_detected !== false ||
  report.synthetic_artifact_detected !== false ||
  report.prompt_traceability_preserved !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.real_visual_content_ingestion_ready !== 'PASS' ||
  report.entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_ingestion_ready === 'PASS') === false ||
  report.source_audits.every((audit) => audit.single_color_image_detected === false) === false ||
  report.source_audits.every((audit) => audit.synthetic_artifact_detected === false) === false ||
  report.source_audits.every(
    (audit) =>
      audit.dimensions !== null &&
      audit.dimensions.width >= MINIMUM_REQUIRED_RESOLUTION &&
      audit.dimensions.height >= MINIMUM_REQUIRED_RESOLUTION
  ) === false
) {
  console.error(
    'Expected real visual content ingestion with 4 quality-gate-passing images and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
