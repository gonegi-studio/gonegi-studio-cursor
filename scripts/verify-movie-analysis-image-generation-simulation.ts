import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  IMAGE_GENERATION_SIMULATION_MD_PATH,
  IMAGE_GENERATION_SIMULATION_PASS_VERDICT,
  IMAGE_GENERATION_SIMULATION_REPORT_PATH,
  writeMovieAnalysisImageGenerationSimulation,
} from '../services/movieAnalysisImageGenerationSimulation.js';
import { IMAGE_RUNTIME_PACKAGE_DIR, IMAGE_RUNTIME_PACKAGE_PATH } from '../services/movieAnalysisImageRuntimePackage.js';
import {
  LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT,
  LEVEL1_MASTER_CERTIFICATION_REPORT_PATH,
  LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE,
} from '../services/movieAnalysisLevel1MasterCertification.js';
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

const level1ReportPath = path.join(projectRoot, LEVEL1_MASTER_CERTIFICATION_REPORT_PATH);
if (!fs.existsSync(level1ReportPath)) {
  console.error(`Missing required upstream asset: ${LEVEL1_MASTER_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const level1Report = JSON.parse(fs.readFileSync(level1ReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (
  level1Report.final_verdict !== LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT ||
  level1Report.certification_status !== LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    `PRECHECK FAIL: LEVEL_1_COMPLETE required (${LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE})`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_DIR))) {
  console.error(`Missing required upstream directory: ${LEVEL2_MASTER_CERTIFICATION_DIR}`);
  process.exit(1);
}

const level2ReportPath = path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_REPORT_PATH);
if (!fs.existsSync(level2ReportPath)) {
  console.error(`Missing required upstream asset: ${LEVEL2_MASTER_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const level2Report = JSON.parse(fs.readFileSync(level2ReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (
  level2Report.final_verdict !== LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT ||
  level2Report.certification_status !== LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    `PRECHECK FAIL: LEVEL2_COMPLETE required (${LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE})`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_DIR))) {
  console.error(`Missing required input directory: ${IMAGE_RUNTIME_PACKAGE_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_PATH))) {
  console.error(`Missing required input package: ${IMAGE_RUNTIME_PACKAGE_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisImageGenerationSimulation(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} image_prompt_ready=${report.image_prompt_ready} scene_binding_ready=${report.scene_binding_ready} camera_binding_ready=${report.camera_binding_ready} emotion_binding_ready=${report.emotion_binding_ready} continuity_binding_ready=${report.continuity_binding_ready} storytelling_binding_ready=${report.storytelling_binding_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} image_generation_simulation_ready=${report.image_generation_simulation_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: prompt=${audit.image_prompt_ready} scene=${audit.scene_binding_ready} camera=${audit.camera_binding_ready} emotion=${audit.emotion_binding_ready} continuity=${audit.continuity_binding_ready} storytelling=${audit.storytelling_binding_ready} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} ready=${audit.source_simulation_ready}`
  );
}
console.log(`report=${IMAGE_GENERATION_SIMULATION_REPORT_PATH}`);
console.log(`markdown=${IMAGE_GENERATION_SIMULATION_MD_PATH}`);
console.log(`simulation_entries=${report.simulation_entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== IMAGE_GENERATION_SIMULATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, IMAGE_GENERATION_SIMULATION_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_prompt_ready !== 'PASS' ||
  report.scene_binding_ready !== 'PASS' ||
  report.camera_binding_ready !== 'PASS' ||
  report.emotion_binding_ready !== 'PASS' ||
  report.continuity_binding_ready !== 'PASS' ||
  report.storytelling_binding_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.image_generation_simulation_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.simulation_entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_simulation_ready === 'PASS') === false ||
  report.simulation_entries.every(
    (entry) =>
      entry.resolved_image_prompt.startsWith('image_prompt:') &&
      entry.scene_runtime.simulated_section.length > 0 &&
      entry.camera_runtime.simulated_section.length > 0 &&
      entry.emotion_runtime.simulated_section.length > 0 &&
      entry.continuity_runtime.simulated_section.length > 0 &&
      entry.storytelling_runtime.simulated_section.length > 0
  ) === false
) {
  console.error('Expected image generation simulation for all sources with runtime blocks and prompts');
  process.exit(1);
}

process.exit(0);
