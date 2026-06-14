import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_TO_FRAME_VALIDATED_STATUS,
  DNA_TO_FRAME_VALIDATION_PASS_VERDICT,
  DNA_TO_FRAME_VALIDATION_REPORT_PATH,
} from '../services/movieAnalysisDnaToFrameValidation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  FRAME_CONSISTENCY_VALIDATED_STATUS,
  FRAME_CONSISTENCY_VALIDATION_MD_PATH,
  FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT,
  FRAME_CONSISTENCY_VALIDATION_REPORT_PATH,
  MIN_CONSISTENCY_SCORE,
  writeMovieAnalysisFrameConsistencyValidation,
} from '../services/movieAnalysisFrameConsistencyValidation.js';
import { REAL_MOVIE_FRAMES_MANIFEST_PATH } from '../services/movieAnalysisRealMovieFrameIngestion.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const dnaValidationReportPath = path.join(projectRoot, DNA_TO_FRAME_VALIDATION_REPORT_PATH);
if (!fs.existsSync(dnaValidationReportPath)) {
  console.error(`Missing required upstream asset: ${DNA_TO_FRAME_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const dnaValidationReport = JSON.parse(fs.readFileSync(dnaValidationReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (dnaValidationReport.final_verdict !== DNA_TO_FRAME_VALIDATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-011 ${DNA_TO_FRAME_VALIDATION_REPORT_PATH} must be ${DNA_TO_FRAME_VALIDATION_PASS_VERDICT}`
  );
  process.exit(1);
}
if (dnaValidationReport.certification_status !== DNA_TO_FRAME_VALIDATED_STATUS) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-011 status must be ${DNA_TO_FRAME_VALIDATED_STATUS}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_MOVIE_FRAMES_MANIFEST_PATH))) {
  console.error(`Missing required input: ${REAL_MOVIE_FRAMES_MANIFEST_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisFrameConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} character_consistency=${report.character_consistency} emotion_consistency=${report.emotion_consistency} storytelling_consistency=${report.storytelling_consistency} continuity_consistency=${report.continuity_consistency} dna_consistency=${report.dna_consistency} adapter_traceability=${report.adapter_traceability} frame_consistency_validation_ready=${report.frame_consistency_validation_ready}`
);
for (const audit of report.source_audits) {
  const drift = audit.drift_metrics
    ? `character=${audit.drift_metrics.character_drift.toFixed(4)} emotion=${audit.drift_metrics.emotion_drift.toFixed(4)} storytelling=${audit.drift_metrics.storytelling_drift.toFixed(4)} score=${audit.drift_metrics.consistency_score.toFixed(4)}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: character=${audit.character_consistency} emotion=${audit.emotion_consistency} storytelling=${audit.storytelling_consistency} continuity=${audit.continuity_consistency} dna=${audit.dna_consistency} trace=${audit.adapter_traceability} char_drift=${audit.character_drift} emo_drift=${audit.emotion_drift} story_drift=${audit.storytelling_drift} ${drift} ready=${audit.source_consistency_ready}`
  );
}
console.log(`report=${FRAME_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${FRAME_CONSISTENCY_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, FRAME_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  report.certification_status !== FRAME_CONSISTENCY_VALIDATED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.character_consistency !== 'PASS' ||
  report.emotion_consistency !== 'PASS' ||
  report.storytelling_consistency !== 'PASS' ||
  report.continuity_consistency !== 'PASS' ||
  report.dna_consistency !== 'PASS' ||
  report.adapter_traceability !== 'PASS' ||
  report.frame_consistency_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_consistency_ready === 'PASS') === false ||
  report.source_audits.every((audit) => audit.character_drift === false) === false ||
  report.source_audits.every((audit) => audit.emotion_drift === false) === false ||
  report.source_audits.every((audit) => audit.storytelling_drift === false) === false ||
  report.source_audits.every(
    (audit) =>
      audit.drift_metrics !== null &&
      audit.drift_metrics.consistency_score >= MIN_CONSISTENCY_SCORE
  ) === false
) {
  console.error(
    'Expected FRAME_CONSISTENCY_VALIDATED with DNA-maintained frame consistency and no drift'
  );
  process.exit(1);
}

process.exit(0);
