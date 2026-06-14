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
  PRODUCTION_ENGINE_FOUNDATION_DIR,
  PRODUCTION_ENGINE_FOUNDATION_EXPORT_DIR,
  PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH,
  PRODUCTION_ENGINE_FOUNDATION_MD_PATH,
  PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT,
  PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE,
  PRODUCTION_MEMORY_BINDING_COUNT,
  PRODUCTION_PIPELINE_STAGE_COUNT,
  writeMovieAnalysisProductionEngineFoundation,
} from '../services/movieAnalysisProductionEngineFoundation.js';

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

if (bridgeReport.final_verdict !== LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH} must be ${LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT}`
  );
  process.exit(1);
}

if (
  bridgeReport.final_output_status !== LEVEL3_ENTRY_APPROVED_STATUS ||
  bridgeReport.level3_entry_ready !== true
) {
  console.error(
    `PRECHECK FAIL: ${LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH} must have ${LEVEL3_ENTRY_APPROVED_STATUS} and level3_entry_ready=true`
  );
  process.exit(1);
}

const report = writeMovieAnalysisProductionEngineFoundation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} production_blueprint_generation=${report.production_blueprint_generation} production_dataset_consumption=${report.production_dataset_consumption} character_memory_binding=${report.character_memory_binding} location_memory_binding=${report.location_memory_binding} story_memory_binding=${report.story_memory_binding} cross_episode_memory_binding=${report.cross_episode_memory_binding} traceability_preserved=${report.traceability_preserved} dataset_consumption_failure=${report.dataset_consumption_failure} memory_binding_failure=${report.memory_binding_failure} production_blueprint_failure=${report.production_blueprint_failure} traceability_loss=${report.traceability_loss} production_engine_break=${report.production_engine_break} production_engine_foundation_ready=${report.production_engine_foundation_ready}`
);
for (const entry of report.production_blueprint_entries) {
  console.log(
    `  blueprint ${entry.source_video_id}: ready=${entry.blueprint_ready} id=${entry.generation_blueprint_id}`
  );
}
for (const audit of report.memory_binding_audits) {
  console.log(`  binding ${audit.binding_id}: ready=${audit.binding_ready}`);
}
console.log(`report=${PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH}`);
console.log(`markdown=${PRODUCTION_ENGINE_FOUNDATION_MD_PATH}`);
console.log(`manifest=${PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH}`);
console.log(`artifact=${PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_FOUNDATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_FOUNDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.production_pipeline_stage_count !== PRODUCTION_PIPELINE_STAGE_COUNT ||
  report.production_memory_binding_count !== PRODUCTION_MEMORY_BINDING_COUNT ||
  report.production_blueprint_generation !== 'PASS' ||
  report.production_dataset_consumption !== 'PASS' ||
  report.character_memory_binding !== 'PASS' ||
  report.location_memory_binding !== 'PASS' ||
  report.story_memory_binding !== 'PASS' ||
  report.cross_episode_memory_binding !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.production_engine_foundation_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE ||
  report.dataset_consumption_failure !== false ||
  report.memory_binding_failure !== false ||
  report.production_blueprint_failure !== false ||
  report.traceability_loss !== false ||
  report.production_engine_break !== false ||
  report.production_blueprint_entries.length !== EXPECTED_SOURCE_COUNT ||
  report.memory_binding_audits.length !== PRODUCTION_MEMORY_BINDING_COUNT ||
  report.production_blueprint_entries.every((entry) => entry.blueprint_ready === 'PASS') === false ||
  report.memory_binding_audits.every((audit) => audit.binding_ready === 'PASS') === false
) {
  console.error(
    'Expected PASS with production blueprint generation, dataset consumption, memory bindings, and traceability preserved'
  );
  process.exit(1);
}

process.exit(0);
