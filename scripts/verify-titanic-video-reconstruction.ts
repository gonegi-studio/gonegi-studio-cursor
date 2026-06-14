import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TITANIC_SCENE_TRANSITION_REGISTRY_PATH,
  TITANIC_VIDEO_ADAPTER_V2_PATH,
  TITANIC_VIDEO_PASS_VERDICT,
  TITANIC_VIDEO_RECONSTRUCTION_REPORT_PATH,
  TITANIC_VIDEO_RENDER_PLAN_REGISTRY_PATH,
  TITANIC_VIDEO_SEQUENCE_REGISTRY_PATH,
  TITANIC_VIDEO_TIMELINE_REGISTRY_PATH,
  writeTitanicVideoReconstruction,
} from '../services/titanicVideoReconstruction.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTitanicVideoReconstruction(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `video_system_passed=${report.video_system_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `shot_count=${summary.shot_count}`,
    `total_duration=${summary.total_duration}`,
    `video_sequence_integrity=${summary.video_sequence_integrity}`,
    `scene_transition_score=${summary.scene_transition_score}`,
    `timeline_integrity=${summary.timeline_integrity}`,
    `temporal_continuity_score=${summary.temporal_continuity_score}`,
    `motion_continuity_score=${summary.motion_continuity_score}`,
    `semantic_anchor_binding_rate=${summary.semantic_anchor_binding_rate}`,
    `gonegi_translation_integrity=${summary.gonegi_translation_integrity}`,
    `world_identity_lock=${summary.world_identity_lock}`,
    `video_generation_status=${summary.video_generation_status}`,
  ].join(' | ')
);

for (const rel of [
  TITANIC_VIDEO_SEQUENCE_REGISTRY_PATH,
  TITANIC_SCENE_TRANSITION_REGISTRY_PATH,
  TITANIC_VIDEO_TIMELINE_REGISTRY_PATH,
  TITANIC_VIDEO_RENDER_PLAN_REGISTRY_PATH,
  TITANIC_VIDEO_ADAPTER_V2_PATH,
  TITANIC_VIDEO_RECONSTRUCTION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TITANIC_VIDEO_PASS_VERDICT) {
  console.error('TITANIC VIDEO RECONSTRUCTION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
