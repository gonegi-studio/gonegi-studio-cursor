import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_RUNTIME_PACKAGE_PASS_VERDICT,
  IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
} from '../services/movieAnalysisImageRuntimePackage.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  RUNTIME_INTEGRATION_CERTIFICATION_MD_PATH,
  RUNTIME_INTEGRATION_CERTIFICATION_PASS_VERDICT,
  RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH,
  RUNTIME_INTEGRATION_CERTIFICATION_STATUS_MESSAGE,
  writeMovieAnalysisRuntimeIntegrationCertification,
} from '../services/movieAnalysisRuntimeIntegrationCertification.js';
import {
  VIDEO_RUNTIME_PACKAGE_PASS_VERDICT,
  VIDEO_RUNTIME_PACKAGE_REPORT_PATH,
} from '../services/movieAnalysisVideoRuntimePackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const precheckPaths = [IMAGE_RUNTIME_PACKAGE_REPORT_PATH, VIDEO_RUNTIME_PACKAGE_REPORT_PATH];

for (const precheckPath of precheckPaths) {
  const abs = path.join(projectRoot, precheckPath);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${precheckPath}`);
    process.exit(1);
  }
}

const imageRuntimeReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_REPORT_PATH), 'utf8')
) as { final_verdict: string };
if (imageRuntimeReport.final_verdict !== IMAGE_RUNTIME_PACKAGE_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2-006 ${IMAGE_RUNTIME_PACKAGE_REPORT_PATH} must be ${IMAGE_RUNTIME_PACKAGE_PASS_VERDICT}`
  );
  process.exit(1);
}

const videoRuntimeReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_REPORT_PATH), 'utf8')
) as { final_verdict: string };
if (videoRuntimeReport.final_verdict !== VIDEO_RUNTIME_PACKAGE_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2-007 ${VIDEO_RUNTIME_PACKAGE_REPORT_PATH} must be ${VIDEO_RUNTIME_PACKAGE_PASS_VERDICT}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisRuntimeIntegrationCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} image_runtime_package_ready=${report.image_runtime_package_ready} video_runtime_package_ready=${report.video_runtime_package_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} cross_runtime_consistency=${report.cross_runtime_consistency} runtime_integration_certification_ready=${report.runtime_integration_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: mappings=${audit.shared_runtime_mappings} trace=${audit.shared_traceability} consistent=${audit.cross_runtime_consistent} ready=${audit.source_integration_ready}`
  );
}
console.log(`report=${RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${RUNTIME_INTEGRATION_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== RUNTIME_INTEGRATION_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH)) ||
  report.certification_status !== RUNTIME_INTEGRATION_CERTIFICATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_runtime_package_ready !== 'PASS' ||
  report.video_runtime_package_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.cross_runtime_consistency !== 'PASS' ||
  report.runtime_integration_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_integration_ready === 'PASS') === false
) {
  console.error('Expected runtime integration certification for all sources with cross-runtime consistency');
  process.exit(1);
}

process.exit(0);
