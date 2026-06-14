import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONDITIONING_ADAPTER_COMPATIBILITY_MATRIX_PATH,
  CONDITIONING_ADAPTER_ROADMAP_PATH,
  CONDITIONING_BACKEND_ADAPTER_DATASET_DIR,
  CONDITIONING_BACKEND_ADAPTER_PASS_VERDICT,
  CONDITIONING_BACKEND_ADAPTER_REGISTRY_PATH,
  CONDITIONING_BACKEND_ADAPTER_REPORT_PATH,
  CONDITIONING_BACKEND_ADAPTER_STATUS,
  writeConditioningBackendAdapterReport,
} from '../services/conditioningBackendAdapterDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeConditioningBackendAdapterReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `backend_adapters_designed=${report.backend_adapters_designed}`,
    `adapter_translation_validated=${report.adapter_translation_validated}`,
    `backend_implemented=${report.backend_implemented}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `controlnet_adapter_defined=${report.controlnet_adapter_defined}`,
    `comfyui_adapter_defined=${report.comfyui_adapter_defined}`,
    `future_video_adapter_defined=${report.future_video_adapter_defined}`,
    `contract_version_supported=${report.contract_version_supported}`,
    `translation_rules_defined=${report.translation_rules_defined}`,
    `lossy_translation_risk_defined=${report.lossy_translation_risk_defined}`,
    `adapter_count=${report.adapters.length}`,
  ].join(' | ')
);

for (const rel of [
  CONDITIONING_BACKEND_ADAPTER_DATASET_DIR,
  CONDITIONING_BACKEND_ADAPTER_REGISTRY_PATH,
  CONDITIONING_BACKEND_ADAPTER_REPORT_PATH,
  CONDITIONING_ADAPTER_COMPATIBILITY_MATRIX_PATH,
  CONDITIONING_ADAPTER_ROADMAP_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== CONDITIONING_BACKEND_ADAPTER_PASS_VERDICT) {
  console.error('CONDITIONING BACKEND ADAPTER DESIGN VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== CONDITIONING_BACKEND_ADAPTER_STATUS) {
  console.error(`STATUS FAIL: expected ${CONDITIONING_BACKEND_ADAPTER_STATUS}`);
  process.exit(1);
}

if (
  !report.controlnet_adapter_defined ||
  !report.comfyui_adapter_defined ||
  !report.future_video_adapter_defined ||
  !report.contract_version_supported ||
  !report.translation_rules_defined ||
  !report.lossy_translation_risk_defined
) {
  console.error('PASS CONDITION FAIL: adapter design checks not met');
  process.exit(1);
}

process.exit(0);
