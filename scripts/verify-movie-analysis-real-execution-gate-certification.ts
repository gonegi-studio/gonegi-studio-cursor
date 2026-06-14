import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR,
  REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT,
  REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH,
} from '../services/movieAnalysisRealExecutionPackageCertification.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_EXECUTION_GATE_CERTIFICATION_MD_PATH,
  REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT,
  REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
  REAL_EXECUTION_GATE_CERTIFICATION_STATUS_MESSAGE,
  writeMovieAnalysisRealExecutionGateCertification,
} from '../services/movieAnalysisRealExecutionGateCertification.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_DIR,
  REAL_IMAGE_PROMPT_EXPORT_PATH,
} from '../services/movieAnalysisRealImagePromptExport.js';
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

const packageCertificationReportPath = path.join(
  projectRoot,
  REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH
);
if (!fs.existsSync(packageCertificationReportPath)) {
  console.error(
    `Missing required upstream asset: ${REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH}`
  );
  process.exit(1);
}

const packageCertificationReport = JSON.parse(
  fs.readFileSync(packageCertificationReportPath, 'utf8')
) as { final_verdict: string };
if (packageCertificationReport.final_verdict !== REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2D-007 ${REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH} must be ${REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR))) {
  console.error(`Missing required upstream directory: ${REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR}`);
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

const report = writeMovieAnalysisRealExecutionGateCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} real_execution_package_ready=${report.real_execution_package_ready} image_prompt_export_ready=${report.image_prompt_export_ready} video_prompt_export_ready=${report.video_prompt_export_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} real_execution_gate_certification_ready=${report.real_execution_gate_certification_ready} planning_only=${report.planning_only_status} execution_gate_only=${report.execution_gate_only} gpu_execution=${report.gpu_execution} image_generation=${report.image_generation} video_generation=${report.video_generation}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: image=${audit.image_prompt_export_ready} video=${audit.video_prompt_export_ready} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} ready=${audit.source_execution_gate_ready}`
  );
}
console.log(`report=${REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${REAL_EXECUTION_GATE_CERTIFICATION_MD_PATH}`);
console.log(`gate_entries=${report.gate_entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH)) ||
  report.certification_status !== REAL_EXECUTION_GATE_CERTIFICATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.real_execution_package_ready !== 'PASS' ||
  report.image_prompt_export_ready !== 'PASS' ||
  report.video_prompt_export_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.real_execution_gate_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.planning_only !== true ||
  report.execution_gate_only !== true ||
  report.generation !== false ||
  report.gpu_execution !== false ||
  report.image_generation !== false ||
  report.video_generation !== false ||
  report.gate_entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_execution_gate_ready === 'PASS') === false
) {
  console.error(
    'Expected real execution gate certification with REAL_EXECUTION_GATE_READY and gate-only safety'
  );
  process.exit(1);
}

process.exit(0);
