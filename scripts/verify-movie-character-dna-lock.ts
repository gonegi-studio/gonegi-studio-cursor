import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_CHARACTER_DNA_LOCK_PASS_VERDICT,
  MOVIE_CHARACTER_DNA_LOCK_REPORT_PATH,
  NATIVE_IMPORT_V3_OUTPUTS,
  writeMovieCharacterDNALockReport,
} from '../services/movieCharacterDNALock.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieCharacterDNALockReport(projectRoot);
const { checks, metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `character_identity_locked=${report.character_identity_locked}`,
    `image_app_character_ready=${report.image_app_character_ready}`,
    `full_character_dna_present=${checks.full_character_dna_present}`,
    `character_generated=${checks.character_generated}`,
    `character_summarized=${checks.character_summarized}`,
    `identity_tokens_present=${checks.identity_tokens_present}`,
    `scene_count=${metrics.scene_count}`,
    `average_character_length=${metrics.average_character_length}`,
    `dna_lock_pass_rate=${metrics.dna_lock_pass_rate}`,
    `locked_character_library_count=${metrics.locked_character_library_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_CHARACTER_DNA_LOCK_REPORT_PATH,
  ...NATIVE_IMPORT_V3_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_CHARACTER_DNA_LOCK_PASS_VERDICT) {
  console.error('MOVIE CHARACTER DNA LOCK VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
