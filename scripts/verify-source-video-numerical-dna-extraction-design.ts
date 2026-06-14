import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NUMERICAL_DNA_EXTRACTION_SPECIFICATION_PATH,
  NUMERICAL_DNA_REAL_EXTRACTION_GAP_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_DESIGN_DATASET_DIR,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_MANIFEST_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SCHEMA_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_STATUS,
  writeSourceVideoNumericalDnaExtractionDesignReport,
} from '../services/sourceVideoNumericalDnaExtractionDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSourceVideoNumericalDnaExtractionDesignReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `extraction_design_complete=${report.extraction_design_complete}`,
    `numerical_dna_extracted=${report.numerical_dna_extracted}`,
    `numerical_dna_complete=${report.numerical_dna_complete}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `all_7_subsystems_designed=${report.all_7_subsystems_designed}`,
    `validation_methods_defined=${report.validation_methods_defined}`,
    `failure_conditions_defined=${report.failure_conditions_defined}`,
    `minimum_viable_extraction_defined=${report.minimum_viable_extraction_defined}`,
    `specification_exists=${report.specification_exists}`,
    `gap_report_exists=${report.gap_report_exists}`,
  ].join(' | ')
);

for (const rel of [
  SOURCE_VIDEO_NUMERICAL_DNA_DESIGN_DATASET_DIR,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SCHEMA_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_MANIFEST_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_REPORT_PATH,
  NUMERICAL_DNA_EXTRACTION_SPECIFICATION_PATH,
  NUMERICAL_DNA_REAL_EXTRACTION_GAP_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PASS_VERDICT) {
  console.error('SOURCE VIDEO NUMERICAL DNA EXTRACTION DESIGN VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_STATUS) {
  console.error(`STATUS FAIL: expected ${SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_STATUS}`);
  process.exit(1);
}

process.exit(0);
