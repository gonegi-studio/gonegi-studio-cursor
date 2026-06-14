import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisProductionBatchConsistencyValidation.js';
import {
  PRODUCTION_MEMORY_STRESS_TEST_EXPORT_DIR,
  PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
  PRODUCTION_MEMORY_STRESS_TEST_MD_PATH,
  PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT,
  PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
  PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE,
  STRESS_TEST_SCALE_COUNT,
  STRESS_TEST_SCALES,
  writeMovieAnalysisProductionMemoryStressTest,
} from '../services/movieAnalysisProductionMemoryStressTest.js';
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

const productionBatchPath = path.join(projectRoot, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(productionBatchPath)) {
  console.error(`Missing required upstream asset: ${PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const productionBatchReport = JSON.parse(fs.readFileSync(productionBatchPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (productionBatchReport.final_verdict !== PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: Required ${PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}
if (productionBatchReport.certification_status !== PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Required status ${PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

for (const asset of [
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
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

const report = writeMovieAnalysisProductionMemoryStressTest(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} stress_test_scale_count=${report.stress_test_scale_count} identity_memory_decay=${report.identity_memory_decay} location_memory_decay=${report.location_memory_decay} style_memory_decay=${report.style_memory_decay} motion_memory_decay=${report.motion_memory_decay} reentry_after_long_gap=${report.reentry_after_long_gap} cross_batch_traceability=${report.cross_batch_traceability} memory_loss=${report.memory_loss} identity_collapse=${report.identity_collapse} location_collapse=${report.location_collapse} style_collapse=${report.style_collapse} traceability_break=${report.traceability_break} production_memory_stress_test_ready=${report.production_memory_stress_test_ready}`
);
for (const scale of report.scale_results) {
  console.log(
    `  ${scale.stress_scale_id}: scenes=${scale.scene_count} identity_decay=${scale.identity_memory_decay} location_decay=${scale.location_memory_decay} style_decay=${scale.style_memory_decay} motion_decay=${scale.motion_memory_decay} reentry=${scale.reentry_after_long_gap} traceability=${scale.cross_batch_traceability} memory_loss=${scale.memory_loss} validated=${scale.production_memory_stress_validated}`
  );
}
console.log(`report=${PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH}`);
console.log(`markdown=${PRODUCTION_MEMORY_STRESS_TEST_MD_PATH}`);
console.log(`manifest=${PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_MEMORY_STRESS_TEST_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, PRODUCTION_MEMORY_STRESS_TEST_EXPORT_DIR, 'production-memory-stress-scales.json')
  ) ||
  report.certification_status !== PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.stress_test_scale_count !== STRESS_TEST_SCALE_COUNT ||
  report.identity_memory_decay !== 'PASS' ||
  report.location_memory_decay !== 'PASS' ||
  report.style_memory_decay !== 'PASS' ||
  report.motion_memory_decay !== 'PASS' ||
  report.reentry_after_long_gap !== 'PASS' ||
  report.cross_batch_traceability !== 'PASS' ||
  report.memory_loss !== false ||
  report.identity_collapse !== false ||
  report.location_collapse !== false ||
  report.style_collapse !== false ||
  report.traceability_break !== false ||
  report.production_memory_stress_test_ready !== 'PASS' ||
  report.scale_results.length !== STRESS_TEST_SCALE_COUNT ||
  !STRESS_TEST_SCALES.every((scale) =>
    report.scale_results.some(
      (result) =>
        result.production_scale === scale && result.production_memory_stress_validated === 'PASS'
    )
  )
) {
  console.error(
    'Expected PRODUCTION_MEMORY_STRESS_TEST_VALIDATED with scales 5000/10000/50000 PASS'
  );
  process.exit(1);
}

process.exit(0);
