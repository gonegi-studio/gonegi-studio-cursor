import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_STACK_READ_ONLY_PATHS } from '../services/appDatasetSynchronization.js';
import {
  IMAGE_APP_LATEST_V3_DIR,
  VIDEO_APP_LATEST_V3_DIR,
  IMAGE_APP_UPLOAD_PACKAGE_V4_PATH,
  VIDEO_APP_UPLOAD_PACKAGE_V4_PATH,
  PRODUCTION_HARDENING_PASS_VERDICT,
  PRODUCTION_HARDENED_READY_STATUS,
  PRODUCTION_HARDENING_REPORT_PATH,
  PRODUCTION_READINESS_REPORT_PATH,
  PRODUCTION_GAP_REPORT_PATH,
  IMAGE_PRODUCTION_LAYER_PATH,
  VIDEO_PRODUCTION_LAYER_PATH,
  collectLegacyExportSnapshots,
  collectV3Snapshots,
  verifyLegacyPreservation,
  verifyV3Preservation,
  writeLatestV3ProductionHardening,
} from '../services/latestV3ProductionHardening.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const legacyBefore = collectLegacyExportSnapshots(projectRoot);
const v3Before = collectV3Snapshots(projectRoot);

const engineBefore = Object.fromEntries(
  ENGINE_STACK_READ_ONLY_PATHS.filter((p) => fs.existsSync(path.join(projectRoot, p))).map((p) => [
    p,
    fs.readFileSync(path.join(projectRoot, p), 'utf8'),
  ])
);

const report = writeLatestV3ProductionHardening(projectRoot);

for (const readOnlyPath of ENGINE_STACK_READ_ONLY_PATHS) {
  if (!engineBefore[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (engineBefore[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Engine stack artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

if (!verifyV3Preservation(projectRoot, v3Before)) {
  console.error('POLICY VIOLATION: latest_v3 artifact modified');
  process.exit(1);
}

const legacyPreserved = verifyLegacyPreservation(projectRoot, legacyBefore);
if (!legacyPreserved) {
  console.error('POLICY VIOLATION: Legacy latest export modified');
  process.exit(1);
}

const imagePkg = JSON.parse(
  fs.readFileSync(path.join(projectRoot, IMAGE_APP_UPLOAD_PACKAGE_V4_PATH), 'utf8')
) as { manifest_only: boolean };
const videoPkg = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_APP_UPLOAD_PACKAGE_V4_PATH), 'utf8')
) as { manifest_only: boolean };

if (imagePkg.manifest_only || videoPkg.manifest_only) {
  console.error('VERIFY FAIL: v4 packages must not be manifest-only');
  process.exit(1);
}

const summary = report.hardening_summary;

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
    `production_execution_sync=${summary.production_execution_sync}`,
    `story_engine_sync=${summary.story_engine_sync}`,
    `prompt_compiler_sync=${summary.prompt_compiler_sync}`,
    `dialogue_lipsync_sync=${summary.dialogue_lipsync_sync}`,
    `temporal_memory_sync=${summary.temporal_memory_sync}`,
    `image_dataset_density=${summary.image_dataset_density}`,
    `video_dataset_density=${summary.video_dataset_density}`,
    `placeholder_bundle_count=${summary.placeholder_bundle_count}`,
    `gpu_upload_readiness=${summary.gpu_upload_readiness}`,
    `legacy_export_preservation=${legacyPreserved}`,
    `latest_v3_preservation=true`,
    `gpu_execution=${report.policy.gpu_execution}`,
    `production_hardened_ready=${report.production_hardened_ready}`,
  ].join(' ')
);
console.log(`report=${PRODUCTION_HARDENING_REPORT_PATH}`);
console.log(`readiness=${PRODUCTION_READINESS_REPORT_PATH}`);
console.log(`gap=${PRODUCTION_GAP_REPORT_PATH}`);
console.log(`image_layer=${IMAGE_PRODUCTION_LAYER_PATH}`);
console.log(`video_layer=${VIDEO_PRODUCTION_LAYER_PATH}`);

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
  ['production_execution_sync=PASS', summary.production_execution_sync === 'PASS'],
  ['story_engine_sync=PASS', summary.story_engine_sync === 'PASS'],
  ['prompt_compiler_sync=PASS', summary.prompt_compiler_sync === 'PASS'],
  ['dialogue_lipsync_sync=PASS', summary.dialogue_lipsync_sync === 'PASS'],
  ['temporal_memory_sync=PASS', summary.temporal_memory_sync === 'PASS'],
  ['image_dataset_density=PASS', summary.image_dataset_density === 'PASS'],
  ['video_dataset_density=PASS', summary.video_dataset_density === 'PASS'],
  ['placeholder_bundle_count=0', summary.placeholder_bundle_count === 0],
  ['gpu_upload_readiness=PASS', summary.gpu_upload_readiness === 'PASS'],
  ['legacy_export_preservation=PASS', legacyPreserved],
  ['latest_v3_preservation=PASS', verifyV3Preservation(projectRoot, v3Before)],
  ['gpu_execution=false', report.policy.gpu_execution === false],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

const requiredOutputs = [
  IMAGE_PRODUCTION_LAYER_PATH,
  VIDEO_PRODUCTION_LAYER_PATH,
  IMAGE_APP_UPLOAD_PACKAGE_V4_PATH,
  VIDEO_APP_UPLOAD_PACKAGE_V4_PATH,
  PRODUCTION_GAP_REPORT_PATH,
  PRODUCTION_READINESS_REPORT_PATH,
  `${IMAGE_APP_LATEST_V3_DIR.replace('latest_v3', 'latest_v4')}`,
  `${VIDEO_APP_LATEST_V3_DIR.replace('latest_v3', 'latest_v4')}`,
];

for (const rel of requiredOutputs) {
  const full = path.join(projectRoot, rel);
  if (!fs.existsSync(full)) {
    console.error(`VERIFY FAIL: missing output ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== PRODUCTION_HARDENING_PASS_VERDICT) process.exit(1);
if (report.status !== PRODUCTION_HARDENED_READY_STATUS) process.exit(1);
