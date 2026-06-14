import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MEDIUM_FILM_ACT_MAP_PATH,
  MEDIUM_FILM_ARC_NETWORK_PATH,
  MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_BLUEPRINT_PATH,
  MEDIUM_FILM_CONTINUITY_MAP_PATH,
} from '../services/mediumFilmBlueprintAssembly.js';
import {
  MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
  MEDIUM_FILM_FOUNDATION_REPORT_PATH,
} from '../services/mediumFilmProductionFoundation.js';
import {
  MEDIUM_FILM_SCENE_ARC_NETWORK_PATH,
  MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_SCENE_CONTINUITY_MAP_PATH,
  MEDIUM_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  MEDIUM_FILM_SCENE_REGISTRY_PATH,
  MEDIUM_FILM_SCENE_SEQUENCE_PATH,
} from '../services/mediumFilmSceneAssembly.js';
import {
  MEDIUM_FILM_SHOT_ASSEMBLY_PASS_VERDICT,
  MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_SHOT_READY_STATUS,
  MEDIUM_FILM_SHOT_SEQUENCE_PATH,
  writeMediumFilmShotAssembly,
} from '../services/mediumFilmShotAssembly.js';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';
import { SHORT_FILM_PRODUCTION_READINESS_PATH } from '../services/shortFilmProductionValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const readOnlyPaths = [
  MEDIUM_FILM_SCENE_SEQUENCE_PATH,
  MEDIUM_FILM_SCENE_REGISTRY_PATH,
  MEDIUM_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  MEDIUM_FILM_SCENE_CONTINUITY_MAP_PATH,
  MEDIUM_FILM_SCENE_ARC_NETWORK_PATH,
  MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_BLUEPRINT_PATH,
  MEDIUM_FILM_ACT_MAP_PATH,
  MEDIUM_FILM_CONTINUITY_MAP_PATH,
  MEDIUM_FILM_ARC_NETWORK_PATH,
  MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
  MEDIUM_FILM_FOUNDATION_REPORT_PATH,
  MV_PRODUCTION_READY_CURRENT_STATE_PATH,
  SHORT_FILM_PRODUCTION_READINESS_PATH,
];

const before = Object.fromEntries(
  readOnlyPaths
    .filter((p) => fs.existsSync(path.join(projectRoot, p)))
    .map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeMediumFilmShotAssembly(projectRoot);

for (const readOnlyPath of readOnlyPaths) {
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
    `total_scene_count=${summary.total_scene_count}`,
    `total_shot_count=${summary.total_shot_count}`,
    `continuity_dimension_count=${summary.continuity_dimension_count}`,
    `coverage_collapse_count=${summary.coverage_collapse_count}`,
    `callback_resolution_ratio=${summary.callback_resolution_ratio}`,
    `dependency_integrity=${summary.dependency_integrity}`,
    `orphan_scene_count=${summary.orphan_scene_count}`,
    `orphan_shot_count=${summary.orphan_shot_count}`,
    `scene_artifact_mutation=${summary.scene_artifact_mutation}`,
    `medium_film_shot_ready=${report.medium_film_shot_ready}`,
  ].join(' ')
);
console.log(`shot_sequence=${MEDIUM_FILM_SHOT_SEQUENCE_PATH}`);
console.log(`report=${MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (summary.archetype_count !== 3) {
  console.error('VERIFY FAIL: all_archetypes_present');
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
if (summary.continuity_dimension_count < 11) {
  console.error('VERIFY FAIL: continuity_dimension_count>=11');
  process.exit(1);
}
if (summary.coverage_collapse_count !== 0) {
  console.error('VERIFY FAIL: coverage_collapse_count=0');
  process.exit(1);
}
if (summary.callback_resolution_ratio < 0.9) {
  console.error('VERIFY FAIL: callback_resolution_ratio>=0.90');
  process.exit(1);
}
if (summary.dependency_integrity !== 'PASS') {
  console.error('VERIFY FAIL: dependency_integrity=PASS');
  process.exit(1);
}
if (summary.scene_artifact_mutation !== 0) {
  console.error('VERIFY FAIL: scene_artifact_mutation=0');
  process.exit(1);
}

if (report.final_verdict !== MEDIUM_FILM_SHOT_ASSEMBLY_PASS_VERDICT) {
  console.error(`Expected verdict ${MEDIUM_FILM_SHOT_ASSEMBLY_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== MEDIUM_FILM_SHOT_READY_STATUS) {
  console.error(`Expected status ${MEDIUM_FILM_SHOT_READY_STATUS}`);
  process.exit(1);
}
