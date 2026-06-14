import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_IMAGE_BATCH_100_IMAGES_DIR,
  REAL_IMAGE_BATCH_100_PASS_VERDICT,
  REAL_IMAGE_BATCH_100_READY_STATUS,
  REAL_IMAGE_BATCH_100_REGISTRY_PATH,
  REAL_IMAGE_BATCH_100_REPORT_PATH,
  REAL_IMAGE_BATCH_100_SCORECARD_PATH,
  writeRealImageBatch100Validation,
} from '../services/realImageBatch100Validation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeRealImageBatch100Validation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `character_identity=${summary.character_identity}`,
    `location_identity=${summary.location_identity}`,
    `lighting_identity=${summary.lighting_identity}`,
    `signature_preservation=${summary.signature_preservation}`,
    `batch_consistency_score=${summary.batch_consistency_score}`,
    `identity_drift_rate=${summary.identity_drift_rate}`,
    `catastrophic_failure_rate=${summary.catastrophic_failure_rate}`,
    `critical_dimension_fail_count=${summary.critical_dimension_fail_count}`,
    `overall_fidelity_score=${summary.overall_fidelity_score}`,
    `minimum_fidelity_level=${summary.minimum_fidelity_level}`,
    `images_generated=${summary.images_generated}`,
    `GHIBLI_pass_ratio=${summary.GHIBLI_pass_ratio}`,
    `SHINKAI_pass_ratio=${summary.SHINKAI_pass_ratio}`,
    `MORI_pass_ratio=${summary.MORI_pass_ratio}`,
    `TITANIC_pass_ratio=${summary.TITANIC_pass_ratio}`,
    `MIXED_pass_ratio=${summary.MIXED_pass_ratio}`,
    `real_output_validation=${summary.real_output_validation}`,
    `simulated=${summary.simulated}`,
    `gpu_execution=${summary.gpu_execution}`,
    `next_order=${summary.next_order}`,
    `batch_passed=${report.batch_passed}`,
  ].join(' ')
);
console.log(`report=${REAL_IMAGE_BATCH_100_REPORT_PATH}`);
console.log(`registry=${REAL_IMAGE_BATCH_100_REGISTRY_PATH}`);
console.log(`scorecard=${REAL_IMAGE_BATCH_100_SCORECARD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const registry = JSON.parse(
  fs.readFileSync(path.join(projectRoot, REAL_IMAGE_BATCH_100_REGISTRY_PATH), 'utf8')
) as {
  image_count: number;
  simulated: boolean;
  director_group_counts: Record<string, number>;
  entries: { generated_image_path: string; real_output: boolean; generation_timestamp: string }[];
};

const scorecard = JSON.parse(
  fs.readFileSync(path.join(projectRoot, REAL_IMAGE_BATCH_100_SCORECARD_PATH), 'utf8')
) as {
  drift_audit: { identity_drift_rate: number };
  batch_consistency: { batch_consistency_score: number };
  catastrophic_audit: { catastrophic_failure_rate: number };
};

const levelOrder = ['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5'];

const checks: [string, boolean][] = [
  ['character_identity>=90', Number(summary.character_identity) >= 90],
  ['location_identity>=85', Number(summary.location_identity) >= 85],
  ['lighting_identity>=85', Number(summary.lighting_identity) >= 85],
  ['signature_preservation>=85', Number(summary.signature_preservation) >= 85],
  ['batch_consistency_score>=85', scorecard.batch_consistency.batch_consistency_score >= 85],
  ['identity_drift_rate<=10', scorecard.drift_audit.identity_drift_rate <= 10],
  ['catastrophic_failure_rate<=5', scorecard.catastrophic_audit.catastrophic_failure_rate <= 5],
  ['critical_dimension_fail_count=0', Number(summary.critical_dimension_fail_count) === 0],
  ['overall_fidelity_score>=90', Number(summary.overall_fidelity_score) >= 90],
  ['minimum_fidelity_level>=LEVEL_4', levelOrder.indexOf(String(summary.minimum_fidelity_level)) >= levelOrder.indexOf('LEVEL_4')],
  ['ghibli=30', registry.director_group_counts.ghibli === 30],
  ['shinkai=20', registry.director_group_counts.shinkai === 20],
  ['mori=20', registry.director_group_counts.mori === 20],
  ['titanic=20', registry.director_group_counts.titanic === 20],
  ['mixed=10', registry.director_group_counts.mixed === 10],
  ['images=100', registry.image_count === 100],
  ['real_output=true', registry.entries.every((e) => e.real_output === true)],
  ['simulated=false', registry.simulated === false],
  ['gpu_execution=false', summary.gpu_execution === false],
  ['all_timestamps_present', registry.entries.every((e) => Boolean(e.generation_timestamp))],
  ['all_image_files_exist', registry.entries.every((e) => fs.existsSync(path.join(projectRoot, e.generated_image_path)))],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_BATCH_100_IMAGES_DIR))) {
  console.error('VERIFY FAIL: images directory missing');
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_BATCH_100_PASS_VERDICT) process.exit(1);
if (report.status !== REAL_IMAGE_BATCH_100_READY_STATUS) process.exit(1);
