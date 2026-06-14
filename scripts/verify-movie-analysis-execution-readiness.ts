import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_BLUEPRINT_PASS_VERDICT,
  GENERATION_BLUEPRINT_REPORT_PATH,
} from '../services/movieAnalysisGenerationBlueprintValidator.js';
import {
  GENERATION_BLUEPRINT_REGISTRY_PATH,
} from '../services/movieAnalysisGenerationBlueprintDesign.js';
import {
  EXECUTION_READINESS_MD_PATH,
  EXECUTION_READINESS_PASS_VERDICT,
  EXECUTION_READINESS_REPORT_PATH,
  writeMovieAnalysisExecutionReadinessReport,
} from '../services/movieAnalysisExecutionReadinessValidator.js';
import {
  EXECUTION_READINESS_REGISTRY_PATH,
  EXECUTION_READINESS_SCHEMA_PATH,
  writeMovieAnalysisExecutionReadinessPlans,
} from '../services/movieAnalysisExecutionReadinessDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  GENERATION_BLUEPRINT_REGISTRY_PATH,
  GENERATION_BLUEPRINT_REPORT_PATH,
  EXECUTION_READINESS_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const generationBlueprintReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GENERATION_BLUEPRINT_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (generationBlueprintReport.final_verdict !== GENERATION_BLUEPRINT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${GENERATION_BLUEPRINT_REPORT_PATH} must have ${GENERATION_BLUEPRINT_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisExecutionReadinessPlans(projectRoot);
const report = writeMovieAnalysisExecutionReadinessReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `execution_readiness_plans=${report.execution_readiness_plans} generation_blueprint_links=${report.generation_blueprint_links} source_links=${report.source_links} readiness_sections=${report.readiness_sections} execution_readiness_only=${report.execution_readiness_only}`
);
console.log(
  `planning_only=${report.planning_only} estimated_only=${report.estimated_only} runtime_execution=${report.runtime_execution} video_generation=${report.video_generation} image_generation=${report.image_generation} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.execution_readiness_id === plan.execution_readiness_id
  );
  console.log(
    `  ${plan.execution_readiness_id} ← ${plan.generation_blueprint_id}: ${validation?.status ?? 'FAIL'} scene=${plan.scene_readiness.length} character=${plan.character_readiness.length} camera=${plan.camera_readiness.length} emotion=${plan.emotion_readiness.length} transition=${plan.transition_readiness.length} continuity=${plan.continuity_readiness.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${EXECUTION_READINESS_REGISTRY_PATH}`);
console.log(`report=${EXECUTION_READINESS_REPORT_PATH}`);
console.log(`markdown=${EXECUTION_READINESS_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== EXECUTION_READINESS_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.execution_readiness_plans !== 4 ||
  report.generation_blueprint_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.readiness_sections !== 'PASS' ||
  report.execution_readiness_only !== 'PASS'
) {
  console.error(
    `Expected execution_readiness_plans=4 generation_blueprint_links=PASS source_links=PASS readiness_sections=PASS execution_readiness_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
