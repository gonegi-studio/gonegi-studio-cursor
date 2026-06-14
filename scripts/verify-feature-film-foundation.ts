import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FEATURE_FILM_CONTINUITY_SPEC_EXPORT_PATH,
  FEATURE_FILM_DEPENDENCY_SPEC_EXPORT_PATH,
  FEATURE_FILM_FOUNDATION_PASS_VERDICT,
  FEATURE_FILM_FOUNDATION_READY_STATUS,
  FEATURE_FILM_FOUNDATION_REPORT_PATH,
  FEATURE_FILM_FOUNDATION_PATH,
  FEATURE_FILM_SCALE_RULES_EXPORT_PATH,
  writeFeatureFilmFoundation,
} from '../services/featureFilmFoundation.js';
import { MEDIUM_FILM_BLUEPRINT_PATH } from '../services/mediumFilmBlueprintAssembly.js';
import {
  MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
  MEDIUM_FILM_FOUNDATION_REPORT_PATH,
} from '../services/mediumFilmProductionFoundation.js';
import {
  MEDIUM_FILM_PRODUCTION_READINESS_PATH,
  MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from '../services/mediumFilmProductionValidation.js';
import {
  MEDIUM_FILM_SCENE_REGISTRY_PATH,
} from '../services/mediumFilmSceneAssembly.js';
import {
  MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_SHOT_REGISTRY_PATH,
} from '../services/mediumFilmShotAssembly.js';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const mediumReadOnlyPaths = [
  MEDIUM_FILM_PRODUCTION_READINESS_PATH,
  MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
  MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
  MEDIUM_FILM_FOUNDATION_REPORT_PATH,
  MEDIUM_FILM_BLUEPRINT_PATH,
  MEDIUM_FILM_SCENE_REGISTRY_PATH,
  MEDIUM_FILM_SHOT_REGISTRY_PATH,
  MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  'exports/medium_film_production_validation/medium-film-continuity-audit.json',
  'exports/medium_film_production_validation/medium-film-callback-audit.json',
  'exports/medium_film_production_validation/medium-film-coverage-audit.json',
];

const before = Object.fromEntries(
  mediumReadOnlyPaths
    .filter((p) => fs.existsSync(path.join(projectRoot, p)))
    .map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);
const mvStateBefore = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);

const report = writeFeatureFilmFoundation(projectRoot);

for (const readOnlyPath of mediumReadOnlyPaths) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Medium Film artifact modified: ${readOnlyPath}`);
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

const validation = report.foundation_validation;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.foundation_status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `archetype_count=${report.feature_film_outputs.archetype_count}`,
    `continuity_spec_exists=${validation.continuity_spec_exists}`,
    `dependency_spec_exists=${validation.dependency_spec_exists}`,
    `feature_scale_rules_exists=${validation.feature_scale_rules_exists}`,
    `foundation_integrity=${validation.foundation_integrity}`,
    `foundation_traceability=${validation.foundation_traceability}`,
    `medium_outputs_mutation=0`,
    `feature_film_foundation_ready=${report.feature_film_foundation_ready}`,
  ].join(' ')
);
console.log(`foundation=${FEATURE_FILM_FOUNDATION_PATH}`);
console.log(`continuity_spec=${FEATURE_FILM_CONTINUITY_SPEC_EXPORT_PATH}`);
console.log(`dependency_spec=${FEATURE_FILM_DEPENDENCY_SPEC_EXPORT_PATH}`);
console.log(`scale_rules=${FEATURE_FILM_SCALE_RULES_EXPORT_PATH}`);
console.log(`report=${FEATURE_FILM_FOUNDATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.feature_film_outputs.archetype_count <= 0) {
  console.error('VERIFY FAIL: archetype_count>0');
  process.exit(1);
}
if (!validation.continuity_spec_exists) {
  console.error('VERIFY FAIL: continuity_spec_exists');
  process.exit(1);
}
if (!validation.dependency_spec_exists) {
  console.error('VERIFY FAIL: dependency_spec_exists');
  process.exit(1);
}
if (!validation.feature_scale_rules_exists) {
  console.error('VERIFY FAIL: feature_scale_rules_exists');
  process.exit(1);
}
if (validation.foundation_integrity !== 'PASS') {
  console.error('VERIFY FAIL: foundation_integrity=PASS');
  process.exit(1);
}
if (validation.foundation_traceability !== 'PASS') {
  console.error('VERIFY FAIL: foundation_traceability=PASS');
  process.exit(1);
}

if (report.final_verdict !== FEATURE_FILM_FOUNDATION_PASS_VERDICT) {
  console.error(`Expected verdict ${FEATURE_FILM_FOUNDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (report.foundation_status !== FEATURE_FILM_FOUNDATION_READY_STATUS) {
  console.error(`Expected status ${FEATURE_FILM_FOUNDATION_READY_STATUS}`);
  process.exit(1);
}
