import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DATASET_NORMALIZATION_MD_PATH,
  DATASET_NORMALIZATION_PASS_VERDICT,
  DATASET_NORMALIZATION_REPORT_PATH,
  DATASET_NORMALIZATION_STRUCTURES_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDatasetNormalizationReport,
} from '../services/movieAnalysisDatasetNormalization.js';
import { REDUNDANCY_DEDUP_FIX_REPORT_PATH } from '../services/movieAnalysisRedundancyDedupFix.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REDUNDANCY_DEDUP_FIX_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${REDUNDANCY_DEDUP_FIX_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisDatasetNormalizationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} dedup_rules_applied=${report.dedup_rules_applied} field_merge_rules_applied=${report.field_merge_rules_applied} adapter_normalizations_applied=${report.adapter_normalizations_applied} redundant_fields_before=${report.redundant_fields_before} redundant_fields_after_normalization=${report.redundant_fields_after_normalization} normalization_reduction_percent=${report.normalization_reduction_percent}% dataset_normalization_ready=${report.dataset_normalization_ready} planning_only=${report.planning_only_status}`
);
console.log(
  `normalized_scene_structure=${report.normalized_scene_structure.length} normalized_adapter_structure=${report.normalized_adapter_structure.length} normalized_traceability_structure=${report.normalized_traceability_structure.length}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scenes ${audit.scene_candidates_before}->${audit.scene_candidates_after} patterns ${audit.adapter_patterns_before}->${audit.adapter_patterns_after} signatures_removed=${audit.duplicate_signatures_removed} trace_links=${audit.traceability_links} normalized=${audit.source_normalized}`
  );
}
console.log(`report=${DATASET_NORMALIZATION_REPORT_PATH}`);
console.log(`markdown=${DATASET_NORMALIZATION_MD_PATH}`);
console.log(`structures=${DATASET_NORMALIZATION_STRUCTURES_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DATASET_NORMALIZATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.dedup_rules_applied < 4 ||
  report.field_merge_rules_applied === 0 ||
  report.adapter_normalizations_applied !== EXPECTED_ADAPTER_COUNT ||
  report.normalized_scene_structure.length !== EXPECTED_SOURCE_COUNT ||
  report.normalized_adapter_structure.length !== EXPECTED_SOURCE_COUNT ||
  report.normalized_traceability_structure.length !== EXPECTED_SOURCE_COUNT ||
  report.redundant_fields_after_normalization !== 0 ||
  report.normalization_reduction_percent < 95 ||
  report.dataset_normalization_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected all normalized structures for 4 sources redundant_fields_after=0 normalization_reduction>=95% dataset_normalization_ready=PASS'
  );
  process.exit(1);
}

process.exit(0);
