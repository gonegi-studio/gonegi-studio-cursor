import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSeedGpuRenderPayloads,
  GPU_PAYLOAD_REGISTRY_PATH,
  writeGpuRenderPayloads,
} from '../services/gpuRenderPayloadBuilder.js';
import {
  GPU_PAYLOAD_PASS_VERDICT,
  GPU_PAYLOAD_REPORT_PATH,
  GPU_PAYLOAD_SCHEMA_PATH,
  writeGpuRenderPayloadPreparationReport,
} from '../services/gpuRenderPayloadValidator.js';
import { MOTION_PLAN_REPORT_PATH } from '../services/motionPlanValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [GPU_PAYLOAD_SCHEMA_PATH, GPU_PAYLOAD_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required GPU payload asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, MOTION_PLAN_REPORT_PATH))) {
  console.error('Missing upstream motion plan report. Run npm run verify:motion-plan first.');
  process.exit(1);
}

const payloads = buildSeedGpuRenderPayloads(projectRoot);
const written = writeGpuRenderPayloads(projectRoot, payloads);
const report = writeGpuRenderPayloadPreparationReport(projectRoot, payloads);

console.log(report.final_verdict);
console.log(
  `payloads=${report.payload_count} source_chain=${report.source_chain_status} identity_locks=${report.identity_lock_status} motion_alignment=${report.motion_alignment_status} execution_safety=${report.execution_safety_status}`
);
for (const validation of report.payload_validations) {
  const payload = payloads.find((p) => p.gpu_payload_id === validation.gpu_payload_id);
  console.log(
    `  ${validation.gpu_payload_id}: ${validation.valid ? 'PASS' : 'FAIL'} (keyframes=${payload?.keyframes.length ?? 0} segments=${payload?.motion_segments.length ?? 0})`
  );
}
console.log(`gpu_execution=${report.gpu_execution} preparation_only=${report.preparation_only}`);
console.log(`written=${written.join(', ')}`);
console.log(`report=${GPU_PAYLOAD_REPORT_PATH}`);

if (!fs.existsSync(path.join(projectRoot, GPU_PAYLOAD_REPORT_PATH))) {
  console.error('GPU render payload preparation report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== GPU_PAYLOAD_PASS_VERDICT) {
  process.exit(1);
}

if (report.payload_count !== 3) {
  console.error(`Expected payload_count=3, got ${report.payload_count}`);
  process.exit(1);
}

process.exit(0);
