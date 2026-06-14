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
  CORE_LAYOUT_FORBIDDEN_RULES,
  LAYOUT_CAMERA_RULE_KEYS,
  LAYOUT_IMAGE_APP_TOKEN_PREFIXES,
  REQUIRED_ROOM_LAYOUT_LOCK_FIELDS,
  ROOM_LAYOUT_LOCK_ADAPTER_PATH,
  ROOM_LAYOUT_LOCK_INDEX_PATH,
  ROOM_LAYOUT_LOCK_LIBRARY_PATH,
  ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS,
  buildRoomLayoutLockAdapterFromLibrary,
  enrichLocationContinuityAnchorsWithRoomLayoutLock,
  loadRoomLayoutLockAdapter,
  loadRoomLayoutLockIndex,
  loadRoomLayoutLockLibrary,
  resolveRoomLayoutLock,
  verifyLayoutTokensInjected,
  type RoomLayoutLockRecord,
} from './roomLayoutLock.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RKB_010_SCORECARD_PATH = 'datasets/render_feedback/RKB-010_SCORECARD.json' as const;
export const PROP_ANCHOR_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/prop-anchor-adapter-report.json' as const;

export type RoomLayoutLockVerdict =
  | 'PASS_ROOM_LAYOUT_LOCK_SYSTEM_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type RoomLayoutLockViolation = {
  code: string;
  message: string;
  field?: string;
};

export type RoomLayoutLockAuditReport = {
  report_type: 'room_layout_lock_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-RLL-001';
  generated_at: string;
  layout_count: number;
  target_layout_count: number;
  duplicate_ids: number;
  runtime_fields_exported: {
    layout_id: boolean;
    layout_tokens: boolean;
    render_payload: boolean;
    tokens_injected: boolean;
  };
  validation_target: 'RKB-011 ROOM_LAYOUT_CONTINUITY_VALIDATION';
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
  export_path: typeof ROOM_LAYOUT_LOCK_ADAPTER_PATH;
  report_path: string;
  library_path: typeof ROOM_LAYOUT_LOCK_LIBRARY_PATH;
  index_path: typeof ROOM_LAYOUT_LOCK_INDEX_PATH;
  final_verdict: RoomLayoutLockVerdict;
  violations: readonly RoomLayoutLockViolation[];
  next_phases: readonly string[];
};

const REPORT_FILE = 'room-layout-lock-adapter-report.json';

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function hasRequiredFields(layout: RoomLayoutLockRecord): boolean {
  return REQUIRED_ROOM_LAYOUT_LOCK_FIELDS.every((field) => {
    const value = layout[field as keyof RoomLayoutLockRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });
}

function hasCameraRules(layout: RoomLayoutLockRecord): boolean {
  return LAYOUT_CAMERA_RULE_KEYS.every((key) => {
    const rule = layout.camera_visibility_rules[key];
    return typeof rule === 'string' && rule.trim().length > 0;
  });
}

function hasCoreForbiddenRules(layout: RoomLayoutLockRecord): boolean {
  return CORE_LAYOUT_FORBIDDEN_RULES.every((rule) => layout.forbidden_layout_changes.includes(rule));
}

export function runRoomLayoutLockPrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  rkb010Verdict: string | null;
  propAnchorVerdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const rkb010 = readJson<{ final_verdict?: string }>(root, RKB_010_SCORECARD_PATH);
  const rkb010Verdict = rkb010?.final_verdict ?? null;
  if (rkb010Verdict !== 'PASS_RKB_010_PROP_CONTINUITY_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_010_PROP_CONTINUITY_VALIDATION, got ${rkb010Verdict ?? 'missing'}`
    );
  }

  const propReport = readJson<{ final_verdict?: string }>(root, PROP_ANCHOR_ADAPTER_REPORT_PATH);
  const propAnchorVerdict = propReport?.final_verdict ?? null;
  if (propAnchorVerdict !== 'PASS_PROP_ANCHOR_SYSTEM_V1') {
    violations.push(`Expected PASS_PROP_ANCHOR_SYSTEM_V1, got ${propAnchorVerdict ?? 'missing'}`);
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH))) {
    violations.push(`Missing ${PRODUCTION_READY_BASELINE_001_PATH}`);
  }

  if (!fs.existsSync(path.join(root, MASTER_CORE_V18_MANIFEST_PATH))) {
    violations.push(`Missing ${MASTER_CORE_V18_MANIFEST_PATH}`);
  }

  return { pass: violations.length === 0, violations, rkb010Verdict, propAnchorVerdict };
}

function entryExportsRuntimeFields(
  entry: ReturnType<typeof loadRoomLayoutLockAdapter>['location_to_layout_map'][number]
): boolean {
  return Boolean(
    entry.location_id &&
      entry.indoor_anchor_id &&
      entry.layout_id &&
      Array.isArray(entry.layout_tokens) &&
      entry.layout_tokens.length > 0 &&
      entry.layout_tokens.some((token) => token.startsWith('layout-lock:')) &&
      entry.render_payload &&
      entry.render_payload.anchor_positions.length > 0
  );
}

export function auditRoomLayoutLockSystem(projectRoot?: string): RoomLayoutLockAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: RoomLayoutLockViolation[] = [];
  let jsonParseResult: 'valid' | 'invalid' = 'valid';

  const precheck = runRoomLayoutLockPrecheck(root);
  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeReport(violations, 'FAIL_PRECHECK', jsonParseResult, 0);
  }

  let library;
  let index;
  try {
    library = loadRoomLayoutLockLibrary(root);
    index = loadRoomLayoutLockIndex(root);
  } catch (error) {
    jsonParseResult = 'invalid';
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Room layout lock JSON parse failed',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', jsonParseResult, 0);
  }

  const layoutIds = new Set<string>();
  const locationIds = new Set<string>();
  let duplicateIds = 0;

  for (const layout of library.layouts) {
    if (layoutIds.has(layout.layout_id)) duplicateIds += 1;
    layoutIds.add(layout.layout_id);
    if (locationIds.has(layout.location_id)) duplicateIds += 1;
    locationIds.add(layout.location_id);

    if (!hasRequiredFields(layout)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Layout ${layout.layout_id} missing required schema fields`,
        field: layout.layout_id,
      });
    }
    if (!hasCameraRules(layout)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Layout ${layout.layout_id} missing camera_visibility_rules keys`,
        field: layout.layout_id,
      });
    }
    if (!hasCoreForbiddenRules(layout)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Layout ${layout.layout_id} missing core forbidden layout rules`,
        field: layout.layout_id,
      });
    }
  }

  for (const locationId of ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS) {
    if (!locationIds.has(locationId)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Target room layout missing for ${locationId}`,
        field: locationId,
      });
    }
  }

  if (library.layouts.length !== 6) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Expected 6 room layouts, found ${library.layouts.length}`,
    });
  }

  if (index.entries.length !== library.layouts.length) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Index entry count must match library layout count',
    });
  }

  const rebuiltAdapter = buildRoomLayoutLockAdapterFromLibrary(library);
  publishGovernedExport({
    projectRoot: root,
    relativePath: ROOM_LAYOUT_LOCK_ADAPTER_PATH,
    datasetName: 'room-layout-lock-adapter',
    datasetVersion: 'v1',
    datasetType: 'room_layout_lock_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);
  const latestPath = path.join(root, 'exports/image_app/latest/room-layout-lock-adapter.json');
  const adapterSynced = fs.existsSync(latestPath);

  if (!adapterSynced) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'room-layout-lock-adapter.json was not synced to exports/image_app/latest/',
    });
  }

  const adapter = loadRoomLayoutLockAdapter(root);
  const runtimeExported = adapter.location_to_layout_map.every(entryExportsRuntimeFields);
  if (!runtimeExported) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'Adapter map entries must export location_id, indoor_anchor_id, layout_id, layout_tokens, render_payload',
      field: 'location_to_layout_map',
    });
  }

  let locationsResolve = true;
  for (const locationId of ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS) {
    const resolution = resolveRoomLayoutLock(locationId, 'medium', root);
    if (!resolution) {
      locationsResolve = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Resolver failed for location ${locationId}`,
        field: locationId,
      });
    }
  }

  const sampleFromEmpty = enrichLocationContinuityAnchorsWithRoomLayoutLock(
    [],
    ['gonegi_bedroom_01'],
    'medium',
    root
  );
  const tokensInjected = verifyLayoutTokensInjected(sampleFromEmpty);
  if (!tokensInjected) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Image App tokens must include prefixes: ${LAYOUT_IMAGE_APP_TOKEN_PREFIXES.join(', ')}`,
    });
  }

  const chain = rebuiltAdapter.adapter_responsibility_chain as string[] | undefined;
  const adapterChainComplete =
    Array.isArray(chain) &&
    chain.length === 5 &&
    chain[0] === 'location_id' &&
    chain[1] === 'indoor_anchor_id' &&
    chain[2] === 'prop_anchor_ids' &&
    chain[3] === 'layout_id' &&
    chain[4] === 'render_payload';

  if (!adapterChainComplete) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'adapter_responsibility_chain must be location_id → indoor_anchor_id → prop_anchor_ids → layout_id → render_payload',
    });
  }

  const verdict: RoomLayoutLockVerdict =
    violations.length === 0 ? 'PASS_ROOM_LAYOUT_LOCK_SYSTEM_V1' : 'NEEDS_REFINEMENT';

  const report = finalizeReport(
    violations,
    verdict,
    jsonParseResult,
    duplicateIds,
    library.layouts.length,
    {
      all_target_layouts_present: ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS.every((id) =>
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
        v.message.includes('core forbidden layout rules')
      ),
      tokens_injected: tokensInjected,
    }
  );

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: RoomLayoutLockViolation[],
  verdict: RoomLayoutLockVerdict,
  jsonParseResult: 'valid' | 'invalid',
  duplicateIds: number,
  layoutCount = 0,
  validationOverrides?: RoomLayoutLockAuditReport['validation']
): RoomLayoutLockAuditReport {
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
    report_type: 'room_layout_lock_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-RLL-001',
    generated_at: new Date().toISOString(),
    layout_count: layoutCount,
    target_layout_count: 6,
    duplicate_ids: duplicateIds,
    runtime_fields_exported: {
      layout_id: validation.runtime_verification_exported,
      layout_tokens: validation.runtime_verification_exported,
      render_payload: validation.runtime_verification_exported,
      tokens_injected: validation.tokens_injected,
    },
    validation_target: 'RKB-011 ROOM_LAYOUT_CONTINUITY_VALIDATION',
    json_parse_result: jsonParseResult,
    validation,
    export_path: ROOM_LAYOUT_LOCK_ADAPTER_PATH,
    report_path: path.posix.join(IMAGE_APP_REPORTS_DIR, REPORT_FILE),
    library_path: ROOM_LAYOUT_LOCK_LIBRARY_PATH,
    index_path: ROOM_LAYOUT_LOCK_INDEX_PATH,
    final_verdict: verdict,
    violations,
    next_phases: ['PHASE-RKB-011 ROOM_LAYOUT_CONTINUITY_VALIDATION'],
  };
}

export function runRoomLayoutLockAudit(projectRoot?: string): RoomLayoutLockAuditReport {
  return auditRoomLayoutLockSystem(projectRoot);
}
