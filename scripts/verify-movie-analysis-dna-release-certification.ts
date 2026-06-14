import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_RELEASE_CERTIFICATION_MD_PATH,
  DNA_RELEASE_CERTIFICATION_PASS_VERDICT,
  DNA_RELEASE_CERTIFICATION_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  RELEASE_CERTIFICATION_STATUS_MESSAGE,
  writeMovieAnalysisDnaReleaseCertificationReport,
} from '../services/movieAnalysisDnaReleaseCertification.js';
import {
  DNA_RELEASE_MANIFEST_PATH,
  DNA_RELEASE_PACKAGE_PATH,
  DNA_RELEASE_REPORT_PATH,
} from '../services/movieAnalysisDnaReleasePackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  DNA_RELEASE_PACKAGE_PATH,
  DNA_RELEASE_MANIFEST_PATH,
  DNA_RELEASE_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisDnaReleaseCertificationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} release_package_valid=${report.release_package_valid} manifest_valid=${report.manifest_valid} report_valid=${report.report_valid} source_count_valid=${report.source_count_valid} adapter_count_valid=${report.adapter_count_valid} traceability=${report.traceability} certification_chain=${report.certification_chain} image_mapping=${report.image_mapping} video_mapping=${report.video_mapping} release_integrity=${report.release_integrity} release_certification_ready=${report.release_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: trace=${audit.traceability_certified} chain=${audit.certification_chain_certified} image=${audit.image_mapping_certified} video=${audit.video_mapping_certified} integrity=${audit.release_integrity_certified} source_certified=${audit.source_certified}`
  );
}
if (report.certification_status_message) {
  console.log(report.certification_status_message);
}
console.log(`report=${DNA_RELEASE_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${DNA_RELEASE_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_RELEASE_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.release_package_valid !== 'PASS' ||
  report.manifest_valid !== 'PASS' ||
  report.report_valid !== 'PASS' ||
  report.source_count_valid !== 'PASS' ||
  report.adapter_count_valid !== 'PASS' ||
  report.traceability !== 'PASS' ||
  report.certification_chain !== 'PASS' ||
  report.image_mapping !== 'PASS' ||
  report.video_mapping !== 'PASS' ||
  report.release_integrity !== 'PASS' ||
  report.release_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.certification_status_message !== RELEASE_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    'Expected source_count=4 adapter_count=24 release_package_valid=PASS manifest_valid=PASS report_valid=PASS traceability=PASS certification_chain=PASS image_mapping=PASS video_mapping=PASS release_integrity=PASS release_certification_ready=PASS planning_only=PASS DNA Release Package Production Ready'
  );
  process.exit(1);
}

process.exit(0);
