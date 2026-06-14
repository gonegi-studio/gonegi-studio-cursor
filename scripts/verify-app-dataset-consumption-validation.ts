import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATION_METADATA_CONTRACT_PATH } from '../services/exportCoverageAudit.js';
import {
  APP_CONSUMPTION_AUDIT_PATH,
  APP_CONSUMPTION_AUDIT_REPORT_PATH,
  APP_CONSUMPTION_PASS_VERDICT,
  APP_CONSUMPTION_READY_STATUS,
  writeAppDatasetConsumptionValidation,
} from '../services/appDatasetConsumptionValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeAppDatasetConsumptionValidation(projectRoot);
const summary = report.validation_summary;
const chain = report.validation_chain;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `cursor_dataset_system_count=${summary.cursor_dataset_system_count}`,
    `consumed_dataset_system_count=${summary.consumed_dataset_system_count}`,
    `evidence_verified_system_count=${summary.evidence_verified_system_count}`,
    `critical_consumption_ratio=${summary.critical_consumption_ratio}`,
    `critical_influence_ratio=${summary.critical_influence_ratio}`,
    `effective_consumption_score=${summary.effective_consumption_score}`,
    `character_identity_preservation=${summary.character_identity_preservation}`,
    `chain_exported=${chain.exported}`,
    `chain_consumed=${chain.consumed}`,
    `chain_evidence=${chain.evidence_verified}`,
    `chain_influence=${chain.influenced_output}`,
    `chain_preservation=${chain.output_preservation_verified}`,
    `consumption_passed=${report.consumption_passed}`,
  ].join(' ')
);
console.log(`report=${APP_CONSUMPTION_AUDIT_REPORT_PATH}`);
console.log(`audit=${APP_CONSUMPTION_AUDIT_PATH}`);
console.log(`metadata_contract=${GENERATION_METADATA_CONTRACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(path.join(projectRoot, APP_CONSUMPTION_AUDIT_PATH), 'utf8')) as {
  metrics: Record<string, number>;
  gate_results: Record<string, string>;
};

const metadata = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GENERATION_METADATA_CONTRACT_PATH), 'utf8')
) as {
  dataset_usage: Record<string, {
    loaded: boolean;
    consumed: boolean;
    evidence?: Record<string, unknown>;
    influence_score: number;
  }>;
};

const sample = Object.values(metadata.dataset_usage)[0];

const checks: [string, boolean][] = [
  ['cursor_dataset_system_count>0', Number(summary.cursor_dataset_system_count) > 0],
  ['consumed_dataset_system_count>0', Number(summary.consumed_dataset_system_count) > 0],
  ['evidence_verified_system_count>0', Number(summary.evidence_verified_system_count) > 0],
  ['critical_dataset_missing_count=0', Number(summary.critical_dataset_missing_count) === 0],
  ['critical_consumption_ratio=1', Number(summary.critical_consumption_ratio) === 1],
  ['critical_influence_ratio>=0.90', Number(summary.critical_influence_ratio) >= 0.9],
  ['character_identity_preservation>=0.90', Number(summary.character_identity_preservation) >= 0.9],
  ['location_identity_preservation>=0.90', Number(summary.location_identity_preservation) >= 0.9],
  ['lighting_identity_preservation>=0.90', Number(summary.lighting_identity_preservation) >= 0.9],
  ['gate_coverage=PASS', audit.gate_results.coverage === 'PASS'],
  ['gate_consumption=PASS', audit.gate_results.consumption === 'PASS'],
  ['gate_evidence=PASS', audit.gate_results.evidence === 'PASS'],
  ['gate_influence=PASS', audit.gate_results.influence === 'PASS'],
  ['gate_preservation=PASS', audit.gate_results.preservation === 'PASS'],
  ['metadata_has_evidence', Boolean(sample?.evidence)],
  ['metadata_has_loaded', sample?.loaded === true],
  ['metadata_has_consumed', sample?.consumed === true],
  ['metadata_has_influence_score', typeof sample?.influence_score === 'number'],
  ['chain_all_pass', Object.values(chain).every((v) => v === 'PASS')],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== APP_CONSUMPTION_PASS_VERDICT) process.exit(1);
if (report.status !== APP_CONSUMPTION_READY_STATUS) process.exit(1);
