import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NUMERICAL_DNA_MVE_GAP_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_MVE_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_MVE_STATUS,
  writeSourceVideoNumericalDnaMveExtractionReport,
} from '../services/sourceVideoNumericalDnaMveExtraction.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSourceVideoNumericalDnaMveExtractionReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `implementation_mode=${report.implementation_mode}`,
    `minimum_viable_extraction_complete=${report.minimum_viable_extraction_complete}`,
    `full_numerical_dna_complete=${report.full_numerical_dna_complete}`,
    `numerical_dna_ready=${report.numerical_dna_ready}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `frame_coordinates=${report.frame_coordinates}`,
    `composition_coordinates=${report.composition_coordinates}`,
    `camera_path=${report.camera_path}`,
    `blocking_data=${report.blocking_data}`,
    `motion_vectors=${report.motion_vectors}`,
    `edit_rhythm=${report.edit_rhythm}`,
    `scene_remap=${report.scene_remap}`,
    `coverage_ratio=${report.coverage_ratio}`,
    `missing_sources=${report.missing_sources}`,
    `confidence_score=${report.confidence_score}`,
  ].join(' | ')
);

for (const rel of [
  SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_REPORT_PATH,
  NUMERICAL_DNA_MVE_GAP_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SOURCE_VIDEO_NUMERICAL_DNA_MVE_PASS_VERDICT) {
  console.error('SOURCE VIDEO NUMERICAL DNA MVE EXTRACTION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== SOURCE_VIDEO_NUMERICAL_DNA_MVE_STATUS) {
  console.error(`STATUS FAIL: expected ${SOURCE_VIDEO_NUMERICAL_DNA_MVE_STATUS}`);
  process.exit(1);
}

process.exit(0);
