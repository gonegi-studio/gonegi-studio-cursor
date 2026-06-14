import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NUMERICAL_DNA_READINESS_REPORT_PATH,
  NUMERICAL_DNA_TRACEABILITY_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_STATUS,
  writeSourceVideoNumericalDnaValidationReport,
} from '../services/sourceVideoNumericalDnaValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSourceVideoNumericalDnaValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `all_7_subsystems_validated=${report.all_7_subsystems_validated}`,
    `numerical_dna_ready=${report.numerical_dna_ready}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `broken_links=${report.broken_links}`,
    `missing_fields=${report.missing_fields}`,
    `coverage_ratio=${report.coverage_ratio}`,
    `validation_score=${report.validation_score}`,
    `cross_reference_integrity=${report.cross_reference_integrity}`,
    `confidence_consistency=${report.confidence_consistency}`,
  ].join(' | ')
);

for (const rel of [
  SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_REPORT_PATH,
  NUMERICAL_DNA_READINESS_REPORT_PATH,
  NUMERICAL_DNA_TRACEABILITY_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

const traceability = JSON.parse(
  fs.readFileSync(path.join(projectRoot, NUMERICAL_DNA_TRACEABILITY_REPORT_PATH), 'utf8')
) as { traceability_score: number; lineage_integrity_score: number };

console.log(
  [
    `traceability_score=${traceability.traceability_score}`,
    `lineage_integrity_score=${traceability.lineage_integrity_score}`,
  ].join(' | ')
);

if (report.final_verdict !== SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PASS_VERDICT) {
  console.error('SOURCE VIDEO NUMERICAL DNA VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_STATUS) {
  console.error(`STATUS FAIL: expected ${SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_STATUS}`);
  process.exit(1);
}

if (
  !report.all_7_subsystems_validated ||
  report.broken_links !== 0 ||
  report.missing_fields !== 0 ||
  report.coverage_ratio !== 1 ||
  report.validation_score < 0.95 ||
  traceability.traceability_score < 0.95 ||
  traceability.lineage_integrity_score < 0.95 ||
  !report.cross_reference_integrity ||
  !report.confidence_consistency ||
  !report.numerical_dna_ready
) {
  console.error('PASS CONDITION FAIL: one or more validation thresholds not met');
  process.exit(1);
}

process.exit(0);
