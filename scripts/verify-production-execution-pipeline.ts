import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRODUCTION_EXECUTION_PIPELINE_PASS_VERDICT,
  PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH,
  REAL_FEATURE_PRODUCTION_READY_STATUS,
  writeProductionExecutionPipeline,
} from '../services/productionExecutionPipeline.js';
import {
  CALLBACK_MEMORY_SPEC_DATASET_PATH,
  CALLBACK_MEMORY_SPEC_EXPORT_PATH,
  MEMORY_HORIZON_SPEC_DATASET_PATH,
  MEMORY_HORIZON_SPEC_EXPORT_PATH,
  TEMPORAL_MEMORY_SCORECARD_DATASET_PATH,
  TEMPORAL_MEMORY_SCORECARD_EXPORT_PATH,
  TEMPORAL_MEMORY_SPEC_DATASET_PATH,
  TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
  TEMPORAL_MEMORY_THRESHOLDS_DATASET_PATH,
  TEMPORAL_MEMORY_THRESHOLDS_EXPORT_PATH,
  TEMPORAL_MEMORY_VALIDATION_REPORT_PATH,
  TIMELINE_MEMORY_SPEC_DATASET_PATH,
  TIMELINE_MEMORY_SPEC_EXPORT_PATH,
  WORLD_STATE_MEMORY_SPEC_DATASET_PATH,
  WORLD_STATE_MEMORY_SPEC_EXPORT_PATH,
} from '../services/temporalMemoryValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const temporalMemoryReadOnlyPaths = [
  TEMPORAL_MEMORY_VALIDATION_REPORT_PATH,
  TEMPORAL_MEMORY_SPEC_DATASET_PATH,
  TEMPORAL_MEMORY_SCORECARD_DATASET_PATH,
  TEMPORAL_MEMORY_THRESHOLDS_DATASET_PATH,
  MEMORY_HORIZON_SPEC_DATASET_PATH,
  CALLBACK_MEMORY_SPEC_DATASET_PATH,
  WORLD_STATE_MEMORY_SPEC_DATASET_PATH,
  TIMELINE_MEMORY_SPEC_DATASET_PATH,
  TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
  TEMPORAL_MEMORY_SCORECARD_EXPORT_PATH,
  TEMPORAL_MEMORY_THRESHOLDS_EXPORT_PATH,
  MEMORY_HORIZON_SPEC_EXPORT_PATH,
  CALLBACK_MEMORY_SPEC_EXPORT_PATH,
  WORLD_STATE_MEMORY_SPEC_EXPORT_PATH,
  TIMELINE_MEMORY_SPEC_EXPORT_PATH,
  'exports/temporal_memory/temporal-memory-specification.json',
  'exports/temporal_memory/temporal-memory-scorecard.json',
  'exports/temporal_memory/temporal-memory-thresholds.json',
  'exports/temporal_memory/memory-horizon-specification.json',
  'exports/temporal_memory/callback-memory-specification.json',
  'exports/temporal_memory/world-state-memory-specification.json',
  'exports/temporal_memory/timeline-memory-specification.json',
];

const before = Object.fromEntries(
  temporalMemoryReadOnlyPaths
    .filter((p) => fs.existsSync(path.join(projectRoot, p)))
    .map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeProductionExecutionPipeline(projectRoot);

for (const readOnlyPath of temporalMemoryReadOnlyPaths) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Temporal memory artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const summary = report.pipeline_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `stage_count=${summary.stage_count}`,
    `handoff_integrity=${summary.handoff_integrity}`,
    `stage_transition_integrity=${summary.stage_transition_integrity}`,
    `traceability_dimension_count=${summary.traceability_dimension_count}`,
    `failure_dimension_count=${summary.failure_dimension_count}`,
    `execution_scale_count=${summary.execution_scale_count}`,
    `production_traceability_integrity=${summary.production_traceability_integrity}`,
    `pipeline_recovery_integrity=${summary.pipeline_recovery_integrity}`,
    `temporal_memory_mutation=0`,
    `real_feature_production_ready=${report.real_feature_production_ready}`,
  ].join(' ')
);
console.log(`report=${PRODUCTION_EXECUTION_PIPELINE_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (summary.stage_count < 8) {
  console.error('VERIFY FAIL: stage_count>=8');
  process.exit(1);
}
if (summary.handoff_integrity !== 'PASS') {
  console.error('VERIFY FAIL: handoff_integrity=PASS');
  process.exit(1);
}
if (summary.stage_transition_integrity !== 'PASS') {
  console.error('VERIFY FAIL: stage_transition_integrity=PASS');
  process.exit(1);
}
if (summary.traceability_dimension_count < 8) {
  console.error('VERIFY FAIL: traceability_dimension_count>=8');
  process.exit(1);
}
if (summary.failure_dimension_count < 5) {
  console.error('VERIFY FAIL: failure_dimension_count>=5');
  process.exit(1);
}
if (summary.execution_scale_count < 4) {
  console.error('VERIFY FAIL: execution_scale_count>=4');
  process.exit(1);
}
if (summary.production_traceability_integrity !== 'PASS') {
  console.error('VERIFY FAIL: production_traceability_integrity=PASS');
  process.exit(1);
}
if (summary.pipeline_recovery_integrity !== 'PASS') {
  console.error('VERIFY FAIL: pipeline_recovery_integrity=PASS');
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_EXECUTION_PIPELINE_PASS_VERDICT) {
  console.error(`Expected verdict ${PRODUCTION_EXECUTION_PIPELINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== REAL_FEATURE_PRODUCTION_READY_STATUS) {
  console.error(`Expected status ${REAL_FEATURE_PRODUCTION_READY_STATUS}`);
  process.exit(1);
}
