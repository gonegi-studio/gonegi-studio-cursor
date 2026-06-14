import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FEATURE_CONTINUITY_SPEC_DATASET_PATH,
  FEATURE_DEPENDENCY_SPEC_DATASET_PATH,
  FEATURE_FILM_CONTINUITY_SPEC_EXPORT_PATH,
  FEATURE_FILM_DEPENDENCY_SPEC_EXPORT_PATH,
  FEATURE_FILM_FOUNDATION_PATH,
  FEATURE_FILM_FOUNDATION_REPORT_PATH,
  FEATURE_FILM_INDEX_PATH,
  FEATURE_FILM_LIBRARY_PATH,
  FEATURE_FILM_SCALE_RULES_EXPORT_PATH,
  FEATURE_SCALE_RULES_DATASET_PATH,
} from '../services/featureFilmFoundation.js';
import {
  FEATURE_FILM_ACT_MAP_PATH,
  FEATURE_FILM_ARC_NETWORK_PATH,
  FEATURE_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT,
  FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  FEATURE_FILM_BLUEPRINT_PATH,
  FEATURE_FILM_BLUEPRINT_READY_STATUS,
  FEATURE_FILM_CALLBACK_LAYER_PATH,
  writeFeatureFilmBlueprintAssembly,
} from '../services/featureFilmBlueprintAssembly.js';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';
import {
  MEDIUM_FILM_PRODUCTION_READINESS_PATH,
  MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from '../services/mediumFilmProductionValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const foundationReadOnlyPaths = [
  FEATURE_FILM_LIBRARY_PATH,
  FEATURE_FILM_INDEX_PATH,
  FEATURE_SCALE_RULES_DATASET_PATH,
  FEATURE_CONTINUITY_SPEC_DATASET_PATH,
  FEATURE_DEPENDENCY_SPEC_DATASET_PATH,
  FEATURE_FILM_FOUNDATION_REPORT_PATH,
  FEATURE_FILM_FOUNDATION_PATH,
  FEATURE_FILM_CONTINUITY_SPEC_EXPORT_PATH,
  FEATURE_FILM_DEPENDENCY_SPEC_EXPORT_PATH,
  FEATURE_FILM_SCALE_RULES_EXPORT_PATH,
  MEDIUM_FILM_PRODUCTION_READINESS_PATH,
  MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
  MV_PRODUCTION_READY_CURRENT_STATE_PATH,
];

const before = Object.fromEntries(
  foundationReadOnlyPaths
    .filter((p) => fs.existsSync(path.join(projectRoot, p)))
    .map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeFeatureFilmBlueprintAssembly(projectRoot);

for (const readOnlyPath of foundationReadOnlyPaths) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Read-only artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const summary = report.assembly_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `archetype_count=${summary.archetype_count}`,
    `blueprint_integrity=${summary.blueprint_integrity}`,
    `dependency_integrity=${summary.dependency_integrity}`,
    `traceability_integrity=${summary.traceability_integrity}`,
    `continuity_dimension_count=${summary.continuity_dimension_count}`,
    `foundation_mutation=0`,
    `feature_film_blueprint_ready=${report.feature_film_blueprint_ready}`,
  ].join(' ')
);
console.log(`blueprint=${FEATURE_FILM_BLUEPRINT_PATH}`);
console.log(`act_map=${FEATURE_FILM_ACT_MAP_PATH}`);
console.log(`arc_network=${FEATURE_FILM_ARC_NETWORK_PATH}`);
console.log(`callback_layer=${FEATURE_FILM_CALLBACK_LAYER_PATH}`);
console.log(`report=${FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (summary.archetype_count !== 3) {
  console.error('VERIFY FAIL: archetype_count=3');
  process.exit(1);
}
if (summary.blueprint_integrity !== 'PASS') {
  console.error('VERIFY FAIL: blueprint_integrity=PASS');
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, FEATURE_FILM_ACT_MAP_PATH))) {
  console.error('VERIFY FAIL: act_map_exists');
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, FEATURE_FILM_ARC_NETWORK_PATH))) {
  console.error('VERIFY FAIL: arc_network_exists');
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, FEATURE_FILM_CALLBACK_LAYER_PATH))) {
  console.error('VERIFY FAIL: callback_layer_exists');
  process.exit(1);
}
if (summary.dependency_integrity !== 'PASS') {
  console.error('VERIFY FAIL: dependency_integrity=PASS');
  process.exit(1);
}
if (summary.continuity_dimension_count < 14) {
  console.error('VERIFY FAIL: continuity_dimension_count>=14');
  process.exit(1);
}
if (summary.traceability_integrity !== 'PASS') {
  console.error('VERIFY FAIL: traceability_integrity=PASS');
  process.exit(1);
}

if (report.final_verdict !== FEATURE_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT) {
  console.error(`Expected verdict ${FEATURE_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== FEATURE_FILM_BLUEPRINT_READY_STATUS) {
  console.error(`Expected status ${FEATURE_FILM_BLUEPRINT_READY_STATUS}`);
  process.exit(1);
}
