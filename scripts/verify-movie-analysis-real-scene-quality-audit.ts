import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT,
  REAL_SCENE_CONTENT_INGESTION_REPORT_PATH,
  REAL_SCENE_CONTENT_MANIFEST_PATH,
} from '../services/movieAnalysisRealSceneContentIngestion.js';
import {
  BLOCKED_REAL_SCENE_QUALITY_REQUIRED_STATUS,
  EXPECTED_SOURCE_COUNT,
  REAL_SCENE_QUALITY_AUDIT_MD_PATH,
  REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT,
  REAL_SCENE_QUALITY_AUDIT_REPORT_PATH,
  writeMovieAnalysisRealSceneQualityAudit,
} from '../services/movieAnalysisRealSceneQualityAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const ingestionReportPath = path.join(projectRoot, REAL_SCENE_CONTENT_INGESTION_REPORT_PATH);
if (!fs.existsSync(ingestionReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_SCENE_CONTENT_INGESTION_REPORT_PATH}`);
  process.exit(1);
}

const ingestionReport = JSON.parse(fs.readFileSync(ingestionReportPath, 'utf8')) as {
  final_verdict: string;
};
if (ingestionReport.final_verdict !== REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-008 ${REAL_SCENE_CONTENT_INGESTION_REPORT_PATH} must be ${REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_SCENE_CONTENT_MANIFEST_PATH))) {
  console.error(`Missing required input: ${REAL_SCENE_CONTENT_MANIFEST_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealSceneQualityAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} subject_clarity=${report.subject_clarity} composition_quality=${report.composition_quality} environment_quality=${report.environment_quality} scene_complexity=${report.scene_complexity} cinematic_structure=${report.cinematic_structure} adapter_traceability=${report.adapter_traceability} low_detail_scene=${report.low_detail_scene} random_noise_scene=${report.random_noise_scene} low_information_scene=${report.low_information_scene} real_scene_quality_audit_ready=${report.real_scene_quality_audit_ready}`
);
for (const audit of report.source_audits) {
  const metrics = audit.metrics
    ? `flat=${audit.metrics.flat_region_ratio.toFixed(4)} noise=${audit.metrics.micro_noise_ratio.toFixed(4)} axis=${audit.metrics.axis_aligned_edge_ratio.toFixed(4)} entropy=${audit.metrics.color_entropy.toFixed(2)}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: blocked=${audit.blocked} quality=${audit.scene_quality_present} low_detail=${audit.low_detail_scene} random_noise=${audit.random_noise_scene} low_info=${audit.low_information_scene} ${metrics} subject=${audit.subject_clarity} comp=${audit.composition_quality} env=${audit.environment_quality} complexity=${audit.scene_complexity} cinematic=${audit.cinematic_structure} trace=${audit.adapter_traceability} ready=${audit.source_scene_quality_audit_ready}`
  );
}
console.log(`report=${REAL_SCENE_QUALITY_AUDIT_REPORT_PATH}`);
console.log(`markdown=${REAL_SCENE_QUALITY_AUDIT_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_SCENE_QUALITY_AUDIT_REPORT_PATH)) ||
  report.certification_status !== BLOCKED_REAL_SCENE_QUALITY_REQUIRED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_traceability !== 'PASS' ||
  report.low_detail_scene !== true ||
  report.random_noise_scene !== true ||
  report.low_information_scene !== true ||
  report.real_scene_quality_audit_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.blocked === true) === false ||
  report.source_audits.every((audit) => audit.scene_quality_present === false) === false ||
  report.source_audits.every((audit) => audit.low_detail_scene === true) === false ||
  report.source_audits.every((audit) => audit.random_noise_scene === true) === false ||
  report.source_audits.every((audit) => audit.low_information_scene === true) === false ||
  report.source_audits.every((audit) => audit.source_scene_quality_audit_ready === 'PASS') === false
) {
  console.error(
    'Expected BLOCKED_REAL_SCENE_QUALITY_REQUIRED with synthetic procedural scenes blocked and audit PASS'
  );
  process.exit(1);
}

process.exit(0);
