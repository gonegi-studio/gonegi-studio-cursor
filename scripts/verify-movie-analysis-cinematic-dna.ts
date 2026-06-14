import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CINEMATIC_DNA_MD_PATH,
  CINEMATIC_DNA_PASS_VERDICT,
  CINEMATIC_DNA_PATH,
  CINEMATIC_DNA_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisCinematicDnaExtraction,
} from '../services/movieAnalysisCinematicDnaExtraction.js';
import { writeMovieAnalysisCinematicDnaValidationReport } from '../services/movieAnalysisCinematicDnaValidator.js';
import { DATASET_CERTIFICATION_REPORT_PATH } from '../services/movieAnalysisDatasetCertification.js';
import { RELEASE_PACKAGE_PATH } from '../services/movieAnalysisReleasePackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [RELEASE_PACKAGE_PATH, DATASET_CERTIFICATION_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const cinematicDna = writeMovieAnalysisCinematicDnaExtraction(projectRoot);
const report = writeMovieAnalysisCinematicDnaValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} scene_dna=${report.scene_dna} camera_dna=${report.camera_dna} emotion_dna=${report.emotion_dna} transition_dna=${report.transition_dna} continuity_dna=${report.continuity_dna} storytelling_dna=${report.storytelling_dna} cinematic_dna_complete=${report.cinematic_dna_complete} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_dna} camera=${audit.camera_dna} emotion=${audit.emotion_dna} transition=${audit.transition_dna} continuity=${audit.continuity_dna} storytelling=${audit.storytelling_dna}`
  );
}
console.log(`cinematic_dna=${CINEMATIC_DNA_PATH} entries=${cinematicDna.entries.length}`);
console.log(`report=${CINEMATIC_DNA_REPORT_PATH}`);
console.log(`markdown=${CINEMATIC_DNA_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CINEMATIC_DNA_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.scene_dna !== 'PASS' ||
  report.camera_dna !== 'PASS' ||
  report.emotion_dna !== 'PASS' ||
  report.transition_dna !== 'PASS' ||
  report.continuity_dna !== 'PASS' ||
  report.storytelling_dna !== 'PASS' ||
  report.cinematic_dna_complete !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 scene_dna=PASS camera_dna=PASS emotion_dna=PASS transition_dna=PASS continuity_dna=PASS storytelling_dna=PASS cinematic_dna_complete=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
