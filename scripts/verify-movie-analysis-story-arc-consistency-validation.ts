import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
  PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT,
  PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
  PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE,
} from '../services/movieAnalysisProductionMemoryStressTest.js';
import {
  STORY_ARC_ACT_COUNT,
  STORY_ARC_CONSISTENCY_VALIDATION_EXPORT_DIR,
  STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  STORY_ARC_CONSISTENCY_VALIDATION_MD_PATH,
  STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
  STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
  STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  STORY_ARC_TRANSITION_COUNT,
  writeMovieAnalysisStoryArcConsistencyValidation,
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

const memoryStressPath = path.join(projectRoot, PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH);
if (!fs.existsSync(memoryStressPath)) {
  console.error(`Missing required upstream asset: ${PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH}`);
  process.exit(1);
}

const memoryStressReport = JSON.parse(fs.readFileSync(memoryStressPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (memoryStressReport.final_verdict !== PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: Required ${PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT}`);
  process.exit(1);
}
if (memoryStressReport.certification_status !== PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Required status ${PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE}`);
  process.exit(1);
}

for (const asset of [
  PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
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

const report = writeMovieAnalysisStoryArcConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} story_arc_act_count=${report.story_arc_act_count} story_arc_transition_count=${report.story_arc_transition_count} character_arc_consistency=${report.character_arc_consistency} emotion_arc_consistency=${report.emotion_arc_consistency} relationship_arc_consistency=${report.relationship_arc_consistency} story_progression_consistency=${report.story_progression_consistency} callback_memory_consistency=${report.callback_memory_consistency} ending_resolution_consistency=${report.ending_resolution_consistency} story_arc_break=${report.story_arc_break} emotion_reset=${report.emotion_reset} relationship_reset=${report.relationship_reset} callback_loss=${report.callback_loss} ending_inconsistency=${report.ending_inconsistency} story_arc_consistency_validation_ready=${report.story_arc_consistency_validation_ready}`
);
for (const transition of report.act_transitions) {
  console.log(
    `  ${transition.transition_id}: character=${transition.character_arc_consistency} emotion=${transition.emotion_arc_consistency} relationship=${transition.relationship_arc_consistency} story=${transition.story_progression_consistency} validated=${transition.transition_validated}`
  );
}
console.log(
  `  ending: callback=${report.ending_validation.callback_memory_consistency} resolution=${report.ending_validation.ending_resolution_consistency} validated=${report.ending_validation.ending_validated}`
);
console.log(`report=${STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${STORY_ARC_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, STORY_ARC_CONSISTENCY_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, STORY_ARC_CONSISTENCY_VALIDATION_EXPORT_DIR, 'story-arc-journey.json')
  ) ||
  report.certification_status !== STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.story_arc_act_count !== STORY_ARC_ACT_COUNT ||
  report.story_arc_transition_count !== STORY_ARC_TRANSITION_COUNT ||
  report.character_arc_consistency !== 'PASS' ||
  report.emotion_arc_consistency !== 'PASS' ||
  report.relationship_arc_consistency !== 'PASS' ||
  report.story_progression_consistency !== 'PASS' ||
  report.callback_memory_consistency !== 'PASS' ||
  report.ending_resolution_consistency !== 'PASS' ||
  report.story_arc_break !== false ||
  report.emotion_reset !== false ||
  report.relationship_reset !== false ||
  report.callback_loss !== false ||
  report.ending_inconsistency !== false ||
  report.story_arc_consistency_validation_ready !== 'PASS' ||
  report.act_transitions.length !== STORY_ARC_TRANSITION_COUNT ||
  report.ending_validation.ending_validated !== 'PASS'
) {
  console.error('Expected STORY_ARC_CONSISTENCY_VALIDATED with ACT1→ACT2→ACT3→ENDING PASS');
  process.exit(1);
}

process.exit(0);
