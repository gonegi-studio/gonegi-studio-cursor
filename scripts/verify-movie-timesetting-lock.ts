import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_TIMESETTING_LOCK_PASS_VERDICT,
  MOVIE_TIMESETTING_LOCK_REPORT_PATH,
  NATIVE_IMPORT_V4_OUTPUTS,
  writeMovieTimeSettingLockReport,
} from '../services/movieTimeSettingLock.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieTimeSettingLockReport(projectRoot);
const { checks, metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `time_setting_locked=${report.time_setting_locked}`,
    `environment_identity_locked=${report.environment_identity_locked}`,
    `time_library_locked=${checks.time_library_locked}`,
    `location_id_present=${checks.location_id_present}`,
    `lighting_id_present=${checks.lighting_id_present}`,
    `weather_present=${checks.weather_present}`,
    `generated_time_setting=${checks.generated_time_setting}`,
    `scene_count=${metrics.scene_count}`,
    `average_timeSetting_length=${metrics.average_timeSetting_length}`,
    `time_lock_pass_rate=${metrics.time_lock_pass_rate}`,
    `time_setting_library_count=${metrics.time_setting_library_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_TIMESETTING_LOCK_REPORT_PATH,
  ...NATIVE_IMPORT_V4_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_TIMESETTING_LOCK_PASS_VERDICT) {
  console.error('MOVIE TIMESETTING LOCK VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
