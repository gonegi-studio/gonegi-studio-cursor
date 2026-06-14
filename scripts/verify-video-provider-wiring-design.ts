import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREFLIGHT_REPORT_PATH } from '../services/localGpuRuntimePreflight.js';
import {
  buildSeedWiringDesigns,
  WIRING_REGISTRY_PATH,
  WIRING_SCHEMA_PATH,
  writeWiringDesigns,
} from '../services/videoProviderWiringDesigner.js';
import {
  WIRING_MD_PATH,
  WIRING_PASS_VERDICT,
  WIRING_REPORT_PATH,
  writeProviderWiringDesignReport,
} from '../services/videoProviderWiringValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [WIRING_SCHEMA_PATH, WIRING_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required wiring asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, PREFLIGHT_REPORT_PATH))) {
  console.error('Missing upstream GPU preflight report. Run npm run verify:gpu-preflight first.');
  process.exit(1);
}

const { designs } = buildSeedWiringDesigns(projectRoot);
const written = writeWiringDesigns(projectRoot, designs);
const report = writeProviderWiringDesignReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `wiring_count=${report.provider_wiring_count} machine_readiness=${report.machine_readiness} local_status=${report.local_provider_status} remote_status=${report.remote_provider_status} activation_safety=${report.activation_safety_status}`
);
for (const design of designs) {
  console.log(
    `  ${design.wiring_id}: provider=${design.provider_id} execution=${design.execution_status} activation=${design.activation_status}`
  );
}
console.log(`recommended_path=${report.recommended_future_path}`);
console.log(`gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed}`);
console.log(`written=${written.join(', ')}`);
console.log(`report=${WIRING_REPORT_PATH}`);
console.log(`markdown=${WIRING_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, WIRING_REPORT_PATH))) {
  console.error('Provider wiring design report missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, WIRING_MD_PATH))) {
  console.error('Provider wiring design markdown missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== WIRING_PASS_VERDICT) {
  process.exit(1);
}

if (report.provider_wiring_count !== 5) {
  console.error(`Expected 5 wiring designs, got ${report.provider_wiring_count}`);
  process.exit(1);
}

if (report.machine_readiness === 'NOT_READY') {
  const localDesigns = designs.filter((d) => d.runtime_target === 'local');
  const allBlocked = localDesigns.every((d) => d.execution_status === 'blocked_for_execution');
  if (!allBlocked) {
    console.error('Local providers must be blocked_for_execution on NOT_READY machine');
    process.exit(1);
  }
}

process.exit(0);
