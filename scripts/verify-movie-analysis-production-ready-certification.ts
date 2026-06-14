import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINAL_RELEASE_AUDIT_REPORT_PATH } from '../services/movieAnalysisFinalReleaseAudit.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_PHASE_COUNT,
  EXPECTED_SOURCE_COUNT,
  PRODUCTION_READY_CERTIFICATION_MD_PATH,
  PRODUCTION_READY_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_READY_CERTIFICATION_REPORT_PATH,
  PRODUCTION_READY_STATUS_MESSAGE,
  writeMovieAnalysisProductionReadyCertificationReport,
} from '../services/movieAnalysisProductionReadyCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, FINAL_RELEASE_AUDIT_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${FINAL_RELEASE_AUDIT_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisProductionReadyCertificationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} dataset_ready=${report.dataset_ready} dna_ready=${report.dna_ready} adapter_ready=${report.adapter_ready} release_ready=${report.release_ready} archive_ready=${report.archive_ready} audit_ready=${report.audit_ready} phases_022_to_067_complete=${report.phases_022_to_067_complete} production_ready=${report.production_ready} planning_only=${report.planning_only_status}`
);
if (report.certification_status) {
  console.log(report.certification_status);
}
console.log(`phases_certified=${report.phase_audits.length}`);
console.log(`report=${PRODUCTION_READY_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${PRODUCTION_READY_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_READY_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.dataset_ready !== 'PASS' ||
  report.dna_ready !== 'PASS' ||
  report.adapter_ready !== 'PASS' ||
  report.release_ready !== 'PASS' ||
  report.archive_ready !== 'PASS' ||
  report.audit_ready !== 'PASS' ||
  report.phases_022_to_067_complete !== 'PASS' ||
  report.production_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.phase_audits.length !== EXPECTED_PHASE_COUNT ||
  report.certification_status !== PRODUCTION_READY_STATUS_MESSAGE
) {
  console.error(
    'Expected source_count=4 adapter_count=24 dataset_ready=PASS dna_ready=PASS adapter_ready=PASS release_ready=PASS archive_ready=PASS audit_ready=PASS phases_022_to_067_complete=PASS production_ready=PASS planning_only=PASS phases_certified=46 MOVIE_ANALYSIS_ENGINE_PRODUCTION_READY'
  );
  process.exit(1);
}

process.exit(0);
