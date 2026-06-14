import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GONEGI_GPU_PAYLOAD_REGISTRY_PATH } from '../services/gonegiMotionToGpuPayloadCompiler.js';
import { PROVIDER_REGISTRY_PATH } from '../services/videoRuntimeProviderRegistry.js';
import { VIDEO_RUNTIME_SCHEMA_PATH } from '../services/videoRuntimeInterfaceValidator.js';
import {
  PROVIDER_WIRING_REGISTRY_PATH,
} from '../services/gonegiGpuPayloadToRuntimeInterfaceCompiler.js';
import {
  RUNTIME_INTERFACE_COMPILER_MD_PATH,
  RUNTIME_INTERFACE_COMPILER_PASS_VERDICT,
  RUNTIME_INTERFACE_COMPILER_REPORT_PATH,
  writeGonegiRuntimeInterfaceReport,
} from '../services/gonegiRuntimeInterfaceValidator.js';
import {
  GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH,
  GONEGI_RUNTIME_INTERFACE_SCHEMA_PATH,
  writeGonegiRuntimeInterfaces,
} from '../services/gonegiGpuPayloadToRuntimeInterfaceCompiler.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  GONEGI_GPU_PAYLOAD_REGISTRY_PATH,
  VIDEO_RUNTIME_SCHEMA_PATH,
  PROVIDER_REGISTRY_PATH,
  PROVIDER_WIRING_REGISTRY_PATH,
  GONEGI_RUNTIME_INTERFACE_SCHEMA_PATH,
  GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const { interfaces, written } = writeGonegiRuntimeInterfaces(projectRoot);
const report = writeGonegiRuntimeInterfaceReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `runtime_interfaces=${report.runtime_interfaces} payload_links=${report.payload_links} provider_hints=${report.provider_hints} identity_locks=${report.identity_locks}`
);
console.log(
  `continuity=${report.continuity} execution_safety=${report.execution_safety} provider_activation=${report.provider_activation} registry=${report.registry}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
for (const iface of interfaces) {
  const validation = report.interface_validations.find(
    (v) => v.gonegi_runtime_interface_id === iface.gonegi_runtime_interface_id
  );
  console.log(
    `  ${iface.gonegi_runtime_interface_id} ← ${iface.source_gpu_payload_id}: ${validation?.status ?? 'FAIL'} target=${iface.runtime_target} provider=${iface.provider_hint.mapped_provider_id}`
  );
}
console.log(`written_interfaces=${written.join(', ')}`);
console.log(`report=${RUNTIME_INTERFACE_COMPILER_REPORT_PATH}`);
console.log(`markdown=${RUNTIME_INTERFACE_COMPILER_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== RUNTIME_INTERFACE_COMPILER_PASS_VERDICT) {
  process.exit(1);
}

if (report.runtime_interfaces !== 4) {
  console.error(`Expected runtime_interfaces=4, got ${report.runtime_interfaces}`);
  process.exit(1);
}

process.exit(0);
