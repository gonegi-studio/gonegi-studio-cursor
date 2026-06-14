import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { writeMvHighPriorityItemResolutionCompletionAudit } from '../services/mvHighPriorityItemResolutionCompletionAudit.js';
import { writeMvHighPriorityItemResolutionEvidenceAudit } from '../services/mvHighPriorityItemResolutionEvidenceAudit.js';
import { writeMvHighPriorityItemResolutionExecution } from '../services/mvHighPriorityItemResolutionExecution.js';
import { writeMvHighPriorityItemResolutionProgressAudit } from '../services/mvHighPriorityItemResolutionProgressAudit.js';
import {
  EXPECTED_REMAINING_HIGH_PRIORITY_COUNT,
  EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_DIR,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_REPORT_PATH,
  PRODUCTION_READY_CERTIFIED_STATUS,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyFinalCertification,
} from '../services/mvProductionReadyFinalCertification.js';
import { writeMvProductionReadyReentryChain } from '../services/mvProductionReadyReentryChain.js';
import { PRODUCTION_READY_STATUS_PRODUCTION_READY } from '../services/mvProductionReadyGateEligibilityAuditHardening.js';
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
import { MAX_PRODUCTION_READINESS_SCORE } from '../services/mvProductionReadinessGate.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

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
writeMvProductionReadyReentryChain(projectRoot);

const report = writeMvProductionReadyFinalCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} final_certification_id=${report.final_certification_id} production_ready_certified=${report.production_ready_certified} production_ready_status=${report.production_ready_status ?? 'NONE'} production_ready_score=${report.production_ready_score} resolved_high_priority_count=${report.resolved_high_priority_count} remaining_high_priority_count=${report.remaining_high_priority_count} execution_scope=${report.execution_scope} reentry_chain_consumed=${report.reentry_chain_consumed} production_ready_certified_valid=${report.production_ready_certified_valid} production_ready_status_valid=${report.production_ready_status_valid} remaining_high_priority_count_valid=${report.remaining_high_priority_count_valid} reentry_chain_verified=${report.reentry_chain_verified} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} production_ready_certification_invalid=${report.production_ready_certification_invalid} remaining_high_priority_not_zero=${report.remaining_high_priority_not_zero} reentry_chain_missing=${report.reentry_chain_missing} mv_production_ready_final_certification_ready=${report.mv_production_ready_final_certification_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_READY_FINAL_CERTIFICATION_REPORT_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_FINAL_CERTIFICATION_PASS_VERDICT) process.exit(1);

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_FINAL_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_FINAL_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_FINAL_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.production_ready_certified !== true ||
  report.production_ready_status !== PRODUCTION_READY_STATUS_PRODUCTION_READY ||
  report.production_ready_score !== MAX_PRODUCTION_READINESS_SCORE ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.reentry_chain_consumed !== 'PASS' ||
  report.production_ready_certified_valid !== 'PASS' ||
  report.production_ready_status_valid !== 'PASS' ||
  report.remaining_high_priority_count_valid !== 'PASS' ||
  report.reentry_chain_verified !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.production_ready_certification_invalid !== false ||
  report.remaining_high_priority_not_zero !== false ||
  report.reentry_chain_missing !== false ||
  report.mv_production_ready_final_certification_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_READY_CERTIFIED_STATUS ||
  report.next_stage_approved !== true
) {
  console.error(
    'Expected PASS with PRODUCTION_READY_CERTIFIED, production_ready_certified=true, production_ready_status=PRODUCTION_READY, resolved=3, remaining=0'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH), 'utf8')
) as {
  production_ready_certified: boolean;
  production_ready_status: string;
  production_ready_score: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  final_certification_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.production_ready_certified !== true ||
  artifact.production_ready_status !== PRODUCTION_READY_STATUS_PRODUCTION_READY ||
  artifact.production_ready_score !== MAX_PRODUCTION_READINESS_SCORE ||
  artifact.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.final_certification_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected production ready final certification output');
  process.exit(1);
}

process.exit(0);
