import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLEND_CONTRACT_PATH } from '../services/directorGrammarBlendBuilder.js';
import { STATE_DRAFT_REGISTRY_PATH } from '../services/sourceVideoCoordinateToStateCompiler.js';
import {
  LIVING_WORLD_FOUNDATION_INDEX_PATH,
  TRANSLATION_CONTRACT_PATH,
  TRANSLATION_PROFILE_PATH,
  TRANSLATION_REGISTRY_PATH,
  TRANSLATION_SCHEMA_PATH,
  writeGonegiWorldTranslation,
} from '../services/gonegiWorldTranslationBuilder.js';
import {
  TRANSLATION_MD_PATH,
  TRANSLATION_PASS_VERDICT,
  TRANSLATION_REPORT_PATH,
  writeGonegiWorldTranslationReport,
} from '../services/gonegiWorldTranslationValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  STATE_DRAFT_REGISTRY_PATH,
  BLEND_CONTRACT_PATH,
  LIVING_WORLD_FOUNDATION_INDEX_PATH,
  TRANSLATION_SCHEMA_PATH,
  TRANSLATION_CONTRACT_PATH,
  TRANSLATION_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const profile = writeGonegiWorldTranslation(projectRoot);
const { report } = writeGonegiWorldTranslationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `translation_profiles=${report.translation_profiles} ghibli=${report.ghibli} shinkai=${report.shinkai} live_action=${report.live_action} mori=${report.mori}`
);
console.log(
  `identity_priority=${report.identity_priority} continuity_rules=${report.continuity_rules} target_world=${report.target_world} living_world_refs=${report.living_world_refs}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
console.log(`translation_id=${profile.translation_id} director_blend_ref=${profile.director_blend_ref}`);
console.log(`profile=${TRANSLATION_PROFILE_PATH}`);
console.log(`report=${TRANSLATION_REPORT_PATH}`);
console.log(`markdown=${TRANSLATION_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== TRANSLATION_PASS_VERDICT) {
  process.exit(1);
}

if (report.translation_profiles !== 1) {
  console.error(`Expected translation_profiles=1, got ${report.translation_profiles}`);
  process.exit(1);
}

process.exit(0);
