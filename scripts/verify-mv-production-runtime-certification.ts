import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
  MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_READY_STATUS,
  RUNTIME_MODE_TEST_MODE_ONLY,
} from '../services/mvProductionRuntimeEngine.js';
import {
  MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_DIR,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS,
  SAFE_CREATE_POLICY,
  writeMvProductionRuntimeCertification,
} from '../services/mvProductionRuntimeCertification.js';
import { MV_TYPE_COUNT, SUPPORTED_MV_TYPES } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const runtimeEngineReportPath = path.join(projectRoot, MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH);
const runtimeEngineArtifactPath = path.join(projectRoot, MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH);

if (!fs.existsSync(runtimeEngineReportPath) || !fs.existsSync(runtimeEngineArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production runtime engine report or artifact');
  process.exit(1);
}

const runtimeEngineReport = JSON.parse(fs.readFileSync(runtimeEngineReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  mv_production_runtime_engine_ready: string;
};

if (
  runtimeEngineReport.final_verdict !== MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT ||
  runtimeEngineReport.certification_status !== MV_PRODUCTION_RUNTIME_READY_STATUS ||
  runtimeEngineReport.mv_production_runtime_engine_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH} must be ${MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT} with ${MV_PRODUCTION_RUNTIME_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvProductionRuntimeCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_runtime_ref=${report.source_runtime_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} runtime_certification_count=${report.runtime_certification_count} runtime_mode=${report.runtime_mode} test_mode_allowed=${report.test_mode_allowed} real_generation_blocked=${report.real_generation_blocked} runtime_not_executed=${report.runtime_not_executed} external_call_allowed=${report.external_call_allowed} gpu_execution_allowed=${report.gpu_execution_allowed} runtime_consumed=${report.runtime_consumed} runtime_certified=${report.runtime_certified} runtime_mode_valid=${report.runtime_mode_valid} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} failure_recovery_ready=${report.failure_recovery_ready} execution_queue_valid=${report.execution_queue_valid} music_sync_preserved=${report.music_sync_preserved} mv_type_preserved=${report.mv_type_preserved} traceability_preserved=${report.traceability_preserved} production_mode_blocked=${report.production_mode_blocked} runtime_missing=${report.runtime_missing} runtime_certification_failed=${report.runtime_certification_failed} runtime_mode_invalid=${report.runtime_mode_invalid} test_mode_disabled=${report.test_mode_disabled} real_generation_enabled=${report.real_generation_enabled} runtime_execution_detected=${report.runtime_execution_detected} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} failure_recovery_missing=${report.failure_recovery_missing} music_sync_loss=${report.music_sync_loss} mv_type_loss=${report.mv_type_loss} traceability_loss=${report.traceability_loss} production_mode_unblocked=${report.production_mode_unblocked} mv_production_runtime_certification_ready=${report.mv_production_runtime_certification_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const result of report.runtime_certification_results) {
  console.log(
    `  cert ${result.runtime_certification_id}: mv_type=${result.mv_type} mv_runtime_id=${result.mv_runtime_id} recovery=${result.failure_recovery_plan.step_count} certified=${result.plan_certified}`
  );
}
console.log(`report=${MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_RUNTIME_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_RUNTIME_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.runtime_certification_count !== MV_TYPE_COUNT ||
  report.runtime_certification_results.length !== MV_TYPE_COUNT ||
  report.certification_checks.length !== 14 ||
  report.runtime_consumed !== 'PASS' ||
  report.runtime_certified !== 'PASS' ||
  report.runtime_mode_valid !== 'PASS' ||
  report.test_mode_allowed !== true ||
  report.real_generation_blocked !== true ||
  report.runtime_not_executed !== true ||
  report.external_call_blocked !== 'PASS' ||
  report.gpu_execution_blocked !== 'PASS' ||
  report.failure_recovery_ready !== 'PASS' ||
  report.execution_queue_valid !== 'PASS' ||
  report.music_sync_preserved !== 'PASS' ||
  report.mv_type_preserved !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_mode_blocked !== 'PASS' ||
  report.external_call_allowed !== false ||
  report.gpu_execution_allowed !== false ||
  report.runtime_missing !== false ||
  report.runtime_certification_failed !== false ||
  report.runtime_mode_invalid !== false ||
  report.test_mode_disabled !== false ||
  report.real_generation_enabled !== false ||
  report.runtime_execution_detected !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.failure_recovery_missing !== false ||
  report.music_sync_loss !== false ||
  report.mv_type_loss !== false ||
  report.traceability_loss !== false ||
  report.production_mode_unblocked !== false ||
  report.mv_production_runtime_certification_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_RUNTIME_CERTIFIED_STATUS ||
  report.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
  report.certification_checks.every((check) => check.status === 'PASS') === false ||
  report.runtime_certification_results.every((result) => result.plan_certified === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} runtime certifications ready, test_mode_allowed=true, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH), 'utf8')
) as {
  source_runtime_ref: string;
  runtime_mode: string;
  test_mode_allowed: boolean;
  real_generation_blocked: boolean;
  runtime_not_executed: boolean;
  external_call_allowed: boolean;
  gpu_execution_allowed: boolean;
  runtime_certification_results: Array<{
    source_runtime_ref: string;
    runtime_certification_id: string;
    mv_runtime_id: string;
    mv_type: string;
    runtime_mode: string;
    test_mode_allowed: boolean;
    real_generation_blocked: boolean;
    runtime_not_executed: boolean;
    external_call_allowed: boolean;
    gpu_execution_allowed: boolean;
    failure_recovery_plan: { recovery_ready: boolean; step_count: number };
    traceability_chain: { trace_integrity: string };
    plan_certified: string;
  }>;
  safety_flags: {
    runtime_mode: string;
    image_generation: boolean;
    video_generation: boolean;
    gpu_execution: boolean;
    generation: boolean;
    external_call_allowed: boolean;
    test_mode_allowed: boolean;
  };
};

if (
  artifact.source_runtime_ref !== MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH ||
  artifact.runtime_certification_results.length !== MV_TYPE_COUNT ||
  artifact.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
  artifact.test_mode_allowed !== true ||
  artifact.real_generation_blocked !== true ||
  artifact.runtime_not_executed !== true ||
  artifact.external_call_allowed !== false ||
  artifact.gpu_execution_allowed !== false ||
  artifact.safety_flags.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
  artifact.safety_flags.test_mode_allowed !== true ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false ||
  artifact.safety_flags.generation !== false ||
  artifact.safety_flags.external_call_allowed !== false
) {
  console.error('Artifact safety or runtime reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const result = artifact.runtime_certification_results.find((entry) => entry.mv_type === mvType);
  if (
    !result ||
    result.source_runtime_ref !== MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH ||
    result.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
    result.test_mode_allowed !== true ||
    result.real_generation_blocked !== true ||
    result.runtime_not_executed !== true ||
    result.external_call_allowed !== false ||
    result.gpu_execution_allowed !== false ||
    result.failure_recovery_plan.recovery_ready !== true ||
    result.failure_recovery_plan.step_count > 0 === false ||
    result.traceability_chain.trace_integrity !== 'PASS' ||
    result.plan_certified !== 'PASS' ||
    result.mv_runtime_id.length === 0 ||
    result.runtime_certification_id.length === 0
  ) {
    console.error(`Runtime certification structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
