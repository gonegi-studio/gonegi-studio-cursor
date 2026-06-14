import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { AUDITOR_DASHBOARD_JSON_PATH } from './auditorDashboardSummary.js';
import {
  RELEASE_PIPELINE_JSON_PATH,
  type ReleaseStatus,
} from './auditorReleasePipeline.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MEMORY_BASELINE_PHASE = 'PHASE-AUDITOR-011' as const;
export const MEMORY_BASELINE_PASS_VERDICT = 'PASS_PROJECT_MEMORY_BASELINE_V1' as const;
export const MEMORY_BASELINE_FAIL_VERDICT = 'FAIL_PROJECT_MEMORY_BASELINE_V1' as const;
export const MEMORY_BASELINE_REPORT_PATH = 'reports/project-memory-baseline-report.json' as const;
export const MEMORY_BASELINE_MD_PATH = 'reports/PROJECT_MEMORY_BASELINE.md' as const;
export const MEMORY_SNAPSHOT_DIR = 'reports/auditor_memory' as const;
export const LATEST_STABLE_ALIAS_PATH = 'reports/auditor_memory/latest-stable-baseline.json' as const;

const GENERATION_FEEDBACK_REPORT_PATH = 'reports/generation-feedback-report.json' as const;
const PROJECT_AUDITOR_REPORT_PATH = 'reports/project-auditor-report.json' as const;

const DEFAULT_PROTECTED_FILES = Object.freeze([
  'Master Core',
  'Character Book',
  'Character TXT',
  'Living World datasets',
  'exports/image_app/latest/',
  'exports/image_app/adapters/',
]);

export type FileHashMap = Record<string, string>;

export type DatasetCounts = {
  dataset_json_count: number;
  latest_json_count: number;
  adapters_json_count: number;
  verify_script_count: number;
  export_json_count: number;
};

export type VerifyCommandResult = {
  npm_script: string;
  step_id: string;
  passed: boolean;
  exit_code: number;
};

export type ProjectMemoryBaseline = {
  baseline_id: string;
  phase: typeof MEMORY_BASELINE_PHASE;
  captured_at: string;
  snapshot_date: string;
  release_status: ReleaseStatus | string;
  release_score: number;
  project_status: string;
  aggregate_risk: number;
  identity_risk: number;
  generation_risk: number;
  conflict_risk: number;
  actual_pass_rate: number;
  adjusted_pass_rate: number;
  safe_slots: readonly string[];
  watch_slots: readonly string[];
  skip_slots: readonly string[];
  latest_file_hashes: FileHashMap;
  adapter_file_hashes: FileHashMap;
  dataset_counts: DatasetCounts;
  verify_command_results: readonly VerifyCommandResult[];
  protected_files: readonly string[];
  warnings: readonly string[];
  release_pipeline_verdict: string;
};

export type LatestStableAlias = {
  alias_type: 'latest_stable_baseline_pointer';
  updated_at: string;
  baseline_id: string;
  snapshot_path: string;
  captured_at: string;
  release_status: string;
  release_score: number;
  approved: boolean;
};

export type BaselineComparison = {
  compared_at: string;
  old_baseline_id: string;
  new_baseline_id: string;
  risk_delta: {
    aggregate_risk: number;
    identity_risk: number;
    generation_risk: number;
    conflict_risk: number;
    release_score: number;
  };
  file_hash_changes: readonly {
    scope: 'latest' | 'adapter';
    file_path: string;
    old_hash: string;
    new_hash: string;
  }[];
  new_files: readonly string[];
  removed_files: readonly string[];
  status_change: {
    release_status: { from: string; to: string };
    project_status: { from: string; to: string };
  };
  pass_rate_delta: {
    actual: number;
    adjusted: number;
  };
  new_warnings: readonly string[];
  resolved_warnings: readonly string[];
};

export type ProjectMemoryBaselineReport = {
  baseline_id: string;
  phase: typeof MEMORY_BASELINE_PHASE;
  captured_at: string;
  current_release_status: string;
  current_risk: number;
  stable_alias_updated: boolean;
  snapshot_path: string;
  alias_path: string;
  comparison_to_previous_if_exists: BaselineComparison | null;
  final_verdict: typeof MEMORY_BASELINE_PASS_VERDICT | typeof MEMORY_BASELINE_FAIL_VERDICT;
};

function sha256File(absPath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex');
}

function collectJsonHashes(root: string, relDir: string): FileHashMap {
  const absDir = path.join(root, relDir);
  const hashes: FileHashMap = {};
  if (!fs.existsSync(absDir)) return hashes;

  const walk = (dir: string, prefix: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = path.posix.join(prefix, entry.name);
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, rel);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        hashes[path.posix.join(relDir, rel).replace(/\\/g, '/')] = sha256File(abs);
      }
    }
  };

  walk(absDir, '');
  return hashes;
}

function formatSnapshotDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildSnapshotFilename(date: Date): string {
  return `${formatSnapshotDate(date)}_${MEMORY_BASELINE_PHASE}_BASELINE.json`;
}

function listSnapshotFiles(root: string): string[] {
  const dir = path.join(root, MEMORY_SNAPSHOT_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('_BASELINE.json') && name !== 'latest-stable-baseline.json')
    .sort();
}

function loadBaseline(root: string, snapshotFile: string): ProjectMemoryBaseline | null {
  const abs = path.join(root, MEMORY_SNAPSHOT_DIR, snapshotFile);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as ProjectMemoryBaseline;
}

function diffHashMaps(
  oldMap: FileHashMap,
  newMap: FileHashMap,
  scope: 'latest' | 'adapter'
): {
  changes: BaselineComparison['file_hash_changes'][number][];
  new_files: string[];
  removed_files: string[];
} {
  const changes: BaselineComparison['file_hash_changes'][number][] = [];
  const new_files: string[] = [];
  const removed_files: string[] = [];

  const oldKeys = new Set(Object.keys(oldMap));
  const newKeys = new Set(Object.keys(newMap));

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      new_files.push(key);
    } else if (oldMap[key] !== newMap[key]) {
      changes.push({
        scope,
        file_path: key,
        old_hash: oldMap[key],
        new_hash: newMap[key],
      });
    }
  }

  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      removed_files.push(key);
    }
  }

  return { changes, new_files, removed_files };
}

function diffWarnings(oldWarnings: readonly string[], newWarnings: readonly string[]): {
  new_warnings: string[];
  resolved_warnings: string[];
} {
  const oldSet = new Set(oldWarnings);
  const newSet = new Set(newWarnings);
  return {
    new_warnings: newWarnings.filter((w) => !oldSet.has(w)),
    resolved_warnings: oldWarnings.filter((w) => !newSet.has(w)),
  };
}

export function compareProjectMemoryBaselines(
  oldBaseline: ProjectMemoryBaseline,
  newBaseline: ProjectMemoryBaseline
): BaselineComparison {
  const latestDiff = diffHashMaps(
    oldBaseline.latest_file_hashes,
    newBaseline.latest_file_hashes,
    'latest'
  );
  const adapterDiff = diffHashMaps(
    oldBaseline.adapter_file_hashes,
    newBaseline.adapter_file_hashes,
    'adapter'
  );
  const warningDiff = diffWarnings(oldBaseline.warnings, newBaseline.warnings);

  return {
    compared_at: new Date().toISOString(),
    old_baseline_id: oldBaseline.baseline_id,
    new_baseline_id: newBaseline.baseline_id,
    risk_delta: {
      aggregate_risk: newBaseline.aggregate_risk - oldBaseline.aggregate_risk,
      identity_risk: newBaseline.identity_risk - oldBaseline.identity_risk,
      generation_risk: newBaseline.generation_risk - oldBaseline.generation_risk,
      conflict_risk: newBaseline.conflict_risk - oldBaseline.conflict_risk,
      release_score: newBaseline.release_score - oldBaseline.release_score,
    },
    file_hash_changes: Object.freeze([...latestDiff.changes, ...adapterDiff.changes]),
    new_files: Object.freeze([...latestDiff.new_files, ...adapterDiff.new_files]),
    removed_files: Object.freeze([...latestDiff.removed_files, ...adapterDiff.removed_files]),
    status_change: {
      release_status: {
        from: oldBaseline.release_status,
        to: newBaseline.release_status,
      },
      project_status: {
        from: oldBaseline.project_status,
        to: newBaseline.project_status,
      },
    },
    pass_rate_delta: {
      actual: newBaseline.actual_pass_rate - oldBaseline.actual_pass_rate,
      adjusted: newBaseline.adjusted_pass_rate - oldBaseline.adjusted_pass_rate,
    },
    new_warnings: Object.freeze(warningDiff.new_warnings),
    resolved_warnings: Object.freeze(warningDiff.resolved_warnings),
  };
}

export function captureProjectMemoryBaseline(projectRoot?: string): ProjectMemoryBaseline {
  const root = resolveProjectRoot(projectRoot);
  const now = new Date();

  const release = readJsonRecord(root, RELEASE_PIPELINE_JSON_PATH) as {
    release_status?: string;
    release_score?: number;
    final_verdict?: string;
    pipeline_steps?: Array<{
      step_id: string;
      npm_script: string;
      passed: boolean;
      exit_code: number;
    }>;
  } | null;

  const dashboard = readJsonRecord(root, AUDITOR_DASHBOARD_JSON_PATH) as {
    project_status?: string;
    aggregate_risk?: number;
    identity_risk?: number;
    generation_risk?: number;
    conflict_risk?: number;
    calibrated_expected_pass_rate?: number;
    actual_pass_rate?: number;
    safe_slots?: string[];
    watch_slots?: string[];
    skip_slots?: string[];
    top_warnings?: string[];
    do_not_touch_list?: string[];
  } | null;

  const feedback = readJsonRecord(root, GENERATION_FEEDBACK_REPORT_PATH) as {
    normalized_feedback?: {
      pass_rate?: number;
      adjusted_pass_rate?: number;
    };
  } | null;

  const auditor = readJsonRecord(root, PROJECT_AUDITOR_REPORT_PATH) as {
    inventory?: {
      dataset_json_count?: number;
      latest_json_count?: number;
      adapters_json_count?: number;
      verify_script_count?: number;
      export_json_count?: number;
    };
  } | null;

  if (!release || !dashboard) {
    throw new Error(
      'Missing release pipeline or dashboard report — run npm run verify:auditor-release-pipeline first'
    );
  }

  const inventory = auditor?.inventory ?? {};
  const protected_files = [
    ...DEFAULT_PROTECTED_FILES,
    ...(dashboard.do_not_touch_list ?? []),
  ];

  return {
    baseline_id: `memory_baseline_${now.toISOString().replace(/[-:]/g, '').slice(0, 15)}`,
    phase: MEMORY_BASELINE_PHASE,
    captured_at: now.toISOString(),
    snapshot_date: formatSnapshotDate(now),
    release_status: String(release.release_status ?? 'UNKNOWN'),
    release_score: Number(release.release_score ?? 0),
    project_status: String(dashboard.project_status ?? 'UNKNOWN'),
    aggregate_risk: Number(dashboard.aggregate_risk ?? 0),
    identity_risk: Number(dashboard.identity_risk ?? 0),
    generation_risk: Number(dashboard.generation_risk ?? 0),
    conflict_risk: Number(dashboard.conflict_risk ?? 0),
    actual_pass_rate: Number(
      feedback?.normalized_feedback?.pass_rate ?? dashboard?.actual_pass_rate ?? 0
    ),
    adjusted_pass_rate: Number(
      feedback?.normalized_feedback?.adjusted_pass_rate ??
        dashboard?.calibrated_expected_pass_rate ??
        0
    ),
    safe_slots: Object.freeze(dashboard.safe_slots ?? []),
    watch_slots: Object.freeze(dashboard.watch_slots ?? []),
    skip_slots: Object.freeze(dashboard.skip_slots ?? []),
    latest_file_hashes: collectJsonHashes(root, 'exports/image_app/latest'),
    adapter_file_hashes: collectJsonHashes(root, 'exports/image_app/adapters'),
    dataset_counts: {
      dataset_json_count: Number(inventory.dataset_json_count ?? 0),
      latest_json_count: Number(inventory.latest_json_count ?? 0),
      adapters_json_count: Number(inventory.adapters_json_count ?? 0),
      verify_script_count: Number(inventory.verify_script_count ?? 0),
      export_json_count: Number(inventory.export_json_count ?? 0),
    },
    verify_command_results: Object.freeze(
      (release.pipeline_steps ?? []).map((step) => ({
        npm_script: step.npm_script,
        step_id: step.step_id,
        passed: step.passed,
        exit_code: step.exit_code,
      }))
    ),
    protected_files: Object.freeze([...new Set(protected_files)]),
    warnings: Object.freeze(dashboard.top_warnings ?? []),
    release_pipeline_verdict: String(release.final_verdict ?? 'UNKNOWN'),
  };
}

function isApprovedBaseline(baseline: ProjectMemoryBaseline): boolean {
  return (
    baseline.release_status !== 'RELEASE_BLOCKED' &&
    baseline.verify_command_results.every((step) => step.passed)
  );
}

export function writeMemorySnapshot(
  projectRoot: string,
  baseline: ProjectMemoryBaseline
): string {
  const snapshotFile = buildSnapshotFilename(new Date(baseline.captured_at));
  const snapshotRel = path.posix.join(MEMORY_SNAPSHOT_DIR, snapshotFile);
  const snapshotAbs = path.join(projectRoot, snapshotRel);

  fs.mkdirSync(path.dirname(snapshotAbs), { recursive: true });
  fs.writeFileSync(snapshotAbs, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
  return snapshotRel;
}

export function updateLatestStableAlias(
  projectRoot: string,
  baseline: ProjectMemoryBaseline,
  snapshotPath: string
): LatestStableAlias {
  const alias: LatestStableAlias = {
    alias_type: 'latest_stable_baseline_pointer',
    updated_at: new Date().toISOString(),
    baseline_id: baseline.baseline_id,
    snapshot_path: snapshotPath.replace(/\\/g, '/'),
    captured_at: baseline.captured_at,
    release_status: String(baseline.release_status),
    release_score: baseline.release_score,
    approved: isApprovedBaseline(baseline),
  };

  const aliasAbs = path.join(projectRoot, LATEST_STABLE_ALIAS_PATH);
  fs.mkdirSync(path.dirname(aliasAbs), { recursive: true });
  fs.writeFileSync(aliasAbs, `${JSON.stringify(alias, null, 2)}\n`, 'utf8');
  return alias;
}

function findPreviousBaseline(
  root: string,
  currentSnapshotFile: string
): ProjectMemoryBaseline | null {
  const files = listSnapshotFiles(root).filter((f) => f !== currentSnapshotFile);
  if (files.length === 0) return null;
  return loadBaseline(root, files[files.length - 1]);
}

export function renderMemoryBaselineMarkdown(
  baseline: ProjectMemoryBaseline,
  report: ProjectMemoryBaselineReport
): string {
  const comparison = report.comparison_to_previous_if_exists;
  const regressionSection = comparison
    ? [
        `- Aggregate risk delta: **${comparison.risk_delta.aggregate_risk >= 0 ? '+' : ''}${comparison.risk_delta.aggregate_risk}**`,
        `- Release score delta: **${comparison.risk_delta.release_score >= 0 ? '+' : ''}${comparison.risk_delta.release_score}**`,
        `- Actual pass rate delta: **${comparison.pass_rate_delta.actual >= 0 ? '+' : ''}${comparison.pass_rate_delta.actual.toFixed(4)}**`,
        `- File hash changes: **${comparison.file_hash_changes.length}**`,
        `- New files: **${comparison.new_files.length}** | Removed: **${comparison.removed_files.length}**`,
        `- New warnings: **${comparison.new_warnings.length}** | Resolved: **${comparison.resolved_warnings.length}**`,
        `- Status: ${comparison.status_change.release_status.from} → ${comparison.status_change.release_status.to}`,
      ].join('\n')
    : '- No previous baseline available for comparison.';

  return [
    '# Project Memory Baseline',
    '',
    '## Captured Baseline',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Baseline ID** | ${baseline.baseline_id} |`,
    `| **Captured** | ${baseline.captured_at} |`,
    `| **Snapshot** | \`${report.snapshot_path}\` |`,
    `| **Stable alias** | \`${report.alias_path}\` |`,
    `| **Verdict** | ${report.final_verdict} |`,
    '',
    '## Release Status',
    '',
    `- Release status: **${baseline.release_status}**`,
    `- Release score: **${baseline.release_score}**`,
    `- Project status: **${baseline.project_status}**`,
    `- Pipeline verdict: **${baseline.release_pipeline_verdict}**`,
    '',
    '## Risk Snapshot',
    '',
    `- Aggregate risk: **${baseline.aggregate_risk}**`,
    `- Identity risk: **${baseline.identity_risk}**`,
    `- Generation risk: **${baseline.generation_risk}**`,
    `- Conflict risk: **${baseline.conflict_risk}**`,
    `- Actual pass rate: **${baseline.actual_pass_rate}**`,
    `- Adjusted pass rate: **${baseline.adjusted_pass_rate}**`,
    `- Safe / watch / skip slots: **${baseline.safe_slots.length} / ${baseline.watch_slots.length} / ${baseline.skip_slots.length}**`,
    '',
    '## File Hash Snapshot',
    '',
    `- Latest JSON files hashed: **${Object.keys(baseline.latest_file_hashes).length}**`,
    `- Adapter JSON files hashed: **${Object.keys(baseline.adapter_file_hashes).length}**`,
    `- Dataset JSON count: **${baseline.dataset_counts.dataset_json_count}**`,
    '',
    '## Known Watch Items',
    '',
    ...(baseline.watch_slots.length > 0
      ? baseline.watch_slots.map((s) => `- ${s}`)
      : ['- None']),
    '',
    '### Active warnings',
    '',
    ...(baseline.warnings.length > 0
      ? baseline.warnings.map((w) => `- ${w}`)
      : ['- None']),
    '',
    '## Regression Comparison',
    '',
    regressionSection,
    '',
    '---',
    '',
    `**Phase:** ${MEMORY_BASELINE_PHASE}`,
    '',
    '**Next phase:** PHASE-18-STATE-ENGINE-FOUNDATION-001',
    '',
  ].join('\n');
}

export function validateComparisonUtility(): { pass: boolean; violations: string[] } {
  const violations: string[] = [];
  const oldBaseline: ProjectMemoryBaseline = {
    baseline_id: 'test_old',
    phase: MEMORY_BASELINE_PHASE,
    captured_at: '2026-06-01T00:00:00.000Z',
    snapshot_date: '2026-06-01',
    release_status: 'RELEASE_PASS',
    release_score: 90,
    project_status: 'READY_FOR_TEST',
    aggregate_risk: 20,
    identity_risk: 10,
    generation_risk: 15,
    conflict_risk: 12,
    actual_pass_rate: 0.85,
    adjusted_pass_rate: 0.9,
    safe_slots: ['slot-a'],
    watch_slots: [],
    skip_slots: [],
    latest_file_hashes: { 'exports/image_app/latest/a.json': 'hash_a_old' },
    adapter_file_hashes: { 'exports/image_app/adapters/b.json': 'hash_b' },
    dataset_counts: {
      dataset_json_count: 90,
      latest_json_count: 17,
      adapters_json_count: 15,
      verify_script_count: 100,
      export_json_count: 200,
    },
    verify_command_results: [],
    protected_files: [],
    warnings: ['warning-one'],
    release_pipeline_verdict: 'PASS',
  };

  const newBaseline: ProjectMemoryBaseline = {
    ...oldBaseline,
    baseline_id: 'test_new',
    captured_at: '2026-06-05T00:00:00.000Z',
    release_status: 'RELEASE_PASS_WITH_WARNING',
    release_score: 78,
    aggregate_risk: 32,
    actual_pass_rate: 0.73,
    latest_file_hashes: { 'exports/image_app/latest/a.json': 'hash_a_new' },
    adapter_file_hashes: {
      'exports/image_app/adapters/b.json': 'hash_b',
      'exports/image_app/adapters/c.json': 'hash_c',
    },
    warnings: ['warning-one', 'warning-two'],
    watch_slots: ['slot-b'],
  };

  const comparison = compareProjectMemoryBaselines(oldBaseline, newBaseline);

  if (comparison.risk_delta.aggregate_risk !== 12) {
    violations.push('risk_delta.aggregate_risk incorrect');
  }
  if (comparison.file_hash_changes.length !== 1) {
    violations.push('file_hash_changes should detect one latest hash change');
  }
  if (comparison.new_files.length !== 1) {
    violations.push('new_files should detect one adapter file');
  }
  if (comparison.new_warnings.length !== 1 || comparison.new_warnings[0] !== 'warning-two') {
    violations.push('new_warnings detection failed');
  }
  if (comparison.status_change.release_status.to !== 'RELEASE_PASS_WITH_WARNING') {
    violations.push('status_change release_status incorrect');
  }

  return { pass: violations.length === 0, violations };
}

export function writeProjectMemoryBaselineReport(projectRoot?: string): ProjectMemoryBaselineReport {
  const root = resolveProjectRoot(projectRoot);
  const baseline = captureProjectMemoryBaseline(root);
  const snapshotPath = writeMemorySnapshot(root, baseline);
  const snapshotFile = path.basename(snapshotPath);
  const previous = findPreviousBaseline(root, snapshotFile);

  let comparison: BaselineComparison | null = null;
  if (previous && previous.baseline_id !== baseline.baseline_id) {
    comparison = compareProjectMemoryBaselines(previous, baseline);
  }

  const alias = updateLatestStableAlias(root, baseline, snapshotPath);
  const utilityCheck = validateComparisonUtility();

  const report: ProjectMemoryBaselineReport = {
    baseline_id: baseline.baseline_id,
    phase: MEMORY_BASELINE_PHASE,
    captured_at: baseline.captured_at,
    current_release_status: String(baseline.release_status),
    current_risk: baseline.aggregate_risk,
    stable_alias_updated: alias.approved,
    snapshot_path: snapshotPath,
    alias_path: LATEST_STABLE_ALIAS_PATH,
    comparison_to_previous_if_exists: comparison,
    final_verdict: utilityCheck.pass
      ? MEMORY_BASELINE_PASS_VERDICT
      : MEMORY_BASELINE_FAIL_VERDICT,
  };

  const payload = {
    ...report,
    report_type: 'project_memory_baseline_report',
    report_version: 'v1',
    export_path: MEMORY_BASELINE_REPORT_PATH,
    baseline_snapshot: {
      release_score: baseline.release_score,
      release_status: baseline.release_status,
      dataset_counts: baseline.dataset_counts,
      verify_steps_passed: baseline.verify_command_results.filter((s) => s.passed).length,
      verify_steps_total: baseline.verify_command_results.length,
    },
    next_phase: 'PHASE-18-STATE-ENGINE-FOUNDATION-001',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, MEMORY_BASELINE_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEMORY_BASELINE_MD_PATH),
    renderMemoryBaselineMarkdown(baseline, report),
    'utf8'
  );

  return report;
}
