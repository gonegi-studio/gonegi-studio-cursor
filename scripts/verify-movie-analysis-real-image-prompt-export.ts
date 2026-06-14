import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_IMAGE_PROMPT_EXPORT_MD_PATH,
  REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT,
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
  writeMovieAnalysisRealImagePromptExport,
} from '../services/movieAnalysisRealImagePromptExport.js';
import {
  REAL_IMAGE_RUNTIME_PREPARATION_DIR,
  REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT,
  REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
} from '../services/movieAnalysisRealImageRuntimePreparation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_RUNTIME_PREPARATION_DIR))) {
  console.error(`Missing required upstream directory: ${REAL_IMAGE_RUNTIME_PREPARATION_DIR}`);
  process.exit(1);
}

const preparationReportPath = path.join(projectRoot, REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH);
if (!fs.existsSync(preparationReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH}`);
  process.exit(1);
}

const preparationReport = JSON.parse(fs.readFileSync(preparationReportPath, 'utf8')) as {
  final_verdict: string;
};
if (preparationReport.final_verdict !== REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2D-001 ${REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH} must be ${REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT}`
  );
  process.exit(1);
}

const { exportPackage, report } = writeMovieAnalysisRealImagePromptExport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} resolved_image_prompt_present=${report.resolved_image_prompt_present} negative_prompt_present=${report.negative_prompt_present} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} image_prompt_export_ready=${report.image_prompt_export_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: prompt=${audit.resolved_image_prompt_present} negative=${audit.negative_prompt_present} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} ready=${audit.source_export_ready}`
  );
}
console.log(`export=${REAL_IMAGE_PROMPT_EXPORT_PATH}`);
console.log(`report=${REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH}`);
console.log(`markdown=${REAL_IMAGE_PROMPT_EXPORT_MD_PATH}`);
console.log(`export_entries=${exportPackage.entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.resolved_image_prompt_present !== 'PASS' ||
  report.negative_prompt_present !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.image_prompt_export_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  exportPackage.entries.length !== EXPECTED_SOURCE_COUNT ||
  report.export_entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_export_ready === 'PASS') === false ||
  exportPackage.source_count !== EXPECTED_SOURCE_COUNT ||
  exportPackage.adapter_count !== EXPECTED_ADAPTER_COUNT
) {
  console.error(
    'Expected real image prompt export for all sources with resolved prompts, mappings, and traceability'
  );
  process.exit(1);
}

process.exit(0);
