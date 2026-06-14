import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATION_BLUEPRINT_REGISTRY_PATH } from '../services/movieAnalysisGenerationBlueprintDesign.js';
import { FINAL_RUNTIME_BUNDLE_REGISTRY_PATH } from '../services/movieAnalysisFinalRuntimeBundleDesign.js';
import { MASTER_PACKAGE_REGISTRY_PATH } from '../services/movieAnalysisMasterPackageDesign.js';
import {
  CONSUMPTION_READINESS_AUDIT_PASS_VERDICT,
  CONSUMPTION_READINESS_AUDIT_REPORT_PATH,
} from '../services/movieAnalysisConsumptionReadinessAudit.js';
import {
  EXPECTED_SOURCE_COUNT,
  EXPORT_MANIFEST_PATH,
  EXPORT_PACKAGE_PASS_VERDICT,
  EXPORT_PACKAGE_PATH,
  EXPORT_REPORT_PATH,
  writeMovieAnalysisExportPackage,
} from '../services/movieAnalysisExportPackage.js';

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
  CONSUMPTION_READINESS_AUDIT_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const consumptionAudit = JSON.parse(
  fs.readFileSync(path.join(projectRoot, CONSUMPTION_READINESS_AUDIT_REPORT_PATH), 'utf8')
) as { final_verdict?: string };
if (consumptionAudit.final_verdict !== CONSUMPTION_READINESS_AUDIT_PASS_VERDICT) {
  console.error(
    `${CONSUMPTION_READINESS_AUDIT_REPORT_PATH} must have ${CONSUMPTION_READINESS_AUDIT_PASS_VERDICT}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisExportPackage(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} full_trace_preserved=${report.full_trace_preserved} image_app_ready=${report.image_app_ready} video_app_ready=${report.video_app_ready} all_safety_flags_preserved=${report.all_safety_flags_preserved}`
);
console.log(`package=${EXPORT_PACKAGE_PATH}`);
console.log(`manifest=${EXPORT_MANIFEST_PATH}`);
console.log(`report=${EXPORT_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== EXPORT_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.full_trace_preserved !== true ||
  report.image_app_ready !== true ||
  report.video_app_ready !== true ||
  report.all_safety_flags_preserved !== true
) {
  console.error(
    'Expected source_count=4 full_trace_preserved=true image_app_ready=true video_app_ready=true all_safety_flags_preserved=true'
  );
  process.exit(1);
}

process.exit(0);
