import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_IMAGE_PROMPT_EXPORT_REPORT_DIR,
} from '../services/movieAnalysisRealImagePromptExport.js';
import {
  REAL_IMAGE_RUNTIME_PREPARATION_DIR,
} from '../services/movieAnalysisRealImageRuntimePreparation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_RUNTIME_CERTIFICATION_MD_PATH,
  REAL_RUNTIME_CERTIFICATION_PASS_VERDICT,
  REAL_RUNTIME_CERTIFICATION_REPORT_PATH,
  REAL_RUNTIME_PHASE_COUNT,
  REAL_RUNTIME_PHASE_ENTRIES,
  writeMovieAnalysisRealRuntimeCertification,
} from '../services/movieAnalysisRealRuntimeCertification.js';
import {
  REAL_VIDEO_PROMPT_EXPORT_PASS_VERDICT,
  REAL_VIDEO_PROMPT_EXPORT_REPORT_DIR,
  REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH,
} from '../services/movieAnalysisRealVideoPromptExport.js';
import {
  REAL_VIDEO_RUNTIME_PREPARATION_DIR,
} from '../services/movieAnalysisRealVideoRuntimePreparation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const dir of [
  REAL_IMAGE_RUNTIME_PREPARATION_DIR,
  REAL_IMAGE_PROMPT_EXPORT_REPORT_DIR,
  REAL_VIDEO_RUNTIME_PREPARATION_DIR,
  REAL_VIDEO_PROMPT_EXPORT_REPORT_DIR,
]) {
  if (!fs.existsSync(path.join(projectRoot, dir))) {
    console.error(`Missing required upstream directory: ${dir}`);
    process.exit(1);
  }
}

const videoPromptExportReportPath = path.join(projectRoot, REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH);
if (!fs.existsSync(videoPromptExportReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH}`);
  process.exit(1);
}

const videoPromptExportReport = JSON.parse(
  fs.readFileSync(videoPromptExportReportPath, 'utf8')
) as { final_verdict: string };
if (videoPromptExportReport.final_verdict !== REAL_VIDEO_PROMPT_EXPORT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2D-004 ${REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH} must be ${REAL_VIDEO_PROMPT_EXPORT_PASS_VERDICT}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisRealRuntimeCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} real_runtime_phases_complete=${report.real_runtime_phases_complete} image_runtime_preparation_ready=${report.image_runtime_preparation_ready} video_runtime_preparation_ready=${report.video_runtime_preparation_ready} image_prompt_export_ready=${report.image_prompt_export_ready} video_prompt_export_ready=${report.video_prompt_export_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} real_runtime_ready=${report.real_runtime_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.phase_audits) {
  console.log(`  ${audit.phase_id}: exists=${audit.report_exists} passed=${audit.phase_passed}`);
}
console.log(`report=${REAL_RUNTIME_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${REAL_RUNTIME_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_RUNTIME_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_RUNTIME_CERTIFICATION_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.real_runtime_phase_count !== REAL_RUNTIME_PHASE_COUNT ||
  report.real_runtime_phases_complete !== 'PASS' ||
  report.image_runtime_preparation_ready !== 'PASS' ||
  report.video_runtime_preparation_ready !== 'PASS' ||
  report.image_prompt_export_ready !== 'PASS' ||
  report.video_prompt_export_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.real_runtime_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.phase_audits.length !== REAL_RUNTIME_PHASE_COUNT ||
  report.phase_audits.every((audit) => audit.phase_passed) === false ||
  REAL_RUNTIME_PHASE_ENTRIES.every((entry) =>
    fs.existsSync(path.join(projectRoot, entry.report_path))
  ) === false
) {
  console.error('Expected real runtime certification with all L2D phases and validations PASS');
  process.exit(1);
}

process.exit(0);
