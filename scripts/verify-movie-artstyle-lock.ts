import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANONICAL_ARTSTYLE_PATH } from '../services/canonicalGonegiArtStyle.js';
import {
  MOVIE_ARTSTYLE_LOCK_PASS_VERDICT,
  MOVIE_ARTSTYLE_LOCK_REPORT_PATH,
  writeMovieArtstyleLockReport,
} from '../services/movieArtstyleLockValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieArtstyleLockReport(projectRoot);
const { checks, metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `canonical_artstyle_locked=${report.canonical_artstyle_locked}`,
    `gonegi_identity_locked=${report.gonegi_identity_locked}`,
    `artStyle_exact_match=${checks.artStyle_exact_match}`,
    `artStyle_generated=${checks.artStyle_generated}`,
    `artStyle_expansion_detected=${checks.artStyle_expansion_detected}`,
    `artStyle_variant_count=${checks.artStyle_variant_count}`,
    `binding_scene_count=${metrics.binding_scene_count}`,
    `native_import_slot_count=${metrics.native_import_slot_count}`,
    `CANONICAL_GONEGI_ARTSTYLE=${report.CANONICAL_GONEGI_ARTSTYLE}`,
  ].join(' | ')
);

if (!fs.existsSync(path.join(projectRoot, CANONICAL_ARTSTYLE_PATH))) {
  console.error(`OUTPUT MISSING: ${CANONICAL_ARTSTYLE_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, MOVIE_ARTSTYLE_LOCK_REPORT_PATH))) {
  console.error(`OUTPUT MISSING: ${MOVIE_ARTSTYLE_LOCK_REPORT_PATH}`);
  process.exit(1);
}

if (report.final_verdict !== MOVIE_ARTSTYLE_LOCK_PASS_VERDICT) {
  console.error('MOVIE ARTSTYLE LOCK VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
