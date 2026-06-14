import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FEATURE_FILM_PRODUCTION_READINESS_PATH,
  FEATURE_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from '../services/featureFilmProductionValidation.js';
import {
  GENERATION_BATCH_SPEC_EXPORT_PATH,
  IMAGE_CONSISTENCY_SCORECARD_EXPORT_PATH,
  IMAGE_CONSISTENCY_SPEC_EXPORT_PATH,
  IMAGE_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
  IMAGE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  IMAGE_CONSISTENCY_VALIDATION_READY_STATUS,
  IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH,
  writeImageConsistencyValidation,
} from '../services/imageConsistencyValidation.js';
import {
  MEDIUM_FILM_PRODUCTION_READINESS_PATH,
  MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from '../services/mediumFilmProductionValidation.js';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';
import {
  SHORT_FILM_PRODUCTION_READINESS_PATH,
  SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from '../services/shortFilmProductionValidation.js';
import {
  FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  FEATURE_FILM_SHOT_REGISTRY_PATH,
} from '../services/featureFilmShotAssembly.js';
import {
  MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_SHOT_REGISTRY_PATH,
} from '../services/mediumFilmShotAssembly.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const level3ReadOnlyPaths = [
  MV_PRODUCTION_READY_CURRENT_STATE_PATH,
  SHORT_FILM_PRODUCTION_READINESS_PATH,
  SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
  MEDIUM_FILM_PRODUCTION_READINESS_PATH,
  MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
  FEATURE_FILM_PRODUCTION_READINESS_PATH,
  FEATURE_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
  FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  FEATURE_FILM_SHOT_REGISTRY_PATH,
  MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_SHOT_REGISTRY_PATH,
  'datasets/consistency/image-consistency-specification.json',
  'datasets/consistency/image-consistency-scorecard.json',
  'datasets/consistency/image-consistency-thresholds.json',
  'datasets/consistency/generation-batch-specification.json',
];

const before = Object.fromEntries(
  level3ReadOnlyPaths
    .filter((p) => fs.existsSync(path.join(projectRoot, p)))
    .map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeImageConsistencyValidation(projectRoot);

for (const readOnlyPath of level3ReadOnlyPaths) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Level 3 artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `level3_digital_studio_complete=${report.precheck.level3_digital_studio_complete}`,
    `identity_dimension_count=${summary.identity_dimension_count}`,
    `threshold_integrity=${summary.threshold_integrity}`,
    `batch_spec_exists=${summary.batch_spec_exists}`,
    `traceability_integrity=${summary.traceability_integrity}`,
    `level3_artifact_mutation=0`,
    `image_consistency_validation_ready=${report.image_consistency_validation_ready}`,
  ].join(' ')
);
console.log(`specification=${IMAGE_CONSISTENCY_SPEC_EXPORT_PATH}`);
console.log(`scorecard=${IMAGE_CONSISTENCY_SCORECARD_EXPORT_PATH}`);
console.log(`thresholds=${IMAGE_CONSISTENCY_THRESHOLDS_EXPORT_PATH}`);
console.log(`batch_spec=${GENERATION_BATCH_SPEC_EXPORT_PATH}`);
console.log(`report=${IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (summary.identity_dimension_count < 8) {
  console.error('VERIFY FAIL: identity_dimension_count>=8');
  process.exit(1);
}
if (summary.threshold_integrity !== 'PASS') {
  console.error('VERIFY FAIL: threshold_integrity=PASS');
  process.exit(1);
}
if (!summary.batch_spec_exists) {
  console.error('VERIFY FAIL: batch_spec_exists');
  process.exit(1);
}
if (summary.traceability_integrity !== 'PASS') {
  console.error('VERIFY FAIL: traceability_integrity=PASS');
  process.exit(1);
}

if (report.final_verdict !== IMAGE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  console.error(`Expected verdict ${IMAGE_CONSISTENCY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== IMAGE_CONSISTENCY_VALIDATION_READY_STATUS) {
  console.error(`Expected status ${IMAGE_CONSISTENCY_VALIDATION_READY_STATUS}`);
  process.exit(1);
}
