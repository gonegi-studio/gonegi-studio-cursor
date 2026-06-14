import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
  CHARACTER_REENTRY_VALIDATION_PASS_VERDICT,
  CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
  CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisCharacterReentryValidation.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LOCATION_JOURNEY_COUNT,
  LOCATION_REENTRY_VALIDATION_EXPORT_DIR,
  LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
  LOCATION_REENTRY_VALIDATION_MD_PATH,
  LOCATION_REENTRY_VALIDATION_PASS_VERDICT,
  LOCATION_REENTRY_VALIDATION_REPORT_PATH,
  LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE,
  LOCATION_TRANSITION_COUNT,
  writeMovieAnalysisLocationReentryValidation,
} from '../services/movieAnalysisLocationReentryValidation.js';
import { VIDEO_LOCATION_DIR } from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const characterReentryPath = path.join(projectRoot, CHARACTER_REENTRY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(characterReentryPath)) {
  console.error(`Missing required upstream asset: ${CHARACTER_REENTRY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const characterReentryReport = JSON.parse(fs.readFileSync(characterReentryPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (characterReentryReport.final_verdict !== CHARACTER_REENTRY_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: Required ${CHARACTER_REENTRY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}
if (characterReentryReport.certification_status !== CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Required status ${CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

for (const asset of [CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH, VIDEO_LOCATION_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisLocationReentryValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} journey_location_count=${report.journey_location_count} journey_transition_count=${report.journey_transition_count} location_identity=${report.location_identity} indoor_anchor=${report.indoor_anchor} layout_anchor=${report.layout_anchor} lighting_anchor=${report.lighting_anchor} environment_dna=${report.environment_dna} location_memory_preserved=${report.location_memory_preserved} location_reentry_failure=${report.location_reentry_failure} location_memory_loss=${report.location_memory_loss} location_reentry_validation_ready=${report.location_reentry_validation_ready}`
);
for (const step of report.journey_steps) {
  console.log(
    `  ${step.location_id}: location=${step.location_identity} indoor=${step.indoor_anchor} layout=${step.layout_anchor} lighting=${step.lighting_anchor} dna=${step.environment_dna} memory=${step.location_memory_preserved}`
  );
}
console.log(
  `  reentry: location=${report.reentry_result.location_identity} indoor=${report.reentry_result.indoor_anchor} layout=${report.reentry_result.layout_anchor} lighting=${report.reentry_result.lighting_anchor} dna=${report.reentry_result.environment_dna} validated=${report.reentry_result.location_reentry_validated}`
);
console.log(`report=${LOCATION_REENTRY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${LOCATION_REENTRY_VALIDATION_MD_PATH}`);
console.log(`manifest=${LOCATION_REENTRY_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LOCATION_REENTRY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, LOCATION_REENTRY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LOCATION_REENTRY_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LOCATION_REENTRY_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, LOCATION_REENTRY_VALIDATION_EXPORT_DIR, 'location-reentry-journey.json')
  ) ||
  report.certification_status !== LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.journey_location_count !== LOCATION_JOURNEY_COUNT ||
  report.journey_transition_count !== LOCATION_TRANSITION_COUNT ||
  report.location_identity !== 'PASS' ||
  report.indoor_anchor !== 'PASS' ||
  report.layout_anchor !== 'PASS' ||
  report.lighting_anchor !== 'PASS' ||
  report.environment_dna !== 'PASS' ||
  report.location_memory_preserved !== 'PASS' ||
  report.location_reentry_failure !== false ||
  report.location_memory_loss !== false ||
  report.location_reentry_validation_ready !== 'PASS' ||
  report.reentry_result.location_reentry_validated !== 'PASS' ||
  report.journey_steps.length !== LOCATION_JOURNEY_COUNT
) {
  console.error(
    'Expected LOCATION_REENTRY_VALIDATED with Harbor journey and location DNA memory PASS'
  );
  process.exit(1);
}

process.exit(0);
