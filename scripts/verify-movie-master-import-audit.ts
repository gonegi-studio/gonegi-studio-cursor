import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MASTER_IMPORT_V4_PATH,
  MOVIE_MASTER_IMPORT_AUDIT_PASS_VERDICT,
  MOVIE_MASTER_IMPORT_AUDIT_REPORT_PATH,
  writeMovieMasterImportAuditReport,
} from '../services/movieMasterImportAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieMasterImportAuditReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `master_import_audited=${report.master_import_audited}`,
    `production_import_locked=${report.production_import_locked}`,
    `audited_slot_count=${metrics.audited_slot_count}`,
    `artStyle_score=${metrics.artStyle_score}`,
    `timeSetting_score=${metrics.timeSetting_score}`,
    `character_score=${metrics.character_score}`,
    `scenario_score=${metrics.scenario_score}`,
    `overall_import_score=${metrics.overall_import_score}`,
  ].join(' | ')
);

if (!fs.existsSync(path.join(projectRoot, MASTER_IMPORT_V4_PATH))) {
  console.error(`OUTPUT MISSING: ${MASTER_IMPORT_V4_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, MOVIE_MASTER_IMPORT_AUDIT_REPORT_PATH))) {
  console.error(`OUTPUT MISSING: ${MOVIE_MASTER_IMPORT_AUDIT_REPORT_PATH}`);
  process.exit(1);
}

if (report.final_verdict !== MOVIE_MASTER_IMPORT_AUDIT_PASS_VERDICT) {
  console.error('MOVIE MASTER IMPORT AUDIT FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
