import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  GENERATION_PLANNING_ENGINE_DIR,
  GENERATION_PLANNING_ENGINE_EXPORT_DIR,
  GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
  GENERATION_PLANNING_ENGINE_MD_PATH,
  GENERATION_PLANNING_ENGINE_PASS_VERDICT,
  GENERATION_PLANNING_ENGINE_REPORT_PATH,
  GENERATION_PLANNING_READY_STATUS,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  writeMovieAnalysisGenerationPlanningEngine,
} from '../services/movieAnalysisGenerationPlanningEngine.js';
import {
  SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
  SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  SHOT_ASSEMBLY_READY_STATUS,
} from '../services/movieAnalysisShotAssemblyEngine.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const shotAssemblyReportPath = path.join(projectRoot, SHOT_ASSEMBLY_ENGINE_REPORT_PATH);
const shotAssemblyArtifactPath = path.join(projectRoot, SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH);

if (!fs.existsSync(shotAssemblyReportPath) || !fs.existsSync(shotAssemblyArtifactPath)) {
  console.error('PRECHECK FAIL: Missing shot assembly engine report or artifact');
  process.exit(1);
}

const shotAssemblyReport = JSON.parse(fs.readFileSync(shotAssemblyReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (
  shotAssemblyReport.final_verdict !== SHOT_ASSEMBLY_ENGINE_PASS_VERDICT ||
  shotAssemblyReport.certification_status !== SHOT_ASSEMBLY_READY_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${SHOT_ASSEMBLY_ENGINE_REPORT_PATH} must be ${SHOT_ASSEMBLY_ENGINE_PASS_VERDICT} with ${SHOT_ASSEMBLY_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMovieAnalysisGenerationPlanningEngine(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} shot_assembly_consumed=${report.shot_assembly_consumed} generation_plan_complete=${report.generation_plan_complete} prompt_generation_ready=${report.prompt_generation_ready} negative_prompt_plan_ready=${report.negative_prompt_plan_ready} adapter_binding_ready=${report.adapter_binding_ready} consistency_plan_ready=${report.consistency_plan_ready} quality_gate_plan_ready=${report.quality_gate_plan_ready} execution_readiness_valid=${report.execution_readiness_valid} traceability_preserved=${report.traceability_preserved} shot_assembly_missing=${report.shot_assembly_missing} generation_plan_failure=${report.generation_plan_failure} prompt_seed_missing=${report.prompt_seed_missing} negative_prompt_plan_missing=${report.negative_prompt_plan_missing} adapter_binding_loss=${report.adapter_binding_loss} consistency_plan_missing=${report.consistency_plan_missing} quality_gate_plan_missing=${report.quality_gate_plan_missing} execution_not_ready=${report.execution_not_ready} traceability_loss=${report.traceability_loss} generation_planning_engine_ready=${report.generation_planning_engine_ready}`
);
for (const plan of report.generation_plans) {
  console.log(
    `  plan ${plan.generation_plan_id}: ready=${plan.generation_plan_ready} units=${plan.generation_units.length}`
  );
}
console.log(`report=${GENERATION_PLANNING_ENGINE_REPORT_PATH}`);
console.log(`markdown=${GENERATION_PLANNING_ENGINE_MD_PATH}`);
console.log(`manifest=${GENERATION_PLANNING_ENGINE_MANIFEST_PATH}`);
console.log(`artifact=${GENERATION_PLANNING_ENGINE_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== GENERATION_PLANNING_ENGINE_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, GENERATION_PLANNING_ENGINE_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, GENERATION_PLANNING_ENGINE_DIR)) ||
  !fs.existsSync(path.join(projectRoot, GENERATION_PLANNING_ENGINE_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, GENERATION_PLANNING_ENGINE_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, GENERATION_PLANNING_ENGINE_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.generation_plan_count !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.shot_assembly_consumed !== 'PASS' ||
  report.generation_plan_complete !== 'PASS' ||
  report.prompt_generation_ready !== 'PASS' ||
  report.negative_prompt_plan_ready !== 'PASS' ||
  report.adapter_binding_ready !== 'PASS' ||
  report.consistency_plan_ready !== 'PASS' ||
  report.quality_gate_plan_ready !== 'PASS' ||
  report.execution_readiness_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.generation_planning_engine_ready !== 'PASS' ||
  report.certification_status !== GENERATION_PLANNING_READY_STATUS ||
  report.shot_assembly_missing !== false ||
  report.generation_plan_failure !== false ||
  report.prompt_seed_missing !== false ||
  report.negative_prompt_plan_missing !== false ||
  report.adapter_binding_loss !== false ||
  report.consistency_plan_missing !== false ||
  report.quality_gate_plan_missing !== false ||
  report.execution_not_ready !== false ||
  report.traceability_loss !== false ||
  report.generation_plans.length !== PRODUCTION_BLUEPRINT_TYPE_COUNT ||
  report.generation_plans.every((plan) => plan.generation_plan_ready === 'PASS') === false ||
  report.generation_plans.every((plan) => plan.execution_readiness === 'PASS') === false
) {
  console.error(
    'Expected PASS with generation plans complete, prompt/adapter/consistency/quality gates ready, and traceability intact'
  );
  process.exit(1);
}

process.exit(0);
