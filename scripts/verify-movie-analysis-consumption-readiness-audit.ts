import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATION_BLUEPRINT_REGISTRY_PATH } from '../services/movieAnalysisGenerationBlueprintDesign.js';
import { FINAL_RUNTIME_BUNDLE_REGISTRY_PATH } from '../services/movieAnalysisFinalRuntimeBundleDesign.js';
import { MASTER_PACKAGE_REGISTRY_PATH } from '../services/movieAnalysisMasterPackageDesign.js';
import {
  CONSUMPTION_READINESS_AUDIT_MD_PATH,
  CONSUMPTION_READINESS_AUDIT_PASS_VERDICT,
  CONSUMPTION_READINESS_AUDIT_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisConsumptionReadinessAuditReport,
} from '../services/movieAnalysisConsumptionReadinessAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  MASTER_PACKAGE_REGISTRY_PATH,
  FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
  GENERATION_BLUEPRINT_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisConsumptionReadinessAuditReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} schema_consistency=${report.schema_consistency} id_traceability=${report.id_traceability} required_sections_present=${report.required_sections_present}`
);
console.log(
  `image_app_consumable=${report.image_app_consumable} video_app_consumable=${report.video_app_consumable} runtime_payload_blocked=${report.runtime_payload_blocked} generation_blocked=${report.generation_blocked} gpu_blocked=${report.gpu_blocked}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: image=${audit.image_app_consumable} video=${audit.video_app_consumable} trace=${audit.id_traceable} sections=${audit.required_sections_present} runtime_blocked=${audit.runtime_payload_blocked} gen_blocked=${audit.generation_blocked} gpu_blocked=${audit.gpu_blocked}`
  );
}
console.log(`report=${CONSUMPTION_READINESS_AUDIT_REPORT_PATH}`);
console.log(`markdown=${CONSUMPTION_READINESS_AUDIT_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CONSUMPTION_READINESS_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.schema_consistency !== true ||
  report.id_traceability !== true ||
  report.required_sections_present !== true ||
  report.image_app_consumable !== true ||
  report.video_app_consumable !== true ||
  report.runtime_payload_blocked !== true ||
  report.generation_blocked !== true ||
  report.gpu_blocked !== true
) {
  console.error(
    'Expected source_count=4 schema_consistency=true id_traceability=true required_sections_present=true image_app_consumable=true video_app_consumable=true runtime_payload_blocked=true generation_blocked=true gpu_blocked=true'
  );
  process.exit(1);
}

process.exit(0);
