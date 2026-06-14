import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS,
} from '../services/mvHighPriorityResolutionAuditHardening.js';
import {
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_EXPORT_DIR,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MANIFEST_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_MD_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_REPORT_PATH,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  SAFE_CREATE_POLICY,
  writeMvHighPriorityResolutionExecutionCertification,
} from '../services/mvHighPriorityResolutionExecutionCertification.js';
import { RESOLUTION_STATUS_OPEN } from '../services/mvHighPriorityResolutionAudit.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT = 3;
const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 0;
const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 3;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const hardeningReportPath = path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_REPORT_PATH);
const hardeningArtifactPath = path.join(projectRoot, MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_ARTIFACT_PATH);
if (!fs.existsSync(hardeningReportPath) || !fs.existsSync(hardeningArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV high priority resolution audit hardening report or artifact');
  process.exit(1);
}

const hardeningReport = JSON.parse(fs.readFileSync(hardeningReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  next_stage_ready: string;
  mv_high_priority_resolution_audit_hardening_ready: string;
};

if (
  hardeningReport.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENING_PASS_VERDICT ||
  hardeningReport.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_AUDIT_HARDENED_STATUS ||
  hardeningReport.next_stage_ready !== 'PASS' ||
  hardeningReport.mv_high_priority_resolution_audit_hardening_ready !== 'PASS'
) {
  console.error('PRECHECK FAIL: DS-021A hardening must pass before DS-022 execution certification');
  process.exit(1);
}

const report = writeMvHighPriorityResolutionExecutionCertification(projectRoot);
console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} certification_id=${report.certification_id} source_hardening_ref=${report.source_hardening_ref} high_priority_resolution_target_met=${report.high_priority_resolution_target_met} remaining_high_priority_count=${report.remaining_high_priority_count} next_stage_gate_label=${report.next_stage_gate_label} hardening_consumed=${report.hardening_consumed} next_stage_ready=${report.next_stage_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);

if (report.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_PASS_VERDICT) process.exit(1);
if (
  report.high_priority_resolution_target_met !== false ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.high_priority_resolution_count !== EXPECTED_HIGH_PRIORITY_RESOLUTION_COUNT ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFIED_STATUS ||
  Object.values(report.resolution_status_by_item).every((status) => status === RESOLUTION_STATUS_OPEN) === false
) {
  console.error('Expected PASS with target_met=false, 3 OPEN items, and DS_022B_ENTRY gate');
  process.exit(1);
}

process.exit(0);
