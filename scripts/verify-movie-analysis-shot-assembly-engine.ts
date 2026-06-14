import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
  SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  SCENE_ASSEMBLY_READY_STATUS,
} from '../services/movieAnalysisSceneAssemblyEngine.js';
import {
  SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SHOT_ASSEMBLY_ENGINE_DIR,
  SHOT_ASSEMBLY_ENGINE_EXPORT_DIR,
  SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
  SHOT_ASSEMBLY_ENGINE_MD_PATH,
  SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
  SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  SHOT_ASSEMBLY_READY_STATUS,
  writeMovieAnalysisShotAssemblyEngine,
} from '../services/movieAnalysisShotAssemblyEngine.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const sceneAssemblyReportPath = path.join(projectRoot, SCENE_ASSEMBLY_ENGINE_REPORT_PATH);
const sceneAssemblyArtifactPath = path.join(projectRoot, SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH);

if (!fs.existsSync(sceneAssemblyReportPath) || !fs.existsSync(sceneAssemblyArtifactPath)) {
  console.error('PRECHECK FAIL: Missing scene assembly engine report or artifact');
  process.exit(1);
}

const sceneAssemblyReport = JSON.parse(fs.readFileSync(sceneAssemblyReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  sceneAssemblyReport.final_verdict !== SCENE_ASSEMBLY_ENGINE_PASS_VERDICT ||
  sceneAssemblyReport.certification_status !== SCENE_ASSEMBLY_READY_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${SCENE_ASSEMBLY_ENGINE_REPORT_PATH} must be ${SCENE_ASSEMBLY_ENGINE_PASS_VERDICT} with ${SCENE_ASSEMBLY_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisShotAssemblyEngine(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} scene_assembly_consumed=${report.scene_assembly_consumed} shot_assembly_complete=${report.shot_assembly_complete} shot_order_preserved=${report.shot_order_preserved} shot_dependencies_valid=${report.shot_dependencies_valid} shot_transition_valid=${report.shot_transition_valid} shot_duration_valid=${report.shot_duration_valid} generation_prompt_seed_present=${report.generation_prompt_seed_present} adapter_requirements_preserved=${report.adapter_requirements_preserved} coverage_preserved=${report.coverage_preserved} camera_motion_preserved=${report.camera_motion_preserved} continuity_preserved=${report.continuity_preserved} execution_readiness_valid=${report.execution_readiness_valid} traceability_preserved=${report.traceability_preserved} scene_assembly_missing=${report.scene_assembly_missing} shot_assembly_failure=${report.shot_assembly_failure} shot_dependency_break=${report.shot_dependency_break} shot_transition_break=${report.shot_transition_break} shot_duration_invalid=${report.shot_duration_invalid} generation_prompt_seed_missing=${report.generation_prompt_seed_missing} adapter_requirements_loss=${report.adapter_requirements_loss} coverage_loss=${report.coverage_loss} continuity_loss=${report.continuity_loss} execution_not_ready=${report.execution_not_ready} traceability_loss=${report.traceability_loss} shot_assembly_engine_ready=${report.shot_assembly_engine_ready}`
);
for (const assembly of report.shot_assemblies) {
  console.log(
    `  shot_assembly ${assembly.shot_assembly_id}: ready=${assembly.shot_assembly_ready} shots=${assembly.shot_units.length}`
  );
}
console.log(`report=${SHOT_ASSEMBLY_ENGINE_REPORT_PATH}`);
console.log(`markdown=${SHOT_ASSEMBLY_ENGINE_MD_PATH}`);
console.log(`manifest=${SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH}`);
console.log(`artifact=${SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== SHOT_ASSEMBLY_ENGINE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, SHOT_ASSEMBLY_ENGINE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, SHOT_ASSEMBLY_ENGINE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, SHOT_ASSEMBLY_ENGINE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.shot_assembly_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.scene_assembly_consumed !== 'PASS' ||
  report.shot_assembly_complete !== 'PASS' ||
  report.shot_order_preserved !== 'PASS' ||
  report.shot_dependencies_valid !== 'PASS' ||
  report.shot_transition_valid !== 'PASS' ||
  report.shot_duration_valid !== 'PASS' ||
  report.generation_prompt_seed_present !== 'PASS' ||
  report.adapter_requirements_preserved !== 'PASS' ||
  report.coverage_preserved !== 'PASS' ||
  report.camera_motion_preserved !== 'PASS' ||
  report.continuity_preserved !== 'PASS' ||
  report.execution_readiness_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.shot_assembly_engine_ready !== 'PASS' ||
  report.certification_status !== SHOT_ASSEMBLY_READY_STATUS ||
  report.scene_assembly_missing !== false ||
  report.shot_assembly_failure !== false ||
  report.shot_dependency_break !== false ||
  report.shot_transition_break !== false ||
  report.shot_duration_invalid !== false ||
  report.generation_prompt_seed_missing !== false ||
  report.adapter_requirements_loss !== false ||
  report.coverage_loss !== false ||
  report.continuity_loss !== false ||
  report.execution_not_ready !== false ||
  report.traceability_loss !== false ||
  report.shot_assemblies.length !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.shot_assemblies.every((assembly) => assembly.shot_assembly_ready === 'PASS') === false ||
  report.shot_assemblies.every((assembly) => assembly.execution_readiness === 'PASS') === false
) {
  console.error(
    'Expected PASS with shot assemblies complete, order preserved, dependencies valid, and traceability intact'
  );
  process.exit(1);
}

process.exit(0);
