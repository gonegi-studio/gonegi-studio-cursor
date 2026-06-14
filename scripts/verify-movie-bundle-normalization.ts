import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_BUNDLE_NORMALIZATION_PASS_VERDICT,
  MOVIE_BUNDLE_NORMALIZATION_REPORT_PATH,
  writeMovieBundleNormalization,
} from '../services/movieBundleNormalization.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieBundleNormalization(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `titanic_bundle_mode=${report.titanic_bundle_mode}`,
    `spirited_away_bundle_mode=${report.spirited_away_bundle_mode}`,
    `bundle_schema_match=${report.bundle_schema_match}`,
    `critical_layer_missing_count=${report.critical_layer_missing_count}`,
    `normalization_passed=${report.normalization_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
  ].join(' | ')
);

if (!fs.existsSync(path.join(projectRoot, MOVIE_BUNDLE_NORMALIZATION_REPORT_PATH))) {
  console.error(`OUTPUT MISSING: ${MOVIE_BUNDLE_NORMALIZATION_REPORT_PATH}`);
  process.exit(1);
}

if (report.final_verdict !== MOVIE_BUNDLE_NORMALIZATION_PASS_VERDICT) {
  console.error('MOVIE BUNDLE NORMALIZATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
