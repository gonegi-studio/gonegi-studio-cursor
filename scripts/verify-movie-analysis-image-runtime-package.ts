import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPT_CONFLICT_RESOLUTION_REPORT_PATH } from '../services/movieAnalysisPromptConflictResolution.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  IMAGE_RUNTIME_PACKAGE_MD_PATH,
  IMAGE_RUNTIME_PACKAGE_PASS_VERDICT,
  IMAGE_RUNTIME_PACKAGE_PATH,
  IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
  writeMovieAnalysisImageRuntimePackage,
} from '../services/movieAnalysisImageRuntimePackage.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, PROMPT_CONFLICT_RESOLUTION_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${PROMPT_CONFLICT_RESOLUTION_REPORT_PATH}`);
  process.exit(1);
}

const { runtimePackage, report } = writeMovieAnalysisImageRuntimePackage(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} resolved_prompt_present=${report.resolved_prompt_present} image_prompt_ready=${report.image_prompt_ready} negative_prompt_ready=${report.negative_prompt_ready} adapter_traceability_preserved=${report.adapter_traceability_preserved} runtime_mapping_preserved=${report.runtime_mapping_preserved} image_runtime_package_ready=${report.image_runtime_package_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: resolved=${audit.resolved_prompt_present} image=${audit.image_prompt_ready} negative=${audit.negative_prompt_ready} trace=${audit.adapter_traceability_preserved} mapping=${audit.runtime_mapping_preserved} ready=${audit.source_package_ready}`
  );
}
console.log(`package=${IMAGE_RUNTIME_PACKAGE_PATH}`);
console.log(`report=${IMAGE_RUNTIME_PACKAGE_REPORT_PATH}`);
console.log(`markdown=${IMAGE_RUNTIME_PACKAGE_MD_PATH}`);
console.log(`entries=${runtimePackage.entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== IMAGE_RUNTIME_PACKAGE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  runtimePackage.entries.length !== EXPECTED_SOURCE_COUNT ||
  report.resolved_prompt_present !== 'PASS' ||
  report.image_prompt_ready !== 'PASS' ||
  report.negative_prompt_ready !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.image_runtime_package_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_package_ready === 'PASS') === false ||
  runtimePackage.entries.every(
    (entry) =>
      entry.final_image_prompt_resolved.startsWith('image_prompt:') &&
      entry.negative_prompt.length > 0 &&
      entry.resolved_runtime_mappings.length === 6
  ) === false
) {
  console.error(
    'Expected image runtime package for all sources with resolved prompts, traceability, and runtime mappings preserved'
  );
  process.exit(1);
}

process.exit(0);
