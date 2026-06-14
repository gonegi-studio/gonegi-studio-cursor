import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_BATCH_SPEC_EXPORT_PATH,
  IMAGE_CONSISTENCY_SCORECARD_DATASET_PATH,
  IMAGE_CONSISTENCY_SCORECARD_EXPORT_PATH,
  IMAGE_CONSISTENCY_SPEC_DATASET_PATH,
  IMAGE_CONSISTENCY_SPEC_EXPORT_PATH,
  IMAGE_CONSISTENCY_THRESHOLDS_DATASET_PATH,
  IMAGE_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
  IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH,
  GENERATION_BATCH_SPEC_DATASET_PATH,
} from '../services/imageConsistencyValidation.js';
import {
  MOTION_CONSISTENCY_SPEC_EXPORT_PATH,
  TRANSITION_CONSISTENCY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT,
  VIDEO_CONSISTENCY_VALIDATION_READY_STATUS,
  VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH,
  VIDEO_SEQUENCE_SPEC_EXPORT_PATH,
  writeVideoConsistencyValidation,
} from '../services/videoConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const imageConsistencyReadOnlyPaths = [
  IMAGE_CONSISTENCY_VALIDATION_REPORT_PATH,
  IMAGE_CONSISTENCY_SPEC_DATASET_PATH,
  IMAGE_CONSISTENCY_SCORECARD_DATASET_PATH,
  IMAGE_CONSISTENCY_THRESHOLDS_DATASET_PATH,
  GENERATION_BATCH_SPEC_DATASET_PATH,
  IMAGE_CONSISTENCY_SPEC_EXPORT_PATH,
  IMAGE_CONSISTENCY_SCORECARD_EXPORT_PATH,
  IMAGE_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
  GENERATION_BATCH_SPEC_EXPORT_PATH,
  'exports/image_consistency/image-consistency-specification.json',
  'exports/image_consistency/image-consistency-scorecard.json',
  'exports/image_consistency/image-consistency-thresholds.json',
  'exports/image_consistency/generation-batch-specification.json',
];

const before = Object.fromEntries(
  imageConsistencyReadOnlyPaths
    .filter((p) => fs.existsSync(path.join(projectRoot, p)))
    .map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeVideoConsistencyValidation(projectRoot);

for (const readOnlyPath of imageConsistencyReadOnlyPaths) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Image consistency artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `identity_dimension_count=${summary.identity_dimension_count}`,
    `motion_dimension_count=${summary.motion_dimension_count}`,
    `transition_dimension_count=${summary.transition_dimension_count}`,
    `sequence_length_max=${summary.sequence_length_max}`,
    `sequence_spec_exists=${summary.sequence_spec_exists}`,
    `motion_spec_exists=${summary.motion_spec_exists}`,
    `transition_spec_exists=${summary.transition_spec_exists}`,
    `threshold_integrity=${summary.threshold_integrity}`,
    `traceability_integrity=${summary.traceability_integrity}`,
    `image_consistency_mutation=0`,
    `video_consistency_validation_ready=${report.video_consistency_validation_ready}`,
  ].join(' ')
);
console.log(`sequence_spec=${VIDEO_SEQUENCE_SPEC_EXPORT_PATH}`);
console.log(`motion_spec=${MOTION_CONSISTENCY_SPEC_EXPORT_PATH}`);
console.log(`transition_spec=${TRANSITION_CONSISTENCY_SPEC_EXPORT_PATH}`);
console.log(`report=${VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (summary.identity_dimension_count < 10) {
  console.error('VERIFY FAIL: identity_dimension_count>=10');
  process.exit(1);
}
if (summary.motion_dimension_count < 3) {
  console.error('VERIFY FAIL: motion_dimension_count>=3');
  process.exit(1);
}
if (summary.transition_dimension_count < 3) {
  console.error('VERIFY FAIL: transition_dimension_count>=3');
  process.exit(1);
}
if (summary.sequence_length_max < 1000) {
  console.error('VERIFY FAIL: sequence_length_max>=1000');
  process.exit(1);
}
if (!summary.sequence_spec_exists) {
  console.error('VERIFY FAIL: sequence_spec_exists');
  process.exit(1);
}
if (!summary.motion_spec_exists) {
  console.error('VERIFY FAIL: motion_spec_exists');
  process.exit(1);
}
if (!summary.transition_spec_exists) {
  console.error('VERIFY FAIL: transition_spec_exists');
  process.exit(1);
}
if (summary.threshold_integrity !== 'PASS') {
  console.error('VERIFY FAIL: threshold_integrity=PASS');
  process.exit(1);
}
if (summary.traceability_integrity !== 'PASS') {
  console.error('VERIFY FAIL: traceability_integrity=PASS');
  process.exit(1);
}

if (report.final_verdict !== VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  console.error(`Expected verdict ${VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== VIDEO_CONSISTENCY_VALIDATION_READY_STATUS) {
  console.error(`Expected status ${VIDEO_CONSISTENCY_VALIDATION_READY_STATUS}`);
  process.exit(1);
}
