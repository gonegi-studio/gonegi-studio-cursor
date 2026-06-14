import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH,
} from '../services/mvHighPriorityResolutionExecutionCertificationGateHardening.js';
import {
  MV_PRODUCTION_READY_GATE_PASS_VERDICT,
  MV_PRODUCTION_READY_GATE_EVALUATED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  writeMvProductionReadyGate,
} from '../services/mvProductionReadyGate.js';

const EXPECTED_GATE_BLOCKER_COUNT = 3;
const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const hardeningReportPath = path.join(
  projectRoot,
  MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_REPORT_PATH
);
if (!fs.existsSync(hardeningReportPath)) {
  console.error('PRECHECK FAIL: Missing DS-022B gate hardening report');
  process.exit(1);
}

const hardeningReport = JSON.parse(fs.readFileSync(hardeningReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  next_stage_ready: string;
};

if (
  hardeningReport.final_verdict !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENING_PASS_VERDICT ||
  hardeningReport.certification_status !== MV_HIGH_PRIORITY_RESOLUTION_EXECUTION_CERTIFICATION_GATE_HARDENED_STATUS ||
  hardeningReport.next_stage_ready !== 'PASS'
) {
  console.error('PRECHECK FAIL: DS-022B gate hardening must pass before DS-023 production ready gate');
  process.exit(1);
}

const report = writeMvProductionReadyGate(projectRoot);
console.log(report.final_verdict);

if (
  report.final_verdict !== MV_PRODUCTION_READY_GATE_PASS_VERDICT ||
  report.gate_blocker_count !== EXPECTED_GATE_BLOCKER_COUNT ||
  report.production_ready_gate_eligible !== false ||
  report.gate_open !== false ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.certification_status !== MV_PRODUCTION_READY_GATE_EVALUATED_STATUS
) {
  console.error('Expected PASS with gate_blocker_count=3, gate closed, and DS_023B_ENTRY gate');
  process.exit(1);
}

process.exit(0);
