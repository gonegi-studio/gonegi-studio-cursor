import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSeedKeyframePlans,
  KEYFRAME_PLAN_REGISTRY_PATH,
  writeKeyframePlans,
} from '../services/keyframePlanBuilder.js';
import {
  KEYFRAME_PLAN_PASS_VERDICT,
  KEYFRAME_PLAN_REPORT_PATH,
  KEYFRAME_PLAN_SCHEMA_PATH,
  writeKeyframePlanBuilderReport,
} from '../services/keyframePlanValidator.js';
import { VIDEO_SHOT_PREPARATION_REPORT_PATH } from '../services/videoShotStateValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [KEYFRAME_PLAN_SCHEMA_PATH, KEYFRAME_PLAN_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required keyframe plan asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_SHOT_PREPARATION_REPORT_PATH))) {
  console.error(
    `Missing upstream video shot preparation report. Run npm run verify:video-shot-state first.`
  );
  process.exit(1);
}

const plans = buildSeedKeyframePlans(projectRoot);
const written = writeKeyframePlans(projectRoot, plans);
const report = writeKeyframePlanBuilderReport(projectRoot, plans);

console.log(report.final_verdict);
console.log(
  `plans=${report.plan_count} keyframes=${report.keyframe_count} continuity=${report.continuity_validation} identity=${report.identity_validation} camera=${report.camera_validation}`
);
for (const validation of report.plan_validations) {
  const plan = plans.find((p) => p.keyframe_plan_id === validation.keyframe_plan_id);
  console.log(
    `  ${validation.keyframe_plan_id}: ${validation.valid ? 'PASS' : 'FAIL'} (${plan?.keyframes.length ?? 0} keyframes)`
  );
}
console.log(`gpu_execution=${report.gpu_execution} planning_only=${report.planning_only}`);
console.log(`written=${written.join(', ')}`);
console.log(`report=${KEYFRAME_PLAN_REPORT_PATH}`);

if (!fs.existsSync(path.join(projectRoot, KEYFRAME_PLAN_REPORT_PATH))) {
  console.error('Keyframe plan builder report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== KEYFRAME_PLAN_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
