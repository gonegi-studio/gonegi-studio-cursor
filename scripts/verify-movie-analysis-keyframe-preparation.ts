import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VIDEO_STATE_COMPILATION_PASS_VERDICT,
  VIDEO_STATE_COMPILATION_REPORT_PATH,
} from '../services/movieAnalysisVideoStateCompilationValidator.js';
import {
  VIDEO_STATE_COMPILATION_REGISTRY_PATH,
} from '../services/movieAnalysisVideoStateCompilationDesign.js';
import {
  KEYFRAME_PREPARATION_MD_PATH,
  KEYFRAME_PREPARATION_PASS_VERDICT,
  KEYFRAME_PREPARATION_REPORT_PATH,
  writeMovieAnalysisKeyframePreparationReport,
} from '../services/movieAnalysisKeyframePreparationValidator.js';
import {
  KEYFRAME_PREPARATION_REGISTRY_PATH,
  KEYFRAME_PREPARATION_SCHEMA_PATH,
  writeMovieAnalysisKeyframePreparationPlans,
} from '../services/movieAnalysisKeyframePreparationDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  VIDEO_STATE_COMPILATION_REGISTRY_PATH,
  VIDEO_STATE_COMPILATION_REPORT_PATH,
  KEYFRAME_PREPARATION_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const videoStateCompilationReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_STATE_COMPILATION_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (videoStateCompilationReport.final_verdict !== VIDEO_STATE_COMPILATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${VIDEO_STATE_COMPILATION_REPORT_PATH} must have ${VIDEO_STATE_COMPILATION_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisKeyframePreparationPlans(projectRoot);
const report = writeMovieAnalysisKeyframePreparationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `keyframe_preparation_plans=${report.keyframe_preparation_plans} video_state_links=${report.video_state_links} gonegi_state_links=${report.gonegi_state_links} coordinate_links=${report.coordinate_links} scene_links=${report.scene_links} sampling_links=${report.sampling_links} dry_run_links=${report.dry_run_links} analysis_links=${report.analysis_links} source_links=${report.source_links}`
);
console.log(
  `keyframe_roles=${report.keyframe_roles} candidate_counts_valid=${report.candidate_counts_valid} estimated_only=${report.estimated_only}`
);
console.log(
  `keyframe_preparation_only=${report.keyframe_preparation_only} keyframe_generation=${report.keyframe_generation} image_generation=${report.image_generation} state_execution=${report.state_execution} runtime_payload=${report.runtime_payload} frame_extraction=${report.frame_extraction} scene_extraction=${report.scene_extraction} ocr=${report.ocr} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.keyframe_preparation_id === plan.keyframe_preparation_id
  );
  console.log(
    `  ${plan.keyframe_preparation_id} ← ${plan.video_state_compilation_id}: ${validation?.status ?? 'FAIL'} strategy=${plan.preparation_strategy} keyframes=${plan.keyframe_candidates.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${KEYFRAME_PREPARATION_REGISTRY_PATH}`);
console.log(`report=${KEYFRAME_PREPARATION_REPORT_PATH}`);
console.log(`markdown=${KEYFRAME_PREPARATION_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== KEYFRAME_PREPARATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.keyframe_preparation_plans !== 4 ||
  report.video_state_links !== 'PASS' ||
  report.gonegi_state_links !== 'PASS' ||
  report.coordinate_links !== 'PASS' ||
  report.scene_links !== 'PASS' ||
  report.sampling_links !== 'PASS' ||
  report.dry_run_links !== 'PASS' ||
  report.analysis_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.keyframe_roles !== 'PASS' ||
  report.candidate_counts_valid !== 'PASS' ||
  report.estimated_only !== 'PASS'
) {
  console.error(
    `Expected keyframe_preparation_plans=4 video_state_links=PASS gonegi_state_links=PASS coordinate_links=PASS scene_links=PASS sampling_links=PASS dry_run_links=PASS analysis_links=PASS source_links=PASS keyframe_roles=PASS candidate_counts_valid=PASS estimated_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
