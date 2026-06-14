import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TITANIC_IMAGE_ADAPTER_PATH,
  TITANIC_SHOT_FINGERPRINT_REGISTRY_PATH,
  TITANIC_SHOT_PASS_VERDICT,
  TITANIC_SHOT_RECONSTRUCTION_REPORT_PATH,
  TITANIC_SHOT_REGISTRY_PATH,
  TITANIC_SHOT_TRANSITION_REGISTRY_PATH,
  TITANIC_VIDEO_ADAPTER_PATH,
  writeTitanicShotReconstruction,
} from '../services/titanicShotReconstruction.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTitanicShotReconstruction(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `shot_system_passed=${report.shot_system_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `scene_count=${summary.scene_count}`,
    `shot_count=${summary.shot_count}`,
    `shot_fingerprint_uniqueness=${summary.shot_fingerprint_uniqueness}`,
    `semantic_anchor_binding_rate=${summary.semantic_anchor_binding_rate}`,
    `image_adapter_ready=${summary.image_adapter_ready}`,
    `video_adapter_ready=${summary.video_adapter_ready}`,
    `image_reconstruction_status=${summary.image_reconstruction_status}`,
    `video_reconstruction_status=${summary.video_reconstruction_status}`,
    `single_movie_dataset=${summary.single_movie_dataset}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

for (const rel of [
  TITANIC_SHOT_REGISTRY_PATH,
  TITANIC_SHOT_TRANSITION_REGISTRY_PATH,
  TITANIC_SHOT_FINGERPRINT_REGISTRY_PATH,
  TITANIC_IMAGE_ADAPTER_PATH,
  TITANIC_VIDEO_ADAPTER_PATH,
  TITANIC_SHOT_RECONSTRUCTION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TITANIC_SHOT_PASS_VERDICT) {
  console.error('TITANIC SHOT RECONSTRUCTION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
