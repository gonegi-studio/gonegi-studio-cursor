import fs from 'node:fs';
import path from 'node:path';
import {
  KEYFRAME_PREPARATION_REGISTRY_PATH,
  loadMovieAnalysisKeyframePreparationPlan,
  type KeyframeRole,
  type MovieAnalysisKeyframePreparationPlan,
} from './movieAnalysisKeyframePreparationDesign.js';
import { SEED_SEGMENT_SPECS } from './sourceVideoSceneSegmentBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOTION_PLANNING_PHASE =
  'PHASE-SOURCE-VIDEO-030-MOVIE_ANALYSIS_MOTION_PLANNING_DESIGN_V1' as const;
export const MOTION_PLANNING_SCHEMA_PATH =
  'datasets/movie_analysis/motion_planning/movie-analysis-motion-planning.schema.json' as const;
export const MOTION_PLANNING_REGISTRY_PATH =
  'datasets/movie_analysis/motion_planning/movie-analysis-motion-planning-registry.json' as const;
export const MOTION_PLANNING_PLANS_DIR =
  'datasets/movie_analysis/motion_planning/plans' as const;

export type PlanningStrategy =
  | 'CAMERA_MOTION_PLAN'
  | 'CHARACTER_MOTION_PLAN'
  | 'EMOTION_FLOW_PLAN'
  | 'TRANSITION_FLOW_PLAN';

export type MotionCategory =
  | 'camera_motion'
  | 'character_motion'
  | 'crowd_motion'
  | 'animal_motion'
  | 'environment_motion'
  | 'emotion_flow'
  | 'transition_flow'
  | 'timing_flow'
  | 'continuity_flow';

export type MotionCandidate = {
  motion_candidate_id: string;
  keyframe_candidate_id: string;
  motion_category: MotionCategory;
  estimated_motion_value: string;
  generates_motion: false;
  generates_video: false;
  generates_keyframe: false;
  candidate_type: 'estimated_motion_candidate';
  estimated_only: true;
};

export type MotionPlanningExecutionFlags = {
  planning_only: true;
  motion_planning_only: true;
  motion_generation: false;
  video_generation: false;
  keyframe_generation: false;
  ocr: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisMotionPlanningPlan = {
  motion_plan_id: string;
  phase: typeof MOTION_PLANNING_PHASE;
  source_video_id: string;
  keyframe_preparation_id: string;
  motion_candidate_count: number;
  planning_strategy: PlanningStrategy;
  motion_candidates: MotionCandidate[];
  motion_categories: MotionCategory[];
  coverage_goal: {
    segment_span_seconds: number;
    coverage_percent: number;
    purpose: 'future_video_generation_preparation';
  };
  identity_safety: {
    identity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_motion_generation: true;
  };
  execution_flags: MotionPlanningExecutionFlags;
  designed_at: string;
};

export const ALL_MOTION_CATEGORIES: readonly MotionCategory[] = [
  'camera_motion',
  'character_motion',
  'crowd_motion',
  'animal_motion',
  'environment_motion',
  'emotion_flow',
  'transition_flow',
  'timing_flow',
  'continuity_flow',
] as const;

export const TARGET_MOTION_CANDIDATE_COUNTS: Record<string, number> = {
  GHIBLI_01: 12,
  SHINKAI_01: 12,
  LITTLE_WOMEN_01: 18,
  MORI_01: 12,
};

export const SEED_MOTION_PLANNING_SPECS = Object.freeze([
  {
    motion_plan_id: 'motion_plan_ghibli_01_v1',
    keyframe_preparation_id: 'keyframe_preparation_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    planning_strategy: 'CAMERA_MOTION_PLAN' as const,
  },
  {
    motion_plan_id: 'motion_plan_shinkai_01_v1',
    keyframe_preparation_id: 'keyframe_preparation_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    planning_strategy: 'EMOTION_FLOW_PLAN' as const,
  },
  {
    motion_plan_id: 'motion_plan_little_women_01_v1',
    keyframe_preparation_id: 'keyframe_preparation_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    planning_strategy: 'CHARACTER_MOTION_PLAN' as const,
  },
  {
    motion_plan_id: 'motion_plan_mori_01_v1',
    keyframe_preparation_id: 'keyframe_preparation_mori_01_v1',
    source_video_id: 'MORI_01',
    planning_strategy: 'TRANSITION_FLOW_PLAN' as const,
  },
] as const);

const EXECUTION_FLAGS: MotionPlanningExecutionFlags = {
  planning_only: true,
  motion_planning_only: true,
  motion_generation: false,
  video_generation: false,
  keyframe_generation: false,
  ocr: false,
  gpu_execution: false,
  external_call_allowed: false,
};

const KEYFRAME_TO_MOTION: Record<KeyframeRole, MotionCategory> = {
  establishing_keyframe: 'environment_motion',
  character_identity_keyframe: 'character_motion',
  emotion_keyframe: 'emotion_flow',
  blocking_keyframe: 'character_motion',
  camera_anchor_keyframe: 'camera_motion',
  lighting_anchor_keyframe: 'environment_motion',
  transition_keyframe: 'transition_flow',
  motion_start_keyframe: 'timing_flow',
  motion_end_keyframe: 'continuity_flow',
};

const STRATEGY_CATEGORY_PRIORITY: Record<PlanningStrategy, MotionCategory[]> = {
  CAMERA_MOTION_PLAN: [
    'camera_motion',
    'timing_flow',
    'continuity_flow',
    'transition_flow',
    'environment_motion',
    'character_motion',
    'emotion_flow',
    'crowd_motion',
    'animal_motion',
  ],
  CHARACTER_MOTION_PLAN: [
    'character_motion',
    'emotion_flow',
    'continuity_flow',
    'timing_flow',
    'camera_motion',
    'environment_motion',
    'transition_flow',
    'crowd_motion',
    'animal_motion',
  ],
  EMOTION_FLOW_PLAN: [
    'emotion_flow',
    'character_motion',
    'continuity_flow',
    'timing_flow',
    'transition_flow',
    'camera_motion',
    'environment_motion',
    'crowd_motion',
    'animal_motion',
  ],
  TRANSITION_FLOW_PLAN: [
    'transition_flow',
    'timing_flow',
    'continuity_flow',
    'camera_motion',
    'character_motion',
    'emotion_flow',
    'environment_motion',
    'crowd_motion',
    'animal_motion',
  ],
};

const ESTIMATED_MOTION_VALUES: Record<MotionCategory, string[]> = {
  camera_motion: ['estimated_motion_camera_pan', 'estimated_motion_camera_dolly', 'estimated_motion_camera_static'],
  character_motion: ['estimated_motion_character_walk', 'estimated_motion_character_turn', 'estimated_motion_character_idle'],
  crowd_motion: ['estimated_motion_crowd_sparse', 'estimated_motion_crowd_dense', 'estimated_motion_crowd_absent'],
  animal_motion: ['estimated_motion_animal_present', 'estimated_motion_animal_move', 'estimated_motion_animal_absent'],
  environment_motion: ['estimated_motion_environment_wind', 'estimated_motion_environment_ambient', 'estimated_motion_environment_still'],
  emotion_flow: ['estimated_motion_emotion_rise', 'estimated_motion_emotion_hold', 'estimated_motion_emotion_release'],
  transition_flow: ['estimated_motion_transition_cut', 'estimated_motion_transition_dissolve', 'estimated_motion_transition_match'],
  timing_flow: ['estimated_motion_timing_onset', 'estimated_motion_timing_peak', 'estimated_motion_timing_settle'],
  continuity_flow: ['estimated_motion_continuity_lock', 'estimated_motion_continuity_bridge', 'estimated_motion_continuity_hold'],
};

type KeyframePreparationRegistry = {
  keyframe_preparation_plans: Array<{
    keyframe_preparation_id: string;
    source_video_id: string;
  }>;
};

function motionCategoryForKeyframe(
  strategy: PlanningStrategy,
  keyframeRole: KeyframeRole,
  index: number
): MotionCategory {
  const defaultCategory = KEYFRAME_TO_MOTION[keyframeRole];
  const priority = STRATEGY_CATEGORY_PRIORITY[strategy];
  if (priority.includes(defaultCategory)) {
    return defaultCategory;
  }
  return priority[index % priority.length];
}

function estimatedMotionValue(category: MotionCategory, index: number): string {
  const values = ESTIMATED_MOTION_VALUES[category];
  return values[index % values.length];
}

function buildMotionCandidates(
  motionPlanId: string,
  strategy: PlanningStrategy,
  keyframePlan: MovieAnalysisKeyframePreparationPlan
): MotionCandidate[] {
  return keyframePlan.keyframe_candidates.map((keyframe, index) => {
    const category = motionCategoryForKeyframe(strategy, keyframe.keyframe_role, index);
    return {
      motion_candidate_id: `${motionPlanId}_mc_${String(index + 1).padStart(3, '0')}`,
      keyframe_candidate_id: keyframe.keyframe_candidate_id,
      motion_category: category,
      estimated_motion_value: estimatedMotionValue(category, index),
      generates_motion: false,
      generates_video: false,
      generates_keyframe: false,
      candidate_type: 'estimated_motion_candidate',
      estimated_only: true,
    };
  });
}

function segmentSpan(sourceVideoId: string): number {
  const segment = SEED_SEGMENT_SPECS.find((s) => s.source_video_id === sourceVideoId);
  if (!segment) {
    throw new Error(`No segment spec for source video: ${sourceVideoId}`);
  }
  return Math.round((segment.timestamp_end - segment.timestamp_start) * 100) / 100;
}

function buildMotionPlanningPlan(
  spec: (typeof SEED_MOTION_PLANNING_SPECS)[number],
  keyframePlan: MovieAnalysisKeyframePreparationPlan
): MovieAnalysisMotionPlanningPlan {
  const targetCount = TARGET_MOTION_CANDIDATE_COUNTS[spec.source_video_id];
  if (!targetCount) {
    throw new Error(`No target motion candidate count for ${spec.source_video_id}`);
  }

  if (keyframePlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Keyframe preparation source mismatch for ${spec.keyframe_preparation_id}`);
  }

  const motionCandidates = buildMotionCandidates(
    spec.motion_plan_id,
    spec.planning_strategy,
    keyframePlan
  );

  if (motionCandidates.length !== targetCount) {
    throw new Error(
      `Motion candidate count mismatch for ${spec.motion_plan_id}: expected ${targetCount}, got ${motionCandidates.length}`
    );
  }

  return {
    motion_plan_id: spec.motion_plan_id,
    phase: MOTION_PLANNING_PHASE,
    source_video_id: keyframePlan.source_video_id,
    keyframe_preparation_id: keyframePlan.keyframe_preparation_id,
    motion_candidate_count: targetCount,
    planning_strategy: spec.planning_strategy,
    motion_candidates: motionCandidates,
    motion_categories: [...ALL_MOTION_CATEGORIES],
    coverage_goal: {
      segment_span_seconds: segmentSpan(keyframePlan.source_video_id),
      coverage_percent: 100,
      purpose: 'future_video_generation_preparation',
    },
    identity_safety: {
      identity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_motion_generation: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

function loadKeyframePreparationRegistry(projectRoot: string): KeyframePreparationRegistry | null {
  const abs = path.join(projectRoot, KEYFRAME_PREPARATION_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as KeyframePreparationRegistry;
}

export function buildSeedMotionPlanningPlans(
  projectRoot?: string
): MovieAnalysisMotionPlanningPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const keyframeRegistry = loadKeyframePreparationRegistry(root);
  if (!keyframeRegistry) {
    throw new Error(`Missing keyframe preparation registry: ${KEYFRAME_PREPARATION_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisMotionPlanningPlan[] = [];

  for (const spec of SEED_MOTION_PLANNING_SPECS) {
    const registryEntry = keyframeRegistry.keyframe_preparation_plans.find(
      (p) => p.keyframe_preparation_id === spec.keyframe_preparation_id
    );
    if (!registryEntry) {
      throw new Error(`Keyframe preparation plan not in registry: ${spec.keyframe_preparation_id}`);
    }

    const keyframePlan = loadMovieAnalysisKeyframePreparationPlan(root, spec.keyframe_preparation_id);
    if (!keyframePlan) {
      throw new Error(`Missing keyframe preparation plan: ${spec.keyframe_preparation_id}`);
    }

    if (keyframePlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Keyframe preparation source mismatch for ${spec.keyframe_preparation_id}`);
    }

    plans.push(buildMotionPlanningPlan(spec, keyframePlan));
  }

  return plans;
}

export function writeMovieAnalysisMotionPlanningPlans(projectRoot?: string): {
  plans: MovieAnalysisMotionPlanningPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedMotionPlanningPlans(root);
  const outDir = path.join(root, MOTION_PLANNING_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${MOTION_PLANNING_PLANS_DIR}/${plan.motion_plan_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-motion-planning-registry-v1',
    phase: MOTION_PLANNING_PHASE,
    registry_version: 'v1',
    schema_path: MOTION_PLANNING_SCHEMA_PATH,
    keyframe_preparation_registry_path: KEYFRAME_PREPARATION_REGISTRY_PATH,
    storage_dir: MOTION_PLANNING_PLANS_DIR,
    motion_plans: plans.map((plan) => ({
      motion_plan_id: plan.motion_plan_id,
      plan_path: `${MOTION_PLANNING_PLANS_DIR}/${plan.motion_plan_id}.json`,
      source_video_id: plan.source_video_id,
      keyframe_preparation_id: plan.keyframe_preparation_id,
      planning_strategy: plan.planning_strategy,
      motion_candidate_count: plan.motion_candidate_count,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, MOTION_PLANNING_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisMotionPlanningPlan(
  projectRoot: string,
  motionPlanId: string
): MovieAnalysisMotionPlanningPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, MOTION_PLANNING_PLANS_DIR, `${motionPlanId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisMotionPlanningPlan;
}
