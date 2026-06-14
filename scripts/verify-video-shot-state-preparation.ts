import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSeedVideoShotStates,
  VIDEO_SHOT_REGISTRY_PATH,
  writeVideoShotStates,
} from '../services/videoShotStateBuilder.js';
import {
  VIDEO_SHOT_PASS_VERDICT,
  VIDEO_SHOT_PREPARATION_REPORT_PATH,
  VIDEO_SHOT_SCHEMA_PATH,
  writeVideoShotPreparationReport,
} from '../services/videoShotStateValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [VIDEO_SHOT_SCHEMA_PATH, VIDEO_SHOT_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required video state asset: ${required}`);
    process.exit(1);
  }
}

const states = buildSeedVideoShotStates(projectRoot);
const written = writeVideoShotStates(projectRoot, states);
const report = writeVideoShotPreparationReport(projectRoot, states);

console.log(report.final_verdict);
console.log(
  `video_states=${report.video_state_count} validation=${report.validation_result} motion_safety=${report.motion_safety_result} continuity=${report.continuity_lock_result}`
);
for (const link of report.source_scene_state_links) {
  console.log(`  ${link.video_shot_state_id} <- ${link.source_scene_state_id} linked=${link.linked}`);
}
for (const validation of report.video_shot_validations) {
  console.log(`  ${validation.video_shot_state_id}: ${validation.valid ? 'PASS' : 'FAIL'}`);
}
console.log(`gpu_execution=${report.gpu_execution} preparation_only=${report.preparation_only}`);
console.log(`written=${written.join(', ')}`);
console.log(`report=${VIDEO_SHOT_PREPARATION_REPORT_PATH}`);

if (!fs.existsSync(path.join(projectRoot, VIDEO_SHOT_PREPARATION_REPORT_PATH))) {
  console.error('Video shot preparation report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_SHOT_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
