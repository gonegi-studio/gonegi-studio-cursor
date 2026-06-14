import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT,
  LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
  LEVEL2_FULLY_CERTIFIED_V2_STATUS,
} from '../services/movieAnalysisLevel2FinalCertificationV2.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_MD_PATH,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  LONG_SEQUENCE_VALIDATION_EXPORT_DIR,
  LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
  SEQUENCE_LENGTHS_TESTED,
  SEQUENCE_LENGTH_WINDOWS,
  writeMovieAnalysisLongSequenceConsistencyValidation,
} from '../services/movieAnalysisLongSequenceConsistencyValidation.js';
import { VIDEO_IDENTITY_DIR } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_LOCATION_DIR } from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from '../services/movieAnalysisRealVideoStyleConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from '../services/movieAnalysisRealVideoMotionConsistencyValidation.js';
import { VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH } from '../services/movieAnalysisRealVideoMasterCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const level2FinalPath = path.join(projectRoot, LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH);
if (!fs.existsSync(level2FinalPath)) {
  console.error(`Missing required upstream asset: ${LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH}`);
  process.exit(1);
}

const level2FinalReport = JSON.parse(fs.readFileSync(level2FinalPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (level2FinalReport.final_verdict !== LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: Required ${LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT}`
  );
  process.exit(1);
}
if (level2FinalReport.certification_status !== LEVEL2_FULLY_CERTIFIED_V2_STATUS) {
  console.error(`PRECHECK FAIL: Required status ${LEVEL2_FULLY_CERTIFIED_V2_STATUS}`);
  process.exit(1);
}

for (const asset of [
  VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
  VIDEO_IDENTITY_DIR,
  VIDEO_LOCATION_DIR,
  VIDEO_STYLE_DIR,
  VIDEO_MOTION_DIR,
]) {
  const abs = path.join(projectRoot, asset);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisLongSequenceConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} sequence_lengths_tested=${report.sequence_lengths_tested} character_persistence=${report.character_persistence} location_persistence=${report.location_persistence} style_persistence=${report.style_persistence} motion_persistence=${report.motion_persistence} story_persistence=${report.story_persistence} traceability_preserved=${report.traceability_preserved} long_sequence_identity_break=${report.long_sequence_identity_break} long_sequence_location_break=${report.long_sequence_location_break} long_sequence_style_break=${report.long_sequence_style_break} long_sequence_motion_break=${report.long_sequence_motion_break} long_sequence_story_break=${report.long_sequence_story_break} long_sequence_consistency_validation_ready=${report.long_sequence_consistency_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: character=${audit.character_persistence} location=${audit.location_persistence} style=${audit.style_persistence} motion=${audit.motion_persistence} story=${audit.story_persistence} ready=${audit.source_long_sequence_validated} windows=${audit.validation_windows.length}`
  );
}
console.log(`report=${LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${LONG_SEQUENCE_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${LONG_SEQUENCE_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const exportFiles = fs
  .readdirSync(path.join(projectRoot, LONG_SEQUENCE_VALIDATION_EXPORT_DIR))
  .filter((name) => name.endsWith('-long-sequence-validation.json'));

if (
  !fs.existsSync(path.join(projectRoot, LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LONG_SEQUENCE_VALIDATION_MANIFEST_PATH)) ||
  report.certification_status !== LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.sequence_lengths_tested !== SEQUENCE_LENGTHS_TESTED ||
  report.sequence_lengths_tested !== SEQUENCE_LENGTH_WINDOWS.length ||
  report.character_persistence !== 'PASS' ||
  report.location_persistence !== 'PASS' ||
  report.style_persistence !== 'PASS' ||
  report.motion_persistence !== 'PASS' ||
  report.story_persistence !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.long_sequence_identity_break !== false ||
  report.long_sequence_location_break !== false ||
  report.long_sequence_style_break !== false ||
  report.long_sequence_motion_break !== false ||
  report.long_sequence_story_break !== false ||
  report.long_sequence_consistency_validation_ready !== 'PASS' ||
  exportFiles.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.validation_windows.length === SEQUENCE_LENGTHS_TESTED) ===
    false
) {
  console.error(
    'Expected LONG_SEQUENCE_CONSISTENCY_VALIDATED with 6 sequence windows and all persistence checks PASS'
  );
  process.exit(1);
}

process.exit(0);
