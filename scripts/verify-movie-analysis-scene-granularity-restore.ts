import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NORMALIZATION_QUALITY_GATE_REPORT_PATH } from '../services/movieAnalysisNormalizationQualityGate.js';
import {
  EXPECTED_SOURCE_COUNT,
  SCENE_GRANULARITY_RESTORE_MD_PATH,
  SCENE_GRANULARITY_RESTORE_PASS_VERDICT,
  SCENE_GRANULARITY_RESTORE_REPORT_PATH,
  writeMovieAnalysisSceneGranularityRestoreReport,
} from '../services/movieAnalysisSceneGranularityRestore.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, NORMALIZATION_QUALITY_GATE_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${NORMALIZATION_QUALITY_GATE_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisSceneGranularityRestoreReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `over_merge_risk=${report.over_merge_risk.length} lost_scene_granularity=${report.lost_scene_granularity.length} collapse_safety_details=${report.scene_collapse_safety_details.length} split_points=${report.recommended_scene_split_points.length} restore_candidates=${report.scene_boundary_restore_candidates.length} recovery_rules=${report.granularity_recovery_rules.length} redundancy_reintroduced=${report.redundancy_reintroduced} scene_granularity_restore_ready=${report.scene_granularity_restore_ready} planning_only=${report.planning_only_status}`
);
for (const estimate of report.optimal_scene_count_per_source) {
  console.log(
    `  optimal ${estimate.source_video_id}: current=${estimate.current_scene_count} optimal=${estimate.optimal_scene_count} recovery_ratio=${estimate.recovery_ratio}`
  );
}
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: over_merge=${audit.over_merge_risk_detected} lost_granularity=${audit.lost_scene_granularity_detected} splits=${audit.recommended_split_points} restored=${audit.restore_candidates} overlaps=${audit.overlap_count_after_restore} granularity_restored=${audit.granularity_restored}`
  );
}
console.log(`report=${SCENE_GRANULARITY_RESTORE_REPORT_PATH}`);
console.log(`markdown=${SCENE_GRANULARITY_RESTORE_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== SCENE_GRANULARITY_RESTORE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.over_merge_risk.length !== EXPECTED_SOURCE_COUNT ||
  report.lost_scene_granularity.length !== EXPECTED_SOURCE_COUNT ||
  report.scene_collapse_safety_details.length !== EXPECTED_SOURCE_COUNT ||
  report.recommended_scene_split_points.length > 0 === false ||
  report.scene_boundary_restore_candidates.length > 0 === false ||
  report.granularity_recovery_rules.length >= 4 === false ||
  report.optimal_scene_count_per_source.length !== EXPECTED_SOURCE_COUNT ||
  report.redundancy_reintroduced !== 0 ||
  report.scene_granularity_restore_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.every((audit) => audit.granularity_restored === 'PASS') === false ||
  report.optimal_scene_count_per_source.every((estimate) => estimate.recovery_ratio === 1) === false
) {
  console.error(
    'Expected granularity restored for all sources with zero redundancy reintroduced and optimal scene counts recovered'
  );
  process.exit(1);
}

process.exit(0);
