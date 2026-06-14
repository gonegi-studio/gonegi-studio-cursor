import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLEND_PROFILE_PATH } from '../services/directorGrammarBlendBuilder.js';
import {
  COMPILER_MD_PATH,
  COMPILER_PASS_VERDICT,
  COMPILER_REPORT_PATH,
  writeSourceVideoGrammarToVideoStateReport,
} from '../services/sourceVideoGrammarToVideoStateValidator.js';
import {
  VIDEO_STATE_DEFAULTS_PATH,
  VIDEO_STATE_DEFAULTS_SCHEMA_PATH,
  writeVideoStateDefaults,
} from '../services/sourceVideoGrammarToVideoStateCompiler.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!fs.existsSync(path.join(projectRoot, BLEND_PROFILE_PATH))) {
  console.error(`Missing upstream blend profile: ${BLEND_PROFILE_PATH}`);
  console.error('Run npm run verify:director-grammar-blend first.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_STATE_DEFAULTS_SCHEMA_PATH))) {
  console.error(`Missing schema: ${VIDEO_STATE_DEFAULTS_SCHEMA_PATH}`);
  process.exit(1);
}

const defaults = writeVideoStateDefaults(projectRoot);
const { report } = writeSourceVideoGrammarToVideoStateReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `defaults_created=${report.defaults_created} blend_contract=${report.blend_contract} identity_priority=${report.identity_priority} video_state_ready=${report.video_state_ready}`
);
console.log(
  `family_provenance=${report.family_provenance} grammar_sources_linked=${report.grammar_sources_linked}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
console.log(`defaults_id=${defaults.defaults_id} source_blend_id=${defaults.source_blend_id}`);
console.log(`defaults=${VIDEO_STATE_DEFAULTS_PATH}`);
console.log(`report=${COMPILER_REPORT_PATH}`);
console.log(`markdown=${COMPILER_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== COMPILER_PASS_VERDICT) {
  process.exit(1);
}

if (!report.defaults_created) {
  console.error('Expected defaults_created=true');
  process.exit(1);
}

process.exit(0);
