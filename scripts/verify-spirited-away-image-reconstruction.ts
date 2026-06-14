import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SPIRITED_AWAY_IMAGE_VALIDATION_METRICS_PATH,
  SPIRITED_AWAY_IMAGE_VALIDATION_PASS_VERDICT,
  SPIRITED_AWAY_IMAGE_VALIDATION_REPORT_PATH,
  SPIRITED_AWAY_IMAGE_VALIDATION_SCENES_PATH,
  writeSpiritedAwayImageReconstructionValidation,
} from '../services/spiritedAwayImageReconstructionValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSpiritedAwayImageReconstructionValidation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `test_scene_count=${summary.test_scene_count}`,
    `scene_recognition_score=${summary.scene_recognition_score}`,
    `geometry_preservation_score=${summary.geometry_preservation_score}`,
    `semantic_anchor_score=${summary.semantic_anchor_score}`,
    `gonegi_identity_score=${summary.gonegi_identity_score}`,
    `generic_harbor_count=${summary.generic_harbor_count}`,
    `character_dna_expanded_all=${summary.character_dna_expanded_all}`,
    `movie_dataset_swap_valid=${summary.movie_dataset_swap_valid}`,
    `world_identity_lock=${summary.world_identity_lock}`,
    `next_order=${report.validation_passed ? summary.next_order_pass : summary.next_order_fail}`,
  ].join(' | ')
);

for (const rel of [
  SPIRITED_AWAY_IMAGE_VALIDATION_SCENES_PATH,
  SPIRITED_AWAY_IMAGE_VALIDATION_METRICS_PATH,
  SPIRITED_AWAY_IMAGE_VALIDATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SPIRITED_AWAY_IMAGE_VALIDATION_PASS_VERDICT) {
  console.error('SPIRITED AWAY IMAGE RECONSTRUCTION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
