import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLEND_PROFILE_PATH } from '../services/directorGrammarBlendBuilder.js';
import { GONEGI_STATE_REGISTRY_PATH } from '../services/sourceStateToGonegiStateCompiler.js';
import { VIDEO_STATE_DEFAULTS_PATH } from '../services/sourceVideoGrammarToVideoStateCompiler.js';
import {
  TRANSLATOR_MD_PATH,
  TRANSLATOR_PASS_VERDICT,
  TRANSLATOR_REPORT_PATH,
  writeGonegiVideoStateReport,
} from '../services/gonegiVideoStateValidator.js';
import {
  GONEGI_VIDEO_STATE_REGISTRY_PATH,
  GONEGI_VIDEO_STATE_SCHEMA_PATH,
  writeGonegiVideoStates,
} from '../services/gonegiStateToVideoStateTranslator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  GONEGI_STATE_REGISTRY_PATH,
  VIDEO_STATE_DEFAULTS_PATH,
  BLEND_PROFILE_PATH,
  GONEGI_VIDEO_STATE_SCHEMA_PATH,
  GONEGI_VIDEO_STATE_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const { states, written } = writeGonegiVideoStates(projectRoot);
const report = writeGonegiVideoStateReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `video_states=${report.video_states} gonegi_states=${report.gonegi_states} director_blend=${report.director_blend} video_defaults=${report.video_defaults} identity_priority=${report.identity_priority}`
);
console.log(`continuity=${report.continuity} registry=${report.registry}`);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
for (const state of states) {
  const validation = report.state_validations.find(
    (v) => v.gonegi_video_state_id === state.gonegi_video_state_id
  );
  const duration = state.video_parameters.duration_seconds;
  const keyframes = state.video_parameters.keyframe_count;
  console.log(
    `  ${state.gonegi_video_state_id} ← ${state.gonegi_state_id}: ${validation?.status ?? 'FAIL'} duration=${duration}s keyframes=${keyframes}`
  );
}
console.log(`written_states=${written.join(', ')}`);
console.log(`report=${TRANSLATOR_REPORT_PATH}`);
console.log(`markdown=${TRANSLATOR_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== TRANSLATOR_PASS_VERDICT) {
  process.exit(1);
}

if (report.video_states !== 4) {
  console.error(`Expected video_states=4, got ${report.video_states}`);
  process.exit(1);
}

process.exit(0);
