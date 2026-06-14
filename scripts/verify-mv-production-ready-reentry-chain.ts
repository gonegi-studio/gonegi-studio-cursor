import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeMvHighPriorityItemResolutionCompletionAudit } from '../services/mvHighPriorityItemResolutionCompletionAudit.js';
import { writeMvHighPriorityItemResolutionEvidenceAudit } from '../services/mvHighPriorityItemResolutionEvidenceAudit.js';
import { writeMvHighPriorityItemResolutionExecution } from '../services/mvHighPriorityItemResolutionExecution.js';
import { writeMvHighPriorityItemResolutionProgressAudit } from '../services/mvHighPriorityItemResolutionProgressAudit.js';
import {
  DS_023_REENTRY_COMPLETED_STATUS,
  MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT,
  MV_PRODUCTION_READY_REENTRY_CHAIN_REPORT_PATH,
  PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS,
  PRODUCTION_READY_REEVALUATION_COMPLETED_STATUS,
  writeMvProductionReadyReentryChain,
} from '../services/mvProductionReadyReentryChain.js';
import { writeMvProductionReadyCertificationBlockedState } from '../services/mvProductionReadyCertificationBlockedState.js';
import { writeMvProductionReadyGate } from '../services/mvProductionReadyGate.js';
import { writeMvProductionReadyGateEligibilityAuditHardening } from '../services/mvProductionReadyGateEligibilityAuditHardening.js';
import { writeMvProductionReadyGateReentryHardening } from '../services/mvProductionReadyGateReentryHardening.js';
import { writeMvProductionReadyGateStateAuditHardening } from '../services/mvProductionReadyGateStateAuditHardening.js';
import { writeMvProductionReadyReentryCompletionGate } from '../services/mvProductionReadyReentryCompletionGate.js';
import { writeMvProductionReadyReentryFinalReadiness } from '../services/mvProductionReadyReentryFinalReadiness.js';
import { writeMvProductionReadyReentryProgressAudit } from '../services/mvProductionReadyReentryProgressAudit.js';
import { writeMvProductionReadyReentryTerminationGate } from '../services/mvProductionReadyReentryTerminationGate.js';
import { writeMvProductionReadyReentryTracking } from '../services/mvProductionReadyReentryTracking.js';
import { NEXT_REENTRY_GATE_LABEL } from '../services/mvProductionReadyReentryTracking.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

writeMvProductionReadyGate(projectRoot);
writeMvProductionReadyGateReentryHardening(projectRoot);
writeMvProductionReadyGateEligibilityAuditHardening(projectRoot);
writeMvProductionReadyGateStateAuditHardening(projectRoot);
writeMvProductionReadyCertificationBlockedState(projectRoot);
writeMvProductionReadyReentryTracking(projectRoot);
writeMvProductionReadyReentryCompletionGate(projectRoot);
writeMvProductionReadyReentryProgressAudit(projectRoot);
writeMvProductionReadyReentryFinalReadiness(projectRoot);
writeMvProductionReadyReentryTerminationGate(projectRoot);
writeMvHighPriorityItemResolutionExecution(projectRoot);
writeMvHighPriorityItemResolutionProgressAudit(projectRoot);
writeMvHighPriorityItemResolutionCompletionAudit(projectRoot);
writeMvHighPriorityItemResolutionEvidenceAudit(projectRoot);

const report = writeMvProductionReadyReentryChain(projectRoot);

console.log(report.final_verdict);
console.log(
  `ds_023_reentry_status=${report.ds_023_reentry_status ?? 'NONE'} production_ready_reevaluation_status=${report.production_ready_reevaluation_status ?? 'NONE'} production_ready_certification_status=${report.production_ready_certification_status ?? 'NONE'} resolved_high_priority_count=${report.resolved_high_priority_count} remaining_high_priority_count=${report.remaining_high_priority_count} reentry_ready=${report.reentry_ready} reentry_gate_label=${report.reentry_gate_label} evidence_audit_consumed=${report.evidence_audit_consumed} ds_023_reentry_valid=${report.ds_023_reentry_valid} production_ready_reevaluation_valid=${report.production_ready_reevaluation_valid} production_ready_certification_valid=${report.production_ready_certification_valid} mv_production_ready_reentry_chain_ready=${report.mv_production_ready_reentry_chain_ready}`
);
console.log(`report=${MV_PRODUCTION_READY_REENTRY_CHAIN_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH}`);

if (report.final_verdict !== MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT) process.exit(1);

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH), 'utf8')
) as {
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  reentry_ready: boolean;
  ds_023_reentry_status: string | null;
  production_ready_reevaluation_status: string | null;
  production_ready_certification_status: string | null;
  reentry_gate_label: string;
  production_ready_entry_allowed: boolean;
  reentry_chain_complete: boolean;
};

if (
  artifact.resolved_high_priority_count !== 3 ||
  artifact.remaining_high_priority_count !== 0 ||
  artifact.reentry_ready !== true ||
  artifact.ds_023_reentry_status !== DS_023_REENTRY_COMPLETED_STATUS ||
  artifact.production_ready_reevaluation_status !== PRODUCTION_READY_REEVALUATION_COMPLETED_STATUS ||
  artifact.production_ready_certification_status !== PRODUCTION_READY_CERTIFICATION_ENTRY_READY_STATUS ||
  artifact.reentry_gate_label !== NEXT_REENTRY_GATE_LABEL ||
  artifact.production_ready_entry_allowed !== true ||
  artifact.reentry_chain_complete !== true
) {
  console.error('Reentry chain artifact does not match expected DS_023_REENTRY through certification entry state');
  process.exit(1);
}

process.exit(0);
