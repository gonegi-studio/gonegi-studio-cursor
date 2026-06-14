import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH } from './videoConditioningBackend.js';
import { TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH } from './temporalPreservationBinding.js';
import { ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH } from './environmentIdentityBinding.js';
import { OBJECT_IDENTITY_BINDING_PACKAGE_PATH } from './objectIdentityBinding.js';

export const VIDEO_RUNTIME_ENFORCEMENT_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-002' as const;
export const VIDEO_RUNTIME_ENFORCEMENT_SYSTEM_ID = 'VIDEO_RUNTIME_ENFORCEMENT_V1' as const;
export const VIDEO_RUNTIME_ENFORCEMENT_PASS_VERDICT = 'PASS_VIDEO_RUNTIME_ENFORCEMENT_V1' as const;
export const VIDEO_RUNTIME_ENFORCEMENT_FAIL_VERDICT = 'FAIL_VIDEO_RUNTIME_ENFORCEMENT_V1' as const;
export const VIDEO_RUNTIME_ENFORCEMENT_STATUS = 'VIDEO_RUNTIME_ENFORCEMENT_DEFINED' as const;

export const VIDEO_RUNTIME_ENFORCEMENT_DATASET_DIR =
  'datasets/gpu_conditioning_video_runtime_enforcement' as const;
export const VIDEO_RUNTIME_ENFORCEMENT_REGISTRY_PATH =
  `${VIDEO_RUNTIME_ENFORCEMENT_DATASET_DIR}/video-runtime-enforcement-registry.json` as const;

export const VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH =
  'reports/movie_reconstruction/VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL.json' as const;
export const RUNTIME_ENFORCEMENT_READINESS_REPORT_PATH =
  'reports/movie_reconstruction/RUNTIME_ENFORCEMENT_READINESS_REPORT.json' as const;
export const GPU_VALIDATION_ENTRY_CRITERIA_PATH =
  'reports/movie_reconstruction/GPU_VALIDATION_ENTRY_CRITERIA.json' as const;

export type EnforcementLevel = 'STRICT' | 'MEDIUM' | 'LOOSE';

const EXECUTION_FLAGS = {
  protocol_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface RuntimeEnforcementChannelProtocol {
  runtime_channel: string;
  enforcement_level: EnforcementLevel;
  success_conditions: string[];
  failure_conditions: string[];
  measurement_method: string[];
  expected_degradation_path: string[];
  minimum_validation_batch_size: number;
}

export interface VideoRuntimeEnforcementProtocol {
  protocol_id: string;
  phase: typeof VIDEO_RUNTIME_ENFORCEMENT_PHASE;
  system_id: typeof VIDEO_RUNTIME_ENFORCEMENT_SYSTEM_ID;
  generated_at: string;
  enforcement_protocol_defined: true;
  analysis: {
    environment_identity_enforcement: string;
    object_identity_enforcement: string;
    temporal_preservation_enforcement: string;
    camera_continuity_enforcement: string;
    multi_scene_consistency_enforcement: string;
  };
  enforcement_validation_contract: Record<string, string>;
  enforcement_success_conditions: Record<string, string>;
  enforcement_failure_conditions: Record<string, string>;
  runtime_degradation_rules: Record<string, string>;
  channels: RuntimeEnforcementChannelProtocol[];
}

export interface RuntimeEnforcementReadinessReport {
  report_id: string;
  phase: typeof VIDEO_RUNTIME_ENFORCEMENT_PHASE;
  system_id: typeof VIDEO_RUNTIME_ENFORCEMENT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof VIDEO_RUNTIME_ENFORCEMENT_STATUS | 'VIDEO_RUNTIME_ENFORCEMENT_NOT_DEFINED';
  validation_passed: boolean;
  runtime_enforcement_protocol_defined: boolean;
  enforcement_protocol_defined: boolean;
  success_conditions_defined: boolean;
  failure_conditions_defined: boolean;
  measurement_methods_defined: boolean;
  degradation_rules_defined: boolean;
  minimum_validation_batch_sizes_defined: boolean;
  gpu_entry_criteria_defined: boolean;
  runtime_enforced: false;
  gpu_validated: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  validated_channels: string[];
  non_validated_channels: string[];
  critical_validation_targets: string[];
  highest_risk_channel: string;
  channel_batch_requirements: Array<{
    runtime_channel: string;
    minimum_validation_batch_size: number;
  }>;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface GpuValidationEntryCriteria {
  report_id: string;
  phase: typeof VIDEO_RUNTIME_ENFORCEMENT_PHASE;
  system_id: typeof VIDEO_RUNTIME_ENFORCEMENT_SYSTEM_ID;
  generated_at: string;
  required_conditions: string[];
  blocked_conditions: string[];
  ready_for_gpu_validation: false;
  gpu_entry_criteria_defined: true;
  assessment_note: string;
}

const ANALYSIS = {
  environment_identity_enforcement:
    'STRICT enforcement on reference_bank_match and same_environment_threshold=0.98; failure triggers similar_environment then fallback_environment degradation.',
  object_identity_enforcement:
    'STRICT for hero_prop, MEDIUM for scene_prop; success requires identity_signature match within variation_tolerance band; failure triggers similar_object degradation.',
  temporal_preservation_enforcement:
    'STRICT enforcement on edit_rhythm_signature and continuity_signature; failure triggers fallback_text_path with NOT_PRODUCTION_REPLICA.',
  camera_continuity_enforcement:
    'MEDIUM enforcement on motion_vector smoothing and camera_inertia anchors; bounded drift permitted with logged warnings.',
  multi_scene_consistency_enforcement:
    'STRICT enforcement on environment_anchors and object_anchors cross-scene persistence; failure triggers scene_remap lineage audit before degradation.',
} as const;

const ENFORCEMENT_VALIDATION_CONTRACT = {
  contract_id: 'video_runtime_enforcement_validation_v1',
  contract_version: '1.0',
  scope: 'Protocol definition only — no GPU execution or image generation in this phase.',
  backend_ref: VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH,
  validation_unit: 'Per runtime_channel batch validation with minimum_validation_batch_size samples.',
  pass_threshold: 'All success_conditions met for batch; any failure_condition triggers degradation path audit.',
  certification_scope:
    'Enforcement Defined != Enforcement Proven; Measurement Defined != Validation Passed.',
} as const;

const ENFORCEMENT_SUCCESS_CONDITIONS = {
  reference_bank_match: 'Environment or object reference bank entry resolves by primary key with score >= same_environment/same_object threshold.',
  identity_signature_match: 'identity_signature hash matches bound reference bank entry within variation_tolerance band.',
  edit_rhythm_alignment: 'Generated shot duration within edit_rhythm_binding shot_duration_ms tolerance band.',
  continuity_signature_stable: 'Shot boundary continuity_signature stable across adjacent generated frames.',
  camera_inertia_preserved: 'Motion vector magnitude delta below camera_continuity MEDIUM drift bound.',
  cross_scene_anchor_stable: 'environment_anchors and object_anchors persistence_score >= 0.85 across scene boundary.',
} as const;

const ENFORCEMENT_FAILURE_CONDITIONS = {
  reference_drift: 'Reference bank match score drops below similarity_threshold.',
  geometry_mismatch: 'Anchor normalized_position delta exceeds STRICT bound.',
  style_overrides_identity: 'Style conditioning weight dominates identity reference weight.',
  identity_embedding_drift: 'identity_embedding_ref similarity below same_object_threshold.',
  edit_rhythm_desync: 'Shot duration deviates beyond edit_rhythm tolerance.',
  shot_boundary_discontinuity: 'continuity_signature break at shot boundary.',
  camera_inertia_break: 'Camera motion vector jump exceeds MEDIUM bound.',
  cross_scene_memory_loss: 'Anchor persistence_score drops below multi_scene threshold.',
} as const;

const RUNTIME_DEGRADATION_RULES = {
  strict_channel_abort:
    'STRICT channel failure aborts channel and executes expected_degradation_path before continuing batch.',
  medium_channel_warn:
    'MEDIUM channel failure logs warning and continues if drift within secondary bound.',
  degradation_order:
    'primary channel degradation → adapter fallback → ConditionedPromptBuilder → NOT_PRODUCTION_REPLICA.',
  similar_not_same:
    'similar_environment and similar_object paths must never be treated as identity lock without threshold gate.',
  single_image_not_movie:
    'Single Image Success != Movie Reconstruction Success — batch validation required per minimum_validation_batch_size.',
} as const;

const CHANNEL_PROTOCOLS: RuntimeEnforcementChannelProtocol[] = [
  {
    runtime_channel: 'environment_identity',
    enforcement_level: 'STRICT',
    success_conditions: ['reference_bank_match'],
    failure_conditions: ['reference_drift', 'geometry_mismatch', 'style_overrides_identity'],
    measurement_method: ['reference_bank_match_score', 'environment_traceability_score'],
    expected_degradation_path: ['similar_environment', 'fallback_environment'],
    minimum_validation_batch_size: 50,
  },
  {
    runtime_channel: 'object_identity',
    enforcement_level: 'STRICT',
    success_conditions: ['reference_bank_match', 'identity_signature_match'],
    failure_conditions: ['identity_embedding_drift', 'geometry_mismatch', 'style_overrides_identity'],
    measurement_method: ['identity_signature_match_score', 'variation_tolerance_band_score'],
    expected_degradation_path: ['similar_object', 'fallback_object', 'loose_class_match'],
    minimum_validation_batch_size: 40,
  },
  {
    runtime_channel: 'temporal_preservation',
    enforcement_level: 'STRICT',
    success_conditions: ['edit_rhythm_alignment', 'continuity_signature_stable'],
    failure_conditions: ['edit_rhythm_desync', 'shot_boundary_discontinuity'],
    measurement_method: ['edit_rhythm_alignment_score', 'continuity_signature_score'],
    expected_degradation_path: ['comfyui_adapter', 'fallback_text_path'],
    minimum_validation_batch_size: 30,
  },
  {
    runtime_channel: 'camera_continuity',
    enforcement_level: 'MEDIUM',
    success_conditions: ['camera_inertia_preserved'],
    failure_conditions: ['camera_inertia_break'],
    measurement_method: ['motion_vector_delta_score', 'eyeline_vector_stability_score'],
    expected_degradation_path: ['reduced_motion_smoothing', 'fallback_text_path'],
    minimum_validation_batch_size: 25,
  },
  {
    runtime_channel: 'multi_scene_consistency',
    enforcement_level: 'STRICT',
    success_conditions: ['cross_scene_anchor_stable'],
    failure_conditions: ['cross_scene_memory_loss', 'geometry_mismatch'],
    measurement_method: ['anchor_persistence_score', 'scene_remap_lineage_score'],
    expected_degradation_path: ['partial_scene_memory', 'fallback_environment'],
    minimum_validation_batch_size: 35,
  },
];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildProtocol(): VideoRuntimeEnforcementProtocol {
  return {
    protocol_id: 'video-runtime-enforcement-protocol-v1',
    phase: VIDEO_RUNTIME_ENFORCEMENT_PHASE,
    system_id: VIDEO_RUNTIME_ENFORCEMENT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    enforcement_protocol_defined: true,
    analysis: { ...ANALYSIS },
    enforcement_validation_contract: { ...ENFORCEMENT_VALIDATION_CONTRACT },
    enforcement_success_conditions: { ...ENFORCEMENT_SUCCESS_CONDITIONS },
    enforcement_failure_conditions: { ...ENFORCEMENT_FAILURE_CONDITIONS },
    runtime_degradation_rules: { ...RUNTIME_DEGRADATION_RULES },
    channels: CHANNEL_PROTOCOLS.map((channel) => ({ ...channel })),
  };
}

function buildGpuEntryCriteria(): GpuValidationEntryCriteria {
  return {
    report_id: `gpu_validation_entry_criteria_${Date.now().toString(36)}`,
    phase: VIDEO_RUNTIME_ENFORCEMENT_PHASE,
    system_id: VIDEO_RUNTIME_ENFORCEMENT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    required_conditions: [
      'VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL.json defined',
      'All binding packages exported (temporal, environment, object)',
      'VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT.json PASS',
      'minimum_validation_batch_size defined per critical channel',
      'expected_degradation_path defined per runtime channel',
      'GPU execution environment available (future phase)',
    ],
    blocked_conditions: [
      'gpu_execution in protocol definition phase',
      'video_backend_implemented=false',
      'environment_identity_map reserved_v1',
      'identity_embedding_ref not generated',
      'Validation Protocol != GPU Validation Passed',
    ],
    ready_for_gpu_validation: false,
    gpu_entry_criteria_defined: true,
    assessment_note:
      'Protocol and entry criteria defined; GPU validation blocked until implementation phase explicitly enables gpu_execution.',
  };
}

export function runVideoRuntimeEnforcementValidation(
  projectRoot?: string
): RuntimeEnforcementReadinessReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RuntimeEnforcementReadinessReport['issues'] = [];

  const prerequisitePaths = [
    VIDEO_RUNTIME_ENFORCEMENT_REGISTRY_PATH,
    VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH,
    TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
    ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
    OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
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

  const protocol = buildProtocol();

  const enforcement_protocol_defined = protocol.enforcement_protocol_defined === true;
  const success_conditions_defined =
    Object.keys(protocol.enforcement_success_conditions).length > 0 &&
    protocol.channels.every((channel) => channel.success_conditions.length > 0);
  const failure_conditions_defined =
    Object.keys(protocol.enforcement_failure_conditions).length > 0 &&
    protocol.channels.every((channel) => channel.failure_conditions.length > 0);
  const measurement_methods_defined = protocol.channels.every(
    (channel) => channel.measurement_method.length > 0
  );
  const degradation_rules_defined =
    Object.keys(protocol.runtime_degradation_rules).length > 0 &&
    protocol.channels.every((channel) => channel.expected_degradation_path.length > 0);
  const minimum_validation_batch_sizes_defined = protocol.channels.every(
    (channel) => typeof channel.minimum_validation_batch_size === 'number' && channel.minimum_validation_batch_size > 0
  );
  const gpuEntryCriteria = buildGpuEntryCriteria();
  const gpu_entry_criteria_defined =
    gpuEntryCriteria.gpu_entry_criteria_defined === true &&
    gpuEntryCriteria.required_conditions.length > 0 &&
    gpuEntryCriteria.blocked_conditions.length > 0;

  const environmentChannel = protocol.channels.find(
    (channel) => channel.runtime_channel === 'environment_identity'
  );

  if (!environmentChannel) {
    issues.push({
      code: 'ENVIRONMENT_CHANNEL',
      message: 'environment_identity channel protocol required',
      severity: 'error',
    });
  } else if (
    environmentChannel.enforcement_level !== 'STRICT' ||
    !environmentChannel.success_conditions.includes('reference_bank_match') ||
    !environmentChannel.failure_conditions.includes('reference_drift') ||
    environmentChannel.minimum_validation_batch_size !== 50
  ) {
    issues.push({
      code: 'ENVIRONMENT_PROTOCOL_EXAMPLE',
      message: 'environment_identity protocol must match required example fields',
      severity: 'error',
    });
  }

  if (!enforcement_protocol_defined) {
    issues.push({ code: 'PROTOCOL', message: 'enforcement_protocol must be defined', severity: 'error' });
  }
  if (!success_conditions_defined) {
    issues.push({ code: 'SUCCESS_CONDITIONS', message: 'success_conditions must be defined', severity: 'error' });
  }
  if (!failure_conditions_defined) {
    issues.push({ code: 'FAILURE_CONDITIONS', message: 'failure_conditions must be defined', severity: 'error' });
  }
  if (!measurement_methods_defined) {
    issues.push({ code: 'MEASUREMENT_METHODS', message: 'measurement_methods must be defined', severity: 'error' });
  }
  if (!degradation_rules_defined) {
    issues.push({ code: 'DEGRADATION_RULES', message: 'degradation_rules must be defined', severity: 'error' });
  }
  if (!minimum_validation_batch_sizes_defined) {
    issues.push({
      code: 'BATCH_SIZES',
      message: 'minimum_validation_batch_sizes must be defined',
      severity: 'error',
    });
  }
  if (!gpu_entry_criteria_defined) {
    issues.push({
      code: 'GPU_ENTRY_CRITERIA',
      message: 'gpu_entry_criteria must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    enforcement_protocol_defined &&
    success_conditions_defined &&
    failure_conditions_defined &&
    measurement_methods_defined &&
    degradation_rules_defined &&
    minimum_validation_batch_sizes_defined &&
    gpu_entry_criteria_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const validated_channels = protocol.channels.map((channel) => channel.runtime_channel);
  const non_validated_channels = [
    'layout_map_gpu_raster',
    'depth_map_gpu_raster',
    'pose_map_gpu_raster',
    'live_ip_adapter_execution',
  ];

  const report: RuntimeEnforcementReadinessReport = {
    report_id: `runtime_enforcement_readiness_${Date.now().toString(36)}`,
    phase: VIDEO_RUNTIME_ENFORCEMENT_PHASE,
    system_id: VIDEO_RUNTIME_ENFORCEMENT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? VIDEO_RUNTIME_ENFORCEMENT_PASS_VERDICT
      : VIDEO_RUNTIME_ENFORCEMENT_FAIL_VERDICT,
    status: validation_passed
      ? VIDEO_RUNTIME_ENFORCEMENT_STATUS
      : 'VIDEO_RUNTIME_ENFORCEMENT_NOT_DEFINED',
    validation_passed,
    runtime_enforcement_protocol_defined: validation_passed,
    enforcement_protocol_defined,
    success_conditions_defined,
    failure_conditions_defined,
    measurement_methods_defined,
    degradation_rules_defined,
    minimum_validation_batch_sizes_defined,
    gpu_entry_criteria_defined,
    runtime_enforced: false,
    gpu_validated: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    validated_channels,
    non_validated_channels,
    critical_validation_targets: ['environment_identity', 'temporal_preservation'],
    highest_risk_channel: 'environment_identity',
    channel_batch_requirements: protocol.channels.map((channel) => ({
      runtime_channel: channel.runtime_channel,
      minimum_validation_batch_size: channel.minimum_validation_batch_size,
    })),
    checks: {
      enforcement_protocol_defined,
      success_conditions_defined,
      failure_conditions_defined,
      measurement_methods_defined,
      degradation_rules_defined,
      minimum_validation_batch_sizes_defined,
      gpu_entry_criteria_defined,
      environment_protocol_example_present: Boolean(environmentChannel),
      runtime_enforced_false: true,
      gpu_validated_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH, protocol);
  writeJson(root, RUNTIME_ENFORCEMENT_READINESS_REPORT_PATH, report);
  writeJson(root, GPU_VALIDATION_ENTRY_CRITERIA_PATH, gpuEntryCriteria);

  return report;
}

export function writeVideoRuntimeEnforcementReport(
  projectRoot?: string
): RuntimeEnforcementReadinessReport {
  return runVideoRuntimeEnforcementValidation(projectRoot);
}
