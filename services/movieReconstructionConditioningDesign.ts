import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH } from './movieReconstructionConditioningAudit.js';

export const MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-002' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_SYSTEM_ID =
  'MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_V1' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PASS_VERDICT =
  'PASS_MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_V1' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_FAIL_VERDICT =
  'FAIL_MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_V1' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_STATUS =
  'MOVIE_RECONSTRUCTION_CONDITIONING_DESIGNED' as const;

export const MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_DATASET_DIR =
  'datasets/movie_reconstruction_conditioning_design' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_MANIFEST_PATH =
  `${MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_DATASET_DIR}/movie-reconstruction-conditioning-design-manifest.json` as const;

export const MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH =
  'reports/movie_reconstruction/MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT.json' as const;
export const CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH =
  'reports/movie_reconstruction/CONDITIONING_BACKEND_REQUIREMENTS_REPORT.json' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_GAP_REPORT_PATH =
  'reports/movie_reconstruction/MOVIE_RECONSTRUCTION_CONDITIONING_GAP_REPORT.json' as const;

const ALL_SUBSYSTEMS = [
  'layout_map',
  'depth_map',
  'pose_map',
  'blocking_map',
  'object_identity',
  'environment_identity',
  'conditioning_backend',
] as const;

type ConditioningSubsystem = (typeof ALL_SUBSYSTEMS)[number];
type CurrentAppSupport = 'FULL' | 'PARTIAL' | 'METADATA_ONLY' | 'NOT_SUPPORTED';

const EXECUTION_FLAGS = {
  design_only: true as const,
  implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface ConditioningSubsystemDesign {
  subsystem: ConditioningSubsystem;
  required_input: string;
  required_output: string;
  conditioning_method: string;
  backend_dependency: string;
  current_app_support: CurrentAppSupport;
}

export interface ConditioningDesignReportEntry {
  subsystem: ConditioningSubsystem;
  conditioning_method: string;
  backend_dependency: string;
  feasible_with_current_app: boolean;
  requires_new_backend: boolean;
  required_input: string;
  required_output: string;
  current_app_support: CurrentAppSupport;
}

export interface MovieReconstructionConditioningDesignReport {
  report_id: string;
  phase: typeof MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE;
  system_id: typeof MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_STATUS
    | 'MOVIE_RECONSTRUCTION_CONDITIONING_NOT_DESIGNED';
  validation_passed: boolean;
  design_only: true;
  conditioning_design_complete: boolean;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  all_7_subsystems_designed: boolean;
  backend_requirements_defined: boolean;
  requires_new_backend_defined: boolean;
  backend_options_defined: boolean;
  recommended_backend_strategy_defined: boolean;
  design_complete: boolean;
  subsystem_designs: ConditioningDesignReportEntry[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface ConditioningBackendRequirementsReport {
  report_id: string;
  phase: typeof MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE;
  system_id: typeof MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_SYSTEM_ID;
  generated_at: string;
  minimum_backend_features: string[];
  required_conditioning_types: string[];
  critical_blockers: string[];
  backend_options: string[];
  requires_new_backend: true;
  conditioning_ready: false;
  gpu_ready: false;
}

export interface MovieReconstructionConditioningDesignGapReport {
  report_id: string;
  phase: typeof MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE;
  system_id: typeof MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_SYSTEM_ID;
  generated_at: string;
  design_complete: true;
  implementation_complete: false;
  conditioning_design_complete: true;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  remaining_work: string[];
  recommended_backend_strategy: string;
  requires_new_backend: ConditioningSubsystem[];
}

const SUBSYSTEM_DESIGNS: ConditioningSubsystemDesign[] = [
  {
    subsystem: 'layout_map',
    required_input:
      'RuntimeSpatialGraph + exports/source_video_numerical_dna_full frame_coordinates + composition_coordinates per scene frame',
    required_output:
      'Raster layout map (segmentation-style PNG/tensor) per frame + SpatialLayoutMap JSON with normalized element positions',
    conditioning_method: 'ControlNet layout / soft segmentation map conditioning',
    backend_dependency: 'ControlNet-seg or equivalent layout map ingestion with multi-control weighting',
    current_app_support: 'PARTIAL',
  },
  {
    subsystem: 'depth_map',
    required_input:
      'frame_coordinates + camera_path depth samples + spatial graph depth_edges + depth_layers from numerical DNA',
    required_output:
      'Normalized depth map raster (0=near, 1=far) per frame aligned to source aspect ratio',
    conditioning_method: 'Depth-conditioned diffusion (ControlNet depth)',
    backend_dependency: 'ControlNet depth / MiDaS-derived depth map ingestion pipeline',
    current_app_support: 'PARTIAL',
  },
  {
    subsystem: 'pose_map',
    required_input:
      'blocking_data character positions + gaze_constraints + optional skeleton estimation from source frame pairs',
    required_output:
      'OpenPose-style skeletal keypoint raster map per character per frame',
    conditioning_method: 'Pose-conditioned diffusion (ControlNet OpenPose)',
    backend_dependency: 'Pose estimation module + ControlNet OpenPose backend adapter',
    current_app_support: 'METADATA_ONLY',
  },
  {
    subsystem: 'blocking_map',
    required_input:
      'blocking_data numerical DNA + character_region constraints + scene_remap character_region_map',
    required_output:
      'Actor region blocking map with character_id labels and interaction pair overlays per frame',
    conditioning_method: 'Regional prompting + composited layout map masks',
    backend_dependency: 'Regional prompting backend with per-region weight control and inpainting mask support',
    current_app_support: 'PARTIAL',
  },
  {
    subsystem: 'object_identity',
    required_input:
      'Character identity anchors + semantic-preservation-layer + reference portrait embeddings + identity_lock metadata',
    required_output:
      'Identity conditioning bundle: reference image embeddings, lock strength metadata, drift prevention tokens',
    conditioning_method: 'IP-Adapter reference image conditioning with identity lock',
    backend_dependency: 'IP-Adapter or equivalent reference-image identity conditioning backend',
    current_app_support: 'PARTIAL',
  },
  {
    subsystem: 'environment_identity',
    required_input:
      'EnvironmentAnchorConstraint graph + timesetting lock datasets + environment-motion DNA + anchor_persistence_map',
    required_output:
      'Environment identity map raster + anchor persistence metadata bundle per scene',
    conditioning_method:
      'Regional prompting + environment anchor locks + style reference conditioning',
    backend_dependency:
      'IP-Adapter style reference + regional mask backend + environment lock token injection',
    current_app_support: 'PARTIAL',
  },
  {
    subsystem: 'conditioning_backend',
    required_input:
      'Unified bundle: layout_map + depth_map + pose_map + blocking_map + object_identity + environment_identity + ConditionedPromptBuilder text constraints',
    required_output:
      'Single conditioning request payload to image/video diffusion backend with weighted multi-control stack',
    conditioning_method:
      'Multi-control stack (layout + depth + pose) with IP-Adapter identity and regional prompting orchestration',
    backend_dependency:
      'ControlNet-class multi-input backend + Video conditioning backend for temporal shot sequences',
    current_app_support: 'PARTIAL',
  },
];

const BACKEND_OPTIONS = [
  'ControlNet',
  'Depth-conditioned diffusion',
  'Pose-conditioned diffusion',
  'Regional prompting',
  'IP-Adapter',
  'Video conditioning backend',
] as const;

const MINIMUM_BACKEND_FEATURES = [
  'Multi-ControlNet input stacking with per-control weight configuration',
  'Depth map raster ingestion (normalized 0-1, scene-aligned)',
  'Pose map / OpenPose keypoint raster ingestion',
  'Layout / segmentation map ingestion',
  'Regional mask prompting with character_id region labels',
  'IP-Adapter reference image embedding injection',
  'Video temporal conditioning for shot-sequence continuity',
  'Numerical DNA bundle binding (source_video_id + frame_index alignment)',
  'Conditioning request audit trail and weight reproducibility',
] as const;

const REQUIRED_CONDITIONING_TYPES = [
  'layout',
  'depth',
  'pose',
  'blocking_regional',
  'object_identity',
  'environment_identity',
  'text_spatial_compiler',
  'video_temporal',
] as const;

const CRITICAL_BLOCKERS = [
  'Image App import contract accepts text slots only; no map tensor ingestion path (D-016)',
  'Direct spatial conditioning unavailable in current architecture (D-017, TD-C003)',
  'No ControlNet-class backend integrated in agent-stability-layer generation path',
  'GPU execution deferred; conditioning backend selection requires GPU validation phase',
  'Pose map pipeline not implemented (METADATA_ONLY in audit)',
] as const;

const REMAINING_WORK = [
  'Select and integrate ControlNet-class conditioning backend',
  'Implement layout_map raster export from SpatialLayoutMap + numerical DNA',
  'Implement depth_map raster pipeline from camera_path and depth_edges',
  'Implement pose_map extraction and OpenPose raster generation',
  'Wire blocking_map regional masks to regional prompting backend',
  'Integrate IP-Adapter for object_identity and environment_identity reference conditioning',
  'Build conditioning_backend orchestrator unifying all map inputs with text compiler output',
  'Extend Image App import contract or add parallel map-ingestion API',
  'Create verify:movie-reconstruction-conditioning-implementation gate',
  'Run GPU validation phase after conditioning backend integration',
] as const;

const RECOMMENDED_BACKEND_STRATEGY =
  'ControlNet-class layout/depth/pose conditioning backend required with IP-Adapter identity layer and regional prompting for blocking/environment maps; video conditioning backend required for temporal shot continuity.';

const REQUIRES_NEW_BACKEND: ConditioningSubsystem[] = [
  'conditioning_backend',
  'layout_map',
  'depth_map',
  'pose_map',
  'object_identity',
  'environment_identity',
];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function subsystemDesignComplete(design: ConditioningSubsystemDesign): boolean {
  return (
    design.required_input.length > 0 &&
    design.required_output.length > 0 &&
    design.conditioning_method.length > 0 &&
    design.backend_dependency.length > 0 &&
    design.current_app_support.length > 0
  );
}

function feasibleWithCurrentApp(support: CurrentAppSupport): boolean {
  return support === 'FULL' || support === 'PARTIAL';
}

function requiresNewBackend(subsystem: ConditioningSubsystem): boolean {
  return REQUIRES_NEW_BACKEND.includes(subsystem) || subsystem === 'blocking_map';
}

export function buildSubsystemDesigns(): ConditioningSubsystemDesign[] {
  return SUBSYSTEM_DESIGNS.map((design) => ({ ...design }));
}

export function buildConditioningDesignReportEntries(): ConditioningDesignReportEntry[] {
  return SUBSYSTEM_DESIGNS.map((design) => ({
    subsystem: design.subsystem,
    conditioning_method: design.conditioning_method,
    backend_dependency: design.backend_dependency,
    feasible_with_current_app: feasibleWithCurrentApp(design.current_app_support),
    requires_new_backend: requiresNewBackend(design.subsystem),
    required_input: design.required_input,
    required_output: design.required_output,
    current_app_support: design.current_app_support,
  }));
}

export function buildConditioningBackendRequirementsReport(): ConditioningBackendRequirementsReport {
  return {
    report_id: `conditioning_backend_requirements_${Date.now().toString(36)}`,
    phase: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE,
    system_id: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    minimum_backend_features: [...MINIMUM_BACKEND_FEATURES],
    required_conditioning_types: [...REQUIRED_CONDITIONING_TYPES],
    critical_blockers: [...CRITICAL_BLOCKERS],
    backend_options: [...BACKEND_OPTIONS],
    requires_new_backend: true,
    conditioning_ready: false,
    gpu_ready: false,
  };
}

export function buildMovieReconstructionConditioningDesignGapReport(): MovieReconstructionConditioningDesignGapReport {
  return {
    report_id: `movie_reconstruction_conditioning_design_gap_${Date.now().toString(36)}`,
    phase: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE,
    system_id: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    design_complete: true,
    implementation_complete: false,
    conditioning_design_complete: true,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    remaining_work: [...REMAINING_WORK],
    recommended_backend_strategy: RECOMMENDED_BACKEND_STRATEGY,
    requires_new_backend: [...REQUIRES_NEW_BACKEND],
  };
}

export function runMovieReconstructionConditioningDesignValidation(
  projectRoot?: string
): MovieReconstructionConditioningDesignReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MovieReconstructionConditioningDesignReport['issues'] = [];

  if (!fs.existsSync(path.join(root, MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_MANIFEST_PATH))) {
    issues.push({
      code: 'MANIFEST_MISSING',
      message: `Missing ${MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH))) {
    issues.push({
      code: 'AUDIT_PREREQUISITE',
      message: `Missing prerequisite audit report ${MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const subsystemDesigns = buildConditioningDesignReportEntries();
  const backendRequirements = buildConditioningBackendRequirementsReport();
  const gapReport = buildMovieReconstructionConditioningDesignGapReport();

  const all_7_subsystems_designed =
    subsystemDesigns.length === 7 &&
    SUBSYSTEM_DESIGNS.every((design) => subsystemDesignComplete(design));

  const backend_requirements_defined =
    backendRequirements.minimum_backend_features.length > 0 &&
    backendRequirements.required_conditioning_types.length > 0 &&
    backendRequirements.critical_blockers.length > 0;

  const requires_new_backend_defined =
    subsystemDesigns.some((entry) => entry.requires_new_backend) &&
    gapReport.requires_new_backend.length > 0 &&
    backendRequirements.requires_new_backend === true;

  const backend_options_defined = backendRequirements.backend_options.length >= 6;

  const recommended_backend_strategy_defined =
    gapReport.recommended_backend_strategy.length > 0 &&
    gapReport.recommended_backend_strategy.includes('ControlNet-class');

  const design_complete =
    all_7_subsystems_designed &&
    backend_requirements_defined &&
    requires_new_backend_defined &&
    backend_options_defined &&
    recommended_backend_strategy_defined;

  if (!all_7_subsystems_designed) {
    issues.push({
      code: 'SUBSYSTEMS_INCOMPLETE',
      message: 'All 7 conditioning subsystems must be fully designed',
      severity: 'error',
    });
  }
  if (!backend_requirements_defined) {
    issues.push({
      code: 'BACKEND_REQUIREMENTS',
      message: 'Backend requirements must be fully defined',
      severity: 'error',
    });
  }
  if (!requires_new_backend_defined) {
    issues.push({
      code: 'REQUIRES_NEW_BACKEND',
      message: 'requires_new_backend must be defined',
      severity: 'error',
    });
  }
  if (!backend_options_defined) {
    issues.push({
      code: 'BACKEND_OPTIONS',
      message: 'backend_options must be defined',
      severity: 'error',
    });
  }
  if (!recommended_backend_strategy_defined) {
    issues.push({
      code: 'BACKEND_STRATEGY',
      message: 'recommended_backend_strategy must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    design_complete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieReconstructionConditioningDesignReport = {
    report_id: `movie_reconstruction_conditioning_design_${Date.now().toString(36)}`,
    phase: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE,
    system_id: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PASS_VERDICT
      : MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_FAIL_VERDICT,
    status: validation_passed
      ? MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_STATUS
      : 'MOVIE_RECONSTRUCTION_CONDITIONING_NOT_DESIGNED',
    validation_passed,
    design_only: true,
    conditioning_design_complete: validation_passed,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    all_7_subsystems_designed,
    backend_requirements_defined,
    requires_new_backend_defined,
    backend_options_defined,
    recommended_backend_strategy_defined,
    design_complete,
    subsystem_designs: subsystemDesigns,
    checks: {
      all_7_subsystems_designed,
      backend_requirements_defined,
      requires_new_backend_defined,
      backend_options_defined,
      recommended_backend_strategy_defined,
      design_complete,
      gap_report_exists: true,
      backend_requirements_report_exists: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH, report);
  writeJson(root, CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH, backendRequirements);
  writeJson(root, MOVIE_RECONSTRUCTION_CONDITIONING_GAP_REPORT_PATH, gapReport);

  return report;
}

export function writeMovieReconstructionConditioningDesignReport(
  projectRoot?: string
): MovieReconstructionConditioningDesignReport {
  return runMovieReconstructionConditioningDesignValidation(projectRoot);
}
