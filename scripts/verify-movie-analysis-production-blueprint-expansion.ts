import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT,
  LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH,
  LEVEL3_ENTRY_APPROVED_STATUS,
} from '../services/movieAnalysisLevel3BridgeCertification.js';
import {
  PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT,
  PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisProductionEngineFoundation.js';
import {
  PRODUCTION_BLUEPRINT_EXPANDED_STATUS,
  PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  PRODUCTION_BLUEPRINT_EXPANSION_DIR,
  PRODUCTION_BLUEPRINT_EXPANSION_EXPORT_DIR,
  PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH,
  PRODUCTION_BLUEPRINT_EXPANSION_MD_PATH,
  PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT,
  PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  PRODUCTION_BLUEPRINT_TYPES,
  writeMovieAnalysisProductionBlueprintExpansion,
} from '../services/movieAnalysisProductionBlueprintExpansion.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const bridgeReportPath = path.join(projectRoot, LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH);
if (!fs.existsSync(bridgeReportPath)) {
  console.error(`PRECHECK FAIL: Missing required upstream asset: ${LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const bridgeReport = JSON.parse(fs.readFileSync(bridgeReportPath, 'utf8')) as {
  final_verdict: string;
  final_output_status: string | null;
  level3_entry_ready: boolean;
};

if (
  bridgeReport.final_verdict !== LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT ||
  bridgeReport.final_output_status !== LEVEL3_ENTRY_APPROVED_STATUS ||
  bridgeReport.level3_entry_ready !== true
) {
  console.error(
    `PRECHECK FAIL: ${LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH} must be ${LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT} with ${LEVEL3_ENTRY_APPROVED_STATUS}`
  );
  process.exit(1);
}

const foundationReportPath = path.join(projectRoot, PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH);
const foundationArtifactPath = path.join(projectRoot, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH);

if (!fs.existsSync(foundationReportPath) || !fs.existsSync(foundationArtifactPath)) {
  console.error('PRECHECK FAIL: Missing production engine foundation report or artifact');
  process.exit(1);
}

const foundationReport = JSON.parse(fs.readFileSync(foundationReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  foundationReport.final_verdict !== PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT ||
  foundationReport.certification_status !== PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE
) {
  console.error(
    `PRECHECK FAIL: ${PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH} must be ${PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT} with ${PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisProductionBlueprintExpansion(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} bridge_certification_consumed=${report.bridge_certification_consumed} foundation_consumed=${report.foundation_consumed} blueprint_expansion_complete=${report.blueprint_expansion_complete} mv_blueprint_ready=${report.mv_blueprint_ready} short_film_blueprint_ready=${report.short_film_blueprint_ready} episode_blueprint_ready=${report.episode_blueprint_ready} scene_sequence_blueprint_ready=${report.scene_sequence_blueprint_ready} scene_plan_complete=${report.scene_plan_complete} shot_plan_complete=${report.shot_plan_complete} generation_plan_complete=${report.generation_plan_complete} character_memory_preserved=${report.character_memory_preserved} location_memory_preserved=${report.location_memory_preserved} story_memory_preserved=${report.story_memory_preserved} traceability_preserved=${report.traceability_preserved} bridge_missing=${report.bridge_missing} foundation_missing=${report.foundation_missing} blueprint_expansion_failure=${report.blueprint_expansion_failure} scene_plan_incomplete=${report.scene_plan_incomplete} shot_plan_incomplete=${report.shot_plan_incomplete} generation_plan_incomplete=${report.generation_plan_incomplete} memory_binding_loss=${report.memory_binding_loss} traceability_loss=${report.traceability_loss} production_plan_incomplete=${report.production_plan_incomplete} production_blueprint_expansion_ready=${report.production_blueprint_expansion_ready}`
);
for (const blueprint of report.expanded_blueprints) {
  console.log(
    `  blueprint ${blueprint.blueprint_id}: type=${blueprint.production_type} ready=${blueprint.blueprint_ready} scenes=${blueprint.scene_plan.scene_count} shots=${blueprint.shot_plan.shot_count}`
  );
}
console.log(`report=${PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH}`);
console.log(`markdown=${PRODUCTION_BLUEPRINT_EXPANSION_MD_PATH}`);
console.log(`manifest=${PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH}`);
console.log(`artifact=${PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_BLUEPRINT_EXPANSION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_BLUEPRINT_EXPANSION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.blueprint_type_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.bridge_certification_consumed !== 'PASS' ||
  report.foundation_consumed !== 'PASS' ||
  report.blueprint_expansion_complete !== 'PASS' ||
  report.mv_blueprint_ready !== 'PASS' ||
  report.short_film_blueprint_ready !== 'PASS' ||
  report.episode_blueprint_ready !== 'PASS' ||
  report.scene_sequence_blueprint_ready !== 'PASS' ||
  report.scene_plan_complete !== 'PASS' ||
  report.shot_plan_complete !== 'PASS' ||
  report.generation_plan_complete !== 'PASS' ||
  report.character_memory_preserved !== 'PASS' ||
  report.location_memory_preserved !== 'PASS' ||
  report.story_memory_preserved !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_blueprint_expansion_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_BLUEPRINT_EXPANDED_STATUS ||
  report.bridge_missing !== false ||
  report.foundation_missing !== false ||
  report.blueprint_expansion_failure !== false ||
  report.scene_plan_incomplete !== false ||
  report.shot_plan_incomplete !== false ||
  report.generation_plan_incomplete !== false ||
  report.memory_binding_loss !== false ||
  report.traceability_loss !== false ||
  report.production_plan_incomplete !== false ||
  report.expanded_blueprints.length !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.expanded_blueprints.every((blueprint) => blueprint.blueprint_ready === 'PASS') === false ||
  PRODUCTION_BLUEPRINT_TYPES.every((type) =>
    report.expanded_blueprints.some(
      (blueprint) => blueprint.production_type === type && blueprint.blueprint_ready === 'PASS'
    )
  ) === false
) {
  console.error(
    'Expected PASS with all blueprint types expanded, plans complete, memory preserved, and traceability intact'
  );
  process.exit(1);
}

process.exit(0);
