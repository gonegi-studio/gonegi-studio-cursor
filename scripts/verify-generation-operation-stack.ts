import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_OPERATION_STACK_PASS_VERDICT,
  GENERATION_OPERATION_STACK_REPORT_PATH,
  GPU_CONNECTION_READY_STATUS,
  PRODUCTION_EXECUTION_READ_ONLY_PATHS,
  writeGenerationOperationStack,
} from '../services/generationOperationStack.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const before = Object.fromEntries(
  PRODUCTION_EXECUTION_READ_ONLY_PATHS.filter((p) =>
    fs.existsSync(path.join(projectRoot, p))
  ).map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeGenerationOperationStack(projectRoot);

for (const readOnlyPath of PRODUCTION_EXECUTION_READ_ONLY_PATHS) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Production execution artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const summary = report.module_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `prompt_compiler_integrity=${summary.prompt_compiler_integrity}`,
    `shot_to_prompt_integrity=${summary.shot_to_prompt_integrity}`,
    `prompt_traceability_integrity=${summary.prompt_traceability_integrity}`,
    `generation_trace_integrity=${summary.generation_trace_integrity}`,
    `asset_registry_integrity=${summary.asset_registry_integrity}`,
    `dataset_evolution_integrity=${summary.dataset_evolution_integrity}`,
    `evolution_integrity=${summary.evolution_integrity}`,
    `failure_pattern_integrity=${summary.failure_pattern_integrity}`,
    `success_pattern_integrity=${summary.success_pattern_integrity}`,
    `production_execution_mutation=0`,
    `gpu_connection_ready=${report.gpu_connection_ready}`,
  ].join(' ')
);
console.log(`report=${GENERATION_OPERATION_STACK_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['prompt_compiler_integrity=PASS', summary.prompt_compiler_integrity === 'PASS'],
  ['shot_to_prompt_integrity=PASS', summary.shot_to_prompt_integrity === 'PASS'],
  ['prompt_traceability_integrity=PASS', summary.prompt_traceability_integrity === 'PASS'],
  ['generation_trace_integrity=PASS', summary.generation_trace_integrity === 'PASS'],
  ['asset_registry_integrity=PASS', summary.asset_registry_integrity === 'PASS'],
  ['dataset_evolution_integrity=PASS', summary.dataset_evolution_integrity === 'PASS'],
  ['evolution_integrity=PASS', summary.evolution_integrity === 'PASS'],
  ['failure_pattern_integrity=PASS', summary.failure_pattern_integrity === 'PASS'],
  ['success_pattern_integrity=PASS', summary.success_pattern_integrity === 'PASS'],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== GENERATION_OPERATION_STACK_PASS_VERDICT) {
  console.error(`Expected verdict ${GENERATION_OPERATION_STACK_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== GPU_CONNECTION_READY_STATUS) {
  console.error(`Expected status ${GPU_CONNECTION_READY_STATUS}`);
  process.exit(1);
}
