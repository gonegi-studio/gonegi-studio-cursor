import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';
import {
  MEDIUM_FILM_BLUEPRINT_SCHEMA_PATH,
  MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
  MEDIUM_FILM_FOUNDATION_REPORT_PATH,
  MEDIUM_FILM_FOUNDATION_READY_STATUS,
  MEDIUM_FILM_INDEX_PATH,
  MEDIUM_FILM_LIBRARY_PATH,
  MEDIUM_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT,
  writeMediumFilmProductionFoundation,
} from '../services/mediumFilmProductionFoundation.js';
import {
  SHORT_FILM_PRODUCTION_READINESS_PATH,
  SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from '../services/shortFilmProductionValidation.js';
import { SHORT_FILM_LIBRARY_PATH } from '../services/shortFilmProductionFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const SHORT_FILM_READONLY_PATHS = [
  SHORT_FILM_LIBRARY_PATH,
  SHORT_FILM_PRODUCTION_READINESS_PATH,
  SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
  'exports/short_film_foundation/long-form-continuity-specification.json',
  'exports/short_film_blueprint/short-film-blueprint.json',
  'exports/short_film_scene_assembly/short-film-scene-registry.json',
  'exports/short_film_shot_assembly/short-film-shot-registry.json',
];

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const shortFilmBefore = Object.fromEntries(
  SHORT_FILM_READONLY_PATHS.filter((p) => fs.existsSync(path.join(projectRoot, p))).map((p) => [
    p,
    fs.readFileSync(path.join(projectRoot, p), 'utf8'),
  ])
);
const mvStateBefore = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);

const report = writeMediumFilmProductionFoundation(projectRoot);

for (const [shortFilmPath, before] of Object.entries(shortFilmBefore)) {
  const after = fs.readFileSync(path.join(projectRoot, shortFilmPath), 'utf8');
  if (before !== after) {
    console.error(`POLICY VIOLATION: Short Film artifact modified: ${shortFilmPath}`);
    process.exit(1);
  }
}

const mvStateAfter = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);
if (mvStateBefore !== mvStateAfter) {
  console.error('POLICY VIOLATION: MV current state was modified');
  process.exit(1);
}

console.log(report.final_verdict);
console.log(
  `status=${report.foundation_status} precheck_passed=${report.precheck.precheck_passed} archetype_count=${report.medium_film_outputs.archetype_count} scene_range=${report.expansion_design.medium_film_scene_range} continuity_v2_ready=${report.foundation_validation.continuity_v2_ready} subplot_support_ready=${report.foundation_validation.subplot_support_ready} parallel_arc_support_ready=${report.foundation_validation.parallel_arc_support_ready} multi_callback_support_ready=${report.foundation_validation.multi_callback_support_ready} relationship_network_ready=${report.foundation_validation.relationship_network_ready} medium_film_extension_ready=${report.foundation_validation.medium_film_extension_ready} medium_film_foundation_ready=${report.medium_film_foundation_ready}`
);
console.log(`library=${MEDIUM_FILM_LIBRARY_PATH}`);
console.log(`index=${MEDIUM_FILM_INDEX_PATH}`);
console.log(`schema=${MEDIUM_FILM_BLUEPRINT_SCHEMA_PATH}`);
console.log(`continuity_spec_v2=${MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH}`);
console.log(`report=${MEDIUM_FILM_FOUNDATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MEDIUM_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT) {
  console.error(`Expected verdict ${MEDIUM_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (report.foundation_status !== MEDIUM_FILM_FOUNDATION_READY_STATUS) {
  console.error(`Expected status ${MEDIUM_FILM_FOUNDATION_READY_STATUS}`);
  process.exit(1);
}
