import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_RUNTIME_SWAP_METRICS_PATH,
  MOVIE_RUNTIME_VALIDATION_REPORT_PATH,
  MOVIE_RUNTIME_VALIDATION_SCENES_PATH,
  MULTI_MOVIE_RUNTIME_PASS_VERDICT,
  writeMultiMovieRuntimeValidation,
} from '../services/multiMovieRuntimeValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMultiMovieRuntimeValidation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `runtime_validation_passed=${report.runtime_validation_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `movie_swap_success_rate=${summary.movie_swap_success_rate}`,
    `world_identity_preservation=${summary.world_identity_preservation}`,
    `character_identity_preservation=${summary.character_identity_preservation}`,
    `movie_signature_separation=${summary.movie_signature_separation}`,
    `cross_movie_contamination=${summary.cross_movie_contamination}`,
    `runtime_swap_verified=${summary.runtime_swap_verified}`,
    `tested_pairs=${summary.tested_pairs}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_RUNTIME_VALIDATION_SCENES_PATH,
  MOVIE_RUNTIME_SWAP_METRICS_PATH,
  MOVIE_RUNTIME_VALIDATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MULTI_MOVIE_RUNTIME_PASS_VERDICT) {
  console.error('MULTI MOVIE RUNTIME VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
