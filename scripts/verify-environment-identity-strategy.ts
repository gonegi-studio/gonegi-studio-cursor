import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENVIRONMENT_IDENTITY_STRATEGY_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_STRATEGY_REPORT_PATH,
  ENVIRONMENT_IDENTITY_STRATEGY_STATUS,
  ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
  writeEnvironmentIdentityStrategyReport,
} from '../services/environmentIdentityStrategy.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeEnvironmentIdentityStrategyReport(projectRoot);

const spec = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH), 'utf8')
) as {
  reference_bank_defined: boolean;
  reference_bank_entries: Array<{ environment_id: string; reference_bank_id: string }>;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `environment_identity_strategy_defined=${report.environment_identity_strategy_defined}`,
    `reference_bank_defined=${report.reference_bank_defined}`,
    `anchor_format_defined=${report.anchor_format_defined}`,
    `memory_format_defined=${report.memory_format_defined}`,
    `traceability_format_defined=${report.traceability_format_defined}`,
    `retrieval_strategy_defined=${report.retrieval_strategy_defined}`,
    `reference_bank_entry_count=${report.reference_bank_entry_count}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH, ENVIRONMENT_IDENTITY_STRATEGY_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== ENVIRONMENT_IDENTITY_STRATEGY_PASS_VERDICT) {
  console.error('ENVIRONMENT IDENTITY STRATEGY VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== ENVIRONMENT_IDENTITY_STRATEGY_STATUS) {
  console.error(`STATUS FAIL: expected ${ENVIRONMENT_IDENTITY_STRATEGY_STATUS}`);
  process.exit(1);
}

if (
  !report.reference_bank_defined ||
  !report.anchor_format_defined ||
  !report.memory_format_defined ||
  !report.traceability_format_defined ||
  !report.retrieval_strategy_defined ||
  !spec.reference_bank_defined ||
  spec.reference_bank_entries.length === 0
) {
  console.error('PASS CONDITION FAIL: strategy definition checks not met');
  process.exit(1);
}

const titanic = spec.reference_bank_entries.find(
  (entry) => entry.environment_id === 'titanic_staircase_001'
);
if (!titanic || titanic.reference_bank_id !== 'env_ref_001') {
  console.error('TITANIC REFERENCE FAIL: titanic_staircase_001 / env_ref_001 required');
  process.exit(1);
}

process.exit(0);
