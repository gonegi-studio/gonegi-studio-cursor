import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NUMERICAL_EXTRACTION_FEASIBILITY_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_DATASET_DIR,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REGISTRY_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_STATUS,
  writeSourceVideoNumericalDnaAuditReport,
} from '../services/sourceVideoNumericalDnaAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSourceVideoNumericalDnaAuditReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `extraction_feasibility=${report.extraction_feasibility}`,
    `numerical_dna_complete=${report.numerical_dna_complete}`,
    `numerical_dna_extracted=${report.numerical_dna_extracted}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `all_15_sources_audited=${report.all_15_sources_audited}`,
    `missing_sources=${report.missing_sources}`,
    `coverage_ratio=${report.coverage_ratio}`,
  ].join(' | ')
);

for (const rel of [
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_DATASET_DIR,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REGISTRY_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REPORT_PATH,
  NUMERICAL_EXTRACTION_FEASIBILITY_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PASS_VERDICT) {
  console.error('SOURCE VIDEO NUMERICAL DNA AUDIT VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_STATUS) {
  console.error(`STATUS FAIL: expected ${SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_STATUS}`);
  process.exit(1);
}

process.exit(0);
