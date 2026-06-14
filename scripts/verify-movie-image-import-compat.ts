import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_IMAGE_IMPORT_COMPAT_OUTPUT_PATH,
  MOVIE_IMAGE_IMPORT_COMPAT_PASS_VERDICT,
  MOVIE_IMAGE_IMPORT_COMPAT_REPORT_PATH,
  writeMovieImageImportCompatPackage,
} from '../services/movieImageImportCompatBuilder.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieImageImportCompatPackage(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `slots_created=${report.slots_created}`,
    `slot_count=${report.slot_count}`,
    `required_4_fields_present=${report.required_4_fields_present}`,
    `output_size_bytes=${report.output_size_bytes}`,
  ].join(' | ')
);

for (const rel of [MOVIE_IMAGE_IMPORT_COMPAT_REPORT_PATH, MOVIE_IMAGE_IMPORT_COMPAT_OUTPUT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_IMAGE_IMPORT_COMPAT_PASS_VERDICT) {
  console.error('IMAGE IMPORT COMPAT VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
