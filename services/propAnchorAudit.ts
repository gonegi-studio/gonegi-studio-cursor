import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  writeGovernedReport,
} from './exportGovernance.js';
import { syncImageAppLatestUploadBundle } from './imageAppExportGovernance.js';
import {
  CORE_PROP_FORBIDDEN_RULES,
  PROP_ANCHOR_ADAPTER_PATH,
  PROP_ANCHOR_INDEX_PATH,
  PROP_ANCHOR_LIBRARY_PATH,
  PROP_ANCHOR_TARGET_IDS,
  PROP_CAMERA_RULE_KEYS,
  PROP_IMAGE_APP_TOKEN_PREFIXES,
  REQUIRED_PROP_ANCHOR_FIELDS,
  buildPropAnchorAdapterFromLibrary,
  enrichLocationContinuityAnchorsWithPropAnchor,
  loadPropAnchorAdapter,
  loadPropAnchorIndex,
  loadPropAnchorLibrary,
  resolvePropAnchorsForLocation,
  verifyPropTokensInjected,
  type PropAnchorRecord,
} from './propAnchor.js';
import {
  MASTER_CORE_V18_MANIFEST_PATH,
  MDS_002_SCORECARD_PATH,
  PRODUCTION_READY_BASELINE_001_PATH,
} from './mds002FullLengthMvProductionTest.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export type PropAnchorVerdict =
  | 'PASS_PROP_ANCHOR_SYSTEM_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type PropAnchorViolation = {
  code: string;
  message: string;
  field?: string;
};

export type PropAnchorAuditReport = {
  report_type: 'prop_anchor_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-PROP-ANCHOR-001';
  generated_at: string;
  prop_anchor_count: number;
  target_prop_count: number;
  duplicate_ids: number;
  runtime_fields_exported: {
    prop_anchor_ids: boolean;
    prop_tokens: boolean;
    render_payload: boolean;
    tokens_injected: boolean;
  };
  validation_target: 'RKB-010 PROP_CONTINUITY_VALIDATION';
  json_parse_result: 'valid' | 'invalid';
  validation: {
    all_target_props_present: boolean;
    duplicate_ids_zero: boolean;
    required_fields_complete: boolean;
    adapter_chain_complete: boolean;
    adapter_synced_to_latest: boolean;
    runtime_verification_exported: boolean;
    locations_resolve: boolean;
    forbidden_rules_include_core_four: boolean;
    tokens_injected: boolean;
  };
  export_path: typeof PROP_ANCHOR_ADAPTER_PATH;
  report_path: string;
  library_path: typeof PROP_ANCHOR_LIBRARY_PATH;
  index_path: typeof PROP_ANCHOR_INDEX_PATH;
  final_verdict: PropAnchorVerdict;
  violations: readonly PropAnchorViolation[];
  next_phases: readonly string[];
};

const REPORT_FILE = 'prop-anchor-adapter-report.json';

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function hasRequiredFields(prop: PropAnchorRecord): boolean {
  return REQUIRED_PROP_ANCHOR_FIELDS.every((field) => {
    const value = prop[field as keyof PropAnchorRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });
}

function hasCameraRules(prop: PropAnchorRecord): boolean {
  return PROP_CAMERA_RULE_KEYS.every((key) => {
    const rule = prop.camera_rules[key];
    return typeof rule === 'string' && rule.trim().length > 0;
  });
}

function hasCoreForbiddenRules(prop: PropAnchorRecord): boolean {
  return CORE_PROP_FORBIDDEN_RULES.every((rule) => prop.forbidden_mutation_rules.includes(rule));
}

export function runPropAnchorPrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  mds002Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const mds002 = readJson<{ final_verdict?: string }>(root, MDS_002_SCORECARD_PATH);
  const mds002Verdict = mds002?.final_verdict ?? null;
  if (mds002Verdict !== 'PASS_MDS_002_FULL_LENGTH_MV_PRODUCTION_TEST') {
    violations.push(
      `Expected PASS_MDS_002_FULL_LENGTH_MV_PRODUCTION_TEST, got ${mds002Verdict ?? 'missing'}`
    );
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH))) {
    violations.push(`Missing ${PRODUCTION_READY_BASELINE_001_PATH}`);
  }

  if (!fs.existsSync(path.join(root, MASTER_CORE_V18_MANIFEST_PATH))) {
    violations.push(`Missing ${MASTER_CORE_V18_MANIFEST_PATH}`);
  }

  return { pass: violations.length === 0, violations, mds002Verdict };
}

function entryExportsRuntimeFields(
  entry: ReturnType<typeof loadPropAnchorAdapter>['location_to_prop_map'][number]
): boolean {
  return Boolean(
    entry.location_id &&
      entry.indoor_anchor_id &&
      Array.isArray(entry.prop_anchor_ids) &&
      entry.prop_anchor_ids.length > 0 &&
      Array.isArray(entry.prop_tokens) &&
      entry.prop_tokens.length > 0 &&
      entry.prop_tokens.some((token) => token.startsWith('prop-anchor:')) &&
      entry.render_payload &&
      Array.isArray(entry.render_payload.prop_anchors) &&
      entry.render_payload.prop_anchors.length > 0
  );
}

export function auditPropAnchorSystem(projectRoot?: string): PropAnchorAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: PropAnchorViolation[] = [];
  let jsonParseResult: 'valid' | 'invalid' = 'valid';

  const precheck = runPropAnchorPrecheck(root);
  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeReport(violations, 'FAIL_PRECHECK', jsonParseResult, 0);
  }

  let library;
  let index;
  try {
    library = loadPropAnchorLibrary(root);
    index = loadPropAnchorIndex(root);
  } catch (error) {
    jsonParseResult = 'invalid';
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Prop anchor JSON parse failed',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', jsonParseResult, 0);
  }

  const propIds = new Set<string>();
  let duplicateIds = 0;

  for (const prop of library.props) {
    if (propIds.has(prop.prop_anchor_id)) duplicateIds += 1;
    propIds.add(prop.prop_anchor_id);

    if (!hasRequiredFields(prop)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Prop ${prop.prop_anchor_id} missing required schema fields`,
        field: prop.prop_anchor_id,
      });
    }
    if (!hasCameraRules(prop)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Prop ${prop.prop_anchor_id} missing one or more camera_rules shot keys`,
        field: prop.prop_anchor_id,
      });
    }
    if (!hasCoreForbiddenRules(prop)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Prop ${prop.prop_anchor_id} missing core forbidden mutation rules`,
        field: prop.prop_anchor_id,
      });
    }
  }

  for (const target of PROP_ANCHOR_TARGET_IDS) {
    if (!propIds.has(target)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Phase 1 target prop missing: ${target}`,
        field: target,
      });
    }
  }

  if (library.props.length !== 14) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Expected 14 prop anchors, found ${library.props.length}`,
    });
  }

  if (index.entries.length !== library.props.length) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Index entry count must match library prop count',
    });
  }

  const rebuiltAdapter = buildPropAnchorAdapterFromLibrary(library);
  publishGovernedExport({
    projectRoot: root,
    relativePath: PROP_ANCHOR_ADAPTER_PATH,
    datasetName: 'prop-anchor-adapter',
    datasetVersion: 'v1',
    datasetType: 'prop_anchor_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);
  const latestAdapterPath = path.join(root, 'exports/image_app/latest/prop-anchor-adapter.json');
  const adapterSynced = fs.existsSync(latestAdapterPath);

  if (!adapterSynced) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'prop-anchor-adapter.json was not synced to exports/image_app/latest/',
    });
  }

  const adapter = loadPropAnchorAdapter(root);
  const runtimeExported = adapter.location_to_prop_map.every(entryExportsRuntimeFields);
  if (!runtimeExported) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'Adapter map entries must export location_id, indoor_anchor_id, prop_anchor_ids, prop_tokens, render_payload',
      field: 'location_to_prop_map',
    });
  }

  let locationsResolve = true;
  for (const locationId of adapter.location_to_prop_map.map((row) => row.location_id)) {
    const resolution = resolvePropAnchorsForLocation(locationId, 'medium', root);
    if (!resolution) {
      locationsResolve = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Resolver failed for location ${locationId}`,
        field: locationId,
      });
    }
  }

  const sampleTokens = enrichLocationContinuityAnchorsWithPropAnchor(
    [],
    ['gonegi_bedroom_01'],
    'medium',
    root
  );
  const tokensInjected = verifyPropTokensInjected(sampleTokens);
  if (!tokensInjected) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: `Image App tokens must include prefixes: ${PROP_IMAGE_APP_TOKEN_PREFIXES.join(', ')}`,
    });
  }

  const adapterChainComplete =
    Array.isArray(rebuiltAdapter.adapter_responsibility_chain) &&
    (rebuiltAdapter.adapter_responsibility_chain as string[]).join('→') ===
      'location_id→indoor_anchor_id→prop_anchor_ids→render_payload';

  if (!adapterChainComplete) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'adapter_responsibility_chain must be location_id → indoor_anchor_id → prop_anchor_ids → render_payload',
    });
  }

  const verdict: PropAnchorVerdict =
    violations.length === 0 ? 'PASS_PROP_ANCHOR_SYSTEM_V1' : 'NEEDS_REFINEMENT';

  const report = finalizeReport(
    violations,
    verdict,
    jsonParseResult,
    duplicateIds,
    library.props.length,
    {
      all_target_props_present: PROP_ANCHOR_TARGET_IDS.every((id) => propIds.has(id)),
      duplicate_ids_zero: duplicateIds === 0,
      required_fields_complete: !violations.some((v) =>
        v.message.includes('missing required schema fields')
      ),
      adapter_chain_complete: adapterChainComplete,
      adapter_synced_to_latest: adapterSynced,
      runtime_verification_exported: runtimeExported,
      locations_resolve: locationsResolve,
      forbidden_rules_include_core_four: !violations.some((v) =>
        v.message.includes('core forbidden mutation rules')
      ),
      tokens_injected: tokensInjected,
    }
  );

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: PropAnchorViolation[],
  verdict: PropAnchorVerdict,
  jsonParseResult: 'valid' | 'invalid',
  duplicateIds: number,
  propCount = 0,
  validationOverrides?: PropAnchorAuditReport['validation']
): PropAnchorAuditReport {
  const validation = validationOverrides ?? {
    all_target_props_present: false,
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
    report_type: 'prop_anchor_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-PROP-ANCHOR-001',
    generated_at: new Date().toISOString(),
    prop_anchor_count: propCount,
    target_prop_count: 14,
    duplicate_ids: duplicateIds,
    runtime_fields_exported: {
      prop_anchor_ids: validation.runtime_verification_exported,
      prop_tokens: validation.runtime_verification_exported,
      render_payload: validation.runtime_verification_exported,
      tokens_injected: validation.tokens_injected,
    },
    validation_target: 'RKB-010 PROP_CONTINUITY_VALIDATION',
    json_parse_result: jsonParseResult,
    validation,
    export_path: PROP_ANCHOR_ADAPTER_PATH,
    report_path: path.posix.join(IMAGE_APP_REPORTS_DIR, REPORT_FILE),
    library_path: PROP_ANCHOR_LIBRARY_PATH,
    index_path: PROP_ANCHOR_INDEX_PATH,
    final_verdict: verdict,
    violations,
    next_phases: ['PHASE-RKB-010 PROP_CONTINUITY_VALIDATION'],
  };
}

export function runPropAnchorAudit(projectRoot?: string): PropAnchorAuditReport {
  return auditPropAnchorSystem(projectRoot);
}
