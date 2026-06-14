import fs from 'node:fs';
import path from 'node:path';
import {
  VIDEO_STATE_COMPILATION_REGISTRY_PATH,
  loadMovieAnalysisVideoStateCompilationPlan,
  type VideoStateCategory,
  type MovieAnalysisVideoStateCompilationPlan,
} from './movieAnalysisVideoStateCompilationDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const KEYFRAME_PREPARATION_PHASE =
  'PHASE-SOURCE-VIDEO-029-MOVIE_ANALYSIS_KEYFRAME_PREPARATION_DESIGN_V1' as const;
export const KEYFRAME_PREPARATION_SCHEMA_PATH =
  'datasets/movie_analysis/keyframe_preparation/movie-analysis-keyframe-preparation.schema.json' as const;
export const KEYFRAME_PREPARATION_REGISTRY_PATH =
  'datasets/movie_analysis/keyframe_preparation/movie-analysis-keyframe-preparation-registry.json' as const;
export const KEYFRAME_PREPARATION_PLANS_DIR =
  'datasets/movie_analysis/keyframe_preparation/plans' as const;

export type PreparationStrategy =
  | 'SCENE_ANCHOR_KEYFRAME_CANDIDATE'
  | 'CHARACTER_IDENTITY_KEYFRAME_CANDIDATE'
  | 'EMOTION_BLOCKING_KEYFRAME_CANDIDATE'
  | 'MOTION_BRIDGE_KEYFRAME_CANDIDATE';

export type KeyframeRole =
  | 'establishing_keyframe'
  | 'character_identity_keyframe'
  | 'emotion_keyframe'
  | 'blocking_keyframe'
  | 'camera_anchor_keyframe'
  | 'lighting_anchor_keyframe'
  | 'transition_keyframe'
  | 'motion_start_keyframe'
  | 'motion_end_keyframe';

export type VideoStateRef = {
  video_state_id: string;
  gonegi_state_id: string;
  video_state_category: VideoStateCategory;
  estimated_video_state_value: string;
};

export type KeyframeCandidate = {
  keyframe_candidate_id: string;
  video_state_id: string;
  keyframe_role: KeyframeRole;
  estimated_keyframe_value: string;
  generates_keyframe: false;
  generates_image: false;
  creates_runtime_payload: false;
  candidate_type: 'estimated_keyframe_candidate';
  estimated_only: true;
};

export type KeyframePreparationExecutionFlags = {
  planning_only: true;
  keyframe_preparation_only: true;
  keyframe_generation: false;
  image_generation: false;
  state_execution: false;
  runtime_payload: false;
  gpu_execution: false;
  external_call_allowed: false;
  coordinate_extraction: false;
  frame_extraction: false;
  scene_extraction: false;
  ocr: false;
};

export type MovieAnalysisKeyframePreparationPlan = {
  keyframe_preparation_id: string;
  phase: typeof KEYFRAME_PREPARATION_PHASE;
  source_video_id: string;
  analysis_plan_id: string;
  dry_run_id: string;
  sampling_plan_id: string;
  scene_detection_id: string;
  coordinate_extraction_id: string;
  gonegi_state_mapping_id: string;
  video_state_compilation_id: string;
  keyframe_candidate_count: number;
  preparation_strategy: PreparationStrategy;
  video_states: VideoStateRef[];
  keyframe_candidates: KeyframeCandidate[];
  keyframe_roles: KeyframeRole[];
  identity_safety: {
    identity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_image_generation: true;
  };
  continuity_safety: {
    continuity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_keyframe_generation: true;
  };
  execution_flags: KeyframePreparationExecutionFlags;
  designed_at: string;
};

export const ALL_KEYFRAME_ROLES: readonly KeyframeRole[] = [
  'establishing_keyframe',
  'character_identity_keyframe',
  'emotion_keyframe',
  'blocking_keyframe',
  'camera_anchor_keyframe',
  'lighting_anchor_keyframe',
  'transition_keyframe',
  'motion_start_keyframe',
  'motion_end_keyframe',
] as const;

export const TARGET_KEYFRAME_CANDIDATE_COUNTS: Record<string, number> = {
  GHIBLI_01: 12,
  SHINKAI_01: 12,
  LITTLE_WOMEN_01: 18,
  MORI_01: 12,
};

export const SEED_KEYFRAME_PREPARATION_SPECS = Object.freeze([
  {
    keyframe_preparation_id: 'keyframe_preparation_ghibli_01_v1',
    video_state_compilation_id: 'video_state_compilation_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    preparation_strategy: 'SCENE_ANCHOR_KEYFRAME_CANDIDATE' as const,
  },
  {
    keyframe_preparation_id: 'keyframe_preparation_shinkai_01_v1',
    video_state_compilation_id: 'video_state_compilation_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    preparation_strategy: 'EMOTION_BLOCKING_KEYFRAME_CANDIDATE' as const,
  },
  {
    keyframe_preparation_id: 'keyframe_preparation_little_women_01_v1',
    video_state_compilation_id: 'video_state_compilation_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    preparation_strategy: 'CHARACTER_IDENTITY_KEYFRAME_CANDIDATE' as const,
  },
  {
    keyframe_preparation_id: 'keyframe_preparation_mori_01_v1',
    video_state_compilation_id: 'video_state_compilation_mori_01_v1',
    source_video_id: 'MORI_01',
    preparation_strategy: 'MOTION_BRIDGE_KEYFRAME_CANDIDATE' as const,
  },
] as const);

const EXECUTION_FLAGS: KeyframePreparationExecutionFlags = {
  planning_only: true,
  keyframe_preparation_only: true,
  keyframe_generation: false,
  image_generation: false,
  state_execution: false,
  runtime_payload: false,
  gpu_execution: false,
  external_call_allowed: false,
  coordinate_extraction: false,
  frame_extraction: false,
  scene_extraction: false,
  ocr: false,
};

const VIDEO_TO_KEYFRAME_ROLE: Record<VideoStateCategory, KeyframeRole> = {
  scene_state: 'establishing_keyframe',
  character_continuity_state: 'character_identity_keyframe',
  emotion_continuity_state: 'emotion_keyframe',
  camera_continuity_state: 'camera_anchor_keyframe',
  motion_intent_state: 'motion_start_keyframe',
  lighting_continuity_state: 'lighting_anchor_keyframe',
  environment_continuity_state: 'establishing_keyframe',
  transition_state: 'transition_keyframe',
  runtime_readiness_state: 'motion_end_keyframe',
};

const STRATEGY_ROLE_PRIORITY: Record<PreparationStrategy, KeyframeRole[]> = {
  SCENE_ANCHOR_KEYFRAME_CANDIDATE: [
    'establishing_keyframe',
    'camera_anchor_keyframe',
    'lighting_anchor_keyframe',
    'transition_keyframe',
    'blocking_keyframe',
    'character_identity_keyframe',
    'emotion_keyframe',
    'motion_start_keyframe',
    'motion_end_keyframe',
  ],
  CHARACTER_IDENTITY_KEYFRAME_CANDIDATE: [
    'character_identity_keyframe',
    'blocking_keyframe',
    'emotion_keyframe',
    'establishing_keyframe',
    'camera_anchor_keyframe',
    'lighting_anchor_keyframe',
    'transition_keyframe',
    'motion_start_keyframe',
    'motion_end_keyframe',
  ],
  EMOTION_BLOCKING_KEYFRAME_CANDIDATE: [
    'emotion_keyframe',
    'blocking_keyframe',
    'character_identity_keyframe',
    'establishing_keyframe',
    'camera_anchor_keyframe',
    'lighting_anchor_keyframe',
    'transition_keyframe',
    'motion_start_keyframe',
    'motion_end_keyframe',
  ],
  MOTION_BRIDGE_KEYFRAME_CANDIDATE: [
    'motion_start_keyframe',
    'motion_end_keyframe',
    'transition_keyframe',
    'camera_anchor_keyframe',
    'establishing_keyframe',
    'character_identity_keyframe',
    'emotion_keyframe',
    'blocking_keyframe',
    'lighting_anchor_keyframe',
  ],
};

const ESTIMATED_KEYFRAME_VALUES: Record<KeyframeRole, string[]> = {
  establishing_keyframe: [
    'estimated_keyframe_establishing',
    'estimated_keyframe_scene_open',
    'estimated_keyframe_wide_anchor',
  ],
  character_identity_keyframe: [
    'estimated_keyframe_character_identity',
    'estimated_keyframe_character_lock',
    'estimated_keyframe_character_pose',
  ],
  emotion_keyframe: [
    'estimated_keyframe_emotion_neutral',
    'estimated_keyframe_emotion_tense',
    'estimated_keyframe_emotion_warm',
  ],
  blocking_keyframe: [
    'estimated_keyframe_blocking_pair',
    'estimated_keyframe_blocking_group',
    'estimated_keyframe_blocking_solo',
  ],
  camera_anchor_keyframe: [
    'estimated_keyframe_camera_anchor',
    'estimated_keyframe_camera_framing',
    'estimated_keyframe_camera_angle',
  ],
  lighting_anchor_keyframe: [
    'estimated_keyframe_lighting_soft',
    'estimated_keyframe_lighting_hard',
    'estimated_keyframe_lighting_ambient',
  ],
  transition_keyframe: [
    'estimated_keyframe_transition_cut',
    'estimated_keyframe_transition_dissolve',
    'estimated_keyframe_transition_match',
  ],
  motion_start_keyframe: [
    'estimated_keyframe_motion_start',
    'estimated_keyframe_motion_onset',
    'estimated_keyframe_motion_entry',
  ],
  motion_end_keyframe: [
    'estimated_keyframe_motion_end',
    'estimated_keyframe_motion_settle',
    'estimated_keyframe_motion_exit',
  ],
};

type VideoStateCompilationRegistry = {
  video_state_compilation_plans: Array<{
    video_state_compilation_id: string;
    source_video_id: string;
    analysis_plan_id: string;
    dry_run_id: string;
    sampling_plan_id: string;
    scene_detection_id: string;
    coordinate_extraction_id: string;
    gonegi_state_mapping_id: string;
  }>;
};

function keyframeRoleForVideoState(
  strategy: PreparationStrategy,
  category: VideoStateCategory,
  index: number
): KeyframeRole {
  const defaultRole = VIDEO_TO_KEYFRAME_ROLE[category];
  const priority = STRATEGY_ROLE_PRIORITY[strategy];
  if (priority.includes(defaultRole)) {
    return defaultRole;
  }
  return priority[index % priority.length];
}

function estimatedKeyframeValue(role: KeyframeRole, index: number): string {
  const values = ESTIMATED_KEYFRAME_VALUES[role];
  return values[index % values.length];
}

function buildVideoStateRefs(
  compilationPlan: MovieAnalysisVideoStateCompilationPlan
): VideoStateRef[] {
  return compilationPlan.video_states.map((state) => ({
    video_state_id: state.video_state_id,
    gonegi_state_id: state.gonegi_state_id,
    video_state_category: state.video_state_category,
    estimated_video_state_value: state.estimated_video_state_value,
  }));
}

function buildKeyframeCandidates(
  preparationId: string,
  strategy: PreparationStrategy,
  videoStateRefs: VideoStateRef[]
): KeyframeCandidate[] {
  return videoStateRefs.map((videoState, index) => {
    const role = keyframeRoleForVideoState(strategy, videoState.video_state_category, index);
    return {
      keyframe_candidate_id: `${preparationId}_kf_${String(index + 1).padStart(3, '0')}`,
      video_state_id: videoState.video_state_id,
      keyframe_role: role,
      estimated_keyframe_value: estimatedKeyframeValue(role, index),
      generates_keyframe: false,
      generates_image: false,
      creates_runtime_payload: false,
      candidate_type: 'estimated_keyframe_candidate',
      estimated_only: true,
    };
  });
}

function buildKeyframePreparationPlan(
  spec: (typeof SEED_KEYFRAME_PREPARATION_SPECS)[number],
  compilationPlan: MovieAnalysisVideoStateCompilationPlan
): MovieAnalysisKeyframePreparationPlan {
  const targetCount = TARGET_KEYFRAME_CANDIDATE_COUNTS[spec.source_video_id];
  if (!targetCount) {
    throw new Error(`No target keyframe candidate count for ${spec.source_video_id}`);
  }

  if (compilationPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Video state compilation source mismatch for ${spec.video_state_compilation_id}`);
  }

  const videoStateRefs = buildVideoStateRefs(compilationPlan);
  const keyframeCandidates = buildKeyframeCandidates(
    spec.keyframe_preparation_id,
    spec.preparation_strategy,
    videoStateRefs
  );

  if (keyframeCandidates.length !== targetCount) {
    throw new Error(
      `Keyframe candidate count mismatch for ${spec.keyframe_preparation_id}: expected ${targetCount}, got ${keyframeCandidates.length}`
    );
  }

  return {
    keyframe_preparation_id: spec.keyframe_preparation_id,
    phase: KEYFRAME_PREPARATION_PHASE,
    source_video_id: compilationPlan.source_video_id,
    analysis_plan_id: compilationPlan.analysis_plan_id,
    dry_run_id: compilationPlan.dry_run_id,
    sampling_plan_id: compilationPlan.sampling_plan_id,
    scene_detection_id: compilationPlan.scene_detection_id,
    coordinate_extraction_id: compilationPlan.coordinate_extraction_id,
    gonegi_state_mapping_id: compilationPlan.gonegi_state_mapping_id,
    video_state_compilation_id: compilationPlan.video_state_compilation_id,
    keyframe_candidate_count: targetCount,
    preparation_strategy: spec.preparation_strategy,
    video_states: videoStateRefs,
    keyframe_candidates: keyframeCandidates,
    keyframe_roles: [...ALL_KEYFRAME_ROLES],
    identity_safety: {
      identity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_image_generation: true,
    },
    continuity_safety: {
      continuity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_keyframe_generation: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

function loadVideoStateCompilationRegistry(
  projectRoot: string
): VideoStateCompilationRegistry | null {
  const abs = path.join(projectRoot, VIDEO_STATE_COMPILATION_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as VideoStateCompilationRegistry;
}

export function buildSeedKeyframePreparationPlans(
  projectRoot?: string
): MovieAnalysisKeyframePreparationPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const compilationRegistry = loadVideoStateCompilationRegistry(root);
  if (!compilationRegistry) {
    throw new Error(`Missing video state compilation registry: ${VIDEO_STATE_COMPILATION_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisKeyframePreparationPlan[] = [];

  for (const spec of SEED_KEYFRAME_PREPARATION_SPECS) {
    const registryEntry = compilationRegistry.video_state_compilation_plans.find(
      (p) => p.video_state_compilation_id === spec.video_state_compilation_id
    );
    if (!registryEntry) {
      throw new Error(`Video state compilation plan not in registry: ${spec.video_state_compilation_id}`);
    }

    const compilationPlan = loadMovieAnalysisVideoStateCompilationPlan(
      root,
      spec.video_state_compilation_id
    );
    if (!compilationPlan) {
      throw new Error(`Missing video state compilation plan: ${spec.video_state_compilation_id}`);
    }

    if (compilationPlan.dry_run_id !== registryEntry.dry_run_id) {
      throw new Error(`Video state compilation dry_run mismatch for ${spec.video_state_compilation_id}`);
    }

    plans.push(buildKeyframePreparationPlan(spec, compilationPlan));
  }

  return plans;
}

export function writeMovieAnalysisKeyframePreparationPlans(projectRoot?: string): {
  plans: MovieAnalysisKeyframePreparationPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedKeyframePreparationPlans(root);
  const outDir = path.join(root, KEYFRAME_PREPARATION_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${KEYFRAME_PREPARATION_PLANS_DIR}/${plan.keyframe_preparation_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-keyframe-preparation-registry-v1',
    phase: KEYFRAME_PREPARATION_PHASE,
    registry_version: 'v1',
    schema_path: KEYFRAME_PREPARATION_SCHEMA_PATH,
    video_state_compilation_registry_path: VIDEO_STATE_COMPILATION_REGISTRY_PATH,
    storage_dir: KEYFRAME_PREPARATION_PLANS_DIR,
    keyframe_preparation_plans: plans.map((plan) => ({
      keyframe_preparation_id: plan.keyframe_preparation_id,
      plan_path: `${KEYFRAME_PREPARATION_PLANS_DIR}/${plan.keyframe_preparation_id}.json`,
      source_video_id: plan.source_video_id,
      analysis_plan_id: plan.analysis_plan_id,
      dry_run_id: plan.dry_run_id,
      sampling_plan_id: plan.sampling_plan_id,
      scene_detection_id: plan.scene_detection_id,
      coordinate_extraction_id: plan.coordinate_extraction_id,
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      video_state_compilation_id: plan.video_state_compilation_id,
      preparation_strategy: plan.preparation_strategy,
      keyframe_candidate_count: plan.keyframe_candidate_count,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, KEYFRAME_PREPARATION_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisKeyframePreparationPlan(
  projectRoot: string,
  keyframePreparationId: string
): MovieAnalysisKeyframePreparationPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, KEYFRAME_PREPARATION_PLANS_DIR, `${keyframePreparationId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisKeyframePreparationPlan;
}
