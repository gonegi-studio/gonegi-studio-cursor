import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GPU_PAYLOAD_REPORT_PATH } from '../services/gpuRenderPayloadValidator.js';
import {
  buildSeedVideoRuntimeInterfaces,
  VIDEO_RUNTIME_REGISTRY_PATH,
  writeVideoRuntimeInterfaces,
} from '../services/videoRuntimeInterfaceBuilder.js';
import {
  VIDEO_RUNTIME_PASS_VERDICT,
  VIDEO_RUNTIME_REPORT_PATH,
  VIDEO_RUNTIME_SCHEMA_PATH,
  writeVideoRuntimeInterfaceDesignReport,
} from '../services/videoRuntimeInterfaceValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [VIDEO_RUNTIME_SCHEMA_PATH, VIDEO_RUNTIME_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required video runtime asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, GPU_PAYLOAD_REPORT_PATH))) {
  console.error(
    'Missing upstream GPU payload report. Run npm run verify:gpu-payload first.'
  );
  process.exit(1);
}

const interfaces = buildSeedVideoRuntimeInterfaces(projectRoot);
const written = writeVideoRuntimeInterfaces(projectRoot, interfaces);
const report = writeVideoRuntimeInterfaceDesignReport(projectRoot, interfaces);

console.log(report.final_verdict);
console.log(
  `interfaces=${report.interface_count} payload_link=${report.payload_link_status} local_adapter=${report.local_adapter_status} remote_adapter=${report.remote_adapter_status} handshake=${report.handshake_status} execution_safety=${report.execution_safety_status}`
);
for (const validation of report.interface_validations) {
  const iface = interfaces.find((i) => i.runtime_interface_id === validation.runtime_interface_id);
  const payload = iface?.source_gpu_payload_id ?? 'unknown';
  console.log(
    `  ${validation.runtime_interface_id}: ${validation.valid ? 'PASS' : 'FAIL'} (gpu_payload=${payload} target=${iface?.runtime_target ?? 'unknown'})`
  );
}
console.log(`gpu_execution=${report.gpu_execution} design_only=${report.design_only}`);
console.log(`written=${written.join(', ')}`);
console.log(`report=${VIDEO_RUNTIME_REPORT_PATH}`);

if (!fs.existsSync(path.join(projectRoot, VIDEO_RUNTIME_REPORT_PATH))) {
  console.error('Video runtime interface design report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_RUNTIME_PASS_VERDICT) {
  process.exit(1);
}

if (report.interface_count !== 3) {
  console.error(`Expected interface_count=3, got ${report.interface_count}`);
  process.exit(1);
}

process.exit(0);
