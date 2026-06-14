import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GPU_CONDITIONING_CAPABILITY_AUDIT_PASS_VERDICT,
  GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH,
  GPU_CONDITIONING_CAPABILITY_AUDIT_STATUS,
  MOVIE_RECONSTRUCTION_FEASIBILITY_PRECHECK_PATH,
  writeGpuConditioningCapabilityAuditReport,
} from '../services/gpuConditioningCapabilityAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeGpuConditioningCapabilityAuditReport(projectRoot);

const auditReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH), 'utf8')
) as {
  backends: Array<{ backend: string; capability_score: number; critical_missing_features: string[] }>;
};

const feasibility = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MOVIE_RECONSTRUCTION_FEASIBILITY_PRECHECK_PATH), 'utf8')
) as {
  highest_priority_gap: string;
  movie_reconstruction_score: number;
  storyboard_generation_score: number;
  music_video_score: number;
  short_film_score: number;
  feature_film_score: number;
  feasibility_scores_defined: boolean;
  highest_priority_gap_defined: boolean;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `gpu_capabilities_understood=${report.gpu_capabilities_understood}`,
    `backend_capabilities_documented=${report.backend_capabilities_documented}`,
    `critical_missing_features_defined=${report.critical_missing_features_defined}`,
    `gpu_execution_ready=${report.gpu_execution_ready}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `highest_priority_gap=${feasibility.highest_priority_gap}`,
    `movie_reconstruction_score=${feasibility.movie_reconstruction_score}`,
    `storyboard_generation_score=${feasibility.storyboard_generation_score}`,
  ].join(' | ')
);

for (const rel of [
  GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH,
  MOVIE_RECONSTRUCTION_FEASIBILITY_PRECHECK_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== GPU_CONDITIONING_CAPABILITY_AUDIT_PASS_VERDICT) {
  console.error('GPU CONDITIONING CAPABILITY AUDIT FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== GPU_CONDITIONING_CAPABILITY_AUDIT_STATUS) {
  console.error(`STATUS FAIL: expected ${GPU_CONDITIONING_CAPABILITY_AUDIT_STATUS}`);
  process.exit(1);
}

if (
  !report.backend_capabilities_documented ||
  !report.critical_missing_features_defined ||
  !report.gpu_capabilities_understood ||
  !feasibility.feasibility_scores_defined ||
  !feasibility.highest_priority_gap_defined
) {
  console.error('PASS CONDITION FAIL: audit definition checks not met');
  process.exit(1);
}

if (
  report.gpu_execution_ready ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify gpu_execution_ready or reconstruction readiness');
  process.exit(1);
}

if (auditReport.backends.length !== 3) {
  console.error('BACKEND AUDIT FAIL: three backends required');
  process.exit(1);
}

const controlnet = auditReport.backends.find((entry) => entry.backend === 'controlnet_backend');
if (!controlnet || controlnet.critical_missing_features.length === 0) {
  console.error('CONTROLNET AUDIT FAIL: controlnet_backend with critical_missing_features required');
  process.exit(1);
}

if (feasibility.highest_priority_gap !== 'temporal_preservation') {
  console.error('HIGHEST PRIORITY GAP FAIL: temporal_preservation expected');
  process.exit(1);
}

if (
  feasibility.movie_reconstruction_score !== 0.28 ||
  feasibility.storyboard_generation_score !== 0.95 ||
  feasibility.music_video_score !== 0.82 ||
  feasibility.short_film_score !== 0.51 ||
  feasibility.feature_film_score !== 0.19
) {
  console.error('FEASIBILITY SCORES FAIL: expected example scores');
  process.exit(1);
}

process.exit(0);
