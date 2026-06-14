import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealCharacterConsistencyValidation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_MULTI_FRAME_COUNT,
  EXPECTED_SOURCE_COUNT,
  FRAMES_PER_SOURCE,
  MULTI_FRAME_CHARACTER_DIR,
  MULTI_FRAME_CHARACTER_MANIFEST_PATH,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_MD_PATH,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisRealMultiFrameCharacterDriftValidation,
} from '../services/movieAnalysisRealMultiFrameCharacterDriftValidation.js';
import {
  MULTI_FRAME_LOCATION_MANIFEST_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealMultiFrameLocationDriftValidation.js';
import {
  MODEL_TEST_GENERATION_IMAGES_DIR,
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealModelTestGeneration.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

function assertUpstreamReport(
  reportPath: string,
  passVerdict: string,
  statusMessage: string | null,
  label: string
): void {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${reportPath}`);
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (report.final_verdict !== passVerdict) {
    console.error(`PRECHECK FAIL: ${label} ${reportPath} must be ${passVerdict}`);
    process.exit(1);
  }
  if (statusMessage && report.certification_status !== statusMessage) {
    console.error(`PRECHECK FAIL: ${label} status must be ${statusMessage}`);
    process.exit(1);
  }
}

assertUpstreamReport(
  REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  'L2F-003'
);
assertUpstreamReport(
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE,
  'L2F-005'
);
assertUpstreamReport(
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
  'L2F-002'
);

if (!fs.existsSync(path.join(projectRoot, MODEL_TEST_GENERATION_MANIFEST_PATH))) {
  console.error(`Missing required upstream asset: ${MODEL_TEST_GENERATION_MANIFEST_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, MULTI_FRAME_LOCATION_MANIFEST_PATH))) {
  console.error(`Missing required upstream asset: ${MULTI_FRAME_LOCATION_MANIFEST_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, MODEL_TEST_GENERATION_IMAGES_DIR))) {
  console.error(`Missing required input directory: ${MODEL_TEST_GENERATION_IMAGES_DIR}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealMultiFrameCharacterDriftValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} frame_count=${report.frame_count} same_character_identity=${report.same_character_identity} facial_structure_persistence=${report.facial_structure_persistence} hairstyle_persistence=${report.hairstyle_persistence} color_palette_persistence=${report.color_palette_persistence} dna_persistence=${report.dna_persistence} cross_frame_character_consistency=${report.cross_frame_character_consistency} traceability_preserved=${report.traceability_preserved} multi_frame_character_consistency=${report.multi_frame_character_consistency} character_drift=${report.character_drift} identity_loss=${report.identity_loss} hairstyle_drift=${report.hairstyle_drift} dna_mismatch=${report.dna_mismatch} real_multi_frame_character_drift_validation_ready=${report.real_multi_frame_character_drift_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: identity=${audit.same_character_identity} face=${audit.facial_structure_persistence} hair=${audit.hairstyle_persistence} palette=${audit.color_palette_persistence} dna=${audit.dna_persistence} cross_frame=${audit.cross_frame_character_consistency} trace=${audit.traceability_preserved} ready=${audit.source_multi_frame_character_validated} frames=${audit.character_frames.length}`
  );
}
console.log(`report=${REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_MD_PATH}`);
console.log(`manifest=${MULTI_FRAME_CHARACTER_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const multiFrameFiles = fs.existsSync(path.join(projectRoot, MULTI_FRAME_CHARACTER_DIR))
  ? fs
      .readdirSync(path.join(projectRoot, MULTI_FRAME_CHARACTER_DIR))
      .filter((name) => name.endsWith('-multi-frame-character.json'))
  : [];

if (
  !fs.existsSync(path.join(projectRoot, REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_FRAME_CHARACTER_MANIFEST_PATH)) ||
  report.certification_status !== REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.frame_count !== EXPECTED_MULTI_FRAME_COUNT ||
  report.same_character_identity !== 'PASS' ||
  report.facial_structure_persistence !== 'PASS' ||
  report.hairstyle_persistence !== 'PASS' ||
  report.color_palette_persistence !== 'PASS' ||
  report.dna_persistence !== 'PASS' ||
  report.cross_frame_character_consistency !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.multi_frame_character_consistency !== 'PASS' ||
  report.character_drift !== false ||
  report.identity_loss !== false ||
  report.hairstyle_drift !== false ||
  report.dna_mismatch !== false ||
  report.real_multi_frame_character_drift_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_multi_frame_character_validated === 'PASS') === false ||
  report.source_audits.every((audit) => audit.character_frames.length === FRAMES_PER_SOURCE) === false ||
  multiFrameFiles.length !== EXPECTED_SOURCE_COUNT
) {
  console.error(
    'Expected multi-frame character drift validation for 4 sources with 16 frames and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
