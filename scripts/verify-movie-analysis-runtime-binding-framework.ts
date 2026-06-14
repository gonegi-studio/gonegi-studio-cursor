import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVEL1_MASTER_CERTIFICATION_REPORT_PATH } from '../services/movieAnalysisLevel1MasterCertification.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  RUNTIME_BINDING_FRAMEWORK_MD_PATH,
  RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT,
  RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
  writeMovieAnalysisRuntimeBindingFrameworkReport,
} from '../services/movieAnalysisRuntimeBindingFramework.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, LEVEL1_MASTER_CERTIFICATION_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${LEVEL1_MASTER_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRuntimeBindingFrameworkReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} bindings=${report.adapter_runtime_bindings.length} candidates=${report.runtime_binding_candidates.length} scene_binding_complete=${report.scene_binding_complete} camera_binding_complete=${report.camera_binding_complete} emotion_binding_complete=${report.emotion_binding_complete} transition_binding_complete=${report.transition_binding_complete} continuity_binding_complete=${report.continuity_binding_complete} storytelling_binding_complete=${report.storytelling_binding_complete} runtime_mapping_complete=${report.runtime_mapping_complete} traceability_preserved=${report.traceability_preserved} runtime_binding_framework_ready=${report.runtime_binding_framework_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_binding} camera=${audit.camera_binding} emotion=${audit.emotion_binding} transition=${audit.transition_binding} continuity=${audit.continuity_binding} storytelling=${audit.storytelling_binding} trace=${audit.traceability_preserved} ready=${audit.source_binding_ready}`
  );
}
console.log(`report=${RUNTIME_BINDING_FRAMEWORK_REPORT_PATH}`);
console.log(`markdown=${RUNTIME_BINDING_FRAMEWORK_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.adapter_runtime_bindings.length !== EXPECTED_ADAPTER_COUNT ||
  report.runtime_mapping_rules.length !== 6 ||
  report.runtime_binding_candidates.length > 0 === false ||
  report.scene_binding_complete !== 'PASS' ||
  report.camera_binding_complete !== 'PASS' ||
  report.emotion_binding_complete !== 'PASS' ||
  report.transition_binding_complete !== 'PASS' ||
  report.continuity_binding_complete !== 'PASS' ||
  report.storytelling_binding_complete !== 'PASS' ||
  report.runtime_mapping_complete !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.runtime_binding_framework_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_binding_ready === 'PASS') === false
) {
  console.error(
    'Expected runtime bindings for all 24 adapters with complete mapping, traceability preserved, and planning_only PASS'
  );
  process.exit(1);
}

process.exit(0);
