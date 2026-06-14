import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeMvHighPriorityItemResolutionCompletionAudit } from '../services/mvHighPriorityItemResolutionCompletionAudit.js';
import { writeMvHighPriorityItemResolutionEvidenceAudit } from '../services/mvHighPriorityItemResolutionEvidenceAudit.js';
import { writeMvHighPriorityItemResolutionExecution } from '../services/mvHighPriorityItemResolutionExecution.js';
import { writeMvHighPriorityItemResolutionProgressAudit } from '../services/mvHighPriorityItemResolutionProgressAudit.js';
import {
  FROZEN_TERMINAL_EXPORT_PATHS,
  MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PASS_VERDICT,
  MV_PRODUCTION_READY_BASELINE_SNAPSHOT_REPORT_PATH,
  MV_PRODUCTION_READY_CURRENT_STATE_PATH,
  MV_PRODUCTION_READY_HANDOFF_PATH,
  PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH,
  PRODUCTION_READY_BASELINE_SNAPSHOT_PATH,
  PRODUCTION_READY_BASELINE_SNAPSHOT_STATUS,
  writeMvProductionReadyBaselineSnapshot,
} from '../services/mvProductionReadyBaselineSnapshot.js';
import { writeMvProductionReadyFinalCertification } from '../services/mvProductionReadyFinalCertification.js';
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
writeMvProductionReadyFinalCertification(projectRoot);

const report = writeMvProductionReadyBaselineSnapshot(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} snapshot_id=${report.snapshot_id} production_ready_certified=${report.production_ready_certified} production_ready_status=${report.production_ready_status ?? 'NONE'} frozen_export_count=${report.frozen_export_count} manifest_hash_recorded=${report.manifest_hash_recorded} frozen_exports_verified=${report.frozen_exports_verified} handoff_updated=${report.handoff_updated} current_state_updated=${report.current_state_updated} git_diff_checked=${report.git_diff_checked} mv_production_ready_baseline_snapshot_ready=${report.mv_production_ready_baseline_snapshot_ready}`
);
if (report.git_diff_summary) {
  console.log(
    `git_diff changed_files=${report.git_diff_summary.changed_files.length} frozen_export_changes=${report.git_diff_summary.frozen_export_changes.length} baseline_write_changes=${report.git_diff_summary.baseline_write_changes.length} unexpected_changes=${report.git_diff_summary.unexpected_changes.length}`
  );
}
console.log(`snapshot=${PRODUCTION_READY_BASELINE_SNAPSHOT_PATH}`);
console.log(`manifest=${PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH}`);
console.log(`handoff=${MV_PRODUCTION_READY_HANDOFF_PATH}`);
console.log(`current_state=${MV_PRODUCTION_READY_CURRENT_STATE_PATH}`);
console.log(`report=${MV_PRODUCTION_READY_BASELINE_SNAPSHOT_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PASS_VERDICT) process.exit(1);

const snapshot = JSON.parse(
  fs.readFileSync(path.join(projectRoot, PRODUCTION_READY_BASELINE_SNAPSHOT_PATH), 'utf8')
) as {
  production_ready_certified: boolean;
  production_ready_status: string;
  production_ready_score: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  no_new_ds_phase_allowed: boolean;
  rehardening_blocked: boolean;
  file_hashes: Array<{ relative_path: string; exists: boolean }>;
};

const manifest = JSON.parse(
  fs.readFileSync(path.join(projectRoot, PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH), 'utf8')
) as {
  frozen_export_count: number;
  aggregate_manifest_hash: string;
  file_hashes: Record<string, string>;
};

const handoff = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_HANDOFF_PATH), 'utf8')
) as { handoff_status: string; rehardening_blocked: boolean };

const currentState = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_CURRENT_STATE_PATH), 'utf8')
) as {
  production_ready_certified: boolean;
  baseline_snapshot_frozen: boolean;
  no_new_ds_phase_allowed: boolean;
  rehardening_blocked: boolean;
};

if (
  snapshot.production_ready_certified !== true ||
  snapshot.production_ready_status !== PRODUCTION_READY_STATUS_PRODUCTION_READY ||
  snapshot.production_ready_score !== MAX_PRODUCTION_READINESS_SCORE ||
  snapshot.resolved_high_priority_count !== 3 ||
  snapshot.remaining_high_priority_count !== 0 ||
  snapshot.no_new_ds_phase_allowed !== true ||
  snapshot.rehardening_blocked !== true ||
  snapshot.file_hashes.length !== FROZEN_TERMINAL_EXPORT_PATHS.length ||
  snapshot.file_hashes.every((entry) => entry.exists) === false ||
  manifest.frozen_export_count !== FROZEN_TERMINAL_EXPORT_PATHS.length ||
  manifest.aggregate_manifest_hash.length !== 64 ||
  Object.keys(manifest.file_hashes).length !== FROZEN_TERMINAL_EXPORT_PATHS.length ||
  handoff.handoff_status !== 'PRODUCTION_READY_HANDOFF_READY' ||
  handoff.rehardening_blocked !== true ||
  currentState.production_ready_certified !== true ||
  currentState.baseline_snapshot_frozen !== true ||
  currentState.no_new_ds_phase_allowed !== true ||
  currentState.rehardening_blocked !== true ||
  report.certification_status !== PRODUCTION_READY_BASELINE_SNAPSHOT_STATUS ||
  report.frozen_exports_verified !== 'PASS' ||
  report.handoff_updated !== 'PASS' ||
  report.current_state_updated !== 'PASS'
) {
  console.error('Baseline snapshot artifacts do not match expected production ready freeze state');
  process.exit(1);
}

process.exit(0);
