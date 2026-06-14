import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  writeGovernedReport,
} from './exportGovernance.js';
import { syncImageAppLatestUploadBundle } from './imageAppExportGovernance.js';
import {
  BALLAD_MV_ADAPTER_PATH,
  BALLAD_MV_INDEX_PATH,
  BALLAD_MV_LIBRARY_PATH,
  BALLAD_VALIDATED_SYSTEM_REFS,
  INITIAL_BALLAD_ARCHETYPE_IDS,
  MEMORY_ANCHOR_CATALOG,
  REQUIRED_BALLAD_ARCHETYPE_FIELDS,
  buildBalladMvAdapterFromLibrary,
  buildMemoryCallbacks,
  loadBalladMvAdapter,
  loadBalladMvIndex,
  loadBalladMvLibrary,
  parseCallbackScene,
  resolveBalladMvByArchetypeId,
  type BalladArchetypeRecord,
} from './balladMvDataset.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const INSTRUMENTAL_MV_LATEST_ADAPTER_PATH =
  'exports/image_app/latest/instrumental-mv-adapter.json' as const;

export type BalladMvVerdict =
  | 'PASS_BALLAD_MV_DATASET_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type BalladMvViolation = {
  code: string;
  message: string;
  field?: string;
};

export type BalladMvAuditReport = {
  report_type: 'ballad_mv_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-BALLAD-MV-DATASET-001';
  generated_at: string;
  archetype_count: number;
  target_archetype_count: number;
  validation: {
    library_exists: boolean;
    index_exists: boolean;
    adapter_exists: boolean;
    adapter_synced_to_latest: boolean;
    required_archetypes_present: boolean;
    relationship_arcs_valid: boolean;
    memory_anchors_connected: boolean;
    callback_chains_valid: boolean;
    all_validated_systems_connected: boolean;
    adapter_chain_complete: boolean;
    precheck_pass: boolean;
  };
  validated_system_refs: typeof BALLAD_VALIDATED_SYSTEM_REFS;
  export_path: typeof BALLAD_MV_ADAPTER_PATH;
  report_path: string;
  library_path: typeof BALLAD_MV_LIBRARY_PATH;
  index_path: typeof BALLAD_MV_INDEX_PATH;
  final_verdict: BalladMvVerdict;
  violations: readonly BalladMvViolation[];
  next_phases: readonly string[];
};

const REPORT_FILE = 'ballad-mv-adapter-report.json';

function readJson<T>(projectRoot: string, relativePath: string): T | null {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function readScorecardVerdict(relativePath: string, root: string): string | null {
  const doc = readJson<{ final_verdict?: string }>(root, relativePath);
  return doc?.final_verdict ?? null;
}

export function runBalladMvPrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const rkb008 = readScorecardVerdict(
    'datasets/render_feedback/RKB-008_SCORECARD.json',
    root
  );
  if (rkb008 !== 'PASS_RKB_008_INSTRUMENTAL_MV_PIPELINE_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_008_INSTRUMENTAL_MV_PIPELINE_VALIDATION, got ${rkb008 ?? 'missing'}`
    );
  }

  const rkb007 = readScorecardVerdict(
    'datasets/render_feedback/RKB-007_SCORECARD.json',
    root
  );
  if (rkb007 !== 'PASS_RKB_007_EMOTION_ACTING_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_007_EMOTION_ACTING_VALIDATION, got ${rkb007 ?? 'missing'}`
    );
  }

  if (!fs.existsSync(path.join(root, INSTRUMENTAL_MV_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${INSTRUMENTAL_MV_LATEST_ADAPTER_PATH}`);
  }

  return { pass: violations.length === 0, violations };
}

function hasRequiredArchetypeFields(archetype: BalladArchetypeRecord): boolean {
  return REQUIRED_BALLAD_ARCHETYPE_FIELDS.every((field) => {
    const value = archetype[field as keyof BalladArchetypeRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

function relationshipArcValid(archetype: BalladArchetypeRecord): boolean {
  return archetype.relationship_arc.length >= 2;
}

function memoryAnchorsConnected(archetype: BalladArchetypeRecord): boolean {
  const catalog = new Set(MEMORY_ANCHOR_CATALOG);
  const declared = archetype.memory_anchors.every((anchor) => catalog.has(anchor as (typeof MEMORY_ANCHOR_CATALOG)[number]));
  const blueprintAnchors = archetype.scene_blueprints.every((scene) =>
    archetype.memory_anchors.includes(scene.memory_anchor)
  );
  return declared && blueprintAnchors;
}

function callbackChainsValid(archetype: BalladArchetypeRecord): boolean {
  const callbacks = buildMemoryCallbacks(archetype);
  for (const blueprint of archetype.scene_blueprints) {
    if (!blueprint.callback_scene) continue;
    const parsed = parseCallbackScene(blueprint.callback_scene);
    if (!parsed) return false;
    if (!INITIAL_BALLAD_ARCHETYPE_IDS.includes(parsed.source_archetype as (typeof INITIAL_BALLAD_ARCHETYPE_IDS)[number])) {
      return false;
    }
  }
  if (archetype.ballad_archetype_id === 'memory_after_parting') {
    return callbacks.length >= 3;
  }
  return true;
}

function entryExportsBalladSystems(
  entry: ReturnType<typeof loadBalladMvAdapter>['archetype_to_sequence_map'][number]
): boolean {
  const tokenBlob = entry.render_payload.ballad_tokens.join('\n');
  return (
    tokenBlob.includes('ballad-archetype:') &&
    tokenBlob.includes('relationship-arc:') &&
    tokenBlob.includes('memory-anchor:') &&
    tokenBlob.includes('relationship-stage:') &&
    tokenBlob.includes('emotion-id:') &&
    tokenBlob.includes('coverage-id:') &&
    tokenBlob.includes('lighting-anchor:') &&
    entry.memory_callbacks.length >= 0 &&
    entry.relationship_arc.length >= 2
  );
}

function auditBalladMvSystem(projectRoot?: string): BalladMvAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: BalladMvViolation[] = [];

  const precheck = runBalladMvPrecheck(root);
  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeReport(violations, 'FAIL_PRECHECK', 0);
  }

  let library: ReturnType<typeof loadBalladMvLibrary>;
  let index: ReturnType<typeof loadBalladMvIndex>;

  try {
    library = loadBalladMvLibrary(root);
    index = loadBalladMvIndex(root);
  } catch (error) {
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Ballad MV JSON parse failed',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', 0);
  }

  for (const [systemId, refPath] of Object.entries(BALLAD_VALIDATED_SYSTEM_REFS)) {
    if (!fs.existsSync(path.join(root, refPath))) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Validated system reference missing: ${systemId} → ${refPath}`,
        field: systemId,
      });
    }
  }

  const archetypeIds = new Set<string>();
  let relationshipArcsOk = true;
  let memoryAnchorsOk = true;
  let callbackChainsOk = true;

  for (const archetype of library.archetypes) {
    archetypeIds.add(archetype.ballad_archetype_id);

    if (!hasRequiredArchetypeFields(archetype)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Archetype ${archetype.ballad_archetype_id} missing required schema fields`,
        field: archetype.ballad_archetype_id,
      });
    }
    if (!relationshipArcValid(archetype)) {
      relationshipArcsOk = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Archetype ${archetype.ballad_archetype_id} relationship_arc must have at least 2 stages`,
        field: archetype.ballad_archetype_id,
      });
    }
    if (!memoryAnchorsConnected(archetype)) {
      memoryAnchorsOk = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Archetype ${archetype.ballad_archetype_id} memory_anchors not connected to scenes`,
        field: archetype.ballad_archetype_id,
      });
    }
    if (!callbackChainsValid(archetype)) {
      callbackChainsOk = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Archetype ${archetype.ballad_archetype_id} callback chain invalid`,
        field: archetype.ballad_archetype_id,
      });
    }
  }

  for (const target of INITIAL_BALLAD_ARCHETYPE_IDS) {
    if (!archetypeIds.has(target)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Initial ballad archetype missing: ${target}`,
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

  const rebuiltAdapter = buildBalladMvAdapterFromLibrary(library, index);
  publishGovernedExport({
    projectRoot: root,
    relativePath: BALLAD_MV_ADAPTER_PATH,
    datasetName: 'ballad-mv-adapter',
    datasetVersion: 'v1',
    datasetType: 'ballad_mv_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);

  const latestPath = path.join(root, 'exports/image_app/latest/ballad-mv-adapter.json');
  const adapterPath = path.join(root, BALLAD_MV_ADAPTER_PATH);
  const adapterSynced =
    fs.existsSync(latestPath) &&
    fs.existsSync(adapterPath) &&
    fs.readFileSync(latestPath, 'utf8') === fs.readFileSync(adapterPath, 'utf8');

  if (!adapterSynced) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'ballad-mv-adapter.json must be synced to exports/image_app/latest/',
    });
  }

  const adapter = loadBalladMvAdapter(root);
  const systemsConnected = adapter.archetype_to_sequence_map.every(entryExportsBalladSystems);
  if (!systemsConnected) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'archetype_to_sequence_map entries must export ballad relationship and validated-system tokens',
    });
  }

  let resolverOk = true;
  for (const archetypeId of INITIAL_BALLAD_ARCHETYPE_IDS) {
    if (!resolveBalladMvByArchetypeId(archetypeId, root)) {
      resolverOk = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Resolver failed for ballad_archetype_id ${archetypeId}`,
        field: archetypeId,
      });
    }
  }

  const adapterChainComplete =
    Array.isArray(rebuiltAdapter.adapter_responsibility_chain) &&
    (rebuiltAdapter.adapter_responsibility_chain as string[]).length === 6;

  if (!adapterChainComplete) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'adapter_responsibility_chain must contain six resolution steps',
    });
  }

  const verdict: BalladMvVerdict =
    violations.length === 0 ? 'PASS_BALLAD_MV_DATASET_V1' : 'NEEDS_REFINEMENT';

  const report = finalizeReport(violations, verdict, library.archetypes.length, {
    library_exists: true,
    index_exists: true,
    adapter_exists: fs.existsSync(adapterPath),
    adapter_synced_to_latest: adapterSynced,
    required_archetypes_present: INITIAL_BALLAD_ARCHETYPE_IDS.every((id) => archetypeIds.has(id)),
    relationship_arcs_valid: relationshipArcsOk,
    memory_anchors_connected: memoryAnchorsOk,
    callback_chains_valid: callbackChainsOk,
    all_validated_systems_connected: systemsConnected && resolverOk,
    adapter_chain_complete: adapterChainComplete,
    precheck_pass: precheck.pass,
  });

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: BalladMvViolation[],
  verdict: BalladMvVerdict,
  archetypeCount: number,
  validation?: BalladMvAuditReport['validation']
): BalladMvAuditReport {
  return {
    report_type: 'ballad_mv_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-BALLAD-MV-DATASET-001',
    generated_at: new Date().toISOString(),
    archetype_count: archetypeCount,
    target_archetype_count: INITIAL_BALLAD_ARCHETYPE_IDS.length,
    validation: {
      library_exists: validation?.library_exists ?? false,
      index_exists: validation?.index_exists ?? false,
      adapter_exists: validation?.adapter_exists ?? false,
      adapter_synced_to_latest: validation?.adapter_synced_to_latest ?? false,
      required_archetypes_present: validation?.required_archetypes_present ?? false,
      relationship_arcs_valid: validation?.relationship_arcs_valid ?? false,
      memory_anchors_connected: validation?.memory_anchors_connected ?? false,
      callback_chains_valid: validation?.callback_chains_valid ?? false,
      all_validated_systems_connected: validation?.all_validated_systems_connected ?? false,
      adapter_chain_complete: validation?.adapter_chain_complete ?? false,
      precheck_pass: validation?.precheck_pass ?? false,
    },
    validated_system_refs: BALLAD_VALIDATED_SYSTEM_REFS,
    export_path: BALLAD_MV_ADAPTER_PATH,
    report_path: `${IMAGE_APP_REPORTS_DIR}/${REPORT_FILE}`,
    library_path: BALLAD_MV_LIBRARY_PATH,
    index_path: BALLAD_MV_INDEX_PATH,
    final_verdict: verdict,
    violations: Object.freeze([...violations]),
    next_phases: Object.freeze([
      'RKB-009 BALLAD_MV_PIPELINE_VALIDATION',
      'MUSIC_DRAMA_STUDIO_FULL_PRODUCTION_TEST',
    ]),
  };
}

export function runBalladMvAudit(projectRoot?: string): BalladMvAuditReport {
  return auditBalladMvSystem(projectRoot);
}
