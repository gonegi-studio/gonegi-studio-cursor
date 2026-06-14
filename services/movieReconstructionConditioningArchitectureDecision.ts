import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH } from './movieReconstructionConditioningDesign.js';

export const MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-003' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_SYSTEM_ID =
  'MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_V1' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PASS_VERDICT =
  'PASS_MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_V1' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_FAIL_VERDICT =
  'FAIL_MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_V1' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_STATUS =
  'MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECIDED' as const;

export const MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DATASET_DIR =
  'datasets/movie_reconstruction_conditioning_architecture' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_REGISTRY_PATH =
  `${MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DATASET_DIR}/movie-reconstruction-conditioning-architecture-registry.json` as const;

export const MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT_PATH =
  'reports/movie_reconstruction/MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT.json' as const;
export const CONDITIONING_BACKEND_DECISION_MATRIX_PATH =
  'reports/movie_reconstruction/CONDITIONING_BACKEND_DECISION_MATRIX.json' as const;
export const CONDITIONING_IMPLEMENTATION_ROADMAP_PATH =
  'reports/movie_reconstruction/CONDITIONING_IMPLEMENTATION_ROADMAP.json' as const;

const BACKEND_OPTIONS = [
  'ControlNet',
  'Depth-conditioned diffusion',
  'Pose-conditioned diffusion',
  'Regional prompting',
  'IP-Adapter',
  'Video conditioning backend',
] as const;

type BackendOption = (typeof BACKEND_OPTIONS)[number];
type IntegrationComplexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const SELECTED_ARCHITECTURE = 'Hybrid Extension' as const;

const REJECTED_ARCHITECTURES = [
  'Text-Only Extension',
  'Single-ControlNet Only',
  'External API Gateway',
  'Video-First Monolith',
] as const;

const EXECUTION_FLAGS = {
  decision_only: true as const,
  implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface BackendOptionEvaluation {
  option: BackendOption;
  supported_conditioning_types: string[];
  required_inputs: string[];
  required_outputs: string[];
  integration_complexity: IntegrationComplexity;
  backend_dependency: string;
  current_app_compatibility: boolean;
  risk_level: RiskLevel;
}

export interface ConditioningBackendDecisionMatrixEntry {
  option: BackendOption;
  supports_layout: boolean;
  supports_depth: boolean;
  supports_pose: boolean;
  supports_object_identity: boolean;
  supports_environment_identity: boolean;
  supports_temporal: boolean;
  current_app_compatible: boolean;
  recommended_use: string;
}

export interface MovieReconstructionConditioningArchitectureDecisionReport {
  report_id: string;
  phase: typeof MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE;
  system_id: typeof MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_STATUS
    | 'MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_NOT_DECIDED';
  validation_passed: boolean;
  decision_only: true;
  conditioning_architecture_decided: boolean;
  conditioning_implemented: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  selected_architecture: typeof SELECTED_ARCHITECTURE;
  selected_architecture_defined: boolean;
  backend_stack_defined: boolean;
  migration_strategy_defined: boolean;
  current_app_compatible: false;
  requires_new_backend: true;
  rejected_architectures: string[];
  selection_reason: string;
  critical_risks: string[];
  migration_strategy: string;
  backend_stack: string[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface ConditioningBackendDecisionMatrixReport {
  report_id: string;
  phase: typeof MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE;
  system_id: typeof MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_SYSTEM_ID;
  generated_at: string;
  selected_architecture: typeof SELECTED_ARCHITECTURE;
  options: ConditioningBackendDecisionMatrixEntry[];
  option_evaluations: BackendOptionEvaluation[];
}

export interface ConditioningImplementationRoadmap {
  report_id: string;
  phase: typeof MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE;
  system_id: typeof MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_SYSTEM_ID;
  generated_at: string;
  conditioning_architecture_decided: true;
  conditioning_implemented: false;
  phase_order: string[];
  minimum_backend_stack: string[];
  deferred_backend_stack: string[];
  backend_stack: string[];
  next_phase: string;
  conditioning_ready: false;
  gpu_ready: false;
}

const BACKEND_OPTION_EVALUATIONS: BackendOptionEvaluation[] = [
  {
    option: 'ControlNet',
    supported_conditioning_types: ['layout', 'blocking_regional'],
    required_inputs: ['layout_map raster', 'SpatialLayoutMap JSON', 'text prompt bundle'],
    required_outputs: ['conditioned latent guidance signal', 'control weight audit record'],
    integration_complexity: 'HIGH',
    backend_dependency: 'Diffusion pipeline with ControlNet-seg / canny adapter hooks',
    current_app_compatibility: false,
    risk_level: 'MEDIUM',
  },
  {
    option: 'Depth-conditioned diffusion',
    supported_conditioning_types: ['depth'],
    required_inputs: ['depth_map raster', 'camera_path depth samples', 'frame aspect metadata'],
    required_outputs: ['depth-conditioned generation output', 'depth alignment score'],
    integration_complexity: 'HIGH',
    backend_dependency: 'ControlNet depth or MiDaS-conditioned diffusion module',
    current_app_compatibility: false,
    risk_level: 'MEDIUM',
  },
  {
    option: 'Pose-conditioned diffusion',
    supported_conditioning_types: ['pose'],
    required_inputs: ['pose_map raster', 'blocking_data', 'gaze_constraints'],
    required_outputs: ['pose-conditioned generation output', 'skeleton alignment score'],
    integration_complexity: 'VERY_HIGH',
    backend_dependency: 'OpenPose extraction + ControlNet OpenPose backend adapter',
    current_app_compatibility: false,
    risk_level: 'HIGH',
  },
  {
    option: 'Regional prompting',
    supported_conditioning_types: ['blocking_regional', 'environment_identity'],
    required_inputs: ['blocking_map masks', 'character_region_map', 'environment anchor masks'],
    required_outputs: ['region-weighted prompt tokens', 'mask application audit'],
    integration_complexity: 'MEDIUM',
    backend_dependency: 'Regional mask prompting layer compatible with diffusion backend',
    current_app_compatibility: false,
    risk_level: 'MEDIUM',
  },
  {
    option: 'IP-Adapter',
    supported_conditioning_types: ['object_identity', 'environment_identity'],
    required_inputs: ['reference portrait embeddings', 'identity_lock metadata', 'style reference images'],
    required_outputs: ['identity-conditioned embeddings', 'drift prevention score'],
    integration_complexity: 'HIGH',
    backend_dependency: 'IP-Adapter image encoder + injection adapter in diffusion UNet',
    current_app_compatibility: false,
    risk_level: 'MEDIUM',
  },
  {
    option: 'Video conditioning backend',
    supported_conditioning_types: ['video_temporal', 'layout', 'depth', 'pose'],
    required_inputs: [
      'per-frame conditioning stack',
      'shot timeline registry',
      'motion continuity metadata',
    ],
    required_outputs: ['temporally consistent video frames', 'continuity audit record'],
    integration_complexity: 'VERY_HIGH',
    backend_dependency: 'Video diffusion model with temporal attention and multi-control input',
    current_app_compatibility: false,
    risk_level: 'CRITICAL',
  },
];

const DECISION_MATRIX: ConditioningBackendDecisionMatrixEntry[] = [
  {
    option: 'ControlNet',
    supports_layout: true,
    supports_depth: false,
    supports_pose: false,
    supports_object_identity: false,
    supports_environment_identity: false,
    supports_temporal: false,
    current_app_compatible: false,
    recommended_use: 'Primary layout and blocking segmentation map conditioning in minimum stack',
  },
  {
    option: 'Depth-conditioned diffusion',
    supports_layout: false,
    supports_depth: true,
    supports_pose: false,
    supports_object_identity: false,
    supports_environment_identity: false,
    supports_temporal: false,
    current_app_compatible: false,
    recommended_use: 'Depth map conditioning paired with ControlNet multi-control stack',
  },
  {
    option: 'Pose-conditioned diffusion',
    supports_layout: false,
    supports_depth: false,
    supports_pose: true,
    supports_object_identity: false,
    supports_environment_identity: false,
    supports_temporal: false,
    current_app_compatible: false,
    recommended_use: 'Character pose fidelity layer in minimum stack after layout and depth',
  },
  {
    option: 'Regional prompting',
    supports_layout: false,
    supports_depth: false,
    supports_pose: false,
    supports_object_identity: false,
    supports_environment_identity: true,
    supports_temporal: false,
    current_app_compatible: false,
    recommended_use: 'Blocking and environment anchor regional masks; complements ControlNet layout',
  },
  {
    option: 'IP-Adapter',
    supports_layout: false,
    supports_depth: false,
    supports_pose: false,
    supports_object_identity: true,
    supports_environment_identity: true,
    supports_temporal: false,
    current_app_compatible: false,
    recommended_use: 'Object and environment identity preservation via reference image embeddings',
  },
  {
    option: 'Video conditioning backend',
    supports_layout: true,
    supports_depth: true,
    supports_pose: true,
    supports_object_identity: true,
    supports_environment_identity: true,
    supports_temporal: true,
    current_app_compatible: false,
    recommended_use: 'Deferred temporal continuity layer after image conditioning stack validated',
  },
];

const BACKEND_STACK = [
  'ControlNet (layout + multi-control orchestration)',
  'Depth-conditioned diffusion',
  'Pose-conditioned diffusion',
  'Regional prompting',
  'IP-Adapter',
] as const;

const MINIMUM_BACKEND_STACK = [...BACKEND_STACK];

const DEFERRED_BACKEND_STACK = ['Video conditioning backend'] as const;

const SELECTION_REASON =
  'Hybrid Extension preserves the existing text spatial compiler (ConditionedPromptBuilder) as the narrative and constraint layer while adding a parallel ControlNet-class map backend for layout, depth, and pose fidelity. IP-Adapter and regional prompting cover identity and environment anchors. Video conditioning is deferred until the image stack is GPU-validated. This aligns with audit findings (6 PARTIAL, 1 METADATA_ONLY), design requirements (D-016, D-017, TD-C003), and avoids text-only or single-control dead ends.';

const CRITICAL_RISKS = [
  'Image App text-only import contract requires parallel map-ingestion API extension',
  'Multi-control weight tuning may cause conditioning conflicts without orchestration layer',
  'Pose map extraction pipeline not yet implemented (METADATA_ONLY)',
  'GPU validation deferred; architecture decision not validated at runtime',
  'Video conditioning backend complexity may exceed initial team capacity if not deferred',
] as const;

const MIGRATION_STRATEGY =
  'Phase 1: Extend agent-stability-layer with conditioning request schema and map artifact exporters without modifying Image App ACTIVE imports. Phase 2: Add parallel conditioning-backend adapter service consuming numerical DNA + spatial graph bundles. Phase 3: Integrate minimum backend stack (ControlNet + depth + pose + regional + IP-Adapter) behind feature flag. Phase 4: Extend Image App import contract or add sibling map-ingestion endpoint. Phase 5: GPU validation phase. Phase 6: Integrate deferred video conditioning backend for temporal continuity.';

const PHASE_ORDER = [
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-004_CONDITIONING_MAP_EXPORT_V1',
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-005_CONDITIONING_BACKEND_ADAPTER_V1',
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-006_IMAGE_APP_MAP_INGESTION_V1',
  'PHASE-GPU-CONDITIONING-VALIDATION-001',
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-007_VIDEO_CONDITIONING_BACKEND_V1',
] as const;

const NEXT_PHASE = PHASE_ORDER[0];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function buildBackendOptionEvaluations(): BackendOptionEvaluation[] {
  return BACKEND_OPTION_EVALUATIONS.map((entry) => ({
    ...entry,
    supported_conditioning_types: [...entry.supported_conditioning_types],
    required_inputs: [...entry.required_inputs],
    required_outputs: [...entry.required_outputs],
  }));
}

export function buildConditioningBackendDecisionMatrix(): ConditioningBackendDecisionMatrixReport {
  return {
    report_id: `conditioning_backend_decision_matrix_${Date.now().toString(36)}`,
    phase: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE,
    system_id: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    selected_architecture: SELECTED_ARCHITECTURE,
    options: DECISION_MATRIX.map((entry) => ({ ...entry })),
    option_evaluations: buildBackendOptionEvaluations(),
  };
}

export function buildConditioningImplementationRoadmap(): ConditioningImplementationRoadmap {
  return {
    report_id: `conditioning_implementation_roadmap_${Date.now().toString(36)}`,
    phase: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE,
    system_id: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    conditioning_architecture_decided: true,
    conditioning_implemented: false,
    phase_order: [...PHASE_ORDER],
    minimum_backend_stack: [...MINIMUM_BACKEND_STACK],
    deferred_backend_stack: [...DEFERRED_BACKEND_STACK],
    backend_stack: [...BACKEND_STACK],
    next_phase: NEXT_PHASE,
    conditioning_ready: false,
    gpu_ready: false,
  };
}

export function runMovieReconstructionConditioningArchitectureDecision(
  projectRoot?: string
): MovieReconstructionConditioningArchitectureDecisionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MovieReconstructionConditioningArchitectureDecisionReport['issues'] = [];

  if (!fs.existsSync(path.join(root, MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_REGISTRY_PATH))) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing ${MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH))) {
    issues.push({
      code: 'DESIGN_PREREQUISITE',
      message: `Missing prerequisite design report ${MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const decisionMatrix = buildConditioningBackendDecisionMatrix();
  const roadmap = buildConditioningImplementationRoadmap();

  const selected_architecture_defined = SELECTED_ARCHITECTURE.length > 0;
  const backend_stack_defined = roadmap.backend_stack.length > 0;
  const migration_strategy_defined = MIGRATION_STRATEGY.length > 0;
  const decision_matrix_exists = decisionMatrix.options.length === 6;
  const implementation_roadmap_exists = roadmap.phase_order.length > 0;

  if (!selected_architecture_defined) {
    issues.push({
      code: 'SELECTED_ARCHITECTURE',
      message: 'selected_architecture must be defined',
      severity: 'error',
    });
  }
  if (!backend_stack_defined) {
    issues.push({
      code: 'BACKEND_STACK',
      message: 'backend_stack must be defined',
      severity: 'error',
    });
  }
  if (!migration_strategy_defined) {
    issues.push({
      code: 'MIGRATION_STRATEGY',
      message: 'migration_strategy must be defined',
      severity: 'error',
    });
  }
  if (!decision_matrix_exists) {
    issues.push({
      code: 'DECISION_MATRIX',
      message: 'decision matrix must cover all 6 backend options',
      severity: 'error',
    });
  }
  if (!implementation_roadmap_exists) {
    issues.push({
      code: 'ROADMAP',
      message: 'implementation roadmap must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    selected_architecture_defined &&
    backend_stack_defined &&
    migration_strategy_defined &&
    decision_matrix_exists &&
    implementation_roadmap_exists &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieReconstructionConditioningArchitectureDecisionReport = {
    report_id: `movie_reconstruction_conditioning_architecture_${Date.now().toString(36)}`,
    phase: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE,
    system_id: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PASS_VERDICT
      : MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_FAIL_VERDICT,
    status: validation_passed
      ? MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_STATUS
      : 'MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_NOT_DECIDED',
    validation_passed,
    decision_only: true,
    conditioning_architecture_decided: validation_passed,
    conditioning_implemented: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    selected_architecture: SELECTED_ARCHITECTURE,
    selected_architecture_defined,
    backend_stack_defined,
    migration_strategy_defined,
    current_app_compatible: false,
    requires_new_backend: true,
    rejected_architectures: [...REJECTED_ARCHITECTURES],
    selection_reason: SELECTION_REASON,
    critical_risks: [...CRITICAL_RISKS],
    migration_strategy: MIGRATION_STRATEGY,
    backend_stack: [...BACKEND_STACK],
    checks: {
      selected_architecture_defined,
      backend_stack_defined,
      migration_strategy_defined,
      decision_matrix_exists,
      implementation_roadmap_exists,
      current_app_compatible: false,
      requires_new_backend: true,
      all_options_evaluated: decisionMatrix.option_evaluations.length === 6,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT_PATH, report);
  writeJson(root, CONDITIONING_BACKEND_DECISION_MATRIX_PATH, decisionMatrix);
  writeJson(root, CONDITIONING_IMPLEMENTATION_ROADMAP_PATH, roadmap);

  return report;
}

export function writeMovieReconstructionConditioningArchitectureDecisionReport(
  projectRoot?: string
): MovieReconstructionConditioningArchitectureDecisionReport {
  return runMovieReconstructionConditioningArchitectureDecision(projectRoot);
}
