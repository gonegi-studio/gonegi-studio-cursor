import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXECUTION_READINESS_PASS_VERDICT,
  EXECUTION_READINESS_REPORT_PATH,
} from '../services/movieAnalysisExecutionReadinessValidator.js';
import {
  EXECUTION_READINESS_REGISTRY_PATH,
} from '../services/movieAnalysisExecutionReadinessDesign.js';
import {
  FINAL_RUNTIME_BUNDLE_MD_PATH,
  FINAL_RUNTIME_BUNDLE_PASS_VERDICT,
  FINAL_RUNTIME_BUNDLE_REPORT_PATH,
  writeMovieAnalysisFinalRuntimeBundleReport,
} from '../services/movieAnalysisFinalRuntimeBundleValidator.js';
import {
  FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
  FINAL_RUNTIME_BUNDLE_SCHEMA_PATH,
  writeMovieAnalysisFinalRuntimeBundlePlans,
} from '../services/movieAnalysisFinalRuntimeBundleDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  EXECUTION_READINESS_REGISTRY_PATH,
  EXECUTION_READINESS_REPORT_PATH,
  FINAL_RUNTIME_BUNDLE_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const executionReadinessReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, EXECUTION_READINESS_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (executionReadinessReport.final_verdict !== EXECUTION_READINESS_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${EXECUTION_READINESS_REPORT_PATH} must have ${EXECUTION_READINESS_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisFinalRuntimeBundlePlans(projectRoot);
const report = writeMovieAnalysisFinalRuntimeBundleReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `final_runtime_bundle_plans=${report.final_runtime_bundle_plans} execution_readiness_links=${report.execution_readiness_links} source_links=${report.source_links} bundle_sections=${report.bundle_sections} final_runtime_bundle_only=${report.final_runtime_bundle_only}`
);
console.log(
  `planning_only=${report.planning_only} estimated_only=${report.estimated_only} runtime_execution=${report.runtime_execution} video_generation=${report.video_generation} image_generation=${report.image_generation} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.final_runtime_bundle_id === plan.final_runtime_bundle_id
  );
  console.log(
    `  ${plan.final_runtime_bundle_id} ← ${plan.execution_readiness_id}: ${validation?.status ?? 'FAIL'} scene=${plan.scene_bundle.length} character=${plan.character_bundle.length} camera=${plan.camera_bundle.length} emotion=${plan.emotion_bundle.length} transition=${plan.transition_bundle.length} continuity=${plan.continuity_bundle.length} runtime=${plan.runtime_bundle.length} safety=${plan.safety_bundle.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${FINAL_RUNTIME_BUNDLE_REGISTRY_PATH}`);
console.log(`report=${FINAL_RUNTIME_BUNDLE_REPORT_PATH}`);
console.log(`markdown=${FINAL_RUNTIME_BUNDLE_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== FINAL_RUNTIME_BUNDLE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.final_runtime_bundle_plans !== 4 ||
  report.execution_readiness_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.bundle_sections !== 'PASS' ||
  report.final_runtime_bundle_only !== 'PASS'
) {
  console.error(
    `Expected final_runtime_bundle_plans=4 execution_readiness_links=PASS source_links=PASS bundle_sections=PASS final_runtime_bundle_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
