import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
  RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
  RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRelationshipEvolutionValidation.js';
import { VIDEO_LOCATION_DIR } from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  WORLD_JOURNEY_EVENT_COUNT,
  WORLD_JOURNEY_TRANSITION_COUNT,
  WORLD_STATE_MEMORY_VALIDATION_EXPORT_DIR,
  WORLD_STATE_MEMORY_VALIDATION_MANIFEST_PATH,
  WORLD_STATE_MEMORY_VALIDATION_MD_PATH,
  WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
  WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
  WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisWorldStateMemoryValidation,
} from '../services/movieAnalysisWorldStateMemoryValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const relationshipPath = path.join(projectRoot, RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH);
if (!fs.existsSync(relationshipPath)) {
  console.error(`PRECHECK FAIL: Missing required upstream asset: ${RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const relationshipReport = JSON.parse(fs.readFileSync(relationshipPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  relationship_evolution_validation_ready: string;
};

if (relationshipReport.final_verdict !== RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: ${RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH} must be ${RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (relationshipReport.certification_status !== RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Relationship evolution status must be ${RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

if (relationshipReport.relationship_evolution_validation_ready !== 'PASS') {
  console.error('PRECHECK FAIL: relationship_evolution_validation_ready must be PASS');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_LOCATION_DIR))) {
  console.error(`Missing required upstream asset: ${VIDEO_LOCATION_DIR}`);
  process.exit(1);
}

const report = writeMovieAnalysisWorldStateMemoryValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} world_journey_event_count=${report.world_journey_event_count} world_journey_transition_count=${report.world_journey_transition_count} world_event_persistence=${report.world_event_persistence} environment_change_memory=${report.environment_change_memory} historical_continuity=${report.historical_continuity} location_impact_propagation=${report.location_impact_propagation} cross_episode_world_recall=${report.cross_episode_world_recall} world_state_reentry=${report.world_state_reentry} world_state_preserved=${report.world_state_preserved} environment_evolution_valid=${report.environment_evolution_valid} historical_memory_preserved=${report.historical_memory_preserved} location_impact_preserved=${report.location_impact_preserved} cross_episode_world_callback_valid=${report.cross_episode_world_callback_valid} world_reentry_valid=${report.world_reentry_valid} dna_binding_preserved=${report.dna_binding_preserved} adapter_binding_preserved=${report.adapter_binding_preserved} traceability_preserved=${report.traceability_preserved} world_memory_loss=${report.world_memory_loss} history_reset=${report.history_reset} environment_reset=${report.environment_reset} callback_failure=${report.callback_failure} world_reentry_failure=${report.world_reentry_failure} dna_binding_break=${report.dna_binding_break} adapter_binding_break=${report.adapter_binding_break} traceability_loss=${report.traceability_loss} world_state_memory_validation_ready=${report.world_state_memory_validation_ready}`
);
for (const step of report.journey_steps) {
  console.log(
    `  ${step.world_event_id}: source=${step.source_id} persistence=${step.world_event_persistence} environment=${step.environment_change_memory} history=${step.historical_memory_preserved} impact=${step.environment_impact_score.toFixed(3)}`
  );
}
console.log(
  `  callback: valid=${report.callback_result.cross_episode_world_callback_valid} reentry=${report.callback_result.world_state_reentry}`
);
console.log(
  `  reentry: valid=${report.reentry_result.world_reentry_valid} state=${report.reentry_result.world_state_reentry}`
);
console.log(`report=${WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${WORLD_STATE_MEMORY_VALIDATION_MD_PATH}`);
console.log(`manifest=${WORLD_STATE_MEMORY_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, WORLD_STATE_MEMORY_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, WORLD_STATE_MEMORY_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, WORLD_STATE_MEMORY_VALIDATION_EXPORT_DIR, 'world-state-memory-journey.json')
  ) ||
  report.certification_status !== WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.world_journey_event_count !== WORLD_JOURNEY_EVENT_COUNT ||
  report.world_journey_transition_count !== WORLD_JOURNEY_TRANSITION_COUNT ||
  report.world_event_persistence !== 'PASS' ||
  report.environment_change_memory !== 'PASS' ||
  report.historical_continuity !== 'PASS' ||
  report.location_impact_propagation !== 'PASS' ||
  report.cross_episode_world_recall !== 'PASS' ||
  report.world_state_reentry !== 'PASS' ||
  report.world_state_preserved !== 'PASS' ||
  report.environment_evolution_valid !== 'PASS' ||
  report.historical_memory_preserved !== 'PASS' ||
  report.location_impact_preserved !== 'PASS' ||
  report.cross_episode_world_callback_valid !== 'PASS' ||
  report.world_reentry_valid !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.world_memory_loss !== false ||
  report.history_reset !== false ||
  report.environment_reset !== false ||
  report.callback_failure !== false ||
  report.world_reentry_failure !== false ||
  report.dna_binding_break !== false ||
  report.adapter_binding_break !== false ||
  report.traceability_loss !== false ||
  report.world_state_memory_validation_ready !== 'PASS' ||
  report.journey_steps.length !== WORLD_JOURNEY_EVENT_COUNT
) {
  console.error(
    'Expected WORLD_STATE_MEMORY_VALIDATED with World Event A→World Reentry journey and callback/reentry PASS'
  );
  process.exit(1);
}

process.exit(0);
