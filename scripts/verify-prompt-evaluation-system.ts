import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGenerationQaAndErrorContext } from '../services/generationQaAndErrorContextSystem.js';
import {
  GENERATION_OPERATION_STACK_READ_ONLY_PATHS,
  PROMPT_EVALUATION_PASS_VERDICT,
  PROMPT_EVALUATION_READY_STATUS,
  PROMPT_EVALUATION_REPORT_PATH,
  writePromptEvaluationSystem,
} from '../services/promptEvaluationSystem.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

writeGenerationQaAndErrorContext(projectRoot);

const before = Object.fromEntries(
  GENERATION_OPERATION_STACK_READ_ONLY_PATHS.filter((p) =>
    fs.existsSync(path.join(projectRoot, p))
  ).map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writePromptEvaluationSystem(projectRoot);

for (const readOnlyPath of GENERATION_OPERATION_STACK_READ_ONLY_PATHS) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(
      `POLICY VIOLATION: Generation operation stack artifact modified: ${readOnlyPath}`
    );
    process.exit(1);
  }
}

const summary = report.evaluation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `prompt_quality_integrity=${summary.prompt_quality_integrity}`,
    `prompt_scorecard_integrity=${summary.prompt_scorecard_integrity}`,
    `prompt_risk_integrity=${summary.prompt_risk_integrity}`,
    `prompt_improvement_integrity=${summary.prompt_improvement_integrity}`,
    `prompt_traceability_integrity=${summary.prompt_traceability_integrity}`,
    `prompt_generation_readiness=${summary.prompt_generation_readiness}`,
    `prompt_compiler_compatibility=${summary.prompt_compiler_compatibility}`,
    `generation_qa_compatibility=${summary.generation_qa_compatibility}`,
    `generation_readiness_score=${summary.generation_readiness_score}`,
    `generation_operation_stack_mutation=0`,
    `prompt_evaluation_ready=${report.prompt_evaluation_ready}`,
  ].join(' ')
);
console.log(`report=${PROMPT_EVALUATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['prompt_quality_integrity=PASS', summary.prompt_quality_integrity === 'PASS'],
  ['prompt_scorecard_integrity=PASS', summary.prompt_scorecard_integrity === 'PASS'],
  ['prompt_risk_integrity=PASS', summary.prompt_risk_integrity === 'PASS'],
  ['prompt_improvement_integrity=PASS', summary.prompt_improvement_integrity === 'PASS'],
  ['prompt_traceability_integrity=PASS', summary.prompt_traceability_integrity === 'PASS'],
  ['prompt_generation_readiness=PASS', summary.prompt_generation_readiness === 'PASS'],
  ['prompt_compiler_compatibility=PASS', summary.prompt_compiler_compatibility === 'PASS'],
  ['generation_qa_compatibility=PASS', summary.generation_qa_compatibility === 'PASS'],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== PROMPT_EVALUATION_PASS_VERDICT) process.exit(1);
if (report.status !== PROMPT_EVALUATION_READY_STATUS) process.exit(1);
