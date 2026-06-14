import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APPROVED_ORIGINALS_DIR,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
} from '../services/approvedOriginalsLoader.js';
import { NATIVE_IMPORT_V7_OUTPUTS } from '../services/movieImageAppNativeImportBuilder.js';
import {
  APPROVED_ORIGINAL_AUDIT_PASS_VERDICT,
  APPROVED_ORIGINAL_AUDIT_REPORT_PATH,
  writeApprovedOriginalAuditReport,
} from '../services/approvedOriginalAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeApprovedOriginalAuditReport(projectRoot);
const { checks, metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `approved_original_locked=${report.approved_original_locked}`,
    `artstyle_original_restored=${report.artstyle_original_restored}`,
    `character_original_restored=${report.character_original_restored}`,
    `timesetting_locked=${report.timesetting_locked}`,
    `scenario_generation_only=${report.scenario_generation_only}`,
    `image_app_import_ready=${report.image_app_import_ready}`,
    `artstyle_original_match=${checks.artstyle_original_match}`,
    `character_original_match=${checks.character_original_match}`,
    `timesetting_original_match=${checks.timesetting_original_match}`,
    `extra_tokens=${checks.extra_tokens}`,
    `missing_tokens=${checks.missing_tokens}`,
    `rewritten_tokens=${checks.rewritten_tokens}`,
    `artstyle_match_rate=${metrics.artstyle_match_rate}`,
    `character_match_rate=${metrics.character_match_rate}`,
    `timesetting_match_rate=${metrics.timesetting_match_rate}`,
    `artstyle_char_delta=${metrics.artstyle_char_delta}`,
    `character_char_delta=${metrics.character_char_delta}`,
    `timesetting_char_delta=${metrics.timesetting_char_delta}`,
    `char_delta=${metrics.char_delta}`,
    `line_delta=${metrics.line_delta}`,
    `token_delta=${metrics.token_delta}`,
    `slots_audited=${metrics.slots_audited}`,
    `export_files_audited=${metrics.export_files_audited}`,
  ].join(' | ')
);

for (const rel of [
  APPROVED_ORIGINAL_AUDIT_REPORT_PATH,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  ...NATIVE_IMPORT_V7_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, APPROVED_ORIGINALS_DIR))) {
  console.error(`OUTPUT MISSING: ${APPROVED_ORIGINALS_DIR}/`);
  process.exit(1);
}

if (report.final_verdict !== APPROVED_ORIGINAL_AUDIT_PASS_VERDICT) {
  console.error('REAL SOURCE RECOVERY AUDIT FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
