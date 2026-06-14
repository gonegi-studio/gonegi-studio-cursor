import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  MV_PRODUCTION_FOUNDATION_READY_STATUS,
  MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
  MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT,
  MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH,
  MV_TYPE_COUNT,
  SUPPORTED_MV_TYPES,
} from '../services/mvProductionSystemFoundation.js';
import {
  MV_PRODUCTION_BLUEPRINT_READY_STATUS,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_DIR,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_EXPORT_DIR,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_MD_PATH,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH,
  SAFE_CREATE_POLICY,
  SHOTS_PER_SCENE,
  writeMvProductionBlueprintSystem,
} from '../services/mvProductionBlueprintSystem.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const foundationReportPath = path.join(projectRoot, MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH);
const foundationArtifactPath = path.join(projectRoot, MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH);

if (!fs.existsSync(foundationReportPath) || !fs.existsSync(foundationArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production system foundation report or artifact');
  process.exit(1);
}

const foundationReport = JSON.parse(fs.readFileSync(foundationReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  mv_production_system_foundation_ready: string;
};

if (
  foundationReport.final_verdict !== MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT ||
  foundationReport.certification_status !== MV_PRODUCTION_FOUNDATION_READY_STATUS ||
  foundationReport.mv_production_system_foundation_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH} must be ${MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT} with ${MV_PRODUCTION_FOUNDATION_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvProductionBlueprintSystem(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_foundation_ref=${report.source_foundation_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} mv_blueprint_count=${report.mv_blueprint_count} foundation_consumed=${report.foundation_consumed} mv_blueprint_ready=${report.mv_blueprint_ready} scene_sequence_valid=${report.scene_sequence_valid} shot_sequence_valid=${report.shot_sequence_valid} music_sync_valid=${report.music_sync_valid} narrative_arc_valid=${report.narrative_arc_valid} runtime_estimate_valid=${report.runtime_estimate_valid} traceability_preserved=${report.traceability_preserved} production_mode_blocked=${report.production_mode_blocked} foundation_missing=${report.foundation_missing} mv_blueprint_missing=${report.mv_blueprint_missing} scene_sequence_invalid=${report.scene_sequence_invalid} shot_sequence_invalid=${report.shot_sequence_invalid} music_sync_invalid=${report.music_sync_invalid} runtime_estimate_missing=${report.runtime_estimate_missing} traceability_loss=${report.traceability_loss} production_mode_unblocked=${report.production_mode_unblocked} mv_production_blueprint_system_ready=${report.mv_production_blueprint_system_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const blueprint of report.mv_blueprints) {
  console.log(
    `  blueprint ${blueprint.mv_blueprint_id}: mv_type=${blueprint.mv_type} scenes=${blueprint.scene_count_plan.planned_scene_count} shots=${blueprint.shot_count_plan.planned_shot_count} runtime=${blueprint.runtime_estimate.estimated_seconds_min}-${blueprint.runtime_estimate.estimated_seconds_max}s ready=${blueprint.blueprint_ready}`
  );
}
console.log(`report=${MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_BLUEPRINT_SYSTEM_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLUEPRINT_SYSTEM_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLUEPRINT_SYSTEM_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.mv_blueprint_count !== MV_TYPE_COUNT ||
  report.mv_blueprints.length !== MV_TYPE_COUNT ||
  report.blueprint_checks.length !== 9 ||
  report.foundation_consumed !== 'PASS' ||
  report.mv_blueprint_ready !== 'PASS' ||
  report.scene_sequence_valid !== 'PASS' ||
  report.shot_sequence_valid !== 'PASS' ||
  report.music_sync_valid !== 'PASS' ||
  report.narrative_arc_valid !== 'PASS' ||
  report.runtime_estimate_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_mode_blocked !== 'PASS' ||
  report.foundation_missing !== false ||
  report.mv_blueprint_missing !== false ||
  report.scene_sequence_invalid !== false ||
  report.shot_sequence_invalid !== false ||
  report.music_sync_invalid !== false ||
  report.runtime_estimate_missing !== false ||
  report.traceability_loss !== false ||
  report.production_mode_unblocked !== false ||
  report.mv_production_blueprint_system_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_BLUEPRINT_READY_STATUS ||
  report.blueprint_checks.every((check) => check.status === 'PASS') === false ||
  report.mv_blueprints.every((blueprint) => blueprint.blueprint_ready === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} MV blueprints ready, sequences valid, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH), 'utf8')
) as {
  source_foundation_ref: string;
  mv_blueprints: Array<{
    mv_blueprint_id: string;
    mv_type: string;
    source_foundation_ref: string;
    narrative_structure: { structure_ready: boolean };
    scene_count_plan: { plan_valid: boolean };
    shot_count_plan: { plan_valid: boolean; shots_per_scene: number };
    music_sync_plan: { sync_valid: boolean };
    runtime_estimate: { estimate_valid: boolean };
    mv_scene_sequence: unknown[];
    mv_shot_sequence: unknown[];
    traceability_chain: { trace_integrity: string };
    emotional_arc: string[];
  }>;
  safety_flags: { image_generation: boolean; video_generation: boolean; gpu_execution: boolean };
};

if (
  artifact.source_foundation_ref !== MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH ||
  artifact.mv_blueprints.length !== MV_TYPE_COUNT ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false
) {
  console.error('Artifact safety or foundation reference validation failed');
  process.exit(1);
}

for (const mvType of SUPPORTED_MV_TYPES) {
  const blueprint = artifact.mv_blueprints.find((entry) => entry.mv_type === mvType);
  if (
    !blueprint ||
    blueprint.source_foundation_ref !== MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH ||
    blueprint.narrative_structure.structure_ready !== true ||
    blueprint.scene_count_plan.plan_valid !== true ||
    blueprint.shot_count_plan.plan_valid !== true ||
    blueprint.shot_count_plan.shots_per_scene !== SHOTS_PER_SCENE ||
    blueprint.music_sync_plan.sync_valid !== true ||
    blueprint.runtime_estimate.estimate_valid !== true ||
    blueprint.mv_scene_sequence.length === 0 ||
    blueprint.mv_shot_sequence.length === 0 ||
    blueprint.traceability_chain.trace_integrity !== 'PASS' ||
    blueprint.emotional_arc.length === 0
  ) {
    console.error(`Blueprint structure validation failed for ${mvType}`);
    process.exit(1);
  }
}

process.exit(0);
