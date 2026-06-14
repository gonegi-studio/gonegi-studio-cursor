import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CROSS_GENERATION_SIMULATION_CERTIFICATION_MD_PATH,
  CROSS_GENERATION_SIMULATION_CERTIFICATION_PASS_VERDICT,
  CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisCrossGenerationSimulationCertification,
} from '../services/movieAnalysisCrossGenerationSimulationCertification.js';
import {
  IMAGE_GENERATION_SIMULATION_DIR,
  IMAGE_GENERATION_SIMULATION_PASS_VERDICT,
  IMAGE_GENERATION_SIMULATION_REPORT_PATH,
} from '../services/movieAnalysisImageGenerationSimulation.js';
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

for (const dir of [IMAGE_GENERATION_SIMULATION_DIR, VIDEO_GENERATION_SIMULATION_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, dir))) {
    console.error(`Missing required upstream directory: ${dir}`);
    process.exit(1);
  }
}

const imageSimulationReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, IMAGE_GENERATION_SIMULATION_REPORT_PATH), 'utf8')
) as { final_verdict: string };
if (imageSimulationReport.final_verdict !== IMAGE_GENERATION_SIMULATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2C-001 ${IMAGE_GENERATION_SIMULATION_REPORT_PATH} must be ${IMAGE_GENERATION_SIMULATION_PASS_VERDICT}`
  );
  process.exit(1);
}

const videoSimulationReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_GENERATION_SIMULATION_REPORT_PATH), 'utf8')
) as { final_verdict: string };
if (videoSimulationReport.final_verdict !== VIDEO_GENERATION_SIMULATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2C-002 ${VIDEO_GENERATION_SIMULATION_REPORT_PATH} must be ${VIDEO_GENERATION_SIMULATION_PASS_VERDICT}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisCrossGenerationSimulationCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} image_generation_simulation_ready=${report.image_generation_simulation_ready} video_generation_simulation_ready=${report.video_generation_simulation_ready} runtime_mapping_consistency=${report.runtime_mapping_consistency} traceability_consistency=${report.traceability_consistency} cross_generation_consistency=${report.cross_generation_consistency} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: image=${audit.image_simulation_pass} video=${audit.video_simulation_pass} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} ready=${audit.cross_generation_ready}`
  );
}
console.log(`report=${CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${CROSS_GENERATION_SIMULATION_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CROSS_GENERATION_SIMULATION_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_generation_simulation_ready !== 'PASS' ||
  report.video_generation_simulation_ready !== 'PASS' ||
  report.runtime_mapping_consistency !== 'PASS' ||
  report.traceability_consistency !== 'PASS' ||
  report.cross_generation_consistency !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every(
    (audit) =>
      audit.image_simulation_pass === 'PASS' &&
      audit.video_simulation_pass === 'PASS' &&
      audit.runtime_mapping_preserved === 'PASS' &&
      audit.traceability_preserved === 'PASS' &&
      audit.cross_generation_ready === 'PASS'
  ) === false
) {
  console.error(
    'Expected cross generation simulation certification for all sources with consistent mappings and traceability'
  );
  process.exit(1);
}

process.exit(0);
