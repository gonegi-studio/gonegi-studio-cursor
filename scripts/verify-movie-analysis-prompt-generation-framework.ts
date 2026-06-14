import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  PROMPT_GENERATION_FRAMEWORK_MD_PATH,
  PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT,
  PROMPT_GENERATION_FRAMEWORK_REPORT_PATH,
  writeMovieAnalysisPromptGenerationFrameworkReport,
} from '../services/movieAnalysisPromptGenerationFramework.js';
import { RUNTIME_BINDING_FRAMEWORK_REPORT_PATH } from '../services/movieAnalysisRuntimeBindingFramework.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, RUNTIME_BINDING_FRAMEWORK_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${RUNTIME_BINDING_FRAMEWORK_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisPromptGenerationFrameworkReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} candidates=${report.prompt_generation_candidates.length} packages=${report.source_prompt_packages.length} scene_prompt_generation_complete=${report.scene_prompt_generation_complete} camera_prompt_generation_complete=${report.camera_prompt_generation_complete} emotion_prompt_generation_complete=${report.emotion_prompt_generation_complete} style_prompt_generation_complete=${report.style_prompt_generation_complete} continuity_prompt_generation_complete=${report.continuity_prompt_generation_complete} negative_prompt_generation_complete=${report.negative_prompt_generation_complete} runtime_target_mapping_complete=${report.runtime_target_mapping_complete} prompt_generation_framework_ready=${report.prompt_generation_framework_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_prompt_generated} camera=${audit.camera_prompt_generated} emotion=${audit.emotion_prompt_generated} style=${audit.style_prompt_generated} continuity=${audit.continuity_prompt_generated} negative=${audit.negative_prompt_generated} mapped=${audit.runtime_targets_mapped} ready=${audit.source_prompt_ready}`
  );
}
console.log(`report=${PROMPT_GENERATION_FRAMEWORK_REPORT_PATH}`);
console.log(`markdown=${PROMPT_GENERATION_FRAMEWORK_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.source_prompt_packages.length !== EXPECTED_SOURCE_COUNT ||
  report.runtime_target_prompt_mappings.length !== 6 ||
  report.prompt_generation_candidates.length > 0 === false ||
  report.scene_prompt_generation_complete !== 'PASS' ||
  report.camera_prompt_generation_complete !== 'PASS' ||
  report.emotion_prompt_generation_complete !== 'PASS' ||
  report.style_prompt_generation_complete !== 'PASS' ||
  report.continuity_prompt_generation_complete !== 'PASS' ||
  report.negative_prompt_generation_complete !== 'PASS' ||
  report.runtime_target_mapping_complete !== 'PASS' ||
  report.prompt_generation_framework_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_prompt_ready === 'PASS') === false
) {
  console.error(
    'Expected prompt packages for all sources with six templates mapped from runtime bindings and planning_only PASS'
  );
  process.exit(1);
}

process.exit(0);
