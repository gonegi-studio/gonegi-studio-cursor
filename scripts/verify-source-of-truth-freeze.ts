import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_OF_TRUTH_ARTSTYLE_PATH,
  SOURCE_OF_TRUTH_CHARACTER_PROMPTS_PATH,
  SOURCE_OF_TRUTH_DIR,
  SOURCE_OF_TRUTH_MANIFEST_PATH,
  SOURCE_OF_TRUTH_TIMESETTING_PROMPTS_PATH,
} from '../services/sourceOfTruthLoader.js';
import { NATIVE_IMPORT_V6_OUTPUTS } from '../services/movieImageAppNativeImportBuilder.js';
import {
  SOURCE_OF_TRUTH_AUDIT_PASS_VERDICT,
  SOURCE_OF_TRUTH_AUDIT_REPORT_PATH,
  writeSourceOfTruthAuditReport,
} from '../services/sourceOfTruthAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSourceOfTruthAuditReport(projectRoot);
const { checks, metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `source_of_truth_created=${report.source_of_truth_created}`,
    `rewrite_eliminated=${report.rewrite_eliminated}`,
    `normalization_eliminated=${report.normalization_eliminated}`,
    `serializer_eliminated=${report.serializer_eliminated}`,
    `approved_source_locked=${report.approved_source_locked}`,
    `image_app_import_ready=${report.image_app_import_ready}`,
    `source_truth_vs_exports_artstyle_match=${checks.source_truth_vs_exports_artstyle_match}`,
    `source_truth_vs_exports_character_match=${checks.source_truth_vs_exports_character_match}`,
    `source_truth_vs_exports_timesetting_match=${checks.source_truth_vs_exports_timesetting_match}`,
    `extra_tokens=${checks.extra_tokens}`,
    `missing_tokens=${checks.missing_tokens}`,
    `rewritten_tokens=${checks.rewritten_tokens}`,
    `artstyle_char_delta=${metrics.artstyle_char_delta}`,
    `character_char_delta=${metrics.character_char_delta}`,
    `timesetting_char_delta=${metrics.timesetting_char_delta}`,
    `rewritten_token_count=${metrics.rewritten_token_count}`,
    `missing_token_count=${metrics.missing_token_count}`,
    `extra_token_count=${metrics.extra_token_count}`,
    `slots_audited=${metrics.slots_audited}`,
    `export_files_audited=${metrics.export_files_audited}`,
  ].join(' | ')
);

for (const rel of [
  SOURCE_OF_TRUTH_AUDIT_REPORT_PATH,
  SOURCE_OF_TRUTH_MANIFEST_PATH,
  SOURCE_OF_TRUTH_ARTSTYLE_PATH,
  SOURCE_OF_TRUTH_CHARACTER_PROMPTS_PATH,
  SOURCE_OF_TRUTH_TIMESETTING_PROMPTS_PATH,
  ...NATIVE_IMPORT_V6_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, SOURCE_OF_TRUTH_DIR))) {
  console.error(`OUTPUT MISSING: ${SOURCE_OF_TRUTH_DIR}/`);
  process.exit(1);
}

if (report.final_verdict !== SOURCE_OF_TRUTH_AUDIT_PASS_VERDICT) {
  console.error('SOURCE OF TRUTH AUDIT FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
