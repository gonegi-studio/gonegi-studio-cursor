import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { CONDITIONING_MAP_EXPORT_CONTRACT_PATH } from './conditioningMapExport.js';

export const CONDITIONING_BACKEND_ADAPTER_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-005' as const;
export const CONDITIONING_BACKEND_ADAPTER_SYSTEM_ID =
  'CONDITIONING_BACKEND_ADAPTER_V1' as const;
export const CONDITIONING_BACKEND_ADAPTER_PASS_VERDICT =
  'PASS_CONDITIONING_BACKEND_ADAPTER_V1' as const;
export const CONDITIONING_BACKEND_ADAPTER_FAIL_VERDICT =
  'FAIL_CONDITIONING_BACKEND_ADAPTER_V1' as const;
export const CONDITIONING_BACKEND_ADAPTER_STATUS =
  'CONDITIONING_BACKEND_ADAPTERS_DESIGNED' as const;

export const CONDITIONING_BACKEND_ADAPTER_DATASET_DIR =
  'datasets/movie_reconstruction_conditioning_adapters' as const;
export const CONDITIONING_BACKEND_ADAPTER_REGISTRY_PATH =
  `${CONDITIONING_BACKEND_ADAPTER_DATASET_DIR}/movie-reconstruction-conditioning-adapters-registry.json` as const;

export const CONDITIONING_BACKEND_ADAPTER_REPORT_PATH =
  'reports/movie_reconstruction/CONDITIONING_BACKEND_ADAPTER_REPORT.json' as const;
export const CONDITIONING_ADAPTER_COMPATIBILITY_MATRIX_PATH =
  'reports/movie_reconstruction/CONDITIONING_ADAPTER_COMPATIBILITY_MATRIX.json' as const;
export const CONDITIONING_ADAPTER_ROADMAP_PATH =
  'reports/movie_reconstruction/CONDITIONING_ADAPTER_ROADMAP.json' as const;

const INPUT_CONTRACT_VERSION = '1.0' as const;

type AdapterName = 'controlnet_adapter' | 'comfyui_adapter' | 'future_video_adapter';
type MapType =
  | 'layout_map'
  | 'depth_map'
  | 'pose_map'
  | 'blocking_map'
  | 'environment_identity_map'
  | 'object_identity';
type LossyRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
type IdentityLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

const EXECUTION_FLAGS = {
  design_only: true as const,
  adapter_validation_deferred: true as const,
  backend_execution_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface AdapterDesignSpec {
  adapter_name: AdapterName;
  input_contract: string;
  input_contract_version: typeof INPUT_CONTRACT_VERSION;
  output_format: string;
  supported_maps: MapType[];
  unsupported_maps: MapType[];
  translation_rules: string[];
  lossy_translation_risk: LossyRisk;
  identity_preservation_level: IdentityLevel;
  unsupported_reason: string;
  backend_target: string;
}

export interface ConditioningBackendAdapterReportEntry {
  adapter_name: AdapterName;
  input_contract_version: typeof INPUT_CONTRACT_VERSION;
  supported_maps: MapType[];
  translation_coverage: number;
  backend_target: string;
  lossy_translation_risk: LossyRisk;
  identity_preservation_level: IdentityLevel;
}

export interface ConditioningAdapterCompatibilityEntry {
  adapter: AdapterName;
  layout_map: boolean;
  depth_map: boolean;
  pose_map: boolean;
  blocking_map: boolean;
  environment_identity_map: boolean;
  object_identity_support: boolean;
  translation_loss: LossyRisk;
}

export interface ConditioningBackendAdapterReport {
  report_id: string;
  phase: typeof CONDITIONING_BACKEND_ADAPTER_PHASE;
  system_id: typeof CONDITIONING_BACKEND_ADAPTER_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof CONDITIONING_BACKEND_ADAPTER_STATUS
    | 'CONDITIONING_BACKEND_ADAPTERS_NOT_DESIGNED';
  validation_passed: boolean;
  design_only: true;
  backend_adapters_designed: boolean;
  adapter_translation_validated: false;
  backend_implemented: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  controlnet_adapter_defined: boolean;
  comfyui_adapter_defined: boolean;
  future_video_adapter_defined: boolean;
  contract_version_supported: boolean;
  translation_rules_defined: boolean;
  lossy_translation_risk_defined: boolean;
  adapters: ConditioningBackendAdapterReportEntry[];
  adapter_specs: AdapterDesignSpec[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface ConditioningAdapterCompatibilityMatrixReport {
  report_id: string;
  phase: typeof CONDITIONING_BACKEND_ADAPTER_PHASE;
  system_id: typeof CONDITIONING_BACKEND_ADAPTER_SYSTEM_ID;
  generated_at: string;
  input_contract_version: typeof INPUT_CONTRACT_VERSION;
  entries: ConditioningAdapterCompatibilityEntry[];
}

export interface ConditioningAdapterRoadmap {
  report_id: string;
  phase: typeof CONDITIONING_BACKEND_ADAPTER_PHASE;
  system_id: typeof CONDITIONING_BACKEND_ADAPTER_SYSTEM_ID;
  generated_at: string;
  backend_adapters_designed: true;
  adapter_priority: AdapterName[];
  implementation_order: Array<{
    adapter: AdapterName;
    priority: number;
    gpu_dependency: boolean;
    phase_gate: string;
  }>;
  gpu_dependency: {
    controlnet_adapter: boolean;
    comfyui_adapter: boolean;
    future_video_adapter: true;
  };
  next_phase: string;
  adapter_translation_validated: false;
  conditioning_ready: false;
  gpu_ready: false;
}

const ADAPTER_DESIGNS: AdapterDesignSpec[] = [
  {
    adapter_name: 'controlnet_adapter',
    input_contract: 'conditioning-map-export-contract v1.0 bundle',
    input_contract_version: INPUT_CONTRACT_VERSION,
    output_format:
      'ControlNet preprocessor spec: layout→seg/canny PNG, depth→depth PNG, pose→OpenPose PNG, blocking→region mask PNG',
    supported_maps: ['layout_map', 'depth_map', 'pose_map', 'blocking_map'],
    unsupported_maps: ['environment_identity_map', 'object_identity'],
    translation_rules: [
      'normalized_layout_elements_v1 → rasterize subject bbox + vanishing point to 512x512 seg map',
      'normalized_depth_samples_v1 → interpolate z samples to grayscale depth PNG aligned to frame aspect',
      'skeleton_keypoint_descriptors_v1 → render OpenPose stick figure from screen_position + eyeline_vector',
      'character_region_masks_v1 → paint region_label zones as discrete mask channels',
      'Apply per-map ControlNet weight from architecture decision multi-control stack',
    ],
    lossy_translation_risk: 'HIGH',
    identity_preservation_level: 'LOW',
    unsupported_reason:
      'environment_identity_map is reserved_v1 with no populated payload; object_identity requires IP-Adapter path outside ControlNet adapter scope',
    backend_target: 'ControlNet (layout + depth + pose multi-control stack)',
  },
  {
    adapter_name: 'comfyui_adapter',
    input_contract: 'conditioning-map-export-contract v1.0 bundle + ComfyUI workflow schema',
    input_contract_version: INPUT_CONTRACT_VERSION,
    output_format:
      'ComfyUI workflow JSON with LoadImage/ControlNetApplyAdvanced nodes bound to translated map artifacts',
    supported_maps: ['layout_map', 'depth_map', 'pose_map', 'blocking_map'],
    unsupported_maps: ['environment_identity_map', 'object_identity'],
    translation_rules: [
      'Invoke controlnet_adapter raster translation pipeline for map PNG outputs',
      'Map bundle source_video_id → ComfyUI batch folder structure',
      'Wire ControlNetApplyAdvanced nodes with weight presets per map type',
      'Inject ConditionedPromptBuilder text constraints as CLIPTextEncode nodes',
      'Export workflow template with placeholder checkpoint and ControlNet model refs',
    ],
    lossy_translation_risk: 'MEDIUM',
    identity_preservation_level: 'MEDIUM',
    unsupported_reason:
      'ComfyUI IP-Adapter nodes deferred until object_identity map export exists; environment_identity_map reserved',
    backend_target: 'ComfyUI orchestration layer wrapping ControlNet stack',
  },
  {
    adapter_name: 'future_video_adapter',
    input_contract:
      'conditioning-map-export-contract v1.0 bundle + shot timeline registry + temporal continuity metadata',
    input_contract_version: INPUT_CONTRACT_VERSION,
    output_format:
      'Video conditioning request payload: per-shot frame stack with temporal attention hints and continuity locks',
    supported_maps: ['layout_map', 'depth_map', 'pose_map', 'blocking_map'],
    unsupported_maps: ['environment_identity_map', 'object_identity'],
    translation_rules: [
      'Aggregate per-frame controlnet_adapter outputs into shot-sequence tensor stack',
      'Bind edit_rhythm edit_points to shot boundary transitions',
      'Apply motion_vectors frame_pair hints to temporal smoothing weights',
      'Inject scene_remap gonegi_scene_id as environment continuity anchor',
      'Defer raster generation until GPU validation phase; design schema only in this phase',
    ],
    lossy_translation_risk: 'VERY_HIGH',
    identity_preservation_level: 'MEDIUM',
    unsupported_reason:
      'Video conditioning backend deferred per architecture decision; temporal GPU pipeline not designed for execution in this phase',
    backend_target: 'Video conditioning backend (deferred stack)',
  },
];

function translationCoverage(spec: AdapterDesignSpec): number {
  const totalMaps = 6;
  return Number((spec.supported_maps.length / totalMaps).toFixed(4));
}

function buildCompatibilityMatrix(): ConditioningAdapterCompatibilityEntry[] {
  return [
    {
      adapter: 'controlnet_adapter',
      layout_map: true,
      depth_map: true,
      pose_map: true,
      blocking_map: true,
      environment_identity_map: false,
      object_identity_support: false,
      translation_loss: 'HIGH',
    },
    {
      adapter: 'comfyui_adapter',
      layout_map: true,
      depth_map: true,
      pose_map: true,
      blocking_map: true,
      environment_identity_map: false,
      object_identity_support: false,
      translation_loss: 'MEDIUM',
    },
    {
      adapter: 'future_video_adapter',
      layout_map: true,
      depth_map: true,
      pose_map: true,
      blocking_map: true,
      environment_identity_map: false,
      object_identity_support: false,
      translation_loss: 'VERY_HIGH',
    },
  ];
}

function buildAdapterReportEntries(): ConditioningBackendAdapterReportEntry[] {
  return ADAPTER_DESIGNS.map((spec) => ({
    adapter_name: spec.adapter_name,
    input_contract_version: spec.input_contract_version,
    supported_maps: [...spec.supported_maps],
    translation_coverage: translationCoverage(spec),
    backend_target: spec.backend_target,
    lossy_translation_risk: spec.lossy_translation_risk,
    identity_preservation_level: spec.identity_preservation_level,
  }));
}

function buildConditioningAdapterRoadmap(): ConditioningAdapterRoadmap {
  return {
    report_id: `conditioning_adapter_roadmap_${Date.now().toString(36)}`,
    phase: CONDITIONING_BACKEND_ADAPTER_PHASE,
    system_id: CONDITIONING_BACKEND_ADAPTER_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    backend_adapters_designed: true,
    adapter_priority: ['controlnet_adapter', 'comfyui_adapter', 'future_video_adapter'],
    implementation_order: [
      {
        adapter: 'controlnet_adapter',
        priority: 1,
        gpu_dependency: true,
        phase_gate: 'PHASE-GPU-CONDITIONING-VALIDATION-001',
      },
      {
        adapter: 'comfyui_adapter',
        priority: 2,
        gpu_dependency: true,
        phase_gate: 'PHASE-GPU-CONDITIONING-VALIDATION-001',
      },
      {
        adapter: 'future_video_adapter',
        priority: 3,
        gpu_dependency: true,
        phase_gate: 'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-007_VIDEO_CONDITIONING_BACKEND_V1',
      },
    ],
    gpu_dependency: {
      controlnet_adapter: true,
      comfyui_adapter: true,
      future_video_adapter: true,
    },
    next_phase: 'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-006_IMAGE_APP_MAP_INGESTION_V1',
    adapter_translation_validated: false,
    conditioning_ready: false,
    gpu_ready: false,
  };
}

function adapterDesignComplete(spec: AdapterDesignSpec): boolean {
  return (
    spec.input_contract.length > 0 &&
    spec.output_format.length > 0 &&
    spec.supported_maps.length > 0 &&
    spec.translation_rules.length > 0 &&
    spec.lossy_translation_risk.length > 0 &&
    spec.identity_preservation_level.length > 0 &&
    spec.unsupported_reason.length > 0
  );
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function buildAdapterDesigns(): AdapterDesignSpec[] {
  return ADAPTER_DESIGNS.map((spec) => ({
    ...spec,
    supported_maps: [...spec.supported_maps],
    unsupported_maps: [...spec.unsupported_maps],
    translation_rules: [...spec.translation_rules],
  }));
}

export function runConditioningBackendAdapterDesignValidation(
  projectRoot?: string
): ConditioningBackendAdapterReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ConditioningBackendAdapterReport['issues'] = [];

  if (!fs.existsSync(path.join(root, CONDITIONING_BACKEND_ADAPTER_REGISTRY_PATH))) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing ${CONDITIONING_BACKEND_ADAPTER_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, CONDITIONING_MAP_EXPORT_CONTRACT_PATH))) {
    issues.push({
      code: 'MAP_EXPORT_PREREQUISITE',
      message: `Missing map export contract ${CONDITIONING_MAP_EXPORT_CONTRACT_PATH}`,
      severity: 'error',
    });
  }

  const adapterSpecs = buildAdapterDesigns();
  const adapters = buildAdapterReportEntries();
  const compatibilityMatrix: ConditioningAdapterCompatibilityMatrixReport = {
    report_id: `conditioning_adapter_compatibility_${Date.now().toString(36)}`,
    phase: CONDITIONING_BACKEND_ADAPTER_PHASE,
    system_id: CONDITIONING_BACKEND_ADAPTER_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    input_contract_version: INPUT_CONTRACT_VERSION,
    entries: buildCompatibilityMatrix(),
  };
  const roadmap = buildConditioningAdapterRoadmap();

  const controlnet_adapter_defined = adapterSpecs.some(
    (spec) => spec.adapter_name === 'controlnet_adapter' && adapterDesignComplete(spec)
  );
  const comfyui_adapter_defined = adapterSpecs.some(
    (spec) => spec.adapter_name === 'comfyui_adapter' && adapterDesignComplete(spec)
  );
  const future_video_adapter_defined = adapterSpecs.some(
    (spec) => spec.adapter_name === 'future_video_adapter' && adapterDesignComplete(spec)
  );

  const contract_version_supported = adapterSpecs.every(
    (spec) => spec.input_contract_version === INPUT_CONTRACT_VERSION
  );
  const translation_rules_defined = adapterSpecs.every((spec) => spec.translation_rules.length > 0);
  const lossy_translation_risk_defined = adapterSpecs.every(
    (spec) => spec.lossy_translation_risk.length > 0
  );

  if (!controlnet_adapter_defined) {
    issues.push({
      code: 'CONTROLNET_ADAPTER',
      message: 'controlnet_adapter must be fully defined',
      severity: 'error',
    });
  }
  if (!comfyui_adapter_defined) {
    issues.push({
      code: 'COMFYUI_ADAPTER',
      message: 'comfyui_adapter must be fully defined',
      severity: 'error',
    });
  }
  if (!future_video_adapter_defined) {
    issues.push({
      code: 'FUTURE_VIDEO_ADAPTER',
      message: 'future_video_adapter must be fully defined',
      severity: 'error',
    });
  }
  if (!contract_version_supported) {
    issues.push({
      code: 'CONTRACT_VERSION',
      message: 'All adapters must support contract version 1.0',
      severity: 'error',
    });
  }
  if (!translation_rules_defined) {
    issues.push({
      code: 'TRANSLATION_RULES',
      message: 'translation_rules must be defined for all adapters',
      severity: 'error',
    });
  }
  if (!lossy_translation_risk_defined) {
    issues.push({
      code: 'LOSSY_RISK',
      message: 'lossy_translation_risk must be defined for all adapters',
      severity: 'error',
    });
  }

  const validation_passed =
    controlnet_adapter_defined &&
    comfyui_adapter_defined &&
    future_video_adapter_defined &&
    contract_version_supported &&
    translation_rules_defined &&
    lossy_translation_risk_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: ConditioningBackendAdapterReport = {
    report_id: `conditioning_backend_adapter_${Date.now().toString(36)}`,
    phase: CONDITIONING_BACKEND_ADAPTER_PHASE,
    system_id: CONDITIONING_BACKEND_ADAPTER_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? CONDITIONING_BACKEND_ADAPTER_PASS_VERDICT
      : CONDITIONING_BACKEND_ADAPTER_FAIL_VERDICT,
    status: validation_passed
      ? CONDITIONING_BACKEND_ADAPTER_STATUS
      : 'CONDITIONING_BACKEND_ADAPTERS_NOT_DESIGNED',
    validation_passed,
    design_only: true,
    backend_adapters_designed: validation_passed,
    adapter_translation_validated: false,
    backend_implemented: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    controlnet_adapter_defined,
    comfyui_adapter_defined,
    future_video_adapter_defined,
    contract_version_supported,
    translation_rules_defined,
    lossy_translation_risk_defined,
    adapters,
    adapter_specs: adapterSpecs,
    checks: {
      controlnet_adapter_defined,
      comfyui_adapter_defined,
      future_video_adapter_defined,
      contract_version_supported,
      translation_rules_defined,
      lossy_translation_risk_defined,
      compatibility_matrix_exists: true,
      roadmap_exists: true,
      backend_adapters_designed: validation_passed,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, CONDITIONING_BACKEND_ADAPTER_REPORT_PATH, report);
  writeJson(root, CONDITIONING_ADAPTER_COMPATIBILITY_MATRIX_PATH, compatibilityMatrix);
  writeJson(root, CONDITIONING_ADAPTER_ROADMAP_PATH, roadmap);

  return report;
}

export function writeConditioningBackendAdapterReport(
  projectRoot?: string
): ConditioningBackendAdapterReport {
  return runConditioningBackendAdapterDesignValidation(projectRoot);
}
