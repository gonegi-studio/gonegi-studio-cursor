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
  MEDIUM_FILM_SCENE_ARC_NETWORK_PATH,
  MEDIUM_FILM_SCENE_ASSEMBLY_PASS_VERDICT,
  MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_SCENE_CONTINUITY_MAP_PATH,
  MEDIUM_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  MEDIUM_FILM_SCENE_READY_STATUS,
  MEDIUM_FILM_SCENE_REGISTRY_PATH,
  MEDIUM_FILM_SCENE_SEQUENCE_PATH,
  writeMediumFilmSceneAssembly,
} from '../services/mediumFilmSceneAssembly.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const blueprintPaths = [
  MEDIUM_FILM_BLUEPRINT_PATH,
  MEDIUM_FILM_ACT_MAP_PATH,
  MEDIUM_FILM_CONTINUITY_MAP_PATH,
  MEDIUM_FILM_ARC_NETWORK_PATH,
  MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
];
const blueprintBefore = Object.fromEntries(
  blueprintPaths.map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeMediumFilmSceneAssembly(projectRoot);

for (const blueprintPath of blueprintPaths) {
  const after = fs.readFileSync(path.join(projectRoot, blueprintPath), 'utf8');
  if (blueprintBefore[blueprintPath] !== after) {
    console.error(`POLICY VIOLATION: Blueprint artifact modified: ${blueprintPath}`);
    process.exit(1);
  }
}

console.log(report.final_verdict);
console.log(
  `status=${report.status} precheck_passed=${report.precheck.precheck_passed} archetype_count=${report.assembly_summary.archetype_count} total_scene_count=${report.assembly_summary.total_scene_count} continuity_dimensions=${report.assembly_summary.continuity_dimensions} dependency_dimensions=${report.assembly_summary.dependency_dimensions} medium_film_scene_ready=${report.medium_film_scene_ready}`
);
console.log(`scene_sequence=${MEDIUM_FILM_SCENE_SEQUENCE_PATH}`);
console.log(`scene_registry=${MEDIUM_FILM_SCENE_REGISTRY_PATH}`);
console.log(`dependency_graph=${MEDIUM_FILM_SCENE_DEPENDENCY_GRAPH_PATH}`);
console.log(`continuity_map=${MEDIUM_FILM_SCENE_CONTINUITY_MAP_PATH}`);
console.log(`arc_network=${MEDIUM_FILM_SCENE_ARC_NETWORK_PATH}`);
console.log(`report=${MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MEDIUM_FILM_SCENE_ASSEMBLY_PASS_VERDICT) {
  console.error(`Expected verdict ${MEDIUM_FILM_SCENE_ASSEMBLY_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== MEDIUM_FILM_SCENE_READY_STATUS) {
  console.error(`Expected status ${MEDIUM_FILM_SCENE_READY_STATUS}`);
  process.exit(1);
}
