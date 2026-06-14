import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';
import {
  LONG_FORM_CONTINUITY_SPEC_PATH,
  SHORT_FILM_BLUEPRINT_SCHEMA_PATH,
  SHORT_FILM_FOUNDATION_ARTIFACT_PATH,
  SHORT_FILM_FOUNDATION_REPORT_PATH,
  SHORT_FILM_INDEX_PATH,
  SHORT_FILM_LIBRARY_PATH,
  SHORT_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT,
  writeShortFilmProductionFoundation,
} from '../services/shortFilmProductionFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const stateBefore = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);

const report = writeShortFilmProductionFoundation(projectRoot);

const stateAfter = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);

if (stateBefore !== stateAfter) {
  console.error('POLICY VIOLATION: MV current state was modified');
  process.exit(1);
}

console.log(report.final_verdict);
console.log(
  `phase=${report.phase} status=${report.foundation_status} precheck_passed=${report.precheck.precheck_passed} archetype_count=${report.short_film_outputs.archetype_count} scene_range=${report.short_film_outputs.scene_count_range} fields_present=${report.expansion_design.fields_present_in_all_archetypes} short_film_foundation_ready=${report.short_film_foundation_ready}`
);
console.log(`library=${SHORT_FILM_LIBRARY_PATH}`);
console.log(`index=${SHORT_FILM_INDEX_PATH}`);
console.log(`schema=${SHORT_FILM_BLUEPRINT_SCHEMA_PATH}`);
console.log(`continuity_spec=${LONG_FORM_CONTINUITY_SPEC_PATH}`);
console.log(`report=${SHORT_FILM_FOUNDATION_REPORT_PATH}`);
console.log(`artifact=${SHORT_FILM_FOUNDATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== SHORT_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT) {
  console.error(`Expected verdict ${SHORT_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT}`);
  process.exit(1);
}
