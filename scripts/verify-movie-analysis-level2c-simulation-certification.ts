import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CROSS_GENERATION_SIMULATION_CERTIFICATION_DIR,
  CROSS_GENERATION_SIMULATION_CERTIFICATION_PASS_VERDICT,
  CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH,
} from '../services/movieAnalysisCrossGenerationSimulationCertification.js';
import {
  IMAGE_GENERATION_SIMULATION_DIR,
  IMAGE_GENERATION_SIMULATION_PASS_VERDICT,
  IMAGE_GENERATION_SIMULATION_REPORT_PATH,
} from '../services/movieAnalysisImageGenerationSimulation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  LEVEL2C_PHASE_COUNT,
  LEVEL2C_PHASE_ENTRIES,
  LEVEL2C_SIMULATION_CERTIFICATION_MD_PATH,
  LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
  LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
  writeMovieAnalysisLevel2CSimulationCertification,
} from '../services/movieAnalysisLevel2CSimulationCertification.js';
import {
  VIDEO_GENERATION_SIMULATION_DIR,
  VIDEO_GENERATION_SIMULATION_PASS_VERDICT,
  VIDEO_GENERATION_SIMULATION_REPORT_PATH,
} from '../services/movieAnalysisVideoGenerationSimulation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const dir of [
  IMAGE_GENERATION_SIMULATION_DIR,
  VIDEO_GENERATION_SIMULATION_DIR,
  CROSS_GENERATION_SIMULATION_CERTIFICATION_DIR,
]) {
  if (!fs.existsSync(path.join(projectRoot, dir))) {
    console.error(`Missing required upstream directory: ${dir}`);
    process.exit(1);
  }
}

for (const entry of LEVEL2C_PHASE_ENTRIES) {
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

const report = writeMovieAnalysisLevel2CSimulationCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level2c_phases_complete=${report.level2c_phases_complete} image_generation_simulation_ready=${report.completion_validation.image_generation_simulation_ready} video_generation_simulation_ready=${report.completion_validation.video_generation_simulation_ready} cross_generation_simulation_ready=${report.completion_validation.cross_generation_simulation_ready} runtime_mapping_consistency=${report.runtime_mapping_consistency} traceability_consistency=${report.traceability_consistency} cross_generation_consistency=${report.cross_generation_consistency} level2c_simulation_certification_ready=${report.level2c_simulation_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.phase_audits) {
  console.log(`  ${audit.phase_id}: exists=${audit.report_exists} passed=${audit.phase_passed}`);
}
console.log(`report=${LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${LEVEL2C_SIMULATION_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

const completion = report.completion_validation;
if (
  !fs.existsSync(path.join(projectRoot, LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH)) ||
  report.certification_status !== LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2c_phase_count !== LEVEL2C_PHASE_COUNT ||
  report.level2c_phases_complete !== 'PASS' ||
  completion.image_generation_simulation_ready !== 'PASS' ||
  completion.video_generation_simulation_ready !== 'PASS' ||
  completion.cross_generation_simulation_ready !== 'PASS' ||
  report.runtime_mapping_consistency !== 'PASS' ||
  report.traceability_consistency !== 'PASS' ||
  report.cross_generation_consistency !== 'PASS' ||
  report.level2c_simulation_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.phase_audits.length !== LEVEL2C_PHASE_COUNT ||
  report.phase_audits.every((audit) => audit.phase_passed) === false ||
  !fs.existsSync(path.join(projectRoot, IMAGE_GENERATION_SIMULATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_GENERATION_SIMULATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH))
) {
  console.error('Expected Level 2C simulation certification with all phases and validations PASS');
  process.exit(1);
}

process.exit(0);
