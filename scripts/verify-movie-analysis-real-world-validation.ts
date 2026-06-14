import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_FINAL_HANDOFF_PATH } from '../services/movieAnalysisEngineFinalHandoff.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_WORLD_VALIDATION_MD_PATH,
  REAL_WORLD_VALIDATION_PASS_VERDICT,
  REAL_WORLD_VALIDATION_REPORT_PATH,
  REAL_WORLD_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisRealWorldValidationReport,
} from '../services/movieAnalysisRealWorldValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, ENGINE_FINAL_HANDOFF_PATH))) {
  console.error(`Missing required upstream asset: ${ENGINE_FINAL_HANDOFF_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealWorldValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} scene_detection_quality=${report.scene_detection_quality} scene_boundary_quality=${report.scene_boundary_quality} camera_dna_quality=${report.camera_dna_quality} emotion_dna_quality=${report.emotion_dna_quality} transition_dna_quality=${report.transition_dna_quality} storytelling_dna_quality=${report.storytelling_dna_quality} adapter_quality=${report.adapter_quality} traceability_quality=${report.traceability_quality} dna_coverage=${report.dna_coverage.toFixed(3)} adapter_coverage=${report.adapter_coverage.toFixed(3)} cross_source_consistency=${report.cross_source_consistency} level1_completion_score=${report.level1_completion_score} real_world_validation_ready=${report.real_world_validation_ready} planning_only=${report.planning_only_status}`
);
console.log(
  `missing_fields=${report.missing_fields.length} redundant_fields=${report.redundant_fields.length} weak_fields=${report.weak_fields.length} improvement_candidates=${report.improvement_candidates.length} schema_fix_candidates=${report.schema_fix_candidates.length} adapter_fix_candidates=${report.adapter_fix_candidates.length} pipeline_fix_candidates=${report.pipeline_fix_candidates.length}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_detection_quality} boundary=${audit.scene_boundary_quality} camera=${audit.camera_dna_quality} emotion=${audit.emotion_dna_quality} transition=${audit.transition_dna_quality} storytelling=${audit.storytelling_dna_quality} adapter=${audit.adapter_quality} trace=${audit.traceability_quality} ready=${audit.source_validation_ready}`
  );
}
console.log(`strengths=${report.validated_strengths.length} weaknesses=${report.validated_weaknesses.length} required_fixes=${report.required_fixes.length}`);
if (report.certification_status) {
  console.log(report.certification_status);
}
console.log(`report=${REAL_WORLD_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_WORLD_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_WORLD_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.scene_detection_quality !== 'PASS' ||
  report.scene_boundary_quality !== 'PASS' ||
  report.camera_dna_quality !== 'PASS' ||
  report.emotion_dna_quality !== 'PASS' ||
  report.transition_dna_quality !== 'PASS' ||
  report.storytelling_dna_quality !== 'PASS' ||
  report.adapter_quality !== 'PASS' ||
  report.traceability_quality !== 'PASS' ||
  report.cross_source_consistency !== 'PASS' ||
  report.real_world_validation_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.level1_completion_score >= 75 === false ||
  report.validated_strengths.length > 0 === false ||
  report.validated_weaknesses.length > 0 === false ||
  report.required_fixes.length > 0 === false ||
  report.certification_status !== REAL_WORLD_VALIDATION_STATUS_MESSAGE
) {
  console.error(
    'Expected all quality audits PASS cross_source_consistency=PASS level1_completion_score>=75 validated_strengths/weaknesses/required_fixes populated LEVEL_1B_VALIDATION_COMPLETE'
  );
  process.exit(1);
}

process.exit(0);
