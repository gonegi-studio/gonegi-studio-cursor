import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT,
  MV_GENERATION_PLANNING_ENGINE_REPORT_PATH,
  MV_GENERATION_PLANNING_READY_STATUS,
} from '../services/mvGenerationPlanningEngine.js';
import {
  MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
  MV_PRODUCTION_RUNTIME_ENGINE_DIR,
  MV_PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR,
  MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
  MV_PRODUCTION_RUNTIME_ENGINE_MD_PATH,
  MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT,
  MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_READY_STATUS,
  RUNTIME_MODE_TEST_MODE_ONLY,
  SAFE_CREATE_POLICY,
  writeMvProductionRuntimeEngine,
} from '../services/mvProductionRuntimeEngine.js';
import { MV_TYPE_COUNT, SUPPORTED_MV_TYPES } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const generationPlanningReportPath = path.join(
  projectRoot,
  MV_GENERATION_PLANNING_ENGINE_REPORT_PATH
);
const generationPlanningArtifactPath = path.join(
  projectRoot,
  MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH
);

if (!fs.existsSync(generationPlanningReportPath) || !fs.existsSync(generationPlanningArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV generation planning engine report or artifact');
  process.exit(1);
}

const generationPlanningReport = JSON.parse(
  fs.readFileSync(generationPlanningReportPath, 'utf8')
) as {
  final_verdict: string;
  certification_status: string | null;
  mv_generation_planning_engine_ready: string;
};

if (
  generationPlanningReport.final_verdict !== MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT ||
  generationPlanningReport.certification_status !== MV_GENERATION_PLANNING_READY_STATUS ||
  generationPlanningReport.mv_generation_planning_engine_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_GENERATION_PLANNING_ENGINE_REPORT_PATH} must be ${MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT} with ${MV_GENERATION_PLANNING_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvProductionRuntimeEngine(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_generation_plan_ref=${report.source_generation_plan_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} runtime_plan_count=${report.runtime_plan_count} runtime_mode=${report.runtime_mode} generation_plan_consumed=${report.generation_plan_consumed} runtime_ready=${report.runtime_ready} execution_queue_valid=${report.execution_queue_valid} image_runtime_plan_valid=${report.image_runtime_plan_valid} video_runtime_plan_valid=${report.video_runtime_plan_valid} consistency_runtime_plan_valid=${report.consistency_runtime_plan_valid} quality_gate_runtime_plan_valid=${report.quality_gate_runtime_plan_valid} adapter_execution_plan_valid=${report.adapter_execution_plan_valid} failure_recovery_ready=${report.failure_recovery_ready} runtime_mode_valid=${report.runtime_mode_valid} external_call_blocked=${report.external_call_blocked} gpu_execution_blocked=${report.gpu_execution_blocked} music_sync_preserved=${report.music_sync_preserved} mv_type_preserved=${report.mv_type_preserved} generation_prompt_seed_ready=${report.generation_prompt_seed_ready} traceability_preserved=${report.traceability_preserved} production_mode_blocked=${report.production_mode_blocked} generation_plan_missing=${report.generation_plan_missing} runtime_invalid=${report.runtime_invalid} execution_queue_invalid=${report.execution_queue_invalid} image_runtime_plan_missing=${report.image_runtime_plan_missing} video_runtime_plan_missing=${report.video_runtime_plan_missing} consistency_runtime_plan_missing=${report.consistency_runtime_plan_missing} quality_gate_runtime_plan_missing=${report.quality_gate_runtime_plan_missing} adapter_execution_plan_missing=${report.adapter_execution_plan_missing} failure_recovery_missing=${report.failure_recovery_missing} runtime_mode_invalid=${report.runtime_mode_invalid} external_call_enabled=${report.external_call_enabled} gpu_execution_enabled=${report.gpu_execution_enabled} music_sync_loss=${report.music_sync_loss} mv_type_loss=${report.mv_type_loss} generation_prompt_seed_missing=${report.generation_prompt_seed_missing} traceability_loss=${report.traceability_loss} production_mode_unblocked=${report.production_mode_unblocked} mv_production_runtime_engine_ready=${report.mv_production_runtime_engine_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const plan of report.mv_runtime_plans) {
  console.log(
    `  plan ${plan.mv_runtime_id}: mv_type=${plan.mv_type} units=${plan.runtime_units.length} queue=${plan.execution_queue.length} images=${plan.image_runtime_plan.target_count} videos=${plan.video_runtime_plan.target_count} gates=${plan.quality_gate_runtime_plan.entry_count} recovery=${plan.failure_recovery_plan.step_count} ready=${plan.runtime_ready}`
  );
}
console.log(`report=${MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_RUNTIME_ENGINE_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_ENGINE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.runtime_plan_count !== MV_TYPE_COUNT ||
  report.mv_runtime_plans.length !== MV_TYPE_COUNT ||
  report.runtime_checks.length !== 17 ||
  report.generation_plan_consumed !== 'PASS' ||
  report.runtime_ready !== 'PASS' ||
  report.execution_queue_valid !== 'PASS' ||
  report.image_runtime_plan_valid !== 'PASS' ||
  report.video_runtime_plan_valid !== 'PASS' ||
  report.consistency_runtime_plan_valid !== 'PASS' ||
  report.quality_gate_runtime_plan_valid !== 'PASS' ||
  report.adapter_execution_plan_valid !== 'PASS' ||
  report.failure_recovery_ready !== 'PASS' ||
  report.runtime_mode_valid !== 'PASS' ||
  report.external_call_blocked !== 'PASS' ||
  report.gpu_execution_blocked !== 'PASS' ||
  report.music_sync_preserved !== 'PASS' ||
  report.mv_type_preserved !== 'PASS' ||
  report.generation_prompt_seed_ready !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_mode_blocked !== 'PASS' ||
  report.generation_plan_missing !== false ||
  report.runtime_invalid !== false ||
  report.execution_queue_invalid !== false ||
  report.image_runtime_plan_missing !== false ||
  report.video_runtime_plan_missing !== false ||
  report.consistency_runtime_plan_missing !== false ||
  report.quality_gate_runtime_plan_missing !== false ||
  report.adapter_execution_plan_missing !== false ||
  report.failure_recovery_missing !== false ||
  report.runtime_mode_invalid !== false ||
  report.external_call_enabled !== false ||
  report.gpu_execution_enabled !== false ||
  report.music_sync_loss !== false ||
  report.mv_type_loss !== false ||
  report.generation_prompt_seed_missing !== false ||
  report.traceability_loss !== false ||
  report.production_mode_unblocked !== false ||
  report.mv_production_runtime_engine_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_RUNTIME_READY_STATUS ||
  report.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
  report.external_call_allowed !== false ||
  report.gpu_execution !== false ||
  report.runtime_checks.every((check) => check.status === 'PASS') === false ||
  report.mv_runtime_plans.every((plan) => plan.runtime_ready === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} runtime plans ready, runtime_mode=test_mode_only, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH), 'utf8')
) as {
  source_generation_plan_ref: string;
  mv_runtime_plans: Array<{
    mv_runtime_id: string;
    source_generation_plan_ref: string;
    mv_type: string;
    mv_type_preserved: boolean;
    runtime_mode: string;
    external_call_allowed: boolean;
    gpu_execution_allowed: boolean;
    runtime_units: Array<{
      generation_prompt_seed: string;
      visual_intent: string;
      emotion_beat_ref: string;
      lyric_or_music_section_ref: string;
      adapter_bindings: string[];
      unit_ready: string;
    }>;
    execution_queue: Array<{
      runtime_mode: string;
      execution_allowed: boolean;
    }>;
    image_runtime_plan: {
      runtime_mode: string;
      external_call_allowed: boolean;
      gpu_execution_allowed: boolean;
      plan_valid: boolean;
      target_count: number;
    };
    video_runtime_plan: {
      runtime_mode: string;
      external_call_allowed: boolean;
      gpu_execution_allowed: boolean;
      plan_valid: boolean;
      target_count: number;
    };
    consistency_runtime_plan: { plan_valid: boolean };
    quality_gate_runtime_plan: { plan_valid: boolean; entry_count: number };
    adapter_execution_plan: {
      plan_valid: boolean;
      steps: Array<{ external_call_allowed: boolean; gpu_execution_allowed: boolean }>;
    };
    failure_recovery_plan: { recovery_ready: boolean; step_count: number };
    music_sync_runtime_plan: { sync_valid: boolean };
    lyric_or_music_section_ref: string[];
    visual_intent: string[];
    emotion_beat_ref: string[];
    generation_prompt_seed: string[];
    traceability_chain: { trace_integrity: string };
    runtime_ready: string;
  }>;
  safety_flags: {
    runtime_mode: string;
    image_generation: boolean;
    video_generation: boolean;
    gpu_execution: boolean;
    generation: boolean;
    external_call_allowed: boolean;
  };
};

if (
  artifact.source_generation_plan_ref !== MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH ||
  artifact.mv_runtime_plans.length !== MV_TYPE_COUNT ||
  artifact.safety_flags.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false ||
  artifact.safety_flags.generation !== false ||
  artifact.safety_flags.external_call_allowed !== false
) {
  console.error('Artifact safety or generation plan reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const plan = artifact.mv_runtime_plans.find((entry) => entry.mv_type === mvType);
  if (
    !plan ||
    plan.source_generation_plan_ref !== MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH ||
    plan.mv_type_preserved !== true ||
    plan.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
    plan.external_call_allowed !== false ||
    plan.gpu_execution_allowed !== false ||
    plan.runtime_units.length === 0 ||
    plan.execution_queue.length !== plan.runtime_units.length * 4 ||
    plan.image_runtime_plan.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
    plan.video_runtime_plan.runtime_mode !== RUNTIME_MODE_TEST_MODE_ONLY ||
    plan.image_runtime_plan.external_call_allowed !== false ||
    plan.video_runtime_plan.external_call_allowed !== false ||
    plan.image_runtime_plan.gpu_execution_allowed !== false ||
    plan.video_runtime_plan.gpu_execution_allowed !== false ||
    plan.image_runtime_plan.plan_valid !== true ||
    plan.video_runtime_plan.plan_valid !== true ||
    plan.image_runtime_plan.target_count !== plan.runtime_units.length ||
    plan.video_runtime_plan.target_count !== plan.runtime_units.length ||
    plan.consistency_runtime_plan.plan_valid !== true ||
    plan.quality_gate_runtime_plan.plan_valid !== true ||
    plan.quality_gate_runtime_plan.entry_count > 0 === false ||
    plan.adapter_execution_plan.plan_valid !== true ||
    plan.adapter_execution_plan.steps.length > 0 === false ||
    plan.adapter_execution_plan.steps.every(
      (step) => step.external_call_allowed === false && step.gpu_execution_allowed === false
    ) === false ||
    plan.failure_recovery_plan.recovery_ready !== true ||
    plan.failure_recovery_plan.step_count > 0 === false ||
    plan.music_sync_runtime_plan.sync_valid !== true ||
    plan.lyric_or_music_section_ref.length === 0 ||
    plan.visual_intent.length === 0 ||
    plan.emotion_beat_ref.length === 0 ||
    plan.generation_prompt_seed.length === 0 ||
    plan.traceability_chain.trace_integrity !== 'PASS' ||
    plan.runtime_ready !== 'PASS' ||
    plan.execution_queue.every(
      (entry) =>
        entry.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY && entry.execution_allowed === false
    ) === false ||
    plan.runtime_units.every(
      (unit) =>
        unit.generation_prompt_seed.length > 0 &&
        unit.visual_intent.length > 0 &&
        unit.emotion_beat_ref.length > 0 &&
        unit.lyric_or_music_section_ref.length > 0 &&
        unit.adapter_bindings.length > 0 &&
        unit.unit_ready === 'PASS'
    ) === false
  ) {
    console.error(`Runtime plan structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
