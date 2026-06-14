import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  writeGovernedReport,
} from './exportGovernance.js';
import { syncImageAppLatestUploadBundle } from './imageAppExportGovernance.js';
import { PRODUCTION_READY_BASELINE_001_PATH } from './mds002FullLengthMvProductionTest.js';
import {
  CORE_OUTDOOR_FORBIDDEN_RULES,
  OUTDOOR_CAMERA_RULE_KEYS,
  OUTDOOR_LAYOUT_IMAGE_APP_TOKEN_PREFIXES,
  OUTDOOR_LAYOUT_LOCK_ADAPTER_PATH,
  OUTDOOR_LAYOUT_LOCK_INDEX_PATH,
  OUTDOOR_LAYOUT_LOCK_LIBRARY_PATH,
  OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS,
  REQUIRED_OUTDOOR_LAYOUT_LOCK_FIELDS,
  buildOutdoorLayoutLockAdapterFromLibrary,
  enrichLocationContinuityAnchorsWithOutdoorLayoutLock,
  publishOutdoorLayoutLockProductionArtifacts,
  loadOutdoorLayoutLockAdapter,
  loadOutdoorLayoutLockIndex,
  loadOutdoorLayoutLockLibrary,
  resolveOutdoorLayoutLock,
  verifyOutdoorLayoutTokensInjected,
  type OutdoorLayoutLockRecord,
} from './outdoorLayoutLock.js';
import { RKB_012_SCORECARD_PATH } from './rkb012SceneCompositionContinuityValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SCENE_COMPOSITION_LATEST_ADAPTER_PATH =
  'exports/image_app/latest/scene-asset-composition-adapter.json' as const;

export type OutdoorLayoutLockVerdict =
  | 'PASS_OUTDOOR_LAYOUT_LOCK_SYSTEM_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type OutdoorLayoutLockViolation = {
  code: string;
  message: string;
  field?: string;
};

export type OutdoorLayoutLockAuditReport = {
  report_type: 'outdoor_layout_lock_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-OUTDOOR-LAYOUT-LOCK-001';
  generated_at: string;
  layout_count: number;
  target_layout_count: number;
  duplicate_ids: number;
  runtime_fields_exported: {
    outdoor_layout_id: boolean;
    layout_tokens: boolean;
    render_payload: boolean;
    tokens_injected: boolean;
  };
  validation_target: 'RKB-013 OUTDOOR_LAYOUT_CONTINUITY_VALIDATION';
  json_parse_result: 'valid' | 'invalid';
  validation: {
    all_target_layouts_present: boolean;
    duplicate_ids_zero: boolean;
    required_fields_complete: boolean;
    adapter_chain_complete: boolean;
    adapter_synced_to_latest: boolean;
    runtime_verification_exported: boolean;
    locations_resolve: boolean;
    forbidden_rules_include_core_four: boolean;
    tokens_injected: boolean;
  };
  export_path: typeof OUTDOOR_LAYOUT_LOCK_ADAPTER_PATH;
  report_path: string;
  library_path: typeof OUTDOOR_LAYOUT_LOCK_LIBRARY_PATH;
  index_path: typeof OUTDOOR_LAYOUT_LOCK_INDEX_PATH;
  final_verdict: OutdoorLayoutLockVerdict;
  violations: readonly OutdoorLayoutLockViolation[];
  next_phases: readonly string[];
};

const REPORT_FILE = 'outdoor-layout-lock-adapter-report.json';

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function hasRequiredFields(layout: OutdoorLayoutLockRecord): boolean {
  return REQUIRED_OUTDOOR_LAYOUT_LOCK_FIELDS.every((field) => {
    const value = layout[field as keyof OutdoorLayoutLockRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length >= 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });
}

function hasCameraRules(layout: OutdoorLayoutLockRecord): boolean {
  return OUTDOOR_CAMERA_RULE_KEYS.every((key) => {
    const rule = layout.landmark_visibility_rules[key];
    return typeof rule === 'string' && rule.trim().length > 0;
  });
}

function hasCoreForbiddenRules(layout: OutdoorLayoutLockRecord): boolean {
  return CORE_OUTDOOR_FORBIDDEN_RULES.every((rule) =>
    layout.forbidden_outdoor_changes.includes(rule)
  );
}

export function runOutdoorLayoutLockPrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  rkb012Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const rkb012 = readJson<{ final_verdict?: string }>(root, RKB_012_SCORECARD_PATH);
  const rkb012Verdict = rkb012?.final_verdict ?? null;
  if (rkb012Verdict !== 'PASS_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION, got ${rkb012Verdict ?? 'missing'}`
    );
  }

  if (!fs.existsSync(path.join(root, SCENE_COMPOSITION_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${SCENE_COMPOSITION_LATEST_ADAPTER_PATH}`);
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH))) {
    violations.push(`Missing ${PRODUCTION_READY_BASELINE_001_PATH}`);
  }

  return { pass: violations.length === 0, violations, rkb012Verdict };
}

function entryExportsRuntimeFields(
  entry: ReturnType<typeof loadOutdoorLayoutLockAdapter>['location_to_outdoor_layout_map'][number]
): boolean {
  return Boolean(
    entry.location_id &&
      entry.outdoor_layout_id &&
      Array.isArray(entry.layout_tokens) &&
      entry.layout_tokens.length > 0 &&
      entry.layout_tokens.some((token) => token.startsWith('outdoor-layout-lock:')) &&
      entry.render_payload &&
      entry.render_payload.landmark_positions.length > 0
  );
}

export function auditOutdoorLayoutLockSystem(projectRoot?: string): OutdoorLayoutLockAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: OutdoorLayoutLockViolation[] = [];
  let jsonParseResult: 'valid' | 'invalid' = 'valid';

  const precheck = runOutdoorLayoutLockPrecheck(root);
  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeReport(violations, 'FAIL_PRECHECK', jsonParseResult, 0);
  }

  let library;
  let index;
  try {
    library = loadOutdoorLayoutLockLibrary(root);
    index = loadOutdoorLayoutLockIndex(root);
  } catch (error) {
    jsonParseResult = 'invalid';
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Outdoor layout lock JSON parse failed',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', jsonParseResult, 0);
  }

  const layoutIds = new Set<string>();
  const locationIds = new Set<string>();
  let duplicateIds = 0;

  for (const layout of library.layouts) {
    if (layoutIds.has(layout.outdoor_layout_id)) duplicateIds += 1;
    layoutIds.add(layout.outdoor_layout_id);
    if (locationIds.has(layout.location_id)) duplicateIds += 1;
    locationIds.add(layout.location_id);

    if (!hasRequiredFields(layout)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Layout ${layout.outdoor_layout_id} missing required schema fields`,
        field: layout.outdoor_layout_id,
      });
    }
    if (!hasCameraRules(layout)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Layout ${layout.outdoor_layout_id} missing landmark_visibility_rules keys`,
        field: layout.outdoor_layout_id,
      });
    }
    if (!hasCoreForbiddenRules(layout)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Layout ${layout.outdoor_layout_id} missing core forbidden outdoor rules`,
        field: layout.outdoor_layout_id,
      });
    }
  }

  for (const locationId of OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS) {
    if (!locationIds.has(locationId)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Target outdoor layout missing for ${locationId}`,
        field: locationId,
      });
    }
  }

  if (library.layouts.length !== 6) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Expected 6 outdoor layouts, found ${library.layouts.length}`,
    });
  }

  if (index.entries.length !== library.layouts.length) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Index entry count must match library layout count',
    });
  }

  const rebuiltAdapter = buildOutdoorLayoutLockAdapterFromLibrary(
    library,
    'exports/image_app/adapters/scene-asset-composition-adapter.json',
    'full'
  );

  const productionArtifacts = publishOutdoorLayoutLockProductionArtifacts(root);

  publishGovernedExport({
    projectRoot: root,
    relativePath: productionArtifacts.full_reference_path,
    datasetName: 'outdoor-layout-lock-adapter-full',
    datasetVersion: 'v1-full-reference',
    datasetType: 'outdoor_layout_lock_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  const productionAdapter = JSON.parse(
    fs.readFileSync(path.join(root, productionArtifacts.production_adapter_path), 'utf8')
  ) as Record<string, unknown>;

  publishGovernedExport({
    projectRoot: root,
    relativePath: productionArtifacts.production_adapter_path,
    datasetName: 'outdoor-layout-lock-adapter',
    datasetVersion: 'v2',
    datasetType: 'outdoor_layout_lock_image_adapter',
    content: productionAdapter,
    archivePrevious: false,
  });

  const liteAdapter = buildOutdoorLayoutLockAdapterFromLibrary(
    library,
    'exports/image_app/adapters/scene-asset-composition-adapter.json',
    'lite'
  );
  publishGovernedExport({
    projectRoot: root,
    relativePath: 'exports/image_app/adapters/outdoor-layout-lock-adapter-lite.json',
    datasetName: 'outdoor-layout-lock-adapter-lite',
    datasetVersion: 'lite-v1',
    datasetType: 'outdoor_layout_lock_image_adapter',
    content: liteAdapter,
    archivePrevious: false,
  });

  const v2Adapter = JSON.parse(
    fs.readFileSync(path.join(root, productionArtifacts.v2_adapter_path), 'utf8')
  ) as Record<string, unknown>;
  publishGovernedExport({
    projectRoot: root,
    relativePath: productionArtifacts.v2_adapter_path,
    datasetName: 'outdoor-layout-lock-adapter-v2',
    datasetVersion: 'v2',
    datasetType: 'outdoor_layout_lock_image_adapter',
    content: v2Adapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);
  const latestPath = path.join(root, productionArtifacts.latest_adapter_path);
  const adapterSynced = fs.existsSync(latestPath);

  if (!adapterSynced) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'outdoor-layout-lock-adapter-v2 was not synced to exports/image_app/latest/',
    });
  }

  const adapter = loadOutdoorLayoutLockAdapter(root);
  const runtimeExported = adapter.location_to_outdoor_layout_map.every(entryExportsRuntimeFields);
  if (!runtimeExported) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'Adapter map entries must export location_id, outdoor_layout_id, layout_tokens, render_payload',
      field: 'location_to_outdoor_layout_map',
    });
  }

  let locationsResolve = true;
  for (const locationId of OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS) {
    const resolution = resolveOutdoorLayoutLock(locationId, 'medium', root);
    if (!resolution) {
      locationsResolve = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Resolver failed for location ${locationId}`,
        field: locationId,
      });
    }
  }

  const aliasResolution = resolveOutdoorLayoutLock('gonegi_olive_hill_01', 'medium', root);
  if (!aliasResolution) {
    locationsResolve = false;
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Resolver failed for legacy alias gonegi_olive_hill_01',
      field: 'gonegi_olive_hill_01',
    });
  }

  const sampleFromEmpty = enrichLocationContinuityAnchorsWithOutdoorLayoutLock(
    [],
    ['harbor_watch_point_01'],
    'medium',
    root,
    undefined,
    'full'
  );
  const tokensInjected = verifyOutdoorLayoutTokensInjected(sampleFromEmpty, 'full');
  if (!tokensInjected) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Image App tokens must include prefixes: ${OUTDOOR_LAYOUT_IMAGE_APP_TOKEN_PREFIXES.join(', ')}`,
    });
  }

  const chain = rebuiltAdapter.adapter_responsibility_chain as string[] | undefined;
  const adapterChainComplete =
    Array.isArray(chain) &&
    chain.length === 4 &&
    chain[0] === 'location_id' &&
    chain[1] === 'outdoor_layout_id' &&
    chain[2] === 'outdoor_prop_anchor_ids' &&
    chain[3] === 'render_payload';

  if (!adapterChainComplete) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'adapter_responsibility_chain must be location_id → outdoor_layout_id → outdoor_prop_anchor_ids → render_payload',
    });
  }

  const verdict: OutdoorLayoutLockVerdict =
    violations.length === 0 ? 'PASS_OUTDOOR_LAYOUT_LOCK_SYSTEM_V1' : 'NEEDS_REFINEMENT';

  const report = finalizeReport(
    violations,
    verdict,
    jsonParseResult,
    duplicateIds,
    library.layouts.length,
    {
      all_target_layouts_present: OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS.every((id) =>
        locationIds.has(id)
      ),
      duplicate_ids_zero: duplicateIds === 0,
      required_fields_complete: !violations.some((v) =>
        v.message.includes('missing required schema fields')
      ),
      adapter_chain_complete: adapterChainComplete,
      adapter_synced_to_latest: adapterSynced,
      runtime_verification_exported: runtimeExported,
      locations_resolve: locationsResolve,
      forbidden_rules_include_core_four: !violations.some((v) =>
        v.message.includes('core forbidden outdoor rules')
      ),
      tokens_injected: tokensInjected,
    }
  );

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: OutdoorLayoutLockViolation[],
  verdict: OutdoorLayoutLockVerdict,
  jsonParseResult: 'valid' | 'invalid',
  duplicateIds: number,
  layoutCount = 0,
  validationOverrides?: OutdoorLayoutLockAuditReport['validation']
): OutdoorLayoutLockAuditReport {
  const validation = validationOverrides ?? {
    all_target_layouts_present: false,
    duplicate_ids_zero: duplicateIds === 0,
    required_fields_complete: false,
    adapter_chain_complete: false,
    adapter_synced_to_latest: false,
    runtime_verification_exported: false,
    locations_resolve: false,
    forbidden_rules_include_core_four: false,
    tokens_injected: false,
  };

  return {
    report_type: 'outdoor_layout_lock_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-OUTDOOR-LAYOUT-LOCK-001',
    generated_at: new Date().toISOString(),
    layout_count: layoutCount,
    target_layout_count: 6,
    duplicate_ids: duplicateIds,
    runtime_fields_exported: {
      outdoor_layout_id: validation.runtime_verification_exported,
      layout_tokens: validation.runtime_verification_exported,
      render_payload: validation.runtime_verification_exported,
      tokens_injected: validation.tokens_injected,
    },
    validation_target: 'RKB-013 OUTDOOR_LAYOUT_CONTINUITY_VALIDATION',
    json_parse_result: jsonParseResult,
    validation,
    export_path: OUTDOOR_LAYOUT_LOCK_ADAPTER_PATH,
    report_path: path.posix.join(IMAGE_APP_REPORTS_DIR, REPORT_FILE),
    library_path: OUTDOOR_LAYOUT_LOCK_LIBRARY_PATH,
    index_path: OUTDOOR_LAYOUT_LOCK_INDEX_PATH,
    final_verdict: verdict,
    violations,
    next_phases: ['PHASE-RKB-013 OUTDOOR_LAYOUT_CONTINUITY_VALIDATION'],
  };
}

export function runOutdoorLayoutLockAudit(projectRoot?: string): OutdoorLayoutLockAuditReport {
  return auditOutdoorLayoutLockSystem(projectRoot);
}
