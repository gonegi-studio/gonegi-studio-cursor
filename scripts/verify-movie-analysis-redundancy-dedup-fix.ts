import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REDUNDANCY_DEDUP_FIX_MD_PATH,
  REDUNDANCY_DEDUP_FIX_PASS_VERDICT,
  REDUNDANCY_DEDUP_FIX_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisRedundancyDedupFixReport,
} from '../services/movieAnalysisRedundancyDedupFix.js';
import { REAL_WORLD_VALIDATION_REPORT_PATH } from '../services/movieAnalysisRealWorldValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_WORLD_VALIDATION_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${REAL_WORLD_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRedundancyDedupFixReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `redundant_fields_before=${report.redundant_fields_before} redundant_fields_after_projection=${report.redundant_fields_after_projection} redundant_field_reduction_percent=${report.redundant_field_reduction_percent}% overlapping_scene_windows=${report.overlapping_scene_windows.length} duplicate_adapter_signatures=${report.duplicate_adapter_signatures.length} blueprint_runtime_merge_duplicates=${report.blueprint_runtime_merge_duplicates.length} dedup_rules=${report.dedup_rules.length} field_merge_rules=${report.field_merge_rules.length} adapter_signature_normalization=${report.adapter_signature_normalization.length} scene_overlap_resolution_candidates=${report.scene_overlap_resolution_candidates.length} dedup_analysis_complete=${report.dedup_analysis_complete} dedup_fix_ready=${report.dedup_fix_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: redundant=${audit.redundant_field_count} overlaps=${audit.overlapping_scene_windows} signatures=${audit.duplicate_adapter_signatures} merge_dupes=${audit.blueprint_runtime_merge_duplicates} projected_reduction=${audit.projected_redundant_field_reduction} ready=${audit.source_dedup_ready}`
  );
}
console.log(`report=${REDUNDANCY_DEDUP_FIX_REPORT_PATH}`);
console.log(`markdown=${REDUNDANCY_DEDUP_FIX_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REDUNDANCY_DEDUP_FIX_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.redundant_fields_before > 0 &&
  report.redundant_fields_after_projection < report.redundant_fields_before &&
  report.overlapping_scene_windows.length > 0 &&
  report.duplicate_adapter_signatures.length > 0 &&
  report.blueprint_runtime_merge_duplicates.length > 0 &&
  report.dedup_rules.length >= 4 &&
  report.field_merge_rules.length > 0 &&
  report.adapter_signature_normalization.length === EXPECTED_SOURCE_COUNT * 6 &&
  report.scene_overlap_resolution_candidates.length === EXPECTED_SOURCE_COUNT &&
  report.dedup_analysis_complete === 'PASS' &&
  report.dedup_fix_ready === 'PASS' &&
  report.planning_only_status === 'PASS' &&
  report.redundant_field_reduction_percent >= 50
) {
  process.exit(0);
}

console.error(
  'Expected redundant analysis complete with dedup rules, merge rules, normalization, scene overlap candidates, and >=50% projected reduction'
);
process.exit(1);
