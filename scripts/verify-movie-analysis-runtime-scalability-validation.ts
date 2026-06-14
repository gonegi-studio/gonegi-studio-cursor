import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
  MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
  MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisMultiSeasonContinuityValidation.js';
import {
  RUNTIME_SCALABILITY_SCALE_COUNT,
  RUNTIME_SCALABILITY_SCALES,
  RUNTIME_SCALABILITY_VALIDATION_EXPORT_DIR,
  RUNTIME_SCALABILITY_VALIDATION_MANIFEST_PATH,
  RUNTIME_SCALABILITY_VALIDATION_MD_PATH,
  RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
  RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
  RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisRuntimeScalabilityValidation,
} from '../services/movieAnalysisRuntimeScalabilityValidation.js';
import { VIDEO_IDENTITY_DIR } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_LOCATION_DIR } from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from '../services/movieAnalysisRealVideoMotionConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from '../services/movieAnalysisRealVideoStyleConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const multiSeasonPath = path.join(projectRoot, MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(multiSeasonPath)) {
  console.error(
    `PRECHECK FAIL: Missing required upstream asset: ${MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH}`
  );
  process.exit(1);
}

const multiSeasonReport = JSON.parse(fs.readFileSync(multiSeasonPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  multi_season_continuity_validation_ready: string;
};

if (multiSeasonReport.final_verdict !== MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH} must be ${MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (multiSeasonReport.certification_status !== MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE) {
  console.error(
    `PRECHECK FAIL: Multi-season continuity status must be ${MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE}`
  );
  process.exit(1);
}

if (multiSeasonReport.multi_season_continuity_validation_ready !== 'PASS') {
  console.error('PRECHECK FAIL: multi_season_continuity_validation_ready must be PASS');
  process.exit(1);
}

for (const asset of [VIDEO_IDENTITY_DIR, VIDEO_LOCATION_DIR, VIDEO_STYLE_DIR, VIDEO_MOTION_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisRuntimeScalabilityValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} runtime_scalability_scale_count=${report.runtime_scalability_scale_count} runtime_scalability=${report.runtime_scalability} large_scale_traceability=${report.large_scale_traceability} large_scale_memory_preservation=${report.large_scale_memory_preservation} large_scale_callback_preservation=${report.large_scale_callback_preservation} cross_season_scalability=${report.cross_season_scalability} cross_series_scalability=${report.cross_series_scalability} runtime_overflow=${report.runtime_overflow} scalability_failure=${report.scalability_failure} memory_collapse=${report.memory_collapse} traceability_collapse=${report.traceability_collapse} callback_collapse=${report.callback_collapse} series_scale_break=${report.series_scale_break} runtime_scalability_validation_ready=${report.runtime_scalability_validation_ready}`
);
for (const step of report.journey_steps) {
  console.log(
    `  ${step.scale_tier} (${step.episode_count} episodes): runtime=${step.runtime_scalability} traceability=${step.large_scale_traceability} memory=${step.large_scale_memory_preservation} callback=${step.large_scale_callback_preservation} season=${step.cross_season_scalability} series=${step.cross_series_scalability} validated=${step.runtime_scalability_validated}`
  );
}
console.log(`report=${RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${RUNTIME_SCALABILITY_VALIDATION_MD_PATH}`);
console.log(`manifest=${RUNTIME_SCALABILITY_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, RUNTIME_SCALABILITY_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, RUNTIME_SCALABILITY_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, RUNTIME_SCALABILITY_VALIDATION_EXPORT_DIR, 'runtime-scalability-journey.json')
  ) ||
  report.certification_status !== RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.runtime_scalability_scale_count !== RUNTIME_SCALABILITY_SCALE_COUNT ||
  report.runtime_scalability !== 'PASS' ||
  report.large_scale_traceability !== 'PASS' ||
  report.large_scale_memory_preservation !== 'PASS' ||
  report.large_scale_callback_preservation !== 'PASS' ||
  report.cross_season_scalability !== 'PASS' ||
  report.cross_series_scalability !== 'PASS' ||
  report.runtime_overflow !== false ||
  report.scalability_failure !== false ||
  report.memory_collapse !== false ||
  report.traceability_collapse !== false ||
  report.callback_collapse !== false ||
  report.series_scale_break !== false ||
  report.runtime_scalability_validation_ready !== 'PASS' ||
  report.journey_steps.length !== RUNTIME_SCALABILITY_SCALE_COUNT ||
  report.scale_results.length !== RUNTIME_SCALABILITY_SCALE_COUNT ||
  !RUNTIME_SCALABILITY_SCALES.every((scale, index) => report.scale_results[index]?.episode_count === scale)
) {
  console.error(
    'Expected RUNTIME_SCALABILITY_VALIDATED with 10K→100K→1M episode journey and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
