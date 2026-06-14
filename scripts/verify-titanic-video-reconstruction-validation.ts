import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TITANIC_VIDEO_VALIDATION_METRICS_PATH,
  TITANIC_VIDEO_VALIDATION_PASS_VERDICT,
  TITANIC_VIDEO_VALIDATION_REPORT_PATH,
  TITANIC_VIDEO_VALIDATION_SCENES_PATH,
  writeTitanicVideoReconstructionValidation,
} from '../services/titanicVideoReconstructionValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTitanicVideoReconstructionValidation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `validation_sequence_count=${summary.validation_sequence_count}`,
    `sequence_recognition_score=${summary.sequence_recognition_score}`,
    `geometry_preservation_score=${summary.geometry_preservation_score}`,
    `semantic_anchor_score=${summary.semantic_anchor_score}`,
    `motion_preservation_score=${summary.motion_preservation_score}`,
    `temporal_continuity_score=${summary.temporal_continuity_score}`,
    `gonegi_identity_score=${summary.gonegi_identity_score}`,
    `generic_harbor_count=${summary.generic_harbor_count}`,
    `titanic_reconstruction_verified=${summary.titanic_reconstruction_verified}`,
  ].join(' | ')
);

for (const rel of [
  TITANIC_VIDEO_VALIDATION_SCENES_PATH,
  TITANIC_VIDEO_VALIDATION_METRICS_PATH,
  TITANIC_VIDEO_VALIDATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TITANIC_VIDEO_VALIDATION_PASS_VERDICT) {
  console.error('TITANIC VIDEO RECONSTRUCTION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
