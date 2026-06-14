import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_DATASET_DIR,
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_MANIFEST_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PASS_VERDICT,
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_STATUS,
  MOVIE_RECONSTRUCTION_CONDITIONING_GAP_REPORT_PATH,
  writeMovieReconstructionConditioningDesignReport,
} from '../services/movieReconstructionConditioningDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieReconstructionConditioningDesignReport(projectRoot);

const gapReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MOVIE_RECONSTRUCTION_CONDITIONING_GAP_REPORT_PATH), 'utf8')
) as {
  design_complete: boolean;
  recommended_backend_strategy: string;
  requires_new_backend: string[];
};

const backendReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH), 'utf8')
) as {
  backend_options: string[];
  requires_new_backend: boolean;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `conditioning_design_complete=${report.conditioning_design_complete}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `all_7_subsystems_designed=${report.all_7_subsystems_designed}`,
    `backend_requirements_defined=${report.backend_requirements_defined}`,
    `requires_new_backend_defined=${report.requires_new_backend_defined}`,
    `backend_options_defined=${report.backend_options_defined}`,
    `recommended_backend_strategy_defined=${report.recommended_backend_strategy_defined}`,
    `design_complete=${report.design_complete}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_DATASET_DIR,
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_MANIFEST_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH,
  CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_GAP_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PASS_VERDICT) {
  console.error('MOVIE RECONSTRUCTION CONDITIONING DESIGN VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_STATUS) {
  console.error(`STATUS FAIL: expected ${MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_STATUS}`);
  process.exit(1);
}

if (
  !report.all_7_subsystems_designed ||
  !report.backend_requirements_defined ||
  !report.requires_new_backend_defined ||
  !report.backend_options_defined ||
  !report.recommended_backend_strategy_defined ||
  !report.design_complete ||
  !gapReport.design_complete ||
  gapReport.recommended_backend_strategy.length === 0 ||
  gapReport.requires_new_backend.length === 0 ||
  backendReport.backend_options.length === 0 ||
  !backendReport.requires_new_backend
) {
  console.error('PASS CONDITION FAIL: design completeness checks not met');
  process.exit(1);
}

process.exit(0);
