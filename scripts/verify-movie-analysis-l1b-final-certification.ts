import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADAPTER_DETAIL_RESTORE_REPORT_PATH } from '../services/movieAnalysisAdapterDetailRestore.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  L1B_FINAL_CERTIFICATION_MD_PATH,
  L1B_FINAL_CERTIFICATION_PASS_VERDICT,
  L1B_FINAL_CERTIFICATION_REPORT_PATH,
  L1B_FINAL_CERTIFICATION_STATUS_MESSAGE,
  writeMovieAnalysisL1bFinalCertificationReport,
} from '../services/movieAnalysisL1bFinalCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, ADAPTER_DETAIL_RESTORE_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${ADAPTER_DETAIL_RESTORE_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisL1bFinalCertificationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `real_world_validation=${report.real_world_validation} dedup_fix=${report.dedup_fix} dataset_normalization=${report.dataset_normalization} normalization_quality_gate=${report.normalization_quality_gate} scene_granularity_restore=${report.scene_granularity_restore} adapter_detail_restore=${report.adapter_detail_restore} l1b_phases_complete=${report.l1b_phases_complete} redundancy_after_fix=${report.additional_validation.redundancy_after_fix} scene_granularity_restored=${report.additional_validation.scene_granularity_restored} adapter_detail_restored=${report.additional_validation.adapter_detail_restored} traceability_preserved=${report.additional_validation.traceability_preserved} dna_coverage_preserved=${report.additional_validation.dna_coverage_preserved} adapter_coverage_preserved=${report.additional_validation.adapter_coverage_preserved} level1b_certification_ready=${report.level1b_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.phase_audits) {
  console.log(
    `  ${audit.phase_id}: report=${audit.report_exists ? 'PASS' : 'FAIL'} phase=${audit.phase_passed ? 'PASS' : 'FAIL'}`
  );
}
if (report.certification_status) {
  console.log(report.certification_status);
}
console.log(`report=${L1B_FINAL_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${L1B_FINAL_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== L1B_FINAL_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.real_world_validation !== 'PASS' ||
  report.dedup_fix !== 'PASS' ||
  report.dataset_normalization !== 'PASS' ||
  report.normalization_quality_gate !== 'PASS' ||
  report.scene_granularity_restore !== 'PASS' ||
  report.adapter_detail_restore !== 'PASS' ||
  report.l1b_phases_complete !== 'PASS' ||
  report.additional_validation.redundancy_after_fix !== 0 ||
  report.additional_validation.scene_granularity_restored !== 'PASS' ||
  report.additional_validation.adapter_detail_restored !== 'PASS' ||
  report.additional_validation.traceability_preserved !== 'PASS' ||
  report.additional_validation.dna_coverage_preserved !== 'PASS' ||
  report.additional_validation.adapter_coverage_preserved !== 'PASS' ||
  report.level1b_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.certification_status !== L1B_FINAL_CERTIFICATION_STATUS_MESSAGE ||
  report.phase_audits.every((audit) => audit.report_exists && audit.phase_passed) === false
) {
  console.error(
    'Expected all L1B phases PASS with redundancy_after_fix=0 coverage/traceability preserved granularity/detail restored LEVEL_1B_COMPLETE'
  );
  process.exit(1);
}

process.exit(0);
