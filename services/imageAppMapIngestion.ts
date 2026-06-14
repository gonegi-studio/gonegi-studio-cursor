import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { CONDITIONING_MAP_EXPORT_BUNDLE_PATH } from './conditioningMapExport.js';
import { ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH } from './environmentIdentityStrategy.js';
import { OBJECT_REFERENCE_BANK_SPECIFICATION_PATH } from './objectIdentityStrategy.js';
import { TEMPORAL_MEMORY_SPECIFICATION_PATH } from './temporalPreservationStrategy.js';
import { ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH } from './adapterTranslationValidation.js';

export const IMAGE_APP_MAP_INGESTION_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-006' as const;
export const IMAGE_APP_MAP_INGESTION_SYSTEM_ID = 'IMAGE_APP_MAP_INGESTION_V1' as const;
export const IMAGE_APP_MAP_INGESTION_PASS_VERDICT = 'PASS_IMAGE_APP_MAP_INGESTION_V1' as const;
export const IMAGE_APP_MAP_INGESTION_FAIL_VERDICT = 'FAIL_IMAGE_APP_MAP_INGESTION_V1' as const;
export const IMAGE_APP_MAP_INGESTION_STATUS = 'IMAGE_APP_MAP_INGESTION_DEFINED' as const;

export const IMAGE_APP_MAP_INGESTION_DATASET_DIR =
  'datasets/movie_reconstruction_image_app_map_ingestion' as const;
export const IMAGE_APP_MAP_INGESTION_REGISTRY_PATH =
  `${IMAGE_APP_MAP_INGESTION_DATASET_DIR}/image-app-map-ingestion-registry.json` as const;

export const IMAGE_APP_INGESTION_SPECIFICATION_PATH =
  'reports/movie_reconstruction/IMAGE_APP_INGESTION_SPECIFICATION.json' as const;
export const IMAGE_APP_MAP_INGESTION_REPORT_PATH =
  'reports/movie_reconstruction/IMAGE_APP_MAP_INGESTION_REPORT.json' as const;

const FALLBACK_BEHAVIOR =
  'If backend map ingestion is unavailable, degrade to text spatial compiler with NOT_PRODUCTION_REPLICA flag.' as const;

const EXECUTION_FLAGS = {
  ingestion_only: true as const,
  implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface ImageAppIngestionSpecification {
  specification_id: string;
  phase: typeof IMAGE_APP_MAP_INGESTION_PHASE;
  system_id: typeof IMAGE_APP_MAP_INGESTION_SYSTEM_ID;
  generated_at: string;
  ingestion_contract: Record<string, string>;
  map_binding_format: Record<string, string>;
  reference_bank_binding: Record<string, string>;
  temporal_binding: Record<string, string>;
  adapter_binding: Record<string, string>;
  fallback_text_path: Record<string, string>;
  runtime_bridge: {
    bridge_id: string;
    consumer_target: 'image_app';
    bridge_type: 'conditioning_map_ingestion_bridge';
    source_bundle_ref: string;
    recommended_adapter: string;
    bridge_only: true;
    description: string;
  };
  supported_inputs: string[];
  unsupported_inputs: string[];
  binding_rules: string[];
  translation_path: string[];
  fallback_behavior: typeof FALLBACK_BEHAVIOR;
  ingestion_contract_defined: true;
}

export interface ImageAppMapIngestionReport {
  report_id: string;
  phase: typeof IMAGE_APP_MAP_INGESTION_PHASE;
  system_id: typeof IMAGE_APP_MAP_INGESTION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof IMAGE_APP_MAP_INGESTION_STATUS | 'IMAGE_APP_MAP_INGESTION_NOT_DEFINED';
  validation_passed: boolean;
  image_app_map_ingestion_defined: boolean;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  ingestion_contract_defined: boolean;
  binding_rules_defined: boolean;
  translation_path_defined: boolean;
  fallback_text_path_defined: boolean;
  runtime_bridge_defined: boolean;
  supported_input_count: number;
  unsupported_input_count: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(full, 'utf8')) as T;
}

const INGESTION_CONTRACT = {
  contract_id: 'image_app_map_ingestion_contract_v1',
  contract_version: '1.0',
  consumer_target: 'image_app',
  source_bundle: CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
  adapter_required: 'true — maps must pass through adapter_binding before image_app consumption.',
  contract_fields:
    'source_video_id, layout_map, depth_map, pose_map, blocking_map, environment_reference_bank_ref, object_reference_bank_ref, temporal_memory_ref.',
  validation_mode: 'ingestion_only — metadata binding without GPU raster generation or backend execution.',
  not_production_replica_flag:
    'Set when fallback_text_path is used instead of backend map ingestion.',
} as const;

const MAP_BINDING_FORMAT = {
  binding_id: 'Unique map binding record identifier.',
  source_video_id: 'Canonical numerical DNA source identifier from conditioning map export.',
  map_type: 'Map enum: layout_map | depth_map | pose_map | blocking_map.',
  map_format: 'Backend-independent format label from conditioning-map-export-bundle.',
  frame_selector: 'Frame index or timestamp_ms selector for per-shot ingestion.',
  binding_target: 'Image app conditioning slot: controlnet_layout | controlnet_depth | openpose | regional_blocking.',
  export_ref: 'Path into conditioning-map-export-bundle sources[].<map_type>.',
} as const;

const REFERENCE_BANK_BINDING = {
  binding_id: 'Unique reference bank binding record identifier.',
  bank_type: 'Bank enum: environment_reference_bank | object_reference_bank.',
  bank_spec_ref:
    'Path to ENVIRONMENT_REFERENCE_BANK_SPECIFICATION.json or OBJECT_REFERENCE_BANK_SPECIFICATION.json.',
  entry_selector: 'Primary key: environment_id or object_id.',
  anchor_images_ref: 'Metadata path to anchor_images array in bank entry.',
  identity_level: 'Object identity lock enum when bank_type=object_reference_bank.',
  ip_adapter_weight_ref: 'Derived lock_strength = 1.0 - variation_tolerance (metadata only).',
} as const;

const TEMPORAL_BINDING = {
  binding_id: 'Unique temporal binding record identifier.',
  timeline_id: 'Timeline slot from TEMPORAL_MEMORY_SPECIFICATION temporal_memory_records.',
  edit_rhythm_signature: 'Edit rhythm hash bound to shot duration and cut_type.',
  continuity_signature: 'Shot boundary continuity hash for adjacent shot lookup.',
  causal_transition_chain: 'Ordered transition_id list for scene transition traversal.',
  temporal_spec_ref: 'Path to TEMPORAL_MEMORY_SPECIFICATION.json.',
} as const;

const ADAPTER_BINDING = {
  binding_id: 'Unique adapter binding record identifier.',
  adapter_name: 'Adapter enum: controlnet_adapter | comfyui_adapter | future_video_adapter.',
  input_contract_version: '1.0 from conditioning-map-export contract.',
  supported_maps: 'Maps translatable by selected adapter per ADAPTER_TRANSLATION_VALIDATION_REPORT.',
  translation_rules_ref: 'Path to CONDITIONING_BACKEND_ADAPTER_REPORT adapter_specs translation_rules.',
  recommended_adapter: 'comfyui_adapter — lowest translation_loss per adapter translation validation.',
} as const;

const FALLBACK_TEXT_PATH = {
  path_id: 'text_spatial_compiler_fallback_v1',
  compiler: 'ConditionedPromptBuilder',
  trigger: 'backend map ingestion unavailable or adapter_binding fails validation.',
  output_flag: 'NOT_PRODUCTION_REPLICA',
  preserved_constraints:
    'Narrative text constraints, blocking labels, and scene_remap gonegi_scene_id when maps unavailable.',
  degraded_fields:
    'layout_map, depth_map, pose_map raster control signals; environment/object IP-Adapter weights.',
  fallback_behavior: FALLBACK_BEHAVIOR,
} as const;

const SUPPORTED_INPUTS = [
  'layout_map.normalized_layout_elements_v1',
  'depth_map.normalized_depth_samples_v1',
  'pose_map.keypoint_descriptor_ref_v1',
  'blocking_map.character_regions_v1',
  'environment_reference_bank.environment_id',
  'environment_reference_bank.anchor_descriptors',
  'object_reference_bank.object_id',
  'object_reference_bank.identity_level',
  'temporal_memory.timeline_id',
  'temporal_memory.edit_rhythm_signature',
  'temporal_memory.causal_transition_chain',
  'adapter_binding.comfyui_adapter',
] as const;

const UNSUPPORTED_INPUTS = [
  'environment_identity_map.reserved_v1_payload',
  'object_identity.identity_embedding_ref',
  'raster_control_maps',
  'gpu_backend_execution',
  'video_conditioning_backend',
  'ocr_extraction',
  'external_api_inference',
] as const;

const BINDING_RULES = [
  'Bind layout_map, depth_map, pose_map, and blocking_map from conditioning-map-export-bundle by source_video_id + frame_selector.',
  'Resolve environment_reference_bank entries by environment_id via ENVIRONMENT_REFERENCE_BANK_SPECIFICATION.',
  'Resolve object_reference_bank entries by object_id with identity_level and variation_tolerance from OBJECT_REFERENCE_BANK_SPECIFICATION.',
  'Attach temporal_memory records by timeline_id from TEMPORAL_MEMORY_SPECIFICATION for edit rhythm and causal transitions.',
  'Route translatable maps through comfyui_adapter per adapter_binding before image_app runtime_bridge consumption.',
  'When any required map binding fails, activate fallback_text_path with NOT_PRODUCTION_REPLICA flag.',
] as const;

const TRANSLATION_PATH = [
  'source_video_numerical_dna_full → conditioning-map-export-bundle',
  'conditioning-map-export-bundle → map_binding_format per source_video_id',
  'ENVIRONMENT_REFERENCE_BANK_SPECIFICATION → reference_bank_binding.environment_reference_bank',
  'OBJECT_REFERENCE_BANK_SPECIFICATION → reference_bank_binding.object_reference_bank',
  'TEMPORAL_MEMORY_SPECIFICATION → temporal_binding',
  'adapter_binding.comfyui_adapter → image_app runtime_bridge',
  'runtime_bridge → image_app conditioning slots OR fallback_text_path → ConditionedPromptBuilder',
] as const;

export function buildImageAppIngestionSpecification(): ImageAppIngestionSpecification {
  return {
    specification_id: 'image-app-ingestion-specification-v1',
    phase: IMAGE_APP_MAP_INGESTION_PHASE,
    system_id: IMAGE_APP_MAP_INGESTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    ingestion_contract: { ...INGESTION_CONTRACT },
    map_binding_format: { ...MAP_BINDING_FORMAT },
    reference_bank_binding: { ...REFERENCE_BANK_BINDING },
    temporal_binding: { ...TEMPORAL_BINDING },
    adapter_binding: { ...ADAPTER_BINDING },
    fallback_text_path: { ...FALLBACK_TEXT_PATH },
    runtime_bridge: {
      bridge_id: 'image_app_conditioning_map_ingestion_bridge_v1',
      consumer_target: 'image_app',
      bridge_type: 'conditioning_map_ingestion_bridge',
      source_bundle_ref: CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
      recommended_adapter: 'comfyui_adapter',
      bridge_only: true,
      description:
        'Metadata bridge binding conditioning map export, reference banks, temporal memory, and adapter translation into image_app ingestion contract without GPU execution.',
    },
    supported_inputs: [...SUPPORTED_INPUTS],
    unsupported_inputs: [...UNSUPPORTED_INPUTS],
    binding_rules: [...BINDING_RULES],
    translation_path: [...TRANSLATION_PATH],
    fallback_behavior: FALLBACK_BEHAVIOR,
    ingestion_contract_defined: true,
  };
}

export function runImageAppMapIngestionValidation(
  projectRoot?: string
): ImageAppMapIngestionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ImageAppMapIngestionReport['issues'] = [];

  const prerequisitePaths = [
    IMAGE_APP_MAP_INGESTION_REGISTRY_PATH,
    CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
    ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
    OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
    TEMPORAL_MEMORY_SPECIFICATION_PATH,
    ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH,
  ];

  for (const rel of prerequisitePaths) {
    if (!fs.existsSync(path.join(root, rel))) {
      issues.push({
        code: 'PREREQUISITE_MISSING',
        message: `Missing prerequisite ${rel}`,
        severity: 'error',
      });
    }
  }

  const adapterReport = readJson<{ recommended_adapter?: string }>(
    root,
    ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH
  );
  if (adapterReport && adapterReport.recommended_adapter !== 'comfyui_adapter') {
    issues.push({
      code: 'ADAPTER_MISMATCH',
      message: 'Expected recommended_adapter=comfyui_adapter in adapter translation validation',
      severity: 'warning',
    });
  }

  const specification = buildImageAppIngestionSpecification();

  const ingestion_contract_defined =
    specification.ingestion_contract_defined === true &&
    Object.keys(specification.ingestion_contract).length > 0;
  const binding_rules_defined = specification.binding_rules.length > 0;
  const translation_path_defined = specification.translation_path.length > 0;
  const fallback_text_path_defined =
    Object.keys(specification.fallback_text_path).length > 0 &&
    specification.fallback_text_path.output_flag === 'NOT_PRODUCTION_REPLICA';
  const runtime_bridge_defined =
    specification.runtime_bridge.bridge_id.length > 0 &&
    specification.runtime_bridge.bridge_only === true &&
    specification.runtime_bridge.consumer_target === 'image_app';

  if (!ingestion_contract_defined) {
    issues.push({
      code: 'INGESTION_CONTRACT',
      message: 'ingestion_contract must be defined',
      severity: 'error',
    });
  }
  if (!binding_rules_defined) {
    issues.push({
      code: 'BINDING_RULES',
      message: 'binding_rules must be defined',
      severity: 'error',
    });
  }
  if (!translation_path_defined) {
    issues.push({
      code: 'TRANSLATION_PATH',
      message: 'translation_path must be defined',
      severity: 'error',
    });
  }
  if (!fallback_text_path_defined) {
    issues.push({
      code: 'FALLBACK_TEXT_PATH',
      message: 'fallback_text_path must be defined with NOT_PRODUCTION_REPLICA flag',
      severity: 'error',
    });
  }
  if (!runtime_bridge_defined) {
    issues.push({
      code: 'RUNTIME_BRIDGE',
      message: 'runtime_bridge must be defined',
      severity: 'error',
    });
  }

  if (specification.fallback_behavior !== FALLBACK_BEHAVIOR) {
    issues.push({
      code: 'FALLBACK_BEHAVIOR',
      message: 'fallback_behavior must match required degradation text',
      severity: 'error',
    });
  }

  const validation_passed =
    ingestion_contract_defined &&
    binding_rules_defined &&
    translation_path_defined &&
    fallback_text_path_defined &&
    runtime_bridge_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: ImageAppMapIngestionReport = {
    report_id: `image_app_map_ingestion_${Date.now().toString(36)}`,
    phase: IMAGE_APP_MAP_INGESTION_PHASE,
    system_id: IMAGE_APP_MAP_INGESTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? IMAGE_APP_MAP_INGESTION_PASS_VERDICT
      : IMAGE_APP_MAP_INGESTION_FAIL_VERDICT,
    status: validation_passed
      ? IMAGE_APP_MAP_INGESTION_STATUS
      : 'IMAGE_APP_MAP_INGESTION_NOT_DEFINED',
    validation_passed,
    image_app_map_ingestion_defined: validation_passed,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    ingestion_contract_defined,
    binding_rules_defined,
    translation_path_defined,
    fallback_text_path_defined,
    runtime_bridge_defined,
    supported_input_count: specification.supported_inputs.length,
    unsupported_input_count: specification.unsupported_inputs.length,
    checks: {
      ingestion_contract_defined,
      binding_rules_defined,
      translation_path_defined,
      fallback_text_path_defined,
      runtime_bridge_defined,
      map_binding_format_defined: Object.keys(specification.map_binding_format).length > 0,
      reference_bank_binding_defined:
        Object.keys(specification.reference_bank_binding).length > 0,
      temporal_binding_defined: Object.keys(specification.temporal_binding).length > 0,
      adapter_binding_defined: Object.keys(specification.adapter_binding).length > 0,
      fallback_behavior_matches: specification.fallback_behavior === FALLBACK_BEHAVIOR,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, IMAGE_APP_INGESTION_SPECIFICATION_PATH, specification);
  writeJson(root, IMAGE_APP_MAP_INGESTION_REPORT_PATH, report);

  return report;
}

export function writeImageAppMapIngestionReport(
  projectRoot?: string
): ImageAppMapIngestionReport {
  return runImageAppMapIngestionValidation(projectRoot);
}
