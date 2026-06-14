import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APPROVED_ORIGINALS_DIR,
  APPROVED_ORIGINALS_MANIFEST_PATH,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
} from '../services/approvedOriginalsLoader.js';
import { NATIVE_IMPORT_V8_OUTPUTS } from '../services/movieImageAppNativeImportBuilder.js';
import {
  FINAL_SOURCE_LOCK_PASS_VERDICT,
  FINAL_SOURCE_LOCK_REPORT_PATH,
  writeFinalSourceLockAuditReport,
} from '../services/finalSourceLockAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeFinalSourceLockAuditReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `approved_originals_locked=${report.approved_originals_locked}`,
    `artstyle_copy_only=${report.artstyle_copy_only}`,
    `character_copy_only=${report.character_copy_only}`,
    `timesetting_copy_only=${report.timesetting_copy_only}`,
    `scenario_generation_only=${report.scenario_generation_only}`,
    `image_app_export_v8_ready=${report.image_app_export_v8_ready}`,
    `approved_original_files=${metrics.approved_original_files}`,
    `builder_count=${metrics.builder_count}`,
    `copy_operations=${metrics.copy_operations}`,
    `generation_operations=${metrics.generation_operations}`,
    `legacy_reference_count=${metrics.legacy_reference_count}`,
    `char_delta=${metrics.char_delta}`,
    `token_delta=${metrics.token_delta}`,
    `slots_audited=${metrics.slots_audited}`,
  ].join(' | ')
);

for (const rel of [
  FINAL_SOURCE_LOCK_REPORT_PATH,
  APPROVED_ORIGINALS_MANIFEST_PATH,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
  ...NATIVE_IMPORT_V8_OUTPUTS.map((spec) => spec.output_path),
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

if (report.final_verdict !== FINAL_SOURCE_LOCK_PASS_VERDICT) {
  console.error('FINAL SOURCE LOCK AUDIT FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
