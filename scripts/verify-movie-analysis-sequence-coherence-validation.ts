import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FRAME_CONSISTENCY_VALIDATED_STATUS,
  FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT,
  FRAME_CONSISTENCY_VALIDATION_REPORT_PATH,
} from '../services/movieAnalysisFrameConsistencyValidation.js';
import { REAL_MOVIE_FRAMES_MANIFEST_PATH } from '../services/movieAnalysisRealMovieFrameIngestion.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  MIN_SEQUENCE_COHERENCE_SCORE,
  SEQUENCE_COHERENCE_VALIDATED_STATUS,
  SEQUENCE_COHERENCE_VALIDATION_MD_PATH,
  SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT,
  SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH,
  writeMovieAnalysisSequenceCoherenceValidation,
} from '../services/movieAnalysisSequenceCoherenceValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const consistencyReportPath = path.join(projectRoot, FRAME_CONSISTENCY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(consistencyReportPath)) {
  console.error(`Missing required upstream asset: ${FRAME_CONSISTENCY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const consistencyReport = JSON.parse(fs.readFileSync(consistencyReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (consistencyReport.final_verdict !== FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-012 ${FRAME_CONSISTENCY_VALIDATION_REPORT_PATH} must be ${FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT}`
  );
  process.exit(1);
}
if (consistencyReport.certification_status !== FRAME_CONSISTENCY_VALIDATED_STATUS) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-012 status must be ${FRAME_CONSISTENCY_VALIDATED_STATUS}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_MOVIE_FRAMES_MANIFEST_PATH))) {
  console.error(`Missing required input: ${REAL_MOVIE_FRAMES_MANIFEST_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisSequenceCoherenceValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} sequence_coherence=${report.sequence_coherence} narrative_progression=${report.narrative_progression} emotion_progression=${report.emotion_progression} continuity_preservation=${report.continuity_preservation} dna_persistence=${report.dna_persistence} adapter_traceability=${report.adapter_traceability} sequence_coherence_validation_ready=${report.sequence_coherence_validation_ready}`
);
for (const audit of report.source_audits) {
  const metrics = audit.progression_metrics
    ? `coherence=${audit.progression_metrics.sequence_coherence_score.toFixed(4)} narrative=${audit.progression_metrics.narrative_progression_score.toFixed(4)} emotion=${audit.progression_metrics.emotion_progression_score.toFixed(4)} continuity=${audit.progression_metrics.continuity_preservation_score.toFixed(4)} drift=${audit.progression_metrics.sequence_drift.toFixed(4)}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: sequence=${audit.sequence_coherence} narrative=${audit.narrative_progression} emotion=${audit.emotion_progression} continuity=${audit.continuity_preservation} dna=${audit.dna_persistence} trace=${audit.adapter_traceability} seq_drift=${audit.sequence_drift} narrative_break=${audit.narrative_break} continuity_break=${audit.continuity_break} ${metrics} ready=${audit.source_sequence_ready}`
  );
}
console.log(`report=${SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${SEQUENCE_COHERENCE_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH)) ||
  report.certification_status !== SEQUENCE_COHERENCE_VALIDATED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.sequence_coherence !== 'PASS' ||
  report.narrative_progression !== 'PASS' ||
  report.emotion_progression !== 'PASS' ||
  report.continuity_preservation !== 'PASS' ||
  report.dna_persistence !== 'PASS' ||
  report.adapter_traceability !== 'PASS' ||
  report.sequence_coherence_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_sequence_ready === 'PASS') === false ||
  report.source_audits.every((audit) => audit.sequence_drift === false) === false ||
  report.source_audits.every((audit) => audit.narrative_break === false) === false ||
  report.source_audits.every((audit) => audit.continuity_break === false) === false ||
  report.source_audits.every(
    (audit) =>
      audit.progression_metrics !== null &&
      audit.progression_metrics.sequence_coherence_score >= MIN_SEQUENCE_COHERENCE_SCORE
  ) === false
) {
  console.error(
    'Expected SEQUENCE_COHERENCE_VALIDATED with coherent frame sequences and no drift breaks'
  );
  process.exit(1);
}

process.exit(0);
