import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHARACTER_REENTRY_SCENE_COUNT,
  CHARACTER_REENTRY_TRANSITION_COUNT,
  CHARACTER_REENTRY_VALIDATION_EXPORT_DIR,
  CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
  CHARACTER_REENTRY_VALIDATION_MD_PATH,
  CHARACTER_REENTRY_VALIDATION_PASS_VERDICT,
  CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
  CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisCharacterReentryValidation,
} from '../services/movieAnalysisCharacterReentryValidation.js';
import {
  MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  MULTI_SCENE_VALIDATION_MANIFEST_PATH,
} from '../services/movieAnalysisMultiSceneConsistencyValidation.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { VIDEO_IDENTITY_DIR } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const multiScenePath = path.join(projectRoot, MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(multiScenePath)) {
  console.error(`Missing required upstream asset: ${MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const multiSceneReport = JSON.parse(fs.readFileSync(multiScenePath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (multiSceneReport.final_verdict !== MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: Required ${MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}
if (multiSceneReport.certification_status !== MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Required status ${MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

for (const asset of [MULTI_SCENE_VALIDATION_MANIFEST_PATH, VIDEO_IDENTITY_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisCharacterReentryValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} journey_scene_count=${report.journey_scene_count} journey_transition_count=${report.journey_transition_count} face_identity=${report.face_identity} hair_identity=${report.hair_identity} costume_identity=${report.costume_identity} dna_binding=${report.dna_binding} adapter_binding=${report.adapter_binding} identity_memory_preserved=${report.identity_memory_preserved} character_reentry_failure=${report.character_reentry_failure} identity_memory_loss=${report.identity_memory_loss} character_reentry_validation_ready=${report.character_reentry_validation_ready}`
);
for (const step of report.journey_steps) {
  console.log(
    `  ${step.scene_id}: face=${step.face_identity} hair=${step.hair_identity} costume=${step.costume_identity} memory=${step.identity_memory_preserved}`
  );
}
console.log(
  `  reentry: face=${report.reentry_result.face_identity} hair=${report.reentry_result.hair_identity} costume=${report.reentry_result.costume_identity} dna=${report.reentry_result.dna_binding} adapter=${report.reentry_result.adapter_binding} validated=${report.reentry_result.character_reentry_validated}`
);
console.log(`report=${CHARACTER_REENTRY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${CHARACTER_REENTRY_VALIDATION_MD_PATH}`);
console.log(`manifest=${CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CHARACTER_REENTRY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, CHARACTER_REENTRY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, CHARACTER_REENTRY_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, CHARACTER_REENTRY_VALIDATION_EXPORT_DIR, 'character-reentry-journey.json')
  ) ||
  report.certification_status !== CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.journey_scene_count !== CHARACTER_REENTRY_SCENE_COUNT ||
  report.journey_transition_count !== CHARACTER_REENTRY_TRANSITION_COUNT ||
  report.face_identity !== 'PASS' ||
  report.hair_identity !== 'PASS' ||
  report.costume_identity !== 'PASS' ||
  report.dna_binding !== 'PASS' ||
  report.adapter_binding !== 'PASS' ||
  report.identity_memory_preserved !== 'PASS' ||
  report.character_reentry_failure !== false ||
  report.identity_memory_loss !== false ||
  report.character_reentry_validation_ready !== 'PASS' ||
  report.reentry_result.character_reentry_validated !== 'PASS' ||
  report.journey_steps.length !== CHARACTER_REENTRY_SCENE_COUNT
) {
  console.error(
    'Expected CHARACTER_REENTRY_VALIDATED with A→F journey and Scene A character reentry PASS'
  );
  process.exit(1);
}

process.exit(0);
