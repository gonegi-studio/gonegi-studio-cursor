import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_SCENARIO_HARDENING_PASS_VERDICT,
  MOVIE_SCENARIO_HARDENING_REPORT_PATH,
  NATIVE_IMPORT_V2_OUTPUTS,
  writeMovieScenarioHardeningReport,
} from '../services/movieScenarioHardening.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieScenarioHardeningReport(projectRoot);
const { checks, metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `scenario_reconstruction_ready=${report.scenario_reconstruction_ready}`,
    `image_app_prompt_ready=${report.image_app_prompt_ready}`,
    `camera_language_present=${checks.camera_language_present}`,
    `blocking_present=${checks.blocking_present}`,
    `gaze_present=${checks.gaze_present}`,
    `depth_layers_present=${checks.depth_layers_present}`,
    `environment_anchor_present=${checks.environment_anchor_present}`,
    `prop_anchor_present=${checks.prop_anchor_present}`,
    `semantic_anchor_present=${checks.semantic_anchor_present}`,
    `scene_count=${metrics.scene_count}`,
    `average_scenario_length=${metrics.average_scenario_length}`,
    `hardening_pass_rate=${metrics.hardening_pass_rate}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_SCENARIO_HARDENING_REPORT_PATH,
  ...NATIVE_IMPORT_V2_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_SCENARIO_HARDENING_PASS_VERDICT) {
  console.error('MOVIE SCENARIO HARDENING VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
