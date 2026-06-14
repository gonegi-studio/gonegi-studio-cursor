import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DNA_ARCHIVE_AUDIT_REPORT_PATH } from '../services/movieAnalysisDnaArchiveAudit.js';
import {
  DNA_MASTER_CERTIFICATION_MD_PATH,
  DNA_MASTER_CERTIFICATION_PASS_VERDICT,
  DNA_MASTER_CERTIFICATION_REPORT_PATH,
  DNA_MASTER_CERTIFICATION_STATUS_MESSAGE,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaMasterCertificationReport,
} from '../services/movieAnalysisDnaMasterCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, DNA_ARCHIVE_AUDIT_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${DNA_ARCHIVE_AUDIT_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisDnaMasterCertificationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} dataset_chain=${report.dataset_chain} dna_chain=${report.dna_chain} adapter_chain=${report.adapter_chain} release_chain=${report.release_chain} archive_chain=${report.archive_chain} phases_022_to_065_complete=${report.phases_022_to_065_complete} master_certification_ready=${report.master_certification_ready} planning_only=${report.planning_only_status}`
);
for (const chainAudit of report.chain_audits) {
  console.log(`  ${chainAudit.chain}: phases=${chainAudit.phase_count} chain=${chainAudit.chain_passed ? 'PASS' : 'FAIL'}`);
}
if (report.certification_status_message) {
  console.log(report.certification_status_message);
}
console.log(`report=${DNA_MASTER_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${DNA_MASTER_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_MASTER_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.dataset_chain !== 'PASS' ||
  report.dna_chain !== 'PASS' ||
  report.adapter_chain !== 'PASS' ||
  report.release_chain !== 'PASS' ||
  report.archive_chain !== 'PASS' ||
  report.phases_022_to_065_complete !== 'PASS' ||
  report.master_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.certification_status_message !== DNA_MASTER_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    'Expected source_count=4 adapter_count=24 dataset_chain=PASS dna_chain=PASS adapter_chain=PASS release_chain=PASS archive_chain=PASS phases_022_to_065_complete=PASS master_certification_ready=PASS planning_only=PASS Movie Analysis DNA Pipeline V1 Certified'
  );
  process.exit(1);
}

process.exit(0);
