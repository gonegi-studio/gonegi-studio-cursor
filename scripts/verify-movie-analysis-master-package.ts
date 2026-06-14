import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FINAL_RUNTIME_BUNDLE_PASS_VERDICT,
  FINAL_RUNTIME_BUNDLE_REPORT_PATH,
} from '../services/movieAnalysisFinalRuntimeBundleValidator.js';
import {
  FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
} from '../services/movieAnalysisFinalRuntimeBundleDesign.js';
import {
  MASTER_PACKAGE_MD_PATH,
  MASTER_PACKAGE_PASS_VERDICT,
  MASTER_PACKAGE_REPORT_PATH,
  writeMovieAnalysisMasterPackageReport,
} from '../services/movieAnalysisMasterPackageValidator.js';
import {
  MASTER_PACKAGE_REGISTRY_PATH,
  MASTER_PACKAGE_SCHEMA_PATH,
  TRACE_DEFINITIONS,
  writeMovieAnalysisMasterPackagePlans,
} from '../services/movieAnalysisMasterPackageDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
  FINAL_RUNTIME_BUNDLE_REPORT_PATH,
  MASTER_PACKAGE_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const finalRuntimeBundleReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, FINAL_RUNTIME_BUNDLE_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (finalRuntimeBundleReport.final_verdict !== FINAL_RUNTIME_BUNDLE_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${FINAL_RUNTIME_BUNDLE_REPORT_PATH} must have ${FINAL_RUNTIME_BUNDLE_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisMasterPackagePlans(projectRoot);
const report = writeMovieAnalysisMasterPackageReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `master_package_plans=${report.master_package_plans} final_runtime_bundle_links=${report.final_runtime_bundle_links} source_links=${report.source_links} package_trace=${report.package_trace} master_package_only=${report.master_package_only}`
);
console.log(
  `planning_only=${report.planning_only} runtime_execution=${report.runtime_execution} video_generation=${report.video_generation} image_generation=${report.image_generation} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.master_package_id === plan.master_package_id
  );
  console.log(
    `  ${plan.master_package_id} ← ${plan.final_runtime_bundle_id}: ${validation?.status ?? 'FAIL'} trace=${plan.package_trace.length}/${TRACE_DEFINITIONS.length} chain_complete=${plan.readiness_summary.chain_complete}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${MASTER_PACKAGE_REGISTRY_PATH}`);
console.log(`report=${MASTER_PACKAGE_REPORT_PATH}`);
console.log(`markdown=${MASTER_PACKAGE_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MASTER_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.master_package_plans !== 4 ||
  report.final_runtime_bundle_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.package_trace !== 'PASS' ||
  report.master_package_only !== 'PASS'
) {
  console.error(
    `Expected master_package_plans=4 final_runtime_bundle_links=PASS source_links=PASS package_trace=PASS master_package_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
