import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
  LOCATION_REENTRY_VALIDATION_PASS_VERDICT,
  LOCATION_REENTRY_VALIDATION_REPORT_PATH,
  LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisLocationReentryValidation.js';
import {
  GROUP_SCENE_COUNT,
  GROUP_SCENE_SIZES,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_EXPORT_DIR,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_MD_PATH,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisMultiCharacterConsistencyValidation,
} from '../services/movieAnalysisMultiCharacterConsistencyValidation.js';
import { VIDEO_IDENTITY_DIR } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const locationReentryPath = path.join(projectRoot, LOCATION_REENTRY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(locationReentryPath)) {
  console.error(`Missing required upstream asset: ${LOCATION_REENTRY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const locationReentryReport = JSON.parse(fs.readFileSync(locationReentryPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (locationReentryReport.final_verdict !== LOCATION_REENTRY_VALIDATION_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: Required ${LOCATION_REENTRY_VALIDATION_PASS_VERDICT}`);
  process.exit(1);
}
if (locationReentryReport.certification_status !== LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE) {
  console.error(`PRECHECK FAIL: Required status ${LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE}`);
  process.exit(1);
}

for (const asset of [LOCATION_REENTRY_VALIDATION_MANIFEST_PATH, VIDEO_IDENTITY_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisMultiCharacterConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} group_scene_count=${report.group_scene_count} character_identity=${report.character_identity} face_separation=${report.face_separation} costume_separation=${report.costume_separation} role_separation=${report.role_separation} dna_binding=${report.dna_binding} character_swap=${report.character_swap} identity_collision=${report.identity_collision} group_drift=${report.group_drift} multi_character_consistency_validation_ready=${report.multi_character_consistency_validation_ready}`
);
for (const scene of report.group_scene_results) {
  console.log(
    `  ${scene.group_scene_id}: chars=${scene.character_count} identity=${scene.character_identity} face=${scene.face_separation} costume=${scene.costume_separation} role=${scene.role_separation} dna=${scene.dna_binding} swap=${scene.character_swap} collision=${scene.identity_collision} drift=${scene.group_drift} validated=${scene.multi_character_consistency_validated}`
  );
}
console.log(`report=${MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${MULTI_CHARACTER_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_CHARACTER_CONSISTENCY_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(
      projectRoot,
      MULTI_CHARACTER_CONSISTENCY_VALIDATION_EXPORT_DIR,
      'multi-character-group-scenes.json'
    )
  ) ||
  report.certification_status !== MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.group_scene_count !== GROUP_SCENE_COUNT ||
  report.character_identity !== 'PASS' ||
  report.face_separation !== 'PASS' ||
  report.costume_separation !== 'PASS' ||
  report.role_separation !== 'PASS' ||
  report.dna_binding !== 'PASS' ||
  report.character_swap !== false ||
  report.identity_collision !== false ||
  report.group_drift !== false ||
  report.multi_character_consistency_validation_ready !== 'PASS' ||
  report.group_scene_results.length !== GROUP_SCENE_COUNT ||
  !GROUP_SCENE_SIZES.every((size) =>
    report.group_scene_results.some(
      (scene) => scene.character_count === size && scene.multi_character_consistency_validated === 'PASS'
    )
  )
) {
  console.error(
    'Expected MULTI_CHARACTER_CONSISTENCY_VALIDATED with group scenes 2/4/8/13 PASS'
  );
  process.exit(1);
}

process.exit(0);
