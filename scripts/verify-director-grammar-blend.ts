import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BLEND_CONTRACT_PATH,
  BLEND_REGISTRY_PATH,
  BLEND_SCHEMA_PATH,
  verifyDirectorGrammarPrecheck,
  writeDirectorGrammarBlend,
} from '../services/directorGrammarBlendBuilder.js';
import {
  BLEND_MD_PATH,
  BLEND_PASS_VERDICT,
  BLEND_REPORT_PATH,
  writeDirectorGrammarBlendReport,
} from '../services/directorGrammarBlendValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const precheckMissing = verifyDirectorGrammarPrecheck(projectRoot);
if (precheckMissing.length > 0) {
  console.error('PRECHECK FAILED — missing director grammar assets:');
  for (const rel of precheckMissing) {
    console.error(`  ${rel}`);
  }
  console.error('STOP DIRECTOR_GRAMMAR_BLEND_CONTRACT_V1');
  process.exit(1);
}

for (const required of [BLEND_SCHEMA_PATH, BLEND_CONTRACT_PATH, BLEND_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required blend asset: ${required}`);
    process.exit(1);
  }
}

const profile = writeDirectorGrammarBlend(projectRoot);
const { report } = writeDirectorGrammarBlendReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `blend_profiles=${report.blend_profiles} ghibli=${report.family_links.GHIBLI} shinkai=${report.family_links.SHINKAI} live_action=${report.family_links.LIVE_ACTION} mori=${report.family_links.MORI}`
);
console.log(
  `conflicts=${report.conflicts} identity_priority=${report.identity_priority} compatibility_score=${report.compatibility_score ?? 'n/a'} registry=${report.registry_status}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
console.log(`blend_id=${profile.blend_id}`);
console.log(`report=${BLEND_REPORT_PATH}`);
console.log(`markdown=${BLEND_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== BLEND_PASS_VERDICT) {
  process.exit(1);
}

if (report.blend_profiles !== 1) {
  console.error(`Expected blend_profiles=1, got ${report.blend_profiles}`);
  process.exit(1);
}

process.exit(0);
