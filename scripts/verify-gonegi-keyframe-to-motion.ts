import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLEND_PROFILE_PATH } from '../services/directorGrammarBlendBuilder.js';
import { GONEGI_KEYFRAME_PLAN_REGISTRY_PATH } from '../services/gonegiVideoStateToKeyframeCompiler.js';
import {
  MOTION_PLAN_SCHEMA_PATH,
  VIDEO_STATE_DEFAULTS_PATH,
} from '../services/sourceVideoGrammarToVideoStateCompiler.js';
import {
  MOTION_COMPILER_MD_PATH,
  MOTION_COMPILER_PASS_VERDICT,
  MOTION_COMPILER_REPORT_PATH,
  writeGonegiMotionPlanReport,
} from '../services/gonegiMotionPlanValidator.js';
import {
  GONEGI_MOTION_PLAN_REGISTRY_PATH,
  GONEGI_MOTION_PLAN_SCHEMA_PATH,
  writeGonegiMotionPlans,
} from '../services/gonegiKeyframeToMotionCompiler.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  GONEGI_KEYFRAME_PLAN_REGISTRY_PATH,
  VIDEO_STATE_DEFAULTS_PATH,
  MOTION_PLAN_SCHEMA_PATH,
  BLEND_PROFILE_PATH,
  GONEGI_MOTION_PLAN_SCHEMA_PATH,
  GONEGI_MOTION_PLAN_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const { plans, written } = writeGonegiMotionPlans(projectRoot);
const report = writeGonegiMotionPlanReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `motion_plans=${report.motion_plans} identity_locks=${report.identity_locks} continuity=${report.continuity} segment_counts=${report.segment_counts}`
);
console.log(
  `timestamps=${report.timestamps} translation_trace=${report.translation_trace} replacement_trace=${report.replacement_trace} registry=${report.registry}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.gonegi_motion_plan_id === plan.gonegi_motion_plan_id
  );
  const categories = plan.motion_segments
    .map((s) => s.camera_motion.motion_category)
    .join(',');
  console.log(
    `  ${plan.gonegi_motion_plan_id} ← ${plan.source_keyframe_plan_id}: ${validation?.status ?? 'FAIL'} segments=${plan.segment_count} camera=[${categories}]`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`report=${MOTION_COMPILER_REPORT_PATH}`);
console.log(`markdown=${MOTION_COMPILER_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MOTION_COMPILER_PASS_VERDICT) {
  process.exit(1);
}

if (report.motion_plans !== 4) {
  console.error(`Expected motion_plans=4, got ${report.motion_plans}`);
  process.exit(1);
}

process.exit(0);
