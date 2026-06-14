import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VIDEO_BLUEPRINT_PASS_VERDICT,
  VIDEO_BLUEPRINT_REPORT_PATH,
} from '../services/movieAnalysisVideoBlueprintValidator.js';
import {
  VIDEO_BLUEPRINT_REGISTRY_PATH,
} from '../services/movieAnalysisVideoBlueprintDesign.js';
import {
  RUNTIME_PACKAGE_MD_PATH,
  RUNTIME_PACKAGE_PASS_VERDICT,
  RUNTIME_PACKAGE_REPORT_PATH,
  writeMovieAnalysisRuntimePackageReport,
} from '../services/movieAnalysisRuntimePackageValidator.js';
import {
  RUNTIME_PACKAGE_REGISTRY_PATH,
  RUNTIME_PACKAGE_SCHEMA_PATH,
  writeMovieAnalysisRuntimePackagePlans,
} from '../services/movieAnalysisRuntimePackageDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  VIDEO_BLUEPRINT_REGISTRY_PATH,
  VIDEO_BLUEPRINT_REPORT_PATH,
  RUNTIME_PACKAGE_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const videoBlueprintReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_BLUEPRINT_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (videoBlueprintReport.final_verdict !== VIDEO_BLUEPRINT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${VIDEO_BLUEPRINT_REPORT_PATH} must have ${VIDEO_BLUEPRINT_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisRuntimePackagePlans(projectRoot);
const report = writeMovieAnalysisRuntimePackageReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `runtime_package_plans=${report.runtime_package_plans} video_blueprint_links=${report.video_blueprint_links} source_links=${report.source_links} package_sections=${report.package_sections} package_only=${report.package_only}`
);
console.log(
  `planning_only=${report.planning_only} runtime_execution=${report.runtime_execution} video_generation=${report.video_generation} gpu_execution=${report.gpu_execution} ocr=${report.ocr} external_call_allowed=${report.external_call_allowed}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.runtime_package_id === plan.runtime_package_id
  );
  console.log(
    `  ${plan.runtime_package_id} ← ${plan.video_blueprint_id}: ${validation?.status ?? 'FAIL'} scene=${plan.scene_package.length} character=${plan.character_package.length} camera=${plan.camera_package.length} emotion=${plan.emotion_package.length} transition=${plan.transition_package.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${RUNTIME_PACKAGE_REGISTRY_PATH}`);
console.log(`report=${RUNTIME_PACKAGE_REPORT_PATH}`);
console.log(`markdown=${RUNTIME_PACKAGE_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== RUNTIME_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.runtime_package_plans !== 4 ||
  report.video_blueprint_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.package_sections !== 'PASS' ||
  report.package_only !== 'PASS'
) {
  console.error(
    `Expected runtime_package_plans=4 video_blueprint_links=PASS source_links=PASS package_sections=PASS package_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
