import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SINGLE_SCENE_IMAGE_REGISTRY_PATH,
  SINGLE_SCENE_LIBRARY_PATH,
  SINGLE_SCENE_PASS_VERDICT,
  SINGLE_SCENE_READY_STATUS,
  SINGLE_SCENE_REPORT_PATH,
  SINGLE_SCENE_SCORECARD_PATH,
  writeSingleSceneValidation,
} from '../services/singleSceneValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSingleSceneValidation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `overall_validation_score=${summary.overall_validation_score}`,
    `scene_pass_ratio=${summary.scene_pass_ratio}`,
    `character_identity=${summary.character_identity}`,
    `location_identity=${summary.location_identity}`,
    `lighting_identity=${summary.lighting_identity}`,
    `camera_preservation=${summary.camera_preservation}`,
    `blocking_preservation=${summary.blocking_preservation}`,
    `environment_motion_preservation=${summary.environment_motion_preservation}`,
    `signature_preservation=${summary.signature_preservation}`,
    `style_conversion_success=${summary.style_conversion_success}`,
    `titanic_deck_remap=${summary.titanic_deck_remap}`,
    `images_validated=${summary.images_validated}`,
    `gpu_execution=${summary.gpu_execution}`,
    `validation_only=${summary.validation_only}`,
    `next_order=${summary.next_order}`,
    `validation_passed=${report.validation_passed}`,
  ].join(' ')
);
console.log(`report=${SINGLE_SCENE_REPORT_PATH}`);
console.log(`library=${SINGLE_SCENE_LIBRARY_PATH}`);
console.log(`registry=${SINGLE_SCENE_IMAGE_REGISTRY_PATH}`);
console.log(`scorecard=${SINGLE_SCENE_SCORECARD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const library = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SINGLE_SCENE_LIBRARY_PATH), 'utf8')
) as { director_group_counts: Record<string, number>; scene_count: number };

const registry = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SINGLE_SCENE_IMAGE_REGISTRY_PATH), 'utf8')
) as { image_count: number; gpu_execution: boolean };

const scorecard = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SINGLE_SCENE_SCORECARD_PATH), 'utf8')
) as { titanic_benchmark: { verdict: string } };

const checks: [string, boolean][] = [
  ['overall_validation_score>=90', Number(summary.overall_validation_score) >= 90],
  ['scene_pass_ratio>=0.80', Number(summary.scene_pass_ratio) >= 0.8],
  ['character_identity>=90', Number(summary.character_identity) >= 90],
  ['location_identity>=90', Number(summary.location_identity) >= 90],
  ['lighting_identity>=90', Number(summary.lighting_identity) >= 90],
  ['camera_preservation>=85', Number(summary.camera_preservation) >= 85],
  ['blocking_preservation>=85', Number(summary.blocking_preservation) >= 85],
  ['environment_motion_preservation>=85', Number(summary.environment_motion_preservation) >= 85],
  ['signature_preservation>=85', Number(summary.signature_preservation) >= 85],
  ['style_conversion_success>=85', Number(summary.style_conversion_success) >= 85],
  ['TITANIC_DECK_REMAP=PASS', scorecard.titanic_benchmark.verdict === 'PASS'],
  ['ghibli=4', library.director_group_counts.ghibli === 4],
  ['shinkai=3', library.director_group_counts.shinkai === 3],
  ['mori=3', library.director_group_counts.mori === 3],
  ['titanic=2', library.director_group_counts.titanic === 2],
  ['images=12', registry.image_count === 12],
  ['gpu_execution=false', registry.gpu_execution === false],
  ['validation_only=true', summary.validation_only === true],
  ['batch_test_blocked=false', summary.batch_test_blocked === false],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SINGLE_SCENE_PASS_VERDICT) process.exit(1);
if (report.status !== SINGLE_SCENE_READY_STATUS) process.exit(1);
