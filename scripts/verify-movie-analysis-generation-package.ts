import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RUNTIME_PACKAGE_PASS_VERDICT,
  RUNTIME_PACKAGE_REPORT_PATH,
} from '../services/movieAnalysisRuntimePackageValidator.js';
import {
  RUNTIME_PACKAGE_REGISTRY_PATH,
} from '../services/movieAnalysisRuntimePackageDesign.js';
import {
  GENERATION_PACKAGE_MD_PATH,
  GENERATION_PACKAGE_PASS_VERDICT,
  GENERATION_PACKAGE_REPORT_PATH,
  writeMovieAnalysisGenerationPackageReport,
} from '../services/movieAnalysisGenerationPackageValidator.js';
import {
  GENERATION_PACKAGE_REGISTRY_PATH,
  GENERATION_PACKAGE_SCHEMA_PATH,
  writeMovieAnalysisGenerationPackagePlans,
} from '../services/movieAnalysisGenerationPackageDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  RUNTIME_PACKAGE_REGISTRY_PATH,
  RUNTIME_PACKAGE_REPORT_PATH,
  GENERATION_PACKAGE_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const runtimePackageReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, RUNTIME_PACKAGE_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (runtimePackageReport.final_verdict !== RUNTIME_PACKAGE_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${RUNTIME_PACKAGE_REPORT_PATH} must have ${RUNTIME_PACKAGE_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisGenerationPackagePlans(projectRoot);
const report = writeMovieAnalysisGenerationPackageReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `generation_package_plans=${report.generation_package_plans} runtime_package_links=${report.runtime_package_links} source_links=${report.source_links} package_sections=${report.package_sections} generation_package_only=${report.generation_package_only}`
);
console.log(
  `planning_only=${report.planning_only} estimated_only=${report.estimated_only} video_generation=${report.video_generation} image_generation=${report.image_generation} runtime_execution=${report.runtime_execution} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.generation_package_id === plan.generation_package_id
  );
  console.log(
    `  ${plan.generation_package_id} ← ${plan.runtime_package_id}: ${validation?.status ?? 'FAIL'} scene=${plan.scene_generation_package.length} character=${plan.character_generation_package.length} camera=${plan.camera_generation_package.length} emotion=${plan.emotion_generation_package.length} transition=${plan.transition_generation_package.length} continuity=${plan.continuity_generation_package.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${GENERATION_PACKAGE_REGISTRY_PATH}`);
console.log(`report=${GENERATION_PACKAGE_REPORT_PATH}`);
console.log(`markdown=${GENERATION_PACKAGE_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== GENERATION_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.generation_package_plans !== 4 ||
  report.runtime_package_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.package_sections !== 'PASS' ||
  report.generation_package_only !== 'PASS'
) {
  console.error(
    `Expected generation_package_plans=4 runtime_package_links=PASS source_links=PASS package_sections=PASS generation_package_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
