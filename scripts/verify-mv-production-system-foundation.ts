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
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
} from '../services/movieAnalysisProductionEngineMasterCertification.js';
import {
  TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
} from '../services/movieAnalysisTestModeDryRunCertification.js';
import {
  LEVEL3_FINAL_STATUS_COMPLETE,
  TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT,
  TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS,
} from '../services/movieAnalysisTestModeExecutionFinalAudit.js';
import {
  MV_PRODUCTION_FOUNDATION_READY_STATUS,
  MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
  MV_PRODUCTION_SYSTEM_FOUNDATION_DIR,
  MV_PRODUCTION_SYSTEM_FOUNDATION_EXPORT_DIR,
  MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH,
  MV_PRODUCTION_SYSTEM_FOUNDATION_MD_PATH,
  MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT,
  MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH,
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  writeMvProductionSystemFoundation,
} from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

function loadPrecheckReport<T>(reportPath: string): T | null {
  const fullPath = path.join(projectRoot, reportPath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

const bridgeReport = loadPrecheckReport<{
  final_verdict: string;
  final_output_status: string | null;
  level3_entry_ready: boolean;
}>(LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH);
const masterCertReport = loadPrecheckReport<{
  final_verdict: string;
  certification_status: string | null;
}>(PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH);
const dryRunCertReport = loadPrecheckReport<{
  final_verdict: string;
  certification_status: string | null;
}>(TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH);
const finalAuditReport = loadPrecheckReport<{
  final_verdict: string;
  certification_status: string | null;
  level3_final_status: string | null;
}>(TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH);

if (
  !bridgeReport ||
  !masterCertReport ||
  !dryRunCertReport ||
  !finalAuditReport
) {
  console.error('PRECHECK FAIL: Missing required upstream certification reports');
  process.exit(1);
}

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

if (
  masterCertReport.final_verdict !== PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT ||
  masterCertReport.certification_status !== PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH} must be ${PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT} with ${PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

if (
  dryRunCertReport.final_verdict !== TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT ||
  dryRunCertReport.certification_status !== TEST_MODE_DRY_RUN_CERTIFIED_STATUS
) {
  console.error(
    `PRECHECK FAIL: ${TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH} must be ${TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT} with ${TEST_MODE_DRY_RUN_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

if (
  finalAuditReport.final_verdict !== TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT ||
  finalAuditReport.certification_status !== TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS ||
  finalAuditReport.level3_final_status !== LEVEL3_FINAL_STATUS_COMPLETE
) {
  console.error(
    `PRECHECK FAIL: ${TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH} must be ${TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT} with ${TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS} and ${LEVEL3_FINAL_STATUS_COMPLETE}`
  );
  process.exit(1);
}

const report = writeMvProductionSystemFoundation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} level3_final_status=${report.level3_final_status} source_count=${report.source_count} adapter_count=${report.adapter_count} mv_type_count=${report.mv_type_count} digital_studio_entry_allowed=${report.digital_studio_entry_allowed} mv_system_scope_valid=${report.mv_system_scope_valid} production_mode_blocked=${report.production_mode_blocked} mv_foundation_created=${report.mv_foundation_created} mv_archetype_registry_ready=${report.mv_archetype_registry_ready} mv_story_structure_ready=${report.mv_story_structure_ready} mv_scene_structure_ready=${report.mv_scene_structure_ready} mv_sequence_structure_ready=${report.mv_sequence_structure_ready} mv_runtime_structure_ready=${report.mv_runtime_structure_ready} mv_quality_gate_ready=${report.mv_quality_gate_ready} mv_export_ready=${report.mv_export_ready} traceability_preserved=${report.traceability_preserved} digital_studio_entry_blocked=${report.digital_studio_entry_blocked} mv_scope_invalid=${report.mv_scope_invalid} production_mode_unblocked=${report.production_mode_unblocked} mv_foundation_failure=${report.mv_foundation_failure} traceability_loss=${report.traceability_loss} mv_production_system_foundation_ready=${report.mv_production_system_foundation_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const mvType of SUPPORTED_MV_TYPES) {
  console.log(`  mv_type ${mvType}: supported=true`);
}
console.log(`report=${MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_SYSTEM_FOUNDATION_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_SYSTEM_FOUNDATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_SYSTEM_FOUNDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.mv_type_count !== MV_TYPE_COUNT ||
  report.foundation_checks.length !== 12 ||
  report.digital_studio_entry_allowed !== 'PASS' ||
  report.mv_system_scope_valid !== 'PASS' ||
  report.production_mode_blocked !== 'PASS' ||
  report.mv_foundation_created !== 'PASS' ||
  report.mv_archetype_registry_ready !== 'PASS' ||
  report.mv_story_structure_ready !== 'PASS' ||
  report.mv_scene_structure_ready !== 'PASS' ||
  report.mv_sequence_structure_ready !== 'PASS' ||
  report.mv_runtime_structure_ready !== 'PASS' ||
  report.mv_quality_gate_ready !== 'PASS' ||
  report.mv_export_ready !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.digital_studio_entry_blocked !== false ||
  report.mv_scope_invalid !== false ||
  report.production_mode_unblocked !== false ||
  report.mv_foundation_failure !== false ||
  report.mv_archetype_registry_missing !== false ||
  report.mv_story_structure_missing !== false ||
  report.mv_scene_structure_missing !== false ||
  report.mv_sequence_structure_missing !== false ||
  report.mv_runtime_structure_missing !== false ||
  report.mv_quality_gate_missing !== false ||
  report.mv_export_missing !== false ||
  report.traceability_loss !== false ||
  report.mv_production_system_foundation_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_FOUNDATION_READY_STATUS ||
  report.level3_final_status !== LEVEL3_FINAL_STATUS_COMPLETE ||
  report.foundation_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    `Expected PASS with all ${MV_TYPE_COUNT} MV types supported, foundation structures ready, and production mode blocked`
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH), 'utf8')
) as {
  mv_foundation_id: string;
  supported_mv_types: string[];
  mv_archetype_registry: { registry_ready: boolean };
  mv_story_structure: unknown[];
  mv_scene_structure: unknown[];
  mv_sequence_structure: unknown[];
  mv_runtime_structure: unknown[];
  mv_quality_gate_structure: { structure_ready: boolean };
  mv_export_structure: { structure_ready: boolean };
  mv_traceability_chain: unknown[];
  safety_flags: { image_generation: boolean; video_generation: boolean; gpu_execution: boolean };
};

if (
  artifact.mv_foundation_id.length === 0 ||
  artifact.supported_mv_types.length !== MV_TYPE_COUNT ||
  artifact.mv_archetype_registry.registry_ready !== true ||
  artifact.mv_story_structure.length !== MV_TYPE_COUNT ||
  artifact.mv_scene_structure.length !== MV_TYPE_COUNT ||
  artifact.mv_sequence_structure.length !== MV_TYPE_COUNT ||
  artifact.mv_runtime_structure.length !== MV_TYPE_COUNT ||
  artifact.mv_quality_gate_structure.structure_ready !== true ||
  artifact.mv_export_structure.structure_ready !== true ||
  artifact.mv_traceability_chain.length !== MV_TYPE_COUNT ||
  artifact.safety_flags.image_generation !== false ||
  artifact.safety_flags.video_generation !== false ||
  artifact.safety_flags.gpu_execution !== false
) {
  console.error('Artifact foundation structure validation failed');
  process.exit(1);
}

process.exit(0);
