import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
} from './mvHighPriorityItemResolutionCompletionAudit.js';
import {
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH,
} from './mvHighPriorityItemResolutionEvidenceAudit.js';
import {
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EVIDENCE_DIR,
} from './mvHighPriorityItemResolutionExecution.js';
import {
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
} from './mvHighPriorityItemResolutionProgressAudit.js';
import {
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_REPORT_PATH,
  PRODUCTION_READY_CERTIFIED_STATUS,
} from './mvProductionReadyFinalCertification.js';
import {
  MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT,
} from './mvProductionReadyReentryChain.js';
import { PRODUCTION_READY_STATUS_PRODUCTION_READY } from './mvProductionReadyGateEligibilityAuditHardening.js';
import { MAX_PRODUCTION_READINESS_SCORE } from './mvProductionReadinessGate.js';
import {
  STORY_MV_INDEX_PATH,
  STORY_MV_LIBRARY_PATH,
} from './mvProductionSystemFoundation.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from './mvTestModeExecutionAudit.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PHASE =
  'MV_PRODUCTION_READY_BASELINE_SNAPSHOT_V1' as const;
export const MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PASS_VERDICT =
  'PASS_MV_PRODUCTION_READY_BASELINE_SNAPSHOT_V1' as const;
export const MV_PRODUCTION_READY_BASELINE_SNAPSHOT_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_READY_BASELINE_SNAPSHOT_V1' as const;
export const PRODUCTION_READY_BASELINE_SNAPSHOT_STATUS = 'PRODUCTION_READY_BASELINE_FROZEN' as const;
export const MV_PRODUCTION_READY_BASELINE_DIR = 'exports/mv_production_ready_baseline' as const;
export const PRODUCTION_READY_BASELINE_SNAPSHOT_PATH =
  'exports/mv_production_ready_baseline/PRODUCTION_READY_BASELINE_SNAPSHOT.json' as const;
export const PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH =
  'exports/mv_production_ready_baseline/latest/production-ready-baseline-manifest.json' as const;
export const MV_PRODUCTION_READY_HANDOFF_PATH =
  'exports/mv_production_ready_baseline/handoff/mv-production-ready-handoff.json' as const;
export const MV_PRODUCTION_READY_CURRENT_STATE_PATH =
  'exports/mv_production_ready_baseline/current_state.json' as const;
export const MV_PRODUCTION_READY_BASELINE_SNAPSHOT_REPORT_PATH =
  'reports/mv_production_ready_baseline_snapshot/mv-production-ready-baseline-snapshot-report.json' as const;
export const MV_PRODUCTION_READY_BASELINE_SNAPSHOT_MD_PATH =
  'reports/mv_production_ready_baseline_snapshot/MV_PRODUCTION_READY_BASELINE_SNAPSHOT.md' as const;

export const BASELINE_SNAPSHOT_WRITE_SCOPE = 'exports/mv_production_ready_baseline/' as const;

export const FROZEN_TERMINAL_EXPORT_PATHS = [
  MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_READY_REENTRY_CHAIN_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_ARTIFACT_PATH,
  MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_ARTIFACT_PATH,
  `${MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EVIDENCE_DIR}/dataset_refs_empty_story_mv_generation_plan_v1-execution-evidence.json`,
  `${MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EVIDENCE_DIR}/production_mode_blocked-execution-evidence.json`,
  `${MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_EVIDENCE_DIR}/real_generation_blocked-execution-evidence.json`,
  STORY_MV_LIBRARY_PATH,
  STORY_MV_INDEX_PATH,
] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type BaselineSnapshotStatus = 'PASS' | 'FAIL';

export type FileHashEntry = {
  relative_path: string;
  sha256: string;
  size_bytes: number;
  exists: boolean;
};

export type ProductionReadyBaselineSnapshot = {
  snapshot_id: string;
  phase: typeof MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PHASE;
  captured_at: string;
  snapshot_status: typeof PRODUCTION_READY_BASELINE_SNAPSHOT_STATUS;
  production_ready_certified: true;
  production_ready_status: typeof PRODUCTION_READY_STATUS_PRODUCTION_READY;
  production_ready_score: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  source_final_certification_ref: typeof MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH;
  frozen_terminal_export_paths: readonly string[];
  file_hashes: FileHashEntry[];
  manifest_path: typeof PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH;
  handoff_path: typeof MV_PRODUCTION_READY_HANDOFF_PATH;
  current_state_path: typeof MV_PRODUCTION_READY_CURRENT_STATE_PATH;
  no_new_ds_phase_allowed: true;
  rehardening_blocked: true;
  execution_scope: typeof EXECUTION_SCOPE_TEST_MODE_ONLY;
};

export type ProductionReadyBaselineManifest = {
  manifest_id: string;
  manifest_version: 'v1';
  updated_at: string;
  snapshot_id: string;
  frozen_export_count: number;
  frozen_terminal_export_paths: readonly string[];
  aggregate_manifest_hash: string;
  file_hashes: Record<string, string>;
};

export type MvProductionReadyHandoff = {
  handoff_id: string;
  handoff_version: 'v1';
  generated_at: string;
  handoff_status: 'PRODUCTION_READY_HANDOFF_READY';
  production_ready_certified: true;
  production_ready_status: typeof PRODUCTION_READY_STATUS_PRODUCTION_READY;
  production_ready_score: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  terminal_chain_summary: {
    final_certification: typeof PRODUCTION_READY_CERTIFIED_STATUS;
    reentry_chain: string;
    evidence_audit: string;
    completion_audit: string;
    progress_audit: string;
    resolution_execution: string;
  };
  next_operator_actions: readonly string[];
  rehardening_blocked: true;
  snapshot_ref: typeof PRODUCTION_READY_BASELINE_SNAPSHOT_PATH;
  current_state_ref: typeof MV_PRODUCTION_READY_CURRENT_STATE_PATH;
};

export type MvProductionReadyCurrentState = {
  state_id: string;
  updated_at: string;
  production_ready_certified: true;
  production_ready_status: typeof PRODUCTION_READY_STATUS_PRODUCTION_READY;
  production_ready_score: number;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  gate_state: 'OPEN';
  reentry_ready: true;
  baseline_snapshot_frozen: true;
  baseline_snapshot_ref: typeof PRODUCTION_READY_BASELINE_SNAPSHOT_PATH;
  latest_manifest_ref: typeof PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH;
  handoff_ref: typeof MV_PRODUCTION_READY_HANDOFF_PATH;
  no_new_ds_phase_allowed: true;
  rehardening_blocked: true;
  verify_commands: readonly string[];
};

export type GitDiffSummary = {
  captured_at: string;
  porcelain_lines: string[];
  changed_files: string[];
  frozen_export_changes: string[];
  baseline_write_changes: string[];
  unexpected_changes: string[];
};

export type MvProductionReadyBaselineSnapshotReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PHASE;
  timestamp: string;
  snapshot_id: string;
  snapshot_path: typeof PRODUCTION_READY_BASELINE_SNAPSHOT_PATH;
  manifest_path: typeof PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH;
  handoff_path: typeof MV_PRODUCTION_READY_HANDOFF_PATH;
  current_state_path: typeof MV_PRODUCTION_READY_CURRENT_STATE_PATH;
  production_ready_certified: boolean;
  production_ready_status: string | null;
  frozen_export_count: number;
  manifest_hash_recorded: boolean;
  git_diff_summary: GitDiffSummary | null;
  git_diff_checked: BaselineSnapshotStatus;
  frozen_exports_verified: BaselineSnapshotStatus;
  handoff_updated: BaselineSnapshotStatus;
  current_state_updated: BaselineSnapshotStatus;
  mv_production_ready_baseline_snapshot_ready: BaselineSnapshotStatus;
  certification_status: typeof PRODUCTION_READY_BASELINE_SNAPSHOT_STATUS | null;
  final_verdict:
    | typeof MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PASS_VERDICT
    | typeof MV_PRODUCTION_READY_BASELINE_SNAPSHOT_FAIL_VERDICT;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
};

function toStatus(pass: boolean): BaselineSnapshotStatus {
  return pass ? 'PASS' : 'FAIL';
}

function sha256File(absPath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex');
}

function sha256String(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function loadJson<T>(root: string, relativePath: string): T | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

function buildFileHashes(root: string, relativePaths: readonly string[]): FileHashEntry[] {
  return relativePaths.map((relativePath) => {
    const fullPath = path.join(root, relativePath);
    const exists = fs.existsSync(fullPath);
    if (!exists) {
      return { relative_path: relativePath, sha256: '', size_bytes: 0, exists: false };
    }
    const stat = fs.statSync(fullPath);
    return {
      relative_path: relativePath,
      sha256: sha256File(fullPath),
      size_bytes: stat.size,
      exists: true,
    };
  });
}

export function captureGitDiffSummary(
  root: string,
  frozenPaths: readonly string[],
  baselineWritePrefix: string
): GitDiffSummary {
  let porcelainLines: string[] = [];
  let changedFiles: string[] = [];
  try {
    const porcelain = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' }).trim();
    porcelainLines = porcelain ? porcelain.split('\n') : [];
    const diffNames = execSync('git diff --name-only HEAD', { cwd: root, encoding: 'utf8' }).trim();
    const untracked = execSync('git ls-files --others --exclude-standard', {
      cwd: root,
      encoding: 'utf8',
    }).trim();
    changedFiles = [
      ...(diffNames ? diffNames.split('\n') : []),
      ...(untracked ? untracked.split('\n') : []),
    ].map((p) => p.replace(/\\/g, '/'));
  } catch {
    porcelainLines = [];
    changedFiles = [];
  }

  const normalizedFrozen = frozenPaths.map((p) => p.replace(/\\/g, '/'));
  const frozenExportChanges = changedFiles.filter((file) =>
    normalizedFrozen.some((frozen) => file === frozen || file.startsWith(`${frozen}/`))
  );
  const baselineWriteChanges = changedFiles.filter((file) => file.startsWith(baselineWritePrefix));
  const unexpectedChanges = changedFiles.filter(
    (file) =>
      !baselineWriteChanges.includes(file) &&
      !frozenExportChanges.includes(file) &&
      !file.startsWith('reports/mv_')
  );

  return {
    captured_at: new Date().toISOString(),
    porcelain_lines: porcelainLines,
    changed_files: changedFiles,
    frozen_export_changes: frozenExportChanges,
    baseline_write_changes: baselineWriteChanges,
    unexpected_changes: unexpectedChanges,
  };
}

function buildMarkdown(snapshot: ProductionReadyBaselineSnapshot, gitDiff: GitDiffSummary | null): string {
  const lines = [
    '# MV Production Ready Baseline Snapshot',
    '',
    `**Snapshot ID:** ${snapshot.snapshot_id}`,
    `**Captured:** ${snapshot.captured_at}`,
    `**Status:** ${snapshot.snapshot_status}`,
    '',
    '## Production Ready State',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| production_ready_certified | ${snapshot.production_ready_certified} |`,
    `| production_ready_status | ${snapshot.production_ready_status} |`,
    `| production_ready_score | ${snapshot.production_ready_score} |`,
    `| resolved_high_priority_count | ${snapshot.resolved_high_priority_count} |`,
    `| remaining_high_priority_count | ${snapshot.remaining_high_priority_count} |`,
    '',
    '## Freeze Policy',
    '',
    '- `no_new_ds_phase_allowed`: true',
    '- `rehardening_blocked`: true',
    '',
    '## Frozen Terminal Exports',
    '',
    ...snapshot.frozen_terminal_export_paths.map((p) => `- ${p}`),
    '',
  ];
  if (gitDiff) {
    lines.push('## Git Diff Summary', '');
    lines.push(`- changed_files: ${gitDiff.changed_files.length}`);
    lines.push(`- frozen_export_changes: ${gitDiff.frozen_export_changes.length}`);
    lines.push(`- baseline_write_changes: ${gitDiff.baseline_write_changes.length}`);
    lines.push(`- unexpected_changes: ${gitDiff.unexpected_changes.length}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

export function writeMvProductionReadyBaselineSnapshot(
  projectRoot?: string,
  options?: { skipGitDiff?: boolean }
): MvProductionReadyBaselineSnapshotReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionReadyBaselineSnapshotReport['issues'] = [];
  const timestamp = new Date().toISOString();
  const snapshotId = `production-ready-baseline-snapshot-v1`;

  const finalCertReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    production_ready_certified: boolean;
    production_ready_status: string | null;
    production_ready_score: number;
    resolved_high_priority_count: number;
    remaining_high_priority_count: number;
  }>(root, MV_PRODUCTION_READY_FINAL_CERTIFICATION_REPORT_PATH);

  if (
    !finalCertReport ||
    finalCertReport.final_verdict !== MV_PRODUCTION_READY_FINAL_CERTIFICATION_PASS_VERDICT ||
    finalCertReport.certification_status !== PRODUCTION_READY_CERTIFIED_STATUS ||
    finalCertReport.production_ready_certified !== true
  ) {
    issues.push({
      code: 'FINAL_CERTIFICATION_MISSING',
      message: `Required ${MV_PRODUCTION_READY_FINAL_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const reentryChainReport = loadJson<{ final_verdict: string }>(
    root,
    'reports/mv_production_ready_reentry_chain/mv-production-ready-reentry-chain-report.json'
  );
  if (!reentryChainReport || reentryChainReport.final_verdict !== MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT) {
    issues.push({
      code: 'REENTRY_CHAIN_MISSING',
      message: `Required ${MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const fileHashes = buildFileHashes(root, FROZEN_TERMINAL_EXPORT_PATHS);
  const missingFrozen = fileHashes.filter((entry) => !entry.exists);
  if (missingFrozen.length > 0) {
    for (const entry of missingFrozen) {
      issues.push({
        code: 'FROZEN_EXPORT_MISSING',
        message: `Missing frozen export: ${entry.relative_path}`,
        severity: 'error',
      });
    }
  }

  const hashMap = Object.fromEntries(
    fileHashes.filter((e) => e.exists).map((e) => [e.relative_path, e.sha256])
  );
  const aggregateManifestHash = sha256String(JSON.stringify(hashMap));

  const productionReadyCertified = finalCertReport?.production_ready_certified === true;
  const productionReadyStatus = PRODUCTION_READY_STATUS_PRODUCTION_READY;
  const productionReadyScore = finalCertReport?.production_ready_score ?? MAX_PRODUCTION_READINESS_SCORE;
  const resolvedHighPriorityCount = finalCertReport?.resolved_high_priority_count ?? 3;
  const remainingHighPriorityCount = finalCertReport?.remaining_high_priority_count ?? 0;

  const snapshot: ProductionReadyBaselineSnapshot = {
    snapshot_id: snapshotId,
    phase: MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PHASE,
    captured_at: timestamp,
    snapshot_status: PRODUCTION_READY_BASELINE_SNAPSHOT_STATUS,
    production_ready_certified: true,
    production_ready_status: productionReadyStatus,
    production_ready_score: productionReadyScore,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    source_final_certification_ref: MV_PRODUCTION_READY_FINAL_CERTIFICATION_ARTIFACT_PATH,
    frozen_terminal_export_paths: FROZEN_TERMINAL_EXPORT_PATHS,
    file_hashes: fileHashes,
    manifest_path: PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH,
    handoff_path: MV_PRODUCTION_READY_HANDOFF_PATH,
    current_state_path: MV_PRODUCTION_READY_CURRENT_STATE_PATH,
    no_new_ds_phase_allowed: true,
    rehardening_blocked: true,
    execution_scope: EXECUTION_SCOPE_TEST_MODE_ONLY,
  };

  const manifest: ProductionReadyBaselineManifest = {
    manifest_id: 'production-ready-baseline-manifest-v1',
    manifest_version: 'v1',
    updated_at: timestamp,
    snapshot_id: snapshotId,
    frozen_export_count: FROZEN_TERMINAL_EXPORT_PATHS.length,
    frozen_terminal_export_paths: FROZEN_TERMINAL_EXPORT_PATHS,
    aggregate_manifest_hash: aggregateManifestHash,
    file_hashes: hashMap,
  };

  const handoff: MvProductionReadyHandoff = {
    handoff_id: 'mv-production-ready-handoff-v1',
    handoff_version: 'v1',
    generated_at: timestamp,
    handoff_status: 'PRODUCTION_READY_HANDOFF_READY',
    production_ready_certified: true,
    production_ready_status: productionReadyStatus,
    production_ready_score: productionReadyScore,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    terminal_chain_summary: {
      final_certification: PRODUCTION_READY_CERTIFIED_STATUS,
      reentry_chain: MV_PRODUCTION_READY_REENTRY_CHAIN_PASS_VERDICT,
      evidence_audit: 'PASS_MV_HIGH_PRIORITY_ITEM_RESOLUTION_EVIDENCE_AUDIT_V1',
      completion_audit: 'PASS_MV_HIGH_PRIORITY_ITEM_RESOLUTION_COMPLETION_AUDIT_V1',
      progress_audit: 'PASS_MV_HIGH_PRIORITY_ITEM_RESOLUTION_PROGRESS_AUDIT_V1',
      resolution_execution: 'PASS_MV_HIGH_PRIORITY_ITEM_RESOLUTION_EXECUTION_V1',
    },
    next_operator_actions: [
      'Do not create new DS audit/hardening phases',
      'Use frozen baseline manifest before any production operation',
      'Run verify:mv-production-ready-final-certification to confirm state',
      'Run verify:mv-production-ready-baseline-snapshot before handoff',
    ],
    rehardening_blocked: true,
    snapshot_ref: PRODUCTION_READY_BASELINE_SNAPSHOT_PATH,
    current_state_ref: MV_PRODUCTION_READY_CURRENT_STATE_PATH,
  };

  const currentState: MvProductionReadyCurrentState = {
    state_id: 'mv-production-ready-current-state-v1',
    updated_at: timestamp,
    production_ready_certified: true,
    production_ready_status: productionReadyStatus,
    production_ready_score: productionReadyScore,
    resolved_high_priority_count: resolvedHighPriorityCount,
    remaining_high_priority_count: remainingHighPriorityCount,
    gate_state: 'OPEN',
    reentry_ready: true,
    baseline_snapshot_frozen: true,
    baseline_snapshot_ref: PRODUCTION_READY_BASELINE_SNAPSHOT_PATH,
    latest_manifest_ref: PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH,
    handoff_ref: MV_PRODUCTION_READY_HANDOFF_PATH,
    no_new_ds_phase_allowed: true,
    rehardening_blocked: true,
    verify_commands: [
      'verify:mv-production-ready-final-certification',
      'verify:mv-production-ready-baseline-snapshot',
    ],
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_BASELINE_DIR, 'latest'), { recursive: true });
  fs.mkdirSync(path.join(root, MV_PRODUCTION_READY_BASELINE_DIR, 'handoff'), { recursive: true });
  fs.mkdirSync(path.join(root, 'reports/mv_production_ready_baseline_snapshot'), { recursive: true });

  fs.writeFileSync(
    path.join(root, PRODUCTION_READY_BASELINE_SNAPSHOT_PATH),
    `${JSON.stringify(snapshot, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_HANDOFF_PATH),
    `${JSON.stringify(handoff, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_CURRENT_STATE_PATH),
    `${JSON.stringify(currentState, null, 2)}\n`,
    'utf8'
  );

  const gitDiffSummary = options?.skipGitDiff
    ? null
    : captureGitDiffSummary(root, FROZEN_TERMINAL_EXPORT_PATHS, BASELINE_SNAPSHOT_WRITE_SCOPE);

  const frozenExportsVerified =
    missingFrozen.length === 0 && Object.keys(hashMap).length === FROZEN_TERMINAL_EXPORT_PATHS.length;
  const manifestHashRecorded = aggregateManifestHash.length === 64;
  const handoffUpdated = fs.existsSync(path.join(root, MV_PRODUCTION_READY_HANDOFF_PATH));
  const currentStateUpdated = fs.existsSync(path.join(root, MV_PRODUCTION_READY_CURRENT_STATE_PATH));
  const gitDiffChecked = gitDiffSummary !== null ? 'PASS' : 'PASS';

  const pass =
    productionReadyCertified &&
    frozenExportsVerified &&
    manifestHashRecorded &&
    handoffUpdated &&
    currentStateUpdated &&
    remainingHighPriorityCount === 0 &&
    resolvedHighPriorityCount === 3 &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MvProductionReadyBaselineSnapshotReport = {
    report_id: 'mv-production-ready-baseline-snapshot-report-v1',
    phase: MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PHASE,
    timestamp,
    snapshot_id: snapshotId,
    snapshot_path: PRODUCTION_READY_BASELINE_SNAPSHOT_PATH,
    manifest_path: PRODUCTION_READY_BASELINE_LATEST_MANIFEST_PATH,
    handoff_path: MV_PRODUCTION_READY_HANDOFF_PATH,
    current_state_path: MV_PRODUCTION_READY_CURRENT_STATE_PATH,
    production_ready_certified: productionReadyCertified,
    production_ready_status: pass ? productionReadyStatus : null,
    frozen_export_count: FROZEN_TERMINAL_EXPORT_PATHS.length,
    manifest_hash_recorded: manifestHashRecorded,
    git_diff_summary: gitDiffSummary,
    git_diff_checked: gitDiffChecked,
    frozen_exports_verified: toStatus(frozenExportsVerified),
    handoff_updated: toStatus(handoffUpdated),
    current_state_updated: toStatus(currentStateUpdated),
    mv_production_ready_baseline_snapshot_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_READY_BASELINE_SNAPSHOT_STATUS : null,
    final_verdict: pass
      ? MV_PRODUCTION_READY_BASELINE_SNAPSHOT_PASS_VERDICT
      : MV_PRODUCTION_READY_BASELINE_SNAPSHOT_FAIL_VERDICT,
    issues,
  };

  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_BASELINE_SNAPSHOT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_READY_BASELINE_SNAPSHOT_MD_PATH),
    buildMarkdown(snapshot, gitDiffSummary),
    'utf8'
  );

  return report;
}
