import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENGINE_STACK_READ_ONLY_PATHS,
  IMAGE_APP_LATEST_V2_DIR,
  VIDEO_APP_LATEST_V2_DIR,
  collectLegacyExportSnapshots,
  verifyLegacyPreservation,
} from '../services/appDatasetSynchronization.js';
import {
  IMAGE_APP_UPLOAD_PACKAGE_V3_PATH,
  SOURCE_VIDEO_APP_REBUILD_PASS_VERDICT,
  SOURCE_VIDEO_APP_REBUILD_READY_STATUS,
  SOURCE_VIDEO_APP_REBUILD_REPORT_PATH,
  VIDEO_APP_UPLOAD_PACKAGE_V3_PATH,
  writeSourceVideoToAppDatasetRebuild,
} from '../services/sourceVideoToAppDatasetRebuild.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const legacyBefore = collectLegacyExportSnapshots(projectRoot);
const v2Before: Record<string, string> = {};
for (const v2Dir of [IMAGE_APP_LATEST_V2_DIR, VIDEO_APP_LATEST_V2_DIR]) {
  const fullDir = path.join(projectRoot, v2Dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const file of fs.readdirSync(fullDir)) {
    const rel = `${v2Dir}/${file}`;
    v2Before[rel] = fs.readFileSync(path.join(projectRoot, rel), 'utf8');
  }
}

const engineBefore = Object.fromEntries(
  ENGINE_STACK_READ_ONLY_PATHS.filter((p) =>
    fs.existsSync(path.join(projectRoot, p))
  ).map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeSourceVideoToAppDatasetRebuild(projectRoot);

for (const readOnlyPath of ENGINE_STACK_READ_ONLY_PATHS) {
  if (!engineBefore[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (engineBefore[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Engine stack artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

for (const [v2Path, content] of Object.entries(v2Before)) {
  const after = fs.readFileSync(path.join(projectRoot, v2Path), 'utf8');
  if (after !== content) {
    console.error(`POLICY VIOLATION: latest_v2 artifact modified: ${v2Path}`);
    process.exit(1);
  }
}

const legacyPreserved = verifyLegacyPreservation(projectRoot, legacyBefore);
if (!legacyPreserved) {
  console.error('POLICY VIOLATION: Legacy latest export modified');
  process.exit(1);
}

const imagePkg = JSON.parse(
  fs.readFileSync(path.join(projectRoot, IMAGE_APP_UPLOAD_PACKAGE_V3_PATH), 'utf8')
) as { manifest_only: boolean };
const videoPkg = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_APP_UPLOAD_PACKAGE_V3_PATH), 'utf8')
) as { manifest_only: boolean };

if (imagePkg.manifest_only || videoPkg.manifest_only) {
  console.error('VERIFY FAIL: v3 packages must not be manifest-only');
  process.exit(1);
}

const summary = report.sync_summary;
const gap = report.gap_analysis;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `source_video_coverage=${report.source_video_coverage}`,
    `movie_analysis_sync=${report.movie_analysis_sync}`,
    `dna_sync=${report.dna_sync}`,
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
    `image_app_dataset_integrity=${report.image_app_dataset_integrity}`,
    `video_app_dataset_integrity=${report.video_app_dataset_integrity}`,
    `upload_package_v3_integrity=${report.upload_package_v3_integrity}`,
    `gap_analysis_integrity=${gap.gap_analysis_integrity}`,
    `missing_dependencies=${gap.missing_dependencies.length}`,
    `legacy_export_preservation=${report.legacy_export_preservation}`,
    `gpu_execution=${report.gpu_execution}`,
    `source_video_app_rebuild_ready=${report.source_video_app_rebuild_ready}`,
  ].join(' ')
);
console.log(`report=${SOURCE_VIDEO_APP_REBUILD_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['source_video_coverage=PASS', report.source_video_coverage === 'PASS'],
  ['movie_analysis_sync=PASS', report.movie_analysis_sync === 'PASS'],
  ['dna_sync=PASS', report.dna_sync === 'PASS'],
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
  ['image_app_dataset_integrity=PASS', report.image_app_dataset_integrity === 'PASS'],
  ['video_app_dataset_integrity=PASS', report.video_app_dataset_integrity === 'PASS'],
  ['upload_package_v3_integrity=PASS', report.upload_package_v3_integrity === 'PASS'],
  ['gap_analysis_integrity=PASS', gap.gap_analysis_integrity === 'PASS'],
  ['legacy_export_preservation=PASS', legacyPreserved],
  ['gpu_execution=false', report.gpu_execution === false],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (gap.missing_dependencies.length > 0) {
  console.error('VERIFY FAIL: missing_dependencies=0');
  process.exit(1);
}

if (report.final_verdict !== SOURCE_VIDEO_APP_REBUILD_PASS_VERDICT) process.exit(1);
if (report.status !== SOURCE_VIDEO_APP_REBUILD_READY_STATUS) process.exit(1);
