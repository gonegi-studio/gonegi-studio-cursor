import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SPIRITED_AWAY_CAMERA_MOTION_REGISTRY_PATH,
  SPIRITED_AWAY_ENVIRONMENT_MOTION_REGISTRY_PATH,
  SPIRITED_AWAY_MOTION_ADAPTER_PATH,
  SPIRITED_AWAY_MOTION_CONTINUITY_REGISTRY_PATH,
  SPIRITED_AWAY_MOTION_GRAMMAR_REGISTRY_PATH,
  SPIRITED_AWAY_MOTION_PASS_VERDICT,
  SPIRITED_AWAY_MOTION_RECONSTRUCTION_REPORT_PATH,
  SPIRITED_AWAY_SUBJECT_MOTION_REGISTRY_PATH,
  writeSpiritedAwayMotionReconstruction,
} from '../services/spiritedAwayMotionReconstruction.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSpiritedAwayMotionReconstruction(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `motion_system_passed=${report.motion_system_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `motion_count=${summary.motion_count}`,
    `motion_grammar_coverage=${summary.motion_grammar_coverage}`,
    `camera_motion_score=${summary.camera_motion_score}`,
    `subject_motion_score=${summary.subject_motion_score}`,
    `environment_motion_score=${summary.environment_motion_score}`,
    `motion_continuity_score=${summary.motion_continuity_score}`,
    `semantic_anchor_binding_rate=${summary.semantic_anchor_binding_rate}`,
    `movie_dataset_swap_valid=${summary.movie_dataset_swap_valid}`,
    `world_identity_lock=${summary.world_identity_lock}`,
    `generic_harbor_regression_count=${summary.generic_harbor_regression_count}`,
    `video_reconstruction_status=${summary.video_reconstruction_status}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

for (const rel of [
  SPIRITED_AWAY_MOTION_GRAMMAR_REGISTRY_PATH,
  SPIRITED_AWAY_CAMERA_MOTION_REGISTRY_PATH,
  SPIRITED_AWAY_SUBJECT_MOTION_REGISTRY_PATH,
  SPIRITED_AWAY_ENVIRONMENT_MOTION_REGISTRY_PATH,
  SPIRITED_AWAY_MOTION_CONTINUITY_REGISTRY_PATH,
  SPIRITED_AWAY_MOTION_ADAPTER_PATH,
  SPIRITED_AWAY_MOTION_RECONSTRUCTION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SPIRITED_AWAY_MOTION_PASS_VERDICT) {
  console.error('SPIRITED AWAY MOTION RECONSTRUCTION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
