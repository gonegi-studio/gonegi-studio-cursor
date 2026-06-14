import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  GENERATION_PLANNING_ENGINE_PASS_VERDICT,
  GENERATION_PLANNING_ENGINE_REPORT_PATH,
  GENERATION_PLANNING_READY_STATUS,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
} from '../services/movieAnalysisGenerationPlanningEngine.js';
import {
  PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_ENGINE_DIR,
  PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR,
  PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
  PRODUCTION_RUNTIME_ENGINE_MD_PATH,
  PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
  PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  PRODUCTION_RUNTIME_READY_STATUS,
  writeMovieAnalysisProductionRuntimeEngine,
} from '../services/movieAnalysisProductionRuntimeEngine.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const planningReportPath = path.join(projectRoot, GENERATION_PLANNING_ENGINE_REPORT_PATH);
const planningArtifactPath = path.join(projectRoot, GENERATION_PLANNING_ENGINE_ARTIFACT_PATH);

if (!fs.existsSync(planningReportPath) || !fs.existsSync(planningArtifactPath)) {
  console.error('PRECHECK FAIL: Missing generation planning engine report or artifact');
  process.exit(1);
}

const planningReport = JSON.parse(fs.readFileSync(planningReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  planningReport.final_verdict !== GENERATION_PLANNING_ENGINE_PASS_VERDICT ||
  planningReport.certification_status !== GENERATION_PLANNING_READY_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${GENERATION_PLANNING_ENGINE_REPORT_PATH} must be ${GENERATION_PLANNING_ENGINE_PASS_VERDICT} with ${GENERATION_PLANNING_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisProductionRuntimeEngine(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} generation_plan_consumed=${report.generation_plan_consumed} runtime_package_complete=${report.runtime_package_complete} execution_queue_valid=${report.execution_queue_valid} adapter_execution_ready=${report.adapter_execution_ready} quality_gate_ready=${report.quality_gate_ready} failure_recovery_ready=${report.failure_recovery_ready} runtime_mode_valid=${report.runtime_mode_valid} runtime_readiness_valid=${report.runtime_readiness_valid} traceability_preserved=${report.traceability_preserved} generation_plan_missing=${report.generation_plan_missing} runtime_package_failure=${report.runtime_package_failure} execution_queue_invalid=${report.execution_queue_invalid} adapter_execution_failure=${report.adapter_execution_failure} quality_gate_missing=${report.quality_gate_missing} failure_recovery_missing=${report.failure_recovery_missing} runtime_mode_invalid=${report.runtime_mode_invalid} runtime_not_ready=${report.runtime_not_ready} traceability_loss=${report.traceability_loss} production_runtime_engine_ready=${report.production_runtime_engine_ready}`
);
for (const runtimePackage of report.runtime_packages) {
  console.log(
    `  runtime ${runtimePackage.runtime_id}: ready=${runtimePackage.runtime_package_ready} mode=${runtimePackage.runtime_mode} units=${runtimePackage.runtime_units.length}`
  );
}
console.log(`report=${PRODUCTION_RUNTIME_ENGINE_REPORT_PATH}`);
console.log(`markdown=${PRODUCTION_RUNTIME_ENGINE_MD_PATH}`);
console.log(`manifest=${PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH}`);
console.log(`artifact=${PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_ENGINE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_ENGINE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.runtime_package_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.generation_plan_consumed !== 'PASS' ||
  report.runtime_package_complete !== 'PASS' ||
  report.execution_queue_valid !== 'PASS' ||
  report.adapter_execution_ready !== 'PASS' ||
  report.quality_gate_ready !== 'PASS' ||
  report.failure_recovery_ready !== 'PASS' ||
  report.runtime_mode_valid !== 'PASS' ||
  report.runtime_readiness_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_runtime_engine_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_RUNTIME_READY_STATUS ||
  report.generation_plan_missing !== false ||
  report.runtime_package_failure !== false ||
  report.execution_queue_invalid !== false ||
  report.adapter_execution_failure !== false ||
  report.quality_gate_missing !== false ||
  report.failure_recovery_missing !== false ||
  report.runtime_mode_invalid !== false ||
  report.runtime_not_ready !== false ||
  report.traceability_loss !== false ||
  report.runtime_packages.length !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.runtime_packages.every((runtimePackage) => runtimePackage.runtime_package_ready === 'PASS') ===
    false ||
  report.runtime_packages.every((runtimePackage) => runtimePackage.runtime_readiness === 'PASS') === false
) {
  console.error(
    'Expected PASS with runtime packages complete, execution queue valid, adapter/quality/failure recovery ready, and traceability intact'
  );
  process.exit(1);
}

process.exit(0);
