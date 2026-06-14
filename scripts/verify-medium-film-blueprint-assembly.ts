import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
  MEDIUM_FILM_FOUNDATION_REPORT_PATH,
  MEDIUM_FILM_INDEX_PATH,
  MEDIUM_FILM_LIBRARY_PATH,
} from '../services/mediumFilmProductionFoundation.js';
import {
  MEDIUM_FILM_ACT_MAP_PATH,
  MEDIUM_FILM_ARC_NETWORK_PATH,
  MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT,
  MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_BLUEPRINT_PATH,
  MEDIUM_FILM_BLUEPRINT_READY_STATUS,
  MEDIUM_FILM_CONTINUITY_MAP_PATH,
  writeMediumFilmBlueprintAssembly,
} from '../services/mediumFilmBlueprintAssembly.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const foundationPaths = [
  MEDIUM_FILM_LIBRARY_PATH,
  MEDIUM_FILM_INDEX_PATH,
  MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
  MEDIUM_FILM_FOUNDATION_REPORT_PATH,
];
const foundationBefore = Object.fromEntries(
  foundationPaths.map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeMediumFilmBlueprintAssembly(projectRoot);

for (const foundationPath of foundationPaths) {
  const after = fs.readFileSync(path.join(projectRoot, foundationPath), 'utf8');
  if (foundationBefore[foundationPath] !== after) {
    console.error(`POLICY VIOLATION: Foundation artifact modified: ${foundationPath}`);
    process.exit(1);
  }
}

console.log(report.final_verdict);
console.log(
  `status=${report.status} precheck_passed=${report.precheck.precheck_passed} archetype_count=${report.assembly_summary.archetype_count} act_structure=${report.assembly_summary.act_structure} continuity_v2_dimensions=${report.assembly_summary.continuity_v2_dimensions} medium_film_blueprint_ready=${report.medium_film_blueprint_ready}`
);
console.log(`blueprint=${MEDIUM_FILM_BLUEPRINT_PATH}`);
console.log(`act_map=${MEDIUM_FILM_ACT_MAP_PATH}`);
console.log(`continuity_map=${MEDIUM_FILM_CONTINUITY_MAP_PATH}`);
console.log(`arc_network=${MEDIUM_FILM_ARC_NETWORK_PATH}`);
console.log(`report=${MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT) {
  console.error(`Expected verdict ${MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== MEDIUM_FILM_BLUEPRINT_READY_STATUS) {
  console.error(`Expected status ${MEDIUM_FILM_BLUEPRINT_READY_STATUS}`);
  process.exit(1);
}
