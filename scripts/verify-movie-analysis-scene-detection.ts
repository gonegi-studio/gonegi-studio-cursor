import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FRAME_SAMPLING_PASS_VERDICT,
  FRAME_SAMPLING_REPORT_PATH,
} from '../services/movieAnalysisFrameSamplingValidator.js';
import {
  FRAME_SAMPLING_REGISTRY_PATH,
} from '../services/movieAnalysisFrameSamplingDesign.js';
import {
  SCENE_DETECTION_MD_PATH,
  SCENE_DETECTION_PASS_VERDICT,
  SCENE_DETECTION_REPORT_PATH,
  writeMovieAnalysisSceneDetectionReport,
} from '../services/movieAnalysisSceneDetectionValidator.js';
import {
  SCENE_DETECTION_REGISTRY_PATH,
  SCENE_DETECTION_SCHEMA_PATH,
  writeMovieAnalysisSceneDetectionPlans,
} from '../services/movieAnalysisSceneDetectionDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  FRAME_SAMPLING_REGISTRY_PATH,
  FRAME_SAMPLING_REPORT_PATH,
  SCENE_DETECTION_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const frameSamplingReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, FRAME_SAMPLING_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (frameSamplingReport.final_verdict !== FRAME_SAMPLING_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${FRAME_SAMPLING_REPORT_PATH} must have ${FRAME_SAMPLING_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisSceneDetectionPlans(projectRoot);
const report = writeMovieAnalysisSceneDetectionReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `scene_detection_plans=${report.scene_detection_plans} sampling_links=${report.sampling_links} dry_run_links=${report.dry_run_links} analysis_links=${report.analysis_links} source_links=${report.source_links}`
);
console.log(
  `candidate_counts_valid=${report.candidate_counts_valid} estimated_only=${report.estimated_only}`
);
console.log(
  `frame_extraction=${report.frame_extraction} scene_extraction=${report.scene_extraction} ocr=${report.ocr} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.scene_detection_id === plan.scene_detection_id
  );
  console.log(
    `  ${plan.scene_detection_id} ← ${plan.sampling_plan_id}: ${validation?.status ?? 'FAIL'} strategy=${plan.scene_detection_strategy} candidates=${plan.scene_candidates.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${SCENE_DETECTION_REGISTRY_PATH}`);
console.log(`report=${SCENE_DETECTION_REPORT_PATH}`);
console.log(`markdown=${SCENE_DETECTION_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== SCENE_DETECTION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.scene_detection_plans !== 4 ||
  report.sampling_links !== 'PASS' ||
  report.dry_run_links !== 'PASS' ||
  report.analysis_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.candidate_counts_valid !== 'PASS' ||
  report.estimated_only !== 'PASS'
) {
  console.error(
    `Expected scene_detection_plans=4 sampling_links=PASS dry_run_links=PASS analysis_links=PASS source_links=PASS candidate_counts_valid=PASS estimated_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
