import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  LEVEL2_PHASE_ENTRIES,
  LEVEL2_PHASE_COUNT,
  LEVEL2_RUNTIME_CERTIFICATION_MD_PATH,
  LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT,
  LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
  LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE,
  writeMovieAnalysisLevel2RuntimeCertification,
} from '../services/movieAnalysisLevel2RuntimeCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const entry of LEVEL2_PHASE_ENTRIES) {
  const abs = path.join(projectRoot, entry.report_path);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${entry.report_path} (${entry.phase_id})`);
    process.exit(1);
  }

  const phaseReport = JSON.parse(fs.readFileSync(abs, 'utf8')) as { final_verdict?: string };
  if (phaseReport.final_verdict !== entry.pass_verdict) {
    console.error(
      `PRECHECK FAIL: ${entry.phase_id} ${entry.report_path} must be ${entry.pass_verdict}`
    );
    process.exit(1);
  }
}

const report = writeMovieAnalysisLevel2RuntimeCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level2_phases_complete=${report.level2_phases_complete} runtime_binding_complete=${report.completion_validation.runtime_binding_complete} prompt_generation_complete=${report.completion_validation.prompt_generation_complete} prompt_assembly_complete=${report.completion_validation.prompt_assembly_complete} prompt_quality_gate_complete=${report.completion_validation.prompt_quality_gate_complete} prompt_conflict_resolution_complete=${report.completion_validation.prompt_conflict_resolution_complete} image_runtime_package_ready=${report.completion_validation.image_runtime_package_ready} video_runtime_package_ready=${report.completion_validation.video_runtime_package_ready} runtime_integration_ready=${report.completion_validation.runtime_integration_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} cross_runtime_consistency=${report.cross_runtime_consistency} level2_runtime_certification_ready=${report.level2_runtime_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.phase_audits) {
  console.log(`  ${audit.phase_id}: exists=${audit.report_exists} passed=${audit.phase_passed}`);
}
console.log(`report=${LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${LEVEL2_RUNTIME_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

const completion = report.completion_validation;
if (
  !fs.existsSync(path.join(projectRoot, LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH)) ||
  report.certification_status !== LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2_phase_count !== LEVEL2_PHASE_COUNT ||
  report.level2_phases_complete !== 'PASS' ||
  completion.runtime_binding_complete !== 'PASS' ||
  completion.prompt_generation_complete !== 'PASS' ||
  completion.prompt_assembly_complete !== 'PASS' ||
  completion.prompt_quality_gate_complete !== 'PASS' ||
  completion.prompt_conflict_resolution_complete !== 'PASS' ||
  completion.image_runtime_package_ready !== 'PASS' ||
  completion.video_runtime_package_ready !== 'PASS' ||
  completion.runtime_integration_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.cross_runtime_consistency !== 'PASS' ||
  report.level2_runtime_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.phase_audits.length !== LEVEL2_PHASE_COUNT ||
  report.phase_audits.every((audit) => audit.phase_passed) === false
) {
  console.error('Expected Level 2 runtime certification with all phases and validations PASS');
  process.exit(1);
}

process.exit(0);
