import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT,
  REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH,
} from '../services/movieAnalysisRealImageOutputAudit.js';
import {
  BLOCKED_REAL_IMAGE_REQUIRED_STATUS,
  EXPECTED_SOURCE_COUNT,
  REAL_IMAGE_REQUIRED_GATE_MD_PATH,
  REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT,
  REAL_IMAGE_REQUIRED_GATE_REPORT_PATH,
  writeMovieAnalysisRealImageRequiredGate,
} from '../services/movieAnalysisRealImageRequiredGate.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const outputAuditReportPath = path.join(projectRoot, REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH);
if (!fs.existsSync(outputAuditReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH}`);
  process.exit(1);
}

const outputAuditReport = JSON.parse(fs.readFileSync(outputAuditReportPath, 'utf8')) as {
  final_verdict: string;
};
if (outputAuditReport.final_verdict !== REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-002 ${REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH} must be ${REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisRealImageRequiredGate(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} image_output_present=${report.image_output_present} image_file_readable=${report.image_file_readable} placeholder_detected=${report.placeholder_detected} mock_output_detected=${report.mock_output_detected} real_image_required=${report.real_image_required} placeholder_blocked=${report.placeholder_blocked} mock_output_blocked=${report.mock_output_blocked} traceability_preserved=${report.traceability_preserved} real_image_required_gate_ready=${report.real_image_required_gate_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: blocked=${audit.blocked} placeholder=${audit.placeholder_detected} mock=${audit.mock_output_detected} placeholder_blocked=${audit.placeholder_blocked} mock_blocked=${audit.mock_output_blocked} trace=${audit.traceability_preserved} ready=${audit.source_gate_ready}`
  );
}
console.log(`report=${REAL_IMAGE_REQUIRED_GATE_REPORT_PATH}`);
console.log(`markdown=${REAL_IMAGE_REQUIRED_GATE_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_REQUIRED_GATE_REPORT_PATH)) ||
  report.certification_status !== BLOCKED_REAL_IMAGE_REQUIRED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.placeholder_detected !== true ||
  report.mock_output_detected !== true ||
  report.image_output_present !== 'PASS' ||
  report.image_file_readable !== 'PASS' ||
  report.real_image_required !== 'PASS' ||
  report.placeholder_blocked !== 'PASS' ||
  report.mock_output_blocked !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.real_image_required_gate_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.blocked === true) === false ||
  report.source_audits.every((audit) => audit.placeholder_detected === true) === false ||
  report.source_audits.every((audit) => audit.mock_output_detected === true) === false ||
  report.source_audits.every((audit) => audit.source_gate_ready === 'PASS') === false
) {
  console.error(
    'Expected BLOCKED_REAL_IMAGE_REQUIRED with placeholder/mock outputs blocked and gate PASS'
  );
  process.exit(1);
}

process.exit(0);
