import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_IMAGE_PROMPT_EXPORT_PATH } from '../services/movieAnalysisRealImagePromptExport.js';
import {
  REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT,
  REAL_SCENE_QUALITY_AUDIT_REPORT_PATH,
} from '../services/movieAnalysisRealSceneQualityAudit.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_MOVIE_FRAME_INGESTED_STATUS,
  REAL_MOVIE_FRAME_INGESTION_MD_PATH,
  REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT,
  REAL_MOVIE_FRAME_INGESTION_REPORT_PATH,
  REAL_MOVIE_FRAMES_MANIFEST_PATH,
  writeMovieAnalysisRealMovieFrameIngestion,
} from '../services/movieAnalysisRealMovieFrameIngestion.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const qualityAuditReportPath = path.join(projectRoot, REAL_SCENE_QUALITY_AUDIT_REPORT_PATH);
if (!fs.existsSync(qualityAuditReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_SCENE_QUALITY_AUDIT_REPORT_PATH}`);
  process.exit(1);
}

const qualityAuditReport = JSON.parse(fs.readFileSync(qualityAuditReportPath, 'utf8')) as {
  final_verdict: string;
};
if (qualityAuditReport.final_verdict !== REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-009 ${REAL_SCENE_QUALITY_AUDIT_REPORT_PATH} must be ${REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH))) {
  console.error(`Missing required input: ${REAL_IMAGE_PROMPT_EXPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealMovieFrameIngestion(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} real_frame_present=${report.real_frame_present} object_diversity=${report.object_diversity} texture_density=${report.texture_density} cinematic_detail=${report.cinematic_detail} scene_semantic_content=${report.scene_semantic_content} traceability_preserved=${report.traceability_preserved} real_movie_frame_ingestion_ready=${report.real_movie_frame_ingestion_ready}`
);
for (const audit of report.source_audits) {
  const metrics = audit.metrics
    ? `texture=${audit.metrics.texture_density.toFixed(2)} diversity=${audit.metrics.object_diversity} cinematic=${audit.metrics.cinematic_detail_score.toFixed(4)} semantic=${audit.metrics.scene_semantic_distance.toFixed(2)} procedural=${audit.metrics.procedural_pattern_detected}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: frame=${audit.real_frame_present} diversity=${audit.object_diversity} texture=${audit.texture_density} cinematic=${audit.cinematic_detail} semantic=${audit.scene_semantic_content} trace=${audit.traceability_preserved} ${metrics} ready=${audit.source_ingestion_ready}`
  );
}
console.log(`report=${REAL_MOVIE_FRAME_INGESTION_REPORT_PATH}`);
console.log(`markdown=${REAL_MOVIE_FRAME_INGESTION_MD_PATH}`);
console.log(`manifest=${REAL_MOVIE_FRAMES_MANIFEST_PATH}`);
console.log(`entries=${report.entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_MOVIE_FRAME_INGESTION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, REAL_MOVIE_FRAMES_MANIFEST_PATH)) ||
  report.certification_status !== REAL_MOVIE_FRAME_INGESTED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.real_frame_present !== 'PASS' ||
  report.object_diversity !== 'PASS' ||
  report.texture_density !== 'PASS' ||
  report.cinematic_detail !== 'PASS' ||
  report.scene_semantic_content !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.real_movie_frame_ingestion_ready !== 'PASS' ||
  report.entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_ingestion_ready === 'PASS') === false ||
  report.source_audits.every((audit) => audit.procedural_pattern_detected === false) === false
) {
  console.error(
    'Expected REAL_MOVIE_FRAME_INGESTED with cinematic movie frames and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
