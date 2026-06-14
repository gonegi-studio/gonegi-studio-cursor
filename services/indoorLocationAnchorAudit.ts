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
  INDOOR_ANCHOR_TARGET_LOCATION_IDS,
  INDOOR_LOCATION_ANCHOR_ADAPTER_PATH,
  INDOOR_LOCATION_ANCHOR_INDEX_PATH,
  INDOOR_LOCATION_ANCHOR_LIBRARY_PATH,
  REQUIRED_ANCHOR_RECORD_FIELDS,
  buildIndoorLocationAnchorAdapterFromLibrary,
  loadIndoorLocationAnchorAdapter,
  loadIndoorLocationAnchorIndex,
  loadIndoorLocationAnchorLibrary,
  resolveIndoorLocationAnchor,
  type IndoorLocationAnchorRecord,
} from './indoorLocationAnchor.js';

export type IndoorLocationAnchorVerdict =
  | 'PASS_INDOOR_LOCATION_ANCHOR_SYSTEM_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type IndoorLocationAnchorViolation = {
  code: string;
  message: string;
  field?: string;
};

export type IndoorLocationAnchorAuditReport = {
  report_type: 'indoor_location_anchor_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-LTD-004';
  generated_at: string;
  anchor_count: number;
  target_location_count: number;
  duplicate_ids: number;
  runtime_fields_exported: {
    anchor_id: boolean;
    fixed_anchor_objects: boolean;
    camera_view_rules: boolean;
    render_payload: boolean;
  };
  validation_target: 'RKB-004 INDOOR_LOCATION_VALIDATION';
  json_parse_result: 'valid' | 'invalid';
  validation: {
    all_targets_anchored: boolean;
    duplicate_ids_zero: boolean;
    required_fields_complete: boolean;
    adapter_chain_complete: boolean;
    runtime_verification_exported: boolean;
    image_app_consumption_simulated: boolean;
  };
  export_path: typeof INDOOR_LOCATION_ANCHOR_ADAPTER_PATH;
  report_path: string;
  library_path: typeof INDOOR_LOCATION_ANCHOR_LIBRARY_PATH;
  index_path: typeof INDOOR_LOCATION_ANCHOR_INDEX_PATH;
  final_verdict: IndoorLocationAnchorVerdict;
  violations: readonly IndoorLocationAnchorViolation[];
  next_phases: readonly string[];
};

const PRECHECK_PATHS = [
  'datasets/location/location-dna-library-v1.json',
  'datasets/location/location-dna-index-v1.json',
  'exports/image_app/adapters/location-lighting-image-adapter.json',
] as const;

const REPORT_FILE = 'indoor-location-anchor-adapter-report.json';

function hasRequiredAnchorFields(anchor: IndoorLocationAnchorRecord): boolean {
  return REQUIRED_ANCHOR_RECORD_FIELDS.every((field) => {
    const value = anchor[field as keyof IndoorLocationAnchorRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value as object).length > 0;
    return true;
  });
}

function entryExportsRuntimeFields(
  entry: ReturnType<typeof loadIndoorLocationAnchorAdapter>['location_to_anchor_map'][number]
): boolean {
  const anchorId = entry.anchor_id ?? entry.indoor_anchor_id;
  const fixedObjects = entry.fixed_anchor_objects ?? entry.anchor_objects;
  const cameraRules = entry.camera_view_rules ?? entry.camera_rules;
  return Boolean(
    anchorId &&
      Array.isArray(fixedObjects) &&
      fixedObjects.length > 0 &&
      cameraRules &&
      typeof cameraRules.wide === 'string' &&
      typeof cameraRules.medium === 'string' &&
      typeof cameraRules.close === 'string' &&
      entry.render_payload &&
      Array.isArray(entry.render_payload.spatial_tokens) &&
      entry.render_payload.spatial_tokens.length > 0
  );
}

export function auditIndoorLocationAnchorSystem(projectRoot?: string): IndoorLocationAnchorAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: IndoorLocationAnchorViolation[] = [];
  let jsonParseResult: 'valid' | 'invalid' = 'valid';

  for (const relativePath of PRECHECK_PATHS) {
    if (!fs.existsSync(path.join(root, relativePath))) {
      violations.push({
        code: 'FAIL_PRECHECK',
        message: `Required asset missing: ${relativePath}`,
        field: relativePath,
      });
    }
  }

  if (violations.some((entry) => entry.code === 'FAIL_PRECHECK')) {
    return finalizeReport(violations, 'FAIL_PRECHECK', jsonParseResult, 0);
  }

  let library;
  let index;
  try {
    library = loadIndoorLocationAnchorLibrary(root);
    index = loadIndoorLocationAnchorIndex(root);
  } catch (error) {
    jsonParseResult = 'invalid';
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Indoor anchor JSON parse failed',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', jsonParseResult, 0);
  }

  const anchorIds = new Set<string>();
  const locationIds = new Set<string>();
  let duplicateIds = 0;

  for (const anchor of library.anchors) {
    if (anchorIds.has(anchor.anchor_id)) duplicateIds += 1;
    anchorIds.add(anchor.anchor_id);
    if (locationIds.has(anchor.location_id)) duplicateIds += 1;
    locationIds.add(anchor.location_id);

    if (!hasRequiredAnchorFields(anchor)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Anchor ${anchor.anchor_id} missing required schema fields`,
        field: anchor.location_id,
      });
    }
  }

  for (const target of INDOOR_ANCHOR_TARGET_LOCATION_IDS) {
    if (!locationIds.has(target)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Target indoor location not anchored: ${target}`,
        field: target,
      });
    }
  }

  if (index.entries.length !== library.anchors.length) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Index entry count must match library anchor count',
      field: 'anchor_count',
    });
  }

  const rebuiltAdapter = buildIndoorLocationAnchorAdapterFromLibrary(library);
  publishGovernedExport({
    projectRoot: root,
    relativePath: INDOOR_LOCATION_ANCHOR_ADAPTER_PATH,
    datasetName: 'indoor-location-anchor-adapter',
    datasetVersion: 'v1',
    datasetType: 'indoor_location_anchor_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);

  const adapter = loadIndoorLocationAnchorAdapter(root);
  const runtimeExported = adapter.location_to_anchor_map.every(entryExportsRuntimeFields);
  if (!runtimeExported) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Adapter map entries must export anchor_id, fixed_anchor_objects, camera_view_rules, render_payload',
      field: 'location_to_anchor_map',
    });
  }

  let consumptionSimulated = true;
  for (const target of INDOOR_ANCHOR_TARGET_LOCATION_IDS) {
    const resolution = resolveIndoorLocationAnchor(target, 'mid', root);
    if (!resolution) {
      consumptionSimulated = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Image App resolver failed for ${target}`,
        field: target,
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

  const verdict: IndoorLocationAnchorVerdict =
    violations.length === 0 ? 'PASS_INDOOR_LOCATION_ANCHOR_SYSTEM_V1' : 'NEEDS_REFINEMENT';

  const requiredFieldsComplete = !violations.some((v) =>
    v.message.includes('required schema fields')
  );

  const report = finalizeReport(
    violations,
    verdict,
    jsonParseResult,
    duplicateIds,
    library.anchors.length,
    {
      all_targets_anchored: INDOOR_ANCHOR_TARGET_LOCATION_IDS.every((id) => locationIds.has(id)),
      duplicate_ids_zero: duplicateIds === 0,
      required_fields_complete: requiredFieldsComplete,
      adapter_chain_complete: adapterChainComplete,
      runtime_verification_exported: runtimeExported,
      image_app_consumption_simulated: consumptionSimulated,
    }
  );

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: IndoorLocationAnchorViolation[],
  verdict: IndoorLocationAnchorVerdict,
  jsonParseResult: 'valid' | 'invalid',
  duplicateIds: number,
  anchorCount = 0,
  validationOverrides?: IndoorLocationAnchorAuditReport['validation']
): IndoorLocationAnchorAuditReport {
  const allTargetsAnchored =
    validationOverrides?.all_targets_anchored ??
    !violations.some((entry) => entry.message.includes('not anchored'));
  const requiredFieldsComplete =
    validationOverrides?.required_fields_complete ??
    !violations.some((entry) => entry.message.includes('required schema'));

  return {
    report_type: 'indoor_location_anchor_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-LTD-004',
    generated_at: new Date().toISOString(),
    anchor_count: anchorCount,
    target_location_count: INDOOR_ANCHOR_TARGET_LOCATION_IDS.length,
    duplicate_ids: duplicateIds,
    runtime_fields_exported: {
      anchor_id: validationOverrides?.runtime_verification_exported === true,
      fixed_anchor_objects: validationOverrides?.runtime_verification_exported === true,
      camera_view_rules: validationOverrides?.runtime_verification_exported === true,
      render_payload: validationOverrides?.runtime_verification_exported === true,
    },
    validation_target: 'RKB-004 INDOOR_LOCATION_VALIDATION',
    json_parse_result: jsonParseResult,
    validation: {
      all_targets_anchored: allTargetsAnchored,
      duplicate_ids_zero: duplicateIds === 0,
      required_fields_complete: requiredFieldsComplete,
      adapter_chain_complete: validationOverrides?.adapter_chain_complete ?? false,
      runtime_verification_exported: validationOverrides?.runtime_verification_exported ?? false,
      image_app_consumption_simulated:
        validationOverrides?.image_app_consumption_simulated ?? false,
    },
    export_path: INDOOR_LOCATION_ANCHOR_ADAPTER_PATH,
    report_path: `${IMAGE_APP_REPORTS_DIR}/${REPORT_FILE}`,
    library_path: INDOOR_LOCATION_ANCHOR_LIBRARY_PATH,
    index_path: INDOOR_LOCATION_ANCHOR_INDEX_PATH,
    final_verdict: verdict,
    violations: Object.freeze([...violations]),
    next_phases: Object.freeze([
      'LTD-005 Lighting Anchor Bundle',
      'RKB-005 Lighting Validation',
      'SHOT-GRAMMAR-001 Cinematic Coverage Grammar',
      'PHASE-IMG-003 / RKB-004 Indoor Location Validation Test',
    ]),
  };
}

export function runIndoorLocationAnchorAudit(projectRoot?: string): IndoorLocationAnchorAuditReport {
  return auditIndoorLocationAnchorSystem(projectRoot);
}
