import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DATASET_NORMALIZATION_REPORT_PATH,
  DATASET_NORMALIZATION_STRUCTURES_PATH,
} from '../services/movieAnalysisDatasetNormalization.js';
import {
  EXPECTED_SOURCE_COUNT,
  NORMALIZATION_QUALITY_GATE_MD_PATH,
  NORMALIZATION_QUALITY_GATE_PASS_VERDICT,
  NORMALIZATION_QUALITY_GATE_REPORT_PATH,
  writeMovieAnalysisNormalizationQualityGateReport,
} from '../services/movieAnalysisNormalizationQualityGate.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  DATASET_NORMALIZATION_REPORT_PATH,
  DATASET_NORMALIZATION_STRUCTURES_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisNormalizationQualityGateReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `redundant_fields_after_normalization=${report.redundant_fields_after_normalization} scene_collapse_safety=${report.scene_collapse_safety} adapter_signature_uniqueness=${report.adapter_signature_uniqueness} traceability_preserved=${report.traceability_preserved} dna_coverage_preserved=${report.dna_coverage_preserved} adapter_coverage_preserved=${report.adapter_coverage_preserved} cross_source_consistency=${report.cross_source_consistency} over_merge_risk=${report.over_merge_risk.length} lost_scene_granularity=${report.lost_scene_granularity.length} lost_adapter_detail=${report.lost_adapter_detail.length} normalization_quality_gate_ready=${report.normalization_quality_gate_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: collapse=${audit.scene_collapse_safety} signatures=${audit.adapter_signature_uniqueness} trace=${audit.traceability_preserved} dna=${audit.dna_coverage_preserved} adapter=${audit.adapter_coverage_preserved} over_merge=${audit.over_merge_risk_detected} granularity=${audit.lost_scene_granularity_detected} detail=${audit.lost_adapter_detail_detected} pass=${audit.source_quality_pass}`
  );
}
console.log(`report=${NORMALIZATION_QUALITY_GATE_REPORT_PATH}`);
console.log(`markdown=${NORMALIZATION_QUALITY_GATE_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== NORMALIZATION_QUALITY_GATE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.redundant_fields_after_normalization !== 0 ||
  report.scene_collapse_safety !== 'PASS' ||
  report.adapter_signature_uniqueness !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.dna_coverage_preserved !== 'PASS' ||
  report.adapter_coverage_preserved !== 'PASS' ||
  report.cross_source_consistency !== 'PASS' ||
  report.normalization_quality_gate_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.over_merge_risk.length === 0 ||
  report.lost_scene_granularity.length === 0
) {
  console.error(
    'Expected redundant_fields_after_normalization=0 all validations PASS risks detected normalization_quality_gate_ready=PASS'
  );
  process.exit(1);
}

process.exit(0);
