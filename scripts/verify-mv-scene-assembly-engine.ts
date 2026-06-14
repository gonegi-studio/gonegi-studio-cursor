import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MV_PRODUCTION_BLUEPRINT_READY_STATUS,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH,
  MV_TYPE_COUNT,
  SUPPORTED_MV_TYPES,
} from '../services/mvProductionBlueprintSystem.js';
import {
  MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  MV_SCENE_ASSEMBLY_ENGINE_DIR,
  MV_SCENE_ASSEMBLY_ENGINE_EXPORT_DIR,
  MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
  MV_SCENE_ASSEMBLY_ENGINE_MD_PATH,
  MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
  MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SCENE_ASSEMBLY_READY_STATUS,
  SAFE_CREATE_POLICY,
  writeMvSceneAssemblyEngine,
} from '../services/mvSceneAssemblyEngine.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const blueprintReportPath = path.join(projectRoot, MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH);
const blueprintArtifactPath = path.join(projectRoot, MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH);

if (!fs.existsSync(blueprintReportPath) || !fs.existsSync(blueprintArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production blueprint system report or artifact');
  process.exit(1);
}

const blueprintReport = JSON.parse(fs.readFileSync(blueprintReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  mv_production_blueprint_system_ready: string;
};

if (
  blueprintReport.final_verdict !== MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT ||
  blueprintReport.certification_status !== MV_PRODUCTION_BLUEPRINT_READY_STATUS ||
  blueprintReport.mv_production_blueprint_system_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH} must be ${MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT} with ${MV_PRODUCTION_BLUEPRINT_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvSceneAssemblyEngine(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_blueprint_ref=${report.source_blueprint_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} assembly_count=${report.assembly_count} blueprint_consumed=${report.blueprint_consumed} scene_assembly_ready=${report.scene_assembly_ready} scene_sequence_valid=${report.scene_sequence_valid} scene_transition_valid=${report.scene_transition_valid} scene_duration_valid=${report.scene_duration_valid} music_section_ref_valid=${report.music_section_ref_valid} continuity_preserved=${report.continuity_preserved} music_sync_preserved=${report.music_sync_preserved} emotional_progression_preserved=${report.emotional_progression_preserved} mv_type_preserved=${report.mv_type_preserved} traceability_preserved=${report.traceability_preserved} production_mode_blocked=${report.production_mode_blocked} blueprint_missing=${report.blueprint_missing} scene_sequence_invalid=${report.scene_sequence_invalid} scene_transition_invalid=${report.scene_transition_invalid} scene_duration_missing=${report.scene_duration_missing} music_section_ref_missing=${report.music_section_ref_missing} continuity_loss=${report.continuity_loss} music_sync_loss=${report.music_sync_loss} emotional_progression_loss=${report.emotional_progression_loss} mv_type_loss=${report.mv_type_loss} traceability_loss=${report.traceability_loss} production_mode_unblocked=${report.production_mode_unblocked} mv_scene_assembly_engine_ready=${report.mv_scene_assembly_engine_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const assembly of report.mv_scene_assemblies) {
  console.log(
    `  assembly ${assembly.mv_scene_assembly_id}: mv_type=${assembly.mv_type} units=${assembly.mv_scene_units.length} transitions=${assembly.scene_transitions.length} ready=${assembly.assembly_ready}`
  );
}
console.log(`report=${MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH}`);
console.log(`markdown=${MV_SCENE_ASSEMBLY_ENGINE_MD_PATH}`);
console.log(`manifest=${MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH}`);
console.log(`artifact=${MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_SCENE_ASSEMBLY_ENGINE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_SCENE_ASSEMBLY_ENGINE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.assembly_count !== MV_TYPE_COUNT ||
  report.mv_scene_assemblies.length !== MV_TYPE_COUNT ||
  report.assembly_checks.length !== 12 ||
  report.blueprint_consumed !== 'PASS' ||
  report.scene_assembly_ready !== 'PASS' ||
  report.scene_sequence_valid !== 'PASS' ||
  report.scene_transition_valid !== 'PASS' ||
  report.scene_duration_valid !== 'PASS' ||
  report.music_section_ref_valid !== 'PASS' ||
  report.continuity_preserved !== 'PASS' ||
  report.music_sync_preserved !== 'PASS' ||
  report.emotional_progression_preserved !== 'PASS' ||
  report.mv_type_preserved !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_mode_blocked !== 'PASS' ||
  report.blueprint_missing !== false ||
  report.scene_sequence_invalid !== false ||
  report.scene_transition_invalid !== false ||
  report.scene_duration_missing !== false ||
  report.music_section_ref_missing !== false ||
  report.continuity_loss !== false ||
  report.music_sync_loss !== false ||
  report.emotional_progression_loss !== false ||
  report.mv_type_loss !== false ||
  report.traceability_loss !== false ||
  report.production_mode_unblocked !== false ||
  report.mv_scene_assembly_engine_ready !== 'PASS' ||
  report.certification_status !== MV_SCENE_ASSEMBLY_READY_STATUS ||
  report.assembly_checks.every((check) => check.status === 'PASS') === false ||
  report.mv_scene_assemblies.every((assembly) => assembly.assembly_ready === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} scene assemblies ready, sequences valid, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH), 'utf8')
) as {
  source_blueprint_ref: string;
  mv_scene_assemblies: Array<{
    mv_scene_assembly_id: string;
    source_blueprint_ref: string;
    mv_type: string;
    mv_type_preserved: boolean;
    mv_scene_units: unknown[];
    scene_sequence: string[];
    scene_dependencies: unknown[];
    scene_transitions: unknown[];
    continuity_links: unknown[];
    music_sync_links: unknown[];
    emotional_progression_links: unknown[];
    scene_duration_plan: { plan_valid: boolean };
    lyric_or_music_section_ref: string[];
    traceability_chain: { trace_integrity: string };
    assembly_ready: string;
  }>;
  safety_flags: { image_generation: boolean; video_generation: boolean; gpu_execution: boolean };
};

if (
  artifact.source_blueprint_ref !== MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH ||
  artifact.mv_scene_assemblies.length !== MV_TYPE_COUNT ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false
) {
  console.error('Artifact safety or blueprint reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const assembly = artifact.mv_scene_assemblies.find((entry) => entry.mv_type === mvType);
  if (
    !assembly ||
    assembly.source_blueprint_ref !== MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH ||
    assembly.mv_type_preserved !== true ||
    assembly.mv_scene_units.length === 0 ||
    assembly.scene_sequence.length === 0 ||
    assembly.scene_dependencies.length === 0 ||
    assembly.scene_transitions.length === 0 ||
    assembly.continuity_links.length === 0 ||
    assembly.music_sync_links.length === 0 ||
    assembly.emotional_progression_links.length === 0 ||
    assembly.scene_duration_plan.plan_valid !== true ||
    assembly.lyric_or_music_section_ref.length === 0 ||
    assembly.traceability_chain.trace_integrity !== 'PASS' ||
    assembly.assembly_ready !== 'PASS'
  ) {
    console.error(`Scene assembly structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
