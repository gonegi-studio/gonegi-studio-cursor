import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADAPTER_DETAIL_RESTORE_MD_PATH,
  ADAPTER_DETAIL_RESTORE_PASS_VERDICT,
  ADAPTER_DETAIL_RESTORE_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_LOST_ADAPTER_DETAIL_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisAdapterDetailRestoreReport,
} from '../services/movieAnalysisAdapterDetailRestore.js';
import { SCENE_GRANULARITY_RESTORE_REPORT_PATH } from '../services/movieAnalysisSceneGranularityRestore.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, SCENE_GRANULARITY_RESTORE_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${SCENE_GRANULARITY_RESTORE_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisAdapterDetailRestoreReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `lost_adapter_detail=${report.lost_adapter_detail.length} adapter_signature_normalization=${report.adapter_signature_normalization.length} adapter_reduction_patterns=${report.adapter_reduction_patterns.length} restore_candidates=${report.adapter_detail_restore_candidates.length} recovery_rules=${report.adapter_information_recovery_rules.length} preservation_rules=${report.adapter_signature_preservation_rules.length} detail_recovery_ratio=${report.detail_recovery_ratio.detail_recovery_ratio} duplicate_signatures_reintroduced=${report.duplicate_signatures_reintroduced} adapter_detail_restore_ready=${report.adapter_detail_restore_ready} planning_only=${report.planning_only_status}`
);
for (const score of report.per_adapter_recovery_score.filter((entry) => entry.lost_pattern_ids > 0)) {
  console.log(
    `  ${score.source_video_id}/${score.adapter_type}: lost=${score.lost_pattern_ids} restored=${score.restore_candidates} score=${score.recovery_score} detail_restored=${score.detail_restored}`
  );
}
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: lost_detail=${audit.lost_adapter_detail_count} reduction_patterns=${audit.adapter_reduction_patterns} restore_candidates=${audit.restore_candidates} duplicates=${audit.duplicate_signatures_reintroduced} adapter_detail_restored=${audit.adapter_detail_restored}`
  );
}
console.log(`report=${ADAPTER_DETAIL_RESTORE_REPORT_PATH}`);
console.log(`markdown=${ADAPTER_DETAIL_RESTORE_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== ADAPTER_DETAIL_RESTORE_PASS_VERDICT) {
  process.exit(1);
}

const affectedScores = report.per_adapter_recovery_score.filter((score) =>
  report.lost_adapter_detail.some(
    (risk) =>
      risk.source_video_id === score.source_video_id &&
      risk.detail.includes(`${score.adapter_type} patterns`)
  )
);

if (
  report.lost_adapter_detail.length !== EXPECTED_LOST_ADAPTER_DETAIL_COUNT ||
  report.adapter_signature_normalization.length !== EXPECTED_ADAPTER_COUNT ||
  report.adapter_reduction_patterns.length !== EXPECTED_ADAPTER_COUNT ||
  report.adapter_detail_restore_candidates.length > 0 === false ||
  report.adapter_information_recovery_rules.length >= 4 === false ||
  report.adapter_signature_preservation_rules.length >= 4 === false ||
  report.detail_recovery_ratio.detail_recovery_ratio !== 1 ||
  report.duplicate_signatures_reintroduced !== 0 ||
  report.adapter_detail_restore_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.adapter_detail_restored === 'PASS') === false ||
  affectedScores.every((score) => score.recovery_score === 1 && score.detail_restored === 'PASS') ===
    false
) {
  console.error(
    'Expected adapter detail restored for all affected adapters with zero duplicate signatures reintroduced and full detail recovery ratio'
  );
  process.exit(1);
}

process.exit(0);
