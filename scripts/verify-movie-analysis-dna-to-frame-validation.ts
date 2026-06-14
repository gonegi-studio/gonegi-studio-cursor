import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_TO_FRAME_VALIDATED_STATUS,
  DNA_TO_FRAME_VALIDATION_MD_PATH,
  DNA_TO_FRAME_VALIDATION_PASS_VERDICT,
  DNA_TO_FRAME_VALIDATION_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  MIN_DNA_ALIGNMENT_SCORE,
  writeMovieAnalysisDnaToFrameValidation,
} from '../services/movieAnalysisDnaToFrameValidation.js';
import {
  REAL_MOVIE_FRAME_INGESTED_STATUS,
  REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT,
  REAL_MOVIE_FRAME_INGESTION_REPORT_PATH,
  REAL_MOVIE_FRAMES_MANIFEST_PATH,
} from '../services/movieAnalysisRealMovieFrameIngestion.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const ingestionReportPath = path.join(projectRoot, REAL_MOVIE_FRAME_INGESTION_REPORT_PATH);
if (!fs.existsSync(ingestionReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_MOVIE_FRAME_INGESTION_REPORT_PATH}`);
  process.exit(1);
}

const ingestionReport = JSON.parse(fs.readFileSync(ingestionReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (ingestionReport.final_verdict !== REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-010 ${REAL_MOVIE_FRAME_INGESTION_REPORT_PATH} must be ${REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT}`
  );
  process.exit(1);
}
if (ingestionReport.certification_status !== REAL_MOVIE_FRAME_INGESTED_STATUS) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-010 status must be ${REAL_MOVIE_FRAME_INGESTED_STATUS}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_MOVIE_FRAMES_MANIFEST_PATH))) {
  console.error(`Missing required input: ${REAL_MOVIE_FRAMES_MANIFEST_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisDnaToFrameValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} scene_dna_alignment=${report.scene_dna_alignment} camera_dna_alignment=${report.camera_dna_alignment} emotion_dna_alignment=${report.emotion_dna_alignment} storytelling_dna_alignment=${report.storytelling_dna_alignment} continuity_dna_alignment=${report.continuity_dna_alignment} adapter_traceability=${report.adapter_traceability} dna_to_frame_validation_ready=${report.dna_to_frame_validation_ready}`
);
for (const audit of report.source_audits) {
  const scores = audit.alignment_scores
    ? `dna=${audit.alignment_scores.dna_alignment_score.toFixed(4)} scene=${audit.alignment_scores.scene_dna_alignment_score.toFixed(4)} camera=${audit.alignment_scores.camera_dna_alignment_score.toFixed(4)} emotion=${audit.alignment_scores.emotion_dna_alignment_score.toFixed(4)} storytelling=${audit.alignment_scores.storytelling_dna_alignment_score.toFixed(4)} continuity=${audit.alignment_scores.continuity_dna_alignment_score.toFixed(4)} patterns=${audit.matched_pattern_signatures.length}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: frame=${audit.real_frame_verified} scene=${audit.scene_dna_alignment} camera=${audit.camera_dna_alignment} emotion=${audit.emotion_dna_alignment} storytelling=${audit.storytelling_dna_alignment} continuity=${audit.continuity_dna_alignment} trace=${audit.adapter_traceability} dna_not_visible=${audit.dna_not_visible} ${scores} ready=${audit.source_validation_ready}`
  );
}
console.log(`report=${DNA_TO_FRAME_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${DNA_TO_FRAME_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_TO_FRAME_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, DNA_TO_FRAME_VALIDATION_REPORT_PATH)) ||
  report.certification_status !== DNA_TO_FRAME_VALIDATED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.scene_dna_alignment !== 'PASS' ||
  report.camera_dna_alignment !== 'PASS' ||
  report.emotion_dna_alignment !== 'PASS' ||
  report.storytelling_dna_alignment !== 'PASS' ||
  report.continuity_dna_alignment !== 'PASS' ||
  report.adapter_traceability !== 'PASS' ||
  report.dna_to_frame_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_validation_ready === 'PASS') === false ||
  report.source_audits.every((audit) => audit.dna_not_visible === false) === false ||
  report.source_audits.every(
    (audit) =>
      audit.alignment_scores !== null &&
      audit.alignment_scores.dna_alignment_score >= MIN_DNA_ALIGNMENT_SCORE
  ) === false
) {
  console.error(
    'Expected DNA_TO_FRAME_VALIDATED with DNA-aligned real movie frames and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
