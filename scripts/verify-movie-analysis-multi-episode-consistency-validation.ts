import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  EPISODE_COUNT,
  EPISODE_TRANSITION_COUNT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_EXPORT_DIR,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_MD_PATH,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisMultiEpisodeConsistencyValidation,
} from '../services/movieAnalysisMultiEpisodeConsistencyValidation.js';
import {
  STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
  STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
  STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisStoryArcConsistencyValidation.js';
import { VIDEO_IDENTITY_DIR } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_LOCATION_DIR } from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from '../services/movieAnalysisRealVideoStyleConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from '../services/movieAnalysisRealVideoMotionConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const storyArcPath = path.join(projectRoot, STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(storyArcPath)) {
  console.error(`Missing required upstream asset: ${STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const storyArcReport = JSON.parse(fs.readFileSync(storyArcPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (storyArcReport.final_verdict !== STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: Required ${STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}
if (storyArcReport.certification_status !== STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Required status ${STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

for (const asset of [
  STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
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

const report = writeMovieAnalysisMultiEpisodeConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} episode_count=${report.episode_count} episode_transition_count=${report.episode_transition_count} episode_to_episode_consistency=${report.episode_to_episode_consistency} character_growth_preservation=${report.character_growth_preservation} relationship_progression_preservation=${report.relationship_progression_preservation} location_recall_preservation=${report.location_recall_preservation} cross_episode_callback=${report.cross_episode_callback} series_continuity=${report.series_continuity} dna_binding_preserved=${report.dna_binding_preserved} adapter_binding_preserved=${report.adapter_binding_preserved} traceability_preserved=${report.traceability_preserved} episode_memory_loss=${report.episode_memory_loss} series_reset=${report.series_reset} relationship_regression=${report.relationship_regression} callback_failure=${report.callback_failure} continuity_break=${report.continuity_break} traceability_loss=${report.traceability_loss} multi_episode_consistency_validation_ready=${report.multi_episode_consistency_validation_ready}`
);
for (const transition of report.episode_transitions) {
  console.log(
    `  ${transition.transition_id}: episode=${transition.episode_to_episode_consistency} growth=${transition.character_growth_preservation} relationship=${transition.relationship_progression_preservation} location=${transition.location_recall_preservation} continuity=${transition.series_continuity} validated=${transition.transition_validated}`
  );
}
console.log(
  `  final_callback: callback=${report.final_callback_validation.cross_episode_callback} location=${report.final_callback_validation.location_recall_preservation} growth=${report.final_callback_validation.character_growth_preservation} validated=${report.final_callback_validation.callback_validated}`
);
console.log(`report=${MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${MULTI_EPISODE_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_EPISODE_CONSISTENCY_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, MULTI_EPISODE_CONSISTENCY_VALIDATION_EXPORT_DIR, 'multi-episode-series-journey.json')
  ) ||
  report.certification_status !== MULTI_EPISODE_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.episode_count !== EPISODE_COUNT ||
  report.episode_transition_count !== EPISODE_TRANSITION_COUNT ||
  report.episode_to_episode_consistency !== 'PASS' ||
  report.character_growth_preservation !== 'PASS' ||
  report.relationship_progression_preservation !== 'PASS' ||
  report.location_recall_preservation !== 'PASS' ||
  report.cross_episode_callback !== 'PASS' ||
  report.series_continuity !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.episode_memory_loss !== false ||
  report.series_reset !== false ||
  report.relationship_regression !== false ||
  report.callback_failure !== false ||
  report.continuity_break !== false ||
  report.traceability_loss !== false ||
  report.multi_episode_consistency_validation_ready !== 'PASS' ||
  report.episode_transitions.length !== EPISODE_TRANSITION_COUNT ||
  report.final_callback_validation.callback_validated !== 'PASS'
) {
  console.error(
    'Expected MULTI_EPISODE_CONSISTENCY_VALIDATED with Episode 1→4→Final Callback PASS'
  );
  process.exit(1);
}

process.exit(0);
