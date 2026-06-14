import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FEATURE_FILM_ACT_MAP_PATH,
  FEATURE_FILM_ARC_NETWORK_PATH,
  FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  FEATURE_FILM_BLUEPRINT_PATH,
  FEATURE_FILM_CALLBACK_LAYER_PATH,
} from '../services/featureFilmBlueprintAssembly.js';
import {
  FEATURE_ACT_DISTRIBUTION_PATH,
  FEATURE_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  FEATURE_FILM_SCENE_CONTINUITY_MAP_PATH,
  FEATURE_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  FEATURE_FILM_SCENE_REGISTRY_PATH,
  FEATURE_FILM_SCENE_SEQUENCE_PATH,
  FEATURE_SCENE_SCALE_RULES_PATH,
} from '../services/featureFilmSceneAssembly.js';
import {
  FEATURE_FILM_CALLBACK_AUDIT_PATH,
  FEATURE_FILM_CONTINUITY_AUDIT_PATH,
  FEATURE_FILM_COVERAGE_AUDIT_PATH,
  FEATURE_FILM_PRODUCTION_READINESS_PATH,
  FEATURE_FILM_PRODUCTION_READY_STATUS,
  FEATURE_FILM_PRODUCTION_VALIDATION_PASS_VERDICT,
  FEATURE_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
  FEATURE_FILM_SHOT_AUDIT_PATH,
  writeFeatureFilmProductionValidation,
} from '../services/featureFilmProductionValidation.js';
import {
  FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  FEATURE_FILM_SHOT_CONTINUITY_MAP_PATH,
  FEATURE_FILM_SHOT_COVERAGE_MAP_PATH,
  FEATURE_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
  FEATURE_FILM_SHOT_REGISTRY_PATH,
  FEATURE_FILM_SHOT_SEQUENCE_PATH,
  FEATURE_SHOT_DENSITY_BY_SCENE_TYPE_PATH,
  FEATURE_SHOT_PER_SCENE_RULES_PATH,
  FEATURE_SHOT_SCALE_RULES_PATH,
} from '../services/featureFilmShotAssembly.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const readOnlyPaths = [
  FEATURE_FILM_SHOT_SEQUENCE_PATH,
  FEATURE_FILM_SHOT_REGISTRY_PATH,
  FEATURE_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
  FEATURE_FILM_SHOT_CONTINUITY_MAP_PATH,
  FEATURE_FILM_SHOT_COVERAGE_MAP_PATH,
  FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  FEATURE_SHOT_SCALE_RULES_PATH,
  FEATURE_SHOT_PER_SCENE_RULES_PATH,
  FEATURE_SHOT_DENSITY_BY_SCENE_TYPE_PATH,
  FEATURE_FILM_SCENE_SEQUENCE_PATH,
  FEATURE_FILM_SCENE_REGISTRY_PATH,
  FEATURE_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  FEATURE_FILM_SCENE_CONTINUITY_MAP_PATH,
  FEATURE_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  FEATURE_SCENE_SCALE_RULES_PATH,
  FEATURE_ACT_DISTRIBUTION_PATH,
  FEATURE_FILM_BLUEPRINT_PATH,
  FEATURE_FILM_ACT_MAP_PATH,
  FEATURE_FILM_ARC_NETWORK_PATH,
  FEATURE_FILM_CALLBACK_LAYER_PATH,
  FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
];

const before = Object.fromEntries(
  readOnlyPaths
    .filter((p) => fs.existsSync(path.join(projectRoot, p)))
    .map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeFeatureFilmProductionValidation(projectRoot);

for (const readOnlyPath of readOnlyPaths) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Read-only artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `continuity_dimension_count=${summary.continuity_dimension_count}`,
    `critical_continuity_break_count=${summary.critical_continuity_break_count}`,
    `callback_resolution_ratio=${summary.callback_resolution_ratio}`,
    `legacy_callback_integrity=${summary.legacy_callback_integrity}`,
    `world_state_integrity=${summary.world_state_integrity}`,
    `theme_arc_integrity=${summary.theme_arc_integrity}`,
    `coverage_collapse_count=${summary.coverage_collapse_count}`,
    `dependency_integrity=${summary.dependency_integrity}`,
    `orphan_scene_count=${summary.orphan_scene_count}`,
    `orphan_shot_count=${summary.orphan_shot_count}`,
    `shot_scale_valid=${summary.shot_scale_valid}`,
    `shot_per_scene_valid=${summary.shot_per_scene_valid}`,
    `shot_density_valid=${summary.shot_density_valid}`,
    `traceability_integrity=${summary.traceability_integrity}`,
    `production_readiness_score=${summary.production_readiness_score}`,
    `pass_rules_met=${summary.pass_rules_met}`,
    `shot_mutation=0`,
    `feature_film_production_ready=${report.feature_film_production_ready}`,
  ].join(' ')
);
console.log(`production_readiness=${FEATURE_FILM_PRODUCTION_READINESS_PATH}`);
console.log(`continuity_audit=${FEATURE_FILM_CONTINUITY_AUDIT_PATH}`);
console.log(`callback_audit=${FEATURE_FILM_CALLBACK_AUDIT_PATH}`);
console.log(`coverage_audit=${FEATURE_FILM_COVERAGE_AUDIT_PATH}`);
console.log(`shot_audit=${FEATURE_FILM_SHOT_AUDIT_PATH}`);
console.log(`report=${FEATURE_FILM_PRODUCTION_VALIDATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (summary.continuity_dimension_count < 14) {
  console.error('VERIFY FAIL: continuity_dimension_count>=14');
  process.exit(1);
}
if (summary.critical_continuity_break_count !== 0) {
  console.error('VERIFY FAIL: critical_continuity_break_count=0');
  process.exit(1);
}
if (summary.callback_resolution_ratio < 0.9) {
  console.error('VERIFY FAIL: callback_resolution_ratio>=0.90');
  process.exit(1);
}
if (summary.legacy_callback_integrity !== 'PASS') {
  console.error('VERIFY FAIL: legacy_callback_integrity=PASS');
  process.exit(1);
}
if (summary.world_state_integrity !== 'PASS') {
  console.error('VERIFY FAIL: world_state_integrity=PASS');
  process.exit(1);
}
if (summary.theme_arc_integrity !== 'PASS') {
  console.error('VERIFY FAIL: theme_arc_integrity=PASS');
  process.exit(1);
}
if (summary.coverage_collapse_count !== 0) {
  console.error('VERIFY FAIL: coverage_collapse_count=0');
  process.exit(1);
}
if (summary.dependency_integrity !== 'PASS') {
  console.error('VERIFY FAIL: dependency_integrity=PASS');
  process.exit(1);
}
if (summary.orphan_scene_count !== 0) {
  console.error('VERIFY FAIL: orphan_scene_count=0');
  process.exit(1);
}
if (summary.orphan_shot_count !== 0) {
  console.error('VERIFY FAIL: orphan_shot_count=0');
  process.exit(1);
}
if (!summary.shot_scale_valid) {
  console.error('VERIFY FAIL: shot_scale_valid');
  process.exit(1);
}
if (!summary.shot_per_scene_valid) {
  console.error('VERIFY FAIL: shot_per_scene_valid');
  process.exit(1);
}
if (!summary.shot_density_valid) {
  console.error('VERIFY FAIL: shot_density_valid');
  process.exit(1);
}
if (summary.traceability_integrity !== 'PASS') {
  console.error('VERIFY FAIL: traceability_integrity=PASS');
  process.exit(1);
}
if (summary.production_readiness_score < 90) {
  console.error('VERIFY FAIL: production_readiness_score>=90');
  process.exit(1);
}

if (report.final_verdict !== FEATURE_FILM_PRODUCTION_VALIDATION_PASS_VERDICT) {
  console.error(`Expected verdict ${FEATURE_FILM_PRODUCTION_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== FEATURE_FILM_PRODUCTION_READY_STATUS) {
  console.error(`Expected status ${FEATURE_FILM_PRODUCTION_READY_STATUS}`);
  process.exit(1);
}
