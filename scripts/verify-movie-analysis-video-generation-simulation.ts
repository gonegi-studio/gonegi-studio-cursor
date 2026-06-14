import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_GENERATION_SIMULATION_PASS_VERDICT,
  IMAGE_GENERATION_SIMULATION_REPORT_PATH,
} from '../services/movieAnalysisImageGenerationSimulation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  VIDEO_GENERATION_SIMULATION_MD_PATH,
  VIDEO_GENERATION_SIMULATION_PASS_VERDICT,
  VIDEO_GENERATION_SIMULATION_REPORT_PATH,
  writeMovieAnalysisVideoGenerationSimulation,
} from '../services/movieAnalysisVideoGenerationSimulation.js';
import {
  VIDEO_RUNTIME_PACKAGE_DIR,
  VIDEO_RUNTIME_PACKAGE_PATH,
} from '../services/movieAnalysisVideoRuntimePackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const imageSimulationReportPath = path.join(projectRoot, IMAGE_GENERATION_SIMULATION_REPORT_PATH);
if (!fs.existsSync(imageSimulationReportPath)) {
  console.error(`Missing required upstream asset: ${IMAGE_GENERATION_SIMULATION_REPORT_PATH}`);
  process.exit(1);
}

const imageSimulationReport = JSON.parse(
  fs.readFileSync(imageSimulationReportPath, 'utf8')
) as { final_verdict: string };
if (imageSimulationReport.final_verdict !== IMAGE_GENERATION_SIMULATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2C-001 ${IMAGE_GENERATION_SIMULATION_REPORT_PATH} must be ${IMAGE_GENERATION_SIMULATION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_DIR))) {
  console.error(`Missing required input directory: ${VIDEO_RUNTIME_PACKAGE_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_PATH))) {
  console.error(`Missing required input package: ${VIDEO_RUNTIME_PACKAGE_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisVideoGenerationSimulation(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} video_prompt_ready=${report.video_prompt_ready} scene_binding_ready=${report.scene_binding_ready} camera_binding_ready=${report.camera_binding_ready} emotion_binding_ready=${report.emotion_binding_ready} transition_binding_ready=${report.transition_binding_ready} continuity_binding_ready=${report.continuity_binding_ready} storytelling_binding_ready=${report.storytelling_binding_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} video_generation_simulation_ready=${report.video_generation_simulation_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: prompt=${audit.video_prompt_ready} scene=${audit.scene_binding_ready} camera=${audit.camera_binding_ready} emotion=${audit.emotion_binding_ready} transition=${audit.transition_binding_ready} continuity=${audit.continuity_binding_ready} storytelling=${audit.storytelling_binding_ready} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} ready=${audit.source_simulation_ready}`
  );
}
console.log(`report=${VIDEO_GENERATION_SIMULATION_REPORT_PATH}`);
console.log(`markdown=${VIDEO_GENERATION_SIMULATION_MD_PATH}`);
console.log(`simulation_entries=${report.simulation_entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_GENERATION_SIMULATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, VIDEO_GENERATION_SIMULATION_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.video_prompt_ready !== 'PASS' ||
  report.scene_binding_ready !== 'PASS' ||
  report.camera_binding_ready !== 'PASS' ||
  report.emotion_binding_ready !== 'PASS' ||
  report.transition_binding_ready !== 'PASS' ||
  report.continuity_binding_ready !== 'PASS' ||
  report.storytelling_binding_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.video_generation_simulation_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.simulation_entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_simulation_ready === 'PASS') === false ||
  report.simulation_entries.every(
    (entry) =>
      entry.resolved_video_prompt.startsWith('video_prompt:') &&
      entry.scene_runtime.resolved_section.length > 0 &&
      entry.camera_runtime.resolved_section.length > 0 &&
      entry.emotion_runtime.resolved_section.length > 0 &&
      entry.transition_runtime.resolved_section.length > 0 &&
      entry.continuity_runtime.resolved_section.length > 0 &&
      entry.storytelling_runtime.resolved_section.length > 0
  ) === false
) {
  console.error('Expected video generation simulation for all sources with six runtime blocks and prompts');
  process.exit(1);
}

process.exit(0);
