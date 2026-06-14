import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINAL_SET_PATH } from '../services/sourceVideoFinalSetBuilder.js';
import { GONEGI_RUNTIME_JOB_REGISTRY_PATH } from '../services/gonegiRuntimeStubExecutor.js';
import {
  PIPELINE_AUDIT_MD_PATH,
  PIPELINE_AUDIT_PASS_VERDICT,
  PIPELINE_AUDIT_REPORT_PATH,
  PIPELINE_TRACE_MAP_PATH,
  writeSourceVideoToGonegiPipelineAuditReport,
} from '../services/sourceVideoToGonegiPipelineValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [FINAL_SET_PATH, GONEGI_RUNTIME_JOB_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const report = writeSourceVideoToGonegiPipelineAuditReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `chains=${report.chains} runtime_jobs=${report.runtime_job_count} missing_links=${report.missing_links.length} orphan_records=${report.orphan_records.length}`
);
console.log(
  `identity=${report.identity_status} continuity=${report.continuity_status} traceability=${report.traceability_status} execution_safety=${report.execution_safety_status}`
);
console.log(
  `design_only=${report.design_only} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed}`
);

for (const trace of report.chain_traces) {
  console.log(
    `  ${trace.chain_id}: ${trace.source_video_id} → ${trace.runtime_job_id} [${trace.link_status}]`
  );
}

console.log(`report=${PIPELINE_AUDIT_REPORT_PATH}`);
console.log(`trace_map=${PIPELINE_TRACE_MAP_PATH}`);
console.log(`markdown=${PIPELINE_AUDIT_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PIPELINE_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.chains !== 4 ||
  report.runtime_job_count !== 4 ||
  report.missing_links.length !== 0 ||
  report.orphan_records.length !== 0
) {
  console.error(
    `Expected chains=4 runtime_jobs=4 missing_links=0 orphan_records=0, got chains=${report.chains} runtime_jobs=${report.runtime_job_count} missing_links=${report.missing_links.length} orphan_records=${report.orphan_records.length}`
  );
  process.exit(1);
}

process.exit(0);
