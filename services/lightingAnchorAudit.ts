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
  INITIAL_LIGHTING_ANCHOR_IDS,
  LIGHTING_ANCHOR_ADAPTER_PATH,
  LIGHTING_ANCHOR_INDEX_PATH,
  LIGHTING_ANCHOR_LIBRARY_PATH,
  REQUIRED_LIGHTING_ANCHOR_FIELDS,
  buildLightingAnchorAdapterFromLibrary,
  loadLightingAnchorAdapter,
  loadLightingAnchorIndex,
  loadLightingAnchorLibrary,
  resolveLightingAnchorByDnaId,
  type LightingAnchorRecord,
} from './lightingAnchor.js';

export type LightingAnchorVerdict =
  | 'PASS_LIGHTING_ANCHOR_BUNDLE_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type LightingAnchorViolation = {
  code: string;
  message: string;
  field?: string;
};

export type LightingAnchorAuditReport = {
  report_type: 'lighting_anchor_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-LTD-005';
  generated_at: string;
  anchor_count: number;
  target_anchor_count: number;
  duplicate_ids: number;
  runtime_fields_exported: {
    lighting_anchor_id: boolean;
    lighting_tokens: boolean;
    render_payload: boolean;
  };
  validation_target: 'RKB-005 LIGHTING_VALIDATION';
  json_parse_result: 'valid' | 'invalid';
  validation: {
    all_initial_anchors_present: boolean;
    duplicate_ids_zero: boolean;
    required_fields_complete: boolean;
    adapter_chain_complete: boolean;
    runtime_verification_exported: boolean;
    dna_ids_resolve: boolean;
    forbidden_rules_include_core_four: boolean;
  };
  export_path: typeof LIGHTING_ANCHOR_ADAPTER_PATH;
  report_path: string;
  library_path: typeof LIGHTING_ANCHOR_LIBRARY_PATH;
  index_path: typeof LIGHTING_ANCHOR_INDEX_PATH;
  final_verdict: LightingAnchorVerdict;
  violations: readonly LightingAnchorViolation[];
  next_phases: readonly string[];
};

const PRECHECK_PATHS = [
  'datasets/location/indoor-location-anchor-library-v1.json',
  'exports/image_app/adapters/indoor-location-anchor-adapter.json',
  'datasets/render_feedback/RKB-004_SCORECARD.json',
] as const;

const REPORT_FILE = 'lighting-anchor-adapter-report.json';

const CORE_FORBIDDEN_RULES = [
  'do_not_reverse_key_light',
  'do_not_flip_shadow_direction',
  'do_not_change_color_temperature_group',
  'do_not_remove_window_glow',
] as const;

function hasRequiredFields(anchor: LightingAnchorRecord): boolean {
  return REQUIRED_LIGHTING_ANCHOR_FIELDS.every((field) => {
    const value = anchor[field as keyof LightingAnchorRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

function hasCoreForbiddenRules(anchor: LightingAnchorRecord): boolean {
  return CORE_FORBIDDEN_RULES.every((rule) => anchor.forbidden_mutation_rules.includes(rule));
}

function entryExportsRuntimeFields(
  entry: ReturnType<typeof loadLightingAnchorAdapter>['dna_to_anchor_map'][number]
): boolean {
  return Boolean(
    entry.lighting_anchor_id &&
      Array.isArray(entry.lighting_tokens) &&
      entry.lighting_tokens.length > 0 &&
      entry.lighting_tokens.some((token) => token.startsWith('lighting-anchor:')) &&
      entry.render_payload &&
      entry.render_payload.key_light_direction &&
      entry.render_payload.shadow_direction
  );
}

export function runLightingAnchorPrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  rkb004Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  for (const relativePath of PRECHECK_PATHS) {
    if (!fs.existsSync(path.join(root, relativePath))) {
      violations.push(`Missing ${relativePath}`);
    }
  }

  const rkb004 = readJson<{ final_verdict?: string }>(root, 'datasets/render_feedback/RKB-004_SCORECARD.json');
  const rkb004Verdict = rkb004?.final_verdict ?? null;
  if (rkb004Verdict !== 'PASS_RKB_004_INDOOR_LOCATION_VALIDATION') {
    violations.push(
      `Expected RKB-004 PASS_RKB_004_INDOOR_LOCATION_VALIDATION, got ${rkb004Verdict ?? 'missing'}`
    );
  }

  return { pass: violations.length === 0, violations, rkb004Verdict };
}

function readJson<T>(projectRoot: string, relativePath: string): T | null {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function auditLightingAnchorSystem(projectRoot?: string): LightingAnchorAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: LightingAnchorViolation[] = [];
  let jsonParseResult: 'valid' | 'invalid' = 'valid';

  const precheck = runLightingAnchorPrecheck(root);
  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeReport(violations, 'FAIL_PRECHECK', jsonParseResult, 0);
  }

  let library;
  let index;
  try {
    library = loadLightingAnchorLibrary(root);
    index = loadLightingAnchorIndex(root);
  } catch (error) {
    jsonParseResult = 'invalid';
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Lighting anchor JSON parse failed',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', jsonParseResult, 0);
  }

  const anchorIds = new Set<string>();
  const dnaIds = new Set<string>();
  let duplicateIds = 0;

  for (const anchor of library.anchors) {
    if (anchorIds.has(anchor.lighting_anchor_id)) duplicateIds += 1;
    anchorIds.add(anchor.lighting_anchor_id);
    if (dnaIds.has(anchor.lighting_dna_id)) duplicateIds += 1;
    dnaIds.add(anchor.lighting_dna_id);

    if (!hasRequiredFields(anchor)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Anchor ${anchor.lighting_anchor_id} missing required schema fields`,
        field: anchor.lighting_anchor_id,
      });
    }
    if (!hasCoreForbiddenRules(anchor)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Anchor ${anchor.lighting_anchor_id} missing core forbidden mutation rules`,
        field: anchor.lighting_anchor_id,
      });
    }
  }

  for (const target of INITIAL_LIGHTING_ANCHOR_IDS) {
    if (!anchorIds.has(target)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Initial lighting anchor missing: ${target}`,
        field: target,
      });
    }
  }

  if (index.entries.length !== library.anchors.length) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Index entry count must match library anchor count',
    });
  }

  const rebuiltAdapter = buildLightingAnchorAdapterFromLibrary(library);
  publishGovernedExport({
    projectRoot: root,
    relativePath: LIGHTING_ANCHOR_ADAPTER_PATH,
    datasetName: 'lighting-anchor-adapter',
    datasetVersion: 'v1',
    datasetType: 'lighting_anchor_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);

  const adapter = loadLightingAnchorAdapter(root);
  const runtimeExported = adapter.dna_to_anchor_map.every(entryExportsRuntimeFields);
  if (!runtimeExported) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'Adapter map entries must export lighting_anchor_id, lighting_tokens, and render_payload',
      field: 'dna_to_anchor_map',
    });
  }

  let dnaResolves = true;
  for (const anchor of library.anchors) {
    const resolution = resolveLightingAnchorByDnaId(anchor.lighting_dna_id, root);
    if (!resolution) {
      dnaResolves = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Resolver failed for lighting_dna_id ${anchor.lighting_dna_id}`,
        field: anchor.lighting_dna_id,
      });
    }
  }

  const adapterChainComplete =
    Array.isArray(rebuiltAdapter.adapter_responsibility_chain) &&
    (rebuiltAdapter.adapter_responsibility_chain as string[]).length === 4;

  if (!adapterChainComplete) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'adapter_responsibility_chain must contain four resolution steps',
    });
  }

  const requiredFieldsComplete = !violations.some((v) =>
    v.message.includes('missing required schema fields')
  );
  const forbiddenRulesOk = !violations.some((v) =>
    v.message.includes('core forbidden mutation rules')
  );

  const verdict: LightingAnchorVerdict =
    violations.length === 0 ? 'PASS_LIGHTING_ANCHOR_BUNDLE_V1' : 'NEEDS_REFINEMENT';

  const report = finalizeReport(
    violations,
    verdict,
    jsonParseResult,
    duplicateIds,
    library.anchors.length,
    {
      all_initial_anchors_present: INITIAL_LIGHTING_ANCHOR_IDS.every((id) => anchorIds.has(id)),
      duplicate_ids_zero: duplicateIds === 0,
      required_fields_complete: requiredFieldsComplete,
      adapter_chain_complete: adapterChainComplete,
      runtime_verification_exported: runtimeExported,
      dna_ids_resolve: dnaResolves,
      forbidden_rules_include_core_four: forbiddenRulesOk,
    }
  );

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: LightingAnchorViolation[],
  verdict: LightingAnchorVerdict,
  jsonParseResult: 'valid' | 'invalid',
  duplicateIds: number,
  anchorCount = 0,
  validationOverrides?: LightingAnchorAuditReport['validation']
): LightingAnchorAuditReport {
  return {
    report_type: 'lighting_anchor_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-LTD-005',
    generated_at: new Date().toISOString(),
    anchor_count: anchorCount,
    target_anchor_count: INITIAL_LIGHTING_ANCHOR_IDS.length,
    duplicate_ids: duplicateIds,
    runtime_fields_exported: {
      lighting_anchor_id: validationOverrides?.runtime_verification_exported === true,
      lighting_tokens: validationOverrides?.runtime_verification_exported === true,
      render_payload: validationOverrides?.runtime_verification_exported === true,
    },
    validation_target: 'RKB-005 LIGHTING_VALIDATION',
    json_parse_result: jsonParseResult,
    validation: {
      all_initial_anchors_present: validationOverrides?.all_initial_anchors_present ?? false,
      duplicate_ids_zero: duplicateIds === 0,
      required_fields_complete: validationOverrides?.required_fields_complete ?? false,
      adapter_chain_complete: validationOverrides?.adapter_chain_complete ?? false,
      runtime_verification_exported: validationOverrides?.runtime_verification_exported ?? false,
      dna_ids_resolve: validationOverrides?.dna_ids_resolve ?? false,
      forbidden_rules_include_core_four:
        validationOverrides?.forbidden_rules_include_core_four ?? false,
    },
    export_path: LIGHTING_ANCHOR_ADAPTER_PATH,
    report_path: `${IMAGE_APP_REPORTS_DIR}/${REPORT_FILE}`,
    library_path: LIGHTING_ANCHOR_LIBRARY_PATH,
    index_path: LIGHTING_ANCHOR_INDEX_PATH,
    final_verdict: verdict,
    violations: Object.freeze([...violations]),
    next_phases: Object.freeze([
      'RKB-005 Lighting Validation',
      'SHOT-GRAMMAR-001 Cinematic Coverage Grammar',
    ]),
  };
}

export function runLightingAnchorAudit(projectRoot?: string): LightingAnchorAuditReport {
  return auditLightingAnchorSystem(projectRoot);
}
