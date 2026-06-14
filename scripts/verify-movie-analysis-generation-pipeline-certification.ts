import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  GENERATION_PIPELINE_CERTIFICATION_DIR,
  GENERATION_PIPELINE_CERTIFIED_STATUS,
  GENERATION_PIPELINE_CERTIFICATION_MD_PATH,
  GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT,
  GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
  LEVEL2E_TRACK_COUNT,
  LEVEL2E_TRACK_ENTRIES,
  writeMovieAnalysisGenerationPipelineCertification,
} from '../services/movieAnalysisGenerationPipelineCertification.js';
import {
  SEQUENCE_COHERENCE_VALIDATED_STATUS,
  SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT,
  SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH,
} from '../services/movieAnalysisSequenceCoherenceValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const sequenceReportPath = path.join(projectRoot, SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH);
if (!fs.existsSync(sequenceReportPath)) {
  console.error(`Missing required upstream asset: ${SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const sequenceReport = JSON.parse(fs.readFileSync(sequenceReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (sequenceReport.final_verdict !== SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-013 ${SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH} must be ${SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT}`
  );
  process.exit(1);
}
if (sequenceReport.certification_status !== SEQUENCE_COHERENCE_VALIDATED_STATUS) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-013 status must be ${SEQUENCE_COHERENCE_VALIDATED_STATUS}`
  );
  process.exit(1);
}

for (const entry of LEVEL2E_TRACK_ENTRIES) {
  const abs = path.join(projectRoot, entry.report_path);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${entry.report_path} (${entry.track_id})`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisGenerationPipelineCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level2e_tracks_complete=${report.level2e_tracks_complete} dna_to_frame_validated=${report.dna_to_frame_validated} frame_consistency_validated=${report.frame_consistency_validated} sequence_coherence_validated=${report.sequence_coherence_validated} generation_readiness=${report.generation_readiness} traceability_preserved=${report.traceability_preserved} cross_source_consistency=${report.cross_source_consistency} pipeline_break=${report.pipeline_break} certification_failure=${report.certification_failure} generation_pipeline_certification_ready=${report.generation_pipeline_certification_ready}`
);
for (const audit of report.track_audits) {
  console.log(`  ${audit.track_id}: exists=${audit.report_exists} passed=${audit.track_passed}`);
}
console.log(`report=${GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${GENERATION_PIPELINE_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, GENERATION_PIPELINE_CERTIFICATION_DIR)) ||
  report.certification_status !== GENERATION_PIPELINE_CERTIFIED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2e_track_count !== LEVEL2E_TRACK_COUNT ||
  report.level2e_tracks_complete !== 'PASS' ||
  report.dna_to_frame_validated !== 'PASS' ||
  report.frame_consistency_validated !== 'PASS' ||
  report.sequence_coherence_validated !== 'PASS' ||
  report.generation_readiness !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.cross_source_consistency !== 'PASS' ||
  report.pipeline_break !== false ||
  report.certification_failure !== false ||
  report.generation_pipeline_certification_ready !== 'PASS' ||
  report.track_audits.length !== LEVEL2E_TRACK_COUNT ||
  report.track_audits.every((audit) => audit.track_passed) === false
) {
  console.error(
    'Expected GENERATION_PIPELINE_CERTIFIED with full Level2E chain and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
