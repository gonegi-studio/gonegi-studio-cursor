import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_RUNTIME_PACKAGE_PASS_VERDICT,
  IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
} from '../services/movieAnalysisImageRuntimePackage.js';
import { PROMPT_CONFLICT_RESOLUTION_REPORT_PATH } from '../services/movieAnalysisPromptConflictResolution.js';
import {
  RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT,
  RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
} from '../services/movieAnalysisRuntimeBindingFramework.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  VIDEO_RUNTIME_PACKAGE_MD_PATH,
  VIDEO_RUNTIME_PACKAGE_PASS_VERDICT,
  VIDEO_RUNTIME_PACKAGE_PATH,
  VIDEO_RUNTIME_PACKAGE_REPORT_PATH,
  writeMovieAnalysisVideoRuntimePackage,
} from '../services/movieAnalysisVideoRuntimePackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const precheckPaths = [
  RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
  PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
  IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
];

for (const precheckPath of precheckPaths) {
  const abs = path.join(projectRoot, precheckPath);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${precheckPath}`);
    process.exit(1);
  }
}

const bindingReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, RUNTIME_BINDING_FRAMEWORK_REPORT_PATH), 'utf8')
) as { final_verdict: string };
if (bindingReport.final_verdict !== RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${RUNTIME_BINDING_FRAMEWORK_REPORT_PATH} must be ${RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT}`
  );
  process.exit(1);
}

const imageRuntimeReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_REPORT_PATH), 'utf8')
) as { final_verdict: string };
if (imageRuntimeReport.final_verdict !== IMAGE_RUNTIME_PACKAGE_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${IMAGE_RUNTIME_PACKAGE_REPORT_PATH} must be ${IMAGE_RUNTIME_PACKAGE_PASS_VERDICT}`
  );
  process.exit(1);
}

const { runtimePackage, report } = writeMovieAnalysisVideoRuntimePackage(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} scene_runtime_present=${report.scene_runtime_present} camera_runtime_present=${report.camera_runtime_present} emotion_runtime_present=${report.emotion_runtime_present} transition_runtime_present=${report.transition_runtime_present} continuity_runtime_present=${report.continuity_runtime_present} storytelling_runtime_present=${report.storytelling_runtime_present} resolved_video_prompt_present=${report.resolved_video_prompt_present} runtime_mapping_preserved=${report.runtime_mapping_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} video_runtime_package_ready=${report.video_runtime_package_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: scene=${audit.scene_runtime_present} camera=${audit.camera_runtime_present} emotion=${audit.emotion_runtime_present} transition=${audit.transition_runtime_present} continuity=${audit.continuity_runtime_present} storytelling=${audit.storytelling_runtime_present} prompt=${audit.resolved_video_prompt_present} trace=${audit.adapter_traceability_preserved} mapping=${audit.runtime_mapping_preserved} ready=${audit.source_package_ready}`
  );
}
console.log(`package=${VIDEO_RUNTIME_PACKAGE_PATH}`);
console.log(`report=${VIDEO_RUNTIME_PACKAGE_REPORT_PATH}`);
console.log(`markdown=${VIDEO_RUNTIME_PACKAGE_MD_PATH}`);
console.log(`entries=${runtimePackage.entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_RUNTIME_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  runtimePackage.entries.length !== EXPECTED_SOURCE_COUNT ||
  report.scene_runtime_present !== 'PASS' ||
  report.camera_runtime_present !== 'PASS' ||
  report.emotion_runtime_present !== 'PASS' ||
  report.transition_runtime_present !== 'PASS' ||
  report.continuity_runtime_present !== 'PASS' ||
  report.storytelling_runtime_present !== 'PASS' ||
  report.resolved_video_prompt_present !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.video_runtime_package_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_package_ready === 'PASS') === false ||
  runtimePackage.entries.every(
    (entry) =>
      entry.resolved_video_prompt.startsWith('video_prompt:') &&
      entry.traceability.adapter_ids.length === 6 &&
      entry.resolved_runtime_mappings.length === 6 &&
      runtimeBlockReady(entry.video_runtime_package.scene_runtime) &&
      runtimeBlockReady(entry.video_runtime_package.camera_runtime) &&
      runtimeBlockReady(entry.video_runtime_package.emotion_runtime) &&
      runtimeBlockReady(entry.video_runtime_package.transition_runtime) &&
      runtimeBlockReady(entry.video_runtime_package.continuity_runtime) &&
      runtimeBlockReady(entry.video_runtime_package.storytelling_runtime)
  ) === false
) {
  console.error(
    'Expected video runtime package for all sources with six runtime blocks, resolved prompts, traceability, and runtime mappings preserved'
  );
  process.exit(1);
}

process.exit(0);

function runtimeBlockReady(block: {
  binding_id: string;
  resolved_pattern_signatures: string[];
  consumer_target: string;
}): boolean {
  return (
    block.binding_id.length > 0 &&
    block.resolved_pattern_signatures.length > 0 &&
    block.consumer_target === 'video_app'
  );
}
