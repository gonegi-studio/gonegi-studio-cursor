import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_PIPELINE_CERTIFIED_STATUS,
  GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT,
  GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
} from '../services/movieAnalysisGenerationPipelineCertification.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  LEVEL2_FINAL_TRACK_COUNT,
  LEVEL2_FINAL_TRACK_ENTRIES,
  LEVEL2_FULLY_CERTIFIED_STATUS,
  LEVEL2_MASTER_FINAL_CERTIFICATION_DIR,
  LEVEL2_MASTER_FINAL_CERTIFICATION_MD_PATH,
  LEVEL2_MASTER_FINAL_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_FINAL_CERTIFICATION_REPORT_PATH,
  writeMovieAnalysisLevel2MasterFinalCertification,
} from '../services/movieAnalysisLevel2MasterFinalCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const generationPipelineReportPath = path.join(
  projectRoot,
  GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH
);
if (!fs.existsSync(generationPipelineReportPath)) {
  console.error(`Missing required upstream asset: ${GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const generationPipelineReport = JSON.parse(
  fs.readFileSync(generationPipelineReportPath, 'utf8')
) as {
  final_verdict: string;
  certification_status: string | null;
};
if (generationPipelineReport.final_verdict !== GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: L2E-014 ${GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH} must be ${GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT}`
  );
  process.exit(1);
}
if (generationPipelineReport.certification_status !== GENERATION_PIPELINE_CERTIFIED_STATUS) {
  console.error(
    `PRECHECK FAIL: L2E-014 status must be ${GENERATION_PIPELINE_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

for (const entry of LEVEL2_FINAL_TRACK_ENTRIES) {
  const abs = path.join(projectRoot, entry.report_path);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${entry.report_path} (${entry.track_id})`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisLevel2MasterFinalCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level2_final_tracks_complete=${report.level2_final_tracks_complete} runtime_complete=${report.runtime_complete} consumption_complete=${report.consumption_complete} simulation_complete=${report.simulation_complete} execution_gate_complete=${report.execution_gate_complete} generation_pipeline_complete=${report.generation_pipeline_complete} traceability_preserved=${report.traceability_preserved} cross_app_consistency=${report.cross_app_consistency} pipeline_break=${report.pipeline_break} certification_failure=${report.certification_failure} level2_master_final_certification_ready=${report.level2_master_final_certification_ready}`
);
for (const audit of report.track_audits) {
  console.log(`  ${audit.track_id}: exists=${audit.report_exists} passed=${audit.track_passed}`);
}
console.log(`report=${LEVEL2_MASTER_FINAL_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${LEVEL2_MASTER_FINAL_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2_MASTER_FINAL_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_FINAL_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_FINAL_CERTIFICATION_DIR)) ||
  report.certification_status !== LEVEL2_FULLY_CERTIFIED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2_final_track_count !== LEVEL2_FINAL_TRACK_COUNT ||
  report.level2_final_tracks_complete !== 'PASS' ||
  report.runtime_complete !== 'PASS' ||
  report.consumption_complete !== 'PASS' ||
  report.simulation_complete !== 'PASS' ||
  report.execution_gate_complete !== 'PASS' ||
  report.generation_pipeline_complete !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.cross_app_consistency !== 'PASS' ||
  report.pipeline_break !== false ||
  report.certification_failure !== false ||
  report.level2_master_final_certification_ready !== 'PASS' ||
  report.track_audits.length !== LEVEL2_FINAL_TRACK_COUNT ||
  report.track_audits.every((audit) => audit.track_passed) === false
) {
  console.error(
    'Expected LEVEL2_FULLY_CERTIFIED with complete Level2A–Level2E integration and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
