import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  writeGovernedReport,
} from './exportGovernance.js';
import { syncImageAppLatestUploadBundle } from './imageAppExportGovernance.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  COVERAGE_GRAMMAR_INDEX_PATH,
  COVERAGE_GRAMMAR_LIBRARY_PATH,
  COVERAGE_PATTERN_IDS,
  REQUIRED_COVERAGE_FIELDS,
  REQUIRED_COVERAGE_TOKENS,
  SHOT_GRAMMAR_ADAPTER_PATH,
  buildShotGrammarAdapterFromLibrary,
  loadCoverageGrammarIndex,
  loadCoverageGrammarLibrary,
  loadShotGrammarAdapter,
  resolveCoverageFromAdapterMap,
  validateCoverageSequence,
  type CoverageRecord,
} from './shotGrammar.js';

export type ShotGrammarVerdict =
  | 'PASS_CINEMATIC_COVERAGE_GRAMMAR_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type ShotGrammarViolation = {
  code: string;
  message: string;
  field?: string;
};

export type ShotGrammarAuditReport = {
  report_type: 'shot_grammar_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-SHOT-GRAMMAR-001';
  generated_at: string;
  coverage_count: number;
  target_coverage_count: number;
  validation: {
    library_exists: boolean;
    index_exists: boolean;
    adapter_exists: boolean;
    adapter_synced_to_latest: boolean;
    no_forbidden_latest_pollution: boolean;
    coverage_sequences_valid: boolean;
    no_medium_repeat_chains: boolean;
    tokens_exported: boolean;
    adapter_chain_complete: boolean;
    precheck_pass: boolean;
  };
  export_path: typeof SHOT_GRAMMAR_ADAPTER_PATH;
  report_path: string;
  library_path: typeof COVERAGE_GRAMMAR_LIBRARY_PATH;
  index_path: typeof COVERAGE_GRAMMAR_INDEX_PATH;
  final_verdict: ShotGrammarVerdict;
  violations: readonly ShotGrammarViolation[];
  next_phases: readonly string[];
};

const REPORT_FILE = 'shot-grammar-adapter-report.json';

const PRECHECK_PATHS = [
  'datasets/render_feedback/RKB-004_SCORECARD.json',
  'datasets/render_feedback/RKB-005_SCORECARD.json',
  'exports/image_app/latest',
  'exports/image_app/adapters',
] as const;

const LATEST_FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /^rkb-/i,
  /-report\./i,
  /-test-batch\./i,
];

function readScorecardVerdict(relativePath: string, root: string): string | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  try {
    const doc = JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as {
      final_verdict?: string;
      verdict?: string;
    };
    return doc.final_verdict ?? doc.verdict ?? null;
  } catch {
    return null;
  }
}

function runPrecheck(root: string): ShotGrammarViolation[] {
  const violations: ShotGrammarViolation[] = [];

  for (const relativePath of PRECHECK_PATHS) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
      violations.push({
        code: 'FAIL_PRECHECK',
        message: `Missing precheck path: ${relativePath}`,
        field: relativePath,
      });
    }
  }

  const rkb004 = readScorecardVerdict('datasets/render_feedback/RKB-004_SCORECARD.json', root);
  if (rkb004 !== 'PASS_RKB_004_INDOOR_LOCATION_VALIDATION') {
    violations.push({
      code: 'FAIL_PRECHECK',
      message: `RKB-004 must pass; got ${rkb004 ?? 'missing'}`,
      field: 'RKB-004_SCORECARD.json',
    });
  }

  const rkb005 = readScorecardVerdict('datasets/render_feedback/RKB-005_SCORECARD.json', root);
  if (rkb005 !== 'PASS_RKB_005_LIGHTING_VALIDATION') {
    violations.push({
      code: 'FAIL_PRECHECK',
      message: `RKB-005 must pass; got ${rkb005 ?? 'missing'}`,
      field: 'RKB-005_SCORECARD.json',
    });
  }

  const governanceReportPath = path.join(
    root,
    'exports/image_app/reports/image-app-export-governance-report.json'
  );
  if (fs.existsSync(governanceReportPath)) {
    try {
      const governance = JSON.parse(fs.readFileSync(governanceReportPath, 'utf8')) as {
        final_verdict?: string;
      };
      if (governance.final_verdict !== 'PASS_IMAGE_APP_EXPORT_GOVERNANCE_V1') {
        violations.push({
          code: 'FAIL_PRECHECK',
          message: `Export governance must pass; got ${governance.final_verdict ?? 'unknown'}`,
          field: 'image-app-export-governance-report.json',
        });
      }
    } catch {
      violations.push({
        code: 'FAIL_PRECHECK',
        message: 'Could not parse image-app-export-governance-report.json',
      });
    }
  }

  return violations;
}

function hasRequiredCoverageFields(coverage: CoverageRecord): boolean {
  return REQUIRED_COVERAGE_FIELDS.every((field) => {
    const value = coverage[field as keyof CoverageRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });
}

function entryExportsRequiredTokens(
  entry: ReturnType<typeof loadShotGrammarAdapter>['scene_to_coverage_map'][number]
): boolean {
  const tokenBlob = [
    ...entry.render_payload.coverage_tokens,
    ...entry.render_payload.shot_steps.flatMap((step) => step.coverage_tokens),
  ].join('\n');

  return REQUIRED_COVERAGE_TOKENS.every((prefix) => tokenBlob.includes(prefix));
}

function auditShotGrammarSystem(projectRoot?: string): ShotGrammarAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: ShotGrammarViolation[] = [...runPrecheck(root)];

  let library: ReturnType<typeof loadCoverageGrammarLibrary>;
  let index: ReturnType<typeof loadCoverageGrammarIndex>;

  try {
    library = loadCoverageGrammarLibrary(root);
    index = loadCoverageGrammarIndex(root);
  } catch (error) {
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Failed to load coverage grammar assets',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', 0);
  }

  if (violations.some((v) => v.code === 'FAIL_PRECHECK')) {
    return finalizeReport(violations, 'FAIL_PRECHECK', library.coverages.length);
  }

  const coverageIds = new Set<string>();
  let duplicateIds = 0;
  for (const coverage of library.coverages) {
    if (coverageIds.has(coverage.coverage_id)) duplicateIds += 1;
    coverageIds.add(coverage.coverage_id);

    if (!hasRequiredCoverageFields(coverage)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Coverage missing required schema fields: ${coverage.coverage_id}`,
        field: coverage.coverage_id,
      });
    }

    const sequenceCheck = validateCoverageSequence(coverage.coverage_sequence);
    if (!sequenceCheck.valid) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Invalid coverage sequence for ${coverage.coverage_id}: ${sequenceCheck.violations.join(', ')}`,
        field: coverage.coverage_id,
      });
    }
  }

  if (duplicateIds > 0) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Duplicate coverage_id entries in library',
    });
  }

  for (const targetId of COVERAGE_PATTERN_IDS) {
    if (!coverageIds.has(targetId)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Missing core coverage pattern: ${targetId}`,
        field: targetId,
      });
    }
  }

  if (index.entries.length !== library.coverages.length) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Index entry count must match library coverage count',
    });
  }

  const rebuiltAdapter = buildShotGrammarAdapterFromLibrary(library, index);
  publishGovernedExport({
    projectRoot: root,
    relativePath: SHOT_GRAMMAR_ADAPTER_PATH,
    datasetName: 'shot-grammar-adapter',
    datasetVersion: 'v1',
    datasetType: 'shot_grammar_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);

  const latestAdapterPath = path.join(root, 'exports/image_app/latest/shot-grammar-adapter.json');
  const adaptersAdapterPath = path.join(root, SHOT_GRAMMAR_ADAPTER_PATH);
  const adapterSynced =
    fs.existsSync(latestAdapterPath) &&
    fs.existsSync(adaptersAdapterPath) &&
    fs.readFileSync(latestAdapterPath, 'utf8') === fs.readFileSync(adaptersAdapterPath, 'utf8');

  if (!adapterSynced) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'shot-grammar-adapter.json must be synced to exports/image_app/latest/',
      field: 'latest/shot-grammar-adapter.json',
    });
  }

  const latestDir = path.join(root, 'exports/image_app/latest');
  const latestFiles = fs.existsSync(latestDir) ? fs.readdirSync(latestDir) : [];
  const forbiddenInLatest = latestFiles.filter((file) =>
    LATEST_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(file))
  );
  if (forbiddenInLatest.length > 0) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Forbidden latest pollution: ${forbiddenInLatest.join(', ')}`,
    });
  }

  const adapter = loadShotGrammarAdapter(root);
  const tokensExported = adapter.scene_to_coverage_map.every(entryExportsRequiredTokens);
  if (!tokensExported) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'scene_to_coverage_map entries must export coverage-id, shot-type, coverage-step, coverage-purpose, forbidden-repeat, anchor-visibility tokens',
      field: 'scene_to_coverage_map',
    });
  }

  let resolverOk = true;
  for (const entry of adapter.scene_to_coverage_map) {
    const resolution = resolveCoverageFromAdapterMap(
      {
        scene_archetype: entry.scene_archetype,
        location_id: entry.location_id,
        lighting_anchor_id: entry.lighting_anchor_id,
        action_type: entry.action_type,
      },
      root
    );
    if (!resolution) {
      resolverOk = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Resolver failed for ${entry.scene_archetype}/${entry.location_id}`,
      });
    }
  }

  const adapterChainComplete =
    Array.isArray(rebuiltAdapter.adapter_responsibility_chain) &&
    (rebuiltAdapter.adapter_responsibility_chain as string[]).length === 7;

  if (!adapterChainComplete) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'adapter_responsibility_chain must contain seven resolution steps',
    });
  }

  const sequencesValid = !violations.some((v) => v.message.includes('Invalid coverage sequence'));
  const noMediumChains = library.coverages.every((coverage) => {
    const check = validateCoverageSequence(coverage.coverage_sequence);
    return !check.violations.includes('medium_then_medium_then_medium');
  });

  const verdict: ShotGrammarVerdict =
    violations.length === 0 ? 'PASS_CINEMATIC_COVERAGE_GRAMMAR_V1' : 'NEEDS_REFINEMENT';

  const report = finalizeReport(violations, verdict, library.coverages.length, {
    library_exists: true,
    index_exists: true,
    adapter_exists: fs.existsSync(path.join(root, SHOT_GRAMMAR_ADAPTER_PATH)),
    adapter_synced_to_latest: adapterSynced,
    no_forbidden_latest_pollution: forbiddenInLatest.length === 0,
    coverage_sequences_valid: sequencesValid,
    no_medium_repeat_chains: noMediumChains,
    tokens_exported: tokensExported,
    adapter_chain_complete: adapterChainComplete,
    precheck_pass: !violations.some((v) => v.code === 'FAIL_PRECHECK'),
  });

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: ShotGrammarViolation[],
  verdict: ShotGrammarVerdict,
  coverageCount: number,
  validation?: ShotGrammarAuditReport['validation']
): ShotGrammarAuditReport {
  return {
    report_type: 'shot_grammar_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-SHOT-GRAMMAR-001',
    generated_at: new Date().toISOString(),
    coverage_count: coverageCount,
    target_coverage_count: COVERAGE_PATTERN_IDS.length,
    validation: {
      library_exists: validation?.library_exists ?? false,
      index_exists: validation?.index_exists ?? false,
      adapter_exists: validation?.adapter_exists ?? false,
      adapter_synced_to_latest: validation?.adapter_synced_to_latest ?? false,
      no_forbidden_latest_pollution: validation?.no_forbidden_latest_pollution ?? false,
      coverage_sequences_valid: validation?.coverage_sequences_valid ?? false,
      no_medium_repeat_chains: validation?.no_medium_repeat_chains ?? false,
      tokens_exported: validation?.tokens_exported ?? false,
      adapter_chain_complete: validation?.adapter_chain_complete ?? false,
      precheck_pass: validation?.precheck_pass ?? false,
    },
    export_path: SHOT_GRAMMAR_ADAPTER_PATH,
    report_path: `${IMAGE_APP_REPORTS_DIR}/${REPORT_FILE}`,
    library_path: COVERAGE_GRAMMAR_LIBRARY_PATH,
    index_path: COVERAGE_GRAMMAR_INDEX_PATH,
    final_verdict: verdict,
    violations: Object.freeze([...violations]),
    next_phases: Object.freeze(['RKB-006 COVERAGE_VALIDATION']),
  };
}

export function runShotGrammarAudit(projectRoot?: string): ShotGrammarAuditReport {
  return auditShotGrammarSystem(projectRoot);
}
