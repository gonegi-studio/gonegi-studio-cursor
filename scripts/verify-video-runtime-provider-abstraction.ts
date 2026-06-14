import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVIDER_REGISTRY_PATH, PROVIDER_SCHEMA_PATH } from '../services/videoRuntimeProviderRegistry.js';
import {
  PROVIDER_PASS_VERDICT,
  PROVIDER_REPORT_PATH,
  writeProviderAbstractionReport,
} from '../services/videoRuntimeProviderValidator.js';
import { STUB_EXECUTION_REPORT_PATH } from '../services/videoRuntimeStubExecutor.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [PROVIDER_SCHEMA_PATH, PROVIDER_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required provider asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, STUB_EXECUTION_REPORT_PATH))) {
  console.error(
    'Missing upstream stub execution report. Run npm run verify:video-runtime-stub first.'
  );
  process.exit(1);
}

const report = writeProviderAbstractionReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `providers=${report.provider_count} safety=${report.safety_status} selection=${report.selection_status}`
);
for (const providerId of report.registered_providers) {
  const validation = report.provider_validations.find((v) => v.provider_id === providerId);
  console.log(`  ${providerId}: ${validation?.valid ? 'registered not_wired' : 'FAIL'}`);
}
for (const selection of report.recommended_provider_per_payload) {
  console.log(
    `  ${selection.gpu_payload_id} → ${selection.recommended_provider_id} (${selection.recommended_provider_type})`
  );
}
console.log(`gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed}`);
console.log(`report=${PROVIDER_REPORT_PATH}`);

if (!fs.existsSync(path.join(projectRoot, PROVIDER_REPORT_PATH))) {
  console.error('Video runtime provider abstraction report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PROVIDER_PASS_VERDICT) {
  process.exit(1);
}

if (report.provider_count < 5) {
  console.error(`Expected at least 5 providers, got ${report.provider_count}`);
  process.exit(1);
}

process.exit(0);
