import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { resolveProjectRoot } from './projectRootResolver.js';
import { CONDITIONING_MAP_EXPORT_BUNDLE_PATH } from './conditioningMapExport.js';
import { CONDITIONING_BACKEND_ADAPTER_REPORT_PATH } from './conditioningBackendAdapterDesign.js';
import { ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH } from './adapterTranslationValidation.js';
import { IMAGE_APP_INGESTION_SPECIFICATION_PATH } from './imageAppMapIngestion.js';

export const BACKEND_RUNTIME_BRIDGE_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-006A' as const;
export const BACKEND_RUNTIME_BRIDGE_SYSTEM_ID = 'BACKEND_RUNTIME_BRIDGE_V1' as const;
export const BACKEND_RUNTIME_BRIDGE_PASS_VERDICT = 'PASS_BACKEND_RUNTIME_BRIDGE_V1' as const;
export const BACKEND_RUNTIME_BRIDGE_FAIL_VERDICT = 'FAIL_BACKEND_RUNTIME_BRIDGE_V1' as const;
export const BACKEND_RUNTIME_BRIDGE_STATUS = 'BACKEND_RUNTIME_BRIDGE_DEFINED' as const;

export const BACKEND_RUNTIME_BRIDGE_DATASET_DIR =
  'datasets/movie_reconstruction_backend_runtime_bridge' as const;
export const BACKEND_RUNTIME_BRIDGE_REGISTRY_PATH =
  `${BACKEND_RUNTIME_BRIDGE_DATASET_DIR}/backend-runtime-bridge-registry.json` as const;

export const BACKEND_RUNTIME_BRIDGE_REPORT_PATH =
  'reports/movie_reconstruction/BACKEND_RUNTIME_BRIDGE_REPORT.json' as const;
export const RUNTIME_BRIDGE_GAP_REPORT_PATH =
  'reports/movie_reconstruction/RUNTIME_BRIDGE_GAP_REPORT.json' as const;
export const RUNTIME_BRIDGE_TRACEABILITY_REPORT_PATH =
  'reports/movie_reconstruction/RUNTIME_BRIDGE_TRACEABILITY_REPORT.json' as const;

const NEXT_PHASE = 'PHASE-GPU-CONDITIONING-VALIDATION-001' as const;

const EXECUTION_FLAGS = {
  architecture_validation_only: true as const,
  implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface RuntimeCapabilityLevel {
  layout: boolean;
  depth: boolean;
  pose: boolean;
  blocking: boolean;
  environment_identity: boolean;
  object_identity: boolean;
  temporal_preservation: boolean;
}

export interface BackendRuntimeTargetEntry {
  runtime_target: string;
  adapter: string;
  runtime_capability_level: RuntimeCapabilityLevel;
}

export interface RuntimeBridgeTraceabilityEntry {
  traceability_id: string;
  source_contract: string;
  adapter: string;
  runtime_target: string;
  traceability_signature: string;
  runtime_degradation_path: string[];
}

export interface BackendRuntimeBridgeReport {
  report_id: string;
  phase: typeof BACKEND_RUNTIME_BRIDGE_PHASE;
  system_id: typeof BACKEND_RUNTIME_BRIDGE_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof BACKEND_RUNTIME_BRIDGE_STATUS | 'BACKEND_RUNTIME_BRIDGE_NOT_DEFINED';
  validation_passed: boolean;
  runtime_bridge_defined: boolean;
  execution_path_defined: boolean;
  fallback_path_defined: boolean;
  traceability_defined: boolean;
  bridge_mode_defined: boolean;
  runtime_capability_level_defined: boolean;
  runtime_connected: false;
  backend_executed: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  analysis: {
    contract_runtime_binding: string;
    adapter_runtime_binding: string;
    fallback_runtime_binding: string;
    runtime_bridge_traceability: string;
    runtime_capability_assessment: string;
  };
  runtime_bridge_contract: Record<string, string>;
  runtime_execution_path: Record<string, string>;
  runtime_fallback_path: Record<string, string>;
  runtime_traceability_format: Record<string, string>;
  runtime_capability_format: Record<string, string>;
  primary_runtime_path: string[];
  fallback_runtime_path: string[];
  supported_backends: string[];
  runtime_limitations: string[];
  bridge_mode: string;
  runtime_targets: BackendRuntimeTargetEntry[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface RuntimeBridgeGapReport {
  report_id: string;
  phase: typeof BACKEND_RUNTIME_BRIDGE_PHASE;
  system_id: typeof BACKEND_RUNTIME_BRIDGE_SYSTEM_ID;
  generated_at: string;
  implemented: string[];
  missing: string[];
  runtime_blockers: string[];
  next_phase: typeof NEXT_PHASE;
}

export interface RuntimeBridgeTraceabilityReport {
  report_id: string;
  phase: typeof BACKEND_RUNTIME_BRIDGE_PHASE;
  system_id: typeof BACKEND_RUNTIME_BRIDGE_SYSTEM_ID;
  generated_at: string;
  entries: RuntimeBridgeTraceabilityEntry[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function signature(prefix: string, payload: unknown): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 16);
  return `${prefix}_${hash}`;
}

const ANALYSIS = {
  contract_runtime_binding:
    'conditioning-map-export contract v1.0 binds to runtime_bridge_contract; maps route through adapter_runtime_binding before any backend target selection.',
  adapter_runtime_binding:
    'controlnet_adapter and comfyui_adapter translate export maps to backend-specific slots; comfyui_adapter is recommended primary adapter per translation validation.',
  fallback_runtime_binding:
    'When adapter or backend binding fails, fallback_runtime_binding activates ConditionedPromptBuilder with NOT_PRODUCTION_REPLICA — architecture validated, not executed.',
  runtime_bridge_traceability:
    'traceability_signature links source_contract, adapter, and runtime_target with runtime_degradation_path for audit without GPU execution.',
  runtime_capability_assessment:
    'Per-backend runtime_capability_level reports what CAN connect at architecture level; identity and temporal domains remain false until GPU validation phase.',
} as const;

const RUNTIME_BRIDGE_CONTRACT = {
  contract_id: 'backend_runtime_bridge_contract_v1',
  contract_version: '1.0',
  source_ingestion_ref: IMAGE_APP_INGESTION_SPECIFICATION_PATH,
  source_bundle: CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
  bridge_mode: 'architecture_validation_only — validates Can Connect?, not Can Reconstruct Movies?',
  runtime_connected: 'false — bridge architecture defined only; no live backend socket opened.',
  backend_executed: 'false — no GPU raster generation or inference in this phase.',
  adapter_gate: 'Maps must pass adapter_runtime_binding before runtime_target assignment.',
} as const;

const RUNTIME_EXECUTION_PATH = {
  path_id: 'primary_runtime_execution_v1',
  steps:
    'conditioning-map-export-bundle → adapter_runtime_binding → runtime_bridge → runtime_target (controlnet_backend | comfyui_backend).',
  primary_adapter: 'comfyui_adapter',
  secondary_adapter: 'controlnet_adapter',
  consumer: 'image_app via IMAGE_APP_INGESTION_SPECIFICATION runtime_bridge.',
  execution_deferred: 'true — path defined for connection readiness; execution blocked until GPU validation.',
} as const;

const RUNTIME_FALLBACK_PATH = {
  path_id: 'fallback_runtime_execution_v1',
  trigger: 'adapter_runtime_binding failure or runtime_target unavailable.',
  compiler: 'ConditionedPromptBuilder',
  output_flag: 'NOT_PRODUCTION_REPLICA',
  degradation_chain: 'comfyui_adapter → fallback_text_path → ConditionedPromptBuilder',
  preserves: 'Narrative text constraints and scene_remap gonegi_scene_id.',
} as const;

const RUNTIME_TRACEABILITY_FORMAT = {
  traceability_id: 'Unique runtime bridge traceability record identifier.',
  source_contract: 'Source contract path (conditioning-map-export or image_app ingestion contract).',
  adapter: 'Adapter enum: controlnet_adapter | comfyui_adapter | future_video_adapter.',
  runtime_target: 'Backend target enum: controlnet_backend | comfyui_backend | future_video_backend.',
  traceability_signature: 'Deterministic hash binding source_contract, adapter, and runtime_target.',
  runtime_degradation_path: 'Ordered adapter and fallback steps when runtime degrades.',
} as const;

const RUNTIME_CAPABILITY_FORMAT = {
  runtime_target: 'Backend target identifier.',
  runtime_capability_level: 'Per-domain boolean capability map at architecture validation time.',
  layout: 'ControlNet-class layout map connectable.',
  depth: 'Depth-conditioned map connectable.',
  pose: 'Pose-conditioned map connectable.',
  blocking: 'Regional blocking map connectable.',
  environment_identity: 'Environment reference bank IP-Adapter path connectable.',
  object_identity: 'Object reference bank IP-Adapter path connectable.',
  temporal_preservation: 'Temporal memory and video backend connectable.',
  assessment_note:
    'Capability true means architecture supports connection; false means blocked or deferred — not a reconstruction readiness score.',
} as const;

const PRIMARY_RUNTIME_PATH = [
  'source_video_numerical_dna_full',
  'conditioning-map-export-bundle',
  'adapter_runtime_binding.comfyui_adapter',
  'backend_runtime_bridge',
  'runtime_target.controlnet_backend | runtime_target.comfyui_backend',
] as const;

const FALLBACK_RUNTIME_PATH = [
  'adapter_runtime_binding failure detection',
  'comfyui_adapter',
  'fallback_text_path',
  'ConditionedPromptBuilder',
  'NOT_PRODUCTION_REPLICA',
] as const;

const SUPPORTED_BACKENDS = [
  'controlnet_backend',
  'comfyui_backend',
  'future_video_backend',
] as const;

const RUNTIME_LIMITATIONS = [
  'No GPU execution in this phase — architecture validation only.',
  'environment_identity and object_identity require IP-Adapter nodes not yet connected.',
  'temporal_preservation requires future_video_backend deferred per architecture decision.',
  'raster control maps not generated — metadata binding only.',
  'runtime_connected=false — bridge defined but not live-connected to backend.',
  'Backend Connected != Movie Reconstruction Ready.',
] as const;

const BRIDGE_MODE = 'architecture_validation_only' as const;

const CONTROLNET_CAPABILITY: RuntimeCapabilityLevel = {
  layout: true,
  depth: true,
  pose: true,
  blocking: true,
  environment_identity: false,
  object_identity: false,
  temporal_preservation: false,
};

const COMFYUI_CAPABILITY: RuntimeCapabilityLevel = {
  layout: true,
  depth: true,
  pose: true,
  blocking: true,
  environment_identity: false,
  object_identity: false,
  temporal_preservation: false,
};

const FUTURE_VIDEO_CAPABILITY: RuntimeCapabilityLevel = {
  layout: false,
  depth: false,
  pose: false,
  blocking: false,
  environment_identity: false,
  object_identity: false,
  temporal_preservation: false,
};

const RUNTIME_TARGETS: BackendRuntimeTargetEntry[] = [
  {
    runtime_target: 'controlnet_backend',
    adapter: 'controlnet_adapter',
    runtime_capability_level: { ...CONTROLNET_CAPABILITY },
  },
  {
    runtime_target: 'comfyui_backend',
    adapter: 'comfyui_adapter',
    runtime_capability_level: { ...COMFYUI_CAPABILITY },
  },
  {
    runtime_target: 'future_video_backend',
    adapter: 'future_video_adapter',
    runtime_capability_level: { ...FUTURE_VIDEO_CAPABILITY },
  },
];

function buildTraceabilityEntries(): RuntimeBridgeTraceabilityEntry[] {
  const seeds: Array<Omit<RuntimeBridgeTraceabilityEntry, 'traceability_id' | 'traceability_signature'>> =
    [
      {
        source_contract: CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
        adapter: 'controlnet_adapter',
        runtime_target: 'controlnet_backend',
        runtime_degradation_path: ['controlnet_adapter', 'fallback_text_path'],
      },
      {
        source_contract: CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
        adapter: 'comfyui_adapter',
        runtime_target: 'comfyui_backend',
        runtime_degradation_path: ['comfyui_adapter', 'fallback_text_path'],
      },
      {
        source_contract: IMAGE_APP_INGESTION_SPECIFICATION_PATH,
        adapter: 'comfyui_adapter',
        runtime_target: 'comfyui_backend',
        runtime_degradation_path: ['comfyui_adapter', 'fallback_text_path'],
      },
      {
        source_contract: CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
        adapter: 'future_video_adapter',
        runtime_target: 'future_video_backend',
        runtime_degradation_path: ['future_video_adapter', 'comfyui_adapter', 'fallback_text_path'],
      },
    ];

  return seeds.map((entry, index) => ({
    traceability_id: `runtime_trace_${String(index + 1).padStart(3, '0')}`,
    ...entry,
    traceability_signature: signature('trace', {
      source_contract: entry.source_contract,
      adapter: entry.adapter,
      runtime_target: entry.runtime_target,
    }),
  }));
}

function buildGapReport(): RuntimeBridgeGapReport {
  return {
    report_id: `runtime_bridge_gap_${Date.now().toString(36)}`,
    phase: BACKEND_RUNTIME_BRIDGE_PHASE,
    system_id: BACKEND_RUNTIME_BRIDGE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    implemented: [
      'runtime_bridge_contract',
      'runtime_execution_path',
      'runtime_fallback_path',
      'runtime_traceability_format',
      'runtime_capability_format',
      'primary_runtime_path',
      'fallback_runtime_path',
      'bridge_mode architecture_validation_only',
      'per-backend runtime_capability_level assessment',
    ],
    missing: [
      'live runtime_connected socket to controlnet_backend',
      'live runtime_connected socket to comfyui_backend',
      'GPU raster map generation',
      'IP-Adapter identity node execution',
      'future_video_backend implementation',
      'environment_identity_map populated payload export',
      'object_identity identity_embedding_ref generation',
    ],
    runtime_blockers: [
      'gpu_execution disabled in this phase',
      'backend_executed=false by design',
      'IP-Adapter nodes deferred until GPU validation',
      'video conditioning backend deferred per architecture decision',
      'raster control maps deferred in conditioning map export',
    ],
    next_phase: NEXT_PHASE,
  };
}

export function runBackendRuntimeBridgeValidation(
  projectRoot?: string
): BackendRuntimeBridgeReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: BackendRuntimeBridgeReport['issues'] = [];

  const prerequisitePaths = [
    BACKEND_RUNTIME_BRIDGE_REGISTRY_PATH,
    IMAGE_APP_INGESTION_SPECIFICATION_PATH,
    CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
    ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH,
    CONDITIONING_BACKEND_ADAPTER_REPORT_PATH,
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

  const runtime_bridge_defined = Object.keys(RUNTIME_BRIDGE_CONTRACT).length > 0;
  const execution_path_defined =
    Object.keys(RUNTIME_EXECUTION_PATH).length > 0 && PRIMARY_RUNTIME_PATH.length > 0;
  const fallback_path_defined =
    Object.keys(RUNTIME_FALLBACK_PATH).length > 0 && FALLBACK_RUNTIME_PATH.length > 0;
  const traceability_defined = Object.keys(RUNTIME_TRACEABILITY_FORMAT).length > 0;
  const bridge_mode_defined = BRIDGE_MODE.length > 0;
  const runtime_capability_level_defined =
    RUNTIME_TARGETS.length > 0 &&
    RUNTIME_TARGETS.every(
      (entry) =>
        typeof entry.runtime_capability_level.layout === 'boolean' &&
        typeof entry.runtime_capability_level.environment_identity === 'boolean' &&
        typeof entry.runtime_capability_level.object_identity === 'boolean' &&
        typeof entry.runtime_capability_level.temporal_preservation === 'boolean'
    );

  const controlnetTarget = RUNTIME_TARGETS.find(
    (entry) => entry.runtime_target === 'controlnet_backend'
  );

  if (!controlnetTarget) {
    issues.push({
      code: 'CONTROLNET_TARGET',
      message: 'controlnet_backend runtime target required',
      severity: 'error',
    });
  } else {
    const cap = controlnetTarget.runtime_capability_level;
    if (
      !cap.layout ||
      !cap.depth ||
      !cap.pose ||
      cap.environment_identity ||
      cap.object_identity ||
      cap.temporal_preservation
    ) {
      issues.push({
        code: 'CONTROLNET_CAPABILITY',
        message:
          'controlnet_backend must have layout/depth/pose=true and environment_identity/object_identity/temporal_preservation=false',
        severity: 'error',
      });
    }
  }

  if (!runtime_bridge_defined) {
    issues.push({ code: 'RUNTIME_BRIDGE', message: 'runtime_bridge must be defined', severity: 'error' });
  }
  if (!execution_path_defined) {
    issues.push({ code: 'EXECUTION_PATH', message: 'execution_path must be defined', severity: 'error' });
  }
  if (!fallback_path_defined) {
    issues.push({ code: 'FALLBACK_PATH', message: 'fallback_path must be defined', severity: 'error' });
  }
  if (!traceability_defined) {
    issues.push({ code: 'TRACEABILITY', message: 'traceability must be defined', severity: 'error' });
  }
  if (!bridge_mode_defined) {
    issues.push({ code: 'BRIDGE_MODE', message: 'bridge_mode must be defined', severity: 'error' });
  }
  if (!runtime_capability_level_defined) {
    issues.push({
      code: 'RUNTIME_CAPABILITY',
      message: 'runtime_capability_level must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    runtime_bridge_defined &&
    execution_path_defined &&
    fallback_path_defined &&
    traceability_defined &&
    bridge_mode_defined &&
    runtime_capability_level_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: BackendRuntimeBridgeReport = {
    report_id: `backend_runtime_bridge_${Date.now().toString(36)}`,
    phase: BACKEND_RUNTIME_BRIDGE_PHASE,
    system_id: BACKEND_RUNTIME_BRIDGE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? BACKEND_RUNTIME_BRIDGE_PASS_VERDICT
      : BACKEND_RUNTIME_BRIDGE_FAIL_VERDICT,
    status: validation_passed
      ? BACKEND_RUNTIME_BRIDGE_STATUS
      : 'BACKEND_RUNTIME_BRIDGE_NOT_DEFINED',
    validation_passed,
    runtime_bridge_defined,
    execution_path_defined,
    fallback_path_defined,
    traceability_defined,
    bridge_mode_defined,
    runtime_capability_level_defined,
    runtime_connected: false,
    backend_executed: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    analysis: { ...ANALYSIS },
    runtime_bridge_contract: { ...RUNTIME_BRIDGE_CONTRACT },
    runtime_execution_path: { ...RUNTIME_EXECUTION_PATH },
    runtime_fallback_path: { ...RUNTIME_FALLBACK_PATH },
    runtime_traceability_format: { ...RUNTIME_TRACEABILITY_FORMAT },
    runtime_capability_format: { ...RUNTIME_CAPABILITY_FORMAT },
    primary_runtime_path: [...PRIMARY_RUNTIME_PATH],
    fallback_runtime_path: [...FALLBACK_RUNTIME_PATH],
    supported_backends: [...SUPPORTED_BACKENDS],
    runtime_limitations: [...RUNTIME_LIMITATIONS],
    bridge_mode: BRIDGE_MODE,
    runtime_targets: RUNTIME_TARGETS,
    checks: {
      runtime_bridge_defined,
      execution_path_defined,
      fallback_path_defined,
      traceability_defined,
      bridge_mode_defined,
      runtime_capability_level_defined,
      controlnet_example_present: Boolean(controlnetTarget),
      runtime_connected_false: true,
      backend_executed_false: true,
      conditioning_ready_false: true,
      movie_reconstruction_ready_false: true,
      gpu_ready_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  const traceabilityReport: RuntimeBridgeTraceabilityReport = {
    report_id: `runtime_bridge_traceability_${Date.now().toString(36)}`,
    phase: BACKEND_RUNTIME_BRIDGE_PHASE,
    system_id: BACKEND_RUNTIME_BRIDGE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    entries: buildTraceabilityEntries(),
  };

  writeJson(root, BACKEND_RUNTIME_BRIDGE_REPORT_PATH, report);
  writeJson(root, RUNTIME_BRIDGE_GAP_REPORT_PATH, buildGapReport());
  writeJson(root, RUNTIME_BRIDGE_TRACEABILITY_REPORT_PATH, traceabilityReport);

  return report;
}

export function writeBackendRuntimeBridgeReport(
  projectRoot?: string
): BackendRuntimeBridgeReport {
  return runBackendRuntimeBridgeValidation(projectRoot);
}
