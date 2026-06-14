import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GONEGI_STATE_MAPPING_PASS_VERDICT,
  GONEGI_STATE_MAPPING_REPORT_PATH,
} from '../services/movieAnalysisGonegiStateMappingValidator.js';
import {
  GONEGI_STATE_MAPPING_REGISTRY_PATH,
} from '../services/movieAnalysisGonegiStateMappingDesign.js';
import {
  VIDEO_STATE_COMPILATION_MD_PATH,
  VIDEO_STATE_COMPILATION_PASS_VERDICT,
  VIDEO_STATE_COMPILATION_REPORT_PATH,
  writeMovieAnalysisVideoStateCompilationReport,
} from '../services/movieAnalysisVideoStateCompilationValidator.js';
import {
  VIDEO_STATE_COMPILATION_REGISTRY_PATH,
  VIDEO_STATE_COMPILATION_SCHEMA_PATH,
  writeMovieAnalysisVideoStateCompilationPlans,
} from '../services/movieAnalysisVideoStateCompilationDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  GONEGI_STATE_MAPPING_REGISTRY_PATH,
  GONEGI_STATE_MAPPING_REPORT_PATH,
  VIDEO_STATE_COMPILATION_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const gonegiStateMappingReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GONEGI_STATE_MAPPING_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (gonegiStateMappingReport.final_verdict !== GONEGI_STATE_MAPPING_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${GONEGI_STATE_MAPPING_REPORT_PATH} must have ${GONEGI_STATE_MAPPING_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisVideoStateCompilationPlans(projectRoot);
const report = writeMovieAnalysisVideoStateCompilationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `video_state_compilation_plans=${report.video_state_compilation_plans} gonegi_state_links=${report.gonegi_state_links} coordinate_links=${report.coordinate_links} scene_links=${report.scene_links} sampling_links=${report.sampling_links} dry_run_links=${report.dry_run_links} analysis_links=${report.analysis_links} source_links=${report.source_links}`
);
console.log(
  `video_state_categories=${report.video_state_categories} candidate_counts_valid=${report.candidate_counts_valid} estimated_only=${report.estimated_only}`
);
console.log(
  `video_state_compilation_only=${report.video_state_compilation_only} state_execution=${report.state_execution} runtime_payload=${report.runtime_payload} coordinate_extraction=${report.coordinate_extraction} frame_extraction=${report.frame_extraction} scene_extraction=${report.scene_extraction} ocr=${report.ocr} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.video_state_compilation_id === plan.video_state_compilation_id
  );
  console.log(
    `  ${plan.video_state_compilation_id} ← ${plan.gonegi_state_mapping_id}: ${validation?.status ?? 'FAIL'} strategy=${plan.compilation_strategy} video_states=${plan.video_states.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${VIDEO_STATE_COMPILATION_REGISTRY_PATH}`);
console.log(`report=${VIDEO_STATE_COMPILATION_REPORT_PATH}`);
console.log(`markdown=${VIDEO_STATE_COMPILATION_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_STATE_COMPILATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.video_state_compilation_plans !== 4 ||
  report.gonegi_state_links !== 'PASS' ||
  report.coordinate_links !== 'PASS' ||
  report.scene_links !== 'PASS' ||
  report.sampling_links !== 'PASS' ||
  report.dry_run_links !== 'PASS' ||
  report.analysis_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.video_state_categories !== 'PASS' ||
  report.candidate_counts_valid !== 'PASS' ||
  report.estimated_only !== 'PASS'
) {
  console.error(
    `Expected video_state_compilation_plans=4 gonegi_state_links=PASS coordinate_links=PASS scene_links=PASS sampling_links=PASS dry_run_links=PASS analysis_links=PASS source_links=PASS video_state_categories=PASS candidate_counts_valid=PASS estimated_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
