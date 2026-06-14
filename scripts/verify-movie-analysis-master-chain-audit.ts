import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MASTER_PACKAGE_REGISTRY_PATH } from '../services/movieAnalysisMasterPackageDesign.js';
import {
  MASTER_PACKAGE_PASS_VERDICT,
  MASTER_PACKAGE_REPORT_PATH,
} from '../services/movieAnalysisMasterPackageValidator.js';
import {
  EXPECTED_SOURCE_COUNT,
  MASTER_CHAIN_AUDIT_MD_PATH,
  MASTER_CHAIN_AUDIT_PASS_VERDICT,
  MASTER_CHAIN_AUDIT_REPORT_PATH,
  writeMovieAnalysisMasterChainAuditReport,
} from '../services/movieAnalysisMasterChainAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [MASTER_PACKAGE_REGISTRY_PATH, MASTER_PACKAGE_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const masterPackageReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MASTER_PACKAGE_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (masterPackageReport.final_verdict !== MASTER_PACKAGE_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${MASTER_PACKAGE_REPORT_PATH} must have ${MASTER_PACKAGE_PASS_VERDICT}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisMasterChainAuditReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} master_package_count=${report.master_package_count} phase_trace_complete=${report.phase_trace_complete} phases_022_to_039_present=${report.phases_022_to_039_present} package_trace=${report.package_trace}`
);
console.log(
  `all_verify_scripts_exist=${report.all_verify_scripts_exist} all_reports_exist=${report.all_reports_exist} all_safety_flags_preserved=${report.all_safety_flags_preserved}`
);
console.log(
  `no_runtime_execution=${report.no_runtime_execution} no_video_generation=${report.no_video_generation} no_image_generation=${report.no_image_generation} no_gpu_execution=${report.no_gpu_execution} no_external_call=${report.no_external_call}`
);
for (const audit of report.master_package_audits) {
  console.log(
    `  ${audit.master_package_id}: trace=${audit.package_trace_count}/${audit.package_trace_expected} phase_trace=${audit.phase_trace_complete} safety=${audit.safety_flags_preserved}`
  );
}
console.log(`report=${MASTER_CHAIN_AUDIT_REPORT_PATH}`);
console.log(`markdown=${MASTER_CHAIN_AUDIT_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MASTER_CHAIN_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.master_package_count !== EXPECTED_SOURCE_COUNT ||
  report.phase_trace_complete !== true ||
  report.phases_022_to_039_present !== true ||
  report.package_trace !== '17/17' ||
  report.all_verify_scripts_exist !== true ||
  report.all_reports_exist !== true ||
  report.all_safety_flags_preserved !== true ||
  report.no_runtime_execution !== true ||
  report.no_video_generation !== true ||
  report.no_image_generation !== true ||
  report.no_gpu_execution !== true ||
  report.no_external_call !== true
) {
  console.error(
    'Expected source_count=4 master_package_count=4 phase_trace_complete=true phases_022_to_039_present=true package_trace=17/17 all_verify_scripts_exist=true all_reports_exist=true all_safety_flags_preserved=true'
  );
  process.exit(1);
}

process.exit(0);
