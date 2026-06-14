import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMOTION_GATE_REPORT_PATH } from '../services/gonegiPipelinePromotionGate.js';
import {
  ANALYSIS_PLAN_REGISTRY_PATH,
} from '../services/movieAnalysisPlanBuilder.js';
import {
  DRY_RUN_PLANNER_MD_PATH,
  DRY_RUN_PLANNER_PASS_VERDICT,
  DRY_RUN_PLANNER_REPORT_PATH,
  writeMovieAnalysisDryRunPlannerReport,
} from '../services/movieAnalysisDryRunValidator.js';
import {
  DRY_RUN_REGISTRY_PATH,
  DRY_RUN_SCHEMA_PATH,
  writeMovieAnalysisDryRuns,
} from '../services/movieAnalysisDryRunPlanner.js';
import { FINAL_SET_PATH } from '../services/sourceVideoFinalSetBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  FINAL_SET_PATH,
  ANALYSIS_PLAN_REGISTRY_PATH,
  PROMOTION_GATE_REPORT_PATH,
  DRY_RUN_SCHEMA_PATH,
  DRY_RUN_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const { dryRuns, written } = writeMovieAnalysisDryRuns(projectRoot);
const report = writeMovieAnalysisDryRunPlannerReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `dry_runs=${report.dry_runs} analysis_plan_links=${report.analysis_plan_links} source_links=${report.source_links} promotion_warning=${report.promotion_warning}`
);
console.log(
  `frame_extraction=${report.frame_extraction} ocr=${report.ocr} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const dryRun of dryRuns) {
  const validation = report.dry_run_validations.find((v) => v.dry_run_id === dryRun.dry_run_id);
  console.log(
    `  ${dryRun.dry_run_id} ← ${dryRun.analysis_plan_id}: ${validation?.status ?? 'FAIL'} segments=${dryRun.estimated_segment_count} coords=${dryRun.estimated_coordinate_count}`
  );
}
console.log(`written_dry_runs=${written.join(', ')}`);
console.log(`report=${DRY_RUN_PLANNER_REPORT_PATH}`);
console.log(`markdown=${DRY_RUN_PLANNER_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DRY_RUN_PLANNER_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.dry_runs !== 4 ||
  report.analysis_plan_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.promotion_warning !== 'PASS'
) {
  console.error(
    `Expected dry_runs=4 analysis_plan_links=PASS source_links=PASS promotion_warning=PASS, got dry_runs=${report.dry_runs} analysis_plan_links=${report.analysis_plan_links} source_links=${report.source_links} promotion_warning=${report.promotion_warning}`
  );
  process.exit(1);
}

process.exit(0);
