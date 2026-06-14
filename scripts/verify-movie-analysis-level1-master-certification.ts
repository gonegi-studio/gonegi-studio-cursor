import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { L1B_FINAL_CERTIFICATION_REPORT_PATH } from '../services/movieAnalysisL1bFinalCertification.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  LEVEL1_MASTER_CERTIFICATION_MD_PATH,
  LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT,
  LEVEL1_MASTER_CERTIFICATION_REPORT_PATH,
  LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE,
  L1B_PHASE_COUNT,
  PHASE_RANGE_COUNT,
  TOTAL_LEVEL1_PHASE_COUNT,
  writeMovieAnalysisLevel1MasterCertificationReport,
} from '../services/movieAnalysisLevel1MasterCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, L1B_FINAL_CERTIFICATION_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${L1B_FINAL_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisLevel1MasterCertificationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `phases_022_to_076_complete=${report.phases_022_to_076_complete} l1b_phases_complete=${report.l1b_phases_complete} engine_complete=${report.completion_validation.engine_complete} dna_complete=${report.completion_validation.dna_complete} adapter_complete=${report.completion_validation.adapter_complete} release_complete=${report.completion_validation.release_complete} archive_complete=${report.completion_validation.archive_complete} image_app_complete=${report.completion_validation.image_app_complete} video_app_complete=${report.completion_validation.video_app_complete} cross_app_complete=${report.completion_validation.cross_app_complete} validation_complete=${report.completion_validation.validation_complete} normalization_complete=${report.completion_validation.normalization_complete} granularity_restore_complete=${report.completion_validation.granularity_restore_complete} adapter_restore_complete=${report.completion_validation.adapter_restore_complete} level1_master_certification_ready=${report.level1_master_certification_ready} planning_only=${report.planning_only_status}`
);
console.log(
  `phase_audits=${report.phase_audits.length} level1a=${report.phase_range_count} l1b=${report.l1b_phase_count} total=${report.total_level1_phase_count}`
);
if (report.certification_status) {
  console.log(report.certification_status);
}
console.log(`report=${LEVEL1_MASTER_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${LEVEL1_MASTER_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

const completion = report.completion_validation;

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.phases_022_to_076_complete !== 'PASS' ||
  report.l1b_phases_complete !== 'PASS' ||
  completion.engine_complete !== 'PASS' ||
  completion.dna_complete !== 'PASS' ||
  completion.adapter_complete !== 'PASS' ||
  completion.release_complete !== 'PASS' ||
  completion.archive_complete !== 'PASS' ||
  completion.image_app_complete !== 'PASS' ||
  completion.video_app_complete !== 'PASS' ||
  completion.cross_app_complete !== 'PASS' ||
  completion.validation_complete !== 'PASS' ||
  completion.normalization_complete !== 'PASS' ||
  completion.granularity_restore_complete !== 'PASS' ||
  completion.adapter_restore_complete !== 'PASS' ||
  report.level1_master_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.certification_status !== LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE ||
  report.phase_audits.length !== TOTAL_LEVEL1_PHASE_COUNT ||
  report.phase_audits.filter((audit) => audit.track === 'level1a').length !== PHASE_RANGE_COUNT ||
  report.phase_audits.filter((audit) => audit.track === 'level1b').length !== L1B_PHASE_COUNT ||
  report.phase_audits.every((audit) => audit.report_exists && audit.phase_passed) === false
) {
  console.error(
    'Expected Level 1-A (022-076) and Level 1-B (L1B-001-007) complete with all completion checks PASS and LEVEL_1_COMPLETE'
  );
  process.exit(1);
}

process.exit(0);
