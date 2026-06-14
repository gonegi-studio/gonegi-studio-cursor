import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_ARCHIVE_MANIFEST_PATH,
  DNA_ARCHIVE_PASS_VERDICT,
  DNA_ARCHIVE_PATH,
  DNA_ARCHIVE_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaArchive,
} from '../services/movieAnalysisDnaArchive.js';
import { DNA_RELEASE_CERTIFICATION_REPORT_PATH } from '../services/movieAnalysisDnaReleaseCertification.js';
import {
  DNA_RELEASE_MANIFEST_PATH,
  DNA_RELEASE_PACKAGE_PATH,
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
  DNA_RELEASE_CERTIFICATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisDnaArchive(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} all_source_ids_preserved=${report.all_source_ids_preserved} all_adapter_ids_preserved=${report.all_adapter_ids_preserved} all_traceability_preserved=${report.all_traceability_preserved} all_certifications_preserved=${report.all_certifications_preserved} release_version_frozen=${report.release_version_frozen} release_timestamp_frozen=${report.release_timestamp_frozen} archive_ready=${report.archive_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: source_ids=${audit.source_ids_preserved} adapter_ids=${audit.adapter_ids_preserved} trace=${audit.traceability_preserved} certifications=${audit.certifications_preserved} source_ready=${audit.source_archive_ready}`
  );
}
console.log(`archive=${DNA_ARCHIVE_PATH}`);
console.log(`manifest=${DNA_ARCHIVE_MANIFEST_PATH}`);
console.log(`report=${DNA_ARCHIVE_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_ARCHIVE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.all_source_ids_preserved !== 'PASS' ||
  report.all_adapter_ids_preserved !== 'PASS' ||
  report.all_traceability_preserved !== 'PASS' ||
  report.all_certifications_preserved !== 'PASS' ||
  report.release_version_frozen !== 'PASS' ||
  report.release_timestamp_frozen !== 'PASS' ||
  report.archive_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 adapter_count=24 all_source_ids_preserved=PASS all_adapter_ids_preserved=PASS all_traceability_preserved=PASS all_certifications_preserved=PASS release_version_frozen=PASS release_timestamp_frozen=PASS archive_ready=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
