import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH,
} from '../services/movieAnalysisLevel2MasterSimulationCertification.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT,
  REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
} from '../services/movieAnalysisRealImagePromptExport.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_VIDEO_RUNTIME_PREPARATION_MD_PATH,
  REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT,
  REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH,
  writeMovieAnalysisRealVideoRuntimePreparation,
} from '../services/movieAnalysisRealVideoRuntimePreparation.js';
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

const imagePromptExportReportPath = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH);
if (!fs.existsSync(imagePromptExportReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH}`);
  process.exit(1);
}

const imagePromptExportReport = JSON.parse(
  fs.readFileSync(imagePromptExportReportPath, 'utf8')
) as { final_verdict: string };
if (imagePromptExportReport.final_verdict !== REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2D-002 ${REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH} must be ${REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR))) {
  console.error(`Missing required upstream directory: ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH))) {
  console.error(
    `Missing required upstream asset: ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH}`
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

const report = writeMovieAnalysisRealVideoRuntimePreparation(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} video_runtime_ready=${report.video_runtime_ready} video_app_consumption_ready=${report.video_app_consumption_ready} video_generation_simulation_ready=${report.video_generation_simulation_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} runtime_preparation_ready=${report.runtime_preparation_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: entry=${audit.video_runtime_entry_present} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} ready=${audit.source_preparation_ready}`
  );
}
console.log(`report=${REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH}`);
console.log(`markdown=${REAL_VIDEO_RUNTIME_PREPARATION_MD_PATH}`);
console.log(`preparation_entries=${report.preparation_entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.video_runtime_ready !== 'PASS' ||
  report.video_app_consumption_ready !== 'PASS' ||
  report.video_generation_simulation_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.runtime_preparation_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.preparation_entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_preparation_ready === 'PASS') === false
) {
  console.error(
    'Expected real video runtime preparation for all sources with preserved mappings and traceability'
  );
  process.exit(1);
}

process.exit(0);
