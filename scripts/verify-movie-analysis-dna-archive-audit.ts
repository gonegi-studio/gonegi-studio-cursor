import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_ARCHIVE_AUDIT_MD_PATH,
  DNA_ARCHIVE_AUDIT_PASS_VERDICT,
  DNA_ARCHIVE_AUDIT_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaArchiveAuditReport,
} from '../services/movieAnalysisDnaArchiveAudit.js';
import {
  DNA_ARCHIVE_MANIFEST_PATH,
  DNA_ARCHIVE_PATH,
  DNA_ARCHIVE_REPORT_PATH,
} from '../services/movieAnalysisDnaArchive.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [DNA_ARCHIVE_PATH, DNA_ARCHIVE_MANIFEST_PATH, DNA_ARCHIVE_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisDnaArchiveAuditReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} source_count_valid=${report.source_count_valid} adapter_count_valid=${report.adapter_count_valid} archive_immutability=${report.archive_immutability} traceability_chain=${report.traceability_chain} certification_chain=${report.certification_chain} release_version_frozen=${report.release_version_frozen} archive_audit_ready=${report.archive_audit_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: trace=${audit.traceability_chain} certification=${audit.certification_chain} source_ready=${audit.source_audit_ready}`
  );
}
console.log(`report=${DNA_ARCHIVE_AUDIT_REPORT_PATH}`);
console.log(`markdown=${DNA_ARCHIVE_AUDIT_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_ARCHIVE_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.source_count_valid !== 'PASS' ||
  report.adapter_count_valid !== 'PASS' ||
  report.archive_immutability !== 'PASS' ||
  report.traceability_chain !== 'PASS' ||
  report.certification_chain !== 'PASS' ||
  report.release_version_frozen !== 'PASS' ||
  report.archive_audit_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 adapter_count=24 source_count_valid=PASS adapter_count_valid=PASS archive_immutability=PASS traceability_chain=PASS certification_chain=PASS release_version_frozen=PASS archive_audit_ready=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
