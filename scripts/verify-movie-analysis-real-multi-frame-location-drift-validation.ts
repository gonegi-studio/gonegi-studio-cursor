import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_MULTI_FRAME_COUNT,
  EXPECTED_SOURCE_COUNT,
  FRAMES_PER_SOURCE,
  MULTI_FRAME_LOCATION_DIR,
  MULTI_FRAME_LOCATION_MANIFEST_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_MD_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisRealMultiFrameLocationDriftValidation,
} from '../services/movieAnalysisRealMultiFrameLocationDriftValidation.js';
import {
  REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealLocationConsistencyValidation.js';
import {
  MODEL_TEST_GENERATION_IMAGES_DIR,
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
} from '../services/movieAnalysisRealModelTestGeneration.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const locationConsistencyReportPath = path.join(
  projectRoot,
  REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH
);
if (!fs.existsSync(locationConsistencyReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const locationConsistencyReport = JSON.parse(
  fs.readFileSync(locationConsistencyReportPath, 'utf8')
) as {
  final_verdict: string;
  certification_status: string | null;
};
if (locationConsistencyReport.final_verdict !== REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: L2F-004 ${REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH} must be ${REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT}`
  );
  process.exit(1);
}
if (
  locationConsistencyReport.certification_status !== REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE
) {
  console.error(
    `PRECHECK FAIL: L2F-004 status must be ${REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`
  );
  process.exit(1);
}

const testGenerationReportPath = path.join(projectRoot, REAL_MODEL_TEST_GENERATION_REPORT_PATH);
if (!fs.existsSync(testGenerationReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_MODEL_TEST_GENERATION_REPORT_PATH}`);
  process.exit(1);
}

const testGenerationReport = JSON.parse(fs.readFileSync(testGenerationReportPath, 'utf8')) as {
  final_verdict: string;
};
if (testGenerationReport.final_verdict !== REAL_MODEL_TEST_GENERATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: L2F-002 ${REAL_MODEL_TEST_GENERATION_REPORT_PATH} must be ${REAL_MODEL_TEST_GENERATION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, MODEL_TEST_GENERATION_MANIFEST_PATH))) {
  console.error(`Missing required upstream asset: ${MODEL_TEST_GENERATION_MANIFEST_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, MODEL_TEST_GENERATION_IMAGES_DIR))) {
  console.error(`Missing required input directory: ${MODEL_TEST_GENERATION_IMAGES_DIR}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealMultiFrameLocationDriftValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} frame_count=${report.frame_count} same_location_identity=${report.same_location_identity} indoor_anchor_persistence=${report.indoor_anchor_persistence} lighting_anchor_persistence=${report.lighting_anchor_persistence} environment_layout_persistence=${report.environment_layout_persistence} cross_frame_location_consistency=${report.cross_frame_location_consistency} traceability_preserved=${report.traceability_preserved} multi_frame_location_consistency=${report.multi_frame_location_consistency} location_drift=${report.location_drift} anchor_drift=${report.anchor_drift} lighting_drift=${report.lighting_drift} environment_layout_break=${report.environment_layout_break} real_multi_frame_location_drift_validation_ready=${report.real_multi_frame_location_drift_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: identity=${audit.same_location_identity} indoor=${audit.indoor_anchor_persistence} lighting=${audit.lighting_anchor_persistence} layout=${audit.environment_layout_persistence} cross_frame=${audit.cross_frame_location_consistency} trace=${audit.traceability_preserved} ready=${audit.source_multi_frame_location_validated} frames=${audit.location_frames.length}`
  );
}
console.log(`report=${REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_MD_PATH}`);
console.log(`manifest=${MULTI_FRAME_LOCATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const multiFrameFiles = fs.existsSync(path.join(projectRoot, MULTI_FRAME_LOCATION_DIR))
  ? fs
      .readdirSync(path.join(projectRoot, MULTI_FRAME_LOCATION_DIR))
      .filter((name) => name.endsWith('-multi-frame-location.json'))
  : [];

if (
  !fs.existsSync(path.join(projectRoot, REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_FRAME_LOCATION_MANIFEST_PATH)) ||
  report.certification_status !== REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.frame_count !== EXPECTED_MULTI_FRAME_COUNT ||
  report.same_location_identity !== 'PASS' ||
  report.indoor_anchor_persistence !== 'PASS' ||
  report.lighting_anchor_persistence !== 'PASS' ||
  report.environment_layout_persistence !== 'PASS' ||
  report.cross_frame_location_consistency !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.multi_frame_location_consistency !== 'PASS' ||
  report.location_drift !== false ||
  report.anchor_drift !== false ||
  report.lighting_drift !== false ||
  report.environment_layout_break !== false ||
  report.real_multi_frame_location_drift_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_multi_frame_location_validated === 'PASS') === false ||
  report.source_audits.every((audit) => audit.location_frames.length === FRAMES_PER_SOURCE) === false ||
  multiFrameFiles.length !== EXPECTED_SOURCE_COUNT
) {
  console.error(
    'Expected multi-frame location drift validation for 4 sources with 4 frames each and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
