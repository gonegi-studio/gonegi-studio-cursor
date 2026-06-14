import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEVEL2C_SIMULATION_CERTIFICATION_DIR,
  LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
  LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
} from '../services/movieAnalysisLevel2CSimulationCertification.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_MD_PATH,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
  LEVEL2_MASTER_SIMULATION_TRACK_COUNT,
  LEVEL2_MASTER_SIMULATION_TRACK_ENTRIES,
  writeMovieAnalysisLevel2MasterSimulationCertification,
} from '../services/movieAnalysisLevel2MasterSimulationCertification.js';
import {
  LEVEL2_MASTER_CERTIFICATION_DIR,
  LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
  LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE,
} from '../services/movieAnalysisLevel2MasterCertification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const dir of [LEVEL2_MASTER_CERTIFICATION_DIR, LEVEL2C_SIMULATION_CERTIFICATION_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, dir))) {
    console.error(`Missing required upstream directory: ${dir}`);
    process.exit(1);
  }
}

for (const entry of LEVEL2_MASTER_SIMULATION_TRACK_ENTRIES) {
  const abs = path.join(projectRoot, entry.report_path);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${entry.report_path} (${entry.track_id})`);
    process.exit(1);
  }

  const trackReport = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    final_verdict?: string;
    certification_status?: string | null;
  };
  if (
    trackReport.final_verdict !== entry.pass_verdict ||
    trackReport.certification_status !== entry.status_message
  ) {
    console.error(
      `PRECHECK FAIL: ${entry.track_id} ${entry.report_path} must be ${entry.pass_verdict} with status ${entry.status_message}`
    );
    process.exit(1);
  }
}

const report = writeMovieAnalysisLevel2MasterSimulationCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level2_master_simulation_tracks_complete=${report.level2_master_simulation_tracks_complete} level2_runtime_complete=${report.completion_validation.level2_runtime_complete} level2b_consumption_complete=${report.completion_validation.level2b_consumption_complete} level2c_simulation_complete=${report.completion_validation.level2c_simulation_complete} image_runtime_ready=${report.completion_validation.image_runtime_ready} video_runtime_ready=${report.completion_validation.video_runtime_ready} image_app_consumption_ready=${report.completion_validation.image_app_consumption_ready} video_app_consumption_ready=${report.completion_validation.video_app_consumption_ready} cross_app_consumption_ready=${report.completion_validation.cross_app_consumption_ready} image_generation_simulation_ready=${report.completion_validation.image_generation_simulation_ready} video_generation_simulation_ready=${report.completion_validation.video_generation_simulation_ready} cross_generation_simulation_ready=${report.completion_validation.cross_generation_simulation_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} level2_master_simulation_certification_ready=${report.level2_master_simulation_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.track_audits) {
  console.log(`  ${audit.track_id}: exists=${audit.report_exists} passed=${audit.track_passed}`);
}
console.log(`report=${LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${LEVEL2_MASTER_SIMULATION_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

const completion = report.completion_validation;
if (
  !fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH)) ||
  report.certification_status !== LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2_master_simulation_track_count !== LEVEL2_MASTER_SIMULATION_TRACK_COUNT ||
  report.level2_master_simulation_tracks_complete !== 'PASS' ||
  completion.level2_runtime_complete !== 'PASS' ||
  completion.level2b_consumption_complete !== 'PASS' ||
  completion.level2c_simulation_complete !== 'PASS' ||
  completion.image_runtime_ready !== 'PASS' ||
  completion.video_runtime_ready !== 'PASS' ||
  completion.image_app_consumption_ready !== 'PASS' ||
  completion.video_app_consumption_ready !== 'PASS' ||
  completion.cross_app_consumption_ready !== 'PASS' ||
  completion.image_generation_simulation_ready !== 'PASS' ||
  completion.video_generation_simulation_ready !== 'PASS' ||
  completion.cross_generation_simulation_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.level2_master_simulation_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.track_audits.length !== LEVEL2_MASTER_SIMULATION_TRACK_COUNT ||
  report.track_audits.every((audit) => audit.track_passed) === false ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH))
) {
  console.error(
    'Expected Level 2 master simulation certification with runtime, consumption, and simulation tracks PASS'
  );
  process.exit(1);
}

if (
  LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE !== 'LEVEL2_COMPLETE' ||
  LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE !== 'LEVEL2C_COMPLETE'
) {
  console.error('Expected LEVEL2_COMPLETE and LEVEL2C_COMPLETE status alignment for precheck tracks');
  process.exit(1);
}

process.exit(0);
