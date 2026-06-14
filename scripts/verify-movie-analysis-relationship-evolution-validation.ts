import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
  CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
  CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisCharacterEvolutionValidation.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  RELATIONSHIP_EVOLUTION_VALIDATION_EXPORT_DIR,
  RELATIONSHIP_EVOLUTION_VALIDATION_MANIFEST_PATH,
  RELATIONSHIP_EVOLUTION_VALIDATION_MD_PATH,
  RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
  RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
  RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
  RELATIONSHIP_JOURNEY_STAGE_COUNT,
  RELATIONSHIP_JOURNEY_TRANSITION_COUNT,
  writeMovieAnalysisRelationshipEvolutionValidation,
} from '../services/movieAnalysisRelationshipEvolutionValidation.js';
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

const characterEvolutionPath = path.join(projectRoot, CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH);
if (!fs.existsSync(characterEvolutionPath)) {
  console.error(`PRECHECK FAIL: Missing required upstream asset: ${CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const characterEvolutionReport = JSON.parse(fs.readFileSync(characterEvolutionPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  character_evolution_validation_ready: string;
};

if (characterEvolutionReport.final_verdict !== CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: ${CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH} must be ${CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}

if (characterEvolutionReport.certification_status !== CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Character evolution status must be ${CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

if (characterEvolutionReport.character_evolution_validation_ready !== 'PASS') {
  console.error('PRECHECK FAIL: character_evolution_validation_ready must be PASS');
  process.exit(1);
}

for (const asset of [VIDEO_IDENTITY_DIR, VIDEO_LOCATION_DIR, VIDEO_STYLE_DIR, VIDEO_MOTION_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisRelationshipEvolutionValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} relationship_journey_stage_count=${report.relationship_journey_stage_count} relationship_journey_transition_count=${report.relationship_journey_transition_count} friendship_progression=${report.friendship_progression} romance_progression=${report.romance_progression} family_bond_progression=${report.family_bond_progression} conflict_resolution=${report.conflict_resolution} relationship_memory_preserved=${report.relationship_memory_preserved} cross_episode_relationship_recall=${report.cross_episode_relationship_recall} relationship_growth_preserved=${report.relationship_growth_preserved} relationship_identity_preserved=${report.relationship_identity_preserved} relationship_progression_valid=${report.relationship_progression_valid} conflict_resolution_valid=${report.conflict_resolution_valid} cross_episode_callback_valid=${report.cross_episode_callback_valid} dna_binding_preserved=${report.dna_binding_preserved} adapter_binding_preserved=${report.adapter_binding_preserved} traceability_preserved=${report.traceability_preserved} relationship_reset=${report.relationship_reset} relationship_regression=${report.relationship_regression} bond_loss=${report.bond_loss} callback_failure=${report.callback_failure} dna_binding_break=${report.dna_binding_break} adapter_binding_break=${report.adapter_binding_break} traceability_loss=${report.traceability_loss} relationship_evolution_validation_ready=${report.relationship_evolution_validation_ready}`
);
for (const step of report.journey_steps) {
  console.log(
    `  ${step.relationship_stage}: episode=${step.episode_id} progression=${step.relationship_progression_valid} bond=${step.bond_identity_preserved} romance=${step.romance_warmth_score.toFixed(3)} family=${step.family_bond_score}`
  );
}
console.log(
  `  callback: valid=${report.callback_result.cross_episode_callback_valid} memory=${report.callback_result.relationship_memory_preserved}`
);
console.log(`report=${RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${RELATIONSHIP_EVOLUTION_VALIDATION_MD_PATH}`);
console.log(`manifest=${RELATIONSHIP_EVOLUTION_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, RELATIONSHIP_EVOLUTION_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, RELATIONSHIP_EVOLUTION_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, RELATIONSHIP_EVOLUTION_VALIDATION_EXPORT_DIR, 'relationship-evolution-journey.json')
  ) ||
  report.certification_status !== RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.relationship_journey_stage_count !== RELATIONSHIP_JOURNEY_STAGE_COUNT ||
  report.relationship_journey_transition_count !== RELATIONSHIP_JOURNEY_TRANSITION_COUNT ||
  report.friendship_progression !== 'PASS' ||
  report.romance_progression !== 'PASS' ||
  report.family_bond_progression !== 'PASS' ||
  report.conflict_resolution !== 'PASS' ||
  report.relationship_memory_preserved !== 'PASS' ||
  report.cross_episode_relationship_recall !== 'PASS' ||
  report.relationship_growth_preserved !== 'PASS' ||
  report.relationship_identity_preserved !== 'PASS' ||
  report.relationship_progression_valid !== 'PASS' ||
  report.conflict_resolution_valid !== 'PASS' ||
  report.cross_episode_callback_valid !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.relationship_reset !== false ||
  report.relationship_regression !== false ||
  report.bond_loss !== false ||
  report.callback_failure !== false ||
  report.dna_binding_break !== false ||
  report.adapter_binding_break !== false ||
  report.traceability_loss !== false ||
  report.relationship_evolution_validation_ready !== 'PASS' ||
  report.journey_steps.length !== RELATIONSHIP_JOURNEY_STAGE_COUNT
) {
  console.error(
    'Expected RELATIONSHIP_EVOLUTION_VALIDATED with Friendship→Mature Bond journey and reconciliation callback PASS'
  );
  process.exit(1);
}

process.exit(0);
