import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLEND_CONTRACT_PATH } from '../services/directorGrammarBlendBuilder.js';
import { COORDINATE_REGISTRY_PATH } from '../services/sourceVideoSegmentToCoordinateCompiler.js';
import { VIDEO_STATE_DEFAULTS_PATH } from '../services/sourceVideoGrammarToVideoStateCompiler.js';
import { SCENE_STATE_SCHEMA_PATH } from '../services/sourceVideoSceneStateMapper.js';
import {
  STATE_COMPILER_MD_PATH,
  STATE_COMPILER_PASS_VERDICT,
  STATE_COMPILER_REPORT_PATH,
  writeSourceVideoCoordinateToStateReport,
} from '../services/sourceVideoCoordinateToStateValidator.js';
import {
  STATE_DRAFT_REGISTRY_PATH,
  STATE_DRAFT_SCHEMA_PATH,
  writeStateDrafts,
} from '../services/sourceVideoCoordinateToStateCompiler.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  COORDINATE_REGISTRY_PATH,
  SCENE_STATE_SCHEMA_PATH,
  VIDEO_STATE_DEFAULTS_PATH,
  BLEND_CONTRACT_PATH,
  STATE_DRAFT_SCHEMA_PATH,
  STATE_DRAFT_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const { drafts, written } = writeStateDrafts(projectRoot);
const report = writeSourceVideoCoordinateToStateReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `state_drafts=${report.state_drafts} scene_state_layers=${report.scene_state_layers} identity_priority=${report.identity_priority} director_blend=${report.director_blend}`
);
console.log(
  `video_defaults=${report.video_defaults} coordinate_trace=${report.coordinate_trace} isolated_drafts=${report.isolated_drafts}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
for (const draft of drafts) {
  const validation = report.draft_validations.find((v) => v.state_draft_id === draft.state_draft_id);
  console.log(
    `  ${draft.state_draft_id} ← ${draft.source_coordinate_record_id}: ${validation?.status ?? 'FAIL'}`
  );
}
console.log(`written_drafts=${written.join(', ')}`);
console.log(`report=${STATE_COMPILER_REPORT_PATH}`);
console.log(`markdown=${STATE_COMPILER_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== STATE_COMPILER_PASS_VERDICT) {
  process.exit(1);
}

if (report.state_drafts !== 4) {
  console.error(`Expected state_drafts=4, got ${report.state_drafts}`);
  process.exit(1);
}

process.exit(0);
