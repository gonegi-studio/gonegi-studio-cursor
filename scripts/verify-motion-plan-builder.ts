import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KEYFRAME_PLAN_REPORT_PATH } from '../services/keyframePlanValidator.js';
import {
  buildSeedMotionPlans,
  MOTION_PLAN_REGISTRY_PATH,
  writeMotionPlans,
} from '../services/motionPlanBuilder.js';
import {
  MOTION_PLAN_PASS_VERDICT,
  MOTION_PLAN_REPORT_PATH,
  MOTION_PLAN_SCHEMA_PATH,
  writeMotionPlanBuilderReport,
} from '../services/motionPlanValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [MOTION_PLAN_SCHEMA_PATH, MOTION_PLAN_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required motion plan asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, KEYFRAME_PLAN_REPORT_PATH))) {
  console.error('Missing upstream keyframe plan report. Run npm run verify:keyframe-plan first.');
  process.exit(1);
}

const plans = buildSeedMotionPlans(projectRoot);
const written = writeMotionPlans(projectRoot, plans);
const report = writeMotionPlanBuilderReport(projectRoot, plans);

console.log(report.final_verdict);
console.log(
  `motion_plans=${report.motion_plan_count} segments=${report.segment_count} continuity=${report.continuity_validation} identity=${report.identity_validation} camera=${report.camera_validation} environment=${report.environment_validation}`
);
for (const validation of report.plan_validations) {
  const plan = plans.find((p) => p.motion_plan_id === validation.motion_plan_id);
  console.log(
    `  ${validation.motion_plan_id}: ${validation.valid ? 'PASS' : 'FAIL'} (${plan?.motion_segments.length ?? 0} segments)`
  );
}
console.log(`gpu_execution=${report.gpu_execution} planning_only=${report.planning_only}`);
console.log(`written=${written.join(', ')}`);
console.log(`report=${MOTION_PLAN_REPORT_PATH}`);

if (!fs.existsSync(path.join(projectRoot, MOTION_PLAN_REPORT_PATH))) {
  console.error('Motion plan builder report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MOTION_PLAN_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
