import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_BLUEPRINT_EXPANDED_STATUS,
  PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT,
  PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
} from '../services/movieAnalysisProductionBlueprintExpansion.js';
import {
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SCENE_ASSEMBLY_ENGINE_DIR,
  SCENE_ASSEMBLY_ENGINE_EXPORT_DIR,
  SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
  SCENE_ASSEMBLY_ENGINE_MD_PATH,
  SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
  SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  SCENE_ASSEMBLY_READY_STATUS,
  writeMovieAnalysisSceneAssemblyEngine,
} from '../services/movieAnalysisSceneAssemblyEngine.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const expansionReportPath = path.join(projectRoot, PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH);
const expansionArtifactPath = path.join(projectRoot, PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH);

if (!fs.existsSync(expansionReportPath) || !fs.existsSync(expansionArtifactPath)) {
  console.error('PRECHECK FAIL: Missing production blueprint expansion report or artifact');
  process.exit(1);
}

const expansionReport = JSON.parse(fs.readFileSync(expansionReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  expansionReport.final_verdict !== PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT ||
  expansionReport.certification_status !== PRODUCTION_BLUEPRINT_EXPANDED_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH} must be ${PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT} with ${PRODUCTION_BLUEPRINT_EXPANDED_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisSceneAssemblyEngine(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} blueprint_consumed=${report.blueprint_consumed} scene_assembly_complete=${report.scene_assembly_complete} scene_order_preserved=${report.scene_order_preserved} scene_dependencies_valid=${report.scene_dependencies_valid} scene_transition_valid=${report.scene_transition_valid} continuity_preserved=${report.continuity_preserved} execution_readiness_valid=${report.execution_readiness_valid} character_memory_preserved=${report.character_memory_preserved} location_memory_preserved=${report.location_memory_preserved} story_memory_preserved=${report.story_memory_preserved} traceability_preserved=${report.traceability_preserved} blueprint_missing=${report.blueprint_missing} scene_assembly_failure=${report.scene_assembly_failure} scene_dependency_break=${report.scene_dependency_break} transition_break=${report.transition_break} continuity_loss=${report.continuity_loss} execution_not_ready=${report.execution_not_ready} memory_binding_loss=${report.memory_binding_loss} traceability_loss=${report.traceability_loss} scene_assembly_engine_ready=${report.scene_assembly_engine_ready}`
);
for (const assembly of report.assemblies) {
  console.log(
    `  assembly ${assembly.assembly_id}: ready=${assembly.assembly_ready} scenes=${assembly.scene_units.length} transitions=${assembly.scene_transitions.length}`
  );
}
console.log(`report=${SCENE_ASSEMBLY_ENGINE_REPORT_PATH}`);
console.log(`markdown=${SCENE_ASSEMBLY_ENGINE_MD_PATH}`);
console.log(`manifest=${SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH}`);
console.log(`artifact=${SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== SCENE_ASSEMBLY_ENGINE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, SCENE_ASSEMBLY_ENGINE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, SCENE_ASSEMBLY_ENGINE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, SCENE_ASSEMBLY_ENGINE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.assembly_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.blueprint_consumed !== 'PASS' ||
  report.scene_assembly_complete !== 'PASS' ||
  report.scene_order_preserved !== 'PASS' ||
  report.scene_dependencies_valid !== 'PASS' ||
  report.scene_transition_valid !== 'PASS' ||
  report.continuity_preserved !== 'PASS' ||
  report.execution_readiness_valid !== 'PASS' ||
  report.character_memory_preserved !== 'PASS' ||
  report.location_memory_preserved !== 'PASS' ||
  report.story_memory_preserved !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.scene_assembly_engine_ready !== 'PASS' ||
  report.certification_status !== SCENE_ASSEMBLY_READY_STATUS ||
  report.blueprint_missing !== false ||
  report.scene_assembly_failure !== false ||
  report.scene_dependency_break !== false ||
  report.transition_break !== false ||
  report.continuity_loss !== false ||
  report.execution_not_ready !== false ||
  report.memory_binding_loss !== false ||
  report.traceability_loss !== false ||
  report.assemblies.length !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.assemblies.every((assembly) => assembly.assembly_ready === 'PASS') === false ||
  report.assemblies.every((assembly) => assembly.execution_readiness === 'PASS') === false
) {
  console.error(
    'Expected PASS with scene assemblies complete, order preserved, dependencies valid, and traceability intact'
  );
  process.exit(1);
}

process.exit(0);
