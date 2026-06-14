import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisMultiCharacterConsistencyValidation.js';
import {
  BATCH_SCENE_COUNT,
  BATCH_SCENE_SIZES,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_EXPORT_DIR,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MD_PATH,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisProductionBatchConsistencyValidation,
} from '../services/movieAnalysisProductionBatchConsistencyValidation.js';
import { VIDEO_IDENTITY_DIR } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_LOCATION_DIR } from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from '../services/movieAnalysisRealVideoStyleConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from '../services/movieAnalysisRealVideoMotionConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const multiCharacterPath = path.join(projectRoot, MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(multiCharacterPath)) {
  console.error(`Missing required upstream asset: ${MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const multiCharacterReport = JSON.parse(fs.readFileSync(multiCharacterPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (multiCharacterReport.final_verdict !== MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: Required ${MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}
if (multiCharacterReport.certification_status !== MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Required status ${MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

for (const asset of [
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  VIDEO_IDENTITY_DIR,
  VIDEO_LOCATION_DIR,
  VIDEO_STYLE_DIR,
  VIDEO_MOTION_DIR,
]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisProductionBatchConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} batch_scene_count=${report.batch_scene_count} character_consistency=${report.character_consistency} location_consistency=${report.location_consistency} style_consistency=${report.style_consistency} motion_consistency=${report.motion_consistency} batch_traceability=${report.batch_traceability} dna_binding=${report.dna_binding} batch_drift=${report.batch_drift} batch_memory_loss=${report.batch_memory_loss} batch_identity_break=${report.batch_identity_break} production_batch_consistency_validation_ready=${report.production_batch_consistency_validation_ready}`
);
for (const batch of report.batch_results) {
  console.log(
    `  ${batch.batch_id}: scenes=${batch.scene_count} character=${batch.character_consistency} location=${batch.location_consistency} style=${batch.style_consistency} motion=${batch.motion_consistency} traceability=${batch.batch_traceability} dna=${batch.dna_binding} drift=${batch.batch_drift} memory_loss=${batch.batch_memory_loss} identity_break=${batch.batch_identity_break} validated=${batch.production_batch_consistency_validated}`
  );
}
console.log(`report=${PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_EXPORT_DIR, 'production-batch-scenes.json')
  ) ||
  report.certification_status !== PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.batch_scene_count !== BATCH_SCENE_COUNT ||
  report.character_consistency !== 'PASS' ||
  report.location_consistency !== 'PASS' ||
  report.style_consistency !== 'PASS' ||
  report.motion_consistency !== 'PASS' ||
  report.batch_traceability !== 'PASS' ||
  report.dna_binding !== 'PASS' ||
  report.batch_drift !== false ||
  report.batch_memory_loss !== false ||
  report.batch_identity_break !== false ||
  report.production_batch_consistency_validation_ready !== 'PASS' ||
  report.batch_results.length !== BATCH_SCENE_COUNT ||
  !BATCH_SCENE_SIZES.every((size) =>
    report.batch_results.some(
      (batch) =>
        batch.batch_scene_size === size && batch.production_batch_consistency_validated === 'PASS'
    )
  )
) {
  console.error(
    'Expected PRODUCTION_BATCH_CONSISTENCY_VALIDATED with scene batches 100/250/500/1000 PASS'
  );
  process.exit(1);
}

process.exit(0);
