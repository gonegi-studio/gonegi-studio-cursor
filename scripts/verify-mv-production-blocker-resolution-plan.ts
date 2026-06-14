import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH,
  MV_PRODUCTION_BLOCKER_AUDITED_STATUS,
} from '../services/mvProductionBlockerAudit.js';
import {
  ESTIMATED_RESOLUTION_PHASES,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_DIR,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_EXPORT_DIR,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MD_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS,
  MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH,
  NEXT_STAGE_GATE_LABEL,
  RESOLUTION_PRIORITY_HIGH,
  RESOLUTION_PRIORITY_LOW,
  RESOLUTION_PRIORITY_MEDIUM,
  RESOLUTION_PRIORITIES,
  SAFE_CREATE_POLICY,
  writeMvProductionBlockerResolutionPlan,
} from '../services/mvProductionBlockerResolutionPlan.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_WARNING_BLOCKER_COUNT = 6;
const EXPECTED_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_MEDIUM_PRIORITY_COUNT = 2;
const EXPECTED_LOW_PRIORITY_COUNT = 1;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const auditReportPath = path.join(projectRoot, MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH);
const auditArtifactPath = path.join(projectRoot, MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH);

if (!fs.existsSync(auditReportPath) || !fs.existsSync(auditArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production blocker audit report or artifact');
  process.exit(1);
}

const auditReport = JSON.parse(fs.readFileSync(auditReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  critical_blocker_count: number;
  warning_blocker_count: number;
  next_stage_ready: string;
  mv_production_blocker_audit_ready: string;
  blocker_resolution_plan_ready: string;
};

if (
  auditReport.final_verdict !== MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT ||
  auditReport.certification_status !== MV_PRODUCTION_BLOCKER_AUDITED_STATUS ||
  auditReport.critical_blocker_count !== 0 ||
  auditReport.warning_blocker_count !== EXPECTED_WARNING_BLOCKER_COUNT ||
  auditReport.next_stage_ready !== 'PASS' ||
  auditReport.mv_production_blocker_audit_ready !== 'PASS' ||
  auditReport.blocker_resolution_plan_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_BLOCKER_AUDIT_REPORT_PATH} must be ${MV_PRODUCTION_BLOCKER_AUDIT_PASS_VERDICT} with ${MV_PRODUCTION_BLOCKER_AUDITED_STATUS}`
  );
  process.exit(1);
}

const report = writeMvProductionBlockerResolutionPlan(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} resolution_plan_id=${report.resolution_plan_id} source_blocker_audit_ref=${report.source_blocker_audit_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} warning_blocker_count=${report.warning_blocker_count} resolution_item_count=${report.blocker_resolution_items.length} estimated_resolution_phases=${report.estimated_resolution_phases} resolution_priority_high=${report.resolution_priority.HIGH} resolution_priority_medium=${report.resolution_priority.MEDIUM} resolution_priority_low=${report.resolution_priority.LOW} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} blocker_audit_consumed=${report.blocker_audit_consumed} blocker_resolution_items_valid=${report.blocker_resolution_items_valid} resolution_priority_valid=${report.resolution_priority_valid} estimated_resolution_phases_valid=${report.estimated_resolution_phases_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} blocker_resolution_items_missing=${report.blocker_resolution_items_missing} resolution_priority_missing=${report.resolution_priority_missing} estimated_resolution_phases_missing=${report.estimated_resolution_phases_missing} blocker_audit_missing=${report.blocker_audit_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_blocker_resolution_plan_ready=${report.mv_production_blocker_resolution_plan_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const item of report.blocker_resolution_items) {
  console.log(
    `  item ${item.item_id} [${item.resolution_priority}] ${item.blocker_code} phases=${item.estimated_resolution_phases}`
  );
}
console.log(`report=${MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.resolution_plan_checks.length !== 3 ||
  report.warning_blocker_count !== EXPECTED_WARNING_BLOCKER_COUNT ||
  report.blocker_resolution_items.length !== EXPECTED_WARNING_BLOCKER_COUNT ||
  report.estimated_resolution_phases !== ESTIMATED_RESOLUTION_PHASES ||
  report.resolution_priority.HIGH !== EXPECTED_HIGH_PRIORITY_COUNT ||
  report.resolution_priority.MEDIUM !== EXPECTED_MEDIUM_PRIORITY_COUNT ||
  report.resolution_priority.LOW !== EXPECTED_LOW_PRIORITY_COUNT ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.blocker_audit_consumed !== 'PASS' ||
  report.blocker_resolution_items_valid !== 'PASS' ||
  report.resolution_priority_valid !== 'PASS' ||
  report.estimated_resolution_phases_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.blocker_resolution_items_missing !== false ||
  report.resolution_priority_missing !== false ||
  report.estimated_resolution_phases_missing !== false ||
  report.blocker_audit_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_blocker_resolution_plan_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_READY_STATUS ||
  report.next_stage_approved !== true ||
  report.resolution_plan_checks.every((check) => check.status === 'PASS') === false ||
  report.blocker_resolution_items.every(
    (item) =>
      RESOLUTION_PRIORITIES.includes(item.resolution_priority) &&
      item.estimated_resolution_phases === ESTIMATED_RESOLUTION_PHASES &&
      item.plan_ready === true
  ) === false
) {
  console.error(
    'Expected PASS with 6 resolution items, priority classification, DS_017~DS_018 phases, and DS_018_ENTRY gate'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_PLAN_ARTIFACT_PATH), 'utf8')
) as {
  source_blocker_audit_ref: string;
  blocker_resolution_items: unknown[];
  resolution_priority: { HIGH: number; MEDIUM: number; LOW: number };
  estimated_resolution_phases: string;
  next_stage_gate_label: string;
  resolution_plan_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.source_blocker_audit_ref !== MV_PRODUCTION_BLOCKER_AUDIT_ARTIFACT_PATH ||
  artifact.blocker_resolution_items.length !== EXPECTED_WARNING_BLOCKER_COUNT ||
  artifact.resolution_priority.HIGH !== EXPECTED_HIGH_PRIORITY_COUNT ||
  artifact.resolution_priority.MEDIUM !== EXPECTED_MEDIUM_PRIORITY_COUNT ||
  artifact.resolution_priority.LOW !== EXPECTED_LOW_PRIORITY_COUNT ||
  artifact.estimated_resolution_phases !== ESTIMATED_RESOLUTION_PHASES ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.resolution_plan_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected resolution plan output');
  process.exit(1);
}

process.exit(0);
