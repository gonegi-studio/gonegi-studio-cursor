import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  writeGovernedReport,
} from './exportGovernance.js';
import { syncImageAppLatestUploadBundle } from './imageAppExportGovernance.js';
import {
  MASTER_CORE_V18_MANIFEST_PATH,
  PRODUCTION_READY_BASELINE_001_PATH,
} from './mds002FullLengthMvProductionTest.js';
import {
  CORE_COMPOSITION_FORBIDDEN_RULES,
  COMPOSITION_IMAGE_APP_TOKEN_PREFIXES,
  REQUIRED_SCENE_COMPOSITION_FIELDS,
  SCENE_COMPOSITION_ADAPTER_PATH,
  SCENE_COMPOSITION_INDEX_PATH,
  SCENE_COMPOSITION_LIBRARY_PATH,
  SCENE_COMPOSITION_TARGET_IDS,
  buildSceneCompositionAdapterFromLibrary,
  enrichLocationContinuityAnchorsWithSceneComposition,
  loadSceneCompositionAdapter,
  loadSceneCompositionIndex,
  loadSceneCompositionLibrary,
  resolveSceneComposition,
  verifyCompositionTokensInjected,
  type SceneCompositionRecord,
} from './sceneAssetComposition.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RKB_011_SCORECARD_PATH = 'datasets/render_feedback/RKB-011_SCORECARD.json' as const;
export const ROOM_LAYOUT_LOCK_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/room-layout-lock-adapter-report.json' as const;

export type SceneCompositionVerdict =
  | 'PASS_SCENE_ASSET_COMPOSITION_SYSTEM_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type SceneCompositionViolation = {
  code: string;
  message: string;
  field?: string;
};

export type SceneCompositionAuditReport = {
  report_type: 'scene_asset_composition_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-SAC-001';
  generated_at: string;
  composition_count: number;
  target_composition_count: number;
  duplicate_ids: number;
  runtime_fields_exported: {
    composition_id: boolean;
    composition_tokens: boolean;
    render_payload: boolean;
    tokens_injected: boolean;
  };
  validation_target: 'RKB-012 SCENE_COMPOSITION_CONTINUITY_VALIDATION';
  json_parse_result: 'valid' | 'invalid';
  validation: {
    all_target_compositions_present: boolean;
    duplicate_ids_zero: boolean;
    required_fields_complete: boolean;
    adapter_chain_complete: boolean;
    adapter_synced_to_latest: boolean;
    runtime_verification_exported: boolean;
    compositions_resolve: boolean;
    forbidden_rules_include_core_four: boolean;
    tokens_injected: boolean;
  };
  export_path: typeof SCENE_COMPOSITION_ADAPTER_PATH;
  report_path: string;
  library_path: typeof SCENE_COMPOSITION_LIBRARY_PATH;
  index_path: typeof SCENE_COMPOSITION_INDEX_PATH;
  final_verdict: SceneCompositionVerdict;
  violations: readonly SceneCompositionViolation[];
  next_phases: readonly string[];
};

const REPORT_FILE = 'scene-asset-composition-adapter-report.json';

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function hasRequiredFields(composition: SceneCompositionRecord): boolean {
  return REQUIRED_SCENE_COMPOSITION_FIELDS.every((field) => {
    const value = composition[field as keyof SceneCompositionRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length >= 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });
}

function hasCoreForbiddenRules(composition: SceneCompositionRecord): boolean {
  return CORE_COMPOSITION_FORBIDDEN_RULES.every((rule) =>
    composition.forbidden_composition_changes.includes(rule)
  );
}

export function runSceneCompositionPrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  rkb011Verdict: string | null;
  roomLayoutLockVerdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const rkb011 = readJson<{ final_verdict?: string }>(root, RKB_011_SCORECARD_PATH);
  const rkb011Verdict = rkb011?.final_verdict ?? null;
  if (rkb011Verdict !== 'PASS_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION, got ${rkb011Verdict ?? 'missing'}`
    );
  }

  const layoutReport = readJson<{ final_verdict?: string }>(root, ROOM_LAYOUT_LOCK_ADAPTER_REPORT_PATH);
  const roomLayoutLockVerdict = layoutReport?.final_verdict ?? null;
  if (roomLayoutLockVerdict !== 'PASS_ROOM_LAYOUT_LOCK_SYSTEM_V1') {
    violations.push(
      `Expected PASS_ROOM_LAYOUT_LOCK_SYSTEM_V1, got ${roomLayoutLockVerdict ?? 'missing'}`
    );
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH))) {
    violations.push(`Missing ${PRODUCTION_READY_BASELINE_001_PATH}`);
  }

  if (!fs.existsSync(path.join(root, MASTER_CORE_V18_MANIFEST_PATH))) {
    violations.push(`Missing ${MASTER_CORE_V18_MANIFEST_PATH}`);
  }

  return { pass: violations.length === 0, violations, rkb011Verdict, roomLayoutLockVerdict };
}

function entryExportsRuntimeFields(
  entry: ReturnType<typeof loadSceneCompositionAdapter>['composition_to_scene_map'][number]
): boolean {
  return Boolean(
    entry.composition_id &&
      entry.location_id &&
      entry.layout_id &&
      Array.isArray(entry.composition_tokens) &&
      entry.composition_tokens.length > 0 &&
      entry.composition_tokens.some((t) => t.startsWith('composition-id:')) &&
      entry.render_payload &&
      entry.render_payload.character_positions &&
      Object.keys(entry.render_payload.character_positions).length > 0
  );
}

export function auditSceneCompositionSystem(projectRoot?: string): SceneCompositionAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: SceneCompositionViolation[] = [];
  let jsonParseResult: 'valid' | 'invalid' = 'valid';

  const precheck = runSceneCompositionPrecheck(root);
  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeReport(violations, 'FAIL_PRECHECK', jsonParseResult, 0);
  }

  let library;
  let index;
  try {
    library = loadSceneCompositionLibrary(root);
    index = loadSceneCompositionIndex(root);
  } catch (error) {
    jsonParseResult = 'invalid';
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Scene composition JSON parse failed',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', jsonParseResult, 0);
  }

  const compositionIds = new Set<string>();
  let duplicateIds = 0;

  for (const composition of library.compositions) {
    if (compositionIds.has(composition.composition_id)) duplicateIds += 1;
    compositionIds.add(composition.composition_id);

    if (!hasRequiredFields(composition)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Composition ${composition.composition_id} missing required schema fields`,
        field: composition.composition_id,
      });
    }
    if (!hasCoreForbiddenRules(composition)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Composition ${composition.composition_id} missing core forbidden composition rules`,
        field: composition.composition_id,
      });
    }
    if (Object.keys(composition.character_positions).length === 0) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Composition ${composition.composition_id} requires at least one character position`,
        field: composition.composition_id,
      });
    }
  }

  for (const target of SCENE_COMPOSITION_TARGET_IDS) {
    if (!compositionIds.has(target)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Target scene composition missing: ${target}`,
        field: target,
      });
    }
  }

  if (library.compositions.length !== 8) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Expected 8 compositions, found ${library.compositions.length}`,
    });
  }

  if (index.entries.length !== library.compositions.length) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Index entry count must match library composition count',
    });
  }

  const rebuiltAdapter = buildSceneCompositionAdapterFromLibrary(library);
  publishGovernedExport({
    projectRoot: root,
    relativePath: SCENE_COMPOSITION_ADAPTER_PATH,
    datasetName: 'scene-asset-composition-adapter',
    datasetVersion: 'v1',
    datasetType: 'scene_asset_composition_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);
  const latestPath = path.join(root, 'exports/image_app/latest/scene-asset-composition-adapter.json');
  const adapterSynced = fs.existsSync(latestPath);

  if (!adapterSynced) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'scene-asset-composition-adapter.json was not synced to exports/image_app/latest/',
    });
  }

  const adapter = loadSceneCompositionAdapter(root);
  const runtimeExported = adapter.composition_to_scene_map.every(entryExportsRuntimeFields);
  if (!runtimeExported) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'Adapter map entries must export composition_id, composition_tokens, and render_payload',
      field: 'composition_to_scene_map',
    });
  }

  let compositionsResolve = true;
  for (const target of SCENE_COMPOSITION_TARGET_IDS) {
    const resolution = resolveSceneComposition(target, root);
    if (!resolution) {
      compositionsResolve = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Resolver failed for composition ${target}`,
        field: target,
      });
    }
  }

  const sampleTokens = enrichLocationContinuityAnchorsWithSceneComposition(
    [],
    'gonegi_bedroom_reading',
    root
  );
  const tokensInjected = verifyCompositionTokensInjected(sampleTokens);
  if (!tokensInjected) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Image App tokens must include prefixes: ${COMPOSITION_IMAGE_APP_TOKEN_PREFIXES.join(', ')}`,
    });
  }

  const chain = rebuiltAdapter.adapter_responsibility_chain as string[] | undefined;
  const adapterChainComplete =
    Array.isArray(chain) &&
    chain.length === 5 &&
    chain[0] === 'location_id' &&
    chain[1] === 'layout_id' &&
    chain[2] === 'prop_anchor_ids' &&
    chain[3] === 'composition_id' &&
    chain[4] === 'render_payload';

  if (!adapterChainComplete) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'adapter_responsibility_chain must be location_id → layout_id → prop_anchor_ids → composition_id → render_payload',
    });
  }

  const verdict: SceneCompositionVerdict =
    violations.length === 0 ? 'PASS_SCENE_ASSET_COMPOSITION_SYSTEM_V1' : 'NEEDS_REFINEMENT';

  const report = finalizeReport(
    violations,
    verdict,
    jsonParseResult,
    duplicateIds,
    library.compositions.length,
    {
      all_target_compositions_present: SCENE_COMPOSITION_TARGET_IDS.every((id) =>
        compositionIds.has(id)
      ),
      duplicate_ids_zero: duplicateIds === 0,
      required_fields_complete: !violations.some((v) =>
        v.message.includes('missing required schema fields')
      ),
      adapter_chain_complete: adapterChainComplete,
      adapter_synced_to_latest: adapterSynced,
      runtime_verification_exported: runtimeExported,
      compositions_resolve: compositionsResolve,
      forbidden_rules_include_core_four: !violations.some((v) =>
        v.message.includes('core forbidden composition rules')
      ),
      tokens_injected: tokensInjected,
    }
  );

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: SceneCompositionViolation[],
  verdict: SceneCompositionVerdict,
  jsonParseResult: 'valid' | 'invalid',
  duplicateIds: number,
  compositionCount = 0,
  validationOverrides?: SceneCompositionAuditReport['validation']
): SceneCompositionAuditReport {
  const validation = validationOverrides ?? {
    all_target_compositions_present: false,
    duplicate_ids_zero: duplicateIds === 0,
    required_fields_complete: false,
    adapter_chain_complete: false,
    adapter_synced_to_latest: false,
    runtime_verification_exported: false,
    compositions_resolve: false,
    forbidden_rules_include_core_four: false,
    tokens_injected: false,
  };

  return {
    report_type: 'scene_asset_composition_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-SAC-001',
    generated_at: new Date().toISOString(),
    composition_count: compositionCount,
    target_composition_count: 8,
    duplicate_ids: duplicateIds,
    runtime_fields_exported: {
      composition_id: validation.runtime_verification_exported,
      composition_tokens: validation.runtime_verification_exported,
      render_payload: validation.runtime_verification_exported,
      tokens_injected: validation.tokens_injected,
    },
    validation_target: 'RKB-012 SCENE_COMPOSITION_CONTINUITY_VALIDATION',
    json_parse_result: jsonParseResult,
    validation,
    export_path: SCENE_COMPOSITION_ADAPTER_PATH,
    report_path: path.posix.join(IMAGE_APP_REPORTS_DIR, REPORT_FILE),
    library_path: SCENE_COMPOSITION_LIBRARY_PATH,
    index_path: SCENE_COMPOSITION_INDEX_PATH,
    final_verdict: verdict,
    violations,
    next_phases: ['PHASE-RKB-012 SCENE_COMPOSITION_CONTINUITY_VALIDATION'],
  };
}

export function runSceneCompositionAudit(projectRoot?: string): SceneCompositionAuditReport {
  return auditSceneCompositionSystem(projectRoot);
}
