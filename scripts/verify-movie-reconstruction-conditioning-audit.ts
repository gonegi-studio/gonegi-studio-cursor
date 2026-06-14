import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONDITIONING_GAP_REPORT_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PASS_VERDICT,
  MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_STATUS,
  MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REGISTRY_PATH,
  writeMovieReconstructionConditioningAuditReport,
} from '../services/movieReconstructionConditioningAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieReconstructionConditioningAuditReport(projectRoot);

const gapReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, CONDITIONING_GAP_REPORT_PATH), 'utf8')
) as {
  implemented: number;
  partially_supported: number;
  not_supported: number;
  recommended_priority_order: string[];
  requires_new_backend: string[];
  conditioning_gap_understood: boolean;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `conditioning_gap_understood=${report.conditioning_gap_understood}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `all_7_subsystems_audited=${report.all_7_subsystems_audited}`,
    `implemented=${gapReport.implemented}`,
    `partially_supported=${gapReport.partially_supported}`,
    `not_supported=${gapReport.not_supported}`,
    `priority_order_length=${gapReport.recommended_priority_order.length}`,
    `requires_new_backend_count=${gapReport.requires_new_backend.length}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REGISTRY_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH,
  CONDITIONING_GAP_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PASS_VERDICT) {
  console.error('MOVIE RECONSTRUCTION CONDITIONING AUDIT FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_STATUS) {
  console.error(`STATUS FAIL: expected ${MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_STATUS}`);
  process.exit(1);
}

if (
  !report.all_7_subsystems_audited ||
  gapReport.recommended_priority_order.length === 0 ||
  gapReport.requires_new_backend.length === 0
) {
  console.error('PASS CONDITION FAIL: audit completeness checks not met');
  process.exit(1);
}

process.exit(0);
