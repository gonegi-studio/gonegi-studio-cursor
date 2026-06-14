import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_OUTPUT_LOCK_PASS_VERDICT,
  GENERATION_OUTPUT_RULES_PATH,
  OUTPUT_LOCATION_AUDIT_REPORT_PATH,
  writeOutputLocationAuditReport,
} from '../services/outputLocationAudit.js';
import {
  IMAGE_APP_TEST_PACK_OUTPUTS,
  MOVIE_SPATIAL_ACTIVE_DIR,
  MOVIE_SPATIAL_ARCHIVE_DIR,
  MOVIE_SPATIAL_CONTROLLED_DIRS,
  MOVIE_SPATIAL_MANUAL_DIR,
  MOVIE_SPATIAL_TEST_DIR,
  NATIVE_IMPORT_V8_ACTIVE_OUTPUTS,
} from '../services/generationOutputPaths.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeOutputLocationAuditReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `output_root_locked=${report.output_root_locked}`,
    `single_output_location_enforced=${report.single_output_location_enforced}`,
    `test_pack_created=${report.test_pack_created}`,
    `future_output_pollution_prevented=${report.future_output_pollution_prevented}`,
    `image_app_testing_ready=${report.image_app_testing_ready}`,
    `compliant_exports=${metrics.compliant_exports}`,
    `illegal_exports=${metrics.illegal_exports}`,
    `active_exports=${metrics.active_exports}`,
    `test_exports=${metrics.test_exports}`,
    `manual_exports=${metrics.manual_exports}`,
    `archive_exports=${metrics.archive_exports}`,
    `builder_violations=${metrics.builder_violations}`,
  ].join(' | ')
);

for (const rel of [
  GENERATION_OUTPUT_RULES_PATH,
  OUTPUT_LOCATION_AUDIT_REPORT_PATH,
  ...MOVIE_SPATIAL_CONTROLLED_DIRS.map((dir) => `${dir}/`),
  ...NATIVE_IMPORT_V8_ACTIVE_OUTPUTS.map((spec) => spec.output_path),
  ...IMAGE_APP_TEST_PACK_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== GENERATION_OUTPUT_LOCK_PASS_VERDICT) {
  console.error('GENERATION OUTPUT LOCK AUDIT FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
