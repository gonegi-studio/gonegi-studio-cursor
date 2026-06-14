import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FINAL_RELEASE_AUDIT_MD_PATH,
  FINAL_RELEASE_AUDIT_PASS_VERDICT,
  FINAL_RELEASE_AUDIT_REPORT_PATH,
  FINAL_RELEASE_AUDIT_STATUS_MESSAGE,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_PHASE_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisFinalReleaseAuditReport,
} from '../services/movieAnalysisFinalReleaseAudit.js';
import { DNA_MASTER_CERTIFICATION_REPORT_PATH } from '../services/movieAnalysisDnaMasterCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, DNA_MASTER_CERTIFICATION_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${DNA_MASTER_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisFinalReleaseAuditReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} dataset_chain=${report.dataset_chain} dna_chain=${report.dna_chain} adapter_chain=${report.adapter_chain} release_chain=${report.release_chain} archive_chain=${report.archive_chain} master_certification=${report.master_certification} phases_022_to_066_complete=${report.phases_022_to_066_complete} final_release_audit_ready=${report.final_release_audit_ready} planning_only=${report.planning_only_status}`
);
for (const chainAudit of report.chain_audits) {
  console.log(
    `  ${chainAudit.chain}: phases=${chainAudit.phase_count} audited=${chainAudit.chain_audited}`
  );
}
if (report.audit_status_message) {
  console.log(report.audit_status_message);
}
console.log(`phases_audited=${report.phase_audits.length}`);
console.log(`report=${FINAL_RELEASE_AUDIT_REPORT_PATH}`);
console.log(`markdown=${FINAL_RELEASE_AUDIT_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== FINAL_RELEASE_AUDIT_PASS_VERDICT) {
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
  report.master_certification !== 'PASS' ||
  report.phases_022_to_066_complete !== 'PASS' ||
  report.final_release_audit_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.phase_audits.length !== EXPECTED_PHASE_COUNT ||
  report.audit_status_message !== FINAL_RELEASE_AUDIT_STATUS_MESSAGE
) {
  console.error(
    'Expected source_count=4 adapter_count=24 all chains=PASS master_certification=PASS phases_022_to_066_complete=PASS final_release_audit_ready=PASS planning_only=PASS phases_audited=45 Movie Analysis Certified Pipeline Audit Complete'
  );
  process.exit(1);
}

process.exit(0);
