import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  executeSeedStubJobs,
  RUNTIME_JOB_REGISTRY_PATH,
  RUNTIME_JOB_SCHEMA_PATH,
  STUB_EXECUTION_PASS_VERDICT,
  STUB_EXECUTION_REPORT_PATH,
  writeRuntimeJobs,
  writeStubExecutionReport,
} from '../services/videoRuntimeStubExecutor.js';
import { VIDEO_RUNTIME_REPORT_PATH } from '../services/videoRuntimeInterfaceValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [RUNTIME_JOB_SCHEMA_PATH, RUNTIME_JOB_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required runtime job asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_RUNTIME_REPORT_PATH))) {
  console.error(
    'Missing upstream video runtime interface report. Run npm run verify:video-runtime-interface first.'
  );
  process.exit(1);
}

const jobs = executeSeedStubJobs(projectRoot);
const written = writeRuntimeJobs(projectRoot, jobs);
const report = writeStubExecutionReport(projectRoot, jobs);

console.log(report.final_verdict);
console.log(
  `jobs=${report.job_count} completed=${report.completed_jobs} failed=${report.failed_jobs} identity_lock=${report.identity_lock_result} continuity_lock=${report.continuity_lock_result} runtime_safety=${report.runtime_safety_result}`
);
for (const job of jobs) {
  console.log(
    `  ${job.job_id}: ${job.job_state} completion=${job.completion_status} identity=${job.identity_lock_status} continuity=${job.continuity_lock_status}`
  );
}
console.log(`gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed}`);
console.log(`written=${written.join(', ')}`);
console.log(`report=${STUB_EXECUTION_REPORT_PATH}`);

if (!fs.existsSync(path.join(projectRoot, STUB_EXECUTION_REPORT_PATH))) {
  console.error('Video runtime stub execution report missing.');
  process.exit(1);
}

if (report.final_verdict !== STUB_EXECUTION_PASS_VERDICT) {
  process.exit(1);
}

if (report.job_count !== 3 || report.completed_jobs !== 3 || report.failed_jobs !== 0) {
  console.error(
    `Expected jobs=3 completed=3 failed=0, got jobs=${report.job_count} completed=${report.completed_jobs} failed=${report.failed_jobs}`
  );
  process.exit(1);
}

process.exit(0);
