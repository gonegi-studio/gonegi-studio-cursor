import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COORDINATE_EXTRACTION_PASS_VERDICT,
  COORDINATE_EXTRACTION_REPORT_PATH,
} from '../services/movieAnalysisCoordinateExtractionValidator.js';
import {
  COORDINATE_EXTRACTION_REGISTRY_PATH,
} from '../services/movieAnalysisCoordinateExtractionDesign.js';
import {
  GONEGI_STATE_MAPPING_MD_PATH,
  GONEGI_STATE_MAPPING_PASS_VERDICT,
  GONEGI_STATE_MAPPING_REPORT_PATH,
  writeMovieAnalysisGonegiStateMappingReport,
} from '../services/movieAnalysisGonegiStateMappingValidator.js';
import {
  GONEGI_STATE_MAPPING_REGISTRY_PATH,
  GONEGI_STATE_MAPPING_SCHEMA_PATH,
  writeMovieAnalysisGonegiStateMappingPlans,
} from '../services/movieAnalysisGonegiStateMappingDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  COORDINATE_EXTRACTION_REGISTRY_PATH,
  COORDINATE_EXTRACTION_REPORT_PATH,
  GONEGI_STATE_MAPPING_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const coordinateExtractionReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, COORDINATE_EXTRACTION_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (coordinateExtractionReport.final_verdict !== COORDINATE_EXTRACTION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${COORDINATE_EXTRACTION_REPORT_PATH} must have ${COORDINATE_EXTRACTION_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisGonegiStateMappingPlans(projectRoot);
const report = writeMovieAnalysisGonegiStateMappingReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `mapping_plans=${report.mapping_plans} coordinate_links=${report.coordinate_links} scene_links=${report.scene_links} sampling_links=${report.sampling_links} dry_run_links=${report.dry_run_links} analysis_links=${report.analysis_links} source_links=${report.source_links}`
);
console.log(
  `state_categories=${report.state_categories} candidate_counts_valid=${report.candidate_counts_valid} estimated_only=${report.estimated_only}`
);
console.log(
  `state_mapping_only=${report.state_mapping_only} coordinate_extraction=${report.coordinate_extraction} frame_extraction=${report.frame_extraction} scene_extraction=${report.scene_extraction} ocr=${report.ocr} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.gonegi_state_mapping_id === plan.gonegi_state_mapping_id
  );
  console.log(
    `  ${plan.gonegi_state_mapping_id} ← ${plan.coordinate_extraction_id}: ${validation?.status ?? 'FAIL'} strategy=${plan.mapping_strategy} states=${plan.gonegi_states.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${GONEGI_STATE_MAPPING_REGISTRY_PATH}`);
console.log(`report=${GONEGI_STATE_MAPPING_REPORT_PATH}`);
console.log(`markdown=${GONEGI_STATE_MAPPING_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== GONEGI_STATE_MAPPING_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.mapping_plans !== 4 ||
  report.coordinate_links !== 'PASS' ||
  report.scene_links !== 'PASS' ||
  report.sampling_links !== 'PASS' ||
  report.dry_run_links !== 'PASS' ||
  report.analysis_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.state_categories !== 'PASS' ||
  report.candidate_counts_valid !== 'PASS' ||
  report.estimated_only !== 'PASS'
) {
  console.error(
    `Expected mapping_plans=4 coordinate_links=PASS scene_links=PASS sampling_links=PASS dry_run_links=PASS analysis_links=PASS source_links=PASS state_categories=PASS candidate_counts_valid=PASS estimated_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
