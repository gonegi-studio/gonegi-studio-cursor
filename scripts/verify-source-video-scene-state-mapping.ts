import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVIE_COORDINATE_REPORT_PATH } from '../services/movieSceneCoordinateValidator.js';
import {
  buildSeedSceneStateMappings,
  SCENE_STATE_MAP_REGISTRY_PATH,
  SCENE_STATE_MAP_SCHEMA_PATH,
  writeSceneStateMappings,
} from '../services/sourceVideoSceneStateMapper.js';
import {
  SCENE_STATE_MAP_MD_PATH,
  SCENE_STATE_MAP_PASS_VERDICT,
  SCENE_STATE_MAP_REPORT_PATH,
  writeSceneStateMappingReport,
} from '../services/sourceVideoSceneStateMapValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [SCENE_STATE_MAP_SCHEMA_PATH, SCENE_STATE_MAP_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required mapping asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, MOVIE_COORDINATE_REPORT_PATH))) {
  console.error('Missing upstream movie coordinate report. Run npm run verify:movie-coordinate first.');
  process.exit(1);
}

const pairs = buildSeedSceneStateMappings(projectRoot);
const written = writeSceneStateMappings(projectRoot, pairs);
const { report } = writeSceneStateMappingReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `mappings=${report.mappings} mapped_scene_states=${report.mapped_scene_states} identity_priority=${report.identity_priority} scene_state_layers=${report.scene_state_layers} grammar_refs=${report.grammar_refs} registry=${report.registry_status}`
);
for (const pair of pairs) {
  const validation = report.mapping_validations.find(
    (v) => v.mapping_id === pair.mapping.mapping_id
  );
  console.log(
    `  ${pair.mapping.mapping_id} → ${pair.draft.scene_state_id}: ${validation?.valid ? 'PASS' : 'FAIL'}`
  );
}
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
console.log(`written_mappings=${written.mappings.join(', ')}`);
console.log(`written_drafts=${written.drafts.join(', ')}`);
console.log(`report=${SCENE_STATE_MAP_REPORT_PATH}`);
console.log(`markdown=${SCENE_STATE_MAP_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, SCENE_STATE_MAP_REPORT_PATH))) {
  console.error('Scene state mapping report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== SCENE_STATE_MAP_PASS_VERDICT) {
  process.exit(1);
}

if (report.mappings !== 3 || report.mapped_scene_states !== 3) {
  console.error(
    `Expected mappings=3 mapped_scene_states=3, got mappings=${report.mappings} mapped_scene_states=${report.mapped_scene_states}`
  );
  process.exit(1);
}

process.exit(0);
