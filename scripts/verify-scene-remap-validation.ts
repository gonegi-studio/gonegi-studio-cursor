import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REMAP_VALIDATION_DATASET_DIR,
  SCENE_REMAP_LIBRARY_PATH,
  SCENE_REMAP_PASS_VERDICT,
  SCENE_REMAP_READY_STATUS,
  SCENE_REMAP_REGISTRY_PATH,
  SCENE_REMAP_REPORT_PATH,
  SCENE_REMAP_SCORECARD_PATH,
  writeSceneRemapValidation,
} from '../services/sceneRemapValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSceneRemapValidation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `overall_remap_readiness=${summary.overall_remap_readiness}`,
    `camera_transfer_readiness=${summary.camera_transfer_readiness}`,
    `blocking_transfer_readiness=${summary.blocking_transfer_readiness}`,
    `editing_transfer_readiness=${summary.editing_transfer_readiness}`,
    `motion_transfer_readiness=${summary.motion_transfer_readiness}`,
    `composition_transfer_readiness=${summary.composition_transfer_readiness}`,
    `environment_motion_accuracy=${summary.environment_motion_accuracy}`,
    `signature_preservation=${summary.signature_preservation}`,
    `style_conversion_success=${summary.style_conversion_success}`,
    `titanic_remap_readiness=${summary.titanic_remap_readiness}`,
    `scene_pass_ratio=${summary.scene_pass_ratio}`,
    `gpu_test_recommended=${summary.gpu_test_recommended}`,
    `gpu_execution=${summary.gpu_execution}`,
    `remap_passed=${report.remap_passed}`,
  ].join(' ')
);
console.log(`report=${SCENE_REMAP_REPORT_PATH}`);
console.log(`library=${SCENE_REMAP_LIBRARY_PATH}`);
console.log(`registry=${SCENE_REMAP_REGISTRY_PATH}`);
console.log(`scorecard=${SCENE_REMAP_SCORECARD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (!report.precheck.precheck_passed) {
  console.error('VERIFY FAIL: precheck_passed=false');
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['overall_remap_readiness>=90', Number(summary.overall_remap_readiness) >= 90],
  ['camera_transfer_readiness>=85', Number(summary.camera_transfer_readiness) >= 85],
  ['blocking_transfer_readiness>=85', Number(summary.blocking_transfer_readiness) >= 85],
  ['editing_transfer_readiness>=85', Number(summary.editing_transfer_readiness) >= 85],
  ['motion_transfer_readiness>=85', Number(summary.motion_transfer_readiness) >= 85],
  ['composition_transfer_readiness>=85', Number(summary.composition_transfer_readiness) >= 85],
  ['environment_motion_accuracy>=85', Number(summary.environment_motion_accuracy) >= 85],
  ['signature_preservation>=85', Number(summary.signature_preservation) >= 85],
  ['style_conversion_success>=85', Number(summary.style_conversion_success) >= 85],
  ['titanic_remap_readiness>=90', Number(summary.titanic_remap_readiness) >= 90],
  ['minimum_scene_pass_ratio>=0.80', Number(summary.scene_pass_ratio) >= 0.8],
  ['gpu_test_recommended=true', summary.gpu_test_recommended === true],
  ['gpu_execution=false', summary.gpu_execution === false],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

const library = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SCENE_REMAP_LIBRARY_PATH), 'utf8')
) as { scenes: unknown[]; director_group_counts: Record<string, number> };
const registry = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SCENE_REMAP_REGISTRY_PATH), 'utf8')
) as { entries: unknown[] };

if (library.scenes.length < 12) {
  console.error('VERIFY FAIL: scene library count < 12');
  process.exit(1);
}
if (library.director_group_counts.ghibli < 4) process.exit(1);
if (library.director_group_counts.shinkai < 3) process.exit(1);
if (library.director_group_counts.mori < 3) process.exit(1);
if (library.director_group_counts.live_action < 2) process.exit(1);
if (registry.entries.length < 12) process.exit(1);

if (!fs.existsSync(path.join(projectRoot, REMAP_VALIDATION_DATASET_DIR))) {
  console.error('VERIFY FAIL: remap_validation dataset missing');
  process.exit(1);
}

if (report.final_verdict !== SCENE_REMAP_PASS_VERDICT) process.exit(1);
if (report.status !== SCENE_REMAP_READY_STATUS) process.exit(1);
