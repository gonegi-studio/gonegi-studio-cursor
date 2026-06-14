import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT,
  LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
  LEVEL2_COMPLETE_FINAL_STATUS,
} from '../services/movieAnalysisLevel2CompletenessAudit.js';
import {
  LEVEL2_COMPLETE_FINAL_PLUS_STATUS,
  LEVEL2_ROBUSTNESS_AUDIT_COUNT,
  LEVEL2_ROBUSTNESS_AUDIT_DIR,
  LEVEL2_ROBUSTNESS_AUDIT_EXPORT_DIR,
  LEVEL2_ROBUSTNESS_AUDIT_MANIFEST_PATH,
  LEVEL2_ROBUSTNESS_AUDIT_MD_PATH,
  LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT,
  LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
  writeMovieAnalysisLevel2RobustnessAudit,
} from '../services/movieAnalysisLevel2RobustnessAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const completenessPath = path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH);
if (!fs.existsSync(completenessPath)) {
  console.error(`PRECHECK FAIL: Missing required upstream asset: ${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH}`);
  process.exit(1);
}

const completenessReport = JSON.parse(fs.readFileSync(completenessPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (completenessReport.final_verdict !== LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH} must be ${LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT}`
  );
  process.exit(1);
}

if (completenessReport.certification_status !== LEVEL2_COMPLETE_FINAL_STATUS) {
  console.error(`PRECHECK FAIL: completeness audit status must be ${LEVEL2_COMPLETE_FINAL_STATUS}`);
  process.exit(1);
}

const report = writeMovieAnalysisLevel2RobustnessAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} finding_count=${report.finding_count} level3_entry_ready=${report.level3_entry_ready} level2_robustness_audit_ready=${report.level2_robustness_audit_ready}`
);
for (const audit of report.robustness_audits) {
  console.log(`  ${audit.audit_id}: has_finding=${audit.has_finding} category=${audit.audit_category}`);
}
for (const finding of report.findings) {
  console.log(`  finding: ${finding}`);
}
console.log(`report=${LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH}`);
console.log(`markdown=${LEVEL2_ROBUSTNESS_AUDIT_MD_PATH}`);
console.log(`manifest=${LEVEL2_ROBUSTNESS_AUDIT_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT) {
  console.error(`Expected verdict ${LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT}`);
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_ROBUSTNESS_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_ROBUSTNESS_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_ROBUSTNESS_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, LEVEL2_ROBUSTNESS_AUDIT_EXPORT_DIR, 'level2-robustness-audit.json')
  ) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2_robustness_audit_count !== LEVEL2_ROBUSTNESS_AUDIT_COUNT ||
  report.finding_count !== 0 ||
  report.findings.length !== 0 ||
  report.level3_entry_ready !== true ||
  report.level2_robustness_audit_ready !== 'PASS' ||
  report.certification_status !== LEVEL2_COMPLETE_FINAL_PLUS_STATUS ||
  report.robustness_audits.length !== LEVEL2_ROBUSTNESS_AUDIT_COUNT ||
  report.robustness_audits.filter((audit) => audit.has_finding).length !== 0
) {
  console.error(
    'Expected CASE A: PASS with finding_count=0, LEVEL2_COMPLETE_FINAL_PLUS, and all seven red-team audits clear'
  );
  process.exit(1);
}

process.exit(0);
