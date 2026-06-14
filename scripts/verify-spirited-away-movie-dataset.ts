import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SPIRITED_AWAY_BLOCKING_REGISTRY_PATH,
  SPIRITED_AWAY_BUNDLE_PATH,
  SPIRITED_AWAY_CAMERA_REGISTRY_PATH,
  SPIRITED_AWAY_COMPOSITION_REGISTRY_PATH,
  SPIRITED_AWAY_PASS_VERDICT,
  SPIRITED_AWAY_REPORT_PATH,
  SPIRITED_AWAY_SCENE_REGISTRY_PATH,
  SPIRITED_AWAY_SEMANTIC_ANCHOR_REGISTRY_PATH,
  SPIRITED_AWAY_STANDARDIZED_OUTPUT_PATH,
  SPIRITED_AWAY_WORLD_TRANSLATION_RULES_PATH,
  writeSpiritedAwayMovieDataset,
} from '../services/spiritedAwayMovieDataset.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSpiritedAwayMovieDataset(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `dataset_passed=${report.dataset_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `scene_count=${summary.scene_count}`,
    `scene_geometry_score=${summary.scene_geometry_score}`,
    `semantic_anchor_score=${summary.semantic_anchor_score}`,
    `factory_schema_valid=${summary.factory_schema_valid}`,
    `runtime_composition_valid=${summary.runtime_composition_valid}`,
    `movie_dataset_swap_valid=${summary.movie_dataset_swap_valid}`,
    `world_identity_lock_valid=${summary.world_identity_lock_valid}`,
    `factory_reusable_proven=${summary.factory_reusable_proven}`,
    `dataset_status=${summary.dataset_status}`,
  ].join(' | ')
);

for (const rel of [
  SPIRITED_AWAY_SCENE_REGISTRY_PATH,
  SPIRITED_AWAY_CAMERA_REGISTRY_PATH,
  SPIRITED_AWAY_BLOCKING_REGISTRY_PATH,
  SPIRITED_AWAY_COMPOSITION_REGISTRY_PATH,
  SPIRITED_AWAY_SEMANTIC_ANCHOR_REGISTRY_PATH,
  SPIRITED_AWAY_WORLD_TRANSLATION_RULES_PATH,
  SPIRITED_AWAY_BUNDLE_PATH,
  SPIRITED_AWAY_STANDARDIZED_OUTPUT_PATH,
  SPIRITED_AWAY_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SPIRITED_AWAY_PASS_VERDICT) {
  console.error('SPIRITED AWAY MOVIE DATASET FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
