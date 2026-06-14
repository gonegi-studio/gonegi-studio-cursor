import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';
import {
  SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  SHORT_FILM_BLUEPRINT_PATH,
  SHORT_FILM_ACT_MAP_PATH,
  SHORT_FILM_CONTINUITY_MAP_PATH,
} from '../services/shortFilmBlueprintAssembly.js';
import {
  SHORT_FILM_SCENE_ASSEMBLY_PASS_VERDICT,
  SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  SHORT_FILM_SCENE_CONTINUITY_MAP_PATH,
  SHORT_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  SHORT_FILM_SCENE_REGISTRY_PATH,
  SHORT_FILM_SCENE_READY_STATUS,
  SHORT_FILM_SCENE_SEQUENCE_PATH,
  writeShortFilmSceneAssembly,
} from '../services/shortFilmSceneAssembly.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const blueprintPaths = [
  SHORT_FILM_BLUEPRINT_PATH,
  SHORT_FILM_ACT_MAP_PATH,
  SHORT_FILM_CONTINUITY_MAP_PATH,
  SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
];
const blueprintBefore = Object.fromEntries(
  blueprintPaths.map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);
const mvStateBefore = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);

const report = writeShortFilmSceneAssembly(projectRoot);

for (const blueprintPath of blueprintPaths) {
  const after = fs.readFileSync(path.join(projectRoot, blueprintPath), 'utf8');
  if (blueprintBefore[blueprintPath] !== after) {
    console.error(`POLICY VIOLATION: Blueprint artifact modified: ${blueprintPath}`);
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
  `status=${report.status} precheck_passed=${report.precheck.precheck_passed} archetype_count=${report.assembly_summary.archetype_count} total_scene_count=${report.assembly_summary.total_scene_count} dependency_dimensions=${report.assembly_summary.dependency_dimensions} continuity_dimensions=${report.assembly_summary.continuity_dimensions} registry_ready=${report.assembly_summary.registry_ready} medium_film_extension_ready=${report.assembly_summary.medium_film_extension_ready} short_film_scene_ready=${report.short_film_scene_ready}`
);
console.log(`scene_sequence=${SHORT_FILM_SCENE_SEQUENCE_PATH}`);
console.log(`scene_registry=${SHORT_FILM_SCENE_REGISTRY_PATH}`);
console.log(`dependency_graph=${SHORT_FILM_SCENE_DEPENDENCY_GRAPH_PATH}`);
console.log(`continuity_map=${SHORT_FILM_SCENE_CONTINUITY_MAP_PATH}`);
console.log(`report=${SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== SHORT_FILM_SCENE_ASSEMBLY_PASS_VERDICT) {
  console.error(`Expected verdict ${SHORT_FILM_SCENE_ASSEMBLY_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== SHORT_FILM_SCENE_READY_STATUS) {
  console.error(`Expected status ${SHORT_FILM_SCENE_READY_STATUS}`);
  process.exit(1);
}
