import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SPIRITED_AWAY_CHARACTER_STATE_REGISTRY_PATH,
  SPIRITED_AWAY_ENVIRONMENT_CONTINUITY_REGISTRY_PATH,
  SPIRITED_AWAY_SHOT_SEQUENCE_REGISTRY_PATH,
  SPIRITED_AWAY_TEMPORAL_ADAPTER_PATH,
  SPIRITED_AWAY_TEMPORAL_PASS_VERDICT,
  SPIRITED_AWAY_TEMPORAL_REPORT_PATH,
  SPIRITED_AWAY_TEMPORAL_TRANSITION_REGISTRY_PATH,
  writeSpiritedAwayTemporalReconstruction,
} from '../services/spiritedAwayTemporalReconstruction.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSpiritedAwayTemporalReconstruction(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `temporal_system_passed=${report.temporal_system_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `sequence_count=${summary.sequence_count}`,
    `shot_count=${summary.shot_count}`,
    `temporal_continuity_score=${summary.temporal_continuity_score}`,
    `semantic_continuity_score=${summary.semantic_continuity_score}`,
    `character_state_consistency=${summary.character_state_consistency}`,
    `environment_continuity_score=${summary.environment_continuity_score}`,
    `movie_dataset_swap_valid=${summary.movie_dataset_swap_valid}`,
    `world_identity_lock=${summary.world_identity_lock}`,
    `video_reconstruction_status=${summary.video_reconstruction_status}`,
    `factory_second_movie_proven=${summary.factory_second_movie_proven}`,
  ].join(' | ')
);

for (const rel of [
  SPIRITED_AWAY_SHOT_SEQUENCE_REGISTRY_PATH,
  SPIRITED_AWAY_CHARACTER_STATE_REGISTRY_PATH,
  SPIRITED_AWAY_ENVIRONMENT_CONTINUITY_REGISTRY_PATH,
  SPIRITED_AWAY_TEMPORAL_TRANSITION_REGISTRY_PATH,
  SPIRITED_AWAY_TEMPORAL_ADAPTER_PATH,
  SPIRITED_AWAY_TEMPORAL_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SPIRITED_AWAY_TEMPORAL_PASS_VERDICT) {
  console.error('SPIRITED AWAY TEMPORAL RECONSTRUCTION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
