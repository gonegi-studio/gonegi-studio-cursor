import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH } from '../services/gonegiGpuPayloadToRuntimeInterfaceCompiler.js';
import { PROVIDER_REGISTRY_PATH } from '../services/videoRuntimeProviderRegistry.js';
import { PROVIDER_WIRING_REGISTRY_PATH } from '../services/gonegiGpuPayloadToRuntimeInterfaceCompiler.js';
import {
  STUB_EXECUTION_MD_PATH,
  STUB_EXECUTION_PASS_VERDICT,
  STUB_EXECUTION_REPORT_PATH,
  writeGonegiRuntimeStubExecutionReport,
} from '../services/gonegiRuntimeJobValidator.js';
import {
  GONEGI_RUNTIME_JOB_REGISTRY_PATH,
  GONEGI_RUNTIME_JOB_SCHEMA_PATH,
  writeGonegiRuntimeJobs,
} from '../services/gonegiRuntimeStubExecutor.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH,
  PROVIDER_REGISTRY_PATH,
  PROVIDER_WIRING_REGISTRY_PATH,
  GONEGI_RUNTIME_JOB_SCHEMA_PATH,
  GONEGI_RUNTIME_JOB_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const { jobs, written } = writeGonegiRuntimeJobs(projectRoot);
const report = writeGonegiRuntimeStubExecutionReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `jobs=${report.jobs} completed=${report.completed} failed=${report.failed} identity_locks=${report.identity_locks} continuity=${report.continuity}`
);
console.log(
  `provider_safety=${report.provider_safety} provider_activation=${report.provider_activation} registry=${report.registry}`
);
console.log(
  `design_only=${report.design_only} gpu_execution=${report.gpu_execution} simulation_only=${report.simulation_only}`
);
for (const job of jobs) {
  const validation = report.job_validations.find(
    (v) => v.gonegi_runtime_job_id === job.gonegi_runtime_job_id
  );
  const steps = job.validation_steps.length;
  console.log(
    `  ${job.gonegi_runtime_job_id} ← ${job.runtime_interface_id}: ${validation?.status ?? 'FAIL'} state=${job.job_state} steps=${steps} provider=${job.provider_id}`
  );
}
console.log(`written_jobs=${written.join(', ')}`);
console.log(`report=${STUB_EXECUTION_REPORT_PATH}`);
console.log(`markdown=${STUB_EXECUTION_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== STUB_EXECUTION_PASS_VERDICT) {
  process.exit(1);
}

if (report.jobs !== 4 || report.completed !== 4 || report.failed !== 0) {
  console.error(`Expected jobs=4 completed=4 failed=0, got jobs=${report.jobs} completed=${report.completed} failed=${report.failed}`);
  process.exit(1);
}

process.exit(0);
