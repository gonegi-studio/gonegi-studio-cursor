import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OBJECT_IDENTITY_STRATEGY_PASS_VERDICT,
  OBJECT_IDENTITY_STRATEGY_REPORT_PATH,
  OBJECT_IDENTITY_STRATEGY_STATUS,
  OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
  writeObjectIdentityStrategyReport,
} from '../services/objectIdentityStrategy.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeObjectIdentityStrategyReport(projectRoot);

const spec = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_REFERENCE_BANK_SPECIFICATION_PATH), 'utf8')
) as {
  reference_bank_defined: boolean;
  reference_bank_entries: Array<{
    object_id: string;
    identity_level: string;
    variation_tolerance: number;
  }>;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `object_identity_strategy_defined=${report.object_identity_strategy_defined}`,
    `reference_bank_defined=${report.reference_bank_defined}`,
    `anchor_format_defined=${report.anchor_format_defined}`,
    `memory_format_defined=${report.memory_format_defined}`,
    `traceability_format_defined=${report.traceability_format_defined}`,
    `variation_tolerance_defined=${report.variation_tolerance_defined}`,
    `retrieval_strategy_defined=${report.retrieval_strategy_defined}`,
    `reference_bank_entry_count=${report.reference_bank_entry_count}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [OBJECT_REFERENCE_BANK_SPECIFICATION_PATH, OBJECT_IDENTITY_STRATEGY_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== OBJECT_IDENTITY_STRATEGY_PASS_VERDICT) {
  console.error('OBJECT IDENTITY STRATEGY VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== OBJECT_IDENTITY_STRATEGY_STATUS) {
  console.error(`STATUS FAIL: expected ${OBJECT_IDENTITY_STRATEGY_STATUS}`);
  process.exit(1);
}

if (
  !report.reference_bank_defined ||
  !report.anchor_format_defined ||
  !report.memory_format_defined ||
  !report.traceability_format_defined ||
  !report.variation_tolerance_defined ||
  !report.retrieval_strategy_defined ||
  !spec.reference_bank_defined ||
  spec.reference_bank_entries.length === 0
) {
  console.error('PASS CONDITION FAIL: strategy definition checks not met');
  process.exit(1);
}

const suitcase = spec.reference_bank_entries.find((entry) => entry.object_id === 'suitcase_001');
if (!suitcase || suitcase.identity_level !== 'strict' || suitcase.variation_tolerance !== 0.05) {
  console.error('SUITCASE EXAMPLE FAIL: suitcase_001 / strict / 0.05 required');
  process.exit(1);
}

const chair = spec.reference_bank_entries.find((entry) => entry.object_id === 'chair_014');
if (!chair || chair.identity_level !== 'loose' || chair.variation_tolerance !== 0.4) {
  console.error('CHAIR EXAMPLE FAIL: chair_014 / loose / 0.40 required');
  process.exit(1);
}

process.exit(0);
