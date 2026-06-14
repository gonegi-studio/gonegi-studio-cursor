import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  DIRECTOR_GRAMMAR_SCHEMA_PATH,
  extractAllDirectorGrammarProfiles,
  writeDirectorGrammarProfiles,
} from '../services/directorGrammarExtractor.js';
import {
  DIRECTOR_GRAMMAR_MD_PATH,
  DIRECTOR_GRAMMAR_PASS_VERDICT,
  DIRECTOR_GRAMMAR_REPORT_PATH,
  writeDirectorGrammarExtractionReport,
} from '../services/directorGrammarValidator.js';
import { FINAL_SET_PATH } from '../services/sourceVideoFinalSetBuilder.js';
import { FINALIZATION_REPORT_PATH } from '../services/sourceVideoFinalSetValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  DIRECTOR_GRAMMAR_SCHEMA_PATH,
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  FINAL_SET_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, FINALIZATION_REPORT_PATH))) {
  console.error('Missing upstream finalization report. Run npm run verify:source-video-finalization first.');
  process.exit(1);
}

const profiles = extractAllDirectorGrammarProfiles(projectRoot);
const written = writeDirectorGrammarProfiles(projectRoot, profiles);
const { report } = writeDirectorGrammarExtractionReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `families=${report.families} registry=${report.registry_status} no_gpu=${report.no_gpu} design_only=${report.design_only}`
);
console.log(
  `ghibli=${report.family_results.GHIBLI} shinkai=${report.family_results.SHINKAI} live_action=${report.family_results.LIVE_ACTION} mori=${report.family_results.MORI}`
);
for (const profile of profiles) {
  console.log(
    `  ${profile.source_family}: ${profile.grammar_id} sources=${profile.source_video_ids.length}`
  );
}
console.log(`written=${written.join(', ')}`);
console.log(`report=${DIRECTOR_GRAMMAR_REPORT_PATH}`);
console.log(`markdown=${DIRECTOR_GRAMMAR_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, DIRECTOR_GRAMMAR_REPORT_PATH))) {
  console.error('Director grammar extraction report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DIRECTOR_GRAMMAR_PASS_VERDICT) {
  process.exit(1);
}

if (report.families !== 4) {
  console.error(`Expected families=4, got ${report.families}`);
  process.exit(1);
}

process.exit(0);
