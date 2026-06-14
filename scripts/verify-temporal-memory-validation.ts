import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT,
  TEMPORAL_MEMORY_VALIDATION_READY_STATUS,
  TEMPORAL_MEMORY_VALIDATION_REPORT_PATH,
  writeTemporalMemoryValidation,
} from '../services/temporalMemoryValidation.js';
import {
  MOTION_CONSISTENCY_SPEC_DATASET_PATH,
  MOTION_CONSISTENCY_SPEC_EXPORT_PATH,
  TRANSITION_CONSISTENCY_SPEC_DATASET_PATH,
  TRANSITION_CONSISTENCY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_SCORECARD_DATASET_PATH,
  VIDEO_CONSISTENCY_SCORECARD_EXPORT_PATH,
  VIDEO_CONSISTENCY_SPEC_DATASET_PATH,
  VIDEO_CONSISTENCY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_THRESHOLDS_DATASET_PATH,
  VIDEO_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
  VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH,
  VIDEO_SEQUENCE_SPEC_DATASET_PATH,
  VIDEO_SEQUENCE_SPEC_EXPORT_PATH,
} from '../services/videoConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const videoConsistencyReadOnlyPaths = [
  VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH,
  VIDEO_CONSISTENCY_SPEC_DATASET_PATH,
  VIDEO_CONSISTENCY_SCORECARD_DATASET_PATH,
  VIDEO_CONSISTENCY_THRESHOLDS_DATASET_PATH,
  VIDEO_SEQUENCE_SPEC_DATASET_PATH,
  MOTION_CONSISTENCY_SPEC_DATASET_PATH,
  TRANSITION_CONSISTENCY_SPEC_DATASET_PATH,
  VIDEO_CONSISTENCY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_SCORECARD_EXPORT_PATH,
  VIDEO_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
  VIDEO_SEQUENCE_SPEC_EXPORT_PATH,
  MOTION_CONSISTENCY_SPEC_EXPORT_PATH,
  TRANSITION_CONSISTENCY_SPEC_EXPORT_PATH,
];

const before = Object.fromEntries(
  videoConsistencyReadOnlyPaths
    .filter((p) => fs.existsSync(path.join(projectRoot, p)))
    .map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeTemporalMemoryValidation(projectRoot);

for (const readOnlyPath of videoConsistencyReadOnlyPaths) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Video consistency artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `memory_dimension_count=${summary.memory_dimension_count}`,
    `memory_horizon_max=${summary.memory_horizon_max}`,
    `callback_memory_dimension_count=${summary.callback_memory_dimension_count}`,
    `world_state_memory_dimension_count=${summary.world_state_memory_dimension_count}`,
    `timeline_memory_dimension_count=${summary.timeline_memory_dimension_count}`,
    `memory_traceability_integrity=${summary.memory_traceability_integrity}`,
    `threshold_integrity=${summary.threshold_integrity}`,
    `traceability_integrity=${summary.traceability_integrity}`,
    `video_consistency_mutation=0`,
    `temporal_memory_validation_ready=${report.temporal_memory_validation_ready}`,
  ].join(' ')
);
console.log(`report=${TEMPORAL_MEMORY_VALIDATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (summary.memory_dimension_count < 10) {
  console.error('VERIFY FAIL: memory_dimension_count>=10');
  process.exit(1);
}
if (summary.memory_horizon_max < 5000) {
  console.error('VERIFY FAIL: memory_horizon_max>=5000');
  process.exit(1);
}
if (summary.callback_memory_dimension_count < 3) {
  console.error('VERIFY FAIL: callback_memory_dimension_count>=3');
  process.exit(1);
}
if (summary.world_state_memory_dimension_count < 3) {
  console.error('VERIFY FAIL: world_state_memory_dimension_count>=3');
  process.exit(1);
}
if (summary.timeline_memory_dimension_count < 3) {
  console.error('VERIFY FAIL: timeline_memory_dimension_count>=3');
  process.exit(1);
}
if (summary.memory_traceability_integrity !== 'PASS') {
  console.error('VERIFY FAIL: memory_traceability_integrity=PASS');
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

if (report.final_verdict !== TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT) {
  console.error(`Expected verdict ${TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== TEMPORAL_MEMORY_VALIDATION_READY_STATUS) {
  console.error(`Expected status ${TEMPORAL_MEMORY_VALIDATION_READY_STATUS}`);
  process.exit(1);
}
