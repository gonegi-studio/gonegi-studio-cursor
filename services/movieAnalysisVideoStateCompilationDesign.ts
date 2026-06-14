import fs from 'node:fs';
import path from 'node:path';
import {
  GONEGI_STATE_MAPPING_REGISTRY_PATH,
  loadMovieAnalysisGonegiStateMappingPlan,
  type StateCategory,
  type MovieAnalysisGonegiStateMappingPlan,
} from './movieAnalysisGonegiStateMappingDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_STATE_COMPILATION_PHASE =
  'PHASE-SOURCE-VIDEO-028-MOVIE_ANALYSIS_VIDEO_STATE_COMPILATION_DESIGN_V1' as const;
export const VIDEO_STATE_COMPILATION_SCHEMA_PATH =
  'datasets/movie_analysis/video_state_compilation/movie-analysis-video-state-compilation.schema.json' as const;
export const VIDEO_STATE_COMPILATION_REGISTRY_PATH =
  'datasets/movie_analysis/video_state_compilation/movie-analysis-video-state-compilation-registry.json' as const;
export const VIDEO_STATE_COMPILATION_PLANS_DIR =
  'datasets/movie_analysis/video_state_compilation/plans' as const;

export type CompilationStrategy =
  | 'SCENE_STATE_COMPILATION_CANDIDATE'
  | 'CHARACTER_CONTINUITY_COMPILATION_CANDIDATE'
  | 'CAMERA_MOTION_COMPILATION_CANDIDATE'
  | 'RUNTIME_READINESS_COMPILATION_CANDIDATE';

export type VideoStateCategory =
  | 'scene_state'
  | 'character_continuity_state'
  | 'camera_continuity_state'
  | 'motion_intent_state'
  | 'lighting_continuity_state'
  | 'emotion_continuity_state'
  | 'environment_continuity_state'
  | 'transition_state'
  | 'runtime_readiness_state';

export type GonegiStateRef = {
  gonegi_state_id: string;
  source_coordinate_id: string;
  state_category: StateCategory;
  estimated_state_value: string;
};

export type VideoStateCandidate = {
  video_state_id: string;
  gonegi_state_id: string;
  video_state_category: VideoStateCategory;
  estimated_video_state_value: string;
  executes_video_state: false;
  creates_keyframe: false;
  creates_runtime_payload: false;
  candidate_type: 'estimated_video_state_candidate';
  estimated_only: true;
};

export type VideoStateCompilationExecutionFlags = {
  planning_only: true;
  video_state_compilation_only: true;
  state_execution: false;
  runtime_payload: false;
  gpu_execution: false;
  external_call_allowed: false;
  coordinate_extraction: false;
  frame_extraction: false;
  scene_extraction: false;
  ocr: false;
};

export type MovieAnalysisVideoStateCompilationPlan = {
  video_state_compilation_id: string;
  phase: typeof VIDEO_STATE_COMPILATION_PHASE;
  source_video_id: string;
  analysis_plan_id: string;
  dry_run_id: string;
  sampling_plan_id: string;
  scene_detection_id: string;
  coordinate_extraction_id: string;
  gonegi_state_mapping_id: string;
  video_state_candidate_count: number;
  compilation_strategy: CompilationStrategy;
  gonegi_states: GonegiStateRef[];
  video_states: VideoStateCandidate[];
  video_state_categories: VideoStateCategory[];
  identity_safety: {
    identity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_state_execution: true;
  };
  continuity_safety: {
    continuity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_keyframe_creation: true;
  };
  execution_flags: VideoStateCompilationExecutionFlags;
  designed_at: string;
};

export const ALL_VIDEO_STATE_CATEGORIES: readonly VideoStateCategory[] = [
  'scene_state',
  'character_continuity_state',
  'camera_continuity_state',
  'motion_intent_state',
  'lighting_continuity_state',
  'emotion_continuity_state',
  'environment_continuity_state',
  'transition_state',
  'runtime_readiness_state',
] as const;

export const TARGET_VIDEO_STATE_CANDIDATE_COUNTS: Record<string, number> = {
  GHIBLI_01: 12,
  SHINKAI_01: 12,
  LITTLE_WOMEN_01: 18,
  MORI_01: 12,
};

export const SEED_VIDEO_STATE_COMPILATION_SPECS = Object.freeze([
  {
    video_state_compilation_id: 'video_state_compilation_ghibli_01_v1',
    gonegi_state_mapping_id: 'gonegi_state_mapping_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    compilation_strategy: 'SCENE_STATE_COMPILATION_CANDIDATE' as const,
  },
  {
    video_state_compilation_id: 'video_state_compilation_shinkai_01_v1',
    gonegi_state_mapping_id: 'gonegi_state_mapping_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    compilation_strategy: 'RUNTIME_READINESS_COMPILATION_CANDIDATE' as const,
  },
  {
    video_state_compilation_id: 'video_state_compilation_little_women_01_v1',
    gonegi_state_mapping_id: 'gonegi_state_mapping_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    compilation_strategy: 'CHARACTER_CONTINUITY_COMPILATION_CANDIDATE' as const,
  },
  {
    video_state_compilation_id: 'video_state_compilation_mori_01_v1',
    gonegi_state_mapping_id: 'gonegi_state_mapping_mori_01_v1',
    source_video_id: 'MORI_01',
    compilation_strategy: 'CAMERA_MOTION_COMPILATION_CANDIDATE' as const,
  },
] as const);

const EXECUTION_FLAGS: VideoStateCompilationExecutionFlags = {
  planning_only: true,
  video_state_compilation_only: true,
  state_execution: false,
  runtime_payload: false,
  gpu_execution: false,
  external_call_allowed: false,
  coordinate_extraction: false,
  frame_extraction: false,
  scene_extraction: false,
  ocr: false,
};

const GONEGI_TO_VIDEO_CATEGORY: Record<StateCategory, VideoStateCategory> = {
  environment_state: 'environment_continuity_state',
  character_state: 'character_continuity_state',
  emotion_state: 'emotion_continuity_state',
  camera_state: 'camera_continuity_state',
  lighting_state: 'lighting_continuity_state',
  relationship_state: 'character_continuity_state',
  crowd_state: 'scene_state',
  animal_state: 'scene_state',
  transition_state: 'transition_state',
};

const STRATEGY_CATEGORY_PRIORITY: Record<CompilationStrategy, VideoStateCategory[]> = {
  SCENE_STATE_COMPILATION_CANDIDATE: [
    'scene_state',
    'environment_continuity_state',
    'transition_state',
    'camera_continuity_state',
    'character_continuity_state',
    'motion_intent_state',
    'lighting_continuity_state',
    'emotion_continuity_state',
    'runtime_readiness_state',
  ],
  CHARACTER_CONTINUITY_COMPILATION_CANDIDATE: [
    'character_continuity_state',
    'emotion_continuity_state',
    'scene_state',
    'environment_continuity_state',
    'camera_continuity_state',
    'motion_intent_state',
    'lighting_continuity_state',
    'transition_state',
    'runtime_readiness_state',
  ],
  CAMERA_MOTION_COMPILATION_CANDIDATE: [
    'camera_continuity_state',
    'motion_intent_state',
    'scene_state',
    'transition_state',
    'character_continuity_state',
    'lighting_continuity_state',
    'emotion_continuity_state',
    'environment_continuity_state',
    'runtime_readiness_state',
  ],
  RUNTIME_READINESS_COMPILATION_CANDIDATE: [
    'runtime_readiness_state',
    'scene_state',
    'emotion_continuity_state',
    'character_continuity_state',
    'camera_continuity_state',
    'motion_intent_state',
    'lighting_continuity_state',
    'environment_continuity_state',
    'transition_state',
  ],
};

const ESTIMATED_VIDEO_STATE_VALUES: Record<VideoStateCategory, string[]> = {
  scene_state: ['estimated_video_scene', 'estimated_video_shot', 'estimated_video_sequence'],
  character_continuity_state: [
    'estimated_video_character_continuity',
    'estimated_video_identity_lock',
    'estimated_video_character_pose',
  ],
  camera_continuity_state: [
    'estimated_video_camera_continuity',
    'estimated_video_camera_angle',
    'estimated_video_camera_framing',
  ],
  motion_intent_state: [
    'estimated_video_motion_static',
    'estimated_video_motion_pan',
    'estimated_video_motion_dolly',
  ],
  lighting_continuity_state: [
    'estimated_video_lighting_continuity',
    'estimated_video_light_soft',
    'estimated_video_light_ambient',
  ],
  emotion_continuity_state: [
    'estimated_video_emotion_continuity',
    'estimated_video_emotion_neutral',
    'estimated_video_emotion_tense',
  ],
  environment_continuity_state: [
    'estimated_video_environment_continuity',
    'estimated_video_environment_interior',
    'estimated_video_environment_exterior',
  ],
  transition_state: [
    'estimated_video_transition_cut',
    'estimated_video_transition_dissolve',
    'estimated_video_transition_match',
  ],
  runtime_readiness_state: [
    'estimated_video_runtime_ready',
    'estimated_video_runtime_pending',
    'estimated_video_runtime_stub',
  ],
};

type GonegiStateMappingRegistry = {
  mapping_plans: Array<{
    gonegi_state_mapping_id: string;
    source_video_id: string;
    analysis_plan_id: string;
    dry_run_id: string;
    sampling_plan_id: string;
    scene_detection_id: string;
    coordinate_extraction_id: string;
  }>;
};

function videoCategoryForGonegiState(
  strategy: CompilationStrategy,
  stateCategory: StateCategory,
  index: number
): VideoStateCategory {
  const defaultCategory = GONEGI_TO_VIDEO_CATEGORY[stateCategory];
  const priority = STRATEGY_CATEGORY_PRIORITY[strategy];
  if (priority.includes(defaultCategory)) {
    return defaultCategory;
  }
  return priority[index % priority.length];
}

function estimatedVideoStateValue(category: VideoStateCategory, index: number): string {
  const values = ESTIMATED_VIDEO_STATE_VALUES[category];
  return values[index % values.length];
}

function buildGonegiStateRefs(
  mappingPlan: MovieAnalysisGonegiStateMappingPlan
): GonegiStateRef[] {
  return mappingPlan.gonegi_states.map((state) => ({
    gonegi_state_id: state.state_id,
    source_coordinate_id: state.source_coordinate_id,
    state_category: state.state_category,
    estimated_state_value: state.estimated_state_value,
  }));
}

function buildVideoStates(
  compilationId: string,
  strategy: CompilationStrategy,
  gonegiStateRefs: GonegiStateRef[]
): VideoStateCandidate[] {
  return gonegiStateRefs.map((gonegiState, index) => {
    const category = videoCategoryForGonegiState(strategy, gonegiState.state_category, index);
    return {
      video_state_id: `${compilationId}_vs_${String(index + 1).padStart(3, '0')}`,
      gonegi_state_id: gonegiState.gonegi_state_id,
      video_state_category: category,
      estimated_video_state_value: estimatedVideoStateValue(category, index),
      executes_video_state: false,
      creates_keyframe: false,
      creates_runtime_payload: false,
      candidate_type: 'estimated_video_state_candidate',
      estimated_only: true,
    };
  });
}

function buildVideoStateCompilationPlan(
  spec: (typeof SEED_VIDEO_STATE_COMPILATION_SPECS)[number],
  mappingPlan: MovieAnalysisGonegiStateMappingPlan
): MovieAnalysisVideoStateCompilationPlan {
  const targetCount = TARGET_VIDEO_STATE_CANDIDATE_COUNTS[spec.source_video_id];
  if (!targetCount) {
    throw new Error(`No target video state candidate count for ${spec.source_video_id}`);
  }

  if (mappingPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Gonegi state mapping source mismatch for ${spec.gonegi_state_mapping_id}`);
  }

  const gonegiStateRefs = buildGonegiStateRefs(mappingPlan);
  const videoStates = buildVideoStates(
    spec.video_state_compilation_id,
    spec.compilation_strategy,
    gonegiStateRefs
  );

  if (videoStates.length !== targetCount) {
    throw new Error(
      `Video state candidate count mismatch for ${spec.video_state_compilation_id}: expected ${targetCount}, got ${videoStates.length}`
    );
  }

  return {
    video_state_compilation_id: spec.video_state_compilation_id,
    phase: VIDEO_STATE_COMPILATION_PHASE,
    source_video_id: mappingPlan.source_video_id,
    analysis_plan_id: mappingPlan.analysis_plan_id,
    dry_run_id: mappingPlan.dry_run_id,
    sampling_plan_id: mappingPlan.sampling_plan_id,
    scene_detection_id: mappingPlan.scene_detection_id,
    coordinate_extraction_id: mappingPlan.coordinate_extraction_id,
    gonegi_state_mapping_id: mappingPlan.gonegi_state_mapping_id,
    video_state_candidate_count: targetCount,
    compilation_strategy: spec.compilation_strategy,
    gonegi_states: gonegiStateRefs,
    video_states: videoStates,
    video_state_categories: [...ALL_VIDEO_STATE_CATEGORIES],
    identity_safety: {
      identity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_state_execution: true,
    },
    continuity_safety: {
      continuity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_keyframe_creation: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

function loadGonegiStateMappingRegistry(projectRoot: string): GonegiStateMappingRegistry | null {
  const abs = path.join(projectRoot, GONEGI_STATE_MAPPING_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GonegiStateMappingRegistry;
}

export function buildSeedVideoStateCompilationPlans(
  projectRoot?: string
): MovieAnalysisVideoStateCompilationPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const mappingRegistry = loadGonegiStateMappingRegistry(root);
  if (!mappingRegistry) {
    throw new Error(`Missing gonegi state mapping registry: ${GONEGI_STATE_MAPPING_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisVideoStateCompilationPlan[] = [];

  for (const spec of SEED_VIDEO_STATE_COMPILATION_SPECS) {
    const registryEntry = mappingRegistry.mapping_plans.find(
      (p) => p.gonegi_state_mapping_id === spec.gonegi_state_mapping_id
    );
    if (!registryEntry) {
      throw new Error(`Gonegi state mapping plan not in registry: ${spec.gonegi_state_mapping_id}`);
    }

    const mappingPlan = loadMovieAnalysisGonegiStateMappingPlan(root, spec.gonegi_state_mapping_id);
    if (!mappingPlan) {
      throw new Error(`Missing gonegi state mapping plan: ${spec.gonegi_state_mapping_id}`);
    }

    if (mappingPlan.dry_run_id !== registryEntry.dry_run_id) {
      throw new Error(`Gonegi state mapping dry_run mismatch for ${spec.gonegi_state_mapping_id}`);
    }

    plans.push(buildVideoStateCompilationPlan(spec, mappingPlan));
  }

  return plans;
}

export function writeMovieAnalysisVideoStateCompilationPlans(projectRoot?: string): {
  plans: MovieAnalysisVideoStateCompilationPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedVideoStateCompilationPlans(root);
  const outDir = path.join(root, VIDEO_STATE_COMPILATION_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${VIDEO_STATE_COMPILATION_PLANS_DIR}/${plan.video_state_compilation_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-video-state-compilation-registry-v1',
    phase: VIDEO_STATE_COMPILATION_PHASE,
    registry_version: 'v1',
    schema_path: VIDEO_STATE_COMPILATION_SCHEMA_PATH,
    gonegi_state_mapping_registry_path: GONEGI_STATE_MAPPING_REGISTRY_PATH,
    storage_dir: VIDEO_STATE_COMPILATION_PLANS_DIR,
    video_state_compilation_plans: plans.map((plan) => ({
      video_state_compilation_id: plan.video_state_compilation_id,
      plan_path: `${VIDEO_STATE_COMPILATION_PLANS_DIR}/${plan.video_state_compilation_id}.json`,
      source_video_id: plan.source_video_id,
      analysis_plan_id: plan.analysis_plan_id,
      dry_run_id: plan.dry_run_id,
      sampling_plan_id: plan.sampling_plan_id,
      scene_detection_id: plan.scene_detection_id,
      coordinate_extraction_id: plan.coordinate_extraction_id,
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      compilation_strategy: plan.compilation_strategy,
      video_state_candidate_count: plan.video_state_candidate_count,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, VIDEO_STATE_COMPILATION_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisVideoStateCompilationPlan(
  projectRoot: string,
  videoStateCompilationId: string
): MovieAnalysisVideoStateCompilationPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, VIDEO_STATE_COMPILATION_PLANS_DIR, `${videoStateCompilationId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoStateCompilationPlan;
}
