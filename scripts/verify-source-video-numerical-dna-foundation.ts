import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NUMERICAL_DNA_GAP_ANALYSIS_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_DATASET_DIR,
  SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_EXPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_SCHEMA_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_STATUS,
  writeSourceVideoNumericalDnaFoundationReport,
} from '../services/sourceVideoNumericalDnaFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSourceVideoNumericalDnaFoundationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `metadata_only=${report.metadata_only}`,
    `placeholder_only=${report.placeholder_only}`,
    `numerical_dna_complete=${report.numerical_dna_complete}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `ghibli=${report.coverage.ghibli}`,
    `shinkai=${report.coverage.shinkai}`,
    `live_action=${report.coverage.live_action}`,
    `mori=${report.coverage.mori}`,
    `missing_records=${report.coverage.missing_records}`,
  ].join(' | ')
);

const requiredPaths = [
  SOURCE_VIDEO_NUMERICAL_DNA_DATASET_DIR,
  SOURCE_VIDEO_NUMERICAL_DNA_SCHEMA_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_EXPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT_PATH,
  NUMERICAL_DNA_GAP_ANALYSIS_REPORT_PATH,
  ...report.builder_modules,
];

for (const rel of requiredPaths) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SOURCE_VIDEO_NUMERICAL_DNA_PASS_VERDICT) {
  console.error('SOURCE VIDEO NUMERICAL DNA FOUNDATION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== SOURCE_VIDEO_NUMERICAL_DNA_STATUS) {
  console.error(`STATUS FAIL: expected ${SOURCE_VIDEO_NUMERICAL_DNA_STATUS}`);
  process.exit(1);
}

process.exit(0);
