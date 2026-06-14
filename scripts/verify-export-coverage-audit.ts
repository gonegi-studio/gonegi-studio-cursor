import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CURSOR_DATASET_INVENTORY_PATH,
  EXPORT_COVERAGE_AUDIT_REPORT_PATH,
  EXPORT_COVERAGE_MATRIX_PATH,
  EXPORT_COVERAGE_PASS_VERDICT,
  EXPORT_COVERAGE_READY_STATUS,
  GENERATION_METADATA_CONTRACT_PATH,
  GENERATION_METADATA_VERIFICATION_RULES_PATH,
  MISSING_EXPORT_COVERAGE_REPORT_PATH,
  writeExportCoverageAudit,
} from '../services/exportCoverageAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeExportCoverageAudit(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `cursor_dataset_system_count=${summary.cursor_dataset_system_count}`,
    `exported_dataset_system_count=${summary.exported_dataset_system_count}`,
    `export_coverage_ratio=${summary.export_coverage_ratio}`,
    `critical_export_coverage_ratio=${summary.critical_export_coverage_ratio}`,
    `critical_dataset_missing_count=${summary.critical_dataset_missing_count}`,
    `generation_metadata_contract_exists=${summary.generation_metadata_contract_exists}`,
    `export_patches_applied=${summary.export_patches_applied}`,
    `coverage_passed=${report.coverage_passed}`,
    `next_order=${summary.next_order}`,
  ].join(' ')
);
console.log(`report=${EXPORT_COVERAGE_AUDIT_REPORT_PATH}`);
console.log(`inventory=${CURSOR_DATASET_INVENTORY_PATH}`);
console.log(`matrix=${EXPORT_COVERAGE_MATRIX_PATH}`);
console.log(`missing=${MISSING_EXPORT_COVERAGE_REPORT_PATH}`);
console.log(`metadata_contract=${GENERATION_METADATA_CONTRACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const metadataContract = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GENERATION_METADATA_CONTRACT_PATH), 'utf8')
) as {
  dataset_usage: Record<string, { loaded?: boolean; consumed?: boolean; influence_score?: number }>;
};

const sample = Object.values(metadataContract.dataset_usage)[0];

const checks: [string, boolean][] = [
  ['cursor_dataset_system_count>0', Number(summary.cursor_dataset_system_count) > 0],
  ['exported_dataset_system_count>0', Number(summary.exported_dataset_system_count) > 0],
  ['export_coverage_ratio>=0.95', Number(summary.export_coverage_ratio) >= 0.95],
  ['critical_export_coverage_ratio=1.0', Number(summary.critical_export_coverage_ratio) === 1],
  ['critical_dataset_missing_count=0', Number(summary.critical_dataset_missing_count) === 0],
  ['generation_metadata_contract_exists', fs.existsSync(path.join(projectRoot, GENERATION_METADATA_CONTRACT_PATH))],
  ['metadata_verification_rules_exists', fs.existsSync(path.join(projectRoot, GENERATION_METADATA_VERIFICATION_RULES_PATH))],
  ['metadata_contract_has_loaded', sample?.loaded !== undefined],
  ['metadata_contract_has_consumed', sample?.consumed !== undefined],
  ['metadata_contract_has_influence_score', typeof sample?.influence_score === 'number'],
  ['inventory_exists', fs.existsSync(path.join(projectRoot, CURSOR_DATASET_INVENTORY_PATH))],
  ['matrix_exists', fs.existsSync(path.join(projectRoot, EXPORT_COVERAGE_MATRIX_PATH))],
  ['missing_report_exists', fs.existsSync(path.join(projectRoot, MISSING_EXPORT_COVERAGE_REPORT_PATH))],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== EXPORT_COVERAGE_PASS_VERDICT) process.exit(1);
if (report.status !== EXPORT_COVERAGE_READY_STATUS) process.exit(1);
