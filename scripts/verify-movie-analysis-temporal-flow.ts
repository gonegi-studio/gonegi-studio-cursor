import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOTION_PLANNING_PASS_VERDICT,
  MOTION_PLANNING_REPORT_PATH,
} from '../services/movieAnalysisMotionPlanningValidator.js';
import {
  MOTION_PLANNING_REGISTRY_PATH,
} from '../services/movieAnalysisMotionPlanningDesign.js';
import {
  TEMPORAL_FLOW_MD_PATH,
  TEMPORAL_FLOW_PASS_VERDICT,
  TEMPORAL_FLOW_REPORT_PATH,
  writeMovieAnalysisTemporalFlowReport,
} from '../services/movieAnalysisTemporalFlowValidator.js';
import {
  TEMPORAL_FLOW_REGISTRY_PATH,
  TEMPORAL_FLOW_SCHEMA_PATH,
  writeMovieAnalysisTemporalFlowPlans,
} from '../services/movieAnalysisTemporalFlowDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  MOTION_PLANNING_REGISTRY_PATH,
  MOTION_PLANNING_REPORT_PATH,
  TEMPORAL_FLOW_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const motionPlanningReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MOTION_PLANNING_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (motionPlanningReport.final_verdict !== MOTION_PLANNING_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${MOTION_PLANNING_REPORT_PATH} must have ${MOTION_PLANNING_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisTemporalFlowPlans(projectRoot);
const report = writeMovieAnalysisTemporalFlowReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `temporal_flow_plans=${report.temporal_flow_plans} motion_links=${report.motion_links} source_links=${report.source_links} flow_categories=${report.flow_categories} candidate_counts_valid=${report.candidate_counts_valid} estimated_only=${report.estimated_only}`
);
console.log(
  `temporal_flow_only=${report.temporal_flow_only} sequence_generation=${report.sequence_generation} video_generation=${report.video_generation} motion_generation=${report.motion_generation} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.temporal_flow_id === plan.temporal_flow_id
  );
  console.log(
    `  ${plan.temporal_flow_id} ← ${plan.motion_plan_id}: ${validation?.status ?? 'FAIL'} strategy=${plan.flow_strategy} flows=${plan.temporal_candidates.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${TEMPORAL_FLOW_REGISTRY_PATH}`);
console.log(`report=${TEMPORAL_FLOW_REPORT_PATH}`);
console.log(`markdown=${TEMPORAL_FLOW_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== TEMPORAL_FLOW_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.temporal_flow_plans !== 4 ||
  report.motion_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.flow_categories !== 'PASS' ||
  report.candidate_counts_valid !== 'PASS' ||
  report.estimated_only !== 'PASS'
) {
  console.error(
    `Expected temporal_flow_plans=4 motion_links=PASS source_links=PASS flow_categories=PASS candidate_counts_valid=PASS estimated_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
