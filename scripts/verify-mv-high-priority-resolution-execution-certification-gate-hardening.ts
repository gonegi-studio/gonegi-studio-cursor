import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS,
  writeMvHighPriorityResolutionExecutionCertification,
} from '../services/mvHighPriorityResolutionExecutionCertification.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_EXPORT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MD_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  SAFE_CREATE_POLICY,
  writeMvHighPriorityResolutionExecutionCertificationGateHardening,
} from '../services/mvHighPriorityResolutionExecutionCertificationGateHardening.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 0;
const EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT = 3;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

writeMvHighPriorityResolutionExecutionCertification(projectRoot);

const executionReportPath = path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH);
if (!fs.existsSync(executionReportPath)) {
  console.error('PRECHECK FAIL: Missing DS-022 execution certification report');
  process.exit(1);
}

const executionReport = JSON.parse(fs.readFileSync(executionReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  next_stage_ready: string;
  mv_high_priority_resolution_execution_certification_ready: string;
};

if (
  executionReport.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT ||
  executionReport.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS ||
  executionReport.next_stage_ready !== 'PASS' ||
  executionReport.mv_high_priority_resolution_execution_certification_ready !== 'PASS'
) {
  console.error('PRECHECK FAIL: DS-022 execution certification must pass before DS-022B gate hardening');
  process.exit(1);
}

const report = writeMvHighPriorityResolutionExecutionCertificationGateHardening(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} gate_hardening_id=${report.gate_hardening_id} source_execution_certification_ref=${report.source_execution_certification_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} high_priority_resolution_target_met=${report.high_priority_resolution_target_met} production_ready_gate_eligible=${report.production_ready_gate_eligible} remaining_high_priority_count=${report.remaining_high_priority_count} resolved_high_priority_count=${report.resolved_high_priority_count} high_priority_resolution_count=${report.high_priority_resolution_count} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} execution_certification_consumed=${report.execution_certification_consumed} high_priority_resolution_target_met_valid=${report.high_priority_resolution_target_met_valid} production_ready_gate_eligible_valid=${report.production_ready_gate_eligible_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} high_priority_resolution_target_not_met=${report.high_priority_resolution_target_not_met} production_ready_gate_not_eligible=${report.production_ready_gate_not_eligible} execution_certification_missing=${report.execution_certification_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_high_priority_resolution_execution_certification_gate_hardening_ready=${report.mv_high_priority_resolution_execution_certification_gate_hardening_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH}`);
console.log(`artifact=${MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.gate_hardening_checks.length !== 2 ||
  report.high_priority_resolution_target_met !== false ||
  report.production_ready_gate_eligible !== false ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.high_priority_resolution_count !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.execution_certification_consumed !== 'PASS' ||
  report.high_priority_resolution_target_met_valid !== 'PASS' ||
  report.production_ready_gate_eligible_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.high_priority_resolution_target_not_met !== false ||
  report.production_ready_gate_not_eligible !== false ||
  report.execution_certification_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_high_priority_resolution_execution_certification_gate_hardening_ready !== 'PASS' ||
  report.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS ||
  report.next_stage_approved !== true ||
  report.gate_hardening_checks.every((check) => check.status === 'PASS') === false
) {
  console.error(
    'Expected PASS with target_met=false, gate_eligible=false, correct gate eligibility validation, and DS_023_ENTRY gate'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_ARTIFACT_PATH), 'utf8')
) as {
  source_execution_certification_ref: string;
  high_priority_resolution_target_met: boolean;
  production_ready_gate_eligible: boolean;
  target_readiness_tier: string;
  next_stage_gate_label: string;
  gate_hardening_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.source_execution_certification_ref !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH ||
  artifact.high_priority_resolution_target_met !== false ||
  artifact.production_ready_gate_eligible !== false ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.gate_hardening_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected gate hardening output');
  process.exit(1);
}

process.exit(0);
