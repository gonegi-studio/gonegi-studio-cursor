import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { BACKEND_RUNTIME_BRIDGE_REPORT_PATH } from './backendRuntimeBridge.js';
import { TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH } from './temporalPreservationBinding.js';
import { ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH } from './environmentIdentityBinding.js';
import { OBJECT_IDENTITY_BINDING_PACKAGE_PATH } from './objectIdentityBinding.js';
import { GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH } from './gpuConditioningCapabilityAudit.js';

export const VIDEO_CONDITIONING_BACKEND_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-010' as const;
export const VIDEO_CONDITIONING_BACKEND_SYSTEM_ID = 'VIDEO_CONDITIONING_BACKEND_V1' as const;
export const VIDEO_CONDITIONING_BACKEND_PASS_VERDICT = 'PASS_VIDEO_CONDITIONING_BACKEND_V1' as const;
export const VIDEO_CONDITIONING_BACKEND_FAIL_VERDICT = 'FAIL_VIDEO_CONDITIONING_BACKEND_V1' as const;
export const VIDEO_CONDITIONING_BACKEND_STATUS = 'VIDEO_CONDITIONING_BACKEND_DEFINED' as const;

export const VIDEO_CONDITIONING_BACKEND_DATASET_DIR =
  'datasets/movie_reconstruction_video_conditioning_backend' as const;
export const VIDEO_CONDITIONING_BACKEND_REGISTRY_PATH =
  `${VIDEO_CONDITIONING_BACKEND_DATASET_DIR}/video-conditioning-backend-registry.json` as const;

export const VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH =
  'reports/movie_reconstruction/VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT.json' as const;
export const VIDEO_CONDITIONING_ARCHITECTURE_REPORT_PATH =
  'reports/movie_reconstruction/VIDEO_CONDITIONING_ARCHITECTURE_REPORT.json' as const;
export const VIDEO_CONDITIONING_GAP_REPORT_PATH =
  'reports/movie_reconstruction/VIDEO_CONDITIONING_GAP_REPORT.json' as const;

const NEXT_PHASE = 'PHASE-GPU-CONDITIONING-VALIDATION-002_VIDEO_RUNTIME_ENFORCEMENT_V1' as const;

export type RuntimeEnforcementLevel = 'STRICT' | 'MEDIUM' | 'LOOSE';

const EXECUTION_FLAGS = {
  design_only: true as const,
  implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface RuntimeChannelFailureMode {
  channel: string;
  runtime_enforcement_level: RuntimeEnforcementLevel;
  expected_runtime_failure_modes: string[];
}

export interface VideoConditioningBackendRequirementsReport {
  report_id: string;
  phase: typeof VIDEO_CONDITIONING_BACKEND_PHASE;
  system_id: typeof VIDEO_CONDITIONING_BACKEND_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof VIDEO_CONDITIONING_BACKEND_STATUS | 'VIDEO_CONDITIONING_BACKEND_NOT_DEFINED';
  validation_passed: boolean;
  video_backend_design_defined: boolean;
  video_conditioning_contract_defined: boolean;
  environment_runtime_channel_defined: boolean;
  object_runtime_channel_defined: boolean;
  temporal_runtime_channel_defined: boolean;
  camera_continuity_channel_defined: boolean;
  multi_scene_consistency_channel_defined: boolean;
  runtime_enforcement_level_defined: boolean;
  expected_runtime_failure_modes_defined: boolean;
  video_backend_implemented: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  analysis: {
    environment_identity_runtime_requirements: string;
    object_identity_runtime_requirements: string;
    temporal_preservation_runtime_requirements: string;
    camera_continuity_requirements: string;
    multi_scene_consistency_requirements: string;
  };
  video_conditioning_contract: Record<string, string>;
  environment_identity_runtime_channel: Record<string, string>;
  object_identity_runtime_channel: Record<string, string>;
  temporal_preservation_runtime_channel: Record<string, string>;
  camera_continuity_runtime_channel: Record<string, string>;
  multi_scene_consistency_runtime_channel: Record<string, string>;
  runtime_enforcement_level: Record<string, string>;
  required_runtime_channels: string[];
  optional_runtime_channels: string[];
  critical_runtime_channels: string[];
  unsupported_channels: string[];
  channel_failure_modes: RuntimeChannelFailureMode[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface VideoConditioningArchitectureReport {
  report_id: string;
  phase: typeof VIDEO_CONDITIONING_BACKEND_PHASE;
  system_id: typeof VIDEO_CONDITIONING_BACKEND_SYSTEM_ID;
  generated_at: string;
  selected_architecture: string;
  runtime_layers: string[];
  identity_layers: string[];
  temporal_layers: string[];
  continuity_layers: string[];
}

export interface VideoConditioningGapReport {
  report_id: string;
  phase: typeof VIDEO_CONDITIONING_BACKEND_PHASE;
  system_id: typeof VIDEO_CONDITIONING_BACKEND_SYSTEM_ID;
  generated_at: string;
  defined: string[];
  missing: string[];
  remaining_blockers: string[];
  next_phase: typeof NEXT_PHASE;
}

const ANALYSIS = {
  environment_identity_runtime_requirements:
    'environment_identity preservation_score=0.12 CRITICAL; runtime channel must bind ENVIRONMENT_REFERENCE_BANK + IP-Adapter reference weights with STRICT enforcement on layout_signature and anchor_descriptors.',
  object_identity_runtime_requirements:
    'object_identity preservation_score=0.55 HIGH; runtime channel must bind OBJECT_REFERENCE_BANK with variation_tolerance bands and identity_level lock_strength; hero_prop roles require STRICT enforcement.',
  temporal_preservation_runtime_requirements:
    'temporal_preservation preservation_score=0.28 CRITICAL; runtime channel must bind edit_rhythm, shot_boundary_continuity, and causal_transition_chain from temporal-preservation-binding-package without image-only frame isolation.',
  camera_continuity_requirements:
    'camera_continuity requires motion_vectors smoothing and camera_inertia preservation across shot boundaries; MEDIUM enforcement with cross-shot anchor validation.',
  multi_scene_consistency_requirements:
    'multi_scene_consistency requires SpatialConsistencyMemory binding across scene_id transitions; STRICT enforcement on environment_anchors and object_anchors with scene_remap gonegi_scene_id lineage.',
} as const;

const VIDEO_CONDITIONING_CONTRACT = {
  contract_id: 'video_conditioning_backend_contract_v1',
  contract_version: '1.0',
  backend_target: 'future_video_backend',
  adapter: 'future_video_adapter',
  design_only: 'true — contract defines runtime channels; no GPU socket opened.',
  input_bindings:
    'temporal-preservation-binding-package, environment-identity-binding-package, object-identity-binding-package, conditioning-map-export-bundle.',
  output_scope: 'Multi-frame conditioned video generation with identity and temporal runtime enforcement metadata.',
  degradation_path: 'future_video_adapter → comfyui_adapter → fallback_text_path → NOT_PRODUCTION_REPLICA',
} as const;

const ENVIRONMENT_IDENTITY_RUNTIME_CHANNEL = {
  channel_id: 'environment_identity_runtime_v1',
  channel: 'environment_identity',
  binding_ref: ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
  enforcement_default: 'STRICT',
  inputs: 'environment_reference_bank_binding, environment_anchor_binding, environment_similarity_binding.',
  runtime_requirement: 'IP-Adapter environment reference weight binding with same_environment_threshold=0.98 gate.',
} as const;

const OBJECT_IDENTITY_RUNTIME_CHANNEL = {
  channel_id: 'object_identity_runtime_v1',
  channel: 'object_identity',
  binding_ref: OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
  enforcement_default: 'STRICT for hero_prop; MEDIUM for scene_prop; LOOSE for background_furniture',
  inputs: 'object_reference_bank_binding, object_variation_tolerance_binding, object_role_binding.',
  runtime_requirement: 'IP-Adapter object identity weight from lock_strength = 1.0 - variation_tolerance.',
} as const;

const TEMPORAL_PRESERVATION_RUNTIME_CHANNEL = {
  channel_id: 'temporal_preservation_runtime_v1',
  channel: 'temporal_preservation',
  binding_ref: TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
  enforcement_default: 'STRICT',
  inputs: 'edit_rhythm_binding, shot_boundary_continuity_binding, causal_transition_chain_binding.',
  runtime_requirement: 'Edit rhythm and shot boundary continuity enforced across frame sequence generation.',
} as const;

const CAMERA_CONTINUITY_RUNTIME_CHANNEL = {
  channel_id: 'camera_continuity_runtime_v1',
  channel: 'camera_continuity',
  binding_ref: 'exports/source_video_numerical_dna_full motion_vectors + temporal traceability bindings',
  enforcement_default: 'MEDIUM',
  inputs: 'motion_vectors frame_pairs, camera_inertia anchors, continuity_signature.',
  runtime_requirement: 'Cross-shot camera inertia and eyeline vector smoothing across generated frames.',
} as const;

const MULTI_SCENE_CONSISTENCY_RUNTIME_CHANNEL = {
  channel_id: 'multi_scene_consistency_runtime_v1',
  channel: 'multi_scene_consistency',
  binding_ref: 'environment-identity-binding-package + object-identity-binding-package memory bindings',
  enforcement_default: 'STRICT',
  inputs: 'environment_memory_binding, object_memory_binding, scene_remap gonegi_scene_id.',
  runtime_requirement: 'Cross-scene anchor persistence with location_anchor_reuse and object_anchor_reuse flags.',
} as const;

const RUNTIME_ENFORCEMENT_LEVEL = {
  STRICT: 'Maximum runtime lock; failure triggers channel abort or fallback degradation.',
  MEDIUM: 'Balanced enforcement; allows bounded drift with logged warnings.',
  LOOSE: 'Soft enforcement; preserves class/category over instance detail.',
  assessment_note:
    'Runtime Enforcement Defined != Runtime Enforcement Proven — levels are design targets pending GPU validation.',
} as const;

const REQUIRED_RUNTIME_CHANNELS = [
  'temporal_preservation',
  'environment_identity',
  'object_identity',
  'camera_continuity',
  'multi_scene_consistency',
] as const;

const OPTIONAL_RUNTIME_CHANNELS = ['layout_map', 'depth_map', 'pose_map', 'blocking_map'] as const;

const CRITICAL_RUNTIME_CHANNELS = [
  'temporal_preservation',
  'environment_identity',
] as const;

const UNSUPPORTED_CHANNELS = [
  'ocr_extraction',
  'external_api_inference',
  'live_gpu_execution_in_design_phase',
] as const;

const CHANNEL_FAILURE_MODES: RuntimeChannelFailureMode[] = [
  {
    channel: 'environment_identity',
    runtime_enforcement_level: 'STRICT',
    expected_runtime_failure_modes: [
      'reference_drift',
      'geometry_mismatch',
      'style_overrides_identity',
    ],
  },
  {
    channel: 'object_identity',
    runtime_enforcement_level: 'STRICT',
    expected_runtime_failure_modes: [
      'identity_embedding_drift',
      'variation_tolerance_exceeded',
      'role_weight_ignored',
    ],
  },
  {
    channel: 'temporal_preservation',
    runtime_enforcement_level: 'STRICT',
    expected_runtime_failure_modes: [
      'edit_rhythm_desync',
      'shot_boundary_discontinuity',
      'causal_transition_break',
    ],
  },
  {
    channel: 'camera_continuity',
    runtime_enforcement_level: 'MEDIUM',
    expected_runtime_failure_modes: [
      'camera_inertia_break',
      'eyeline_vector_jump',
      'motion_vector_smoothing_failure',
    ],
  },
  {
    channel: 'multi_scene_consistency',
    runtime_enforcement_level: 'STRICT',
    expected_runtime_failure_modes: [
      'anchor_position_drift',
      'scene_remap_lineage_break',
      'cross_scene_memory_loss',
    ],
  },
];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildArchitectureReport(): VideoConditioningArchitectureReport {
  return {
    report_id: `video_conditioning_architecture_${Date.now().toString(36)}`,
    phase: VIDEO_CONDITIONING_BACKEND_PHASE,
    system_id: VIDEO_CONDITIONING_BACKEND_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    selected_architecture: 'Hybrid Video Conditioning Stack',
    runtime_layers: [
      'conditioning-map-export ingestion layer',
      'future_video_adapter translation layer',
      'runtime_enforcement gate layer',
      'channel degradation router',
    ],
    identity_layers: [
      'environment_identity_runtime_channel (IP-Adapter environment reference)',
      'object_identity_runtime_channel (IP-Adapter object reference + variation_tolerance)',
      'environment_similarity_v1 + object_similarity_v1 threshold gates',
    ],
    temporal_layers: [
      'temporal_preservation_runtime_channel (edit_rhythm + shot_boundary)',
      'causal_transition_chain runtime traversal',
      'temporal_traceability binding lineage',
    ],
    continuity_layers: [
      'camera_continuity_runtime_channel (motion_vectors + camera_inertia)',
      'multi_scene_consistency_runtime_channel (SpatialConsistencyMemory anchors)',
      'cross-shot continuity_signature validation',
    ],
  };
}

function buildGapReport(): VideoConditioningGapReport {
  return {
    report_id: `video_conditioning_gap_${Date.now().toString(36)}`,
    phase: VIDEO_CONDITIONING_BACKEND_PHASE,
    system_id: VIDEO_CONDITIONING_BACKEND_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    defined: [
      'video_conditioning_contract',
      'environment_identity_runtime_channel',
      'object_identity_runtime_channel',
      'temporal_preservation_runtime_channel',
      'camera_continuity_runtime_channel',
      'multi_scene_consistency_runtime_channel',
      'runtime_enforcement_level',
      'expected_runtime_failure_modes',
    ],
    missing: [
      'future_video_backend implementation',
      'GPU runtime socket connection',
      'IP-Adapter video node execution',
      'runtime enforcement proof via GPU validation',
      'video_backend_implemented certification',
    ],
    remaining_blockers: [
      'gpu_execution disabled in this phase',
      'design_only=true — no backend code generated',
      'Video Backend Defined != Video Backend Implemented',
      'Runtime Enforcement Defined != Runtime Enforcement Proven',
      'Failure Modes Defined != GPU Validation Passed',
    ],
    next_phase: NEXT_PHASE,
  };
}

export function runVideoConditioningBackendValidation(
  projectRoot?: string
): VideoConditioningBackendRequirementsReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: VideoConditioningBackendRequirementsReport['issues'] = [];

  const prerequisitePaths = [
    VIDEO_CONDITIONING_BACKEND_REGISTRY_PATH,
    BACKEND_RUNTIME_BRIDGE_REPORT_PATH,
    TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
    ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
    OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
    GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH,
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

  const video_conditioning_contract_defined =
    Object.keys(VIDEO_CONDITIONING_CONTRACT).length > 0;
  const environment_runtime_channel_defined =
    Object.keys(ENVIRONMENT_IDENTITY_RUNTIME_CHANNEL).length > 0;
  const object_runtime_channel_defined =
    Object.keys(OBJECT_IDENTITY_RUNTIME_CHANNEL).length > 0;
  const temporal_runtime_channel_defined =
    Object.keys(TEMPORAL_PRESERVATION_RUNTIME_CHANNEL).length > 0;
  const camera_continuity_channel_defined =
    Object.keys(CAMERA_CONTINUITY_RUNTIME_CHANNEL).length > 0;
  const multi_scene_consistency_channel_defined =
    Object.keys(MULTI_SCENE_CONSISTENCY_RUNTIME_CHANNEL).length > 0;
  const runtime_enforcement_level_defined =
    Object.keys(RUNTIME_ENFORCEMENT_LEVEL).length > 0;
  const expected_runtime_failure_modes_defined =
    CHANNEL_FAILURE_MODES.length > 0 &&
    CHANNEL_FAILURE_MODES.every(
      (entry) =>
        entry.expected_runtime_failure_modes.length > 0 &&
        entry.runtime_enforcement_level.length > 0
    );

  const environmentExample = CHANNEL_FAILURE_MODES.find(
    (entry) => entry.channel === 'environment_identity'
  );
  if (!environmentExample) {
    issues.push({
      code: 'ENVIRONMENT_FAILURE_MODES',
      message: 'environment_identity channel failure modes example required',
      severity: 'error',
    });
  } else if (
    !environmentExample.expected_runtime_failure_modes.includes('reference_drift') ||
    !environmentExample.expected_runtime_failure_modes.includes('geometry_mismatch') ||
    !environmentExample.expected_runtime_failure_modes.includes('style_overrides_identity')
  ) {
    issues.push({
      code: 'ENVIRONMENT_FAILURE_MODES_EXAMPLE',
      message: 'environment_identity must include reference_drift, geometry_mismatch, style_overrides_identity',
      severity: 'error',
    });
  }

  if (!video_conditioning_contract_defined) {
    issues.push({ code: 'CONTRACT', message: 'video_conditioning_contract must be defined', severity: 'error' });
  }
  if (!environment_runtime_channel_defined) {
    issues.push({ code: 'ENVIRONMENT_CHANNEL', message: 'environment_runtime_channel must be defined', severity: 'error' });
  }
  if (!object_runtime_channel_defined) {
    issues.push({ code: 'OBJECT_CHANNEL', message: 'object_runtime_channel must be defined', severity: 'error' });
  }
  if (!temporal_runtime_channel_defined) {
    issues.push({ code: 'TEMPORAL_CHANNEL', message: 'temporal_runtime_channel must be defined', severity: 'error' });
  }
  if (!camera_continuity_channel_defined) {
    issues.push({ code: 'CAMERA_CHANNEL', message: 'camera_continuity_channel must be defined', severity: 'error' });
  }
  if (!multi_scene_consistency_channel_defined) {
    issues.push({
      code: 'MULTI_SCENE_CHANNEL',
      message: 'multi_scene_consistency_channel must be defined',
      severity: 'error',
    });
  }
  if (!runtime_enforcement_level_defined) {
    issues.push({
      code: 'ENFORCEMENT_LEVEL',
      message: 'runtime_enforcement_level must be defined',
      severity: 'error',
    });
  }
  if (!expected_runtime_failure_modes_defined) {
    issues.push({
      code: 'FAILURE_MODES',
      message: 'expected_runtime_failure_modes must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    video_conditioning_contract_defined &&
    environment_runtime_channel_defined &&
    object_runtime_channel_defined &&
    temporal_runtime_channel_defined &&
    camera_continuity_channel_defined &&
    multi_scene_consistency_channel_defined &&
    runtime_enforcement_level_defined &&
    expected_runtime_failure_modes_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: VideoConditioningBackendRequirementsReport = {
    report_id: `video_conditioning_backend_requirements_${Date.now().toString(36)}`,
    phase: VIDEO_CONDITIONING_BACKEND_PHASE,
    system_id: VIDEO_CONDITIONING_BACKEND_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? VIDEO_CONDITIONING_BACKEND_PASS_VERDICT
      : VIDEO_CONDITIONING_BACKEND_FAIL_VERDICT,
    status: validation_passed
      ? VIDEO_CONDITIONING_BACKEND_STATUS
      : 'VIDEO_CONDITIONING_BACKEND_NOT_DEFINED',
    validation_passed,
    video_backend_design_defined: validation_passed,
    video_conditioning_contract_defined,
    environment_runtime_channel_defined,
    object_runtime_channel_defined,
    temporal_runtime_channel_defined,
    camera_continuity_channel_defined,
    multi_scene_consistency_channel_defined,
    runtime_enforcement_level_defined,
    expected_runtime_failure_modes_defined,
    video_backend_implemented: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    analysis: { ...ANALYSIS },
    video_conditioning_contract: { ...VIDEO_CONDITIONING_CONTRACT },
    environment_identity_runtime_channel: { ...ENVIRONMENT_IDENTITY_RUNTIME_CHANNEL },
    object_identity_runtime_channel: { ...OBJECT_IDENTITY_RUNTIME_CHANNEL },
    temporal_preservation_runtime_channel: { ...TEMPORAL_PRESERVATION_RUNTIME_CHANNEL },
    camera_continuity_runtime_channel: { ...CAMERA_CONTINUITY_RUNTIME_CHANNEL },
    multi_scene_consistency_runtime_channel: { ...MULTI_SCENE_CONSISTENCY_RUNTIME_CHANNEL },
    runtime_enforcement_level: { ...RUNTIME_ENFORCEMENT_LEVEL },
    required_runtime_channels: [...REQUIRED_RUNTIME_CHANNELS],
    optional_runtime_channels: [...OPTIONAL_RUNTIME_CHANNELS],
    critical_runtime_channels: [...CRITICAL_RUNTIME_CHANNELS],
    unsupported_channels: [...UNSUPPORTED_CHANNELS],
    channel_failure_modes: CHANNEL_FAILURE_MODES,
    checks: {
      video_conditioning_contract_defined,
      environment_runtime_channel_defined,
      object_runtime_channel_defined,
      temporal_runtime_channel_defined,
      camera_continuity_channel_defined,
      multi_scene_consistency_channel_defined,
      runtime_enforcement_level_defined,
      expected_runtime_failure_modes_defined,
      environment_failure_mode_example_present: Boolean(environmentExample),
      video_backend_implemented_false: true,
      conditioning_ready_false: true,
      movie_reconstruction_ready_false: true,
      gpu_ready_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH, report);
  writeJson(root, VIDEO_CONDITIONING_ARCHITECTURE_REPORT_PATH, buildArchitectureReport());
  writeJson(root, VIDEO_CONDITIONING_GAP_REPORT_PATH, buildGapReport());

  return report;
}

export function writeVideoConditioningBackendReport(
  projectRoot?: string
): VideoConditioningBackendRequirementsReport {
  return runVideoConditioningBackendValidation(projectRoot);
}
