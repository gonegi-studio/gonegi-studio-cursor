import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  writeGovernedReport,
} from './exportGovernance.js';
import { syncImageAppLatestUploadBundle } from './imageAppExportGovernance.js';
import {
  INITIAL_MV_ARCHETYPE_IDS,
  INSTRUMENTAL_MV_ADAPTER_PATH,
  INSTRUMENTAL_MV_INDEX_PATH,
  INSTRUMENTAL_MV_LIBRARY_PATH,
  REQUIRED_MV_ARCHETYPE_FIELDS,
  VALIDATED_SYSTEM_REFS,
  buildInstrumentalMvAdapterFromLibrary,
  loadInstrumentalMvAdapter,
  loadInstrumentalMvIndex,
  loadInstrumentalMvLibrary,
  resolveInstrumentalMvByArchetypeId,
  type MvArchetypeRecord,
} from './instrumentalMvDataset.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export type InstrumentalMvVerdict =
  | 'PASS_INSTRUMENTAL_MV_DATASET_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type InstrumentalMvViolation = {
  code: string;
  message: string;
  field?: string;
};

export type InstrumentalMvAuditReport = {
  report_type: 'instrumental_mv_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-MV-DATASET-001';
  generated_at: string;
  archetype_count: number;
  target_archetype_count: number;
  validation: {
    library_exists: boolean;
    index_exists: boolean;
    adapter_exists: boolean;
    adapter_synced_to_latest: boolean;
    required_archetypes_present: boolean;
    all_validated_systems_connected: boolean;
    adapter_chain_complete: boolean;
    scene_sequences_exported: boolean;
    precheck_pass: boolean;
  };
  validated_system_refs: typeof VALIDATED_SYSTEM_REFS;
  export_path: typeof INSTRUMENTAL_MV_ADAPTER_PATH;
  report_path: string;
  library_path: typeof INSTRUMENTAL_MV_LIBRARY_PATH;
  index_path: typeof INSTRUMENTAL_MV_INDEX_PATH;
  final_verdict: InstrumentalMvVerdict;
  violations: readonly InstrumentalMvViolation[];
  next_phases: readonly string[];
};

const REPORT_FILE = 'instrumental-mv-adapter-report.json';

const RKB_SCORECARD_PATHS = {
  rkb_004: 'datasets/render_feedback/RKB-004_SCORECARD.json',
  rkb_005: 'datasets/render_feedback/RKB-005_SCORECARD.json',
  rkb_006: 'datasets/render_feedback/RKB-006_SCORECARD.json',
  rkb_007: 'datasets/render_feedback/RKB-007_SCORECARD.json',
} as const;

const RKB_EXPECTED_VERDICTS = {
  rkb_004: 'PASS_RKB_004_INDOOR_LOCATION_VALIDATION',
  rkb_005: 'PASS_RKB_005_LIGHTING_VALIDATION',
  rkb_006: 'PASS_RKB_006_COVERAGE_VALIDATION',
  rkb_007: 'PASS_RKB_007_EMOTION_ACTING_VALIDATION',
} as const;

function readJson<T>(projectRoot: string, relativePath: string): T | null {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function readScorecardVerdict(relativePath: string, root: string): string | null {
  const doc = readJson<{ final_verdict?: string }>(root, relativePath);
  return doc?.final_verdict ?? null;
}

export function runInstrumentalMvPrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  for (const [key, relativePath] of Object.entries(RKB_SCORECARD_PATHS)) {
    const verdict = readScorecardVerdict(relativePath, root);
    const expected = RKB_EXPECTED_VERDICTS[key as keyof typeof RKB_EXPECTED_VERDICTS];
    if (verdict !== expected) {
      violations.push(`Expected ${expected} for ${relativePath}, got ${verdict ?? 'missing'}`);
    }
  }

  return { pass: violations.length === 0, violations };
}

function hasRequiredArchetypeFields(archetype: MvArchetypeRecord): boolean {
  return REQUIRED_MV_ARCHETYPE_FIELDS.every((field) => {
    const value = archetype[field as keyof MvArchetypeRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

function entryIntegratesValidatedSystems(
  entry: ReturnType<typeof loadInstrumentalMvAdapter>['archetype_to_sequence_map'][number]
): boolean {
  const tokenBlob = entry.render_payload.mv_tokens.join('\n');
  return (
    tokenBlob.includes('emotion-id:') &&
    tokenBlob.includes('coverage-id:') &&
    tokenBlob.includes('lighting-anchor:') &&
    tokenBlob.includes('location:') &&
    tokenBlob.includes('character:') &&
    entry.scene_sequence.length > 0 &&
    entry.coverage_sequence.length > 0 &&
    entry.emotion_sequence.length > 0
  );
}

function auditInstrumentalMvSystem(projectRoot?: string): InstrumentalMvAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: InstrumentalMvViolation[] = [];

  const precheck = runInstrumentalMvPrecheck(root);
  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeReport(violations, 'FAIL_PRECHECK', 0);
  }

  let library: ReturnType<typeof loadInstrumentalMvLibrary>;
  let index: ReturnType<typeof loadInstrumentalMvIndex>;

  try {
    library = loadInstrumentalMvLibrary(root);
    index = loadInstrumentalMvIndex(root);
  } catch (error) {
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Instrumental MV JSON parse failed',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', 0);
  }

  for (const [systemId, refPath] of Object.entries(VALIDATED_SYSTEM_REFS)) {
    if (!fs.existsSync(path.join(root, refPath))) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Validated system reference missing: ${systemId} → ${refPath}`,
        field: systemId,
      });
    }
  }

  const archetypeIds = new Set<string>();
  for (const archetype of library.archetypes) {
    archetypeIds.add(archetype.mv_archetype_id);
    if (!hasRequiredArchetypeFields(archetype)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Archetype ${archetype.mv_archetype_id} missing required schema fields`,
        field: archetype.mv_archetype_id,
      });
    }
    if (!archetype.scene_blueprints || archetype.scene_blueprints.length === 0) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Archetype ${archetype.mv_archetype_id} missing scene_blueprints`,
        field: archetype.mv_archetype_id,
      });
    }
  }

  for (const target of INITIAL_MV_ARCHETYPE_IDS) {
    if (!archetypeIds.has(target)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Initial MV archetype missing: ${target}`,
        field: target,
      });
    }
  }

  if (index.entries.length !== library.archetypes.length) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Index entry count must match library archetype count',
    });
  }

  const rebuiltAdapter = buildInstrumentalMvAdapterFromLibrary(library, index);
  publishGovernedExport({
    projectRoot: root,
    relativePath: INSTRUMENTAL_MV_ADAPTER_PATH,
    datasetName: 'instrumental-mv-adapter',
    datasetVersion: 'v1',
    datasetType: 'instrumental_mv_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);

  const latestPath = path.join(root, 'exports/image_app/latest/instrumental-mv-adapter.json');
  const adapterPath = path.join(root, INSTRUMENTAL_MV_ADAPTER_PATH);
  const adapterSynced =
    fs.existsSync(latestPath) &&
    fs.existsSync(adapterPath) &&
    fs.readFileSync(latestPath, 'utf8') === fs.readFileSync(adapterPath, 'utf8');

  if (!adapterSynced) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'instrumental-mv-adapter.json must be synced to exports/image_app/latest/',
    });
  }

  const adapter = loadInstrumentalMvAdapter(root);
  const systemsConnected = adapter.archetype_to_sequence_map.every(entryIntegratesValidatedSystems);
  if (!systemsConnected) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'archetype_to_sequence_map entries must integrate character, location, lighting, coverage, and emotion tokens',
      field: 'archetype_to_sequence_map',
    });
  }

  let resolverOk = true;
  for (const archetypeId of INITIAL_MV_ARCHETYPE_IDS) {
    const resolution = resolveInstrumentalMvByArchetypeId(archetypeId, root);
    if (!resolution) {
      resolverOk = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Resolver failed for mv_archetype_id ${archetypeId}`,
        field: archetypeId,
      });
    }
  }

  const adapterChainComplete =
    Array.isArray(rebuiltAdapter.adapter_responsibility_chain) &&
    (rebuiltAdapter.adapter_responsibility_chain as string[]).length === 5;

  if (!adapterChainComplete) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'adapter_responsibility_chain must contain five resolution steps',
    });
  }

  const verdict: InstrumentalMvVerdict =
    violations.length === 0 ? 'PASS_INSTRUMENTAL_MV_DATASET_V1' : 'NEEDS_REFINEMENT';

  const report = finalizeReport(violations, verdict, library.archetypes.length, {
    library_exists: true,
    index_exists: true,
    adapter_exists: fs.existsSync(adapterPath),
    adapter_synced_to_latest: adapterSynced,
    required_archetypes_present: INITIAL_MV_ARCHETYPE_IDS.every((id) => archetypeIds.has(id)),
    all_validated_systems_connected: systemsConnected && resolverOk,
    adapter_chain_complete: adapterChainComplete,
    scene_sequences_exported: adapter.archetype_to_sequence_map.every(
      (e) => e.scene_sequence.length > 0
    ),
    precheck_pass: precheck.pass,
  });

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: InstrumentalMvViolation[],
  verdict: InstrumentalMvVerdict,
  archetypeCount: number,
  validation?: InstrumentalMvAuditReport['validation']
): InstrumentalMvAuditReport {
  return {
    report_type: 'instrumental_mv_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-MV-DATASET-001',
    generated_at: new Date().toISOString(),
    archetype_count: archetypeCount,
    target_archetype_count: INITIAL_MV_ARCHETYPE_IDS.length,
    validation: {
      library_exists: validation?.library_exists ?? false,
      index_exists: validation?.index_exists ?? false,
      adapter_exists: validation?.adapter_exists ?? false,
      adapter_synced_to_latest: validation?.adapter_synced_to_latest ?? false,
      required_archetypes_present: validation?.required_archetypes_present ?? false,
      all_validated_systems_connected: validation?.all_validated_systems_connected ?? false,
      adapter_chain_complete: validation?.adapter_chain_complete ?? false,
      scene_sequences_exported: validation?.scene_sequences_exported ?? false,
      precheck_pass: validation?.precheck_pass ?? false,
    },
    validated_system_refs: VALIDATED_SYSTEM_REFS,
    export_path: INSTRUMENTAL_MV_ADAPTER_PATH,
    report_path: `${IMAGE_APP_REPORTS_DIR}/${REPORT_FILE}`,
    library_path: INSTRUMENTAL_MV_LIBRARY_PATH,
    index_path: INSTRUMENTAL_MV_INDEX_PATH,
    final_verdict: verdict,
    violations: Object.freeze([...violations]),
    next_phases: Object.freeze([
      'RKB-008 INSTRUMENTAL_MV_PIPELINE_VALIDATION',
      'BALLAD_MV_DATASET_V1',
    ]),
  };
}

export function runInstrumentalMvAudit(projectRoot?: string): InstrumentalMvAuditReport {
  return auditInstrumentalMvSystem(projectRoot);
}
