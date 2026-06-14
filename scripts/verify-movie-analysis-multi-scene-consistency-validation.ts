import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
} from '../services/movieAnalysisLongSequenceConsistencyValidation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  MULTI_SCENE_CONSISTENCY_VALIDATION_MD_PATH,
  MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  MULTI_SCENE_COUNT,
  MULTI_SCENE_VALIDATION_EXPORT_DIR,
  MULTI_SCENE_VALIDATION_MANIFEST_PATH,
  SCENE_TRANSITION_COUNT,
  writeMovieAnalysisMultiSceneConsistencyValidation,
} from '../services/movieAnalysisMultiSceneConsistencyValidation.js';
import { VIDEO_IDENTITY_DIR } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_LOCATION_DIR } from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from '../services/movieAnalysisRealVideoStyleConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from '../services/movieAnalysisRealVideoMotionConsistencyValidation.js';
import { VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH } from '../services/movieAnalysisRealVideoMasterCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const longSequencePath = path.join(projectRoot, LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(longSequencePath)) {
  console.error(`Missing required upstream asset: ${LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const longSequenceReport = JSON.parse(fs.readFileSync(longSequencePath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (longSequenceReport.final_verdict !== LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: Required ${LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}
if (longSequenceReport.certification_status !== LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Required status ${LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

for (const asset of [
  LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
  VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
  VIDEO_IDENTITY_DIR,
  VIDEO_LOCATION_DIR,
  VIDEO_STYLE_DIR,
  VIDEO_MOTION_DIR,
]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisMultiSceneConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} scene_count=${report.scene_count} scene_transition_count=${report.scene_transition_count} character_cross_scene_consistency=${report.character_cross_scene_consistency} location_cross_scene_consistency=${report.location_cross_scene_consistency} style_cross_scene_consistency=${report.style_cross_scene_consistency} motion_cross_scene_consistency=${report.motion_cross_scene_consistency} story_cross_scene_continuity=${report.story_cross_scene_continuity} character_reentry_consistency=${report.character_reentry_consistency} location_reentry_consistency=${report.location_reentry_consistency} traceability_preserved=${report.traceability_preserved} scene_transition_break=${report.scene_transition_break} character_scene_drift=${report.character_scene_drift} location_scene_drift=${report.location_scene_drift} style_scene_drift=${report.style_scene_drift} story_continuity_break=${report.story_continuity_break} multi_scene_consistency_validation_ready=${report.multi_scene_consistency_validation_ready}`
);
for (const transition of report.scene_transitions) {
  console.log(
    `  ${transition.transition_id}: character=${transition.character_cross_scene_consistency} location=${transition.location_cross_scene_consistency} style=${transition.style_cross_scene_consistency} motion=${transition.motion_cross_scene_consistency} story=${transition.story_cross_scene_continuity} validated=${transition.transition_validated}`
  );
}
console.log(
  `  reentry: character=${report.scene_reentry.character_reentry_consistency} location=${report.scene_reentry.location_reentry_consistency} validated=${report.scene_reentry.reentry_validated}`
);
console.log(`report=${MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${MULTI_SCENE_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${MULTI_SCENE_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_SCENE_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_SCENE_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, MULTI_SCENE_VALIDATION_EXPORT_DIR, 'multi-scene-transition-validation.json')
  ) ||
  report.certification_status !== MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.scene_count !== MULTI_SCENE_COUNT ||
  report.scene_transition_count !== SCENE_TRANSITION_COUNT ||
  report.character_cross_scene_consistency !== 'PASS' ||
  report.location_cross_scene_consistency !== 'PASS' ||
  report.style_cross_scene_consistency !== 'PASS' ||
  report.motion_cross_scene_consistency !== 'PASS' ||
  report.story_cross_scene_continuity !== 'PASS' ||
  report.character_reentry_consistency !== 'PASS' ||
  report.location_reentry_consistency !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.scene_transition_break !== false ||
  report.character_scene_drift !== false ||
  report.location_scene_drift !== false ||
  report.style_scene_drift !== false ||
  report.story_continuity_break !== false ||
  report.multi_scene_consistency_validation_ready !== 'PASS' ||
  report.scene_transitions.length !== SCENE_TRANSITION_COUNT ||
  report.scene_transitions.every((transition) => transition.transition_validated === 'PASS') === false
) {
  console.error(
    'Expected MULTI_SCENE_CONSISTENCY_VALIDATED with Scene A through Scene D transitions PASS'
  );
  process.exit(1);
}

process.exit(0);
