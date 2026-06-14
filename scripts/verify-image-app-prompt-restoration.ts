import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_ARTSTYLE_PROMPT_PATH,
  CANONICAL_CHARACTER_PROMPTS_V2_PATH,
  CANONICAL_TIMESETTING_PROMPTS_PATH,
  GENERATION_PROMPT_DIR,
  GENERATION_PROMPT_MANIFEST_PATH,
} from '../services/imageAppPromptLoader.js';
import {
  IMAGE_APP_PROMPT_PASS_VERDICT,
  IMAGE_APP_PROMPT_REPORT_PATH,
  NATIVE_IMPORT_V5_OUTPUTS,
  writeImageAppPromptReport,
} from '../services/imageAppPromptValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeImageAppPromptReport(projectRoot);
const { checks, metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `image_app_prompt_library_created=${report.image_app_prompt_library_created}`,
    `artstyle_prompt_restored=${report.artstyle_prompt_restored}`,
    `character_prompt_restored=${report.character_prompt_restored}`,
    `timesetting_prompt_restored=${report.timesetting_prompt_restored}`,
    `database_format_removed=${report.database_format_removed}`,
    `image_app_ready=${report.image_app_ready}`,
    `artstyle_exact_prompt_match=${checks.artstyle_exact_prompt_match}`,
    `character_exact_prompt_match=${checks.character_exact_prompt_match}`,
    `timesetting_exact_prompt_match=${checks.timesetting_exact_prompt_match}`,
    `prompt_library_loaded=${checks.prompt_library_loaded}`,
    `database_record_leak=${checks.database_record_leak}`,
    `metadata_leak=${checks.metadata_leak}`,
    `artstyle_id_only=${checks.artstyle_id_only}`,
    `exact_prompt_present=${checks.exact_prompt_present}`,
    `plain_prompt_only=${checks.plain_prompt_only}`,
    `plain_prompt_format=${checks.plain_prompt_format}`,
    `artstyle_prompt_count=${metrics.artstyle_prompt_count}`,
    `character_prompt_count=${metrics.character_prompt_count}`,
    `timesetting_prompt_count=${metrics.timesetting_prompt_count}`,
    `v5_slot_samples_checked=${metrics.v5_slot_samples_checked}`,
  ].join(' | ')
);

for (const rel of [
  IMAGE_APP_PROMPT_REPORT_PATH,
  GENERATION_PROMPT_MANIFEST_PATH,
  CANONICAL_ARTSTYLE_PROMPT_PATH,
  CANONICAL_CHARACTER_PROMPTS_V2_PATH,
  CANONICAL_TIMESETTING_PROMPTS_PATH,
  ...NATIVE_IMPORT_V5_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, GENERATION_PROMPT_DIR))) {
  console.error(`OUTPUT MISSING: ${GENERATION_PROMPT_DIR}/`);
  process.exit(1);
}

if (report.final_verdict !== IMAGE_APP_PROMPT_PASS_VERDICT) {
  console.error('IMAGE APP PROMPT RESTORATION VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
