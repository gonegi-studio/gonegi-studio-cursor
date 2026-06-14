import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
  CONDITIONING_MAP_EXPORT_CONTRACT_PATH,
  CONDITIONING_MAP_EXPORT_DATASET_DIR,
  CONDITIONING_MAP_EXPORT_PASS_VERDICT,
  CONDITIONING_MAP_EXPORT_REPORT_PATH,
  CONDITIONING_MAP_EXPORT_STATUS,
  writeConditioningMapExportReport,
} from '../services/conditioningMapExport.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeConditioningMapExportReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `contract_version=${report.contract_version}`,
    `adapter_required=${report.adapter_required}`,
    `estimated_backend_count=${report.estimated_backend_count}`,
    `conditioning_contract_defined=${report.conditioning_contract_defined}`,
    `backend_independent_format_defined=${report.backend_independent_format_defined}`,
    `layout_map_exportable=${report.layout_map_exportable}`,
    `depth_map_exportable=${report.depth_map_exportable}`,
    `pose_map_exportable=${report.pose_map_exportable}`,
    `blocking_map_exportable=${report.blocking_map_exportable}`,
    `environment_identity_map_reserved=${report.environment_identity_map_reserved}`,
    `export_coverage_ratio=${report.export_coverage_ratio}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  CONDITIONING_MAP_EXPORT_DATASET_DIR,
  CONDITIONING_MAP_EXPORT_CONTRACT_PATH,
  CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
  CONDITIONING_MAP_EXPORT_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== CONDITIONING_MAP_EXPORT_PASS_VERDICT) {
  console.error('CONDITIONING MAP EXPORT VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== CONDITIONING_MAP_EXPORT_STATUS) {
  console.error(`STATUS FAIL: expected ${CONDITIONING_MAP_EXPORT_STATUS}`);
  process.exit(1);
}

if (
  report.contract_version !== '1.0' ||
  !report.adapter_required ||
  report.estimated_backend_count !== 3 ||
  !report.conditioning_contract_defined ||
  !report.backend_independent_format_defined ||
  !report.layout_map_exportable ||
  !report.depth_map_exportable ||
  !report.pose_map_exportable ||
  !report.blocking_map_exportable ||
  !report.environment_identity_map_reserved ||
  report.export_coverage_ratio !== 1
) {
  console.error('PASS CONDITION FAIL: report field checks not met');
  process.exit(1);
}

process.exit(0);
