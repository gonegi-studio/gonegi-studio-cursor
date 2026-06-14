import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  MV_GENERATION_PLANNING_ENGINE_DIR,
  MV_GENERATION_PLANNING_ENGINE_EXPORT_DIR,
  MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
  MV_GENERATION_PLANNING_ENGINE_MD_PATH,
  MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT,
  MV_GENERATION_PLANNING_ENGINE_REPORT_PATH,
  MV_GENERATION_PLANNING_READY_STATUS,
  SAFE_CREATE_POLICY,
  writeMvGenerationPlanningEngine,
} from '../services/mvGenerationPlanningEngine.js';
import {
  MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
  MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SHOT_ASSEMBLY_READY_STATUS,
} from '../services/mvShotAssemblyEngine.js';
import { MV_TYPE_COUNT, SUPPORTED_MV_TYPES } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const shotAssemblyReportPath = path.join(projectRoot, MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH);
const shotAssemblyArtifactPath = path.join(projectRoot, MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH);

if (!fs.existsSync(shotAssemblyReportPath) || !fs.existsSync(shotAssemblyArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV shot assembly engine report or artifact');
  process.exit(1);
}

const shotAssemblyReport = JSON.parse(fs.readFileSync(shotAssemblyReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  mv_shot_assembly_engine_ready: string;
};

if (
  shotAssemblyReport.final_verdict !== MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT ||
  shotAssemblyReport.certification_status !== MV_SHOT_ASSEMBLY_READY_STATUS ||
  shotAssemblyReport.mv_shot_assembly_engine_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH} must be ${MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT} with ${MV_SHOT_ASSEMBLY_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvGenerationPlanningEngine(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_shot_assembly_ref=${report.source_shot_assembly_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} generation_plan_count=${report.generation_plan_count} shot_assembly_consumed=${report.shot_assembly_consumed} generation_plan_ready=${report.generation_plan_ready} image_generation_plan_valid=${report.image_generation_plan_valid} video_generation_plan_valid=${report.video_generation_plan_valid} consistency_plan_valid=${report.consistency_plan_valid} quality_gate_valid=${report.quality_gate_valid} music_sync_preserved=${report.music_sync_preserved} mv_type_preserved=${report.mv_type_preserved} generation_prompt_seed_ready=${report.generation_prompt_seed_ready} adapter_requirements_valid=${report.adapter_requirements_valid} traceability_preserved=${report.traceability_preserved} production_mode_blocked=${report.production_mode_blocked} shot_assembly_missing=${report.shot_assembly_missing} generation_plan_invalid=${report.generation_plan_invalid} image_generation_plan_missing=${report.image_generation_plan_missing} video_generation_plan_missing=${report.video_generation_plan_missing} consistency_plan_missing=${report.consistency_plan_missing} quality_gate_missing=${report.quality_gate_missing} music_sync_loss=${report.music_sync_loss} mv_type_loss=${report.mv_type_loss} generation_prompt_seed_missing=${report.generation_prompt_seed_missing} adapter_requirements_missing=${report.adapter_requirements_missing} traceability_loss=${report.traceability_loss} production_mode_unblocked=${report.production_mode_unblocked} mv_generation_planning_engine_ready=${report.mv_generation_planning_engine_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const plan of report.generation_plans) {
  console.log(
    `  plan ${plan.generation_plan_id}: mv_type=${plan.mv_type} units=${plan.generation_units.length} images=${plan.image_generation_plan.target_count} videos=${plan.video_generation_plan.target_count} gates=${plan.quality_gate_plan.entry_count} ready=${plan.generation_plan_ready}`
  );
}
console.log(`report=${MV_GENERATION_PLANNING_ENGINE_REPORT_PATH}`);
console.log(`markdown=${MV_GENERATION_PLANNING_ENGINE_MD_PATH}`);
console.log(`manifest=${MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH}`);
console.log(`artifact=${MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_GENERATION_PLANNING_ENGINE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_GENERATION_PLANNING_ENGINE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_GENERATION_PLANNING_ENGINE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.generation_plan_count !== MV_TYPE_COUNT ||
  report.generation_plans.length !== MV_TYPE_COUNT ||
  report.planning_checks.length !== 12 ||
  report.shot_assembly_consumed !== 'PASS' ||
  report.generation_plan_ready !== 'PASS' ||
  report.image_generation_plan_valid !== 'PASS' ||
  report.video_generation_plan_valid !== 'PASS' ||
  report.consistency_plan_valid !== 'PASS' ||
  report.quality_gate_valid !== 'PASS' ||
  report.music_sync_preserved !== 'PASS' ||
  report.mv_type_preserved !== 'PASS' ||
  report.generation_prompt_seed_ready !== 'PASS' ||
  report.adapter_requirements_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_mode_blocked !== 'PASS' ||
  report.shot_assembly_missing !== false ||
  report.generation_plan_invalid !== false ||
  report.image_generation_plan_missing !== false ||
  report.video_generation_plan_missing !== false ||
  report.consistency_plan_missing !== false ||
  report.quality_gate_missing !== false ||
  report.music_sync_loss !== false ||
  report.mv_type_loss !== false ||
  report.generation_prompt_seed_missing !== false ||
  report.adapter_requirements_missing !== false ||
  report.traceability_loss !== false ||
  report.production_mode_unblocked !== false ||
  report.mv_generation_planning_engine_ready !== 'PASS' ||
  report.certification_status !== MV_GENERATION_PLANNING_READY_STATUS ||
  report.planning_checks.every((check) => check.status === 'PASS') === false ||
  report.generation_plans.every((plan) => plan.generation_plan_ready === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} generation plans ready, plans valid, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH), 'utf8')
) as {
  source_shot_assembly_ref: string;
  generation_plans: Array<{
    generation_plan_id: string;
    source_shot_assembly_ref: string;
    mv_type: string;
    mv_type_preserved: boolean;
    generation_units: Array<{
      generation_prompt_seed: string;
      visual_intent: string;
      emotion_beat_ref: string;
      lyric_or_music_section_ref: string;
      adapter_requirements: string[];
      unit_ready: string;
    }>;
    image_generation_plan: { planning_only: boolean; plan_valid: boolean; target_count: number };
    video_generation_plan: { planning_only: boolean; plan_valid: boolean; target_count: number };
    consistency_plan: { plan_valid: boolean };
    quality_gate_plan: { plan_valid: boolean; entry_count: number };
    adapter_requirements: string[];
    music_sync_plan: { sync_valid: boolean };
    lyric_or_music_section_ref: string[];
    visual_intent: string[];
    emotion_beat_ref: string[];
    generation_prompt_seed: string[];
    traceability_chain: { trace_integrity: string };
    generation_plan_ready: string;
  }>;
  safety_flags: { image_generation: boolean; video_generation: boolean; gpu_execution: boolean; generation: boolean };
};

if (
  artifact.source_shot_assembly_ref !== MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH ||
  artifact.generation_plans.length !== MV_TYPE_COUNT ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false ||
  artifact.safety_flags.generation !== false
) {
  console.error('Artifact safety or shot assembly reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const plan = artifact.generation_plans.find((entry) => entry.mv_type === mvType);
  if (
    !plan ||
    plan.source_shot_assembly_ref !== MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH ||
    plan.mv_type_preserved !== true ||
    plan.generation_units.length === 0 ||
    plan.image_generation_plan.planning_only !== true ||
    plan.video_generation_plan.planning_only !== true ||
    plan.image_generation_plan.plan_valid !== true ||
    plan.video_generation_plan.plan_valid !== true ||
    plan.image_generation_plan.target_count !== plan.generation_units.length ||
    plan.video_generation_plan.target_count !== plan.generation_units.length ||
    plan.consistency_plan.plan_valid !== true ||
    plan.quality_gate_plan.plan_valid !== true ||
    plan.quality_gate_plan.entry_count > 0 === false ||
    plan.adapter_requirements.length > 0 === false ||
    plan.music_sync_plan.sync_valid !== true ||
    plan.lyric_or_music_section_ref.length === 0 ||
    plan.visual_intent.length === 0 ||
    plan.emotion_beat_ref.length === 0 ||
    plan.generation_prompt_seed.length === 0 ||
    plan.traceability_chain.trace_integrity !== 'PASS' ||
    plan.generation_plan_ready !== 'PASS' ||
    plan.generation_units.every(
      (unit) =>
        unit.generation_prompt_seed.length > 0 &&
        unit.visual_intent.length > 0 &&
        unit.emotion_beat_ref.length > 0 &&
        unit.lyric_or_music_section_ref.length > 0 &&
        unit.adapter_requirements.length > 0 &&
        unit.unit_ready === 'PASS'
    ) === false
  ) {
    console.error(`Generation plan structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
