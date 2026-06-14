import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';
import {
  SHORT_FILM_FOUNDATION_REPORT_PATH,
  SHORT_FILM_LIBRARY_PATH,
} from '../services/shortFilmProductionFoundation.js';
import {
  SHORT_FILM_ACT_MAP_PATH,
  SHORT_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT,
  SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  SHORT_FILM_BLUEPRINT_PATH,
  SHORT_FILM_BLUEPRINT_READY_STATUS,
  SHORT_FILM_CONTINUITY_MAP_PATH,
  writeShortFilmBlueprintAssembly,
} from '../services/shortFilmBlueprintAssembly.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const foundationReportBefore = fs.readFileSync(
  path.join(projectRoot, SHORT_FILM_FOUNDATION_REPORT_PATH),
  'utf8'
);
const foundationLibraryBefore = fs.readFileSync(
  path.join(projectRoot, SHORT_FILM_LIBRARY_PATH),
  'utf8'
);
const mvStateBefore = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);

const report = writeShortFilmBlueprintAssembly(projectRoot);

const foundationReportAfter = fs.readFileSync(
  path.join(projectRoot, SHORT_FILM_FOUNDATION_REPORT_PATH),
  'utf8'
);
const foundationLibraryAfter = fs.readFileSync(
  path.join(projectRoot, SHORT_FILM_LIBRARY_PATH),
  'utf8'
);
const mvStateAfter = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);

if (foundationReportBefore !== foundationReportAfter) {
  console.error('POLICY VIOLATION: Foundation report was modified');
  process.exit(1);
}
if (foundationLibraryBefore !== foundationLibraryAfter) {
  console.error('POLICY VIOLATION: Foundation library was modified');
  process.exit(1);
}
if (mvStateBefore !== mvStateAfter) {
  console.error('POLICY VIOLATION: MV current state was modified');
  process.exit(1);
}

console.log(report.final_verdict);
console.log(
  `status=${report.status} precheck_passed=${report.precheck.precheck_passed} archetype_count=${report.assembly_summary.archetype_count} act_structure=${report.assembly_summary.act_structure} continuity_dimensions=${report.assembly_summary.continuity_dimensions} callback_system=${report.assembly_summary.callback_system} short_film_blueprint_ready=${report.short_film_blueprint_ready}`
);
console.log(`blueprint=${SHORT_FILM_BLUEPRINT_PATH}`);
console.log(`act_map=${SHORT_FILM_ACT_MAP_PATH}`);
console.log(`continuity_map=${SHORT_FILM_CONTINUITY_MAP_PATH}`);
console.log(`report=${SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== SHORT_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT) {
  console.error(`Expected verdict ${SHORT_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== SHORT_FILM_BLUEPRINT_READY_STATUS) {
  console.error(`Expected status ${SHORT_FILM_BLUEPRINT_READY_STATUS}`);
  process.exit(1);
}
