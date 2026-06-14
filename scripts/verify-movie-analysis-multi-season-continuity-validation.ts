import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MULTI_SEASON_CONTINUITY_VALIDATION_EXPORT_DIR,
  MULTI_SEASON_CONTINUITY_VALIDATION_MANIFEST_PATH,
  MULTI_SEASON_CONTINUITY_VALIDATION_MD_PATH,
  MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
  MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
  MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
  MULTI_SEASON_JOURNEY_COUNT,
  MULTI_SEASON_TRANSITION_COUNT,
  SEASON_COUNT,
  writeMovieAnalysisMultiSeasonContinuityValidation,
} from '../services/movieAnalysisMultiSeasonContinuityValidation.js';
import {
  WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
  WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
  WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisWorldStateMemoryValidation.js';
import { VIDEO_IDENTITY_DIR } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_LOCATION_DIR } from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from '../services/movieAnalysisRealVideoMotionConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from '../services/movieAnalysisRealVideoStyleConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const worldStatePath = path.join(projectRoot, WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(worldStatePath)) {
  console.error(`PRECHECK FAIL: Missing required upstream asset: ${WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const worldStateReport = JSON.parse(fs.readFileSync(worldStatePath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  world_state_memory_validation_ready: string;
};

if (worldStateReport.final_verdict !== WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: ${WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH} must be ${WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (worldStateReport.certification_status !== WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: World state memory status must be ${WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

if (worldStateReport.world_state_memory_validation_ready !== 'PASS') {
  console.error('PRECHECK FAIL: world_state_memory_validation_ready must be PASS');
  process.exit(1);
}

for (const asset of [VIDEO_IDENTITY_DIR, VIDEO_LOCATION_DIR, VIDEO_STYLE_DIR, VIDEO_MOTION_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisMultiSeasonContinuityValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} season_count=${report.season_count} multi_season_journey_count=${report.multi_season_journey_count} multi_season_transition_count=${report.multi_season_transition_count} season_to_season_consistency=${report.season_to_season_consistency} character_growth_carryover=${report.character_growth_carryover} relationship_carryover=${report.relationship_carryover} world_state_carryover=${report.world_state_carryover} long_term_callback=${report.long_term_callback} series_arc_continuity=${report.series_arc_continuity} season_finale_to_next_season_bridge=${report.season_finale_to_next_season_bridge} season_reset=${report.season_reset} season_memory_loss=${report.season_memory_loss} arc_break=${report.arc_break} callback_loss=${report.callback_loss} world_state_reset=${report.world_state_reset} continuity_break=${report.continuity_break} dna_binding_preserved=${report.dna_binding_preserved} adapter_binding_preserved=${report.adapter_binding_preserved} traceability_preserved=${report.traceability_preserved} multi_season_continuity_validation_ready=${report.multi_season_continuity_validation_ready}`
);
for (const step of report.journey_steps) {
  console.log(
    `  ${step.season_id}: source=${step.source_id} growth=${step.growth_score.toFixed(3)} character=${step.character_growth_carryover} world=${step.world_state_carryover}`
  );
}
for (const transition of report.season_transitions) {
  console.log(`  ${transition.transition_id}: bridge=${transition.season_finale_to_next_season_bridge} validated=${transition.transition_validated}`);
}
console.log(
  `  callback: long_term=${report.long_term_callback_validation.long_term_callback} validated=${report.long_term_callback_validation.callback_validated}`
);
console.log(`report=${MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${MULTI_SEASON_CONTINUITY_VALIDATION_MD_PATH}`);
console.log(`manifest=${MULTI_SEASON_CONTINUITY_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_SEASON_CONTINUITY_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_SEASON_CONTINUITY_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(
      projectRoot,
      MULTI_SEASON_CONTINUITY_VALIDATION_EXPORT_DIR,
      'multi-season-continuity-journey.json'
    )
  ) ||
  report.certification_status !== MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.season_count !== SEASON_COUNT ||
  report.multi_season_journey_count !== MULTI_SEASON_JOURNEY_COUNT ||
  report.multi_season_transition_count !== MULTI_SEASON_TRANSITION_COUNT ||
  report.season_to_season_consistency !== 'PASS' ||
  report.character_growth_carryover !== 'PASS' ||
  report.relationship_carryover !== 'PASS' ||
  report.world_state_carryover !== 'PASS' ||
  report.long_term_callback !== 'PASS' ||
  report.series_arc_continuity !== 'PASS' ||
  report.season_finale_to_next_season_bridge !== 'PASS' ||
  report.season_reset !== false ||
  report.season_memory_loss !== false ||
  report.arc_break !== false ||
  report.callback_loss !== false ||
  report.world_state_reset !== false ||
  report.continuity_break !== false ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.multi_season_continuity_validation_ready !== 'PASS' ||
  report.journey_steps.length !== MULTI_SEASON_JOURNEY_COUNT ||
  report.season_transitions.length !== MULTI_SEASON_TRANSITION_COUNT
) {
  console.error(
    'Expected MULTI_SEASON_CONTINUITY_VALIDATED with Season 1→Series Reentry journey and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
