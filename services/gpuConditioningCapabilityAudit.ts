import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { BACKEND_RUNTIME_BRIDGE_REPORT_PATH } from './backendRuntimeBridge.js';
import { CONDITIONING_PRESERVATION_GAP_REPORT_PATH } from './conditioningPreservationGapAnalysis.js';
import { CONDITIONING_ADAPTER_COMPATIBILITY_MATRIX_PATH } from './conditioningBackendAdapterDesign.js';

export const GPU_CONDITIONING_CAPABILITY_AUDIT_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-001' as const;
export const GPU_CONDITIONING_CAPABILITY_AUDIT_SYSTEM_ID =
  'GPU_CONDITIONING_CAPABILITY_AUDIT_V1' as const;
export const GPU_CONDITIONING_CAPABILITY_AUDIT_PASS_VERDICT =
  'PASS_GPU_CONDITIONING_CAPABILITY_AUDIT_V1' as const;
export const GPU_CONDITIONING_CAPABILITY_AUDIT_FAIL_VERDICT =
  'FAIL_GPU_CONDITIONING_CAPABILITY_AUDIT_V1' as const;
export const GPU_CONDITIONING_CAPABILITY_AUDIT_STATUS =
  'GPU_CONDITIONING_CAPABILITIES_AUDITED' as const;

export const GPU_CONDITIONING_CAPABILITY_AUDIT_DATASET_DIR =
  'datasets/gpu_conditioning_capability_audit' as const;
export const GPU_CONDITIONING_CAPABILITY_AUDIT_REGISTRY_PATH =
  `${GPU_CONDITIONING_CAPABILITY_AUDIT_DATASET_DIR}/gpu-conditioning-capability-audit-registry.json` as const;

export const GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH =
  'reports/movie_reconstruction/GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT.json' as const;
export const MOVIE_RECONSTRUCTION_FEASIBILITY_PRECHECK_PATH =
  'reports/movie_reconstruction/MOVIE_RECONSTRUCTION_FEASIBILITY_PRECHECK.json' as const;

const EXECUTION_FLAGS = {
  audit_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface BackendCapabilitySupport {
  layout_support: boolean;
  depth_support: boolean;
  pose_support: boolean;
  blocking_support: boolean;
  environment_identity_support: boolean;
  object_identity_support: boolean;
  temporal_preservation_support: boolean;
  character_identity_fidelity_support: boolean;
  multi_scene_consistency_support: boolean;
  camera_continuity_support: boolean;
}

export interface BackendCapabilityAuditEntry {
  backend: string;
  adapter: string;
  capability_support: BackendCapabilitySupport;
  supported_features: string[];
  unsupported_features: string[];
  capability_score: number;
  critical_missing_features: string[];
  audit_note: string;
}

export interface GpuConditioningCapabilityAuditReport {
  report_id: string;
  phase: typeof GPU_CONDITIONING_CAPABILITY_AUDIT_PHASE;
  system_id: typeof GPU_CONDITIONING_CAPABILITY_AUDIT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof GPU_CONDITIONING_CAPABILITY_AUDIT_STATUS
    | 'GPU_CONDITIONING_CAPABILITIES_NOT_AUDITED';
  validation_passed: boolean;
  gpu_capabilities_understood: boolean;
  backend_capabilities_documented: boolean;
  critical_missing_features_defined: boolean;
  gpu_execution_ready: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  audit_scope: string;
  backends: BackendCapabilityAuditEntry[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface MovieReconstructionFeasibilityPrecheck {
  report_id: string;
  phase: typeof GPU_CONDITIONING_CAPABILITY_AUDIT_PHASE;
  system_id: typeof GPU_CONDITIONING_CAPABILITY_AUDIT_SYSTEM_ID;
  generated_at: string;
  required_features: string[];
  available_features: string[];
  missing_features: string[];
  highest_priority_gap: string;
  movie_reconstruction_score: number;
  storyboard_generation_score: number;
  music_video_score: number;
  short_film_score: number;
  feature_film_score: number;
  feasibility_scores_defined: true;
  highest_priority_gap_defined: true;
  assessment_note: string;
}

const CAPABILITY_KEYS: Array<keyof BackendCapabilitySupport> = [
  'layout_support',
  'depth_support',
  'pose_support',
  'blocking_support',
  'environment_identity_support',
  'object_identity_support',
  'temporal_preservation_support',
  'character_identity_fidelity_support',
  'multi_scene_consistency_support',
  'camera_continuity_support',
];

const FEATURE_LABELS: Record<keyof BackendCapabilitySupport, string> = {
  layout_support: 'layout_map',
  depth_support: 'depth_map',
  pose_support: 'pose_map',
  blocking_support: 'blocking_map',
  environment_identity_support: 'environment_identity',
  object_identity_support: 'object_identity',
  temporal_preservation_support: 'temporal_preservation',
  character_identity_fidelity_support: 'character_identity_fidelity',
  multi_scene_consistency_support: 'multi_scene_consistency',
  camera_continuity_support: 'camera_continuity',
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function capabilityScore(support: BackendCapabilitySupport): number {
  const trueCount = CAPABILITY_KEYS.filter((key) => support[key]).length;
  return Number((trueCount / CAPABILITY_KEYS.length).toFixed(2));
}

function partitionFeatures(support: BackendCapabilitySupport): {
  supported_features: string[];
  unsupported_features: string[];
} {
  const supported_features: string[] = [];
  const unsupported_features: string[] = [];
  for (const key of CAPABILITY_KEYS) {
    const label = FEATURE_LABELS[key];
    if (support[key]) {
      supported_features.push(label);
    } else {
      unsupported_features.push(label);
    }
  }
  return { supported_features, unsupported_features };
}

const BACKEND_DEFINITIONS: Array<{
  backend: string;
  adapter: string;
  capability_support: BackendCapabilitySupport;
  critical_missing_features: string[];
  audit_note: string;
}> = [
  {
    backend: 'controlnet_backend',
    adapter: 'controlnet_adapter',
    capability_support: {
      layout_support: true,
      depth_support: true,
      pose_support: true,
      blocking_support: true,
      environment_identity_support: false,
      object_identity_support: false,
      temporal_preservation_support: false,
      character_identity_fidelity_support: false,
      multi_scene_consistency_support: false,
      camera_continuity_support: false,
    },
    critical_missing_features: [
      'environment_identity IP-Adapter path',
      'object_identity identity_embedding_ref',
      'temporal_preservation video backend',
      'character_identity_fidelity reference bank wiring',
      'multi_scene_consistency memory store binding',
      'camera_continuity cross-shot inertia preservation',
    ],
    audit_note:
      'ControlNet-class backend supports spatial maps only; identity and temporal domains require ComfyUI IP-Adapter or video backend paths not available on this target.',
  },
  {
    backend: 'comfyui_backend',
    adapter: 'comfyui_adapter',
    capability_support: {
      layout_support: true,
      depth_support: true,
      pose_support: true,
      blocking_support: true,
      environment_identity_support: true,
      object_identity_support: true,
      temporal_preservation_support: false,
      character_identity_fidelity_support: true,
      multi_scene_consistency_support: false,
      camera_continuity_support: false,
    },
    critical_missing_features: [
      'environment_identity_map populated payload export',
      'object_identity identity_embedding_ref generation',
      'IP-Adapter node live wiring (pipeline gap)',
      'temporal_preservation video conditioning backend',
      'multi_scene_consistency SpatialConsistencyMemory GPU binding',
      'camera_continuity cross-shot motion vector smoothing',
    ],
    audit_note:
      'ComfyUI backend natively supports IP-Adapter for environment and object identity when reference banks are wired; image-only scope blocks temporal, multi-scene, and camera continuity at film scale.',
  },
  {
    backend: 'future_video_backend',
    adapter: 'future_video_adapter',
    capability_support: {
      layout_support: true,
      depth_support: true,
      pose_support: true,
      blocking_support: true,
      environment_identity_support: true,
      object_identity_support: true,
      temporal_preservation_support: true,
      character_identity_fidelity_support: true,
      multi_scene_consistency_support: true,
      camera_continuity_support: true,
    },
    critical_missing_features: [
      'future_video_backend not implemented',
      'video conditioning GPU pipeline deferred',
      'edit_rhythm_binding runtime execution',
      'shot_boundary_continuity GPU validation',
      'no operational backend socket',
    ],
    audit_note:
      'Future video backend is design-complete for full movie reconstruction domains but not implemented; capability flags reflect architectural target, not operational readiness.',
  },
];

function buildBackendEntries(): BackendCapabilityAuditEntry[] {
  return BACKEND_DEFINITIONS.map((def) => {
    const { supported_features, unsupported_features } = partitionFeatures(def.capability_support);
    return {
      backend: def.backend,
      adapter: def.adapter,
      capability_support: { ...def.capability_support },
      supported_features,
      unsupported_features,
      capability_score: capabilityScore(def.capability_support),
      critical_missing_features: [...def.critical_missing_features],
      audit_note: def.audit_note,
    };
  });
}

const REQUIRED_FEATURES = [
  'layout_map',
  'depth_map',
  'pose_map',
  'blocking_map',
  'environment_identity',
  'object_identity',
  'temporal_preservation',
  'character_identity_fidelity',
  'multi_scene_consistency',
  'camera_continuity',
  'edit_rhythm_binding',
  'shot_boundary_continuity',
] as const;

const AVAILABLE_FEATURES = [
  'layout_map',
  'depth_map',
  'pose_map',
  'blocking_map',
  'text_spatial_compiler_fallback',
  'environment_reference_bank_metadata',
  'object_reference_bank_metadata',
  'temporal_memory_metadata',
] as const;

const MISSING_FEATURES = [
  'environment_identity_map populated payload',
  'object_identity identity_embedding_ref',
  'temporal_preservation GPU video backend',
  'multi_scene_consistency runtime binding',
  'camera_continuity cross-shot preservation',
  'character_identity_fidelity IP-Adapter execution',
  'live runtime_connected backend socket',
] as const;

const HIGHEST_PRIORITY_GAP = 'temporal_preservation' as const;

function buildFeasibilityPrecheck(): MovieReconstructionFeasibilityPrecheck {
  return {
    report_id: `movie_reconstruction_feasibility_${Date.now().toString(36)}`,
    phase: GPU_CONDITIONING_CAPABILITY_AUDIT_PHASE,
    system_id: GPU_CONDITIONING_CAPABILITY_AUDIT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    required_features: [...REQUIRED_FEATURES],
    available_features: [...AVAILABLE_FEATURES],
    missing_features: [...MISSING_FEATURES],
    highest_priority_gap: HIGHEST_PRIORITY_GAP,
    movie_reconstruction_score: 0.28,
    storyboard_generation_score: 0.95,
    music_video_score: 0.82,
    short_film_score: 0.51,
    feature_film_score: 0.19,
    feasibility_scores_defined: true,
    highest_priority_gap_defined: true,
    assessment_note:
      'Storyboard Ready != Movie Reconstruction Ready; MV Ready != Feature Film Ready; Backend Capability != Movie Reconstruction Capability. Scores reflect pipeline-effective readiness without GPU execution.',
  };
}

export function runGpuConditioningCapabilityAudit(
  projectRoot?: string
): GpuConditioningCapabilityAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GpuConditioningCapabilityAuditReport['issues'] = [];

  const prerequisitePaths = [
    GPU_CONDITIONING_CAPABILITY_AUDIT_REGISTRY_PATH,
    BACKEND_RUNTIME_BRIDGE_REPORT_PATH,
    CONDITIONING_PRESERVATION_GAP_REPORT_PATH,
    CONDITIONING_ADAPTER_COMPATIBILITY_MATRIX_PATH,
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

  const backends = buildBackendEntries();
  const feasibility = buildFeasibilityPrecheck();

  const backend_capabilities_documented =
    backends.length === 3 &&
    backends.every(
      (entry) =>
        entry.supported_features.length > 0 &&
        typeof entry.capability_score === 'number' &&
        Object.keys(entry.capability_support).length === CAPABILITY_KEYS.length
    );

  const critical_missing_features_defined = backends.every(
    (entry) => entry.critical_missing_features.length > 0
  );

  const highest_priority_gap_defined = feasibility.highest_priority_gap.length > 0;
  const feasibility_scores_defined =
    feasibility.feasibility_scores_defined === true &&
    typeof feasibility.movie_reconstruction_score === 'number' &&
    typeof feasibility.storyboard_generation_score === 'number' &&
    typeof feasibility.music_video_score === 'number' &&
    typeof feasibility.short_film_score === 'number' &&
    typeof feasibility.feature_film_score === 'number';

  const controlnet = backends.find((entry) => entry.backend === 'controlnet_backend');
  if (!controlnet) {
    issues.push({
      code: 'CONTROLNET_BACKEND',
      message: 'controlnet_backend audit entry required',
      severity: 'error',
    });
  }

  if (!backend_capabilities_documented) {
    issues.push({
      code: 'BACKEND_CAPABILITIES',
      message: 'backend_capabilities must be documented',
      severity: 'error',
    });
  }
  if (!critical_missing_features_defined) {
    issues.push({
      code: 'CRITICAL_MISSING',
      message: 'critical_missing_features must be defined per backend',
      severity: 'error',
    });
  }
  if (!highest_priority_gap_defined) {
    issues.push({
      code: 'HIGHEST_PRIORITY_GAP',
      message: 'highest_priority_gap must be defined',
      severity: 'error',
    });
  }
  if (!feasibility_scores_defined) {
    issues.push({
      code: 'FEASIBILITY_SCORES',
      message: 'feasibility_scores must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    backend_capabilities_documented &&
    critical_missing_features_defined &&
    highest_priority_gap_defined &&
    feasibility_scores_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: GpuConditioningCapabilityAuditReport = {
    report_id: `gpu_conditioning_capability_audit_${Date.now().toString(36)}`,
    phase: GPU_CONDITIONING_CAPABILITY_AUDIT_PHASE,
    system_id: GPU_CONDITIONING_CAPABILITY_AUDIT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? GPU_CONDITIONING_CAPABILITY_AUDIT_PASS_VERDICT
      : GPU_CONDITIONING_CAPABILITY_AUDIT_FAIL_VERDICT,
    status: validation_passed
      ? GPU_CONDITIONING_CAPABILITY_AUDIT_STATUS
      : 'GPU_CONDITIONING_CAPABILITIES_NOT_AUDITED',
    validation_passed,
    gpu_capabilities_understood: validation_passed,
    backend_capabilities_documented,
    critical_missing_features_defined,
    gpu_execution_ready: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    audit_scope:
      'Backend native capability audit without GPU execution or image generation; pipeline gaps documented separately from backend technology support.',
    backends,
    checks: {
      backend_capabilities_documented,
      critical_missing_features_defined,
      highest_priority_gap_defined,
      feasibility_scores_defined,
      controlnet_backend_audited: Boolean(controlnet),
      comfyui_backend_audited: backends.some((e) => e.backend === 'comfyui_backend'),
      future_video_backend_audited: backends.some((e) => e.backend === 'future_video_backend'),
      gpu_execution_ready_false: true,
      conditioning_ready_false: true,
      movie_reconstruction_ready_false: true,
      gpu_ready_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH, report);
  writeJson(root, MOVIE_RECONSTRUCTION_FEASIBILITY_PRECHECK_PATH, feasibility);

  return report;
}

export function writeGpuConditioningCapabilityAuditReport(
  projectRoot?: string
): GpuConditioningCapabilityAuditReport {
  return runGpuConditioningCapabilityAudit(projectRoot);
}
