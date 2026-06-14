import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_DATASET_SYNC_PASS_VERDICT,
  APP_DATASET_SYNC_READY_STATUS,
  APP_DATASET_SYNCHRONIZATION_REPORT_PATH,
  collectLegacyExportSnapshots,
  ENGINE_STACK_READ_ONLY_PATHS,
  verifyLegacyPreservation,
  writeAppDatasetSynchronization,
} from '../services/appDatasetSynchronization.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const legacyBefore = collectLegacyExportSnapshots(projectRoot);
const engineBefore = Object.fromEntries(
  ENGINE_STACK_READ_ONLY_PATHS.filter((p) =>
    fs.existsSync(path.join(projectRoot, p))
  ).map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeAppDatasetSynchronization(projectRoot);

for (const readOnlyPath of ENGINE_STACK_READ_ONLY_PATHS) {
  if (!engineBefore[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (engineBefore[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Engine stack artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const legacyPreserved = verifyLegacyPreservation(projectRoot, legacyBefore);
if (!legacyPreserved) {
  console.error('POLICY VIOLATION: Legacy export modified');
  process.exit(1);
}

const summary = report.sync_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `story_engine_sync=${summary.story_engine_sync}`,
    `prompt_compiler_sync=${summary.prompt_compiler_sync}`,
    `generation_qa_sync=${summary.generation_qa_sync}`,
    `prompt_evaluation_sync=${summary.prompt_evaluation_sync}`,
    `temporal_memory_sync=${summary.temporal_memory_sync}`,
    `dialogue_lipsync_sync=${summary.dialogue_lipsync_sync}`,
    `generation_trace_sync=${summary.generation_trace_sync}`,
    `dataset_evolution_sync=${summary.dataset_evolution_sync}`,
    `asset_registry_sync=${summary.asset_registry_sync}`,
    `production_execution_sync=${summary.production_execution_sync}`,
    `image_app_sync_integrity=${report.image_app_sync_integrity}`,
    `video_app_sync_integrity=${report.video_app_sync_integrity}`,
    `upload_package_integrity=${report.upload_package_integrity}`,
    `legacy_export_preservation=${report.legacy_export_preservation}`,
    `gpu_test_readiness=${report.gpu_test_readiness}`,
    `readiness_status=${report.readiness_status}`,
    `compatibility_status=${report.compatibility_status}`,
    `missing_dependencies=${report.missing_dependencies.length}`,
    `engine_stack_mutation=0`,
    `app_dataset_sync_ready=${report.app_dataset_sync_ready}`,
  ].join(' ')
);
console.log(`report=${APP_DATASET_SYNCHRONIZATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['story_engine_sync=PASS', summary.story_engine_sync === 'PASS'],
  ['prompt_compiler_sync=PASS', summary.prompt_compiler_sync === 'PASS'],
  ['generation_qa_sync=PASS', summary.generation_qa_sync === 'PASS'],
  ['prompt_evaluation_sync=PASS', summary.prompt_evaluation_sync === 'PASS'],
  ['temporal_memory_sync=PASS', summary.temporal_memory_sync === 'PASS'],
  ['dialogue_lipsync_sync=PASS', summary.dialogue_lipsync_sync === 'PASS'],
  ['generation_trace_sync=PASS', summary.generation_trace_sync === 'PASS'],
  ['dataset_evolution_sync=PASS', summary.dataset_evolution_sync === 'PASS'],
  ['asset_registry_sync=PASS', summary.asset_registry_sync === 'PASS'],
  ['production_execution_sync=PASS', summary.production_execution_sync === 'PASS'],
  ['image_app_sync_integrity=PASS', report.image_app_sync_integrity === 'PASS'],
  ['video_app_sync_integrity=PASS', report.video_app_sync_integrity === 'PASS'],
  ['upload_package_integrity=PASS', report.upload_package_integrity === 'PASS'],
  ['legacy_export_preservation=PASS', legacyPreserved],
  ['gpu_test_readiness=PASS', report.gpu_test_readiness === 'PASS'],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== APP_DATASET_SYNC_PASS_VERDICT) process.exit(1);
if (report.status !== APP_DATASET_SYNC_READY_STATUS) process.exit(1);
