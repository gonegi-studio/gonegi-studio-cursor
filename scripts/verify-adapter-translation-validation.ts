import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADAPTER_TRANSLATION_GAP_REPORT_PATH,
  ADAPTER_TRANSLATION_VALIDATION_PASS_VERDICT,
  ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH,
  ADAPTER_TRANSLATION_VALIDATION_STATUS,
  writeAdapterTranslationValidationReport,
} from '../services/adapterTranslationValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeAdapterTranslationValidationReport(projectRoot);

const gapReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ADAPTER_TRANSLATION_GAP_REPORT_PATH), 'utf8')
) as {
  highest_risk_fields: string[];
  critical_loss_fields: string[];
  recommended_adapter: string;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `adapter_translation_validated=${report.adapter_translation_validated}`,
    `translation_loss_documented=${report.translation_loss_documented}`,
    `identity_preservation_defined=${report.identity_preservation_defined}`,
    `environment_preservation_defined=${report.environment_preservation_defined}`,
    `temporal_preservation_defined=${report.temporal_preservation_defined}`,
    `highest_risk_fields_defined=${report.highest_risk_fields_defined}`,
    `critical_loss_fields_defined=${report.critical_loss_fields_defined}`,
    `adapter_count=${report.adapters.length}`,
    `recommended_adapter=${gapReport.recommended_adapter}`,
  ].join(' | ')
);

for (const entry of report.adapters) {
  console.log(
    [
      `adapter=${entry.adapter_name}`,
      `contract_field_coverage=${entry.contract_field_coverage}`,
      `loss_severity=${entry.loss_severity}`,
      `identity_preservation_score=${entry.identity_preservation_score}`,
      `environment_preservation_score=${entry.environment_preservation_score}`,
      `temporal_preservation_score=${entry.temporal_preservation_score}`,
    ].join(' | ')
  );
}

for (const rel of [ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH, ADAPTER_TRANSLATION_GAP_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== ADAPTER_TRANSLATION_VALIDATION_PASS_VERDICT) {
  console.error('ADAPTER TRANSLATION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== ADAPTER_TRANSLATION_VALIDATION_STATUS) {
  console.error(`STATUS FAIL: expected ${ADAPTER_TRANSLATION_VALIDATION_STATUS}`);
  process.exit(1);
}

const coveragePass = report.adapters.every(
  (entry) => entry.contract_field_coverage >= report.contract_field_coverage_threshold
);

if (
  !coveragePass ||
  !report.translation_loss_documented ||
  !report.identity_preservation_defined ||
  !report.environment_preservation_defined ||
  !report.temporal_preservation_defined ||
  !report.highest_risk_fields_defined ||
  !report.critical_loss_fields_defined ||
  gapReport.highest_risk_fields.length === 0 ||
  gapReport.critical_loss_fields.length === 0
) {
  console.error('PASS CONDITION FAIL: validation thresholds not met');
  process.exit(1);
}

process.exit(0);
