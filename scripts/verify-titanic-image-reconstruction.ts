import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TITANIC_IMAGE_TEST_SCENES_PATH,
  TITANIC_IMAGE_VALIDATION_PASS_VERDICT,
  TITANIC_IMAGE_VALIDATION_REPORT_PATH,
  writeTitanicImageReconstructionValidation,
} from '../services/titanicImageReconstructionValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTitanicImageReconstructionValidation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `test_scene_count=${summary.test_scene_count}`,
    `titanic_recognition_rate=${summary.titanic_recognition_rate}`,
    `scene_geometry_preservation=${summary.scene_geometry_preservation}`,
    `semantic_anchor_preservation=${summary.semantic_anchor_preservation}`,
    `gonegi_identity_preservation=${summary.gonegi_identity_preservation}`,
    `generic_harbor_count=${summary.generic_harbor_count}`,
    `character_dna_expanded_all=${summary.character_dna_expanded_all}`,
    `next_order=${report.validation_passed ? summary.next_order_pass : summary.next_order_fail}`,
  ].join(' | ')
);

for (const rel of [TITANIC_IMAGE_TEST_SCENES_PATH, TITANIC_IMAGE_VALIDATION_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TITANIC_IMAGE_VALIDATION_PASS_VERDICT) {
  console.error('TITANIC IMAGE RECONSTRUCTION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
