import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_IMAGE_PROMPT_EXPORT_PATH } from '../services/movieAnalysisRealImagePromptExport.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_RUNTIME_EXECUTION_READINESS_MD_PATH,
  REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT,
  REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH,
  writeMovieAnalysisRealRuntimeExecutionReadiness,
} from '../services/movieAnalysisRealRuntimeExecutionReadiness.js';
import {
  REAL_RUNTIME_CERTIFICATION_DIR,
  REAL_RUNTIME_CERTIFICATION_PASS_VERDICT,
  REAL_RUNTIME_CERTIFICATION_REPORT_PATH,
} from '../services/movieAnalysisRealRuntimeCertification.js';
import { REAL_VIDEO_PROMPT_EXPORT_PATH } from '../services/movieAnalysisRealVideoPromptExport.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_RUNTIME_CERTIFICATION_DIR))) {
  console.error(`Missing required upstream directory: ${REAL_RUNTIME_CERTIFICATION_DIR}`);
  process.exit(1);
}

const certificationReportPath = path.join(projectRoot, REAL_RUNTIME_CERTIFICATION_REPORT_PATH);
if (!fs.existsSync(certificationReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_RUNTIME_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const certificationReport = JSON.parse(fs.readFileSync(certificationReportPath, 'utf8')) as {
  final_verdict: string;
};
if (certificationReport.final_verdict !== REAL_RUNTIME_CERTIFICATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2D-005 ${REAL_RUNTIME_CERTIFICATION_REPORT_PATH} must be ${REAL_RUNTIME_CERTIFICATION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH))) {
  console.error(`Missing required export package: ${REAL_IMAGE_PROMPT_EXPORT_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_VIDEO_PROMPT_EXPORT_PATH))) {
  console.error(`Missing required export package: ${REAL_VIDEO_PROMPT_EXPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealRuntimeExecutionReadiness(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} real_runtime_ready=${report.real_runtime_ready} image_prompt_export_ready=${report.image_prompt_export_ready} video_prompt_export_ready=${report.video_prompt_export_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} execution_readiness_ready=${report.execution_readiness_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: image=${audit.image_prompt_export_present} video=${audit.video_prompt_export_present} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} ready=${audit.source_execution_readiness_ready}`
  );
}
console.log(`report=${REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH}`);
console.log(`markdown=${REAL_RUNTIME_EXECUTION_READINESS_MD_PATH}`);
console.log(`readiness_entries=${report.readiness_entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.real_runtime_ready !== 'PASS' ||
  report.image_prompt_export_ready !== 'PASS' ||
  report.video_prompt_export_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.execution_readiness_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.readiness_entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_execution_readiness_ready === 'PASS') === false
) {
  console.error(
    'Expected real runtime execution readiness for all sources with export packages and preserved mappings'
  );
  process.exit(1);
}

process.exit(0);
