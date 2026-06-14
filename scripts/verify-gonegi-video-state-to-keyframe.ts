import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KEYFRAME_PLAN_SCHEMA_PATH, VIDEO_STATE_DEFAULTS_PATH } from '../services/sourceVideoGrammarToVideoStateCompiler.js';
import { GONEGI_VIDEO_STATE_REGISTRY_PATH } from '../services/gonegiStateToVideoStateTranslator.js';
import {
  KEYFRAME_COMPILER_MD_PATH,
  KEYFRAME_COMPILER_PASS_VERDICT,
  KEYFRAME_COMPILER_REPORT_PATH,
  writeGonegiKeyframePlanReport,
} from '../services/gonegiKeyframePlanValidator.js';
import {
  GONEGI_KEYFRAME_PLAN_REGISTRY_PATH,
  GONEGI_KEYFRAME_PLAN_SCHEMA_PATH,
  writeGonegiKeyframePlans,
} from '../services/gonegiVideoStateToKeyframeCompiler.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  GONEGI_VIDEO_STATE_REGISTRY_PATH,
  VIDEO_STATE_DEFAULTS_PATH,
  KEYFRAME_PLAN_SCHEMA_PATH,
  GONEGI_KEYFRAME_PLAN_SCHEMA_PATH,
  GONEGI_KEYFRAME_PLAN_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const { plans, written } = writeGonegiKeyframePlans(projectRoot);
const report = writeGonegiKeyframePlanReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `keyframe_plans=${report.keyframe_plans} identity_locks=${report.identity_locks} continuity=${report.continuity} timestamps=${report.timestamps}`
);
console.log(
  `translation_trace=${report.translation_trace} replacement_trace=${report.replacement_trace} registry=${report.registry}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.gonegi_keyframe_plan_id === plan.gonegi_keyframe_plan_id
  );
  const roles = plan.keyframes.map((kf) => kf.keyframe_role).join('→');
  console.log(
    `  ${plan.gonegi_keyframe_plan_id} ← ${plan.source_gonegi_video_state_id}: ${validation?.status ?? 'FAIL'} ${plan.keyframe_count}kf [${roles}]`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`report=${KEYFRAME_COMPILER_REPORT_PATH}`);
console.log(`markdown=${KEYFRAME_COMPILER_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== KEYFRAME_COMPILER_PASS_VERDICT) {
  process.exit(1);
}

if (report.keyframe_plans !== 4) {
  console.error(`Expected keyframe_plans=4, got ${report.keyframe_plans}`);
  process.exit(1);
}

process.exit(0);
