import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_EXECUTION_PACKAGE_CERTIFICATION_MD_PATH,
  REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT,
  REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH,
  REAL_EXECUTION_PACKAGE_CERTIFICATION_STATUS_MESSAGE,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisRealExecutionPackageCertification,
} from '../services/movieAnalysisRealExecutionPackageCertification.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_DIR,
  REAL_IMAGE_PROMPT_EXPORT_PATH,
} from '../services/movieAnalysisRealImagePromptExport.js';
import {
  REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT,
  REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH,
} from '../services/movieAnalysisRealRuntimeExecutionReadiness.js';
import {
  REAL_VIDEO_PROMPT_EXPORT_DIR,
  REAL_VIDEO_PROMPT_EXPORT_PATH,
} from '../services/movieAnalysisRealVideoPromptExport.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const readinessReportPath = path.join(projectRoot, REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH);
if (!fs.existsSync(readinessReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH}`);
  process.exit(1);
}

const readinessReport = JSON.parse(fs.readFileSync(readinessReportPath, 'utf8')) as {
  final_verdict: string;
};
if (readinessReport.final_verdict !== REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2D-006 ${REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH} must be ${REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT}`
  );
  process.exit(1);
}

for (const dir of [REAL_IMAGE_PROMPT_EXPORT_DIR, REAL_VIDEO_PROMPT_EXPORT_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, dir))) {
    console.error(`Missing required input directory: ${dir}`);
    process.exit(1);
  }
}

for (const exportPath of [REAL_IMAGE_PROMPT_EXPORT_PATH, REAL_VIDEO_PROMPT_EXPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, exportPath))) {
    console.error(`Missing required export package: ${exportPath}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisRealExecutionPackageCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} image_prompt_export_ready=${report.image_prompt_export_ready} video_prompt_export_ready=${report.video_prompt_export_ready} execution_readiness_ready=${report.execution_readiness_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} real_execution_package_certification_ready=${report.real_execution_package_certification_ready} planning_only=${report.planning_only_status} certification_only=${report.certification_only} gpu_execution=${report.gpu_execution} image_generation=${report.image_generation} video_generation=${report.video_generation}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: image=${audit.image_prompt_export_ready} video=${audit.video_prompt_export_ready} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} ready=${audit.source_package_certification_ready}`
  );
}
console.log(`report=${REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${REAL_EXECUTION_PACKAGE_CERTIFICATION_MD_PATH}`);
console.log(`package_entries=${report.package_entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH)) ||
  report.certification_status !== REAL_EXECUTION_PACKAGE_CERTIFICATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_prompt_export_ready !== 'PASS' ||
  report.video_prompt_export_ready !== 'PASS' ||
  report.execution_readiness_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.real_execution_package_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.planning_only !== true ||
  report.certification_only !== true ||
  report.generation !== false ||
  report.gpu_execution !== false ||
  report.image_generation !== false ||
  report.video_generation !== false ||
  report.package_entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_package_certification_ready === 'PASS') === false
) {
  console.error(
    'Expected real execution package certification with REAL_EXECUTION_PACKAGE_READY and certification-only safety'
  );
  process.exit(1);
}

process.exit(0);
