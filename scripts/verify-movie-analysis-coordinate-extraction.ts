import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCENE_DETECTION_PASS_VERDICT,
  SCENE_DETECTION_REPORT_PATH,
} from '../services/movieAnalysisSceneDetectionValidator.js';
import {
  SCENE_DETECTION_REGISTRY_PATH,
} from '../services/movieAnalysisSceneDetectionDesign.js';
import {
  COORDINATE_EXTRACTION_MD_PATH,
  COORDINATE_EXTRACTION_PASS_VERDICT,
  COORDINATE_EXTRACTION_REPORT_PATH,
  writeMovieAnalysisCoordinateExtractionReport,
} from '../services/movieAnalysisCoordinateExtractionValidator.js';
import {
  COORDINATE_EXTRACTION_REGISTRY_PATH,
  COORDINATE_EXTRACTION_SCHEMA_PATH,
  writeMovieAnalysisCoordinateExtractionPlans,
} from '../services/movieAnalysisCoordinateExtractionDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  SCENE_DETECTION_REGISTRY_PATH,
  SCENE_DETECTION_REPORT_PATH,
  COORDINATE_EXTRACTION_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const sceneDetectionReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SCENE_DETECTION_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (sceneDetectionReport.final_verdict !== SCENE_DETECTION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${SCENE_DETECTION_REPORT_PATH} must have ${SCENE_DETECTION_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisCoordinateExtractionPlans(projectRoot);
const report = writeMovieAnalysisCoordinateExtractionReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `coordinate_extraction_plans=${report.coordinate_extraction_plans} scene_detection_links=${report.scene_detection_links} sampling_links=${report.sampling_links} dry_run_links=${report.dry_run_links} analysis_links=${report.analysis_links} source_links=${report.source_links}`
);
console.log(
  `coordinate_types=${report.coordinate_types} candidate_counts_valid=${report.candidate_counts_valid} estimated_only=${report.estimated_only}`
);
console.log(
  `coordinate_extraction=${report.coordinate_extraction} frame_extraction=${report.frame_extraction} scene_extraction=${report.scene_extraction} ocr=${report.ocr} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.coordinate_extraction_id === plan.coordinate_extraction_id
  );
  console.log(
    `  ${plan.coordinate_extraction_id} ← ${plan.scene_detection_id}: ${validation?.status ?? 'FAIL'} strategy=${plan.coordinate_extraction_strategy} candidates=${plan.coordinate_candidates.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${COORDINATE_EXTRACTION_REGISTRY_PATH}`);
console.log(`report=${COORDINATE_EXTRACTION_REPORT_PATH}`);
console.log(`markdown=${COORDINATE_EXTRACTION_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== COORDINATE_EXTRACTION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.coordinate_extraction_plans !== 4 ||
  report.scene_detection_links !== 'PASS' ||
  report.sampling_links !== 'PASS' ||
  report.dry_run_links !== 'PASS' ||
  report.analysis_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.coordinate_types !== 'PASS' ||
  report.candidate_counts_valid !== 'PASS' ||
  report.estimated_only !== 'PASS'
) {
  console.error(
    `Expected coordinate_extraction_plans=4 scene_detection_links=PASS sampling_links=PASS dry_run_links=PASS analysis_links=PASS source_links=PASS coordinate_types=PASS candidate_counts_valid=PASS estimated_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
