import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DIALOGUE_STACK_READ_ONLY_PATHS,
  REAL_PRODUCTION_TEST_PREP_PASS_VERDICT,
  REAL_PRODUCTION_TEST_PREP_REPORT_PATH,
  REAL_PRODUCTION_TEST_READY_STATUS,
  writeRealProductionTestPreparation,
} from '../services/realProductionTestPreparation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const before = Object.fromEntries(
  DIALOGUE_STACK_READ_ONLY_PATHS.filter((p) =>
    fs.existsSync(path.join(projectRoot, p))
  ).map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeRealProductionTestPreparation(projectRoot);

for (const readOnlyPath of DIALOGUE_STACK_READ_ONLY_PATHS) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Prior stack artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const summary = report.preparation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `memory_identity_integrity=${summary.memory_identity_integrity}`,
    `prompt_failure_recovery_integrity=${summary.prompt_failure_recovery_integrity}`,
    `traceability_failure_recovery_integrity=${summary.traceability_failure_recovery_integrity}`,
    `prompt_evaluation_readiness=${summary.prompt_evaluation_readiness}`,
    `generation_qa_readiness=${summary.generation_qa_readiness}`,
    `gpu_readiness=${summary.gpu_readiness}`,
    `overall_generation_score=${summary.overall_generation_score}`,
    `identity_dimension_count=${summary.identity_dimension_count}`,
    `checklist_item_count=${summary.checklist_item_count}`,
    `dialogue_stack_mutation=0`,
    `real_production_test_ready=${report.real_production_test_ready}`,
  ].join(' ')
);
console.log(`report=${REAL_PRODUCTION_TEST_PREP_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['memory_identity_integrity=PASS', summary.memory_identity_integrity === 'PASS'],
  ['prompt_failure_recovery_integrity=PASS', summary.prompt_failure_recovery_integrity === 'PASS'],
  [
    'traceability_failure_recovery_integrity=PASS',
    summary.traceability_failure_recovery_integrity === 'PASS',
  ],
  ['prompt_evaluation_readiness=PASS', summary.prompt_evaluation_readiness === 'PASS'],
  ['generation_qa_readiness=PASS', summary.generation_qa_readiness === 'PASS'],
  ['gpu_readiness=PASS', summary.gpu_readiness === 'PASS'],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== REAL_PRODUCTION_TEST_PREP_PASS_VERDICT) process.exit(1);
if (report.status !== REAL_PRODUCTION_TEST_READY_STATUS) process.exit(1);
