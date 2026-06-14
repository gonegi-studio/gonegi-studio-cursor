import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPT_GENERATION_FRAMEWORK_REPORT_PATH } from '../services/movieAnalysisPromptGenerationFramework.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  PROMPT_ASSEMBLY_ENGINE_MD_PATH,
  PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT,
  PROMPT_ASSEMBLY_ENGINE_REPORT_PATH,
  writeMovieAnalysisPromptAssemblyEngineReport,
} from '../services/movieAnalysisPromptAssemblyEngine.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, PROMPT_GENERATION_FRAMEWORK_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${PROMPT_GENERATION_FRAMEWORK_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisPromptAssemblyEngineReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} assembled_packages=${report.assembled_prompt_packages.length} prompt_structure_valid=${report.validation.prompt_structure_valid} prompt_order_valid=${report.validation.prompt_order_valid} required_sections_present=${report.validation.required_sections_present} duplicate_section_absent=${report.validation.duplicate_section_absent} prompt_assembly_engine_ready=${report.prompt_assembly_engine_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: structure=${audit.prompt_structure_valid} order=${audit.prompt_order_valid} sections=${audit.required_sections_present} duplicates=${audit.duplicate_section_absent} ready=${audit.source_assembly_ready}`
  );
}
console.log(`report=${PROMPT_ASSEMBLY_ENGINE_REPORT_PATH}`);
console.log(`markdown=${PROMPT_ASSEMBLY_ENGINE_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.assembled_prompt_packages.length !== EXPECTED_SOURCE_COUNT ||
  report.assembly_order.length !== 6 ||
  report.validation.prompt_structure_valid !== 'PASS' ||
  report.validation.prompt_order_valid !== 'PASS' ||
  report.validation.required_sections_present !== 'PASS' ||
  report.validation.duplicate_section_absent !== 'PASS' ||
  report.prompt_assembly_engine_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_assembly_ready === 'PASS') === false ||
  report.assembled_prompt_packages.every(
    (pkg) => pkg.final_image_prompt.length > 0 && pkg.final_video_prompt.length > 0
  ) === false
) {
  console.error(
    'Expected assembled image/video prompts for all sources with valid structure, order, sections, and no duplicates'
  );
  process.exit(1);
}

process.exit(0);
