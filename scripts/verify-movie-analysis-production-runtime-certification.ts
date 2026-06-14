import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_DIR,
  PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR,
  PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  PRODUCTION_RUNTIME_CERTIFIED_STATUS,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  writeMovieAnalysisProductionRuntimeCertification,
} from '../services/movieAnalysisProductionRuntimeCertification.js';
import {
  PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
  PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  PRODUCTION_RUNTIME_READY_STATUS,
} from '../services/movieAnalysisProductionRuntimeEngine.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const runtimeReportPath = path.join(projectRoot, PRODUCTION_RUNTIME_ENGINE_REPORT_PATH);
const runtimeArtifactPath = path.join(projectRoot, PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH);

if (!fs.existsSync(runtimeReportPath) || !fs.existsSync(runtimeArtifactPath)) {
  console.error('PRECHECK FAIL: Missing production runtime engine report or artifact');
  process.exit(1);
}

const runtimeReport = JSON.parse(fs.readFileSync(runtimeReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  runtimeReport.final_verdict !== PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT ||
  runtimeReport.certification_status !== PRODUCTION_RUNTIME_READY_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${PRODUCTION_RUNTIME_ENGINE_REPORT_PATH} must be ${PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT} with ${PRODUCTION_RUNTIME_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisProductionRuntimeCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} runtime_consumed=${report.runtime_consumed} certification_complete=${report.certification_complete} runtime_ready_for_test_mode=${report.runtime_ready_for_test_mode} test_mode_allowed=${report.test_mode_allowed} production_mode_blocked=${report.production_mode_blocked} real_generation_blocked=${report.real_generation_blocked} traceability_preserved=${report.traceability_preserved} runtime_not_executed=${report.runtime_not_executed} no_external_calls=${report.no_external_calls} no_gpu_execution=${report.no_gpu_execution} no_file_overwrite=${report.no_file_overwrite} runtime_missing=${report.runtime_missing} runtime_invalid=${report.runtime_invalid} execution_queue_invalid=${report.execution_queue_invalid} adapter_execution_invalid=${report.adapter_execution_invalid} quality_gate_invalid=${report.quality_gate_invalid} failure_recovery_invalid=${report.failure_recovery_invalid} production_mode_enabled=${report.production_mode_enabled} test_mode_missing=${report.test_mode_missing} traceability_loss=${report.traceability_loss} external_call_detected=${report.external_call_detected} gpu_execution_detected=${report.gpu_execution_detected} file_overwrite_detected=${report.file_overwrite_detected} production_runtime_certification_ready=${report.production_runtime_certification_ready}`
);
for (const audit of report.runtime_package_audits) {
  console.log(`  runtime ${audit.runtime_id}: certified=${audit.package_certified} mode=${audit.runtime_mode}`);
}
console.log(`report=${PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.runtime_package_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.runtime_consumed !== 'PASS' ||
  report.certification_complete !== 'PASS' ||
  report.runtime_ready_for_test_mode !== 'PASS' ||
  report.test_mode_allowed !== true ||
  report.production_mode_blocked !== true ||
  report.real_generation_blocked !== true ||
  report.traceability_preserved !== true ||
  report.runtime_not_executed !== true ||
  report.no_external_calls !== true ||
  report.no_gpu_execution !== true ||
  report.no_file_overwrite !== true ||
  report.production_runtime_certification_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_RUNTIME_CERTIFIED_STATUS ||
  report.runtime_missing !== false ||
  report.runtime_invalid !== false ||
  report.execution_queue_invalid !== false ||
  report.adapter_execution_invalid !== false ||
  report.quality_gate_invalid !== false ||
  report.failure_recovery_invalid !== false ||
  report.production_mode_enabled !== false ||
  report.test_mode_missing !== false ||
  report.traceability_loss !== false ||
  report.external_call_detected !== false ||
  report.gpu_execution_detected !== false ||
  report.file_overwrite_detected !== false ||
  report.runtime_package_audits.length !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.runtime_package_audits.every((audit) => audit.package_certified === 'PASS') === false
) {
  console.error(
    'Expected PASS with certification complete, test mode allowed, production mode blocked, and traceability intact'
  );
  process.exit(1);
}

process.exit(0);
