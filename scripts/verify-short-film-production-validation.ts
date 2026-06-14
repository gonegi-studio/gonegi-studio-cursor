import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from '../services/mvProductionReadyBaselineSnapshot.js';
import {
  SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  SHORT_FILM_SHOT_CONTINUITY_MAP_PATH,
  SHORT_FILM_SHOT_COVERAGE_MAP_PATH,
  SHORT_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
  SHORT_FILM_SHOT_REGISTRY_PATH,
  SHORT_FILM_SHOT_SEQUENCE_PATH,
} from '../services/shortFilmShotAssembly.js';
import {
  SHORT_FILM_PRODUCTION_READINESS_PATH,
  SHORT_FILM_PRODUCTION_READY_STATUS,
  SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT,
  SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
  SHORT_FILM_CALLBACK_AUDIT_PATH,
  SHORT_FILM_CONTINUITY_AUDIT_PATH,
  SHORT_FILM_COVERAGE_AUDIT_PATH,
  writeShortFilmProductionValidation,
} from '../services/shortFilmProductionValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const upstreamPaths = [
  SHORT_FILM_SHOT_SEQUENCE_PATH,
  SHORT_FILM_SHOT_REGISTRY_PATH,
  SHORT_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
  SHORT_FILM_SHOT_CONTINUITY_MAP_PATH,
  SHORT_FILM_SHOT_COVERAGE_MAP_PATH,
  SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH,
];
const upstreamBefore = Object.fromEntries(
  upstreamPaths.map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);
const mvStateBefore = fs.readFileSync(
  path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
  'utf8'
);

const report = writeShortFilmProductionValidation(projectRoot);

for (const upstreamPath of upstreamPaths) {
  const after = fs.readFileSync(path.join(projectRoot, upstreamPath), 'utf8');
  if (upstreamBefore[upstreamPath] !== after) {
    console.error(`POLICY VIOLATION: Upstream artifact modified: ${upstreamPath}`);
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
  `status=${report.status} precheck_passed=${report.precheck.precheck_passed} continuity_break_count=${report.validation_summary.continuity_break_count} critical_continuity_break_count=${report.validation_summary.critical_continuity_break_count} callback_completion_ratio=${report.validation_summary.callback_completion_ratio} coverage_validation_passed=${report.validation_summary.coverage_validation_passed} production_readiness_score=${report.validation_summary.production_readiness_score} production_readiness_status=${report.validation_summary.production_readiness_status} pass_rules_met=${report.validation_summary.pass_rules_met} short_film_production_ready=${report.short_film_production_ready}`
);
console.log(`production_readiness=${SHORT_FILM_PRODUCTION_READINESS_PATH}`);
console.log(`continuity_audit=${SHORT_FILM_CONTINUITY_AUDIT_PATH}`);
console.log(`callback_audit=${SHORT_FILM_CALLBACK_AUDIT_PATH}`);
console.log(`coverage_audit=${SHORT_FILM_COVERAGE_AUDIT_PATH}`);
console.log(`report=${SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT) {
  console.error(`Expected verdict ${SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== SHORT_FILM_PRODUCTION_READY_STATUS) {
  console.error(`Expected status ${SHORT_FILM_PRODUCTION_READY_STATUS}`);
  process.exit(1);
}
