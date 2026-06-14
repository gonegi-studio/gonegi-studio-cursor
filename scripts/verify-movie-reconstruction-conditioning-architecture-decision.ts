import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONDITIONING_BACKEND_DECISION_MATRIX_PATH,
  CONDITIONING_IMPLEMENTATION_ROADMAP_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DATASET_DIR,
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PASS_VERDICT,
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_REGISTRY_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_STATUS,
  writeMovieReconstructionConditioningArchitectureDecisionReport,
} from '../services/movieReconstructionConditioningArchitectureDecision.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieReconstructionConditioningArchitectureDecisionReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `conditioning_architecture_decided=${report.conditioning_architecture_decided}`,
    `conditioning_implemented=${report.conditioning_implemented}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `selected_architecture=${report.selected_architecture}`,
    `selected_architecture_defined=${report.selected_architecture_defined}`,
    `backend_stack_defined=${report.backend_stack_defined}`,
    `migration_strategy_defined=${report.migration_strategy_defined}`,
    `current_app_compatible=${report.current_app_compatible}`,
    `requires_new_backend=${report.requires_new_backend}`,
    `backend_stack_count=${report.backend_stack.length}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DATASET_DIR,
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_REGISTRY_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT_PATH,
  CONDITIONING_BACKEND_DECISION_MATRIX_PATH,
  CONDITIONING_IMPLEMENTATION_ROADMAP_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PASS_VERDICT) {
  console.error('MOVIE RECONSTRUCTION CONDITIONING ARCHITECTURE DECISION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_STATUS) {
  console.error(`STATUS FAIL: expected ${MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_STATUS}`);
  process.exit(1);
}

if (
  !report.selected_architecture_defined ||
  !report.backend_stack_defined ||
  !report.migration_strategy_defined ||
  report.current_app_compatible !== false ||
  report.requires_new_backend !== true
) {
  console.error('PASS CONDITION FAIL: architecture decision checks not met');
  process.exit(1);
}

process.exit(0);
