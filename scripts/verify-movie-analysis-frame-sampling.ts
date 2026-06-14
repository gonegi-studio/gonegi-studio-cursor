import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DRY_RUN_REGISTRY_PATH,
} from '../services/movieAnalysisDryRunPlanner.js';
import {
  FRAME_SAMPLING_MD_PATH,
  FRAME_SAMPLING_PASS_VERDICT,
  FRAME_SAMPLING_REPORT_PATH,
  writeMovieAnalysisFrameSamplingReport,
} from '../services/movieAnalysisFrameSamplingValidator.js';
import {
  FRAME_SAMPLING_REGISTRY_PATH,
  FRAME_SAMPLING_SCHEMA_PATH,
  writeMovieAnalysisFrameSamplingPlans,
} from '../services/movieAnalysisFrameSamplingDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const DRY_RUN_PLANNER_REPORT = 'reports/movie-analysis-dry-run-planner-report.json';

for (const required of [
  DRY_RUN_REGISTRY_PATH,
  DRY_RUN_PLANNER_REPORT,
  FRAME_SAMPLING_SCHEMA_PATH,
  FRAME_SAMPLING_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const dryRunReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, DRY_RUN_PLANNER_REPORT), 'utf8')
) as { final_verdict?: string };

if (dryRunReport.final_verdict !== 'PASS_MOVIE_ANALYSIS_DRY_RUN_PLANNER_V1') {
  console.error(
    `PRECHECK FAIL: ${DRY_RUN_PLANNER_REPORT} must have PASS_MOVIE_ANALYSIS_DRY_RUN_PLANNER_V1`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisFrameSamplingPlans(projectRoot);
const report = writeMovieAnalysisFrameSamplingReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `sampling_plans=${report.sampling_plans} dry_run_links=${report.dry_run_links} analysis_links=${report.analysis_links} source_links=${report.source_links}`
);
console.log(
  `target_counts=${report.target_counts} timestamp_candidates_only=${report.timestamp_candidates_only}`
);
console.log(
  `frame_extraction=${report.frame_extraction} ocr=${report.ocr} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.sampling_plan_id === plan.sampling_plan_id
  );
  console.log(
    `  ${plan.sampling_plan_id} ← ${plan.dry_run_id}: ${validation?.status ?? 'FAIL'} strategy=${plan.sampling_strategy} points=${plan.sampling_points.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`report=${FRAME_SAMPLING_REPORT_PATH}`);
console.log(`markdown=${FRAME_SAMPLING_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== FRAME_SAMPLING_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.sampling_plans !== 4 ||
  report.dry_run_links !== 'PASS' ||
  report.analysis_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.target_counts !== 'PASS' ||
  report.timestamp_candidates_only !== 'PASS'
) {
  console.error(
    `Expected sampling_plans=4 dry_run_links=PASS analysis_links=PASS source_links=PASS target_counts=PASS timestamp_candidates_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
