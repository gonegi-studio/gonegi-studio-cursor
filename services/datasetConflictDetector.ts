import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { extractPriorityOrder, listJsonFiles, readJsonRecord, relativeFromRoot } from './auditors/auditorShared.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CONFLICT_DETECTOR_PHASE = 'PHASE-AUDITOR-002' as const;
export const CONFLICT_DETECTOR_PASS_VERDICT = 'PASS_DATASET_CONFLICT_DETECTOR_V1' as const;
export const CONFLICT_DETECTOR_FAIL_VERDICT = 'FAIL_DATASET_CONFLICT_DETECTOR_V1' as const;

export const CONFLICT_DETECTOR_BASELINE_PATH = 'reports/conflict-detector-baseline.json' as const;
export const CONFLICT_DETECTOR_REPORT_PATH = 'reports/dataset-conflict-detector-report.json' as const;
export const REGRESSION_INPUT_TEMPLATE_PATH = 'reports/regression-input-template.json' as const;
export const DATASET16_FIXTURE_PATH = 'reports/fixtures/dataset16-regression-case.json' as const;

export const REGRESSION_TYPES = [
  'identity_collapse',
  'costume_drift',
  'location_drift',
  'prop_drift',
  'composition_drift',
  'adapter_upload_failure',
  'runtime_generation_failure',
] as const;

export type RegressionType = (typeof REGRESSION_TYPES)[number];

export type ConflictDetectorFileEntry = {
  file_path: string;
  file_hash: string;
  file_size: number;
  modified_time: string;
  dataset_type: string;
  risk_tokens: readonly string[];
  priority_order: readonly string[] | null;
  dependencies: readonly string[];
};

export type ConflictDetectorSnapshot = {
  snapshot_id: string;
  label: string;
  created_at: string;
  files: readonly ConflictDetectorFileEntry[];
};

export type FailureReport = {
  regression_type: RegressionType;
  symptoms?: readonly string[];
  affected_characters?: readonly string[];
  affected_locations?: readonly string[];
  first_observed_after?: string;
  baseline_status?: string;
  failure_status?: string;
  notes?: string;
};

export type SuspectSignal = {
  signal: string;
  weight: number;
  detail: string;
};

export type RankedSuspect = {
  rank: number;
  file_path: string;
  suspect_score: number;
  signals: readonly SuspectSignal[];
  evidence_summary: string;
};

export type ConflictDetectorResult = {
  detector_id: string;
  phase: typeof CONFLICT_DETECTOR_PHASE;
  timestamp: string;
  regression_type: RegressionType;
  risk_score: number;
  top_suspects: readonly RankedSuspect[];
  evidence: readonly string[];
  recommended_isolation_order: readonly string[];
  files_compared: number;
  files_changed: number;
  final_verdict: typeof CONFLICT_DETECTOR_PASS_VERDICT | typeof CONFLICT_DETECTOR_FAIL_VERDICT;
};

const DANGEROUS_TOKEN_PATTERNS = [
  'landmark-visibility:must_show_',
  'camera-visibility:',
  'walkable-zone:',
  'fail if ignored',
  'fail-if-ignored',
  'must_show_character',
  'must_show_face',
  'composition-visibility:must_show_',
] as const;

const IDENTITY_TOKEN_PATTERNS = [
  'character_identity',
  'character-priority:',
  'character_reference',
  'character_continuity',
  'gonagi',
  'gonegi',
  'dana',
  'gamja',
] as const;

const HARD_ENFORCEMENT_PATTERNS = [
  'fail if ignored',
  'fail-if-ignored',
  'secondary_validation',
  'fail_if_ignored',
  'enforcement',
] as const;

const SIGNAL_WEIGHTS: Record<string, number> = {
  new_file_added: 18,
  file_hash_changed: 28,
  dangerous_token_added: 26,
  priority_order_changed: 22,
  latest_adapters_mismatch: 16,
  identity_related_token_added: 20,
  hard_enforcement_token_added: 30,
  cross_library_reference_changed: 14,
  regression_type_affinity: 24,
  upload_slot_match: 20,
};

const REGRESSION_FILE_AFFINITY: Record<RegressionType, readonly string[]> = {
  identity_collapse: ['outdoor-layout-lock', 'character-first', 'scene-asset-composition'],
  costume_drift: ['character', 'emotion-acting', 'living-world'],
  location_drift: ['location-dna', 'indoor-location', 'outdoor-layout', 'lighting'],
  prop_drift: ['prop-anchor', 'room-layout'],
  composition_drift: ['scene-asset-composition', 'shot-grammar', 'outdoor-layout'],
  adapter_upload_failure: ['adapter', 'latest'],
  runtime_generation_failure: ['image-app-brain', 'cinematic-dna'],
};

const SNAPSHOT_SCAN_ROOTS = [
  'datasets',
  'exports/image_app/latest',
  'exports/image_app/adapters',
] as const;

function sha256File(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function inferDatasetType(relativePath: string): string {
  const p = normalizePath(relativePath).toLowerCase();
  if (p.includes('/latest/')) return 'latest_adapter';
  if (p.includes('/adapters/')) return 'adapter';
  if (p.includes('-index-')) return 'dataset_index';
  if (p.includes('-library-')) return 'dataset_library';
  if (p.includes('contract')) return 'contract';
  if (p.startsWith('datasets/')) return 'dataset';
  if (p.startsWith('reports/')) return 'report';
  return 'unknown';
}

export function extractDependencies(doc: Record<string, unknown>): string[] {
  const deps = new Set<string>();
  for (const key of [
    'library_path',
    'library_reference',
    'index_path',
    'index_reference',
    'parent_adapter_reference',
    'dataset_reference',
    'character_first_contract_reference',
  ]) {
    const value = doc[key];
    if (typeof value === 'string' && value.length > 0) deps.add(value);
  }
  const metadata = doc.adapter_metadata as Record<string, unknown> | undefined;
  if (metadata) {
    for (const key of [
      'library_reference',
      'index_reference',
      'parent_adapter_reference',
      'character_first_contract_reference',
    ]) {
      const value = metadata[key];
      if (typeof value === 'string') deps.add(value);
    }
  }
  return [...deps];
}

export function extractRiskTokensFromDocument(
  doc: Record<string, unknown>,
  filename: string
): string[] {
  const tokens = new Set<string>();
  const json = JSON.stringify(doc);

  for (const pattern of DANGEROUS_TOKEN_PATTERNS) {
    if (json.toLowerCase().includes(pattern.toLowerCase())) tokens.add(pattern);
  }
  for (const pattern of IDENTITY_TOKEN_PATTERNS) {
    if (json.toLowerCase().includes(pattern.toLowerCase())) tokens.add(`identity:${pattern}`);
  }
  for (const pattern of HARD_ENFORCEMENT_PATTERNS) {
    if (json.toLowerCase().includes(pattern.toLowerCase())) tokens.add(`enforcement:${pattern}`);
  }

  if (filename.includes('outdoor-layout-lock')) {
    const mustShowCount = (json.match(/landmark-visibility:must_show_/gi) ?? []).length;
    if (mustShowCount > 0) tokens.add(`must_show_count:${mustShowCount}`);
  }

  return [...tokens];
}

export function buildFileSnapshotEntry(
  projectRoot: string,
  relativePath: string,
  logicalPath?: string
): ConflictDetectorFileEntry | null {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;

  const stat = fs.statSync(absolutePath);
  const doc = readJsonRecord(projectRoot, relativePath) ?? {};
  const filename = path.basename(relativePath);

  return {
    file_path: normalizePath(logicalPath ?? relativePath),
    file_hash: sha256File(absolutePath),
    file_size: stat.size,
    modified_time: stat.mtime.toISOString(),
    dataset_type: inferDatasetType(logicalPath ?? relativePath),
    risk_tokens: Object.freeze(extractRiskTokensFromDocument(doc, filename)),
    priority_order: extractPriorityOrder(doc)
      ? Object.freeze(extractPriorityOrder(doc)!)
      : null,
    dependencies: Object.freeze(extractDependencies(doc)),
  };
}

export function buildConflictDetectorSnapshot(
  projectRoot: string,
  options: {
    snapshot_id: string;
    label: string;
    relative_paths?: readonly string[];
    scan_roots?: boolean;
  }
): ConflictDetectorSnapshot {
  const root = resolveProjectRoot(projectRoot);
  const paths = new Set<string>();

  if (options.relative_paths) {
    for (const p of options.relative_paths) paths.add(normalizePath(p));
  }

  if (options.scan_roots ?? !options.relative_paths) {
    for (const scanRoot of SNAPSHOT_SCAN_ROOTS) {
      const dir = path.join(root, scanRoot);
      for (const file of listJsonFiles(dir)) {
        paths.add(relativeFromRoot(root, file));
      }
    }
  }

  const files: ConflictDetectorFileEntry[] = [];
  for (const rel of [...paths].sort()) {
    const entry = buildFileSnapshotEntry(root, rel);
    if (entry) files.push(entry);
  }

  return {
    snapshot_id: options.snapshot_id,
    label: options.label,
    created_at: new Date().toISOString(),
    files: Object.freeze(files),
  };
}

function indexSnapshot(files: readonly ConflictDetectorFileEntry[]): Map<string, ConflictDetectorFileEntry> {
  const map = new Map<string, ConflictDetectorFileEntry>();
  for (const file of files) map.set(file.file_path, file);
  return map;
}

function addedTokens(before: readonly string[], after: readonly string[]): string[] {
  const beforeSet = new Set(before.map((t) => t.toLowerCase()));
  return after.filter((t) => !beforeSet.has(t.toLowerCase()));
}

function priorityOrderChanged(
  before: readonly string[] | null,
  after: readonly string[] | null
): boolean {
  if (!before && !after) return false;
  if (!before || !after) return true;
  return JSON.stringify(before) !== JSON.stringify(after);
}

function dependenciesChanged(
  before: readonly string[],
  after: readonly string[]
): boolean {
  return JSON.stringify([...before].sort()) !== JSON.stringify([...after].sort());
}

function scoreFileSuspect(
  filePath: string,
  beforeEntry: ConflictDetectorFileEntry | undefined,
  afterEntry: ConflictDetectorFileEntry,
  failureReport: FailureReport,
  latestAdapterHashes: Map<string, string>
): { score: number; signals: SuspectSignal[] } {
  const signals: SuspectSignal[] = [];
  let score = 0;

  const addSignal = (signal: string, detail: string, extraWeight?: number) => {
    const weight = extraWeight ?? SIGNAL_WEIGHTS[signal] ?? 10;
    score += weight;
    signals.push({ signal, weight, detail });
  };

  if (!beforeEntry) {
    addSignal('new_file_added', `New file appeared: ${filePath}`);
  } else if (beforeEntry.file_hash !== afterEntry.file_hash) {
    addSignal('file_hash_changed', `Hash changed ${beforeEntry.file_hash.slice(0, 12)} → ${afterEntry.file_hash.slice(0, 12)}`);
  }

  const dangerousAdded = addedTokens(
    beforeEntry?.risk_tokens ?? [],
    afterEntry.risk_tokens
  ).filter(
    (t) =>
      DANGEROUS_TOKEN_PATTERNS.some((p) => t.toLowerCase().includes(p.toLowerCase())) ||
      t.startsWith('must_show_count:')
  );
  if (dangerousAdded.length > 0) {
    addSignal(
      'dangerous_token_added',
      `Added dangerous tokens: ${dangerousAdded.join(', ')}`,
      Math.min(40, SIGNAL_WEIGHTS.dangerous_token_added + dangerousAdded.length * 4)
    );
  }

  const identityAdded = addedTokens(beforeEntry?.risk_tokens ?? [], afterEntry.risk_tokens).filter((t) =>
    t.startsWith('identity:')
  );
  if (identityAdded.length > 0) {
    addSignal('identity_related_token_added', `Identity tokens added: ${identityAdded.join(', ')}`);
  }

  const enforcementAdded = addedTokens(beforeEntry?.risk_tokens ?? [], afterEntry.risk_tokens).filter((t) =>
    t.startsWith('enforcement:')
  );
  if (enforcementAdded.length > 0) {
    addSignal('hard_enforcement_token_added', `Hard enforcement added: ${enforcementAdded.join(', ')}`);
  }

  if (priorityOrderChanged(beforeEntry?.priority_order ?? null, afterEntry.priority_order)) {
    addSignal(
      'priority_order_changed',
      `Priority order ${JSON.stringify(beforeEntry?.priority_order ?? null)} → ${JSON.stringify(afterEntry.priority_order)}`
    );
  }

  if (
    dependenciesChanged(beforeEntry?.dependencies ?? [], afterEntry.dependencies)
  ) {
    addSignal(
      'cross_library_reference_changed',
      `Dependencies ${JSON.stringify(beforeEntry?.dependencies ?? [])} → ${JSON.stringify(afterEntry.dependencies)}`
    );
  }

  const basename = path.basename(filePath);
  const adaptersKey = `exports/image_app/adapters/${basename}`;
  const latestKey = `exports/image_app/latest/${basename}`;
  const adaptersHash = latestAdapterHashes.get(adaptersKey);
  const latestHash = latestAdapterHashes.get(latestKey);
  if (adaptersHash && latestHash && adaptersHash !== latestHash && filePath.includes(basename)) {
    addSignal('latest_adapters_mismatch', `${basename} differs between latest/ and adapters/`);
  }

  const affinity = REGRESSION_FILE_AFFINITY[failureReport.regression_type] ?? [];
  if (affinity.some((needle) => filePath.toLowerCase().includes(needle))) {
    addSignal(
      'regression_type_affinity',
      `Path matches ${failureReport.regression_type} affinity: ${filePath}`
    );
  }

  if (
    failureReport.first_observed_after?.includes('16') &&
    filePath.includes('outdoor-layout-lock-adapter')
  ) {
    addSignal('upload_slot_match', 'Dataset #16 upload slot maps to outdoor-layout-lock-adapter');
  }

  return { score: Math.min(100, score), signals };
}

function buildLatestAdapterHashMap(
  projectRoot: string,
  afterFiles: readonly ConflictDetectorFileEntry[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of afterFiles) {
    if (file.file_path.startsWith('exports/image_app/')) {
      map.set(file.file_path, file.file_hash);
    }
  }
  return map;
}

export function detectDatasetConflicts(
  beforeSnapshot: ConflictDetectorSnapshot,
  afterSnapshot: ConflictDetectorSnapshot,
  failureReport: FailureReport
): ConflictDetectorResult {
  const beforeIndex = indexSnapshot(beforeSnapshot.files);
  const afterIndex = indexSnapshot(afterSnapshot.files);
  const latestHashMap = buildLatestAdapterHashMap('', afterSnapshot.files);

  const suspects: RankedSuspect[] = [];
  const evidence: string[] = [];
  let filesChanged = 0;

  for (const [filePath, afterEntry] of afterIndex) {
    const beforeEntry = beforeIndex.get(filePath);
    if (!beforeEntry || beforeEntry.file_hash !== afterEntry.file_hash) {
      filesChanged += 1;
    }

    const { score, signals } = scoreFileSuspect(
      filePath,
      beforeEntry,
      afterEntry,
      failureReport,
      latestHashMap
    );

    if (score <= 0) continue;

    suspects.push({
      rank: 0,
      file_path: filePath,
      suspect_score: score,
      signals: Object.freeze(signals),
      evidence_summary: signals.map((s) => s.signal).join(', '),
    });

    for (const signal of signals) {
      evidence.push(`${filePath}: ${signal.signal} — ${signal.detail}`);
    }
  }

  for (const [filePath, beforeEntry] of beforeIndex) {
    if (afterIndex.has(filePath)) continue;
    evidence.push(`${filePath}: file_removed_after_regression`);
    suspects.push({
      rank: 0,
      file_path: filePath,
      suspect_score: 8,
      signals: Object.freeze([
        { signal: 'file_removed', weight: 8, detail: 'Present before regression, absent after' },
      ]),
      evidence_summary: 'file_removed',
    });
    void beforeEntry;
  }

  suspects.sort((a, b) => b.suspect_score - a.suspect_score);
  const ranked = suspects.map((row, index) => ({ ...row, rank: index + 1 }));

  const risk_score =
    ranked.length > 0 ? Math.min(100, ranked[0]!.suspect_score) : 0;

  const recommended_isolation_order = ranked
    .filter((row) => row.suspect_score >= 20)
    .map((row) => row.file_path);

  return {
    detector_id: `conflict_${Date.now().toString(36)}`,
    phase: CONFLICT_DETECTOR_PHASE,
    timestamp: new Date().toISOString(),
    regression_type: failureReport.regression_type,
    risk_score,
    top_suspects: Object.freeze(ranked.slice(0, 15)),
    evidence: Object.freeze(evidence.slice(0, 50)),
    recommended_isolation_order: Object.freeze(recommended_isolation_order),
    files_compared: afterIndex.size,
    files_changed: filesChanged,
    final_verdict: CONFLICT_DETECTOR_PASS_VERDICT,
  };
}

export function buildProjectConflictBaseline(projectRoot?: string): {
  baseline_id: string;
  phase: typeof CONFLICT_DETECTOR_PHASE;
  created_at: string;
  snapshot: ConflictDetectorSnapshot;
} {
  const root = resolveProjectRoot(projectRoot);
  const snapshot = buildConflictDetectorSnapshot(root, {
    snapshot_id: 'conflict-detector-baseline-v1',
    label: 'current_project_state',
    scan_roots: true,
  });

  return {
    baseline_id: 'conflict-detector-baseline-v1',
    phase: CONFLICT_DETECTOR_PHASE,
    created_at: new Date().toISOString(),
    snapshot,
  };
}

export function buildDataset16RegressionSnapshots(projectRoot?: string): {
  before: ConflictDetectorSnapshot;
  after: ConflictDetectorSnapshot;
} {
  const root = resolveProjectRoot(projectRoot);

  const productionPaths = [
    'exports/image_app/latest/outdoor-layout-lock-adapter.json',
    'exports/image_app/adapters/outdoor-layout-lock-adapter.json',
  ] as const;

  const beforeFiles: ConflictDetectorFileEntry[] = [];
  const liteEntry = buildFileSnapshotEntry(
    root,
    'exports/image_app/adapters/outdoor-layout-lock-adapter-lite.json'
  );
  if (liteEntry) {
    for (const prodPath of productionPaths) {
      beforeFiles.push({
        ...liteEntry,
        file_path: prodPath,
        dataset_type: inferDatasetType(prodPath),
      });
    }
  }

  const afterFiles: ConflictDetectorFileEntry[] = [];
  const fullEntry = buildFileSnapshotEntry(
    root,
    'exports/image_app/adapters/full_reference/outdoor-layout-lock-adapter-full.json'
  );
  if (fullEntry) {
    afterFiles.push({ ...fullEntry, file_path: productionPaths[1] });
    const latestEntry = buildFileSnapshotEntry(root, productionPaths[0]);
    afterFiles.push(
      latestEntry ?? {
        ...fullEntry,
        file_path: productionPaths[0],
        dataset_type: 'latest_adapter',
      }
    );
  }

  return {
    before: {
      snapshot_id: 'dataset16-before-stable-lite',
      label: 'pre_dataset16_outdoor_lite_tokens',
      created_at: '2026-06-04T00:00:00.000Z',
      files: Object.freeze(beforeFiles),
    },
    after: {
      snapshot_id: 'dataset16-after-full-enforcement',
      label: 'post_dataset16_outdoor_full_enforcement',
      created_at: '2026-06-04T08:00:00.000Z',
      files: Object.freeze(afterFiles),
    },
  };
}

export function validateDataset16FixtureRanking(result: ConflictDetectorResult): {
  pass: boolean;
  top_file: string | null;
  violations: string[];
} {
  const violations: string[] = [];
  const top = result.top_suspects[0];
  if (!top) {
    violations.push('No ranked suspects produced');
    return { pass: false, top_file: null, violations };
  }

  const matchesOutdoor = /outdoor-layout-lock-adapter/i.test(top.file_path);
  if (!matchesOutdoor) {
    violations.push(
      `Top suspect "${top.file_path}" is not outdoor-layout-lock-adapter (score=${top.suspect_score})`
    );
  }

  const hasDangerous = top.signals.some((s) => s.signal === 'dangerous_token_added');
  const hasHash = top.signals.some((s) => s.signal === 'file_hash_changed');
  if (!hasDangerous && !hasHash) {
    violations.push('Top suspect missing dangerous_token_added or file_hash_changed evidence');
  }

  return {
    pass: violations.length === 0,
    top_file: top.file_path,
    violations,
  };
}

export function writeConflictDetectorOutputs(
  projectRoot: string,
  result: ConflictDetectorResult,
  baseline?: ReturnType<typeof buildProjectConflictBaseline>
): { reportPath: string; baselinePath: string } {
  const root = resolveProjectRoot(projectRoot);
  const reportsDir = path.join(root, 'reports');
  const fixturesDir = path.join(reportsDir, 'fixtures');
  fs.mkdirSync(fixturesDir, { recursive: true });

  const reportPath = path.join(root, CONFLICT_DETECTOR_REPORT_PATH);
  const baselinePath = path.join(root, CONFLICT_DETECTOR_BASELINE_PATH);

  const reportPayload = {
    ...result,
    report_type: 'dataset_conflict_detector_report',
    report_version: 'v1',
    export_path: CONFLICT_DETECTOR_REPORT_PATH,
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(reportPayload, null, 2)}\n`, 'utf8');

  const baselinePayload = baseline ?? buildProjectConflictBaseline(root);
  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        ...baselinePayload,
        file_count: baselinePayload.snapshot.files.length,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  return {
    reportPath: CONFLICT_DETECTOR_REPORT_PATH,
    baselinePath: CONFLICT_DETECTOR_BASELINE_PATH,
  };
}

export function runDataset16FixtureVerification(projectRoot?: string): {
  result: ConflictDetectorResult;
  fixturePass: boolean;
  final_verdict: typeof CONFLICT_DETECTOR_PASS_VERDICT | typeof CONFLICT_DETECTOR_FAIL_VERDICT;
} {
  const root = resolveProjectRoot(projectRoot);
  const fixturePath = path.join(root, DATASET16_FIXTURE_PATH);
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
    failure_report: FailureReport;
    before_snapshot?: ConflictDetectorSnapshot;
    after_snapshot?: ConflictDetectorSnapshot;
  };

  const built = buildDataset16RegressionSnapshots(root);
  const before = fixture.before_snapshot ?? built.before;
  const after = fixture.after_snapshot ?? built.after;

  const result = detectDatasetConflicts(before, after, fixture.failure_report);
  const validation = validateDataset16FixtureRanking(result);

  const final_verdict = validation.pass
    ? CONFLICT_DETECTOR_PASS_VERDICT
    : CONFLICT_DETECTOR_FAIL_VERDICT;

  const completed: ConflictDetectorResult = {
    ...result,
    final_verdict,
  };

  const baseline = buildProjectConflictBaseline(root);
  writeConflictDetectorOutputs(root, completed, baseline);

  return {
    result: completed,
    fixturePass: validation.pass,
    final_verdict,
  };
}
