import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
  MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SCENE_ASSEMBLY_READY_STATUS,
} from '../services/mvSceneAssemblyEngine.js';
import { SHOTS_PER_SCENE } from '../services/mvProductionBlueprintSystem.js';
import {
  MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  MV_SHOT_ASSEMBLY_ENGINE_DIR,
  MV_SHOT_ASSEMBLY_ENGINE_EXPORT_DIR,
  MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
  MV_SHOT_ASSEMBLY_ENGINE_MD_PATH,
  MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
  MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SHOT_ASSEMBLY_READY_STATUS,
  SAFE_CREATE_POLICY,
  writeMvShotAssemblyEngine,
} from '../services/mvShotAssemblyEngine.js';
import { MV_TYPE_COUNT, SUPPORTED_MV_TYPES } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const sceneAssemblyReportPath = path.join(projectRoot, MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH);
const sceneAssemblyArtifactPath = path.join(projectRoot, MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH);

if (!fs.existsSync(sceneAssemblyReportPath) || !fs.existsSync(sceneAssemblyArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV scene assembly engine report or artifact');
  process.exit(1);
}

const sceneAssemblyReport = JSON.parse(fs.readFileSync(sceneAssemblyReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  mv_scene_assembly_engine_ready: string;
};

if (
  sceneAssemblyReport.final_verdict !== MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT ||
  sceneAssemblyReport.certification_status !== MV_SCENE_ASSEMBLY_READY_STATUS ||
  sceneAssemblyReport.mv_scene_assembly_engine_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH} must be ${MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT} with ${MV_SCENE_ASSEMBLY_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvShotAssemblyEngine(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_scene_assembly_ref=${report.source_scene_assembly_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} assembly_count=${report.assembly_count} scene_assembly_consumed=${report.scene_assembly_consumed} shot_assembly_ready=${report.shot_assembly_ready} shot_sequence_valid=${report.shot_sequence_valid} shot_transition_valid=${report.shot_transition_valid} camera_plan_valid=${report.camera_plan_valid} coverage_plan_valid=${report.coverage_plan_valid} shot_duration_valid=${report.shot_duration_valid} music_sync_valid=${report.music_sync_valid} visual_intent_present=${report.visual_intent_present} emotion_beat_ref_valid=${report.emotion_beat_ref_valid} generation_prompt_seed_ready=${report.generation_prompt_seed_ready} mv_type_preserved=${report.mv_type_preserved} traceability_preserved=${report.traceability_preserved} production_mode_blocked=${report.production_mode_blocked} scene_assembly_missing=${report.scene_assembly_missing} shot_sequence_invalid=${report.shot_sequence_invalid} shot_transition_invalid=${report.shot_transition_invalid} camera_plan_missing=${report.camera_plan_missing} coverage_plan_missing=${report.coverage_plan_missing} shot_duration_missing=${report.shot_duration_missing} music_sync_invalid=${report.music_sync_invalid} visual_intent_missing=${report.visual_intent_missing} emotion_beat_ref_missing=${report.emotion_beat_ref_missing} generation_prompt_seed_missing=${report.generation_prompt_seed_missing} mv_type_loss=${report.mv_type_loss} traceability_loss=${report.traceability_loss} production_mode_unblocked=${report.production_mode_unblocked} mv_shot_assembly_engine_ready=${report.mv_shot_assembly_engine_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const assembly of report.mv_shot_assemblies) {
  console.log(
    `  assembly ${assembly.mv_shot_assembly_id}: mv_type=${assembly.mv_type} shots=${assembly.mv_shot_units.length} transitions=${assembly.shot_transitions.length} ready=${assembly.assembly_ready}`
  );
}
console.log(`report=${MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH}`);
console.log(`markdown=${MV_SHOT_ASSEMBLY_ENGINE_MD_PATH}`);
console.log(`manifest=${MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH}`);
console.log(`artifact=${MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_SHOT_ASSEMBLY_ENGINE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_SHOT_ASSEMBLY_ENGINE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.assembly_count !== MV_TYPE_COUNT ||
  report.mv_shot_assemblies.length !== MV_TYPE_COUNT ||
  report.assembly_checks.length !== 14 ||
  report.scene_assembly_consumed !== 'PASS' ||
  report.shot_assembly_ready !== 'PASS' ||
  report.shot_sequence_valid !== 'PASS' ||
  report.shot_transition_valid !== 'PASS' ||
  report.camera_plan_valid !== 'PASS' ||
  report.coverage_plan_valid !== 'PASS' ||
  report.shot_duration_valid !== 'PASS' ||
  report.music_sync_valid !== 'PASS' ||
  report.visual_intent_present !== 'PASS' ||
  report.emotion_beat_ref_valid !== 'PASS' ||
  report.generation_prompt_seed_ready !== 'PASS' ||
  report.mv_type_preserved !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_mode_blocked !== 'PASS' ||
  report.scene_assembly_missing !== false ||
  report.shot_sequence_invalid !== false ||
  report.shot_transition_invalid !== false ||
  report.camera_plan_missing !== false ||
  report.coverage_plan_missing !== false ||
  report.shot_duration_missing !== false ||
  report.music_sync_invalid !== false ||
  report.visual_intent_missing !== false ||
  report.emotion_beat_ref_missing !== false ||
  report.generation_prompt_seed_missing !== false ||
  report.mv_type_loss !== false ||
  report.traceability_loss !== false ||
  report.production_mode_unblocked !== false ||
  report.mv_shot_assembly_engine_ready !== 'PASS' ||
  report.certification_status !== MV_SHOT_ASSEMBLY_READY_STATUS ||
  report.assembly_checks.every((check) => check.status === 'PASS') === false ||
  report.mv_shot_assemblies.every((assembly) => assembly.assembly_ready === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} shot assemblies ready, plans valid, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH), 'utf8')
) as {
  source_scene_assembly_ref: string;
  mv_shot_assemblies: Array<{
    mv_shot_assembly_id: string;
    source_scene_assembly_ref: string;
    mv_type: string;
    mv_type_preserved: boolean;
    mv_shot_units: Array<{
      scene_ref: string;
      visual_intent: string;
      emotion_beat_ref: string;
      generation_prompt_seed: string;
      lyric_or_music_section_ref: string;
      unit_ready: string;
    }>;
    shot_sequence: string[];
    shot_dependencies: unknown[];
    shot_transitions: unknown[];
    camera_plan: { plan_valid: boolean };
    coverage_plan: { plan_valid: boolean };
    shot_duration_plan: { plan_valid: boolean };
    music_sync_plan: { sync_valid: boolean };
    lyric_or_music_section_ref: string[];
    traceability_chain: { trace_integrity: string };
    assembly_ready: string;
  }>;
  safety_flags: { image_generation: boolean; video_generation: boolean; gpu_execution: boolean };
};

if (
  artifact.source_scene_assembly_ref !== MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH ||
  artifact.mv_shot_assemblies.length !== MV_TYPE_COUNT ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false
) {
  console.error('Artifact safety or scene assembly reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const assembly = artifact.mv_shot_assemblies.find((entry) => entry.mv_type === mvType);
  if (
    !assembly ||
    assembly.source_scene_assembly_ref !== MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH ||
    assembly.mv_type_preserved !== true ||
    assembly.mv_shot_units.length === 0 ||
    assembly.shot_sequence.length === 0 ||
    assembly.shot_dependencies.length === 0 ||
    assembly.shot_transitions.length === 0 ||
    assembly.camera_plan.plan_valid !== true ||
    assembly.coverage_plan.plan_valid !== true ||
    assembly.shot_duration_plan.plan_valid !== true ||
    assembly.music_sync_plan.sync_valid !== true ||
    assembly.lyric_or_music_section_ref.length === 0 ||
    assembly.traceability_chain.trace_integrity !== 'PASS' ||
    assembly.assembly_ready !== 'PASS' ||
    assembly.mv_shot_units.length !== assembly.shot_sequence.length ||
    assembly.mv_shot_units.every(
      (unit) =>
        unit.scene_ref.length > 0 &&
        unit.visual_intent.length > 0 &&
        unit.emotion_beat_ref.length > 0 &&
        unit.generation_prompt_seed.length > 0 &&
        unit.lyric_or_music_section_ref.length > 0 &&
        unit.unit_ready === 'PASS'
    ) === false ||
    assembly.mv_shot_units.length !==
      new Set(assembly.mv_shot_units.map((unit) => unit.scene_ref)).size * SHOTS_PER_SCENE
  ) {
    console.error(`Shot assembly structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
