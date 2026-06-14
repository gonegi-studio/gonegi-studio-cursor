import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KEYFRAME_PREPARATION_PASS_VERDICT,
  KEYFRAME_PREPARATION_REPORT_PATH,
} from '../services/movieAnalysisKeyframePreparationValidator.js';
import {
  KEYFRAME_PREPARATION_REGISTRY_PATH,
} from '../services/movieAnalysisKeyframePreparationDesign.js';
import {
  MOTION_PLANNING_MD_PATH,
  MOTION_PLANNING_PASS_VERDICT,
  MOTION_PLANNING_REPORT_PATH,
  writeMovieAnalysisMotionPlanningReport,
} from '../services/movieAnalysisMotionPlanningValidator.js';
import {
  MOTION_PLANNING_REGISTRY_PATH,
  MOTION_PLANNING_SCHEMA_PATH,
  writeMovieAnalysisMotionPlanningPlans,
} from '../services/movieAnalysisMotionPlanningDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  KEYFRAME_PREPARATION_REGISTRY_PATH,
  KEYFRAME_PREPARATION_REPORT_PATH,
  MOTION_PLANNING_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const keyframePreparationReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, KEYFRAME_PREPARATION_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (keyframePreparationReport.final_verdict !== KEYFRAME_PREPARATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${KEYFRAME_PREPARATION_REPORT_PATH} must have ${KEYFRAME_PREPARATION_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisMotionPlanningPlans(projectRoot);
const report = writeMovieAnalysisMotionPlanningReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `motion_plans=${report.motion_plans} keyframe_links=${report.keyframe_links} source_links=${report.source_links} motion_categories=${report.motion_categories} candidate_counts_valid=${report.candidate_counts_valid} estimated_only=${report.estimated_only}`
);
console.log(
  `motion_planning_only=${report.motion_planning_only} motion_generation=${report.motion_generation} video_generation=${report.video_generation} keyframe_generation=${report.keyframe_generation} ocr=${report.ocr} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find((v) => v.motion_plan_id === plan.motion_plan_id);
  console.log(
    `  ${plan.motion_plan_id} ← ${plan.keyframe_preparation_id}: ${validation?.status ?? 'FAIL'} strategy=${plan.planning_strategy} motions=${plan.motion_candidates.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${MOTION_PLANNING_REGISTRY_PATH}`);
console.log(`report=${MOTION_PLANNING_REPORT_PATH}`);
console.log(`markdown=${MOTION_PLANNING_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MOTION_PLANNING_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.motion_plans !== 4 ||
  report.keyframe_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.motion_categories !== 'PASS' ||
  report.candidate_counts_valid !== 'PASS' ||
  report.estimated_only !== 'PASS'
) {
  console.error(
    `Expected motion_plans=4 keyframe_links=PASS source_links=PASS motion_categories=PASS candidate_counts_valid=PASS estimated_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
