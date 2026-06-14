import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_IMAGE_BATCH_IMAGES_DIR,
  REAL_IMAGE_BATCH_PASS_VERDICT,
  REAL_IMAGE_BATCH_READY_STATUS,
  REAL_IMAGE_BATCH_REGISTRY_PATH,
  REAL_IMAGE_BATCH_REPORT_PATH,
  REAL_IMAGE_BATCH_SCORECARD_PATH,
  writeRealImageBatchValidation,
} from '../services/realImageBatchValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeRealImageBatchValidation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `overall_validation_score=${summary.overall_validation_score}`,
    `scene_pass_ratio=${summary.scene_pass_ratio}`,
    `titanic_pass_ratio=${summary.titanic_pass_ratio}`,
    `character_identity=${summary.character_identity}`,
    `location_identity=${summary.location_identity}`,
    `lighting_identity=${summary.lighting_identity}`,
    `overall_fidelity_score=${summary.overall_fidelity_score}`,
    `minimum_fidelity_level=${summary.minimum_fidelity_level}`,
    `critical_dimension_fail_count=${summary.critical_dimension_fail_count}`,
    `single_scene_catastrophic_failure_count=${summary.single_scene_catastrophic_failure_count}`,
    `images_generated=${summary.images_generated}`,
    `real_output_validation=${summary.real_output_validation}`,
    `simulated=${summary.simulated}`,
    `gpu_execution=${summary.gpu_execution}`,
    `next_order=${summary.next_order}`,
    `batch_passed=${report.batch_passed}`,
  ].join(' ')
);
console.log(`report=${REAL_IMAGE_BATCH_REPORT_PATH}`);
console.log(`registry=${REAL_IMAGE_BATCH_REGISTRY_PATH}`);
console.log(`scorecard=${REAL_IMAGE_BATCH_SCORECARD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const registry = JSON.parse(
  fs.readFileSync(path.join(projectRoot, REAL_IMAGE_BATCH_REGISTRY_PATH), 'utf8')
) as {
  image_count: number;
  simulated: boolean;
  director_group_counts: Record<string, number>;
  entries: { generated_image_path: string; real_output: boolean }[];
};

const scorecard = JSON.parse(
  fs.readFileSync(path.join(projectRoot, REAL_IMAGE_BATCH_SCORECARD_PATH), 'utf8')
) as { titanic_benchmark: { titanic_pass_ratio: number } };

const levelOrder = ['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5'];

const checks: [string, boolean][] = [
  ['overall_validation_score>=90', Number(summary.overall_validation_score) >= 90],
  ['scene_pass_ratio>=0.80', Number(summary.scene_pass_ratio) >= 0.8],
  ['character_identity>=90', Number(summary.character_identity) >= 90],
  ['location_identity>=90', Number(summary.location_identity) >= 90],
  ['lighting_identity>=90', Number(summary.lighting_identity) >= 90],
  ['critical_dimension_fail_count=0', Number(summary.critical_dimension_fail_count) === 0],
  ['catastrophic_failure_count=0', Number(summary.single_scene_catastrophic_failure_count) === 0],
  ['titanic_pass_ratio>=0.66', scorecard.titanic_benchmark.titanic_pass_ratio >= 0.66],
  ['overall_fidelity_score>=90', Number(summary.overall_fidelity_score) >= 90],
  ['minimum_fidelity_level>=LEVEL_4', levelOrder.indexOf(String(summary.minimum_fidelity_level)) >= levelOrder.indexOf('LEVEL_4')],
  ['fidelity_balance_score>=85', Number(summary.fidelity_balance_score) >= 85],
  ['ghibli=3', registry.director_group_counts.ghibli === 3],
  ['shinkai=2', registry.director_group_counts.shinkai === 2],
  ['mori=2', registry.director_group_counts.mori === 2],
  ['titanic=3', registry.director_group_counts.titanic === 3],
  ['images=10', registry.image_count === 10],
  ['real_output=true', registry.entries.every((e) => e.real_output === true)],
  ['simulated=false', registry.simulated === false],
  ['gpu_execution=false', summary.gpu_execution === false],
  ['all_image_files_exist', registry.entries.every((e) => fs.existsSync(path.join(projectRoot, e.generated_image_path)))],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_BATCH_IMAGES_DIR))) {
  console.error('VERIFY FAIL: images directory missing');
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_BATCH_PASS_VERDICT) process.exit(1);
if (report.status !== REAL_IMAGE_BATCH_READY_STATUS) process.exit(1);
