import fs from 'node:fs';
import path from 'node:path';
import { loadMovieAnalysisCoordinateExtractionPlan } from './movieAnalysisCoordinateExtractionDesign.js';
import { loadMovieAnalysisExecutionReadinessPlan } from './movieAnalysisExecutionReadinessDesign.js';
import {
  FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
  type MovieAnalysisFinalRuntimeBundlePlan,
  loadMovieAnalysisFinalRuntimeBundlePlan,
} from './movieAnalysisFinalRuntimeBundleDesign.js';
import { loadMovieAnalysisFrameSamplingPlan } from './movieAnalysisFrameSamplingDesign.js';
import { loadMovieAnalysisGenerationBlueprintPlan } from './movieAnalysisGenerationBlueprintDesign.js';
import { loadMovieAnalysisGenerationPackagePlan } from './movieAnalysisGenerationPackageDesign.js';
import { loadMovieAnalysisGonegiStateMappingPlan } from './movieAnalysisGonegiStateMappingDesign.js';
import { loadMovieAnalysisKeyframePreparationPlan } from './movieAnalysisKeyframePreparationDesign.js';
import { loadMovieAnalysisMotionPlanningPlan } from './movieAnalysisMotionPlanningDesign.js';
import { loadMovieAnalysisRuntimePackagePlan } from './movieAnalysisRuntimePackageDesign.js';
import { loadMovieAnalysisSceneDetectionPlan } from './movieAnalysisSceneDetectionDesign.js';
import { loadMovieAnalysisSequenceAssemblyPlan } from './movieAnalysisSequenceAssemblyDesign.js';
import { loadMovieAnalysisTemporalFlowPlan } from './movieAnalysisTemporalFlowDesign.js';
import { loadMovieAnalysisVideoBlueprintPlan } from './movieAnalysisVideoBlueprintDesign.js';
import { loadMovieAnalysisVideoStateCompilationPlan } from './movieAnalysisVideoStateCompilationDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MASTER_PACKAGE_PHASE =
  'PHASE-SOURCE-VIDEO-039-MOVIE_ANALYSIS_MASTER_PACKAGE_DESIGN_V1' as const;
export const MASTER_PACKAGE_SCHEMA_PATH =
  'datasets/movie_analysis/master_package/movie-analysis-master-package.schema.json' as const;
export const MASTER_PACKAGE_REGISTRY_PATH =
  'datasets/movie_analysis/master_package/movie-analysis-master-package-registry.json' as const;
export const MASTER_PACKAGE_PLANS_DIR =
  'datasets/movie_analysis/master_package/plans' as const;

export type PackageTraceEntry = {
  step: number;
  phase: string;
  plan_type: string;
  plan_id: string;
  status: 'designed';
};

export type MasterPackageExecutionFlags = {
  planning_only: true;
  master_package_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisMasterPackagePlan = {
  master_package_id: string;
  phase: typeof MASTER_PACKAGE_PHASE;
  source_video_id: string;
  analysis_plan_id: string;
  dry_run_id: string;
  frame_sampling_id: string;
  scene_detection_id: string;
  coordinate_extraction_id: string;
  gonegi_state_mapping_id: string;
  video_state_compilation_id: string;
  keyframe_preparation_id: string;
  motion_plan_id: string;
  temporal_flow_id: string;
  sequence_assembly_id: string;
  video_blueprint_id: string;
  runtime_package_id: string;
  generation_package_id: string;
  generation_blueprint_id: string;
  execution_readiness_id: string;
  final_runtime_bundle_id: string;
  package_trace: PackageTraceEntry[];
  readiness_summary: {
    design_only: true;
    master_package_only: true;
    chain_complete: true;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_ready: false;
    purpose: 'movie_analysis_master_package_index';
  };
  safety_summary: {
    planning_only: true;
    master_package_only: true;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    no_execution: true;
    no_rendering: true;
    no_inference: true;
  };
  execution_flags: MasterPackageExecutionFlags;
  designed_at: string;
};

export const SEED_MASTER_PACKAGE_SPECS = Object.freeze([
  {
    master_package_id: 'master_package_ghibli_01_v1',
    final_runtime_bundle_id: 'final_runtime_bundle_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
  },
  {
    master_package_id: 'master_package_shinkai_01_v1',
    final_runtime_bundle_id: 'final_runtime_bundle_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
  },
  {
    master_package_id: 'master_package_little_women_01_v1',
    final_runtime_bundle_id: 'final_runtime_bundle_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
  },
  {
    master_package_id: 'master_package_mori_01_v1',
    final_runtime_bundle_id: 'final_runtime_bundle_mori_01_v1',
    source_video_id: 'MORI_01',
  },
] as const);

const EXECUTION_FLAGS: MasterPackageExecutionFlags = {
  planning_only: true,
  master_package_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

export const TRACE_DEFINITIONS = [
  {
    phase: 'PHASE-SOURCE-VIDEO-022-MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1',
    plan_type: 'analysis_plan',
    idKey: 'analysis_plan_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-023-MOVIE_ANALYSIS_DRY_RUN_PLANNER_V1',
    plan_type: 'dry_run',
    idKey: 'dry_run_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-024-MOVIE_ANALYSIS_FRAME_SAMPLING_DESIGN_V1',
    plan_type: 'frame_sampling',
    idKey: 'frame_sampling_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-025-MOVIE_ANALYSIS_SCENE_DETECTION_DESIGN_V1',
    plan_type: 'scene_detection',
    idKey: 'scene_detection_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-026-MOVIE_ANALYSIS_COORDINATE_EXTRACTION_DESIGN_V1',
    plan_type: 'coordinate_extraction',
    idKey: 'coordinate_extraction_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-027-MOVIE_ANALYSIS_GONEGI_STATE_MAPPING_DESIGN_V1',
    plan_type: 'gonegi_state_mapping',
    idKey: 'gonegi_state_mapping_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-028-MOVIE_ANALYSIS_VIDEO_STATE_COMPILATION_DESIGN_V1',
    plan_type: 'video_state_compilation',
    idKey: 'video_state_compilation_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-029-MOVIE_ANALYSIS_KEYFRAME_PREPARATION_DESIGN_V1',
    plan_type: 'keyframe_preparation',
    idKey: 'keyframe_preparation_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-030-MOVIE_ANALYSIS_MOTION_PLANNING_DESIGN_V1',
    plan_type: 'motion_plan',
    idKey: 'motion_plan_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-031-MOVIE_ANALYSIS_TEMPORAL_FLOW_DESIGN_V1',
    plan_type: 'temporal_flow',
    idKey: 'temporal_flow_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-032-MOVIE_ANALYSIS_SEQUENCE_ASSEMBLY_DESIGN_V1',
    plan_type: 'sequence_assembly',
    idKey: 'sequence_assembly_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-033-MOVIE_ANALYSIS_VIDEO_BLUEPRINT_DESIGN_V1',
    plan_type: 'video_blueprint',
    idKey: 'video_blueprint_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-034-MOVIE_ANALYSIS_RUNTIME_PACKAGE_DESIGN_V1',
    plan_type: 'runtime_package',
    idKey: 'runtime_package_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-035-MOVIE_ANALYSIS_GENERATION_PACKAGE_DESIGN_V1',
    plan_type: 'generation_package',
    idKey: 'generation_package_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-036-MOVIE_ANALYSIS_GENERATION_BLUEPRINT_DESIGN_V1',
    plan_type: 'generation_blueprint',
    idKey: 'generation_blueprint_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-037-MOVIE_ANALYSIS_EXECUTION_READINESS_DESIGN_V1',
    plan_type: 'execution_readiness',
    idKey: 'execution_readiness_id' as const,
  },
  {
    phase: 'PHASE-SOURCE-VIDEO-038-MOVIE_ANALYSIS_FINAL_RUNTIME_BUNDLE_DESIGN_V1',
    plan_type: 'final_runtime_bundle',
    idKey: 'final_runtime_bundle_id' as const,
  },
] as const;

type ResolvedChainIds = Pick<
  MovieAnalysisMasterPackagePlan,
  | 'analysis_plan_id'
  | 'dry_run_id'
  | 'frame_sampling_id'
  | 'scene_detection_id'
  | 'coordinate_extraction_id'
  | 'gonegi_state_mapping_id'
  | 'video_state_compilation_id'
  | 'keyframe_preparation_id'
  | 'motion_plan_id'
  | 'temporal_flow_id'
  | 'sequence_assembly_id'
  | 'video_blueprint_id'
  | 'runtime_package_id'
  | 'generation_package_id'
  | 'generation_blueprint_id'
  | 'execution_readiness_id'
  | 'final_runtime_bundle_id'
>;

function resolveChainIds(
  root: string,
  bundlePlan: MovieAnalysisFinalRuntimeBundlePlan
): ResolvedChainIds {
  const executionReadiness = loadMovieAnalysisExecutionReadinessPlan(
    root,
    bundlePlan.execution_readiness_id
  );
  if (!executionReadiness) {
    throw new Error(`Missing execution readiness plan: ${bundlePlan.execution_readiness_id}`);
  }

  const generationBlueprint = loadMovieAnalysisGenerationBlueprintPlan(
    root,
    executionReadiness.generation_blueprint_id
  );
  if (!generationBlueprint) {
    throw new Error(`Missing generation blueprint plan: ${executionReadiness.generation_blueprint_id}`);
  }

  const generationPackage = loadMovieAnalysisGenerationPackagePlan(
    root,
    generationBlueprint.generation_package_id
  );
  if (!generationPackage) {
    throw new Error(`Missing generation package plan: ${generationBlueprint.generation_package_id}`);
  }

  const runtimePackage = loadMovieAnalysisRuntimePackagePlan(
    root,
    generationPackage.runtime_package_id
  );
  if (!runtimePackage) {
    throw new Error(`Missing runtime package plan: ${generationPackage.runtime_package_id}`);
  }

  const videoBlueprint = loadMovieAnalysisVideoBlueprintPlan(root, runtimePackage.video_blueprint_id);
  if (!videoBlueprint) {
    throw new Error(`Missing video blueprint plan: ${runtimePackage.video_blueprint_id}`);
  }

  const sequenceAssembly = loadMovieAnalysisSequenceAssemblyPlan(
    root,
    videoBlueprint.sequence_assembly_id
  );
  if (!sequenceAssembly) {
    throw new Error(`Missing sequence assembly plan: ${videoBlueprint.sequence_assembly_id}`);
  }

  const temporalFlow = loadMovieAnalysisTemporalFlowPlan(root, sequenceAssembly.temporal_flow_id);
  if (!temporalFlow) {
    throw new Error(`Missing temporal flow plan: ${sequenceAssembly.temporal_flow_id}`);
  }

  const motionPlan = loadMovieAnalysisMotionPlanningPlan(root, temporalFlow.motion_plan_id);
  if (!motionPlan) {
    throw new Error(`Missing motion plan: ${temporalFlow.motion_plan_id}`);
  }

  const keyframePreparation = loadMovieAnalysisKeyframePreparationPlan(
    root,
    motionPlan.keyframe_preparation_id
  );
  if (!keyframePreparation) {
    throw new Error(`Missing keyframe preparation plan: ${motionPlan.keyframe_preparation_id}`);
  }

  const videoStateCompilation = loadMovieAnalysisVideoStateCompilationPlan(
    root,
    keyframePreparation.video_state_compilation_id
  );
  if (!videoStateCompilation) {
    throw new Error(
      `Missing video state compilation plan: ${keyframePreparation.video_state_compilation_id}`
    );
  }

  const gonegiMapping = loadMovieAnalysisGonegiStateMappingPlan(
    root,
    videoStateCompilation.gonegi_state_mapping_id
  );
  if (!gonegiMapping) {
    throw new Error(
      `Missing gonegi state mapping plan: ${videoStateCompilation.gonegi_state_mapping_id}`
    );
  }

  const coordinateExtraction = loadMovieAnalysisCoordinateExtractionPlan(
    root,
    gonegiMapping.coordinate_extraction_id
  );
  if (!coordinateExtraction) {
    throw new Error(
      `Missing coordinate extraction plan: ${gonegiMapping.coordinate_extraction_id}`
    );
  }

  const sceneDetection = loadMovieAnalysisSceneDetectionPlan(
    root,
    coordinateExtraction.scene_detection_id
  );
  if (!sceneDetection) {
    throw new Error(`Missing scene detection plan: ${coordinateExtraction.scene_detection_id}`);
  }

  const frameSampling = loadMovieAnalysisFrameSamplingPlan(root, sceneDetection.sampling_plan_id);
  if (!frameSampling) {
    throw new Error(`Missing frame sampling plan: ${sceneDetection.sampling_plan_id}`);
  }

  return {
    analysis_plan_id: frameSampling.analysis_plan_id,
    dry_run_id: frameSampling.dry_run_id,
    frame_sampling_id: frameSampling.sampling_plan_id,
    scene_detection_id: sceneDetection.scene_detection_id,
    coordinate_extraction_id: coordinateExtraction.coordinate_extraction_id,
    gonegi_state_mapping_id: gonegiMapping.gonegi_state_mapping_id,
    video_state_compilation_id: videoStateCompilation.video_state_compilation_id,
    keyframe_preparation_id: keyframePreparation.keyframe_preparation_id,
    motion_plan_id: motionPlan.motion_plan_id,
    temporal_flow_id: temporalFlow.temporal_flow_id,
    sequence_assembly_id: sequenceAssembly.sequence_assembly_id,
    video_blueprint_id: videoBlueprint.video_blueprint_id,
    runtime_package_id: runtimePackage.runtime_package_id,
    generation_package_id: generationPackage.generation_package_id,
    generation_blueprint_id: generationBlueprint.generation_blueprint_id,
    execution_readiness_id: executionReadiness.execution_readiness_id,
    final_runtime_bundle_id: bundlePlan.final_runtime_bundle_id,
  };
}

function buildPackageTrace(ids: ResolvedChainIds): PackageTraceEntry[] {
  return TRACE_DEFINITIONS.map((definition, index) => ({
    step: index + 1,
    phase: definition.phase,
    plan_type: definition.plan_type,
    plan_id: ids[definition.idKey],
    status: 'designed' as const,
  }));
}

function buildMasterPackagePlan(
  spec: (typeof SEED_MASTER_PACKAGE_SPECS)[number],
  bundlePlan: MovieAnalysisFinalRuntimeBundlePlan,
  root: string
): MovieAnalysisMasterPackagePlan {
  if (bundlePlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Final runtime bundle source mismatch for ${spec.final_runtime_bundle_id}`);
  }

  const chainIds = resolveChainIds(root, bundlePlan);

  return {
    master_package_id: spec.master_package_id,
    phase: MASTER_PACKAGE_PHASE,
    source_video_id: bundlePlan.source_video_id,
    ...chainIds,
    package_trace: buildPackageTrace(chainIds),
    readiness_summary: {
      design_only: true,
      master_package_only: true,
      chain_complete: true,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_ready: false,
      purpose: 'movie_analysis_master_package_index',
    },
    safety_summary: {
      planning_only: true,
      master_package_only: true,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      no_inference: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

type FinalRuntimeBundleRegistry = {
  final_runtime_bundle_plans: Array<{
    final_runtime_bundle_id: string;
    source_video_id: string;
  }>;
};

function loadFinalRuntimeBundleRegistry(projectRoot: string): FinalRuntimeBundleRegistry | null {
  const abs = path.join(projectRoot, FINAL_RUNTIME_BUNDLE_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as FinalRuntimeBundleRegistry;
}

export function buildSeedMasterPackagePlans(projectRoot?: string): MovieAnalysisMasterPackagePlan[] {
  const root = resolveProjectRoot(projectRoot);
  const bundleRegistry = loadFinalRuntimeBundleRegistry(root);
  if (!bundleRegistry) {
    throw new Error(`Missing final runtime bundle registry: ${FINAL_RUNTIME_BUNDLE_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisMasterPackagePlan[] = [];

  for (const spec of SEED_MASTER_PACKAGE_SPECS) {
    const registryEntry = bundleRegistry.final_runtime_bundle_plans.find(
      (p) => p.final_runtime_bundle_id === spec.final_runtime_bundle_id
    );
    if (!registryEntry) {
      throw new Error(`Final runtime bundle plan not in registry: ${spec.final_runtime_bundle_id}`);
    }

    const bundlePlan = loadMovieAnalysisFinalRuntimeBundlePlan(root, spec.final_runtime_bundle_id);
    if (!bundlePlan) {
      throw new Error(`Missing final runtime bundle plan: ${spec.final_runtime_bundle_id}`);
    }

    if (bundlePlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Final runtime bundle source mismatch for ${spec.final_runtime_bundle_id}`);
    }

    plans.push(buildMasterPackagePlan(spec, bundlePlan, root));
  }

  return plans;
}

export function writeMovieAnalysisMasterPackagePlans(projectRoot?: string): {
  plans: MovieAnalysisMasterPackagePlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedMasterPackagePlans(root);
  const outDir = path.join(root, MASTER_PACKAGE_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${MASTER_PACKAGE_PLANS_DIR}/${plan.master_package_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-master-package-registry-v1',
    phase: MASTER_PACKAGE_PHASE,
    registry_version: 'v1',
    schema_path: MASTER_PACKAGE_SCHEMA_PATH,
    final_runtime_bundle_registry_path: FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
    storage_dir: MASTER_PACKAGE_PLANS_DIR,
    master_package_plans: plans.map((plan) => ({
      master_package_id: plan.master_package_id,
      plan_path: `${MASTER_PACKAGE_PLANS_DIR}/${plan.master_package_id}.json`,
      source_video_id: plan.source_video_id,
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, MASTER_PACKAGE_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisMasterPackagePlan(
  projectRoot: string,
  masterPackageId: string
): MovieAnalysisMasterPackagePlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, MASTER_PACKAGE_PLANS_DIR, `${masterPackageId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisMasterPackagePlan;
}
