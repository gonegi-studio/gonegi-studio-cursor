import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENV_LOCK_AB_TEST_OUTPUT_PATH,
  ENV_LOCK_AB_TEST_PASS_VERDICT,
  ENV_LOCK_AB_TEST_REPORT_PATH,
  writeEnvLockAbTestReport,
} from '../services/imageAppEnvLockAbTestValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeEnvLockAbTestReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `import_format_valid=${report.import_format_valid}`,
    `character_swap=${report.character_swap}`,
    `environment_lock=${report.environment_lock}`,
    `prop_lock=${report.prop_lock}`,
    `camera_lock=${report.camera_lock}`,
    `output=${ENV_LOCK_AB_TEST_OUTPUT_PATH}`,
  ].join(' | ')
);

for (const rel of [ENV_LOCK_AB_TEST_OUTPUT_PATH, ENV_LOCK_AB_TEST_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

const output = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENV_LOCK_AB_TEST_OUTPUT_PATH), 'utf8')
) as Record<string, unknown>;

if (!Array.isArray(output.slots)) {
  console.error('OUTPUT STRUCTURE FAIL: root.slots must exist');
  process.exit(1);
}

if (output.slots.length !== 2) {
  console.error(`OUTPUT STRUCTURE FAIL: slots.length must be 2, got ${output.slots.length}`);
  process.exit(1);
}

for (const [index, slot] of output.slots.entries()) {
  const record = slot as Record<string, unknown>;
  for (const field of ['artStyle', 'timeSetting', 'scenario', 'character'] as const) {
    if (typeof record[field] !== 'string' || record[field].length === 0) {
      console.error(`OUTPUT STRUCTURE FAIL: slots[${index}].${field} missing or empty`);
      process.exit(1);
    }
  }
}

if (Object.prototype.hasOwnProperty.call(output, 'SCENE_A')) {
  console.error('OUTPUT STRUCTURE FAIL: root.SCENE_A must not exist');
  process.exit(1);
}

if (Object.prototype.hasOwnProperty.call(output, 'SCENE_B')) {
  console.error('OUTPUT STRUCTURE FAIL: root.SCENE_B must not exist');
  process.exit(1);
}

if (report.final_verdict !== ENV_LOCK_AB_TEST_PASS_VERDICT) {
  console.error('ENV LOCK AB TEST VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
