import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';
import {
  SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  SHORT_FILM_SCENE_CONTINUITY_MAP_PATH,
  SHORT_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  SHORT_FILM_SCENE_REGISTRY_PATH,
  SHORT_FILM_SCENE_SEQUENCE_PATH,
} from '../services/shortFilmSceneAssembly.js';
import {
  SHORT_FILM_SHOT_ASSEMBLY_PASS_VERDICT,
  SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  SHORT_FILM_SHOT_CONTINUITY_MAP_PATH,
  SHORT_FILM_SHOT_COVERAGE_MAP_PATH,
  SHORT_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
  SHORT_FILM_SHOT_READY_STATUS,
  SHORT_FILM_SHOT_REGISTRY_PATH,
  SHORT_FILM_SHOT_SEQUENCE_PATH,
  writeShortFilmShotAssembly,
} from '../services/shortFilmShotAssembly.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const scenePaths = [
  SHORT_FILM_SCENE_SEQUENCE_PATH,
  SHORT_FILM_SCENE_REGISTRY_PATH,
  SHORT_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  SHORT_FILM_SCENE_CONTINUITY_MAP_PATH,
  SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH,
];
const sceneBefore = Object.fromEntries(
  scenePaths.map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);
const mvStateBefore = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);

const report = writeShortFilmShotAssembly(projectRoot);

for (const scenePath of scenePaths) {
  const after = fs.readFileSync(path.join(projectRoot, scenePath), 'utf8');
  if (sceneBefore[scenePath] !== after) {
    console.error(`POLICY VIOLATION: Scene artifact modified: ${scenePath}`);
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
  `status=${report.status} precheck_passed=${report.precheck.precheck_passed} archetype_count=${report.assembly_summary.archetype_count} total_scene_count=${report.assembly_summary.total_scene_count} total_shot_count=${report.assembly_summary.total_shot_count} shots_per_scene=${report.assembly_summary.shots_per_scene} coverage_validation_passed=${report.assembly_summary.coverage_validation_passed} short_film_shot_ready=${report.short_film_shot_ready}`
);
console.log(`shot_sequence=${SHORT_FILM_SHOT_SEQUENCE_PATH}`);
console.log(`shot_registry=${SHORT_FILM_SHOT_REGISTRY_PATH}`);
console.log(`dependency_graph=${SHORT_FILM_SHOT_DEPENDENCY_GRAPH_PATH}`);
console.log(`continuity_map=${SHORT_FILM_SHOT_CONTINUITY_MAP_PATH}`);
console.log(`coverage_map=${SHORT_FILM_SHOT_COVERAGE_MAP_PATH}`);
console.log(`report=${SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== SHORT_FILM_SHOT_ASSEMBLY_PASS_VERDICT) {
  console.error(`Expected verdict ${SHORT_FILM_SHOT_ASSEMBLY_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== SHORT_FILM_SHOT_READY_STATUS) {
  console.error(`Expected status ${SHORT_FILM_SHOT_READY_STATUS}`);
  process.exit(1);
}
