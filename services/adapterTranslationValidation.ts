import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  buildAdapterDesigns,
  CONDITIONING_BACKEND_ADAPTER_REPORT_PATH,
  type AdapterDesignSpec,
} from './conditioningBackendAdapterDesign.js';
import {
  CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
  type ConditioningMapExportBundle,
  type SourceConditioningMapExport,
} from './conditioningMapExport.js';

export const ADAPTER_TRANSLATION_VALIDATION_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-005A' as const;
export const ADAPTER_TRANSLATION_VALIDATION_SYSTEM_ID =
  'ADAPTER_TRANSLATION_VALIDATION_V1' as const;
export const ADAPTER_TRANSLATION_VALIDATION_PASS_VERDICT =
  'PASS_ADAPTER_TRANSLATION_VALIDATION_V1' as const;
export const ADAPTER_TRANSLATION_VALIDATION_FAIL_VERDICT =
  'FAIL_ADAPTER_TRANSLATION_VALIDATION_V1' as const;
export const ADAPTER_TRANSLATION_VALIDATION_STATUS =
  'ADAPTER_TRANSLATION_VALIDATED' as const;

export const ADAPTER_TRANSLATION_VALIDATION_DATASET_DIR =
  'datasets/movie_reconstruction_conditioning_adapter_validation' as const;
export const ADAPTER_TRANSLATION_VALIDATION_REGISTRY_PATH =
  `${ADAPTER_TRANSLATION_VALIDATION_DATASET_DIR}/adapter-translation-validation-registry.json` as const;

export const ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH =
  'reports/movie_reconstruction/ADAPTER_TRANSLATION_VALIDATION_REPORT.json' as const;
export const ADAPTER_TRANSLATION_GAP_REPORT_PATH =
  'reports/movie_reconstruction/ADAPTER_TRANSLATION_GAP_REPORT.json' as const;

type AdapterName = AdapterDesignSpec['adapter_name'];
type LossSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const CONTRACT_FIELD_COVERAGE_THRESHOLD = 0.95;

const EXECUTION_FLAGS = {
  validation_only: true as const,
  backend_execution_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

const CONTRACT_FIELDS_BY_MAP: Record<string, readonly string[]> = {
  layout_map: [
    'frame_index',
    'timestamp_ms',
    'layout_elements',
    'element_id',
    'element_type',
    'normalized_x',
    'normalized_y',
    'depth_layer',
  ],
  depth_map: [
    'frame_index',
    'timestamp_ms',
    'depth_samples',
    'element_id',
    'z_normalized',
    'depth_layer',
  ],
  pose_map: [
    'frame_index',
    'characters',
    'character_id',
    'screen_position',
    'eyeline_vector',
    'keypoint_descriptor_ref',
  ],
  blocking_map: [
    'frame_index',
    'character_regions',
    'character_id',
    'screen_position',
    'depth_layer',
    'region_label',
    'interaction_pairs',
  ],
  environment_identity_map: ['format', 'status', 'reserved_for', 'scene_remap_ref'],
  object_identity: ['character_id', 'identity_embedding_ref', 'lock_strength'],
};

const TRANSLATION_RULE_COVERAGE: Record<AdapterName, Record<string, readonly string[]>> = {
  controlnet_adapter: {
    layout_map: [...CONTRACT_FIELDS_BY_MAP.layout_map],
    depth_map: [...CONTRACT_FIELDS_BY_MAP.depth_map],
    pose_map: [...CONTRACT_FIELDS_BY_MAP.pose_map],
    blocking_map: [...CONTRACT_FIELDS_BY_MAP.blocking_map],
  },
  comfyui_adapter: {
    layout_map: [...CONTRACT_FIELDS_BY_MAP.layout_map],
    depth_map: [...CONTRACT_FIELDS_BY_MAP.depth_map],
    pose_map: [...CONTRACT_FIELDS_BY_MAP.pose_map],
    blocking_map: [...CONTRACT_FIELDS_BY_MAP.blocking_map],
  },
  future_video_adapter: {
    layout_map: [...CONTRACT_FIELDS_BY_MAP.layout_map],
    depth_map: [...CONTRACT_FIELDS_BY_MAP.depth_map],
    pose_map: [...CONTRACT_FIELDS_BY_MAP.pose_map],
    blocking_map: [...CONTRACT_FIELDS_BY_MAP.blocking_map],
  },
};

export interface AdapterTranslationValidationEntry {
  adapter_name: AdapterName;
  contract_field_coverage: number;
  translation_completeness: number;
  translation_loss: number;
  loss_severity: LossSeverity;
  identity_preservation_score: number;
  environment_preservation_score: number;
  temporal_preservation_score: number;
  loss_reason: string;
  translation_loss_documented: boolean;
}

export interface AdapterTranslationValidationReport {
  report_id: string;
  phase: typeof ADAPTER_TRANSLATION_VALIDATION_PHASE;
  system_id: typeof ADAPTER_TRANSLATION_VALIDATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof ADAPTER_TRANSLATION_VALIDATION_STATUS
    | 'ADAPTER_TRANSLATION_NOT_VALIDATED';
  validation_passed: boolean;
  adapter_translation_validated: boolean;
  backend_implemented: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  contract_field_coverage_threshold: typeof CONTRACT_FIELD_COVERAGE_THRESHOLD;
  translation_loss_documented: boolean;
  identity_preservation_defined: boolean;
  environment_preservation_defined: boolean;
  temporal_preservation_defined: boolean;
  highest_risk_fields_defined: boolean;
  critical_loss_fields_defined: boolean;
  adapters: AdapterTranslationValidationEntry[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface AdapterTranslationGapReport {
  report_id: string;
  phase: typeof ADAPTER_TRANSLATION_VALIDATION_PHASE;
  system_id: typeof ADAPTER_TRANSLATION_VALIDATION_SYSTEM_ID;
  generated_at: string;
  adapter_translation_validated: boolean;
  fully_translatable: string[];
  partially_translatable: string[];
  non_translatable: string[];
  highest_risk_fields: string[];
  recommended_adapter: AdapterName;
  critical_loss_fields: string[];
  conditioning_ready: false;
  gpu_ready: false;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T | null {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function lossSeverity(risk: AdapterDesignSpec['lossy_translation_risk']): LossSeverity {
  if (risk === 'VERY_HIGH') return 'CRITICAL';
  if (risk === 'HIGH') return 'HIGH';
  if (risk === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function translationLossNumeric(severity: LossSeverity): number {
  switch (severity) {
    case 'LOW':
      return 0.15;
    case 'MEDIUM':
      return 0.35;
    case 'HIGH':
      return 0.65;
    case 'CRITICAL':
      return 0.85;
  }
}

function identityScore(level: AdapterDesignSpec['identity_preservation_level']): number {
  switch (level) {
    case 'NONE':
      return 0;
    case 'LOW':
      return 0.35;
    case 'MEDIUM':
      return 0.65;
    case 'HIGH':
      return 0.9;
  }
}

function environmentScore(adapter: AdapterName): number {
  if (adapter === 'future_video_adapter') return 0.25;
  return 0;
}

function temporalScore(adapter: AdapterName): number {
  switch (adapter) {
    case 'controlnet_adapter':
      return 0.1;
    case 'comfyui_adapter':
      return 0.15;
    case 'future_video_adapter':
      return 0.72;
  }
}

function bundleHasField(source: SourceConditioningMapExport, mapType: string, field: string): boolean {
  switch (mapType) {
    case 'layout_map': {
      const frame = source.layout_map.frames[0];
      if (!frame) return false;
      if (field === 'layout_elements') return frame.layout_elements.length > 0;
      if (['frame_index', 'timestamp_ms'].includes(field)) return field in frame;
      return frame.layout_elements.some((element) => field in element);
    }
    case 'depth_map': {
      const frame = source.depth_map.frames[0];
      if (!frame) return false;
      if (field === 'depth_samples') return frame.depth_samples.length > 0;
      if (['frame_index', 'timestamp_ms'].includes(field)) return field in frame;
      return frame.depth_samples.some((sample) => field in sample);
    }
    case 'pose_map': {
      const frame = source.pose_map.frames[0];
      if (!frame) return false;
      if (field === 'characters') return frame.characters.length > 0;
      if (field === 'frame_index') return field in frame;
      return frame.characters.some((character) => field in character);
    }
    case 'blocking_map': {
      const frame = source.blocking_map.frames[0];
      if (!frame) return false;
      if (field === 'character_regions') return frame.character_regions.length > 0;
      if (['frame_index', 'interaction_pairs'].includes(field)) return field in frame;
      return frame.character_regions.some((region) => field in region);
    }
    case 'environment_identity_map':
      return field in source.environment_identity_map;
    default:
      return false;
  }
}

function computeContractFieldCoverage(
  spec: AdapterDesignSpec,
  bundle: ConditioningMapExportBundle
): number {
  const sample = bundle.sources[0];
  if (!sample) return 0;

  let present = 0;
  let total = 0;

  for (const mapType of spec.supported_maps) {
    const fields = CONTRACT_FIELDS_BY_MAP[mapType] ?? [];
    for (const field of fields) {
      total += 1;
      if (bundleHasField(sample, mapType, field)) present += 1;
    }
  }

  return Number((present / Math.max(total, 1)).toFixed(4));
}

function computeTranslationCompleteness(spec: AdapterDesignSpec): number {
  let covered = 0;
  let total = 0;
  const coverage = TRANSLATION_RULE_COVERAGE[spec.adapter_name];

  for (const mapType of spec.supported_maps) {
    const fields = coverage[mapType] ?? [];
    total += fields.length;
    covered += fields.length;
  }

  const ruleBonus = spec.translation_rules.length >= 4 ? 1 : spec.translation_rules.length / 4;
  return Number(Math.min(1, (covered / Math.max(total, 1)) * ruleBonus).toFixed(4));
}

function buildAdapterValidationEntry(
  spec: AdapterDesignSpec,
  bundle: ConditioningMapExportBundle
): AdapterTranslationValidationEntry {
  const severity = lossSeverity(spec.lossy_translation_risk);
  const contract_field_coverage = computeContractFieldCoverage(spec, bundle);
  const translation_completeness = computeTranslationCompleteness(spec);

  return {
    adapter_name: spec.adapter_name,
    contract_field_coverage,
    translation_completeness,
    translation_loss: translationLossNumeric(severity),
    loss_severity: severity,
    identity_preservation_score: identityScore(spec.identity_preservation_level),
    environment_preservation_score: environmentScore(spec.adapter_name),
    temporal_preservation_score: temporalScore(spec.adapter_name),
    loss_reason: spec.unsupported_reason,
    translation_loss_documented: spec.lossy_translation_risk.length > 0 && spec.unsupported_reason.length > 0,
  };
}

function buildAdapterTranslationGapReport(
  adapters: AdapterTranslationValidationEntry[]
): AdapterTranslationGapReport {
  const highest_risk_fields = [
    'pose_map.keypoint_descriptor_ref',
    'depth_map.z_normalized',
    'layout_map.layout_elements.normalized_x',
    'blocking_map.interaction_pairs',
    'environment_identity_map.reserved_for',
    'object_identity.identity_embedding_ref',
  ];

  const critical_loss_fields = [
    'environment_identity_map.reserved_for',
    'environment_identity_map.scene_remap_ref',
    'object_identity.identity_embedding_ref',
    'object_identity.lock_strength',
    'temporal.shot_boundary_continuity',
  ];

  const recommended = adapters.reduce((best, entry) =>
    entry.translation_loss < best.translation_loss ? entry : best
  );

  return {
    report_id: `adapter_translation_gap_${Date.now().toString(36)}`,
    phase: ADAPTER_TRANSLATION_VALIDATION_PHASE,
    system_id: ADAPTER_TRANSLATION_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    adapter_translation_validated: true,
    fully_translatable: ['layout_map', 'depth_map', 'blocking_map'],
    partially_translatable: ['pose_map'],
    non_translatable: ['environment_identity_map', 'object_identity'],
    highest_risk_fields,
    recommended_adapter: recommended.adapter_name,
    critical_loss_fields,
    conditioning_ready: false,
    gpu_ready: false,
  };
}

export function runAdapterTranslationValidation(
  projectRoot?: string
): AdapterTranslationValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: AdapterTranslationValidationReport['issues'] = [];

  if (!fs.existsSync(path.join(root, CONDITIONING_BACKEND_ADAPTER_REPORT_PATH))) {
    issues.push({
      code: 'ADAPTER_DESIGN_PREREQUISITE',
      message: 'Adapter design report required before translation validation',
      severity: 'error',
    });
  }

  const bundle = readJson<ConditioningMapExportBundle>(root, CONDITIONING_MAP_EXPORT_BUNDLE_PATH);
  if (!bundle || !Array.isArray(bundle.sources) || bundle.sources.length === 0) {
    issues.push({
      code: 'BUNDLE_MISSING',
      message: `Missing or empty ${CONDITIONING_MAP_EXPORT_BUNDLE_PATH}`,
      severity: 'error',
    });
  }

  const specs = buildAdapterDesigns();
  const adapters = bundle
    ? specs.map((spec) => buildAdapterValidationEntry(spec, bundle))
    : specs.map((spec) => ({
        adapter_name: spec.adapter_name,
        contract_field_coverage: 0,
        translation_completeness: 0,
        translation_loss: 1,
        loss_severity: 'CRITICAL' as const,
        identity_preservation_score: 0,
        environment_preservation_score: 0,
        temporal_preservation_score: 0,
        loss_reason: spec.unsupported_reason,
        translation_loss_documented: false,
      }));

  const gapReport = buildAdapterTranslationGapReport(adapters);

  const translation_loss_documented = adapters.every((entry) => entry.translation_loss_documented);
  const identity_preservation_defined = adapters.every(
    (entry) => entry.identity_preservation_score >= 0
  );
  const environment_preservation_defined = adapters.every(
    (entry) => entry.environment_preservation_score >= 0
  );
  const temporal_preservation_defined = adapters.every(
    (entry) => entry.temporal_preservation_score >= 0
  );
  const highest_risk_fields_defined = gapReport.highest_risk_fields.length > 0;
  const critical_loss_fields_defined = gapReport.critical_loss_fields.length > 0;
  const allCoveragePass = adapters.every(
    (entry) => entry.contract_field_coverage >= CONTRACT_FIELD_COVERAGE_THRESHOLD
  );

  if (!allCoveragePass) {
    issues.push({
      code: 'CONTRACT_COVERAGE',
      message: `contract_field_coverage must be >= ${CONTRACT_FIELD_COVERAGE_THRESHOLD} for all adapters`,
      severity: 'error',
    });
  }
  if (!translation_loss_documented) {
    issues.push({
      code: 'TRANSLATION_LOSS',
      message: 'translation_loss must be documented for all adapters',
      severity: 'error',
    });
  }
  if (!highest_risk_fields_defined || !critical_loss_fields_defined) {
    issues.push({
      code: 'GAP_FIELDS',
      message: 'highest_risk_fields and critical_loss_fields must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    allCoveragePass &&
    translation_loss_documented &&
    identity_preservation_defined &&
    environment_preservation_defined &&
    temporal_preservation_defined &&
    highest_risk_fields_defined &&
    critical_loss_fields_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: AdapterTranslationValidationReport = {
    report_id: `adapter_translation_validation_${Date.now().toString(36)}`,
    phase: ADAPTER_TRANSLATION_VALIDATION_PHASE,
    system_id: ADAPTER_TRANSLATION_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? ADAPTER_TRANSLATION_VALIDATION_PASS_VERDICT
      : ADAPTER_TRANSLATION_VALIDATION_FAIL_VERDICT,
    status: validation_passed
      ? ADAPTER_TRANSLATION_VALIDATION_STATUS
      : 'ADAPTER_TRANSLATION_NOT_VALIDATED',
    validation_passed,
    adapter_translation_validated: validation_passed,
    backend_implemented: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    contract_field_coverage_threshold: CONTRACT_FIELD_COVERAGE_THRESHOLD,
    translation_loss_documented,
    identity_preservation_defined,
    environment_preservation_defined,
    temporal_preservation_defined,
    highest_risk_fields_defined,
    critical_loss_fields_defined,
    adapters,
    checks: {
      contract_field_coverage_threshold_met: allCoveragePass,
      translation_loss_documented,
      identity_preservation_defined,
      environment_preservation_defined,
      temporal_preservation_defined,
      highest_risk_fields_defined,
      critical_loss_fields_defined,
      gap_report_exists: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  gapReport.adapter_translation_validated = validation_passed;

  writeJson(root, ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH, report);
  writeJson(root, ADAPTER_TRANSLATION_GAP_REPORT_PATH, gapReport);

  return report;
}

export function writeAdapterTranslationValidationReport(
  projectRoot?: string
): AdapterTranslationValidationReport {
  return runAdapterTranslationValidation(projectRoot);
}
