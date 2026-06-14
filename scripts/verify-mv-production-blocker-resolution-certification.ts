import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  CERTIFICATION_RESOLUTION_PRIORITIES,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_DIR,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MD_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH,
  NEXT_STAGE_GATE_LABEL,
  RESOLUTION_PRIORITY_HIGH,
  RESOLUTION_PRIORITY_LOW,
  RESOLUTION_PRIORITY_MEDIUM,
  SAFE_CREATE_POLICY,
  writeMvProductionBlockerResolutionCertification,
} from '../services/mvProductionBlockerResolutionCertification.js';
import {
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS,
} from '../services/mvProductionBlockerResolutionPlan.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_PLANNED_RESOLUTION_COUNT = 6;
const EXPECTED_REMAINING_BLOCKER_COUNT = 6;
const EXPECTED_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_MEDIUM_PRIORITY_COUNT = 2;
const EXPECTED_LOW_PRIORITY_COUNT = 1;
const EXPECTED_CRITICAL_PRIORITY_COUNT = 0;
const EXPECTED_ESTIMATED_RESOLUTION_STEPS = 11;
const EXPECTED_PRODUCTION_READY_REQUIREMENTS_COUNT = 6;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const planReportPath = path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH);
const planArtifactPath = path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH);

if (!fs.existsSync(planReportPath) || !fs.existsSync(planArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production blocker resolution plan report or artifact');
  process.exit(1);
}

const planReport = JSON.parse(fs.readFileSync(planReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  warning_blocker_count: number;
  next_stage_ready: string;
  mv_production_blocker_resolution_plan_ready: string;
};

if (
  planReport.final_verdict !== MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT ||
  planReport.certification_status !== MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS ||
  planReport.warning_blocker_count !== EXPECTED_PLANNED_RESOLUTION_COUNT ||
  planReport.next_stage_ready !== 'PASS' ||
  planReport.mv_production_blocker_resolution_plan_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH} must be ${MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT} with ${MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS}`
  );
  process.exit(1);
}

const report = writeMvProductionBlockerResolutionCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} certification_id=${report.certification_id} source_resolution_plan_ref=${report.source_resolution_plan_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} planned_resolution_count=${report.planned_resolution_count} remaining_blocker_count=${report.remaining_blocker_count} target_readiness_tier=${report.target_readiness_tier} production_ready_requirements_count=${report.production_ready_requirements.length} estimated_resolution_steps=${report.estimated_resolution_steps} resolution_priority_critical=${report.resolution_priority.CRITICAL} resolution_priority_high=${report.resolution_priority.HIGH} resolution_priority_medium=${report.resolution_priority.MEDIUM} resolution_priority_low=${report.resolution_priority.LOW} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} resolution_plan_consumed=${report.resolution_plan_consumed} planned_resolution_count_valid=${report.planned_resolution_count_valid} remaining_blocker_count_valid=${report.remaining_blocker_count_valid} target_readiness_tier_valid=${report.target_readiness_tier_valid} production_ready_requirements_valid=${report.production_ready_requirements_valid} blocker_resolution_items_valid=${report.blocker_resolution_items_valid} resolution_priority_valid=${report.resolution_priority_valid} resolution_success_criteria_valid=${report.resolution_success_criteria_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} blocker_resolution_items_missing=${report.blocker_resolution_items_missing} resolution_priority_missing=${report.resolution_priority_missing} resolution_success_criteria_missing=${report.resolution_success_criteria_missing} planned_resolution_count_invalid=${report.planned_resolution_count_invalid} target_readiness_tier_invalid=${report.target_readiness_tier_invalid} production_ready_requirements_missing=${report.production_ready_requirements_missing} resolution_plan_missing=${report.resolution_plan_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_blocker_resolution_certification_ready=${report.mv_production_blocker_resolution_certification_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const item of report.blocker_resolution_items) {
  console.log(
    `  item ${item.item_id} [${item.resolution_priority}] steps=${item.estimated_resolution_steps} certified=${item.certification_ready}`
  );
}
console.log(`report=${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.certification_checks.length !== 7 ||
  report.planned_resolution_count !== EXPECTED_PLANNED_RESOLUTION_COUNT ||
  report.remaining_blocker_count !== EXPECTED_REMAINING_BLOCKER_COUNT ||
  report.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  report.production_ready_requirements.length !== EXPECTED_PRODUCTION_READY_REQUIREMENTS_COUNT ||
  report.estimated_resolution_steps !== EXPECTED_ESTIMATED_RESOLUTION_STEPS ||
  report.resolution_priority.CRITICAL !== EXPECTED_CRITICAL_PRIORITY_COUNT ||
  report.resolution_priority.HIGH !== EXPECTED_HIGH_PRIORITY_COUNT ||
  report.resolution_priority.MEDIUM !== EXPECTED_MEDIUM_PRIORITY_COUNT ||
  report.resolution_priority.LOW !== EXPECTED_LOW_PRIORITY_COUNT ||
  report.blocker_resolution_items.length !== EXPECTED_PLANNED_RESOLUTION_COUNT ||
  report.resolution_success_criteria.length !== EXPECTED_PLANNED_RESOLUTION_COUNT ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.resolution_plan_consumed !== 'PASS' ||
  report.planned_resolution_count_valid !== 'PASS' ||
  report.remaining_blocker_count_valid !== 'PASS' ||
  report.target_readiness_tier_valid !== 'PASS' ||
  report.production_ready_requirements_valid !== 'PASS' ||
  report.blocker_resolution_items_valid !== 'PASS' ||
  report.resolution_priority_valid !== 'PASS' ||
  report.resolution_success_criteria_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.blocker_resolution_items_missing !== false ||
  report.resolution_priority_missing !== false ||
  report.resolution_success_criteria_missing !== false ||
  report.planned_resolution_count_invalid !== false ||
  report.target_readiness_tier_invalid !== false ||
  report.production_ready_requirements_missing !== false ||
  report.resolution_plan_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_blocker_resolution_certification_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS ||
  report.next_stage_approved !== true ||
  report.certification_checks.every((check) => check.status === 'PASS') === false ||
  report.blocker_resolution_items.every(
    (item) =>
      CERTIFICATION_RESOLUTION_PRIORITIES.includes(item.resolution_priority) &&
      item.certification_ready === true &&
      item.estimated_resolution_steps > 0
  ) === false ||
  report.resolution_success_criteria.every((criteria) => criteria.measurable === true) === false
) {
  console.error(
    'Expected PASS with plan fitness certified, 6 resolutions, PRODUCTION_READY target, and DS_019_ENTRY gate'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH), 'utf8')
) as {
  source_resolution_plan_ref: string;
  planned_resolution_count: number;
  remaining_blocker_count: number;
  target_readiness_tier: string;
  estimated_resolution_steps: number;
  next_stage_gate_label: string;
  resolution_certification_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.source_resolution_plan_ref !== MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH ||
  artifact.planned_resolution_count !== EXPECTED_PLANNED_RESOLUTION_COUNT ||
  artifact.remaining_blocker_count !== EXPECTED_REMAINING_BLOCKER_COUNT ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.estimated_resolution_steps !== EXPECTED_ESTIMATED_RESOLUTION_STEPS ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.resolution_certification_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected resolution certification output');
  process.exit(1);
}

process.exit(0);
