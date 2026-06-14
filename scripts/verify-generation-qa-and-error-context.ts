import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_QA_PASS_VERDICT,
  GENERATION_QA_READY_STATUS,
  GENERATION_QA_REPORT_PATH,
  writeGenerationQaAndErrorContext,
} from '../services/generationQaAndErrorContextSystem.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeGenerationQaAndErrorContext(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `generation_qa_integrity=${report.qa_summary.generation_qa_integrity}`,
    `error_context_integrity=${report.qa_summary.error_context_integrity}`,
    `generation_qa_ready=${report.generation_qa_ready}`,
  ].join(' ')
);
console.log(`report=${GENERATION_QA_REPORT_PATH}`);

if (report.final_verdict !== GENERATION_QA_PASS_VERDICT) process.exit(1);
if (report.status !== GENERATION_QA_READY_STATUS) process.exit(1);
