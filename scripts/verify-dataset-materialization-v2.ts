import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_STACK_READ_ONLY_PATHS } from '../services/appDatasetSynchronization.js';
import {
  IMAGE_APP_LATEST_V4_DIR,
  VIDEO_APP_LATEST_V4_DIR,
  collectLegacyExportSnapshots,
  verifyLegacyPreservation,
} from '../services/latestV3ProductionHardening.js';
import {
  IMAGE_APP_UPLOAD_PACKAGE_V5_PATH,
  VIDEO_APP_UPLOAD_PACKAGE_V5_PATH,
  MATERIALIZATION_PASS_VERDICT,
  MATERIALIZED_READY_STATUS,
  MATERIALIZATION_REPORT_PATH,
  PRODUCTION_DENSITY_REPORT_PATH,
  SOURCE_VIDEO_COVERAGE_REPORT_PATH,
  collectV4Snapshots,
  verifyV4Preservation,
  writeDatasetMaterialization,
} from '../services/exportRebuild/datasetMaterializer.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const legacyBefore = collectLegacyExportSnapshots(projectRoot);
const v4Before = collectV4Snapshots(projectRoot);

const engineBefore = Object.fromEntries(
  ENGINE_STACK_READ_ONLY_PATHS.filter((p) => fs.existsSync(path.join(projectRoot, p))).map((p) => [
    p,
    fs.readFileSync(path.join(projectRoot, p), 'utf8'),
  ])
);

const report = writeDatasetMaterialization(projectRoot);

for (const readOnlyPath of ENGINE_STACK_READ_ONLY_PATHS) {
  if (!engineBefore[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (engineBefore[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Engine stack artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

if (!verifyV4Preservation(projectRoot, v4Before)) {
  console.error('POLICY VIOLATION: latest_v4 artifact modified');
  process.exit(1);
}

const legacyPreserved = verifyLegacyPreservation(projectRoot, legacyBefore);
if (!legacyPreserved) {
  console.error('POLICY VIOLATION: Legacy latest export modified');
  process.exit(1);
}

const imagePkg = JSON.parse(
  fs.readFileSync(path.join(projectRoot, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH), 'utf8')
) as { manifest_only: boolean; materialized: boolean };
const videoPkg = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_APP_UPLOAD_PACKAGE_V5_PATH), 'utf8')
) as { manifest_only: boolean; materialized: boolean };

if (imagePkg.manifest_only || videoPkg.manifest_only) {
  console.error('VERIFY FAIL: v5 packages must not be manifest-only');
  process.exit(1);
}
if (!imagePkg.materialized || !videoPkg.materialized) {
  console.error('VERIFY FAIL: v5 packages must be materialized');
  process.exit(1);
}

const summary = report.materialization_summary;
const coverage = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SOURCE_VIDEO_COVERAGE_REPORT_PATH), 'utf8')
) as { ghibli: number; shinkai: number; live_action: number; mori: number };

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `source_video_dna_sync=${summary.source_video_dna_sync}`,
    `adapter_sync=${summary.adapter_sync}`,
    `living_world_sync=${summary.living_world_sync}`,
    `location_anchor_sync=${summary.location_anchor_sync}`,
    `lighting_anchor_sync=${summary.lighting_anchor_sync}`,
    `mv_dataset_sync=${summary.mv_dataset_sync}`,
    `story_engine_sync=${summary.story_engine_sync}`,
    `prompt_compiler_sync=${summary.prompt_compiler_sync}`,
    `dialogue_lipsync_sync=${summary.dialogue_lipsync_sync}`,
    `temporal_memory_sync=${summary.temporal_memory_sync}`,
    `generation_trace_sync=${summary.generation_trace_sync}`,
    `production_execution_sync=${summary.production_execution_sync}`,
    `materialization_sync=${summary.materialization_sync}`,
    `production_density_sync=${summary.production_density_sync}`,
    `placeholder_bundle_count=${summary.placeholder_bundle_count}`,
    `reference_only_bundle_count=${summary.reference_only_bundle_count}`,
    `gpu_upload_readiness=${summary.gpu_upload_readiness}`,
    `ghibli=${coverage.ghibli}`,
    `shinkai=${coverage.shinkai}`,
    `live_action=${coverage.live_action}`,
    `mori=${coverage.mori}`,
    `legacy_export_preservation=${legacyPreserved}`,
    `latest_v4_preservation=true`,
    `gpu_execution=${report.policy.gpu_execution}`,
    `materialized_ready=${report.materialized_ready}`,
  ].join(' ')
);
console.log(`report=${MATERIALIZATION_REPORT_PATH}`);
console.log(`density=${PRODUCTION_DENSITY_REPORT_PATH}`);
console.log(`coverage=${SOURCE_VIDEO_COVERAGE_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['source_video_dna_sync=PASS', summary.source_video_dna_sync === 'PASS'],
  ['adapter_sync=PASS', summary.adapter_sync === 'PASS'],
  ['living_world_sync=PASS', summary.living_world_sync === 'PASS'],
  ['location_anchor_sync=PASS', summary.location_anchor_sync === 'PASS'],
  ['lighting_anchor_sync=PASS', summary.lighting_anchor_sync === 'PASS'],
  ['mv_dataset_sync=PASS', summary.mv_dataset_sync === 'PASS'],
  ['story_engine_sync=PASS', summary.story_engine_sync === 'PASS'],
  ['prompt_compiler_sync=PASS', summary.prompt_compiler_sync === 'PASS'],
  ['dialogue_lipsync_sync=PASS', summary.dialogue_lipsync_sync === 'PASS'],
  ['temporal_memory_sync=PASS', summary.temporal_memory_sync === 'PASS'],
  ['generation_trace_sync=PASS', summary.generation_trace_sync === 'PASS'],
  ['production_execution_sync=PASS', summary.production_execution_sync === 'PASS'],
  ['materialization_sync=PASS', summary.materialization_sync === 'PASS'],
  ['production_density_sync=PASS', summary.production_density_sync === 'PASS'],
  ['placeholder_bundle_count=0', summary.placeholder_bundle_count === 0],
  ['reference_only_bundle_count=0', summary.reference_only_bundle_count === 0],
  ['gpu_upload_readiness=PASS', summary.gpu_upload_readiness === 'PASS'],
  ['ghibli=7', coverage.ghibli === 7],
  ['shinkai=2', coverage.shinkai === 2],
  ['live_action=1', coverage.live_action === 1],
  ['mori=5', coverage.mori === 5],
  ['legacy_export_preservation=PASS', legacyPreserved],
  ['latest_v4_preservation=PASS', verifyV4Preservation(projectRoot, v4Before)],
  ['gpu_execution=false', report.policy.gpu_execution === false],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

const storyBundle = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'exports/image_app/latest_v5/story_blueprint_bundle.json'), 'utf8')
) as Record<string, unknown>;
const requiredStoryFields = [
  'story_arcs',
  'scene_progression',
  'relationship_progression',
  'emotional_progression',
  'callback_system',
  'narrative_rules',
];
for (const field of requiredStoryFields) {
  if (!storyBundle[field]) {
    console.error(`VERIFY FAIL: story_blueprint_bundle missing ${field}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MATERIALIZATION_PASS_VERDICT) process.exit(1);
if (report.status !== MATERIALIZED_READY_STATUS) process.exit(1);
