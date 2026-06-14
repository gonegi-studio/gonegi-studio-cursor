import fs from 'node:fs';
import path from 'node:path';
import {
  MOTION_PLANNING_REGISTRY_PATH,
  loadMovieAnalysisMotionPlanningPlan,
  type MotionCategory,
  type MovieAnalysisMotionPlanningPlan,
} from './movieAnalysisMotionPlanningDesign.js';
import { SEED_SEGMENT_SPECS } from './sourceVideoSceneSegmentBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TEMPORAL_FLOW_PHASE =
  'PHASE-SOURCE-VIDEO-031-MOVIE_ANALYSIS_TEMPORAL_FLOW_DESIGN_V1' as const;
export const TEMPORAL_FLOW_SCHEMA_PATH =
  'datasets/movie_analysis/temporal_flow/movie-analysis-temporal-flow.schema.json' as const;
export const TEMPORAL_FLOW_REGISTRY_PATH =
  'datasets/movie_analysis/temporal_flow/movie-analysis-temporal-flow-registry.json' as const;
export const TEMPORAL_FLOW_PLANS_DIR =
  'datasets/movie_analysis/temporal_flow/plans' as const;

export type FlowStrategy =
  | 'SEQUENCE_FLOW_PLAN'
  | 'EMOTION_TIMELINE_PLAN'
  | 'CAMERA_CONTINUITY_PLAN'
  | 'TRANSITION_CHAIN_PLAN';

export type FlowCategory =
  | 'sequence_flow'
  | 'emotion_flow'
  | 'camera_flow'
  | 'character_flow'
  | 'environment_flow'
  | 'crowd_flow'
  | 'animal_flow'
  | 'transition_flow'
  | 'continuity_flow';

export type TemporalCandidate = {
  temporal_candidate_id: string;
  motion_candidate_id: string;
  flow_category: FlowCategory;
  estimated_flow_value: string;
  generates_sequence: false;
  generates_video: false;
  generates_motion: false;
  candidate_type: 'estimated_temporal_candidate';
  estimated_only: true;
};

export type TemporalFlowExecutionFlags = {
  planning_only: true;
  temporal_flow_only: true;
  sequence_generation: false;
  video_generation: false;
  motion_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisTemporalFlowPlan = {
  temporal_flow_id: string;
  phase: typeof TEMPORAL_FLOW_PHASE;
  source_video_id: string;
  motion_plan_id: string;
  temporal_candidate_count: number;
  flow_strategy: FlowStrategy;
  temporal_candidates: TemporalCandidate[];
  flow_categories: FlowCategory[];
  coverage_goal: {
    segment_span_seconds: number;
    coverage_percent: number;
    purpose: 'future_sequence_generation_preparation';
  };
  identity_safety: {
    identity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_sequence_generation: true;
  };
  execution_flags: TemporalFlowExecutionFlags;
  designed_at: string;
};

export const ALL_FLOW_CATEGORIES: readonly FlowCategory[] = [
  'sequence_flow',
  'emotion_flow',
  'camera_flow',
  'character_flow',
  'environment_flow',
  'crowd_flow',
  'animal_flow',
  'transition_flow',
  'continuity_flow',
] as const;

export const TARGET_TEMPORAL_CANDIDATE_COUNTS: Record<string, number> = {
  GHIBLI_01: 12,
  SHINKAI_01: 12,
  LITTLE_WOMEN_01: 18,
  MORI_01: 12,
};

export const SEED_TEMPORAL_FLOW_SPECS = Object.freeze([
  {
    temporal_flow_id: 'temporal_flow_ghibli_01_v1',
    motion_plan_id: 'motion_plan_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    flow_strategy: 'CAMERA_CONTINUITY_PLAN' as const,
  },
  {
    temporal_flow_id: 'temporal_flow_shinkai_01_v1',
    motion_plan_id: 'motion_plan_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    flow_strategy: 'EMOTION_TIMELINE_PLAN' as const,
  },
  {
    temporal_flow_id: 'temporal_flow_little_women_01_v1',
    motion_plan_id: 'motion_plan_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    flow_strategy: 'SEQUENCE_FLOW_PLAN' as const,
  },
  {
    temporal_flow_id: 'temporal_flow_mori_01_v1',
    motion_plan_id: 'motion_plan_mori_01_v1',
    source_video_id: 'MORI_01',
    flow_strategy: 'TRANSITION_CHAIN_PLAN' as const,
  },
] as const);

const EXECUTION_FLAGS: TemporalFlowExecutionFlags = {
  planning_only: true,
  temporal_flow_only: true,
  sequence_generation: false,
  video_generation: false,
  motion_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

const MOTION_TO_FLOW: Record<MotionCategory, FlowCategory> = {
  camera_motion: 'camera_flow',
  character_motion: 'character_flow',
  crowd_motion: 'crowd_flow',
  animal_motion: 'animal_flow',
  environment_motion: 'environment_flow',
  emotion_flow: 'emotion_flow',
  transition_flow: 'transition_flow',
  timing_flow: 'sequence_flow',
  continuity_flow: 'continuity_flow',
};

const STRATEGY_CATEGORY_PRIORITY: Record<FlowStrategy, FlowCategory[]> = {
  SEQUENCE_FLOW_PLAN: [
    'sequence_flow',
    'continuity_flow',
    'character_flow',
    'emotion_flow',
    'camera_flow',
    'environment_flow',
    'transition_flow',
    'crowd_flow',
    'animal_flow',
  ],
  EMOTION_TIMELINE_PLAN: [
    'emotion_flow',
    'sequence_flow',
    'continuity_flow',
    'character_flow',
    'camera_flow',
    'environment_flow',
    'transition_flow',
    'crowd_flow',
    'animal_flow',
  ],
  CAMERA_CONTINUITY_PLAN: [
    'camera_flow',
    'continuity_flow',
    'sequence_flow',
    'transition_flow',
    'character_flow',
    'emotion_flow',
    'environment_flow',
    'crowd_flow',
    'animal_flow',
  ],
  TRANSITION_CHAIN_PLAN: [
    'transition_flow',
    'sequence_flow',
    'continuity_flow',
    'camera_flow',
    'character_flow',
    'emotion_flow',
    'environment_flow',
    'crowd_flow',
    'animal_flow',
  ],
};

const ESTIMATED_FLOW_VALUES: Record<FlowCategory, string[]> = {
  sequence_flow: ['estimated_flow_sequence_open', 'estimated_flow_sequence_mid', 'estimated_flow_sequence_close'],
  emotion_flow: ['estimated_flow_emotion_rise', 'estimated_flow_emotion_hold', 'estimated_flow_emotion_release'],
  camera_flow: ['estimated_flow_camera_continuity', 'estimated_flow_camera_bridge', 'estimated_flow_camera_hold'],
  character_flow: ['estimated_flow_character_continuity', 'estimated_flow_character_arc', 'estimated_flow_character_bridge'],
  environment_flow: ['estimated_flow_environment_hold', 'estimated_flow_environment_shift', 'estimated_flow_environment_bridge'],
  crowd_flow: ['estimated_flow_crowd_sparse', 'estimated_flow_crowd_dense', 'estimated_flow_crowd_absent'],
  animal_flow: ['estimated_flow_animal_present', 'estimated_flow_animal_move', 'estimated_flow_animal_absent'],
  transition_flow: ['estimated_flow_transition_cut', 'estimated_flow_transition_dissolve', 'estimated_flow_transition_match'],
  continuity_flow: ['estimated_flow_continuity_lock', 'estimated_flow_continuity_bridge', 'estimated_flow_continuity_hold'],
};

type MotionPlanningRegistry = {
  motion_plans: Array<{
    motion_plan_id: string;
    source_video_id: string;
  }>;
};

function flowCategoryForMotion(
  strategy: FlowStrategy,
  motionCategory: MotionCategory,
  index: number
): FlowCategory {
  const defaultCategory = MOTION_TO_FLOW[motionCategory];
  const priority = STRATEGY_CATEGORY_PRIORITY[strategy];
  if (priority.includes(defaultCategory)) {
    return defaultCategory;
  }
  return priority[index % priority.length];
}

function estimatedFlowValue(category: FlowCategory, index: number): string {
  const values = ESTIMATED_FLOW_VALUES[category];
  return values[index % values.length];
}

function segmentSpan(sourceVideoId: string): number {
  const segment = SEED_SEGMENT_SPECS.find((s) => s.source_video_id === sourceVideoId);
  if (!segment) {
    throw new Error(`No segment spec for source video: ${sourceVideoId}`);
  }
  return Math.round((segment.timestamp_end - segment.timestamp_start) * 100) / 100;
}

function buildTemporalCandidates(
  temporalFlowId: string,
  strategy: FlowStrategy,
  motionPlan: MovieAnalysisMotionPlanningPlan
): TemporalCandidate[] {
  return motionPlan.motion_candidates.map((motion, index) => {
    const category = flowCategoryForMotion(strategy, motion.motion_category, index);
    return {
      temporal_candidate_id: `${temporalFlowId}_tf_${String(index + 1).padStart(3, '0')}`,
      motion_candidate_id: motion.motion_candidate_id,
      flow_category: category,
      estimated_flow_value: estimatedFlowValue(category, index),
      generates_sequence: false,
      generates_video: false,
      generates_motion: false,
      candidate_type: 'estimated_temporal_candidate',
      estimated_only: true,
    };
  });
}

function buildTemporalFlowPlan(
  spec: (typeof SEED_TEMPORAL_FLOW_SPECS)[number],
  motionPlan: MovieAnalysisMotionPlanningPlan
): MovieAnalysisTemporalFlowPlan {
  const targetCount = TARGET_TEMPORAL_CANDIDATE_COUNTS[spec.source_video_id];
  if (!targetCount) {
    throw new Error(`No target temporal candidate count for ${spec.source_video_id}`);
  }

  if (motionPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Motion plan source mismatch for ${spec.motion_plan_id}`);
  }

  const temporalCandidates = buildTemporalCandidates(
    spec.temporal_flow_id,
    spec.flow_strategy,
    motionPlan
  );

  if (temporalCandidates.length !== targetCount) {
    throw new Error(
      `Temporal candidate count mismatch for ${spec.temporal_flow_id}: expected ${targetCount}, got ${temporalCandidates.length}`
    );
  }

  return {
    temporal_flow_id: spec.temporal_flow_id,
    phase: TEMPORAL_FLOW_PHASE,
    source_video_id: motionPlan.source_video_id,
    motion_plan_id: motionPlan.motion_plan_id,
    temporal_candidate_count: targetCount,
    flow_strategy: spec.flow_strategy,
    temporal_candidates: temporalCandidates,
    flow_categories: [...ALL_FLOW_CATEGORIES],
    coverage_goal: {
      segment_span_seconds: segmentSpan(motionPlan.source_video_id),
      coverage_percent: 100,
      purpose: 'future_sequence_generation_preparation',
    },
    identity_safety: {
      identity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_sequence_generation: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

function loadMotionPlanningRegistry(projectRoot: string): MotionPlanningRegistry | null {
  const abs = path.join(projectRoot, MOTION_PLANNING_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MotionPlanningRegistry;
}

export function buildSeedTemporalFlowPlans(
  projectRoot?: string
): MovieAnalysisTemporalFlowPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const motionRegistry = loadMotionPlanningRegistry(root);
  if (!motionRegistry) {
    throw new Error(`Missing motion planning registry: ${MOTION_PLANNING_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisTemporalFlowPlan[] = [];

  for (const spec of SEED_TEMPORAL_FLOW_SPECS) {
    const registryEntry = motionRegistry.motion_plans.find(
      (p) => p.motion_plan_id === spec.motion_plan_id
    );
    if (!registryEntry) {
      throw new Error(`Motion plan not in registry: ${spec.motion_plan_id}`);
    }

    const motionPlan = loadMovieAnalysisMotionPlanningPlan(root, spec.motion_plan_id);
    if (!motionPlan) {
      throw new Error(`Missing motion planning plan: ${spec.motion_plan_id}`);
    }

    if (motionPlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Motion plan source mismatch for ${spec.motion_plan_id}`);
    }

    plans.push(buildTemporalFlowPlan(spec, motionPlan));
  }

  return plans;
}

export function writeMovieAnalysisTemporalFlowPlans(projectRoot?: string): {
  plans: MovieAnalysisTemporalFlowPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedTemporalFlowPlans(root);
  const outDir = path.join(root, TEMPORAL_FLOW_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${TEMPORAL_FLOW_PLANS_DIR}/${plan.temporal_flow_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-temporal-flow-registry-v1',
    phase: TEMPORAL_FLOW_PHASE,
    registry_version: 'v1',
    schema_path: TEMPORAL_FLOW_SCHEMA_PATH,
    motion_planning_registry_path: MOTION_PLANNING_REGISTRY_PATH,
    storage_dir: TEMPORAL_FLOW_PLANS_DIR,
    temporal_flow_plans: plans.map((plan) => ({
      temporal_flow_id: plan.temporal_flow_id,
      plan_path: `${TEMPORAL_FLOW_PLANS_DIR}/${plan.temporal_flow_id}.json`,
      source_video_id: plan.source_video_id,
      motion_plan_id: plan.motion_plan_id,
      flow_strategy: plan.flow_strategy,
      temporal_candidate_count: plan.temporal_candidate_count,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, TEMPORAL_FLOW_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisTemporalFlowPlan(
  projectRoot: string,
  temporalFlowId: string
): MovieAnalysisTemporalFlowPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, TEMPORAL_FLOW_PLANS_DIR, `${temporalFlowId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisTemporalFlowPlan;
}
