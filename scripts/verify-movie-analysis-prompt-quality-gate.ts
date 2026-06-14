import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPT_ASSEMBLY_ENGINE_REPORT_PATH } from '../services/movieAnalysisPromptAssemblyEngine.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  PROMPT_QUALITY_GATE_MD_PATH,
  PROMPT_QUALITY_GATE_PASS_VERDICT,
  PROMPT_QUALITY_GATE_REPORT_PATH,
  writeMovieAnalysisPromptQualityGateReport,
} from '../services/movieAnalysisPromptQualityGate.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, PROMPT_ASSEMBLY_ENGINE_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${PROMPT_ASSEMBLY_ENGINE_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisPromptQualityGateReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} final_image_prompt_present=${report.final_image_prompt_present} final_video_prompt_present=${report.final_video_prompt_present} section_order_valid=${report.section_order_valid} required_sections_present=${report.required_sections_present} duplicate_section_absent=${report.duplicate_section_absent} prompt_length_safe=${report.prompt_length_safe} adapter_traceability_preserved=${report.adapter_traceability_preserved} negative_prompt_present=${report.negative_prompt_present} missing_sections=${report.missing_prompt_sections.length} weak_sections=${report.weak_prompt_sections.length} overlong_risk=${report.overlong_prompt_risk.length} conflicting_terms=${report.conflicting_prompt_terms.length} prompt_quality_gate_ready=${report.prompt_quality_gate_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: image=${audit.final_image_prompt_present} video=${audit.final_video_prompt_present} order=${audit.section_order_valid} sections=${audit.required_sections_present} duplicates=${audit.duplicate_section_absent} length=${audit.prompt_length_safe} trace=${audit.adapter_traceability_preserved} negative=${audit.negative_prompt_present} pass=${audit.source_quality_pass}`
  );
}
console.log(`report=${PROMPT_QUALITY_GATE_REPORT_PATH}`);
console.log(`markdown=${PROMPT_QUALITY_GATE_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PROMPT_QUALITY_GATE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.final_image_prompt_present !== 'PASS' ||
  report.final_video_prompt_present !== 'PASS' ||
  report.section_order_valid !== 'PASS' ||
  report.required_sections_present !== 'PASS' ||
  report.duplicate_section_absent !== 'PASS' ||
  report.prompt_length_safe !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.negative_prompt_present !== 'PASS' ||
  report.missing_prompt_sections.length !== 0 ||
  report.prompt_quality_gate_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_quality_pass === 'PASS') === false
) {
  console.error(
    'Expected all prompt quality validations PASS with no missing sections and planning_only PASS'
  );
  process.exit(1);
}

process.exit(0);
