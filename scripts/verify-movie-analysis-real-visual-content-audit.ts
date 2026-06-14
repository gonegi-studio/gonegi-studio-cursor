import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT,
  REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH,
  REAL_VISUAL_CONTENT_MANIFEST_PATH,
} from '../services/movieAnalysisRealVisualContentIngestion.js';
import {
  BLOCKED_REAL_SCENE_CONTENT_REQUIRED_STATUS,
  EXPECTED_SOURCE_COUNT,
  REAL_VISUAL_CONTENT_AUDIT_MD_PATH,
  REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT,
  REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH,
  writeMovieAnalysisRealVisualContentAudit,
} from '../services/movieAnalysisRealVisualContentAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const ingestionReportPath = path.join(projectRoot, REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH);
if (!fs.existsSync(ingestionReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH}`);
  process.exit(1);
}

const ingestionReport = JSON.parse(fs.readFileSync(ingestionReportPath, 'utf8')) as {
  final_verdict: string;
};
if (ingestionReport.final_verdict !== REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-006 ${REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH} must be ${REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_VISUAL_CONTENT_MANIFEST_PATH))) {
  console.error(`Missing required input: ${REAL_VISUAL_CONTENT_MANIFEST_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealVisualContentAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} multi_color_validation=${report.multi_color_validation} visual_complexity_validation=${report.visual_complexity_validation} edge_density_validation=${report.edge_density_validation} non_placeholder_validation=${report.non_placeholder_validation} non_gradient_only_validation=${report.non_gradient_only_validation} traceability_preserved=${report.traceability_preserved} gradient_only_detected=${report.gradient_only_detected} real_visual_content_audit_ready=${report.real_visual_content_audit_ready}`
);
for (const audit of report.source_audits) {
  const metrics = audit.metrics
    ? `colors=${audit.metrics.unique_colors} edge=${audit.metrics.edge_density.toFixed(4)} laplacian=${audit.metrics.laplacian_magnitude.toFixed(2)} step=${audit.metrics.gradient_step_dominance.toFixed(4)}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: blocked=${audit.blocked} scene=${audit.scene_content_present} gradient=${audit.gradient_only_detected} ${metrics} multi_color=${audit.multi_color_validation} complexity=${audit.visual_complexity_validation} edge_density=${audit.edge_density_validation} non_gradient=${audit.non_gradient_only_validation} trace=${audit.traceability_preserved} ready=${audit.source_visual_content_audit_ready}`
  );
}
console.log(`report=${REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH}`);
console.log(`markdown=${REAL_VISUAL_CONTENT_AUDIT_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH)) ||
  report.certification_status !== BLOCKED_REAL_SCENE_CONTENT_REQUIRED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.gradient_only_detected !== true ||
  report.non_gradient_only_validation !== 'FAIL' ||
  report.traceability_preserved !== 'PASS' ||
  report.real_visual_content_audit_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.blocked === true) === false ||
  report.source_audits.every((audit) => audit.gradient_only_detected === true) === false ||
  report.source_audits.every((audit) => audit.scene_content_present === false) === false ||
  report.source_audits.every((audit) => audit.source_visual_content_audit_ready === 'PASS') === false
) {
  console.error(
    'Expected BLOCKED_REAL_SCENE_CONTENT_REQUIRED with gradient-only images blocked and audit PASS'
  );
  process.exit(1);
}

process.exit(0);
