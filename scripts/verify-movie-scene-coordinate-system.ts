import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIRECTOR_GRAMMAR_REPORT_PATH } from '../services/directorGrammarValidator.js';
import {
  buildSeedCoordinateTemplates,
  MOVIE_COORDINATE_REGISTRY_PATH,
  MOVIE_COORDINATE_SCHEMA_PATH,
  writeCoordinateTemplates,
} from '../services/movieSceneCoordinateBuilder.js';
import {
  MOVIE_COORDINATE_MD_PATH,
  MOVIE_COORDINATE_PASS_VERDICT,
  MOVIE_COORDINATE_REPORT_PATH,
  writeMovieSceneCoordinateSystemReport,
} from '../services/movieSceneCoordinateValidator.js';
import { FINAL_SET_PATH } from '../services/sourceVideoFinalSetBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  MOVIE_COORDINATE_SCHEMA_PATH,
  MOVIE_COORDINATE_REGISTRY_PATH,
  FINAL_SET_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, DIRECTOR_GRAMMAR_REPORT_PATH))) {
  console.error('Missing upstream director grammar report. Run npm run verify:director-grammar first.');
  process.exit(1);
}

const templates = buildSeedCoordinateTemplates(projectRoot);
const written = writeCoordinateTemplates(projectRoot, templates);
const { report } = writeMovieSceneCoordinateSystemReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `coordinate_templates=${report.coordinate_templates} registry=${report.registry_status} source_links=${report.source_links_status} grammar_refs=${report.grammar_refs_status}`
);
for (const template of templates) {
  const validation = report.template_validations.find(
    (v) => v.coordinate_id === template.coordinate_id
  );
  console.log(
    `  ${template.coordinate_id}: ${validation?.valid ? 'PASS' : 'FAIL'} source=${template.source_video_id} scene=${template.scene_index}`
  );
}
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
console.log(`written=${written.join(', ')}`);
console.log(`report=${MOVIE_COORDINATE_REPORT_PATH}`);
console.log(`markdown=${MOVIE_COORDINATE_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, MOVIE_COORDINATE_REPORT_PATH))) {
  console.error('Movie scene coordinate system report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MOVIE_COORDINATE_PASS_VERDICT) {
  process.exit(1);
}

if (report.coordinate_templates !== 3) {
  console.error(`Expected coordinate_templates=3, got ${report.coordinate_templates}`);
  process.exit(1);
}

process.exit(0);
