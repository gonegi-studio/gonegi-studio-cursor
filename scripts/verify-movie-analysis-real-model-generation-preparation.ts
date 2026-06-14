import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_IMAGE_PROMPT_EXPORT_DIR,
  REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT,
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
} from '../services/movieAnalysisRealImagePromptExport.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_PROMPT_COUNT,
  MODEL_GENERATION_TEST_DIR,
  MODEL_GENERATION_TEST_PACKAGE_PATH,
  MODEL_GENERATION_TEST_PROMPTS_DIR,
  REAL_MODEL_GENERATION_PREPARATION_MD_PATH,
  REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT,
  REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH,
  REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE,
  writeMovieAnalysisRealModelGenerationPreparation,
} from '../services/movieAnalysisRealModelGenerationPreparation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_DIR))) {
  console.error(`Missing required upstream directory: ${REAL_IMAGE_PROMPT_EXPORT_DIR}`);
  process.exit(1);
}

const promptExportPath = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH);
if (!fs.existsSync(promptExportPath)) {
  console.error(`Missing required upstream asset: ${REAL_IMAGE_PROMPT_EXPORT_PATH}`);
  process.exit(1);
}

const promptExportReportPath = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH);
if (!fs.existsSync(promptExportReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH}`);
  process.exit(1);
}

const promptExportReport = JSON.parse(fs.readFileSync(promptExportReportPath, 'utf8')) as {
  final_verdict: string;
};
if (promptExportReport.final_verdict !== REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2D-002 ${REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH} must be ${REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT}`
  );
  process.exit(1);
}

const { preparationPackage, report } =
  writeMovieAnalysisRealModelGenerationPreparation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} prompt_count=${report.prompt_count} adapter_count=${report.adapter_count} dna_binding_preserved=${report.dna_binding_preserved} traceability_preserved=${report.traceability_preserved} real_model_generation_ready=${report.real_model_generation_ready} model_connection_prepared=${report.model_connection_prepared} actual_generation=${report.actual_generation} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: prompt=${audit.prompt_present} dna=${audit.dna_binding_preserved} adapter=${audit.adapter_binding_preserved} trace=${audit.traceability_preserved} ready=${audit.source_preparation_ready}`
  );
}
console.log(`package=${MODEL_GENERATION_TEST_PACKAGE_PATH}`);
console.log(`report=${REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH}`);
console.log(`markdown=${REAL_MODEL_GENERATION_PREPARATION_MD_PATH}`);
console.log(`package_entries=${preparationPackage.entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT) {
  process.exit(1);
}

const promptsDir = path.join(projectRoot, MODEL_GENERATION_TEST_PROMPTS_DIR);
const promptFiles = fs.existsSync(promptsDir)
  ? fs.readdirSync(promptsDir).filter((name) => name.endsWith('.json'))
  : [];

if (
  !fs.existsSync(path.join(projectRoot, MODEL_GENERATION_TEST_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MODEL_GENERATION_TEST_PACKAGE_PATH)) ||
  !fs.existsSync(path.join(projectRoot, REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH)) ||
  report.certification_status !== REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE ||
  report.prompt_count !== EXPECTED_PROMPT_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.dna_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.real_model_generation_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  preparationPackage.prompt_count !== EXPECTED_PROMPT_COUNT ||
  preparationPackage.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  preparationPackage.entries.length !== EXPECTED_PROMPT_COUNT ||
  report.preparation_entries.length !== EXPECTED_PROMPT_COUNT ||
  report.source_audits.length !== EXPECTED_PROMPT_COUNT ||
  report.source_audits.every((audit) => audit.source_preparation_ready === 'PASS') === false ||
  promptFiles.length !== EXPECTED_PROMPT_COUNT
) {
  console.error(
    'Expected real model generation preparation with 4 prompts, 24 adapters, DNA binding, and traceability preserved'
  );
  process.exit(1);
}

process.exit(0);
