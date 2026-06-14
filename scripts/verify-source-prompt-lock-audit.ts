import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_PROMPT_DIR,
  GENERATION_PROMPT_MANIFEST_PATH,
} from '../services/imageAppPromptLoader.js';
import {
  IMAGE_APP_NATIVE_IMPORT_OUTPUTS,
  NATIVE_IMPORT_V5_OUTPUTS,
} from '../services/movieImageAppNativeImportBuilder.js';
import {
  SOURCE_PROMPT_LOCK_AUDIT_PASS_VERDICT,
  SOURCE_PROMPT_LOCK_AUDIT_REPORT_PATH,
  writeSourcePromptLockAuditReport,
} from '../services/sourcePromptLockAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSourcePromptLockAuditReport(projectRoot);
const { checks, metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `prompt_copy_verified=${report.prompt_copy_verified}`,
    `rewrite_detected=${report.rewrite_detected}`,
    `serializer_detected=${report.serializer_detected}`,
    `token_drift_detected=${report.token_drift_detected}`,
    `artstyle_exact_match=${checks.artstyle_exact_match}`,
    `character_exact_match=${checks.character_exact_match}`,
    `timesetting_exact_match=${checks.timesetting_exact_match}`,
    `extra_tokens=${checks.extra_tokens}`,
    `missing_tokens=${checks.missing_tokens}`,
    `rewritten_tokens=${checks.rewritten_tokens}`,
    `serializer_generated_tokens=${checks.serializer_generated_tokens}`,
    `slots_audited=${metrics.slots_audited}`,
    `export_files_audited=${metrics.export_files_audited}`,
    `artstyle_mismatch_count=${metrics.artstyle_mismatch_count}`,
    `character_mismatch_count=${metrics.character_mismatch_count}`,
    `timesetting_mismatch_count=${metrics.timesetting_mismatch_count}`,
    `extra_token_count=${metrics.extra_token_count}`,
    `missing_token_count=${metrics.missing_token_count}`,
    `rewritten_token_count=${metrics.rewritten_token_count}`,
    `serializer_token_count=${metrics.serializer_token_count}`,
    `max_artstyle_char_delta=${metrics.max_artstyle_char_delta}`,
    `max_character_char_delta=${metrics.max_character_char_delta}`,
    `max_timesetting_char_delta=${metrics.max_timesetting_char_delta}`,
  ].join(' | ')
);

for (const rel of [
  SOURCE_PROMPT_LOCK_AUDIT_REPORT_PATH,
  GENERATION_PROMPT_MANIFEST_PATH,
  ...NATIVE_IMPORT_V5_OUTPUTS.map((spec) => spec.output_path),
  ...IMAGE_APP_NATIVE_IMPORT_OUTPUTS.map((spec) => spec.output_path),
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

if (report.final_verdict !== SOURCE_PROMPT_LOCK_AUDIT_PASS_VERDICT) {
  console.error('SOURCE PROMPT LOCK AUDIT FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
