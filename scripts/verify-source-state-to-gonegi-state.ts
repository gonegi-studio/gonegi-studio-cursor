import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLEND_PROFILE_PATH } from '../services/directorGrammarBlendBuilder.js';
import { REPLACEMENT_CONTRACT_PATH } from '../services/characterReplacementContractBuilder.js';
import { TRANSLATION_PROFILE_PATH } from '../services/gonegiWorldTranslationBuilder.js';
import { VIDEO_STATE_DEFAULTS_PATH } from '../services/sourceVideoGrammarToVideoStateCompiler.js';
import { STATE_DRAFT_REGISTRY_PATH } from '../services/sourceVideoCoordinateToStateCompiler.js';
import {
  GONEGI_COMPILER_MD_PATH,
  GONEGI_COMPILER_PASS_VERDICT,
  GONEGI_COMPILER_REPORT_PATH,
  writeGonegiSceneStateReport,
} from '../services/gonegiSceneStateValidator.js';
import {
  GONEGI_STATE_REGISTRY_PATH,
  GONEGI_STATE_SCHEMA_PATH,
  writeGonegiSceneStates,
} from '../services/sourceStateToGonegiStateCompiler.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  STATE_DRAFT_REGISTRY_PATH,
  TRANSLATION_PROFILE_PATH,
  REPLACEMENT_CONTRACT_PATH,
  VIDEO_STATE_DEFAULTS_PATH,
  BLEND_PROFILE_PATH,
  GONEGI_STATE_SCHEMA_PATH,
  GONEGI_STATE_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const { states, written } = writeGonegiSceneStates(projectRoot);
const report = writeGonegiSceneStateReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `gonegi_states=${report.gonegi_states} world_translation=${report.world_translation} character_replacement=${report.character_replacement} identity_priority=${report.identity_priority}`
);
console.log(
  `duplicate_guard=${report.duplicate_guard} continuity=${report.continuity} registry=${report.registry}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
for (const state of states) {
  const validation = report.state_validations.find((v) => v.gonegi_state_id === state.gonegi_state_id);
  const cast = state.character_state.active_character_ids.join(',');
  console.log(
    `  ${state.gonegi_state_id} ← ${state.source_state_draft_id}: ${validation?.status ?? 'FAIL'} cast=[${cast}]`
  );
}
console.log(`written_states=${written.join(', ')}`);
console.log(`report=${GONEGI_COMPILER_REPORT_PATH}`);
console.log(`markdown=${GONEGI_COMPILER_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== GONEGI_COMPILER_PASS_VERDICT) {
  process.exit(1);
}

if (report.gonegi_states !== 4) {
  console.error(`Expected gonegi_states=4, got ${report.gonegi_states}`);
  process.exit(1);
}

process.exit(0);
