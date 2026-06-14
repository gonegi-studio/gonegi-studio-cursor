import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_PACKAGE_PASS_VERDICT,
  GENERATION_PACKAGE_REPORT_PATH,
} from '../services/movieAnalysisGenerationPackageValidator.js';
import {
  GENERATION_PACKAGE_REGISTRY_PATH,
} from '../services/movieAnalysisGenerationPackageDesign.js';
import {
  GENERATION_BLUEPRINT_MD_PATH,
  GENERATION_BLUEPRINT_PASS_VERDICT,
  GENERATION_BLUEPRINT_REPORT_PATH,
  writeMovieAnalysisGenerationBlueprintReport,
} from '../services/movieAnalysisGenerationBlueprintValidator.js';
import {
  GENERATION_BLUEPRINT_REGISTRY_PATH,
  GENERATION_BLUEPRINT_SCHEMA_PATH,
  writeMovieAnalysisGenerationBlueprintPlans,
} from '../services/movieAnalysisGenerationBlueprintDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  GENERATION_PACKAGE_REGISTRY_PATH,
  GENERATION_PACKAGE_REPORT_PATH,
  GENERATION_BLUEPRINT_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const generationPackageReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GENERATION_PACKAGE_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (generationPackageReport.final_verdict !== GENERATION_PACKAGE_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${GENERATION_PACKAGE_REPORT_PATH} must have ${GENERATION_PACKAGE_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisGenerationBlueprintPlans(projectRoot);
const report = writeMovieAnalysisGenerationBlueprintReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `generation_blueprint_plans=${report.generation_blueprint_plans} generation_package_links=${report.generation_package_links} source_links=${report.source_links} blueprint_structures=${report.blueprint_structures} generation_blueprint_only=${report.generation_blueprint_only}`
);
console.log(
  `planning_only=${report.planning_only} estimated_only=${report.estimated_only} video_generation=${report.video_generation} image_generation=${report.image_generation} runtime_execution=${report.runtime_execution} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.generation_blueprint_id === plan.generation_blueprint_id
  );
  console.log(
    `  ${plan.generation_blueprint_id} ← ${plan.generation_package_id}: ${validation?.status ?? 'FAIL'} scene=${plan.scene_generation_structure.length} character=${plan.character_generation_structure.length} camera=${plan.camera_generation_structure.length} emotion=${plan.emotion_generation_structure.length} transition=${plan.transition_generation_structure.length} continuity=${plan.continuity_generation_structure.length} readiness=${plan.execution_readiness_structure.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${GENERATION_BLUEPRINT_REGISTRY_PATH}`);
console.log(`report=${GENERATION_BLUEPRINT_REPORT_PATH}`);
console.log(`markdown=${GENERATION_BLUEPRINT_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== GENERATION_BLUEPRINT_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.generation_blueprint_plans !== 4 ||
  report.generation_package_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.blueprint_structures !== 'PASS' ||
  report.generation_blueprint_only !== 'PASS'
) {
  console.error(
    `Expected generation_blueprint_plans=4 generation_package_links=PASS source_links=PASS blueprint_structures=PASS generation_blueprint_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
